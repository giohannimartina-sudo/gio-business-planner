/* GIO Agenda Stable Final
   Eén renderer voor Week en Maand.
   Verwijdert oude agenda-listeners/observers door de live DOM-nodes eenmalig te vervangen.
   Geen MutationObserver, geen render-loop en geen timeouts na installatie. */
(function(){
'use strict';

let installed=false;

const $=id=>document.getElementById(id);
const esc=s=>{
  if(typeof window.gioEsc==='function') return window.gioEsc(s);
  return String(s??'').replace(/[&<>"']/g,c=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
};

function isoLocal(d){
  return [
    d.getFullYear(),
    String(d.getMonth()+1).padStart(2,'0'),
    String(d.getDate()).padStart(2,'0')
  ].join('-');
}

function mondayOf(date){
  const d=new Date(date);
  d.setHours(12,0,0,0);
  d.setDate(d.getDate()-((d.getDay()+6)%7));
  return d;
}

function covers(item,iso){
  const start=item.startdatum||item.datum||'';
  const end=item.einddatum||start;
  return !!start && start<=iso && end>=iso;
}

function eventsFor(iso){
  return (window.data?.planning||[])
    .filter(x=>covers(x,iso))
    .sort((a,b)=>String(a.starttijd||a.tijd||'').localeCompare(String(b.starttijd||b.tijd||'')));
}

function eventHtml(x){
  const time=x.starttijd||x.tijd||'';
  const title=x.project||x.klant||'Planning';
  const client=x.klant||'';
  const done=x.status==='Gereed'?' done':'';

  return `<div class="gioAgendaFinalEvent${done}">
    <b>${time?esc(time)+' ':''}${esc(title)}</b>
    ${client?`<br><small>${esc(client)}</small>`:''}
  </div>`;
}

function renderWeek(box){
  const monday=mondayOf(new Date());
  let html='<div class="gioAgendaFinalWeek">';

  for(let i=0;i<7;i++){
    const d=new Date(monday);
    d.setDate(monday.getDate()+i);

    const iso=isoLocal(d);
    const list=eventsFor(iso);

    html+=`<div class="gioAgendaFinalDay">
      <div class="gioAgendaFinalHead">${d.toLocaleDateString('nl-NL',{
        weekday:'short',
        day:'numeric',
        month:'short'
      })}</div>
      ${list.length
        ? list.map(eventHtml).join('')
        : '<div class="gioAgendaFinalEmpty">Geen planning</div>'}
    </div>`;
  }

  box.innerHTML=html+'</div>';
}

function renderMonth(box){
  const now=new Date();
  now.setHours(12,0,0,0);

  const year=now.getFullYear();
  const month=now.getMonth();

  const first=new Date(year,month,1,12);
  const last=new Date(year,month+1,0,12);
  const start=mondayOf(first);

  const end=new Date(last);
  end.setDate(end.getDate()+(6-((end.getDay()+6)%7)));

  const today=isoLocal(now);
  const weekdays=['ma','di','wo','do','vr','za','zo'];

  let html=`<div class="gioAgendaFinalMonthTitle">
    ${first.toLocaleDateString('nl-NL',{month:'long',year:'numeric'})}
  </div>`;

  html+='<div class="gioAgendaFinalMonth">';
  html+=weekdays.map(w=>`<div class="gioAgendaFinalWeekday">${w}</div>`).join('');

  for(let d=new Date(start);d<=end;d.setDate(d.getDate()+1)){
    const iso=isoLocal(d);
    const list=eventsFor(iso);

    html+=`<div class="gioAgendaFinalDay ${d.getMonth()===month?'':'outside'} ${iso===today?'today':''}">
      <div class="gioAgendaFinalDate">${d.toLocaleDateString('nl-NL',{
        weekday:'short',
        day:'numeric',
        month:'short'
      })}</div>
      ${list.length
        ? list.map(eventHtml).join('')
        : '<div class="gioAgendaFinalEmpty">Geen planning</div>'}
    </div>`;
  }

  box.innerHTML=html+'</div>';
}

function renderAgenda(){
  const box=$('gioDashboardAgenda');
  const mode=$('gioAgendaMode');
  if(!box||!mode) return;

  if(String(mode.value||'week').toLowerCase()==='maand'){
    renderMonth(box);
  }else{
    renderWeek(box);
  }
}

function install(){
  if(installed) return true;

  const oldMode=$('gioAgendaMode');
  const oldBox=$('gioDashboardAgenda');

  if(!oldMode||!oldBox||!window.data) return false;

  // Oude change-listeners verdwijnen.
  const mode=oldMode.cloneNode(true);
  mode.removeAttribute('onchange');
  oldMode.replaceWith(mode);

  // Oude observers die rechtstreeks op de agenda-container stonden,
  // blijven aan de oude (losgekoppelde) node hangen en kunnen niet meer flikkeren.
  const box=oldBox.cloneNode(false);
  box.id='gioDashboardAgenda';
  oldBox.replaceWith(box);

  installed=true;

  window.renderGioDashboardAgenda=renderAgenda;
  mode.addEventListener('change',renderAgenda);

  renderAgenda();

  try{
    localStorage.setItem('gioAgendaStableFinal','001');
  }catch(e){}

  return true;
}

let attempts=0;
function boot(){
  if(install()) return;
  attempts++;
  if(attempts<30) setTimeout(boot,200);
}

boot();

})();