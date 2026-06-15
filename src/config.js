/* ====================================================================== */
/* CONFIG                                                                  */
/* ====================================================================== */
const QS=new URLSearchParams(location.search);
const THEMES=['amber','green','cyan'];
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
const VIBES={
  'startup-crunch':       {speed:1.4, freq:1.9, seed:1337,  theme:'amber', bias:['deploy','pipeline','pr','vim','tmux','swarm','chatter','docker']},
  'enterprise-migration': {speed:0.8, freq:0.7, seed:90909, theme:'cyan',  bias:['rebase','octopus','sql','terraform','docker','cluster','mergeconflict','cherrypick']},
  'security-incident':    {speed:1.2, freq:2.3, seed:31337, theme:'green', bias:['attackmap','security','auth','filterrepo','pager','anomaly','dns','postmortem']},
};
const VIBE = VIBES[QS.get('vibe')] || null;
/* agent temperaments — a codename isn't just a label, it's a behavioral profile.
   bias[] tilts scene probability; rethink[] colors the agent's voice; boot opens
   mission #1. Codenames without an entry (NOVA/FLUX/VECTOR/ORBIT) and any custom
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
  model: QS.get('model')||'mythos-5-preview',
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
