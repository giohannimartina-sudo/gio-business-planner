
(function(){
'use strict';
const $=id=>document.getElementById(id);
const BACKUPS='gioAutoBackupsV016', META='gioCloudSyncMetaV027', QUEUE='gioCloudPendingV027';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function ensure(){
  if(!window.data)return false;
  ['klanten','projecten','planning','uren','materiaal','uitgaven','ritten','facturen','offertes'].forEach(k=>{if(!Array.isArray(data[k]))data[k]=[]});
  return true;
}
function counts(){
  ensure();
  return {klanten:data.klanten.length,projecten:data.projecten.length,uren:data.uren.length,materiaal:data.materiaal.length,uitgaven:data.uitgaven.length,ritten:data.ritten.length};
}
function latestBackup(){
  try{
    const a=JSON.parse(localStorage.getItem(BACKUPS)||'[]');
    return a.sort((x,y)=>new Date(y.createdAt)-new Date(x.createdAt))[0]||null
  }catch(e){return null}
}
function integrity(){
  ensure();
  const issues=[], projects=new Set(data.projecten.map(p=>p.naam||p.project).filter(Boolean));
  data.uren.forEach((u,i)=>{const p=u.project||u.projectNaam;if(p&&!projects.has(p))issues.push(`Urenregel ${i+1}: project ontbreekt (${p})`)});
  data.materiaal.forEach((m,i)=>{const p=m.project||m.projectNaam;if(p&&!projects.has(p))issues.push(`Materiaal ${i+1}: project ontbreekt (${p})`)});
  return issues;
}
function downloadMaster(){
  ensure();
  const payload={type:'GIO_BUSINESS_PLANNER_MASTER_BACKUP',appBuild:'MOBILE DEV 028',exportedAt:new Date().toISOString(),counts:counts(),data:JSON.parse(JSON.stringify(data))};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
  const u=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=u;a.download='GIO_MASTER_BACKUP_'+new Date().toISOString().replace(/[:.]/g,'-').slice(0,19)+'.json';a.click();URL.revokeObjectURL(u);
  localStorage.setItem('gioLastMasterExport',new Date().toISOString());
  render();
}
async function cloud(){
  try{
    const r=await fetch('/api/gio-sync?device_key=gio-master',{cache:'no-store'});
    const j=await r.json();
    return {ok:r.ok,row:j.row||null,error:j.error||''}
  }catch(e){return {ok:false,row:null,error:e.message}}
}
async function render(){
  if(!$('gioLiveGrid'))return;
  const c=counts(), b=latestBackup(), issues=integrity();
  const cm=await cloud(), q=localStorage.getItem(QUEUE)==='1', last=localStorage.getItem('gioLastMasterExport');
  const fresh=b && Date.now()-new Date(b.createdAt).getTime()<86400000;
  const checks=[
    ['Cloudverbinding',cm.ok,cm.ok?(cm.row?'Masterdata aanwezig':'Verbonden, cloud leeg'):cm.error],
    ['Sync-wachtrij',!q,q?'Openstaande wijzigingen':'Geen openstaande wijzigingen'],
    ['Lokale back-up',!!fresh,b?new Date(b.createdAt).toLocaleString('nl-NL'):'Nog geen back-up'],
    ['Master export',!!last,last?new Date(last).toLocaleString('nl-NL'):'Nog niet gemaakt'],
    ['Gegevenscontrole',issues.length===0,issues.length?issues.length+' aandachtspunt(en)':'Geen problemen gevonden']
  ];
  const passed=checks.filter(x=>x[1]).length;
  $('gioLiveScore').innerHTML=`<div class="gioReadyScore ${passed===checks.length?'ok':'warn'}"><b>${passed}/${checks.length}</b><span>${passed===checks.length?'Klaar voor gecontroleerde live-migratie':'Nog controles afronden vóór live'}</span></div>`;
  $('gioLiveGrid').innerHTML=Object.entries(c).map(([k,v])=>`<div class="gioReadyTile"><small>${esc(k)}</small><b>${v}</b></div>`).join('');
  $('gioLiveChecks').innerHTML=checks.map(x=>`<div class="gioReadyRow"><div><b>${esc(x[0])}</b><br><small>${esc(x[2])}</small></div><span class="gioReadyPill ${x[1]?'ok':'warn'}">${x[1]?'OK':'Controleren'}</span></div>`).join('');
  $('gioLiveIssues').innerHTML=issues.length?issues.slice(0,40).map(x=>'⚠️ '+esc(x)).join('<br>'):'✅ Geen problemen gevonden in de basiscontrole.';
}
function inject(){
  if($('livereadypro'))return;
  const main=document.querySelector('main'); if(!main)return;
  const s=document.createElement('section');s.id='livereadypro';s.className='page';
  s.innerHTML=`<div class="card"><h2>🚦 Live Readiness & Backup PRO</h2><div id="gioLiveScore"></div><div id="gioLiveGrid" class="gioLiveReadyGrid"></div><div class="gioReadyActions"><button class="btn" onclick="gioLiveMasterBackup()">💾 Nieuwe MASTER back-up</button><button class="btn2" onclick="gioLiveReadyRefresh()">🔍 Alles controleren</button><button class="btn2" onclick="gioGuardBackupNow?.()">🛡️ Lokale back-up nu</button></div></div><div class="card"><h2>Controlepunten</h2><div id="gioLiveChecks"></div></div><div class="card"><h2>Gegevenscontrole</h2><div id="gioLiveIssues" class="gioReadyIssues"></div></div>`;
  main.appendChild(s);
  const nav=document.querySelector('aside nav');
  if(nav&&![...nav.querySelectorAll('button')].some(b=>b.textContent.includes('Live Readiness'))){const b=document.createElement('button');b.textContent='🚦 Live Readiness';b.onclick=()=>{show('livereadypro',b);render()};nav.appendChild(b)}
}
window.gioLiveMasterBackup=downloadMaster;
window.gioLiveReadyRefresh=render;
window.gioLiveReadyInit=render;
function init(){ensure();inject();render();document.title='GIO Business Planner PRO — MOBILE DEV 028';try{localStorage.setItem('gioMobileBuild','MOBILE DEV 028')}catch(e){}}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',()=>setTimeout(init,2400)):setTimeout(init,2400);
})();
