// TROVA LE DIFFERENZE: quattro disegni in SVG, costruiti dagli oggetti descritti dal server.
(() => {
  const { esc, suono, primaVolta } = window.Nuovi;
  const L = '#2b2230';
  const DIS = {
    casa: (c) => `<rect x="-40" y="-10" width="80" height="55" fill="${c}" stroke="${L}" stroke-width="4"/><path d="M-50 -8 L0 -50 L50 -8Z" fill="#b5413a" stroke="${L}" stroke-width="4"/><rect x="18" y="-48" width="12" height="22" fill="#8b5a2b" stroke="${L}" stroke-width="3"/><rect x="-10" y="15" width="20" height="30" fill="#8b5a2b" stroke="${L}" stroke-width="3"/><rect x="-32" y="2" width="16" height="14" fill="#bfe3ff" stroke="${L}" stroke-width="3"/>`,
    albero: (c) => `<rect x="-8" y="10" width="16" height="40" fill="#8b5a2b" stroke="${L}" stroke-width="3"/><circle cy="-10" r="34" fill="${c === '#ffffff' ? '#2e9d57' : c}" stroke="${L}" stroke-width="4"/><circle cx="-12" cy="-18" r="6" fill="rgba(255,255,255,.35)"/>`,
    sole: (c) => `${Array.from({ length: 10 }, (_, k) => `<path d="M0 -48 L6 -34 L-6 -34Z" fill="${c}" transform="rotate(${k * 36})"/>`).join('')}<circle r="30" fill="${c}" stroke="${L}" stroke-width="3"/>`,
    nuvola: (c) => `<g fill="${c === '#2b2230' ? '#fff' : c}" stroke="${L}" stroke-width="3" opacity=".95"><circle cx="-22" cy="6" r="20"/><circle cx="4" cy="-8" r="26"/><circle cx="28" cy="8" r="18"/><rect x="-40" y="6" width="84" height="20" rx="10" stroke="none"/></g>`,
    fiore: (c) => `<path d="M0 10 V50" stroke="#2e7d32" stroke-width="5"/>${[0, 72, 144, 216, 288].map((a) => `<ellipse cy="-20" rx="10" ry="18" fill="${c}" stroke="${L}" stroke-width="2.5" transform="rotate(${a})"/>`).join('')}<circle r="10" fill="#f6c431" stroke="${L}" stroke-width="2.5"/>`,
    uccello: (c) => `<path d="M-30 0 Q-10 -30 0 -5 Q10 -30 30 0" fill="none" stroke="${c === '#ffffff' ? L : c}" stroke-width="7" stroke-linecap="round"/><circle cx="18" cy="-4" r="4" fill="${L}"/>`,
    palla: (c) => `<circle r="32" fill="${c}" stroke="${L}" stroke-width="4"/><path d="M-32 0 H32 M0 -32 V32" stroke="#fff" stroke-width="4"/>`,
    stella: (c) => `<path d="M0 -40 L11 -12 L40 -12 L17 6 L26 36 L0 18 L-26 36 L-17 6 L-40 -12 L-11 -12Z" fill="${c}" stroke="${L}" stroke-width="4" stroke-linejoin="round"/>`,
    barca: (c) => `<path d="M-45 10 H45 L30 38 H-30Z" fill="${c}" stroke="${L}" stroke-width="4"/><path d="M0 8 V-45 L32 0Z" fill="#fff" stroke="${L}" stroke-width="3"/><path d="M0 -45 V8" stroke="${L}" stroke-width="4"/>`,
    montagna: (c) => `<path d="M-55 40 L-10 -40 L10 -10 L25 -30 L60 40Z" fill="${c === '#ffffff' ? '#8a8f99' : c}" stroke="${L}" stroke-width="4" stroke-linejoin="round"/><path d="M-22 -18 L-10 -40 L2 -18 L-6 -22 L-12 -14Z" fill="#fff"/>`,
    fungo: (c) => `<rect x="-12" y="0" width="24" height="36" rx="6" fill="#f5ecd6" stroke="${L}" stroke-width="3"/><path d="M-42 4 Q0 -60 42 4Z" fill="${c}" stroke="${L}" stroke-width="4"/><circle cx="-14" cy="-14" r="6" fill="#fff"/><circle cx="12" cy="-20" r="5" fill="#fff"/>`,
    aquilone: (c) => `<path d="M0 -40 L28 0 L0 40 L-28 0Z" fill="${c}" stroke="${L}" stroke-width="4"/><path d="M0 -40 V40 M-28 0 H28" stroke="${L}" stroke-width="2"/><path d="M0 40 Q-10 55 6 62 Q-6 72 10 80" fill="none" stroke="${L}" stroke-width="2.5"/><path d="M-4 55 l8 -4 M2 68 l8 -3" stroke="#e8453c" stroke-width="4"/>`,
  };
  function disegno(sc, cls = '', attr = '') {
    const ogg = sc.ogg.map((o) => `<g transform="translate(${o.x * 4} ${o.y * 3}) scale(${(o.s / 30) * (o.g ? -1 : 1)} ${o.s / 30})">${DIS[o.tipo](o.c)}</g>`).join('');
    return `<svg class="df-img ${cls}" viewBox="0 0 400 300" ${attr}><rect width="400" height="300" fill="${sc.cielo}"/><path d="M0 190 Q100 170 200 188 T400 184 V300 H0Z" fill="${sc.prato}"/>${ogg}</svg>`;
  }
  const NOMI_CAMBIO = { colore: 'un oggetto ha cambiato colore', manca: 'mancava un oggetto', sposta: 'un oggetto era spostato', grande: 'un oggetto era più grande', gira: 'un oggetto era girato al contrario', extra: 'c\'era un oggetto in più' };
  const tavolo = {
    libero: true,
    panno(ctx) {
      const p = ctx.partita;
      let griglia = '', msg = '';
      if (p.fase === 'guarda') {
        griglia = p.immagini.map((sc, i) => `<figure class="df-fig">${disegno(sc)}<figcaption>${i + 1}</figcaption></figure>`).join('');
        msg = `Guarda bene: uno è diverso! <span class="df-conto" data-fine="${Date.now() + p.restaMs}"></span>`;
      } else if (p.fase === 'scegli') {
        griglia = [0, 1, 2, 3].map((i) => `<button type="button" class="df-fig df-scelta ${p.mia === i ? 'scelto' : ''}" ${p.risposto ? 'disabled' : `data-az="scegli" data-i="${i}"`}><span>${i + 1}</span></button>`).join('');
        msg = p.risposto ? 'Risposta data: si aspettano gli altri' : `Quale era diverso? <span class="df-conto" data-fine="${Date.now() + p.restaMs}"></span>`;
      } else {
        griglia = p.immagini.map((sc, i) => `<figure class="df-fig ${i === p.diversa ? 'giusta' : ''} ${p.mia === i && i !== p.diversa ? 'sbagliata' : ''}">${disegno(sc)}<figcaption>${i + 1}${i === p.diversa ? ' · diverso!' : ''}</figcaption></figure>`).join('');
        const pt = p.ultimi ? p.ultimi[ctx.mio] : 0;
        msg = `Era il ${p.diversa + 1}: ${NOMI_CAMBIO[p.cambio]}. ${pt ? `+${pt} punti per te!` : p.mia === null ? 'Non hai risposto.' : 'Peccato!'}`;
      }
      return `<div class="df"><p class="pa-round">Round ${p.round} di ${p.nRound}</p><div class="df-griglia">${griglia}</div><p class="pa-msg" aria-live="polite">${msg}</p></div>`;
    },
    dopo(ctx) {
      clearInterval(ctx.ui._dfT);
      const el = document.querySelector('.df-conto');
      if (el) { const f = Number(el.dataset.fine); const a = () => { const x = document.querySelector('.df-conto'); if (!x) return clearInterval(ctx.ui._dfT); x.textContent = `${Math.max(0, Math.ceil((f - Date.now()) / 1000))} s`; }; a(); ctx.ui._dfT = setInterval(a, 200); }
      const p = ctx.partita;
      if (p.fase === 'esito' && primaVolta(ctx.ui, `df-${p.round}`)) suono((p.ultimi && p.ultimi[ctx.mio]) ? [[523, 0.08], [784, 0.15]] : [[200, 0.2]], { volume: 0.07 });
    },
    statoAttesa: () => 'Soluzione',
    stato(ctx) { const p = ctx.partita; if (p.finita) return null; return { guarda: 'Guarda bene!', scegli: p.risposto ? 'Aspetti gli altri' : 'Quale era diverso?', esito: 'Soluzione' }[p.fase]; },
    punteggio(ctx) { const p = ctx.partita; return p.punti.map((x, i) => `<span>${esc(i === ctx.mio ? 'Tu' : ctx.nome(i))} <b>${x}</b></span>`).join(''); },
    infoPosto(ctx, posto) { const p = ctx.partita; return `${p.punti[posto]} punti${p.fase === 'scegli' ? (p.pronti[posto] ? ' · ✓' : ' · …') : ''}`; },
    clic(ctx, el) { if (el.dataset.az === 'scegli') ctx.invia({ tipo: 'scegli', quale: Number(el.dataset.i) }); },
  };
  Object.assign(window.Tavoli, { differenze: tavolo });
})();
