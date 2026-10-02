(function(){'use strict';
const $=id=>document.getElementById(id),num=v=>{const x=Number(v);return Number.isFinite(x)?x:0};
function ensure(){if(!Array.isArray(data.ritten))data.ritten=[];if(!Array.isArray(data.kmRegistraties))data.kmRegistraties=[]}
function same(a,b){return String(a?.id||'')===String(b?.id||'')}
function store(r){ensure();if(!data.ritten.some(x=>same(x,r)))data.ritten.unshift({...r})}
function refresh(){try{window.gioRitInit?.()}catch(e){}try{window.gioRenderRitten?.()}catch(e){}}
function resetFields(){['ritEind','ritEindtijd','ritAfwijking'].forEach(id=>{if($(id))$(id).value=''});if($('ritPriveOmweg'))$('ritPriveOmweg').value='0'}
function addReset(){const a=document.querySelector('#rittenregistratie .gioTripActions');if(!a||$('gioKmResetBtn'))return;const b=document.createElement('button');b.id='gioKmResetBtn';b.className='btn2';b.textContent='↺ Actieve rit resetten';b.onclick=()=>window.gioRitReset();a.insertBefore(b,a.lastElementChild)}
function install(){if(!window.data||typeof window.save!=='function'||typeof window.gioRitStop!=='function')return false;ensure();
window.gioRitStop=()=>{const r=data.activeRit;if(!r){alert('Er staat geen rit aan.');return}const e=num($('ritEind')?.value);if(!e){alert('Vul de eindstand in.');return}if(e<num(r.beginstand)){alert('Eindstand kan niet lager zijn dan beginstand.');return}const done={...r,eindstand:e,eindtijd:$('ritEindtijd')?.value||new Date().toTimeString().slice(0,5),km:e-num(r.beginstand),afwijking:$('ritAfwijking')?.value.trim()||'',priveOmweg:num($('ritPriveOmweg')?.value)};done.historie=[...(r.historie||[]),{tijd:new Date().toISOString(),actie:'KM UIT'}];store(done);data.activeRit=null;save();resetFields();refresh()};
window.gioRitReset=()=>{if(!data.activeRit){alert('Er staat geen actieve rit om te resetten.');return}if(!confirm('Actieve rit resetten?'))return;const r=data.activeRit;if(num(r.eindstand)>=num(r.beginstand)&&r.eindtijd)store(r);data.activeRit=null;save();resetFields();refresh();alert('KM registratie is gereset.')};
const r=data.activeRit;if(r&&num(r.eindstand)>=num(r.beginstand)&&r.eindtijd&&(r.historie||[]).some(h=>h.actie==='KM UIT')){store(r);data.activeRit=null;save();setTimeout(refresh,50)}
addReset();try{localStorage.setItem('gioKmFix','LIVE READY KM FIX 002')}catch(e){}return true}
let t=0,x=setInterval(()=>{if(install()||++t>120)clearInterval(x)},250);new MutationObserver(addReset).observe(document.documentElement,{childList:true,subtree:true});
})();