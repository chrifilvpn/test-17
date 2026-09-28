// LA PEPPA TENCIA: il tavolo nel browser
(() => {
  const { esc, primaVolta, strato, calmo, suono } = window.Nuovi;
  const { carta, retro, NOMI } = window.PeppaCarte;
  const DURATA_VOLO = 750;

  function sede(ctx, posto) {
    const p = ctx.partita;
    const n = p.carteInMano[posto];
    const daPescare = p.turno === ctx.mio && p.fonti.includes(posto) && !p.inAttesa && !p.finita;
    const diTurno = p.turno === posto;
    const perso = p.finita && p.perdente === posto;
    let ventaglio;
    if (perso) ventaglio = carta('peppa', { cls: 'pp-perso' });
    else if (!n) ventaglio = '<span class="pp-salvo">nessuna carta</span>';
    else ventaglio = Array.from({ length: n }, (_, i) => retro({
      cls: daPescare ? 'pescabile' : '',
      attr: `${daPescare ? `data-az="pesca" data-da="${posto}" data-i="${i}" role="button" tabindex="0" aria-label="Carta ${i + 1} di ${esc(ctx.nome(posto))}"` : ''} style="--i:${i};--n:${n}"`,
    })).join('');
    const pt = p.punti[posto];
    return `<div class="pp-sede ${daPescare ? 'bersaglio' : ''}" data-sede="${posto}">
      <div class="targhetta ${diTurno ? 'di-turno' : ''}">${esc(ctx.nome(posto))}</div>
      <div class="pp-ventaglio ${n > 7 ? 'fitto' : ''}">${ventaglio}</div>
      <div class="info-posto">${n} ${n === 1 ? 'carta' : 'carte'} · <b>${pt}</b> ${pt === 1 ? 'coppia' : 'coppie'}${daPescare ? ' · <b>pesca qui!</b>' : ''}</div>
      <div class="bolla-posto" data-bolla="${posto}"></div></div>`;
  }

  function mazzo(ctx) {
    const p = ctx.partita;
    const puo = p.turno === ctx.mio && p.fonti.includes('mazzo') && !p.inAttesa && !p.finita;
    if (!p.mazzo) return '<div class="pp-mazzo vuoto"><span>Mazzo finito:<br>si pesca dagli altri</span></div>';
    return `<div class="pp-mazzo ${puo ? 'pescabile' : ''}" ${puo ? 'data-az="pesca" data-da="mazzo" role="button" tabindex="0" aria-label="Pesca dal mazzo"' : ''}>
      ${retro({ cls: 'sotto' })}${retro()}<span class="pp-mazzo-n">${p.mazzo}</span></div>`;
  }

  function mucchio(p) {
    const ultime = p.scarti.slice(-6);
    return `<div class="pp-mucchio" aria-label="${p.scarti.length} coppie scartate">${ultime.map((s, k) => `<div class="pp-coppia" style="--k:${k};--r:${((k * 37) % 21) - 10}deg">${carta(s.animale, { cls: 'piccola' })}${carta(s.animale, { cls: 'piccola seconda' })}</div>`).join('')}
      ${!p.scarti.length ? '<span class="pp-vuoto">qui vanno le coppie</span>' : ''}</div>
      <p class="pp-conta">${p.scarti.length} di ${p.nCoppie} coppie fatte</p>`;
  }

  const peppa = {
    libero: true,
    senzaFila: true,
    panno(ctx) {
      const p = ctx.partita;
      const altri = Array.from({ length: p.n - 1 }, (_, k) => (ctx.mio + 1 + k) % p.n);
      let msg;
      if (p.finita) msg = p.perdente === ctx.mio ? `Sei rimasto con la Peppa… 🐈‍⬛ −${p.penalita}` : p.perdente >= 0 ? `${esc(ctx.nome(p.perdente))} resta con la Peppa! −${p.penalita}` : 'Coppie finite!';
      else if (p.turno === ctx.mio && !p.inAttesa) msg = p.fonti.includes('mazzo') ? 'Tocca a te: pesca dal mazzo' : 'Tocca a te: pesca una carta da un avversario';
      else if (p.turno != null) msg = `Pesca ${esc(ctx.nome(p.turno))}`;
      else msg = '&nbsp;';
      return `<div class="pp">
        <div class="pp-altri">${altri.map((x) => sede(ctx, x)).join('')}</div>
        <div class="pp-centro"><div class="pp-banco">${mazzo(ctx)}<div>${mucchio(p)}</div></div><p class="pp-messaggio">${msg}</p></div></div>`;
    },
    mano(ctx) {
      const p = ctx.partita, ui = ctx.ui;
      const arriva = ui.arriva && Date.now() < ui.arriva.fino ? ui.arriva.id : null;
      if (!p.mano.length) return '<p class="pp-mano-vuota">Nessuna carta in mano: continui a pescare</p>';
      return `<div class="pp-mano" data-sede="${ctx.mio}">${p.mano.map((c, i) => carta(c.animale, {
        id: c.id, cls: `${c.animale === 'peppa' ? 'peppa-mia' : ''} ${c.id === arriva ? 'arriva' : ''}`, attr: `style="--i:${i}"`,
      })).join('')}</div>`;
    },
    azioni(ctx) {
      const p = ctx.partita;
      if (!p.mano.length || p.finita) return '';
      const haPeppa = p.mano.some((c) => c.animale === 'peppa');
      return `<button type="button" class="bottone" data-az="mescola" title="Cambia l'ordine delle tue carte">🔀 Mescola le mie carte</button>${haPeppa ? '<span class="pp-segreto">🤫 Hai la Peppa: la vedi col bordo rosso solo tu</span>' : ''}`;
    },
    dopo(ctx) { animaPesca(ctx); },
    statoAttesa(ctx) { const u = ctx.partita.ultimaPesca; return u && u.coppia ? `Coppia di ${NOMI[u.coppia]}!` : 'Pescata…'; },
    stato(ctx) {
      const p = ctx.partita;
      if (p.finita || p.turno == null) return null;
      return p.turno === ctx.mio ? 'Tocca a te: pesca' : `Pesca ${ctx.nome(p.turno)}`;
    },
    infoPosto(ctx, posto) { const x = ctx.partita.punti[posto]; return `${x} ${x === 1 ? 'coppia' : 'coppie'}`; },
    punteggio(ctx) {
      const p = ctx.partita;
      return p.punti.map((x, i) => `<span>${esc(i === ctx.mio ? 'Tu' : ctx.nome(i))} <b>${x}</b></span>`).join('') + `<span class="obiettivo">${p.nCoppie - p.scarti.length} coppie da fare · Peppa −${p.penalita}</span>`;
    },
    clic(ctx, el) {
      if (el.dataset.az === 'pesca') {
        el.classList.add('presa');
        return ctx.invia(el.dataset.da === 'mazzo' ? { tipo: 'pesca', da: 'mazzo' } : { tipo: 'pesca', da: Number(el.dataset.da), indice: Number(el.dataset.i) });
      }
      if (el.dataset.az === 'mescola') {
        const mano = document.querySelector('.pp-mano');
        if (mano) mano.classList.add('mescola');
        setTimeout(() => ctx.invia({ tipo: 'mescola' }), calmo() ? 0 : 280);
      }
    },
  };

  // ---------------- animazioni ----------------
  const centro = (el) => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height }; };
  function cartaVolante(frontHtml, w) {
    const el = document.createElement('div');
    el.className = 'pp-volo';
    el.style.setProperty('--w', `${w}px`);
    el.innerHTML = `<div class="pp-faccia davanti">${frontHtml}</div><div class="pp-faccia dietro">${retro()}</div>`;
    strato().append(el);
    return el;
  }
  function vola(el, da, a, { gira = false, durata = DURATA_VOLO, arco = 70 } = {}) {
    const w = el.offsetWidth, h = el.offsetHeight;
    const m = { x: (da.x + a.x) / 2, y: Math.min(da.y, a.y) - arco };
    const t = (pt, ry, s, rz) => `translate(${pt.x - w / 2}px, ${pt.y - h / 2}px) rotateY(${ry}deg) rotate(${rz}deg) scale(${s})`;
    return el.animate([
      { transform: t(da, gira ? 180 : 0, 0.75, -8) },
      { transform: t(m, gira ? 90 : 0, 1.18, 4), offset: 0.55 },
      { transform: t(a, 0, 1, 0) },
    ], { duration: durata, easing: 'cubic-bezier(.3,.7,.3,1)', fill: 'forwards' }).finished;
  }

  function animaPesca(ctx) {
    const p = ctx.partita, u = p.ultimaPesca;
    // la prima volta che si apre il tavolo (o dopo aver ricaricato la pagina) non si rianima la pesca vecchia
    if (ctx.ui._ppVisto === undefined) { ctx.ui._ppVisto = true; if (u) primaVolta(ctx.ui, `pesca-${u.id}`); return; }
    if (!u || !primaVolta(ctx.ui, `pesca-${u.id}`)) return;
    if (calmo()) { if (u.a === ctx.mio && u.carta === 'peppa') bruttissima(ctx, true); return; }
    const sedeDa = document.querySelector(u.da === 'mazzo' ? '.pp-mazzo' : u.da === ctx.mio ? '.pp-mano' : `.pp-sede[data-sede="${u.da}"] .pp-ventaglio`);
    const sedeA = document.querySelector(u.a === ctx.mio ? '.pp-mano' : `.pp-sede[data-sede="${u.a}"] .pp-ventaglio`);
    const pila = document.querySelector('.pp-mucchio');
    if (!sedeDa || !sedeA) return;
    const campione = document.querySelector('.pp-carta');
    const w = campione ? campione.getBoundingClientRect().width : 70;
    const da = centro(sedeDa);

    if (u.a === ctx.mio && u.carta === 'peppa') { bruttissima(ctx, false, da); return; }

    if (u.a === ctx.mio) {
      // pesco io: la carta vola dal vicino, si gira a metà strada e arriva in mano
      const volo = cartaVolante(carta(u.carta.split('-')[0]), w);
      suono([[660, 0.06], [880, 0.08]], { volume: 0.05 });
      if (u.coppia) {
        const qui = centro(sedeA);
        vola(volo, da, { x: qui.x, y: qui.y - 30 }, { gira: true }).then(() => {
          // la gemella sale dalla mano e le due vanno insieme sul mucchio
          const gemella = cartaVolante(carta(u.coppia), w);
          const dest = pila ? centro(pila) : qui;
          const a1 = vola(gemella, { x: qui.x + 30, y: qui.y + 20 }, { x: dest.x + 8, y: dest.y }, { durata: 520, arco: 40 });
          const a2 = vola(volo, { x: qui.x, y: qui.y - 30 }, { x: dest.x - 8, y: dest.y }, { durata: 520, arco: 40 });
          suono([[523, 0.08], [659, 0.08], [784, 0.08], [1046, 0.16]], { volume: 0.06 });
          Promise.all([a1, a2]).then(() => { scintille(dest); gemella.remove(); volo.remove(); });
        });
        return;
      }
      const nuova = document.querySelector(`.pp-mano [data-id="${CSS.escape(u.carta)}"]`);
      ctx.ui.arriva = { id: u.carta, fino: Date.now() + DURATA_VOLO };
      if (nuova) nuova.classList.add('arriva');
      const dest = nuova ? centro(nuova) : centro(sedeA);
      vola(volo, da, dest, { gira: true }).then(() => {
        volo.remove();
        const n2 = document.querySelector(`.pp-mano [data-id="${CSS.escape(u.carta)}"]`);
        if (n2) { n2.classList.remove('arriva'); n2.classList.add('atterra'); }
      });
      return;
    }
    // qualcuno pesca (anche da me): si vede un dorso che si sposta
    const volo = cartaVolante(u.carta ? carta(u.carta.split('-')[0]) : retro(), w);
    volo.classList.add('solo-dorso');
    if (u.da === ctx.mio && u.carta) volo.classList.remove('solo-dorso');
    const a = centro(sedeA);
    vola(volo, da, a, { gira: false, durata: 620, arco: 50 }).then(() => {
      if (u.coppia && pila) {
        volo.classList.remove('solo-dorso');
        volo.innerHTML = `<div class="pp-faccia davanti">${carta(u.coppia)}</div>`;
        vola(volo, a, centro(pila), { durata: 480, arco: 30 }).then(() => { scintille(centro(pila)); volo.remove(); });
      } else volo.remove();
    });
  }

  function scintille(pt) {
    const box = strato();
    for (let k = 0; k < 10; k++) {
      const s = document.createElement('span');
      s.className = 'pp-scintilla';
      const ang = (k / 10) * Math.PI * 2;
      s.style.cssText = `left:${pt.x}px;top:${pt.y}px;--dx:${Math.cos(ang) * 60}px;--dy:${Math.sin(ang) * 60}px`;
      box.append(s);
      setTimeout(() => s.remove(), 700);
    }
  }

  // L'animazione volutamente brutta: colori sparati, font da volantino, scatti a gradini e suoni stonati.
  function bruttissima(ctx, fermo, da) {
    const box = strato();
    const v = document.createElement('div');
    v.className = `pp-brutta ${fermo ? 'ferma' : ''}`;
    v.innerHTML = `<div class="pp-brutta-carta">${carta('peppa')}</div>
      <p class="pp-brutta-t1">HAI PESCATO</p><p class="pp-brutta-t2">LA PEPPA!!!1!</p>
      <span class="pp-brutta-e e1">💀</span><span class="pp-brutta-e e2">😱</span><span class="pp-brutta-e e3">🐈‍⬛</span><span class="pp-brutta-e e4">‼️</span>
      <p class="pp-brutta-t3">(non dirlo a nessuno)</p>`;
    if (da) v.style.setProperty('--da-x', `${da.x}px`), v.style.setProperty('--da-y', `${da.y}px`);
    box.append(v);
    suono([[392, 0.22], [370, 0.22], [349, 0.22], [220, 0.6]], { tipo: 'sawtooth', volume: 0.08 });
    if (navigator.vibrate) navigator.vibrate([90, 60, 90, 60, 250]);
    setTimeout(() => v.remove(), fermo ? 1800 : 2600);
    void ctx;
  }

  Object.assign(window.Tavoli, { peppa });
})();
