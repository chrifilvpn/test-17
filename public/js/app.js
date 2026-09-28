(() => {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const socket = io();

  // ---------- memoria locale ----------
  const mem = {
    get(k, d = null) { try { const v = localStorage.getItem('if:' + k); return v == null ? d : v; } catch { return d; } },
    set(k, v) { try { localStorage.setItem('if:' + k, v); } catch {} },
    del(k) { try { localStorage.removeItem('if:' + k); } catch {} },
  };
  let mioId = mem.get('id');
  if (!mioId) { mioId = crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now(); mem.set('id', mioId); }

  let giochi = [];
  let stato = null;
  let scelto = { gioco: mem.get('gioco', 'scopa'), posti: Number(mem.get('posti', 2)), livello: mem.get('livello', 'medio'), opzioni: {} };
  let ui = {};
  let firmaPartita = null;
  let ultimoEvento = 0;
  let ultimaChat = 0;
  let chatLetta = Number(mem.get('chatLetta', 0));
  let eraMioTurno = false;
  let suono = mem.get('suono', '1') === '1';

  // ---------- utilità ----------
  const meta = (id) => giochi.find((g) => g.id === id);
  // al tavolo il pulsante della chat globale sta nella barra in alto (in basso coprirebbe le carte)
  function mostra(id) { for (const s of $$('.schermo')) s.hidden = s.id !== id; const b = $('#apri-globale'); if (b) b.hidden = id === 'schermo-gioco'; }
  let tAvviso;
  function avviso(t, ms = 2600) {
    const el = $('#avviso');
    el.textContent = t;
    el.hidden = false;
    clearTimeout(tAvviso);
    tAvviso = setTimeout(() => (el.hidden = true), ms);
  }
  let tAnnuncio;
  function annuncio(t) {
    const el = $('#annuncio');
    el.textContent = t;
    el.hidden = false;
    el.classList.remove('vai'); void el.offsetWidth; el.classList.add('vai');
    clearTimeout(tAnnuncio);
    tAnnuncio = setTimeout(() => (el.hidden = true), 1900);
  }
  let audio;
  function bip(freq = 660, dur = 0.12) {
    if (!suono) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const o = audio.createOscillator();
      const g = audio.createGain();
      o.frequency.value = freq;
      o.type = 'triangle';
      g.gain.setValueAtTime(0.12, audio.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + dur);
      o.connect(g).connect(audio.destination);
      o.start();
      o.stop(audio.currentTime + dur);
    } catch {}
  }
  function aggiornaSuono() { $('#suono').textContent = suono ? '🔔' : '🔕'; $('#suono').setAttribute('aria-pressed', String(suono)); }
  $('#suono').addEventListener('click', () => { suono = !suono; mem.set('suono', suono ? '1' : '0'); aggiornaSuono(); bip(); });
  aggiornaSuono();

  // ---------- regole ----------
  function apriRegole(id) {
    const m = meta(id);
    if (!m) return;
    $('#regole-titolo').textContent = `Regole: ${m.nome}`;
    // a ogni gioco si aggiungono i comandi della chat e i tasti della modalità studio
    const comandi = Object.entries(m.comandi || {}).map(([c, d]) => `<li><b>${esc(c)}</b>: ${esc(d)}</li>`).join('');
    $('#regole-testo').innerHTML = m.regole.map((r) => `<li>${esc(r)}</li>`).join('')
      + `<li class="regole-sezione">Comandi della chat</li>${comandi}`
      + '<li class="regole-sezione">Modalità studio</li><li><b>Esc</b> apre le dispense; <b>/</b> o <b>\\</b> (oppure scrivere <b>gioca</b>) ti riporta alla partita, che nel frattempo resta salvata.</li>';
    $('#regole').hidden = false;
    $('#chiudi-regole').focus();
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-regole-di]');
    if (b) apriRegole(b.dataset.regoleDi || (stato && stato.gioco) || scelto.gioco);
  });
  $('#chiudi-regole').addEventListener('click', () => ($('#regole').hidden = true));
  // Esc ora è il Boss Key (vedi js/boss.js): le finestre si chiudono con i loro pulsanti.

  // =================== MODALITÀ STUDIO (Boss Key) ===================
  // Il server sa chi è sulle dispense: serve per mettere in pausa i giochi di collaborazione.
  Boss.onCambio((attivo) => socket.emit('boss', attivo));
  socket.on('prof', () => Boss.attiva({ subito: true }));
  // esecuzione pubblica (qualcuno ha scritto 67 in chat): il nome finisce nel vulcano
  socket.on('esecuzione', (d) => { if (window.Esecuzione) Esecuzione.avvia({ ...d, sonoIo: d.sonoIo !== undefined ? d.sonoIo : !!(stato && d.posto === stato.mioPosto) }); });
  // giochi in tempo reale: lo stato leggero arriva a ogni tick
  socket.on('tick', (d) => { const T = stato && stato.partita && Tavoli[stato.partita.gioco]; if (T && T.tick) T.tick(ctx, d); });
  socket.on('cursore', (d) => { const T = stato && stato.partita && Tavoli[stato.partita.gioco]; if (T && T.cursore) T.cursore(ctx, d); });
  const cfgStudio = Boss.config();
  $('#studio-grigia').checked = cfgStudio.grigia;
  $('#studio-secondi').value = cfgStudio.secondi;
  $('#studio-grigia').addEventListener('change', (e) => Boss.config({ grigia: e.target.checked }));
  $('#studio-secondi').addEventListener('change', (e) => { e.target.value = Boss.config({ secondi: e.target.value }).secondi; });

  // =================== INGRESSO ===================
  const daUrl = new URLSearchParams(location.search).get('tavolo');
  if (daUrl) $('#codice').value = daUrl.toUpperCase();

  // il nome: si chiede subito all'apertura (se non c'è ancora) e si cambia dalla home con "Cambia nome"
  function impostaNome(n) {
    $('#nome').value = n;
    $('#nome-mostrato').textContent = n;
    $('#saluto').hidden = !n;
    mem.set('nome', n);
    socket.emit('presenza', { id: mioId, nome: n });
  }
  // il nome si sceglie una volta sola, alla prima visita, e poi non si cambia
  function chiediNome() {
    $('#nome-errore').hidden = true;
    $('#nome-ingresso').value = '';
    $('#benvenuto').hidden = false;
    setTimeout(() => $('#nome-ingresso').focus(), 30);
  }
  $('#form-nome').addEventListener('submit', (e) => {
    e.preventDefault();
    const n = $('#nome-ingresso').value.replace(/\s+/g, ' ').trim();
    const errore = !n ? 'Scrivi un nome per entrare' : n.length < 2 ? 'Il nome deve avere almeno 2 lettere' : /[<>&"'`\\]/.test(n) ? 'Nel nome non si possono usare < > & " \' ` \\' : '';
    if (errore) { $('#nome-errore').textContent = errore; $('#nome-errore').hidden = false; return; }
    const primaVolta = !mem.get('nome');
    impostaNome(n);
    $('#benvenuto').hidden = true;
    // arrivato con il link di un tavolo: appena scelto il nome ci si siede
    if (primaVolta && daUrl) entra();
  });
  if (mem.get('nome')) impostaNome(mem.get('nome')); else { $('#saluto').hidden = true; chiediNome(); }

  function nome() {
    const n = $('#nome').value.trim();
    if (!n) { chiediNome(); return null; }
    mem.set('nome', n);
    return n;
  }

  // filtri della home: per nome, per numero di giocatori, col computer o solo tra persone
  const filtro = { nome: '', giocatori: mem.get('fGioc', ''), tipo: mem.get('fTipo', '') };
  const semplice = (t) => String(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  function passaFiltro(g) {
    if (filtro.nome) {
      const cerca = semplice(filtro.nome);
      if (!semplice(`${g.nome} ${g.id} ${(g.alias || []).join(' ')}`).includes(cerca)) return false;
    }
    if (filtro.giocatori) {
      const n = Number(filtro.giocatori);
      if (n >= 8 ? !g.giocatori.some((x) => x >= 8) : !g.giocatori.includes(n)) return false;
    }
    if (filtro.tipo === 'bot' && g.soloPersone) return false;
    if (filtro.tipo === 'persone' && !g.soloPersone) return false;
    return true;
  }
  $('#filtro-giocatori').value = filtro.giocatori;
  for (const b of $$('#filtro-tipo button')) b.setAttribute('aria-pressed', String(b.dataset.tipo === filtro.tipo));
  $('#filtro-nome').addEventListener('input', (e) => { filtro.nome = e.target.value; disegnaGiochi(); });
  $('#filtro-giocatori').addEventListener('change', (e) => { filtro.giocatori = e.target.value; mem.set('fGioc', filtro.giocatori); disegnaGiochi(); });
  $('#filtro-tipo').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tipo]');
    if (!b) return;
    filtro.tipo = b.dataset.tipo; mem.set('fTipo', filtro.tipo);
    for (const x of $$('#filtro-tipo button')) x.setAttribute('aria-pressed', String(x === b));
    disegnaGiochi();
  });
  $('#filtro-azzera').addEventListener('click', () => {
    Object.assign(filtro, { nome: '', giocatori: '', tipo: '' }); mem.set('fGioc', ''); mem.set('fTipo', '');
    $('#filtro-nome').value = ''; $('#filtro-giocatori').value = '';
    for (const x of $$('#filtro-tipo button')) x.setAttribute('aria-pressed', String(x.dataset.tipo === ''));
    disegnaGiochi();
  });

  function disegnaGiochi() {
    const visibili = giochi.filter(passaFiltro);
    $('#filtro-vuoto').hidden = visibili.length > 0;
    $('#filtro-azzera').hidden = !(filtro.nome || filtro.giocatori || filtro.tipo);
    // se il filtro fissa i giocatori, il numero scelto lo segue
    if (filtro.giocatori && !filtro.nome) {
      const m = meta(scelto.gioco), n = Number(filtro.giocatori);
      if (m && m.giocatori.includes(n)) scelto.posti = n;
    }
    $('#elenco-giochi').innerHTML = visibili.map((g) => `
      <button type="button" class="gioco-tessera" data-gioco="${g.id}" aria-pressed="${g.id === scelto.gioco}">
        <span class="g-nome">${esc(g.nome)}</span>
        <span class="g-desc">${esc(g.descrizione)}</span>
        <span class="g-gioc">${g.giocatori.length === 1 ? `${g.giocatori[0]} giocatori` : `da ${g.giocatori[0]} a ${g.giocatori[g.giocatori.length - 1]} giocatori`}</span>
        <span class="g-tag">${g.soloPersone ? '👥 solo persone' : '🤖 anche col computer'}${g.tempoReale ? ' · ⚡ tempo reale' : ''}${g.senzaLivelli ? ' · 🤝 in squadra' : ''}</span>
      </button>`).join('');
    disegnaImpostazioni();
  }

  function selectOpzione(o, valore, attr) {
    return `<label class="imp-riga"><span>${esc(o.nome)}</span>
      <select ${attr} data-opz="${o.id}">${o.valori.map((v, i) => `<option value="${v}" ${String(v) === String(valore) ? 'selected' : ''}>${esc(o.etichette ? o.etichette[i] : v)}</option>`).join('')}</select></label>`;
  }

  function disegnaImpostazioni() {
    const m = meta(scelto.gioco);
    if (!m) { $('#impostazioni').hidden = true; return; }
    $('#impostazioni').hidden = false;
    $('#imp-titolo').textContent = m.nome;
    $('#impostazioni [data-regole-di]').dataset.regoleDi = m.id;
    if (!m.giocatori.includes(scelto.posti)) scelto.posti = m.giocatori[0];
    $('#scelta-posti').innerHTML = m.giocatori.map((n) => `<button type="button" data-posti="${n}" aria-pressed="${n === scelto.posti}">${n}${m.id !== 'scopone' && n === 4 && ['briscola', 'scopa'].includes(m.id) ? ' <small>in coppia</small>' : ''}</button>`).join('');
    $('#imp-opzioni').innerHTML = m.opzioni.map((o) => selectOpzione(o, scelto.opzioni[o.id] ?? o.predefinito, 'class="imp-select"')).join('');
    for (const b of $$('#scelta-livello button')) b.setAttribute('aria-pressed', String(b.dataset.livello === scelto.livello));
    // giochi solo tra persone: niente computer; con un solo posto si gioca da soli
    const solo = scelto.posti === 1;
    $('#strada-computer').hidden = !!m.soloPersone && !solo; // da soli si può sempre giocare
    // giochi di collaborazione col computer (meta.senzaLivelli): il computer è un compagno, niente facile/medio/difficile
    $('#titolo-computer').textContent = solo ? 'Da solo' : m.senzaLivelli ? 'Con il computer in squadra' : 'Contro il computer';
    $('#scelta-livello').hidden = solo || !!m.senzaLivelli;
    $('#nota-amici').textContent = m.soloPersone
      ? 'Questo gioco si fa solo con altre persone: apri il tavolo e manda il link agli amici.'
      : 'Apri il tavolo e manda il link. I posti vuoti puoi riempirli col computer.';
  }

  $('#elenco-giochi').addEventListener('click', (e) => {
    const t = e.target.closest('[data-gioco]');
    if (!t) return;
    scelto.gioco = t.dataset.gioco;
    scelto.opzioni = {};
    mem.set('gioco', scelto.gioco);
    for (const x of $$('.gioco-tessera')) x.setAttribute('aria-pressed', String(x === t));
    disegnaImpostazioni();
    if (window.innerWidth < 800) $('#impostazioni').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  $('#scelta-posti').addEventListener('click', (e) => {
    const b = e.target.closest('[data-posti]');
    if (!b) return;
    scelto.posti = Number(b.dataset.posti);
    mem.set('posti', scelto.posti);
    disegnaImpostazioni();
  });
  $('#imp-opzioni').addEventListener('change', (e) => { if (e.target.dataset.opz) scelto.opzioni[e.target.dataset.opz] = e.target.value; });
  $('#scelta-livello').addEventListener('click', (e) => {
    const b = e.target.closest('[data-livello]');
    if (!b) return;
    scelto.livello = b.dataset.livello;
    mem.set('livello', scelto.livello);
    disegnaImpostazioni();
  });

  function crea(controComputer) {
    const n = nome();
    if (!n) return;
    socket.emit('creaStanza', { nome: n, id: mioId, gioco: scelto.gioco, posti: scelto.posti, opzioni: scelto.opzioni, controComputer: controComputer ? scelto.livello : null });
  }
  $('#gioca-solo').addEventListener('click', () => crea(true));
  $('#crea').addEventListener('click', () => crea(false));
  function entra() {
    const n = nome();
    const codice = $('#codice').value.trim().toUpperCase();
    if (!n) return;
    if (codice.length !== 4) { $('#codice').focus(); return avviso('Il codice ha 4 lettere'); }
    socket.emit('entraStanza', { nome: n, id: mioId, codice });
  }
  $('#entra').addEventListener('click', entra);
  $('#codice').addEventListener('keydown', (e) => e.key === 'Enter' && entra());

  function tornaHome() {
    mem.del('tavolo');
    stato = null;
    firmaPartita = null;
    history.replaceState(null, '', location.pathname);
    for (const id of ['#fine', '#riepilogo', '#chat', '#conferma']) $(id).hidden = true;
    mostra('schermo-home');
  }
  function esci() { socket.emit('esci'); tornaHome(); }

  // =================== CONNESSIONE ===================
  socket.on('connect', () => {
    socket.emit('presenza', { id: mioId, nome: mem.get('nome') || '' });
    const t = mem.get('tavolo');
    const n = mem.get('nome');
    if (t && n) socket.emit('entraStanza', { nome: n, id: mioId, codice: t });
    if (Boss.attivo) socket.emit('boss', true);
    if (stato) $('#avviso').hidden = true;
  });
  socket.on('disconnect', () => avviso('Connessione persa, mi ricollego…', 60000));
  socket.on('giochi', (g) => { giochi = g; disegnaGiochi(); if (stato) disegnaTutto(); });
  socket.on('errore', (m) => {
    avviso(m);
    if (!stato && /Nessun tavolo|pieno|iniziata/.test(m)) mem.del('tavolo');
    if (stato && stato.partita) disegnaGioco(); // rimette a posto le carte se la mossa non era valida
  });
  // avviso solo per me scritto da un gioco (es. "ci sei quasi!" in Disegna e indovina): va anche nella chat
  socket.on('avvisoPrivato', (m) => {
    avviso(m);
    const li = document.createElement('li');
    li.className = 'sistema privato';
    li.textContent = `(solo per te) ${m}`;
    $('#messaggi').append(li);
    $('#messaggi').scrollTop = $('#messaggi').scrollHeight;
  });
  socket.on('allontanato', () => { tornaHome(); avviso('Sei stato tolto dal tavolo'); });

  socket.on('stato', (s) => {
    Boss.attivita(); // per l'overlay di caricamento se si preme Esc proprio adesso
    const primo = !stato;
    stato = s;
    mem.set('tavolo', s.codice);
    if (primo) { $('#avviso').hidden = true; history.replaceState(null, '', `?tavolo=${s.codice}`); }
    const firma = s.partita ? `${s.codice}:${s.gioco}:${s.partita.gioco}` : null;
    if (firma !== firmaPartita) { ui = {}; firmaPartita = firma; }
    if (s.partita && !s.partita.finita && ui._fineDal) { ui._fineDal = null; ui._fineSubito = false; } // rivincita: si riparte
    disegnaTutto();
    gestisciChat();
    disegnaVoto();
  });

  // =================== AMMIRAGLIATO (amministratore) ===================
  let adminDati = null;
  socket.on('adminAperto', () => { $('#admin').hidden = false; $('#chat').hidden = true; $('#globale').hidden = true; avviso('⚓ Benvenuto, Ammiraglio'); });
  socket.on('adminLista', (d) => {
    adminDati = d;
    setTimeout(() => { const el = $('#admin-comandi-stato'); if (el) el.textContent = d.comandiFino === -1 ? 'Comandi della chat: 🔇 spenti fino al riavvio' : d.comandiFino ? `Comandi della chat: 🔇 spenti per altri ${Math.ceil((d.comandiFino - Date.now()) / 60000)} min` : 'Comandi della chat: 🔊 attivi'; });
    $('#admin-lista').innerHTML = d.lista.map((x) => `<li class="${x.io ? 'io' : ''}"><div><b>${esc(x.nome)}</b>${x.admin ? ' ⚓' : ''}<small>${esc(x.dove)} · da ${x.minuti} min</small></div>
      ${x.io ? '<span class="piccolo">sei tu</span>' : `<button type="button" class="bottone mini-bt esilia" data-esilia="${esc(x.sid)}">⛵ Esilia</button>`}</li>`).join('');
    $('#admin-esiliati').innerHTML = d.esiliati.length ? `<p class="piccolo">In esilio:</p><ul class="admin-lista">${d.esiliati.map((e) => `<li><div><b>${esc(e.nome)}</b><small>ancora ${e.minuti} min</small></div><button type="button" class="bottone mini-bt" data-grazia="${esc(e.id)}">🕊️ Grazia</button></li>`).join('')}</ul>` : '';
  });
  $('#admin').addEventListener('click', (e) => {
    const b = e.target.closest('[data-esilia]');
    if (b) {
      const x = adminDati && adminDati.lista.find((y) => y.sid === b.dataset.esilia);
      if (x && confirm(`Esiliare ${x.nome} in fondo al mare?`)) socket.emit('adminEsilia', { sid: x.sid, minuti: Number($('#admin-durata').value), ip: $('#admin-ip').checked });
    }
    const g = e.target.closest('[data-grazia]');
    if (g) socket.emit('adminGrazia', { id: g.dataset.grazia });
  });
  $('#chiudi-admin').addEventListener('click', () => { $('#admin').hidden = true; });
  // spegnere / riaccendere i comandi della chat per tutto il sito
  $('#admin-comandi-spegni').addEventListener('click', () => {
    let m = $('#admin-comandi-durata').value;
    if (m === 'altro') { m = prompt('Per quanti minuti? (da 1 a 1440)', '30'); if (m === null) return; }
    m = Number(m);
    if (!(m === -1 || (m >= 1 && m <= 1440))) { avviso('Scrivi un numero di minuti da 1 a 1440'); return; }
    socket.emit('adminComandi', { minuti: m });
  });
  $('#admin-comandi-accendi').addEventListener('click', () => socket.emit('adminComandi', { minuti: 0 }));
  setInterval(() => { if (adminDati && !$('#admin').hidden) mostraStatoComandi(); }, 20000);
  function mostraStatoComandi() {
    const f = adminDati && adminDati.comandiFino;
    const el = $('#admin-comandi-stato');
    if (!el) return;
    el.textContent = f === -1 ? 'Comandi della chat: 🔇 spenti fino al riavvio' : f && f > Date.now() ? `Comandi della chat: 🔇 spenti per altri ${Math.ceil((f - Date.now()) / 60000)} min` : 'Comandi della chat: 🔊 attivi';
  }
  // l'esilio: animazione per tutti; chi viene esiliato poi vede la pagina dell'esilio e non può rientrare
  socket.on('esilio', (d) => { if (window.Esilio) Esilio.avvia(d); });
  socket.on('esiliato', ({ fino } = {}) => {
    const quando = fino ? new Date(fino).toLocaleString('it-IT', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'long' }) : '';
    $('#esiliato').innerHTML = `<div><p class="es-onda">🌊</p><h2>Sei stato esiliato</h2><p>L'Ammiraglio ti ha mandato in fondo al mare.</p>${quando ? `<p class="piccolo">Potrai tornare dopo le ${esc(quando)}.</p>` : ''}</div>`;
    $('#esiliato').hidden = false;
  });

  socket.on('connect_error', (e) => {
    const msg = typeof e === 'string' ? e : e && e.message;
    if (msg === 'esiliato') { $('#esiliato').innerHTML = '<div><p class="es-onda">🌊</p><h2>Sei in esilio</h2><p>L\'Ammiraglio ti ha mandato in fondo al mare. Riprova più tardi.</p></div>'; $('#esiliato').hidden = false; }
  });

  // =================== CHAT GLOBALE ===================
  const globale = { messaggi: [], nonLetti: 0 };
  function disegnaGlobale() {
    const ol = $('#messaggi-globale');
    const mioNome = ($('#nome').value || mem.get('nome', '')).trim();
    ol.innerHTML = globale.messaggi.map((m) => (m.sistema ? `<li class="sistema">${esc(m.nome)} ${esc(m.testo)}</li>` : `<li><b>${esc(m.nome === mioNome ? 'Tu' : m.nome)}</b> ${esc(m.testo)}</li>`)).join('') || '<li class="sistema">Ancora nessun messaggio: scrivi tu il primo!</li>';
    ol.scrollTop = ol.scrollHeight;
    $('#globale-non-letti').hidden = !globale.nonLetti;
    $('#globale-non-letti-tavolo').hidden = !globale.nonLetti;
  }
  socket.on('chatGlobaleStorico', (lista) => { globale.messaggi = Array.isArray(lista) ? lista.slice(-60) : []; disegnaGlobale(); });
  socket.on('chatGlobale', (m) => {
    globale.messaggi.push(m);
    if (globale.messaggi.length > 60) globale.messaggi.shift();
    if ($('#globale').hidden) globale.nonLetti++;
    disegnaGlobale();
  });
  $('#apri-globale-tavolo').addEventListener('click', () => $('#apri-globale').click());
  $('#apri-globale').addEventListener('click', () => {
    $('#globale').hidden = false; globale.nonLetti = 0; disegnaGlobale();
    $('#testo-globale').focus();
  });
  $('#chiudi-globale').addEventListener('click', () => { $('#globale').hidden = true; });
  $('#form-globale').addEventListener('submit', (e) => {
    e.preventDefault();
    const t = $('#testo-globale').value.trim();
    const nome = ($('#nome').value || mem.get('nome', '')).trim();
    if (!t) return;
    if (!nome) { avviso('Scrivi prima il tuo nome nella pagina iniziale'); return; }
    socket.emit('chatGlobale', { testo: t, nome });
    $('#testo-globale').value = '';
  });

  // =================== TERMINA LA PARTITA A VOTAZIONE ===================
  let tVoto = null;
  function disegnaVoto() {
    const v = stato && stato.partita && !stato.partita.finita ? stato.votoFine : null;
    $('#termina-voto').hidden = !(stato && stato.partita && !stato.partita.finita);
    $('#torna-tavolo').hidden = !(stato && stato.partita && !stato.partita.finita);
    const box = $('#voto-fine');
    clearInterval(tVoto);
    if (!v) { box.hidden = true; return; }
    const nome = (i) => (i === stato.mioPosto ? 'Tu' : (stato.giocatori[i] || {}).nome || '?');
    const votato = v.si.includes(stato.mioPosto) || v.no.includes(stato.mioPosto);
    const puo = v.votanti.includes(stato.mioPosto) && !votato;
    const fine = Date.now() + v.resta;
    const testo = () => `🗳️ <b>${esc(nome(v.da))}</b> ${v.da === stato.mioPosto ? 'hai proposto' : 'propone'} di ${v.tipo === 'restart' ? 'ricominciare la partita da capo' : 'terminare la partita'} · sì ${v.si.length}, no ${v.no.length} (servono ${v.servono} sì su ${v.votanti.length}) · ${Math.ceil(Math.max(0, fine - Date.now()) / 1000)} s`;
    box.innerHTML = `<span class="voto-testo">${testo()}</span>${puo ? `<button type="button" class="bottone mini-bt" data-voto="si">${v.tipo === 'restart' ? 'Sì, da capo' : 'Sì, terminiamo'}</button><button type="button" class="bottone mini-bt" data-voto="no">No, continuiamo</button>` : ''}`;
    box.hidden = false;
    tVoto = setInterval(() => { const t = box.querySelector('.voto-testo'); if (t) t.innerHTML = testo(); }, 1000);
  }
  $('#torna-tavolo').addEventListener('click', () => {
    if (confirm('Vuoi uscire da questa partita e tornare al tavolo? Gli altri continuano (al tuo posto gioca il computer) e tu li aspetti nella sala.')) socket.emit('tornaAlTavolo');
  });
  $('#termina-voto').addEventListener('click', () => {
    if (stato && stato.votoFine) return;
    if (confirm('Vuoi proporre di terminare la partita? Se la maggioranza vota sì, si torna in sala.')) socket.emit('votoFine', true);
  });
  $('#voto-fine').addEventListener('click', (e) => { const b = e.target.closest('[data-voto]'); if (b) socket.emit(stato.votoFine && stato.votoFine.tipo === 'restart' ? 'votoRestart' : 'votoFine', b.dataset.voto === 'si'); });

  function disegnaTutto() {
    if (!stato || !giochi.length) return;
    // chi è tornato al tavolo aspetta nella sala finché la partita degli altri finisce
    const io = stato.giocatori && stato.giocatori[stato.mioPosto];
    const inSala = !!(stato.partita && !stato.partita.finita && io && io.inSala);
    $('#avviso-in-sala').hidden = !inSala;
    if (!stato.partita || inSala) { disegnaAttesa(); mostra('schermo-attesa'); }
    else { disegnaGioco(); mostra('schermo-gioco'); }
  }

  // =================== SALA D'ATTESA ===================
  const giocaInCoppia = () => stato.numPosti === 4 && ['briscola', 'scopa', 'scopone'].includes(stato.gioco);

  function disegnaAttesa() {
    const m = meta(stato.gioco);
    $('#codice-grande').textContent = stato.codice;
    $('#sala-gioco-nome').innerHTML = `<b>${esc(m.nome)}</b>${m.opzioni.map((o) => {
      const v = stato.opzioni[o.id];
      const i = o.valori.findIndex((x) => String(x) === String(v));
      return `<span>${esc(o.nome)}: ${esc(o.etichette ? o.etichette[i] : v)}</span>`;
    }).join('')}`;
    $('#sala-gioco-scelta').hidden = !stato.sonoHost;
    $('#sala-gioco-nome').hidden = stato.sonoHost;
    $('.sala-gioco [data-regole-di]').dataset.regoleDi = stato.gioco;
    if (stato.sonoHost) {
      $('#sala-select').innerHTML = giochi.filter((g) => g.giocatori.includes(stato.numPosti))
        .map((g) => `<option value="${g.id}" ${g.id === stato.gioco ? 'selected' : ''}>${esc(g.nome)}</option>`).join('');
      $('#sala-opzioni').innerHTML = m.opzioni.map((o) => selectOpzione(o, stato.opzioni[o.id], '')).join('');
    }

    $('#lista-posti').innerHTML = stato.giocatori.map((g, i) => {
      const io = i === stato.mioPosto;
      const coppia = giocaInCoppia() ? `<span class="squadra">coppia ${i % 2 === 0 ? 'A' : 'B'}</span>` : '';
      if (!g) {
        return `<li class="vuoto"><span>Posto libero</span>${coppia}
          <span class="posto-az">
            ${stato.sonoHost && !m.soloPersone ? (m.senzaLivelli ? `<button class="bottone mini-bt" data-bot="medio" data-posto="${i}">Computer</button>` : `<span class="piccolo">Computer</span>${['facile', 'medio', 'difficile'].map((l) => `<button class="bottone mini-bt" data-bot="${l}" data-posto="${i}">${l}</button>`).join('')}`) : ''}
            <button class="bottone mini-bt" data-cambia="${i}">Siediti qui</button>
          </span></li>`;
      }
      const etichetta = g.bot ? `<span class="distintivo">computer${m.senzaLivelli ? '' : ` ${g.bot}`}</span>` : io ? '<span class="distintivo">tu</span>' : '';
      return `<li class="${io ? 'mio' : ''}"><span>${esc(g.nome)} ${etichetta}${!g.connesso ? ' <small>(non connesso)</small>' : ''}</span>${coppia}
        <span class="posto-az">
          ${!io ? `<button class="bottone mini-bt" data-cambia="${i}">Scambia posto</button>` : ''}
          ${stato.sonoHost && !io ? `<button class="bottone mini-bt" data-togli="${i}">Togli</button>` : ''}
        </span></li>`;
    }).join('');

    const liberi = stato.giocatori.filter((g) => !g).length;
    $('#inizia').hidden = !stato.sonoHost;
    $('#inizia').disabled = liberi > 0;
    $('#nota-attesa').textContent = liberi
      ? `${liberi === 1 ? 'Manca un giocatore' : `Mancano ${liberi} giocatori`}. ${stato.sonoHost ? (m.soloPersone ? 'Aspetta che arrivino gli amici: in questo gioco non si usa il computer.' : 'Aspetta gli amici o metti il computer nei posti liberi.') : ''}`
      : stato.sonoHost ? 'Tavolo al completo: puoi iniziare.' : 'Tavolo al completo: si aspetta che chi l\'ha aperto inizi la partita.';
  }

  $('#lista-posti').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.bot) socket.emit('aggiungiBot', { posto: Number(b.dataset.posto), livello: b.dataset.bot });
    if (b.dataset.togli) socket.emit('togliPosto', { posto: Number(b.dataset.togli) });
    if (b.dataset.cambia) socket.emit('cambiaPosto', { posto: Number(b.dataset.cambia) });
  });
  $('#sala-select').addEventListener('change', (e) => socket.emit('impostaGioco', { gioco: e.target.value, opzioni: {} }));
  $('#sala-opzioni').addEventListener('change', () => {
    const opzioni = {};
    for (const s of $$('#sala-opzioni select')) opzioni[s.dataset.opz] = s.value;
    socket.emit('impostaGioco', { gioco: stato.gioco, opzioni });
  });
  $('#inizia').addEventListener('click', () => socket.emit('inizia'));
  $('#esci-attesa').addEventListener('click', esci);
  $('#copia-link').addEventListener('click', async () => {
    const link = `${location.origin}${location.pathname}?tavolo=${stato.codice}`;
    try { await navigator.clipboard.writeText(link); avviso('Link copiato: mandalo agli amici'); } catch { prompt('Copia questo link', link); }
  });

  // =================== TAVOLO ===================
  function slot(posto) {
    const n = stato.numPosti;
    const rel = (posto - stato.mioPosto + n) % n;
    if (n === 2) return rel === 0 ? 0 : 2;
    if (n === 3) return [0, 1, 3][rel];
    return rel;
  }
  const nomeDi = (posto) => (posto === stato.mioPosto ? 'Tu' : (stato.giocatori[posto] && stato.giocatori[posto].nome) || '?');

  const ctx = {
    get stato() { return stato; },
    get partita() { return stato.partita; },
    get mio() { return stato.mioPosto; },
    get ui() { return ui; },
    nome: nomeDi,
    slot,
    invia(azione) { socket.emit('azione', azione); },
    chat(testo) { socket.emit('chat', testo); }, // per i pulsanti che mandano un comando (es. !ricarica)
    emetti(evento, dati) { socket.emit(evento, dati); },
    ridisegna() { disegnaGioco(); },
    avviso,
  };

  function statoTurno(p, T) {
    const personalizzato = T.stato && T.stato(ctx);
    if (p.finita) return 'Partita finita';
    if (p.fase === 'riepilogo') return 'Fine smazzata';
    if (p.inCorso) return p.inCorso.posto === stato.mioPosto ? 'Prendi' : `${nomeDi(p.inCorso.posto)} prende`;
    if (p.inAttesa) return (T.statoAttesa && T.statoAttesa(ctx)) || 'Si raccoglie…';
    if (personalizzato) return personalizzato;
    if (p.turno === stato.mioPosto) return 'Tocca a te';
    return `Tocca a ${nomeDi(p.turno)}`;
  }

  function targhetta(posto, p) {
    const g = stato.giocatori[posto];
    const compagno = p.aSquadre && posto !== stato.mioPosto && posto % 2 === stato.mioPosto % 2;
    const classi = ['targhetta', p.turno === posto ? 'di-turno' : '', g && !g.connesso && !g.bot ? 'assente' : ''].join(' ');
    const badge = g && g.bot ? '<span class="bot" title="Computer">PC</span>' : g && g.autoplay ? '<span class="bot" title="Gioca il computer">auto</span>' : '';
    return `<div class="${classi}">${esc(posto === stato.mioPosto ? g.nome : nomeDi(posto))}${compagno ? ' <span class="compagno" title="Compagno">♦</span>' : ''}${badge}</div>`;
  }

  function disegnaGioco() {
    const p = stato.partita;
    const T = Tavoli[p.gioco];
    if (T.reset) T.reset(ctx);
    const m = meta(stato.gioco);
    $('#barra-titolo').textContent = m ? m.nome : '';
    const st = $('#stato-turno');
    st.textContent = statoTurno(p, T);
    const mioTurno = p.turno === stato.mioPosto && !p.inAttesa && !p.finita;
    st.classList.toggle('mio', mioTurno);
    if (mioTurno && !eraMioTurno) { bip(); if (navigator.vibrate) navigator.vibrate(40); }
    eraMioTurno = mioTurno;
    document.title = mioTurno ? '● Tocca a te — Informatica Facile' : 'Informatica Facile';

    const punt = T.punteggio ? T.punteggio(ctx) : '';
    $('#punteggio').hidden = !punt;
    $('#punteggio').innerHTML = punt;

    // posti degli altri
    for (const el of $$('.posto-altro')) el.innerHTML = '';
    // Giochi senza carte (T.libero): il tabellone occupa tutto e gli avversari stanno in una fila in alto.
    $('#tavolo').classList.toggle('libero', !!T.libero);
    if (T.libero && !T.senzaFila) { // senzaFila: il gioco mostra da sé gli avversari (es. poker)
      $('.posto-altro[data-slot="2"]').innerHTML = `<div class="fila-avversari">${Array.from({ length: p.n }, (_, posto) => posto)
        .filter((posto) => posto !== stato.mioPosto)
        .map((posto) => `<div class="avversario">${targhetta(posto, p)}<div class="info-posto">${T.infoPosto ? T.infoPosto(ctx, posto) : ''}</div><div class="bolla-posto" data-bolla="${posto}"></div></div>`).join('')}</div>`;
    }
    for (let posto = 0; posto < p.n && !T.libero; posto++) {
      const s = slot(posto);
      if (s === 0) continue;
      const el = $(`.posto-altro[data-slot="${s}"]`);
      const n = p.carteInMano ? p.carteInMano[posto] : 0;
      el.innerHTML = `${targhetta(posto, p)}
        <div class="ventaglio ${n > 6 ? 'stretto' : ''}">${Carte.retro().repeat(Math.min(n, 14))}${n > 6 ? `<span class="conta">${n}</span>` : ''}</div>
        <div class="info-posto">${T.infoPosto ? T.infoPosto(ctx, posto) : ''}</div>
        <div class="bolla-posto" data-bolla="${posto}"></div>`;
    }
    $('#mio-nome').innerHTML = `${targhetta(stato.mioPosto, p)}<div class="info-posto">${T.infoPosto ? T.infoPosto(ctx, stato.mioPosto) : ''}</div><div class="bolla-posto" data-bolla="${stato.mioPosto}"></div>`;

    $('#panno').className = `panno panno-${p.gioco}`;
    $('#panno').innerHTML = T.panno(ctx);
    if (T.dopo) T.dopo(ctx); // es. rimettere il cursore nella casella dove si stava scrivendo
    $('#mano').className = `mano ${mioTurno ? 'attiva' : ''} ${T.manoLarga ? 'larga' : ''}`;
    $('#mano').innerHTML = T.mano ? T.mano(ctx) : '';
    $('#mano').hidden = !!T.libero && !T.mano;
    const inStudio = stato.giocatori.map((g, i) => (g && g.nascosto && i !== stato.mioPosto ? nomeDi(i) : null)).filter(Boolean);
    $('#pausa-studio').hidden = !stato.inPausa;
    $('#pausa-studio').textContent = stato.esecuzione ? '🌋 Esecuzione pubblica in corso: il gioco è fermo per tutti'
      : stato.inPausa ? `⏸ Partita in pausa: ${inStudio.join(', ') || 'qualcuno'} ha aperto le dispense` : '';
    evidenziaPescate(p);
    const az = T.azioni ? T.azioni(ctx) : '';
    $('#azioni').innerHTML = az;
    $('#azioni').hidden = !az;

    disegnaEvento(p);
    disegnaRiepilogo(p, T);
    disegnaFine(p);
    mostraBolleRecenti();
  }

  // Carta appena pescata (scala 40, briscola…): un bordo leggero e l'etichetta "nuova" per 2,5 secondi.
  // Se in mano entrano più di 2 carte insieme è una nuova distribuzione e non si evidenzia nulla.
  const DURATA_NUOVA = 2500;
  let tNuova = null;
  function evidenziaPescate(p) {
    if (!Array.isArray(p.mano)) return;
    const ids = p.mano.map((c) => c.id);
    if (!ui._manoPrima) { ui._manoPrima = ids; ui._pescate = []; return; }
    const prima = new Set(ui._manoPrima);
    const nuove = ids.filter((id) => !prima.has(id));
    if (nuove.length > 2) ui._pescate = [];
    else if (nuove.length) { ui._pescate = nuove; ui._pescateDal = Date.now(); }
    ui._pescate = ui._pescate.filter((id) => ids.includes(id));
    ui._manoPrima = ids;
    // l'etichetta "nuova" dura 2,5 secondi e sfuma; il ritardo negativo la fa ripartire da dove era se il tavolo si ridisegna
    const passati = Date.now() - (ui._pescateDal || 0);
    if (passati >= DURATA_NUOVA) return;
    for (const id of ui._pescate) for (const el of $$(`#tavolo .carta[data-id="${CSS.escape(id)}"]`)) {
      el.classList.add('pescata');
      el.style.setProperty('--t-pescata', `${-passati}ms`);
    }
    clearTimeout(tNuova);
    tNuova = setTimeout(() => $$('#tavolo .carta.pescata').forEach((el) => el.classList.remove('pescata')), DURATA_NUOVA - passati + 50);
  }

  function disegnaEvento(p) {
    const e = p.evento;
    if (!e || e.id === ultimoEvento) return;
    const nuovo = ultimoEvento !== 0 || Date.now() - caricamento > 1500;
    ultimoEvento = e.id;
    if (!nuovo) return;
    let t;
    if (e.posto == null) t = e.testo;
    else if (e.posto === stato.mioPosto) t = e.testoIo.charAt(0).toUpperCase() + e.testoIo.slice(1);
    else if (e.testoTe && e.bersaglio === stato.mioPosto) t = `${nomeDi(e.posto)} ${e.testoTe}`;
    else t = `${nomeDi(e.posto)} ${e.testo}`;
    if (e.bersaglio != null) t = t.replace('@', e.bersaglio === stato.mioPosto ? 'te' : nomeDi(e.bersaglio));
    if (e.forte) { annuncio(t); bip(880, 0.2); } else avviso(t, 1700);
  }
  const caricamento = Date.now();

  let fineRiepilogo = 0;
  let tRiepilogo;
  function disegnaRiepilogo(p, T) {
    const html = p.fase === 'riepilogo' && !p.finita && T.riepilogo ? T.riepilogo(ctx) : null;
    $('#riepilogo').hidden = !html;
    clearInterval(tRiepilogo);
    if (!html) { fineRiepilogo = 0; return; }
    $('#riepilogo-scheda').innerHTML = `${html}
      <button id="continua" class="bottone primario">Continua</button>
      <p class="piccolo" id="conto-rovescia"></p>`;
    $('#continua').addEventListener('click', () => socket.emit('continua'));
    $('#conto-rovescia').textContent = 'Si continua quando qualcuno preme "Continua".';
  }

  // A partita finita la schermata dei risultati arriva dopo qualche secondo: prima si vede come si è vinto
  // (linea del tris, quattro in fila, scacco matto...). Intanto una barretta permette di aprirla subito.
  const RITARDO_FINE = 2500; // i risultati si aprono da soli dopo 2,5 secondi
  let tFine = null;
  function disegnaFine(p) {
    $('#tavolo').classList.toggle('finita', !!p.finita);
    if (!p.finita) { $('#fine').hidden = true; $('#fine-barra').hidden = true; return; }
    const r = p.risultato;
    if (!ui._fineDal) {
      ui._fineDal = Date.now();
      clearTimeout(tFine);
      tFine = setTimeout(() => { if (stato && stato.partita && stato.partita.finita) disegnaGioco(); }, RITARDO_FINE + 60);
    }
    const presto = !ui._fineSubito && Date.now() - ui._fineDal < RITARDO_FINE;
    if (presto) {
      const vinto = r.vincitori.includes(stato.mioPosto);
      const breve = r.titolo ? r.titolo : r.pareggio ? 'Pareggio' : vinto ? (p.aSquadre ? 'Avete vinto!' : 'Hai vinto!') : `Vince ${r.vincitori.map((i) => nomeDi(i)).join(' e ')}`;
      $('#fine-barra').innerHTML = `<span>🏁 Partita finita · <b>${esc(breve)}</b></span><button type="button" class="bottone mini-bt" data-vedi-fine>Vedi i risultati</button><button type="button" class="bottone mini-bt" data-lobby>🏠 Torna alla lobby</button>`;
      $('#fine-barra').hidden = false;
      $('#fine').hidden = true;
      return;
    }
    $('#fine-barra').hidden = true;
    $('#fine').hidden = false;
    const T = Tavoli[p.gioco];
    const nomi = (posti) => (p.aSquadre ? posti.map((i) => nomeDi(i)).join(' e ') : nomeDi(posti[0]));
    const hoVinto = r.vincitori.includes(stato.mioPosto);
    let titolo;
    if (r.titolo) titolo = r.titolo; // es. Fast West: "Vince il west" quando cadono tutti
    else if (r.pareggio) titolo = 'Pareggio';
    else if (hoVinto) titolo = p.aSquadre ? 'Avete vinto!' : 'Hai vinto!';
    else titolo = `Vince ${nomi(r.vincitori)}`;
    const alContrario = r.etichetta === 'penalità' || r.crescente;
    const ordinate = [...r.fazioni].sort((a, b) => (alContrario ? a.punti - b.punti : b.punti - a.punti));
    const vittorie = stato.giocatori.map((g, i) => (g ? `<span>${esc(nomeDi(i))} <b>${g.vittorie}</b></span>` : '')).join('');
    $('#fine-scheda').innerHTML = `
      <h2>${esc(titolo)}</h2>
      ${T.riepilogo && p.riepilogo ? `<details class="dettaglio"><summary>Ultima smazzata</summary>${T.riepilogo(ctx)}</details>` : ''}
      <ul class="fine-punti">${ordinate.map((f) => `<li class="${r.vincitori.includes(f.posti[0]) && !r.pareggio ? 'vince' : ''}">
        <span>${esc(nomi(f.posti))}</span><span class="p">${f.punti} <small>${r.etichetta}</small></span></li>`).join('')}</ul>
      <p class="piccolo">Partite vinte a questo tavolo</p>
      <div class="vittorie">${vittorie}</div>
      ${stato.sonoHost
        ? `<button class="bottone primario" data-fine="rivincita">Rivincita</button>${sceltaAltroGioco()}<button class="bottone" data-fine="sala">🏠 Torna alla lobby</button>`
        : '<p class="piccolo">La rivincita la avvia chi ha aperto il tavolo.</p><button class="bottone primario" data-fine="sala">🏠 Torna alla lobby</button>'}
      <button class="bottone leggero" data-fine="esci">Torna all'ingresso</button>`;
  }
  // a fine partita: scegli subito un altro gioco per lo stesso tavolo (solo chi l'ha aperto)
  let dopo = { gioco: null, opzioni: {} };
  function sceltaAltroGioco() {
    const adatti = giochi.filter((g) => g.giocatori.includes(stato.numPosti));
    if (!dopo.gioco || !adatti.some((g) => g.id === dopo.gioco)) dopo = { gioco: stato.gioco, opzioni: { ...stato.opzioni } };
    const m = meta(dopo.gioco);
    return `<div class="altro-gioco"><p class="piccolo">Oppure giocate subito a un altro gioco, con lo stesso tavolo:</p>
      <select data-dopo="gioco" aria-label="Prossimo gioco">${adatti.map((g) => `<option value="${g.id}" ${g.id === dopo.gioco ? 'selected' : ''}>${esc(g.nome)}</option>`).join('')}</select>
      ${m.opzioni.map((o) => selectOpzione(o, dopo.opzioni[o.id] ?? o.predefinito, 'data-dopo="opzione"')).join('')}
      <button class="bottone" data-fine="nuovo">Gioca a ${esc(m.nome)}</button></div>`;
  }
  $('#fine').addEventListener('change', (e) => {
    const t = e.target;
    if (t.dataset.dopo === 'gioco') { dopo = { gioco: t.value, opzioni: {} }; disegnaGioco(); }
    else if (t.dataset.dopo === 'opzione') dopo.opzioni[t.dataset.opz] = t.value;
  });
  $('#fine-barra').addEventListener('click', (e) => {
    if (e.target.closest('[data-vedi-fine]')) { ui._fineSubito = true; disegnaGioco(); }
    if (e.target.closest('[data-lobby]')) socket.emit('tornaInSala');
  });
  $('#fine').addEventListener('click', (e) => {
    const b = e.target.closest('[data-fine]');
    if (!b) return;
    if (b.dataset.fine === 'rivincita') socket.emit('rivincita');
    if (b.dataset.fine === 'sala') socket.emit('tornaInSala');
    if (b.dataset.fine === 'nuovo') socket.emit('nuovoGioco', { gioco: dopo.gioco, opzioni: dopo.opzioni });
    if (b.dataset.fine === 'esci') esci();
  });

  // clic sul tavolo: li gestisce il gioco
  function gestisciClic(e) {
    const el = e.target.closest('[data-az]');
    if (!el || !stato || !stato.partita) return;
    Tavoli[stato.partita.gioco].clic(ctx, el);
  }
  $('#tavolo').addEventListener('click', gestisciClic);
  $('#tavolo').addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('[data-az]')) { e.preventDefault(); gestisciClic(e); }
  });

  // uscita
  $('#esci-gioco').addEventListener('click', () => {
    const p = stato.partita;
    if (!p || p.finita) return esci();
    const soloPc = stato.giocatori.every((g, i) => i === stato.mioPosto || (g && g.bot));
    $('#conferma-testo').textContent = soloPc
      ? 'La partita contro il computer verrà chiusa.'
      : 'Al tuo posto giocherà il computer, così gli altri possono finire la partita.';
    $('#conferma').hidden = false;
    $('#conferma-no').focus();
  });
  $('#conferma-si').addEventListener('click', () => { $('#conferma').hidden = true; esci(); });
  $('#conferma-no').addEventListener('click', () => ($('#conferma').hidden = true));

  // =================== CHAT E NUVOLETTE ===================
  const RAPIDI = ['!prof', 'Bella mano!', 'Che fortuna 😅', 'Dai, tocca a te', 'Ben giocato 👏', 'Rivincita?'];
  $('#rapidi').innerHTML = RAPIDI.map((t) => (t === '!prof'
    ? '<button class="bottone mini-bt rapido-prof" data-rapido="!prof" title="Apre le dispense a tutti i giocatori del tavolo">🚨 !prof</button>'
    : `<button class="bottone mini-bt" data-rapido="${esc(t)}">${esc(t)}</button>`)).join('');
  $('#suggerimento-ricarica').addEventListener('click', (e) => { const b = e.target.closest('[data-rapido]'); if (b) socket.emit('chat', b.dataset.rapido); });
  $('#rapidi').addEventListener('click', (e) => {
    const b = e.target.closest('[data-rapido]');
    if (b) socket.emit('chat', b.dataset.rapido);
  });

  const bolleAttive = new Map(); // posto -> { testo, fino }
  function gestisciChat() {
    $('#suggerimento-ricarica').hidden = !stato.ricaricaConsigliata;
    const lista = $('#messaggi');
    lista.innerHTML = stato.chat.map((m) => (m.sistema
      ? `<li class="sistema">${esc(m.testo)}</li>`
      : `<li><b>${esc(m.posto === stato.mioPosto ? 'Tu' : m.nome)}</b> ${esc(m.testo)}</li>`)).join('');
    lista.scrollTop = lista.scrollHeight;
    const nuovi = stato.chat.filter((m) => m.id > ultimaChat);
    const primaVolta = ultimaChat === 0;
    if (stato.chat.length) ultimaChat = stato.chat[stato.chat.length - 1].id;
    if (primaVolta) return;
    for (const m of nuovi) {
      if (m.sistema) { avviso(m.testo, 3200); continue; }
      bolleAttive.set(m.posto, { testo: m.testo, fino: Date.now() + 5000 });
      if (m.posto !== stato.mioPosto) bip(520, 0.08);
    }
    const ultimo = stato.chat.length ? stato.chat[stato.chat.length - 1].ora : 0;
    if ($('#chat').hidden && nuovi.some((m) => !m.sistema && m.posto !== stato.mioPosto) && ultimo > chatLetta) $('#non-letti').hidden = false;
    mostraBolleRecenti();
    if (!stato.partita) bolleSala(nuovi);
  }

  function mostraBolleRecenti() {
    if (!stato || !stato.partita) return;
    const ora = Date.now();
    for (const el of $$('[data-bolla]')) {
      const b = bolleAttive.get(Number(el.dataset.bolla));
      if (b && b.fino > ora) {
        if (el.dataset.testo !== b.testo) {
          el.innerHTML = `<div class="bolla">${esc(b.testo)}</div>`;
          el.dataset.testo = b.testo;
        }
        clearTimeout(el._t);
        el._t = setTimeout(() => { el.innerHTML = ''; el.dataset.testo = ''; }, b.fino - ora);
      } else { el.innerHTML = ''; el.dataset.testo = ''; }
    }
  }

  function bolleSala(nuovi) {
    for (const m of nuovi) {
      if (m.sistema) continue;
      const li = $$('#lista-posti li')[m.posto];
      if (!li) continue;
      const b = document.createElement('div');
      b.className = 'bolla bolla-sala';
      b.textContent = m.testo;
      li.append(b);
      setTimeout(() => b.remove(), 5000);
    }
  }

  $('#apri-chat').addEventListener('click', () => {
    $('#chat').hidden = false;
    $('#non-letti').hidden = true;
    chatLetta = Date.now();
    mem.set('chatLetta', chatLetta);
    $('#testo-chat').focus();
  });
  $('#chiudi-chat').addEventListener('click', () => ($('#chat').hidden = true));
  $('#form-chat-sala').addEventListener('submit', (e) => {
    e.preventDefault();
    const t = $('#testo-chat-sala').value.trim();
    if (t) socket.emit('chat', t);
    $('#testo-chat-sala').value = '';
  });
  $('#form-chat').addEventListener('submit', (e) => {
    e.preventDefault();
    const t = $('#testo-chat').value.trim();
    if (t) socket.emit('chat', t);
    $('#testo-chat').value = '';
  });
})();
