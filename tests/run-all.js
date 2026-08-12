/* Baut das Test-Bundle und laesst alle aktiven Suites laufen.
   Aufruf aus dem Projektordner: node tests/run-all.js
   Exit-Code != 0, sobald eine Suite fehlschlaegt. */
const { execFileSync } = require('child_process');
const path = require('path');

const suiten = ['test_v028.js', 'test_position.js', 'test_v025.js', 'test_v026.js', 'test_v031.js', 'test_v032.js', 'test_v033.js', 'test_v034.js', 'test_v035.js', 'test_v036.js', 'test_v037.js', 'test_v038.js', 'test_v039.js', 'test_v040.js', 'test_v041.js', 'test_v042.js', 'test_v044.js', 'test_v0441.js', 'test_v0442.js'];
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
