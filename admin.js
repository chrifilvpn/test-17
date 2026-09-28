// AMMINISTRAZIONE: chi scrive in chat (del tavolo o globale) il comando segreto diventa amministratore per quella
// connessione e vede la lista di chi è online, con la possibilità di esiliarlo dal sito.
// Il comando non è scritto da nessuna parte: qui c'è solo la sua "impronta" SHA-256, così anche chi legge il codice
// su GitHub non lo può ricavare. Su Render si può cambiare con la variabile d'ambiente ADMIN_COMANDO.
const crypto = require('crypto');
const IMPRONTA = '2ab74e91b07181d128022f8c549f2ca08220fc3e3ba4e403195d7dd40087f7c1';
const impronta = (t) => crypto.createHash('sha256').update(String(t)).digest('hex');
function eComandoAdmin(testo) {
  const t = String(testo || '').trim();
  if (!t.startsWith('!') || t.length < 8 || t.length > 80) return false;
  const giusta = process.env.ADMIN_COMANDO ? impronta(process.env.ADMIN_COMANDO.trim()) : IMPRONTA;
  const a = Buffer.from(impronta(t), 'hex'), b = Buffer.from(giusta, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
module.exports = { eComandoAdmin, impronta };
