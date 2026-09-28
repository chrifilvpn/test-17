// Controllo prima dell'avvio: se manca qualche file del progetto (per esempio perché il caricamento su GitHub
// dal browser si è fermato a 100 file), lo dice chiaramente invece di far fallire il server con MODULE_NOT_FOUND.
// Avvio: "npm start" esegue prima questo file. Dopo aver aggiunto o tolto file: node verifica.js --aggiorna
const fs = require('fs');
const path = require('path');
const ELENCO = path.join(__dirname, 'elenco-file.txt');

function tuttiIFile(dir = __dirname, base = '') {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git'].includes(e.name) || e.name.startsWith('.')) continue;
    const rel = base ? `${base}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...tuttiIFile(path.join(dir, e.name), rel));
    else out.push(rel);
  }
  return out.sort();
}

if (process.argv.includes('--aggiorna')) {
  fs.writeFileSync(ELENCO, `${tuttiIFile().join('\n')}\n`);
  console.log(`elenco-file.txt aggiornato: ${tuttiIFile().length} file`);
  process.exit(0);
}

if (!fs.existsSync(ELENCO)) {
  console.warn('verifica: manca elenco-file.txt, salto il controllo dei file');
  process.exit(0);
}
const attesi = fs.readFileSync(ELENCO, 'utf8').split('\n').map((x) => x.trim()).filter(Boolean);
const mancanti = attesi.filter((f) => !fs.existsSync(path.join(__dirname, f)));
if (mancanti.length) {
  console.error('\n==================================================================');
  console.error(`MANCANO ${mancanti.length} FILE DEL PROGETTO (su ${attesi.length}):`);
  for (const f of mancanti) console.error(`  - ${f}`);
  console.error('Probabilmente il caricamento su GitHub dal browser si è fermato:');
  console.error('GitHub accetta al massimo 100 file per volta trascinandoli nella pagina.');
  console.error('Carica i file mancanti (o le cartelle una alla volta) e rifai il deploy.');
  console.error('==================================================================\n');
  process.exit(1);
}
console.log(`verifica: tutti i ${attesi.length} file ci sono`);
