// PALLONCINI IN FUGA: cielo che scorre, spuntoni che scendono, un palloncino a testa. Un tasto solo.
(() => {
  const { COLORI, lerp } = window.Arena;
  let nuvole = null;
  function spuntone(g, x, y, r, a) {
    g.save(); g.translate(x, y); g.rotate(a);
    g.fillStyle = '#4a4f5c'; g.beginPath();
    for (let k = 0; k < 20; k++) { const ang = (k / 20) * Math.PI * 2, rr = k % 2 ? r * 0.62 : r * 1.12; g.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr); }
    g.closePath(); g.fill(); g.strokeStyle = '#2a2d35'; g.lineWidth = 2; g.stroke();
    g.fillStyle = '#6b7282'; g.beginPath(); g.arc(-r * 0.2, -r * 0.2, r * 0.25, 0, Math.PI * 2); g.fill();
    g.restore();
  }
  function pallone(g, x, y, colore, nome, io, alfa) {
    g.save(); g.globalAlpha = alfa;
    g.strokeStyle = 'rgba(60,60,60,.7)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y + 22); g.bezierCurveTo(x - 6, y + 40, x + 6, y + 52, x, y + 70); g.stroke();
    g.fillStyle = colore; g.beginPath(); g.ellipse(x, y, 20, 24, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.moveTo(x - 5, y + 25); g.lineTo(x + 5, y + 25); g.lineTo(x, y + 20); g.fill();
    g.fillStyle = 'rgba(255,255,255,.45)'; g.beginPath(); g.ellipse(x - 7, y - 9, 5, 8, -0.5, 0, Math.PI * 2); g.fill();
    if (io) { g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.ellipse(x, y, 20, 24, 0, 0, Math.PI * 2); g.stroke(); }
    g.fillStyle = '#1f2430'; g.font = '600 13px system-ui, sans-serif'; g.textAlign = 'center'; g.fillText(nome, x, y + 86);
    g.restore();
  }
  const tavolo = window.Arena.tavolo({
    id: 'palloncini',
    comandi: 'tasto',
    nomeAzione: '🌬️ Spingi',
    obiettivo: 'secondi in aria',
    istruzioni: () => 'Spazio, Invio o clic (o il pulsante): spinta verso destra. Il vento ti porta a sinistra. Evita spuntoni e bordi!',
    statoGioco: (ctx, s) => { const b = s.s.b[ctx.mio]; return b && b.vivo ? 'Resisti!' : 'Scoppiato: guarda gli altri'; },
    sottotitolo: (p) => ({ facile: 'Facile', normale: 'Normale', difficile: 'Difficile', estremo: 'Estremo 🔥' }[p.extra && p.extra.diff] || ''),
    hud: (ctx, s) => `<span>⏱️ ${Math.floor(s.t)} s</span><span>🎈 in aria: ${s.s.b.filter((b) => b.vivo).length}</span>`,
    fineRound: (p, s, ctx) => `Punti totali: ${p.punti[ctx.mio]}`,
    disegna(g, p, s, prima, u, ctx) {
      const W = p.W, H = p.H;
      // cielo che scorre
      const cielo = g.createLinearGradient(0, 0, 0, H); cielo.addColorStop(0, '#6fb3e8'); cielo.addColorStop(1, '#cfe9f7');
      g.fillStyle = cielo; g.fillRect(0, 0, W, H);
      if (!nuvole) nuvole = Array.from({ length: 9 }, (_, k) => ({ x: (k * 137) % W, y: (k * 241) % (H + 200), r: 30 + (k % 3) * 18 }));
      const scorri = (s.t * (s.s.v || 130) * 0.35) % (H + 200);
      g.fillStyle = 'rgba(255,255,255,.75)';
      for (const c of nuvole) { const y = ((c.y + scorri) % (H + 200)) - 100; g.beginPath(); g.arc(c.x, y, c.r, 0, Math.PI * 2); g.arc(c.x + c.r * 0.9, y + 8, c.r * 0.75, 0, Math.PI * 2); g.arc(c.x - c.r * 0.9, y + 10, c.r * 0.65, 0, Math.PI * 2); g.fill(); }
      // bordi pungenti
      g.fillStyle = '#4a4f5c';
      for (let y = -((s.t * (s.s.v || 130)) % 30); y < H; y += 30) { g.beginPath(); g.moveTo(0, y); g.lineTo(22, y + 15); g.lineTo(0, y + 30); g.fill(); g.beginPath(); g.moveTo(W, y); g.lineTo(W - 22, y + 15); g.lineTo(W, y + 30); g.fill(); }
      // sbarre di punte con il varco
      for (const b of lerp(prima && prima.s.sb, s.s.sb || [], u)) {
        const a = b.x - b.w / 2, z = b.x + b.w / 2;
        g.fillStyle = '#3b3f4a';
        for (const [x0, x1] of [[0, a], [z, W]]) {
          g.fillRect(x0, b.y - 5, x1 - x0, 10);
          for (let x = x0 + 6; x < x1 - 4; x += 16) { g.beginPath(); g.moveTo(x - 6, b.y - 4); g.lineTo(x, b.y - 16); g.lineTo(x + 6, b.y - 4); g.moveTo(x - 6, b.y + 4); g.lineTo(x, b.y + 16); g.lineTo(x + 6, b.y + 4); g.fill(); }
        }
        g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(a, b.y - 2, b.w, 4);
      }
      // indicatore del vento (le raffiche fanno cambiare la forza)
      if (s.s.ve) {
        const f = Math.max(0.2, Math.min(1.6, s.s.ve / 240));
        g.save(); g.globalAlpha = 0.55; g.strokeStyle = '#fff'; g.lineWidth = 3; g.lineCap = 'round';
        for (let k = 0; k < 3; k++) { const y = 40 + k * 14, off = ((s.t * 220 * f) + k * 60) % 140; g.beginPath(); g.moveTo(W - 40 - off, y); g.lineTo(W - 40 - off - 30 * f, y); g.stroke(); }
        g.globalAlpha = 1; g.fillStyle = '#fff'; g.font = '600 13px system-ui'; g.textAlign = 'right'; g.fillText(`vento ${f > 1.15 ? 'forte 💨' : f < 0.85 ? 'debole' : ''}`, W - 30, 90);
        g.restore();
      }
      const sp = lerp(prima && prima.s.sp, s.s.sp, u);
      for (const k of sp) spuntone(g, k.x, k.y, k.r, s.t * k.g);
      const bb = lerp(prima && prima.s.b, s.s.b, u);
      bb.forEach((b, i) => {
        if (i === ctx.mio) return;
        if (b.vivo) pallone(g, b.x, b.y, COLORI[i % COLORI.length], ctx.nome(i).slice(0, 10), false, 0.55);
      });
      const mio = bb[ctx.mio];
      if (mio) { if (mio.vivo) pallone(g, mio.x, mio.y, COLORI[ctx.mio % COLORI.length], 'Tu', true, 1); else { g.font = '48px system-ui'; g.textAlign = 'center'; g.fillText('💥', mio.x, mio.y + 16); } }
    },
    dopoTick(ctx, d, prima) {
      if (prima && prima.s.b[ctx.mio] && prima.s.b[ctx.mio].vivo && d.s.b[ctx.mio] && !d.s.b[ctx.mio].vivo) window.Nuovi.suono([[400, 0.03], [120, 0.25]], { tipo: 'square', volume: 0.1 });
    },
    suonoAzione: [[520, 0.03]],
  });
  Object.assign(window.Tavoli, { palloncini: tavolo });
})();
