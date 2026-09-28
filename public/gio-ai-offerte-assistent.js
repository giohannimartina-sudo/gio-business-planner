(function(){
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let msgs=[],draft=null,busy=false;
function ctx(){const klant=$('gioOfferClient')?.value||'',project=$('gioOfferProject')?.value||'',k=(data?.klanten||[]).find(x=>x.naam===klant)||{};return{klant,project,adres:k.adres||'',plaats:k.plaats||'',uurloon:data?.uurloon||35}}
function render(){const b=$('gioAiChatMessages');if(!b)return;b.innerHTML=msgs.map(m=>`<div class="gioChatMsg ${m.role}"><b>${m.role==='user'?'Jij':'ChatGPT'}</b><div>${esc(m.content).replace(/\\n/g,'<br>')}</div></div>`).join('');b.scrollTop=b.scrollHeight;const p=$('gioAiPlace');if(p)p.disabled=!draft}
async function send(){
 if(busy)return;const i=$('gioAiInput'),v=i?.value.trim();if(!v)return;
 msgs.push({role:'user',content:v});i.value='';render();busy=true;const btn=$('gioAiSend');if(btn){btn.disabled=true;btn.textContent='ChatGPT denkt…'}
 try{const r=await fetch('/api/offerte-ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:msgs,context:ctx()})});const j=await r.json();if(!r.ok)throw new Error(j.error+(j.detail?' — '+j.detail:''));msgs.push({role:'assistant',content:j.reply||'Concept bijgewerkt.'});if(j.offerDraft)draft=j.offerDraft}
 catch(e){msgs.push({role:'assistant',content:'Er ging iets mis: '+e.message})}
 finally{busy=false;if(btn){btn.disabled=false;btn.textContent='Verstuur'}render()}
}
function place(){
 if(!draft)return alert('Maak eerst samen met ChatGPT een concept.');
 if(typeof gioNewOffer!=='function')return alert('Offerte PRO is niet geladen.');
 gioNewOffer();
 setTimeout(()=>{
  if($('gioOfferTitle'))$('gioOfferTitle').value=draft.title||'Werkzaamheden';
  if($('gioOfferIntro'))$('gioOfferIntro').value=draft.intro||'';
  if($('gioOfferLocation'))$('gioOfferLocation').value=draft.workLocation||'';
  if($('gioOfferDuration'))$('gioOfferDuration').value=draft.duration||'';
  if($('gioOfferTerms'))$('gioOfferTerms').value=(draft.assumptions||[]).join('\n');
  window.__gioChatGPTOfferDraft=JSON.parse(JSON.stringify(draft));
  const n=document.createElement('div');n.className='gioAiNotice';n.innerHTML='<b>✨ ChatGPT-concept klaar.</b> Controleer alle werkzaamheden, materialen, tarieven, BTW en klantgegevens vóór opslaan of exporteren.';$('gioOfferForm')?.prepend(n);
  alert('Concept staat klaar in Offerte PRO. Controleer alles voordat je opslaat.');
  $('gioOfferForm')?.scrollIntoView({behavior:'smooth',block:'start'});
 },120)
}
function inject(){
 const old=$('gioAiOfferAssistant');if(old)old.remove();
 const f=$('gioOfferForm');if(!f||$('gioChatGPTOffer'))return false;
 const c=document.createElement('div');c.id='gioChatGPTOffer';c.className='card gioChatCard';
 c.innerHTML=`<div class="gioChatHead"><div><h2>✨ ChatGPT Offerte & Calculatie Assistent PRO</h2><small>Bespreek de klus zoals je dat in ChatGPT doet.</small></div><button class="btn2" onclick="gioAiNew()">Nieuw gesprek</button></div><div id="gioAiChatMessages" class="gioChatMessages"></div><div class="gioChatCompose"><textarea id="gioAiInput" rows="3" placeholder="Bijv. Ik moet 40 m² laminaat leggen in Gouda. Help mij de klus calculeren."></textarea><button id="gioAiSend" class="btn" onclick="gioAiSend()">Verstuur</button></div><div class="gioChatActions"><button id="gioAiPlace" class="btn" onclick="gioAiPlace()" disabled>✨ Plaats in offerte</button></div>`;
 f.parentNode.insertBefore(c,f);
 const st=document.createElement('style');st.textContent=`.gioChatCard{border:1px solid #c99a2e!important}.gioChatHead,.gioChatActions{display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap}.gioChatHead h2,.gioChatMsg b{color:#f4c400}.gioChatMessages{max-height:430px;overflow:auto;background:#0c0e12;border-radius:12px;padding:8px;margin:12px 0}.gioChatMsg{padding:10px 12px;margin:7px 0;border-radius:12px;line-height:1.45}.gioChatMsg.user{background:#252a33;margin-left:12%}.gioChatMsg.assistant{background:#151922;border-left:3px solid #c99a2e;margin-right:8%}.gioChatCompose{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:end}.gioAiNotice{background:#fff5c9;color:#111;border:1px solid #c99a2e;padding:10px;border-radius:9px;margin-bottom:10px}@media(max-width:800px){.gioChatCompose{grid-template-columns:1fr}.gioChatMsg.user,.gioChatMsg.assistant{margin-left:0;margin-right:0}}`;document.head.appendChild(st);
 msgs=[{role:'assistant',content:'Vertel me over de klus. Ik denk met je mee over werkzaamheden, materiaal, hoeveelheden, tarieven, rijkosten en voorwaarden. We maken samen eerst een calculatie; jij bepaalt wanneer hij klaar is voor de offerte.'}];render();return true
}
window.gioAiSend=send;window.gioAiPlace=place;window.gioAiNew=()=>{msgs=[];draft=null;msgs.push({role:'assistant',content:'Nieuw gesprek gestart. Vertel me over de klus.'});render()};
document.addEventListener('keydown',e=>{if(e.target?.id==='gioAiInput'&&e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}});
let n=0;(function boot(){if(inject())return;if(++n<60)setTimeout(boot,250)})();
})();