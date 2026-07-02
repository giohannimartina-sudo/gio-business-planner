
(function(){
  function getData(){
    if (window.data) return window.data;
    try { return JSON.parse(localStorage.getItem('gioBusinessPlannerData') || '{}'); }
    catch(e){ return {}; }
  }
  function euro(v){ return new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR'}).format(Number(v||0)); }
  function num(v){ return Number(String(v||0).replace('€','').replace(/\s/g,'').replace('.','').replace(',','.')) || 0; }
  function esc(v){ return String(v ?? '').replace(/[&<>"']/g, function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m];}); }
  function projectNames(){
    var d=getData(), arr=[];
    (d.projecten||[]).forEach(function(p){var n=p.naam||p.project||p.titel;if(n&&arr.indexOf(n)<0)arr.push(n);});
    (d.uren||[]).forEach(function(x){if(x.project&&arr.indexOf(x.project)<0)arr.push(x.project);});
    (d.materiaal||[]).forEach(function(x){if(x.project&&arr.indexOf(x.project)<0)arr.push(x.project);});
    return arr;
  }
  function projectObj(name){ return (getData().projecten||[]).find(function(p){return (p.naam||p.project||p.titel)===name;})||{}; }
  function client(name){
    var d=getData(), p=projectObj(name);
    var klantNaam=p.klant||p.klantNaam||((d.uren||[]).find(function(u){return u.project===name;})||{}).klant||'';
    var k=(d.klanten||[]).find(function(x){return x.naam===klantNaam||x.name===klantNaam;})||{};
    return {naam: klantNaam||k.naam||'', data:k};
  }
  function rows(project){
    var d=getData();
    return {
      uren:(d.uren||[]).filter(function(x){return x.project===project;}),
      mat:(d.materiaal||[]).filter(function(x){return x.project===project;}),
      bet:(d.klantBetalingen||[]).filter(function(x){return x.project===project;})
    };
  }
  function totals(project){
    var r=rows(project);
    var uren=r.uren.reduce(function(s,x){return s+num(x.uren);},0);
    var arbeid=r.uren.reduce(function(s,x){return s+num(x.bedrag);},0);
    var mat=r.mat.reduce(function(s,x){return s+num(x.bedrag);},0);
    var betaald=r.bet.reduce(function(s,x){return s+num(x.bedrag);},0);
    return {uren:uren,arbeid:arbeid,mat:mat,betaald:betaald,totaal:arbeid+mat,open:arbeid+mat-betaald};
  }
  function style(){
    if(document.getElementById('gioFactuurKnopStyle')) return;
    var s=document.createElement('style');
    s.id='gioFactuurKnopStyle';
    s.textContent='.gioFactuurHead{background:#101318;color:white;border-left:8px solid #f4c400;border-radius:18px;padding:18px;margin-bottom:14px}.gioFactuurHead h1{margin:0;color:white!important}.gioFactuurCard{background:white;color:#111;border:1px solid #ddd;border-radius:16px;padding:16px;margin-bottom:14px;box-shadow:0 8px 24px #0001}.gioFactuurCard label{font-weight:800;display:block;margin-top:8px}.gioFactuurCard input,.gioFactuurCard select,.gioFactuurCard textarea{width:100%;box-sizing:border-box;border:1px solid #ddd;border-radius:10px;padding:10px;margin-top:4px}.gioFactuurBtn{background:#f4c400;color:#111;border:0;border-radius:12px;padding:11px 14px;font-weight:900;margin:8px 6px 0 0;cursor:pointer}.gioFactuurBtn.dark{background:#111;color:white}.gioFactuurPreview{background:white;color:#111;border:1px solid #ddd;border-radius:18px;padding:26px;margin-top:16px;box-shadow:0 12px 35px #0002}.gioFactuurPreview *{color:#111}.gioInvTop{display:flex;justify-content:space-between;gap:18px;border-bottom:4px solid #f4c400;padding-bottom:18px;margin-bottom:18px}.gioInvTable{width:100%;border-collapse:collapse;margin-top:12px;font-size:14px}.gioInvTable th{background:#111!important;color:#fff!important;text-align:left;padding:8px}.gioInvTable td{border-bottom:1px solid #eee;padding:8px;vertical-align:top}.gioInvTotal{max-width:430px;margin-left:auto;margin-top:18px}.gioInvTotal div{display:flex;justify-content:space-between;border-bottom:1px solid #eee;padding:8px 0}.gioInvTotal .grand{background:#f4c400;border-radius:12px;padding:12px;font-size:20px;font-weight:900}@media print{body *{visibility:hidden!important}#gioFactuurPrint,#gioFactuurPrint *{visibility:visible!important}#gioFactuurPrint{position:absolute;left:0;top:0;width:100%;box-shadow:none;border:0;margin:0}}';
    document.head.appendChild(s);
  }
  function addMenu(){
    if(document.querySelector('[data-gio-factuur-knop]')) return;
    var b=document.createElement('button');
    b.type='button'; b.dataset.gioFactuurKnop='1'; b.innerHTML='🧾 Factuur maken'; b.onclick=show;
    var side=document.querySelector('.sidebar')||document.querySelector('aside')||document.querySelector('nav');
    if(side) side.appendChild(b);
  }
  function addPage(){
    if(document.getElementById('gioFactuurKnopPage')) return;
    var p=document.createElement('section');
    p.id='gioFactuurKnopPage'; p.className='page'; p.style.display='none';
    p.innerHTML='<div class="gioFactuurHead"><h1>🧾 Factuur maken</h1><p>Leest bestaande uren en materiaal en maakt een factuur-layout. Er wordt niets verwijderd.</p></div><div class="gioFactuurCard"><label>Project</label><select id="gfProject"></select><label>Factuurnummer</label><input id="gfNummer" value="F2026-001"><label>Omschrijving</label><textarea id="gfIntro" rows="2">Werkzaamheden volgens afspraak.</textarea><label><input type="checkbox" id="gfUren" checked> Uren tonen</label><label><input type="checkbox" id="gfTijden" checked> Start/eindtijden tonen</label><label><input type="checkbox" id="gfMateriaal" checked> Materiaal tonen</label><label><input type="checkbox" id="gfBon" checked> Bonnummers tonen</label><label><input type="checkbox" id="gfBetaling" checked> Betalingen/aanbetalingen tonen</label><button class="gioFactuurBtn" id="gfMaak">Maak factuur layout</button><button class="gioFactuurBtn dark" id="gfPrint">🖨 Print / PDF</button><button class="gioFactuurBtn dark" id="gfCsv">📊 Excel / CSV</button><button class="gioFactuurBtn dark" id="gfMail">📧 E-mail</button></div><div id="gfPreview"></div>';
    (document.querySelector('main')||document.querySelector('.main')||document.body).appendChild(p);
  }
  function fill(){ document.getElementById('gfProject').innerHTML=projectNames().map(function(p){return '<option>'+esc(p)+'</option>';}).join(''); }
  function render(){
    var p=document.getElementById('gfProject').value, r=rows(p), t=totals(p), c=client(p), pr=projectObj(p);
    var showU=document.getElementById('gfUren').checked, showT=document.getElementById('gfTijden').checked, showM=document.getElementById('gfMateriaal').checked, showB=document.getElementById('gfBon').checked, showPay=document.getElementById('gfBetaling').checked;
    var urenRows=r.uren.map(function(x){return '<tr><td>'+esc(x.datum||'')+'</td><td>'+esc(x.klant||c.naam||'')+'</td>'+(showT?'<td>'+esc(x.start||'')+'</td><td>'+esc(x.einde||'')+'</td>':'')+'<td>'+num(x.uren).toFixed(2)+'</td><td>'+euro(x.bedrag)+'</td></tr>';}).join('');
    var matRows=r.mat.map(function(x){return '<tr><td>'+esc(x.datum||'')+'</td><td>'+esc(x.leverancier||'')+'</td><td>'+esc(x.materiaal||x.omschrijving||'')+'</td>'+(showB?'<td>'+esc(x.bonnummer||x.bon||'')+'</td>':'')+'<td>'+euro(x.bedrag)+'</td></tr>';}).join('');
    var payRows=r.bet.map(function(x){return '<tr><td>'+esc(x.datum||'')+'</td><td>'+esc(x.type||x.omschrijving||'Betaling')+'</td><td>'+esc(x.betaalwijze||'')+'</td><td>'+euro(x.bedrag)+'</td></tr>';}).join('');
    document.getElementById('gfPreview').innerHTML='<div class="gioFactuurPreview" id="gioFactuurPrint"><div class="gioInvTop"><div><h1>FACTUUR</h1><b>GIO Klus Baas</b><br>info@gioklusbaas.nl</div><div><b>Factuurnummer:</b> '+esc(document.getElementById('gfNummer').value)+'<br><b>Project:</b> '+esc(p)+'<br><b>Projectnummer:</b> '+esc(pr.projectNr||pr.projectnummer||'')+'<br><b>Datum:</b> '+new Date().toLocaleDateString('nl-NL')+'</div></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:16px"><div style="background:#f8fafc;padding:12px;border-radius:12px"><h3>Factuur aan</h3><b>'+esc(c.naam)+'</b><br>'+esc(c.data.adres||'')+'<br>'+esc(c.data.postcode||'')+' '+esc(c.data.plaats||'')+'<br>'+esc(c.data.email||c.data.factuurEmail||'')+'</div><div style="background:#f8fafc;padding:12px;border-radius:12px"><h3>Omschrijving</h3>'+esc(document.getElementById('gfIntro').value).replace(/\\n/g,'<br>')+'</div></div>'+(showU?'<h2>Uren</h2><table class="gioInvTable"><thead><tr><th>Datum</th><th>Klant</th>'+(showT?'<th>Start</th><th>Einde</th>':'')+'<th>Uren</th><th>Bedrag</th></tr></thead><tbody>'+urenRows+'</tbody></table>':'')+(showM?'<h2>Materiaal</h2><table class="gioInvTable"><thead><tr><th>Datum</th><th>Leverancier</th><th>Materiaal</th>'+(showB?'<th>Bonnummer</th>':'')+'<th>Bedrag</th></tr></thead><tbody>'+matRows+'</tbody></table>':'')+(showPay?'<h2>Ontvangen betalingen</h2><table class="gioInvTable"><thead><tr><th>Datum</th><th>Omschrijving</th><th>Wijze</th><th>Bedrag</th></tr></thead><tbody>'+(payRows||'<tr><td colspan="4">Nog geen betalingen.</td></tr>')+'</tbody></table>':'')+'<div class="gioInvTotal"><div><span>Arbeid</span><b>'+euro(t.arbeid)+'</b></div><div><span>Materiaal</span><b>'+euro(t.mat)+'</b></div><div><span>Reeds betaald</span><b>'+euro(t.betaald)+'</b></div><div class="grand"><span>Nog te betalen</span><b>'+euro(t.open)+'</b></div></div></div>';
  }
  function csv(){
    var p=document.getElementById('gfProject').value, r=rows(p), t=totals(p);
    var lines=[['PROJECT FACTURATIE'],['Project',p],['Factuur',document.getElementById('gfNummer').value],[],['Samenvatting'],['Uren',t.uren],['Arbeid',t.arbeid],['Materiaal',t.mat],['Totaal',t.totaal],[],['Uren'],['Datum','Klant','Start','Einde','Uren','Bedrag']];
    r.uren.forEach(function(x){lines.push([x.datum||'',x.klant||'',x.start||'',x.einde||'',x.uren||'',num(x.bedrag).toFixed(2)]);});
    lines.push([],['Materiaal'],['Datum','Leverancier','Materiaal','Bonnummer','Bedrag']);
    r.mat.forEach(function(x){lines.push([x.datum||'',x.leverancier||'',x.materiaal||x.omschrijving||'',x.bonnummer||x.bon||'',num(x.bedrag).toFixed(2)]);});
    var blob=new Blob([lines.map(function(row){return row.map(function(cell){return '"'+String(cell).replace(/"/g,'""')+'"';}).join(';');}).join('\n')],{type:'text/csv'});
    var a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='project_facturatie.csv'; a.click(); URL.revokeObjectURL(a.href);
  }
  function mail(){
    var p=document.getElementById('gfProject').value, c=client(p), t=totals(p);
    var subject=encodeURIComponent('Factuur '+document.getElementById('gfNummer').value+' - '+p);
    var body=encodeURIComponent('Beste '+c.naam+',\n\nHierbij ontvang je de factuur voor project '+p+'.\nNog te betalen: '+euro(t.open)+'\n\nMet vriendelijke groet,\nGIO Klus Baas\ninfo@gioklusbaas.nl');
    location.href='mailto:'+(c.data.email||c.data.factuurEmail||'')+'?subject='+subject+'&body='+body;
  }
  function show(){
    document.querySelectorAll('.page').forEach(function(p){p.style.display='none';});
    style(); addPage(); fill(); render();
    document.getElementById('gioFactuurKnopPage').style.display='block';
    document.getElementById('gfMaak').onclick=render;
    document.getElementById('gfPrint').onclick=function(){render();print();};
    document.getElementById('gfCsv').onclick=csv;
    document.getElementById('gfMail').onclick=mail;
    document.getElementById('gfProject').onchange=render;
  }
  window.showGioFactuurMaken=show;
  function init(){ style(); addPage(); addMenu(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
