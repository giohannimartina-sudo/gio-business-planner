
(function(){
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const eur=v=>new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR'}).format(+v||0);

function ensure(){
  if(!window.data)return false;
  ['medewerkers','voertuigen','gereedschap','voorraad','facturen','klantBetalingen','planning','projecten','offertes'].forEach(k=>{
    if(!Array.isArray(data[k]))data[k]=[];
  });
  if(!data.reminderSettings)data.reminderSettings={
    certDays:30, vehicleDays:30, invoiceDays:0, planningDays:1, projectDays:3, stock:true, tools:true
  };
  if(!Array.isArray(data.reminderDismissed))data.reminderDismissed=[];
  return true;
}
function today(){return new Date().toISOString().slice(0,10)}
function days(date){
  if(!date)return null;
  const a=new Date(date+'T12:00:00'),b=new Date();b.setHours(12,0,0,0);
  return Math.ceil((a-b)/86400000);
}
function invTotal(inv){
  let total=0;
  (inv.regels||[]).forEach(l=>{
    const base=(+l.aantal||0)*(+l.prijs||0);
    total+=base+base*(+l.btw||0)/100;
  });
  return total;
}
function paidFor(inv){
  return data.klantBetalingen.filter(p=>String(p.factuurId)===String(inv.id)).reduce((s,p)=>s+(+p.bedrag||0),0);
}
function rid(type,id,sub=''){return [type,id,sub].join(':')}
function dismissed(id){return data.reminderDismissed.includes(id)}

function allReminders(){
  ensure();
  const out=[],cfg=data.reminderSettings;

  data.medewerkers.forEach(m=>(m.certificaten||[]).forEach((c,i)=>{
    const d=days(c.vervaldatum),id=rid('cert',m.id,c.naam||i);
    if(d!==null&&d<=cfg.certDays&&!dismissed(id)){
      out.push({id,type:'Certificaat',title:`${m.naam} — ${c.naam||'Certificaat'}`,date:c.vervaldatum,days:d,severity:d<0?'red':'warn',target:'personeelscentrum',meta:d<0?`Verlopen ${Math.abs(d)} dag(en)`:`Verloopt over ${d} dag(en)`});
    }
  }));

  data.voertuigen.forEach(v=>{
    [['APK',v.apk],['Verzekering',v.verzekering],['Onderhoud',v.onderhoudDatum]].forEach(([label,date])=>{
      const d=days(date),id=rid('vehicle',v.id,label);
      if(d!==null&&d<=cfg.vehicleDays&&!dismissed(id)){
        out.push({id,type:'Voertuig',title:`${v.kenteken||'Voertuig'} — ${label}`,date,days:d,severity:d<0?'red':'warn',target:'voertuigenpro',meta:d<0?`${label} verlopen`:`${label} over ${d} dag(en)`});
      }
    });
    if(v.onderhoudKm&&v.kmstand>=v.onderhoudKm){
      const id=rid('vehiclekm',v.id,'onderhoud');
      if(!dismissed(id))out.push({id,type:'Voertuig',title:`${v.kenteken||'Voertuig'} — onderhoud`,days:-1,severity:'red',target:'voertuigenpro',meta:`Onderhoud nodig bij ${Number(v.kmstand||0).toLocaleString('nl-NL')} km`});
    }
  });

  data.facturen.forEach(f=>{
    const total=invTotal(f),paid=paidFor(f),open=Math.max(0,total-paid),d=days(f.vervaldatum),id=rid('invoice',f.id);
    if(open>0&&d!==null&&d<=cfg.invoiceDays&&!dismissed(id)){
      out.push({id,type:'Factuur',title:`${f.nummer||'Factuur'} — ${f.klant||''}`,date:f.vervaldatum,days:d,severity:d<0?'red':'warn',target:'facturatiepro2',meta:`Openstaand ${eur(open)}${d<0?` • ${Math.abs(d)} dag(en) te laat`:''}`});
    }
  });

  const td=today();
  data.planning.forEach(p=>{
    const start=p.startdatum||p.datum,end=p.einddatum||start,id=rid('planning',p.id||start,p.project||'');
    const d=days(start);
    if(p.status!=='Klaar'&&d!==null&&d>=0&&d<=cfg.planningDays&&!dismissed(id)){
      out.push({id,type:'Planning',title:`${p.klant||'-'} — ${p.project||'-'}`,date:start,days:d,severity:d===0?'green':'blue',target:'planningpro2',meta:d===0?'Vandaag gepland':`Over ${d} dag(en)`});
    }
    if(p.status!=='Klaar'&&end<td){
      const oid=rid('planning-over',p.id||start,p.project||'');
      if(!dismissed(oid))out.push({id:oid,type:'Planning',title:`${p.klant||'-'} — ${p.project||'-'}`,date:end,days:days(end),severity:'red',target:'planningpro2',meta:'Planning is verlopen en nog niet klaar'});
    }
  });

  data.projecten.forEach(p=>{
    const st=(p.status||'Open').toLowerCase();
    if(st.includes('betaald')||st.includes('archief'))return;
    const end=p.einddatum||p.einde;
    const d=days(end),id=rid('project',p.id||p.projectnummer||p.naam);
    if(d!==null&&d<=cfg.projectDays&&!dismissed(id)){
      out.push({id,type:'Project',title:`${p.projectnummer||''} ${p.naam||p.project||'Project'}`.trim(),date:end,days:d,severity:d<0?'red':'warn',target:'projectstatuspro',meta:d<0?`${Math.abs(d)} dag(en) over tijd`:d===0?'Eindigt vandaag':`Nog ${d} dag(en)`});
    }
  });

  if(cfg.stock){
    data.voorraad.forEach(x=>{
      if((+x.aantal||0)<= (+x.minimum||0)){
        const id=rid('stock',x.id||x.code||x.naam);
        if(!dismissed(id))out.push({id,type:'Voorraad',title:x.naam||'Voorraadartikel',days:0,severity:(+x.aantal||0)<=0?'red':'warn',target:'voorraadpro2',meta:`Voorraad ${x.aantal||0} ${x.eenheid||''} • minimum ${x.minimum||0}`});
      }
    });
  }

  if(cfg.tools){
    data.gereedschap.forEach(t=>{
      if(['Defect','Reparatie'].includes(t.status)){
        const id=rid('toolstatus',t.id,t.status);
        if(!dismissed(id))out.push({id,type:'Gereedschap',title:t.naam||'Gereedschap',days:0,severity:'red',target:'gereedschappro',meta:`Status: ${t.status}`});
      }
      const d=days(t.kalibratie),id=rid('toolcal',t.id);
      if(d!==null&&d<=30&&!dismissed(id)){
        out.push({id,type:'Gereedschap',title:`${t.naam||'Gereedschap'} — kalibratie`,date:t.kalibratie,days:d,severity:d<0?'red':'warn',target:'gereedschappro',meta:d<0?'Kalibratie verlopen':`Kalibratie over ${d} dag(en)`});
      }
    });
  }

  return out.sort((a,b)=>{
    const score=s=>s==='red'?0:s==='warn'?1:s==='blue'?2:3;
    return score(a.severity)-score(b.severity) || (a.days??999)-(b.days??999);
  });
}

let activeTab='Alles';

function inject(){
  if($('reminderspro'))return;
  const main=document.querySelector('main');if(!main)return;
  const s=document.createElement('section');s.id='reminderspro';s.className='page';
  s.innerHTML=`<div class="card">
    <h2>🔔 Meldingen & Herinneringen PRO</h2>
    <div id="gioReminderTabs" class="gioReminderTabs"></div>
    <div id="gioReminderKpis" class="gioReminderKpis"></div>
    <div class="row">
      <div><label>Certificaten (dagen vooraf)</label><input id="gioReminderCertDays" type="number" min="0" onchange="gioReminderSaveSettings()"></div>
      <div><label>Voertuigen (dagen vooraf)</label><input id="gioReminderVehicleDays" type="number" min="0" onchange="gioReminderSaveSettings()"></div>
      <div><label>Planning (dagen vooraf)</label><input id="gioReminderPlanningDays" type="number" min="0" onchange="gioReminderSaveSettings()"></div>
      <div><label>Projectdeadline (dagen vooraf)</label><input id="gioReminderProjectDays" type="number" min="0" onchange="gioReminderSaveSettings()"></div>
    </div>
    <div id="gioReminderList"></div>
  </div>`;
  main.appendChild(s);

  const nav=document.querySelector('aside nav');
  if(nav && ![...nav.querySelectorAll('button')].some(b=>b.textContent.includes('Meldingen & Herinneringen PRO'))){
    const b=document.createElement('button');
    b.textContent='🔔 Meldingen & Herinneringen PRO';
    b.onclick=()=>{show('reminderspro',b);gioRemindersInit()};
    nav.appendChild(b);
  }

  const dash=$('dashboard');
  if(dash && !$('gioReminderDashboardBell')){
    const bell=document.createElement('button');
    bell.id='gioReminderDashboardBell';
    bell.className='btn2';
    bell.style.margin='8px 0';
    bell.onclick=()=>gioReminderGoPanel();
    dash.prepend(bell);
  }
}

function tabs(){
  const a=['Alles','Vandaag','Te laat','Facturen','Personeel','Voertuigen','Voorraad'];
  $('gioReminderTabs').innerHTML=a.map(x=>`<button class="btn2 ${activeTab===x?'active':''}" onclick="gioReminderSetTab('${x}')">${x}</button>`).join('');
}
window.gioReminderSetTab=t=>{activeTab=t;tabs();gioRenderReminders()}

function filtered(){
  const rows=allReminders();
  if(activeTab==='Alles')return rows;
  if(activeTab==='Vandaag')return rows.filter(x=>x.days===0);
  if(activeTab==='Te laat')return rows.filter(x=>x.severity==='red');
  if(activeTab==='Facturen')return rows.filter(x=>x.type==='Factuur');
  if(activeTab==='Personeel')return rows.filter(x=>x.type==='Certificaat');
  if(activeTab==='Voertuigen')return rows.filter(x=>x.type==='Voertuig');
  if(activeTab==='Voorraad')return rows.filter(x=>x.type==='Voorraad');
  return rows;
}

window.gioRenderReminders=()=>{
  ensure();tabs();
  const all=allReminders(),rows=filtered();
  const overdue=all.filter(x=>x.severity==='red').length;
  const todayCount=all.filter(x=>x.days===0).length;
  const invoices=all.filter(x=>x.type==='Factuur').length;

  $('gioReminderKpis').innerHTML=`
    <div class="gioReminderKpi"><small>Totaal actief</small><b>${all.length}</b></div>
    <div class="gioReminderKpi"><small>Te laat / verlopen</small><b>${overdue}</b></div>
    <div class="gioReminderKpi"><small>Vandaag</small><b>${todayCount}</b></div>
    <div class="gioReminderKpi"><small>Factuurmeldingen</small><b>${invoices}</b></div>`;

  $('gioReminderList').innerHTML=rows.length?rows.map(r=>`
    <article class="gioReminderCard ${r.severity}">
      <div>
        <span class="gioReminderBadge ${r.severity==='red'?'red':r.severity==='warn'?'warn':r.severity==='green'?'green':''}">${esc(r.type)}</span>
        <h3 style="margin:7px 0 2px">${esc(r.title)}</h3>
        <small>${esc(r.meta||'')}${r.date?' • '+esc(r.date):''}</small>
      </div>
      <div class="gioReminderActions">
        <button onclick="gioReminderOpen('${r.target}')">Open</button>
        <button onclick="gioReminderDismiss('${r.id}')">✓ Afhandelen</button>
      </div>
    </article>`).join(''):'<div class="gioReminderCard green">✅ Geen actieve meldingen in deze categorie.</div>';

  updateBell(all);
}

function updateBell(all){
  const bell=$('gioReminderDashboardBell');if(!bell)return;
  const critical=all.filter(x=>x.severity==='red').length;
  bell.textContent=`🔔 Meldingen ${all.length?`(${all.length})`:''}`;
  bell.classList.toggle('gioBellPulse',critical>0);
  bell.title=critical?`${critical} urgente melding(en)`:'Meldingen';
}

window.gioReminderDismiss=id=>{
  if(!data.reminderDismissed.includes(id))data.reminderDismissed.push(id);
  save?.();gioRenderReminders();
}
window.gioReminderOpen=target=>{
  const b=[...document.querySelectorAll('aside nav button')].find(x=>{
    const t=x.textContent.toLowerCase();
    return t.includes(target.replace('personeelscentrum','personeel').replace('voertuigenpro','voertuigen').replace('facturatiepro2','facturatie').replace('planningpro2','planning').replace('projectstatuspro','projectstatus').replace('voorraadpro2','voorraad').replace('gereedschappro','gereedschap'));
  });
  if(typeof show==='function'&&$(target))show(target,b||document.querySelector('aside nav button'));
  if(target==='personeelscentrum')gioPersonnelInit?.();
  if(target==='voertuigenpro')gioVehiclesInit?.();
  if(target==='facturatiepro2')gioInvoicesInit?.();
  if(target==='planningpro2')gioPlanningProInit?.();
  if(target==='projectstatuspro')gioProjectStatusInit?.();
  if(target==='voorraadpro2')gioStockInit?.();
  if(target==='gereedschappro')gioToolsInit?.();
  window.scrollTo({top:0,behavior:'smooth'});
}
window.gioReminderGoPanel=()=>{
  const b=[...document.querySelectorAll('aside nav button')].find(x=>x.textContent.includes('Meldingen & Herinneringen PRO'));
  if(typeof show==='function')show('reminderspro',b||document.querySelector('aside nav button'));
  gioRemindersInit();
}
window.gioReminderSaveSettings=()=>{
  data.reminderSettings.certDays=+$('gioReminderCertDays').value||0;
  data.reminderSettings.vehicleDays=+$('gioReminderVehicleDays').value||0;
  data.reminderSettings.planningDays=+$('gioReminderPlanningDays').value||0;
  data.reminderSettings.projectDays=+$('gioReminderProjectDays').value||0;
  save?.();gioRenderReminders();
}
window.gioRemindersInit=()=>{
  ensure();
  $('gioReminderCertDays').value=data.reminderSettings.certDays;
  $('gioReminderVehicleDays').value=data.reminderSettings.vehicleDays;
  $('gioReminderPlanningDays').value=data.reminderSettings.planningDays;
  $('gioReminderProjectDays').value=data.reminderSettings.projectDays;
  gioRenderReminders();
}

function patchMenus(){
  const old=window.gioOpenMoreOverlay;
  window.gioOpenMoreOverlay=function(){
    old?.();
    setTimeout(()=>{
      const g=document.querySelector('#gioOverlayBody .gioOverlayGrid');
      if(g&&!g.textContent.includes('Meldingen & Herinneringen PRO'))g.insertAdjacentHTML('beforeend',`<button onclick="gioApprovedGo('reminderspro');gioRemindersInit()"><i>🔔</i>Meldingen & Herinneringen PRO</button>`);
    },0);
  }
}
function wrapSave(){
  const old=window.save;
  if(typeof old!=='function'||old.__rem024)return;
  window.save=function(){
    const r=old.apply(this,arguments);
    setTimeout(()=>{if($('reminderspro'))gioRenderReminders?.()},0);
    return r;
  };
  window.save.__rem024=true;
}
function init(){
  ensure();inject();patchMenus();wrapSave();
  gioRemindersInit();
  setInterval(()=>gioRenderReminders?.(),60000);
  document.title='GIO Business Planner PRO — MOBILE DEV 024';
  try{localStorage.setItem('gioMobileBuild','MOBILE DEV 024')}catch(e){}
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',()=>setTimeout(init,2000)):setTimeout(init,2000);
})();
