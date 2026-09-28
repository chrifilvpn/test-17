// Contenuto della pagina finta: un sito di dispense scolastiche credibile.
// Tutto è disegnato in HTML/SVG (niente immagini esterne): finestre di codice, terminali, schemi di rete.
window.BossPagina = (() => {
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));


  // ---------- date sempre attuali: le lezioni e le scadenze si calcolano a partire da oggi ----------
  const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
  const tra = (giorni) => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + giorni); return d; };
  const breve = (giorni) => { const d = tra(giorni); return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`; };
  const lunga = (giorni) => { const d = tra(giorni); return `${d.getDate()} ${MESI[d.getMonth()]} ${d.getFullYear()}`; };
  const corta = (giorni) => { const d = tra(giorni); return `${d.getDate()} ${MESI[d.getMonth()].slice(0, 3)}`; };
  const annoScolastico = (() => { const d = new Date(); const a = d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1; return `${a}/${String(a + 1).slice(2)}`; })();

  // ---------- evidenziatore di sintassi (minimo, per le "schermate" di codice) ----------
  const REGOLE = {
    java: /(?<c>\/\/[^\n]*|\/\*[\s\S]*?\*\/)|(?<s>"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])')|(?<a>@\w+)|(?<k>\b(?:public|private|protected|class|static|void|int|long|boolean|new|return|if|else|while|for|this|synchronized|throws|throw|try|catch|finally|extends|implements|import|package|final|true|false|null|interface)\b)|(?<n>\b\d[\d_]*L?\b)|(?<t>\b[A-Z]\w*\b)/g,
    html: /(?<c><!--[\s\S]*?-->)|(?<k><!DOCTYPE[^>]*>|<\/?[a-zA-Z][\w-]*|\/?>)|(?<a>\b[\w-]+(?==))|(?<s>"[^"]*")/g,
    css: /(?<c>\/\*[\s\S]*?\*\/)|(?<t>^[^{}\n:]+(?=\s*\{)|^[^{}\n]+:(?:hover|focus|first-child)(?=\s*\{))|(?<k>[\w-]+(?=\s*:))|(?<n>#[0-9a-fA-F]{3,6}\b|\b\d+(?:\.\d+)?(?:px|rem|em|%|vh|vw|fr|s)?\b)/gm,
  };
  function evidenzia(codice, lingua) {
    const re = REGOLE[lingua];
    if (!re) return esc(codice);
    let out = '';
    let da = 0;
    re.lastIndex = 0;
    for (const m of codice.matchAll(re)) {
      out += esc(codice.slice(da, m.index));
      const tipo = Object.keys(m.groups).find((k) => m.groups[k] !== undefined);
      out += `<span class="hl-${tipo}">${esc(m[0])}</span>`;
      da = m.index + m[0].length;
    }
    return out + esc(codice.slice(da));
  }

  // ---------- componenti "screenshot" ----------
  function ide(file, lingua, codice, didascalia) {
    const righe = codice.replace(/^\n/, '').replace(/\s+$/, '').split('\n');
    const num = righe.map((_, i) => i + 1).join('\n');
    return `<figure class="st-fig">
      <div class="st-ide">
        <div class="st-ide-barra"><span class="st-pallini"><i></i><i></i><i></i></span>
          <span class="st-ide-tab attiva">${esc(file)}</span><span class="st-ide-tab">Main.java</span><span class="st-ide-titolo">Visual Studio Code</span></div>
        <div class="st-ide-corpo"><pre class="st-num">${num}</pre><pre class="st-codice">${evidenzia(righe.join('\n'), lingua)}</pre></div>
        <div class="st-ide-stato"><span>⎇ main</span><span>${lingua === 'java' ? 'Java' : lingua.toUpperCase()}</span><span>UTF-8</span><span>Ln ${righe.length}, Col 1</span></div>
      </div>
      ${didascalia ? `<figcaption>${didascalia}</figcaption>` : ''}</figure>`;
  }
  function terminale(titolo, testo, didascalia) {
    const righe = testo.replace(/^\n/, '').replace(/\s+$/, '').split('\n').map((r) => {
      const p = r.match(/^((?:C:\\[^>]*>)|(?:studente@lab4:[^$]*\$))(.*)$/);
      return p ? `<span class="st-prompt">${esc(p[1])}</span><span class="st-cmd">${esc(p[2])}</span>` : esc(r);
    });
    return `<figure class="st-fig">
      <div class="st-term"><div class="st-term-barra"><span>${esc(titolo)}</span><span class="st-term-bt">— ▢ ✕</span></div>
      <pre>${righe.join('\n')}<span class="st-cursore">█</span></pre></div>
      ${didascalia ? `<figcaption>${didascalia}</figcaption>` : ''}</figure>`;
  }
  const figura = (svg, didascalia) => `<figure class="st-fig st-schema">${svg}<figcaption>${didascalia}</figcaption></figure>`;
  const nota = (tipo, titolo, testo) => `<div class="st-nota st-nota-${tipo}"><b>${titolo}</b><p>${testo}</p></div>`;

  // ---------- schemi SVG ----------
  const RETE_SVG = `<svg viewBox="0 0 720 400" role="img" aria-label="Schema della rete della scuola">
    <defs><marker id="st-fr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5 0 10z" fill="#5b6b7f"/></marker></defs>
    <g font-family="Segoe UI, Roboto, Arial, sans-serif" font-size="12" fill="#1f2d3d">
      <path d="M318 40c0-16 20-26 36-18 8-14 34-14 42 2 18-4 32 10 26 26 12 6 10 26-6 28H322c-16-2-20-26-4-38z" fill="#eaf1fb" stroke="#8fb4e3"/>
      <text x="370" y="60" text-anchor="middle" font-weight="600">Internet</text>
      <line x1="370" y1="86" x2="370" y2="128" stroke="#5b6b7f" stroke-width="2"/>
      <text x="380" y="112" font-size="11" fill="#5b6b7f">WAN 80.20.114.6/30</text>
      <rect x="320" y="130" width="100" height="44" rx="8" fill="#1a5fb4"/>
      <circle cx="340" cy="152" r="9" fill="none" stroke="#fff" stroke-width="2"/><path d="M335 152h10M340 147v10" stroke="#fff" stroke-width="2"/>
      <text x="382" y="157" text-anchor="middle" fill="#fff" font-weight="600">R1</text>
      <g stroke="#5b6b7f" stroke-width="2"><line x1="340" y1="174" x2="110" y2="240"/><line x1="360" y1="174" x2="285" y2="240"/><line x1="380" y1="174" x2="460" y2="240"/><line x1="400" y1="174" x2="630" y2="240"/></g>
      <g font-size="10.5" fill="#5b6b7f"><text x="176" y="200">G0/0 .1</text><text x="238" y="228">G0/1 .65</text><text x="458" y="228">G0/2 .129</text><text x="540" y="200">G0/3 .193</text></g>
      ${[['LAB1', 110, '192.168.10.0/26'], ['LAB2', 285, '192.168.10.64/26'], ['SEGRETERIA', 460, '192.168.10.128/26'], ['WI-FI', 630, '192.168.10.192/26']].map(([n, x, net], i) => `
        <rect x="${x - 48}" y="240" width="96" height="30" rx="5" fill="${i === 3 ? '#fff4e0' : '#e8f5ee'}" stroke="${i === 3 ? '#e0a33a' : '#3f9b6b'}"/>
        <text x="${x}" y="259" text-anchor="middle" font-weight="600">${i === 3 ? 'AP ' : 'SW '}${n}</text>
        <g stroke="#9aa7b5">${[-40, 0, 40].map((d) => `<line x1="${x}" y1="270" x2="${x + d}" y2="310"/>`).join('')}</g>
        ${[-40, 0, 40].map((d) => `<rect x="${x + d - 15}" y="310" width="30" height="20" rx="2" fill="#f4f6f9" stroke="#7c8a99"/><rect x="${x + d - 6}" y="331" width="12" height="4" fill="#7c8a99"/>`).join('')}
        <text x="${x}" y="360" text-anchor="middle" font-family="Consolas, monospace" font-size="11.5">${net}</text>
        <text x="${x}" y="377" text-anchor="middle" font-size="10.5" fill="#5b6b7f">62 host utilizzabili</text>`).join('')}
    </g></svg>`;

  const THREAD_SVG = `<svg viewBox="0 0 720 300" role="img" aria-label="Ciclo di vita di un thread">
    <defs><marker id="st-fr2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5 0 10z" fill="#44546a"/></marker></defs>
    <g font-family="Segoe UI, Roboto, Arial, sans-serif" font-size="12.5" fill="#1f2d3d">
      ${[['NEW', 70, 150, '#eef2f7'], ['RUNNABLE', 270, 150, '#e3f0ff'], ['TERMINATED', 640, 150, '#eef2f7'], ['BLOCKED', 470, 50, '#fdeaea'], ['WAITING', 470, 150, '#fff4e0'], ['TIMED_WAITING', 470, 250, '#fff4e0']].map(([t, x, y, c]) => `
        <rect x="${x - 62}" y="${y - 20}" width="124" height="40" rx="20" fill="${c}" stroke="#7c8a99"/>
        <text x="${x}" y="${y + 4}" text-anchor="middle" font-weight="600" font-family="Consolas, monospace" font-size="12">${t}</text>`).join('')}
      <g stroke="#44546a" stroke-width="1.6" fill="none" marker-end="url(#st-fr2)">
        <line x1="132" y1="150" x2="206" y2="150"/>
        <path d="M300 130 C340 70 380 55 406 52"/><path d="M406 62 C370 80 340 110 312 132"/>
        <line x1="332" y1="146" x2="406" y2="146"/><line x1="406" y1="156" x2="332" y2="156"/>
        <path d="M300 170 C340 230 380 245 406 248"/><path d="M406 238 C370 220 340 190 312 168"/>
        <path d="M290 172 C360 300 560 300 620 172"/>
      </g>
      <g font-size="11" fill="#44546a">
        <text x="169" y="140" text-anchor="middle">start()</text>
        <text x="330" y="76">attesa lock</text><text x="366" y="104" text-anchor="middle">lock ottenuto</text>
        <text x="369" y="140" text-anchor="middle">wait() / join()</text><text x="369" y="172" text-anchor="middle">notify()</text>
        <text x="322" y="232">sleep(ms)</text>
        <text x="460" y="296" text-anchor="middle">run() termina</text>
      </g></g></svg>`;

  const BOX_SVG = `<svg viewBox="0 0 560 300" role="img" aria-label="Box model CSS">
    <g font-family="Segoe UI, Roboto, Arial, sans-serif" font-size="12" fill="#1f2d3d">
      <rect x="20" y="20" width="520" height="260" fill="#fbe7c6" stroke="#c9a15a" stroke-dasharray="5 4"/>
      <text x="32" y="40" font-weight="600">margin</text><text x="280" y="40" text-anchor="middle">20px</text>
      <rect x="70" y="55" width="420" height="190" fill="#f6d27d" stroke="#1f2d3d" stroke-width="2"/>
      <text x="82" y="75" font-weight="600">border</text><text x="280" y="75" text-anchor="middle">2px</text>
      <rect x="110" y="88" width="340" height="124" fill="#c4dfb8"/>
      <text x="122" y="106" font-weight="600">padding</text><text x="280" y="106" text-anchor="middle">16px</text>
      <rect x="160" y="120" width="240" height="60" fill="#9cc6e8"/>
      <text x="280" y="148" text-anchor="middle" font-weight="600">content</text>
      <text x="280" y="166" text-anchor="middle" font-family="Consolas, monospace" font-size="11.5">240 × 60</text>
    </g></svg>`;

  // ---------- codice degli esempi ----------
  const J_RUNNABLE = String.raw`
public class Contatore implements Runnable {
    private final String nome;

    public Contatore(String nome) {
        this.nome = nome;
    }

    @Override
    public void run() {
        for (int i = 1; i <= 5; i++) {
            System.out.println(nome + ": " + i);
            try {
                Thread.sleep(100); // simula un lavoro
            } catch (InterruptedException e) {
                return;
            }
        }
    }

    public static void main(String[] args) throws InterruptedException {
        Thread t1 = new Thread(new Contatore("T1"));
        Thread t2 = new Thread(new Contatore("T2"));
        t1.start();
        t2.start();
        t1.join(); // il main aspetta la fine di t1 e t2
        t2.join();
        System.out.println("Fine del main");
    }
}`;
  const J_CONTO = String.raw`
public class Conto {
    private int saldo = 0;

    // SENZA synchronized: due thread possono leggere lo stesso valore
    public void deposita(int importo) {
        saldo = saldo + importo;
    }

    public int getSaldo() {
        return saldo;
    }

    public static void main(String[] args) throws InterruptedException {
        Conto c = new Conto();
        Runnable r = () -> {
            for (int i = 0; i < 100_000; i++) c.deposita(1);
        };
        Thread a = new Thread(r), b = new Thread(r);
        a.start(); b.start();
        a.join();  b.join();
        System.out.println("Saldo finale: " + c.getSaldo() + " (atteso 200000)");
    }
}`;
  const J_BUFFER = String.raw`
public class Buffer {
    private final int[] dati = new int[5];
    private int quanti = 0, testa = 0, coda = 0;

    public synchronized void inserisci(int x) throws InterruptedException {
        while (quanti == dati.length) wait();   // buffer pieno: il produttore aspetta
        dati[coda] = x;
        coda = (coda + 1) % dati.length;
        quanti++;
        notifyAll();                             // sveglia i consumatori
    }

    public synchronized int preleva() throws InterruptedException {
        while (quanti == 0) wait();              // buffer vuoto: il consumatore aspetta
        int x = dati[testa];
        testa = (testa + 1) % dati.length;
        quanti--;
        notifyAll();
        return x;
    }
}`;
  const H_PAGINA = String.raw`
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Il mio primo sito</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <header>
    <h1>Laboratorio 5B</h1>
    <nav>
      <a href="index.html">Home</a>
      <a href="orario.html">Orario</a>
      <a href="progetti.html">Progetti</a>
    </nav>
  </header>
  <main>
    <article class="scheda">
      <h2>Progetto: stazione meteo</h2>
      <p>Arduino, sensore DHT11 e pagina web con i dati.</p>
    </article>
  </main>
  <footer>ITIS - Anno scolastico ${annoScolastico}</footer>
</body>
</html>`;
  const C_STILE = String.raw`
/* style.css */
body {
  margin: 0;
  font-family: Arial, sans-serif;
  background: #f4f6f9;
}
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: #1a5fb4;
  color: #ffffff;
}
nav a {
  color: #ffffff;
  margin-left: 16px;
}
.scheda {
  box-sizing: border-box;
  width: 320px;
  margin: 20px;
  padding: 16px;
  border: 2px solid #1f2d3d;
  border-radius: 8px;
  background: #ffffff;
}`;

  // ---------- le lezioni ----------
  const MATERIE = {
    reti: {
      nome: 'Sistemi e Reti',
      classe: 'Classe 5ª · Unità 2',
      titolo: 'Indirizzamento IPv4 e subnetting',
      prof: 'Prof. M. Rossi',
      get data() { return lunga(-4); },
      minuti: 14,
      lezioni: [['Il modello ISO/OSI e TCP/IP', 'fatta'], ['Ethernet e indirizzi MAC', 'fatta'], ['Indirizzamento IPv4 e subnetting', 'qui'], ['VLSM ed esercizi guidati', breve(7)], ['Routing statico con Packet Tracer', breve(14)], ['DHCP e DNS', breve(21)]],
      corpo: () => `
        <p class="st-intro">Ogni dispositivo collegato a una rete IP ha bisogno di un indirizzo che lo identifichi. In questa lezione vediamo com'è fatto un indirizzo IPv4, a cosa serve la <b>subnet mask</b> e come si divide una rete in sottoreti più piccole, con un esempio completo sulla rete del nostro istituto.</p>
        <h2 id="st-s1">1. Com'è fatto un indirizzo IPv4</h2>
        <p>Un indirizzo IPv4 è un numero di <b>32 bit</b>. Per leggerlo più facilmente lo scriviamo in <i>notazione decimale puntata</i>: quattro numeri da 0 a 255 (gli <b>ottetti</b>), separati da un punto.</p>
        <div class="st-tabella"><table><thead><tr><th>Decimale</th><th>192</th><th>168</th><th>10</th><th>37</th></tr></thead>
          <tbody><tr><td>Binario</td><td><code>11000000</code></td><td><code>10101000</code></td><td><code>00001010</code></td><td><code>00100101</code></td></tr></tbody></table></div>
        <p>L'indirizzo è diviso in due parti: la <b>parte di rete</b>, uguale per tutti i dispositivi della stessa rete, e la <b>parte host</b>, che identifica il singolo dispositivo.</p>
        <h2 id="st-s2">2. La subnet mask</h2>
        <p>La subnet mask indica quanti bit appartengono alla rete. Ha tutti 1 nella parte di rete e tutti 0 nella parte host. Si può scrivere per esteso (<code>255.255.255.0</code>) o in notazione <b>CIDR</b> (<code>/24</code>, cioè 24 bit a 1).</p>
        <p>Per trovare l'indirizzo di rete si fa l'<b>AND bit a bit</b> tra indirizzo e maschera. Con <code>192.168.10.37/24</code> otteniamo la rete <code>192.168.10.0</code> e il broadcast <code>192.168.10.255</code>: restano 2<sup>8</sup> − 2 = <b>254 host</b> utilizzabili.</p>
        ${nota('info', 'Indirizzi privati (RFC 1918)', 'Non sono instradati su Internet e si usano nelle reti locali: <code>10.0.0.0/8</code>, <code>172.16.0.0/12</code> e <code>192.168.0.0/16</code>. Per uscire su Internet il router usa il NAT.')}
        <h2 id="st-s3">3. Esempio: la rete dell'istituto</h2>
        <p>Dobbiamo dividere <code>192.168.10.0/24</code> in <b>4 sottoreti</b> uguali: due laboratori, la segreteria e il Wi-Fi. Per avere 4 sottoreti servono 2 bit in più (2<sup>2</sup> = 4), quindi la nuova maschera è <code>/26</code> (<code>255.255.255.192</code>). Ogni sottorete ha 2<sup>6</sup> − 2 = <b>62 host</b>.</p>
        <div class="st-tabella"><table><thead><tr><th>Sottorete</th><th>Indirizzo di rete</th><th>Primo host (gateway)</th><th>Ultimo host</th><th>Broadcast</th></tr></thead><tbody>
          <tr><td>LAB1</td><td><code>192.168.10.0/26</code></td><td><code>.1</code></td><td><code>.62</code></td><td><code>.63</code></td></tr>
          <tr><td>LAB2</td><td><code>192.168.10.64/26</code></td><td><code>.65</code></td><td><code>.126</code></td><td><code>.127</code></td></tr>
          <tr><td>SEGRETERIA</td><td><code>192.168.10.128/26</code></td><td><code>.129</code></td><td><code>.190</code></td><td><code>.191</code></td></tr>
          <tr><td>WI-FI</td><td><code>192.168.10.192/26</code></td><td><code>.193</code></td><td><code>.254</code></td><td><code>.255</code></td></tr></tbody></table></div>
        ${figura(RETE_SVG, 'Figura 1 – Topologia logica: il router R1 ha un\'interfaccia per ogni sottorete e fa da gateway.')}
        <h2 id="st-s4">4. Verifica dalla riga di comando</h2>
        <p>Da un PC del LAB1 controlliamo la configurazione con <code>ipconfig</code> e proviamo a raggiungere il gateway con <code>ping</code>. La maschera <code>255.255.255.192</code> conferma che il PC è nella sottorete /26.</p>
        ${terminale('Prompt dei comandi', String.raw`
C:\Users\studente>ipconfig

Configurazione IP di Windows

Scheda Ethernet Ethernet:

   Suffisso DNS specifico per connessione: lab.itis.local
   Indirizzo IPv4. . . . . . . . . . . . : 192.168.10.37
   Subnet mask . . . . . . . . . . . . . : 255.255.255.192
   Gateway predefinito . . . . . . . . . : 192.168.10.1

C:\Users\studente>ping 192.168.10.1

Esecuzione di Ping 192.168.10.1 con 32 byte di dati:
Risposta da 192.168.10.1: byte=32 durata<1ms TTL=255
Risposta da 192.168.10.1: byte=32 durata<1ms TTL=255
Risposta da 192.168.10.1: byte=32 durata=1ms TTL=255
Risposta da 192.168.10.1: byte=32 durata<1ms TTL=255

Statistiche Ping per 192.168.10.1:
    Pacchetti: Trasmessi = 4, Ricevuti = 4, Persi = 0 (0% persi),

C:\Users\studente>`, 'Figura 2 – Output di ipconfig e ping su un PC del laboratorio.')}
        <h2 id="st-s5">5. Esercizi</h2>
        <ol class="st-esercizi">
          <li>Dato l'indirizzo <code>172.16.45.130/20</code>, calcola indirizzo di rete, broadcast e numero di host.</li>
          <li>Dividi <code>10.0.8.0/22</code> in 8 sottoreti uguali e scrivi la tabella come nell'esempio.</li>
          <li>Il PC <code>192.168.10.70/26</code> può comunicare direttamente con <code>192.168.10.60/26</code>? Motiva la risposta.</li>
        </ol>
        ${nota('avviso', 'Per la verifica', 'Portate la calcolatrice non programmabile: le conversioni binario ↔ decimale vanno fatte a mano.')}`,
    },
    tpsit: {
      nome: 'TPSIT',
      classe: 'Classe 5ª · Unità 1',
      titolo: 'Thread in Java: creazione e sincronizzazione',
      prof: 'Prof.ssa L. Bianchi',
      get data() { return lunga(-1); },
      minuti: 18,
      lezioni: [['Processi e scheduling', 'fatta'], ['Thread in Java: creazione e sincronizzazione', 'qui'], ['Semafori e problemi classici', breve(7)], ['java.util.concurrent', breve(14)], ['Socket TCP in Java', breve(21)], ['Client-server multithread', breve(28)]],
      corpo: () => `
        <p class="st-intro">Un <b>thread</b> è un flusso di esecuzione all'interno di un processo. I thread dello stesso processo condividono la memoria: questo li rende leggeri e veloci da creare, ma obbliga a <b>sincronizzarli</b> quando accedono agli stessi dati.</p>
        <h2 id="st-s1">1. Processi e thread</h2>
        <p>Un processo ha un proprio spazio di indirizzamento; i suoi thread condividono heap, variabili statiche e file aperti, mentre ognuno ha il proprio <b>stack</b> e il proprio program counter. Il cambio di contesto tra thread è quindi molto più economico di quello tra processi.</p>
        <h2 id="st-s2">2. Ciclo di vita di un thread</h2>
        <p>In Java lo stato di un thread si legge con <code>getState()</code> e appartiene all'enum <code>Thread.State</code>.</p>
        ${figura(THREAD_SVG, 'Figura 1 – Gli stati di Thread.State e le transizioni principali.')}
        <h2 id="st-s3">3. Creare un thread</h2>
        <p>Il modo consigliato è implementare l'interfaccia <code>Runnable</code> e passare l'oggetto al costruttore di <code>Thread</code>. Il metodo <code>start()</code> crea il nuovo flusso ed esegue <code>run()</code>; chiamare direttamente <code>run()</code> lo eseguirebbe nel thread corrente.</p>
        ${ide('Contatore.java', 'java', J_RUNNABLE, 'Esempio 1 – Due thread che contano in parallelo; join() attende la loro terminazione.')}
        <h2 id="st-s4">4. Race condition</h2>
        <p>L'istruzione <code>saldo = saldo + importo</code> non è <b>atomica</b>: il thread legge il valore, lo somma e lo riscrive. Se due thread si alternano in mezzo a queste operazioni, un aggiornamento va perso.</p>
        ${ide('Conto.java', 'java', J_CONTO, 'Esempio 2 – Conto condiviso senza sincronizzazione.')}
        ${terminale('studente@lab4: ~/tpsit/thread', `
studente@lab4:~/tpsit/thread$ javac Conto.java
studente@lab4:~/tpsit/thread$ java Conto
Saldo finale: 137482 (atteso 200000)
studente@lab4:~/tpsit/thread$ java Conto
Saldo finale: 151906 (atteso 200000)
studente@lab4:~/tpsit/thread$ `, 'Figura 2 – Ogni esecuzione dà un risultato diverso: è il segnale tipico di una race condition.')}
        <p>La soluzione è rendere il metodo una <b>sezione critica</b> con <code>synchronized</code>: un solo thread alla volta può eseguirlo sullo stesso oggetto, perché deve prima ottenere il suo <i>monitor</i>.</p>
        <h2 id="st-s5">5. Produttore e consumatore</h2>
        <p>Con <code>wait()</code> un thread rilascia il monitor e si sospende finché un altro non chiama <code>notify()</code> o <code>notifyAll()</code>. La condizione va sempre ricontrollata in un <code>while</code>, per via dei risvegli spuri.</p>
        ${ide('Buffer.java', 'java', J_BUFFER, 'Esempio 3 – Buffer circolare limitato condiviso tra produttori e consumatori.')}
        ${nota('info', 'Approfondimento', 'Nelle applicazioni reali si preferiscono le classi di <code>java.util.concurrent</code>: <code>ReentrantLock</code>, <code>Semaphore</code>, <code>ArrayBlockingQueue</code> ed <code>ExecutorService</code>. Le vedremo nell\'unità 4.')}
        <h2 id="st-s6">6. Esercizi</h2>
        <ol class="st-esercizi">
          <li>Correggi <code>Conto.java</code> con <code>synchronized</code> e verifica che il saldo sia sempre 200000.</li>
          <li>Scrivi un programma con 3 produttori e 2 consumatori che usano la classe <code>Buffer</code>.</li>
          <li>Spiega perché in <code>preleva()</code> si usa <code>while</code> e non <code>if</code>.</li>
        </ol>`,
    },
    informatica: {
      nome: 'Informatica',
      classe: 'Classe 5ª · Unità 3',
      titolo: 'HTML e CSS: struttura della pagina e box model',
      prof: 'Prof. G. Conti',
      get data() { return lunga(-6); },
      minuti: 11,
      lezioni: [['Come funziona il web: HTTP e browser', 'fatta'], ['HTML e CSS: struttura della pagina e box model', 'qui'], ['Layout con Flexbox e Grid', breve(7)], ['Form e validazione', breve(14)], ['JavaScript: DOM ed eventi', breve(21)], ['Progetto: sito della classe', breve(28)]],
      corpo: () => `
        <p class="st-intro">Una pagina web è fatta di <b>contenuto</b> (HTML), <b>presentazione</b> (CSS) e <b>comportamento</b> (JavaScript). In questa lezione costruiamo la struttura di una pagina con i tag semantici di HTML5 e impariamo come il browser calcola le dimensioni di ogni elemento.</p>
        <h2 id="st-s1">1. Lo scheletro di un documento HTML5</h2>
        <p>Ogni pagina inizia con il <code>&lt;!DOCTYPE html&gt;</code>. Nell'<code>&lt;head&gt;</code> vanno le informazioni sulla pagina (codifica, titolo, fogli di stile); nel <code>&lt;body&gt;</code> il contenuto visibile.</p>
        ${ide('index.html', 'html', H_PAGINA, 'Esempio 1 – Pagina con i tag semantici header, nav, main, article e footer.')}
        <h2 id="st-s2">2. Tag semantici</h2>
        <p>I tag semantici descrivono il <i>ruolo</i> del contenuto: <code>&lt;header&gt;</code> per l'intestazione, <code>&lt;nav&gt;</code> per i menu, <code>&lt;main&gt;</code> per il contenuto principale, <code>&lt;article&gt;</code> per un contenuto autonomo e <code>&lt;footer&gt;</code> per il piè di pagina. Aiutano i motori di ricerca e gli screen reader, e rendono il codice più leggibile di una serie di <code>&lt;div&gt;</code>.</p>
        <h2 id="st-s3">3. Collegare il foglio di stile</h2>
        ${ide('style.css', 'css', C_STILE, 'Esempio 2 – Foglio di stile con Flexbox per l\'intestazione.')}
        <div class="st-browser"><div class="st-browser-barra"><span class="st-pallini"><i></i><i></i><i></i></span><span class="st-url">localhost:5500/index.html</span></div>
          <div class="st-anteprima"><div class="an-head"><b>Laboratorio 5B</b><span><u>Home</u><u>Orario</u><u>Progetti</u></span></div>
          <div class="an-scheda"><b>Progetto: stazione meteo</b><p>Arduino, sensore DHT11 e pagina web con i dati.</p></div><div class="an-foot">ITIS - Anno scolastico ${annoScolastico}</div></div></div>
        <p class="st-didascalia">Figura 1 – Il risultato nel browser (estensione Live Server).</p>
        <h2 id="st-s4">4. Il box model</h2>
        <p>Il browser tratta ogni elemento come un rettangolo formato da quattro aree: <b>content</b>, <b>padding</b>, <b>border</b> e <b>margin</b>. Con il valore predefinito <code>box-sizing: content-box</code> la larghezza impostata vale solo per il contenuto; con <code>border-box</code> comprende anche padding e bordo.</p>
        ${figura(BOX_SVG, 'Figura 2 – Le aree del box model.')}
        ${nota('info', 'Esempio di calcolo', 'Con <code>width: 320px</code>, <code>padding: 16px</code> e <code>border: 2px</code>: in <code>content-box</code> la scheda occupa 320 + 32 + 4 = <b>356px</b>; in <code>border-box</code> occupa esattamente <b>320px</b> e il contenuto si riduce a 284px.')}
        <h2 id="st-s5">5. Esercizi</h2>
        <ol class="st-esercizi">
          <li>Aggiungi alla pagina una sezione con tre schede affiancate usando Flexbox.</li>
          <li>Calcola lo spazio occupato da un <code>div</code> con <code>width: 200px; padding: 10px 20px; border: 3px solid; margin: 15px</code>.</li>
          <li>Valida la pagina con il validatore del W3C e correggi gli eventuali errori.</li>
        </ol>`,
    },
    ict: {
      nome: 'ICT English',
      classe: 'Classe 5ª · Unit 4',
      titolo: 'Cloud computing and data centres',
      prof: 'Prof.ssa L. Bianchi',
      get data() { return lunga(-2); },
      minuti: 9,
      lezioni: [['Computer hardware: inside the box', 'fatta'], ['Networks and the Internet', 'fatta'], ['Cloud computing and data centres', 'qui'], ['Cybersecurity: threats and defences', breve(7)], ['Artificial intelligence at work', breve(14)], ['Writing a technical report', breve(21)]],
      corpo: () => `
        <p class="st-intro"><b>Cloud computing</b> is the delivery of computing services — servers, storage, databases, networking and software — over the Internet. Instead of buying and maintaining their own machines, companies <i>rent</i> resources from a provider and pay only for what they use.</p>
        <h2 id="st-s1">1. Key vocabulary</h2>
        <div class="st-tabella"><table><thead><tr><th>English</th><th>Meaning</th><th>Italiano</th></tr></thead><tbody>
          <tr><td><b>on-premises</b></td><td>hardware kept in the company's own building</td><td>in sede</td></tr>
          <tr><td><b>scalability</b></td><td>the ability to add or remove resources quickly</td><td>scalabilità</td></tr>
          <tr><td><b>downtime</b></td><td>the time when a service is not available</td><td>tempo di inattività</td></tr>
          <tr><td><b>backup</b></td><td>a copy of data kept in a safe place</td><td>copia di sicurezza</td></tr>
          <tr><td><b>latency</b></td><td>the delay before data starts to arrive</td><td>latenza</td></tr>
          <tr><td><b>provider</b></td><td>the company that sells the service</td><td>fornitore</td></tr></tbody></table></div>
        <h2 id="st-s2">2. Service models: IaaS, PaaS and SaaS</h2>
        <p>With <b>IaaS</b> (Infrastructure as a Service) you rent virtual machines, storage and networks, and you manage the operating system yourself. With <b>PaaS</b> (Platform as a Service) the provider also manages the operating system and the runtime: developers only upload their code. With <b>SaaS</b> (Software as a Service) you simply use a finished application in the browser, like webmail or an online office suite.</p>
        ${nota('info', 'Remember', 'The higher you go (IaaS → PaaS → SaaS), the less you manage and the less control you have.')}
        <h2 id="st-s3">3. Inside a data centre</h2>
        <p>A data centre is a building full of <b>racks</b> of servers. It needs a reliable power supply (with <b>UPS</b> units and generators), a cooling system, fast network links and strong physical security. Providers build data centres in different <b>regions</b>, so that a service can keep working even if one site goes offline.</p>
        <h2 id="st-s4">4. Advantages and disadvantages</h2>
        <p>The main <b>advantages</b> are lower initial costs, scalability, automatic updates and access from anywhere. The main <b>disadvantages</b> are the need for a stable Internet connection, less control over where the data is stored, and the risk of depending on a single provider (<i>vendor lock-in</i>).</p>
        <h2 id="st-s5">Exercises</h2>
        <ol class="st-esercizi">
          <li>Match each service to its model (IaaS, PaaS or SaaS): an online spreadsheet, a virtual server with Linux, a platform where you deploy a web app.</li>
          <li>Write 80–100 words: "Should our school move its files to the cloud?" Give two advantages and one disadvantage.</li>
          <li>Translate into English: «Il fornitore garantisce un tempo di inattività inferiore a un'ora all'anno».</li>
        </ol>`,
    },
    grammar: {
      nome: 'Grammar',
      classe: 'Classe 5ª · Unit 2',
      titolo: 'Present perfect vs past simple · Conditionals',
      prof: 'Prof.ssa L. Bianchi',
      get data() { return lunga(-3); },
      minuti: 12,
      lezioni: [['Present simple and continuous', 'fatta'], ['Present perfect vs past simple', 'qui'], ['Zero, first and second conditional', 'qui'], ['The passive voice', breve(7)], ['Reported speech', breve(14)], ['Relative clauses', breve(21)]],
      corpo: () => `
        <p class="st-intro">Two topics for this unit: when to use the <b>present perfect</b> and when the <b>past simple</b>, and how to build <b>conditional sentences</b>. Both are essential in technical English, for example when you describe what a program <i>has done</i> or what <i>will happen if</i> a user clicks a button.</p>
        <h2 id="st-s1">1. Present perfect</h2>
        <p>Form: <b>have / has + past participle</b>. We use it for actions that happened at an unspecified time before now, or that started in the past and continue now. Typical words: <i>ever, never, already, yet, just, since, for</i>.</p>
        <div class="st-tabella"><table><thead><tr><th>Affirmative</th><th>Negative</th><th>Question</th></tr></thead><tbody>
          <tr><td>I have installed the update.</td><td>I haven't installed it yet.</td><td>Have you installed it?</td></tr>
          <tr><td>She has worked here since 2020.</td><td>She hasn't worked here for long.</td><td>How long has she worked here?</td></tr></tbody></table></div>
        <h2 id="st-s2">2. Past simple</h2>
        <p>Form: <b>verb + -ed</b> (regular) or the second column of irregular verbs (<i>go → went, write → wrote</i>). We use it for finished actions at a <b>specific time</b> in the past. Typical words: <i>yesterday, last week, in 2019, two days ago</i>.</p>
        ${nota('info', 'Present perfect or past simple?', 'If you say WHEN, use the past simple: «I fixed the bug yesterday». If the time is not important or not finished, use the present perfect: «I have fixed the bug» (it works now).')}
        <h2 id="st-s3">3. Conditionals</h2>
        <div class="st-tabella"><table><thead><tr><th>Type</th><th>Form</th><th>Use</th><th>Example</th></tr></thead><tbody>
          <tr><td><b>Zero</b></td><td>if + present, present</td><td>facts, things always true</td><td>If you heat water to 100 °C, it boils.</td></tr>
          <tr><td><b>First</b></td><td>if + present, will + verb</td><td>real, possible future</td><td>If the server crashes, we will lose the data.</td></tr>
          <tr><td><b>Second</b></td><td>if + past simple, would + verb</td><td>imaginary or unlikely situations</td><td>If I had more RAM, the game would run faster.</td></tr></tbody></table></div>
        ${nota('avviso', 'Common mistake', 'Never put «will» or «would» after «if»: ✗ If it will rain… → ✓ If it rains… In the second conditional we often say «If I were you» for all persons.')}
        <h2 id="st-s4">Exercises</h2>
        <ol class="st-esercizi">
          <li>Put the verbs in the present perfect or past simple: «I (write) the report last night, but I (not send) it yet».</li>
          <li>Complete with the first conditional: «If you (click) this link, the browser (open) a new tab».</li>
          <li>Write three second-conditional sentences starting with «If I were a programmer…».</li>
          <li>Find and correct the mistake: «If the battery will be low, the laptop turns off».</li>
        </ol>`,
    },
  };

  const PRIMA = 'reti';
  let materia = (() => { try { return sessionStorage.getItem('if:materia') || PRIMA; } catch { return PRIMA; } })();
  if (!MATERIE[materia]) materia = PRIMA;
  let root;

  function html() {
    return `<div class="st-app">
      <header class="st-top">
        <div class="st-logo"><svg viewBox="0 0 32 32" aria-hidden="true"><rect x="3" y="5" width="26" height="17" rx="2" fill="#1a5fb4"/><rect x="6" y="8" width="20" height="11" fill="#eaf1fb"/><path d="M10 12l3 2-3 2M16 16h5" stroke="#1a5fb4" stroke-width="1.8" fill="none" stroke-linecap="round"/><rect x="11" y="24" width="10" height="2.5" rx="1" fill="#1a5fb4"/></svg>
          <div><b>Informatica Facile</b><small>Dispense e materiali per il triennio</small></div></div>
        <nav class="st-nav">${Object.entries(MATERIE).map(([id, m]) => `<button type="button" data-materia="${id}">${m.nome}</button>`).join('')}<button type="button" data-finto>Esercitazioni</button><button type="button" data-finto>Verifiche</button></nav>
        <label class="st-cerca"><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M13 13l4 4" stroke="currentColor" stroke-width="1.8"/></svg><input type="search" placeholder="Cerca nelle dispense" aria-label="Cerca"></label>
        <div class="st-utente"><button type="button" class="st-campana" aria-label="Notifiche">🔔<span class="st-badge" hidden>1</span></button><span class="st-avatar">S</span><span class="st-nome-ut">Studente · 5ªB</span></div>
      </header>
      <div class="st-corpo">
        <aside class="st-indice"><p class="st-etichetta" id="st-materia-nome"></p><ol id="st-lezioni"></ol>
          <div class="st-progresso"><span>Avanzamento del corso</span><div><i id="st-barra"></i></div><small id="st-perc"></small></div></aside>
        <main class="st-articolo" id="st-articolo"></main>
        <aside class="st-lato"><p class="st-etichetta">In questa pagina</p><ul id="st-toc"></ul>
          <div class="st-box"><p class="st-etichetta">Scadenze</p>
            <ul class="st-scadenze"><li><b>${corta(7)}</b> TPSIT · consegna esercizi sui thread</li><li><b>${corta(14)}</b> Sistemi e Reti · verifica subnetting</li><li><b>${corta(21)}</b> Informatica · progetto HTML</li></ul></div>
          <div class="st-box"><p class="st-etichetta">Materiali allegati</p>
            <ul class="st-allegati"><li>📄 Tabella potenze di 2.pdf</li><li>📄 Esercitazione 3 - testo.pdf</li><li>🗂️ Packet Tracer - lab2.pkt</li></ul></div></aside>
      </div>
      <footer class="st-piede">Informatica Facile · materiale didattico a uso interno · aggiornato il ${breve(0)}/${tra(0).getFullYear()}</footer>
      <div class="st-notifica" hidden role="status"><div class="st-notifica-icona">📎</div>
        <div><b>Nuovo materiale pubblicato</b><p>Prof. M. Rossi ha caricato «Esercitazione subnetting – testo e griglia di correzione».</p><small>Sistemi e Reti · adesso</small></div>
        <button type="button" class="st-chiudi-notifica" aria-label="Chiudi">✕</button></div>
    </div>`;
  }

  function disegna() {
    const m = MATERIE[materia];
    const art = root.querySelector('#st-articolo');
    art.innerHTML = `<nav class="st-briciole">Home <span>›</span> ${m.nome} <span>›</span> ${m.classe} <span>›</span> <b>${m.titolo}</b></nav>
      <h1>${m.titolo}</h1>
      <div class="st-meta"><span class="st-avatar st-avatar-p">${m.prof.split(' ').pop()[0]}</span><span>${m.prof}</span><span>·</span><span>Aggiornato il ${m.data}</span><span>·</span><span>${m.minuti} min di lettura</span>
        <span class="st-tag">${m.nome}</span><span class="st-tag">${m.classe.split(' · ')[0]}</span></div>
      ${m.corpo()}
      <div class="st-fine-lezione"><button type="button" class="st-bt">✓ Segna come letta</button><button type="button" class="st-bt secondario">⬇ Scarica PDF</button></div>`;
    root.querySelector('#st-materia-nome').textContent = `${m.nome} · ${m.classe.split(' · ')[0]}`;
    root.querySelector('#st-lezioni').innerHTML = m.lezioni.map(([t, s]) =>
      `<li class="${s === 'qui' ? 'qui' : s === 'fatta' ? 'fatta' : ''}"><span>${s === 'fatta' ? '✓' : s === 'qui' ? '▸' : '○'}</span>${t}${s !== 'qui' && s !== 'fatta' ? `<small>dal ${s}</small>` : ''}</li>`).join('');
    const fatte = m.lezioni.filter(([, s]) => s === 'fatta').length + 0.5;
    const perc = Math.round((fatte / m.lezioni.length) * 100);
    root.querySelector('#st-barra').style.width = `${perc}%`;
    root.querySelector('#st-perc').textContent = `${perc}% completato`;
    root.querySelector('#st-toc').innerHTML = [...art.querySelectorAll('h2')].map((h) => `<li><a href="#${h.id}" data-vai="${h.id}">${h.textContent.replace(/^\d+\.\s*/, '')}</a></li>`).join('');
    for (const b of root.querySelectorAll('[data-materia]')) b.classList.toggle('attiva', b.dataset.materia === materia);
    root.scrollTop = 0;
  }

  function query() { return `?materia=${materia}`; }

  function avvia(el) {
    root = el;
    disegna();
    root.addEventListener('click', (e) => {
      const b = e.target.closest('[data-materia]');
      if (b) {
        materia = b.dataset.materia;
        try { sessionStorage.setItem('if:materia', materia); } catch {}
        disegna();
        if (window.Boss && window.Boss.attivo) window.Boss.replaceStato(`/dispense${query()}`);
        return;
      }
      const v = e.target.closest('[data-vai]');
      if (v) { e.preventDefault(); const h = root.querySelector(`#${v.dataset.vai}`); if (h) root.scrollTo({ top: h.offsetTop - 70, behavior: 'smooth' }); return; }
      if (e.target.closest('.st-chiudi-notifica')) { root.querySelector('.st-notifica').hidden = true; return; }
      if (e.target.closest('.st-campana')) { root.querySelector('.st-notifica').hidden = false; root.querySelector('.st-badge').hidden = true; return; }
      const fb = e.target.closest('.st-fine-lezione .st-bt');
      if (fb && !fb.classList.contains('secondario')) { fb.textContent = '✓ Lezione segnata come letta'; fb.disabled = true; }
    });
    root.querySelector('.st-cerca input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); e.target.value = ''; e.target.placeholder = 'Nessun risultato nelle dispense di questa classe'; }
    });
  }

  let notificata = false;
  function mostrata() {
    if (notificata) return;
    notificata = true;
    setTimeout(() => {
      if (!window.Boss || !window.Boss.attivo) { notificata = false; return; }
      root.querySelector('.st-notifica').hidden = false;
      root.querySelector('.st-badge').hidden = false;
      setTimeout(() => { root.querySelector('.st-notifica').hidden = true; }, 7000);
    }, 3500 + Math.random() * 2500);
  }

  return { html, avvia, query, mostrata };
})();
