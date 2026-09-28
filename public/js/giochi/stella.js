// 1, 2, 3 STELLA: campo di sabbia con il muro dipinto a cielo, la linea di partenza e il traguardo rosso,
// l'albero e la bambola che si gira. Gli eliminati restano a terra con la macchia rossa stilizzata e il nome grigio.
(() => {
  const { COLORI, lerp, omino } = window.Arena;
  const PAROLE = ['1…', '2…', '3…', 'STEL', 'LA!'];
  let laser = [], sfondo = null;
  function campo(W, H, p0, tr) {
    const c = document.createElement('canvas'); c.width = W * 1.5; c.height = H * 1.5;
    const g = c.getContext('2d'); g.scale(1.5, 1.5);
    // terra battuta
    const t = g.createLinearGradient(0, 0, 0, H); t.addColorStop(0, '#d9b98a'); t.addColorStop(1, '#c9a472');
    g.fillStyle = t; g.fillRect(0, 0, W, H);
    for (let k = 0; k < 260; k++) { g.fillStyle = k % 2 ? 'rgba(120,80,40,.12)' : 'rgba(255,255,255,.1)'; g.beginPath(); g.arc((k * 173) % W, 40 + ((k * 97) % (H - 40)), 1 + (k % 3), 0, Math.PI * 2); g.fill(); }
    // il muro in alto dipinto a cielo con le nuvole (come nella serie)
    const cielo = g.createLinearGradient(0, 0, 0, 40); cielo.addColorStop(0, '#6fb6e8'); cielo.addColorStop(1, '#a9d8f5');
    g.fillStyle = cielo; g.fillRect(0, 0, W, 40);
    g.fillStyle = '#fff'; for (let x = 30; x < W; x += 140) { g.beginPath(); g.arc(x, 24, 11, 0, Math.PI * 2); g.arc(x + 14, 18, 14, 0, Math.PI * 2); g.arc(x + 30, 25, 10, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, 40, W, 5);
    // partenza e traguardo
    g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 5; g.setLineDash([16, 10]); g.beginPath(); g.moveTo(p0, 50); g.lineTo(p0, H - 10); g.stroke(); g.setLineDash([]);
    g.fillStyle = '#d6243a'; g.fillRect(tr - 4, 45, 8, H - 50);
    g.fillStyle = 'rgba(214,36,58,.12)'; g.fillRect(tr, 45, W - tr, H - 45);
    g.save(); g.translate(tr - 14, H / 2); g.rotate(-Math.PI / 2); g.fillStyle = 'rgba(160,20,40,.6)'; g.font = '800 16px system-ui'; g.textAlign = 'center'; g.fillText('TRAGUARDO', 0, 0); g.restore();
    // l'albero dietro la bambola
    const ax = W - 50, ay = H / 2 - 80;
    g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(ax + 10, ay + 150, 50, 14, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#5a3a22'; g.lineCap = 'round';
    g.lineWidth = 16; g.beginPath(); g.moveTo(ax + 20, ay + 150); g.lineTo(ax + 14, ay - 20); g.stroke();
    g.lineWidth = 7; for (const [dx, dy] of [[-40, -60], [30, -70], [-25, -95], [40, -30], [-45, -20]]) { g.beginPath(); g.moveTo(ax + 14, ay - 10); g.quadraticCurveTo(ax + 14 + dx * 0.4, ay + dy * 0.5, ax + 14 + dx, ay + dy); g.stroke(); }
    return c;
  }
  // la bambola: di spalle (conta) o di fronte (guarda)
  function bambola(g, x, y, guarda, t) {
    g.save(); g.translate(x, y); g.scale(1.35, 1.35);
    const s = 1;
    g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(0, 70, 30, 8, 0, 0, Math.PI * 2); g.fill();
    // gambe e calzini
    g.fillStyle = '#f0d2b5'; g.fillRect(-11, 40, 8, 26); g.fillRect(3, 40, 8, 26);
    g.fillStyle = '#fff'; g.fillRect(-12, 56, 10, 10); g.fillRect(2, 56, 10, 10);
    g.fillStyle = '#333'; g.fillRect(-13, 64, 12, 5); g.fillRect(1, 64, 12, 5);
    // vestito arancione e maglietta gialla
    g.fillStyle = '#f07a2a'; g.beginPath(); g.moveTo(-20, 44); g.lineTo(20, 44); g.lineTo(13, -4); g.lineTo(-13, -4); g.fill();
    g.fillStyle = '#f5d33a'; g.fillRect(-13, -12, 26, 14);
    g.fillStyle = '#f07a2a'; g.fillRect(-9, -8, 5, 18); g.fillRect(4, -8, 5, 18);
    // braccia
    g.fillStyle = '#f0d2b5'; g.fillRect(-19, -10, 6, 26); g.fillRect(13, -10, 6, 26);
    // testa
    g.fillStyle = guarda ? '#f3dcc6' : '#1e1a18'; g.beginPath(); g.arc(0, -30, 20 * s, 0, Math.PI * 2); g.fill();
    // codini
    g.fillStyle = '#1e1a18'; g.beginPath(); g.ellipse(-22, -30, 7, 11, 0.4, 0, Math.PI * 2); g.ellipse(22, -30, 7, 11, -0.4, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#f07a2a'; g.beginPath(); g.arc(-17, -36, 3, 0, Math.PI * 2); g.arc(17, -36, 3, 0, Math.PI * 2); g.fill();
    if (guarda) {
      // frangetta, occhi che si accendono di rosso, bocca
      g.fillStyle = '#1e1a18'; g.beginPath(); g.arc(0, -34, 20, Math.PI, 0); g.fill(); g.fillRect(-20, -36, 40, 6);
      const lum = 0.6 + 0.4 * Math.sin(t * 10);
      for (const ex of [-7, 7]) { const gl = g.createRadialGradient(ex, -26, 0, ex, -26, 8); gl.addColorStop(0, `rgba(255,60,60,${lum})`); gl.addColorStop(1, 'rgba(255,60,60,0)'); g.fillStyle = gl; g.beginPath(); g.arc(ex, -26, 8, 0, Math.PI * 2); g.fill(); g.fillStyle = '#c0121f'; g.beginPath(); g.arc(ex, -26, 2.6, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = '#e8716f'; g.beginPath(); g.ellipse(-12, -19, 3, 2, 0, 0, Math.PI * 2); g.ellipse(12, -19, 3, 2, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#8a3a2a'; g.lineWidth = 1.5; g.beginPath(); g.arc(0, -18, 3, 0.2, Math.PI - 0.2); g.stroke();
    } else {
      // di spalle: capelli con la riga in mezzo
      g.strokeStyle = '#3a322c'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, -50); g.lineTo(0, -12); g.stroke();
    }
    g.restore();
  }
  const tavolo = window.Arena.tavolo({
    id: 'stella',
    nomeAzione: '👁️ Girati (bambola)',
    obiettivo: 'punti',
    istruzioni: (ctx) => (ctx.partita.extra && ctx.partita.extra.bambola ? 'WASD o frecce (sul telefono il joystick): corri quando la bambola conta, fermati quando si gira! Se sei tu la bambola: spazio (o 👁️) per girarti.' : 'WASD o frecce (sul telefono il joystick): corri quando la bambola conta, fermati quando si gira!'),
    sottotitolo: (p) => (p.extra ? `${p.extra.bambola ? 'Bambola: un giocatore' : 'Bambola: computer'} · ${p.extra.modo === 'spietata' ? 'Spietata' : 'Con margine'}` : ''),
    statoGioco: (ctx, s) => {
      const io = s.s.e[ctx.mio];
      if (s.s.bb === ctx.mio) return s.s.f2 === 'conta' ? 'Sei la bambola: stai contando…' : 'Sei la bambola: guarda!';
      if (!io) return '';
      if (io.f) return 'Eliminato';
      if (io.a) return 'Arrivato! ⭐';
      return s.s.f2 === 'guarda' ? 'FERMO!' : 'Corri!';
    },
    hud: (ctx, s) => `<span>⏱️ ${s.s.resta} s</span><span>🏃 in gara: ${s.s.e.filter((e) => e.c && !e.f && !e.a).length}</span><span>⭐ arrivati: ${s.s.e.filter((e) => e.a).length}</span>`,
    fineRound: (p, s, ctx) => `Punti totali: ${p.punti[ctx.mio]}`,
    dopoTick(ctx, d, prima) {
      for (const [x, y] of d.s.la || []) laser.push({ x, y, t: performance.now() });
      if (prima && prima.s.f2 === 'conta' && d.s.f2 === 'guarda') window.Nuovi.suono([[880, 0.08], [660, 0.12]], { volume: 0.07 });
      if ((d.s.la || []).length) window.Nuovi.suono([[200, 0.05], [90, 0.2]], { tipo: 'sawtooth', volume: 0.08 });
      const a = prima && prima.s.e[ctx.mio], b = d.s.e[ctx.mio];
      if (a && b && !a.a && b.a) window.Nuovi.suono([[523, 0.1], [659, 0.1], [784, 0.2]], { volume: 0.08 });
    },
    disegna(g, p, s, prima, u, ctx) {
      const W = p.W, H = p.H, ex = p.extra || {}, ora = performance.now();
      if (!sfondo) sfondo = campo(W, H, ex.partenza || 70, ex.traguardo || 880);
      g.drawImage(sfondo, 0, 0, W, H);
      const guarda = s.s.f2 === 'guarda', t = s.t;
      // gli omini (vivi sopra, eliminati sotto)
      const ee = lerp(prima && prima.s.e, s.s.e, u);
      const nome = (i) => (i === ctx.mio ? 'Tu' : ctx.nome(i).slice(0, 10));
      ee.forEach((e, i) => { if (e.c && e.f && e.x !== undefined) window.Squid.eliminato(g, e.x, e.y, 14, COLORI[i % COLORI.length], nome(i), Math.max(0, t - (e.el || 0)), i + 1); });
      ee.forEach((e, i) => { if (e.c && !e.f && e.x !== undefined) omino(g, e.x, e.y, 14, COLORI[i % COLORI.length], nome(i), { io: i === ctx.mio, alfa: e.a ? 0.6 : 1 }); });
      // la bambola (se è un giocatore, il suo nome sotto)
      bambola(g, W - 55, H / 2 - 10, guarda, t);
      if (s.s.bb !== null && s.s.bb !== undefined) { g.fillStyle = '#fff'; g.font = '700 13px system-ui'; g.textAlign = 'center'; g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = 3; const nb = `🎎 ${nome(s.s.bb)}`; g.strokeText(nb, W - 55, H / 2 + 100); g.fillText(nb, W - 55, H / 2 + 100); }
      // sguardo: fascio rosso che spazza il campo e bordo rosso
      if (guarda) {
        const a = Math.sin(t * 2.2) * 0.45;
        g.save(); g.globalAlpha = 0.13; g.fillStyle = '#ff2b3b'; g.beginPath(); g.moveTo(W - 55, H / 2 - 6); g.lineTo(0, H / 2 + Math.tan(a) * W - 160); g.lineTo(0, H / 2 + Math.tan(a) * W + 160); g.closePath(); g.fill(); g.restore();
        g.strokeStyle = `rgba(255,40,60,${0.5 + 0.3 * Math.sin(t * 8)})`; g.lineWidth = 10; g.strokeRect(5, 5, W - 10, H - 10);
      }
      laser = laser.filter((k) => ora - k.t < 450);
      for (const k of laser) { const a = 1 - (ora - k.t) / 450; g.strokeStyle = `rgba(255,30,50,${a})`; g.lineWidth = 3; g.beginPath(); g.moveTo(W - 62, H / 2 - 6); g.lineTo(k.x, k.y); g.stroke(); }
      // la canzoncina in alto (bambola del computer) o da quanto conta (bambola-giocatore)
      g.save(); g.textAlign = 'center';
      g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(W / 2 - 230, 50, 460, 44);
      if (guarda) { g.fillStyle = '#ff5a66'; g.font = '800 28px system-ui'; g.fillText('🔴 FERMI! La bambola guarda', W / 2, 82); }
      else if (s.s.pr !== null && s.s.pr !== undefined) {
        const accese = Math.floor(s.s.pr * PAROLE.length + 0.001);
        PAROLE.forEach((w, k) => { g.font = `800 ${k >= 3 ? 26 : 24}px system-ui`; g.fillStyle = k < accese ? '#7dff9b' : 'rgba(255,255,255,.35)'; g.fillText(w, W / 2 - 170 + k * 85, 82); });
      } else { g.fillStyle = '#7dff9b'; g.font = '800 22px system-ui'; g.fillText(`🟢 La bambola conta… ${s.s.tc.toFixed(1)} s`, W / 2, 80); }
      g.restore();
      // la bambola-giocatore mentre conta: non vede niente
      if (s.s.cieca) {
        g.fillStyle = 'rgba(8,8,14,.96)'; g.fillRect(0, 0, W, H);
        bambola(g, W / 2, H / 2 + 20, false, t);
        g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = '800 26px system-ui';
        g.fillText('Sei di spalle e stai contando: non vedi nessuno', W / 2, 90);
        g.font = '600 18px system-ui'; g.fillStyle = '#ffd36b';
        g.fillText(s.s.tc < 1.5 ? `Aspetta ancora ${(1.5 - s.s.tc).toFixed(1)} s…` : 'Premi SPAZIO (o 👁️ Girati) per girarti di colpo!', W / 2, H - 70);
        g.fillStyle = '#aaa'; g.fillText(`Conti da ${s.s.tc.toFixed(1)} s (al massimo 7)`, W / 2, H - 40);
      } else if (s.s.bb === ctx.mio && guarda) {
        g.fillStyle = '#ffd36b'; g.textAlign = 'center'; g.font = '700 17px system-ui'; g.fillText(s.s.tc < 1.2 ? 'Guarda bene chi si muove…' : 'Premi SPAZIO per rigirarti e contare di nuovo', W / 2, H - 20);
      }
    },
  });
  Object.assign(window.Tavoli, { stella: tavolo });
})();
