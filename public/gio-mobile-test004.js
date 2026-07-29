/* GIO Mobile TEST 003 - mobile interface only, keeps existing data/functions */
(function(){
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function ensure(){
    if(!window.data)return;
    if(!Array.isArray(data.werkboek))data.werkboek=[];
    if(!Array.isArray(data.voorraad))data.voorraad=[];
    if(!Array.isArray(data.kmRegistraties))data.kmRegistraties=[];
    if(!Array.isArray(data.medewerkers))data.medewerkers=[];
  }
  window.gioMobileGo=function(id,btn){
    gioCloseMobileOverlay();
    const desktopBtn=[...document.querySelectorAll('aside nav button')].find(b=>(b.getAttribute('onclick')||'').includes("'"+id+"'"));
    if(typeof show==='function')show(id,desktopBtn||btn||document.querySelector('aside nav button'));
    document.querySelectorAll('#gioBottomDock button').forEach(b=>b.classList.toggle('active',b.dataset.mobilePage===id));
    if(id==='werkboek'){gioFillWerkboekSelects();gioRenderWerkboek()}
    if(id==='voorraad')gioRenderVoorraad();
    if(id==='medewerkers'){gioFillMedewerkerProjecten();gioRenderMedewerkers();}
    if(id==='uitgaven'&&typeof gioKmFillSavedLocationSelects==='function')gioKmFillSavedLocationSelects();
    window.scrollTo({top:0,behavior:'smooth'});
  };
  function button(icon,label,id,extra=''){return `<button ${extra} onclick="gioMobileGo('${id}',this)"><i>${icon}</i>${label}</button>`}
  window.gioOpenMoreOverlay=function(){
    gioOverlayTitle.textContent='Alle functies';
    gioOverlayBody.innerHTML=`<div class="gioOverlayGrid">
      ${button('👥','Klantenboek','klanten')}${button('👷','Medewerkers / Inhuur','medewerkers')}${button('⏱️','Uren','uren')}${button('🚗','KM / Reisuren','uitgaven','class="gioGreen"')}
      ${button('🧰','Materialen','materiaal')}${button('📦','Voorraad','voorraad')}${button('📁','Projectkaart','projectkaartpro')}
      ${button('💸','Uitgaven','uitgaven')}${button('💳','Betalingen','betalingen')}${button('📄','Offertes','offertes')}
      ${button('🧾','Facturen','facturatiepro')}${button('☁️','Cloud & Sync','cloud','class="gioPrimary"')}${button('💾','Back-up / Export','export')}
      ${button('📈','Balans','rapport')}${button('📦','Archief','archief')}${button('⚙️','Instellingen','instellingen')}
      ${button('🏖️','Vrije dagen','vrijedagen')}
    </div>`;
    gioMobileOverlay.classList.add('open');
  };
  window.gioToggleQuickOverlay=function(){
    gioOverlayTitle.textContent='Snelle actie';
    gioOverlayBody.innerHTML=`<div class="gioOverlayGrid">
      ${button('▶️','Inklokken','uren','class="gioPrimary"')}${button('📝','Notitie','werkboek')}${button('🚗','KM / Reisuren','uitgaven','class="gioGreen"')}
      ${button('🧰','Materiaal','materiaal')}${button('💸','Uitgave','uitgaven')}${button('👤','Nieuwe klant','klanten')}
      ${button('📁','Nieuw project','projecten')}${button('📦','Voorraad','voorraad')}${button('☁️','Synchroniseren','cloud')}
    </div>`;
    gioMobileOverlay.classList.add('open');
  };
  window.gioCloseMobileOverlay=()=>gioMobileOverlay.classList.remove('open');
  window.gioOverlayBackdrop=e=>{if(e.target===gioMobileOverlay)gioCloseMobileOverlay()};

  window.gioFillWerkboekSelects=function(){
    ensure();
    const clients=(data.klanten||[]).map(k=>k.naam||k.name||'').filter(Boolean);
    const projects=(data.projecten||[]).map(p=>p.naam||p.project||'').filter(Boolean);
    const fill=(el,arr,first)=>{if(!el)return;const old=el.value;el.innerHTML=`<option value="">${first}</option>`+arr.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('');el.value=old};
    fill(wbKlant,clients,'Niet gekoppeld');fill(wbProject,projects,'Niet gekoppeld');fill(wbFilterProject,projects,'Alle projecten');
  };
  window.gioWerkboekLeegmaken=function(){['wbEditId','wbTitel','wbTekst'].forEach(id=>document.getElementById(id).value='');wbSoort.value='Notitie';wbKlant.value='';wbProject.value=''};
  window.gioWerkboekOpslaan=function(){
    ensure();const title=wbTitel.value.trim(),text=wbTekst.value.trim();if(!title&&!text){alert('Vul een titel of notitie in.');return}
    const item={id:wbEditId.value||String(Date.now()),titel:title||'Notitie',tekst:text,soort:wbSoort.value,klant:wbKlant.value,project:wbProject.value,datum:new Date().toISOString(),gewijzigd:new Date().toISOString(),klaar:false};
    const idx=data.werkboek.findIndex(x=>String(x.id)===String(item.id));if(idx>=0)item.datum=data.werkboek[idx].datum||item.datum;
    idx>=0?data.werkboek.splice(idx,1,item):data.werkboek.unshift(item);save();gioWerkboekLeegmaken();gioRenderWerkboek();
  };
  window.gioRenderWerkboek=function(){
    ensure();if(!document.getElementById('wbLijst'))return;gioFillWerkboekSelects();const q=(wbZoek.value||'').toLowerCase(),fp=wbFilterProject.value||'';
    const rows=data.werkboek.filter(x=>(!fp||x.project===fp)&&(!q||[x.titel,x.tekst,x.soort,x.klant,x.project].join(' ').toLowerCase().includes(q)));
    wbLijst.innerHTML=rows.length?rows.map(x=>`<article class="gioListCard ${x.klaar?'done':''}"><div class="gioListHead"><h3>${esc(x.titel)}</h3><span>${esc(x.soort||'Notitie')}</span></div><div class="gioListMeta">${new Date(x.gewijzigd||x.datum).toLocaleString('nl-NL')} ${x.klant?'• '+esc(x.klant):''} ${x.project?'• '+esc(x.project):''}</div><div class="gioListText">${esc(x.tekst||'')}</div><div class="gioListActions"><button onclick="gioWerkboekBewerk('${x.id}')">✏️ Bewerken</button><button onclick="gioWerkboekKlaar('${x.id}')">${x.klaar?'↩ Open':'✓ Klaar'}</button><button onclick="gioWerkboekVerwijder('${x.id}')">🗑️</button></div></article>`).join(''):'<p>Nog geen notities.</p>';
  };
  window.gioWerkboekBewerk=function(id){const x=data.werkboek.find(x=>String(x.id)===String(id));if(!x)return;wbEditId.value=x.id;wbTitel.value=x.titel||'';wbTekst.value=x.tekst||'';wbSoort.value=x.soort||'Notitie';wbKlant.value=x.klant||'';wbProject.value=x.project||'';window.scrollTo({top:0,behavior:'smooth'})};
  window.gioWerkboekKlaar=function(id){const x=data.werkboek.find(x=>String(x.id)===String(id));if(x){x.klaar=!x.klaar;x.gewijzigd=new Date().toISOString();save();gioRenderWerkboek()}};
  window.gioWerkboekVerwijder=function(id){if(!confirm('Deze notitie verwijderen?'))return;data.werkboek=data.werkboek.filter(x=>String(x.id)!==String(id));save();gioRenderWerkboek()};

  window.gioFillMedewerkerProjecten=function(){
    ensure();const el=document.getElementById('medProject');if(!el)return;const old=el.value;
    const projects=(data.projecten||[]).map(p=>p.naam||p.project||'').filter(Boolean);
    el.innerHTML='<option value="">Niet gekoppeld</option>'+projects.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('');el.value=old;
  };
  window.gioMedewerkerLeegmaken=function(){
    ['medEditId','medNaam','medBedrijf','medContact','medUurtarief','medDagtarief','medReiskosten','medBetaald','medNotitie'].forEach(id=>{const e=document.getElementById(id);if(e)e.value=''});
    medType.value='Eigen medewerker';medProject.value='';medStatus.value='Actief';
  };
  window.gioMedewerkerOpslaan=function(){
    ensure();const naam=medNaam.value.trim();if(!naam){alert('Vul een naam in.');return}
    const id=medEditId.value||String(Date.now()),old=data.medewerkers.find(x=>String(x.id)===String(id));
    const item={id,naam,type:medType.value,bedrijf:medBedrijf.value.trim(),contact:medContact.value.trim(),uurtarief:+medUurtarief.value||0,dagtarief:+medDagtarief.value||0,reiskosten:+medReiskosten.value||0,project:medProject.value,betaald:+medBetaald.value||0,status:medStatus.value,notitie:medNotitie.value.trim(),aangemaakt:old?.aangemaakt||new Date().toISOString(),gewijzigd:new Date().toISOString()};
    const i=data.medewerkers.findIndex(x=>String(x.id)===String(id));i>=0?data.medewerkers.splice(i,1,item):data.medewerkers.unshift(item);save();gioMedewerkerLeegmaken();gioRenderMedewerkers();
  };
  window.gioRenderMedewerkers=function(){
    ensure();const box=document.getElementById('medLijst');if(!box)return;gioFillMedewerkerProjecten();const q=(medZoek.value||'').toLowerCase(),ft=medFilterType.value||'';
    const rows=data.medewerkers.filter(x=>(!ft||x.type===ft)&&(!q||[x.naam,x.bedrijf,x.contact,x.project,x.status].join(' ').toLowerCase().includes(q)));
    const open=data.medewerkers.reduce((s,x)=>s+Math.max(0,(+x.uurtarief||0)-0),0);const paid=data.medewerkers.reduce((s,x)=>s+(+x.betaald||0),0);
    medKpis.innerHTML=`<div><b>${data.medewerkers.length}</b><small>Totaal</small></div><div><b>${data.medewerkers.filter(x=>x.status==='Actief').length}</b><small>Actief</small></div><div><b>${typeof euro==='function'?euro(paid):paid.toFixed(2)}</b><small>Betaald</small></div>`;
    box.innerHTML=rows.length?rows.map(x=>`<article class="gioListCard"><div class="gioListHead"><div><h3>${esc(x.naam)}</h3><div class="gioListMeta">${esc(x.type||'-')}${x.bedrijf?' • '+esc(x.bedrijf):''}</div></div><span>${esc(x.status||'Actief')}</span></div><div class="gioListText">${x.project?'<b>Project:</b> '+esc(x.project)+'<br>':''}${x.contact?'<b>Contact:</b> '+esc(x.contact)+'<br>':''}<b>Uurtarief:</b> ${typeof euro==='function'?euro(x.uurtarief):x.uurtarief} ${x.dagtarief?' • <b>Dagtarief:</b> '+(typeof euro==='function'?euro(x.dagtarief):x.dagtarief):''}${x.reiskosten?' • <b>Reis:</b> '+(typeof euro==='function'?euro(x.reiskosten):x.reiskosten):''}${x.notitie?'<br>'+esc(x.notitie):''}</div><div class="gioListActions"><button onclick="gioMedewerkerBewerk('${x.id}')">✏️ Bewerken</button><button onclick="gioMedewerkerVerwijder('${x.id}')">🗑️</button></div></article>`).join(''):'<p>Nog geen medewerkers of inhuur toegevoegd.</p>';
  };
  window.gioMedewerkerBewerk=function(id){const x=data.medewerkers.find(x=>String(x.id)===String(id));if(!x)return;gioFillMedewerkerProjecten();medEditId.value=x.id;medNaam.value=x.naam||'';medType.value=x.type||'Eigen medewerker';medBedrijf.value=x.bedrijf||'';medContact.value=x.contact||'';medUurtarief.value=x.uurtarief||0;medDagtarief.value=x.dagtarief||0;medReiskosten.value=x.reiskosten||0;medProject.value=x.project||'';medBetaald.value=x.betaald||0;medStatus.value=x.status||'Actief';medNotitie.value=x.notitie||'';window.scrollTo({top:0,behavior:'smooth'})};
  window.gioMedewerkerVerwijder=function(id){if(!confirm('Deze medewerker of inhuur verwijderen?'))return;data.medewerkers=data.medewerkers.filter(x=>String(x.id)!==String(id));save();gioRenderMedewerkers()};

  let voorraadFotoData='';
  window.gioVoorraadFotoKiezen=function(e){const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{voorraadFotoData=r.result;voorraadFotoPreview.innerHTML=`<img class="gioThumb" src="${voorraadFotoData}">`};r.readAsDataURL(f)};
  window.gioVoorraadLeegmaken=function(){['voorraadEditId','voorraadNaam','voorraadCategorie','voorraadAantal','voorraadMinimum','voorraadInkoop','voorraadVerkoop'].forEach(id=>document.getElementById(id).value='');voorraadLocatie.value='Bus';voorraadEenheid.value='stuk';voorraadFoto.value='';voorraadFotoPreview.innerHTML='';voorraadFotoData=''};
  window.gioVoorraadOpslaan=function(){ensure();const naam=voorraadNaam.value.trim();if(!naam){alert('Vul een productnaam in.');return}const id=voorraadEditId.value||String(Date.now()),old=data.voorraad.find(x=>String(x.id)===String(id));const item={id,naam,categorie:voorraadCategorie.value.trim(),locatie:voorraadLocatie.value,eenheid:voorraadEenheid.value,aantal:+voorraadAantal.value||0,minimum:+voorraadMinimum.value||0,inkoop:+voorraadInkoop.value||0,verkoop:+voorraadVerkoop.value||0,foto:voorraadFotoData||(old?.foto||''),gewijzigd:new Date().toISOString()};const i=data.voorraad.findIndex(x=>String(x.id)===String(id));i>=0?data.voorraad.splice(i,1,item):data.voorraad.unshift(item);save();gioVoorraadLeegmaken();gioRenderVoorraad()};
  window.gioRenderVoorraad=function(){ensure();if(!document.getElementById('voorraadLijst'))return;const q=(voorraadZoek.value||'').toLowerCase();const rows=data.voorraad.filter(x=>!q||[x.naam,x.categorie,x.locatie].join(' ').toLowerCase().includes(q));const value=data.voorraad.reduce((s,x)=>s+(+x.aantal||0)*(+x.inkoop||0),0),low=data.voorraad.filter(x=>(+x.aantal||0)<=(+x.minimum||0)).length;voorraadKpis.innerHTML=`<div><b>${data.voorraad.length}</b><small>Producten</small></div><div><b>${low}</b><small>Bijna op</small></div><div><b>${typeof euro==='function'?euro(value):value.toFixed(2)}</b><small>Waarde</small></div>`;voorraadLijst.innerHTML=rows.length?rows.map(x=>`<article class="gioListCard ${(+x.aantal||0)<=(+x.minimum||0)?'low':''}"><div class="gioListHead"><div style="display:flex;gap:9px">${x.foto?`<img class="gioThumb" src="${x.foto}">`:''}<div><h3>${esc(x.naam)}</h3><div class="gioListMeta">${esc(x.categorie||'-')} • ${esc(x.locatie||'-')}</div><div><b>${Number(x.aantal||0).toLocaleString('nl-NL')} ${esc(x.eenheid||'stuk')}</b> ${(+x.aantal||0)<=(+x.minimum||0)?'<span style="color:#ff8989">• Bijbestellen</span>':''}</div><div class="gioListMeta">Inkoop ${typeof euro==='function'?euro(x.inkoop):x.inkoop} • Verkoop ${typeof euro==='function'?euro(x.verkoop):x.verkoop}</div></div></div></div><div class="gioListActions"><button onclick="gioVoorraadMutatie('${x.id}',-1)">−1</button><button onclick="gioVoorraadMutatie('${x.id}',1)">+1</button><button onclick="gioVoorraadBewerk('${x.id}')">✏️</button><button onclick="gioVoorraadVerwijder('${x.id}')">🗑️</button></div></article>`).join(''):'<p>Nog geen voorraadartikelen.</p>'};
  window.gioVoorraadMutatie=function(id,n){const x=data.voorraad.find(x=>String(x.id)===String(id));if(x){x.aantal=Math.max(0,(+x.aantal||0)+n);x.gewijzigd=new Date().toISOString();save();gioRenderVoorraad()}};
  window.gioVoorraadBewerk=function(id){const x=data.voorraad.find(x=>String(x.id)===String(id));if(!x)return;voorraadEditId.value=x.id;voorraadNaam.value=x.naam||'';voorraadCategorie.value=x.categorie||'';voorraadLocatie.value=x.locatie||'Bus';voorraadEenheid.value=x.eenheid||'stuk';voorraadAantal.value=x.aantal||0;voorraadMinimum.value=x.minimum||0;voorraadInkoop.value=x.inkoop||0;voorraadVerkoop.value=x.verkoop||0;voorraadFotoData=x.foto||'';voorraadFotoPreview.innerHTML=x.foto?`<img class="gioThumb" src="${x.foto}">`:'';window.scrollTo({top:0,behavior:'smooth'})};
  window.gioVoorraadVerwijder=function(id){if(!confirm('Dit voorraadartikel verwijderen?'))return;data.voorraad=data.voorraad.filter(x=>String(x.id)!==String(id));save();gioRenderVoorraad()};

  function projectNotesIntoCard(){
    const old=window.renderProjectkaartPro;if(typeof old!=='function'||old.__wbWrapped)return;
    window.renderProjectkaartPro=function(){old();const box=document.getElementById('proProjectContent'),sel=document.getElementById('proProjectSelect');if(!box||!sel)return;ensure();const notes=data.werkboek.filter(x=>x.project===sel.value);const card=document.createElement('div');card.className='card';card.innerHTML=`<h2>📝 Werkboek (${notes.length})</h2>`+(notes.length?notes.map(x=>`<div class="gioListCard"><b>${esc(x.titel)}</b><div class="gioListText">${esc(x.tekst||'')}</div></div>`).join(''):'Geen gekoppelde notities.')+`<button class="btn" onclick="gioMobileGo('werkboek',this)">+ Notitie toevoegen</button>`;box.appendChild(card)};window.renderProjectkaartPro.__wbWrapped=true;
  }
  function init(){ensure();projectNotesIntoCard();document.getElementById('gioActionDock')?.remove();gioFillWerkboekSelects();gioRenderWerkboek();gioRenderVoorraad();gioFillMedewerkerProjecten();gioRenderMedewerkers();const version='MOBILE TEST 004';document.title='GIO Business Planner PRO – '+version;try{localStorage.setItem('gioMobileBuild',version)}catch(e){} }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',()=>setTimeout(init,0)):setTimeout(init,0);
})();
