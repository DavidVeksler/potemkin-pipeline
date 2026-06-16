/* ====================================================================== */
/* TICKET GENERATORS                                                       */
/* ====================================================================== */
// the work unit is a tracked ticket (ENG-NNNN): claimed from a backlog, worked
// through INVESTIGATE→PLAN→IMPLEMENT→TEST→SHIP, then moved → Done. `goal` is the
// imperative ticket title; `subject` is the bare noun reused in mid-beat prose.
let ticketSeq=0, firstTicket=true;
function newTicket(){
  ticketSeq++;
  const root=pick(FILES), subj=pick(SUBS);
  const m={ id:ticketSeq, eng:'ENG-'+ri(1000,9999), goal:pick(GOALVERBS)+' '+subj, subject:stripThe(subj),
            prio:pick(['P0','P1','P1','P2','P2']), label:pick(TICKET_LABELS), backlog:ri(11,84),
            rootFile:root, short:shortName(root),
            difficulty:1+ri(0,2), testBase:100+ri(0,1100), forceFail:firstTicket };
  firstTicket=false; return m;
}
function* pScan(m){
  yield PHASE('INVESTIGATE');
  yield L('Reproducing the report · surveying '+m.subject+'…','accent');
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
  if(rng()<0.3) yield* taskBeat();
  yield L(T1(),'fg'); yield L(T10(),'dim');
}
// a Task spawns a subagent whose own tool calls render indented one level beneath it (#21)
function* taskBeat(){
  const desc=pick(['scan repo for races','map service boundaries','enumerate retry paths','audit lock ordering','find N+1 queries','trace the hot path']);
  const sub=pick(['Explore','general-purpose','code-reviewer','Plan']);
  yield TOOL('Task',desc);
  const n=2+ri(0,2);
  for(let i=0;i<n;i++){
    const t=pick(['Grep','Read','Glob','Read']);
    yield TOOL(t,t==='Read'?pick(FILES):toolArg(t),{nest:1});
    yield OUT(scanOut(t),'dim',{nest:1,wait:U(220,520)});
  }
  yield OUT('subagent ('+sub+') returned · '+ri(2,9)+' findings synthesized','dim',{wait:U(300,640)});
}
// map = still part of INVESTIGATE (no own phase chip) — tracing the fault to its root before planning
function* pMap(m){
  yield L(T7(),'fg');
  if(rng()<0.7) yield L(T4(),'fg');
  yield L(T1(),'fg');
  if(rng()<0.5){ yield THINK(); yield L('Dependency cycle is benign — proceeding.','dim',{wait:U(700,1600)}); }
  yield L(T6(),'dim');
}
function* pPlan(m){
  yield PHASE('PLAN');
  yield L('Scoping '+m.eng+' — '+m.goal+'…','accent');
  const prep=shuffle(TASKBANK.slice()).slice(0,2+ri(0,1));
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
    yield L(rethink(),'warn',{wait:U(900,3200)});
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
  yield PHASE('SHIP');
  yield TASK('deploy','ship','◐');
  const cm=commitMsg(m);
  yield TOOL('Bash','git commit -am "'+cm+'"');
  yield OUT('[main '+hash()+'] '+cm,'dim',{burst:true});
  yield CNT('commits',1);
  yield TOOL('Bash',pick(['gh pr create --fill','git push origin HEAD']));
  const f=pick(DEPLOY_FLAVORS), steps=f.steps, n=steps.length, id=hash();
  const bar=k=>'['+'▰'.repeat(k+1)+'▱'.repeat(n-1-k)+'] ';
  // ~1 in 6 trips on a traffic stage — agent pulls the canary, hotfixes, rolls forward (still ships)
  let tripAt = rng()<0.16 ? steps.findIndex(s=>/canary|shift|rolling|propagate|backfill/.test(s)) : -1;
  for(let i=0;i<n;i++){
    if(rng()<0.14){ const tr=ri(2,3); yield OUT(bar(i)+steps[i]+' · retry 1/'+tr+' ('+pick(RETRY_REASONS)+')','dim',{wait:U(140,360)}); }
    if(i===tripAt){
      yield OUT(bar(i)+deployTick(steps[i]),'accent',{wait:U(120,260)});
      yield OUT('⚠ '+pick(DEPLOY_FAILS),'err',{burst:true,wait:U(300,600)});
      yield L('error budget burning — pulling the canary, rolling forward','warn',{wait:U(600,1200)});
      yield TOOL('Edit',m.rootFile); yield DIFF('+',pickNR(FIX,'fix'),{wait:U(50,150)});
      yield OUT('hotfix '+hash()+' · canary clean — resuming','dim',{wait:U(300,600)});
      yield CNT('incidents',1); tripAt=-1; i--; continue; // replay the stage, clean this time
    }
    yield OUT(bar(i)+deployTick(steps[i])+(i===n-1?' ✔':''),'accent',{wait:U(80,260)});
  }
  yield OUT(pick(DEPLOY_DONE).split('$').join(id),'ok');
  yield CNT('deploys',1); yield CNT('files',ri(0,3)); yield CNT('lines',ri(20,400));
  if(rng()<0.6) yield* mcpShip(m);
  yield TASK('deploy','ship','✔');
}
function* pDone(m){
  yield PHASE('DONE');
  yield BANNER('✔ '+m.eng+' closed · '+cap(m.subject)+' shipped — '+pick(DONETAIL));
  yield CNT('tests',ri(1,6));
  yield L('Pulling next ticket from the backlog…','dim',{wait:U(1200,2600)});
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
  if(r<0.4){ yield TOOL('mcp__linear__update_issue','id: "'+m.eng+'", state: "Done"');
    yield OUT('moved '+m.eng+' → Done','dim',{wait:U(300,640)}); }
  else if(r<0.7){ yield TOOL('mcp__slack__post_message','channel: "#eng-deploys", text: "shipped '+m.short+' ✓"');
    yield OUT('posted to #eng-deploys','dim',{wait:U(300,640)}); }
  else { yield TOOL('mcp__github__create_pull_request','title: "'+commitMsg(m)+'"');
    yield OUT('opened #'+ri(1000,9999)+' · '+ri(1,4)+' reviewers requested','dim',{wait:U(300,640)}); }
}
// typo-and-correct micro-beat — the agent fat-fingers a command, gets an error, retypes.
// Imperfection reads as more real than flawless output. Position of the typo is cosmetic (Math.random).
function mangle(s){
  const i=2+((Math.random()*(s.length-3))|0), r=Math.random();
  if(r<0.4) return s.slice(0,i)+s.slice(i+1);              // drop a char
  if(r<0.7) return s.slice(0,i)+s[i]+s.slice(i);            // double a char
  return s.slice(0,i)+'xqz;'[(Math.random()*4)|0]+s.slice(i); // wrong char
}
function* typoBeat(){
  const cmd=pick(TESTCMDS.concat(['kubectl get pods','docker ps','git status','npm run build','terraform plan']));
  const bad=mangle(cmd), prog=bad.split(' ')[0];
  yield TOOL('Bash',bad);
  yield OUT(pick(['command not found: '+prog,'zsh: '+prog+': command not found','bash: '+prog+': not found','error: unknown command "'+prog+'"']),'err',{burst:true});
  yield L(pick(['typo — retyping that','fat-fingered it, retrying','missed a character, again']),'dim',{wait:U(300,700)});
  yield TOOL('Bash',cmd);
  yield OUT(pick(['ok','done','✓ ok']),'dim',{burst:true});
}
function* ticketStream(){
  while(true){
    const m=newTicket();
    yield CLR();
    yield BANNER('◆ '+m.eng+' · '+m.prio+' · '+m.goal);
    if(m.id===1 && agentProfile.boot) yield L('▸ '+cfg.agent+' · '+agentProfile.boot,'dim',{wait:U(300,600)});
    yield L('claimed from backlog · '+m.backlog+' open · ['+m.label+'] · '+m.rootFile,'dim');
    yield* pScan(m); yield* pMap(m); yield* pPlan(m);
    if(rng()<0.18) yield* typoBeat();
    yield* pImpl(m); yield* pTest(m); yield* pDeploy(m); yield* pDone(m);
    ctxBump(3);
  }
}
