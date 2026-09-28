// ATTRAVERSA LA STRADA: il mondo (usato dal server e dal browser). Le corsie nascono da un seme, sempre uguali per
// tutti: così il server manda solo il seme e il browser se le ricostruisce da solo (niente corsie in ogni tick).
// Una corsia: prato (g, con alberi), strada (s, auto e camion), fiume (f, tronchi), ninfee (n, ferme) o binario (b).
// Le auto e i tronchi girano su un anello lungo PERIODO caselle: la posizione dipende solo dal tempo.
(function (radice, fabbrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabbrica();
  else radice.StradaMondo = fabbrica();
})(typeof self !== 'undefined' ? self : this, function () {
  const COLS = 11, PERIODO = 19, MARGINE = 4;
  const LUNGO_TRENO = 14, V_TRENO = 26, AVVISO_TRENO = 1.4;

  // numeri a caso ripetibili (mulberry32)
  function rng(seme) { let a = seme >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const mod = (a, p) => ((a % p) + p) % p;

  // oggetti che scorrono (auto, tronchi) messi in fila sull'anello con spazi a caso ma mai troppo piccoli
  function mettiInFila(r, quanti, lungo, spazioMin) {
    const libero = PERIODO - quanti * lungo;
    const pesi = Array.from({ length: quanti }, () => 0.5 + r());
    const tot = pesi.reduce((a, b) => a + b, 0);
    const extra = libero - quanti * spazioMin;
    const o = []; let x = r() * PERIODO;
    for (let i = 0; i < quanti; i++) { o.push(Math.round(x * 100) / 100); x += lungo + spazioMin + (extra * pesi[i]) / tot; }
    return o;
  }

  function crea(seme) {
    const r = rng(seme);
    const corsie = [];
    let dirFiume = r() < 0.5 ? 1 : -1;
    const prato = (alberi) => ({ k: 'g', a: alberi });
    // alberi a caso, ma sempre almeno due colonne libere in comune con la riga di sotto (e sopra le ninfee)
    function alberiA(caso) {
      const sotto = corsie[corsie.length - 1];
      const bloccate = new Set(sotto && sotto.k === 'g' ? sotto.a : []);
      const obbligate = sotto && sotto.k === 'n' ? sotto.c : [];
      for (let prova = 0; prova < 20; prova++) {
        const a = [];
        for (let c = 0; c < COLS; c++) if (r() < caso && !obbligate.includes(c)) a.push(c);
        const liberiComuni = Array.from({ length: COLS }, (_, c) => c).filter((c) => !a.includes(c) && !bloccate.has(c));
        if (liberiComuni.length >= 2 && (!obbligate.length || obbligate.some((c) => !a.includes(c)))) return a;
      }
      return [];
    }
    function aggiungiGruppo() {
      const k = corsie.length, d = Math.min(1, k / 160);
      const x = r();
      if (x < 0.26) { // prato
        const quante = 1 + Math.floor(r() * 2);
        for (let i = 0; i < quante; i++) corsie.push(prato(alberiA(0.12 + 0.12 * r())));
      } else if (x < 0.58) { // strade
        const quante = 1 + Math.floor(r() * (2 + d * 2.5));
        for (let i = 0; i < quante; i++) {
          const camion = r() < 0.3, lungo = camion ? 2 : 1;
          const v = (1.4 + r() * 1.8 + d * 2.4) * (camion ? 0.8 : 1) * (r() < 0.5 ? 1 : -1);
          const nAuto = Math.max(1, Math.min(camion ? 3 : 4, Math.round(PERIODO / (lungo + 3.2 - d * 0.8)) - Math.floor(r() * 2)));
          corsie.push({ k: 's', v: Math.round(v * 100) / 100, l: lungo, o: mettiInFila(r, nAuto, lungo, 2.2), col: Math.floor(r() * 6) });
        }
      } else if (x < 0.84) { // fiume: tronchi a direzioni alterne, a volte una fila di ninfee
        const quante = 1 + Math.floor(r() * (2 + d * 2));
        for (let i = 0; i < quante; i++) {
          if (i > 0 && i < quante && r() < 0.22 && corsie[corsie.length - 1].k === 'f') {
            const c = []; for (let j = 0; j < COLS; j++) if (r() < 0.38) c.push(j);
            if (c.length < 3) c.push(...[1, 5, 9].filter((j) => !c.includes(j)));
            corsie.push({ k: 'n', c: c.sort((a, b) => a - b) });
            continue;
          }
          dirFiume = -dirFiume;
          const lungo = 2 + Math.floor(r() * (3 - d * 1.2 + 0.99));
          const v = (1.0 + r() * 1.0 + d * 1.2) * dirFiume;
          const nTronchi = Math.max(2, Math.round(PERIODO / (lungo + 3)));
          corsie.push({ k: 'f', v: Math.round(v * 100) / 100, l: lungo, o: mettiInFila(r, nTronchi, lungo, 1.4 + d * 0.6) });
        }
        corsie.push(prato(alberiA(0.1))); // dopo il fiume si scende sempre sull'erba
      } else { // binario
        corsie.push({ k: 'b', p: Math.round((6 + r() * 5 - d * 1.5) * 100) / 100, f: Math.round(r() * 10 * 100) / 100, v: r() < 0.5 ? 1 : -1 });
      }
    }
    // le prime righe: prato tranquillo
    for (let i = 0; i < 4; i++) corsie.push(prato(i === 0 ? [0, COLS - 1] : alberiA(0.1).filter((c) => c < 3 || c > 7)));
    return {
      seme,
      corsia(k) { if (k < 0) return prato([]); while (corsie.length <= k) aggiungiGruppo(); return corsie[k]; },
    };
  }

  // bordo sinistro (in caselle) degli oggetti di una corsia al tempo t: tra -MARGINE e COLS + MARGINE
  function oggetti(c, t) { return c.o.map((o) => mod(o + c.v * t, PERIODO) - MARGINE); }
  // il treno: fase del ciclo, posizione del muso e se la luce lampeggia
  function treno(c, t) {
    const tau = mod(t + c.f, c.p);
    const corsa = tau * V_TRENO;
    const passa = corsa < COLS + LUNGO_TRENO + 4;
    const a = c.v > 0 ? -LUNGO_TRENO - 2 + corsa : COLS + 2 - corsa;
    return { a, passa, avviso: tau > c.p - AVVISO_TRENO || passa };
  }
  // cosa succede a chi sta nella corsia c, centro px (in caselle), al tempo t:
  // null = al sicuro, altrimenti il motivo ('auto', 'treno', 'acqua'); per i tronchi dice anche la velocità di trascinamento
  const MEZZO = 0.3;
  function controlla(c, px, t) {
    if (c.k === 's') { for (const a of oggetti(c, t)) if (px + MEZZO > a + 0.08 && px - MEZZO < a + c.l - 0.08) return { morte: 'auto' }; return null; }
    if (c.k === 'b') { const tr = treno(c, t); if (tr.passa && px + MEZZO > tr.a && px - MEZZO < tr.a + LUNGO_TRENO) return { morte: 'treno' }; return null; }
    if (c.k === 'f') { for (const a of oggetti(c, t)) if (px >= a - 0.12 && px <= a + c.l + 0.12) return { tronco: c.v }; return { morte: 'acqua' }; }
    if (c.k === 'n') { const col = Math.floor(px); return c.c.includes(col) && Math.abs(px - (col + 0.5)) < 0.45 ? null : { morte: 'acqua' }; }
    return null;
  }
  const terra = (c) => c.k === 'g' || c.k === 's' || c.k === 'b';

  return { COLS, PERIODO, MARGINE, LUNGO_TRENO, V_TRENO, crea, oggetti, treno, controlla, terra, mod };
});
