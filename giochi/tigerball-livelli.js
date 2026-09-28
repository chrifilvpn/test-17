// TIGERBALL: i livelli e la fisica (usati dal server e dal browser). Campo 1000 × 620 visto di lato, con la gravità.
// Ogni livello: muri e piattaforme (segmenti), respingenti e pioli (cerchi con un loro rimbalzo), pale che girano,
// blocchi che si spostano avanti e indietro, il cesto (aperto in alto) e il punto di lancio. Le parti che si muovono
// dipendono solo dal tempo: il browser le disegna nello stesso punto in cui il server le usa.
(function (radice, fabbrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabbrica();
  else radice.TigerLivelli = fabbrica();
})(typeof self !== 'undefined' ? self : this, function () {
  const W = 1000, H = 620, R_PALLA = 11, GRAV = 900, V_MAX = 950, RIMBALZO = 0.55, ATTRITO_ROTOLA = 1.8;
  const cornice = [[0, 0, W, 0], [0, 0, 0, H - 40], [W, 0, W, H - 40]]; // tetto e pareti (in basso, dove manca il pavimento, si cade)
  const LIVELLI = [
    { id: 'primo', nome: 'Primo lancio', partenza: [140, 470], cesto: { x: 690, y: 560, w: 90, h: 70 },
      seg: [[40, 560, 960, 560], [100, 490, 180, 490]] },
    { id: 'muro', nome: 'Il muro', partenza: [130, 470], cesto: { x: 760, y: 560, w: 90, h: 70 },
      seg: [[40, 560, 960, 560], [90, 490, 170, 490], [520, 560, 520, 250], [505, 250, 535, 250]] },
    { id: 'molla', nome: 'Il rimbalzo', partenza: [120, 470], cesto: { x: 800, y: 300, w: 100, h: 70 },
      seg: [[40, 560, 960, 560], [80, 490, 160, 490], [770, 300, 960, 300], [620, 300, 620, 560], [80, 90, 640, 90]], molle: [[440, 548, 30, 1.25]] },
    { id: 'finestra', nome: 'La finestra', partenza: [130, 470], cesto: { x: 780, y: 560, w: 90, h: 70 },
      seg: [[40, 560, 960, 560], [90, 490, 170, 490], [560, 0, 560, 300], [560, 380, 560, 560]] },
    { id: 'mulino', nome: 'Il mulino', partenza: [130, 470], cesto: { x: 760, y: 560, w: 90, h: 70 },
      seg: [[40, 560, 960, 560], [90, 490, 170, 490], [700, 560, 700, 430], [880, 560, 880, 430]], pale: [{ cx: 560, cy: 360, l: 190, om: 1.5, f: 0 }] },
    { id: 'ascensore', nome: 'Il blocco che va e viene', partenza: [130, 470], cesto: { x: 820, y: 330, w: 90, h: 70 },
      seg: [[40, 560, 960, 560], [90, 490, 170, 490], [800, 330, 960, 330]], blocchi: [{ x: 600, y: 200, w: 40, h: 220, ax: 0, ay: 150, om: 1.3, f: 0 }] },
    { id: 'pioli', nome: 'La pioggia di pioli', partenza: [120, 200], cesto: { x: 600, y: 590, w: 100, h: 70 },
      seg: [[70, 240, 170, 240], [400, 590, 600, 590], [700, 590, 900, 590], [400, 590, 400, 540], [900, 590, 900, 540]],
      molle: [[480, 300, 10, 0.6], [560, 300, 10, 0.6], [640, 300, 10, 0.6], [720, 300, 10, 0.6], [800, 300, 10, 0.6], [520, 380, 10, 0.6], [600, 380, 10, 0.6], [680, 380, 10, 0.6], [760, 380, 10, 0.6], [480, 460, 10, 0.6], [560, 460, 10, 0.6], [640, 460, 10, 0.6], [720, 460, 10, 0.6], [800, 460, 10, 0.6]] },
    { id: 'burrone', nome: 'Sopra il burrone', partenza: [110, 420], cesto: { x: 800, y: 470, w: 90, h: 70 },
      seg: [[40, 450, 230, 450], [760, 470, 940, 470], [500, 0, 500, 180], [420, 180, 580, 180]], molle: [[380, 610, 40, 1.3]] },
  ];
  // posizioni delle parti mobili al tempo t
  function pala(p, t) { const a = p.f + p.om * t, dx = Math.cos(a) * p.l / 2, dy = Math.sin(a) * p.l / 2; return [p.cx - dx, p.cy - dy, p.cx + dx, p.cy + dy]; }
  function blocco(b, t) { const s = Math.sin(b.om * t + b.f); return { x: b.x + b.ax * s, y: b.y + b.ay * s, w: b.w, h: b.h }; }
  function segmenti(L, t) {
    const c = L.cesto, out = cornice.concat(L.seg, [[c.x, c.y - c.h, c.x, c.y], [c.x, c.y, c.x + c.w, c.y], [c.x + c.w, c.y, c.x + c.w, c.y - c.h]]);
    for (const p of L.pale || []) out.push(pala(p, t));
    for (const b of L.blocchi || []) { const q = blocco(b, t); out.push([q.x, q.y, q.x + q.w, q.y], [q.x + q.w, q.y, q.x + q.w, q.y + q.h], [q.x + q.w, q.y + q.h, q.x, q.y + q.h], [q.x, q.y + q.h, q.x, q.y]); }
    return out;
  }
  function urtaSegmento(p, [x1, y1, x2, y2]) {
    const dx = x2 - x1, dy = y2 - y1, l2 = dx * dx + dy * dy || 1;
    const u = Math.max(0, Math.min(1, ((p.x - x1) * dx + (p.y - y1) * dy) / l2));
    const cx = x1 + u * dx, cy = y1 + u * dy, ex = p.x - cx, ey = p.y - cy, d = Math.hypot(ex, ey);
    if (d >= R_PALLA) return false;
    let nx, ny; if (d > 1e-6) { nx = ex / d; ny = ey / d; } else { const l = Math.sqrt(l2); nx = -dy / l; ny = dx / l; }
    p.x = cx + nx * R_PALLA; p.y = cy + ny * R_PALLA;
    const vn = p.vx * nx + p.vy * ny;
    if (vn < 0) {
      p.vx -= (1 + (vn < -60 ? RIMBALZO : 0)) * vn * nx; p.vy -= (1 + (vn < -60 ? RIMBALZO : 0)) * vn * ny;
      if (ny < -0.5) p.terra = true; // appoggiata su qualcosa: rotola e si ferma
    }
    return true;
  }
  // fa avanzare la pallina di dt secondi al tempo t (a piccoli passi, così non attraversa i muri)
  function passo(L, p, t, dt, segs) {
    const passi = Math.max(1, Math.ceil((Math.hypot(p.vx, p.vy) * dt) / 4));
    const h = dt / passi;
    for (let k = 0; k < passi; k++) {
      p.vy += GRAV * h; p.x += p.vx * h; p.y += p.vy * h; p.terra = false;
      for (const s of segs) urtaSegmento(p, s);
      for (const [cx, cy, r, e] of L.molle || []) {
        const dx = p.x - cx, dy = p.y - cy, d = Math.hypot(dx, dy);
        if (d < r + R_PALLA && d > 0) { const nx = dx / d, ny = dy / d; p.x = cx + nx * (r + R_PALLA); p.y = cy + ny * (r + R_PALLA); const vn = p.vx * nx + p.vy * ny; if (vn < 0) { p.vx -= (1 + e) * vn * nx; p.vy -= (1 + e) * vn * ny; p.molla = true; } }
      }
      if (p.terra) { const k2 = Math.exp(-ATTRITO_ROTOLA * h); p.vx *= k2; }
    }
  }
  // la pallina è nel cesto: dentro il rettangolo e ormai lenta
  const nelCesto = (L, p) => { const c = L.cesto; return p.x > c.x + 2 && p.x < c.x + c.w - 2 && p.y > c.y - c.h && p.y < c.y && Math.hypot(p.vx, p.vy) < 230; };
  const fuori = (p) => p.x < -60 || p.x > W + 60 || p.y > H + 60;
  return { W, H, R_PALLA, GRAV, V_MAX, LIVELLI, segmenti, passo, nelCesto, fuori, pala, blocco };
});
