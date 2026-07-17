/* Headless-Geometrietests fuer Onboarding._blasePosition (Bug A).
   Extrahiert den ECHTEN Onboarding-Block aus index.html und prueft die reine
   Positionierungslogik der Sprechblase: seitliche Bevorzugung, vertikale
   Zentrierung am Loch, Ueberlappungsfreiheit und Viewport-Klemmung. */
const fs = require('fs'), vm = require('vm'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const m = html.match(/const Onboarding = \{[\s\S]*?\r?\n\};\r?\n\r?\nconst Oberflaeche = \{/);
if (!m) { console.log('✗ Onboarding-Block nicht extrahierbar'); process.exit(1); }
const block = m[0].replace(/\r?\nconst Oberflaeche = \{$/, '');

const sandbox = {
  Daten: { state: {}, speichern: () => {} },
  SharePoint: { istAdmin: true },
  Oberflaeche: { ansicht: 'start', tab: 'anstehend', render: () => {} },
  document: { querySelector: () => null, querySelectorAll: () => [], getElementById: () => null, createElement: () => ({ style: {}, classList: { add() {} } }), body: { appendChild: () => {} }, addEventListener: () => {}, removeEventListener: () => {} },
  window: { innerWidth: 1200, innerHeight: 800, addEventListener: () => {}, removeEventListener: () => {} },
  console
};
vm.createContext(sandbox);
vm.runInContext(block + '\nthis.Onboarding=Onboarding;', sandbox);
const Ob = sandbox.Onboarding;

let pass = 0, fail = 0;
function t(n, c) { if (c) { pass++; console.log('✓ ' + n); } else { fail++; console.log('✗ ' + n); } }

const VP = { left: 0, top: 0, width: 1200, height: 800 };
const BL = { w: 340, h: 220 };
function ueberlappt(p, loch, b) { return !(p.left + b.w <= loch.left || p.left >= loch.right || p.top + b.h <= loch.top || p.top >= loch.bottom); }

t('_blasePosition existiert', typeof Ob._blasePosition === 'function');

// 1 Platz rechts -> rechts, vertikal am Loch zentriert
{
  const loch = { left: 100, top: 380, right: 260, bottom: 420 };
  const p = Ob._blasePosition(loch, BL, VP);
  t('rechts: seite=rechts', p.seite === 'rechts');
  t('rechts: left = loch.right + luft(14)', p.left === 274);
  t('rechts: vertikal am Loch zentriert (Mitte 400 -> top 290)', p.top === 290);
  t('rechts: keine Ueberlappung', !ueberlappt(p, loch, BL));
}

// 2 Kein Platz rechts, Platz links -> links
{
  const loch = { left: 990, top: 380, right: 1150, bottom: 420 };
  const p = Ob._blasePosition(loch, BL, VP);
  t('links: seite=links', p.seite === 'links');
  t('links: left = loch.left - bw - luft', p.left === 990 - 340 - 14);
  t('links: keine Ueberlappung', !ueberlappt(p, loch, BL));
}

// 3 Breites Loch oben, kein seitlicher Platz -> unten
{
  const loch = { left: 50, top: 100, right: 1150, bottom: 140 };
  const p = Ob._blasePosition(loch, BL, VP);
  t('unten: seite=unten', p.seite === 'unten');
  t('unten: top = loch.bottom + luft', p.top === 154);
  t('unten: keine Ueberlappung', !ueberlappt(p, loch, BL));
}

// 4 Breites Loch unten -> oben
{
  const loch = { left: 50, top: 660, right: 1150, bottom: 720 };
  const p = Ob._blasePosition(loch, BL, VP);
  t('oben: seite=oben', p.seite === 'oben');
  t('oben: top = loch.top - bh - luft', p.top === 660 - 220 - 14);
  t('oben: keine Ueberlappung', !ueberlappt(p, loch, BL));
}

// 5 Loch ganz oben -> zentrierter top wird auf Viewport-Rand geklemmt
{
  const loch = { left: 100, top: 0, right: 260, bottom: 20 };
  const tall = { w: 340, h: 400 };
  const p = Ob._blasePosition(loch, tall, VP);
  t('klemm: top >= rand(10)', p.top >= 10);
  t('klemm: top + bh <= viewport-hoehe - rand', p.top + tall.h <= 800 - 10 + 0.0001);
}

// 6 visualViewport-Offset wird als Grenze respektiert (unten-Fall)
{
  const vp = { left: 100, top: 50, width: 1000, height: 700 };
  const loch = { left: 110, top: 120, right: 1090, bottom: 160 };
  const p = Ob._blasePosition(loch, BL, vp);
  t('vp-offset: seite=unten', p.seite === 'unten');
  t('vp-offset: left nicht unter vp.left + rand', p.left >= vp.left + 10);
}

// 7 Blase groesser als Viewport -> Notfall mitte
{
  const kleinVp = { left: 0, top: 0, width: 300, height: 300 };
  const loch = { left: 120, top: 140, right: 180, bottom: 170 };
  const p = Ob._blasePosition(loch, BL, kleinVp);
  t('notfall: seite=mitte', p.seite === 'mitte');
}

console.log('\n== ' + pass + ' bestanden, ' + fail + ' fehlgeschlagen ==');
process.exit(fail ? 1 : 0);
