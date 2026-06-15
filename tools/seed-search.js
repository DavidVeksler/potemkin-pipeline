/* seed-search.js — offline curator for vibe seeds.
   Replicates the engine's deterministic startup EXACTLY so we can score millions of
   seeds and pick the one whose natural codename + project best fit each vibe.

   Fidelity model (audited from src/, build order in build.ps1):
   - codename = hashU32(seed) % CODENAMES.length        (independent of the rng stream)
   - the ONLY load-time rng() draws before init() are in state.js, in this order:
       1 nextDramaAt=U(45000,75000)   2 files=ri(80,250)   3 lines=ri(80,600)
       4 tests=ri(800,2500)           5 cves=ri(2,12)
   - init()'s first line is the project pick = PROJECTS[(rng()*24)|0]  → the 6th draw
   Run: node tools/seed-search.js          (validate + search, prints a VIBES patch)
*/
'use strict';

const PROJECTS = ["sovereignty-ledger","blast-radius-index","intent-router","causality-bus","trust-fabric","policy-singularity","rollback-horizon","containment-plane","lineage-vault","anomaly-foundry","semantic-firewall","determinism-engine","drift-sentinel","fallback-mesh","compliance-reactor","graph-of-record","schema-bunker","runtime-diplomacy","shadow-config","telemetry-cathedral","cache-armistice","event-horizon-log","idempotency-chamber","blast-door-proxy"];
const CODENAMES = ["CURSOR-X","NOVA","FLUX","VECTOR","KERNEL","RELAY","PRISM","ORBIT","FORGE","PILOT"];

// agent temperaments (src/config.js AGENT_PROFILES) — only the bias[] matters here
const AGENT_BIAS = {
  'KERNEL':['btop','oom','cpuheat','flame','gpu','thermal'],
  'PRISM':['grafana','trace','heatmap','anomaly','sql','pager'],
  'FORGE':['deploy','pipeline','pr','docker','rebase','octopus','terraform'],
  'PILOT':['security','auth','pr','bisect','reflog','postmortem'],
  'RELAY':['mesh','cluster','kafka','dns','chaos','anomaly'],
  'CURSOR-X':['swarm','chatter','vim','tmux','matrix','pr'],
};
// NOVA/FLUX/VECTOR/ORBIT fall back to NEUTRAL (no bias)

const VIBE_BIAS = {
  'startup-crunch':       ['deploy','pipeline','pr','vim','tmux','swarm','chatter','docker'],
  'enterprise-migration': ['rebase','octopus','sql','terraform','docker','cluster','mergeconflict','cherrypick'],
  'security-incident':    ['attackmap','security','auth','filterrepo','pager','anomaly','dns','postmortem'],
};
// curated on-theme project pools per vibe, BEST-FIRST (earlier = more evocative of the scenario)
const VIBE_PROJECTS = {
  'startup-crunch':       ['intent-router','causality-bus','rollback-horizon','runtime-diplomacy','fallback-mesh','determinism-engine','telemetry-cathedral'],
  'enterprise-migration': ['compliance-reactor','schema-bunker','lineage-vault','graph-of-record','policy-singularity','sovereignty-ledger','shadow-config'],
  'security-incident':    ['blast-radius-index','semantic-firewall','containment-plane','blast-door-proxy','event-horizon-log','trust-fabric','anomaly-foundry'],
};

// ---- exact engine math ----
function hashU32(s){ s=Math.imul(s^(s>>>16),0x45d9f3b)>>>0; s=Math.imul(s^(s>>>16),0x45d9f3b)>>>0; return (s^(s>>>16))>>>0; }
function pickCodename(seed){ return CODENAMES[hashU32(seed>>>0)%CODENAMES.length]; }
function makeRng(seed){ let _s=seed>>>0; return function(){ _s=(_s+0x6D2B79F5)|0; let t=_s; t=Math.imul(t^(t>>>15),1|t); t=(t+Math.imul(t^(t>>>7),61|t))^t; return ((t^(t>>>14))>>>0)/4294967296; }; }
function projectOf(seed){
  const r=makeRng(seed);
  r(); r(); r(); r(); r();          // 5 state.js load draws (nextDramaAt, files, lines, tests, cves)
  return PROJECTS[(r()*PROJECTS.length)|0];   // 6th draw = init() project pick
}

// ---- validation against live-engine ground truth ----
const GROUND_TRUTH = [
  [1337,'KERNEL','anomaly-foundry'],
  [90909,'KERNEL','rollback-horizon'],
  [31337,'KERNEL','sovereignty-ledger'],
  [42,'RELAY','drift-sentinel'],
  [7,'VECTOR','anomaly-foundry'],
];
let ok=true;
for(const [s,a,p] of GROUND_TRUTH){
  const ga=pickCodename(s), gp=projectOf(s);
  const pass = ga===a && gp===p;
  if(!pass) ok=false;
  console.log(`  seed ${s}: codename ${ga}${ga===a?'':' ✗ want '+a}  project ${gp}${gp===p?'':' ✗ want '+p}  ${pass?'OK':'MISMATCH'}`);
}
console.log(ok ? '\n✅ harness matches the live engine — model is faithful\n' : '\n❌ harness diverges — DO NOT trust the search\n');
if(!ok) process.exit(1);

// ---- scoring ----
function overlap(a,b){ return a.filter(x=>b.indexOf(x)>=0).length; }
// best codename(s) per vibe = max bias overlap with the vibe's signature scenes
function rankCodenames(vibe){
  const vb=VIBE_BIAS[vibe];
  return Object.keys(AGENT_BIAS).map(c=>({c,o:overlap(AGENT_BIAS[c],vb)})).sort((x,y)=>y.o-x.o);
}
function score(seed,vibe){
  const cn=pickCodename(seed), proj=projectOf(seed);
  const cnOverlap=AGENT_BIAS[cn]?overlap(AGENT_BIAS[cn],VIBE_BIAS[vibe]):0;
  const pool=VIBE_PROJECTS[vibe], pi=pool.indexOf(proj);
  const projScore=pi>=0?(pool.length-pi):0;   // best-first: earlier pool entry scores higher
  // codename alignment dominates (×100), project evocativeness is the secondary sort key
  return {seed,cn,proj,cnOverlap,projScore,onTheme:pi>=0,total:cnOverlap*100+projScore};
}

const RANGE=2_000_000;   // speed-run 2M seeds per vibe — far past the "10K+" ask
const patch={};
for(const vibe of Object.keys(VIBE_BIAS)){
  const ranked=rankCodenames(vibe);
  console.log(`\n=== ${vibe} ===`);
  console.log('  codename fit (bias∩vibe):', ranked.map(r=>`${r.c}:${r.o}`).join('  '));
  let best=null, themedHits=0; const top=[];
  for(let s=0;s<RANGE;s++){
    const r=score(s,vibe);
    if(r.cnOverlap===ranked[0].o && r.onTheme) themedHits++;
    if(!best || r.total>best.total){ best=r; top.length=0; top.push(r); }   // new max → reset candidate list (smallest seed wins ties)
    else if(r.total===best.total && top.length<6) top.push(r);
  }
  console.log(`  scanned ${RANGE.toLocaleString()} seeds — ${themedHits.toLocaleString()} hit the ideal codename + on-theme project`);
  console.log('  top candidates:', top.map(r=>`seed ${r.seed} → ${r.cn}/${r.proj}`).join('  |  '));
  console.log(`  ★ chosen seed ${best.seed}: codename ${best.cn} (overlap ${best.cnOverlap}), project ${best.proj}, score ${best.total}`);
  patch[vibe]={seed:best.seed,codename:best.cn,project:best.proj};
}
console.log('\n--- VIBES seed patch ---');
for(const v of Object.keys(patch)) console.log(`  '${v}': seed ${patch[v].seed}  // → ${patch[v].codename} on ${patch[v].project}`);
