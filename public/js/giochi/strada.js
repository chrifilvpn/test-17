// ATTRAVERSA LA STRADA: il mondo si ricostruisce dal seme (StradaMondo, file condiviso col server); qui si disegnano
// prati, strade, fiumi, binari e i pulcini a cubetti. Un passo per tasto; sul telefono tocco = avanti, striscia = di lato.
(() => {
  const { COLORI } = window.Arena;
  const SM = window.StradaMondo;
  const C = 60;
  let mondo = null, semeMondo = null, ctxS = null;
  const salti = {}; // posto -> { h, da } per l'animazione del salto
  let passi = 0, storia = '';

  const attiva = () => ctxS && ctxS.partita && ctxS.partita.gioco === 'strada' && !ctxS.partita.finita;
  function passo(m) {
    if (!attiva() || (window.Boss && Boss.attivo)) return;
    passi++; storia = (storia + m).slice(-6);
    ctxS.emetti('input', { pn: passi, pm: storia });
  }
  const TASTI = { arrowup: 'u', w: 'u', arrowdown: 'd', s: 'd', arrowleft: 'l', a: 'l', arrowright: 'r', d: 'r' };
  document.addEventListener('keydown', (e) => {
    if (!attiva() || e.repeat || (e.target.closest && e.target.closest('input, textarea, select'))) return;
    const m = TASTI[e.key.toLowerCase()];
    if (m) { e.preventDefault(); passo(m); }
  });
  // telefono: tocco = avanti, striscia = direzione; frecce sotto il campo
  let tocco = null;
  document.addEventListener('pointerdown', (e) => {
    if (!attiva()) return;
    const b = e.target.closest && e.target.closest('[data-st]');
    if (b) { e.preventDefault(); passo(b.dataset.st); return; }
    if (e.pointerType === 'touch' && e.target.classList && e.target.classList.contains('ar-tela')) tocco = { x: e.clientX, y: e.clientY, id: e.pointerId };
  }, { passive: false });
  document.addEventListener('pointerup', (e) => {
    if (!tocco || e.pointerId !== tocco.id) return;
    const dx = e.clientX - tocco.x, dy = e.clientY - tocco.y; tocco = null;
    if (Math.hypot(dx, dy) < 24) return passo('u');
    passo(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'r' : 'l') : dy > 0 ? 'd' : 'u');
  });

  // ---------- disegni ----------
  function albero(g, x, y) {
    g.fillStyle = '#6b4a2b'; g.fillRect(x + 25, y + 34, 10, 18);
    g.fillStyle = '#2f7d32'; g.fillRect(x + 12, y + 6, 36, 32);
    g.fillStyle = '#44a047'; g.fillRect(x + 12, y + 6, 36, 12);
    g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x + 12, y + 32, 36, 6);
  }
  const COL_AUTO = ['#e8453c', '#2f7fd8', '#f2b705', '#8e55c9', '#1fa3a3', '#f07b2c'];
  function auto(g, x, y, lungo, v, col) {
    const w = lungo * C - 8, px = x * C + 4;
    g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(px + 3, y + 46, w, 8);
    g.fillStyle = '#222'; for (const k of lungo > 1 ? [0.15, 0.45, 0.85] : [0.2, 0.8]) { g.fillRect(px + w * k - 6, y + 8, 12, 6); g.fillRect(px + w * k - 6, y + 44, 12, 6); }
    g.fillStyle = lungo > 1 ? '#dfe3e8' : COL_AUTO[col % COL_AUTO.length];
    g.fillRect(px, y + 12, w, 34);
    if (lungo > 1) { g.fillStyle = COL_AUTO[col % COL_AUTO.length]; const cab = v > 0 ? px + w - 34 : px; g.fillRect(cab, y + 10, 34, 38); g.fillStyle = '#9fd3f2'; g.fillRect(v > 0 ? cab + 22 : cab + 4, y + 15, 8, 28); }
    else { g.fillStyle = '#9fd3f2'; g.fillRect(px + w * 0.28, y + 16, w * 0.44, 26); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(px, y + 12, w, 6); }
    g.fillStyle = '#fff6a0'; const fx = v > 0 ? px + w - 5 : px + 1; g.fillRect(fx, y + 15, 4, 7); g.fillRect(fx, y + 36, 4, 7);
  }
  function tronco(g, x, y, lungo) {
    const px = x * C + 3, w = lungo * C - 6;
    g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(px + 2, y + 44, w, 8);
    g.fillStyle = '#8a5a33'; g.fillRect(px, y + 12, w, 34);
    g.fillStyle = '#a06c40'; g.fillRect(px, y + 12, w, 10);
    g.fillStyle = '#6e4526'; for (let k = 1; k < lungo * 2; k++) g.fillRect(px + (k * w) / (lungo * 2), y + 24, 3, 18);
    g.fillStyle = '#c9975f'; g.fillRect(px, y + 14, 6, 30); g.fillRect(px + w - 6, y + 14, 6, 30);
  }
  function treno(g, a, y) {
    const px = a * C, w = SM.LUNGO_TRENO * C;
    for (let k = 0; k < 4; k++) {
      const x0 = px + (k * w) / 4 + 3, ww = w / 4 - 6;
      g.fillStyle = k === 0 || k === 3 ? '#d63a2f' : '#3565b8'; g.fillRect(x0, y + 6, ww, 48);
      g.fillStyle = '#f2d24a'; g.fillRect(x0, y + 30, ww, 6);
      g.fillStyle = '#bfe3ff'; for (let j = 12; j < ww - 20; j += 34) g.fillRect(x0 + j, y + 12, 22, 14);
    }
  }
  function pulcino(g, x, y, colore, dir, opz = {}) {
    g.save(); g.translate(x, y); g.globalAlpha = opz.alfa ?? 1;
    if (opz.schiacciato) g.scale(1.35, 0.35);
    const specchio = dir === 'l' ? -1 : 1;
    g.fillStyle = 'rgba(0,0,0,.22)'; g.beginPath(); g.ellipse(0, 18 + (opz.salto || 0), 17, 6, 0, 0, Math.PI * 2); g.fill();
    g.translate(0, -(opz.salto || 0));
    g.fillStyle = '#fff'; g.fillRect(-16, -14, 32, 30); // corpo a cubetto
    g.fillStyle = colore; g.fillRect(-16, 4, 32, 12); g.fillRect(-16 * specchio, -4, 6 * specchio, 14); // pancia e ala del colore del giocatore
    g.fillStyle = '#e8322a'; g.fillRect(-4, -22, 8, 8); // cresta
    g.fillStyle = '#f5a623'; if (dir === 'd') g.fillRect(-4, -2, 8, 6); else if (dir === 'u') g.fillRect(-3, -16, 6, 4); else g.fillRect(14 * specchio - (specchio < 0 ? 8 : 0), -6, 8, 6);
    g.fillStyle = '#111'; if (dir !== 'u') { if (dir === 'd') { g.fillRect(-9, -8, 4, 4); g.fillRect(5, -8, 4, 4); } else g.fillRect(6 * specchio - 2, -9, 4, 4); }
    if (opz.io) { g.strokeStyle = '#fff'; g.lineWidth = 3; g.strokeRect(-19, -25, 38, 44); g.strokeStyle = colore; g.lineWidth = 1.5; g.strokeRect(-19, -25, 38, 44); }
    g.restore();
  }
  function spirito(g, x, y, colore, resta) {
    g.save(); g.globalAlpha = 0.55 + 0.25 * Math.sin(performance.now() / 150);
    g.fillStyle = '#e9f4ff'; g.beginPath(); g.arc(x, y - 6, 16, Math.PI, 0); g.lineTo(x + 16, y + 14); for (let k = 0; k < 4; k++) g.lineTo(x + 16 - (k + 0.5) * 8, y + (k % 2 ? 14 : 8)); g.lineTo(x - 16, y + 14); g.closePath(); g.fill();
    g.fillStyle = '#222'; g.fillRect(x - 7, y - 10, 4, 5); g.fillRect(x + 3, y - 10, 4, 5);
    g.globalAlpha = 1; g.strokeStyle = colore; g.lineWidth = 4; g.beginPath(); g.arc(x, y, 26, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * resta) / 5); g.stroke();
    g.fillStyle = '#fff'; g.font = '700 14px system-ui'; g.textAlign = 'center'; g.fillText(`${Math.ceil(resta)}`, x, y + 40);
    g.restore();
  }

  function disegnaCorsia(g, c, r, y, t, W) {
    if (c.k === 'g') {
      g.fillStyle = r % 2 ? '#8fd35d' : '#83c952'; g.fillRect(0, y, W, C);
      for (const a of c.a) albero(g, a * C, y);
    } else if (c.k === 's') {
      g.fillStyle = '#4f555e'; g.fillRect(0, y, W, C);
      const sopra = mondo.corsia(r + 1);
      if (sopra.k === 's') { g.fillStyle = 'rgba(255,255,255,.6)'; for (let x = 10; x < W; x += 60) g.fillRect(x, y - 2, 30, 4); }
    } else if (c.k === 'f' || c.k === 'n') {
      g.fillStyle = '#3f9be0'; g.fillRect(0, y, W, C);
      g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 2;
      const off = ((t * (c.v || 0.4) * C) % 80 + 80) % 80;
      for (let x = -80 + off; x < W; x += 80) { g.beginPath(); g.moveTo(x, y + 20 + (r % 3) * 8); g.lineTo(x + 26, y + 20 + (r % 3) * 8); g.stroke(); }
      if (c.k === 'n') for (const col of c.c) { const cx = col * C + 30, cy = y + 30; g.fillStyle = '#2e8b3e'; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, 24, 0.35, Math.PI * 2 - 0.05); g.closePath(); g.fill(); g.fillStyle = '#48b05a'; g.beginPath(); g.arc(cx - 4, cy - 4, 12, 0, Math.PI * 2); g.fill(); }
    } else if (c.k === 'b') {
      g.fillStyle = '#a89883'; g.fillRect(0, y, W, C);
      g.fillStyle = '#6d5237'; for (let x = 4; x < W; x += 30) g.fillRect(x, y + 8, 12, 44);
      g.fillStyle = '#8c939c'; g.fillRect(0, y + 16, W, 5); g.fillRect(0, y + 40, W, 5);
    }
  }
  function disegnaOggetti(g, c, y, t, W) {
    if (c.k === 's') SM.oggetti(c, t).forEach((a, i) => auto(g, a, y, c.l, c.v, c.col + i));
    else if (c.k === 'f') for (const a of SM.oggetti(c, t)) tronco(g, a, y, c.l);
    else if (c.k === 'b') {
      const tr = SM.treno(c, t);
      // semaforo: luce rossa che lampeggia prima del treno
      const acceso = tr.avviso && Math.floor(performance.now() / 180) % 2 === 0;
      const sx = c.v > 0 ? 8 : W - 20;
      g.fillStyle = '#333'; g.fillRect(sx, y + 2, 12, 22); g.fillStyle = acceso ? '#ff3b2f' : '#5a1c18'; g.beginPath(); g.arc(sx + 6, y + 10, 5, 0, Math.PI * 2); g.fill();
      if (acceso) { g.fillStyle = 'rgba(255,40,30,.12)'; g.fillRect(0, y, W, C); }
      if (tr.passa) treno(g, tr.a, y);
    }
  }

  const tavolo = window.Arena.tavolo({
    id: 'strada',
    comandi: 'nessuno',
    obiettivo: 'righe',
    istruzioni: () => (window.Arena.touch() ? 'Tocca il campo per andare avanti, striscia il dito di lato o indietro (o usa le frecce).' : 'Frecce o WASD: un passo per tasto (spazio o clic = avanti).') + ' Evita auto e treni, salta sui tronchi, non restare indietro!',
    statoGioco: (ctx, s) => { const e = s.s.g[ctx.mio]; return !e ? 'Guarda' : e.v ? 'Avanti!' : e.sp ? 'Aspetta un compagno…' : 'Sei fuori: guarda gli altri'; },
    sottotitolo: (p) => (p.extra && p.extra.modo === 'coop' ? 'Cooperazione 🤝' : 'Sfida'),
    hud: (ctx, s) => {
      const e = s.s.g[ctx.mio];
      const coop = ctxS && ctxS.partita.extra && ctxS.partita.extra.modo === 'coop';
      return `<span>🐥 righe: <b>${e ? e.b : 0}</b></span>${coop ? `<span>🤝 squadra: <b>${s.s.sq ?? 0}</b></span>` : ''}<span>⏱️ ${Math.floor(s.t)} s</span>`;
    },
    fineRound: (p, s, ctx) => (p.extra && p.extra.modo === 'coop' ? `Squadra: ${s.s.sq ?? ''} righe` : `Righe in tutto: ${p.punti[ctx.mio]}`),
    disegna(g, p, s, prima, u, ctx) {
      ctxS = ctx;
      const W = p.W, H = p.H, x = p.extra || {};
      if (!SM || x.seme === undefined) return;
      if (semeMondo !== x.seme) { mondo = SM.crea(x.seme); semeMondo = x.seme; }
      const pr = prima && prima.s && prima.s.g ? prima : null;
      const t = pr ? pr.t + (s.t - pr.t) * u : s.t;
      const io = s.s.g[ctx.mio] || s.s.g[0];
      const ioP = pr && pr.s.g[ctx.mio];
      const cam = ioP ? ioP.c + (io.c - ioP.c) * u : io.c;
      const yRiga = (r) => H - (r - cam + 1.5) * C;
      const r0 = Math.floor(cam - 0.5) - 1, r1 = r0 + 16;
      for (let r = r1; r >= r0; r--) disegnaCorsia(g, mondo.corsia(r), r, yRiga(r), t, W);
      for (let r = r1; r >= r0; r--) disegnaOggetti(g, mondo.corsia(r), yRiga(r), t, W);
      // spiriti (cooperazione)
      s.s.g.forEach((e, i) => { if (!e.v && e.sp) spirito(g, e.sp.x * C, yRiga(e.sp.r) + 30, COLORI[i % COLORI.length], e.sp.f); });
      // giocatori: prima gli altri (mezzi trasparenti), poi io
      const ora = performance.now();
      const ordine = s.s.g.map((_, i) => i).filter((i) => i !== ctx.mio).concat(ctx.mio);
      for (const i of ordine) {
        const e = s.s.g[i]; if (!e) continue;
        const a = pr && pr.s.g[i];
        let px = e.x, rr = e.r;
        if (a && a.h === e.h && a.v && e.v) px = a.x + (e.x - a.x) * u; // sul tronco scivola
        const sa = salti[i] || (salti[i] = { h: e.h, da: 0, r0: rr, x0: px });
        if (sa.h !== e.h) { sa.r0 = a ? a.r : rr; sa.x0 = a ? a.x : px; sa.h = e.h; sa.da = ora; }
        const k = Math.min(1, (ora - sa.da) / 110);
        const yy = yRiga(sa.r0 + (rr - sa.r0) * k) + 30, xx = (sa.x0 + (px - sa.x0) * k) * C;
        const salto = Math.sin(k * Math.PI) * 14;
        const colore = COLORI[i % COLORI.length], mio = i === ctx.mio;
        if (e.v) {
          pulcino(g, xx, yy, colore, e.d, { io: mio, alfa: mio ? 1 : 0.6, salto });
          if (e.im) { g.strokeStyle = 'rgba(120,255,160,.8)'; g.lineWidth = 3; g.beginPath(); g.arc(xx, yy, 28, 0, Math.PI * 2); g.stroke(); }
        } else if (e.m === 'auto' || e.m === 'treno') pulcino(g, e.x * C, yRiga(e.r) + 38, colore, e.d, { schiacciato: true, alfa: mio ? 1 : 0.6 });
        else if (e.m === 'acqua' || e.m === 'bordo') { g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 3; const f = (ora / 400) % 1; for (const rg of [10, 22]) { g.beginPath(); g.ellipse(e.x * C, yRiga(e.r) + 32, rg + f * 12, (rg + f * 12) * 0.45, 0, 0, Math.PI * 2); g.stroke(); } }
        if (e.v || e.m !== 'aquila') {
          g.font = '600 13px system-ui, sans-serif'; g.textAlign = 'center'; g.lineWidth = 3; g.strokeStyle = 'rgba(0,0,0,.6)'; g.fillStyle = '#fff';
          const nome = mio ? 'Tu' : ctx.nome(i).slice(0, 10), ny = (e.v ? yy : yRiga(e.r) + 30) - 34;
          g.strokeText(nome, e.v ? xx : e.x * C, ny); g.fillText(nome, e.v ? xx : e.x * C, ny);
        }
      }
      // l'aquila: ombra che scende quando ti porta via, e il fondo che sale
      if (!io.v && io.m === 'aquila') { g.font = '64px system-ui'; g.textAlign = 'center'; g.fillText('🦅', W / 2, H - 70 - ((ora / 4) % 300)); }
      const gr = g.createLinearGradient(0, H - 50, 0, H); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.35)'); g.fillStyle = gr; g.fillRect(0, H - 50, W, 50);
      // righe fatte in grande in alto
      g.font = '700 40px system-ui, sans-serif'; g.textAlign = 'left'; g.lineWidth = 5; g.strokeStyle = 'rgba(0,0,0,.55)'; g.fillStyle = '#fff';
      const testo = p.extra.modo === 'coop' ? `🤝 ${s.s.sq ?? 0}` : String(io.b); g.strokeText(testo, 16, 48); g.fillText(testo, 16, 48);
    },
    dopoTick(ctx, d, prima) {
      ctxS = ctx;
      const e = d.s.g[ctx.mio], a = prima && prima.s.g[ctx.mio];
      if (a && e && a.h !== e.h && e.v) window.Nuovi.suono([[660, 0.03]], { volume: 0.03 });
      if (a && e && a.v && !e.v) window.Nuovi.suono(e.m === 'acqua' || e.m === 'bordo' ? [[300, 0.05], [180, 0.2]] : [[220, 0.05], [90, 0.25]], { tipo: 'square', volume: 0.1 });
    },
  });
  // frecce sotto il campo per il telefono
  const panno = tavolo.panno;
  tavolo.panno = function (ctx) {
    ctxS = ctx;
    const frecce = window.Arena.touch() ? '<div class="st-frecce"><button type="button" data-st="l">◀</button><button type="button" data-st="u">▲</button><button type="button" data-st="d">▼</button><button type="button" data-st="r">▶</button></div>' : '';
    return panno.call(this, ctx).replace('<p class="piccolo ar-istr">', `${frecce}<p class="piccolo ar-istr">`);
  };
  Object.assign(window.Tavoli, { strada: tavolo });
})();
