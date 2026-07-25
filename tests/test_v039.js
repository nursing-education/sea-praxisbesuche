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
const { Dashboard, SPSync, Bezugslehrer } = wrapped(SharePoint, Daten, Einrichtungen, Oberflaeche, pflichtbesucheMarkieren);

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

/* --- Teil-Update darf Stellenumfang/Kapazitaet nicht loeschen --- */
(async () => {
  let gepatcht = null;
  SPSync._itemsUrl = async () => 'https://x/items';
  SPSync._schreiben = async (url, token, methode, felder) => { gepatcht = felder; };

  await SPSync.lehrerAendern('tok', '1', { aktiv: false });
  p('Teil-Update: Stellenumfang wird NICHT mitgeschrieben',
    !Object.prototype.hasOwnProperty.call(gepatcht, 'Stellenumfang'));
  p('Teil-Update: Kapazitaet wird NICHT mitgeschrieben',
    !Object.prototype.hasOwnProperty.call(gepatcht, 'Kapazitaet'));
  p('Teil-Update: Aktiv wird geschrieben', gepatcht.Aktiv === false);

  await SPSync.lehrerAendern('tok', '1', { name: 'Neu, Nina', stellenumfang: 50, kapazitaet: 13, aktiv: true });
  p('Voll-Update: Stellenumfang kommt weiterhin an', gepatcht.Stellenumfang === 50);
  p('Voll-Update: Kapazitaet kommt weiterhin an', gepatcht.Kapazitaet === 13);

  /* "" bleibt das gezielte Signal zum Leeren -- nicht mit "weglassen" verwechseln */
  await SPSync.lehrerAendern('tok', '1', { stellenumfang: '' });
  p('leerer Wert loescht weiterhin gezielt', gepatcht.Stellenumfang === null);

  /* --- Bezugslehrer.aendern: Teil-Update darf lokalen Eintrag nicht kaputt patchen --- */
  Daten.state.lehrer = [{ spId: '1', name: 'Nina Neu', stellenumfang: 50, kapazitaet: 13, aktiv: true }];

  await Bezugslehrer.aendern('1', { aktiv: false });
  let eintrag = Daten.state.lehrer.find(l => l.spId === '1');
  p('Teil-Update: Stellenumfang bleibt lokal erhalten', eintrag.stellenumfang === 50);
  p('Teil-Update: Kapazitaet bleibt lokal erhalten', eintrag.kapazitaet === 13);
  p('Teil-Update: Aktiv wird lokal uebernommen', eintrag.aktiv === false);

  await Bezugslehrer.aendern('1', { stellenumfang: '' });
  eintrag = Daten.state.lehrer.find(l => l.spId === '1');
  p('leerer Wert leert Stellenumfang auch lokal gezielt', eintrag.stellenumfang === null);

  console.log(log.join('\n'));
  console.log('\n' + ok + '/' + (ok + fail) + ' Tests bestanden.');
  process.exit(fail ? 1 : 0);
})();
