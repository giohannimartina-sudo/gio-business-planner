
(function(){
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const eur=v=>new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR'}).format(+v||0);
function ensure(){
  if(!window.data)return false;
  if(!Array.isArray(data.offertes))data.offertes=[];
  if(!Array.isArray(data.klanten))data.klanten=[];
  if(!Array.isArray(data.projecten))data.projecten=[];
  return true;
}
function uid(){return Math.random().toString(36).slice(2,8).toUpperCase()+Date.now().toString(36).slice(-4).toUpperCase()}
function nextNumber(){
  const y=new Date().getFullYear();
  const nums=data.offertes.map(x=>String(x.nummer||'').match(/(\d+)$/)).filter(Boolean).map(m=>+m[1]);
  return `OFF-${y}-${String((Math.max(0,...nums)+1)).padStart(4,'0')}`;
}
let editId='', lines=[], options=[], photoData='', photoName='';
function inject(){
 if($('offertespro'))return;
 const main=document.querySelector('main');if(!main)return;
 const s=document.createElement('section');s.id='offertespro';s.className='page';
 s.innerHTML=`
 <div class="card"><h2>📄 Offerte PRO</h2>
 <div class="row"><div><label>Zoeken</label><input id="gioOfferSearch" oninput="gioRenderOffers()"></div><div><label>Status</label><select id="gioOfferStatusFilter" onchange="gioRenderOffers()"><option value="">Alle</option><option>Concept</option><option>Verzonden</option><option>Akkoord</option><option>Afgewezen</option><option>Verlopen</option></select></div></div>
 <button class="btn" onclick="gioNewOffer()">+ Nieuwe offerte</button><div id="gioOfferList"></div></div>

 <div id="gioOfferForm" class="card" style="display:none"><h2 id="gioOfferFormTitle">Nieuwe offerte</h2>
 <div class="row"><div><label>Offertenummer</label><input id="gioOfferNumber" readonly></div><div><label>Klant</label><select id="gioOfferClient"></select></div><div><label>Project</label><select id="gioOfferProject"></select></div><div><label>Datum</label><input id="gioOfferDate" type="date"></div><div><label>Geldig t/m</label><input id="gioOfferValid" type="date"></div><div><label>Status</label><select id="gioOfferStatus"><option>Concept</option><option>Verzonden</option><option>Akkoord</option><option>Afgewezen</option><option>Verlopen</option></select></div></div>
 <label>Titel</label><input id="gioOfferTitle" placeholder="Bijv. Renovatie badkamer">
 <label>Inleiding / omschrijving</label><textarea id="gioOfferIntro"></textarea>
 <h3>Offertregels</h3><div id="gioOfferLines" class="gioOfferLines"></div><button class="btn2" onclick="gioAddOfferLine()">+ Regel</button>
 <h3>Opties</h3><div id="gioOfferOptions"></div><button class="btn2" onclick="gioAddOfferOption()">+ Optie</button>
 <h3>Foto / bijlage</h3><input id="gioOfferPhoto" type="file" accept="image/*" onchange="gioOfferPhotoChoose(event)"><div id="gioOfferPhotoPreview"></div>
 <label>Voorwaarden / opmerkingen</label><textarea id="gioOfferTerms">Prijzen zijn inclusief BTW tenzij anders vermeld. Geldig tot de hierboven genoemde datum.</textarea>
 <div class="gioOfferActions"><button class="btn" onclick="gioSaveOffer()">💾 Opslaan</button><button class="btn2" onclick="gioPreviewOffer()">👁 Voorbeeld</button><button class="btn2" onclick="gioCloseOfferForm()">Sluiten</button></div></div>

 <div id="gioOfferPrint" class="gioOfferPaper" style="display:none"></div>`;
 main.appendChild(s);
 const nav=document.querySelector('aside nav');
 if(nav&&!([...nav.querySelectorAll('button')].some(b=>b.textContent.includes('Offerte PRO')))){const b=document.createElement('button');b.textContent='📄 Offerte PRO';b.onclick=()=>{show('offertespro',b);gioOffersInit()};nav.appendChild(b)}
}
function fill(){
 $('gioOfferClient').innerHTML='<option value="">Kies klant</option>'+data.klanten.map(k=>`<option>${esc(k.naam||'')}</option>`).join('');
 $('gioOfferProject').innerHTML='<option value="">Niet gekoppeld</option>'+data.projecten.map(p=>`<option>${esc(p.naam||p.project||'')}</option>`).join('');
}
function renderLines(){
 $('gioOfferLines').innerHTML=lines.map((l,i)=>`<div class="gioOfferLine">
 <div><label>Omschrijving</label><input value="${esc(l.omschrijving)}" oninput="gioOfferLineChange(${i},'omschrijving',this.value)"></div>
 <div><label>Aantal</label><input type="number" step="0.01" value="${l.aantal}" oninput="gioOfferLineChange(${i},'aantal',this.value)"></div>
 <div><label>Prijs</label><input type="number" step="0.01" value="${l.prijs}" oninput="gioOfferLineChange(${i},'prijs',this.value)"></div>
 <div><label>BTW %</label><input type="number" value="${l.btw}" oninput="gioOfferLineChange(${i},'btw',this.value)"></div>
 <button class="del" onclick="gioDeleteOfferLine(${i})">🗑️</button></div>`).join('');
}
function renderOptions(){
 $('gioOfferOptions').innerHTML=options.map((o,i)=>`<div class="gioOfferOption"><div class="row"><div><label>Optie</label><input value="${esc(o.naam)}" oninput="gioOfferOptionChange(${i},'naam',this.value)"></div><div><label>Meerprijs</label><input type="number" step="0.01" value="${o.prijs}" oninput="gioOfferOptionChange(${i},'prijs',this.value)"></div></div><button class="del" onclick="gioDeleteOfferOption(${i})">🗑️</button></div>`).join('');
}
window.gioAddOfferLine=()=>{lines.push({omschrijving:'',aantal:1,prijs:0,btw:21});renderLines()}
window.gioDeleteOfferLine=i=>{lines.splice(i,1);renderLines()}
window.gioOfferLineChange=(i,k,v)=>{lines[i][k]=k==='omschrijving'?v:+v||0}
window.gioAddOfferOption=()=>{options.push({naam:'',prijs:0});renderOptions()}
window.gioDeleteOfferOption=i=>{options.splice(i,1);renderOptions()}
window.gioOfferOptionChange=(i,k,v)=>{options[i][k]=k==='naam'?v:+v||0}
window.gioOfferPhotoChoose=e=>{const f=e.target.files?.[0];if(!f)return;photoName=f.name;const r=new FileReader();r.onload=()=>{photoData=r.result;$('gioOfferPhotoPreview').innerHTML=`<img src="${photoData}" style="max-width:260px;border-radius:12px;margin-top:8px">`};r.readAsDataURL(f)}
window.gioNewOffer=()=>{
 ensure();editId='';lines=[{omschrijving:'Arbeid',aantal:1,prijs:0,btw:21}];options=[];photoData='';photoName='';
 fill();$('gioOfferFormTitle').textContent='Nieuwe offerte';$('gioOfferNumber').value=nextNumber();$('gioOfferDate').value=new Date().toISOString().slice(0,10);const d=new Date();d.setDate(d.getDate()+30);$('gioOfferValid').value=d.toISOString().slice(0,10);$('gioOfferStatus').value='Concept';$('gioOfferTitle').value='';$('gioOfferIntro').value='';$('gioOfferPhotoPreview').innerHTML='';renderLines();renderOptions();$('gioOfferForm').style.display='block';$('gioOfferForm').scrollIntoView({behavior:'smooth'})
}
window.gioCloseOfferForm=()=>{$('gioOfferForm').style.display='none'}
function totals(o){
 let excl=0,btw=0;
 o.regels.forEach(l=>{const base=(+l.aantal||0)*(+l.prijs||0);excl+=base;btw+=base*(+l.btw||0)/100});
 return{excl,btw,incl:excl+btw};
}
window.gioSaveOffer=()=>{
 ensure();const klant=$('gioOfferClient').value;if(!klant){alert('Kies klant');return}
 const old=data.offertes.find(x=>String(x.id)===String(editId));
 const o={id:editId||uid(),nummer:$('gioOfferNumber').value,klant,project:$('gioOfferProject').value,datum:$('gioOfferDate').value,geldigTot:$('gioOfferValid').value,status:$('gioOfferStatus').value,titel:$('gioOfferTitle').value.trim(),inleiding:$('gioOfferIntro').value.trim(),regels:JSON.parse(JSON.stringify(lines)),opties:JSON.parse(JSON.stringify(options)),voorwaarden:$('gioOfferTerms').value.trim(),foto:photoData||(old?.foto||''),fotoNaam:photoName||(old?.fotoNaam||''),historie:[...(old?.historie||[])]};
 o.historie.unshift({tijd:new Date().toISOString(),actie:old?'Offerte gewijzigd':'Offerte aangemaakt'});
 const i=data.offertes.findIndex(x=>String(x.id)===String(o.id));i>=0?data.offertes.splice(i,1,o):data.offertes.unshift(o);save();gioCloseOfferForm();gioRenderOffers()
}
window.gioRenderOffers=()=>{
 ensure();const q=($('gioOfferSearch')?.value||'').toLowerCase(),st=$('gioOfferStatusFilter')?.value||'';
 const rows=data.offertes.filter(o=>(!st||o.status===st)&&(!q||[o.nummer,o.klant,o.project,o.titel].join(' ').toLowerCase().includes(q)));
 $('gioOfferList').innerHTML=rows.length?rows.map(o=>{const t=totals(o);return `<article class="gioOfferCard"><div><b>${esc(o.nummer)} — ${esc(o.klant)}</b><br><small>${esc(o.titel||'')} • ${esc(o.status)} • geldig t/m ${esc(o.geldigTot||'-')}</small></div><div style="font-size:20px;color:#f4c400;font-weight:900">${eur(t.incl)}</div><div class="gioOfferActions"><button onclick="gioEditOffer('${o.id}')">✏️</button><button onclick="gioPrintOffer('${o.id}')">🖨️ PDF/Print</button><button onclick="gioDuplicateOffer('${o.id}')">📋</button><button onclick="gioSetOfferStatus('${o.id}','Akkoord')">✅ Akkoord</button><button class="del" onclick="gioDeleteOffer('${o.id}')">🗑️</button></div></article>`}).join(''):'<p>Nog geen offertes.</p>';
}
window.gioEditOffer=id=>{const o=data.offertes.find(x=>String(x.id)===String(id));if(!o)return;editId=o.id;fill();$('gioOfferFormTitle').textContent='Offerte bewerken';$('gioOfferNumber').value=o.nummer;$('gioOfferClient').value=o.klant;$('gioOfferProject').value=o.project||'';$('gioOfferDate').value=o.datum||'';$('gioOfferValid').value=o.geldigTot||'';$('gioOfferStatus').value=o.status||'Concept';$('gioOfferTitle').value=o.titel||'';$('gioOfferIntro').value=o.inleiding||'';$('gioOfferTerms').value=o.voorwaarden||'';lines=JSON.parse(JSON.stringify(o.regels||[]));options=JSON.parse(JSON.stringify(o.opties||[]));photoData=o.foto||'';$('gioOfferPhotoPreview').innerHTML=o.foto?`<img src="${o.foto}" style="max-width:260px;border-radius:12px">`:'';renderLines();renderOptions();$('gioOfferForm').style.display='block';$('gioOfferForm').scrollIntoView({behavior:'smooth'})}
function printHtml(o){
 const k=data.klanten.find(x=>x.naam===o.klant)||{},t=totals(o);
 return `<div><img class="gioOfferLogoPrint" src="/gio-logo-192.png"><h1>OFFERTE</h1><h2>${esc(o.nummer)}</h2><div style="display:flex;justify-content:space-between;gap:30px"><div><b>Van:</b><br>GIO Business Planner PRO</div><div><b>Aan:</b><br>${esc(o.klant)}<br>${esc(k.adres||'')}<br>${esc(k.postcode||'')} ${esc(k.plaats||'')}</div></div><hr><p><b>Datum:</b> ${esc(o.datum)}<br><b>Geldig t/m:</b> ${esc(o.geldigTot)}<br><b>Project:</b> ${esc(o.project||'-')}</p><h2>${esc(o.titel||'')}</h2><p>${esc(o.inleiding||'')}</p>${o.foto?`<img src="${o.foto}" style="max-width:100%;max-height:70mm;object-fit:contain">`:''}<table style="width:100%;border-collapse:collapse;margin-top:15px"><thead><tr><th style="text-align:left;border-bottom:2px solid #111">Omschrijving</th><th>Aantal</th><th>Prijs</th><th>Totaal</th></tr></thead><tbody>${o.regels.map(l=>`<tr><td style="padding:7px 0;border-bottom:1px solid #ddd">${esc(l.omschrijving)}</td><td>${l.aantal}</td><td>${eur(l.prijs)}</td><td>${eur(l.aantal*l.prijs)}</td></tr>`).join('')}</tbody></table><table class="gioOfferTotals"><tr><td>Subtotaal</td><td>${eur(t.excl)}</td></tr><tr><td>BTW</td><td>${eur(t.btw)}</td></tr><tr><td><b>Totaal</b></td><td><b>${eur(t.incl)}</b></td></tr></table>${o.opties.length?`<h3>Opties</h3>${o.opties.map(x=>`<p>${esc(x.naam)} — ${eur(x.prijs)}</p>`).join('')}`:''}<h3>Voorwaarden</h3><p>${esc(o.voorwaarden||'')}</p></div>`;
}
window.gioPreviewOffer=()=>{const temp={nummer:$('gioOfferNumber').value,klant:$('gioOfferClient').value,project:$('gioOfferProject').value,datum:$('gioOfferDate').value,geldigTot:$('gioOfferValid').value,titel:$('gioOfferTitle').value,inleiding:$('gioOfferIntro').value,regels:lines,opties:options,voorwaarden:$('gioOfferTerms').value,foto:photoData};$('gioOfferPrint').innerHTML=printHtml(temp);$('gioOfferPrint').style.display='block';window.print();setTimeout(()=>$('gioOfferPrint').style.display='none',500)}
window.gioPrintOffer=id=>{const o=data.offertes.find(x=>String(x.id)===String(id));if(!o)return;$('gioOfferPrint').innerHTML=printHtml(o);$('gioOfferPrint').style.display='block';window.print();setTimeout(()=>$('gioOfferPrint').style.display='none',500)}
window.gioDuplicateOffer=id=>{const o=data.offertes.find(x=>String(x.id)===String(id));if(!o)return;const c=JSON.parse(JSON.stringify(o));c.id=uid();c.nummer=nextNumber();c.status='Concept';c.datum=new Date().toISOString().slice(0,10);data.offertes.unshift(c);save();gioRenderOffers()}
window.gioSetOfferStatus=(id,status)=>{const o=data.offertes.find(x=>String(x.id)===String(id));if(!o)return;o.status=status;o.historie.unshift({tijd:new Date().toISOString(),actie:'Status gewijzigd naar '+status});save();gioRenderOffers()}
window.gioDeleteOffer=id=>{if(!confirm('Offerte verwijderen?'))return;data.offertes=data.offertes.filter(x=>String(x.id)!==String(id));save();gioRenderOffers()}
window.gioOffersInit=()=>{ensure();fill();gioRenderOffers()}
function patchMenus(){const old=window.gioOpenMoreOverlay;window.gioOpenMoreOverlay=function(){old?.();setTimeout(()=>{const g=document.querySelector('#gioOverlayBody .gioOverlayGrid');if(g&&!g.textContent.includes('Offerte PRO'))g.insertAdjacentHTML('beforeend',`<button onclick="gioApprovedGo('offertespro');gioOffersInit()"><i>📄</i>Offerte PRO</button>`)},0)}}
function init(){ensure();inject();patchMenus();gioOffersInit();document.title='GIO Business Planner PRO — MOBILE DEV 013'}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',()=>setTimeout(init,900)):setTimeout(init,900);
})();
