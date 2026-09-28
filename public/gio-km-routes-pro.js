(function(){
'use strict';
const $=id=>document.getElementById(id);let last=null,busy=false;
const fmt=n=>new Intl.NumberFormat('nl-NL',{minimumFractionDigits:1,maximumFractionDigits:1}).format(Number(n)||0);
async function calc(){
 if(busy)return;
 const origin=$('ritVan')?.value.trim(),destination=$('ritNaar')?.value.trim();
 if(!origin||!destination)return alert('Vul eerst vertrek en bestemming in.');
 busy=true;const btn=$('gioKmRouteBtn'),box=$('gioKmRouteResult');
 if(btn){btn.disabled=true;btn.textContent='Route berekenen…'};box.textContent='Google Maps route wordt berekend…';
 try{
  const r=await fetch('/api/km-route',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({origin,destination})});
  const j=await r.json();if(!r.ok)throw new Error(j.error+(j.detail?' — '+j.detail:''));
  last=j;box.innerHTML=`<div class="gioKmRouteStats"><div><small>Enkele reis</small><b>${fmt(j.km)} km</b></div><div><small>Reistijd</small><b>${j.minutes} min</b></div><div><small>Retour</small><b>${fmt(j.returnKm)} km</b></div></div><small>Google Maps is een route-indicatie. De echte kilometerstand bij KM UIT blijft leidend.</small>`;
 }catch(e){last=null;box.textContent='⚠️ '+e.message}
 finally{busy=false;if(btn){btn.disabled=false;btn.textContent='📍 Bereken route'}}
}
function use(retour){
 if(!last)return alert('Bereken eerst de route.');
 const km=retour?last.returnKm:last.km,begin=Number($('ritBegin')?.value)||0;
 if(!begin)return alert('Vul eerst de beginstand in.');
 $('ritEind').value=(begin+km).toFixed(1);
 $('ritAfwijking').value=`Google Maps indicatie: ${fmt(km)} km ${retour?'retour':'enkele reis'}`;
 alert(`Indicatie ${fmt(km)} km ingevuld. Controleer bij KM UIT altijd de echte kilometerstand.`);
}
function inject(){
 const sec=$('rittenregistratie');if(!sec||$('gioKmRouteBox'))return false;
 const card=sec.querySelector('.card');if(!card)return false;
 const box=document.createElement('div');box.id='gioKmRouteBox';box.className='gioKmRouteBox';
 box.innerHTML=`<div class="gioKmRouteHead"><h3>📍 Google Maps route</h3><button id="gioKmRouteBtn" class="btn2" onclick="gioKmRouteCalc()">📍 Bereken route</button></div><div id="gioKmRouteResult">Vul Vertrek en Bestemming in en bereken de route.</div><div class="gioKmRouteActions"><button class="btn2" onclick="gioKmUseRoute(false)">Gebruik enkele reis</button><button class="btn2" onclick="gioKmUseRoute(true)">Gebruik retour</button></div>`;
 card.appendChild(box);
 const st=document.createElement('style');st.textContent=`.gioKmRouteBox{margin-top:14px;padding:14px;border:1px solid #c99a2e;border-radius:14px;background:#11151b}.gioKmRouteHead,.gioKmRouteActions{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap}.gioKmRouteHead h3{margin:0;color:#f4c400}.gioKmRouteStats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:10px 0}.gioKmRouteStats>div{padding:10px;border-radius:10px;background:#1d232c}.gioKmRouteStats small,.gioKmRouteStats b{display:block}.gioKmRouteStats b{font-size:18px;color:#f4c400}@media(max-width:650px){.gioKmRouteStats{grid-template-columns:1fr}}`;
 document.head.appendChild(st);return true;
}
window.gioKmRouteCalc=calc;window.gioKmUseRoute=use;
let n=0;(function boot(){if(inject())return;if(++n<60)setTimeout(boot,250)})();
})();