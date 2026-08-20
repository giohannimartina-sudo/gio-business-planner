(function(){
'use strict';
const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));

function ensureTodoPatchStyle(){
  if(document.getElementById('gioTodoPatch035Style'))return;
  const s=document.createElement('style');
  s.id='gioTodoPatch035Style';
  s.textContent='.gioTodoJustAdded{outline:2px solid #f3c623!important;box-shadow:0 0 0 4px rgba(243,198,35,.18)!important}';
  document.head.appendChild(s);
}

function ensure(){if(!window.data)return false;if(!Array.isArray(data.todos))data.todos=[];if(!Array.isArray(data.afspraken))data.afspraken=[];if(!Array.isArray(data.klanten))data.klanten=[];if(!Array.isArray(data.projecten))data.projecten=[];return true}function today(){return new Date().toISOString().slice(0,10)}function iso(){return new Date().toISOString()}function pn(p){return p.naam||p.project||p.titel||''}function cn(c){return c.naam||c.name||''}
function fill(prefix){const c=$(prefix+'Client'),p=$(prefix+'Project');if(c)c.innerHTML='<option value="">Niet gekoppeld</option>'+data.klanten.map(x=>`<option>${esc(cn(x))}</option>`).join('');if(p)p.innerHTML='<option value="">Niet gekoppeld</option>'+data.projecten.map(x=>`<option>${esc(pn(x))}</option>`).join('')}
function late(t){return t.status!=='Klaar'&&t.dueDate&&t.dueDate<today()}let filter='open';
function inject(){if($('todoafsprakenpro'))return;const main=document.querySelector('main');if(!main)return;const s=document.createElement('section');s.id='todoafsprakenpro';s.className='page';s.innerHTML=`<div class="card"><h2>✅ To-do / Taken PRO</h2><div id="gioTodoKpis" class="gioTodoKpis"></div><div class="row"><div><label>Taak</label><input id="gioTodoTitle"></div><div><label>Deadline</label><input id="gioTodoDue" type="date"></div><div><label>Prioriteit</label><select id="gioTodoPriority"><option>Normaal</option><option>Hoog</option><option>Laag</option></select></div><div><label>Klant</label><select id="gioTodoClient"></select></div><div><label>Project</label><select id="gioTodoProject"></select></div><div><label>Notitie</label><input id="gioTodoNote"></div></div><div class="gioTodoActions"><button class="btn" onclick="gioTodoAdd()">➕ Taak</button><button class="btn2" onclick="gioTodoShow('open')">Open</button><button class="btn2" onclick="gioTodoShow('done')">Klaar</button><button class="btn2" onclick="gioTodoShow('all')">Alles</button></div><div id="gioTodoList"></div></div><div class="card"><h2>📅 Afspraken PRO</h2><div class="row"><div><label>Onderwerp</label><input id="gioAppointmentTitle"></div><div><label>Datum</label><input id="gioAppointmentDate" type="date"></div><div><label>Begintijd</label><input id="gioAppointmentStart" type="time"></div><div><label>Eindtijd</label><input id="gioAppointmentEnd" type="time"></div><div><label>Type</label><select id="gioAppointmentType"><option>Afspraak</option><option>Offerte opnemen</option><option>Werkbezoek</option><option>Leverancier</option><option>Privé</option></select></div><div><label>Klant</label><select id="gioAppointmentClient"></select></div><div><label>Project</label><select id="gioAppointmentProject"></select></div><div><label>Locatie</label><input id="gioAppointmentLocation"></div><div><label>Herinnering</label><select id="gioAppointmentReminder"><option value="0">Geen</option><option value="60">1 uur vooraf</option><option value="1440">24 uur vooraf</option></select></div><div><label>Notitie</label><input id="gioAppointmentNote"></div></div><button class="btn" onclick="gioAppointmentAdd()">📅 Afspraak opslaan</button><div id="gioAppointmentList"></div></div>`;main.appendChild(s);const nav=document.querySelector('aside nav');if(nav&&![...nav.querySelectorAll('button')].some(b=>b.textContent.includes('Taken & Afspraken'))){const b=document.createElement('button');b.textContent='✅ Taken & Afspraken';b.onclick=()=>{show('todoafsprakenpro',b);gioTodoAppointmentsInit()};nav.appendChild(b)}}
function rt(){const all=data.todos,open=all.filter(t=>t.status!=='Klaar').length,done=all.length-open,td=all.filter(t=>t.status!=='Klaar'&&t.dueDate===today()).length,ov=all.filter(late).length;$('gioTodoKpis').innerHTML=`<div><small>Open</small><b>${open}</b></div><div><small>Vandaag</small><b>${td}</b></div><div><small>Te laat</small><b>${ov}</b></div><div><small>Klaar</small><b>${done}</b></div>`;const l=all.filter(t=>filter==='all'||(filter==='done'?t.status==='Klaar':t.status!=='Klaar')).sort((a,b)=>String(a.dueDate||'9999').localeCompare(String(b.dueDate||'9999')));$('gioTodoList').innerHTML=l.map(t=>`<div class="gioTodoRow ${late(t)?'late':''} ${t.status==='Klaar'?'done':''}"><div><b>${esc(t.title)}</b><br><small>${esc(t.priority)}${t.dueDate?' · '+esc(t.dueDate):''}${t.client?' · '+esc(t.client):''}${t.project?' · '+esc(t.project):''}</small>${t.note?'<br><small>'+esc(t.note)+'</small>':''}</div><div class="gioTodoRowActions">${t.status!=='Klaar'?`<button onclick="gioTodoComplete('${t.id}')">✅</button>`:`<button onclick="gioTodoReopen('${t.id}')">↩️</button>`}<button onclick="gioTodoEdit('${t.id}')">✏️</button><button class="del" onclick="gioTodoDelete('${t.id}')">🗑️</button></div></div>`).join('')||'<p>Geen taken.</p>';dash()}
window.gioTodoShow=f=>{
  filter=f||'open';
  rt();
};window.gioTodoAdd=()=>{
  ensure();
  const title=$('gioTodoTitle')?.value.trim()||'';
  if(!title){alert('Vul een taak in.');return}

  const id='todo-'+Date.now()+'-'+Math.random().toString(36).slice(2,6);
  const item={
    id,
    title,
    dueDate:$('gioTodoDue')?.value||'',
    priority:$('gioTodoPriority')?.value||'Normaal',
    client:$('gioTodoClient')?.value||'',
    project:$('gioTodoProject')?.value||'',
    note:$('gioTodoNote')?.value.trim()||'',
    status:'Open',
    createdAt:iso(),
    updatedAt:iso()
  };

  data.todos.unshift(item);

  // Nieuwe taak moet altijd direct zichtbaar zijn.
  filter='open';
  try{save?.()}catch(e){console.error('Todo save:',e)}

  if($('gioTodoTitle'))$('gioTodoTitle').value='';
  if($('gioTodoNote'))$('gioTodoNote').value='';

  rt();

  setTimeout(()=>{
    const row=document.querySelector(`[data-gio-todo-id="${CSS.escape(id)}"]`);
    if(row){
      row.classList.add('gioTodoJustAdded');
      row.scrollIntoView({behavior:'smooth',block:'center'});
      setTimeout(()=>row.classList.remove('gioTodoJustAdded'),1800);
    }
  },50);
};window.gioTodoComplete=id=>{const t=data.todos.find(x=>x.id===id);if(t){t.status='Klaar';t.completedAt=iso();save?.();rt()}};window.gioTodoReopen=id=>{const t=data.todos.find(x=>x.id===id);if(t){t.status='Open';delete t.completedAt;save?.();rt()}};window.gioTodoDelete=id=>{if(confirm('Taak verwijderen?')){data.todos=data.todos.filter(x=>x.id!==id);save?.();rt()}};window.gioTodoEdit=id=>{const t=data.todos.find(x=>x.id===id);if(!t)return;const n=prompt('Taak:',t.title);if(n===null)return;t.title=n.trim()||t.title;const no=prompt('Notitie:',t.note||'');if(no!==null)t.note=no;save?.();rt()};
function ra(){const l=[...data.afspraken].sort((a,b)=>(a.date+a.start).localeCompare(b.date+b.start));$('gioAppointmentList').innerHTML=l.map(a=>`<div class="gioAppointmentRow"><div><b>${esc(a.date)} · ${esc(a.start||'--:--')} ${a.end?'– '+esc(a.end):''}</b><br>${esc(a.title)} <small>· ${esc(a.type)}</small>${a.location?'<br><small>📍 '+esc(a.location)+'</small>':''}${(a.client||a.project)?'<br><small>'+esc(a.client||'')+(a.project?' · '+esc(a.project):'')+'</small>':''}</div><div class="gioTodoRowActions"><button onclick="gioAppointmentEdit('${a.id}')">✏️</button><button class="del" onclick="gioAppointmentDelete('${a.id}')">🗑️</button></div></div>`).join('')||'<p>Nog geen afspraken.</p>';dash()}
window.gioAppointmentAdd=()=>{const title=$('gioAppointmentTitle').value.trim(),date=$('gioAppointmentDate').value;if(!title||!date){alert('Vul onderwerp en datum in.');return}data.afspraken.push({id:'appt-'+Date.now(),title,date,start:$('gioAppointmentStart').value,end:$('gioAppointmentEnd').value,type:$('gioAppointmentType').value,client:$('gioAppointmentClient').value,project:$('gioAppointmentProject').value,location:$('gioAppointmentLocation').value.trim(),reminderMinutes:Number($('gioAppointmentReminder').value)||0,note:$('gioAppointmentNote').value.trim(),createdAt:iso()});save?.();$('gioAppointmentTitle').value='';$('gioAppointmentLocation').value='';$('gioAppointmentNote').value='';ra()};window.gioAppointmentDelete=id=>{if(confirm('Afspraak verwijderen?')){data.afspraken=data.afspraken.filter(x=>x.id!==id);save?.();ra()}};window.gioAppointmentEdit=id=>{const a=data.afspraken.find(x=>x.id===id);if(!a)return;const n=prompt('Onderwerp:',a.title);if(n===null)return;a.title=n.trim()||a.title;const loc=prompt('Locatie:',a.location||'');if(loc!==null)a.location=loc;save?.();ra()};
function dash(){const d=document.querySelector('#dashboard,.dashboard,#home,.home');if(!d)return;let w=$('gioTodoAppointmentWidget');if(!w){w=document.createElement('div');w.id='gioTodoAppointmentWidget';w.className='card gioTodoDashWidget';d.appendChild(w)}const o=data.todos.filter(t=>t.status!=='Klaar').sort((a,b)=>String(a.dueDate||'9999').localeCompare(String(b.dueDate||'9999'))).slice(0,4);const end=new Date();end.setDate(end.getDate()+7);const es=end.toISOString().slice(0,10),ap=data.afspraken.filter(a=>a.date>=today()&&a.date<=es).sort((a,b)=>(a.date+a.start).localeCompare(b.date+b.start)).slice(0,4);w.innerHTML=`<h3>✅ Taken & 📅 Afspraken</h3><div class="gioTodoDashCols"><div><b>Open taken</b>${o.length?o.map(t=>`<div>${late(t)?'🔴':'•'} ${esc(t.title)} ${t.dueDate?'<small>'+esc(t.dueDate)+'</small>':''}</div>`).join(''):'<small>Geen open taken</small>'}</div><div><b>Komende 7 dagen</b>${ap.length?ap.map(a=>`<div>📅 ${esc(a.date)} ${esc(a.start||'')} · ${esc(a.title)}</div>`).join(''):'<small>Geen afspraken</small>'}</div></div>`}
window.gioTodoAppointmentsInit=()=>{ensure();filter='open';fill('gioTodo');fill('gioAppointment');$('gioTodoDue').value=$('gioTodoDue').value||today();$('gioAppointmentDate').value=$('gioAppointmentDate').value||today();rt();ra()};function menu(){const old=window.gioOpenMoreOverlay;window.gioOpenMoreOverlay=function(){old?.();setTimeout(()=>{const g=document.querySelector('#gioOverlayBody .gioOverlayGrid');if(g&&!g.textContent.includes('Taken & Afspraken'))g.insertAdjacentHTML('beforeend',`<button onclick="gioApprovedGo('todoafsprakenpro');gioTodoAppointmentsInit()"><i>✅</i>Taken & Afspraken</button>`)},0)}}function init(){ensureTodoPatchStyle();ensure();inject();menu();gioTodoAppointmentsInit();document.title='GIO Business Planner PRO — MOBILE DEV 032';try{localStorage.setItem('gioMobileBuild','MOBILE DEV 032')}catch(e){}}document.readyState==='loading'?document.addEventListener('DOMContentLoaded',()=>setTimeout(init,2800)):setTimeout(init,2800);
})();