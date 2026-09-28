const briscola = require('./briscola');
const { scopa, scopone } = require('./scopa');
const rubamazzo = require('./rubamazzo');
const scala40 = require('./scala40');
const tris = require('./tris');
const forza4 = require('./forza4');
const battaglia = require('./battaglia');
const dama = require('./dama');
const scacchi = require('./scacchi');
const impiccato = require('./impiccato');
const morra = require('./morra');
const numero = require('./numero');
const blackjack = require('./blackjack');
const baccarat = require('./baccarat');
const higherlower = require('./higherlower');
const texas = require('./texas');
const poker5 = require('./poker5');
const uno = require('./uno');
const campo = require('./campo');
const impostore = require('./impostore');
const coccodrillo = require('./coccodrillo');
const blockblast = require('./blockblast');
const peppa = require('./peppa');
const fastwest = require('./fastwest');
const wordle = require('./wordle');
const angolo = require('./angolo');
const sudoku = require('./sudoku');
const snake = require('./snake');
const tetris = require('./tetris');
const airhockey = require('./airhockey');
const pallone = require('./pallone');
const interruttori = require('./interruttori');
const casellebombe = require('./casellebombe');
const tesoro = require('./tesoro');
const coperti = require('./coperti');
const dubito = require('./dubito');
const nascondino = require('./nascondino');
const mappa = require('./mappa');
const tasti = require('./tasti');
const mensola = require('./mensola');
const mind = require('./mind');
const flip7 = require('./flip7');
const cirulla = require('./cirulla');
const solitario = require('./solitario');
const chirurgo = require('./chirurgo');
const benchmark = require('./benchmark');
const risiko = require('./risiko');
const disegna = require('./disegna');
const putt = require('./putt');
const palloncini = require('./palloncini');
const gattotopi = require('./gattotopi');
const colori = require('./colori');
const bumper = require('./bumper');
const differenze = require('./differenze');
const { fuga, monete } = require('./salita');
const strada = require('./strada');
const bersaglio = require('./bersaglio');
const mangiatutto = require('./mangiatutto');
const tigerball = require('./tigerball');
const arcobaleno = require('./arcobaleno');
const pioggia = require('./pioggia');
const paintball = require('./paintball');
const piattaforme = require('./piattaforme');
const massi = require('./massi');
const stella = require('./stella');
const fune = require('./fune');
const dalgona = require('./dalgona');
const buio = require('./buio');
const alieno = require('./alieno');
const shutbox = require('./shutbox');
const sblocca = require('./sblocca');
const wanted = require('./wanted');
const duello = require('./duello');

const GIOCHI = { briscola, scopa, scopone, rubamazzo, scala40, tris, forza4, battaglia, dama, scacchi, impiccato, morra, numero, blackjack, baccarat, higherlower, texas, poker5, uno, campo, impostore, coccodrillo, blockblast, peppa, fastwest, wordle, angolo, sudoku, snake, tetris, airhockey, pallone, interruttori, casellebombe, tesoro, coperti, dubito, nascondino, mappa, tasti, mensola, mind, flip7, cirulla, solitario, chirurgo, benchmark, risiko, disegna, putt, palloncini, gattotopi, colori, bumper, differenze, fuga, monete, arcobaleno, pioggia, paintball, piattaforme, massi, stella, fune, dalgona, buio, alieno, shutbox, sblocca, wanted, duello, strada, bersaglio, mangiatutto, tigerball };

// Tiene solo le opzioni previste, con valori ammessi
function pulisciOpzioni(id, opzioni = {}) {
  const out = {};
  for (const o of GIOCHI[id].meta.opzioni) {
    const v = opzioni[o.id];
    const ammesso = o.valori.find((x) => String(x) === String(v));
    out[o.id] = ammesso !== undefined ? ammesso : o.predefinito;
  }
  return out;
}

module.exports = { GIOCHI, pulisciOpzioni };
