// NASCONDINO: la griglia 7×7 vista da chi gioca. Chi si nasconde vede sé stesso e i cacciatori vicini (a 2 caselle
// o meno); chi caccia vede i cacciatori, le caselle già controllate e gli indizi: fruscio, impronte e bussola.
(() => {
  const { esc, primaVolta, suono } = window.Nuovi;
  const COLORI = ['#e8453c', '#2f7fd8', '#2e9d57', '#d19a2a', '#8e55c9', '#e36fa5'];
  const FRECCE = { N: '⬆️', NE: '↗️', E: '➡️', SE: '↘️', S: '⬇️', SO: '↙️', O: '⬅️', NO: '↖️' };
  const tavolo = {
    libero: true,
    panno(ctx) {
      const p = ctx.partita, io = ctx.mio;
      const cacciatore = p.ruolo[io] === 'caccia';
      const mosse = new Set(p.mosse);
      const visitate = new Set(p.visitate);
      const ind = p.indizi;
      const impronte = new Set(cacciatore && ind && ind.impronte && ind.round === p.nRound - 1 ? ind.impronte : []);
      const presiOra = new Set(ind && ind.round === p.nRound - 1 ? ind.prese.map((x) => x.cella) : []);
      const indiziOra = cacciatore && ind && ind.round === p.nRound - 1;
      const celle = [];
      for (let c = 0; c < p.lato * p.lato; c++) {
        const qui = p.pos.map((x, i) => (x === c ? i : -1)).filter((i) => i >= 0);
        const pedine = qui.map((i) => {
          const f = p.ruolo[i] === 'caccia' && indiziOra && ind.frusci[i] !== undefined ? `<b class="nd-fruscio" title="fruscio: nascosti a 2 caselle o meno">${ind.frusci[i]}</b>` : '';
          const b = p.ruolo[i] === 'caccia' && indiziOra && ind.indizi[i] ? `<i class="nd-bussola" title="bussola: il nascosto più vicino è verso ${esc(p.nomiDir[ind.indizi[i]])}">${FRECCE[ind.indizi[i]]}</i>` : '';
          return `<span class="nd-pedina ${p.ruolo[i]} ${i === io ? 'io' : ''}" style="--c:${COLORI[i % COLORI.length]}" title="${esc(i === io ? 'tu' : ctx.nome(i))}">${p.ruolo[i] === 'caccia' ? '🔦' : '🙈'}${f}${b}</span>`;
        }).join('');
        const scelta = p.scelto === c;
        const cls = ['nd-cella', visitate.has(c) ? 'visitata' : '', mosse.has(c) ? 'mossa' : '', scelta ? 'scelta' : '', presiOra.has(c) ? 'presa' : '', c === p.centro ? 'centro' : ''].join(' ');
        const orma = impronte.has(c) ? '<span class="nd-orma" title="impronta: qualcuno è appena passato di qui">👣</span>' : '';
        celle.push(mosse.has(c)
          ? `<button type="button" class="${cls}" data-az="muovi" data-c="${c}" aria-label="Casella ${c + 1}">${orma}${pedine}</button>`
          : `<div class="${cls}">${orma}${pedine}${scelta ? '<span class="nd-meta">✓</span>' : ''}</div>`);
      }
      const visti = p.pos.filter((x, i) => x !== null && p.ruolo[i] === 'caccia').length;
      let msg;
      if (p.finita) msg = 'Fine della partita: ecco dov\'erano tutti!';
      else if (p.fase === 'nascondi') msg = cacciatore ? 'Conti fino a 10 con gli occhi chiusi… gli altri si stanno nascondendo 🙈' : p.devo ? 'Scegli dove nasconderti (lontano dal centro) oppure lascia fare al caso' : 'Nascosto! Aspetta che si nascondano tutti 🤫';
      else if (cacciatore) {
        const bus = indiziOra && Object.keys(ind.indizi).length ? ' · 🧭 bussola: guarda la freccia sul cacciatore' : '';
        const orme = impronte.size ? ` · 👣 ${impronte.size === 1 ? 'un\'impronta' : `${impronte.size} impronte`}` : '';
        msg = p.devo ? `Round ${p.nRound} di ${p.round}: muoviti di 1 o 2 caselle in linea retta${orme}${bus}` : 'Mossa scelta: si aspettano gli altri';
      } else {
        const bus = ind && ind.bussola && ind.round === p.nRound - 1 ? ' 🧭 Attento: i cacciatori hanno appena avuto la bussola!' : '';
        msg = p.devo
          ? `Round ${p.nRound} di ${p.round}: ${visti ? '👀 un cacciatore è vicino! Scappa di una casella' : 'nessun cacciatore in vista: se ti muovi lasci un\'impronta'}, oppure resta fermo.${bus}`
          : 'Mossa scelta: trattieni il fiato… 🤫';
      }
      const attesi = p.pronti.map((x, i) => (!x && (p.fase === 'caccia' || p.ruolo[i] === 'nascosto') ? (i === io ? 'tu' : ctx.nome(i)) : null)).filter(Boolean);
      return `<div class="nd">
        <div class="nd-griglia ${cacciatore ? 'caccia' : ''}" style="--lato:${p.lato}">${celle.join('')}</div>
        <p class="pa-msg" aria-live="polite">${msg}</p>
        <p class="pa-info">${p.finita ? '&nbsp;' : attesi.length ? `Si aspetta: ${attesi.map(esc).join(', ')}` : '&nbsp;'} · 🔦 cacciatori (la torcia illumina anche le caselle accanto)${cacciatore ? ' · grigie = già controllate · 👣 impronte' : ''}</p>
      </div>`;
    },
    azioni(ctx) {
      const p = ctx.partita;
      if (p.fase === 'nascondi' && p.devo) return '<button type="button" class="bottone" data-az="caso">🎲 Nasconditi a caso</button>';
      if (p.fase === 'caccia' && p.devo) return '<button type="button" class="bottone" data-az="resta">Resta fermo</button>';
      return '';
    },
    dopo(ctx) {
      const p = ctx.partita, u = p.indizi;
      if (u && u.prese && u.prese.length && primaVolta(ctx.ui, `nd-${u.round}`)) {
        suono([[520, 0.08], [660, 0.08], [880, 0.16]], { volume: 0.08 });
        if (navigator.vibrate && u.prese.some((x) => x.preso === ctx.mio)) navigator.vibrate([80, 40, 120]);
      }
    },
    stato(ctx) {
      const p = ctx.partita;
      if (p.finita) return null;
      if (p.fase === 'nascondi') return p.ruolo[ctx.mio] === 'caccia' ? 'Gli altri si nascondono…' : p.devo ? 'Nasconditi!' : 'Nascosto';
      return `Round ${p.nRound}/${p.round} · ${p.ruolo[ctx.mio] === 'caccia' ? (p.devo ? 'Cerca!' : 'Aspetta') : (p.devo ? 'Resta o scappa' : 'Aspetta')}`;
    },
    punteggio(ctx) { const p = ctx.partita; return p.punti.map((x, i) => `<span style="color:${COLORI[i % COLORI.length]}">${esc(i === ctx.mio ? 'Tu' : ctx.nome(i))} <b>${x}</b></span>`).join('') + `<span class="obiettivo">nascosto +1 a round · presa +${p.puntiPresa}</span>`; },
    infoPosto(ctx, posto) { const p = ctx.partita; return p.ruolo[posto] === 'caccia' ? `🔦 caccia · ${p.prese[posto]} ${p.prese[posto] === 1 ? 'presa' : 'prese'}` : `🙈 nascosto · ${p.sopravvissuti[posto]} round`; },
    clic(ctx, el) {
      const az = el.dataset.az;
      if (az === 'muovi') return ctx.invia({ tipo: 'muovi', cella: Number(el.dataset.c) });
      if (az === 'caso') return ctx.invia({ tipo: 'caso' });
      if (az === 'resta') return ctx.invia({ tipo: 'resta' });
    },
  };
  Object.assign(window.Tavoli, { nascondino: tavolo });
})();
