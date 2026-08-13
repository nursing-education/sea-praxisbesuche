/* Strukturtests v0.49 -- Fahrtkostenabrechnung als eigene Seite.

   Sie lesen die index.html als TEXT: Geprueft wird, WO die DFA lebt und was
   sie beim Umzug aus dem Dialog nicht verloren hat. Ob das PDF stimmt,
   entscheidet jsPDF im Browser und gehoert in die Abnahme.

   Warum ueberhaupt: Elf Spalten standen in einem Fenster mit 46 % der
   Bildschirmhoehe. Das hiess waagerecht scrollen UND senkrecht scrollen, im
   Kleinen -- und der Weg zum PDF fuehrte durch ein Fenster, das sich beim
   Export wortlos schloss. Ob der Export geklappt hatte, war nur daran zu
   erkennen, DASS es verschwand.

   Die Zusagen lauten deshalb:
   1. Die DFA ist eine Seite, kein Dialog -- und tritt an die Stelle der Touren.
   2. Sie ist kein Reitereintrag: Man kommt aus den Touren hierher.
   3. Nach dem Export bleibt man da und sieht das Ergebnis.
   4. Auf ihr wird keine Karte aufgebaut. */
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf-8');

const log = [];
let ok = 0, fail = 0;
function p(name, cond) {
  if (cond) { ok++; log.push('✓ ' + name); }
  else { fail++; log.push('✗ ' + name); }
}

/* ---------- 1. Seite statt Dialog ------------------------------------- */
p('Die Ansicht kennt eine offene DFA-Seite', /dfaOffen:false/.test(html));
p('Die DFA-Seite tritt an die Stelle der Touren',
  /if\(this\.dfaOffen\) return this\.viewDfaSeite\(\)/.test(html));
p('Es gibt keinen DFA-Dialog mehr', !/_dfaDialog/.test(html));

const rAuf = html.indexOf('_dfaRendern(){');
const rEnde = html.indexOf('_dfaBinden(){');
const rendern = rAuf > -1 ? html.slice(rAuf, rEnde) : '';
p('Die Tabelle wird in die Seite gezeichnet, nicht in ein Fenster',
  /getElementById\("dfaSeite"\)/.test(rendern) && !/this\.modal\(/.test(rendern));
/* Im Dialog begrenzte max-height:46vh die Tabelle. Auf der Seite waere das
   dieselbe Enge in groesserem Rahmen. */
p('Die Hoehenbegrenzung von 46vh ist weg', !/max-height:46vh/.test(html));
/* Waagerecht muss sie weiterhin in sich selbst scrollen -- sonst schieben elf
   Spalten die ganze Seite in die Breite. */
p('Die elf Spalten scrollen weiterhin in sich selbst',
  /<div class="pruef-scroll"><table class="prueftab dfa-tab"/.test(rendern));
/* Ohne Mindestbreite presst table-layout:fixed die elf Spalten in die Breite
   des Containers -- auf 390 px im Browser gemessen: 336 px fuer alle elf. Die
   Seite lief dann zwar nicht ueber, aber lesen konnte man nichts. */
p('Die Tabelle hat eine Mindestbreite, sonst wird sie zusammengepresst',
  /\.prueftab\.dfa-tab\{min-width:\d+px\}/.test(html));

/* ---------- 2. Kein Reitereintrag, aber ein Rueckweg ------------------ */
const navAuf = html.indexOf('<nav>');
const navBlock = navAuf > -1 ? html.slice(navAuf, html.indexOf('</nav>', navAuf)) : '';
p('Die DFA ist KEIN Reiter (man kommt aus den Touren)',
  navBlock.length > 0 && !/dfa/i.test(navBlock));
p('Der Knopf in der Tourenliste oeffnet die Seite',
  /getElementById\("dfaOeffnen"\)[\s\S]{0,120}dfaOeffnen\(\)/.test(html));

const sAuf = html.indexOf('viewDfaSeite(){');
const sEnde = html.indexOf('_dfaLadenUndRendern(){');
const seite = sAuf > -1 ? html.slice(sAuf, sEnde > sAuf ? sEnde : sAuf + 800) : '';
p('Die Seite hat einen Rueckweg zu den Touren', /dfaZurueck/.test(seite));
p('Der Rueckweg ist verdrahtet',
  /getElementById\("dfaZurueck"\)[\s\S]{0,80}dfaSchliessen\(\)/.test(html));
/* Ein Reiterklick muss auf die Reiter-Uebersicht fuehren, nicht auf eine
   liegengebliebene Unterseite -- sonst sieht der Knopf funktionslos aus. */
const twAuf = html.indexOf('tabWechseln(t){');
const tabWechseln = twAuf > -1 ? html.slice(twAuf, html.indexOf('standAnzeigen(){')) : '';
p('Ein Reiterwechsel schliesst die offene DFA-Seite',
  /this\.dfaOffen=false/.test(tabWechseln));

/* ---------- 3. Nach dem Export bleibt man auf der Seite --------------- */
const eAuf = html.indexOf('async _dfaExportieren(){');
const eEnde = html.indexOf('_tourDetailToggle(id){');
const export_ = eAuf > -1 ? html.slice(eAuf, eEnde) : '';
p('Der Export schliesst kein Fenster mehr', !/this\.modalZu\(\)/.test(export_));
p('Nach dem Export wird der Monat neu gezeichnet',
  /this\._dfaLadenUndRendern\(\)/.test(export_));
/* Die Loeschsperre haengt an dfaExportiert -- der Umzug darf sie nicht
   verlieren, sonst laesst sich eine abgerechnete Tour wieder loeschen. */
p('Abgerechnete Touren werden weiterhin markiert', /t\.dfaExportiert=true/.test(export_));
p('Unvollstaendige Zeilen halten den Export weiterhin auf',
  /km und Ziel-Ort ausfuellen|km und Ziel-Ort ausf/.test(export_));

/* ---------- 4. Auf der DFA-Seite keine Karte -------------------------- */
const renAuf = html.indexOf('  render(){');
const renEnde = html.indexOf('viewStart(){');
const render = renAuf > -1 ? html.slice(renAuf, renEnde) : '';
p('render() fuellt die DFA-Seite',
  /this\.tab==="touren" && this\.dfaOffen\) this\._dfaLadenUndRendern\(\)/.test(render));
/* _tourenInit() setzt Leaflet auf #tourKarte an. Auf der DFA-Seite gibt es
   das Element nicht -- der Aufruf muss unterbleiben, nicht ins Leere laufen. */
p('Auf der DFA-Seite wird keine Karte aufgebaut',
  /else if\(this\.tab==="touren"\) this\._tourenInit\(\)/.test(render));

console.log(log.join('\n'));
console.log('\n' + ok + '/' + (ok + fail) + ' Tests bestanden.');
if (fail > 0) process.exit(1);
