# SEA Praxisbesuche – Entwickler-Leitfaden

Single-File-Web-App zur Planung von Praxisbesuchen in der Pflegeausbildung. Die App
heißt in der Oberfläche „SEA Praxisbesuche".

## Tech-Stack

- **Vanilla JS**, eine einzige Datei: `index.html` (HTML + CSS + JS inline, kein Build).
- Läuft durch Doppelklick im Browser; keine Installation, keine node-Runtime nötig.
- Externe Libraries werden zur Laufzeit dynamisch geladen (nicht gebündelt):
  - **MSAL** – Microsoft-Login
  - **Microsoft Graph** – liest/schreibt die Daten in **SharePoint**-Listen
  - **Leaflet** – Karten für Routen/Touren
  - **jsPDF** – erzeugt die PDFs

## Code-Aufbau (Module in `index.html`)

Die JS-Logik ist in benannte Objekt-Module gegliedert (Reihenfolge in der Datei):

| Modul | Aufgabe |
|-------|---------|
| `SP_CONFIG`, `SP_FELDER_ADMINS` | SharePoint-Konfiguration (Listen, Feldnamen) |
| `Daten` | zentraler State + Persistenz (IndexedDB / SharePoint) |
| `SharePoint`, `SPSync` | Login (MSAL), Graph-Sync, Admin-Erkennung |
| `Azubis` | Azubi-Liste, „Nur meine/Alle"-Filter |
| `Dashboard` | Auslastung, Ampel-Logik |
| `Onboarding` | Spotlight-Wizard (Ersteinrichtung) |
| `Oberflaeche` | Rendering / Views |

`bezugslehrerAnzeige()` (freie Funktion) trennt die „(Zahl)" vom Bezugslehrer-Namen.

## Versionierung

Bei jeder inhaltlichen Änderung `const APP_VERSION` in `index.html` hochzählen (wird
in der App als „vX.Y.Z" angezeigt) und einen Eintrag in `CHANGELOG.md` ergänzen.
Schema: Bugfix → letzte Stelle (0.28.2→0.28.3), neues Feature → mittlere Stelle
(0.28→0.29). Versionierung über Git, **nicht** über Dateinamen-Suffixe.

## Tests

Headless-Logiktests in `tests/` (nur Node-Builtins, keine Dependencies):

```
node tests/run-all.js      # baut Bundle + alle Suiten
```

- `test_v028.js` / `test_position.js` – Onboarding-Wizard-Logik bzw. Blasen-
  Positionierung; extrahieren den `Onboarding`-Block direkt aus `index.html` und
  prüfen ihn in einer `vm`-Sandbox mit DOM-Stubs.
- `test_v025.js` / `test_v026.js` – SharePoint/Azubis- bzw. Dashboard-Logik. Sie
  lesen `extracted_test_bundle.js`, das `extract-bundle.js` per Terminator-Regex aus
  `index.html` schneidet (Build-Artefakt, gitignored).
- `tests/archiv/` – historische Tests, laufen nicht mehr.

Getestet wird stets der **echte, aus `index.html` extrahierte Code**, keine
Nachbildung. Die SVG-/Blasen-Zeichnung des Wizards ist Browser-Sache und nicht
headless testbar.

## Konventionen

- Deutsch für Kommentare und Bezeichner, PascalCase für Komponenten.
- Keine neuen Libraries ohne Rückfrage; minimale, chirurgische Änderungen.
- **Nach jeder Code-Änderung an `index.html`: `node tests/run-all.js` grün halten.**

## GitHub

`origin` = diese public Repo (Default-Branch `main`). Bestehende Historie nicht
überschreiben (kein force ohne Grund).

**Gotcha:** Hat das GitHub-Konto „private E-Mail schützen" aktiv, werden Pushes mit
privater Commit-E-Mail per `GH007` abgelehnt. Dann repo-lokal die GitHub-noreply-
Adresse des Kontos setzen: `git config user.email <id>+<user>@users.noreply.github.com`.
