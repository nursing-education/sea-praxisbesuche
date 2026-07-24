/* Isolierte Logiktests v0.33.1 – Doppelimport: frischer "durchgeführt"-Status
   darf nicht von der Bewahr-Logik überschrieben werden.
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
  bundle + '\nreturn { SPSync };');
const { SPSync } = wrapped(SharePoint, Daten, Einrichtungen, Oberflaeche, pflichtbesucheMarkieren);

(async () => {
  SPSync._itemsUrl = async () => 'https://graph.example/items';

  /* Ein Bestandseintrag des Azubis (spId 5), Startdatum 2026-01-12, bisher "offen".
     Der Import erkennt ihn per "Von" wieder (Doppelimport) und PATCHt ihn. */
  function bestandMit(status) {
    return [{
      azubiSpId: '5', spId: '100', von: '2026-01-12', bis: '2026-02-01',
      typ: 'Akut', einrichtungName: 'Krankenhaus X', std: null,
      pflichtbesuch: true, pflichtManuell: true,
      besuchStatus: status, besuchDatum: null, besuchUhrzeit: null, besuchNotiz: ''
    }];
  }
  function eingang(status, datum) {
    return {
      von: '2026-01-12', bis: '2026-02-01', typ: 'Akut', einrichtungName: 'Krankenhaus X',
      std: null, pflichtbesuch: true, pflichtManuell: true,
      besuchStatus: status, besuchDatum: datum || null, besuchUhrzeit: null
    };
  }

  let gepatcht;
  SPSync._schreiben = async (url, token, methode, body) => {
    /* PATCH übergibt das Felder-Objekt DIREKT (kein {fields:…}-Wrapper wie beim POST). */
    if (methode === 'PATCH') gepatcht = body;
    return { id: '100' };
  };

  /* ---------- 1. Import bringt "durchgeführt" mit -> gewinnt über Bestand "offen" ---- */
  gepatcht = null;
  SPSync._bestandCache = bestandMit('offen');
  await SPSync.einsatzplanHochladen('tok', '5', 'Muster, Erika', [eingang('durchgeführt', '2026-02-01')]);
  p('Doppelimport: frisch angehaktes "durchgeführt" wird geschrieben (nicht auf "offen" zurückgesetzt)',
    gepatcht && gepatcht.BesuchStatus === 'durchgeführt');
  p('Doppelimport: mitgegebenes Besuchsdatum bleibt erhalten',
    gepatcht && gepatcht.BesuchDatum === '2026-02-01T00:00:00Z');

  /* ---------- 2. Normaler Re-Import ohne Haken -> Bestand ("durchgeführt") bleibt bewahrt ---- */
  gepatcht = null;
  SPSync._bestandCache = bestandMit('durchgeführt');
  await SPSync.einsatzplanHochladen('tok', '5', 'Muster, Erika', [eingang('offen', null)]);
  p('Re-Import ohne Haken: bereits erfasstes "durchgeführt" im Bestand bleibt erhalten',
    gepatcht && gepatcht.BesuchStatus === 'durchgeführt');

  /* ---------- 3. Bestand "offen", Import "offen" -> bleibt "offen" (keine Nebenwirkung) ---- */
  gepatcht = null;
  SPSync._bestandCache = bestandMit('offen');
  await SPSync.einsatzplanHochladen('tok', '5', 'Muster, Erika', [eingang('offen', null)]);
  p('Re-Import ohne Änderung: Status bleibt "offen"',
    gepatcht && gepatcht.BesuchStatus === 'offen');

  console.log(log.join('\n'));
  console.log('\n' + ok + '/' + (ok + fail) + ' Tests bestanden.');
  if (fail > 0) process.exit(1);
})();
