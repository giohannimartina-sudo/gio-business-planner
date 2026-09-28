/* DEV 047 - zelfde weergave, flikker-techniek verwijderd */
(function(){
'use strict';
let installed=false, attempts=0;
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function isoLocal(d){
 const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');
 return `${y}-${m}-${day}`;
}
function monday(d){
 const x=new Date(d);x.setHours(12,0,0,0);x.setDate(x.getDate()-((x.getDay()+6)%7));return x;
}
function covers(x,iso){
 const s=x.startdatum||x.datum||'',e=x.einddatum||s;
 return !!s&&s<=iso&&e>=iso;
}
function eventsFor(iso){
 return (window.data?.planning||[]).filter(x=>covers(x,iso))
   .sort((a,b)=>String(a.starttijd||a.tijd||'').localeCompare(String(b.starttijd||b.tijd||'')));
}
function eventHtml(x){
 const time=x.starttijd||x.tijd||'';
 const title=x.project||x.klant||'Planning';
 return `<div class="gio047Event">${time?esc(time)+' ':''}${esc(title)}
   <small>${esc(x.klant||'')}${x.status?' • '+esc(x.status):''}</small></div>`;
}
function renderWeek(box){
 const start=monday(new Date());
 let html='<div class="gio047WeekGrid">';
 for(let i=0;i<7;i++){
   const d=new Date(start);d.setDate(start.getDate()+i);
   const iso=isoLocal(d),ev=eventsFor(iso);
   html+=`<div class="gio047WeekDay">
     <div class="gio047WeekHead">${d.toLocaleDateString('nl-NL',{weekday:'short',day:'numeric',month:'short'})}</div>
     ${ev.length?ev.map(eventHtml).join(''):'<div class="gio047Empty">Geen planning</div>'}
   </div>`;
 }
 box.innerHTML=html+'</div>';
}
function renderMonth(box){
 const now=new Date();now.setHours(12,0,0,0);
 const y=now.getFullYear(),m=now.getMonth();
 const first=new Date(y,m,1,12),last=new Date(y,m+1,0,12);
 const start=monday(first),end=new Date(last);
 end.setDate(end.getDate()+(6-((end.getDay()+6)%7)));
 const today=isoLocal(now),weekdays=['Ma','Di','Wo','Do','Vr','Za','Zo'];

 let html=`<div class="gio047MonthTitle">${first.toLocaleDateString('nl-NL',{month:'long',year:'numeric'})}</div>`;
 html+='<div class="gio047MonthGrid">';
 html+=weekdays.map(w=>`<div class="gio047WeekName">${w}</div>`).join('');

 for(let d=new Date(start);d<=end;d.setDate(d.getDate()+1)){
   const iso=isoLocal(d),ev=eventsFor(iso);
   html+=`<div class="gio047MonthDay ${d.getMonth()===m?'':'outside'} ${iso===today?'today':''}">
     <div class="gio047Date">${d.toLocaleDateString('nl-NL',{weekday:'short',day:'numeric',month:'short'})}</div>
     ${ev.length?ev.map(eventHtml).join(''):'<div class="gio047Empty">Geen planning</div>'}
   </div>`;
 }
 box.innerHTML=html+'</div>';
}
function render(){
 const box=$('gioDashboardAgenda'),mode=$('gioAgendaMode');
 if(!box||!mode)return;
 if(mode.value==='maand')renderMonth(box);else renderWeek(box);
}
function install(){
 if(installed)return true;
 const oldMode=$('gioAgendaMode'),oldBox=$('gioDashboardAgenda');
 if(!oldMode||!oldBox||!window.data)return false;

 /* DEV047 had observers on these nodes. Replacing the nodes disconnects those observers
    without touching the approved visual design. */
 const mode=oldMode.cloneNode(true);mode.removeAttribute('onchange');oldMode.replaceWith(mode);
 const box=oldBox.cloneNode(false);box.id='gioDashboardAgenda';oldBox.replaceWith(box);

 installed=true;
 window.renderGioDashboardAgenda=render;
 mode.addEventListener('change',render);
 render();
 try{localStorage.setItem('gioMobileBuild','DEV 047 STABLE - ZONDER FLIKKEREN')}catch(e){}
 return true;
}
function boot(){
 if(install())return;
 if(++attempts<40)setTimeout(boot,200);
}
boot();
})();