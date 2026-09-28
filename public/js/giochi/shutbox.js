// SHUT THE BOX: la scatola di legno con il panno verde, le tessere numerate che si abbassano (si girano) e i dadi
// che rotolano. Si scelgono le tessere toccandole: la somma scelta compare accanto a quella dei dadi.
(() => {
  const { esc, primaVolta, suono, ritardo } = window.Nuovi;
  const PUNTI_DADO = { 1: [[50, 50]], 2: [[28, 28], [72, 72]], 3: [[28, 28], [50, 50], [72, 72]], 4: [[28, 28], [72, 28], [28, 72], [72, 72]], 5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]], 6: [[28, 25], [72, 25], [28, 50], [72, 50], [28, 75], [72, 75]] };
  const dado = (v, k, st) => `<svg class="sb-dado" viewBox="0 0 100 100" style="--k:${k};${st}"><rect x="5" y="5" width="90" height="90" rx="18"/>${PUNTI_DADO[v].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9"/>`).join('')}</svg>`;
  const tavolo = {
    libero: true,
    panno(ctx) {
      const p = ctx.partita, ui = ctx.ui, mio = p.turno === ctx.mio && !p.inAttesa && !p.finita;
      const alzate = new Set(p.alzate);
      ui.sel = (ui.sel || []).filter((k) => alzate.has(k));
      if (!mio || p.fase !== 'scegli') ui.sel = [];
      const scelta = ui.sel.reduce((a, b) => a + b, 0);
      const tessere = Array.from({ length: p.max }, (_, i) => {
        const k = i + 1, su = alzate.has(k), sel = ui.sel.includes(k);
        const cliccabile = mio && p.fase === 'scegli' && su;
        return `<${cliccabile ? 'button type="button" data-az="tessera"' : 'div'} class="sb-tessera ${su ? 'su' : 'giu'} ${sel ? 'scelta' : ''}" data-k="${k}"><span>${k}</span></${cliccabile ? 'button' : 'div'}>`;
      }).join('');
      const dadi = p.dadi ? `<div class="sb-dadi">${p.dadi.map((v, k) => dado(v, k, ritardo(ui, `sb-d-${p.round}-${p.turno}-${p.nTiri}`))).join('')}<b class="sb-somma">= ${p.somma}</b></div>` : '<div class="sb-dadi vuoti">🎲</div>';
      let msg;
      if (p.finita) msg = p.scatola !== null ? `📦 ${esc(p.scatola === ctx.mio ? 'Hai' : `${ctx.nome(p.scatola)} ha`)} chiuso la scatola!` : 'Partita finita';
      else if (p.fase === 'fine') msg = `${esc(p.turno === ctx.mio ? 'Hai' : `${ctx.nome(p.turno)} ha`)} finito il turno`;
      else if (mio && p.fase === 'tira') msg = 'Tira i dadi';
      else if (mio) msg = `Abbassa tessere che fanno <b>${p.somma}</b> · scelte: <b class="${scelta === p.somma ? 'ok' : scelta > p.somma ? 'troppo' : ''}">${scelta}</b>`;
      else msg = `Gioca ${esc(ctx.nome(p.turno))}`;
      const righe = p.storico.map((r, i) => `<tr><td>Round ${i + 1}</td>${r.map((x) => `<td>${x === null ? '·' : x}</td>`).join('')}</tr>`).join('');
      const tabella = p.n > 1 || p.storico.length ? `<table class="sb-tab"><tr><th></th>${Array.from({ length: p.n }, (_, i) => `<th>${esc(i === ctx.mio ? 'Tu' : ctx.nome(i))}</th>`).join('')}</tr>${righe}<tr class="tot"><td>Totale</td>${p.punti.map((x) => `<td>${x}</td>`).join('')}</tr></table>` : '';
      return `<div class="sb">
        <p class="pa-round">Round ${p.round} di ${p.nRound}</p>
        <div class="sb-scatola"><div class="sb-tessere" style="--n:${p.max}">${tessere}</div><div class="sb-panno">${dadi}</div></div>
        <p class="pa-msg" aria-live="polite">${msg}</p>${tabella}</div>`;
    },
    azioni(ctx) {
      const p = ctx.partita, ui = ctx.ui;
      if (p.turno !== ctx.mio || p.inAttesa || p.finita) return '';
      if (p.fase === 'tira') return `<button type="button" class="bottone primario" data-az="tira">🎲 Tira i dadi</button>${p.possoUnDado ? '<button type="button" class="bottone" data-az="tira1">🎲 Tira un dado solo</button>' : ''}`;
      const s = (ui.sel || []).reduce((a, b) => a + b, 0);
      return `<button type="button" class="bottone primario" data-az="chiudi" ${s === p.somma ? '' : 'disabled'}>Abbassa ${ui.sel && ui.sel.length ? ui.sel.join(' + ') : 'le tessere'}</button>`;
    },
    dopo(ctx) {
      const p = ctx.partita;
      if (p.dadi && primaVolta(ctx.ui, `sb-s-${p.round}-${p.turno}-${p.nTiri}`)) suono([[300, 0.03], [420, 0.03], [360, 0.03], [480, 0.05]], { tipo: 'square', volume: 0.04 });
      if (p.fase === 'fine' && primaVolta(ctx.ui, `sb-f-${p.round}-${p.turno}`)) suono([[330, 0.1], [220, 0.2]], { volume: 0.05 });
      if (p.finita && p.scatola !== null && primaVolta(ctx.ui, 'sb-scatola')) suono([[523, 0.1], [659, 0.1], [784, 0.1], [1046, 0.3]], { volume: 0.08 });
    },
    statoAttesa: () => 'Turno finito',
    stato(ctx) { const p = ctx.partita; if (p.finita) return null; return p.turno === ctx.mio ? (p.fase === 'tira' ? 'Tira i dadi' : `Abbassa ${p.somma}`) : `Gioca ${ctx.nome(p.turno)}`; },
    punteggio(ctx) { const p = ctx.partita; return p.punti.map((x, i) => `<span>${esc(i === ctx.mio ? 'Tu' : ctx.nome(i))} <b>${x}</b></span>`).join('') + '<span class="obiettivo">meno punti è meglio</span>'; },
    infoPosto(ctx, posto) { return `${ctx.partita.punti[posto]} punti`; },
    clic(ctx, el) {
      const ui = ctx.ui, az = el.dataset.az;
      if (az === 'tessera') { const k = Number(el.dataset.k); ui.sel = (ui.sel || []).includes(k) ? ui.sel.filter((x) => x !== k) : [...(ui.sel || []), k].sort((a, b) => a - b); suono([[500 + k * 30, 0.03]], { volume: 0.03 }); return ctx.ridisegna(); }
      if (az === 'tira' || az === 'tira1') return ctx.invia({ tipo: 'tira', uno: az === 'tira1' });
      if (az === 'chiudi') { const tessere = ui.sel; ui.sel = []; return ctx.invia({ tipo: 'chiudi', tessere }); }
    },
  };
  Object.assign(window.Tavoli, { shutbox: tavolo });
})();
