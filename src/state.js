/* ====================================================================== */
/* STATE                                                                   */
/* ====================================================================== */
const MAX_LINES=500, REL_CAP=10, MAX_PER_FRAME=8;
let logicalNow=0, nextAt=320, pending=null, lastTs=0, rafId=0, hidden=false;
let paused=false, mode=cfg.mode, speed=cfg.speed, dramaOn=(cfg.dramas!=='off'), dramaFreq=cfg.freq;
let releaseTokens=0, lastRelease=0;
let overlayActive=false, dramaQ=[], nextDramaAt=U(45000,75000)/cfg.freq, firstDrama=true, lastCompact=-99999;
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
