// WORDLE: il tavolo nel browser
(() => {
  const { esc, ritardo } = window.Nuovi;
  const FILE = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
  let ctxW = null;

  const puoScrivere = (ctx) => { const p = ctx.partita; return p && p.gioco === 'wordle' && !p.finita && !p.mioFatto; };

  function coloriTasti(p) {
    const c = {};
    for (const r of p.mie) r.parola.split('').forEach((l, i) => { c[l] = Math.max(c[l] ?? -1, r.esito[i]); });
    return c;
  }

  function griglia(ctx) {
    const p = ctx.partita, ui = ctx.ui;
    const righe = [];
    for (let r = 0; r < p.tentativi; r++) {
      const fatta = p.mie[r];
      const corrente = !fatta && r === p.mie.length && !p.mioFatto && !p.finita;
      const nuova = fatta && r === p.mie.length - 1;
      const st = nuova ? ritardo(ui, `riga-${r}`) : '';
      let celle = '';
      for (let i = 0; i < p.lunghezza; i++) {
        const l = fatta ? fatta.parola[i] : corrente ? (ui.riga || '')[i] || '' : '';
        const cls = fatta ? `e${fatta.esito[i]} ${nuova ? 'gira' : ''}` : l ? 'piena' : '';
        celle += `<span class="wd-cella ${cls}" style="--i:${i};${st}">${esc(l.toUpperCase())}</span>`;
      }
      righe.push(`<div class="wd-riga ${corrente ? 'corrente' : ''} ${corrente && ui.scossa ? 'scossa' : ''}" style="--n:${p.lunghezza}">${celle}</div>`);
    }
    return `<div class="wd-griglia" aria-label="I tuoi tentativi">${righe.join('')}</div>`;
  }

  function tastiera(ctx) {
    const p = ctx.partita;
    const col = coloriTasti(p);
    const attiva = puoScrivere(ctx);
    const tasto = (l) => `<button type="button" class="wd-tasto ${col[l] != null ? `e${col[l]}` : ''}" data-az="tasto" data-l="${l}" ${attiva ? '' : 'disabled'}>${l.toUpperCase()}</button>`;
    return `<div class="wd-tastiera">${FILE.map((f, k) => `<div>${k === 2 ? `<button type="button" class="wd-tasto largo" data-az="invio" ${attiva ? '' : 'disabled'}>Invio</button>` : ''}${f.split('').map(tasto).join('')}${k === 2 ? `<button type="button" class="wd-tasto largo" data-az="canc" ${attiva ? '' : 'disabled'} aria-label="Cancella">⌫</button>` : ''}</div>`).join('')}</div>`;
  }

  function avversari(ctx) {
    const p = ctx.partita;
    if (p.n < 2) return '';
    return `<aside class="wd-altri" aria-label="Gli altri giocatori">${p.altri.map((a, i) => {
      if (i === ctx.mio) return '';
      const righe = Array.from({ length: p.tentativi }, (_, r) => {
        const x = a.righe[r];
        return `<div class="wd-mini" style="--n:${p.lunghezza}">${Array.from({ length: p.lunghezza }, (_, k) => `<i class="${x ? (x.esito ? `e${x.esito[k]}` : 'usata') : ''}"></i>`).join('')}</div>`;
      }).join('');
      const stato = a.fatto ? (a.fatto.vinto ? `✅ in ${a.fatto.tentativi}` : a.fatto.ritirato ? 'ritirato' : '❌') : `${a.tentativi}/${p.tentativi}`;
      return `<div class="wd-altro"><p><b>${esc(ctx.nome(i))}</b><span>${stato}</span></p>${righe}</div>`;
    }).join('')}</aside>`;
  }

  const wordle = {
    libero: true,
    reset(ctx) {
      ctxW = ctx;
      const p = ctx.partita, ui = ctx.ui;
      // tentativo accettato dal server: la riga si svuota
      if (ui.visti !== p.mie.length) { if (ui.visti != null && p.mie.length > ui.visti) ui.riga = ''; ui.visti = p.mie.length; }
    },
    panno(ctx) {
      const p = ctx.partita;
      let testa;
      if (p.mioFatto || p.finita) {
        const f = p.mioFatto;
        testa = `<p class="wd-esito ${f && f.vinto ? 'si' : 'no'}">${f && f.vinto ? `Indovinata in ${f.tentativi} ${f.tentativi === 1 ? 'tentativo' : 'tentativi'}!` : 'Niente da fare…'} La parola era <b>${esc((p.segreta || '').toUpperCase())}</b>${!p.finita ? '<small>Aspetta che finiscano gli altri.</small>' : ''}</p>`;
      } else testa = `<p class="wd-info">${p.lunghezza} lettere · tentativo ${p.mie.length + 1} di ${p.tentativi}${p.n > 1 ? ' · stessa parola per tutti' : ''}</p>`;
      return `<div class="wd"><div class="wd-centro">${testa}${griglia(ctx)}${tastiera(ctx)}</div>${avversari(ctx)}</div>`;
    },
    stato(ctx) {
      const p = ctx.partita;
      if (p.finita) return null;
      if (p.mioFatto) return 'Aspetta gli altri';
      return p.n > 1 ? 'Scontro: indovina prima degli altri' : 'Indovina la parola';
    },
    punteggio(ctx) {
      const p = ctx.partita;
      if (p.n < 2) return '';
      return p.altri.map((a, i) => `<span>${esc(i === ctx.mio ? 'Tu' : ctx.nome(i))} <b>${a.tentativi}</b><small>/${p.tentativi}</small>${a.fatto && a.fatto.vinto ? ' ✅' : ''}</span>`).join('');
    },
    infoPosto(ctx, posto) {
      const a = ctx.partita.altri[posto];
      return a.fatto ? (a.fatto.vinto ? `indovinata in ${a.fatto.tentativi}` : 'ha finito') : `${a.tentativi} ${a.tentativi === 1 ? 'tentativo' : 'tentativi'}`;
    },
    clic(ctx, el) {
      const az = el.dataset.az;
      el.blur(); // così Invio sulla tastiera fisica non ripreme l'ultimo tasto cliccato
      if (az === 'tasto') return scrivi(el.dataset.l);
      if (az === 'canc') return scrivi('Backspace');
      if (az === 'invio') return scrivi('Enter');
    },
  };

  function scrivi(k) {
    const ctx = ctxW;
    if (!ctx || !ctx.stato || !puoScrivere(ctx)) return;
    const p = ctx.partita, ui = ctx.ui;
    ui.riga = ui.riga || '';
    if (k === 'Enter') {
      if (ui.riga.length !== p.lunghezza) { ui.scossa = true; ctx.ridisegna(); ui.scossa = false; return ctx.avviso(`Servono ${p.lunghezza} lettere`, 1400); }
      return ctx.invia({ tipo: 'prova', parola: ui.riga });
    }
    if (k === 'Backspace') ui.riga = ui.riga.slice(0, -1);
    else if (/^[a-z]$/.test(k) && ui.riga.length < p.lunghezza) ui.riga += k;
    else return;
    ctx.ridisegna();
  }
  document.addEventListener('keydown', (e) => {
    if (!ctxW || !ctxW.stato || !ctxW.partita || ctxW.partita.gioco !== 'wordle') return;
    if (e.ctrlKey || e.metaKey || e.altKey || (e.target.closest && e.target.closest('input, textarea, select'))) return;
    if (window.Boss && Boss.attivo) return;
    const k = e.key === 'Enter' || e.key === 'Backspace' ? e.key : e.key.length === 1 ? e.key.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() : '';
    if (!k || (k.length === 1 && !/[a-z]/.test(k))) return;
    if (e.key === 'Enter' && e.target.closest && e.target.closest('button')) e.preventDefault();
    scrivi(k);
  });

  Object.assign(window.Tavoli, { wordle });
})();
