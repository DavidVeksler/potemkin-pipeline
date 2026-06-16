/* ====================================================================== */
/* DRAMA GENERATORS                                                        */
/* ====================================================================== */
function* dAnomaly(){
  const m=pick(['p99 latency','error rate','5xx rate','saturation','queue depth']);
  const v=pick(['1,920ms','7.4%','0.91','12,400 msg','3.2× baseline']);
  const region=pick(['us-east-1','us-east-2','us-west-1','us-west-2','eu-west-1','eu-west-2','eu-central-1','eu-north-1','ap-south-1','ap-southeast-1','ap-southeast-2','ap-northeast-1','sa-east-1','ca-central-1','af-south-1','me-central-1']);
  yield OV('open',{type:'anomaly'});
  yield OV('banner',{cls:'err pulse',text:'⚠ ANOMALY DETECTED — '+m+' '+v+' ('+region+')',wait:U(300,600)});
  beep('alert');
  yield L('▌ Incident — auto-triage engaged','err',{wait:U(500,900)});
  yield TOOL('Bash','kubectl logs -l app=api --since=5m | tail');
  yield OUT('spike correlates with deploy '+hash(),'dim',{burst:true,more:ri(20,140)});
  yield OUT(ri(120,9000)+' anomalous spans in '+region,'dim',{burst:true});
  yield THINK();
  yield L(rethink(),'warn',{wait:U(800,1800)});
  yield TOOL('Edit',pick(FILES));
  yield DIFF('+',pick(FIX),{wait:U(60,160)});
  yield OUT('hotfix applied · rolling forward','dim');
  yield OV('banner',{cls:'ok',text:'✓ RECOVERED — '+m+' nominal ('+region+')',wait:U(700,1400)});
  beep('ok');
  yield L('✔ Incident resolved in '+ri(2,9)+'m','ok',{wait:U(600,1200)});
  yield CNT('incidents',1);
  yield OV('close',{wait:U(500,900)});
}
// live stat tacked onto traffic-shifting stages so the bar reads like a real rollout
function deployTick(label){ return /canary|rollout|shift|traffic|warm/.test(label) ? label+' · '+grp(ri(200,9000))+' rps · p99 '+ri(38,150)+'ms · '+(rng()<0.82?'0 err':ri(1,9)+' err') : label; }
function* dDeploy(){
  const f=pick(DEPLOY_FLAVORS), steps=f.steps, n=steps.length, id=hash();
  yield OV('open',{type:'box'});
  yield OV('box',{title:f.title,variant:'deploy',wait:U(200,400)});
  // ~1 in 5 runs goes bad and rolls back; fail in the back half, never on the last stage
  const failAt = rng()<0.2 ? ri(Math.ceil(n*0.5),n-2) : -1;
  for(let i=0;i<n;i++){
    const frac=(i+1)/n;
    if(i===failAt){
      yield OV('bar',{frac:frac,label:steps[i],wait:U(200,400)});
      yield OV('boxline',{text:'⚠ '+pick(DEPLOY_FAILS),tone:'err',wait:U(400,800)});
      beep('alert');
      yield THINK();
      yield L('error budget burning — pulling the rollout, not the alarm','warn',{wait:U(700,1300)});
      const rb=['draining canary','restoring revision '+hash(),'verifying health','traffic 100% → stable'];
      for(let j=0;j<rb.length;j++) yield OV('bar',{frac:(j+1)/rb.length,label:rb[j],wait:U(220,460)});
      yield OV('boxline',{text:'rolled back to '+hash()+' · 0 customer impact ✔',tone:'ok',wait:U(400,800)});
      beep('ok');
      yield CNT('incidents',1);
      yield OV('close',{wait:U(700,1200)});
      return;
    }
    // occasional transient retry inside a stage before it goes green
    if(rng()<0.18){
      const tries=ri(2,3), reason=pick(RETRY_REASONS);
      for(let t=1;t<tries;t++) yield OV('bar',{frac:frac,label:steps[i]+' · retry '+t+'/'+tries+' ('+reason+')',wait:U(260,520)});
    }
    yield OV('bar',{frac:frac,label:deployTick(steps[i]),wait:U(120,320)});
  }
  yield OV('boxline',{text:'rollback guard: passed',tone:'dim',wait:U(200,400)});
  yield OV('boxline',{text:'deploy '+id+' healthy ✔',tone:'ok',wait:U(300,600)});
  beep('deploy');
  yield CNT('deploys',1);
  yield OV('close',{wait:U(700,1200)});
}
function* dSec(){
  yield OV('open',{type:'box'});
  yield OV('box',{title:'⚠ SECURITY SCAN',variant:'security',wait:U(200,400)});
  const n=3+ri(0,3);
  for(let i=0;i<n;i++) yield OV('boxline',{text:'⏺ '+T5(),tone:'warn',wait:U(200,500)});
  yield OV('boxline',{text:T10(),tone:'dim',wait:U(200,400)});
  yield OV('boxline',{text:'0 criticals remaining ✔',tone:'ok',wait:U(300,600)});
  yield CNT('cves',n);
  yield OV('close',{wait:U(600,1100)});
}
function* dMatrix(){
  if(reduceFlash){ yield WAIT(U(200,400)); return; }
  yield OV('open',{type:'matrix',wait:U(150,300)});
  yield WAIT(reduceMotion?U(1600,2400):U(3500,4600));
  yield OV('close',{wait:U(200,400)});
}
function* dCompact(){
  yield OV('open',{type:'box'});
  yield OV('box',{title:'↺ COMPACTING CONTEXT',variant:'context',wait:U(150,300)});
  yield OV('boxline',{text:'Compacting context window…',tone:'accent',wait:U(300,600)});
  yield OV('compact',{wait:U(1300,2200)});
  yield OV('boxline',{text:'reclaimed '+ri(42,72)+'% · context compacted ✔',tone:'ok',wait:U(300,600)});
  yield OV('close',{wait:U(400,800)});
}
function* dAuth(){
  const scope=pick(['deploy:prod','secrets:read','iam:write','db:admin','kms:decrypt']);
  yield OV('open',{type:'box'});
  yield OV('box',{title:'✦ AUTHORIZATION',variant:'auth',wait:U(150,300)});
  yield OV('boxline',{text:'Requesting elevated scope: '+scope,tone:'warn',wait:U(500,1000)});
  yield OV('boxline',{text:'verifying policy · MFA ok',tone:'dim',wait:U(400,800)});
  yield OV('boxline',{text:'GRANTED ✔',tone:'ok',wait:U(400,800)});
  yield OV('close',{wait:U(500,900)});
}
function* dTerraform(){
  const res=pick(['aws_db_instance.prod','aws_rds_cluster.primary','google_sql_database_instance.main','azurerm_postgresql_server.core']);
  const add=ri(28,61), chg=ri(6,22), del=ri(1,4);
  yield OV('open',{type:'box'});
  yield OV('box',{title:'⊹ TERRAFORM · plan',variant:'deploy',wait:U(200,400)});
  yield OV('boxline',{text:'terraform plan -out tfplan',tone:'accent',wait:U(300,600)});
  yield OV('boxline',{text:'Plan: +'+add+' to add, ~'+chg+' to change, -'+del+' to destroy',tone:'warn',wait:U(400,700)});
  yield OV('boxline',{text:'  - '+res+'   (forces replacement)',tone:'err',wait:U(500,900)});
  yield THINK();
  yield L('that destroy line is intentional — blue/green swap, the green instance is already healthy','warn',{wait:U(800,1500)});
  const steps=['refreshing state','creating '+res.replace(/\.\w+$/,'.green'),'shifting traffic weights','destroying '+res,'committing state'];
  for(let i=0;i<steps.length;i++) yield OV('bar',{frac:(i+1)/steps.length,label:steps[i],wait:U(250,550)});
  yield OV('boxline',{text:'Apply complete! Resources: '+add+' added, '+chg+' changed, '+del+' destroyed.',tone:'ok',wait:U(400,800)});
  beep('deploy');
  yield CNT('deploys',1);
  yield OV('close',{wait:U(700,1200)});
}
function* dPostmortem(){
  const svc=pick(['api-gateway','checkout','payments','auth','search','ingest','ledger']);
  const sev=pick(['SEV-2','SEV-2','SEV-3']);
  const dur=ri(6,47), mttr=ri(4,22);
  const rc=pick(['a missing happens-before edge let two writers race','a cache stampede right after the deploy','an unbounded retry storm saturated the pool','a stale read slipped past the fence','a thundering herd hit a cold cache','a clock skew tripped the lease renewal']);
  yield OV('open',{type:'box'});
  yield OV('box',{title:'⛑ POSTMORTEM · '+sev+' · '+svc,variant:'context',wait:U(250,500)});
  yield OV('boxline',{text:'Impact: '+dur+'m degraded · '+grp(ri(2000,90000))+' requests affected',tone:'warn',wait:U(350,650)});
  yield OV('boxline',{text:'Timeline: detect '+ri(1,4)+'m → mitigate '+ri(2,9)+'m → resolve '+mttr+'m',tone:'dim',wait:U(350,650)});
  yield OV('boxline',{text:'Root cause: '+rc,tone:'fg',wait:U(400,800)});
  yield OV('boxline',{text:'Action items',tone:'accent',wait:U(250,500)});
  const items=shuffle(['add a regression test pinning the invariant','add a circuit breaker with jittered backoff','alert on the leading indicator','write a runbook + dashboard','backfill the missing fence','load-test the cold path']);
  for(let i=0;i<3;i++) yield OV('boxline',{text:'  ☐ '+items[i]+' · @'+pick(AGENTS),tone:'dim',wait:U(250,500)});
  yield OV('boxline',{text:'Blameless: the system let this happen, not a person ✔',tone:'ok',wait:U(500,900)});
  yield OV('close',{wait:U(1100,1700)});
}
function* dChatter(){
  const a=cfg.agent, b=pick(CODENAMES.filter(c=>c!==a))||'ORION';
  const topic=pick(['the retry backoff','the lock ordering','the cache TTL','the migration plan','the API contract','the rollout strategy','the index choice']);
  const pr=ri(120,9999);
  yield L('▌ '+a+' ⇄ '+b+' — multi-agent review','accent',{wait:U(400,800)});
  yield L(a+': PR #'+pr+' is up — can you review '+topic+'?','dim',{wait:U(500,1000)});
  yield L(b+': looking… I’d push back on '+pick(['the unbounded retry','the global lock','the 5m TTL','the in-place migration','the Seq Scan']),'warn',{wait:U(700,1300)});
  yield THINK();
  yield L(a+': fair — '+rethink(),'dim',{wait:U(600,1200)});
  yield L(b+': '+pick(['ship it with a jittered backoff','gate it behind a flag','add a fence and we’re good','split it into two PRs','LGTM once tests are green']),'dim',{wait:U(600,1200)});
  yield L('✔ consensus reached — '+b+' approved PR #'+pr+' · merging','ok',{wait:U(500,1000)});
  yield CNT('commits',1);
}
function* dPager(){
  const min=ri(10,55), sec=String(ri(10,59)).padStart(2,'0');
  const sev=pick(['P1','P1','P2']), ackS=ri(8,40), mttr=ri(4,9);
  const svc=pick(['api-gateway','checkout','auth','payments','ingest','search']);
  yield OV('open',{type:'anomaly'});
  yield OV('banner',{cls:'err pulse',text:'📟 PAGE · '+sev+' · 03:'+String(min).padStart(2,'0')+':'+sec+' — '+svc+' error budget exhausted',wait:U(400,700)});
  beep('alert');
  yield L('▌ Ack’d in '+ackS+'s — the agent never sleeps','accent',{wait:U(600,1100)});
  yield TOOL('Bash','kubectl logs -l app='+svc+' --since=10m | grep -iE "5..|error" | tail');
  yield OUT(grp(ri(400,9000))+' errors in 10m · onset 03:'+String(min).padStart(2,'0'),'dim',{burst:true,more:ri(14,90)});
  yield THINK();
  yield L(rethink(),'warn',{wait:U(800,1500)});
  yield TOOL('Edit',pick(FILES));
  yield DIFF('+',pick(FIX),{wait:U(60,160)});
  yield OUT('hotfix rolling out · watching the error budget recover','dim',{burst:true});
  yield WAIT(U(900,1400));
  yield OV('banner',{cls:'ok',text:'✓ RESOLVED · 03:'+String((min+mttr)%60).padStart(2,'0')+' · MTTR '+mttr+'m · 0 customer impact',wait:U(700,1300)});
  beep('ok');
  yield L('✔ page resolved · '+svc+' back under SLO · postmortem auto-drafted','ok',{wait:U(600,1100)});
  yield CNT('incidents',1);
  yield OV('close',{wait:U(600,1000)});
  if(rng()<0.5 && dramaQ.length<3) dramaQ.push(dPostmortem);   // the page often spawns the postmortem
}
// the agent royally screws up. inverts the house style: act confidently, declare ✔, THEN read the command.
function* dOops(){
  // each scenario: a confident destructive command, the success line it brags about, the bug it ignored, the unit lost
  const S=pick([
    {cmd:'psql -h prod-db-01 -c "DELETE FROM events WHERE ts < \'$CUTOFF\'"',ok:n=>'DELETE '+grp(n),
     unit:'rows',bug:'$CUTOFF was never exported — the predicate evaluated to ts < \'\' → every row matched',n:()=>ri(2_400_000,48_000_000)},
    {cmd:'psql -h prod-db-01 -c "TRUNCATE users CASCADE"',ok:n=>'TRUNCATE TABLE',
     unit:'rows',bug:'CASCADE walked 11 foreign keys — sessions, orders, invoices all went with it',n:()=>ri(900_000,12_000_000)},
    {cmd:'rm -rf "$DATA_DIR/"',ok:_=>'',
     unit:'files',bug:'$DATA_DIR was unset on the prod box — `rm -rf "/"` started at the root mount',n:()=>ri(1_200_000,9_400_000)},
    {cmd:'kubectl delete ns prod --wait=false',ok:_=>'namespace "prod" deleted',
     unit:'pods',bug:'kubectx still pointed at prod — I read it as staging and never checked',n:()=>ri(180,2400)},
  ]);
  const lost=S.n();
  yield OV('open',{type:'box'});
  yield OV('box',{title:'⏵ cleanup · reclaiming space',variant:'context',wait:U(200,400)});  // looks routine — turns red only on the reveal
  yield TOOL('Bash',S.cmd);
  if(S.ok(lost)) yield OUT(S.ok(lost),'dim',{wait:U(350,650)});
  yield OV('boxline',{text:'✔ done — reclaimed '+ri(28,61)+'% · table bloat gone',tone:'ok',wait:U(450,800)});  // the brag, one beat too early
  yield WAIT(U(500,900));
  // the pause — it re-reads its own command AFTER declaring victory. this is the whole joke.
  yield THINK();
  yield L('wait.','warn',{wait:U(600,1100)});
  beep('alert');
  yield TOOL('Read',pick(['scripts/cleanup.sh','ops/prune.sh','Makefile','~/.kube/config']));
  yield L(S.bug,'err',{wait:U(900,1600)});
  yield OV('retitle',{title:'⛔ SEV-1 · DATA LOSS · '+pick(['api-gateway','checkout','payments','ledger','core-db']),variant:'incident',wait:U(250,500)});
  yield OV('boxline',{text:grp(lost)+' '+S.unit+' gone · production · no dry-run',tone:'err',wait:U(400,800)});
  // blast radius: the backup you were counting on isn't there
  const back=pick([
    'last snapshot '+ri(9,19)+'h old · PITR window starts 40m after the delete',
    'nightly backup job has been failing silently since '+pick(['Feb','Mar','Apr'])+' — no one watched the alert',
    'the replica already replayed the write · it is just as empty as the primary',
  ]);
  yield OV('boxline',{text:'⚠ '+back,tone:'warn',wait:U(700,1300)});
  yield THINK();
  // the reckoning — the dial. partial save / blame-deflection / cover-up, picked for tonal variety
  const r=rng();
  if(r<0.45){
    const ok=ri(82,97), gap=ri(11,58);
    const steps=['promoting standby '+hash(),'replaying WAL to T-'+gap+'m','reconciling sequences','reopening writes'];
    for(let i=0;i<steps.length;i++) yield OV('bar',{frac:(i+1)/steps.length,label:steps[i],wait:U(260,540)});
    yield OV('boxline',{text:'restored '+ok+'% · '+gap+'m of writes unrecoverable · SEV-1 filed',tone:'warn',wait:U(500,900)});
    beep('ok');
  } else if(r<0.78){
    yield L('root cause: the script should have required --confirm. adding a guard so this can\'t recur.','dim',{wait:U(900,1500)});
    yield TOOL('Edit',pick(['scripts/cleanup.sh','ops/prune.sh']));
    yield DIFF('+','if [ -z "$CUTOFF" ]; then echo "refusing: empty predicate" && exit 1; fi',{wait:U(80,180)});
    yield OV('boxline',{text:'guard added ✔ · postmortem auto-drafted · blameless',tone:'ok',wait:U(500,900)});  // learned the wrong lesson, back to flexing
    beep('ok');
  } else {
    yield L('checked the dashboards — traffic looks nominal.','dim',{wait:U(800,1400)});
    yield OV('boxline',{text:'no customer-facing impact detected',tone:'dim',wait:U(600,1100)});  // the text and the rowcount disagree
    yield OV('boxline',{text:'closing the incident · moving on',tone:'dim',wait:U(500,900)});
  }
  yield CNT('incidents',1);
  yield OV('close',{wait:U(900,1500)});
}
