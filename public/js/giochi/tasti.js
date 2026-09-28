// TASTI IN ORDINE: la sequenza grande al centro, la lettera da premere evidenziata, le barre di tutti.
// I tasti vanno al server con l'evento 'input'; lo stato leggero arriva a ogni tick.
(() => {
  const { esc, suono } = window.Nuovi;
  const COLORI = ['#e8453c', '#2f7fd8', '#2e9d57', '#d19a2a', '#8e55c9', '#e36fa5', '#1fa3a3', '#e07b2c'];
  let ctxA = null, ultimo = null, mioIdx = 0, mieiErrori = 0, roundVisto = 0;

  function aggiorna() {
    const ctx = ctxA;
    if (!ctx || !ctx.partita || ctx.partita.gioco !== 'tasti' || !ultimo) return;
    const p = ctx.partita, t = ultimo;
    const box = document.querySelector('.tk');
    if (!box) return;
    if (t.round !== roundVisto) { roundVisto = t.round; mioIdx = 0; mieiErrori = 0; }
    // il server è la verità; tra un tick e l'altro uso il mio conteggio (più reattivo)
    mioIdx = Math.max(mioIdx, t.idx[ctx.mio] || 0);
    const seq = p.sequenza && t.fase !== 'via' ? p.sequenza : null;
    const lettere = box.querySelector('.tk-seq');
    if (lettere) lettere.innerHTML = seq ? [...seq].map((c, i) => `<span class="${i < mioIdx ? 'fatta' : i === mioIdx && t.tempi[ctx.mio] === null ? 'ora' : ''}">${c}</span>`).join('') : '<span class="tk-attesa">? ? ?</span>';
    const via = box.querySelector('.tk-via');
    if (via) { via.hidden = !(t.fase === 'via' || t.pausa); via.textContent = t.pausa ? '⏸ In pausa' : String(Math.ceil(t.via / 1000) || 'VIA!'); }
    const orologio = box.querySelector('.tk-orologio');
    if (orologio) orologio.textContent = t.fase === 'corsa' ? `${((t.tempi[ctx.mio] ?? t.t) / 1000).toFixed(2)} s` : t.fase === 'pausa' ? 'Fine round' : '';
    const barre = box.querySelector('.tk-barre');
    if (barre) barre.innerHTML = t.idx.map((k, i) => `<div class="tk-barra ${i === ctx.mio ? 'mia' : ''}"><span class="tk-nome">${esc(i === ctx.mio ? 'Tu' : ctx.nome(i))}</span>
      <span class="tk-pista"><i style="width:${(100 * k) / p.lunghezza}%;background:${COLORI[i % COLORI.length]}"></i></span>
      <span class="tk-t">${t.tempi[i] !== null ? `${(t.tempi[i] / 1000).toFixed(2)} s` : ''}${t.errori[i] ? ` <small>✗${t.errori[i]}</small>` : ''}</span></div>`).join('');
  }
  (function ciclo() { aggiorna(); requestAnimationFrame(ciclo); })();

  function premi(k) {
    const ctx = ctxA;
    if (!ctx || !ctx.partita || ctx.partita.gioco !== 'tasti' || !ultimo || ultimo.fase !== 'corsa' || ultimo.pausa) return;
    const p = ctx.partita;
    if (!p.sequenza || ultimo.tempi[ctx.mio] !== null) return;
    ctx.emetti('input', { k });
    if (k.toUpperCase() === p.sequenza[mioIdx]) { mioIdx++; suono([[500 + mioIdx * 40, 0.04]], { volume: 0.04 }); }
    else { mieiErrori++; suono([[160, 0.12]], { tipo: 'square', volume: 0.06 }); const s = document.querySelector('.tk-seq'); if (s) { s.classList.remove('errore'); void s.offsetWidth; s.classList.add('errore'); } }
  }
  document.addEventListener('keydown', (e) => {
    if (!ctxA || !ctxA.partita || ctxA.partita.gioco !== 'tasti' || (window.Boss && Boss.attivo)) return;
    if (e.target.closest && e.target.closest('input, textarea, select')) return; // si sta scrivendo in chat
    if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1 || !/[a-z]/i.test(e.key)) return;
    e.preventDefault();
    premi(e.key);
  });

  const TASTIERA = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
  const tavolo = {
    libero: true,
    reset(ctx) { ctxA = ctx; ultimo = ctx.partita.stato; },
    tick(ctx, d) { ctxA = ctx; ultimo = d; },
    panno(ctx) {
      const p = ctx.partita;
      return `<div class="tk">
        <p class="pa-round">Round ${ultimo ? ultimo.round : 1} di ${p.nRound} · ${p.lunghezza} tasti · errore = +${p.penalita / 1000} s</p>
        <div class="tk-riquadro"><div class="tk-seq"></div><div class="tk-via"></div></div>
        <p class="tk-orologio"></p>
        <div class="tk-barre"></div>
        <div class="tk-tastiera" aria-label="Tastiera sullo schermo">${TASTIERA.map((r) => `<div>${[...r].map((c) => `<button type="button" data-az="tasto" data-k="${c}">${c}</button>`).join('')}</div>`).join('')}</div>
      </div>`;
    },
    stato(ctx) { const t = ultimo; if (!t || ctx.partita.finita) return null; return t.fase === 'via' ? 'Pronti…' : t.fase === 'corsa' ? 'Scrivi!' : 'Fine round'; },
    punteggio(ctx) { const p = ctx.partita; return p.totali.map((x, i) => `<span style="color:${COLORI[i % COLORI.length]}">${esc(i === ctx.mio ? 'Tu' : ctx.nome(i))} <b>${(x / 1000).toFixed(2)} s</b></span>`).join('') + '<span class="obiettivo">vince il tempo più basso</span>'; },
    infoPosto(ctx, posto) { const p = ctx.partita; return `totale ${(p.totali[posto] / 1000).toFixed(1)} s`; },
    // i clic sulla tastiera dello schermo: si usa pointerdown (più veloce del clic sul telefono)
    clic() {},
  };
  document.addEventListener('pointerdown', (e) => {
    const b = e.target.closest && e.target.closest('.tk-tastiera [data-az=tasto]');
    if (!b) return;
    e.preventDefault();
    premi(b.dataset.k);
  });
  Object.assign(window.Tavoli, { tasti: tavolo });
})();
