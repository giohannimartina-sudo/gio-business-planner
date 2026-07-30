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
 <div class="row"><div><label>Functie / vakgebied</label><input id="medFunctie"></div><div><label>Startdatum</label><input id="medStartdatum" type="date"></div><div><label>Einddatum contract/stage</label><input id="medEinddatum" type="date"></div></div>
 <h3>Certificaat toevoegen</h3>
 <div class="row"><div><label>Naam</label><input id="medCertNaam" placeholder="VCA, BHV, hoogwerker"></div><div><label>Nummer</label><input id="medCertNummer"></div><div><label>Behaald op</label><input id="medCertDatum" type="date"></div><div><label>Vervaldatum</label><input id="medCertVerval" type="date"></div><div><label>Herinnering</label><select id="medCertHerinnering"><option value="7">7 dagen</option><option value="14">14 dagen</option><option value="30" selected>30 dagen</option><option value="60">60 dagen</option><option value="90">90 dagen</option></select></div><div><label>Foto/PDF</label><input id="medCertBestand" type="file" accept="image/*,.pdf"></div></div>
 <button type="button" class="btn2" onclick="gioMedCertAdd()">＋ Certificaat toevoegen</button><div id="medCertLijst" class="gioCertificateList"></div>`;
 card.insertAdjacentElement('afterend',box);renderCerts();
}
function renderCerts(){const b=$('medCertLijst');if(!b)return;b.innerHTML=pendingCerts.length?pendingCerts.map((c,i)=>{const [cl,lab]=state(c);return `<div class="gioCertificateCard ${cl}"><b>${esc(c.naam)}</b> <span class="gioCertificateBadge ${cl==='expired'?'danger':cl==='expiring'?'warn':''}">${esc(lab)}</span><br><button class="del" onclick="gioMedCertDel(${i})">🗑️</button></div>`}).join(''):'<small>Nog geen certificaten toegevoegd.</small>'}
window.gioMedFoto=e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{photoData=r.result;$('medFotoPreview').innerHTML=`<img class="gioEmployeeAvatar" src="${photoData}">`};r.readAsDataURL(f)};
window.gioMedCertAdd=()=>{const naam=$('medCertNaam').value.trim();if(!naam){alert('Vul certificaatnaam in');return}const f=$('medCertBestand').files?.[0];const done=(bestand='')=>{pendingCerts.push({id:String(Date.now()+Math.random()),naam,nummer:$('medCertNummer').value.trim(),datum:$('medCertDatum').value,vervaldatum:$('medCertVerval').value,herinnering:+$('medCertHerinnering').value||30,bestand,bestandNaam:f?.name||''});['medCertNaam','medCertNummer','medCertDatum','medCertVerval'].forEach(id=>$(id).value='');$('medCertBestand').value='';renderCerts()};if(f){const r=new FileReader();r.onload=()=>done(r.result);r.readAsDataURL(f)}else done()};
window.gioMedCertDel=i=>{pendingCerts.splice(i,1);renderCerts()};
function load(x={}){photoData=x.foto||'';$('medFotoPreview').innerHTML=photoData?`<img class="gioEmployeeAvatar" src="${photoData}">`:'👤';$('medFunctie').value=x.functie||'';$('medStartdatum').value=x.startdatum||'';$('medEinddatum').value=x.einddatum||'';pendingCerts=[...(x.certificaten||[])];renderCerts()}
function alarms(){if(!ensure())return;const arr=[];data.medewerkers.forEach(m=>(m.certificaten||[]).forEach(c=>{const d=days(c.vervaldatum),r=+c.herinnering||30;if(d!==null&&d<=r)arr.push({m,c,d})}));let b=$('gioEmployeeReminderBanner');if(!b){b=document.createElement('div');b.id='gioEmployeeReminderBanner';$('medewerkers')?.prepend(b)}if(!b)return;b.innerHTML=arr.length?`<div class="gioEmployeeAlarm ${arr.some(x=>x.d<0)?'danger':''}">🔔 ${arr.length} certificaat-herinnering(en)${arr.some(x=>x.d<0)?' • verlopen certificaten aanwezig':''}</div>`:''}
function wrap(){
 const saveOld=window.gioMedewerkerOpslaan;
 if(typeof saveOld==='function'&&!saveOld.__pro2){window.gioMedewerkerOpslaan=function(){const id=$('medEditId')?.value||'';const old=(data.medewerkers||[]).find(x=>String(x.id)===String(id));saveOld();const saved=id?(data.medewerkers||[]).find(x=>String(x.id)===String(id)):(data.medewerkers||[])[0];if(saved){saved.foto=photoData||(old?.foto||'');saved.functie=$('medFunctie')?.value.trim()||'';saved.startdatum=$('medStartdatum')?.value||'';saved.einddatum=$('medEinddatum')?.value||'';saved.certificaten=pendingCerts.length?pendingCerts:(old?.certificaten||[]);window.save?.();window.gioRenderMedewerkers?.()}load({})};window.gioMedewerkerOpslaan.__pro2=true}
 const editOld=window.gioMedewerkerBewerk;
 if(typeof editOld==='function'&&!editOld.__pro2){window.gioMedewerkerBewerk=function(id){editOld(id);load((data.medewerkers||[]).find(x=>String(x.id)===String(id))||{})};window.gioMedewerkerBewerk.__pro2=true}
 const renderOld=window.gioRenderMedewerkers;
 if(typeof renderOld==='function'&&!renderOld.__pro2){window.gioRenderMedewerkers=function(){renderOld();alarms()};window.gioRenderMedewerkers.__pro2=true}
}
function init(){addTypes();inject();wrap();alarms();document.title='GIO Business Planner PRO — MOBILE DEV 002';try{localStorage.setItem('gioMobileBuild','MOBILE DEV 002')}catch(e){}}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',()=>setTimeout(init,150)):setTimeout(init,150);
})();
