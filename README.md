# SEA Praxisbesuche

Web-App ohne Build-Schritt zur Planung von **Praxisbesuchen** in der Pflegeausbildung.
Der gesamte eigene Code liegt in einer Datei (`index.html`), die Fremd-Libraries
daneben in `vendor/`.
Lehrkräfte verwalten Auszubildende, Einsatzorte und Termine, planen Touren
(Karte/Route) und erzeugen Besuchs-PDFs. Ein Onboarding-Wizard führt durch die
Ersteinrichtung.

## Was macht das Projekt

- **Azubis & Einrichtungen** verwalten, Pflichtbesuche im Blick behalten
- **Termine/Anstehend** – anstehende Besuche, Kalender
- **Touren** – Sammelbesuche bündeln, Route planen (Leaflet), PDF-Export (jsPDF)
- **SharePoint-Anbindung** – Login via Microsoft (MSAL), Daten über Graph
- **Onboarding-Wizard** – Spotlight-geführte Ersteinrichtung, rollenabhängig

## Wie starten

Kein Build, keine Installation. Zwei Wege:

- **Mit Microsoft-Login** (SharePoint-Funktionen): über einen lokalen Server, weil
  `file://` keine registrierbare Redirect-URI ist.
  ```
  python -m http.server 8000 --bind 127.0.0.1
  ```
  dann `http://localhost:8000/` öffnen.
- **Ohne Login:** `index.html` per Doppelklick öffnen. Die übrige Oberfläche
  funktioniert, der Ordner `vendor/` muss dabei daneben liegen.

## Tests

```
node tests/run-all.js
```

Headless-Logiktests (Node-Builtins, keine Dependencies). Siehe `CLAUDE.md` → Tests.

## Wichtige Dateien

| Pfad | Inhalt |
|------|--------|
| `index.html` | die App – gesamter eigener Code |
| `vendor/` | Fremd-Libraries (MSAL, Leaflet, jsPDF), lokal, kein CDN |
| `CHANGELOG.md` | Änderungen je Version |
| `tests/` | Logiktests + Bundle-Extraktor |

## Status

Onboarding-Wizard Runde 1 (Ersteinrichtung) gebaut und getestet. Änderungen je
Version im `CHANGELOG.md`.
