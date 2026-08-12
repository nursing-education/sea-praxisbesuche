/* Isolierte Logiktests v0.44.1 -- "Nur meine" verlor Azubis, sobald die
   "(Zahl)" am Bezugslehrer-Wert auseinanderlief.

   Hintergrund: In Azubis.Bezugslehrer steht "Nachname, Vorname (Zahl)", wobei
   die Zahl die Kapazitaet ist. Die Auswahlliste unter Einstellungen wird aus
   zwei Quellen gebaut (Azubi-Werte + Stammliste Bezugslehrende), und die
   Stammliste gewinnt -- ihre Zahl kann eine andere sein. Azubis.sichtbar()
   verglich die ROHWERTE, waehrend Dashboard/Zuordnung durchgehend ueber
   Bezugslehrer._blSchluessel() vergleichen (Name ohne Klammer). Ergebnis:
   Das Dashboard zeigte die Zuordnung, "Nur meine" nicht.

   Gemeldet am 12.08.2026 aus dem Testbetrieb. */
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
let Daten = { state: { azubis: [], bezugslehrerWert: '', ansichtModus: 'meine', lehrer: [] } };

const wrapped = new Function('SharePoint', 'Daten', bundle + '\nreturn { Azubis, Dashboard };');
const { Azubis, Dashboard } = wrapped(SharePoint, Daten);

/* Ausgangslage: zwei Azubis derselben Lehrkraft, aber mit abweichender Zahl
   am Rohwert -- genau so, wie es entsteht, wenn die Kapazitaet nach der
   Zuordnung geaendert wird. Dazu eine fremde Lehrkraft als Gegenprobe. */
Daten.state.azubis = [
  { id: '1', bezugslehrer: 'Mustermann, Max (8)' },
  { id: '2', bezugslehrer: 'Mustermann, Max' },
  { id: '3', bezugslehrer: 'Meier, Anna (10)' },
  { id: '4', bezugslehrer: '' }
];
Daten.state.ansichtModus = 'meine';
SharePoint.istAdmin = false;

/* ---------- 1. Der gemeldete Fall ------------------------------------ */
Daten.state.bezugslehrerWert = 'Mustermann, Max (10)';
const abweichendeZahl = Azubis.sichtbar();
p('sichtbar(): abweichende Kapazitaets-Zahl trennt die Zuordnung nicht',
  abweichendeZahl.length === 2 && abweichendeZahl.every(a => a.id === '1' || a.id === '2'));

/* ---------- 2. Klammer nur auf einer Seite --------------------------- */
Daten.state.bezugslehrerWert = 'Mustermann, Max';
p('sichtbar(): Auswahl ohne Klammer findet Azubi mit Klammer',
  Azubis.sichtbar().length === 2);

Daten.state.bezugslehrerWert = 'Mustermann, Max (8)';
p('sichtbar(): Auswahl mit Klammer findet Azubi ohne Klammer',
  Azubis.sichtbar().length === 2);

/* ---------- 3. Gegenprobe: darf nicht zu viel zusammenfassen --------- */
Daten.state.bezugslehrerWert = 'Meier, Anna (99)';
const nurAnna = Azubis.sichtbar();
p('sichtbar(): fremde Lehrkraft bekommt keine fremden Azubis',
  nurAnna.length === 1 && nurAnna[0].id === '3');

Daten.state.bezugslehrerWert = 'Mustermann, Maxi (8)';
p('sichtbar(): aehnlicher, aber anderer Name trifft nicht',
  Azubis.sichtbar().length === 0);

/* ---------- 4. Bestehendes Verhalten bleibt -------------------------- */
Daten.state.bezugslehrerWert = '';
p('sichtbar(): keine Auswahl -> Fallback alle', Azubis.sichtbar().length === 4);

Daten.state.bezugslehrerWert = 'MUSTERMANN, MAX (8)';
p('sichtbar(): Gross-/Kleinschreibung weiterhin egal', Azubis.sichtbar().length === 2);

Daten.state.ansichtModus = 'alle';
SharePoint.istAdmin = true;
p('sichtbar(): "alle" als Admin zeigt weiterhin alle', Azubis.sichtbar().length === 4);

SharePoint.istAdmin = false;
p('sichtbar(): "alle" ohne Admin bleibt gefiltert', Azubis.sichtbar().length === 2);

/* ---------- 5. Der Schluessel selbst --------------------------------- */
p('_blSchluessel: Klammer wird abgetrennt',
  Dashboard._blSchluessel('Mustermann, Max (8)') === Dashboard._blSchluessel('Mustermann, Max (10)'));
p('_blSchluessel: leerer Wert bleibt leer', Dashboard._blSchluessel('') === '');

console.log(log.join('\n'));
console.log('\n' + ok + '/' + (ok + fail) + ' Tests bestanden.');
if (fail > 0) process.exit(1);
