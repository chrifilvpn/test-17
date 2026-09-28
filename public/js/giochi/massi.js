// MASSI DALLA MONTAGNA: pendio visto dall'alto, cima in alto, massi che rotolano giù.
(() => {
  const { COLORI, lerp, omino } = window.Arena;
  let botti = [];
  const eTiro = (ctx) => { const s = ctx.partita.stato.s; return s && s.ti === ctx.mio; };
  const tavolo = window.Arena.tavolo({
    id: 'massi',
    mouse: 'bersaglio',
    nomeAzione: '🪨 Tira',
    obiettivo: 'punti',
    ruolo: (p, s, ctx) => (s.s.ti === ctx.mio ? 'sei in cima: tira i massi! 🪨' : `sali! Tira i massi ${ctx.nome(s.s.ti)}`),
    sottotitolo: (p, ctx) => (eTiro(ctx) ? 'tiri tu 🪨' : 'sali! ⛰️'),
    istruzioni: (ctx) => (eTiro(ctx) ? 'Sei in cima: A e D (o il mouse) per spostarti, spazio o clic per tirare un masso.' : 'Sali con WASD o le frecce (sul telefono il joystick) e schiva i massi!'),
    statoGioco: (ctx, s) => { if (s.s.ti === ctx.mio) return 'Tira i massi!'; const e = s.s.e[ctx.mio]; return e && e.a ? 'Sei in cima! ⛰️' : e && e.st ? 'Colpito! 💫' : 'Sali!'; },
    hud: (ctx, s) => `<span>⏱️ ${s.s.resta} s</span><span>🪨 ${ctx.nome(s.s.ti)}${s.s.ti === ctx.mio ? ' (tu)' : ''}</span><span>⛰️ in cima: ${s.s.e.filter((e, i) => i !== s.s.ti && e.a).length}</span>`,
    fineRound: (p, s, ctx) => `Punti totali: ${p.punti[ctx.mio]}`,
    dopoTick(ctx, d) { for (const [x, y] of d.s.b) { botti.push({ x, y, t: performance.now() }); window.Nuovi.suono([[120, 0.15]], { tipo: 'square', volume: 0.08 }); } },
    disegna(g, p, s, prima, u, ctx) {
      const W = p.W, H = p.H;
      const SX = s.s.sx || 0, DX = s.s.dx || W;
      // il sentiero in mezzo
      const pendio = g.createLinearGradient(0, 0, 0, H); pendio.addColorStop(0, '#b9a58a'); pendio.addColorStop(1, '#7ea35a');
      g.fillStyle = pendio; g.fillRect(0, 0, W, H);
      g.fillStyle = 'rgba(0,0,0,.07)'; for (let k = 0; k < 26; k++) g.fillRect(SX + ((k * 139) % (DX - SX)), (k * 71) % H, 26, 5);
      // tornanti disegnati sul sentiero (solo decorazione)
      g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 16; g.lineCap = 'round'; g.beginPath(); g.moveTo(W / 2, H - 20);
      for (let y = H - 20; y > 100; y -= 70) g.quadraticCurveTo(y % 140 < 70 ? DX - 60 : SX + 60, y - 35, W / 2, y - 70);
      g.stroke();
      // pareti di roccia ai lati, con ombra verso il sentiero
      const parete = (x0, x1, dir) => {
        g.save(); g.beginPath(); g.rect(x0, 0, x1 - x0, H); g.clip();
        const gr = g.createLinearGradient(x0, 0, x1, 0);
        gr.addColorStop(0, dir > 0 ? '#4c4540' : '#6e655c'); gr.addColorStop(1, dir > 0 ? '#6e655c' : '#4c4540');
        g.fillStyle = gr; g.fillRect(x0, 0, x1 - x0, H);
        // blocchi di roccia
        for (let y = -20, k = 0; y < H; y += 46, k++) {
          for (let x = x0 + ((k % 2) * 30) - 20; x < x1; x += 70) {
            g.fillStyle = ['#5d554d', '#675e55', '#544c45'][(k + Math.floor(x / 70)) % 3];
            g.beginPath(); g.moveTo(x, y + 8); g.lineTo(x + 30, y); g.lineTo(x + 62, y + 10); g.lineTo(x + 58, y + 40); g.lineTo(x + 8, y + 44); g.closePath(); g.fill();
            g.fillStyle = 'rgba(255,255,255,.08)'; g.beginPath(); g.moveTo(x + 4, y + 10); g.lineTo(x + 30, y + 3); g.lineTo(x + 32, y + 12); g.lineTo(x + 8, y + 18); g.fill();
          }
        }
        // pini e cespugli sulle rocce
        for (let y = 130, k = 0; y < H; y += 95, k++) {
          const x = dir > 0 ? x0 + 40 + (k * 57) % Math.max(40, x1 - x0 - 90) : x0 + 40 + (k * 83) % Math.max(40, x1 - x0 - 90);
          g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(x + 4, y + 26, 18, 6, 0, 0, Math.PI * 2); g.fill();
          g.fillStyle = '#2f5d3a'; g.beginPath(); g.moveTo(x, y - 30); g.lineTo(x + 18, y + 4); g.lineTo(x - 18, y + 4); g.fill(); g.beginPath(); g.moveTo(x, y - 12); g.lineTo(x + 22, y + 22); g.lineTo(x - 22, y + 22); g.fill();
          g.fillStyle = '#5b3a24'; g.fillRect(x - 3, y + 22, 6, 8);
        }
        g.restore();
        // bordo del sentiero: ombra
        const sh = g.createLinearGradient(dir > 0 ? x1 : x0, 0, dir > 0 ? x1 + 22 : x0 - 22, 0);
        sh.addColorStop(0, 'rgba(0,0,0,.35)'); sh.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = sh; g.fillRect(dir > 0 ? x1 : x0 - 22, 0, 22, H);
      };
      parete(0, SX, 1); parete(DX, W, -1);
      // la cima (neve)
      g.fillStyle = '#e8e2d6'; g.fillRect(0, 0, W, 70); g.fillStyle = '#fff'; for (let x = 0; x < W; x += 60) { g.beginPath(); g.moveTo(x, 70); g.lineTo(x + 30, 55); g.lineTo(x + 60, 70); g.fill(); }
      g.strokeStyle = 'rgba(255,255,255,.9)'; g.setLineDash([12, 10]); g.lineWidth = 3; g.beginPath(); g.moveTo(SX, 92); g.lineTo(DX, 92); g.stroke(); g.setLineDash([]);
      g.fillStyle = '#fff'; g.font = '700 14px system-ui'; g.textAlign = 'left'; g.fillText('⛰️ ARRIVO', SX + 10, 112);
      for (const m of lerp(prima && prima.s.ma, s.s.ma, u)) {
        g.save(); g.translate(m.x, m.y); g.rotate(m.g);
        g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(4, 18, 24, 8, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#7d7468'; g.beginPath(); for (let k = 0; k < 9; k++) { const a = (k / 9) * Math.PI * 2, r = 26 * (0.85 + ((k * 3) % 5) / 20); g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.fill();
        g.fillStyle = '#9a9184'; g.beginPath(); g.arc(-7, -7, 7, 0, Math.PI * 2); g.fill();
        g.restore();
      }
      const ee = lerp(prima && prima.s.e, s.s.e, u);
      ee.forEach((e, i) => { const nm = i === ctx.mio ? 'Tu' : ctx.nome(i).slice(0, 10); if (i === s.s.ti) { omino(g, s.s.tx, 38, 18, COLORI[i % COLORI.length], nm + ' 🪨', { io: i === ctx.mio }); return; } omino(g, e.x, e.y, 16, COLORI[i % COLORI.length], nm, { io: i === ctx.mio, stordito: e.st, alfa: e.a ? 0.6 : 1 }); });
      const ora = performance.now();
      botti = botti.filter((k) => ora - k.t < 400);
      for (const k of botti) { const a = (ora - k.t) / 400; g.fillStyle = `rgba(120,100,80,${1 - a})`; for (let j = 0; j < 6; j++) { const an = j * Math.PI / 3; g.beginPath(); g.arc(k.x + Math.cos(an) * a * 40, k.y + Math.sin(an) * a * 40, 6, 0, Math.PI * 2); g.fill(); } }
    },
  });
  Object.assign(window.Tavoli, { massi: tavolo });
})();
