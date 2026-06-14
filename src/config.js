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
