(function(){
'use strict';
const REQUIRED=['uren','klanten','facturen','offertes','planning','uitgaven','materiaal','projecten','vrijedagen','kmRegistraties','klantBetalingen'];
const $=id=>document.getElementById(id);
let pending=null,pendingName='';
function count(d){const o={};REQUIRED.forEach(k=>o[k]=Array.isArray(d?.[k])?d[k].length:0);return o}
function valid(d){return d&&typeof d==='object'&&REQUIRED.some(k=>Array.isArray(d[k]))}
function total(c){return Object.values(c).reduce((a,b)=>a+b,0)}
function summary(c){return REQUIRED.map(k=>`<div><b>${k}</b><span>${c[k]||0}</span></div>`).join('')}
function ensure(){
 if($('gioSafeImport006'))return true;
 const stab=[...document.querySelectorAll('section,.page')].find(x=>/Stabiliteit.*Back-up/i.test(x.textContent||'')) || document.querySelector('main');
 if(!stab)return false;
 const box=document.createElement('div');box.id='gioSafeImport006';box.className='card';
 box.innerHTML=`<h2>🔐 Veilige MASTER-import</h2>
 <p>Gebruik deze knop voor de oude/live JSON-backup. Er wordt eerst alleen gecontroleerd; er wordt nog niets gewijzigd.</p>
 <input id="gioMasterFile006" type="file" accept=".json,application/json" hidden>
 <button class="btn" onclick="document.getElementById('gioMasterFile006').click()">📂 MASTER-backup controleren</button>
 <div id="gioMasterCheck006" style="margin-top:12px"></div>`;
 stab.appendChild(box);
 $('gioMasterFile006').addEventListener('change',read);
 const st=document.createElement('style');st.textContent=`#gioMasterCheck006 .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin:12px 0}#gioMasterCheck006 .grid div{background:#171c24;padding:9px;border-radius:8px;display:flex;justify-content:space-between}.gioSafeOk{padding:10px;border:1px solid #22c55e;border-radius:9px}.gioSafeWarn{padding:10px;border:1px solid #f4c400;border-radius:9px}`;document.head.appendChild(st);
 return true;
}
async function read(e){
 const f=e.target.files?.[0];if(!f)return;
 const box=$('gioMasterCheck006');
 try{
  const d=JSON.parse(await f.text());
  if(!valid(d))throw new Error('Dit bestand bevat geen herkenbare GIO administratie.');
  pending=d;pendingName=f.name;const c=count(d);
  box.innerHTML=`<div class="gioSafeOk"><b>✅ Backup herkend: ${f.name}</b><br>${total(c)} records gevonden. Er is nog niets gewijzigd.</div><div class="grid">${summary(c)}</div><button class="btn" onclick="gioSafeMasterRestore006()">✅ Nu veilig lokaal herstellen</button> <button class="btn2" onclick="gioSafeMasterCancel006()">Annuleren</button><p><small>Cloud Sync wordt niet gebruikt door deze import. Maak na herstel eerst de Live Test.</small></p>`;
 }catch(err){pending=null;box.innerHTML=`<div class="gioSafeWarn">⚠️ ${err.message}</div>`}
}
window.gioSafeMasterCancel006=()=>{pending=null;pendingName='';if($('gioMasterCheck006'))$('gioMasterCheck006').innerHTML='Geannuleerd. Er is niets gewijzigd.'};
window.gioSafeMasterRestore006=()=>{
 if(!pending)return alert('Controleer eerst een MASTER-backup.');
 if(!confirm('Herstel de gecontroleerde MASTER-backup lokaal in deze PRO-app? Cloud wordt NIET overschreven.'))return;
 try{
   // Preserve the exact legacy object and feed the app's canonical local data slot.
   localStorage.setItem('gioData',JSON.stringify(pending));
   localStorage.setItem('gioDataV1',JSON.stringify(pending));
   localStorage.setItem('gioMasterData',JSON.stringify(pending));
   localStorage.setItem('gioLastSafeMasterImport',new Date().toISOString());
   // If current app exposes its in-memory data object, update it without changing source records.
   if(window.data&&typeof window.data==='object'){
     Object.keys(window.data).forEach(k=>delete window.data[k]);
     Object.assign(window.data,JSON.parse(JSON.stringify(pending)));
     if(typeof window.save==='function')window.save();
   }
   alert('MASTER-backup lokaal hersteld. De pagina wordt nu opnieuw geladen. Cloud is niet overschreven.');
   location.reload();
 }catch(e){alert('Herstel gestopt: '+e.message)}
};
let n=0;(function boot(){if(ensure())return;if(++n<80)setTimeout(boot,250)})();
})();