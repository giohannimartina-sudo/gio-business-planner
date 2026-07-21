/* GIO Business Planner PRO - Refresh Update RC2
   Veilige uitbreiding: bestaande gegevens en functies blijven behouden. */
(function(){
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>typeof euro==='function'?euro(+v||0):new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR'}).format(+v||0);
function projectName(p){return p?.naam||p?.project||''}

function installBusinessCustomer(){
 const naam=document.getElementById('klantNaam'),type=document.getElementById('klantType');
 if(!naam||!type||document.getElementById('klantBedrijfsnaam'))return;
 const holder=naam.parentElement;
 holder.querySelector('label').id='klantNaamLabel';
 const field=document.createElement('div');field.className='gioBusinessField';field.id='klantBusinessField';
 field.innerHTML='<label>Bedrijfsnaam *</label><input id="klantBedrijfsnaam" placeholder="Bijv. Bouwbedrijf Jansen B.V.">';
 holder.parentElement.insertBefore(field,holder.nextSibling);
 window.gioKlantTypeChanged=(function(old){return function(){if(old)try{old()}catch(e){};const zak=type.value==='Zakelijk';field.classList.toggle('active',zak);document.getElementById('klantNaamLabel').textContent=zak?'Contactpersoon / naam':'Naam *';naam.placeholder=zak?'Bijv. Jan de Vries':'';};})(window.gioKlantTypeChanged);
 type.addEventListener('change',window.gioKlantTypeChanged);window.gioKlantTypeChanged();
 const original=window.addKlant;
 window.addKlant=function(){
   if(type.value!=='Zakelijk')return original();
   const bedrijf=document.getElementById('klantBedrijfsnaam').value.trim();
   if(!bedrijf){alert('Vul de bedrijfsnaam in');return;}
   if(!window.data.klanten)window.data.klanten=[];
   const contact=naam.value.trim()||document.getElementById('klantContact')?.value.trim()||'';
   window.data.klanten.push({klantNr:nextKlantNumber(),naam:bedrijf,bedrijfsnaam:bedrijf,type:'Zakelijk',contact,adres:klantAdres.value,postcode:klantPostcode.value,plaats:klantPlaats.value,telefoon:klantTelefoon.value,email:klantEmail.value,kvk:klantKvk.value,btw:klantBtw.value,betaaltermijn:klantBetaaltermijn.value||'14 dagen',opmerking:klantOpmerking.value});
   [naam,klantAdres,klantPostcode,klantPlaats,klantTelefoon,klantEmail,klantOpmerking,klantContact,klantKvk,klantBtw,document.getElementById('klantBedrijfsnaam')].forEach(x=>{if(x)x.value=''});
   save();render();window.gioKlantTypeChanged();
 };
}

function installMaterialProjectOverview(){
 const sec=document.getElementById('materiaal'),list=document.getElementById('matList');if(!sec||!list||document.getElementById('gioMatProjectFilter'))return;
 const listCard=list.closest('.card');
 const bar=document.createElement('div');bar.className='gioProjectFilterBar';bar.innerHTML='<div><label>Projectoverzicht materialen</label><select id="gioMatProjectFilter"><option value="">Alle projecten</option></select></div><button type="button" class="btn2" id="gioMatClearFilter">Alles tonen</button><button type="button" class="btn" id="gioMatOpenCard">📋 Open projectkaart</button>';
 listCard.insertBefore(bar,listCard.querySelector('table'));
 const summary=document.createElement('div');summary.id='gioMatProjectSummary';summary.className='gioProjectSummary';listCard.insertBefore(summary,listCard.querySelector('table'));
 const filter=document.getElementById('gioMatProjectFilter');
 function updateOptions(){const current=filter.value;filter.innerHTML='<option value="">Alle projecten</option>'+[...new Set((data.projecten||[]).map(projectName).filter(Boolean))].map(n=>`<option value="${esc(n)}">${esc(n)}</option>`).join('');filter.value=current;}
 function apply(){const val=filter.value;let total=0,count=0;[...list.rows].forEach((row,i)=>{const x=(data.materiaal||[])[i];const visible=!val||x?.project===val;row.style.display=visible?'':'none';if(visible){count++;total+=+x?.bedrag||0;}});summary.innerHTML=`<div><small>Geselecteerd project</small><b>${esc(val||'Alle projecten')}</b></div><div><small>Aantal materiaalregels</small><b>${count}</b></div><div><small>Totaal materiaal</small><b>${money(total)}</b></div><div><small>Status</small><b>${val?'Gefilterd':'Alles'}</b></div>`;}
 filter.addEventListener('change',apply);document.getElementById('gioMatClearFilter').onclick=()=>{filter.value='';apply()};document.getElementById('gioMatOpenCard').onclick=()=>{if(!filter.value){alert('Kies eerst een project');return}const s=document.getElementById('proProjectSelect');if(s)s.value=filter.value;show('projectkaartpro',document.querySelector('nav button[onclick*="projectkaartpro"]'));if(typeof renderProjectkaartPro==='function')renderProjectkaartPro()};
 const oldRender=window.render;window.render=function(){oldRender();updateOptions();apply();};updateOptions();apply();
}

function installTravelHours(){
 const card=document.querySelector('#uren .gioClockCard');if(!card||document.getElementById('gioUurSoort'))return;
 const box=document.createElement('div');box.className='gioTravelOptions';box.innerHTML='<div class="row"><div><label>Soort uren</label><select id="gioUurSoort"><option value="werk">Werkuren</option><option value="reis">Reisuren</option></select></div><div><label>Reisuren doorberekenen?</label><select id="gioReisDoorberekenen"><option value="ja">Ja</option><option value="nee">Nee, alleen intern</option></select></div><div><label>Reistarief per uur</label><input id="gioReisTarief" type="number" step="0.01" value="35"></div></div>';
 card.insertBefore(box,document.getElementById('clockInBtn'));
 const soort=document.getElementById('gioUurSoort'),door=document.getElementById('gioReisDoorberekenen'),tarief=document.getElementById('gioReisTarief');
 function state(){const reis=soort.value==='reis';door.disabled=!reis;tarief.disabled=!reis;if(reis)uTarief.value=tarief.value;}
 soort.onchange=state;tarief.oninput=()=>{if(soort.value==='reis')uTarief.value=tarief.value};state();
 const original=window.saveUren;
 window.saveUren=function(){
   const before=(data.uren||[]).length;original();const item=(data.uren||[])[before];if(!item)return;
   item.soort=soort.value;item.reisDoorberekenen=soort.value==='reis'&&door.value==='ja';item.internBedrag=(+item.uren||0)*(+item.tarief||0);
   if(soort.value==='reis'&&door.value!=='ja')item.bedrag=0;
   save();render();
 };
}

function enhanceProjectCard(){
 const original=window.renderProjectkaartPro;if(typeof original!=='function')return;
 window.renderProjectkaartPro=function(){
   original();const sel=document.getElementById('proProjectSelect'),box=document.getElementById('proProjectContent');if(!sel||!box||!sel.value)return;
   const name=sel.value,uren=(data.uren||[]).filter(x=>x.project===name),mat=(data.materiaal||[]).filter(x=>x.project===name),km=(data.km||data.kilometers||[]).filter(x=>x.project===name),plan=(data.planning||[]).filter(x=>x.project===name);
   const reis=uren.filter(x=>x.soort==='reis'),werk=uren.filter(x=>x.soort!=='reis');
   const html=`<div class="card gioProjectDetailTable"><h2>📅 Alle dagen en registraties van deze klus</h2>
   <div class="gioProjectSummary"><div><small>Geplande dagen</small><b>${plan.length}</b></div><div><small>Werkuren</small><b>${werk.reduce((s,x)=>s+(+x.uren||0),0).toFixed(2)} u</b></div><div><small>Reisuren</small><b>${reis.reduce((s,x)=>s+(+x.uren||0),0).toFixed(2)} u</b></div><div><small>Materiaalregels</small><b>${mat.length}</b></div></div>
   <h3>Planning / werkdagen</h3>${plan.length?`<table><thead><tr><th>Datum</th><th>Tijd</th><th>Status</th><th>Notitie</th></tr></thead><tbody>${plan.map(x=>`<tr><td>${formatDateNL(x.datum)}</td><td>${esc(x.tijd||'-')}</td><td>${esc(x.status||'-')}</td><td>${esc(x.notitie||'')}</td></tr>`).join('')}</tbody></table>`:'Geen geplande dagen.'}
   <h3>Uren en reisuren</h3>${uren.length?`<table><thead><tr><th>Datum</th><th>Soort</th><th>Start</th><th>Einde</th><th>Uren</th><th>Doorberekend</th><th>Bedrag</th></tr></thead><tbody>${uren.map(x=>`<tr><td>${formatDateNL(x.datum)}</td><td>${x.soort==='reis'?'Reisuren':'Werkuren'}</td><td>${esc(x.start||'-')}</td><td>${esc(x.einde||'-')}</td><td>${(+x.uren||0).toFixed(2)}</td><td>${x.soort==='reis'?(x.reisDoorberekenen?'Ja':'Nee'):'Ja'}</td><td>${money(x.bedrag)}</td></tr>`).join('')}</tbody></table>`:'Geen uren.'}
   <h3>Materialen</h3>${mat.length?`<table><thead><tr><th>Datum</th><th>Leverancier</th><th>Materiaal</th><th>Bon</th><th>Bedrag</th></tr></thead><tbody>${mat.map(x=>`<tr><td>${formatDateNL(x.datum)}</td><td>${esc(x.lev||'-')}</td><td>${esc(x.oms||'-')}</td><td>${esc(x.bon||'-')}</td><td>${money(x.bedrag)}</td></tr>`).join('')}</tbody></table>`:'Geen materialen.'}</div>`;
   box.insertAdjacentHTML('beforeend',html);
 };
}

function mobileLayout(){
 const action=document.getElementById('gioActionDock');if(action){action.innerHTML='<button type="button" onclick="show(\'uren\',this)">⏱<br>Uren</button><button type="button" onclick="show(\'projectkaartpro\',this)">📋<br>Projectkaart</button><button type="button" onclick="show(\'materiaal\',this)">🧰<br>Materiaal</button><button type="button" onclick="show(\'uitgaven\',this)">💸<br>Uitgaven</button>';}
 const bottom=document.getElementById('gioBottomDock');if(bottom){bottom.innerHTML='<button type="button" class="active" onclick="show(\'dashboard\',this)">🏠<br>Home</button><button type="button" onclick="show(\'planning\',this)">📅<br>Agenda</button><button type="button" onclick="show(\'projecten\',this)">📁<br>Projecten</button><button type="button" onclick="show(\'klanten\',this)">👥<br>Klanten</button><button type="button" onclick="show(\'rapport\',this)">📊<br>Cijfers</button>';}
}

function init(){installBusinessCustomer();installTravelHours();enhanceProjectCard();installMaterialProjectOverview();mobileLayout();if(typeof render==='function')render();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
