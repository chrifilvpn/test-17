const path = require('path');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const { GIOCHI, pulisciOpzioni } = require('./giochi');

const PORTA = process.env.PORT || 3000;
const ATTESA_BOT_MS = Number(process.env.ATTESA_BOT_MS) || 900; // pausa "di riflessione" del computer
const SOSTITUZIONE_MS = 25000; // dopo quanto il computer gioca per chi si è disconnesso
const VITA_STANZA_VUOTA_MS = 10 * 60 * 1000;
const LIVELLI = ['facile', 'medio', 'difficile'];
const FICHE_INIZIALI = 1000; // fiche di ogni giocatore a inizio tavolo (blackjack, poker, baccarat...)
const VOTO_FINE_MS = 30000; // quanto dura la votazione per terminare la partita
const ESECUZIONE_MS = 7000; // quanto dura l'esecuzione pubblica (67): il tavolo si ferma per tutti
const ESECUZIONE_ATTESA_MS = 12000; // tra un'esecuzione e l'altra, per non bloccare il tavolo di continuo
const { eSessantasette } = require('./esecuzione');
const { censura } = require('./censura'); // viagano/viaganò in chat diventa ******** // "67", "sessantasette", "sessanta sette"
const NOMI_BOT = ['Ada', 'Alan', 'Grace', 'Linus', 'Tim', 'Margaret', 'Dennis', 'Barbara'];

const sicurezza = require('./sicurezza');
const { eComandoAdmin } = require('./admin'); // comando segreto dell'amministratore (vedi admin.js) // difese: intestazioni, limiti, pulizia dei dati (vedi sicurezza.js)
// limiti per indirizzo larghi: a scuola tutta la classe esce su internet con lo stesso indirizzo
const MAX_TAVOLI = 1000, MAX_TAVOLI_PER_IP = 60, MAX_CONNESSIONI_PER_IP = 150;

const app = express();
const server = http.createServer(app);
// maxHttpBufferSize: nessun messaggio dal browser può superare 100 kB (di norma sono poche centinaia di byte)
const io = new Server(server, { maxHttpBufferSize: 1e5, pingTimeout: 20000 });
sicurezza.difeseHttp(app);
app.use(express.static(path.join(__dirname, 'public')));
app.get('/js/scala-regole.js', (_q, r) => r.sendFile(path.join(__dirname, 'giochi', 'scala-regole.js')));
app.get('/js/navale-regole.js', (_q, r) => r.sendFile(path.join(__dirname, 'giochi', 'navale-regole.js')));
app.get('/js/risiko-mappa.js', (_q, r) => r.sendFile(path.join(__dirname, 'giochi', 'risiko-mappa.js')));
app.get('/js/putt-buche.js', (_q, r) => r.sendFile(path.join(__dirname, 'giochi', 'putt-buche.js')));
app.get('/js/strada-mondo.js', (_q, r) => r.sendFile(path.join(__dirname, 'giochi', 'strada-mondo.js')));
app.get('/js/tigerball-livelli.js', (_q, r) => r.sendFile(path.join(__dirname, 'giochi', 'tigerball-livelli.js')));
app.get('/salute', (_q, r) => r.send('ok'));
// la pagina finta delle dispense ha un suo indirizzo: se si ricarica, il sito riparte da lì
app.get('/dispense', (_q, r) => r.sendFile(path.join(__dirname, 'public', 'index.html')));

const stanze = new Map();
const LETTERE = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const nuovoCodice = () => {
  let c;
  do c = Array.from({ length: 4 }, () => LETTERE[Math.floor(Math.random() * LETTERE.length)]).join('');
  while (stanze.has(c));
  return c;
};
const { pulisciId } = sicurezza;
const pulisciNome = (n) => censura(sicurezza.pulisciNome(n)); // anche i nomi passano dalla censura
// un gioco esiste solo se è davvero nell'elenco (niente "constructor", "__proto__" e simili)
const giocoDa = (id) => (typeof id === 'string' && Object.prototype.hasOwnProperty.call(GIOCHI, id) ? GIOCHI[id] : null);
const elencoGiochi = () => Object.values(GIOCHI).map((g) => ({ ...g.meta, comandi: AIUTO_COMANDI }));

function nomeBot(s) {
  const usati = new Set(s.posti.filter(Boolean).map((g) => g.nome));
  return NOMI_BOT.find((n) => !usati.has(n)) || `Computer ${s.posti.filter((g) => g && g.bot).length + 1}`;
}
const creaBot = (s, livello) => ({ id: `bot-${Math.random().toString(36).slice(2)}`, nome: nomeBot(s), bot: livello, connesso: true, fiche: FICHE_INIZIALI });
// giochi senza computer (meta.soloPersone): chi manca salta il turno invece di essere sostituito
const senzaBot = (s) => !!GIOCHI[s.gioco].meta.soloPersone;
const umani = (s) => s.posti.filter((g) => g && (!g.bot || g.inSala));
// Giochi di collaborazione (meta.pausaBoss): se qualcuno è sulla pagina delle dispense, la partita si ferma per tutti.
// Una partita può decidere da sé (es. Block Blast: in pausa da soli e in collaborazione, non nella sfida).
const pausaBossDi = (s) => (s.partita && s.partita.pausaBoss !== undefined ? s.partita.pausaBoss : GIOCHI[s.gioco].meta.pausaBoss);
const inEsecuzione = (s) => !!(s.esecuzioneFino && Date.now() < s.esecuzioneFino);
const inPausa = (s) => !!(s.partita && !s.partita.finita && (inEsecuzione(s) || (pausaBossDi(s) && umani(s).some((g) => g.nascosto))));

function messaggioSistema(s, testo) {
  s.chat.push({ id: ++s.nChat, posto: -1, testo, ora: Date.now(), sistema: true });
  if (s.chat.length > 80) s.chat.shift();
}

function invia(s) {
  if (s.votoFine && s.votoFine.partita !== s.partita) { clearTimeout(s.timerVoto); s.votoFine = null; }
  s.posti.forEach((g, posto) => {
    if (!g || (g.bot && !g.inSala) || !g.socketId) return; // chi è tornato al tavolo riceve ancora lo stato
    io.to(g.socketId).emit('stato', {
      codice: s.codice,
      gioco: s.gioco,
      opzioni: s.opzioni,
      numPosti: s.posti.length,
      mioPosto: posto,
      sonoHost: s.host === g.id,
      giocatori: s.posti.map((x, i) => (x ? { nome: x.nome, connesso: x.connesso, bot: x.bot || null, autoplay: !!x.autoplay, nascosto: !!x.nascosto, uscito: !!x.uscito, inSala: !!x.inSala, fiche: x.fiche, vittorie: s.vittorie[i] } : null)),
      inPausa: inPausa(s),
      ricaricaConsigliata: !!(s.partita && s.partita.ficheDi && !g.bot && s.partita.ficheDi(posto) <= 0 && !(s.partita.ficheInGioco && s.partita.ficheInGioco(posto) > 0)),
      votoFine: s.votoFine ? { tipo: s.votoFine.tipo, da: s.votoFine.da, si: s.votoFine.si, no: s.votoFine.no, servono: s.votoFine.servono, votanti: s.votoFine.votanti, resta: Math.max(0, s.votoFine.scade - Date.now()) } : null,
      esecuzione: inEsecuzione(s) ? s.esecuzioneFino - Date.now() : 0,
      partita: s.partita ? s.partita.vista(posto) : null,
      chat: s.chat.filter((m) => !m.per || m.per.includes(posto)).slice(-40), // m.per: messaggio visibile solo ad alcuni (es. i fantasmi di Chi è l'Alieno)
    });
  });
}

function aggiorna(s) {
  if (!stanze.has(s.codice)) return;
  const g = s.partita;
  // giochi in tempo reale che si fermano quando qualcuno è sulle dispense (es. il cronometro del campo minato)
  if (g && g.impostaPausa) g.impostaPausa(inPausa(s));
  // giochi con le fiche: il saldo torna al tavolo dopo ogni mossa; i computer senza fiche si ricaricano da soli
  if (g && g.ficheDi) {
    s.posti.forEach((x, i) => {
      if (!x) return;
      x.fiche = g.ficheDi(i);
      if (x.bot && x.fiche <= 0) { x.fiche = FICHE_INIZIALI; g.ricarica(i, FICHE_INIZIALI); messaggioSistema(s, `💰 ${x.nome} (computer) si ricarica con ${FICHE_INIZIALI} fiche`); }
      // a una persona rimasta senza fiche si consiglia (una volta) il comando !ricarica
      const aSecco = x.fiche <= 0 && !(g.ficheInGioco && g.ficheInGioco(i) > 0);
      if (!x.bot && aSecco && !x.ricaricaDetta) { x.ricaricaDetta = true; messaggioSistema(s, `💡 ${x.nome}, hai finito le fiche: scrivi !ricarica in chat per averne altre ${FICHE_INIZIALI}`); }
      if (x.fiche > 0) x.ricaricaDetta = false;
    });
  }
  // messaggi di sistema scritti dal gioco (es. "Ada ha indovinato!" in Disegna e indovina)
  if (g && g.chatSistema && g.chatSistema.length) for (const t of g.chatSistema.splice(0)) messaggioSistema(s, censura(String(t).slice(0, 200).replace(/@(\d+)/g, (_m, k) => (s.posti[k] ? s.posti[k].nome : '?'))));
  // messaggi che il gioco scrive in chat a nome di un giocatore (es. gli indizi di Chi è l'impostore)
  if (g && g.chatDa && g.chatDa.length) {
    for (const m of g.chatDa.splice(0)) {
      const x = s.posti[m.posto];
      if (!x) continue;
      s.chat.push({ id: ++s.nChat, posto: m.posto, nome: x.nome, testo: censura(String(m.testo).slice(0, 160)), ora: Date.now() });
      if (s.chat.length > 80) s.chat.shift();
    }
  }
  if (g && g.finita && !g.registrata) {
    g.registrata = true;
    for (const v of g.risultato.vincitori) s.vittorie[v]++;
  }
  invia(s);
  pianifica(s);
  gestisciTick(s);
}

// ---- giochi in tempo reale: la partita espone tick(ora), tickMs e vistaTick(posto) ----
// Il ciclo gira finché la partita è in corso; si ferma per tutti quando qualcuno è sulle dispense (pausaBoss).
function gestisciTick(s) {
  const g = s.partita;
  if (s.cicloDi && (s.cicloDi !== g || !g || g.finita || !stanze.has(s.codice))) { clearInterval(s.ciclo); s.ciclo = null; s.cicloDi = null; }
  if (!g || !g.tick || g.finita || s.ciclo) return;
  s.cicloDi = g;
  s.ciclo = setInterval(() => {
    if (s.partita !== g || g.finita || !stanze.has(s.codice)) { clearInterval(s.ciclo); s.ciclo = null; s.cicloDi = null; return; }
    if (inPausa(s)) return;
    let cambiato = false;
    try { cambiato = g.tick(Date.now()); } catch (e) { console.warn(`[${s.gioco}] errore nel tick: ${e.message}`); }
    s.posti.forEach((x, posto) => { if (x && !x.bot && x.socketId) io.to(x.socketId).volatile.emit('tick', g.vistaTick(posto)); });
    if (cambiato || g.finita) aggiorna(s);
  }, g.tickMs || 50);
}

function pianifica(s) {
  clearTimeout(s.timer);
  (s.timerSim || []).forEach(clearTimeout);
  s.timerSim = [];
  clearTimeout(s.timerTempo);
  const g = s.partita;
  if (!g || g.finita) return;
  // esecuzione pubblica in corso: tutto fermo, si riprende da soli alla fine
  if (inEsecuzione(s)) { s.timer = setTimeout(() => aggiorna(s), s.esecuzioneFino - Date.now() + 30); return; }
  // Giochi con orologio: g.scadenza() dice quando finisce il tempo di chi deve muovere.
  const fine = g.scadenza && g.scadenza();
  if (fine) {
    const partitaT = g;
    s.timerTempo = setTimeout(() => {
      if (s.partita === partitaT && partitaT.controllaTempo()) aggiorna(s);
      else if (s.partita === partitaT) pianifica(s);
    }, Math.max(0, fine - Date.now()) + 30);
  }
  if (inPausa(s)) return; // riprende quando tutti tornano dalle dispense
  const partita = g;
  // Fasi in cui tutti agiscono insieme (es. schieramento della battaglia navale): g.attesi() dice chi manca.
  if (g.turno == null && g.attesi && !g.inAttesa) {
    for (const posto of g.attesi()) {
      const gio = s.posti[posto];
      let attesa = null;
      if (gio.bot) attesa = ATTESA_BOT_MS * (g.velocitaBot || 1) * (1 + Math.random() * 2);
      else if (!gio.connesso || gio.autoplay || gio.nascosto) attesa = SOSTITUZIONE_MS;
      if (attesa == null) continue;
      s.timerSim.push(setTimeout(() => {
        if (s.partita !== partita || partita.finita || !partita.attesi().includes(posto)) return;
        if (!gio.bot && gio.connesso && !gio.autoplay && !gio.nascosto) return;
        if (senzaBot(s) || (!gio.bot && GIOCHI[s.gioco].meta.saltaAssenti)) { if (partita.salta) { partita.salta(posto); aggiorna(s); } return; }
        if (!gio.bot) messaggioSistema(s, `${gio.nome} non risponde: il computer ha agito per lui`);
        mossaComputer(s, posto, gio.bot || 'medio');
      }, attesa));
    }
    return;
  }
  if (g.inAttesa) {
    // il riepilogo di fine smazzata resta finché qualcuno non preme "Continua"
    if (g.fase === 'riepilogo') return;
    s.timer = setTimeout(() => { if (s.partita === partita && partita.inAttesa) { partita.avanza(); aggiorna(s); } }, g.pausaMs || 1200);
    return;
  }
  const t = g.turno;
  if (t == null) return;
  const gio = s.posti[t];
  let attesa = null;
  let livello = null;
  if (senzaBot(s) || (!gio.bot && GIOCHI[s.gioco].meta.saltaAssenti)) {
    if (gio.uscito) attesa = 300;
    else if (!gio.connesso || gio.nascosto) attesa = SOSTITUZIONE_MS;
    if (attesa == null || !g.salta) return;
    s.timer = setTimeout(() => {
      if (s.partita !== partita || partita.turno !== t || partita.inAttesa) return;
      if (gio.connesso && !gio.nascosto && !gio.uscito) return; // nel frattempo è tornato
      partita.salta(t);
      aggiorna(s);
    }, attesa);
    return;
  }
  // velocitaBot: una partita può far aspettare meno il computer (es. Risiko, dove un turno ha tante piccole mosse)
  if (gio.bot) { attesa = ATTESA_BOT_MS * (g.velocitaBot || 1) * (0.7 + Math.random() * 0.7); livello = gio.bot; }
  else if (!gio.connesso || gio.autoplay) { attesa = gio.autoplay ? ATTESA_BOT_MS : SOSTITUZIONE_MS; livello = 'medio'; }
  else if (gio.nascosto) { attesa = SOSTITUZIONE_MS; livello = 'medio'; } // sulle dispense: la partita va avanti
  if (attesa == null) return;
  s.timer = setTimeout(() => {
    if (s.partita !== partita || partita.turno !== t || partita.inAttesa) return;
    if (!gio.bot && gio.connesso && !gio.autoplay && !gio.nascosto) return; // nel frattempo è tornato
    if (!gio.bot && !gio.connesso && !gio.autoplay) { gio.autoplay = true; messaggioSistema(s, `${gio.nome} non è connesso: il computer gioca al suo posto`); }
    else if (!gio.bot && gio.nascosto && !gio.autoplay) messaggioSistema(s, `${gio.nome} è via: il computer ha fatto una mossa per lui`);
    mossaComputer(s, t, livello);
  }, attesa);
}

function mossaComputer(s, posto, livello) {
  const g = s.partita;
  const mod = GIOCHI[s.gioco];
  let r;
  try { r = g.azione(posto, mod.bot(g, posto, livello)); } catch (e) { r = { errore: e.message }; }
  if (r && r.errore) {
    console.warn(`[${s.gioco}] mossa del computer rifiutata: ${r.errore}`);
    try { r = g.azione(posto, mod.bot(g, posto, 'facile')); } catch (e) { r = { errore: e.message }; }
    if (r && r.errore && g.sblocca) g.sblocca(posto);
  }
  aggiorna(s);
}

// Spiegazione dei comandi: compare con !comandi e nelle regole di ogni gioco.
const AIUTO_COMANDI = {
  '!ricarica': `ti ridà ${FICHE_INIZIALI} fiche, ma solo quando le hai finite (0 fiche). Serve nei giochi con le fiche`,
  '!prof': 'apre la pagina delle dispense a tutti i giocatori del tavolo (dalla chat globale: a tutto il sito)',
  '!restart': 'propone di ricominciare la partita da capo (se qualcosa è andato storto): decide la maggioranza del tavolo',
  '!comandi': 'mostra questo elenco',
  // il 67 non si elenca: è un easter egg che si scopre giocando
};

// ---- comandi di chat: iniziano con "!" e non compaiono come messaggi normali ----
// Per aggiungerne uno nuovo basta una riga qui (es. '!ricarica' per le fiche).
const COMANDI = {
  '!restart': (s, posto) => {
    if (!s.partita || s.partita.finita) { messaggioSistema(s, 'Non c\'è una partita in corso da ricominciare'); return; }
    votazione(s, posto, true, 'restart');
  },
  '!ricarica': (s, posto) => {
    const g = s.posti[posto];
    const attuali = s.partita && s.partita.ficheDi ? s.partita.ficheDi(posto) : g.fiche;
    if (attuali > 0) { messaggioSistema(s, `${g.nome}: puoi chiedere altre fiche solo quando le hai finite (ora ne hai ${attuali})`); return; }
    g.fiche = FICHE_INIZIALI;
    if (s.partita && s.partita.ricarica) s.partita.ricarica(posto, FICHE_INIZIALI);
    messaggioSistema(s, `💰 ${g.nome} riceve ${FICHE_INIZIALI} fiche`);
  },
  '!comandi': (s) => {
    messaggioSistema(s, `Comandi della chat: ${Object.entries(AIUTO_COMANDI).map(([c, d]) => `${c} ${d}`).join(' · ')}`);
  },
  '!prof': (s, posto) => {
    const g = s.posti[posto];
    messaggioSistema(s, `🚨 ${g.nome} ha dato l'allarme prof`);
    io.to(s.codice).emit('prof', { nome: g.nome });
  },
};

// BLOCCO DEI COMANDI (dall'Ammiragliato): l'admin può spegnere per un po' i comandi della chat (il 67, !comandi,
// !restart…) se qualcuno ne abusa. !prof e !ricarica funzionano sempre. Vale per tutto il sito.
const SEMPRE_ATTIVI = ['!prof', '!ricarica'];
let comandiBloccatiFino = 0; // ora (ms) fino a cui sono spenti; Infinity = fino al riavvio del server
const comandiBloccati = () => Date.now() < comandiBloccatiFino;
function avvisoBlocco() {
  if (comandiBloccatiFino === Infinity) return '🔇 I comandi della chat sono disattivati dall\'Ammiragliato (tranne !prof e !ricarica)';
  const m = Math.max(1, Math.ceil((comandiBloccatiFino - Date.now()) / 60000));
  return `🔇 I comandi della chat sono disattivati dall'Ammiragliato per altri ${m} ${m === 1 ? 'minuto' : 'minuti'} (tranne !prof e !ricarica)`;
}

// ESECUZIONE PUBBLICA: chi scrive 67 in chat viene gettato nel vulcano. Il tavolo si ferma per tutti durante l'animazione.
function esecuzione(s, posto) {
  const g = s.posti[posto];
  if (!g) return;
  const ora = Date.now();
  if (s.esecuzioneFino && ora < s.esecuzioneFino + ESECUZIONE_ATTESA_MS) {
    messaggioSistema(s, `🌋 Il vulcano sta ancora digerendo… ${g.nome}, riprova tra poco`);
    return invia(s);
  }
  s.esecuzioneFino = ora + ESECUZIONE_MS;
  messaggioSistema(s, `🌋 ESECUZIONE PUBBLICA: ${g.nome} ha detto la parola proibita ed è stato gettato nel vulcano`);
  io.to(s.codice).emit('esecuzione', { posto, nome: g.nome, durata: ESECUZIONE_MS });
  aggiorna(s); // ferma timer, computer e giochi in tempo reale (impostaPausa)
}

// VOTAZIONI: "Termina" (pulsante in alto) o "!restart" (comando in chat). Votano le persone al tavolo (i computer
// no); con la maggioranza dei sì la partita finisce (si torna in sala) o ricomincia da capo, uguale a prima.
// La votazione scade dopo 30 secondi.
const TESTI_VOTO = {
  fine: { proposta: 'terminare la partita', fatto: 'partita terminata' },
  restart: { proposta: 'ricominciare la partita da capo', fatto: 'la partita ricomincia da capo' },
};
function votazione(s, i, si, tipo) {
  if (!s || i === -1 || !s.partita || s.partita.finita) return;
  const g = s.posti[i];
  if (s.votoFine && s.votoFine.tipo !== tipo) { messaggioSistema(s, `🗳️ C'è già una votazione in corso per ${TESTI_VOTO[s.votoFine.tipo].proposta}`); aggiorna(s); return; }
  if (!s.votoFine) {
    if (si === false) return;
    const votanti = s.posti.map((x, k) => (x && !x.bot && !x.uscito ? k : -1)).filter((k) => k >= 0);
    const v = { tipo, da: i, si: [], no: [], votanti, servono: Math.floor(votanti.length / 2) + 1, scade: Date.now() + VOTO_FINE_MS, partita: s.partita };
    s.votoFine = v;
    messaggioSistema(s, `🗳️ ${g.nome} propone di ${TESTI_VOTO[tipo].proposta} (servono ${v.servono} sì su ${votanti.length})`);
    clearTimeout(s.timerVoto);
    s.timerVoto = setTimeout(() => {
      if (s.votoFine !== v) return;
      s.votoFine = null;
      messaggioSistema(s, '🗳️ Votazione scaduta: si continua a giocare');
      aggiorna(s);
    }, VOTO_FINE_MS);
  }
  const v = s.votoFine;
  if (!v.votanti.includes(i)) return;
  v.si = v.si.filter((k) => k !== i); v.no = v.no.filter((k) => k !== i);
  (si === false ? v.no : v.si).push(i);
  if (v.si.length >= v.servono) {
    clearTimeout(s.timerVoto);
    s.votoFine = null;
    messaggioSistema(s, `🗳️ La maggioranza ha votato sì (${v.si.length} su ${v.votanti.length}): ${TESTI_VOTO[tipo].fatto}`);
    clearTimeout(s.timer);
    if (tipo === 'restart') {
      // stessa partita da capo: stesso gioco, stesse opzioni, stessi giocatori e stesso primo di mano
      s.primo = (s.primo - 1 + s.posti.length) % s.posti.length;
      iniziaPartita(s);
    } else {
      s.partita = null;
      ripristinaInSala(s);
      s.posti.forEach((x, k) => { if (x && ((x.bot && x.sostituto) || x.uscito)) s.posti[k] = null; });
    }
  } else if (v.no.length > v.votanti.length - v.servono) {
    clearTimeout(s.timerVoto);
    s.votoFine = null;
    messaggioSistema(s, `🗳️ La proposta di ${TESTI_VOTO[tipo].proposta} è stata respinta: si continua`);
  }
  aggiorna(s);
}

// chi era tornato al tavolo durante la partita riprende il suo posto (non è più "computer" né "uscito")
function ripristinaInSala(s) {
  s.posti.forEach((x, k) => {
    if (!x || !x.inSala) return;
    const { inSala, uscito, bot, ...resto } = x;
    s.posti[k] = { ...resto, nome: x.nomeVero || x.nome };
    delete s.posti[k].nomeVero;
  });
}

function iniziaPartita(s) {
  ripristinaInSala(s);
  const mod = GIOCHI[s.gioco];
  s.partita = mod.crea({ n: s.posti.length, primo: s.primo, opzioni: s.opzioni, fiche: s.posti.map((g) => (g ? g.fiche : FICHE_INIZIALI)), bot: s.posti.map((g) => (g && g.bot) || null) });
  s.primo = (s.primo + 1) % s.posti.length;
  s.posti.forEach((g) => g && (g.autoplay = false));
}

function controllaVuota(s) {
  clearTimeout(s.timerChiusura);
  if (!umani(s).length) { clearTimeout(s.timer); stanze.delete(s.codice); return; }
  if (umani(s).some((g) => g.connesso)) return;
  s.timerChiusura = setTimeout(() => { clearTimeout(s.timer); stanze.delete(s.codice); }, VITA_STANZA_VUOTA_MS);
}

// troppe connessioni dallo stesso indirizzo: si rifiutano le nuove
const connessioniPerIp = new Map();
// CHAT GLOBALE: una chat per tutto il sito, dalla home e da ogni tavolo. Tiene gli ultimi messaggi in memoria.
const chatGlobale = [];
let nChatGlobale = 0;
const MAX_CHAT_GLOBALE = 60;
let ultimoProfGlobale = 0, ultimaEsecuzioneGlobale = 0;
const PROF_GLOBALE_ATTESA_MS = 30000; // l'allarme prof per tutto il sito al massimo ogni 30 secondi
function pubblicaGlobale(m) {
  const msg = { id: ++nChatGlobale, ora: Date.now(), ...m };
  chatGlobale.push(msg); if (chatGlobale.length > MAX_CHAT_GLOBALE) chatGlobale.shift();
  io.emit('chatGlobale', msg);
}

// ESILIO: chi viene esiliato dall'amministratore non può tornare per un po' (per identificativo del browser e,
// se l'amministratore lo sceglie, anche per indirizzo: attenzione, a scuola vale per tutta la classe)
const esiliati = new Map(); // id del browser -> { fino, nome }
const ipEsiliati = new Map(); // indirizzo -> fino
const esiliato = (id, ip) => {
  const ora = Date.now();
  const e = id && esiliati.get(id);
  if (e && e.fino > ora) return e.fino;
  const f = ip && ipEsiliati.get(ip);
  if (f && f > ora) return f;
  return 0;
};
// chi è online: ogni connessione, anche dalla home
const presenze = new Map(); // socket.id -> { socket, id, nome, ip, dal, stanza, esci }
let timerAdmin = null;
function aggiornaAdmin() {
  clearTimeout(timerAdmin);
  timerAdmin = setTimeout(() => {
    const admin = [...presenze.values()].filter((x) => x.socket.data.admin);
    if (!admin.length) return;
    const ora = Date.now();
    const lista = [...presenze.entries()].map(([sid, x]) => {
      const st = x.stanza && stanze.get(x.stanza);
      return { sid, nome: x.nome || '(senza nome)', dove: st ? `tavolo ${st.codice} · ${GIOCHI[st.gioco].meta.nome}${st.partita && !st.partita.finita ? ' (in partita)' : ''}` : 'nella home', minuti: Math.floor((ora - x.dal) / 60000), admin: !!x.socket.data.admin };
    }).sort((a, b) => a.nome.localeCompare(b.nome));
    const banditi = [...esiliati.entries()].filter(([, e]) => e.fino > ora).map(([id, e]) => ({ id, nome: e.nome, minuti: Math.ceil((e.fino - ora) / 60000) }));
    for (const a of admin) a.socket.emit('adminLista', { lista: lista.map((x) => ({ ...x, io: x.sid === a.socket.id })), esiliati: banditi, comandiFino: comandiBloccatiFino === Infinity ? -1 : comandiBloccatiFino > ora ? comandiBloccatiFino : 0, ipBloccati: [...ipEsiliati.values()].filter((f) => f > ora).length });
  }, 300);
}
const DURATA_ESILIO_ANIMAZIONE = 11000;
function esilia(sid, minuti, ancheIp) {
  const x = presenze.get(sid);
  if (!x || x.inEsilio) return;
  const nome = x.nome || 'Qualcuno';
  const fino = Date.now() + minuti * 60000;
  if (x.id) esiliati.set(x.id, { fino, nome });
  if (ancheIp) ipEsiliati.set(x.ip, fino);
  x.inEsilio = true;
  // tutti quelli sul sito vedono la partenza della barca
  for (const [sid2, y] of presenze) y.socket.emit('esilio', { nome, sonoIo: sid2 === sid, durata: DURATA_ESILIO_ANIMAZIONE });
  pubblicaGlobale({ nome: '⚓', testo: `${nome} è stato esiliato in fondo al mare`, sistema: true });
  setTimeout(() => {
    if (!presenze.has(sid)) return;
    x.socket.emit('esiliato', { fino });
    try { if (x.esci) x.esci(); } catch (e) { console.warn('[esilio]', e.message); }
    x.socket.disconnect(true);
  }, DURATA_ESILIO_ANIMAZIONE);
  aggiornaAdmin();
}

io.use((socket, next) => {
  const ip = sicurezza.ipDi(socket.handshake);
  if (esiliato(null, ip)) return next(new Error('esiliato'));
  const n = connessioniPerIp.get(ip) || 0;
  if (n >= MAX_CONNESSIONI_PER_IP) return next(new Error('Troppe connessioni da questo indirizzo'));
  connessioniPerIp.set(ip, n + 1);
  socket.once('disconnect', () => { const m = (connessioniPerIp.get(ip) || 1) - 1; if (m > 0) connessioniPerIp.set(ip, m); else connessioniPerIp.delete(ip); });
  socket.data.ip = ip;
  next();
});


io.on('connection', (socket) => {
  const ipSocket = socket.data.ip;
  // ogni evento passa dalle difese: dati ripuliti, limiti al secondo, e un errore non fa mai cadere il server
  sicurezza.proteggiSocket(socket, {
    quandoLimitato: (ev) => socket.emit('errore', ev === 'chat' ? 'Piano con i messaggi! Aspetta un attimo' : 'Stai andando troppo veloce: rallenta un attimo'),
    quandoErrore: () => socket.emit('errore', 'Mossa non valida'),
  });
  let stanza = null;
  const presenza = { socket, id: null, nome: null, ip: ipSocket, dal: Date.now(), stanza: null, esci: null };
  presenze.set(socket.id, presenza);
  aggiornaAdmin();
  socket.once('disconnect', () => { presenze.delete(socket.id); aggiornaAdmin(); });
  // il browser dice chi è (anche dalla home): serve alla lista dell'amministratore e all'esilio
  socket.on('presenza', ({ id, nome } = {}) => {
    presenza.id = pulisciId(id) || null;
    presenza.nome = nome ? pulisciNome(nome) : presenza.nome;
    const f = esiliato(presenza.id, ipSocket);
    if (f) { socket.emit('esiliato', { fino: f }); socket.disconnect(true); return; }
    aggiornaAdmin();
  });
  // il comando segreto: chi lo scrive diventa amministratore per questa connessione (il messaggio non si vede)
  const provaAdmin = (testo) => {
    if (!eComandoAdmin(testo)) return false;
    socket.data.admin = true;
    socket.emit('adminAperto');
    aggiornaAdmin();
    return true;
  };
  socket.on('adminLista', () => { if (socket.data.admin) aggiornaAdmin(); });
  socket.on('adminEsilia', ({ sid, minuti, ip } = {}) => {
    if (!socket.data.admin || sid === socket.id) return;
    const m = [10, 60, 1440, 10080].includes(Number(minuti)) ? Number(minuti) : 60;
    esilia(String(sid || ''), m, ip === true);
  });
  // spegne (o riaccende) i comandi della chat per tutto il sito: minuti = 0 riaccende, -1 fino al riavvio
  socket.on('adminComandi', ({ minuti } = {}) => {
    if (!socket.data.admin) return;
    const m = Number(minuti);
    if (m === 0) comandiBloccatiFino = 0;
    else if (m === -1) comandiBloccatiFino = Infinity;
    else if (Number.isFinite(m) && m >= 1 && m <= 1440) comandiBloccatiFino = Date.now() + Math.round(m) * 60000;
    else return;
    pubblicaGlobale({ nome: '⚓', testo: comandiBloccatiFino ? avvisoBlocco() : '🔊 I comandi della chat sono di nuovo attivi', sistema: true });
    aggiornaAdmin();
  });
  socket.on('adminGrazia', ({ id } = {}) => {
    if (!socket.data.admin) return;
    const e = esiliati.get(String(id || ''));
    if (e) { esiliati.delete(String(id)); ipEsiliati.clear(); }
    aggiornaAdmin();
  });
  socket.emit('chatGlobaleStorico', chatGlobale);
  socket.on('chatGlobale', ({ testo, nome } = {}) => {
    if (provaAdmin(testo)) return;
    const grezzo = String(testo || '').replace(/\s+/g, ' ').trim().slice(0, 200);
    const chi = pulisciNome(nome || presenza.nome);
    // i comandi funzionano anche dalla chat globale (quindi anche dalla home), per tutto il sito
    const cmd = grezzo.toLowerCase();
    const spento = comandiBloccati() && !SEMPRE_ATTIVI.includes(cmd.split(' ')[0]);
    if (spento && cmd.startsWith('!')) { socket.emit('avvisoPrivato', avvisoBlocco()); return; }
    if (cmd === '!comandi') { socket.emit('avvisoPrivato', 'Nella chat globale: !prof manda tutto il sito sulle dispense; il resto dei comandi (!ricarica, !restart) si usa al tavolo'); return; }
    if (cmd === '!prof') {
      const ora = Date.now();
      if (ora - ultimoProfGlobale < PROF_GLOBALE_ATTESA_MS) { socket.emit('avvisoPrivato', `L'allarme prof è appena scattato: riprova tra ${Math.ceil((PROF_GLOBALE_ATTESA_MS - (ora - ultimoProfGlobale)) / 1000)} secondi`); return; }
      ultimoProfGlobale = ora;
      io.emit('prof', { nome: chi });
      pubblicaGlobale({ nome: '🚨', testo: `${chi} ha dato l'allarme prof a tutto il sito`, sistema: true });
      return;
    }
    if (eSessantasette(grezzo) && spento) socket.emit('avvisoPrivato', avvisoBlocco());
    else if (eSessantasette(grezzo)) {
      const ora = Date.now();
      if (ora - ultimaEsecuzioneGlobale < ESECUZIONE_ATTESA_MS) return;
      ultimaEsecuzioneGlobale = ora;
      for (const [sid, y] of presenze) y.socket.emit('esecuzione', { nome: chi, sonoIo: sid === socket.id, durata: ESECUZIONE_MS, globale: true });
      pubblicaGlobale({ nome: '🌋', testo: `${chi} ha pronunciato il numero proibito ed è stato gettato nel vulcano`, sistema: true });
      return;
    }
    const t = censura(grezzo);
    if (!t) return;
    const m = { id: ++nChatGlobale, nome: pulisciNome(nome), testo: t, ora: Date.now() };
    chatGlobale.push(m);
    if (chatGlobale.length > MAX_CHAT_GLOBALE) chatGlobale.shift();
    io.emit('chatGlobale', m);
  });
  let mioId = null;
  socket.emit('giochi', elencoGiochi());
  const errore = (m) => socket.emit('errore', m);
  const mioPosto = () => (stanza ? stanza.posti.findIndex((g) => g && g.id === mioId) : -1);
  const sonoHost = () => stanza && stanza.host === mioId;

  function siediti(s, id, nome) {
    if (esiliato(id, ipSocket)) { socket.emit('esiliato', { fino: esiliato(id, ipSocket) }); socket.disconnect(true); return; }
    let i = s.posti.findIndex((g) => g && g.id === id);
    if (i === -1) {
      if (s.partita) {
        // a partita iniziata si può prendere solo il posto di chi è uscito (ora giocato dal computer)
        i = s.posti.findIndex((g) => g && !g.inSala && ((g.bot && g.sostituto) || g.uscito));
        if (i === -1) return errore('La partita è già iniziata e non ci sono posti liberi');
        messaggioSistema(s, `${nome} prende il posto di ${s.posti[i].nome}`);
      } else {
        i = s.posti.findIndex((g) => !g);
        if (i === -1) i = s.posti.map((g) => !!(g && g.bot && !g.inSala)).lastIndexOf(true);
        if (i === -1) return errore('Il tavolo è pieno');
      }
      if (s.posti[i] && s.posti[i].uscito && s.partita && s.partita.rientra) s.partita.rientra(i);
      s.posti[i] = { id, nome, socketId: null, connesso: false, bot: null, fiche: FICHE_INIZIALI };
      if (!s.partita) messaggioSistema(s, `${nome} si è seduto al tavolo`);
    }
    const g = s.posti[i];
    if (g.socketId && g.socketId !== socket.id) io.to(g.socketId).emit('errore', 'Ti sei collegato da un\'altra finestra');
    g.socketId = socket.id;
    g.connesso = true;
    g.nascosto = false;
    g.autoplay = false;
    if (!s.partita) g.nome = nome;
    if (stanza && stanza !== s) esci();
    stanza = s;
    mioId = id;
    presenza.stanza = s.codice; presenza.id = presenza.id || id; presenza.nome = nome; aggiornaAdmin();
    socket.join(s.codice);
    clearTimeout(s.timerChiusura);
    aggiorna(s);
  }

  socket.on('creaStanza', ({ nome, id, gioco, posti, opzioni, controComputer } = {}) => {
    id = pulisciId(id);
    const mod = giocoDa(gioco);
    // limiti: niente migliaia di tavoli aperti da una persona sola
    if (stanze.size >= MAX_TAVOLI) return errore('Il sito è pieno in questo momento: riprova tra poco');
    if ([...stanze.values()].filter((x) => x.ip === ipSocket).length >= MAX_TAVOLI_PER_IP) return errore('Hai aperto troppi tavoli: chiudine qualcuno');
    posti = Number(posti);
    if (!id) return errore('Identificativo mancante');
    if (!mod) return errore('Gioco sconosciuto');
    if (!mod.meta.giocatori.includes(posti)) return errore(`${mod.meta.nome} si gioca in ${mod.meta.giocatori.join(', ')}`);
    if (controComputer && mod.meta.soloPersone && posti > 1) return errore(`${mod.meta.nome} si gioca solo con altre persone: apri un tavolo e invita gli amici`);
    const s = {
      codice: nuovoCodice(), gioco, opzioni: pulisciOpzioni(gioco, opzioni),
      posti: new Array(posti).fill(null), vittorie: new Array(posti).fill(0),
      partita: null, host: id, primo: 0, chat: [], nChat: 0, ip: ipSocket,
    };
    stanze.set(s.codice, s);
    siediti(s, id, pulisciNome(nome));
    if (controComputer) {
      const livello = LIVELLI.includes(controComputer) ? controComputer : 'medio';
      for (let i = 0; i < posti; i++) if (!s.posti[i]) s.posti[i] = creaBot(s, livello);
      iniziaPartita(s);
      aggiorna(s);
    }
  });

  socket.on('entraStanza', ({ codice, nome, id } = {}) => {
    const s = stanze.get(String(codice || '').toUpperCase().trim());
    if (!s) return errore('Nessun tavolo con questo codice');
    id = pulisciId(id);
    if (!id) return errore('Identificativo mancante');
    siediti(s, id, pulisciNome(nome));
  });

  // ---- sala d'attesa ----
  socket.on('aggiungiBot', ({ posto, livello } = {}) => {
    const s = stanza;
    if (!s || s.partita || !sonoHost()) return;
    posto = Number(posto);
    if (!(posto >= 0 && posto < s.posti.length) || s.posti[posto]) return;
    if (senzaBot(s)) return errore(`${GIOCHI[s.gioco].meta.nome} si gioca solo con altre persone`);
    s.posti[posto] = creaBot(s, LIVELLI.includes(livello) ? livello : 'medio');
    aggiorna(s);
  });

  socket.on('togliPosto', ({ posto } = {}) => {
    const s = stanza;
    if (!s || s.partita || !sonoHost()) return;
    const g = s.posti[Number(posto)];
    if (!g || g.id === mioId) return;
    if (!g.bot) { io.to(g.socketId).emit('allontanato'); messaggioSistema(s, `${g.nome} è stato tolto dal tavolo`); }
    s.posti[Number(posto)] = null;
    aggiorna(s);
  });

  socket.on('cambiaPosto', ({ posto } = {}) => {
    const s = stanza;
    const i = mioPosto();
    posto = Number(posto);
    if (!s || s.partita || i === -1 || !(posto >= 0 && posto < s.posti.length) || posto === i) return;
    [s.posti[i], s.posti[posto]] = [s.posti[posto], s.posti[i]]; // scambio con chi c'è (anche un posto vuoto)
    aggiorna(s);
  });

  socket.on('impostaGioco', ({ gioco, opzioni } = {}) => {
    const s = stanza;
    if (!s || s.partita || !sonoHost()) return;
    const mod = giocoDa(gioco);
    if (!mod) return;
    if (!mod.meta.giocatori.includes(s.posti.length)) return errore(`${mod.meta.nome} si gioca in ${mod.meta.giocatori.join(', ')}`);
    if (mod.meta.soloPersone && s.posti.some((g) => g && g.bot)) return errore(`${mod.meta.nome} si gioca solo con altre persone: togli prima i computer dal tavolo`);
    s.gioco = gioco;
    s.opzioni = pulisciOpzioni(gioco, opzioni);
    aggiorna(s);
  });

  socket.on('inizia', () => {
    const s = stanza;
    if (!s || s.partita || !sonoHost()) return;
    if (s.posti.some((g) => !g)) return errore('Riempi tutti i posti, anche con il computer');
    iniziaPartita(s);
    messaggioSistema(s, `Si gioca a ${GIOCHI[s.gioco].meta.nome}`);
    aggiorna(s);
  });

  // ---- partita ----
  socket.on('azione', (azione) => {
    const s = stanza;
    const i = mioPosto();
    if (!s || !s.partita || i === -1) return;
    if (inEsecuzione(s)) return errore('Esecuzione pubblica in corso: aspetta un attimo 🌋');
    const r = s.partita.azione(i, azione || {});
    if (r.errore) return errore(r.errore);
    aggiorna(s);
  });

  socket.on('continua', () => {
    const s = stanza;
    if (s && inEsecuzione(s)) return;
    const g = s && s.partita;
    if (!g || !g.inAttesa || g.fase !== 'riepilogo' || mioPosto() === -1) return;
    g.avanza();
    aggiorna(s);
  });

  socket.on('rivincita', () => {
    const s = stanza;
    if (!s || !s.partita || !s.partita.finita) return;
    if (!sonoHost()) return errore('La rivincita la avvia chi ha aperto il tavolo');
    iniziaPartita(s);
    aggiorna(s);
  });

  // a partita finita chi ha aperto il tavolo può passare subito a un altro gioco con gli stessi giocatori
  socket.on('nuovoGioco', ({ gioco, opzioni } = {}) => {
    const s = stanza;
    if (!s || !sonoHost()) return errore('Il gioco lo sceglie chi ha aperto il tavolo');
    if (s.partita && !s.partita.finita) return errore('Aspetta che la partita finisca');
    const mod = giocoDa(gioco);
    if (!mod) return errore('Gioco sconosciuto');
    if (!mod.meta.giocatori.includes(s.posti.length)) return errore(`${mod.meta.nome} si gioca in ${mod.meta.giocatori.join(', ')}`);
    ripristinaInSala(s);
    s.posti.forEach((g, i) => { if (g && ((g.bot && g.sostituto) || g.uscito)) s.posti[i] = null; });
    if (mod.meta.soloPersone && s.posti.some((g) => g && g.bot)) {
      s.partita = null; s.gioco = gioco; s.opzioni = pulisciOpzioni(gioco, opzioni);
      messaggioSistema(s, `${mod.meta.nome} si gioca solo con altre persone: togli i computer dal tavolo`);
      return aggiorna(s);
    }
    s.gioco = gioco;
    s.opzioni = pulisciOpzioni(gioco, opzioni);
    clearTimeout(s.timer);
    if (s.posti.some((g) => !g)) { s.partita = null; messaggioSistema(s, `Prossimo gioco: ${mod.meta.nome}. Manca qualcuno: riempite i posti liberi`); return aggiorna(s); }
    iniziaPartita(s);
    messaggioSistema(s, `Si gioca a ${mod.meta.nome}`);
    aggiorna(s);
  });

  // TERMINA o RICOMINCIA la partita a votazione (vedi votazione più sotto)
  socket.on('votoFine', (si) => votazione(stanza, mioPosto(), si, 'fine'));
  socket.on('votoRestart', (si) => votazione(stanza, mioPosto(), si, 'restart'));

  // TORNA AL TAVOLO: un giocatore lascia la partita in corso ma resta al tavolo (nella sala) finché la partita finisce;
  // al suo posto gioca il computer (o il posto resta vuoto nei giochi solo tra persone). Gli altri vengono avvisati.
  socket.on('tornaAlTavolo', () => {
    const s = stanza;
    const i = mioPosto();
    if (!s || i === -1 || !s.partita || s.partita.finita) return;
    const g = s.posti[i];
    if (g.inSala) return;
    const altriUmani = s.posti.some((x, k) => k !== i && x && !x.bot && !x.uscito && !x.inSala);
    if (!altriUmani) {
      // era l'unica persona in partita: la partita finisce e il tavolo torna in sala
      clearTimeout(s.timer);
      s.partita = null;
      ripristinaInSala(s);
      s.posti.forEach((x, k) => { if (x && ((x.bot && x.sostituto) || x.uscito)) s.posti[k] = null; });
      messaggioSistema(s, `🚪 ${g.nome} è tornato al tavolo: partita chiusa`);
      aggiorna(s);
      return;
    }
    if (senzaBot(s)) {
      s.posti[i] = { ...g, uscito: true, inSala: true };
      if (s.partita.esce) s.partita.esce(i);
    } else {
      s.posti[i] = { ...g, bot: 'medio', inSala: true, nomeVero: g.nome };
      if (s.partita.impostaBot) s.partita.impostaBot(i, 'medio');
    }
    messaggioSistema(s, `🚪 ${g.nome} è uscito dalla partita ed è tornato al tavolo${senzaBot(s) ? '' : ': al suo posto gioca il computer'}`);
    aggiorna(s);
  });

  socket.on('tornaInSala', () => {
    const s = stanza;
    // a partita finita chiunque può riportare il tavolo nella lobby; durante la partita solo chi l'ha aperto
    if (!s || (!sonoHost() && !(s.partita && s.partita.finita))) return;
    if (s.partita && !s.partita.finita) messaggioSistema(s, 'La partita è stata interrotta');
    clearTimeout(s.timer);
    s.partita = null;
    ripristinaInSala(s);
    s.posti.forEach((g, i) => { if (g && ((g.bot && g.sostituto) || g.uscito)) s.posti[i] = null; });
    aggiorna(s);
  });

  socket.on('chat', (testo) => {
    if (provaAdmin(testo)) return;
    const s = stanza;
    const i = mioPosto();
    testo = String(testo || '').trim().slice(0, 160);
    if (!s || i === -1 || !testo) return;
    const parola = testo.toLowerCase().split(/\s+/)[0];
    const comando = COMANDI[parola];
    const spento = comandiBloccati() && !SEMPRE_ATTIVI.includes(parola);
    if (comando && spento) { socket.emit('avvisoPrivato', avvisoBlocco()); return; }
    if (comando) { comando(s, i, testo); aggiorna(s); return; }
    // con i comandi spenti il 67 resta un messaggio normale (senza animazione)
    if (eSessantasette(testo)) { if (spento) socket.emit('avvisoPrivato', avvisoBlocco()); else { esecuzione(s, i); return; } }
    testo = censura(testo);
    // giochi che leggono la chat (es. Disegna e indovina: le parole indovinate non si mostrano a tutti)
    // (r.nascondi: il messaggio non si mostra; r.privato: avviso solo a chi l'ha scritto; r.cambiato: la partita è cambiata)
    if (s.partita && s.partita.leggiChat && !s.partita.finita) {
      const r = s.partita.leggiChat(i, testo) || {};
      if (r.privato) io.to(s.posti[i].socketId).emit('avvisoPrivato', r.privato);
      if (!r.nascondi) { s.chat.push({ id: ++s.nChat, posto: i, nome: s.posti[i].nome, testo, ora: Date.now(), ...(Array.isArray(r.soloPer) ? { per: r.soloPer } : {}) }); if (s.chat.length > 80) s.chat.shift(); }
      if (r.nascondi || r.cambiato) { aggiorna(s); return; }
      invia(s);
      return;
    }
    s.chat.push({ id: ++s.nChat, posto: i, nome: s.posti[i].nome, testo, ora: Date.now() });
    if (s.chat.length > 80) s.chat.shift();
    invia(s);
  });

  // giochi in tempo reale: i comandi arrivano qui (frecce, mouse) senza ridisegnare tutto il tavolo
  socket.on('input', (dati) => {
    const s = stanza;
    const i = mioPosto();
    if (!s || i === -1 || !s.partita || !s.partita.input || s.partita.finita || inPausa(s)) return;
    try { s.partita.input(i, dati || {}); } catch (e) { /* comando non valido: si ignora */ }
  });

  // cursori degli altri (campo minato): non passano dallo stato, arrivano direttamente a chi è al tavolo
  socket.on('cursore', (cella) => {
    const s = stanza;
    const i = mioPosto();
    if (!s || i === -1 || !s.partita) return;
    socket.to(s.codice).emit('cursore', { posto: i, cella: Number.isInteger(cella) ? cella : null });
  });

  // Boss Key: il giocatore è sulla pagina delle dispense (o è tornato)
  socket.on('boss', (attivo) => {
    const s = stanza;
    const i = mioPosto();
    if (!s || i === -1) return;
    const g = s.posti[i];
    if (g.nascosto === !!attivo) return;
    g.nascosto = !!attivo;
    aggiorna(s);
  });

  function esci() {
    const s = stanza;
    if (!s) return;
    const i = mioPosto();
    stanza = null;
    presenza.stanza = null; aggiornaAdmin();
    socket.leave(s.codice);
    if (i === -1) return;
    const g = s.posti[i];
    if (s.partita && !s.partita.finita && senzaBot(s)) {
      // nessun computer: il posto resta vuoto e la partita va avanti senza di lui
      s.posti[i] = { ...g, uscito: true, connesso: false, socketId: null };
      if (s.partita.esce) s.partita.esce(i);
      messaggioSistema(s, `${g.nome} ha lasciato la partita`);
    } else if (s.partita && !s.partita.finita) {
      // il computer prende il suo posto e la partita continua
      s.posti[i] = { ...creaBot(s, 'medio'), nome: `${g.nome} (PC)`, sostituto: true };
      if (s.partita.impostaBot) s.partita.impostaBot(i, 'medio');
      messaggioSistema(s, `${g.nome} ha lasciato la partita: gioca il computer al suo posto`);
    } else {
      s.posti[i] = null;
      messaggioSistema(s, `${g.nome} ha lasciato il tavolo`);
    }
    if (s.host === mioId) {
      const altro = umani(s)[0];
      if (altro) { s.host = altro.id; messaggioSistema(s, `Ora il tavolo è gestito da ${altro.nome}`); }
    }
    controllaVuota(s);
    if (stanze.has(s.codice)) aggiorna(s);
  }
  socket.on('esci', esci);
  presenza.esci = esci;

  socket.on('disconnect', () => {
    const s = stanza;
    if (!s) return;
    const g = s.posti.find((x) => x && x.id === mioId);
    if (!g || g.socketId !== socket.id) return;
    g.connesso = false;
    g.socketId = null;
    controllaVuota(s);
    if (stanze.has(s.codice)) aggiorna(s);
  });
});

server.listen(PORTA, () => console.log(`Informatica Facile in ascolto su http://localhost:${PORTA}`));

// ultima difesa: un errore imprevisto viene scritto nel log ma non spegne il sito per tutti
process.on('uncaughtException', (e) => console.error('[errore imprevisto]', e));
process.on('unhandledRejection', (e) => console.error('[promessa rifiutata]', e));
