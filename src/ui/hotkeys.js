/* ====================================================================== */
/* INPUT / HOTKEYS                                                         */
/* ====================================================================== */
function isTyping(t){ return t&&(t.tagName==='INPUT'||t.tagName==='SELECT'||t.tagName==='TEXTAREA'); }
addEventListener('keydown',e=>{
  markActivity();
  if(bossActive){ e.preventDefault(); hideBoss(); return; }
  if(settingsEl.open){                            // config dialog owns input while open
    if(isTyping(e.target)) return;                // let fields receive keystrokes (incl. Esc handled natively)
    if(e.key==='s'){ toggleSettings(false); e.preventDefault(); }   // 's' toggles the dialog shut
    return;                                        // Escape is closed by <dialog> itself
  }
  if(dramaEl.open){                               // scene picker owns input while open (Esc closes natively)
    if(e.key==='d'){ toggleDrama(false); e.preventDefault(); }
    return;
  }
  if(e.key==='Escape' && helpOpen){ toggleHelp(false); return; }
  if(isTyping(e.target)) return;
  if(e.metaKey||e.ctrlKey||e.altKey) return;     // don't hijack copy/devtools
  audioUnlock();
  const k=e.key;
  switch(k){
    case 'm': mode=mode==='auto'?'performer':'auto'; updateMode(); toast('mode: '+mode); e.preventDefault(); return;
    case ' ': paused=!paused; document.body.classList.toggle('paused',paused); updateMode(); toast(paused?'paused':'resumed'); e.preventDefault(); return;
    case '1': setTheme('amber'); return;
    case '2': setTheme('green'); return;
    case '3': setTheme('cyan'); return;
    case '+': case '=': setSpeed(speed*1.5); e.preventDefault(); return;
    case '-': case '_': setSpeed(speed/1.5); e.preventDefault(); return;
    case 'f': forceDrama(); e.preventDefault(); return;
    case 'd': toggleDrama(); e.preventDefault(); return;
    case 'b': showBoss(); e.preventDefault(); return;
    case 's': toggleSettings(); e.preventDefault(); return;
    case '?': toggleHelp(); e.preventDefault(); return;
  }
  if(mode==='performer' && k.length===1){ releaseTokens=Math.min(REL_CAP,releaseTokens+1); blip(); e.preventDefault(); }
});

function updateMode(){
  if(idleActive){ modeind.textContent='⚙ deep work'; modeind.classList.add('deep'); }
  else { modeind.textContent=paused?'⏸ paused':mode==='performer'?'▸ performer':'⏻ auto'; modeind.classList.remove('deep'); }
  document.body.classList.toggle('performer',mode==='performer');
}
function setTheme(t){ cfg.theme=t; document.documentElement.setAttribute('data-theme',t); cacheAccent(); toast('theme: '+t); syncURL(); }
function setSpeed(v){ speed=clamp(v,0.25,4); toast('speed: '+speed.toFixed(2)+'×'); syncURL(); }
const DRAMAQ_MAX=5;   // manual requests queue (auto cadence still refuses while busy); cap guards runaway
function enqueueDrama(gen,name){
  if(dramaQ.length>=DRAMAQ_MAX){ toast('drama queue full'); return; }
  dramaQ.push(gen);
  toast((overlayActive||dramaQ.length>1?'queued':'drama')+': '+name+(dramaQ.length>1?' ['+dramaQ.length+']':''));
}
function forceDrama(){
  const boss=SCENE_REGISTRY.filter(s=>s.tags.includes('boss')).map(s=>s.id);
  const en=enabledDramas(); const base=en.length?en:['deploy','anomaly','security','auth','matrix'];
  const type=pick(boss.concat(base));
  const scene=SCENE_REGISTRY.find(s=>s.id===type);
  if(scene&&scene.generator) enqueueDrama(scene.generator,type);
}
function showBoss(){ bossActive=true; bossEl.classList.add('on'); }
function hideBoss(){ bossActive=false; bossEl.classList.remove('on'); }
