# SEA Praxisbesuche – Entwickler-Leitfaden

Single-File-Web-App zur Planung von Praxisbesuchen in der Pflegeausbildung. Die App
heißt in der Oberfläche „SEA Praxisbesuche".

## Planung & Kontext liegen im privaten Repo (nicht hier)

`kontext.md` und `spec/` liegen **nicht** im App-Root, sondern im Unterordner
**`planung/`** – das ist ein **eigenes, privates Git-Repo**, per `.gitignore` aus
diesem öffentlichen Repo ausgeschlossen. Grund: Planung/Kontext könnten Interna enthalten.

- Projekt-`kontext.md` → `planung/kontext.md`
- Spezifikationen → `planung/spec/…`
- `/sitzungsende` archiviert/schreibt diese `planung/kontext.md` (nicht `./kontext.md`).
- Zwei getrennte Repos: **App öffentlich**, **Planung privat** – jeweils eigener Commit/Push.

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

### Branch-Namen

Zweck: In `git branch -r` soll ohne Blick in den Diff erkennbar sein, was auf einem
Branch liegt – für Menschen wie für KI-Sessions, die einen fremden Stand vorfinden.

Ein Test entscheidet: **Zählt die Änderung `APP_VERSION` hoch?**

| Muster | wofür | Beispiel |
|--------|-------|----------|
| `vX.Y-kurzname` bzw. `vX.Y.Z-kurzname` | alles mit Versionssprung – geplante Scheibe wie ungeplanter Bugfix | `v0.41-vertretung`, `v0.40.2-schreibfehler` |
| `chore/kurzname` | ohne Versionssprung – Infrastruktur, Doku, Aufräumen | `chore/ci-logiktests` |

**Kein `fix/`-Muster.** Der Workflow verlangt, `APP_VERSION` in derselben Änderung
hochzuzählen – die Version steht also spätestens beim Commit fest, und ein Bugfix, der
ausgeliefert wird, *ist* eine Version. Ob geplant oder nicht, steht in der Spec und im
Changelog, nicht im Branchnamen.

Kleinbuchstaben und Bindestriche, nur ASCII (`traegerhaus`, nicht `trägerhaus`), ein
Thema pro Branch, kein Autor/Werkzeug/Zufallssuffix im Namen. Versionsschreibweise wie
`APP_VERSION`: `v0.41`, nicht `v0-41`.

**Ein Begriff für dieselbe Sache.** Bei jedem Versions-Branch tragen Branch, Spec-Datei,
`APP_VERSION`, `CHANGELOG`-Überschrift und PR-Titel **denselben** Begriff. Beispiel für
das Gegenteil: `fix/stille-schreibfehler` mit PR-Titel „v0.40.2 – Halb gelungene
Schreibvorgänge sichtbar machen" – vier Namen, kein gemeinsames Wort, aus dem Branch
nicht erkennbar, welche Version darauf liegt.

**Beide Repos, gleicher Name.** Spec (privates Kontext-Repo) und Code (hier) entstehen
im Gleichschritt – derselbe Branch-Name macht das Paar auffindbar.

**Automatische Session-Branches** (`claude/…-a1b2c3`, aus dem Eingabesatz erzeugt) sind
Wegwerfware und sagen nichts über ihren Inhalt. Wird daraus echte Arbeit: vorher auf
einen sprechenden Namen pushen und den PR von dort aufmachen.

**Lebt der Branch noch?** `git rev-list --count origin/main..<branch>` – ist das Ergebnis
`0`, ist er erledigt und nur noch nicht gelöscht; alles darüber ist lebende Arbeit, die
nur dort existiert. Gemergte Branches löschen (GitHub: *Settings → General → Pull
Requests → „Automatically delete head branches"*). Der Git-Proxy der Cloud-Sessions
lehnt Löschungen mit `403` ab – das geht nur lokal.

**Gotcha:** Hat das GitHub-Konto „private E-Mail schützen" aktiv, werden Pushes mit
privater Commit-E-Mail per `GH007` abgelehnt. Dann repo-lokal die GitHub-noreply-
Adresse des Kontos setzen: `git config user.email <id>+<user>@users.noreply.github.com`.
