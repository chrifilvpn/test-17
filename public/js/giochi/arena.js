// MOTORE COMUNE (browser) dei giochi d'azione: canvas che resta vivo, comandi da tastiera, mouse e dito,
// interpolazione tra un tick e l'altro, conto alla rovescia e riepilogo del round. Ogni gioco passa:
//   { id, disegna(g, p, s, u, extra), istruzioni, comandi: 'movimento' | 'tasto', mouse: null | 'mira' | 'bersaglio' }
// dove s = stato del tick (interpolato con u tra 0 e 1 rispetto al precedente, vedi Arena.lerp).
window.Arena = (() => {
  const { esc, suono } = window.Nuovi;
  const COLORI = ['#e8453c', '#2f7fd8', '#2e9d57', '#e0a91c', '#8e55c9', '#e36fa5', '#1fa3a3', '#e07b2c'];
  const touch = () => window.matchMedia && window.matchMedia('(pointer: coarse)').matches;

  // interpolazione di un elenco di oggetti con id e x, y (gli altri campi si prendono dall'ultimo)
  function lerp(prima, dopo, u) {
    if (!prima) return dopo;
    const m = new Map(prima.map((o) => [o.id, o]));
    return dopo.map((o) => { const a = m.get(o.id); if (!a || a.salto !== o.salto || Math.hypot(a.x - o.x, a.y - o.y) > 200) return o; return { ...o, x: a.x + (o.x - a.x) * u, y: a.y + (o.y - a.y) * u }; });
  }

  function tavolo(cfg) {
    let ctxA = null, tela = null, ultimo = null, prima = null, arrivo = 0, passoMs = 33;
    const tasti = new Set();
    const inp = { x: 0, y: 0, a: false, t: 0, mx: null, my: null };
    let inviato = '', ultimoInvio = 0;
    const joy = { id: null, x0: 0, y0: 0, x: 0, y: 0 };
    const attiva = () => ctxA && ctxA.stato && ctxA.partita && ctxA.partita.gioco === cfg.id && !ctxA.partita.finita;

    function aggiornaDaTasti() {
      if (joy.id !== null) return;
      const x = (tasti.has('d') || tasti.has('arrowright') ? 1 : 0) - (tasti.has('a') || tasti.has('arrowleft') ? 1 : 0);
      const y = (tasti.has('s') || tasti.has('arrowdown') ? 1 : 0) - (tasti.has('w') || tasti.has('arrowup') ? 1 : 0);
      const l = Math.hypot(x, y) || 1;
      inp.x = x / l; inp.y = y / l;
    }
    function invia(forza = false) {
      if (!attiva()) return;
      const ora = performance.now();
      const pacco = { x: Math.round(inp.x * 100) / 100, y: Math.round(inp.y * 100) / 100, a: inp.a, t: inp.t };
      if (inp.mx !== null) { pacco.mx = Math.round(inp.mx); pacco.my = Math.round(inp.my); }
      const k = JSON.stringify(pacco);
      if (!forza && k === inviato && ora - ultimoInvio < 250) return;
      if (!forza && ora - ultimoInvio < 40 && k !== inviato) { setTimeout(() => invia(), 45); return; }
      inviato = k; ultimoInvio = ora;
      ctxA.emetti('input', pacco);
    }
    setInterval(() => invia(), 120);
    const premi = () => { inp.t++; inp.a = true; invia(true); if (cfg.suonoAzione) suono(cfg.suonoAzione, { volume: 0.04 }); };

    document.addEventListener('keydown', (e) => {
      if (!attiva() || (window.Boss && Boss.attivo) || (e.target.closest && e.target.closest('input, textarea, select'))) return;
      const k = e.key.toLowerCase();
      if ([' ', 'enter', 'j', 'k'].includes(k)) { e.preventDefault(); if (!e.repeat) premi(); return; }
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) { e.preventDefault(); tasti.add(k); aggiornaDaTasti(); invia(); }
    });
    document.addEventListener('keyup', (e) => {
      const k = e.key.toLowerCase();
      if ([' ', 'enter', 'j', 'k'].includes(k)) { inp.a = false; invia(); }
      if (tasti.delete(k)) { aggiornaDaTasti(); invia(); }
    });
    window.addEventListener('blur', () => { tasti.clear(); inp.x = inp.y = 0; inp.a = false; invia(true); });

    function coordMondo(e) {
      const r = tela.getBoundingClientRect(), p = ctxA.partita;
      return [((e.clientX - r.left) / r.width) * p.W, ((e.clientY - r.top) / r.height) * p.H];
    }
    // mouse: mira o bersaglio (il gatto segue il puntatore); click = azione
    function preparaTela() {
      tela = document.createElement('canvas');
      tela.className = 'ar-tela';
      // "traccia" (Dalgona): tasto sinistro o dito tenuto premuto = si traccia, rilasciato = ci si ferma
      if (cfg.mouse === 'traccia') {
        tela.style.touchAction = 'none';
        tela.addEventListener('pointerdown', (e) => {
          if (!attiva() || (e.pointerType === 'mouse' && e.button !== 0)) return;
          e.preventDefault(); try { tela.setPointerCapture(e.pointerId); } catch (_) { /* niente */ }
          [inp.mx, inp.my] = coordMondo(e); inp.a = true; invia(true);
        });
        tela.addEventListener('pointermove', (e) => { if (!attiva()) return; [inp.mx, inp.my] = coordMondo(e); invia(); });
        const su = () => { if (!inp.a) return; inp.a = false; invia(true); };
        tela.addEventListener('pointerup', su); tela.addEventListener('pointercancel', su); tela.addEventListener('lostpointercapture', su);
        return;
      }
      tela.addEventListener('pointermove', (e) => {
        if (!attiva() || !cfg.mouse || e.pointerType === 'touch') return;
        [inp.mx, inp.my] = coordMondo(e); invia();
      });
      tela.addEventListener('pointerdown', (e) => {
        if (!attiva()) return;
        if (e.pointerType === 'touch') return; // il dito usa i comandi sullo schermo
        if (cfg.mouse) [inp.mx, inp.my] = coordMondo(e);
        if (cfg.clicAzione !== false) premi();
      });
      tela.addEventListener('pointerup', () => { inp.a = false; invia(); });
    }

    // comandi per il dito: joystick a sinistra, pulsante a destra; per chi usa il "bersaglio" basta toccare il campo
    function comandiTouch() {
      if (!touch() || cfg.comandi === 'nessuno') return ''; // 'nessuno': si gioca solo toccando il campo (Dalgona)
      if (cfg.comandi === 'tasto') return `<div class="ar-touch"><button type="button" class="ar-bt grande" data-ar="azione">${esc(cfg.nomeAzione || 'Spingi')}</button></div>`;
      return `<div class="ar-touch"><div class="ar-joy" data-ar="joy"><i></i></div>${cfg.nomeAzione ? `<button type="button" class="ar-bt" data-ar="azione">${esc(cfg.nomeAzione)}</button>` : ''}</div>`;
    }
    document.addEventListener('pointerdown', (e) => {
      if (!attiva()) return;
      const b = e.target.closest && e.target.closest('[data-ar="azione"]');
      if (b) { e.preventDefault(); premi(); return; }
      const j = e.target.closest && e.target.closest('[data-ar="joy"]');
      if (j) {
        e.preventDefault();
        const r = j.getBoundingClientRect();
        joy.id = e.pointerId; joy.x0 = r.left + r.width / 2; joy.y0 = r.top + r.height / 2; joy.el = j;
        muoviJoy(e);
      } else if (e.target === tela && e.pointerType === 'touch' && cfg.mouse && cfg.mouse !== 'traccia') {
        [inp.mx, inp.my] = coordMondo(e); if (cfg.mouse === 'mira') premi(); else invia(true);
      }
    }, { passive: false });
    function muoviJoy(e) {
      const dx = e.clientX - joy.x0, dy = e.clientY - joy.y0, l = Math.hypot(dx, dy), max = 45;
      const k = l > max ? max / l : 1;
      inp.x = l > 8 ? (dx * k) / max : 0; inp.y = l > 8 ? (dy * k) / max : 0;
      const pomo = joy.el && joy.el.querySelector('i');
      if (pomo) pomo.style.transform = `translate(${dx * k}px, ${dy * k}px)`;
      invia();
    }
    document.addEventListener('pointermove', (e) => {
      if (joy.id === e.pointerId) { e.preventDefault(); muoviJoy(e); return; }
      if (attiva() && cfg.mouse === 'bersaglio' && e.pointerType === 'touch' && e.target === tela) { [inp.mx, inp.my] = coordMondo(e); invia(); }
    }, { passive: false });
    const lascia = (e) => {
      if (joy.id !== e.pointerId) { if (e.target && e.target.closest && e.target.closest('[data-ar="azione"]')) { inp.a = false; invia(); } return; }
      joy.id = null; inp.x = inp.y = 0; const pomo = joy.el && joy.el.querySelector('i'); if (pomo) pomo.style.transform = ''; invia(true);
    };
    document.addEventListener('pointerup', lascia);
    document.addEventListener('pointercancel', lascia);

    function disegna() {
      requestAnimationFrame(disegna);
      if (!ctxA || !ctxA.partita || ctxA.partita.gioco !== cfg.id || !tela || !tela.isConnected || !ultimo) return;
      const p = ctxA.partita;
      const box = tela.parentElement;
      const scala = Math.min(box.clientWidth / p.W, Math.max(220, window.innerHeight - (touch() ? 300 : 230)) / p.H);
      const dpr = window.devicePixelRatio || 1, w = Math.round(p.W * scala), h = Math.round(p.H * scala);
      if (tela.width !== Math.round(w * dpr)) { tela.width = Math.round(w * dpr); tela.height = Math.round(h * dpr); tela.style.width = `${w}px`; tela.style.height = `${h}px`; }
      const g = tela.getContext('2d');
      g.setTransform(dpr * scala, 0, 0, dpr * scala, 0, 0);
      const u = Math.min(1, (performance.now() - arrivo) / passoMs);
      try { cfg.disegna(g, p, ultimo, prima, u, ctxA); } catch (err) { /* un fotogramma perso non ferma il gioco */ }
      // scritte sopra: conto alla rovescia, pausa, fine round
      let scritta = '', sotto = '';
      if (ultimo.pausa) scritta = '⏸ In pausa';
      else if (ultimo.fase === 'via') { scritta = String(Math.max(1, Math.ceil(ultimo.via / 1000))); sotto = `Round ${ultimo.round} di ${p.nRound}${cfg.ruolo ? ` · ${cfg.ruolo(p, ultimo, ctxA)}` : ''}`; }
      else if (ultimo.fase === 'pausaRound') { scritta = 'Fine round'; sotto = cfg.fineRound ? cfg.fineRound(p, ultimo, ctxA) : ''; }
      if (scritta) {
        g.fillStyle = 'rgba(10,20,30,.55)'; g.fillRect(0, 0, p.W, p.H);
        g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.font = `400 ${scritta.length > 3 ? 64 : 120}px "Young Serif", Georgia, serif`; g.fillText(scritta, p.W / 2, p.H / 2 - 10);
        if (sotto) { g.font = '600 24px system-ui, sans-serif'; g.fillText(sotto, p.W / 2, p.H / 2 + 60); }
      }
    }
    requestAnimationFrame(disegna);

    return {
      libero: true,
      senzaFila: true,
      reset(ctx) {
        ctxA = ctx;
        if (!tela) preparaTela();
        if (!ultimo || ultimo.round !== ctx.partita.stato.round || ultimo.fase !== ctx.partita.stato.fase) { prima = null; ultimo = ctx.partita.stato; arrivo = performance.now(); }
      },
      tick(ctx, d) {
        ctxA = ctx;
        const ora = performance.now();
        passoMs = Math.max(20, Math.min(120, ora - arrivo));
        prima = ultimo && ultimo.round === d.round ? ultimo : null; ultimo = d; arrivo = ora;
        ctx.partita.stato = d;
        if (cfg.dopoTick) cfg.dopoTick(ctx, d, prima);
        const st = document.getElementById('stato-turno');
        const testo = this.stato(ctx);
        if (st && testo && st.textContent !== testo) st.textContent = testo;
        const h = document.querySelector('.ar-hud');
        if (h && cfg.hud) { const html = cfg.hud(ctx, d); if (h._html !== html) { h._html = html; h.innerHTML = html; } }
        aggiornaSopra(ctx, d);
      },
      panno(ctx) {
        const p = ctx.partita;
        return `<div class="ar">
          <p class="pa-round">Round ${p.stato.round} di ${p.nRound}${cfg.sottotitolo ? ` · ${cfg.sottotitolo(p, ctx)}` : ''}</p>
          <div class="ar-hud"></div>
          <div class="ar-box"><div class="ar-sopra"></div></div>
          ${comandiTouch()}
          <p class="piccolo ar-istr">${cfg.istruzioni(ctx)}</p>
        </div>`;
      },
      dopo(ctx) {
        const box = document.querySelector('.ar-box'); if (box && tela && tela.parentElement !== box) box.prepend(tela);
        const h = document.querySelector('.ar-hud'); if (h) h._html = null;
        const so = document.querySelector('.ar-sopra'); if (so) so._html = null;
        if (ctx && ultimo) aggiornaSopra(ctx, ultimo);
      },
      stato(ctx) {
        const p = ctx.partita, s = (ultimo || p.stato);
        if (p.finita) return null;
        if (s.pausa) return 'In pausa';
        if (s.fase === 'via') return 'Pronti…';
        if (s.fase === 'pausaRound') return 'Fine round';
        return cfg.statoGioco ? cfg.statoGioco(ctx, s) : 'Via!';
      },
      punteggio(ctx) {
        const p = ctx.partita;
        return p.punti.map((x, i) => `<span style="color:${COLORI[i % COLORI.length]}">${esc(i === ctx.mio ? 'Tu' : ctx.nome(i))} <b>${x}</b></span>`).join('') + `<span class="obiettivo">${esc(cfg.obiettivo || 'punti')}</span>`;
      },
      infoPosto(ctx, posto) { return `${ctx.partita.punti[posto]} punti`; },
      // i giochi con uno strato HTML sopra il canvas (cfg.sopra) ricevono i clic sui loro pulsanti [data-az]
      clic(ctx, el) { if (cfg.clic) cfg.clic(ctx, el); },
    };
    // strato HTML sopra il canvas (compiti, votazioni…): si ridisegna solo quando cambia
    function aggiornaSopra(ctx, d) {
      const so = document.querySelector('.ar-sopra');
      if (!so) return;
      const html = cfg.sopra ? cfg.sopra(ctx, d) || '' : '';
      if (so._html === html) return;
      so._html = html; so.innerHTML = html; so.hidden = !html;
      if (cfg.dopoSopra) cfg.dopoSopra(ctx, so);
    }
  }
  // disegni ricorrenti
  function omino(g, x, y, r, colore, nome, opz = {}) {
    g.save();
    g.globalAlpha = opz.alfa ?? 1;
    g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(x + 2, y + r * 0.9, r * 0.9, r * 0.35, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = colore; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    g.lineWidth = opz.io ? 3 : 2; g.strokeStyle = opz.io ? '#fff' : 'rgba(0,0,0,.45)'; g.stroke();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(x - r * 0.3, y - r * 0.2, r * 0.22, 0, Math.PI * 2); g.arc(x + r * 0.3, y - r * 0.2, r * 0.22, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#222'; g.beginPath(); g.arc(x - r * 0.28, y - r * 0.18, r * 0.1, 0, Math.PI * 2); g.arc(x + r * 0.32, y - r * 0.18, r * 0.1, 0, Math.PI * 2); g.fill();
    if (nome) { g.fillStyle = opz.coloreNome || '#fff'; g.font = '600 13px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.strokeStyle = 'rgba(0,0,0,.6)'; g.lineWidth = 3; g.strokeText(nome, x, y - r - 6); g.fillText(nome, x, y - r - 6); }
    if (opz.stordito) { g.font = '16px system-ui'; g.fillText('💫', x, y - r - 20); }
    g.restore();
  }
  return { tavolo, lerp, COLORI, omino, touch };
})();
