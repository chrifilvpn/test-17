// OCCHI NEL BUIO: la casa vista dall'alto (pavimento, muri, mobili, armadi e tende), coperta dal buio tranne un cerchio
// di luce intorno a te. Nuvole rosse (dov'è il Cercatore) e azzurre (dove sono i nascosti) che si allargano e svaniscono.
// Chi è stato preso vede tutta la casa illuminata.
(() => {
  const { COLORI, lerp, omino } = window.Arena;
  let casa = null, chiaveCasa = '', buio = null, lampi = [];
  function disegnaCasa(ex, W, H) {
    const c = document.createElement('canvas'); c.width = W * 1.5; c.height = H * 1.5;
    const g = c.getContext('2d'); g.scale(1.5, 1.5);
    const C = ex.c, m = ex.mappa;
    // pavimento: parquet, con toni diversi per zona (così si riconoscono le stanze)
    for (let r = 0; r < m.length; r++) for (let k = 0; k < m[r].length; k++) {
      const x = k * C, y = r * C, ch = m[r][k];
      if (ch === '#') continue;
      const zona = (Math.floor(k / 8) + Math.floor(r / 5) * 3) % 4;
      g.fillStyle = ['#a8784a', '#9b8f7a', '#8a6a52', '#b08a5e'][zona]; g.fillRect(x, y, C, C);
      g.strokeStyle = 'rgba(0,0,0,.12)'; g.lineWidth = 1; for (let j = 0; j < 4; j++) { g.beginPath(); g.moveTo(x, y + j * 10 + 5); g.lineTo(x + C, y + j * 10 + 5); g.stroke(); }
      g.beginPath(); g.moveTo(x + ((r * 7 + k * 3) % 4) * 10, y); g.lineTo(x + ((r * 7 + k * 3) % 4) * 10, y + C); g.stroke();
    }
    // tappeti in alcune stanze
    g.globalAlpha = 0.5; g.fillStyle = '#7a2e3a'; g.fillRect(C * 9.5, C * 6.3, C * 6, C * 2.4); g.fillStyle = '#2e4a7a'; g.fillRect(C * 2, C * 11, C * 4, C * 2); g.globalAlpha = 1;
    // muri
    for (let r = 0; r < m.length; r++) for (let k = 0; k < m[r].length; k++) {
      if (m[r][k] !== '#') continue;
      const x = k * C, y = r * C;
      g.fillStyle = '#2b2622'; g.fillRect(x, y, C, C);
      g.fillStyle = '#3d3630'; g.fillRect(x + 2, y + 2, C - 4, C - 8);
      if (r + 1 < m.length && m[r + 1][k] !== '#') { g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x, y + C, C, 6); }
    }
    // mobili (tavoli, divani) e nascondigli (armadi, tende)
    for (let r = 0; r < m.length; r++) for (let k = 0; k < m[r].length; k++) {
      const x = k * C, y = r * C, ch = m[r][k];
      if (ch === 'M') {
        g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(x + 5, y + 7, C - 6, C - 6);
        const tipo = (r * 3 + k) % 3;
        if (tipo === 0) { g.fillStyle = '#6b4424'; g.fillRect(x + 3, y + 3, C - 6, C - 6); g.fillStyle = '#8e5b33'; g.fillRect(x + 7, y + 7, C - 14, C - 14); g.fillStyle = '#e8e8e8'; g.beginPath(); g.arc(x + C / 2, y + C / 2, 6, 0, Math.PI * 2); g.fill(); }
        else if (tipo === 1) { g.fillStyle = '#4f6fa8'; g.fillRect(x + 2, y + 4, C - 4, C - 8); g.fillStyle = '#6a8bc4'; g.fillRect(x + 6, y + 10, C - 12, C - 18); }
        else { g.fillStyle = '#5b3620'; g.fillRect(x + 3, y + 3, C - 6, C - 6); for (let j = 0; j < 5; j++) { g.fillStyle = ['#b23a3a', '#2f5d8a', '#3a7a4a', '#c89b2a', '#6b3f8a'][j]; g.fillRect(x + 6 + j * 6, y + 7, 4, C - 14); } }
      } else if (ch === 'N') {
        const tenda = (r + k) % 2;
        if (tenda) { // tenda
          for (let j = 0; j < 5; j++) { g.fillStyle = j % 2 ? '#7a3b8e' : '#8e4aa3'; g.fillRect(x + 2 + j * 7.2, y + 2, 7.2, C - 4); }
          g.fillStyle = '#d6b35a'; g.fillRect(x + 2, y + 2, C - 4, 3);
        } else { // armadio
          g.fillStyle = '#5a3a20'; g.fillRect(x + 2, y + 2, C - 4, C - 4); g.fillStyle = '#7a5130'; g.fillRect(x + 4, y + 4, C / 2 - 5, C - 8); g.fillRect(x + C / 2 + 1, y + 4, C / 2 - 5, C - 8);
          g.fillStyle = '#e0c060'; g.beginPath(); g.arc(x + C / 2 - 4, y + C / 2, 1.8, 0, Math.PI * 2); g.arc(x + C / 2 + 4, y + C / 2, 1.8, 0, Math.PI * 2); g.fill();
        }
      }
    }
    return c;
  }
  function nuvola(g, x, y, e, colore) {
    const f = Math.min(1, e / 3), r = 26 + f * 40, a = e < 0.3 ? e / 0.3 : 1 - Math.max(0, (e - 1.8) / 1.2);
    g.save(); g.globalAlpha = Math.max(0, a) * 0.85;
    const [c1, c2] = colore === 'rossa' ? ['rgba(255,70,70,.9)', 'rgba(200,20,40,0)'] : ['rgba(90,200,255,.9)', 'rgba(30,120,220,0)'];
    for (let k = 0; k < 6; k++) {
      const aa = k * 1.05 + e, dx = Math.cos(aa) * r * 0.45, dy = Math.sin(aa) * r * 0.3 - f * 10;
      const gr = g.createRadialGradient(x + dx, y + dy, 2, x + dx, y + dy, r * 0.7); gr.addColorStop(0, c1); gr.addColorStop(1, c2);
      g.fillStyle = gr; g.beginPath(); g.arc(x + dx, y + dy, r * 0.7, 0, Math.PI * 2); g.fill();
    }
    g.restore();
  }
  const tavolo = window.Arena.tavolo({
    id: 'buio',
    obiettivo: 'punti',
    istruzioni: (ctx) => (ctx.partita && ctx.partita.stato && ctx.partita.stato.s && ctx.partita.stato.s.cer === ctx.mio ? 'Sei il CERCATORE: WASD o frecce (sul telefono il joystick). Tocca i nascosti per prenderli; segui le nuvole azzurre!' : 'Nasconditi: WASD o frecce (sul telefono il joystick). Negli armadi e dietro le tende non ti vedono. La nuvola rossa ti dice dov\'è il Cercatore.'),
    sottotitolo: (p, ctx) => { const s = p.stato && p.stato.s; return s ? (s.cer === ctx.mio ? '🔦 Sei il Cercatore' : `🔦 Cerca: ${ctx.nome(s.cer)}`) : ''; },
    statoGioco: (ctx, s) => {
      const io = s.s.e[ctx.mio];
      if (s.s.cer === ctx.mio) return s.s.bendato ? `Bendato… ${s.s.bendato}` : 'Trovali!';
      return io && io.p ? 'Preso! Ora vedi tutto' : s.s.bendato ? 'Nasconditi!' : 'Resta nascosto…';
    },
    hud: (ctx, s) => `<span>⏱️ ${s.s.resta} s</span><span>🫥 nascosti: ${s.s.e.filter((e, i) => i !== s.s.cer && !e.p).length}</span><span>${s.s.cer === ctx.mio ? '☁️ azzurre' : '☁️ rossa'} tra ${s.s.prossima} s</span>${s.s.fin ? '<span style="color:#ff8a80">⚠️ caccia finale</span>' : ''}`,
    fineRound: (p, s, ctx) => `Punti totali: ${p.punti[ctx.mio]}`,
    dopoTick(ctx, d, prima) {
      for (const [x, y] of d.s.ca || []) { lampi.push({ x, y, t: performance.now() }); window.Nuovi.suono([[600, 0.06], [300, 0.2]], { volume: 0.07 }); }
      const nuove = (d.s.nu || []).filter((q) => !(prima && (prima.s.nu || []).some((z) => z.id === q.id)));
      if (nuove.length) window.Nuovi.suono(nuove[0].c === 'rossa' ? [[220, 0.12]] : [[880, 0.08], [1100, 0.1]], { volume: 0.05 });
      const a = prima && prima.s.e[ctx.mio], b = d.s.e[ctx.mio];
      if (a && b && !a.p && b.p) window.Nuovi.suono([[300, 0.1], [180, 0.3]], { volume: 0.08 });
    },
    disegna(g, p, s, prima, u, ctx) {
      const W = p.W, H = p.H, ex = p.extra;
      if (!ex || !ex.mappa) return;
      const chiave = ex.mappa.join('');
      if (chiave !== chiaveCasa) { casa = disegnaCasa(ex, W, H); chiaveCasa = chiave; }
      g.drawImage(casa, 0, 0, W, H);
      const ee = lerp(prima && prima.s.e, s.s.e, u);
      const cer = s.s.cer, io = ee[ctx.mio], sono = cer === ctx.mio;
      const nome = (i) => (i === ctx.mio ? 'Tu' : ctx.nome(i).slice(0, 10));
      // gli omini che vedi
      ee.forEach((e, i) => {
        if (e.x === undefined || (e.p && !s.s.tutto)) return;
        if (i === cer) {
          // il Cercatore: con la torcia e il bordo rosso
          g.fillStyle = 'rgba(255,230,120,.18)'; g.beginPath(); g.arc(e.x, e.y, 26, 0, Math.PI * 2); g.fill();
          omino(g, e.x, e.y, 13, COLORI[i % COLORI.length], `🔦 ${nome(i)}`, { io: i === ctx.mio });
          g.strokeStyle = '#ff4a4a'; g.lineWidth = 2; g.beginPath(); g.arc(e.x, e.y, 16, 0, Math.PI * 2); g.stroke();
        } else if (e.p) omino(g, e.x, e.y, 13, '#888', `${nome(i)} (preso)`, { alfa: 0.55 });
        else omino(g, e.x, e.y, 13, COLORI[i % COLORI.length], nome(i), { io: i === ctx.mio, alfa: e.n ? 0.55 : 1 });
      });
      // il buio: tutto nero tranne il tuo cerchio di luce (se sei stato preso, o guardi, vedi tutto)
      if (!s.s.tutto && io && io.x !== undefined) {
        if (!buio) buio = document.createElement('canvas');
        if (buio.width !== W) { buio.width = W; buio.height = H; }
        const b = buio.getContext('2d');
        b.globalCompositeOperation = 'source-over'; b.clearRect(0, 0, W, H);
        b.fillStyle = s.s.fin ? 'rgba(18,4,6,.95)' : 'rgba(4,6,14,.95)'; b.fillRect(0, 0, W, H);
        if (!(sono && s.s.bendato)) {
          const r = sono ? ex.vistaC : ex.vistaN;
          b.globalCompositeOperation = 'destination-out';
          const gr = b.createRadialGradient(io.x, io.y, r * 0.35, io.x, io.y, r); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.75, 'rgba(0,0,0,.85)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
          b.fillStyle = gr; b.beginPath(); b.arc(io.x, io.y, r, 0, Math.PI * 2); b.fill();
        }
        g.drawImage(buio, 0, 0);
        // dentro il buio si vede sempre te stesso
        if (!(sono && s.s.bendato)) omino(g, io.x, io.y, 13, COLORI[ctx.mio % COLORI.length], sono ? '🔦 Tu' : 'Tu', { io: true, alfa: io.n ? 0.6 : 1 });
      }
      // le nuvole sopra il buio
      for (const q of s.s.nu || []) nuvola(g, q.x, q.y, q.e, q.c);
      // presi: un lampo di luce dove è successo
      const ora = performance.now();
      lampi = lampi.filter((k) => ora - k.t < 700);
      for (const k of lampi) { const a = 1 - (ora - k.t) / 700; g.strokeStyle = `rgba(255,240,150,${a})`; g.lineWidth = 4; g.beginPath(); g.arc(k.x, k.y, 20 + (1 - a) * 50, 0, Math.PI * 2); g.stroke(); g.fillStyle = `rgba(255,240,150,${a})`; g.font = '800 18px system-ui'; g.textAlign = 'center'; g.fillText('Trovato!', k.x, k.y - 30 - (1 - a) * 20); }
      // messaggi grandi
      g.textAlign = 'center';
      if (sono && s.s.bendato) { g.fillStyle = '#fff'; g.font = '800 30px system-ui'; g.fillText(`Sei bendato: conta fino a ${ex.bendato}…`, W / 2, H / 2 - 10); g.font = '800 64px system-ui'; g.fillStyle = '#ffd36b'; g.fillText(String(s.s.bendato), W / 2, H / 2 + 60); }
      else if (!sono && s.s.bendato) { g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(W / 2 - 220, 14, 440, 42); g.fillStyle = '#7dffa0'; g.font = '800 22px system-ui'; g.fillText(`Nasconditi! Il Cercatore parte tra ${s.s.bendato} s`, W / 2, 43); }
      else if (s.s.tutto && io && io.p) { g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(W / 2 - 230, 14, 460, 42); g.fillStyle = '#ffd36b'; g.font = '700 20px system-ui'; g.fillText('Sei stato preso: ora vedi tutta la casa 💡', W / 2, 42); }
    },
  });
  Object.assign(window.Tavoli, { buio: tavolo });
})();
