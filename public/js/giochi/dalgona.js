// DALGONA: il tuo biscotto di caramello grande al centro, con il solco della forma, il pezzo già ritagliato, le crepe
// che crescono e l'ago. A lato gli altri giocatori con il loro avanzamento. Rotto: il biscotto si spacca, macchia rossa
// stilizzata e nome grigio. Finito: la forma si stacca e si solleva.
(() => {
  const { COLORI, lerp } = window.Arena;
  const cache = {};
  let ultimoStato = {};
  function campiona(v, cx, cy, passo) {
    const out = [];
    for (let i = 0; i < v.length; i++) {
      const [x0, y0] = v[i], [x1, y1] = v[(i + 1) % v.length], l = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.round(l / passo));
      for (let k = 0; k < n; k++) out.push([cx + x0 + ((x1 - x0) * k) / n, cy + y0 + ((y1 - y0) * k) / n]);
    }
    return out;
  }
  const punti = (ex, forma) => (cache[forma] || (cache[forma] = campiona(ex.forme[forma].v, ex.cx, ex.cy, ex.passo)));
  const leggiBit = (hex, n) => { const out = new Uint8Array(n); for (let i = 0; i < hex.length; i++) { const v = parseInt(hex[i], 16); for (let b = 0; b < 4 && i * 4 + b < n; b++) out[i * 4 + b] = (v >> b) & 1; } return out; };
  // numeri pseudo-casuali sempre uguali per lo stesso seme (le crepe non devono "ballare")
  const rnd = (s) => { const x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  function biscotto(g, cx, cy, r) {
    // la scatola di latta sotto
    g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(cx + 8, cy + 14, r + 34, r + 30, 0, 0, Math.PI * 2); g.fill();
    const latta = g.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 10, cx, cy, r + 36); latta.addColorStop(0, '#e9edf2'); latta.addColorStop(1, '#8e98a5');
    g.fillStyle = latta; g.beginPath(); g.arc(cx, cy, r + 30, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(0,0,0,.2)'; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, r + 22, 0, Math.PI * 2); g.stroke();
    // il biscotto di caramello
    const c = g.createRadialGradient(cx - r * 0.25, cy - r * 0.25, 20, cx, cy, r); c.addColorStop(0, '#e9b45a'); c.addColorStop(0.75, '#d49434'); c.addColorStop(1, '#a8651c');
    g.fillStyle = c; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
    // bollicine dello zucchero
    for (let k = 0; k < 160; k++) { const a = rnd(k) * Math.PI * 2, d = Math.sqrt(rnd(k + 500)) * r * 0.95; g.fillStyle = k % 3 ? 'rgba(255,230,170,.25)' : 'rgba(120,60,10,.18)'; g.beginPath(); g.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 1 + rnd(k + 900) * 3, 0, Math.PI * 2); g.fill(); }
    g.strokeStyle = 'rgba(110,55,10,.45)'; g.lineWidth = 4; g.beginPath(); g.arc(cx, cy, r - 2, 0, Math.PI * 2); g.stroke();
  }
  function poligono(g, v, cx, cy) { g.beginPath(); v.forEach(([x, y], i) => (i ? g.lineTo(cx + x, cy + y) : g.moveTo(cx + x, cy + y))); g.closePath(); }
  function crepe(g, cx, cy, r, danno, seme) {
    const n = Math.floor(danno / 9);
    g.strokeStyle = 'rgba(70,32,6,.85)'; g.lineWidth = 2; g.lineJoin = 'round';
    for (let k = 0; k < n; k++) {
      const a = rnd(seme * 13 + k) * Math.PI * 2, lun = r * (0.25 + rnd(seme + k * 7) * 0.5) * Math.min(1, danno / 60 + 0.3);
      let x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
      g.beginPath(); g.moveTo(x, y);
      for (let j = 1; j <= 6; j++) { const aa = a + Math.PI + (rnd(k * 31 + j + seme) - 0.5) * 0.9; x += Math.cos(aa) * lun / 6; y += Math.sin(aa) * lun / 6; g.lineTo(x, y); }
      g.stroke();
    }
  }
  function ago(g, x, y, premuto) {
    g.save(); g.translate(x, y); g.rotate(-0.7);
    g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(4, 6, 3, 80);
    const m = g.createLinearGradient(-2, 0, 2, 0); m.addColorStop(0, '#9aa3ad'); m.addColorStop(0.5, '#f4f6f8'); m.addColorStop(1, '#7c8590');
    g.fillStyle = m; g.beginPath(); g.moveTo(0, 0); g.lineTo(2, 12); g.lineTo(2, 80); g.lineTo(-2, 80); g.lineTo(-2, 12); g.closePath(); g.fill();
    g.strokeStyle = '#8a929c'; g.lineWidth = 1.5; g.beginPath(); g.ellipse(0, 74, 1.2, 4, 0, 0, Math.PI * 2); g.stroke();
    g.restore();
    if (premuto) { g.fillStyle = 'rgba(255,240,200,.8)'; g.beginPath(); g.arc(x, y, 3, 0, Math.PI * 2); g.fill(); }
  }
  const tavolo = window.Arena.tavolo({
    id: 'dalgona',
    mouse: 'traccia',
    comandi: 'nessuno',
    obiettivo: 'punti',
    istruzioni: () => 'Tieni premuto il tasto sinistro del mouse (sul telefono il dito) e segui il solco della forma. Rilascia per fermarti. Non uscire dal solco!',
    statoGioco: (ctx, s) => { const b = s.s.b[ctx.mio]; return !b ? '' : b.st === 'rotto' ? 'Eliminato' : b.st === 'fatto' ? 'Passato! 🍪' : 'Ritaglia piano…'; },
    hud: (ctx, s) => { const b = s.s.b[ctx.mio]; const ex = ctx.partita.extra; return b ? `<span>${ex ? ex.forme[b.fo].nome : ''}</span><span>✂️ ${b.pr}%</span><span style="color:${b.d > 60 ? '#ff8a80' : 'inherit'}">💔 crepe ${b.d}%</span><span>⏱️ ${s.s.resta} s</span>` : ''; },
    fineRound: (p, s, ctx) => `Punti totali: ${p.punti[ctx.mio]}`,
    dopoTick(ctx, d, prima) {
      const a = prima && prima.s.b[ctx.mio], b = d.s.b[ctx.mio];
      if (!a || !b) return;
      if (b.d > a.d + 2 && performance.now() - (ultimoStato.crack || 0) > 180) { ultimoStato.crack = performance.now(); window.Nuovi.suono([[180 + Math.random() * 80, 0.03]], { tipo: 'square', volume: 0.05 }); }
      if (a.st === 'gioco' && b.st === 'rotto') window.Nuovi.suono([[220, 0.05], [110, 0.3]], { tipo: 'sawtooth', volume: 0.09 });
      if (a.st === 'gioco' && b.st === 'fatto') window.Nuovi.suono([[523, 0.1], [659, 0.1], [784, 0.25]], { volume: 0.08 });
    },
    disegna(g, p, s, prima, u, ctx) {
      const W = p.W, H = p.H, ex = p.extra, t = s.t;
      // il pavimento del campo giochi
      g.fillStyle = '#2d6b73'; g.fillRect(0, 0, W, H);
      g.strokeStyle = 'rgba(255,255,255,.07)'; g.lineWidth = 2; for (let x = -H; x < W; x += 60) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + H, H); g.stroke(); }
      if (!ex || !ex.forme) return;
      const io = s.s.b[ctx.mio];
      if (io) {
        const pts = punti(ex, io.fo), fatti = io.f ? leggiBit(io.f, pts.length) : new Uint8Array(pts.length);
        const rotto = io.st === 'rotto', fatto = io.st === 'fatto', tr = Math.max(0, t - (io.el ?? io.fi ?? t));
        g.save();
        if (rotto) {
          // il biscotto si spacca in due metà che si allontanano
          const sp = Math.min(1, tr / 0.5) * 22;
          for (const lato of [-1, 1]) { g.save(); g.beginPath(); g.rect(lato < 0 ? 0 : ex.cx, 0, W / 2, H); g.clip(); g.translate(lato * sp, lato * sp * 0.3); g.rotate(lato * sp * 0.003); biscotto(g, ex.cx, ex.cy, ex.r); crepe(g, ex.cx, ex.cy, ex.r, 100, ctx.mio + 1); g.restore(); }
          window.Squid.macchia(g, ex.cx, ex.cy + ex.r * 0.3, 70, Math.min(1, Math.max(0, tr - 0.3) / 0.8), ctx.mio + 1);
        } else biscotto(g, ex.cx, ex.cy, ex.r);
        if (!rotto) {
          // il solco impresso
          g.lineJoin = 'round'; g.lineCap = 'round';
          poligono(g, ex.forme[io.fo].v, ex.cx, ex.cy); g.strokeStyle = 'rgba(120,62,12,.55)'; g.lineWidth = ex.forme[io.fo].tol * 1.6; g.stroke();
          poligono(g, ex.forme[io.fo].v, ex.cx, ex.cy); g.strokeStyle = 'rgba(255,225,160,.35)'; g.lineWidth = 2; g.stroke();
          // il pezzo già ritagliato: una linea scura e netta
          g.strokeStyle = '#3a1d06'; g.lineWidth = 3.2;
          for (let i = 0; i < pts.length; i++) if (fatti[i] && fatti[(i + 1) % pts.length]) { g.beginPath(); g.moveTo(pts[i][0], pts[i][1]); g.lineTo(pts[(i + 1) % pts.length][0], pts[(i + 1) % pts.length][1]); g.stroke(); }
          crepe(g, ex.cx, ex.cy, ex.r, io.d, ctx.mio + 1);
          if (fatto) {
            // la forma si stacca e si solleva, con un bagliore
            const su = Math.min(1, tr / 0.6);
            g.save(); g.translate(0, -su * 18);
            g.shadowColor = 'rgba(255,220,120,.9)'; g.shadowBlur = 25 * su;
            poligono(g, ex.forme[io.fo].v, ex.cx, ex.cy); g.fillStyle = '#e9b45a'; g.fill(); g.shadowBlur = 0; g.strokeStyle = '#3a1d06'; g.lineWidth = 3; g.stroke();
            g.restore();
          }
        }
        g.restore();
        // l'ago
        const ip = prima && prima.s.b[ctx.mio];
        if (!rotto && !fatto && io.x !== null && io.x !== undefined) { const x = ip && ip.x != null ? ip.x + (io.x - ip.x) * u : io.x, y = ip && ip.y != null ? ip.y + (io.y - ip.y) * u : io.y; ago(g, x, y, io.a); }
        // barre in alto: ritagliato e crepe
        g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(W / 2 - 160, 12, 320, 40);
        g.fillStyle = '#7dffa0'; g.fillRect(W / 2 - 150, 20, 300 * io.pr / 100, 8);
        g.fillStyle = io.d > 60 ? '#ff5a4a' : '#ffb04a'; g.fillRect(W / 2 - 150, 34, 300 * io.d / 100, 8);
        g.fillStyle = '#fff'; g.font = '700 11px system-ui'; g.textAlign = 'left'; g.fillText('ritagliato', W / 2 + 156, 28); g.fillText('crepe', W / 2 + 156, 42);
        g.textAlign = 'center';
        if (rotto) { g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(W / 2 - 170, H - 70, 340, 46); g.fillStyle = window.Squid.GRIGIO; g.font = '800 26px system-ui'; g.fillText('Biscotto rotto: eliminato', W / 2, H - 38); }
        else if (fatto) { g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(W / 2 - 150, H - 70, 300, 46); g.fillStyle = '#7dffa0'; g.font = '800 26px system-ui'; g.fillText('PASSATO! 🍪', W / 2, H - 38); }
        else g.fillStyle = '#fff', g.font = '700 18px system-ui', g.fillText(ex.forme[io.fo].nome.toUpperCase(), W / 2, H - 24);
      }
      // gli altri, in colonna a sinistra e a destra
      const altri = s.s.b.filter((b) => b.id !== ctx.mio);
      altri.forEach((b, k) => {
        const x = k % 2 ? W - 105 : 10, y = 70 + Math.floor(k / 2) * 110, fuori = b.st === 'rotto';
        g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x, y, 95, 100);
        g.fillStyle = fuori ? '#6b4a2a' : '#d49434'; g.beginPath(); g.arc(x + 47, y + 42, 26, 0, Math.PI * 2); g.fill();
        if (fuori) { window.Squid.macchia(g, x + 47, y + 50, 16, 1, b.id + 1); g.strokeStyle = '#3a1d06'; g.lineWidth = 3; g.beginPath(); g.moveTo(x + 30, y + 22); g.lineTo(x + 50, y + 44); g.lineTo(x + 62, y + 64); g.stroke(); }
        const sc = 0.13; g.save(); g.translate(x + 47, y + 42); g.scale(sc, sc); poligono(g, ex.forme[b.fo].v, 0, 0); g.strokeStyle = b.st === 'fatto' ? '#1d7a3a' : '#5a2e08'; g.lineWidth = 14; g.stroke(); g.restore();
        g.fillStyle = fuori ? window.Squid.GRIGIO : COLORI[b.id % COLORI.length]; g.font = '700 12px system-ui'; g.textAlign = 'center'; g.fillText((fuori ? '💀 ' : '') + ctx.nome(b.id).slice(0, 10), x + 47, y + 82);
        g.fillStyle = 'rgba(255,255,255,.15)'; g.fillRect(x + 8, y + 88, 79, 5); g.fillStyle = b.st === 'fatto' ? '#7dffa0' : '#fff'; g.fillRect(x + 8, y + 88, 79 * b.pr / 100, 5);
        g.fillStyle = '#ff8a4a'; g.fillRect(x + 8, y + 94, 79 * b.d / 100, 3);
      });
    },
  });
  // niente menu del tasto destro sul biscotto
  document.addEventListener('contextmenu', (e) => { if (e.target && e.target.classList && e.target.classList.contains('ar-tela') && window.Tavoli.dalgona && document.querySelector('.panno-dalgona')) e.preventDefault(); });
  Object.assign(window.Tavoli, { dalgona: tavolo });
})();
