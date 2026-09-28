// LA PEPPA TENCIA: i disegni delle carte (tutti inventati, in SVG, viewBox 0 0 100 100)
(() => {
  const occhi = (x1, x2, y, r = 4.2) => `<circle cx="${x1}" cy="${y}" r="${r}" fill="#2b2230"/><circle cx="${x2}" cy="${y}" r="${r}" fill="#2b2230"/><circle cx="${x1 + 1.4}" cy="${y - 1.5}" r="1.4" fill="#fff"/><circle cx="${x2 + 1.4}" cy="${y - 1.5}" r="1.4" fill="#fff"/>`;
  const guance = (x1, x2, y, c = '#ff9db0') => `<ellipse cx="${x1}" cy="${y}" rx="5.5" ry="3.4" fill="${c}" opacity=".75"/><ellipse cx="${x2}" cy="${y}" rx="5.5" ry="3.4" fill="${c}" opacity=".75"/>`;
  const bocca = (x, y, w = 5) => `<path d="M${x - w} ${y} q${w / 2} ${w * 0.7} ${w} 0 q${w / 2} ${w * 0.7} ${w} 0" fill="none" stroke="#2b2230" stroke-width="2" stroke-linecap="round"/>`;
  const baffi = (y, c = '#2b2230') => `<g stroke="${c}" stroke-width="1.4" stroke-linecap="round" opacity=".6"><path d="M28 ${y} l-14 -3M28 ${y + 4} l-14 2M72 ${y} l14 -3M72 ${y + 4} l14 2"/></g>`;
  const L = '#2b2230';

  const ANIMALI = {
    gatto: { fondo: '#ffe3c7', svg: `
      <path d="M22 44 L26 14 L44 30 Z M78 44 L74 14 L56 30 Z" fill="#f59f4a" stroke="${L}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M27 38 L29 21 L39 30 Z M73 38 L71 21 L61 30 Z" fill="#ffb3c1"/>
      <ellipse cx="50" cy="56" rx="32" ry="28" fill="#f59f4a" stroke="${L}" stroke-width="2.4"/>
      <path d="M44 30 l2 9 M50 29 v10 M56 30 l-2 9" stroke="#c96a1b" stroke-width="3" stroke-linecap="round"/>
      <ellipse cx="50" cy="66" rx="14" ry="10" fill="#fff4e6"/>
      ${occhi(38, 62, 53)}<path d="M47 61 h6 l-3 3.5z" fill="#ff7a93"/>${bocca(50, 65, 4)}${baffi(62)}${guance(30, 70, 64)}` },
    rana: { fondo: '#dff5d0', svg: `
      <ellipse cx="50" cy="62" rx="38" ry="26" fill="#72c44a" stroke="${L}" stroke-width="2.4"/>
      <circle cx="31" cy="36" r="13" fill="#72c44a" stroke="${L}" stroke-width="2.4"/><circle cx="69" cy="36" r="13" fill="#72c44a" stroke="${L}" stroke-width="2.4"/>
      <circle cx="31" cy="36" r="8" fill="#fff"/><circle cx="69" cy="36" r="8" fill="#fff"/>${occhi(32, 70, 37, 4.6)}
      <path d="M26 66 q24 18 48 0" fill="#e25d6c" stroke="${L}" stroke-width="2.4" stroke-linejoin="round"/>
      <circle cx="44" cy="54" r="1.6" fill="${L}"/><circle cx="56" cy="54" r="1.6" fill="${L}"/>${guance(22, 78, 60)}
      <circle cx="30" cy="76" r="2" fill="#4f9a2f"/><circle cx="72" cy="78" r="2.4" fill="#4f9a2f"/>` },
    coniglio: { fondo: '#f1e9ff', svg: `
      <path d="M36 44 C28 26 30 6 38 6 C46 6 46 26 44 44Z M64 44 C72 26 70 6 62 6 C54 6 54 26 56 44Z" fill="#f4f1f6" stroke="${L}" stroke-width="2.4"/>
      <path d="M38 40 C34 26 35 12 38 12 C42 12 42 26 41 40Z M62 40 C66 26 65 12 62 12 C58 12 58 26 59 40Z" fill="#ffb3c8"/>
      <ellipse cx="50" cy="62" rx="30" ry="26" fill="#f4f1f6" stroke="${L}" stroke-width="2.4"/>
      ${occhi(39, 61, 58)}<ellipse cx="50" cy="66" rx="4" ry="3" fill="#ff8fab"/>
      <path d="M50 69 v4 M46 73 h8 v7 h-8z" fill="#fff" stroke="${L}" stroke-width="1.8"/>${guance(31, 69, 69)}` },
    volpe: { fondo: '#ffe1cc', svg: `
      <path d="M18 30 L30 8 L42 32Z M82 30 L70 8 L58 32Z" fill="#f07c2d" stroke="${L}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M24 28 L30 16 L36 29Z M76 28 L70 16 L64 29Z" fill="#3d2b24"/>
      <path d="M14 36 C20 24 80 24 86 36 C86 60 66 86 50 88 C34 86 14 60 14 36Z" fill="#f07c2d" stroke="${L}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M14 36 C22 44 38 56 50 88 C34 86 14 60 14 36Z M86 36 C78 44 62 56 50 88 C66 86 86 60 86 36Z" fill="#fff7ee"/>
      ${occhi(37, 63, 48)}<ellipse cx="50" cy="74" rx="5" ry="3.8" fill="${L}"/>${guance(28, 72, 60)}` },
    panda: { fondo: '#e8f3ec', svg: `
      <circle cx="24" cy="30" r="12" fill="${L}"/><circle cx="76" cy="30" r="12" fill="${L}"/>
      <ellipse cx="50" cy="56" rx="34" ry="30" fill="#fff" stroke="${L}" stroke-width="2.4"/>
      <ellipse cx="37" cy="52" rx="9" ry="11" fill="${L}" transform="rotate(20 37 52)"/><ellipse cx="63" cy="52" rx="9" ry="11" fill="${L}" transform="rotate(-20 63 52)"/>
      <circle cx="38" cy="51" r="3.4" fill="#fff"/><circle cx="62" cy="51" r="3.4" fill="#fff"/>
      <ellipse cx="50" cy="66" rx="5" ry="3.5" fill="${L}"/>${bocca(50, 71, 4)}${guance(28, 72, 68)}` },
    pinguino: { fondo: '#dcefff', svg: `
      <ellipse cx="50" cy="54" rx="34" ry="34" fill="#2f3645" stroke="${L}" stroke-width="2.4"/>
      <path d="M50 34 C30 30 22 50 30 64 C36 76 64 76 70 64 C78 50 70 30 50 34Z" fill="#fff"/>
      ${occhi(40, 60, 50)}<path d="M43 58 L57 58 L50 67Z" fill="#ffa62b" stroke="${L}" stroke-width="1.8" stroke-linejoin="round"/>${guance(33, 67, 62)}
      <path d="M22 70 q-8 10 -4 16 M78 70 q8 10 4 16" stroke="#2f3645" stroke-width="7" stroke-linecap="round" fill="none"/>` },
    gufo: { fondo: '#f3e6d6', svg: `
      <path d="M18 30 L28 12 L38 26Z M82 30 L72 12 L62 26Z" fill="#9a6b45" stroke="${L}" stroke-width="2.4" stroke-linejoin="round"/>
      <ellipse cx="50" cy="56" rx="34" ry="32" fill="#9a6b45" stroke="${L}" stroke-width="2.4"/>
      <circle cx="35" cy="48" r="13" fill="#f8e7c6" stroke="#6d4a2f" stroke-width="2"/><circle cx="65" cy="48" r="13" fill="#f8e7c6" stroke="#6d4a2f" stroke-width="2"/>
      ${occhi(35, 65, 48, 6)}<path d="M46 58 L54 58 L50 66Z" fill="#ffb02e" stroke="${L}" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M36 74 q4 -4 8 0 q4 -4 8 0 q4 -4 8 0" fill="none" stroke="#6d4a2f" stroke-width="2" stroke-linecap="round"/>` },
    maialino: { fondo: '#ffe4ec', svg: `
      <path d="M22 34 L20 16 L38 26Z M78 34 L80 16 L62 26Z" fill="#ff9fb6" stroke="${L}" stroke-width="2.4" stroke-linejoin="round"/>
      <ellipse cx="50" cy="56" rx="34" ry="30" fill="#ffb3c6" stroke="${L}" stroke-width="2.4"/>
      ${occhi(37, 63, 48)}<ellipse cx="50" cy="64" rx="13" ry="9" fill="#ff8fab" stroke="${L}" stroke-width="2"/>
      <ellipse cx="45" cy="64" rx="2.4" ry="3.4" fill="#c2566f"/><ellipse cx="55" cy="64" rx="2.4" ry="3.4" fill="#c2566f"/>${bocca(50, 76, 4)}${guance(24, 76, 60, '#ff7f9f')}` },
    pulcino: { fondo: '#fff6c9', svg: `
      <path d="M46 20 q2 -10 6 0 q4 -8 5 2" fill="none" stroke="#e8b400" stroke-width="3" stroke-linecap="round"/>
      <circle cx="50" cy="56" r="34" fill="#ffd93b" stroke="${L}" stroke-width="2.4"/>
      ${occhi(38, 62, 50)}<path d="M42 58 L58 58 L50 68Z" fill="#ff8a1f" stroke="${L}" stroke-width="1.8" stroke-linejoin="round"/>${guance(28, 72, 62)}
      <path d="M16 62 q-6 -8 2 -12 M84 62 q6 -8 -2 -12" stroke="#e8b400" stroke-width="5" stroke-linecap="round" fill="none"/>` },
    koala: { fondo: '#e6eef2', svg: `
      <circle cx="20" cy="38" r="16" fill="#a3aeb6" stroke="${L}" stroke-width="2.4"/><circle cx="80" cy="38" r="16" fill="#a3aeb6" stroke="${L}" stroke-width="2.4"/>
      <circle cx="20" cy="38" r="9" fill="#f2e6ec"/><circle cx="80" cy="38" r="9" fill="#f2e6ec"/>
      <ellipse cx="50" cy="56" rx="30" ry="29" fill="#a3aeb6" stroke="${L}" stroke-width="2.4"/>
      ${occhi(38, 62, 50)}<ellipse cx="50" cy="63" rx="7" ry="10" fill="#3a3440"/><ellipse cx="48" cy="58" rx="2" ry="3" fill="#fff" opacity=".5"/>${guance(30, 70, 66)}` },
    riccio: { fondo: '#f0e4d4', svg: `
      <path d="M12 60 L6 44 L18 46 L14 30 L26 36 L28 20 L38 30 L46 14 L52 28 L62 16 L66 32 L78 22 L78 38 L92 36 L86 50 L96 58 L84 64 L88 76 L20 80Z" fill="#7a5638" stroke="${L}" stroke-width="2.2" stroke-linejoin="round"/>
      <ellipse cx="52" cy="64" rx="30" ry="22" fill="#f6dfc0" stroke="${L}" stroke-width="2.4"/>
      ${occhi(42, 62, 60)}<circle cx="80" cy="66" r="4.4" fill="${L}"/>${bocca(52, 72, 4)}${guance(34, 68, 70)}` },
    tartaruga: { fondo: '#e3f4e4', svg: `
      <path d="M20 70 C20 40 40 28 60 28 C80 28 92 44 92 70Z" fill="#5e9e4f" stroke="${L}" stroke-width="2.4"/>
      <path d="M46 42 l10 -6 l12 4 l2 12 l-10 8 l-12 -4z M34 60 l6 -10 M78 56 l8 8 M50 66 l2 4 M70 62 l-2 8" fill="#7cc06a" stroke="#3f7334" stroke-width="2" stroke-linejoin="round"/>
      <path d="M14 72 h84" stroke="#3f7334" stroke-width="5" stroke-linecap="round"/>
      <circle cx="18" cy="52" r="15" fill="#9fdc86" stroke="${L}" stroke-width="2.4"/>
      ${occhi(13, 24, 49, 3.4)}${bocca(18, 57, 3)}<ellipse cx="10" cy="56" rx="3" ry="2" fill="#ff9db0"/>
      <path d="M28 78 v8 M84 78 v8" stroke="#9fdc86" stroke-width="7" stroke-linecap="round"/>` },
    orsetto: { fondo: '#f3e2d2', svg: `
      <circle cx="24" cy="30" r="12" fill="#a86b43" stroke="${L}" stroke-width="2.4"/><circle cx="76" cy="30" r="12" fill="#a86b43" stroke="${L}" stroke-width="2.4"/>
      <circle cx="24" cy="30" r="6" fill="#e8b98f"/><circle cx="76" cy="30" r="6" fill="#e8b98f"/>
      <circle cx="50" cy="56" r="32" fill="#a86b43" stroke="${L}" stroke-width="2.4"/>
      <ellipse cx="50" cy="66" rx="15" ry="12" fill="#e8b98f"/>
      ${occhi(38, 62, 50)}<ellipse cx="50" cy="61" rx="5.5" ry="4" fill="${L}"/>${bocca(50, 68, 4)}${guance(28, 72, 62)}` },
    topolino: { fondo: '#eceaf4', svg: `
      <circle cx="22" cy="32" r="18" fill="#b9b6c8" stroke="${L}" stroke-width="2.4"/><circle cx="78" cy="32" r="18" fill="#b9b6c8" stroke="${L}" stroke-width="2.4"/>
      <circle cx="22" cy="32" r="11" fill="#ffc2d1"/><circle cx="78" cy="32" r="11" fill="#ffc2d1"/>
      <path d="M50 88 C28 86 22 64 24 54 C28 38 72 38 76 54 C78 64 72 86 50 88Z" fill="#b9b6c8" stroke="${L}" stroke-width="2.4"/>
      ${occhi(40, 60, 58)}<circle cx="50" cy="72" r="4.4" fill="#ff7a93" stroke="${L}" stroke-width="1.4"/>${baffi(70)}` },
    lumaca: { fondo: '#fbe9dd', svg: `
      <path d="M8 80 C20 74 60 74 92 80 L92 86 L8 86Z" fill="#f5c28a" stroke="${L}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M70 80 C70 60 74 44 80 36" stroke="#f5c28a" stroke-width="12" stroke-linecap="round" fill="none"/>
      <path d="M78 36 l-6 -16 M84 36 l6 -16" stroke="#e0a468" stroke-width="3" stroke-linecap="round"/><circle cx="72" cy="20" r="3.4" fill="${L}"/><circle cx="90" cy="20" r="3.4" fill="${L}"/>
      <circle cx="42" cy="54" r="26" fill="#d9738f" stroke="${L}" stroke-width="2.4"/>
      <path d="M42 54 m-4 0 a4 4 0 1 1 8 0 a9 9 0 1 1 -16 0 a14 14 0 1 1 28 0 a19 19 0 1 1 -38 0" fill="none" stroke="#a94766" stroke-width="3" stroke-linecap="round"/>
      <path d="M76 46 q4 4 8 0" fill="none" stroke="${L}" stroke-width="1.8" stroke-linecap="round"/>` },
    pesciolino: { fondo: '#d8f1f8', svg: `
      <circle cx="80" cy="22" r="4" fill="none" stroke="#6fc3d8" stroke-width="2"/><circle cx="88" cy="12" r="2.6" fill="none" stroke="#6fc3d8" stroke-width="2"/>
      <path d="M78 54 L96 36 L94 72Z" fill="#ff9f43" stroke="${L}" stroke-width="2.4" stroke-linejoin="round"/>
      <ellipse cx="46" cy="54" rx="36" ry="26" fill="#4dabf7" stroke="${L}" stroke-width="2.4"/>
      <path d="M40 30 q10 -14 22 -2 M44 78 q8 10 16 2" fill="#ff9f43" stroke="${L}" stroke-width="2.2" stroke-linejoin="round"/>
      <path d="M52 34 q-8 20 0 40 M62 38 q-6 16 0 32" fill="none" stroke="#2b83d6" stroke-width="2.4" stroke-linecap="round"/>
      ${occhi(28, 28, 50, 4.6)}${bocca(18, 60, 3)}${guance(30, 30, 62)}` },
    cane: { fondo: '#f6e7d3', svg: `
      <path d="M20 30 C10 34 10 60 20 64 C28 58 30 40 28 30Z M80 30 C90 34 90 60 80 64 C72 58 70 40 72 30Z" fill="#8a5a35" stroke="${L}" stroke-width="2.4" stroke-linejoin="round"/>
      <ellipse cx="50" cy="52" rx="28" ry="30" fill="#d9a066" stroke="${L}" stroke-width="2.4"/>
      <ellipse cx="62" cy="44" rx="9" ry="8" fill="#fff4e6"/>
      <ellipse cx="50" cy="68" rx="15" ry="11" fill="#fff4e6" stroke="${L}" stroke-width="1.6"/>
      ${occhi(40, 60, 48)}<ellipse cx="50" cy="62" rx="5.5" ry="4" fill="${L}"/>${bocca(50, 69, 4)}
      <path d="M47 73 q3 9 6 0" fill="#ff7a93" stroke="${L}" stroke-width="1.4"/>${guance(30, 70, 62)}` },
    pecora: { fondo: '#eef4e2', svg: `
      <g fill="#fbfaf6" stroke="${L}" stroke-width="2.2"><circle cx="30" cy="30" r="12"/><circle cx="50" cy="22" r="13"/><circle cx="70" cy="30" r="12"/><circle cx="22" cy="50" r="11"/><circle cx="78" cy="50" r="11"/></g>
      <path d="M22 50 C18 46 12 50 14 56 C18 58 22 56 24 54Z M78 50 C82 46 88 50 86 56 C82 58 78 56 76 54Z" fill="#5b4a44" stroke="${L}" stroke-width="2"/>
      <ellipse cx="50" cy="58" rx="22" ry="26" fill="#5b4a44" stroke="${L}" stroke-width="2.4"/>
      <circle cx="41" cy="54" r="5" fill="#fff"/><circle cx="59" cy="54" r="5" fill="#fff"/>${occhi(41, 59, 55, 3.2)}
      <ellipse cx="50" cy="72" rx="9" ry="6" fill="#7a6760"/><path d="M46 71 l4 3 l4 -3" fill="none" stroke="#2b2230" stroke-width="1.8" stroke-linecap="round"/>
      <g fill="#fbfaf6" stroke="${L}" stroke-width="2"><circle cx="40" cy="34" r="8"/><circle cx="52" cy="32" r="9"/><circle cx="62" cy="36" r="7"/></g>` },
    leone: { fondo: '#fff0cc', svg: `
      <g fill="#c8741f" stroke="${L}" stroke-width="2.2" stroke-linejoin="round">${Array.from({ length: 12 }, (_, k) => {
        const a = (k / 12) * Math.PI * 2; const x = 50 + Math.cos(a) * 34, y = 54 + Math.sin(a) * 32;
        return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="11"/>`; }).join('')}</g>
      <circle cx="50" cy="54" r="30" fill="#c8741f"/>
      <circle cx="30" cy="30" r="7" fill="#f2b84b" stroke="${L}" stroke-width="2"/><circle cx="70" cy="30" r="7" fill="#f2b84b" stroke="${L}" stroke-width="2"/>
      <ellipse cx="50" cy="56" rx="24" ry="23" fill="#f2b84b" stroke="${L}" stroke-width="2.4"/>
      ${occhi(41, 59, 52)}<path d="M45 60 h10 l-5 5z" fill="#6b3a1f"/>
      <ellipse cx="50" cy="69" rx="10" ry="6" fill="#fff3d6"/>${bocca(50, 67, 4)}${guance(33, 67, 64)}` },
    elefante: { fondo: '#e5ecf5', svg: `
      <ellipse cx="20" cy="48" rx="18" ry="22" fill="#a6b3c6" stroke="${L}" stroke-width="2.4"/><ellipse cx="80" cy="48" rx="18" ry="22" fill="#a6b3c6" stroke="${L}" stroke-width="2.4"/>
      <ellipse cx="20" cy="48" rx="11" ry="15" fill="#f4b8c6"/><ellipse cx="80" cy="48" rx="11" ry="15" fill="#f4b8c6"/>
      <ellipse cx="50" cy="48" rx="26" ry="26" fill="#a6b3c6" stroke="${L}" stroke-width="2.4"/>
      <path d="M43 62 C42 76 44 88 56 90 C62 90 64 84 60 82 C54 84 52 78 55 62Z" fill="#a6b3c6" stroke="${L}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M46 70 h7 M46 76 h7" stroke="#7d8aa0" stroke-width="1.8" stroke-linecap="round"/>
      ${occhi(40, 60, 46)}${guance(34, 66, 56)}` },
    polpo: { fondo: '#f5e1f3', svg: `
      <g fill="#c96fd1" stroke="${L}" stroke-width="2.2" stroke-linecap="round">${[18, 30, 42, 58, 70, 82].map((x, k) =>
        `<path d="M${x} 60 q${k % 2 ? 6 : -6} 14 ${k % 2 ? -2 : 2} 26 q6 2 8 -4 q-6 -10 -2 -22Z"/>`).join('')}</g>
      <ellipse cx="50" cy="44" rx="32" ry="30" fill="#c96fd1" stroke="${L}" stroke-width="2.4"/>
      <circle cx="36" cy="26" r="4" fill="#e3a4e8"/><circle cx="62" cy="22" r="3" fill="#e3a4e8"/>
      ${occhi(39, 61, 46, 4.8)}${bocca(50, 56, 4)}${guance(29, 71, 54)}` },
    ape: { fondo: '#fff5cf', svg: `
      <ellipse cx="32" cy="30" rx="14" ry="18" fill="#dff2ff" stroke="${L}" stroke-width="2" opacity=".9" transform="rotate(-25 32 30)"/>
      <ellipse cx="68" cy="30" rx="14" ry="18" fill="#dff2ff" stroke="${L}" stroke-width="2" opacity=".9" transform="rotate(25 68 30)"/>
      <ellipse cx="50" cy="60" rx="30" ry="26" fill="#f6c431" stroke="${L}" stroke-width="2.4"/>
      <path d="M26 72 q24 10 48 0 M22 58 q28 8 56 0" fill="none" stroke="${L}" stroke-width="6"/>
      <path d="M40 34 q-6 -12 -12 -14 M60 34 q6 -12 12 -14" fill="none" stroke="${L}" stroke-width="2.2" stroke-linecap="round"/>
      <circle cx="28" cy="20" r="3" fill="${L}"/><circle cx="72" cy="20" r="3" fill="${L}"/>
      ${occhi(41, 59, 46)}${bocca(50, 52, 3.4)}${guance(32, 68, 51)}` },
    balena: { fondo: '#d9ecfb', svg: `
      <path d="M56 22 q-4 -12 -10 -12 M56 22 q2 -12 10 -14 M56 22 q-10 -4 -16 2" fill="none" stroke="#7cc4f2" stroke-width="3" stroke-linecap="round"/>
      <path d="M8 56 C8 32 34 26 56 28 C80 30 90 46 88 60 L98 50 L96 76 L84 68 C76 82 50 86 30 82 C16 78 8 70 8 56Z" fill="#3f7fd0" stroke="${L}" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M12 64 C24 78 58 80 82 66 C74 80 48 84 30 80 C18 76 12 70 12 64Z" fill="#cfe6fb"/>
      ${occhi(30, 30, 52, 4.4)}${bocca(20, 64, 3)}${guance(36, 36, 62)}` },
    scimmia: { fondo: '#f4e6d8', svg: `
      <circle cx="18" cy="50" r="12" fill="#8a5a35" stroke="${L}" stroke-width="2.4"/><circle cx="82" cy="50" r="12" fill="#8a5a35" stroke="${L}" stroke-width="2.4"/>
      <circle cx="18" cy="50" r="6" fill="#f2c9a3"/><circle cx="82" cy="50" r="6" fill="#f2c9a3"/>
      <circle cx="50" cy="50" r="32" fill="#8a5a35" stroke="${L}" stroke-width="2.4"/>
      <path d="M50 30 C36 26 26 34 28 48 C28 58 36 60 40 62 C38 76 62 76 60 62 C64 60 72 58 72 48 C74 34 64 26 50 30Z" fill="#f2c9a3"/>
      <path d="M44 24 q6 -10 12 0" fill="none" stroke="#8a5a35" stroke-width="3" stroke-linecap="round"/>
      ${occhi(40, 60, 46)}<circle cx="47" cy="58" r="1.6" fill="${L}"/><circle cx="53" cy="58" r="1.6" fill="${L}"/>${bocca(50, 66, 5)}${guance(34, 66, 58)}` },
  };

  // la Peppa: gatta nera diabolica (corna, occhi rossi, ghigno con le zanne, coda a punta)
  const PEPPA = { fondo: '#2a1320', svg: `
      <path d="M78 86 C98 76 98 50 88 40" fill="none" stroke="#141014" stroke-width="6" stroke-linecap="round"/><path d="M86 34 L95 44 L84 45Z" fill="#c2182b"/>
      <path d="M30 22 C28 12 34 6 38 4 C36 12 38 18 40 22Z M70 22 C72 12 66 6 62 4 C64 12 62 18 60 22Z" fill="#c2182b" stroke="#6b0b16" stroke-width="1.6"/>
      <path d="M20 46 L24 16 L42 32 Z M80 46 L76 16 L58 32 Z" fill="#1b161c" stroke="#000" stroke-width="2.4" stroke-linejoin="round"/>
      <path d="M26 40 L27 24 L36 32 Z M74 40 L73 24 L64 32 Z" fill="#6b0b16"/>
      <ellipse cx="50" cy="58" rx="33" ry="29" fill="#1b161c" stroke="#000" stroke-width="2.4"/>
      <path d="M30 46 l14 6 M70 46 l-14 6" stroke="#c2182b" stroke-width="3" stroke-linecap="round"/>
      <ellipse cx="38" cy="55" rx="7" ry="6" fill="#ff2a3d"/><ellipse cx="62" cy="55" rx="7" ry="6" fill="#ff2a3d"/>
      <ellipse cx="38" cy="55" rx="1.8" ry="5" fill="#140006"/><ellipse cx="62" cy="55" rx="1.8" ry="5" fill="#140006"/>
      <circle cx="40" cy="52" r="1.3" fill="#fff"/><circle cx="64" cy="52" r="1.3" fill="#fff"/>
      <path d="M30 66 Q50 84 70 66 Q50 74 30 66Z" fill="#6b0b16" stroke="#000" stroke-width="1.6"/>
      <path d="M40 70 l2 7 l2 -6 M56 70 l2 7 l2 -6" fill="#fff"/>
      <g stroke="#c2182b" stroke-width="1.3" stroke-linecap="round" opacity=".7"><path d="M24 62 l-14 -3M24 66 l-14 2M76 62 l14 -3M76 66 l14 2"/></g>` };

  const NOMI = {
    gatto: 'Gatto', rana: 'Rana', coniglio: 'Coniglio', volpe: 'Volpe', panda: 'Panda', pinguino: 'Pinguino', gufo: 'Gufo', maialino: 'Maialino',
    pulcino: 'Pulcino', koala: 'Koala', riccio: 'Riccio', tartaruga: 'Tartaruga', orsetto: 'Orsetto', topolino: 'Topolino', lumaca: 'Lumaca', pesciolino: 'Pesciolino',
    cane: 'Cane', pecora: 'Pecora', leone: 'Leone', elefante: 'Elefante', polpo: 'Polpo', ape: 'Ape', balena: 'Balena', scimmia: 'Scimmia', peppa: 'La Peppa',
  };
  const disegno = (animale) => (animale === 'peppa' ? PEPPA : ANIMALI[animale]);

  // carta scoperta
  function carta(animale, { cls = '', attr = '', id = '' } = {}) {
    const d = disegno(animale);
    const peppa = animale === 'peppa';
    return `<div class="pp-carta fronte ${peppa ? 'peppa' : ''} ${cls}" style="--fondo:${d.fondo}" ${id ? `data-id="${id}"` : ''} ${attr} title="${NOMI[animale]}">
      <svg viewBox="0 0 100 100" aria-hidden="true">${d.svg}</svg><span class="pp-nome">${NOMI[animale]}</span></div>`;
  }
  // dorso: zampette e una luna, uguale per tutte (anche per la Peppa)
  const RETRO_SVG = `<svg viewBox="0 0 60 84" aria-hidden="true" preserveAspectRatio="none"><defs><pattern id="pp-zampe" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(18)">
      <g fill="#f1c56b" opacity=".35"><ellipse cx="10" cy="12" rx="3.4" ry="2.8"/><circle cx="6.4" cy="7.6" r="1.3"/><circle cx="9" cy="6.2" r="1.3"/><circle cx="11.8" cy="6.4" r="1.3"/><circle cx="14" cy="8.2" r="1.3"/></g></pattern></defs>
      <rect x="0" y="0" width="60" height="84" fill="#27305e"/><rect x="0" y="0" width="60" height="84" fill="url(#pp-zampe)"/>
      <rect x="4" y="4" width="52" height="76" rx="5" fill="none" stroke="#f1c56b" stroke-width="1.6"/>
      <circle cx="30" cy="42" r="11" fill="#27305e" stroke="#f1c56b" stroke-width="1.6"/><path d="M33 34 a9 9 0 1 0 0 16 a7 7 0 1 1 0 -16z" fill="#f1c56b"/></svg>`;
  const retro = ({ cls = '', attr = '' } = {}) => `<div class="pp-carta retro ${cls}" ${attr}>${RETRO_SVG}</div>`;

  window.PeppaCarte = { carta, retro, NOMI, disegno };
})();
