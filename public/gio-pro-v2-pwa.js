(function(){
  if(!document.querySelector('link[href="/gio-pro-v2-theme.css"]')){
    const l=document.createElement('link'); l.rel='stylesheet'; l.href='/gio-pro-v2-theme.css'; document.head.appendChild(l);
  }
  if(!document.querySelector('link[rel="manifest"]')){
    const m=document.createElement('link'); m.rel='manifest'; m.href='/manifest.webmanifest'; document.head.appendChild(m);
  }
  const meta=document.createElement('meta'); meta.name='theme-color'; meta.content='#050607'; document.head.appendChild(meta);
  if(!document.getElementById('gioV2MobileTop')){
    document.body.insertAdjacentHTML('afterbegin', `<div id="gioV2MobileTop"><div style="display:flex;align-items:center;gap:10px"><img src="/gio-logo-192.png" alt="GIO logo"><div><b>GIO Planner PRO</b><br><small>Live verbonden</small></div></div><div>☁️</div></div>`);
    document.body.insertAdjacentHTML('beforeend', `<div id="gioV2ActionDock"><button type="button" onclick="showPage('uren')">▶ Inklok</button><button type="button" onclick="showPage('projecten')">📁 Project</button><button type="button" onclick="showPage('materiaal')">🧰 Materiaal</button><button type="button" onclick="showPage('export')">☁️ Sync</button><button type="button" onclick="showPage('balans')">📊 Balans</button></div><div id="gioV2Dock"><button type="button" class="active" onclick="showPage('dashboard')">🏠<br>Home</button><button type="button" onclick="showPage('planning')">📅<br>Planning</button><button type="button" onclick="showPage('projecten')">📁<br>Project</button><button type="button" onclick="showPage('uren')">⏱<br>Uren</button><button type="button" onclick="showPage('export')">☰<br>Meer</button></div>`);
  }
  if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));}
})();