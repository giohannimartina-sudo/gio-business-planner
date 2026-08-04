
(function(){
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const VERSION='MOBILE DEV 016';
const BACKUP_KEY='gioAutoBackupsV016';
function ensure(){
  if(!window.data)return false;
  const arrays=['klanten','projecten','planning','uren','materiaal','uitgaven','werkboek','voorraad','medewerkers','medewerkerUren','ritten','werklinks','voertuigen','gereedschap','offertes','facturen','klantBetalingen'];
  arrays.forEach(k=>{if(!Array.isArray(data[k]))data[k]=[]});
  return true;
}
function snapshot(reason='Automatisch'){
  ensure();
  return {
    id:String(Date.now()),
    createdAt:new Date().toISOString(),
    reason,
    version:VERSION,
    counts:getCounts(),
    data:JSON.parse(JSON.stringify(data))
  };
}
function getCounts(){
  return {
    klanten:data.klanten.length,
    projecten:data.projecten.length,
    uren:data.uren.length + data.medewerkerUren.length,
    uitgaven:data.uitgaven.length,
    materiaal:data.materiaal.length,
    werkboek:data.werkboek.length,
    medewerkers:data.medewerkers.length,
    ritten:data.ritten.length,
    facturen:data.facturen.length
  };
}
function getBackups(){
  try{return JSON.parse(localStorage.getItem(BACKUP_KEY)||'[]')}catch(e){return[]}
}
function setBackups(list){
  try{localStorage.setItem(BACKUP_KEY,JSON.stringify(list.slice(0,10)));return true}catch(e){return false}
}
function makeAutoBackup(reason='Automatisch'){
  const list=getBackups();
  const snap=snapshot(reason);
  list.unshift(snap);
  const ok=setBackups(list);
  if(ok){
    try{localStorage.setItem('gioLastAutoBackup',snap.createdAt)}catch(e){}
  }
  render();
  return ok;
}
function integrity(){
  ensure();
  const issues=[];
  const projectNames=new Set(data.projecten.map(p=>p.naam||p.project).filter(Boolean));
  const clientNames=new Set(data.klanten.map(k=>k.naam||k.name).filter(Boolean));
  data.uren.forEach((u,i)=>{if(u.project&&!projectNames.has(u.project))issues.push(`Uurregel ${i+1}: project ontbreekt (${u.project})`)});
  data.materiaal.forEach((m,i)=>{if(m.project&&!projectNames.has(m.project))issues.push(`Materiaal ${i+1}: project ontbreekt (${m.project})`)});
  data.uitgaven.forEach((x,i)=>{if(x.klant&&!clientNames.has(x.klant))issues.push(`Uitgave ${i+1}: klant ontbreekt (${x.klant})`)});
  data.medewerkerUren.forEach((x,i)=>{if(x.medewerkerId&&!data.medewerkers.some(m=>String(m.id)===String(x.medewerkerId)))issues.push(`Medewerkeruur ${i+1}: medewerker ontbreekt`)});
  data.facturen.forEach((f,i)=>{if(f.klant&&!clientNames.has(f.klant))issues.push(`Factuur ${f.nummer||i+1}: klant ontbreekt (${f.klant})`)});
  return issues;
}
function inject(){
  if($('dataguardpro'))return;
  const main=document.querySelector('main'); if(!main)return;
  const s=document.createElement('section'); s.id='dataguardpro'; s.className='page';
  s.innerHTML=`
    <div class="card">
      <h2>🛡️ Stabiliteit & Back-up PRO</h2>
      <div id="gioGuardTiles" class="gioGuardGrid"></div>
      <div id="gioGuardStatus" class="gioGuardStatus">Controle wordt uitgevoerd…</div>
      <div class="gioGuardActions">
        <button class="btn" onclick="gioGuardBackupNow()">💾 Back-up nu</button>
        <button class="btn2" onclick="gioGuardDownloadAll()">⬇️ Complete export</button>
        <button class="btn2" onclick="gioGuardCheck()">🔍 Gegevens controleren</button>
        <button class="btn2" onclick="gioGuardRestoreFileClick()">📂 Herstellen uit bestand</button>
      </div>
      <input id="gioGuardRestoreFile" type="file" accept=".json,application/json" style="display:none" onchange="gioGuardReadRestoreFile(event)">
    </div>

    <div class="card">
      <h2>Automatische back-ups</h2>
      <div id="gioGuardBackups" class="gioGuardList"></div>
    </div>

    <div id="gioGuardRestorePanel" class="card" style="display:none">
      <h2>Herstel controleren</h2>
      <div id="gioGuardRestoreSummary"></div>
      <div id="gioGuardRestorePreview" class="gioGuardPreview"></div>
      <div class="gioGuardActions">
        <button class="btn" onclick="gioGuardConfirmRestore()">✅ Herstellen</button>
        <button class="btn2" onclick="gioGuardCancelRestore()">Annuleren</button>
      </div>
    </div>`;
  main.appendChild(s);

  const nav=document.querySelector('aside nav');
  if(nav && ![...nav.querySelectorAll('button')].some(b=>b.textContent.includes('Stabiliteit'))){
    const b=document.createElement('button');
    b.textContent='🛡️ Stabiliteit & Back-up';
    b.onclick=()=>{show('dataguardpro',b);gioGuardInit()};
    nav.appendChild(b);
  }
}
let pendingRestore=null;
function render(){
  if(!$('gioGuardTiles'))return;
  const c=getCounts(),backups=getBackups(),issues=integrity();
  $('gioGuardTiles').innerHTML=`
    <div class="gioGuardTile"><small>Versie</small><b>${VERSION.replace('MOBILE ','')}</b></div>
    <div class="gioGuardTile"><small>Lokale back-ups</small><b>${backups.length}</b></div>
    <div class="gioGuardTile"><small>Projecten</small><b>${c.projecten}</b></div>
    <div class="gioGuardTile"><small>Controlepunten</small><b>${issues.length}</b></div>`;
  const st=$('gioGuardStatus');
  if(issues.length){
    st.className='gioGuardStatus warn';
    st.innerHTML=`⚠️ ${issues.length} aandachtspunt(en) gevonden. Klik op Gegevens controleren.`;
  }else{
    st.className='gioGuardStatus ok';
    st.textContent='✅ De basiscontrole heeft geen ontbrekende koppelingen gevonden.';
  }
  $('gioGuardBackups').innerHTML=backups.length?backups.map(b=>`<div class="gioGuardRow"><div><b>${new Date(b.createdAt).toLocaleString('nl-NL')}</b><br><small>${esc(b.reason)} • ${esc(b.version)} • ${b.counts.projecten||0} projecten • ${b.counts.klanten||0} klanten</small></div><div class="gioGuardActions"><button onclick="gioGuardPreviewBackup('${b.id}')">👁</button><button onclick="gioGuardDownloadBackup('${b.id}')">⬇️</button><button class="del" onclick="gioGuardDeleteBackup('${b.id}')">🗑️</button></div></div>`).join(''):'<div class="gioGuardRow">Nog geen automatische back-ups.</div>';
}
window.gioGuardBackupNow=()=>{const ok=makeAutoBackup('Handmatig');alert(ok?'Back-up gemaakt.':'Back-up kon niet worden opgeslagen. Mogelijk is de browseropslag vol.')}
window.gioGuardDownloadAll=()=>{
  const payload={exportedAt:new Date().toISOString(),version:VERSION,counts:getCounts(),data};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
  const u=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=u;a.download='GIO_COMPLETE_BACKUP_'+new Date().toISOString().slice(0,10)+'.json';a.click();URL.revokeObjectURL(u);
}
window.gioGuardCheck=()=>{
  const issues=integrity(),st=$('gioGuardStatus');
  if(!issues.length){st.className='gioGuardStatus ok';st.textContent='✅ Geen problemen gevonden in de basiscontrole.';return}
  st.className='gioGuardStatus warn';
  st.innerHTML='<b>Controlepunten:</b><br>'+issues.slice(0,50).map(esc).join('<br>');
}
window.gioGuardPreviewBackup=id=>{
  const b=getBackups().find(x=>x.id===id);if(!b)return;
  pendingRestore=b;
  $('gioGuardRestoreSummary').innerHTML=`<div class="gioGuardStatus warn">Je staat op het punt een lokale back-up van <b>${new Date(b.createdAt).toLocaleString('nl-NL')}</b> te herstellen. De huidige gegevens worden eerst automatisch veiliggesteld.</div>`;
  $('gioGuardRestorePreview').textContent=JSON.stringify({version:b.version,createdAt:b.createdAt,reason:b.reason,counts:b.counts},null,2);
  $('gioGuardRestorePanel').style.display='block';
  $('gioGuardRestorePanel').scrollIntoView({behavior:'smooth'});
}
window.gioGuardDownloadBackup=id=>{
  const b=getBackups().find(x=>x.id===id);if(!b)return;
  const blob=new Blob([JSON.stringify(b,null,2)],{type:'application/json'});
  const u=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=u;a.download='GIO_LOCAL_BACKUP_'+b.createdAt.slice(0,10)+'_'+id+'.json';a.click();URL.revokeObjectURL(u);
}
window.gioGuardDeleteBackup=id=>{if(!confirm('Deze lokale back-up verwijderen?'))return;setBackups(getBackups().filter(x=>x.id!==id));render()}
window.gioGuardRestoreFileClick=()=>$('gioGuardRestoreFile').click()
window.gioGuardReadRestoreFile=e=>{
  const f=e.target.files?.[0];if(!f)return;
  const r=new FileReader();
  r.onload=()=>{
    try{
      const parsed=JSON.parse(r.result);
      const restored=parsed.data||parsed;
      if(!restored||typeof restored!=='object')throw new Error('Geen geldige gegevens');
      pendingRestore={id:'file',createdAt:parsed.exportedAt||new Date().toISOString(),version:parsed.version||'Onbekend',reason:'Bestand: '+f.name,counts:parsed.counts||{},data:restored};
      $('gioGuardRestoreSummary').innerHTML=`<div class="gioGuardStatus warn">Bestand geladen: <b>${esc(f.name)}</b>. Controleer de samenvatting voordat je herstelt.</div>`;
      $('gioGuardRestorePreview').textContent=JSON.stringify({version:pendingRestore.version,createdAt:pendingRestore.createdAt,counts:pendingRestore.counts},null,2);
      $('gioGuardRestorePanel').style.display='block';
      $('gioGuardRestorePanel').scrollIntoView({behavior:'smooth'});
    }catch(err){
      alert('Dit bestand kan niet worden hersteld: '+err.message);
    }
  };
  r.readAsText(f);
}
window.gioGuardConfirmRestore=()=>{
  if(!pendingRestore||!pendingRestore.data)return;
  if(!confirm('Weet je zeker dat je deze gegevens wilt herstellen? Er wordt eerst automatisch een back-up van de huidige situatie gemaakt.'))return;
  makeAutoBackup('Voor herstel');
  const restored=JSON.parse(JSON.stringify(pendingRestore.data));
  Object.keys(data).forEach(k=>delete data[k]);
  Object.assign(data,restored);
  ensure();
  save?.();
  pendingRestore=null;
  $('gioGuardRestorePanel').style.display='none';
  render();
  alert('Gegevens zijn hersteld. Herlaad de app om alle schermen opnieuw op te bouwen.');
}
window.gioGuardCancelRestore=()=>{pendingRestore=null;$('gioGuardRestorePanel').style.display='none'}
function wrapSave(){
  const old=window.save;
  if(typeof old!=='function'||old.__guard016)return;
  let timer=null;
  window.save=function(){
    const result=old.apply(this,arguments);
    clearTimeout(timer);
    timer=setTimeout(()=>{
      const last=localStorage.getItem('gioLastAutoBackup');
      const age=last?(Date.now()-new Date(last).getTime()):Infinity;
      if(age>30*60*1000)makeAutoBackup('Automatisch na wijziging');
    },800);
    return result;
  };
  window.save.__guard016=true;
}
window.gioGuardInit=()=>{ensure();render()}
function patchMenus(){
  const old=window.gioOpenMoreOverlay;
  window.gioOpenMoreOverlay=function(){
    old?.();
    setTimeout(()=>{
      const g=document.querySelector('#gioOverlayBody .gioOverlayGrid');
      if(g&&!g.textContent.includes('Stabiliteit & Back-up'))g.insertAdjacentHTML('beforeend',`<button onclick="gioApprovedGo('dataguardpro');gioGuardInit()"><i>🛡️</i>Stabiliteit & Back-up</button>`);
    },0);
  };
}
function init(){
  ensure();inject();patchMenus();wrapSave();
  const last=localStorage.getItem('gioLastAutoBackup');
  if(!last||Date.now()-new Date(last).getTime()>24*60*60*1000)makeAutoBackup('Dagelijkse automatische back-up');
  render();
  document.title='GIO Business Planner PRO — MOBILE DEV 016';
  try{localStorage.setItem('gioMobileBuild',VERSION)}catch(e){}
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',()=>setTimeout(init,1200)):setTimeout(init,1200);
})();
