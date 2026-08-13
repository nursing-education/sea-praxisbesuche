/* Struktur-Tests v0.45 -- Ladeanzeige.

   Sie lesen die index.html als TEXT, nicht den extrahierten JS-Block: Geprueft
   wird die Lage im Dokument, und die steht im HTML.

   Warum ueberhaupt: Bis v0.44.2 schrieb _statusAnzeigen() ausschliesslich in
   #spStatus -- ein Element, das nur der Einstellungen-Reiter enthaelt. In jeder
   anderen Ansicht brach die Funktion an `if(!el) return` wortlos ab, und der
   automatische Sync beim Start lief ueber fuenf Sekunden ohne jede Rueckmeldung.

   Die Zusage lautet deshalb: Die Rueckmeldung liegt AUSSERHALB von #inhalt --
   dieselbe Bedingung, die seit v0.42 fuer den Footer gilt. Alles darin wird bei
   jedem Ansichtswechsel neu gezeichnet und waere weg.

   Was diese Suite NICHT leistet: ob der Balken tatsaechlich erscheint. Das
   entscheidet der Browser und gehoert in die Abnahme. */
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf-8');

const log = [];
let ok = 0, fail = 0;
function p(name, cond) {
  if (cond) { ok++; log.push('✓ ' + name); }
  else { fail++; log.push('✗ ' + name); }
}

/* ---------- 1. Das Element gibt es ----------------------------------- */
const balkenPos = html.indexOf('id="ladebalken"');
p('Ladebalken ist im Dokument angelegt', balkenPos > -1);

/* ---------- 2. Es liegt ausserhalb von #inhalt ----------------------- */
const inhaltAuf = html.indexOf('<main id="inhalt"');
const inhaltZu = html.indexOf('</main>', inhaltAuf);
p('Ladebalken liegt ausserhalb von #inhalt (ueberlebt das Neuzeichnen)',
  balkenPos > -1 && inhaltAuf > -1 && !(balkenPos > inhaltAuf && balkenPos < inhaltZu));

/* ---------- 3. Die Kopfzeilen-Anzeige wird angesagt ------------------- */
const standZeile = html.split('\n').find(z => z.includes('id="standAnzeige"')) || '';
p('Standanzeige ist als role="status" ausgewiesen', /role="status"/.test(standZeile));

/* ---------- 4. Abgestellte Bewegung bleibt bedient -------------------- */
const reduced = html.indexOf('prefers-reduced-motion');
const balkenRegel = html.indexOf('.ladebalken>span');
p('Es gibt eine Regel fuer prefers-reduced-motion', reduced > -1);
p('Der Ladebalken ist davon erfasst',
  reduced > -1 && html.indexOf('.ladebalken>span', reduced) > -1);

/* ---------- 5. Die Statusanzeige haengt nicht mehr an #spStatus ------
   Der Balken muss VOR der Abbruchzeile bedient werden, sonst ist der alte
   Fehler zurueck: In Ansichten ohne #spStatus geschieht sonst wieder nichts. */
const fnPos = html.indexOf('_statusAnzeigen(){');
const abbruch = html.indexOf('if(!el) return;', fnPos);
const balkenImCode = html.indexOf('getElementById("ladebalken")', fnPos);
p('Der Ladebalken wird vor dem Abbruch bei fehlendem #spStatus gesetzt',
  fnPos > -1 && balkenImCode > -1 && abbruch > -1 && balkenImCode < abbruch);
p('Die Kopfzeile wird ebenfalls vor dem Abbruch gesetzt',
  html.indexOf('getElementById("standAnzeige")', fnPos) < abbruch);

console.log(log.join('\n'));
console.log('\n' + ok + '/' + (ok + fail) + ' Tests bestanden.');
if (fail > 0) process.exit(1);
