// ESILIO: l'Ammiraglio manda qualcuno via dal sito. Tutti vedono una scena a schermo intero (11 secondi):
// il nome parte su una barchetta verso l'orizzonte al tramonto, arriva la tempesta, un fulmine, la barca affonda e il
// nome scende in fondo al mare tra le bolle, fino a posarsi sulla sabbia accanto a un vecchio forziere.
// Tutto disegnato qui (SVG e CSS), suoni generati col Web Audio. Non compare sulle dispense (Boss Key).
window.Esilio = (() => {
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let audio = null;
  const muto = () => { const b = document.getElementById('suono'); return (window.Boss && Boss.attivo) || (b && b.getAttribute('aria-pressed') === 'false'); };

  // corno solenne, onde, tuono e il "gluglu" delle bolle
  function suoni() {
    if (muto()) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const t0 = audio.currentTime;
      const nota = (f, inizio, dur, vol = 0.12, tipo = 'sawtooth') => {
        const o = audio.createOscillator(), g = audio.createGain(), fl = audio.createBiquadFilter();
        o.type = tipo; o.frequency.value = f; fl.type = 'lowpass'; fl.frequency.value = 900;
        g.gain.setValueAtTime(0.0001, t0 + inizio); g.gain.exponentialRampToValueAtTime(vol, t0 + inizio + 0.08);
        g.gain.setValueAtTime(vol, t0 + inizio + dur - 0.15); g.gain.exponentialRampToValueAtTime(0.0001, t0 + inizio + dur);
        o.connect(fl).connect(g).connect(audio.destination); o.start(t0 + inizio); o.stop(t0 + inizio + dur + 0.05);
      };
      const rumore = (inizio, dur, vol, filtro, tipo = 'lowpass') => {
        const buf = audio.createBuffer(1, Math.ceil(audio.sampleRate * dur), audio.sampleRate);
        const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        const src = audio.createBufferSource(); src.buffer = buf;
        const f = audio.createBiquadFilter(); f.type = tipo; f.frequency.value = filtro;
        const g = audio.createGain(); g.gain.setValueAtTime(0.0001, t0 + inizio); g.gain.exponentialRampToValueAtTime(vol, t0 + inizio + dur * 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t0 + inizio + dur);
        src.connect(f).connect(g).connect(audio.destination); src.start(t0 + inizio); src.stop(t0 + inizio + dur);
      };
      // il corno dell'Ammiragliato (re minore, lento e solenne)
      nota(146.8, 0.2, 0.9); nota(174.6, 1.1, 0.5); nota(220, 1.6, 1.3, 0.14); nota(110, 0.2, 2.8, 0.06, 'triangle');
      for (let k = 0; k < 5; k++) rumore(0.5 + k * 1.3, 1.6, 0.05, 500); // onde
      rumore(4.9, 1.8, 0.35, 700); // tuono
      const o = audio.createOscillator(), g = audio.createGain(); // il tonfo della barca che affonda
      o.type = 'sine'; o.frequency.setValueAtTime(90, t0 + 5.6); o.frequency.exponentialRampToValueAtTime(35, t0 + 6.6);
      g.gain.setValueAtTime(0.0001, t0 + 5.6); g.gain.exponentialRampToValueAtTime(0.3, t0 + 5.7); g.gain.exponentialRampToValueAtTime(0.001, t0 + 6.8);
      o.connect(g).connect(audio.destination); o.start(t0 + 5.6); o.stop(t0 + 6.9);
      for (let k = 0; k < 9; k++) { // bolle
        const b = audio.createOscillator(), bg = audio.createGain(), t = 6.4 + k * 0.25 + Math.random() * 0.1;
        b.type = 'sine'; b.frequency.setValueAtTime(300 + Math.random() * 200, t0 + t); b.frequency.exponentialRampToValueAtTime(900 + Math.random() * 400, t0 + t + 0.08);
        bg.gain.setValueAtTime(0.0001, t0 + t); bg.gain.exponentialRampToValueAtTime(0.05, t0 + t + 0.01); bg.gain.exponentialRampToValueAtTime(0.0001, t0 + t + 0.1);
        b.connect(bg).connect(audio.destination); b.start(t0 + t); b.stop(t0 + t + 0.12);
      }
    } catch {}
  }

  function avvia({ nome, sonoIo, durata = 11000 }) {
    if (window.Boss && Boss.attivo) return;
    document.querySelector('.es-velo')?.remove();
    const calmo = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const n = esc(nome);
    const stelle = Array.from({ length: 40 }, (_, k) => `<i style="--x:${(k * 43) % 100}%;--y:${(k * 29) % 45}%;--d:${(k % 7) * 0.4}s"></i>`).join('');
    const pioggia = Array.from({ length: 60 }, (_, k) => `<i style="--x:${(k * 17) % 100}%;--d:${((k * 0.137) % 1).toFixed(2)}s;--v:${0.45 + (k % 5) * 0.08}s"></i>`).join('');
    const bolle = Array.from({ length: 36 }, (_, k) => `<i style="--x:${38 + ((k * 7) % 24)}%;--d:${(6.3 + (k % 12) * 0.2).toFixed(2)}s;--s:${6 + (k % 5) * 4}px;--v:${1.6 + (k % 4) * 0.4}s"></i>`).join('');
    const el = document.createElement('div');
    el.className = `es-velo ${calmo ? 'calmo' : ''}`;
    el.setAttribute('role', 'alert');
    el.style.setProperty('--durata', `${durata}ms`);
    el.innerHTML = `
      <div class="es-cielo"><div class="es-stelle">${stelle}</div><div class="es-sole"></div><div class="es-nubi"></div></div>
      <div class="es-pioggia">${pioggia}</div>
      <div class="es-lampo"></div>
      <h2 class="es-titolo"><small>Per ordine dell'Ammiragliato</small><span>ESILIO</span></h2>
      <svg class="es-mare" viewBox="0 0 1200 400" preserveAspectRatio="none" aria-hidden="true">
        <defs><linearGradient id="es-acqua" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d4e7a"/><stop offset="1" stop-color="#0a2340"/></linearGradient></defs>
        <path class="es-onda o3" d="M0 60 Q75 40 150 60 T300 60 T450 60 T600 60 T750 60 T900 60 T1050 60 T1200 60 T1350 60 T1500 60 V400 H0Z" fill="#2a6a9a" opacity=".6"/>
        <path class="es-onda o2" d="M0 90 Q75 68 150 90 T300 90 T450 90 T600 90 T750 90 T900 90 T1050 90 T1200 90 T1350 90 T1500 90 V400 H0Z" fill="url(#es-acqua)"/>
        <path class="es-onda o1" d="M0 130 Q75 108 150 130 T300 130 T450 130 T600 130 T750 130 T900 130 T1050 130 T1200 130 T1350 130 T1500 130 V400 H0Z" fill="#0e3358"/>
      </svg>
      <div class="es-rotta"><div class="es-barca">
        <svg viewBox="0 0 220 200" aria-hidden="true">
          <path d="M108 20 L108 132" stroke="#5a3a1a" stroke-width="6"/>
          <path class="es-vela" d="M112 24 Q180 70 112 124 Z" fill="#f5ecd6" stroke="#caa56a" stroke-width="2"/>
          <path d="M104 30 Q56 80 104 122 Z" fill="#e9dcc0" stroke="#caa56a" stroke-width="2"/>
          <path d="M112 16 L140 22 L112 28 Z" fill="#c0392b"/>
          <path d="M20 136 L200 136 Q186 176 150 180 L60 180 Q30 176 20 136 Z" fill="#7a4a24" stroke="#4a2c14" stroke-width="3"/>
          <path d="M34 150 H186" stroke="#4a2c14" stroke-width="2" opacity=".6"/>
        </svg>
        <span class="es-nome">${n}</span>
      </div></div>
      <div class="es-abisso">
        <div class="es-raggi"></div>
        <div class="es-bolle">${bolle}</div>
        <div class="es-caduta"><span class="es-nome giu">${n}</span></div>
        <svg class="es-fondo" viewBox="0 0 1200 200" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 120 Q200 90 400 118 T800 112 T1200 120 V200 H0Z" fill="#c2a26b"/>
          <path d="M0 150 Q300 130 600 150 T1200 148 V200 H0Z" fill="#a8864f"/>
          <g class="es-alghe"><path d="M150 120 q-14 -40 4 -80 q-12 34 6 76" fill="#2f7d4f"/><path d="M1020 118 q18 -50 -2 -95 q16 40 -4 92" fill="#2f7d4f"/><path d="M880 120 q-10 -30 6 -60 q-8 26 4 58" fill="#3f9a5f"/></g>
          <g transform="translate(700 88)"><rect x="0" y="12" width="70" height="36" rx="4" fill="#6b4423" stroke="#3d2511" stroke-width="3"/><path d="M0 16 Q35 -10 70 16" fill="#7a4e2a" stroke="#3d2511" stroke-width="3"/><rect x="30" y="20" width="10" height="12" fill="#d19a2a"/></g>
          <g transform="translate(280 96)" fill="#d8d2c4"><circle cx="0" cy="10" r="11"/><circle cx="-4" cy="8" r="2.5" fill="#333"/><circle cx="4" cy="8" r="2.5" fill="#333"/></g>
        </svg>
      </div>
      <div class="es-epitaffio"><p>${sonoIo ? 'Sei stato esiliato in fondo al mare' : `<b>${n}</b> è stato esiliato in fondo al mare`}</p><small>${sonoIo ? 'L\'Ammiraglio ha deciso: addio, marinaio 🌊' : 'Che le correnti lo portino lontano 🌊⚓'}</small></div>`;
    document.body.append(el);
    suoni();
    if (navigator.vibrate && sonoIo) navigator.vibrate([200, 100, 200, 100, 600]);
    setTimeout(() => el.classList.add('via'), durata - 700);
    setTimeout(() => el.remove(), durata);
  }
  return { avvia };
})();
