// Every visible text of the app. Edit or translate this file to adapt the
// game; index.html only holds data-t="path.to.key" placeholders that
// js/texts.js fills from here. Entries written as functions build a sentence
// around runtime values. Lines marked LOCAL refer to SCAPE° or its region.
// The game-master view is a staff tool: its texts are not bound to the
// reading level for visitors (style guide 9).
window.TEXTS = {
  lang: 'de',
  pageTitle: 'Klimasimulationsspiel',
  description: 'Das Klimasimulationsspiel: neun Menschen spielen gemeinsam ein Klimamodell. Anleitung, Computermodell, Spielleitung und Auswertung in einer App.',

  // Texts of the shared kit (js/view.js, js/kit.js).
  kit: {
    viewToDesktop: 'Desktop-Ansicht',
    viewToMobile: 'Handy-Ansicht',
    viewToDesktopAria: 'Zur Desktop-Ansicht wechseln',
    viewToMobileAria: 'Zur Handy-Ansicht wechseln',
    fullscreenEnter: 'Vollbild',
    fullscreenExit: 'Vollbild beenden',
    infoAria: 'Erklärung anzeigen',
    merke: 'Merke',
    tasks: 'Aufgaben',
    merkeLocked: 'Löse die Aufgaben – dann erscheint hier, was du herausgefunden hast.',
    devLink: '(dev)'
  },

  // ---- header navigation + poster -------------------------------------------
  nav: {
    aria: 'Teile der App',
    anleitung: 'Anleitung',
    modell: 'Modell',
    spiel: 'Spiel leiten',
    auswertung: 'Auswertung'
  },
  poster: {
    headline: 'Klima zum Mitspielen',
    kicker: (n, total, title) => 'Teil ' + n + ' von ' + total + ' · ' + title,
    lead: {
      anleitung: 'Neun Menschen, ein Planet: Wind, Sonne und Treibhauseffekt als Spiel – und als Modell.',
      modell: 'Das Spiel ohne Menschen. Der Computer übernimmt alle neun Rollen und würfelt jede Entscheidung.',
      spiel: 'Die App führt dich durch jede Runde, rechnet mit und schreibt das Protokoll.',
      auswertung: 'Die Diagramme eurer Gruppe oder des Modelllaufs – bereit für den Beamer.'
    }
  },
  nextPart: title => 'Weiter zu ' + title + ' →',

  // ---- names used everywhere ------------------------------------------------
  rows: {
    short: ['Nord', 'Tropen', 'Süd'],
    long: ['Nordhalbkugel', 'Tropen', 'Südhalbkugel'],
    wind: ['Jetstream →', '← Passat', 'Jetstream →']
  },
  // default names of the nine players (start positions)
  names: ['N1', 'N2', 'N3', 'T1', 'T2', 'T3', 'S1', 'S2', 'S3'],
  place: j => 'Platz ' + j,

  // ---- 1 · Anleitung --------------------------------------------------------
  anleitung: {
    intro: '<b>Neun Menschen stehen in einem 3 × 3-Raster und sind zusammen ein Planet.</b> Jede Person hält eine Zahl – ihre „Temperaturpunkte“. Runde für Runde schieben Winde die Reihen weiter, die Tropen geben Wärme an die Hemisphären ab, die Sonne heizt und das All kühlt. So entsteht aus ein paar einfachen Regeln ein Klimamodell, das man mit dem eigenen Körper durchläuft.',
    partsTitle: 'So hilft dir die App',
    parts: '<ul class="parts-list">' +
      '<li><b>Anleitung</b> Regeln, Aufstellung und was man daraus lernt – diese Seite.</li>' +
      '<li><b>Modell</b> Der Computer spielt alle neun Rollen. Zum Vorzeigen und Vergleichen.</li>' +
      '<li><b>Spiel leiten</b> Führt dich durch jede Runde, rechnet mit und protokolliert.</li>' +
      '<li><b>Auswertung</b> Die Diagramme, die eure Gruppe erzeugt hat – bereit für den Beamer.</li></ul>',
    goal: {
      title: 'Worum geht es?',
      body: '<p>Das Spiel hat zwei Ziele. Erstens erleben die Mitspielenden, <b>wie eine Simulation funktioniert</b>: Ein Modell ist nichts anderes als ein Zustand (hier: neun Zahlen) und feste Regeln, die diesen Zustand Schritt für Schritt fortschreiben. Wetter- und Klimamodelle machen genau das – nur mit Millionen Gitterpunkten statt neun Menschen.</p>' +
        '<p>Zweitens zeigt es stark vereinfacht, wie <b>die globale Zirkulation</b> Wärme von den Tropen zu den Polen transportiert, wie die Erde <b>Energie mit dem Weltall austauscht</b> und was passiert, wenn der <b>Treibhauseffekt</b> diese Bilanz verschiebt.</p>'
    },
    setup: {
      title: 'Material und Aufstellung',
      body: '<ul>' +
        '<li><b>9 Mitspielende und eine Spielleitung.</b> Jede Person bekommt einen Zettel und einen Stift, optional einen Taschenrechner.</li>' +
        '<li><b>Aufstellung im 3 × 3-Raster.</b> Die obere Reihe ist die Nordhalbkugel, die mittlere die Tropen, die untere die Südhalbkugel.</li>' +
        '<li><b>Startwerte:</b> Alle Personen in Nord und Süd beginnen mit <b>0</b> Punkten. Die ersten beiden Tropen-Personen wählen eine Zahl zwischen <b>25 und 50</b>, die dritte bekommt den Rest bis <b>135</b> (z. B. 40, 34 → 61). Die App kann die Startwerte auch würfeln.</li></ul>',
      figAria: 'Neun Personen im 3 × 3-Raster; Nord- und Südreihe bewegen sich nach rechts, die Tropenreihe nach links',
      north: 'NORD', tropics: 'TROPEN', south: 'SÜD',
      jet: 'Jetstream', trade: 'Passat',
      caption: '<b>Die Aufstellung.</b> Wer am rechten Rand steht und nach rechts muss, läuft auf den linken Platz – die Reihen sind wie ein Band um die Erde geschlossen.'
    },
    round: {
      title: 'Eine Runde in vier Schritten',
      body: '<ol>' +
        '<li><b>Wind.</b> Die Nord- und die Südreihe gehen <b>einen Platz nach rechts</b> (die Westwinde der mittleren Breiten, die Jetstreams). Die Tropenreihe geht <b>einen Platz nach links</b> (die Passatwinde). Die Zahlen wandern mit den Menschen.</li>' +
        '<li><b>Wärmeaustausch.</b> Jede Tropen-Person vergleicht sich mit der Person direkt nördlich und direkt südlich von ihr und wählt die Seite mit der <b>größeren Differenz</b> (bei Gleichstand frei). Sie gibt eine selbst gewählte ganze Zahl zwischen <b>0 und der Hälfte dieser Differenz</b> ab. Das ist der Zufall im Modell – wie Wirbel und Tiefdruckgebiete, die mal mehr, mal weniger Wärme polwärts tragen.</li>' +
        '<li><b>Strahlung.</b> Jede Tropen-Person bekommt <b>+8</b> Punkte von der Sonne. Jede Person in Nord und Süd verliert <b>−4</b> Punkte ans Weltall.</li>' +
        '<li><b>Notieren.</b> Die Spielleitung schreibt alle neun Werte auf und berechnet den Mittelwert – oder tippt sie in die App.</li></ol>',
      figAria: 'Energiefluss in einer Spalte: Sonne heizt die Tropen, die Tropen geben Wärme an Nord oder Süd ab, Nord und Süd strahlen ins All ab',
      half: '0 … ½ Differenz',
      orHere: '(oder hierhin)',
      space: 'ins Weltall',
      caption: '<b>Die Energiebilanz einer Runde.</b> Rein kommen 3 × 8 = 24 Punkte, raus gehen 6 × 4 = 24 Punkte. Der Austausch verschiebt nur Punkte, er erzeugt keine.'
    },
    twist: {
      title: 'Die Wendung: Treibhauseffekt',
      body: '<p>Irgendwann – zum Beispiel nach 12 bis 15 Runden, am besten ohne Vorankündigung – verändert die Spielleitung eine einzige Regel: <b>Die Hemisphären verlieren ab jetzt nur noch 3 statt 4 Punkte pro Runde</b> an das Weltall. Mehr Treibhausgase halten Wärme zurück, die sonst abgestrahlt würde.</p>' +
        '<p>Klingt harmlos. Doch die Bilanz kippt: Rein kommen weiter 24 Punkte, raus gehen nur noch 18. Jede Runde bleiben <b>6 Punkte</b> zusätzlich im System – die Mitteltemperatur steigt um ⅔ Punkt pro Runde, und zwar in jeder Runde, ohne Ende.</p>' +
        '<p>In der App schaltest du die Wendung unter <b>Spiel leiten</b> mit dem Schalter „Treibhaus“ um. Im Modell stellst du ein, ab welcher Runde sie greift.</p>'
    },
    observe: {
      title: 'Was man beobachten kann',
      body: '<h3>Wetter ist Zufall, Klima ist Bilanz</h3>' +
        '<p>Die Werte der einzelnen Personen springen wild, weil jede Tropen-Person frei wählt, wie viel sie abgibt. Keine Runde gleicht der anderen, kein Spiel dem nächsten – das ist <b>Wetter</b>. Der <b>Mittelwert</b> aller neun ist dagegen in jeder Runde exakt vorhersagbar: Er bleibt bei 135 / 9 = <b>15</b>, solange die Energiebilanz ausgeglichen ist. Das ist <b>Klima</b>: Es hängt nicht von den einzelnen Entscheidungen ab, sondern nur davon, wie viel Energie herein- und hinausgeht.</p>' +
        '<h3>Vom Tropenberg zum Gefälle</h3>' +
        '<p>Am Anfang sitzt alle Wärme in den Tropen. Nach einigen Runden stellt sich ein Gefälle ein, das ungefähr stabil bleibt: warme Tropen, kühlere Hemisphären. Die Winde mischen dabei entlang der Breitenkreise – ohne sie würde immer dieselbe Tropen-Person mit denselben Nachbarn tauschen.</p>' +
        '<h3>Ein Modell ohne Rückkopplung</h3>' +
        '<p>Nach der Wendung steigt die Temperatur immer weiter. In der echten Welt strahlt eine wärmere Erde mehr Wärme ab, bis sich ein neues, höheres Gleichgewicht einstellt. Diese Rückkopplung fehlt hier – ein guter Einstieg in die Frage, was ein Modell kann und was nicht.</p>'
    },
    tips: {
      title: 'Tipps für die Spielleitung',
      body: '<ul>' +
        '<li><b>Einmal Probe laufen.</b> Unter <b>Modell</b> kannst du eine Runde Schritt für Schritt ansehen – gut zum Erklären am Beamer, bevor alle aufstehen.</li>' +
        '<li><b>Rundenzahl.</b> Rund 20 bis 25 Runden zeigen den Effekt gut. Eine Runde dauert anfangs zwei bis drei Minuten, später unter einer.</li>' +
        '<li><b>Rechnen lassen.</b> Die Tropen-Personen rechnen selbst, die App prüft mit: Im geführten Modus schlägt sie Seite und Höchstmenge vor, der <b>Energie-Check</b> findet Rechenfehler sofort.</li>' +
        '<li><b>Zwei Eingabearten.</b> <i>Geführt</i> führt durch Wind, Austausch und Strahlung und rechnet mit. <i>Nur Endwerte</i> ist schneller, wenn die Gruppe schon sicher ist: Du tippst nur die neun Zahlen am Rundenende ein. Du kannst in jeder Runde wechseln.</li>' +
        '<li><b>Am Ende:</b> Unter <b>Auswertung</b> die Beamer-Ansicht öffnen und der Gruppe ihr eigenes Klima zeigen – inklusive Vergleich mit 100 Computerläufen, die mit denselben Startwerten gespielt wurden.</li></ul>'
    },
    discuss: {
      title: 'Zum Diskutieren',
      body: '<ul>' +
        '<li>Ergibt das Spiel für euch Sinn? Was hat euch überrascht?</li>' +
        '<li>Warum war der Mittelwert so ruhig, obwohl eure Zahlen so gesprungen sind?</li>' +
        '<li>Ihr habt ein Spiel gespielt, der Computer hundert. Ist euer Spiel „richtig“? Was sagt ein einzelner Lauf, was sagt ein Ensemble?</li>' +
        '<li>Was könnte man ergänzen oder ändern, ohne es komplizierter zu machen? (Zum Beispiel: mehr Abstrahlung bei höherer Temperatur, Eis, das weniger Sonne aufnimmt, oder ein Ozean, der langsam reagiert.)</li></ul>'
    }
  },

  // ---- 2 · Modell ------------------------------------------------------------
  modell: {
    fieldAria: 'Das Spielfeld des Modells: neun Personen im 3 × 3-Raster mit ihren Punkten',
    badge: 'Drücke Start oder Schritt',
    readout: { round: 'Runde', mean: 'Mittel', sum: 'Summe', loss: 'Abstrahlung' },
    roundOf: (k, n) => k + ' / ' + n,
    lossValue: (v, warm) => '−' + v + (warm ? ' Treibhaus' : ''),
    play: {
      start: 'Start', resume: 'Weiter', again: 'Nochmal', pause: 'Pause',
      subPlay: 'Animation abspielen', subPause: 'Animation anhalten', subAgain: 'Von vorn abspielen'
    },
    step: 'Schritt', stepSub: 'Ein Teilschritt',
    end: 'Ende', endSub: 'Durchrechnen',
    speed: 'Tempo',
    speedValue: v => v + '×',
    meanTitle: 'Globale Mitteltemperatur',
    meanSub: 'Mittel aller neun Positionen',
    meanAria: 'Diagramm: globale Mitteltemperatur über die Runden',
    newRun: 'Neuer Lauf',
    newRunSub: 'Neue Zufallszahl',
    allCharts: 'Alle Diagramme →',
    hint: 'Start spielt alle Runden ab, Schritt zeigt einen Teilschritt. Blau sind wenige Punkte (kalt), Rot viele (warm). Vereinfacht: Eine wärmere Erde strahlt hier nicht mehr Wärme ab.',
    merkeTitle: 'Merke',
    merke: 'Die Zahlen der einzelnen Personen springen – das ist Wetter. Der Mittelwert hängt nur daran, wie viel Energie herein- und hinausgeht – das ist Klima.',
    phases: [
      '<b>1 · Wind.</b> Die Jetstreams schieben Nord und Süd einen Platz nach rechts, der Passat die Tropen einen Platz nach links.',
      '<b>2 · Austausch.</b> Jede Tropen-Position gibt der Seite mit der größeren Differenz zufällig 0 bis ½ Differenz ab.',
      '<b>3 · Strahlung.</b> Die Sonne heizt die Tropen, die Hemisphären strahlen ins Weltall ab.'
    ],
    caption: {
      inRound: (k, phase) => 'Runde ' + k + ' – ' + phase,
      start: total => '<b>Start.</b> Die Hemisphären haben 0 Punkte, die Tropen zusammen ' + total + '. Drücke <b>Start</b> oder <b>Schritt</b>.',
      done: n => '<b>Fertig.</b> ' + n + ' Runden gespielt. Unter „Alle Diagramme“ gibt es die Auswertung.',
      roundDone: k => '<b>Runde ' + k + ' fertig.</b>'
    },
    settings: {
      title: 'Einstellungen des Modells',
      stable: 'Worauf achten, damit es stabil bleibt?',
      stableAria: 'Stabilität erklären',
      stableNote: '<p><b>1. Energiebilanz ausgleichen.</b> Rein kommen 3 × Sonne, raus gehen 6 × Abstrahlung. Nur wenn <b>Sonne = 2 × Abstrahlung</b> ist, bleibt das Mittel konstant. Jede Abweichung verschiebt es Runde für Runde um (3 · Sonne − 6 · Abstrahlung) / 9 – ohne Ende, denn das Modell kennt keine Rückkopplung.</p>' +
        '<p><b>2. Einschwingen lassen.</b> Am Anfang sitzt alle Wärme in den Tropen. Nach etwa 5–6 Runden hat sich das Gefälle eingependelt. Die Treibhaus-Runde deshalb nicht vor Runde 8–10 setzen und danach noch 8–10 Runden spielen, damit Vorher und Nachher gut zu sehen sind.</p>' +
        '<p><b>3. Treibhaus sanft dosieren.</b> Jeder Punkt weniger Abstrahlung lässt 6 Punkte pro Runde im System (+0,67 im Mittel). Ein Punkt Unterschied reicht.</p>' +
        '<p><b>4. In der Farbskala bleiben.</b> Das Gefälle Tropen − Pole pendelt sich bei etwa 3,7 × Sonne ein; das Niveau legt die Startenergie fest (Mittel = Startenergie / 9). Werte außerhalb von −20 bis 70 erscheinen in der Heatmap nur noch in der Randfarbe.</p>',
      seed: 'Zufallszahl (Seed)',
      seedSub: 'Gleicher Seed = gleicher Lauf',
      seedAria: 'Seed erklären',
      seedNote: '<p>Der Seed legt alle Zufallsentscheidungen des Modells fest. Gleicher Seed und gleiche Einstellungen ergeben exakt denselben Lauf – praktisch, um einen Lauf später noch einmal zu zeigen, oder um nur eine Einstellung zu ändern und den Unterschied zu sehen. Ein anderer Seed zeigt, wie viel allein der Zufall ausmacht.</p>',
      reseed: 'Würfeln',
      defaults: 'Standard',
      apply: 'Übernehmen und neu starten',
      note: 'Die Standardwerte entsprechen dem Python-Skript: Startwerte 25–50 (Rest bis 135), Sonne +8, Abstrahlung −4, ab Runde 15 −3, 24 Runden. Bei Gleichstand wählt das Modell die Seite zufällig.'
    }
  },

  // The rules as numbers (model settings and "Spielregeln anpassen").
  params: {
    infoAria: label => label + ' erklären',
    rangeHelp: '<p>Aus diesem Bereich wählen Tropen 1 und 2 ihren Startwert; Tropen 3 bekommt den Rest bis zur Startenergie. <b>Damit Tropen 3 nicht negativ startet, sollte 2 × Maximum kleiner als die Startenergie sein</b> (Standard: 2 × 50 = 100 &lt; 135).</p>' +
      '<p>Die Startwerte wirken nur am Anfang: Nach etwa 5–6 Runden hat das Modell sie „vergessen“.</p>',
    rounds: {
      label: 'Runden', sub: 'ohne den Start',
      help: '<p>Wie viele Runden das Modell nach dem Start spielt (das Python-Skript: 24).</p>' +
        '<p>Das Gefälle braucht etwa 5–6 Runden, bis es sich eingependelt hat. <b>Nach der Treibhaus-Runde sollten noch 8–10 Runden folgen</b>, damit der Anstieg deutlich wird.</p>'
    },
    warmRound: {
      label: 'Treibhaus ab Runde', sub: '0 = nie',
      help: '<p>Ab dieser Runde gilt die Treibhaus-Abstrahlung. 0 schaltet die Wendung ab, ebenso eine Zahl hinter der letzten Runde.</p>' +
        '<p><b>Nicht vor Runde 8–10 setzen</b>: Erst muss sich das Modell einschwingen, sonst vermischt sich der Treibhauseffekt mit dem Abbau des Tropenbergs vom Start.</p>'
    },
    gain: {
      label: 'Sonne', sub: 'je Tropen-Platz',
      help: '<p>Punkte, die jede Tropen-Position pro Runde von der Sonne bekommt.</p>' +
        '<p><b>Stabil ist das Klima nur, wenn Sonne = 2 × Abstrahlung</b>: 3 Tropen-Plätze nehmen auf, 6 Hemisphären-Plätze geben ab. Sonst driftet das Mittel jede Runde um (3 · Sonne − 6 · Abstrahlung) / 9.</p>' +
        '<p>Die Sonne bestimmt auch das Gefälle: Tropen minus Pole pendelt sich bei etwa <b>3,7 × Sonne</b> ein (bei 8 also ≈ 30). Größere Werte bedeuten größere Schwankungen – und mehr Rechnerei im echten Spiel.</p>'
    },
    loss: {
      label: 'Abstrahlung', sub: 'je Hemisphären-Platz',
      help: '<p>Punkte, die jede Nord- und Süd-Position pro Runde ans Weltall verliert.</p>' +
        '<p><b>Stabil nur bei Abstrahlung = Sonne / 2.</b> Mehr Abstrahlung kühlt das Modell Runde für Runde ab, weniger heizt es auf – und zwar ohne Ende, denn eine wärmere Erde strahlt hier nicht mehr ab.</p>'
    },
    lossWarm: {
      label: 'Abstrahlung Treibhaus', sub: 'nach der Wendung',
      help: '<p>Die Abstrahlung, sobald der Treibhauseffekt greift.</p>' +
        '<p>Jeder Punkt weniger als normal lässt 6 Punkte pro Runde im System: <b>Das Mittel steigt um 0,67 pro Runde</b> und Punkt Unterschied. Ein Punkt (4 → 3) reicht für einen deutlichen Effekt; größere Sprünge laufen schnell aus der Farbskala (−20 bis 70).</p>' +
        '<p>Gleich der normalen Abstrahlung = kein Treibhauseffekt.</p>'
    },
    total: {
      label: 'Startenergie', sub: 'Summe der Tropen',
      help: '<p>Die Summe der drei Tropen-Startwerte. Sie legt das Temperaturniveau fest: <b>Das Mittel liegt dauerhaft bei Startenergie / 9</b> (135 → 15).</p>' +
        '<p>Auf Stabilität und Gefälle hat sie keinen Einfluss. Im eingeschwungenen Zustand liegen die Pole etwa ein Drittel des Gefälles unter dem Mittel, die Tropen zwei Drittel darüber (Standard: ≈ 5 und ≈ 35).</p>'
    },
    initMin: { label: 'Startwert min.', sub: 'Tropen 1 und 2' },
    initMax: { label: 'Startwert max.', sub: 'Tropen 1 und 2' }
  },

  // ---- 3 · Spiel leiten --------------------------------------------------------
  live: {
    fieldAria: 'Das Spielfeld der laufenden Runde',
    setup: {
      intro: '<b>Neues Spiel vorbereiten.</b> Trage ein, wer wo steht, und lege die Startwerte fest. Danach führt dich die App durch jede Runde.',
      namesTitle: '1 · Aufstellung (optional)',
      namesNote: 'So stehen die Mitspielenden zu Beginn. Namen wandern im Spiel mit, damit du später jeder Person ihre eigene Kurve zeigen kannst. Leer lassen = N1 … S3.',
      startTitle: '2 · Startwerte',
      startNote: (min, max, total) => 'Nord und Süd starten mit 0. Die ersten beiden Tropen-Personen wählen eine Zahl zwischen <b>' + min + ' und ' + max + '</b>, die dritte bekommt den Rest bis <b>' + total + '</b>.',
      t1: 'T1', t2: 'T2', t3: 'T3 = Rest',
      roll: 'Auswürfeln',
      rules: 'Spielregeln anpassen',
      rulesNote: 'Die Wendung (Treibhauseffekt) löst du während des Spiels selbst aus.',
      load: 'Spiel laden',
      start: 'Spiel starten',
      outOfRange: (vals, min, max) => 'Hinweis: ' + vals.join(' und ') + ' liegt außerhalb von ' + min + '–' + max + '. Das Spiel geht trotzdem.'
    },
    round: {
      title: k => 'Runde ' + k,
      meanSoFar: v => 'Mittel bisher ' + v,
      lossLabel: 'Abstrahlung der Hemisphären',
      normal: 'Normal',
      warm: 'Treibhaus',
      perRound: v => '−' + v + ' pro Runde',
      entryLabel: 'Eingabe',
      guided: 'Geführt', guidedSub: 'Schritt für Schritt',
      manual: 'Nur Endwerte', manualSub: '9 Zahlen eintippen',
      stepsAria: 'Schritte der Runde',
      steps: ['Wind', 'Austausch', 'Strahlung', 'Notieren']
    },
    say: {
      label: 'Ansage',
      flowLabel: 'Ablauf',
      wind: 'Nord- und Südreihe: <b>einen Platz nach rechts</b> (Jetstream). Tropenreihe: <b>einen Platz nach links</b> (Passat). Wer am Rand steht, läuft auf die andere Seite.',
      exchange: 'Jede Tropen-Person vergleicht sich mit Nord- und Süd-Nachbar und gibt der Seite mit der <b>größeren Differenz</b> eine ganze Zahl zwischen <b>0 und der Hälfte</b> der Differenz ab. Trag ein, was die Personen sagen.',
      radiation: (gain, loss, warm, normalLoss) => 'Die Sonne wärmt die Tropen: <b>jede Tropen-Person +' + gain + '</b>. Die Hemisphären strahlen ins Weltall ab: <b>jede Nord- und Süd-Person −' + loss + '</b>' +
        (warm ? ' <b class="warm-text">(Treibhaus: statt −' + normalLoss + ')</b>' : '') + '.',
      note: 'Alle nennen ihren neuen Wert. Weicht eine Zahl von der Rechnung ab, zählt der Zettel – einfach überschreiben.',
      manual: 'Die Gruppe spielt die Runde selbst: Wind, Austausch, Strahlung. Dann trägst du alle neun Werte ein. Namen zeigen, wer <b>nach dem Wind</b> dort steht; grau ist der Wert vor dieser Runde.'
    },
    replay: 'Nochmal zeigen',
    replayShort: 'Nochmal',
    next: 'Weiter',
    back: 'Zurück',
    randAll: 'Zufall für alle offenen',
    save: 'Runde speichern',
    open: n => 'Noch ' + n + ' Abgabe' + (n > 1 ? 'n' : '') + ' offen.',
    xcard: {
      head: j => 'Tropen · Platz ' + j,
      north: 'Nord', south: 'Süd',
      diff: v => 'Differenz ' + v,
      none: 'Kein Austausch: Beide Nachbarn sind mindestens so warm.',
      tie: 'Gleich große Differenz – die Person darf <b>frei wählen</b>.',
      rule: pole => 'Regel: an <b>' + pole + '</b> (größere Differenz).',
      allowed: maxHtml => ' Erlaubt: <b>0 bis ' + maxHtml + '</b>.',
      toNorth: 'An Nord', toSouth: 'An Süd',
      less: 'weniger', more: 'mehr',
      random: 'Zufall',
      amountAria: j => 'Abgabe Platz ' + j
    },
    warn: {
      pole: pole => 'Die Regel wäre ' + pole + ' – bewusste Abweichung?',
      negative: 'Nur 0 oder mehr.',
      tooMuch: m => 'Mehr als die Hälfte der Differenz – erlaubt sind höchstens ' + m + '.'
    },
    energy: {
      pending: (exp, prev, delta) => '<b>Energie-Check:</b> Summe aller neun Werte muss <b>' + exp + '</b> ergeben (vorher ' + prev + ', ' + delta + ' durch Sonne und Abstrahlung).',
      ok: (sum, exp, mean) => '<b>Energie-Check ✓</b> Summe ' + sum + ' = erwartet ' + exp + '. Mittel <b>' + mean + '</b>.',
      bad: (sum, exp, diff, tooMuch) => '<b>Energie-Check ✗</b> Summe ' + sum + ', erwartet ' + exp + ' – es sind <b>' + diff + ' Punkte ' + (tooMuch ? 'zu viel' : 'zu wenig') + '</b>. Irgendwo hat sich jemand verrechnet. Nachfragen oder bewusst so übernehmen.'
    },
    cellAria: (row, j) => row + ' Platz ' + j,
    protocol: {
      title: 'Protokoll',
      legend: '* = Treibhaus',
      round: 'Rd.',
      mean: 'Mittel',
      start: 'Start',
      warm: 'Treibhaus'
    },
    undo: 'Runde zurück',
    toResults: 'Auswertung',
    json: 'JSON',
    csv: 'CSV',
    load: 'Laden',
    newGame: 'Neues Spiel',
    saveNote: 'Das Spiel wird automatisch in diesem Browser gespeichert. JSON sichert es vollständig (auch zum Laden auf einem anderen Gerät), CSV öffnet sich in Excel.',
    confirmUndo: k => 'Die letzte Runde (' + k + ') löschen?',
    confirmNew: 'Neues Spiel beginnen? Das aktuelle Spiel wird gelöscht – vorher als JSON sichern, wenn du es behalten willst.',
    confirmReplace: 'Das geladene Spiel ersetzt das aktuelle. Fortfahren?',
    badFile: 'Diese Datei ist kein gespeichertes Klimaspiel.'
  },

  // CSV export (columns for Excel) and download file names
  csv: {
    round: 'Runde', warm: 'Treibhaus', mean: 'Mittel', start: 'Start', yes: 'ja', no: 'nein',
    cell: (row, j) => row + ' ' + j,
    person: n => 'Person ' + n
  },
  files: {
    prefix: 'klimaspiel',
    game: 'spiel',
    model: 'modell'
  },

  // ---- 4 · Auswertung ------------------------------------------------------------
  results: {
    sourceAria: 'Welche Daten?',
    game: 'Live-Spiel',
    model: 'Modelllauf',
    modelLabel: seed => 'Modelllauf (Seed ' + seed + ')',
    beamer: 'Beamer-Ansicht',
    beamerOff: 'Beamer beenden',
    readout: { n: 'Runden', m0: 'Mittel Start', m1: 'Mittel Ende', grad: 'Tropen − Pole' },
    png: 'PNG',
    pngAria: title => title + ' als Bild speichern',
    heatTitle: 'Temperaturfeld',
    heatSub: 'Wer hatte wann wie viele Punkte?',
    heatAria: 'Temperaturfeld: die neun Plätze, gefärbt nach Punkten von kalt (blau) bis warm (rot)',
    heatCaption: (k, warm, mean) => (k === 0 ? 'Start' : 'Nach Runde ' + k) + (warm ? ' · Treibhaus' : '') + ' · Mittel ' + mean,
    play: 'Abspielen',
    pause: 'Pause',
    roundSlider: 'Runde',
    meanTitle: 'Globale Mitteltemperatur',
    meanSub: 'Mittel aller neun Positionen',
    meanAria: 'Diagramm: globale Mitteltemperatur über die Runden',
    mean: 'Mittel',
    measured: 'Gemessenes Mittel',
    balance: 'Laut Energiebilanz',
    balanceShort: 'Bilanz',
    noteOff: 'Wo die Linien auseinanderlaufen, hat sich jemand verrechnet – die Energiebilanz allein legt den Mittelwert fest.',
    noteOn: 'Beide Linien liegen genau übereinander: Den Mittelwert bestimmt allein die Energiebilanz, nicht der Zufall beim Austausch.',
    noteModel: 'Egal wie gewürfelt wird: Der Mittelwert hängt nur an Sonne und Abstrahlung. Ohne Treibhaus bleibt er konstant, danach steigt er um 6/9 pro Runde.',
    zonalTitle: 'Tropen und Hemisphären',
    zonalSub: 'Mittel jeder Reihe',
    zonalAria: 'Diagramm: Mittel von Nord, Tropen und Süd über die Runden',
    ens: 'Mit 100 Modellläufen vergleichen (gleiche Startwerte, gleiche Treibhaus-Runden; Band = mittlere 80 %)',
    band: 'Modell-Band (80 %)',
    bandTip: row => 'Modelle ' + row,
    smTitle: 'Zeitreihen aller Positionen',
    smPos: 'Nach Platz',
    smPerson: 'Nach Person',
    smSubPos: 'Jedes Kästchen ist ein Platz im Raster, wie im Python-Skript',
    smSubPerson: 'Jedes Kästchen ist eine Person – ihre eigene Kurve',
    smCell: (row, j) => row + ' · Platz ' + j,
    value: 'Wert',
    emptyGame: 'Noch keine gespielte Runde. Unter <b>Spiel leiten</b> ein Spiel beginnen – oder oben den <b>Modelllauf</b> ansehen.',
    emptyModel: 'Noch kein Modelllauf.'
  },

  // labels inside the charts
  chart: {
    greenhouse: 'TREIBHAUS',
    start: 'Start',
    round: k => 'Runde ' + k
  }
};
