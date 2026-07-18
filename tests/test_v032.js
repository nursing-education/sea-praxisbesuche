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
let Einrichtungen = { alle: () => [], aliasHinzufuegen: () => {}, sicherstellen: () => {} };
let Oberflaeche = { toast: () => {} };
let pflichtbesucheMarkieren = () => {};

const wrapped = new Function('SharePoint', 'Daten', 'Einrichtungen', 'Oberflaeche', 'pflichtbesucheMarkieren',
  bundle + '\nreturn { kursVorschlagAusCsv, SPSync, Azubis, Eingang };');
const { kursVorschlagAusCsv, SPSync, Azubis, Eingang } = wrapped(SharePoint, Daten, Einrichtungen, Oberflaeche, pflichtbesucheMarkieren);

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

  /* ---------- 4. Eingang.uebernehmen(..., neuAnlegen=true) ------------ */
  SharePoint._tokenStill = async () => 'tok';
  let azubiAnlegenAufruf = null;
  SPSync.azubiAnlegen = async (token, plan, kursWert) => {
    azubiAnlegenAufruf = { token, plan, kursWert };
    return { spId: '999', name: 'Mustermann', kurs: kursWert, stammeinrichtung: plan.stammeinrichtung, bezugslehrer: '' };
  };
  let zuordnenAufgerufen = false;
  SPSync.zuordnen = () => { zuordnenAufgerufen = true; return { status: 'keinTreffer', kandidaten: [] }; };
  let hochgeladenMit = null;
  SPSync.einsatzplanHochladen = async (token, spId, planId, einsaetze) => {
    hochgeladenMit = { spId, planId, einsaetze };
    return { neu: 1, geaendert: 0, entfernt: 0 };
  };

  const planNeu = {
    id: 'Mustermann, Erika', kurs: 'PFK 041 N 2024 H', ausbildung: 'PFK',
    stammeinrichtung: 'Krankenhaus X',
    eintraege: [{ typ: 'OE', einrichtungName: 'Krankenhaus X', von: '2025-01-01', bis: '2025-01-15', std: 40 }]
  };
  const korrNeu = [{ bereich: 'Akut', typ: 'OE', zuordnenId: '', durchgefuehrt: false, durchDatum: '' }];

  const ergNeu = await Eingang.uebernehmen(planNeu, korrNeu, true, 'PFK N 041');
  p('uebernehmen(neuAnlegen=true): Erfolg', ergNeu.ok === true);
  p('uebernehmen(neuAnlegen=true): SPSync.zuordnen wird NICHT aufgerufen', zuordnenAufgerufen === false);
  p('uebernehmen(neuAnlegen=true): SPSync.azubiAnlegen wird mit kursWert aufgerufen',
    azubiAnlegenAufruf && azubiAnlegenAufruf.kursWert === 'PFK N 041');
  p('uebernehmen(neuAnlegen=true): Einsatzplan wird mit der neuen spId hochgeladen',
    hochgeladenMit && hochgeladenMit.spId === '999');
  p('uebernehmen(neuAnlegen=true): Bericht wird durchgereicht', ergNeu.bericht.neu === 1);

  /* v0.32-Fix: ergNeu ist bereits erfolgreich durchgelaufen und hat planNeu.azubiSpId
     gestempelt. Fuer den (davon unabhaengigen) Testfall "azubiAnlegen selbst wirft"
     braucht es einen Azubi, der noch KEIN azubiSpId hat -- sonst wuerde die neue
     Dedup-Weiche gar nicht erst bei azubiAnlegen landen. */
  delete planNeu.azubiSpId;
  SPSync.azubiAnlegen = async () => { throw new Error('SharePoint-Schreibfehler (Test)'); };
  const ergFehler = await Eingang.uebernehmen(planNeu, korrNeu, true, 'PFK N 041');
  p('uebernehmen(neuAnlegen=true): Schreibfehler bei azubiAnlegen wird abgefangen, kein Wurf', ergFehler && ergFehler.ok === false && ergFehler.grund === 'schreibfehler');

  const planRetry = {
    id: 'Weber, Jonas', kurs: 'PFK 042 N 2024 H', ausbildung: 'PFK',
    stammeinrichtung: 'Krankenhaus Y',
    eintraege: [{ typ: 'OE', einrichtungName: 'Krankenhaus Y', von: '2025-02-01', bis: '2025-02-15', std: 40 }]
  };
  const korrRetry = [{ bereich: 'Akut', typ: 'OE', zuordnenId: '', durchgefuehrt: false, durchDatum: '' }];

  let azubiAnlegenAufrufe = 0;
  SPSync.azubiAnlegen = async (token, plan, kursWert) => {
    azubiAnlegenAufrufe++;
    return { spId: '555', name: 'Weber', kurs: kursWert, stammeinrichtung: plan.stammeinrichtung, bezugslehrer: '' };
  };
  let einsatzplanAufrufe = 0;
  SPSync.einsatzplanHochladen = async () => {
    einsatzplanAufrufe++;
    if (einsatzplanAufrufe === 1) throw new Error('Netzwerk-Fehler (Test)');
    return { neu: 1, geaendert: 0, entfernt: 0 };
  };

  const ergErsterVersuch = await Eingang.uebernehmen(planRetry, korrRetry, true, 'PFK N 042');
  p('Retry-Szenario: erster Versuch scheitert am Einsatzplan-Upload (nach erfolgreichem Anlegen)',
    ergErsterVersuch && ergErsterVersuch.ok === false && ergErsterVersuch.grund === 'schreibfehler');
  p('Retry-Szenario: azubiSpId wird auf dem plan-Objekt gemerkt', planRetry.azubiSpId === '555');

  let azubisBestandAufgerufen = false;
  SPSync.azubisBestand = async () => { azubisBestandAufgerufen = true; return [{ spId: '555', name: 'Weber', kurs: 'PFK N 042', bezugslehrer: '' }]; };

  const ergZweiterVersuch = await Eingang.uebernehmen(planRetry, korrRetry, true, 'PFK N 042');
  p('Retry-Szenario: zweiter Versuch legt NICHT nochmal an (azubiAnlegen weiterhin nur 1x aufgerufen)', azubiAnlegenAufrufe === 1);
  p('Retry-Szenario: zweiter Versuch nutzt SPSync.azubisBestand statt erneutem Anlegen', azubisBestandAufgerufen === true);
  p('Retry-Szenario: zweiter Versuch gelingt', ergZweiterVersuch && ergZweiterVersuch.ok === true);

  console.log(log.join('\n'));
  console.log('\n' + ok + '/' + (ok + fail) + ' Tests bestanden.');
  if (fail > 0) process.exit(1);
})();
