// RISIKO sulla mappa del MONDO (42 territori, confini classici) o su una mappa INVENTATA (24 territori), entrambe in
// giochi/risiko-mappa.js. Regole classiche: schieramento iniziale, rinforzi (territori/3, minimo 3, più i continenti
// e i tris di carte), attacchi con i dadi 3 contro 2, conquista con spostamento delle armate, una carta se hai
// conquistato almeno un territorio, uno spostamento a fine turno. Si vince conquistando il mondo oppure completando
// la propria missione segreta.
const { MAPPE, valoreTris } = require('./risiko-mappa');
// armate iniziali a testa (su 42 territori come nel Risiko; sulla mappa piccola in proporzione)
const ARMATE_INIZIALI = { mondo: { 2: 40, 3: 35, 4: 30, 5: 25, 6: 20 }, inventata: { 2: 26, 3: 22, 4: 19, 5: 16, 6: 14 } };
const MAX_GIRI = 150; // dopo tanti giri senza vincitore vince chi ha più territori
const COLORI = ['rosso', 'blu', 'verde', 'giallo', 'viola', 'nero'];
// missioni (le "a scelta" chiedono un continente in più, quale si vuole)
const MISSIONI = {
  mondo: { territori: 24, territori2: 18, continenti: [{ c: ['nam', 'afr'] }, { c: ['nam', 'oce'] }, { c: ['asi', 'sam'] }, { c: ['asi', 'afr'] }, { c: ['eur', 'sam'], piu: 1 }, { c: ['eur', 'oce'], piu: 1 }] },
  inventata: { territori: 18, territori2: 14, continenti: [{ c: ['centro', 'sud'] }, { c: ['nord', 'est'] }, { c: ['ovest', 'isole'] }, { c: ['ovest', 'sud'] }, { c: ['est', 'isole', 'sud'] }] },
};

function mescola(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const dado = () => 1 + Math.floor(Math.random() * 6);

function testoMissione(m, M) {
  const nomeCont = (id) => M.CONTINENTI.find((c) => c.id === id).nome;
  const quanti = MISSIONI[M.id];
  if (m.tipo === 'territori') return `Conquista ${m.n} territori`;
  if (m.tipo === 'territori2') return `Conquista ${m.n} territori e tieni almeno 2 armate in ognuno`;
  if (m.tipo === 'continenti') return `Conquista ${m.c.map(nomeCont).join(', ').replace(/, ([^,]*)$/, ' e $1')}${m.piu ? ' più un terzo continente a scelta' : ''}`;
  if (m.tipo === 'distruggi') return `Distruggi le armate del giocatore ${COLORI[m.colore]} (se lo elimina un altro, o se il ${COLORI[m.colore]} sei tu: conquista ${quanti.territori} territori)`;
  return '';
}

class Risiko {
  constructor({ n, primo = 0, opzioni = {} }) {
    this.id = 'risiko';
    this.n = n;
    this.obiettivo = opzioni.obiettivo === 'missioni' ? 'missioni' : 'mondo';
    this.M = MAPPE[opzioni.mappa === 'inventata' ? 'inventata' : 'mondo'];
    const { TERRITORI } = this.M;
    this.velocitaBot = 0.55; // il server fa aspettare meno il computer (il turno ha tante piccole mosse)
    this.terr = {};
    const ordine = mescola([...TERRITORI]);
    ordine.forEach((t, i) => { this.terr[t] = { owner: (primo + i) % n, armate: 1 }; });
    this.daPiazzare = Array.from({ length: n }, (_, p) => ARMATE_INIZIALI[this.M.id][n] - this.territoriDi(p).length);
    this.carte = Array.from({ length: n }, () => []);
    this.mazzo = mescola(this.M.CARTE.map((c) => ({ ...c })));
    this.scarti = [];
    this.tris = 0;
    this.vivo = new Array(n).fill(true);
    this.eliminatoDa = new Array(n).fill(null);
    this.missioni = this.obiettivo === 'missioni' ? this.daiMissioni(n) : null;
    this.fase = 'schieramento';
    this.turno = null;
    this.primo = primo % n;
    this.giro = 0;
    this.log = [];
    this.ultimoLancio = null;
    this.nLanci = 0;
    this.conquista = null;
    this.inAttesa = false; this.finita = false; this.risultato = null; this.evento = null; this.nEv = 0;
  }

  daiMissioni(n) {
    const q = MISSIONI[this.M.id];
    const tutte = [{ tipo: 'territori', n: q.territori }, { tipo: 'territori2', n: q.territori2 }, ...q.continenti.map((x) => ({ tipo: 'continenti', ...x }))];
    for (let k = 0; k < n; k++) tutte.push({ tipo: 'distruggi', colore: k });
    const out = [];
    const pool = mescola(tutte);
    for (let p = 0; p < n; p++) {
      const i = pool.findIndex((m) => !(m.tipo === 'distruggi' && m.colore === p));
      out.push(pool.splice(i, 1)[0]);
    }
    return out;
  }

  annuncia(posto, testo, testoIo, forte = false, extra = {}) { this.evento = { id: ++this.nEv, posto, testo, testoIo, forte, ...extra }; }
  scrivi(t) { this.log.push(t); if (this.log.length > 12) this.log.shift(); }
  territoriDi(p) { return this.M.TERRITORI.filter((t) => this.terr[t].owner === p); }
  continentiDi(p) { return this.M.CONTINENTI.filter((c) => [...c.terr].every((t) => this.terr[t].owner === p)); }
  rinforziBase(p) { return Math.max(3, Math.floor(this.territoriDi(p).length / 3)) + this.continentiDi(p).reduce((s, c) => s + c.bonus, 0); }
  trisPossibili(p) {
    const cs = this.carte[p], out = [];
    for (let i = 0; i < cs.length; i++) for (let j = i + 1; j < cs.length; j++) for (let k = j + 1; k < cs.length; k++) {
      const v = valoreTris([cs[i].figura, cs[j].figura, cs[k].figura]);
      if (v) out.push({ ids: [cs[i].id, cs[j].id, cs[k].id], valore: v });
    }
    return out;
  }

  attesi() {
    if (this.fase !== 'schieramento') return [];
    return this.daPiazzare.map((x, p) => (x > 0 ? p : -1)).filter((p) => p >= 0);
  }

  // controlla un piazzamento { territorio: armate } e lo applica
  piazza(p, piazza, totale) {
    if (!piazza || typeof piazza !== 'object') return 'Piazzamento non valido';
    let somma = 0;
    for (const [t, v] of Object.entries(piazza)) {
      const k = Number(v);
      if (!this.terr[t] || this.terr[t].owner !== p) return `${this.M.NOMI[t] || t} non è tuo`;
      if (!Number.isInteger(k) || k < 0) return 'Numero di armate non valido';
      somma += k;
    }
    if (somma !== totale) return `Devi piazzare esattamente ${totale} armate (ne hai messe ${somma})`;
    for (const [t, v] of Object.entries(piazza)) this.terr[t].armate += Number(v);
    return null;
  }

  azione(p, a) {
    if (this.finita) return { errore: 'La partita è finita' };
    if (!a || !a.tipo) return { errore: 'Mossa non valida' };
    if (this.fase === 'schieramento') {
      if (a.tipo !== 'schiera') return { errore: 'Prima si schierano le armate' };
      if (this.daPiazzare[p] <= 0) return { errore: 'Hai già schierato: aspetta gli altri' };
      const e = this.piazza(p, a.piazza, this.daPiazzare[p]);
      if (e) return { errore: e };
      this.daPiazzare[p] = 0;
      if (this.daPiazzare.every((x) => x === 0)) this.iniziaTurno(this.primo);
      return { ok: true };
    }
    if (p !== this.turno) return { errore: 'Non è il tuo turno' };
    const f = this.fase;
    if (a.tipo === 'tris') {
      if (f !== 'rinforzi') return { errore: 'I tris si giocano all\'inizio del turno' };
      const ids = Array.isArray(a.carte) ? a.carte.map(String) : [];
      const mie = ids.map((id) => this.carte[p].find((c) => c.id === id));
      if (ids.length !== 3 || new Set(ids).size !== 3 || mie.some((c) => !c)) return { errore: 'Scegli tre tue carte' };
      const v = valoreTris(mie.map((c) => c.figura));
      if (!v) return { errore: 'Queste tre carte non fanno un tris' };
      this.carte[p] = this.carte[p].filter((c) => !ids.includes(c.id));
      this.scarti.push(...mie);
      // +2 armate su ogni territorio delle carte che è tuo
      let extra = 0;
      for (const c of mie) if (c.territorio && this.terr[c.territorio].owner === p) { this.terr[c.territorio].armate += 2; extra += 2; }
      this.rinforzi += v;
      this.tris++;
      this.annuncia(p, `gioca un tris: +${v} armate${extra ? ` (e +${extra} sui suoi territori delle carte)` : ''} 🃏`, `giochi un tris: +${v} armate${extra ? ` (e +${extra} sui tuoi territori delle carte)` : ''} 🃏`);
      this.scrivi(`${p}|tris da ${v}`);
      return { ok: true };
    }
    if (a.tipo === 'rinforza') {
      if (f !== 'rinforzi') return { errore: 'Non è il momento dei rinforzi' };
      if (this.carte[p].length >= 5 && this.trisPossibili(p).length) return { errore: 'Hai 5 carte o più: prima devi giocare un tris' };
      const e = this.piazza(p, a.piazza, this.rinforzi);
      if (e) return { errore: e };
      this.rinforzi = 0;
      this.fase = 'attacco';
      return { ok: true };
    }
    if (a.tipo === 'attacca') {
      if (f !== 'attacco') return { errore: f === 'conquista' ? 'Prima decidi quante armate spostare nel territorio conquistato' : 'Non è il momento di attaccare' };
      return this.attacca(p, a);
    }
    if (a.tipo === 'occupa') {
      if (f !== 'conquista') return { errore: 'Nessun territorio da occupare' };
      const c = this.conquista;
      const k = Number(a.n);
      if (!Number.isInteger(k) || k < c.min || k > c.max) return { errore: `Sposta da ${c.min} a ${c.max} armate` };
      this.occupa(k);
      return { ok: true };
    }
    if (a.tipo === 'fineAttacchi') {
      if (f !== 'attacco') return { errore: 'Non stai attaccando' };
      this.fase = 'spostamento';
      return { ok: true };
    }
    if (a.tipo === 'sposta') {
      if (f !== 'spostamento' && f !== 'attacco') return { errore: 'Non è il momento dello spostamento' };
      const da = this.terr[a.da], ver = this.terr[a.a];
      const k = Number(a.n);
      if (!da || !ver || da.owner !== p || ver.owner !== p) return { errore: 'Sposta tra due tuoi territori' };
      if (!this.M.ADIACENTI[a.da].includes(a.a)) return { errore: 'I territori devono confinare' };
      if (!Number.isInteger(k) || k < 1 || k > da.armate - 1) return { errore: `Puoi spostare da 1 a ${da.armate - 1} armate` };
      da.armate -= k; ver.armate += k;
      this.scrivi(`${p}|sposta ${k} da ${this.M.NOMI[a.da]} a ${this.M.NOMI[a.a]}`);
      return this.fineTurno(p);
    }
    if (a.tipo === 'fineTurno') {
      if (f !== 'spostamento' && f !== 'attacco') return { errore: 'Prima finisci i rinforzi' };
      return this.fineTurno(p);
    }
    return { errore: 'Mossa non valida' };
  }

  attacca(p, a) {
    const da = this.terr[a.da], ver = this.terr[a.a];
    if (!da || !ver) return { errore: 'Territorio sconosciuto' };
    if (da.owner !== p) return { errore: 'Attacca da un tuo territorio' };
    if (ver.owner === p) return { errore: 'Quel territorio è già tuo' };
    if (!this.M.ADIACENTI[a.da].includes(a.a)) return { errore: 'Puoi attaccare solo un territorio confinante' };
    if (da.armate < 2) return { errore: 'Servono almeno 2 armate per attaccare' };
    const scelti = [1, 2, 3].includes(Number(a.dadi)) ? Number(a.dadi) : 3;
    const fino = Math.max(1, Number(a.fino) || 1); // nel lancio continuo ci si ferma quando restano queste armate
    const difensore = ver.owner;
    let persiA = 0, persiD = 0, lanci = 0, ultimo = null;
    do {
      const nA = Math.min(scelti, da.armate - 1, 3), nD = Math.min(2, ver.armate);
      const dA = Array.from({ length: nA }, dado).sort((x, y) => y - x);
      const dD = Array.from({ length: nD }, dado).sort((x, y) => y - x);
      let pa = 0, pd = 0;
      for (let i = 0; i < Math.min(nA, nD); i++) { if (dA[i] > dD[i]) pd++; else pa++; }
      da.armate -= pa; ver.armate -= pd; persiA += pa; persiD += pd; lanci++;
      ultimo = { dA, dD, pa, pd, nA };
    } while (a.continuo && ver.armate > 0 && da.armate > fino && da.armate >= 2);
    this.ultimoLancio = { id: ++this.nLanci, da: a.da, a: a.a, attaccante: p, difensore, dadiA: ultimo.dA, dadiD: ultimo.dD, persiA, persiD, lanci };
    this.scrivi(`${p}|${this.M.NOMI[a.da]} → ${this.M.NOMI[a.a]}: ${lanci > 1 ? `${lanci} lanci, ` : ''}perde ${persiA}, ${this.M.NOMI[a.a]} perde ${persiD}`);
    if (ver.armate <= 0) {
      ver.owner = p; ver.armate = 0;
      const min = Math.min(ultimo.nA, da.armate - 1), max = da.armate - 1;
      this.conquistato = true;
      this.annuncia(p, `conquista ${this.M.NOMI[a.a]}! ⚔️`, `conquisti ${this.M.NOMI[a.a]}! ⚔️`, false, { bersaglio: difensore, testoTe: `ti conquista ${this.M.NOMI[a.a]} ⚔️` });
      this.conquista = { da: a.da, a: a.a, min, max, difensore };
      if (min === max) this.occupa(min);
      else this.fase = 'conquista';
    }
    return { ok: true };
  }

  occupa(k) {
    const c = this.conquista;
    this.terr[c.da].armate -= k;
    this.terr[c.a].armate += k;
    this.conquista = null;
    this.fase = 'attacco';
    const d = c.difensore;
    if (!this.territoriDi(d).length) {
      // eliminato: le sue carte passano a chi l'ha eliminato
      this.vivo[d] = false;
      this.eliminatoDa[d] = this.turno;
      this.carte[this.turno].push(...this.carte[d]);
      this.carte[d] = [];
      this.annuncia(this.turno, 'elimina @ dalla partita! 💀', 'elimini @ dalla partita! 💀', true, { bersaglio: d, testoTe: 'ti ha eliminato 💀' });
    }
    this.controllaVittoria();
  }

  missioneFatta(p) {
    const m = this.missioni && this.missioni[p];
    if (!m) return false;
    const miei = this.territoriDi(p);
    const tipo = m.tipo === 'distruggi' && (m.colore === p || (!this.vivo[m.colore] && this.eliminatoDa[m.colore] !== p) || m.colore >= this.n) ? 'territori' : m.tipo;
    if (tipo === 'territori') return miei.length >= (m.tipo === 'distruggi' ? MISSIONI[this.M.id].territori : m.n);
    if (tipo === 'territori2') return miei.filter((t) => this.terr[t].armate >= 2).length >= m.n;
    if (tipo === 'continenti') {
      const mio = (id) => [...this.M.CONTINENTI.find((c) => c.id === id).terr].every((t) => this.terr[t].owner === p);
      // "più un terzo continente a scelta": serve un altro continente intero oltre a quelli scritti
      return m.c.every(mio) && (!m.piu || this.M.CONTINENTI.some((c) => !m.c.includes(c.id) && mio(c.id)));
    }
    if (tipo === 'distruggi') return !this.vivo[m.colore] && this.eliminatoDa[m.colore] === p;
    return false;
  }

  controllaVittoria() {
    if (this.finita) return;
    const p = this.turno;
    if (this.territoriDi(p).length === this.M.TERRITORI.length) return this.chiudi([p], 'Conquista del mondo!');
    if (this.obiettivo === 'missioni' && this.missioneFatta(p)) return this.chiudi([p], `Missione compiuta: ${testoMissione(this.missioni[p], this.M)}`);
    if (this.vivo.filter(Boolean).length === 1) return this.chiudi([this.vivo.indexOf(true)], 'Ultimo rimasto');
  }

  iniziaTurno(p) {
    this.turno = p;
    this.fase = 'rinforzi';
    this.rinforzi = this.rinforziBase(p);
    this.conquistato = false;
    this.conquista = null;
  }

  fineTurno(p) {
    if (this.conquistato) {
      if (!this.mazzo.length) { this.mazzo = mescola(this.scarti); this.scarti = []; }
      const c = this.mazzo.pop();
      if (c) this.carte[p].push(c);
    }
    // missione "territori con 2 armate" si controlla anche a fine turno (dopo lo spostamento)
    this.controllaVittoria();
    if (this.finita) return { ok: true };
    let q = p;
    do { q = (q + 1) % this.n; if (q === this.primo) this.giro++; } while (!this.vivo[q]);
    if (this.giro >= MAX_GIRI) {
      const conta = Array.from({ length: this.n }, (_, i) => this.territoriDi(i).length);
      const max = Math.max(...conta);
      const v = conta.map((x, i) => (x === max ? i : -1)).filter((i) => i >= 0);
      this.chiudi(v.length === 1 ? v : [], `Dopo ${MAX_GIRI} giri vince chi ha più territori`);
      return { ok: true };
    }
    this.iniziaTurno(q);
    return { ok: true };
  }

  chiudi(vincitori, titolo) {
    this.finita = true;
    this.fase = 'fine';
    this.turno = null;
    const conta = Array.from({ length: this.n }, (_, i) => this.territoriDi(i).length);
    this.risultato = { fazioni: conta.map((x, i) => ({ posti: [i], punti: x })), etichetta: 'territori', pareggio: !vincitori.length, vincitori, titolo };
    if (vincitori.length === 1) this.annuncia(vincitori[0], `vince: ${titolo}`, `hai vinto: ${titolo}`, true);
  }

  vista(p) {
    return {
      gioco: this.id, n: this.n, turno: this.turno, inAttesa: false, finita: this.finita, risultato: this.risultato, evento: this.evento,
      mappa: this.M.id, fase: this.fase, obiettivo: this.obiettivo, terr: this.terr, daPiazzare: this.daPiazzare, rinforzi: this.turno === p ? this.rinforzi : null,
      rinforziTurno: this.fase === 'rinforzi' ? this.rinforzi : null,
      carte: this.carte[p] || [], nCarte: this.carte.map((c) => c.length), tris: p === this.turno && this.fase === 'rinforzi' ? this.trisPossibili(p) : [],
      missione: this.missioni ? testoMissione(this.missioni[p], this.M) : null,
      missioni: this.missioni && this.finita ? this.missioni.map((m) => testoMissione(m, this.M)) : null,
      vivo: this.vivo, conquista: this.turno === p ? this.conquista : null, conquistaInCorso: this.conquista,
      ultimoLancio: this.ultimoLancio, log: this.log, giro: this.giro + 1, maxGiri: MAX_GIRI,
      territori: Array.from({ length: this.n }, (_, i) => this.territoriDi(i).length),
      armateTot: Array.from({ length: this.n }, (_, i) => this.territoriDi(i).reduce((s, t) => s + this.terr[t].armate, 0)),
      rinforziDi: Array.from({ length: this.n }, (_, i) => this.rinforziBase(i)),
      continenti: this.M.CONTINENTI.map((c) => ({ id: c.id, owner: [...c.terr].every((t) => this.terr[t].owner === this.terr[c.terr[0]].owner) ? this.terr[c.terr[0]].owner : null })),
      conquistato: this.turno === p ? this.conquistato : false,
    };
  }
}

// ======================= computer =======================
// probabilità di ogni esito di un lancio (dadi attacco × dadi difesa), calcolate enumerando tutti i dadi
const ESITI = {};
for (let nA = 1; nA <= 3; nA++) for (let nD = 1; nD <= 2; nD++) {
  const conta = {};
  const tot = 6 ** (nA + nD);
  for (let k = 0; k < tot; k++) {
    let x = k; const d = [];
    for (let i = 0; i < nA + nD; i++) { d.push(1 + (x % 6)); x = Math.floor(x / 6); }
    const a = d.slice(0, nA).sort((u, v) => v - u), b = d.slice(nA).sort((u, v) => v - u);
    let pa = 0, pd = 0;
    for (let i = 0; i < Math.min(nA, nD); i++) { if (a[i] > b[i]) pd++; else pa++; }
    conta[`${pa},${pd}`] = (conta[`${pa},${pd}`] || 0) + 1 / tot;
  }
  ESITI[`${nA},${nD}`] = Object.entries(conta).map(([k, pr]) => { const [pa, pd] = k.split(',').map(Number); return { pa, pd, pr }; });
}
// attacco "fino in fondo" con a armate che possono attaccare (quelle nel territorio meno una) contro d difensori:
// probabilità di conquistare e armate attaccanti che restano in media
const memo = new Map();
function battaglia(a, d) {
  if (d <= 0) return { p: 1, resto: a };
  if (a <= 0) return { p: 0, resto: 0 };
  const k = a * 1000 + d;
  if (memo.has(k)) return memo.get(k);
  let p = 0, resto = 0;
  for (const e of ESITI[`${Math.min(3, a)},${Math.min(2, d)}`]) { const r = battaglia(a - e.pa, d - e.pd); p += e.pr * r.p; resto += e.pr * r.resto; }
  const out = { p, resto };
  memo.set(k, out);
  return out;
}
function probVittoria(att, dif) { return battaglia(Math.min(60, att - 1), Math.min(60, dif)).p; }
// il medio ragiona "a occhio": una stima grossolana basata sul rapporto tra le armate
function stimaAOcchio(att, dif) { const a = att - 1; return Math.max(0, Math.min(1, 0.5 + (a / Math.max(1, dif) - 1) * 0.4)); }

function valutaTerritori(g, p, liv) {
  // quanto mi interessa ogni continente (quanta parte ne ho, quanto vale, missione)
  const m = g.missioni && g.missioni[p];
  return g.M.CONTINENTI.map((c) => {
    const miei = [...c.terr].filter((t) => g.terr[t].owner === p).length;
    let v = (miei / c.terr.length) * 2 + c.bonus / c.terr.length;
    if (liv === 'difficile' && m && m.tipo === 'continenti' && m.c.includes(c.id)) v += 2.5;
    return { id: c.id, v, miei, tot: c.terr.length };
  });
}

// DIFFICILE: quanto vale per p conquistare il territorio x (continenti completati o rotti, carta, eliminazioni, missione)
function valoreConquista(g, p, x) {
  const c = g.M.CONTINENTI.find((y) => y.id === g.M.continenteDi[x]);
  const altri = [...c.terr].filter((t) => t !== x);
  let v = 1;
  if (altri.every((t) => g.terr[t].owner === p)) v += c.bonus * 3;
  else v += (altri.filter((t) => g.terr[t].owner === p).length / c.terr.length) * c.bonus;
  const dif = g.terr[x].owner;
  if ([...c.terr].every((t) => g.terr[t].owner === dif)) v += c.bonus * 2;
  if (!g.conquistato) v += 3;
  if (g.territoriDi(dif).length === 1) v += 3 + g.carte[dif].length * 2;
  const m = g.missioni && g.missioni[p];
  if (m && m.tipo === 'continenti' && m.c.includes(c.id)) v += 2;
  if (m && m.tipo === 'distruggi' && m.colore === dif) v += 2;
  return v;
}
function migliorAttacco(g, p, extra = {}) {
  let meglio = null;
  for (const t of g.territoriDi(p)) {
    const A = g.terr[t].armate + (extra[t] || 0);
    if (A < 2) continue;
    for (const x of g.M.ADIACENTI[t]) {
      if (g.terr[x].owner === p) continue;
      const b = battaglia(Math.min(60, A - 1), Math.min(60, g.terr[x].armate));
      const perse = (A - 1) - b.resto;
      const ev = b.p * valoreConquista(g, p, x) - perse * 0.3 - (1 - b.p) * 1.5;
      if (!meglio || ev > meglio.ev) meglio = { da: t, a: x, ev, p: b.p };
    }
  }
  return meglio;
}

function sceltaPiazza(g, p, liv, totale) {
  const miei = g.territoriDi(p);
  const confine = miei.filter((t) => g.M.ADIACENTI[t].some((u) => g.terr[u].owner !== p));
  const lista = confine.length ? confine : miei;
  const piazza = {};
  const metti = (t, k) => { piazza[t] = (piazza[t] || 0) + k; };
  if (liv === 'facile') {
    for (let k = 0; k < totale; k++) metti(lista[Math.floor(Math.random() * lista.length)], 1);
    return piazza;
  }
  const cont = valutaTerritori(g, p, liv);
  const pesoCont = (t) => cont.find((c) => c.id === g.M.continenteDi[t]).v;
  const minaccia = (t) => g.M.ADIACENTI[t].filter((u) => g.terr[u].owner !== p).reduce((s, u) => s + g.terr[u].armate, 0);
  // punteggio: territori di confine nei continenti che mi interessano, con nemici deboli vicino da prendere
  const punteggio = (t) => {
    const nemici = g.M.ADIACENTI[t].filter((u) => g.terr[u].owner !== p);
    const facili = nemici.filter((u) => g.terr[u].armate <= 2 && (liv === 'medio' || pesoCont(u) > 1)).length;
    return pesoCont(t) * 2 + facili * 1.5 + (liv === 'difficile' ? minaccia(t) / Math.max(1, g.terr[t].armate) : 0) + Math.random() * (liv === 'medio' ? 1.5 : 0.3);
  };
  const ordinati = [...lista].sort((a, b) => punteggio(b) - punteggio(a));
  if (liv === 'medio') {
    metti(ordinati[0], Math.ceil(totale * 0.6));
    if (totale - Math.ceil(totale * 0.6) > 0) metti(ordinati[Math.min(1, ordinati.length - 1)], totale - Math.ceil(totale * 0.6));
    return piazza;
  }
  // difficile: difende i continenti che ha già (confini minacciati) e concentra il resto dove l'attacco rende di più
  let resto = totale;
  const mieiCont = g.continentiDi(p).map((c) => c.id);
  for (const t of lista) {
    if (!mieiCont.includes(g.M.continenteDi[t]) || resto <= 0) continue;
    const serve = Math.max(0, Math.ceil(minaccia(t) * 0.8) - g.terr[t].armate);
    const k = Math.min(resto, serve, Math.ceil(totale / 2));
    if (k > 0) { metti(t, k); resto -= k; }
  }
  if (resto > 0) {
    let dove = ordinati[0], migliore = -Infinity;
    for (const t of lista) { const m = migliorAttacco(g, p, { [t]: resto + (piazza[t] || 0) }); if (m && m.da === t && m.ev > migliore) { migliore = m.ev; dove = t; } }
    metti(dove, resto);
  }
  return piazza;
}

function attacchiPossibili(g, p) {
  const out = [];
  for (const t of g.territoriDi(p)) {
    if (g.terr[t].armate < 2) continue;
    for (const u of g.M.ADIACENTI[t]) if (g.terr[u].owner !== p) out.push({ da: t, a: u });
  }
  return out;
}

function bot(g, p, liv) {
  if (g.fase === 'schieramento') return { tipo: 'schiera', piazza: sceltaPiazza(g, p, liv, g.daPiazzare[p]) };
  if (g.fase === 'rinforzi') {
    const tris = g.trisPossibili(p);
    if (tris.length && (liv !== 'facile' || g.carte[p].length >= 5)) {
      // si gioca il tris che vale di più (il facile solo quando è obbligato)
      const migliore = tris.reduce((a, b) => (b.valore > a.valore ? b : a));
      return { tipo: 'tris', carte: migliore.ids };
    }
    return { tipo: 'rinforza', piazza: sceltaPiazza(g, p, liv, g.rinforzi) };
  }
  if (g.fase === 'conquista') {
    const c = g.conquista;
    if (liv === 'facile') return { tipo: 'occupa', n: c.min };
    const nemiciDa = g.M.ADIACENTI[c.da].filter((u) => g.terr[u].owner !== p).reduce((s, u) => s + g.terr[u].armate, 0);
    const nemiciA = g.M.ADIACENTI[c.a].filter((u) => g.terr[u].owner !== p).reduce((s, u) => s + g.terr[u].armate, 0);
    let k;
    if (!nemiciDa) k = c.max;
    else if (!nemiciA) k = c.min;
    else k = Math.round(c.min + (c.max - c.min) * (nemiciA / (nemiciA + nemiciDa)));
    return { tipo: 'occupa', n: Math.max(c.min, Math.min(c.max, k)) };
  }
  if (g.fase === 'attacco') {
    const att = attacchiPossibili(g, p);
    let scelta = null;
    if (liv === 'facile') {
      const buoni = att.filter((x) => g.terr[x.da].armate > g.terr[x.a].armate + 1);
      if (buoni.length && Math.random() < 0.75) scelta = buoni[Math.floor(Math.random() * buoni.length)];
      if (scelta) return { tipo: 'attacca', da: scelta.da, a: scelta.a, dadi: 3, continuo: Math.random() < 0.5 };
    } else if (liv === 'difficile' && g.vivo.filter(Boolean).length > 2) {
      // in tanti: attacca solo quando ne vale davvero la pena (valore atteso) e lascia che gli altri si logorino.
      // In due si usa il ragionamento sotto (continenti, carta, rompere i continenti), che nelle prove rende di più.
      const m = migliorAttacco(g, p);
      if (m && m.ev > 1 && m.p >= 0.45) {
        const A = g.terr[m.da].armate;
        return { tipo: 'attacca', da: m.da, a: m.a, dadi: 3, continuo: true, fino: Math.max(1, Math.floor(A * 0.2)) };
      }
    } else {
      const cont = valutaTerritori(g, p, liv);
      const m = g.missioni && g.missioni[p];
      let meglio = -Infinity;
      for (const x of att) {
        const A = g.terr[x.da].armate, D = g.terr[x.a].armate;
        const pv = liv === 'medio' ? stimaAOcchio(A, D) : probVittoria(A, D);
        const c = cont.find((y) => y.id === g.M.continenteDi[x.a]);
        let v = pv * 2 - 1;
        if (liv === 'difficile') {
          v += c.v * 0.3;
          if (c.miei === c.tot - 1) v += 1.2; // completa un continente
          const cc = g.M.CONTINENTI.find((y) => y.id === g.M.continenteDi[x.a]);
          if ([...cc.terr].every((t) => g.terr[t].owner === g.terr[x.a].owner)) v += 0.9; // rompe il continente di un altro
          if (!g.conquistato && D <= 2) v += 0.6; // una conquista per la carta
          if (m && m.tipo === 'distruggi' && g.terr[x.a].owner === m.colore) v += 1;
          if (pv < 0.6) v -= 1.5;
        } else if (A < D + 2) v -= 2;
        if (v > meglio) { meglio = v; scelta = x; }
      }
      if (scelta && meglio > (liv === 'difficile' ? 0 : 0.2)) {
        const A = g.terr[scelta.da].armate;
        return { tipo: 'attacca', da: scelta.da, a: scelta.a, dadi: 3, continuo: true, fino: liv === 'difficile' ? Math.max(1, Math.floor(A * 0.25)) : Math.max(1, Math.floor(A * 0.35)) };
      }
    }
    // niente attacchi: spostamento dall'interno verso il confine
    return spostamentoBot(g, p, liv) || { tipo: 'fineTurno' };
  }
  if (g.fase === 'spostamento') return spostamentoBot(g, p, liv) || { tipo: 'fineTurno' };
  return { tipo: 'fineTurno' };
}

function spostamentoBot(g, p, liv) {
  if (liv === 'facile') return null;
  const confine = (t) => g.M.ADIACENTI[t].some((u) => g.terr[u].owner !== p);
  let meglio = null;
  for (const t of g.territoriDi(p)) {
    if (confine(t) || g.terr[t].armate < 2) continue;
    for (const u of g.M.ADIACENTI[t]) {
      if (g.terr[u].owner !== p) continue;
      const k = g.terr[t].armate - 1;
      if (!meglio || k > meglio.n || (confine(u) && !confine(meglio.a))) meglio = { da: t, a: u, n: k };
    }
  }
  return meglio ? { tipo: 'sposta', ...meglio } : null;
}

module.exports = {
  meta: {
    id: 'risiko',
    nome: 'Risiko',
    tipo: 'tabellone',
    giocatori: [2, 3, 4, 5, 6],
    descrizione: 'Conquista il mondo con i dadi: la mappa vera con 42 territori (o una inventata), carte e missioni segrete.',
    alias: ['risiko', 'risk', 'conquista', 'guerra', 'strategia', 'dadi', 'mappa del mondo'],
    opzioni: [
      { id: 'mappa', nome: 'Mappa', valori: ['mondo', 'inventata'], etichette: ['Il mondo (42 territori)', 'Inventata (24 territori, più corta)'], predefinito: 'mondo' },
      { id: 'obiettivo', nome: 'Obiettivo', valori: ['mondo', 'missioni'], etichette: ['Conquista del mondo', 'Missioni segrete'], predefinito: 'mondo' },
    ],
    regole: [
      'Si gioca sulla mappa del mondo, con i 42 territori e i confini del Risiko classico divisi in 6 continenti: Nord America (9 territori), Sud America (4), Europa (7), Africa (6), Asia (12) e Oceania (4). In alternativa c\'è una mappa inventata più piccola, di 24 territori (Nordalia, Ovestria, Centralia, Estlandia, Meridia, Isole di Corallo), per partite più corte.',
      'Due territori confinano se si toccano o se sono uniti da una linea tratteggiata sul mare (per esempio Brasile e Africa del Nord, o Alaska e Kamchatka, che si toccano "dietro" la mappa).',
      'All\'inizio i territori sono divisi a caso, con un\'armata ciascuno. Poi tutti insieme schierano le armate che restano: sul mondo 40 a testa in 2, 35 in 3, 30 in 4, 25 in 5, 20 in 6 (sulla mappa inventata 26, 22, 19, 16, 14).',
      'Il turno ha tre momenti. RINFORZI: ricevi un\'armata ogni 3 territori (almeno 3), più il bonus di ogni continente che possiedi tutto intero (sul mondo: Asia 7, Nord America ed Europa 5, Africa 3, Sud America e Oceania 2; sulla mappa inventata: Centralia 5, Nordalia, Ovestria ed Estlandia 3, Meridia e Isole di Corallo 2), più i tris di carte. Mettile sui tuoi territori.',
      'ATTACCHI: da un tuo territorio con almeno 2 armate attacchi un territorio nemico confinante, quante volte vuoi. L\'attaccante tira fino a 3 dadi (uno in meno delle armate che ha nel territorio), il difensore fino a 2. Si confrontano il dado più alto con il più alto e il secondo con il secondo: vince il più alto, a parità vince chi difende. Chi perde il confronto perde un\'armata.',
      'Con "Attacca fino in fondo" i dadi si tirano da soli finché conquisti il territorio o ti resta una sola armata.',
      'Quando il difensore resta senza armate conquisti il territorio e ci sposti almeno tante armate quanti dadi hai tirato nell\'ultimo lancio (al massimo tutte meno una).',
      'SPOSTAMENTO: a fine turno puoi fare un solo spostamento di armate da un tuo territorio a un tuo territorio confinante (almeno un\'armata resta dove era). Poi tocca al prossimo.',
      'Carte: se nel turno hai conquistato almeno un territorio prendi una carta (fante, cannone, cavaliere o jolly). Tris: 3 cannoni = 4 armate, 3 fanti = 6, 3 cavalieri = 8, uno di ogni tipo = 10, un jolly con due uguali = 12. Per ogni carta del tris che raffigura un tuo territorio ricevi 2 armate in più direttamente lì. I tris si giocano durante i rinforzi; con 5 carte o più sei obbligato.',
      'Chi viene eliminato consegna le sue carte a chi lo ha eliminato.',
      'Conquista del mondo: vince chi conquista tutti i territori. Missioni segrete: ognuno riceve una missione che vede solo lui; vince chi la completa per primo. Sul mondo le missioni sono quelle classiche: 24 territori; 18 territori con almeno 2 armate; Nord America e Africa; Nord America e Oceania; Asia e Sud America; Asia e Africa; Europa, Sud America e un terzo continente a scelta; Europa, Oceania e un terzo a scelta; distruggere un colore (se lo elimina un altro, o se quel colore sei tu, diventa conquistare 24 territori). Sulla mappa inventata sono più corte (18 territori, 14 con 2 armate, coppie di continenti).',
      `Se dopo ${MAX_GIRI} giri nessuno ha vinto, vince chi ha più territori.`,
      'Il computer facile attacca un po\' a caso e mette le armate dove capita; il medio attacca solo quando ha più armate; il difficile calcola le probabilità esatte delle battaglie, punta ai continenti (e alla sua missione), difende i confini, rompe i continenti degli altri e cerca sempre una conquista per la carta.',
    ],
  },
  crea: (o) => new Risiko(o),
  bot,
  _test: { Risiko, MAPPE, probVittoria, testoMissione, MAX_GIRI, valoreTris },
};
