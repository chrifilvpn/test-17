// Le 9 buche di Putt Party 2D (usate dal server e dal browser). Campo 1000 × 600.
// Ogni buca: bordo (poligono chiuso), muri interni (segmenti), respingenti (cerchi), sabbia e acqua (rettangoli
// x, y, larghezza, altezza), ostacoli che si muovono (mulini che girano, blocchi che scorrono), partenza e buca.
(function (radice, fabbrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabbrica();
  else radice.PuttBuche = fabbrica();
})(typeof self !== 'undefined' ? self : this, function () {
  const W = 1000, H = 600, R_PALLA = 8, R_BUCA = 13;
  const BUCHE = [
    { id: 'rettilineo', nome: 'Il rettilineo', difficolta: 1, par: 2,
      bordo: [[100, 220], [900, 220], [900, 380], [100, 380]], partenza: [170, 300], buca: [820, 300] },
    { id: 'curva', nome: 'La curva a L', difficolta: 1, par: 3,
      bordo: [[100, 90], [380, 90], [380, 390], [900, 390], [900, 540], [100, 540]], partenza: [240, 170], buca: [820, 465] },
    { id: 'respingenti', nome: 'I respingenti', difficolta: 2, par: 3,
      bordo: [[100, 120], [900, 120], [900, 480], [100, 480]], partenza: [170, 300], buca: [840, 300],
      respingenti: [[400, 215, 38], [400, 385, 38], [600, 300, 44], [760, 195, 26], [760, 405, 26]] },
    { id: 'sabbia', nome: 'La trappola di sabbia', difficolta: 2, par: 3,
      bordo: [[100, 180], [900, 180], [900, 440], [100, 440]], partenza: [170, 300], buca: [835, 300],
      muri: [[480, 180, 480, 340]], sabbia: [[640, 220, 130, 180]] },
    { id: 'ponte', nome: 'Il ponte sull\'acqua', difficolta: 3, par: 2,
      bordo: [[80, 120], [920, 120], [920, 480], [80, 480]], partenza: [160, 300], buca: [840, 300],
      acqua: [[330, 120, 340, 150], [330, 330, 340, 150]] },
    { id: 'zigzag', nome: 'Lo zig-zag', difficolta: 3, par: 4,
      bordo: [[100, 80], [900, 80], [900, 520], [100, 520]], partenza: [190, 150], buca: [810, 460],
      muri: [[300, 80, 300, 400], [500, 200, 500, 520], [700, 80, 700, 400]] },
    { id: 'mulino', nome: 'Il mulino a vento', difficolta: 4, par: 3,
      bordo: [[100, 150], [900, 150], [900, 450], [100, 450]], partenza: [180, 300], buca: [825, 300],
      muri: [[600, 150, 600, 245], [600, 355, 600, 450]], mulini: [{ x: 600, y: 300, l: 80, w: 1.5, pale: 2 }], sabbia: [[330, 150, 90, 70], [330, 380, 90, 70]] },
    { id: 'porte', nome: 'Le porte mobili', difficolta: 4, par: 3,
      bordo: [[80, 100], [920, 100], [920, 500], [80, 500]], partenza: [160, 300], buca: [845, 300],
      muri: [[380, 100, 380, 240], [380, 360, 380, 500], [640, 100, 640, 240], [640, 360, 640, 500]],
      scorrevoli: [{ x: 370, y0: 170, y1: 430, w: 20, h: 110, periodo: 2.6, fase: 0 }, { x: 630, y0: 170, y1: 430, w: 20, h: 110, periodo: 1.9, fase: 1.3 }] },
    { id: 'labirinto', nome: 'Il labirinto', difficolta: 5, par: 6,
      bordo: [[60, 60], [940, 60], [940, 540], [60, 540]], partenza: [140, 480], buca: [870, 470],
      muri: [[220, 60, 220, 420], [380, 180, 380, 540], [540, 60, 540, 420], [700, 180, 700, 540]],
      acqua: [[548, 475, 144, 65]], sabbia: [[390, 60, 140, 60]],
      mulini: [{ x: 820, y: 300, l: 62, w: -1.9, pale: 3 }] },
  ];

  // segmenti fissi di una buca (bordo e muri)
  function segmentiFissi(b) {
    const s = [];
    for (let i = 0; i < b.bordo.length; i++) { const p = b.bordo[i], q = b.bordo[(i + 1) % b.bordo.length]; s.push([p[0], p[1], q[0], q[1]]); }
    for (const m of b.muri || []) s.push(m);
    return s;
  }
  // segmenti che si muovono, al tempo t (secondi dall'inizio della buca)
  function segmentiMobili(b, t) {
    const s = [];
    for (const m of b.mulini || []) {
      for (let k = 0; k < m.pale; k++) {
        const a = m.w * t + (k * Math.PI) / m.pale;
        const dx = Math.cos(a) * m.l, dy = Math.sin(a) * m.l;
        s.push([m.x - dx, m.y - dy, m.x + dx, m.y + dy]);
      }
    }
    for (const r of b.scorrevoli || []) {
      const y = posScorrevole(r, t);
      s.push([r.x, y, r.x + r.w, y], [r.x + r.w, y, r.x + r.w, y + r.h], [r.x + r.w, y + r.h, r.x, y + r.h], [r.x, y + r.h, r.x, y]);
    }
    return s;
  }
  function posScorrevole(r, t) { const u = (Math.sin((2 * Math.PI * t) / r.periodo + r.fase) + 1) / 2; return r.y0 + u * (r.y1 - r.h - r.y0); }
  const dentro = (x, y, r) => x >= r[0] && x <= r[0] + r[2] && y >= r[1] && y <= r[1] + r[3];

  return { W, H, R_PALLA, R_BUCA, BUCHE, segmentiFissi, segmentiMobili, posScorrevole, dentro };
});
