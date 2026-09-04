/* GIO Mobile Approved PATCH 002
   Bouwt alleen een mobiele presentatielaag boven bestaande functies/data. */
(function(){
  'use strict';
  if(!window.matchMedia('(max-width:800px)').matches) return;

  const pageMap = [
    ['🏠','Vandaag','dashboard'],
    ['📅','Planning','planning'],
    ['📁','Projecten','projecten'],
    ['📝','Werkboek','werkboek'],
    ['☰','Meer','__more']
  ];

  function esc(s){
    return String(s ?? '').replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
  }

  function findDesktopButton(id){
    return [...document.querySelectorAll('aside nav button')]
      .find(b => (b.getAttribute('onclick') || '').includes("'" + id + "'"));
  }

  function go(id){
    if(id === '__more'){ openMore(); return; }
    const btn = findDesktopButton(id);
    if(typeof window.show === 'function' && document.getElementById(id)){
      window.show(id, btn || document.querySelector('aside nav button'));
    }
    document.querySelectorAll('#gioBottomDock button').forEach(b => {
      b.classList.toggle('active', b.dataset.mobilePage === id);
    });
    if(id === 'werkboek'){
      window.gioFillWerkboekSelects?.();
      window.gioRenderWerkboek?.();
    }
    if(id === 'voorraad') window.gioRenderVoorraad?.();
    if(id === 'medewerkers'){
      window.gioFillMedewerkerProjecten?.();
      window.gioRenderMedewerkers?.();
    }
    if(id === 'uitgaven') window.gioKmFillSavedLocationSelects?.();
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function navButton(icon,label,id){
    return `<button type="button" data-mobile-page="${id}" onclick="gioApprovedGo('${id}')">${icon}<span>${label}</span></button>`;
  }

  function menuButton(icon,label,id,klass=''){
    return `<button type="button" class="${klass}" onclick="gioApprovedGo('${id}')"><i>${icon}</i>${label}</button>`;
  }

  function ensureBottomNav(){
    let dock = document.getElementById('gioBottomDock');
    if(!dock){
      dock = document.createElement('div');
      dock.id = 'gioBottomDock';
      document.body.appendChild(dock);
    }
    dock.innerHTML = pageMap.map(([i,l,id]) => navButton(i,l,id)).join('');
    dock.querySelector('[data-mobile-page="dashboard"]')?.classList.add('active');
  }

  function ensureHero(){
    if(document.getElementById('gioMobileHero')) return;
    const dashboard = document.getElementById('dashboard');
    if(!dashboard) return;
    const hero = document.createElement('div');
    hero.id = 'gioMobileHero';
    hero.innerHTML = `
      <h2>Goedemorgen Gio 👋</h2>
      <p id="gioApprovedDate"></p>
      <div class="gioHeroActions">
        <button type="button" onclick="gioApprovedGo('uren')">▶ Start werk</button>
        <button type="button" onclick="gioApprovedOpenQuick()">＋ Snel toevoegen</button>
      </div>`;
    dashboard.prepend(hero);
    const d = new Date();
    const date = document.getElementById('gioApprovedDate');
    if(date) date.textContent = d.toLocaleDateString('nl-NL',{
      weekday:'long',day:'numeric',month:'long',year:'numeric'
    });
  }

  function ensureOverlay(){
    if(document.getElementById('gioMobileOverlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'gioMobileOverlay';
    overlay.className = 'gioMobileOverlay';
    overlay.innerHTML = `
      <div class="gioMobileSheet">
        <div class="gioSheetHandle"></div>
        <div class="gioSheetHead">
          <b id="gioOverlayTitle">Meer</b>
          <button type="button" onclick="gioApprovedClose()">✕</button>
        </div>
        <div id="gioOverlayBody"></div>
      </div>`;
    overlay.addEventListener('click',e=>{if(e.target===overlay) gioApprovedClose();});
    document.body.appendChild(overlay);
  }

  function openOverlay(title,html){
    ensureOverlay();
    document.getElementById('gioOverlayTitle').textContent = title;
    document.getElementById('gioOverlayBody').innerHTML = html;
    document.getElementById('gioMobileOverlay').classList.add('open');
  }

  function openMore(){
    openOverlay('Alle functies',`<div class="gioOverlayGrid">
      ${menuButton('👥','Klantenboek','klanten')}
      ${menuButton('👷','Medewerkers / Inhuur','medewerkers')}
      ${menuButton('⏱️','Uren','uren')}
      ${menuButton('🚗','KM / Reisuren','uitgaven','gioGreen')}
      ${menuButton('🧰','Materialen','materiaal')}
      ${menuButton('📦','Voorraad PRO','voorraad')}
      ${menuButton('📁','Projectkaart PRO','projectkaartpro')}
      ${menuButton('💸','Uitgaven / Investeren','uitgaven')}
      ${menuButton('💳','Betalingen','betalingen')}
      ${menuButton('📄','Offertes','offertes')}
      ${menuButton('🧾','Facturen','facturatiepro')}
      ${menuButton('☁️','Cloud & synchronisatie','cloud','gioPrimary')}
      ${menuButton('💾','Back-up / Export','export')}
      ${menuButton('📈','Balans / Analyse','rapport')}
      ${menuButton('📦','Projectarchief','archief')}
      ${menuButton('🏖️','Vrije dagen','vrijedagen')}
      ${menuButton('⚙️','Instellingen / Thema','instellingen')}
    </div>`);
  }

  function openQuick(){
    openOverlay('Snel toevoegen',`<div class="gioOverlayGrid">
      ${menuButton('▶️','Inklokken','uren','gioPrimary')}
      ${menuButton('📝','Notitie','werkboek')}
      ${menuButton('🚗','KM / Reisuren','uitgaven','gioGreen')}
      ${menuButton('🧰','Materiaal','materiaal')}
      ${menuButton('💸','Uitgave','uitgaven')}
      ${menuButton('👤','Nieuwe klant','klanten')}
      ${menuButton('📁','Nieuw project','projecten')}
      ${menuButton('📦','Voorraad','voorraad')}
      ${menuButton('☁️','Synchroniseren','cloud')}
    </div>`);
  }

  function close(){
    document.getElementById('gioMobileOverlay')?.classList.remove('open');
  }

  function ensureFab(){
    let fab = document.getElementById('gioMobileFab');
    if(!fab){
      fab=document.createElement('button');
      fab.id='gioMobileFab';
      fab.type='button';
      fab.textContent='＋';
      document.body.appendChild(fab);
    }
    fab.onclick=openQuick;
  }

  function removeEmptyAgendaBlocks(){
    document.querySelectorAll('#gioDashboardAgenda .gioAgendaDay').forEach(day=>{
      const meaningful = day.querySelector('.gioEvent') || day.textContent.trim().length > 12;
      if(!meaningful) day.remove();
    });
  }

  function init(){
    document.documentElement.dataset.gioMobileApproved='001';
    ensureBottomNav();
    ensureHero();
    ensureOverlay();
    ensureFab();
    removeEmptyAgendaBlocks();

    window.gioApprovedGo = id => { close(); go(id); };
    window.gioApprovedOpenQuick = openQuick;
    window.gioApprovedClose = close;

    /* Bestaande functies blijven intact; alleen mobiele menu-functies worden doorgestuurd. */
    window.gioOpenMoreOverlay = openMore;
    window.gioToggleQuickOverlay = openQuick;
    window.gioCloseMobileOverlay = close;

    const observer = new MutationObserver(()=>removeEmptyAgendaBlocks());
    observer.observe(document.body,{subtree:true,childList:true});

    document.title='GIO Business Planner PRO — MOBILE DEV 002';
    try{localStorage.setItem('gioMobileBuild','MOBILE DEV 002');}catch(_){}
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',()=>setTimeout(init,50));
  }else{
    setTimeout(init,50);
  }
})();


(function(){
'use strict';
let photoData='', pendingCerts=[];
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function ensure(){if(!window.data)return false;if(!Array.isArray(data.medewerkers))data.medewerkers=[];return true}
function days(date){if(!date)return null;const a=new Date(date+'T12:00:00'),b=new Date();b.setHours(12,0,0,0);return Math.ceil((a-b)/86400000)}
function state(c){const d=days(c.vervaldatum);if(d===null)return['','Geen vervaldatum'];if(d<0)return['expired','Verlopen '+Math.abs(d)+' dag(en)'];if(d<=30)return['expiring','Verloopt over '+d+' dag(en)'];return['','Geldig tot '+new Date(c.vervaldatum+'T12:00:00').toLocaleDateString('nl-NL')]}
function addTypes(){const s=$('medType');if(!s)return;['Stagiair','Vakantiekracht'].forEach(v=>{if(![...s.options].some(o=>o.value===v)){const o=document.createElement('option');o.value=v;o.textContent=v;s.appendChild(o)}})}
function inject(){
 const sec=$('medewerkers');if(!sec||$('gioEmployeeProFields'))return;
 const card=sec.querySelector('.card');if(!card)return;
 const box=document.createElement('div');box.id='gioEmployeeProFields';box.className='card';
 box.innerHTML=`<h2>👤 Profiel en certificaten</h2>
 <div class="gioEmployeeProfile"><div id="medFotoPreview" class="gioEmployeeAvatarPlaceholder">👤</div><div style="flex:1"><label>Profielfoto</label><input id="medFoto" type="file" accept="image/*" onchange="gioMedFoto(event)"></div></div>
 <div class="row"><div><label>Functie / vakgebied</label><input id="medFunctie"></div><div><label>Startdatum</label><input id="medStartdatum" type="date"></div><div><label>Einddatum contract/stage</label><input id="medEinddatum" type="date"></div><div><label style="display:flex;align-items:center;gap:10px;margin-top:10px;font-weight:700"><input id="medOnbepaaldeTijd" type="checkbox" style="width:auto"> Onbepaalde tijd</label></div></div>
 <h3>Certificaat toevoegen</h3>
 <div class="row"><div><label>Naam</label><input id="medCertNaam" placeholder="VCA, BHV, hoogwerker"></div><div><label>Nummer</label><input id="medCertNummer"></div><div><label>Behaald op</label><input id="medCertDatum" type="date"></div><div><label>Vervaldatum</label><input id="medCertVerval" type="date"></div><div><label>Herinnering</label><select id="medCertHerinnering"><option value="7">7 dagen</option><option value="14">14 dagen</option><option value="30" selected>30 dagen</option><option value="60">60 dagen</option><option value="90">90 dagen</option></select></div><div><label>Foto/PDF</label><input id="medCertBestand" type="file" accept="image/*,.pdf"></div></div>
 <button type="button" class="btn2" onclick="gioMedCertAdd()">＋ Certificaat toevoegen</button><div id="medCertLijst" class="gioCertificateList"></div>`;
 card.insertAdjacentElement('afterend',box);renderCerts();
}
function renderCerts(){const b=$('medCertLijst');if(!b)return;b.innerHTML=pendingCerts.length?pendingCerts.map((c,i)=>{const [cl,lab]=state(c);return `<div class="gioCertificateCard ${cl}"><b>${esc(c.naam)}</b> <span class="gioCertificateBadge ${cl==='expired'?'danger':cl==='expiring'?'warn':''}">${esc(lab)}</span><br><button class="del" onclick="gioMedCertDel(${i})">🗑️</button></div>`}).join(''):'<small>Nog geen certificaten toegevoegd.</small>'}
window.gioMedFoto=e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{photoData=r.result;$('medFotoPreview').innerHTML=`<img class="gioEmployeeAvatar" src="${photoData}">`};r.readAsDataURL(f)};
window.gioMedCertAdd=()=>{const naam=$('medCertNaam').value.trim();if(!naam){alert('Vul certificaatnaam in');return}const f=$('medCertBestand').files?.[0];const done=(bestand='')=>{pendingCerts.push({id:String(Date.now()+Math.random()),naam,nummer:$('medCertNummer').value.trim(),datum:$('medCertDatum').value,vervaldatum:$('medCertVerval').value,herinnering:+$('medCertHerinnering').value||30,bestand,bestandNaam:f?.name||''});['medCertNaam','medCertNummer','medCertDatum','medCertVerval'].forEach(id=>$(id).value='');$('medCertBestand').value='';renderCerts()};if(f){const r=new FileReader();r.onload=()=>done(r.result);r.readAsDataURL(f)}else done()};
window.gioMedCertDel=i=>{pendingCerts.splice(i,1);renderCerts()};
function load(x={}){photoData=x.foto||'';$('medFotoPreview').innerHTML=photoData?`<img class="gioEmployeeAvatar" src="${photoData}">`:'👤';$('medFunctie').value=x.functie||'';$('medStartdatum').value=x.startdatum||'';if($('medOnbepaaldeTijd'))$('medOnbepaaldeTijd').checked=!!x.onbepaaldeTijd;if($('medEinddatum')){$('medEinddatum').value=x.onbepaaldeTijd?'':(x.einddatum||'');$('medEinddatum').disabled=!!x.onbepaaldeTijd}pendingCerts=[...(x.certificaten||[])];renderCerts()}
function alarms(){if(!ensure())return;const arr=[];data.medewerkers.forEach(m=>(m.certificaten||[]).forEach(c=>{const d=days(c.vervaldatum),r=+c.herinnering||30;if(d!==null&&d<=r)arr.push({m,c,d})}));let b=$('gioEmployeeReminderBanner');if(!b){b=document.createElement('div');b.id='gioEmployeeReminderBanner';$('medewerkers')?.prepend(b)}if(!b)return;b.innerHTML=arr.length?`<div class="gioEmployeeAlarm ${arr.some(x=>x.d<0)?'danger':''}">🔔 ${arr.length} certificaat-herinnering(en)${arr.some(x=>x.d<0)?' • verlopen certificaten aanwezig':''}</div>`:''}
function wrap(){
 const saveOld=window.gioMedewerkerOpslaan;
 if(typeof saveOld==='function'&&!saveOld.__pro2){window.gioMedewerkerOpslaan=function(){const id=$('medEditId')?.value||'';const old=(data.medewerkers||[]).find(x=>String(x.id)===String(id));saveOld();const saved=id?(data.medewerkers||[]).find(x=>String(x.id)===String(id)):(data.medewerkers||[])[0];if(saved){saved.foto=photoData||(old?.foto||'');saved.functie=$('medFunctie')?.value.trim()||'';saved.startdatum=$('medStartdatum')?.value||'';saved.einddatum=$('medEinddatum')?.value||'';saved.onbepaaldeTijd=!!$('medOnbepaaldeTijd')?.checked;if(saved.onbepaaldeTijd)saved.einddatum='';saved.certificaten=pendingCerts.length?pendingCerts:(old?.certificaten||[]);window.save?.();window.gioRenderMedewerkers?.()}load({})};window.gioMedewerkerOpslaan.__pro2=true}
 const editOld=window.gioMedewerkerBewerk;
 if(typeof editOld==='function'&&!editOld.__pro2){window.gioMedewerkerBewerk=function(id){editOld(id);load((data.medewerkers||[]).find(x=>String(x.id)===String(id))||{})};window.gioMedewerkerBewerk.__pro2=true}
 const renderOld=window.gioRenderMedewerkers;
 if(typeof renderOld==='function'&&!renderOld.__pro2){window.gioRenderMedewerkers=function(){renderOld();alarms()};window.gioRenderMedewerkers.__pro2=true}
}
function ensureDesktopWorkerNav(){
 if(window.matchMedia('(max-width:800px)').matches)return;
 const nav=document.querySelector('aside nav');
 if(!nav||[...nav.querySelectorAll('button')].some(b=>(b.textContent||'').includes('Medewerkers / Inhuur')))return;
 const b=document.createElement('button');
 b.type='button';
 b.textContent='👷 Medewerkers / Inhuur';
 b.onclick=()=>{if(typeof window.show==='function')window.show('medewerkers',b);window.gioRenderMedewerkers?.();window.gioRenderPeople?.();};
 nav.appendChild(b);
}
function init(){addTypes();inject();ensureDesktopWorkerNav();if($('medOnbepaaldeTijd')){$('medOnbepaaldeTijd').addEventListener('change',()=>{const on=$('medOnbepaaldeTijd').checked;if($('medEinddatum')){if(on)$('medEinddatum').value='';$('medEinddatum').disabled=on}})}wrap();alarms();document.title='GIO Business Planner PRO — MOBILE DEV 040 / DESKTOP PERSONEEL';try{localStorage.setItem('gioMobileBuild','MOBILE DEV 040 / DESKTOP PERSONEEL')}catch(e){}}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',()=>setTimeout(init,150)):setTimeout(init,150);
})();


/* === DEV 041: To-do & Afspraken PRO zichtbaar en bereikbaar === */
(function(){
'use strict';
const $=id=>document.getElementById(id);

function injectTodoPage(){
  if($('todoafsprakenpro')) return;
  const main=document.querySelector('main');
  if(!main) return;

  const sec=document.createElement('section');
  sec.id='todoafsprakenpro';
  sec.className='page';
  sec.innerHTML=`
    <div class="card dark">
      <h2>✅ To-do & Afspraken PRO</h2>
      <p>Taken, deadlines en afspraken op één plek. Dezelfde gegevens op mobiel en desktop.</p>
    </div>

    <div class="card">
      <h2>✅ To-do / Taken</h2>
      <div id="gioTodoKpis" class="gioMiniKpis"></div>

      <div class="row">
        <div><label>Taak</label><input id="gioTodoTitle" placeholder="Bijv. materiaal bestellen"></div>
        <div><label>Deadline</label><input id="gioTodoDue" type="date"></div>
        <div><label>Prioriteit</label>
          <select id="gioTodoPriority">
            <option>Laag</option>
            <option selected>Normaal</option>
            <option>Hoog</option>
            <option>Urgent</option>
          </select>
        </div>
        <div><label>Klant</label><select id="gioTodoClient"><option value="">Niet gekoppeld</option></select></div>
        <div><label>Project</label><select id="gioTodoProject"><option value="">Niet gekoppeld</option></select></div>
      </div>

      <label>Notitie</label>
      <textarea id="gioTodoNote" placeholder="Extra informatie..."></textarea>

      <div class="gioTodoActions">
        <button type="button" class="btn">+ Taak</button>
        <button type="button" class="btn2">Open</button>
        <button type="button" class="btn2">Klaar</button>
        <button type="button" class="btn2">Alles</button>
      </div>
      <div id="gioTodoList"></div>
    </div>

    <div class="card">
      <h2>📅 Afspraken</h2>
      <div class="row">
        <div><label>Onderwerp</label><input id="gioAppointmentTitle" placeholder="Bijv. opname klant"></div>
        <div><label>Datum</label><input id="gioAppointmentDate" type="date"></div>
        <div><label>Start</label><input id="gioAppointmentStart" type="time"></div>
        <div><label>Einde</label><input id="gioAppointmentEnd" type="time"></div>
        <div><label>Type</label>
          <select id="gioAppointmentType">
            <option>Afspraak</option>
            <option>Opname</option>
            <option>Werk</option>
            <option>Levering</option>
            <option>Privé</option>
          </select>
        </div>
        <div><label>Klant</label><select id="gioAppointmentClient"><option value="">Niet gekoppeld</option></select></div>
        <div><label>Project</label><select id="gioAppointmentProject"><option value="">Niet gekoppeld</option></select></div>
        <div><label>Locatie</label><input id="gioAppointmentLocation" placeholder="Adres / locatie"></div>
        <div><label>Herinnering</label>
          <select id="gioAppointmentReminder">
            <option value="0">Geen</option>
            <option value="15">15 minuten</option>
            <option value="30">30 minuten</option>
            <option value="60">1 uur</option>
            <option value="1440">1 dag</option>
          </select>
        </div>
      </div>

      <label>Notitie</label>
      <textarea id="gioAppointmentNote" placeholder="Extra informatie..."></textarea>
      <button type="button" class="btn">💾 Afspraak opslaan</button>
      <div id="gioAppointmentList" style="margin-top:14px"></div>
    </div>`;
  main.appendChild(sec);
}

function ensureTodoNav(){
  const nav=document.querySelector('aside nav');
  if(!nav) return;
  if([...nav.querySelectorAll('button')].some(b=>(b.textContent||'').includes('To-do & Afspraken'))) return;

  const b=document.createElement('button');
  b.type='button';
  b.textContent='✅ To-do & Afspraken';
  b.onclick=()=>{
    if(typeof window.show==='function') window.show('todoafsprakenpro',b);
    window.gioTodoAppointmentsInit?.();
  };
  nav.appendChild(b);
}

function ensureMobileTodoMenu(){
  if(!window.matchMedia('(max-width:800px)').matches) return;
  const body=$('gioOverlayBody');
  if(!body || body.querySelector('[data-gio-todo-menu]')) return;
  const grid=body.querySelector('.gioOverlayGrid');
  if(!grid) return;

  const b=document.createElement('button');
  b.type='button';
  b.dataset.gioTodoMenu='1';
  b.innerHTML='<i>✅</i>To-do & Afspraken';
  b.onclick=()=>{
    document.getElementById('gioMobileOverlay')?.classList.remove('open');
    const fake=[...document.querySelectorAll('aside nav button')]
      .find(x=>(x.textContent||'').includes('To-do & Afspraken'));
    if(typeof window.show==='function') window.show('todoafsprakenpro',fake||document.querySelector('aside nav button'));
    window.gioTodoAppointmentsInit?.();
    window.scrollTo({top:0,behavior:'smooth'});
  };
  grid.appendChild(b);
}

function init(){
  injectTodoPage();
  ensureTodoNav();

  setTimeout(()=>window.gioTodoAppointmentsInit?.(),500);

  const observer=new MutationObserver(()=>{
    injectTodoPage();
    ensureTodoNav();
    ensureMobileTodoMenu();
  });
  observer.observe(document.body,{childList:true,subtree:true});

  document.title='GIO Business Planner PRO — DEV 041';
  try{localStorage.setItem('gioMobileBuild','DEV 041 - TODO PRO')}catch(e){}
}

document.readyState==='loading'
  ? document.addEventListener('DOMContentLoaded',()=>setTimeout(init,250))
  : setTimeout(init,250);
})();

/* DEV 045 - Agenda week definitief leesbaar */
(function(){
'use strict';

function mondayOfCurrentWeek(){
  const now=new Date();
  now.setHours(12,0,0,0);
  const day=(now.getDay()+6)%7;
  now.setDate(now.getDate()-day);
  return now;
}

function installStyle(){
  if(document.getElementById('gioAgendaReadable045')) return;
  const s=document.createElement('style');
  s.id='gioAgendaReadable045';
  s.textContent=`
    #gioDashboardAgenda{width:100%;max-width:100%;overflow-x:auto!important;padding-bottom:6px}
    #gioDashboardAgenda .gioAgendaGrid{
      display:grid!important;
      grid-template-columns:repeat(7,minmax(135px,1fr))!important;
      gap:8px!important;
      width:100%!important;
      min-width:980px!important;
    }
    #gioDashboardAgenda .gioAgendaDay{
      min-width:135px!important;
      min-height:170px!important;
      padding:0 8px 8px!important;
      overflow:hidden!important;
      background:#f8fafc!important;
      border:1px solid #d1d5db!important;
      border-radius:14px!important;
      color:#111827!important;
    }
    #gioDashboardAgenda .gioAgendaHeader045{
      display:block!important;
      margin:0 -8px 8px!important;
      padding:9px 8px!important;
      background:#f4c400!important;
      color:#111!important;
      font-size:13px!important;
      line-height:1.2!important;
      font-weight:900!important;
      border-radius:13px 13px 0 0!important;
      white-space:nowrap!important;
    }
    #gioDashboardAgenda .gioAgendaDay > b{display:none!important}
    #gioDashboardAgenda .gioEvent{
      display:block!important;
      box-sizing:border-box!important;
      width:100%!important;
      max-width:100%!important;
      margin:5px 0!important;
      padding:8px!important;
      border-radius:9px!important;
      border-left:5px solid #f4c400!important;
      background:#172033!important;
      color:#fff!important;
      font-size:12px!important;
      line-height:1.3!important;
      font-weight:800!important;
      white-space:normal!important;
      overflow-wrap:anywhere!important;
      overflow:hidden!important;
    }
    #gioDashboardAgenda .gioEvent,
    #gioDashboardAgenda .gioEvent *,
    #gioDashboardAgenda .gioEvent b,
    #gioDashboardAgenda .gioEvent small{
      color:#fff!important;
      opacity:1!important;
    }
    #gioDashboardAgenda .gioEvent small{
      display:block!important;
      margin-top:3px!important;
      font-size:10px!important;
    }
    #gioDashboardAgenda .gioEvent.late{background:#991b1b!important}
    #gioDashboardAgenda .gioEvent.done{background:#166534!important}
    @media(max-width:800px){
      #gioDashboardAgenda .gioAgendaGrid{min-width:945px!important}
      #gioDashboardAgenda .gioAgendaDay{min-width:130px!important}
    }
  `;
  document.head.appendChild(s);
}

function rebuildHeaders(){
  const mode=document.getElementById('gioAgendaMode')?.value||'week';
  if(mode!=='week') return;

  const days=[...document.querySelectorAll('#gioDashboardAgenda .gioAgendaDay')];
  if(days.length!==7) return;

  const monday=mondayOfCurrentWeek();

  days.forEach((day,i)=>{
    let h=day.querySelector('.gioAgendaHeader045');
    if(!h){
      h=document.createElement('div');
      h.className='gioAgendaHeader045';
      day.prepend(h);
    }
    const d=new Date(monday);
    d.setDate(monday.getDate()+i);
    h.textContent=d.toLocaleDateString('nl-NL',{
      weekday:'short',
      day:'numeric',
      month:'short'
    });
  });
}

function apply(){
  installStyle();
  rebuildHeaders();
}

function hookRenderer(){
  const old=window.renderGioDashboardAgenda;
  if(typeof old==='function'&&!old.__dev045){
    window.renderGioDashboardAgenda=function(){
      const result=old.apply(this,arguments);
      setTimeout(apply,0);
      return result;
    };
    window.renderGioDashboardAgenda.__dev045=true;
  }
}

function init(){
  hookRenderer();
  apply();

  const box=document.getElementById('gioDashboardAgenda');
  if(box){
    new MutationObserver(()=>setTimeout(apply,0))
      .observe(box,{childList:true,subtree:true});
  }

  document.getElementById('gioAgendaMode')
    ?.addEventListener('change',()=>setTimeout(apply,0));

  try{localStorage.setItem('gioMobileBuild','DEV 045 - AGENDA WEEK FIX')}catch(e){}
}

document.readyState==='loading'
  ? document.addEventListener('DOMContentLoaded',()=>setTimeout(init,1800))
  : setTimeout(init,1800);
})();

/* DEV 046 - Maandagenda met echte datums */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function isoLocal(d){const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${day}`}
function ensureStyle(){
 if($('gioMonthAgenda046Style'))return;
 const st=document.createElement('style');st.id='gioMonthAgenda046Style';st.textContent=`
 #gioDashboardAgenda .gioMonth046{width:100%;overflow-x:auto;padding-bottom:6px}
 #gioDashboardAgenda .gioMonth046Grid{display:grid;grid-template-columns:repeat(7,minmax(135px,1fr));gap:7px;min-width:980px}
 #gioDashboardAgenda .gioMonth046Weekday{background:#f4c400;color:#111;font-weight:900;text-align:center;padding:8px 5px;border-radius:8px;text-transform:capitalize}
 #gioDashboardAgenda .gioMonth046Day{min-height:150px;background:#f8fafc;color:#111827;border:1px solid #d1d5db;border-radius:12px;padding:0 7px 7px;overflow:hidden}
 #gioDashboardAgenda .gioMonth046Day.other{background:#e5e7eb;opacity:.62}
 #gioDashboardAgenda .gioMonth046Date{margin:0 -7px 7px;padding:7px 8px;background:#111827;color:#fff;font-weight:900;font-size:13px;border-radius:11px 11px 0 0}
 #gioDashboardAgenda .gioMonth046Day.today .gioMonth046Date{background:#f4c400;color:#111}
 #gioDashboardAgenda .gioMonth046Event{display:block;width:100%;margin:5px 0;padding:7px;border-radius:8px;border-left:5px solid #f4c400;background:#172033;color:#fff!important;font-size:11px;line-height:1.25;font-weight:800;white-space:normal;overflow-wrap:anywhere}
 #gioDashboardAgenda .gioMonth046Event *{color:#fff!important}
 #gioDashboardAgenda .gioMonth046Event small{display:block;margin-top:3px;font-size:9px;opacity:1}
 #gioDashboardAgenda .gioMonth046Empty{color:#6b7280;font-size:10px}
 @media(max-width:800px){#gioDashboardAgenda .gioMonth046Grid{min-width:945px;grid-template-columns:repeat(7,minmax(130px,1fr))}}
 `;document.head.appendChild(st)
}
function itemCoversDate(x,iso){const s=x.startdatum||x.datum||'',e=x.einddatum||s;return !!s&&s<=iso&&e>=iso}
function monthEventsFor(iso){return (window.data?.planning||[]).filter(x=>itemCoversDate(x,iso)).sort((a,b)=>String(a.starttijd||'').localeCompare(String(b.starttijd||'')))}
function renderMonth(){
 const box=$('gioDashboardAgenda');if(!box)return;
 const now=new Date();now.setHours(12,0,0,0);const year=now.getFullYear(),month=now.getMonth();
 const first=new Date(year,month,1,12),last=new Date(year,month+1,0,12);
 const start=new Date(first);start.setDate(start.getDate()-((start.getDay()+6)%7));
 const end=new Date(last);end.setDate(end.getDate()+(6-((end.getDay()+6)%7)));
 const weekdays=['ma','di','wo','do','vr','za','zo'];
 let html='<div class="gioMonth046"><div class="gioMonth046Grid">'+weekdays.map(d=>`<div class="gioMonth046Weekday">${d}</div>`).join('');
 const todayIso=isoLocal(now);
 for(let d=new Date(start);d<=end;d.setDate(d.getDate()+1)){
   const iso=isoLocal(d),inMonth=d.getMonth()===month,events=monthEventsFor(iso);
   html+=`<div class="gioMonth046Day ${inMonth?'':'other'} ${iso===todayIso?'today':''}">
    <div class="gioMonth046Date">${d.toLocaleDateString('nl-NL',{weekday:'short',day:'numeric',month:'short'})}</div>
    ${events.length?events.map(x=>`<div class="gioMonth046Event">${x.starttijd?esc(x.starttijd)+' ':''}${esc(x.project||x.klant||'Planning')}<small>${esc(x.klant||'')}${x.status?' • '+esc(x.status):''}</small></div>`).join(''):'<div class="gioMonth046Empty">Geen planning</div>'}
   </div>`;
 }
 box.innerHTML=html+'</div></div>';
}
function correctView(){ensureStyle();if(($('gioAgendaMode')?.value||'week')==='maand')renderMonth()}
function hook(){const old=window.renderGioDashboardAgenda;if(typeof old==='function'&&!old.__dev046){window.renderGioDashboardAgenda=function(){const r=old.apply(this,arguments);setTimeout(correctView,0);return r};window.renderGioDashboardAgenda.__dev046=true}}
function init(){hook();ensureStyle();$('gioAgendaMode')?.addEventListener('change',()=>setTimeout(correctView,0));if(($('gioAgendaMode')?.value||'week')==='maand')renderMonth();try{localStorage.setItem('gioMobileBuild','DEV 046 - MONTH AGENDA')}catch(e){}}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',()=>setTimeout(init,1900)):setTimeout(init,1900);
})();