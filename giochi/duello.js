// DUELLO SULLE PIATTAFORME: vista di lato, due isole sospese nel cielo (più una piccola in alto al centro).
// Si salta da un'isola all'altra. Dal cielo cadono oggetti: si raccolgono passandoci sopra e si usano col tasto azione.
// Ognuno ha 3 cuori: bombe e martellate tolgono un cuore, le palle di neve spingono (e chi cade nel vuoto perde un cuore).
// Chi resta senza cuori è fuori per il round; l'ultimo rimasto vince il round.
const { Arena, casuale } = require('./arena');
const W = 1000, H = 620, G = 1900, V = 250, SALTO = 760, LARG = 26, ALT = 40;
const ISOLE = [{ x0: 70, x1: 420, y: 420 }, { x0: 580, x1: 930, y: 420 }, { x0: 430, x1: 570, y: 285 }];
const OGGETTI = { bomba: 3, neve: 3, martello: 2, cuore: 1, scudo: 1 };
const MAX_OGGETTI = 5, CUORI = 3, INVULNERABILE = 0.9, RINASCITA = 1.4;

class Duello extends Arena {
  constructor(o) { super(o, { id: 'duello', round: 3 }); this.W = W; this.H = H; this.avvia(); }
  iniziaRound() {
    this.isole = ISOLE.map((q) => ({ ...q }));
    this.e = Array.from({ length: this.n }, (_, i) => {
      const isola = ISOLE[i % 2], k = Math.floor(i / 2), n = Math.ceil(this.n / 2);
      return { id: i, x: isola.x0 + 40 + ((k + 0.5) / n) * (isola.x1 - isola.x0 - 80), y: isola.y - ALT / 2, vx: 0, vy: 0, terra: true, dir: i % 2 ? -1 : 1,
        cuori: CUORI, fuori: false, ogg: null, usi: 0, scudo: 0, immune: 0, stordito: 0, rinasce: 0, colpo: 0, ordine: null, salti: 0 };
    });
    this.oggetti = []; this.proiettili = []; this.botti = []; this.colpi = []; this.nO = 0;
    this.prossimo = 1.5;
    this.usciti2 = [];
    this.mente = {};
  }
  sullIsola(x, y, vy, yPrima) {
    for (const s of this.isole) if (x > s.x0 - LARG / 2 && x < s.x1 + LARG / 2 && vy >= 0 && yPrima + ALT / 2 <= s.y + 2 && y + ALT / 2 >= s.y) return s;
    return null;
  }
  ferisci(p, danno, spintaX, spintaY, da) {
    const e = this.e[p];
    if (e.fuori || e.rinasce > 0 || e.immune > 0) return;
    if (e.scudo > 0) { e.scudo = 0; this.cambiato = true; this.annuncia(p, 'para il colpo con lo scudo 🛡️', 'lo scudo ti ha protetto 🛡️'); return; }
    e.vx = spintaX; e.vy = spintaY; e.terra = false; e.stordito = 0.35;
    if (danno) { e.cuori -= danno; e.immune = INVULNERABILE; e.colpo++; this.cambiato = true; if (da !== undefined && da !== p) this.annuncia(da, `colpisce @! 💥`, 'colpito! 💥', false, { bersaglio: p, testoTe: 'ti hanno colpito! 💔' }); }
    if (e.cuori <= 0) this.elimina(p);
  }
  elimina(p) {
    const e = this.e[p];
    if (e.fuori) return;
    e.fuori = true; e.cuori = 0; e.ordine = this.usciti2.length; this.usciti2.push(p); this.cambiato = true;
    this.annuncia(p, 'ha finito i cuori ed è fuori! 💀', 'hai finito i cuori: sei fuori!');
  }
  passo(dt) {
    const t = this.tempoRound;
    // dopo un minuto le isole si sgretolano dai bordi (e l'isoletta in alto sparisce), così il round finisce
    if (t > 60) for (const q of this.isole) { if (q.x1 < 0) continue; const c = (q.x0 + q.x1) / 2, l = (q.x1 - q.x0) / 2 - 7 * dt; if (l < 10) { q.x0 = q.x1 = -1000; continue; } q.x0 = c - l; q.x1 = c + l; }
    // nuovi oggetti che cadono dal cielo
    this.prossimo -= dt;
    if (this.prossimo <= 0 && this.oggetti.length < (t > 60 ? 9 : MAX_OGGETTI)) {
      // dopo un minuto "pioggia di bombe": quasi solo bombe, e più spesso, così il round finisce
      const finale = t > 60;
      const tipi = Object.entries(finale ? { bomba: 6, neve: 2, martello: 1, cuore: 0, scudo: 0 } : OGGETTI); let r = Math.random() * tipi.reduce((a, [, p]) => a + p, 0), tipo = 'bomba';
      for (const [k, p] of tipi) { r -= p; if (r <= 0) { tipo = k; break; } }
      const s = this.isole[Math.floor(Math.random() * this.isole.length)];
      this.oggetti.push({ id: ++this.nO, tipo, x: casuale(s.x0 + 20, s.x1 - 20), y: -20, vy: 0, fermo: false });
      this.prossimo = t > 60 ? casuale(0.6, 1.1) : casuale(1.2, 2.2);
    }
    for (const o of this.oggetti) if (!o.fermo) {
      const y0 = o.y; o.vy += G * 0.5 * dt; o.y += o.vy * dt;
      const s = this.isole.find((q) => o.x > q.x0 && o.x < q.x1 && y0 <= q.y - 12 && o.y >= q.y - 12);
      if (s) { o.y = s.y - 12; o.fermo = true; }
      if (o.y > H + 40) o.via = true;
    }
    // giocatori
    for (let p = 0; p < this.n; p++) {
      const e = this.e[p], i = this.inp[p];
      if (e.fuori) continue;
      if (e.rinasce > 0) { e.rinasce -= dt; if (e.rinasce <= 0) { const s = this.isole[Math.floor(Math.random() * 2)]; e.x = casuale(s.x0 + 40, s.x1 - 40); e.y = -30; e.vx = e.vy = 0; e.immune = 1.5; } continue; }
      e.immune = Math.max(0, e.immune - dt); e.scudo = Math.max(0, e.scudo - dt); e.stordito = Math.max(0, e.stordito - dt);
      const vuole = e.stordito > 0 ? 0 : i.x;
      if (e.stordito > 0) e.vx *= Math.exp(-2 * dt); else e.vx = vuole * V;
      if (Math.abs(vuole) > 0.2) e.dir = Math.sign(vuole);
      // salto: su (W, freccia o joystick in alto), anche un secondo salto in aria
      const su = i.y < -0.5;
      if (su && !e.suPrima && e.stordito <= 0 && (e.terra || e.salti < 2)) { e.vy = -SALTO * (e.terra ? 1 : 0.85); e.salti = e.terra ? 1 : 2; e.terra = false; }
      e.suPrima = su;
      const y0 = e.y;
      e.vy += G * dt; e.x += e.vx * dt; e.y += e.vy * dt;
      e.x = Math.max(LARG / 2, Math.min(W - LARG / 2, e.x));
      const s = this.sullIsola(e.x, e.y, e.vy, y0);
      if (s && !(i.y > 0.5 && s === this.isole[2])) { e.y = s.y - ALT / 2; e.vy = 0; e.terra = true; e.salti = 0; } else if (!s || e.vy < 0) e.terra = false;
      // caduto nel vuoto: perde un cuore e ricompare dall'alto
      if (e.y > H + 60) {
        e.cuori--; e.colpo++; this.cambiato = true;
        if (e.cuori <= 0) this.elimina(p); else { e.rinasce = RINASCITA; this.annuncia(p, 'è caduto nel vuoto! 💔', 'sei caduto nel vuoto! 💔'); }
        continue;
      }
      // raccoglie gli oggetti
      for (const o of this.oggetti) {
        if (o.via || Math.abs(o.x - e.x) > 26 || Math.abs(o.y - e.y) > 34) continue;
        if (o.tipo === 'cuore') { if (e.cuori >= CUORI) continue; e.cuori++; o.via = true; this.cambiato = true; continue; }
        if (o.tipo === 'scudo') { e.scudo = 8; o.via = true; this.cambiato = true; continue; }
        if (e.ogg) continue;
        e.ogg = o.tipo; e.usi = o.tipo === 'martello' ? 3 : 1; o.via = true; this.cambiato = true;
      }
      // usa l'oggetto
      if (this.nuoviTocchi(p) && e.ogg && e.stordito <= 0) this.usa(p);
    }
    this.oggetti = this.oggetti.filter((o) => !o.via);
    // proiettili
    for (const q of this.proiettili) {
      q.t += dt; q.vy += (q.tipo === 'bomba' ? G * 0.75 : 300) * dt; q.x += q.vx * dt; q.y += q.vy * dt;
      const tocca = this.e.find((e) => !e.fuori && e.rinasce <= 0 && e.id !== q.da && Math.abs(e.x - q.x) < LARG / 2 + 10 && Math.abs(e.y - q.y) < ALT / 2 + 10);
      const terra = this.isole.some((s) => q.x > s.x0 && q.x < s.x1 && Math.abs(q.y - s.y) < 12 && q.vy > 0);
      if (q.tipo === 'bomba' && (tocca || terra || q.t > 1.6)) this.esplodi(q);
      else if (q.tipo === 'neve' && tocca) { q.via = true; this.ferisci(tocca.id, 0, Math.sign(q.vx) * 560, -280, q.da); this.botti.push({ tipo: 'neve', x: Math.round(q.x), y: Math.round(q.y) }); }
      if (q.y > H + 60 || q.x < -60 || q.x > W + 60) q.via = true;
    }
    this.proiettili = this.proiettili.filter((q) => !q.via);
    const vivi = this.e.filter((e) => !e.fuori);
    return vivi.length <= (this.n === 1 ? 0 : 1) || t > 120;
  }
  usa(p) {
    const e = this.e[p];
    if (e.ogg === 'bomba') this.proiettili.push({ tipo: 'bomba', x: e.x + e.dir * 16, y: e.y - 10, vx: e.dir * 380, vy: -430, da: p, t: 0 });
    else if (e.ogg === 'neve') this.proiettili.push({ tipo: 'neve', x: e.x + e.dir * 16, y: e.y - 6, vx: e.dir * 680, vy: -60, da: p, t: 0 });
    else if (e.ogg === 'martello') {
      this.colpi.push({ x: Math.round(e.x), y: Math.round(e.y), d: e.dir });
      for (const o of this.e) if (o.id !== p && !o.fuori && o.rinasce <= 0 && (o.x - e.x) * e.dir > -8 && Math.abs(o.x - e.x) < 62 && Math.abs(o.y - e.y) < 40) this.ferisci(o.id, 1, e.dir * 470, -380, p);
    }
    e.usi--; if (e.usi <= 0) e.ogg = null;
    this.cambiato = true;
  }
  esplodi(q) {
    q.via = true; this.botti.push({ tipo: 'bomba', x: Math.round(q.x), y: Math.round(q.y) });
    for (const o of this.e) {
      if (o.fuori || o.rinasce > 0) continue;
      const d = Math.hypot(o.x - q.x, o.y - q.y);
      if (d < 90) this.ferisci(o.id, 1, Math.sign(o.x - q.x || 1) * 430, -420, q.da);
    }
  }
  fineRound() {
    // punti: uno per ogni giocatore uscito prima di te; chi resta prende 2 in più
    this.e.forEach((e) => { if (e.fuori) this.punti[e.id] += e.ordine; else this.punti[e.id] += this.usciti2.length + 2; });
    const vivi = this.e.filter((e) => !e.fuori);
    if (vivi.length === 1 && this.n > 1) this.annuncia(vivi[0].id, 'vince il round! 🏆', 'hai vinto il round! 🏆', true);
  }
  // ---------------- computer ----------------
  pensa(p, liv) {
    const e = this.e[p];
    if (e.fuori || e.rinasce > 0) return {};
    const m = this.mente[p] || (this.mente[p] = { fino: 0, meta: null });
    const t = this.tempoRound, isola = this.isole.find((s) => e.x > s.x0 - 10 && e.x < s.x1 + 10 && Math.abs(e.y + ALT / 2 - s.y) < 6);
    const R = { facile: 0.5, medio: 0.25, difficile: 0.1 }[liv];
    let x = 0, y = 0, tocco = false;
    // scappa dalle bombe vicine
    // prima di tutto: non stare sul bordo (nel finale le isole si restringono); il facile non ci pensa
    const margine = liv === 'difficile' ? 42 : 35;
    if (isola && liv !== 'facile') {
      const centro = (isola.x0 + isola.x1) / 2, largo = isola.x1 - isola.x0;
      if (largo < 60 && isola === this.isole[2]) return { x: 0, y: 1 }; // l'isoletta sta sparendo: si scende
      if (e.x < isola.x0 + margine || e.x > isola.x1 - margine) return { x: Math.sign(centro - e.x), y: 0 };
    }
    const bomba = this.proiettili.find((q) => q.tipo === 'bomba' && q.da !== p && Math.abs(q.x - e.x) < 130 && Math.abs(q.y - e.y) < 160);
    const verso = (d) => (!isola || (d > 0 ? e.x < isola.x1 - margine - 30 : e.x > isola.x0 + margine + 30) ? d : 0); // si scappa solo se c'è spazio
    if (bomba && liv !== 'facile') return { x: verso(Math.sign(e.x - bomba.x) || 1), y: verso(Math.sign(e.x - bomba.x) || 1) ? 0 : (e.terra ? -1 : 0) };
    // il difficile salta le palle di neve in arrivo e sta lontano da chi ha il martello
    if (liv === 'difficile') {
      const neve = this.proiettili.find((q) => q.tipo === 'neve' && q.da !== p && Math.sign(e.x - q.x) === Math.sign(q.vx) && Math.abs(q.x - e.x) < 170 && Math.abs(q.y - e.y) < 40);
      if (neve && e.terra) { m.suPrima = true; return { x: 0, y: -1 }; }
      const martello = this.e.find((o) => o.id !== p && !o.fuori && o.ogg === 'martello' && Math.abs(o.x - e.x) < 90 && Math.abs(o.y - e.y) < 50);
      if (martello && e.ogg !== 'martello') { const via = verso(Math.sign(e.x - martello.x) || 1); if (via) return { x: via, y: 0 }; }
    }
    // bersaglio: se ha un oggetto il nemico più vicino, altrimenti l'oggetto più vicino (i cuori quando servono)
    const nemici = this.e.filter((o) => o.id !== p && !o.fuori && o.rinasce <= 0);
    const oggetti = this.oggetti.filter((o) => o.fermo && (o.tipo !== 'cuore' || e.cuori < CUORI));
    if (t >= m.fino) {
      m.fino = t + R;
      if (e.ogg && nemici.length) m.meta = nemici.sort((a, b) => Math.abs(a.x - e.x) - Math.abs(b.x - e.x))[0];
      else if (oggetti.length) m.meta = oggetti.sort((a, b) => Math.abs(a.x - e.x) - Math.abs(b.x - e.x))[0];
      else m.meta = nemici[0] || null;
    }
    const q = m.meta; if (!q) return {};
    const dx = q.x - e.x;
    // tiene la distanza giusta per l'oggetto che ha
    const giusta = e.ogg === 'bomba' ? 200 : e.ogg === 'neve' ? 260 : e.ogg === 'martello' ? 40 : 0;
    if (Math.abs(dx) > giusta + 20) x = Math.sign(dx); else if (giusta && Math.abs(dx) < giusta - 60 && e.ogg !== 'martello') x = -Math.sign(dx);
    const mira = Math.abs(dx) < giusta + 60;
    if (e.ogg && Math.abs(q.y - e.y) < 50 && mira && Math.sign(dx) === e.dir && Math.random() < { facile: 0.05, medio: 0.15, difficile: 0.5 }[liv]) tocco = true;
    // salti: per passare all'altra isola, per salire in alto, per non cadere
    const altraIsola = isola && (q.x < isola.x0 || q.x > isola.x1);
    const bordo = isola && ((x > 0 && e.x > isola.x1 - (liv === 'facile' ? 22 : margine)) || (x < 0 && e.x < isola.x0 + (liv === 'facile' ? 22 : margine)));
    if (bordo && (altraIsola || liv === 'facile')) y = -1;
    else if (bordo) x = 0; // non si butta nel vuoto
    if (q.y < e.y - 80 && e.terra && Math.abs(dx) < 140 && (t < 55 || liv === 'facile')) y = -1;
    // in aria sopra il vuoto: il secondo salto per arrivare (il facile a volte se lo dimentica)
    if (!isola && e.vy > 150 && e.salti < 2 && !this.isole.some((s) => e.x > s.x0 && e.x < s.x1 && e.y < s.y) && Math.random() < { facile: 0.35, medio: 0.8, difficile: 1 }[liv]) y = -1;
    // tenere premuto "su" non fa un altro salto: bisogna lasciarlo
    if (y < 0 && m.suPrima) y = 0;
    m.suPrima = y < 0;
    // anche in aria cerca di tornare sopra un'isola
    if (!isola && e.vy > 0) { const s = this.isole.slice(0, 2).sort((a, b) => Math.abs((a.x0 + a.x1) / 2 - e.x) - Math.abs((b.x0 + b.x1) / 2 - e.x))[0]; if (e.x < s.x0 + 20) x = 1; else if (e.x > s.x1 - 20) x = -1; }
    return { x, y, tocco };
  }
  vistaExtra() { return { isole: ISOLE, cuori: CUORI }; }
  statoTick() {
    const botti = this.botti, colpi = this.colpi; this.botti = []; this.colpi = [];
    return {
      e: this.e.map((e) => ({ id: e.id, x: Math.round(e.x), y: Math.round(e.y), d: e.dir, c: e.cuori, f: e.fuori ? 1 : 0, o: e.ogg, u: e.usi, sc: e.scudo > 0 ? 1 : 0, im: e.immune > 0 || e.rinasce > 0 ? 1 : 0, r: e.rinasce > 0 ? 1 : 0, st: e.stordito > 0 ? 1 : 0, t: e.terra ? 1 : 0, colpo: e.colpo })),
      o: this.oggetti.map((o) => ({ id: o.id, t: o.tipo, x: Math.round(o.x), y: Math.round(o.y) })),
      p: this.proiettili.map((q) => ({ t: q.tipo, x: Math.round(q.x), y: Math.round(q.y) })),
      b: botti, cl: colpi, is: this.isole.map((q) => [Math.round(q.x0), Math.round(q.x1)]),
    };
  }
}

module.exports = {
  meta: {
    id: 'duello',
    nome: 'Duello sulle piattaforme',
    tipo: 'tabellone',
    tempoReale: true,
    pausaBoss: true,
    giocatori: [2, 3, 4, 5, 6, 7, 8],
    descrizione: 'Due isole sospese nel cielo, oggetti che piovono dall\'alto e 3 cuori a testa: bombe, palle di neve e martelli. Resta l\'ultimo in piedi!',
    alias: ['duello', 'piattaforme', 'smash', 'isole', 'bombe', 'martello', 'cuori'],
    opzioni: [{ id: 'round', nome: 'Round', valori: [3, 1, 5], etichette: ['3 round', '1 round', '5 round'], predefinito: 3 }],
    regole: [
      'Vista di lato: due isole sospese nel cielo e una piccola in alto al centro. Ti muovi con A e D (o le frecce), salti con W (o freccia su); in aria puoi fare un secondo salto. Sul telefono: joystick (in alto per saltare) e il pulsante per usare gli oggetti. Dall\'isola piccola si scende tenendo giù.',
      'Ognuno ha 3 cuori. Se cadi nel vuoto perdi un cuore e ricompari dall\'alto dopo un attimo. Chi finisce i cuori è fuori per il resto del round.',
      'Dal cielo cadono oggetti: si raccolgono passandoci sopra e si usano con spazio (o il pulsante). Se ne tiene uno alla volta.',
      '💣 Bomba: la lanci ad arco, esplode appena tocca qualcuno o il terreno: chi è vicino perde un cuore e viene sbalzato. ❄️ Palla di neve: va dritta e veloce, non toglie cuori ma spinge forte (ottima per buttare giù dall\'isola). 🔨 Martello: tre colpi da vicino, ognuno toglie un cuore e sbalza. ❤️ Cuore: +1 (al massimo 3). 🛡️ Scudo: per 8 secondi para il prossimo colpo.',
      'Dopo un colpo si è protetti per un attimo (lampeggi). Chi ricompare dall\'alto è protetto per un secondo e mezzo.',
      'Dopo un minuto arriva il finale: le isole si sgretolano dai bordi e piovono quasi solo bombe, così il round finisce. Punti del round: uno per ogni giocatore uscito prima di te; l\'ultimo rimasto prende 2 punti in più. Dopo 3 round (o 1, o 5) vince chi ha più punti.',
      'Il gioco è in tempo reale: si ferma per tutti quando qualcuno apre le dispense.',
      'Il computer facile salta a caso e a volte cade nel vuoto; il medio raccoglie gli oggetti e li usa; il difficile scappa dalle bombe, salta le palle di neve, sta lontano da chi ha il martello e usa gli oggetti più spesso.',
    ],
  },
  crea: (o) => new Duello(o),
  bot: () => ({}),
  _test: { Duello, ISOLE },
};
