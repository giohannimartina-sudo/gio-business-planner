
/* GIO Factuur maken - corrected add-on. Vervangt niets. */
(function(){
function data(){if(window.data)return window.data;try{return JSON.parse(localStorage.getItem('gioBusinessPlannerData')||'{}')}catch(e){return{}}}
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function money(v){return new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR'}).format(Number(v||0))}
function nr(v){
 if(typeof v==='number'&&isFinite(v)) return Math.abs(v)>1000000?0:v;
 let s=String(v??'').trim().replace(/[€\s]/g,'').replace(/[^\d,.\-]/g,'');
 if(!s)return 0;
 if(s.includes(',')) s=s.replace(/\./g,'').replace(',','.');
 else if((s.match(/\./g)||[]).length>1) s=s.replace(/\./g,'');
 let n=Number(s);
 if(!isFinite(n)||Math.abs(n)>1000000)return 0;
 return n;
}
function cfg(){try{return Object.assign({tarief:35,btw:false,btwp:21},JSON.parse(localStorage.getItem('gio_invoice_fixed_cfg')||'{}'))}catch(e){return{tarief:35,btw:false,btwp:21}}}
function saveCfg(c){localStorage.setItem('gio_invoice_fixed_cfg',JSON.stringify(c))}
function pname(p){return p?.naam||p?.project||p?.titel||p?.projectnaam||''}
function projects(){
 let d=data(), a=[];
 (d.projecten||[]).forEach(p=>{let n=pname(p);if(n&&!a.includes(n))a.push(n)});
 (d.uren||[]).forEach(x=>{if(x.project&&!a.includes(x.project))a.push(x.project)});
 (d.materiaal||[]).forEach(x=>{if(x.project&&!a.includes(x.project))a.push(x.project)});
 return a;
}
function projectObj(p){return (data().projecten||[]).find(x=>pname(x)===p)||{}}
function client(p){
 let d=data(), pr=projectObj(p), n=pr.klant||pr.klantNaam||((d.uren||[]).find(u=>u.project===p)||{}).klant||'';
 let k=(d.klanten||[]).find(c=>c.naam===n||c.name===n||c.klant===n)||{};
 return {naam:n||k.naam||k.name||'',data:k};
}
function rows(p){
 let d=data();
 return {
  u:(d.uren||[]).filter(x=>x.project===p),
  m:(d.materiaal||[]).filter(x=>x.project===p),
  b:(d.klantBetalingen||[]).filter(x=>x.project===p)
 };
}
function hours(x){
 let h=nr(x.uren??x.hours??x.totaalUren);
 if(h>0&&h<1000)return h;
 let st=x.start||'', en=x.einde||x.eind||'';
 if(/^\d{1,2}:\d{2}$/.test(st)&&/^\d{1,2}:\d{2}$/.test(en)){
  let [sh,sm]=st.split(':').map(Number),[eh,em]=en.split(':').map(Number);
  let m=(eh*60+em)-(sh*60+sm); if(m<0)m+=1440; return m/60;
 }
 return 0;
}
function amountHour(x,tarief){let a=nr(x.bedrag??x.amount??x.totaal);return a>0?a:hours(x)*tarief}
function amountMat(x){return nr(x.bedrag??x.amount??x.totaal??x.prijs)}
function amountPay(x){return nr(x.bedrag??x.amount??x.totaal)}
function totals(p){
 let c=cfg(), r=rows(p), uh=r.u.reduce((s,x)=>s+hours(x),0),
 arbeid=r.u.reduce((s,x)=>s+amountHour(x,nr(c.tarief)),0),
 mat=r.m.reduce((s,x)=>s+amountMat(x),0),
 betaald=r.b.reduce((s,x)=>s+amountPay(x),0);
 let sub=arbeid+mat, btw=c.btw?sub*(nr(c.btwp)/100):0;
 return {uh,arbeid,mat,betaald,sub,btw,total:sub+btw,open:sub+btw-betaald};
}
function addStyle(){
 if(document.getElementById('gioInvFixStyle'))return;
 let s=document.createElement('style');s.id='gioInvFixStyle';
 s.textContent=`
 .gioInvFixHead{background:#101318;color:#fff;border-left:8px solid #f4c400;border-radius:18px;padding:18px;margin-bottom:14px}
 .gioInvFixHead h1{margin:0;color:#fff!important}
 .gioInvFixCard{background:#fff;color:#111;border:1px solid #ddd;border-radius:16px;padding:16px;margin-bottom:14px;box-shadow:0 8px 24px #0001}
 .gioInvFixCard label{display:block;font-weight:800;margin-top:8px}.gioInvFixCard input,.gioInvFixCard select,.gioInvFixCard textarea{width:100%;box-sizing:border-box;border:1px solid #ddd;border-radius:10px;padding:10px;margin-top:4px}
 .gioInvFixBtn{background:#f4c400;color:#111;border:0;border-radius:12px;padding:11px 14px;font-weight:900;margin:8px 6px 0 0;cursor:pointer}.gioInvFixBtn.dark{background:#111;color:#fff}
 .gioInvFixPrev{background:#fff;color:#111;border:1px solid #ddd;border-radius:18px;padding:26px;margin-top:16px;box-shadow:0 12px 35px #0002}.gioInvFixPrev *{color:#111}
 .gioInvTop{display:flex;justify-content:space-between;gap:18px;border-bottom:4px solid #f4c400;padding-bottom:18px;margin-bottom:18px}
 .gioInvTable{width:100%;border-collapse:collapse;margin-top:12px;font-size:14px}.gioInvTable th{background:#111!important;color:#fff!important;text-align:left;padding:8px}.gioInvTable td{border-bottom:1px solid #eee;padding:8px;vertical-align:top}
 .gioTotal{max-width:430px;margin-left:auto;margin-top:18px}.gioTotal div{display:flex;justify-content:space-between;border-bottom:1px solid #eee;padding:8px 0}.gioTotal .paid{color:#16a34a;font-weight:900}.gioTotal .grand{background:#f4c400;border-radius:12px;padding:12px;font-size:20px;font-weight:900}
 @media print{body *{visibility:hidden!important}#gioInvPrintFixed,#gioInvPrintFixed *{visibility:visible!important}#gioInvPrintFixed{position:absolute;left:0;top:0;width:100%;box-shadow:none;border:0;margin:0}}
 `;
 document.head.appendChild(s);
}
function addPage(){
 if(document.getElementById('gioInvFixPage'))return;
 let p=document.createElement('section');p.id='gioInvFixPage';p.className='page';p.style.display='none';
 p.innerHTML=`
 <div class="gioInvFixHead"><h1>🧾 Factuur maken</h1><p>Gecorrigeerde berekening. Leest bestaande uren, materiaal en betalingen. Verwijdert niets.</p></div>
 <div class="gioInvFixCard">
  <label>Project</label><select id="gfixProject"></select>
  <label>Factuurnummer</label><input id="gfixNumber" value="F2026-001">
  <label>Uurtarief</label><input id="gfixTarief" type="number" step="0.01" value="35">
  <label>Omschrijving</label><textarea id="gfixIntro" rows="2">Werkzaamheden volgens afspraak.</textarea>
  <label><input type="checkbox" id="gfixUren" checked> Uren tonen</label>
  <label><input type="checkbox" id="gfixTijden" checked> Start/eindtijden tonen</label>
  <label><input type="checkbox" id="gfixMateriaal" checked> Materiaal tonen</label>
  <label><input type="checkbox" id="gfixBon" checked> Bonnummers tonen</label>
  <label><input type="checkbox" id="gfixBet" checked> Betalingen/aanbetalingen tonen</label>
  <label><input type="checkbox" id="gfixBtw"> BTW toevoegen</label>
  <label>BTW %</label><input id="gfixBtwPct" type="number" step="0.1" value="21">
  <button class="gioInvFixBtn" id="gfixMake">Maak factuur layout</button>
  <button class="gioInvFixBtn dark" id="gfixPrint">🖨 Print / PDF</button>
  <button class="gioInvFixBtn dark" id="gfixCsv">📊 Excel / CSV</button>
  <button class="gioInvFixBtn dark" id="gfixMail">📧 E-mail</button>
 </div><div id="gfixPreview"></div>`;
 (document.querySelector('main')||document.querySelector('.main')||document.body).appendChild(p);
}
function addMenu(){
 if(document.querySelector('[data-gio-invoice-fixed-menu]'))return;
 let b=document.createElement('button');b.type='button';b.dataset.gioInvoiceFixedMenu='1';b.innerHTML='🧾 Factuur maken';b.onclick=show;
 (document.querySelector('.sidebar')||document.querySelector('aside')||document.querySelector('nav')||document.body).appendChild(b);
}
function fill(){
 let c=cfg();
 gfixProject.innerHTML=projects().map(p=>`<option>${esc(p)}</option>`).join('');
 gfixTarief.value=c.tarief;gfixBtw.checked=!!c.btw;gfixBtwPct.value=c.btwp;
}
function readCfg(){let c=cfg();c.tarief=nr(gfixTarief.value)||35;c.btw=gfixBtw.checked;c.btwp=nr(gfixBtwPct.value)||21;saveCfg(c);return c}
function render(){
 let c=readCfg(), p=gfixProject.value, r=rows(p), t=totals(p), cl=client(p), pr=projectObj(p);
 let su=gfixUren.checked, st=gfixTijden.checked, sm=gfixMateriaal.checked, sb=gfixBon.checked, sp=gfixBet.checked;
 let uRows=r.u.map(x=>`<tr><td>${esc(x.datum||'')}</td><td>${esc(x.klant||cl.naam||'')}</td>${st?`<td>${esc(x.start||'')}</td><td>${esc(x.einde||x.eind||'')}</td>`:''}<td>${hours(x).toFixed(2)}</td><td>${money(amountHour(x,nr(c.tarief)))}</td></tr>`).join('');
 let mRows=r.m.map(x=>`<tr><td>${esc(x.datum||'')}</td><td>${esc(x.leverancier||'')}</td><td>${esc(x.materiaal||x.omschrijving||x.naam||'')}</td>${sb?`<td>${esc(x.bonnummer||x.bon||'')}</td>`:''}<td>${money(amountMat(x))}</td></tr>`).join('');
 let pRows=r.b.map(x=>`<tr><td>${esc(x.datum||'')}</td><td>${esc(x.type||x.omschrijving||'Betaling')}</td><td>${esc(x.betaalwijze||x.wijze||'')}</td><td>${money(amountPay(x))}</td></tr>`).join('');
 gfixPreview.innerHTML=`<div class="gioInvFixPrev" id="gioInvPrintFixed"><div class="gioInvTop"><div><h1>FACTUUR</h1><b>GIO Klus Baas</b><br>info@gioklusbaas.nl</div><div><b>Factuurnummer:</b> ${esc(gfixNumber.value)}<br><b>Project:</b> ${esc(p)}<br><b>Projectnummer:</b> ${esc(pr.projectNr||pr.projectnummer||'')}<br><b>Datum:</b> ${new Date().toLocaleDateString('nl-NL')}</div></div>
 <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px"><div style="background:#f8fafc;padding:12px;border-radius:12px"><h3>Factuur aan</h3><b>${esc(cl.naam)}</b><br>${esc(cl.data.adres||'')}<br>${esc(cl.data.postcode||'')} ${esc(cl.data.plaats||'')}<br>${esc(cl.data.email||cl.data.factuurEmail||'')}</div><div style="background:#f8fafc;padding:12px;border-radius:12px"><h3>Omschrijving</h3>${esc(gfixIntro.value).replace(/\n/g,'<br>')}</div></div>
 ${su?`<h2>Uren</h2><table class="gioInvTable"><thead><tr><th>Datum</th><th>Klant</th>${st?'<th>Start</th><th>Einde</th>':''}<th>Uren</th><th>Bedrag</th></tr></thead><tbody>${uRows||'<tr><td colspan="6">Geen uren.</td></tr>'}</tbody></table>`:''}
 ${sm?`<h2>Materiaal</h2><table class="gioInvTable"><thead><tr><th>Datum</th><th>Leverancier</th><th>Materiaal</th>${sb?'<th>Bonnummer</th>':''}<th>Bedrag</th></tr></thead><tbody>${mRows||'<tr><td colspan="5">Geen materiaal.</td></tr>'}</tbody></table>`:''}
 ${sp?`<h2>Ontvangen betalingen</h2><table class="gioInvTable"><thead><tr><th>Datum</th><th>Omschrijving</th><th>Wijze</th><th>Bedrag</th></tr></thead><tbody>${pRows||'<tr><td colspan="4">Nog geen betalingen.</td></tr>'}</tbody></table>`:''}
 <div class="gioTotal"><div><span>Arbeid</span><b>${money(t.arbeid)}</b></div><div><span>Materiaal</span><b>${money(t.mat)}</b></div><div><span>Subtotaal</span><b>${money(t.sub)}</b></div>${c.btw?`<div><span>BTW ${esc(c.btwp)}%</span><b>${money(t.btw)}</b></div>`:''}<div class="paid"><span>Reeds betaald</span><b>-${money(t.betaald)}</b></div><div class="grand"><span>Nog te betalen</span><b>${money(t.open)}</b></div></div></div>`;
}
function csv(){
 let p=gfixProject.value,r=rows(p),c=cfg(),t=totals(p),lines=[['PROJECT FACTURATIE'],['Project',p],['Factuur',gfixNumber.value],[],['Samenvatting'],['Uren',t.uh.toFixed(2)],['Arbeid',t.arbeid.toFixed(2)],['Materiaal',t.mat.toFixed(2)],['Reeds betaald',t.betaald.toFixed(2)],['Nog te betalen',t.open.toFixed(2)],[],['Uren'],['Datum','Klant','Start','Einde','Uren','Bedrag']];
 r.u.forEach(x=>lines.push([x.datum||'',x.klant||'',x.start||'',x.einde||x.eind||'',hours(x).toFixed(2),amountHour(x,nr(c.tarief)).toFixed(2)]));
 lines.push([],['Materiaal'],['Datum','Leverancier','Materiaal','Bonnummer','Bedrag']);
 r.m.forEach(x=>lines.push([x.datum||'',x.leverancier||'',x.materiaal||x.omschrijving||'',x.bonnummer||x.bon||'',amountMat(x).toFixed(2)]));
 let blob=new Blob([lines.map(row=>row.map(cell=>`"${String(cell).replace(/"/g,'""')}"`).join(';')).join('\n')],{type:'text/csv'});
 let a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=(gfixNumber.value+'_'+p+'_factuur.csv').replace(/\s+/g,'_');a.click();URL.revokeObjectURL(a.href);
}
function mail(){let p=gfixProject.value,cl=client(p),t=totals(p);location.href=`mailto:${cl.data.email||cl.data.factuurEmail||''}?subject=${encodeURIComponent('Factuur '+gfixNumber.value+' - '+p)}&body=${encodeURIComponent('Beste '+cl.naam+',\n\nHierbij ontvang je de factuur voor project '+p+'.\nNog te betalen: '+money(t.open)+'\n\nMet vriendelijke groet,\nGIO Klus Baas\ninfo@gioklusbaas.nl')}`}
function show(){document.querySelectorAll('.page').forEach(p=>p.style.display='none');addStyle();addPage();fill();render();gioInvFixPage.style.display='block';gfixMake.onclick=render;gfixPrint.onclick=()=>{render();print()};gfixCsv.onclick=csv;gfixMail.onclick=mail;gfixProject.onchange=render;scrollTo(0,0)}
window.showGioInvoiceFixed=show;
function init(){addStyle();addPage();addMenu()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
