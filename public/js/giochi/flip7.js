// FLIP 7: una "plancia" per giocatore con le carte scoperte (numeri, modificatori, seconda possibilità).
// Carte disegnate qui: ogni numero ha il suo colore; azioni con icone SVG fatte a mano.
(() => {
  const { esc, ritardo, primaVolta, suono } = window.Nuovi;
  const COL = ['#8a8f99', '#6d5bd0', '#2f7fd8', '#1fa3a3', '#2e9d57', '#7fae2a', '#c9a227', '#e0892c', '#e2582f', '#d23c56', '#b83d9a', '#7b4fc4', '#3b5bb5'];
  const ICONE = {
    congela: '<svg viewBox="0 0 40 40" aria-hidden="true"><g stroke="currentColor" stroke-width="3" stroke-linecap="round" fill="none"><path d="M20 4v32M6 12l28 16M6 28l28-16"/><path d="M15 6l5 4 5-4M15 34l5-4 5 4M4 17l6 2-1 6M36 23l-6-2 1-6M4 23l6-2-1-6M36 17l-6 2 1 6"/></g></svg>',
    tre: '<svg viewBox="0 0 40 40" aria-hidden="true"><g stroke="currentColor" stroke-width="2.5" fill="none"><rect x="4" y="8" width="16" height="22" rx="3" transform="rotate(-12 12 19)"/><rect x="12" y="7" width="16" height="22" rx="3"/><rect x="20" y="8" width="16" height="22" rx="3" transform="rotate(12 28 19)"/></g><text x="20" y="24" text-anchor="middle" font-size="11" font-weight="700" fill="currentColor">3</text></svg>',
    seconda: '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 34 C6 24 4 16 8 11 c4-5 10-4 12 1 c2-5 8-6 12-1 c4 5 2 13-12 23z" fill="currentColor"/><path d="M14 17 l4 4 8-8" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/></svg>',
  };
  const NOMI = { congela: 'Congela', tre: 'Pesca tre', seconda: 'Seconda possibilità' };

  function carta(c, cls = '', attr = '', stile = '') {
    if (c.tipo === 'num') return `<div class="f7-carta num ${cls}" style="--c:${COL[c.v]};${stile}" title="${c.v}" ${attr}><span class="f7-ang">${c.v}</span><b>${c.v}</b></div>`;
    if (c.tipo === 'mod') return `<div class="f7-carta mod ${cls}" style="${stile}" title="${c.x2 ? 'Raddoppia i numeri' : `+${c.v} punti`}" ${attr}><b>${c.x2 ? '×2' : `+${c.v}`}</b></div>`;
    return `<div class="f7-carta az ${c.a} ${cls}" title="${NOMI[c.a]}" ${attr}>${ICONE[c.a]}<small>${NOMI[c.a]}</small></div>`;
  }
  const chi = (ctx, i) => (i === ctx.mio ? 'Tu' : ctx.nome(i));
  const STATI = { attivo: '', fermo: '✋ fermo', congelato: '❄️ congelato', sballato: '💥 sballato', flip7: '🎉 FLIP 7' };

  function plancia(ctx, i) {
    const p = ctx.partita, x = p.giocatori[i];
    const pe = p.pendente;
    const sceglibile = pe && pe.chi === ctx.mio && pe.scelte.includes(i);
    const nuova = (c) => (x.ultima && x.ultima.id === c.id);
    const st = (c) => (nuova(c) ? ritardo(ctx.ui, `f7-${c.id}`) : '');
    const tre = p.tre.find((t) => t.chi === i);
    const numeri = x.numeri.map((c) => carta(c, `${nuova(c) ? 'nuova' : ''} ${x.stato === 'sballato' && c.v === x.doppio ? 'doppione' : ''}`, '', st(c))).join('');
    const mod = x.mod.map((c) => carta(c, nuova(c) ? 'nuova' : '', '', st(c))).join('');
    const buchi = x.stato === 'attivo' || x.stato === 'fermo' || x.stato === 'congelato' ? Array.from({ length: Math.max(0, 7 - x.numeri.length) }, () => '<div class="f7-buco"></div>').join('') : '';
    return `<div class="f7-plancia ${i === ctx.mio ? 'mia' : ''} ${p.turno === i && !p.inAttesa ? 'turno' : ''} st-${x.stato} ${sceglibile ? 'sceglibile' : ''}" ${sceglibile ? `data-az="scegli" data-posto="${i}" role="button" tabindex="0"` : ''}>
      <div class="f7-testa"><b>${esc(chi(ctx, i))}</b><span class="f7-stato">${STATI[x.stato] || ''}${tre ? ` 🃏 pesca tre (ne ${tre.resto === 1 ? 'resta 1' : `restano ${tre.resto}`})` : ''}</span>
        <span class="f7-punti">${x.punti} <small>nel round</small> · ${p.totali[i]} <small>totale</small></span></div>
      <div class="f7-carte"><div class="f7-numeri">${numeri}${buchi}</div>${mod || x.seconda ? `<div class="f7-extra">${mod}${x.seconda ? carta({ tipo: 'azione', a: 'seconda' }, 'piccola') : ''}</div>` : ''}</div>
    </div>`;
  }

  const tavolo = {
    libero: true,
    senzaFila: true,
    panno(ctx) {
      const p = ctx.partita;
      const pe = p.pendente;
      let prompt = '';
      if (pe && !p.finita) {
        const cosa = pe.tipo === 'regala' ? 'a chi regalare la Seconda possibilità' : pe.carta.a === 'congela' ? 'chi congelare ❄️' : 'chi deve pescare tre carte 🃏';
        prompt = pe.chi === ctx.mio
          ? `<div class="f7-prompt">${carta(pe.carta)}<div><b>Scegli ${cosa}</b><div class="f7-scelte">${pe.scelte.map((i) => `<button type="button" class="bottone mini-bt" data-az="scegli" data-posto="${i}">${esc(i === ctx.mio ? 'Me stesso' : ctx.nome(i))}</button>`).join('')}</div></div></div>`
          : `<div class="f7-prompt">${carta(pe.carta)}<div>${esc(ctx.nome(pe.chi))} sceglie ${cosa}</div></div>`;
      }
      const altri = Array.from({ length: p.n }, (_, i) => i).filter((i) => i !== ctx.mio);
      return `<div class="f7">
        <div class="f7-banco"><span class="pa-round">Round ${p.nRound} · mazziere ${esc(chi(ctx, p.mazziere))}</span>
          <div class="f7-mazzo" title="Carte nel mazzo"><div class="f7-carta retro"><b>7</b></div><span>${p.mazzo}</span></div>
          <span class="piccolo">scarti ${p.scarti}</span></div>
        ${prompt}
        <div class="f7-altri n${altri.length}">${altri.map((i) => plancia(ctx, i)).join('')}</div>
        ${plancia(ctx, ctx.mio)}
      </div>`;
    },
    azioni(ctx) {
      const p = ctx.partita;
      if (p.turno !== ctx.mio || p.pendente || p.inAttesa || p.finita || p.fase !== 'gioco') return '';
      const x = p.giocatori[ctx.mio];
      return `<button type="button" class="bottone primario f7-bt" data-az="pesca">🃏 Pesca</button>
        <button type="button" class="bottone f7-bt" data-az="stai">✋ Stai con ${x.punti}</button>
        <span class="suggerimento">${x.seconda ? 'Hai la seconda possibilità: un doppione non ti elimina' : `Rischio di sballare: <b>${x.rischio}%</b>`}</span>`;
    },
    riepilogo(ctx) {
      const p = ctx.partita, r = p.riepilogo;
      if (!r) return null;
      return `<h2>Fine del round ${r.round}</h2>
        <div class="tabella-scorre"><table class="conti f7-conti"><thead><tr><th></th><th>Numeri</th><th>Extra</th><th>Round</th><th>Totale</th></tr></thead>
        <tbody>${r.righe.map((x) => `<tr class="${x.stato === 'sballato' ? 'f7-zero' : ''}"><th>${esc(chi(ctx, x.posto))}${x.stato === 'flip7' ? ' 🎉' : x.stato === 'sballato' ? ' 💥' : ''}</th>
          <td>${x.numeri.join(' ') || '–'}</td><td>${x.mod.join(' ') || ''}</td><td class="${x.punti ? 'vinto' : ''}">${x.punti}</td><td>${x.totale}</td></tr>`).join('')}</tbody></table></div>
        <p class="piccolo">${r.flip7 !== null ? `${esc(chi(ctx, r.flip7))} ha fatto Flip 7 (+${p.bonus}). ` : ''}Si vince a ${p.obiettivo} punti.</p>`;
    },
    dopo(ctx) {
      const p = ctx.partita;
      p.giocatori.forEach((x, i) => {
        if (!x.ultima || !primaVolta(ctx.ui, `f7s-${x.ultima.id}`)) return;
        if (x.stato === 'sballato' && x.ultima.tipo === 'num') suono([[200, 0.1], [120, 0.3]], { tipo: 'square', volume: 0.08 });
        else if (x.stato === 'flip7') suono([[523, 0.1], [659, 0.1], [784, 0.1], [1046, 0.25]], { volume: 0.09 });
        else suono([[420 + (x.ultima.v || 3) * 25, 0.06]], { volume: 0.05 });
      });
    },
    statoAttesa: () => 'Fine round',
    stato(ctx) {
      const p = ctx.partita;
      if (p.finita || p.turno == null) return null;
      if (p.pendente) return p.pendente.chi === ctx.mio ? 'Scegli un giocatore' : `${ctx.nome(p.pendente.chi)} sceglie…`;
      return p.turno === ctx.mio ? 'Tocca a te: pesca o stai' : `Tocca a ${ctx.nome(p.turno)}`;
    },
    punteggio(ctx) {
      const p = ctx.partita;
      return p.totali.map((x, i) => `<span>${esc(chi(ctx, i))} <b>${x}</b></span>`).join('') + `<span class="obiettivo">si vince a ${p.obiettivo}</span>`;
    },
    infoPosto(ctx, posto) { const p = ctx.partita; return `${p.totali[posto]} punti`; },
    clic(ctx, el) {
      const az = el.dataset.az;
      if (az === 'pesca' || az === 'stai') { el.disabled = true; return ctx.invia({ tipo: az }); }
      if (az === 'scegli') return ctx.invia({ tipo: 'scegli', posto: Number(el.dataset.posto) });
    },
  };
  Object.assign(window.Tavoli, { flip7: tavolo });
})();
