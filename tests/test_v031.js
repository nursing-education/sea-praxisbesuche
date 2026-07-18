/* Isolierte Logiktests v0.31 – Dashboard.besuchsUebersicht() (Dashboard Etappe 1).
   Zaehlt einzelne Pflichtbesuch-Eintraege (einsatz.pflichtbesuch===true) nach
   besuchStatus, schulweit ueber alle Azubis. Gegen den TATSAECHLICH aus
   index.html extrahierten Code (extracted_test_bundle.js). */
const fs = require('fs');
const path = require('path');
const bundle = fs.readFileSync(path.join(__dirname, 'extracted_test_bundle.js'), 'utf-8');

const log = [];
let ok = 0, fail = 0;
function p(name, cond) {
  if (cond) { ok++; log.push('✓ ' + name); }
  else { fail++; log.push('✗ ' + name); }
}

let SharePoint = { istAdmin: false, _graphGet: async () => { throw new Error('kein Netzwerk im Test'); } };
let Daten = { state: { azubis: [], bezugslehrerWert: '', ansichtModus: 'meine' } };

const wrapped = new Function('SharePoint', 'Daten',
  bundle + '\nreturn { Dashboard };');
const { Dashboard } = wrapped(SharePoint, Daten);

/* ---------- 1. Leere / undefinierte Eingabe: alles 0, kein Absturz ---- */
let z = Dashboard.besuchsUebersicht([]);
p('leer: gesamt 0', z.gesamt === 0);
p('leer: alle Status 0', z.durchgeführt === 0 && z.geplant === 0 && z.nachzuholen === 0);
p('undefined: kein Absturz -> gesamt 0', Dashboard.besuchsUebersicht(undefined).gesamt === 0);

/* ---------- 2. Gemischte Daten: Zaehlung nach besuchStatus ------------ */
const azubis = [
  { einsaetze: [
    { pflichtbesuch: true,  besuchStatus: 'durchgeführt' },
    { pflichtbesuch: true,  besuchStatus: 'geplant' },
    { pflichtbesuch: true,  besuchStatus: 'offen' },         // zaehlt nur in gesamt
    { pflichtbesuch: false, besuchStatus: 'durchgeführt' },  // kein Pflichtbesuch -> ignoriert
  ] },
  { einsaetze: [
    { pflichtbesuch: true, besuchStatus: 'nachzuholen' },
    { pflichtbesuch: true, besuchStatus: 'durchgeführt' },
    { pflichtbesuch: true, besuchStatus: 'vorläufig' },      // zaehlt nur in gesamt
  ] },
  { },  // Azubi ohne einsaetze -> kein Absturz
];
z = Dashboard.besuchsUebersicht(azubis);
p('gesamt zaehlt nur Pflichtbesuche (6, nicht 7)', z.gesamt === 6);
p('durchgeführt korrekt (2)', z.durchgeführt === 2);
p('geplant korrekt (1)', z.geplant === 1);
p('nachzuholen korrekt (1)', z.nachzuholen === 1);
p('Nicht-Pflichtbesuch wird ignoriert (durchgeführt bleibt 2)', z.durchgeführt === 2);
p('offen/vorläufig nur in gesamt, keine eigene Kachel-Zahl',
  z.gesamt - z.durchgeführt - z.geplant - z.nachzuholen === 2);

console.log(log.join('\n'));
console.log('\n' + ok + '/' + (ok + fail) + ' Tests bestanden.');
if (fail > 0) process.exit(1);
