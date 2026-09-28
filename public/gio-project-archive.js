
(function(){
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const eur=v=>new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR'}).format(Number(v)||0);
function ensure(){
  if(!window.data)return false;
  if(!Array.isArray(data.projecten))data.projecten=[];
  if(!Array.isArray(data.uren))data.uren=[];
  if(!Array.isArray(data.materiaal))data.materiaal=[];
  if(!Array.isArray(data.facturen))data.facturen=[];
  if(!Array.isArray(data.klantBetalingen))data.klantBetalingen=[];
  data.projecten.forEach(p=>{
    if(!p.status)p.status='Open';
    if(!p.projectnummer)p.projectnummer=p.nr||p.id||'';
    if(!Array.isArray(p.historie))p.historie=[];
  });
  return true;
}
function today(){return new Date().toISOString().slice(0,10)}
function name(p){return p.naam||p.project||p.titel||'Project'}
function daysTo(date){
  if(!date)return null;
  const a=new Date(date+'T12:00:00'),b=new Date();b.setHours(12,0,0,0);
  return Math.ceil((a-b)/86400000)
}
function quarter(date){
  if(!date)return'-';
  const d=new Date(date+'T12:00:00');
  return 'Q'+(Math.floor(d.getMonth()/3)+1)+' '+d.getFullYear()
}
function hoursValue(project,p){
  if(Number(p.arbeidBedrag)>0)return Number(p.arbeidBedrag);
  const hours=data.uren.filter(u=>(u.project||u.projectNaam)===project)
    .reduce((s,u)=>s+(Number(u.uren)||Number(u.aantalUren)||0),0);
  return hours*(Number(data.uurloon)||35);
}
function materialValue(project){
  return data.materiaal.filter(m=>(m.project||m.projectNaam)===project && m.doorberekenen!==false)
    .reduce((s,m)=>s+(Number(m.bedrag)||Number(m.verkoopBedrag)||Number(m.totaal)||0),0);
}
function paidValue(project){
  return data.klantBetalingen.filter(x=>(x.project||x.projectNaam)===project)
    .reduce((s,x)=>s+(Number(x.bedrag)||0),0);
}
function finance(p){
  const n=name(p),lab=hoursValue(n,p),mat=materialValue(n),total=lab+mat,paid=paidValue(n);
  return {lab,mat,total,paid,open:Math.max(0,total-paid),over:Math.max(0,paid-total)}
}
function normalizedStatus(p){
  const s=String(p.status||'Open').toLowerCase();
  if(s.includes('archief'))return'Archief';
  const f=finance(p);
  if(f.total>0&&f.open<=0.005&&(s.includes('klaar')||s.includes('done')||s.includes('betaald')))return'Betaald';
  if(s.includes('betaald'))return'Betaald';
  if(s.includes('factur'))return'Klaar te factureren';
  if(s.includes('klaar')||s.includes('done'))return'Werk klaar';
  return'Actief';
}
function canArchive(p){
  const st=normalizedStatus(p),f=finance(p);
  return (st==='Betaald'||st==='Werk klaar'||st==='Klaar te factureren') && f.total>0 && f.open<=0.005;
}

let activeTab='Actief';

function inject(){
  if($('projectstatuspro'))return;
  const main=document.querySelector('main');if(!main)return;
  const s=document.createElement('section');s.id='projectstatuspro';s.className='page';
  s.innerHTML=`
    <div class="card">
      <h2>📂 Projectstatus & Auto-Archief PRO</h2>
      <div id="gioProjectStatusTabs" class="gioProjectTabs"></div>
      <div id="gioProjectStatusKpis" class="gioProjectStatusKpis"></div>
      <div class="row">
        <div><label>Zoeken</label><input id="gioProjectStatusSearch" oninput="gioRenderProjectStatus()"></div>
        <div><label>Jaar</label><select id="gioProjectStatusYear" onchange="gioRenderProjectStatus()"></select></div>
        <div><label>Kwartaal</label><select id="gioProjectStatusQuarter" onchange="gioRenderProjectStatus()"><option value="">Alle kwartalen</option><option>Q1</option><option>Q2</option><option>Q3</option><option>Q4</option></select></div>
      </div>
      <div class="gioProjectStatusActions">
        <button class="btn" onclick="gioArchiveEligible()">📦 Archiveer betaalde projecten</button>
        <button class="btn2" onclick="gioExportProjectArchiveExcel()">📊 Excel</button>
      </div>
      <div id="gioProjectArchiveNotice"></div>
      <div id="gioProjectStatusList"></div>
    </div>`;
  main.appendChild(s);
  const nav=document.querySelector('aside nav');
  if(nav&&!([...nav.querySelectorAll('button')].some(b=>b.textContent.includes('Projectstatus & Auto-Archief')))){
    const b=document.createElement('button');
    b.textContent='📂 Projectstatus & Auto-Archief';
    b.onclick=()=>{show('projectstatuspro',b);gioProjectStatusInit()};
    nav.appendChild(b)
  }
}
function tabs(){
  const a=['Actief','Werk klaar','Klaar te factureren','Betaald','Archief','Alles'];
  $('gioProjectStatusTabs').innerHTML=a.map(x=>`<button class="btn2 ${activeTab===x?'active':''}" onclick="gioProjectStatusSetTab('${x}')">${x}</button>`).join('')
}
window.gioProjectStatusSetTab=t=>{activeTab=t;tabs();gioRenderProjectStatus()}

function fillYears(){
  const years=[...new Set(data.projecten.map(p=>{
    const d=p.archiefDatum||p.einddatum||p.einde||p.start||p.datum||today();
    return new Date(d+'T12:00:00').getFullYear()
  }).filter(Boolean))].sort((a,b)=>b-a);
  $('gioProjectStatusYear').innerHTML='<option value="">Alle jaren</option>'+years.map(y=>`<option>${y}</option>`).join('')
}
function filtered(){
  const q=($('gioProjectStatusSearch')?.value||'').toLowerCase(),year=$('gioProjectStatusYear')?.value||'',qt=$('gioProjectStatusQuarter')?.value||'';
  return data.projecten.filter(p=>{
    const st=normalizedStatus(p),date=p.archiefDatum||p.einddatum||p.einde||p.start||p.datum||today(),d=new Date(date+'T12:00:00'),y=String(d.getFullYear()),qtr='Q'+(Math.floor(d.getMonth()/3)+1);
    const tab=activeTab==='Alles'||st===activeTab;
    return tab&&(!year||y===year)&&(!qt||qtr===qt)&&(!q||[name(p),p.projectnummer,p.klant,p.status].join(' ').toLowerCase().includes(q));
  })
}
function renderCard(p){
  const n=name(p),end=p.einddatum||p.einde||'',days=daysTo(end),st=normalizedStatus(p),f=finance(p),over=days!==null&&days<0&&st==='Actief';
  let dayText='Geen einddatum';
  if(days!==null)dayText=days<0?`${Math.abs(days)} dag(en) over tijd`:days===0?'Eindigt vandaag':`${days} dag(en) tot einde`;
  const archiveOk=canArchive(p);
  return `<article class="gioProjectStatusCard ${over?'overdue':st==='Betaald'?'done':st==='Archief'?'archive':''}">
    <div><b>${esc(p.projectnummer||'-')} — ${esc(n)}</b><br><small>${esc(p.klant||'-')} • ${esc(st)} ${end?'• einde '+esc(end):''}</small></div>
    <div style="${over?'color:#fecaca;font-weight:900':''}">${esc(dayText)}</div>
    <div class="gioArchiveMoney"><span>Arbeid <b>${eur(f.lab)}</b></span><span>Materiaal <b>${eur(f.mat)}</b></span><span>Betaald <b>${eur(f.paid)}</b></span><span>Open <b>${eur(f.open)}</b></span></div>
    ${st!=='Archief'&&f.open>0?`<div class="gioArchiveWarn">Nog ${eur(f.open)} openstaand — archiveren geblokkeerd.</div>`:''}
    ${st!=='Archief'&&archiveOk?`<div class="gioArchiveOk">✅ Klaar voor archief</div>`:''}
    <div class="gioProjectStatusActions">
      ${st==='Actief'?`<button onclick="gioProjectMarkWorkDone('${p.id}')">✅ Werk klaar</button>`:''}
      ${st==='Werk klaar'?`<button onclick="gioProjectMarkReady('${p.id}')">🧾 Klaar factureren</button>`:''}
      ${st==='Klaar te factureren'?`<button onclick="gioProjectOpenInvoice('${p.id}')">🧾 Factuur</button>`:''}
      ${archiveOk&&st!=='Archief'?`<button onclick="gioProjectArchive('${p.id}')">📦 Archiveren</button>`:''}
      ${st==='Archief'?`<button onclick="gioProjectRestore('${p.id}')">↩ Terugzetten</button>`:''}
      <button onclick="gioProjectStatusOpenCard('${p.id}')">📋 Projectkaart</button>
    </div>
  </article>`
}
window.gioRenderProjectStatus=()=>{
  ensure();tabs();fillYears();
  const rows=filtered(),all=data.projecten;
  const counts={};
  ['Actief','Werk klaar','Klaar te factureren','Betaald','Archief'].forEach(s=>counts[s]=all.filter(p=>normalizedStatus(p)===s).length);
  const eligible=all.filter(p=>normalizedStatus(p)!=='Archief'&&canArchive(p)).length;
  $('gioProjectStatusKpis').innerHTML=`
    <div class="gioProjectStatusKpi"><small>Actief</small><b>${counts['Actief']}</b></div>
    <div class="gioProjectStatusKpi"><small>Werk klaar</small><b>${counts['Werk klaar']}</b></div>
    <div class="gioProjectStatusKpi"><small>Klaar factureren</small><b>${counts['Klaar te factureren']}</b></div>
    <div class="gioProjectStatusKpi"><small>Betaald</small><b>${counts['Betaald']}</b></div>
    <div class="gioProjectStatusKpi"><small>Klaar voor archief</small><b>${eligible}</b></div>`;
  $('gioProjectArchiveNotice').innerHTML=eligible?`<div class="gioArchiveOk">📦 ${eligible} project(en) zijn volledig betaald en kunnen veilig naar archief.</div>`:'';
  if(activeTab==='Archief'){
    const groups={};rows.forEach(p=>{const key=quarter(p.archiefDatum||p.einddatum||p.einde||p.start||p.datum);(groups[key]||(groups[key]=[])).push(p)});
    $('gioProjectStatusList').innerHTML=Object.entries(groups).map(([q,ps])=>`<div class="gioQuarterGroup"><h3>${esc(q)} — ${ps.length} project(en)</h3>${ps.map(renderCard).join('')}</div>`).join('')||'<p>Geen gearchiveerde projecten.</p>'
  }else{
    $('gioProjectStatusList').innerHTML=rows.map(renderCard).join('')||'<p>Geen projecten gevonden.</p>'
  }
}
function findP(id){return data.projecten.find(p=>String(p.id)===String(id))}
function setStatus(p,status){
  p.status=status;
  p.historie.unshift({tijd:new Date().toISOString(),actie:'Status gewijzigd naar '+status});
  save?.();gioRenderProjectStatus()
}
window.gioProjectMarkWorkDone=id=>{const p=findP(id);if(p)setStatus(p,'Werk klaar')}
window.gioProjectMarkReady=id=>{const p=findP(id);if(p)setStatus(p,'Klaar te factureren')}
window.gioProjectArchive=id=>{
  const p=findP(id);if(!p)return;
  const f=finance(p);
  if(f.open>0.005){alert('Dit project kan nog niet naar archief. Er staat '+eur(f.open)+' open.');return}
  if(!confirm('Project is volledig betaald. Naar archief verplaatsen?'))return;
  p.archiefDatum=today();setStatus(p,'Archief')
}
window.gioArchiveEligible=()=>{
  const list=data.projecten.filter(p=>normalizedStatus(p)!=='Archief'&&canArchive(p));
  if(!list.length){alert('Er zijn geen projecten die nu veilig gearchiveerd kunnen worden.');return}
  if(!confirm(`${list.length} volledig betaalde project(en) naar archief verplaatsen?`))return;
  list.forEach(p=>{
    p.archiefDatum=today();p.status='Archief';
    p.historie.unshift({tijd:new Date().toISOString(),actie:'Automatisch gearchiveerd na volledige betaling'})
  });
  save?.();activeTab='Archief';gioRenderProjectStatus()
}
window.gioProjectRestore=id=>{
  const p=findP(id);if(!p)return;
  p.archiefDatum='';
  p.historie.unshift({tijd:new Date().toISOString(),actie:'Teruggezet uit archief'});
  p.status=finance(p).open<=0.005?'Betaald':'Actief';
  save?.();gioRenderProjectStatus()
}
window.gioProjectOpenInvoice=id=>{
  const p=findP(id);if(!p)return;
  const b=[...document.querySelectorAll('aside nav button')].find(x=>x.textContent.includes('Facturatie PRO'));
  if(typeof show==='function'&&$('facturatiepro2'))show('facturatiepro2',b||document.querySelector('aside nav button'));
  gioInvoicesInit?.();
  setTimeout(()=>{gioNewInvoice?.();if($('gioInvoiceProject'))$('gioInvoiceProject').value=name(p);if($('gioInvoiceClient'))$('gioInvoiceClient').value=p.klant||''},100)
}
window.gioProjectStatusOpenCard=id=>{
  const p=findP(id);if(!p)return;
  const b=[...document.querySelectorAll('aside nav button')].find(x=>x.textContent.includes('Projectkaart'));
  if(typeof show==='function'&&$('projectkaartpro'))show('projectkaartpro',b||document.querySelector('aside nav button'));
  if($('proProjectSelect')){$('proProjectSelect').value=name(p);gioRenderProjectDossier?.()}
}
window.gioExportProjectArchiveExcel=()=>{
  const rows=[['Projectnummer','Project','Klant','Status','Start','Einde','Archiefdatum','Arbeid','Materiaal','Totaal','Betaald','Openstaand'],
    ...filtered().map(p=>{const f=finance(p);return[p.projectnummer||'',name(p),p.klant||'',normalizedStatus(p),p.start||p.datum||'',p.einddatum||p.einde||'',p.archiefDatum||'',f.lab,f.mat,f.total,f.paid,f.open]})
  ];
  const html='<table border="1">'+rows.map(r=>'<tr>'+r.map(v=>'<td>'+esc(v??'')+'</td>').join('')+'</tr>').join('')+'</table>';
  const blob=new Blob(['\ufeff'+html],{type:'application/vnd.ms-excel;charset=utf-8'}),u=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=u;a.download='GIO_Projectarchief_'+today()+'.xls';a.click();URL.revokeObjectURL(u)
}
window.gioProjectStatusInit=()=>{ensure();tabs();fillYears();gioRenderProjectStatus()}
function patchMenus(){
  const old=window.gioOpenMoreOverlay;
  window.gioOpenMoreOverlay=function(){
    old?.();setTimeout(()=>{
      const g=document.querySelector('#gioOverlayBody .gioOverlayGrid');
      if(g&&!g.textContent.includes('Projectstatus & Auto-Archief'))g.insertAdjacentHTML('beforeend',`<button onclick="gioApprovedGo('projectstatuspro');gioProjectStatusInit()"><i>📂</i>Projectstatus & Auto-Archief</button>`)
    },0)
  }
}
function init(){
  ensure();inject();patchMenus();gioProjectStatusInit();
  document.title='GIO Business Planner PRO — MOBILE DEV 031';
  try{localStorage.setItem('gioMobileBuild','MOBILE DEV 031')}catch(e){}
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',()=>setTimeout(init,1800)):setTimeout(init,1800);
})();
