/* Isolierte Logiktests v0.35 – Bezugslehrer-Stammliste (Scheibe 1a): Kapazitäts-
   Vorschlag (100 % = 25), finden(), SPSync.lehrerAnlegen/lehrerListeLaden.
   Gegen den TATSAECHLICH aus index.html extrahierten Code, Netz/Browser gestubt. */
const fs = require('fs');
const path = require('path');
const bundle = fs.readFileSync(path.join(__dirname, 'extracted_test_bundle.js'), 'utf-8');

const log = [];
let ok = 0, fail = 0;
function p(name, cond) {
  if (cond) { ok++; log.push('✓ ' + name); }
  else { fail++; log.push('✗ ' + name); }
}

let graphAntwort = { value: [] };
let SharePoint = { istAdmin: false, _tokenStill: async () => 'tok',
  _graphGet: async () => graphAntwort };
let Daten = { state: { azubis: [], azubiNamen: {}, lehrer: [], bezugslehrerWert: '', ansichtModus: 'meine' },
  speichern: async () => {} };
let Einrichtungen = { alle: () => [], aliasHinzufuegen: () => {}, sicherstellen: () => {} };
let Oberflaeche = { toast: () => {}, render: () => {} };
let pflichtbesucheMarkieren = () => {};

const wrapped = new Function('SharePoint', 'Daten', 'Einrichtungen', 'Oberflaeche', 'pflichtbesucheMarkieren',
  bundle + '\nreturn { SPSync, Bezugslehrer };');
const { SPSync, Bezugslehrer } = wrapped(SharePoint, Daten, Einrichtungen, Oberflaeche, pflichtbesucheMarkieren);

(async () => {
  SPSync._itemsUrl = async () => 'https://graph.example/lehrer';   // Listen-Lookup umgehen

  /* ---------- 1. Kapazitäts-Vorschlag: 100 % = 25 ---------- */
  p('kapazitaetVorschlag: 100 % -> 25', Bezugslehrer.kapazitaetVorschlag(100) === 25);
  p('kapazitaetVorschlag: 80 % -> 20',  Bezugslehrer.kapazitaetVorschlag(80) === 20);
  p('kapazitaetVorschlag: 50 % -> 13 (12,5 gerundet)', Bezugslehrer.kapazitaetVorschlag(50) === 13);
  p('kapazitaetVorschlag: 75 % -> 19 (18,75 gerundet)', Bezugslehrer.kapazitaetVorschlag(75) === 19);
  p('kapazitaetVorschlag: 0/leer/negativ -> null',
    Bezugslehrer.kapazitaetVorschlag(0) === null && Bezugslehrer.kapazitaetVorschlag('') === null && Bezugslehrer.kapazitaetVorschlag(-5) === null);

  /* ---------- 2. lehrerListeLaden(): Mapping + Aktiv-Default ---------- */
  graphAntwort = { value: [
    { id: '10', fields: { Title: 'Meier, Anna', Stellenumfang: 100, Kapazitaet: 25, Aktiv: true } },
    { id: '11', fields: { Title: 'Schmidt, Bea', Stellenumfang: 50, Kapazitaet: 13, Aktiv: false } },
    { id: '12', fields: { Title: 'Ohne, Flag' } },   // Aktiv fehlt -> gilt als aktiv
    { id: '13', fields: { } },                        // ohne Namen -> rausgefiltert
  ] };
  const liste = await SPSync.lehrerListeLaden('tok');
  p('lehrerListeLaden: Einträge ohne Namen werden gefiltert', liste.length === 3);
  p('lehrerListeLaden: Zahlen als Number gelesen', liste[0].stellenumfang === 100 && liste[0].kapazitaet === 25);
  p('lehrerListeLaden: Aktiv=false -> archiviert', liste.find(l => l.name === 'Schmidt, Bea').aktiv === false);
  p('lehrerListeLaden: fehlendes Aktiv-Flag -> aktiv', liste.find(l => l.name === 'Ohne, Flag').aktiv === true);

  /* ---------- 3. lehrerAnlegen(): POST-Felder ---------- */
  let gesendet = null;
  SPSync._itemsUrl = async () => 'https://graph.example/lehrer';
  SPSync._schreiben = async (url, token, methode, body) => { gesendet = body.fields; return { id: '99' }; };
  const neu = await SPSync.lehrerAnlegen('tok', { name: 'Neu, Nina', stellenumfang: 80, kapazitaet: 20 });
  p('lehrerAnlegen: Title/Stellenumfang/Kapazitaet/Aktiv gesetzt',
    gesendet.Title === 'Neu, Nina' && gesendet.Stellenumfang === 80 && gesendet.Kapazitaet === 20 && gesendet.Aktiv === true);
  p('lehrerAnlegen: Rückgabe enthält spId + aktiv', neu.spId === '99' && neu.aktiv === true);
  // Zahl weggelassen, wenn nicht angegeben
  gesendet = null;
  await SPSync.lehrerAnlegen('tok', { name: 'Ohne, Zahl' });
  p('lehrerAnlegen: fehlende Zahlen werden nicht mitgeschickt',
    gesendet.Title === 'Ohne, Zahl' && !('Stellenumfang' in gesendet) && !('Kapazitaet' in gesendet) && gesendet.Aktiv === true);

  /* ---------- 4. Bezugslehrer.finden(): Abgleich trotz "(Zahl)"-Suffix ---------- */
  Daten.state.lehrer = [
    { spId: '1', name: 'Meier, Anna', kapazitaet: 25, aktiv: true },
    { spId: '2', name: 'Schmidt, Bea', kapazitaet: 13, aktiv: false },
  ];
  p('finden: trifft trotz "(Zahl)"-Suffix im Wert', (Bezugslehrer.finden('Meier, Anna (25)') || {}).spId === '1');
  p('finden: unbekannt -> null', Bezugslehrer.finden('Unbekannt, X') === null);
  p('aktive(): archivierte werden ausgeblendet', Bezugslehrer.aktive().length === 1 && Bezugslehrer.aktive()[0].name === 'Meier, Anna');

  console.log(log.join('\n'));
  console.log('\n' + ok + '/' + (ok + fail) + ' Tests bestanden.');
  if (fail > 0) process.exit(1);
})();
