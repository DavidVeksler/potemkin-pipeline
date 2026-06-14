/* ---- boss-level: the agent pulls up an external tool's GUI ---- */
function* dGrafana(){
  yield OV('app',{tool:'grafana',title:'Grafana · '+cfg.project+' / prod',url:'grafana.internal/d/'+hash(6)});
  yield L('▌ Pulling up observability dashboard','accent',{wait:U(500,900)});
  yield WAIT(U(500,800));
  beep('alert');
  yield OV('appstep',{k:'err',state:'alert',wait:U(300,500)});
  yield OV('appstep',{k:'err-s',text:(2+ri(0,6))+'.'+ri(0,9)});
  yield L('⚠ error rate breaching SLO — investigating','err',{wait:U(700,1200)});
  yield TOOL('Bash','kubectl scale deploy/api --replicas='+ri(6,12));
  yield OUT('scaled · awaiting rollout','dim',{burst:true});
  yield WAIT(U(800,1200));
  yield OV('appstep',{k:'err',state:'ok',wait:U(300,500)});
  yield OV('appstep',{k:'err-s',text:'0.0'+ri(1,9)});
  beep('ok');
  yield L('✔ error rate back within SLO','ok',{wait:U(600,1000)});
  yield CNT('incidents',1);
  yield OV('close',{wait:U(700,1100)});
}
function* dPipeline(){
  const stages=['build','test','scan','canary','deploy'];
  yield OV('app',{tool:'pipeline',title:'CI/CD · deploy pipeline',url:'ci.internal/run/'+ri(1000,9999),stages:stages});
  yield L('▌ Pipeline triggered — release '+hash(7),'accent',{wait:U(400,700)});
  for(let i=0;i<stages.length;i++){
    yield OV('appstep',{k:i,state:'running',wait:U(150,300)});
    yield OV('appstep',{k:'log',text:'▸ '+stages[i]+' running…',wait:U(450,1000)});
    yield OV('appstep',{k:i,state:'pass',wait:U(120,260)});
  }
  yield OV('appstep',{k:'log',text:'✓ pipeline green · '+hash(7)+' live in prod',wait:U(500,800)});
  beep('deploy');
  yield CNT('deploys',1);
  yield OV('close',{wait:U(800,1200)});
}
function* dFlame(){
  yield OV('app',{tool:'flame',title:'pprof · cpu profile (30s)',url:'pprof/ui/flamegraph',rows:flameRows()});
  yield L('▌ Profiling hot path','accent',{wait:U(500,900)});
  yield OV('appstep',{k:'cap',text:'self: json.Marshal '+ri(38,59)+'% · GC pressure high',wait:U(800,1300)});
  yield L(pick(RETHINK),'warn',{wait:U(700,1400)});
  yield TOOL('Edit',pick(FILES));
  yield DIFF('+','reuse encoder via sync.Pool; drop reflection path',{wait:U(80,160)});
  yield OUT('re-profiling…','dim',{burst:true});
  yield WAIT(U(800,1200));
  yield OV('appstep',{k:'hot',cssVar:'--g',val:'1',state:'cool'});
  yield OV('appstep',{k:'cool',cssVar:'--g',val:'8'});
  yield OV('appstep',{k:'cap',text:'self: json.Marshal '+ri(6,13)+'% · '+pick(['2.9×','3.4×','4.1×'])+' faster ✔',wait:U(500,900)});
  beep('ok');
  yield L('✔ hot path optimized','ok',{wait:U(600,1000)});
  yield OV('close',{wait:U(700,1100)});
}
function* dCluster(){
  const nodes=clusterNodes(), edges=[[0,1],[0,2],[1,3],[1,5],[2,4],[2,5],[3,4]];
  yield OV('app',{tool:'cluster',title:'k9s · namespace prod',url:'',nodes:nodes,edges:edges});
  yield L('▌ Inspecting cluster topology','accent',{wait:U(500,900)});
  const v=2+ri(0,3);
  yield WAIT(U(500,800));
  beep('alert');
  yield OV('appstep',{k:'n'+v,state:'down',wait:U(300,500)});
  yield OV('appstep',{k:'cap',text:'⚠ '+nodes[v].l+' CrashLoopBackOff · 0/3 ready'});
  yield L('⚠ pod '+nodes[v].l+' unhealthy — rescheduling','err',{wait:U(700,1200)});
  yield TOOL('Bash','kubectl rollout restart deploy/'+nodes[v].l);
  yield OUT('drained node · pulling image','dim',{burst:true});
  yield WAIT(U(900,1300));
  yield OV('appstep',{k:'n'+v,state:'ok'});
  yield OV('appstep',{k:'cap',text:'✓ '+nodes[v].l+' healthy · '+ri(3,5)+'/'+ri(3,5)+' pods ready'});
  beep('ok');
  yield L('✔ service restored','ok',{wait:U(600,1000)});
  yield OV('close',{wait:U(800,1200)});
}
function* dSwarm(){
  const ag=swarmAgents(), N=ag.length;
  const victim=ri(1,N-1);            // agent-0 is the lead and never dies
  const heir=victim===1?2:1;         // who absorbs the orphaned subtree
  yield OV('app',{tool:'swarm',title:'orchestrator · '+cfg.project,url:'',agents:ag});
  yield L('▌ Task exceeds single-context budget — fanning out','accent',{wait:U(500,900)});
  yield TOOL('Task','spawn '+N+' subagents');
  // ---- spawn (staggered reveal) ----
  for(let i=0;i<N;i++){
    yield OV('appstep',{k:'a'+i,state:'spawn'});
    yield OV('appstep',{k:'a'+i+'-s',text:'spawning'});
    yield OV('appstep',{k:'cap',text:'orchestrator · '+(i+1)+'/'+N+' spawned',wait:U(120,220)});
    beep('tick');
  }
  yield L('✓ '+N+' agents live · isolated contexts','dim',{wait:U(400,700)});
  // ---- divergence (each agent advances at its own pace) ----
  const PHASES=['exploring','editing','verifying'];
  for(let r=0;r<2;r++){
    for(let i=0;i<N;i++){
      if(i===victim && r===1) continue;   // victim dies before round 2
      yield OV('appstep',{k:'a'+i,state:r?'edit':'explore'});
      yield OV('appstep',{k:'a'+i+'-s',text:PHASES[r]});
      yield OV('appstep',{k:'a'+i+'-t',text:grp(ri(2,9)*1000+ri(0,999))});
      yield OV('appstep',{k:'a'+i+'-p',cssVar:'--p',val:(r?55+ri(0,20):20+ri(0,20))+'%',wait:U(90,200)});
    }
  }
  // ---- the death ----
  beep('alert');
  yield OV('appstep',{k:'a'+victim,state:'dead'});
  yield OV('appstep',{k:'a'+victim+'-s',text:'exited · API error'});
  yield OV('appstep',{k:'a'+victim+'-p',cssVar:'--p',val:'0%'});
  yield L('⚠ '+ag[victim].id+' died mid-task — orphaning subtree','err',{wait:U(700,1200)});
  yield L('↻ redistributing '+ri(2,4)+' files to '+ag[heir].id,'warn',{wait:U(500,900)});
  yield OV('appstep',{k:'a'+heir+'-s',text:'absorbing orphan'});
  yield OV('appstep',{k:'a'+heir+'-p',cssVar:'--p',val:'40%',wait:U(600,1000)});
  // ---- reconvergence (survivors report back, rng order) ----
  const order=shuffle(ag.map((_,i)=>i).filter(i=>i!==victim));
  let back=0;
  for(const i of order){
    yield OV('appstep',{k:'a'+i,state:'done'});
    yield OV('appstep',{k:'a'+i+'-s',text:'✓ returned'});
    yield OV('appstep',{k:'a'+i+'-p',cssVar:'--p',val:'100%'});
    back++;
    yield OV('appstep',{k:'cap',text:'merging reports · '+back+'/'+(N-1)+' returned',wait:U(250,500)});
    beep('tick');
  }
  // ---- synthesis + the brag ----
  yield L(pick(['Synthesizing '+(N-1)+' reports','Merging subagent findings']),'accent',{wait:U(500,900)});
  yield OUT('dedup '+ri(2,4)+' overlapping edits · 1 conflict auto-resolved','dim',{burst:true});
  yield WAIT(U(700,1100));
  yield OV('appstep',{k:'cap',text:'✓ '+(N-1)+' agents · '+ri(18,29)+' files · '+ri(40,70)+'k tokens'});
  beep('ok');
  yield L('✔ fleet converged · '+ri(6,9)+'× faster than sequential','ok',{wait:U(600,1000)});
  yield OV('close',{wait:U(800,1200)});
}
function* dTrace(){
  const t=traceSpans();
  yield OV('app',{tool:'trace',title:'Jaeger · trace '+hash(8),url:'jaeger/trace/'+hash(8),spans:t.spans,total:t.total});
  yield L('▌ Tracing slow request path','accent',{wait:U(500,900)});
  yield OV('appstep',{k:'cap',text:'⚠ serialize.json 312ms · 64% of trace',wait:U(800,1300)});
  yield L(pick(RETHINK),'warn',{wait:U(700,1400)});
  yield TOOL('Edit',pick(FILES));
  yield DIFF('+','stream response via buffered encoder; drop deep copy',{wait:U(80,160)});
  yield OUT('replaying trace…','dim',{burst:true});
  yield WAIT(U(800,1200));
  yield OV('appstep',{k:'slow',state:'ok',cssVar:'--w',val:'9%'});
  yield OV('appstep',{k:'slow-d',text:'42ms'});
  yield OV('appstep',{k:'cap',text:'✓ serialize.json 42ms · trace 216ms · 2.2× faster',wait:U(500,900)});
  beep('ok');
  yield L('✔ tail latency cut on hot path','ok',{wait:U(600,1000)});
  yield OV('close',{wait:U(700,1100)});
}
function* dSqlPlan(){
  const d=sqlData();
  yield OV('app',{tool:'sql',title:'psql · '+cfg.project+' / prod',url:'',query:d.query,plan:d.plan});
  yield L('▌ EXPLAIN ANALYZE on slow query','accent',{wait:U(500,900)});
  yield OV('appstep',{k:'cap',text:'⚠ Seq Scan · 2,418ms · 1.2M rows scanned',wait:U(900,1400)});
  yield L('plan shows a full table scan — adding index','warn',{wait:U(700,1300)});
  yield TOOL('Bash','psql -c "CREATE INDEX CONCURRENTLY idx_orders_user ON orders(user_id)"');
  yield OUT('CREATE INDEX','dim',{burst:true});
  yield WAIT(U(800,1200));
  yield OV('appstep',{k:'scan',state:'ok',text:'      └ Index Scan using idx_orders_user  (cost=412 rows=1.2M)  ✓'});
  yield OV('appstep',{k:'cap',text:'✓ Index Scan · 14ms · 172× faster',wait:U(400,700)});
  beep('ok');
  yield L('✔ query optimized','ok',{wait:U(600,1000)});
  yield OV('close',{wait:U(700,1100)});
}
function* dLoad(){
  yield OV('app',{tool:'load',title:'k6 · load test · '+cfg.project,url:'k6.cloud/runs/'+ri(1000,9999)});
  yield L('▌ Load test — ramping virtual users','accent',{wait:U(500,900)});
  const peakVU=pick([400,500,600,800]), peakRPS=ri(9,18)*1000, peakP95=ri(62,98);
  const steps=[[0.12,0.10,0.55],[0.34,0.42,0.74],[0.65,0.73,0.9],[1,1,1]];
  for(const [fv,fr,fp] of steps){
    yield OV('appstep',{k:'vu',text:''+((peakVU*fv)|0)});
    yield OV('appstep',{k:'rps',text:compactNum((peakRPS*fr)|0)});
    yield OV('appstep',{k:'p95',text:((peakP95*fp)|0)+' ms',wait:U(450,800)});
  }
  yield OV('appstep',{k:'cap',text:'✓ '+compactNum(peakRPS)+' req/s sustained · p95 '+peakP95+'ms · 0 errors',wait:U(500,900)});
  beep('ok');
  yield L('✔ load test passed — '+compactNum(peakRPS)+' rps','ok',{wait:U(600,1000)});
  yield OV('close',{wait:U(700,1100)});
}
function* dPR(){
  const d=prData();
  yield OV('app',{tool:'pr',title:'github · PR #'+ri(120,9999),url:'github.com/'+cfg.project,prTitle:d.prTitle,branch:d.branch,files:d.files,checks:d.checks});
  yield L('▌ Opening pull request — '+d.prTitle,'accent',{wait:U(500,900)});
  for(let i=0;i<d.checks.length;i++) yield OV('appstep',{k:'c'+i,state:'pass',wait:U(250,600)});
  yield OV('appstep',{k:'merge',state:'ready',text:'✓ all checks passed · ready to merge',wait:U(400,700)});
  yield WAIT(U(400,800));
  yield OV('appstep',{k:'merge',state:'merged',text:'✓ Merged into main · '+hash(7)});
  beep('deploy');
  yield CNT('commits',1);
  yield L('✔ pull request merged','ok',{wait:U(600,1000)});
  yield OV('close',{wait:U(700,1100)});
}
function* dDocker(){
  const steps=['FROM golang:1.22-alpine','COPY go.mod go.sum ./','RUN go mod download','COPY . .',
    'RUN go build -o /bin/api','FROM gcr.io/distroless/static','COPY --from=build /bin/api /','exporting layers'];
  yield OV('app',{tool:'docker',title:'docker buildx · api:'+hash(7),url:'',steps:steps});
  yield L('▌ Building container image','accent',{wait:U(400,700)});
  for(let i=0;i<steps.length;i++){
    yield OV('appstep',{k:i,state:'running',wait:U(120,260)});
    yield OV('appstep',{k:i+'-t',text:i===0?'CACHED':U(0.2,4.2).toFixed(1)+'s',wait:U(280,800)});
    yield OV('appstep',{k:i,state:'done'});
  }
  yield OV('appstep',{k:'cap',text:'✓ pushed api · '+ri(18,52)+'MB · '+ri(22,58)+'s',wait:U(400,700)});
  beep('deploy');
  yield CNT('deploys',1);
  yield L('✔ image built & pushed to registry','ok',{wait:U(600,1000)});
  yield OV('close',{wait:U(700,1100)});
}
function* dBtop(){
  const vn=pick(['rustc','clang','cargo','go build','ld','java','python3','ffmpeg','spark-executor','node']);
  const host=pick(['prod-core','edge-gw','vault','db-primary','mythos'])+'-'+String(ri(1,9)).padStart(2,'0');
  const pid=ri(10000,99999), ncore=ri(3,5);
  yield OV('app',{tool:'btop',title:'btop · '+host,url:'',villain:{name:vn,pid:pid},peg:ncore});
  yield L('▌ Pulling up btop — host feels sluggish','accent',{wait:U(900,1400)});
  yield WAIT(U(1000,1500));
  beep('alert');
  yield OV('btopfx',{phase:'spike'});
  yield L('⚠ runaway '+vn+' (pid '+pid+') pinning '+ncore+' cores at 99%','err',{wait:U(1000,1600)});
  yield THINK();
  yield L(pick(RETHINK),'warn',{wait:U(800,1500)});
  yield TOOL('Bash','kill -9 '+pid);
  yield OUT('SIGKILL sent · reaping process','dim',{burst:true});
  yield WAIT(U(1000,1500));
  yield OV('btopfx',{phase:'recover'});
  beep('ok');
  yield L('✔ reclaimed '+ncore+' cores · load avg falling','ok',{wait:U(1000,1600)});
  yield CNT('incidents',1);
  yield WAIT(U(1400,2000));
  yield OV('close',{wait:U(700,1100)});
}
function* dOom(){
  const vn=pick(['java','python3','node','gunicorn','postgres','spark-executor','clickhouse','jvm-worker']);
  const host=pick(['prod-core','cache','db-primary','worker','mythos'])+'-'+String(ri(1,9)).padStart(2,'0');
  const pid=ri(10000,99999), gb=U(9.2,13.4).toFixed(1);
  yield OV('app',{tool:'btop',title:'btop · '+host,url:'',villain:{name:vn,pid:pid},peg:2});
  yield L('▌ Pulling up btop — memory pressure alert','accent',{wait:U(900,1400)});
  yield WAIT(U(1100,1600));
  beep('alert');
  yield OV('btopfx',{phase:'oom'});
  yield L('⚠ '+vn+' (pid '+pid+') leaking — RSS '+gb+'G, swap thrashing','err',{wait:U(1100,1700)});
  yield THINK();
  yield L(pick(['Checking the OOM score… cgroup is over its limit.','Watching swap — page-out storm, load climbing.','Memory cliff incoming, kernel will reap soon.']),'warn',{wait:U(900,1500)});
  yield WAIT(U(1000,1500));
  beep('alert');
  yield TOOL('Bash','dmesg -T | tail -3');
  yield OUT('kernel: Out of memory: Killed process '+pid+' ('+vn+') total-vm:'+ri(11,18)+'G, anon-rss:'+gb+'G','dim',{burst:true});
  yield WAIT(U(900,1400));
  yield OV('btopfx',{phase:'oomkill'});
  beep('ok');
  yield L('✔ OOM killer reaped '+vn+' · swap draining, RSS reclaimed','ok',{wait:U(1000,1600)});
  yield L(pick(['Bumped the cgroup memory.high and added a restart backoff.','Filed the leak — heap dump captured before the kill.','Memory back to baseline, pod rescheduled clean.']),'dim',{wait:U(900,1500)});
  yield CNT('incidents',1);
  yield WAIT(U(1400,2000));
  yield OV('close',{wait:U(700,1100)});
}
function* dAttack(){
  const allSrc=[[10,5],[33,5],[51,6],[46,8],[36,11],[20,13],[57,15],[48,3]];
  const sources=shuffle(allSrc.slice()).slice(0,ri(6,8));
  const tbps=U(1.4,3.8).toFixed(1), asns=ri(9,28);
  yield OV('app',{tool:'attackmap',title:'threat map · edge WAF',url:'security.internal/waf',sources:sources,target:[16,7]});
  yield L('▌ Pulling up the global threat map','accent',{wait:U(800,1200)});
  yield WAIT(U(800,1200));
  beep('alert');
  yield OV('appstep',{k:'in',text:tbps+' Tbps'});
  yield OV('appstep',{k:'cap',text:'⚠ volumetric DDoS — '+tbps+' Tbps from '+asns+' ASNs',tone:'err'});
  yield L('⚠ inbound flood — '+tbps+' Tbps across '+sources.length+' regions','err',{wait:U(900,1500)});
  yield THINK();
  yield L(pick(['Fingerprinting attack signature…','Correlating source ASNs…','Building mitigation ruleset…']),'warn',{wait:U(800,1500)});
  yield TOOL('Bash','wafctl rule deploy --action=challenge --asn '+ri(1000,9999));
  yield OUT('propagating rules to '+ri(120,420)+' edge PoPs','dim',{burst:true});
  yield WAIT(U(1000,1500));
  yield OV('appstep',{k:'arc',state:'blocked'});
  yield OV('appstep',{k:'blk',text:compactNum(ri(400000,3000000))+' rps'});
  yield OV('appstep',{k:'in',text:ri(20,90)+' Gbps'});
  yield OV('appstep',{k:'cap',text:'✓ attack mitigated · '+asns+' ASNs null-routed · origin shielded'});
  beep('ok');
  yield L('✔ DDoS absorbed at the edge — origin never saw it','ok',{wait:U(900,1500)});
  yield CNT('incidents',1);
  yield WAIT(U(1200,1800));
  yield OV('close',{wait:U(700,1100)});
}
function* dGpu(){
  const model=pick(['8× A100-80G','8× H100-80G','8× H200']);
  const host=pick(['dgx','hgx','node'])+'-'+String(ri(1,24)).padStart(2,'0');
  const hot=ri(0,7);
  yield OV('app',{tool:'gpu',title:'nvidia-smi · '+host,url:'',model:model,host:host,hot:hot});
  yield L('▌ Checking the training cluster — step times slipping','accent',{wait:U(900,1400)});
  yield WAIT(U(1100,1600));
  beep('alert');
  yield OV('livefx',{phase:'spike'});
  yield WAIT(U(1000,1500));
  yield OV('appstep',{k:'cap',text:'⚠ GPU'+hot+' thermal throttling at 89°C · throughput degraded'});
  yield L('⚠ GPU'+hot+' overheating — throttled, dragging the all-reduce','err',{wait:U(1000,1600)});
  yield THINK();
  yield L(pick(RETHINK),'warn',{wait:U(800,1500)});
  yield TOOL('Bash','kubectl drain '+host+'-gpu'+hot+' --ignore-daemonsets && scheduler reshard');
  yield OUT('migrating shard off GPU'+hot+' · rebalancing pipeline','dim',{burst:true});
  yield WAIT(U(1100,1600));
  yield OV('livefx',{phase:'recover'});
  yield OV('appstep',{k:'cap',text:'✓ GPU'+hot+' drained & cooling · shard rebalanced across 7 GPUs'});
  beep('ok');
  yield L('✔ hot GPU isolated · training throughput restored','ok',{wait:U(1000,1600)});
  yield CNT('incidents',1);
  yield WAIT(U(1200,1800));
  yield OV('close',{wait:U(700,1100)});
}
function* dMesh(){
  const nodes=meshNodes();
  const edges=[[0,1],[0,2],[1,3],[1,4],[2,5],[3,6],[4,6],[5,6]];
  const be=2, bn=3;   // edge productpage→reviews, node reviews
  yield OV('app',{tool:'mesh',title:'kiali · mesh graph · prod',url:'kiali.internal/graph',nodes:nodes,edges:edges});
  yield L('▌ Inspecting the service mesh','accent',{wait:U(700,1100)});
  yield WAIT(U(900,1400));
  beep('alert');
  yield OV('appstep',{k:'e'+be,state:'down'});
  yield OV('appstep',{k:'n'+bn,state:'down'});
  yield OV('appstep',{k:'cap',text:'⚠ '+nodes[bn].l+' 5xx '+(28+ri(0,20))+'% · circuit breaker open'});
  yield L('⚠ '+nodes[bn].l+' failing — breaker tripped, retries storming','err',{wait:U(900,1500)});
  yield THINK();
  yield L(pick(RETHINK),'warn',{wait:U(800,1500)});
  yield TOOL('Bash','istioctl apply -f outlier-detection.yaml');
  yield OUT('ejecting unhealthy endpoints · shifting traffic','dim',{burst:true});
  yield WAIT(U(1000,1500));
  yield OV('appstep',{k:'e'+be,state:'up'});
  yield OV('appstep',{k:'n'+bn,state:'up'});
  yield OV('appstep',{k:'cap',text:'✓ '+nodes[bn].l+' healthy · breaker closed · mTLS green'});
  beep('ok');
  yield L('✔ mesh recovered — traffic flowing on every edge','ok',{wait:U(900,1500)});
  yield CNT('incidents',1);
  yield WAIT(U(1000,1500));
  yield OV('close',{wait:U(700,1100)});
}
function* dHeatmap(){
  yield OV('app',{tool:'heatmap',title:'latency heatmap · gateway',url:'grafana.internal/d/'+hash(6)});
  yield L('▌ Pulling up the latency heatmap','accent',{wait:U(700,1100)});
  yield WAIT(U(1500,2100));
  beep('alert');
  yield OV('livefx',{phase:'spike'});
  const p999=grp(ri(1400,2400));
  yield WAIT(U(900,1400));
  yield OV('appstep',{k:'cap',text:'⚠ p99.9 '+p999+'ms — tail-latency blowout in the top percentiles'});
  yield L('⚠ tail latency exploding — p99.9 '+p999+'ms while p50 stays flat','err',{wait:U(1000,1600)});
  yield THINK();
  yield L(pick(RETHINK),'warn',{wait:U(800,1500)});
  yield TOOL('Edit',pick(FILES));
  yield DIFF('+','hedge slow requests after 200ms; cap tail with a deadline',{wait:U(80,160)});
  yield OUT('rolling out · watching percentiles','dim',{burst:true});
  yield WAIT(U(1500,2100));
  yield OV('livefx',{phase:'recover'});
  yield OV('appstep',{k:'cap',text:'✓ p99.9 '+ri(90,160)+'ms · tail back under SLO'});
  beep('ok');
  yield L('✔ tail latency tamed — hedging cut the long pole','ok',{wait:U(1000,1600)});
  yield CNT('incidents',1);
  yield WAIT(U(1400,2000));
  yield OV('close',{wait:U(700,1100)});
}
function* dThermal(){
  const host=pick(['rack','dgx','hgx','node'])+'-'+String(ri(1,24)).padStart(2,'0');
  const hot=ri(0,6);
  yield OV('app',{tool:'thermal',title:'thermal map · '+host,url:'',host,hot});
  yield L('▌ Pulling up the rack thermal map — the fans are screaming','accent',{wait:U(700,1100)});
  yield WAIT(U(1400,2000));
  beep('alert');
  yield OV('livefx',{phase:'spike'});
  yield WAIT(U(900,1400));
  const t=ri(91,97);
  yield OV('appstep',{k:'cap',text:'⚠ die'+hot+' '+t+'°C — thermal throttle engaged, clocks dropping'});
  yield L('⚠ a column of dies redlining at '+t+'°C — throttling, throughput sagging','err',{wait:U(1000,1600)});
  yield THINK();
  yield L(pick(RETHINK),'warn',{wait:U(800,1500)});
  yield TOOL('Bash','ipmitool raw 0x30 0x30 0x02 0xff 0x64 && nvidia-smi -pl 250');
  yield OUT('fan curve to 100% · capping power limit · migrating the hot shard','dim',{burst:true});
  yield WAIT(U(1400,2000));
  yield OV('livefx',{phase:'recover'});
  yield OV('appstep',{k:'cap',text:'✓ dies cooling · '+ri(58,68)+'°C · clocks restored across the rack'});
  beep('ok');
  yield L('✔ thermals back in band — fans spun down, no hardware throttle','ok',{wait:U(1000,1600)});
  yield CNT('incidents',1);
  yield WAIT(U(1200,1800));
  yield OV('close',{wait:U(700,1100)});
}
function* dKafka(){
  const topic=pick(['orders.v2','payments.events','clickstream','user.activity','ledger.cdc','telemetry.spans']);
  const group=pick(['checkout-consumers','billing-workers','analytics-sink','search-indexer','fraud-scoring']);
  yield OV('app',{tool:'kafka',title:'kafka · consumer lag · '+topic,url:'',topic});
  yield L('▌ Checking consumer-group lag — the sink feels behind','accent',{wait:U(700,1100)});
  yield WAIT(U(900,1400));
  beep('alert');
  yield OV('livefx',{phase:'spike'});
  yield WAIT(U(900,1400));
  const lag=ri(2,9)+'.'+ri(1,9)+'M';
  yield OV('appstep',{k:'cap',text:'⚠ '+group+' falling behind — lag past '+lag+' on '+ri(3,4)+' partitions'});
  yield L('⚠ consumer lag exploding — a few partitions stuck while the rest keep up','err',{wait:U(1000,1600)});
  yield THINK();
  yield L(pick(['A slow consumer pinned a partition — rebalancing the group.','One sink instance wedged — kicking it out of the group.','Hot-key skew on a partition — scaling consumers and reassigning.']),'warn',{wait:U(800,1500)});
  yield TOOL('Bash','kafka-consumer-groups --group '+group+' --topic '+topic+' --reset-offsets --to-latest --execute');
  yield OUT('triggering rebalance · '+ri(3,9)+' consumers · reassigning partitions','dim',{burst:true});
  yield WAIT(U(1100,1600));
  yield OV('livefx',{phase:'recover'});
  yield OV('appstep',{k:'cap',text:'✓ group rebalanced · lag draining · all partitions back under 1k'});
  beep('ok');
  yield L('✔ consumer lag drained — '+group+' caught up to the log head','ok',{wait:U(1000,1600)});
  yield CNT('incidents',1);
  yield WAIT(U(1200,1800));
  yield OV('close',{wait:U(700,1100)});
}
function* dVim(){
  const wild = idleActive && rng()<0.5;
  const file = wild?'~/.vimrc':pick(FILES);
  yield OV('app',{tool:'vim',title:'vim · '+file,url:'',file:wild?pick(FILES):file});
  yield L('▌ Dropping into the editor — '+ri(2,9)+(wild?' keybindings to optimize':' files need surgery'),'accent',{wait:U(500,900)});
  // navigate — search and jump matches
  const needle=pick(['TODO','panic(','== nil','catch','any']);
  yield OV('appstep',{k:'cmd',text:'/'+needle});
  for(let j=0;j<ri(2,4);j++){
    const row=ri(1,12);
    yield OV('appstep',{k:'cur',cssVar:'--row',val:row,wait:U(180,360)});
    yield OV('appstep',{k:'ruler',text:(row+1)+','+ri(1,30)+'   '+ri(8,80)+'%'});
    yield OV('appstep',{k:'cmd',text:'n   next match'});
  }
  // visual select + yank
  yield OV('appstep',{k:'mode',text:'-- VISUAL --',state:'visual'});
  yield OV('appstep',{k:'cmd',text:'vap   "ay'});
  yield OUT(ri(4,30)+' lines yanked to register a','dim',{wait:U(300,600)});
  // the macro — the centerpiece: counter ticks under a replaying macro
  yield OV('appstep',{k:'mode',text:'-- NORMAL --',state:'normal'});
  yield L('Recording a macro — qa … q, then @a across the buffer','warn',{wait:U(400,800)});
  const reps=ri(4,9);
  for(let i=0;i<reps;i++){
    const row=ri(0,12);
    yield OV('appstep',{k:'cur',cssVar:'--row',val:row});
    yield OV('appstep',{k:'cmd',text:'@a   ('+(i+1)+'/'+reps+')'});
    yield OV('appstep',{k:'ruler',text:(row+1)+','+ri(1,40)+'   '+ri(8,92)+'%'});
    yield DIFF(rng()<0.72?'+':'-',rng()<0.72?pick(ADD):pick(DEL),{wait:U(120,300)});
    yield CNT('lines',ri(3,40));
  }
  // the substitute — live count
  const oldT=pick(['oldLock','await ','any','== nil','retryOnce']);
  const newT=pick(['acquireLock','await guard ','unknown','=== null','retryWithJitter']);
  yield OV('appstep',{k:'mode',text:':'});
  yield OV('appstep',{k:'cmd',text:':%s/'+oldT+'/'+newT+'/gc'});
  yield OUT(grp(ri(60,4000))+' substitutions on '+ri(20,400)+' lines','dim',{burst:true});
  // reindent the whole buffer
  yield OV('appstep',{k:'cmd',text:'gg=G'});
  yield OUT('reindented buffer · '+ri(40,900)+' lines reformatted','dim',{wait:U(300,600)});
  // write + exit — the punchline is exiting vim on the first try
  const lines=ri(80,600), bytes=grp(ri(2000,40000));
  yield OV('appstep',{k:'mode',text:':'});
  yield OV('appstep',{k:'cmd',text:':wq'});
  yield OV('appstep',{k:'cmd',text:'"'+file+'" '+grp(lines)+'L, '+bytes+'B written',wait:U(300,600)});
  beep('ok');
  yield L('✔ exited vim on the first try','ok',{wait:U(700,1200)});
  yield CNT('files',1); yield CNT('lines',lines);
  yield WAIT(U(900,1400));
  yield OV('close',{wait:U(800,1200)});
}
function* dTmux(){
  const panes=[
    {name:'logs', lines:['▸ tail -f app.log','200 GET  /health   4ms','200 POST /charge  38ms','200 GET  /orders  12ms'], stat:'streaming…'},
    {name:'build',lines:['$ go build ./...','ok  api     0.4s','ok  worker  0.6s'], stat:'watching for changes'},
    {name:'htop', lines:['CPU [|||      12%]','MEM [||||     41%]','load 1.2 0.9 0.8'], stat:'12 tasks · 3 running'},
    {name:'test', lines:['$ go test ./...','ok  cache','ok  ledger'], stat:'RUN  saga…'},
  ];
  const session=(cfg.project||'core').slice(0,12);
  yield OV('app',{tool:'tmux',title:'tmux · '+session,url:'',session,panes});
  yield L('▌ Tiling the war room — logs, build, htop, tests','accent',{wait:U(600,1000)});
  yield WAIT(U(800,1200));
  beep('alert');
  const bad=3, pkg=pick(['saga','ledger','cache','quorum']);
  yield OV('appstep',{k:'p0',state:'idle'});
  yield OV('appstep',{k:'p'+bad,state:'err'});
  yield OV('appstep',{k:'p'+bad+'-s',text:'✗ FAIL '+pkg+'_test.go:'+ri(11,140)});
  yield OV('appstep',{k:'tabs',text:panes.map((p,i)=>i+':'+p.name+(i===bad?'!':'')).join('  ')});
  yield L('⚠ pane '+bad+' (test) red — Ctrl-b '+bad+' to jump','err',{wait:U(800,1300)});
  yield THINK();
  yield L(pick(RETHINK),'warn',{wait:U(700,1200)});
  yield TOOL('Edit',pick(FILES));
  yield DIFF('+',pick(FIX),{wait:U(80,160)});
  yield OUT('re-running the failing package','dim',{burst:true});
  yield WAIT(U(900,1400));
  yield OV('appstep',{k:'p'+bad,state:'ok'});
  yield OV('appstep',{k:'p'+bad+'-s',text:'✓ ok  '+pkg+'  '+U(0.2,0.9).toFixed(1)+'s'});
  yield OV('appstep',{k:'tabs',text:panes.map((p,i)=>i+':'+p.name).join('  ')});
  beep('ok');
  yield L('✔ all panes green — the war room is quiet again','ok',{wait:U(700,1200)});
  yield CNT('tests',ri(1,4));
  yield WAIT(U(1000,1500));
  yield OV('close',{wait:U(700,1100)});
}
function* dDns(){
  const sub=pick(['api','cdn','app','auth','www','edge']);
  const domain=sub+'.'+pick(['acme','globex','initech','prod-eu','vault'])+'.'+pick(['com','io','net','dev']);
  const oldIp='198.51.100.'+ri(2,250), newIp='203.0.113.'+ri(2,250);
  const resolvers=dnsResolvers();
  yield OV('app',{tool:'dns',title:'dig · '+domain,url:'',record:'A '+domain,resolvers,oldIp,newIp});
  yield L('▌ Pushed an A-record change — now waiting on the planet to agree','accent',{wait:U(600,1000)});
  for(let i=0;i<resolvers.length;i++) yield OV('appstep',{k:'r'+i+'-t',text:grp(ri(120,3600))+'s'});
  yield WAIT(U(700,1100));
  beep('alert');
  yield OV('appstep',{k:'cap',text:'⚠ STALE RECORD — half the planet still resolves '+oldIp});
  yield L('⚠ split brain — recursive resolvers cached the old IP, TTLs still draining','err',{wait:U(900,1500)});
  yield THINK();
  yield TOOL('Bash','for r in '+resolvers.slice(0,3).map(r=>r.name).join(' ')+'; do dig +short @$r '+domain+'; done');
  yield OUT('flushing recursive caches · authoritative TTL lowered to 60s','dim',{burst:true});
  yield WAIT(U(800,1200));
  const order=shuffle(resolvers.map((_,i)=>i));
  let fresh=0;
  for(const i of order){
    yield OV('appstep',{k:'r'+i,state:'fresh'});
    yield OV('appstep',{k:'r'+i+'-a',text:newIp});
    yield OV('appstep',{k:'r'+i+'-t',text:'60s'});
    fresh++;
    yield OV('appstep',{k:'cap',text:'propagating · '+fresh+'/'+resolvers.length+' resolvers fresh',wait:U(260,520)});
    beep('tick');
  }
  yield OV('appstep',{k:'cap',text:'✓ PROPAGATED — global consensus on '+newIp});
  beep('ok');
  yield L('✔ it was DNS (it is always DNS) — '+domain+' converged on '+newIp,'ok',{wait:U(800,1400)});
  yield CNT('incidents',1);
  yield WAIT(U(1000,1500));
  yield OV('close',{wait:U(700,1100)});
}
function* dChaos(){
  const nodes=meshNodes();
  const edges=[[0,1],[0,2],[1,3],[1,4],[2,5],[3,6],[4,6],[5,6]];
  const fault=pick(['kill us-east-1','drop 30% of packets','inject +400ms latency','blackhole the primary db','pause the leader for 8s']);
  const victims=shuffle([1,2,3,4,5].slice()).slice(0,ri(2,3));
  yield OV('app',{tool:'mesh',title:'litmus · game day · prod',url:'litmus.internal/experiment/'+hash(6),nodes,edges});
  yield L('▌ GAME DAY — injecting a fault on purpose to prove resilience','accent',{wait:U(700,1100)});
  yield OV('appstep',{k:'cap',text:'⚂ experiment: '+fault+' · steady-state hypothesis armed'});
  yield WAIT(U(800,1200));
  beep('alert');
  for(const v of victims) yield OV('appstep',{k:'n'+v,state:'down'});
  yield OV('appstep',{k:'cap',text:'⚠ blast radius: '+victims.length+' services degraded — breakers arming'});
  yield L('⚠ '+victims.length+' services degraded — sweating, but the circuit breakers should hold','warn',{wait:U(900,1500)});
  yield THINK();
  yield L('Fallbacks engaging — shedding load, serving from cache, retries capped with jitter','dim',{wait:U(800,1400)});
  yield TOOL('Bash','litmusctl status --experiment '+hash(6));
  yield OUT(ri(2,5)+' breakers tripped · fallbacks serving · 0 user-facing errors','dim',{burst:true});
  yield WAIT(U(900,1400));
  for(const v of victims) yield OV('appstep',{k:'n'+v,state:'up'});
  yield OV('appstep',{k:'cap',text:'✓ STEADY STATE held · 0 user-facing errors · hypothesis confirmed'});
  beep('ok');
  yield L('✔ game day passed — the system degraded gracefully and nobody noticed','ok',{wait:U(800,1400)});
  yield CNT('incidents',1);
  yield WAIT(U(1000,1500));
  yield OV('close',{wait:U(700,1100)});
}
function* dCpuheat(){
  const hot=ri(0,CPU_CORES-1);
  const host=pick(['prod-core','edge-gw','worker','api-gw','mythos'])+'-'+String(ri(1,24)).padStart(2,'0');
  yield OV('app',{tool:'cpuheat',title:'cpu by core · '+host,url:'grafana.internal/d/'+hash(6),hot});
  yield L('▌ Pulling up the per-core CPU heatmap','accent',{wait:U(700,1100)});
  yield WAIT(U(1500,2100));
  beep('alert');
  yield OV('livefx',{phase:'spike'});
  yield WAIT(U(900,1400));
  yield OV('appstep',{k:'cap',text:'⚠ core '+hot+' pinned at 100% — one thread hot, '+(CPU_CORES-1)+' cores idle'});
  yield L('⚠ core '+hot+' saturated — a thread busy-spinning while the box sits idle','err',{wait:U(1000,1600)});
  yield THINK();
  yield L(pick(RETHINK),'warn',{wait:U(800,1500)});
  yield TOOL('Edit',pick(FILES));
  yield DIFF('+','add backoff jitter to the retry loop; yield instead of spinning on the lock',{wait:U(80,160)});
  yield OUT('rolling out · watching per-core utilization','dim',{burst:true});
  yield WAIT(U(1500,2100));
  yield OV('livefx',{phase:'recover'});
  yield OV('appstep',{k:'cap',text:'✓ load spread across '+CPU_CORES+' cores · core '+hot+' back to '+ri(3,12)+'%'});
  beep('ok');
  yield L('✔ busy-loop tamed — work rebalanced, no single core pinned','ok',{wait:U(1000,1600)});
  yield CNT('incidents',1);
  yield WAIT(U(1400,2000));
  yield OV('close',{wait:U(700,1100)});
}
