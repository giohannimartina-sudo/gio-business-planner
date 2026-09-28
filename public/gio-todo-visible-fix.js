
(function(){
'use strict';
const MIRROR='gioTodoMirrorV035';

function getData(){return window.data&&typeof window.data==='object'?window.data:null}
function mirrorRead(){try{const v=JSON.parse(localStorage.getItem(MIRROR)||'[]');return Array.isArray(v)?v:[]}catch(e){return[]}}
function mirrorWrite(items){try{localStorage.setItem(MIRROR,JSON.stringify(Array.isArray(items)?items:[]))}catch(e){}}
function mergeMirror(){
  const d=getData(); if(!d)return;
  if(!Array.isArray(d.todos))d.todos=[];
  const ids=new Set(d.todos.map(x=>String(x.id)));
  let changed=false;
  mirrorRead().forEach(x=>{
    if(x&&x.id&&!ids.has(String(x.id))){
      d.todos.push(x);ids.add(String(x.id));changed=true;
    }
  });
  if(changed){try{window.save?.()}catch(e){}}
}
function waitForTodo(){
  if(typeof window.gioTodoAdd!=='function'){setTimeout(waitForTodo,200);return}
  if(window.gioTodoAdd.__gioVisibleFix035)return;

  mergeMirror();
  const originalAdd=window.gioTodoAdd;

  window.gioTodoAdd=function(){
    const d=getData();
    const title=document.getElementById('gioTodoTitle')?.value.trim()||'';
    if(!d||!title)return originalAdd.apply(this,arguments);
    if(!Array.isArray(d.todos))d.todos=[];

    const snapshot={
      title,
      dueDate:document.getElementById('gioTodoDue')?.value||'',
      priority:document.getElementById('gioTodoPriority')?.value||'Normaal',
      client:document.getElementById('gioTodoClient')?.value||'',
      project:document.getElementById('gioTodoProject')?.value||'',
      note:document.getElementById('gioTodoNote')?.value.trim()||''
    };
    const beforeIds=new Set(d.todos.map(x=>String(x.id)));

    const result=originalAdd.apply(this,arguments);

    let added=(d.todos||[]).find(x=>!beforeIds.has(String(x.id)));
    if(!added){
      added={
        id:'todo-'+Date.now()+'-'+Math.random().toString(36).slice(2,6),
        ...snapshot,
        status:'Open',
        createdAt:new Date().toISOString(),
        updatedAt:new Date().toISOString()
      };
      d.todos.unshift(added);
      try{window.save?.()}catch(e){console.error('Todo fallback save',e)}
    }

    mirrorWrite(d.todos);
    try{window.gioTodoShow?.('open')}catch(e){}

    requestAnimationFrame(()=>{
      const list=document.getElementById('gioTodoList');
      if(list){
        list.style.display='block';
        list.scrollIntoView({behavior:'smooth',block:'nearest'});
      }
    });
    return result;
  };
  window.gioTodoAdd.__gioVisibleFix035=true;

  ['gioTodoComplete','gioTodoReopen','gioTodoDelete','gioTodoEdit'].forEach(name=>{
    const fn=window[name];
    if(typeof fn!=='function'||fn.__gioMirror035)return;
    window[name]=function(){
      const r=fn.apply(this,arguments);
      setTimeout(()=>{
        const d=getData();
        if(d&&Array.isArray(d.todos))mirrorWrite(d.todos);
      },0);
      return r;
    };
    window[name].__gioMirror035=true;
  });

  const init=window.gioTodoAppointmentsInit;
  if(typeof init==='function'&&!init.__gioMirror035){
    window.gioTodoAppointmentsInit=function(){
      mergeMirror();
      const r=init.apply(this,arguments);
      try{window.gioTodoShow?.('open')}catch(e){}
      return r;
    };
    window.gioTodoAppointmentsInit.__gioMirror035=true;
  }
}
waitForTodo();
})();
