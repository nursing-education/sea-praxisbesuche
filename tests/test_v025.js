/* Isolierte Logiktests v0.25 – laufen gegen den TATSAECHLICH aus der HTML
   extrahierten Code (SP_CONFIG, SP_FELDER_ADMINS, bezugslehrerAnzeige,
   SPSync, Azubis), nicht gegen eine Nachbildung. Browser-Abhaengigkeiten
   (SharePoint, Daten, document) werden minimal gestubt. */
const fs = require('fs');
const path = require('path');
const bundle = fs.readFileSync(path.join(__dirname, 'extracted_test_bundle.js'), 'utf-8');

const log = [];
let ok = 0, fail = 0;
function p(name, cond) {
  if (cond) { ok++; log.push('✓ ' + name); }
  else { fail++; log.push('✗ ' + name); }
}

// --- Stubs, die SPSync/Azubis zur Laufzeit erwarten ---
let SharePoint = { istAdmin: false, _graphGet: async () => { throw new Error('kein Netzwerk im Test'); } };
let Daten = { state: { azubis: [], bezugslehrerWert: '', ansichtModus: 'meine' } };

// Bundle im Kontext dieser Stubs auswerten (SP_CONFIG, SP_FELDER_ADMINS,
// bezugslehrerAnzeige, SPSync, Azubis landen als lokale consts).
const wrapped = new Function('SharePoint', 'Daten', bundle + '\nreturn { SP_CONFIG, SP_FELDER_ADMINS, bezugslehrerAnzeige, SPSync, Azubis };');
const { bezugslehrerAnzeige, SPSync, Azubis } = wrapped(SharePoint, Daten);

/* ---------- 1. bezugslehrerAnzeige() -------------------------------- */
p('Klammer-Zahl wird abgetrennt', bezugslehrerAnzeige('Mustermann, Max (25)') === 'Mustermann, Max');
p('Leerzeichen vor Klammer korrekt behandelt', bezugslehrerAnzeige('Meier, Anna (10)') === 'Meier, Anna');
p('Ohne Klammer bleibt Wert unveraendert', bezugslehrerAnzeige('Nur Nachname') === 'Nur Nachname');
p('Leer/undefined -> leerer String', bezugslehrerAnzeige('') === '' && bezugslehrerAnzeige(undefined) === '');
p('Mehrstellige Zahl funktioniert', bezugslehrerAnzeige('Schmidt, Uwe (7)') === 'Schmidt, Uwe');

/* ---------- 2. SPSync.istAdmin() (Cache injiziert, kein Netzwerk) ---- */
(async () => {
  SPSync._adminsCache = [{ spId: 1, email: 'a.muster@example.com' }, { spId: 2, email: 'b.muster@example.com' }];

  const a1 = await SPSync.istAdmin(null, 'a.muster@example.com');
  p('istAdmin: exakter Treffer', a1 === true);

  const a2 = await SPSync.istAdmin(null, 'A.MUSTER@Example.com');
  p('istAdmin: Groß-/Kleinschreibung egal', a2 === true);

  const a3 = await SPSync.istAdmin(null, 'niemand@example.com');
  p('istAdmin: kein Treffer -> false', a3 === false);

  const a4 = await SPSync.istAdmin(null, '');
  p('istAdmin: leere UPN -> false (kein Absturz)', a4 === false);

  SPSync._adminsCache = null; // aufraeumen fuer Fehlerfall-Test
  const origBestand = SPSync.adminsBestand;
  SPSync.adminsBestand = async () => { throw new Error('Liste nicht gefunden'); };
  const a5 = await SPSync.istAdmin('irgendein-token', 'a.muster@example.com');
  p('istAdmin: Liste nicht erreichbar -> sicherer Default false (kein Absturz)', a5 === false);
  SPSync.adminsBestand = origBestand;

  /* ---------- 3. Azubis.sichtbar() -- Nur meine/Alle-Filter ---------- */
  Daten.state.azubis = [
    { id: '1', bezugslehrer: 'Mustermann, Max (25)' },
    { id: '2', bezugslehrer: 'Mustermann, Max (25)' },
    { id: '3', bezugslehrer: 'Meier, Anna (10)' },
    { id: '4', bezugslehrer: '' }
  ];

  Daten.state.bezugslehrerWert = '';
  p('sichtbar(): keine Auswahl getroffen -> alle (Fallback)', Azubis.sichtbar().length === 4);

  Daten.state.bezugslehrerWert = 'Mustermann, Max (25)';
  Daten.state.ansichtModus = 'meine';
  SharePoint.istAdmin = false;
  const meineNichtAdmin = Azubis.sichtbar();
  p('sichtbar(): "meine" filtert korrekt (2 von 4)', meineNichtAdmin.length === 2 && meineNichtAdmin.every(a => a.id === '1' || a.id === '2'));

  Daten.state.ansichtModus = 'alle';
  SharePoint.istAdmin = false;
  const alleAberNichtAdmin = Azubis.sichtbar();
  p('sichtbar(): "alle" ohne Admin-Rechte bleibt gefiltert (kein Bypass)', alleAberNichtAdmin.length === 2);

  Daten.state.ansichtModus = 'alle';
  SharePoint.istAdmin = true;
  const alleAlsAdmin = Azubis.sichtbar();
  p('sichtbar(): "alle" als Admin zeigt wirklich alle (4 von 4)', alleAlsAdmin.length === 4);

  Daten.state.ansichtModus = 'meine';
  SharePoint.istAdmin = true;
  const meineAlsAdmin = Azubis.sichtbar();
  p('sichtbar(): Admin mit "meine" sieht trotzdem nur eigene', meineAlsAdmin.length === 2);

  Daten.state.bezugslehrerWert = 'MUSTERMANN, MAX (25)';
  Daten.state.ansichtModus = 'meine';
  SharePoint.istAdmin = false;
  const grossKlein = Azubis.sichtbar();
  p('sichtbar(): Groß-/Kleinschreibung beim Bezugslehrer-Abgleich egal', grossKlein.length === 2);

  // --- Ausgabe ---
  console.log(log.join('\n'));
  console.log('\n' + ok + '/' + (ok + fail) + ' Tests bestanden.');
  if (fail > 0) process.exit(1);
})();
