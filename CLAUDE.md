# SEA Praxisbesuche – Entwickler-Leitfaden

Web-App ohne Build-Schritt zur Planung von Praxisbesuchen in der Pflegeausbildung.
Der gesamte eigene Code liegt in einer Datei (`index.html`), die Fremd-Libraries
daneben in `vendor/`. Die App heißt in der Oberfläche „SEA Praxisbesuche".

## Planung & Kontext liegen im privaten Repo (nicht hier)

`kontext.md` und `spec/` liegen **nicht** im App-Root, sondern im Unterordner
**`planung/`** – das ist ein **eigenes, privates Git-Repo**, per `.gitignore` aus
diesem öffentlichen Repo ausgeschlossen. Grund: Planung/Kontext könnten Interna enthalten.

- Projekt-`kontext.md` → `planung/kontext.md`
- Spezifikationen → `planung/spec/…`
- `/sitzungsende` archiviert/schreibt diese `planung/kontext.md` (nicht `./kontext.md`).
- Zwei getrennte Repos: **App öffentlich**, **Planung privat** – jeweils eigener Commit/Push.

## Tech-Stack

- **Vanilla JS**, eigener Code in einer einzigen Datei: `index.html` (HTML + CSS + JS
  inline, kein Build).
- Keine Installation, keine node-Runtime nötig (node nur für die Tests).
- Externe Libraries liegen **lokal in `vendor/`** und werden per `<script src="…">`
  bzw. `<link href="…">` geladen – **kein CDN** (im Schulnetz gesperrt), **kein Build**:
  - **MSAL** (`vendor/msal-browser-*.js`) – Microsoft-Login
  - **Leaflet** (`vendor/leaflet-*.js` **und** `vendor/leaflet-*.css`) – Karten für
    Routen/Touren. Das CSS nicht vergessen, sonst rendert die Karte falsch.
  - **jsPDF** (`vendor/jspdf-*.js`) – erzeugt die PDFs
  - **Microsoft Graph** – keine Library, wird per `fetch` angesprochen
- Die Versionsnummer steht im Dateinamen; bei einem Update ändern sich Datei **und**
  Pfad in `index.html`. `vendor/` muss immer neben der `index.html` liegen – die
  `index.html` allein ist nicht mehr lauffähig.
- **Ladereihenfolge ist bindend:** Leaflet CSS + JS im `<head>`, dann jsPDF und MSAL
  direkt nach `<body>`, der eigene Code zuletzt. Kein `defer`, kein `async` – sonst
  läuft der eigene Code, bevor die Libraries da sind.

## Lokal ausprobieren

**Über `http://localhost:8000/`, nicht per Doppelklick.** Diese Adresse ist in der
App-Registrierung als Redirect-URI freigeschaltet und dient als Testumgebung gegen den
echten SharePoint. Unter `file://` schlägt der MSAL-Login fehl, weil `file://` keine
registrierbare Redirect-URI ist – Karte und PDF liessen sich so zwar prüfen, der Login
aber nicht.

```
python -m http.server 8000 --bind 127.0.0.1     # im Projektordner
```

Was eine Browser-Abnahme abdecken muss (kein Test erreicht das): **Login** (MSAL),
**Karte** inklusive Aussehen (Leaflet JS + CSS), **PDF-Export** (jsPDF). Vorher prüfen,
ob oben die erwartete Versionsnummer steht – sonst zeigt der Browser einen Cache-Stand.

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
