// GUESS THE ANGLE: il tavolo nel browser
(() => {
  const { esc, ritardo } = window.Nuovi;
  const COLORI = ['#ffd166', '#6aa8ff', '#ff7b6b', '#7fd1a8', '#c89bff', '#ffa94d', '#5fd0d0', '#f7a8d8'];
  const C = 160, R = 130;
  let ctxA = null;
  // punto sulla circonferenza: angoli in senso antiorario, come in matematica
  const punto = (gradi, r = R) => { const a = (gradi * Math.PI) / 180; return [C + r * Math.cos(a), C - r * Math.sin(a)]; };
  function arco(da, ampiezza, r, cls, st = '') {
    const [x1, y1] = punto(da, r), [x2, y2] = punto(da + ampiezza, r);
    return `<path class="${cls}" style="${st}" d="M${C} ${C} L${x1} ${y1} A${r} ${r} 0 ${ampiezza > 180 ? 1 : 0} 0 ${x2} ${y2} Z"/>`;
  }
  const lato = (gradi, cls, st = '') => { const [x, y] = punto(gradi); return `<line class="${cls}" style="${st}" x1="${C}" y1="${C}" x2="${x}" y2="${y}"/>`; };

  function disegno(ctx) {
    const p = ctx.partita, ui = ctx.ui;
    const rot = p.rotazione;
    let dentro = `<circle class="ag-quadrante" cx="${C}" cy="${C}" r="${R + 14}"/>`;
    const scoperto = p.fase !== 'stima';
    if (p.modo === 'indovina' || scoperto) {
      const st = scoperto ? ritardo(ui, `ang-${p.round}`) : '';
      dentro += arco(rot, p.disegno, 42, `ag-arco ${scoperto ? 'vero' : ''}`, st) + lato(rot, 'ag-lato') + lato(rot + p.disegno, 'ag-lato');
    }
    if (p.modo === 'costruisci' && !scoperto) {
      const g = ui.gradi ?? 0;
      dentro += arco(rot, g, 42, 'ag-arco mio') + lato(rot, 'ag-lato') + lato(rot + g, 'ag-lato mobile');
      const [hx, hy] = punto(rot + g);
      dentro += `<circle class="ag-maniglia" cx="${hx}" cy="${hy}" r="13"/>`;
    }
    if (scoperto && p.ultimo) {
      p.ultimo.esiti.forEach((e, i) => { if (e.gradi != null) dentro += lato(rot + e.gradi, 'ag-risposta', `--col:${COLORI[i % 8]};${ritardo(ui, `ang-${p.round}`)}`); });
      dentro += `<text class="ag-numero" x="${C}" y="${C + R + 6}" text-anchor="middle">${p.angolo}°</text>`;
    }
    dentro += `<circle class="ag-perno" cx="${C}" cy="${C}" r="6"/>`;
    return `<svg viewBox="0 0 320 330" class="ag-svg ${p.modo === 'costruisci' && !scoperto ? 'trascinabile' : ''}" role="img" aria-label="Angolo">${dentro}</svg>`;
  }

  const angolo = {
    libero: true,
    reset(ctx) { ctxA = ctx; window.NuoviTesto && window.NuoviTesto(ctx); if (ctx.ui.roundVisto !== ctx.partita.round) { ctx.ui.roundVisto = ctx.partita.round; ctx.ui.gradi = 0; ctx.ui.t_gradi = ''; } },
    panno(ctx) {
      const p = ctx.partita, ui = ctx.ui;
      const scoperto = p.fase !== 'stima';
      let comandi = '';
      if (!scoperto && !p.finita) {
        if (p.modo === 'indovina') {
          comandi = `<div class="ag-risposta-box"><label>Quanti gradi misura?</label>
            <div class="riga"><input type="number" min="0" max="${p.massimo}" inputmode="numeric" data-tieni="gradi" data-invio="stima" placeholder="gradi" value="${esc(ui.t_gradi || '')}">
            <button type="button" class="bottone primario-bt" data-az="stima">${p.miaRisposta != null ? 'Cambia' : 'Rispondi'}</button></div></div>`;
        } else {
          comandi = `<div class="ag-risposta-box"><p class="ag-obiettivo">Costruisci un angolo di <b>${p.angolo}°</b></p><p class="piccolo">Trascina il pallino (o usa ← →) per ruotare il lato.</p>
            <button type="button" class="bottone primario-bt" data-az="stima">${p.miaRisposta != null ? 'Cambia' : 'Conferma'}</button></div>`;
        }
        comandi += `<p class="piccolo">${p.miaRisposta != null ? `Hai risposto ${p.miaRisposta}°. ` : ''}${p.n > 1 ? `Pronti: ${p.pronti.filter(Boolean).length} su ${p.n}` : ''}</p>`;
      }
      let esito = '';
      if (scoperto && p.ultimo) {
        const righe = p.ultimo.esiti.map((e, i) => ({ e, i })).sort((a, b) => b.e.punti - a.e.punti)
          .map(({ e, i }) => `<li style="--col:${COLORI[i % 8]}"><span>${esc(i === ctx.mio ? 'Tu' : ctx.nome(i))}</span><span>${e.gradi == null ? '—' : `${e.gradi}°`}</span><span>${e.errore == null ? 'saltato' : `errore ${e.errore}°`}</span><b>+${e.punti}</b></li>`).join('');
        esito = `<ol class="ag-esiti">${righe}</ol>`;
      }
      return `<div class="ag"><p class="ag-round">Round ${p.round} di ${p.totaleRound} · angoli fino a ${p.massimo}°</p><div class="ag-svg-box">${disegno(ctx)}</div>${comandi}${esito}</div>`;
    },
    dopo(ctx) {
      const k = ctx.ui.fuoco;
      if (k && !(window.Boss && Boss.attivo)) { const el = document.querySelector(`[data-tieni="${k}"]`); if (el) el.focus({ preventScroll: true }); }
    },
    statoAttesa: (ctx) => `Era ${ctx.partita.angolo}°`,
    stato(ctx) {
      const p = ctx.partita;
      if (p.finita || p.fase !== 'stima') return null;
      return p.miaRisposta != null ? 'Aspetta gli altri' : p.modo === 'indovina' ? 'Stima l\'angolo' : 'Costruisci l\'angolo';
    },
    punteggio(ctx) { return ctx.partita.punti.map((x, i) => `<span>${esc(i === ctx.mio ? 'Tu' : ctx.nome(i))} <b>${x}</b></span>`).join(''); },
    infoPosto(ctx, posto) { const p = ctx.partita; return `${p.punti[posto]} punti${p.fase === 'stima' ? (p.pronti[posto] ? ' · ✓' : ' · pensa…') : ''}`; },
    clic(ctx, el) {
      if (el.dataset.az !== 'stima') return;
      const p = ctx.partita;
      const g = p.modo === 'indovina' ? Number((ctx.ui.t_gradi || '').trim()) : ctx.ui.gradi;
      if (p.modo === 'indovina' && !(ctx.ui.t_gradi || '').trim()) return ctx.avviso('Scrivi quanti gradi');
      ctx.invia({ tipo: 'stima', gradi: g });
    },
  };

  // trascinare il lato mobile nella variante "costruisci"
  let trascino = false;
  function daPuntatore(e) {
    const svg = document.querySelector('.ag-svg.trascinabile');
    if (!svg || !ctxA) return;
    const r = svg.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 320 - C, y = ((e.clientY - r.top) / r.height) * 330 - C;
    let g = (Math.atan2(-y, x) * 180) / Math.PI - ctxA.partita.rotazione;
    g = ((g % 360) + 360) % 360;
    if (ctxA.partita.massimo === 180 && g > 180) g = g > 270 ? 0 : 180;
    ctxA.ui.gradi = Math.round(g);
    ctxA.ridisegna();
  }
  document.addEventListener('pointerdown', (e) => { if (e.target.closest && e.target.closest('.ag-svg.trascinabile')) { trascino = true; e.preventDefault(); daPuntatore(e); } });
  document.addEventListener('pointermove', (e) => { if (trascino) daPuntatore(e); });
  document.addEventListener('pointerup', () => { trascino = false; });
  document.addEventListener('keydown', (e) => {
    const p = ctxA && ctxA.stato && ctxA.partita;
    if (!p || p.gioco !== 'angolo' || p.modo !== 'costruisci' || p.fase !== 'stima' || !['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    e.preventDefault();
    ctxA.ui.gradi = Math.max(0, Math.min(p.massimo, (ctxA.ui.gradi || 0) + (e.key === 'ArrowLeft' ? 1 : -1) * (e.shiftKey ? 10 : 1)));
    ctxA.ridisegna();
  });

  Object.assign(window.Tavoli, { angolo });
})();
