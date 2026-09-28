// PAINTBALL: campo d'erba visto dall'alto, muretti, palline e macchie di vernice.
(() => {
  const { COLORI, lerp, omino } = window.Arena;

  // ---------- il campo: terreno, decorazioni e ripari, disegnati una volta per tema ----------
  const cache = new Map();
  const ANGOLI = [[50, 50], [950, 570], [950, 50], [50, 570], [500, 40], [500, 580], [40, 310], [960, 310]];
  function rett(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function terreno(g, te, W, H) {
    const T = { bosco: ['#5d9b4a', '#6aa955'], cantiere: ['#a9a49a', '#9b968c'], fortino: ['#8c7a55', '#9a8660'], citta: ['#5a5e66', '#646871'], deserto: ['#e0c38a', '#d6b57a'] }[te];
    g.fillStyle = T[0]; g.fillRect(0, 0, W, H);
    if (te === 'bosco') {
      g.fillStyle = T[1]; for (let x = 0; x < W; x += 80) g.fillRect(x, 0, 40, H);
      g.fillStyle = 'rgba(150,110,60,.35)'; g.beginPath(); g.moveTo(0, H * 0.55); g.bezierCurveTo(W * 0.3, H * 0.2, W * 0.7, H * 0.8, W, H * 0.45); g.lineTo(W, H * 0.45 + 40); g.bezierCurveTo(W * 0.7, H * 0.8 + 40, W * 0.3, H * 0.2 + 40, 0, H * 0.55 + 40); g.fill();
      for (let k = 0; k < 60; k++) { g.fillStyle = ['#f2d14a', '#ffffff', '#e86a8a'][k % 3]; g.beginPath(); g.arc((k * 173) % W, (k * 97) % H, 2.5, 0, Math.PI * 2); g.fill(); }
    } else if (te === 'cantiere') {
      g.strokeStyle = 'rgba(0,0,0,.08)'; g.lineWidth = 2; for (let x = 0; x < W; x += 100) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); } for (let y = 0; y < H; y += 100) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
      g.fillStyle = 'rgba(60,50,40,.25)'; for (let k = 0; k < 8; k++) { g.beginPath(); g.ellipse((k * 211) % W, (k * 137) % H, 40, 18, k, 0, Math.PI * 2); g.fill(); }
      // strisce gialle e nere sui bordi
      for (let x = 0; x < W; x += 30) { g.fillStyle = (x / 30) % 2 ? '#1d1d1d' : '#f2c230'; g.fillRect(x, 0, 30, 8); g.fillRect(x, H - 8, 30, 8); }
    } else if (te === 'fortino') {
      g.fillStyle = T[1]; for (let k = 0; k < 90; k++) { g.beginPath(); g.arc((k * 131) % W, (k * 71) % H, 3 + (k % 4), 0, Math.PI * 2); g.fill(); }
      g.strokeStyle = 'rgba(80,60,30,.35)'; g.lineWidth = 3; for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo((k * 170) % W, 0); g.lineTo((k * 170 + 120) % W, H); g.stroke(); }
    } else if (te === 'citta') {
      // strade con le strisce e i marciapiedi
      g.fillStyle = '#44474e'; g.fillRect(0, H / 2 - 40, W, 80); g.fillRect(W / 2 - 40, 0, 80, H);
      g.fillStyle = '#f5f5f5'; for (let x = 0; x < W; x += 60) if (Math.abs(x + 15 - W / 2) > 60) g.fillRect(x, H / 2 - 3, 30, 6); for (let y = 0; y < H; y += 60) if (Math.abs(y + 15 - H / 2) > 60) g.fillRect(W / 2 - 3, y, 6, 30);
      g.fillStyle = 'rgba(255,255,255,.8)'; for (let k = 0; k < 6; k++) g.fillRect(W / 2 - 60 + k * 20, H / 2 + 46, 10, 30);
    } else {
      g.strokeStyle = 'rgba(160,120,60,.35)'; g.lineWidth = 3; for (let y = 20; y < H; y += 40) { g.beginPath(); for (let x = 0; x <= W; x += 20) g.lineTo(x, y + Math.sin(x / 60 + y) * 6); g.stroke(); }
      g.fillStyle = 'rgba(120,90,50,.4)'; for (let k = 0; k < 40; k++) { g.beginPath(); g.arc((k * 173) % W, (k * 89) % H, 2, 0, Math.PI * 2); g.fill(); }
    }
    // piazzole di partenza
    ANGOLI.forEach(([x, y], i) => { g.strokeStyle = COLORI[i % COLORI.length]; g.globalAlpha = 0.45; g.lineWidth = 3; g.setLineDash([6, 5]); g.beginPath(); g.arc(x, y, 26, 0, Math.PI * 2); g.stroke(); g.setLineDash([]); g.globalAlpha = 1; });
  }
  function riparo(g, [x, y, w, h, t]) {
    g.fillStyle = 'rgba(0,0,0,.3)'; rett(g, x + 5, y + 7, w, h, 6); g.fill();
    if (t === 'tronco') {
      const o = w >= h; g.fillStyle = '#6b4424'; rett(g, x, y, w, h, Math.min(w, h) / 2); g.fill();
      g.strokeStyle = '#4e2f16'; g.lineWidth = 2; for (let k = 1; k < 3; k++) { g.beginPath(); if (o) { g.moveTo(x + 10, y + (h * k) / 3); g.lineTo(x + w - 10, y + (h * k) / 3); } else { g.moveTo(x + (w * k) / 3, y + 10); g.lineTo(x + (w * k) / 3, y + h - 10); } g.stroke(); }
      g.fillStyle = '#c69a62'; g.beginPath(); if (o) g.ellipse(x + w - 4, y + h / 2, 5, h / 2 - 2, 0, 0, Math.PI * 2); else g.ellipse(x + w / 2, y + h - 4, w / 2 - 2, 5, 0, 0, Math.PI * 2); g.fill();
    } else if (t === 'roccia') {
      const gr = g.createRadialGradient(x + w * 0.3, y + h * 0.3, 2, x + w / 2, y + h / 2, Math.max(w, h) * 0.7); gr.addColorStop(0, '#b8b2a7'); gr.addColorStop(1, '#6b655c');
      g.fillStyle = gr; rett(g, x, y, w, h, Math.min(w, h) * 0.35); g.fill(); g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 2; g.stroke();
    } else if (t === 'siepe') {
      g.fillStyle = '#2f6b33'; rett(g, x, y, w, h, 8); g.fill();
      const o = w >= h; for (let k = 0; k < (o ? w : h); k += 14) { g.fillStyle = (k / 14) % 2 ? '#3f8a44' : '#347a39'; g.beginPath(); g.arc(o ? x + k + 7 : x + w / 2, o ? y + h / 2 : y + k + 7, Math.min(w, h) * 0.55, 0, Math.PI * 2); g.fill(); }
    } else if (t === 'container') {
      g.fillStyle = ['#c0392b', '#2471a3', '#1e8449', '#b9770e'][Math.round(x + y) % 4]; g.fillRect(x, y, w, h);
      g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 2; const o = w >= h; for (let k = 8; k < (o ? w : h) - 4; k += 10) { g.beginPath(); if (o) { g.moveTo(x + k, y + 3); g.lineTo(x + k, y + h - 3); } else { g.moveTo(x + 3, y + k); g.lineTo(x + w - 3, y + k); } g.stroke(); }
      g.strokeRect(x, y, w, h);
    } else if (t === 'bidone') {
      g.fillStyle = '#2f5d8a'; g.beginPath(); g.arc(x + w / 2, y + h / 2, w / 2, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#1c3a57'; g.lineWidth = 3; g.beginPath(); g.arc(x + w / 2, y + h / 2, w / 2 - 6, 0, Math.PI * 2); g.stroke();
      g.fillStyle = '#f2c230'; g.font = '16px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('☢', x + w / 2, y + h / 2 + 1); g.textBaseline = 'alphabetic';
    } else if (t === 'cassa') {
      g.fillStyle = '#b07c42'; g.fillRect(x, y, w, h); g.strokeStyle = '#7a5226'; g.lineWidth = 3; g.strokeRect(x + 2, y + 2, w - 4, h - 4);
      g.beginPath(); g.moveTo(x + 4, y + 4); g.lineTo(x + w - 4, y + h - 4); g.moveTo(x + w - 4, y + 4); g.lineTo(x + 4, y + h - 4); g.stroke();
    } else if (t === 'sacchi') {
      const o = w >= h, n = Math.max(2, Math.round((o ? w : h) / 24));
      for (let k = 0; k < n; k++) { g.fillStyle = k % 2 ? '#c8b07a' : '#bba36c'; const a = (k * (o ? w : h)) / n; rett(g, o ? x + a : x, o ? y : y + a, o ? (o ? w : h) / n + 2 : w, o ? h : (o ? w : h) / n + 2, 7); g.fill(); g.strokeStyle = '#8a7444'; g.lineWidth = 1.5; g.stroke(); }
    } else if (t === 'edificio') {
      g.fillStyle = '#9a8f86'; g.fillRect(x, y, w, h); g.fillStyle = '#7d736b'; g.fillRect(x + 6, y + 6, w - 12, h - 12);
      g.fillStyle = '#5f5750'; g.fillRect(x + w * 0.2, y + h * 0.2, w * 0.25, h * 0.2); g.fillStyle = '#a7c7d9'; g.fillRect(x + w * 0.6, y + h * 0.55, 16, 16);
      g.strokeStyle = '#4d4640'; g.lineWidth = 2; g.strokeRect(x, y, w, h);
    } else if (t === 'auto') {
      g.fillStyle = '#d6453a'; rett(g, x, y, w, h, 12); g.fill(); g.fillStyle = '#a7c7d9'; rett(g, x + w * 0.22, y + 6, w * 0.2, h - 12, 4); g.fill(); rett(g, x + w * 0.62, y + 6, w * 0.16, h - 12, 4); g.fill();
      g.fillStyle = '#222'; for (const [a, b] of [[0.18, -3], [0.78, -3], [0.18, h - 3], [0.78, h - 3]]) g.fillRect(x + w * a - 8, y + b, 16, 6);
    } else if (t === 'cassonetto') {
      g.fillStyle = '#3f7a44'; g.fillRect(x, y, w, h); g.fillStyle = '#2e5c33'; g.fillRect(x, y, w, 10); g.strokeStyle = '#224a27'; g.lineWidth = 2; g.strokeRect(x, y, w, h);
    } else if (t === 'cactus') {
      g.fillStyle = '#3f8a44'; g.beginPath(); g.arc(x + w / 2, y + h / 2, w / 2, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#2f6b33'; g.lineWidth = 2; for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; g.beginPath(); g.moveTo(x + w / 2, y + h / 2); g.lineTo(x + w / 2 + Math.cos(a) * w / 2, y + h / 2 + Math.sin(a) * w / 2); g.stroke(); }
      g.fillStyle = '#f07ab8'; g.beginPath(); g.arc(x + w / 2, y + h / 2, 4, 0, Math.PI * 2); g.fill();
    } else if (t === 'rovina') {
      g.fillStyle = '#c9a86a'; g.fillRect(x, y, w, h); g.strokeStyle = '#9a7a44'; g.lineWidth = 2; const o = w >= h;
      for (let k = 0; k < (o ? w : h); k += 30) { if (o) g.strokeRect(x + k, y, 30, h); else g.strokeRect(x, y + k, w, 30); }
    } else { g.fillStyle = '#8d8f99'; g.fillRect(x, y, w, h); }
  }
  function campo(te, bl, W, H) {
    const chiave = te + bl.length;
    if (cache.has(chiave)) return cache.get(chiave);
    const c = document.createElement('canvas'); c.width = W * 1.5; c.height = H * 1.5;
    const g = c.getContext('2d'); g.scale(1.5, 1.5);
    terreno(g, te, W, H);
    for (const b of bl) riparo(g, b);
    cache.set(chiave, c);
    return c;
  }
  const NOMI_CAMPO = { bosco: 'Bosco 🌲', cantiere: 'Cantiere 🚧', fortino: 'Fortino 🪖', citta: 'Città 🏙️', deserto: 'Deserto 🌵' };
  const tavolo = window.Arena.tavolo({
    id: 'paintball',
    mouse: 'mira',
    nomeAzione: '🎯 Spara',
    obiettivo: 'centri',
    suonoAzione: [[700, 0.02], [300, 0.04]],
    istruzioni: () => 'WASD o frecce per muoverti, mira col mouse e clicca per sparare (sul telefono: joystick e tocca il campo dove vuoi sparare).',
    statoGioco: (ctx, s) => { const e = s.s.e[ctx.mio]; return e && e.m ? 'Colpito! Riparti…' : 'Fai centro!'; },
    hud: (ctx, s) => `<span>${NOMI_CAMPO[s.s.te] || ''}</span><span>⏱️ ${s.s.resta} s</span><span>🎯 ${ctx.partita.punti[ctx.mio]}</span>`,
    fineRound: (p, s, ctx) => `Centri totali: ${p.punti[ctx.mio]}`,
    disegna(g, p, s, prima, u, ctx) {
      const W = p.W, H = p.H;
      g.drawImage(campo(s.s.te || 'bosco', s.s.bl, W, H), 0, 0, W, H);
      for (const k of s.s.mc) { g.fillStyle = COLORI[k.c % COLORI.length]; g.globalAlpha = 0.75; g.beginPath(); for (let j = 0; j < 9; j++) { const a = (j / 9) * Math.PI * 2, r = k.r * (0.7 + ((j * 7 + k.x) % 5) / 10); g.lineTo(k.x + Math.cos(a) * r, k.y + Math.sin(a) * r); } g.fill(); g.globalAlpha = 1; }
      for (const b of lerp(prima && prima.s.pa, s.s.pa, u)) { g.fillStyle = COLORI[b.c % COLORI.length]; g.beginPath(); g.arc(b.x, b.y, 6, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.stroke(); }
      const ee = lerp(prima && prima.s.e, s.s.e, u);
      ee.forEach((e, i) => {
        if (e.m) return;
        // la canna del fucile verso dove mira
        const d = Math.hypot(e.ax - e.x, e.ay - e.y) || 1;
        g.strokeStyle = '#333'; g.lineWidth = 6; g.beginPath(); g.moveTo(e.x, e.y); g.lineTo(e.x + ((e.ax - e.x) / d) * 26, e.y + ((e.ay - e.y) / d) * 26); g.stroke();
        omino(g, e.x, e.y, 16, COLORI[i % COLORI.length], i === ctx.mio ? 'Tu' : ctx.nome(i).slice(0, 10), { io: i === ctx.mio, alfa: e.pr ? 0.55 : 1 });
      });
      // il mirino
      const mio = ee[ctx.mio];
      if (mio && !mio.m && !window.Arena.touch()) { g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 2; g.beginPath(); g.arc(mio.ax, mio.ay, 10, 0, Math.PI * 2); g.moveTo(mio.ax - 15, mio.ay); g.lineTo(mio.ax + 15, mio.ay); g.moveTo(mio.ax, mio.ay - 15); g.lineTo(mio.ax, mio.ay + 15); g.stroke(); }
    },
    dopoTick(ctx, d, prima) { const a = prima && prima.s.e[ctx.mio], b = d.s.e[ctx.mio]; if (a && b && !a.m && b.m) window.Nuovi.suono([[200, 0.1], [120, 0.2]], { volume: 0.08 }); },
  });
  Object.assign(window.Tavoli, { paintball: tavolo });
})();
