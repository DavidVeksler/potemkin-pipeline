/* ====================================================================== */
/* SCHEDULER                                                               */
/* ====================================================================== */
const top=ticketStream();
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
function emit(ev){ render(ev); sfx(ev); lastEmit=performance.now(); }

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
// a "beat" is one complete animation: a header event plus the continuation events that finish
// its visual unit (a tool call + its output/diff/snippet/counter, an overlay step, a line).
// beat-starts introduce a new unit; clear/wait/thinking are glue that pull the following start
// into the same beat so a keypress never strands on an invisible or half-finished animation.
function isBeatStart(ev){
  switch(ev.kind){
    case 'tool': case 'phase': case 'task': case 'ov': case 'line': return true;
    default: return false;   // output diff snippet filehl counter → continuations
  }
}
// emit one whole beat; returns events emitted. Bounded by MAX_PER_FRAME so a giant run can't dump.
function emitBeat(){
  if(!pending)return 0;
  let n=0;
  for(;;){
    const glue=pending.kind==='clear'||pending.kind==='wait'||pending.kind==='thinking';
    emitOne(); n++;
    if(!pending||n>=MAX_PER_FRAME)break;
    if(isBeatStart(pending)&&!glue)break;
  }
  return n;
}
function checkDrama(){
  if(overlayActive||dramaQ.length)return;
  // context compaction (condition-driven): only when the window is genuinely near-full (like real auto-compact),
  // a full overlay when dramas are on, a silent reset when off
  if(ctx>=92 && logicalNow-lastCompact>5000){
    if(dramaOn) dramaQ.push(DRAMAS.compaction);
    else ctxAnim={from:ctx,to:U(22,28),t0:performance.now(),dur:1400};   // silent compaction when dramas are off
    lastCompact=logicalNow; return;
  }
  if(!dramaOn)return;
  if(logicalNow>=nextDramaAt){
    let type;
    const en=enabledDramas();
    if(firstDrama && cfg.vibe && VIBES[cfg.vibe] && VIBES[cfg.vibe].open && en.indexOf(VIBES[cfg.vibe].open)>=0){ type=VIBES[cfg.vibe].open; firstDrama=false; }  // vibe's signature opener
    else if(firstDrama && en.indexOf('anomaly')>=0){ type='anomaly'; firstDrama=false; }
    else if(cfg.vibe && VIBES[cfg.vibe] && rng()<0.62){   // vibe presets favor their signature scenes
      const bias=VIBES[cfg.vibe].bias.filter(id=>en.indexOf(id)>=0);
      type=bias.length?pick(bias):pick(en); firstDrama=false;
    }
    else if(agentProfile.bias.length && rng()<0.45){      // agent temperament tilts scene odds (#5)
      const bias=agentProfile.bias.filter(id=>en.indexOf(id)>=0);
      type=bias.length?pick(bias):pick(en); firstDrama=false;
    }
    else { type=pick(en); firstDrama=false; }
    if(type&&DRAMAS[type]) dramaQ.push(DRAMAS[type]);
    // clustered cadence: squared draw biases the gap toward ~0 (bursts fire back-to-back, gated only by play time)
    // with rare long lulls. Mean ≈ 85s preserved (255000·⅓), so overall density matches the old U(60000,110000).
    nextDramaAt=logicalNow+Math.pow(rng(),2)*255000/dramaFreq;
  }
}

/* ---- main rAF loop ---- */
function frame(ts){
  if(hidden)return;
  const dt=lastTs?Math.min(ts-lastTs,200):16; lastTs=ts;
  // visuals always
  updateHeader(ts,dt);
  updateThinker();
  updateTools();
  if(mxActive) drawMatrix();
  if(btopActive) tickBtop(ts);
  if(liveState) liveState.tick(ts);
  if(bossActive){ bossFrame+=dt*0.012; bossEl.querySelector('.sp').textContent=SPIN[Math.floor(bossFrame)%SPIN.length]; }
  tickIdle(ts);
  // engine
  if(!paused && !bossActive){
    if(mode==='auto'){ logicalNow+=dt*speed; pumpAuto(); }
    else { // performer: each keypress queues one beat (a complete animation). Release queued beats at
           // a steady rate, frame-rate independent, capped per frame so a mash never dumps the stream.
      if(releaseTokens>0){
        let beats=Math.min(Math.floor((ts-lastRelease)/25),releaseTokens), events=0;
        if(beats>0){
          for(let i=0;i<beats&&events<MAX_PER_FRAME;i++){ releaseTokens--; events+=emitBeat(); }
          lastRelease=ts;
        }
      } else { lastRelease=ts; }
    }
  }
  flushRender();   // batched DOM: insert this frame's queued log lines + scroll once
  rafId=requestAnimationFrame(frame);
}
