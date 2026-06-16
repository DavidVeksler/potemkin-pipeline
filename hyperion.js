"use strict";
(function(){
/* ====================================================================== */
/* CONFIG                                                                  */
/* ====================================================================== */
const QS=new URLSearchParams(location.search);
const THEMES=['amber','green','cyan'];
/* ?platform= pins the repo's tech stack (file tree + code snippets) instead of the
   per-seed random pick. Aliases normalize to canonical ids matched in genFiles(). */
const PLATFORM_ALIASES={ts:'typescript',typescript:'typescript',js:'typescript',javascript:'typescript',go:'go',golang:'go',rs:'rust',rust:'rust',py:'python',python:'python',tsx:'react',react:'react'};
function qint(name,lo,hi,def){const v=parseInt(QS.get(name),10);return Number.isFinite(v)?Math.max(lo,Math.min(hi,v)):def;}
function qfloat(name,lo,hi,def){const v=parseFloat(QS.get(name));return Number.isFinite(v)?Math.max(lo,Math.min(hi,v)):def;}
const PROJECTS = [
  "sovereignty-ledger",
  "blast-radius-index",
  "intent-router",
  "causality-bus",
  "trust-fabric",
  "policy-singularity",
  "rollback-horizon",
  "containment-plane",
  "lineage-vault",
  "anomaly-foundry",
  "semantic-firewall",
  "determinism-engine",
  "drift-sentinel",
  "fallback-mesh",
  "compliance-reactor",
  "graph-of-record",
  "schema-bunker",
  "runtime-diplomacy",
  "shadow-config",
  "telemetry-cathedral",
  "cache-armistice",
  "event-horizon-log",
  "idempotency-chamber",
  "blast-door-proxy",
];
/* hyperbolic agent codenames — riffs on the rumored next-gen model mythos
   (OpenAI Orion/Strawberry/Q*, xAI Colossus/Aurora, Gemini Ultra, Claude's mythos/fable …)
   plus the cosmic/mythic grandiosity the genre demands. One is picked per seed at load. */
const CODENAMES = [
  "CURSOR-X",
  "NOVA",
  "FLUX",
  "VECTOR",
  "KERNEL",
  "RELAY",
  "PRISM",
  "ORBIT",
  "FORGE",
  "PILOT",
];
/* preset "vibes" — one shareable ?vibe= link bundles seed + pacing + drama-weighting.
   bias[] scenes are favored by the scheduler; seed pins a curated run. */
/* seeds are curated by tools/seed-search.js (exhaustive over all 2^32): each naturally yields
   a codename whose temperament reinforces the vibe's scene bias, an on-theme project, AND
   footer counters (files/lines/tests/cves) that fit the scenario — all from rng draws 1..6,
   the only seed-derived state reproducible before the first frame (no overrides). */
/* open/openAt: each vibe fires a relevant signature scene within seconds — instant
   feedback that the setting took (deploy=shipping, rebase=migration, anomaly=SEV). */
const VIBES={
  'startup-crunch':       {speed:1.4, freq:1.9, seed:2780268862, theme:'amber', model:'mythos-5-turbo',    label:'SPRINT',    open:'deploy',  openAt:7000, bias:['deploy','pipeline','pr','vim','tmux','swarm','chatter','docker']},        // → CURSOR-X / intent-router; lean repo (97 files·132k·2238 tests·2 CVEs); ships ~7s in
  'enterprise-migration': {speed:0.8, freq:0.7, seed:52007438,   theme:'cyan',  model:'mythos-4-stable',   label:'MIGRATION', open:'rebase',  openAt:9000, bias:['rebase','octopus','sql','terraform','docker','cluster','mergeconflict','cherrypick']}, // → FORGE / compliance-reactor; huge legacy (245 files·585k·2298 tests); migration ~9s in
  'security-incident':    {speed:1.2, freq:2.3, seed:132965288,  theme:'green', model:'mythos-5-hardened', label:'SEV-1',     open:'anomaly', openAt:6000, bias:['attackmap','security','auth','filterrepo','pager','anomaly','dns','postmortem']}, // → PILOT / blast-radius-index; CVE storm (12 CVEs, under-tested); SEV detected ~6s in
};
const VIBE = VIBES[QS.get('vibe')] || null;
/* agent temperaments — a codename isn't just a label, it's a behavioral profile.
   bias[] tilts scene probability; rethink[] colors the agent's voice; boot opens
   the first ticket. Codenames without an entry (NOVA/FLUX/VECTOR/ORBIT) and any custom
   ?agent= fall back to NEUTRAL_PROFILE. Seed-derived → deterministic per seed. */
const AGENT_PROFILES={
  'KERNEL':  {boot:'low-level mode — syscalls, perf, and the kernel are the whole job',
    bias:['btop','oom','cpuheat','flame','gpu','thermal'],
    rethink:['That syscall is on the hot path — going lock-free.','Cache-miss storm — repacking the struct for locality.','This allocates every frame. Pooling it.','Branch misprediction here — making it branchless.']},
  'PRISM':   {boot:'observability-first — if it isn’t traced, it didn’t happen',
    bias:['grafana','trace','heatmap','anomaly','sql','pager'],
    rethink:['The trace says otherwise — re-reading the span tree.','p99 hides the truth; checking p99.9.','Correlating the metric with the deploy marker.','No span for this path — instrumenting it first.']},
  'FORGE':   {boot:'move fast — edit, commit, ship, repeat',
    bias:['deploy','pipeline','pr','docker','rebase','octopus','terraform'],
    rethink:['Good enough — shipping it behind a flag.','Reverting and re-forging from main.','Force-pushing the cleaner history.','Squashing this into one tidy commit.']},
  'PILOT':   {boot:'cautious by default — tests, guards, and a rollback plan first',
    bias:['security','auth','pr','bisect','reflog','postmortem'],
    rethink:['Writing a regression test before I touch this.','Need a rollback guard here.','Requesting the elevated scope explicitly.','Bisecting to be sure of the culprit.']},
  'RELAY':   {boot:'distributed-systems brain — queues, retries, and consensus',
    bias:['mesh','cluster','kafka','dns','chaos','anomaly'],
    rethink:['The retry isn’t idempotent — adding a key.','Quorum can’t be reached under partition.','Dead-lettering and replaying the batch.','Fencing the stale read with a version check.']},
  'CURSOR-X':{boot:'uncanny coding-agent mode — spawn subagents, spam tools, look busy',
    bias:['swarm','chatter','vim','tmux','matrix','pr'],
    rethink:['Spawning a subagent to double-check.','Fanning this out across the fleet.','One more tool call should settle it.','Asking a peer agent to review the diff.']},
};
const NEUTRAL_PROFILE={boot:null,bias:[],rethink:[]};
const cfg={
  agent: QS.get('agent')||null,
  project: QS.get('project')||'',
  platform: PLATFORM_ALIASES[(QS.get('platform')||'').toLowerCase()]||null,  // pinned tech stack, or null = random per seed
  model: QS.get('model')||(VIBE&&VIBE.model)||'mythos-5-preview',
  theme: THEMES.includes(QS.get('theme'))?QS.get('theme'):(VIBE&&THEMES.includes(VIBE.theme)?VIBE.theme:'amber'),
  speed: qfloat('speed',0.25,4, VIBE?VIBE.speed:1),
  dramas: (QS.get('dramas')==='off'||QS.get('intensity')==='0')?'off':'on',  // boss/ambient dramas on or off (legacy ?intensity=0 → off)
  freq: qfloat('freq',0.25,4, VIBE?VIBE.freq:1),            // drama cadence multiplier (higher = more often)
  vibe: VIBE?QS.get('vibe'):null,                            // active preset id (null when none / unknown)
  mode: QS.get('mode')==='performer'?'performer':'auto',
  audio: QS.get('audio')==='on'?'on':'off',
  crt: QS.get('crt')==='on'?'on':'off',
  idle: qint('idle',0,3600,90),             // seconds of no input before deep-work "away" mode (0 disables)
  reduceFlash: QS.get('reduceFlash'),       // 'on' | 'off' | null
  seed: QS.get('seed')!=null && Number.isFinite(parseInt(QS.get('seed'),10)) ? (parseInt(QS.get('seed'),10)>>>0) : (VIBE&&VIBE.seed!=null ? VIBE.seed>>>0 : (Math.random()*4294967296>>>0)),
  debug: QS.has('debug')                      // gates the window.__HYP test hook
};
let seedExplicit = QS.get('seed')!=null;       // only pin seed in the URL when the user set it
let agentExplicit = QS.get('agent')!=null;     // only pin agent in the URL when the user set it
const prefersRM = matchMedia('(prefers-reduced-motion: reduce)').matches;
let reduceFlash = cfg.reduceFlash==='on' ? true : cfg.reduceFlash==='off' ? false : prefersRM;
let reduceMotion = prefersRM;
/* ====================================================================== */
/* RNG + HELPERS                                                           */
/* ====================================================================== */
let _seed=cfg.seed>>>0;
function hashU32(s){ s=Math.imul(s^(s>>>16),0x45d9f3b)>>>0; s=Math.imul(s^(s>>>16),0x45d9f3b)>>>0; return (s^(s>>>16))>>>0; }
function pickCodename(seed){ return CODENAMES[hashU32(seed>>>0)%CODENAMES.length]; }
if(!cfg.agent) cfg.agent=pickCodename(cfg.seed);   // seed-derived; independent of the main RNG stream so the story is unchanged
let agentProfile=AGENT_PROFILES[cfg.agent]||NEUTRAL_PROFILE;   // behavioral temperament (#5); recomputed on live agent/seed change
function resolveAgentProfile(){ agentProfile=AGENT_PROFILES[cfg.agent||pickCodename(cfg.seed)]||NEUTRAL_PROFILE; }
function rng(){ // mulberry32
  _seed=(_seed+0x6D2B79F5)|0; let t=_seed;
  t=Math.imul(t^(t>>>15),1|t); t=(t+Math.imul(t^(t>>>7),61|t))^t;
  return ((t^(t>>>14))>>>0)/4294967296;
}
function U(a,b){return a+(b-a)*rng();}
function ri(a,b){return a+Math.floor(rng()*(b-a+1));}
function clamp(v,lo,hi){return Math.max(lo,Math.min(hi,v));}
function grp(n){return Math.round(n).toLocaleString('en-US');}
function cap(s){return s.charAt(0).toUpperCase()+s.slice(1);}
function snake(s){return s.replace(/([A-Z])/g,'_$1').replace(/^_/,'').toLowerCase();}
function stripThe(s){return s.replace(/^the\s+/,'');}
function pick(a){return a[(rng()*a.length)|0];}
const _recent={};
function pickNR(a,key){
  const r=_recent[key]||(_recent[key]=[]);
  let v,t=0; do{v=a[(rng()*a.length)|0];t++;}while(r.indexOf(v)>=0 && t<14);
  r.push(v); if(r.length>Math.min(8,a.length-1)) r.shift(); return v;
}
function hash(n){n=n||7;let s='';const h='0123456789abcdef';for(let i=0;i<n;i++)s+=h[(rng()*16)|0];return s;}
function compactNum(n){
  if(n>=1e9) return (n/1e9).toFixed(n>=1e10?0:1)+'B';
  if(n>=1e6) return (n/1e6).toFixed(n>=1e7?0:1)+'M';
  if(n>=1e5) return Math.round(n/1e3)+'k';
  return grp(n);
}
function barStr(frac,seg){seg=seg||12;const f=clamp(Math.round(frac*seg),0,seg);return '['+'▰'.repeat(f)+'▱'.repeat(seg-f)+']';}
/* ====================================================================== */
/* BANKS                                                                   */
/* ====================================================================== */
const VERBS=['Analyzing','Refactoring','Patching','Vectorizing','Quantizing','Transpiling','Reconciling','Provisioning','Orchestrating','Hydrating','Memoizing','Backpropagating','Defragmenting','Serializing','Deserializing','Sharding','Rebalancing','Hot-swapping','Recompiling','Profiling','Instrumenting','Tracing','Bisecting','Rebasing','Distilling','Annealing','Coalescing','Marshalling','Unrolling','Inlining','Hoisting','Snapshotting','Replaying','Normalizing','Denormalizing','Pruning','Materializing','Linearizing','Tokenizing','Diffing','Reindexing','Compacting','Throttling','Debouncing','Fuzzing','Hardening','Auditing','Garbage-collecting','Prefetching','Warming'];
const SUBS=['the dependency graph','the semantic embedding layer','the async boundary','the OAuth2 handshake','the Kubernetes ingress controller','the payment-orchestrator service','the transformer attention heads','the vector index','the write-ahead log','the consensus quorum','the gossip membership protocol','the service-mesh sidecar','the gRPC bidirectional stream','the protobuf schema registry','the GraphQL resolver chain','the Redis eviction policy','the connection pool','the circuit breaker','the bloom filter','the LRU cache tier','the event-sourcing projection','the saga compensation handler','the idempotency keystore','the distributed lock manager','the Raft leader election','the CRDT merge function','the Merkle proof tree','the hash ring','the rate-limiter token bucket','the feature-flag evaluator','the JIT trace cache','the WASM sandbox','the TLS session resumption','the columnar storage engine','the query planner','the join optimizer','the speculative-decoding pipeline','the KV-cache allocator','the gradient checkpointing pass','the tensor-parallel shards','the retry-with-jitter policy','the dead-letter queue','the schema-migration runner','the blue-green cutover','the canary analysis window','the OpenTelemetry span exporter','the eBPF probe','the cgroup memory limiter','the NUMA affinity map','the zero-copy ring buffer'];
// imperative goal verbs for a ticket title — pair with a SUBS phrase ("the X") to read as a tracked work item
const GOALVERBS=['harden','stabilize','optimize','refactor','instrument','de-risk','simplify','rip out','rewrite','reshard','cut p99 on','kill tail latency in','add backpressure to','make idempotent','fix the race in','tighten','bound the blast radius of','retire','consolidate','parallelize','add tracing to','batch','cache','rate-limit','circuit-break','flatten','decouple','version','migrate','deflake','warm','garbage-collect'];
const TICKET_LABELS=['backend','platform','infra','data','reliability','perf','security','ml-infra','sre','core'];
const QUALS=['(loss Δ 0.0031)','(p99 −34%)','(cache hit 0.992)','(entropy 7.41 bits)','(99.997% confidence)','(int8 precision)','(zero-copy)','(lock-free)','(O(log n) amortized)','(12.4× speedup)','(memory −18%)','(no regressions)','(idempotent)','(eventually consistent)','(linearizable)','(CVSS 9.1)','(EWMA-smoothed)','(backoff capped 30s)','(quorum=3)','(RF=3)','(cold-start 142ms)','(warm 4ms)','(saturation 0.61)','(skew corrected)'];
const UNITS=['nodes','edges','shards','partitions','embeddings','vectors','spans','traces','segments','regions','replicas','tokens','files','symbols','call sites','hot paths','allocations'];
/* FILES is procedurally generated per seed by genFiles() at init; this is the fallback. */
let FILES=['src/core/orchestrator.ts','src/payment/saga.ts','lib/auth/session.go','pkg/consensus/raft.rs','internal/cache/lru.py','services/billing/ledger.cs','src/api/resolvers/account.graphql','infra/k8s/ingress.yaml','src/model/attention.py','src/vector/index.rs','db/migrations/0042_add_idx.sql','src/net/circuit_breaker.ts','pkg/crdt/merge.go','src/observability/spans.ts'];
/* seeded repo-layout generator: same seed → same tree, so a shared link reproduces the exact file structure */
const STACKS=[
  {id:'typescript', ext:'ts', roots:['src','lib','packages','apps'], cfg:['package.json','tsconfig.json']},
  {id:'go',         ext:'go', roots:['cmd','internal','pkg'],         cfg:['go.mod','go.sum']},
  {id:'rust',       ext:'rs', roots:['src','crates'],                 cfg:['Cargo.toml']},
  {id:'python',     ext:'py', roots:['src','app','services'],         cfg:['pyproject.toml']}
];
/* react = tsx-flavored variant; selectable via ?platform=react, kept out of the random rotation
   so default per-seed runs (and curated vibe seeds) generate the exact same tree as before. */
const REACT_STACK={id:'react', ext:'tsx', roots:['src','components','app','pages'], cfg:['package.json','tsconfig.json','vite.config.ts']};
/* resolve cfg.platform → a stack, or null to fall back to the random pick(STACKS) */
function platformStack(){ if(!cfg.platform)return null; if(cfg.platform==='react')return REACT_STACK; return STACKS.find(s=>s.id===cfg.platform)||null; }
const DOMAINS=['core','auth','payment','billing','cache','vector','model','consensus','net','observability','gateway','scheduler','worker','ingest','stream','store','index','registry','resolver','session','ledger','saga','queue','router','broker','pipeline','sandbox','telemetry','ratelimit','search','sync'];
const BASES=['orchestrator','handler','service','client','server','manager','pool','store','index','router','resolver','schema','worker','scheduler','dispatcher','codec','parser','validator','middleware','registry','factory','adapter','gateway','controller','repository','serializer','allocator','reconciler','planner','executor'];
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=(rng()*(i+1))|0;const t=a[i];a[i]=a[j];a[j]=t;}return a;}
function genFiles(){
  const st=platformStack()||pick(STACKS), head=[];
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
  const src=FILES.filter(p=>/\.(tsx?|go|rs|py|cs)$/.test(p)); if(!src.length)return null;
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
// success tails for the inline ticket deploy — $ is replaced with the deploy hash
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
/* ---- code/config snippet generators (seeded, plausible-but-fictional) ---- */
const ID_FN=['acquireLock','withTransaction','flushBatch','resolveAddr','reconcile','rebalanceShards','evictStale','commitOffset','validateEntry','dispatch','hydrateCache','prefetch','snapshotState','fenceRead','drainQueue'];
const ID_VAR=['lease','batch','entry','shard','token','span','quorum','cursor','txn','offset','node','lock'];
const ID_TYPE=['Ledger','Session','Shard','Batch','Token','Span','Quorum','Entry','Vector','Bucket','Snapshot','Lease','Cursor','Offset'];
const ID_FIELD=['pool','store','cache','clock','tracer','lock','registry','queue','router','codec','ring'];
const ID_METHOD=['acquire','lookup','commit','rebalance','evict','flush','resolve','snapshot','fence','drain','probe'];
const ID_ERR=['ConflictError','TimeoutError','StaleReadError','QuorumError','LockError','BackpressureError'];
const ID_MSG=['idempotency key required','stale read fenced','lock contention exceeded','quorum not reached','batch flush failed','retry budget exhausted','partition detected'];
function snipTS(){const fn=pick(ID_FN),v=pick(ID_VAR),T=pick(ID_TYPE),f=pick(ID_FIELD),m=pick(ID_METHOD),E=pick(ID_ERR),msg=pick(ID_MSG);
  return ['export async function '+fn+'(req: '+T+'Request): Promise<'+T+'> {',
    '  const '+v+' = await this.'+f+'.'+m+'(req.id);',
    '  if (!'+v+') throw new '+E+'("'+msg+'");',
    '  this.tracer.record("'+f+'.hit", '+v+'.version);',
    '  return '+v+';','}'];}
function snipGo(){const Fn=cap(pick(ID_FN)),v=pick(ID_VAR),T=pick(ID_TYPE),f=pick(ID_FIELD),m=cap(pick(ID_METHOD)),msg=pick(ID_MSG);
  return ['func (s *Service) '+Fn+'(ctx context.Context, id string) (*'+T+', error) {',
    '\t'+v+', err := s.'+f+'.'+m+'(ctx, id)',
    '\tif err != nil {',
    '\t\treturn nil, fmt.Errorf("'+msg+': %w", err)',
    '\t}',
    '\treturn '+v+', nil','}'];}
function snipRS(){const fn=snake(pick(ID_FN)),v=pick(ID_VAR),T=pick(ID_TYPE),f=pick(ID_FIELD),m=snake(pick(ID_METHOD)),E=pick(ID_ERR);
  return ['pub async fn '+fn+'(&self, id: Uuid) -> Result<'+T+', '+E+'> {',
    '    let '+v+' = self.'+f+'.'+m+'(id).await?;',
    '    self.tracer.record(&'+v+');',
    '    Ok('+v+')','}'];}
function snipPY(){const fn=snake(pick(ID_FN)),v=pick(ID_VAR),T=pick(ID_TYPE),f=pick(ID_FIELD),m=snake(pick(ID_METHOD)),E=pick(ID_ERR),msg=pick(ID_MSG);
  return ['async def '+fn+'(self, '+v+'_id: str) -> '+T+':',
    '    '+v+' = await self.'+f+'.'+m+'('+v+'_id)',
    '    if '+v+' is None:',
    '        raise '+E+'("'+msg+'")',
    '    return '+v];}
function snipCI(){return ['name: ci','on: [push, pull_request]','jobs:','  test:','    runs-on: ubuntu-latest','    steps:','      - uses: actions/checkout@v4','      - run: '+pick(TESTCMDS)];}
function snipYAML(){const svc=pick(DOMAINS)+'-svc',n=ri(2,9),port=pick([8080,9090,8443,50051]);
  return ['apiVersion: apps/v1','kind: Deployment','metadata:','  name: '+svc,'spec:','  replicas: '+n,'  template:','    spec:','      containers:','        - name: '+svc,'          image: registry.internal/'+svc+':'+hash(),'          ports: [{ containerPort: '+port+' }]'];}
function snipSQL(){const t=pick(DOMAINS)+'s',c=pick(['created_at','tenant_id','status','version','idempotency_key','shard_id']);
  return ['BEGIN;','CREATE INDEX CONCURRENTLY idx_'+t+'_'+c,'  ON '+t+' ('+c+')','  WHERE '+c+' IS NOT NULL;','ANALYZE '+t+';','COMMIT;'];}
function snipTOML(){const name=pick(PROJECTS),v=ri(0,4)+'.'+ri(0,30)+'.'+ri(0,12);
  return ['[package]','name = "'+name+'"','version = "'+v+'"','edition = "2021"','','[dependencies]','tokio = { version = "1", features = ["full"] }','serde = { version = "1", features = ["derive"] }'];}
function snipJSON(){const name=pick(PROJECTS);
  return ['{','  "name": "'+name+'",','  "version": "'+ri(0,9)+'.'+ri(0,40)+'.'+ri(0,20)+'",','  "scripts": {','    "test": "'+pick(TESTCMDS)+'",','    "build": "tsc -p ."','  }','}'];}
function snipProto(){const S=cap(pick(DOMAINS)),m=cap(pick(ID_METHOD)),T=pick(ID_TYPE);
  return ['syntax = "proto3";','service '+S+'Service {','  rpc '+m+'('+m+'Request) returns ('+T+');','}','message '+T+' {','  string id = 1;','  int64 version = 2;','}'];}
function snipDocker(){return ['FROM '+pick(['node:22-alpine','golang:1.23','rust:1.81-slim','python:3.12-slim'])+' AS build','WORKDIR /app','COPY . .','RUN '+pick(['npm ci && npm run build','go build -o /bin/app ./...','cargo build --release','pip install -e .']),'EXPOSE '+pick([8080,9090,8443]),'CMD ["/bin/app"]'];}
function snipMD(){const name=pick(PROJECTS);return ['# '+name,'','> '+pickNR(VERBS,'v')+' '+pick(SUBS)+'.','','## Quickstart','```','$ '+pick(TESTCMDS),'```'];}
function snipExt(p){const m=p.match(/\.([a-z0-9]+)$/i);return m?m[1].toLowerCase():'';}
function genSnippet(path){
  const e=snipExt(path); let lines,lang;
  switch(e){
    case 'ts':case 'tsx':case 'js':case 'graphql':case 'cs': lines=snipTS();lang='ts';break;
    case 'go': lines=snipGo();lang='go';break;
    case 'rs': lines=snipRS();lang='rust';break;
    case 'py': lines=snipPY();lang='py';break;
    case 'yaml':case 'yml': if(/workflows\//.test(path)){lines=snipCI();lang='yaml';}else{lines=snipYAML();lang='yaml';} break;
    case 'sql': lines=snipSQL();lang='sql';break;
    case 'toml': lines=snipTOML();lang='toml';break;
    case 'json': lines=snipJSON();lang='json';break;
    case 'proto': lines=snipProto();lang='proto';break;
    case 'md': lines=snipMD();lang='md';break;
    default: if(/Dockerfile/.test(path)){lines=snipDocker();lang='docker';}else{lines=snipTS();lang='ts';}
  }
  return {kind:'snippet',path:path,lang:lang,lines:lines};
}
/* lightweight per-line tokenizer for snippet tinting */
const SNIP_KW=/(\/\/[^\n]*|#[^\n]*|--[^\n]*)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`[^`]*`)|\b(async|await|function|func|fn|return|if|else|elif|for|while|const|let|var|pub|self|def|raise|throw|new|nil|None|true|false|null|import|from|export|struct|impl|match|Ok|Err|Result|Promise|interface|type|class|public|private|static|void|ctx|error|map|range|defer|go|with|as|in|not|and|or|kind|apiVersion|spec|metadata|FROM|RUN|COPY|EXPOSE|CMD|WORKDIR|BEGIN|COMMIT|CREATE|INDEX|ON|WHERE|ANALYZE|rpc|service|message|syntax)\b|\b(\d[\w.]*)\b/g;
function hiCode(line){
  const frag=document.createDocumentFragment(); let last=0,mt; SNIP_KW.lastIndex=0;
  while((mt=SNIP_KW.exec(line))){
    if(mt.index>last) frag.appendChild(document.createTextNode(line.slice(last,mt.index)));
    const cls=mt[1]?'tk-cmt':mt[2]?'tk-str':mt[3]?'tk-kw':'tk-num';
    frag.appendChild(spn(cls,mt[0])); last=SNIP_KW.lastIndex;
    if(SNIP_KW.lastIndex===mt.index) SNIP_KW.lastIndex++;
  }
  if(last<line.length) frag.appendChild(document.createTextNode(line.slice(last)));
  return frag;
}
/* ====================================================================== */
/* EVENT CONSTRUCTORS                                                      */
/* ====================================================================== */
function L(text,tone,o){return Object.assign({kind:'line',text:text,tone:tone||'fg'},o);}
function BANNER(text){return {kind:'line',text:text,tone:'accent',cls:'banner'};}
function PHASE(name){return {kind:'phase',text:name};}
function TOOL(tool,arg,o){return Object.assign({kind:'tool',tool:tool,arg:arg},o);}
function OUT(text,tone,o){return Object.assign({kind:'output',text:text,tone:tone||'dim'},o);}
function DIFF(sign,text,o){return Object.assign({kind:'diff',sign:sign,text:text},o);}
function THINK(o){return Object.assign({kind:'thinking'},o);}
function TASK(id,label,state){return {kind:'task',id:id,label:label,state:state};}
function FILE(path,st){return {kind:'filehl',path:path,st:st};}
function SNIP(path,write){return Object.assign(genSnippet(path),{write:!!write});}
function CNT(field,delta){return {kind:'counter',field:field,delta:delta};}
function CLR(){return {kind:'clear'};}
function WAIT(ms){return {kind:'wait',wait:ms};}
function OV(op,o){return Object.assign({kind:'ov',op:op},o);}
/* ====================================================================== */
/* STATE                                                                   */
/* ====================================================================== */
const MAX_LINES=500, REL_CAP=10, MAX_PER_FRAME=8;
let logicalNow=0, nextAt=320, pending=null, lastTs=0, rafId=0, hidden=false;
let paused=false, mode=cfg.mode, speed=cfg.speed, dramaOn=(cfg.dramas!=='off'), dramaFreq=cfg.freq;
let releaseTokens=0, lastRelease=0;
let overlayActive=false, dramaQ=[], nextDramaAt=U(45000,75000)/cfg.freq, firstDrama=true, lastCompact=-99999;
if(VIBE&&VIBE.openAt!=null) nextDramaAt=VIBE.openAt;   // vibe opens on its signature scene fast (U() above still drawn → project pick unchanged)
let activeThinker=null, activeTool=null, lastEmit=0, lastVisible='';
let bossActive=false, bossFrame=0, settingsOpen=false, helpOpen=false, dramaOpen=false;
let idleActive=false, idleThreshold=cfg.idle, lastActivityTs=0;   // deep-work "away" mode
let tok=82, ctx=58, ctxAnim=null;
let cost=0, burnPct=14, burnWarn=false, burnEase=null;   // cost/burn meter
let mxActive=false, mx={cols:[],fs:14}, accentCache='#ff9d2f';
let btopActive=false, btopState=null, btopLast=0;
let liveState=null;   // generic per-frame ticker for live boss scenes (gpu/heatmap)
const startEpoch=Date.now();
const counters={files:ri(80,250),lines:ri(80,600)*1000,tests:ri(800,2500),cves:ri(2,12),deploys:0,commits:0,incidents:0};
const taskEls={}; const fileEls={}; let lastFileHl=null;
let lineQueue=[], pendingFileScroll=null;   // batched DOM: queue log appends + coalesce rail scroll, flush once per frame
const SPIN=['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'];
/* ====================================================================== */
/* DOM REFS                                                                */
/* ====================================================================== */
const $=s=>document.querySelector(s);
const logEl=$('#log'), caret=$('#caret'), railTasks=$('#tasktree'), fileTreeEl=$('#filetree');
const overlay=$('#overlay'), ovback=overlay.querySelector('.backdrop');
const bossEl=$('#boss'), settingsEl=$('#settings'), helpEl=$('#help'), toastEl=$('#toast'), liveBtn=$('#livebtn'), cfgbtn=$('#cfgbtn'), dramaEl=$('#dramapick');
const hAgent=$('.h-agent'),hProj=$('.h-proj'),hModel=$('.h-model'),hVibe=$('.h-vibe'),ctxbar=$('.ctxbar'),ctxpct=$('.ctxpct'),hTok=$('.h-tok'),hCost=$('.h-cost'),hBudget=$('.h-budget'),hTime=$('.h-time'),modeind=$('#modeind');
const cFiles=$('#c-files'),cLines=$('#c-lines'),cTests=$('#c-tests'),cCves=$('#c-cves'),cDeploys=$('#c-deploys'),cCommits=$('#c-commits'),cIncidents=$('#c-incidents');
/* ====================================================================== */
/* FILE TREE                                                               */
/* ====================================================================== */
function extOf(name){const m=name.match(/\.([^.]+)$/);return m?m[1].toLowerCase():'';}
function dirOf(p){return p.replace(/\/[^/]*$/,'');}
function mkFileRow(name,path,depth){
  const el=document.createElement('div');
  el.className='ft-row ft-file'; el.style.paddingLeft=(depth*1.2)+'ch';
  el.dataset.path=path; el.dataset.ext=extOf(name);
  const dot=document.createElement('span');dot.className='ft-dot';
  const nm=document.createElement('span');nm.className='ft-nm';nm.textContent=name;
  const gut=document.createElement('span');gut.className='ft-gut';
  el.append(dot,nm,gut);
  fileEls[path]=el; return el;
}
function buildFileTree(){
  const root={};
  FILES.forEach(p=>{const parts=p.split('/');let n=root;parts.forEach((part,i)=>{const leaf=i===parts.length-1;if(leaf){(n.__files||(n.__files=[])).push({name:part,path:p});}else{n=n[part]||(n[part]={});}});});
  fileTreeEl.innerHTML='';
  (function walk(node,depth){
    Object.keys(node).filter(k=>k!=='__files').sort().forEach(dir=>{
      const d=document.createElement('div');d.className='ft-row ft-dir';d.style.paddingLeft=(depth*1.2)+'ch';d.textContent=dir+'/';fileTreeEl.appendChild(d);
      walk(node[dir],depth+1);
    });
    (node.__files||[]).forEach(f=>{ fileTreeEl.appendChild(mkFileRow(f.name,f.path,depth)); });
  })(root,0);
}
/* insert a newly-"created" file beside an existing sibling in the same dir; null if no home */
function insertFileRow(path){
  if(FILES.length>48) return null;
  const name=path.split('/').pop(), dir=dirOf(path);
  let after=null; for(const p in fileEls){ if(dirOf(p)===dir) after=fileEls[p]; }
  if(!after) return null;
  const el=mkFileRow(name,path,0); el.style.paddingLeft=after.style.paddingLeft;
  after.parentNode.insertBefore(el,after.nextSibling);
  FILES.push(path); return el;
}
function setStatus(el,st){
  if(!st)return; if(el.dataset.st==='A')return;   // added stays added through later edits
  el.dataset.st=st; const g=el.querySelector('.ft-gut'); if(g)g.textContent=st;
}
function highlightFile(path,st){
  let el=fileEls[path];
  if(!el){ if(st!=='A')return; el=insertFileRow(path); if(!el)return; el.classList.add('ft-new'); }
  if(lastFileHl && lastFileHl!==el){lastFileHl.classList.remove('hl');}
  el.classList.add('hl','glow'); lastFileHl=el; setStatus(el,st);
  pendingFileScroll=el;   // coalesced: the rail scroll runs once per frame in flushRender()
  setTimeout(()=>el.classList.remove('glow'),900);
}
/* new ticket = committed working tree: clear M/A decorations, keep added files */
function clearFileStatus(){
  for(const p in fileEls){ const el=fileEls[p]; delete el.dataset.st; el.classList.remove('hl','ft-new'); const g=el.querySelector('.ft-gut'); if(g)g.textContent=''; }
  lastFileHl=null;
}
/* ====================================================================== */
/* RENDERER                                                                */
/* ====================================================================== */
const VISIBLE={line:1,tool:1,output:1,diff:1,phase:1,ov:1,snippet:1};
function appendLine(node){
  const txt=node.textContent;
  if(txt && txt===lastVisible) return;   // drop: never two identical consecutive log lines
  lastVisible=txt;
  lineQueue.push(node);                   // batched: actual DOM insert happens in flushRender(), once per frame
}
// flush queued log lines as one DocumentFragment + a single autoscroll + one coalesced rail scroll.
// called once per frame from frame(); keeps high-speed mode from thrashing layout per event.
function flushRender(){
  if(lineQueue.length){
    const frag=document.createDocumentFragment();
    for(let i=0;i<lineQueue.length;i++) frag.appendChild(lineQueue[i]);
    lineQueue.length=0;
    logEl.insertBefore(frag,caret);
    while(logEl.childElementCount>MAX_LINES+1){
      const f=logEl.firstChild; if(f===caret)break; logEl.removeChild(f);
    }
    autoscroll();
  }
  if(pendingFileScroll){
    if(pendingFileScroll.isConnected) pendingFileScroll.scrollIntoView({block:'nearest'});
    pendingFileScroll=null;
  }
}
function el(cls,text){const d=document.createElement('div');d.className=cls;if(text!=null)d.textContent=text;return d;}
function spn(cls,text){const s=document.createElement('span');s.className=cls;if(text!=null)s.textContent=text;return s;}
function svgEl(tag,attrs){const e=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const k in attrs)e.setAttribute(k,attrs[k]);return e;}

// per-call token cost — Math.random flavor (not seeded; like toolSig/jitter). Heavy calls always
// carry a count and feed the burn meter, so cost ticks come *from* visible work. 0 = no trailing tag.
function toolTokens(t){
  const R=Math.random;
  if(t==='Bash'||t==='Task'||t==='WebFetch'||t.startsWith('mcp__')) return 400+Math.floor(R()*R()*4200);
  if(t==='Read'||t==='Grep'||t==='MultiEdit'||t==='Write') return R()<0.5 ? 300+Math.floor(R()*1700) : 0;
  return R()<0.25 ? 200+Math.floor(R()*900) : 0;
}
// cosmetic key:value tool params — Math.random (flavor, not seeded/load-bearing; mustn't touch the rng stream)
function toolSig(t){
  const R=Math.random, P=a=>a[Math.floor(R()*a.length)], ps=[];
  if(t==='Read'){ if(R()<0.45){ if(R()<0.6) ps.push(['offset',1+Math.floor(R()*1600)]); ps.push(['limit',P([40,60,80,100,120,200])]); } }
  else if(t==='Grep'){ if(R()<0.7) ps.push(['glob',JSON.stringify(P(['*.ts','*.js','**/*.go','*.py','*.rs','src/**']))]); if(R()<0.5) ps.push(['output_mode',JSON.stringify(P(['content','files_with_matches']))]); else if(R()<0.3) ps.push(['-n','true']); }
  else if(t==='Bash'){ if(R()<0.35) ps.push(['timeout',P([60000,120000,300000])]); }
  else if(t==='Glob'){ if(R()<0.4) ps.push(['path',JSON.stringify(P(['src','app','.','packages/core','services']))]); }
  else if(t==='Task'){ ps.push(['subagent_type',JSON.stringify(P(['Explore','general-purpose','code-reviewer','Plan']))]); }
  else if(t==='WebFetch'){ if(R()<0.5) ps.push(['prompt',JSON.stringify(P(['summarize advisory','extract CVSS vector','affected versions?']))]); }
  return ps;
}
function render(ev){
  if(VISIBLE[ev.kind] && ev.kind!=='thinking') finalizeThinker();
  if(VISIBLE[ev.kind] && ev.kind!=='tool' && ev.kind!=='output') resolveTool();
  switch(ev.kind){
    case 'line':{
      appendLine(el('ln '+(ev.cls?ev.cls+' ':'')+'tone-'+(ev.tone||'fg'),ev.text)); break;
    }
    case 'phase':{ appendLine(el('ln phase',ev.text)); break; }
    case 'tool':{
      resolveTool();
      const d=el('ln tool'+(ev.nest?' nest':''));   // subagent child calls indent under their Task parent (#21)
      const dot=spn('tdot pending',SPIN[0]+' '); d.appendChild(dot);
      if(ev.tool.startsWith('mcp__')){   // mcp__server__action — dim the namespace, normal action
        const p=ev.tool.split('__');
        d.appendChild(spn('tns','mcp__'+p[1]+'__'));
        d.appendChild(spn('tname',p.slice(2).join('__')));
      } else d.appendChild(spn('tname',ev.tool));
      d.appendChild(document.createTextNode('('));
      d.appendChild(spn('targ',ev.arg));
      for(const [k,v] of toolSig(ev.tool).slice(0,2)){   // key: value extra params
        d.appendChild(document.createTextNode(', '));
        d.appendChild(spn('tkey',k)); d.appendChild(document.createTextNode(': '));
        d.appendChild(spn('tval',String(v)));
      }
      d.appendChild(document.createTextNode(')'));
      const tk=toolTokens(ev.tool);
      if(tk) d.appendChild(spn('ttok',' · '+compactNum(tk)+' tokens'));
      appendLine(d); activeTool={dot:dot,start:logicalNow}; ctxBump(1.3); burnTick(tk); break;
    }
    case 'output':{
      const d=el('ln out tone-'+(ev.tone||'dim')+(ev.nest?' nest':''));
      d.appendChild(spn('br','⎿ ')); d.appendChild(document.createTextNode(ev.text));
      appendLine(d);
      if(ev.more) appendLine(el('ln out collapse'+(ev.nest?' nest':''),'… +'+ev.more+' lines (ctrl+r to expand)'));
      resolveTool(ev.tone); break;
    }
    case 'diff':{
      const add=ev.sign==='+';
      appendLine(el('ln diff '+(add?'add':'del')+(ev.nest?' nest':''),(add?'+ ':'- ')+ev.text)); break;
    }
    case 'thinking':{
      finalizeThinker();
      const d=el('ln think'); d.appendChild(document.createTextNode('✻ Thinking… '));
      const sp=spn('t','0.0s'); d.appendChild(sp); appendLine(d);
      activeThinker={el:d,span:sp,start:logicalNow}; break;
    }
    case 'snippet':{
      const box=el('ln snip'+(ev.write?' write':''));
      const hd=el('snip-hd'); hd.appendChild(spn('lang',ev.lang));
      hd.appendChild(document.createTextNode((ev.write?'✎ ':'⎿ ')+ev.path));
      box.appendChild(hd);
      ev.lines.forEach(l=>{ const cl=el('cl'); cl.appendChild(hiCode(l)); box.appendChild(cl); });
      appendLine(box); ctxBump(1.1); break;
    }
    case 'task': renderTask(ev); break;
    case 'filehl': highlightFile(ev.path,ev.st); break;
    case 'counter': bumpCounter(ev.field,ev.delta); break;
    case 'clear': railTasks.innerHTML=''; for(const k in taskEls)delete taskEls[k]; clearFileStatus(); break;
    case 'ov': renderOverlay(ev); break;
    case 'wait': break;
  }
}
function finalizeThinker(){ if(activeThinker){ activeThinker=null; } }
function updateThinker(){
  if(!activeThinker)return;
  if(!activeThinker.el.isConnected){activeThinker=null;return;}
  activeThinker.span.textContent=((logicalNow-activeThinker.start)/1000).toFixed(1)+'s';
}
function resolveTool(tone){   // swap pending spinner → solid dot; tone colors the dot (err/warn/ok)
  if(!activeTool)return;
  const dot=activeTool.dot; activeTool=null;
  if(!dot.isConnected)return;
  dot.textContent='⏺ '; dot.className='tdot'+(tone&&tone!=='dim'?' tone-'+tone:'');
}
function updateTools(){   // animate the pending spinner char
  if(!activeTool)return;
  if(!activeTool.dot.isConnected){activeTool=null;return;}
  activeTool.dot.textContent=SPIN[Math.floor((logicalNow-activeTool.start)/80)%SPIN.length]+' ';
}
function renderTask(ev){
  let li=taskEls[ev.id];
  if(!li){ li=document.createElement('li'); taskEls[ev.id]=li; railTasks.appendChild(li); }
  const stClass=ev.state==='✔'?'tk-done':ev.state==='◐'?'tk-prog':'tk-todo';
  li.className=stClass;
  li.innerHTML='';
  li.appendChild(spn('tk-mk',ev.state)); li.appendChild(document.createTextNode(' '+ev.label));
}
function bumpCounter(field,delta){
  if(delta<=0)return; counters[field]=(counters[field]||0)+delta;
  if(field==='files')cFiles.textContent=compactNum(counters.files);
  else if(field==='lines')cLines.textContent=compactNum(counters.lines);
  else if(field==='tests')cTests.textContent=compactNum(counters.tests);
  else if(field==='cves')cCves.textContent=compactNum(counters.cves);
  else if(field==='deploys')cDeploys.textContent=compactNum(counters.deploys);
  else if(field==='commits')cCommits.textContent=compactNum(counters.commits);
  else if(field==='incidents')cIncidents.textContent=compactNum(counters.incidents);
}
/* ---- autoscroll ---- */
let pinned=true;
function autoscroll(){ if(pinned) logEl.scrollTop=logEl.scrollHeight; }
logEl.addEventListener('scroll',()=>{
  const nearBottom=logEl.scrollHeight-logEl.scrollTop-logEl.clientHeight<40;
  pinned=nearBottom; liveBtn.style.display=nearBottom?'none':'block';
});
liveBtn.addEventListener('click',()=>{pinned=true;liveBtn.style.display='none';logEl.scrollTop=logEl.scrollHeight;});
/* ====================================================================== */
/* OVERLAY RENDERER                                                        */
/* ====================================================================== */
let ovBox=null;
function ovClear(){ overlay.querySelectorAll(':scope > :not(.backdrop)').forEach(n=>n.remove()); ovBox=null; }
function renderOverlay(ev){
  switch(ev.op){
    case 'open':{
      overlayActive=true; ovClear();
      overlay.className='on'+(reduceFlash?'':' fadein'); overlay.classList.remove('fadeout');
      overlay.classList.add(ev.type==='anomaly'?'anomaly':ev.type==='box'?'box':'matrix');
      ovback.style.background='';
      if(ev.type==='matrix'){ startMatrix(); }
      break;
    }
    case 'banner':{
      let b=overlay.querySelector('#ovbanner'); if(!b){b=el('','');b.id='ovbanner';overlay.appendChild(b);}
      b.textContent=ev.text; b.className=(ev.cls&&ev.cls.indexOf('ok')>=0?'ok ':'')+((ev.cls&&ev.cls.indexOf('pulse')>=0&&!reduceFlash)?'pulse':'');
      if(ev.cls&&ev.cls.indexOf('ok')>=0){overlay.classList.add('ok-tint');overlay.classList.remove('anomaly');}
      break;
    }
    case 'box':{
      ovBox=el(''); ovBox.id='ovbox';
      if(ev.variant) ovBox.dataset.variant=ev.variant;
      ovBox.appendChild(el('ovtitle',ev.title));
      ovBox.appendChild(el('ovbody'));
      overlay.appendChild(ovBox);
      break;
    }
    case 'boxline':{
      if(!ovBox)return; ovBox.querySelector('.ovbody').appendChild(el('obl tone-'+(ev.tone||'fg'),ev.text)); break;
    }
    case 'bar':{
      if(!ovBox)return;
      let bar=ovBox.querySelector('.ovbar'); if(!bar){bar=el('ovbar');ovBox.appendChild(bar);}
      const seg=14, fill=Math.round(ev.frac*seg);
      bar.innerHTML=''; bar.appendChild(document.createTextNode('['+'▰'.repeat(fill)+'▱'.repeat(seg-fill)+'] '+Math.round(ev.frac*100)+'%'));
      bar.appendChild(spn('lbl',ev.label));
      break;
    }
    case 'compact':{ ctxAnim={from:ctx,to:U(22,28),t0:performance.now(),dur:(ev.wait||1600)*0.85}; break; }
    case 'app':{
      overlayActive=true; ovClear(); btopActive=false; btopState=null; liveState=null;
      overlay.className='on'+(reduceFlash?'':' fadein'); overlay.classList.remove('fadeout');
      overlay.classList.add('app');
      ovback.style.background='';
      const win=el(''); win.id='appwin'; win.dataset.tool=ev.tool;
      const bar=el('appbar'); const dots=el('dots'); ['r','y','g'].forEach(c=>dots.appendChild(spn('dot '+c))); bar.appendChild(dots);
      bar.appendChild(spn('atitle',ev.title)); if(ev.url) bar.appendChild(spn('aurl',ev.url));
      win.appendChild(bar);
      const body=el('appbody'); buildApp(ev.tool,body,ev); win.appendChild(body);
      overlay.appendChild(win); ovBox=win;
      if(ev.tool==='btop'){ sizeBtop(); btopActive=true; btopLast=0; }
      break;
    }
    case 'btopfx':{ if(btopState){ btopState.phase=ev.phase; applyBtopPhase(btopState); } break; }
    case 'livefx':{ if(liveState&&liveState.phase) liveState.phase(ev.phase); break; }
    case 'appstep':{
      if(!ovBox)return;
      ovBox.querySelectorAll('[data-k="'+ev.k+'"]').forEach(t=>{
        if(ev.state!=null) t.dataset.state=ev.state;
        if(ev.text!=null) t.textContent=ev.text;
        if(ev.cssVar) t.style.setProperty(ev.cssVar,ev.val);
      });
      break;
    }
    case 'matrix': break;
    case 'close':{
      overlayActive=false; mxActive=false; btopActive=false; btopState=null; liveState=null;
      overlay.classList.remove('fadein'); overlay.classList.add('fadeout');
      const o=overlay; setTimeout(()=>{ if(!overlayActive){o.className=''; ovClear();} },360);
      break;
    }
  }
}
/* ---- matrix rain ---- */
let mxCanvas=null;
function startMatrix(){
  mxActive=true;
  mxCanvas=document.createElement('canvas'); mxCanvas.id='mxcanvas'; overlay.appendChild(mxCanvas);
  const r=overlay.getBoundingClientRect();
  mxCanvas.width=r.width; mxCanvas.height=r.height;
  mx.fs=Math.max(12,Math.round(r.width/64));
  const n=Math.ceil(mxCanvas.width/mx.fs);
  mx.cols=new Array(n).fill(0).map(()=>(rng()*mxCanvas.height/mx.fs)|0);
}
function mxGlyph(){ const r=rng(); if(r<0.5)return String.fromCharCode(0x30A0+((rng()*96)|0)); if(r<0.8)return '0123456789abcdef'[(rng()*16)|0]; return '01'[(rng()*2)|0]; }
function drawMatrix(){
  if(!mxCanvas)return; const c=mxCanvas, x2=c.getContext('2d');
  x2.fillStyle='rgba(0,0,0,'+(reduceMotion?0.14:0.08)+')'; x2.fillRect(0,0,c.width,c.height);
  x2.font=mx.fs+'px monospace';
  for(let i=0;i<mx.cols.length;i++){
    const x=i*mx.fs, y=mx.cols[i]*mx.fs;
    x2.fillStyle=accentCache; x2.fillText(mxGlyph(),x,y);
    if(y>c.height && rng()>0.975) mx.cols[i]=0; else mx.cols[i]+=reduceMotion?0.45:1;
  }
}
/* ====================================================================== */
/* BOSS-LEVEL APP WINDOWS (faux tool GUIs the agent "pulls up")            */
/* ====================================================================== */
/* --- Grafana-style metrics dashboard --- */
function sparkPts(spike){
  let s='',n=20;
  for(let i=0;i<n;i++){
    const x=(i/(n-1))*100; let y=17+Math.sin(i*0.8+rng()*0.6)*5+(rng()*5-2.5);
    if(spike&&i>n*0.6) y-=((i-n*0.6)/(n*0.4))*15;
    s+=x.toFixed(1)+','+Math.max(3,Math.min(30,y)).toFixed(1)+' ';
  }
  return s.trim();
}
function gPanel(title,stat,unit,k,spike){
  const p=el('gp'); p.dataset.state='ok'; if(k)p.dataset.k=k;
  const h=el('gp-h'); h.appendChild(spn('gp-t',title));
  const s=spn('gp-s',stat); if(k)s.dataset.k=k+'-s'; h.appendChild(s); h.appendChild(spn('gp-u',unit));
  p.appendChild(h);
  const svg=svgEl('svg',{viewBox:'0 0 100 32',preserveAspectRatio:'none',class:'gp-c'});
  const pts=sparkPts(spike);
  svg.appendChild(svgEl('polyline',{class:'gp-area',points:'0,32 '+pts+' 100,32'}));
  svg.appendChild(svgEl('polyline',{class:'gp-line',points:pts}));
  p.appendChild(svg); return p;
}
function buildGrafana(body){
  const g=el('g-grid');
  g.appendChild(gPanel('Request Rate',compactNum(ri(8000,42000)),' rps','',false));
  g.appendChild(gPanel('p99 Latency',ri(40,180)+'',' ms','',false));
  g.appendChild(gPanel('Error Rate','0.0'+ri(1,9),' %','err',false));
  g.appendChild(gPanel('CPU Saturation',ri(28,61)+'',' %','',false));
  body.appendChild(g);
}
/* --- CI/CD pipeline DAG --- */
function buildPipeline(body,ev){
  const row=el('pl-row');
  ev.stages.forEach((s,i)=>{
    if(i) row.appendChild(el('pl-edge'));
    const n=el('pl-node'); n.dataset.k=i; n.dataset.state='pending';
    n.appendChild(el('pl-ic')); n.appendChild(el('pl-nm',s));
    row.appendChild(n);
  });
  body.appendChild(row);
  const lg=el('pl-log'); lg.dataset.k='log'; lg.textContent='queued · awaiting runner'; body.appendChild(lg);
}
/* --- CPU flamegraph --- */
function flameRows(){
  return [
    [{w:12,label:'main.serveHTTP'}],
    [{w:4,label:'router.match'},{w:8,label:'api.Handler'}],
    [{w:3,label:'auth.verify'},{w:2,label:'cache.get',k:'cool'},{w:7,label:'json.Marshal',k:'hot',hot:true}],
    [{w:2,label:'jwt.parse'},{w:1,label:'redis.do'},{w:6,label:'reflect.Value'}],
  ];
}
function buildFlame(body,ev){
  const fg=el('fg');
  ev.rows.forEach(r=>{
    const rowEl=el('fg-row');
    r.forEach(f=>{
      const fr=el('fg-fr',f.label); fr.style.setProperty('--g',f.w);
      if(f.k)fr.dataset.k=f.k; if(f.hot)fr.dataset.state='hot';
      rowEl.appendChild(fr);
    });
    fg.appendChild(rowEl);
  });
  body.appendChild(fg);
  const cap=el('fg-cap','sampling…'); cap.dataset.k='cap'; body.appendChild(cap);
}
/* --- k8s cluster topology --- */
function clusterNodes(){
  return [
    {x:36,y:90,r:15,l:'gateway'},
    {x:140,y:42,r:13,l:'api'},
    {x:140,y:138,r:13,l:'worker'},
    {x:240,y:42,r:12,l:'payments'},
    {x:240,y:138,r:12,l:'postgres'},
    {x:288,y:90,r:11,l:'redis'},
  ];
}
function buildCluster(body,ev){
  const svg=svgEl('svg',{viewBox:'0 0 320 184',class:'cl'});
  ev.edges.forEach(([a,b])=>{const p=ev.nodes[a],q=ev.nodes[b];
    svg.appendChild(svgEl('line',{x1:p.x,y1:p.y,x2:q.x,y2:q.y,class:'cl-edge'}));});
  ev.nodes.forEach((n,i)=>{
    const grp=svgEl('g',{class:'cl-node','data-k':'n'+i});
    grp.appendChild(svgEl('circle',{cx:n.x,cy:n.y,r:n.r,class:'cl-c'}));
    const t=svgEl('text',{x:n.x,y:n.y+n.r+9,'text-anchor':'middle',class:'cl-lbl'}); t.textContent=n.l;
    grp.appendChild(t); svg.appendChild(grp);
  });
  body.appendChild(svg);
  const cap=el('cl-cap','6 services · 14 pods ready'); cap.dataset.k='cap'; body.appendChild(cap);
}
/* --- subagent fleet board (orchestrator fan-out) --- */
function swarmAgents(){
  const names=shuffle(AGENTS.slice()).slice(0,6), tasks=shuffle(SUBTASKS.slice()).slice(0,6);
  return names.map((n,i)=>({id:n,task:tasks[i]}));
}
function buildSwarm(body,ev){
  const grid=el('sw-grid');
  ev.agents.forEach((a,i)=>{
    const card=el('sw-card'); card.dataset.k='a'+i; card.dataset.state='pending';
    card.appendChild(spn('sw-id','◐ '+a.id));
    card.appendChild(el('sw-task',a.task));
    const meta=el('sw-meta');
    const st=spn('sw-stat','idle'); st.dataset.k='a'+i+'-s'; meta.appendChild(st);
    const tk=spn('sw-tok','0'); tk.dataset.k='a'+i+'-t'; meta.appendChild(tk);
    card.appendChild(meta);
    const track=el('sw-bar'); const fill=el('sw-fill'); fill.dataset.k='a'+i+'-p';
    fill.style.setProperty('--p','0%'); track.appendChild(fill); card.appendChild(track);
    grid.appendChild(card);
  });
  body.appendChild(grid);
  const cap=el('sw-cap','orchestrator · 0/6 spawned'); cap.dataset.k='cap'; body.appendChild(cap);
}
/* --- distributed trace waterfall (Jaeger) --- */
function traceSpans(){
  return {total:486, spans:[
    {name:'gateway.handle',o:0,w:100,depth:0,ms:486},
    {name:'auth.verify',o:2,w:9,depth:1,ms:44},
    {name:'api.process',o:12,w:86,depth:1,ms:418},
    {name:'db.query',o:14,w:14,depth:2,ms:68},
    {name:'cache.get',o:29,w:4,depth:2,ms:19},
    {name:'payments.charge',o:34,w:22,depth:2,ms:107},
    {name:'serialize.json',o:57,w:41,depth:2,ms:312,k:'slow',slow:true},
  ]};
}
function buildTrace(body,ev){
  const wrap=el('tr');
  ev.spans.forEach(s=>{
    const row=el('tr-row');
    const lbl=el('tr-lbl',s.name); lbl.style.paddingLeft=(s.depth*1.4)+'ch'; row.appendChild(lbl);
    const track=el('tr-track');
    const bar=el('tr-bar'); bar.style.setProperty('--o',s.o+'%'); bar.style.setProperty('--w',s.w+'%');
    if(s.k)bar.dataset.k=s.k; if(s.slow)bar.dataset.state='slow';
    track.appendChild(bar); row.appendChild(track);
    const ms=spn('tr-ms',s.ms+'ms'); if(s.k)ms.dataset.k=s.k+'-d'; row.appendChild(ms);
    wrap.appendChild(row);
  });
  body.appendChild(wrap);
  const cap=el('tr-cap','total '+ev.total+'ms'); cap.dataset.k='cap'; body.appendChild(cap);
}
/* --- SQL query console / EXPLAIN ANALYZE --- */
function sqlData(){
  return {
    query:['SELECT u.id, count(o.id) AS orders','FROM users u JOIN orders o ON o.user_id = u.id',
      'WHERE u.tenant_id = $1','GROUP BY u.id ORDER BY orders DESC LIMIT 50;'],
    plan:[
      {t:'Limit  (cost=18421.7 rows=50)',depth:0,tone:'dim'},
      {t:'Sort  key: orders DESC  (rows=12k)',depth:1,tone:'dim'},
      {t:'HashAggregate  (rows=12k)',depth:2,tone:'dim'},
      {t:'Seq Scan on orders  (cost=12044 rows=1.2M)  no index',depth:3,tone:'warn',k:'scan'},
    ]};
}
function buildSql(body,ev){
  const q=el('sql-q');
  ev.query.forEach(line=>{const ln=el('sql-ql'); ln.appendChild(hiCode(line)); q.appendChild(ln);});
  body.appendChild(q);
  const plan=el('sql-plan');
  ev.plan.forEach(p=>{const ln=el('sql-pl tone-'+(p.tone||'fg'),(p.depth?'  '.repeat(p.depth)+'└ ':'')+p.t);
    if(p.k)ln.dataset.k=p.k; plan.appendChild(ln);});
  body.appendChild(plan);
  const cap=el('sql-cap','planning…'); cap.dataset.k='cap'; body.appendChild(cap);
}
/* --- load test (k6) --- */
function loadPts(){let s='',n=22;for(let i=0;i<n;i++){const x=(i/(n-1))*100,p=i/(n-1);
  const y=31-Math.min(1,p*1.5)*25+(rng()*2-1); s+=x.toFixed(1)+','+Math.max(4,Math.min(32,y)).toFixed(1)+' ';}return s.trim();}
function buildLoad(body){
  const stats=el('lt-stats');
  [['VUs','vu','0'],['req/s','rps','0'],['p95','p95','— ms'],['errors','err','0.00%']].forEach(([t,k,v])=>{
    const s=el('lt-s'); s.appendChild(spn('lt-t',t)); const n=spn('lt-v',v); n.dataset.k=k; s.appendChild(n); stats.appendChild(s);});
  body.appendChild(stats);
  const svg=svgEl('svg',{viewBox:'0 0 100 34',preserveAspectRatio:'none',class:'lt-c'});
  const pts=loadPts();
  svg.appendChild(svgEl('polyline',{class:'lt-area',points:'0,34 '+pts+' 100,34'}));
  svg.appendChild(svgEl('polyline',{class:'lt-line',points:pts}));
  body.appendChild(svg);
  const cap=el('lt-cap','ramping virtual users…'); cap.dataset.k='cap'; body.appendChild(cap);
}
/* --- GitHub PR review / merge --- */
function prPath(){return pick(FILES).split('/').slice(-2).join('/');}
function prData(){
  return {
    prTitle:pick(['refactor: ','feat: ','perf: ','fix: '])+pick(['streaming encoder','idempotency keys','retry backoff','connection pool reuse','tiered cache layer']),
    branch:'hyperion/'+hash(6),
    files:[{name:prPath(),a:ri(20,180),d:ri(4,60)},{name:prPath(),a:ri(10,90),d:ri(2,40)},{name:prPath(),a:ri(3,40),d:ri(0,20)}],
    checks:['build','unit tests','integration','lint','security']};
}
function buildPR(body,ev){
  const head=el('pr-head'); head.appendChild(spn('pr-ti',ev.prTitle));
  const br=el('pr-br'); br.appendChild(spn('pr-b',ev.branch)); br.appendChild(spn('pr-arr',' → ')); br.appendChild(spn('pr-b main','main'));
  head.appendChild(br); body.appendChild(head);
  const files=el('pr-files');
  ev.files.forEach(f=>{const r=el('pr-f'); r.appendChild(spn('pr-fn',f.name));
    const st=el('pr-st'); st.appendChild(spn('pr-add','+'+f.a)); st.appendChild(spn('pr-del','−'+f.d)); r.appendChild(st); files.appendChild(r);});
  body.appendChild(files);
  const checks=el('pr-checks');
  ev.checks.forEach((c,i)=>{const r=el('pr-c'); r.dataset.k='c'+i; r.dataset.state='running';
    r.appendChild(el('pr-cic')); r.appendChild(spn('pr-cn',c)); checks.appendChild(r);});
  body.appendChild(checks);
  const merge=el('pr-merge','checks running…'); merge.dataset.k='merge'; merge.dataset.state='pending'; body.appendChild(merge);
}
/* --- container image build (BuildKit) --- */
function buildDocker(body,ev){
  const list=el('dk'), n=ev.steps.length;
  ev.steps.forEach((s,i)=>{const r=el('dk-r'); r.dataset.k=i; r.dataset.state='pending';
    r.appendChild(el('dk-ic')); r.appendChild(spn('dk-ix','['+(i+1)+'/'+n+']')); r.appendChild(spn('dk-tx',s));
    const st=spn('dk-st'); st.dataset.k=i+'-t'; r.appendChild(st); list.appendChild(r);});
  body.appendChild(list);
  const cap=el('dk-cap','building image…'); cap.dataset.k='cap'; body.appendChild(cap);
}
/* --- full-screen btop: a LIVE system monitor the agent pulls up --- */
const BT_PROCS=['systemd','dockerd','containerd','kubelet','etcd','postgres','redis-server','nginx',
  'envoy','prometheus','node_exporter','vector','vault','consul','sshd','cron','auditd','falco',
  'hyperion-agentd','mythos-engine','otel-collector','containerd-shim','gunicorn'];
function setBar(elm,pct){ const p=Math.max(0,Math.min(100,pct)); elm.style.width=p+'%'; elm.dataset.lvl=p>80?'hi':p>50?'mid':'lo'; }
function buildBtop(body,ev){
  body.classList.add('bt');
  const S={phase:'normal', cores:[], procs:[], hist:[], histN:80, villain:null, pegList:[], disks:[], net:null};
  /* CPU section */
  const cpu=el('bt-sec bt-cpu');
  const top=el('bt-line'); top.appendChild(spn('bt-lbl','CPU'));
  const bar=el('bt-bar'); const fill=el('bt-fill'); bar.appendChild(fill); top.appendChild(bar);
  S.cpuFill=fill; S.cpuPct=spn('bt-pct','0%'); top.appendChild(S.cpuPct);
  S.cpuTmp=spn('bt-tmp','42°C'); top.appendChild(S.cpuTmp); cpu.appendChild(top);
  const cv=document.createElement('canvas'); cv.className='bt-graph'; cpu.appendChild(cv); S.graph=cv;
  const grid=el('bt-cores');
  for(let i=0;i<8;i++){
    const c=el('bt-core'); c.appendChild(spn('bt-cn','C'+i));
    const cb=el('bt-cbar'); const cf=el('bt-cfill'); cb.appendChild(cf); c.appendChild(cb);
    const cp=spn('bt-cpct','0%'); c.appendChild(cp); grid.appendChild(c);
    S.cores.push({cur:U(18,40),base:U(16,40),fill:cf,pct:cp,peg:false});
  }
  cpu.appendChild(grid);
  S.load=el('bt-load'); S.load.textContent='load avg: 2.10 1.84 1.66'; cpu.appendChild(S.load);
  body.appendChild(cpu);
  /* MEM section */
  const mem=el('bt-sec bt-mem');
  const mrow=el('bt-line'); mrow.appendChild(spn('bt-lbl','MEM'));
  const mbar=el('bt-bar'); const mfill=el('bt-fill'); mbar.appendChild(mfill); mrow.appendChild(mbar);
  S.memFill=mfill; S.memPct=spn('bt-pct','0%'); mrow.appendChild(S.memPct);
  S.memGb=spn('bt-tmp','—'); S.memGb.style.width='8ch'; mrow.appendChild(S.memGb);
  mem.appendChild(mrow);
  S.memCur=0.45; S.memTgt=0.45; body.appendChild(mem);
  /* NET section */
  const net=el('bt-sec bt-net');
  const dn=el('bt-nrow'); dn.appendChild(spn('bt-nico dn','▼'));
  S.netDn=spn('bt-nspd','0 KiB/s'); dn.appendChild(S.netDn);
  S.netDnM=spn('bt-nmbps','0 Mbps'); dn.appendChild(S.netDnM);
  S.netDnT=spn('bt-ntot','0 GiB'); dn.appendChild(S.netDnT); net.appendChild(dn);
  const up=el('bt-nrow'); up.appendChild(spn('bt-nico up','▲'));
  S.netUp=spn('bt-nspd','0 KiB/s'); up.appendChild(S.netUp);
  S.netUpM=spn('bt-nmbps','0 Mbps'); up.appendChild(S.netUpM);
  S.netUpT=spn('bt-ntot','0 GiB'); up.appendChild(S.netUpT); net.appendChild(up);
  S.net={dn:U(2,9), up:U(0.5,3), dnTgt:U(2,9), upTgt:U(0.5,3), dnTot:U(420,1900), upTot:U(30,180)};
  body.appendChild(net);
  /* DISK section */
  const disk=el('bt-sec bt-disk');
  [['root',428,93],['var',512,71],['swap',8,18],['boot',1,46]].forEach(d=>{
    const r=el('bt-drow'); r.appendChild(spn('bt-dnm',d[0]));
    const db=el('bt-bar'); const df=el('bt-fill'); db.appendChild(df); r.appendChild(db);
    const gb=spn('bt-dgb',''); r.appendChild(gb);
    const io=spn('bt-dio','0%'); r.appendChild(io); disk.appendChild(r);
    S.disks.push({name:d[0],size:d[1],used:d[2]/100,usedTgt:d[2]/100,io:U(0,6),ioTgt:U(0,6),
      isSwap:d[0]==='swap',fill:df,gb:gb,ioEl:io});
  });
  body.appendChild(disk);
  /* PROC section */
  const proc=el('bt-sec bt-proc');
  const head=el('bt-phead'); ['Pid','Program','Cpu%','Mem'].forEach(h=>head.appendChild(spn('',h))); proc.appendChild(head);
  const wrap=el('bt-procwrap'); proc.appendChild(wrap); S.procWrap=wrap;
  const names=shuffle(BT_PROCS.slice()).slice(0,13);
  names.forEach(nm=>S.procs.push(mkProc(nm, ri(200,99999), U(0.1,6), ri(20,520), false)));
  if(ev.villain){ const v=mkProc(ev.villain.name, ev.villain.pid, U(2,8), ri(60,300), true); S.villain=v; S.procs.push(v); }
  S.pegList=shuffle(S.cores.map((_,i)=>i)).slice(0, ev.peg||4);
  renderProcs(S);
  body.appendChild(proc);
  btopState=S;
}
function mkProc(name,pid,cpu,mem,villain){
  const row=el('bt-prow'+(villain?' bt-villain':''));
  row.appendChild(spn('pid',''+pid)); row.appendChild(spn('pn',name));
  const pc=spn('pc',cpu.toFixed(1)); row.appendChild(pc);
  row.appendChild(spn('pm',mem+'M'));
  return {row,cpuEl:pc,name,pid,cpu,base:cpu,mem,villain,killed:false,spike:false,spikeCpu:0};
}
function renderProcs(S){ S.procWrap.innerHTML=''; S.procs.forEach(p=>S.procWrap.appendChild(p.row)); }
function sizeBtop(){ const S=btopState; if(!S||!S.graph)return; const cv=S.graph;
  cv.width=cv.clientWidth||600; cv.height=cv.clientHeight||70; S.histN=Math.max(20,(cv.width/5)|0); S.ctx=cv.getContext('2d'); }
function btSwap(S){ return S.disks.find(d=>d.isSwap); }
function applyBtopPhase(S){
  if(S.phase==='spike'){
    S.pegList.forEach(i=>S.cores[i].peg=true);
    S.memTgt=U(0.82,0.92); S.netHot=true;
    if(S.villain){ S.villain.spike=true; S.villain.spikeCpu=ri(380,760); }
  } else if(S.phase==='recover'){
    S.cores.forEach(c=>c.peg=false); S.memTgt=U(0.46,0.56); S.netHot=false;
    if(S.villain){ S.villain.spike=false; S.villain.killed=true; S.villain.row.classList.add('bt-dead'); }
  } else if(S.phase==='oom'){
    S.memTgt=U(0.93,0.97); S.swapHot=true;
    const sw=btSwap(S); if(sw) sw.usedTgt=U(0.74,0.96);
    if(S.villain){ S.villain.spike=true; S.villain.spikeCpu=ri(90,220); S.villain.mem=ri(6200,11800); S.villain.row.querySelector('.pm').textContent=(S.villain.mem/1024).toFixed(1)+'G'; }
  } else if(S.phase==='oomkill'){
    S.memTgt=U(0.40,0.52); S.swapHot=false;
    const sw=btSwap(S); if(sw) sw.usedTgt=U(0.10,0.22);
    if(S.villain){ S.villain.spike=false; S.villain.killed=true; S.villain.row.classList.add('bt-dead','bt-oom'); S.villain.row.querySelector('.pn').textContent=S.villain.name+' [OOM killed]'; }
  }
}
function tickBtop(ts){
  const S=btopState; if(!S)return;
  if(ts-btopLast<460)return; btopLast=ts;
  let sum=0;
  S.cores.forEach(c=>{
    const tgt=c.peg?(90+Math.random()*9):(c.base+(Math.random()*16-8));
    c.cur+=(tgt-c.cur)*0.45; c.cur=Math.max(2,Math.min(100,c.cur)); sum+=c.cur;
    setBar(c.fill,c.cur); c.pct.textContent=Math.round(c.cur)+'%';
  });
  const overall=sum/S.cores.length;
  setBar(S.cpuFill,overall); S.cpuPct.textContent=Math.round(overall)+'%';
  S.cpuTmp.textContent=Math.round(40+overall*0.28)+'°C';
  const la=(overall/100*8).toFixed(2);
  S.load.textContent='load avg: '+la+' '+(la*0.92).toFixed(2)+' '+(la*0.85).toFixed(2);
  S.hist.push(overall/100); while(S.hist.length>S.histN)S.hist.shift();
  drawBtopGraph(S);
  S.memCur+=(S.memTgt-S.memCur)*0.35; setBar(S.memFill,S.memCur*100);
  S.memPct.textContent=Math.round(S.memCur*100)+'%'; S.memGb.textContent=(S.memCur*16).toFixed(1)+'/16G';
  tickNet(S); tickDisks(S);
  S.procs.forEach(p=>{
    const tgt=p.killed?0:p.spike?p.spikeCpu:(p.base*(0.6+Math.random()*0.9));
    p.cpu+=(tgt-p.cpu)*0.4; p.cpuEl.textContent=p.cpu.toFixed(1);
  });
  const before=S.procs.map(p=>p.pid).join();
  S.procs.sort((a,b)=>b.cpu-a.cpu);
  if(S.procs.map(p=>p.pid).join()!==before) renderProcs(S);
}
function btSpd(mib){ return mib>=1 ? mib.toFixed(1)+' MiB/s' : Math.round(mib*1024)+' KiB/s'; }
function btTot(gib){ return gib>=1024 ? (gib/1024).toFixed(2)+' TiB' : Math.round(gib)+' GiB'; }
function tickNet(S){ const N=S.net; if(!N)return;
  if(Math.random()<0.30){ N.dnTgt=S.netHot?U(45,135):U(1.5,11); N.upTgt=S.netHot?U(30,110):U(0.4,3.5); }
  N.dn+=(N.dnTgt-N.dn)*0.4; N.up+=(N.upTgt-N.up)*0.4;
  N.dnTot+=N.dn*0.0011; N.upTot+=N.up*0.0011;
  S.netDn.textContent=btSpd(N.dn); S.netDnM.textContent=(N.dn*8.39).toFixed(1)+' Mbps'; S.netDnT.textContent=btTot(N.dnTot);
  S.netUp.textContent=btSpd(N.up); S.netUpM.textContent=(N.up*8.39).toFixed(1)+' Mbps'; S.netUpT.textContent=btTot(N.upTot);
}
function tickDisks(S){ S.disks.forEach(d=>{
    if(Math.random()<0.35) d.ioTgt=(d.isSwap&&S.swapHot)?U(55,98):(d.name==='root'&&Math.random()<0.2?U(20,70):U(0,7));
    d.io+=(d.ioTgt-d.io)*0.45; d.used+=(d.usedTgt-d.used)*0.10;
    setBar(d.fill,d.used*100);
    d.gb.textContent=(d.used*d.size).toFixed(d.size<10?2:0)+'/'+d.size+'G';
    const iv=Math.round(d.io); d.ioEl.textContent=iv+'%'; d.ioEl.dataset.lvl=iv>80?'hi':iv>45?'mid':'lo';
  });
}
function drawBtopGraph(S){
  const x=S.ctx; if(!x)return; const W=S.graph.width,H=S.graph.height;
  x.clearRect(0,0,W,H); const cw=W/S.histN;
  for(let i=0;i<S.hist.length;i++){
    const v=S.hist[i], colH=v*H, cx=i*cw;
    for(let y=H-2;y>H-colH;y-=4){
      const f=(H-y)/H;
      x.fillStyle=f>0.78?'#ff4d4d':f>0.5?'#ffd23f':accentCache;
      x.globalAlpha=0.35+0.6*f; x.fillRect(cx,y,Math.max(1,cw-1.2),2);
    }
  }
  x.globalAlpha=1;
}
function setW(elm,pct){ elm.style.width=Math.max(0,Math.min(100,pct))+'%'; }

/* --- global threat map (DDoS) : stylized dot-grid world + attack arcs --- */
/* low-res landmass bitmap as [startCol,endCol] ranges per row (W=64, H=22) */
const ATTACK_LAND=[
  [[23,26]],
  [[7,15],[23,27],[44,46],[50,60]],
  [[5,17],[24,28],[32,34],[39,60]],
  [[5,18],[24,28],[30,37],[39,61]],
  [[6,18],[30,38],[40,62]],
  [[7,18],[31,37],[40,59]],
  [[9,18],[31,39],[42,58]],
  [[11,17],[30,40],[42,47],[50,57]],
  [[13,17],[31,41],[43,49],[51,57]],
  [[14,17],[31,42],[45,49],[52,58]],
  [[15,20],[32,42],[53,58]],
  [[16,22],[33,41],[54,58]],
  [[16,23],[33,40]],
  [[17,23],[34,39]],
  [[17,24],[35,39],[53,60]],
  [[17,23],[35,38],[52,61]],
  [[18,23],[54,60]],
  [[18,22],[55,59]],
  [[18,21]],
  [[18,20]],
  [[18,20]],
  [[18,19]]
];
function amXY(col,row){ return [col*2, row*2+3]; }
function buildAttack(body,ev){
  body.classList.add('am');
  const svg=svgEl('svg',{viewBox:'0 0 128 48',class:'am-map',preserveAspectRatio:'xMidYMid meet'});
  const dg=svgEl('g',{class:'am-land'});
  ATTACK_LAND.forEach((ranges,r)=>ranges.forEach(([a,b])=>{
    for(let c=a;c<=b;c++){ const [x,y]=amXY(c,r); dg.appendChild(svgEl('circle',{cx:x,cy:y,r:0.6,class:'am-dot'})); }
  }));
  svg.appendChild(dg);
  const [tx,ty]=amXY(ev.target[0],ev.target[1]);
  const ag=svgEl('g',{class:'am-arcs'});
  ev.sources.forEach((s,i)=>{
    const [sx,sy]=amXY(s[0],s[1]);
    const dist=Math.hypot(tx-sx,ty-sy), cx=(sx+tx)/2, cy=Math.min(sy,ty)-dist*0.42;
    const d='M'+sx.toFixed(1)+' '+sy.toFixed(1)+' Q'+cx.toFixed(1)+' '+cy.toFixed(1)+' '+tx.toFixed(1)+' '+ty.toFixed(1);
    ag.appendChild(svgEl('path',{d:d,class:'am-arcbg','data-k':'arc'}));
    const p=svgEl('path',{d:d,class:'am-arc','data-k':'arc'}); p.style.animationDelay=(i*0.17).toFixed(2)+'s'; ag.appendChild(p);
    ag.appendChild(svgEl('circle',{cx:sx,cy:sy,r:1.3,class:'am-src','data-k':'arc'}));
  });
  svg.appendChild(ag);
  const tg=svgEl('g',{class:'am-target'});
  tg.appendChild(svgEl('circle',{cx:tx,cy:ty,r:2.7,class:'am-tring'}));
  tg.appendChild(svgEl('circle',{cx:tx,cy:ty,r:1.4,class:'am-tdot'}));
  svg.appendChild(tg);
  body.appendChild(svg);
  const st=el('am-stats');
  function stat(t,k,v){ const s=el('am-s'); s.appendChild(spn('am-t',t)); const n=spn('am-v',v); n.dataset.k=k; s.appendChild(n); return s; }
  st.appendChild(stat('INBOUND','in','—'));
  st.appendChild(stat('BLOCKED','blk','0'));
  const cs=el('am-s am-grow'); const cap=spn('am-cap','monitoring edge…'); cap.dataset.k='cap'; cs.appendChild(cap); st.appendChild(cs);
  body.appendChild(st);
}

/* --- GPU training farm (nvidia-smi grid) : a live ticker scene --- */
function tempLvl(t){ return t>86?'hi':t>74?'mid':'lo'; }
function buildGpu(body,ev){
  body.classList.add('gpu');
  const model=(ev.model||'8× A100').replace(/^\d+×\s*/,'');
  const head=el('gpu-head'); head.appendChild(spn('gpu-ht','GPU CLUSTER · '+(ev.model||'8× A100')+' · '+(ev.host||'dgx-01')));
  const thr=spn('gpu-thr','— tok/s'); thr.dataset.k='thr'; head.appendChild(thr); body.appendChild(head);
  const grid=el('gpu-grid'); const cards=[];
  for(let i=0;i<8;i++){
    const card=el('gpu-card');
    const top=el('gpu-ctop'); top.appendChild(spn('gpu-ci','GPU'+i)); top.appendChild(spn('gpu-cm',model));
    const bd=spn('gpu-bd',''); top.appendChild(bd); card.appendChild(top);
    function row(lbl,fillCls){ const r=el('gpu-row'); r.appendChild(spn('gpu-rl',lbl)); const b=el('gpu-bar'); const f=el('gpu-fill'+(fillCls?' '+fillCls:'')); b.appendChild(f); r.appendChild(b); const v=spn('gpu-rv','0%'); r.appendChild(v); card.appendChild(r); return {f,v}; }
    const u=row('util',''); const m=row('mem','mem');
    const foot=el('gpu-foot'); const tpv=spn('gpu-temp','—°C'); const wv=spn('gpu-watt','—W'); foot.appendChild(tpv); foot.appendChild(wv); card.appendChild(foot);
    grid.appendChild(card);
    cards.push({card,uf:u.f,up:u.v,mf:m.f,mp:m.v,tpv,wv,bd, util:U(82,96),uBase:U(84,95), mem:U(0.6,0.8),mTgt:U(0.62,0.82), temp:U(58,68), hot:false,throttled:false});
  }
  body.appendChild(grid);
  const cap=el('gpu-cap','training step '+grp(ri(10000,90000))+' · all GPUs nominal'); cap.dataset.k='cap'; body.appendChild(cap);
  liveState={kind:'gpu',last:0,cards,hotIdx:(ev.hot!=null?ev.hot:0),thrEl:thr,
    tick(ts){ if(ts-this.last<360)return; this.last=ts; let sum=0;
      this.cards.forEach(c=>{
        let utgt = (c.hot&&c.throttled)?(26+Math.random()*12) : c.hot?(96+Math.random()*3) : (c.uBase+(Math.random()*8-4));
        c.util+=(utgt-c.util)*0.4; c.util=clamp(c.util,0,100);
        c.temp+=((38+c.util*0.42+(c.hot?26:0))-c.temp)*0.18;
        if(c.hot&&c.temp>86) c.throttled=true;
        c.mem+=(c.mTgt-c.mem)*0.3;
        setW(c.uf,c.util); c.up.textContent=Math.round(c.util)+'%';
        setW(c.mf,c.mem*100); c.mp.textContent=Math.round(c.mem*100)+'%';
        c.tpv.textContent=Math.round(c.temp)+'°C'; c.tpv.dataset.lvl=tempLvl(c.temp);
        c.wv.textContent=Math.round(70+c.util*3.1+(c.hot?60:0))+'W';
        c.card.dataset.state=c.throttled?'throttle':c.hot?'hot':'ok';
        c.bd.textContent=c.throttled?'⚠ THROTTLE':'';
        sum+=c.util;
      });
      this.thrEl.textContent=compactNum(Math.round(sum/8*48))+' tok/s';
    },
    phase(p){
      const c=this.cards[this.hotIdx]; if(!c)return;
      if(p==='spike'){ c.hot=true; c.mTgt=U(0.9,0.97); }
      else if(p==='recover'){ c.hot=false; c.throttled=false; c.uBase=U(6,14); c.mTgt=U(0.18,0.3);
        this.cards.forEach((o,i)=>{ if(i!==this.hotIdx) o.uBase=clamp(o.uBase+U(1,4),0,99); }); }
    }
  };
}

/* --- Postgres streaming-replication cluster (Patroni) : primary dies, a replica is promoted, WAL catches up --- */
function fmtLag(mb){ return mb<1?Math.round(mb*1024)+' KB':mb.toFixed(1)+' MB'; }
function pgNodes(){
  const region=pick(['us-east-1','us-west-2','eu-west-1','ap-south-1','eu-central-1']);
  const azs=shuffle(['a','b','c','a','b']);
  return [0,1,2,3].map(i=>({id:'db-'+i+' · '+region+azs[i],role:i===0?'PRIMARY':'replica',lag:i===0?0:U(0.3,3.4)}));
}
function buildPgrepl(body,ev){
  body.classList.add('pgr');
  const head=el('pgr-head'); head.appendChild(spn('pgr-ht','PATRONI · streaming replication · '+ev.nodes.length+' nodes')); body.appendChild(head);
  const tbl=el('pgr-tbl');
  const hr=el('pgr-row pgr-hr'); ['NODE','ROLE','STATE','WAL LAG'].forEach(h=>hr.appendChild(spn('pgr-c',h))); tbl.appendChild(hr);
  ev.nodes.forEach((n,i)=>{
    const row=el('pgr-row'); row.dataset.k='r'+i; row.dataset.state=i===0?'leader':'streaming';
    row.appendChild(spn('pgr-c pgr-nm',n.id));
    const role=spn('pgr-c pgr-role',n.role); role.dataset.k='r'+i+'-role'; row.appendChild(role);
    const st=spn('pgr-c pgr-st',i===0?'leader · streaming':'streaming'); st.dataset.k='r'+i+'-st'; row.appendChild(st);
    const lag=spn('pgr-c pgr-lag',i===0?'—':fmtLag(n.lag)); lag.dataset.k='r'+i+'-lag'; row.appendChild(lag);
    tbl.appendChild(row);
  });
  body.appendChild(tbl);
  const cap=el('pgr-cap',ev.nodes.length+' nodes · 1 primary · '+(ev.nodes.length-1)+' replicas streaming'); cap.dataset.k='cap'; body.appendChild(cap);
}
/* --- service mesh (Kiali) with traffic flowing along the edges --- */
function meshNodes(){ return [
  {x:30,y:92,l:'gateway'},{x:116,y:46,l:'productpage'},{x:116,y:138,l:'orders'},
  {x:212,y:38,l:'reviews'},{x:212,y:96,l:'ratings'},{x:212,y:150,l:'payments'},{x:296,y:96,l:'postgres'}
];}
function buildMesh(body,ev){
  const svg=svgEl('svg',{viewBox:'0 0 320 188',class:'mesh'});
  const N=ev.nodes;
  ev.edges.forEach(([a,b],i)=>{
    const p=N[a],q=N[b], id='me'+i, d='M'+p.x+' '+p.y+' L'+q.x+' '+q.y;
    const g=svgEl('g',{class:'mesh-eg','data-k':'e'+i});
    g.appendChild(svgEl('path',{id:id,d:d,class:'mesh-edge'}));
    if(!reduceMotion){ for(let j=0;j<2;j++){
      const c=svgEl('circle',{r:1.9,class:'mesh-pkt'});
      const am=svgEl('animateMotion',{dur:(1.25+i*0.06).toFixed(2)+'s',repeatCount:'indefinite',begin:(j*0.62).toFixed(2)+'s'});
      am.appendChild(svgEl('mpath',{href:'#'+id})); c.appendChild(am); g.appendChild(c);
    } }
    svg.appendChild(g);
  });
  N.forEach((n,i)=>{
    const g=svgEl('g',{class:'mesh-node','data-k':'n'+i});
    const r=n.l.length>8?13:11;
    g.appendChild(svgEl('circle',{cx:n.x,cy:n.y,r:r,class:'mesh-c'}));
    const t=svgEl('text',{x:n.x,y:n.y+r+9,'text-anchor':'middle',class:'mesh-lbl'}); t.textContent=n.l;
    g.appendChild(t); svg.appendChild(g);
  });
  body.appendChild(svg);
  const cap=el('mesh-cap','7 services · mTLS · '+grp(ri(2000,9000))+' req/s'); cap.dataset.k='cap'; body.appendChild(cap);
}

/* --- kafka consumer-group lag : a bar-per-partition live ticker (spike localizes to a few partitions) --- */
const KAFKA_PARTS=12;
function buildKafka(body,ev){
  body.classList.add('kafka');
  const head=el('kafka-head'); head.appendChild(spn('kafka-ht','CONSUMER LAG · '+ev.topic+' · '+KAFKA_PARTS+' partitions'));
  const lag=spn('kafka-lag','— lag'); lag.dataset.k='thr'; head.appendChild(lag); body.appendChild(head);
  const grid=el('kafka-grid'); const rows=[];
  for(let i=0;i<KAFKA_PARTS;i++){
    const r=el('kafka-row'); r.appendChild(spn('kafka-pl','P'+i));
    const bar=el('kafka-bar'); const fill=el('kafka-fill'); bar.appendChild(fill); r.appendChild(bar);
    const v=spn('kafka-pv','0'); r.appendChild(v); grid.appendChild(r);
    rows.push({fill,v,lag:U(20,300),base:U(20,300),tgt:U(20,300)});
  }
  body.appendChild(grid);
  const cap=el('kafka-cap','all partitions caught up · lag < 1k'); cap.dataset.k='cap'; body.appendChild(cap);
  const hotIdx=shuffle(rows.map((_,i)=>i)).slice(0,ri(3,4));
  liveState={kind:'kafka',last:0,rows,hot:0,hotIdx,lagEl:lag,maxLag:6000,
    tick(ts){ if(ts-this.last<320)return; this.last=ts; let sum=0;
      this.rows.forEach((r,i)=>{
        if(this.hot && this.hotIdx.includes(i)) r.tgt=U(0.6,0.98)*this.maxLag;
        else if(Math.random()<0.3) r.tgt=r.base*(0.5+Math.random());
        r.lag+=(r.tgt-r.lag)*0.25; r.lag=Math.max(0,r.lag);
        const frac=clamp(r.lag/this.maxLag,0,1);
        setW(r.fill,frac*100); r.fill.dataset.lvl=frac>0.66?'hi':frac>0.33?'mid':'lo';
        r.v.textContent=compactNum(Math.round(r.lag)); sum+=r.lag;
      });
      this.lagEl.textContent=compactNum(Math.round(sum))+' lag';
    },
    phase(p){
      if(p==='spike'){ this.maxLag=ri(2000000,9000000); this.hot=1; }
      else if(p==='recover'){ this.hot=0; this.maxLag=6000; this.rows.forEach(r=>{ r.base=U(20,300); r.tgt=r.base; }); }
    }
  };
}
/* --- vim hero session : a faux terminal-vim the agent flies through (writes nothing) --- */
function buildVim(body,ev){
  body.classList.add('vim');
  const pane=el('vim-pane');
  let src=genSnippet(ev.file).lines.slice();
  while(src.length<15) src=src.concat(['','  // '+pick(['TODO: handle the empty batch','guard against negative TTL','fence the stale read','retry with jitter'])],genSnippet(ev.file).lines);
  src=src.slice(0,15);
  src.forEach((line,i)=>{
    const vl=el('vl');
    const ln=spn('vim-ln',String(i+1)); ln.dataset.k='ln-'+i; vl.appendChild(ln);
    const code=spn('vim-src'); code.dataset.k='src-'+i; code.appendChild(hiCode(line)); vl.appendChild(code);
    pane.appendChild(vl);
  });
  for(let i=0;i<3;i++){ const vl=el('vl vim-tilde'); vl.appendChild(spn('vim-ln','~')); pane.appendChild(vl); }
  const cur=el('vim-cur'); cur.dataset.k='cur'; cur.style.setProperty('--row',0); pane.appendChild(cur);
  body.appendChild(pane);
  const st=el('vim-status');
  const mode=spn('vim-mode','-- NORMAL --'); mode.dataset.k='mode'; st.appendChild(mode);
  const cmd=spn('vim-cmd',''); cmd.dataset.k='cmd'; st.appendChild(cmd);
  const ruler=spn('vim-ruler','1,1   Top'); ruler.dataset.k='ruler'; st.appendChild(ruler);
  body.appendChild(st);
}
/* --- tmux split-pane war room : 2×2 panes, one goes red, the agent jumps to it --- */
function buildTmux(body,ev){
  body.classList.add('tmux');
  const grid=el('tmux-grid');
  ev.panes.forEach((p,i)=>{
    const pane=el('tmux-pane'); pane.dataset.k='p'+i; pane.dataset.state=i===0?'active':'idle';
    const hd=el('tmux-ph',i+':'+p.name); pane.appendChild(hd);
    const bd=el('tmux-pb');
    p.lines.forEach(l=>bd.appendChild(el('tmux-l',l)));
    const stat=el('tmux-l tmux-ps',p.stat||'…'); stat.dataset.k='p'+i+'-s'; bd.appendChild(stat);
    pane.appendChild(bd); grid.appendChild(pane);
  });
  body.appendChild(grid);
  const bar=el('tmux-bar');
  bar.appendChild(spn('tmux-sess','['+ev.session+']'));
  const tabs=spn('tmux-tabs',ev.panes.map((p,i)=>i+':'+p.name+(i===0?'*':'')).join('  ')); tabs.dataset.k='tabs'; bar.appendChild(tabs);
  bar.appendChild(spn('tmux-clock','03:'+String(ri(10,59)).padStart(2,'0')));
  body.appendChild(bar);
}
/* --- DNS propagation table : resolver → answer → TTL, stale until it converges --- */
function dnsResolvers(){
  return [
    {name:'8.8.8.8'},{name:'1.1.1.1'},{name:'9.9.9.9'},
    {name:'ns1.authoritative'},{name:'resolver.us-east'},{name:'resolver.ap-south'},
  ];
}
function buildDns(body,ev){
  body.classList.add('dns');
  const head=el('dns-head'); head.appendChild(spn('dns-ht','dig '+ev.record+' · propagation across resolvers')); body.appendChild(head);
  const tbl=el('dns-tbl');
  const hr=el('dns-row dns-hr'); ['RESOLVER','ANSWER','TTL'].forEach(h=>hr.appendChild(spn('dns-c',h))); tbl.appendChild(hr);
  ev.resolvers.forEach((r,i)=>{
    const row=el('dns-row'); row.dataset.k='r'+i; row.dataset.state='stale';
    row.appendChild(spn('dns-c dns-rs',r.name));
    const ans=spn('dns-c dns-ans',ev.oldIp); ans.dataset.k='r'+i+'-a'; row.appendChild(ans);
    const ttl=spn('dns-c dns-ttl','—'); ttl.dataset.k='r'+i+'-t'; row.appendChild(ttl);
    tbl.appendChild(row);
  });
  body.appendChild(tbl);
  const cap=el('dns-cap','querying authoritative…'); cap.dataset.k='cap'; body.appendChild(cap);
}
/* --- latency heatmap (scrolling canvas) : a live ticker scene --- */
const HEAT_BANDS=['p50','p75','p90','p95','p99','p99.9'];
function heatColor(v){
  v=clamp(v,0,1);
  if(v<0.4){ const t=v/0.4; return 'rgb('+Math.round(18+t*22)+','+Math.round(58+t*120)+','+Math.round(92+t*36)+')'; }
  if(v<0.7){ const t=(v-0.4)/0.3; return 'rgb('+Math.round(40+t*200)+','+Math.round(180+t*28)+','+Math.round(72-t*42)+')'; }
  const t=(v-0.7)/0.3; return 'rgb('+Math.round(240+t*15)+','+Math.round(150-t*120)+','+Math.round(40-t*22)+')';
}
function buildHeat(body,ev){
  body.classList.add('heat');
  const head=el('heat-head'); head.appendChild(spn('heat-ht','LATENCY HEATMAP · gateway · p50–p99.9'));
  head.appendChild(spn('heat-sub','last 5m')); body.appendChild(head);
  const wrap=el('heat-wrap');
  const yax=el('heat-y'); for(let i=HEAT_BANDS.length-1;i>=0;i--) yax.appendChild(el('heat-yl',HEAT_BANDS[i]));
  wrap.appendChild(yax);
  const cv=document.createElement('canvas'); cv.className='heat-cv'; wrap.appendChild(cv);
  body.appendChild(wrap);
  const cap=el('heat-cap','p99.9 within SLO'); cap.dataset.k='cap'; body.appendChild(cap);
  liveState={kind:'heat',last:0,cv,ctx:null,cols:[],nCols:64,rows:HEAT_BANDS.length,hot:0,
    tick(ts){ if(ts-this.last<150)return; this.last=ts;
      if(!this.ctx||this.cv.width===0){ this.cv.width=this.cv.clientWidth||640; this.cv.height=this.cv.clientHeight||130; this.ctx=this.cv.getContext('2d'); this.nCols=Math.max(28,(this.cv.width/9)|0); }
      const col=[];
      for(let r=0;r<this.rows;r++){ const tail=r/(this.rows-1);
        let v=0.1+tail*0.16+Math.random()*0.12;
        if(this.hot) v+=tail*tail*(0.55+Math.random()*0.3);
        col.push(clamp(v,0,1));
      }
      this.cols.push(col); while(this.cols.length>this.nCols)this.cols.shift();
      this.draw();
    },
    draw(){ const x=this.ctx,W=this.cv.width,H=this.cv.height; x.clearRect(0,0,W,H);
      const cw=W/this.nCols, ch=H/this.rows;
      for(let i=0;i<this.cols.length;i++){ const c=this.cols[i];
        for(let r=0;r<this.rows;r++){ x.fillStyle=heatColor(c[r]); x.fillRect(i*cw,H-(r+1)*ch,Math.ceil(cw),Math.ceil(ch)-1); } }
    },
    phase(p){ this.hot = p==='spike'?1:0; }
  };
}
/* --- replication-lag wave (scrolling canvas) : a spike that travels row-to-row, then drains in reverse --- */
const REPL_ROWS=['primary','replica-1','replica-2','replica-3','replica-4','replica-5'];
function buildRepl(body,ev){
  body.classList.add('heat');
  const head=el('heat-head'); head.appendChild(spn('heat-ht','REPLICATION LAG · '+(ev.cluster||'orders-db')+' · '+REPL_ROWS.length+' nodes'));
  head.appendChild(spn('heat-sub','last 5m')); body.appendChild(head);
  const wrap=el('heat-wrap');
  const yax=el('heat-y'); for(let i=REPL_ROWS.length-1;i>=0;i--) yax.appendChild(el('heat-yl',REPL_ROWS[i]));
  wrap.appendChild(yax);
  const cv=document.createElement('canvas'); cv.className='heat-cv'; wrap.appendChild(cv);
  body.appendChild(wrap);
  const cap=el('heat-cap','all replicas in sync · lag < 1s'); cap.dataset.k='cap'; body.appendChild(cap);
  liveState={kind:'repl',last:0,cv,ctx:null,cols:[],nCols:64,rows:REPL_ROWS.length,front:-1.5,dir:0,
    tick(ts){ if(ts-this.last<150)return; this.last=ts;
      if(!this.ctx||this.cv.width===0){ this.cv.width=this.cv.clientWidth||640; this.cv.height=this.cv.clientHeight||130; this.ctx=this.cv.getContext('2d'); this.nCols=Math.max(28,(this.cv.width/9)|0); }
      if(this.dir){ this.front+=this.dir*0.5;                                  // the wave front climbs (spike) or recedes (recover)
        if(this.front>this.rows+0.5) this.front=this.rows+0.5;
        if(this.front<-1.5){ this.front=-1.5; this.dir=0; } }
      const col=[];
      for(let r=0;r<this.rows;r++){
        let v=0.08+Math.random()*0.1;                                          // quiet baseline lag
        const d=this.front-r;                                                  // ticks since the front passed this node
        if(d>=0){ const edge=Math.max(0,0.9-d*0.18); v=0.5+edge*0.45+Math.random()*0.08; }  // bright leading edge, warm body behind
        col.push(clamp(v,0,1));
      }
      this.cols.push(col); while(this.cols.length>this.nCols)this.cols.shift();
      this.draw();
    },
    draw(){ const x=this.ctx,W=this.cv.width,H=this.cv.height; x.clearRect(0,0,W,H);
      const cw=W/this.nCols, ch=H/this.rows;
      for(let i=0;i<this.cols.length;i++){ const c=this.cols[i];
        for(let r=0;r<this.rows;r++){ x.fillStyle=heatColor(c[r]); x.fillRect(i*cw,H-(r+1)*ch,Math.ceil(cw),Math.ceil(ch)-1); } }
    },
    phase(p){ this.dir = p==='spike'?1:-1; }                                   // spike → climb the chain, recover → drain in reverse
  };
}
/* --- thermal / power throttle map (scrolling canvas) : a column of dies redlines --- */
const THERMAL_ROWS=['die7','die6','die5','die4','die3','die2','die1','die0'];
function buildThermal(body,ev){
  body.classList.add('heat');
  const head=el('heat-head'); head.appendChild(spn('heat-ht','THERMAL MAP · '+(ev.host||'rack-07')+' · '+THERMAL_ROWS.length+' dies °C'));
  head.appendChild(spn('heat-sub','last 5m')); body.appendChild(head);
  const wrap=el('heat-wrap');
  const yax=el('heat-y'); THERMAL_ROWS.forEach(l=>yax.appendChild(el('heat-yl',l)));
  wrap.appendChild(yax);
  const cv=document.createElement('canvas'); cv.className='heat-cv'; wrap.appendChild(cv);
  body.appendChild(wrap);
  const cap=el('heat-cap','all dies nominal · < 70°C'); cap.dataset.k='cap'; body.appendChild(cap);
  liveState={kind:'thermal',last:0,cv,ctx:null,cols:[],nCols:64,rows:THERMAL_ROWS.length,hot:0,hotRow:(ev.hot!=null?ev.hot:0),
    tick(ts){ if(ts-this.last<150)return; this.last=ts;
      if(!this.ctx||this.cv.width===0){ this.cv.width=this.cv.clientWidth||640; this.cv.height=this.cv.clientHeight||152; this.ctx=this.cv.getContext('2d'); this.nCols=Math.max(28,(this.cv.width/9)|0); }
      const col=[];
      for(let r=0;r<this.rows;r++){
        let v=0.27+Math.random()*0.1;                                     // warm baseline (~60s °C)
        if(this.hot && (r===this.hotRow||r===this.hotRow+1)) v=0.88+Math.random()*0.12;   // a column of dies redlines
        col.push(clamp(v,0,1));
      }
      this.cols.push(col); while(this.cols.length>this.nCols)this.cols.shift();
      this.draw();
    },
    draw(){ const x=this.ctx,W=this.cv.width,H=this.cv.height; x.clearRect(0,0,W,H);
      const cw=W/this.nCols, ch=H/this.rows;
      for(let i=0;i<this.cols.length;i++){ const c=this.cols[i];
        for(let r=0;r<this.rows;r++){ x.fillStyle=heatColor(c[r]); x.fillRect(i*cw,H-(r+1)*ch,Math.ceil(cw),Math.ceil(ch)-1); } }
    },
    phase(p){ this.hot = p==='spike'?1:0; }
  };
}
/* --- cpu utilization by core (scrolling canvas) : noisy-neighbor scene --- */
const CPU_CORES=16;
function buildCpu(body,ev){
  body.classList.add('heat');
  const head=el('heat-head'); head.appendChild(spn('heat-ht','CPU UTILIZATION · per-core · '+CPU_CORES+' threads'));
  head.appendChild(spn('heat-sub','last 90s')); body.appendChild(head);
  const wrap=el('heat-wrap');
  const yax=el('heat-y'); for(let i=CPU_CORES-1;i>=0;i--) yax.appendChild(el('heat-yl','c'+i));
  wrap.appendChild(yax);
  const cv=document.createElement('canvas'); cv.className='heat-cv'; wrap.appendChild(cv);
  body.appendChild(wrap);
  const cap=el('heat-cap','all cores nominal'); cap.dataset.k='cap'; body.appendChild(cap);
  const base=[]; for(let r=0;r<CPU_CORES;r++) base.push(0.06+rng()*0.1);
  for(let k=0;k<2;k++) base[(rng()*CPU_CORES)|0]=0.22+rng()*0.12;   // a couple of cores look alive
  liveState={kind:'cpu',last:0,cv,ctx:null,cols:[],nCols:64,rows:CPU_CORES,hot:0,hotRow:(ev.hot!=null?ev.hot:0),base,
    tick(ts){ if(ts-this.last<150)return; this.last=ts;
      if(!this.ctx||this.cv.width===0){ this.cv.width=this.cv.clientWidth||640; this.cv.height=this.cv.clientHeight||152; this.ctx=this.cv.getContext('2d'); this.nCols=Math.max(28,(this.cv.width/9)|0); }
      const col=[];
      for(let r=0;r<this.rows;r++){
        let v = this.hot&&r===this.hotRow ? 0.93+Math.random()*0.07 : this.base[r]+Math.random()*0.12;   // one core pinned, rest idle
        col.push(clamp(v,0,1));
      }
      this.cols.push(col); while(this.cols.length>this.nCols)this.cols.shift();
      this.draw();
    },
    draw(){ const x=this.ctx,W=this.cv.width,H=this.cv.height; x.clearRect(0,0,W,H);
      const cw=W/this.nCols, ch=H/this.rows;
      for(let i=0;i<this.cols.length;i++){ const c=this.cols[i];
        for(let r=0;r<this.rows;r++){ x.fillStyle=heatColor(c[r]); x.fillRect(i*cw,H-(r+1)*ch,Math.ceil(cw),Math.ceil(ch)-1); } }
    },
    phase(p){ this.hot = p==='spike'?1:0; }
  };
}
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
  yield L(rethink(),'warn',{wait:U(700,1400)});
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
  yield L(rethink(),'warn',{wait:U(700,1400)});
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
  yield L(rethink(),'warn',{wait:U(800,1500)});
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
  yield L(rethink(),'warn',{wait:U(800,1500)});
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
  yield L(rethink(),'warn',{wait:U(800,1500)});
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
  yield L(rethink(),'warn',{wait:U(800,1500)});
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
  yield L(rethink(),'warn',{wait:U(800,1500)});
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
function* dRepl(){
  const cluster=pick(['orders-db','ledger-pg','users-pg','events-ch','inventory-db'])+'·'+pick(['us-east','eu-west','ap-south']);
  yield OV('app',{tool:'repl',title:'replication lag · '+cluster,url:'grafana.internal/d/'+hash(6),cluster});
  yield L('▌ Pulling up the replication topology — a follower feels behind','accent',{wait:U(700,1100)});
  yield WAIT(U(1500,2100));
  beep('alert');
  yield OV('livefx',{phase:'spike'});
  yield WAIT(U(1000,1500));
  const lag=ri(9,42);
  yield OV('appstep',{k:'cap',text:'⚠ replication lag '+lag+'s — the wave is sweeping primary→replicas'});
  yield L('⚠ lag cascading through the chain — '+lag+'s behind and climbing replica by replica','err',{wait:U(1000,1600)});
  yield THINK();
  yield L(rethink(),'warn',{wait:U(800,1500)});
  yield TOOL('Bash','repmgr standby promote && repmgr standby follow --upstream-node-id='+ri(2,5));
  yield OUT('promoting a healthy standby · re-pointing followers · draining the backlog','dim',{burst:true});
  yield WAIT(U(1600,2200));
  yield OV('livefx',{phase:'recover'});
  yield OV('appstep',{k:'cap',text:'✓ lag draining in reverse · '+ri(0,1)+'.'+ri(1,9)+'s across all replicas'});
  beep('ok');
  yield L('✔ failover clean — the wave drained back through the chain, fleet caught up','ok',{wait:U(1000,1600)});
  yield CNT('incidents',1);
  yield WAIT(U(1400,2000));
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
  yield L(rethink(),'warn',{wait:U(700,1200)});
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
  yield L(rethink(),'warn',{wait:U(800,1500)});
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
function* dPgFailover(){
  const nodes=pgNodes();
  // heir: the replica (index>0) sitting closest to the primary's WAL position
  const heir=nodes.map((n,i)=>[i,n.lag]).filter(([i])=>i>0).sort((a,b)=>a[1]-b[1])[0][0];
  yield OV('app',{tool:'pgrepl',title:'patroni · '+(cfg.project||'core')+'-db · prod',url:'',nodes});
  yield L('▌ Inspecting the Postgres replication cluster','accent',{wait:U(700,1100)});
  yield WAIT(U(900,1400));
  beep('alert');
  yield OV('appstep',{k:'r0',state:'down'});
  yield OV('appstep',{k:'r0-st',text:'unreachable'});
  yield OV('appstep',{k:'r0-lag',text:'— '});
  yield OV('appstep',{k:'cap',text:'⚠ primary db-0 down · leader lease expired · cluster has no writer'});
  yield L('⚠ primary db-0 went dark — leader lease expired, no node accepting writes','err',{wait:U(1000,1600)});
  yield THINK();
  yield L(pick(['Patroni is holding the election — picking the most caught-up replica.','Comparing replica WAL positions — promoting the one with least lag.','DCS lock released — fencing the old primary before promoting a new one.']),'warn',{wait:U(900,1500)});
  for(let i=1;i<nodes.length;i++) yield OV('appstep',{k:'r'+i,state:'vote'});
  yield WAIT(U(700,1100));
  yield OV('appstep',{k:'r'+heir,state:'promote'});
  yield OV('appstep',{k:'r'+heir+'-st',text:'promoting…'});
  yield OV('appstep',{k:'cap',text:'⚑ promoting '+nodes[heir].id+' — most caught up ('+fmtLag(nodes[heir].lag)+' behind)'});
  yield TOOL('Bash','patronictl failover '+(cfg.project||'core')+'-db --candidate '+nodes[heir].id+' --force');
  yield OUT('pg_promote() · timeline bumped to '+ri(7,29)+' · accepting writes','dim',{burst:true});
  yield WAIT(U(1000,1500));
  yield OV('appstep',{k:'r'+heir,state:'leader'});
  yield OV('appstep',{k:'r'+heir+'-role',text:'PRIMARY'});
  yield OV('appstep',{k:'r'+heir+'-st',text:'leader · streaming'});
  yield OV('appstep',{k:'r'+heir+'-lag',text:'—'});
  beep('ok');
  yield L('✔ '+nodes[heir].id+' promoted to primary — writes flowing again','ok',{wait:U(900,1400)});
  // surviving replicas re-point at the new leader; lag jumps on reconnect, then drains
  const others=nodes.map((_,i)=>i).filter(i=>i!==heir&&i!==0);
  yield L('↻ re-pointing replicas at the new primary — replaying WAL to catch up','warn',{wait:U(800,1300)});
  for(const i of others){
    yield OV('appstep',{k:'r'+i,state:'sync'});
    yield OV('appstep',{k:'r'+i+'-st',text:'syncing WAL'});
    yield OV('appstep',{k:'r'+i+'-lag',text:fmtLag(U(3,12))});
  }
  yield WAIT(U(900,1400));
  // old primary comes back and rejoins as a replica via pg_rewind
  yield OV('appstep',{k:'r0',state:'sync'});
  yield OV('appstep',{k:'r0-role',text:'replica'});
  yield OV('appstep',{k:'r0-st',text:'pg_rewind'});
  yield OV('appstep',{k:'r0-lag',text:fmtLag(U(8,24))});
  yield TOOL('Bash','pg_rewind --source-server="host='+nodes[heir].id+'" && systemctl start patroni');
  yield OUT('old primary rejoining as replica · rewinding divergent WAL','dim',{burst:true});
  yield WAIT(U(1000,1500));
  const drain=shuffle(others.concat([0]));
  let caught=0;
  for(const i of drain){
    yield OV('appstep',{k:'r'+i,state:'streaming'});
    yield OV('appstep',{k:'r'+i+'-st',text:'streaming'});
    yield OV('appstep',{k:'r'+i+'-lag',text:'0 B'});
    caught++;
    yield OV('appstep',{k:'cap',text:'WAL replay catching up · '+caught+'/'+drain.length+' replicas in sync',wait:U(280,520)});
    beep('tick');
  }
  yield OV('appstep',{k:'cap',text:'✓ cluster healthy · '+nodes[heir].id+' primary · '+drain.length+' replicas streaming · 0 lag'});
  beep('ok');
  yield L('✔ failover complete — new primary elected, every replica caught up, zero data lost','ok',{wait:U(1000,1600)});
  yield CNT('incidents',1);
  yield WAIT(U(1200,1800));
  yield OV('close',{wait:U(700,1100)});
}
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
function* dMergeConflict(){
  const branch=pick(['feature/'+pick(['streaming','multi-region','zero-downtime','crdt-merge']),'epic/rewrite-'+pick(['auth','ledger','scheduler'])]);
  const files=shuffle(FILES.slice()).slice(0,ri(4,8));
  yield OV('open',{type:'anomaly'});
  yield OV('banner',{cls:'err pulse',text:'⚠ MERGE CONFLICT — '+files.length+' files · '+branch+' ⇆ main',wait:U(300,600)});
  beep('alert');
  yield L('▌ Merging '+branch+' into main','accent',{wait:U(500,900)});
  yield TOOL('Bash','git merge --no-ff '+branch);
  yield OUT('Auto-merging '+files.length+' paths…','dim',{burst:true});
  yield OUT('CONFLICT (content): '+ri(11,140)+' hunks across '+files.length+' files','err',{burst:true});
  yield THINK();
  yield L('rerere remembers '+ri(2,5)+' of these resolutions — replaying','warn',{wait:U(700,1300)});
  for(const f of files){
    yield TOOL('Edit',f);
    yield DIFF('-','<<<<<<< HEAD',{wait:U(40,110)});
    yield DIFF('+',pick(FIX),{wait:U(50,140)});
  }
  yield OUT('git add -A · '+files.length+' conflicts resolved','dim',{burst:true});
  yield TOOL('Bash','git commit --no-edit && git rerere');
  yield OV('banner',{cls:'ok',text:'✓ MERGED — '+branch+' folded into main, no force needed',wait:U(700,1400)});
  beep('ok');
  yield L('✔ '+files.length+'-way conflict resolved · merge commit '+hash(7),'ok',{wait:U(600,1200)});
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
      else if(r<0.55){ yield THINK(); yield L(rethink(),'warn',{wait:U(500,1200)}); }
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
/* ====================================================================== */
/* SCENE REGISTRY                                                          */
/* ====================================================================== */
/* Single source of truth for every playable scene.  Derive all secondary
   data structures (DRAMAS lookup, APP_BUILDERS, picker groups, autoplay
   roster, forceDrama bias) from this array — never maintain parallel lists.

   Fields:
     id             string   canonical key used throughout the engine
     label          string   human label shown in the scene picker
     category       string   picker group heading; insertion order preserved
     generator      fn|null  generator function; null for non-drama entries (deepwork)
     appBuilder     fn|null  overlay GUI builder passed to buildApp(); null = no app window
     weight         number   relative autoplay frequency (1 = normal; 0 = never auto-picked)
     autoplay       bool     eligible for automatic cadence scheduling
     requiresMotion bool     scene is visually inert under reduceFlash (generator self-guards)
     tags           string[] 'boss'|'git'|'core'|'system' — used for forceDrama bias
     onPick         fn?      optional override called by scene picker instead of queueDrama
*/
const SCENE_REGISTRY=[
  // ---- Observability & telemetry ----
  {id:'grafana',      label:'Grafana · SLO breach',       category:'Observability & telemetry',   generator:dGrafana,       appBuilder:buildGrafana,  weight:1,autoplay:true, requiresMotion:false,tags:['boss']},
  {id:'trace',        label:'Jaeger slow trace',           category:'Observability & telemetry',   generator:dTrace,         appBuilder:buildTrace,    weight:1,autoplay:true, requiresMotion:false,tags:['boss']},
  {id:'btop',         label:'btop · runaway process',      category:'Observability & telemetry',   generator:dBtop,          appBuilder:buildBtop,     weight:1,autoplay:true, requiresMotion:false,tags:['boss']},
  {id:'oom',          label:'btop · OOM kill',             category:'Observability & telemetry',   generator:dOom,           appBuilder:buildBtop,     weight:1,autoplay:true, requiresMotion:false,tags:['boss']},
  {id:'anomaly',      label:'metric anomaly',              category:'Observability & telemetry',   generator:dAnomaly,       appBuilder:null,          weight:1,autoplay:true, requiresMotion:false,tags:['core']},
  {id:'pager',        label:'on-call page · 03:14',        category:'Observability & telemetry',   generator:dPager,         appBuilder:null,          weight:1,autoplay:true, requiresMotion:false,tags:['core']},
  // ---- Performance & profiling ----
  {id:'flame',        label:'pprof flame graph',           category:'Performance & profiling',     generator:dFlame,         appBuilder:buildFlame,    weight:1,autoplay:true, requiresMotion:false,tags:['boss']},
  {id:'sql',          label:'EXPLAIN · slow query',        category:'Performance & profiling',     generator:dSqlPlan,       appBuilder:buildSql,      weight:1,autoplay:true, requiresMotion:false,tags:['boss']},
  {id:'load',         label:'k6 load test',                category:'Performance & profiling',     generator:dLoad,          appBuilder:buildLoad,     weight:1,autoplay:true, requiresMotion:false,tags:['boss']},
  {id:'heatmap',      label:'latency heatmap',             category:'Performance & profiling',     generator:dHeatmap,       appBuilder:buildHeat,     weight:1,autoplay:true, requiresMotion:false,tags:['boss']},
  {id:'cpuheat',      label:'cpu · core pinned',           category:'Performance & profiling',     generator:dCpuheat,       appBuilder:buildCpu,      weight:1,autoplay:true, requiresMotion:false,tags:['boss']},
  {id:'thermal',      label:'thermal throttle map',        category:'Performance & profiling',     generator:dThermal,       appBuilder:buildThermal,  weight:1,autoplay:true, requiresMotion:false,tags:['boss']},
  {id:'repl',         label:'replication lag · the wave',  category:'Performance & profiling',     generator:dRepl,          appBuilder:buildRepl,     weight:1,autoplay:true, requiresMotion:false,tags:['boss']},
  // ---- Infrastructure & containers ----
  {id:'cluster',      label:'k9s · CrashLoopBackOff',      category:'Infrastructure & containers', generator:dCluster,       appBuilder:buildCluster,  weight:1,autoplay:true, requiresMotion:false,tags:['boss']},
  {id:'docker',       label:'docker buildx',               category:'Infrastructure & containers', generator:dDocker,        appBuilder:buildDocker,   weight:1,autoplay:true, requiresMotion:false,tags:['boss']},
  {id:'gpu',          label:'GPU farm · throttle',         category:'Infrastructure & containers', generator:dGpu,           appBuilder:buildGpu,      weight:1,autoplay:true, requiresMotion:false,tags:['boss']},
  {id:'mesh',         label:'service mesh · breaker',      category:'Infrastructure & containers', generator:dMesh,          appBuilder:buildMesh,     weight:1,autoplay:true, requiresMotion:false,tags:['boss']},
  {id:'dns',          label:'DNS propagation',             category:'Infrastructure & containers', generator:dDns,           appBuilder:buildDns,      weight:1,autoplay:true, requiresMotion:false,tags:['boss']},
  {id:'chaos',        label:'chaos · game day',            category:'Infrastructure & containers', generator:dChaos,         appBuilder:null,          weight:1,autoplay:true, requiresMotion:false,tags:['boss']},
  {id:'kafka',        label:'kafka · consumer lag',        category:'Infrastructure & containers', generator:dKafka,         appBuilder:buildKafka,    weight:1,autoplay:true, requiresMotion:false,tags:['boss']},
  {id:'pgrepl',       label:'Postgres · replica failover', category:'Infrastructure & containers', generator:dPgFailover,    appBuilder:buildPgrepl,   weight:1,autoplay:true, requiresMotion:false,tags:['boss']},
  // ---- Editor & terminal ----
  {id:'vim',          label:'vim · hero edit session',     category:'Editor & terminal',           generator:dVim,           appBuilder:buildVim,      weight:1,autoplay:true, requiresMotion:false,tags:['boss']},
  {id:'tmux',         label:'tmux · split-pane war room',  category:'Editor & terminal',           generator:dTmux,          appBuilder:buildTmux,     weight:1,autoplay:true, requiresMotion:false,tags:['boss']},
  // ---- Ship & release ----
  {id:'pipeline',     label:'CI/CD pipeline',              category:'Ship & release',              generator:dPipeline,      appBuilder:buildPipeline, weight:1,autoplay:true, requiresMotion:false,tags:['boss']},
  {id:'terraform',    label:'terraform plan/apply',        category:'Ship & release',              generator:dTerraform,     appBuilder:null,          weight:1,autoplay:true, requiresMotion:false,tags:['core']},
  {id:'deploy',       label:'deploy & rollout',            category:'Ship & release',              generator:dDeploy,        appBuilder:null,          weight:1,autoplay:true, requiresMotion:false,tags:['core']},
  {id:'pr',           label:'GitHub pull request',         category:'Ship & release',              generator:dPR,            appBuilder:buildPR,       weight:1,autoplay:true, requiresMotion:false,tags:['boss']},
  // ---- Security ----
  {id:'attackmap',    label:'threat map · DDoS',           category:'Security',                    generator:dAttack,        appBuilder:buildAttack,   weight:1,autoplay:true, requiresMotion:false,tags:['boss']},
  {id:'security',     label:'CVE patch',                   category:'Security',                    generator:dSec,           appBuilder:null,          weight:1,autoplay:true, requiresMotion:false,tags:['core']},
  {id:'auth',         label:'auth / secret rotation',      category:'Security',                    generator:dAuth,          appBuilder:null,          weight:1,autoplay:true, requiresMotion:false,tags:['core']},
  // ---- Version control ----
  {id:'rebase',       label:'interactive rebase',          category:'Version control',             generator:dRebase,        appBuilder:null,          weight:1,autoplay:true, requiresMotion:false,tags:['git']},
  {id:'mergeconflict',label:'merge conflict',              category:'Version control',             generator:dMergeConflict, appBuilder:null,          weight:1,autoplay:true, requiresMotion:false,tags:['git']},
  {id:'bisect',       label:'git bisect hunt',             category:'Version control',             generator:dBisect,        appBuilder:null,          weight:1,autoplay:true, requiresMotion:false,tags:['git']},
  {id:'reflog',       label:'reflog recovery',             category:'Version control',             generator:dReflog,        appBuilder:null,          weight:1,autoplay:true, requiresMotion:false,tags:['git']},
  {id:'cherrypick',   label:'cherry-pick backport',        category:'Version control',             generator:dCherryPick,    appBuilder:null,          weight:1,autoplay:true, requiresMotion:false,tags:['git']},
  {id:'filterrepo',   label:'purge leaked secret',         category:'Version control',             generator:dFilterRepo,    appBuilder:null,          weight:1,autoplay:true, requiresMotion:false,tags:['git']},
  {id:'octopus',      label:'octopus merge',               category:'Version control',             generator:dOctopus,       appBuilder:null,          weight:1,autoplay:true, requiresMotion:false,tags:['git']},
  {id:'blame',        label:'pickaxe archaeology',         category:'Version control',             generator:dBlame,         appBuilder:null,          weight:1,autoplay:true, requiresMotion:false,tags:['git']},
  // ---- Agent & session ----
  {id:'swarm',        label:'subagent fleet',              category:'Agent & session',             generator:dSwarm,         appBuilder:buildSwarm,    weight:1,autoplay:true, requiresMotion:false,tags:['boss']},
  {id:'chatter',      label:'agent-to-agent review',       category:'Agent & session',             generator:dChatter,       appBuilder:null,          weight:1,autoplay:true, requiresMotion:false,tags:['core']},
  {id:'postmortem',   label:'incident postmortem',         category:'Agent & session',             generator:dPostmortem,    appBuilder:null,          weight:1,autoplay:true, requiresMotion:false,tags:['core']},
  {id:'matrix',       label:'matrix cascade',              category:'Agent & session',             generator:dMatrix,        appBuilder:null,          weight:1,autoplay:true, requiresMotion:true, tags:['core']},
  // system entries — never auto-picked; compaction triggered by ctx pressure, deepwork by idle timeout
  {id:'compaction',   label:'context compaction',          category:'Agent & session',             generator:dCompact,       appBuilder:null,          weight:0,autoplay:false,requiresMotion:false,tags:['core','system']},
  {id:'deepwork',     label:'deep work · away mode',       category:'Agent & session',             generator:null,           appBuilder:null,          weight:0,autoplay:false,requiresMotion:false,tags:['system'],
    onPick:()=>{ if(!enterIdle()) toast('deep work needs auto mode'); }},
];

// ---- Derived lookup tables ----
// DRAMAS: id → generator  (used by checkDrama, dDeepWork drama queue)
const DRAMAS={};
SCENE_REGISTRY.forEach(s=>{ if(s.generator) DRAMAS[s.id]=s.generator; });

// APP_BUILDERS: tool-name → builder  (used by buildApp / renderOverlay)
// oom yields tool:'btop' so the btop entry covers it; oom entry is an extra harmless alias.
const APP_BUILDERS={};
SCENE_REGISTRY.forEach(s=>{ if(s.appBuilder) APP_BUILDERS[s.id]=s.appBuilder; });

// buildApp is here (not overlays/index.js) because it reads APP_BUILDERS
function buildApp(tool,body,ev){ const b=APP_BUILDERS[tool]; if(b) b(body,ev); }

function enabledDramas(){
  return dramaOn ? SCENE_REGISTRY.filter(s=>s.autoplay).map(s=>s.id) : [];
}
/* ====================================================================== */
/* SCHEDULER                                                               */
/* ====================================================================== */
const top=ticketStream();
function* topStream(){
  while(true){
    if(dramaQ.length){ const d=dramaQ.shift(); yield* d(); }
    yield top.next().value;
  }
}
const stream=topStream();
function waitOf(ev){
  if(ev.wait!=null)return ev.wait;
  switch(ev.kind){
    case 'tool':return U(250,600);
    case 'output':return ev.burst?U(15,90):U(120,300);
    case 'diff':return U(40,140);
    case 'thinking':return U(250,500);
    case 'task':return U(150,350);
    case 'filehl':return U(80,220);
    case 'counter':return U(10,40);
    case 'phase':return U(400,1200);
    case 'ov':return U(150,400);
    case 'line':return ev.burst?U(15,90):U(120,400);
    default:return U(120,400);
  }
}
function emit(ev){ render(ev); sfx(ev); lastEmit=performance.now(); }

function pumpAuto(){
  let count=0;
  while(pending && logicalNow>=nextAt && count<MAX_PER_FRAME){
    const ev=pending; emit(ev);
    pending=stream.next().value; nextAt=logicalNow+waitOf(pending); count++;
  }
  checkDrama();
}
function emitOne(){
  if(!pending)return;
  logicalNow=Math.max(logicalNow,nextAt);
  const ev=pending; emit(ev);
  pending=stream.next().value; nextAt=logicalNow+waitOf(pending);
  checkDrama();
}
function checkDrama(){
  if(overlayActive||dramaQ.length)return;
  // context compaction (condition-driven): only when the window is genuinely near-full (like real auto-compact),
  // a full overlay when dramas are on, a silent reset when off
  if(ctx>=92 && logicalNow-lastCompact>5000){
    if(dramaOn) dramaQ.push(DRAMAS.compaction);
    else ctxAnim={from:ctx,to:U(22,28),t0:performance.now(),dur:1400};   // silent compaction when dramas are off
    lastCompact=logicalNow; return;
  }
  if(!dramaOn)return;
  if(logicalNow>=nextDramaAt){
    let type;
    const en=enabledDramas();
    if(firstDrama && cfg.vibe && VIBES[cfg.vibe] && VIBES[cfg.vibe].open && en.indexOf(VIBES[cfg.vibe].open)>=0){ type=VIBES[cfg.vibe].open; firstDrama=false; }  // vibe's signature opener
    else if(firstDrama && en.indexOf('anomaly')>=0){ type='anomaly'; firstDrama=false; }
    else if(cfg.vibe && VIBES[cfg.vibe] && rng()<0.62){   // vibe presets favor their signature scenes
      const bias=VIBES[cfg.vibe].bias.filter(id=>en.indexOf(id)>=0);
      type=bias.length?pick(bias):pick(en); firstDrama=false;
    }
    else if(agentProfile.bias.length && rng()<0.45){      // agent temperament tilts scene odds (#5)
      const bias=agentProfile.bias.filter(id=>en.indexOf(id)>=0);
      type=bias.length?pick(bias):pick(en); firstDrama=false;
    }
    else { type=pick(en); firstDrama=false; }
    if(type&&DRAMAS[type]) dramaQ.push(DRAMAS[type]);
    // clustered cadence: squared draw biases the gap toward ~0 (bursts fire back-to-back, gated only by play time)
    // with rare long lulls. Mean ≈ 85s preserved (255000·⅓), so overall density matches the old U(60000,110000).
    nextDramaAt=logicalNow+Math.pow(rng(),2)*255000/dramaFreq;
  }
}

/* ---- main rAF loop ---- */
function frame(ts){
  if(hidden)return;
  const dt=lastTs?Math.min(ts-lastTs,200):16; lastTs=ts;
  // visuals always
  updateHeader(ts,dt);
  updateThinker();
  updateTools();
  if(mxActive) drawMatrix();
  if(btopActive) tickBtop(ts);
  if(liveState) liveState.tick(ts);
  if(bossActive){ bossFrame+=dt*0.012; bossEl.querySelector('.sp').textContent=SPIN[Math.floor(bossFrame)%SPIN.length]; }
  tickIdle(ts);
  // engine
  if(!paused && !bossActive){
    if(mode==='auto'){ logicalNow+=dt*speed; pumpAuto(); }
    else { // performer: release ≥1 event/25ms, frame-rate independent, capped per frame so a mash never dumps
      if(releaseTokens>0){
        const budget=Math.min(Math.floor((ts-lastRelease)/25),MAX_PER_FRAME);
        const n=Math.min(budget,releaseTokens);
        if(n>0){ for(let i=0;i<n;i++){ releaseTokens--; emitOne(); } lastRelease=ts; }
      } else { lastRelease=ts; }
    }
  }
  flushRender();   // batched DOM: insert this frame's queued log lines + scroll once
  rafId=requestAnimationFrame(frame);
}
/* ---- header decorations ---- */
let lastHeaderTs=0, lastTokTs=0;
function updateHeader(ts,dt){
  // elapsed (recompute from wall clock — no drift)
  const s=Math.floor((Date.now()-startEpoch)/1000);
  const hh=Math.floor(s/3600), mm=Math.floor((s%3600)/60), ss=s%60;
  hTime.textContent=(hh>0?String(hh).padStart(2,'0')+':':'')+String(mm).padStart(2,'0')+':'+String(ss).padStart(2,'0');
  // ctx animation
  if(ctxAnim){
    const p=clamp((ts-ctxAnim.t0)/ctxAnim.dur,0,1); const e=1-Math.pow(1-p,3);
    ctx=ctxAnim.from+(ctxAnim.to-ctxAnim.from)*e; if(p>=1)ctxAnim=null;
  }
  if(ts-lastHeaderTs>120){ lastHeaderTs=ts; renderCtx(); renderBurn(ts); }
  // tok/s random walk
  if(ts-lastTokTs>160){
    lastTokTs=ts;
    const thinking=!!activeThinker;
    const bursting=(ts-lastEmit)<140 && !paused;
    const target=thinking?56:bursting?106:84;
    tok+=(target-tok)*0.10+U(-3,3); tok=clamp(tok,40,120);
    hTok.textContent=(paused?'— ':Math.round(tok)+' ')+'tok/s';
  }
}
function renderCtx(){
  const pct=Math.round(clamp(ctx,0,100)), n=10, fill=Math.round(pct/100*n);
  ctxbar.textContent='▮'.repeat(fill)+'░'.repeat(n-fill);
  ctxpct.textContent=pct+'%';
}
function ctxBump(x){ if(!ctxAnim) ctx=clamp(ctx+x,0,98); }

/* ---- cost / burn meter ---- */
const BURN_LINES=[
  'budget guard: switching to terser reasoning to conserve tokens',
  'pruning low-signal context to stay under the cap…',
  'batching the remaining tool calls to cut overhead',
  'dropping scratchpad history — keeping only the load-bearing bits',
  'summarizing earlier steps to reclaim budget',
  'note to self: fewer, bigger edits from here',
];
function fmtCost(n){ return '$'+(n<1000?n.toFixed(2):compactNum(Math.round(n))); }
function burnTick(tokens){      // every tool call nudges spend + budget pressure; heavier calls cost more
  cost+=0.002 + (tokens||0)*0.0000045 + U(0.004,0.016);
  if(!burnWarn && !burnEase) burnPct=clamp(burnPct+U(0.6,1.9),0,99);
  // codebase steadily grows as the "agent" churns — keep footer counters alive between ticket beats
  bumpCounter('lines',ri(2,80));
  if(rng()<0.12) bumpCounter('files',1);
  if(rng()<0.2) bumpCounter('tests',ri(1,4));
}
function renderBurn(ts){
  // trip the 80% warning, then "nervously work around it" — ease the budget back down
  if(burnPct>=80 && !burnWarn && !burnEase){
    burnWarn=true; hBudget.hidden=false; hBudget.classList.toggle('pulse',!reduceMotion);
    hBudget.textContent='⚠ token budget '+Math.round(burnPct)+'%';
    injectBurnLine();
    burnEase={from:burnPct,to:U(42,56),t0:ts,dur:reduceMotion?700:3200,hideAt:ts+(reduceMotion?900:2600)};
  }
  if(burnEase){
    const p=clamp((ts-burnEase.t0)/burnEase.dur,0,1), e=1-Math.pow(1-p,3);
    burnPct=burnEase.from+(burnEase.to-burnEase.from)*e;
    if(burnWarn && ts>=burnEase.hideAt){ burnWarn=false; hBudget.hidden=true; hBudget.classList.remove('pulse'); }
    if(p>=1) burnEase=null;
  }
  hCost.textContent=fmtCost(cost);
}
function injectBurnLine(){
  const d=el('ln out tone-warn');
  d.appendChild(spn('br','⎿ ')); d.appendChild(document.createTextNode(pick(BURN_LINES)));
  appendLine(d);
}
/* ====================================================================== */
/* INPUT / HOTKEYS                                                         */
/* ====================================================================== */
function isTyping(t){ return t&&(t.tagName==='INPUT'||t.tagName==='SELECT'||t.tagName==='TEXTAREA'); }
addEventListener('keydown',e=>{
  markActivity();
  if(bossActive){ e.preventDefault(); hideBoss(); return; }
  if(settingsEl.open){                            // config dialog owns input while open
    if(isTyping(e.target)) return;                // let fields receive keystrokes (incl. Esc handled natively)
    if(e.key==='s'){ toggleSettings(false); e.preventDefault(); }   // 's' toggles the dialog shut
    return;                                        // Escape is closed by <dialog> itself
  }
  if(dramaEl.open){                               // scene picker owns input while open (Esc closes natively)
    if(e.key==='d'){ toggleDrama(false); e.preventDefault(); }
    return;
  }
  if(e.key==='Escape' && helpOpen){ toggleHelp(false); return; }
  if(isTyping(e.target)) return;
  if(e.metaKey||e.ctrlKey||e.altKey) return;     // don't hijack copy/devtools
  audioUnlock();
  const k=e.key;
  switch(k){
    case 'm': mode=mode==='auto'?'performer':'auto'; updateMode(); toast('mode: '+mode); e.preventDefault(); return;
    case ' ': paused=!paused; document.body.classList.toggle('paused',paused); updateMode(); toast(paused?'paused':'resumed'); e.preventDefault(); return;
    case '1': setTheme('amber'); return;
    case '2': setTheme('green'); return;
    case '3': setTheme('cyan'); return;
    case '+': case '=': setSpeed(speed*1.5); e.preventDefault(); return;
    case '-': case '_': setSpeed(speed/1.5); e.preventDefault(); return;
    case 'f': forceDrama(); e.preventDefault(); return;
    case 'd': toggleDrama(); e.preventDefault(); return;
    case 'b': showBoss(); e.preventDefault(); return;
    case 's': toggleSettings(); e.preventDefault(); return;
    case '?': toggleHelp(); e.preventDefault(); return;
  }
  if(mode==='performer' && k.length===1){ releaseTokens=Math.min(REL_CAP,releaseTokens+1); blip(); e.preventDefault(); }
});

function updateMode(){
  if(idleActive){ modeind.textContent='⚙ deep work'; modeind.classList.add('deep'); }
  else { modeind.textContent=paused?'⏸ paused':mode==='performer'?'▸ performer':'⏻ auto'; modeind.classList.remove('deep'); }
  document.body.classList.toggle('performer',mode==='performer');
}
function setTheme(t){ cfg.theme=t; document.documentElement.setAttribute('data-theme',t); cacheAccent(); toast('theme: '+t); syncURL(); }
function setSpeed(v){ speed=clamp(v,0.25,4); toast('speed: '+speed.toFixed(2)+'×'); syncURL(); }
const DRAMAQ_MAX=5;   // manual requests queue (auto cadence still refuses while busy); cap guards runaway
function enqueueDrama(gen,name){
  if(dramaQ.length>=DRAMAQ_MAX){ toast('drama queue full'); return; }
  dramaQ.push(gen);
  toast((overlayActive||dramaQ.length>1?'queued':'drama')+': '+name+(dramaQ.length>1?' ['+dramaQ.length+']':''));
}
function forceDrama(){
  const boss=SCENE_REGISTRY.filter(s=>s.tags.includes('boss')).map(s=>s.id);
  const en=enabledDramas(); const base=en.length?en:['deploy','anomaly','security','auth','matrix'];
  const type=pick(boss.concat(base));
  const scene=SCENE_REGISTRY.find(s=>s.id===type);
  if(scene&&scene.generator) enqueueDrama(scene.generator,type);
}
function showBoss(){ bossActive=true; bossEl.classList.add('on'); }
function hideBoss(){ bossActive=false; bossEl.classList.remove('on'); }
/* ====================================================================== */
/* IDLE / DEEP-WORK "AWAY" MODE                                            */
/* ====================================================================== */
function enterIdle(){
  if(idleActive||mode!=='auto'||paused) return false;
  idleActive=true; document.body.classList.add('deepwork'); updateMode();
  dramaQ.unshift(dDeepWork);   // grind takes over next; dramas still fire and cut in mid-grind
  toast('deep work — away mode'); return true;
}
function exitIdle(){
  if(!idleActive) return;
  idleActive=false; document.body.classList.remove('deepwork'); updateMode();
  nextDramaAt=logicalNow+U(60000,110000)/dramaFreq;   // don't fire a drama the instant we resume
}
function markActivity(){ lastActivityTs=performance.now(); if(idleActive) exitIdle(); }
function tickIdle(ts){
  if(idleActive||idleThreshold<=0) return;
  if(paused||bossActive||overlayActive||mode!=='auto'||settingsEl.open||dramaEl.open||helpOpen){ lastActivityTs=ts; return; }
  if(ts-lastActivityTs>=idleThreshold*1000) enterIdle();
}
['pointerdown','pointermove','wheel','touchstart'].forEach(t=>addEventListener(t,markActivity,{passive:true}));
['pointerdown','touchstart'].forEach(t=>addEventListener(t,audioUnlock,{passive:true}));   // a click/tap also satisfies the audio-gesture requirement
/* ====================================================================== */
/* SCENE PICKER (hotkey 'd') — fire any drama on demand for testing        */
/* ====================================================================== */
function queueDrama(id){
  const scene=SCENE_REGISTRY.find(s=>s.id===id);
  if(!scene||!scene.generator){ toast('unknown scene'); return; }
  enqueueDrama(scene.generator,id);
}
function buildDramaPicker(){
  dramaEl.innerHTML='';
  const hd=el('cfg-hd');
  hd.appendChild(el('h2','SCENE PICKER'));
  hd.appendChild(el('badge','for testing'));
  const x=mkBtn('cfg-x','✕',()=>toggleDrama(false)); x.title='Close (Esc)'; hd.appendChild(x);
  dramaEl.appendChild(hd);
  const bd=el('cfg-bd'); dramaEl.appendChild(bd);
  // Group by category, preserving SCENE_REGISTRY insertion order
  const groups=new Map();
  SCENE_REGISTRY.forEach(s=>{ if(!groups.has(s.category)) groups.set(s.category,[]); groups.get(s.category).push(s); });
  groups.forEach((scenes,title)=>{
    const sec=el('cfg-sec'); sec.appendChild(el('cfg-sech',title));
    const g=el('dp-grid');
    scenes.forEach(s=>{
      const b=mkBtn('dp-item',s.label,()=>{ toggleDrama(false); if(s.onPick) s.onPick(); else queueDrama(s.id); });
      b.title=s.id; g.appendChild(b);
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
  // platform pins the repo's stack — applied on reload (file tree is generated once at init); pin the seed so only the language changes
  fld(g,'platform',sel([{v:'',t:'— random —'},{v:'typescript',t:'TypeScript'},{v:'react',t:'React'},{v:'go',t:'Go'},{v:'rust',t:'Rust'},{v:'python',t:'Python'}],cfg.platform||'',v=>{cfg.platform=v||null;location.search=urlParams(true);}),true);

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
  if(cfg.platform)p.set('platform',cfg.platform);
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
  cfg.model='mythos-5-preview'; cfg.audio='off'; cfg.crt='off'; cfg.reduceFlash=null; cfg.platform=null;
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
/* ====================================================================== */
/* AUDIO (WebAudio, no assets)                                             */
/* ====================================================================== */
let actx=null, master=null, comp=null, revIn=null, revSend=null, audioConfirmed=false;
function audioUnlock(){
  if(cfg.audio!=='on')return;
  try{
    if(!actx){ actx=new (window.AudioContext||window.webkitAudioContext)(); buildGraph(); }
    if(actx.state==='suspended') actx.resume().then(audioConfirm,()=>{});   // browsers start the context suspended until a gesture resumes it
    else audioConfirm();
  }catch(e){ actx=null; }
}
/* FX bus: voices → master(0.16) → compressor(glue) → out; cues also tap revIn → convolver(synth impulse) → wet → compressor */
function buildGraph(){
  master=actx.createGain(); master.gain.value=0.16;
  comp=actx.createDynamicsCompressor(); master.connect(comp); comp.connect(actx.destination);
  const conv=actx.createConvolver(); conv.buffer=impulse(1.6,3.2);
  const wetG=actx.createGain(); wetG.gain.value=0.05;   // low: revIn taps full voice gain, pre-master
  revIn=actx.createGain(); revIn.connect(conv); conv.connect(wetG); wetG.connect(comp);
}
function impulse(dur,decay){   // exponential-decay noise → a room, no asset
  const n=(actx.sampleRate*dur)|0, b=actx.createBuffer(2,n,actx.sampleRate);
  for(let c=0;c<2;c++){ const d=b.getChannelData(c); for(let i=0;i<n;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/n,decay); }
  return b;
}
function wet(fn){ const s=revSend; revSend=revIn; try{fn();}finally{revSend=s;} }   // route a cue's voices to reverb (read synchronously at node-build time)
function audioConfirm(){   // a rising two-note chime the first time audio actually starts, so it's obvious it works
  if(audioConfirmed||!actx||actx.state!=='running')return;
  audioConfirmed=true; const t=actx.currentTime;
  tone(523,0.12,'sine',0.3,t); tone(784,0.16,'sine',0.3,t+0.11);
}
/* --- synth primitives -------------------------------------------------- */
function tone(freq,dur,type,vol,when){
  if(!actx)return; const t=(when||actx.currentTime); const o=actx.createOscillator(),g=actx.createGain(),f=actx.createBiquadFilter();
  o.type=type||'square'; o.frequency.value=freq;
  f.type='lowpass'; f.Q.value=0.7; f.frequency.setValueAtTime(Math.min(freq*6,16000),t); f.frequency.exponentialRampToValueAtTime(Math.max(freq*1.4,300),t+dur);   // pluck: cutoff falls with the note
  o.connect(f); f.connect(g); g.connect(master); if(revSend)g.connect(revSend);
  g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vol||0.3,t+0.004); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  o.start(t); o.stop(t+dur+0.02);
}
function sweep(f0,f1,dur,type,vol,when){   // a pitch glide — risers, whooshes, klaxon wails
  if(!actx)return; const t=(when||actx.currentTime); const o=actx.createOscillator(),g=actx.createGain(),f=actx.createBiquadFilter();
  o.type=type||'sawtooth'; o.frequency.setValueAtTime(f0,t); o.frequency.exponentialRampToValueAtTime(Math.max(1,f1),t+dur);
  f.type='lowpass'; f.Q.value=0.7; f.frequency.setValueAtTime(Math.min(Math.max(f0,f1)*5,16000),t); f.frequency.exponentialRampToValueAtTime(Math.max(Math.min(f0,f1)*1.4,300),t+dur);
  o.connect(f); f.connect(g); g.connect(master); if(revSend)g.connect(revSend);
  g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vol||0.25,t+0.02); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  o.start(t); o.stop(t+dur+0.02);
}
function noise(dur,vol,hp,when){   // filtered white-noise burst — impacts, rumble beds
  if(!actx)return; const t=(when||actx.currentTime); const n=Math.max(1,(actx.sampleRate*dur)|0);
  const buf=actx.createBuffer(1,n,actx.sampleRate), d=buf.getChannelData(0);
  for(let i=0;i<n;i++) d[i]=Math.random()*2-1;
  const src=actx.createBufferSource(); src.buffer=buf; const g=actx.createGain();
  g.gain.setValueAtTime(vol||0.2,t); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  let node=src; if(hp){ const f=actx.createBiquadFilter(); f.type='highpass'; f.frequency.value=hp; src.connect(f); node=f; }
  node.connect(g); g.connect(master); if(revSend)g.connect(revSend); src.start(t); src.stop(t+dur+0.02);
}
function arp(freqs,step,dur,type,vol,when){   // ascending/descending run of notes
  if(!actx)return; const t=(when||actx.currentTime); freqs.forEach((f,i)=>tone(f,dur,type||'triangle',vol||0.28,t+i*step));
}
function blip(){ if(!actx)return; tone(420+rng()*180,0.03,'square',0.28); }

/* --- named cues -------------------------------------------------------- */
function klaxon(){   // descending two-tone alarm, wailed three times over a low rumble — the drama hits
  if(!actx)return; const t=actx.currentTime;
  for(let i=0;i<3;i++){ const tt=t+i*0.30; sweep(780,520,0.15,'sawtooth',0.34,tt); sweep(520,780,0.14,'sawtooth',0.30,tt+0.15); }
  noise(0.55,0.10,140,t);
}
function fanfare(){   // triumphant rising arpeggio + sparkle — ships to prod
  if(!actx)return; const t=actx.currentTime;
  arp([523,659,784,1047],0.09,0.18,'triangle',0.32,t);
  tone(1568,0.30,'sine',0.22,t+0.36); tone(2093,0.20,'sine',0.12,t+0.40);
}
function resolveChord(){   // warm major triad — crisis resolved, all green
  if(!actx)return; const t=actx.currentTime;
  [392,494,587,784].forEach(f=>tone(f,0.5,'sine',0.16,t));
}
function beep(kind){
  if(cfg.audio!=='on'||!actx)return;
  if(kind==='alert') wet(klaxon);
  else if(kind==='deploy') wet(fanfare);
  else if(kind==='ok') wet(resolveChord);
}

/* --- per-event scoring: every emitted event gets a voice ---------------- */
let lastTick=0;
function sfx(ev){
  if(cfg.audio!=='on'||!actx||actx.state!=='running')return;
  const now=performance.now();
  switch(ev.kind){
    case 'line': case 'output':{   // streaming text → quiet typewriter ticks (throttled so fast bursts don't buzz)
      if(now-lastTick<55)return; lastTick=now; tone(1500+rng()*500,0.010,'square',0.05); break;
    }
    case 'tool': sweep(440,900,0.07,'square',0.16); break;            // crisp "select" chirp
    case 'phase': sweep(200,640,0.26,'sawtooth',0.18); break;          // rising whoosh on a new phase
    case 'diff': tone(ev.sign==='+'?880:330,0.05,'triangle',0.14); break;
    case 'thinking': tone(150,0.20,'sine',0.13); break;               // low contemplative pulse
    case 'snippet': for(let i=0;i<4;i++) tone(1400+rng()*600,0.012,'square',0.05,actx.currentTime+i*0.03); break;
    case 'task': if(ev.state==='✔'){ tone(784,0.10,'sine',0.20); tone(1047,0.13,'sine',0.18,actx.currentTime+0.06); } break;
    case 'clear': sweep(820,200,0.22,'sine',0.12); break;
    case 'counter': if(now-lastTick>110){ lastTick=now; tone(2000+rng()*300,0.008,'square',0.035); } break;
    case 'ov': sfxOverlay(ev,now); break;
  }
}
function sfxOverlay(ev,now){
  switch(ev.op){
    case 'open': case 'app': wet(()=>{ sweep(120,900,0.5,'sawtooth',0.22); noise(0.4,0.06,200); }); break;   // tension riser as the overlay slams open
    case 'banner': if(ev.cls&&ev.cls.indexOf('ok')>=0) wet(resolveChord); break;
    case 'boxline': if(now-lastTick>40){ lastTick=now; tone(1200+rng()*300,0.010,'square',0.06); } break;
    case 'bar': tone(1500,0.010,'square',0.045); break;
  }
}
/* ====================================================================== */
/* VISIBILITY                                                              */
/* ====================================================================== */
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){ hidden=true; if(rafId)cancelAnimationFrame(rafId); rafId=0; }
  else { hidden=false; lastTs=0; markActivity(); if(!rafId) rafId=requestAnimationFrame(frame); }  // returning to the tab counts as activity; don't replay backlog
});
/* ====================================================================== */
/* INIT                                                                    */
/* ====================================================================== */
function cacheAccent(){ accentCache=getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()||'#ff9d2f'; }
function init(){
  if(!cfg.project)cfg.project=PROJECTS[(rng()*PROJECTS.length)|0];
  document.documentElement.setAttribute('data-theme',cfg.theme);
  document.body.classList.toggle('crt',cfg.crt==='on');
  document.body.classList.toggle('reduce',reduceFlash);
  document.body.classList.toggle('paused',paused);
  hAgent.textContent=cfg.agent; hProj.textContent=cfg.project; hModel.textContent=cfg.model;
  if(cfg.vibe&&VIBES[cfg.vibe]){ hVibe.textContent=VIBES[cfg.vibe].label||cfg.vibe; hVibe.dataset.vibe=cfg.vibe; hVibe.hidden=false; }  // persistent badge that a vibe is active
  cacheAccent();
  FILES=genFiles();
  buildFileTree();
  // footer init
  cFiles.textContent=compactNum(counters.files); cLines.textContent=compactNum(counters.lines);
  cTests.textContent=compactNum(counters.tests); cCves.textContent=compactNum(counters.cves); cDeploys.textContent=compactNum(counters.deploys);
  renderCtx(); updateMode();
  if(cfg.audio==='on'){ /* will unlock on first gesture */ }
  pending=stream.next().value; nextAt=320;
  lastActivityTs=performance.now();
  rafId=requestAnimationFrame(frame);
}
init();
// test/debug hook — only exposed with ?debug in the URL, so production ships zero global surface
if(cfg.debug){
  window.__HYP={state:()=>({lines:logEl.childElementCount,counters:Object.assign({},counters),mode,paused,speed,dramas:dramaOn,freq:dramaFreq,ctx:Math.round(ctx),overlayActive,idle:idleActive,logicalNow:Math.round(logicalNow),ticketSeq,platform:cfg.platform,agent:cfg.agent,profile:agentProfile===NEUTRAL_PROFILE?'neutral':cfg.agent,profileBias:agentProfile.bias}),force:forceDrama,drama:n=>{if(DRAMAS[n])enqueueDrama(DRAMAS[n],n);return n;},deepwork:enterIdle,wake:markActivity,seed:cfg.seed};
}

})();
