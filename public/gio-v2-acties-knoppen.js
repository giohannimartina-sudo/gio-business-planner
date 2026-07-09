
/* GIO Business Planner PRO v2.0 - Actieknoppen: wijzigen, notitie, verwijderen
   Veilige uitbreiding: vervangt geen bestaande functies/data.
*/
(function(){
  function getData(){
    if(window.data) return window.data;
    try { return JSON.parse(localStorage.getItem('gioBusinessPlannerData') || localStorage.getItem('gio_live_data') || '{}'); }
    catch(e){ return {}; }
  }
  function saveData(d){
    window.data = d;
    try{
      if(typeof save === 'function') save();
      else{
        localStorage.setItem('gioBusinessPlannerData', JSON.stringify(d));
        localStorage.setItem('gio_live_data', JSON.stringify(d));
      }
      if(typeof render === 'function') render();
    }catch(e){
      try{localStorage.setItem('gioBusinessPlannerData', JSON.stringify(d));}catch(_){}
    }
  }
  function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
  function ensureIds(arr,prefix){
    (arr||[]).forEach((x,i)=>{ if(!x.id) x.id = prefix + '_' + Date.now() + '_' + i + '_' + Math.random().toString(36).slice(2,7); });
  }
  function ensure(){
    const d=getData();
    if(!Array.isArray(d.uren)) d.uren=[];
    if(!Array.isArray(d.materiaal)) d.materiaal=[];
    if(!Array.isArray(d.uitgaven)) d.uitgaven=[];
    if(!Array.isArray(d.klanten)) d.klanten=[];
    if(!Array.isArray(d.projecten)) d.projecten=[];
    if(!Array.isArray(d.planning)) d.planning=[];
    ensureIds(d.uren,'uur');
    ensureIds(d.materiaal,'mat');
    ensureIds(d.uitgaven,'uit');
    ensureIds(d.klanten,'klant');
    ensureIds(d.projecten,'project');
    ensureIds(d.planning,'plan');
    window.data=d;
    return d;
  }
  function style(){
    if(document.getElementById('gioActionsStyle')) return;
    const s=document.createElement('style');
    s.id='gioActionsStyle';
    s.textContent=`
      .gioActionBtns{display:flex;gap:6px;flex-wrap:wrap}
      .gioActionBtns button,.gioMiniAction{border:0;border-radius:9px;padding:7px 9px;font-weight:800;cursor:pointer;font-size:12px}
      .gioEdit{background:#f4c400;color:#111}
      .gioNote{background:#2563eb;color:#fff}
      .gioDelete{background:#dc2626;color:#fff}
      .gioView{background:#111827;color:#fff}
      .gioDialogBackdrop{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:999999;display:flex;align-items:center;justify-content:center;padding:16px}
      .gioDialog{background:#fff;color:#111;border-radius:18px;padding:18px;max-width:560px;width:100%;box-shadow:0 18px 50px rgba(0,0,0,.35)}
      .gioDialog h2{margin-top:0;color:#111!important}
      .gioDialog label{display:block;font-weight:800;margin-top:8px;color:#111!important}
      .gioDialog input,.gioDialog select,.gioDialog textarea{width:100%;box-sizing:border-box;border:1px solid #ddd;border-radius:10px;padding:10px;margin-top:4px;color:#111!important;background:#fff!important}
      .gioDialogActions{display:flex;justify-content:flex-end;gap:8px;margin-top:14px}
      .gioDialogActions button{border:0;border-radius:10px;padding:10px 14px;font-weight:900;cursor:pointer}
      .gioSaveBtn{background:#f4c400;color:#111}
      .gioCancelBtn{background:#111827;color:#fff}
      .gioDangerBtn{background:#dc2626;color:#fff}
      .gioNoteBadge{display:inline-block;background:#2563eb;color:#fff;border-radius:999px;padding:2px 7px;font-size:11px;margin-left:4px}
    `;
    document.head.appendChild(s);
  }
  function dialog(title, body, onSave, saveText='Opslaan'){
    const wrap=document.createElement('div');
    wrap.className='gioDialogBackdrop';
    wrap.innerHTML=`<div class="gioDialog"><h2>${esc(title)}</h2><div class="gioDialogBody">${body}</div><div class="gioDialogActions"><button class="gioCancelBtn">Annuleren</button><button class="gioSaveBtn">${esc(saveText)}</button></div></div>`;
    document.body.appendChild(wrap);
    wrap.querySelector('.gioCancelBtn').onclick=()=>wrap.remove();
    wrap.querySelector('.gioSaveBtn').onclick=()=>{onSave(wrap); wrap.remove();};
  }
  function confirmDelete(title, text, onDelete){
    const wrap=document.createElement('div');
    wrap.className='gioDialogBackdrop';
    wrap.innerHTML=`<div class="gioDialog"><h2>${esc(title)}</h2><p style="color:#111!important">${esc(text)}</p><div class="gioDialogActions"><button class="gioCancelBtn">Annuleren</button><button class="gioDangerBtn">Verwijderen</button></div></div>`;
    document.body.appendChild(wrap);
    wrap.querySelector('.gioCancelBtn').onclick=()=>wrap.remove();
    wrap.querySelector('.gioDangerBtn').onclick=()=>{onDelete(); wrap.remove();};
  }
  function findById(arr,id){return (arr||[]).find(x=>String(x.id)===String(id));}
  function removeById(arr,id){const i=(arr||[]).findIndex(x=>String(x.id)===String(id)); if(i>=0) arr.splice(i,1);}

  function editGeneric(type,id){
    const d=ensure();
    const map={
      uren:['uren','Urenregel wijzigen',['datum','klant','project','start','einde','uren','bedrag']],
      materiaal:['materiaal','Materiaal wijzigen',['datum','leverancier','materiaal','bonnummer','bedrag','project']],
      uitgaven:['uitgaven','Uitgave wijzigen',['datum','categorie','omschrijving','bedrag','project']],
      klanten:['klanten','Klant wijzigen',['naam','type','email','telefoon','adres','postcode','plaats','kvk','btw']],
      projecten:['projecten','Project wijzigen',['naam','klant','status','startdatum','einddatum','projectnummer']],
      planning:['planning','Planning wijzigen',['datum','tijd','project','klant','omschrijving','status']]
    };
    const m=map[type]; if(!m) return;
    const item=findById(d[m[0]],id); if(!item) return alert('Item niet gevonden.');
    const inputs=m[2].map(k=>`<label>${esc(k)}</label><input data-field="${esc(k)}" value="${esc(item[k]??'')}">`).join('');
    dialog(m[1], inputs, (w)=>{
      w.querySelectorAll('[data-field]').forEach(inp=>{
        const k=inp.dataset.field;
        item[k]=inp.value;
      });
      if(type==='klanten' && String(item.type||'').toLowerCase()==='privé' || String(item.type||'').toLowerCase()==='prive'){
        item.kvk='n.v.t.';
      }
      saveData(d);
      setTimeout(enhance,200);
    });
  }
  function noteGeneric(type,id){
    const d=ensure();
    const map={uren:'uren',materiaal:'materiaal',uitgaven:'uitgaven',projecten:'projecten',planning:'planning'};
    const arr=d[map[type]]; const item=findById(arr,id); if(!item) return alert('Item niet gevonden.');
    const body=`<label>Notitie</label><textarea id="gioNoteText" rows="6">${esc(item.notitie||item.note||'')}</textarea><label><input type="checkbox" id="gioNoteInvoice" ${item.notitieOpFactuur?'checked':''}> Op factuur tonen</label>`;
    dialog('📝 Notitie toevoegen', body, (w)=>{
      item.notitie=w.querySelector('#gioNoteText').value;
      item.notitieOpFactuur=w.querySelector('#gioNoteInvoice').checked;
      saveData(d);
      setTimeout(enhance,200);
    });
  }
  function deleteGeneric(type,id){
    const d=ensure();
    const map={
      uren:['uren','urenregel'],
      materiaal:['materiaal','materiaalregel'],
      uitgaven:['uitgaven','uitgave'],
      klanten:['klanten','klant'],
      projecten:['projecten','project'],
      planning:['planning','planning']
    };
    const m=map[type]; if(!m) return;
    confirmDelete('Verwijderen', `Weet je zeker dat je deze ${m[1]} wilt verwijderen?`, ()=>{
      removeById(d[m[0]],id);
      saveData(d);
      setTimeout(enhance,200);
    });
  }
  window.gioEditItem=editGeneric;
  window.gioNoteItem=noteGeneric;
  window.gioDeleteItem=deleteGeneric;

  function rowText(row){return (row.textContent||'').toLowerCase();}
  function addActionsToTables(){
    ensure();
    const d=getData();
    const allRows=[...document.querySelectorAll('table tbody tr')];
    allRows.forEach(tr=>{
      if(tr.querySelector('.gioActionBtns')) return;
      const txt=rowText(tr);
      let type=null, item=null;
      // Match conservatively by visible text
      if(txt.includes('€') && (txt.includes(':') || txt.includes('uur') || txt.match(/\d{1,2}[-/]\d{1,2}/))){
        for(const x of d.uren||[]){
          if((!x.project || txt.includes(String(x.project).toLowerCase()) || !String(x.project).trim()) &&
             (!x.start || txt.includes(String(x.start).toLowerCase())) &&
             (!x.datum || txt.includes(String(x.datum).toLowerCase()) || txt.includes(String(x.datum).replaceAll('-','/').toLowerCase()))){
            type='uren'; item=x; break;
          }
        }
      }
      if(!item && txt.includes('€')){
        for(const x of d.materiaal||[]){
          const mat=String(x.materiaal||x.omschrijving||'').toLowerCase();
          if(mat && txt.includes(mat.slice(0,Math.min(12,mat.length)))){
            type='materiaal'; item=x; break;
          }
        }
      }
      if(!item){
        for(const x of d.uitgaven||[]){
          const oms=String(x.omschrijving||x.categorie||'').toLowerCase();
          if(oms && txt.includes(oms.slice(0,Math.min(12,oms.length)))){
            type='uitgaven'; item=x; break;
          }
        }
      }
      if(!item) return;
      const td=document.createElement('td');
      td.innerHTML=`<div class="gioActionBtns"><button class="gioEdit" onclick="gioEditItem('${type}','${item.id}')">✏️ Wijzigen</button><button class="gioNote" onclick="gioNoteItem('${type}','${item.id}')">📝 Notitie${item.notitie?'<span class=gioNoteBadge>1</span>':''}</button><button class="gioDelete" onclick="gioDeleteItem('${type}','${item.id}')">🗑️ Verwijderen</button></div>`;
      tr.appendChild(td);
    });
  }
  function addMobileUitgaven(){
    if(document.querySelector('[data-gio-mobile-uitgaven]')) return;
    const target=document.querySelector('.mobile-nav,.bottom-nav,.phone-nav') || document.querySelector('nav');
    if(!target) return;
    const b=document.createElement('button');
    b.dataset.gioMobileUitgaven='1';
    b.innerHTML='💸 Uitgave';
    b.onclick=()=>{ if(typeof showUitgaven==='function') showUitgaven(); else alert('Open Uitgaven / Investeren via het menu.'); };
    target.appendChild(b);
  }
  function fixKvkPrive(){
    document.addEventListener('change',e=>{
      const el=e.target;
      if(!el) return;
      const v=String(el.value||'').toLowerCase();
      if(v==='privé'||v==='prive'){
        const form=el.closest('form')||el.closest('.card')||document;
        const kvk=[...form.querySelectorAll('input')].find(i=>(i.placeholder||i.name||i.id||'').toLowerCase().includes('kvk'));
        if(kvk){kvk.value='n.v.t.'; kvk.disabled=true;}
      }
    },true);
  }
  function enhance(){
    style();
    addActionsToTables();
    addMobileUitgaven();
  }
  function init(){
    ensure();
    style();
    fixKvkPrive();
    enhance();
    const obs=new MutationObserver(()=>{clearTimeout(window.__gioActT); window.__gioActT=setTimeout(enhance,150);});
    obs.observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
