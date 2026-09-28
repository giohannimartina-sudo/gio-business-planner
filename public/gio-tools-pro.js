
(function(){
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function ensure(){
  if(!window.data)return false;
  if(!Array.isArray(data.gereedschap))data.gereedschap=[];
  if(!Array.isArray(data.medewerkers))data.medewerkers=[];
  if(!Array.isArray(data.projecten))data.projecten=[];
  return true;
}
function uid(){return Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-4)}
function days(date){if(!date)return null;const a=new Date(date+'T12:00:00'),b=new Date();b.setHours(12,0,0,0);return Math.ceil((a-b)/86400000)}
let photoData='',docData='',docName='',activeTab='Alle',currentToolId='';
function inject(){
 if($('gereedschappro'))return;
 const main=document.querySelector('main');if(!main)return;
 const s=document.createElement('section');s.id='gereedschappro';s.className='page';
 s.innerHTML=`
 <div class="card"><h2>🔧 Gereedschap PRO</h2><div id="gioToolTabs" class="gioToolTabs"></div>
 <div class="row"><div><label>Zoeken</label><input id="gioToolSearch" oninput="gioRenderTools()" placeholder="Naam, merk, type, serienummer"></div><div><label>Locatie</label><select id="gioToolLocationFilter" onchange="gioRenderTools()"><option value="">Alle locaties</option><option>Bus</option><option>Magazijn</option><option>Werkplaats</option><option>Uitgeleend</option></select></div></div>
 <button class="btn" onclick="gioNewTool()">+ Gereedschap toevoegen</button><div id="gioToolList"></div></div>

 <div id="gioToolForm" class="card" style="display:none"><h2 id="gioToolFormTitle">Gereedschap toevoegen</h2><input id="gioToolId" type="hidden">
 <div class="row">
 <div><label>Foto</label><input id="gioToolPhotoInput" type="file" accept="image/*" onchange="gioToolPhotoChoose(event)"><div id="gioToolPhotoPreview"></div></div>
 <div><label>Naam</label><input id="gioToolName"></div><div><label>Merk</label><input id="gioToolBrand"></div><div><label>Type/model</label><input id="gioToolModel"></div><div><label>Serienummer</label><input id="gioToolSerial"></div><div><label>Aankoopdatum</label><input id="gioToolPurchaseDate" type="date"></div><div><label>Aankoopprijs</label><input id="gioToolPurchasePrice" type="number" step="0.01"></div><div><label>Garantie t/m</label><input id="gioToolWarranty" type="date"></div><div><label>Locatie</label><select id="gioToolLocation"><option>Bus</option><option>Magazijn</option><option>Werkplaats</option><option>Uitgeleend</option></select></div><div><label>Uitgeleend aan</label><select id="gioToolEmployee"></select></div><div><label>Project</label><select id="gioToolProject"></select></div><div><label>Onderhoud op</label><input id="gioToolMaintenance" type="date"></div><div><label>Kalibratie geldig t/m</label><input id="gioToolCalibration" type="date"></div><div><label>Status</label><select id="gioToolStatus"><option>Actief</option><option>Defect</option><option>Reparatie</option><option>Afgeschreven</option></select></div>
 </div><label>Notities</label><textarea id="gioToolNotes"></textarea>
 <label>Document / bon / certificaat</label><input id="gioToolDocInput" type="file" accept="image/*,.pdf" onchange="gioToolDocChoose(event)"><input id="gioToolDocLabel" placeholder="Omschrijving document">
 <div class="gioToolActions"><button class="btn" onclick="gioSaveTool()">Opslaan</button><button class="btn2" onclick="gioCloseToolForm()">Sluiten</button></div></div>

 <div id="gioToolDetail" class="card" style="display:none"><div class="gioToolTop"><div id="gioToolDetailPhoto"></div><div><h2 id="gioToolDetailTitle"></h2><div id="gioToolDetailMeta"></div></div></div><div id="gioToolAlerts"></div><div id="gioToolKpis" class="gioToolKpis"></div><div class="gioToolActions"><button class="btn2" onclick="gioAssignTool()">👷 Uitlenen</button><button class="btn2" onclick="gioReturnTool()">↩️ Retour</button><button class="btn2" onclick="gioEditCurrentTool()">✏️ Bewerken</button><button class="btn2" onclick="gioShowToolQr()">🔳 QR</button><button class="btn2" onclick="gioExportToolsExcel()">📊 Excel</button></div><div id="gioToolQr" class="gioQrBox" style="display:none"></div><div id="gioToolHistory"></div></div>`;
 main.appendChild(s);
 const nav=document.querySelector('aside nav');if(nav&&!([...nav.querySelectorAll('button')].some(b=>b.textContent.includes('Gereedschap PRO')))){const b=document.createElement('button');b.textContent='🔧 Gereedschap PRO';b.onclick=()=>{show('gereedschappro',b);gioToolsInit()};nav.appendChild(b)}
}
function fillSelects(){
 $('gioToolEmployee').innerHTML='<option value="">Niet uitgeleend</option>'+data.medewerkers.map(m=>`<option value="${esc(m.id)}">${esc(m.naam)}</option>`).join('');
 $('gioToolProject').innerHTML='<option value="">Niet gekoppeld</option>'+data.projecten.map(p=>`<option>${esc(p.naam||p.project||'')}</option>`).join('');
}
function alerts(t){
 const out=[],w=days(t.garantie),m=days(t.onderhoudDatum),c=days(t.kalibratie);
 if(w!==null&&w<=30)out.push({danger:w<0,text:w<0?'Garantie verlopen':'Garantie verloopt over '+w+' dagen'});
 if(m!==null&&m<=30)out.push({danger:m<0,text:m<0?'Onderhoudsdatum voorbij':'Onderhoud over '+m+' dagen'});
 if(c!==null&&c<=30)out.push({danger:c<0,text:c<0?'Kalibratie verlopen':'Kalibratie verloopt over '+c+' dagen'});
 if(t.status==='Defect'||t.status==='Reparatie')out.push({danger:true,text:'Status: '+t.status});
 return out;
}
function tabs(){const a=['Alle','Beschikbaar','Uitgeleend','Onderhoud','Waarschuwingen'];$('gioToolTabs').innerHTML=a.map(x=>`<button class="btn2 ${activeTab===x?'active':''}" onclick="gioSetToolTab('${x}')">${x}</button>`).join('')}
window.gioSetToolTab=t=>{activeTab=t;tabs();gioRenderTools()}
window.gioRenderTools=()=>{
 ensure();tabs();const q=($('gioToolSearch')?.value||'').toLowerCase(),lf=$('gioToolLocationFilter')?.value||'';
 const rows=data.gereedschap.filter(t=>{
  const a=alerts(t),tab=activeTab==='Alle'||(activeTab==='Beschikbaar'&&!t.medewerkerId&&t.status==='Actief')||(activeTab==='Uitgeleend'&&!!t.medewerkerId)||(activeTab==='Onderhoud'&&!!t.onderhoudDatum)||(activeTab==='Waarschuwingen'&&a.length);
  return tab&&(!lf||t.locatie===lf)&&(!q||[t.naam,t.merk,t.model,t.serienummer].join(' ').toLowerCase().includes(q));
 });
 $('gioToolList').innerHTML=rows.length?rows.map(t=>{const m=data.medewerkers.find(x=>String(x.id)===String(t.medewerkerId));return `<article class="gioToolCard"><div class="gioToolTop">${t.foto?`<img class="gioToolPhoto" src="${t.foto}">`:`<div class="gioToolPhotoFallback">🔧</div>`}<div style="flex:1"><h3 style="margin:0">${esc(t.naam)}</h3><div class="gioListMeta">${esc(t.merk||'')} ${esc(t.model||'')} • ${esc(t.locatie||'')}</div>${m?`<b>Uitgeleend aan ${esc(m.naam)}</b>`:''}</div></div>${alerts(t).slice(0,2).map(a=>`<div class="gioToolAlert ${a.danger?'danger':''}">${esc(a.text)}</div>`).join('')}<div class="gioToolActions"><button onclick="gioOpenTool('${t.id}')">👁 Open</button><button onclick="gioEditTool('${t.id}')">✏️</button></div></article>`}).join(''):'<p>Nog geen gereedschap.</p>';
}
window.gioNewTool=()=>{photoData='';docData='';docName='';$('gioToolId').value='';$('gioToolFormTitle').textContent='Gereedschap toevoegen';['gioToolName','gioToolBrand','gioToolModel','gioToolSerial','gioToolPurchaseDate','gioToolPurchasePrice','gioToolWarranty','gioToolMaintenance','gioToolCalibration','gioToolNotes','gioToolDocLabel'].forEach(id=>$(id).value='');$('gioToolPhotoPreview').innerHTML='';fillSelects();$('gioToolForm').style.display='block';$('gioToolForm').scrollIntoView({behavior:'smooth'})}
window.gioCloseToolForm=()=>{$('gioToolForm').style.display='none'}
window.gioToolPhotoChoose=e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{photoData=r.result;$('gioToolPhotoPreview').innerHTML=`<img class="gioToolPhoto" src="${photoData}">`};r.readAsDataURL(f)}
window.gioToolDocChoose=e=>{const f=e.target.files?.[0];if(!f)return;docName=f.name;const r=new FileReader();r.onload=()=>docData=r.result;r.readAsDataURL(f)}
window.gioSaveTool=()=>{
 ensure();const naam=$('gioToolName').value.trim();if(!naam){alert('Vul naam in');return}
 const id=$('gioToolId').value||uid(),old=data.gereedschap.find(x=>String(x.id)===String(id));
 const t={id,naam,merk:$('gioToolBrand').value.trim(),model:$('gioToolModel').value.trim(),serienummer:$('gioToolSerial').value.trim(),aankoopdatum:$('gioToolPurchaseDate').value,aankoopprijs:+$('gioToolPurchasePrice').value||0,garantie:$('gioToolWarranty').value,locatie:$('gioToolLocation').value,medewerkerId:$('gioToolEmployee').value,project:$('gioToolProject').value,onderhoudDatum:$('gioToolMaintenance').value,kalibratie:$('gioToolCalibration').value,status:$('gioToolStatus').value,notitie:$('gioToolNotes').value.trim(),foto:photoData||(old?.foto||''),documenten:[...(old?.documenten||[])],historie:[...(old?.historie||[])]};
 if(docData)t.documenten.push({id:uid(),naam:docName,label:$('gioToolDocLabel').value.trim(),data:docData,datum:new Date().toISOString()});
 t.historie.unshift({tijd:new Date().toISOString(),actie:old?'Gereedschap gewijzigd':'Gereedschap toegevoegd'});
 const i=data.gereedschap.findIndex(x=>String(x.id)===String(id));i>=0?data.gereedschap.splice(i,1,t):data.gereedschap.unshift(t);save();gioCloseToolForm();gioRenderTools();gioOpenTool(id)
}
window.gioEditTool=id=>{const t=data.gereedschap.find(x=>String(x.id)===String(id));if(!t)return;fillSelects();photoData=t.foto||'';$('gioToolId').value=t.id;$('gioToolFormTitle').textContent='Gereedschap bewerken';$('gioToolName').value=t.naam||'';$('gioToolBrand').value=t.merk||'';$('gioToolModel').value=t.model||'';$('gioToolSerial').value=t.serienummer||'';$('gioToolPurchaseDate').value=t.aankoopdatum||'';$('gioToolPurchasePrice').value=t.aankoopprijs||0;$('gioToolWarranty').value=t.garantie||'';$('gioToolLocation').value=t.locatie||'Bus';$('gioToolEmployee').value=t.medewerkerId||'';$('gioToolProject').value=t.project||'';$('gioToolMaintenance').value=t.onderhoudDatum||'';$('gioToolCalibration').value=t.kalibratie||'';$('gioToolStatus').value=t.status||'Actief';$('gioToolNotes').value=t.notitie||'';$('gioToolPhotoPreview').innerHTML=t.foto?`<img class="gioToolPhoto" src="${t.foto}">`:'';$('gioToolForm').style.display='block';$('gioToolForm').scrollIntoView({behavior:'smooth'})}
window.gioOpenTool=id=>{currentToolId=id;const t=data.gereedschap.find(x=>String(x.id)===String(id));if(!t)return;const m=data.medewerkers.find(x=>String(x.id)===String(t.medewerkerId));$('gioToolDetailTitle').textContent=t.naam;$('gioToolDetailMeta').textContent=`${t.merk||''} ${t.model||''} • ${t.serienummer||'geen serienummer'}`;$('gioToolDetailPhoto').innerHTML=t.foto?`<img class="gioToolPhoto" src="${t.foto}">`:`<div class="gioToolPhotoFallback">🔧</div>`;$('gioToolAlerts').innerHTML=alerts(t).map(a=>`<div class="gioToolAlert ${a.danger?'danger':''}">${esc(a.text)}</div>`).join('');$('gioToolKpis').innerHTML=`<div class="gioToolKpi"><small>Locatie</small><b>${esc(t.locatie||'-')}</b></div><div class="gioToolKpi"><small>Status</small><b>${esc(t.status||'-')}</b></div><div class="gioToolKpi"><small>Uitgeleend aan</small><b>${esc(m?.naam||'-')}</b></div><div class="gioToolKpi"><small>Aankoopprijs</small><b>${new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR'}).format(t.aankoopprijs||0)}</b></div>`;$('gioToolHistory').innerHTML='<h3>Historie</h3>'+t.historie.map(h=>`<div class="gioDossierRow"><b>${esc(h.actie)}</b><br><small>${esc(h.tijd)}</small></div>`).join('');$('gioToolDetail').style.display='block';$('gioToolDetail').scrollIntoView({behavior:'smooth'})}
window.gioEditCurrentTool=()=>gioEditTool(currentToolId)
window.gioAssignTool=()=>{const t=data.gereedschap.find(x=>String(x.id)===String(currentToolId));if(!t)return;const names=data.medewerkers.map((m,i)=>`${i+1}. ${m.naam}`).join('\n');const n=prompt('Kies nummer medewerker:\n'+names);const m=data.medewerkers[+n-1];if(!m)return;t.medewerkerId=m.id;t.locatie='Uitgeleend';t.historie.unshift({tijd:new Date().toISOString(),actie:'Uitgeleend aan '+m.naam});save();gioOpenTool(t.id);gioRenderTools()}
window.gioReturnTool=()=>{const t=data.gereedschap.find(x=>String(x.id)===String(currentToolId));if(!t)return;t.medewerkerId='';t.locatie='Bus';t.historie.unshift({tijd:new Date().toISOString(),actie:'Retour ontvangen'});save();gioOpenTool(t.id);gioRenderTools()}
function loadQr(){
 return new Promise((resolve,reject)=>{if(window.QRCode)return resolve(window.QRCode);const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js';s.onload=()=>resolve(window.QRCode);s.onerror=reject;document.head.appendChild(s)})
}
window.gioShowToolQr=async()=>{const t=data.gereedschap.find(x=>String(x.id)===String(currentToolId));if(!t)return;const box=$('gioToolQr');box.style.display='grid';box.innerHTML='QR wordt gemaakt...';try{const QR=await loadQr();box.innerHTML='';const c=document.createElement('canvas');box.appendChild(c);QR.toCanvas(c,JSON.stringify({type:'GIO_TOOL',id:t.id,naam:t.naam,serienummer:t.serienummer||''}),{width:180})}catch(e){box.textContent='QR kon niet worden gemaakt'}}
window.gioExportToolsExcel=()=>{const rows=[['Naam','Merk','Model','Serienummer','Locatie','Status','Medewerker','Project','Aankoopdatum','Aankoopprijs','Garantie','Onderhoud','Kalibratie'],...data.gereedschap.map(t=>{const m=data.medewerkers.find(x=>String(x.id)===String(t.medewerkerId));return[t.naam,t.merk,t.model,t.serienummer,t.locatie,t.status,m?.naam||'',t.project,t.aankoopdatum,t.aankoopprijs,t.garantie,t.onderhoudDatum,t.kalibratie]})];const html='<table border="1">'+rows.map(r=>'<tr>'+r.map(x=>'<td>'+esc(x||'')+'</td>').join('')+'</tr>').join('')+'</table>';const blob=new Blob([html],{type:'application/vnd.ms-excel'}),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='GIO_Gereedschap_'+new Date().toISOString().slice(0,10)+'.xls';a.click();URL.revokeObjectURL(u)}
window.gioToolsInit=()=>{ensure();fillSelects();tabs();gioRenderTools()}
function patchMenus(){const old=window.gioOpenMoreOverlay;window.gioOpenMoreOverlay=function(){old?.();setTimeout(()=>{const g=document.querySelector('#gioOverlayBody .gioOverlayGrid');if(g&&!g.textContent.includes('Gereedschap PRO'))g.insertAdjacentHTML('beforeend',`<button onclick="gioApprovedGo('gereedschappro');gioToolsInit()"><i>🔧</i>Gereedschap PRO</button>`)},0)}}
function init(){ensure();inject();patchMenus();gioToolsInit();document.title='GIO Business Planner PRO — MOBILE DEV 012'}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',()=>setTimeout(init,800)):setTimeout(init,800);
})();
