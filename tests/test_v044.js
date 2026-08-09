/* Isolierte Logiktests v0.44 – Feedback nach SharePoint.
   Geprueft wird gegen den TATSAECHLICH aus index.html extrahierten Code,
   Netz und Browser gestubt.

   Drei Dinge, die schiefgehen koennen und es hier nicht duerfen:
   1. Ein falscher interner Feldname -- SharePoint lehnt dann den ganzen
      Schreibvorgang ab. Die Namen sind Stand 09.08.2026 aus der Listenansicht
      genannt, nicht aus den Listeneinstellungen bestaetigt.
   2. Ein gescheiterter Schreibvorgang, der still bleibt. Die Meldung muss als
      offen markiert liegenbleiben, damit offeneSenden sie nachreicht
      (Fehlerklasse aus v0.40.2).
   3. Ein Issue-Link, der bei "&", Umlaut oder Zeilenumbruch abgeschnitten wird. */
const fs = require('fs');
const path = require('path');
const bundle = fs.readFileSync(path.join(__dirname, 'extracted_test_bundle.js'), 'utf-8');

const log = [];
let ok = 0, fail = 0;
function p(name, cond) {
  if (cond) { ok++; log.push('✓ ' + name); }
  else { fail++; log.push('✗ ' + name); }
}

let graphAntwort = { value: [] };
let schreibFehler = null;          // gesetzt -> _schreiben wirft
let geschrieben = [];              // Mitschnitt aller Schreibvorgaenge
let tokenDa = true;

let SharePoint = { istAdmin: true,
  _tokenStill: async () => { if (!tokenDa) throw new Error('kein Token'); return 'tok'; },
  _graphGet: async () => graphAntwort };
let Daten = { state: { azubis: [], azubiNamen: {}, lehrer: [], meldungen: [], rueckmeldungen: [],
  bezugslehrerWert: '', ansichtModus: 'meine' }, speichern: async () => {} };
let Einrichtungen = { alle: () => [], aliasHinzufuegen: () => {}, sicherstellen: () => {} };
let Oberflaeche = { toast: () => {}, render: () => {} };
let pflichtbesucheMarkieren = () => {};

const wrapped = new Function('SharePoint', 'Daten', 'Einrichtungen', 'Oberflaeche', 'pflichtbesucheMarkieren',
  bundle + '\nreturn { SPSync, Dashboard, SP_FELDER_FEEDBACK };');
const { SPSync, Dashboard, SP_FELDER_FEEDBACK } = wrapped(SharePoint, Daten, Einrichtungen, Oberflaeche, pflichtbesucheMarkieren);

(async () => {
  SPSync._itemsUrl = async () => 'https://graph.example/feedback';
  SPSync._schreiben = async (url, token, methode, body) => {
    if (schreibFehler) throw new Error(schreibFehler);
    geschrieben.push({ url, methode, body });
    return { id: '777' };
  };

  /* ---------- 1. Feldzuordnung ---------- */
  p('Feld art ist Title (SharePoint-Standardspalte)', SP_FELDER_FEEDBACK.art === 'Title');
  p('Feld meldung heisst Meldung',       SP_FELDER_FEEDBACK.meldung === 'Meldung');
  p('Feld absender heisst Absender',     SP_FELDER_FEEDBACK.absender === 'Absender');
  p('Feld appVersion heisst AppVersion', SP_FELDER_FEEDBACK.appVersion === 'AppVersion');
  p('Feld erledigt heisst Erledigt',     SP_FELDER_FEEDBACK.erledigt === 'Erledigt');
  p('kein Feld heisst Version (SharePoint-Systemspalte)',
    !Object.values(SP_FELDER_FEEDBACK).includes('Version'));

  /* ---------- 2. Kategorie -> Beschriftung ---------- */
  p('fehler -> Fehler', SPSync._fbArt('fehler') === 'Fehler');
  p('wunsch -> Wunsch', SPSync._fbArt('wunsch') === 'Wunsch');
  p('frage -> Frage',   SPSync._fbArt('frage')  === 'Frage');
  p('unbekannte Kategorie faellt auf Fehler zurueck', SPSync._fbArt('quatsch') === 'Fehler');

  /* ---------- 3. Erfolgreiches Senden ---------- */
  geschrieben = [];
  const m1 = { kategorie: 'wunsch', text: 'Kalender bitte breiter', von: 'Meier, Anna', version: '0.44.0' };
  const r1 = await SPSync.feedbackSenden(m1);
  p('Erfolg: Rueckgabe true', r1 === true);
  p('Erfolg: genau ein POST', geschrieben.length === 1 && geschrieben[0].methode === 'POST');
  p('Erfolg: Art landet in Title', geschrieben[0].body.fields.Title === 'Wunsch');
  p('Erfolg: Text landet in Meldung', geschrieben[0].body.fields.Meldung === 'Kalender bitte breiter');
  p('Erfolg: Absender uebernommen', geschrieben[0].body.fields.Absender === 'Meier, Anna');
  p('Erfolg: AppVersion uebernommen', geschrieben[0].body.fields.AppVersion === '0.44.0');
  p('Erfolg: kein Erledigt mitgeschrieben (SharePoint-Standard Nein)',
    !('Erledigt' in geschrieben[0].body.fields));
  p('Erfolg: nicht als offen markiert', m1.fbOffen === false);
  p('Erfolg: spId gemerkt', m1.spId === '777');

  /* ---------- 4. Gescheitertes Senden bleibt liegen ---------- */
  schreibFehler = 'HTTP 400 – Feld unbekannt';
  const m2 = { kategorie: 'fehler', text: 'Karte laedt nicht', von: 'Schmidt, Bea', version: '0.44.0' };
  const r2 = await SPSync.feedbackSenden(m2);
  p('Fehlschlag: Rueckgabe false', r2 === false);
  p('Fehlschlag: als offen markiert', m2.fbOffen === true);
  p('Fehlschlag: Grund festgehalten', /Feld unbekannt/.test(m2.fbGrund || ''));

  /* Ohne Token gar nicht erst versuchen -- offline ist kein Fehler. */
  schreibFehler = null; tokenDa = false; geschrieben = [];
  const m3 = { kategorie: 'frage', text: 'Wie melde ich einen Ausfall?', von: '', version: '0.44.0' };
  const r3 = await SPSync.feedbackSenden(m3);
  p('ohne Token: Rueckgabe false', r3 === false);
  p('ohne Token: als offen markiert', m3.fbOffen === true);
  p('ohne Token: kein Schreibversuch', geschrieben.length === 0);
  tokenDa = true;

  /* ---------- 5. Nachreichen ueber offeneSenden ---------- */
  geschrieben = [];
  Daten.state.meldungen = [m2, m3, { kategorie: 'wunsch', text: 'laengst angekommen', fbOffen: false }];
  const bilanz = await SPSync.offeneSenden('tok');
  p('Nachreichen: beide offenen gesendet', geschrieben.length === 2);
  p('Nachreichen: die bereits angekommene bleibt aussen vor',
    !geschrieben.some(g => g.body.fields.Meldung === 'laengst angekommen'));
  p('Nachreichen: als erledigt gezaehlt', bilanz.ok === 2 && bilanz.fehler === 0);
  p('Nachreichen: Marker zurueckgesetzt', m2.fbOffen === false && m3.fbOffen === false);
  p('Nachreichen: Fehlergrund geloescht', !m2.fbGrund);

  /* ---------- 6. Laden und Mapping ---------- */
  graphAntwort = { value: [
    { id: '1', fields: { Title: 'Fehler', Meldung: 'A', Absender: 'X', AppVersion: '0.43.0', Erledigt: true,  Created: '2026-08-01T10:00:00Z' } },
    { id: '2', fields: { Title: 'Wunsch', Meldung: 'B', Absender: 'Y', AppVersion: '0.44.0', Created: '2026-08-05T10:00:00Z' } },
    { id: '3', fields: { Title: 'Frage',  Meldung: '',  Absender: 'Z' } },   // ohne Text -> raus
  ] };
  const geladen = await SPSync.feedbackLaden('tok');
  p('Laden: leere Meldungen fallen raus', geladen.length === 2);
  p('Laden: Erledigt fehlt -> gilt als offen', geladen[1].erledigt === false);
  p('Laden: Erledigt true wird uebernommen', geladen[0].erledigt === true);
  p('Laden: Created uebernommen', geladen[0].erstellt === '2026-08-01T10:00:00Z');

  /* ---------- 7. Reihenfolge: offen zuerst, darin neueste oben ---------- */
  const sortiert = Dashboard.rueckmeldungenSortiert([
    { text: 'alt offen',      erledigt: false, erstellt: '2026-08-01T10:00:00Z' },
    { text: 'erledigt neu',   erledigt: true,  erstellt: '2026-08-08T10:00:00Z' },
    { text: 'neu offen',      erledigt: false, erstellt: '2026-08-07T10:00:00Z' },
    { text: 'erledigt alt',   erledigt: true,  erstellt: '2026-08-02T10:00:00Z' },
  ]);
  p('Reihenfolge: offene zuerst',
    sortiert[0].text === 'neu offen' && sortiert[1].text === 'alt offen');
  p('Reihenfolge: erledigte danach, neueste oben',
    sortiert[2].text === 'erledigt neu' && sortiert[3].text === 'erledigt alt');
  const original = [{ text: 'a', erledigt: true, erstellt: '2026-08-01T10:00:00Z' },
                    { text: 'b', erledigt: false, erstellt: '2026-08-02T10:00:00Z' }];
  Dashboard.rueckmeldungenSortiert(original);
  p('Reihenfolge: Original bleibt unveraendert', original[0].text === 'a');
  p('Reihenfolge: leere Liste ist kein Fehler', Dashboard.rueckmeldungenSortiert(null).length === 0);

  /* ---------- 8. Issue-Link: alles kodiert ---------- */
  const heikel = { art: 'Fehler', von: 'Müller, Jörg', version: '0.44.0',
    erstellt: '2026-08-09T10:00:00Z',
    text: 'Karte & Route zeigen "Süd"\nZweite Zeile mit ?x=1' };
  const link = Dashboard.issueLink(heikel);
  p('Issue-Link: zeigt auf das richtige Repo',
    link.startsWith('https://github.com/nursing-education/sea-praxisbesuche/issues/new?title='));
  p('Issue-Link: genau ein unkodiertes & als Parametertrenner',
    (link.match(/&/g) || []).length === 1 && link.includes('&body='));
  p('Issue-Link: & aus dem Text ist kodiert', link.includes('%26'));
  p('Issue-Link: Zeilenumbruch ist kodiert', link.includes('%0A') && !/\n/.test(link));
  p('Issue-Link: Umlaut ist kodiert', !/[äöüÄÖÜß]/.test(link));
  p('Issue-Link: Anfuehrungszeichen kodiert', !link.includes('"'));

  /* Zurueckgelesen muss wieder der Originaltext herauskommen -- die Probe darauf,
     dass nichts verschluckt wurde. */
  const zurueck = decodeURIComponent(link.split('&body=')[1]);
  p('Issue-Link: Text kommt unverstuemmelt an', zurueck.startsWith(heikel.text));
  p('Issue-Link: Absender im Koerper', zurueck.includes('Müller, Jörg'));
  p('Issue-Link: App-Version im Koerper', zurueck.includes('0.44.0'));
  const titel = decodeURIComponent(link.split('?title=')[1].split('&body=')[0]);
  p('Issue-Link: Titel traegt die Art', titel.startsWith('Fehler: '));
  p('Issue-Link: Titel nur die erste Zeile', !titel.includes('Zweite Zeile'));

  const lang = Dashboard.issueLink({ art: 'Wunsch', text: 'W'.repeat(300) });
  const langTitel = decodeURIComponent(lang.split('?title=')[1].split('&body=')[0]);
  p('Issue-Link: langer Titel wird gekuerzt', langTitel.length <= 8 + 72);

  console.log(log.join('\n'));
  console.log('\n' + ok + '/' + (ok + fail) + ' Tests bestanden.');
  process.exit(fail ? 1 : 0);
})();
