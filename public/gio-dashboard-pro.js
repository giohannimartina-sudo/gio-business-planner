
(function(){
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const eur=v=>new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR'}).format(+v||0);
function ensure(){
 if(!window.data)return false;
 ['planning','projecten','uren','uitgaven','materiaal','offertes','facturen','klantBetalingen','medewerkers','medewerkerUren','ritten','voorraad','gereedschap'].forEach(k=>{if(!Array.isArray(data[k]))data[k]=[]});
 if(!data.dashboardSettings)data.dashboardSettings={period:'maand',maandDoel:10000};
 return true;
}
function iso(d){return d.toISOString().slice(0,10)}
function range(period){
 const n=new Date(),start=new Date(n),end=new Date(n);
 if(period==='dag'){}
 if(period==='week'){const day=(n.getDay()+6)%7;start.setDate(n.getDate()-day);end.setDate(start.getDate()+6)}
 if(period==='maand'){start.setDate(1);end.setMonth(n.getMonth()+1,0)}
 return{from:iso(start),to:iso(end)}
}
function between(d,r){return d&&d>=r.from&&d<=r.to}
function invoiceTotal(inv){
 let total=0;
 (inv.regels||[]).forEach(l=>{const b=(+l.aantal||0)*(+l.prijs||0);total+=b+b*(+l.btw||0)/100});
 return total;
}
function paidFor(inv){return data.klantBetalingen.filter(p=>p.factuurId===inv.id).reduce((s,p)=>s+(+p.bedrag||0),0)}
function certAlerts(){
 const now=new Date();now.setHours(12,0,0,0);const out=[];
 data.medewerkers.forEach(m=>(m.certificaten||[]).forEach(c=>{if(!c.vervaldatum)return;const d=Math.ceil((new Date(c.vervaldatum+'T12:00:00')-now)/86400000),r=+c.herinnering||30;if(d<=r)out.push({m,c,d})}));
 return out.sort((a,b)=>a.d-b.d);
}
function inject(){
 const dash=$('dashboard');if(!dash||$('gioDashboardPro'))return;
 const box=document.createElement('div');box.id='gioDashboardPro';
 box.innerHTML=`<div class="gioDashHero"><div class="gioDashHeroTop"><div><h2 style="margin:0">📊 Dashboard PRO</h2><p id="gioDashDate" style="margin:4px 0 0;color:#9ca3af"></p></div><div><label>Maanddoel</label><input id="gioDashGoal" type="number" step="100" onchange="gioSaveDashGoal()" style="max-width:150px"></div></div><div class="gioDashPeriod"><button class="btn2" data-period="dag" onclick="gioSetDashPeriod('dag')">Vandaag</button><button class="btn2" data-period="week" onclick="gioSetDashPeriod('week')">Deze week</button><button class="btn2" data-period="maand" onclick="gioSetDashPeriod('maand')">Deze maand</button></div><div id="gioDashGoalText"></div><div class="gioGoalBar"><span id="gioDashGoalBar"></span></div></div><div id="gioDashKpis" class="gioDashKpis"></div><div class="gioDashQuick"><button class="btn" onclick="gioDashGo('planning')">📅 Planning</button><button class="btn2" onclick="gioDashGo('uren')">⏱ Uren</button><button class="btn2" onclick="gioDashGo('rittenregistratie')">🚘 Rit</button><button class="btn2" onclick="gioDashGo('bonscanner')">📷 Bon</button><button class="btn2" onclick="gioDashGo('projectkaartpro')">📋 Projectkaart</button><button class="btn2" onclick="gioDashGo('personeelscentrum')">👷 Personeel</button></div><div class="gioDashPanels"><div class="gioDashPanel"><h3>📅 Vandaag gepland</h3><div id="gioDashPlanning"></div></div><div class="gioDashPanel"><h3>👷 Nu actief</h3><div id="gioDashActive"></div></div><div class="gioDashPanel"><h3>💰 Openstaand</h3><div id="gioDashOpen"></div></div><div class="gioDashPanel"><h3>⚠️ Aandacht nodig</h3><div id="gioDashAlerts"></div></div></div>`;
 dash.prepend(box);
}
window.gioDashGo=id=>{
 const b=[...document.querySelectorAll('aside nav button')].find(x=>x.textContent.toLowerCase().includes(id.replace('personeelscentrum','personeel').replace('rittenregistratie','ritten').replace('bonscanner','bon scanner').replace('projectkaartpro','projectkaart')));
 if(typeof show==='function'&&$(id))show(id,b||document.querySelector('aside nav button'));
 if(id==='personeelscentrum')gioPersonnelInit?.();
 if(id==='rittenregistratie')gioRitInit?.();
 if(id==='bonscanner')gioScanInit?.();
 window.scrollTo({top:0,behavior:'smooth'});
}
window.gioSetDashPeriod=p=>{data.dashboardSettings.period=p;save?.();gioRenderDashboardPro()}
window.gioSaveDashGoal=()=>{data.dashboardSettings.maandDoel=+$('gioDashGoal').value||0;save?.();gioRenderDashboardPro()}
window.gioRenderDashboardPro=()=>{
 if(!ensure()||!$('gioDashboardPro'))return;
 const p=data.dashboardSettings.period||'maand',r=range(p);
 document.querySelectorAll('.gioDashPeriod button').forEach(b=>b.classList.toggle('active',b.dataset.period===p));
 $('gioDashDate').textContent=new Date().toLocaleDateString('nl-NL',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
 $('gioDashGoal').value=data.dashboardSettings.maandDoel||0;
 const revenue=data.facturen.filter(f=>between(f.datum,r)).reduce((s,f)=>s+invoiceTotal(f),0);
 const expenses=data.uitgaven.filter(x=>between(x.datum,r)).reduce((s,x)=>s+(+x.bedrag||0),0)+data.materiaal.filter(x=>between(x.datum,r)&&!x.doorberekenen).reduce((s,x)=>s+(+x.bedrag||0),0);
 const profit=revenue-expenses;
 const hours=data.uren.filter(x=>between(x.datum,r)).reduce((s,x)=>s+(+x.uren||0),0)+data.medewerkerUren.filter(x=>between(x.datum,r)&&!x.actief).reduce((s,x)=>s+(+x.uren||0),0);
 const openProjects=data.projecten.filter(x=>!['Betaald','Afgerond','Archief'].includes(x.status)).length;
 const openOffers=data.offertes.filter(x=>['Concept','Verzonden'].includes(x.status)).length;
 const outstanding=data.facturen.reduce((s,f)=>s+Math.max(0,invoiceTotal(f)-paidFor(f)),0);
 const km=data.ritten.filter(x=>between(x.datum,r)&&x.soort==='Zakelijk').reduce((s,x)=>s+(+x.km||0),0);
 $('gioDashKpis').innerHTML=`<div class="gioDashKpi"><small>Omzet</small><b>${eur(revenue)}</b></div><div class="gioDashKpi"><small>Uitgaven</small><b>${eur(expenses)}</b></div><div class="gioDashKpi"><small>Resultaat</small><b>${eur(profit)}</b></div><div class="gioDashKpi"><small>Uren</small><b>${hours.toFixed(2)}</b></div><div class="gioDashKpi"><small>Open projecten</small><b>${openProjects}</b></div><div class="gioDashKpi"><small>Open offertes</small><b>${openOffers}</b></div><div class="gioDashKpi"><small>Openstaand</small><b>${eur(outstanding)}</b></div><div class="gioDashKpi"><small>Zakelijke KM</small><b>${km.toFixed(1)}</b></div>`;
 const goal=+data.dashboardSettings.maandDoel||0,progress=goal>0?Math.min(100,revenue/goal*100):0;
 $('gioDashGoalText').innerHTML=`<small>Doelvoortgang: <b>${progress.toFixed(0)}%</b> — ${eur(revenue)} van ${eur(goal)}</small>`;
 $('gioDashGoalBar').style.width=progress+'%';
 const today=iso(new Date()),planning=data.planning.filter(x=>x.datum===today||x.start===today);
 $('gioDashPlanning').innerHTML=planning.length?planning.slice(0,8).map(x=>`<div class="gioDashRow"><span><b>${esc(x.klant||'-')}</b><br><small>${esc(x.project||x.naam||'')} ${esc(x.tijd||'')}</small></span><span class="gioDashBadge">${esc(x.status||'Gepland')}</span></div>`).join(''):'<div class="gioDashRow">Geen planning voor vandaag.</div>';
 const workers=data.medewerkerUren.filter(x=>x.actief),trip=data.activeRit?[data.activeRit]:[];
 $('gioDashActive').innerHTML=[...workers.map(x=>`<div class="gioDashRow"><span><b>${esc(x.naam||'Medewerker')}</b><br><small>${esc(x.project||'-')} • sinds ${esc(x.start||'-')}</small></span><span class="gioDashBadge green">Ingeklokt</span></div>`),...trip.map(x=>`<div class="gioDashRow"><span><b>${esc(x.voertuig||'Voertuig')}</b><br><small>${esc(x.soort||'')} • ${esc(x.starttijd||'')}</small></span><span class="gioDashBadge green">Rit actief</span></div>`)].join('')||'<div class="gioDashRow">Niemand actief.</div>';
 const openInvoices=data.facturen.map(f=>({f,open:Math.max(0,invoiceTotal(f)-paidFor(f))})).filter(x=>x.open>0).sort((a,b)=>b.open-a.open);
 $('gioDashOpen').innerHTML=openInvoices.length?openInvoices.slice(0,8).map(x=>`<div class="gioDashRow"><span><b>${esc(x.f.nummer)}</b><br><small>${esc(x.f.klant)}</small></span><span>${eur(x.open)}</span></div>`).join(''):'<div class="gioDashRow">Geen openstaande facturen.</div>';
 const alerts=[];
 const low=data.voorraad.filter(x=>(+x.aantal||0)<=(+x.minimum||0));
 low.slice(0,4).forEach(x=>alerts.push(`<div class="gioDashRow"><span><b>${esc(x.naam)}</b><br><small>Voorraad ${x.aantal||0} ${esc(x.eenheid||'')}</small></span><span class="gioDashBadge warn">Bijbestellen</span></div>`));
 certAlerts().slice(0,4).forEach(a=>alerts.push(`<div class="gioDashRow"><span><b>${esc(a.m.naam)} — ${esc(a.c.naam)}</b><br><small>${a.d<0?'Verlopen':'Nog '+a.d+' dagen'}</small></span><span class="gioDashBadge ${a.d<0?'red':'warn'}">${a.d<0?'Verlopen':'Vernieuwen'}</span></div>`));
 const toolAlerts=data.gereedschap.filter(x=>['Defect','Reparatie'].includes(x.status)).slice(0,3);
 toolAlerts.forEach(x=>alerts.push(`<div class="gioDashRow"><span><b>${esc(x.naam)}</b><br><small>${esc(x.status)}</small></span><span class="gioDashBadge red">Gereedschap</span></div>`));
 $('gioDashAlerts').innerHTML=alerts.join('')||'<div class="gioDashRow"><span>✅ Geen dringende meldingen.</span></div>';
}
function wrapSave(){
 const old=window.save;if(typeof old!=='function'||old.__dash015)return;
 window.save=function(){const r=old.apply(this,arguments);setTimeout(()=>gioRenderDashboardPro?.(),0);return r};
 window.save.__dash015=true;
}
function init(){
 ensure();inject();wrapSave();gioRenderDashboardPro();setInterval(gioRenderDashboardPro,30000);
 document.title='GIO Business Planner PRO — MOBILE DEV 015';
 try{localStorage.setItem('gioMobileBuild','MOBILE DEV 015')}catch(e){}
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',()=>setTimeout(init,1100)):setTimeout(init,1100);
})();
