
(function(){
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const KEY='gio-master';
const META='gioCloudSyncMetaV027';
const DEVICE='gioCloudDeviceV027';
const SNAPSHOT='gioCloudLocalSnapshotV027';
const QUEUE='gioCloudPendingV027';
let busy=false, autoTimer=null;

function ensure(){
  if(!window.data)return false;
  if(!Array.isArray(data.syncLog))data.syncLog=[];
  return true;
}
function meta(){
  try{return JSON.parse(localStorage.getItem(META)||'{}')}catch(e){return{}}
}
function setMeta(v){
  try{localStorage.setItem(META,JSON.stringify(v))}catch(e){}
}
function device(){
  let d={};try{d=JSON.parse(localStorage.getItem(DEVICE)||'{}')}catch(e){}
  if(!d.id){d={id:'dev-'+Math.random().toString(36).slice(2,10),name:/Mobi|Android|iPhone/i.test(navigator.userAgent)?'Master mobiel':'Master desktop',createdAt:new Date().toISOString()};try{localStorage.setItem(DEVICE,JSON.stringify(d))}catch(e){}}
  return d;
}
function saveSnapshot(reason='Voor cloud-wijziging'){
  try{localStorage.setItem(SNAPSHOT,JSON.stringify({at:new Date().toISOString(),reason,data:JSON.parse(JSON.stringify(data))}));return true}catch(e){return false}
}
function restoreSnapshot(){
  let snap=null;try{snap=JSON.parse(localStorage.getItem(SNAPSHOT)||'null')}catch(e){}
  if(!snap?.data){state('Er is nog geen lokale herstelkopie beschikbaar.','warn');return false}
  if(!confirm('Lokale herstelkopie terugzetten van '+new Date(snap.at).toLocaleString('nl-NL')+'?'))return false;
  const before=JSON.parse(JSON.stringify(data));
  try{Object.keys(data).forEach(k=>delete data[k]);Object.assign(data,JSON.parse(JSON.stringify(snap.data)));if(typeof window.save==='function')window.save();log('Lokale herstelkopie teruggezet','ok');state('Lokale herstelkopie teruggezet.','ok');setPending(true);refresh();return true}catch(e){Object.keys(data).forEach(k=>delete data[k]);Object.assign(data,before);state('Herstellen mislukt: '+e.message,'bad');return false}
}
function pending(){
  try{return localStorage.getItem(QUEUE)==='1'}catch(e){return false}
}
function setPending(v){
  try{v?localStorage.setItem(QUEUE,'1'):localStorage.removeItem(QUEUE)}catch(e){}
}
function log(msg,type='info'){
  ensure();
  data.syncLog.unshift({time:new Date().toISOString(),msg,type});
  data.syncLog=data.syncLog.slice(0,40);
}
function counts(){
  const keys=['klanten','projecten','uren','materiaal','uitgaven','medewerkers','ritten','facturen'];
  return keys.reduce((o,k)=>(o[k]=Array.isArray(data[k])?data[k].length:0,o),{});
}
function safePayload(){
  // Volledige masterdata blijft lokaal + cloud. Interne sync-log niet meesturen.
  const clone=JSON.parse(JSON.stringify(data));
  delete clone.syncLog;
  return clone;
}
function replaceData(payload){
  if(!payload||typeof payload!=='object')return false;
  saveSnapshot('Automatisch vóór Van cloud');
  const before=JSON.parse(JSON.stringify(data));
  try{
    Object.keys(data).forEach(k=>delete data[k]);
    Object.assign(data,JSON.parse(JSON.stringify(payload)));
    if(typeof window.save==='function')window.save();
    return true;
  }catch(e){
    Object.keys(data).forEach(k=>delete data[k]);
    Object.assign(data,before);
    throw e;
  }
}
function state(text,kind=''){
  const e=$('gioCloudState');
  if(e){e.className='gioCloudState '+kind;e.textContent=text}
}
async function api(method,body){
  const opts={method,headers:{'Content-Type':'application/json'},cache:'no-store'};
  if(body)opts.body=JSON.stringify(body);
  const url='/api/gio-sync?device_key='+encodeURIComponent(KEY);
  const res=await fetch(url,opts);
  let json={};try{json=await res.json()}catch(e){}
  return {res,json};
}
async function pull(silent=false){
  if(busy)return false;busy=true;
  try{
    if(!navigator.onLine){setPending(true);if(!silent)state('Offline: lokale gegevens blijven beschikbaar.','warn');return false}
    if(!silent)state('Cloudgegevens ophalen…');
    const {res,json}=await api('GET');
    if(!res.ok){
      if(json.configured===false)state('Cloud nog niet ingericht. Lokaal blijft alles werken.','warn');
      else state('Cloud ophalen mislukt: '+(json.error||res.status),'bad');
      return false;
    }
    const row=json.row;
    if(!row){if(!silent)state('Cloud is leeg. Gebruik “Naar cloud” om de huidige data als eerste versie te plaatsen.','warn');return true}
    const m=meta(),remoteTs=row.updated_at||'';
    if(!silent && m.lastRemote===remoteTs){state('Cloud en dit apparaat zijn al gelijk.','ok');return true}
    replaceData(row.payload||{});
    setMeta({...m,lastRemote:remoteTs,lastPull:new Date().toISOString(),lastAction:'pull'});
    setPending(false);
    log('Cloudgegevens opgehaald','ok');
    if(!silent)state('Cloudgegevens zijn opgehaald.','ok');
    refresh();
    return true;
  }catch(e){
    state('Cloudfout: '+e.message,'bad');return false;
  }finally{busy=false}
}
async function push(force=false,silent=false){
  if(busy)return false;busy=true;
  try{
    if(!navigator.onLine){setPending(true);if(!silent)state('Offline: wijzigingen staan klaar voor synchronisatie.','warn');return false}
    if(!silent)state('Gegevens naar cloud sturen…');
    const m=meta();
    const {res,json}=await api('POST',{
      device_key:KEY,
      payload:safePayload(),
      base_updated_at:m.lastRemote||null,
      force,
      updated_by:device().name+' ('+device().id+')'
    });
    if(res.status===409){
      setPending(true);
      state('Conflict: de cloud bevat nieuwere gegevens. Kies eerst “Van cloud”, of gebruik “Forceer lokale versie”.','warn');
      log('Syncconflict gedetecteerd','warn');
      return false;
    }
    if(!res.ok){
      if(json.configured===false)state('Cloud nog niet ingericht. Lokaal blijft alles werken.','warn');
      else state('Cloud opslaan mislukt: '+(json.error||res.status),'bad');
      setPending(true);return false;
    }
    const ts=json.row?.updated_at||new Date().toISOString();
    setMeta({...m,lastRemote:ts,lastPush:new Date().toISOString(),lastAction:'push'});
    setPending(false);
    log(force?'Lokale versie geforceerd naar cloud':'Lokale gegevens naar cloud','ok');
    if(!silent)state('Synchronisatie voltooid.','ok');
    refresh();
    return true;
  }catch(e){
    setPending(true);state('Cloudfout: '+e.message,'bad');return false;
  }finally{busy=false}
}
function refresh(){
  if(!$('gioCloudKpis'))return;
  const m=meta(),c=counts();
  $('gioCloudKpis').innerHTML=`
    <div class="gioCloudKpi"><small>Verbinding</small><b>${navigator.onLine?'Online':'Offline'}</b></div>
    <div class="gioCloudKpi"><small>Wachtrij</small><b>${pending()?'Ja':'Nee'}</b></div>
    <div class="gioCloudKpi"><small>Laatste push</small><b>${m.lastPush?new Date(m.lastPush).toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit'}):'-'}</b></div>
    <div class="gioCloudKpi"><small>Projecten</small><b>${c.projecten}</b></div>
    <div class="gioCloudKpi"><small>Apparaat</small><b>${esc(device().name)}</b></div>`;
  $('gioCloudLog').innerHTML=(data.syncLog||[]).length?data.syncLog.map(x=>`<div><b>${new Date(x.time).toLocaleString('nl-NL')}</b><br>${esc(x.msg)}</div>`).join(''):'Nog geen sync-log.';
}
function inject(){
  if($('cloudpro2'))return;
  const main=document.querySelector('main');if(!main)return;
  const s=document.createElement('section');s.id='cloudpro2';s.className='page';
  s.innerHTML=`<div class="card"><h2>☁️ Cloud Sync & Data PRO</h2>
    <div id="gioCloudState" class="gioCloudState">Cloudstatus controleren…</div>
    <div id="gioCloudKpis" class="gioCloudKpis"></div>
    <div class="gioCloudActions">
      <button class="btn" onclick="gioCloudSyncNow()">🔄 Synchroniseren</button>
      <button class="btn2" onclick="gioCloudPull()">⬇️ Van cloud</button>
      <button class="btn2" onclick="gioCloudPush()">⬆️ Naar cloud</button>
      <button class="btn2" onclick="gioCloudRestore()">↩️ Herstel lokale versie</button>
      <button class="btn2" onclick="gioCloudRenameDevice()">✏️ Apparaatnaam</button>
      <button class="btn2" onclick="gioCloudForcePush()">⚠️ Forceer lokale versie</button>
    </div>
    <p><small>Automatische sync gebruikt een korte vertraging na wijzigingen. Bij internetuitval blijft de lokale app werken en wordt een wachtrij gemarkeerd.</small></p>
  </div>
  <div class="card"><h2>Sync-log</h2><div id="gioCloudLog" class="gioCloudLog"></div></div>`;
  main.appendChild(s);

  const nav=document.querySelector('aside nav');
  if(nav&&!([...nav.querySelectorAll('button')].some(b=>b.textContent.includes('Cloud Sync & Data PRO')))){
    const b=document.createElement('button');
    b.textContent='☁️ Cloud Sync & Data PRO';
    b.onclick=()=>{show('cloudpro2',b);gioCloudInit()};
    nav.appendChild(b);
  }
}
window.gioCloudPull=()=>pull(false);
window.gioCloudRestore=()=>restoreSnapshot();
window.gioCloudRenameDevice=()=>{const d=device();const n=prompt('Naam van dit apparaat:',d.name);if(n){d.name=String(n).trim().slice(0,60)||d.name;try{localStorage.setItem(DEVICE,JSON.stringify(d))}catch(e){}refresh();}};
window.gioCloudPush=()=>push(false,false);
window.gioCloudForcePush=()=>confirm('Alleen gebruiken als je zeker weet dat de lokale gegevens de juiste nieuwste versie zijn. Cloud overschrijven?')&&push(true,false);
window.gioCloudSyncNow=async()=>{
  if(pending())return push(false,false);
  const m=meta();
  const {res,json}=await api('GET');
  if(!res.ok){
    state(json.configured===false?'Cloud nog niet ingericht. Lokaal blijft alles werken.':'Cloudcontrole mislukt: '+(json.error||res.status),json.configured===false?'warn':'bad');
    return;
  }
  if(!json.row)return push(false,false);
  const remote=json.row.updated_at||'';
  if(!m.lastRemote||new Date(remote)>new Date(m.lastRemote))return pull(false);
  return push(false,false);
}
window.gioCloudInit=async()=>{
  ensure();refresh();
  if(!navigator.onLine){state('Offline: lokale modus actief.','warn');return}
  try{
    const {res,json}=await api('GET');
    if(!res.ok){
      state(json.configured===false?'Cloud nog niet ingericht. Voer eerst de DEV 026 SQL uit in Supabase.':'Cloudstatus fout: '+(json.error||res.status),json.configured===false?'warn':'bad');
    }else{
      state(json.row?'Cloudverbinding actief.':'Cloudverbinding actief, maar er staat nog geen masterdata in cloud.','ok');
    }
  }catch(e){state('Cloudstatus fout: '+e.message,'bad')}
  refresh();
}
function patchSave(){
  const old=window.save;
  if(typeof old!=='function'||old.__cloud026)return;
  window.save=function(){
    const result=old.apply(this,arguments);
    setPending(true);
    clearTimeout(autoTimer);
    autoTimer=setTimeout(()=>{if(navigator.onLine)push(false,true)},5000);
    refresh();
    return result;
  };
  window.save.__cloud026=true;
}
function patchMenus(){
  const old=window.gioOpenMoreOverlay;
  window.gioOpenMoreOverlay=function(){
    old?.();
    setTimeout(()=>{
      const g=document.querySelector('#gioOverlayBody .gioOverlayGrid');
      if(g&&!g.textContent.includes('Cloud Sync & Data PRO'))g.insertAdjacentHTML('beforeend',`<button onclick="gioApprovedGo('cloudpro2');gioCloudInit()"><i>☁️</i>Cloud Sync & Data PRO</button>`);
    },0);
  };
}
function init(){
  ensure();inject();patchSave();patchMenus();refresh();
  window.addEventListener('online',()=>{state('Internet terug. Wachtrij wordt gesynchroniseerd…','ok');if(pending())setTimeout(()=>push(false,true),1000)});
  window.addEventListener('offline',()=>state('Offline: lokale modus actief. Wijzigingen blijven bewaard.','warn'));
  setInterval(()=>{if(navigator.onLine&&!pending())pull(true)},120000);
  document.title='GIO Business Planner PRO — MOBILE DEV 027';
  try{localStorage.setItem('gioMobileBuild','MOBILE DEV 027')}catch(e){}
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',()=>setTimeout(init,2200)):setTimeout(init,2200);
})();
