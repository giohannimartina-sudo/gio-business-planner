
(function(){
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function ensure(){
  if(!window.data)return false;
  if(!Array.isArray(data.ritten))data.ritten=[];
  if(!data.activeRit)data.activeRit=null;
  return true;
}
function today(){return new Date().toISOString().slice(0,10)}
function now(){return new Date().toTimeString().slice(0,5)}
function num(v){const n=Number(v);return Number.isFinite(n)?n:0}
function lastOdo(v){
  const a=(data.ritten||[]).filter(r=>r.voertuig===v && num(r.eindstand)>0)
    .sort((x,y)=>String(x.datum||'').localeCompare(String(y.datum||'')) || String(x.eindtijd||'').localeCompare(String(y.eindtijd||'')));
  return a.length?num(a[a.length-1].eindstand):0;
}
function visibleRows(){
  const v=$('ritFilterVan')?.value||'',t=$('ritFilterTot')?.value||'',s=$('ritFilterSoort')?.value||'',q=($('ritZoek')?.value||'').toLowerCase();
  return (data.ritten||[]).filter(r=>
    (!v||r.datum>=v)&&(!t||r.datum<=t)&&(!s||r.soort===s)&&
    (!q||[r.voertuig,r.klant,r.project,r.van,r.naar,r.doel].join(' ').toLowerCase().includes(q))
  );
}
function warnings(list){
  const w=[];
  const sorted=[...list].sort((a,b)=>String(a.datum||'').localeCompare(String(b.datum||''))||String(a.starttijd||'').localeCompare(String(b.starttijd||'')));
  const prev={};
  sorted.forEach((r,i)=>{
    if(!r.datum)w.push(`Rit ${i+1}: datum ontbreekt`);
    if(!r.voertuig)w.push(`Rit ${i+1}: voertuig ontbreekt`);
    if(!r.van||!r.naar)w.push(`${r.datum||'Rit'}: vertrek of bestemming ontbreekt`);
    if(r.soort==='Zakelijk'&&!r.doel&&!r.klant&&!r.project)w.push(`${r.datum||'Rit'}: zakelijk doel/klant/project ontbreekt`);
    if(num(r.eindstand)<num(r.beginstand))w.push(`${r.datum||'Rit'}: eindstand lager dan beginstand`);
    const p=prev[r.voertuig];
    if(p && num(r.beginstand)!==num(p.eindstand)){
      w.push(`${r.datum||'Rit'} ${r.voertuig}: beginstand ${r.beginstand} sluit niet aan op vorige eindstand ${p.eindstand}`);
    }
    if(r.voertuig)prev[r.voertuig]=r;
  });
  return w;
}
function totals(list){
  let zak=0,priv=0,omweg=0;
  list.forEach(r=>{
    const km=num(r.km)||Math.max(0,num(r.eindstand)-num(r.beginstand));
    if(r.soort==='Zakelijk')zak+=km; else priv+=km;
    omweg+=num(r.priveOmweg);
  });
  return {zak,priv,omweg,total:zak+priv};
}
function inject(){
  if($('rittenregistratie'))return;
  const main=document.querySelector('main');if(!main)return;
  const s=document.createElement('section');s.id='rittenregistratie';s.className='page';
  s.innerHTML=`
  <div class="card">
    <h2>🚘 KM Registratie PRO</h2>
    <div id="ritActief"></div>
    <div class="gioKmBigActions">
      <button id="gioKmAanBtn" class="gioKmAan" onclick="gioRitStart()">▶ KM AAN</button>
      <button id="gioKmUitBtn" class="gioKmUit" onclick="gioRitStop()">■ KM UIT</button>
    </div>
    <div class="row">
      <div><label>Voertuig / kenteken</label><input id="ritVoertuig"></div>
      <div><label>Soort</label><select id="ritSoort"><option>Zakelijk</option><option>Privé</option></select></div>
      <div><label>Datum</label><input id="ritDatum" type="date"></div>
      <div><label>Beginstand</label><input id="ritBegin" type="number"></div>
      <div><label>Vertrek</label><input id="ritVan"></div>
      <div><label>Bestemming</label><input id="ritNaar"></div>
      <div><label>Klant</label><select id="ritKlant"></select></div>
      <div><label>Project</label><select id="ritProject"></select></div>
      <div><label>Doel rit</label><input id="ritDoel" placeholder="bijv. werkbezoek / materiaal halen"></div>
    </div>
  </div>

  <div class="card">
    <h2>KM UIT / correctie</h2>
    <input id="ritEditId" type="hidden">
    <div class="row">
      <div><label>Eindstand</label><input id="ritEind" type="number"></div>
      <div><label>Eindtijd</label><input id="ritEindtijd" type="time"></div>
      <div><label>Afwijkende route</label><input id="ritAfwijking"></div>
      <div><label>Privé omweg km</label><input id="ritPriveOmweg" type="number" value="0" step="0.1"></div>
    </div>
    <div class="gioTripActions">
      <button class="btn" onclick="gioRitStop()">■ Stop en opslaan</button>
      <button class="btn2" onclick="gioRitCorrectie()">💾 Wijziging opslaan</button>
    </div>
  </div>

  <div class="card">
    <h2>📊 Belasting / overzicht</h2>
    <div class="row">
      <div><label>Van</label><input id="ritFilterVan" type="date"></div>
      <div><label>Tot</label><input id="ritFilterTot" type="date"></div>
      <div><label>Soort</label><select id="ritFilterSoort"><option value="">Alle</option><option>Zakelijk</option><option>Privé</option></select></div>
      <div><label>Zoeken</label><input id="ritZoek"></div>
    </div>
    <div id="gioKmTotals" class="gioKmTotals"></div>
    <div class="gioTripActions">
      <button class="btn2" onclick="gioRenderRitten()">🔍 Filter / controle</button>
      <button class="btn" onclick="gioExportRittenExcel()">📊 Excel uitdraai</button>
      <button class="btn2" onclick="gioKmDitJaar()">📅 Dit jaar</button>
    </div>
    <div id="ritWarnings"></div>
    <div id="ritLijst"></div>
  </div>`;
  main.appendChild(s);
  const nav=document.querySelector('aside nav');
  if(nav&&!([...nav.querySelectorAll('button')].some(b=>b.textContent.includes('KM Registratie')))){
    const b=document.createElement('button');b.textContent='🚘 KM Registratie';b.onclick=()=>{show('rittenregistratie',b);gioRitInit()};nav.appendChild(b)
  }
}
function fill(){
  const c=(data.klanten||[]).map(x=>x.naam||x.name||'').filter(Boolean);
  const p=(data.projecten||[]).map(x=>x.naam||x.project||'').filter(Boolean);
  [['ritKlant',c],['ritProject',p]].forEach(([id,a])=>{
    const el=$(id); if(el)el.innerHTML='<option value="">Niet gekoppeld</option>'+a.map(v=>`<option>${esc(v)}</option>`).join('')
  });
}
function active(){
  const r=data.activeRit,e=$('ritActief');
  if(!e)return;
  e.innerHTML=r
    ?`<div class="gioTripActive"><b>🟢 KM REGISTRATIE ACTIEF</b><br>${esc(r.voertuig)} · ${esc(r.soort)} · gestart ${esc(r.starttijd)} · begin ${r.beginstand} km<br><small>${esc(r.van||'')} → ${esc(r.naar||'')}</small></div>`
    :'<div class="gioKmIdle">⚪ Geen rit actief</div>';
}
window.gioRitStart=()=>{
  ensure();
  if(data.activeRit){alert('Er staat al een rit aan. Stop die eerst met KM UIT.');return}
  const v=$('ritVoertuig').value.trim(),b=num($('ritBegin').value);
  if(!v||!b){alert('Vul voertuig en beginstand in.');return}
  const l=lastOdo(v);
  if(l&&l!==b&&!confirm(`Laatste geregistreerde eindstand is ${l} km.\nJe voert ${b} km in.\nToch KM AAN?`))return;
  data.activeRit={
    id:String(Date.now()),voertuig:v,soort:$('ritSoort').value,datum:$('ritDatum').value||today(),
    starttijd:now(),beginstand:b,van:$('ritVan').value.trim(),naar:$('ritNaar').value.trim(),
    klant:$('ritKlant').value,project:$('ritProject').value,doel:$('ritDoel').value.trim(),
    historie:[{tijd:new Date().toISOString(),actie:'KM AAN'}]
  };
  save();active();
  $('ritEind').value='';
  $('ritEindtijd').value='';
}
window.gioRitStop=()=>{
  ensure();
  const r=data.activeRit;
  if(!r){alert('Er staat geen rit aan.');return}
  const e=num($('ritEind').value);
  if(!e){alert('Vul de eindstand in.');return}
  if(e<r.beginstand){alert('Eindstand kan niet lager zijn dan beginstand.');return}
  Object.assign(r,{
    eindstand:e,eindtijd:$('ritEindtijd').value||now(),km:e-r.beginstand,
    afwijking:$('ritAfwijking').value.trim(),priveOmweg:num($('ritPriveOmweg').value)
  });
  r.historie.push({tijd:new Date().toISOString(),actie:'KM UIT'});
  data.ritten.unshift(r);data.activeRit=null;save();active();gioRenderRitten();
}
window.gioRitBewerk=id=>{
  const r=data.ritten.find(x=>x.id===id);if(!r)return;
  $('ritEditId').value=id;
  const map={Voertuig:'voertuig',Soort:'soort',Datum:'datum',Begin:'beginstand',Van:'van',Naar:'naar',Klant:'klant',Project:'project',Doel:'doel',Eind:'eindstand',Eindtijd:'eindtijd',Afwijking:'afwijking',PriveOmweg:'priveOmweg'};
  Object.entries(map).forEach(([suffix,key])=>{const el=$('rit'+suffix);if(el)el.value=r[key]??''});
  document.getElementById('rittenregistratie')?.scrollIntoView({behavior:'smooth',block:'start'});
}
window.gioRitCorrectie=()=>{
  const r=data.ritten.find(x=>x.id===$('ritEditId').value);if(!r){alert('Kies eerst een rit met ✏️.');return}
  const b=num($('ritBegin').value),e=num($('ritEind').value);
  if(e<b){alert('Eindstand lager dan beginstand.');return}
  const before=JSON.parse(JSON.stringify(r));
  Object.assign(r,{
    voertuig:$('ritVoertuig').value.trim(),soort:$('ritSoort').value,datum:$('ritDatum').value,
    beginstand:b,eindstand:e,km:e-b,van:$('ritVan').value.trim(),naar:$('ritNaar').value.trim(),
    klant:$('ritKlant').value,project:$('ritProject').value,doel:$('ritDoel').value.trim(),
    eindtijd:$('ritEindtijd').value,afwijking:$('ritAfwijking').value.trim(),priveOmweg:num($('ritPriveOmweg').value)
  });
  r.historie=r.historie||[];
  r.historie.push({tijd:new Date().toISOString(),actie:'Correctie',voor:before});
  save();$('ritEditId').value='';gioRenderRitten();alert('Correctie opgeslagen met historie.');
}
window.gioRitVerwijder=id=>{
  if(!confirm('Deze rit verwijderen?'))return;
  data.ritten=data.ritten.filter(x=>x.id!==id);save();gioRenderRitten()
}
window.gioRitKopieer=id=>{
  const r=data.ritten.find(x=>x.id===id);if(!r)return;
  $('ritVoertuig').value=r.voertuig;$('ritSoort').value=r.soort;$('ritDatum').value=today();
  $('ritBegin').value=r.eindstand;$('ritVan').value=r.naar;$('ritNaar').value='';
  $('ritKlant').value=r.klant||'';$('ritProject').value=r.project||'';$('ritDoel').value=r.doel||''
}
window.gioRenderRitten=()=>{
  const list=visibleRows(),t=totals(list),w=warnings(list);
  $('gioKmTotals').innerHTML=`
    <div><small>Zakelijk</small><b>${t.zak.toFixed(1)} km</b></div>
    <div><small>Privé</small><b>${t.priv.toFixed(1)} km</b></div>
    <div><small>Privé omweg</small><b>${t.omweg.toFixed(1)} km</b></div>
    <div><small>Totaal</small><b>${t.total.toFixed(1)} km</b></div>`;
  $('ritWarnings').innerHTML=w.length
    ?`<div class="gioKmWarning"><b>⚠️ ${w.length} controlepunt(en)</b><br>${w.slice(0,15).map(esc).join('<br>')}</div>`
    :'<div class="gioKmOk">✅ Ritten sluiten aan op de basiscontrole.</div>';
  $('ritLijst').innerHTML=list.map(r=>`
    <div class="gioTripCard ${r.soort==='Zakelijk'?'business':'private'}">
      <b>${esc(r.datum)} · ${esc(r.voertuig)}</b><br>
      ${esc(r.soort)} · ${r.beginstand} → ${r.eindstand} · <b>${num(r.km).toFixed(1)} km</b><br>
      ${esc(r.van)} → ${esc(r.naar)}
      ${r.doel?`<br><small>Doel: ${esc(r.doel)}</small>`:''}
      ${r.klant?`<br><small>Klant: ${esc(r.klant)}${r.project?' · '+esc(r.project):''}</small>`:''}
      <div class="gioTripActions">
        <button onclick="gioRitBewerk('${r.id}')">✏️ Wijzig</button>
        <button onclick="gioRitKopieer('${r.id}')">📋 Kopie</button>
        <button class="del" onclick="gioRitVerwijder('${r.id}')">🗑️</button>
      </div>
    </div>`).join('')||'<p>Nog geen ritten in deze selectie.</p>';
}
window.gioKmDitJaar=()=>{
  const y=new Date().getFullYear();
  $('ritFilterVan').value=`${y}-01-01`;$('ritFilterTot').value=`${y}-12-31`;gioRenderRitten()
}
window.gioExportRittenExcel=()=>{
  const list=visibleRows(),t=totals(list),w=warnings(list);
  const rows=[
    ['GIO KM Registratie PRO'],
    ['Exportdatum',new Date().toLocaleString('nl-NL')],
    ['Periode',$('ritFilterVan').value||'alles',$('ritFilterTot').value||'alles'],
    ['Zakelijk km',t.zak.toFixed(1)],['Privé km',t.priv.toFixed(1)],['Privé omweg km',t.omweg.toFixed(1)],['Totaal km',t.total.toFixed(1)],
    [],
    ['Datum','Voertuig','Soort','Starttijd','Eindtijd','Beginstand','Eindstand','KM','Vertrek','Bestemming','Klant','Project','Doel','Afwijking','Privé omweg km','Aantal correcties']
  ];
  list.forEach(r=>rows.push([
    r.datum,r.voertuig,r.soort,r.starttijd,r.eindtijd,r.beginstand,r.eindstand,r.km,r.van,r.naar,
    r.klant,r.project,r.doel,r.afwijking,r.priveOmweg,(r.historie||[]).filter(h=>h.actie==='Correctie'||h.actie==='Gewijzigd').length
  ]));
  rows.push([],['CONTROLEPUNTEN']);
  if(w.length)w.forEach(x=>rows.push([x]));else rows.push(['Geen controlepunten gevonden']);
  const html='<html><head><meta charset="utf-8"></head><body><table border="1">'+rows.map(r=>'<tr>'+r.map(v=>'<td>'+esc(v??'')+'</td>').join('')+'</tr>').join('')+'</table></body></html>';
  const blob=new Blob(['\ufeff'+html],{type:'application/vnd.ms-excel;charset=utf-8'}),u=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=u;a.download=`GIO_KM_REGISTRATIE_${$('ritFilterVan').value||'ALLE'}_${$('ritFilterTot').value||today()}.xls`;a.click();URL.revokeObjectURL(u);
}
window.gioRitInit=()=>{
  ensure();fill();
  $('ritDatum').value=$('ritDatum').value||today();
  const v=$('ritVoertuig').value.trim();
  if(v&&!$('ritBegin').value){const l=lastOdo(v);if(l)$('ritBegin').value=l}
  active();gioRenderRitten()
}
function patchMenu(){
  const old=window.gioOpenMoreOverlay;
  window.gioOpenMoreOverlay=function(){
    old?.();setTimeout(()=>{
      const g=document.querySelector('#gioOverlayBody .gioOverlayGrid');
      if(g&&!g.textContent.includes('KM Registratie'))g.insertAdjacentHTML('beforeend',`<button onclick="gioApprovedGo('rittenregistratie');gioRitInit()"><i>🚘</i>KM Registratie</button>`)
    },0)
  }
}
function init(){
  ensure();inject();patchMenu();
  document.title='GIO Business Planner PRO — MOBILE DEV 029';
  try{localStorage.setItem('gioMobileBuild','MOBILE DEV 029')}catch(e){}
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',()=>setTimeout(init,250)):setTimeout(init,250);
})();
