/* Isolierte Logiktests v0.34 – Admin-Zuordnungs-Board: Bezugslehrer setzen +
   Auslastung liefert Rohwert. Gegen den TATSAECHLICH aus index.html extrahierten
   Code (extracted_test_bundle.js), Browser-/Netzwerk-Abhaengigkeiten gestubt. */
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
  _graphGet: async () => { throw new Error('kein Netzwerk im Test'); } };
let Daten = { state: { azubis: [], azubiNamen: {}, bezugslehrerWert: '', ansichtModus: 'meine' },
  speichern: async () => {} };
let Einrichtungen = { alle: () => [], aliasHinzufuegen: () => {}, sicherstellen: () => {} };
let Oberflaeche = { toast: () => {}, render: () => {} };
let pflichtbesucheMarkieren = () => {};

const wrapped = new Function('SharePoint', 'Daten', 'Einrichtungen', 'Oberflaeche', 'pflichtbesucheMarkieren',
  bundle + '\nreturn { SPSync, Azubis, Dashboard };');
const { SPSync, Azubis, Dashboard } = wrapped(SharePoint, Daten, Einrichtungen, Oberflaeche, pflichtbesucheMarkieren);

(async () => {
  /* ---------- 1. Dashboard.auslastung(): Rohwert `wert` mitgeliefert ---------- */
  const rows = Dashboard.auslastung([
    { bezugslehrer: 'Meier, Anna (10)' },
    { bezugslehrer: 'Meier, Anna (10)' },
    { bezugslehrer: '' },
  ]);
  const meier = rows.find(r => r.wert === 'Meier, Anna (10)');
  p('auslastung: Rohwert `wert` inkl. (Zahl) enthalten', !!meier && meier.ist === 2 && meier.soll === 10);
  p('auslastung: Zeile ohne Bezugslehrer hat wert ""', !!rows.find(r => r.wert === ''));

  /* ---------- 2. SPSync.bezugslehrerSenden(): PATCH field_3 mit Rohwert -------- */
  let patchUrl = null, patchBody = null;
  SPSync._itemsUrl = async () => 'https://graph.example/azubis';
  SPSync._schreiben = async (url, token, methode, body) => { patchUrl = url; patchBody = body; return {}; };

  const az = { spId: '7', bezugslehrer: 'Meier, Anna (10)' };
  const okSend = await SPSync.bezugslehrerSenden(az);
  p('bezugslehrerSenden: erfolgreich -> true, blOffen=false', okSend === true && az.blOffen === false);
  p('bezugslehrerSenden: schreibt Rohwert nach field_3', patchBody && patchBody.field_3 === 'Meier, Anna (10)');
  p('bezugslehrerSenden: PATCH-URL = <items>/<spId>/fields', patchUrl === 'https://graph.example/azubis/7/fields');

  SPSync._schreiben = async () => { throw new Error('boom'); };
  const azErr = { spId: '8', bezugslehrer: 'X (5)' };
  const okErr = await SPSync.bezugslehrerSenden(azErr);
  p('bezugslehrerSenden: Schreibfehler -> false + blOffen=true', okErr === false && azErr.blOffen === true);

  const azOhneId = { bezugslehrer: 'Y (3)' };
  const okOhneId = await SPSync.bezugslehrerSenden(azOhneId);
  p('bezugslehrerSenden: ohne spId -> false + blOffen=true', okOhneId === false && azOhneId.blOffen === true);

  /* ---------- 3. Azubis.bezugslehrerSetzen(): lokal + aus ohneBezugslehrer() raus */
  Daten.state.azubis = [
    { id: '1', spId: '1', kuerzel: 'Mustermann', kurs: 'PFK N 041', bezugslehrer: '' },
    { id: '2', spId: '2', kuerzel: 'Schmidt', kurs: 'PFK N 041', bezugslehrer: 'Meier, Anna (10)' },
  ];
  SPSync._schreiben = async () => ({});   // wieder Erfolg
  p('vorher: genau 1 Azubi ohne Bezugslehrer', Azubis.ohneBezugslehrer().length === 1);

  await Azubis.bezugslehrerSetzen('1', 'Meier, Anna (10)');
  const a1 = Azubis.alle().find(a => a.id === '1');
  p('bezugslehrerSetzen: lokal gesetzt', a1.bezugslehrer === 'Meier, Anna (10)');
  p('bezugslehrerSetzen: blOffen nach Erfolg = false', a1.blOffen === false);
  p('bezugslehrerSetzen: nicht mehr in ohneBezugslehrer()', Azubis.ohneBezugslehrer().length === 0);

  console.log(log.join('\n'));
  console.log('\n' + ok + '/' + (ok + fail) + ' Tests bestanden.');
  if (fail > 0) process.exit(1);
})();
