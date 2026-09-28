(function(){
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const eur=v=>new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR'}).format(Number(v)||0);

function ensure(){
 if(!window.data)return false;
 ['klanten','projecten','uren','materiaal','uitgaven','ritten','offertes','facturen','klantBetalingen'].forEach(k=>{if(!Array.isArray(data[k]))data[k]=[]});
 return true;
}
function names(){
 return {
  projects:new Set(data.projecten.map(p=>p.naam||p.project||p.titel).filter(Boolean)),
  clients:new Set(data.klanten.map(k=>k.naam||k.name).filter(Boolean))
 };
}
function integrity(){
 ensure();const {projects,clients}=names(),issues=[];
 data.uren.forEach((x,i)=>{const p=x.project||x.projectNaam;if(p&&!projects.has(p))issues.push(`Urenregel ${i+1}: project ontbreekt (${p})`)});
 data.materiaal.forEach((x,i)=>{const p=x.project||x.projectNaam;if(p&&!projects.has(p))issues.push(`Materiaal ${i+1}: project ontbreekt (${p})`)});
 data.offertes.forEach((x,i)=>{if(x.klant&&!clients.has(x.klant))issues.push(`Offerte ${x.nummer||i+1}: klant ontbreekt (${x.klant})`);if(x.project&&!projects.has(x.project))issues.push(`Offerte ${x.nummer||i+1}: project ontbreekt (${x.project})`)});
 data.facturen.forEach((x,i)=>{if(x.klant&&!clients.has(x.klant))issues.push(`Factuur ${x.nummer||i+1}: klant ontbreekt (${x.klant})`);if(x.project&&!projects.has(x.project))issues.push(`Factuur ${x.nummer||i+1}: project ontbreekt (${x.project})`)});
 data.klantBetalingen.forEach((x,i)=>{if(x.klant&&!clients.has(x.klant))issues.push(`Betaling ${i+1}: klant ontbreekt (${x.klant})`);if(x.project&&!projects.has(x.project))issues.push(`Betaling ${i+1}: project ontbreekt (${x.project})`);if(x.factuurId&&!data.facturen.some(f=>String(f.id)===String(x.factuurId)))issues.push(`Betaling ${i+1}: gekoppelde factuur ontbreekt`)});
 data.ritten.forEach((x,i)=>{if(x.project&&!projects.has(x.project))issues.push(`Rit ${i+1}: project ontbreekt (${x.project})`)});
 return issues;
}
function invoiceTotal(inv){let n=0;(inv.regels||[]).forEach(l=>{const b=(+l.aantal||0)*(+l.prijs||0);n+=b+b*(+l.btw||0)/100});return n}
function invoicePaid(id){return data.klantBetalingen.filter(p=>String(p.factuurId)===String(id)).reduce((s,p)=>s+(+p.bedrag||0),0)}

function patchInvoicePayment(){
 const old=window.gioSavePayment;
 if(typeof old!=='function'||old.__stability004)return;
 window.gioSavePayment=function(){
  ensure();
  const id=$('gioPaymentInvoiceId')?.value,inv=data.facturen.find(x=>String(x.id)===String(id));
  if(!inv)return old.apply(this,arguments);
  const amount=Number($('gioPaymentAmount')?.value)||0,open=Math.max(0,invoiceTotal(inv)-invoicePaid(id));
  if(amount<=0){alert('Vul een geldig bedrag in.');return}
  if(amount>open+0.005){alert('Betaling is hoger dan het openstaande factuurbedrag ('+eur(open)+').');return}
  const before=new Set(data.klantBetalingen.map(x=>String(x.id)));
  const result=old.apply(this,arguments);
  data.klantBetalingen.forEach(p=>{
   if(!before.has(String(p.id))&&String(p.factuurId)===String(id)){
    p.bron='factuur';p.soort=amount>=open-0.005?'Factuur volledig betaald':'Factuur deelbetaling';p.createdAt=p.createdAt||new Date().toISOString();
   }
  });
  save?.();return result;
 };
 window.gioSavePayment.__stability004=true;
}
function projectDirectPaid(name){
 return data.klantBetalingen.filter(b=>(b.project||b.projectNaam)===name&&!b.factuurId).reduce((s,b)=>s+(+b.bedrag||0),0)
}
function addPaymentWarning(){
 const sec=$('betalingenpro');if(!sec||$('gioPayStability004'))return;
 const x=document.createElement('div');x.id='gioPayStability004';x.className='card';
 x.innerHTML='<h3>✅ Betalingscontrole LIVE READY 004</h3><p>Factuurbetalingen en losse projectbetalingen worden apart gecontroleerd om dubbeltelling te voorkomen.</p>';
 sec.appendChild(x);
}
function addIntegrityPanel(){
 if($('gioIntegrity004'))return;
 const main=document.querySelector('main');if(!main)return;
 const sec=document.createElement('section');sec.id='gioIntegrity004';sec.className='page';
 sec.innerHTML=`<div class="card"><h2>🧪 Eindcontrole LIVE READY 004</h2><div id="gioIntegritySummary"></div><button class="btn" onclick="gioIntegrityRun004()">🔍 Volledige gegevenscontrole</button></div><div class="card"><h2>Controlepunten</h2><div id="gioIntegrityIssues004"></div></div>`;
 main.appendChild(sec);
 const nav=document.querySelector('aside nav');
 if(nav&&![...nav.querySelectorAll('button')].some(b=>b.textContent.includes('Eindcontrole'))){const b=document.createElement('button');b.textContent='🧪 Eindcontrole LIVE READY';b.onclick=()=>{show('gioIntegrity004',b);window.gioIntegrityRun004()};nav.appendChild(b)}
}
window.gioIntegrityRun004=()=>{
 ensure();const issues=integrity(),s=$('gioIntegritySummary'),b=$('gioIntegrityIssues004');
 const invoicePayments=data.klantBetalingen.filter(x=>x.factuurId).length,direct=data.klantBetalingen.filter(x=>!x.factuurId).length;
 if(s)s.innerHTML=`<div class="${issues.length?'gioGuardStatus warn':'gioGuardStatus ok'}"><b>${issues.length?'⚠️ '+issues.length+' aandachtspunt(en)':'✅ Geen ontbrekende koppelingen gevonden'}</b><br>Offertes: ${data.offertes.length} · Facturen: ${data.facturen.length} · Factuurbetalingen: ${invoicePayments} · Losse projectbetalingen: ${direct} · Ritten: ${data.ritten.length}</div>`;
 if(b)b.innerHTML=issues.length?issues.map(x=>'⚠️ '+esc(x)).join('<br>'):'✅ Klanten, projecten, offertes, facturen, betalingen en ritten zijn gekoppeld.';
 return issues;
};
function patch(){
 ensure();patchInvoicePayment();addPaymentWarning();addIntegrityPanel();
 try{localStorage.setItem('gioStabilityBuild','LIVE READY 004')}catch(e){}
}
let n=0;(function boot(){patch();if(++n<30)setTimeout(()=>{patchInvoicePayment();addPaymentWarning()},300)})();
})();