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

  /* ---------- 2. SPSync.azubiAnlegen(): POST + Rueckgabeform + Cache-Pflege ---- */
  const planNeuAz = { id: 'Mustermann, Erika', kurs: 'PFK 041 N 2024 H', stammeinrichtung: 'Krankenhaus X' };
  let gesendeteFelder = null;
  SPSync._itemsUrl = async () => 'https://graph.example/items';
  SPSync._schreiben = async (url, token, methode, body) => {
    gesendeteFelder = body.fields;
    return { id: '4711' };
  };

  const neuAz = await SPSync.azubiAnlegen('tok', planNeuAz, 'PFK N 041');
  p('azubiAnlegen: Title = Nachname aus plan.id', gesendeteFelder.Title === 'Mustermann');
  p('azubiAnlegen: Kurs = uebergebener kursWert (nicht plan.kurs roh)', gesendeteFelder.field_1 === 'PFK N 041');
  p('azubiAnlegen: Stammeinrichtung aus plan.stammeinrichtung', gesendeteFelder.field_2 === 'Krankenhaus X');
  p('azubiAnlegen: Bezugslehrer/Bemerkung/Praxisanleitung leer',
    gesendeteFelder.field_3 === '' && gesendeteFelder.field_4 === '' && gesendeteFelder.field_5 === '');
  p('azubiAnlegen: Rueckgabe enthaelt spId aus der SharePoint-Antwort', neuAz.spId === '4711');
  p('azubiAnlegen: Rueckgabe hat leeren bezugslehrer', neuAz.bezugslehrer === '');

  SPSync._azubisCache = [{ spId: '1', name: 'Bestand' }];
  const neuAz2 = await SPSync.azubiAnlegen('tok', planNeuAz, 'PFK N 041');
  p('azubiAnlegen: neuer Azubi landet im bestehenden Cache (verhindert Duplikate im selben Import)',
    SPSync._azubisCache.length === 2 && SPSync._azubisCache[1].spId === '4711');

  SPSync._azubisCache = null;
  await SPSync.azubiAnlegen('tok', planNeuAz, 'PFK N 041');
  p('azubiAnlegen: kein Cache vorhanden -> kein Absturz', SPSync._azubisCache === null);

  /* ---------- 3. Azubis.ohneBezugslehrer() ---------------------------- */
  Daten.state.azubis = [
    { id: '1', kuerzel: 'Mustermann', kurs: 'PFK N 041', bezugslehrer: 'Meier, Anna (10)' },
    { id: '2', kuerzel: 'Schmidt', kurs: 'PFK N 041', bezugslehrer: '' },
    { id: '3', kuerzel: 'Weber', kurs: 'PFK N 042', bezugslehrer: '   ' },
  ];
  const ohne = Azubis.ohneBezugslehrer();
  p('ohneBezugslehrer: findet leeren String', ohne.some(a => a.id === '2'));
  p('ohneBezugslehrer: findet nur-Leerzeichen als leer', ohne.some(a => a.id === '3'));
  p('ohneBezugslehrer: lässt zugeordnete Azubis weg', !ohne.some(a => a.id === '1'));
  p('ohneBezugslehrer: genau 2 Treffer', ohne.length === 2);
  p('ohneBezugslehrer: leere Liste -> leeres Ergebnis (kein Absturz)',
    (() => { Daten.state.azubis = []; return Azubis.ohneBezugslehrer().length === 0; })());

  console.log(log.join('\n'));
  console.log('\n' + ok + '/' + (ok + fail) + ' Tests bestanden.');
  if (fail > 0) process.exit(1);
})();
