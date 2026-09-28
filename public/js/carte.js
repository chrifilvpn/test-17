// Carte francesi disegnate in HTML + SVG: indici agli angoli, semi disposti come sulle carte vere,
// figure incorniciate. I semi sono simboli SVG definiti una volta sola nella pagina.
window.Carte = (() => {
  const SIGLE = { 1: 'A', 11: 'J', 12: 'Q', 13: 'K' };
  const NOMI = { 1: 'Asso', 11: 'Fante', 12: 'Donna', 13: 'Re' };
  const SEMI = { c: 'cuori', q: 'quadri', f: 'fiori', p: 'picche' };
  const ROSSO = { c: true, q: true };

  // posizioni dei semi (x%, y%) come sulle carte da gioco
  const L = 30, C = 50, R = 70;
  const PIP = {
    2: [[C, 20], [C, 80]],
    3: [[C, 20], [C, 50], [C, 80]],
    4: [[L, 20], [R, 20], [L, 80], [R, 80]],
    5: [[L, 20], [R, 20], [C, 50], [L, 80], [R, 80]],
    6: [[L, 20], [R, 20], [L, 50], [R, 50], [L, 80], [R, 80]],
    7: [[L, 20], [R, 20], [C, 35], [L, 50], [R, 50], [L, 80], [R, 80]],
    8: [[L, 20], [R, 20], [C, 35], [L, 50], [R, 50], [C, 65], [L, 80], [R, 80]],
    9: [[L, 20], [R, 20], [L, 40], [R, 40], [C, 50], [L, 60], [R, 60], [L, 80], [R, 80]],
    10: [[L, 20], [R, 20], [C, 30], [L, 40], [R, 40], [L, 60], [R, 60], [C, 70], [L, 80], [R, 80]],
  };

  const seme = (s, cls = '') => `<svg class="${cls}" aria-hidden="true"><use href="#s-${s}"/></svg>`;
  const sigla = (c) => SIGLE[c.rango] || String(c.rango);
  const nome = (c) => (c.jolly ? 'Jolly' : `${NOMI[c.rango] || c.rango} di ${SEMI[c.seme]}`);

  function centro(c) {
    if (c.rango === 1) return `<div class="c-asso">${seme(c.seme)}</div>`;
    if (c.rango >= 11) {
      return `<div class="c-figura"><span class="f-lettera">${sigla(c)}</span>${seme(c.seme, 'f-seme')}<span class="f-lettera giu">${sigla(c)}</span></div>`;
    }
    return `<div class="c-pip">${PIP[c.rango].map(([x, y]) =>
      `<span style="left:${x}%;top:${y}%"${y > 50 ? ' class="giu"' : ''}>${seme(c.seme)}</span>`).join('')}</div>`;
  }

  // opz.valore: numerino discreto nell'angolo in alto a destra (es. fante = 8 nella scopa)
  function fronte(c, extra = '', attr = '', opz = {}) {
    if (c.jolly) {
      return `<div class="carta jolly ${extra}" data-id="${c.id}" title="Jolly" ${attr}>
        <span class="indice"><b>★</b></span>
        <div class="c-jolly"><span>J</span><span>O</span><span>L</span><span>L</span><span>Y</span></div>
        <span class="indice giu"><b>★</b></span>
      </div>`;
    }
    return `<div class="carta ${ROSSO[c.seme] ? 'rossa' : 'nera'} ${extra}" data-id="${c.id}" title="${nome(c)}" ${attr}>
      <span class="indice"><b>${sigla(c)}</b>${seme(c.seme)}</span>
      ${opz.valore != null ? `<span class="c-valore" title="vale ${opz.valore}">${opz.valore}</span>` : ''}
      ${centro(c)}
      <span class="indice giu"><b>${sigla(c)}</b>${seme(c.seme)}</span>
    </div>`;
  }

  const retro = (extra = '') => `<div class="carta retro ${extra}" aria-hidden="true"></div>`;

  return { fronte, retro, nome, seme, sigla, SEMI };
})();
