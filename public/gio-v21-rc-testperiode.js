/* GIO Business Planner PRO v2.1 RC - testperiode */
(function(){
 const COLORS=['#f4c400','#22c55e','#3b82f6','#a855f7','#f97316','#ef4444','#14b8a6','#ec4899','#64748b'];
 function iso(d){return new Date(d).toISOString().slice(0,10)}
 function parseDate(s){return s?new Date(s+'T12:00:00'):null}
 function daysInclusive(a,b){let x=parseDate(a),y=parseDate(b);if(!x||!y)return 0;return Math.max(1,Math.round((y-x)/86400000)+1)}
 function isDone(p){return ['Werk done','Factureren','Factuur verzonden','Betaald','Gereed','Afgerond'].includes(p.status)}
 function projectColor(p,i=0){return p.kleur||COLORS[i%COLORS.length]}
 function ensureProjectMeta(){
  (data.projecten||[]).forEach((p,i)=>{if(!p.kleur)p.kleur=projectColor(p,i);if(!p.eind)p.eind=p.start||''});
 }
 function eachDate(start,end){let out=[],d=parseDate(start),e=parseDate(end||start);if(!d||!e)return out;if(e<d)e=new Date(d);while(d<=e){out.push(iso(d));d.setDate(d.getDate()+1)}return out}
 function syncRange(p){
  if(!p||!p.naam||!p.start)return;
  data.planning=(data.planning||[]).filter(x=>!(x.autoRange&&x.project===p.naam));
  eachDate(p.start,p.eind||p.start).forEach((datum,idx)=>data.planning.push({datum,tijd:idx===0?'08:00':'Hele dag',klant:p.klant||'',project:p.naam,notitie:`Projectdag ${idx+1} van ${daysInclusive(p.start,p.eind||p.start)}`,door:currentUser||'SAMMAR88',status:isDone(p)?'Gereed':'Wacht',statusSinds:'',autoRange:true,projectColor:p.kleur}));
 }
 function injectProjectFields(){
  const start=document.getElementById('projStart');if(!start||document.getElementById('projEind'))return;
  const endWrap=document.createElement('div');endWrap.innerHTML='<label>Einddatum</label><input type="date" id="projEind">';
  const colorWrap=document.createElement('div');colorWrap.innerHTML='<label>Projectkleur</label><input type="color" id="projKleur" value="#f4c400">';
  start.parentElement.after(endWrap,colorWrap);
  projEind.value=projStart.value||today();
 }
 function wrapProjectFunctions(){
  if(window.__gioRcWrapped)return;window.__gioRcWrapped=true;
  const oldAdd=window.addProject;
  window.addProject=function(){
   const naam=projNaam.value.trim(),eind=document.getElementById('projEind')?.value||projStart.value,kleur=document.getElementById('projKleur')?.value||COLORS[(data.projecten||[]).length%COLORS.length];
   oldAdd();let p=(data.projecten||[]).findLast?data.projecten.findLast(x=>x.naam===naam):[...(data.projecten||[])].reverse().find(x=>x.naam===naam);
   if(p){p.eind=eind;p.kleur=kleur;syncRange(p);save();render()}
  };
  window.editProject=function(i){
   let p=data.projecten[i];if(!p)return;
   let oldName=p.naam,naam=prompt('Projectnaam',p.naam||'');if(naam===null)return;
   let klant=prompt('Klant',p.klant||'');if(klant===null)return;
   let status=prompt('Status',p.status||'');if(status===null)return;
   let start=prompt('Startdatum (YYYY-MM-DD)',p.start||'');if(start===null)return;
   let eind=prompt('Einddatum (YYYY-MM-DD)',p.eind||p.start||'');if(eind===null)return;
   let kleur=prompt('Projectkleur (hex, bijv. #3b82f6)',p.kleur||'#f4c400');if(kleur===null)return;
   let notitie=prompt('Notitie',p.notitie||'');if(notitie===null)return;
   Object.assign(p,{naam,klant,status,start,eind,kleur,notitie});
   (data.planning||[]).forEach(x=>{if(x.project===oldName)x.project=naam});syncRange(p);save();render();
  };
  const oldDel=window.del;
  window.del=function(arr,i){
   const labels={planning:'planning',uren:'urenregel',materiaal:'materiaalregel',uitgaven:'uitgave',vrijedagen:'vrije dag',projecten:'project',klanten:'klant'};
   if(!confirm(`Weet je zeker dat je deze ${labels[arr]||'regel'} wilt verwijderen?\nDeze actie kan niet ongedaan worden gemaakt.`))return;
   oldDel(arr,i);
  };
 }
 function addAnalysisPage(){
  if(document.getElementById('analyse'))return;
  const nav=document.querySelector('aside nav');
  if(nav){const b=document.createElement('button');b.innerHTML='📊 Analyse';b.onclick=function(){show('analyse',this);renderAnalysis()};const before=[...nav.children].find(x=>x.textContent.includes('Balans'));before?nav.insertBefore(b,before):nav.appendChild(b)}
  const sec=document.createElement('section');sec.id='analyse';sec.className='page';sec.innerHTML=`<div class="card dark"><h2>📊 Analyse</h2><p>Geplande duur, werkelijke dagen, uitloop, omzet, kosten en openstaand per project.</p></div><div class="card"><div class="row"><div><label>Jaar</label><select id="analyseJaar" onchange="renderAnalysis()"><option value="all">Alle jaren</option></select></div><div><label>Status</label><select id="analyseStatus" onchange="renderAnalysis()"><option value="all">Alle statussen</option><option>Gepland</option><option>In uitvoering</option><option>Werk done</option><option>Factureren</option><option>Factuur verzonden</option><option>Betaald</option></select></div></div><div class="gioTileGrid" id="analyseKpis"></div></div><div class="card"><h2>Projectanalyse</h2><div style="overflow:auto"><table><thead><tr><th>Kleur</th><th>Project</th><th>Klant</th><th>Gepland</th><th>Werkelijk</th><th>Verschil</th><th>Uren</th><th>Omzet</th><th>Kosten</th><th>Openstaand</th></tr></thead><tbody id="analyseTable"></tbody></table></div></div>`;
  document.querySelector('main').appendChild(sec);
 }
 function actualDates(p){return [...new Set((data.uren||[]).filter(x=>x.project===p.naam&&x.datum).map(x=>x.datum))].sort()}
 window.renderAnalysis=function(){
  const box=document.getElementById('analyseTable');if(!box)return;ensureProjectMeta();
  const years=[...new Set((data.projecten||[]).map(p=>(p.start||'').slice(0,4)).filter(Boolean))].sort();let y=document.getElementById('analyseJaar');if(y&&y.options.length===1){years.forEach(v=>y.add(new Option(v,v)))}
  let projects=(data.projecten||[]).filter(p=>(!y||y.value==='all'||(p.start||'').startsWith(y.value))&&(!analyseStatus||analyseStatus.value==='all'||p.status===analyseStatus.value));
  let totalPlan=0,totalActual=0,totalOver=0,totalOpen=0;
  box.innerHTML=projects.map((p,i)=>{
   let planned=daysInclusive(p.start,p.eind||p.start),dates=actualDates(p),actual=dates.length||0;
   if(!isDone(p)&&p.eind&&today()>p.eind)actual=Math.max(actual,daysInclusive(p.start,today()));
   let diff=actual-planned,t=typeof financeTotals==='function'?financeTotals(p.naam):projectTotals(p.naam),cost=(t.materiaal||0)+(t.uitgaven||0),open=t.open??Math.max(0,(t.totaalProject||t.totaal||0)-(t.betaald||0));
   totalPlan+=planned;totalActual+=actual;totalOver+=Math.max(0,diff);totalOpen+=open;
   return `<tr><td><span class="rcColorDot" style="background:${projectColor(p,i)}"></span></td><td>${gioEsc(p.naam)}</td><td>${gioEsc(p.klant||'-')}</td><td>${planned} dagen</td><td>${actual} dagen</td><td><span class="${diff>0?'rcOver':diff<0?'rcUnder':'rcOnTime'}">${diff>0?'+'+diff:diff} dagen</span></td><td>${Number(t.urenSom||0).toFixed(2)}</td><td>${euro(t.totaalProject||t.totaal||0)}</td><td>${euro(cost)}</td><td>${euro(open)}</td></tr>`
  }).join('')||'<tr><td colspan="10">Geen projecten voor dit filter.</td></tr>';
  analyseKpis.innerHTML=`<div class="gioFinanceTile"><small>Projecten</small><br><b>${projects.length}</b></div><div class="gioFinanceTile"><small>Geplande dagen</small><br><b>${totalPlan}</b></div><div class="gioFinanceTile"><small>Werkelijke dagen</small><br><b>${totalActual}</b></div><div class="gioFinanceTile"><small>Uitloopdagen</small><br><b class="${totalOver?'rcOver':''}">${totalOver}</b></div><div class="gioFinanceTile"><small>Openstaand</small><br><b>${euro(totalOpen)}</b></div>`;
 };
 function renderRangeAgenda(){
  const box=document.getElementById('gioDashboardAgenda');if(!box)return;ensureProjectMeta();let now=new Date(),start=new Date(now);start.setDate(now.getDate()-((now.getDay()+6)%7));let h='<div class="gioAgendaGrid">';
  for(let i=0;i<7;i++){let d=new Date(start);d.setDate(start.getDate()+i);let ds=iso(d),items=[];
   (data.projecten||[]).forEach((p,idx)=>{if(p.start&&ds>=p.start&&ds<=(p.eind||p.start))items.push({p,over:false,idx});else if(!isDone(p)&&p.eind&&ds>p.eind&&ds<=today())items.push({p,over:true,idx})});
   (data.planning||[]).filter(x=>x.datum===ds&&!x.autoRange).forEach(x=>items.push({manual:x}));
   h+=`<div class="gioAgendaDay"><b>${d.toLocaleDateString('nl-NL',{weekday:'short',day:'2-digit',month:'2-digit'})}</b>`;
   h+=items.length?items.map(it=>it.manual?`<div class="gioEvent"><b>${gioEsc(it.manual.tijd||'--:--')} ${gioEsc(it.manual.project||'-')}</b><br><small>${gioEsc(it.manual.klant||'')}</small></div>`:`<div class="gioEvent rcProjectEvent ${it.over?'rcOverrun':''}" style="--pc:${projectColor(it.p,it.idx)}"><b>${gioEsc(it.p.naam)}</b><br><small>${gioEsc(it.p.klant||'')}${it.over?' • '+daysInclusive(it.p.eind,ds)+' dag(en) uitloop':''}</small></div>`).join(''):'<small>Geen planning</small>';
   h+='</div>'
  } box.innerHTML=h+'</div>';
 }
 function decorateActions(){
  const map=[['Bekijken','👁️'],['Bekijk','👁️'],['Wijzigen','✏️'],['Wijzig','✏️'],['Notitie','📝'],['Dupliceren','📋'],['Verwijderen','🗑️'],['PDF','📄'],['E-mail','📧'],['Email','📧']];
  document.querySelectorAll('button').forEach(b=>{let t=(b.textContent||'').trim();for(const [label,icon] of map){if(t===label||t.startsWith(icon+' '+label)){b.textContent=icon;b.title=label;b.setAttribute('aria-label',label);b.classList.add('rcIconBtn','rc-'+label.toLowerCase().replace(/[^a-z]/g,''));break}}});
  document.querySelectorAll('td:last-child').forEach(td=>{if(td.querySelectorAll('button').length>1)td.classList.add('rcActionRow')});
 }
 function enhanceProjectRows(){
  const rows=document.querySelectorAll('#projectList tr');rows.forEach((tr,i)=>{let p=data.projecten[i];if(!p)return;tr.style.setProperty('--pc',projectColor(p,i));tr.classList.add('rcProjectRow');let last=tr.lastElementChild;if(last&&!last.querySelector('[data-rc-edit]')){let b=document.createElement('button');b.innerHTML='✏️';b.title='Project wijzigen';b.dataset.rcEdit='1';b.className='rcIconBtn rc-wijzigen';b.onclick=()=>editProject(i);last.prepend(b)}})
 }
 function runDecorate(){decorateActions();enhanceProjectRows();renderRangeAgenda();if(document.getElementById('analyse')?.classList.contains('active'))renderAnalysis()}
 function init(){injectProjectFields();ensureProjectMeta();wrapProjectFunctions();addAnalysisPage();(data.projecten||[]).forEach(p=>{if(p.start&&!data.planning.some(x=>x.autoRange&&x.project===p.naam))syncRange(p)});save();setTimeout(runDecorate,100);const mo=new MutationObserver(()=>{clearTimeout(window.__rcT);window.__rcT=setTimeout(runDecorate,120)});mo.observe(document.body,{subtree:true,childList:true})}
 document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();