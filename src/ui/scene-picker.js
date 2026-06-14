/* ====================================================================== */
/* SCENE PICKER (hotkey 'd') — fire any drama on demand for testing        */
/* ====================================================================== */
const SCENE_GROUPS=[
  {title:'Observability & telemetry', items:[
    ['grafana','Grafana · SLO breach'],['trace','Jaeger slow trace'],
    ['btop','btop · runaway process'],['oom','btop · OOM kill'],['anomaly','metric anomaly'] ]},
  {title:'Performance & profiling', items:[
    ['flame','pprof flame graph'],['sql','EXPLAIN · slow query'],
    ['load','k6 load test'],['heatmap','latency heatmap'],['cpuheat','cpu · core pinned'] ]},
  {title:'Infrastructure & containers', items:[
    ['cluster','k9s · CrashLoopBackOff'],['docker','docker buildx'],
    ['gpu','GPU farm · throttle'],['mesh','service mesh · breaker'] ]},
  {title:'Ship & release', items:[
    ['pipeline','CI/CD pipeline'],['deploy','deploy & rollout'],['pr','GitHub pull request'] ]},
  {title:'Security', items:[
    ['attackmap','threat map · DDoS'],['security','CVE patch'],['auth','auth / secret rotation'] ]},
  {title:'Version control', items:[
    ['rebase','interactive rebase'],['mergeconflict','merge conflict'],['bisect','git bisect hunt'],
    ['reflog','reflog recovery'],['cherrypick','cherry-pick backport'],['filterrepo','purge leaked secret'],
    ['octopus','octopus merge'],['blame','pickaxe archaeology'] ]},
  {title:'Agent & session', items:[
    ['swarm','subagent fleet'],['matrix','matrix cascade'],['compaction','context compaction'],['deepwork','deep work · away mode'] ]},
];
function queueDrama(name){
  if(!DRAMAS[name]){ toast('unknown scene'); return; }
  enqueueDrama(DRAMAS[name],name);
}
function buildDramaPicker(){
  dramaEl.innerHTML='';
  const hd=el('cfg-hd');
  hd.appendChild(el('h2','SCENE PICKER'));
  hd.appendChild(el('badge','for testing'));
  const x=mkBtn('cfg-x','✕',()=>toggleDrama(false)); x.title='Close (Esc)'; hd.appendChild(x);
  dramaEl.appendChild(hd);
  const bd=el('cfg-bd'); dramaEl.appendChild(bd);
  SCENE_GROUPS.forEach(grp=>{
    const sec=el('cfg-sec'); sec.appendChild(el('cfg-sech',grp.title));
    const g=el('dp-grid');
    grp.items.forEach(([name,label])=>{
      const b=mkBtn('dp-item',label,()=>{ toggleDrama(false); if(name==='deepwork'){ if(!enterIdle())toast('deep work needs auto mode'); } else queueDrama(name); });
      b.title=name; g.appendChild(b);
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
