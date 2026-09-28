// IL GATTO E I TOPI: stanza vista dall'alto con i mobili; il gatto segue il mouse, i topi vanno con la tastiera.
(() => {
  const { COLORI, lerp } = window.Arena;
  function topo(g, x, y, colore, nome, io, fermo, scudo) {
    g.save(); g.translate(x, y); g.globalAlpha = fermo ? 0.45 : 1;
    g.strokeStyle = '#c98f9a'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(-12, 4); g.quadraticCurveTo(-26, 10, -24, -8); g.stroke();
    g.fillStyle = '#9aa1ab'; g.beginPath(); g.ellipse(0, 0, 15, 11, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#c3c8cf'; g.beginPath(); g.arc(8, -9, 6, 0, Math.PI * 2); g.arc(8, 9, 6, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#f2a3b3'; g.beginPath(); g.arc(8, -9, 3, 0, Math.PI * 2); g.arc(8, 9, 3, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#222'; g.beginPath(); g.arc(13, -3, 1.8, 0, Math.PI * 2); g.arc(13, 3, 1.8, 0, Math.PI * 2); g.fill();
    g.fillStyle = colore; g.fillRect(2, -11, 3, 22);
    if (io) { g.strokeStyle = '#fff'; g.lineWidth = 2.5; g.beginPath(); g.ellipse(0, 0, 18, 14, 0, 0, Math.PI * 2); g.stroke(); }
    if (scudo) { g.strokeStyle = 'rgba(120,200,255,.8)'; g.lineWidth = 2; g.beginPath(); g.arc(0, 0, 22, 0, Math.PI * 2); g.stroke(); }
    g.restore();
    g.fillStyle = '#fff'; g.font = '600 12px system-ui'; g.textAlign = 'center'; g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = 3; g.strokeText(nome, x, y - 20); g.fillText(nome, x, y - 20);
  }
  function gatto(g, x, y, colore, nome, io) {
    g.save(); g.translate(x, y);
    g.fillStyle = '#e8923a'; g.beginPath(); g.arc(0, 0, 24, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.moveTo(-20, -12); g.lineTo(-16, -32); g.lineTo(-4, -20); g.fill(); g.beginPath(); g.moveTo(20, -12); g.lineTo(16, -32); g.lineTo(4, -20); g.fill();
    g.strokeStyle = '#b8641c'; g.lineWidth = 3; for (const k of [-10, 0, 10]) { g.beginPath(); g.moveTo(k, -22); g.lineTo(k, -14); g.stroke(); }
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(-8, -2, 6, 7, 0, 0, Math.PI * 2); g.ellipse(8, -2, 6, 7, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#1b5e20'; g.beginPath(); g.ellipse(-8, -1, 2.5, 5, 0, 0, Math.PI * 2); g.ellipse(8, -1, 2.5, 5, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#f48fb1'; g.beginPath(); g.moveTo(-3, 6); g.lineTo(3, 6); g.lineTo(0, 9); g.fill();
    g.strokeStyle = '#fff'; g.lineWidth = 1.2; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(s * 6, 9); g.lineTo(s * 26, 6); g.moveTo(s * 6, 11); g.lineTo(s * 26, 14); g.stroke(); }
    g.strokeStyle = colore; g.lineWidth = 4; g.beginPath(); g.arc(0, 0, 25, 0.4, Math.PI - 0.4); g.stroke();
    if (io) { g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, 28, 0, Math.PI * 2); g.stroke(); }
    g.restore();
    g.fillStyle = '#fff'; g.font = '700 13px system-ui'; g.textAlign = 'center'; g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = 3; g.strokeText(nome, x, y - 38); g.fillText(nome, x, y - 38);
  }

  // ---------- la stanza (disegnata una volta sola per tema e poi riusata) ----------
  const cache = new Map();
  const PAV = {
    soggiorno: { base: '#c8955e', linea: 'rgba(90,55,25,.25)', muro: '#e9dcc3', tappeto: ['#8e3b46', '#c9a15a'] },
    cucina: { base: '#eef0f2', linea: '#c9ced6', muro: '#cfe6e0', tappeto: null },
    cantina: { base: '#6f6a63', linea: 'rgba(0,0,0,.25)', muro: '#4a4540', tappeto: null },
    camera: { base: '#9fb7d6', linea: 'rgba(40,60,100,.12)', muro: '#f3e6ef', tappeto: ['#f4f1e8', '#e8a0b4'] },
    biblioteca: { base: '#7a4b2c', linea: 'rgba(0,0,0,.2)', muro: '#3f5a45', tappeto: ['#264d3b', '#d8b35a'] },
  };
  function rett(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function pavimento(g, tema, W, H) {
    const P = PAV[tema];
    g.fillStyle = P.base; g.fillRect(0, 0, W, H);
    g.strokeStyle = P.linea; g.lineWidth = 2;
    if (tema === 'soggiorno' || tema === 'biblioteca') {
      // parquet a listoni sfalsati con venature
      for (let y = 0; y < H; y += 40) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); for (let x = (y / 40) % 2 ? 0 : 90; x < W; x += 180) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 40); g.stroke(); } }
      g.strokeStyle = 'rgba(0,0,0,.06)'; g.lineWidth = 1; for (let k = 0; k < 120; k++) { const x = (k * 97) % W, y = ((k * 53) % (H / 40)) * 40 + 12 + (k % 3) * 7; g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + 20, y - 3, x + 40, y + 3, x + 70, y); g.stroke(); }
    } else if (tema === 'cucina') {
      for (let y = 0, r = 0; y < H; y += 50, r++) for (let x = 0, c = 0; x < W; x += 50, c++) { g.fillStyle = (r + c) % 2 ? '#dfe3e8' : '#f7f8fa'; g.fillRect(x, y, 50, 50); }
    } else if (tema === 'cantina') {
      // lastre di pietra irregolari
      for (let y = 0, k = 0; y < H; y += 62, k++) for (let x = -(k % 2) * 45; x < W; x += 90) {
        g.fillStyle = ['#77716a', '#6a655e', '#827b73'][(k + x / 90 + 9) % 3 | 0]; rett(g, x + 3, y + 3, 84, 56, 8); g.fill();
      }
      g.fillStyle = 'rgba(40,90,40,.25)'; for (let k = 0; k < 30; k++) { g.beginPath(); g.arc((k * 173) % W, (k * 89) % H, 6 + (k % 4) * 3, 0, Math.PI * 2); g.fill(); }
    } else if (tema === 'camera') {
      // moquette a puntini
      g.fillStyle = 'rgba(255,255,255,.12)'; for (let y = 6; y < H; y += 14) for (let x = (y % 28 ? 7 : 0); x < W; x += 14) g.fillRect(x, y, 2, 2);
    }
    // battiscopa e muri lungo i bordi
    g.fillStyle = P.muro; g.fillRect(0, 0, W, 12); g.fillRect(0, H - 12, W, 12); g.fillRect(0, 0, 12, H); g.fillRect(W - 12, 0, 12, H);
    g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(12, 12, W - 24, 4); g.fillRect(12, 12, 4, H - 24);
    // luce della finestra
    const luce = g.createRadialGradient(W * 0.72, -40, 20, W * 0.72, -40, 420); luce.addColorStop(0, tema === 'cantina' ? 'rgba(255,220,140,.25)' : 'rgba(255,250,220,.35)'); luce.addColorStop(1, 'rgba(255,250,220,0)');
    g.fillStyle = luce; g.fillRect(0, 0, W, H);
  }
  function tappeto(g, tema, W, H) {
    const P = PAV[tema]; if (!P.tappeto) return;
    const [c1, c2] = P.tappeto;
    g.fillStyle = 'rgba(0,0,0,.15)'; rett(g, W / 2 - 205, H / 2 - 125, 420, 260, 18); g.fill();
    g.fillStyle = c1; rett(g, W / 2 - 210, H / 2 - 130, 420, 260, 18); g.fill();
    g.strokeStyle = c2; g.lineWidth = 6; rett(g, W / 2 - 190, H / 2 - 110, 380, 220, 12); g.stroke();
    g.lineWidth = 2; rett(g, W / 2 - 175, H / 2 - 95, 350, 190, 10); g.stroke();
    g.fillStyle = c2; for (let k = 0; k < 4; k++) { g.save(); g.translate(W / 2, H / 2); g.rotate(k * Math.PI / 2); g.beginPath(); g.moveTo(0, -60); g.lineTo(18, -40); g.lineTo(0, -20); g.lineTo(-18, -40); g.fill(); g.restore(); }
    // frange
    g.strokeStyle = c2; g.lineWidth = 2; for (let x = W / 2 - 200; x <= W / 2 + 200; x += 10) { g.beginPath(); g.moveTo(x, H / 2 - 130); g.lineTo(x, H / 2 - 140); g.moveTo(x, H / 2 + 130); g.lineTo(x, H / 2 + 140); g.stroke(); }
  }
  function decorazioni(g, tema, W, H, mob) {
    const libero = (x, y, r) => mob.every(([mx, my, w, h]) => x < mx - r || x > mx + w + r || y < my - r || y > my + h + r);
    const piante = [[110, 300], [890, 300], [500, 70], [500, 560], [330, 560], [670, 60]];
    for (const [x, y] of piante) {
      if (!libero(x, y, 30) || tema === 'cantina') continue;
      g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(x + 3, y + 5, 16, 7, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#b5623a'; g.beginPath(); g.arc(x, y, 13, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#3f8a4a'; for (let k = 0; k < 7; k++) { const a = k * 0.9; g.beginPath(); g.ellipse(x + Math.cos(a) * 11, y + Math.sin(a) * 11, 11, 5, a, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = '#5fb56a'; g.beginPath(); g.arc(x, y, 6, 0, Math.PI * 2); g.fill();
    }
    if (tema === 'cantina') { // ragnatele e una lanterna
      g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1;
      for (const [cx, cy, sx, sy] of [[12, 12, 1, 1], [W - 12, 12, -1, 1]]) { for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + sx * 70 * Math.cos(k * 0.39), cy + sy * 70 * Math.sin(k * 0.39)); g.stroke(); } for (let r = 20; r <= 60; r += 20) { g.beginPath(); for (let k = 0; k < 5; k++) g.lineTo(cx + sx * r * Math.cos(k * 0.39), cy + sy * r * Math.sin(k * 0.39)); g.stroke(); } }
    }
    if (tema === 'cucina') { // ciotola del gatto
      g.fillStyle = '#d2463c'; g.beginPath(); g.ellipse(560, 560, 22, 12, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#7a4a2a'; g.beginPath(); g.ellipse(560, 558, 15, 7, 0, 0, Math.PI * 2); g.fill();
    }
  }
  function mobile(g, [x, y, w, h, tipo]) {
    g.save();
    g.fillStyle = 'rgba(0,0,0,.28)'; rett(g, x + 6, y + 8, w, h, 8); g.fill();
    const legno = (c1, c2) => { g.fillStyle = c1; rett(g, x, y, w, h, 6); g.fill(); g.fillStyle = c2; rett(g, x + 5, y + 5, w - 10, h - 10, 4); g.fill(); };
    if (tipo === 'divano') {
      g.fillStyle = '#4f6fa8'; rett(g, x, y, w, h, 12); g.fill();
      g.fillStyle = '#3d5a8d'; rett(g, x, y, w, h * 0.35, 10); g.fill(); rett(g, x, y, 16, h, 8); g.fill(); rett(g, x + w - 16, y, 16, h, 8); g.fill();
      g.fillStyle = '#6a8bc4'; const nc = Math.max(2, Math.round((w - 32) / 50)); for (let k = 0; k < nc; k++) { rett(g, x + 18 + k * ((w - 36) / nc), y + h * 0.38, (w - 36) / nc - 4, h * 0.55, 6); g.fill(); }
    } else if (tipo === 'tavolino' || tipo === 'tavolo' || tipo === 'scrivania') {
      legno('#6d4424', '#a2703f');
      if (tipo === 'tavolo') { g.fillStyle = '#fff'; rett(g, x + 12, y + 12, w - 24, h - 24, 4); g.globalAlpha = 0.9; g.fill(); g.globalAlpha = 1; g.fillStyle = '#e8e8e8'; for (const [a, b] of [[0.3, 0.3], [0.7, 0.3], [0.3, 0.7], [0.7, 0.7]]) { g.beginPath(); g.arc(x + w * a, y + h * b, 10, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#bbb'; g.lineWidth = 1; g.stroke(); } }
      else if (tipo === 'scrivania') { g.fillStyle = '#f3ecd9'; g.fillRect(x + 12, y + 14, 34, 24); g.fillStyle = '#2f5d8a'; g.fillRect(x + w - 34, y + 12, 18, 26); g.fillStyle = '#ffd86b'; g.beginPath(); g.arc(x + w - 22, y + h - 20, 9, 0, Math.PI * 2); g.fill(); }
      else { g.fillStyle = '#e8d4a8'; g.beginPath(); g.arc(x + w / 2, y + h / 2, 12, 0, Math.PI * 2); g.fill(); g.fillStyle = '#e45b72'; g.beginPath(); g.arc(x + w / 2, y + h / 2, 5, 0, Math.PI * 2); g.fill(); }
    } else if (tipo === 'libreria' || tipo === 'scaffale') {
      legno(tipo === 'scaffale' ? '#5a4632' : '#5b3620', tipo === 'scaffale' ? '#7a6248' : '#7b4a2a');
      const oriz = w >= h, n = Math.floor((oriz ? w : h) / 12);
      const colori = tipo === 'scaffale' ? ['#3f6b3a', '#6b3a2e', '#2f4f6b', '#8a7a3a'] : ['#b23a3a', '#2f5d8a', '#3a7a4a', '#c89b2a', '#6b3f8a', '#d2693c'];
      for (let k = 0; k < n; k++) {
        g.fillStyle = colori[(k * 7) % colori.length];
        if (tipo === 'scaffale') { const cx = oriz ? x + 10 + k * 12 : x + w / 2, cy = oriz ? y + h / 2 : y + 10 + k * 12; g.beginPath(); g.arc(cx, cy, 5, 0, Math.PI * 2); g.fill(); g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(cx - 1, cy - 4, 2, 3); }
        else if (oriz) g.fillRect(x + 7 + k * 12, y + 6 + (k % 3), 9, h - 12 - (k % 3)); else g.fillRect(x + 6 + (k % 3), y + 7 + k * 12, w - 12 - (k % 3), 9);
      }
    } else if (tipo === 'credenza' || tipo === 'armadio') {
      legno('#6e4527', '#8e5b33');
      g.strokeStyle = 'rgba(0,0,0,.3)'; g.lineWidth = 2; const nn = Math.max(2, Math.round(w / 45)); for (let k = 1; k < nn; k++) { g.beginPath(); g.moveTo(x + (w * k) / nn, y + 6); g.lineTo(x + (w * k) / nn, y + h - 6); g.stroke(); }
      g.fillStyle = '#e0c060'; for (let k = 0; k < nn; k++) { g.beginPath(); g.arc(x + (w * (k + 0.5)) / nn, y + h / 2, 3, 0, Math.PI * 2); g.fill(); }
    } else if (tipo === 'bancone' || tipo === 'forno' || tipo === 'lavello') {
      g.fillStyle = '#9aa3ad'; rett(g, x, y, w, h, 5); g.fill(); g.fillStyle = '#c7ced6'; rett(g, x + 4, y + 4, w - 8, h - 8, 4); g.fill();
      if (tipo === 'forno') { g.fillStyle = '#2c2f33'; for (const k of [0.25, 0.5, 0.75]) { g.beginPath(); g.arc(x + w * k, y + h / 2, 11, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#e25a3a'; g.lineWidth = 2; g.beginPath(); g.arc(x + w * k, y + h / 2, 7, 0, Math.PI * 2); g.stroke(); } }
      else if (tipo === 'lavello') { g.fillStyle = '#7d8893'; rett(g, x + 14, y + 10, w - 28, h - 20, 8); g.fill(); g.fillStyle = '#9cc9ec'; rett(g, x + 20, y + 15, w - 40, h - 30, 6); g.fill(); g.fillStyle = '#555'; g.fillRect(x + w / 2 - 3, y + 2, 6, 10); }
      else { g.fillStyle = '#e8b04a'; g.beginPath(); g.arc(x + w / 2, y + 30, 10, 0, Math.PI * 2); g.fill(); g.fillStyle = '#d64a3a'; g.beginPath(); g.arc(x + w / 2, y + h - 40, 9, 0, Math.PI * 2); g.fill(); g.fillStyle = '#6fbf4a'; g.beginPath(); g.ellipse(x + w / 2, y + h / 2, 8, 14, 0.4, 0, Math.PI * 2); g.fill(); }
    } else if (tipo === 'botte') {
      g.fillStyle = '#7a4a28'; g.beginPath(); g.arc(x + w / 2, y + h / 2, w / 2, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#3c3c3c'; g.lineWidth = 4; for (const r of [w / 2 - 3, w / 2 - 14]) { g.beginPath(); g.arc(x + w / 2, y + h / 2, r, 0, Math.PI * 2); g.stroke(); }
      g.fillStyle = '#5a3418'; g.beginPath(); g.arc(x + w / 2, y + h / 2, 5, 0, Math.PI * 2); g.fill();
    } else if (tipo === 'letto') {
      g.fillStyle = '#6a4a30'; rett(g, x, y, w, h, 8); g.fill();
      g.fillStyle = '#fff7ee'; rett(g, x + 6, y + 6, w - 12, h - 12, 6); g.fill();
      g.fillStyle = '#ffffff'; rett(g, x + 14, y + 12, w * 0.35, h - 24, 8); g.fill(); g.strokeStyle = '#e2d6c8'; g.lineWidth = 1.5; g.stroke();
      g.fillStyle = '#e8829b'; rett(g, x + w * 0.45, y + 8, w * 0.52, h - 16, 6); g.fill();
      g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 2; for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(x + w * 0.45 + k * w * 0.13, y + 10); g.lineTo(x + w * 0.45 + k * w * 0.13, y + h - 10); g.stroke(); }
    } else if (tipo === 'baule') {
      legno('#6a3e1f', '#8f5a2e'); g.fillStyle = '#c9a23a'; g.fillRect(x + 4, y + h / 2 - 4, w - 8, 8); g.fillRect(x + w / 2 - 8, y + h / 2 - 10, 16, 20);
    } else legno('#7b4a26', '#9a6536');
    g.restore();
  }
  function sfondo(tema, mob, W, H) {
    const chiave = tema + JSON.stringify(mob);
    if (cache.has(chiave)) return cache.get(chiave);
    const c = document.createElement('canvas'); c.width = W * 1.5; c.height = H * 1.5;
    const g = c.getContext('2d'); g.scale(1.5, 1.5);
    pavimento(g, tema, W, H); tappeto(g, tema, W, H); decorazioni(g, tema, W, H, mob);
    // tane nei muri agli angoli
    for (const [x, y] of [[40, 40], [W - 40, 40], [40, H - 40], [W - 40, H - 40]]) {
      g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.arc(x, y, 30, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#2a170b'; g.beginPath(); g.arc(x, y + 4, 24, Math.PI, 0); g.lineTo(x + 24, y + 16); g.lineTo(x - 24, y + 16); g.fill();
    }
    for (const m of mob) mobile(g, m);
    if (cache.size > 12) cache.clear();
    cache.set(chiave, c);
    return c;
  }
  const eGatto = (ctx) => { const s = ctx.partita.stato.s; return s && s.g === ctx.mio; };
  const tavolo = window.Arena.tavolo({
    id: 'gattotopi',
    mouse: 'bersaglio',
    clicAzione: false,
    obiettivo: 'formaggi 1 · prese 3',
    ruolo: (p, s, ctx) => (s.s.g === ctx.mio ? 'sei il GATTO 🐱' : `sei un TOPO 🐭 · il gatto è ${ctx.nome(s.s.g)}`),
    sottotitolo: (p, ctx) => (eGatto(ctx) ? 'sei il gatto 🐱' : 'sei un topo 🐭'),
    istruzioni: (ctx) => (eGatto(ctx) ? 'Sei il gatto: muovi il mouse (o il dito sul campo) e il gatto lo segue. Prendi i topi: 3 punti!' : 'Sei un topo: WASD o frecce (sul telefono il joystick). Prendi i formaggi e non farti acchiappare!'),
    statoGioco: (ctx, s) => (s.s.g === ctx.mio ? 'Acchiappa i topi!' : 'Scappa e mangia!'),
    hud: (ctx, s) => `<span>⏱️ ${s.s.resta} s</span><span>🐱 ${ctx.partita && s.s.g === ctx.mio ? 'tu' : ctx.nome(s.s.g)}</span><span>🧀 ${s.s.fo.length} in giro</span>`,
    fineRound: (p, s, ctx) => `Punti totali: ${p.punti[ctx.mio]}`,
    disegna(g, p, s, prima, u, ctx) {
      const W = p.W, H = p.H;
      g.drawImage(sfondo(s.s.te || 'soggiorno', s.s.mob || [], W, H), 0, 0, W, H);
      for (const f of s.s.fo) { g.fillStyle = '#f6c431'; g.beginPath(); g.moveTo(f.x - 13, f.y + 9); g.lineTo(f.x + 13, f.y + 9); g.lineTo(f.x + 11, f.y - 9); g.closePath(); g.fill(); g.strokeStyle = '#c8961a'; g.lineWidth = 2; g.stroke(); g.fillStyle = '#e0a91c'; g.beginPath(); g.arc(f.x + 4, f.y + 2, 2.5, 0, Math.PI * 2); g.arc(f.x - 3, f.y + 5, 2, 0, Math.PI * 2); g.fill(); }
      const ee = lerp(prima && prima.s.e, s.s.e, u);
      ee.forEach((e, i) => { if (i !== s.s.g) topo(g, e.x, e.y, COLORI[i % COLORI.length], i === ctx.mio ? 'Tu' : ctx.nome(i).slice(0, 10), i === ctx.mio, e.f, e.sc); });
      const c = ee[s.s.g]; if (c) gatto(g, c.x, c.y, COLORI[s.s.g % COLORI.length], s.s.g === ctx.mio ? 'Tu' : ctx.nome(s.s.g).slice(0, 10), s.s.g === ctx.mio);
    },
  });
  Object.assign(window.Tavoli, { gattotopi: tavolo });
})();
