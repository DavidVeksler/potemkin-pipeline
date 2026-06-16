/* ====================================================================== */
/* AUDIO (WebAudio, no assets)                                             */
/* ====================================================================== */
let actx=null, master=null, comp=null, revIn=null, revSend=null, audioConfirmed=false;
function audioUnlock(){
  if(cfg.audio!=='on')return;
  try{
    if(!actx){ actx=new (window.AudioContext||window.webkitAudioContext)(); buildGraph(); }
    if(actx.state==='suspended') actx.resume().then(audioConfirm,()=>{});   // browsers start the context suspended until a gesture resumes it
    else audioConfirm();
  }catch(e){ actx=null; }
}
/* FX bus: voices → master(0.16) → compressor(glue) → out; cues also tap revIn → convolver(synth impulse) → wet → compressor */
function buildGraph(){
  master=actx.createGain(); master.gain.value=0.16;
  comp=actx.createDynamicsCompressor(); master.connect(comp); comp.connect(actx.destination);
  const conv=actx.createConvolver(); conv.buffer=impulse(1.6,3.2);
  const wetG=actx.createGain(); wetG.gain.value=0.05;   // low: revIn taps full voice gain, pre-master
  revIn=actx.createGain(); revIn.connect(conv); conv.connect(wetG); wetG.connect(comp);
}
function impulse(dur,decay){   // exponential-decay noise → a room, no asset
  const n=(actx.sampleRate*dur)|0, b=actx.createBuffer(2,n,actx.sampleRate);
  for(let c=0;c<2;c++){ const d=b.getChannelData(c); for(let i=0;i<n;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/n,decay); }
  return b;
}
function wet(fn){ const s=revSend; revSend=revIn; try{fn();}finally{revSend=s;} }   // route a cue's voices to reverb (read synchronously at node-build time)
function audioConfirm(){   // a rising two-note chime the first time audio actually starts, so it's obvious it works
  if(audioConfirmed||!actx||actx.state!=='running')return;
  audioConfirmed=true; const t=actx.currentTime;
  tone(523,0.12,'sine',0.3,t); tone(784,0.16,'sine',0.3,t+0.11);
}
/* --- synth primitives -------------------------------------------------- */
function tone(freq,dur,type,vol,when){
  if(!actx)return; const t=(when||actx.currentTime); const o=actx.createOscillator(),g=actx.createGain(),f=actx.createBiquadFilter();
  o.type=type||'square'; o.frequency.value=freq;
  f.type='lowpass'; f.Q.value=0.7; f.frequency.setValueAtTime(Math.min(freq*6,16000),t); f.frequency.exponentialRampToValueAtTime(Math.max(freq*1.4,300),t+dur);   // pluck: cutoff falls with the note
  o.connect(f); f.connect(g); g.connect(master); if(revSend)g.connect(revSend);
  g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vol||0.3,t+0.004); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  o.start(t); o.stop(t+dur+0.02);
}
function sweep(f0,f1,dur,type,vol,when){   // a pitch glide — risers, whooshes, klaxon wails
  if(!actx)return; const t=(when||actx.currentTime); const o=actx.createOscillator(),g=actx.createGain(),f=actx.createBiquadFilter();
  o.type=type||'sawtooth'; o.frequency.setValueAtTime(f0,t); o.frequency.exponentialRampToValueAtTime(Math.max(1,f1),t+dur);
  f.type='lowpass'; f.Q.value=0.7; f.frequency.setValueAtTime(Math.min(Math.max(f0,f1)*5,16000),t); f.frequency.exponentialRampToValueAtTime(Math.max(Math.min(f0,f1)*1.4,300),t+dur);
  o.connect(f); f.connect(g); g.connect(master); if(revSend)g.connect(revSend);
  g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vol||0.25,t+0.02); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  o.start(t); o.stop(t+dur+0.02);
}
function noise(dur,vol,hp,when){   // filtered white-noise burst — impacts, rumble beds
  if(!actx)return; const t=(when||actx.currentTime); const n=Math.max(1,(actx.sampleRate*dur)|0);
  const buf=actx.createBuffer(1,n,actx.sampleRate), d=buf.getChannelData(0);
  for(let i=0;i<n;i++) d[i]=Math.random()*2-1;
  const src=actx.createBufferSource(); src.buffer=buf; const g=actx.createGain();
  g.gain.setValueAtTime(vol||0.2,t); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  let node=src; if(hp){ const f=actx.createBiquadFilter(); f.type='highpass'; f.frequency.value=hp; src.connect(f); node=f; }
  node.connect(g); g.connect(master); if(revSend)g.connect(revSend); src.start(t); src.stop(t+dur+0.02);
}
function arp(freqs,step,dur,type,vol,when){   // ascending/descending run of notes
  if(!actx)return; const t=(when||actx.currentTime); freqs.forEach((f,i)=>tone(f,dur,type||'triangle',vol||0.28,t+i*step));
}
function blip(){ if(!actx)return; tone(420+rng()*180,0.03,'square',0.28); }

/* --- named cues -------------------------------------------------------- */
function klaxon(){   // descending two-tone alarm, wailed three times over a low rumble — the drama hits
  if(!actx)return; const t=actx.currentTime;
  for(let i=0;i<3;i++){ const tt=t+i*0.30; sweep(780,520,0.15,'sawtooth',0.34,tt); sweep(520,780,0.14,'sawtooth',0.30,tt+0.15); }
  noise(0.55,0.10,140,t);
}
function fanfare(){   // triumphant rising arpeggio + sparkle — ships to prod
  if(!actx)return; const t=actx.currentTime;
  arp([523,659,784,1047],0.09,0.18,'triangle',0.32,t);
  tone(1568,0.30,'sine',0.22,t+0.36); tone(2093,0.20,'sine',0.12,t+0.40);
}
function resolveChord(){   // warm major triad — crisis resolved, all green
  if(!actx)return; const t=actx.currentTime;
  tone(196,0.6,'sine',0.10,t);                                  // octave-down root for body
  [392,494,587,784].forEach((f,i)=>tone(f,0.5,'sine',0.16,t+i*0.018));   // micro-roll reads as a resolve, dodges phase-mush
}
function tick(){ if(!actx)return; tone(1320+rng()*240,0.012,'square',0.06); }   // soft pip — a slot fills, an agent reports back
function beep(kind){
  if(cfg.audio!=='on'||!actx)return;
  if(kind==='alert') wet(klaxon);
  else if(kind==='deploy') wet(fanfare);
  else if(kind==='ok') wet(resolveChord);
  else if(kind==='tick') tick();
}

/* --- per-event scoring: every emitted event gets a voice ---------------- */
let lastTick=0;
function sfx(ev){
  if(cfg.audio!=='on'||!actx||actx.state!=='running')return;
  const now=performance.now();
  switch(ev.kind){
    case 'line': case 'output':{   // streaming text → quiet typewriter ticks (throttled so fast bursts don't buzz)
      if(now-lastTick<55)return; lastTick=now; tone(1500+rng()*500,0.010,'square',0.05); break;
    }
    case 'tool': sweep(440,900,0.07,'square',0.16); break;            // crisp "select" chirp
    case 'phase': sweep(200,640,0.26,'sawtooth',0.18); break;          // rising whoosh on a new phase
    case 'diff': tone(ev.sign==='+'?880:330,0.05,'triangle',0.14); break;
    case 'thinking': tone(150,0.20,'sine',0.13); break;               // low contemplative pulse
    case 'snippet': for(let i=0;i<4;i++) tone(1400+rng()*600,0.012,'square',0.05,actx.currentTime+i*0.03); break;
    case 'task': if(ev.state==='✔'){ tone(784,0.10,'sine',0.20); tone(1047,0.13,'sine',0.18,actx.currentTime+0.06); } break;
    case 'clear': sweep(820,200,0.22,'sine',0.12); break;
    case 'counter': if(now-lastTick>110){ lastTick=now; tone(2000+rng()*300,0.008,'square',0.035); } break;
    case 'filehl': if(now-lastTick>90){ lastTick=now; tone(900+rng()*200,0.014,'triangle',0.05); } break;   // soft cursor-move as a file lights up
    case 'ov': sfxOverlay(ev,now); break;
  }
}
function sfxOverlay(ev,now){
  switch(ev.op){
    case 'open': case 'app': wet(()=>{ sweep(120,900,0.5,'sawtooth',0.22); noise(0.4,0.06,200); }); break;   // tension riser as the overlay slams open
    case 'banner': if(ev.cls&&ev.cls.indexOf('ok')>=0) wet(resolveChord); break;
    case 'boxline': if(now-lastTick>40){ lastTick=now; tone(1200+rng()*300,0.010,'square',0.06); } break;
    case 'bar': tone(1500,0.010,'square',0.045); break;
  }
}
