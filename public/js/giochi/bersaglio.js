// TIRO AL BERSAGLIO: prato con lo steccato, il bersaglio sul suo palo, le assi che passano davanti e le frecce.
// Bersaglio, assi e tremito della mano si ricalcolano qui dal tempo del round (stesse formule di giochi/bersaglio.js).
(() => {
  const { COLORI } = window.Arena;
  const posB = (b, t) => ({ x: b.x0 + b.amp * Math.sin(b.om * t + b.fase), y: b.y });
  const posA = (a, t) => ({ x: a.x0 + a.amp * Math.sin(a.om * t + a.fase), y: a.y });
  const tremito = (m, t) => ({ x: m.A * Math.sin(1.3 * t + m.f1) + m.A * 0.35 * Math.sin(3.1 * t + m.f2), y: m.A * 0.7 * Math.sin(1.9 * t + m.f2) });
  let ctxB = null, mira = null, tLoc = 0, tocco = null, popup = [];
  const attiva = () => ctxB && ctxB.partita && ctxB.partita.gioco === 'bersaglio' && !ctxB.partita.finita && ctxB.partita.stato && ctxB.partita.stato.fase === 'gioco';

  function coord(e) {
    const tela = document.querySelector('.ar-tela'); if (!tela) return null;
    const r = tela.getBoundingClientRect(), p = ctxB.partita;
    return [((e.clientX - r.left) / r.width) * p.W, ((e.clientY - r.top) / r.height) * p.H];
  }
  const tira = (m) => { if (attiva() && m) ctxB.emetti('azione', { tipo: 'tira', t: tLoc, mx: Math.round(m[0]), my: Math.round(m[1]) }); };
  document.addEventListener('pointermove', (e) => { if (ctxB && e.target.classList && e.target.classList.contains('ar-tela')) { mira = coord(e); if (tocco && e.pointerId === tocco) e.preventDefault(); } }, { passive: false });
  document.addEventListener('pointerdown', (e) => {
    if (!ctxB || !e.target.classList || !e.target.classList.contains('ar-tela')) return;
    mira = coord(e);
    if (e.pointerType === 'touch') { tocco = e.pointerId; return; } // col dito: si mira trascinando e si tira staccando
    if (e.button === 0) tira(mira);
  });
  document.addEventListener('pointerup', (e) => { if (tocco !== null && e.pointerId === tocco) { tocco = null; const m = coord(e) || mira; tira(m); } });

  function bersaglio(g, x, y, R) {
    g.fillStyle = '#6d4a2a'; g.fillRect(x - 5, y, 10, 470 - y + R * 0.2);
    g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(x + 6, y + R + 8, R * 0.9, R * 0.18, 0, 0, Math.PI * 2); g.fill();
    const col = ['#f4f1e8', '#23262d', '#2f7fd8', '#e8453c', '#f5c518'];
    for (let k = 0; k < 5; k++) { const r = R * [1, 0.75, 0.55, 0.35, 0.15][k]; g.fillStyle = col[k]; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1; g.stroke(); }
    g.strokeStyle = '#8a6a44'; g.lineWidth = 3; g.beginPath(); g.arc(x, y, R + 1.5, 0, Math.PI * 2); g.stroke();
  }
  function asse(g, x, y, w, h) {
    g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(x - w / 2 + 6, y - h / 2 + 8, w, h);
    g.fillStyle = '#b98348'; g.fillRect(x - w / 2, y - h / 2, w, h);
    g.strokeStyle = '#8e5f2c'; g.lineWidth = 2; for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(x - w / 2 + (k * w) / 4, y - h / 2 + 4); g.bezierCurveTo(x - w / 2 + (k * w) / 4 + 5, y - 10, x - w / 2 + (k * w) / 4 - 5, y + 10, x - w / 2 + (k * w) / 4, y + h / 2 - 4); g.stroke(); }
    g.fillStyle = '#5b3a1a'; for (const yy of [y - h / 2 + 12, y + h / 2 - 12]) for (const xx of [x - w / 2 + 9, x + w / 2 - 9]) { g.beginPath(); g.arc(xx, yy, 3, 0, Math.PI * 2); g.fill(); }
  }
  function freccia(g, x, y, sc, colore, alfa = 1, ang = -Math.PI / 2 - 0.25) {
    g.save(); g.globalAlpha = alfa; g.translate(x, y); g.rotate(ang); g.scale(sc, sc);
    g.strokeStyle = '#5b3a1a'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 0); g.lineTo(-46, 0); g.stroke();
    g.fillStyle = colore; g.beginPath(); g.moveTo(-40, 0); g.lineTo(-52, -7); g.lineTo(-47, 0); g.lineTo(-52, 7); g.closePath(); g.fill();
    g.fillStyle = '#9aa3ad'; g.beginPath(); g.moveTo(4, 0); g.lineTo(-4, -4); g.lineTo(-4, 4); g.closePath(); g.fill();
    g.restore();
  }

  const tavolo = window.Arena.tavolo({
    id: 'bersaglio',
    mouse: 'bersaglio',
    clicAzione: false,
    comandi: 'nessuno',
    obiettivo: 'punti',
    istruzioni: () => (window.Arena.touch() ? 'Appoggia il dito sul campo e trascina per mirare: staccalo per tirare.' : 'Mira col mouse e tira con un clic (o spazio).') + ' Una freccia per bersaglio: attento al tremito e alle assi!',
    statoGioco: (ctx, s) => (s.s.ti[ctx.mio] ? 'Freccia tirata!' : 'Mira e tira!'),
    sottotitolo: (p) => (p.extra ? `bersaglio ${p.extra.dist}${p.extra.per > 1 ? ` (×${p.extra.per})` : ''}` : ''),
    hud: (ctx, s) => `<span>⏱️ ${s.s.resta} s</span><span>🏹 ${s.s.ti.filter(Boolean).length}/${s.s.ti.length} hanno tirato</span>`,
    fineRound: (p, s, ctx) => { const f = s.s.fr.find((x) => x.p === ctx.mio); return `${f ? (f.e === 'asse' ? 'Asse! 0 punti' : f.e === 'mancato' ? 'Mancato: 0 punti' : `+${f.pt} punti`) : 'Non hai tirato'} · totale ${p.punti[ctx.mio]}`; },
    disegna(g, p, s, prima, u, ctx) {
      ctxB = ctx;
      const W = p.W, H = p.H, ex = p.extra; if (!ex) return;
      const pr = prima && prima.s ? prima : null;
      tLoc = pr ? pr.t + (s.t - pr.t) * u : s.t;
      const t = tLoc;
      // paesaggio
      const cielo = g.createLinearGradient(0, 0, 0, 250); cielo.addColorStop(0, '#9fd3f5'); cielo.addColorStop(1, '#e6f5ff'); g.fillStyle = cielo; g.fillRect(0, 0, W, 250);
      g.fillStyle = '#9cc98a'; g.beginPath(); g.moveTo(0, 240); for (let x = 0; x <= W; x += 50) g.lineTo(x, 215 + Math.sin(x * 0.012) * 18); g.lineTo(W, 250); g.lineTo(0, 250); g.fill();
      const prato = g.createLinearGradient(0, 240, 0, H); prato.addColorStop(0, '#7dbb5c'); prato.addColorStop(1, '#4f9a3c'); g.fillStyle = prato; g.fillRect(0, 240, W, H - 240);
      g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 2; for (let k = -6; k <= 6; k++) { g.beginPath(); g.moveTo(W / 2 + k * 40, 245); g.lineTo(W / 2 + k * 260, H); g.stroke(); }
      g.fillStyle = '#c9a26b'; g.fillRect(0, 232, W, 8); for (let x = 10; x < W; x += 36) g.fillRect(x, 212, 7, 26);
      // bersaglio, frecce piantate, assi davanti
      const b = posB(ex.b, t);
      bersaglio(g, b.x, b.y, ex.b.R);
      const sc = 1 / (0.9 + ex.b.d * 0.45);
      const ora = performance.now();
      for (const f of s.s.fr) {
        if (t < f.a) continue;
        const col = COLORI[f.p % COLORI.length];
        if ((f.e === 'bersaglio' || f.e === 'centro') && f.dx !== undefined) freccia(g, b.x + f.dx, b.y + f.dy, sc * 0.8, col);
        else if (f.e === 'mancato' || (f.e === null && f.as === undefined)) freccia(g, f.x, Math.max(f.y, 205), sc * 0.7, col, 0.45);
      }
      for (const a of ex.assi) {
        const q = posA(a, t); asse(g, q.x, q.y, a.w, a.h);
        for (const f of s.s.fr) if (t >= f.a && f.as === a.id) freccia(g, q.x + f.dx, q.y + f.dy, sc * 0.85, COLORI[f.p % COLORI.length]);
      }
      // frecce in volo: partono dal basso (davanti al proprio arciere) e rimpiccioliscono andando lontano
      for (const f of s.s.fr) {
        if (t < f.t || t >= f.a) continue;
        const k = (t - f.t) / (f.a - f.t), x0 = W / 2 + (f.p - (p.n - 1) / 2) * 60, y0 = H + 20;
        const x = x0 + (f.x - x0) * k, y = y0 + (f.y - y0) * k - Math.sin(k * Math.PI) * 40;
        freccia(g, x, y, 1.3 - (1.3 - sc) * k, COLORI[f.p % COLORI.length], 1, Math.atan2(f.y - y0 - Math.cos(k * Math.PI) * 40 * Math.PI, f.x - x0));
      }
      // i punti che saltano fuori all'arrivo
      for (const f of s.s.fr) if (f.e && !popup.some((x) => x.k === `${s.round}:${f.p}`)) popup.push({ k: `${s.round}:${f.p}`, x: f.e === 'bersaglio' || f.e === 'centro' ? b.x + f.dx : f.x, y: f.e === 'bersaglio' || f.e === 'centro' ? b.y + f.dy : f.y, testo: f.e === 'asse' ? '🪵' : f.e === 'mancato' ? '✗' : `+${f.pt}`, col: COLORI[f.p % COLORI.length], t: ora });
      popup = popup.filter((x) => ora - x.t < 1300);
      for (const x of popup) { const a = (ora - x.t) / 1300; g.globalAlpha = 1 - a; g.font = '800 26px system-ui'; g.textAlign = 'center'; g.lineWidth = 4; g.strokeStyle = 'rgba(0,0,0,.6)'; g.strokeText(x.testo, x.x, x.y - 30 - a * 40); g.fillStyle = x.col; g.fillText(x.testo, x.x, x.y - 30 - a * 40); g.globalAlpha = 1; }
      // il mio mirino, con il tremito della mano
      if (mira && !s.s.ti[ctx.mio] && s.fase === 'gioco') {
        const tr = tremito(ex.mano, t), x = mira[0] + tr.x, y = mira[1] + tr.y, col = COLORI[ctx.mio % COLORI.length];
        g.strokeStyle = '#fff'; g.lineWidth = 5; g.beginPath(); g.arc(x, y, 16, 0, Math.PI * 2); g.stroke();
        g.strokeStyle = col; g.lineWidth = 2.5; g.beginPath(); g.arc(x, y, 16, 0, Math.PI * 2); g.moveTo(x - 26, y); g.lineTo(x - 8, y); g.moveTo(x + 8, y); g.lineTo(x + 26, y); g.moveTo(x, y - 26); g.lineTo(x, y - 8); g.moveTo(x, y + 8); g.lineTo(x, y + 26); g.stroke();
        g.fillStyle = col; g.beginPath(); g.arc(x, y, 2.5, 0, Math.PI * 2); g.fill();
      }
      // il mio arco in basso
      g.strokeStyle = '#6d4a2a'; g.lineWidth = 7; g.beginPath(); g.arc(W / 2, H + 70, 90, -Math.PI * 0.82, -Math.PI * 0.18); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(W / 2 - 75, H + 20); g.lineTo(W / 2 + 75, H + 20); g.stroke();
    },
    dopoTick(ctx, d, prima) {
      ctxB = ctx;
      const a = prima && prima.s.ti[ctx.mio], b = d.s.ti[ctx.mio];
      if (!a && b) window.Nuovi.suono([[300, 0.03], [900, 0.06]], { tipo: 'triangle', volume: 0.08 });
      const f = d.s.fr.find((x) => x.p === ctx.mio), f0 = prima && prima.s.fr.find((x) => x.p === ctx.mio);
      if (f && f.e && !(f0 && f0.e)) window.Nuovi.suono(f.e === 'centro' ? [[784, 0.1], [1047, 0.2]] : f.e === 'asse' ? [[140, 0.12]] : f.e === 'mancato' ? [[200, 0.15]] : [[600, 0.1]], { volume: 0.08 });
    },
  });
  Object.assign(window.Tavoli, { bersaglio: tavolo });
})();
