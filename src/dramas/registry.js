const DRAMAS={anomaly:dAnomaly,deploy:dDeploy,security:dSec,matrix:dMatrix,auth:dAuth,compaction:dCompact,
  grafana:dGrafana,pipeline:dPipeline,flame:dFlame,cluster:dCluster,
  trace:dTrace,sql:dSqlPlan,load:dLoad,pr:dPR,docker:dDocker,btop:dBtop,oom:dOom,
  attackmap:dAttack,gpu:dGpu,mesh:dMesh,heatmap:dHeatmap,cpuheat:dCpuheat,swarm:dSwarm,
  rebase:dRebase,mergeconflict:dMergeConflict,bisect:dBisect,reflog:dReflog,
  cherrypick:dCherryPick,filterrepo:dFilterRepo,octopus:dOctopus,blame:dBlame};
const BOSS=['grafana','pipeline','flame','cluster','trace','sql','load','pr','docker','btop','oom',
  'attackmap','gpu','mesh','heatmap','cpuheat','swarm'];
const GIT=['rebase','mergeconflict','bisect','reflog','cherrypick','filterrepo','octopus','blame'];
const CORE=['anomaly','deploy','security','auth','matrix'];
function enabledDramas(){ return dramaOn ? CORE.concat(BOSS,GIT) : []; }   // on → full roster; off → none (cadence is the frequency control)
