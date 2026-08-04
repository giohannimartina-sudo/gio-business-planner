
(function(){
'use strict';
if(!window.matchMedia('(min-width:801px)').matches)return;
const groups=[
['fav','⭐ Favorieten',true,['Dashboard','Planning','Projectkaart PRO','Uren','Rittenregistratie']],
['daily','📊 Dagelijks',true,['Dashboard','Planning','Klanten','Projecten','Projectkaart PRO','Vrijedagen']],
['work','🧰 Werk',false,['Uren','Materiaal','Uitgave / Investeren','Rittenregistratie','Werkboek','Voorraad']],
['people','👷 Personeel',false,['Personeelscentrum PRO','Medewerkers / Inhuur']],
['finance','💰 Financieel',false,['Betalingen','Offertes','Facturatie','Analyse','Balans']],
['beheer','☁️ Beheer',false,['Cloud Sync','Export','Instellingen','Project Archief']]
];
const norm=s=>String(s||'').toLowerCase().replace(/\s+/g,' ').trim();
function build(){
 const nav=document.querySelector('aside nav');if(!nav||document.getElementById('gioSmartMenuSearch'))return;
 const originals=[...nav.querySelectorAll(':scope > button')];
 const find=l=>originals.find(b=>norm(b.textContent).includes(norm(l)));
 const search=document.createElement('input');search.id='gioSmartMenuSearch';search.placeholder='Zoek functie...';
 nav.innerHTML='';nav.appendChild(search);
 const used=new Set();
 groups.forEach(([id,title,open,items])=>{
   const wrap=document.createElement('div');wrap.className='gioMenuGroup'+(open?' open':'');if(id==='fav')wrap.id='gioFavoritesGroup';
   const head=document.createElement('button');head.className='gioMenuGroupHead';head.innerHTML=`<span>${title}</span><span>${open?'−':'+'}</span>`;
   const body=document.createElement('div');body.className='gioMenuGroupBody';
   items.forEach(label=>{const b=find(label);if(b){const c=b.cloneNode(true);c.onclick=b.onclick;c.dataset.originalText=b.textContent.trim();if(id==='fav')c.classList.add('gioFav');body.appendChild(c);used.add(b)}});
   if(!body.children.length)return;
   head.onclick=()=>{wrap.classList.toggle('open');head.lastElementChild.textContent=wrap.classList.contains('open')?'−':'+'};
   wrap.append(head,body);nav.appendChild(wrap);
 });
 const other=originals.filter(b=>!used.has(b));
 if(other.length){
   const wrap=document.createElement('div');wrap.className='gioMenuGroup';
   const head=document.createElement('button');head.className='gioMenuGroupHead';head.innerHTML='<span>➕ Overig</span><span>+</span>';
   const body=document.createElement('div');body.className='gioMenuGroupBody';
   other.forEach(b=>{const c=b.cloneNode(true);c.onclick=b.onclick;body.appendChild(c)});
   head.onclick=()=>{wrap.classList.toggle('open');head.lastElementChild.textContent=wrap.classList.contains('open')?'−':'+'};
   wrap.append(head,body);nav.appendChild(wrap);
 }
 search.oninput=()=>{const q=norm(search.value);document.querySelectorAll('.gioMenuGroup').forEach(g=>{let n=0;g.querySelectorAll('.gioMenuGroupBody button').forEach(b=>{const ok=!q||norm(b.textContent).includes(q);b.classList.toggle('gioMenuHidden',!ok);if(ok)n++});g.classList.toggle('gioMenuHidden',n===0);if(q&&n)g.classList.add('open')})};
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',()=>setTimeout(build,350)):setTimeout(build,350);
})();
