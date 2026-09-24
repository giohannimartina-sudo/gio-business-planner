(function(){
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const eur=v=>new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR'}).format(+v||0);
let draft={regels:[],materialen:[],uitgangspunten:[],titel:'',werklocatie:'',werkduur:''};

function uid(){return Math.random().toString(36).slice(2,8)+Date.now().toString(36).slice(-4)}
function number(s){return +(String(s||'').replace(',','.'))||0}
function line(desc,aantal,eenheid,prijs,btw=21){return{id:uid(),omschrijving:desc,aantal:number(aantal),eenheid,prijs:number(prijs),btw}}
function material(desc,qty,amount,btw=21){return{id:uid(),omschrijving:desc,hoeveelheid:qty,bedrag:number(amount),btw}}
function totals(){
 let ex=0,tax=0;
 draft.regels.forEach(x=>{const b=x.aantal*x.prijs;ex+=b;tax+=b*x.btw/100});
 draft.materialen.forEach(x=>{ex+=x.bedrag;tax+=x.bedrag*x.btw/100});
 return{ex,tax,total:ex+tax}
}
function parse(text){
 const t=text.toLowerCase().replace(/€/g,' euro ');
 const m2=(t.match(/(\d+(?:[.,]\d+)?)\s*m[²2]/)||[])[1];
 const meter=(t.match(/(\d+(?:[.,]\d+)?)\s*(?:strekkende\s*)?m(?:eter)?\b/)||[])[1];
 const priceM2=(t.match(/(?:€|euro)?\s*(\d+(?:[.,]\d+)?)\s*(?:per|\/)\s*m[²2]/)||[])[1];
 const city=(text.match(/\b(?:in|te)\s+([A-ZÀ-Ý][A-Za-zÀ-ÿ-]+)(?:[,.]|$)/)||[])[1];

 draft={regels:[],materialen:[],uitgangspunten:[],titel:'Werkzaamheden',werklocatie:city||'',werkduur:''};

 if(t.includes('laminaat')){
   draft.titel='Laminaatvloer';
   if(m2) draft.regels.push(line('Laminaat leggen',m2,'m²',priceM2||14.50));
 }
 if(t.includes('ondervloer')&&m2) draft.regels.push(line('Ondervloer leggen',m2,'m²',2.50));
 if((t.includes('plint')||t.includes('plinten'))&&meter) draft.regels.push(line('Hoge plinten monteren',meter,'m',6.50));
 if(t.includes('afkit')&&meter) draft.regels.push(line('Hoge plinten afkitten',meter,'m',2.00));
 if(t.includes('rijkost')||t.includes('reiskost')) draft.regels.push(line('Rijkosten',1,'vast',30));
 if(t.includes('airless')||t.includes('spuiten')){
   draft.titel='Airless spuitwerk';
   if(m2) draft.regels.push(line('Wanden airless spuiten – 2 lagen',m2,'m²',10.50));
 }
 if(t.includes('plint')) draft.materialen.push(material('Plinten / afwerking','richtbudget',150));
 if(t.includes('kit')) draft.materialen.push(material('Kit / kleinmateriaal','richtbudget',45));

 if(!draft.regels.length){
   draft.regels.push(line('Arbeid / werkzaamheden',1,'vast',0));
 }
 draft.uitgangspunten=[
   'De calculatie is gebaseerd op de opgegeven hoeveelheden en werkzaamheden.',
   'Meerwerk en niet opgenomen werkzaamheden worden vooraf besproken.',
   'Definitieve materiaalkeuze kan het materiaalbedrag wijzigen.'
 ];
 render();
}
function render(){
 const b=$('gioAiOfferDraft');if(!b)return;
 const t=totals();
 b.innerHTML=`<div class="gioAiOfferSummary"><b>${esc(draft.titel||'Concept')}</b><span>Concept totaal: ${eur(t.total)}</span></div>
 <h4>Werkzaamheden</h4>${draft.regels.map((x,i)=>`<div class="gioAiRow"><input value="${esc(x.omschrijving)}" oninput="gioAiEditLine(${i},'omschrijving',this.value)"><input type="number" step=".01" value="${x.aantal}" oninput="gioAiEditLine(${i},'aantal',this.value)"><input value="${esc(x.eenheid)}" oninput="gioAiEditLine(${i},'eenheid',this.value)"><input type="number" step=".01" value="${x.prijs}" oninput="gioAiEditLine(${i},'prijs',this.value)"><button onclick="gioAiDeleteLine(${i})">✕</button></div>`).join('')}
 <button class="btn2" onclick="gioAiAddLine()">+ Werkregel</button>
 <h4>Materialen</h4>${draft.materialen.map((x,i)=>`<div class="gioAiMat"><input value="${esc(x.omschrijving)}" oninput="gioAiEditMat(${i},'omschrijving',this.value)"><input value="${esc(x.hoeveelheid)}" oninput="gioAiEditMat(${i},'hoeveelheid',this.value)"><input type="number" step=".01" value="${x.bedrag}" oninput="gioAiEditMat(${i},'bedrag',this.value)"><button onclick="gioAiDeleteMat(${i})">✕</button></div>`).join('')}
 <button class="btn2" onclick="gioAiAddMat()">+ Materiaal</button>
 <h4>Uitgangspunten</h4><textarea id="gioAiTerms">${esc(draft.uitgangspunten.join('\n'))}</textarea>
 <div class="gioAiTotal"><span>Excl. BTW ${eur(t.ex)}</span><span>BTW ${eur(t.tax)}</span><b>Totaal ${eur(t.total)}</b></div>
 <div class="gioAiActions"><button class="btn" onclick="gioAiPlaceOffer()">✨ Plaats in offerte</button><button class="btn2" onclick="gioAiClear()">Leegmaken</button></div>`;
}
window.gioAiEditLine=(i,k,v)=>{draft.regels[i][k]=['omschrijving','eenheid'].includes(k)?v:number(v);render()}
window.gioAiDeleteLine=i=>{draft.regels.splice(i,1);render()}
window.gioAiAddLine=()=>{draft.regels.push(line('',1,'st',0));render()}
window.gioAiEditMat=(i,k,v)=>{draft.materialen[i][k]=['omschrijving','hoeveelheid'].includes(k)?v:number(v);render()}
window.gioAiDeleteMat=i=>{draft.materialen.splice(i,1);render()}
window.gioAiAddMat=()=>{draft.materialen.push(material('','',0));render()}
window.gioAiClear=()=>{draft={regels:[],materialen:[],uitgangspunten:[],titel:'',werklocatie:'',werkduur:''};$('gioAiPrompt').value='';render()}
window.gioAiBuild=()=>{const text=$('gioAiPrompt')?.value.trim();if(!text)return alert('Beschrijf eerst de klus.');parse(text)}
window.gioAiPlaceOffer=()=>{
 if(typeof window.gioNewOffer!=='function')return alert('Offerte PRO is nog niet geladen.');
 window.gioNewOffer();
 setTimeout(()=>{
   if($('gioOfferTitle'))$('gioOfferTitle').value=draft.titel||'Werkzaamheden';
   if($('gioOfferIntro'))$('gioOfferIntro').value='Offerte samengesteld met de Offerte Assistent. Controleer alle gegevens voor verzending.';
   if($('gioOfferLocation'))$('gioOfferLocation').value=draft.werklocatie||'';
   if($('gioOfferTerms'))$('gioOfferTerms').value=$('gioAiTerms')?.value||draft.uitgangspunten.join('\n');
   window.__gioAiOfferDraft=JSON.parse(JSON.stringify(draft));
   alert('Concept is klaargezet in Offerte PRO. Controleer klant, project, regels en bedragen voordat je opslaat.');
   $('gioOfferForm')?.scrollIntoView({behavior:'smooth',block:'start'});
 },80);
};

function inject(){
 const form=$('gioOfferForm');if(!form||$('gioAiOfferAssistant'))return false;
 const card=document.createElement('div');card.id='gioAiOfferAssistant';card.className='card gioAiCard';
 card.innerHTML=`<h2>✨ AI Offerte Assistent PRO <small style="font-size:12px">TEST</small></h2>
 <p>Beschrijf de klus zoals je hem aan mij zou uitleggen. De assistent maakt eerst een controleerbaar concept.</p>
 <textarea id="gioAiPrompt" rows="5" placeholder="Bijv. 40 m² laminaat leggen, ondervloer, 30 meter plinten monteren en afkitten, rijkosten naar Gouda..."></textarea>
 <div class="gioAiActions"><button class="btn" onclick="gioAiBuild()">✨ Maak concept</button></div><div id="gioAiOfferDraft"></div>`;
 form.parentNode.insertBefore(card,form);
 const st=document.createElement('style');st.textContent=`
 .gioAiCard{border:1px solid #c99a2e!important}.gioAiCard h2{color:#f4c400}.gioAiRow{display:grid;grid-template-columns:2fr .6fr .6fr .8fr 40px;gap:6px;margin:6px 0}.gioAiMat{display:grid;grid-template-columns:2fr 1fr .8fr 40px;gap:6px;margin:6px 0}.gioAiOfferSummary,.gioAiTotal,.gioAiActions{display:flex;gap:10px;justify-content:space-between;align-items:center;flex-wrap:wrap;margin:10px 0}.gioAiTotal{padding:10px;border-top:1px solid #c99a2e;border-bottom:1px solid #c99a2e}@media(max-width:800px){.gioAiRow,.gioAiMat{grid-template-columns:1fr 1fr}}`;
 document.head.appendChild(st);render();return true;
}
let tries=0;(function boot(){if(inject())return;if(++tries<50)setTimeout(boot,250)})();
try{localStorage.setItem('gioAiOfferBuild','AI OFFERTE ASSISTENT TEST 001')}catch(e){}
})();