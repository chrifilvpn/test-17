// POMPA IL PALLONE: il pallone (SVG) si gonfia a ogni pompata e trema quando è grosso; se scoppia, coriandoli.
(() => {
  const { esc, ritardo, primaVolta, suono } = window.Nuovi;
  const COLORI = ['#e8453c', '#2f7fd8', '#2e9d57', '#d19a2a', '#8e55c9', '#e36fa5', '#1fa3a3', '#e07b2c'];

  function pallone(ctx) {
    const p = ctx.partita;
    const scoppiato = p.scoppiato !== null && p.fase !== 'gioco';
    // la grandezza cresce con le pompate (non dice nulla del punto di scoppio: è solo in proporzione al massimo)
    const f = Math.min(1, p.pompate / p.massimo);
    const r = 46 + f * 84;
    const cy = 190 - r * 0.25;
    const colore = COLORI[(p.nRound - 1) % COLORI.length];
    const trema = !scoppiato && f > 0.35 ? `trema ${f > 0.65 ? 'forte' : ''}` : '';
    if (scoppiato) {
      const pezzi = Array.from({ length: 18 }, (_, k) => {
        const a = (k / 18) * Math.PI * 2, d = 90 + (k % 3) * 30;
        return `<path class="pa-pezzo" style="--dx:${(Math.cos(a) * d).toFixed(0)}px;--dy:${(Math.sin(a) * d).toFixed(0)}px;--r:${k * 47}deg;fill:${k % 2 ? colore : '#fff6d8'}" d="M200 160 l10 -4 l-3 12 z"/>`;
      }).join('');
      return `<svg viewBox="0 0 400 360" class="pa-svg scoppiato" style="${ritardo(ctx.ui, `scoppio-${p.nRound}`)}" role="img" aria-label="Il pallone è scoppiato">
        <text x="200" y="175" text-anchor="middle" class="pa-bum">BUM!</text>${pezzi}
        <path class="pa-straccio" style="fill:${colore}" d="M188 300 q12 -18 24 0 q-6 10 -12 6 q-6 6 -12 -6z"/>
        <path class="pa-pompa-tubo" d="M200 306 C200 340 290 340 328 334"/>${pompa()}</svg>`;
    }
    return `<svg viewBox="0 0 400 360" class="pa-svg" role="img" aria-label="Pallone con ${p.pompate} pompate">
      <g class="pa-pallone ${trema}">
        <ellipse cx="200" cy="${cy.toFixed(1)}" rx="${(r * 0.92).toFixed(1)}" ry="${r.toFixed(1)}" style="fill:${colore}"/>
        <ellipse cx="${(200 - r * 0.35).toFixed(1)}" cy="${(cy - r * 0.45).toFixed(1)}" rx="${(r * 0.18).toFixed(1)}" ry="${(r * 0.3).toFixed(1)}" class="pa-luce" transform="rotate(-25 ${(200 - r * 0.35).toFixed(1)} ${(cy - r * 0.45).toFixed(1)})"/>
        <path d="M193 ${(cy + r - 1).toFixed(1)} l7 12 l7 -12 z" style="fill:${colore}"/>
      </g>
      <path class="pa-pompa-tubo" d="M200 ${(cy + r + 11).toFixed(1)} C200 340 290 340 328 334"/>
      ${pompa(p.ultimaPompa)}
    </svg>`;
  }
  const pompa = () => `<g class="pa-pompa" transform="translate(48 0)"><rect x="276" y="250" width="22" height="90" rx="4"/><rect x="262" y="336" width="50" height="10" rx="3"/><rect class="pa-stantuffo" x="284" y="220" width="6" height="34"/><rect class="pa-manico" x="266" y="214" width="42" height="9" rx="4"/></g>`;

  const tavolo = {
    libero: true,
    panno(ctx) {
      const p = ctx.partita;
      const mio = p.turno === ctx.mio && !p.finita && !p.inAttesa;
      const rischio = Math.round(100 / Math.max(1, p.massimo - p.pompate));
      let msg;
      if (p.fase === 'scoppio' || (p.finita && p.scoppio !== null && p.storia.length)) {
        const u = p.storia[p.storia.length - 1];
        msg = u.scoppiato !== null
          ? `💥 ${u.scoppiato === ctx.mio ? 'L\'hai fatto scoppiare tu' : `L'ha fatto scoppiare ${esc(ctx.nome(u.scoppiato))}`} alla pompata ${u.scoppio}.`
          : `Tutti hanno incassato: sarebbe scoppiato alla pompata ${u.scoppio}.`;
      } else if (p.stato[ctx.mio] === 'incassato') msg = `Hai incassato: guardi gli altri rischiare 🍿`;
      else if (mio) msg = `Tocca a te: pompi o incassi i tuoi <b>${p.piatto[ctx.mio]}</b>?`;
      else msg = `Tocca a ${esc(ctx.nome(p.turno))}`;
      const storia = p.storia.length ? `<p class="piccolo pa-storia">Palloni precedenti: ${p.storia.map((s, i) => `<span title="round ${i + 1}">#${i + 1} → ${s.scoppio}</span>`).join(' · ')}</p>` : '';
      return `<div class="pa">
        <p class="pa-round">Pallone ${p.nRound} di ${p.round}</p>
        <div class="pa-scena ${mio ? 'mio' : ''}">${pallone(ctx)}</div>
        <p class="pa-msg" aria-live="polite">${msg}</p>
        <p class="pa-info">${p.fase === 'gioco' && !p.finita ? `${p.pompate} pompate fatte · rischio della prossima ${rischio}%` : '&nbsp;'}</p>
        ${storia}
      </div>`;
    },
    azioni(ctx) {
      const p = ctx.partita;
      if (p.turno !== ctx.mio || p.inAttesa || p.finita) return '';
      return `<button type="button" class="bottone primario pa-bt" data-az="pompa">🎈 Pompa (+1)</button>
        <button type="button" class="bottone pa-bt" data-az="incassa">💰 Incassa ${p.piatto[ctx.mio]}</button>`;
    },
    dopo(ctx) {
      const p = ctx.partita;
      if (p.scoppiato !== null && p.fase !== 'gioco' && primaVolta(ctx.ui, `suono-scoppio-${p.nRound}`)) {
        suono([[140, 0.05], [70, 0.3]], { tipo: 'square', volume: 0.13 });
        if (navigator.vibrate && p.scoppiato === ctx.mio) navigator.vibrate([80, 40, 120]);
      } else if (p.fase === 'gioco' && p.pompate && primaVolta(ctx.ui, `suono-pompa-${p.nRound}-${p.pompate}`)) suono([[300 + p.pompate * 18, 0.07]], { volume: 0.05 });
    },
    statoAttesa: () => 'Pallone nuovo in arrivo…',
    stato(ctx) {
      const p = ctx.partita;
      if (p.finita || p.turno == null) return null;
      return p.turno === ctx.mio ? 'Tocca a te: pompa o incassa' : `Tocca a ${ctx.nome(p.turno)}`;
    },
    punteggio(ctx) {
      const p = ctx.partita;
      return p.punti.map((x, i) => `<span>${esc(i === ctx.mio ? 'Tu' : ctx.nome(i))} <b>${x}</b></span>`).join('') + `<span class="obiettivo">pallone ${p.nRound}/${p.round}</span>`;
    },
    infoPosto(ctx, posto) {
      const p = ctx.partita;
      const st = p.stato[posto];
      if (st === 'scoppiato') return '💥 scoppiato';
      if (st === 'incassato') return `💰 ${p.punti[posto]} punti`;
      return `🎈 piatto ${p.piatto[posto]} · ${p.punti[posto]} punti`;
    },
    clic(ctx, el) {
      if (el.dataset.az === 'pompa') return ctx.invia({ tipo: 'pompa' });
      if (el.dataset.az === 'incassa') return ctx.invia({ tipo: 'incassa' });
    },
  };
  Object.assign(window.Tavoli, { pallone: tavolo });
})();
