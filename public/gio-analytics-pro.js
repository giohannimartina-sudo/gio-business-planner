
(function(){
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const eur=v=>new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR'}).format(+v||0);

function ensure(){
  if(!window.data)return false;
  ['facturen','klantBetalingen','uitgaven','materiaal','uren','medewerkerUren','projecten','klanten','offertes'].forEach(k=>{if(!Array.isArray(data[k]))data[k]=[]});
  return true;
}
function invoiceTotal(inv){
  let total=0;
  (inv.regels||[]).forEach(l=>{
    const base=(+l.aantal||0)*(+l.prijs||0);
    total+=base+base*(+l.btw||0)/100;
  });
  return total;
}
function range(){
  const y=+$('gioAnalyticsYear').value||new Date().getFullYear();
  const q=$('gioAnalyticsQuarter').value;
  const m=$('gioAnalyticsMonth').value;
  let from=`${y}-01-01`,to=`${y}-12-31`;
  if(q){
    const qi=+q.slice(1)-1,start=qi*3+1,end=start+2;
    from=`${y}-${String(start).padStart(2,'0')}-01`;
    const d=new Date(y,end,0);
    to=`${y}-${String(end).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
  if(m){
    const mm=+m,d=new Date(y,mm,0);
    from=`${y}-${String(mm).padStart(2,'0')}-01`;
    to=`${y}-${String(mm).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
  return {from,to,y};
}
function inRange(date,r){return date&&date>=r.from&&date<=r.to}
function projectFinance(name,r){
  const invoices=data.facturen.filter(f=>f.project===name&&inRange(f.datum,r));
  const omzet=invoices.reduce((s,f)=>s+invoiceTotal(f),0);
  const uitgaven=data.uitgaven.filter(x=>x.project===name&&inRange(x.datum,r)).reduce((s,x)=>s+(+x.bedrag||0),0);
  const materiaal=data.materiaal.filter(x=>x.project===name&&inRange(x.datum,r)).reduce((s,x)=>s+(+x.bedrag||0),0);
  const uren=data.uren.filter(x=>x.project===name&&inRange(x.datum,r)).reduce((s,x)=>s+(+x.uren||0),0)
            +data.medewerkerUren.filter(x=>x.project===name&&!x.actief&&inRange(x.datum,r)).reduce((s,x)=>s+(+x.uren||0),0);
  return {omzet,uitgaven,materiaal,uren,resultaat:omzet-uitgaven-materiaal};
}
function inject(){
  if($('analysepro2'))return;
  const main=document.querySelector('main');if(!main)return;
  const s=document.createElement('section');s.id='analysepro2';s.className='page';
  s.innerHTML=`<div class="card"><h2>📊 Analyse & Balans PRO</h2>
    <div class="row">
      <div><label>Jaar</label><select id="gioAnalyticsYear" onchange="gioRenderAnalytics()"></select></div>
      <div><label>Kwartaal</label><select id="gioAnalyticsQuarter" onchange="gioAnalyticsQuarterChanged()"><option value="">Heel jaar</option><option>Q1</option><option>Q2</option><option>Q3</option><option>Q4</option></select></div>
      <div><label>Maand</label><select id="gioAnalyticsMonth" onchange="gioAnalyticsMonthChanged()"><option value="">Alle maanden</option>${Array.from({length:12},(_,i)=>`<option value="${i+1}">${new Date(2026,i,1).toLocaleDateString('nl-NL',{month:'long'})}</option>`).join('')}</select></div>
    </div>
    <div id="gioAnalyticsKpis" class="gioAnalyticsKpis"></div>
    <div class="gioAnalyticsPanels">
      <div class="gioAnalyticsPanel"><h3>🏆 Topklanten</h3><div id="gioAnalyticsClients"></div></div>
      <div class="gioAnalyticsPanel"><h3>📁 Resultaat per project</h3><div id="gioAnalyticsProjects"></div></div>
      <div class="gioAnalyticsPanel"><h3>💸 Uitgaven per categorie</h3><div id="gioAnalyticsExpenses"></div></div>
      <div class="gioAnalyticsPanel"><h3>📄 Offertes</h3><div id="gioAnalyticsOffers"></div></div>
    </div>
    <div class="gioProjectStatusActions"><button class="btn2" onclick="gioExportAnalyticsExcel()">📊 Excel</button></div>
  </div>`;
  main.appendChild(s);

  const nav=document.querySelector('aside nav');
  if(nav&&!([...nav.querySelectorAll('button')].some(b=>b.textContent.includes('Analyse & Balans PRO')))){
    const b=document.createElement('button');
    b.textContent='📊 Analyse & Balans PRO';
    b.onclick=()=>{show('analysepro2',b);gioAnalyticsInit()};
    nav.appendChild(b);
  }
}
function fillYears(){
  const years=new Set([new Date().getFullYear()]);
  [...data.facturen,...data.uitgaven,...data.materiaal].forEach(x=>{
    if(x.datum)years.add(new Date(x.datum+'T12:00:00').getFullYear());
  });
  const arr=[...years].sort((a,b)=>b-a);
  const old=$('gioAnalyticsYear').value;
  $('gioAnalyticsYear').innerHTML=arr.map(y=>`<option>${y}</option>`).join('');
  $('gioAnalyticsYear').value=old&&arr.map(String).includes(old)?old:String(arr[0]);
}
window.gioAnalyticsQuarterChanged=()=>{if($('gioAnalyticsQuarter').value)$('gioAnalyticsMonth').value='';gioRenderAnalytics()}
window.gioAnalyticsMonthChanged=()=>{if($('gioAnalyticsMonth').value)$('gioAnalyticsQuarter').value='';gioRenderAnalytics()}

window.gioRenderAnalytics=()=>{
  if(!ensure()||!$('gioAnalyticsKpis'))return;
  const r=range();
  const invoices=data.facturen.filter(f=>inRange(f.datum,r));
  const revenue=invoices.reduce((s,f)=>s+invoiceTotal(f),0);
  const paid=data.klantBetalingen.filter(p=>inRange(p.datum,r)).reduce((s,p)=>s+(+p.bedrag||0),0);
  const expenses=data.uitgaven.filter(x=>inRange(x.datum,r)).reduce((s,x)=>s+(+x.bedrag||0),0);
  const materials=data.materiaal.filter(x=>inRange(x.datum,r)).reduce((s,x)=>s+(+x.bedrag||0),0);
  const result=revenue-expenses-materials;
  const hours=data.uren.filter(x=>inRange(x.datum,r)).reduce((s,x)=>s+(+x.uren||0),0)
            +data.medewerkerUren.filter(x=>!x.actief&&inRange(x.datum,r)).reduce((s,x)=>s+(+x.uren||0),0);
  const open=Math.max(0,revenue-paid);

  $('gioAnalyticsKpis').innerHTML=`
    <div class="gioAnalyticsKpi"><small>Omzet</small><b>${eur(revenue)}</b></div>
    <div class="gioAnalyticsKpi"><small>Uitgaven + materiaal</small><b>${eur(expenses+materials)}</b></div>
    <div class="gioAnalyticsKpi"><small>Resultaat</small><b class="${result>=0?'gioAnalyticsPos':'gioAnalyticsNeg'}">${eur(result)}</b></div>
    <div class="gioAnalyticsKpi"><small>Openstaand</small><b>${eur(open)}</b></div>
    <div class="gioAnalyticsKpi"><small>Betaald ontvangen</small><b>${eur(paid)}</b></div>
    <div class="gioAnalyticsKpi"><small>Gewerkte uren</small><b>${hours.toFixed(2)}</b></div>
    <div class="gioAnalyticsKpi"><small>Facturen</small><b>${invoices.length}</b></div>
    <div class="gioAnalyticsKpi"><small>Projecten</small><b>${data.projecten.length}</b></div>`;

  const byClient={};
  invoices.forEach(f=>{byClient[f.klant]=(byClient[f.klant]||0)+invoiceTotal(f)});
  const clients=Object.entries(byClient).sort((a,b)=>b[1]-a[1]);
  const maxClient=clients[0]?.[1]||1;
  $('gioAnalyticsClients').innerHTML=clients.length?clients.slice(0,10).map(([name,val])=>`
    <div class="gioAnalyticsRow"><span><b>${esc(name||'Onbekend')}</b><div class="gioAnalyticsBar"><span style="width:${Math.min(100,val/maxClient*100)}%"></span></div></span><span>${eur(val)}</span></div>`).join(''):'Geen omzet in deze periode.';

  const projects=data.projecten.map(p=>p.naam||p.project||'').filter(Boolean)
    .map(name=>({name,...projectFinance(name,r)}))
    .filter(x=>x.omzet||x.uitgaven||x.materiaal||x.uren)
    .sort((a,b)=>b.resultaat-a.resultaat);
  $('gioAnalyticsProjects').innerHTML=projects.length?projects.slice(0,12).map(x=>`
    <div class="gioAnalyticsRow"><span><b>${esc(x.name)}</b><br><small>${x.uren.toFixed(1)} uur • omzet ${eur(x.omzet)}</small></span><span class="${x.resultaat>=0?'gioAnalyticsPos':'gioAnalyticsNeg'}">${eur(x.resultaat)}</span></div>`).join(''):'Geen projectresultaten.';

  const cats={};
  data.uitgaven.filter(x=>inRange(x.datum,r)).forEach(x=>{const c=x.categorie||'Overig';cats[c]=(cats[c]||0)+(+x.bedrag||0)});
  const catRows=Object.entries(cats).sort((a,b)=>b[1]-a[1]);
  const maxCat=catRows[0]?.[1]||1;
  $('gioAnalyticsExpenses').innerHTML=catRows.length?catRows.map(([name,val])=>`
    <div class="gioAnalyticsRow"><span><b>${esc(name)}</b><div class="gioAnalyticsBar"><span style="width:${Math.min(100,val/maxCat*100)}%"></span></div></span><span>${eur(val)}</span></div>`).join(''):'Geen uitgaven in deze periode.';

  const offers=data.offertes.filter(o=>inRange(o.datum,r));
  const counts={Concept:0,Verzonden:0,Akkoord:0,Afgewezen:0,Verlopen:0};
  offers.forEach(o=>counts[o.status]=(counts[o.status]||0)+1);
  $('gioAnalyticsOffers').innerHTML=Object.entries(counts).map(([k,v])=>`<div class="gioAnalyticsRow"><span>${esc(k)}</span><b>${v}</b></div>`).join('');
}

window.gioExportAnalyticsExcel=()=>{
  const r=range();
  const projectRows=data.projecten.map(p=>p.naam||p.project||'').filter(Boolean).map(name=>({name,...projectFinance(name,r)})).filter(x=>x.omzet||x.uitgaven||x.materiaal||x.uren);
  const rows=[['Project','Omzet','Uitgaven','Materiaal','Uren','Resultaat'],...projectRows.map(x=>[x.name,x.omzet,x.uitgaven,x.materiaal,x.uren,x.resultaat])];
  const html='<table border="1">'+rows.map(row=>'<tr>'+row.map(v=>'<td>'+esc(v??'')+'</td>').join('')+'</tr>').join('')+'</table>';
  const blob=new Blob([html],{type:'application/vnd.ms-excel'}),u=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=u;a.download=`GIO_Analyse_${r.y}.xls`;a.click();URL.revokeObjectURL(u);
}

window.gioAnalyticsInit=()=>{ensure();fillYears();gioRenderAnalytics()}
function patchMenus(){
  const old=window.gioOpenMoreOverlay;
  window.gioOpenMoreOverlay=function(){
    old?.();
    setTimeout(()=>{
      const g=document.querySelector('#gioOverlayBody .gioOverlayGrid');
      if(g&&!g.textContent.includes('Analyse & Balans PRO'))g.insertAdjacentHTML('beforeend',`<button onclick="gioApprovedGo('analysepro2');gioAnalyticsInit()"><i>📊</i>Analyse & Balans PRO</button>`);
    },0);
  }
}
function init(){
  ensure();inject();patchMenus();gioAnalyticsInit();
  document.title='GIO Business Planner PRO — MOBILE DEV 023';
  try{localStorage.setItem('gioMobileBuild','MOBILE DEV 023')}catch(e){}
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',()=>setTimeout(init,1900)):setTimeout(init,1900);
})();
