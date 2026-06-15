/* ====================================================================== */
/* CONFIGURATION DIALOG (native <dialog>, centered modal)                  */
/* ====================================================================== */
function toggleSettings(force){
  const open = force!=null ? force : !settingsEl.open;
  if(open){ buildConfig(); if(!settingsEl.open && settingsEl.showModal) settingsEl.showModal(); settingsOpen=true; }
  else { if(settingsEl.open) settingsEl.close(); settingsOpen=false; }
}
function toggleHelp(force){ helpOpen=force!=null?force:!helpOpen; helpEl.classList.toggle('on',helpOpen); }

function buildConfig(){
  settingsEl.innerHTML='';
  // ---- header ----
  const hd=el('cfg-hd');
  hd.appendChild(el('h2','CONFIGURATION'));
  hd.appendChild(el('badge','single-file · offline'));
  const x=mkBtn('cfg-x','✕',()=>toggleSettings(false)); x.title='Close (Esc)'; hd.appendChild(x);
  settingsEl.appendChild(hd);
  // ---- body ----
  const bd=el('cfg-bd'); settingsEl.appendChild(bd);
  function sec(title){ const s=el('cfg-sec'); s.appendChild(el('cfg-sech',title)); const g=el('cfg-grid'); s.appendChild(g); bd.appendChild(s); return g; }
  function fld(grid,label,node,wide){ const f=el('fld'+(wide?' wide':'')); const l=document.createElement('label'); l.textContent=label; f.appendChild(l); f.appendChild(node); grid.appendChild(f); return f; }
  function txt(val,on){ const i=document.createElement('input'); i.type='text'; i.value=val; i.addEventListener('input',()=>on(i.value)); return i; }
  function sel(opts,val,on){ const s=document.createElement('select'); opts.forEach(o=>{const op=document.createElement('option');op.value=o.v!=null?o.v:o;op.textContent=o.t!=null?o.t:o;if((o.v!=null?o.v:o)===val)op.selected=true;s.appendChild(op);}); s.addEventListener('change',()=>on(s.value)); return s; }
  function rng_(min,max,step,val,on,fmt){ const row=el('row'); const i=document.createElement('input'); i.type='range'; i.min=min;i.max=max;i.step=step;i.value=val; const v=el('val',fmt(val)); i.addEventListener('input',()=>{const n=parseFloat(i.value);v.textContent=fmt(n);on(n);}); row.appendChild(i); row.appendChild(v); return row; }

  let g;
  g=sec('Identity');
  fld(g,'agent',txt(cfg.agent,v=>{cfg.agent=v;agentExplicit=!!v;hAgent.textContent=v||pickCodename(cfg.seed);resolveAgentProfile();syncURL();}),true);
  fld(g,'project',txt(cfg.project,v=>{cfg.project=v;hProj.textContent=v;syncURL();}));
  fld(g,'model',txt(cfg.model,v=>{cfg.model=v;hModel.textContent=v;syncURL();}));

  g=sec('Appearance');
  fld(g,'theme',sel(THEMES,cfg.theme,v=>setTheme(v)));
  fld(g,'CRT scanlines',sel(['off','on'],cfg.crt,v=>{cfg.crt=v;document.body.classList.toggle('crt',v==='on');syncURL();}));

  g=sec('Pacing');
  fld(g,'vibe preset',sel([{v:'',t:'— none —'},{v:'startup-crunch',t:'startup crunch'},{v:'enterprise-migration',t:'enterprise migration'},{v:'security-incident',t:'security incident'}],cfg.vibe||'',v=>{ location.search=v?'?vibe='+v:''; }),true);
  fld(g,'speed',rng_(0.25,4,0.05,speed,v=>{speed=v;syncURL();},v=>v.toFixed(2)+'×'));
  fld(g,'dramas',sel(['on','off'],dramaOn?'on':'off',v=>{dramaOn=(v==='on');cfg.dramas=v;syncURL();}));
  fld(g,'drama frequency',rng_(0.25,4,0.25,dramaFreq,v=>{dramaFreq=v;cfg.freq=v;nextDramaAt=logicalNow+U(60000,110000)/dramaFreq;syncURL();},v=>v.toFixed(2)+'×'));

  g=sec('Behavior');
  fld(g,'mode',sel(['auto','performer'],mode,v=>{mode=v;updateMode();syncURL();}));
  fld(g,'audio',sel(['off','on'],cfg.audio,v=>{cfg.audio=v;if(v==='on')audioUnlock();else audioConfirmed=false;syncURL();}));
  fld(g,'idle → deep work',rng_(0,180,5,idleThreshold,v=>{idleThreshold=v|0;cfg.idle=v|0;if(idleActive&&idleThreshold<=0)exitIdle();syncURL();},v=>(v|0)?(v|0)+'s':'off'),true);
  fld(g,'reduce flash',sel([{v:'auto',t:'auto (follow OS)'},{v:'on',t:'on'},{v:'off',t:'off'}],cfg.reduceFlash||'auto',v=>{cfg.reduceFlash=v==='auto'?null:v;reduceFlash=v==='on'?true:v==='off'?false:prefersRM;document.body.classList.toggle('reduce',reduceFlash);syncURL();}),true);

  g=sec('Determinism');
  const seedRow=el('row');
  const si=document.createElement('input'); si.type='number'; si.min='0'; si.step='1'; si.value=String(cfg.seed>>>0);
  si.addEventListener('change',()=>{ const n=parseInt(si.value,10); if(Number.isFinite(n)){ reseed(n>>>0); toast('seed pinned'); } });
  const dice=mkBtn('cfg-btn icon','🎲',()=>{ const n=(Math.random()*4294967296)>>>0; si.value=String(n); reseed(n); toast('seed randomized'); }); dice.title='Randomize seed';
  seedRow.appendChild(si); seedRow.appendChild(dice);
  fld(g,'seed — reproduces an exact run',seedRow,true);

  const hint=el('cfg-hint'); hint.innerHTML='Changes apply live and persist in the URL. <kbd>s</kbd> toggles this dialog · <kbd>?</kbd> shows hotkeys.';
  bd.appendChild(hint);

  // ---- footer ----
  const ft=el('cfg-ft');
  ft.appendChild(mkBtn('cfg-btn','⧉ Copy link',copyLink));
  ft.appendChild(el('spacer'));
  ft.appendChild(mkBtn('cfg-btn','Reset',resetConfig));
  ft.appendChild(mkBtn('cfg-btn primary','Done',()=>toggleSettings(false)));
  settingsEl.appendChild(ft);
}
function mkBtn(cls,label,on){ const b=document.createElement('button'); b.type='button'; b.className=cls; b.textContent=label; b.addEventListener('click',on); return b; }
function reseed(n){ _seed=n>>>0; cfg.seed=n>>>0; seedExplicit=true; syncURL(); }
function urlParams(forceSeed){
  const p=new URLSearchParams();
  if(agentExplicit&&cfg.agent)p.set('agent',cfg.agent);
  if(cfg.project)p.set('project',cfg.project);
  if(cfg.model!==(cfg.vibe&&VIBES[cfg.vibe]&&VIBES[cfg.vibe].model||'mythos-5-preview'))p.set('model',cfg.model);  // pin only when model differs from the vibe's default
  if(cfg.theme!==(cfg.vibe&&VIBES[cfg.vibe]?VIBES[cfg.vibe].theme:'amber'))p.set('theme',cfg.theme);  // pin only when theme differs from the vibe's default
  if(speed!==1)p.set('speed',speed.toFixed(2));
  if(!dramaOn)p.set('dramas','off');
  if(dramaFreq!==1)p.set('freq',dramaFreq.toFixed(2));
  if(mode!=='auto')p.set('mode',mode);
  if(cfg.audio!=='off')p.set('audio',cfg.audio);
  if(cfg.crt!=='off')p.set('crt',cfg.crt);
  if(cfg.vibe)p.set('vibe',cfg.vibe);
  if(cfg.idle!==90)p.set('idle',String(cfg.idle));
  if(cfg.reduceFlash)p.set('reduceFlash',cfg.reduceFlash);
  if(forceSeed||seedExplicit)p.set('seed',String(cfg.seed>>>0));
  return p.toString();
}
function syncURL(){ const q=urlParams(false); history.replaceState(null,'',location.pathname+(q?'?'+q:'')); }
function copyLink(){
  const q=urlParams(true);   // always pin the seed so the link reproduces this exact run
  const url=location.origin+location.pathname+(q?'?'+q:'');
  if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(url).then(()=>toast('shareable link copied'),()=>toast('copy blocked — see URL bar')); }
  else { history.replaceState(null,'',location.pathname+(q?'?'+q:'')); toast('link in URL bar'); }
}
function resetConfig(){
  cfg.model='mythos-5-preview'; cfg.audio='off'; cfg.crt='off'; cfg.reduceFlash=null;
  cfg.idle=90; idleThreshold=90; exitIdle();
  speed=1; dramaOn=true; cfg.dramas='on'; dramaFreq=1; cfg.freq=1; mode='auto'; cfg.project=PROJECTS[(rng()*PROJECTS.length)|0];
  cfg.seed=(Math.random()*4294967296)>>>0; _seed=cfg.seed; seedExplicit=false;
  cfg.agent=pickCodename(cfg.seed); agentExplicit=false; resolveAgentProfile();
  reduceFlash=prefersRM; reduceMotion=prefersRM;
  document.body.classList.toggle('crt',false); document.body.classList.toggle('reduce',reduceFlash);
  hAgent.textContent=cfg.agent; hProj.textContent=cfg.project; hModel.textContent=cfg.model;
  setTheme('amber'); updateMode(); syncURL(); buildConfig(); toast('reset to defaults');
}
// dialog lifecycle: keep state in sync however it closes (Esc, backdrop, ✕, Done)
settingsEl.addEventListener('close',()=>{ settingsOpen=false; });
settingsEl.addEventListener('cancel',()=>{ settingsOpen=false; });
settingsEl.addEventListener('click',e=>{ if(e.target===settingsEl) toggleSettings(false); });  // click backdrop to dismiss
cfgbtn.addEventListener('click',()=>toggleSettings(true));

/* ---- toast ---- */
let toastT=0;
function toast(msg){ toastEl.textContent=msg; toastEl.classList.add('on'); clearTimeout(toastT); toastT=setTimeout(()=>toastEl.classList.remove('on'),1400); }
