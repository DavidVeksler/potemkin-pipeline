/* ====================================================================== */
/* DOM REFS                                                                */
/* ====================================================================== */
const $=s=>document.querySelector(s);
const logEl=$('#log'), caret=$('#caret'), railTasks=$('#tasktree'), fileTreeEl=$('#filetree');
const overlay=$('#overlay'), ovback=overlay.querySelector('.backdrop');
const bossEl=$('#boss'), settingsEl=$('#settings'), helpEl=$('#help'), toastEl=$('#toast'), liveBtn=$('#livebtn'), cfgbtn=$('#cfgbtn'), dramaEl=$('#dramapick');
const hAgent=$('.h-agent'),hProj=$('.h-proj'),hModel=$('.h-model'),ctxbar=$('.ctxbar'),ctxpct=$('.ctxpct'),hTok=$('.h-tok'),hCost=$('.h-cost'),hBudget=$('.h-budget'),hTime=$('.h-time'),modeind=$('#modeind');
const cFiles=$('#c-files'),cLines=$('#c-lines'),cTests=$('#c-tests'),cCves=$('#c-cves'),cDeploys=$('#c-deploys'),cCommits=$('#c-commits'),cIncidents=$('#c-incidents');
