/* Baut extracted_test_bundle.js aus index.html.
   Schneidet die Top-Level-Bloecke heraus, die die Logiktests v0.25/v0.26
   erwarten (SharePoint/Dashboard/Azubis-Logik ohne Browser-Abhaengigkeiten).
   Terminator-Technik wie in den Onboarding-Tests: Top-Level-Objekte schliessen
   mit "\n};" am Zeilenanfang, die Funktion mit "\n}". */
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

// name -> Regex, die den kompletten Deklarations-Block faengt.
const bloecke = [
  ['SP_CONFIG',        /const SP_CONFIG = \{[\s\S]*?\n\};/],
  ['SP_FELDER_ADMINS', /const SP_FELDER_ADMINS = \{[^\n]*?\};/],
  ['bezugslehrerAnzeige', /function bezugslehrerAnzeige\([\s\S]*?\n\}/],
  ['kursVorschlagAusCsv', /function kursVorschlagAusCsv\([\s\S]*?\n\}/],
  ['SPSync',           /const SPSync = \{[\s\S]*?\n\};/],
  ['Azubis',           /const Azubis = \{[\s\S]*?\n\};/],
  ['Dashboard',        /const Dashboard = \{[\s\S]*?\n\};/],
];

const teile = [];
for (const [name, re] of bloecke) {
  const m = html.match(re);
  if (!m) {
    console.error('✗ Block nicht gefunden: ' + name);
    process.exit(1);
  }
  teile.push('/* ---- ' + name + ' ---- */\n' + m[0]);
}

const bundle = teile.join('\n\n') + '\n';
fs.writeFileSync(path.join(__dirname, 'extracted_test_bundle.js'), bundle);
console.log('extracted_test_bundle.js geschrieben (' + bundle.length + ' Zeichen, ' + bloecke.length + ' Bloecke)');
