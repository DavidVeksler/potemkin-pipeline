/* ====================================================================== */
/* SCENE PICKER (hotkey 'd') — fire any drama on demand for testing        */
/* ====================================================================== */
function queueDrama(id){
  const scene=SCENE_REGISTRY.find(s=>s.id===id);
  if(!scene||!scene.generator){ toast('unknown scene'); return; }
  enqueueDrama(scene.generator,id);
}
function buildDramaPicker(){
  dramaEl.innerHTML='';
  const hd=el('cfg-hd');
  hd.appendChild(el('h2','SCENE PICKER'));
  hd.appendChild(el('badge','for testing'));
  const x=mkBtn('cfg-x','✕',()=>toggleDrama(false)); x.title='Close (Esc)'; hd.appendChild(x);
  dramaEl.appendChild(hd);
  const bd=el('cfg-bd'); dramaEl.appendChild(bd);
  // Group by category, preserving SCENE_REGISTRY insertion order
  const groups=new Map();
  SCENE_REGISTRY.forEach(s=>{ if(!groups.has(s.category)) groups.set(s.category,[]); groups.get(s.category).push(s); });
  groups.forEach((scenes,title)=>{
    const sec=el('cfg-sec'); sec.appendChild(el('cfg-sech',title));
    const g=el('dp-grid');
    scenes.forEach(s=>{
      const b=mkBtn('dp-item',s.label,()=>{ toggleDrama(false); if(s.onPick) s.onPick(); else queueDrama(s.id); });
      b.title=s.id; g.appendChild(b);
    });
    sec.appendChild(g); bd.appendChild(sec);
  });
  const hint=el('cfg-hint'); hint.innerHTML='Pick a scene to play it now. <kbd>d</kbd> toggles this · <kbd>esc</kbd> closes. Scenes are skipped while one is already on screen.';
  bd.appendChild(hint);
}
function toggleDrama(force){
  const open = force!=null ? force : !dramaEl.open;
  if(open){ if(settingsEl.open) toggleSettings(false); buildDramaPicker(); if(!dramaEl.open&&dramaEl.showModal) dramaEl.showModal(); dramaOpen=true; }
  else { if(dramaEl.open) dramaEl.close(); dramaOpen=false; }
}
dramaEl.addEventListener('close',()=>{ dramaOpen=false; });
dramaEl.addEventListener('cancel',()=>{ dramaOpen=false; });
dramaEl.addEventListener('click',e=>{ if(e.target===dramaEl) toggleDrama(false); });   // click backdrop to dismiss
