/* GIO AGENDA PRO TAKEOVER FINAL
   Starts after all legacy dynamic modules.
   Replaces the global renderer once. No MutationObserver. No render loop. */
(function(){
'use strict';

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[c]));

let cursor = new Date();
cursor.setHours(12,0,0,0);
let draggedId = '';

function desktop(){ return window.matchMedia('(min-width:801px)').matches; }
function isoLocal(d){ return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-'); }
function fromIso(s){ return new Date(`${s}T12:00:00`); }
function mondayOf(date){ const d=new Date(date); d.setHours(12,0,0,0); d.setDate(d.getDate()-((d.getDay()+6)%7)); return d; }
function addDays(iso,n){ const d=fromIso(iso); d.setDate(d.getDate()+n); return isoLocal(d); }
function dayDiff(a,b){ return Math.max(0,Math.round((fromIso(b)-fromIso(a))/86400000)); }

function startOf(x){ return x.startdatum || x.datum || ''; }
function endOf(x){ return x.einddatum || startOf(x); }
function timeOf(x){ return x.starttijd || x.tijd || ''; }
function covers(x,iso){ const s=startOf(x),e=endOf(x); return !!s && s<=iso && e>=iso; }

function eventsFor(iso){
  return (window.data?.planning || [])
    .filter(x=>covers(x,iso))
    .sort((a,b)=>String(timeOf(a)).localeCompare(String(timeOf(b))));
}

function classFor(x){
  const s=String(x.status||'').toLowerCase();
  if(s.includes('gereed')||s.includes('klaar')||s.includes('betaald')) return ' done';
  const e=endOf(x);
  if(e && e<isoLocal(new Date()) && !s.includes('gereed') && !s.includes('betaald')) return ' late';
  return '';
}

function eventHtml(x){
  const title=x.project||x.klant||'Planning';
  const meta=[x.klant||'',x.status||''].filter(Boolean).join(' • ');
  const id=String(x.id ?? (window.data?.planning||[]).indexOf(x));
  const drag=desktop()?` draggable="true" data-plan-id="${esc(id)}"`:'';
  return `<div class="gAgendaEvent${classFor(x)}"${drag}>
    ${timeOf(x)?esc(timeOf(x))+' ':''}${esc(title)}
    ${meta?`<small>${esc(meta)}</small>`:''}
  </div>`;
}

function toolbar(title){
  return `<div class="gAgendaToolbar">
    <div class="gAgendaTitle">${esc(title)}</div>
    <div class="gAgendaNav">
      <button type="button" data-nav="prev">‹ Vorige</button>
      <button type="button" data-nav="today">Vandaag</button>
      <button type="button" data-nav="next">Volgende ›</button>
    </div>
  </div>`;
}

function currentMode(){ return String($('gioAgendaMode')?.value||'week').toLowerCase(); }

function renderWeek(box){
  const monday=mondayOf(cursor);
  const sunday=new Date(monday); sunday.setDate(monday.getDate()+6);
  const today=isoLocal(new Date());

  let html=toolbar(`${monday.toLocaleDateString('nl-NL',{day:'numeric',month:'short'})} – ${sunday.toLocaleDateString('nl-NL',{day:'numeric',month:'short',year:'numeric'})}`);
  html+='<div class="gAgendaWeek">';

  for(let i=0;i<7;i++){
    const d=new Date(monday); d.setDate(monday.getDate()+i);
    const iso=isoLocal(d), events=eventsFor(iso);
    html+=`<div class="gAgendaDay gAgendaDrop ${iso===today?'today':''}" data-date="${iso}">
      <div class="gAgendaDate">${d.toLocaleDateString('nl-NL',{weekday:'short',day:'numeric',month:'short'})}</div>
      ${events.length?events.map(eventHtml).join(''):'<div class="gAgendaEmpty">Geen planning</div>'}
    </div>`;
  }
  box.innerHTML=html+'</div>';
}

function renderMonth(box){
  const y=cursor.getFullYear(),m=cursor.getMonth();
  const first=new Date(y,m,1,12),last=new Date(y,m+1,0,12);
  const start=mondayOf(first),end=new Date(last);
  end.setDate(end.getDate()+(6-((end.getDay()+6)%7)));
  const today=isoLocal(new Date());
  const weekdays=['Ma','Di','Wo','Do','Vr','Za','Zo'];

  let html=toolbar(first.toLocaleDateString('nl-NL',{month:'long',year:'numeric'}));
  html+='<div class="gAgendaMonth">';
  html+=weekdays.map(w=>`<div class="gAgendaWeekday">${w}</div>`).join('');

  for(let d=new Date(start);d<=end;d.setDate(d.getDate()+1)){
    const iso=isoLocal(d), events=eventsFor(iso);
    html+=`<div class="gAgendaDay gAgendaDrop ${d.getMonth()===m?'':'outside'} ${iso===today?'today':''}" data-date="${iso}">
      <div class="gAgendaDate">${d.toLocaleDateString('nl-NL',{weekday:'short',day:'numeric',month:'short'})}</div>
      ${events.length?events.map(eventHtml).join(''):'<div class="gAgendaEmpty">Geen planning</div>'}
    </div>`;
  }
  box.innerHTML=html+'</div>';
}

function renderAgenda(){
  const box=$('gioDashboardAgenda');
  if(!box) return;
  currentMode()==='maand' ? renderMonth(box) : renderWeek(box);
  bindToolbar();
  bindDnD();
}

function bindToolbar(){
  $('gioDashboardAgenda')?.querySelectorAll('[data-nav]').forEach(btn=>{
    btn.onclick=()=>{
      const a=btn.dataset.nav;
      if(a==='today'){ cursor=new Date(); cursor.setHours(12,0,0,0); }
      else if(currentMode()==='maand'){ cursor=new Date(cursor.getFullYear(),cursor.getMonth()+(a==='next'?1:-1),1,12); }
      else { cursor.setDate(cursor.getDate()+(a==='next'?7:-7)); }
      renderAgenda();
    };
  });
}

function findItem(id){
  const list=window.data?.planning||[];
  return list.find(x=>String(x.id)===String(id)) || list[Number(id)] || null;
}

function movePlanning(id,target){
  const item=findItem(id);
  if(!item) return;
  const old=startOf(item);
  if(!old || old===target) return;

  const duration=dayDiff(old,endOf(item)||old);
  item.startdatum=target;
  item.datum=target;
  item.einddatum=addDays(target,duration);

  try{window.save?.();}catch(e){}
  try{window.render?.();}catch(e){renderAgenda();}
}

function bindDnD(){
  if(!desktop()) return;

  document.querySelectorAll('#gioDashboardAgenda .gAgendaEvent[draggable="true"]').forEach(el=>{
    el.addEventListener('dragstart',e=>{
      draggedId=el.dataset.planId||'';
      el.classList.add('dragging');
      e.dataTransfer.effectAllowed='move';
      try{e.dataTransfer.setData('text/plain',draggedId);}catch(_){}
    });
    el.addEventListener('dragend',()=>{
      draggedId='';
      el.classList.remove('dragging');
      document.querySelectorAll('#gioDashboardAgenda .gAgendaDrop.over').forEach(x=>x.classList.remove('over'));
    });
  });

  document.querySelectorAll('#gioDashboardAgenda .gAgendaDrop').forEach(cell=>{
    cell.addEventListener('dragover',e=>{
      if(!draggedId) return;
      e.preventDefault();
      e.dataTransfer.dropEffect='move';
      cell.classList.add('over');
    });
    cell.addEventListener('dragleave',()=>cell.classList.remove('over'));
    cell.addEventListener('drop',e=>{
      e.preventDefault();
      cell.classList.remove('over');
      const id=draggedId||e.dataTransfer.getData('text/plain');
      if(id && cell.dataset.date) movePlanning(id,cell.dataset.date);
    });
  });
}

/* Definitieve takeover:
   1) globale functie vervangen
   2) inline onchange roept voortaan deze functie aan
   3) normale app render() roept voortaan eveneens deze functie aan */
window.renderGioDashboardAgenda=renderAgenda;

const mode=$('gioAgendaMode');
if(mode){
  mode.onchange=()=>{
    cursor=new Date();
    cursor.setHours(12,0,0,0);
    renderAgenda();
  };
}

renderAgenda();
try{localStorage.setItem('gioMobileBuild','AGENDA PRO TAKEOVER FINAL 100');}catch(e){}

})();