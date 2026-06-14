/* ---- deep-work "away" mode: a never-ending long-horizon grind toward an absurd goal ---- */
const MEGA_GOALS=[
  {label:'Refactoring the entire monorepo',unit:'files',lo:9000,hi:52000},
  {label:'Migrating the codebase to the new type system',unit:'modules',lo:900,hi:5200},
  {label:'Re-indexing the global vector store',unit:'embeddings',lo:4000000,hi:80000000},
  {label:'Backfilling the ledger from genesis',unit:'rows',lo:2000000,hi:60000000},
  {label:'Upgrading every transitive dependency',unit:'packages',lo:1200,hi:9000},
  {label:'Formalizing core invariants as machine-checked proofs',unit:'lemmas',lo:300,hi:2400},
  {label:'Auditing every call site for data races',unit:'call sites',lo:40000,hi:480000},
  {label:'Porting the test suite to property-based tests',unit:'tests',lo:1500,hi:14000},
  {label:'Rewriting the hot path in Rust',unit:'crates',lo:60,hi:600},
  {label:'Distilling the model to int4',unit:'tensors',lo:2000,hi:24000},
  {label:'Documenting every public symbol',unit:'symbols',lo:8000,hi:90000},
  {label:'Eliminating all technical debt, permanently',unit:'TODOs',lo:3000,hi:40000},
];
function* dDeepWork(){
  while(idleActive){
    const goal=pick(MEGA_GOALS), total=ri(goal.lo,goal.hi);
    yield CLR();
    yield BANNER('▌ Deep work — '+goal.label);
    yield L('Long-horizon autonomous run · '+grp(total)+' '+goal.unit+' queued · interactive input paused','dim');
    yield PHASE('DEEP WORK');
    const beats=ri(14,22);
    let done=0;
    for(let b=1;b<=beats && idleActive;b++){
      done=b===beats?total:Math.min(total,Math.round(total*(b/beats)*U(0.9,1.06)));
      const frac=done/total, r=rng();
      if(r<0.4){ yield TOOL(pick(['Edit','Edit','MultiEdit','Bash','Read']),pick(FILES)); if(rng()<0.5) yield FILE(pick(FILES),'M'); }
      else if(r<0.55){ yield THINK(); yield L(pick(RETHINK),'warn',{wait:U(500,1200)}); }
      yield L(barStr(frac)+' '+goal.label+' · '+Math.round(frac*100)+'% · '+grp(done)+' / '+grp(total)+' '+goal.unit, frac>=1?'ok':'accent',{wait:U(1500,3300)});
      if(rng()<0.5) yield CNT('lines',ri(40,900));
      if(rng()<0.3) yield CNT('files',ri(1,6));
      if(rng()<0.25) yield DIFF('+',pickNR(ADD,'add'),{wait:U(40,120)});
      if(rng()<0.18) yield L(T9(),'dim');
      while(idleActive && dramaQ.length){ const d=dramaQ.shift(); yield* d(); }   // a scheduled crisis cuts in, then the grind resumes
    }
    if(done>=total && idleActive){
      yield BANNER('✔ '+goal.label+' — '+grp(total)+' '+goal.unit+' · '+pick(DONETAIL));
      yield CNT('tests',ri(2,9));
      yield CNT('commits',ri(1,3));
      yield L('Idle — scanning for the next big lever…','dim',{wait:U(1600,3200)});
    }
  }
  yield L('▌ Interactive session resumed — parking the deep-work pass','accent',{wait:U(300,600)});
  yield L('checkpointed · resumable from the last batch','dim',{wait:U(500,900)});
}
