# SEA Praxisbesuche

Single-File-Web-App zur Planung von **Praxisbesuchen** in der Pflegeausbildung.
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

`index.html` im Browser öffnen (Doppelklick). Kein Build, keine Installation.
Für die SharePoint-Funktionen ist ein Microsoft-Login nötig; die übrige Oberfläche
funktioniert auch ohne.

## Tests

```
node tests/run-all.js
```

Headless-Logiktests (Node-Builtins, keine Dependencies). Siehe `CLAUDE.md` → Tests.

## Wichtige Dateien

| Pfad | Inhalt |
|------|--------|
| `index.html` | die gesamte App |
| `CHANGELOG.md` | Änderungen je Version |
| `tests/` | Logiktests + Bundle-Extraktor |

## Status

Onboarding-Wizard Runde 1 (Ersteinrichtung) gebaut und getestet. Änderungen je
Version im `CHANGELOG.md`.
