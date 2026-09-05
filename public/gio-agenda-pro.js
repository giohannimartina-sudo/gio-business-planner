/* GIO AGENDA PRO FINAL
   Eén agenda-engine voor Week + Maand.
   Visueel gebaseerd op DEV 047.
   Geen MutationObserver. Geen render-loop.
   Desktop drag & drop ingebouwd. */
(function(){
'use strict';

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[c]));

let installed = false;
let bootAttempts = 0;
let cursorDate = new Date();
cursorDate.setHours(12,0,0,0);
let draggedId = '';

function desktop(){
  return window.matchMedia('(min-width:801px)').matches;
}

function isoLocal(d){
  return [
    d.getFullYear(),
    String(d.getMonth()+1).padStart(2,'0'),
    String(d.getDate()).padStart(2,'0')
  ].join('-');
}

function fromIso(s){
  return new Date(`${s}T12:00:00`);
}

function mondayOf(date){
  const d = new Date(date);
  d.setHours(12,0,0,0);
  d.setDate(d.getDate() - ((d.getDay()+6)%7));
  return d;
}

function addDays(iso,n){
  const d = fromIso(iso);
  d.setDate(d.getDate()+n);
  return isoLocal(d);
}

function dayDiff(a,b){
  return Math.max(0,Math.round((fromIso(b)-fromIso(a))/86400000));
}

function covers(item,iso){
  const start = item.startdatum || item.datum || '';
  const end = item.einddatum || start;
  return !!start && start <= iso && end >= iso;
}

function eventsFor(iso){
  return (window.data?.planning || [])
    .filter(x => covers(x,iso))
    .sort((a,b)=>String(a.starttijd||a.tijd||'').localeCompare(String(b.starttijd||b.tijd||'')));
}

function statusClass(x){
  const s=String(x.status||'').toLowerCase();
  if(s.includes('gereed')||s.includes('klaar')||s.includes('betaald')) return ' done';
  const end=x.einddatum||x.datum||x.startdatum||'';
  if(end && end < isoLocal(new Date()) && !s.includes('gereed') && !s.includes('betaald')) return ' late';
  return '';
}

function eventHtml(x){
  const time=x.starttijd||x.tijd||'';
  const title=x.project||x.klant||'Planning';
  const meta=[x.klant||'',x.status||''].filter(Boolean).join(' • ');
  const drag=desktop()?` draggable="true" data-plan-id="${esc(x.id)}"`:'';
  return `<div class="gioAgendaProEvent${statusClass(x)}"${drag}>
    ${time?esc(time)+' ':''}${esc(title)}
    ${meta?`<small>${esc(meta)}</small>`:''}
  </div>`;
}

function toolbar(title){
  return `<div class="gioAgendaProToolbar">
    <div class="gioAgendaProTitle">${esc(title)}</div>
    <div class="gioAgendaProNav">
      <button type="button" data-agenda-nav="prev">‹ Vorige</button>
      <button type="button" data-agenda-nav="today">Vandaag</button>
      <button type="button" data-agenda-nav="next">Volgende ›</button>
    </div>
  </div>`;
}

function renderWeek(box){
  const monday=mondayOf(cursorDate);
  const sunday=new Date(monday);
  sunday.setDate(monday.getDate()+6);

  let html=toolbar(
    `${monday.toLocaleDateString('nl-NL',{day:'numeric',month:'short'})} – `+
    `${sunday.toLocaleDateString('nl-NL',{day:'numeric',month:'short',year:'numeric'})}`
  );
  html+='<div class="gioAgendaProWeek">';

  for(let i=0;i<7;i++){
    const d=new Date(monday);
    d.setDate(monday.getDate()+i);
    const iso=isoLocal(d);
    const list=eventsFor(iso);

    html+=`<div class="gioAgendaProDay gioAgendaProDrop ${iso===isoLocal(new Date())?'today':''}" data-date="${iso}">
      <div class="gioAgendaProDate">${d.toLocaleDateString('nl-NL',{
        weekday:'short',day:'numeric',month:'short'
      })}</div>
      ${list.length?list.map(eventHtml).join(''):'<div class="gioAgendaProEmpty">Geen planning</div>'}
    </div>`;
  }

  box.innerHTML=html+'</div>';
}

function renderMonth(box){
  const year=cursorDate.getFullYear();
  const month=cursorDate.getMonth();

  const first=new Date(year,month,1,12);
  const last=new Date(year,month+1,0,12);
  const start=mondayOf(first);
  const end=new Date(last);
  end.setDate(end.getDate()+(6-((end.getDay()+6)%7)));

  const today=isoLocal(new Date());
  const weekdays=['Ma','Di','Wo','Do','Vr','Za','Zo'];

  let html=toolbar(first.toLocaleDateString('nl-NL',{month:'long',year:'numeric'}));
  html+='<div class="gioAgendaProMonth">';
  html+=weekdays.map(w=>`<div class="gioAgendaProWeekday">${w}</div>`).join('');

  for(let d=new Date(start);d<=end;d.setDate(d.getDate()+1)){
    const iso=isoLocal(d);
    const list=eventsFor(iso);

    html+=`<div class="gioAgendaProDay gioAgendaProDrop ${d.getMonth()===month?'':'outside'} ${iso===today?'today':''}" data-date="${iso}">
      <div class="gioAgendaProDate">${d.toLocaleDateString('nl-NL',{
        weekday:'short',day:'numeric',month:'short'
      })}</div>
      ${list.length?list.map(eventHtml).join(''):'<div class="gioAgendaProEmpty">Geen planning</div>'}
    </div>`;
  }

  box.innerHTML=html+'</div>';
}

function mode(){
  return String($('gioAgendaMode')?.value||'week').toLowerCase();
}

function render(){
  const box=$('gioDashboardAgenda');
  if(!box) return;

  if(mode()==='maand') renderMonth(box);
  else renderWeek(box);

  bindToolbar();
  bindDragDrop();
}

function bindToolbar(){
  const box=$('gioDashboardAgenda');
  if(!box) return;

  box.querySelectorAll('[data-agenda-nav]').forEach(btn=>{
    btn.onclick=()=>{
      const action=btn.dataset.agendaNav;

      if(action==='today'){
        cursorDate=new Date();
        cursorDate.setHours(12,0,0,0);
      }else if(mode()==='maand'){
        cursorDate=new Date(cursorDate.getFullYear(),cursorDate.getMonth()+(action==='next'?1:-1),1,12);
      }else{
        cursorDate.setDate(cursorDate.getDate()+(action==='next'?7:-7));
      }
      render();
    };
  });
}

function movePlanning(id,targetDate){
  const item=(window.data?.planning||[]).find(x=>String(x.id)===String(id));
  if(!item) return;

  const oldStart=item.startdatum||item.datum||'';
  if(!oldStart || oldStart===targetDate) return;

  const oldEnd=item.einddatum||oldStart;
  const duration=dayDiff(oldStart,oldEnd);

  item.startdatum=targetDate;
  item.datum=targetDate;
  item.einddatum=addDays(targetDate,duration);

  if(!Array.isArray(item.historie)) item.historie=[];
  item.historie.unshift({
    tijd:new Date().toISOString(),
    actie:`Planning verplaatst van ${oldStart} naar ${targetDate}`
  });

  try{window.save?.();}catch(e){}
  try{window.gioRenderPlanningPro?.();}catch(e){}
  render();
}

function bindDragDrop(){
  if(!desktop()) return;

  document.querySelectorAll('#gioDashboardAgenda .gioAgendaProEvent[draggable="true"]').forEach(el=>{
    el.addEventListener('dragstart',e=>{
      draggedId=el.dataset.planId||'';
      el.classList.add('dragging');
      e.dataTransfer.effectAllowed='move';
      try{e.dataTransfer.setData('text/plain',draggedId);}catch(_){}
    });

    el.addEventListener('dragend',()=>{
      draggedId='';
      el.classList.remove('dragging');
      document.querySelectorAll('#gioDashboardAgenda .gioAgendaProDrop.over')
        .forEach(x=>x.classList.remove('over'));
    });
  });

  document.querySelectorAll('#gioDashboardAgenda .gioAgendaProDrop').forEach(cell=>{
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

function install(){
  if(installed) return true;

  const oldMode=$('gioAgendaMode');
  const oldBox=$('gioDashboardAgenda');

  if(!oldMode || !oldBox || !window.data) return false;

  /* Oude agenda-listeners en observers loskoppelen door de live DOM nodes één keer te vervangen. */
  const freshMode=oldMode.cloneNode(true);
  freshMode.removeAttribute('onchange');
  oldMode.replaceWith(freshMode);

  const freshBox=oldBox.cloneNode(false);
  freshBox.id='gioDashboardAgenda';
  oldBox.replaceWith(freshBox);

  installed=true;

  window.renderGioDashboardAgenda=render;
  freshMode.addEventListener('change',()=>{
    cursorDate=new Date();
    cursorDate.setHours(12,0,0,0);
    render();
  });

  render();

  try{
    localStorage.setItem('gioMobileBuild','AGENDA PRO FINAL 100');
  }catch(e){}

  return true;
}

function boot(){
  if(install()) return;
  if(++bootAttempts<40) setTimeout(boot,200);
}

boot();

})();