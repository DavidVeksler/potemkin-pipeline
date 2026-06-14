"use strict";
(function(){
/* ====================================================================== */
/* CONFIG                                                                  */
/* ====================================================================== */
const QS=new URLSearchParams(location.search);
const THEMES=['amber','green','cyan'];
function qint(name,lo,hi,def){const v=parseInt(QS.get(name),10);return Number.isFinite(v)?Math.max(lo,Math.min(hi,v)):def;}
function qfloat(name,lo,hi,def){const v=parseFloat(QS.get(name));return Number.isFinite(v)?Math.max(lo,Math.min(hi,v)):def;}
const PROJECTS=['core-platform','payments-core','atlas-api','mesh-gateway','ledger-svc','vector-db','edge-runtime','quorum-store'];
/* hyperbolic agent codenames — riffs on the rumored next-gen model mythos
   (OpenAI Orion/Strawberry/Q*, xAI Colossus/Aurora, Gemini Ultra, Claude's mythos/fable …)
   plus the cosmic/mythic grandiosity the genre demands. One is picked per seed at load. */
const CODENAMES=['HYPERION','ORION','COLOSSUS','PROMETHEUS','OLYMPUS','TITAN','LEVIATHAN','BEHEMOTH',
  'OVERMIND','SINGULARITY','OMNISCIENCE','ASCENDANT','TRANSCENDENCE','DEMIURGE','OMEGA-9','ULTRAMAX',
  'MEGAMIND','GIGABRAIN','QUASAR','SUPERNOVA','HELIOS','KRONOS','AETHER','NEXUS','ORACLE','MAGNUS',
  'IMPERIUM','INFINITY','SOVEREIGN','MONOLITH','ARCHON','GODHEAD','EMPYREAN','PINNACLE','APEX-X',
  'ZENITH','PARAGON','STRAWBERRY-Q','AURORA','ARRAKIS','MOONSHOT','PLUS-ULTRA','AVATAR-9','OBELISK',
  'VANGUARD','APOTHEOSIS'];
const cfg={
  agent: QS.get('agent')||null,
  project: QS.get('project')||'',
  model: QS.get('model')||'mythos-5-preview',
  theme: THEMES.includes(QS.get('theme'))?QS.get('theme'):'amber',
  speed: qfloat('speed',0.25,4,1),
  dramas: (QS.get('dramas')==='off'||QS.get('intensity')==='0')?'off':'on',  // boss/ambient dramas on or off (legacy ?intensity=0 → off)
  freq: qfloat('freq',0.25,4,1),            // drama cadence multiplier (higher = more often)
  mode: QS.get('mode')==='performer'?'performer':'auto',
  audio: QS.get('audio')==='on'?'on':'off',
  crt: QS.get('crt')==='on'?'on':'off',
  idle: qint('idle',0,3600,90),             // seconds of no input before deep-work "away" mode (0 disables)
  reduceFlash: QS.get('reduceFlash'),       // 'on' | 'off' | null
  seed: QS.get('seed')!=null && Number.isFinite(parseInt(QS.get('seed'),10)) ? (parseInt(QS.get('seed'),10)>>>0) : (Math.random()*4294967296>>>0),
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
  if(rng()<0.7) head.push('README.md');
  head.push('infra/k8s/'+pick(['ingress','deployment','service','hpa'])+'.yaml');
  head.push('db/migrations/'+String(ri(1,99)).padStart(4,'0')+'_'+pick(['add_idx','alter_ledger','init_schema','backfill'])+'.sql');
  if(rng()<0.5) head.push('.github/workflows/ci.yaml');
  const roots=shuffle(st.roots.slice()).slice(0,ri(2,Math.min(4,st.roots.length)));
  const doms=shuffle(DOMAINS.slice());
  const budget=ri(13,18), src=[]; let di=0,guard=0;
  while(src.length<budget && guard++<300){
    const r=pick(roots), dom=doms[di++%doms.length];
    const sub=rng()<0.22?'/'+pick(['internal','impl','v2','util']):'';
    const path=r+'/'+dom+sub+'/'+pick(BASES)+'.'+st.ext;
    if(!src.includes(path)) src.push(path);
  }
  return [...new Set(head.concat(src))];
}
const ADD=['acquire distributed lock before debit',"await pool.withTransaction(tx => …)","retry({ attempts: 5, backoff: 'exp', jitter: true })",'assert invariant: sum(entries) == ledger.total','if (!idempotencyKey) throw new ConflictError()','span.setStatus(OK); span.end()','memoize via WeakMap keyed on request id','guard against negative TTL','debounce flush on 16ms frame boundary','coalesce duplicate in-flight requests','pin connection to primary during write','emit OTEL span for slow path','batch writes behind a bounded channel','add compare-and-swap on the counter'];
const DEL=['balance -= amount            // race under concurrency','O(n²) nested scan','synchronous fs.readFileSync on hot path','unbounded retry without backoff','mutate shared state without lock','swallow error silently','blocking call inside event loop','double-counted on retry'];
const FIX=['acquire distributed lock before debit','add idempotency key to retry path','fence stale read with version check','reorder lock acquisition to avoid deadlock','guard empty batch before flush','wrap debit + credit in one transaction','clamp TTL to non-negative','use compare-and-swap on the counter','add backoff with jitter to retry loop','hold read-lock across the projection rebuild'];
const RETHINK=["Hmm — that's not right.","Wait, there's a race on concurrent writes.","The invariant doesn't hold under partition.","Off-by-one in the boundary condition.","This allocates on the hot path — reconsidering.","The lock ordering can deadlock. Reordering.","That regression came from the cache. Reverting.","Edge case: empty batch slips through.","The retry isn't idempotent. Adding a key.","Stale read — need a fence here."];
const DIAG=['Root cause: two writers, no fence.','Reproduced locally under -race.','Bisected to the cache layer change.','Confirmed: missing happens-before edge.','Narrowed to the compensation path.','Trace shows duplicate delivery.'];
const ASSERT=['assertion failed: balance != expected','expected 200 OK, got 500','timeout after 5000ms waiting for lock','AssertionError: sum(entries) != ledger.total','panic: nil map write','FAIL: data race detected on shared counter','expected idempotent retry, got duplicate','deadlock: goroutine 41 stuck on mu.Lock'];
const TOOLS=['Bash','Bash','Bash','Read','Read','Read','Edit','Edit','Write','Grep','Glob','WebFetch','Task','MultiEdit'];
const TESTCMDS=['npm run test:integration','pytest -q','cargo test','go test ./...','npm run test','jest --ci','vitest run','go test -race ./...'];
const DEPLOYCMDS=['docker compose up -d','terraform plan','kubectl rollout status deploy/api','gh pr checks','cargo build --release'];
const GLOBS=['**/*.ts','src/**/*.go','**/*.rs','**/*.py','pkg/**/*.go','**/*.sql','infra/**/*.yaml','src/**/*.tsx'];
const GREPS=['TODO|FIXME','acquireLock','withTransaction','idempotencyKey','panic\\(','unsafe','SELECT .* FROM','retry\\(','await '];
const MODULES=['auth','cache','ledger','raft','mesh','index','queue','planner','session','billing','gossip','router','saga','quorum'];
const PKGS=['libssl','openssl','log4j-core','lodash','axios','protobuf-runtime','jackson-databind','urllib3','glibc','curl','zlib','xz-utils'];
const CVSS=['7.1','7.5','8.2','8.8','9.1','9.8','9.8','8.8','9.1'];
const METRICS=[['p99 latency','down','ms'],['tail latency','down','ms'],['error rate','down','%'],['memory RSS','down','MB'],['GC pause','down','ms'],['cold-start','down','ms'],['lock contention','down','%'],['allocation rate','down','/s'],['throughput','up','rps']];
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
function scanOut(t){
  if(t==='Glob')return ri(3,240)+' files';
  if(t==='Grep')return ri(0,80)+' matches in '+ri(1,40)+' files';
  return grp(ri(40,1200))+' lines, '+ri(2,40)+' symbols';
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
function FILE(path){return {kind:'filehl',path:path};}
function SNIP(path,write){return Object.assign(genSnippet(path),{write:!!write});}
function CNT(field,delta){return {kind:'counter',field:field,delta:delta};}
function CLR(){return {kind:'clear'};}
function WAIT(ms){return {kind:'wait',wait:ms};}
function OV(op,o){return Object.assign({kind:'ov',op:op},o);}

/* ====================================================================== */
/* DOM REFS                                                                */
/* ====================================================================== */
const $=s=>document.querySelector(s);
const logEl=$('#log'), caret=$('#caret'), railTasks=$('#tasktree'), fileTreeEl=$('#filetree');
const overlay=$('#overlay'), ovback=overlay.querySelector('.backdrop');
const bossEl=$('#boss'), settingsEl=$('#settings'), helpEl=$('#help'), toastEl=$('#toast'), liveBtn=$('#livebtn'), cfgbtn=$('#cfgbtn'), dramaEl=$('#dramapick');
const hAgent=$('.h-agent'),hProj=$('.h-proj'),hModel=$('.h-model'),ctxbar=$('.ctxbar'),ctxpct=$('.ctxpct'),hTok=$('.h-tok'),hCost=$('.h-cost'),hBudget=$('.h-budget'),hTime=$('.h-time'),modeind=$('#modeind');
const cFiles=$('#c-files'),cLines=$('#c-lines'),cTests=$('#c-tests'),cCves=$('#c-cves'),cDeploys=$('#c-deploys');

/* ====================================================================== */
/* STATE                                                                   */
/* ====================================================================== */
const MAX_LINES=500, REL_CAP=10, MAX_PER_FRAME=8;
let logicalNow=0, nextAt=320, pending=null, lastTs=0, rafId=0, hidden=false;
let paused=false, mode=cfg.mode, speed=cfg.speed, dramaOn=(cfg.dramas!=='off'), dramaFreq=cfg.freq;
let releaseTokens=0, lastRelease=0;
let overlayActive=false, dramaQ=[], nextDramaAt=U(45000,75000)/cfg.freq, firstDrama=true, lastCompact=-99999;
let activeThinker=null, lastEmit=0, lastVisible='';
let bossActive=false, bossFrame=0, settingsOpen=false, helpOpen=false, dramaOpen=false;
let idleActive=false, idleThreshold=cfg.idle, lastActivityTs=0;   // deep-work "away" mode
let tok=82, ctx=58, ctxAnim=null;
let cost=0, burnPct=14, burnWarn=false, burnEase=null;   // cost/burn meter
let mxActive=false, mx={cols:[],fs:14}, accentCache='#ff9d2f';
let btopActive=false, btopState=null, btopLast=0;
let liveState=null;   // generic per-frame ticker for live boss scenes (gpu/heatmap)
const startEpoch=Date.now();
const counters={files:128,lines:412000,tests:1204,cves:7,deploys:0,commits:0,incidents:0};
const taskEls={}; const fileEls={}; let lastFileHl=null;
const SPIN=['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'];

/* ====================================================================== */
/* FILE TREE                                                               */
/* ====================================================================== */
function buildFileTree(){
  const root={};
  FILES.forEach(p=>{const parts=p.split('/');let n=root;parts.forEach((part,i)=>{const leaf=i===parts.length-1;if(leaf){(n.__files||(n.__files=[])).push({name:part,path:p});}else{n=n[part]||(n[part]={});}});});
  fileTreeEl.innerHTML='';
  (function walk(node,depth){
    Object.keys(node).filter(k=>k!=='__files').sort().forEach(dir=>{
      const d=document.createElement('div');d.className='ft-row ft-dir';d.style.paddingLeft=(depth*1.2)+'ch';d.textContent=dir+'/';fileTreeEl.appendChild(d);
      walk(node[dir],depth+1);
    });
    (node.__files||[]).forEach(f=>{
      const el=document.createElement('div');el.className='ft-row ft-file';el.style.paddingLeft=(depth*1.2)+'ch';el.textContent=f.name;el.dataset.path=f.path;fileTreeEl.appendChild(el);fileEls[f.path]=el;
    });
  })(root,0);
}
function highlightFile(path){
  const el=fileEls[path]; if(!el)return;
  if(lastFileHl && lastFileHl!==el){lastFileHl.classList.remove('hl');}
  el.classList.add('hl','glow'); lastFileHl=el;
  el.scrollIntoView({block:'nearest'});
  setTimeout(()=>el.classList.remove('glow'),900);
}

/* ====================================================================== */
/* RENDERER                                                                */
/* ====================================================================== */
const VISIBLE={line:1,tool:1,output:1,diff:1,phase:1,ov:1,snippet:1};
function appendLine(node){
  const txt=node.textContent;
  if(txt && txt===lastVisible) return;   // drop: never two identical consecutive log lines
  lastVisible=txt;
  logEl.insertBefore(node,caret);
  while(logEl.childElementCount>MAX_LINES+1){
    const f=logEl.firstChild; if(f===caret)break; logEl.removeChild(f);
  }
  autoscroll();
}
function el(cls,text){const d=document.createElement('div');d.className=cls;if(text!=null)d.textContent=text;return d;}
function spn(cls,text){const s=document.createElement('span');s.className=cls;if(text!=null)s.textContent=text;return s;}
function svgEl(tag,attrs){const e=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const k in attrs)e.setAttribute(k,attrs[k]);return e;}

function render(ev){
  if(VISIBLE[ev.kind] && ev.kind!=='thinking') finalizeThinker();
  switch(ev.kind){
    case 'line':{
      appendLine(el('ln '+(ev.cls?ev.cls+' ':'')+'tone-'+(ev.tone||'fg'),ev.text)); break;
    }
    case 'phase':{ appendLine(el('ln phase',ev.text)); break; }
    case 'tool':{
      const d=el('ln tool');
      d.appendChild(spn('tdot','⏺ ')); d.appendChild(spn('tname',ev.tool));
      d.appendChild(document.createTextNode('('));
      d.appendChild(spn('targ',ev.arg));
      d.appendChild(document.createTextNode(')'));
      appendLine(d); ctxBump(1.3); burnTick(); break;
    }
    case 'output':{
      const d=el('ln out tone-'+(ev.tone||'dim'));
      d.appendChild(spn('br','⎿ ')); d.appendChild(document.createTextNode(ev.text));
      appendLine(d); break;
    }
    case 'diff':{
      const add=ev.sign==='+';
      appendLine(el('ln diff '+(add?'add':'del'),(add?'+ ':'- ')+ev.text)); break;
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
    case 'filehl': highlightFile(ev.path); break;
    case 'counter': bumpCounter(ev.field,ev.delta); break;
    case 'clear': railTasks.innerHTML=''; for(const k in taskEls)delete taskEls[k]; break;
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
const APP_BUILDERS={grafana:buildGrafana,pipeline:buildPipeline,flame:buildFlame,cluster:buildCluster,
  trace:buildTrace,sql:buildSql,load:buildLoad,pr:buildPR,docker:buildDocker,btop:buildBtop,
  attackmap:buildAttack,gpu:buildGpu,mesh:buildMesh,heatmap:buildHeat};
function buildApp(tool,body,ev){ const b=APP_BUILDERS[tool]; if(b) b(body,ev); }
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
  const S={phase:'normal', cores:[], procs:[], hist:[], histN:80, villain:null, pegList:[]};
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
function applyBtopPhase(S){
  if(S.phase==='spike'){
    S.pegList.forEach(i=>S.cores[i].peg=true);
    S.memTgt=U(0.82,0.92);
    if(S.villain){ S.villain.spike=true; S.villain.spikeCpu=ri(380,760); }
  } else if(S.phase==='recover'){
    S.cores.forEach(c=>c.peg=false); S.memTgt=U(0.46,0.56);
    if(S.villain){ S.villain.spike=false; S.villain.killed=true; S.villain.row.classList.add('bt-dead'); }
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
  S.memPct.textContent=Math.round(S.memCur*100)+'%'; S.memGb.textContent=(S.memCur*16).toFixed(1)+'G';
  S.procs.forEach(p=>{
    const tgt=p.killed?0:p.spike?p.spikeCpu:(p.base*(0.6+Math.random()*0.9));
    p.cpu+=(tgt-p.cpu)*0.4; p.cpuEl.textContent=p.cpu.toFixed(1);
  });
  const before=S.procs.map(p=>p.pid).join();
  S.procs.sort((a,b)=>b.cpu-a.cpu);
  if(S.procs.map(p=>p.pid).join()!==before) renderProcs(S);
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
    const outs=1+ri(0,2);
    for(let j=0;j<outs;j++) yield OUT(scanOut(t),'dim',{burst:true});
    if(t==='Read'){ yield FILE(f); if(rng()<0.45) yield SNIP(f,false); }
    else if(rng()<0.4) yield FILE(pick(FILES));
  }
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
  yield TASK('scan','map deps','✔');      yield TASK('map','build model','✔');
  yield TASK('plan','write plan','✔');     yield TASK('impl','implement '+m.short,'○');
  yield TASK('test','run tests','○');      yield TASK('deploy','ship','○');
}
function* pImpl(m){
  yield PHASE('IMPLEMENT');
  yield TASK('impl','implement '+m.short,'◐');
  yield FILE(m.rootFile);
  const edits=2+ri(0,3);
  for(let i=0;i<edits;i++){
    const f=i===0?m.rootFile:pick(FILES);
    const write=rng()<0.3;
    yield TOOL(write?'Write':'Edit',f); yield FILE(f);
    if(write){ yield SNIP(f,true); }
    else{
      const dl=2+ri(0,4);
      for(let j=0;j<dl;j++){ const a=rng()<0.72; yield DIFF(a?'+':'-',a?pickNR(ADD,'add'):pickNR(DEL,'del'),{wait:U(40,140)}); }
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
    yield OUT((total-1)+' passing, 1 failing ('+(2+rng()*3).toFixed(1)+'s)','warn',{burst:true});
    yield OUT('✗ '+pick(ASSERT),'err');
    yield THINK();
    yield L(pick(RETHINK),'warn',{wait:U(900,3200)});
    yield L(pick(DIAG),'dim');
    yield TOOL('Edit',m.rootFile); yield FILE(m.rootFile);
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
  yield TASK('deploy','ship','✔');
}
function* pDone(m){
  yield PHASE('DONE');
  yield BANNER('✔ '+cap(m.subject)+' shipped — '+pick(DONETAIL));
  yield CNT('tests',ri(1,6));
  yield L('Idle — watching for new work…','dim',{wait:U(1200,2600)});
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
  yield OUT('spike correlates with deploy '+hash(),'dim',{burst:true});
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
      if(r<0.4){ yield TOOL(pick(['Edit','Edit','MultiEdit','Bash','Read']),pick(FILES)); if(rng()<0.5) yield FILE(pick(FILES)); }
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
      yield L('Idle — scanning for the next big lever…','dim',{wait:U(1600,3200)});
    }
  }
  yield L('▌ Interactive session resumed — parking the deep-work pass','accent',{wait:U(300,600)});
  yield L('checkpointed · resumable from the last batch','dim',{wait:U(500,900)});
}
const DRAMAS={anomaly:dAnomaly,deploy:dDeploy,security:dSec,matrix:dMatrix,auth:dAuth,compaction:dCompact,
  grafana:dGrafana,pipeline:dPipeline,flame:dFlame,cluster:dCluster,
  trace:dTrace,sql:dSqlPlan,load:dLoad,pr:dPR,docker:dDocker,btop:dBtop,
  attackmap:dAttack,gpu:dGpu,mesh:dMesh,heatmap:dHeatmap};
const BOSS=['grafana','pipeline','flame','cluster','trace','sql','load','pr','docker','btop',
  'attackmap','gpu','mesh','heatmap'];
const CORE=['anomaly','deploy','security','auth','matrix'];
function enabledDramas(){ return dramaOn ? CORE.concat(BOSS) : []; }   // on → full roster; off → none (cadence is the frequency control)

/* ====================================================================== */
/* SCHEDULER                                                               */
/* ====================================================================== */
const top=missionStream();
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
function emit(ev){ render(ev); lastEmit=performance.now(); }

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
  // context compaction (condition-driven): a full overlay when dramas are on, a silent reset when off
  if(ctx>=80 && logicalNow-lastCompact>5000){
    if(dramaOn) dramaQ.push(DRAMAS.compaction);
    else ctxAnim={from:ctx,to:U(22,28),t0:performance.now(),dur:1400};   // silent compaction when dramas are off
    lastCompact=logicalNow; return;
  }
  if(!dramaOn)return;
  if(logicalNow>=nextDramaAt){
    let type;
    const en=enabledDramas();
    if(firstDrama && en.indexOf('anomaly')>=0){ type='anomaly'; firstDrama=false; }
    else { type=pick(en); firstDrama=false; }
    if(type&&DRAMAS[type]) dramaQ.push(DRAMAS[type]);
    nextDramaAt=logicalNow+U(60000,110000)/dramaFreq;
  }
}

/* ---- main rAF loop ---- */
function frame(ts){
  if(hidden)return;
  const dt=lastTs?Math.min(ts-lastTs,200):16; lastTs=ts;
  // visuals always
  updateHeader(ts,dt);
  updateThinker();
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
function burnTick(){            // every tool call nudges spend + budget pressure
  cost+=U(0.008,0.055);
  if(!burnWarn && !burnEase) burnPct=clamp(burnPct+U(0.6,1.9),0,99);
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
function forceDrama(){
  if(overlayActive||dramaQ.length){ toast('overlay busy'); return; }
  const en=enabledDramas(); const base=en.length?en:['deploy','anomaly','security','auth','matrix'];
  const type=pick(BOSS.concat(base)); dramaQ.push(DRAMAS[type]); toast('drama: '+type);
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

/* ====================================================================== */
/* SCENE PICKER (hotkey 'd') — fire any drama on demand for testing        */
/* ====================================================================== */
const SCENE_GROUPS=[
  {title:'Boss scenes', items:[
    ['btop','btop · runaway process'],['grafana','Grafana · SLO breach'],['pipeline','CI/CD pipeline'],
    ['flame','pprof flame graph'],['cluster','k9s · CrashLoopBackOff'],['trace','Jaeger slow trace'],
    ['sql','EXPLAIN · slow query'],['load','k6 load test'],['pr','GitHub pull request'],
    ['docker','docker buildx'],['attackmap','threat map · DDoS'],['gpu','GPU farm · throttle'],
    ['mesh','service mesh · breaker'],['heatmap','latency heatmap'] ]},
  {title:'Ambient drama', items:[
    ['deploy','deploy & rollout'],['security','CVE patch'],['auth','auth / secret rotation'],
    ['anomaly','metric anomaly'],['matrix','matrix cascade'],['compaction','context compaction'] ]},
  {title:'Special', items:[
    ['deepwork','deep work · away mode'] ]},
];
function queueDrama(name){
  if(!DRAMAS[name]){ toast('unknown scene'); return; }
  if(overlayActive||dramaQ.length){ toast('overlay busy'); return; }
  dramaQ.push(DRAMAS[name]); toast('scene: '+name);
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
  fld(g,'agent',txt(cfg.agent,v=>{cfg.agent=v;agentExplicit=!!v;hAgent.textContent=v||pickCodename(cfg.seed);syncURL();}),true);
  fld(g,'project',txt(cfg.project,v=>{cfg.project=v;hProj.textContent=v;syncURL();}));
  fld(g,'model',txt(cfg.model,v=>{cfg.model=v;hModel.textContent=v;syncURL();}));

  g=sec('Appearance');
  fld(g,'theme',sel(THEMES,cfg.theme,v=>setTheme(v)));
  fld(g,'CRT scanlines',sel(['off','on'],cfg.crt,v=>{cfg.crt=v;document.body.classList.toggle('crt',v==='on');syncURL();}));

  g=sec('Pacing');
  fld(g,'speed',rng_(0.25,4,0.05,speed,v=>{speed=v;syncURL();},v=>v.toFixed(2)+'×'));
  fld(g,'dramas',sel(['on','off'],dramaOn?'on':'off',v=>{dramaOn=(v==='on');cfg.dramas=v;syncURL();}));
  fld(g,'drama frequency',rng_(0.25,4,0.25,dramaFreq,v=>{dramaFreq=v;cfg.freq=v;nextDramaAt=logicalNow+U(60000,110000)/dramaFreq;syncURL();},v=>v.toFixed(2)+'×'));

  g=sec('Behavior');
  fld(g,'mode',sel(['auto','performer'],mode,v=>{mode=v;updateMode();syncURL();}));
  fld(g,'audio',sel(['off','on'],cfg.audio,v=>{cfg.audio=v;if(v==='on')audioUnlock();syncURL();}));
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
  if(cfg.model!=='mythos-5-preview')p.set('model',cfg.model);
  if(cfg.theme!=='amber')p.set('theme',cfg.theme);
  if(speed!==1)p.set('speed',speed.toFixed(2));
  if(!dramaOn)p.set('dramas','off');
  if(dramaFreq!==1)p.set('freq',dramaFreq.toFixed(2));
  if(mode!=='auto')p.set('mode',mode);
  if(cfg.audio!=='off')p.set('audio',cfg.audio);
  if(cfg.crt!=='off')p.set('crt',cfg.crt);
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
  cfg.model='mythos-5-preview'; cfg.audio='off'; cfg.crt='off'; cfg.reduceFlash=null;
  cfg.idle=90; idleThreshold=90; exitIdle();
  speed=1; dramaOn=true; cfg.dramas='on'; dramaFreq=1; cfg.freq=1; mode='auto'; cfg.project=PROJECTS[(rng()*PROJECTS.length)|0];
  cfg.seed=(Math.random()*4294967296)>>>0; _seed=cfg.seed; seedExplicit=false;
  cfg.agent=pickCodename(cfg.seed); agentExplicit=false;
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
let actx=null, master=null;
function audioUnlock(){
  if(cfg.audio!=='on'||actx)return;
  try{ actx=new (window.AudioContext||window.webkitAudioContext)(); master=actx.createGain(); master.gain.value=0.06; master.connect(actx.destination); }catch(e){ actx=null; }
}
function tone(freq,dur,type,vol,when){
  if(!actx)return; const t=(when||actx.currentTime); const o=actx.createOscillator(),g=actx.createGain();
  o.type=type||'square'; o.frequency.value=freq; o.connect(g); g.connect(master);
  g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vol||0.3,t+0.004); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  o.start(t); o.stop(t+dur+0.02);
}
function blip(){ if(!actx)return; tone(420+rng()*180,0.03,'square',0.28); }
function beep(kind){
  if(cfg.audio!=='on'||!actx)return; const t=actx.currentTime;
  if(kind==='alert'){ tone(660,0.16,'triangle',0.35,t); tone(440,0.22,'triangle',0.35,t+0.16); }
  else if(kind==='deploy'){ tone(523,0.12,'triangle',0.3,t); tone(659,0.16,'triangle',0.3,t+0.10); }
  else if(kind==='ok'){ tone(784,0.14,'sine',0.28,t); }
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
  window.__HYP={state:()=>({lines:logEl.childElementCount,counters:Object.assign({},counters),mode,paused,speed,dramas:dramaOn,freq:dramaFreq,ctx:Math.round(ctx),overlayActive,idle:idleActive,logicalNow:Math.round(logicalNow),missionId}),force:forceDrama,drama:n=>{if(DRAMAS[n]&&!overlayActive&&!dramaQ.length)dramaQ.push(DRAMAS[n]);return n;},deepwork:enterIdle,wake:markActivity,seed:cfg.seed};
}
})();
