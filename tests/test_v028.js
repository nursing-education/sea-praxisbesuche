/* Headless-Logiktests Onboarding v0.28 (Runde 1: Block A Einrichtung + Trigger-Logik).
   Gegen den ECHTEN aus der HTML extrahierten Onboarding-Block. */
const fs=require('fs'), vm=require('vm'), path=require('path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const m=html.match(/const Onboarding = \{[\s\S]*?\r?\n\};\r?\n\r?\nconst Oberflaeche = \{/);
if(!m){ console.log('✗ Onboarding-Block nicht extrahierbar'); process.exit(1); }
const block=m[0].replace(/\r?\nconst Oberflaeche = \{$/,'');
const state={ onboardingGesehen:false, bezugslehrerWert:'' };
const sp={ istAdmin:true };
const sandbox={
  Daten:{ state, speichern:()=>{} },
  SharePoint:sp,
  Oberflaeche:{ ansicht:'start', tab:'anstehend', render:()=>{} },
  document:{ querySelector:()=>null, querySelectorAll:()=>[], getElementById:()=>null, createElement:()=>({style:{},classList:{add(){}}}), body:{appendChild:()=>{}}, addEventListener:()=>{}, removeEventListener:()=>{} },
  window:{ innerWidth:1200, innerHeight:800, addEventListener:()=>{}, removeEventListener:()=>{} },
  console
};
vm.createContext(sandbox);
vm.runInContext(block+'\nthis.Onboarding=Onboarding;', sandbox);
const Ob=sandbox.Onboarding;
Ob._zeichnen=function(){};   // DOM neutralisieren

let pass=0, fail=0;
function t(n,c){ if(c){pass++;console.log('✓ '+n);} else {fail++;console.log('✗ '+n);} }
function reset(o,b){ state.onboardingGesehen=!!o; state.bezugslehrerWert=b||''; Ob._idx=0; Ob._startIdx=0; Ob._offen=false; Ob._cleanup=null; }

const ids=Ob.schritte.map(s=>s.id);
const n=Ob.schritte.length;

// 1 Schrittfolge Runde 1
t('Schrittfolge = willkommen/sharepoint/ichbin/privatadresse/csv/fertig',
  JSON.stringify(ids)===JSON.stringify(['willkommen','sharepoint','ichbin','privatadresse','csv','fertig']));

// 2 block-Marker
t('Block-A-Schritte korrekt markiert',
  ['sharepoint','ichbin','privatadresse','csv'].every(id=>Ob.schritte.find(s=>s.id===id).block==='A'));
t('willkommen/fertig ohne block-Marker',
  !Ob.schritte.find(s=>s.id==='willkommen').block && !Ob.schritte.find(s=>s.id==='fertig').block);
t('_blockAStart zeigt auf sharepoint (idx 1)', Ob._blockAStart()===1);

// 3 einrichtungErledigt / sollStarten (an bezugslehrerWert)
reset(false,'');   t('sollStarten=true wenn keine Ich-bin-Auswahl', Ob.sollStarten()===true);
reset(true,'Muster, A (10)'); t('sollStarten=false wenn eingerichtet', Ob.sollStarten()===false);
t('einrichtungErledigt=true bei gesetztem bezugslehrerWert', Ob.einrichtungErledigt()===true);

// 4 Trigger: Erststart (voller Wizard ab 0)
reset(false,''); Ob.pruefeStart();
t('Erststart: _offen=true', Ob._offen===true);
t('Erststart: _idx=0 (ab Willkommen)', Ob._idx===0);
t('Erststart: _startIdx=0', Ob._startIdx===0);

// 5 Trigger: Folgestart (nur Block A)
reset(true,''); Ob.pruefeStart();
t('Folgestart: startet bei Block-A (idx 1)', Ob._idx===1);
t('Folgestart: _startIdx=1', Ob._startIdx===1);
t('Folgestart: istErster am Block-A-Start', Ob.istErster()===true);

// 6 Trigger: eingerichtet -> kein Start
reset(true,'Muster, A (10)'); Ob._offen=false; Ob.pruefeStart();
t('eingerichtet: kein Auto-Start', Ob._offen===false);

// 7 Vorwärts/Grenzen
reset(false,''); Ob.starten();
Ob.weiter(); t('weiter erhöht _idx', Ob._idx===1);
Ob.zurueck(); Ob.zurueck(); t('zurueck nicht unter _startIdx', Ob._idx===0);
reset(false,''); Ob.starten(); for(let i=0;i<n-1;i++) Ob.weiter();
t('istLetzter am Ende', Ob.istLetzter()===true);

// 8 beenden vs abschliessen
reset(false,''); Ob.starten(); Ob.beenden();
t('beenden: _offen=false', Ob._offen===false);
t('beenden: onboardingGesehen NICHT gesetzt (Pflicht bleibt)', state.onboardingGesehen===false);
reset(false,''); Ob.starten(); for(let i=0;i<n-1;i++) Ob.weiter(); Ob.weiter();
t('abschliessen (Fertig): onboardingGesehen=true', state.onboardingGesehen===true);

// 9 spaeterErledigen = weiter
reset(false,''); Ob.starten(); Ob.weiter(); const vor=Ob._idx; Ob.spaeterErledigen();
t('spaeterErledigen schaltet weiter', Ob._idx===vor+1);

// 10 Folgestart: kein Willkommen/CSV vor Block A sichtbar im Fortschritt
reset(true,''); Ob.pruefeStart();
const fp=Ob.fortschritt();
t('Folgestart-Fortschritt beginnt bei Block A', fp.length===n-1);
t('Fortschritt: genau ein "an"', fp.filter(p=>p.an).length===1);

// 11 _esc
t('_esc escapt < & "', Ob._esc('a<b&c"d')==='a&lt;b&amp;c&quot;d');

// 12 Abgrenzung: keine Demo/Block-B-Schritte in Runde 1
t('kein Demo-/Block-B-Schritt in Runde 1',
  !ids.some(id=>/aufbau|praxisbesuche|touren|demo|sammel|route|dfa/i.test(id)));

// 13 live-Schritte haben Ziel
t('Block-A-live-Schritte haben Ziel',
  Ob.schritte.filter(s=>s.modus==='live').every(s=>typeof s.ziel==='string'&&s.ziel));

// 14 CSV-Schritt ist Admin-only und zeigt aufs Dashboard
const csv=Ob.schritte.find(s=>s.id==='csv');
t('csv-Schritt nurAdmin', csv.nurAdmin===true);
t('csv-Schritt Ansicht dashboard', csv.ansicht==='dashboard');

// 15 Admin sieht csv-Schritt
sp.istAdmin=true;
t('Admin: csv sichtbar', Ob._sichtbar(ids.indexOf('csv'))===true);
reset(false,''); Ob.starten();
{ let ic=[]; for(let i=0;i<10 && !Ob.istLetzter();i++){ ic.push(Ob.aktiverSchritt().id); Ob.weiter(); } ic.push(Ob.aktiverSchritt().id);
  t('Admin-Durchlauf enthält csv', ic.includes('csv')); }

// 16 Nicht-Admin überspringt csv
sp.istAdmin=false;
t('Nicht-Admin: csv NICHT sichtbar', Ob._sichtbar(ids.indexOf('csv'))===false);
reset(false,''); Ob.starten();
{ let ic=[]; for(let i=0;i<10 && !Ob.istLetzter();i++){ ic.push(Ob.aktiverSchritt().id); Ob.weiter(); } ic.push(Ob.aktiverSchritt().id);
  t('Nicht-Admin-Durchlauf ohne csv', !ic.includes('csv'));
  t('Nicht-Admin: privatadresse -> fertig direkt', ic.indexOf('fertig')===ic.indexOf('privatadresse')+1); }
// zurück überspringt csv ebenfalls (von fertig zurück auf privatadresse)
reset(false,''); Ob.starten(); while(!Ob.istLetzter()) Ob.weiter();   // bei fertig
Ob.zurueck();
t('Nicht-Admin: zurück von fertig -> privatadresse (csv übersprungen)', Ob.aktiverSchritt().id==='privatadresse');
// Fortschrittspunkte ohne csv
reset(true,''); Ob.pruefeStart();
t('Nicht-Admin-Folgestart-Fortschritt ohne csv', Ob.fortschritt().length===(n-2));  // ohne willkommen & ohne csv
sp.istAdmin=true;   // zurücksetzen

console.log('\n== '+pass+' bestanden, '+fail+' fehlgeschlagen ==');
process.exit(fail?1:0);
