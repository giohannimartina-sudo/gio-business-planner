
(function(){
'use strict';

const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const DAYS=['Maandag','Dinsdag','Woensdag','Donderdag','Vrijdag','Zaterdag','Zondag'];
let activeTab='Week';
let weekOffset=0;

function ensure(){
  if(!window.data)return false;
  if(!Array.isArray(data.planning))data.planning=[];
  if(!Array.isArray(data.vrijeDagen))data.vrijeDagen=[];
  if(!Array.isArray(data.medewerkers))data.medewerkers=[];
  if(!Array.isArray(data.projecten))data.projecten=[];
  if(!Array.isArray(data.klanten))data.klanten=[];
  if(!Array.isArray(data.afspraken))data.afspraken=[];
  data.planning.forEach(x=>{
    if(!Array.isArray(x.medewerkerIds))x.medewerkerIds=[];
    if(!x.startdatum)x.startdatum=x.datum||'';
    if(!x.einddatum)x.einddatum=x.startdatum||x.datum||'';
    if(!x.status)x.status='Gepland';
  });
  return true;
}
function uid(){return Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-4)}
function today(){return new Date().toISOString().slice(0,10)}
function dateObj(s){return new Date(s+'T12:00:00')}
function iso(d){return d.toISOString().slice(0,10)}
function addDays(s,n){const d=dateObj(s);d.setDate(d.getDate()+n);return iso(d)}
function mondayOf(s){
  const d=dateObj(s);
  const day=(d.getDay()+6)%7;
  d.setDate(d.getDate()-day);
  return iso(d);
}
function fmtDay(s){
  return new Intl.DateTimeFormat('nl-NL',{day:'numeric',month:'short'}).format(dateObj(s));
}
function isWeekend(i){return i>=5}

function currentWeekStart(){
  return addDays(mondayOf(today()), weekOffset*7);
}
function weekRange(){
  const start=currentWeekStart();
  return {start,end:addDays(start,6)};
}
function statusClass(item,date){
  const end=item.einddatum||item.startdatum||item.datum;
  if(item.status==='Klaar')return 'done';
  if(end<today())return 'overdue';
  if(end===today()||date===today())return 'today';
  const days=Math.ceil((dateObj(end)-dateObj(today()))/86400000);
  if(days<=2)return 'soon';
  return 'planned';
}
function daysOver(item){
  const e=item.einddatum||item.startdatum||item.datum;
  if(!e)return 0;
  return Math.max(0,Math.ceil((dateObj(today())-dateObj(e))/86400000));
}
function planningForDate(date){
  return data.planning.filter(x=>{
    const s=x.startdatum||x.datum, e=x.einddatum||s;
    return s<=date&&e>=date;
  });
}
function appointmentsForDate(date){
  return data.afspraken.filter(a=>a.date===date);
}
function freeForDate(date){
  return data.vrijeDagen.filter(v=>{
    const s=v.start, e=v.eind||s;
    return s<=date&&e>=date;
  });
}

function inject(){
  if($('planningpro2'))return;
  const main=document.querySelector('main');if(!main)return;
  const s=document.createElement('section');s.id='planningpro2';s.className='page';
  s.innerHTML=`
  <div class="card gioAgendaShell">
    <div class="gioAgendaHeader">
      <div>
        <h2>📅 Agenda overzicht</h2>
        <p>Bekijk al je geplande projecten en afspraken in één overzicht.</p>
      </div>
      <div class="gioAgendaNav">
        <button class="btn2" onclick="gioAgendaToday()">Vandaag</button>
        <button class="btn2 gioAgendaArrow" onclick="gioAgendaPrev()">‹</button>
        <button class="btn2 gioAgendaArrow" onclick="gioAgendaNext()">›</button>
        <button class="btn" onclick="gioPlanNew()">＋ Nieuwe planning</button>
      </div>
    </div>

    <div class="row gioAgendaFilters">
      <div><label>Agenda weergave</label><select id="gioAgendaView" onchange="gioAgendaViewChange()"><option>Week</option><option>Vandaag</option><option>Alles</option></select></div>
      <div><label>Zoeken</label><input id="gioPlanSearch" oninput="gioRenderPlanningPro()"></div>
      <div><label>Status</label><select id="gioPlanStatusFilter" onchange="gioRenderPlanningPro()"><option value="">Alle</option><option>Gepland</option><option>Bezig</option><option>Klaar</option><option>Uitgesteld</option></select></div>
    </div>

    <div id="gioAgendaWeekLabel" class="gioAgendaWeekLabel"></div>
    <div id="gioAgendaGrid" class="gioAgendaGrid"></div>

    <div class="gioAgendaLegend">
      <span><i class="planned"></i> Gepland</span>
      <span><i class="soon"></i> Bijna uitloop</span>
      <span><i class="overdue"></i> Uitloop</span>
      <span><i class="appointment"></i> Afspraak</span>
      <span><i class="free"></i> Vrij / blokkade</span>
      <b id="gioAgendaTotal"></b>
    </div>
  </div>

  <div id="gioPlanForm" class="card" style="display:none">
    <h2 id="gioPlanFormTitle">Planning</h2><input id="gioPlanId" type="hidden">
    <div class="row">
      <div><label>Klant</label><select id="gioPlanClient"></select></div>
      <div><label>Project</label><select id="gioPlanProject"></select></div>
      <div><label>Startdatum</label><input id="gioPlanStart" type="date"></div>
      <div><label>Einddatum</label><input id="gioPlanEnd" type="date"></div>
      <div><label>Starttijd</label><input id="gioPlanTimeStart" type="time"></div>
      <div><label>Eindtijd</label><input id="gioPlanTimeEnd" type="time"></div>
      <div><label>Status</label><select id="gioPlanStatus"><option>Gepland</option><option>Bezig</option><option>Klaar</option><option>Uitgesteld</option></select></div>
      <div><label>Adres</label><input id="gioPlanAddress"></div>
    </div>
    <label>Medewerkers / inhuur</label><div id="gioPlanEmployees"></div>
    <label>Notitie</label><textarea id="gioPlanNote"></textarea>
    <div class="gioPlanActions"><button class="btn" onclick="gioPlanSave()">Opslaan</button><button class="btn2" onclick="gioPlanClose()">Sluiten</button></div>
  </div>

  <div id="gioFreeDayForm" class="card" style="display:none">
    <h2>🏖️ Vrije dag / blokkade</h2>
    <div class="row"><div><label>Van</label><input id="gioFreeStart" type="date"></div><div><label>Tot</label><input id="gioFreeEnd" type="date"></div><div><label>Reden</label><input id="gioFreeReason"></div></div>
    <button class="btn" onclick="gioFreeDaySave()">Opslaan</button>
  </div>`;
  main.appendChild(s);

  const nav=document.querySelector('aside nav');
  if(nav&&!([...nav.querySelectorAll('button')].some(b=>b.textContent.includes('Planning & Agenda')))){
    const b=document.createElement('button');
    b.textContent='📅 Planning & Agenda';
    b.onclick=()=>{show('planningpro2',b);gioPlanningProInit()};
    nav.appendChild(b);
  }
}
function fill(){
  const op=(arr,fn,first)=>'<option value="">'+first+'</option>'+arr.map(x=>`<option>${esc(fn(x))}</option>`).join('');
  $('gioPlanClient').innerHTML=op(data.klanten,x=>x.naam||x.name||'','Geen klant');
  $('gioPlanProject').innerHTML=op(data.projecten,x=>x.naam||x.project||'','Geen project');
  $('gioPlanEmployees').innerHTML=data.medewerkers.map(m=>`<label style="display:inline-flex;align-items:center;gap:5px;margin-right:10px"><input class="gioPlanEmpCheck" type="checkbox" value="${esc(m.id)}" style="width:auto"> ${esc(m.naam)}</label>`).join('')||'Nog geen medewerkers.';
}

function planCard(x,date){
  const s=x.startdatum||x.datum,e=x.einddatum||s;
  const cls=statusClass(x,date);
  const over=daysOver(x);
  const title=x.project||x.klant||'Planning';
  const sub=[x.klant,x.project].filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i).join(' · ');
  const time=(x.starttijd||x.eindtijd)?`${x.starttijd||'--:--'} - ${x.eindtijd||'--:--'}`:'';
  const multi=s!==e?`${Math.max(1,Math.round((dateObj(e)-dateObj(s))/86400000)+1)} dag(en)`:'1 dag';
  const warning=over?`${over} dag(en) uitloop`:multi;
  return `<div class="gioAgendaEvent ${cls}" onclick="gioPlanEdit('${x.id}')">
    <b>${esc(title)}</b>
    <small>📅 ${esc(sub||'Niet gekoppeld')} · ${esc(warning)}</small>
    ${time?`<small>◷ ${esc(time)}</small>`:''}
    ${x.adres?`<small>📍 ${esc(x.adres)}</small>`:''}
  </div>`;
}
function appointmentCard(a){
  return `<div class="gioAgendaEvent appointment" onclick="gioAgendaOpenAppointment()">
    <b>${esc(a.title||'Afspraak')}</b>
    <small>📅 ${esc(a.type||'Afspraak')}${a.client?' · '+esc(a.client):''}</small>
    ${(a.start||a.end)?`<small>◷ ${esc(a.start||'--:--')} - ${esc(a.end||'--:--')}</small>`:''}
    ${a.location?`<small>📍 ${esc(a.location)}</small>`:''}
  </div>`;
}
function freeCard(v){
  return `<div class="gioAgendaEvent free"><b>🏖️ Vrij / geblokkeerd</b><small>${esc(v.reden||'Geen reden')}</small></div>`;
}

window.gioRenderPlanningPro=()=>{
  ensure();
  const view=$('gioAgendaView')?.value||'Week';
  const q=($('gioPlanSearch')?.value||'').toLowerCase();
  const sf=$('gioPlanStatusFilter')?.value||'';

  let dates=[];
  if(view==='Vandaag') dates=[today()];
  else if(view==='Alles'){
    const unique=new Set();
    data.planning.forEach(x=>{let d=x.startdatum||x.datum,e=x.einddatum||d;while(d&&d<=e){unique.add(d);d=addDays(d,1)}});
    data.afspraken.forEach(a=>a.date&&unique.add(a.date));
    dates=[...unique].sort().slice(0,31);
    if(!dates.length)dates=[today()];
  }else{
    const start=currentWeekStart();
    dates=Array.from({length:7},(_,i)=>addDays(start,i));
  }

  const wr=weekRange();
  $('gioAgendaWeekLabel').textContent=view==='Week'
    ? `${fmtDay(wr.start)} – ${fmtDay(wr.end)}`
    : view==='Vandaag' ? `Vandaag · ${fmtDay(today())}` : 'Alle geplande datums';

  let total=0;
  $('gioAgendaGrid').className='gioAgendaGrid '+(view==='Vandaag'?'oneDay':view==='Alles'?'allDays':'');
  $('gioAgendaGrid').innerHTML=dates.map((date,i)=>{
    let plans=planningForDate(date).filter(x=>(!sf||x.status===sf)&&(!q||[x.klant,x.project,x.notitie,x.adres].join(' ').toLowerCase().includes(q)));
    let appointments=appointmentsForDate(date).filter(a=>!q||[a.title,a.client,a.project,a.location,a.note].join(' ').toLowerCase().includes(q));
    let frees=freeForDate(date);
    total+=plans.length+appointments.length;
    const dayIndex=(dateObj(date).getDay()+6)%7;
    const weekend=isWeekend(dayIndex);
    const isToday=date===today();
    return `<div class="gioAgendaDay ${isToday?'isToday':''} ${weekend?'weekend':''}">
      <div class="gioAgendaDayHead">
        <b>${DAYS[dayIndex]||''}</b>
        <span>${fmtDay(date)}</span>
      </div>
      <div class="gioAgendaDayBody">
        ${plans.map(x=>planCard(x,date)).join('')}
        ${appointments.map(appointmentCard).join('')}
        ${frees.map(freeCard).join('')}
        ${!plans.length&&!appointments.length&&!frees.length?'<div class="gioAgendaEmpty"></div>':''}
      </div>
    </div>`;
  }).join('');

  $('gioAgendaTotal').textContent=`Totaal: ${total} planning/afspraak item(s)`;
}

window.gioAgendaPrev=()=>{weekOffset--;gioRenderPlanningPro()};
window.gioAgendaNext=()=>{weekOffset++;gioRenderPlanningPro()};
window.gioAgendaToday=()=>{weekOffset=0;if($('gioAgendaView'))$('gioAgendaView').value='Week';gioRenderPlanningPro()};
window.gioAgendaViewChange=()=>gioRenderPlanningPro();
window.gioAgendaOpenAppointment=()=>{
  const b=[...document.querySelectorAll('aside nav button')].find(x=>x.textContent.includes('Taken & Afspraken'));
  if(typeof show==='function'&&$('todoafsprakenpro'))show('todoafsprakenpro',b||document.querySelector('aside nav button'));
  gioTodoAppointmentsInit?.();
};

window.gioPlanNew=()=>{
  fill();
  $('gioPlanId').value='';
  $('gioPlanFormTitle').textContent='Nieuwe planning';
  $('gioPlanStart').value=today();
  $('gioPlanEnd').value=today();
  $('gioPlanTimeStart').value='08:00';
  $('gioPlanTimeEnd').value='17:00';
  $('gioPlanStatus').value='Gepland';
  $('gioPlanAddress').value='';
  $('gioPlanNote').value='';
  document.querySelectorAll('.gioPlanEmpCheck').forEach(c=>c.checked=false);
  $('gioPlanForm').style.display='block';
  $('gioPlanForm').scrollIntoView({behavior:'smooth',block:'start'});
};
window.gioPlanClose=()=>{$('gioPlanForm').style.display='none'};
window.gioPlanSave=()=>{
  ensure();
  const s=$('gioPlanStart').value,e=$('gioPlanEnd').value||s;
  if(!s){alert('Kies startdatum');return}
  if(e<s){alert('Einddatum mag niet voor startdatum liggen');return}
  const id=$('gioPlanId').value||uid();
  const old=data.planning.find(x=>String(x.id)===String(id));
  const item={
    id,klant:$('gioPlanClient').value,project:$('gioPlanProject').value,
    startdatum:s,einddatum:e,datum:s,starttijd:$('gioPlanTimeStart').value,eindtijd:$('gioPlanTimeEnd').value,
    status:$('gioPlanStatus').value,adres:$('gioPlanAddress').value.trim(),notitie:$('gioPlanNote').value.trim(),
    medewerkerIds:[...document.querySelectorAll('.gioPlanEmpCheck:checked')].map(x=>x.value),
    historie:[...(old?.historie||[])]
  };
  item.historie.unshift({tijd:new Date().toISOString(),actie:old?'Planning gewijzigd':'Planning toegevoegd'});
  const i=data.planning.findIndex(x=>String(x.id)===String(id));
  i>=0?data.planning.splice(i,1,item):data.planning.unshift(item);
  save?.();
  gioPlanClose();
  gioRenderPlanningPro();
};
window.gioPlanEdit=id=>{
  const x=data.planning.find(v=>String(v.id)===String(id));if(!x)return;
  fill();
  $('gioPlanId').value=x.id;
  $('gioPlanFormTitle').textContent='Planning bewerken';
  $('gioPlanClient').value=x.klant||'';
  $('gioPlanProject').value=x.project||'';
  $('gioPlanStart').value=x.startdatum||x.datum||'';
  $('gioPlanEnd').value=x.einddatum||x.startdatum||x.datum||'';
  $('gioPlanTimeStart').value=x.starttijd||'';
  $('gioPlanTimeEnd').value=x.eindtijd||'';
  $('gioPlanStatus').value=x.status||'Gepland';
  $('gioPlanAddress').value=x.adres||'';
  $('gioPlanNote').value=x.notitie||'';
  document.querySelectorAll('.gioPlanEmpCheck').forEach(c=>c.checked=(x.medewerkerIds||[]).map(String).includes(String(c.value)));
  $('gioPlanForm').style.display='block';
  $('gioPlanForm').scrollIntoView({behavior:'smooth',block:'start'});
};
window.gioPlanDelete=id=>{if(!confirm('Planning verwijderen?'))return;data.planning=data.planning.filter(x=>String(x.id)!==String(id));save?.();gioRenderPlanningPro()};
window.gioPlanShare=id=>{};
window.gioPlanOpenProject=id=>{};
window.gioFreeDayNew=()=>{$('gioFreeStart').value=today();$('gioFreeEnd').value=today();$('gioFreeReason').value='';$('gioFreeDayForm').style.display='block';$('gioFreeDayForm').scrollIntoView({behavior:'smooth'})};
window.gioFreeDaySave=()=>{
  const s=$('gioFreeStart').value,e=$('gioFreeEnd').value||s;
  if(!s)return;
  if(e<s){alert('Einddatum mag niet voor startdatum liggen');return}
  data.vrijeDagen.unshift({id:uid(),start:s,eind:e,reden:$('gioFreeReason').value.trim()});
  save?.();
  $('gioFreeDayForm').style.display='none';
  gioRenderPlanningPro();
};
window.gioPlanningProInit=()=>{ensure();fill();gioRenderPlanningPro()};

function patchMenus(){
  const old=window.gioOpenMoreOverlay;
  window.gioOpenMoreOverlay=function(){
    old?.();
    setTimeout(()=>{
      const g=document.querySelector('#gioOverlayBody .gioOverlayGrid');
      if(g&&!g.textContent.includes('Planning & Agenda'))g.insertAdjacentHTML('beforeend',`<button onclick="gioApprovedGo('planningpro2');gioPlanningProInit()"><i>📅</i>Planning & Agenda</button>`);
    },0);
  };
}
function init(){
  ensure();inject();patchMenus();gioPlanningProInit();
  document.title='GIO Business Planner PRO — MOBILE DEV 033';
  try{localStorage.setItem('gioMobileBuild','MOBILE DEV 033')}catch(e){}
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',()=>setTimeout(init,1500)):setTimeout(init,1500);
})();
