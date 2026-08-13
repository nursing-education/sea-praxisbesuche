/* Logiktests v0.48 -- Azubis.suchen() gegen den TATSAECHLICH aus der HTML
   extrahierten Code, plus Strukturpruefungen an der Azubi-Detailseite.

   Worum es geht: Die Suche ist kein Selbstzweck, sondern der WEG zur
   Detailseite (Spec "Navigation", Punkt 9). Der Bedarf, der beide begruendet
   hat, lautete woertlich: "einen spezifischen Schueler ... gucken, hat der
   schon Einsaetze hinter sich, WO und so weiter." Deshalb muss auch der
   Einrichtungsname gefunden werden, nicht nur der Name des Azubis.

   Die Mehrwort-Suche ist der Grund, warum der nie begruendete Kursfilter
   entbehrlich ist: Der Kursname ist ein Suchwort wie jedes andere. */
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
const Daten = {
  state: {
    azubis: [], bezugslehrerWert: '', ansichtModus: 'meine',
    azubiNamen: { a1: 'Probst, Petra', a2: 'Quast, Quirin', a3: 'Rueb, Rosa' }
  }
};

const wrapped = new Function('SharePoint', 'Daten', bundle + '\nreturn { Azubis, Dashboard };');
const { Azubis } = wrapped(SharePoint, Daten);

/* Gegen den alten Stand gibt es Azubis.suchen() noch nicht -- ohne diesen Umweg
   stuerbe die Suite in der ersten Zeile ab statt rote Faelle zu melden. */
const suchen = (text, liste) =>
  (typeof Azubis.suchen === 'function') ? Azubis.suchen(text, liste) : [];

const LISTE = [
  { id: 'a1', kuerzel: 'PP', kurs: 'PFK 041', ausbildung: 'PFK', stammeinrichtung: 'Traegerhaus Nord',
    bezugslehrer: 'Testlehrer, Tim (10)',
    einsaetze: [{ typ: 'Ambulant', einrichtungName: 'Musterhaus Nord' }] },
  { id: 'a2', kuerzel: 'QQ', kurs: 'PFK 041', ausbildung: 'PFK', stammeinrichtung: 'Traegerhaus Sued',
    bezugslehrer: 'Andere, Anna (8)',
    einsaetze: [{ typ: 'Stationär', einrichtungName: 'Musterhaus Sued' }] },
  { id: 'a3', kuerzel: 'RR', kurs: 'PFA 012', ausbildung: 'PFA', stammeinrichtung: 'Traegerhaus Nord',
    bezugslehrer: '', einsaetze: [] }
];
const ids = r => r.map(a => a.id).join(',');

/* ---------- 1. Grundverhalten ---------------------------------------- */
p('suchen() existiert', typeof Azubis.suchen === 'function');
p('Leere Suche liefert alles', ids(suchen('', LISTE)) === 'a1,a2,a3');
p('Nur Leerzeichen liefert alles', ids(suchen('   ', LISTE)) === 'a1,a2,a3');
p('null liefert alles', ids(suchen(null, LISTE)) === 'a1,a2,a3');

/* ---------- 2. Wonach gesucht werden kann ---------------------------- */
p('Nach Name', ids(suchen('probst', LISTE)) === 'a1');
p('Nach Kuerzel', ids(suchen('qq', LISTE)) === 'a2');
p('Nach Kurs', ids(suchen('PFK 041', LISTE)) === 'a1,a2');
p('Nach Ausbildung', ids(suchen('pfa', LISTE)) === 'a3');
p('Nach Traegerhaus', ids(suchen('traegerhaus nord', LISTE)) === 'a1,a3');
/* Das "wo" aus Christians Bedarf: die Einrichtung des Einsatzes. */
p('Nach Einsatz-Einrichtung', ids(suchen('musterhaus sued', LISTE)) === 'a2');
p('Nach Einsatzart', ids(suchen('ambulant', LISTE)) === 'a1');
p('Nach Bezugslehrkraft', ids(suchen('testlehrer', LISTE)) === 'a1');

/* ---------- 3. Wie gesucht wird -------------------------------------- */
p('Gross-/Kleinschreibung egal', ids(suchen('PROBST', LISTE)) === 'a1');
/* Mehrere Woerter werden UND-verknuepft, nicht als eine Zeichenkette gesucht:
   sonst faende "petra ambulant" nichts, weil die beiden Angaben aus
   verschiedenen Feldern stammen. */
p('Mehrere Woerter werden UND-verknuepft', ids(suchen('petra ambulant', LISTE)) === 'a1');
p('Widerspruechliche Woerter finden nichts', ids(suchen('petra stationär', LISTE)) === '');
p('Kein Treffer -> leere Liste', ids(suchen('gibtesnicht', LISTE)) === '');
p('Azubi ohne Einsaetze stuerzt nicht ab', ids(suchen('rueb', LISTE)) === 'a3');

/* ---------- 4. Die uebergebene Liste bleibt unberuehrt --------------- */
{
  const kopie = LISTE.slice();
  suchen('probst', LISTE);
  p('Die uebergebene Liste wird nicht veraendert',
    LISTE.length === 3 && LISTE[0] === kopie[0] && LISTE[2] === kopie[2]);
}

/* ---------- 5. Struktur der Detailseite ------------------------------ */
p('Die Ansicht kennt einen offenen Azubi', /azubiOffen:null/.test(html));
p('Ein offener Azubi ersetzt die Liste',
  /if\(this\.azubiOffen\) return this\.viewAzubiSeite\(this\.azubiOffen\)/.test(html));

const vsAuf = html.indexOf('viewAzubiSeite(id){');
const vsEnde = html.indexOf('azubiOeffnen(id){');
const seite = vsAuf > -1 ? html.slice(vsAuf, vsEnde) : '';
/* Die Spec verlangt fuer die Detailseite ausdruecklich fuenf Dinge an einem
   Ort. Traegerhaus und Bezugslehrkraft fehlten der alten Seitenspalte. */
/* Die Bezugslehrkraft steht in der Kopfzeile, die azubiDetail() zeichnet --
   im Rumpf stuende sie ueber dem Namen des Azubis. */
const adAuf = html.indexOf('azubiDetail(id){');
const adBlock = adAuf > -1 ? html.slice(adAuf, adAuf + 6000) : '';
p('Die Seite nennt die Bezugslehrkraft', /Bezugslehrkraft/.test(adBlock));
p('Der Name des Azubis wird nicht versalisiert',
  /<h2 class="azubi-name">/.test(adBlock) &&
  /\.spalte h2\.azubi-name\{[^}]*text-transform:none/.test(html));
p('Die Seite hat einen Rueckweg', /azubiZurueck/.test(seite));
p('Geloeschter Azubi endet nicht in einer leeren Seite ohne Rueckweg',
  /nicht mehr in der Liste/.test(seite));
p('Die Tabelle wird nicht zweimal gebaut',
  /<div id="azubiDetail"><\/div>/.test(seite));
p('render() fuellt die Seite ueber die bestehende Funktion',
  /this\.tab==="azubis" && this\.azubiOffen\) this\.azubiDetail\(this\.azubiOffen\)/.test(html));

/* Ein Reiterklick muss auf die Liste fuehren. Bliebe die Seite offen, saehe
   der Knopf "Azubis" funktionslos aus. */
const twAuf = html.indexOf('tabWechseln(t){');
const twEnde = html.indexOf('standAnzeigen(){');
const tabWechseln = twAuf > -1 ? html.slice(twAuf, twEnde) : '';
p('Ein Reiterwechsel schliesst die offene Azubi-Seite',
  /this\.azubiOffen=null/.test(tabWechseln));

p('Ein Klick in der Liste oeffnet die Seite',
  /data-azubi\]"\)\.forEach\(z=> z\.onclick=\(\)=>this\.azubiOeffnen/.test(html));
p('Die Suche ist ein Feld ueber der Liste', /id="azubiSuche"/.test(html));
/* Neuzeichnen bei jedem Zeichen kostet den Fokus -- ohne Wiederherstellung
   waere Weitertippen unmoeglich. */
p('Die Suche behaelt Fokus und Schreibmarke',
  /setSelectionRange\(pos,pos\)/.test(html));
p('Die Suche filtert die schon sichtbaren Azubis, nicht alle',
  /Azubis\.suchen\(this\.azubiSuche, sichtbar\)/.test(html));

console.log(log.join('\n'));
console.log('\n' + ok + '/' + (ok + fail) + ' Tests bestanden.');
if (fail > 0) process.exit(1);
