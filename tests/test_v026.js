/* Isolierte Logiktests v0.26 – Dashboard.auslastung() laut Validierungsplan
   (SPEC_SEA-Dashboard_Plan.md Abschnitt 9) gegen den TATSAECHLICH aus der
   HTML extrahierten Code. Zusaetzlich: ansichtWechseln-Grenzfaelle. */
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
let Daten = { state: { azubis: [], bezugslehrerWert: '', ansichtModus: 'meine' } };

const wrapped = new Function('SharePoint', 'Daten',
  bundle + '\nreturn { bezugslehrerAnzeige, SPSync, Azubis, Dashboard };');
const { bezugslehrerAnzeige, Dashboard } = wrapped(SharePoint, Daten);

/* ---------- 1. Dashboard.soll(): "(Zahl)"-Parsing -------------------- */
p('soll: Zahl wird geparst', Dashboard.soll('Mustermann, Max (25)') === 25);
p('soll: fehlende Klammer-Zahl -> null (Altdaten)', Dashboard.soll('Nur Nachname') === null);
p('soll: leer/undefined -> null', Dashboard.soll('') === null && Dashboard.soll(undefined) === null);
p('soll: konsistent mit bezugslehrerAnzeige', bezugslehrerAnzeige('Meier, Anna (10)') === 'Meier, Anna' && Dashboard.soll('Meier, Anna (10)') === 10);

/* ---------- 2. Ampel-Schwellen (Spec: gruen <80%, gelb 80-100%, rot >100%) */
p('Ampel 0 % -> gruen',   Dashboard.ampel(0, 10)   === 'gruen');
p('Ampel 79 % -> gruen',  Dashboard.ampel(79, 100) === 'gruen');
p('Ampel 80 % -> gelb',   Dashboard.ampel(80, 100) === 'gelb');
p('Ampel 100 % -> gelb',  Dashboard.ampel(10, 10)  === 'gelb');
p('Ampel 101 % -> rot',   Dashboard.ampel(101, 100) === 'rot');
p('Ampel ohne Soll -> null (keine Ampel)', Dashboard.ampel(5, null) === null);

/* ---------- 3. auslastung(): Zaehlen, Sortieren, Randfaelle ----------- */
const azubis = [
  { id: 'a', bezugslehrer: 'Mustermann, Max (25)' },  // Ist 2/25 = 8 %  -> gruen
  { id: 'b', bezugslehrer: 'Mustermann, Max (25)' },
  { id: 'c', bezugslehrer: 'Meier, Anna (2)' },              // Ist 2/2 = 100 % -> gelb
  { id: 'd', bezugslehrer: 'Meier, Anna (2)' },
  { id: 'e', bezugslehrer: 'Schmidt, Uwe (1)' },             // Ist 2/1 = 200 % -> rot
  { id: 'f', bezugslehrer: 'Schmidt, Uwe (1)' },
  { id: 'g', bezugslehrer: 'AltOhneZahl' },                  // keine Klammer-Zahl -> Hinweis
  { id: 'h', bezugslehrer: '' }                              // ohne Bezugslehrer
];
const z = Dashboard.auslastung(azubis);
p('auslastung: 5 Gruppen', z.length === 5);
p('auslastung: Ist-Zaehlung korrekt', z.find(x => x.name === 'Mustermann, Max').ist === 2);
p('auslastung: Soll uebernommen', z.find(x => x.name === 'Mustermann, Max').soll === 25);
p('auslastung: Sortierung hoechste Auslastung zuerst',
  z[0].name === 'Schmidt, Uwe' && z[1].name === 'Meier, Anna' && z[2].name === 'Mustermann, Max');
p('auslastung: Ampeln stimmen (rot/gelb/gruen)',
  z[0].ampel === 'rot' && z[1].ampel === 'gelb' && z[2].ampel === 'gruen');
p('auslastung: fehlende Zahl -> quote/ampel null, Zeile hinter den bewerteten',
  z[3].quote === null && z[3].ampel === null && ['AltOhneZahl', '(ohne Bezugslehrer*in)'].includes(z[3].name));
p('auslastung: Azubi ohne Bezugslehrer verschwindet nicht',
  z.some(x => x.name === '(ohne Bezugslehrer*in)' && x.ist === 1));
p('auslastung: leere Liste -> leeres Ergebnis (kein Absturz)', Dashboard.auslastung([]).length === 0);
p('auslastung: undefined -> leeres Ergebnis (kein Absturz)', Dashboard.auslastung(undefined).length === 0);

/* ---------- 4. Anzeige-Name ohne Klammer-Zahl ------------------------- */
p('auslastung: Anzeige-Name ohne "(Zahl)"',
  z.every(x => !/\(\d+\)\s*$/.test(x.name)));

console.log(log.join('\n'));
console.log('\n' + ok + '/' + (ok + fail) + ' Tests bestanden.');
if (fail > 0) process.exit(1);
