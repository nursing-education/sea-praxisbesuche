/* Isolierte Logiktests v0.41 – Vertretung bei längerer Abwesenheit.
   Dialoge, Status-Pille und das Dimmen der Zeile sind Browser-Sache und stehen
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
  bundle + '\nreturn { SPSync, Azubis, Dashboard, Bezugslehrer, SP_FELDER_BEZUGSLEHRER, bezugslehrerAnzeige };');
const { SPSync, Dashboard, Bezugslehrer } =
  wrapped(SharePoint, Daten, Einrichtungen, Oberflaeche, pflichtbesucheMarkieren);

(async () => {

/* ---------- 1. Abwesend wirkt auf Zeile und Filter ---------------------- */
/* Aufbau: Abele ist abwesend und hat KEINE Azubis -- damit steht sie mit
   ist:0 / soll:10 / frei:10 da und waere ohne die neue Bedingung der beste
   Treffer im Filter "Freie Kapazitaet". Genau das ist der Fehler, den die
   Scheibe behebt: vorgeschlagen wuerde die Lehrkraft, die gerade ausfaellt.
   Berg vertritt sie und hat einen Azubi. Curt ist archiviert UND abwesend --
   die beiden Zustaende sind unabhaengig und duerfen sich nicht vermischen. */
Daten.state.lehrer = [
  { spId: '1', name: 'Abele, Anna', kapazitaet: 10, aktiv: true,  abwesend: true,  vertretungDurch: 'Berg, Bea (10)' },
  { spId: '2', name: 'Berg, Bea',   kapazitaet: 10, aktiv: true,  abwesend: false, vertretungDurch: '' },
  { spId: '3', name: 'Curt, Cara',  kapazitaet: 10, aktiv: false, abwesend: true,  vertretungDurch: '' }
];
const azubis = [
  { id: '1', bezugslehrer: 'Berg, Bea (10)' },
  /* nicht in der Stammliste -> inListe:false */
  { id: '2', bezugslehrer: 'Textlehrer, Tim (5)' }
];
const zeilen = Dashboard.lehrkraftZeilen(azubis);
const z = n => zeilen.find(x => x.name === n);
const namen = liste => liste.map(x => x.name).sort().join(',');

p('zeile: abwesend steht an der Zeile',
  z('Abele, Anna').abwesend === true && z('Berg, Bea').abwesend === false);
p('zeile: vertretungDurch steht an der Zeile',
  z('Abele, Anna').vertretungDurch === 'Berg, Bea (10)' && z('Berg, Bea').vertretungDurch === '');
p('zeile: Nur-Text-Lehrkraft gilt als anwesend',
  z('Textlehrer, Tim').inListe === false && z('Textlehrer, Tim').abwesend === false);

/* Kern der Scheibe: die eine Bedingung im Filter "Freie Kapazitaet". */
/* Tim steht bewusst mit drin: Er ist nur Text, hat aber ueber die "(5)" ein Soll
   und ist anwesend -- er gehoert in den Filter. Abele faellt als Einzige heraus. */
p('filter: abwesende Lehrkraft faellt aus "frei" heraus',
  namen(Dashboard.lehrkraftFiltern(zeilen, { modus: 'frei' })) === 'Berg, Bea,Textlehrer, Tim');
p('filter: dieselbe bleibt in "alle" sichtbar',
  namen(Dashboard.lehrkraftFiltern(zeilen, { modus: 'alle' })).indexOf('Abele, Anna') >= 0);
p('filter: dieselbe wird weiterhin ueber die Suche gefunden',
  namen(Dashboard.lehrkraftFiltern(zeilen, { modus: 'alle', suche: 'abele' })) === 'Abele, Anna');
p('filter: archiviert und abwesend beissen sich nicht',
  namen(Dashboard.lehrkraftFiltern(zeilen, { modus: 'archiviert' })) === 'Curt, Cara'
  && namen(Dashboard.lehrkraftFiltern(zeilen, { modus: 'alle' })).indexOf('Curt, Cara') < 0);

/* ---------- 2. Vertretungs-Logik --------------------------------------- */
/* Berg bekommt bewusst nur Kapazitaet 2: die drei Azubis von Abele ueberbuchen
   sie, und genau das soll die Vorschau sagen statt es zu verschlucken.
   Curt hat gar keine Kapazitaet hinterlegt -- dort ist "ueberbucht" keine
   Aussage, die man treffen kann. */
Daten.state.lehrer = [
  { spId: '1', name: 'Abele, Anna', kapazitaet: 12,   aktiv: true,  abwesend: false, vertretungDurch: '' },
  { spId: '2', name: 'Berg, Bea',   kapazitaet: 2,    aktiv: true,  abwesend: false, vertretungDurch: '' },
  { spId: '3', name: 'Curt, Cara',  kapazitaet: null, aktiv: true,  abwesend: false, vertretungDurch: '' },
  { spId: '4', name: 'Dorn, Dirk',  kapazitaet: 12,   aktiv: false, abwesend: false, vertretungDurch: '' },
  { spId: '5', name: 'Egli, Eva',   kapazitaet: 12,   aktiv: true,  abwesend: true,  vertretungDurch: '' }
];
const azubis2 = [
  { id: 'a1', bezugslehrer: 'Abele, Anna (12)' },
  { id: 'a2', bezugslehrer: 'Abele, Anna (12)' },
  { id: 'a3', bezugslehrer: 'Abele, Anna (12)' },
  { id: 'a9', bezugslehrer: 'Textlehrer, Tim (5)' }
];
const namen2 = { a1: 'Klein, K.', a2: 'Roth, R.', a3: 'Weber, W.', a9: 'Tim, T.' };
const zeilen2 = Dashboard.lehrkraftZeilen(azubis2);
const abele = 'Abele, Anna (12)';

const kand = Dashboard.vertretungKandidaten(zeilen2, abele);
p('kandidaten: sie selbst ist nicht dabei',
  kand.every(x => x.name !== 'Abele, Anna'));
p('kandidaten: Archivierte und bereits Abwesende sind draussen',
  kand.every(x => x.name !== 'Dorn, Dirk' && x.name !== 'Egli, Eva'));
p('kandidaten: Nur-Text-Lehrkraft ist draussen',
  kand.every(x => x.name !== 'Textlehrer, Tim'));
p('kandidaten: es bleiben genau die zwei moeglichen',
  namen(kand) === 'Berg, Bea,Curt, Cara');

/* v0.41.1: Die Azubis gehen nach "Ohne Zuordnung", nicht an die Vertretung.
   Damit gibt es kein Ziel mehr, das ueberbucht werden koennte -- die Vorschau
   zaehlt nur noch, wen es betrifft. */
const vor = Dashboard.abwesenheitVorschau(azubis2, namen2, abele);
p('vorschau: zaehlt die Azubis der abwesenden Lehrkraft',
  vor.anzahl === 3);
p('vorschau: nennt Namen, nicht nur eine Zahl',
  vor.azubis.map(x => x.name).sort().join(',') === 'Klein, K.,Roth, R.,Weber, W.');
p('vorschau: keine Kapazitaetsaussage mehr -- die Ablage hat kein Soll',
  vor.soll === undefined && vor.ueberbucht === undefined);

const vorLeer = Dashboard.abwesenheitVorschau(azubis2, namen2, 'Egli, Eva (12)');
p('vorschau: Abwesenheit ohne Azubis ist gueltig',
  vorLeer.anzahl === 0 && vorLeer.azubis.length === 0);

p('vorschau: ohne Lehrkraft-Wert bleibt sie leer statt alle zu greifen',
  Dashboard.abwesenheitVorschau(azubis2, namen2, '').anzahl === 0);

/* v0.41.1: ParkendBei traegt die Rueckholung. Christians Entscheidung: zurueck
   kommt JEDER, der auf Abele wartet -- ungeordnet (a1), bei einer dritten
   Lehrkraft (a3) oder bei der vermerkten Vertretung (a2). Genau das war mit
   vorherigerBezugslehrer nicht moeglich: der wird beim Weitergeben ueberschrieben,
   a3 haette danach "Berg" als Vorgaenger und waere unauffindbar gewesen. */
const rueckAzubis = [
  { id: 'a1', bezugslehrer: '',               parkendBei: 'Abele, Anna (12)', vorherigerBezugslehrer: 'Abele, Anna (12)' },
  { id: 'a2', bezugslehrer: 'Berg, Bea (2)',  parkendBei: 'Abele, Anna (12)', vorherigerBezugslehrer: 'Berg, Bea (2)' },
  { id: 'a3', bezugslehrer: 'Curt, Cara',     parkendBei: 'Abele, Anna (12)', vorherigerBezugslehrer: '' },
  { id: 'a4', bezugslehrer: 'Berg, Bea (2)',  parkendBei: '',                 vorherigerBezugslehrer: 'Zeta, Zoe (3)' }
];
const zeileAbwesend = { wert: abele, name: 'Abele, Anna', abwesend: true, vertretungDurch: 'Berg, Bea (2)' };
const rueck = Dashboard.rueckschubKandidaten(rueckAzubis, namen2, zeileAbwesend);

p('rueckschub: holt alle, die auf sie warten -- egal wo sie liegen',
  rueck.zurueck.map(x => x.id).sort().join(',') === 'a1,a2,a3');
p('rueckschub: wer nicht auf sie wartet, bleibt aussen vor',
  rueck.zurueck.every(x => x.id !== 'a4'));
p('rueckschub: liefert Namen mit',
  rueck.zurueck.map(x => x.name).sort().join(',') === 'Klein, K.,Roth, R.,Weber, W.');
/* "bei" traegt den Dialogtext "derzeit bei X" -- ein Rueckholen von einer
   dritten Lehrkraft darf nicht unbemerkt passieren. */
p('rueckschub: nennt den aktuellen Aufenthaltsort, ohne "(Zahl)"',
  rueck.zurueck.find(x => x.id === 'a3').bei === 'Curt, Cara'
  && rueck.zurueck.find(x => x.id === 'a2').bei === 'Berg, Bea');
p('rueckschub: geparkt ohne Zuordnung hat keinen Aufenthaltsort',
  rueck.zurueck.find(x => x.id === 'a1').bei === '');

/* Altbestand aus v0.41.0: dort gibt es kein ParkendBei. Die Azubis einer noch
   laufenden Abwesenheit muessen trotzdem auffindbar bleiben -- ueber den
   Vorgaenger, solange sie ungeordnet liegen oder bei der Vertretung. */
const altAzubis = [
  { id: 'a1', bezugslehrer: '',              parkendBei: '', vorherigerBezugslehrer: 'Abele, Anna (12)' },
  { id: 'a2', bezugslehrer: 'Berg, Bea (2)', parkendBei: '', vorherigerBezugslehrer: 'Abele, Anna (12)' },
  { id: 'a3', bezugslehrer: 'Curt, Cara',    parkendBei: '', vorherigerBezugslehrer: 'Abele, Anna (12)' }
];
const alt = Dashboard.rueckschubKandidaten(altAzubis, namen2, zeileAbwesend);
p('rueckschub: Altbestand ohne ParkendBei greift auf den Vorgaenger zurueck',
  alt.zurueck.map(x => x.id).sort().join(',') === 'a1,a2');
p('rueckschub: im Altbestand bleibt die bewusste Abgabe an Dritte liegen',
  alt.zurueck.every(x => x.id !== 'a3'));

p('rueckschub: ohne Zeile bleibt die Liste leer',
  Dashboard.rueckschubKandidaten(rueckAzubis, namen2, null).zurueck.length === 0);

p('meldung: vollstaendig nennt nur das Ergebnis',
  Dashboard.gruppenMeldung(12, 0, 'bei Schulz') === '12 Azubis bei Schulz');
p('meldung: teilweise nennt beide Zahlen',
  Dashboard.gruppenMeldung(9, 3, 'bei Schulz') === '9 von 12 übertragen, 3 werden nachgereicht');
p('meldung: komplett gescheitert behauptet keinen Erfolg',
  /^Kein/.test(Dashboard.gruppenMeldung(0, 12, 'bei Schulz'))
  && Dashboard.gruppenMeldung(0, 12, 'bei Schulz').indexOf('12') >= 0);
p('meldung: ein einzelner Azubi wird nicht gemehrzahlt',
  Dashboard.gruppenMeldung(1, 0, 'bei Schulz') === '1 Azubi bei Schulz');

/* ---------- 3. Lokale Uebernahme und Pillen-Text ----------------------- */
/* SPSync.lehrerAendern PATCHt die beiden Felder korrekt (Aufgabe 1), aber
   Bezugslehrer.aendern schrieb sie nicht in den lokalen State zurueck -- die
   Zeile haette bis zum naechsten Sync unveraendert dagestanden. */
Daten.state.lehrer = [
  { spId: '7', name: 'Abele, Anna', stellenumfang: 100, kapazitaet: 12, aktiv: true, abwesend: false, vertretungDurch: '' }
];
const gemerkt = Daten.state.lehrer[0];
SPSync.lehrerAendern = async () => {};

await Bezugslehrer.aendern('7', { abwesend: true, vertretungDurch: 'Berg, Bea (2)' });
p('aendern: abwesend kommt lokal an',
  gemerkt.abwesend === true);
p('aendern: vertretungDurch kommt lokal an',
  gemerkt.vertretungDurch === 'Berg, Bea (2)');
p('aendern: Teil-Update laesst die Nachbarfelder stehen',
  gemerkt.kapazitaet === 12 && gemerkt.stellenumfang === 100 && gemerkt.aktiv === true);

await Bezugslehrer.aendern('7', { abwesend: false, vertretungDurch: '' });
p('aendern: das Leeren kommt lokal an -- sonst bliebe eine beendete Vertretung stehen',
  gemerkt.abwesend === false && gemerkt.vertretungDurch === '');

/* Der Pillen-Text gehoert nach Dashboard, nicht in die Oberflaeche: die Regel
   "ohne (Zahl)" und der Fall ohne Vertretung sind pruefbar, das Markup nicht. */
p('pille: nennt die Vertretung ohne die "(Zahl)"',
  Dashboard.abwesenheitsText({ abwesend: true, vertretungDurch: 'Berg, Bea (2)' })
    === 'abwesend · vertreten durch Berg, Bea');
p('pille: ohne Vertretung nur "abwesend"',
  Dashboard.abwesenheitsText({ abwesend: true, vertretungDurch: '' }) === 'abwesend');
p('pille: wer da ist, bekommt keinen Text',
  Dashboard.abwesenheitsText({ abwesend: false, vertretungDurch: 'Berg, Bea (2)' }) === '');

/* ---------- 4. Menuepunkte der Lehrkraft-Zeile ------------------------- */
const mp = z => Dashboard.lehrkraftAktionen(z).map(x => x.id).join(',');
const da       = { inListe: true,  aktiv: true,  abwesend: false };
const weg      = { inListe: true,  aktiv: true,  abwesend: true  };
const archiv   = { inListe: true,  aktiv: false, abwesend: false };
const nurText  = { inListe: false, aktiv: true,  abwesend: false };

p('menue: wer da ist, kann abwesend gemeldet werden',
  mp(da).indexOf('abwesend') >= 0 && mp(da).indexOf('zurueck') < 0);
p('menue: wer abwesend ist, kann zurueckgemeldet werden',
  mp(weg).indexOf('zurueck') >= 0 && mp(weg).indexOf('abwesend') < 0);
p('menue: eine archivierte Lehrkraft bekommt keinen der beiden Punkte',
  mp(archiv).indexOf('abwesend') < 0 && mp(archiv).indexOf('zurueck') < 0);
p('menue: die bestehenden Punkte bleiben erhalten',
  mp(da).indexOf('edit') >= 0 && mp(da).indexOf('archiv') >= 0 && mp(da).indexOf('del') >= 0);
p('menue: Nur-Text-Lehrkraft hat weiterhin gar kein Menue',
  Dashboard.lehrkraftAktionen(nurText).length === 0);
p('menue: Loeschen bleibt der letzte Punkt',
  Dashboard.lehrkraftAktionen(weg).slice(-1)[0].id === 'del');

/* ---------- 5. v0.41.1: der Park-Marker auf den Kacheln ---------------- */
/* Der Marker ist das, was Christian verlangt hat: an der Kachel muss stehen,
   dass dieser Azubi zu einer abwesenden Lehrkraft zurueckgehoert. Er kommt aus
   ParkendBei -- gespeichert, nicht abgeleitet, damit er ein Weitergeben
   uebersteht und nach F5 noch da ist. */
const markerAzubis = [
  { id: 'm1', kuerzel: 'Eins',  bezugslehrer: '', kurs: 'PFK 1', stammeinrichtung: 'Haus A',
    parkendBei: 'Abele, Anna (12)', vorherigerBezugslehrer: 'Abele, Anna (12)' },
  { id: 'm2', kuerzel: 'Zwei',  bezugslehrer: '', kurs: 'PFK 1', stammeinrichtung: 'Haus A',
    parkendBei: '', vorherigerBezugslehrer: 'Berg, Bea (2)' },
  { id: 'm3', kuerzel: 'Drei',  bezugslehrer: '', kurs: 'PFK 1', stammeinrichtung: 'Haus A',
    parkendBei: '', vorherigerBezugslehrer: '' },
  { id: 'm4', kuerzel: 'Vier',  bezugslehrer: 'Curt, Cara', kurs: 'PFK 1', stammeinrichtung: 'Haus A',
    parkendBei: 'Abele, Anna (12)', vorherigerBezugslehrer: '' }
];
const markerNamen = { m1: 'Eins, E.', m2: 'Zwei, Z.', m3: 'Drei, D.', m4: 'Vier, V.' };
const spalte = Dashboard.offeneAzubis(markerAzubis, markerNamen, { sortierung: 'name' });
const sp = id => spalte.find(x => x.id === id);

p('marker: geparkter Azubi nennt die abwesende Lehrkraft ohne "(Zahl)"',
  sp('m1').wartetAuf === 'Abele, Anna');
p('marker: wer nur einen Vorgaenger hat, wartet auf niemanden',
  sp('m2').wartetAuf === '' && sp('m2').vorher === 'Berg, Bea');
p('marker: frisch importiert hat weder Marker noch Vorgaenger',
  sp('m3').wartetAuf === '' && sp('m3').vorher === '');
p('marker: zugeordnete Azubis stehen weiterhin nicht in der Spalte',
  spalte.every(x => x.id !== 'm4'));

/* Der Fall, der die neue Spalte ueberhaupt noetig gemacht hat: waehrend der
   Abwesenheit weitergegeben. Die Kachel liegt jetzt in Curts Gruppe und muss
   den Marker trotzdem zeigen -- sonst waere unsichtbar, dass sie zurueckgeht. */
const gruppen = Dashboard.azubisJeLehrkraft(markerAzubis, markerNamen, {});
p('marker: gilt auch in der Gruppe einer dritten Lehrkraft',
  gruppen.get('Curt, Cara')[0].wartetAuf === 'Abele, Anna');

/* ---------- 6. v0.41.1: Park-Marke schreiben --------------------------- */
/* parkmarkeSetzen muss OHNE Zuordnungswechsel schreiben -- gebraucht fuer den
   bei "Ist zurueck" abgewaehlten Azubi. bezugslehrerUmhaengen taugt dafuer
   nicht: es schreibt nichts, wenn die Zuordnung gleich bleibt. */
const { Azubis } = wrapped(SharePoint, Daten, Einrichtungen, Oberflaeche, pflichtbesucheMarkieren);
Daten.state.azubis = [
  { id: 'p1', kuerzel: 'Park', bezugslehrer: 'Curt, Cara', parkendBei: 'Abele, Anna (12)',
    vorherigerBezugslehrer: '', einsaetze: [] }
];
const geparkt = Daten.state.azubis[0];

await Azubis.parkmarkeSetzen('p1', '');
p('parkmarke: das Loeschen kommt an, ohne die Zuordnung anzufassen',
  geparkt.parkendBei === '' && geparkt.bezugslehrer === 'Curt, Cara');
p('parkmarke: der Vorgaenger bleibt unberuehrt -- sie ist ein eigenes Gedaechtnis',
  geparkt.vorherigerBezugslehrer === '');

await Azubis.parkmarkeSetzen('p1', 'Egli, Eva (12)');
p('parkmarke: das Setzen kommt an',
  geparkt.parkendBei === 'Egli, Eva (12)');

console.log(log.join('\n'));
console.log('\n' + ok + '/' + (ok + fail) + ' Tests bestanden.');
process.exit(fail ? 1 : 0);
})();
