
'use client';
import {useEffect,useMemo,useState} from 'react';
import {createClient} from '@supabase/supabase-js';

const seedData = {
  uren: [], klanten: [], planning: [], uitgaven: [], materiaal: [], projecten: [], klantBetalingen: [], notities: []
};

function euro(v){return new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR'}).format(Number(v||0));}
function today(){return new Date().toISOString().slice(0,10)}
function parseDate(d){const x=new Date(d);return isNaN(x)?null:x}
function daysBetween(a,b){const A=parseDate(a),B=parseDate(b); if(!A||!B)return null; return Math.ceil((B-A)/(1000*60*60*24));}
function safeNum(v){return Number(v||0)}
function uid(){return Math.random().toString(36).slice(2)+Date.now().toString(36)}
function loadLocal(){
  if(typeof window==='undefined') return seedData;
  for(const k of ['gioBusinessPlannerProV2','gioBusinessPlannerData','gio_live_data']){
    try{const v=localStorage.getItem(k); if(v) return normalize(JSON.parse(v));}catch(e){}
  }
  return seedData;
}
function normalize(d){
  const n={...seedData,...(d||{})};
  n.klantBetalingen=Array.isArray(n.klantBetalingen)?n.klantBetalingen:[];
  n.projecten=(n.projecten||[]).map(p=>({id:p.id||uid(), status:p.status||'Gepland', ...p}));
  return n;
}
function projectNaam(p){return p?.naam||p?.project||''}
function projectTotals(data, project){
  const p=projectNaam(project)||project;
  const mat=(data.materiaal||[]).filter(x=>x.project===p).reduce((s,x)=>s+safeNum(x.bedrag),0);
  const urenBedrag=(data.uren||[]).filter(x=>x.project===p).reduce((s,x)=>s+safeNum(x.bedrag),0);
  const uren=(data.uren||[]).filter(x=>x.project===p).reduce((s,x)=>s+safeNum(x.uren),0);
  const uit=(data.uitgaven||[]).filter(x=>x.project===p).reduce((s,x)=>s+safeNum(x.bedrag),0);
  const betaald=(data.klantBetalingen||[]).filter(x=>x.project===p).reduce((s,x)=>s+safeNum(x.bedrag),0);
  const betaaldMateriaal=(data.klantBetalingen||[]).filter(x=>x.project===p&&x.type==='Materiaal').reduce((s,x)=>s+safeNum(x.bedrag),0);
  const totaal=mat+urenBedrag+uit;
  return {mat, urenBedrag, uren, uit, betaald, betaaldMateriaal, totaal, open:totaal-betaald, openMateriaal:mat-betaaldMateriaal, winst:urenBedrag+mat-uit};
}
function projectState(p,t){
  const status=(p.status||'').toLowerCase();
  const klaar=status.includes('klaar')||status.includes('betaald')||status.includes('afgerond');
  const betaald=t.open<=0 || status.includes('betaald');
  const end=p.eind||p.einddatum||p.deadline;
  const diff=end?daysBetween(today(),end):null;
  if(klaar&&betaald) return {label:'Archief', cls:'green', archive:true};
  if(diff!==null && diff<0) return {label:`${Math.abs(diff)} dagen te laat`, cls:'red'};
  if(diff!==null && diff<=2) return {label:`Nog ${diff} dagen`, cls:'orange'};
  if(diff!==null) return {label:`Nog ${diff} dagen`, cls:'green'};
  return {label:p.status||'Actief', cls:'gray'};
}
function weekDays(){
  const now=new Date(); const day=(now.getDay()+6)%7; const monday=new Date(now); monday.setDate(now.getDate()-day);
  return Array.from({length:7},(_,i)=>{const d=new Date(monday);d.setDate(monday.getDate()+i);return d;});
}
function dateKey(d){return d.toISOString().slice(0,10)}

export default function Home(){
  const [tab,setTab]=useState('dashboard');
  const [data,setData]=useState(seedData);
  const [toast,setToast]=useState('');
  const [cloud,setCloud]=useState({client:null,user:null,email:'',password:'',showPass:false,status:'Niet verbonden',busy:false});
  const [edit,setEdit]=useState({project:'', klant:'', start:'', eind:'', status:'Gepland', notitie:''});
  const [pay,setPay]=useState({project:'',datum:today(),bedrag:'',type:'Materiaal',betaalwijze:'Bank',omschrijving:''});
  const [clock,setClock]=useState({project:'',klant:'',tarief:35});
  const [offer,setOffer]=useState('Badkamer');

  useEffect(()=>{
    async function init(){
      let d=loadLocal();
      try{const r=await fetch('/GIO_Business_Planner_Backup_2026-06-26.json'); if(r.ok){const backup=await r.json(); if((!d.projecten||!d.projecten.length)&&backup.projecten) d=normalize(backup);}}catch(e){}
      setData(d); saveLocal(d);
      try{
        const cfg=await fetch('/api/config').then(r=>r.json());
        if(cfg.url&&cfg.anonKey){
          const client=createClient(cfg.url,cfg.anonKey);
          const {data:{session}}=await client.auth.getSession();
          setCloud(c=>({...c,client,user:session?.user||null,email:session?.user?.email||c.email,status:session?.user?'Verbonden':'Niet verbonden'}));
        }
      }catch(e){setCloud(c=>({...c,status:'Cloud config ontbreekt'}));}
    }
    init();
  },[]);
  function notify(t){setToast(t);setTimeout(()=>setToast(''),2600)}
  function saveLocal(d=data){localStorage.setItem('gioBusinessPlannerProV2',JSON.stringify(d));localStorage.setItem('gioBusinessPlannerData',JSON.stringify(d));}
  function update(d){const n=normalize(d); setData(n); saveLocal(n);}
  const totals=useMemo(()=>{
    const omzet=(data.uren||[]).reduce((s,x)=>s+safeNum(x.bedrag),0)+(data.materiaal||[]).reduce((s,x)=>s+safeNum(x.bedrag),0);
    const kosten=(data.uitgaven||[]).reduce((s,x)=>s+safeNum(x.bedrag),0);
    const betaald=(data.klantBetalingen||[]).reduce((s,x)=>s+safeNum(x.bedrag),0);
    const uren=(data.uren||[]).reduce((s,x)=>s+safeNum(x.uren),0);
    const active=(data.projecten||[]).filter(p=>!projectState(p,projectTotals(data,p)).archive);
    const archive=(data.projecten||[]).filter(p=>projectState(p,projectTotals(data,p)).archive);
    return {omzet,kosten,betaald,open:omzet+kosten-betaald,winst:omzet-kosten,uren,active,archive};
  },[data]);
  const selectedProject=edit.project || projectNaam(totals.active[0]) || projectNaam((data.projecten||[])[0]) || '';

  async function login(){
    if(!cloud.client) return notify('Cloud config ontbreekt');
    setCloud(c=>({...c,busy:true,status:'Inloggen...'}));
    const {data:res,error}=await cloud.client.auth.signInWithPassword({email:cloud.email,password:cloud.password});
    if(error){setCloud(c=>({...c,busy:false,status:'Login mislukt: '+error.message}));return;}
    setCloud(c=>({...c,busy:false,user:res.user,status:'Verbonden'})); notify('Cloud verbonden');
  }
  async function syncUp(){
    if(!cloud.client||!cloud.user) return notify('Eerst inloggen');
    setCloud(c=>({...c,busy:true,status:'Uploaden...'}));
    const payload={user_id:cloud.user.id,data,updated_at:new Date().toISOString()};
    const {error}=await cloud.client.from('planner_data').upsert(payload,{onConflict:'user_id'});
    setCloud(c=>({...c,busy:false,status:error?'Upload fout: '+error.message:'Cloud opgeslagen'}));
    if(!error) notify('Opgeslagen naar cloud');
  }
  async function syncDown(){
    if(!cloud.client||!cloud.user) return notify('Eerst inloggen');
    setCloud(c=>({...c,busy:true,status:'Ophalen...'}));
    const {data:row,error}=await cloud.client.from('planner_data').select('data,updated_at').eq('user_id',cloud.user.id).maybeSingle();
    if(error){setCloud(c=>({...c,busy:false,status:'Ophalen fout: '+error.message}));return;}
    if(row?.data){update(row.data);setCloud(c=>({...c,busy:false,status:'Cloud opgehaald'}));notify('Laatste gegevens opgehaald');}
    else setCloud(c=>({...c,busy:false,status:'Geen clouddata gevonden'}));
  }
  async function syncNow(){await syncUp();}
  function addProject(){
    if(!edit.project) return notify('Vul projectnaam in');
    const exists=(data.projecten||[]).some(p=>projectNaam(p)===edit.project);
    const p={id:uid(),naam:edit.project,klant:edit.klant,start:edit.start,eind:edit.eind,status:edit.status,notitie:edit.notitie};
    update({...data,projecten: exists?data.projecten.map(x=>projectNaam(x)===edit.project?{...x,...p}:x):[...(data.projecten||[]),p]});
    notify('Project opgeslagen'); setEdit({project:'',klant:'',start:'',eind:'',status:'Gepland',notitie:''});
  }
  function addPayment(){
    if(!pay.project||!pay.bedrag) return notify('Project en bedrag invullen');
    update({...data,klantBetalingen:[...(data.klantBetalingen||[]),{...pay,id:uid(),bedrag:Number(pay.bedrag)}]});
    notify('Betaling opgeslagen'); setPay({...pay,bedrag:'',omschrijving:''});
  }
  function clockIn(){
    const p=clock.project||selectedProject; const proj=(data.projecten||[]).find(x=>projectNaam(x)===p);
    update({...data,activeClock:{running:true,project:p,klant:clock.klant||proj?.klant||'',tarief:Number(clock.tarief||35),datum:today(),start:new Date().toTimeString().slice(0,5),startedAt:new Date().toISOString()}});
    notify('Ingeklokt');
  }
  function clockOut(){
    const ac=data.activeClock; if(!ac?.running)return notify('Geen lopende klok');
    const end=new Date(); const start=new Date(ac.startedAt); const uren=Math.max(0,Math.round((end-start)/60000)/60);
    update({...data,activeClock:null,uren:[...(data.uren||[]),{id:uid(),datum:ac.datum,start:ac.start,einde:end.toTimeString().slice(0,5),project:ac.project,klant:ac.klant,tarief:ac.tarief,uren,bedrag:uren*ac.tarief}]});
    notify('Uitgeklokt en uren opgeslagen');
  }
  function archiveProject(p){update({...data,projecten:data.projecten.map(x=>projectNaam(x)===projectNaam(p)?{...x,status:'Betaald',betaaldDatum:today()}:x)});}
  function exportBackup(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));a.download='GIO_Business_Planner_PRO_Backup_'+today()+'.json';a.click();}

  return <div className="app">
    <aside className="side"><div className="brand"><img src="/gio-logo-192.png"/><div><b>GIO Business Planner PRO</b><br/><small>v2.0 FINAL LIVE</small></div></div><Nav tab={tab} setTab={setTab}/><div className="sideFooter">☁ {cloud.status}<br/>Data blijft lokaal én kan naar Supabase syncen.</div></aside>
    <div className="mobileTop"><div style={{display:'flex',alignItems:'center',gap:10}}><img src="/gio-logo-192.png"/><div><b>GIO Planner PRO</b><br/><small>{cloud.status}</small></div></div><span>☁</span></div>
    <main className="main"><div className="topbar"><div><h1>{title(tab)}</h1><p>Slim werken. Meer verdienen. Minder administratie.</p></div><div className="cloudBadge">☁ {cloud.user?'Verbonden':'Niet verbonden'}</div></div>
      {tab==='dashboard'&&<Dashboard data={data} totals={totals} setTab={setTab}/>} {tab==='planning'&&<Planning data={data}/>} {tab==='projecten'&&<Projects data={data} totals={totals} edit={edit} setEdit={setEdit} addProject={addProject} archiveProject={archiveProject}/>} {tab==='projectkaart'&&<ProjectCard data={data} project={selectedProject}/>} {tab==='betalingen'&&<Payments data={data} pay={pay} setPay={setPay} addPayment={addPayment}/>} {tab==='uren'&&<Hours data={data} clock={clock} setClock={setClock} clockIn={clockIn} clockOut={clockOut}/>} {tab==='offerte'&&<SmartOffer data={data} offer={offer} setOffer={setOffer}/>} {tab==='cloud'&&<Cloud cloud={cloud} setCloud={setCloud} login={login} syncUp={syncUp} syncDown={syncDown} syncNow={syncNow} exportBackup={exportBackup}/>} {tab==='archief'&&<Archive data={data}/>} 
    </main>
    <div className="mobileAction"><button onClick={()=>setTab('uren')}>▶ Inklok</button><button onClick={()=>setTab('projectkaart')}>📁 Kaart</button><button onClick={()=>setTab('betalingen')}>💳 Betaal</button><button onClick={()=>setTab('planning')}>📅 Agenda</button><button onClick={()=>setTab('cloud')}>☁ Sync</button></div>
    <div className="mobileDock"><button className={tab==='dashboard'?'active':''} onClick={()=>setTab('dashboard')}>🏠<br/>Home</button><button onClick={()=>setTab('projecten')}>📁<br/>Project</button><button onClick={()=>setTab('planning')}>📅<br/>Agenda</button><button onClick={()=>setTab('uren')}>⏱<br/>Uren</button><button onClick={()=>setTab('cloud')}>☰<br/>Meer</button></div>
    {toast&&<div className="toast">{toast}</div>}
  </div>
}
function Nav({tab,setTab}){const items=[['dashboard','📊 Dashboard'],['planning','📅 Agenda'],['projecten','📁 Projecten'],['projectkaart','🧩 Projectkaart'],['betalingen','💳 Betalingen'],['uren','⏱ Uren'],['offerte','🤖 Slimme offerte'],['archief','📦 Archief'],['cloud','☁ Cloud']];return <div className="nav">{items.map(i=><button key={i[0]} className={tab===i[0]?'active':''} onClick={()=>setTab(i[0])}>{i[1]}</button>)}</div>}
function title(t){return {dashboard:'Dashboard PRO',planning:'Planning agenda',projecten:'Projecten',projectkaart:'Projectkaart PRO',betalingen:'Klantbetalingen',uren:'Urenregistratie',offerte:'Slimme offerte assistent',cloud:'Cloud Sync',archief:'Projectarchief'}[t]||'GIO Planner'}
function Dashboard({data,totals,setTab}){return <><div className="kpiGrid grid"><Kpi label="Actieve projecten" value={totals.active.length} pct={70}/><Kpi label="Uren totaal" value={totals.uren.toFixed(1)+' u'} pct={55}/><Kpi label="Omzet" value={euro(totals.omzet)} pct={75}/><Kpi label="Betaald" value={euro(totals.betaald)} pct={60}/><Kpi label="Openstaand" value={euro(totals.open)} pct={35}/></div><div className="dashGrid"><div><Agenda data={data}/></div><div><Alerts data={data}/><Balance totals={totals}/><div className="card"><h2>Snelle acties</h2><div className="actions"><button className="btn" onClick={()=>setTab('uren')}>▶ Inklokken</button><button className="btn dark" onClick={()=>setTab('projecten')}>➕ Project</button><button className="btn ghost" onClick={()=>setTab('betalingen')}>💳 Betaling</button><button className="btn ghost" onClick={()=>setTab('offerte')}>🤖 Offerte</button></div></div></div></div></>}
function Kpi({label,value,pct}){return <div className="kpi"><small>{label}</small><b>{value}</b><div className="bar"><span style={{width:Math.max(5,Math.min(100,pct))+'%'}}/></div></div>}
function Agenda({data}){const ds=weekDays();return <div className="card"><h2>📅 Weekagenda projecten</h2><div className="agenda">{ds.map(d=>{const key=dateKey(d);const ev=[...(data.planning||[]).filter(x=>x.datum===key),...(data.projecten||[]).filter(p=>(p.start||'')<=key && (p.eind||p.start||'')>=key).map(p=>({project:projectNaam(p),klant:p.klant,status:p.status,datum:key}))];return <div className="day" key={key}><div className="dayHead"><span>{d.toLocaleDateString('nl-NL',{weekday:'short'})}</span><span className="dateNr">{d.getDate()}</span></div>{ev.length?ev.map((e,i)=><div key={i} className={'event '+((e.status||'').toLowerCase().includes('wacht')?'orange':(e.status||'').toLowerCase().includes('betaald')?'green':'')}><span>{e.project}</span><small>{e.klant||e.tijd||''}</small></div>):<small style={{color:'#94a3b8'}}>Geen planning</small>}</div>})}</div></div>}
function Alerts({data}){const alerts=(data.projecten||[]).map(p=>({p,t:projectTotals(data,p),s:projectState(p,projectTotals(data,p))})).filter(x=>x.s.cls==='red'||x.s.cls==='orange').slice(0,5);return <div className="card"><h2>⚠️ Acties</h2><div className="list">{alerts.length?alerts.map(({p,s})=><div className="rowItem" key={p.id}><div><b>{projectNaam(p)}</b><br/><small>{p.klant}</small></div><span className={'status '+s.cls}>{s.label}</span></div>):<p>Geen urgente projecten.</p>}</div></div>}
function Balance({totals}){return <div className="card"><h2>📈 Balans & doel</h2><div className="list"><div className="rowItem"><span>Winst</span><b className="money good">{euro(totals.winst)}</b></div><div className="rowItem"><span>Kosten</span><b>{euro(totals.kosten)}</b></div><div className="rowItem"><span>Archief projecten</span><b>{totals.archive.length}</b></div></div></div>}
function Planning({data}){return <><Agenda data={data}/><div className="card"><h2>Alle planning</h2><div className="tableWrap"><table><thead><tr><th>Datum</th><th>Tijd</th><th>Project</th><th>Klant</th><th>Status</th></tr></thead><tbody>{(data.planning||[]).map((p,i)=><tr key={i}><td>{p.datum}</td><td>{p.tijd}</td><td>{p.project}</td><td>{p.klant}</td><td>{p.status}</td></tr>)}</tbody></table></div></div></>}
function Projects({data,totals,edit,setEdit,addProject,archiveProject}){return <><div className="card"><h2>Project toevoegen / aanpassen</h2><div className="formGrid"><Field label="Projectnaam" value={edit.project} onChange={v=>setEdit({...edit,project:v})}/><Field label="Klant" value={edit.klant} onChange={v=>setEdit({...edit,klant:v})}/><Field label="Startdatum" type="date" value={edit.start} onChange={v=>setEdit({...edit,start:v})}/><Field label="Einddatum" type="date" value={edit.eind} onChange={v=>setEdit({...edit,eind:v})}/><label>Status<select value={edit.status} onChange={e=>setEdit({...edit,status:e.target.value})}><option>Gepland</option><option>Actief</option><option>Wacht</option><option>Klaar</option><option>Betaald</option></select></label><Field label="Notitie" value={edit.notitie} onChange={v=>setEdit({...edit,notitie:v})}/></div><button className="btn" onClick={addProject}>💾 Project opslaan</button></div><div className="projectCards">{totals.active.map(p=>{const t=projectTotals(data,p),s=projectState(p,t);return <div className="projectCard" key={p.id}><h3>{projectNaam(p)}</h3><p>{p.klant}</p><span className={'status '+s.cls}>{s.label}</span><p><b>Start:</b> {p.start||'-'} <b>Eind:</b> {p.eind||'-'}</p><p>Open: <b className={t.open>0?'money warn':'money good'}>{euro(t.open)}</b></p><div className="actions"><button className="btn ghost" onClick={()=>archiveProject(p)}>Naar archief</button></div></div>})}</div></>}
function ProjectCard({data,project}){const p=(data.projecten||[]).find(x=>projectNaam(x)===project)||{};const t=projectTotals(data,project);return <div className="card"><h2>🧩 {project||'Geen project'}</h2><div className="kpiGrid grid"><Kpi label="Uren" value={t.uren.toFixed(1)+' u'} pct={50}/><Kpi label="Materiaal" value={euro(t.mat)} pct={55}/><Kpi label="Betaald" value={euro(t.betaald)} pct={65}/><Kpi label="Open" value={euro(t.open)} pct={35}/><Kpi label="Winst" value={euro(t.winst)} pct={70}/></div><div className="grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))'}}><div className="card"><h3>👤 Klant</h3><p>{p.klant||'-'}</p><p>{p.notitie}</p></div><div className="card"><h3>📅 Planning</h3><p>Start {p.start||'-'} / Eind {p.eind||'-'}</p><span className={'status '+projectState(p,t).cls}>{projectState(p,t).label}</span></div><div className="card"><h3>💳 Financieel</h3><p>Open materiaal: {euro(t.openMateriaal)}</p><p>Open totaal: {euro(t.open)}</p></div></div></div>}
function Payments({data,pay,setPay,addPayment}){return <><div className="card"><h2>💳 Betaling klant toevoegen</h2><div className="formGrid"><label>Project<select value={pay.project} onChange={e=>setPay({...pay,project:e.target.value})}><option value="">Kies project</option>{(data.projecten||[]).map(p=><option key={p.id}>{projectNaam(p)}</option>)}</select></label><Field label="Datum" type="date" value={pay.datum} onChange={v=>setPay({...pay,datum:v})}/><Field label="Bedrag" type="number" value={pay.bedrag} onChange={v=>setPay({...pay,bedrag:v})}/><label>Waarvoor<select value={pay.type} onChange={e=>setPay({...pay,type:e.target.value})}><option>Materiaal</option><option>Arbeid</option><option>Aanbetaling</option><option>Factuur</option><option>Overig</option></select></label><label>Betaalwijze<select value={pay.betaalwijze} onChange={e=>setPay({...pay,betaalwijze:e.target.value})}><option>Bank</option><option>Contant</option><option>Tikkie</option><option>Pin</option></select></label><Field label="Omschrijving" value={pay.omschrijving} onChange={v=>setPay({...pay,omschrijving:v})}/></div><button className="btn" onClick={addPayment}>Betaling opslaan</button></div><div className="projectCards">{(data.projecten||[]).map(p=>{const t=projectTotals(data,p);return <div className="projectCard" key={p.id}><h3>{projectNaam(p)}</h3><p>Materiaal totaal: <b>{euro(t.mat)}</b></p><p>Betaald materiaal: <b className="money good">{euro(t.betaaldMateriaal)}</b></p><p>Open materiaal: <b className={t.openMateriaal>0?'money warn':'money good'}>{euro(t.openMateriaal)}</b></p><p>Totaal betaald: <b>{euro(t.betaald)}</b></p><p>Nog open: <b className={t.open>0?'money warn':'money good'}>{euro(t.open)}</b></p></div>})}</div></>}
function Hours({data,clock,setClock,clockIn,clockOut}){const ac=data.activeClock;return <><div className="card"><h2>⏱ Inklokken</h2>{ac?.running&&<div className="rowItem"><div><b>🟢 Je bent ingeklokt</b><br/><small>{ac.project} sinds {ac.start}</small></div><button className="btn red" onClick={clockOut}>Uitklokken</button></div>}<div className="formGrid"><label>Project<select value={clock.project} onChange={e=>setClock({...clock,project:e.target.value})}><option value="">Kies project</option>{(data.projecten||[]).map(p=><option key={p.id}>{projectNaam(p)}</option>)}</select></label><Field label="Klant" value={clock.klant} onChange={v=>setClock({...clock,klant:v})}/><Field label="Tarief" type="number" value={clock.tarief} onChange={v=>setClock({...clock,tarief:v})}/></div><button className="btn" onClick={clockIn}>▶ Inklokken</button></div><div className="card"><h2>Urenregels</h2><div className="tableWrap"><table><thead><tr><th>Datum</th><th>Project</th><th>Start</th><th>Einde</th><th>Uren</th><th>Bedrag</th></tr></thead><tbody>{(data.uren||[]).slice().reverse().map((u,i)=><tr key={i}><td>{u.datum}</td><td>{u.project}</td><td>{u.start}</td><td>{u.einde}</td><td>{safeNum(u.uren).toFixed(2)}</td><td>{euro(u.bedrag)}</td></tr>)}</tbody></table></div></div></>}
function SmartOffer({data,offer,setOffer}){const similar=(data.projecten||[]).filter(p=>projectNaam(p).toLowerCase().includes(offer.toLowerCase())||offer.toLowerCase().includes(projectNaam(p).split(' ')[0]?.toLowerCase())).map(p=>({p,t:projectTotals(data,p)}));const count=similar.length||1;const avgH=similar.reduce((s,x)=>s+x.t.uren,0)/count;const avgM=similar.reduce((s,x)=>s+x.t.mat,0)/count;const avgW=similar.reduce((s,x)=>s+x.t.winst,0)/count;return <div className="card"><h2>🤖 Slimme offerte assistent</h2><p>De planner leert van afgeronde projecten en helpt bij nieuwe offertes.</p><Field label="Soort klus / zoekterm" value={offer} onChange={setOffer}/><div className="kpiGrid grid"><Kpi label="Vergelijkbare projecten" value={similar.length} pct={70}/><Kpi label="Gem. uren" value={avgH.toFixed(1)+' u'} pct={60}/><Kpi label="Gem. materiaal" value={euro(avgM)} pct={50}/><Kpi label="Gem. winst" value={euro(avgW)} pct={75}/><Kpi label="Advies" value={avgH?Math.ceil(avgH/7)+' dagen':'-'} pct={40}/></div></div>}
function Cloud({cloud,setCloud,login,syncUp,syncDown,syncNow,exportBackup}){return <div className="card"><h2>☁ Cloud Sync</h2><p>Status: <b>{cloud.status}</b></p><div className="formGrid"><Field label="E-mail" value={cloud.email} onChange={v=>setCloud({...cloud,email:v})}/><div className="passwordWrap"><label>Wachtwoord<input type={cloud.showPass?'text':'password'} value={cloud.password} onChange={e=>setCloud({...cloud,password:e.target.value})}/></label><button onClick={()=>setCloud({...cloud,showPass:!cloud.showPass})}>{cloud.showPass?'🙈':'👁️'}</button></div></div><div className="actions"><button className="btn" onClick={login}>Inloggen</button><button className="btn dark" onClick={syncUp}>Opslaan naar cloud</button><button className="btn ghost" onClick={syncDown}>Laatste gegevens ophalen</button><button className="btn ghost" onClick={exportBackup}>Backup downloaden</button></div></div>}
function Archive({data}){const archived=(data.projecten||[]).filter(p=>projectState(p,projectTotals(data,p)).archive);return <div className="card"><h2>📦 Projectarchief</h2><p>Afgeronde en betaalde projecten blijven meetellen in kwartaal- en jaarrapportages.</p><div className="projectCards">{archived.map(p=>{const t=projectTotals(data,p);return <div className="projectCard" key={p.id}><h3>{projectNaam(p)}</h3><p>{p.klant}</p><p>Winst: <b>{euro(t.winst)}</b></p><p>Betaald: <b>{euro(t.betaald)}</b></p></div>})}</div></div>}
function Field({label,value,onChange,type='text'}){return <label>{label}<input type={type} value={value||''} onChange={e=>onChange(e.target.value)}/></label>}
