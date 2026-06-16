/* ====================================================================== */
/* INIT                                                                    */
/* ====================================================================== */
function cacheAccent(){ accentCache=getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()||'#ff9d2f'; }
function init(){
  if(!cfg.project)cfg.project=PROJECTS[(rng()*PROJECTS.length)|0];
  document.documentElement.setAttribute('data-theme',cfg.theme);
  document.body.classList.toggle('crt',cfg.crt==='on');
  document.body.classList.toggle('reduce',reduceFlash);
  document.body.classList.toggle('paused',paused);
  hAgent.textContent=cfg.agent; hProj.textContent=cfg.project; hModel.textContent=cfg.model;
  document.title=cfg.agent+' · '+cfg.project+' · '+cfg.model;  // match the on-screen header identity
  if(cfg.vibe&&VIBES[cfg.vibe]){ hVibe.textContent=VIBES[cfg.vibe].label||cfg.vibe; hVibe.dataset.vibe=cfg.vibe; hVibe.hidden=false; }  // persistent badge that a vibe is active
  cacheAccent();
  FILES=genFiles();
  buildFileTree();
  // footer init
  cFiles.textContent=compactNum(counters.files); cLines.textContent=compactNum(counters.lines);
  cTests.textContent=compactNum(counters.tests); cCves.textContent=compactNum(counters.cves); cDeploys.textContent=compactNum(counters.deploys);
  renderCtx(); updateMode();
  if(cfg.audio==='on'){ /* will unlock on first gesture */ }
  pending=stream.next().value; nextAt=320;
  lastActivityTs=performance.now();
  rafId=requestAnimationFrame(frame);
}
init();
