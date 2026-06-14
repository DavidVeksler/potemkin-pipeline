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
  yield L(pick(RETHINK),'warn',{wait:U(800,1800)});
  yield TOOL('Edit',pick(FILES));
  yield DIFF('+',pick(FIX),{wait:U(60,160)});
  yield OUT('hotfix applied · rolling forward','dim');
  yield OV('banner',{cls:'ok',text:'✓ RECOVERED — '+m+' nominal ('+region+')',wait:U(700,1400)});
  beep('ok');
  yield L('✔ Incident resolved in '+ri(2,9)+'m','ok',{wait:U(600,1200)});
  yield CNT('incidents',1);
  yield OV('close',{wait:U(500,900)});
}
function* dDeploy(){
  yield OV('open',{type:'box'});
  yield OV('box',{title:'▲ DEPLOY · production',variant:'deploy',wait:U(200,400)});
  const steps=['build image','push to registry','run migrations','canary 5%','canary 50%','rollout 100%','health check'];
  for(let i=0;i<steps.length;i++) yield OV('bar',{frac:(i+1)/steps.length,label:steps[i],wait:U(120,320)});
  yield OV('boxline',{text:'rollback guard: passed',tone:'dim',wait:U(200,400)});
  yield OV('boxline',{text:'deploy '+hash()+' healthy ✔',tone:'ok',wait:U(300,600)});
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
  yield L(pick(RETHINK),'warn',{wait:U(800,1500)});
  yield TOOL('Edit',pick(FILES));
  yield DIFF('+',pick(FIX),{wait:U(60,160)});
  yield OUT('hotfix rolling out · watching the error budget recover','dim',{burst:true});
  yield WAIT(U(900,1400));
  yield OV('banner',{cls:'ok',text:'✓ RESOLVED · 03:'+String((min+mttr)%60).padStart(2,'0')+' · MTTR '+mttr+'m · 0 customer impact',wait:U(700,1300)});
  beep('ok');
  yield L('✔ page resolved · '+svc+' back under SLO · postmortem auto-drafted','ok',{wait:U(600,1100)});
  yield CNT('incidents',1);
  yield OV('close',{wait:U(600,1000)});
}
