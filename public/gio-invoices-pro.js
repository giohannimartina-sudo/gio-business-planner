
(function(){
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const eur=v=>new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR'}).format(+v||0);
function ensure(){
  if(!window.data)return false;
  if(!Array.isArray(data.facturen))data.facturen=[];
  if(!Array.isArray(data.klantBetalingen))data.klantBetalingen=[];
  if(!Array.isArray(data.offertes))data.offertes=[];
  if(!Array.isArray(data.projecten))data.projecten=[];
  if(!Array.isArray(data.klanten))data.klanten=[];
  return true;
}
function uid(){return Math.random().toString(36).slice(2,8).toUpperCase()+Date.now().toString(36).slice(-4).toUpperCase()}
function nextNumber(){
  const y=new Date().getFullYear();
  const nums=data.facturen.map(x=>String(x.nummer||'').match(/(\d+)$/)).filter(Boolean).map(m=>+m[1]);
  return `FAC-${y}-${String((Math.max(0,...nums)+1)).padStart(4,'0')}`;
}
function days(date){if(!date)return null;const a=new Date(date+'T12:00:00'),b=new Date();b.setHours(12,0,0,0);return Math.ceil((a-b)/86400000)}
let editId='',lines=[];
function inject(){
 if($('facturatiepro2'))return;
 const main=document.querySelector('main');if(!main)return;
 const s=document.createElement('section');s.id='facturatiepro2';s.className='page';
 s.innerHTML=`
 <div class="card"><h2>🧾 Facturatie PRO</h2>
 <div id="gioInvoiceSummary" class="gioInvoiceSummary"></div>
 <div class="row"><div><label>Zoeken</label><input id="gioInvoiceSearch" oninput="gioRenderInvoices()"></div><div><label>Status</label><select id="gioInvoiceStatusFilter" onchange="gioRenderInvoices()"><option value="">Alle</option><option>Concept</option><option>Verzonden</option><option>Deels betaald</option><option>Betaald</option><option>Te laat</option></select></div></div>
 <button class="btn" onclick="gioNewInvoice()">+ Nieuwe factuur</button><div id="gioInvoiceList"></div></div>

 <div id="gioInvoiceForm" class="card" style="display:none"><h2 id="gioInvoiceFormTitle">Nieuwe factuur</h2>
 <div class="row"><div><label>Factuurnummer</label><input id="gioInvoiceNumber" readonly></div><div><label>Klant</label><select id="gioInvoiceClient"></select></div><div><label>Project</label><select id="gioInvoiceProject"></select></div><div><label>Offerte</label><select id="gioInvoiceOffer"></select></div><div><label>Factuurdatum</label><input id="gioInvoiceDate" type="date"></div><div><label>Vervaldatum</label><input id="gioInvoiceDue" type="date"></div><div><label>Status</label><select id="gioInvoiceStatus"><option>Concept</option><option>Verzonden</option><option>Deels betaald</option><option>Betaald</option><option>Te laat</option></select></div></div>
 <label>Omschrijving</label><textarea id="gioInvoiceIntro"></textarea>
 <h3>Factuurregels</h3><div id="gioInvoiceLines" class="gioInvoiceLines"></div><button class="btn2" onclick="gioAddInvoiceLine()">+ Regel</button>
 <label>Betalingsvoorwaarden</label><textarea id="gioInvoiceTerms">Gelieve het factuurbedrag binnen 14 dagen over te maken onder vermelding van het factuurnummer.</textarea>
 <div class="gioInvoiceActions"><button class="btn" onclick="gioSaveInvoice()">💾 Opslaan</button><button class="btn2" onclick="gioPreviewInvoice()">👁 Voorbeeld</button><button class="btn2" onclick="gioCloseInvoiceForm()">Sluiten</button></div></div>

 <div id="gioPaymentPanel" class="card" style="display:none"><h2>💳 Betaling registreren</h2><input id="gioPaymentInvoiceId" type="hidden"><div id="gioPaymentInvoiceInfo"></div><div class="row"><div><label>Datum</label><input id="gioPaymentDate" type="date"></div><div><label>Bedrag</label><input id="gioPaymentAmount" type="number" step="0.01"></div><div><label>Betaalwijze</label><select id="gioPaymentMethod"><option>Bank</option><option>Contant</option><option>Pin</option><option>iDEAL</option><option>Overig</option></select></div><div><label>Referentie</label><input id="gioPaymentReference"></div></div><button class="btn" onclick="gioSavePayment()">Betaling opslaan</button><div id="gioPaymentHistory"></div></div>

 <div id="gioInvoicePrint" class="gioInvoicePaper" style="display:none"></div>`;
 main.appendChild(s);
 const nav=document.querySelector('aside nav');
 if(nav&&!([...nav.querySelectorAll('button')].some(b=>b.textContent.includes('Facturatie PRO')))){const b=document.createElement('button');b.textContent='🧾 Facturatie PRO';b.onclick=()=>{show('facturatiepro2',b);gioInvoicesInit()};nav.appendChild(b)}
}
function fill(){
 $('gioInvoiceClient').innerHTML='<option value="">Kies klant</option>'+data.klanten.map(k=>`<option>${esc(k.naam||'')}</option>`).join('');
 $('gioInvoiceProject').innerHTML='<option value="">Niet gekoppeld</option>'+data.projecten.map(p=>`<option>${esc(p.naam||p.project||'')}</option>`).join('');
 $('gioInvoiceOffer').innerHTML='<option value="">Niet gekoppeld</option>'+data.offertes.map(o=>`<option value="${esc(o.id)}">${esc(o.nummer)} — ${esc(o.klant)}</option>`).join('');
}
function renderLines(){
 $('gioInvoiceLines').innerHTML=lines.map((l,i)=>`<div class="gioInvoiceLine">
 <div><label>Omschrijving</label><input value="${esc(l.omschrijving)}" oninput="gioInvoiceLineChange(${i},'omschrijving',this.value)"></div>
 <div><label>Aantal</label><input type="number" step="0.01" value="${l.aantal}" oninput="gioInvoiceLineChange(${i},'aantal',this.value)"></div>
 <div><label>Prijs</label><input type="number" step="0.01" value="${l.prijs}" oninput="gioInvoiceLineChange(${i},'prijs',this.value)"></div>
 <div><label>BTW %</label><input type="number" value="${l.btw}" oninput="gioInvoiceLineChange(${i},'btw',this.value)"></div>
 <button class="del" onclick="gioDeleteInvoiceLine(${i})">🗑️</button></div>`).join('');
}
window.gioAddInvoiceLine=()=>{lines.push({omschrijving:'',aantal:1,prijs:0,btw:21});renderLines()}
window.gioDeleteInvoiceLine=i=>{lines.splice(i,1);renderLines()}
window.gioInvoiceLineChange=(i,k,v)=>{lines[i][k]=k==='omschrijving'?v:+v||0}
function totals(inv){
 let excl=0,btw=0;
 inv.regels.forEach(l=>{const base=(+l.aantal||0)*(+l.prijs||0);excl+=base;btw+=base*(+l.btw||0)/100});
 const paid=(data.klantBetalingen||[]).filter(p=>p.factuurId===inv.id).reduce((s,p)=>s+(+p.bedrag||0),0);
 return{excl,btw,incl:excl+btw,paid,open:Math.max(0,excl+btw-paid)};
}
function status(inv){
 const t=totals(inv),d=days(inv.vervaldatum);
 if(t.open<=0&&t.incl>0)return'Betaald';
 if(t.paid>0)return'Deels betaald';
 if(d!==null&&d<0)return'Te laat';
 return inv.status||'Concept';
}
window.gioNewInvoice=()=>{
 ensure();editId='';lines=[{omschrijving:'Arbeid en werkzaamheden',aantal:1,prijs:0,btw:21}];
 fill();$('gioInvoiceFormTitle').textContent='Nieuwe factuur';$('gioInvoiceNumber').value=nextNumber();$('gioInvoiceDate').value=new Date().toISOString().slice(0,10);const d=new Date();d.setDate(d.getDate()+14);$('gioInvoiceDue').value=d.toISOString().slice(0,10);$('gioInvoiceStatus').value='Concept';$('gioInvoiceIntro').value='';renderLines();$('gioInvoiceForm').style.display='block';$('gioInvoiceForm').scrollIntoView({behavior:'smooth'})
}
window.gioCloseInvoiceForm=()=>{$('gioInvoiceForm').style.display='none'}
window.gioSaveInvoice=()=>{
 ensure();const klant=$('gioInvoiceClient').value;if(!klant){alert('Kies klant');return}
 const old=data.facturen.find(x=>String(x.id)===String(editId));
 const inv={id:editId||uid(),nummer:$('gioInvoiceNumber').value,klant,project:$('gioInvoiceProject').value,offerteId:$('gioInvoiceOffer').value,datum:$('gioInvoiceDate').value,vervaldatum:$('gioInvoiceDue').value,status:$('gioInvoiceStatus').value,omschrijving:$('gioInvoiceIntro').value.trim(),regels:JSON.parse(JSON.stringify(lines)),voorwaarden:$('gioInvoiceTerms').value.trim(),historie:[...(old?.historie||[])]};
 inv.historie.unshift({tijd:new Date().toISOString(),actie:old?'Factuur gewijzigd':'Factuur aangemaakt'});
 const i=data.facturen.findIndex(x=>String(x.id)===String(inv.id));i>=0?data.facturen.splice(i,1,inv):data.facturen.unshift(inv);save();gioCloseInvoiceForm();gioRenderInvoices()
}
window.gioRenderInvoices=()=>{
 ensure();const q=($('gioInvoiceSearch')?.value||'').toLowerCase(),sf=$('gioInvoiceStatusFilter')?.value||'';
 const all=data.facturen.map(inv=>({...inv,calcStatus:status(inv)}));
 const rows=all.filter(inv=>(!sf||inv.calcStatus===sf)&&(!q||[inv.nummer,inv.klant,inv.project].join(' ').toLowerCase().includes(q)));
 const total=all.reduce((s,i)=>s+totals(i).incl,0),paid=all.reduce((s,i)=>s+totals(i).paid,0),open=all.reduce((s,i)=>s+totals(i).open,0),late=all.filter(i=>i.calcStatus==='Te laat').length;
 $('gioInvoiceSummary').innerHTML=`<div><small>Totaal gefactureerd</small><b>${eur(total)}</b></div><div><small>Betaald</small><b>${eur(paid)}</b></div><div><small>Openstaand</small><b>${eur(open)}</b></div><div><small>Te laat</small><b>${late}</b></div>`;
 $('gioInvoiceList').innerHTML=rows.length?rows.map(inv=>{const t=totals(inv),st=inv.calcStatus;return `<article class="gioInvoiceCard ${st==='Betaald'?'paid':st==='Te laat'?'overdue':''}"><div><b>${esc(inv.nummer)} — ${esc(inv.klant)}</b><br><small>${esc(inv.project||'')} • ${esc(st)} • vervalt ${esc(inv.vervaldatum||'-')}</small></div><div style="font-size:20px;color:#f4c400;font-weight:900">${eur(t.incl)}</div><div><small>Betaald ${eur(t.paid)} • Open ${eur(t.open)}</small></div><div class="gioInvoiceActions"><button onclick="gioEditInvoice('${inv.id}')">✏️</button><button onclick="gioPrintInvoice('${inv.id}')">🖨️ PDF/Print</button><button onclick="gioOpenPayment('${inv.id}')">💳 Betaling</button><button onclick="gioSendReminder('${inv.id}')">🔔 Herinnering</button><button class="del" onclick="gioDeleteInvoice('${inv.id}')">🗑️</button></div></article>`}).join(''):'<p>Nog geen facturen.</p>';
}
window.gioEditInvoice=id=>{const inv=data.facturen.find(x=>String(x.id)===String(id));if(!inv)return;editId=inv.id;fill();$('gioInvoiceFormTitle').textContent='Factuur bewerken';$('gioInvoiceNumber').value=inv.nummer;$('gioInvoiceClient').value=inv.klant;$('gioInvoiceProject').value=inv.project||'';$('gioInvoiceOffer').value=inv.offerteId||'';$('gioInvoiceDate').value=inv.datum||'';$('gioInvoiceDue').value=inv.vervaldatum||'';$('gioInvoiceStatus').value=inv.status||'Concept';$('gioInvoiceIntro').value=inv.omschrijving||'';$('gioInvoiceTerms').value=inv.voorwaarden||'';lines=JSON.parse(JSON.stringify(inv.regels||[]));renderLines();$('gioInvoiceForm').style.display='block';$('gioInvoiceForm').scrollIntoView({behavior:'smooth'})}
window.gioOpenPayment=id=>{const inv=data.facturen.find(x=>String(x.id)===String(id));if(!inv)return;const t=totals(inv);$('gioPaymentInvoiceId').value=id;$('gioPaymentDate').value=new Date().toISOString().slice(0,10);$('gioPaymentAmount').value=t.open.toFixed(2);$('gioPaymentInvoiceInfo').innerHTML=`<b>${esc(inv.nummer)} — ${esc(inv.klant)}</b><br>Openstaand: ${eur(t.open)}`;$('gioPaymentPanel').style.display='block';renderPayments(inv);$('gioPaymentPanel').scrollIntoView({behavior:'smooth'})}
function renderPayments(inv){const rows=data.klantBetalingen.filter(p=>p.factuurId===inv.id);$('gioPaymentHistory').innerHTML='<h3>Betalingen</h3>'+(rows.length?rows.map(p=>`<div class="gioPaymentRow">${esc(p.datum)} • ${eur(p.bedrag)} • ${esc(p.betaalwijze||'')} ${p.referentie?'• '+esc(p.referentie):''}</div>`).join(''):'Nog geen betalingen.')}
window.gioSavePayment=()=>{const id=$('gioPaymentInvoiceId').value,inv=data.facturen.find(x=>String(x.id)===String(id));if(!inv)return;const amount=+$('gioPaymentAmount').value||0;if(amount<=0){alert('Vul bedrag in');return}data.klantBetalingen.unshift({id:uid(),factuurId:id,project:inv.project,klant:inv.klant,datum:$('gioPaymentDate').value,bedrag:amount,betaalwijze:$('gioPaymentMethod').value,referentie:$('gioPaymentReference').value.trim()});inv.historie.unshift({tijd:new Date().toISOString(),actie:'Betaling geregistreerd: '+eur(amount)});save();renderPayments(inv);gioRenderInvoices()}
function invoiceHtml(inv){const k=data.klanten.find(x=>x.naam===inv.klant)||{},t=totals(inv);return `<div><img src="/gio-logo-192.png" style="width:55mm"><h1>FACTUUR</h1><h2>${esc(inv.nummer)}</h2><div style="display:flex;justify-content:space-between;gap:30px"><div><b>Van:</b><br>GIO Business Planner PRO</div><div><b>Aan:</b><br>${esc(inv.klant)}<br>${esc(k.adres||'')}<br>${esc(k.postcode||'')} ${esc(k.plaats||'')}</div></div><hr><p><b>Factuurdatum:</b> ${esc(inv.datum)}<br><b>Vervaldatum:</b> ${esc(inv.vervaldatum)}<br><b>Project:</b> ${esc(inv.project||'-')}</p><p>${esc(inv.omschrijving||'')}</p><table style="width:100%;border-collapse:collapse"><thead><tr><th style="text-align:left">Omschrijving</th><th>Aantal</th><th>Prijs</th><th>Totaal</th></tr></thead><tbody>${inv.regels.map(l=>`<tr><td style="padding:7px 0;border-bottom:1px solid #ddd">${esc(l.omschrijving)}</td><td>${l.aantal}</td><td>${eur(l.prijs)}</td><td>${eur(l.aantal*l.prijs)}</td></tr>`).join('')}</tbody></table><table style="margin-left:auto;width:320px"><tr><td>Subtotaal</td><td>${eur(t.excl)}</td></tr><tr><td>BTW</td><td>${eur(t.btw)}</td></tr><tr><td><b>Totaal</b></td><td><b>${eur(t.incl)}</b></td></tr><tr><td>Betaald</td><td>${eur(t.paid)}</td></tr><tr><td><b>Openstaand</b></td><td><b>${eur(t.open)}</b></td></tr></table><h3>Betalingsvoorwaarden</h3><p>${esc(inv.voorwaarden||'')}</p></div>`}
window.gioPrintInvoice=id=>{const inv=data.facturen.find(x=>String(x.id)===String(id));if(!inv)return;$('gioInvoicePrint').innerHTML=invoiceHtml(inv);$('gioInvoicePrint').style.display='block';window.print();setTimeout(()=>$('gioInvoicePrint').style.display='none',500)}
window.gioPreviewInvoice=()=>{const temp={id:'temp',nummer:$('gioInvoiceNumber').value,klant:$('gioInvoiceClient').value,project:$('gioInvoiceProject').value,datum:$('gioInvoiceDate').value,vervaldatum:$('gioInvoiceDue').value,omschrijving:$('gioInvoiceIntro').value,regels:lines,voorwaarden:$('gioInvoiceTerms').value};$('gioInvoicePrint').innerHTML=invoiceHtml(temp);$('gioInvoicePrint').style.display='block';window.print();setTimeout(()=>$('gioInvoicePrint').style.display='none',500)}
window.gioSendReminder=id=>{const inv=data.facturen.find(x=>String(x.id)===String(id));if(!inv)return;const k=data.klanten.find(x=>x.naam===inv.klant)||{},t=totals(inv);const subject=`Betalingsherinnering ${inv.nummer}`,body=`Beste ${inv.klant},\n\nVolgens onze administratie staat voor factuur ${inv.nummer} nog ${eur(t.open)} open. De vervaldatum was ${inv.vervaldatum}.\n\nMet vriendelijke groet,\nGIO`;if(k.email)location.href='mailto:'+encodeURIComponent(k.email)+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);else navigator.clipboard?.writeText(body).then(()=>alert('Herinnering gekopieerd. Geen e-mailadres gevonden.'))}
window.gioDeleteInvoice=id=>{if(!confirm('Factuur verwijderen?'))return;data.facturen=data.facturen.filter(x=>String(x.id)!==String(id));save();gioRenderInvoices()}
window.gioInvoicesInit=()=>{ensure();fill();gioRenderInvoices()}
function patchMenus(){const old=window.gioOpenMoreOverlay;window.gioOpenMoreOverlay=function(){old?.();setTimeout(()=>{const g=document.querySelector('#gioOverlayBody .gioOverlayGrid');if(g&&!g.textContent.includes('Facturatie PRO'))g.insertAdjacentHTML('beforeend',`<button onclick="gioApprovedGo('facturatiepro2');gioInvoicesInit()"><i>🧾</i>Facturatie PRO</button>`)},0)}}
function init(){ensure();inject();patchMenus();gioInvoicesInit();document.title='GIO Business Planner PRO — MOBILE DEV 014'}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',()=>setTimeout(init,1000)):setTimeout(init,1000);
})();
