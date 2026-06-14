/* ====================================================================== */
/* IDLE / DEEP-WORK "AWAY" MODE                                            */
/* ====================================================================== */
function enterIdle(){
  if(idleActive||mode!=='auto'||paused) return false;
  idleActive=true; document.body.classList.add('deepwork'); updateMode();
  dramaQ.unshift(dDeepWork);   // grind takes over next; dramas still fire and cut in mid-grind
  toast('deep work — away mode'); return true;
}
function exitIdle(){
  if(!idleActive) return;
  idleActive=false; document.body.classList.remove('deepwork'); updateMode();
  nextDramaAt=logicalNow+U(60000,110000)/dramaFreq;   // don't fire a drama the instant we resume
}
function markActivity(){ lastActivityTs=performance.now(); if(idleActive) exitIdle(); }
function tickIdle(ts){
  if(idleActive||idleThreshold<=0) return;
  if(paused||bossActive||overlayActive||mode!=='auto'||settingsEl.open||dramaEl.open||helpOpen){ lastActivityTs=ts; return; }
  if(ts-lastActivityTs>=idleThreshold*1000) enterIdle();
}
['pointerdown','pointermove','wheel','touchstart'].forEach(t=>addEventListener(t,markActivity,{passive:true}));
['pointerdown','touchstart'].forEach(t=>addEventListener(t,audioUnlock,{passive:true}));   // a click/tap also satisfies the audio-gesture requirement
