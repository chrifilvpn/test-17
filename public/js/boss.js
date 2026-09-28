// BOSS KEY: la pagina delle dispense che copre tutto il sito.
// È globale: va caricato per primo e non dipende da nessun gioco.
// - Esc apre la pagina finta; "/", "\" o scrivere "gioca" riportano indietro.
// - La partita resta viva sotto (stessa pagina, stessa connessione): nulla viene chiuso o perso.
// - Titolo, favicon e indirizzo cambiano senza aggiungere voci alla cronologia.
// - Se esci dalla finestra per più di X secondi, al ritorno trovi le dispense.
// - Mentre è attiva, i suoni del sito sono sospesi.
window.Boss = (() => {
  const TITOLO_FINTO = 'Dispense di Informatica · Informatica Facile';
  const INDIRIZZO_FINTO = '/dispense';
  const FAVICON_FINTA = 'data:image/svg+xml,' + encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><path d='M7 2h12l7 7v19a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z' fill='#1a5fb4'/><path d='M19 2v5a2 2 0 0 0 2 2h5z' fill='#8fb4e3'/><rect x='9' y='14' width='13' height='2' rx='1' fill='#fff'/><rect x='9' y='18' width='13' height='2' rx='1' fill='#fff'/><rect x='9' y='22' width='9' height='2' rx='1' fill='#fff'/></svg>");
  const PAROLA = 'gioca';
  const CFG_CHIAVE = 'if:studio';

  // ---------- impostazioni (finestra grigia) ----------
  const cfg = { grigia: true, secondi: 25 };
  try { Object.assign(cfg, JSON.parse(localStorage.getItem(CFG_CHIAVE) || '{}')); } catch {}
  function config(nuove) {
    if (nuove) {
      if ('grigia' in nuove) cfg.grigia = !!nuove.grigia;
      if ('secondi' in nuove) cfg.secondi = Math.min(600, Math.max(5, Math.round(Number(nuove.secondi) || 25)));
      try { localStorage.setItem(CFG_CHIAVE, JSON.stringify(cfg)); } catch {}
    }
    return { ...cfg };
  }

  let attivo = false;
  let inCorso = false; // durante l'overlay di caricamento
  const ascoltatori = [];
  const emetti = () => ascoltatori.forEach((f) => { try { f(attivo); } catch (e) { console.error(e); } });

  // ---------- titolo della scheda ----------
  // Chiunque scriva document.title (anche i giochi futuri) aggiorna il titolo "vero",
  // che si vede solo quando la pagina finta è chiusa.
  const descTitolo = Object.getOwnPropertyDescriptor(Document.prototype, 'title');
  let titoloVero = descTitolo.get.call(document);
  Object.defineProperty(document, 'title', {
    configurable: true,
    get() { return attivo ? TITOLO_FINTO : titoloVero; },
    set(v) { titoloVero = String(v); if (!attivo) descTitolo.set.call(document, titoloVero); },
  });

  // ---------- favicon ----------
  let iconeVere = [];
  function cambiaFavicon(finta) {
    const icone = [...document.querySelectorAll('link[rel~="icon"]')];
    if (finta) {
      iconeVere = icone.map((l) => [l, l.href]);
      if (!icone.length) { const l = document.createElement('link'); l.rel = 'icon'; document.head.append(l); icone.push(l); }
      icone.forEach((l) => { l.href = FAVICON_FINTA; });
    } else {
      iconeVere.forEach(([l, h]) => { l.href = h; });
      iconeVere = [];
    }
  }

  // ---------- indirizzo e cronologia ----------
  // Si usa solo replaceState: nella cronologia non resta traccia dei giochi.
  // Se mentre le dispense sono aperte il sito cambia indirizzo, lo teniamo da parte per il ritorno.
  const replaceVero = history.replaceState.bind(history);
  const pushVero = history.pushState.bind(history);
  let urlVero = null;
  const qui = () => location.pathname + location.search + location.hash;
  function risolvi(url) {
    const u = new URL(url, location.origin + (urlVero || '/'));
    return u.pathname + u.search + u.hash;
  }
  history.replaceState = (st, t, url) => {
    if (attivo && url != null) { urlVero = risolvi(url); salvaUrl(); return; }
    return replaceVero(st, t, url);
  };
  history.pushState = (st, t, url) => {
    if (attivo) { if (url != null) { urlVero = risolvi(url); salvaUrl(); } return; }
    return pushVero(st, t, url);
  };
  function salvaUrl() { try { sessionStorage.setItem('if:urlVero', urlVero || '/'); } catch {} }

  // ---------- suoni ----------
  // Ogni AudioContext creato nel sito viene registrato: così si possono zittire tutti insieme.
  const contesti = new Set();
  const sospesi = new Set();
  for (const nome of ['AudioContext', 'webkitAudioContext']) {
    const Originale = window[nome];
    if (!Originale) continue;
    window[nome] = class extends Originale {
      constructor(...a) { super(...a); contesti.add(this); if (attivo) { this.suspend(); sospesi.add(this); } }
    };
  }
  const mediaPausa = new Set();
  function zittisci(si) {
    if (si) {
      contesti.forEach((c) => { if (c.state === 'running') { c.suspend(); sospesi.add(c); } });
      document.querySelectorAll('audio, video').forEach((m) => { if (!m.paused) { m.pause(); mediaPausa.add(m); } });
    } else {
      sospesi.forEach((c) => c.resume().catch(() => {}));
      sospesi.clear();
      mediaPausa.forEach((m) => m.play().catch(() => {}));
      mediaPausa.clear();
    }
  }

  // ---------- elementi della pagina ----------
  let copertura, caricamento, focusPrima, inerti = [];
  function prepara() {
    if (copertura) return;
    copertura = document.createElement('div');
    copertura.id = 'studio';
    copertura.hidden = true;
    copertura.innerHTML = window.BossPagina ? window.BossPagina.html() : '<h1>Dispense</h1>';
    caricamento = document.createElement('div');
    caricamento.id = 'studio-carica';
    caricamento.hidden = true;
    caricamento.innerHTML = '<div class="studio-spinner" aria-hidden="true"></div><p>Caricamento…</p>';
    document.body.append(copertura, caricamento);
    if (window.BossPagina) window.BossPagina.avvia(copertura);
  }
  function rendiInerte(si) {
    if (si) {
      inerti = [...document.body.children].filter((el) => el !== copertura && el !== caricamento && !el.inert);
      inerti.forEach((el) => { el.inert = true; });
    } else {
      inerti.forEach((el) => { el.inert = false; });
      inerti = [];
    }
  }

  // ---------- "sta succedendo qualcosa?" ----------
  let ultimaAttivita = 0;
  const attivita = () => { ultimaAttivita = Date.now(); };
  function succedeQualcosa() {
    if (Date.now() - ultimaAttivita < 2200) return true;
    try {
      return document.getAnimations().some((a) => a.playState === 'running'
        && !(copertura && copertura.contains(a.effect && a.effect.target))
        && a.effect && a.effect.getTiming().iterations !== Infinity);
    } catch { return false; }
  }
  window.addEventListener('pointerdown', attivita, true);

  // ---------- attivazione ----------
  function attiva({ subito = false } = {}) {
    if (attivo || inCorso) return;
    prepara();
    focusPrima = document.activeElement;
    if (focusPrima && focusPrima.blur) focusPrima.blur();
    attivo = true;
    urlVero = qui().startsWith(INDIRIZZO_FINTO) ? (urlVero || leggiUrlSalvato()) : qui();
    salvaUrl();
    descTitolo.set.call(document, TITOLO_FINTO);
    cambiaFavicon(true);
    replaceVero(history.state, '', INDIRIZZO_FINTO + (window.BossPagina ? window.BossPagina.query() : ''));
    zittisci(true);
    rendiInerte(true);
    document.documentElement.classList.add('in-studio');
    emetti();

    const mostraPagina = () => {
      caricamento.hidden = true;
      copertura.hidden = false;
      inCorso = false;
      if (window.BossPagina) window.BossPagina.mostrata(copertura);
    };
    if (!subito && succedeQualcosa()) {
      // copertura immediata con un finto caricamento, poi le dispense
      inCorso = true;
      caricamento.hidden = false;
      setTimeout(mostraPagina, 380 + Math.random() * 420);
    } else mostraPagina();
  }

  function disattiva() {
    if (!attivo || inCorso) return;
    attivo = false;
    copertura.hidden = true;
    caricamento.hidden = true;
    document.documentElement.classList.remove('in-studio');
    rendiInerte(false);
    replaceVero(history.state, '', urlVero || '/');
    try { sessionStorage.removeItem('if:urlVero'); } catch {}
    urlVero = null;
    cambiaFavicon(false);
    descTitolo.set.call(document, titoloVero);
    zittisci(false);
    if (focusPrima && document.contains(focusPrima) && focusPrima.focus) {
      try { focusPrima.focus({ preventScroll: true }); } catch {}
    }
    emetti();
  }
  const leggiUrlSalvato = () => { try { return sessionStorage.getItem('if:urlVero') || '/'; } catch { return '/'; } };

  // ---------- tastiera ----------
  let digitato = '';
  window.addEventListener('keydown', (e) => {
    if (!attivo) {
      if (e.key !== 'Escape' || e.repeat) { if (e.key !== 'Escape') attivita(); return; }
      e.preventDefault();
      e.stopImmediatePropagation();
      attiva();
      return;
    }
    // Pagina finta aperta: i tasti non arrivano ai giochi sotto.
    e.stopImmediatePropagation();
    if (e.key === 'Escape') { e.preventDefault(); return; }
    const inCampo = e.target && e.target.closest && e.target.closest('input, textarea, [contenteditable]');
    if ((e.key === '/' || e.key === '\\') && !inCampo && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      disattiva();
      return;
    }
    if (e.key.length === 1) {
      digitato = (digitato + e.key.toLowerCase()).slice(-PAROLA.length);
      if (digitato === PAROLA) {
        digitato = '';
        e.preventDefault();
        if (inCampo) inCampo.value = inCampo.value.replace(/gioc$/i, ''); // non lasciare la parola nel campo di ricerca
        disattiva();
      }
    }
  }, true);

  // ---------- finestra grigia ----------
  let uscitoAlle = null;
  let tUscita;
  function uscito() {
    if (attivo || !cfg.grigia || uscitoAlle) return;
    uscitoAlle = Date.now();
    clearTimeout(tUscita);
    tUscita = setTimeout(() => { if (uscitoAlle && !attivo) attiva({ subito: true }); }, cfg.secondi * 1000);
  }
  function rientrato() {
    clearTimeout(tUscita);
    if (uscitoAlle && !attivo && cfg.grigia && Date.now() - uscitoAlle >= cfg.secondi * 1000) attiva({ subito: true });
    uscitoAlle = null;
  }
  window.addEventListener('blur', uscito);
  window.addEventListener('focus', rientrato);
  document.addEventListener('visibilitychange', () => (document.hidden ? uscito() : document.hasFocus() && rientrato()));

  // Se si ricarica la pagina mentre si "studia", si riparte dalle dispense.
  const eraInStudio = location.pathname.startsWith(INDIRIZZO_FINTO);
  if (eraInStudio) urlVero = leggiUrlSalvato();
  const avvio = () => { prepara(); if (eraInStudio) attiva({ subito: true }); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', avvio);
  else avvio();

  return {
    attiva,
    disattiva,
    get attivo() { return attivo; },
    attivita,
    config,
    onCambio(f) { ascoltatori.push(f); },
    replaceStato: (url) => replaceVero(history.state, '', url), // usato dalla pagina finta per le sue sezioni
  };
})();
