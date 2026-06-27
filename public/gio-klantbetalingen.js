
/* GIO PRO - Klantbetalingen / Materiaal aanbetaling LIVE update */
(function(){
  function getData(){
    if (typeof window.data !== 'undefined') return window.data;
    try { return JSON.parse(localStorage.getItem('gioBusinessPlannerData') || '{}'); }
    catch(e){ return {}; }
  }
  function setData(d){
    window.data = d;
    try {
      if (typeof save === 'function') save();
      else localStorage.setItem('gioBusinessPlannerData', JSON.stringify(d));
      if (typeof render === 'function') render();
    } catch(e) {
      localStorage.setItem('gioBusinessPlannerData', JSON.stringify(d));
    }
  }
  function euro(v){
    return new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR'}).format(Number(v||0));
  }
  function today(){ return new Date().toISOString().slice(0,10); }
  function ensure(){
    const d = getData();
    if (!Array.isArray(d.klantBetalingen)) d.klantBetalingen = [];
    window.data = d;
    return d;
  }
  function projects(){
    const d = ensure();
    return (d.projecten || []).map(p => p.naam || p.project || '').filter(Boolean);
  }
  function totals(project){
    const d = ensure();
    const mat = (d.materiaal || []).filter(x => x.project === project).reduce((s,x)=>s+Number(x.bedrag||0),0);
    const uren = (d.uren || []).filter(x => x.project === project).reduce((s,x)=>s+Number(x.bedrag||0),0);
    const uit = (d.uitgaven || []).filter(x => x.project === project).reduce((s,x)=>s+Number(x.bedrag||0),0);
    const betaald = (d.klantBetalingen || []).filter(x => x.project === project).reduce((s,x)=>s+Number(x.bedrag||0),0);
    const betaaldMateriaal = (d.klantBetalingen || []).filter(x => x.project === project && x.type === 'Materiaal').reduce((s,x)=>s+Number(x.bedrag||0),0);
    return {mat, uren, uit, totaal: mat+uren+uit, betaald, betaaldMateriaal, open: mat+uren+uit-betaald, openMateriaal: mat-betaaldMateriaal};
  }
  function addMenu(){
    if (document.querySelector('[data-gio-betalingen-menu]')) return;
    const btn = document.createElement('button');
    btn.setAttribute('data-gio-betalingen-menu','1');
    btn.innerHTML = '💳 Betalingen';
    btn.onclick = showKlantBetalingen;
    const side = document.querySelector('.sidebar') || document.querySelector('aside') || document.querySelector('nav');
    if (side) side.appendChild(btn);
  }
  function addPage(){
    if (document.getElementById('klantbetalingenPage')) return;
    const page = document.createElement('section');
    page.id = 'klantbetalingenPage';
    page.className = 'page';
    page.style.display = 'none';
    page.innerHTML = `
      <div class="card" style="border-left:7px solid #f4c400">
        <h1>💳 Betalingen klant</h1>
        <p>Registreer aanbetalingen, materiaal dat klant alvast betaalt, deelbetalingen en openstaande bedragen per project.</p>
      </div>
      <div class="card">
        <h2>Nieuwe betaling toevoegen</h2>
        <div class="row">
          <div><label>Project</label><select id="kbProject"></select></div>
          <div><label>Datum</label><input id="kbDatum" type="date"></div>
          <div><label>Bedrag</label><input id="kbBedrag" type="number" step="0.01" placeholder="0,00"></div>
          <div><label>Waarvoor</label><select id="kbType"><option>Materiaal</option><option>Arbeid</option><option>Aanbetaling</option><option>Factuur</option><option>Overig</option></select></div>
          <div><label>Betaalwijze</label><select id="kbWijze"><option>Bank</option><option>Contant</option><option>Tikkie</option><option>Pin</option><option>Overig</option></select></div>
          <div><label>Omschrijving</label><input id="kbOmschrijving" placeholder="Bijv. aanbetaling materiaal"></div>
        </div>
        <button class="btn" id="kbOpslaan">💾 Betaling opslaan</button>
      </div>
      <div id="kbOverzicht"></div>`;
    const main = document.querySelector('main') || document.querySelector('.main') || document.body;
    main.appendChild(page);
    document.getElementById('kbDatum').value = today();
    document.getElementById('kbOpslaan').onclick = savePayment;
  }
  function fillProjects(){
    const s = document.getElementById('kbProject');
    if (!s) return;
    const current = s.value;
    s.innerHTML = projects().map(p => `<option>${p}</option>`).join('');
    if (current) s.value = current;
  }
  function savePayment(){
    const d = ensure();
    const p = document.getElementById('kbProject').value;
    const bedrag = Number(document.getElementById('kbBedrag').value || 0);
    if (!p) { alert('Kies eerst een project'); return; }
    if (!bedrag || bedrag <= 0) { alert('Vul een bedrag in'); return; }
    d.klantBetalingen.push({
      id: Date.now(),
      datum: document.getElementById('kbDatum').value || today(),
      project: p,
      bedrag: bedrag,
      type: document.getElementById('kbType').value,
      betaalwijze: document.getElementById('kbWijze').value,
      omschrijving: document.getElementById('kbOmschrijving').value || 'Betaling klant',
      aangemaaktOp: new Date().toLocaleString('nl-NL')
    });
    setData(d);
    document.getElementById('kbBedrag').value = '';
    document.getElementById('kbOmschrijving').value = '';
    renderPayments();
  }
  window.gioDeletePayment = function(id){
    const d = ensure();
    d.klantBetalingen = (d.klantBetalingen || []).filter(x => String(x.id) !== String(id));
    setData(d);
    renderPayments();
  };
  function renderPayments(){
    const box = document.getElementById('kbOverzicht');
    if (!box) return;
    const d = ensure();
    const ps = projects();
    if (!ps.length) { box.innerHTML = '<div class="card">Nog geen projecten gevonden.</div>'; return; }
    box.innerHTML = ps.map(p => {
      const t = totals(p);
      const payments = (d.klantBetalingen || []).filter(x => x.project === p).sort((a,b)=>(b.datum||'').localeCompare(a.datum||''));
      return `<div class="card" style="margin-top:14px">
        <h2>📁 ${p}</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px">
          <div class="summary-card"><small>Materiaal totaal</small><br><b>${euro(t.mat)}</b></div>
          <div class="summary-card"><small>Betaald materiaal</small><br><b style="color:#22c55e">${euro(t.betaaldMateriaal)}</b></div>
          <div class="summary-card"><small>Open materiaal</small><br><b style="color:${t.openMateriaal>0?'#f4c400':'#22c55e'}">${euro(t.openMateriaal)}</b></div>
          <div class="summary-card"><small>Totaal project</small><br><b>${euro(t.totaal)}</b></div>
          <div class="summary-card"><small>Totaal betaald klant</small><br><b style="color:#22c55e">${euro(t.betaald)}</b></div>
          <div class="summary-card"><small>Nog open klant</small><br><b style="color:${t.open>0?'#f4c400':'#22c55e'}">${euro(t.open)}</b></div>
        </div>
        <h3>Betalingen</h3>
        ${payments.length ? `<table style="width:100%"><thead><tr><th>Datum</th><th>Waarvoor</th><th>Omschrijving</th><th>Wijze</th><th>Bedrag</th><th></th></tr></thead><tbody>${payments.map(x=>`<tr><td>${x.datum||''}</td><td>${x.type||''}</td><td>${x.omschrijving||''}</td><td>${x.betaalwijze||''}</td><td>${euro(x.bedrag)}</td><td><button onclick="gioDeletePayment('${x.id}')">Verwijder</button></td></tr>`).join('')}</tbody></table>` : '<p>Nog geen betalingen geregistreerd.</p>'}
      </div>`;
    }).join('');
  }
  function showKlantBetalingen(){
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    addPage(); fillProjects(); renderPayments();
    document.getElementById('klantbetalingenPage').style.display = 'block';
  }
  window.showKlantBetalingen = showKlantBetalingen;
  function init(){
    ensure(); addMenu(); addPage(); fillProjects(); renderPayments();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
