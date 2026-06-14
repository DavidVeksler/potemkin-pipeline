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
  // ---- Infrastructure & containers ----
  {id:'cluster',      label:'k9s · CrashLoopBackOff',      category:'Infrastructure & containers', generator:dCluster,       appBuilder:buildCluster,  weight:1,autoplay:true, requiresMotion:false,tags:['boss']},
  {id:'docker',       label:'docker buildx',               category:'Infrastructure & containers', generator:dDocker,        appBuilder:buildDocker,   weight:1,autoplay:true, requiresMotion:false,tags:['boss']},
  {id:'gpu',          label:'GPU farm · throttle',         category:'Infrastructure & containers', generator:dGpu,           appBuilder:buildGpu,      weight:1,autoplay:true, requiresMotion:false,tags:['boss']},
  {id:'mesh',         label:'service mesh · breaker',      category:'Infrastructure & containers', generator:dMesh,          appBuilder:buildMesh,     weight:1,autoplay:true, requiresMotion:false,tags:['boss']},
  {id:'dns',          label:'DNS propagation',             category:'Infrastructure & containers', generator:dDns,           appBuilder:buildDns,      weight:1,autoplay:true, requiresMotion:false,tags:['boss']},
  {id:'chaos',        label:'chaos · game day',            category:'Infrastructure & containers', generator:dChaos,         appBuilder:null,          weight:1,autoplay:true, requiresMotion:false,tags:['boss']},
  {id:'kafka',        label:'kafka · consumer lag',        category:'Infrastructure & containers', generator:dKafka,         appBuilder:buildKafka,    weight:1,autoplay:true, requiresMotion:false,tags:['boss']},
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
