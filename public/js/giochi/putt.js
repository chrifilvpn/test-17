// PUTT PARTY 2D: il campo su canvas (disegnato da PuttBuche, lo stesso file del server). Le palline arrivano col tick
// e qui si interpolano per essere fluide; mulini e blocchi si calcolano dal tempo della buca.
// Si tira come con una fionda: premi, trascina all'indietro, lascia.
(() => {
  const { esc, suono, primaVolta } = window.Nuovi;
  const PB = window.PuttBuche;
  let ctxA = null, tela = null;
  let ultimo = null, prima = null, arrivo = 0, primaArrivo = 0;
  let mira = null;
  const attiva = () => ctxA && ctxA.stato && ctxA.partita && ctxA.partita.gioco === 'putt';

  function erba(g) {
    g.fillStyle = '#1b5e3a'; g.fillRect(0, 0, PB.W, PB.H);
    g.fillStyle = 'rgba(255,255,255,.035)';
    for (let x = 0; x < PB.W; x += 60) g.fillRect(x, 0, 30, PB.H);
  }
  function poly(g, pts) { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); }
  function segmento(g, [x1, y1, x2, y2], w, c) { g.strokeStyle = c; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); }

  function palleOra() {
    if (!ultimo) return [];
    const u = Math.min(1, (performance.now() - arrivo) / Math.max(20, arrivo - primaArrivo || 33));
    return ultimo.palle.map((q, i) => {
      const a = prima && prima.palle[i] && prima.k === ultimo.k ? prima.palle[i] : q;
      return { ...q, x: a.x + (q.x - a.x) * u, y: a.y + (q.y - a.y) * u };
    });
  }

  function disegna() {
    if (!attiva() || !tela || !tela.isConnected || !ultimo) return;
    const p = ctxA.partita;
    if (p.buca == null) return;
    const b = PB.BUCHE[p.buca];
    const box = tela.parentElement;
    const scala = Math.min(box.clientWidth / PB.W, Math.max(220, window.innerHeight - 260) / PB.H);
    const dpr = window.devicePixelRatio || 1, w = Math.round(PB.W * scala), h = Math.round(PB.H * scala);
    if (tela.width !== Math.round(w * dpr)) { tela.width = Math.round(w * dpr); tela.height = Math.round(h * dpr); tela.style.width = `${w}px`; tela.style.height = `${h}px`; }
    const g = tela.getContext('2d');
    g.setTransform(dpr * scala, 0, 0, dpr * scala, 0, 0);
    const t = ultimo.pausa ? ultimo.t : ultimo.t + (performance.now() - arrivo) / 1000;
    erba(g);
    // prato della buca
    poly(g, b.bordo); g.fillStyle = '#3fae5a'; g.fill();
    g.save(); poly(g, b.bordo); g.clip();
    g.fillStyle = 'rgba(255,255,255,.06)'; for (let x = 0; x < PB.W; x += 40) g.fillRect(x, 0, 20, PB.H);
    for (const [x, y, ww, hh] of b.sabbia || []) { g.fillStyle = '#e8d08f'; g.beginPath(); g.roundRect(x, y, ww, hh, 18); g.fill(); g.fillStyle = 'rgba(160,120,50,.25)'; for (let k = 0; k < 18; k++) g.fillRect(x + ((k * 37) % ww), y + ((k * 53) % hh), 3, 3); }
    for (const [x, y, ww, hh] of b.acqua || []) {
      g.fillStyle = '#2f7fd8'; g.fillRect(x, y, ww, hh);
      g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 2;
      for (let yy = y + 14; yy < y + hh; yy += 18) { g.beginPath(); for (let xx = x; xx <= x + ww; xx += 8) g.lineTo(xx, yy + Math.sin(xx / 14 + t * 2) * 3); g.stroke(); }
    }
    g.restore();
    // bordo e muri di legno
    for (const s of PB.segmentiFissi(b)) { segmento(g, s, 12, '#6b4423'); segmento(g, s, 6, '#9a6a3a'); }
    for (const [x, y, r] of b.respingenti || []) {
      g.fillStyle = '#d64541'; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.arc(x, y, r * 0.65, 0, Math.PI * 2); g.stroke();
    }
    for (const m of b.mulini || []) { g.fillStyle = '#6b4423'; g.beginPath(); g.arc(m.x, m.y, 9, 0, Math.PI * 2); g.fill(); }
    for (const r of b.scorrevoli || []) { const y = PB.posScorrevole(r, t); g.fillStyle = '#8e55c9'; g.fillRect(r.x, y, r.w, r.h); g.strokeStyle = '#5b2f8f'; g.lineWidth = 2; g.strokeRect(r.x, y, r.w, r.h); }
    for (const s of PB.segmentiMobili({ mulini: b.mulini }, t)) { segmento(g, s, 10, '#7a2a20'); segmento(g, s, 5, '#e05a47'); }
    // buca e bandierina
    const [bx, by] = b.buca;
    g.fillStyle = '#111'; g.beginPath(); g.arc(bx, by, PB.R_BUCA, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#ddd'; g.lineWidth = 2; g.beginPath(); g.moveTo(bx, by); g.lineTo(bx, by - 46); g.stroke();
    g.fillStyle = '#e0473c'; g.beginPath(); g.moveTo(bx, by - 46); g.lineTo(bx + 24, by - 39); g.lineTo(bx, by - 32); g.fill();
    // partenza
    g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 2; g.setLineDash([4, 4]); g.beginPath(); g.arc(b.partenza[0], b.partenza[1], 14, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
    // palline: prima gli altri (trasparenti), poi la mia
    const palle = palleOra();
    const ordine = palle.map((_, i) => i).filter((i) => i !== ctxA.mio).concat([ctxA.mio]);
    for (const i of ordine) {
      const q = palle[i];
      if (!q || (q.d && i !== ctxA.mio) || p.usciti[i]) continue;
      if (q.d) continue;
      g.globalAlpha = i === ctxA.mio ? 1 : 0.55;
      g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.arc(q.x + 2, q.y + 3, PB.R_PALLA, 0, Math.PI * 2); g.fill();
      g.fillStyle = p.colori[i % p.colori.length]; g.beginPath(); g.arc(q.x, q.y, PB.R_PALLA, 0, Math.PI * 2); g.fill();
      g.strokeStyle = i === ctxA.mio ? '#1f2430' : 'rgba(0,0,0,.4)'; g.lineWidth = i === ctxA.mio ? 2.5 : 1.5; g.stroke();
      g.fillStyle = '#fff'; g.font = '600 13px system-ui, sans-serif'; g.textAlign = 'center';
      // il nome degli altri solo se la loro pallina non è sopra la mia (così non si sovrappongono)
      const mia = palle[ctxA.mio];
      if (i === ctxA.mio || !mia || Math.hypot(q.x - mia.x, q.y - mia.y) > 26) g.fillText(i === ctxA.mio ? 'Tu' : ctxA.nome(i).slice(0, 8), q.x, q.y - 14);
      g.globalAlpha = 1;
    }
    // la mira: freccia dalla mia pallina
    const mia = palle[ctxA.mio];
    if (mira && mira.len > 0 && mia) {
      const f = mira.f, a = mira.a, lung = 30 + f * 170;
      const ex = mia.x + Math.cos(a) * lung, ey = mia.y + Math.sin(a) * lung;
      const col = `hsl(${120 - f * 120} 85% 55%)`;
      g.strokeStyle = col; g.lineWidth = 5; g.setLineDash([10, 7]); g.beginPath(); g.moveTo(mia.x, mia.y); g.lineTo(ex, ey); g.stroke(); g.setLineDash([]);
      g.fillStyle = col; g.beginPath(); g.moveTo(ex + Math.cos(a) * 14, ey + Math.sin(a) * 14); g.lineTo(ex + Math.cos(a + 2.5) * 12, ey + Math.sin(a + 2.5) * 12); g.lineTo(ex + Math.cos(a - 2.5) * 12, ey + Math.sin(a - 2.5) * 12); g.fill();
      g.fillStyle = '#fff'; g.font = '700 15px system-ui, sans-serif'; g.fillText(`${Math.round(f * 100)}%`, ex, ey - 16);
    }
    // scritte
    let scritta = '';
    if (ultimo.pausa) scritta = '⏸ In pausa';
    else if (ultimo.fase === 'via') scritta = `Buca ${ultimo.k + 1}: ${b.nome}`;
    else if (ultimo.fase === 'fineBuca') scritta = 'Buca finita!';
    if (scritta) {
      g.fillStyle = 'rgba(10,25,18,.6)'; g.fillRect(0, PB.H / 2 - 50, PB.W, 100);
      g.fillStyle = '#fff'; g.font = '400 44px "Young Serif", Georgia, serif'; g.textAlign = 'center'; g.fillText(scritta, PB.W / 2, PB.H / 2 + 14);
    }
  }
  (function ciclo() { try { disegna(); } catch (e) { /* un frame perso non ferma il gioco */ } requestAnimationFrame(ciclo); })();

  // ---------- tiro a fionda ----------
  function puoTirare() {
    const u = ultimo;
    if (!attiva() || !u || u.fase !== 'buca' || u.pausa || ctxA.partita.finita) return false;
    const q = u.palle[ctxA.mio];
    return q && !q.d && !q.m;
  }
  function aggiornaMira(e) {
    const r = tela.getBoundingClientRect();
    const dx = e.clientX - mira.x0, dy = e.clientY - mira.y0;
    mira.len = Math.hypot(dx, dy);
    mira.a = Math.atan2(-dy, -dx);
    mira.f = Math.min(1, mira.len / (r.width * 0.28));
  }
  document.addEventListener('pointerdown', (e) => {
    if (!tela || e.target !== tela || !puoTirare()) return;
    e.preventDefault();
    try { tela.setPointerCapture(e.pointerId); } catch {}
    mira = { x0: e.clientX, y0: e.clientY, len: 0, a: 0, f: 0, id: e.pointerId };
  });
  document.addEventListener('pointermove', (e) => { if (mira && e.pointerId === mira.id) aggiornaMira(e); });
  document.addEventListener('pointerup', (e) => {
    if (!mira || e.pointerId !== mira.id) return;
    aggiornaMira(e);
    const m = mira; mira = null;
    if (m.len < 12 || !puoTirare()) return;
    ctxA.emetti('input', { t: 'tiro', a: m.a, f: m.f });
    suono([[240 + m.f * 200, 0.05]], { tipo: 'triangle', volume: 0.08 });
  });
  document.addEventListener('pointercancel', () => { mira = null; });

  function tabellino(ctx) {
    const p = ctx.partita;
    const buche = p.ordine.map((i) => PB.BUCHE[i]);
    return `<div class="tabella-scorre"><table class="conti pt-tab"><thead><tr><th></th>${buche.map((b, k) => `<th class="${k === p.k && !p.finita ? 'ora' : ''}" title="${esc(b.nome)} · ${'★'.repeat(b.difficolta)}">${k + 1}</th>`).join('')}<th>Tot</th></tr>
      <tr class="par"><th>par</th>${buche.map((b) => `<td>${b.par}</td>`).join('')}<td>${buche.reduce((s, b) => s + b.par, 0)}</td></tr></thead>
      <tbody>${Array.from({ length: p.n }, (_, i) => `<tr class="${i === ctx.mio ? 'mia' : ''}"><th><i style="background:${p.colori[i % p.colori.length]}"></i>${esc(i === ctx.mio ? 'Tu' : ctx.nome(i))}</th>${buche.map((b, k) => { const c = p.colpi[i][k]; return `<td class="${c == null ? '' : c < b.par ? 'sotto' : c > b.par ? 'sopra' : ''}">${c == null ? '' : c}</td>`; }).join('')}<td><b>${p.totali[i]}</b></td></tr>`).join('')}</tbody></table></div>`;
  }

  const tavolo = {
    libero: true,
    senzaFila: true,
    reset(ctx) {
      ctxA = ctx;
      const d = ctx.partita.stato;
      if (!ultimo || ultimo.k !== d.k || ultimo.fase !== d.fase) { prima = null; ultimo = d; arrivo = performance.now(); primaArrivo = arrivo - 33; }
      if (!tela) { tela = document.createElement('canvas'); tela.className = 'pt-tela'; tela.setAttribute('aria-label', 'Campo da minigolf'); }
    },
    tick(ctx, d) {
      ctxA = ctx;
      prima = ultimo; ultimo = d; primaArrivo = arrivo; arrivo = performance.now();
      const mio = d.palle[ctx.mio];
      const info = document.querySelector('.pt-info');
      if (info && mio) info.innerHTML = d.fase === 'buca' ? `Colpi in questa buca: <b>${mio.c}</b>${mio.d ? ' · ⛳ in buca!' : mio.m ? '' : ' · tocca e trascina per tirare'} · ${Math.ceil(d.resta / 1000)} s` : '';
      if (mio && mio.d && prima && prima.palle[ctx.mio] && !prima.palle[ctx.mio].d && prima.k === d.k) suono([[660, 0.08], [880, 0.08], [1046, 0.15]], { volume: 0.09 });
    },
    panno(ctx) {
      const p = ctx.partita;
      const b = p.buca != null ? PB.BUCHE[p.buca] : null;
      return `<div class="pt">
        ${b ? `<p class="pa-round">Buca ${p.k + 1} di 9 · ${esc(b.nome)} · ${'★'.repeat(b.difficolta)}${'☆'.repeat(5 - b.difficolta)} · par ${b.par}</p>` : ''}
        <div class="pt-box"></div>
        <p class="pt-info piccolo"></p>
        ${tabellino(ctx)}
      </div>`;
    },
    dopo() { const box = document.querySelector('.pt-box'); if (box && tela && tela.parentElement !== box) box.append(tela); },
    stato(ctx) {
      const p = ctx.partita, u = ultimo || p.stato;
      if (p.finita) return null;
      if (u.pausa) return 'In pausa';
      if (u.fase === 'via') return 'Si parte…';
      if (u.fase === 'fineBuca') return 'Buca finita';
      const mio = u.palle[ctx.mio];
      return mio && mio.d ? 'In buca! Aspetta gli altri' : 'Tira quando vuoi';
    },
    punteggio(ctx) {
      const p = ctx.partita;
      return p.totali.map((x, i) => `<span>${esc(i === ctx.mio ? 'Tu' : ctx.nome(i))} <b>${x}</b></span>`).join('') + '<span class="obiettivo">vince chi fa meno colpi</span>';
    },
    infoPosto(ctx, posto) { return `${ctx.partita.totali[posto]} colpi`; },
    clic() {},
  };
  Object.assign(window.Tavoli, { putt: tavolo });
})();
