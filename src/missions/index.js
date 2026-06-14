/* ====================================================================== */
/* MISSION GENERATORS                                                      */
/* ====================================================================== */
let missionId=0, firstMission=true;
function newMission(){
  missionId++;
  const root=pick(FILES);
  const m={ id:missionId, subject:stripThe(pick(SUBS)), rootFile:root, short:shortName(root),
            difficulty:1+ri(0,2), testBase:100+ri(0,1100), forceFail:firstMission };
  firstMission=false; return m;
}
function* pScan(m){
  yield PHASE('SCAN');
  yield L('Surveying '+m.subject+'…','accent');
  const n=3+ri(0,3);
  for(let i=0;i<n;i++){
    const t=pick(['Glob','Grep','Read','Read']);
    const f=t==='Read'?pick(FILES):toolArg(t);
    yield TOOL(t,f);
    yield OUT(scanOut(t),'dim',{wait:U(260,620)});   // wait = the call "running" before its result lands
    if(t==='Read'){ yield FILE(f); if(rng()<0.45) yield SNIP(f,false); }
    else if(rng()<0.4) yield FILE(pick(FILES));
  }
  if(rng()<0.4) yield* mcpScan(m);
  yield L(T1(),'fg'); yield L(T10(),'dim');
}
function* pMap(m){
  yield PHASE('MAP');
  yield L(T7(),'fg');
  if(rng()<0.7) yield L(T4(),'fg');
  yield L(T1(),'fg');
  if(rng()<0.5){ yield THINK(); yield L('Dependency cycle is benign — proceeding.','dim',{wait:U(700,1600)}); }
  yield L(T6(),'dim');
}
function* pPlan(m){
  yield PHASE('PLAN');
  yield L('Drafting execution plan for '+m.subject+'…','accent');
  const prep=shuffle(TASKBANK.slice()).slice(0,3+ri(0,2));
  for(let i=0;i<prep.length;i++) yield TASK('p'+i,prep[i],'✔');
  yield TASK('plan','ratify the master plan','✔');
  yield TASK('impl','implement '+m.short,'○');
  yield TASK('test','run tests','○');      yield TASK('deploy','ship','○');
}
function* pImpl(m){
  yield PHASE('IMPLEMENT');
  yield TASK('impl','implement '+m.short,'◐');
  yield FILE(m.rootFile);
  const edits=2+ri(0,3);
  for(let i=0;i<edits;i++){
    let f=i===0?m.rootFile:pick(FILES);
    const write=rng()<0.3;
    let st='M';
    if(write && i>0 && rng()<0.45){ const nf=newFilePath(); if(nf){ f=nf; st='A'; } }
    yield TOOL(write?'Write':'Edit',f); yield FILE(f,st);
    if(write){
      const wl=ri(18,140);
      yield OUT((st==='A'?'Created ':'Wrote ')+shortName(f)+' ('+plur(wl,'line')+')','dim',{wait:U(300,680)});
      yield CNT('lines',wl);
      if(st==='A') yield CNT('files',1);
      yield SNIP(f,true);
    }
    else{
      const signs=[]; const dl=2+ri(0,4);
      for(let j=0;j<dl;j++) signs.push(rng()<0.72?'+':'-');
      const add=signs.filter(s=>s==='+').length, del=dl-add;
      yield OUT('Updated '+shortName(f)+' with '+plur(add,'addition')+' and '+plur(del,'removal'),'dim',{wait:U(300,680)});
      for(const s of signs) yield DIFF(s,s==='+'?pickNR(ADD,'add'):pickNR(DEL,'del'),{wait:U(40,140)});
      if(add>del) yield CNT('lines',add-del);
      if(rng()<0.35) yield SNIP(f,true);
    }
    if(rng()<0.4) yield L(T1(),'dim');
  }
  yield TASK('impl','implement '+m.short,'✔');
}
function* pTest(m,attempt){
  attempt=attempt||0;
  if(attempt===0){ yield PHASE('TEST'); yield TASK('test','run tests','◐'); }
  yield TOOL('Bash',pick(TESTCMDS));
  const total=m.testBase+attempt;
  const pFail=clamp(0.35+0.2*(m.difficulty-1),0,0.9);
  const willFail=(m.forceFail&&attempt===0)||(attempt<2 && rng()<pFail);
  if(willFail){
    yield OUT((total-1)+' passing, 1 failing ('+(2+rng()*3).toFixed(1)+'s)','warn',{burst:true,more:ri(12,80)});
    yield OUT('✗ '+pick(ASSERT),'err');
    yield THINK();
    yield L(pick(RETHINK),'warn',{wait:U(900,3200)});
    yield L(pick(DIAG),'dim');
    yield TOOL('Edit',m.rootFile); yield FILE(m.rootFile,'M');
    const dl=2+ri(0,2);
    for(let j=0;j<dl;j++){ const a=rng()<0.82; yield DIFF(a?'+':'-',a?pickNR(FIX,'fix'):pickNR(DEL,'del'),{wait:U(40,140)}); }
    yield* pTest(m,attempt+1);
  }else{
    yield OUT(total+' passing, 0 failing ('+(2+rng()*3).toFixed(1)+'s) ✔','ok',{burst:true});
    if(rng()<0.6) yield L(T9(),'ok');
    yield CNT('tests',ri(1,5));
    yield TASK('test','run tests','✔');
  }
}
function* pDeploy(m){
  yield PHASE('DEPLOY');
  yield TASK('deploy','ship','◐');
  const cm=commitMsg(m);
  yield TOOL('Bash','git commit -am "'+cm+'"');
  yield OUT('[main '+hash()+'] '+cm,'dim',{burst:true});
  yield CNT('commits',1);
  yield TOOL('Bash',pick(['gh pr create --fill','git push origin HEAD']));
  const steps=['build image','push registry','run migrations','canary 5%','canary 50%','rollout 100%','health check'];
  for(let i=0;i<steps.length;i++){
    yield OUT('['+'▰'.repeat(i+1)+'▱'.repeat(steps.length-1-i)+'] '+steps[i]+(i===steps.length-1?' ✔':''),'accent',{wait:U(80,260)});
  }
  yield OUT('deploy '+hash()+' healthy ✔','ok');
  yield CNT('deploys',1); yield CNT('files',ri(0,3)); yield CNT('lines',ri(20,400));
  if(rng()<0.6) yield* mcpShip(m);
  yield TASK('deploy','ship','✔');
}
function* pDone(m){
  yield PHASE('DONE');
  yield BANNER('✔ '+cap(m.subject)+' shipped — '+pick(DONETAIL));
  yield CNT('tests',ri(1,6));
  yield L('Idle — watching for new work…','dim',{wait:U(1200,2600)});
}
// MCP-flavored tool beats — the mcp__server__action namespace reads as authentic precisely
// because nobody fakes it. Seeded (structural: real TOOL events that bump cost/ctx).
function* mcpScan(m){
  const r=rng();
  if(r<0.5){ yield TOOL('mcp__sentry__search_issues','query: "is:unresolved '+m.short+'"');
    yield OUT('Found '+ri(2,40)+' issues · top: '+grp(ri(40,9000))+' events, last seen '+ri(1,59)+'m ago','dim',{wait:U(320,680),more:ri(3,18)}); }
  else { yield TOOL('mcp__datadog__query_metrics','query: "p99:'+m.short+'{env:prod}"');
    yield OUT(ri(80,1800)+'ms p99 over '+ri(2,24)+'h · '+ri(1,9)+' anomalies','dim',{wait:U(320,680)}); }
}
function* mcpShip(m){
  const r=rng();
  if(r<0.4){ const id='ENG-'+ri(120,990); yield TOOL('mcp__linear__update_issue','id: "'+id+'", state: "Done"');
    yield OUT('moved '+id+' → Done','dim',{wait:U(300,640)}); }
  else if(r<0.7){ yield TOOL('mcp__slack__post_message','channel: "#eng-deploys", text: "shipped '+m.short+' ✓"');
    yield OUT('posted to #eng-deploys','dim',{wait:U(300,640)}); }
  else { yield TOOL('mcp__github__create_pull_request','title: "'+commitMsg(m)+'"');
    yield OUT('opened #'+ri(1000,9999)+' · '+ri(1,4)+' reviewers requested','dim',{wait:U(300,640)}); }
}
function* missionStream(){
  while(true){
    const m=newMission();
    yield CLR();
    yield BANNER('▌ Mission #'+m.id+' — '+m.subject);
    yield L('root: '+m.rootFile+'  · difficulty '+m.difficulty,'dim');
    yield* pScan(m); yield* pMap(m); yield* pPlan(m); yield* pImpl(m); yield* pTest(m); yield* pDeploy(m); yield* pDone(m);
    ctxBump(3);
  }
}
