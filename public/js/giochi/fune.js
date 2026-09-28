// TIRO ALLA FUNE: vista di lato. Due torri con la piattaforma in cima, il burrone buio in mezzo, la corda con il
// fiocco rosso. Chi perde viene trascinato oltre il bordo e cade in fondo (macchia rossa stilizzata, nome grigio).
(() => {
  const { COLORI, lerp, omino } = window.Arena;
  const TOP = 330, CORDA = 300, BORDO_SX = 380, BORDO_DX = 620, FONDO = 598;
  const SQ = ['#2f7fd8', '#d6453a'];
  let sfondo = null, colpi = [];
  function scena(W, H) {
    const c = document.createElement('canvas'); c.width = W * 1.5; c.height = H * 1.5;
    const g = c.getContext('2d'); g.scale(1.5, 1.5);
    // la sala buia con le luci dall'alto
    const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#171b24'); bg.addColorStop(1, '#07080c');
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    for (const x of [200, 500, 800]) { const l = g.createRadialGradient(x, 0, 10, x, 0, 380); l.addColorStop(0, 'rgba(255,240,200,.18)'); l.addColorStop(1, 'rgba(255,240,200,0)'); g.fillStyle = l; g.beginPath(); g.moveTo(x - 40, 0); g.lineTo(x + 40, 0); g.lineTo(x + 180, H); g.lineTo(x - 180, H); g.fill(); g.fillStyle = '#2b2f38'; g.fillRect(x - 30, 0, 60, 14); }
    // il burrone: il fondo lontano
    const gap = g.createLinearGradient(0, TOP, 0, H); gap.addColorStop(0, '#0d0f14'); gap.addColorStop(1, '#040406');
    g.fillStyle = gap; g.fillRect(BORDO_SX, TOP, BORDO_DX - BORDO_SX, H - TOP);
    g.fillStyle = '#1a1c22'; g.fillRect(BORDO_SX, FONDO + 4, BORDO_DX - BORDO_SX, H - FONDO);
    // le due torri (motivo a righe verde acqua, come nella serie)
    for (const [x0, x1] of [[0, BORDO_SX], [BORDO_DX, W]]) {
      g.fillStyle = '#2a5a5e'; g.fillRect(x0, TOP, x1 - x0, H - TOP);
      g.fillStyle = 'rgba(255,255,255,.06)'; for (let x = x0; x < x1; x += 34) g.fillRect(x, TOP + 22, 16, H - TOP);
      g.fillStyle = 'rgba(0,0,0,.25)'; for (let y = TOP + 60; y < H; y += 70) g.fillRect(x0, y, x1 - x0, 4);
      // bordo della piattaforma a strisce di pericolo
      for (let x = x0; x < x1; x += 24) { g.fillStyle = ((x - x0) / 24) % 2 ? '#1d1d1d' : '#f2c230'; g.fillRect(x, TOP, 24, 12); }
      g.fillStyle = '#8b6b4a'; g.fillRect(x0, TOP - 6, x1 - x0, 6);
    }
    // il simbolo ○△□ sulle torri
    g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 4;
    g.beginPath(); g.arc(150, 470, 26, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.moveTo(830, 440); g.lineTo(860, 495); g.lineTo(800, 495); g.closePath(); g.stroke();
    g.strokeRect(215, 445, 50, 50); g.strokeRect(735, 445, 0, 0);
    return c;
  }
  // posizione del giocatore k (0 = il primo, vicino al bordo) della squadra s, con la corda spostata di c
  const posX = (s, k, c) => (s === 0 ? BORDO_SX - 150 + c - k * 52 : BORDO_DX + 150 + c + k * 52);
  const tavolo = window.Arena.tavolo({
    id: 'fune',
    comandi: 'tasto',
    nomeAzione: '🪢 Tira!',
    obiettivo: 'punti',
    suonoAzione: [[300 + Math.random() * 60, 0.02]],
    istruzioni: () => 'Premi la barra spaziatrice (o 🪢 sul telefono) più veloce che puoi: più colpi al secondo, più tiri!',
    sottotitolo: (p) => (p.extra && p.extra.uno ? 'Uno contro uno (torneo)' : 'A squadre'),
    statoGioco: (ctx, s) => {
      const sq = s.s.sq[0].includes(ctx.mio) ? 0 : s.s.sq[1].includes(ctx.mio) ? 1 : -1;
      if (s.s.pe !== null) return s.s.pe === sq ? 'Caduti…' : sq >= 0 ? 'Vinto! 🪢' : 'Sfida finita';
      if (sq < 0) return s.s.ft[ctx.mio] ? 'Fuori dal torneo: guarda' : 'Aspetti il tuo turno: guarda';
      return 'TIRA!';
    },
    hud: (ctx, s) => {
      const sq = s.s.sq[0].includes(ctx.mio) ? 0 : s.s.sq[1].includes(ctx.mio) ? 1 : -1;
      return `<span>⏱️ ${s.s.resta} s</span><span style="color:${SQ[0]}">◀ ${s.s.f[0].toFixed(1)}/s</span><span style="color:${SQ[1]}">${s.s.f[1].toFixed(1)}/s ▶</span>${sq >= 0 ? `<span>💪 tu: ${s.s.rt[ctx.mio].toFixed(1)} colpi/s</span>` : ''}`;
    },
    fineRound: (p, s, ctx) => `Punti totali: ${p.punti[ctx.mio]}`,
    dopoTick(ctx, d, prima) {
      if (prima && prima.s.pe === null && d.s.pe !== null) {
        const sq = d.s.sq[0].includes(ctx.mio) ? 0 : d.s.sq[1].includes(ctx.mio) ? 1 : -1;
        window.Nuovi.suono(sq === d.s.pe ? [[300, 0.1], [200, 0.2], [120, 0.4]] : [[523, 0.1], [659, 0.1], [784, 0.2]], { volume: 0.08 });
      }
    },
    disegna(g, p, s, prima, u, ctx) {
      const W = p.W, H = p.H, t = s.t;
      if (!sfondo) sfondo = scena(W, H);
      g.drawImage(sfondo, 0, 0, W, H);
      const c = prima ? prima.s.c + (s.s.c - prima.s.c) * u : s.s.c;
      const cade = s.s.pe, tc = cade !== null ? Math.max(0, t - s.s.cd) : 0;
      const nome = (i) => (i === ctx.mio ? 'Tu' : ctx.nome(i).slice(0, 10));
      // dove sta ognuno (chi cade: prima trascinato oltre il bordo, poi giù)
      const pos = [];
      s.s.sq.forEach((m, sq) => m.forEach((pi, k) => {
        let x = posX(sq, k, c), y = TOP - 16, cad = 0;
        if (cade === sq) {
          const ritardo = k * 0.18, q = Math.max(0, tc - ritardo);
          const bordo = sq === 0 ? BORDO_SX + 18 : BORDO_DX - 18;
          const trascina = Math.min(1, q / 0.45);
          x = x + (bordo - x) * trascina * trascina;
          if (q > 0.45) { const f = q - 0.45; y = Math.min(FONDO - 14, TOP - 16 + 900 * f * f); x += (sq === 0 ? 1 : -1) * 60 * f; cad = y >= FONDO - 14 ? 2 : 1; }
        }
        pos.push({ pi, sq, x, y, cad, q: Math.max(0, tc - k * 0.18) });
      }));
      // chi è fuori dal torneo resta sul fondo del burrone
      s.s.ft.forEach((f, i) => { if (f && !pos.some((q) => q.pi === i)) pos.push({ pi: i, x: BORDO_SX + 30 + ((i * 53) % 180), y: FONDO - 14, cad: 3 }); });
      // la corda: dal primo della squadra blu all'ultimo della rossa, con il fiocco rosso al centro
      const vivi = pos.filter((q) => !q.cad);
      if (vivi.length || cade === null) {
        const sx = Math.min(...pos.filter((q) => q.sq === 0).map((q) => q.x), BORDO_SX - 200 + c) - 20, dx = Math.max(...pos.filter((q) => q.sq === 1).map((q) => q.x), BORDO_DX + 200 + c) + 20;
        const tesa = cade === null ? Math.sin(t * 20) * 1.5 : 0;
        g.strokeStyle = '#a37a4a'; g.lineWidth = 7; g.beginPath(); g.moveTo(sx, CORDA); g.quadraticCurveTo(W / 2 + c, CORDA + 10 + tesa, dx, CORDA); g.stroke();
        g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 2; g.setLineDash([6, 6]); g.beginPath(); g.moveTo(sx, CORDA); g.quadraticCurveTo(W / 2 + c, CORDA + 10 + tesa, dx, CORDA); g.stroke(); g.setLineDash([]);
        const fx = W / 2 + c;
        g.fillStyle = '#e0243a'; g.beginPath(); g.moveTo(fx, CORDA + 4); g.lineTo(fx - 10, CORDA + 30); g.lineTo(fx + 10, CORDA + 30); g.fill();
        g.beginPath(); g.moveTo(fx, CORDA + 4); g.lineTo(fx - 14, CORDA - 8); g.lineTo(fx - 14, CORDA + 14); g.fill(); g.beginPath(); g.moveTo(fx, CORDA + 4); g.lineTo(fx + 14, CORDA - 8); g.lineTo(fx + 14, CORDA + 14); g.fill();
      }
      // i segni dei bordi da non superare
      g.strokeStyle = 'rgba(224,36,58,.5)'; g.lineWidth = 2; g.setLineDash([4, 5]);
      for (const x of [W / 2 - (p.extra ? p.extra.bordo : 150), W / 2 + (p.extra ? p.extra.bordo : 150)]) { g.beginPath(); g.moveTo(x, CORDA - 50); g.lineTo(x, CORDA + 40); g.stroke(); }
      g.setLineDash([]);
      // i giocatori
      for (const q of pos) {
        const col = COLORI[q.pi % COLORI.length];
        if (q.cad === 2 || q.cad === 3) { window.Squid.eliminato(g, q.x, q.y, 14, col, nome(q.pi), q.cad === 3 ? 5 : Math.max(0, q.q - 0.45 - Math.sqrt((FONDO - TOP) / 900)), q.pi + 1); continue; }
        // la maglia della squadra sotto l'omino, e le braccia sulla corda
        if (!q.cad) { g.strokeStyle = '#f0d2b5'; g.lineWidth = 4; g.beginPath(); g.moveTo(q.x, q.y); g.lineTo(q.x + (q.sq === 0 ? 14 : -14), CORDA); g.stroke(); }
        g.fillStyle = SQ[q.sq]; g.fillRect(q.x - 10, q.y + 8, 20, 10);
        const tira = cade === null && s.s.rt[q.pi] > 0.5 ? Math.sin(t * 25 + q.pi) * 2 : 0;
        omino(g, q.x + (q.sq === 0 ? -tira : tira), q.y, 14, col, nome(q.pi), { io: q.pi === ctx.mio });
      }
      // uno contro uno: chi aspetta, in fila in alto
      if (p.extra && p.extra.uno && s.s.coda.length) {
        g.fillStyle = 'rgba(255,255,255,.7)'; g.font = '600 13px system-ui'; g.textAlign = 'left'; g.fillText('In attesa:', 16, 34);
        s.s.coda.forEach((i, k) => { if (!s.s.sq[0].includes(i) && !s.s.sq[1].includes(i)) omino(g, 110 + k * 60, 28, 11, COLORI[i % COLORI.length], nome(i), { io: i === ctx.mio }); });
      }
      // le barre della forza
      const bar = (x, dir, v, col) => { g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(x, 70, 160, 12); g.fillStyle = col; const w = Math.min(160, v * 11); g.fillRect(dir > 0 ? x : x + 160 - w, 70, w, 12); };
      bar(W / 2 - 180, -1, s.s.f[0], SQ[0]); bar(W / 2 + 20, 1, s.s.f[1], SQ[1]);
      g.fillStyle = '#fff'; g.font = '700 14px system-ui'; g.textAlign = 'center'; g.fillText('forza', W / 2, 81);
      if (cade !== null) { g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(W / 2 - 200, 110, 400, 46); g.fillStyle = cade === 0 ? SQ[1] : SQ[0]; g.font = '800 26px system-ui'; g.fillText(p.extra && p.extra.uno ? `Vince ${nome(s.s.sq[1 - cade][0])}!` : `Vince la squadra ${cade === 0 ? 'rossa' : 'blu'}!`, W / 2, 142); }
    },
  });
  Object.assign(window.Tavoli, { fune: tavolo });
})();
