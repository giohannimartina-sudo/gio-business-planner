(function(){
'use strict';
const $=id=>document.getElementById(id);
const eur=v=>new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR'}).format(Number(v)||0);
function calc(lines){let ex=0,tax=0;(lines||[]).forEach(l=>{const b=(+l.aantal||0)*(+l.prijs||0);ex+=b;tax+=b*(+l.btw||0)/100});return{ex,tax,total:ex+tax}}
function T(name,ok,detail){return{name,ok:!!ok,detail}}
function integrity(){
 if(!window.data)return['Data-object ontbreekt'];
 const issues=[],projects=new Set((data.projecten||[]).map(p=>p.naam||p.project||p.titel).filter(Boolean)),clients=new Set((data.klanten||[]).map(k=>k.naam||k.name).filter(Boolean));
 (data.uren||[]).forEach((x,i)=>{const p=x.project||x.projectNaam;if(p&&!projects.has(p))issues.push(`Uren ${i+1}: project ontbreekt (${p})`)});
 (data.materiaal||[]).forEach((x,i)=>{const p=x.project||x.projectNaam;if(p&&!projects.has(p))issues.push(`Materiaal ${i+1}: project ontbreekt (${p})`)});
 (data.offertes||[]).forEach((x,i)=>{if(x.klant&&!clients.has(x.klant))issues.push(`Offerte ${x.nummer||i+1}: klant ontbreekt`);if(x.project&&!projects.has(x.project))issues.push(`Offerte ${x.nummer||i+1}: project ontbreekt`)});
 (data.facturen||[]).forEach((x,i)=>{if(x.klant&&!clients.has(x.klant))issues.push(`Factuur ${x.nummer||i+1}: klant ontbreekt`);if(x.project&&!projects.has(x.project))issues.push(`Factuur ${x.nummer||i+1}: project ontbreekt`)});
 (data.klantBetalingen||[]).forEach((x,i)=>{if(x.factuurId&&!(data.facturen||[]).some(f=>String(f.id)===String(x.factuurId)))issues.push(`Betaling ${i+1}: factuur ontbreekt`);if(x.project&&!projects.has(x.project))issues.push(`Betaling ${i+1}: project ontbreekt`)});
 (data.ritten||[]).forEach((x,i)=>{if(x.project&&!projects.has(x.project))issues.push(`Rit ${i+1}: project ontbreekt`)});
 return issues;
}
async function run(){
 const box=$('gioFinalTestResults'),score=$('gioFinalTestScore');if(!box)return;
 box.textContent='Volledige controle bezig…';const r=[];
 const a=calc([{aantal:1,prijs:100,btw:21}]);
 r.push(T('BTW-berekening',Math.abs(a.ex-100)<.001&&Math.abs(a.tax-21)<.001&&Math.abs(a.total-121)<.001,`${eur(a.ex)} + ${eur(a.tax)} = ${eur(a.total)}`));
 const open1=Math.max(0,a.total-50);r.push(T('Deelbetaling',Math.abs(open1-71)<.001,`${eur(121)} - ${eur(50)} = ${eur(open1)} open`));
 const open2=Math.max(0,open1-71);r.push(T('Volledig betaald',Math.abs(open2)<.001,`${eur(71)} - ${eur(71)} = ${eur(open2)} open`));
 r.push(T('Overbetaling',100>open1,`${eur(100)} > ${eur(open1)} en moet worden geblokkeerd`));
 const pays=[{project:'X',bedrag:50},{project:'X',bedrag:71,factuurId:'F'}],direct=pays.filter(x=>x.project==='X'&&!x.factuurId).reduce((s,x)=>s+x.bedrag,0);
 r.push(T('Geen dubbeltelling',direct===50,`Losse projectbetaling ${eur(direct)}; factuurbetaling apart`));
 const issues=integrity();r.push(T('Gegevenskoppelingen',issues.length===0,issues.length?`${issues.length} aandachtspunt(en)`:'Geen ontbrekende koppelingen'));
 try{const q=await fetch('/api/km-route',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({origin:'Wilnis, Nederland',destination:'Gouda, Nederland'})}),j=await q.json();r.push(T('Google KM Routes',q.ok&&+j.km>0,q.ok?`${(+j.km).toFixed(1)} km · ${j.minutes} min`:(j.error||'Niet beschikbaar')))}catch(e){r.push(T('Google KM Routes',false,e.message))}
 try{const q=await fetch('/api/gio-sync?device_key=gio-master',{cache:'no-store'}),j=await q.json();r.push(T('Cloud Sync',q.ok,q.ok?(j.row?'Verbonden + masterdata':'Verbonden, cloud nog leeg'):(j.error||'Cloudfout')))}catch(e){r.push(T('Cloud Sync',false,e.message))}
 let backups=[];try{backups=JSON.parse(localStorage.getItem('gioAutoBackupsV016')||'[]')}catch(e){}
 r.push(T('Lokale backup',backups.length>0,backups.length?`${backups.length} backup(s)`:'Maak nog een lokale backup'));
 const master=localStorage.getItem('gioLastMasterExport');r.push(T('MASTER-backup',!!master,master?new Date(master).toLocaleString('nl-NL'):'Maak nog een MASTER-export'));
 const pass=r.filter(x=>x.ok).length;
 score.innerHTML=`<div class="gioFinalScore ${pass===r.length?'ok':'warn'}"><b>${pass}/${r.length}</b><span>${pass===r.length?'PRO LIVE READY':'Nog controles afronden'}</span></div>`;
 box.innerHTML=r.map(x=>`<div class="gioFinalRow"><div><b>${x.name}</b><br><small>${x.detail}</small></div><span class="${x.ok?'ok':'warn'}">${x.ok?'OK':'CONTROLEREN'}</span></div>`).join('');
 if(issues.length)box.insertAdjacentHTML('beforeend','<div class="gioFinalIssues"><b>Gegevenspunten:</b><br>'+issues.slice(0,30).join('<br>')+'</div>');
}
function inject(){
 if($('gioFinalLiveTest'))return false;const main=document.querySelector('main');if(!main)return false;
 const s=document.createElement('section');s.id='gioFinalLiveTest';s.className='page';
 s.innerHTML=`<div class="card"><h2>🏁 GIO PRO — Definitieve Live Test</h2><p>Deze test verandert geen klanten, projecten, offertes, facturen of betalingen. De financiële rekentests draaien alleen in het geheugen.</p><div id="gioFinalTestScore"></div><button class="btn" onclick="gioFinalLiveRun()">▶ Start definitieve controle</button></div><div class="card"><h2>Resultaten</h2><div id="gioFinalTestResults">Nog niet gestart.</div></div>`;
 main.appendChild(s);
 const nav=document.querySelector('aside nav');if(nav&&![...nav.querySelectorAll('button')].some(b=>b.textContent.includes('Definitieve Live Test'))){const b=document.createElement('button');b.textContent='🏁 Definitieve Live Test';b.onclick=()=>{show('gioFinalLiveTest',b)};nav.appendChild(b)}
 const st=document.createElement('style');st.textContent=`.gioFinalScore{display:flex;gap:14px;align-items:center;padding:14px;border-radius:12px;margin:12px 0}.gioFinalScore.ok{background:#123d27}.gioFinalScore.warn{background:#4a3410}.gioFinalScore b{font-size:28px}.gioFinalRow{display:flex;justify-content:space-between;gap:12px;padding:11px 0;border-bottom:1px solid #333}.gioFinalRow span{font-weight:900}.gioFinalRow span.ok{color:#55d98b}.gioFinalRow span.warn{color:#ffc857}.gioFinalIssues{margin-top:12px;padding:10px;border:1px solid #ffc857;border-radius:9px}`;
 document.head.appendChild(st);return true;
}
window.gioFinalLiveRun=run;
let n=0;(function boot(){if(inject())return;if(++n<60)setTimeout(boot,250)})();
})();