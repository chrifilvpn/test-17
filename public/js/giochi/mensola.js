// OGGETTI SULLA MENSOLA: oggetti disegnati in SVG su una mensola di legno.
(() => {
  const { esc, primaVolta, suono } = window.Nuovi;
  const L = '#2b2230';
  const O = {
    tazza: '<path d="M22 40 h40 v26 a14 14 0 0 1 -14 14 h-12 a14 14 0 0 1 -14 -14z" fill="#e85d5d" stroke="#2b2230" stroke-width="3"/><path d="M62 46 a10 10 0 0 1 0 20" fill="none" stroke="#2b2230" stroke-width="5"/><path d="M34 30 q4 -6 0 -12 M46 30 q4 -6 0 -12" fill="none" stroke="#bbb" stroke-width="3" stroke-linecap="round"/>',
    libro: '<rect x="24" y="22" width="44" height="60" rx="4" fill="#3f7fd0" stroke="#2b2230" stroke-width="3"/><rect x="30" y="22" width="6" height="60" fill="#2c5da0"/><rect x="42" y="34" width="20" height="8" rx="2" fill="#f7e7a8"/>',
    vaso: '<path d="M36 22 h20 v8 c14 8 16 22 12 36 c-2 10 -8 16 -22 16 c-14 0 -20 -6 -22 -16 c-4 -14 -2 -28 12 -36z" fill="#4db6ac" stroke="#2b2230" stroke-width="3"/><path d="M28 54 h36" stroke="#2b8c83" stroke-width="4"/>',
    lampada: '<path d="M28 44 l10 -26 h16 l10 26z" fill="#f6c431" stroke="#2b2230" stroke-width="3" stroke-linejoin="round"/><rect x="44" y="44" width="4" height="26" fill="#2b2230"/><rect x="30" y="70" width="32" height="8" rx="3" fill="#8a5a35" stroke="#2b2230" stroke-width="2"/>',
    sveglia: '<circle cx="46" cy="52" r="24" fill="#f7f0de" stroke="#2b2230" stroke-width="4"/><circle cx="28" cy="28" r="7" fill="#e85d5d" stroke="#2b2230" stroke-width="2.5"/><circle cx="64" cy="28" r="7" fill="#e85d5d" stroke="#2b2230" stroke-width="2.5"/><path d="M46 52 v-14 M46 52 l10 6" stroke="#2b2230" stroke-width="3.5" stroke-linecap="round"/><path d="M32 76 l-5 6 M60 76 l5 6" stroke="#2b2230" stroke-width="4" stroke-linecap="round"/>',
    pianta: '<path d="M30 60 h32 l-4 22 h-24z" fill="#d1662a" stroke="#2b2230" stroke-width="3" stroke-linejoin="round"/><path d="M46 60 c-2 -14 -14 -20 -20 -18 c0 10 10 18 20 18 M46 60 c2 -18 12 -28 20 -26 c0 12 -10 24 -20 26 M46 60 v-28" fill="#4caf50" stroke="#2b6b2e" stroke-width="2.5"/>',
    candela: '<rect x="36" y="38" width="20" height="44" rx="3" fill="#f3e5f5" stroke="#2b2230" stroke-width="3"/><path d="M46 38 v-6" stroke="#2b2230" stroke-width="2"/><path d="M46 14 c6 8 6 14 0 18 c-6 -4 -6 -10 0 -18z" fill="#ff9f43" stroke="#e8661a" stroke-width="2"/>',
    palla: '<circle cx="46" cy="54" r="26" fill="#fff" stroke="#2b2230" stroke-width="3"/><path d="M46 28 v52 M20 54 h52" stroke="#e85d5d" stroke-width="5"/><path d="M28 36 q18 18 36 0 M28 72 q18 -18 36 0" fill="none" stroke="#3f7fd0" stroke-width="4"/>',
    cubo: '<path d="M22 38 l24 -12 l24 12 v28 l-24 12 l-24 -12z" fill="#8e55c9" stroke="#2b2230" stroke-width="3" stroke-linejoin="round"/><path d="M22 38 l24 12 l24 -12 M46 50 v28" fill="none" stroke="#2b2230" stroke-width="3"/><path d="M46 50 l24 -12 v28 l-24 12z" fill="#6d3aa5"/>',
    bottiglia: '<path d="M40 14 h12 v14 c10 6 12 14 12 22 v28 a4 4 0 0 1 -4 4 h-28 a4 4 0 0 1 -4 -4 v-28 c0 -8 2 -16 12 -22z" fill="#66bb6a" stroke="#2b2230" stroke-width="3"/><rect x="30" y="52" width="32" height="16" fill="#fff8e1"/><rect x="39" y="10" width="14" height="6" rx="2" fill="#8a5a35"/>',
    cornice: '<rect x="20" y="20" width="52" height="62" rx="3" fill="#c8741f" stroke="#2b2230" stroke-width="3"/><rect x="28" y="28" width="36" height="46" fill="#bfe3ff"/><circle cx="46" cy="44" r="7" fill="#f6c431"/><path d="M28 74 l12 -14 l8 8 l6 -6 l10 12z" fill="#4caf50"/>',
    orsetto: '<circle cx="32" cy="30" r="8" fill="#b07a4a" stroke="#2b2230" stroke-width="2.5"/><circle cx="60" cy="30" r="8" fill="#b07a4a" stroke="#2b2230" stroke-width="2.5"/><circle cx="46" cy="42" r="18" fill="#b07a4a" stroke="#2b2230" stroke-width="3"/><ellipse cx="46" cy="70" rx="18" ry="14" fill="#b07a4a" stroke="#2b2230" stroke-width="3"/><circle cx="40" cy="40" r="2.5" fill="#2b2230"/><circle cx="52" cy="40" r="2.5" fill="#2b2230"/><ellipse cx="46" cy="48" rx="5" ry="3.5" fill="#2b2230"/>',
    mela: '<path d="M46 34 c-10 -8 -26 -4 -26 16 c0 18 12 32 26 28 c14 4 26 -10 26 -28 c0 -20 -16 -24 -26 -16z" fill="#e53935" stroke="#2b2230" stroke-width="3"/><path d="M46 34 c0 -8 2 -14 6 -18" stroke="#6b3a1f" stroke-width="3.5" fill="none"/><path d="M50 22 c8 -6 16 -2 16 2 c-6 4 -12 4 -16 -2z" fill="#4caf50"/>',
    chiave: '<circle cx="32" cy="50" r="14" fill="#f6c431" stroke="#2b2230" stroke-width="3"/><circle cx="32" cy="50" r="5" fill="#fff"/><path d="M46 50 h30 v10 M64 50 v8" fill="none" stroke="#2b2230" stroke-width="5" stroke-linecap="round"/>',
    ombrello: '<path d="M16 50 a30 30 0 0 1 60 0 q-5 -6 -10 0 q-5 -6 -10 0 q-5 -6 -10 0 q-5 -6 -10 0 q-5 -6 -10 0 q-5 -6 -10 0z" fill="#e85d5d" stroke="#2b2230" stroke-width="3" stroke-linejoin="round"/><path d="M46 20 v52 a6 6 0 0 1 -12 0" fill="none" stroke="#2b2230" stroke-width="4" stroke-linecap="round"/>',
    cappello: '<ellipse cx="46" cy="70" rx="34" ry="8" fill="#3b3b52" stroke="#2b2230" stroke-width="3"/><path d="M28 70 v-36 a18 6 0 0 1 36 0 v36z" fill="#4a4a66" stroke="#2b2230" stroke-width="3"/><rect x="28" y="58" width="36" height="7" fill="#e85d5d"/>',
    scarpa: '<path d="M16 70 v-14 c8 0 14 -4 16 -14 h14 c2 10 14 14 30 18 c6 2 6 10 0 10z" fill="#8a5a35" stroke="#2b2230" stroke-width="3" stroke-linejoin="round"/><path d="M16 70 h60" stroke="#2b2230" stroke-width="5"/><path d="M36 48 l6 4 M40 44 l6 4" stroke="#f7f0de" stroke-width="2.5"/>',
    pesce: '<circle cx="46" cy="52" r="28" fill="#bfe3ff" fill-opacity=".7" stroke="#2b2230" stroke-width="3"/><path d="M32 54 c8 -10 20 -10 26 0 c-6 10 -18 10 -26 0z M58 54 l10 -7 v14z" fill="#ff9f43" stroke="#2b2230" stroke-width="2"/><circle cx="38" cy="52" r="2" fill="#2b2230"/><path d="M22 70 h48" stroke="#4db6ac" stroke-width="4"/>',
    telefono: '<rect x="30" y="16" width="32" height="64" rx="7" fill="#2b2230"/><rect x="34" y="24" width="24" height="44" rx="2" fill="#5fd3ff"/><circle cx="46" cy="74" r="3" fill="#888"/>',
    dado: '<rect x="22" y="28" width="48" height="48" rx="9" fill="#fff" stroke="#2b2230" stroke-width="3"/><circle cx="34" cy="40" r="4.5" fill="#e85d5d"/><circle cx="46" cy="52" r="4.5" fill="#e85d5d"/><circle cx="58" cy="64" r="4.5" fill="#e85d5d"/>',
    fiore: '<path d="M46 50 v30" stroke="#2b6b2e" stroke-width="4"/><path d="M46 70 c-10 -2 -14 -8 -14 -12 c8 0 12 4 14 12z" fill="#4caf50"/>' + [0, 72, 144, 216, 288].map((a) => `<ellipse cx="46" cy="30" rx="7" ry="12" fill="#f06292" stroke="#2b2230" stroke-width="2" transform="rotate(${a} 46 42)"/>`).join('') + '<circle cx="46" cy="42" r="7" fill="#f6c431" stroke="#2b2230" stroke-width="2"/>',
    teiera: '<ellipse cx="44" cy="58" rx="24" ry="20" fill="#f7f0de" stroke="#2b2230" stroke-width="3"/><path d="M68 52 c10 -4 14 -12 12 -18 c-8 2 -10 10 -14 12" fill="#f7f0de" stroke="#2b2230" stroke-width="3"/><path d="M20 50 c-10 2 -10 18 2 18" fill="none" stroke="#2b2230" stroke-width="4"/><rect x="36" y="34" width="16" height="6" rx="2" fill="#3f7fd0" stroke="#2b2230" stroke-width="2"/><circle cx="44" cy="31" r="3" fill="#3f7fd0"/><path d="M26 60 h36" stroke="#3f7fd0" stroke-width="4"/>',
  };
  const NOMI = { tazza: 'Tazza', libro: 'Libro', vaso: 'Vaso', lampada: 'Lampada', sveglia: 'Sveglia', pianta: 'Pianta', candela: 'Candela', palla: 'Palla', cubo: 'Cubo', bottiglia: 'Bottiglia', cornice: 'Cornice', orsetto: 'Orsetto', mela: 'Mela', teiera: 'Teiera',
    chiave: 'Chiave', ombrello: 'Ombrello', cappello: 'Cappello', scarpa: 'Scarpa', pesce: 'Pesciolino', telefono: 'Telefono', dado: 'Dado', fiore: 'Fiore' };
  const ogg = (o, cls = '', attr = '') => `<span class="ms-ogg ${cls}" ${attr} title="${NOMI[o] || ''}"><svg viewBox="0 0 92 92" aria-hidden="true">${O[o] || ''}</svg><small>${NOMI[o] || ''}</small></span>`;
  const vuoto = (i) => `<span class="ms-ogg vuoto" data-az="togli" data-i="${i}"><b>${i + 1}</b></span>`;
  // lo scaffale: gli oggetti (in ordine) divisi sui ripiani, dall'alto in basso
  let pianiOra = [5];
  const mensola = (dentro, cls = '', piani = pianiOra) => {
    const pezzi = Array.isArray(dentro) ? dentro : null;
    if (!pezzi) return `<div class="ms-scaffale"><div class="ms-mensola ${cls}"><div class="ms-fila">${dentro}</div><div class="ms-asse"></div></div></div>`;
    let i = 0;
    return `<div class="ms-scaffale">${piani.map((q, r) => { const fila = pezzi.slice(i, i + q).join(''); i += q; return `<div class="ms-mensola ${cls}" data-piano="${r + 1}"><div class="ms-fila">${fila}</div><div class="ms-asse"></div></div>`; }).join('')}</div>`;
  };

  const tavolo = {
    libero: true,
    panno(ctx) {
      const p = ctx.partita, ui = ctx.ui;
      pianiOra = p.piani || [p.k];
      const chiaveRound = `${p.round}`;
      if (ui._msRound !== chiaveRound) { ui._msRound = chiaveRound; ui.ordine = []; }
      let scena = '', msg = '';
      if (p.fase === 'guarda') {
        scena = mensola(p.mensola.map((o) => ogg(o)));
        msg = `Guarda bene! ${p.modo === 'ordine' ? 'Ricorda l\'ordine degli oggetti' : 'Ricorda com\'è la mensola'} <span class="ms-conto" data-fine="${Date.now() + p.restaMs}"></span>`;
      } else if (p.fase === 'buio') {
        scena = mensola(Array.from({ length: p.k }, () => '<span class="ms-ogg ombra"></span>'), 'buia') + '<p class="ms-buio">💡 click…</p>';
        msg = 'Luce spenta…';
      } else if (p.fase === 'rispondi' && p.modo === 'ordine') {
        const messi = ui.ordine;
        const slot = Array.from({ length: p.k }, (_, i) => (messi[i] ? ogg(messi[i], 'messo', `data-az="togli" data-i="${i}" role="button" tabindex="0"`) : vuoto(i)));
        const sotto = p.mescolati.filter((o) => !messi.includes(o)).map((o) => ogg(o, 'da-mettere', `data-az="metti" data-o="${o}" role="button" tabindex="0"`)).join('');
        scena = p.risposto ? mensola(p.mia.map((o) => ogg(o))) + '<p class="piccolo">Risposta inviata: si aspettano gli altri</p>'
          : `${mensola(slot)}<div class="ms-mucchio">${sotto || '<span class="piccolo">Tutti sulla mensola: conferma!</span>'}</div>`;
        msg = p.risposto ? '' : 'Tocca gli oggetti nell\'ordine in cui erano: ripiano per ripiano, dall\'alto, da sinistra a destra';
      } else if (p.fase === 'rispondi') {
        scena = p.risposto ? mensola(p.dopo.map((o, i) => ogg(o, i === p.mia ? 'scelto' : ''))) + '<p class="piccolo">Risposta inviata: si aspettano gli altri</p>'
          : mensola(p.dopo.map((o, i) => ogg(o, 'cliccabile', `data-az="cambiato" data-i="${i}" role="button" tabindex="0"`)));
        msg = p.risposto ? '' : 'Cosa è cambiato? Tocca l\'oggetto';
      } else {
        // esito
        if (p.modo === 'ordine') {
          const mia = p.mia || [];
          scena = `<p class="piccolo">Com'era:</p>${mensola(p.mensola.map((o) => ogg(o)))}<p class="piccolo">La tua risposta:</p>${mensola(p.mensola.map((o, i) => (mia[i] ? ogg(mia[i], mia[i] === o ? 'giusto' : 'sbagliato') : vuoto(i))))}`;
        } else {
          const c = p.cambio;
          scena = `<p class="piccolo">Prima:</p>${mensola(p.mensola.map((o, i) => ogg(o, c.posti.includes(i) ? 'evidenzia' : '')))}<p class="piccolo">Dopo (${c.tipo === 'sostituito' ? 'un oggetto sostituito' : 'due oggetti scambiati'}):</p>${mensola(p.dopo.map((o, i) => ogg(o, `${c.posti.includes(i) ? 'evidenzia' : ''} ${i === p.mia ? (c.posti.includes(i) ? 'giusto' : 'sbagliato') : ''}`)))}`;
        }
        const pt = p.ultimiPunti ? p.ultimiPunti[ctx.mio] : 0;
        msg = `Round ${p.round}: ${pt} ${pt === 1 ? 'punto' : 'punti'} per te`;
      }
      return `<div class="ms"><p class="pa-round">Round ${p.round} di ${p.nRound} · ${p.k} oggetti su ${pianiOra.length} ${pianiOra.length === 1 ? 'ripiano' : 'ripiani'} · ${p.modo === 'ordine' ? 'Rimetti in ordine' : 'Cosa è cambiato?'}</p>
        <div class="ms-scena">${scena}</div><p class="pa-msg" aria-live="polite">${msg}</p></div>`;
    },
    azioni(ctx) {
      const p = ctx.partita;
      if (p.fase !== 'rispondi' || p.risposto || p.modo !== 'ordine') return '';
      const n = ctx.ui.ordine.length;
      return `<button type="button" class="bottone" data-az="svuota" ${n ? '' : 'disabled'}>Ricomincia</button><button type="button" class="bottone primario" data-az="conferma" ${n === p.k ? '' : 'disabled'}>Conferma (${n}/${p.k})</button>`;
    },
    dopo(ctx) {
      clearInterval(ctx.ui._msT);
      const el = document.querySelector('.ms-conto');
      if (el) { const f = Number(el.dataset.fine); const a = () => { const x = document.querySelector('.ms-conto'); if (!x) return clearInterval(ctx.ui._msT); x.textContent = `${Math.max(0, Math.ceil((f - Date.now()) / 1000))} s`; }; a(); ctx.ui._msT = setInterval(a, 250); }
      const p = ctx.partita;
      if (p.fase === 'esito' && primaVolta(ctx.ui, `ms-${p.round}`)) suono((p.ultimiPunti[ctx.mio] || 0) > 0 ? [[523, 0.08], [784, 0.15]] : [[220, 0.2]], { volume: 0.07 });
    },
    statoAttesa: () => 'Soluzione',
    stato(ctx) { const p = ctx.partita; if (p.finita) return null; return { guarda: 'Guarda e ricorda!', buio: 'Luce spenta…', rispondi: p.risposto ? 'Aspetti gli altri' : 'Rispondi!', esito: 'Soluzione' }[p.fase]; },
    punteggio(ctx) { const p = ctx.partita; return p.punti.map((x, i) => `<span>${esc(i === ctx.mio ? 'Tu' : ctx.nome(i))} <b>${x}</b></span>`).join(''); },
    infoPosto(ctx, posto) { const p = ctx.partita; return `${p.punti[posto]} punti${p.fase === 'rispondi' ? (p.pronti[posto] ? ' · ✓' : ' · …') : ''}`; },
    clic(ctx, el) {
      const ui = ctx.ui, p = ctx.partita, az = el.dataset.az;
      if (az === 'metti' && ui.ordine.length < p.k) { ui.ordine.push(el.dataset.o); suono([[600 + ui.ordine.length * 40, 0.04]], { volume: 0.04 }); return ctx.ridisegna(); }
      if (az === 'togli') { const i = Number(el.dataset.i); if (ui.ordine[i]) { ui.ordine.splice(i, 1); ctx.ridisegna(); } return; }
      if (az === 'svuota') { ui.ordine = []; return ctx.ridisegna(); }
      if (az === 'conferma') return ctx.invia({ tipo: 'ordine', ordine: ui.ordine });
      if (az === 'cambiato') return ctx.invia({ tipo: 'cambiato', posto: Number(el.dataset.i) });
    },
  };
  Object.assign(window.Tavoli, { mensola: tavolo });
})();
