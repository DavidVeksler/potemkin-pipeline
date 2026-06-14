/* ====================================================================== */
/* VISIBILITY                                                              */
/* ====================================================================== */
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){ hidden=true; if(rafId)cancelAnimationFrame(rafId); rafId=0; }
  else { hidden=false; lastTs=0; markActivity(); if(!rafId) rafId=requestAnimationFrame(frame); }  // returning to the tab counts as activity; don't replay backlog
});
