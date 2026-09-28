(function(){
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let attachments=[];let activeFilter='Alles';
function ensure(){if(!window.data)return false;if(!Array.isArray(data.werkboek))data.werkboek=[];if(!Array.isArray(data.medewerkers))data.medewerkers=[];if(!Array.isArray(data.voertuigen))data.voertuigen=[];return true}
function uid(){return String(Date.now())+Math.random().toString(36).slice(2,7)}
function inject(){
 if($('werkboekpro'))return;
 const main=document.querySelector('main');if(!main)return;
 const s=document.createElement('section');s.id='werkboekpro';s.className='page';
 s.innerHTML=`<div class="card"><h2>📝 Werkboek PRO</h2>
 <input id="wbProEditId" type="hidden"><div class="gioWbGrid">
 <div><label>Type</label><select id="wbProType"><option>Notitie</option><option>Taak</option><option>Foto verslag</option><option>Opleverpunt</option><option>Herinnering</option></select></div>
 <div><label>Prioriteit</label><select id="wbProPriority"><option value="Laag">Laag</option><option value="Normaal" selected>Normaal</option><option value="Hoog">Hoog</option></select></div>
 <div><label>Vervaldatum</label><input id="wbProDue" type="date"></div>
 <div><label>Titel</label><input id="wbProTitle"></div>
 <div><label>Klant</label><select id="wbProClient"></select></div>
 <div><label>Project</label><select id="wbProProject"></select></div>
 <div><label>Medewerker</label><select id="wbProPerson"></select></div>
 <div><label>Voertuig</label><select id="wbProVehicle"></select></div>
 </div><label>Notitie / taak</label><textarea id="wbProText"></textarea>
 <label>Foto's of PDF's</label><input id="wbProFiles" type="file" accept="image/*,.pdf" multiple onchange="gioWbFiles(event)"><div id="wbProAttachmentPreview" class="gioWbAttachments"></div>
 <div class="gioWbActions"><button class="btn" onclick="gioWbSave()">💾 Opslaan</button><button class="btn2" onclick="gioWbClear()">Leegmaken</button></div></div>
 <div class="card"><h2>Werkboek overzicht</h2><div id="wbProToolbar" class="gioWbToolbar"></div><div class="gioWbGrid"><div><label>Zoeken</label><input id="wbProSearch" oninput="gioWbRender()"></div><div><label>Projectfilter</label><select id="wbProFilterProject" onchange="gioWbRender()"></select></div><div><label>Medewerkerfilter</label><select id="wbProFilterPerson" onchange="gioWbRender()"></select></div></div><div id="wbProList"></div></div>`;
 main.appendChild(s);
 const nav=document.querySelector('aside nav');if(nav&&!([...nav.querySelectorAll('button')].some(b=>b.textContent.includes('Werkboek PRO')))){const b=document.createElement('button');b.textContent='📝 Werkboek PRO';b.onclick=()=>{show('werkboekpro',b);gioWbInit()};nav.appendChild(b)}
}
function fill(){
 const cl=(data.klanten||[]).map(x=>x.naam||'').filter(Boolean),pr=(data.projecten||[]).map(x=>x.naam||'').filter(Boolean),pe=(data.medewerkers||[]).map(x=>({id:x.id,n:x.naam})),ve=(data.voertuigen||[]).map(x=>x.kenteken||x.naam||'').filter(Boolean);
 const str=(id,a,first)=>{const e=$(id);if(!e)return;const old=e.value;e.innerHTML=`<option value="">${first}</option>`+a.map(v=>`<option>${esc(v)}</option>`).join('');e.value=old};
 str('wbProClient',cl,'Niet gekoppeld');str('wbProProject',pr,'Niet gekoppeld');str('wbProVehicle',ve,'Niet gekoppeld');str('wbProFilterProject',pr,'Alle projecten');str('wbProFilterPerson',pe.map(x=>x.n),'Alle medewerkers');
 const person=$('wbProPerson');if(person){const old=person.value;person.innerHTML='<option value="">Niet gekoppeld</option>'+pe.map(x=>`<option value="${esc(x.id)}">${esc(x.n)}</option>`).join('');person.value=old}
}
function toolbar(){const a=['Alles','Open','Taken','Hoog','Gereed'];$('wbProToolbar').innerHTML=a.map(x=>`<button class="btn2 ${activeFilter===x?'active':''}" onclick="gioWbSetFilter('${x}')">${x}</button>`).join('')}
window.gioWbSetFilter=f=>{activeFilter=f;toolbar();gioWbRender()}
window.gioWbFiles=e=>{[...e.target.files].forEach(f=>{const r=new FileReader();r.onload=()=>{attachments.push({id:uid(),naam:f.name,type:f.type,data:r.result});preview()};r.readAsDataURL(f)})}
function preview(){const b=$('wbProAttachmentPreview');if(!b)return;b.innerHTML=attachments.map((a,i)=>a.type.startsWith('image/')?`<div><img src="${a.data}"><button class="del" onclick="gioWbRemoveFile(${i})">✕</button></div>`:`<div class="gioListCard">📄 ${esc(a.naam)} <button class="del" onclick="gioWbRemoveFile(${i})">✕</button></div>`).join('')}
window.gioWbRemoveFile=i=>{attachments.splice(i,1);preview()}
window.gioWbSave=()=>{ensure();const title=$('wbProTitle').value.trim(),text=$('wbProText').value.trim();if(!title&&!text){alert('Vul een titel of tekst in.');return}const id=$('wbProEditId').value||uid(),old=data.werkboek.find(x=>String(x.id)===String(id));const personId=$('wbProPerson').value,person=(data.medewerkers||[]).find(x=>String(x.id)===String(personId));const item={id,type:$('wbProType').value,prioriteit:$('wbProPriority').value,vervaldatum:$('wbProDue').value,titel:title||'Notitie',tekst:text,klant:$('wbProClient').value,project:$('wbProProject').value,medewerkerId:personId,medewerker:person?.naam||'',voertuig:$('wbProVehicle').value,bijlagen:attachments.length?attachments:(old?.bijlagen||[]),klaar:old?.klaar||false,aangemaakt:old?.aangemaakt||new Date().toISOString(),gewijzigd:new Date().toISOString()};const i=data.werkboek.findIndex(x=>String(x.id)===String(id));i>=0?data.werkboek.splice(i,1,item):data.werkboek.unshift(item);save();gioWbClear();gioWbRender()}
window.gioWbClear=()=>{['wbProEditId','wbProTitle','wbProText','wbProDue'].forEach(id=>$(id).value='');$('wbProType').value='Notitie';$('wbProPriority').value='Normaal';$('wbProClient').value='';$('wbProProject').value='';$('wbProPerson').value='';$('wbProVehicle').value='';$('wbProFiles').value='';attachments=[];preview()}
function filtered(){const q=($('wbProSearch')?.value||'').toLowerCase(),p=$('wbProFilterProject')?.value||'',m=$('wbProFilterPerson')?.value||'';return data.werkboek.filter(x=>(!p||x.project===p)&&(!m||x.medewerker===m)&&(!q||[x.titel,x.tekst,x.klant,x.project,x.medewerker,x.voertuig].join(' ').toLowerCase().includes(q))&&(activeFilter==='Alles'||(activeFilter==='Open'&&!x.klaar)||(activeFilter==='Taken'&&x.type==='Taak')||(activeFilter==='Hoog'&&x.prioriteit==='Hoog')||(activeFilter==='Gereed'&&x.klaar)))}
window.gioWbRender=()=>{if(!$('wbProList'))return;const rows=filtered();$('wbProList').innerHTML=rows.length?rows.map(x=>{const pr=x.prioriteit==='Hoog'?'high':x.prioriteit==='Normaal'?'medium':'';return `<article class="gioWbCard ${pr} ${x.klaar?'done':''}"><div class="gioWbHead"><div><h3 style="margin:0">${esc(x.titel)}</h3><div class="gioWbMeta">${esc(x.type||'Notitie')} • ${esc(x.prioriteit||'Normaal')} ${x.vervaldatum?'• '+esc(x.vervaldatum):''}</div></div><span class="gioWbBadge">${x.klaar?'Gereed':'Open'}</span></div><div class="gioListText">${esc(x.tekst||'')}</div><div class="gioWbMeta">${x.klant?esc(x.klant)+' • ':''}${x.project?esc(x.project)+' • ':''}${x.medewerker?esc(x.medewerker)+' • ':''}${esc(x.voertuig||'')}</div><div class="gioWbAttachments">${(x.bijlagen||[]).map(a=>a.type?.startsWith('image/')?`<img src="${a.data}">`:`<a class="pdfLink" href="${a.data}" target="_blank">📄 ${esc(a.naam)}</a>`).join('')}</div><div class="gioWbActions"><button onclick="gioWbEdit('${x.id}')">✏️ Bewerken</button><button onclick="gioWbDone('${x.id}')">${x.klaar?'↩ Open':'✓ Gereed'}</button><button class="del" onclick="gioWbDelete('${x.id}')">🗑️</button></div></article>`}).join(''):'<p>Geen werkboekitems gevonden.</p>'}
window.gioWbEdit=id=>{const x=data.werkboek.find(y=>String(y.id)===String(id));if(!x)return;fill();$('wbProEditId').value=x.id;$('wbProType').value=x.type||'Notitie';$('wbProPriority').value=x.prioriteit||'Normaal';$('wbProDue').value=x.vervaldatum||'';$('wbProTitle').value=x.titel||'';$('wbProText').value=x.tekst||'';$('wbProClient').value=x.klant||'';$('wbProProject').value=x.project||'';$('wbProPerson').value=x.medewerkerId||'';$('wbProVehicle').value=x.voertuig||'';attachments=[...(x.bijlagen||[])];preview();window.scrollTo({top:0,behavior:'smooth'})}
window.gioWbDone=id=>{const x=data.werkboek.find(y=>String(y.id)===String(id));if(x){x.klaar=!x.klaar;x.gewijzigd=new Date().toISOString();save();gioWbRender()}}
window.gioWbDelete=id=>{if(!confirm('Dit werkboekitem verwijderen?'))return;data.werkboek=data.werkboek.filter(x=>String(x.id)!==String(id));save();gioWbRender()}
window.gioWbInit=()=>{ensure();fill();toolbar();gioWbRender()}
function menus(){const old=window.gioOpenMoreOverlay;window.gioOpenMoreOverlay=function(){old?.();setTimeout(()=>{const g=document.querySelector('#gioOverlayBody .gioOverlayGrid');if(g&&!g.textContent.includes('Werkboek PRO'))g.insertAdjacentHTML('beforeend',`<button onclick="gioApprovedGo('werkboekpro');gioWbInit()"><i>📝</i>Werkboek PRO</button>`)},0)}}
function init(){ensure();inject();menus();document.title='GIO Business Planner PRO — MOBILE DEV 009'}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',()=>setTimeout(init,550)):setTimeout(init,550)
})();
