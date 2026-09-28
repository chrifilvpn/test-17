// SALTA E CORRI: la telecamera segue il tuo omino; il livello (griglia di blocchi) arriva nello stato completo.
(() => {
  const { COLORI, lerp, omino } = window.Arena;
  let liv = null, chiave = null, botti = [], lampo = 0;
  const tavolo = window.Arena.tavolo({
    id: 'piattaforme',
    nomeAzione: '⤴️ Salta',
    obiettivo: 'punti',
    istruzioni: () => 'A e D (o le frecce) per correre, spazio o W per saltare (sul telefono joystick e ⤴️). Arriva primo alla bandiera!',
    statoGioco: (ctx, s) => { const e = s.s.e[ctx.mio]; return e && e.a ? 'Arrivato! 🏁' : e && e.c ? 'Riparti dal punto sicuro…' : 'Corri!'; },
    hud: (ctx, s) => {
      const tr = liv ? liv.traguardo.x : 1;
      return `<span class="sa-barra pf-gara">${s.s.e.map((e, i) => `<b style="left:${Math.min(100, (e.x / tr) * 100)}%;background:${COLORI[i % COLORI.length]}" title="${i === ctx.mio ? 'tu' : ''}"></b>`).join('')}</span>${s.s.e[ctx.mio] ? `<span>🪙 ${s.s.e[ctx.mio].m}</span>` : ''}${s.s.e[ctx.mio] && s.s.e[ctx.mio].p ? `<span>${s.s.e[ctx.mio].p === 'molla' ? '🍄 doppio salto' : '⚡ turbo'}</span>` : ''}${s.s.e[ctx.mio] && s.s.e[ctx.mio].sl ? '<span>⭐ invincibile</span>' : ''}${s.s.e[ctx.mio] && s.s.e[ctx.mio].st ? '<span>💫 stordito</span>' : ''}`;
    },
    fineRound: (p, s, ctx) => `Punti totali: ${p.punti[ctx.mio]}`,
    disegna(g, p, s, prima, u, ctx) {
      const ex = p.extra;
      if (ex && ex.griglia && chiave !== ex.griglia[20]) { liv = ex; chiave = ex.griglia[20]; }
      if (!liv) return;
      const W = p.W, H = p.H, T = liv.T;
      const ee = lerp(prima && prima.s.e, s.s.e, u);
      const io = ee[ctx.mio] || ee[0];
      const mondoW = liv.cols * T, mondoH = liv.righe * T;
      const camX = Math.max(0, Math.min(mondoW - W, io.x - W * 0.4)), camY = Math.max(0, Math.min(mondoH - H, io.y - H * 0.55));
      const cielo = g.createLinearGradient(0, 0, 0, H); cielo.addColorStop(0, '#7ec8f2'); cielo.addColorStop(1, '#d9f1ff');
      g.fillStyle = cielo; g.fillRect(0, 0, W, H);
      g.fillStyle = '#a7d98f'; for (let k = -1; k < 6; k++) { const x = k * 300 - (camX * 0.3) % 300; g.beginPath(); g.ellipse(x + 150, H - 20 - camY * 0.1, 220, 120, 0, Math.PI, 0); g.fill(); }
      g.save(); g.translate(-camX, -camY);
      const c0 = Math.floor(camX / T), c1 = Math.min(liv.cols - 1, Math.ceil((camX + W) / T));
      const crolli = new Map((s.s.cr || []).map(([r, c, z]) => [r * 1000 + c, z]));
      for (let r = 0; r < liv.righe; r++) for (let c = c0; c <= c1; c++) {
        if (liv.griglia[r][c] === '4') {
          // piattaforma crepata: trema, poi crolla
          const z = crolli.get(r * 1000 + c); if (z === 2) continue;
          const tr = z === 1 ? Math.sin(performance.now() / 25 + c) * 2.5 : 0;
          g.fillStyle = '#b07a45'; g.fillRect(c * T + tr, r * T, T, T * 0.55); g.fillStyle = '#d19a5e'; g.fillRect(c * T + tr, r * T, T, 5);
          g.strokeStyle = '#5a3616'; g.lineWidth = 2; g.beginPath(); g.moveTo(c * T + 8 + tr, r * T + 3); g.lineTo(c * T + 18 + tr, r * T + 12); g.lineTo(c * T + 13 + tr, r * T + 20); g.moveTo(c * T + 30 + tr, r * T + 4); g.lineTo(c * T + 26 + tr, r * T + 16); g.stroke();
          continue;
        }
        if (liv.griglia[r][c] !== '1') continue;
        const erba = r === 0 || liv.griglia[r - 1][c] !== '1';
        g.fillStyle = '#8b5a2b'; g.fillRect(c * T, r * T, T, T);
        g.fillStyle = 'rgba(0,0,0,.08)'; g.fillRect(c * T + 6, r * T + 14, 8, 6); g.fillRect(c * T + 24, r * T + 26, 6, 5);
        if (erba) { g.fillStyle = '#4caf50'; g.fillRect(c * T, r * T, T, 10); g.fillStyle = '#66bb6a'; g.fillRect(c * T, r * T, T, 4); }
      }
      // spuntoni
      for (let r = 0; r < liv.righe; r++) for (let c = c0; c <= c1; c++) {
        if (liv.griglia[r][c] !== '2') continue;
        const x = c * T, y = r * T + T;
        g.fillStyle = '#8e97a6'; g.strokeStyle = '#4c5260'; g.lineWidth = 1.5;
        for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(x + k * (T / 3), y); g.lineTo(x + k * (T / 3) + T / 6, y - T * 0.55); g.lineTo(x + (k + 1) * (T / 3), y); g.closePath(); g.fill(); g.stroke(); }
        g.fillStyle = 'rgba(255,255,255,.5)'; for (let k = 0; k < 3; k++) g.fillRect(x + k * (T / 3) + T / 6 - 1, y - T * 0.5, 2, T * 0.2);
      }
      // nemici che camminano (schiacciati: appiattiti e trasparenti)
      for (const n of lerp(prima && prima.s.ne, s.s.ne || [], u)) {
        if (n.x < camX - 60 || n.x > camX + W + 60) continue;
        g.save(); g.translate(n.x, n.y + 15);
        if (n.mo) { g.globalAlpha = 0.45; g.scale(1.2, 0.3); }
        const passo = Math.sin(s.t * 10 + n.id) * 3;
        g.fillStyle = '#3a2412'; g.beginPath(); g.ellipse(-7 + passo, -2, 7, 4, 0, 0, Math.PI * 2); g.ellipse(7 - passo, -2, 7, 4, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#e2c49a'; g.fillRect(-8, -14, 16, 10);
        g.fillStyle = '#9a4f22'; g.beginPath(); g.moveTo(-17, -12); g.quadraticCurveTo(-18, -34, 0, -34); g.quadraticCurveTo(18, -34, 17, -12); g.closePath(); g.fill();
        g.fillStyle = '#fff'; g.beginPath(); g.ellipse(-5 + n.d * 2, -22, 3.5, 5, 0, 0, Math.PI * 2); g.ellipse(5 + n.d * 2, -22, 3.5, 5, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#111'; g.beginPath(); g.arc(-5 + n.d * 3, -21, 1.8, 0, Math.PI * 2); g.arc(5 + n.d * 3, -21, 1.8, 0, Math.PI * 2); g.fill();
        g.strokeStyle = '#111'; g.lineWidth = 2; g.beginPath(); g.moveTo(-9, -29); g.lineTo(-2, -26); g.moveTo(9, -29); g.lineTo(2, -26); g.stroke();
        g.restore();
      }
      // botte: una stellina dove qualcuno è morto
      const ora = performance.now();
      botti = botti.filter((b) => ora - b.t < 500);
      for (const b of botti) { const a = (ora - b.t) / 500; g.globalAlpha = 1 - a; g.font = `${24 + a * 20}px system-ui`; g.textAlign = 'center'; g.fillText(b.n ? '💥' : '✴️', b.x, b.y - a * 30); g.globalAlpha = 1; }
      g.font = '26px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle';
      // scatole "?" (grigie mentre si ricaricano)
      for (const q of liv.pot) {
        if (q.x < camX - 40 || q.x > camX + W + 40) continue;
        const via = s.s.presi.includes(q.id), y = q.y + (via ? 0 : Math.sin(s.t * 4 + q.id) * 3);
        g.fillStyle = via ? '#8a8a8a' : '#f2b705'; g.fillRect(q.x - 17, y - 17, 34, 34);
        g.strokeStyle = via ? '#555' : '#9c6b00'; g.lineWidth = 3; g.strokeRect(q.x - 17, y - 17, 34, 34);
        g.fillStyle = via ? '#666' : '#fff'; g.font = '800 24px system-ui'; g.fillText('?', q.x, y + 1);
      }
      // monete (ognuno vede solo quelle che non ha ancora preso)
      const mie = new Set(s.s.mp || []);
      for (const m of liv.monete || []) {
        if (mie.has(m.id) || m.x < camX - 20 || m.x > camX + W + 20) continue;
        const l = Math.abs(Math.cos(s.t * 5 + m.id)) * 9 + 2;
        g.fillStyle = '#ffd23f'; g.beginPath(); g.ellipse(m.x, m.y, l, 11, 0, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#b8860b'; g.lineWidth = 2; g.stroke();
      }
      g.font = '26px system-ui';
      for (const [x, y] of s.s.bu || []) g.fillText('🍌', x, y - 10);
      g.textBaseline = 'alphabetic';
      const tr = liv.traguardo;
      g.fillStyle = '#ddd'; g.fillRect(tr.x, tr.y - 160, 6, 160);
      for (let k = 0; k < 4; k++) for (let j = 0; j < 3; j++) { g.fillStyle = (k + j) % 2 ? '#111' : '#fff'; g.fillRect(tr.x + 6 + k * 12, tr.y - 160 + j * 12, 12, 12); }
      ee.forEach((e, i) => {
        if (e.c) return;
        const alfa = i === ctx.mio ? 1 : 0.55;
        g.save(); g.globalAlpha = alfa;
        g.strokeStyle = '#333'; g.lineWidth = 4; const passo = e.t ? Math.sin(s.t * 18 + i) * 6 : 3;
        g.beginPath(); g.moveTo(e.x - 5, e.y + 8); g.lineTo(e.x - 5 + passo, e.y + 17); g.moveTo(e.x + 5, e.y + 8); g.lineTo(e.x + 5 - passo, e.y + 17); g.stroke();
        g.restore();
        if (e.sl) { g.save(); g.globalAlpha = 0.5 + 0.3 * Math.sin(s.t * 20); g.fillStyle = `hsl(${(s.t * 600) % 360},90%,60%)`; g.beginPath(); g.arc(e.x, e.y, 24, 0, Math.PI * 2); g.fill(); g.restore(); }
        omino(g, e.x, e.y - 2, 13, COLORI[i % COLORI.length], i === ctx.mio ? 'Tu' : ctx.nome(i).slice(0, 10), { io: i === ctx.mio, alfa, stordito: !!e.st });
      });
      g.restore();
      // fulmine: lampo bianco su tutto lo schermo
      const la = 1 - (performance.now() - lampo) / 450;
      if (la > 0) { g.fillStyle = `rgba(255,255,230,${la * 0.7})`; g.fillRect(0, 0, W, H); g.font = '90px system-ui'; g.textAlign = 'center'; g.globalAlpha = la; g.fillText('🌩️', W / 2, H / 2); g.globalAlpha = 1; }
    },
    dopoTick(ctx, d, prima) {
      if ((d.s.fu || []).length) { lampo = performance.now(); window.Nuovi.suono([[90, 0.3]], { tipo: 'sawtooth', volume: 0.08 }); }
      const a0 = prima && prima.s.e[ctx.mio], b0 = d.s.e[ctx.mio]; if (a0 && b0 && b0.m > a0.m) window.Nuovi.suono([[988, 0.04], [1319, 0.08]], { volume: 0.04 }); for (const [x, y, n] of d.s.mo || []) botti.push({ x, y, n, t: performance.now() }); const a = prima && prima.s.e[ctx.mio], b = d.s.e[ctx.mio]; if (a && b && !a.c && b.c) window.Nuovi.suono([[300, 0.1], [150, 0.25]], { volume: 0.07 }); if (a && b && !a.a && b.a) window.Nuovi.suono([[523, 0.1], [659, 0.1], [784, 0.2]], { volume: 0.08 }); },
    suonoAzione: [[660, 0.04], [880, 0.04]],
  });
  Object.assign(window.Tavoli, { piattaforme: tavolo });
})();
