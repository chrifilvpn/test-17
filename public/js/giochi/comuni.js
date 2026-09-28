// Piccole utilità per i giochi nuovi (impostore, coccodrillo, block blast, peppa tencia, fast west).
// Il tavolo viene ridisegnato a ogni messaggio (anche di chat): le animazioni ripartono "da dove erano"
// grazie a un orologio per evento (Nuovi.trascorso) usato come ritardo negativo in CSS.
(() => {
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // quanti ms sono passati da quando questo evento (chiave) è stato visto la prima volta
  function trascorso(ui, chiave) {
    ui._visto = ui._visto || {};
    if (!ui._visto[chiave]) ui._visto[chiave] = Date.now();
    return Date.now() - ui._visto[chiave];
  }
  // style="--t:-XXXms": da usare come animation-delay: var(--t)
  const ritardo = (ui, chiave) => `--t:${-trascorso(ui, chiave)}ms`;
  // un evento va animato una volta sola (es. animazioni fatte in JS)
  function primaVolta(ui, chiave) {
    ui._fatti = ui._fatti || new Set();
    if (ui._fatti.has(chiave)) return false;
    ui._fatti.add(chiave);
    return true;
  }

  // strato fisso sopra la pagina per le animazioni che attraversano il tavolo (le carte che volano)
  function strato() {
    let el = document.getElementById('strato-animazioni');
    if (!el) { el = document.createElement('div'); el.id = 'strato-animazioni'; el.setAttribute('aria-hidden', 'true'); document.body.append(el); }
    return el;
  }
  const calmo = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // suoni semplici con WebAudio (spenti se il sito è muto o se si è sulle dispense)
  let audio;
  function suono(note, { tipo = 'triangle', volume = 0.1 } = {}) {
    try {
      if (window.Boss && Boss.attivo) return;
      const b = document.getElementById('suono');
      if (b && b.getAttribute('aria-pressed') === 'false') return;
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      let t = audio.currentTime;
      for (const [f, d] of note) {
        const o = audio.createOscillator(), g = audio.createGain();
        o.type = tipo; o.frequency.setValueAtTime(f, t);
        g.gain.setValueAtTime(volume, t); g.gain.exponentialRampToValueAtTime(0.001, t + d);
        o.connect(g).connect(audio.destination); o.start(t); o.stop(t + d);
        t += d * 0.9;
      }
    } catch {}
  }

  // caselle di testo che sopravvivono ai ridisegni: <input data-tieni="chiave"> salva il valore in ctx.ui.t_chiave
  let ctxTesto = null;
  window.NuoviTesto = (ctx) => { ctxTesto = ctx; };
  document.addEventListener('input', (e) => {
    const k = e.target.dataset && e.target.dataset.tieni;
    if (k && ctxTesto && ctxTesto.stato) ctxTesto.ui[`t_${k}`] = e.target.value;
  });
  document.addEventListener('focusin', (e) => { const k = e.target.dataset && e.target.dataset.tieni; if (k && ctxTesto && ctxTesto.stato) ctxTesto.ui.fuoco = k; });
  document.addEventListener('focusout', (e) => {
    const k = e.target.dataset && e.target.dataset.tieni;
    if (!k || !ctxTesto || !ctxTesto.stato) return;
    setTimeout(() => { const a = document.activeElement; if (ctxTesto.stato && (!a || !a.dataset || a.dataset.tieni !== k) && ctxTesto.ui.fuoco === k) ctxTesto.ui.fuoco = null; }, 0);
  });

  window.Nuovi = { esc, trascorso, ritardo, primaVolta, strato, calmo, suono };
})();
