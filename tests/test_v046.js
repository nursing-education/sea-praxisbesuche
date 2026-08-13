/* Struktur-Tests v0.46 -- durchgehende Navigationsleiste und Kopfzeilen-Werkzeuge.

   Sie lesen die index.html als TEXT, nicht den extrahierten JS-Block: Geprueft
   wird die Lage im Dokument und der Wegfall der zweiten Navigationsebene, und
   beides steht im HTML.

   Warum ueberhaupt: Bis v0.45 gab es zwei Ebenen. Ganz oben standen "start",
   "dashboard" und "planer" als getrennte Ansichten (Oberflaeche.ansicht), die
   Reiterleiste gehoerte NUR zu "planer" und wurde sonst per
   nav.style.display="none" ausgeblendet. Die Startseite war damit eine Weiche
   und kein Inhalt -- jedes Oeffnen der App kostete einen Klick, bevor etwas zu
   sehen war. Und "Ich bin ..." lag als Auswahlliste in den Einstellungen: Der
   Wert entscheidet, wessen Azubis die GANZE App zeigt, war aber beim Arbeiten
   nirgends sichtbar. Genau daran konnte sich der Fehler v0.44.1 so lange
   verstecken.

   Die Zusagen lauten deshalb:
   1. Die Leiste wird nirgends mehr versteckt, und `ansicht` ist als Zustand weg.
   2. Die Kopfzeilen-Werkzeuge liegen AUSSERHALB von #inhalt -- dieselbe
      Bedingung, die seit v0.42 fuer den Footer und seit v0.45 fuer den
      Ladebalken gilt. Alles darin wird bei jedem Wechsel neu gezeichnet.
   3. Was in die Kopfzeile gewandert ist, steht nicht mehr doppelt in den
      Einstellungen.

   Was diese Suite NICHT leistet: ob die Leiste auf 390 px umbricht, ob der
   Dialog aufgeht und ob der Login durchlaeuft. Das entscheidet der Browser und
   gehoert in die Abnahme. */
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf-8');

const log = [];
let ok = 0, fail = 0;
function p(name, cond) {
  if (cond) { ok++; log.push('✓ ' + name); }
  else { fail++; log.push('✗ ' + name); }
}

const navAuf = html.indexOf('<nav>');
const navZu = html.indexOf('</nav>', navAuf);
const navBlock = navAuf > -1 ? html.slice(navAuf, navZu) : '';
const inhaltAuf = html.indexOf('<main id="inhalt"');
const inhaltZu = html.indexOf('</main>', inhaltAuf);
const ausserhalbInhalt = pos => pos > -1 && inhaltAuf > -1 && !(pos > inhaltAuf && pos < inhaltZu);

/* ---------- 1. Die zweite Ebene ist weg ------------------------------- */
p('Die Leiste wird nirgends mehr ausgeblendet',
  !/nav\.style\.display/.test(html));
p('Kein Zustand `ansicht` mehr im Oberflaeche-Objekt',
  !/^\s*ansicht:\s*"/m.test(html));
p('ansichtWechseln() existiert nicht mehr',
  !/ansichtWechseln/.test(html));
p('tabWechseln() ist der eine Weg zum Reiterwechsel',
  /\btabWechseln\(t\)\s*\{/.test(html));

/* ---------- 2. Die Leiste traegt alle Ziele --------------------------- */
const reiter = [...navBlock.matchAll(/data-tab="([a-z]+)"/g)].map(m => m[1]);
p('Uebersicht ist ein gewoehnlicher Reiter', reiter.includes('start'));
p('Verwaltung (frueher Dashboard) ist ein gewoehnlicher Reiter', reiter.includes('verwaltung'));
p('Alle sieben Ziele liegen in der Leiste',
  ['start', 'azubis', 'anstehend', 'touren', 'einrichtungen', 'einstellungen', 'verwaltung']
    .every(t => reiter.includes(t)));
/* Christians ausdrueckliche Reihenfolge (Spec "Navigation", Punkt 4):
   erst der Ueberblick, dann die Termine. Das dreht v0.45 um. */
p('Azubis steht vor Anstehend',
  reiter.indexOf('azubis') > -1 && reiter.indexOf('azubis') < reiter.indexOf('anstehend'));
p('Uebersicht steht ganz vorn', reiter[0] === 'start');
p('Einstellungen und Verwaltung sind rechts abgesetzt',
  /class="nav-abgesetzt"|class="[^"]*\bnav-abgesetzt\b/.test(navBlock));

/* ---------- 3. render() schaltet flach ueber this.tab ----------------- */
const renderPos = html.indexOf('  render(){');
const renderEnde = html.indexOf('_tourenInit();', renderPos);
const renderBlock = renderPos > -1 ? html.slice(renderPos, renderEnde) : '';
p('render() kennt den Zweig fuer die Uebersicht',
  /this\.tab==="start"/.test(renderBlock));
p('render() kennt den Zweig fuer die Verwaltung',
  /this\.tab==="verwaltung"/.test(renderBlock));
p('render() fragt nicht mehr nach this.ansicht',
  renderBlock.length > 0 && !/this\.ansicht/.test(renderBlock));

/* ---------- 4. Die Werkzeuge liegen ausserhalb von #inhalt ------------ */
const ichBin = html.indexOf('id="ichBinBtn"');
const sync = html.indexOf('id="syncBtn"');
const bug = html.indexOf('id="bugBtn"');
p('"Ich bin ..." steht als Knopf in der Kopfzeile', ichBin > -1);
p('Aktualisieren steht als Knopf in der Kopfzeile', sync > -1);
p('"Ich bin ..." liegt ausserhalb von #inhalt (ueberlebt das Neuzeichnen)', ausserhalbInhalt(ichBin));
p('Aktualisieren liegt ausserhalb von #inhalt', ausserhalbInhalt(sync));
p('Feedback liegt weiterhin ausserhalb von #inhalt', ausserhalbInhalt(bug));

/* Elemente ausserhalb von #inhalt werden nie neu erzeugt. Wuerden sie in
   _verdrahten() gebunden, stapelten sich die Handler mit jedem render(). */
const initPos = html.indexOf('  init(){');
const initEnde = html.indexOf('Onboarding.pruefeStart()', initPos);
const initBlock = initPos > -1 ? html.slice(initPos, initEnde) : '';
p('Die Kopfzeilen-Knoepfe werden einmalig in init() verdrahtet',
  /getElementById\("ichBinBtn"\)/.test(initBlock) && /getElementById\("syncBtn"\)/.test(initBlock));
const verdrahtenPos = html.indexOf('  _verdrahten(){');
const verdrahtenBlock = verdrahtenPos > -1 ? html.slice(verdrahtenPos) : '';
p('_verdrahten() fasst die Kopfzeilen-Knoepfe nicht an',
  !/getElementById\("ichBinBtn"\)/.test(verdrahtenBlock) && !/getElementById\("syncBtn"\)/.test(verdrahtenBlock));

/* ---------- 5. Nichts steht doppelt ----------------------------------- */
p('Kein zweiter Anmelde-Knopf in den Einstellungen',
  !/spSyncBtn/.test(html));
p('Die Bezugslehrer-Auswahl existiert nur einmal (im Dialog)',
  (html.match(/id="bezugslehrerWert"/g) || []).length === 1);

/* ---------- 6. Der gewaehlte Name ist sichtbar ------------------------ */
p('Die Kopfzeile hat ein Feld fuer den Namen', html.indexOf('id="ichBinName"') > -1);
p('ichBinAnzeigen() schreibt ihn hinein',
  /ichBinAnzeigen\(\)\s*\{[\s\S]{0,400}?getElementById\("ichBinName"\)/.test(html));
p('render() ruft ichBinAnzeigen() mit',
  /this\.ichBinAnzeigen\(\)/.test(renderBlock));

/* ---------- 7. Symbol-Knoepfe bleiben ansagbar ------------------------
   Unter 700px verschwinden die Wortmarken (.kopf-txt). Ein Knopf, der dann nur
   noch ein Emoji traegt, hat ohne aria-label keinen ansagbaren Namen -- und das
   Emoji selbst gehoert per aria-hidden aus dem Namen heraus. */
const kopfZeile = z => (html.split('\n').find(x => x.includes(z)) || '');
p('Aktualisieren traegt ein aria-label', /aria-label="/.test(kopfZeile('id="syncBtn"')));
p('Feedback traegt ein aria-label', /aria-label="/.test(kopfZeile('id="bugBtn"')));
p('Die Symbole sind aus dem ansagbaren Namen ausgenommen',
  (html.match(/<span aria-hidden="true">/g) || []).length >= 3);

/* ---------- 8. Die Version bleibt auf dem Handy ablesbar --------------
   Sie weicht unter 700px aus der Kopfzeile und ist die erste Rueckfrage bei
   jeder Fehlermeldung -- ohne zweite Stelle waere sie dort nicht mehr zu holen. */
p('Version steht auch in den Einstellungen',
  /Version <b>\$\{esc\(APP_VERSION\)\}<\/b>/.test(html));

console.log(log.join('\n'));
console.log('\n' + ok + '/' + (ok + fail) + ' Tests bestanden.');
if (fail > 0) process.exit(1);
