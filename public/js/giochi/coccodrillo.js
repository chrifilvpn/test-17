// COCCODRILLO: il tavolo nel browser (coccodrillo disegnato in SVG)
(() => {
  const { esc, ritardo, primaVolta, suono } = window.Nuovi;
  const CX = 210, CY = 196, RX = 128, RY = 92; // arco dei denti della mascella di sotto

  // posizione e rotazione di ogni dente lungo l'arco (dal fondo a sinistra al fondo a destra, passando davanti)
  function posDente(k, tot) {
    const th = Math.PI - (k * Math.PI) / (tot - 1);
    const x = CX + RX * Math.cos(th), y = CY + RY * Math.sin(th);
    const rot = ((th - Math.PI / 2) * 180) / Math.PI * 0.72;
    const scala = 0.78 + 0.32 * Math.sin(th); // i denti davanti sembrano più grandi
    return { x, y, rot, scala };
  }

  function dente(ctx, k) {
    const p = ctx.partita;
    const { x, y, rot, scala } = posDente(k, p.denti);
    const giu = p.premuti[k];
    const cattivo = p.cattivo === k;
    const puo = p.turno === ctx.mio && !giu && !p.finita && !p.inAttesa;
    const nuovo = p.ultimo && p.ultimo.dente === k && !p.ultimo.morso;
    const cls = ['cc-dente', giu ? 'giu' : '', puo ? 'attivo' : '', cattivo ? 'cattivo' : '', nuovo ? 'appena' : ''].join(' ');
    const attr = puo ? `data-az="dente" data-d="${k}" role="button" tabindex="0" aria-label="Dente ${k + 1}"` : `aria-label="Dente ${k + 1}${giu ? ', premuto' : ''}"`;
    return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${scala.toFixed(2)})"><g class="${cls}" ${attr} ${nuovo ? `style="${ritardo(ctx.ui, `dente-${p.morsi}-${k}`)}"` : ''}>
      <path class="cc-gengiva" d="M-15 8 Q0 16 15 8 L13 14 Q0 20 -13 14Z"/>
      <path class="cc-smalto" d="M-13 8 C-12 -6 -6 -24 0 -28 C6 -24 12 -6 13 8 Q0 13 -13 8Z"/>
      <path class="cc-luce" d="M-6 2 C-6 -8 -3 -17 0 -21"/>
    </g></g>`;
  }

  function disegno(ctx) {
    const p = ctx.partita;
    const denti = Array.from({ length: p.denti }, (_, k) => dente(ctx, k)).join('');
    const rimasti = p.premuti.filter((x) => !x).length;
    const morsa = !!(p.ultimo && p.ultimo.morso);
    const riapre = !morsa && p.morsi > 0 && p.premuti.every((x) => !x);
    const stato = morsa ? 'chiusa' : riapre ? 'riapre' : '';
    const tempo = morsa ? ritardo(ctx.ui, `morso-${p.morsi}`) : riapre ? ritardo(ctx.ui, `riapre-${p.morsi}`) : '';
    const nervoso = !morsa && rimasti <= 4 ? 'nervoso' : '';
    // denti di sopra (solo decorazione): pendono dalla mascella superiore
    const sopra = Array.from({ length: 11 }, (_, k) => {
      const th = Math.PI - (k * Math.PI) / 10;
      const x = CX + (RX - 6) * Math.cos(th), y = 118 + 26 * Math.sin(th);
      return `<path class="cc-smalto" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(((Math.PI / 2 - th) * 180) / Math.PI * 0.35).toFixed(1)})" d="M-9 -2 C-8 8 -4 18 0 22 C4 18 8 8 9 -2 Q0 -5 -9 -2Z"/>`;
    }).join('');
    return `<svg viewBox="0 0 420 380" class="cc-svg ${stato} ${nervoso}" style="${tempo}" role="group" aria-label="Il coccodrillo: ${rimasti} denti ancora su">
      <defs>
        <radialGradient id="cc-pelle" cx="50%" cy="35%" r="70%"><stop offset="0" stop-color="#8fcf5a"/><stop offset=".65" stop-color="#5aa33a"/><stop offset="1" stop-color="#3b7a2a"/></radialGradient>
        <radialGradient id="cc-bocca" cx="50%" cy="40%" r="65%"><stop offset="0" stop-color="#ff9aa8"/><stop offset=".7" stop-color="#e2586c"/><stop offset="1" stop-color="#b8344c"/></radialGradient>
        <linearGradient id="cc-acqua" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f7f86"/><stop offset="1" stop-color="#1c5157"/></linearGradient>
      </defs>
      <ellipse class="cc-acqua" cx="210" cy="338" rx="200" ry="34" fill="url(#cc-acqua)"/>
      <path class="cc-onda" d="M40 336 q18 -8 36 0 t36 0 M300 344 q18 -8 36 0 t36 0 M150 356 q18 -8 36 0 t36 0"/>
      <g class="cc-sotto">
        <path class="cc-pelle" d="M52 176 C52 290 120 334 210 334 C300 334 368 290 368 176 C352 172 336 176 330 184 C326 262 280 292 210 292 C140 292 94 262 90 184 C84 176 68 172 52 176Z"/>
        <path class="cc-interno" d="M88 182 C92 262 140 292 210 292 C280 292 328 262 332 182 C300 196 252 204 210 204 C168 204 120 196 88 182Z" fill="url(#cc-bocca)"/>
        <path class="cc-lingua" d="M150 250 C150 222 180 214 210 214 C240 214 270 222 270 250 C270 272 240 284 210 284 C180 284 150 272 150 250Z"/>
        <path class="cc-solco" d="M210 222 L210 270"/>
        <g class="cc-scaglie"><circle cx="120" cy="306" r="6"/><circle cx="148" cy="318" r="5"/><circle cx="272" cy="318" r="5"/><circle cx="300" cy="306" r="6"/></g>
        ${denti}
      </g>
      <g class="cc-sopra">
        <path class="cc-palato" d="M84 120 C120 150 170 160 210 160 C250 160 300 150 336 120 C330 140 290 170 210 172 C130 170 90 140 84 120Z"/>
        ${sopra}
        <path class="cc-pelle" d="M40 128 C40 70 110 40 210 40 C310 40 380 70 380 128 C372 118 350 112 336 120 C300 150 250 160 210 160 C170 160 120 150 84 120 C70 112 48 118 40 128Z"/>
        <path class="cc-riga" d="M110 92 q20 -10 40 0 M270 92 q20 -10 40 0 M190 70 q20 -8 40 0"/>
        <g class="cc-naso"><ellipse cx="186" cy="56" rx="7" ry="5"/><ellipse cx="234" cy="56" rx="7" ry="5"/></g>
        <g class="cc-occhio sx"><path class="cc-pelle" d="M92 64 C92 20 160 20 160 64Z"/><circle class="cc-bianco" cx="126" cy="46" r="21"/><circle class="cc-pupilla" cx="128" cy="48" r="11"/><circle class="cc-riflesso" cx="133" cy="42" r="4"/><path class="cc-palpebra" d="M103 44 C108 18 146 18 150 44 C140 34 112 34 103 44Z"/></g>
        <g class="cc-occhio dx"><path class="cc-pelle" d="M260 64 C260 20 328 20 328 64Z"/><circle class="cc-bianco" cx="294" cy="46" r="21"/><circle class="cc-pupilla" cx="292" cy="48" r="11"/><circle class="cc-riflesso" cx="297" cy="42" r="4"/><path class="cc-palpebra" d="M271 44 C276 18 314 18 318 44 C308 34 280 34 271 44Z"/></g>
        <path class="cc-goccia" d="M352 60 C346 74 344 82 352 86 C360 82 358 74 352 60Z"/>
      </g>
      <text class="cc-chomp" x="210" y="210" text-anchor="middle">CHOMP!</text>
    </svg>`;
  }

  const coccodrillo = {
    libero: true,
    panno(ctx) {
      const p = ctx.partita;
      const rimasti = p.premuti.filter((x) => !x).length;
      const mio = p.turno === ctx.mio && !p.finita && !p.inAttesa;
      let messaggio;
      if (p.finita) messaggio = p.risultato.vincitori[0] === ctx.mio ? '🏆 Sei l\'ultimo rimasto: hai vinto!' : `🏆 Vince ${esc(ctx.nome(p.risultato.vincitori[0]))}`;
      else if (p.ultimo && p.ultimo.morso) messaggio = `${p.ultimo.posto === ctx.mio ? 'Ti ha morso!' : `Ha morso ${esc(ctx.nome(p.ultimo.posto))}!`} Il coccodrillo riapre la bocca…`;
      else if (!p.vivi[ctx.mio]) messaggio = 'Sei stato morso: guardi gli altri tremare 🍿';
      else if (mio) messaggio = 'Tocca a te: scegli un dente e premilo…';
      else messaggio = `Tocca a ${esc(ctx.nome(p.turno))}`;
      const rischio = rimasti ? Math.round(100 / rimasti) : 100;
      return `<div class="cc">
        <div class="cc-scena ${mio ? 'mio' : ''}">${disegno(ctx)}</div>
        <p class="cc-messaggio" aria-live="polite">${messaggio}</p>
        <p class="cc-info">${p.finita || (p.ultimo && p.ultimo.morso) ? '&nbsp;' : `${rimasti} denti ancora su · rischio ${rischio}% a ogni dente`}</p>
      </div>`;
    },
    azioni(ctx) {
      const p = ctx.partita;
      if (!p.conPasso || p.turno !== ctx.mio || p.inAttesa || p.finita) return '';
      return `<button type="button" class="bottone" data-az="passa" ${p.passi[ctx.mio] && p.premuti.filter((x) => !x).length > 1 ? '' : 'disabled'}>Passo (${p.passi[ctx.mio] ? '1 disponibile' : 'già usato'})</button>`;
    },
    dopo(ctx) {
      const p = ctx.partita;
      if (p.ultimo && p.ultimo.morso && primaVolta(ctx.ui, `suono-morso-${p.morsi}`)) {
        suono([[180, 0.06], [90, 0.25]], { tipo: 'square', volume: 0.12 });
        if (navigator.vibrate && p.ultimo.posto === ctx.mio) navigator.vibrate([60, 40, 160]);
      } else if (p.ultimo && !p.ultimo.morso && primaVolta(ctx.ui, `suono-dente-${p.morsi}-${p.ultimo.dente}`)) suono([[520, 0.05], [660, 0.07]], { volume: 0.06 });
    },
    statoAttesa: () => 'CHOMP!',
    stato(ctx) {
      const p = ctx.partita;
      if (p.finita || p.turno == null) return null;
      return p.turno === ctx.mio ? 'Tocca a te: premi un dente' : `Tocca a ${ctx.nome(p.turno)}`;
    },
    punteggio(ctx) {
      const p = ctx.partita;
      return `<span>In gioco <b>${p.vivi.filter(Boolean).length}</b></span><span>Morsi <b>${p.eliminati.length}</b></span>`;
    },
    infoPosto(ctx, posto) {
      const p = ctx.partita;
      if (!p.vivi[posto]) return '<span class="eliminato">🩹 morso</span>';
      return p.conPasso && p.passi[posto] ? 'in gioco · passo pronto' : 'in gioco';
    },
    clic(ctx, el) {
      if (el.dataset.az === 'dente') { el.classList.add('premendo'); return ctx.invia({ tipo: 'premi', dente: Number(el.dataset.d) }); }
      if (el.dataset.az === 'passa') return ctx.invia({ tipo: 'passa' });
    },
  };
  Object.assign(window.Tavoli, { coccodrillo });
})();
