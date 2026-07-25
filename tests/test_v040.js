/* Isolierte Logiktests v0.40 – Azubi-Kacheln + Umhängen.
   Drag-and-Drop, Sticky-Layout und Auto-Scroll sind Browser-Sache und stehen
   in der Abnahme-Checkliste; hier läuft nur die Logik. */
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
let Oberflaeche = { toast: () => {}, toastAktion: () => {}, render: () => {} };
let pflichtbesucheMarkieren = () => {};

const wrapped = new Function('SharePoint', 'Daten', 'Einrichtungen', 'Oberflaeche', 'pflichtbesucheMarkieren',
  bundle + '\nreturn { SPSync, Azubis, Dashboard, Bezugslehrer, SP_FELDER_AZUBIS, bezugslehrerAnzeige };');
const { SPSync, Azubis, Dashboard, SP_FELDER_AZUBIS } =
  wrapped(SharePoint, Daten, Einrichtungen, Oberflaeche, pflichtbesucheMarkieren);

(async () => {

/* ---------- 1. Feldzuordnung + PATCH-Nutzlast ---------------------------- */
let gepatcht = null;
SPSync._itemsUrl = async () => 'https://graph.example/azubis';
SPSync._schreiben = async (url, token, methode, felder) => { gepatcht = felder; };

await SPSync.bezugslehrerSenden({ spId: '7', bezugslehrer: 'Schulz (12)',
                                  vorherigerBezugslehrer: 'Musterfrau (10)' });
p('PATCH schreibt den Bezugslehrer',
  gepatcht[SP_FELDER_AZUBIS.bezugslehrer] === 'Schulz (12)');
p('PATCH schreibt den Vorgaenger mit',
  gepatcht[SP_FELDER_AZUBIS.vorherigerBezugslehrer] === 'Musterfrau (10)');
p('interner Feldname des Vorgaengers',
  SP_FELDER_AZUBIS.vorherigerBezugslehrer === 'VorherigerBezugslehrer');

await SPSync.bezugslehrerSenden({ spId: '7', bezugslehrer: '' });
p('fehlender Vorgaenger wird als leerer Text geschrieben, nicht als undefined',
  gepatcht[SP_FELDER_AZUBIS.vorherigerBezugslehrer] === '');

/* ---------- 2. Umhaengen merkt den Vorgaenger --------------------------- */
Daten.state.azubis = [
  { id: '1', spId: '1', kuerzel: 'Weber', kurs: 'PFK N 041', stammeinrichtung: 'St. Elisabeth',
    bezugslehrer: 'Musterfrau (10)', vorherigerBezugslehrer: '' },
  { id: '2', spId: '2', kuerzel: 'Klein', kurs: 'PFK N 041', stammeinrichtung: '',
    bezugslehrer: '', vorherigerBezugslehrer: '' }
];

const davor1 = await Azubis.bezugslehrerUmhaengen('1', 'Schulz (12)');
const a1 = Azubis.alle().find(a => a.id === '1');
p('umhaengen: neuer Bezugslehrer steht lokal', a1.bezugslehrer === 'Schulz (12)');
p('umhaengen: alter Wert ist als Vorgaenger gemerkt',
  a1.vorherigerBezugslehrer === 'Musterfrau (10)');
p('umhaengen: liefert den Zustand DAVOR zurueck',
  davor1 && davor1.bezugslehrer === 'Musterfrau (10)' && davor1.vorherigerBezugslehrer === '');

/* Zuordnen aus der Leiste ist derselbe Weg -- Vorgaenger ist dann leer. */
await Azubis.bezugslehrerUmhaengen('2', 'Neumann (25)');
const a2 = Azubis.alle().find(a => a.id === '2');
p('zuordnen: Vorgaenger bleibt leer, wenn es keinen gab', a2.vorherigerBezugslehrer === '');
p('zuordnen: nicht mehr in ohneBezugslehrer()',
  !Azubis.ohneBezugslehrer().some(a => a.id === '2'));

/* Entfernen merkt ebenfalls -- sonst waere "versehentlich abgezogen" verloren. */
const davor2 = await Azubis.bezugslehrerUmhaengen('2', '');
p('entfernen: Zuordnung ist weg', Azubis.alle().find(a => a.id === '2').bezugslehrer === '');
p('entfernen: Vorgaenger ist gemerkt',
  Azubis.alle().find(a => a.id === '2').vorherigerBezugslehrer === 'Neumann (25)');
p('entfernen: liefert den Zustand davor', davor2 && davor2.bezugslehrer === 'Neumann (25)');

/* Gleicher Wert = kein Schreibvorgang (Kachel auf der eigenen Zeile abgelegt).
   Auch abweichende "(Zahl)" zaehlt als gleich -- verglichen wird der Name. */
p('unveraendert: liefert null', await Azubis.bezugslehrerUmhaengen('1', 'Schulz (12)') === null);
p('unveraendert trotz anderer "(Zahl)": liefert null',
  await Azubis.bezugslehrerUmhaengen('1', 'Schulz (99)') === null);
p('unveraendert: Vorgaenger wurde NICHT ueberschrieben',
  Azubis.alle().find(a => a.id === '1').vorherigerBezugslehrer === 'Musterfrau (10)');

/* Rueckgaengig stellt BEIDE Werte her -- sonst verfaelscht jedes Rueckgaengig
   das Ein-Schritt-Gedaechtnis, auf dem v0.41 aufbaut. */
await Azubis.bezugslehrerZustandHerstellen(davor1);
const a1z = Azubis.alle().find(a => a.id === '1');
p('rueckgaengig: Bezugslehrer wiederhergestellt', a1z.bezugslehrer === 'Musterfrau (10)');
p('rueckgaengig: Vorgaenger wiederhergestellt', a1z.vorherigerBezugslehrer === '');

p('unbekannte id: kein Absturz, liefert null',
  await Azubis.bezugslehrerUmhaengen('999', 'Schulz (12)') === null);

console.log(log.join('\n'));
console.log('\n' + ok + '/' + (ok + fail) + ' Tests bestanden.');
process.exit(fail ? 1 : 0);
})();
