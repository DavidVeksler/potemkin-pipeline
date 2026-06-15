/* seed-search.js — exhaustive offline curator for vibe seeds.
   Replicates the engine's deterministic STARTUP exactly so we can score seeds and pick
   the one whose load-time identity best fits each vibe. Multi-core (worker_threads),
   scans the ENTIRE 32-bit seed space by default — you cannot search deeper than every seed.

   ── What is actually tunable by seed (and what is NOT) ───────────────────────────────
   Only draws 1..6 of the rng stream happen BEFORE the first animation frame, so only
   these are reproducible from the seed alone (independent of screen size / frame rate):
       codename  = hashU32(seed) % CODENAMES.length     (separate hash, not the stream)
       draw 1    = nextDramaAt  U(45000,75000)          (discarded here — vibe overrides it)
       draw 2    = counters.files  ri(80,250)
       draw 3    = counters.lines  ri(80,600)*1000
       draw 4    = counters.tests  ri(800,2500)
       draw 5    = counters.cves   ri(2,12)
       draw 6    = project = PROJECTS[(rng()*24)|0]      (init()'s first line)
   The post-load SCENE SEQUENCE is deliberately NOT scored: burnTick() draws a variable
   number of rng values gated by the burn-meter ease timer (real frame ms), and
   startMatrix()/drawMatrix() draw counts that scale with canvas size and frame count.
   So which scenes fire, in what order, is a function of viewport + frame rate, not the
   seed — "tuning" it would only hold on one machine. We tune what's truly reproducible:
   codename temperament, on-theme project, and the footer counters visible from second one.

   Run:  node tools/seed-search.js                 (exhaustive: all 4,294,967,296 seeds)
         node tools/seed-search.js --range=2000000 (quick smoke scan of the first N seeds)
         node tools/seed-search.js --workers=16    (override core count)
*/
'use strict';
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const os = require('os');

const PROJECTS = ["sovereignty-ledger","blast-radius-index","intent-router","causality-bus","trust-fabric","policy-singularity","rollback-horizon","containment-plane","lineage-vault","anomaly-foundry","semantic-firewall","determinism-engine","drift-sentinel","fallback-mesh","compliance-reactor","graph-of-record","schema-bunker","runtime-diplomacy","shadow-config","telemetry-cathedral","cache-armistice","event-horizon-log","idempotency-chamber","blast-door-proxy"];
const CODENAMES = ["CURSOR-X","NOVA","FLUX","VECTOR","KERNEL","RELAY","PRISM","ORBIT","FORGE","PILOT"];

// agent temperaments (src/config.js AGENT_PROFILES) — only the bias[] matters for ranking
const AGENT_BIAS = {
  'KERNEL':['btop','oom','cpuheat','flame','gpu','thermal'],
  'PRISM':['grafana','trace','heatmap','anomaly','sql','pager'],
  'FORGE':['deploy','pipeline','pr','docker','rebase','octopus','terraform'],
  'PILOT':['security','auth','pr','bisect','reflog','postmortem'],
  'RELAY':['mesh','cluster','kafka','dns','chaos','anomaly'],
  'CURSOR-X':['swarm','chatter','vim','tmux','matrix','pr'],
};  // NOVA/FLUX/VECTOR/ORBIT fall back to NEUTRAL (no bias)

const VIBE_BIAS = {
  'startup-crunch':       ['deploy','pipeline','pr','vim','tmux','swarm','chatter','docker'],
  'enterprise-migration': ['rebase','octopus','sql','terraform','docker','cluster','mergeconflict','cherrypick'],
  'security-incident':    ['attackmap','security','auth','filterrepo','pager','anomaly','dns','postmortem'],
};
// curated on-theme project pools per vibe, BEST-FIRST (index 0 = most evocative). The search
// REQUIRES the #1 project (pool[0]) when one exists at the ideal codename; pool rank is the
// fallback ordering only if no seed hits both ideal codename and pool[0] (never happens at 2^32).
const VIBE_PROJECTS = {
  'startup-crunch':       ['intent-router','causality-bus','rollback-horizon','runtime-diplomacy','fallback-mesh','determinism-engine','telemetry-cathedral'],
  'enterprise-migration': ['compliance-reactor','schema-bunker','lineage-vault','graph-of-record','policy-singularity','sovereignty-ledger','shadow-config'],
  'security-incident':    ['blast-radius-index','semantic-firewall','containment-plane','blast-door-proxy','event-horizon-log','trust-fabric','anomaly-foundry'],
};

/* Footer-counter "vibe profile". Each counter is normalized to 0..1 over its draw range;
   target is the on-theme ideal, w is how loudly that counter speaks for the scenario.
   Reasoning per vibe:
     startup-crunch       lean greenfield repo shipped fast → small files/lines, lots of
                          tests (move-fast-with-a-net), almost no known CVEs.
     enterprise-migration huge legacy monolith → max files+lines+tests; CVE backlog mid-high.
     security-incident    a live SEV-1 → CVE count is THE signal (max it, heavy weight);
                          mid codebase; under-tested (security debt).
   ranges: files ri(80,250) · lines ri(80,600)k · tests ri(800,2500) · cves ri(2,12) */
const COUNTER_RANGE = { files:[80,250], lines:[80,600], tests:[800,2500], cves:[2,12] };  // lines in thousands
const VIBE_COUNTERS = {
  'startup-crunch':       { files:{t:0.10,w:1.0}, lines:{t:0.10,w:1.0}, tests:{t:0.85,w:1.2}, cves:{t:0.03,w:1.6} },
  'enterprise-migration': { files:{t:0.97,w:1.5}, lines:{t:0.97,w:1.5}, tests:{t:0.88,w:1.0}, cves:{t:0.55,w:0.8} },
  'security-incident':    { files:{t:0.50,w:0.6}, lines:{t:0.55,w:0.6}, tests:{t:0.25,w:0.8}, cves:{t:1.00,w:3.0} },
};

// ---- exact engine math (verbatim from src/rng.js / src/state.js) ----
function hashU32(s){ s=Math.imul(s^(s>>>16),0x45d9f3b)>>>0; s=Math.imul(s^(s>>>16),0x45d9f3b)>>>0; return (s^(s>>>16))>>>0; }
function pickCodename(seed){ return CODENAMES[hashU32(seed>>>0)%CODENAMES.length]; }
// startup identity for one seed: codename + the 4 footer counters + project (draws 2..6)
function identity(seed){
  let s=seed>>>0;
  const draw=()=>{ s=(s+0x6D2B79F5)|0; let t=s; t=Math.imul(t^(t>>>15),1|t); t=(t+Math.imul(t^(t>>>7),61|t))^t; return ((t^(t>>>14))>>>0)/4294967296; };
  const ri=(a,b)=>a+Math.floor(draw()*(b-a+1));
  draw();                                  // draw 1: nextDramaAt (discarded — vibe overrides)
  const files=ri(80,250);                  // draw 2
  const lines=ri(80,600)*1000;             // draw 3
  const tests=ri(800,2500);                // draw 4
  const cves=ri(2,12);                      // draw 5
  const project=PROJECTS[(draw()*PROJECTS.length)|0];   // draw 6
  return { codename:pickCodename(seed), files, lines, tests, cves, project };
}

// best codename per vibe = max bias overlap with the vibe's signature scenes
function overlap(a,b){ return a.filter(x=>b.indexOf(x)>=0).length; }
function idealCodename(vibe){
  const vb=VIBE_BIAS[vibe];
  return Object.keys(AGENT_BIAS).map(c=>({c,o:overlap(AGENT_BIAS[c],vb)})).sort((x,y)=>y.o-x.o)[0];
}
const TARGET = {};   // vibe -> {cn, overlap, project, counters}  (the fixed ideal each seed is scored against)
for(const v of Object.keys(VIBE_BIAS)){
  const ic=idealCodename(v);
  TARGET[v]={ cn:ic.c, overlap:ic.o, project:VIBE_PROJECTS[v][0], counters:VIBE_COUNTERS[v] };
}
const CN_TO_VIBE = {};   // a seed's codename maps to at most one vibe (ideal codenames are distinct)
for(const v of Object.keys(TARGET)) CN_TO_VIBE[TARGET[v].cn]=v;

// counter fit ∈ (-∞,0], 0 = perfect. squared error, weighted, normalized per range.
function counterFit(id, vibe){
  const C=VIBE_COUNTERS[vibe], R=COUNTER_RANGE;
  const n=(val,key,scale)=>((val/(scale||1))-R[key][0])/(R[key][1]-R[key][0]);
  let f=0;
  f-=C.files.w*Math.pow(n(id.files,'files')-C.files.t,2);
  f-=C.lines.w*Math.pow(n(id.lines,'lines',1000)-C.lines.t,2);
  f-=C.tests.w*Math.pow(n(id.tests,'tests')-C.tests.t,2);
  f-=C.cves .w*Math.pow(n(id.cves,'cves') -C.cves .t,2);
  return f;
}

// ============================ WORKER ============================
if(!isMainThread){
  const { lo, hi } = workerData;
  const best = {};   // vibe -> {seed, id, fit}
  for(let s=lo; s<hi; s++){
    const cn = pickCodename(s);
    const vibe = CN_TO_VIBE[cn];
    if(!vibe) continue;                          // not an ideal codename for any vibe — skip rng work
    const id = identity(s);
    if(id.project !== TARGET[vibe].project) continue;   // require the #1 on-theme project
    const fit = counterFit(id, vibe);
    const b = best[vibe];
    if(!b || fit>b.fit || (fit===b.fit && s<b.seed)) best[vibe]={ seed:s, id, fit };
  }
  parentPort.postMessage(best);
  return;
}

// ============================ MAIN ============================
function parseArg(name, def){ const a=process.argv.find(x=>x.startsWith('--'+name+'=')); return a?Number(a.split('=')[1]):def; }
const FULL = 4294967296;                                  // 2^32
const RANGE = parseArg('range', FULL);
const NW = Math.max(1, parseArg('workers', Math.max(1, os.cpus().length - 1)));

// ---- validation against live-engine ground truth (codename + project prove draw alignment;
//      counters reuse the same aligned draws with formulas copied verbatim from state.js) ----
const GROUND_TRUTH = [
  [1337,'KERNEL','anomaly-foundry'],
  [90909,'KERNEL','rollback-horizon'],
  [31337,'KERNEL','sovereignty-ledger'],
  [42,'RELAY','drift-sentinel'],
  [7,'VECTOR','anomaly-foundry'],
];
let ok=true;
console.log('validating harness against live-engine ground truth…');
for(const [s,a,p] of GROUND_TRUTH){
  const id=identity(s);
  const pass = id.codename===a && id.project===p;
  if(!pass) ok=false;
  console.log(`  seed ${s}: ${id.codename}${id.codename===a?'':' ✗ want '+a} / ${id.project}${id.project===p?'':' ✗ want '+p}  ${pass?'OK':'MISMATCH'}`);
}
if(!ok){ console.log('\n❌ harness diverges from the live engine — DO NOT trust the search\n'); process.exit(1); }
console.log('✅ harness matches the live engine — model is faithful\n');

console.log(`scanning ${RANGE.toLocaleString()} seeds across ${NW} workers…`);
for(const v of Object.keys(TARGET)) console.log(`  ${v.padEnd(22)} → ideal codename ${TARGET[v].cn} (bias∩vibe ${TARGET[v].overlap}), project ${TARGET[v].project}`);

const t0=Date.now();
const chunk=Math.ceil(RANGE/NW);
let done=0; const merged={};
function fold(part){
  for(const v of Object.keys(part)){
    const b=part[v], m=merged[v];
    if(!m || b.fit>m.fit || (b.fit===m.fit && b.seed<m.seed)) merged[v]=b;
  }
}
for(let w=0; w<NW; w++){
  const lo=w*chunk, hi=Math.min(RANGE,(w+1)*chunk);
  if(lo>=hi){ if(++done===NW) finish(); continue; }
  const wk=new Worker(__filename,{ workerData:{ lo, hi } });
  wk.on('message',m=>{ fold(m); });
  wk.on('error',e=>{ console.error('worker error',e); process.exit(1); });
  wk.on('exit',()=>{ if(++done===NW) finish(); });
}

function bar(val,key,scale){ const R=COUNTER_RANGE; const n=Math.max(0,Math.min(1,((val/(scale||1))-R[key][0])/(R[key][1]-R[key][0]))); const f=Math.round(n*10); return '▰'.repeat(f)+'▱'.repeat(10-f); }
function finish(){
  const secs=((Date.now()-t0)/1000).toFixed(1);
  console.log(`\nscan complete in ${secs}s\n`);
  const patch={};
  for(const v of Object.keys(TARGET)){
    const b=merged[v];
    if(!b){ console.log(`=== ${v} ===  no seed hit ideal codename + #1 project (widen the search)`); continue; }
    const id=b.id;
    console.log(`=== ${v} ===`);
    console.log(`  ★ seed ${b.seed}  →  ${id.codename} / ${id.project}   (counter-fit ${b.fit.toFixed(4)})`);
    console.log(`     files ${String(id.files).padStart(4)} ${bar(id.files,'files')}   lines ${String(id.lines/1000).padStart(3)}k ${bar(id.lines,'lines',1000)}`);
    console.log(`     tests ${String(id.tests).padStart(4)} ${bar(id.tests,'tests')}   cves  ${String(id.cves).padStart(4)} ${bar(id.cves,'cves')}`);
    patch[v]={ seed:b.seed, id };
  }
  console.log('\n--- VIBES seed patch (src/config.js) ---');
  for(const v of Object.keys(patch)){ const p=patch[v]; if(p) console.log(`  '${v}': seed ${p.seed}  // → ${p.id.codename} / ${p.id.project}  ·  files ${p.id.files} lines ${p.id.lines/1000}k tests ${p.id.tests} cves ${p.id.cves}`); }
}
