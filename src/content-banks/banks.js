/* ====================================================================== */
/* BANKS                                                                   */
/* ====================================================================== */
const VERBS=['Analyzing','Refactoring','Patching','Vectorizing','Quantizing','Transpiling','Reconciling','Provisioning','Orchestrating','Hydrating','Memoizing','Backpropagating','Defragmenting','Serializing','Deserializing','Sharding','Rebalancing','Hot-swapping','Recompiling','Profiling','Instrumenting','Tracing','Bisecting','Rebasing','Distilling','Annealing','Coalescing','Marshalling','Unrolling','Inlining','Hoisting','Snapshotting','Replaying','Normalizing','Denormalizing','Pruning','Materializing','Linearizing','Tokenizing','Diffing','Reindexing','Compacting','Throttling','Debouncing','Fuzzing','Hardening','Auditing','Garbage-collecting','Prefetching','Warming'];
const SUBS=['the dependency graph','the semantic embedding layer','the async boundary','the OAuth2 handshake','the Kubernetes ingress controller','the payment-orchestrator service','the transformer attention heads','the vector index','the write-ahead log','the consensus quorum','the gossip membership protocol','the service-mesh sidecar','the gRPC bidirectional stream','the protobuf schema registry','the GraphQL resolver chain','the Redis eviction policy','the connection pool','the circuit breaker','the bloom filter','the LRU cache tier','the event-sourcing projection','the saga compensation handler','the idempotency keystore','the distributed lock manager','the Raft leader election','the CRDT merge function','the Merkle proof tree','the hash ring','the rate-limiter token bucket','the feature-flag evaluator','the JIT trace cache','the WASM sandbox','the TLS session resumption','the columnar storage engine','the query planner','the join optimizer','the speculative-decoding pipeline','the KV-cache allocator','the gradient checkpointing pass','the tensor-parallel shards','the retry-with-jitter policy','the dead-letter queue','the schema-migration runner','the blue-green cutover','the canary analysis window','the OpenTelemetry span exporter','the eBPF probe','the cgroup memory limiter','the NUMA affinity map','the zero-copy ring buffer'];
const QUALS=['(loss Δ 0.0031)','(p99 −34%)','(cache hit 0.992)','(entropy 7.41 bits)','(99.997% confidence)','(int8 precision)','(zero-copy)','(lock-free)','(O(log n) amortized)','(12.4× speedup)','(memory −18%)','(no regressions)','(idempotent)','(eventually consistent)','(linearizable)','(CVSS 9.1)','(EWMA-smoothed)','(backoff capped 30s)','(quorum=3)','(RF=3)','(cold-start 142ms)','(warm 4ms)','(saturation 0.61)','(skew corrected)'];
const UNITS=['nodes','edges','shards','partitions','embeddings','vectors','spans','traces','segments','regions','replicas','tokens','files','symbols','call sites','hot paths','allocations'];
/* FILES is procedurally generated per seed by genFiles() at init; this is the fallback. */
let FILES=['src/core/orchestrator.ts','src/payment/saga.ts','lib/auth/session.go','pkg/consensus/raft.rs','internal/cache/lru.py','services/billing/ledger.cs','src/api/resolvers/account.graphql','infra/k8s/ingress.yaml','src/model/attention.py','src/vector/index.rs','db/migrations/0042_add_idx.sql','src/net/circuit_breaker.ts','pkg/crdt/merge.go','src/observability/spans.ts'];
/* seeded repo-layout generator: same seed → same tree, so a shared link reproduces the exact file structure */
const STACKS=[
  {ext:'ts', roots:['src','lib','packages','apps'], cfg:['package.json','tsconfig.json']},
  {ext:'go', roots:['cmd','internal','pkg'],         cfg:['go.mod','go.sum']},
  {ext:'rs', roots:['src','crates'],                 cfg:['Cargo.toml']},
  {ext:'py', roots:['src','app','services'],          cfg:['pyproject.toml']}
];
const DOMAINS=['core','auth','payment','billing','cache','vector','model','consensus','net','observability','gateway','scheduler','worker','ingest','stream','store','index','registry','resolver','session','ledger','saga','queue','router','broker','pipeline','sandbox','telemetry','ratelimit','search','sync'];
const BASES=['orchestrator','handler','service','client','server','manager','pool','store','index','router','resolver','schema','worker','scheduler','dispatcher','codec','parser','validator','middleware','registry','factory','adapter','gateway','controller','repository','serializer','allocator','reconciler','planner','executor'];
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=(rng()*(i+1))|0;const t=a[i];a[i]=a[j];a[j]=t;}return a;}
function genFiles(){
  const st=pick(STACKS), head=[];
  st.cfg.forEach(f=>head.push(f));

  if(rng()<0.75) head.push('README.md');
  if(rng()<0.35) head.push('docs/adr/'+String(ri(1,12)).padStart(4,'0')+'-'+pick(['agent-runtime','event-contracts','service-boundaries','vector-search','observability-strategy'])+'.md');
  if(rng()<0.28) head.push('Dockerfile');
  if(rng()<0.22) head.push('Makefile');

  const k8s=['ingress','deployment','service','hpa','serviceaccount','configmap','secret-provider','poddisruptionbudget','networkpolicy','canary-rollout'];
  const tf=['service_mesh','private_link','redis_cluster','postgres_replica','key_vault','log_analytics','container_registry','managed_identity'];
  const helm=['values-dev','values-qa','values-prod','chart'];

  head.push('infra/k8s/'+pick(k8s)+'.yaml');
  if(rng()<0.55) head.push('infra/k8s/'+pick(k8s)+'.yaml');
  if(rng()<0.45) head.push('infra/terraform/'+pick(tf)+'.tf');
  if(rng()<0.35) head.push('infra/helm/'+pick(helm)+'.yaml');

  const migrations=[
    'add_idx',
    'alter_ledger',
    'init_schema',
    'backfill',
    'partition_events',
    'add_covering_index',
    'backfill_embeddings',
    'materialize_projection',
    'add_audit_columns',
    'rebuild_vector_index',
    'normalize_idempotency_keys',
    'add_workflow_state'
  ];

  head.push('db/migrations/'+String(ri(1,99)).padStart(4,'0')+'_'+pick(migrations)+'.sql');
  if(rng()<0.45) head.push('db/migrations/'+String(ri(100,199)).padStart(4,'0')+'_'+pick(migrations)+'.sql');
  if(rng()<0.32) head.push('db/projections/'+pick(['account_balance','workflow_state','usage_rollup','reconciliation_window','tenant_limits'])+'.sql');

  if(rng()<0.55) head.push('.github/workflows/'+pick(['ci','release','canary','security-scan','nightly-replay'])+'.yaml');

  const roots=shuffle(st.roots.slice()).slice(0,ri(2,Math.min(4,st.roots.length)));
  const doms=shuffle(DOMAINS.slice());
  const subdirs=['internal','impl','v2','util','adapters','ports','runtime','events','policies','contracts','workers','projectors','middleware'];
  const suffixes=['','_test','_spec','_bench','_fixture'];

  const budget=ri(22,34), src=[];
  let di=0, guard=0;

  while(src.length<budget && guard++<500){
    const r=pick(roots), dom=doms[di++%doms.length];
    const sub=rng()<0.34?'/'+pick(subdirs):'';
    const base=pick(BASES);
    const suffix=rng()<0.18?pick(suffixes):'';
    const path=r+'/'+dom+sub+'/'+base+suffix+'.'+st.ext;
    if(!src.includes(path)) src.push(path);
  }

  if(rng()<0.45) src.push('proto/'+pick(['runtime','events','payment','telemetry','workflow'])+'/v'+ri(1,3)+'/'+pick(['executor','envelope','ledger','span','command','checkpoint'])+'.proto');
  if(rng()<0.35) src.push('workers/'+pick(['ingest','scheduler','replay','compaction','embedding'])+'/'+pick(['consumer','lease_renewer','dead_letter_replay','shard_balancer','batch_writer'])+'.'+st.ext);
  if(rng()<0.28) src.push('wasm/sandbox/'+pick(['capability_filter','fuel_meter','syscall_proxy','policy_vm'])+'.rs');

  return [...new Set(head.concat(src))];
}
/* a plausible new path inside an existing source dir — seeded, so a run reproduces */
function newFilePath(){
  const src=FILES.filter(p=>/\.(ts|go|rs|py|cs)$/.test(p)); if(!src.length)return null;
  const base=pick(src), dir=base.replace(/\/[^/]*$/,''), ext=base.split('.').pop();
  for(let i=0;i<8;i++){ const p=dir+'/'+pick(BASES)+'.'+ext; if(!FILES.includes(p))return p; }
  return null;
}
const ADD=['acquire distributed lock before debit',"await pool.withTransaction(tx => …)","retry({ attempts: 5, backoff: 'exp', jitter: true })",'assert invariant: sum(entries) == ledger.total','if (!idempotencyKey) throw new ConflictError()','span.setStatus(OK); span.end()','memoize via WeakMap keyed on request id','guard against negative TTL','debounce flush on 16ms frame boundary','coalesce duplicate in-flight requests','pin connection to primary during write','emit OTEL span for slow path','batch writes behind a bounded channel','add compare-and-swap on the counter'];
const DEL=['balance -= amount            // race under concurrency','O(n²) nested scan','synchronous fs.readFileSync on hot path','unbounded retry without backoff','mutate shared state without lock','swallow error silently','blocking call inside event loop','double-counted on retry'];
const FIX=['acquire distributed lock before debit','add idempotency key to retry path','fence stale read with version check','reorder lock acquisition to avoid deadlock','guard empty batch before flush','wrap debit + credit in one transaction','clamp TTL to non-negative','use compare-and-swap on the counter','add backoff with jitter to retry loop','hold read-lock across the projection rebuild'];
const RETHINK=["Hmm — that's not right.","Wait, there's a race on concurrent writes.","The invariant doesn't hold under partition.","Off-by-one in the boundary condition.","This allocates on the hot path — reconsidering.","The lock ordering can deadlock. Reordering.","That regression came from the cache. Reverting.","Edge case: empty batch slips through.","The retry isn't idempotent. Adding a key.","Stale read — need a fence here."];
/* agent-voiced second-guess: ~half the time a profile-flavored line, else the shared bank (#5) */
function rethink(){ return (agentProfile.rethink.length && rng()<0.5) ? pick(agentProfile.rethink) : pick(RETHINK); }
const DIAG=['Root cause: two writers, no fence.','Reproduced locally under -race.','Bisected to the cache layer change.','Confirmed: missing happens-before edge.','Narrowed to the compensation path.','Trace shows duplicate delivery.'];
const ASSERT=['assertion failed: balance != expected','expected 200 OK, got 500','timeout after 5000ms waiting for lock','AssertionError: sum(entries) != ledger.total','panic: nil map write','FAIL: data race detected on shared counter','expected idempotent retry, got duplicate','deadlock: goroutine 41 stuck on mu.Lock'];
const TOOLS=['Bash','Bash','Bash','Read','Read','Read','Edit','Edit','Write','Grep','Glob','WebFetch','Task','MultiEdit'];
const TESTCMDS=['npm run test:integration','pytest -q','cargo test','go test ./...','npm run test','jest --ci','vitest run','go test -race ./...'];
const DEPLOYCMDS=['docker compose up -d','terraform plan','kubectl rollout status deploy/api','gh pr checks','cargo build --release'];
/* deploy flavors: dDeploy picks one per run so the rollout isn't always the same 7 stages */
const DEPLOY_FLAVORS=[
  {title:'▲ DEPLOY · production',   steps:['build image','scan layers','push to registry','run migrations','canary 5%','canary 50%','rollout 100%','health check']},
  {title:'λ DEPLOY · functions',    steps:['bundle artifact','upload to S3','publish version','shift alias 10%','shift alias 50%','shift alias 100%','warm pool','health check']},
  {title:'◈ DEPLOY · edge',         steps:['build bundle','upload assets','invalidate CDN','propagate POPs','purge cache','verify 200s']},
  {title:'⎈ DEPLOY · kubernetes',   steps:['build image','push to registry','apply manifests','rolling update','readiness probes','rollout status']},
  {title:'⛁ DEPLOY · schema',       steps:['advisory lock','add column (nullable)','backfill rows','add NOT NULL','swap table','drop shadow']}
];
const RETRY_REASONS=['network','registry 5xx','rate limited','lock timeout','TLS handshake','transient 503','connection reset'];
const DEPLOY_FAILS=['error rate 0.3% → 4.1% on canary','p99 latency 84ms → 1,920ms','readiness probe failing on 3/5 pods','5xx spiking in us-east-1','health check timed out','memory climbing toward OOM','SLO error budget burning hot'];
// success tails for the inline mission deploy — $ is replaced with the deploy hash
const DEPLOY_DONE=['deploy $ healthy ✔','promoted to prod · 0 err over 5m bake ✔','blue→green cutover complete · old fleet drained ✔','rollout $ · 100% traffic · p99 nominal ✔','release $ pinned · rollback armed ✔','shipped $ · SLO budget intact ✔'];
const GLOBS=['**/*.ts','src/**/*.go','**/*.rs','**/*.py','pkg/**/*.go','**/*.sql','infra/**/*.yaml','src/**/*.tsx'];
const GREPS=['TODO|FIXME','acquireLock','withTransaction','idempotencyKey','panic\\(','unsafe','SELECT .* FROM','retry\\(','await '];
const MODULES=['auth','cache','ledger','raft','mesh','index','queue','planner','session','billing','gossip','router','saga','quorum'];
const PKGS=['libssl','openssl','log4j-core','lodash','axios','protobuf-runtime','jackson-databind','urllib3','glibc','curl','zlib','xz-utils'];
const CVSS=['7.1','7.5','8.2','8.8','9.1','9.8','9.8','8.8','9.1'];
const METRICS=[['p99 latency','down','ms'],['tail latency','down','ms'],['error rate','down','%'],['memory RSS','down','MB'],['GC pause','down','ms'],['cold-start','down','ms'],['lock contention','down','%'],['allocation rate','down','/s'],['throughput','up','rps']];
const AGENTS=['scout','mason','auditor','scribe','sentry','runner','forge','probe','warden','drake'];
const SUBTASKS=['audit auth flow','migrate config schema','dedupe utils','port tests to vitest','tighten error types','inline hot path','purge dead exports','wire feature flags','harden input validation','backfill migrations','split god module','vendor lockfile'];
const TASKBANK=['map the dependency multiverse', 'model every reachable code path', 'war-game all failure modes', 'interrogate the call graph', 'exhume the legacy core', 'triangulate the root cause', 'enumerate every edge case', 'out-think the race condition', 'prove correctness by exhaustion', 'consult the changelog oracle', 'vaporize a decade of tech debt', 'flatten the abstraction tower', 'negotiate with the type checker', 'reverse local entropy', 'decompile original intent', 'audit the full blast radius', 'achieve total observability', 'rewrite physics in the hot path', 'tame the monorepo', 'summon the missing invariant', 'bend the latency curve', 'unify all microservices', 'defeat the heisenbug', 'sharpen Occam\'s razor', 'collapse the state-space', 'stabilize the control plane', 'reconcile intent with implementation', 'extract the hidden contract', 'linearize the failure domain', 'bound the blast radius', 'isolate the causality chain', 'compress the incident surface', 'pin the moving target', 'trace the invariant through time', 'separate signal from ceremony', 'normalize the edge-case lattice', 'reduce the entropy gradient', 'hydrate the execution context', 'resolve semantic drift', 'partition the risk surface', 'harden the retry boundary', 'eliminate phantom coupling', 'reconstruct the decision graph', 'stabilize the async frontier', 'collapse duplicate realities', 'tighten the feedback loop', 'defragment the control flow', 'align the data plane', 'derive the missing precondition', 'replay the failure timeline', 'invert the dependency pyramid', 'compile the architecture diagram', 'minimize the inconsistency window', 'interrogate the rollback path', 'materialize the implicit schema', 'seal the abstraction leak', 'audit the trust boundary', 'restore causal ordering', 'quarantine the undefined behavior', 'prove the happy path exists', 'route around legacy gravity', 'stabilize the hot shard', 'factor the god object', 'deduplicate the failure modes', 'resolve the cache paradox', 'make the fast path boring', 'force the race to reproduce', 'tighten the consistency envelope', 'extract intent from side effects', 'collapse the retry storm', 'reconcile the write path', 'audit temporal assumptions', 'constrain the scheduler', 'simplify the impossible path', 'promote the invariant to code', 'fence the stale read', 'make latency observable', 'retire the accidental protocol', 'split the ambient authority', 'stabilize the migration window', 'compress the dependency horizon', 'derive order from retries', 'recover the lost abstraction', 'make the fallback deterministic', 'resolve the projection lag', 'bound the queueing theory', 'flatten the coordination surface', 'teach the system its own shape', 'remove the load-bearing coincidence', 'make the dashboard tell the truth', 'turn suspicion into telemetry', 'extract the invariant from production', 'convert drift into signal', 'close the causality loop', 'make the system locally obvious', 'turn the edge case into a contract', 'eliminate non-deterministic confidence', 'reconcile throughput with reality', 'make the slow path confess', 'prove the outage cannot return' ];
const SCANNED=['scanned','analyzed','inspected','audited','traced'];
const FINDING=['vulnerabilities','code smells','anti-patterns','hot spots','dead branches','data races','N+1 queries','leaks'];
const DONETAIL=['no regressions','all gates green','p99 within SLO','coverage +2.1%','zero criticals','rollback verified','SLO budget intact'];

function cve(){return 'CVE-2026-'+ri(1000,9999);}
function shortName(p){const f=p.split('/').pop();return f.replace(/\.[^.]+$/,'');}

/* ---- templates ---- */
function T1(key){let s=pickNR(VERBS,'v')+' '+pickNR(SUBS,'s');if(rng()<0.4)s+=' '+pick(QUALS);return s;}
function T4(){return 'Resolving circular dependency: '+pick(MODULES)+' → '+pick(MODULES)+' → '+pick(MODULES);}
function T5(){return 'Patching '+cve()+' in '+pick(PKGS)+' (CVSS '+pick(CVSS)+')';}
function T6(){return pickNR(VERBS,'v')+' '+stripThe(pick(SUBS))+' across '+grp(ri(3000,90000))+' '+pick(UNITS);}
function T7(){return 'Building call graph: '+grp(ri(800,9000))+' nodes, '+grp(ri(2000,40000))+' edges, '+ri(3,40)+' SCCs';}
function T9(){
  const m=pick(METRICS); const pct=ri(8,52);
  if(m[1]==='up'){const before=ri(40,900);const after=Math.round(before*(1+pct/100));return m[0]+' ↑'+pct+'% ('+grp(before)+m[2]+' → '+grp(after)+m[2]+')';}
  const before=ri(120,2400);const after=Math.round(before*(1-pct/100));
  return m[0]+' ↓'+pct+'% ('+grp(before)+m[2]+' → '+grp(after)+m[2]+')';
}
function T10(){const found=ri(0,40);const res=ri(0,found);return grp(ri(50,9000))+' '+pick(UNITS)+' '+pick(SCANNED)+', '+found+' '+pick(FINDING)+' found, '+res+' resolved';}
function toolArg(t){
  if(t==='Bash')return pick(TESTCMDS.concat(DEPLOYCMDS));
  if(t==='Glob')return pick(GLOBS);
  if(t==='Grep')return pick(GREPS);
  if(t==='WebFetch')return 'https://nvd.nist.gov/vuln/detail/'+cve();
  if(t==='Task')return pick(['scan repo for races','map service boundaries','enumerate retry paths','audit lock ordering']);
  return pick(FILES);
}
function commitMsg(m){return pick(['fix: race in '+m.short,'feat: harden '+m.subject,'perf: optimize '+m.short,'fix: idempotent '+m.short+' retries','refactor: simplify '+m.subject,'fix: fence stale read in '+m.short]);}
function plur(n,w){return n+' '+w+(n===1?'':'s');}
// impact result line for a read-shaped tool — reports what the call returned, not flavor
function scanOut(t){
  if(t==='Glob')return plur(ri(3,240),'file');
  if(t==='Grep'){ const m=ri(0,80); return m===0?'No matches found':'Found '+m+' match'+(m===1?'':'es')+' in '+plur(ri(1,Math.min(m,40)),'file'); }
  return 'Read '+plur(ri(40,1200),'line');
}
