// FAST WEST: il tavolo nel browser
(() => {
  const { esc, ritardo, primaVolta, suono } = window.Nuovi;
  const F = window.FastWestCarte;
  const { cartaAzione, cartaBersaglio, dorso, ritratto, CARTE, tipoDi } = F;

  // posizione di ogni pistolero intorno al tavolo: io in basso, il pistolero "a destra" (il successivo) alla mia destra
  function posizione(ctx, i) {
    const n = ctx.partita.n;
    const rel = (i - ctx.mio + n) % n;
    const a = ((90 - (rel * 360) / n) * Math.PI) / 180;
    return { x: 50 + 38 * Math.cos(a), y: 50 + 39 * Math.sin(a) };
  }
  const nomeDi = (ctx, i) => (i === ctx.mio ? 'Tu' : ctx.nome(i));

  // chi posso cliccare sul tavolo in questo momento
  function cliccabili(ctx) {
    const p = ctx.partita, ui = ctx.ui, io = p.giocatori[ctx.mio];
    if (p.fase !== 'scelta') return new Set();
    if (io.vivo && ui.sel && CARTE[tipoDi(ui.sel)].arma && p.carta.dir === 'incrociata') return new Set(p.giocatori.map((g, i) => (g.vivo && i !== ctx.mio ? i : -1)).filter((i) => i >= 0));
    if (!io.vivo && !io.uscito) return new Set(p.giocatori.map((g, i) => (g.vivo ? i : -1)).filter((i) => i >= 0));
    return new Set();
  }

  // quanti danni ha preso ognuno nell'ultimo turno (per scuotere i posti)
  function danniDaLog(log) {
    const d = {};
    for (const e of log) if (e.tipo === 'colpito') d[e.a] = (d[e.a] || 0) + e.danno;
    for (const e of log) if (e.tipo === 'vedova') d[e.a] = (d[e.a] || 0) + 1;
    return d;
  }

  function sede(ctx, i, clic, danni) {
    const p = ctx.partita, g = p.giocatori[i];
    const pos = posizione(ctx, i);
    const cuori = Array.from({ length: g.viteMax }, (_, k) => `<i class="fw-cuore ${k < g.vite ? 'pieno' : ''}"></i>`).join('');
    const pall = Array.from({ length: 5 }, (_, k) => `<i class="fw-slot ${k < g.pallottole ? 'carico' : ''}"></i>`).join('');
    let giocata = '';
    if (g.giocata) {
      const k = `giocata-${p.turnoN}-${i}`;
      giocata = `<div class="fw-giocata scoperta" style="${ritardo(ctx.ui, k)}">${cartaAzione(g.giocata.carta, { piccola: true })}${g.giocata.originale ? `<span class="fw-cambio">era ${esc(CARTE[tipoDi(g.giocata.originale)].nome)}</span>` : ''}${g.giocata.bersaglio != null ? `<span class="fw-mira">🎯 ${esc(nomeDi(ctx, g.giocata.bersaglio))}</span>` : ''}</div>`;
    } else if (p.fase === 'scelta' && g.vivo) giocata = `<div class="fw-giocata">${g.pronto ? dorso({ cls: 'piccola pronta' }) : '<span class="fw-pensa">sceglie…</span>'}</div>`;
    else if (!g.vivo && !g.uscito && p.fase === 'scelta') giocata = `<div class="fw-giocata tifo">${g.pronto ? '📣 tifo pronto' : '📣 fa il tifo…'}</div>`;
    else if (!g.vivo && g.tifo) giocata = `<div class="fw-giocata tifo">📣 ${esc(nomeDi(ctx, g.tifo.pistolero))}: ${esc(CARTE[g.tifo.carta].nome)}</div>`;
    const colpito = danni[i] ? `<span class="fw-danno" style="${ritardo(ctx.ui, `danno-${p.turnoN}-${i}`)}">−${danni[i]}</span>` : '';
    const scelto = ctx.ui.bersaglio === i || ctx.ui.tifoChi === i;
    const cls = ['fw-sede', g.vivo ? '' : 'morto', i === ctx.mio ? 'mia' : '', clic.has(i) ? 'cliccabile' : '', scelto ? 'scelta' : '', danni[i] ? 'colpita' : ''].join(' ');
    return `<div class="${cls}" style="left:${pos.x}%;top:${pos.y}%;${danni[i] ? ritardo(ctx.ui, `danno-${p.turnoN}-${i}`) : ''}" data-sede="${i}" ${clic.has(i) ? `data-az="sede" data-i="${i}" role="button" tabindex="0" aria-label="${esc(nomeDi(ctx, i))}"` : ''}>
      ${ritratto(g.pistolero, { cls: g.vivo ? '' : 'caduto' })}
      <div class="fw-targa"><b>${esc(nomeDi(ctx, i))}</b>${g.pistolero && (g.rivelato || !g.vivo || p.finita || i === ctx.mio) ? `<small>${esc(p.pistoleri[g.pistolero].nome)}${i === ctx.mio && !g.rivelato && g.vivo ? ' · segreto' : ''}</small>` : ''}</div>
      <div class="fw-stato">${g.vivo ? `<span class="fw-cuori" aria-label="${g.vite} vite">${cuori}</span><span class="fw-caricatore" aria-label="${g.pallottole} pallottole">${pall}</span>` : '<span class="fw-croce">✝ caduto</span>'}</div>
      ${giocata}${colpito}<div class="bolla-posto" data-bolla="${i}"></div></div>`;
  }

  // le frecce dei colpi nel turno appena risolto
  function frecce(ctx) {
    const p = ctx.partita;
    if (!p.log.length) return '';
    let k = 0;
    const linee = p.log.map((e) => {
      if (!['colpito', 'schivato', 'rimbalzo', 'errore'].includes(e.tipo)) return '';
      const a = posizione(ctx, e.da), b = posizione(ctx, e.a);
      const cls = e.tipo === 'colpito' ? (e.arma === 'dinamite' ? 'boom' : 'colpo') : e.tipo;
      const d = k++ * 0.45;
      // la freccia si ferma un po' prima del bersaglio
      const fx = b.x - (b.x - a.x) * 0.12, fy = b.y - (b.y - a.y) * 0.12;
      return `<line class="fw-traccia ${cls}" x1="${a.x}" y1="${a.y}" x2="${fx}" y2="${fy}" pathLength="100" style="--d:${d}s"/>`;
    }).join('');
    return `<svg class="fw-frecce" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" style="${ritardo(ctx.ui, `frecce-${p.turnoN}`)}">${linee}</svg>`;
  }

  // il racconto del turno, in parole
  function racconto(ctx) {
    const p = ctx.partita;
    const N = (i) => `<b>${esc(nomeDi(ctx, i))}</b>`;
    const C = (t) => esc(CARTE[t] ? CARTE[t].nome : t);
    const righe = p.log.map((e) => {
      switch (e.tipo) {
        case 'tifo': return `📣 ${N(e.da)} ha indovinato la carta di ${N(e.a)} (${C(e.carta)}): effetto potenziato!`;
        case 'tifoSbagliato': return '';
        case 'vuoto': return `💨 ${N(e.posto)} gioca ${C(e.carta)} ma non ha abbastanza pallottole: nessun effetto.`;
        case 'bloccata': return `🚫 ${N(e.posto)} gioca ${C(e.carta)}: non vale (${esc(e.perche)}).`;
        case 'paga': return '';
        case 'ricarica': return `🔄 ${N(e.posto)} ${e.perche === 'dinamite' ? 'ricarica grazie al tifo' : 'ricarica'}: +${e.quante} ${e.quante === 1 ? 'pallottola' : 'pallottole'}${e.tornate ? `, ${e.tornate} carte tornano in mano` : ''}.`;
        case 'duello': return `⚔️ Duello: ${N(e.vince)} batte ${N(e.perde)}${e.tifo ? ' grazie al tifo' : ` (${C(e.arma)} contro ${C(e.armaPerde)})`}.`;
        case 'pari': return `🤝 ${N(e.a)} e ${N(e.b)} si sparano col ${C(e.arma)}: nessuno colpisce.`;
        case 'colpito': return `${e.arma === 'dinamite' ? '💥' : '🔫'} ${N(e.da)} colpisce ${N(e.a)}${e.rimbalzato ? ' di rimbalzo' : ''}${e.tornata ? ' (la Dinamite è tornata indietro!)' : ''}: −${e.danno} ${e.danno === 1 ? 'vita' : 'vite'}.`;
        case 'schivato': return `💨 ${N(e.a)} schiva ${e.ninja ? 'scartando la Schivata mentre ricarica' : `il ${C(e.arma)}`} di ${N(e.da)}.`;
        case 'rimbalzo': return `↪️ Il colpo rimbalza su ${N(e.da)} e va verso ${N(e.a)}.`;
        case 'errore': return `🧮 Errore di calcolo! La Dinamite di ${N(e.da)} torna indietro.`;
        case 'vedova': return `🕷️ Chi colpisce la Vedova Nera paga: −1 anche a ${N(e.a)}.`;
        case 'cura': return `🩺 ${N(e.posto)} si cura all'ultimo momento e resta con 1 vita.`;
        case 'recupera': return `🃏 ${N(e.posto)} recupera ${e.carte.map((c) => C(tipoDi(c))).join(' e ')}.`;
        case 'tornaInMano': return `🧮 L'Errore di calcolo di ${N(e.posto)} torna in mano.`;
        case 'morto': return `⚰️ ${N(e.posto)} è caduto. Era ${esc(p.pistoleri[e.pistolero].nome)}.`;
        case 'taglia': return `💰 ${N(e.posto)} incassa la taglia: +${e.quante} pallottole.`;
        case 'becchino': return `⚱️ ${N(e.posto)} prepara la cassa: +1 pallottola.`;
        case 'rivela': return `🎭 Si scopre: ${N(e.posto)} è ${esc(p.pistoleri[e.pistolero].nome)} (${esc(e.perche)}).`;
        default: return '';
      }
    }).filter(Boolean);
    if (!righe.length) righe.push('🌵 Non succede niente. Solo il vento.');
    return `<ol class="fw-racconto" style="${ritardo(ctx.ui, `racconto-${p.turnoN}`)}">${righe.map((r, k) => `<li style="--k:${k}">${r}</li>`).join('')}</ol>`;
  }

  function barraTempo(ctx) {
    const p = ctx.partita;
    return `<div class="fw-tempo" style="--durata:${p.pausaMs}ms;${ritardo(ctx.ui, `tempo-${p.fase}-${p.turnoN}`)}"><i></i></div>`;
  }

  const fastwest = {
    libero: true,
    senzaFila: true,
    manoLarga: true,
    panno(ctx) {
      const p = ctx.partita;
      const clic = cliccabili(ctx);
      const danni = p.fase === 'esito' || p.fase === 'fine' ? danniDaLog(p.log) : {};
      const sedi = p.giocatori.map((_, i) => sede(ctx, i, clic, danni)).join('');
      const mia = p.giocatori[ctx.mio];
      const titolo = p.finita ? (p.vinceIlWest ? 'Vince il west 🌵' : `${p.risultato.vincitori[0] === ctx.mio ? 'Sei' : `${esc(ctx.nome(p.risultato.vincitori[0]))} è`} l'ultimo in piedi`) : `Turno ${p.turnoN}`;
      const centro = `<div class="fw-centro">
        <p class="fw-turno">${titolo}</p>
        ${cartaBersaglio(p.carta, { cls: `grande ${p.fase === 'scelta' ? 'gira' : ''}` })}
        ${p.prossima ? `<div class="fw-prossima"><small>🔮 La Cartomante vede il prossimo turno:</small>${cartaBersaglio(p.prossima, { cls: 'mini' })}</div>` : ''}
        ${p.fase === 'rivelazione' || p.fase === 'esito' ? barraTempo(ctx) : ''}</div>`;
      const pistolero = mia.pistolero ? p.pistoleri[mia.pistolero] : null;
      const scheda = pistolero ? `<aside class="fw-scheda ${mia.vivo ? '' : 'morto'}">${ritratto(mia.pistolero)}<div><small>Il tuo pistolero${mia.rivelato ? ' (ormai lo sanno tutti)' : ' (segreto)'}</small><b>${esc(pistolero.nome)}</b><p>${esc(pistolero.testo)}</p></div></aside>` : '';
      return `<div class="fw fw-fase-${p.fase}">
        <div class="fw-tavolo n${p.n}">${frecce(ctx)}${centro}${sedi}</div>
        <div class="fw-sotto">${scheda}${p.fase === 'esito' || p.fase === 'fine' ? racconto(ctx) : ''}</div></div>`;
    },
    mano(ctx) {
      const p = ctx.partita, ui = ctx.ui, io = p.giocatori[ctx.mio];
      if (!io.vivo) return '';
      const inScelta = p.fase === 'scelta';
      const inMano = p.mano.map((id) => {
        const t = tipoDi(id);
        const giocabile = inScelta && !p.deveRecuperare;
        const scelta = ui.sel === id || (!ui.sel && p.miaScelta && p.miaScelta.carta === id);
        const costo = CARTE[t].costo || 0;
        const poche = costo > io.pallottole && !(t === 'revolver' && io.pistolero === 'sceriffo') && !(t === 'dinamite' && io.pistolero === 'minatore' && io.pallottole >= 3) && p.carta.evento !== 'pioggia';
        return cartaAzione(id, { cls: `${giocabile ? 'giocabile' : ''} ${scelta ? 'scelta' : ''} ${poche ? 'poche' : ''}`, attr: giocabile ? `data-az="carta" role="button" tabindex="0"` : '' });
      }).join('');
      const recupero = p.deveRecuperare || (ui.sel && tipoDi(ui.sel) === 'schivata');
      const scarti = io.scarti.map((id) => {
        const ok = inScelta && (p.deveRecuperare || (ui.sel && tipoDi(ui.sel) === 'schivata' && tipoDi(id) !== 'schivata'));
        const scelto = ui.recupero === id;
        return cartaAzione(id, { piccola: true, cls: `scartata ${ok ? 'recuperabile' : ''} ${scelto ? 'scelta' : ''}`, attr: ok ? `data-az="scarto" role="button" tabindex="0"` : '' });
      }).join('');
      return `<div class="fw-mano"><div class="fw-fila"><span class="fw-etichetta">In mano</span><div class="fw-carte">${inMano}</div></div>
        ${io.scarti.length ? `<div class="fw-fila scarti ${recupero ? 'evidenzia' : ''}"><span class="fw-etichetta">Scarti</span><div class="fw-carte">${scarti}</div></div>` : ''}</div>`;
    },
    azioni(ctx) {
      const p = ctx.partita, ui = ctx.ui, io = p.giocatori[ctx.mio];
      if (p.finita) return '';
      if (p.fase === 'rivelazione') {
        const g = io.giocata;
        if (io.vivo && io.pistolero === 'baro' && g && CARTE[tipoDi(g.carta)].arma && !p.cambio) {
          const altre = p.mano.filter((id) => CARTE[tipoDi(id)].arma && id !== g.carta);
          if (altre.length) return `<span class="fw-avviso">🃏 Sei il Baro: puoi cambiare arma pagando entrambe</span>${altre.map((id) => `<button type="button" class="bottone primario-bt" data-az="cambia" data-id="${id}">Cambia con ${esc(CARTE[tipoDi(id)].nome)}</button>`).join('')}`;
        }
        return '<span class="fw-avviso">Carte in tavola! Si risolve fra poco…</span>';
      }
      if (p.fase === 'esito') return '<span class="fw-avviso">Il prossimo turno arriva da solo.</span>';
      if (p.fase !== 'scelta') return '';
      if (!io.vivo) {
        if (io.uscito) return '';
        const chi = ui.tifoChi;
        const tipi = Object.keys(CARTE).map((t) => `<button type="button" class="bottone mini-bt ${ui.tifoCarta === t ? 'attivo' : ''}" data-az="tifaCarta" data-t="${t}">${esc(CARTE[t].nome)}</button>`).join('');
        if (p.mioTifo && !ui.cambioTifo) return `<span class="fw-avviso">📣 Tifo per ${esc(nomeDi(ctx, p.mioTifo.pistolero))}: ${esc(CARTE[p.mioTifo.carta].nome)}</span><button type="button" class="bottone mini-bt" data-az="annulla">Cambia</button>`;
        if (!p.mioTifo && io.pronto) return '<span class="fw-avviso">Hai passato. Aspetta il turno dopo.</span>';
        return `<div class="fw-pannello"><p>📣 Fai il tifo: ${chi != null ? `per <b>${esc(nomeDi(ctx, chi))}</b>` : 'clicca un pistolero sul tavolo'}, poi indovina la carta che giocherà.</p>
          <div class="fw-tipi">${tipi}</div>
          <div class="riga"><button type="button" class="bottone primario-bt" data-az="tifa" ${chi != null && ui.tifoCarta ? '' : 'disabled'}>Fai il tifo</button><button type="button" class="bottone" data-az="passa">Passa</button></div></div>`;
      }
      if (p.deveRecuperare) return '<span class="fw-avviso">⏪ Flashback: tocca una carta tra i tuoi scarti per riprenderla in mano.</span>';
      if (!ui.sel) {
        const pronti = p.giocatori.filter((g) => g.pronto && (g.vivo || !g.uscito)).length;
        const totale = p.giocatori.filter((g) => g.vivo || !g.uscito).length;
        if (p.miaScelta) return `<span class="fw-avviso">Hai scelto <b>${esc(CARTE[tipoDi(p.miaScelta.carta)].nome)}</b>. Aspetta gli altri (${pronti} su ${totale}). Puoi ancora cambiare.</span><button type="button" class="bottone mini-bt" data-az="annulla">Ritira la carta</button>`;
        return '<span class="fw-avviso">Scegli in segreto una carta dalla mano.</span>';
      }
      const t = tipoDi(ui.sel);
      const arma = CARTE[t].arma;
      let extra = '';
      let pronto = true;
      if (arma && p.carta.dir === 'incrociata') {
        extra += ui.bersaglio != null ? `<span>🎯 Bersaglio: <b>${esc(ctx.nome(ui.bersaglio))}</b></span>` : '<span>🎯 Tiro incrociato: clicca sul tavolo il pistolero da colpire</span>';
        if (ui.bersaglio == null) pronto = false;
      }
      if (arma && io.pistolero === 'mancino' && ['destra', 'sinistra'].includes(p.carta.dir)) extra += `<label class="fw-check"><input type="checkbox" data-az="inverti" ${ui.inverti ? 'checked' : ''}> Spara dall'altra parte (il tuo potere)</label>`;
      if (t === 'schivata') extra += `<span>${io.scarti.some((c) => tipoDi(c) !== 'schivata') ? (ui.recupero ? `🃏 Recuperi: <b>${esc(CARTE[tipoDi(ui.recupero)].nome)}</b>` : '🃏 Tocca negli scarti la carta da recuperare (o lascia scegliere al gioco)') : 'Nessuna carta da recuperare'}</span>`;
      return `<div class="fw-pannello"><p>Carta scelta: <b>${esc(CARTE[t].nome)}</b></p>${extra}
        <div class="riga"><button type="button" class="bottone primario-bt" data-az="gioca" ${pronto ? '' : 'disabled'}>Gioca in segreto</button><button type="button" class="bottone" data-az="deseleziona">Annulla</button></div></div>`;
    },
    dopo(ctx) {
      const p = ctx.partita;
      if (p.fase === 'rivelazione' && primaVolta(ctx.ui, `suono-rivela-${p.turnoN}`)) suono([[330, 0.08], [440, 0.1]], { volume: 0.05 });
      if (p.fase === 'esito' && primaVolta(ctx.ui, `suono-esito-${p.turnoN}`)) {
        const colpi = p.log.filter((e) => e.tipo === 'colpito');
        colpi.forEach((e, k) => setTimeout(() => suono(e.arma === 'dinamite' ? [[90, 0.3]] : [[900, 0.03], [200, 0.08]], { tipo: 'square', volume: 0.07 }), k * 450));
      }
    },
    statoAttesa(ctx) { return ctx.partita.fase === 'rivelazione' ? 'Carte in tavola!' : 'Cosa è successo'; },
    stato(ctx) {
      const p = ctx.partita, io = p.giocatori[ctx.mio];
      if (p.finita) return null;
      if (p.fase !== 'scelta') return null;
      if (!io.vivo) return io.pronto ? 'Tifo pronto' : 'Fai il tifo';
      if (p.deveRecuperare) return 'Flashback: recupera una carta';
      return io.pronto ? 'Aspetta gli altri pistoleri' : 'Scegli la tua carta';
    },
    punteggio(ctx) {
      const p = ctx.partita;
      const vivi = p.giocatori.filter((g) => g.vivo).length;
      return `<span>Turno <b>${p.turnoN}</b></span><span>In piedi <b>${vivi}</b></span><span>Caduti <b>${p.n - vivi}</b></span><span class="obiettivo">l'ultimo in vita vince</span>`;
    },
    clic(ctx, el) {
      const p = ctx.partita, ui = ctx.ui, az = el.dataset.az;
      const io = p.giocatori[ctx.mio];
      if (az === 'carta') {
        const id = el.dataset.id;
        ui.sel = ui.sel === id ? null : id;
        ui.bersaglio = null; ui.inverti = false; ui.recupero = null;
        return ctx.ridisegna();
      }
      if (az === 'deseleziona') { ui.sel = null; return ctx.ridisegna(); }
      if (az === 'scarto') {
        const id = el.dataset.id;
        if (p.deveRecuperare) return ctx.invia({ tipo: 'recupera', carta: id });
        ui.recupero = ui.recupero === id ? null : id;
        return ctx.ridisegna();
      }
      if (az === 'sede') {
        const i = Number(el.dataset.i);
        if (io.vivo) ui.bersaglio = i; else ui.tifoChi = i;
        return ctx.ridisegna();
      }
      if (az === 'inverti') { ui.inverti = el.checked; return; }
      if (az === 'gioca') {
        const a = { tipo: 'gioca', carta: ui.sel };
        if (ui.bersaglio != null) a.bersaglio = ui.bersaglio;
        if (ui.inverti) a.inverti = true;
        if (ui.recupero) a.recupero = ui.recupero;
        ui.sel = null; ui.bersaglio = null;
        suono([[520, 0.05]], { volume: 0.05 });
        return ctx.invia(a);
      }
      if (az === 'annulla') { ui.cambioTifo = false; return ctx.invia({ tipo: 'annulla' }); }
      if (az === 'tifaCarta') { ui.tifoCarta = el.dataset.t; return ctx.ridisegna(); }
      if (az === 'tifa') { const a = { tipo: 'tifa', pistolero: ui.tifoChi, carta: ui.tifoCarta }; ui.tifoChi = null; ui.tifoCarta = null; return ctx.invia(a); }
      if (az === 'passa') return ctx.invia({ tipo: 'tifa', passa: true });
      if (az === 'cambia') return ctx.invia({ tipo: 'cambia', carta: el.dataset.id });
    },
  };
  // a ogni nuovo turno si azzera la scelta
  let ultimoTurno = null;
  const vecchioPanno = fastwest.panno;
  fastwest.panno = (ctx) => {
    const p = ctx.partita;
    const chiave = `${p.turnoN}-${p.fase}`;
    if (ultimoTurno !== chiave && p.fase === 'scelta' && ultimoTurno && !ultimoTurno.startsWith(`${p.turnoN}-scelta`)) {
      Object.assign(ctx.ui, { sel: null, bersaglio: null, inverti: false, recupero: null, tifoChi: null, tifoCarta: null });
    }
    ultimoTurno = chiave;
    return vecchioPanno(ctx);
  };
  Object.assign(window.Tavoli, { fastwest });
})();
