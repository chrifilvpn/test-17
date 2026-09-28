// ELIMINAZIONE IN STILE SQUID GAME (comune a 1,2,3 Stella, Tiro alla fune, Dalgona): una piccola animazione che non
// ferma il gioco. Il giocatore sussulta e cade, sotto di lui si allarga una macchia rossa stilizzata (niente di
// realistico: una forma morbida con qualche goccia) e il suo nome diventa grigio chiaro.
(() => {
  const GRIGIO = '#d4d4d4';
  // macchia: f da 0 a 1 (quanto si è allargata), seme per avere sempre la stessa forma per lo stesso giocatore
  function macchia(g, x, y, r, f, seme = 1) {
    if (f <= 0) return;
    const k = Math.min(1, f);
    g.save();
    g.globalAlpha = 0.85;
    g.fillStyle = '#a3122a';
    g.beginPath();
    for (let i = 0; i <= 14; i++) {
      const a = (i / 14) * Math.PI * 2, rr = r * k * (0.78 + 0.28 * Math.abs(Math.sin(seme * 3.7 + i * 1.9)));
      const px = x + Math.cos(a) * rr * 1.25, py = y + Math.sin(a) * rr * 0.7;
      if (i === 0) g.moveTo(px, py); else g.quadraticCurveTo(x + Math.cos(a - 0.2) * rr * 1.4, y + Math.sin(a - 0.2) * rr * 0.8, px, py);
    }
    g.fill();
    // gocce intorno
    g.fillStyle = '#b3172f';
    for (let i = 0; i < 5; i++) { const a = seme * 2.3 + i * 1.3, d = r * (1.3 + (i % 3) * 0.25) * k; g.beginPath(); g.ellipse(x + Math.cos(a) * d * 1.2, y + Math.sin(a) * d * 0.65, 3 + (i % 2) * 2, 2 + (i % 2), a, 0, Math.PI * 2); g.fill(); }
    // un riflesso per renderla "disegnata"
    g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.ellipse(x - r * 0.35 * k, y - r * 0.18 * k, r * 0.3 * k, r * 0.1 * k, -0.3, 0, Math.PI * 2); g.fill();
    g.restore();
  }
  // il giocatore eliminato: t = secondi da quando è stato eliminato
  function eliminato(g, x, y, r, colore, nome, t, seme) {
    const sussulto = t < 0.25 ? Math.sin(t * 90) * 3 : 0;
    macchia(g, x, y + r * 0.5, r * 1.6, Math.min(1, Math.max(0, (t - 0.15) / 0.8)), seme);
    g.save();
    g.translate(x + sussulto, y);
    const giu = Math.min(1, t / 0.4);
    g.scale(1, 1 - giu * 0.45);
    g.globalAlpha = 1 - giu * 0.35;
    g.fillStyle = colore; g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = 2; g.stroke();
    // occhi a X
    g.strokeStyle = '#222'; g.lineWidth = 2;
    for (const s of [-1, 1]) { g.beginPath(); g.moveTo(s * r * 0.3 - 3, -r * 0.25 - 3); g.lineTo(s * r * 0.3 + 3, -r * 0.25 + 3); g.moveTo(s * r * 0.3 + 3, -r * 0.25 - 3); g.lineTo(s * r * 0.3 - 3, -r * 0.25 + 3); g.stroke(); }
    g.restore();
    if (nome) { g.save(); g.font = '600 13px system-ui, sans-serif'; g.textAlign = 'center'; g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 3; g.strokeText(nome, x, y - r - 6); g.fillStyle = GRIGIO; g.fillText(nome, x, y - r - 6); g.restore(); }
    // il segno dell'eliminazione, solo nei primi istanti
    if (t < 0.6) { g.save(); g.globalAlpha = 1 - t / 0.6; g.strokeStyle = '#ff3b4e'; g.lineWidth = 3; g.beginPath(); g.arc(x, y, r + 6 + t * 40, 0, Math.PI * 2); g.stroke(); g.restore(); }
  }
  window.Squid = { macchia, eliminato, GRIGIO };
})();
