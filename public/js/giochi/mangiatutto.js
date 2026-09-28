// MANGIATUTTO: labirinto con i muri a mattoncini viola, semini, pillole, il mangiatore (una pallina arancione con la
// fogliolina in testa e un occhio solo) e i fantasmi. I fantasmi dei giocatori hanno il nome sopra.
(() => {
  const { COLORI } = window.Arena;
  let tela = null, chiaveLab = null;
  function sfondo(ex) {
    const T = ex.T, R = ex.lab.length, C = ex.lab[0].length;
    const c = document.createElement('canvas'); c.width = C * T; c.height = R * T;
    const g = c.getContext('2d');
    g.fillStyle = '#0d0b24'; g.fillRect(0, 0, C * T, R * T);
    const muro = (x, y) => y < 0 || y >= R || x < 0 || x >= C || ex.lab[y][x] === '#';
    for (let y = 0; y < R; y++) for (let x = 0; x < C; x++) {
      const ch = ex.lab[y][x];
      if (ch === '-') { g.fillStyle = '#f7a8d8'; g.fillRect(x * T + 2, y * T + T / 2 - 3, T - 4, 6); continue; }
      if (ch !== '#') continue;
      g.fillStyle = '#3a2a8c'; g.fillRect(x * T, y * T, T, T);
      g.strokeStyle = '#8f7bff'; g.lineWidth = 3; g.lineCap = 'round';
      const m = 3;
      g.beginPath();
      if (!muro(x, y - 1)) { g.moveTo(x * T + m, y * T + m); g.lineTo(x * T + T - m, y * T + m); }
      if (!muro(x, y + 1)) { g.moveTo(x * T + m, y * T + T - m); g.lineTo(x * T + T - m, y * T + T - m); }
      if (!muro(x - 1, y)) { g.moveTo(x * T + m, y * T + m); g.lineTo(x * T + m, y * T + T - m); }
      if (!muro(x + 1, y)) { g.moveTo(x * T + T - m, y * T + m); g.lineTo(x * T + T - m, y * T + T - m); }
      g.stroke();
      g.fillStyle = 'rgba(255,255,255,.05)'; if ((x + y) % 2) g.fillRect(x * T + 8, y * T + 8, T - 16, T - 16);
    }
    return c;
  }
  function mangiatore(g, x, y, r, vx, vy, bocca, io) {
    const ang = vx < 0 ? Math.PI : vy < 0 ? -Math.PI / 2 : vy > 0 ? Math.PI / 2 : 0;
    const a = 0.08 + Math.abs(Math.sin(bocca * 12)) * 0.7;
    g.save(); g.translate(x, y);
    // fogliolina in testa (non gira con la bocca)
    g.fillStyle = '#43b04a'; g.beginPath(); g.ellipse(3, -r - 3, 6, 3, -0.6, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#2e7d32'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, -r + 2); g.lineTo(2, -r - 4); g.stroke();
    g.rotate(ang);
    g.fillStyle = '#ff9a1f'; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, r, a, Math.PI * 2 - a); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.arc(-r * 0.3, -r * 0.35, r * 0.3, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(r * 0.15, -r * 0.5, r * 0.22, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#222'; g.beginPath(); g.arc(r * 0.22, -r * 0.5, r * 0.11, 0, Math.PI * 2); g.fill();
    if (io) { g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.arc(0, 0, r + 3, a, Math.PI * 2 - a); g.stroke(); }
    g.restore();
  }
  function fantasma(g, x, y, r, colore, stato, vx, vy, t, pauraFine) {
    g.save(); g.translate(x, y);
    if (stato !== 'o') {
      let col = colore;
      if (stato === 'p') col = pauraFine && Math.floor(t * 8) % 2 ? '#f2f2ff' : '#2b3fd6';
      g.fillStyle = col;
      g.beginPath(); g.arc(0, -r * 0.15, r, Math.PI, 0);
      g.lineTo(r, r * 0.85);
      for (let k = 0; k < 4; k++) { const x0 = r - (k + 0.5) * (r / 2); g.quadraticCurveTo(x0, r * (0.5 + 0.3 * Math.sin(t * 10 + k)), r - (k + 1) * (r / 2), r * 0.85); }
      g.closePath(); g.fill();
    }
    if (stato === 'p') {
      g.fillStyle = '#ffd6d6'; g.fillRect(-r * 0.45, -r * 0.35, r * 0.25, r * 0.25); g.fillRect(r * 0.2, -r * 0.35, r * 0.25, r * 0.25);
      g.strokeStyle = '#ffd6d6'; g.lineWidth = 2; g.beginPath(); for (let k = 0; k <= 4; k++) g.lineTo(-r * 0.6 + k * r * 0.3, r * 0.3 + (k % 2 ? -3 : 3)); g.stroke();
    } else {
      for (const s of [-1, 1]) {
        g.fillStyle = '#fff'; g.beginPath(); g.ellipse(s * r * 0.38, -r * 0.2, r * 0.28, r * 0.34, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#1f3bd6'; g.beginPath(); g.arc(s * r * 0.38 + vx * r * 0.13, -r * 0.2 + vy * r * 0.15, r * 0.14, 0, Math.PI * 2); g.fill();
      }
    }
    g.restore();
  }

  const tavolo = window.Arena.tavolo({
    id: 'mangiatutto',
    obiettivo: 'punti',
    istruzioni: () => (window.Arena.touch() ? 'Muoviti col joystick.' : 'Frecce o WASD per muoverti.') + ' Il mangiatore mangia i semini, i fantasmi lo inseguono: dopo una pillola grande i fantasmi scappano!',
    ruolo: (p, s, ctx) => (s.s && s.s.pac === ctx.mio ? 'sei il Mangiatore 🟠' : 'sei un fantasma 👻'),
    statoGioco: (ctx, s) => (s.s.presa ? 'Preso!' : s.s.pac === ctx.mio ? (s.s.paura ? 'Mangia i fantasmi blu!' : 'Mangia tutto!') : s.s.paura ? 'Scappa, sei blu!' : 'Acchiappa il mangiatore!'),
    sottotitolo: (p, ctx) => (p.stato && p.stato.s && p.stato.s.pac === ctx.mio ? 'fai il Mangiatore' : p.n > 1 ? 'fai il fantasma' : ''),
    hud: (ctx, s) => `<span>${'🟠'.repeat(Math.max(0, s.s.vite))} vite</span><span>🍬 ${[...s.s.cibo].filter((c) => c !== '0').length} semini</span>${s.s.paura ? `<span>💙 ${Math.ceil(s.s.paura)} s</span>` : ''}<span>⏱️ ${Math.floor(s.t)} s</span>`,
    fineRound: (p, s, ctx) => `Punti totali: ${p.punti[ctx.mio]}`,
    disegna(g, p, s, prima, u, ctx) {
      const ex = p.extra; if (!ex || !ex.lab) return;
      if (chiaveLab !== ex.lab.join('')) { tela = sfondo(ex); chiaveLab = ex.lab.join(''); }
      const T = ex.T, C = ex.lab[0].length, t = s.t;
      g.drawImage(tela, 0, 0);
      // semini e pillole
      const cibo = s.s.cibo;
      for (let i = 0; i < cibo.length; i++) {
        if (cibo[i] === '0') continue;
        const x = (i % C) * T + T / 2, y = Math.floor(i / C) * T + T / 2;
        if (cibo[i] === '1') { g.fillStyle = '#ffe3b8'; g.fillRect(x - 2.5, y - 2.5, 5, 5); }
        else { g.fillStyle = '#ffd05a'; g.beginPath(); g.arc(x, y, 7 + Math.sin(t * 6) * 2, 0, Math.PI * 2); g.fill(); }
      }
      const pr = prima && prima.s && prima.s.m ? prima.s : null;
      const lerpE = (a, b) => (a && Math.hypot(a.x - b.x, a.y - b.y) < 2 ? { ...b, x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u } : b);
      const pos = (e) => [e.x * T + T / 2, e.y * T + T / 2];
      // fantasmi (quelli dei giocatori col nome)
      s.s.f.forEach((f0, k) => {
        const f = lerpE(pr && pr.f[k], f0);
        let [x, y] = pos(f);
        if (f.s === 'h') { x = (8 + (k % 3)) * T + T / 2 + Math.sin(t * 3 + k) * 3; y = 9 * T + T / 2 + (k === 3 ? -6 : 0); }
        const posto = ex.fantasmi[k];
        fantasma(g, x, y, T * 0.46, ex.col[k], f.s, f.vx, f.vy, t, s.s.paura > 0 && s.s.paura < 2);
        if (x < -T) fantasma(g, x + C * T, y, T * 0.46, ex.col[k], f.s, f.vx, f.vy, t, false);
        if (posto !== null && posto !== undefined && f.s !== 'h') {
          const nome = posto === ctx.mio ? 'Tu' : ctx.nome(posto).slice(0, 9);
          g.font = '700 12px system-ui, sans-serif'; g.textAlign = 'center'; g.lineWidth = 3; g.strokeStyle = 'rgba(0,0,0,.8)'; g.strokeText(nome, x, y - T * 0.62); g.fillStyle = posto === ctx.mio ? '#fff' : COLORI[posto % COLORI.length]; g.fillText(nome, x, y - T * 0.62);
          if (posto === ctx.mio) { g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.arc(x, y, T * 0.62, 0, Math.PI * 2); g.stroke(); }
        }
      });
      // il mangiatore
      const m = lerpE(pr && pr.m, s.s.m), [mx, my] = pos(m);
      if (s.s.presa) { const k = (performance.now() / 500) % 1; g.globalAlpha = 1 - k; mangiatore(g, mx, my, T * 0.46 * (1 - k * 0.6), m.vx, m.vy, 0.13, false); g.globalAlpha = 1; }
      else mangiatore(g, mx, my, T * 0.46, m.vx, m.vy, m.b, s.s.pac === ctx.mio);
      if (p.n > 1) { const nome = s.s.pac === ctx.mio ? 'Tu' : ctx.nome(s.s.pac).slice(0, 9); g.font = '700 12px system-ui'; g.textAlign = 'center'; g.lineWidth = 3; g.strokeStyle = 'rgba(0,0,0,.8)'; g.strokeText(nome, mx, my - T * 0.7); g.fillStyle = '#ffb347'; g.fillText(nome, mx, my - T * 0.7); }
    },
    dopoTick(ctx, d, prima) {
      if (!prima || !prima.s || !prima.s.cibo) return;
      if (d.s.pac === ctx.mio && d.s.cibo !== prima.s.cibo) window.Nuovi.suono([[d.s.paura > prima.s.paura ? 300 : 700, 0.03]], { volume: 0.025 });
      if (d.s.presa && !prima.s.presa) window.Nuovi.suono([[500, 0.1], [350, 0.1], [200, 0.3]], { tipo: 'square', volume: 0.07 });
      if (d.s.f.some((f, k) => f.s === 'o' && prima.s.f[k] && prima.s.f[k].s === 'p')) window.Nuovi.suono([[200, 0.05], [900, 0.12]], { volume: 0.07 });
    },
  });
  Object.assign(window.Tavoli, { mangiatutto: tavolo });
})();
