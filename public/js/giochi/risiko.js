// RISIKO: mappa a esagoni disegnata in SVG da RisikoMappa (stesso file del server). Si clicca sui territori:
// nei rinforzi per piazzare, negli attacchi prima il tuo territorio e poi quello da attaccare, a fine turno per spostare.
(() => {
  const { esc, ritardo, primaVolta, suono } = window.Nuovi;
  const { MAPPE } = window.RisikoMappa;
  const COLORI = ['#d64541', '#3b7dd8', '#3aa655', '#e0b020', '#8e55c9', '#4a4a4a'];
  const NOMI_COL = ['rosso', 'blu', 'verde', 'giallo', 'viola', 'nero'];
  // geometria di una mappa (esagoni, bordi dei territori e dei continenti, linee sul mare), calcolata una volta
  let MP, forme, bordiT, bordiC, linee, colCont, mappaAttiva = null;
  const cache = {};
  const angoli = Array.from({ length: 6 }, (_, k) => ((60 * k - 30) * Math.PI) / 180);
  // vicino che sta oltre il lato k (0 = est, 1 = sud-est, 2 = sud-ovest, 3 = ovest, 4 = nord-ovest, 5 = nord-est)
  const oltre = (r, c, k) => {
    const d = r % 2 ? [[0, 1], [1, 1], [1, 0], [0, -1], [-1, 0], [-1, 1]] : [[0, 1], [1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0]];
    return [r + d[k][0], c + d[k][1]];
  };
  function geometria(M) {
    const spigolo = (x, y, k) => [x + M.R * Math.cos(angoli[k]), y + M.R * Math.sin(angoli[k])];
    const f = {}, bT = [], bC = [];
    for (const t of M.TERRITORI) {
      f[t] = M.esagoni[t].map(([r, c]) => {
        const [x, y] = M.centro(r, c);
        const pts = angoli.map((_, k) => spigolo(x, y, k).map((v) => v.toFixed(1)).join(','));
        for (let k = 0; k < 6; k++) {
          const [rr, cc] = oltre(r, c, k);
          const u = (M.RIGHE[rr] || '')[cc] || '.';
          if (u === t) continue;
          const [a, b] = [spigolo(x, y, k), spigolo(x, y, (k + 1) % 6)];
          const seg = `M${a[0].toFixed(1)},${a[1].toFixed(1)}L${b[0].toFixed(1)},${b[1].toFixed(1)}`;
          if (u === '.' || M.continenteDi[u] !== M.continenteDi[t]) bC.push({ seg, cont: M.continenteDi[t] });
          else if (u > t) bT.push(seg);
        }
        return `M${pts.join('L')}Z`;
      }).join('');
    }
    // linee sul mare: tra gli esagoni più vicini dei due territori; quelle "dietro la mappa" escono dai bordi
    const l = M.MARE.map(([a, b]) => {
      if (M.avvolge.includes(a + b) || M.avvolge.includes(b + a)) {
        const bordo = (t) => { const cs = M.esagoni[t].map(([r, c]) => M.centro(r, c)); return cs.reduce((x, y) => (Math.min(y[0], M.LARGHEZZA - y[0]) < Math.min(x[0], M.LARGHEZZA - x[0]) ? y : x)); };
        return [a, b].map((t) => { const q = bordo(t); const x2 = q[0] < M.LARGHEZZA / 2 ? 0 : M.LARGHEZZA; return `<line x1="${q[0].toFixed(1)}" y1="${q[1].toFixed(1)}" x2="${x2.toFixed(1)}" y2="${q[1].toFixed(1)}"/>`; }).join('');
      }
      let best = null;
      for (const [r1, c1] of M.esagoni[a]) for (const [r2, c2] of M.esagoni[b]) {
        const p = M.centro(r1, c1), q = M.centro(r2, c2), d = Math.hypot(p[0] - q[0], p[1] - q[1]);
        if (!best || d < best.d) best = { d, p, q };
      }
      return `<line x1="${best.p[0].toFixed(1)}" y1="${best.p[1].toFixed(1)}" x2="${best.q[0].toFixed(1)}" y2="${best.q[1].toFixed(1)}"/>`;
    }).join('');
    return { MP: M, forme: f, bordiT: bT, bordiC: bC, linee: l, colCont: Object.fromEntries(M.CONTINENTI.map((c) => [c.id, c.colore])) };
  }
  function usaMappa(id) {
    const chiave = MAPPE[id] ? id : 'inventata';
    if (mappaAttiva === chiave) return;
    if (!cache[chiave]) cache[chiave] = geometria(MAPPE[chiave]);
    ({ MP, forme, bordiT, bordiC, linee, colCont } = cache[chiave]);
    mappaAttiva = chiave;
  }

  function dadi(valori, cls) {
    const PIP = { 1: [[50, 50]], 2: [[28, 28], [72, 72]], 3: [[26, 26], [50, 50], [74, 74]], 4: [[28, 28], [72, 28], [28, 72], [72, 72]], 5: [[26, 26], [74, 26], [50, 50], [26, 74], [74, 74]], 6: [[28, 24], [72, 24], [28, 50], [72, 50], [28, 76], [72, 76]] };
    return valori.map((v) => `<svg class="rk-dado ${cls}" viewBox="0 0 100 100" aria-label="${v}"><rect x="4" y="4" width="92" height="92" rx="18"/>${PIP[v].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9"/>`).join('')}</svg>`).join('');
  }
  const FIG = { fante: '🪖', cannone: '💣', cavaliere: '🐎', jolly: '⭐' };

  const chi = (ctx, i) => (i === ctx.mio ? 'Tu' : ctx.nome(i));
  const miaFase = (ctx) => {
    const p = ctx.partita;
    if (p.finita) return null;
    if (p.fase === 'schieramento') return p.daPiazzare[ctx.mio] > 0 ? 'schiera' : null;
    return p.turno === ctx.mio ? p.fase : null;
  };
  const daMettere = (ctx) => {
    const p = ctx.partita, f = miaFase(ctx);
    const totale = f === 'schiera' ? p.daPiazzare[ctx.mio] : f === 'rinforzi' ? p.rinforzi : 0;
    const messe = Object.values(ctx.ui.rkPiazza || {}).reduce((s, v) => s + v, 0);
    return { totale, messe, resto: totale - messe };
  };

  function mappa(ctx) {
    const p = ctx.partita, ui = ctx.ui, f = miaFase(ctx);
    const sel = ui.rkSel, bers = ui.rkBers;
    const cliccabili = new Set();
    if (f === 'schiera' || f === 'rinforzi') MP.TERRITORI.forEach((t) => { if (p.terr[t].owner === ctx.mio) cliccabili.add(t); });
    if (f === 'attacco' || f === 'spostamento') MP.TERRITORI.forEach((t) => {
      if (p.terr[t].owner === ctx.mio && p.terr[t].armate >= 2) cliccabili.add(t);
      if (sel && MP.ADIACENTI[sel].includes(t) && ((f === 'attacco' && p.terr[t].owner !== ctx.mio) || (f === 'spostamento' && p.terr[t].owner === ctx.mio))) cliccabili.add(t);
    });
    const vicini = sel ? new Set(MP.ADIACENTI[sel]) : new Set();
    const lancio = p.ultimoLancio;
    if (MP.svg) return mappaVera(ctx, cliccabili, vicini, sel, bers, lancio);
    const territori = MP.TERRITORI.map((t) => {
      const x = p.terr[t];
      const cls = [t === sel ? 'sel' : '', t === bers ? 'bers' : '', sel && vicini.has(t) && cliccabili.has(t) ? 'bersagliabile' : '', cliccabili.has(t) ? 'clic' : ''].join(' ');
      return `<path class="rk-t ${cls}" d="${forme[t]}" fill="${COLORI[x.owner]}" data-az="terr" data-t="${t}"><title>${esc(MP.NOMI[t])} (${esc(MP.CONTINENTI.find((c) => c.id === MP.continenteDi[t]).nome)}): ${x.armate} armate, ${esc(chi(ctx, x.owner))}</title></path>`;
    }).join('');
    const etichette = MP.TERRITORI.map((t) => {
      const [ex, ey] = MP.ETICHETTA[t];
      const x = p.terr[t];
      const agg = (ui.rkPiazza || {})[t] || 0;
      return `<g class="rk-et ${lancio && lancio.a === t ? 'colpito' : ''}" transform="translate(${ex.toFixed(1)},${ey.toFixed(1)})" pointer-events="none">
        <circle r="${MP.R >= 12 ? 11.5 : 8.5}" stroke="${COLORI[x.owner]}"/><text y="${MP.R >= 12 ? 4.5 : 3.4}">${x.armate + agg}</text>${agg ? `<text class="rk-agg" y="${MP.R >= 12 ? -15 : -11}">+${agg}</text>` : ''}</g>`;
    }).join('');
    return `<svg class="rk-mappa mappa-${MP.id}" viewBox="0 0 ${MP.LARGHEZZA.toFixed(0)} ${MP.ALTEZZA.toFixed(0)}" role="img" aria-label="Mappa di Risiko">
      <defs><pattern id="rk-onde" width="16" height="10" patternUnits="userSpaceOnUse"><path d="M0 6 Q4 2 8 6 T16 6" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="1.2"/></pattern></defs>
      <rect width="100%" height="100%" fill="#1d4f73"/><rect width="100%" height="100%" fill="url(#rk-onde)"/>
      <g class="rk-mare">${linee}</g>
      ${bordiC.map((b) => `<path class="rk-costa" d="${b.seg}" stroke="${colCont[b.cont]}"/>`).join('')}
      ${territori}
      <path class="rk-confini" d="${bordiT.join('')}"/>
      ${bordiC.map((b) => `<path class="rk-bordo-c" d="${b.seg}"/>`).join('')}
      ${etichette}
    </svg>`;
  }

  // la mappa del mondo come il tabellone vero: territori con le forme reali (percorsi SVG), coste colorate per
  // continente, confini sottili tra territori e più spessi tra continenti, rotte sul mare tratteggiate
  function mappaVera(ctx, cliccabili, vicini, sel, bers, lancio) {
    // come il tabellone vero: i territori hanno il colore (semitrasparente) del loro continente, e chi li possiede
    // si vede dalle armate, cioè dal gettone colorato con il numero
    const p = ctx.partita, V = MP.svg, ui = ctx.ui;
    const territori = MP.TERRITORI.map((t) => {
      const x = p.terr[t];
      const cls = [t === sel ? 'sel' : '', t === bers ? 'bers' : '', sel && vicini.has(t) && cliccabili.has(t) ? 'bersagliabile' : '', cliccabili.has(t) ? 'clic' : ''].join(' ');
      return `<path class="rk-t ${cls}" d="${V.territori[t]}" fill="${colCont[MP.continenteDi[t]]}" data-az="terr" data-t="${t}"><title>${esc(MP.NOMI[t])} (${esc(MP.CONTINENTI.find((c) => c.id === MP.continenteDi[t]).nome)}): ${x.armate} armate, ${esc(chi(ctx, x.owner))}</title></path>`;
    }).join('');
    const etichette = MP.TERRITORI.map((t) => {
      const [ex, ey] = V.etichette[t];
      const x = p.terr[t];
      const agg = (ui.rkPiazza || {})[t] || 0;
      return `<g class="rk-gettone ${lancio && lancio.a === t ? 'colpito' : ''} ${t === sel || t === bers ? 'attivo' : ''}" transform="translate(${ex},${ey})" pointer-events="none">
        <circle r="9.5" fill="${COLORI[x.owner]}"/><text y="3.5">${x.armate + agg}</text>${agg ? `<text class="rk-agg" y="-12.5">+${agg}</text>` : ''}</g>`;
    }).join('');
    const rotte = V.mare.map(([x1, y1, x2, y2]) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`).join('');
    // meridiani e paralleli ogni 30°, come sulle carte geografiche
    const K = V.W / 356;
    const griglia = [];
    for (let lon = -150; lon <= 180; lon += 30) griglia.push(`M${((lon + 172) * K).toFixed(1)},0V${V.H}`);
    for (let lat = 60; lat >= -30; lat -= 30) griglia.push(`M0,${((84 - lat) * K).toFixed(1)}H${V.W}`);
    const rosa = `<g class="rk-rosa" transform="translate(${(V.W * 0.055).toFixed(0)},${(V.H * 0.8).toFixed(0)})"><circle r="26"/><path d="M0 -30 L5 0 L0 30 L-5 0Z"/><path d="M-30 0 L0 5 L30 0 L0 -5Z" opacity=".6"/><text y="-33">N</text></g>`;
    return `<svg class="rk-mappa mappa-vera" viewBox="0 0 ${V.W} ${V.H}" role="img" aria-label="Mappa del mondo di Risiko">
      <defs><radialGradient id="rk-mare-v" cx="50%" cy="45%" r="75%"><stop offset="0" stop-color="#b9d6e4"/><stop offset="1" stop-color="#8db5cb"/></radialGradient>
        <filter id="rk-ombra" x="-5%" y="-5%" width="110%" height="110%"><feDropShadow dx="0" dy="1.5" stdDeviation="1.5" flood-color="#2d4b5c" flood-opacity=".45"/></filter></defs>
      <rect width="100%" height="100%" fill="url(#rk-mare-v)"/>
      <path class="rk-griglia" d="${griglia.join('')}"/>
      ${rosa}
      <g class="rk-mare">${rotte}</g>
      <g class="rk-terre" filter="url(#rk-ombra)">${territori}</g>
      <path class="rk-interni" d="${V.interni}"/>
      <path class="rk-tracont" d="${V.traContinenti}"/>
      ${etichette}
    </svg>`;
  }

  function pannelloLancio(ctx) {
    const l = ctx.partita.ultimoLancio;
    if (!l) return '';
    return `<div class="rk-lancio" style="${ritardo(ctx.ui, `rkd-${l.id}`)}"><span>${esc(MP.NOMI[l.da])} <small>(${esc(chi(ctx, l.attaccante))})</small></span>${dadi(l.dadiA, 'att')}<b>contro</b>${dadi(l.dadiD, 'dif')}<span>${esc(MP.NOMI[l.a])}</span>
      <small>${l.lanci > 1 ? `${l.lanci} lanci · ` : ''}attacco −${l.persiA} · difesa −${l.persiD}</small></div>`;
  }

  function carteMie(ctx) {
    const p = ctx.partita, ui = ctx.ui;
    if (!p.carte.length) return '';
    const scelte = ui.rkCarte || [];
    const puo = miaFase(ctx) === 'rinforzi';
    return `<div class="rk-carte">${p.carte.map((c) => `<button type="button" class="rk-carta ${scelte.includes(c.id) ? 'scelta' : ''}" ${puo ? `data-az="carta" data-c="${c.id}"` : 'disabled'} title="${c.territorio ? esc(MP.NOMI[c.territorio]) : 'Jolly'}">
      <span class="rk-fig">${FIG[c.figura]}</span><small>${c.territorio ? esc(MP.NOMI[c.territorio]) : 'Jolly'}</small></button>`).join('')}
      ${puo && p.tris.length ? `<span class="piccolo">Tris possibili: ${p.tris.map((t) => `<button type="button" class="bottone mini-bt" data-az="tris" data-ids="${t.ids.join(',')}">+${t.valore}</button>`).join('')}</span>` : ''}</div>`;
  }

  const tavolo = {
    libero: true,
    reset(ctx) {
      const ui = ctx.ui, p = ctx.partita;
      usaMappa(p.mappa);
      const chiave = `${p.fase}-${p.turno}`;
      if (ui.rkChiave !== chiave) { ui.rkChiave = chiave; ui.rkPiazza = {}; ui.rkSel = null; ui.rkBers = null; ui.rkCarte = []; ui.rkN = null; }
      if (ui.rkSel && (p.terr[ui.rkSel].owner !== ctx.mio || p.terr[ui.rkSel].armate < 2)) { ui.rkSel = null; ui.rkBers = null; }
      if (ui.rkBers && ui.rkSel && p.fase === 'attacco' && p.terr[ui.rkBers].owner === ctx.mio) ui.rkBers = null;
      if (!ui.rkPasso) ui.rkPasso = 1;
    },
    panno(ctx) {
      const p = ctx.partita;
      const conts = MP.CONTINENTI.map((c) => { const o = p.continenti.find((x) => x.id === c.id).owner; return `<span class="rk-cont" style="--c:${c.colore}" title="${esc([...c.terr].map((t) => MP.NOMI[t]).join(', '))}">${esc(c.nome)} <b>+${c.bonus}</b>${o !== null ? ` <i style="background:${COLORI[o]}" title="di ${esc(chi(ctx, o))}"></i>` : ''}</span>`; }).join('');
      const giocatori = Array.from({ length: p.n }, (_, i) => `<span class="rk-gioc ${p.turno === i ? 'turno' : ''} ${p.vivo[i] ? '' : 'morto'}"><i style="background:${COLORI[i]}"></i>${esc(chi(ctx, i))} <small>${p.territori[i]} terr · ${p.armateTot[i]} armate · 🃏${p.nCarte[i]}</small></span>`).join('');
      const log = p.log.slice(-5).map((r) => { const [q, testo] = r.split('|'); return `<li><i style="background:${COLORI[q]}"></i>${esc(testo)}</li>`; }).join('');
      return `<div class="rk">
        <div class="rk-gioc-lista">${giocatori}</div>
        ${p.missione ? `<details class="rk-missione"><summary>🎯 La tua missione segreta</summary><p>${esc(p.missione)}</p></details>` : ''}
        ${p.missioni ? `<p class="piccolo">Missioni: ${p.missioni.map((m, i) => `${esc(chi(ctx, i))}: ${esc(m)}`).join(' · ')}</p>` : ''}
        ${pannelloLancio(ctx)}
        <div class="rk-mappa-box">${mappa(ctx)}</div>
        <div class="rk-conts">${conts}</div>
        ${carteMie(ctx)}
        ${log ? `<ul class="rk-log">${log}</ul>` : ''}
      </div>`;
    },
    azioni(ctx) {
      const p = ctx.partita, ui = ctx.ui, f = miaFase(ctx);
      if (!f) return p.fase === 'schieramento' && !p.finita ? '<span class="suggerimento">Aspettiamo che gli altri schierino le armate…</span>' : '';
      if (f === 'rinforzi' && p.carte.length >= 5 && p.tris.length) {
        return `<span class="suggerimento">Hai ${p.carte.length} carte: prima devi giocare un tris</span>${p.tris.map((t) => `<button type="button" class="bottone primario rk-bt" data-az="tris" data-ids="${t.ids.join(',')}">Gioca tris +${t.valore}</button>`).slice(0, 3).join('')}`;
      }
      if (f === 'schiera' || f === 'rinforzi') {
        const { totale, resto } = daMettere(ctx);
        return `<span class="suggerimento">${f === 'schiera' ? 'Schieramento' : 'Rinforzi'}: clicca i tuoi territori. Da mettere: <b>${resto}</b> di ${totale}</span>
          <span class="rk-passo">${[1, 5, 'tutte'].map((x) => `<button type="button" class="bottone mini-bt ${ui.rkPasso === x ? 'attivo' : ''}" data-az="passo" data-v="${x}">${x === 'tutte' ? 'tutte' : `+${x}`}</button>`).join('')}</span>
          <button type="button" class="bottone mini-bt" data-az="annullaPiazza">Annulla</button>
          <button type="button" class="bottone mini-bt" data-az="auto">A caso</button>
          <button type="button" class="bottone primario rk-bt" data-az="confermaPiazza" ${resto === 0 ? '' : 'disabled'}>Conferma</button>`;
      }
      if (f === 'conquista') {
        const c = p.conquista, n = ui.rkN == null ? c.max : ui.rkN;
        return `<span class="suggerimento">Hai conquistato ${esc(MP.NOMI[c.a])}: quante armate sposti da ${esc(MP.NOMI[c.da])}?</span>
          <button type="button" class="bottone mini-bt" data-az="n" data-v="${c.min}">min ${c.min}</button>
          <button type="button" class="bottone mini-bt" data-az="n" data-v="${Math.max(c.min, n - 1)}">−</button><b class="rk-n">${n}</b>
          <button type="button" class="bottone mini-bt" data-az="n" data-v="${Math.min(c.max, n + 1)}">+</button>
          <button type="button" class="bottone mini-bt" data-az="n" data-v="${c.max}">max ${c.max}</button>
          <button type="button" class="bottone primario rk-bt" data-az="occupa">Sposta ${n}</button>`;
      }
      if (f === 'attacco') {
        const s = ui.rkSel, b = ui.rkBers;
        const dMax = s ? Math.min(3, p.terr[s].armate - 1) : 3;
        const dadiScelti = Math.min(ui.rkDadi || 3, dMax);
        const info = !s ? 'Scegli un tuo territorio con almeno 2 armate' : !b ? `Da ${esc(MP.NOMI[s])}: scegli chi attaccare` : `${esc(MP.NOMI[s])} (${p.terr[s].armate}) attacca ${esc(MP.NOMI[b])} (${p.terr[b].armate})`;
        return `<span class="suggerimento">${info}</span>
          ${s && b ? `<span class="rk-passo">${[1, 2, 3].filter((d) => d <= dMax).map((d) => `<button type="button" class="bottone mini-bt ${dadiScelti === d ? 'attivo' : ''}" data-az="dadi" data-v="${d}">${d} ${d === 1 ? 'dado' : 'dadi'}</button>`).join('')}</span>
          <button type="button" class="bottone primario rk-bt" data-az="attacca">🎲 Attacca</button>
          <button type="button" class="bottone rk-bt" data-az="blitz">Attacca fino in fondo</button>` : ''}
          <button type="button" class="bottone mini-bt" data-az="fineAttacchi">Basta attacchi</button>`;
      }
      if (f === 'spostamento') {
        const s = ui.rkSel, b = ui.rkBers;
        if (s && b) {
          const max = p.terr[s].armate - 1, n = Math.min(max, ui.rkN == null ? max : ui.rkN);
          return `<span class="suggerimento">Sposta da ${esc(MP.NOMI[s])} a ${esc(MP.NOMI[b])}:</span>
            <button type="button" class="bottone mini-bt" data-az="n" data-v="${Math.max(1, n - 1)}">−</button><b class="rk-n">${n}</b>
            <button type="button" class="bottone mini-bt" data-az="n" data-v="${Math.min(max, n + 1)}">+</button>
            <button type="button" class="bottone primario rk-bt" data-az="sposta">Sposta ${n} e finisci</button>
            <button type="button" class="bottone mini-bt" data-az="fineTurno">Finisci senza spostare</button>`;
        }
        return `<span class="suggerimento">Spostamento: scegli un tuo territorio e poi uno tuo confinante (oppure finisci il turno)</span>
          <button type="button" class="bottone primario rk-bt" data-az="fineTurno">Fine turno</button>`;
      }
      return '';
    },
    dopo(ctx) {
      const l = ctx.partita.ultimoLancio;
      if (l && primaVolta(ctx.ui, `rks-${l.id}`)) suono([[300, 0.04], [360, 0.04], [420, 0.05]], { tipo: 'square', volume: 0.04 });
    },
    stato(ctx) {
      const p = ctx.partita;
      if (p.finita) return null;
      if (p.fase === 'schieramento') return p.daPiazzare[ctx.mio] > 0 ? 'Schiera le tue armate' : 'Gli altri schierano…';
      if (p.turno !== ctx.mio) return `Tocca a ${ctx.nome(p.turno)} (${{ rinforzi: 'rinforzi', attacco: 'attacca', conquista: 'conquista', spostamento: 'sposta' }[p.fase]})`;
      return { rinforzi: `Rinforzi: ${p.rinforzi} armate`, attacco: 'Attacca!', conquista: 'Territorio conquistato', spostamento: 'Spostamento' }[p.fase];
    },
    punteggio(ctx) {
      const p = ctx.partita;
      return `<span>Giro <b>${p.giro}</b></span><span>${p.obiettivo === 'missioni' ? '🎯 missioni segrete' : '🌍 conquista del mondo'}</span><span class="obiettivo">sei il ${NOMI_COL[ctx.mio]}</span>`;
    },
    infoPosto(ctx, posto) { const p = ctx.partita; return `${NOMI_COL[posto]} · ${p.territori[posto]} territori`; },
    clic(ctx, el) {
      const p = ctx.partita, ui = ctx.ui, f = miaFase(ctx), az = el.dataset.az;
      const ridisegna = () => ctx.ridisegna();
      if (az === 'terr') {
        const t = el.dataset.t, x = p.terr[t];
        if (f === 'schiera' || f === 'rinforzi') {
          if (x.owner !== ctx.mio) return;
          const { resto } = daMettere(ctx);
          if (resto <= 0) return;
          const k = ui.rkPasso === 'tutte' ? resto : Math.min(resto, ui.rkPasso);
          ui.rkPiazza[t] = (ui.rkPiazza[t] || 0) + k;
          suono([[520, 0.03]], { volume: 0.03 });
          return ridisegna();
        }
        if (f === 'attacco' || f === 'spostamento') {
          const nemico = x.owner !== ctx.mio;
          if (ui.rkSel && MP.ADIACENTI[ui.rkSel].includes(t) && (f === 'attacco' ? nemico : !nemico)) { ui.rkBers = t; ui.rkN = null; return ridisegna(); }
          if (!nemico && x.armate >= 2) { ui.rkSel = ui.rkSel === t ? null : t; ui.rkBers = null; ui.rkN = null; return ridisegna(); }
        }
        return;
      }
      if (az === 'passo') { ui.rkPasso = el.dataset.v === 'tutte' ? 'tutte' : Number(el.dataset.v); return ridisegna(); }
      if (az === 'annullaPiazza') { ui.rkPiazza = {}; return ridisegna(); }
      if (az === 'auto') {
        const { resto } = daMettere(ctx);
        const miei = MP.TERRITORI.filter((t) => p.terr[t].owner === ctx.mio);
        const confine = miei.filter((t) => MP.ADIACENTI[t].some((u) => p.terr[u].owner !== ctx.mio));
        const lista = confine.length ? confine : miei;
        for (let k = 0; k < resto; k++) { const t = lista[Math.floor(Math.random() * lista.length)]; ui.rkPiazza[t] = (ui.rkPiazza[t] || 0) + 1; }
        return ridisegna();
      }
      if (az === 'confermaPiazza') return ctx.invia({ tipo: f === 'schiera' ? 'schiera' : 'rinforza', piazza: ui.rkPiazza });
      if (az === 'carta') {
        const id = el.dataset.c;
        ui.rkCarte = ui.rkCarte.includes(id) ? ui.rkCarte.filter((x) => x !== id) : [...ui.rkCarte, id].slice(-3);
        if (ui.rkCarte.length === 3) { const ids = ui.rkCarte; ui.rkCarte = []; return ctx.invia({ tipo: 'tris', carte: ids }); }
        return ridisegna();
      }
      if (az === 'tris') return ctx.invia({ tipo: 'tris', carte: el.dataset.ids.split(',') });
      if (az === 'dadi') { ui.rkDadi = Number(el.dataset.v); return ridisegna(); }
      if (az === 'attacca' || az === 'blitz') {
        const dMax = Math.min(3, p.terr[ui.rkSel].armate - 1);
        return ctx.invia({ tipo: 'attacca', da: ui.rkSel, a: ui.rkBers, dadi: Math.min(ui.rkDadi || 3, dMax), continuo: az === 'blitz' });
      }
      if (az === 'n') { ui.rkN = Number(el.dataset.v); return ridisegna(); }
      if (az === 'occupa') { const c = p.conquista; const n = ui.rkN == null ? c.max : ui.rkN; ui.rkN = null; return ctx.invia({ tipo: 'occupa', n }); }
      if (az === 'fineAttacchi') { ui.rkSel = null; ui.rkBers = null; return ctx.invia({ tipo: 'fineAttacchi' }); }
      if (az === 'sposta') { const max = p.terr[ui.rkSel].armate - 1; return ctx.invia({ tipo: 'sposta', da: ui.rkSel, a: ui.rkBers, n: Math.min(max, ui.rkN == null ? max : ui.rkN) }); }
      if (az === 'fineTurno') return ctx.invia({ tipo: 'fineTurno' });
    },
  };
  Object.assign(window.Tavoli, { risiko: tavolo });
})();
