// DIFESE DEL SITO contro chi prova a manometterlo o a buttarlo giù.
// - intestazioni HTTP di sicurezza (niente iframe di altri siti, script solo da qui, niente "sniffing" dei tipi)
// - limite di richieste HTTP per indirizzo
// - pulizia di tutto quello che arriva dai socket (niente __proto__, dimensioni massime, profondità massima)
// - limite di messaggi al secondo per ogni connessione, e disconnessione di chi esagera di continuo
// - limite di connessioni e di tavoli per indirizzo, e di tavoli in totale
// - nomi ripuliti da caratteri che potrebbero diventare HTML
// Nessuna libreria esterna: tutto qui, così funziona anche senza installare niente in più.

const CHIAVI_VIETATE = new Set(['__proto__', 'constructor', 'prototype']);

// copia "sicura" di un dato arrivato dal browser: limita profondità, lunghezze e numero di elementi
function pulisciDato(x, prof = 0) {
  if (x === null || x === undefined) return undefined;
  if (typeof x === 'string') return x.length > 4000 ? x.slice(0, 4000) : x;
  if (typeof x === 'number') return Number.isFinite(x) ? x : 0;
  if (typeof x === 'boolean') return x;
  if (typeof x !== 'object' || prof > 6) return undefined;
  if (Array.isArray(x)) return x.slice(0, 600).map((v) => pulisciDato(v, prof + 1));
  const out = {};
  let n = 0;
  for (const k of Object.keys(x)) {
    if (CHIAVI_VIETATE.has(k) || ++n > 80) continue;
    out[k.slice(0, 64)] = pulisciDato(x[k], prof + 1);
  }
  return out;
}

// nome del giocatore: niente caratteri di controllo né simboli che servono all'HTML
function pulisciNome(n) {
  return String(n || '').replace(/[\u0000-\u001f\u007f<>&"'`\\]/g, '').replace(/[\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g, '').trim().replace(/\s+/g, ' ').slice(0, 18) || 'Giocatore';
}
const pulisciId = (id) => String(id || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 64);

// secchiello di gettoni: "quanti" eventi al secondo con una scorta "massimo"
class Secchiello {
  constructor(alSecondo, massimo) { this.v = alSecondo; this.max = massimo; this.gettoni = massimo; this.t = Date.now(); }
  prendi(costo = 1) {
    const ora = Date.now();
    this.gettoni = Math.min(this.max, this.gettoni + ((ora - this.t) / 1000) * this.v);
    this.t = ora;
    if (this.gettoni < costo) return false;
    this.gettoni -= costo;
    return true;
  }
}

// indirizzo del visitatore (su Render arriva dal proxy in x-forwarded-for)
function ipDi(req) {
  const xf = req.headers && req.headers['x-forwarded-for'];
  return String(xf ? xf.split(',')[0] : (req.socket && req.socket.remoteAddress) || req.address || '?').trim();
}

const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob:",
  "connect-src 'self' ws: wss:",
  "media-src 'self' data: blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

// intestazioni HTTP e limite di richieste per indirizzo (largo: una classe intera può avere lo stesso indirizzo)
function difeseHttp(app, { richiesteAlMinuto = 6000 } = {}) {
  app.disable('x-powered-by');
  const secchi = new Map();
  setInterval(() => { const ora = Date.now(); for (const [k, s] of secchi) if (ora - s.t > 120000) secchi.delete(k); }, 60000).unref();
  app.use((req, res, next) => {
    const ip = ipDi(req);
    let s = secchi.get(ip);
    if (!s) { s = new Secchiello(richiesteAlMinuto / 60, richiesteAlMinuto / 2); secchi.set(ip, s); }
    if (!s.prendi()) { res.statusCode = 429; return res.end('Troppe richieste: riprova tra poco'); }
    res.setHeader('Content-Security-Policy', CSP);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    if (req.headers['x-forwarded-proto'] === 'https') res.setHeader('Strict-Transport-Security', 'max-age=15552000');
    next();
  });
}

// limiti per ogni tipo di evento del socket: [al secondo, scorta]
const LIMITI_EVENTI = {
  input: [60, 120], // tempo reale (disegno, mouse, tiri)
  cursore: [30, 60],
  chat: [1, 5], // 5 messaggi di fila, poi uno al secondo
  chatGlobale: [0.5, 4], // chat di tutto il sito: 4 di fila, poi uno ogni 2 secondi
  creaStanza: [0.2, 4],
  entraStanza: [0.5, 6], // niente tentativi a raffica di indovinare i codici dei tavoli
  predefinito: [15, 40],
};

// avvolge socket.on: pulisce i dati, applica i limiti e non lascia mai cadere il server per un errore
function proteggiSocket(socket, { quandoLimitato, quandoErrore } = {}) {
  const secchi = {};
  let sforamenti = 0, dal = Date.now();
  const onOriginale = socket.on.bind(socket);
  socket.on = (evento, gestore) => {
    if (evento === 'disconnect' || evento === 'disconnecting' || evento === 'error') return onOriginale(evento, gestore);
    return onOriginale(evento, (...args) => {
      const [v, max] = LIMITI_EVENTI[evento] || LIMITI_EVENTI.predefinito;
      const s = secchi[evento] || (secchi[evento] = new Secchiello(v, max));
      if (!s.prendi()) {
        // chi esagera di continuo (più di 200 eventi rifiutati in un minuto) viene disconnesso
        if (Date.now() - dal > 60000) { dal = Date.now(); sforamenti = 0; }
        if (++sforamenti > 200) { socket.disconnect(true); return; }
        if (quandoLimitato && sforamenti % 20 === 1) quandoLimitato(evento);
        return;
      }
      const dati = args.filter((a) => typeof a !== 'function').map((a) => pulisciDato(a));
      try { gestore(...dati); } catch (e) {
        console.warn(`[sicurezza] evento "${evento}" non valido: ${e && e.message}`);
        if (quandoErrore) quandoErrore(evento, e);
      }
    });
  };
}

module.exports = { pulisciDato, pulisciNome, pulisciId, Secchiello, ipDi, difeseHttp, proteggiSocket, CSP, LIMITI_EVENTI };
