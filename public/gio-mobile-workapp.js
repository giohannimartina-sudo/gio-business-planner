(function(){
  'use strict';
  const isMobile=()=>window.matchMedia('(max-width:800px)').matches;
  let currentActionSource=null;

  function textEmpty(td){
    const t=(td.textContent||'').replace(/\s+/g,' ').trim();
    return !t || t==='-' || t==='—' || t.toLowerCase()==='n.v.t.';
  }
  function enhanceTables(){
    document.querySelectorAll('table').forEach(table=>{
      if(table.closest('#gioOfferPrintable,#gioInvoicePrintable'))return;
      const headers=[...table.querySelectorAll('thead th')].map(x=>(x.textContent||'').trim());
      if(!headers.length)return;
      table.classList.add('gioMobileCards');
      table.querySelectorAll('tbody tr').forEach(tr=>{
        [...tr.children].forEach((td,i)=>{
          td.setAttribute('data-label',headers[i]||'');
          td.classList.toggle('gioEmptyCell',textEmpty(td));
          if(td.querySelector('button,.rcActionRow,.gioQuickActions'))td.classList.add('gioActionsCell');
        });
      });
    });
  }

  function ensureSheet(){
    if(document.getElementById('gioMobileActionSheet'))return;
    document.body.insertAdjacentHTML('beforeend',`<div id="gioMobileActionSheet" aria-hidden="true"><div class="gioSheetPanel"><div class="gioSheetHandle"></div><div class="gioSheetTitle">Acties</div><div class="gioSheetGrid"></div><button type="button" class="gioSheetClose">Sluiten</button></div></div>`);
    const sheet=document.getElementById('gioMobileActionSheet');
    sheet.addEventListener('click',e=>{if(e.target===sheet||e.target.closest('.gioSheetClose'))closeSheet();});
  }
  function closeSheet(){
    const s=document.getElementById('gioMobileActionSheet');if(!s)return;s.classList.remove('open');s.setAttribute('aria-hidden','true');currentActionSource=null;
  }
  function openSheetFrom(source,title){
    ensureSheet();currentActionSource=source;
    const s=document.getElementById('gioMobileActionSheet'),grid=s.querySelector('.gioSheetGrid');
    s.querySelector('.gioSheetTitle').textContent=title||'Acties';grid.innerHTML='';
    const buttons=[...source.querySelectorAll('button,a')].filter(x=>!x.classList.contains('gioMobileActionTrigger'));
    buttons.forEach((original)=>{
      const b=document.createElement('button');b.type='button';b.textContent=(original.title||original.getAttribute('aria-label')||original.textContent||'Actie').trim();
      b.addEventListener('click',()=>{closeSheet();original.click();});grid.appendChild(b);
    });
    if(!buttons.length){grid.innerHTML='<small style="color:#aaa">Geen acties beschikbaar.</small>'}
    s.classList.add('open');s.setAttribute('aria-hidden','false');
  }
  function enhanceActionRows(){
    if(!isMobile())return;
    document.querySelectorAll('.rcActionRow').forEach(row=>{
      if(row.dataset.mobileOverlay==='1')return;
      row.dataset.mobileOverlay='1';
      const trigger=document.createElement('button');trigger.type='button';trigger.className='gioMobileActionTrigger rcIconBtn';trigger.title='Acties';trigger.textContent='⋮';
      trigger.addEventListener('click',e=>{e.stopPropagation();openSheetFrom(row,'Projectacties');});
      row.parentNode.insertBefore(trigger,row);row.classList.add('gioOriginalActionsMobileHidden');
    });
  }
  function ensureMoreButton(){
    if(!isMobile()||document.querySelector('.gioMobileMoreBtn'))return;
    const b=document.createElement('button');b.type='button';b.className='gioMobileMoreBtn';b.title='Snelle acties';b.textContent='+';
    b.addEventListener('click',()=>{
      const temp=document.createElement('div');
      const actions=[['⏱ Uren','uren'],['📦 Materiaal','materiaal'],['💸 Uitgaven','uitgaven'],['👥 Klanten','klanten'],['☁️ Cloud','cloud'],['📊 Balans','rapport']];
      actions.forEach(([label,page])=>{const x=document.createElement('button');x.textContent=label;x.addEventListener('click',()=>{if(typeof window.show==='function')window.show(page,null);});temp.appendChild(x)});
      openSheetFrom(temp,'Snelle acties');
    });
    document.body.appendChild(b);
  }
  function refresh(){enhanceTables();enhanceActionRows();ensureMoreButton();}
  let queued=false;function queue(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;refresh();});}
  document.addEventListener('DOMContentLoaded',()=>{ensureSheet();refresh();new MutationObserver(queue).observe(document.body,{childList:true,subtree:true});});
  window.addEventListener('resize',queue);
})();
