
/* GIO Agenda Verticaal PRO
   Maand: datum 1-31 verticaal, werkdagen horizontaal — naar Excel referentie.
   Week: dagen verticaal voor maximale leesbaarheid.
   Geen MutationObserver. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let cursor=new Date();cursor.setHours(12,0,0,0);

function iso(d){return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')}
function monday(d){const x=new Date(d);x.setHours(12,0,0,0);x.setDate(x.getDate()-((x.getDay()+6)%7));return x}
function covers(x,s){const a=x.startdatum||x.datum||'',b=x.einddatum||a;return !!a&&a<=s&&b>=s}
function events(s){return (window.data?.planning||[]).filter(x=>covers(x,s)).sort((a,b)=>String(a.starttijd||a.tijd||'').localeCompare(String(b.starttijd||b.tijd||'')))}
function cls(x){const s=String(x.status||'').toLowerCase();if(s.includes('gereed')||s.includes('klaar')||s.includes('betaald'))return' done';const e=x.einddatum||x.datum||x.startdatum||'';if(e&&e<iso(new Date()))return' late';return''}
function ev(x){const t=x.starttijd||x.tijd||'',title=x.project||x.klant||'Planning',meta=[x.klant||'',x.status||''].filter(Boolean).join(' • ');return `<div class="gvEvent${cls(x)}">${t?esc(t)+' ':''}${esc(title)}${meta?`<br><small>${esc(meta)}</small>`:''}</div>`}
function mode(){return String($('gioAgendaMode')?.value||'week').toLowerCase()}
function toolbar(title){return `<div class="gvToolbar"><div class="gvTitle">${esc(title)}</div><div class="gvNav"><button data-gv="prev">‹ Vorige</button><button data-gv="today">Vandaag</button><button data-gv="next">Volgende ›</button></div></div>`}

function renderMonth(box){
 const y=cursor.getFullYear(),m=cursor.getMonth(),days=new Date(y,m+1,0,12).getDate(),today=iso(new Date());
 const names=['Maandag','Dinsdag','Woensdag','Donderdag','Vrijdag','Zaterdag','Zondag'];
 let html=toolbar(new Date(y,m,1,12).toLocaleDateString('nl-NL',{month:'long',year:'numeric'}));
 html+='<table class="gvTable"><thead><tr><th>Datum</th>'+names.map(n=>`<th>${n}</th>`).join('')+'</tr></thead><tbody>';

 for(let day=1;day<=days;day++){
   const d=new Date(y,m,day,12),dateIso=iso(d),weekday=(d.getDay()+6)%7;
   html+=`<tr class="${dateIso===today?'today':''}"><td class="gvDate">${day}</td>`;
   for(let col=0;col<7;col++){
     if(col===weekday){
       const list=events(dateIso);
       html+=`<td class="gvActiveDay" data-date="${dateIso}">${list.length?list.map(ev).join(''):'<div class="gvEmpty">Vrij</div>'}</td>`;
     }else{
       html+='<td></td>';
     }
   }
   html+='</tr>';
 }
 box.innerHTML=html+'</tbody></table>';
}

function renderWeek(box){
 const start=monday(cursor),today=iso(new Date());
 let html=toolbar(`Week ${start.toLocaleDateString('nl-NL',{day:'numeric',month:'short'})}`);
 html+='<div class="gvWeekList">';
 for(let i=0;i<7;i++){
   const d=new Date(start);d.setDate(start.getDate()+i);const s=iso(d),list=events(s);
   html+=`<div class="gvWeekDate" style="${s===today?'background:#111827!important;color:#fff!important':''}">${d.toLocaleDateString('nl-NL',{weekday:'short',day:'numeric',month:'short'})}</div><div class="gvWeekEvents">${list.length?list.map(ev).join(''):'<div class="gvEmpty">Geen planning</div>'}</div>`;
 }
 box.innerHTML=html+'</div>';
}

function renderAgenda(){
 const box=$('gioDashboardAgenda');if(!box)return;
 mode()==='maand'?renderMonth(box):renderWeek(box);
 box.querySelectorAll('[data-gv]').forEach(b=>b.onclick=()=>{
   const a=b.dataset.gv;
   if(a==='today'){cursor=new Date();cursor.setHours(12,0,0,0)}
   else if(mode()==='maand')cursor=new Date(cursor.getFullYear(),cursor.getMonth()+(a==='next'?1:-1),1,12);
   else cursor.setDate(cursor.getDate()+(a==='next'?7:-7));
   renderAgenda();
 });
}

window.renderGioDashboardAgenda=renderAgenda;
const sel=$('gioAgendaMode');
if(sel)sel.onchange=()=>{cursor=new Date();cursor.setHours(12,0,0,0);renderAgenda()};
renderAgenda();
try{localStorage.setItem('gioMobileBuild','AGENDA VERTICAAL PRO 001')}catch(e){}
})();
