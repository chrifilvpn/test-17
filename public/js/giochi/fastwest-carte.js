// FAST WEST: tutte le carte disegnate in SVG (niente immagini esterne)
(() => {
  const INK = '#3b2414';

  // ---------- illustrazioni delle carte azione (viewBox 0 0 100 80) ----------
  const ILLUSTRAZIONI = {
    ricarica: `
      <circle cx="50" cy="40" r="26" fill="#8a8f98" stroke="${INK}" stroke-width="2.5"/>
      <circle cx="50" cy="40" r="6" fill="#5b6068" stroke="${INK}" stroke-width="2"/>
      ${[0, 1, 2, 3, 4, 5].map((k) => { const a = (k * Math.PI) / 3 - Math.PI / 2; const x = 50 + 15 * Math.cos(a), y = 40 + 15 * Math.sin(a); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5.6" fill="${k < 4 ? '#d9a441' : '#2a2320'}" stroke="${INK}" stroke-width="1.6"/>${k < 4 ? `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2" fill="#f4d58d"/>` : ''}`; }).join('')}
      <path d="M84 22 A38 38 0 0 1 84 58" fill="none" stroke="#b3261e" stroke-width="4" stroke-linecap="round"/><path d="M79 56 l6 6 l3 -8" fill="none" stroke="#b3261e" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M14 30 l10 -4 l0 8z" fill="#d9a441" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`,
    schivata: `
      <path d="M8 40 h30 M12 30 h18 M12 50 h18" stroke="#8a6a44" stroke-width="3" stroke-linecap="round" opacity=".6"/>
      <circle cx="62" cy="18" r="8" fill="#e8b98f" stroke="${INK}" stroke-width="2"/>
      <path d="M50 12 q12 -10 26 0 l-2 4 h-22z" fill="#7a4a24" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M62 26 C70 34 70 46 66 54 L74 74 M66 54 L54 72 M64 34 L80 28 M64 36 L48 42" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M20 22 l14 0" stroke="#d9a441" stroke-width="4" stroke-linecap="round"/><path d="M36 22 l6 0" stroke="#fff3c0" stroke-width="4" stroke-linecap="round"/>`,
    revolver: `
      <path d="M14 30 h54 v10 h-54z" fill="#8a8f98" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
      <rect x="44" y="26" width="22" height="20" rx="4" fill="#6d727b" stroke="${INK}" stroke-width="2.5"/>
      <path d="M47 32 h16 M47 38 h16" stroke="${INK}" stroke-width="1.6"/>
      <path d="M66 30 h10 l4 6 v6 l-6 4 l2 20 q-2 6 -12 6 l-8 -22 z" fill="#8b5a2b" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M58 46 q2 10 -4 12" fill="none" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M76 30 l4 -6 l3 2 l-3 6" fill="#6d727b" stroke="${INK}" stroke-width="2"/><rect x="10" y="28" width="6" height="4" fill="#6d727b" stroke="${INK}" stroke-width="1.5"/>
      <path d="M4 35 l-3 -3 M4 35 l-4 0 M4 35 l-3 3" stroke="#e8a33a" stroke-width="2" stroke-linecap="round"/>`,
    winchester: `
      <path d="M4 34 h60 v6 h-60z" fill="#8a8f98" stroke="${INK}" stroke-width="2.2"/>
      <path d="M6 40 h44 v4 h-44z" fill="#6d727b" stroke="${INK}" stroke-width="1.8"/>
      <path d="M50 32 h16 v14 h-16z" fill="#6d727b" stroke="${INK}" stroke-width="2.2"/>
      <path d="M66 32 l28 6 v14 l-8 4 l-22 -10z" fill="#8b5a2b" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M52 46 q0 12 10 12 q8 0 8 -8" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M20 40 h26" stroke="#8b5a2b" stroke-width="5"/><path d="M8 32 v-3 h3 v3" fill="none" stroke="${INK}" stroke-width="1.6"/>`,
    dinamite: `
      <g transform="rotate(-12 50 46)">
        <rect x="28" y="28" width="13" height="40" rx="3" fill="#c0392b" stroke="${INK}" stroke-width="2.2"/>
        <rect x="43" y="26" width="13" height="42" rx="3" fill="#d6483a" stroke="${INK}" stroke-width="2.2"/>
        <rect x="58" y="28" width="13" height="40" rx="3" fill="#c0392b" stroke="${INK}" stroke-width="2.2"/>
        <path d="M26 44 h47 M26 54 h47" stroke="#6b4a2a" stroke-width="3"/>
        <path d="M50 26 C50 14 60 12 64 8" fill="none" stroke="${INK}" stroke-width="2.2"/>
      </g>
      <g transform="translate(66 8)"><path d="M0 -8 L2 -2 L8 0 L2 2 L0 8 L-2 2 L-8 0 L-2 -2Z" fill="#ffd34d" stroke="#e87b1c" stroke-width="1.2"/></g>`,
    rimbalzo: `
      <path d="M70 10 v60" stroke="#8a8f98" stroke-width="8" stroke-linecap="round"/><path d="M70 10 v60" stroke="#c7ccd4" stroke-width="3" stroke-linecap="round"/>
      <path d="M8 22 L66 40 L14 62" fill="none" stroke="#b3261e" stroke-width="3" stroke-dasharray="6 4" stroke-linecap="round"/>
      <path d="M14 62 l8 -8 M14 62 l11 1" stroke="#b3261e" stroke-width="3.4" stroke-linecap="round"/>
      <g transform="translate(66 40)"><path d="M0 -9 L3 -3 L9 -2 L4 2 L6 9 L0 5 L-6 9 L-4 2 L-9 -2 L-3 -3Z" fill="#ffd34d" stroke="#e87b1c" stroke-width="1.2"/></g>
      <path d="M8 22 l10 3" stroke="#d9a441" stroke-width="5" stroke-linecap="round"/>`,
    errore: `
      <g transform="rotate(-10 34 46)"><rect x="22" y="30" width="10" height="34" rx="2.5" fill="#c0392b" stroke="${INK}" stroke-width="2"/><rect x="34" y="28" width="10" height="36" rx="2.5" fill="#d6483a" stroke="${INK}" stroke-width="2"/>
        <path d="M20 44 h26" stroke="#6b4a2a" stroke-width="3"/><path d="M39 28 C39 18 46 16 48 12" fill="none" stroke="${INK}" stroke-width="2"/></g>
      <path d="M58 58 C84 58 90 22 66 20 L60 20" fill="none" stroke="#2c6fbb" stroke-width="5" stroke-linecap="round"/><path d="M64 12 l-8 8 l8 8" fill="none" stroke="#2c6fbb" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="80" y="76" font-family="Rye, Georgia, serif" font-size="22" fill="${INK}" text-anchor="middle">?</text>`,
  };

  const CARTE = {
    ricarica: { nome: 'Ricarica', costo: 0, testo: '+1 pallottola. Riprendi in mano gli scarti.' },
    schivata: { nome: 'Schivata', costo: 0, testo: 'Annulla Revolver e Winchester. Recuperi 1 carta.' },
    revolver: { nome: 'Revolver', costo: 1, arma: true, testo: '−1 vita al bersaglio.' },
    winchester: { nome: 'Winchester', costo: 2, arma: true, testo: '−1 vita. Batte il Revolver.' },
    dinamite: { nome: 'Dinamite', costo: 5, arma: true, testo: '−2 vite. Non si schiva, non rimbalza.' },
    rimbalzo: { nome: 'Rimbalzo', costo: 0, testo: 'Devia Revolver e Winchester al successivo.' },
    errore: { nome: 'Errore di calcolo', costo: 2, testo: 'La Dinamite torna a chi l\'ha tirata.' },
  };
  const TINTA = { ricarica: '#6d8f3a', schivata: '#3f7ca0', revolver: '#8a4b2a', winchester: '#6a3d24', dinamite: '#b3261e', rimbalzo: '#5d6b7a', errore: '#5b4a8c' };
  const tipoDi = (id) => String(id).split('-')[0];
  const pallottole = (n) => Array.from({ length: n }, () => '<i class="fw-pall"></i>').join('');

  function cartaAzione(id, { cls = '', attr = '', piccola = false } = {}) {
    const t = tipoDi(id);
    const c = CARTE[t];
    return `<div class="fw-carta azione ${piccola ? 'piccola' : ''} ${cls}" style="--tinta:${TINTA[t]}" data-id="${id}" ${attr} title="${c.nome}: ${c.testo}">
      <div class="fw-titolo">${c.nome}</div>
      <svg class="fw-ill" viewBox="0 0 100 80" aria-hidden="true">${ILLUSTRAZIONI[t]}</svg>
      ${c.costo ? `<div class="fw-costo" aria-label="costa ${c.costo} pallottole">${pallottole(c.costo)}</div>` : '<div class="fw-costo gratis">gratis</div>'}
      ${piccola ? '' : `<p class="fw-testo">${c.testo}</p>`}</div>`;
  }

  const DORSO_SVG = `<svg viewBox="0 0 60 84" preserveAspectRatio="none" aria-hidden="true">
    <rect width="60" height="84" fill="#5a3a22"/><g stroke="#4a2e1a" stroke-width="1.2" fill="none">${Array.from({ length: 9 }, (_, k) => `<path d="M0 ${k * 10 + 4} q30 ${k % 2 ? 3 : -3} 60 0"/>`).join('')}</g>
    <rect x="4" y="4" width="52" height="76" rx="5" fill="none" stroke="#d9a441" stroke-width="1.6" stroke-dasharray="3 2"/>
    <path d="M30 26 l4.4 9 l9.9 1.4 l-7.2 7 l1.7 9.8 l-8.8 -4.6 l-8.8 4.6 l1.7 -9.8 l-7.2 -7 l9.9 -1.4z" fill="#d9a441" stroke="#8a5a1a" stroke-width="1.2"/>
    <circle cx="30" cy="42" r="3" fill="#8a5a1a"/></svg>`;
  const dorso = ({ cls = '', attr = '' } = {}) => `<div class="fw-carta dorso ${cls}" ${attr}>${DORSO_SVG}</div>`;

  // ---------- carta bersaglio: direzione + evento ----------
  const FRECCE = {
    destra: '<path d="M14 40 H74" /><path d="M62 26 L78 40 L62 54" />',
    sinistra: '<path d="M86 40 H26" /><path d="M38 26 L22 40 L38 54" />',
    doppia: '<path d="M22 40 H78" /><path d="M34 28 L20 40 L34 52" /><path d="M66 28 L80 40 L66 52" />',
    incrociata: '<path d="M22 18 L78 62" /><path d="M22 62 L78 18" /><path d="M64 60 L80 64 L76 48" /><path d="M64 20 L80 16 L76 32" /><circle cx="50" cy="40" r="7" />',
  };
  const ICONE_EVENTO = {
    salsola: '<circle cx="24" cy="24" r="16" fill="none" stroke="#8a6a44" stroke-width="2.4"/><path d="M12 18 q12 6 24 0 M10 28 q14 -6 28 2 M16 36 q8 -14 16 -26 M28 38 q-2 -16 -10 -28" stroke="#8a6a44" stroke-width="1.8" fill="none"/>',
    prete: '<path d="M14 40 L20 18 H28 L34 40Z" fill="#2a2320"/><circle cx="24" cy="13" r="6" fill="#e8b98f" stroke="#2a2320" stroke-width="1.6"/><path d="M10 9 h28" stroke="#2a2320" stroke-width="4" stroke-linecap="round"/><path d="M24 22 v10 M20 26 h8" stroke="#f4e3b0" stroke-width="2.4"/>',
    ravvicinato: '<circle cx="16" cy="24" r="9" fill="#e8b98f" stroke="#2a2320" stroke-width="1.8"/><circle cx="32" cy="24" r="9" fill="#e8b98f" stroke="#2a2320" stroke-width="1.8"/><path d="M4 18 h22 M22 18 h22" stroke="#7a4a24" stroke-width="4"/><path d="M20 26 l4 -4 l4 4" stroke="#b3261e" stroke-width="2" fill="none"/>',
    aperto: '<path d="M4 34 H44" stroke="#8a6a44" stroke-width="2"/><circle cx="34" cy="14" r="6" fill="#f2c94c"/><path d="M8 34 v-8 q2 -4 4 0 v8 M30 34 v-6 q2 -3 4 0 v6" stroke="#5f8a3a" stroke-width="3" fill="none"/>',
    barile: '<ellipse cx="24" cy="10" rx="13" ry="4" fill="#8b5a2b" stroke="#3b2414" stroke-width="1.8"/><path d="M11 10 q-3 14 0 28 h26 q3 -14 0 -28" fill="#a86b3a" stroke="#3b2414" stroke-width="1.8"/><path d="M10 18 h28 M10 30 h28" stroke="#5b6068" stroke-width="2.4"/>',
    pioggia: '<path d="M8 16 q2 -10 12 -8 q4 -6 12 -2 q10 0 8 10z" fill="#8a8f98" stroke="#3b2414" stroke-width="1.6"/><g fill="#d9a441" stroke="#3b2414" stroke-width="1"><rect x="12" y="24" width="4" height="8" rx="2"/><rect x="22" y="30" width="4" height="8" rx="2"/><rect x="32" y="24" width="4" height="8" rx="2"/></g>',
    flashback: '<circle cx="24" cy="24" r="15" fill="#f4e3b0" stroke="#3b2414" stroke-width="2"/><path d="M24 14 v10 l7 5" stroke="#3b2414" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M6 14 a20 20 0 0 1 8 -8" stroke="#2c6fbb" stroke-width="3" fill="none"/><path d="M5 8 l1 7 l7 -1" stroke="#2c6fbb" stroke-width="3" fill="none"/>',
  };
  const NOMI_DIR = { destra: 'A destra', sinistra: 'A sinistra', doppia: 'Doppia', incrociata: 'Incrociata' };
  const TESTO_DIR = { destra: 'Spari al pistolero alla tua destra', sinistra: 'Spari al pistolero alla tua sinistra', doppia: 'Spari a entrambi i vicini', incrociata: 'Scegli tu a chi sparare' };
  const EVENTI = {
    salsola: ['Salsola', 'Rotola una salsola. Non succede niente.'],
    prete: ['Passa il prete', '+1 pallottola a tutti.'],
    ravvicinato: ['Scontro ravvicinato', 'La Schivata non ha effetto.'],
    aperto: ['In campo aperto', 'Il Rimbalzo non ha effetto.'],
    barile: ['Quel comodo barile', 'Chi ricarica prende 1 pallottola in più.'],
    pioggia: ['Pioggia di pallottole', 'Le armi sono gratis, ma servono le pallottole.'],
    flashback: ['Flashback', 'Tutti recuperano 1 carta scartata.'],
  };
  function cartaBersaglio(c, { cls = '' } = {}) {
    if (!c) return dorso({ cls: 'bersaglio' });
    const [nomeEv, testoEv] = EVENTI[c.evento];
    return `<div class="fw-carta bersaglio ${cls} ev-${c.evento}">
      <div class="fw-dir"><svg viewBox="0 0 100 80" aria-hidden="true">${FRECCE[c.dir]}</svg><b>${NOMI_DIR[c.dir]}</b><small>${TESTO_DIR[c.dir]}</small></div>
      <div class="fw-evento"><svg viewBox="0 0 48 44" aria-hidden="true">${ICONE_EVENTO[c.evento]}</svg><div><b>${nomeEv}</b><small>${testoEv}</small></div></div></div>`;
  }

  // ---------- i 14 pistoleri (viewBox 0 0 100 100) ----------
  const busto = (giacca, camicia = '#f4e3b0') => `<path d="M14 100 C16 78 32 70 50 70 C68 70 84 78 86 100Z" fill="${giacca}" stroke="${INK}" stroke-width="2.4"/><path d="M42 70 L50 86 L58 70Z" fill="${camicia}" stroke="${INK}" stroke-width="1.8"/>`;
  const testa = (pelle) => `<rect x="44" y="58" width="12" height="14" fill="${pelle}" stroke="${INK}" stroke-width="2"/><ellipse cx="50" cy="46" rx="17" ry="19" fill="${pelle}" stroke="${INK}" stroke-width="2.4"/>`;
  const occhiFw = (y = 45) => `<circle cx="43" cy="${y}" r="2.2" fill="${INK}"/><circle cx="57" cy="${y}" r="2.2" fill="${INK}"/>`;
  const cowboy = (col, fascia = '#3b2414') => `<path d="M16 34 q34 10 68 0 q-4 6 -14 8 h-40 q-10 -2 -14 -8z" fill="${col}" stroke="${INK}" stroke-width="2.2"/><path d="M32 34 C32 16 38 12 50 16 C62 12 68 16 68 34Z" fill="${col}" stroke="${INK}" stroke-width="2.2"/><path d="M32 30 h36" stroke="${fascia}" stroke-width="4"/>`;
  const baffi = (c = '#4a2e1a') => `<path d="M40 55 q10 -5 20 0 q-4 5 -10 2 q-6 3 -10 -2z" fill="${c}"/>`;
  const PISTOLERI = {
    baro: { nome: 'Il Baro', vite: 3, svg: `${busto('#2d2d3a', '#e7e0cf')}${testa('#e8b98f')}${occhiFw()}${baffi('#1e1a17')}<path d="M46 60 q4 2 8 0" stroke="${INK}" stroke-width="1.6" fill="none"/>
      <rect x="34" y="8" width="32" height="24" fill="#1e1a17" stroke="${INK}" stroke-width="2"/><path d="M26 32 h48" stroke="#1e1a17" stroke-width="5" stroke-linecap="round"/><path d="M34 26 h32" stroke="#b3261e" stroke-width="3"/>
      <g transform="translate(70 76) rotate(-10)"><rect x="-6" y="-10" width="12" height="17" rx="2" fill="#fff" stroke="${INK}" stroke-width="1.4"/><rect x="0" y="-12" width="12" height="17" rx="2" fill="#fff" stroke="${INK}" stroke-width="1.4" transform="rotate(14)"/><text x="6" y="0" font-size="9" fill="#b3261e" transform="rotate(14)">♥</text></g>` },
    ninja: { nome: 'Il Ninja', vite: 3, svg: `${busto('#1f2430', '#1f2430')}<ellipse cx="50" cy="46" rx="18" ry="20" fill="#1f2430" stroke="${INK}" stroke-width="2.4"/><rect x="34" y="40" width="32" height="10" rx="4" fill="#e8b98f"/>
      <path d="M40 45 l6 -2 M60 45 l-6 -2" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/><path d="M66 36 q14 -4 20 6 q-10 -2 -18 2" fill="#b3261e"/><path d="M30 38 h40" stroke="#b3261e" stroke-width="3"/>
      <path d="M72 92 L90 60" stroke="#8a8f98" stroke-width="3"/><path d="M70 96 l4 -8" stroke="#3b2414" stroke-width="5"/>` },
    sceriffo: { nome: 'Lo Sceriffo', vite: 3, svg: `${busto('#7a4a24')}${testa('#d9a07a')}${occhiFw()}${baffi()}${cowboy('#8b5a2b')}
      <path d="M36 80 l3 6 l7 1 l-5 5 l1 7 l-6 -3 l-6 3 l1 -7 l-5 -5 l7 -1z" fill="#f2c94c" stroke="#8a5a1a" stroke-width="1.4"/>` },
    dottoressa: { nome: 'La Dottoressa', vite: 2, svg: `${busto('#f4f1ea', '#8fb8d8')}<path d="M30 44 q-2 26 6 30 M70 44 q2 26 -6 30" stroke="#6b3a1e" stroke-width="7" fill="none" stroke-linecap="round"/>${testa('#f0c8a0')}${occhiFw()}<path d="M45 57 q5 3 10 0" stroke="${INK}" stroke-width="1.6" fill="none"/>
      <path d="M32 32 C32 18 68 18 68 32 L64 36 H36Z" fill="#fff" stroke="${INK}" stroke-width="2"/><path d="M50 22 v10 M45 27 h10" stroke="#b3261e" stroke-width="3"/>
      <path d="M36 74 q-4 12 6 16 q8 2 8 -6" fill="none" stroke="#5b6068" stroke-width="2.4"/><circle cx="50" cy="84" r="3" fill="#8a8f98" stroke="${INK}" stroke-width="1.2"/>` },
    mancino: { nome: 'Il Mancino', vite: 3, svg: `${busto('#5d6b7a')}${testa('#e0b08a')}${occhiFw(44)}<path d="M33 52 q17 8 34 0 v8 q-17 8 -34 0z" fill="#b3261e" stroke="${INK}" stroke-width="1.6"/>${cowboy('#8a8f98', '#5d6b7a')}
      <path d="M20 82 a10 10 0 1 1 10 10" fill="none" stroke="#f2c94c" stroke-width="3"/><path d="M26 92 l5 1 l-1 -5" fill="none" stroke="#f2c94c" stroke-width="3"/>` },
    minatore: { nome: 'Il Minatore', vite: 2, svg: `${busto('#4a6a8a', '#c7a46b')}${testa('#d9a07a')}${occhiFw()}<path d="M36 52 q14 14 28 0 q0 14 -14 16 q-14 -2 -14 -16z" fill="#6b4a2a"/>
      <path d="M30 34 C30 16 70 16 70 34 Z" fill="#f2c94c" stroke="${INK}" stroke-width="2.2"/><path d="M26 34 h48" stroke="#c99a1c" stroke-width="4" stroke-linecap="round"/><circle cx="50" cy="24" r="5" fill="#fff6c8" stroke="${INK}" stroke-width="1.6"/>
      <path d="M72 70 L88 96" stroke="#8b5a2b" stroke-width="4"/><path d="M62 72 q14 -10 26 2" fill="none" stroke="#6d727b" stroke-width="4" stroke-linecap="round"/>` },
    vedova: { nome: 'La Vedova Nera', vite: 2, svg: `${busto('#1e1a1e', '#3a2a3a')}${testa('#f0d0c0')}<circle cx="43" cy="45" r="2.2" fill="${INK}"/><circle cx="57" cy="45" r="2.2" fill="${INK}"/><path d="M38 41 l6 1 M62 41 l-6 1" stroke="${INK}" stroke-width="1.6"/><path d="M45 57 q5 2 10 0" stroke="#8e1d27" stroke-width="2.4" fill="none"/>
      <path d="M26 34 C28 10 72 10 74 34 L78 74 C66 60 62 40 50 38 C38 40 34 60 22 74Z" fill="#1e1a1e" opacity=".92" stroke="${INK}" stroke-width="2"/><path d="M30 36 q20 -8 40 0" stroke="#3a2a3a" stroke-width="3" fill="none"/>
      <circle cx="68" cy="80" r="5" fill="#b3261e"/><path d="M68 85 q-2 6 2 12" stroke="#2e6a2e" stroke-width="2" fill="none"/>` },
    cacciatore: { nome: 'Il Cacciatore di taglie', vite: 3, svg: `${busto('#3a3a2a', '#8a7a5a')}${testa('#c99670')}${occhiFw()}<path d="M38 54 q12 10 24 0" stroke="#3a2a1a" stroke-width="3" fill="none"/><path d="M40 60 l4 2 M56 60 l-4 2" stroke="#3a2a1a" stroke-width="2"/>${cowboy('#3a2a1a', '#8a6a44')}
      <g transform="translate(66 74) rotate(8)"><rect width="22" height="26" fill="#f4e3b0" stroke="${INK}" stroke-width="1.4"/><text x="11" y="8" font-size="6" text-anchor="middle" fill="${INK}" font-family="Rye, Georgia, serif">TAGLIA</text><circle cx="11" cy="16" r="4.5" fill="#c9a77a"/></g>` },
    becchino: { nome: 'Il Becchino', vite: 3, svg: `${busto('#2a2a2a', '#bdb7a8')}${testa('#d8d0c4')}<path d="M40 44 h6 M54 44 h6" stroke="${INK}" stroke-width="2.4"/><path d="M45 58 h10" stroke="${INK}" stroke-width="1.8"/>
      <rect x="36" y="2" width="28" height="32" fill="#2a2a2a" stroke="${INK}" stroke-width="2"/><path d="M28 34 h44" stroke="#2a2a2a" stroke-width="5" stroke-linecap="round"/>
      <path d="M78 58 L78 96" stroke="#8b5a2b" stroke-width="3"/><path d="M72 88 h12 l-2 10 h-8z" fill="#8a8f98" stroke="${INK}" stroke-width="1.4"/><path d="M74 58 h8" stroke="#8b5a2b" stroke-width="3"/>` },
    azzardo: { nome: 'Il Giocatore d\'azzardo', vite: 3, svg: `${busto('#2e5a3a', '#f4e3b0')}${testa('#e8b98f')}<circle cx="43" cy="45" r="2.2" fill="${INK}"/><path d="M54 45 q3 -3 6 0" stroke="${INK}" stroke-width="2" fill="none"/><path d="M44 56 q6 5 12 -1" stroke="${INK}" stroke-width="1.8" fill="none"/>
      <ellipse cx="50" cy="30" rx="24" ry="5" fill="#2e5a3a" stroke="${INK}" stroke-width="2"/><path d="M36 30 C36 14 64 14 64 30Z" fill="#2e5a3a" stroke="${INK}" stroke-width="2"/><path d="M36 26 h28" stroke="#f2c94c" stroke-width="3"/>
      <g transform="translate(68 76) rotate(15)"><rect width="16" height="16" rx="3" fill="#fff" stroke="${INK}" stroke-width="1.6"/><circle cx="4.5" cy="4.5" r="1.6" fill="${INK}"/><circle cx="8" cy="8" r="1.6" fill="${INK}"/><circle cx="11.5" cy="11.5" r="1.6" fill="${INK}"/></g>` },
    infallibile: { nome: 'L\'Infallibile', vite: 2, svg: `${busto('#e7e0cf', '#8a8f98')}${testa('#e0b08a')}<circle cx="43" cy="45" r="2.2" fill="${INK}"/><path d="M53 45 h8" stroke="${INK}" stroke-width="2.4"/><path d="M44 57 h10" stroke="${INK}" stroke-width="1.8"/>${cowboy('#f4f1ea', '#1e1a17')}
      <g transform="translate(57 45)" fill="none" stroke="#b3261e" stroke-width="1.6"><circle r="8"/><path d="M-11 0 h6 M5 0 h6 M0 -11 v6 M0 5 v6"/></g>` },
    cartomante: { nome: 'La Cartomante', vite: 3, svg: `${busto('#5b3a7a', '#e2c8f0')}<path d="M30 40 q-4 30 4 34 M70 40 q4 30 -4 34" stroke="#1e1a17" stroke-width="7" fill="none" stroke-linecap="round"/>${testa('#e0b08a')}<path d="M40 45 q3 -3 6 0 M54 45 q3 -3 6 0" stroke="${INK}" stroke-width="2" fill="none"/>
      <path d="M31 36 q19 -8 38 0" stroke="#8e5ab8" stroke-width="6" fill="none"/><circle cx="50" cy="32" r="3" fill="#f2c94c"/><path d="M44 62 q6 3 12 0" stroke="#8e1d27" stroke-width="1.8" fill="none"/>
      <circle cx="50" cy="88" r="10" fill="#bfe3ff" stroke="${INK}" stroke-width="1.8" opacity=".95"/><path d="M45 85 a5 5 0 0 1 5 -4" stroke="#fff" stroke-width="2" fill="none"/><path d="M40 98 h20" stroke="#8b5a2b" stroke-width="3"/>` },
    sciamana: { nome: 'La Sciamana', vite: 3, svg: `${busto('#a8643a', '#e8c89a')}<path d="M32 40 q-4 34 2 40 M68 40 q4 34 -2 40" stroke="#1e1a17" stroke-width="6" fill="none" stroke-linecap="round"/>${testa('#b8805a')}${occhiFw()}<path d="M45 57 q5 2 10 0" stroke="${INK}" stroke-width="1.6" fill="none"/>
      <path d="M34 50 l4 -3 l4 3 M58 50 l4 -3 l4 3" stroke="#e8f0f8" stroke-width="1.8" fill="none"/>
      <path d="M32 34 q18 -6 36 0" stroke="#2c6fbb" stroke-width="5" fill="none"/>
      <path d="M66 32 C74 20 76 8 72 2 C66 10 64 22 66 32Z" fill="#f4f1ea" stroke="${INK}" stroke-width="1.4"/><path d="M69 30 L72 4" stroke="${INK}" stroke-width="1"/>` },
    fantasma: { nome: 'Il Fantasma', vite: 3, svg: `<path d="M18 100 C18 70 26 26 50 24 C74 26 82 70 82 100 l-8 -6 l-8 6 l-8 -6 l-8 6 l-8 -6 l-8 6 l-8 -6z" fill="#eef3f8" stroke="#7d8fa3" stroke-width="2.4" opacity=".95"/>
      <ellipse cx="42" cy="48" rx="5" ry="7" fill="#2a3440"/><ellipse cx="58" cy="48" rx="5" ry="7" fill="#2a3440"/><ellipse cx="50" cy="64" rx="5" ry="6" fill="#2a3440"/>
      <g opacity=".75">${cowboy('#c7d2de', '#7d8fa3')}</g>` },
  };
  const retroRitratto = `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M14 100 C16 78 32 70 50 70 C68 70 84 78 86 100Z" fill="#3b2a1e"/><ellipse cx="50" cy="46" rx="17" ry="19" fill="#3b2a1e"/>${cowboy('#2a1e16', '#3b2a1e')}<text x="50" y="56" font-size="22" text-anchor="middle" fill="#d9a441" font-family="Rye, Georgia, serif">?</text></svg>`;

  function ritratto(pid, { cls = '' } = {}) {
    const p = pid && PISTOLERI[pid];
    return `<div class="fw-ritratto ${p ? '' : 'segreto'} ${cls}" title="${p ? p.nome : 'Pistolero segreto'}">${p ? `<svg viewBox="0 0 100 100" aria-hidden="true">${p.svg}</svg>` : retroRitratto}</div>`;
  }

  window.FastWestCarte = { cartaAzione, cartaBersaglio, dorso, ritratto, CARTE, PISTOLERI, EVENTI, NOMI_DIR, TESTO_DIR, tipoDi, pallottole };
})();
