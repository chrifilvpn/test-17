// THE MIND: la pila al centro con l'ultima carta grande, le mie carte in basso e il pulsantone per giocare la più bassa.
// Le carte sono disegnate qui (SVG): un numero grande e un colore che va dal blu (1) al rosso (100).
// Spazio o Invio giocano la carta più bassa (se non si sta scrivendo in chat).
(() => {
  const { esc, ritardo, primaVolta, suono } = window.Nuovi;

  const tinta = (n) => Math.round(220 - (n - 1) * 2.1); // 1 = blu, 100 = rosso
  function carta(n, cls = '', attr = '') {
    const h = tinta(n);
    // cerchi concentrici: più il numero è alto più sono fitti
    const giri = 2 + Math.floor(n / 20);
    const cerchi = Array.from({ length: giri }, (_, k) => `<circle cx="50" cy="70" r="${12 + k * (26 / giri)}" />`).join('');
    return `<div class="mi-carta ${cls}" style="--h:${h}" ${attr} title="Carta ${n}">
      <svg viewBox="0 0 100 140" aria-hidden="true"><rect x="3" y="3" width="94" height="134" rx="10" class="mi-fondo"/>
      <g class="mi-cerchi">${cerchi}</g>
      <text x="12" y="24" class="mi-angolo">${n}</text><text x="88" y="130" class="mi-angolo" text-anchor="end">${n}</text>
      <text x="50" y="84" class="mi-numero" text-anchor="middle">${n}</text></svg></div>`;
  }
  const retro = (cls = '') => `<div class="mi-carta retro ${cls}"><svg viewBox="0 0 100 140" aria-hidden="true"><rect x="3" y="3" width="94" height="134" rx="10"/><circle cx="50" cy="70" r="26"/><circle cx="50" cy="70" r="12"/></svg></div>`;

  const cuori = (n) => `<span class="mi-vite" title="${n} vite">${'❤️'.repeat(Math.max(0, n))}${n <= 0 ? '💔' : ''}</span>`;
  const stelle = (n) => `<span class="mi-stelle" title="${n} stelle ninja">${n ? '⭐'.repeat(n) : '<small>nessuna stella</small>'}</span>`;
  const chi = (ctx, i) => (i === ctx.mio ? 'Tu' : ctx.nome(i));

  function centro(ctx) {
    const p = ctx.partita;
    if (p.fase === 'pronti' || p.fase === 'via') {
      const io = p.pronti[ctx.mio];
      const lista = p.pronti.map((x, i) => `<span class="mi-pronto ${x ? 'si' : ''}">${x ? '✋' : '…'} ${esc(chi(ctx, i))}</span>`).join('');
      if (p.fase === 'via') return `<div class="mi-annuncio"><p class="mi-grande">Via!</p><p class="piccolo">In silenzio, quando te la senti…</p></div>`;
      return `<div class="mi-annuncio"><p class="mi-titolo">${p.ultimoErrore && p.pila.length ? 'Respirate e riconcentratevi' : `Livello ${p.livello}`}</p>
        <p class="piccolo">${p.ultimoErrore && p.pila.length ? 'Dopo un errore ci si riconcentra: premete tutti Pronto.' : `${p.livello} ${p.livello === 1 ? 'carta' : 'carte'} a testa. Guardate le vostre carte e, quando siete concentrati, premete Pronto.`}</p>
        <div class="mi-pronti">${lista}</div>
        ${io ? '<p class="piccolo">Aspettiamo gli altri…</p>' : '<button type="button" class="bottone primario mi-bt-pronto" data-az="pronto">✋ Pronto</button>'}</div>`;
    }
    if (p.fase === 'errore' && p.ultimoErrore) {
      const e = p.ultimoErrore;
      return `<div class="mi-annuncio mi-errore" style="${ritardo(ctx.ui, `err-${e.id}`)}"><p class="mi-titolo">💔 Troppo presto!</p>
        <p><b>${esc(chi(ctx, e.posto))}</b> ha giocato il ${e.carta}, ma c'era ancora:</p>
        <div class="mi-fila">${e.basse.map((x) => `<figure>${carta(x.carta, 'piccola')}<figcaption>${esc(chi(ctx, x.posto))}</figcaption></figure>`).join('')}</div>
        <p class="piccolo">Queste carte si scartano. Poi ci si riconcentra.</p></div>`;
    }
    if (p.fase === 'stella' && p.ultimaStella) {
      return `<div class="mi-annuncio" style="${ritardo(ctx.ui, `st-${p.ultimaStella.id}`)}"><p class="mi-titolo">⭐ Stella ninja</p>
        <p class="piccolo">Ognuno ha scartato la sua carta più bassa:</p>
        <div class="mi-fila">${p.ultimaStella.carte.map((x) => `<figure>${carta(x.carta, 'piccola')}<figcaption>${esc(chi(ctx, x.posto))}</figcaption></figure>`).join('')}</div></div>`;
    }
    if (p.fase === 'fallito') {
      return `<div class="mi-annuncio mi-errore" style="${ritardo(ctx.ui, `fall-${p.livello}-${p.tentativi}`)}"><p class="mi-titolo">💔 Vite finite</p>
        <p>Niente paura: <b>si ricomincia il livello ${p.livello}</b> con carte nuove.</p>
        <p class="piccolo">Per smettere: "Termina" (decide la maggioranza) o "Torna al tavolo".</p></div>`;
    }
    if (p.fase === 'livello') {
      return `<div class="mi-annuncio mi-festa"><p class="mi-grande">Livello ${p.livello} superato!</p>
        ${p.premio && p.premio.length ? `<p>In regalo: ${esc(p.premio.join(' e '))}</p>` : ''}
        <p class="piccolo">Prossimo livello: ${p.livello + 1} ${p.livello + 1 === 1 ? 'carta' : 'carte'} a testa.</p></div>`;
    }
    // la pila: le ultime carte a ventaglio, l'ultima grande
    const pila = p.pila;
    if (!pila.length) return '<div class="mi-pila vuota"><p>Nessuna carta giocata</p><p class="piccolo">Chi ha la carta più bassa… aspetta il momento giusto.</p></div>';
    const ultima = pila[pila.length - 1];
    const prima = pila.slice(0, -1).slice(-6);
    return `<div class="mi-pila">
      <div class="mi-vecchie">${prima.map((x, k) => carta(x.carta, `vecchia ${x.errore ? 'sbagliata' : ''}`, `style="--k:${k - prima.length}"`)).join('')}</div>
      <div class="mi-ultima" style="${ritardo(ctx.ui, `gioc-${p.livello}-${p.giocateLivello}`)}">${carta(ultima.carta, `grande ${ultima.errore ? 'sbagliata' : ''}`)}<p>${esc(chi(ctx, ultima.posto))}</p></div>
    </div>`;
  }

  const tavolo = {
    libero: true,
    reset(ctx) { attivo = ctx; },
    tick(ctx, d) { attivo = ctx; if (d && d.pausa !== ctx.ui._miPausa) { ctx.ui._miPausa = d.pausa; } },
    panno(ctx) {
      const p = ctx.partita;
      const pr = p.proposta;
      let banner = '';
      if (pr && !p.finita) {
        const mioVoto = pr.voti[ctx.mio];
        banner = `<div class="mi-proposta">⭐ <b>${esc(chi(ctx, pr.da))}</b> ${pr.da === ctx.mio ? 'hai proposto' : 'propone'} una stella ninja.
          ${mioVoto === null ? '<button type="button" class="bottone mini-bt" data-az="stella-si">Sì</button><button type="button" class="bottone mini-bt" data-az="stella-no">No</button>'
            : `<span class="piccolo">Voti: ${pr.voti.map((v, i) => `${esc(chi(ctx, i))} ${v === null ? '…' : v ? '👍' : '👎'}`).join(' · ')}</span>`}</div>`;
      }
      const scartate = p.scartate.length ? `<p class="piccolo mi-scartate">Scartate: ${p.scartate.map((x) => `<span class="${x.come}" title="${x.come === 'stella' ? 'con la stella ninja' : 'per errore'}">${x.carta}</span>`).join(' ')}</p>` : '';
      const fine = p.finita && p.mani ? `<p class="piccolo">Carte rimaste: ${p.mani.map((m, i) => `${esc(chi(ctx, i))} ${m.length ? m.join(', ') : '—'}`).join(' · ')}</p>` : '';
      return `<div class="mi">
        <div class="mi-testa"><span class="pa-round">Livello ${p.livello} di ${p.maxLivello}${p.tentativi > 1 ? ` · tentativo ${p.tentativi}` : ''}</span>${cuori(p.vite)}${stelle(p.stelle)}</div>
        ${banner}
        <div class="mi-centro">${centro(ctx)}</div>
        ${scartate}${fine}
      </div>`;
    },
    mano(ctx) {
      const p = ctx.partita;
      if (!p.mano.length) return `<p class="piccolo mi-vuota">${p.finita ? '' : 'Hai giocato tutte le tue carte: ora tocca agli altri 🤞'}</p>`;
      return `<div class="mi-mano">${p.mano.map((n, k) => carta(n, k === 0 ? 'prossima' : '')).join('')}</div>`;
    },
    azioni(ctx) {
      const p = ctx.partita;
      if (p.finita) return '';
      const posso = p.fase === 'gioco' && !p.proposta && p.mano.length && !(p.stato && p.stato.pausa);
      const stella = p.fase === 'gioco' && !p.proposta && p.stelle > 0 && p.mano.length
        ? `<button type="button" class="bottone mi-bt-stella" data-az="stella" title="Proponi di usare una stella ninja">⭐ Stella ninja</button>` : '';
      if (!p.mano.length) return stella;
      return `<button type="button" class="bottone primario mi-bt-gioca" data-az="gioca" ${posso ? '' : 'disabled'}>Gioca il ${p.mano[0]} <small>(spazio)</small></button>${stella}`;
    },
    dopo(ctx) {
      const p = ctx.partita;
      if (p.pila.length && primaVolta(ctx.ui, `s-${p.livello}-${p.giocateLivello}`)) {
        const u = p.pila[p.pila.length - 1];
        suono(u.errore ? [[220, 0.12], [150, 0.3]] : [[380 + u.carta * 5, 0.07]], { volume: u.errore ? 0.1 : 0.06 });
      }
      if (p.fase === 'livello' && primaVolta(ctx.ui, `lv-${p.livello}`)) suono([[523, 0.1], [659, 0.1], [784, 0.2]], { volume: 0.08 });
    },
    stato(ctx) {
      const p = ctx.partita;
      if (p.finita) return null;
      if (p.stato && p.stato.pausa) return 'In pausa';
      return { pronti: 'Concentrazione…', via: 'Via!', gioco: p.mano.length ? 'Quando te la senti, gioca' : 'Guarda gli altri', errore: 'Errore!', stella: 'Stella ninja', livello: 'Livello superato', fallito: 'Si ricomincia il livello' }[p.fase] || null;
    },
    punteggio(ctx) {
      const p = ctx.partita;
      return `<span>Livello <b>${p.livello}/${p.maxLivello}</b></span><span>Vite <b>${p.vite}</b></span><span>Stelle <b>${p.stelle}</b></span><span class="obiettivo">tutti insieme, in ordine crescente</span>`;
    },
    infoPosto(ctx, posto) {
      const p = ctx.partita;
      const n = p.carte[posto];
      const pronto = p.fase === 'pronti' ? (p.pronti[posto] ? ' · ✋ pronto' : ' · si concentra…') : '';
      return `${n ? `🂠 ${n} ${n === 1 ? 'carta' : 'carte'}` : 'nessuna carta'}${pronto}`;
    },
    clic(ctx, el) {
      const az = el.dataset.az;
      if (az === 'pronto') return ctx.invia({ tipo: 'pronto' });
      if (az === 'gioca') { el.disabled = true; return ctx.invia({ tipo: 'gioca' }); }
      if (az === 'stella') return ctx.invia({ tipo: 'stella' });
      if (az === 'stella-si') return ctx.invia({ tipo: 'stella', si: true });
      if (az === 'stella-no') return ctx.invia({ tipo: 'stella', si: false });
    },
  };
  let attivo = null;
  // Spazio o Invio: gioca la carta più bassa (o "Pronto" durante la concentrazione)
  document.addEventListener('keydown', (e) => {
    const ctx = attivo;
    if (!ctx || !ctx.stato || !ctx.partita || ctx.partita.gioco !== 'mind' || ctx.partita.finita || (window.Boss && Boss.attivo)) return;
    if (e.target.closest && e.target.closest('input, textarea, select, button')) return;
    if (e.key !== ' ' && e.key !== 'Enter') return;
    const p = ctx.partita;
    if (p.fase === 'pronti' && !p.pronti[ctx.mio]) { e.preventDefault(); ctx.invia({ tipo: 'pronto' }); }
    else if (p.fase === 'gioco' && !p.proposta && p.mano.length) { e.preventDefault(); ctx.invia({ tipo: 'gioca' }); }
  });
  Object.assign(window.Tavoli, { mind: tavolo });
})();
