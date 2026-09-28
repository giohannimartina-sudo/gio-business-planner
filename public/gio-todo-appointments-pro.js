
(function(){
'use strict';

const byId = id => document.getElementById(id);
const clean = v => String(v ?? '');
const esc = s => clean(s).replace(/[&<>"']/g, c => ({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[c]));

let todoFilter = 'open';

function getData(){
  if (!window.data || typeof window.data !== 'object') return null;
  if (!Array.isArray(window.data.todos)) window.data.todos = [];
  if (!Array.isArray(window.data.afspraken)) window.data.afspraken = [];
  if (!Array.isArray(window.data.klanten)) window.data.klanten = [];
  if (!Array.isArray(window.data.projecten)) window.data.projecten = [];
  return window.data;
}
function persist(){
  try {
    if (typeof window.save === 'function') window.save();
  } catch (e) {
    console.error('GIO todo save error', e);
  }
}
function today(){
  const d=new Date();
  const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}
function iso(){ return new Date().toISOString(); }
function isLate(t){
  return t.status !== 'Klaar' && !!t.dueDate && t.dueDate < today();
}
function projectName(p){ return p?.naam || p?.project || p?.titel || ''; }
function clientName(c){ return c?.naam || c?.name || ''; }

function ensureTodoListContainer(){
  let list=byId('gioTodoList');
  if (list) return list;

  // Alleen wanneer de bestaande To-do kaart wel bestaat maar het lijstvak ontbreekt:
  const addBtn=[...document.querySelectorAll('button')].find(b =>
    /Taak/i.test(b.textContent || '') && /\+|➕/.test(b.textContent || '')
  );
  if (!addBtn) return null;

  const actions=addBtn.closest('.gioTodoActions') || addBtn.parentElement;
  if (!actions) return null;

  list=document.createElement('div');
  list.id='gioTodoList';
  list.style.marginTop='14px';
  actions.insertAdjacentElement('afterend',list);
  return list;
}

function fillSelectors(){
  const d=getData(); if(!d) return;
  const c=byId('gioTodoClient');
  const p=byId('gioTodoProject');
  if(c){
    const old=c.value;
    c.innerHTML='<option value="">Niet gekoppeld</option>'+
      d.klanten.map(x=>`<option value="${esc(clientName(x))}">${esc(clientName(x))}</option>`).join('');
    if([...c.options].some(o=>o.value===old)) c.value=old;
  }
  if(p){
    const old=p.value;
    p.innerHTML='<option value="">Niet gekoppeld</option>'+
      d.projecten.map(x=>`<option value="${esc(projectName(x))}">${esc(projectName(x))}</option>`).join('');
    if([...p.options].some(o=>o.value===old)) p.value=old;
  }

  const ac=byId('gioAppointmentClient');
  const ap=byId('gioAppointmentProject');
  if(ac){
    const old=ac.value;
    ac.innerHTML='<option value="">Niet gekoppeld</option>'+
      d.klanten.map(x=>`<option value="${esc(clientName(x))}">${esc(clientName(x))}</option>`).join('');
    if([...ac.options].some(o=>o.value===old)) ac.value=old;
  }
  if(ap){
    const old=ap.value;
    ap.innerHTML='<option value="">Niet gekoppeld</option>'+
      d.projecten.map(x=>`<option value="${esc(projectName(x))}">${esc(projectName(x))}</option>`).join('');
    if([...ap.options].some(o=>o.value===old)) ap.value=old;
  }
}

function renderTodos(){
  const d=getData(); if(!d) return;
  const list=ensureTodoListContainer();
  if(!list) return;

  const open=d.todos.filter(t=>t.status!=='Klaar').length;
  const done=d.todos.filter(t=>t.status==='Klaar').length;
  const due=d.todos.filter(t=>t.status!=='Klaar' && t.dueDate===today()).length;
  const late=d.todos.filter(isLate).length;

  const kpis=byId('gioTodoKpis');
  if(kpis){
    kpis.innerHTML=`
      <div><small>Open</small><b>${open}</b></div>
      <div><small>Vandaag</small><b>${due}</b></div>
      <div><small>Te laat</small><b>${late}</b></div>
      <div><small>Klaar</small><b>${done}</b></div>`;
  }

  const filtered=d.todos
    .filter(t => todoFilter==='all' || (todoFilter==='done' ? t.status==='Klaar' : t.status!=='Klaar'))
    .sort((a,b)=>clean(a.dueDate||'9999-12-31').localeCompare(clean(b.dueDate||'9999-12-31')));

  if(!filtered.length){
    list.innerHTML=`<div style="margin-top:14px;padding:14px;border:1px solid #30343d;border-radius:12px;background:#0b0f14">
      ${todoFilter==='done'?'Nog geen afgeronde taken.':todoFilter==='all'?'Nog geen taken toegevoegd.':'Geen open taken.'}
    </div>`;
    updateFilterButtons();
    return;
  }

  list.innerHTML=filtered.map(t=>`
    <div class="gioTodoRow ${isLate(t)?'late':''} ${t.status==='Klaar'?'done':''}" data-todo-id="${esc(t.id)}">
      <div>
        <b>${esc(t.title)}</b>
        <br><small>
          ${esc(t.priority||'Normaal')}
          ${t.dueDate?' · '+esc(t.dueDate):''}
          ${t.client?' · '+esc(t.client):''}
          ${t.project?' · '+esc(t.project):''}
        </small>
        ${t.note?`<br><small>${esc(t.note)}</small>`:''}
      </div>
      <div class="gioTodoRowActions">
        ${t.status!=='Klaar'
          ? `<button type="button" data-action="complete" data-id="${esc(t.id)}">✅</button>`
          : `<button type="button" data-action="reopen" data-id="${esc(t.id)}">↩️</button>`}
        <button type="button" data-action="edit" data-id="${esc(t.id)}">✏️</button>
        <button type="button" class="del" data-action="delete" data-id="${esc(t.id)}">🗑️</button>
      </div>
    </div>`).join('');

  updateFilterButtons();
}

function updateFilterButtons(){
  const mapping={open:'Open',done:'Klaar',all:'Alles'};
  [...document.querySelectorAll('button')].forEach(b=>{
    const txt=(b.textContent||'').trim();
    const key=Object.keys(mapping).find(k=>mapping[k]===txt);
    if(!key) return;
    if(key===todoFilter){
      b.setAttribute('aria-pressed','true');
      b.style.boxShadow='0 0 0 2px rgba(244,196,0,.55)';
    }else{
      b.setAttribute('aria-pressed','false');
      b.style.boxShadow='';
    }
  });
}

function addTodo(){
  const d=getData();
  if(!d){ alert('Taken konden niet worden geladen. Herlaad de app.'); return; }

  const title=byId('gioTodoTitle')?.value.trim() || '';
  if(!title){ alert('Vul eerst een taak in.'); byId('gioTodoTitle')?.focus(); return; }

  d.todos.unshift({
    id:'todo-'+Date.now()+'-'+Math.random().toString(36).slice(2,6),
    title,
    dueDate:byId('gioTodoDue')?.value || '',
    priority:byId('gioTodoPriority')?.value || 'Normaal',
    client:byId('gioTodoClient')?.value || '',
    project:byId('gioTodoProject')?.value || '',
    note:byId('gioTodoNote')?.value.trim() || '',
    status:'Open',
    createdAt:iso(),
    updatedAt:iso()
  });

  persist();
  if(byId('gioTodoTitle')) byId('gioTodoTitle').value='';
  if(byId('gioTodoNote')) byId('gioTodoNote').value='';
  todoFilter='open';
  renderTodos();
}

function mutateTodo(id, action){
  const d=getData(); if(!d) return;
  const t=d.todos.find(x=>String(x.id)===String(id));
  if(!t) return;

  if(action==='complete'){
    t.status='Klaar'; t.completedAt=iso(); t.updatedAt=iso();
  }else if(action==='reopen'){
    t.status='Open'; delete t.completedAt; t.updatedAt=iso();
  }else if(action==='edit'){
    const title=prompt('Taak:',t.title||'');
    if(title===null) return;
    const note=prompt('Notitie:',t.note||'');
    t.title=title.trim()||t.title;
    if(note!==null)t.note=note;
    t.updatedAt=iso();
  }else if(action==='delete'){
    if(!confirm('Deze taak verwijderen?')) return;
    d.todos=d.todos.filter(x=>String(x.id)!==String(id));
  }
  persist();
  renderTodos();
}

function renderAppointments(){
  const d=getData(); if(!d) return;
  const list=byId('gioAppointmentList'); if(!list) return;
  const rows=[...d.afspraken].sort((a,b)=>(clean(a.date)+clean(a.start)).localeCompare(clean(b.date)+clean(b.start)));
  list.innerHTML=rows.map(a=>`
    <div class="gioAppointmentRow">
      <div>
        <b>${esc(a.date)} · ${esc(a.start||'--:--')} ${a.end?'– '+esc(a.end):''}</b>
        <br>${esc(a.title||'Afspraak')} <small>· ${esc(a.type||'Afspraak')}</small>
        ${a.location?`<br><small>📍 ${esc(a.location)}</small>`:''}
      </div>
      <div class="gioTodoRowActions">
        <button type="button" data-appt-action="edit" data-id="${esc(a.id)}">✏️</button>
        <button type="button" class="del" data-appt-action="delete" data-id="${esc(a.id)}">🗑️</button>
      </div>
    </div>`).join('') || '<p>Nog geen afspraken.</p>';
}

function addAppointment(){
  const d=getData(); if(!d)return;
  const title=byId('gioAppointmentTitle')?.value.trim()||'';
  const date=byId('gioAppointmentDate')?.value||'';
  if(!title||!date){ alert('Vul onderwerp en datum in.'); return; }
  d.afspraken.push({
    id:'appt-'+Date.now(),
    title,date,
    start:byId('gioAppointmentStart')?.value||'',
    end:byId('gioAppointmentEnd')?.value||'',
    type:byId('gioAppointmentType')?.value||'Afspraak',
    client:byId('gioAppointmentClient')?.value||'',
    project:byId('gioAppointmentProject')?.value||'',
    location:byId('gioAppointmentLocation')?.value.trim()||'',
    reminderMinutes:Number(byId('gioAppointmentReminder')?.value)||0,
    note:byId('gioAppointmentNote')?.value.trim()||'',
    createdAt:iso(),updatedAt:iso()
  });
  persist();
  if(byId('gioAppointmentTitle'))byId('gioAppointmentTitle').value='';
  if(byId('gioAppointmentLocation'))byId('gioAppointmentLocation').value='';
  if(byId('gioAppointmentNote'))byId('gioAppointmentNote').value='';
  renderAppointments();
}

function mutateAppointment(id,action){
  const d=getData();if(!d)return;
  const a=d.afspraken.find(x=>String(x.id)===String(id));if(!a)return;
  if(action==='delete'){
    if(!confirm('Deze afspraak verwijderen?'))return;
    d.afspraken=d.afspraken.filter(x=>String(x.id)!==String(id));
  }else{
    const title=prompt('Onderwerp:',a.title||'');if(title===null)return;
    const loc=prompt('Locatie:',a.location||'');
    a.title=title.trim()||a.title;if(loc!==null)a.location=loc;a.updatedAt=iso();
  }
  persist();renderAppointments();
}

function bindButtons(){
  // Event delegation makes the four fixed buttons reliable even if inline onclick is broken.
  document.addEventListener('click', e=>{
    const b=e.target.closest('button');
    if(!b)return;

    if(b.closest('#todoafsprakenpro')){
      const text=(b.textContent||'').trim();

      if(/Taak/.test(text) && (text.includes('+') || text.includes('➕'))){
        e.preventDefault(); addTodo(); return;
      }
      if(text==='Open'){e.preventDefault();todoFilter='open';renderTodos();return}
      if(text==='Klaar'){e.preventDefault();todoFilter='done';renderTodos();return}
      if(text==='Alles'){e.preventDefault();todoFilter='all';renderTodos();return}

      const action=b.dataset.action;
      if(action){e.preventDefault();mutateTodo(b.dataset.id,action);return}

      if(/Afspraak opslaan/.test(text)){e.preventDefault();addAppointment();return}
      const aa=b.dataset.apptAction;
      if(aa){e.preventDefault();mutateAppointment(b.dataset.id,aa);return}
    }
  }, true);
}

function init(){
  const d=getData();
  if(!d){ setTimeout(init,500); return; }

  // Geen layout/menu injecteren: alleen bestaande module repareren.
  ensureTodoListContainer();
  fillSelectors();

  if(byId('gioTodoDue') && !byId('gioTodoDue').value) byId('gioTodoDue').value=today();
  if(byId('gioAppointmentDate') && !byId('gioAppointmentDate').value) byId('gioAppointmentDate').value=today();

  renderTodos();
  renderAppointments();
}

// Keep existing inline onclick API working too.
window.gioTodoAdd=addTodo;
window.gioTodoShow=f=>{todoFilter=f;renderTodos()};
window.gioTodoComplete=id=>mutateTodo(id,'complete');
window.gioTodoReopen=id=>mutateTodo(id,'reopen');
window.gioTodoEdit=id=>mutateTodo(id,'edit');
window.gioTodoDelete=id=>mutateTodo(id,'delete');
window.gioAppointmentAdd=addAppointment;
window.gioAppointmentEdit=id=>mutateAppointment(id,'edit');
window.gioAppointmentDelete=id=>mutateAppointment(id,'delete');
window.gioTodoAppointmentsInit=init;

bindButtons();

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',()=>setTimeout(init,400));
}else{
  setTimeout(init,400);
}
})();
