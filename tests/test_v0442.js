/* Isolierte Logiktests v0.44.2 -- derselbe Einsatzplan mehrfach importiert.

   Aus dem Testbetrieb gemeldet (12.08.2026): Eine Kollegin hat dieselbe CSV
   viermal hochgeladen. Ergebnis in der SharePoint-Liste "Einsaetze": jeder
   Einsatz viermal, mit identischem Von und Bis. Nur EIN Eintrag in "Azubis".

   einsatzplanHochladen() soll das verhindern -- es liest den Bestand des
   Azubis, erkennt vorhandene Eintraege am Startdatum wieder, aktualisiert sie
   und loescht am Ende alles, was der neue Plan nicht mehr enthaelt.

   Dieser Test spielt genau das durch: ein nachgebauter SharePoint-Speicher,
   auf den der ECHTE Schreib- und Lesepfad arbeitet (_felderFuer schreibt
   hinein, _einsatzAus liest zurueck). Damit faellt auf, wenn der Rundlauf
   einen Wert veraendert -- z.B. das Datumsformat. */
const fs = require('fs');
const path = require('path');
const bundle = fs.readFileSync(path.join(__dirname, 'extracted_test_bundle.js'), 'utf-8');

const log = [];
let ok = 0, fail = 0;
function p(name, cond) {
  if (cond) { ok++; log.push('✓ ' + name); }
  else { fail++; log.push('✗ ' + name); }
}

let SharePoint = { istAdmin: true, _graphGet: async () => { throw new Error('kein Netzwerk im Test'); } };
let Daten = { state: { azubis: [], bezugslehrerWert: '', ansichtModus: 'meine' } };

const wrapped = new Function('SharePoint', 'Daten', bundle + '\nreturn { SPSync, SP_FELDER_EINSAETZE };');
const { SPSync, SP_FELDER_EINSAETZE } = wrapped(SharePoint, Daten);

/* ---------- Nachgebauter SharePoint ---------------------------------- */
/* Haelt Items als {id, fields} wie Graph sie liefert. Zaehlt mit, welche
   Schreibvorgaenge tatsaechlich abgesetzt wurden. */
const SP = {
  items: [],
  naechsteId: 100,
  protokoll: { post: 0, patch: 0, del: 0 },
  zuruecksetzen() { this.items = []; this.naechsteId = 100; this.protokoll = { post: 0, patch: 0, del: 0 }; }
};

SPSync._itemsUrl = async () => 'SP/items';

SPSync._schreiben = async (url, _token, methode, body) => {
  if (methode === 'POST') {
    SP.protokoll.post++;
    const item = { id: String(SP.naechsteId++), fields: Object.assign({}, body.fields) };
    SP.items.push(item);
    return item;
  }
  if (methode === 'PATCH') {
    SP.protokoll.patch++;
    const id = url.replace('SP/items/', '').replace('/fields', '');
    const item = SP.items.find(x => x.id === id);
    if (!item) throw new Error('PATCH auf unbekanntes Item ' + id);
    item.fields = Object.assign({}, body);
    return item;
  }
  if (methode === 'DELETE') {
    SP.protokoll.del++;
    const id = url.replace('SP/items/', '');
    const i = SP.items.findIndex(x => x.id === id);
    if (i < 0) throw new Error('DELETE auf unbekanntes Item ' + id);
    SP.items.splice(i, 1);
    return null;
  }
  throw new Error('unerwartete Methode ' + methode);
};

/* Liest ueber den ECHTEN _einsatzAus zurueck -- der Rundlauf soll geprueft
   werden, nicht nachgebaut. */
SPSync.einsaetzeLaden = async () => SP.items.map(it => SPSync._einsatzAus(it));

/* ---------- Ein Plan, wie ihn der Pruefschritt uebergibt -------------- */
const AZUBI_SPID = '17';
function planFrisch() {
  return [
    { typ: 'OE', einrichtungName: 'Haus Nord', von: '2024-05-06', bis: '2024-06-30', std: 200,
      pflichtbesuch: true, pflichtManuell: null, besuchStatus: 'offen', besuchDatum: null,
      besuchUhrzeit: null, besuchNotiz: '', sammelbesuchId: null },
    { typ: 'OE', einrichtungName: 'Haus Nord', von: '2024-07-01', bis: '2024-08-15', std: 160,
      pflichtbesuch: false, pflichtManuell: null, besuchStatus: 'offen', besuchDatum: null,
      besuchUhrzeit: null, besuchNotiz: '', sammelbesuchId: null },
    { typ: 'PAD', einrichtungName: 'Kinderklinik West', von: '2024-09-02', bis: '2024-10-31', std: 180,
      pflichtbesuch: true, pflichtManuell: null, besuchStatus: 'offen', besuchDatum: null,
      besuchUhrzeit: null, besuchNotiz: '', sammelbesuchId: null }
  ];
}

(async () => {
  /* ---------- 1. Rundlauf: kommt heraus, was hineingeschrieben wurde? -- */
  SP.zuruecksetzen();
  SPSync.cacheLeeren();
  await SPSync.einsatzplanHochladen(null, AZUBI_SPID, 'Musterfrau, Erika', planFrisch());

  const gelesen = await SPSync.einsaetzeLaden();
  p('Rundlauf: Startdatum kommt unveraendert zurueck',
    gelesen.length === 3 && gelesen[0].von === '2024-05-06');
  p('Rundlauf: Azubi-Verknuepfung kommt als Zeichenkette zurueck',
    gelesen.every(e => e.azubiSpId === AZUBI_SPID));

  /* ---------- 2. Der gemeldete Fall: vier Uploads derselben Datei ------ */
  SP.zuruecksetzen();
  const berichte = [];
  for (let durchgang = 0; durchgang < 4; durchgang++) {
    SPSync.cacheLeeren();          /* jeder Upload ist ein eigener Vorgang */
    berichte.push(await SPSync.einsatzplanHochladen(null, AZUBI_SPID, 'Musterfrau, Erika', planFrisch()));
  }

  p('vier Uploads derselben Datei ergeben drei Eintraege, nicht zwoelf',
    SP.items.length === 3);
  p('nur der erste Upload legt an', SP.protokoll.post === 3);
  p('die folgenden drei aktualisieren', SP.protokoll.patch === 9);
  p('nichts wird geloescht, weil nichts wegfaellt', SP.protokoll.del === 0);
  p('der Bericht meldet ab dem zweiten Upload 0 neu',
    berichte.slice(1).every(b => b.neu === 0 && b.geaendert === 3));

  /* ---------- 2b. Vier Dateien in EINEM Vorgang ----------------------
     Die Dateiauswahl erlaubt Mehrfachauswahl (inp.multiple). Dann laeuft
     cacheLeeren() nur EINMAL zu Beginn, und die vier Bloecke arbeiten
     nacheinander auf demselben Zwischenspeicher. */
  SP.zuruecksetzen();
  SPSync.cacheLeeren();
  for (let block = 0; block < 4; block++) {
    await SPSync.einsatzplanHochladen(null, AZUBI_SPID, 'Musterfrau, Erika', planFrisch());
  }
  p('vier Bloecke in einem Vorgang ergeben ebenfalls drei Eintraege',
    SP.items.length === 3);

  /* ---------- 2c. Wiederholungen in der Eingabe selbst ----------------
     Kein zweiter Upload, sondern EIN Plan, der denselben Zeitraum viermal
     enthaelt -- so wie eine CSV aussieht, an die derselbe Export mehrfach
     angehaengt wurde. nachVon kennt nur den SharePoint-Bestand, nicht das,
     was im selben Durchgang gerade angelegt wurde. */
  SP.zuruecksetzen();
  SPSync.cacheLeeren();
  const vierfach = [];
  for (let k = 0; k < 4; k++) vierfach.push(...planFrisch());
  const berichtVierfach = await SPSync.einsatzplanHochladen(null, AZUBI_SPID, 'Musterfrau, Erika', vierfach);
  p('vierfache Eingabe erzeugt keine vierfachen Eintraege',
    SP.items.length === 3 && berichtVierfach.neu === 3);
  p('uebersprungene Wiederholungen werden gemeldet', berichtVierfach.uebersprungen === 9);

  /* Gegenprobe: gleicher Starttag, aber echte Unterschiede -> beide bleiben.
     Sonst wuerde die Entdoppelung echte Einsaetze schlucken. */
  SP.zuruecksetzen();
  SPSync.cacheLeeren();
  const gleicherStart = [
    { typ: 'OE', einrichtungName: 'Haus Nord', von: '2024-05-06', bis: '2024-06-30', std: 200,
      pflichtbesuch: true, pflichtManuell: null, besuchStatus: 'offen', besuchDatum: null,
      besuchUhrzeit: null, besuchNotiz: '', sammelbesuchId: null },
    { typ: 'OE', einrichtungName: 'Haus Sued', von: '2024-05-06', bis: '2024-06-30', std: 200,
      pflichtbesuch: true, pflichtManuell: null, besuchStatus: 'offen', besuchDatum: null,
      besuchUhrzeit: null, besuchNotiz: '', sammelbesuchId: null }
  ];
  const berichtGleich = await SPSync.einsatzplanHochladen(null, AZUBI_SPID, 'Musterfrau, Erika', gleicherStart);
  p('gleicher Starttag bei verschiedener Einrichtung bleibt erhalten',
    SP.items.length === 2 && berichtGleich.uebersprungen === 0);

  /* ---------- 3. Ein geaenderter Plan raeumt wirklich auf ------------- */
  SP.zuruecksetzen();
  SPSync.cacheLeeren();
  await SPSync.einsatzplanHochladen(null, AZUBI_SPID, 'Musterfrau, Erika', planFrisch());
  SPSync.cacheLeeren();
  const gekuerzt = planFrisch().slice(0, 2);
  const bericht = await SPSync.einsatzplanHochladen(null, AZUBI_SPID, 'Musterfrau, Erika', gekuerzt);
  p('weggefallener Einsatz wird entfernt', SP.items.length === 2 && bericht.entfernt === 1);

  /* ---------- 4. Ein erfasster Besuch ueberlebt den Neu-Import -------- */
  SP.zuruecksetzen();
  SPSync.cacheLeeren();
  await SPSync.einsatzplanHochladen(null, AZUBI_SPID, 'Musterfrau, Erika', planFrisch());
  const F = SP_FELDER_EINSAETZE;
  SP.items[0].fields[F.besuchStatus] = 'durchgeführt';
  SP.items[0].fields[F.besuchDatum] = '2024-06-12T09:30:00Z';
  SPSync.cacheLeeren();
  await SPSync.einsatzplanHochladen(null, AZUBI_SPID, 'Musterfrau, Erika', planFrisch());
  const nachher = await SPSync.einsaetzeLaden();
  const derBesuchte = nachher.find(e => e.von === '2024-05-06');
  p('erfasster Besuch bleibt nach erneutem Import erhalten',
    derBesuchte && derBesuchte.besuchStatus === 'durchgeführt' && derBesuchte.besuchDatum === '2024-06-12');

  /* ---------- 5. Fremde Azubis bleiben unangetastet ------------------- */
  SP.zuruecksetzen();
  SPSync.cacheLeeren();
  await SPSync.einsatzplanHochladen(null, '18', 'Andere, Person', planFrisch());
  SPSync.cacheLeeren();
  await SPSync.einsatzplanHochladen(null, AZUBI_SPID, 'Musterfrau, Erika', planFrisch());
  p('Einsaetze eines anderen Azubis werden nicht geloescht',
    SP.items.length === 6 && SP.protokoll.del === 0);

  console.log(log.join('\n'));
  console.log('\n' + ok + '/' + (ok + fail) + ' Tests bestanden.');
  if (fail > 0) process.exit(1);
})();
