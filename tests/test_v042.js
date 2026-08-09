/* Logiktests v0.42 – Rechtliches.

   Diese Suite geht auf die Fassung vom 31.07.2026 zurück, in der Impressum und
   Datenschutz noch Dialoge in der App waren. Der Zuschnitt hat sich geändert
   (Impressum zentral auf percursus.de, Datenschutz als eigene `datenschutz.html`),
   ihr Kern gilt aber unverändert weiter und ist hier stärker gefasst:

   **Kein Dienst darf still aus der Datenschutzerklärung fallen.** Früher stand
   die Liste der Empfänger im Test fest verdrahtet – dann hätte ein neuer Dienst
   in der App den Test trotzdem nicht rot gemacht. Jetzt wird die Liste **aus der
   `index.html` abgeleitet**: Jeder Host, den die App zur Laufzeit anspricht, muss
   in der Erklärung vorkommen. Wer einen Dienst hinzufügt und die Erklärung
   vergisst, bekommt hier einen roten Test.

   Nicht geprüft wird der Wortlaut – der ist eine Rechtsfrage und ändert sich,
   ohne dass ein Test etwas dazu sagen könnte. */
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf-8');
const ds = fs.readFileSync(path.join(__dirname, '..', 'datenschutz.html'), 'utf-8');
const imp = fs.readFileSync(path.join(__dirname, '..', 'impressum.html'), 'utf-8');

const log = [];
let ok = 0, fail = 0;
function p(name, cond) {
  if (cond) { ok++; log.push('✓ ' + name); }
  else { fail++; log.push('✗ ' + name); }
}

/* ---------- 1. Empfänger: aus dem Code abgeleitet, nicht verdrahtet ------ */
/* Ein Host in einem href="" ist ein Verweis, den der Nutzer anklickt – kein
   Abruf beim Laden. Nur alles andere ist ein Empfänger im Sinne der DSGVO. */
function laufzeitHosts(quelle) {
  const treffer = new Set();
  const re = /https:\/\/([a-z0-9.{}-]+)/gi;
  let m;
  while ((m = re.exec(quelle)) !== null) {
    const zeilenStart = quelle.lastIndexOf('\n', m.index) + 1;
    if (/href="\s*$/.test(quelle.slice(zeilenStart, m.index))) continue;
    treffer.add(m[1].replace(/^\{s\}\./, ''));   // {s}.tile.… -> tile.…
  }
  return [...treffer].sort();
}

const hosts = laufzeitHosts(html);
p('empfaenger: die App spricht ueberhaupt fremde Dienste an (sonst greift der Test ins Leere)',
  hosts.length >= 4);
for (const host of hosts) {
  p('empfaenger: "' + host + '" ist in der Datenschutzerklaerung genannt',
    ds.indexOf(host) >= 0);
}

/* ---------- 2. Inhaltliche Pflichtstücke -------------------------------- */
p('datenschutz: nennt die Anmeldung ueber Microsoft',
  /Microsoft/.test(ds) && ds.indexOf('login.microsoftonline.com') >= 0);
p('datenschutz: nennt die Speicherung auf dem Geraet',
  ds.indexOf('IndexedDB') >= 0 && ds.indexOf('localStorage') >= 0);
p('datenschutz: begruendet, warum es ohne Einwilligung geht (TDDDG)',
  /§ 25/.test(ds) && /TDDDG/.test(ds));
p('datenschutz: nennt den Hoster',
  ds.indexOf('Hostinger') >= 0);
p('datenschutz: sagt, dass die Privatadresse nur auf eigenes Zutun uebertragen wird',
  /private Anschrift/.test(ds));
p('datenschutz: nennt die Betroffenenrechte',
  /Auskunft/.test(ds) && /Löschung/.test(ds) && /Beschwerderecht/.test(ds));
/* Der Befund vom 31.07.: Der Sync holt jede Liste komplett, "Nur meine/Alle"
   ist reine Anzeige. Empfaenger sind damit faktisch alle Personen mit Leserecht
   auf der SharePoint-Site -- das muss in der Erklaerung stehen. */
p('datenschutz: benennt den Kreis, der die Daten tatsaechlich einsehen kann',
  /Leserecht/.test(ds));

/* ---------- 3. Impressum -------------------------------------------------- */
/* Seit 04.08.2026 liegt es lokal statt als Link auf percursus.de: Der Sprung warf
   die Nutzenden in ein fremdes Layout auf eine fremde Website. */
p('fusszeile: zwei lokale Links -- Impressum und Datenschutz',
  html.indexOf('href="impressum.html"') >= 0
  && html.indexOf('href="datenschutz.html"') >= 0);
/* Auf den Verweis pruefen, nicht auf das Wort -- der Kommentar an der Fusszeile
   erklaert, warum der Sprung weg ist, und darf percursus.de nennen. */
p('fusszeile: springt nicht mehr nach percursus.de',
  !/href="[^"]*percursus/.test(html));
p('impressum: nennt Anbieter und ladungsfaehige Anschrift',
  /Christian Thiel/.test(imp) && /\b\d{5}\b/.test(imp) && /§ 5/.test(imp));
p('impressum: nennt einen Kontaktweg',
  /mailto:/.test(imp));
/* Der Urheberrecht-Link ist entfallen, weil die Seite dort LERNINHALTE unter CC
   stellt -- diese Anwendung ist Software. Die Klarstellung muss dafuer dastehen,
   sonst waere die Frage einfach unbeantwortet. */
p('impressum: stellt klar, dass die CC-Lizenz fuer die App nicht gilt',
  /Creative.Commons/.test(imp) && /keine/i.test(imp));
p('impressum: nennt OpenStreetMap und ODbL (Lizenzpflicht der Kartendaten)',
  /OpenStreetMap/.test(imp) && /ODbL/.test(imp));
p('impressum: der verbliebene externe Link oeffnet entkoppelt',
  (imp.match(/rel="noopener noreferrer"/g) || []).length >= 1);
p('rechtsseiten: verweisen wechselseitig aufeinander',
  imp.indexOf('href="datenschutz.html"') >= 0
  && ds.indexOf('href="impressum.html"') >= 0);

/* ---------- 4. HTML-Geruest --------------------------------------------- */
/* Genau eine h1 je Seite: Zwei sagen weder Screenreader noch Suchmaschine,
   wovon die Seite handelt. Stand hier schon einmal falsch. */
for (const [name, quelle] of [['App', html], ['Datenschutzseite', ds], ['Impressum', imp]]) {
  p('geruest: ' + name + ' hat genau eine h1',
    (quelle.match(/<h1/g) || []).length === 1);
  p('geruest: ' + name + ' ist als deutsch ausgezeichnet',
    /<html lang="de">/i.test(quelle));
  p('geruest: ' + name + ' deklariert UTF-8',
    /charset="utf-8"/i.test(quelle));
}
p('geruest: die Tabelle der Dienste hat Spaltenkoepfe mit scope',
  /<th scope="col">/.test(ds));

console.log(log.join('\n'));
console.log('\n' + ok + '/' + (ok + fail) + ' Tests bestanden.');
process.exit(fail ? 1 : 0);
