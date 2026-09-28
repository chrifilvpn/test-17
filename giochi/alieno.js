// CHI È L'ALIENO: un equipaggio di astronauti su una base spaziale; uno o più di loro sono Alieni che si sono presi un
// corpo umano e non si distinguono dagli altri. L'equipaggio vince finendo i compiti o espellendo tutti gli Alieni;
// gli Alieni vincono quando sono tanti quanti gli umani vivi. Solo persone (niente computer), da 4 a 10.
// Mappa a tile (40 px), stanze collegate da corridoi che si diramano, con due scorciatoie. Ognuno vede solo intorno
// a sé e i muri fermano lo sguardo: il server manda a ognuno solo quello che vede.
const { Arena } = require('./arena');
const T = 40, COLS = 65, RIGHE = 42, MW = COLS * T, MH = RIGHE * T; // mondo 2600 × 1680
const W = 1000, H = 620;            // quello che si vede sullo schermo (la telecamera segue il tuo astronauta)
const R = 14, V = 175, V_FANTASMA = 210, VISTA = 290;
const RAGGIO_UCCIDI = 75, RAGGIO_SEGNALA = 110, RAGGIO_COMPITO = 70, RAGGIO_PULSANTE = 90;
const DISCUSSIONE = 30, VOTO = 120, ESPULSIONE = 6, ATTESA_PULSANTE = 15, RIUNIONI_A_TESTA = 1;
const MIN_SEMPLICE = 2, MIN_COMPLESSO = 5, COMPITI = { semplici: 3, complessi: 2 };
const ASSENTE_MAX = 60; // chi è fuori da più di 60 s: i suoi compiti non contano più (la partita non si blocca)
const cooldown = (n) => (n >= 7 ? 20 : 25);

// ---------------- la base ----------------
const STANZE = [
  { id: 'serra', nome: 'Serra', r: [5, 3, 13, 9] },
  { id: 'plancia', nome: 'Plancia', r: [26, 2, 14, 8] },
  { id: 'comunicazioni', nome: 'Comunicazioni', r: [47, 3, 11, 8] },
  { id: 'laboratorio', nome: 'Laboratorio', r: [3, 17, 11, 10] },
  { id: 'sala', nome: 'Sala comune', r: [27, 16, 12, 10] },
  { id: 'infermeria', nome: 'Infermeria', r: [50, 16, 11, 10] },
  { id: 'mensa', nome: 'Mensa', r: [18, 27, 9, 6] },
  { id: 'motori', nome: 'Motori', r: [3, 32, 12, 9] },
  { id: 'reattore', nome: 'Reattore', r: [27, 32, 13, 8] },
  { id: 'magazzino', nome: 'Magazzino', r: [48, 31, 13, 9] },
];
const CORRIDOI = [
  [18, 5, 8, 3], [40, 5, 7, 3], [31, 10, 3, 6], [9, 12, 3, 5], [14, 20, 13, 3], [39, 20, 11, 3], [52, 11, 3, 5],
  [7, 27, 3, 5], [15, 35, 12, 3], [40, 35, 8, 3], [54, 26, 3, 5], [32, 26, 3, 6], [21, 23, 3, 4], [21, 33, 3, 2],
  // scorciatoie (condotti stretti)
  [16, 11, 12, 2], [27, 12, 2, 4], [39, 24, 9, 2], [46, 26, 2, 5],
];
// mobili che non si attraversano (ma si vede sopra): [x, y, w, h, tipo]
const MOBILI = [
  [32, 20, 2, 2, 'tavolo-pulsante'],
  [10, 6, 2, 2, 'aiuola'], [13, 6, 2, 2, 'aiuola'], [7, 8, 2, 2, 'aiuola'],
  [30, 3, 6, 1, 'console'], [47, 6, 2, 3, 'antenna'],
  [5, 21, 3, 1, 'bancone'], [9, 21, 3, 1, 'bancone'],
  [53, 18, 1, 2, 'letto'], [56, 18, 1, 2, 'letto'], [59, 18, 1, 2, 'letto'],
  [20, 29, 2, 1, 'tavolino'], [23, 29, 2, 1, 'tavolino'],
  [4, 36, 2, 3, 'motore'], [8, 36, 2, 3, 'motore'],
  [32, 35, 3, 2, 'nucleo'],
  [51, 35, 2, 2, 'cassa'], [54, 36, 1, 1, 'cassa'], [55, 33, 2, 1, 'cassa'], [58, 35, 2, 2, 'cassa'],
];
const STAZIONI = [
  { id: 1, stanza: 'serra', t: [7, 4], tipo: 'tempismo', nome: 'Calibra le lampade' },
  { id: 2, stanza: 'serra', t: [16, 10], tipo: 'carica', nome: 'Irriga le piante' },
  { id: 3, stanza: 'plancia', t: [28, 4], tipo: 'interruttori', nome: 'Accendi i sistemi di rotta' },
  { id: 4, stanza: 'plancia', t: [38, 4], tipo: 'sequenza', nome: 'Imposta la rotta' },
  { id: 5, stanza: 'comunicazioni', t: [50, 4], tipo: 'fili', nome: 'Ripara l\'antenna' },
  { id: 6, stanza: 'comunicazioni', t: [56, 9], tipo: 'numeri', nome: 'Decifra il segnale' },
  { id: 7, stanza: 'laboratorio', t: [4, 18], tipo: 'sequenza', nome: 'Analizza i campioni' },
  { id: 8, stanza: 'laboratorio', t: [12, 25], tipo: 'tempismo', nome: 'Avvia la centrifuga' },
  { id: 9, stanza: 'sala', t: [28, 17], tipo: 'interruttori', nome: 'Luci della sala' },
  { id: 10, stanza: 'infermeria', t: [51, 17], tipo: 'carica', nome: 'Carica il defibrillatore' },
  { id: 11, stanza: 'infermeria', t: [59, 24], tipo: 'numeri', nome: 'Controlla le cartelle' },
  { id: 12, stanza: 'mensa', t: [19, 31], tipo: 'tempismo', nome: 'Scalda i pasti' },
  { id: 13, stanza: 'motori', t: [5, 33], tipo: 'fili', nome: 'Collega i motori' },
  { id: 14, stanza: 'motori', t: [13, 39], tipo: 'carica', nome: 'Rifornisci il carburante' },
  { id: 15, stanza: 'reattore', t: [28, 33], tipo: 'numeri', nome: 'Codice del reattore' },
  { id: 16, stanza: 'reattore', t: [38, 38], tipo: 'sequenza', nome: 'Stabilizza il nucleo' },
  { id: 17, stanza: 'magazzino', t: [49, 32], tipo: 'interruttori', nome: 'Smista le casse' },
  { id: 18, stanza: 'magazzino', t: [59, 38], tipo: 'fili', nome: 'Riattiva il montacarichi' },
];
const SEMPLICI = ['tempismo', 'interruttori', 'carica'];
const MAPPA = (() => {
  const g = Array.from({ length: RIGHE }, () => new Array(COLS).fill('#'));
  const scava = ([x, y, w, h], ch = '.') => { for (let r = y; r < y + h; r++) for (let c = x; c < x + w; c++) if (r > 0 && c > 0 && r < RIGHE - 1 && c < COLS - 1) g[r][c] = ch; };
  for (const s of STANZE) scava(s.r);
  for (const c of CORRIDOI) scava(c);
  for (const m of MOBILI) scava(m, 'M');
  return g.map((r) => r.join(''));
})();
const PULSANTE = { x: 33 * T, y: 21 * T };
const centro = (t) => ({ x: t[0] * T + T / 2, y: t[1] * T + T / 2 });
const stanzaDi = (x, y) => { const c = x / T, r = y / T; const s = STANZE.find((q) => c >= q.r[0] && c < q.r[0] + q.r[2] && r >= q.r[1] && r < q.r[1] + q.r[3]); return s ? s.nome : 'Corridoio'; };
const mescola = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
function maxAlieni(n) { return n >= 9 ? 3 : n >= 7 ? 2 : 1; }

class Alieno extends Arena {
  constructor(o) {
    super(o, { id: 'alieno', round: 1, tickMs: 50 });
    this.nRound = 1;
    this.W = W; this.H = H;
    const voluti = [1, 2, 3].includes(Number(o.opzioni && o.opzioni.alieni)) ? Number(o.opzioni.alieni) : 1;
    this.nAlieni = Math.min(voluti, maxAlieni(o.n));
    this.chatSistema = [];
    if (this.nAlieni < voluti) this.chatSistema.push(`👽 Con ${o.n} giocatori gli Alieni possono essere al massimo ${this.nAlieni}: si gioca con ${this.nAlieni}.`);
    this.uscitoDa = new Array(o.n).fill(null);
    this.avvia();
  }
  cella(x, y) { const c = Math.floor(x / T), r = Math.floor(y / T); return r < 0 || c < 0 || r >= RIGHE || c >= COLS ? '#' : MAPPA[r][c]; }
  solido(x, y) { const k = this.cella(x, y); return k === '#' || k === 'M'; }
  vede(a, b, raggio = VISTA) {
    const d = Math.hypot(b.x - a.x, b.y - a.y); if (d > raggio) return false;
    const n = Math.ceil(d / 10);
    for (let k = 1; k < n; k++) if (this.cella(a.x + ((b.x - a.x) * k) / n, a.y + ((b.y - a.y) * k) / n) === '#') return false;
    return true;
  }
  partenze() { return Array.from({ length: this.n }, (_, i) => { const a = (i / this.n) * Math.PI * 2; return { x: PULSANTE.x + Math.cos(a) * 125, y: PULSANTE.y + Math.sin(a) * 110 }; }); }
  iniziaRound() {
    const alieni = new Set(mescola([...Array(this.n).keys()]).slice(0, this.nAlieni));
    const pos = this.partenze();
    this.e = Array.from({ length: this.n }, (_, i) => {
      const semplici = mescola(STAZIONI.filter((s) => SEMPLICI.includes(s.tipo))).slice(0, COMPITI.semplici);
      const complessi = mescola(STAZIONI.filter((s) => !SEMPLICI.includes(s.tipo))).slice(0, COMPITI.complessi);
      return {
        id: i, x: pos[i].x, y: pos[i].y, dir: 1, passo: 0, vivo: true, alieno: alieni.has(i), riunioni: RIUNIONI_A_TESTA,
        compiti: mescola([...semplici, ...complessi]).map((s) => ({ id: s.id, fatto: false })), compito: null, prontoUccidi: 10,
      };
    });
    this.corpi = [];
    this.fase2 = 'libero';
    this.riunione = null; this.espulsione = null; this.vittoria = null;
    this.pulsanteDa = ATTESA_PULSANTE;
    this.annuncia(null, `🚀 Si parte! A bordo ${this.nAlieni === 1 ? 'c\'è 1 Alieno' : `ci sono ${this.nAlieni} Alieni`}`, `🚀 Si parte! A bordo ${this.nAlieni === 1 ? 'c\'è 1 Alieno' : `ci sono ${this.nAlieni} Alieni`}`, true);
  }
  esce(p) { super.esce(p); if (this.uscitoDa[p] === null) this.uscitoDa[p] = this.tempoRound || 0; }
  rientra(p) { super.rientra(p); this.uscitoDa[p] = null; }
  pensa() { return {}; } // nessun computer: chi è fuori resta fermo
  // ---- compiti ----
  conta(p) { const e = this.e[p]; return !e.alieno && !(this.uscitoDa[p] !== null && this.tempoRound - this.uscitoDa[p] > ASSENTE_MAX); }
  progresso() {
    let fatti = 0, tot = 0;
    for (const e of this.e) if (this.conta(e.id)) for (const c of e.compiti) { tot++; if (c.fatto) fatti++; }
    return tot ? fatti / tot : 1;
  }
  vivi() { return this.e.filter((e) => e.vivo); }
  controllaVittoria() {
    if (this.vittoria) return true;
    const alieniVivi = this.vivi().filter((e) => e.alieno).length, umaniVivi = this.vivi().filter((e) => !e.alieno).length;
    if (alieniVivi === 0) this.vittoria = { chi: 'equipaggio', perche: 'Tutti gli Alieni sono stati espulsi' };
    else if (alieniVivi >= umaniVivi) this.vittoria = { chi: 'alieni', perche: 'Gli Alieni sono tanti quanti gli umani rimasti' };
    else if (this.progresso() >= 1) this.vittoria = { chi: 'equipaggio', perche: 'L\'equipaggio ha finito tutti i compiti' };
    if (this.vittoria) {
      this.fase2 = 'fine'; this.fineVittoria = this.tempoRound; this.cambiato = true;
      this.annuncia(null, `${this.vittoria.chi === 'alieni' ? '👽 Vincono gli ALIENI' : '🧑‍🚀 Vince l\'EQUIPAGGIO'}: ${this.vittoria.perche}`, `${this.vittoria.chi === 'alieni' ? '👽 Vincono gli ALIENI' : '🧑‍🚀 Vince l\'EQUIPAGGIO'}`, true);
    }
    return !!this.vittoria;
  }
  // ---- movimento ----
  muovi(e, i, dt) {
    const l = Math.hypot(i.x, i.y); if (l < 0.05) { e.passo = 0; return; }
    const k = Math.min(1, l), v = e.vivo ? V : V_FANTASMA;
    const mx = (i.x / l) * k * v * dt, my = (i.y / l) * k * v * dt;
    if (Math.abs(mx) > 0.01) e.dir = Math.sign(mx);
    if (!e.vivo) { e.x = Math.max(T, Math.min(MW - T, e.x + mx)); e.y = Math.max(T, Math.min(MH - T, e.y + my)); e.passo += dt; return; } // i fantasmi passano i muri
    const nx = e.x + mx; if (![-R, R * 0.5].some((o) => this.solido(nx + Math.sign(mx) * R, e.y + o))) e.x = nx;
    const ny = e.y + my; if (![-R * 0.8, R * 0.8].some((o) => this.solido(e.x + o, ny + (my > 0 ? R * 0.6 : -R * 0.4)))) e.y = ny;
    e.passo += dt;
  }
  passo(dt) {
    const t = this.tempoRound;
    if (this.fase2 === 'fine') return t - this.fineVittoria > 1;
    if (this.fase2 === 'libero') {
      for (let p = 0; p < this.n; p++) {
        const e = this.e[p];
        e.prontoUccidi = Math.max(0, e.prontoUccidi - dt);
        if (e.compito) { e.passo = 0; continue; } // mentre fai un compito sei fermo
        this.muovi(e, this.inp[p], dt);
      }
      this.pulsanteDa = Math.max(0, this.pulsanteDa - dt);
    } else if (this.fase2 === 'discussione' && t >= this.riunione.fine) { this.riunione.fase = 'voto'; this.fase2 = 'voto'; this.riunione.fine = t + VOTO; this.cambiato = true; }
    else if (this.fase2 === 'voto' && (t >= this.riunione.fine || this.vivi().every((e) => this.riunione.voti[e.id] !== undefined || this.bot[e.id]))) this.chiudiVoto();
    else if (this.fase2 === 'espulsione' && t >= this.espulsione.fine) {
      this.fase2 = 'libero'; this.espulsione = null; this.cambiato = true;
      if (this.controllaVittoria()) return false;
    }
    if (this.fase2 === 'libero' && this.controllaVittoria()) return false;
    return false;
  }
  // ---- riunioni ----
  apriRiunione(tipo, da, corpo) {
    const t = this.tempoRound;
    this.fase2 = 'discussione';
    this.riunione = { tipo, da, corpo, fase: 'discussione', fine: t + DISCUSSIONE, voti: {}, n: (this.riunione ? this.riunione.n : 0) + 1 };
    for (const e of this.e) e.compito = null;
    this.cambiato = true;
    this.annuncia(da, tipo === 'corpo' ? `ha trovato il corpo di @! Riunione d'emergenza 📣` : 'ha chiamato una riunione d\'emergenza 🚨', tipo === 'corpo' ? 'hai segnalato un corpo: riunione! 📣' : 'hai chiamato una riunione 🚨', true, corpo !== undefined ? { bersaglio: corpo, testoTe: 'hanno trovato il tuo corpo' } : {});
  }
  chiudiVoto() {
    const conta = {};
    for (const [chi, v] of Object.entries(this.riunione.voti)) if (this.e[chi].vivo) conta[v] = (conta[v] || 0) + 1;
    const max = Math.max(0, ...Object.values(conta));
    const primi = Object.keys(conta).filter((k) => conta[k] === max);
    // pareggio (o maggioranza per "nessuno"): non si espelle nessuno
    const espulso = max > 0 && primi.length === 1 && primi[0] !== '-1' ? Number(primi[0]) : null;
    const t = this.tempoRound;
    let alieno = null;
    if (espulso !== null) { const e = this.e[espulso]; e.vivo = false; e.espulso = true; alieno = e.alieno; }
    const rimasti = this.e.filter((e) => e.vivo && e.alieno).length;
    this.espulsione = { chi: espulso, alieno, rimasti, fine: t + ESPULSIONE, conta, pari: primi.length > 1 && max > 0 };
    this.riunione.fase = 'fine'; this.riunione.esito = { conta, espulso };
    this.fase2 = 'espulsione'; this.cambiato = true;
    // tutti di nuovo intorno al tavolo; i corpi si portano via; attese ripartono
    const pos = this.partenze();
    for (const e of this.e) { if (e.vivo) { e.x = pos[e.id].x; e.y = pos[e.id].y; } e.compito = null; e.prontoUccidi = Math.max(e.prontoUccidi, 12); }
    this.corpi = [];
    this.pulsanteDa = ATTESA_PULSANTE;
    this.annuncia(espulso, espulso === null ? 'Nessuno è stato espulso' : alieno ? 'è stato espulso nello spazio: ERA un Alieno! 👽' : 'è stato espulso nello spazio… e NON era un Alieno 😢', espulso === null ? 'Nessuno è stato espulso' : 'sei stato espulso nello spazio', true);
    this.chatSistema.push(espulso === null ? `🗳️ Nessuno espulso${primi.length > 1 && max > 0 ? ' (pareggio)' : ''}. Alieni rimasti: ${rimasti}` : `🗳️ @${espulso} è stato espulso: ${alieno ? 'ERA un Alieno' : 'NON era un Alieno'}. Alieni rimasti: ${rimasti}`);
  }
  // ---- azioni (pulsanti e tasti) ----
  azione(p, a) {
    if (this.finita || this.fase !== 'gioco') return { errore: 'Aspetta un attimo' };
    const e = this.e[p], t = this.tempoRound;
    if (!a || typeof a.tipo !== 'string') return { errore: 'Azione non valida' };
    if (a.tipo === 'vota') {
      if (this.fase2 !== 'voto') return { errore: 'Adesso non si vota' };
      if (!e.vivo) return { errore: 'I fantasmi non votano' };
      if (this.riunione.voti[p] !== undefined) return { errore: 'Hai già votato' };
      const chi = Number(a.chi);
      if (chi !== -1 && !(this.e[chi] && this.e[chi].vivo)) return { errore: 'Non puoi votare per lui' };
      this.riunione.voti[p] = chi; this.cambiato = true;
      return { ok: true };
    }
    if (this.fase2 !== 'libero') return { errore: 'Durante la riunione nessuno si muove' };
    if (a.tipo === 'uccidi') {
      if (!e.vivo || !e.alieno) return { errore: 'Non puoi' };
      if (e.prontoUccidi > 0) return { errore: `Devi aspettare ancora ${Math.ceil(e.prontoUccidi)} secondi` };
      let bers = null, dm = RAGGIO_UCCIDI;
      for (const o of this.e) if (o.vivo && !o.alieno && Math.hypot(o.x - e.x, o.y - e.y) < dm && this.vede(e, o)) { dm = Math.hypot(o.x - e.x, o.y - e.y); bers = o; }
      if (!bers) return { errore: 'Nessuno abbastanza vicino' };
      bers.vivo = false; bers.compito = null;
      this.corpi.push({ di: bers.id, x: bers.x, y: bers.y, t });
      e.prontoUccidi = cooldown(this.n);
      this.cambiato = true;
      // niente annuncio: gli altri non devono sapere che qualcuno è stato eliminato (lo scopre chi trova il corpo)
      this.controllaVittoria();
      return { ok: true };
    }
    if (a.tipo === 'segnala') {
      if (!e.vivo) return { errore: 'I fantasmi non possono segnalare' };
      const c = this.corpi.find((q) => Math.hypot(q.x - e.x, q.y - e.y) < RAGGIO_SEGNALA && this.vede(e, q));
      if (!c) return { errore: 'Non c\'è nessun corpo qui vicino' };
      this.apriRiunione('corpo', p, c.di);
      return { ok: true };
    }
    if (a.tipo === 'riunione') {
      if (!e.vivo) return { errore: 'I fantasmi non possono chiamare riunioni' };
      if (Math.hypot(PULSANTE.x - e.x, PULSANTE.y - e.y) > RAGGIO_PULSANTE) return { errore: 'Il pulsante è in Sala comune' };
      if (e.riunioni <= 0) return { errore: 'Hai già usato la tua riunione' };
      if (this.pulsanteDa > 0) return { errore: `Il pulsante si ricarica: ancora ${Math.ceil(this.pulsanteDa)} secondi` };
      e.riunioni--; this.apriRiunione('emergenza', p);
      return { ok: true };
    }
    if (a.tipo === 'inizia') {
      const c = e.compiti.find((q) => q.id === Number(a.id));
      const st = STAZIONI.find((s) => s.id === Number(a.id));
      if (!c || !st) return { errore: 'Non è un tuo compito' };
      if (c.fatto) return { errore: 'L\'hai già fatto' };
      const q = centro(st.t);
      if (Math.hypot(q.x - e.x, q.y - e.y) > RAGGIO_COMPITO) return { errore: 'Avvicinati alla postazione' };
      e.compito = { id: st.id, dal: t };
      return { ok: true };
    }
    if (a.tipo === 'annulla') { e.compito = null; return { ok: true }; }
    if (a.tipo === 'finito') {
      if (!e.compito || e.compito.id !== Number(a.id)) return { errore: 'Nessun compito aperto' };
      const st = STAZIONI.find((s) => s.id === e.compito.id);
      if (t - e.compito.dal < (SEMPLICI.includes(st.tipo) ? MIN_SEMPLICE : MIN_COMPLESSO)) return { errore: 'Troppo veloce!' };
      const c = e.compiti.find((q) => q.id === st.id);
      c.fatto = true; e.compito = null; this.cambiato = true;
      // per gli Alieni è solo finta: il compito risulta fatto nella loro lista ma non conta
      if (!e.alieno) this.controllaVittoria();
      return { ok: true };
    }
    return { errore: 'Azione sconosciuta' };
  }
  // la chat: fuori dalle riunioni i vivi non parlano; i fantasmi parlano solo tra loro
  leggiChat(p, testo) {
    if (this.finita || this.fase !== 'gioco') return {};
    const e = this.e[p];
    if (!e.vivo) return { soloPer: this.e.filter((o) => !o.vivo).map((o) => o.id) };
    if (this.fase2 === 'discussione' || this.fase2 === 'voto' || this.fase2 === 'fine') return {};
    return { nascondi: true, privato: '🤫 Fuori dalle riunioni non si parla: premi il pulsante in Sala comune o segnala un corpo' };
  }
  fineRound() {}
  chiudi() {
    this.finita = true; this.fase = 'fine';
    const v = this.vittoria || { chi: 'equipaggio' };
    const alieni = this.e.filter((e) => e.alieno).map((e) => e.id), equipaggio = this.e.filter((e) => !e.alieno).map((e) => e.id);
    const vincitori = v.chi === 'alieni' ? alieni : equipaggio;
    this.punti = this.punti.map((_, i) => (vincitori.includes(i) ? 1 : 0));
    this.risultato = { fazioni: [{ posti: equipaggio, punti: v.chi === 'alieni' ? 0 : 1, nome: 'Equipaggio' }, { posti: alieni, punti: v.chi === 'alieni' ? 1 : 0, nome: 'Alieni' }], etichetta: 'vittoria', pareggio: false, vincitori };
  }
  vistaExtra() {
    return { mappa: MAPPA, t: T, mw: MW, mh: MH, stanze: STANZE, mobili: MOBILI, stazioni: STAZIONI.map((s) => ({ ...s, ...centro(s.t) })), pulsante: PULSANTE, vista: VISTA, raggi: { uccidi: RAGGIO_UCCIDI, compito: RAGGIO_COMPITO, pulsante: RAGGIO_PULSANTE, segnala: RAGGIO_SEGNALA }, minimi: { semplice: MIN_SEMPLICE, complesso: MIN_COMPLESSO } };
  }
  statoTick(posto) {
    const t = this.tempoRound, io = this.e[posto], finito = this.fase2 === 'fine' || this.finita;
    if (!io) return { f2: this.fase2 };
    const tutto = !io.vivo || finito; // i fantasmi vedono tutto
    const visibile = (o) => o.id === posto || tutto || (o.vivo && this.vede(io, o));
    const alieniNoti = io.alieno || finito ? this.e.filter((e) => e.alieno).map((e) => e.id) : [];
    const r = this.riunione;
    return {
      f2: this.fase2, stanza: stanzaDi(io.x, io.y), prog: Math.round(this.progresso() * 100),
      io: { vivo: io.vivo, alieno: io.alieno, cd: io.alieno ? Math.ceil(io.prontoUccidi) : 0, ri: io.riunioni, compiti: io.compiti, compito: io.compito, espulso: !!io.espulso },
      alieni: alieniNoti,
      // i vivi vedono solo i vivi (i fantasmi sono invisibili ai vivi); i fantasmi vedono anche gli altri fantasmi
      e: this.e.filter(visibile).filter((o) => o.vivo || !io.vivo || finito || o.id === posto).map((o) => ({ id: o.id, x: Math.round(o.x), y: Math.round(o.y), d: o.dir, m: o.passo > 0 ? 1 : 0, f: o.vivo ? 0 : 1, c: o.compito ? 1 : 0 })),
      corpi: this.corpi.filter((c) => tutto || this.vede(io, c)).map((c) => ({ di: c.di, x: Math.round(c.x), y: Math.round(c.y) })),
      pul: Math.ceil(this.pulsanteDa),
      riu: r && this.fase2 !== 'libero' ? { tipo: r.tipo, da: r.da, corpo: r.corpo, fase: r.fase, resta: Math.max(0, Math.ceil(r.fine - t)), votato: Object.keys(r.voti).map(Number), mioVoto: r.voti[posto], esito: r.fase === 'fine' ? r.esito : null, vivi: this.e.filter((e) => e.vivo || (this.espulsione && this.espulsione.chi === e.id)).map((e) => e.id), n: r.n } : null,
      esp: this.espulsione ? { chi: this.espulsione.chi, alieno: this.espulsione.alieno, rimasti: this.espulsione.rimasti, pari: this.espulsione.pari, e: Math.round((ESPULSIONE - (this.espulsione.fine - t)) * 100) / 100 } : null,
      vit: this.vittoria, ruoli: finito ? this.e.map((e) => (e.alieno ? 1 : 0)) : null,
    };
  }
}

module.exports = {
  meta: {
    id: 'alieno',
    nome: 'Chi è l\'Alieno',
    tipo: 'tabellone',
    tempoReale: true,
    soloPersone: true,
    giocatori: [4, 5, 6, 7, 8, 9, 10],
    descrizione: 'Un equipaggio di astronauti e, nascosti tra loro, degli Alieni identici agli altri. Fate i compiti, trovate i corpi, discutete e votate chi espellere nello spazio.',
    alias: ['alieno', 'alieni', 'chi è l\'alieno', 'among us', 'impostore spaziale', 'astronauti', 'spazio'],
    opzioni: [{ id: 'alieni', nome: 'Alieni', valori: [1, 2, 3], etichette: ['1 Alieno', '2 Alieni (da 7 giocatori)', '3 Alieni (con 9 o 10)'], predefinito: 1 }],
    regole: [
      'Si gioca solo tra persone, da 4 a 10. All\'inizio, in segreto, uno o più giocatori diventano Alieni: hanno lo stesso identico aspetto degli altri. Gli Alieni sanno chi sono gli altri Alieni.',
      'Numero di Alieni: lo sceglie chi apre il tavolo (1, 2 o 3). Al massimo 1 fino a 6 giocatori, 2 con 7 o 8, 3 con 9 o 10: se ne hai scelti troppi si gioca con il massimo possibile e compare un avviso in chat.',
      'La base ha 10 stanze collegate da corridoi che si diramano, con due condotti di scorciatoia. Ti muovi con WASD o le frecce (sul telefono col joystick). Vedi solo intorno a te: i muri fermano lo sguardo. In basso a destra c\'è la mappa della base con i tuoi compiti.',
      'Compiti: ognuno ne ha 5 (3 semplici e 2 un po\' più lunghi) nelle postazioni della base. Avvicinati e premi E (o 🛠️). Semplici: premere al momento giusto, interruttori in ordine, tenere premuto per caricare. Lunghi: ripetere una sequenza di colori, cliccare i numeri in ordine dopo averli visti, collegare i fili dello stesso colore. Mentre fai un compito sei fermo.',
      'Gli Alieni hanno una lista di compiti finti: possono fingere di farli, con la stessa schermata, ma non contano.',
      'Gli Alieni eliminano chi è vicino premendo Q (o 🗡️). Dopo ogni eliminazione devono aspettare 25 secondi (20 da 7 giocatori in su), e la prima volta 10 secondi dall\'inizio. Il corpo resta dove è caduto.',
      'Chi trova un corpo lo segnala con R (o 📣): parte subito una riunione. In Sala comune c\'è il pulsante d\'emergenza (E o 🚨 quando sei vicino): ognuno può usarlo una volta a partita, e dopo ogni riunione si ricarica per 15 secondi.',
      'Riunione: tutti fermi. Prima 30 secondi di discussione in chat, poi 2 minuti per votare in segreto chi espellere (o "Nessuno"); si chiude prima se hanno votato tutti. Con un pareggio, o se vince "Nessuno", non si espelle nessuno. Chi viene espulso vola fuori nello spazio e si scopre se era un Alieno; poi si vede quanti Alieni restano.',
      'Fuori dalle riunioni i vivi non possono scrivere in chat. Chi è eliminato diventa un fantasma: nessun vivo lo vede, passa attraverso i muri, vede tutta la base, può ancora fare i suoi compiti (aiuta l\'equipaggio) e scrive in chat solo agli altri fantasmi.',
      'Vince l\'equipaggio se finisce tutti i compiti (conta la barra in alto) o se espelle tutti gli Alieni. Vincono gli Alieni appena sono tanti quanti gli umani vivi.',
      'Chi esce dalla partita resta fermo dove si trova (nessuno gioca al suo posto); se resta fuori più di un minuto i suoi compiti non contano più, così la partita non si blocca.',
    ],
  },
  crea: (o) => new Alieno(o),
  bot: () => ({}),
  _test: { Alieno, MAPPA, STAZIONI, STANZE, MOBILI, maxAlieni, PULSANTE, T, VISTA },
};
