
(function(){
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function ensure(){
  if(!window.data)return false;
  if(!Array.isArray(data.klanten))data.klanten=[];
  data.klanten.forEach(k=>{
    if(!Array.isArray(k.contactpersonen))k.contactpersonen=[];
    if(!Array.isArray(k.adressen))k.adressen=[];
    if(!Array.isArray(k.documenten))k.documenten=[];
    if(!Array.isArray(k.historie))k.historie=[];
    if(typeof k.favoriet!=='boolean')k.favoriet=false;
  });
  return true;
}
function uid(){return Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-4)}
let activeTab='Alle';
let clientFileData='', clientFileName='';
function inject(){
  if($('klantenpro'))return;
  const main=document.querySelector('main'); if(!main)return;
  const s=document.createElement('section'); s.id='klantenpro'; s.className='page';
  s.innerHTML=`
    <div class="card">
      <h2>👥 Klantenboek PRO</h2>
      <div id="gioClientTabs" class="gioClientTabs"></div>
      <div class="row">
        <div><label>Zoeken</label><input id="gioClientSearch" oninput="gioRenderClients()" placeholder="Naam, plaats, telefoon, project"></div>
        <div><label>Type</label><select id="gioClientTypeFilter" onchange="gioRenderClients()"><option value="">Alle typen</option><option>Privé</option><option>Zakelijk</option></select></div>
      </div>
      <div id="gioClientList"></div>
    </div>

    <div id="gioClientDetail" class="card" style="display:none">
      <input id="gioClientId" type="hidden">
      <div class="gioClientTop">
        <div><h2 id="gioClientTitle">Klant</h2><div id="gioClientMeta"></div></div>
        <button class="btn2" onclick="gioCloseClientDetail()">✕</button>
      </div>
      <div class="gioClientActions">
        <button class="btn2" onclick="gioClientOpenRoute()">🗺 Route</button>
        <button class="btn2" onclick="gioClientCall()">📞 Bellen</button>
        <button class="btn2" onclick="gioClientMail()">✉️ Mail</button>
        <button class="btn2" onclick="gioClientNewProject()">📁 Nieuw project</button>
        <button class="btn2" onclick="gioClientPlan()">📅 Inplannen</button>
      </div>

      <div class="gioClientDetails">
        <div class="gioClientBox"><h3>Contactpersonen</h3><div id="gioClientContacts"></div>
          <div class="row"><div><label>Naam</label><input id="gioContactName"></div><div><label>Telefoon</label><input id="gioContactPhone"></div><div><label>E-mail</label><input id="gioContactEmail"></div></div>
          <button class="btn2" onclick="gioAddClientContact()">+ Contactpersoon</button>
        </div>
        <div class="gioClientBox"><h3>Adressen</h3><div id="gioClientAddresses"></div>
          <div class="row"><div><label>Naam locatie</label><input id="gioAddressLabel" placeholder="Werkadres, factuuradres"></div><div><label>Adres</label><input id="gioAddressStreet"></div><div><label>Postcode</label><input id="gioAddressZip"></div><div><label>Plaats</label><input id="gioAddressCity"></div></div>
          <button class="btn2" onclick="gioAddClientAddress()">+ Adres</button>
        </div>
      </div>

      <div class="gioClientDetails">
        <div class="gioClientBox"><h3>Documenten en foto's</h3>
          <input id="gioClientFile" type="file" accept="image/*,.pdf" onchange="gioClientFileChoose(event)">
          <input id="gioClientFileLabel" placeholder="Omschrijving document">
          <button class="btn2" onclick="gioAddClientDocument()">+ Opslaan</button>
          <div id="gioClientDocuments"></div>
        </div>
        <div class="gioClientBox"><h3>Geschiedenis</h3><div id="gioClientHistory"></div></div>
      </div>
    </div>`;
  main.appendChild(s);

  const nav=document.querySelector('aside nav');
  if(nav && ![...nav.querySelectorAll('button')].some(b=>b.textContent.includes('Klantenboek PRO'))){
    const b=document.createElement('button');
    b.textContent='👥 Klantenboek PRO';
    b.onclick=()=>{show('klantenpro',b);gioClientsInit()};
    nav.appendChild(b);
  }
}
function tabs(){
  const items=['Alle','Favorieten','Privé','Zakelijk'];
  $('gioClientTabs').innerHTML=items.map(x=>`<button class="btn2 ${activeTab===x?'active':''}" onclick="gioSetClientTab('${x}')">${x}</button>`).join('');
}
window.gioSetClientTab=t=>{activeTab=t;tabs();gioRenderClients()}
function filtered(){
  const q=($('gioClientSearch')?.value||'').toLowerCase();
  const ft=$('gioClientTypeFilter')?.value||'';
  return data.klanten.filter(k=>{
    const type=k.type||k.klantType||'Privé';
    const tabOk=activeTab==='Alle'||(activeTab==='Favorieten'&&k.favoriet)||activeTab===type;
    return tabOk&&(!ft||type===ft)&&(!q||[k.naam,k.plaats,k.telefoon,k.email,k.contact,k.adres].join(' ').toLowerCase().includes(q));
  }).sort((a,b)=>(b.favoriet?1:0)-(a.favoriet?1:0)||String(a.naam).localeCompare(String(b.naam)));
}
window.gioRenderClients=()=>{
  ensure(); tabs();
  const rows=filtered();
  $('gioClientList').innerHTML=rows.length?rows.map(k=>`<article class="gioClientCard ${k.favoriet?'favorite':''}">
    <div class="gioClientTop"><div><h3 style="margin:0">${esc(k.naam||'Onbekend')}</h3><div class="gioListMeta">${esc(k.type||'Privé')} • ${esc(k.plaats||'-')}</div></div><button onclick="gioToggleClientFavorite('${k.klantNr||k.id||k.naam}')">${k.favoriet?'⭐':'☆'}</button></div>
    <div class="gioListText">${k.telefoon?'<b>Tel:</b> '+esc(k.telefoon)+'<br>':''}${k.email?'<b>E-mail:</b> '+esc(k.email)+'<br>':''}${k.adres?'<b>Adres:</b> '+esc(k.adres):''}</div>
    <div class="gioClientActions"><button onclick="gioOpenClient('${k.klantNr||k.id||k.naam}')">👁 Open</button><button onclick="gioQuickClientRoute('${k.klantNr||k.id||k.naam}')">🗺 Route</button><button onclick="gioQuickClientPlan('${k.klantNr||k.id||k.naam}')">📅 Plan</button></div>
  </article>`).join(''):'<p>Geen klanten gevonden.</p>';
}
function findClient(id){return data.klanten.find(k=>String(k.klantNr||k.id||k.naam)===String(id))}
function selected(){return findClient($('gioClientId')?.value)}
window.gioToggleClientFavorite=id=>{const k=findClient(id);if(!k)return;k.favoriet=!k.favoriet;k.historie.unshift({tijd:new Date().toISOString(),actie:k.favoriet?'Als favoriet gemarkeerd':'Favoriet verwijderd'});save();gioRenderClients()}
window.gioOpenClient=id=>{const k=findClient(id);if(!k)return;$('gioClientId').value=id;$('gioClientTitle').textContent=k.naam||'Klant';$('gioClientMeta').textContent=`${k.type||'Privé'} • ${k.plaats||'-'}`;$('gioClientDetail').style.display='block';renderDetail(k);$('gioClientDetail').scrollIntoView({behavior:'smooth'})}
window.gioCloseClientDetail=()=>{$('gioClientDetail').style.display='none'}
function renderDetail(k){
  $('gioClientContacts').innerHTML=k.contactpersonen.length?k.contactpersonen.map((c,i)=>`<div class="gioClientDoc"><span><b>${esc(c.naam)}</b><br><small>${esc(c.telefoon||'')} ${esc(c.email||'')}</small></span><button class="del" onclick="gioDeleteClientContact(${i})">🗑️</button></div>`).join(''):'Geen extra contactpersonen.';
  $('gioClientAddresses').innerHTML=k.adressen.length?k.adressen.map((a,i)=>`<div class="gioClientDoc"><span><b>${esc(a.label||'Adres')}</b><br><small>${esc(a.adres)} ${esc(a.postcode)} ${esc(a.plaats)}</small></span><button class="del" onclick="gioDeleteClientAddress(${i})">🗑️</button></div>`).join(''):'Geen extra adressen.';
  $('gioClientDocuments').innerHTML=k.documenten.length?k.documenten.map((d,i)=>`<div class="gioClientDoc"><span>${esc(d.label||d.naam)}</span><span><a class="pdfLink" href="${d.data}" target="_blank">Open</a> <button class="del" onclick="gioDeleteClientDocument(${i})">🗑️</button></span></div>`).join(''):'Geen documenten.';
  const projectHistory=(data.projecten||[]).filter(p=>p.klant===k.naam).map(p=>({tijd:p.start||'',actie:'Project: '+(p.naam||'')}));
  const planHistory=(data.planning||[]).filter(p=>p.klant===k.naam).map(p=>({tijd:p.datum||'',actie:'Planning: '+(p.project||'')}));
  const all=[...k.historie,...projectHistory,...planHistory].sort((a,b)=>String(b.tijd).localeCompare(String(a.tijd))).slice(0,30);
  $('gioClientHistory').innerHTML=all.length?all.map(h=>`<div class="gioClientHistory"><b>${esc(h.actie)}</b><br><small>${esc(h.tijd)}</small></div>`).join(''):'Nog geen geschiedenis.';
}
window.gioAddClientContact=()=>{const k=selected();if(!k)return;const naam=$('gioContactName').value.trim();if(!naam){alert('Vul naam in');return}k.contactpersonen.push({id:uid(),naam,telefoon:$('gioContactPhone').value.trim(),email:$('gioContactEmail').value.trim()});k.historie.unshift({tijd:new Date().toISOString(),actie:'Contactpersoon toegevoegd: '+naam});save();['gioContactName','gioContactPhone','gioContactEmail'].forEach(id=>$(id).value='');renderDetail(k)}
window.gioDeleteClientContact=i=>{const k=selected();if(!k||!confirm('Contactpersoon verwijderen?'))return;k.contactpersonen.splice(i,1);save();renderDetail(k)}
window.gioAddClientAddress=()=>{const k=selected();if(!k)return;const adres=$('gioAddressStreet').value.trim();if(!adres){alert('Vul adres in');return}k.adressen.push({id:uid(),label:$('gioAddressLabel').value.trim(),adres,postcode:$('gioAddressZip').value.trim(),plaats:$('gioAddressCity').value.trim()});k.historie.unshift({tijd:new Date().toISOString(),actie:'Adres toegevoegd'});save();['gioAddressLabel','gioAddressStreet','gioAddressZip','gioAddressCity'].forEach(id=>$(id).value='');renderDetail(k)}
window.gioDeleteClientAddress=i=>{const k=selected();if(!k||!confirm('Adres verwijderen?'))return;k.adressen.splice(i,1);save();renderDetail(k)}
window.gioClientFileChoose=e=>{const f=e.target.files?.[0];if(!f)return;clientFileName=f.name;const r=new FileReader();r.onload=()=>clientFileData=r.result;r.readAsDataURL(f)}
window.gioAddClientDocument=()=>{const k=selected();if(!k||!clientFileData){alert('Kies eerst een bestand');return}k.documenten.push({id:uid(),naam:clientFileName,label:$('gioClientFileLabel').value.trim(),data:clientFileData,datum:new Date().toISOString()});k.historie.unshift({tijd:new Date().toISOString(),actie:'Document toegevoegd: '+clientFileName});save();clientFileData='';clientFileName='';$('gioClientFile').value='';$('gioClientFileLabel').value='';renderDetail(k)}
window.gioDeleteClientDocument=i=>{const k=selected();if(!k||!confirm('Document verwijderen?'))return;k.documenten.splice(i,1);save();renderDetail(k)}
function routeFor(k){const a=(k.adressen&&k.adressen[0])||{adres:k.adres,postcode:k.postcode,plaats:k.plaats};return [a.adres,a.postcode,a.plaats].filter(Boolean).join(' ')}
window.gioClientOpenRoute=()=>{const k=selected();if(k)window.open('https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(routeFor(k)),'_blank')}
window.gioQuickClientRoute=id=>{const k=findClient(id);if(k)window.open('https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(routeFor(k)),'_blank')}
window.gioClientCall=()=>{const k=selected();if(k?.telefoon)location.href='tel:'+k.telefoon}
window.gioClientMail=()=>{const k=selected();if(k?.email)location.href='mailto:'+k.email}
window.gioClientNewProject=()=>{const k=selected();if(!k)return;const b=[...document.querySelectorAll('aside nav button')].find(x=>x.textContent.includes('Projecten'));show('projecten',b||document.querySelector('aside nav button'));if($('projKlant'))$('projKlant').value=k.naam}
window.gioClientPlan=()=>{const k=selected();if(!k)return;const b=[...document.querySelectorAll('aside nav button')].find(x=>x.textContent.includes('Planning'));show('planning',b||document.querySelector('aside nav button'));if($('pKlant'))$('pKlant').value=k.naam}
window.gioQuickClientPlan=id=>{const k=findClient(id);if(!k)return;const b=[...document.querySelectorAll('aside nav button')].find(x=>x.textContent.includes('Planning'));show('planning',b||document.querySelector('aside nav button'));if($('pKlant'))$('pKlant').value=k.naam}
window.gioClientsInit=()=>{ensure();tabs();gioRenderClients()}
function patchMenus(){
  const old=window.gioOpenMoreOverlay;
  window.gioOpenMoreOverlay=function(){old?.();setTimeout(()=>{const g=document.querySelector('#gioOverlayBody .gioOverlayGrid');if(g&&!g.textContent.includes('Klantenboek PRO'))g.insertAdjacentHTML('beforeend',`<button onclick="gioApprovedGo('klantenpro');gioClientsInit()"><i>👥</i>Klantenboek PRO</button>`)},0)}
}
function init(){ensure();inject();patchMenus();gioClientsInit();document.title='GIO Business Planner PRO — MOBILE DEV 010'}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',()=>setTimeout(init,600)):setTimeout(init,600);
})();
