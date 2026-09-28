// Regole di schieramento della Battaglia navale. Usato sia dal server sia dal browser.
(function (radice, fabbrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabbrica();
  else radice.NavaleRegole = fabbrica();
})(typeof self !== 'undefined' ? self : this, function () {
  const LATO = 10;
  const FLOTTE = {
    italiana: [4, 3, 3, 2, 2, 2, 1, 1, 1, 1],
    classica: [5, 4, 3, 3, 2],
  };
  const NOMI = { 5: 'portaerei', 4: 'corazzata', 3: 'incrociatore', 2: 'cacciatorpediniere', 1: 'sommergibile' };
  const dentro = (r, c) => r >= 0 && r < LATO && c >= 0 && c < LATO;

  // caselle occupate da una nave { r, c, lung, vert }
  function celleNave(n) {
    return Array.from({ length: n.lung }, (_, k) => (n.r + (n.vert ? k : 0)) * LATO + n.c + (n.vert ? 0 : k));
  }
  // caselle attorno (anche in diagonale), senza la nave stessa
  function intorno(celle) {
    const dentroNave = new Set(celle);
    const out = new Set();
    for (const i of celle) {
      const r = Math.floor(i / LATO), c = i % LATO;
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        const rr = r + dr, cc = c + dc;
        if (dentro(rr, cc) && !dentroNave.has(rr * LATO + cc)) out.add(rr * LATO + cc);
      }
    }
    return [...out];
  }

  // si può aggiungere questa nave a quelle già messe? (dentro la griglia, senza sovrapporsi né toccarsi)
  function puoMettere(navi, n) {
    const fr = n.r + (n.vert ? n.lung - 1 : 0), fc = n.c + (n.vert ? 0 : n.lung - 1);
    if (!dentro(n.r, n.c) || !dentro(fr, fc)) return false;
    const vietate = new Set();
    for (const altra of navi) { const cs = celleNave(altra); cs.forEach((i) => vietate.add(i)); intorno(cs).forEach((i) => vietate.add(i)); }
    return celleNave(n).every((i) => !vietate.has(i));
  }

  // controlla una flotta completa: null se va bene, altrimenti il motivo
  function valida(navi, tipoFlotta) {
    const flotta = FLOTTE[tipoFlotta];
    if (!Array.isArray(navi) || navi.length !== flotta.length) return 'Devi schierare tutte le navi';
    const lunghe = navi.map((n) => n && n.lung).sort((a, b) => b - a);
    if (lunghe.some((l, k) => l !== flotta[k])) return 'La flotta non è quella prevista';
    const messe = [];
    for (const n of navi) {
      const pulita = { r: Number(n.r), c: Number(n.c), lung: Number(n.lung), vert: !!n.vert };
      if (![pulita.r, pulita.c].every(Number.isInteger)) return 'Posizione non valida';
      if (!puoMettere(messe, pulita)) return 'Le navi devono stare nella griglia e non possono toccarsi, nemmeno in diagonale';
      messe.push(pulita);
    }
    return null;
  }

  function casuale(tipoFlotta, rnd = Math.random) {
    const flotta = FLOTTE[tipoFlotta];
    for (let tentativo = 0; tentativo < 500; tentativo++) {
      const navi = [];
      let ok = true;
      for (const lung of flotta) {
        let messa = false;
        for (let k = 0; k < 200 && !messa; k++) {
          const n = { r: Math.floor(rnd() * LATO), c: Math.floor(rnd() * LATO), lung, vert: lung > 1 && rnd() < 0.5 };
          if (puoMettere(navi, n)) { navi.push(n); messa = true; }
        }
        if (!messa) { ok = false; break; }
      }
      if (ok) return navi;
    }
    throw new Error('Impossibile schierare la flotta');
  }

  return { LATO, FLOTTE, NOMI, celleNave, intorno, puoMettere, valida, casuale };
});
