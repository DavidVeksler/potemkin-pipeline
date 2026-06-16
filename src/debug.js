// test/debug hook — only exposed with ?debug in the URL, so production ships zero global surface
if(cfg.debug){
  window.__HYP={state:()=>({lines:logEl.childElementCount,counters:Object.assign({},counters),mode,paused,speed,dramas:dramaOn,freq:dramaFreq,ctx:Math.round(ctx),overlayActive,idle:idleActive,logicalNow:Math.round(logicalNow),ticketSeq,platform:cfg.platform,agent:cfg.agent,profile:agentProfile===NEUTRAL_PROFILE?'neutral':cfg.agent,profileBias:agentProfile.bias}),force:forceDrama,drama:n=>{if(DRAMAS[n])enqueueDrama(DRAMAS[n],n);return n;},deepwork:enterIdle,wake:markActivity,seed:cfg.seed};
}
