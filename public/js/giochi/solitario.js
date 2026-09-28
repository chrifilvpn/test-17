// SOLITARIO KLONDIKE: il mio tavolo (tallone, scarti, 4 basi, 7 colonne) e in alto l'avanzamento degli altri.
// Le carte si trascinano (mouse o dito) oppure si tocca la carta e poi la destinazione; doppio clic = sulla base.
// Il trascinamento usa un "fantasma" nel corpo della pagina, così sopravvive ai ridisegni del tavolo.
(() => {
  const { esc, suono } = window.Nuovi;
  let ctxA = null;
  let tOrologio = null;
  const fmt = (ms) => { const s = Math.max(0, Math.floor(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
  const attiva = () => ctxA && ctxA.stato && ctxA.partita && ctxA.partita.gioco === 'solitario';

  // attributi della sorgente di una carta
  const da = (tipo, i, k) => `data-da="${tipo}" data-i="${i ?? ''}" data-k="${k ?? ''}"`;
  const leggiDa = (el) => ({ tipo: el.dataset.da, i: el.dataset.i === '' ? undefined : Number(el.dataset.i), k: el.dataset.k === '' ? undefined : Number(el.dataset.k) });
  const stessoDa = (a, b) => a && b && a.tipo === b.tipo && a.i === b.i && a.k === b.k;

  function colonna(ctx, col, i) {
    const sel = ctx.ui.soSel;
    let y = 0;
    const carte = col.map((c, k) => {
      const top = y;
      y += c.su ? 1 : 0.55; // unità di spostamento (moltiplicate per la larghezza della carta in CSS)
      if (!c.su) return `<div class="so-pos" style="--y:${top}">${Carte.retro()}</div>`;
      const scelta = sel && sel.tipo === 'col' && sel.i === i && k >= sel.k;
      return `<div class="so-pos" style="--y:${top}">${Carte.fronte(c, `so-su ${scelta ? 'so-scelta' : ''}`, da('col', i, k))}</div>`;
    }).join('');
    return `<div class="so-col" data-dest="col" data-i="${i}" style="--h:${y}">${col.length ? '' : '<div class="carta vuota so-re" aria-hidden="true">K</div>'}${carte}</div>`;
  }

  function tavoloMio(ctx) {
    const p = ctx.partita, t = p.mio, sel = ctx.ui.soSel;
    const cimaScarti = t.scarti[t.scarti.length - 1];
    const scarti = cimaScarti
      ? `${t.scarti.length > 1 ? `<div class="so-sotto">${Carte.fronte(t.scarti[t.scarti.length - 2])}</div>` : ''}${Carte.fronte(cimaScarti, `so-su ${sel && sel.tipo === 'scarti' ? 'so-scelta' : ''}`, da('scarti'))}`
      : '<div class="carta vuota"></div>';
    const basi = t.basi.map((b, i) => {
      const c = b[b.length - 1];
      return `<div class="so-base" data-dest="base" data-i="${i}">${c ? Carte.fronte(c, `so-su ${sel && sel.tipo === 'base' && sel.i === i ? 'so-scelta' : ''}`, da('base', i)) : `<div class="carta vuota so-seme">${Carte.seme(['c', 'q', 'f', 'p'][i])}</div>`}</div>`;
    }).join('');
    const tallone = t.tallone
      ? `<div class="so-tallone" data-az="pesca" role="button" tabindex="0" aria-label="Pesca una carta (ne restano ${t.tallone})">${Carte.retro()}<span>${t.tallone}</span></div>`
      : `<div class="so-tallone vuoto" data-az="pesca" role="button" tabindex="0" aria-label="Rigira gli scarti"><div class="carta vuota">${t.nScarti ? '↻' : ''}</div></div>`;
    return `<div class="so-alto">${tallone}<div class="so-scarti">${scarti}</div><div class="so-spazio"></div>${basi}</div>
      <div class="so-colonne">${t.colonne.map((c, i) => colonna(ctx, c, i)).join('')}</div>`;
  }

  function altri(ctx) {
    const p = ctx.partita;
    if (p.n === 1) return '';
    return `<div class="so-gara">${p.altri.map((x, i) => `<div class="so-riga ${i === ctx.mio ? 'mia' : ''} st-${x.stato}">
      <span class="so-nome">${esc(i === ctx.mio ? 'Tu' : ctx.nome(i))}</span>
      <span class="so-barra"><i style="width:${(100 * x.basi) / 52}%"></i></span>
      <span class="so-num">${x.stato === 'finito' ? `🏆 ${fmt(x.tempo)}` : x.stato === 'arreso' ? `🏳️ ${x.basi}` : `${x.basi}/52`}</span>
      <span class="so-cime">${x.cime.map((c) => (c ? `<b class="${c.seme === 'c' || c.seme === 'q' ? 'rosso' : ''}">${Carte.sigla(c)}${Carte.seme(c.seme)}</b>` : '<b class="vuoto">·</b>')).join('')}</span>
    </div>`).join('')}</div>`;
  }

  const tavolo = {
    libero: true,
    reset(ctx) { ctxA = ctx; },
    panno(ctx) {
      const p = ctx.partita;
      const ui = ctx.ui;
      ui._soT0 = Date.now() - p.trascorso;
      const tuttoSu = p.mio.tallone === 0 && p.mio.nScarti === 0 && p.mio.colonne.every((c) => c.every((x) => x.su));
      const rec = p.record && p.record.length ? `<details class="so-record"><summary>Tempi migliori</summary><ol>${p.record.map((r) => `<li>${fmt(r.tempo)} <small>(${r.mosse} mosse)</small></li>`).join('')}</ol></details>` : '';
      return `<div class="so">
        <div class="so-info"><span class="so-tempo">${fmt(p.trascorso)}</span>${p.limite ? `<span class="piccolo">limite ${p.limite} min</span>` : ''}
          <span class="piccolo">${p.mosse} mosse · ${p.giri} ${p.giri === 1 ? 'giro' : 'giri'} del tallone</span>${rec}</div>
        ${altri(ctx)}
        <div class="so-tavolo ${p.stato !== 'gioca' || p.finita ? 'fermo' : ''}">${tavoloMio(ctx)}</div>
        ${tuttoSu && p.stato === 'gioca' && !p.finita ? '<button type="button" class="bottone primario so-finisci" data-az="finisci">✨ Finisci: tutte sulle basi</button>' : ''}
      </div>`;
    },
    azioni(ctx) {
      const p = ctx.partita;
      if (p.finita) return '';
      if (p.stato === 'finito') return '<span class="suggerimento">Hai finito! 🏆</span>';
      if (p.stato === 'arreso') return '<span class="suggerimento">Ti sei arreso: guardi gli altri</span>';
      return `<span class="suggerimento">Trascina le carte, oppure toccane una e poi dove metterla. Doppio clic: sulla base.</span>
        <button type="button" class="bottone mini-bt" data-az="arrenditi">🏳️ Mi arrendo</button>`;
    },
    dopo(ctx) {
      clearInterval(tOrologio);
      const p = ctx.partita;
      if (p.finita || p.inPausa || p.stato !== 'gioca') return;
      tOrologio = setInterval(() => { const el = document.querySelector('.so-tempo'); if (!el || !attiva()) return clearInterval(tOrologio); el.textContent = fmt(Date.now() - ctx.ui._soT0); }, 500);
    },
    stato(ctx) {
      const p = ctx.partita;
      if (p.finita) return null;
      if (p.inPausa) return 'In pausa';
      return p.n === 1 ? 'Solitario' : p.stato === 'gioca' ? 'Gara: il primo che finisce vince' : 'Aspetta gli altri';
    },
    punteggio(ctx) {
      const p = ctx.partita;
      return p.altri.map((x, i) => `<span>${esc(i === ctx.mio ? 'Tu' : ctx.nome(i))} <b>${x.basi}</b></span>`).join('') + '<span class="obiettivo">carte sulle basi</span>';
    },
    infoPosto(ctx, posto) { const x = ctx.partita.altri[posto]; return x.stato === 'finito' ? `finito in ${fmt(x.tempo)}` : `${x.basi} sulle basi`; },
    clic(ctx, el) {
      const az = el.dataset.az;
      if (az === 'pesca') { ctx.ui.soSel = null; suono([[520, 0.03]], { volume: 0.03 }); return ctx.invia({ tipo: 'pesca' }); }
      if (az === 'arrenditi') { if (confirm('Vuoi davvero arrenderti? Conteranno le carte che hai messo sulle basi.')) ctx.invia({ tipo: 'arrenditi' }); return; }
      if (az === 'finisci') return ctx.invia({ tipo: 'finisci' });
    },
  };

  // ---------- trascinamento e tocchi ----------
  let drag = null;
  let ultimoTocco = { da: null, ora: 0 };

  function muovi(daSorgente, dest) {
    const ctx = ctxA;
    ctx.ui.soSel = null;
    ctx.invia({ tipo: 'muovi', da: daSorgente, a: dest });
    suono([[640, 0.03]], { volume: 0.03 });
  }
  function destDa(el) {
    const d = el && el.closest && el.closest('[data-dest]');
    if (!d || !d.closest('.so-tavolo')) return null;
    return { tipo: d.dataset.dest, i: Number(d.dataset.i) };
  }

  document.addEventListener('pointerdown', (e) => {
    if (!attiva() || e.button > 0) return;
    const p = ctxA.partita;
    if (p.finita || p.stato !== 'gioca') return;
    const el = e.target.closest && e.target.closest('.so-tavolo [data-da]');
    if (!el) return;
    e.preventDefault();
    drag = { da: leggiDa(el), x0: e.clientX, y0: e.clientY, mosso: false, el, id: e.pointerId };
  });
  document.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    if (!drag.mosso && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 7) return;
    if (!drag.mosso) {
      drag.mosso = true;
      // il fantasma: la carta presa e, in una colonna, quelle che ha sopra
      const r = drag.el.getBoundingClientRect();
      drag.dx = drag.x0 - r.left; drag.dy = drag.y0 - r.top;
      const fantasma = document.createElement('div');
      fantasma.className = 'so-fantasma';
      fantasma.style.setProperty('--w', `${r.width}px`);
      const fonti = drag.da.tipo === 'col'
        ? [...document.querySelectorAll(`.so-tavolo [data-da="col"][data-i="${drag.da.i}"]`)].filter((x) => Number(x.dataset.k) >= drag.da.k)
        : [drag.el];
      fonti.forEach((x, k) => {
        const c = x.cloneNode(true);
        c.classList.remove('so-scelta');
        c.style.top = `${x.getBoundingClientRect().top - r.top}px`;
        c.style.setProperty('--w', `${r.width}px`);
        fantasma.append(c);
        x.style.visibility = 'hidden';
        if (k === 0) fantasma.style.height = `${r.height}px`;
      });
      document.body.append(fantasma);
      drag.fantasma = fantasma;
    }
    drag.fantasma.style.transform = `translate(${e.clientX - drag.dx}px, ${e.clientY - drag.dy}px)`;
  });
  function fine(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    if (d.mosso) {
      d.fantasma.remove();
      const sotto = document.elementFromPoint(e.clientX, e.clientY);
      const dest = destDa(sotto);
      if (dest && !(d.da.tipo === dest.tipo && d.da.i === dest.i)) muovi(d.da, dest);
      ctxA.ridisegna();
      return;
    }
    // tocco: doppio = sulla base; altrimenti selezione o spostamento verso la carta toccata
    const ora = Date.now();
    const ui = ctxA.ui;
    if (stessoDa(ultimoTocco.da, d.da) && ora - ultimoTocco.ora < 380) { ultimoTocco = { da: null, ora: 0 }; return muovi(d.da, { tipo: 'base', i: 'auto' }); }
    ultimoTocco = { da: d.da, ora };
    if (ui.soSel && !stessoDa(ui.soSel, d.da)) {
      const dest = destDa(d.el);
      if (dest && !(ui.soSel.tipo === dest.tipo && ui.soSel.i === dest.i)) return muovi(ui.soSel, dest);
    }
    ui.soSel = stessoDa(ui.soSel, d.da) ? null : d.da;
    ctxA.ridisegna();
  }
  document.addEventListener('pointerup', fine);
  document.addEventListener('pointercancel', (e) => { if (drag && drag.fantasma) drag.fantasma.remove(); drag = null; if (attiva()) ctxA.ridisegna(); });
  // tocco su una colonna vuota o su una base vuota con una carta selezionata
  document.addEventListener('click', (e) => {
    if (!attiva() || !ctxA.ui.soSel) return;
    if (e.target.closest('[data-da]')) return;
    const dest = destDa(e.target);
    if (dest) muovi(ctxA.ui.soSel, dest);
  });

  Object.assign(window.Tavoli, { solitario: tavolo });
})();
