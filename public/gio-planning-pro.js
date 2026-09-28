(function(){
'use strict';

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[c]));

let activeTab = 'Week';

function ensure(){
  if(!window.data) return false;
  if(!Array.isArray(data.planning)) data.planning=[];
  if(!Array.isArray(data.vrijeDagen)) data.vrijeDagen=[];
  if(!Array.isArray(data.medewerkers)) data.medewerkers=[];
  if(!Array.isArray(data.projecten)) data.projecten=[];
  if(!Array.isArray(data.klanten)) data.klanten=[];

  data.planning.forEach(x=>{
    if(!x.id) x.id = uid();
    if(!Array.isArray(x.medewerkerIds)) x.medewerkerIds=[];
    if(!x.startdatum) x.startdatum=x.datum||'';
    if(!x.einddatum) x.einddatum=x.startdatum||x.datum||'';
    if(!x.status) x.status='Gepland';
    if(!Array.isArray(x.historie)) x.historie=[];
  });
  return true;
}

function uid(){
  return Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-5);
}
function today(){ return new Date().toISOString().slice(0,10); }
function addDays(s,n){
  const d=new Date((s||today())+'T12:00:00');
  d.setDate(d.getDate()+n);
  return d.toISOString().slice(0,10);
}
function fmt(d){
  if(!d) return '';
  const p=d.split('-');
  return p.length===3 ? `${p[2]}-${p[1]}-${p[0]}` : d;
}
function saveNow(){
  try{
    if(typeof window.save==='function') window.save();
  }catch(e){
    console.error('Planning opslaan mislukt',e);
  }
}
function fill(){
  if(!ensure()) return;
  const optionList=(arr,fn,first)=>{
    const values=[];
    arr.forEach(x=>{
      const v=String(fn(x)||'').trim();
      if(v && !values.includes(v)) values.push(v);
    });
    return `<option value="">${first}</option>`+
      values.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('');
  };

  const client=$('gioPlanClient'), project=$('gioPlanProject'), employees=$('gioPlanEmployees');
  if(client){
    const old=client.value;
    client.innerHTML=optionList(data.klanten,x=>x.naam||x.name||'','Geen klant');
    if([...client.options].some(o=>o.value===old)) client.value=old;
  }
  if(project){
    const old=project.value;
    project.innerHTML=optionList(data.projecten,x=>x.naam||x.project||'','Geen project');
    if([...project.options].some(o=>o.value===old)) project.value=old;
  }
  if(employees){
    employees.innerHTML=data.medewerkers.map(m=>`
      <label style="display:inline-flex;align-items:center;gap:6px;margin-right:12px;margin-bottom:8px">
        <input class="gioPlanEmpCheck" type="checkbox" value="${esc(m.id)}" style="width:auto">
        ${esc(m.naam||m.name||'Medewerker')}
      </label>`).join('') || '<small>Nog geen medewerkers toegevoegd.</small>';
  }
}

function inject(){
  if($('planningpro2')) return;
  const main=document.querySelector('main');
  if(!main) return;

  const s=document.createElement('section');
  s.id='planningpro2';
  s.className='page';
  s.innerHTML=`
    <div class="card">
      <h2>📅 Planning & Agenda PRO</h2>
      <div id="gioPlanTabs" class="gioPlanTabs"></div>
      <div id="gioPlanKpis" class="gioPlanKpis"></div>

      <div class="row">
        <div><label>Zoeken</label><input id="gioPlanSearch" oninput="gioRenderPlanningPro()"></div>
        <div><label>Van datum</label><input id="gioPlanFrom" type="date" onchange="gioRenderPlanningPro()"></div>
        <div><label>Status</label>
          <select id="gioPlanStatusFilter" onchange="gioRenderPlanningPro()">
            <option value="">Alle</option>
            <option>Gepland</option>
            <option>Bezig</option>
            <option>Klaar</option>
            <option>Uitgesteld</option>
          </select>
        </div>
      </div>

      <div class="gioPlanActions">
        <button class="btn" onclick="gioPlanNew()">+ Planning</button>
        <button class="btn2" onclick="gioFreeDayNew()">🏖️ Vrije dag</button>
      </div>

      <div id="gioPlanList"></div>
    </div>

    <div id="gioPlanForm" class="card" style="display:none">
      <h2 id="gioPlanFormTitle">Planning</h2>
      <input id="gioPlanId" type="hidden">

      <div class="row">
        <div><label>Klant</label><select id="gioPlanClient"></select></div>
        <div><label>Project</label><select id="gioPlanProject"></select></div>
        <div><label>Startdatum</label><input id="gioPlanStart" type="date"></div>
        <div><label>Einddatum</label><input id="gioPlanEnd" type="date"></div>
        <div><label>Starttijd</label><input id="gioPlanTimeStart" type="time"></div>
        <div><label>Eindtijd</label><input id="gioPlanTimeEnd" type="time"></div>
        <div><label>Status</label>
          <select id="gioPlanStatus">
            <option>Gepland</option>
            <option>Bezig</option>
            <option>Klaar</option>
            <option>Uitgesteld</option>
          </select>
        </div>
        <div><label>Adres</label><input id="gioPlanAddress"></div>
      </div>

      <label>Medewerkers / inhuur</label>
      <div id="gioPlanEmployees"></div>

      <label>Notitie</label>
      <textarea id="gioPlanNote"></textarea>

      <div class="gioPlanActions">
        <button class="btn" onclick="gioPlanSave()">Opslaan</button>
        <button class="btn2" onclick="gioPlanClose()">Sluiten</button>
      </div>
    </div>

    <div id="gioFreeDayForm" class="card" style="display:none">
      <h2>🏖️ Vrije dag / blokkade</h2>
      <div class="row">
        <div><label>Van</label><input id="gioFreeStart" type="date"></div>
        <div><label>Tot</label><input id="gioFreeEnd" type="date"></div>
        <div><label>Reden</label><input id="gioFreeReason"></div>
      </div>
      <button class="btn" onclick="gioFreeDaySave()">Opslaan</button>
    </div>`;

  main.appendChild(s);

  const nav=document.querySelector('aside nav');
  if(nav && ![...nav.querySelectorAll('button')].some(b=>b.textContent.includes('Planning & Agenda PRO'))){
    const b=document.createElement('button');
    b.textContent='📅 Planning & Agenda PRO';
    b.onclick=()=>{ show?.('planningpro2',b); window.gioPlanningProInit?.(); };
    nav.appendChild(b);
  }
}

function tabs(){
  const box=$('gioPlanTabs');
  if(!box) return;
  const a=['Vandaag','Week','Volgende week','Alles'];
  box.innerHTML=a.map(x=>`<button class="btn2 ${activeTab===x?'active':''}" onclick="gioPlanSetTab('${x}')">${x}</button>`).join('');
}
window.gioPlanSetTab=t=>{
  activeTab=t;
  tabs();
  window.gioRenderPlanningPro?.();
};

function tabRange(){
  const td=today();
  const d=new Date(td+'T12:00:00');
  const day=(d.getDay()+6)%7;
  const monday=addDays(td,-day);
  if(activeTab==='Vandaag') return [td,td];
  if(activeTab==='Week') return [monday,addDays(monday,6)];
  if(activeTab==='Volgende week') return [addDays(monday,7),addDays(monday,13)];
  return ['', ''];
}
function inTab(x){
  if(activeTab==='Alles') return true;
  const s=x.startdatum||x.datum||'';
  const e=x.einddatum||s;
  const [from,to]=tabRange();
  return !!s && e>=from && s<=to;
}
function planDays(x){
  const s=x.startdatum||x.datum||'';
  const e=x.einddatum||s;
  if(!s||!e) return 1;
  return Math.max(1,Math.round((new Date(e+'T12:00:00')-new Date(s+'T12:00:00'))/86400000)+1);
}

window.gioRenderPlanningPro=()=>{
  if(!ensure()) return;
  tabs();

  const list=$('gioPlanList'), kpis=$('gioPlanKpis');
  if(!list||!kpis) return;

  const q=($('gioPlanSearch')?.value||'').toLowerCase().trim();
  const from=$('gioPlanFrom')?.value||'';
  const sf=$('gioPlanStatusFilter')?.value||'';
  const td=today();

  const rows=data.planning.filter(x=>{
    const end=x.einddatum||x.startdatum||x.datum||'';
    const hay=[x.klant,x.project,x.notitie,x.adres,x.status].join(' ').toLowerCase();
    return inTab(x) && (!from||end>=from) && (!sf||x.status===sf) && (!q||hay.includes(q));
  }).sort((a,b)=>{
    const aa=String(a.startdatum||a.datum||'9999-12-31')+String(a.starttijd||'');
    const bb=String(b.startdatum||b.datum||'9999-12-31')+String(b.starttijd||'');
    return aa.localeCompare(bb);
  });

  const todayCount=data.planning.filter(x=>{
    const s=x.startdatum||x.datum||'', e=x.einddatum||s;
    return s<=td&&e>=td;
  }).length;
  const overdue=data.planning.filter(x=>{
    const e=x.einddatum||x.startdatum||x.datum||'';
    return e<td && x.status!=='Klaar';
  }).length;
  const upcoming=data.planning.filter(x=>{
    const s=x.startdatum||x.datum||'';
    return s>td&&s<=addDays(td,7);
  }).length;

  kpis.innerHTML=`
    <div class="gioPlanKpi"><small>Vandaag</small><b>${todayCount}</b></div>
    <div class="gioPlanKpi"><small>Komende 7 dagen</small><b>${upcoming}</b></div>
    <div class="gioPlanKpi"><small>Te laat</small><b>${overdue}</b></div>
    <div class="gioPlanKpi"><small>Totaal planning</small><b>${data.planning.length}</b></div>`;

  const planHtml=rows.map(x=>{
    const s=x.startdatum||x.datum||'', e=x.einddatum||s;
    const isOverdue=e<td&&x.status!=='Klaar';
    const isToday=s<=td&&e>=td;
    const people=(x.medewerkerIds||[])
      .map(id=>data.medewerkers.find(m=>String(m.id)===String(id)))
      .filter(Boolean);
    const days=planDays(x);

    return `
      <article class="gioPlanCard ${isOverdue?'overdue':isToday?'today':''}">
        <div>
          <b>${esc(x.klant||'-')} — ${esc(x.project||'-')}</b><br>
          <small>${fmt(s)}${e!==s?' t/m '+fmt(e):''} • ${days} dag${days===1?'':'en'} ${x.starttijd?'• '+esc(x.starttijd):''} ${x.eindtijd?'– '+esc(x.eindtijd):''}</small>
        </div>

        <div class="gioPlanPeople">
          ${people.map(m=>`<span class="gioPlanPerson">👤 ${esc(m.naam||m.name||'Medewerker')}</span>`).join('')}
        </div>

        <div>
          <small>${esc(x.status||'Gepland')} ${isOverdue?'• TE LAAT':''}</small>
          ${x.notitie?`<br><small>${esc(x.notitie)}</small>`:''}
        </div>

        <div class="gioPlanActions">
          <button type="button" onclick="gioPlanEdit('${x.id}')">✏️</button>
          <button type="button" onclick="gioPlanShare('${x.id}')">💬 Werklink</button>
          <button type="button" onclick="gioPlanOpenProject('${x.id}')">📋 Project</button>
          <button type="button" class="del" onclick="gioPlanDelete('${x.id}')">🗑️</button>
        </div>
      </article>`;
  }).join('');

  const freeHtml=data.vrijeDagen.filter(v=>{
    if(activeTab==='Alles') return true;
    const s=v.start||'',e=v.eind||s,[a,b]=tabRange();
    return s&&e>=a&&s<=b;
  }).map(v=>`
    <article class="gioPlanCard gioPlanFree">
      <b>🏖️ Vrij / geblokkeerd</b><br>
      <small>${fmt(v.start)}${v.eind&&v.eind!==v.start?' t/m '+fmt(v.eind):''} • ${esc(v.reden||'')}</small>
      <div class="gioPlanActions"><button type="button" class="del" onclick="gioFreeDayDelete('${v.id}')">🗑️</button></div>
    </article>`).join('');

  list.innerHTML=planHtml+freeHtml || '<p>Geen planning gevonden.</p>';
};

window.gioPlanNew=()=>{
  ensure(); fill();
  $('gioPlanId').value='';
  $('gioPlanFormTitle').textContent='Planning toevoegen';
  $('gioPlanClient').value='';
  $('gioPlanProject').value='';
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
window.gioPlanClose=()=>{ if($('gioPlanForm')) $('gioPlanForm').style.display='none'; };

window.gioPlanSave=()=>{
  if(!ensure()) return;

  const s=$('gioPlanStart')?.value||'';
  const e=$('gioPlanEnd')?.value||s;
  if(!s){ alert('Kies startdatum'); return; }
  if(e<s){ alert('Einddatum mag niet voor startdatum liggen'); return; }

  const st=$('gioPlanTimeStart')?.value||'';
  const et=$('gioPlanTimeEnd')?.value||'';
  if(s===e && st && et && et<st){
    alert('Eindtijd mag op dezelfde dag niet vóór de starttijd liggen.');
    return;
  }

  const id=$('gioPlanId')?.value||uid();
  const old=data.planning.find(x=>String(x.id)===String(id));

  const item={
    ...(old||{}),
    id,
    klant:$('gioPlanClient')?.value||'',
    project:$('gioPlanProject')?.value||'',
    startdatum:s,
    einddatum:e,
    datum:s,
    starttijd:st,
    eindtijd:et,
    status:$('gioPlanStatus')?.value||'Gepland',
    adres:$('gioPlanAddress')?.value.trim()||'',
    notitie:$('gioPlanNote')?.value.trim()||'',
    medewerkerIds:[...document.querySelectorAll('.gioPlanEmpCheck:checked')].map(x=>x.value),
    historie:[...(old?.historie||[])]
  };

  item.historie.unshift({
    tijd:new Date().toISOString(),
    actie:old?'Planning gewijzigd':'Planning toegevoegd'
  });

  const i=data.planning.findIndex(x=>String(x.id)===String(id));
  if(i>=0) data.planning.splice(i,1,item);
  else data.planning.unshift(item);

  saveNow();
  window.render?.();
  window.renderGioDashboardAgenda?.();
  window.gioRenderPlanningPro?.();
  window.gioPlanClose?.();
};

window.gioPlanEdit=id=>{
  const x=data.planning.find(v=>String(v.id)===String(id));
  if(!x) return;

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

  const ids=(x.medewerkerIds||[]).map(String);
  document.querySelectorAll('.gioPlanEmpCheck').forEach(c=>c.checked=ids.includes(String(c.value)));

  $('gioPlanForm').style.display='block';
  $('gioPlanForm').scrollIntoView({behavior:'smooth',block:'start'});
};

window.gioPlanDelete=id=>{
  if(!confirm('Planning verwijderen?')) return;
  data.planning=data.planning.filter(x=>String(x.id)!==String(id));
  saveNow();
  window.render?.();
  window.renderGioDashboardAgenda?.();
  window.gioRenderPlanningPro?.();
};

window.gioPlanShare=id=>{
  const x=data.planning.find(v=>String(v.id)===String(id));
  if(!x) return;
  const ids=x.medewerkerIds||[];
  if(!ids.length){ alert('Koppel eerst een medewerker aan deze planning.'); return; }

  const m=data.medewerkers.find(v=>String(v.id)===String(ids[0]));
  if(!m) return;

  const personnel=[...document.querySelectorAll('aside nav button')]
    .find(b=>b.textContent.includes('Personeelscentrum'));

  if(typeof window.show==='function'&&$('personeelscentrum')){
    window.show('personeelscentrum',personnel||document.querySelector('aside nav button'));
  }
  window.gioPersonnelInit?.();

  setTimeout(()=>{
    window.gioOpenWorkLink?.(m.id);
    if($('gioWorkProject')) $('gioWorkProject').value=x.project||'';
    if($('gioWorkClient')) $('gioWorkClient').value=x.klant||'';
    if($('gioWorkDate')) $('gioWorkDate').value=x.startdatum||x.datum||'';
    if($('gioWorkAddress')) $('gioWorkAddress').value=x.adres||'';
  },100);
};

window.gioPlanOpenProject=id=>{
  const x=data.planning.find(v=>String(v.id)===String(id));
  if(!x) return;

  const b=[...document.querySelectorAll('aside nav button')]
    .find(v=>v.textContent.includes('Projectkaart'));

  if(typeof window.show==='function'&&$('projectkaartpro')){
    window.show('projectkaartpro',b||document.querySelector('aside nav button'));
  }
  if($('proProjectSelect')){
    $('proProjectSelect').value=x.project||'';
    window.renderProjectkaartPro?.();
    window.gioRenderProjectDossier?.();
  }
};

window.gioFreeDayNew=()=>{
  $('gioFreeStart').value=today();
  $('gioFreeEnd').value=today();
  $('gioFreeReason').value='';
  $('gioFreeDayForm').style.display='block';
  $('gioFreeDayForm').scrollIntoView({behavior:'smooth',block:'start'});
};

window.gioFreeDaySave=()=>{
  if(!ensure()) return;
  const s=$('gioFreeStart')?.value||'';
  const e=$('gioFreeEnd')?.value||s;
  if(!s){ alert('Kies startdatum'); return; }
  if(e<s){ alert('Einddatum mag niet voor startdatum liggen'); return; }

  data.vrijeDagen.unshift({
    id:uid(),
    start:s,
    eind:e,
    reden:$('gioFreeReason')?.value.trim()||''
  });

  saveNow();
  $('gioFreeDayForm').style.display='none';
  window.gioRenderPlanningPro?.();
};

window.gioFreeDayDelete=id=>{
  if(!confirm('Vrije dag / blokkade verwijderen?')) return;
  data.vrijeDagen=data.vrijeDagen.filter(x=>String(x.id)!==String(id));
  saveNow();
  window.gioRenderPlanningPro?.();
};

window.gioPlanningProInit=()=>{
  if(!ensure()) return;
  inject();
  fill();
  tabs();
  window.gioRenderPlanningPro?.();
};

function patchMenus(){
  if(window.gioOpenMoreOverlay && !window.gioOpenMoreOverlay.__plan042){
    const old=window.gioOpenMoreOverlay;
    window.gioOpenMoreOverlay=function(){
      const r=old.apply(this,arguments);
      setTimeout(()=>{
        const g=document.querySelector('#gioOverlayBody .gioOverlayGrid');
        if(g && ![...g.querySelectorAll('button')].some(b=>(b.textContent||'').includes('Planning & Agenda PRO'))){
          g.insertAdjacentHTML('beforeend',
            `<button onclick="gioApprovedGo('planningpro2');gioPlanningProInit()"><i>📅</i>Planning & Agenda PRO</button>`);
        }
      },0);
      return r;
    };
    window.gioOpenMoreOverlay.__plan042=true;
  }
}

function hookBaseRender(){
  if(typeof window.render==='function' && !window.render.__plan042){
    const old=window.render;
    window.render=function(){
      const r=old.apply(this,arguments);
      setTimeout(()=>window.gioRenderPlanningPro?.(),0);
      return r;
    };
    window.render.__plan042=true;
  }
}

function init(){
  if(!ensure()){ setTimeout(init,150); return; }
  inject();
  patchMenus();
  hookBaseRender();
  window.gioPlanningProInit?.();
  document.title='GIO Business Planner PRO — DEV 042';
  try{localStorage.setItem('gioMobileBuild','DEV 042 - PLANNING STABLE')}catch(e){}
}

document.readyState==='loading'
  ? document.addEventListener('DOMContentLoaded',()=>setTimeout(init,900))
  : setTimeout(init,900);
})();