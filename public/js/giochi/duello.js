// DUELLO SULLE PIATTAFORME: cielo al tramonto, isole d'erba sospese (con le rocce sotto) che nel finale si sgretolano,
// personaggi con i cuori sopra la testa, oggetti disegnati (bomba, palla di neve, martello, cuore, scudo), esplosioni.
(() => {
  const { COLORI, lerp, omino } = window.Arena;
  let botti = [], colpi = [], sfondo = null;
  function icona(g, tipo, x, y, s = 1) {
    g.save(); g.translate(x, y); g.scale(s, s);
    if (tipo === 'bomba') { g.fillStyle = '#23262e'; g.beginPath(); g.arc(0, 2, 10, 0, Math.PI * 2); g.fill(); g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.arc(-3, -1, 3, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#8a6a3a'; g.lineWidth = 2; g.beginPath(); g.moveTo(5, -6); g.quadraticCurveTo(9, -12, 13, -11); g.stroke(); g.fillStyle = '#ffb02a'; g.beginPath(); g.arc(13, -11, 2.6 + Math.random(), 0, Math.PI * 2); g.fill(); }
    else if (tipo === 'neve') { g.fillStyle = '#fff'; g.beginPath(); g.arc(0, 0, 9, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#b8d8ec'; g.lineWidth = 2; g.beginPath(); g.arc(0, 0, 6, 0.4, 2); g.stroke(); }
    else if (tipo === 'martello') { g.rotate(-0.5); g.fillStyle = '#8a5a30'; g.fillRect(-2, -4, 4, 20); g.fillStyle = '#9aa3b0'; g.fillRect(-10, -12, 20, 10); g.fillStyle = '#c8d0dc'; g.fillRect(-10, -12, 20, 3); }
    else if (tipo === 'cuore') { g.fillStyle = '#e8322a'; g.beginPath(); g.moveTo(0, 9); g.bezierCurveTo(-14, -2, -8, -12, 0, -5); g.bezierCurveTo(8, -12, 14, -2, 0, 9); g.fill(); g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.arc(-4, -4, 2, 0, Math.PI * 2); g.fill(); }
    else if (tipo === 'scudo') { g.fillStyle = '#2f6fd8'; g.beginPath(); g.moveTo(0, -11); g.lineTo(10, -7); g.lineTo(8, 5); g.lineTo(0, 11); g.lineTo(-8, 5); g.lineTo(-10, -7); g.closePath(); g.fill(); g.strokeStyle = '#f2c230'; g.lineWidth = 2; g.stroke(); g.fillStyle = '#f2c230'; g.fillRect(-1.5, -6, 3, 12); }
    g.restore();
  }
  function cielo(W, H) {
    const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#3b5fa8'); gr.addColorStop(0.55, '#e89a6a'); gr.addColorStop(1, '#f6c77a');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(255,240,200,.9)'; g.beginPath(); g.arc(W * 0.78, H * 0.62, 55, 0, Math.PI * 2); g.fill();
    // montagne lontane
    g.fillStyle = 'rgba(90,60,110,.45)'; g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 50) g.lineTo(x, H - 90 - Math.abs(Math.sin(x / 130)) * 90); g.lineTo(W, H); g.fill();
    g.fillStyle = 'rgba(70,45,90,.55)'; g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 40) g.lineTo(x, H - 40 - Math.abs(Math.sin(x / 90 + 1)) * 60); g.lineTo(W, H); g.fill();
    return c;
  }
  function isola(g, x0, x1, y, crolla) {
    if (x1 - x0 < 4) return;
    const l = x1 - x0;
    // roccia sotto, a punta
    g.fillStyle = '#6b5a4a'; g.beginPath(); g.moveTo(x0, y + 6); g.lineTo(x1, y + 6);
    g.lineTo(x1 - l * 0.15, y + 40); g.lineTo(x0 + l * 0.62, y + 70 + l * 0.12); g.lineTo(x0 + l * 0.35, y + 52); g.lineTo(x0 + l * 0.12, y + 34); g.closePath(); g.fill();
    g.fillStyle = '#54463a'; g.beginPath(); g.moveTo(x0 + l * 0.5, y + 6); g.lineTo(x1 - l * 0.15, y + 40); g.lineTo(x0 + l * 0.62, y + 70 + l * 0.12); g.closePath(); g.fill();
    // terra ed erba
    g.fillStyle = '#7a5230'; g.fillRect(x0, y, l, 12);
    g.fillStyle = '#4fb05a'; g.beginPath(); g.moveTo(x0 - 4, y + 2); for (let x = x0 - 4; x <= x1 + 4; x += 8) g.lineTo(x, y - 4 - ((x * 7) % 5)); g.lineTo(x1 + 4, y + 6); g.lineTo(x0 - 4, y + 6); g.fill();
    g.fillStyle = '#3c9447'; g.fillRect(x0 - 2, y + 3, l + 4, 4);
    if (crolla) { g.fillStyle = '#6b5a4a'; for (let k = 0; k < 4; k++) { const a = (performance.now() / 300 + k) % 1; g.fillRect(x0 + 4 + (k % 2) * (l - 12), y + 10 + a * 60, 6, 6); g.fillRect(x1 - 10 - (k % 2) * (l - 12), y + 14 + ((a + 0.5) % 1) * 60, 5, 5); } }
  }
  const tavolo = window.Arena.tavolo({
    id: 'duello',
    nomeAzione: '💥 Usa',
    obiettivo: 'punti',
    istruzioni: () => 'A e D (o frecce) per muoverti, W per saltare (anche un secondo salto in aria), spazio per usare l\'oggetto. Non cadere nel vuoto!',
    statoGioco: (ctx, s) => { const e = s.s.e[ctx.mio]; return !e ? '' : e.f ? 'Fuori: guarda gli altri' : e.r ? 'Ricompari…' : e.o ? `Hai: ${{ bomba: 'bomba', neve: 'palla di neve', martello: `martello (${e.u})` }[e.o]}` : 'Raccogli un oggetto!'; },
    hud: (ctx, s) => { const e = s.s.e[ctx.mio]; return e ? `<span>${'❤️'.repeat(Math.max(0, e.c))}${'🖤'.repeat(Math.max(0, 3 - e.c))}</span><span>🧍 in gara: ${s.s.e.filter((x) => !x.f).length}</span>${s.t > 60 ? '<span style="color:#ff8a80">⚠️ le isole crollano!</span>' : ''}` : ''; },
    fineRound: (p, s, ctx) => `Punti totali: ${p.punti[ctx.mio]}`,
    dopoTick(ctx, d, prima) {
      for (const b of d.s.b || []) { botti.push({ ...b, t: performance.now() }); window.Nuovi.suono(b.tipo === 'bomba' ? [[90, 0.08], [60, 0.25]] : [[700, 0.05]], { tipo: b.tipo === 'bomba' ? 'sawtooth' : 'triangle', volume: 0.07 }); }
      for (const c of d.s.cl || []) { colpi.push({ ...c, t: performance.now() }); window.Nuovi.suono([[160, 0.07]], { tipo: 'square', volume: 0.06 }); }
      const a = prima && prima.s.e[ctx.mio], b = d.s.e[ctx.mio];
      if (a && b && b.colpo > a.colpo) window.Nuovi.suono([[260, 0.08], [180, 0.15]], { volume: 0.07 });
    },
    disegna(g, p, s, prima, u, ctx) {
      const W = p.W, H = p.H, x = s.s, ora = performance.now(), t = s.t;
      if (!sfondo) sfondo = cielo(W, H);
      g.drawImage(sfondo, 0, 0);
      // nuvole che scorrono
      g.fillStyle = 'rgba(255,255,255,.55)';
      for (let k = 0; k < 5; k++) { const cx = ((k * 260 + t * (12 + k * 4)) % (W + 200)) - 100, cy = 60 + k * 45; g.beginPath(); g.arc(cx, cy, 22, 0, Math.PI * 2); g.arc(cx + 24, cy - 8, 26, 0, Math.PI * 2); g.arc(cx + 50, cy, 20, 0, Math.PI * 2); g.fill(); }
      const is = x.is || (p.extra ? p.extra.isole.map((q) => [q.x0, q.x1]) : []);
      (p.extra ? p.extra.isole : []).forEach((q, k) => { const [a, b] = is[k] || [q.x0, q.x1]; if (a > -500) isola(g, a, b, q.y, t > 60); });
      // oggetti a terra che galleggiano un po', con un alone
      for (const o of x.o) { const b = Math.sin(t * 4 + o.id) * 3; const gl = g.createRadialGradient(o.x, o.y + b, 2, o.x, o.y + b, 22); gl.addColorStop(0, 'rgba(255,255,220,.8)'); gl.addColorStop(1, 'rgba(255,255,220,0)'); g.fillStyle = gl; g.beginPath(); g.arc(o.x, o.y + b, 22, 0, Math.PI * 2); g.fill(); icona(g, o.t, o.x, o.y + b, 1.1); }
      for (const q of x.p) icona(g, q.t, q.x, q.y, 1);
      // i giocatori
      const ee = lerp(prima && prima.s.e, x.e, u);
      ee.forEach((e, i) => {
        if (e.f || e.r) return;
        const lampeggia = e.im && Math.floor(t * 12) % 2;
        g.save(); g.globalAlpha = lampeggia ? 0.4 : 1;
        omino(g, e.x, e.y + 4, 16, COLORI[i % COLORI.length], i === ctx.mio ? 'Tu' : ctx.nome(i).slice(0, 10), { io: i === ctx.mio, stordito: e.st });
        // piedi che camminano
        g.fillStyle = '#2a2d35'; const passo = e.t ? Math.sin(t * 14 + i) * 3 : 0; g.fillRect(e.x - 9 + passo, e.y + 16, 7, 4); g.fillRect(e.x + 2 - passo, e.y + 16, 7, 4);
        g.restore();
        // cuori sopra la testa
        for (let k = 0; k < 3; k++) { g.globalAlpha = k < e.c ? 1 : 0.25; icona(g, 'cuore', e.x - 14 + k * 14, e.y - 40, 0.55); } g.globalAlpha = 1;
        if (e.o) icona(g, e.o, e.x + e.d * 20, e.y, 0.9);
        if (e.sc) { g.strokeStyle = `rgba(90,160,255,${0.6 + 0.3 * Math.sin(t * 6)})`; g.lineWidth = 3; g.beginPath(); g.arc(e.x, e.y + 2, 26, 0, Math.PI * 2); g.stroke(); }
      });
      // martellate: un arco davanti
      colpi = colpi.filter((c) => ora - c.t < 250);
      for (const c of colpi) { const a = (ora - c.t) / 250; g.strokeStyle = `rgba(255,255,255,${1 - a})`; g.lineWidth = 6; g.beginPath(); g.arc(c.x, c.y, 46, c.d > 0 ? -1.2 + a : Math.PI + 1.2 - a, c.d > 0 ? 0.4 + a : Math.PI - 0.4 - a, c.d < 0); g.stroke(); }
      // esplosioni e sbuffi di neve
      botti = botti.filter((b) => ora - b.t < 500);
      for (const b of botti) {
        const a = (ora - b.t) / 500;
        if (b.tipo === 'bomba') { const gl = g.createRadialGradient(b.x, b.y, 4, b.x, b.y, 20 + a * 80); gl.addColorStop(0, `rgba(255,240,150,${1 - a})`); gl.addColorStop(0.5, `rgba(255,120,30,${0.8 * (1 - a)})`); gl.addColorStop(1, 'rgba(120,40,10,0)'); g.fillStyle = gl; g.beginPath(); g.arc(b.x, b.y, 20 + a * 80, 0, Math.PI * 2); g.fill(); }
        else { g.fillStyle = `rgba(255,255,255,${1 - a})`; for (let k = 0; k < 7; k++) { g.beginPath(); g.arc(b.x + Math.cos(k) * a * 30, b.y + Math.sin(k) * a * 30, 4, 0, Math.PI * 2); g.fill(); } }
      }
    },
  });
  Object.assign(window.Tavoli, { duello: tavolo });
})();
