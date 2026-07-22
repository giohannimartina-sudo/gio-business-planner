(function(){
  function labelTables(root){
    (root||document).querySelectorAll('table').forEach(function(table){
      var heads=Array.from(table.querySelectorAll('thead th')).map(function(th){return th.textContent.trim()});
      if(!heads.length)return;
      table.querySelectorAll('tbody tr').forEach(function(tr){
        Array.from(tr.children).forEach(function(td,i){
          if(td.tagName==='TD'&&!td.hasAttribute('data-label'))td.setAttribute('data-label',heads[i]||'');
        });
      });
    });
  }
  function syncBottom(id){
    document.querySelectorAll('#gioBottomDock button').forEach(function(b){b.classList.remove('active')});
    var b=document.querySelector('#gioBottomDock button[onclick*="\''+id+'\'"]'); if(b)b.classList.add('active');
  }
  document.addEventListener('DOMContentLoaded',function(){
    labelTables(document);
    var obs=new MutationObserver(function(m){m.forEach(function(x){x.addedNodes.forEach(function(n){if(n.nodeType===1)labelTables(n)})})});
    obs.observe(document.body,{childList:true,subtree:true});
    if(typeof window.show==='function'){
      var old=window.show;
      window.show=function(id,btn){old(id,btn);syncBottom(id);setTimeout(function(){labelTables(document.getElementById(id))},0);window.scrollTo({top:0,behavior:'smooth'})};
    }
  });
})();
