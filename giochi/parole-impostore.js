// Dizionario di "Chi è l'impostore": parole comuni, facili da descrivere con un indizio.
// Per aggiungere parole basta scriverle nella categoria giusta (minuscole, anche con gli accenti).
const PAROLE = {
  animali: {
    nome: 'Animali',
    parole: ['cane', 'gatto', 'elefante', 'giraffa', 'leone', 'tigre', 'zebra', 'canguro', 'pinguino', 'delfino', 'balena', 'squalo',
      'polpo', 'medusa', 'tartaruga', 'coccodrillo', 'serpente', 'rana', 'lumaca', 'farfalla', 'ape', 'formica', 'ragno', 'zanzara',
      'aquila', 'gufo', 'pappagallo', 'gallina', 'mucca', 'pecora', 'maiale', 'cavallo', 'asino', 'coniglio', 'criceto', 'scoiattolo',
      'volpe', 'lupo', 'orso', 'panda', 'koala', 'scimmia', 'gorilla', 'ippopotamo', 'rinoceronte', 'cammello', 'fenicottero', 'pipistrello',
      'riccio', 'talpa', 'castoro', 'foca', 'granchio', 'cavalluccio marino', 'struzzo', 'pavone', 'cigno', 'lucertola', 'camaleonte', 'lama'],
  },
  cibo: {
    nome: 'Cibo e bevande',
    parole: ['pizza', 'lasagna', 'carbonara', 'risotto', 'gnocchi', 'tortellini', 'panino', 'hamburger', 'patatine', 'sushi', 'kebab', 'piadina',
      'gelato', 'tiramisù', 'cannolo', 'panettone', 'pandoro', 'cornetto', 'biscotto', 'cioccolato', 'nutella', 'crostata', 'torta', 'caramella',
      'mela', 'banana', 'fragola', 'anguria', 'ananas', 'arancia', 'limone', 'ciliegia', 'uva', 'pesca', 'kiwi', 'cocco',
      'pomodoro', 'carota', 'patata', 'cipolla', 'aglio', 'melanzana', 'zucchina', 'peperone', 'fungo', 'mozzarella', 'parmigiano', 'prosciutto',
      'uovo', 'pane', 'popcorn', 'caffè', 'tè', 'latte', 'spremuta', 'cioccolata calda', 'limonata', 'miele', 'olio', 'sale'],
  },
  casa: {
    nome: 'Oggetti di casa',
    parole: ['divano', 'letto', 'cuscino', 'coperta', 'armadio', 'specchio', 'lampada', 'tappeto', 'tenda', 'finestra', 'porta', 'chiave',
      'frigorifero', 'forno', 'microonde', 'lavatrice', 'aspirapolvere', 'ferro da stiro', 'frullatore', 'tostapane', 'pentola', 'padella', 'forchetta', 'cucchiaio',
      'coltello', 'bicchiere', 'piatto', 'tazza', 'caffettiera', 'spazzolino', 'dentifricio', 'asciugamano', 'sapone', 'shampoo', 'phon', 'pettine',
      'ombrello', 'sveglia', 'orologio', 'telecomando', 'televisione', 'termosifone', 'ventilatore', 'candela', 'scopa', 'secchio', 'scala', 'martello',
      'cacciavite', 'forbici', 'scotch', 'colla', 'batteria', 'lampadina', 'presa elettrica', 'zerbino', 'vaso', 'cornice', 'cestino', 'mollette'],
  },
  luoghi: {
    nome: 'Luoghi',
    parole: ['scuola', 'ospedale', 'farmacia', 'supermercato', 'panetteria', 'ristorante', 'pizzeria', 'bar', 'cinema', 'teatro', 'museo', 'biblioteca',
      'stazione', 'aeroporto', 'porto', 'autostrada', 'parcheggio', 'benzinaio', 'banca', 'posta', 'chiesa', 'castello', 'piazza', 'fontana',
      'spiaggia', 'montagna', 'bosco', 'deserto', 'vulcano', 'isola', 'lago', 'fiume', 'cascata', 'grotta', 'giungla', 'polo nord',
      'palestra', 'piscina', 'stadio', 'parco giochi', 'luna park', 'zoo', 'acquario', 'fattoria', 'campeggio', 'albergo', 'discoteca', 'ascensore',
      'cantina', 'soffitta', 'giardino', 'balcone', 'garage', 'bagno', 'cucina', 'prigione', 'faro', 'ponte', 'galleria', 'metropolitana'],
  },
  mestieri: {
    nome: 'Mestieri',
    parole: ['medico', 'infermiere', 'dentista', 'veterinario', 'farmacista', 'insegnante', 'bidello', 'preside', 'poliziotto', 'vigile del fuoco', 'carabiniere', 'avvocato',
      'giudice', 'cuoco', 'cameriere', 'barista', 'pizzaiolo', 'pasticciere', 'panettiere', 'macellaio', 'contadino', 'pescatore', 'giardiniere', 'idraulico',
      'elettricista', 'muratore', 'meccanico', 'falegname', 'sarto', 'parrucchiere', 'estetista', 'fotografo', 'giornalista', 'scrittore', 'attore', 'cantante',
      'ballerino', 'pittore', 'architetto', 'ingegnere', 'programmatore', 'astronauta', 'pilota', 'hostess', 'autista', 'tassista', 'postino', 'commesso',
      'cassiere', 'bibliotecario', 'scienziato', 'archeologo', 'mago', 'clown', 'bagnino', 'allenatore', 'arbitro', 'youtuber', 'sindaco', 'detective'],
  },
  sport: {
    nome: 'Sport e giochi',
    parole: ['calcio', 'basket', 'pallavolo', 'tennis', 'ping pong', 'nuoto', 'ciclismo', 'sci', 'snowboard', 'pattinaggio', 'boxe', 'judo',
      'karate', 'scherma', 'golf', 'rugby', 'baseball', 'atletica', 'maratona', 'salto in alto', 'ginnastica', 'yoga', 'surf', 'vela',
      'canoa', 'equitazione', 'arrampicata', 'skateboard', 'bowling', 'biliardo', 'freccette', 'scacchi', 'dama', 'carte', 'dadi', 'nascondino',
      'campana', 'palla prigioniera', 'tiro alla fune', 'altalena', 'scivolo', 'aquilone', 'monopattino', 'bicicletta', 'palloncino', 'puzzle', 'lego', 'videogioco',
      'formula uno', 'motocross', 'pesca', 'caccia al tesoro', 'karaoke', 'olimpiadi', 'medaglia', 'coppa', 'rigore', 'fuorigioco', 'canestro', 'traguardo'],
  },
  trasporti: {
    nome: 'Mezzi di trasporto',
    parole: ['automobile', 'autobus', 'tram', 'treno', 'metropolitana', 'aereo', 'elicottero', 'razzo', 'mongolfiera', 'nave', 'traghetto', 'barca a vela',
      'sottomarino', 'gondola', 'canotto', 'moto', 'motorino', 'bicicletta', 'monopattino', 'skateboard', 'pattini', 'camion', 'furgone', 'trattore',
      'ambulanza', 'camion dei pompieri', 'taxi', 'limousine', 'cabinovia', 'seggiovia', 'funivia', 'slitta', 'carrozza', 'risciò', 'camper', 'roulotte',
      'jet privato', 'deltaplano', 'paracadute', 'moto d\'acqua', 'pedalò', 'ruspa', 'gru', 'carrello della spesa', 'passeggino', 'navicella spaziale', 'dirigibile', 'scooter'],
  },
  natura: {
    nome: 'Natura e tempo',
    parole: ['sole', 'luna', 'stella', 'pianeta', 'cometa', 'arcobaleno', 'nuvola', 'pioggia', 'neve', 'grandine', 'nebbia', 'vento',
      'tempesta', 'fulmine', 'tuono', 'terremoto', 'tsunami', 'uragano', 'eclissi', 'alba', 'tramonto', 'estate', 'inverno', 'autunno',
      'primavera', 'fiore', 'rosa', 'girasole', 'margherita', 'cactus', 'albero', 'palma', 'foglia', 'erba', 'sasso', 'sabbia',
      'onda', 'conchiglia', 'ghiaccio', 'fuoco', 'fumo', 'lava', 'cielo', 'mare', 'ghiacciaio', 'pozzanghera', 'rugiada', 'pupazzo di neve'],
  },
  scuola: {
    nome: 'Scuola e informatica',
    parole: ['zaino', 'astuccio', 'matita', 'penna', 'gomma', 'righello', 'compasso', 'quaderno', 'diario', 'libro', 'lavagna', 'gesso',
      'banco', 'cattedra', 'interrogazione', 'compito in classe', 'ricreazione', 'pagella', 'gita scolastica', 'campanella', 'calcolatrice', 'dizionario', 'mappa', 'mappamondo',
      'computer', 'tastiera', 'mouse', 'monitor', 'stampante', 'chiavetta usb', 'router', 'wifi', 'password', 'virus', 'email', 'server',
      'smartphone', 'tablet', 'cuffie', 'webcam', 'microfono', 'caricabatterie', 'app', 'sito internet', 'motore di ricerca', 'social network', 'emoji', 'intelligenza artificiale',
      'algoritmo', 'robot', 'pixel', 'cloud', 'backup', 'aggiornamento', 'codice', 'bug', 'rete', 'cavo', 'bluetooth', 'videochiamata'],
  },
  feste: {
    nome: 'Feste e vacanze',
    parole: ['natale', 'capodanno', 'carnevale', 'pasqua', 'halloween', 'compleanno', 'matrimonio', 'ferragosto', 'albero di natale', 'presepe', 'befana', 'babbo natale',
      'uovo di pasqua', 'colomba', 'coriandoli', 'maschera', 'fuochi d\'artificio', 'spumante', 'regalo', 'candeline', 'festa a sorpresa', 'palloncini', 'zucca', 'fantasma',
      'strega', 'vampiro', 'costume', 'valigia', 'passaporto', 'crema solare', 'ombrellone', 'sdraio', 'castello di sabbia', 'cartolina', 'souvenir', 'crociera',
      'tenda da campeggio', 'sacco a pelo', 'falò', 'marshmallow', 'grigliata', 'picnic', 'gita in montagna', 'settimana bianca', 'luna di miele', 'viaggio in aereo', 'mappa del tesoro', 'pirata'],
  },
};

module.exports = { PAROLE };
