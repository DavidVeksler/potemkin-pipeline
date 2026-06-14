/* ====================================================================== */
/* RENDERER                                                                */
/* ====================================================================== */
const VISIBLE={line:1,tool:1,output:1,diff:1,phase:1,ov:1,snippet:1};
function appendLine(node){
  const txt=node.textContent;
  if(txt && txt===lastVisible) return;   // drop: never two identical consecutive log lines
  lastVisible=txt;
  logEl.insertBefore(node,caret);
  while(logEl.childElementCount>MAX_LINES+1){
    const f=logEl.firstChild; if(f===caret)break; logEl.removeChild(f);
  }
  autoscroll();
}
function el(cls,text){const d=document.createElement('div');d.className=cls;if(text!=null)d.textContent=text;return d;}
function spn(cls,text){const s=document.createElement('span');s.className=cls;if(text!=null)s.textContent=text;return s;}
function svgEl(tag,attrs){const e=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const k in attrs)e.setAttribute(k,attrs[k]);return e;}

// per-call token cost — Math.random flavor (not seeded; like toolSig/jitter). Heavy calls always
// carry a count and feed the burn meter, so cost ticks come *from* visible work. 0 = no trailing tag.
function toolTokens(t){
  const R=Math.random;
  if(t==='Bash'||t==='Task'||t==='WebFetch'||t.startsWith('mcp__')) return 400+Math.floor(R()*R()*4200);
  if(t==='Read'||t==='Grep'||t==='MultiEdit'||t==='Write') return R()<0.5 ? 300+Math.floor(R()*1700) : 0;
  return R()<0.25 ? 200+Math.floor(R()*900) : 0;
}
// cosmetic key:value tool params — Math.random (flavor, not seeded/load-bearing; mustn't touch the rng stream)
function toolSig(t){
  const R=Math.random, P=a=>a[Math.floor(R()*a.length)], ps=[];
  if(t==='Read'){ if(R()<0.45){ if(R()<0.6) ps.push(['offset',1+Math.floor(R()*1600)]); ps.push(['limit',P([40,60,80,100,120,200])]); } }
  else if(t==='Grep'){ if(R()<0.7) ps.push(['glob',JSON.stringify(P(['*.ts','*.js','**/*.go','*.py','*.rs','src/**']))]); if(R()<0.5) ps.push(['output_mode',JSON.stringify(P(['content','files_with_matches']))]); else if(R()<0.3) ps.push(['-n','true']); }
  else if(t==='Bash'){ if(R()<0.35) ps.push(['timeout',P([60000,120000,300000])]); }
  else if(t==='Glob'){ if(R()<0.4) ps.push(['path',JSON.stringify(P(['src','app','.','packages/core','services']))]); }
  else if(t==='Task'){ ps.push(['subagent_type',JSON.stringify(P(['Explore','general-purpose','code-reviewer','Plan']))]); }
  else if(t==='WebFetch'){ if(R()<0.5) ps.push(['prompt',JSON.stringify(P(['summarize advisory','extract CVSS vector','affected versions?']))]); }
  return ps;
}
function render(ev){
  if(VISIBLE[ev.kind] && ev.kind!=='thinking') finalizeThinker();
  if(VISIBLE[ev.kind] && ev.kind!=='tool' && ev.kind!=='output') resolveTool();
  switch(ev.kind){
    case 'line':{
      appendLine(el('ln '+(ev.cls?ev.cls+' ':'')+'tone-'+(ev.tone||'fg'),ev.text)); break;
    }
    case 'phase':{ appendLine(el('ln phase',ev.text)); break; }
    case 'tool':{
      resolveTool();
      const d=el('ln tool');
      const dot=spn('tdot pending',SPIN[0]+' '); d.appendChild(dot);
      if(ev.tool.startsWith('mcp__')){   // mcp__server__action — dim the namespace, normal action
        const p=ev.tool.split('__');
        d.appendChild(spn('tns','mcp__'+p[1]+'__'));
        d.appendChild(spn('tname',p.slice(2).join('__')));
      } else d.appendChild(spn('tname',ev.tool));
      d.appendChild(document.createTextNode('('));
      d.appendChild(spn('targ',ev.arg));
      for(const [k,v] of toolSig(ev.tool).slice(0,2)){   // key: value extra params
        d.appendChild(document.createTextNode(', '));
        d.appendChild(spn('tkey',k)); d.appendChild(document.createTextNode(': '));
        d.appendChild(spn('tval',String(v)));
      }
      d.appendChild(document.createTextNode(')'));
      const tk=toolTokens(ev.tool);
      if(tk) d.appendChild(spn('ttok',' · '+compactNum(tk)+' tokens'));
      appendLine(d); activeTool={dot:dot,start:logicalNow}; ctxBump(1.3); burnTick(tk); break;
    }
    case 'output':{
      const d=el('ln out tone-'+(ev.tone||'dim'));
      d.appendChild(spn('br','⎿ ')); d.appendChild(document.createTextNode(ev.text));
      appendLine(d);
      if(ev.more) appendLine(el('ln out collapse','… +'+ev.more+' lines (ctrl+r to expand)'));
      resolveTool(ev.tone); break;
    }
    case 'diff':{
      const add=ev.sign==='+';
      appendLine(el('ln diff '+(add?'add':'del'),(add?'+ ':'- ')+ev.text)); break;
    }
    case 'thinking':{
      finalizeThinker();
      const d=el('ln think'); d.appendChild(document.createTextNode('✻ Thinking… '));
      const sp=spn('t','0.0s'); d.appendChild(sp); appendLine(d);
      activeThinker={el:d,span:sp,start:logicalNow}; break;
    }
    case 'snippet':{
      const box=el('ln snip'+(ev.write?' write':''));
      const hd=el('snip-hd'); hd.appendChild(spn('lang',ev.lang));
      hd.appendChild(document.createTextNode((ev.write?'✎ ':'⎿ ')+ev.path));
      box.appendChild(hd);
      ev.lines.forEach(l=>{ const cl=el('cl'); cl.appendChild(hiCode(l)); box.appendChild(cl); });
      appendLine(box); ctxBump(1.1); break;
    }
    case 'task': renderTask(ev); break;
    case 'filehl': highlightFile(ev.path,ev.st); break;
    case 'counter': bumpCounter(ev.field,ev.delta); break;
    case 'clear': railTasks.innerHTML=''; for(const k in taskEls)delete taskEls[k]; clearFileStatus(); break;
    case 'ov': renderOverlay(ev); break;
    case 'wait': break;
  }
}
function finalizeThinker(){ if(activeThinker){ activeThinker=null; } }
function updateThinker(){
  if(!activeThinker)return;
  if(!activeThinker.el.isConnected){activeThinker=null;return;}
  activeThinker.span.textContent=((logicalNow-activeThinker.start)/1000).toFixed(1)+'s';
}
function resolveTool(tone){   // swap pending spinner → solid dot; tone colors the dot (err/warn/ok)
  if(!activeTool)return;
  const dot=activeTool.dot; activeTool=null;
  if(!dot.isConnected)return;
  dot.textContent='⏺ '; dot.className='tdot'+(tone&&tone!=='dim'?' tone-'+tone:'');
}
function updateTools(){   // animate the pending spinner char
  if(!activeTool)return;
  if(!activeTool.dot.isConnected){activeTool=null;return;}
  activeTool.dot.textContent=SPIN[Math.floor((logicalNow-activeTool.start)/80)%SPIN.length]+' ';
}
function renderTask(ev){
  let li=taskEls[ev.id];
  if(!li){ li=document.createElement('li'); taskEls[ev.id]=li; railTasks.appendChild(li); }
  const stClass=ev.state==='✔'?'tk-done':ev.state==='◐'?'tk-prog':'tk-todo';
  li.className=stClass;
  li.innerHTML='';
  li.appendChild(spn('tk-mk',ev.state)); li.appendChild(document.createTextNode(' '+ev.label));
}
function bumpCounter(field,delta){
  if(delta<=0)return; counters[field]=(counters[field]||0)+delta;
  if(field==='files')cFiles.textContent=compactNum(counters.files);
  else if(field==='lines')cLines.textContent=compactNum(counters.lines);
  else if(field==='tests')cTests.textContent=compactNum(counters.tests);
  else if(field==='cves')cCves.textContent=compactNum(counters.cves);
  else if(field==='deploys')cDeploys.textContent=compactNum(counters.deploys);
  else if(field==='commits')cCommits.textContent=compactNum(counters.commits);
  else if(field==='incidents')cIncidents.textContent=compactNum(counters.incidents);
}
/* ---- autoscroll ---- */
let pinned=true;
function autoscroll(){ if(pinned) logEl.scrollTop=logEl.scrollHeight; }
logEl.addEventListener('scroll',()=>{
  const nearBottom=logEl.scrollHeight-logEl.scrollTop-logEl.clientHeight<40;
  pinned=nearBottom; liveBtn.style.display=nearBottom?'none':'block';
});
liveBtn.addEventListener('click',()=>{pinned=true;liveBtn.style.display='none';logEl.scrollTop=logEl.scrollHeight;});
