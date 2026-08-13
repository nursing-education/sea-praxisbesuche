# Changelog – SEA Praxisbesuche

Versionen der App (`APP_VERSION` in `index.html`, in der Oberfläche als „vX.Y.Z"
sichtbar). Schema: Bugfix → letzte Stelle (0.28.2→0.28.3), neues Feature →
mittlere Stelle (0.28→0.29).

## v0.47.0 – 2026-08-13

**Scheibe 2 von vier.** Die Übersicht zeigt jetzt, was zu tun ist.

- **Die Startseite trägt Inhalt.** Bisher standen dort zwei Kacheln, die nur
  weiterleiteten – die Seite kostete einen Klick und gab nichts zurück. Jetzt
  steht darauf eine **Aufgabenliste**: nicht was der Fall ist, sondern was zu
  tun ist. Nichts davon wird gespeichert; alles wird bei jedem Zeichnen neu
  abgeleitet, und **Erledigtes verschwindet dadurch von selbst**.

- **Drei Aufgabenarten.** Für alle: **Einsatz läuft, kein Termin geplant** –
  der häufigste stille Ausfall. Niemand merkt, dass ein Besuch nie geplant
  wurde, bis der Einsatz vorbei ist. Für die Verwaltung zusätzlich: **Azubis
  ohne Bezugslehrkraft** und **offene Rückmeldungen**.

  Wer keine Adminrechte hat, sieht die beiden letzten nicht. Eine Aufgabe, die
  man nicht erledigen kann, ist keine Aufgabe.

- **Überfällige Besuche stehen bewusst nicht hier.** Sie sind nicht mehr zu
  retten und haben unter „Anstehend" bereits eine eigene Gruppe. Stünden sie
  auch auf der Übersicht, ginge das Dringende in Vergangenem unter. Ganz oben
  steht stattdessen, wo es **keinen weiteren Einsatz** dieses Pflichttyps mehr
  gibt („letzte Chance"), danach was zuerst endet.

- **Jede Zeile ist ein Knopf.** Der Termin-Fall öffnet **direkt** den
  Besuch-Dialog des betroffenen Einsatzes – ein Sprung in den Reiter würde
  bedeuten, die Zeile dort noch einmal zu suchen.

- **Der Besuch-Dialog nennt jetzt den Azubi.** Er tat es nie; solange man ihn
  nur von einer Karte aus öffnete, auf der der Name stand, fiel das nicht auf.

- Die Begrüßung „Willkommen, …" ist entfallen – der Name steht seit v0.46 in
  der Kopfzeile.

## v0.46.0 – 2026-08-13

**Scheibe 1 von vier** aus dem Navigations-Fahrplan. Die Inhalte der Seiten
bleiben, was sie waren – geändert hat sich nur, wie man zu ihnen kommt.

- **Eine durchgehende Leiste statt zweier Ebenen.** Bisher lagen Startseite,
  Dashboard und „Praxisbesuchsplaner" als drei getrennte Bereiche übereinander,
  und die Reiterleiste gehörte nur zum Planer – auf den anderen beiden war sie
  ausgeblendet. Die Startseite war damit keine Übersicht, sondern eine Weiche
  mit zwei Türen: Jedes Öffnen der Anwendung kostete einen Klick, bevor
  überhaupt Inhalt kam.

  Jetzt steht dieselbe Leiste auf jeder Seite, und alle Ziele sind
  gleichrangig: **Übersicht · Azubis · Anstehend · Touren · Einrichtungen**,
  rechts abgesetzt **Einstellungen** und **Verwaltung** (das frühere Dashboard).
  **Azubis steht neu vor Anstehend** – erst der Überblick, dann die Termine.

- **„Ich bin …" steht jetzt in der Kopfzeile**, mit dem gewählten Namen darauf.
  Dieser Wert entscheidet, wessen Azubis die ganze Anwendung zeigt, lag aber
  bisher als Auswahlliste in den Einstellungen und war beim Arbeiten nirgends zu
  sehen. Genau daran konnte sich der Fehler aus v0.44.1 so lange verstecken: Eine
  Liste, in der jemand fehlte, sah aus wie ein Datenproblem. Ist noch nichts
  gewählt, trägt der Knopf einen gestrichelten orangen Rahmen.

- **Aktualisieren steht ebenfalls in der Kopfzeile** und ist damit von überall
  erreichbar, nicht mehr nur aus den Einstellungen heraus. Beide Werkzeuge liegen
  außerhalb des Bereichs, der bei jedem Wechsel neu gezeichnet wird.

- **Entfallen:** der Knopf „← Zurück zur Startseite" in der Verwaltung. Er
  stammte aus der Zeit ohne durchgehende Leiste. Die Abschnitte „Ich bin …" und
  der Anmelde-Knopf sind aus den Einstellungen verschwunden – sie stehen oben.
  Die **Versionsnummer steht jetzt zusätzlich in den Einstellungen**, weil sie
  auf schmalen Schirmen aus der Kopfzeile weicht.

- Auf 390 px weichen Versionsnummer und die Wortmarken von Aktualisieren und
  Feedback; die Symbole und der gewählte Name bleiben. Im Browser geprüft: kein
  waagerechter Überlauf auf keiner der sieben Seiten.

## v0.45.0 – 2026-08-13

- **Der Sync lief unsichtbar.** Beim Öffnen der Anwendung holt sie automatisch
  den aktuellen Stand von SharePoint – das tut sie seit v0.20. Nur sagte sie es
  niemandem: Der Zustand „lädt …" wurde in ein Element geschrieben, das es
  **ausschließlich im Einstellungen-Reiter** gibt. In jeder anderen Ansicht fand
  die Anzeigefunktion es nicht und brach in der ersten Zeile wortlos ab.

  Beim Start steht man auf „Anstehend" oder der Startseite. Der automatische
  Sync dauert über fünf Sekunden und meldete sich dort **nie**. Wer das sah,
  hielt die Liste für fertig – und ging in die Einstellungen, um von Hand zu
  aktualisieren. Das war der einzige Ort, an dem die Anwendung überhaupt
  Auskunft gab.

  Neu: Ein schmaler Balken unter der Kopfzeile, solange etwas läuft, und in der
  Kopfzeile „Daten werden aktualisiert …" statt des alten Standes. Beides liegt
  **außerhalb** des Bereichs, der bei jedem Ansichtswechsel neu gezeichnet wird –
  dieselbe Bedingung, die seit v0.42 für die Fußzeile gilt. Danach steht dort
  wieder „Stand: …" mit dem neuen Zeitpunkt.

  Wer Bewegung im Betriebssystem abgestellt hat (`prefers-reduced-motion`),
  bekommt einen ruhenden Balken statt gar keiner Rückmeldung. Die Aussage „es
  läuft etwas" darf nicht an der Animation hängen.

  Die ausführliche Statuszeile in den Einstellungen bleibt unverändert.

- **7 Struktur-Tests in `tests/test_v045.js`.** Sie prüfen die Lage im Dokument –
  dass die Rückmeldung außerhalb des neu gezeichneten Bereichs liegt und im Code
  gesetzt wird, **bevor** die alte Abbruchzeile greift. Ob der Balken wirklich
  erscheint, entscheidet der Browser und gehört in die Abnahme.

## v0.44.2 – 2026-08-12

- **Der CSV-Import legte Einsätze mehrfach an.** Aus dem Testbetrieb gemeldet:
  Für einen Azubi standen alle Einsätze vierfach in der Liste `Einsaetze` –
  identisches „Von", identisches „Bis", identische Einrichtung. Bei drei
  Orientierungs-Zeiträumen also zwölf Einträge.

  Ursache: Der Import erkennt vorhandene Einträge am Startdatum wieder und
  aktualisiert sie, statt neu anzulegen. Dieser Abgleich lief aber nur gegen den
  **Bestand in SharePoint** – nicht gegen das, was im selben Durchgang gerade
  angelegt wurde. Enthält die CSV denselben Einsatz mehrfach, fand jede
  Wiederholung eine leere Vergleichsliste vor und legte neu an. Der Schutz gegen
  einen zweiten Upload funktionierte; der Schutz gegen eine doppelte Zeile in
  derselben Datei fehlte.

  Wiederholungen werden jetzt vor dem Schreiben verworfen. Verworfen wird nur,
  was in **allen vier** kennzeichnenden Feldern übereinstimmt – Von, Bis,
  Einsatztyp und Einrichtung. Zwei echte Einsätze mit gleichem Starttag, aber
  verschiedener Einrichtung bleiben damit beide erhalten.

  **Die Meldung nach dem Import sagt es jetzt:** „… 3 doppelte Zeile(n)
  übersprungen". Stilles Wegwerfen wäre genau der Fehlertyp, gegen den v0.40.2
  gebaut wurde – wer die Datei erzeugt hat, soll wissen, dass sie Wiederholungen
  enthielt.

  **Bereits entstandene Doppelungen räumt das nicht auf.** Ein erneuter Import
  derselben CSV bereinigt sie allerdings: Alles, was der neue Plan nicht mehr
  enthält, wird beim Hochladen entfernt.

## v0.44.1 – 2026-08-12

- **„Nur meine" verlor Azubis, die längst zugeordnet waren.** Im Testbetrieb
  gemeldet: Ein Azubi war einer Bezugslehrkraft zugeordnet, im Dashboard war die
  Zuordnung zu sehen – unter „Nur meine" fehlte er trotzdem. Er tauchte nur unter
  „Alle" auf.

  Ursache: In der Spalte `Bezugslehrer` steht `Nachname, Vorname (Zahl)`, wobei
  die Zahl die Kapazität ist. Der Filter verglich die **Rohwerte** samt Klammer.
  Die Auswahlliste unter Einstellungen nimmt den Wert aber aus der Stammliste
  `Bezugslehrende`, während am Azubi der Stand vom Zeitpunkt der Zuordnung steht.
  Ändert sich die Kapazität, sind das zwei verschiedene Zeichenketten – für den
  Menschen derselbe Name.

  Der Filter vergleicht jetzt über `Dashboard._blSchluessel`, also ohne die
  Klammer. Genau dieser Schlüssel wird seit v0.41 überall sonst benutzt; der
  Kommentar dort benennt das Problem seit damals wörtlich. Nur `Azubis.sichtbar()`
  war nie nachgezogen worden – deshalb zeigte das Dashboard die Zuordnung und
  die Azubi-Liste nicht.

  Die eigentliche Doppelung – Kapazität steckt im Namenstext *und* in der
  Stammliste – bleibt bestehen und ist als eigener Punkt vorgemerkt.

## v0.44.0 – 2026-08-09

- **Der Feedback-Knopf war ein Briefkasten ohne Leerung.** Eine Meldung landete
  in `state.meldungen[]` auf dem Gerät der meldenden Person und kam nur an, wenn
  jemand von sich aus die Daten exportierte. Jetzt geht sie in die
  SharePoint-Liste `Feedback` – dieselbe Anmeldung, dieselbe Verbindung, die die
  Anwendung ohnehin benutzt. Kein neues Konto, kein neuer Empfänger.

  **Der lokale Eintrag bleibt trotzdem bestehen.** Er ist nicht bloß eine Kopie,
  sondern der Nachfass-Weg: Scheitert das Schreiben – kein Netz, keine
  Anmeldung –, bleibt die Meldung als offen markiert liegen und geht beim
  nächsten Sync mit raus.

  Der Dialog sagte bisher „Kein automatischer Versand". Das wäre jetzt eine
  Falschaussage und ist ersetzt. Und wenn das Schreiben scheitert, steht es
  ausdrücklich da: „liegt vorerst nur auf diesem Gerät". Nach der Lehre aus
  v0.40.2 – sichtbar falsch ist besser als still falsch.

- **Rückmeldungen im Dashboard, nur für Administratoren.** Offene zuerst, darin
  die neuesten oben; erledigte rutschen nach unten, verschwinden aber nicht –
  ein verschwundener Eintrag sähe aus wie ein Datenverlust. Abgehakt wird direkt
  in SharePoint über die Spalte `Erledigt`; die Anwendung zeigt nur an.

- **Knopf „Als Issue anlegen" an jeder Rückmeldung, nur für Administratoren.**
  Er öffnet GitHub mit vorausgefülltem Titel und Text. **Kein Zugriffsschlüssel
  und kein API-Aufruf** – nur eine Adresse mit Parametern. Ein Schlüssel in einer
  reinen Browser-Anwendung wäre für jeden lesbar, der den Quelltext öffnet; das
  ist keine Frage der Sorgfalt, sondern der Bauart.

- **Die Datenschutzerklärung nennt GitHub jetzt.** Nicht in der Tabelle der
  Kartendienste, sondern als eigener Abschnitt: Diese Adresse wird nur auf
  ausdrücklichen Klick und nur von Administratoren aufgerufen, beim gewöhnlichen
  Benutzen der Anwendung nie. Aufgefallen ist die Lücke durch den Test aus
  v0.42, der jeden Laufzeit-Host der `index.html` gegen die Erklärung prüft.

## v0.43.0 – 2026-08-09

- **Notbremse für schmale Schirme.** Auf einem Handy war die Anwendung bisher
  nicht bedienbar: Die zweite Spalte des Hauptbereichs fiel auf **0 px**
  zusammen (gemessen: `340px 0px`), weil die feste erste Spalte mit 340 px plus
  Abstände breiter ist als ein 390-px-Bildschirm. Unter 700 px stehen die
  Spalten jetzt untereinander, Kopfzeile und Reiterleiste brechen um, breite
  Tabellen scrollen in sich selbst statt die ganze Seite zu schieben.

  Das ist ausdrücklich **keine Handy-Ansicht**, nur die Reparatur des
  Überlaufens – nichts wird schön, aber alles ist erreichbar. Der Zuschnitt der
  eigentlichen Handy-Ansichten steht in `spec/smartphone.md`.

- **Die Einführungs-Sprechblase stand nicht dort, wo sie sollte.** In ihrer
  zentrierten Variante hat sie sich per `transform: translate(-50%,-50%)` in die
  Mitte geschoben – die Einblend-Animation endet aber auf `transform: none` und
  wirkt nach (`fill-mode: both`), womit diese Verschiebung wieder verloren ging.
  Die Blase stand dadurch immer um ihre halbe Breite zu weit rechts. Auf breiten
  Schirmen blieb sie trotzdem im Bild, bei 390 px ragte sie 164 px heraus.
  **Auch auf dem Desktop sitzt sie jetzt anders – nämlich richtig.**

- **Die Sprechblase kann nicht mehr aus dem Bild rutschen.** Findet sie neben
  ihrem Ziel nirgends genug Platz, wich sie bisher ungeklemmt aus, um das Ziel
  nicht zu verdecken – bei wenig Platz landete sie außerhalb des Bildschirms und
  war nicht mehr antippbar. Jetzt bleibt sie im sichtbaren Bereich, auch wenn sie
  dabei ihr Ziel überlappt: Eine unerreichbare Blase wiegt schwerer als ein
  verdecktes Eingabefeld.

## v0.42.0 – 2026-08-03

- **Rechtliches: Fußzeile, Impressum und Datenschutzerklärung.** Unter der
  Anwendung steht jetzt eine Zeile mit **Impressum** und **Datenschutz**. Beide
  Seiten liegen **in der Anwendung selbst** (`impressum.html`, `datenschutz.html`)
  und sehen aus wie sie.

  **Warum nicht verlinkt:** Zuerst zeigten die Links auf die zentralen Seiten von
  `percursus.de`. In der Abnahme fiel auf, dass man damit mitten in eine fremde
  Website mit fremdem Layout springt und sich dort verläuft. Ein Impressum soll
  über die Anwendung Auskunft geben, nicht wegführen.

  **Der Urheberrecht-Link ist entfallen.** Die Seite dort stellt *Lerninhalte*
  unter CC BY-NC-SA – diese Anwendung ist Software, für die das nicht gilt. Der
  Link hätte also etwas Falsches behauptet. Was tatsächlich gilt, steht jetzt als
  Abschnitt im Impressum, zusammen mit der lizenzpflichtigen Nennung von
  OpenStreetMap (ODbL).

  Das Impressum enthält **bewusst keine Telefonnummer**. § 5 DDG verlangt einen
  Weg zur unmittelbaren Kommunikation; der EuGH lässt E-Mail allein genügen, wenn
  ein zweiter schneller Weg besteht – der Nutzerkreis sind Kolleginnen und
  Kollegen. Die Begründung steht als Kommentar an der Stelle, an der die Zeile
  stünde.

  **Neu: `datenschutz.html`** neben der `index.html`. Sie benennt jeden Empfänger,
  den die Anwendung tatsächlich anspricht – am Code nachgemessen, nicht geschätzt:
  `login.microsoftonline.com` (Anmeldung), `graph.microsoft.com` (die
  SharePoint-Listen samt Azubi-Daten), `*.tile.openstreetmap.org`,
  `nominatim.openstreetmap.org` und `router.project-osrm.org` (Karte und Routen –
  diese drei erhalten die IP-Adresse) sowie Hostinger als Hoster.

  Ebenfalls beschrieben: die Speicherung auf dem Gerät (IndexedDB
  `sea-praxisbesuche` und das Microsoft-Token im `localStorage`) – keine Cookies,
  nach § 25 Abs. 2 Nr. 2 TDDDG einwilligungsfrei, weil ohne sie die Anwendung
  nicht funktioniert.

  Kein Verhalten der Anwendung geändert; die Fußzeile fügt kein Skript hinzu.

- **Kopfdaten der `index.html`.** Eine Kurzbeschreibung (`meta description`) und
  `robots: noindex, nofollow` – die Anwendung liegt hinter der Microsoft-Anmeldung
  und gehört in keinen Suchindex. Die Datenschutzerklärung hat eine eigene
  Beschreibung und bleibt indexierbar.

- **Drei Schritte für Screenreader**, ohne sichtbare Änderung:
  - Der **offene Reiter** trägt jetzt `aria-current="page"` und nicht mehr nur eine
    Farbe. Wer nicht sieht, wusste bisher nicht, wo er ist. Die Markierung sitzt in
    der neuen Funktion `reiterMarkieren()` – sie wird an drei Stellen gebraucht und
    lief sonst auseinander.
  - Der **Dialog** ist als `role="dialog"` mit `aria-modal="true"` ausgewiesen.
    Eine Fokusfalle (Tab bleibt im Dialog) fehlt weiterhin – das wäre eine
    Verhaltensänderung und gehört in eine eigene Scheibe.
  - Die **Meldungen unten** (`role="status"`) werden angesagt, statt nur
    aufzublitzen. Betrifft beide Toast-Bauformen, sie teilen sich ein Element.

- **Wer die Daten einsehen kann** – steht jetzt in der Erklärung, weil es
  nachgeprüft wurde: Der Sync holt jede Liste vollständig, die Einschränkung
  passiert erst im Browser. Wer Leserecht auf der SharePoint-Site hat, sieht den
  gesamten Bestand; „Nur meine / Alle" ordnet die Anzeige und ist **keine
  Zugriffsgrenze**. Eine serverseitige Filterung kann eine reine Browser-App
  nicht leisten – die wirksame Kontrolle sind die Site-Berechtigungen.

- **21 Tests in `tests/test_v042.js`** (gesamt 426). Der wichtigste leitet die
  Liste der Empfänger **aus der `index.html` ab**, statt sie fest zu verdrahten:
  Jeder Host, den die App zur Laufzeit anspricht, muss in der Erklärung
  vorkommen. Wer künftig einen Dienst einbaut und die Erklärung vergisst,
  bekommt einen roten Test statt einer stillen Lücke.

### Zur Entstehung

Diese Version entstand **zweimal unabhängig** – am 31.07. in einer Cloud-Session
als Dialoge in der App, am 03.08. lokal als Fußzeile mit externen Links und
eigener Seite. Beide Stränge sind hier zusammengeführt.

Ausschlaggebend war eine Frage, die kein Code beantwortet: **Anbieter nach
§ 5 DDG ist Christian privat, nicht die Akademie** (entschieden 31.07.,
bestätigt 03.08.2026). Damit gilt das Impressum auf `percursus.de`, und die
Fassung vom 31.07., die auf die Träger-Seiten verwies, trug nicht mehr. Ihr
Modul `Rechtliches` mit den Impressum-Datenfeldern ist deshalb entfallen –
**ihre Substanz nicht:** der abgeleitete statt abgeschriebene Datenschutztext,
der Befund zum Zugriffsmodell und die Test-Idee, die Dienste-Liste gegen stilles
Verschwinden zu sichern.

## v0.41.1 – 2026-07-30

- **Abwesenheit parkt die Azubis, statt sie einer Vertretung aufzuhalsen.** Korrektur
  an v0.41.0, noch vor dessen Browser-Abnahme. Zwölf Azubis geschlossen auf eine
  Person zu schieben ist fast immer falsch – jetzt landen sie in **„Ohne Zuordnung"**
  und lassen sich dort einzeln an die passenden Kolleg:innen verteilen.

  **Neu in der Liste `Azubis`:** die Spalte `ParkendBei` (Text) – Name der abwesenden
  Lehrkraft, zu der dieser Azubi zurückgehört.

  **Der Marker.** Jede Kachel eines geparkten Azubis trägt „⏸ wartet auf X" – auch
  dann, wenn er zwischenzeitlich jemand anderem zugeordnet wurde. So ist überall
  sichtbar, wer nur geliehen ist und später zurückgeht.

  **„Als abwesend melden"**: Die Vertretung wird weiterhin ausgewählt und in
  `VertretungDurch` vermerkt, bekommt die Azubis aber **nicht** – sie ist
  Ansprechpartnerin während der Abwesenheit. Damit entfällt die Kapazitätsvorschau:
  die Auslastung der Vertretung ändert sich durch die Abwesenheit nicht mehr.

  **„Ist zurück" holt jetzt alle zurück** – die geparkten wie die zwischenzeitlich
  weitergegebenen. Hinter jedem Namen steht, wo er gerade liegt; wer bei einer
  dritten Lehrkraft sitzt, wird zusätzlich oberhalb der Liste gezählt. Abwählen
  lässt ihn dort. Die Park-Marke wird in beiden Fällen gelöscht – die Abwesenheit
  ist vorbei, ein weiter wartender Marker wäre eine Falschaussage.

  **Warum eine eigene Spalte und nicht `VorherigerBezugslehrer`?** Der merkt nur
  *eine* Station. Gibt man einen geparkten Azubi an eine dritte Lehrkraft weiter,
  ist „X" dort überschrieben – danach weiß kein Feld mehr, dass er zu X gehört, und
  er käme nie zurück. `ParkendBei` bleibt stehen, bis „Ist zurück" es leert.

  **Nebenbefund aus v0.41.0:** Abnahmepunkt 5 („Azubi von der Vertretung an eine
  dritte Lehrkraft hängen → muss unter ‚liegen inzwischen bei jemand anderem'
  auftauchen") hätte im Browser nicht funktioniert. Nach dem Weitergeben ist der
  Vorgänger die Vertretung, nicht mehr die abwesende Lehrkraft – der Azubi wäre in
  keiner der beiden Listen aufgetaucht. Der Test dazu war grün, weil er einen
  Zustand von Hand setzte, der auf diesem Weg nicht entsteht. Mit `ParkendBei` ist
  der Fall erledigt.

  **Unverändert:** Ohne wählbare Vertretung lässt sich die Abwesenheit weiterhin
  nicht melden – die Vertretung bleibt Pflichtangabe.

## v0.41.0 – 2026-07-29

- **Vertretung bei längerer Abwesenheit.** Fällt eine Lehrkraft länger aus, lassen
  sich ihre Azubis in einem Zug an eine Vertretung übergeben – und beim Zurückkommen
  in einem Zug zurückholen.

  **Neu in der Liste `Bezugslehrende`:** die Spalten `Abwesend` (Ja/Nein) und
  `VertretungDurch` (Text). `Abwesend` ist unabhängig von `Aktiv`: aktiv und
  abwesend heißt „gehört dazu, ist gerade nicht verfügbar".

  **Der eigentliche Kern ist eine Bedingung im Filter „Freie Kapazität":** Wer
  abwesend ist, erscheint dort nicht mehr. Ohne das schlägt die Verteilung genau
  die Lehrkraft vor, die gerade ausfällt – sie steht dort sogar ganz oben, weil ihre
  Azubis bei der Vertretung liegen und ihr Ist damit 0 ist. In „Alle" und über die
  Suche bleibt sie sichtbar, Ist/Soll und Ampel bleiben unverändert: 0 / 25 ist bei
  ihr die Wahrheit, falsch war nur der Filter.

  **„Als abwesend melden"** (⋮-Menü, nur Admin): Vertretung auswählen, darunter eine
  Vorschau mit den **Namen** der betroffenen Azubis und der Kapazitätsfolge bei der
  Vertretung. Überbuchen bleibt erlaubt, wird aber genannt. Erst werden die Azubis
  umgehängt, dann wird die Abwesenheit gesetzt – kommt kein einziger Azubi an, steht
  die Lehrkraft nicht als „vertreten durch X" da.

  **„Ist zurück"**: Namensliste mit Häkchen, alle vorausgewählt. Zurückgeholt wird
  nur, wer **bei der Vertretung liegt und von dieser Lehrkraft kam**. Ein Azubi, der
  zwischenzeitlich bewusst an eine dritte Lehrkraft ging, wird **nicht** stumm
  zurückgezogen, sondern oberhalb der Liste namentlich genannt. Abgewählte bleiben,
  wo sie sind; die Abwesenheit endet trotzdem.

  **Die Zeile zeigt „abwesend · vertreten durch X"** als dritte Status-Pille und wird
  beim Zuordnen gedimmt wie eine volle Lehrkraft. Zuordnen bleibt möglich – bewusstes
  Überstimmen.

  **Bekannte Grenzen, bewusst:** Verkettete Vertretung (die Vertretung fällt selbst
  aus) wird nur sichtbar gemacht, nicht aufgelöst – das Gedächtnis ist einstufig.
  Kein „abwesend bis"-Datum, keine Historie, kein Genehmigungsweg. Ein Gruppenvorgang
  schreibt je Azubi einzeln und zeichnet dazwischen neu; bei vielen Azubis dauert das
  entsprechend.

## v0.40.6 – 2026-07-28

- **Die eingebetteten Fremd-Libraries liegen jetzt in `vendor/`.** MSAL, Leaflet
  (JS + CSS) und jsPDF waren als minifizierter Code direkt in `index.html`
  einkopiert und machten dort rund 70 % der Datei aus. Sie stehen jetzt als
  eigene Dateien in `vendor/` und werden über `<script src="…">` bzw.
  `<link href="…">` geladen – in exakt derselben Reihenfolge wie zuvor.

  **Funktional ändert sich nichts.** Weiterhin kein Build-Schritt, weiterhin kein
  CDN (im Schulnetz gesperrt), weiterhin lokal lauffähig – der Ordner `vendor/` muss
  dabei neben der `index.html` liegen. Die Versionsnummer steigt, weil sich die
  ausgelieferte Datei substanziell ändert und im Fehlerfall („Karte lädt nicht")
  erkennbar sein muss, welcher Stand läuft.

  Damit ist die Bezeichnung „Single-File-App" nicht mehr zutreffend und in `README.md`
  und `CLAUDE.md` ersetzt. Dort steht jetzt auch, dass ein Test **mit** Microsoft-Login
  über `http://localhost:8000/` laufen muss – unter `file://` schlägt er fehl, weil
  `file://` keine registrierbare Redirect-URI ist.

  Nutzen: `index.html` schrumpft von rund 1.140.000 auf 345.000 Zeichen. Damit
  wird die Datei für Mensch und Werkzeug wieder lesbar, und die Library-Versionen
  sind am Dateinamen ablesbar statt in einem Kommentar zu stehen.

## v0.40.5 – 2026-07-28

- **Das selbst gesetzte Ziehbild aus v0.40.4 ist zurückgenommen.** Es hat das blasse
  Ziehbild beim Ziehen aus der Zuordnungs-Spalte nicht behoben und dabei den Greifpunkt
  verschoben: Die Kachel hing anschließend immer an der linken oberen Ecke statt an der
  Stelle, an der man sie gegriffen hat. Damit war die Erklärung widerlegt, der Scrollbereich
  der Spalte (`position:sticky` + `overflow-y:auto`) sei die Ursache – ein Klon am
  Seitenrumpf kennt diesen Bereich nicht und wurde trotzdem blass dargestellt.

  Der ursprüngliche Punkt bleibt **offen und bekannt**: Beim Ziehen aus der linken Spalte
  ist das Ziehbild durchscheinend und unsauber berandet, beim Ziehen einer Kachel unter
  einer Lehrkraft nicht. Rein optisch, das Ziehen selbst funktioniert in beide Richtungen.
  Zurückgestellt, bis die Ursache belegt ist – zwei ungeprüfte Erklärungen haben gereicht.

## v0.40.3 – 2026-07-28

Aus der Browser-Abnahme von v0.40.1.

- **Fix: Der Umschalter „Kacheln: Kurs / Haus / Name" blieb optisch stehen.** Die
  Reihenfolge änderte sich sofort, aber die blaue Markierung sprang erst beim nächsten
  vollen Neuaufbau auf den geklickten Knopf – der Klick zeichnete nur die Tabelle neu,
  und die Umschalter stehen davor in der Werkzeugzeile. Jetzt zeichnet er voll neu wie
  die beiden Umschalter darüber; die aufgeklappten Zeilen bleiben dabei offen.
- **Kursfarben treffen sich nicht mehr.** Der Farbton kam aus einer Quersumme über den
  Kursnamen und wurde auf acht feste Farben abgebildet – bei drei Kursen kollidierte rund
  jeder dritte Fall, in der Abnahme trafen sich „PFK T 041" und „PflAss 12". Jetzt
  entscheidet der Rang im Kursverzeichnis: Alle vorkommenden Kurse werden gleichmäßig
  über den Farbkreis verteilt, der Abstand ist damit garantiert statt erhofft. Kommt ein
  Kurs dazu, rücken die Töne nach.
- **Kursfarbe als Fläche statt als Kante.** Die Kachel trägt einen hellen Kurston, der
  Name sitzt in einem kräftigeren Balken darin. Die dünne Farbkante links entfällt: Sie
  war zu schmal, um zu gruppieren, und ließ zusammen mit dem fetten Namen die Hierarchie
  gegenüber der Lehrkraft-Zeile kippen.

## v0.40.2 – 2026-07-26

- **Fix: halb gelungene Schreibvorgänge waren unsichtbar.** Lehnt SharePoint eine Spalte
  des PATCH ab, wiederholt die App ihn seit v0.40 ohne dieses Feld – die Zuordnung wird
  gespeichert, der vorherige Bezugslehrer nicht. Dieses Nachfassen war **stumm**: kein
  Log, kein Hinweis. Die App behauptete vollen Erfolg, obwohl die Hälfte verschluckt
  wurde. Genau dieser Fehlertyp blieb beim `BesuchStatus` wochenlang unbemerkt – und die
  Vertretung in v0.41 greift ausgerechnet auf diesen Merker zurück.
  Der interne Name von `VorherigerBezugslehrer` ist inzwischen bestätigt
  (Listeneinstellungen, 26.07.2026); der Weg bleibt als Vorsorge bestehen, weil eine
  Spalte umbenannt werden kann.
  - **Meldung nach dem Handgriff:** Der Toast trägt jetzt „· Vorgänger nicht gemerkt".
    „· noch nicht in SharePoint" hat weiter Vorrang – kam gar nichts an, ist das der
    schwerere Fall.
  - **Stehender Hinweis** über dem Bereich „Bezugslehrende" (nur für Admins), solange
    eine Spalte abgelehnt wird: nennt die Spalte, die Zahl betroffener Azubis und den
    nächsten Schritt (internen Feldnamen in den Listeneinstellungen prüfen). Er bleibt
    auch nach einem Sync stehen, der die Azubi-Markierungen entfernt – die abgelehnte
    Spalte ist dadurch nicht in Ordnung. Ein später gelungener voller Schreibvorgang
    löscht ihn.
  - Neu: `Dashboard.schreibHinweis()` (Zusatz zur Meldung, ersetzt ein Ternär in der
    Oberfläche) und `Dashboard.schreibDefektMeldung()` (Text des stehenden Hinweises),
    neues State-Feld `schreibDefekt`, neues Azubi-Feld `vorgaengerOffen`.
  - `tests/test_v040.js`: 23 neue Tests (Abschnitt 9), insgesamt 94.

## v0.40.1 – 2026-07-26

- Zuordnungs-Spalte zeigt beim Ziehen eine eigene Ablagefläche („Hierher ziehen:
  Zuordnung aufheben") – vorher musste man die Infozeile treffen.
- Aufgeklappte Azubi-Kacheln sind nach Kurs sortiert (umschaltbar auf Trägerhaus oder
  Name) und tragen eine Farbkante je Kurs.
- Azubis ohne Zuordnung zeigen, von welcher Lehrkraft sie zuletzt kamen.

## v0.40.0 – 2026-07-26
- **Zuordnungs-Bereich zweispaltig.** Unzugeordnete Azubis stehen links in einer
  eigenen Spalte mit Suche und Sortierung (Trägerhaus oder Name), die beim Scrollen
  stehen bleibt. Unter etwa 1200 px Fensterbreite Rückfall auf die bisherige Leiste
  über der Tabelle.
- **Kacheln je Lehrkraft.** Ein Chevron klappt die zugeordneten Azubis einer
  Lehrkraft als Kacheln auf. Kacheln lassen sich per Drag-and-Drop auf eine andere
  Lehrkraft ziehen oder in die Spalte zurückgeben; der aufgeklappte Kachel-Block ist
  selbst Drop-Ziel seiner Lehrkraft. Ein Klick auf eine Kachel tut bewusst nichts.
- **Auto-Scroll und Dimmen beim Ziehen.** Die Seite scrollt am Fensterrand
  automatisch weiter; volle Lehrkräfte werden beim Zuordnen und beim Ziehen gedimmt.
- **„Rückgängig" statt Rückfrage.** Zuordnen, Umhängen und Entfernen laufen jetzt
  über eine Meldung mit „Rückgängig" statt einer Rückfrage vorab. Scheitert die
  SharePoint-Übertragung, trägt dieselbe Meldung den Hinweis „noch nicht in
  SharePoint".
- **Vorheriger Bezugslehrer wird gemerkt.** Das neue Feld `VorherigerBezugslehrer`
  wird gelesen und bei jeder Zuordnungsänderung mitgeschrieben – auch beim Entfernen
  einer Zuordnung (Grundlage der Vertretung in v0.41).
- **Kachel steht sofort am neuen Platz.** Die Ansicht wird schon nach dem lokalen
  Speichern aktualisiert, nicht erst nach der Antwort von SharePoint. Bei langsamer
  Verbindung sprang die gezogene Kachel vorher sekundenlang an ihren alten Platz
  zurück. Die Meldung mit „Rückgängig" erscheint unverändert erst danach.
- **Zuordnung geht nicht mehr verloren, wenn das neue Feld nicht angenommen wird.**
  Der interne SharePoint-Name von `VorherigerBezugslehrer` ist nicht verifiziert.
  Lehnt SharePoint den Schreibvorgang ab, wird er einmal ohne dieses Feld wiederholt –
  die Zuordnung selbst wird dann gespeichert, nur der Vorgänger nicht gemerkt.
- `tests/test_v040.js`: 62 neue Tests.

## v0.39.1 – 2026-07-25
- **Fix: Archivierte Lehrkräfte ohne Azubis waren unauffindbar.** `Dashboard.auslastung()`
  ergänzte Lehrkräfte aus der Stammliste, die noch keine Azubis haben, nur wenn sie
  aktiv waren. Eine archivierte Lehrkraft ohne Azubis kam dadurch über keinen der
  beiden Wege in die Liste – weder über die Azubi-Gruppierung noch über diese
  Ergänzung – und war damit auch im Filter „Archivierte" und in der Suche unsichtbar.
  Reaktivieren war für solche Lehrkräfte über die Oberfläche unmöglich. Der Fehler
  steckt der Sache nach seit v0.36 im Code; v0.39 hat ihn nur leichter auslösbar
  gemacht, weil Archivieren dort vom versteckten Häkchen im Bearbeiten-Dialog zu
  einem eigenen Menüpunkt wurde. Behoben durch `Bezugslehrer.alle()` statt
  `Bezugslehrer.aktive()`.
- **CSV-Import in die Kopfzeile verschoben.** Steht jetzt rechtsbündig in derselben
  Zeile wie „← Zurück zur Startseite" statt in einem eigenen Verwaltungs-Abschnitt,
  der für Admins sonst nur noch eine Überschrift ohne weiteren Inhalt enthielt.
- **Zuordnungs-Modus bleibt beim Scrollen sichtbar.** Ist ein Azubi zum Zuordnen
  gewählt, zeigt der Mauszeiger über den Lehrkraft-Zeilen jetzt `cursor:copy` – der
  Hinweistext oben in der Tabelle ist beim Scrollen durch eine lange Liste sonst
  schnell aus dem Blick.

## v0.39.0 – 2026-07-25
- **Zeilen-Aktionen im Drei-Punkte-Menü (⋮).** Bearbeiten und Löschen standen als zwei
  Knöpfe offen in jeder Zeile – bei 40 Lehrkräften 80 Knöpfe, die vom Wesentlichen
  ablenkten. Beides liegt jetzt hinter einem ⋮ am Zeilenende; gefährliche Punkte sind
  abgesetzt und rot. Es ist immer höchstens ein Menü offen, Klick daneben oder `Esc`
  schließt.
  - **Archivieren ist ein eigener Menüpunkt** (bisher nur als Häkchen im Bearbeiten-
    Dialog versteckt) und heißt bei archivierten Lehrkräften „Reaktivieren".
  - Bei **Einrichtungen** dasselbe Menü mit Bearbeiten/Löschen – **ohne** Archivieren:
    Für diese Liste gibt es keinen Schreibweg nach SharePoint, ein solcher Knopf würde
    nur lokal wirken und beim nächsten Sync verpuffen.
  - Lehrkräfte, die nur als Text am Azubi hängen („nicht in Stammliste"), haben
    weiterhin kein Menü – es gibt nichts zu bearbeiten.
  - Neu: `Dashboard.lehrkraftAktionen()` / `einrichtungAktionen()` (welche Punkte),
    `Oberflaeche._aktionsMenueHtml()` / `_aktionsMenueVerdrahten()` (Darstellung).
    18 neue Tests (`tests/test_v039.js`).
- **Fix: Teil-Änderung an einer Lehrkraft löschte Kapazität und Stellenumfang.**
  `SPSync.lehrerAendern` schrieb beide Felder bedingungslos in den PATCH. Wer nur
  einen Wert ändern wollte (wie jetzt der Archivieren-Menüpunkt), hätte die Kapazität
  in SharePoint auf `null` gesetzt. Ausgelassene Felder bleiben jetzt unberührt; ein
  leerer Wert („") leert das Feld weiterhin gezielt. Der bestehende Bearbeiten-Dialog
  übergibt immer alle Felder und war deshalb nie betroffen.
- **Verwaltung steht im Dashboard jetzt oben.** Seit dem Umbau in v0.37 lag der
  Abschnitt hinter der Lehrkraft-Tabelle – bei 40 Zeilen scrollte man an allen vorbei,
  um eine CSV zu importieren.

## v0.38.0 – 2026-07-24
- **Feature: Trägerhaus beim Zuordnen sichtbar.** Beim Verteilen neuer Azubis fehlte die
  fachlich entscheidende Information – aus welchem Haus kommt der Azubi, und welche
  Lehrkraft betreut dieses Haus ohnehin schon? Beides ist jetzt da:
  - **Azubi-Chips** zeigen neben dem Kurs die **Stammeinrichtung** (Trägerhaus,
    `field_2`). Fehlt sie, steht dort „Trägerhaus fehlt" statt einer stillen Lücke.
  - Neue Spalte **„Trägerhaus (Schwerpunkt)"** je Lehrkraft: das Haus, aus dem die
    meisten ihrer Azubis kommen, mit Anteil („St. Elisabeth 5 / 7" = 5 von 7 Azubis).
    Der Hover nennt die Zahl der verschiedenen Häuser und fehlende Angaben.
  - Die **Suche greift zusätzlich auf das Schwerpunkt-Haus** – über den Hausnamen findet
    man direkt die Lehrkräfte, die dort betreuen. Feld heißt jetzt „Lehrkraft oder
    Trägerhaus suchen…".
  - Bei Gleichstand entscheidet die alphabetische Reihenfolge, damit die Anzeige nicht je
    nach Einlesereihenfolge springt. Azubis ohne Haus-Angabe zählen in die Gesamtzahl,
    erzeugen aber keinen Schwerpunkt; hat eine Lehrkraft nur solche Azubis, bleibt die
    Spalte leer statt einen Wert zu erfinden. Unterschiedliche „(Zahl)"-Suffixe am selben
    Namen werden zusammengefasst.
  - Neu: `Dashboard.einrichtungsSchwerpunkte()`; `lehrkraftZeilen()` liefert zusätzlich
    `einrichtung`. 20 neue Tests (`tests/test_v038.js`).

## v0.37.0 – 2026-07-24
- **Umbau: Dashboard nach Aufgabe statt nach Entstehungsgeschichte – „eine Lehrkraft,
  eine Zeile".** Dieselbe Lehrkraft stand bisher in **drei** Abschnitten: im Zuordnungs-
  Board (v0.34, rechte Spalte), in der Bezugslehrer-Verwaltung (v0.35/36) und in der
  Auslastungs-Tabelle (v0.26). Name und Kapazität erschienen dreifach, Ist-Zahl und Ampel
  doppelt – bei 40 Lehrkräften also dreimal dieselben 40 Namen untereinander. Wer
  bearbeiten wollte, suchte in Tabelle 2; wer die Auslastung sehen wollte, in Tabelle 3;
  wer zuordnen wollte, im Board.
  - Die drei Abschnitte sind jetzt **ein Arbeitsbereich „Bezugslehrende"**: pro Lehrkraft
    eine Zeile mit Name · Stellenumfang · Azubis (Ist/Soll) · Auslastung mit Balken und
    Ampel · Status · Bearbeiten/Löschen. Diese Zeile ist zugleich **Ziel der Zuordnung**
    (Klick oder Drag-and-Drop) – die frühere zweite Board-Spalte entfällt damit ersatzlos.
  - **Zuordnungs-Leiste** oben im Bereich: unzugeordnete Azubis als Chips statt als eigene
    Spalte. Neue **KPI-Kachel „ohne Zuordnung"** (Admin) macht offene Arbeit schon ganz
    oben sichtbar und springt per Klick in den Bereich – ersetzt die Dauer-Sichtbarkeit
    des Boards aus v0.36.1.
  - **Suche, Filter und Sortierung** (bei 40 Lehrkräften nötig): Filter „Alle / Freie
    Kapazität / Überlastet / Archivierte" und Sortierung nach Auslastung oder Name.
    Der Filter „Freie Kapazität" beantwortet die häufigste Frage beim Zuordnen direkt.
    Die Suche zeichnet nur die Tabelle neu, damit der Fokus im Suchfeld bleibt.
  - Beim Zuordnen werden Lehrkräfte **ohne freie Kapazität gedimmt** – Überbuchen bleibt
    möglich, passiert aber nicht mehr unbemerkt.
  - Lehrkräfte, die nur als Text an den Azubis hängen und **nicht in der Stammliste**
    stehen, werden als solche markiert (statt stillschweigend mitzulaufen) und sind
    folgerichtig nicht bearbeitbar.
  - **Nur-Lese-Rolle unverändert:** Nicht-Admins sehen dieselbe Tabelle ohne Zuordnungs-
    Leiste, ohne Aktionsspalte und ohne „Neue Lehrkraft".
  - Neu: `Dashboard.lehrkraftZeilen()` (verbindet Auslastung mit der Stammliste) und
    `Dashboard.lehrkraftFiltern()` (Suche/Filter/Sortierung, rein funktional).
    `Dashboard.auslastung()` bleibt bewusst unverändert. 29 neue Tests
    (`tests/test_v037.js`); alle bestehenden Suiten unverändert grün.
  - Nebenbei korrigiert: Der Hinweis unter der alten Auslastungs-Tabelle behauptete noch,
    das Soll komme aus der „(Zahl)" am Bezugslehrer-Namen – seit v0.36 führt die Liste.

## v0.36.1 – 2026-07-24
- **Fix/UX: Zuordnungs-Board für Admins immer sichtbar.** Vorher erschien das Board nur,
  wenn mindestens ein Azubi ohne Bezugslehrer:in war – dadurch war es nicht auffindbar,
  wenn gerade alle zugeordnet waren. Jetzt ist es dauerhaft im Dashboard sichtbar; sind
  alle zugeordnet, zeigt die linke Spalte „Alle Azubis sind zugeordnet ✓" und der Hinweis
  passt sich an.

## v0.36.0 – 2026-07-24
- **Feature (Scheibe 1b): Bezugslehrer-Liste an Auslastung/Board angebunden + bearbeiten/
  löschen (Admin).**
  - **Kapazität kommt jetzt aus der Stammliste** (`Dashboard.soll()` bevorzugt die
    Kapazität aus „Bezugslehrende", Fallback auf die alte „(Zahl)"-Ableitung).
  - **`Dashboard.auslastung()` ergänzt aktive Lehrkräfte ohne Azubis** → sie erscheinen im
    Zuordnungs-Board (rechte Spalte) und im „Ich bin …"-Dropdown, auch bevor ihnen jemand
    zugeordnet ist (behebt die v0.34-Grenze). Zuordnen schreibt den kanonischen Wert
    „Name (Kapazität)". Bestehende Azubi-Zeilen bleiben unverändert (rein additiv).
  - **Bearbeiten + Löschen** in der Bezugslehrer-Verwaltung: Dialog jetzt auch zum Ändern
    (Name/Stellenumfang/Kapazität) und **Archivieren** (Aktiv-Häkchen). Löschen ist
    geschützt – nur ohne zugeordnete Azubis möglich, sonst Hinweis „erst neu zuordnen oder
    archivieren".
  - Neu: `SPSync.lehrerAendern`/`lehrerLoeschen`, `Bezugslehrer.wertFuer`/`azubiAnzahl`/
    `aendern`/`loeschen`. 15 neue Tests (`tests/test_v036.js`); bestehende Auslastungs-Tests
    unverändert grün.

## v0.35.1 – 2026-07-24
- **Fix: korrekter Name der SharePoint-Liste.** Die Lehrkräfte-Liste heißt in SharePoint
  „Bezugslehrende" (nicht „Bezugslehrer") – `SP_CONFIG.listBezugslehrer` entsprechend
  angepasst, sonst hätte die App die Liste nicht gefunden.

## v0.35.0 – 2026-07-24
- **Feature (Fundament): eigene SharePoint-Liste „Bezugslehrer" + Verwaltung (Admin).**
  Erster Schritt der Stammdaten-Verwaltung: Lehrkräfte bekommen eine echte Liste (Name,
  Stellenumfang, Kapazität, Aktiv-Flag) statt nur als Textwert am Azubi zu existieren. Neu:
  Verwaltungs-Abschnitt im Dashboard mit Lehrkräfte-Liste und Dialog „Neuer Bezugslehrer".
  Die **Kapazität wird aus dem Stellenumfang vorgeschlagen** (100 % = 25 Azubis, gerundet)
  und bleibt überschreibbar (Sonderfälle). Die Liste wird beim Sync mitgeladen (defensiv –
  fehlt sie noch, bricht nichts). Neu: `SP_FELDER_BEZUGSLEHRER`, `SPSync.lehrerListeLaden()`
  /`lehrerAnlegen()`, Modul `Bezugslehrer` (`kapazitaetVorschlag`, `finden`, `aktive`,
  `anlegen`). **Rein additiv** – Auslastung/Board/Zuordnung noch unverändert (kommt in der
  nächsten Scheibe). 15 neue Tests (`tests/test_v035.js`).

## v0.34.0 – 2026-07-24
- **Feature: Azubi-Zuordnungs-Board im Dashboard (Admin).** Neu per CSV angelegte Azubis
  haben zunächst keine:n Bezugslehrer:in. Der bisherige passive Hinweis „X Azubis ohne
  Bezugslehrer*in" ist jetzt ein interaktives 2-Spalten-Board: links die unzugeordneten
  Azubis, rechts die Lehrkräfte mit Auslastung (Ist/Soll + Ampel). Zuordnen per **Klick**
  (Azubi wählen → Lehrkraft) **oder Drag-and-Drop** (Azubi auf Lehrkraft ziehen). Schreibt
  nur das Bezugslehrer-Feld (`field_3`) der Azubis-Liste; kein Genehmigungs-Workflow (das
  ist Etappe 4/Tausch). Offline-first wie beim Besuchsstatus: bei fehlendem Netz bleibt die
  Zuordnung lokal (`blOffen`) und wird beim nächsten Sync nachgereicht (vor dem Re-Read).
  Neu: `SPSync.bezugslehrerSenden()`, `Azubis.bezugslehrerSetzen()`, `Oberflaeche.
  viewZuordnungsBoard()`; `Dashboard.auslastung()` liefert zusätzlich den Rohwert `wert`.
  9 neue Tests (`tests/test_v034.js`). Reine Zusatzfunktion, bestehende Ansichten unberührt.

## v0.33.1 – 2026-07-24
- **Fix: „durchgeführt" beim Doppelimport wurde wieder auf „offen" zurückgesetzt.**
  Beim erneuten Hochladen eines Einsatzplans erkennt `einsatzplanHochladen()`
  bestehende Einträge am Startdatum und bewahrt bewusst deren Besuchsstand, damit
  ein Re-Import bereits erfasste Besuche nicht wegwirft. Diese Bewahr-Logik überfuhr
  aber die frische Angabe „bereits durchgeführt" aus dem Prüfschritt: `BesuchStatus`
  wurde vor dem Schreiben mit dem alten SharePoint-Wert („offen") überschrieben – der
  PATCH war erfolgreich (keine Fehlermeldung), schrieb nur den falschen Wert.
  `PflichtManuell` (im selben PATCH) blieb korrekt gesetzt, was das Symptom erklärte
  („Pflicht Manuell angekreuzt, Status offen"). Neu gilt: bringt der Import selbst
  einen Status mit (≠ „offen"), gewinnt diese Eingabe; ohne eigenen Status bleibt der
  erfasste Bestand erhalten. Notizen werden weiterhin bewahrt. 3 neue Tests
  (`tests/test_v033.js`); `SP_FELDER_EINSAETZE` dafür ins Test-Bundle aufgenommen.

## v0.33.0 – 2026-07-23
- **Feature: Bereich „ohne Adresse" über der Einrichtungsliste.** Beim CSV-Import neu
  gelernte Einrichtungen haben zunächst keine Adresse (Straße/PLZ fehlen) und waren in
  den zugeklappten Bereichs-Gruppen schwer zu finden. Jetzt erscheint über der Liste
  eine auffällige Box mit genau diesen Einrichtungen und je einem Knopf „Adresse
  ergänzen", der direkt das bestehende Bearbeiten-Formular öffnet. Die Box verschwindet
  von selbst, sobald keine Adresse mehr fehlt. Rein additiv – bestehende Bearbeitung/
  Löschung in der Liste bleibt unverändert.

## v0.32.1 – 2026-07-22
- **Fix: „CSV importieren"-Knopf im Dashboard ohne Funktion.** `render()` rief die
  Verdrahtungs-Methode `_verdrahten()` (hängt die Klick-Handler an) nur für die
  „planer"-Ansicht auf und kehrte für Dashboard/Start vorher zurück. Der CSV-Import-
  Button lebt aber im Dashboard – er wurde gezeichnet, aber nie „scharf gemacht"
  (Klick ohne Wirkung, kein Fehler). Jetzt wird das Dashboard ebenfalls verdrahtet;
  künftige Verwaltungs-Buttons (Kurse, Tausch, DFA) profitieren automatisch mit.
- **Fix: Absturz durch Excel-Datums-Serienzahlen aus SharePoint.** Beim Excel→
  SharePoint-Import können Datumsfelder als rohe Excel-Serienzahl landen (z.B.
  `45303` statt eines Datums = 12.01.2024). Die App machte daraus den kaputten
  String `"45303"`, an dem die Kalender-/Zeitleisten-Berechnung abstürzte
  (`RangeError: Invalid time value`) – das riss den ganzen Render-Durchlauf mit,
  u.a. blieb der „CSV importieren"-Knopf funktionslos. `_datumAus()` erkennt jetzt
  Excel-Serienzahlen und rechnet sie ins ISO-Datum um; unbekannte Werte werden zu
  `null` statt zu einem kaputten String. Zusätzlich fängt `Kalender.geometrie()`
  ungültige Datumswerte ab (kein Balken statt Absturz).

## v0.32.0 – 2026-07-18
- **CSV-Import: neue Azubis direkt anlegen (Dashboard Etappe 2, Teil 1).** Findet
  der Import keinen passenden Azubi in SharePoint, führt das nicht mehr in eine
  Sackgasse. Der Dialog „Azubi nicht gefunden" bekommt einen Button „Azubi
  anlegen": legt den Azubi mit Nachname, Kurs (Vorschlag aus der CSV-Langform,
  editierbar) und Trägerhaus in SharePoint an und lädt den Einsatzplan direkt im
  selben Schritt hoch. Bezugslehrer bleibt bewusst leer.
- **Dashboard-Kachel „Azubis ohne Bezugslehrer*in".** Neuer Warn-Abschnitt für
  Admins, sichtbar sobald mindestens ein Azubi ohne Bezugslehrer-Zuordnung
  existiert (v.a. frisch importierte Azubis) – macht die offene Zuordnungsaufgabe
  sichtbar, die sonst stillschweigend untergehen könnte.

## v0.31.1 – 2026-07-18
- **Fix Feedback-Formular stürzt ab bei gewählter Bezugslehrer-Auswahl.** Die
  `esc`-Hilfsfunktion war im Feedback-Formular nicht im Scope (nur lokal in anderen
  Methoden definiert). War eine Bezugslehrer*in gewählt, warf das Öffnen einen
  `ReferenceError`. `esc` ist jetzt lokal im Formular definiert.
- **Fix Onboarding-Illustrationen: gezeichnete Linien werden nicht mehr abgeschnitten.**
  Die „Zeichnen"-Animation nutzte einen festen `stroke-dasharray:140`, an die Pfad-
  Geometrie gekoppelt. Die gezeichneten Pfade (Touren-Zickzack, Häkchen) bekommen
  jetzt `pathLength="140"` – dadurch deckt die Animation jeden Pfad exakt ab,
  unabhängig von der realen Länge.

## v0.31.0 – 2026-07-18
- **Dashboard Etappe 1: Besuchs-Kennzahlen.** Neuer Abschnitt „Praxisbesuche im
  Überblick" oben im Dashboard mit vier Kennzahlen-Kacheln (schulweit über alle
  Azubis, read-only für alle Rollen): **Pflichtbesuche gesamt**, **durchgeführt**,
  **geplant**, **nachzuholen**. Gezählt werden einzelne Pflichtbesuch-Einträge nach
  `besuchStatus` (nicht typ-dedupliziert wie die Anstehend-Liste; per ⓘ-Hover
  erklärt). Erklärungen zu jeder Kachel als `title`-Hover. Neuer Helfer
  `Dashboard.besuchsUebersicht()` (headless getestet, `tests/test_v031.js`).

## v0.30.0 – 2026-07-18
- **Dashboard-Fundament (Rollen-Trennung).** Das Dashboard ist jetzt als
  Kontrollzentrum strukturiert: Kopf mit Rollen-Badge (**Verwaltung** für Admins /
  **Nur-Lese-Ansicht** für User), ein **Verwaltungs-Abschnitt** (nur Admins, aktuell
  CSV-Import) und der **Auslastungs-Abschnitt** (für alle sichtbar, read-only).
  Normale User sehen einen Hinweis, dass Verwaltung Administrator:innen vorbehalten
  ist. Grundlage für die weiteren Dashboard-Etappen. Neuer Helfer
  `Dashboard.darfVerwalten()` (headless getestet).

## v0.29.1 – 2026-07-18
- **Fix Sprechblase verdeckt Eingabefelder** (z. B. Private Adresse bei 100 % Zoom):
  Wenn die Blase an keine Seite eines breiten Ziels passt, wird sie jetzt auf die
  Seite mit dem meisten Platz gelegt und **verdeckt das Ziel nie** – statt wie bisher
  mittig darüber. Die Eingabefelder bleiben frei.

## v0.29.0 – 2026-07-18
- **Einstellungen umgebaut:** keine aufklappbaren Reiter mehr – alle Abschnitte
  flach auf einer Seite, in logischer Reihenfolge (SharePoint zuerst, Gefahrenzone
  zuletzt). Erklärungstexte als **ⓘ-Hover** (Tooltip) statt Fließtext.
  „Automatische Sicherungen"-Anzeige entfernt (Backup-Mechanik läuft im Hintergrund
  weiter).
- **Fix „Sprechblase sitzt zu hoch" (Wurzel):** Die Wizard-Sprechblase ist jetzt
  `position:fixed`. Der Scroll-Versatz auf langen Seiten (z. B. SharePoint-Schritt)
  entfällt – die Blase steht unabhängig von der Seitenlänge korrekt am Ziel.

## v0.28.3 – 2026-07-17
- **Fix Bug A:** Sprechblasen-Position im Onboarding-Wizard – jetzt seitlich am
  Ziel **zentriert** (behebt „sitzt zu hoch"), **überlappungsfrei** und
  **zoom-fest** (klemmt gegen `visualViewport`). Logik in reiner Funktion
  `Onboarding._blasePosition`.
- Projekt als eigenes Repo aufgesetzt: Headless-Tests (`node tests/run-all.js`,
  90 grün), Specs, Doku. **Keine** funktionale Änderung an SharePoint/Dashboard/Azubis.

## v0.28.2 – 2026-07-17 (aus Claude-Chat-Export files_028 übernommen)
- Onboarding-Wizard Runde 1 (Einrichtung/Block A: SharePoint verbinden → „Ich
  bin …" → Privatadresse → Azubis-CSV → Fertig).
- Popup-Login für SharePoint (kein Reload).
- CSV-Import aus dem Azubis-Tab entfernt, jetzt im Dashboard, nur für Admins.
- Ausgangsstand dieses Repos.
