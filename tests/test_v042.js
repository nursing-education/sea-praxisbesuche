/* Isolierte Logiktests v0.42 – Impressum und Datenschutz im Footer.
   Geprüft wird NICHT der Wortlaut der Rechtstexte – der ist Sache des Trägers und
   ändert sich, ohne dass ein Test etwas dazu sagen könnte. Geprüft wird die
   Feld-Logik: Eine leere Pflichtangabe darf keine leere Zeile erzeugen (sie würde
   eine Angabe vortäuschen), und der Verweis auf das Träger-Impressum muss stehen,
   solange die Angaben hier nicht vollständig sind.
   Das Öffnen des Dialogs selbst ist Browser-Sache und steht in der Abnahme. */
const fs = require('fs');
const path = require('path');
const bundle = fs.readFileSync(path.join(__dirname, 'extracted_test_bundle.js'), 'utf-8');

const log = [];
let ok = 0, fail = 0;
function p(name, cond) {
  if (cond) { ok++; log.push('✓ ' + name); }
  else { fail++; log.push('✗ ' + name); }
}

/* Der Dialog landet in Oberflaeche.modal – hier abgefangen statt gezeichnet. */
let letztesModal = '';
let Oberflaeche = { modal: (html) => { letztesModal = html; }, modalZu: () => {} };
let SharePoint = {}, Daten = { state: {} }, Einrichtungen = {}, pflichtbesucheMarkieren = () => {};

const wrapped = new Function('SharePoint', 'Daten', 'Einrichtungen', 'Oberflaeche', 'pflichtbesucheMarkieren',
  bundle + '\nreturn { Rechtliches, IMPRESSUM_FELDER, RECHT_LINKS };');
const { Rechtliches, IMPRESSUM_FELDER, RECHT_LINKS } =
  wrapped(SharePoint, Daten, Einrichtungen, Oberflaeche, pflichtbesucheMarkieren);

/* ---------- 1. Feld-Logik ---------------------------------------------- */
/* Auslieferungszustand: nur der Anbieter steht fest, der Rest kommt vom Träger. */
p('felder: der gesetzte Anbieter erscheint',
  Rechtliches._felderHtml().indexOf('St. Elisabeth Akademie') >= 0);
p('felder: leere Angaben erzeugen keine Zeile',
  Rechtliches._felderHtml().indexOf('Telefon') < 0
  && Rechtliches._felderHtml().indexOf('Umsatzsteuer') < 0);

IMPRESSUM_FELDER.telefon = '02131 000000';
p('felder: eine nachgetragene Angabe erscheint mit Beschriftung',
  /<dt>Telefon<\/dt><dd>02131 000000<\/dd>/.test(Rechtliches._felderHtml()));

/* Die Werte kommen von Hand aus einer Webseite – ein "&" oder "<" im Trägernamen
   darf das Markup nicht zerlegen. Escaped werden "&", "<" und '"' wie überall
   sonst in der App (_dlgEsc); ein alleinstehendes ">" bleibt stehen und ist im
   Textinhalt unbedenklich – gefährlich ist nur der Tag-Anfang. */
IMPRESSUM_FELDER.vertreten = 'Meier & Sohn <gGmbH>';
p('felder: Sonderzeichen werden escaped, kein Tag entsteht',
  Rechtliches._felderHtml().indexOf('Meier &amp; Sohn &lt;gGmbH') >= 0
  && Rechtliches._felderHtml().indexOf('<gGmbH') < 0);

IMPRESSUM_FELDER.telefon = '';
IMPRESSUM_FELDER.vertreten = '';
p('felder: geleerte Angaben verschwinden wieder',
  Rechtliches._felderHtml().indexOf('Telefon') < 0);

/* ---------- 2. Impressum-Dialog ---------------------------------------- */
Rechtliches.impressum();
const imp = letztesModal;
p('impressum: nennt sich als Impressum',
  /<h3>Impressum<\/h3>/.test(imp));
/* Solange die Anschrift fehlt, ist der Verweis auf den Träger die einzige
   belastbare Quelle – er MUSS dann dastehen. */
p('impressum: verlinkt das Träger-Impressum, solange die Anschrift fehlt',
  imp.indexOf(RECHT_LINKS.impressum) >= 0
  && imp.indexOf('Pflichtangaben nach § 5 DDG') >= 0);
p('impressum: externe Links öffnen entkoppelt (noopener)',
  /rel="noopener noreferrer"/.test(imp));

/* Ist die Anschrift eingetragen, entfällt der Hinweis auf die Lücke – der Link
   bleibt, weil dort weiterhin mehr steht. */
IMPRESSUM_FELDER.anschrift = 'Musterweg 1, 41464 Neuss';
Rechtliches.impressum();
p('impressum: der Lücken-Hinweis verschwindet, sobald die Anschrift steht',
  letztesModal.indexOf('Pflichtangaben nach § 5 DDG') < 0
  && letztesModal.indexOf('Musterweg 1, 41464 Neuss') >= 0);
IMPRESSUM_FELDER.anschrift = '';

/* ---------- 3. Datenschutz-Dialog -------------------------------------- */
/* Der Kern dieser Scheibe: Die App spricht drei Dienste an, die in der
   Datenschutzerklärung des Trägers NICHT vorkommen. Fehlt einer davon hier,
   ist die Erklärung unvollständig – das ist prüfbar und bleibt es. */
Rechtliches.datenschutz();
const ds = letztesModal;
p('datenschutz: nennt die Kartenkacheln',
  ds.indexOf('tile.openstreetmap.org') >= 0);
p('datenschutz: nennt die Adresssuche und die Privatadresse',
  ds.indexOf('Nominatim') >= 0 && /Privatadresse/.test(ds));
p('datenschutz: nennt die Routenberechnung',
  ds.indexOf('OSRM') >= 0);
p('datenschutz: nennt die Anmeldung über Microsoft',
  ds.indexOf('Microsoft Entra ID') >= 0);
p('datenschutz: nennt die lokale Speicherung',
  ds.indexOf('IndexedDB') >= 0);
p('datenschutz: nennt den Drittlandtransfer der Auslieferung',
  ds.indexOf('GitHub Pages') >= 0 && ds.indexOf('USA') >= 0);
p('datenschutz: nennt die Betroffenenrechte',
  /Auskunft/.test(ds) && /Löschung/.test(ds) && /Beschwerderecht/.test(ds));
p('datenschutz: verweist für die Trägerangaben auf dessen Erklärung',
  ds.indexOf(RECHT_LINKS.datenschutz) >= 0);
/* Keine Werbe-/Analyse-Cookies -- die Aussage muss dastehen, weil sie erklärt,
   warum die App ohne Consent-Banner auskommt. */
p('datenschutz: stellt klar, dass keine Werbe- oder Analyse-Cookies gesetzt werden',
  /keine\s*<b>|<b>keine/.test(ds) && ds.indexOf('Reichweitenmessung') >= 0);

console.log(log.join('\n'));
console.log('\n' + ok + '/' + (ok + fail) + ' Tests bestanden.');
process.exit(fail ? 1 : 0);
