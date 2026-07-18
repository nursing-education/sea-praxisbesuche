/* Isolierte Logiktests v0.32 – CSV-Import: neue Azubis anlegen (Etappe 2, Teil 1).
   Gegen den TATSAECHLICH aus index.html extrahierten Code
   (extracted_test_bundle.js), Browser-/Netzwerk-Abhaengigkeiten gestubt. */
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
let Daten = { state: { azubis: [], azubiNamen: {}, bezugslehrerWert: '', ansichtModus: 'meine' } };

const wrapped = new Function('SharePoint', 'Daten',
  bundle + '\nreturn { kursVorschlagAusCsv, SPSync, Azubis };');
const { kursVorschlagAusCsv, SPSync, Azubis } = wrapped(SharePoint, Daten);

(async () => {
  /* ---------- 1. kursVorschlagAusCsv(): CSV-Langform -> Azubis-Kurzform ---------- */
  p('verifiziertes Beispiel: "PFK 041 N 2024 H" -> "PFK N 041"',
    kursVorschlagAusCsv('PFK 041 N 2024 H') === 'PFK N 041');
  p('ohne Ort-Buchstabe bleibt Typ+Nummer: "PflAss 010" -> "PflAss 010"',
    kursVorschlagAusCsv('PflAss 010') === 'PflAss 010');
  p('kein erkennbares Muster -> Wert unveraendert',
    kursVorschlagAusCsv('irgendein Text') === 'irgendein Text');
  p('leer/undefined -> leerer String',
    kursVorschlagAusCsv('') === '' && kursVorschlagAusCsv(undefined) === '');

  console.log(log.join('\n'));
  console.log('\n' + ok + '/' + (ok + fail) + ' Tests bestanden.');
  if (fail > 0) process.exit(1);
})();
