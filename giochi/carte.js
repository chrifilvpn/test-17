// Carte francesi. Semi: c = cuori, q = quadri, f = fiori, p = picche.
// rango: 1 = Asso, 2..10, 11 = Fante (J), 12 = Donna (Q), 13 = Re (K). I jolly hanno jolly: true.
const SEMI = ['c', 'q', 'f', 'p'];
const NOMI_SEMI = { c: 'cuori', q: 'quadri', f: 'fiori', p: 'picche' };
const NOMI_RANGHI = { 1: 'Asso', 11: 'Fante', 12: 'Donna', 13: 'Re' };
const RANGHI_40 = [1, 2, 3, 4, 5, 6, 7, 11, 12, 13];

// Mazzo da 40 (per scopa, briscola, rubamazzo): dall'asso al 7 più fante, donna e re
function mazzo40() {
  const m = [];
  for (const s of SEMI) for (const r of RANGHI_40) m.push({ id: `${r}${s}`, rango: r, seme: s });
  return m;
}

// Due mazzi da 52 più 4 jolly = 108 carte (scala 40)
function mazzoDoppio() {
  const m = [];
  for (const d of ['', 'b']) for (const s of SEMI) for (let r = 1; r <= 13; r++) m.push({ id: `${r}${s}${d}`, rango: r, seme: s });
  for (let i = 1; i <= 4; i++) m.push({ id: `X${i}`, rango: 0, seme: null, jolly: true });
  return m;
}

// Nei giochi da 40 il fante vale 8, la donna 9 e il re 10
const valore40 = (c) => (c.rango <= 7 ? c.rango : c.rango - 3);

function mescola(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const nomeCarta = (c) => (c.jolly ? 'Jolly' : `${NOMI_RANGHI[c.rango] || c.rango} di ${NOMI_SEMI[c.seme]}`);
const casuale = (a) => a[Math.floor(Math.random() * a.length)];

module.exports = { SEMI, mazzo40, mazzoDoppio, valore40, mescola, nomeCarta, casuale };
