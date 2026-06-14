/* ---- header decorations ---- */
let lastHeaderTs=0, lastTokTs=0;
function updateHeader(ts,dt){
  // elapsed (recompute from wall clock — no drift)
  const s=Math.floor((Date.now()-startEpoch)/1000);
  const hh=Math.floor(s/3600), mm=Math.floor((s%3600)/60), ss=s%60;
  hTime.textContent=(hh>0?String(hh).padStart(2,'0')+':':'')+String(mm).padStart(2,'0')+':'+String(ss).padStart(2,'0');
  // ctx animation
  if(ctxAnim){
    const p=clamp((ts-ctxAnim.t0)/ctxAnim.dur,0,1); const e=1-Math.pow(1-p,3);
    ctx=ctxAnim.from+(ctxAnim.to-ctxAnim.from)*e; if(p>=1)ctxAnim=null;
  }
  if(ts-lastHeaderTs>120){ lastHeaderTs=ts; renderCtx(); renderBurn(ts); }
  // tok/s random walk
  if(ts-lastTokTs>160){
    lastTokTs=ts;
    const thinking=!!activeThinker;
    const bursting=(ts-lastEmit)<140 && !paused;
    const target=thinking?56:bursting?106:84;
    tok+=(target-tok)*0.10+U(-3,3); tok=clamp(tok,40,120);
    hTok.textContent=(paused?'— ':Math.round(tok)+' ')+'tok/s';
  }
}
function renderCtx(){
  const pct=Math.round(clamp(ctx,0,100)), n=10, fill=Math.round(pct/100*n);
  ctxbar.textContent='▮'.repeat(fill)+'░'.repeat(n-fill);
  ctxpct.textContent=pct+'%';
}
function ctxBump(x){ if(!ctxAnim) ctx=clamp(ctx+x,0,98); }

/* ---- cost / burn meter ---- */
const BURN_LINES=[
  'budget guard: switching to terser reasoning to conserve tokens',
  'pruning low-signal context to stay under the cap…',
  'batching the remaining tool calls to cut overhead',
  'dropping scratchpad history — keeping only the load-bearing bits',
  'summarizing earlier steps to reclaim budget',
  'note to self: fewer, bigger edits from here',
];
function fmtCost(n){ return '$'+(n<1000?n.toFixed(2):compactNum(Math.round(n))); }
function burnTick(tokens){      // every tool call nudges spend + budget pressure; heavier calls cost more
  cost+=0.002 + (tokens||0)*0.0000045 + U(0.004,0.016);
  if(!burnWarn && !burnEase) burnPct=clamp(burnPct+U(0.6,1.9),0,99);
  // codebase steadily grows as the "agent" churns — keep footer counters alive between mission beats
  bumpCounter('lines',ri(2,80));
  if(rng()<0.12) bumpCounter('files',1);
  if(rng()<0.2) bumpCounter('tests',ri(1,4));
}
function renderBurn(ts){
  // trip the 80% warning, then "nervously work around it" — ease the budget back down
  if(burnPct>=80 && !burnWarn && !burnEase){
    burnWarn=true; hBudget.hidden=false; hBudget.classList.toggle('pulse',!reduceMotion);
    hBudget.textContent='⚠ token budget '+Math.round(burnPct)+'%';
    injectBurnLine();
    burnEase={from:burnPct,to:U(42,56),t0:ts,dur:reduceMotion?700:3200,hideAt:ts+(reduceMotion?900:2600)};
  }
  if(burnEase){
    const p=clamp((ts-burnEase.t0)/burnEase.dur,0,1), e=1-Math.pow(1-p,3);
    burnPct=burnEase.from+(burnEase.to-burnEase.from)*e;
    if(burnWarn && ts>=burnEase.hideAt){ burnWarn=false; hBudget.hidden=true; hBudget.classList.remove('pulse'); }
    if(p>=1) burnEase=null;
  }
  hCost.textContent=fmtCost(cost);
}
function injectBurnLine(){
  const d=el('ln out tone-warn');
  d.appendChild(spn('br','⎿ ')); d.appendChild(document.createTextNode(pick(BURN_LINES)));
  appendLine(d);
}
