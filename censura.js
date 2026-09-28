// Parole censurate in chat e nei nomi: "vigano" / "viganò" e "viagano" / "viaganò" in qualsiasi forma (maiuscole,
// accenti, spazi o punti in mezzo, lettere ripetute, 0 al posto della o). Al loro posto compaiono asterischi.
const LETTERE = { v: 'vV', i: 'iIìíÌÍ1!', a: 'aAàáÀÁ4@', g: 'gG', n: 'nN', o: 'oOòóÒÓ0' };
const SEP = '[\\s._\\-*]*';
const pezzo = (l) => `[${LETTERE[l]}]+`;
// la "a" dopo la "i" è facoltativa: vale sia per vigano sia per viagano
const PAROLA = new RegExp(`${pezzo('v')}${SEP}${pezzo('i')}(?:${SEP}${pezzo('a')})?${SEP}${pezzo('g')}${SEP}${pezzo('a')}${SEP}${pezzo('n')}${SEP}${pezzo('o')}`, 'g');

function censura(testo) {
  return String(testo).normalize('NFC').replace(PAROLA, (m) => '*'.repeat(Math.max(3, m.replace(/[\s._\-*]/g, '').length)));
}
module.exports = { censura };
