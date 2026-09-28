// BUMPER BALLS: arena rotonda sospesa sull'acqua, palle lucide, scintille negli urti.
(() => {
  const { COLORI, lerp } = window.Arena;
  let scintille = [];
  const tavolo = window.Arena.tavolo({
    id: 'bumper',
    obiettivo: 'punti',
    istruzioni: () => 'WASD o frecce (sul telefono il joystick): spingi gli altri giù dall\'arena, e non cadere tu!',
    statoGioco: (ctx, s) => { const b = s.s.b[ctx.mio]; return b && !b.f ? 'Spingi!' : 'Caduto: guarda gli altri'; },
    hud: (ctx, s) => `<span>🟠 in gara: ${s.s.b.filter((b) => !b.f).length}</span><span>⭕ arena: ${Math.round((s.s.r / 290) * 100)}%</span>`,
    fineRound: (p, s, ctx) => `Punti totali: ${p.punti[ctx.mio]}`,
    dopoTick(ctx, d, prima) {
      for (const [x, y] of d.s.u) { scintille.push({ x, y, t: performance.now() }); window.Nuovi.suono([[180 + Math.random() * 80, 0.06]], { tipo: 'square', volume: 0.05 }); }
      if (prima && prima.s.b[ctx.mio] && !prima.s.b[ctx.mio].f && d.s.b[ctx.mio] && d.s.b[ctx.mio].f) window.Nuovi.suono([[400, 0.1], [200, 0.2], [90, 0.3]], { volume: 0.09 });
    },
    disegna(g, p, s, prima, u, ctx) {
      const W = p.W, H = p.H, CX = W / 2, CY = H / 2;
      const acqua = g.createRadialGradient(CX, CY, 50, CX, CY, 600); acqua.addColorStop(0, '#2d7bb5'); acqua.addColorStop(1, '#0d2f4d');
      g.fillStyle = acqua; g.fillRect(0, 0, W, H);
      g.strokeStyle = 'rgba(255,255,255,.08)'; g.lineWidth = 2;
      for (let k = 0; k < 8; k++) { g.beginPath(); g.arc(CX, CY, 320 + k * 40 + ((s.t * 20) % 40), 0, Math.PI * 2); g.stroke(); }
      const r = prima ? prima.s.r + (s.s.r - prima.s.r) * u : s.s.r;
      // l'arena
      g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(CX, CY + 14, r, r * 0.97, 0, 0, Math.PI * 2); g.fill();
      const pav = g.createRadialGradient(CX - r * 0.3, CY - r * 0.3, 10, CX, CY, r); pav.addColorStop(0, '#f7e7b8'); pav.addColorStop(1, '#d9a950');
      g.fillStyle = pav; g.beginPath(); g.arc(CX, CY, r, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#e8453c'; g.lineWidth = 10; g.setLineDash([22, 16]); g.beginPath(); g.arc(CX, CY, r - 5, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
      g.strokeStyle = 'rgba(120,80,20,.35)'; g.lineWidth = 3; g.beginPath(); g.arc(CX, CY, r * 0.45, 0, Math.PI * 2); g.stroke();
      const bb = lerp(prima && prima.s.b, s.s.b, u);
      bb.forEach((b, i) => {
        const sc = b.f ? Math.max(0.05, 1 - b.f) : 1;
        if (b.f >= 1) return;
        g.save(); g.globalAlpha = b.f ? 1 - b.f * 0.8 : 1;
        const rr = 24 * sc, col = COLORI[i % COLORI.length];
        if (!b.f) { g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(b.x + 3, b.y + 8, rr, rr * 0.5, 0, 0, Math.PI * 2); g.fill(); }
        const gr = g.createRadialGradient(b.x - rr * 0.4, b.y - rr * 0.4, 2, b.x, b.y, rr); gr.addColorStop(0, '#fff'); gr.addColorStop(0.25, col); gr.addColorStop(1, col);
        g.fillStyle = gr; g.beginPath(); g.arc(b.x, b.y + (b.f ? b.f * 40 : 0), rr, 0, Math.PI * 2); g.fill();
        if (i === ctx.mio && !b.f) { g.strokeStyle = '#fff'; g.lineWidth = 3; g.stroke(); }
        if (!b.f) { g.fillStyle = '#fff'; g.font = '600 13px system-ui'; g.textAlign = 'center'; g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = 3; const nm = i === ctx.mio ? 'Tu' : ctx.nome(i).slice(0, 10); g.strokeText(nm, b.x, b.y - 30); g.fillText(nm, b.x, b.y - 30); }
        g.restore();
      });
      const ora = performance.now();
      scintille = scintille.filter((k) => ora - k.t < 350);
      for (const k of scintille) { const a = (ora - k.t) / 350; g.strokeStyle = `rgba(255,240,150,${1 - a})`; g.lineWidth = 3; for (let j = 0; j < 8; j++) { const an = j * Math.PI / 4; g.beginPath(); g.moveTo(k.x + Math.cos(an) * 8, k.y + Math.sin(an) * 8); g.lineTo(k.x + Math.cos(an) * (14 + a * 20), k.y + Math.sin(an) * (14 + a * 20)); g.stroke(); } }
    },
  });
  Object.assign(window.Tavoli, { bumper: tavolo });
})();
