// NUMERI COPERTI: una fila di carte coperte; sotto la casella da indovinare si vedono i tentativi sbagliati.
(() => {
  const { esc, primaVolta, suono } = window.Nuovi;
  const tavolo = {
    libero: true,
    panno(ctx) {
      const p = ctx.partita;
      const mio = p.turno === ctx.mio && !p.finita;
      const caselle = p.scoperti.map((x, i) => {
        const cls = ['nc-casella', x !== null ? 'scoperta' : '', i === p.pos && !p.finita ? 'ora' : '', p.ultimo && p.ultimo.giusto && p.ultimo.pos === i ? 'appena' : ''].join(' ');
        const chi = p.chi[i] !== null ? `<small>${esc(p.chi[i] === ctx.mio ? 'tu' : ctx.nome(p.chi[i]))}</small>` : '';
        const sb = p.sbagliati[i].map((s) => `<span class="nc-no" title="${esc(s.posto === ctx.mio ? 'tu' : ctx.nome(s.posto))}">${s.numero}</span>`).join('');
        return `<div class="nc-colonna"><div class="${cls}"><b>${x !== null ? x : '?'}</b>${chi}</div><div class="nc-sbagliati">${sb}</div></div>`;
      }).join('');
      let msg;
      if (p.finita) msg = 'Tutti i numeri sono scoperti!';
      else if (mio) msg = `Tocca a te: che numero c'è nella casella ${p.pos + 1}?`;
      else msg = `Tocca a ${esc(ctx.nome(p.turno))}`;
      return `<div class="nc">
        <div class="nc-fila">${caselle}</div>
        <p class="pa-msg" aria-live="polite">${msg}</p>
        <p class="pa-info">I numeri barrati sotto una casella sono già stati provati lì${p.diversi ? '; i numeri sono tutti diversi' : '; i numeri si possono ripetere'}</p>
      </div>`;
    },
    azioni(ctx) {
      const p = ctx.partita;
      if (p.turno !== ctx.mio || p.finita) return '';
      const vietati = new Set(p.sbagliati[p.pos].map((s) => s.numero));
      return `<div class="nc-tasti">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((x) => `<button type="button" class="bottone nc-tasto" data-az="prova" data-n="${x}" ${vietati.has(x) ? 'disabled' : ''}>${x}</button>`).join('')}</div>`;
    },
    dopo(ctx) {
      const p = ctx.partita;
      if (p.ultimo && primaVolta(ctx.ui, `nc-${p.ultimo.pos}-${p.ultimo.numero}`)) suono(p.ultimo.giusto ? [[660, 0.06], [990, 0.12]] : [[220, 0.12]], { volume: 0.06 });
    },
    stato(ctx) { const p = ctx.partita; if (p.finita || p.turno == null) return null; return p.turno === ctx.mio ? 'Tocca a te: scegli un numero' : `Tocca a ${ctx.nome(p.turno)}`; },
    punteggio(ctx) { const p = ctx.partita; return p.punti.map((x, i) => `<span>${esc(i === ctx.mio ? 'Tu' : ctx.nome(i))} <b>${x}</b></span>`).join('') + `<span class="obiettivo">${p.quanti} numeri</span>`; },
    infoPosto(ctx, posto) { return `${ctx.partita.punti[posto]} indovinati`; },
    clic(ctx, el) { if (el.dataset.az === 'prova') ctx.invia({ tipo: 'prova', numero: Number(el.dataset.n) }); },
  };
  Object.assign(window.Tavoli, { coperti: tavolo });
})();
