
(function(){
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=v=>new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR'}).format(Number(v)||0);

function ensure(){
  if(!window.data)return false;
  if(!Array.isArray(data.projecten))data.projecten=[];
  if(!Array.isArray(data.uren))data.uren=[];
  if(!Array.isArray(data.materiaal))data.materiaal=[];
  if(!Array.isArray(data.klantBetalingen))data.klantBetalingen=[];
  return true;
}

function projectName(p){return p.naam||p.project||p.titel||''}
function clientName(p){return p.klant||p.klantNaam||''}
function hourlyRate(){return Number(data.uurloon||35)||35}

function projectHours(name){
  return data.uren.filter(u=>(u.project||u.projectNaam)===name)
    .reduce((s,u)=>s+(Number(u.uren)||Number(u.aantalUren)||0),0);
}
function labourValue(name,p){
  if(Number(p?.arbeidBedrag)>0)return Number(p.arbeidBedrag);
  return projectHours(name)*hourlyRate();
}
function materialValue(name){
  return data.materiaal.filter(m=>(m.project||m.projectNaam)===name && m.doorberekenen!==false)
    .reduce((s,m)=>s+(Number(m.bedrag)||Number(m.verkoopBedrag)||Number(m.totaal)||0),0);
}
function paymentsFor(name){
  return data.klantBetalingen.filter(b=>(b.project||b.projectNaam)===name);
}
function paidValue(name){
  return paymentsFor(name).reduce((s,b)=>s+(Number(b.bedrag)||0),0);
}
function totalsFor(p){
  const name=projectName(p), labour=labourValue(name,p), material=materialValue(name), total=labour+material, paid=paidValue(name);
  return {name,labour,material,total,paid,open:Math.max(0,total-paid),over:Math.max(0,paid-total)};
}
function status(p,t){
  const raw=String(p.status||'open').toLowerCase();
  if(t.open<=0.005 && t.total>0)return 'Betaald';
  if(raw.includes('fact'))return 'Klaar te factureren';
  if(raw.includes('done')||raw.includes('klaar'))return 'Werk klaar';
  return 'Open';
}

function inject(){
  if($('betalingenpro'))return;
  const main=document.querySelector('main');if(!main)return;
  const sec=document.createElement('section');sec.id='betalingenpro';sec.className='page';
  sec.innerHTML=`
  <div class="card">
    <h2>💶 Openstaand & Betalingen PRO</h2>
    <div id="gioPayKpis" class="gioPayKpis"></div>
    <div class="row">
      <div><label>Project</label><select id="gioPayProject" onchange="gioPaySelect()"></select></div>
      <div><label>Bedrag betaling</label><input id="gioPayAmount" type="number" step="0.01"></div>
      <div><label>Soort</label><select id="gioPayType"><option>Deelbetaling</option><option>Materiaal vooruitbetaling</option><option>Volledige betaling</option><option>Correctie</option></select></div>
      <div><label>Datum</label><input id="gioPayDate" type="date"></div>
      <div><label>Notitie</label><input id="gioPayNote" placeholder="bijv. materiaal vooraf betaald"></div>
    </div>
    <div id="gioPaySelected" class="gioPaySelected"></div>
    <div class="gioPayActions">
      <button class="btn" onclick="gioPaySave()">💾 Betaling opslaan</button>
      <button class="btn2" onclick="gioPayMarkInvoiceReady()">🧾 Klaar te factureren</button>
      <button class="btn2" onclick="gioPayMarkDone()">✅ Werk klaar</button>
    </div>
  </div>

  <div class="card">
    <h2>Projectoverzicht</h2>
    <div class="row">
      <div><label>Status</label><select id="gioPayFilter" onchange="gioPayRender()"><option value="">Alle</option><option>Open</option><option>Werk klaar</option><option>Klaar te factureren</option><option>Betaald</option></select></div>
      <div><label>Zoeken</label><input id="gioPaySearch" oninput="gioPayRender()"></div>
    </div>
    <div id="gioPayList"></div>
  </div>

  <div class="card">
    <h2>Betalingshistorie</h2>
    <div id="gioPayHistory"></div>
  </div>`;
  main.appendChild(sec);

  const nav=document.querySelector('aside nav');
  if(nav&&!([...nav.querySelectorAll('button')].some(b=>b.textContent.includes('Openstaand & Betalingen')))){
    const b=document.createElement('button');
    b.textContent='💶 Openstaand & Betalingen';
    b.onclick=()=>{show('betalingenpro',b);gioPayInit()};
    nav.appendChild(b);
  }
}

function fillProjects(){
  const sel=$('gioPayProject');if(!sel)return;
  sel.innerHTML='<option value="">Kies project</option>'+data.projecten.map(p=>{
    const n=projectName(p); return `<option value="${esc(n)}">${esc(n)}${clientName(p)?' — '+esc(clientName(p)):''}</option>`;
  }).join('');
}

function selectedProject(){
  const n=$('gioPayProject')?.value||'';
  return data.projecten.find(p=>projectName(p)===n)||null;
}

window.gioPaySelect=()=>{
  const p=selectedProject(),box=$('gioPaySelected');if(!box)return;
  if(!p){box.innerHTML='';return}
  const t=totalsFor(p),st=status(p,t);
  box.innerHTML=`
    <div class="gioPayBreakdown">
      <div><small>Arbeid</small><b>${money(t.labour)}</b></div>
      <div><small>Materiaal</small><b>${money(t.material)}</b></div>
      <div><small>Totaal klant</small><b>${money(t.total)}</b></div>
      <div><small>Betaald</small><b>${money(t.paid)}</b></div>
      <div><small>Openstaand</small><b>${money(t.open)}</b></div>
      <div><small>Status</small><b>${esc(st)}</b></div>
    </div>`;
  if(t.open>0)$('gioPayAmount').value=t.open.toFixed(2);
};

window.gioPaySave=()=>{
  ensure();
  const p=selectedProject();if(!p){alert('Kies eerst een project.');return}
  const amount=Number($('gioPayAmount').value)||0;
  if(amount===0){alert('Vul een bedrag in.');return}
  const n=projectName(p);
  data.klantBetalingen.unshift({
    id:'pay-'+Date.now(),
    project:n,
    klant:clientName(p),
    bedrag:amount,
    soort:$('gioPayType').value,
    datum:$('gioPayDate').value||new Date().toISOString().slice(0,10),
    notitie:$('gioPayNote').value.trim(),
    createdAt:new Date().toISOString(),
    historie:[{tijd:new Date().toISOString(),actie:'Aangemaakt'}]
  });
  save();
  gioPaySelect();gioPayRender();gioPayHistory();
};

window.gioPayEdit=id=>{
  const x=data.klantBetalingen.find(b=>b.id===id);if(!x)return;
  const old=Number(x.bedrag)||0;
  const val=prompt('Nieuw bedrag:',old);
  if(val===null)return;
  const n=Number(String(val).replace(',','.'));
  if(!Number.isFinite(n)){alert('Ongeldig bedrag.');return}
  x.historie=x.historie||[];
  x.historie.push({tijd:new Date().toISOString(),actie:'Bedrag gewijzigd',van:old,naar:n});
  x.bedrag=n;
  const note=prompt('Notitie:',x.notitie||'');
  if(note!==null)x.notitie=note;
  save();gioPaySelect();gioPayRender();gioPayHistory();
};

window.gioPayDelete=id=>{
  if(!confirm('Deze betaling verwijderen?'))return;
  data.klantBetalingen=data.klantBetalingen.filter(x=>x.id!==id);
  save();gioPaySelect();gioPayRender();gioPayHistory();
};

window.gioPayMarkInvoiceReady=()=>{
  const p=selectedProject();if(!p){alert('Kies eerst een project.');return}
  p.status='klaar te factureren';save();gioPayRender();gioPaySelect();
};
window.gioPayMarkDone=()=>{
  const p=selectedProject();if(!p){alert('Kies eerst een project.');return}
  p.status='done';save();gioPayRender();gioPaySelect();
};

function overall(){
  let total=0,paid=0,open=0,ready=0;
  data.projecten.forEach(p=>{
    const t=totalsFor(p),s=status(p,t);
    total+=t.total;paid+=t.paid;open+=t.open;
    if(s==='Klaar te factureren')ready++;
  });
  return {total,paid,open,ready};
}

window.gioPayRender=()=>{
  ensure();
  const f=$('gioPayFilter')?.value||'',q=($('gioPaySearch')?.value||'').toLowerCase();
  const o=overall();
  $('gioPayKpis').innerHTML=`
    <div><small>Totaal projecten</small><b>${money(o.total)}</b></div>
    <div><small>Betaald</small><b>${money(o.paid)}</b></div>
    <div><small>Openstaand</small><b>${money(o.open)}</b></div>
    <div><small>Klaar te factureren</small><b>${o.ready}</b></div>`;

  const list=data.projecten.map(p=>({p,t:totalsFor(p)})).filter(x=>{
    const st=status(x.p,x.t);
    return (!f||st===f)&&(!q||[projectName(x.p),clientName(x.p),st].join(' ').toLowerCase().includes(q));
  });

  $('gioPayList').innerHTML=list.map(({p,t})=>{
    const st=status(p,t);
    return `<div class="gioPayCard ${t.open<=0.005?'paid':''}">
      <div class="gioPayHead"><div><b>${esc(projectName(p))}</b><br><small>${esc(clientName(p))}</small></div><span>${esc(st)}</span></div>
      <div class="gioPayMini">
        <span>Arbeid <b>${money(t.labour)}</b></span>
        <span>Materiaal <b>${money(t.material)}</b></span>
        <span>Betaald <b>${money(t.paid)}</b></span>
        <span>Open <b>${money(t.open)}</b></span>
      </div>
      <button class="btn2" onclick="document.getElementById('gioPayProject').value='${esc(projectName(p))}';gioPaySelect();window.scrollTo({top:0,behavior:'smooth'})">Open projectbetaling</button>
    </div>`;
  }).join('')||'<p>Geen projecten in deze selectie.</p>';
};

window.gioPayHistory=()=>{
  const all=[...data.klantBetalingen].sort((a,b)=>String(b.datum||'').localeCompare(String(a.datum||'')));
  $('gioPayHistory').innerHTML=all.map(x=>`
    <div class="gioPayHistoryRow">
      <div><b>${esc(x.datum)} · ${esc(x.project)}</b><br><small>${esc(x.soort)}${x.notitie?' · '+esc(x.notitie):''}</small></div>
      <div><b>${money(x.bedrag)}</b><br>
        <button onclick="gioPayEdit('${x.id}')">✏️</button>
        <button class="del" onclick="gioPayDelete('${x.id}')">🗑️</button>
      </div>
    </div>`).join('')||'<p>Nog geen betalingen geregistreerd.</p>';
};

window.gioPayInit=()=>{
  ensure();fillProjects();
  $('gioPayDate').value=$('gioPayDate').value||new Date().toISOString().slice(0,10);
  gioPayRender();gioPayHistory();
};

function patchMenu(){
  const old=window.gioOpenMoreOverlay;
  window.gioOpenMoreOverlay=function(){
    old?.();setTimeout(()=>{
      const g=document.querySelector('#gioOverlayBody .gioOverlayGrid');
      if(g&&!g.textContent.includes('Openstaand & Betalingen'))g.insertAdjacentHTML('beforeend',`<button onclick="gioApprovedGo('betalingenpro');gioPayInit()"><i>💶</i>Openstaand & Betalingen</button>`)
    },0)
  }
}
function init(){
  ensure();inject();patchMenu();
  document.title='GIO Business Planner PRO — MOBILE DEV 030';
  try{localStorage.setItem('gioMobileBuild','MOBILE DEV 030')}catch(e){}
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',()=>setTimeout(init,500)):setTimeout(init,500);
})();
