/* Isolierte Logiktests v0.39 – Zusammenstellung der Menüpunkte (⋮).
   Das Popover selbst ist Browser-Sache; geprüft wird, WELCHE Punkte eine Zeile
   je nach Zustand bekommt. */
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
const { Dashboard } = wrapped(SharePoint, Daten, Einrichtungen, Oberflaeche, pflichtbesucheMarkieren);

const ids = liste => liste.map(x => x.id).join(',');

/* --- Lehrkraft: aktiv, in der Stammliste --- */
const aktiv = Dashboard.lehrkraftAktionen({ inListe: true, aktiv: true });
p('aktiv: drei Punkte in fester Reihenfolge', ids(aktiv) === 'edit,archiv,del');
p('aktiv: Punkt heisst Archivieren', aktiv[1].label === 'Archivieren');
p('aktiv: Loeschen ist als Gefahr markiert', aktiv[2].gefahr === true);
p('aktiv: Bearbeiten ist keine Gefahr', !aktiv[0].gefahr);

/* --- Lehrkraft: archiviert --- */
const arch = Dashboard.lehrkraftAktionen({ inListe: true, aktiv: false });
p('archiviert: gleiche drei Punkte', ids(arch) === 'edit,archiv,del');
p('archiviert: Punkt heisst Reaktivieren', arch[1].label === 'Reaktivieren');

/* --- Lehrkraft: nur als Text am Azubi (Drift-Punkt 2) --- */
p('nicht in Stammliste: gar kein Menue',
  Dashboard.lehrkraftAktionen({ inListe: false, aktiv: true }).length === 0);

/* --- Robustheit --- */
p('ohne Argument: kein Absturz, leeres Menue',
  Array.isArray(Dashboard.lehrkraftAktionen()) && Dashboard.lehrkraftAktionen().length === 0);
p('aktiv fehlt: wird als archiviert behandelt (kein stiller Falschzustand)',
  Dashboard.lehrkraftAktionen({ inListe: true }).length === 3);

/* --- Einrichtung: kein Archivieren, weil es keinen Schreibweg gibt --- */
const einr = Dashboard.einrichtungAktionen();
p('Einrichtung: nur zwei Punkte', ids(einr) === 'edit,del');
p('Einrichtung: kein Archivieren', !einr.some(x => x.id === 'archiv'));
p('Einrichtung: Loeschen ist als Gefahr markiert', einr[1].gefahr === true);

console.log(log.join('\n'));
console.log('\n' + ok + '/' + (ok + fail) + ' Tests bestanden.');
process.exit(fail ? 1 : 0);
