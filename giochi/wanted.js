// WANTED! (ispirato al minigioco del Nintendo DS, con personaggi originali): in alto c'è il manifesto del RICERCATO,
// sotto una folla di facce. Il ricercato è uno solo: trovalo e cliccalo (o toccalo) prima degli altri.
// Un clic sbagliato su un'altra faccia ti blocca per 2 secondi. La folla cambia a ogni round e diventa sempre più
// difficile: griglia, facce sparse, file che scorrono, facce che rimbalzano, cerchi che girano, pioggia, calca.
const { Arena, casuale } = require('./arena');
const W = 1000, H = 620, TOP = 130, R = 24, TEMPO = 15, BLOCCO = 2;
const TIPI = ['pirata', 'robot', 'gatto', 'cuoco'];
const SCHEMI = ['griglia', 'sparsi', 'righe', 'rimbalzo', 'cerchi', 'pioggia', 'calca'];

class Wanted extends Arena {
  constructor(o) {
    super(o, { id: 'wanted', round: 15, tickMs: 50 });
    this.W = W; this.H = H;
    this.viaMs = 1000; this.pausaRoundMs = 2200; // round brevi: poca attesa tra l'uno e l'altro
    // i primi 7 round usano tutti gli schemi in ordine a caso, ma si comincia sempre da uno dei più difficili
    const difficili = ['calca', 'rimbalzo', 'pioggia', 'cerchi'], primo = difficili[Math.floor(Math.random() * difficili.length)];
    const resto = SCHEMI.filter((x) => x !== primo); for (let i = resto.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [resto[i], resto[j]] = [resto[j], resto[i]]; }
    this.ordine = [primo, ...resto];
    this.avvia();
  }
  iniziaRound() {
    const k = this.round - 1;
    // lo schema: i primi in ordine, poi a caso tra tutti; le facce aumentano col passare dei round
    this.schema = k < SCHEMI.length ? this.ordine[k] : SCHEMI[Math.floor(Math.random() * SCHEMI.length)];
    this.ricercato = TIPI[Math.floor(Math.random() * TIPI.length)];
    const altri = TIPI.filter((t) => t !== this.ricercato);
    // si parte subito dalla folla più difficile: tante facce, e cresce ancora
    const quanti = Math.min(120, 76 + k * 3 + (this.schema === 'calca' ? 20 : 0));
    this.facce = [];
    const bassa = TOP + R, alta = H - R, sx = R, dx = W - R;
    // ogni faccia, oltre allo schema, gira su un suo piccolo cerchio e ruota su sé stessa: nessuno sta mai fermo
    const metti = (f) => this.facce.push({ tipo: altri[Math.floor(Math.random() * altri.length)], oa: casuale(10, 26), ow: casuale(1.6, 3.4) * (Math.random() < 0.5 ? 1 : -1), of: Math.random() * 6.3, rf: casuale(-0.6, 0.6), rw: casuale(0.6, 2.2) * (Math.random() < 0.5 ? 1 : -1), ...f });
    if (this.schema === 'griglia') {
      const col = Math.ceil(Math.sqrt(quanti * 2)), righe = Math.ceil(quanti / col);
      for (let i = 0; i < quanti; i++) metti({ bx: sx + 20 + (i % col) * ((dx - sx - 40) / Math.max(1, col - 1)), by: bassa + 10 + Math.floor(i / col) * ((alta - bassa - 20) / Math.max(1, righe - 1)) });
    } else if (this.schema === 'righe' || this.schema === 'pioggia') {
      const file = Math.max(3, Math.round(Math.sqrt(quanti / 2))), perFila = Math.ceil(quanti / file);
      for (let f = 0; f < file; f++) {
        const v = casuale(90, 170) * (f % 2 ? -1 : 1);
        for (let j = 0; j < perFila && this.facce.length < quanti; j++) {
          if (this.schema === 'righe') metti({ bx: (j * (W + 60)) / perFila, by: bassa + 10 + f * ((alta - bassa - 20) / Math.max(1, file - 1)), vx: v, vy: 0, giro: W + 60 });
          else metti({ bx: sx + 20 + f * ((dx - sx - 40) / Math.max(1, file - 1)), by: TOP + (j * (H - TOP + 60)) / perFila, vx: 0, vy: Math.abs(v) * 0.8, giro: H - TOP + 60 });
        }
      }
    } else if (this.schema === 'cerchi') {
      const anelli = Math.max(2, Math.min(5, Math.round(quanti / 12)));
      let messe = 0;
      for (let a = 0; a < anelli; a++) {
        const r = 50 + a * 50, n = a === anelli - 1 ? quanti - messe : Math.round((quanti * (a + 1)) / ((anelli * (anelli + 1)) / 2));
        for (let j = 0; j < n && messe < quanti; j++, messe++) metti({ cx: W / 2, cy: (TOP + H) / 2, r, ang: (j / n) * Math.PI * 2, w: (a % 2 ? -1 : 1) * (0.5 + a * 0.12) });
      }
    } else {
      // sparsi, rimbalzo, calca: posizioni a caso (nella calca si possono sovrapporre)
      for (let i = 0; i < quanti; i++) {
        let x, y, t = 0;
        do { x = casuale(sx, dx); y = casuale(bassa, alta); t++; } while (this.schema !== 'calca' && t < 30 && this.facce.some((f) => Math.hypot(f.bx - x, f.by - y) < R * 1.7));
        const v = this.schema === 'rimbalzo' ? casuale(110, 210) : this.schema === 'calca' ? casuale(60, 140) : casuale(35, 80), a = Math.random() * Math.PI * 2;
        metti({ bx: x, by: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, rimbalza: true });
      }
    }
    // il ricercato prende il posto di una faccia a caso (nella calca non in fondo alla pila, così si vede)
    const quale = this.schema === 'calca' ? Math.floor(this.facce.length * (0.5 + Math.random() * 0.45)) : Math.floor(Math.random() * this.facce.length);
    this.facce[quale].tipo = this.ricercato; this.quale = quale;
    this.bloccati = new Array(this.n).fill(0);
    this.trovato = null; this.mente = {}; this.sbagli = [];
    this.aggiornaPosizioni(0);
  }
  aggiornaPosizioni(t) {
    this.posizioniSchema(t);
    for (const f of this.facce) {
      f.x = Math.max(R, Math.min(W - R, f.x + Math.cos(t * f.ow + f.of) * f.oa));
      f.y = Math.max(TOP + R, Math.min(H - R, f.y + Math.sin(t * f.ow + f.of) * f.oa * 0.8));
      f.ang = f.rf + Math.sin(t * f.rw) * 0.9; // dondola e si gira: il ricercato non si riconosce a colpo d'occhio
    }
  }
  posizioniSchema(t) {
    for (const f of this.facce) {
      if (f.cx !== undefined) { f.x = f.cx + Math.cos(f.ang + t * f.w) * f.r * 1.6; f.y = f.cy + Math.sin(f.ang + t * f.w) * f.r * 0.85; continue; }
      if (f.rimbalza) {
        // rimbalzo: posizione "piegata" dentro il campo (senza stato, così è uguale per tutti)
        const piega = (p, a, b) => { const l = b - a, m = ((p - a) % (2 * l) + 2 * l) % (2 * l); return a + (m < l ? m : 2 * l - m); };
        f.x = piega(f.bx + f.vx * t, R, W - R); f.y = piega(f.by + f.vy * t, TOP + R, H - R); continue;
      }
      if (f.giro) {
        if (f.vx) f.x = ((f.bx + f.vx * t) % f.giro + f.giro) % f.giro - 30; else f.x = f.bx;
        if (f.vy) f.y = TOP + ((f.by - TOP + f.vy * t) % f.giro + f.giro) % f.giro - 30; else f.y = f.by;
        continue;
      }
      f.x = f.bx; f.y = f.by;
    }
  }
  // la faccia sotto il puntatore (quella disegnata sopra, cioè l'ultima)
  colpita(x, y) { for (let i = this.facce.length - 1; i >= 0; i--) { const f = this.facce[i]; if (Math.hypot(f.x - x, f.y - y) < R) return i; } return -1; }
  passo(dt) {
    const t = this.tempoRound;
    this.aggiornaPosizioni(t);
    if (this.trovato !== null) return t - this.trovato.t > 0.05;
    for (let p = 0; p < this.n; p++) {
      if (!this.nuoviTocchi(p)) continue;
      const i = this.inp[p];
      if (i.mx === null || t < this.bloccati[p]) continue;
      const c = this.colpita(i.mx, i.my);
      if (c < 0) continue;
      if (c === this.quale) {
        this.trovato = { p, t };
        const veloce = t < 3 ? 1 : 0;
        this.punti[p] += 1 + veloce;
        this.annuncia(p, `ha trovato il ricercato in ${t.toFixed(1)} s!${veloce ? ' ⚡ +1' : ''}`, `l'hai trovato in ${t.toFixed(1)} s!${veloce ? ' ⚡ +1' : ''}`, true);
        this.cambiato = true;
        return true;
      }
      this.bloccati[p] = t + BLOCCO; this.sbagli.push([p, Math.round(i.mx), Math.round(i.my)]); this.cambiato = true;
    }
    if (t >= TEMPO) { this.annuncia(null, 'Tempo scaduto: nessuno l\'ha trovato', 'Tempo scaduto', true); return true; }
    return false;
  }
  fineRound() {}
  // il computer: lo "vede" dopo un tempo che dipende dal livello, da quante facce ci sono e se si muovono
  pensa(p, liv) {
    const m = this.mente[p] || (this.mente[p] = {});
    const t = this.tempoRound;
    if (m.round !== this.round) {
      m.round = this.round;
      const base = { facile: casuale(3.5, 8), medio: casuale(2, 5), difficile: casuale(1.5, 3.8) }[liv];
      const muove = 1.35; // si muovono sempre tutti
      m.quando = base * (0.7 + this.facce.length / 60) * muove;
      m.sbaglia = Math.random() < { facile: 0.35, medio: 0.15, difficile: 0.03 }[liv] ? m.quando * 0.6 : null;
    }
    if (m.sbaglia !== null && t >= m.sbaglia) { m.sbaglia = null; const f = this.facce[(this.quale + 1) % this.facce.length]; return { mx: f.x, my: f.y, tocco: true }; }
    if (t >= m.quando && t >= this.bloccati[p]) { const f = this.facce[this.quale]; return { mx: f.x + casuale(-4, 4), my: f.y + casuale(-4, 4), tocco: true }; }
    return {};
  }
  statoTick() {
    const sbagli = this.sbagli; this.sbagli = [];
    return {
      ric: this.ricercato, sc: this.schema, resta: Math.max(0, Math.ceil(TEMPO - this.tempoRound)),
      f: this.facce.map((f) => [Math.round(f.x), Math.round(f.y), TIPI.indexOf(f.tipo), Math.round(f.ang * 10)]),
      tr: this.trovato ? { p: this.trovato.p, i: this.quale, t: this.trovato.t } : this.fase === 'pausaRound' ? { p: null, i: this.quale } : null,
      bl: this.bloccati.map((b) => Math.max(0, Math.round((b - this.tempoRound) * 10) / 10)), sb: sbagli,
    };
  }
}

module.exports = {
  meta: {
    id: 'wanted',
    nome: 'Wanted!',
    tipo: 'tabellone',
    tempoReale: true,
    pausaBoss: true,
    giocatori: [1, 2, 3, 4, 5, 6, 7, 8],
    descrizione: 'Il manifesto dice chi cercare: trovalo in mezzo alla folla prima degli altri! Pirati, robot, gatti e cuochi che si muovono.',
    alias: ['wanted', 'ricercato', 'trova', 'folla', 'facce', 'trova il personaggio'],
    opzioni: [{ id: 'round', nome: 'Round', valori: [15, 10, 25], etichette: ['15 round', '10 round', '25 round'], predefinito: 15 }],
    regole: [
      'In alto c\'è il manifesto RICERCATO con la faccia da trovare: un pirata, un robot, un gatto o un cuoco. Sotto c\'è una folla dei quattro personaggi, ma quello ricercato c\'è una volta sola.',
      'Trovalo e cliccalo (sul telefono toccalo) prima degli altri: prendi 1 punto, 2 se lo trovi in meno di 3 secondi.',
      'Se clicchi una faccia sbagliata resti bloccato per 2 secondi (il cursore diventa rosso). Cliccare nel vuoto non conta.',
      'Si parte subito dalla folla più difficile (una ottantina di facce, fitte e spesso una sopra l\'altra) e da uno degli schemi più difficili; round dopo round la folla cresce ancora e cambia (nei primi sette round escono tutti gli schemi, in ordine a caso): griglia, facce sparse, file che scorrono, facce che rimbalzano, cerchi che girano, pioggia di facce e una calca dove le facce si sovrappongono. Tutte le facce si muovono sempre: oltre allo schema girano su un loro piccolo cerchio e dondolano inclinandosi, così il ricercato non si vede a colpo d\'occhio. Poi gli schemi escono a caso. Ogni round dura al massimo 15 secondi.',
      'Dopo 15 round (o 10, o 25) vince chi ha più punti.',
      'Il gioco è in tempo reale: si ferma per tutti quando qualcuno apre le dispense.',
      'Il computer facile ci mette tanto e spesso sbaglia; il medio è abbastanza svelto; il difficile ha l\'occhio lungo e sbaglia quasi mai.',
    ],
  },
  crea: (o) => new Wanted(o),
  bot: () => ({}),
  _test: { Wanted, TIPI, SCHEMI },
};
