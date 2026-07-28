/* Baut extracted_lint_bundle.js aus index.html - den kompletten eigenen JS-Block.

   Unterschied zu extract-bundle.js: Jenes schneidet zwoelf benannte Bloecke fuer die
   Logiktests heraus. Fuer einen Linter ist das die falsche Grundlage - er haelt dann
   jedes Modul, das nicht mitgeschnitten wurde (Daten, Oberflaeche, SharePoint ...),
   faelschlich fuer undeklariert. Auf dem Test-Extrakt meldete die Regel
   noUndeclaredVariables 90 Treffer, davon 90 Fehlalarme.

   Hier wird stattdessen alles zwischen dem einzigen attributlosen <script> und dem
   letzten </script> geschnitten: der eigene Code am Stueck, ohne Fremd-Libraries
   (die tragen seit v0.40.6 eigene script-src-Tags bzw. vorher eine id). */
const fs = require('fs');
const path = require('path');

const START = '<script>';
const ENDE = '</script>';

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

const treffer = html.split(START).length - 1;
if (treffer !== 1) {
  console.error('✗ Erwartet genau ein <script> ohne Attribute, gefunden: ' + treffer);
  console.error('  Traegt der App-Block jetzt ein Attribut? Dann diesen Extraktor anpassen.');
  process.exit(1);
}

const von = html.indexOf(START) + START.length;
const bis = html.lastIndexOf(ENDE);
if (bis <= von) {
  console.error('✗ Kein ' + ENDE + ' nach dem App-Block gefunden.');
  process.exit(1);
}

const code = html.slice(von, bis);
fs.writeFileSync(path.join(__dirname, 'extracted_lint_bundle.js'), code);
console.log('extracted_lint_bundle.js geschrieben (' + code.length + ' Zeichen)');
