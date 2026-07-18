/* Baut das Test-Bundle und laesst alle aktiven Suites laufen.
   Aufruf aus dem Projektordner: node tests/run-all.js
   Exit-Code != 0, sobald eine Suite fehlschlaegt. */
const { execFileSync } = require('child_process');
const path = require('path');

const suiten = ['test_v028.js', 'test_position.js', 'test_v025.js', 'test_v026.js', 'test_v031.js', 'test_v032.js'];
const dir = __dirname;

function lauf(datei) {
  process.stdout.write('\n=== ' + datei + ' ===\n');
  execFileSync(process.execPath, [path.join(dir, datei)], { stdio: 'inherit' });
}

execFileSync(process.execPath, [path.join(dir, 'extract-bundle.js')], { stdio: 'inherit' });

let fehler = 0;
for (const s of suiten) {
  try { lauf(s); } catch { fehler++; }
}

console.log('\n' + (fehler ? '✗ ' + fehler + ' Suite(n) fehlgeschlagen' : '✓ alle Suiten gruen'));
process.exit(fehler ? 1 : 0);
