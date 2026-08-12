
(function(){
'use strict';
const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),eur=v=>new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR'}).format(+v||0);
function ensure(){if(!window.data)return false;if(!Array.isArray(data.projecten))data.projecten=[];if(!Array.isArray(data.facturen))data.facturen=[];if(!Array.isArray(data.klantBetalingen))data.klantBetalingen=[];data.projecten.forEach(p=>{if(!p.status)p.status='Open';if(!p.projectnummer)p.projectnummer=p.nr||p.id||'';if(!Array.isArray(p.historie))p.historie=[]});return true}
function today(){return new Date().toISOString().slice(0,10)}
function daysTo(date){if(!date)return null;const a=new Date(date+'T12:00:00'),b=new Date();b.setHours(12,0,0,0);return Math.ceil((a-b)/86400000)}
function quarter(date){if(!date)return'-';const d=new Date(date+'T12:00:00');return 'Q'+(Math.floor(d.getMonth()/3)+1)+' '+d.getFullYear()}
function projectTotal(name){
 const inv=data.facturen.filter(f=>f.project===name).reduce((s,f)=>{let t=0;(f.regels||[]).forEach(l=>{const b=(+l.aantal||0)*(+l.prijs||0);t+=b+b*(+l.btw||0)/100});return s+t},0);
 const paid=data.klantBetalingen.filter(p=>p.project===name).reduce((s,p)=>s+(+p.bedrag||0),0);
 return{inv,paid,open:Math.max(0,inv-paid)}
}
let activeTab='Actief';
function inject(){
 if($('projectstatuspro'))return;
 const main=document.querySelector('main');if(!main)return;
 const s=document.createElement('section');s.id='projectstatuspro';s.className='page';
 s.innerHTML=`<div class="card"><h2>📂 Projectstatus & Archief PRO</h2><div id="gioProjectStatusTabs" class="gioProjectTabs"></div><div id="gioProjectStatusKpis" class="gioProjectStatusKpis"></div><div class="row"><div><label>Zoeken</label><input id="gioProjectStatusSearch" oninput="gioRenderProjectStatus()"></div><div><label>Jaar</label><select id="gioProjectStatusYear" onchange="gioRenderProjectStatus()"></select></div><div><label>Kwartaal</label><select id="gioProjectStatusQuarter" onchange="gioRenderProjectStatus()"><option value="">Alle kwartalen</option><option>Q1</option><option>Q2</option><option>Q3</option><option>Q4</option></select></div></div><div class="gioProjectStatusActions"><button class="btn2" onclick="gioExportProjectArchiveExcel()">📊 Excel</button></div><div id="gioProjectStatusList"></div></div>`;
 main.appendChild(s);
 const nav=document.querySelector('aside nav');if(nav&&!([...nav.querySelectorAll('button')].some(b=>b.textContent.includes('Projectstatus & Archief PRO')))){const b=document.createElement('button');b.textContent='📂 Projectstatus & Archief PRO';b.onclick=()=>{show('projectstatuspro',b);gioProjectStatusInit()};nav.appendChild(b)}
}
function tabs(){const a=['Actief','Klaar te factureren','Betaald','Archief','Alles'];$('gioProjectStatusTabs').innerHTML=a.map(x=>`<button class="btn2 ${activeTab===x?'active':''}" onclick="gioProjectStatusSetTab('${x}')">${x}</button>`).join('')}
window.gioProjectStatusSetTab=t=>{activeTab=t;tabs();gioRenderProjectStatus()}
function fillYears(){const years=[...new Set(data.projecten.map(p=>{const d=p.archiefDatum||p.einddatum||p.einde||p.start||p.datum||today();return new Date(d+'T12:00:00').getFullYear()}).filter(Boolean))].sort((a,b)=>b-a);$('gioProjectStatusYear').innerHTML='<option value="">Alle jaren</option>'+years.map(y=>`<option>${y}</option>`).join('')}
function normalizedStatus(p){
 const s=(p.status||'Open').toLowerCase();
 if(s.includes('archief'))return'Archief';
 if(s.includes('betaald'))return'Betaald';
 if(s.includes('factur'))return'Klaar te factureren';
 if(s.includes('klaar')||s.includes('done'))return'Klaar te factureren';
 return'Actief';
}
function filtered(){
 const q=($('gioProjectStatusSearch')?.value||'').toLowerCase(),year=$('gioProjectStatusYear')?.value||'',qt=$('gioProjectStatusQuarter')?.value||'';
 return data.projecten.filter(p=>{
   const st=normalizedStatus(p),date=p.archiefDatum||p.einddatum||p.einde||p.start||p.datum||today(),d=new Date(date+'T12:00:00'),y=String(d.getFullYear()),qtr='Q'+(Math.floor(d.getMonth()/3)+1);
   const tab=activeTab==='Alles'||st===activeTab;
   return tab&&(!year||y===year)&&(!qt||qtr===qt)&&(!q||[p.naam,p.project,p.projectnummer,p.klant,p.status].join(' ').toLowerCase().includes(q));
 });
}
window.gioRenderProjectStatus=()=>{
 ensure();tabs();fillYears();const rows=filtered(),all=data.projecten,active=all.filter(p=>normalizedStatus(p)==='Actief').length,ready=all.filter(p=>normalizedStatus(p)==='Klaar te factureren').length,paid=all.filter(p=>normalizedStatus(p)==='Betaald').length,arch=all.filter(p=>normalizedStatus(p)==='Archief').length;
 $('gioProjectStatusKpis').innerHTML=`<div class="gioProjectStatusKpi"><small>Actief</small><b>${active}</b></div><div class="gioProjectStatusKpi"><small>Klaar factureren</small><b>${ready}</b></div><div class="gioProjectStatusKpi"><small>Betaald</small><b>${paid}</b></div><div class="gioProjectStatusKpi"><small>Archief</small><b>${arch}</b></div>`;
 if(activeTab==='Archief'){
   const groups={};rows.forEach(p=>{const key=quarter(p.archiefDatum||p.einddatum||p.einde||p.start||p.datum);(groups[key]||(groups[key]=[])).push(p)});
   $('gioProjectStatusList').innerHTML=Object.entries(groups).map(([q,ps])=>`<div class="gioQuarterGroup"><h3>${esc(q)} — ${ps.length} project(en)</h3>${ps.map(renderCard).join('')}</div>`).join('')||'<p>Geen gearchiveerde projecten.</p>';
 }else $('gioProjectStatusList').innerHTML=rows.map(renderCard).join('')||'<p>Geen projecten gevonden.</p>';
}
function renderCard(p){
 const name=p.naam||p.project||'Project',end=p.einddatum||p.einde||'',days=daysTo(end),st=normalizedStatus(p),fin=projectTotal(name),over=days!==null&&days<0&&st==='Actief';
 let dayText='Geen einddatum';if(days!==null)dayText=days<0?`${Math.abs(days)} dag(en) over tijd`:days===0?'Eindigt vandaag':`${days} dag(en) tot einde`;
 return `<article class="gioProjectStatusCard ${over?'overdue':st==='Betaald'?'done':st==='Archief'?'archive':''}"><div><b>${esc(p.projectnummer||'-')} — ${esc(name)}</b><br><small>${esc(p.klant||'-')} • ${esc(st)} ${end?'• einde '+esc(end):''}</small></div><div style="${over?'color:#fecaca;font-weight:900':''}">${esc(dayText)}</div><div><small>Gefactureerd ${eur(fin.inv)} • Betaald ${eur(fin.paid)} • Open ${eur(fin.open)}</small></div><div class="gioProjectStatusActions">${st==='Actief'?`<button onclick="gioProjectMarkReady('${p.id}')">✅ Klaar</button>`:''}${st==='Klaar te factureren'?`<button onclick="gioProjectOpenInvoice('${p.id}')">🧾 Factuur</button><button onclick="gioProjectMarkPaid('${p.id}')">💳 Betaald</button>`:''}${st==='Betaald'?`<button onclick="gioProjectArchive('${p.id}')">📦 Archiveren</button>`:''}${st==='Archief'?`<button onclick="gioProjectRestore('${p.id}')">↩ Terugzetten</button>`:''}<button onclick="gioProjectStatusOpenCard('${p.id}')">📋 Projectkaart</button></div></article>`;
}
function findP(id){return data.projecten.find(p=>String(p.id)===String(id))}
function setStatus(p,status){p.status=status;p.historie.unshift({tijd:new Date().toISOString(),actie:'Status gewijzigd naar '+status});save?.();gioRenderProjectStatus()}
window.gioProjectMarkReady=id=>{const p=findP(id);if(p)setStatus(p,'Klaar te factureren')}
window.gioProjectMarkPaid=id=>{const p=findP(id);if(!p)return;if(projectTotal(p.naam||p.project).open>0&&!confirm('Er staat volgens de facturen nog een bedrag open. Toch als betaald markeren?'))return;setStatus(p,'Betaald')}
window.gioProjectArchive=id=>{const p=findP(id);if(!p)return;p.archiefDatum=today();setStatus(p,'Archief')}
window.gioProjectRestore=id=>{const p=findP(id);if(!p)return;p.archiefDatum='';setStatus(p,'Actief')}
window.gioProjectOpenInvoice=id=>{const p=findP(id);if(!p)return;const b=[...document.querySelectorAll('aside nav button')].find(x=>x.textContent.includes('Facturatie PRO'));if(typeof show==='function'&&$('facturatiepro2'))show('facturatiepro2',b||document.querySelector('aside nav button'));gioInvoicesInit?.();setTimeout(()=>{gioNewInvoice?.();if($('gioInvoiceProject'))$('gioInvoiceProject').value=p.naam||p.project||'';if($('gioInvoiceClient'))$('gioInvoiceClient').value=p.klant||''},100)}
window.gioProjectStatusOpenCard=id=>{const p=findP(id);if(!p)return;const b=[...document.querySelectorAll('aside nav button')].find(x=>x.textContent.includes('Projectkaart'));if(typeof show==='function'&&$('projectkaartpro'))show('projectkaartpro',b||document.querySelector('aside nav button'));if($('proProjectSelect')){$('proProjectSelect').value=p.naam||p.project||'';gioRenderProjectDossier?.()}}
window.gioExportProjectArchiveExcel=()=>{const rows=[['Projectnummer','Project','Klant','Status','Start','Einde','Archiefdatum','Gefactureerd','Betaald','Openstaand'],...filtered().map(p=>{const n=p.naam||p.project||'',f=projectTotal(n);return[p.projectnummer||'',n,p.klant||'',normalizedStatus(p),p.start||p.datum||'',p.einddatum||p.einde||'',p.archiefDatum||'',f.inv,f.paid,f.open]})];const html='<table border="1">'+rows.map(r=>'<tr>'+r.map(v=>'<td>'+esc(v??'')+'</td>').join('')+'</tr>').join('')+'</table>';const blob=new Blob([html],{type:'application/vnd.ms-excel'}),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='GIO_Projectarchief_'+today()+'.xls';a.click();URL.revokeObjectURL(u)}
window.gioProjectStatusInit=()=>{ensure();tabs();fillYears();gioRenderProjectStatus()}
function patchMenus(){const old=window.gioOpenMoreOverlay;window.gioOpenMoreOverlay=function(){old?.();setTimeout(()=>{const g=document.querySelector('#gioOverlayBody .gioOverlayGrid');if(g&&!g.textContent.includes('Projectstatus & Archief PRO'))g.insertAdjacentHTML('beforeend',`<button onclick="gioApprovedGo('projectstatuspro');gioProjectStatusInit()"><i>📂</i>Projectstatus & Archief PRO</button>`)},0)}}
function init(){ensure();inject();patchMenus();gioProjectStatusInit();document.title='GIO Business Planner PRO — MOBILE DEV 022';try{localStorage.setItem('gioMobileBuild','MOBILE DEV 022')}catch(e){}}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',()=>setTimeout(init,1800)):setTimeout(init,1800);
})();
