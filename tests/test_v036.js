/* Isolierte Logiktests v0.36 – Scheibe 1b: Bezugslehrer-Stammliste an Auslastung/
   Kapazität angebunden + bearbeiten/löschen. Gegen den echten Bundle-Code, gestubt. */
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
const { SPSync, Bezugslehrer, Dashboard } = wrapped(SharePoint, Daten, Einrichtungen, Oberflaeche, pflichtbesucheMarkieren);

(async () => {
  /* ---------- 1. wertFuer(): kanonischer "Name (Kapazität)"-Rohwert ---------- */
  p('wertFuer: mit Kapazität -> "Name (Zahl)"', Bezugslehrer.wertFuer({ name: 'Meier, Anna', kapazitaet: 25 }) === 'Meier, Anna (25)');
  p('wertFuer: ohne Kapazität -> nur Name', Bezugslehrer.wertFuer({ name: 'Neu, Nina', kapazitaet: null }) === 'Neu, Nina');

  /* ---------- 2. soll(): Kapazität bevorzugt aus der Liste ---------- */
  Daten.state.lehrer = [{ spId: '1', name: 'Meier, Anna', kapazitaet: 20, aktiv: true }];
  p('soll: Liste gewinnt über "(Zahl)" im Wert', Dashboard.soll('Meier, Anna (25)') === 20);
  p('soll: nicht in Liste -> Fallback auf "(Zahl)"', Dashboard.soll('Unbekannt, X (30)') === 30);
  Daten.state.lehrer = [];
  p('soll: leere Liste -> Fallback', Dashboard.soll('Wer, Auch (7)') === 7);

  /* ---------- 3. auslastung(): aktive Listen-Lehrkräfte ohne Azubis ergänzen ---------- */
  Daten.state.lehrer = [
    { spId: '1', name: 'Meier, Anna', kapazitaet: 20, aktiv: true },
    { spId: '2', name: 'Leer, Lars', kapazitaet: 25, aktiv: true },
    { spId: '3', name: 'Archiv, Ann', kapazitaet: 10, aktiv: false },
  ];
  const azubis = [{ bezugslehrer: 'Meier, Anna (20)' }, { bezugslehrer: 'Meier, Anna (20)' }];
  const z = Dashboard.auslastung(azubis);
  const meier = z.filter(r => r.name === 'Meier, Anna');
  p('auslastung: Azubi-Lehrkraft nicht doppelt (Merge per Name)', meier.length === 1 && meier[0].ist === 2 && meier[0].soll === 20);
  const lars = z.find(r => r.name === 'Leer, Lars');
  p('auslastung: aktive Lehrkraft ohne Azubis wird ergänzt (ist=0)', !!lars && lars.ist === 0 && lars.soll === 25);
  /* v0.39.1-Fix: auch archivierte Lehrkräfte ohne Azubis werden ergänzt -- sonst
     waren sie über die Oberfläche (Filter "Archivierte", Suche) unauffindbar und
     Reaktivieren unmöglich. Das "aktiv"-Flag selbst wird hier nicht mitgeführt
     (das übernimmt erst lehrkraftZeilen()), daher nur die Anwesenheit geprüft. */
  const archAnn = z.find(r => r.name === 'Archiv, Ann');
  p('auslastung: archivierte Lehrkraft OHNE Azubis wird trotzdem ergänzt (ist=0)',
    !!archAnn && archAnn.ist === 0 && archAnn.soll === 10);

  /* ---------- 4. azubiAnzahl() ---------- */
  Daten.state.azubis = azubis;
  p('azubiAnzahl: zählt zugeordnete Azubis per Name', Bezugslehrer.azubiAnzahl({ name: 'Meier, Anna' }) === 2);
  p('azubiAnzahl: ohne Zuordnung -> 0', Bezugslehrer.azubiAnzahl({ name: 'Leer, Lars' }) === 0);
  Daten.state.azubis = [];

  /* ---------- 5. SPSync.lehrerAendern / lehrerLoeschen: PATCH/DELETE ---------- */
  let cap = null;
  SPSync._itemsUrl = async () => 'https://graph.example/lehrer';
  SPSync._schreiben = async (url, token, methode, body) => { cap = { url, methode, body }; return {}; };

  await SPSync.lehrerAendern('tok', '5', { name: 'X, Y', stellenumfang: 80, kapazitaet: 20, aktiv: false });
  p('lehrerAendern: PATCH auf <items>/<spId>/fields', cap.methode === 'PATCH' && cap.url === 'https://graph.example/lehrer/5/fields');
  p('lehrerAendern: Felder gesetzt inkl. Aktiv=false',
    cap.body.Title === 'X, Y' && cap.body.Stellenumfang === 80 && cap.body.Kapazitaet === 20 && cap.body.Aktiv === false);
  await SPSync.lehrerAendern('tok', '5', { name: 'X', stellenumfang: '', kapazitaet: '' });
  p('lehrerAendern: leere Zahlen -> null (Feld wird geleert)', cap.body.Stellenumfang === null && cap.body.Kapazitaet === null);

  await SPSync.lehrerLoeschen('tok', '5');
  p('lehrerLoeschen: DELETE auf <items>/<spId>', cap.methode === 'DELETE' && cap.url === 'https://graph.example/lehrer/5');

  /* ---------- 6. Bezugslehrer.aendern / loeschen: lokaler State ---------- */
  Daten.state.lehrer = [{ spId: '5', name: 'Alt, A', stellenumfang: 100, kapazitaet: 25, aktiv: true }];
  SPSync._schreiben = async () => ({});
  const okAend = await Bezugslehrer.aendern('5', { name: 'Neu, N', stellenumfang: 50, kapazitaet: 13, aktiv: false });
  const l5 = Bezugslehrer.alle().find(x => x.spId === '5');
  p('Bezugslehrer.aendern: erfolgreich + lokal aktualisiert',
    okAend === true && l5.name === 'Neu, N' && l5.kapazitaet === 13 && l5.aktiv === false);
  const okDel = await Bezugslehrer.loeschen('5');
  p('Bezugslehrer.loeschen: erfolgreich + aus State entfernt', okDel === true && Bezugslehrer.alle().length === 0);

  console.log(log.join('\n'));
  console.log('\n' + ok + '/' + (ok + fail) + ' Tests bestanden.');
  if (fail > 0) process.exit(1);
})();
