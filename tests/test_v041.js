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

const vor = Dashboard.vertretungVorschau(azubis2, namen2, abele, 'Berg, Bea (2)', zeilen2);
p('vorschau: zaehlt die Azubis der abgebenden Lehrkraft',
  vor.anzahl === 3);
p('vorschau: nennt Namen, nicht nur eine Zahl',
  vor.azubis.map(x => x.name).sort().join(',') === 'Klein, K.,Roth, R.,Weber, W.');
p('vorschau: meldet die Ueberbuchung bei der Vertretung',
  vor.ist === 3 && vor.soll === 2 && vor.ueberbucht === true);

const vorOhneKap = Dashboard.vertretungVorschau(azubis2, namen2, abele, 'Curt, Cara', zeilen2);
p('vorschau: ohne hinterlegte Kapazitaet keine Ueberbuchungs-Aussage',
  vorOhneKap.soll === null && vorOhneKap.ueberbucht === false);

const vorLeer = Dashboard.vertretungVorschau(azubis2, namen2, 'Egli, Eva (12)', 'Berg, Bea (2)', zeilen2);
p('vorschau: Abwesenheit ohne Azubis ist gueltig',
  vorLeer.anzahl === 0 && vorLeer.azubis.length === 0);

/* Der Befund, der den urspruenglichen Entwurf verworfen hat: Weber hat zwar
   vorheriger=Abele, liegt aber inzwischen bei Curt -- eine bewusste Abgabe.
   "Ist zurueck" darf ihn nicht stumm zurueckziehen. */
const rueckAzubis = [
  { id: 'a1', bezugslehrer: 'Berg, Bea (2)',  vorherigerBezugslehrer: 'Abele, Anna (12)' },
  { id: 'a2', bezugslehrer: 'Berg, Bea (2)',  vorherigerBezugslehrer: 'Abele, Anna (12)' },
  { id: 'a3', bezugslehrer: 'Curt, Cara',     vorherigerBezugslehrer: 'Abele, Anna (12)' },
  { id: 'a4', bezugslehrer: 'Berg, Bea (2)',  vorherigerBezugslehrer: 'Zeta, Zoe (3)' }
];
const zeileAbwesend = { wert: abele, name: 'Abele, Anna', abwesend: true, vertretungDurch: 'Berg, Bea (2)' };
const rueck = Dashboard.rueckschubKandidaten(rueckAzubis, namen2, zeileAbwesend);

p('rueckschub: holt nur, wer bei der Vertretung liegt und von ihr kam',
  rueck.zurueck.map(x => x.id).sort().join(',') === 'a1,a2');
p('rueckschub: wer inzwischen woanders liegt, steht unter "anderswo"',
  rueck.anderswo.map(x => x.id).join(',') === 'a3');
p('rueckschub: wer nie von ihr kam, taucht nirgends auf',
  rueck.zurueck.concat(rueck.anderswo).every(x => x.id !== 'a4'));
p('rueckschub: liefert Namen mit',
  rueck.zurueck.map(x => x.name).sort().join(',') === 'Klein, K.,Roth, R.');

/* Ohne Vertretungseintrag gibt es keinen Bezugspunkt: "anderswo" waere dann
   eine Behauptung ueber Abgaben, von denen niemand weiss, ob sie je eine
   Vertretung waren. Beide Listen bleiben leer. */
const ohneVertretung = Dashboard.rueckschubKandidaten(rueckAzubis, namen2,
  { wert: abele, name: 'Abele, Anna', abwesend: true, vertretungDurch: '' });
p('rueckschub: ohne Vertretungseintrag bleiben beide Listen leer',
  ohneVertretung.zurueck.length === 0 && ohneVertretung.anderswo.length === 0);

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

console.log(log.join('\n'));
console.log('\n' + ok + '/' + (ok + fail) + ' Tests bestanden.');
process.exit(fail ? 1 : 0);
})();
