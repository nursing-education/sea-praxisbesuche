# Changelog – SEA Praxisbesuche

Versionen der App (`APP_VERSION` in `index.html`, in der Oberfläche als „vX.Y.Z"
sichtbar). Schema: Bugfix → letzte Stelle (0.28.2→0.28.3), neues Feature →
mittlere Stelle (0.28→0.29).

## v0.40.2 – 2026-07-26

- **Fix: halb gelungene Schreibvorgänge waren unsichtbar.** Der interne SharePoint-Name
  von `VorherigerBezugslehrer` ist unverifiziert; lehnt SharePoint den PATCH deswegen ab,
  wiederholt die App ihn seit v0.40 ohne dieses Feld – die Zuordnung wird gespeichert,
  der Vorgänger nicht. Dieses Nachfassen war **stumm**: kein Log, kein Hinweis. Die App
  behauptete vollen Erfolg, obwohl die Hälfte verschluckt wurde. Genau dieser Fehlertyp
  blieb beim `BesuchStatus` wochenlang unbemerkt – und die Vertretung in v0.41 greift
  ausgerechnet auf diesen Merker zurück.
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
