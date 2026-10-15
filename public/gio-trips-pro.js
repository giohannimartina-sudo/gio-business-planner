
(function(){
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function ensure(){if(!window.data)return false;if(!Array.isArray(data.ritten))data.ritten=[];if(!Array.isArray(data.kmRegistraties))data.kmRegistraties=[];if(!data.activeRit)data.activeRit=null;return true}
function today(){return new Date().toISOString().slice(0,10)}
function now(){return new Date().toTimeString().slice(0,5)}
function lastOdo(v){const a=(data.ritten||[]).filter(r=>r.voertuig===v).sort((x,y)=>(x.datum+x.eindtijd).localeCompare(y.datum+y.eindtijd));return a.length?+a[a.length-1].eindstand||0:0}
function inject(){
 if($('rittenregistratie'))return;
 const main=document.querySelector('main');if(!main)return;
 const s=document.createElement('section');s.id='rittenregistratie';s.className='page';
 s.innerHTML=`<div class="card"><h2>🚘 Rittenregistratie PRO</h2><div id="ritActief"></div>
 <div class="row"><div><label>Voertuig / kenteken</label><input id="ritVoertuig"></div><div><label>Soort</label><select id="ritSoort"><option>Zakelijk</option><option>Privé</option></select></div><div><label>Datum</label><input id="ritDatum" type="date"></div><div><label>Beginstand</label><input id="ritBegin" type="number"></div><div><label>Vertrek</label><input id="ritVan"></div><div><label>Bestemming</label><input id="ritNaar"></div><div><label>Klant</label><select id="ritKlant"></select></div><div><label>Project</label><select id="ritProject"></select></div><div><label>Doel</label><input id="ritDoel"></div><div><label>KM-tarief €</label><input id="ritTarief" type="number" step="0.01" value="0.23"></div></div>
 <button class="btn" onclick="gioRitStart()">▶ Rit starten</button></div>
 <div class="card"><h2>Rit stoppen / corrigeren</h2><input id="ritEditId" type="hidden">
 <div class="row"><div><label>Eindstand</label><input id="ritEind" type="number"></div><div><label>Eindtijd</label><input id="ritEindtijd" type="time"></div><div><label>Afwijkende route</label><input id="ritAfwijking"></div><div><label>Privé omweg km</label><input id="ritPriveOmweg" type="number" value="0"></div></div>
 <div class="gioTripActions"><button class="btn" onclick="gioRitStop()">■ Stop en opslaan</button><button class="btn2" onclick="gioRitCorrectie()">💾 Wijziging opslaan</button><button class="btn2" onclick="gioRitReset()">↺ Reset actieve rit</button></div></div>
 <div class="card"><h2>✍️ Rit handmatig invoeren</h2><p>Voor een rit achteraf, zonder KM AAN.</p><div class="row">
 <div><label>Datum</label><input id="manDatum" type="date"></div><div><label>Voertuig</label><input id="manVoertuig"></div><div><label>Soort</label><select id="manSoort"><option>Zakelijk</option><option>Privé</option></select></div>
 <div><label>Van</label><input id="manVan"></div><div><label>Naar</label><input id="manNaar"></div><div><label>Klant</label><select id="manKlant"></select></div><div><label>Project</label><select id="manProject"></select></div>
 <div><label>Beginstand (optioneel)</label><input id="manBegin" type="number" step="0.1"></div><div><label>Eindstand (optioneel)</label><input id="manEind" type="number" step="0.1"></div>
 <div><label>Gereden km</label><input id="manKm" type="number" step="0.1"></div><div><label>Tarief €/km</label><input id="manTarief" type="number" step="0.01" value="0.23"></div><div><label>Doel</label><input id="manDoel"></div></div><button class="btn" onclick="gioRitHandmatig()">💾 Handmatige rit opslaan</button></div>
 <div class="card"><h2>Overzicht</h2><div class="row"><div><label>Van</label><input id="ritFilterVan" type="date"></div><div><label>Tot</label><input id="ritFilterTot" type="date"></div><div><label>Soort</label><select id="ritFilterSoort"><option value="">Alle</option><option>Zakelijk</option><option>Privé</option></select></div><div><label>Zoeken</label><input id="ritZoek"></div></div>
 <div class="gioTripActions"><button class="btn2" onclick="gioRenderRitten()">🔍 Filter</button><button class="btn" onclick="gioExportRittenExcel()">📊 Excel</button></div><div id="ritWarnings"></div><div id="ritLijst"></div></div>`;
 main.appendChild(s);
 const nav=document.querySelector('aside nav');if(nav){const b=document.createElement('button');b.textContent='🚘 Rittenregistratie';b.onclick=()=>{show('rittenregistratie',b);gioRitInit()};nav.appendChild(b)}
}
function fill(){const c=(data.klanten||[]).map(x=>x.naam||'').filter(Boolean),p=(data.projecten||[]).map(x=>x.naam||'').filter(Boolean);[['ritKlant',c],['ritProject',p],['manKlant',c],['manProject',p]].forEach(([id,a])=>{$(id).innerHTML='<option value="">Niet gekoppeld</option>'+a.map(v=>`<option>${esc(v)}</option>`).join('')})}
function active(){const r=data.activeRit;$('ritActief').innerHTML=r?`<div class="gioTripActive"><b>🟢 Rit actief</b><br>${esc(r.voertuig)} • ${esc(r.soort)} • ${r.beginstand} km</div>`:''}
window.gioRitStart=()=>{ensure();const v=$('ritVoertuig').value.trim(),b=+$('ritBegin').value||0;if(!v||!b){alert('Vul voertuig en beginstand in');return}const l=lastOdo(v);if(l&&l!==b&&!confirm(`Laatste eindstand was ${l}. Toch doorgaan?`))return;data.activeRit={id:String(Date.now()),voertuig:v,soort:$('ritSoort').value,datum:$('ritDatum').value||today(),starttijd:now(),beginstand:b,van:$('ritVan').value,naar:$('ritNaar').value,klant:$('ritKlant').value,project:$('ritProject').value,doel:$('ritDoel').value,tarief:+$('ritTarief').value||0,historie:[{tijd:new Date().toISOString(),actie:'Gestart'}]};save();active()}
function saveRit(r){if(!data.ritten.some(x=>String(x.id)===String(r.id)))data.ritten.unshift(r);if(r.soort==='Zakelijk'&&r.km>0){const id='rit:'+r.id;const x={id,ritId:r.id,bron:'rittenregistratie',datum:r.datum,klant:r.klant||'',project:r.project||'',van:r.van||'',naar:r.naar||'',km:r.km,tarief:r.tarief||0,bedrag:r.km*(r.tarief||0),omschrijving:r.doel||'KM-vergoeding'};const i=data.kmRegistraties.findIndex(v=>String(v.id)===id);if(i<0)data.kmRegistraties.push(x);else data.kmRegistraties[i]=x}}
window.gioRitStop=()=>{
  if(!ensure())return alert('KM-gegevens zijn niet geladen.');
  const r=data.activeRit;
  if(!r)return alert('Geen actieve rit.');
  const raw=String($('ritEind')?.value??'').trim().replace(',','.');
  const e=Number(raw),begin=Number(String(r.beginstand).replace(',','.'));
  if(!raw||!Number.isFinite(e)||!Number.isFinite(begin)||e<begin)return alert('Vul een geldige eindstand in.');
  const rate=Number(String($('ritTarief')?.value||r.tarief||'0.23').replace(',','.'));
  const done={...r,eindstand:e,eindtijd:$('ritEindtijd')?.value||now(),km:Math.round((e-begin)*10)/10,tarief:Number.isFinite(rate)?rate:0.23,afwijking:$('ritAfwijking')?.value||'',priveOmweg:Number($('ritPriveOmweg')?.value)||0,historie:[...(r.historie||[]),{tijd:new Date().toISOString(),actie:'KM UIT'}]};
  try{
    saveRit(done);
    data.activeRit=null;
    save();
    active();
    gioRenderRitten();
    if($('ritEind'))$('ritEind').value='';
    alert('Rit opgeslagen: '+done.km.toFixed(1)+' km, € '+(done.km*done.tarief).toFixed(2));
  }catch(err){
    console.error('GIO KM UIT opslaan mislukt',err);
    alert('KM UIT kon niet worden opgeslagen: '+(err?.message||String(err))+' — maak eerst een backup.');
  }
};
window.gioRitReset=()=>{if(!data.activeRit)return alert('Geen actieve rit');if(!confirm('Actieve rit resetten zonder nieuwe registratie?'))return;data.activeRit=null;save();active()};
window.gioRitHandmatig=()=>{ensure();const b=$('manBegin').value.trim(),e=$('manEind').value.trim();let km=Number($('manKm').value);if(!km&&b&&e)km=Number(e)-Number(b);if(!Number.isFinite(km)||km<=0)return alert('Vul een geldig aantal kilometers in');const r={id:'M'+Date.now(),handmatig:true,datum:$('manDatum').value||today(),voertuig:$('manVoertuig').value||'Niet ingevuld',soort:$('manSoort').value,beginstand:b||'',eindstand:e||'',km,tarief:Number($('manTarief').value)||0,van:$('manVan').value,naar:$('manNaar').value,klant:$('manKlant').value,project:$('manProject').value,doel:$('manDoel').value,historie:[{tijd:new Date().toISOString(),actie:'Handmatig'}]};saveRit(r);save();gioRenderRitten();alert('Handmatige rit opgeslagen')};

function rows(){const v=$('ritFilterVan').value,t=$('ritFilterTot').value,s=$('ritFilterSoort').value,q=$('ritZoek').value.toLowerCase();return data.ritten.filter(r=>(!v||r.datum>=v)&&(!t||r.datum<=t)&&(!s||r.soort===s)&&(!q||[r.voertuig,r.klant,r.project,r.van,r.naar,r.doel].join(' ').toLowerCase().includes(q)))}
window.gioRenderRitten=()=>{$('ritLijst').innerHTML=rows().map(r=>`<div class="gioTripCard ${r.soort==='Zakelijk'?'business':'private'}"><b>${esc(r.datum)} • ${esc(r.voertuig)}</b><br>${esc(r.soort)} • ${r.beginstand} → ${r.eindstand} • <b>${r.km} km</b><br>${esc(r.van)} → ${esc(r.naar)}<div class="gioTripActions"><button onclick="gioRitBewerk('${r.id}')">✏️</button><button onclick="gioRitKopieer('${r.id}')">📋</button><button class="del" onclick="gioRitVerwijder('${r.id}')">🗑️</button></div></div>`).join('')||'<p>Nog geen ritten.</p>'}
window.gioRitBewerk=id=>{const r=data.ritten.find(x=>x.id===id);if(!r)return;$('ritEditId').value=id;['Voertuig','Soort','Datum','Begin','Van','Naar','Klant','Project','Doel','Eind','Eindtijd','Afwijking','PriveOmweg'].forEach(k=>{const e=$('rit'+k);if(e)e.value=r[k.charAt(0).toLowerCase()+k.slice(1)]??''})}
window.gioRitCorrectie=()=>{const r=data.ritten.find(x=>x.id===$('ritEditId').value);if(!r)return;const before=JSON.stringify(r),b=+$('ritBegin').value||0,e=+$('ritEind').value||0;if(e<b){alert('Eindstand lager dan beginstand');return}Object.assign(r,{voertuig:$('ritVoertuig').value,soort:$('ritSoort').value,datum:$('ritDatum').value,beginstand:b,eindstand:e,km:e-b,van:$('ritVan').value,naar:$('ritNaar').value,klant:$('ritKlant').value,project:$('ritProject').value,doel:$('ritDoel').value,eindtijd:$('ritEindtijd').value,afwijking:$('ritAfwijking').value,priveOmweg:+$('ritPriveOmweg').value||0});r.historie=r.historie||[];r.historie.push({tijd:new Date().toISOString(),actie:'Gewijzigd',voor:before});saveRit(r);save();gioRenderRitten()}
window.gioRitKopieer=id=>{const r=data.ritten.find(x=>x.id===id);if(!r)return;$('ritVoertuig').value=r.voertuig;$('ritSoort').value=r.soort;$('ritDatum').value=today();$('ritBegin').value=r.eindstand;$('ritVan').value=r.naar;$('ritNaar').value='';$('ritKlant').value=r.klant;$('ritProject').value=r.project;$('ritDoel').value=r.doel}
window.gioRitVerwijder=id=>{if(!confirm('Deze rit verwijderen?'))return;data.ritten=data.ritten.filter(x=>String(x.id)!==String(id));data.kmRegistraties=data.kmRegistraties.filter(x=>String(x.ritId)!==String(id));save();gioRenderRitten()}
window.gioExportRittenExcel=()=>{const h=['Datum','Voertuig','Soort','Start','Einde','Beginstand','Eindstand','KM','Vertrek','Bestemming','Klant','Project','Doel'];const a=[h,...rows().map(r=>[r.datum,r.voertuig,r.soort,r.starttijd,r.eindtijd,r.beginstand,r.eindstand,r.km,r.van,r.naar,r.klant,r.project,r.doel])];const html='<table border="1">'+a.map(x=>'<tr>'+x.map(v=>'<td>'+esc(v||'')+'</td>').join('')+'</tr>').join('')+'</table>';const blob=new Blob([html],{type:'application/vnd.ms-excel'}),u=URL.createObjectURL(blob),l=document.createElement('a');l.href=u;l.download='GIO_Ritten_'+today()+'.xls';l.click();URL.revokeObjectURL(u)}
window.gioRitInit=()=>{ensure();fill();$('ritDatum').value=$('ritDatum').value||today();if(!$('manDatum').value)$('manDatum').value=today();active();gioRenderRitten()}
function patchMenu(){const old=window.gioOpenMoreOverlay;window.gioOpenMoreOverlay=function(){old?.();setTimeout(()=>{const g=document.querySelector('#gioOverlayBody .gioOverlayGrid');if(g&&!g.textContent.includes('Rittenregistratie'))g.insertAdjacentHTML('beforeend',`<button onclick="gioApprovedGo('rittenregistratie');gioRitInit()"><i>🚘</i>Rittenregistratie</button>`)},0)}}
function init(){ensure();inject();patchMenu();const r=data.activeRit;if(r&&r.eindtijd&&r.eindstand&&(r.historie||[]).some(h=>h.actie==='KM UIT'||h.actie==='Gestopt')){saveRit(r);data.activeRit=null;save()}document.title='GIO Business Planner PRO'}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',()=>setTimeout(init,200)):setTimeout(init,200)
})();
