/* Logiktests v0.47 -- Dashboard.aufgaben() gegen den TATSAECHLICH aus der HTML
   extrahierten Code, plus ein paar Strukturpruefungen an der Uebersicht.

   Worum es geht: Die Uebersicht zeigt seit v0.47 nicht mehr zwei Kacheln, die
   nur weiterleiten, sondern was zu TUN ist (Spec "Navigation", Punkt 5).
   Nichts davon wird gespeichert -- alles wird bei jedem Zeichnen neu
   abgeleitet, damit Erledigtes von selbst verschwindet.

   Der heikle Teil ist der Zuschnitt der ersten Aufgabenart. Sie meint
   ausdruecklich den Einsatz, der GERADE LAEUFT und keinen Termin hat -- der
   haeufigste stille Ausfall. Ueberfaellige gehoeren NICHT hierher: Sie sind
   nicht mehr zu retten und stehen bereits als eigene Gruppe unter "Anstehend".
   Wanderte "ueberfaellig" hier hinein, fuellte sich die Uebersicht mit
   Vergangenem und das Dringende ginge darin unter. */
const fs = require('fs');
const path = require('path');
const bundle = fs.readFileSync(path.join(__dirname, 'extracted_test_bundle.js'), 'utf-8');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf-8');

const log = [];
let ok = 0, fail = 0;
function p(name, cond) {
  if (cond) { ok++; log.push('✓ ' + name); }
  else { fail++; log.push('✗ ' + name); }
}

const SharePoint = { istAdmin: false, _graphGet: async () => { throw new Error('kein Netzwerk im Test'); } };
const Daten = { state: { azubis: [], bezugslehrerWert: '', ansichtModus: 'meine' } };

const wrapped = new Function('SharePoint', 'Daten',
  bundle + '\nreturn { Azubis, Dashboard };');
const { Dashboard } = wrapped(SharePoint, Daten);

/* Gegen den alten Stand gibt es Dashboard.aufgaben() noch gar nicht. Ohne
   diesen Umweg stuerbe die Suite in der ersten Zeile ab und meldete einen
   Node-Fehler statt einer Liste roter Faelle -- die Gegenprobe waere zwar rot,
   aber nicht lesbar. */
const aufgaben = (anstehend, meldungen) =>
  (typeof Dashboard.aufgaben === 'function')
    ? Dashboard.aufgaben(anstehend, meldungen)
    : { ohneTermin: [], ohneLehrkraft: [], offeneMeldungen: [], anzahl: -1 };
/* Auch der Zugriff auf das erste Element muss den Fall ueberstehen, dass die
   Liste leer ist -- sonst bricht die Gegenprobe wieder mit einem Node-Fehler ab. */
const erster = (liste) => (liste && liste[0]) || {};

/* Ein Eintrag, wie Anstehend.sammeln() ihn liefert. */
function eintrag(o) {
  return Object.assign({
    azubiId: 'a1', idx: 0, typ: 'Ambulant', einrichtungName: 'Haus A',
    von: '2026-08-01', bis: '2026-09-30', status: 'offen', datum: null,
    uhrzeit: null, zustand: 'laeuft', gruppe: 'kein', letzteChance: false
  }, o);
}

/* ---------- 1. Zuschnitt der ersten Aufgabenart ---------------------- */
p('aufgaben() existiert', typeof Dashboard.aufgaben === 'function');

p('laufender Einsatz ohne Termin ist eine Aufgabe',
  aufgaben([eintrag({})], []).ohneTermin.length === 1);

p('ueberfaelliger Einsatz ist KEINE Aufgabe der Uebersicht',
  aufgaben([eintrag({ gruppe: 'ueberfaellig', zustand: 'ueberfaellig' })], []).ohneTermin.length === 0);

p('erst spaeter beginnender Einsatz ist noch keine Aufgabe',
  aufgaben([eintrag({ zustand: 'bald' })], []).ohneTermin.length === 0);

p('bereits geplanter Besuch ist keine Aufgabe',
  aufgaben([eintrag({ gruppe: 'diesewoche', status: 'geplant', datum: '2026-08-20' })], []).ohneTermin.length === 0);

p('vorlaeufig abgestimmter Besuch ist keine Aufgabe',
  aufgaben([eintrag({ gruppe: 'abstimmen', status: 'vorläufig' })], []).ohneTermin.length === 0);

/* ---------- 2. Reihenfolge ------------------------------------------- */
{
  const r = aufgaben([
    eintrag({ azubiId: 'spaet', bis: '2026-12-31' }),
    eintrag({ azubiId: 'frueh', bis: '2026-08-20' })
  ], []).ohneTermin;
  p('Was zuerst endet, steht oben', erster(r).azubiId === 'frueh');
}
{
  const r = aufgaben([
    eintrag({ azubiId: 'normal', bis: '2026-08-15' }),
    eintrag({ azubiId: 'letzte', bis: '2026-12-31', letzteChance: true })
  ], []).ohneTermin;
  /* "Letzte Chance" schlaegt das Datum: Bei diesem Pflichttyp gibt es keinen
     weiteren Einsatz, in dem der Besuch nachgeholt werden koennte. */
  p('"Letzte Chance" steht vor dem frueheren Enddatum', erster(r).azubiId === 'letzte');
}

/* ---------- 3. Rolle: was Nicht-Admins gar nicht erst sehen ----------
   Eine Aufgabe, die man nicht erledigen kann, ist keine Aufgabe. Zuordnen und
   Abhaken koennen nur Admins. */
Daten.state.azubis = [
  { id: 'x', bezugslehrer: '' },
  { id: 'y', bezugslehrer: '   ' },
  { id: 'z', bezugslehrer: 'Meier, Anna (10)' }
];
const meldungen = [
  { id: 'm1', erledigt: false, erstellt: '2026-08-10' },
  { id: 'm2', erledigt: true, erstellt: '2026-08-12' },
  { id: 'm3', erledigt: false, erstellt: '2026-08-11' }
];

SharePoint.istAdmin = false;
{
  const r = aufgaben([], meldungen);
  p('Nicht-Admin: keine Zuordnungs-Aufgabe', r.ohneLehrkraft.length === 0);
  p('Nicht-Admin: keine Rueckmeldungs-Aufgabe', r.offeneMeldungen.length === 0);
  p('Nicht-Admin: Anzahl zaehlt nur die eigenen Aufgaben', r.anzahl === 0);
}

SharePoint.istAdmin = true;
{
  const r = aufgaben([eintrag({})], meldungen);
  p('Admin: Azubis ohne Bezugslehrkraft werden gezaehlt', r.ohneLehrkraft.length === 2);
  p('Admin: nur leere Zuordnung zaehlt, nicht die belegte',
    r.ohneLehrkraft.every(a => a.id !== 'z'));
  p('Admin: nur OFFENE Rueckmeldungen sind Aufgaben', r.offeneMeldungen.length === 2);
  p('Admin: erledigte Rueckmeldung ist keine Aufgabe mehr',
    r.offeneMeldungen.every(m => m.id !== 'm2'));
  p('Admin: neueste offene Meldung zuerst', erster(r.offeneMeldungen).id === 'm3');
  p('Anzahl ist die Summe aller drei Arten', r.anzahl === 1 + 2 + 2);
}

/* ---------- 4. Robustheit -------------------------------------------
   viewStart() ruft die Funktion beim allerersten Start auf, wenn noch gar
   nichts geladen ist. Ein Absturz waere dort eine weisse Seite. */
SharePoint.istAdmin = false;
Daten.state.azubis = [];
{
  let heil = true;
  try { aufgaben(undefined, undefined); } catch (e) { heil = false; }
  p('Ohne jede Eingabe kein Absturz', heil);
  p('Ohne jede Eingabe: nichts offen', aufgaben(undefined, undefined).anzahl === 0);
}
{
  /* Die Aufrufer teilen sich state -- sortiert werden darf nur auf einer Kopie. */
  const roh = [eintrag({ azubiId: 'b', bis: '2026-12-31' }), eintrag({ azubiId: 'a', bis: '2026-08-01' })];
  aufgaben(roh, []);
  p('Die uebergebene Liste wird nicht umsortiert', roh[0].azubiId === 'b');
}

/* ---------- 5. Struktur der Uebersicht ------------------------------- */
const vsAuf = html.indexOf('viewStart(){');
const vsEnde = html.indexOf('viewDashboard(){');
const viewStart = vsAuf > -1 ? html.slice(vsAuf, vsEnde) : '';
p('viewStart() leitet nicht mehr nur weiter (Kacheln sind weg)',
  viewStart.length > 0 && !/start-kacheln/.test(viewStart));
p('viewStart() baut die Aufgabenliste', /Dashboard\.aufgaben\(/.test(viewStart));
p('viewStart() nimmt die SharePoint-Liste, nicht die eigenen Meldungen',
  /Daten\.state\.rueckmeldungen/.test(viewStart) && !/Daten\.state\.meldungen/.test(viewStart));
p('Leerer Zustand nennt, was geprueft wurde', /Nichts offen/.test(viewStart));
/* Der Termin-Fall muss DIREKT den Besuch-Dialog oeffnen. Ein Sprung in den
   Reiter "Anstehend" hiesse, die Zeile dort noch einmal zu suchen. */
p('Termin-Aufgabe oeffnet direkt den Besuch-Dialog',
  /dataset\.aufg==="termin"[\s\S]{0,80}besuchFormular\(/.test(html));
p('Aufgaben-Zeilen sind Knoepfe, keine Anzeigen',
  /<button class="aufg/.test(viewStart));

/* Der Besuch-Dialog nannte den Azubi nirgends -- solange man ihn nur von einer
   Karte aus oeffnete, auf der der Name stand, fiel das nicht auf. Seit die
   Uebersicht direkt hierher springt, ist diese Karte weg. */
const bfAuf = html.indexOf('besuchFormular(id,idx){');
const bfEnde = html.indexOf('modal-aktionen', bfAuf);
const besuchFormular = bfAuf > -1 ? html.slice(bfAuf, bfEnde) : '';
p('Der Besuch-Dialog nennt den Azubi', /Azubis\.name\(id\)/.test(besuchFormular));

console.log(log.join('\n'));
console.log('\n' + ok + '/' + (ok + fail) + ' Tests bestanden.');
if (fail > 0) process.exit(1);
