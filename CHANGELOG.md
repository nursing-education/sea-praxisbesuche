# Changelog – SEA Praxisbesuche

Versionen der App (`APP_VERSION` in `index.html`, in der Oberfläche als „vX.Y.Z"
sichtbar). Schema: Bugfix → letzte Stelle (0.28.2→0.28.3), neues Feature →
mittlere Stelle (0.28→0.29).

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
