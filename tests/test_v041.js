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

console.log(log.join('\n'));
console.log('\n' + ok + '/' + (ok + fail) + ' Tests bestanden.');
process.exit(fail ? 1 : 0);
})();
