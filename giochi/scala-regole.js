// Regole delle combinazioni di scala 40. Usato sia dal server sia dal browser.
(function (radice, fabbrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabbrica();
  else radice.ScalaRegole = fabbrica();
})(typeof self !== 'undefined' ? self : this, function () {
  const SEMI = ['c', 'q', 'f', 'p'];

  // valore di una posizione in scala: asso basso 1, asso alto 11, figure 10
  const valorePos = (pos) => (pos === 1 ? 1 : pos === 14 ? 11 : pos >= 11 ? 10 : pos);

  // penalità di una carta rimasta in mano
  const penalita = (c) => (c.jolly ? 25 : c.rango === 1 ? 11 : c.rango >= 11 ? 10 : c.rango);

  function valutaTris(nat, jolly) {
    const r = nat[0].rango;
    if (!nat.every((c) => c.rango === r)) return null;
    const semi = new Set(nat.map((c) => c.seme));
    if (semi.size !== nat.length) return null; // semi tutti diversi
    const tot = nat.length + jolly.length;
    if (tot < 3 || tot > 4) return null;
    const v = r === 1 ? 11 : Math.min(r, 10);
    const ordinate = [...nat].sort((a, b) => SEMI.indexOf(a.seme) - SEMI.indexOf(b.seme));
    return {
      tipo: 'tris',
      carte: [...ordinate, ...jolly],
      punti: v * tot,
      jolly: jolly.length ? { id: jolly[0].id, rango: r, semi: SEMI.filter((s) => !semi.has(s)) } : null,
    };
  }

  function valutaScala(nat, jolly) {
    const s = nat[0].seme;
    if (!nat.every((c) => c.seme === s)) return null;
    for (const assoAlto of [false, true]) {
      const pos = nat.map((c) => (c.rango === 1 && assoAlto ? 14 : c.rango));
      if (new Set(pos).size !== pos.length) continue;
      const min = Math.min(...pos);
      const max = Math.max(...pos);
      const buchi = max - min + 1 - nat.length;
      if (buchi > jolly.length) continue;
      let posJolly = null;
      if (buchi === 1) {
        for (let x = min; x <= max; x++) if (!pos.includes(x)) posJolly = x;
      } else if (jolly.length === 1) {
        if (max < 14 && !(min === 1 && max === 13)) posJolly = max + 1;
        else if (min > 1) posJolly = min - 1;
        else continue;
      }
      const da = posJolly != null ? Math.min(min, posJolly) : min;
      const a = posJolly != null ? Math.max(max, posJolly) : max;
      if (da === 1 && a === 14) continue; // l'asso non può stare sia sotto che sopra
      const carte = [];
      let punti = 0;
      for (let x = da; x <= a; x++) {
        carte.push(x === posJolly ? jolly[0] : nat[pos.indexOf(x)]);
        punti += valorePos(x);
      }
      return {
        tipo: 'scala',
        seme: s,
        carte,
        punti,
        jolly: posJolly != null ? { id: jolly[0].id, rango: posJolly === 14 ? 1 : posJolly, semi: [s] } : null,
      };
    }
    return null;
  }

  // Controlla se un gruppo di carte è una combinazione valida: tris/poker o scala (massimo un jolly)
  function valuta(carte) {
    if (!carte || carte.length < 3) return null;
    const jolly = carte.filter((c) => c.jolly);
    const nat = carte.filter((c) => !c.jolly);
    if (jolly.length > 1 || nat.length < 2) return null;
    return valutaTris(nat, jolly) || valutaScala(nat, jolly);
  }

  // La carta naturale può sostituire il jolly di questa combinazione?
  function sostituisceJolly(comb, carta) {
    if (!comb.jolly || carta.jolly) return false;
    return carta.rango === comb.jolly.rango && comb.jolly.semi.includes(carta.seme);
  }

  return { SEMI, valuta, penalita, sostituisceJolly, valorePos };
});
