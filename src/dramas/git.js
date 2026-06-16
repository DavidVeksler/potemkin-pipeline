/* ---- git operations: wild source-control theater ---- */
function* dRebase(){
  const n=ri(28,64), onto=pick(['main','origin/main','release/'+ri(2,5)+'.x']);
  yield OV('open',{type:'box'});
  yield OV('box',{title:'⑂ INTERACTIVE REBASE · '+n+' commits',variant:'git',wait:U(200,400)});
  yield OV('boxline',{text:'git rebase -i --autosquash '+onto,tone:'accent',wait:U(300,600)});
  const ops=['pick','squash','fixup','reword','drop'];
  const tally={squash:0,fixup:0,drop:0};
  for(let i=0;i<n;i++){
    const op=i===0?'pick':pick(['pick','squash','squash','fixup','fixup','reword','drop']);
    if(tally[op]!=null)tally[op]++;
    yield OV('bar',{frac:(i+1)/n,label:op+' '+hash(7),wait:U(40,120)});
  }
  yield OV('boxline',{text:tally.squash+' squashed · '+tally.fixup+' fixed up · '+tally.drop+' dropped',tone:'dim',wait:U(300,600)});
  yield OV('boxline',{text:n+' commits → '+ri(3,9)+' · history linearized',tone:'warn',wait:U(400,800)});
  yield OV('boxline',{text:'git push --force-with-lease '+onto.replace('origin/','')+' ✔',tone:'ok',wait:U(400,800)});
  beep('deploy');
  yield CNT('commits',1);
  yield OV('close',{wait:U(600,1100)});
}
/* both sides edited the same line — merged keeps both intents (a real 3-way resolution) */
const MERGE_HUNKS=[
  {ctx:'function resolveTimeout(env){', ours:'const ms = 30_000;',          theirs:'const ms = 45_000;',          merged:'const ms = Number(env.TIMEOUT_MS ?? 45_000);'},
  {ctx:'export const retry = {',        ours:'  attempts: 3,',              theirs:'  attempts: 5,',              merged:'  attempts: cfg.maxRetries ?? 5,'},
  {ctx:'async function read(key){',      ours:'  return cache.get(key);',    theirs:'  return store.lookup(key);', merged:'  return cache.get(key) ?? await store.lookup(key);'},
  {ctx:'function headers(req){',         ours:"  h['x-trace'] = req.id;",    theirs:"  h['x-span'] = span.id;",   merged:"  h['x-trace'] = req.id; h['x-span'] = span.id;"},
  {ctx:'const pool = createPool({',      ours:'  max: 16,',                  theirs:'  max: 32,',                  merged:'  max: Number(env.POOL_MAX ?? 32),'},
  {ctx:'function shardFor(key){',        ours:'  return hash(key) % 64;',     theirs:'  return hash(key) % 128;',   merged:'  return hash(key) % SHARD_COUNT;'},
];
function* dMergeConflict(){
  const branch=pick(['feature/'+pick(['streaming','multi-region','zero-downtime','crdt-merge']),'epic/rewrite-'+pick(['auth','ledger','scheduler'])]);
  const files=shuffle(FILES.slice()).slice(0,ri(3,6));
  const hunks=shuffle(MERGE_HUNKS.slice());
  yield OV('open',{type:'anomaly'});
  yield OV('banner',{cls:'err pulse',text:'⚠ MERGE CONFLICT — '+files.length+' files · '+branch+' ⇆ main',wait:U(300,600)});
  beep('alert');
  yield L('▌ git merge --no-ff '+branch,'accent',{wait:U(400,800)});
  yield TOOL('Bash','git merge --no-ff '+branch);
  yield OUT('Auto-merging '+files.length+' paths…','dim',{burst:true});
  yield OUT('CONFLICT (content): merge conflict in '+files.length+' files','err',{burst:true});
  yield THINK();
  // centerpiece: open the worst-hit file and actually resolve a hunk
  const star=files[0], h=hunks[0];
  yield L('opening '+star+' — first of '+ri(2,6)+' conflicted hunks','dim',{wait:U(500,900)});
  yield TOOL('Edit',star);
  yield OUT('@@ -'+ri(40,400)+',7 +'+ri(40,400)+',7 @@ '+h.ctx,'dim',{burst:true});
  yield L('<<<<<<< HEAD','warn',{wait:U(140,280)});
  yield DIFF('-',h.ours,{wait:U(80,180)});
  yield L('=======','dim',{wait:U(80,180)});
  yield DIFF('+',h.theirs,{wait:U(80,180)});
  yield L('>>>>>>> '+branch,'warn',{wait:U(140,280)});
  yield THINK();
  yield L('both branches touched the same line — reconciling, keeping both intents','accent',{wait:U(700,1300)});
  yield OUT('— resolution —','dim',{burst:true});
  yield DIFF('-',h.ours,{wait:U(60,150)});
  yield DIFF('-',h.theirs,{wait:U(60,150)});
  yield DIFF('+',h.merged,{wait:U(90,200)});
  yield TOOL('Bash','git add '+star);
  yield L('✔ '+star+' resolved','ok',{wait:U(300,600)});
  // the rest: rerere replays a couple, hand-resolve the others
  const rest=files.slice(1), replayed=Math.min(rest.length,ri(1,3));
  if(replayed) yield L('git rerere — replaying '+replayed+' remembered resolution'+(replayed>1?'s':''),'warn',{wait:U(500,900)});
  for(let i=0;i<rest.length;i++){
    const hh=hunks[(i+1)%hunks.length];
    if(i<replayed){ yield OUT('Resolved \''+rest[i]+'\' using previous resolution.','dim',{burst:true}); }
    else{ yield TOOL('Edit',rest[i]); yield DIFF('-',hh.ours,{wait:U(40,110)}); yield DIFF('+',hh.merged,{wait:U(50,140)}); }
  }
  yield TOOL('Bash','git add -A && git commit --no-edit');
  yield OUT('[main '+hash(7)+"] Merge branch '"+branch+"' into main",'dim',{burst:true});
  yield OV('banner',{cls:'ok',text:'✓ MERGED — '+branch+' folded into main, no force needed',wait:U(700,1400)});
  beep('ok');
  yield L('✔ '+files.length+' files reconciled · merge commit '+hash(7)+' · tree clean','ok',{wait:U(600,1200)});
  yield CNT('commits',1);
  yield OV('close',{wait:U(500,900)});
}
function* dBisect(){
  const span=Math.pow(2,ri(9,13)), bad=hash(7);
  yield OV('open',{type:'box'});
  yield OV('box',{title:'⑂ GIT BISECT · hunting the regression',variant:'git',wait:U(200,400)});
  yield OV('boxline',{text:'git bisect start · good v'+ri(1,4)+'.'+ri(0,9)+'.0 · bad HEAD',tone:'accent',wait:U(300,600)});
  yield OV('boxline',{text:grp(span)+' commits in the suspect range',tone:'dim',wait:U(300,500)});
  let lo=span;
  let step=0;
  while(lo>1){
    lo=Math.ceil(lo/2); step++;
    const verdict=lo>1?pick(['good','bad','good']):'bad';
    yield OV('bar',{frac:1-Math.log2(lo)/Math.log2(span),label:'step '+step+' · '+grp(lo)+' left · '+hash(7)+' '+verdict,wait:U(220,520)});
  }
  yield OV('boxline',{text:bad+' is the first bad commit',tone:'err',wait:U(400,800)});
  yield OV('boxline',{text:'caught in '+step+' steps (log₂) — "'+pick(['fix: clamp ttl','perf: cache plan','refactor: drop lock'])+'"',tone:'dim',wait:U(300,600)});
  yield OV('boxline',{text:'git revert '+bad+' · regression backed out ✔',tone:'ok',wait:U(400,800)});
  beep('ok');
  yield CNT('incidents',1); yield CNT('commits',1);
  yield OV('close',{wait:U(600,1100)});
}
function* dReflog(){
  const lost=ri(6,23);
  yield OV('open',{type:'anomaly'});
  yield OV('banner',{cls:'err pulse',text:'⚠ HARD RESET — '+lost+' commits detached from main',wait:U(300,600)});
  beep('alert');
  yield L('▌ git reset --hard HEAD~'+lost+' — wait, that was the wrong branch','err',{wait:U(600,1100)});
  yield OUT(lost+' commits no longer reachable from any ref','err',{burst:true});
  yield OUT('working tree clean · '+grp(ri(900,7000))+' lines gone','dim',{burst:true});
  yield THINK();
  yield L('Nothing is ever truly gone — the reflog still has it.','warn',{wait:U(800,1500)});
  yield TOOL('Bash','git reflog | head -'+(lost+4));
  yield OUT(hash(7)+' HEAD@{'+lost+'}: commit: '+pick(['feat: saga compensation','fix: idempotent retry','perf: pool encoder']),'dim',{burst:true});
  yield L('found the tip — resurrecting the branch','accent',{wait:U(600,1100)});
  yield TOOL('Bash','git branch recovered HEAD@{'+lost+'} && git reset --hard recovered');
  yield OUT('git fsck --lost-found · 0 dangling objects','dim',{burst:true});
  yield OV('banner',{cls:'ok',text:'✓ RECOVERED — all '+lost+' commits back on main',wait:U(700,1400)});
  beep('ok');
  yield L('✔ history restored from reflog · nothing lost','ok',{wait:U(600,1200)});
  yield CNT('incidents',1);
  yield OV('close',{wait:U(500,900)});
}
function* dCherryPick(){
  const sha=hash(7), branches=['release/'+ri(3,5)+'.x','release/'+ri(1,2)+'.x','hotfix/prod','main'];
  yield OV('open',{type:'box'});
  yield OV('box',{title:'⑂ CHERRY-PICK · backporting hotfix '+sha,variant:'git',wait:U(200,400)});
  yield OV('boxline',{text:'fix: '+pick(FIX),tone:'accent',wait:U(300,600)});
  for(let i=0;i<branches.length;i++){
    yield OV('bar',{frac:(i+1)/branches.length,label:'git cherry-pick -x → '+branches[i],wait:U(300,650)});
    yield OV('boxline',{text:'  ['+branches[i]+' '+hash(7)+'] applied clean',tone:'dim',wait:U(150,350)});
  }
  yield OV('boxline',{text:'patched '+branches.length+' release lines · pushed every branch ✔',tone:'ok',wait:U(400,800)});
  beep('deploy');
  yield CNT('commits',branches.length);
  yield OV('close',{wait:U(600,1100)});
}
function* dFilterRepo(){
  const secret=pick(['AWS_SECRET_ACCESS_KEY','STRIPE_LIVE_KEY','private_key.pem','.env.production','GITHUB_PAT']);
  const commits=grp(ri(40000,310000)), branches=ri(18,64);
  yield OV('open',{type:'anomaly'});
  yield OV('banner',{cls:'err pulse',text:'⚠ SECRET LEAKED IN HISTORY — '+secret,wait:U(300,600)});
  beep('alert');
  yield L('▌ '+secret+' was committed '+ri(40,900)+' commits ago — it must leave every blob','err',{wait:U(700,1300)});
  yield THINK();
  yield L('Rewriting history across the whole repo — this is irreversible by design.','warn',{wait:U(800,1500)});
  yield TOOL('Bash',"git filter-repo --replace-text <(echo '"+secret+"==>***REDACTED***')");
  yield OUT('Parsed '+commits+' commits','dim',{burst:true});
  yield OUT('Rewriting blobs · scrubbing '+secret+' from '+ri(3,40)+' historical paths','dim',{burst:true});
  yield OUT('New history written · every SHA below the leak changed','warn',{burst:true});
  yield TOOL('Bash','git push --force-with-lease --all && git push --force --tags');
  yield OUT('force-pushed '+branches+' branches · rotating the key in vault','dim',{burst:true});
  yield OV('banner',{cls:'ok',text:'✓ PURGED — secret gone from all '+commits+' commits',wait:U(700,1400)});
  beep('ok');
  yield L('✔ history rewritten · key rotated · '+branches+' branches force-pushed','ok',{wait:U(600,1200)});
  yield CNT('incidents',1); yield CNT('cves',1);
  yield OV('close',{wait:U(500,900)});
}
function* dOctopus(){
  const feats=shuffle(['feature/streaming','feature/multi-region','feature/dark-mode','feature/webhooks',
    'feature/rate-limit','feature/audit-log','feature/i18n','feature/sso','feature/graphql'].slice()).slice(0,ri(5,8));
  yield OV('open',{type:'box'});
  yield OV('box',{title:'⑂ OCTOPUS MERGE · '+feats.length+' branches at once',variant:'git',wait:U(200,400)});
  yield OV('boxline',{text:'git merge '+feats.length+' heads → release-train',tone:'accent',wait:U(300,600)});
  for(let i=0;i<feats.length;i++){
    yield OV('bar',{frac:(i+1)/feats.length,label:'merge tentacle · '+feats[i],wait:U(250,550)});
  }
  yield OV('boxline',{text:'all '+feats.length+' heads reconciled — single octopus commit '+hash(7),tone:'dim',wait:U(300,600)});
  yield OV('boxline',{text:'release train assembled · '+feats.length+'-parent merge ✔',tone:'ok',wait:U(400,800)});
  beep('deploy');
  yield CNT('commits',1);
  yield OV('close',{wait:U(600,1100)});
}
function* dBlame(){
  const yrs=ri(2,7), culprit=hash(7);
  yield OV('open',{type:'anomaly'});
  yield OV('banner',{cls:'err pulse',text:'⚠ HEISENBUG — wrong since '+yrs+' years ago, nobody noticed',wait:U(300,600)});
  beep('alert');
  yield L('▌ git pickaxe — when did this invariant break?','accent',{wait:U(500,900)});
  yield TOOL('Bash','git log -S "'+pick(['ttl','lockOrder','idempotencyKey','version'])+'" --oneline --all');
  yield OUT('scanned '+grp(ri(8000,90000))+' commits across '+ri(8,30)+' years of history','dim',{burst:true});
  yield OUT(culprit+' introduced the off-by-one — '+yrs+' years deep','warn',{burst:true});
  yield THINK();
  yield TOOL('Bash','git blame -L '+ri(40,400)+',+8 '+pick(FILES));
  yield OUT(culprit+' ('+pick(['a.chen','j.park','m.silva','intern-2019'])+' '+(2026-yrs)+') the line that lied','dim',{burst:true});
  yield L(rethink(),'warn',{wait:U(700,1400)});
  yield TOOL('Edit',pick(FILES));
  yield DIFF('+',pick(FIX),{wait:U(60,160)});
  yield OV('banner',{cls:'ok',text:'✓ FIXED — '+yrs+'-year-old bug finally evicted',wait:U(700,1400)});
  beep('ok');
  yield L('✔ root cause '+culprit+' patched · regression test pinned','ok',{wait:U(600,1200)});
  yield CNT('incidents',1); yield CNT('tests',ri(1,4));
  yield OV('close',{wait:U(500,900)});
}
