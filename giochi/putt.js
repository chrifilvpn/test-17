// PUTT PARTY 2D: minigolf a 9 buche, tutti insieme, ognuno con la sua pallina (le palline non si toccano).
// Le buche sono in giochi/putt-buche.js e a ogni partita si giocano in ordine casuale. La fisica gira sul server
// (ciclo a tick): il browser manda solo il tiro (direzione e forza) e riceve le posizioni.
const B = require('./putt-buche');
const { R_PALLA, R_BUCA, BUCHE, segmentiFissi, segmentiMobili, dentro } = B;

const V_MAX = 1150; // px/s del tiro più forte
const ATTRITO = 260, ATTRITO_SABBIA = 1150; // px/s²
const V_STOP = 7, V_BUCA = 360; // sotto V_BUCA la pallina sulla buca ci cade
const RIMBALZO = 0.72, RIMBALZO_RESP = 1.05;
const TEMPO_BUCA = 180000, PENALITA_TEMPO = 3, PAUSA_FINE_BUCA = 4500, VIA_MS = 2500;
const COLORI = ['#ffffff', '#ffd23f', '#ff6b6b', '#5fd3ff', '#9dff7a', '#ff9ff3', '#c49bff', '#ffa94d'];

function mescola(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

// muove una pallina di dt secondi, con piccoli passi per non attraversare i muri
function passo(b, p, dt, t, segs) {
  let v = Math.hypot(p.vx, p.vy);
  if (v <= 0) return;
  const inSabbia = (b.sabbia || []).some((r) => dentro(p.x, p.y, r));
  const nv = Math.max(0, v - (inSabbia ? ATTRITO_SABBIA : ATTRITO) * dt);
  p.vx *= nv / v; p.vy *= nv / v; v = nv;
  const n = Math.max(1, Math.ceil((v * dt) / 3));
  for (let k = 0; k < n; k++) {
    p.x += (p.vx * dt) / n; p.y += (p.vy * dt) / n;
    for (const s of segs) collisioneSegmento(p, s);
    for (const [cx, cy, r] of b.respingenti || []) {
      const dx = p.x - cx, dy = p.y - cy, d = Math.hypot(dx, dy);
      if (d < r + R_PALLA && d > 0) {
        const nx = dx / d, ny = dy / d;
        p.x = cx + nx * (r + R_PALLA); p.y = cy + ny * (r + R_PALLA);
        const vn = p.vx * nx + p.vy * ny;
        if (vn < 0) { p.vx -= (1 + RIMBALZO_RESP) * vn * nx; p.vy -= (1 + RIMBALZO_RESP) * vn * ny; p.urto = true; }
      }
    }
  }
}
function collisioneSegmento(p, [x1, y1, x2, y2]) {
  const dx = x2 - x1, dy = y2 - y1, l2 = dx * dx + dy * dy || 1;
  const u = Math.max(0, Math.min(1, ((p.x - x1) * dx + (p.y - y1) * dy) / l2));
  const cx = x1 + u * dx, cy = y1 + u * dy;
  const ex = p.x - cx, ey = p.y - cy, d = Math.hypot(ex, ey);
  if (d >= R_PALLA) return;
  let nx, ny;
  if (d > 1e-6) { nx = ex / d; ny = ey / d; } else { const l = Math.sqrt(l2); nx = -dy / l; ny = dx / l; }
  p.x = cx + nx * R_PALLA; p.y = cy + ny * R_PALLA;
  const vn = p.vx * nx + p.vy * ny;
  if (vn < 0) { p.vx -= (1 + RIMBALZO) * vn * nx; p.vy -= (1 + RIMBALZO) * vn * ny; p.urto = true; }
}

class Putt {
  constructor({ n }) {
    this.id = 'putt';
    this.n = n;
    this.ordine = mescola(BUCHE.map((_, i) => i));
    this.k = -1;
    this.colpi = Array.from({ length: n }, () => []); // colpi per buca
    this.usciti = new Array(n).fill(false);
    this.tickMs = 33;
    this.turno = null; this.inAttesa = false; this.finita = false; this.risultato = null; this.evento = null; this.nEv = 0;
    this.inPausa = false; this.pausaDal = null;
    this.prossimaBuca(Date.now());
  }
  annuncia(posto, testo, testoIo, forte = false) { this.evento = { id: ++this.nEv, posto, testo, testoIo, forte }; }
  attesi() { return []; }
  impostaPausa(si) {
    if (si === this.inPausa || this.finita) return;
    if (si) this.pausaDal = Date.now();
    else if (this.pausaDal) { const d = Date.now() - this.pausaDal; this.inizio += d; this.fineFase += d; this.ultimoTick = null; }
    this.inPausa = si;
  }

  get buca() { return BUCHE[this.ordine[this.k]]; }

  prossimaBuca(ora) {
    this.k++;
    if (this.k >= this.ordine.length) return this.chiudi();
    const b = this.buca;
    this.fissi = segmentiFissi(b);
    this.fase = 'via';
    this.inizio = ora + VIA_MS; // il tempo degli ostacoli e della buca parte da qui
    this.fineFase = this.inizio + TEMPO_BUCA;
    this.ultimoTick = null;
    this.palle = Array.from({ length: this.n }, () => ({ x: b.partenza[0], y: b.partenza[1], vx: 0, vy: 0, dentro: false, colpi: 0, da: [...b.partenza], tempo: null }));
    this.usciti.forEach((u, i) => { if (u) this.palle[i].dentro = true; });
  }

  // il tiro: { t: 'tiro', a: angolo in radianti, f: forza da 0 a 1 }
  input(p, d) {
    if (this.finita || this.inPausa || this.fase !== 'buca' || !d || d.t !== 'tiro') return;
    const x = this.palle[p];
    if (!x || x.dentro || Math.hypot(x.vx, x.vy) > 0) return;
    const f = Math.max(0.02, Math.min(1, Number(d.f) || 0)), a = Number(d.a);
    if (!Number.isFinite(a)) return;
    x.da = [x.x, x.y];
    x.vx = Math.cos(a) * f * V_MAX; x.vy = Math.sin(a) * f * V_MAX;
    x.colpi++;
    this.cambiato = true;
  }

  tick(ora) {
    if (this.finita || this.inPausa) return false;
    this.cambiato = false;
    if (this.fase === 'via') { if (ora >= this.inizio) { this.fase = 'buca'; this.ultimoTick = ora; return true; } return false; }
    if (this.fase === 'fineBuca') { if (ora >= this.fineFase) { this.prossimaBuca(ora); return true; } return false; }
    const dt = Math.min(0.08, (ora - (this.ultimoTick || ora)) / 1000);
    this.ultimoTick = ora;
    const b = this.buca, t = (ora - this.inizio) / 1000;
    const segs = this.fissi.concat(segmentiMobili(b, t));
    this.palle.forEach((x, p) => {
      if (x.dentro) return;
      if (x.vx || x.vy) {
        passo(b, x, dt, t, segs);
        // acqua: la pallina torna dove era stata tirata, con un colpo di penalità
        if ((b.acqua || []).some((r) => dentro(x.x, x.y, r))) {
          x.x = x.da[0]; x.y = x.da[1]; x.vx = 0; x.vy = 0; x.colpi++;
          this.annuncia(p, 'finisce in acqua! 💦 +1', 'in acqua! 💦 Un colpo di penalità');
          this.cambiato = true;
          return;
        }
        const v = Math.hypot(x.vx, x.vy);
        if (Math.hypot(x.x - b.buca[0], x.y - b.buca[1]) < R_BUCA && v < V_BUCA) {
          x.dentro = true; x.vx = 0; x.vy = 0; x.x = b.buca[0]; x.y = b.buca[1];
          x.tempo = ora - this.inizio;
          const par = b.par, c = x.colpi;
          const nome = c === 1 ? 'BUCA IN UNO! ⛳🎉' : c <= par - 2 ? 'Eagle! 🦅' : c === par - 1 ? 'Birdie! 🐦' : c === par ? 'Par 👍' : `${c} colpi`;
          this.annuncia(p, `in buca: ${nome}`, `in buca: ${nome}`, c === 1);
          this.cambiato = true;
        } else if (v < V_STOP) { x.vx = 0; x.vy = 0; this.cambiato = true; }
      } else {
        // un ostacolo che si muove può spingere una pallina ferma
        for (const s of segs) collisioneSegmento(x, s);
        x.vx = 0; x.vy = 0;
      }
    });
    if (this.palle.every((x) => x.dentro) || ora >= this.fineFase) this.fineBuca(ora);
    return this.cambiato;
  }

  fineBuca(ora) {
    this.palle.forEach((x, p) => {
      if (this.usciti[p] && !x.colpi) { this.colpi[p].push(null); return; }
      this.colpi[p].push(x.dentro ? x.colpi : x.colpi + PENALITA_TEMPO);
    });
    if (ora >= this.fineFase) this.annuncia(null, `⏰ Tempo scaduto: chi non è in buca prende ${PENALITA_TEMPO} colpi in più`, '');
    this.fase = 'fineBuca';
    this.fineFase = ora + PAUSA_FINE_BUCA;
    this.cambiato = true;
  }

  totale(p) { return this.colpi[p].reduce((s, x) => s + (x || 0), 0); }
  esce(p) { this.usciti[p] = true; if (this.palle[p]) { this.palle[p].dentro = true; } if (this.usciti.every(Boolean)) this.chiudi(); }
  rientra(p) { this.usciti[p] = false; }

  chiudi() {
    this.finita = true;
    this.fase = 'fine';
    const tot = Array.from({ length: this.n }, (_, i) => this.totale(i));
    const validi = tot.map((x, i) => (this.usciti[i] ? Infinity : x));
    const min = Math.min(...validi);
    const v = validi.map((x, i) => (x === min ? i : -1)).filter((i) => i >= 0);
    this.risultato = { fazioni: tot.map((x, i) => ({ posti: [i], punti: x })), etichetta: 'colpi', crescente: true, pareggio: v.length > 1, vincitori: v.length > 1 ? [] : v };
  }

  vistaTick() {
    const ora = Date.now();
    const rif = this.inPausa ? this.pausaDal : ora;
    return {
      fase: this.fase, k: this.k, pausa: this.inPausa, t: (rif - this.inizio) / 1000,
      via: this.fase === 'via' ? Math.max(0, this.inizio - rif) : 0,
      resta: this.fase === 'buca' ? Math.max(0, this.fineFase - rif) : 0,
      palle: (this.palle || []).map((x) => ({ x: Math.round(x.x * 10) / 10, y: Math.round(x.y * 10) / 10, m: !!(x.vx || x.vy), d: x.dentro, c: x.colpi })),
    };
  }

  vista() {
    return {
      gioco: this.id, n: this.n, turno: null, inAttesa: false, finita: this.finita, risultato: this.risultato, evento: this.evento,
      ordine: this.ordine, k: Math.min(this.k, this.ordine.length - 1), buca: this.finita ? null : this.ordine[this.k],
      colpi: this.colpi, totali: Array.from({ length: this.n }, (_, i) => this.totale(i)), usciti: this.usciti,
      colori: COLORI, stato: this.vistaTick(), tempoBuca: TEMPO_BUCA,
    };
  }
}

module.exports = {
  meta: {
    id: 'putt',
    nome: 'Putt Party 2D',
    tipo: 'tabellone',
    soloPersone: true,
    tempoReale: true,
    pausaBoss: true,
    giocatori: [1, 2, 3, 4, 5, 6, 7, 8],
    descrizione: 'Minigolf a 9 buche: tutti tirano insieme, ognuno con la sua pallina. Vince chi fa meno colpi.',
    alias: ['putt party', 'minigolf', 'golf', 'mini golf', 'putt'],
    opzioni: [],
    regole: [
      'Minigolf a 9 buche, da soli o tra amici (niente computer). Le buche hanno difficoltà diverse (da una a cinque stelle) e a ogni partita si giocano in un ordine diverso, a caso.',
      'Si gioca tutti insieme: ognuno ha la sua pallina e tira quando vuole, senza aspettare gli altri. Le palline non si toccano tra loro; quelle degli altri le vedi un po\' trasparenti.',
      'Per tirare: premi sul campo (con il mouse o col dito) e trascina all\'indietro, come una fionda. La freccia mostra direzione e forza; lascia andare per tirare. Si può tirare solo quando la propria pallina è ferma.',
      'La pallina rimbalza sui bordi e sui muri; i respingenti rotondi la rilanciano più forte. Nella sabbia rallenta molto. Se finisce in acqua torna dove l\'avevi tirata, con un colpo di penalità.',
      'Mulini e blocchi che scorrono si muovono di continuo: aspetta il momento giusto per passare.',
      'La pallina entra se arriva sulla buca non troppo veloce; se è troppo forte ci passa sopra.',
      'Non c\'è limite di colpi. Ogni buca dura al massimo 3 minuti: chi allo scadere non è in buca prende i colpi fatti più 3 di penalità. Quando sono tutti in buca si passa alla prossima.',
      'Alla fine vince chi ha fatto meno colpi in totale; a parità è pareggio. Accanto a ogni buca c\'è il par (i colpi che servono a un buon giocatore): un colpo in meno è un birdie, due un eagle.',
      'Il gioco è in tempo reale e si ferma per tutti quando qualcuno apre le dispense.',
    ],
  },
  crea: (o) => new Putt(o),
  bot: () => ({}),
  _test: { Putt, passo, collisioneSegmento, B, V_MAX },
};
