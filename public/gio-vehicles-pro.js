
(function(){
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function ensure(){
  if(!window.data)return false;
  if(!Array.isArray(data.voertuigen))data.voertuigen=[];
  if(!Array.isArray(data.ritten))data.ritten=[];
  if(!Array.isArray(data.uitgaven))data.uitgaven=[];
  return true;
}
function uid(){return Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-4)}
function days(date){if(!date)return null;const a=new Date(date+'T12:00:00'),b=new Date();b.setHours(12,0,0,0);return Math.ceil((a-b)/86400000)}
let vehiclePhoto='',vehicleDoc='',vehicleDocName='',activeTab='Alle';
function inject(){
 if($('voertuigenpro'))return;
 const main=document.querySelector('main');if(!main)return;
 const s=document.createElement('section');s.id='voertuigenpro';s.className='page';
 s.innerHTML=`
 <div class="card"><h2>🚐 Voertuigen PRO</h2><div id="gioVehicleTabs" class="gioVehicleTabs"></div>
 <div class="row"><div><label>Zoeken</label><input id="gioVehicleSearch" oninput="gioRenderVehicles()" placeholder="Kenteken, merk, type"></div><div><label>Status</label><select id="gioVehicleStatusFilter" onchange="gioRenderVehicles()"><option value="">Alle</option><option>Actief</option><option>Verkocht</option><option>Uit gebruik</option></select></div></div>
 <button class="btn" onclick="gioNewVehicle()">+ Voertuig toevoegen</button><div id="gioVehicleList"></div></div>

 <div id="gioVehicleForm" class="card" style="display:none"><h2 id="gioVehicleFormTitle">Voertuig toevoegen</h2><input id="gioVehicleId" type="hidden">
 <div class="row">
 <div><label>Foto</label><input id="gioVehiclePhotoInput" type="file" accept="image/*" onchange="gioVehiclePhotoChoose(event)"><div id="gioVehiclePhotoPreview"></div></div>
 <div><label>Kenteken</label><input id="gioVehiclePlate"></div><div><label>Merk</label><input id="gioVehicleBrand"></div><div><label>Type/model</label><input id="gioVehicleModel"></div><div><label>Bouwjaar</label><input id="gioVehicleYear" type="number"></div><div><label>Brandstof</label><select id="gioVehicleFuel"><option>Diesel</option><option>Benzine</option><option>Elektrisch</option><option>Hybride</option><option>LPG</option></select></div><div><label>Huidige km-stand</label><input id="gioVehicleOdo" type="number"></div><div><label>Status</label><select id="gioVehicleStatus"><option>Actief</option><option>Verkocht</option><option>Uit gebruik</option></select></div>
 <div><label>APK geldig t/m</label><input id="gioVehicleApk" type="date"></div><div><label>Verzekering t/m</label><input id="gioVehicleInsurance" type="date"></div><div><label>Onderhoud gepland op</label><input id="gioVehicleMaintenance" type="date"></div><div><label>Onderhoud bij km</label><input id="gioVehicleMaintenanceKm" type="number"></div><div><label>Banden vervangen bij km</label><input id="gioVehicleTyreKm" type="number"></div><div><label>Olie vervangen bij km</label><input id="gioVehicleOilKm" type="number"></div>
 </div><label>Notities</label><textarea id="gioVehicleNotes"></textarea>
 <label>Document/foto toevoegen</label><input id="gioVehicleDocInput" type="file" accept="image/*,.pdf" onchange="gioVehicleDocChoose(event)"><input id="gioVehicleDocLabel" placeholder="Bijv. verzekering, APK, schadefoto">
 <div class="gioVehicleActions"><button class="btn" onclick="gioSaveVehicle()">Opslaan</button><button class="btn2" onclick="gioCloseVehicleForm()">Sluiten</button></div><div id="gioVehicleDocs"></div></div>

 <div id="gioVehicleDetail" class="card" style="display:none"><div class="gioVehicleTop"><div id="gioVehicleDetailPhoto"></div><div><h2 id="gioVehicleDetailTitle"></h2><div id="gioVehicleDetailMeta"></div></div></div><div id="gioVehicleAlerts"></div><div id="gioVehicleKpis" class="gioVehicleKpis"></div><div class="gioVehicleActions"><button class="btn2" onclick="gioVehicleStartTrip()">🚘 Rit starten</button><button class="btn2" onclick="gioVehicleScanReceipt()">📷 Bon scannen</button><button class="btn2" onclick="gioEditCurrentVehicle()">✏️ Bewerken</button><button class="btn2" onclick="gioExportVehicleExcel()">📊 Excel</button></div><div id="gioVehicleHistory"></div></div>`;
 main.appendChild(s);
 const nav=document.querySelector('aside nav');if(nav&&!([...nav.querySelectorAll('button')].some(b=>b.textContent.includes('Voertuigen PRO')))){const b=document.createElement('button');b.textContent='🚐 Voertuigen PRO';b.onclick=()=>{show('voertuigenpro',b);gioVehiclesInit()};nav.appendChild(b)}
}
function tabs(){const a=['Alle','Actief','Onderhoud','Waarschuwingen'];$('gioVehicleTabs').innerHTML=a.map(x=>`<button class="btn2 ${activeTab===x?'active':''}" onclick="gioSetVehicleTab('${x}')">${x}</button>`).join('')}
window.gioSetVehicleTab=t=>{activeTab=t;tabs();gioRenderVehicles()}
function alerts(v){
 const out=[],apk=days(v.apk),ins=days(v.verzekering),m=days(v.onderhoudDatum);
 if(apk!==null&&apk<=30)out.push({danger:apk<0,text:apk<0?'APK verlopen':'APK verloopt over '+apk+' dagen'});
 if(ins!==null&&ins<=30)out.push({danger:ins<0,text:ins<0?'Verzekering verlopen':'Verzekering verloopt over '+ins+' dagen'});
 if(m!==null&&m<=30)out.push({danger:m<0,text:m<0?'Onderhoudsdatum voorbij':'Onderhoud over '+m+' dagen'});
 if(v.onderhoudKm&&v.kmstand>=v.onderhoudKm)out.push({danger:true,text:'Onderhoud op kilometerstand nodig'});
 if(v.bandenKm&&v.kmstand>=v.bandenKm)out.push({danger:true,text:'Bandencontrole/vervanging nodig'});
 if(v.olieKm&&v.kmstand>=v.olieKm)out.push({danger:true,text:'Olie verversen nodig'});
 return out;
}
window.gioRenderVehicles=()=>{
 ensure();tabs();const q=($('gioVehicleSearch')?.value||'').toLowerCase(),sf=$('gioVehicleStatusFilter')?.value||'';
 const rows=data.voertuigen.filter(v=>{
  const a=alerts(v),tab=activeTab==='Alle'||(activeTab==='Actief'&&v.status==='Actief')||(activeTab==='Onderhoud'&&(v.onderhoudDatum||v.onderhoudKm))||(activeTab==='Waarschuwingen'&&a.length);
  return tab&&(!sf||v.status===sf)&&(!q||[v.kenteken,v.merk,v.model].join(' ').toLowerCase().includes(q));
 });
 $('gioVehicleList').innerHTML=rows.length?rows.map(v=>`<article class="gioVehicleCard"><div class="gioVehicleTop">${v.foto?`<img class="gioVehiclePhoto" src="${v.foto}">`:`<div class="gioVehiclePhotoFallback">🚐</div>`}<div style="flex:1"><h3 style="margin:0">${esc(v.kenteken)}</h3><div class="gioListMeta">${esc(v.merk||'')} ${esc(v.model||'')} • ${esc(v.brandstof||'')}</div><b>${Number(v.kmstand||0).toLocaleString('nl-NL')} km</b></div></div>${alerts(v).slice(0,2).map(a=>`<div class="gioVehicleAlert ${a.danger?'danger':''}">${esc(a.text)}</div>`).join('')}<div class="gioVehicleActions"><button onclick="gioOpenVehicle('${v.id}')">👁 Open</button><button onclick="gioVehicleQuickTrip('${v.id}')">🚘 Rit</button><button onclick="gioEditVehicle('${v.id}')">✏️</button></div></article>`).join(''):'<p>Nog geen voertuigen.</p>';
}
window.gioNewVehicle=()=>{vehiclePhoto='';vehicleDoc='';vehicleDocName='';$('gioVehicleId').value='';$('gioVehicleFormTitle').textContent='Voertuig toevoegen';['gioVehiclePlate','gioVehicleBrand','gioVehicleModel','gioVehicleYear','gioVehicleOdo','gioVehicleApk','gioVehicleInsurance','gioVehicleMaintenance','gioVehicleMaintenanceKm','gioVehicleTyreKm','gioVehicleOilKm','gioVehicleNotes','gioVehicleDocLabel'].forEach(id=>$(id).value='');$('gioVehiclePhotoPreview').innerHTML='';$('gioVehicleForm').style.display='block';$('gioVehicleForm').scrollIntoView({behavior:'smooth'})}
window.gioCloseVehicleForm=()=>{$('gioVehicleForm').style.display='none'}
window.gioVehiclePhotoChoose=e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{vehiclePhoto=r.result;$('gioVehiclePhotoPreview').innerHTML=`<img class="gioVehiclePhoto" src="${vehiclePhoto}">`};r.readAsDataURL(f)}
window.gioVehicleDocChoose=e=>{const f=e.target.files?.[0];if(!f)return;vehicleDocName=f.name;const r=new FileReader();r.onload=()=>vehicleDoc=r.result;r.readAsDataURL(f)}
window.gioSaveVehicle=()=>{
 ensure();const plate=$('gioVehiclePlate').value.trim().toUpperCase();if(!plate){alert('Vul kenteken in');return}
 const id=$('gioVehicleId').value||uid(),old=data.voertuigen.find(x=>String(x.id)===String(id));
 const v={id,kenteken:plate,merk:$('gioVehicleBrand').value.trim(),model:$('gioVehicleModel').value.trim(),bouwjaar:+$('gioVehicleYear').value||'',brandstof:$('gioVehicleFuel').value,kmstand:+$('gioVehicleOdo').value||0,status:$('gioVehicleStatus').value,apk:$('gioVehicleApk').value,verzekering:$('gioVehicleInsurance').value,onderhoudDatum:$('gioVehicleMaintenance').value,onderhoudKm:+$('gioVehicleMaintenanceKm').value||0,bandenKm:+$('gioVehicleTyreKm').value||0,olieKm:+$('gioVehicleOilKm').value||0,notitie:$('gioVehicleNotes').value.trim(),foto:vehiclePhoto||(old?.foto||''),documenten:[...(old?.documenten||[])],historie:[...(old?.historie||[])]};
 if(vehicleDoc)v.documenten.push({id:uid(),naam:vehicleDocName,label:$('gioVehicleDocLabel').value.trim(),data:vehicleDoc,datum:new Date().toISOString()});
 v.historie.unshift({tijd:new Date().toISOString(),actie:old?'Voertuig gewijzigd':'Voertuig toegevoegd',kmstand:v.kmstand});
 const i=data.voertuigen.findIndex(x=>String(x.id)===String(id));i>=0?data.voertuigen.splice(i,1,v):data.voertuigen.unshift(v);save();gioCloseVehicleForm();gioRenderVehicles();gioOpenVehicle(id)
}
window.gioEditVehicle=id=>{const v=data.voertuigen.find(x=>String(x.id)===String(id));if(!v)return;vehiclePhoto=v.foto||'';$('gioVehicleId').value=v.id;$('gioVehicleFormTitle').textContent='Voertuig bewerken';$('gioVehiclePlate').value=v.kenteken||'';$('gioVehicleBrand').value=v.merk||'';$('gioVehicleModel').value=v.model||'';$('gioVehicleYear').value=v.bouwjaar||'';$('gioVehicleFuel').value=v.brandstof||'Diesel';$('gioVehicleOdo').value=v.kmstand||0;$('gioVehicleStatus').value=v.status||'Actief';$('gioVehicleApk').value=v.apk||'';$('gioVehicleInsurance').value=v.verzekering||'';$('gioVehicleMaintenance').value=v.onderhoudDatum||'';$('gioVehicleMaintenanceKm').value=v.onderhoudKm||0;$('gioVehicleTyreKm').value=v.bandenKm||0;$('gioVehicleOilKm').value=v.olieKm||0;$('gioVehicleNotes').value=v.notitie||'';$('gioVehiclePhotoPreview').innerHTML=v.foto?`<img class="gioVehiclePhoto" src="${v.foto}">`:'';$('gioVehicleForm').style.display='block';$('gioVehicleForm').scrollIntoView({behavior:'smooth'})}
let currentVehicleId='';
window.gioOpenVehicle=id=>{currentVehicleId=id;const v=data.voertuigen.find(x=>String(x.id)===String(id));if(!v)return;$('gioVehicleDetailTitle').textContent=v.kenteken;$('gioVehicleDetailMeta').textContent=`${v.merk||''} ${v.model||''} • ${v.brandstof||''}`;$('gioVehicleDetailPhoto').innerHTML=v.foto?`<img class="gioVehiclePhoto" src="${v.foto}">`:`<div class="gioVehiclePhotoFallback">🚐</div>`;const trips=data.ritten.filter(r=>r.voertuig===v.kenteken),km=trips.reduce((s,r)=>s+(+r.km||0),0),fuel=data.uitgaven.filter(u=>u.voertuig===v.kenteken&&['Brandstof','Auto laden'].includes(u.categorie)).reduce((s,u)=>s+(+u.bedrag||0),0);$('gioVehicleKpis').innerHTML=`<div class="gioVehicleKpi"><small>Km-stand</small><b>${Number(v.kmstand||0).toLocaleString('nl-NL')}</b></div><div class="gioVehicleKpi"><small>Geregistreerde ritten</small><b>${trips.length}</b></div><div class="gioVehicleKpi"><small>Gereden km</small><b>${km.toFixed(1)}</b></div><div class="gioVehicleKpi"><small>Brandstof/laden</small><b>${new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR'}).format(fuel)}</b></div>`;$('gioVehicleAlerts').innerHTML=alerts(v).map(a=>`<div class="gioVehicleAlert ${a.danger?'danger':''}">${esc(a.text)}</div>`).join('');$('gioVehicleHistory').innerHTML='<h3>Historie</h3>'+[...v.historie,...trips.map(r=>({tijd:r.datum,actie:`Rit ${r.van||''} → ${r.naar||''} • ${r.km||0} km`}))].sort((a,b)=>String(b.tijd).localeCompare(String(a.tijd))).slice(0,30).map(h=>`<div class="gioDossierRow"><b>${esc(h.actie)}</b><br><small>${esc(h.tijd)}</small></div>`).join('');$('gioVehicleDetail').style.display='block';$('gioVehicleDetail').scrollIntoView({behavior:'smooth'})}
window.gioEditCurrentVehicle=()=>gioEditVehicle(currentVehicleId)
window.gioVehicleQuickTrip=id=>{currentVehicleId=id;gioVehicleStartTrip()}
window.gioVehicleStartTrip=()=>{const v=data.voertuigen.find(x=>String(x.id)===String(currentVehicleId));if(!v)return;const b=[...document.querySelectorAll('aside nav button')].find(x=>x.textContent.includes('Rittenregistratie'));show('rittenregistratie',b||document.querySelector('aside nav button'));gioRitInit?.();if($('ritVoertuig'))$('ritVoertuig').value=v.kenteken;if($('ritBegin'))$('ritBegin').value=v.kmstand||0}
window.gioVehicleScanReceipt=()=>{const v=data.voertuigen.find(x=>String(x.id)===String(currentVehicleId));if(!v)return;const b=[...document.querySelectorAll('aside nav button')].find(x=>x.textContent.includes('Bon Scanner'));show('bonscanner',b||document.querySelector('aside nav button'));gioScanInit?.();if($('scanVoertuig'))$('scanVoertuig').value=v.kenteken}
window.gioExportVehicleExcel=()=>{const v=data.voertuigen.find(x=>String(x.id)===String(currentVehicleId));if(!v)return;const rows=[['Datum','Type','Omschrijving','Km','Bedrag'],...data.ritten.filter(r=>r.voertuig===v.kenteken).map(r=>[r.datum,'Rit',`${r.van||''} - ${r.naar||''}`,r.km||0,'']),...data.uitgaven.filter(u=>u.voertuig===v.kenteken).map(u=>[u.datum,u.categorie,u.omschrijving||u.leverancier||'',u.km||'',u.bedrag||0])];const html='<table border="1">'+rows.map(r=>'<tr>'+r.map(x=>'<td>'+esc(x)+'</td>').join('')+'</tr>').join('')+'</table>';const blob=new Blob([html],{type:'application/vnd.ms-excel'}),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='GIO_Voertuig_'+v.kenteken+'.xls';a.click();URL.revokeObjectURL(u)}
window.gioVehiclesInit=()=>{ensure();tabs();gioRenderVehicles()}
function patchMenus(){const old=window.gioOpenMoreOverlay;window.gioOpenMoreOverlay=function(){old?.();setTimeout(()=>{const g=document.querySelector('#gioOverlayBody .gioOverlayGrid');if(g&&!g.textContent.includes('Voertuigen PRO'))g.insertAdjacentHTML('beforeend',`<button onclick="gioApprovedGo('voertuigenpro');gioVehiclesInit()"><i>🚐</i>Voertuigen PRO</button>`)},0)}}
function init(){ensure();inject();patchMenus();gioVehiclesInit();document.title='GIO Business Planner PRO — MOBILE DEV 011'}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',()=>setTimeout(init,700)):setTimeout(init,700);
})();
