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

/* ---------- 2. Umhaengen merkt den Vorgaenger --------------------------- */
Daten.state.azubis = [
  { id: '1', spId: '1', kuerzel: 'Weber', kurs: 'PFK N 041', stammeinrichtung: 'St. Elisabeth',
    bezugslehrer: 'Musterfrau (10)', vorherigerBezugslehrer: '' },
  { id: '2', spId: '2', kuerzel: 'Klein', kurs: 'PFK N 041', stammeinrichtung: '',
    bezugslehrer: '', vorherigerBezugslehrer: '' }
];

const davor1 = await Azubis.bezugslehrerUmhaengen('1', 'Schulz (12)');
const a1 = Azubis.alle().find(a => a.id === '1');
p('umhaengen: neuer Bezugslehrer steht lokal', a1.bezugslehrer === 'Schulz (12)');
p('umhaengen: alter Wert ist als Vorgaenger gemerkt',
  a1.vorherigerBezugslehrer === 'Musterfrau (10)');
p('umhaengen: liefert den Zustand DAVOR zurueck',
  davor1 && davor1.bezugslehrer === 'Musterfrau (10)' && davor1.vorherigerBezugslehrer === '');

/* Zuordnen aus der Leiste ist derselbe Weg -- Vorgaenger ist dann leer. */
await Azubis.bezugslehrerUmhaengen('2', 'Neumann (25)');
const a2 = Azubis.alle().find(a => a.id === '2');
p('zuordnen: Vorgaenger bleibt leer, wenn es keinen gab', a2.vorherigerBezugslehrer === '');
p('zuordnen: nicht mehr in ohneBezugslehrer()',
  !Azubis.ohneBezugslehrer().some(a => a.id === '2'));

/* Entfernen merkt ebenfalls -- sonst waere "versehentlich abgezogen" verloren. */
const davor2 = await Azubis.bezugslehrerUmhaengen('2', '');
p('entfernen: Zuordnung ist weg', Azubis.alle().find(a => a.id === '2').bezugslehrer === '');
p('entfernen: Vorgaenger ist gemerkt',
  Azubis.alle().find(a => a.id === '2').vorherigerBezugslehrer === 'Neumann (25)');
p('entfernen: liefert den Zustand davor', davor2 && davor2.bezugslehrer === 'Neumann (25)');

/* Gleicher Wert = kein Schreibvorgang (Kachel auf der eigenen Zeile abgelegt).
   Auch abweichende "(Zahl)" zaehlt als gleich -- verglichen wird der Name. */
p('unveraendert: liefert null', await Azubis.bezugslehrerUmhaengen('1', 'Schulz (12)') === null);
p('unveraendert trotz anderer "(Zahl)": liefert null',
  await Azubis.bezugslehrerUmhaengen('1', 'Schulz (99)') === null);
p('unveraendert: Vorgaenger wurde NICHT ueberschrieben',
  Azubis.alle().find(a => a.id === '1').vorherigerBezugslehrer === 'Musterfrau (10)');

/* Rueckgaengig stellt BEIDE Werte her -- sonst verfaelscht jedes Rueckgaengig
   das Ein-Schritt-Gedaechtnis, auf dem v0.41 aufbaut. */
await Azubis.bezugslehrerZustandHerstellen(davor1);
const a1z = Azubis.alle().find(a => a.id === '1');
p('rueckgaengig: Bezugslehrer wiederhergestellt', a1z.bezugslehrer === 'Musterfrau (10)');
p('rueckgaengig: Vorgaenger wiederhergestellt', a1z.vorherigerBezugslehrer === '');

p('unbekannte id: kein Absturz, liefert null',
  await Azubis.bezugslehrerUmhaengen('999', 'Schulz (12)') === null);

/* ---------- 3. Gruppierung, Ueberbuchung, Meldungstext ------------------ */
/* Fix-Runde 1 (Review-Befund): azubisJeLehrkraft() gruppiert seit hier nach dem
   ROHwert -- demselben Schluessel wie auslastung()/lehrkraftZeilen(). Vorher lief
   der Schluessel ueber den normalisierten Anzeigenamen und fasste "Musterfrau (10)"
   und "Musterfrau (12)" zu EINER Liste zusammen, obwohl auslastung() daraus ZWEI
   Tabellenzeilen macht -- die Kachel-Anzahl passte dann nicht mehr zum Ist-Wert
   der jeweiligen Zeile. */
const azubisT = [
  { id: '10', kuerzel: 'Weber', kurs: 'PFK N 041', stammeinrichtung: 'St. Elisabeth',
    bezugslehrer: 'Musterfrau (10)' },
  { id: '11', kuerzel: 'Adam',  kurs: 'PFK N 041', stammeinrichtung: 'Marienhaus',
    bezugslehrer: 'Musterfrau (12)' },          /* gleiche Person, andere "(Zahl)" -- ROHwert unterscheidet sich trotzdem */
  { id: '14', kuerzel: 'Zorn',  kurs: 'PflAss',    stammeinrichtung: '',
    bezugslehrer: 'Schulz (5)' },
  { id: '15', kuerzel: 'Anton', kurs: 'PflAss',    stammeinrichtung: '',
    bezugslehrer: 'Schulz (5)' },               /* zweiter Azubi DERSELBEN Zeile, absichtlich nach Zorn eingefuegt */
  { id: '13', kuerzel: 'Ohne',  kurs: 'PFK N 041', stammeinrichtung: '', bezugslehrer: '' }
];
const namenT = { '10': 'Weber, T.', '11': 'Adam, B.', '13': 'Ohne, O.', '14': 'Zorn, S.', '15': 'Anton, A.' };

const proLk = Dashboard.azubisJeLehrkraft(azubisT, namenT);
p('gruppierung: unterschiedliche "(Zahl)"-Varianten bilden GETRENNTE Gruppen (Rohwert-Schluessel)',
  proLk.get('Musterfrau (10)').length === 1 && proLk.get('Musterfrau (12)').length === 1
  && proLk.get('Musterfrau (10)')[0].name === 'Weber, T.'
  && proLk.get('Musterfrau (12)')[0].name === 'Adam, B.');
p('gruppierung: Zugriff erfolgt ueber den Rohwert, nicht mehr normalisiert',
  proLk.get(SPSync._norm('Musterfrau')) === undefined);
const schulz = proLk.get('Schulz (5)');
p('gruppierung: zwei Azubis am selben Rohwert bilden weiterhin EINE Gruppe',
  !!schulz && schulz.length === 2);
p('gruppierung: innerhalb der Gruppe weiterhin nach Name sortiert',
  schulz.map(x => x.name).join(',') === 'Anton, A.,Zorn, S.');
p('gruppierung: Kurs und Traegerhaus kommen mit',
  proLk.get('Musterfrau (10)')[0].kurs === 'PFK N 041'
  && proLk.get('Musterfrau (10)')[0].stammeinrichtung === 'St. Elisabeth');
p('gruppierung: Azubi ohne Bezugslehrer bildet KEINE Gruppe',
  !proLk.has('') && ![...proLk.values()].flat().some(x => x.id === '13'));
p('gruppierung: Lehrkraft ohne Azubis kommt nicht vor',
  proLk.get('Niemand') === undefined);
p('gruppierung: ohne Argumente kein Absturz',
  Dashboard.azubisJeLehrkraft() instanceof Map);

/* Genau der Test, der den Review-Befund gefunden haette: die Kachel-Liste einer
   Zeile muss exakt so viele Azubis enthalten, wie deren eigener Ist-Wert angibt. */
const zeilenT2 = Dashboard.lehrkraftZeilen(azubisT);
p('kachel-liste stimmt mit dem Ist-Wert der EIGENEN Zeile ueberein',
  zeilenT2.length === 3
  && zeilenT2.every(z => (proLk.get(z.wert) || []).length === z.ist));

const zeilenT = [
  { wert: 'Musterfrau (10)', ist: 2, soll: 10 },
  { wert: 'Voll (3)',        ist: 3, soll: 3 },
  { wert: 'OhneKap',         ist: 5, soll: null }
];
p('ueberbuchtNach: unter der Kapazitaet bleibt ruhig',
  Dashboard.ueberbuchtNach(zeilenT, 'Musterfrau (10)').ueberbucht === false);
p('ueberbuchtNach: ist zaehlt den neuen Azubi mit',
  Dashboard.ueberbuchtNach(zeilenT, 'Musterfrau (10)').ist === 3);
p('ueberbuchtNach: genau voll wird durch den naechsten ueberschritten',
  Dashboard.ueberbuchtNach(zeilenT, 'Voll (3)').ueberbucht === true);
p('ueberbuchtNach: ohne Kapazitaet gibt es nichts zu ueberschreiten',
  Dashboard.ueberbuchtNach(zeilenT, 'OhneKap').ueberbucht === false);
p('ueberbuchtNach: andere "(Zahl)" trifft dieselbe Zeile',
  Dashboard.ueberbuchtNach(zeilenT, 'Musterfrau (99)').ist === 3);
p('ueberbuchtNach: unbekannte Lehrkraft -> null',
  Dashboard.ueberbuchtNach(zeilenT, 'Niemand') === null);

p('meldung: umhaengen',
  Dashboard.umhaengenMeldung('Weber, T.', 'Musterfrau', 'Schulz', { ist: 3, soll: 10, ueberbucht: false })
  === 'Weber, T.: Musterfrau → Schulz');
p('meldung: mit Ueberbuchung',
  Dashboard.umhaengenMeldung('Weber, T.', 'Musterfrau', 'Schulz', { ist: 13, soll: 12, ueberbucht: true })
  === 'Weber, T.: Musterfrau → Schulz · jetzt 13 / 12');
p('meldung: zuordnen (vorher keine)',
  Dashboard.umhaengenMeldung('Weber, T.', '', 'Schulz', null)
  === 'Weber, T.: ohne Zuordnung → Schulz');
p('meldung: entfernen',
  Dashboard.umhaengenMeldung('Weber, T.', 'Schulz', '', null)
  === 'Weber, T.: Schulz → ohne Zuordnung');

/* ---------- 4. stumm unterdrueckt nur die eigene Sync-Warnung (Fix 1) ---- */
SPSync._schreiben = async () => { throw new Error('boom'); };
let toastAufrufe = 0;
Oberflaeche.toast = () => { toastAufrufe++; };

await Azubis.bezugslehrerUmhaengen('1', 'Voll (9)');
const a1fehler = Azubis.alle().find(a => a.id === '1');
p('Sync-Fehler ohne stumm: Oberflaeche.toast wird gerufen', toastAufrufe === 1);
p('Sync-Fehler ohne stumm: blOffen bleibt true', a1fehler.blOffen === true);

toastAufrufe = 0;
await Azubis.bezugslehrerUmhaengen('1', 'Neumann (25)', true);
const a1stumm = Azubis.alle().find(a => a.id === '1');
p('Sync-Fehler MIT stumm: Oberflaeche.toast wird NICHT gerufen', toastAufrufe === 0);
p('Sync-Fehler MIT stumm: blOffen bleibt dennoch true (Oberflaeche baut eigene Meldung)',
  a1stumm.blOffen === true);

/* ---------- 4. Inhalt der Zuordnungs-Spalte ----------------------------- */
const offeneT = [
  { id: '20', kuerzel: 'Zorn',  kurs: 'PFK N 041', stammeinrichtung: 'Marienhaus',    bezugslehrer: '' },
  { id: '21', kuerzel: 'Adam',  kurs: 'PflAss 12', stammeinrichtung: 'St. Elisabeth', bezugslehrer: '' },
  { id: '22', kuerzel: 'Bach',  kurs: 'PFK N 041', stammeinrichtung: '',              bezugslehrer: '' },
  { id: '23', kuerzel: 'Fest',  kurs: 'PFK N 041', stammeinrichtung: 'Marienhaus',    bezugslehrer: 'Schulz' }
];
const offeneNamen = { '20': 'Zorn, S.', '21': 'Adam, B.', '22': 'Bach, C.', '23': 'Fest, F.' };

const spalte = Dashboard.offeneAzubis(offeneT, offeneNamen, {});
p('spalte: nur Azubis ohne Bezugslehrer', spalte.length === 3);
p('spalte: Standard sortiert nach Traegerhaus, dann Name',
  spalte.map(x => x.name).join(',') === 'Zorn, S.,Adam, B.,Bach, C.');
p('spalte: fehlendes Traegerhaus steht hinten', spalte[2].name === 'Bach, C.');

const nachName = Dashboard.offeneAzubis(offeneT, offeneNamen, { sortierung: 'name' });
p('spalte: Sortierung nach Name',
  nachName.map(x => x.name).join(',') === 'Adam, B.,Bach, C.,Zorn, S.');

p('spalte: Suche greift auf den Namen',
  Dashboard.offeneAzubis(offeneT, offeneNamen, { suche: 'adam' }).length === 1);
p('spalte: Suche greift auf den Kurs',
  Dashboard.offeneAzubis(offeneT, offeneNamen, { suche: 'PflAss' }).length === 1);
p('spalte: Suche ohne Treffer liefert leere Liste',
  Dashboard.offeneAzubis(offeneT, offeneNamen, { suche: 'xyz' }).length === 0);
p('spalte: ohne Argumente kein Absturz',
  Array.isArray(Dashboard.offeneAzubis()) && Dashboard.offeneAzubis().length === 0);

console.log(log.join('\n'));
console.log('\n' + ok + '/' + (ok + fail) + ' Tests bestanden.');
process.exit(fail ? 1 : 0);
})();
