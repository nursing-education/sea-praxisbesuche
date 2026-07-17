/* Headless-Logiktests für den Onboarding-Wizard (v0.27, Etappe 1).
   Testet den ECHTEN, aus der HTML extrahierten Onboarding-Block in einer
   vm-Sandbox mit DOM-Stubs. Die reine Ablauflogik (Index, Grenzen,
   onboardingGesehen) wird geprüft; die SVG-/Blasen-Zeichnung ist Browser-Sache. */
const fs=require('fs');
const vm=require('vm');
const html=fs.readFileSync('sea-praxisbesuche_v0_27_1.html','utf8');

// Onboarding-Block isolieren (von "const Onboarding = {" bis vor "const Oberflaeche = {")
const m=html.match(/const Onboarding = \{[\s\S]*?\n\};\n\nconst Oberflaeche = \{/);
if(!m){ console.log('✗ Onboarding-Block nicht extrahierbar'); process.exit(1); }
const block=m[0].replace(/\nconst Oberflaeche = \{$/,'');   // schließenden Anker abtrennen

// Sandbox mit minimalen Stubs
const state={ onboardingGesehen:false };
const sandbox={
  Daten:{ state, speichern:()=>{} },
  Oberflaeche:{ ansicht:'start', tab:'anstehend', render:()=>{} },
  document:{ querySelectorAll:()=>[], getElementById:()=>null,
             createElement:()=>({ style:{}, classList:{add(){}}, }), body:{appendChild:()=>{}} },
  window:{ innerWidth:1200, innerHeight:800, addEventListener:()=>{}, removeEventListener:()=>{} },
  console
};
vm.createContext(sandbox);
vm.runInContext(block+'\nthis.Onboarding=Onboarding;', sandbox);
const Ob=sandbox.Onboarding;

// DOM-Zeichnung neutralisieren -> nur die Index-/Ablauflogik bleibt aktiv
Ob._zeichnen=function(){};

let pass=0, fail=0;
function t(name, cond){ if(cond){pass++; console.log('✓ '+name);} else {fail++; console.log('✗ '+name);} }
function reset(){ state.onboardingGesehen=false; Ob._idx=0; Ob._offen=false; Ob._cleanup=null; }

// 1 Trigger
reset();
t('sollStarten=true bei onboardingGesehen=false', Ob.sollStarten()===true);
state.onboardingGesehen=true;
t('sollStarten=false bei onboardingGesehen=true', Ob.sollStarten()===false);

// 2 Start
reset(); Ob.starten();
t('nach starten: _offen=true', Ob._offen===true);
t('nach starten: _idx=0', Ob._idx===0);
t('nach starten: istErster', Ob.istErster()===true);
t('nach starten: nicht istLetzter', Ob.istLetzter()===false);

// 3 Vorwärts
reset(); Ob.starten();
const n=Ob.schritte.length;
Ob.weiter();
t('weiter erhöht _idx auf 1', Ob._idx===1);

// 4 Rückwärts-Grenze
reset(); Ob.starten(); Ob.zurueck();
t('zurueck an Position 0 bleibt 0', Ob._idx===0);

// 5 bis zum letzten Schritt
reset(); Ob.starten();
for(let i=0;i<n-1;i++) Ob.weiter();
t('nach '+(n-1)+'x weiter: istLetzter', Ob.istLetzter()===true);
t('letzter Index = length-1', Ob._idx===n-1);

// 6 weiter am Ende schließt ab
reset(); Ob.starten();
for(let i=0;i<n-1;i++) Ob.weiter();
Ob.weiter();   // am Ende -> abschliessen
t('weiter am Ende: onboardingGesehen=true', state.onboardingGesehen===true);
t('weiter am Ende: _offen=false', Ob._offen===false);

// 7 Später beendet sofort
reset(); Ob.starten(); Ob.spaeter();
t('spaeter: onboardingGesehen=true', state.onboardingGesehen===true);
t('spaeter: _offen=false', Ob._offen===false);

// 8 Fortschritt
reset(); Ob.starten(); Ob.weiter();
const fp=Ob.fortschritt();
t('fortschritt Länge = Schrittzahl', fp.length===n);
t('fortschritt: genau ein "an"', fp.filter(p=>p.an).length===1);
t('fortschritt: an-Index folgt _idx', fp[1].an===true);
t('fortschritt: vorherige als fertig', fp[0].fertig===true);

// 9 erneutAnzeigen
reset(); state.onboardingGesehen=true;
Ob.erneutAnzeigen();
t('erneutAnzeigen: onboardingGesehen zurückgesetzt', state.onboardingGesehen===false);
t('erneutAnzeigen: _offen=true', Ob._offen===true);
t('erneutAnzeigen: _idx=0', Ob._idx===0);

// 10 _esc
t('_esc escapt <', Ob._esc('a<b')==='a&lt;b');
t('_esc escapt & und "', Ob._esc('x&y"z')==='x&amp;y&quot;z');

// 11 Schritt-Integrität
const ids=Ob.schritte.map(s=>s.id);
t('alle Schritte haben id/titel/text/modus',
  Ob.schritte.every(s=>s.id&&s.titel&&s.text&&(s.modus==='info'||s.modus==='live')));
t('live-Schritte haben ein Ziel',
  Ob.schritte.filter(s=>s.modus==='live').every(s=>typeof s.ziel==='string'&&s.ziel.length>0));
t('erwartete Etappe-1-Schrittfolge',
  JSON.stringify(ids)===JSON.stringify(['willkommen','privatadresse','aufbau','praxisbesuche','touren','fertig']));

// 12 Etappe-2-Abgrenzung (Regression: keine SharePoint-Schritte eingeschlichen)
t('KEIN Login-/Ichbin-/CSV-Schritt in Etappe 1',
  !ids.some(id=>/login|ichbin|bezugslehrer|csv|import|sharepoint/i.test(id)));
t('KEIN Ziel auf #bezugslehrerWert (Etappe 2)',
  !Ob.schritte.some(s=>s.ziel && s.ziel.includes('bezugslehrerWert')));

// 13 aktiverSchritt
reset(); Ob.starten(); Ob.weiter(); Ob.weiter();
t('aktiverSchritt folgt _idx', Ob.aktiverSchritt().id===ids[2]);


// 14 A2: Willkommen erzwingt Startseite
t('Schritt "willkommen" hat ansicht="start"', Ob.schritte[0].ansicht==='start');
t('nur der Willkommens-Schritt erzwingt "start"',
  Ob.schritte.filter(x=>x.ansicht==='start').length===1);

console.log('\n== '+pass+' bestanden, '+fail+' fehlgeschlagen ==');
process.exit(fail?1:0);
