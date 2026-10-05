(function(){
'use strict';
const $=id=>document.getElementById(id);
const n=v=>{const x=Number(String(v??'').replace(',','.'));return Number.isFinite(x)?x:0};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const today=()=>new Date().toISOString().slice(0,10), now=()=>new Date().toTimeString().slice(0,5);
function ensure(){if(!window.data)return false;if(!Array.isArray(data.ritten))data.ritten=[];if(!Array.isArray(data.kmRegistraties))data.kmRegistraties=[];return true}
function store(r){if(!data.ritten.some(x=>String(x.id)===String(r.id)))data.ritten.unshift(r);if(r.soort==='Zakelijk'&&n(r.km)>0){const id='rit:'+r.id,t=n(r.tarief),x={id,ritId:r.id,bron:'rittenregistratie',datum:r.datum,klant:r.klant||'',project:r.project||'',van:r.van||'',naar:r.naar||'',km:n(r.km),tarief:t,bedrag:n(r.km)*t,omschrijving:r.doel||'KM-vergoeding'};const i=data.kmRegistraties.findIndex(k=>String(k.id)===id);i>=0?data.kmRegistraties.splice(i,1,x):data.kmRegistraties.push(x)}}
function redraw(){try{gioRitInit()}catch(e){}try{gioRenderRitten()}catch(e){}}
function stop(){
 if(!ensure())return;const r=data.activeRit;if(!r)return alert('Er staat geen rit aan.');
 const e=n($('ritEind')?.value);if(!e)return alert('Vul de eindstand in.');if(e<n(r.beginstand))return alert('Eindstand kan niet lager zijn dan beginstand.');
 const done={...r,eindstand:e,eindtijd:$('ritEindtijd')?.value||now(),km:e-n(r.beginstand),afwijking:$('ritAfwijking')?.value.trim()||'',priveOmweg:n($('ritPriveOmweg')?.value),tarief:n($('ritTarief')?.value||r.tarief||.23)};
 done.historie=[...(r.historie||[]),{tijd:new Date().toISOString(),actie:'KM UIT'}];store(done);data.activeRit=null;save();if($('ritEind'))$('ritEind').value='';if($('ritEindtijd'))$('ritEindtijd').value='';redraw();alert('Rit gestopt en opgeslagen.');
}
function reset(){if(!data.activeRit)return alert('Er staat geen actieve rit.');if(!confirm('Vastgelopen actieve rit resetten?'))return;data.activeRit=null;save();redraw();alert('Actieve rit is gereset.')}
function manualUI(){
 const sec=$('rittenregistratie');if(!sec||$('gioManualKmCard'))return;
 const card=document.createElement('div');card.id='gioManualKmCard';card.className='card';
 card.innerHTML=`<h2>✍️ Rit handmatig invoeren</h2><p>Voor administratie achteraf. KM AAN wordt hierbij niet geactiveerd.</p><div class="row">
 <div><label>Datum</label><input id="manDatum" type="date" value="${today()}"></div><div><label>Voertuig / kenteken</label><input id="manVoertuig"></div>
 <div><label>Soort</label><select id="manSoort"><option>Zakelijk</option><option>Privé</option></select></div><div><label>Van</label><input id="manVan"></div><div><label>Naar</label><input id="manNaar"></div>
 <div><label>Klant</label><select id="manKlant"></select></div><div><label>Project</label><select id="manProject"></select></div>
 <div><label>Beginstand (optioneel)</label><input id="manBegin" type="number" step="0.1"></div><div><label>Eindstand (optioneel)</label><input id="manEind" type="number" step="0.1"></div>
 <div><label>Gereden km</label><input id="manKm" type="number" step="0.1"></div><div><label>KM-tarief €</label><input id="manTarief" type="number" step="0.01" value="0.23"></div><div><label>Doel / notitie</label><input id="manDoel"></div>
 </div><button class="btn" onclick="gioRitHandmatigOpslaan()">💾 Handmatige rit opslaan</button>`;
 const cards=sec.querySelectorAll('.card');cards[Math.min(2,cards.length-1)]?.after(card);
 const cs=(data.klanten||[]).map(x=>x.naam||x.name||'').filter(Boolean),ps=(data.projecten||[]).map(x=>x.naam||x.project||'').filter(Boolean);
 $('manKlant').innerHTML='<option value="">Niet gekoppeld</option>'+cs.map(v=>`<option>${esc(v)}</option>`).join('');
 $('manProject').innerHTML='<option value="">Niet gekoppeld</option>'+ps.map(v=>`<option>${esc(v)}</option>`).join('');
}
function addReset(){const a=document.querySelector('#rittenregistratie .gioTripActions');if(!a||$('gioKmResetBtn'))return;const b=document.createElement('button');b.id='gioKmResetBtn';b.className='btn2';b.textContent='↺ Actieve rit resetten';b.onclick=reset;a.appendChild(b)}
window.gioRitHandmatigOpslaan=()=>{ensure();let b=n($('manBegin').value),e=n($('manEind').value),km=n($('manKm').value);if(!km&&b&&e>=b)km=e-b;if(!(km>0))return alert('Vul gereden km in, of begin- en eindstand.');const r={id:'M'+Date.now(),handmatig:true,datum:$('manDatum').value||today(),voertuig:$('manVoertuig').value.trim()||'Handmatig',soort:$('manSoort').value,beginstand:b||'',eindstand:e||'',km,van:$('manVan').value.trim(),naar:$('manNaar').value.trim(),klant:$('manKlant').value,project:$('manProject').value,doel:$('manDoel').value.trim(),tarief:n($('manTarief').value),historie:[{tijd:new Date().toISOString(),actie:'Handmatig ingevoerd'}]};store(r);save();redraw();alert('Handmatige rit opgeslagen.')}
function install(){if(!ensure()||typeof window.gioRitStop!=='function')return false;window.gioRitStop=stop;window.gioRitReset=reset;const r=data.activeRit;if(r&&n(r.eindstand)>=n(r.beginstand)&&r.eindtijd&&(r.historie||[]).some(h=>h.actie==='KM UIT')){store(r);data.activeRit=null;save()}manualUI();addReset();try{localStorage.setItem('gioKmHotfix','033')}catch(e){}return true}
let c=0,t=setInterval(()=>{if(install()||++c>120)clearInterval(t)},250);new MutationObserver(()=>{manualUI();addReset()}).observe(document.documentElement,{childList:true,subtree:true});
})();