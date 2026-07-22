# Changelog – SEA Praxisbesuche

Versionen der App (`APP_VERSION` in `index.html`, in der Oberfläche als „vX.Y.Z"
sichtbar). Schema: Bugfix → letzte Stelle (0.28.2→0.28.3), neues Feature →
mittlere Stelle (0.28→0.29).

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
