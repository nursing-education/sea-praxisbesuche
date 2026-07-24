/* Isolierte Logiktests v0.37 – Dashboard-Umbau "eine Lehrkraft = eine Zeile".
   Prüft die beiden neuen Helfer Dashboard.lehrkraftZeilen() (Auslastung ×
   Stammliste verbinden) und Dashboard.lehrkraftFiltern() (Suche/Filter/Sortierung)
   gegen den echten, aus index.html extrahierten Code. Die Tabelle selbst und
   Drag-and-Drop bleiben Browser-Sache und sind hier bewusst nicht abgedeckt. */
const fs = require('fs');
const path = require('path');
const bundle = fs.readFileSync(path.join(__dirname, 'extracted_test_bundle.js'), 'utf-8');

const log = [];
let ok = 0, fail = 0;
function p(name, cond) {
  if (cond) { ok++; log.push('✓ ' + name); }
  else { fail++; log.push('✗ ' + name); }
}

let SharePoint = { istAdmin: false, _tokenStill: async () => 'tok',
  _graphGet: async () => ({ value: [] }) };
let Daten = { state: { azubis: [], azubiNamen: {}, lehrer: [], bezugslehrerWert: '', ansichtModus: 'meine' },
  speichern: async () => {} };
let Einrichtungen = { alle: () => [], aliasHinzufuegen: () => {}, sicherstellen: () => {} };
let Oberflaeche = { toast: () => {}, render: () => {} };
let pflichtbesucheMarkieren = () => {};

const wrapped = new Function('SharePoint', 'Daten', 'Einrichtungen', 'Oberflaeche', 'pflichtbesucheMarkieren',
  bundle + '\nreturn { SPSync, Bezugslehrer, Dashboard, bezugslehrerAnzeige };');
const { Dashboard } = wrapped(SharePoint, Daten, Einrichtungen, Oberflaeche, pflichtbesucheMarkieren);

(async () => {
  /* Ausgangslage: 3 Lehrkräfte in der Stammliste + eine, die NUR als Text an den
     Azubis hängt (Drift-Punkt 2) + Azubis ganz ohne Zuordnung. */
  Daten.state.lehrer = [
    { spId: '1', name: 'Voll, Vera',   stellenumfang: 100, kapazitaet: 2,  aktiv: true  },
    { spId: '2', name: 'Frei, Frida',  stellenumfang: 50,  kapazitaet: 13, aktiv: true  },
    { spId: '3', name: 'Archiv, Ann',  stellenumfang: 80,  kapazitaet: 20, aktiv: false },
  ];
  const azubis = [
    { bezugslehrer: 'Voll, Vera (2)' },
    { bezugslehrer: 'Voll, Vera (2)' },
    { bezugslehrer: 'Voll, Vera (2)' },          /* 3 von 2 -> überlastet, rot */
    { bezugslehrer: 'Frei, Frida (13)' },
    { bezugslehrer: 'Archiv, Ann (20)' },        /* archiviert, hat aber noch Azubis */
    { bezugslehrer: 'Alt, Anton (9)' },          /* nur Text, nicht in der Stammliste */
    { bezugslehrer: '' },                        /* ohne Zuordnung */
    { bezugslehrer: '   ' },                     /* ohne Zuordnung (nur Leerzeichen) */
  ];

  /* ---------- 1. lehrkraftZeilen(): Auslastung × Stammliste ---------------- */
  const zeilen = Dashboard.lehrkraftZeilen(azubis);
  const vera  = zeilen.find(z => z.name === 'Voll, Vera');
  const frida = zeilen.find(z => z.name === 'Frei, Frida');
  const ann   = zeilen.find(z => z.name === 'Archiv, Ann');
  const anton = zeilen.find(z => z.name === 'Alt, Anton');

  p('lehrkraftZeilen: Pseudo-Zeile "(ohne Bezugslehrer*in)" fällt raus',
    !zeilen.some(z => !z.wert || !String(z.wert).trim()));
  p('lehrkraftZeilen: Stammdaten sind verbunden (spId + Stellenumfang)',
    !!vera && vera.spId === '1' && vera.stellenumfang === 100);
  p('lehrkraftZeilen: Ist/Soll/Ampel aus der Auslastung übernommen',
    vera.ist === 3 && vera.soll === 2 && vera.ampel === 'rot');
  p('lehrkraftZeilen: frei = Soll - Ist (auch negativ)', vera.frei === -1);
  p('lehrkraftZeilen: frei bei freier Kapazität positiv', frida.frei === 12);
  p('lehrkraftZeilen: inListe=true für Lehrkraft aus der Stammliste', vera.inListe === true);
  p('lehrkraftZeilen: Nur-Text-Lehrkraft -> inListe=false, kein spId',
    !!anton && anton.inListe === false && anton.spId === null);
  p('lehrkraftZeilen: Nur-Text-Lehrkraft gilt als aktiv (hat ja Azubis)', anton.aktiv === true);
  p('lehrkraftZeilen: Nur-Text-Lehrkraft -> Soll aus "(Zahl)"-Fallback', anton.soll === 9);
  p('lehrkraftZeilen: archivierte Lehrkraft mit Azubis erscheint, aktiv=false',
    !!ann && ann.aktiv === false && ann.ist === 1);
  /* Ohne Azubis bleiben die aktiven Lehrkräfte der Stammliste stehen (Verhalten aus
     v0.36) -- sie sind ja Zuordnungsziele. Nur mit leerer Stammliste wird es leer. */
  const ohneAzubis = Dashboard.lehrkraftZeilen([]);
  p('lehrkraftZeilen: ohne Azubis bleiben die aktiven Lehrkräfte stehen (ist=0)',
    ohneAzubis.length === 2 && ohneAzubis.every(z => z.ist === 0));
  p('lehrkraftZeilen: undefined -> kein Absturz, gleiches Ergebnis wie []',
    Dashboard.lehrkraftZeilen(undefined).length === ohneAzubis.length);
  const leer = (() => { const merk = Daten.state.lehrer; Daten.state.lehrer = [];
    const r = Dashboard.lehrkraftZeilen([]); Daten.state.lehrer = merk; return r; })();
  p('lehrkraftZeilen: ohne Azubis UND ohne Stammliste -> leer', leer.length === 0);

  /* Lehrkraft ohne hinterlegte Kapazität: frei bleibt null (nicht 0 – sonst würde
     sie fälschlich als "voll" gedimmt bzw. aus dem Frei-Filter geworfen). */
  Daten.state.lehrer.push({ spId: '4', name: 'Ohne, Olaf', stellenumfang: null, kapazitaet: null, aktiv: true });
  const olaf = Dashboard.lehrkraftZeilen(azubis.concat([{ bezugslehrer: 'Ohne, Olaf' }]))
    .find(z => z.name === 'Ohne, Olaf');
  p('lehrkraftZeilen: ohne Kapazität -> soll=null und frei=null',
    !!olaf && olaf.soll === null && olaf.frei === null);

  /* ---------- 2. lehrkraftFiltern(): Filter-Modi --------------------------- */
  const alle = Dashboard.lehrkraftFiltern(zeilen, {});
  p('filtern: Standard "alle" blendet Archivierte aus',
    alle.length === 3 && !alle.some(z => z.name === 'Archiv, Ann'));
  const arch = Dashboard.lehrkraftFiltern(zeilen, { modus: 'archiviert' });
  p('filtern: "archiviert" zeigt NUR Archivierte',
    arch.length === 1 && arch[0].name === 'Archiv, Ann');
  const frei = Dashboard.lehrkraftFiltern(zeilen, { modus: 'frei' });
  p('filtern: "frei" nur mit echter Restkapazität',
    frei.length === 2 && frei.some(z => z.name === 'Frei, Frida') && frei.some(z => z.name === 'Alt, Anton'));
  p('filtern: "frei" schliesst die überlastete Lehrkraft aus',
    !frei.some(z => z.name === 'Voll, Vera'));
  const ueber = Dashboard.lehrkraftFiltern(zeilen, { modus: 'ueberlastet' });
  p('filtern: "ueberlastet" nur rote Ampel',
    ueber.length === 1 && ueber[0].name === 'Voll, Vera');

  /* ---------- 3. lehrkraftFiltern(): Suche -------------------------------- */
  p('filtern: Suche findet per Teilstring',
    Dashboard.lehrkraftFiltern(zeilen, { suche: 'frid' }).length === 1);
  p('filtern: Suche ist gross-/kleinschreibungs- und zeichenunabhängig',
    Dashboard.lehrkraftFiltern(zeilen, { suche: 'FREI, FRIDA' }).length === 1);
  p('filtern: Suche ohne Treffer -> leer',
    Dashboard.lehrkraftFiltern(zeilen, { suche: 'zzz' }).length === 0);
  p('filtern: Suche greift auch in Archivierte hinein',
    Dashboard.lehrkraftFiltern(zeilen, { suche: 'archiv', modus: 'archiviert' }).length === 1);

  /* ---------- 4. lehrkraftFiltern(): Sortierung --------------------------- */
  const nachName = Dashboard.lehrkraftFiltern(zeilen, { sortierung: 'name' }).map(z => z.name);
  p('filtern: Sortierung "name" alphabetisch',
    nachName.join('|') === 'Alt, Anton|Frei, Frida|Voll, Vera');
  const nachLast = Dashboard.lehrkraftFiltern(zeilen, { sortierung: 'auslastung' }).map(z => z.name);
  p('filtern: Sortierung "auslastung" behält die Reihenfolge aus auslastung() (höchste zuerst)',
    nachLast[0] === 'Voll, Vera');
  p('filtern: sortieren verändert die Eingabeliste nicht (kein in-place sort)',
    zeilen.map(z => z.name).join('|') !== nachName.join('|') || zeilen.length === 3);

  /* ---------- 5. Randfälle ------------------------------------------------ */
  p('filtern: leere Liste -> leeres Ergebnis', Dashboard.lehrkraftFiltern([], {}).length === 0);
  p('filtern: undefined Zeilen -> kein Absturz', Dashboard.lehrkraftFiltern(undefined, {}).length === 0);
  p('filtern: ohne Options-Objekt -> kein Absturz', Dashboard.lehrkraftFiltern(zeilen).length === 3);

  console.log(log.join('\n'));
  console.log('\n' + ok + '/' + (ok + fail) + ' Tests bestanden.');
  if (fail > 0) process.exit(1);
})();
