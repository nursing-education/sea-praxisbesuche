/* Isolierte Logiktests v0.38 – Trägerhaus-Schwerpunkt je Bezugslehrer:in.
   Fachlicher Zweck: beim Zuordnen sehen, aus welchem Haus ein Azubi kommt und
   welche Lehrkraft dieses Haus ohnehin überwiegend betreut. Geprüft werden
   Dashboard.einrichtungsSchwerpunkte(), die Anreicherung in lehrkraftZeilen()
   und die erweiterte Suche in lehrkraftFiltern(). */
const fs = require('fs');
const path = require('path');
const bundle = fs.readFileSync(path.join(__dirname, 'extracted_test_bundle.js'), 'utf-8');

const log = [];
let ok = 0, fail = 0;
function p(name, cond) {
  if (cond) { ok++; log.push('✓ ' + name); }
  else { fail++; log.push('✗ ' + name); }
}

let SharePoint = { istAdmin: false, _tokenStill: async () => 'tok',
  _graphGet: async () => ({ value: [] }) };
let Daten = { state: { azubis: [], azubiNamen: {}, lehrer: [], bezugslehrerWert: '', ansichtModus: 'meine' },
  speichern: async () => {} };
let Einrichtungen = { alle: () => [], aliasHinzufuegen: () => {}, sicherstellen: () => {} };
let Oberflaeche = { toast: () => {}, render: () => {} };
let pflichtbesucheMarkieren = () => {};

const wrapped = new Function('SharePoint', 'Daten', 'Einrichtungen', 'Oberflaeche', 'pflichtbesucheMarkieren',
  bundle + '\nreturn { SPSync, Bezugslehrer, Dashboard, bezugslehrerAnzeige };');
const { Dashboard, SPSync } = wrapped(SharePoint, Daten, Einrichtungen, Oberflaeche, pflichtbesucheMarkieren);

(async () => {
  Daten.state.lehrer = [
    { spId: '1', name: 'Klar, Klara', stellenumfang: 100, kapazitaet: 25, aktiv: true },
    { spId: '2', name: 'Misch, Mona', stellenumfang: 100, kapazitaet: 25, aktiv: true },
    { spId: '3', name: 'Leer, Lena',  stellenumfang: 100, kapazitaet: 25, aktiv: true },
  ];
  const azubis = [
    /* Klara: 3x St. Elisabeth, 1x Marienhaus -> klarer Schwerpunkt */
    { bezugslehrer: 'Klar, Klara (25)', stammeinrichtung: 'St. Elisabeth' },
    { bezugslehrer: 'Klar, Klara (25)', stammeinrichtung: 'St. Elisabeth' },
    { bezugslehrer: 'Klar, Klara (25)', stammeinrichtung: 'St. Elisabeth' },
    { bezugslehrer: 'Klar, Klara (25)', stammeinrichtung: 'Marienhaus' },
    /* Mona: 1x Marienhaus, 1x ohne Angabe -> Schwerpunkt trotz Lücke */
    { bezugslehrer: 'Misch, Mona (25)', stammeinrichtung: 'Marienhaus' },
    { bezugslehrer: 'Misch, Mona (25)', stammeinrichtung: '   ' },
    /* Ohne Zuordnung -- darf nirgends mitzählen */
    { bezugslehrer: '', stammeinrichtung: 'St. Elisabeth' },
  ];

  /* Schlüssel der Map ist der normalisierte Name. Bewusst die ECHTE Funktion aus dem
     Bundle statt einer Nachbildung -- sonst testet man gegen die eigene Annahme. */
  const SPSync_norm = s => SPSync._norm(s);

  /* ---------- 1. einrichtungsSchwerpunkte() ------------------------------- */
  const sp = Dashboard.einrichtungsSchwerpunkte(azubis);
  const klara = sp.get(SPSync_norm('Klar, Klara'));

  p('schwerpunkte: häufigstes Haus gewinnt',
    !!klara && klara.name === 'St. Elisabeth' && klara.anzahl === 3);
  p('schwerpunkte: gesamt = alle Azubis der Lehrkraft', klara.gesamt === 4);
  p('schwerpunkte: verschiedene Häuser gezählt', klara.verschiedene === 2);
  p('schwerpunkte: ohne-Angabe zählt in gesamt, nicht als Haus',
    (() => { const m = sp.get(SPSync_norm('Misch, Mona'));
      return m.name === 'Marienhaus' && m.anzahl === 1 && m.gesamt === 2 && m.ohne === 1; })());
  p('schwerpunkte: Lehrkraft ohne Azubis kommt nicht vor', !sp.has(SPSync_norm('Leer, Lena')));
  p('schwerpunkte: Azubis ohne Bezugslehrer zählen nirgends mit',
    !sp.has('') && sp.size === 2);
  p('schwerpunkte: leere Eingabe -> leere Map', Dashboard.einrichtungsSchwerpunkte([]).size === 0);
  p('schwerpunkte: undefined -> kein Absturz', Dashboard.einrichtungsSchwerpunkte(undefined).size === 0);

  /* Gleichstand muss stabil aufgelöst werden (alphabetisch), sonst flackert die
     Anzeige je nach Einlesereihenfolge. */
  const gleich = Dashboard.einrichtungsSchwerpunkte([
    { bezugslehrer: 'X, X (5)', stammeinrichtung: 'Zweitehaus' },
    { bezugslehrer: 'X, X (5)', stammeinrichtung: 'Erstehaus' },
  ]).get(SPSync_norm('X, X'));
  p('schwerpunkte: Gleichstand alphabetisch (stabil)', gleich.name === 'Erstehaus');

  /* Verschiedene "(Zahl)"-Suffixe am selben Namen dürfen nicht auseinanderfallen. */
  const suffix = Dashboard.einrichtungsSchwerpunkte([
    { bezugslehrer: 'Y, Y (10)', stammeinrichtung: 'Haus A' },
    { bezugslehrer: 'Y, Y (25)', stammeinrichtung: 'Haus A' },
  ]).get(SPSync_norm('Y, Y'));
  p('schwerpunkte: gleiche Person trotz anderem "(Zahl)"-Suffix zusammengefasst',
    !!suffix && suffix.anzahl === 2 && suffix.gesamt === 2);

  /* Azubi ganz ohne Haus-Angabe: kein Schwerpunkt, aber Eintrag mit gesamt. */
  const nurOhne = Dashboard.einrichtungsSchwerpunkte([
    { bezugslehrer: 'Z, Z (5)', stammeinrichtung: '' },
  ]).get(SPSync_norm('Z, Z'));
  p('schwerpunkte: nur Azubis ohne Haus -> null statt Fantasiewert', nurOhne === null);

  /* ---------- 2. lehrkraftZeilen(): Anreicherung --------------------------- */
  const zeilen = Dashboard.lehrkraftZeilen(azubis);
  const zKlara = zeilen.find(z => z.name === 'Klar, Klara');
  const zLena  = zeilen.find(z => z.name === 'Leer, Lena');
  p('lehrkraftZeilen: einrichtung ist angehängt',
    !!zKlara && !!zKlara.einrichtung && zKlara.einrichtung.name === 'St. Elisabeth');
  p('lehrkraftZeilen: Lehrkraft ohne Azubis -> einrichtung null',
    !!zLena && zLena.einrichtung === null);
  p('lehrkraftZeilen: bestehende Felder unverändert vorhanden',
    zKlara.ist === 4 && zKlara.soll === 25 && zKlara.inListe === true);

  /* ---------- 3. lehrkraftFiltern(): Suche greift auf das Haus ------------- */
  p('filtern: Suche findet Lehrkraft über den Hausnamen',
    Dashboard.lehrkraftFiltern(zeilen, { suche: 'elisabeth' }).length === 1);
  p('filtern: Haus-Suche liefert die richtige Lehrkraft',
    Dashboard.lehrkraftFiltern(zeilen, { suche: 'elisabeth' })[0].name === 'Klar, Klara');
  p('filtern: Suche nach Lehrkraft-Name funktioniert weiterhin',
    Dashboard.lehrkraftFiltern(zeilen, { suche: 'mona' }).length === 1);
  p('filtern: Haus-Suche schliesst Lehrkräfte ohne dieses Haus aus',
    !Dashboard.lehrkraftFiltern(zeilen, { suche: 'elisabeth' }).some(z => z.name === 'Leer, Lena'));
  p('filtern: Suche ohne Treffer -> leer',
    Dashboard.lehrkraftFiltern(zeilen, { suche: 'gibtesnicht' }).length === 0);
  p('filtern: Zeile ohne einrichtung stürzt bei Haus-Suche nicht ab',
    Dashboard.lehrkraftFiltern([{ name: 'Ohne, Ohne', aktiv: true, einrichtung: null }],
      { suche: 'haus' }).length === 0);

  console.log(log.join('\n'));
  console.log('\n' + ok + '/' + (ok + fail) + ' Tests bestanden.');
  if (fail > 0) process.exit(1);
})();
