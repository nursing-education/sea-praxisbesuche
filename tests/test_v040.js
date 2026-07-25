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

console.log(log.join('\n'));
console.log('\n' + ok + '/' + (ok + fail) + ' Tests bestanden.');
process.exit(fail ? 1 : 0);
})();
