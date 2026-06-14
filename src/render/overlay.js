/* ====================================================================== */
/* OVERLAY RENDERER                                                        */
/* ====================================================================== */
let ovBox=null;
function ovClear(){ overlay.querySelectorAll(':scope > :not(.backdrop)').forEach(n=>n.remove()); ovBox=null; }
function renderOverlay(ev){
  switch(ev.op){
    case 'open':{
      overlayActive=true; ovClear();
      overlay.className='on'+(reduceFlash?'':' fadein'); overlay.classList.remove('fadeout');
      overlay.classList.add(ev.type==='anomaly'?'anomaly':ev.type==='box'?'box':'matrix');
      ovback.style.background='';
      if(ev.type==='matrix'){ startMatrix(); }
      break;
    }
    case 'banner':{
      let b=overlay.querySelector('#ovbanner'); if(!b){b=el('','');b.id='ovbanner';overlay.appendChild(b);}
      b.textContent=ev.text; b.className=(ev.cls&&ev.cls.indexOf('ok')>=0?'ok ':'')+((ev.cls&&ev.cls.indexOf('pulse')>=0&&!reduceFlash)?'pulse':'');
      if(ev.cls&&ev.cls.indexOf('ok')>=0){overlay.classList.add('ok-tint');overlay.classList.remove('anomaly');}
      break;
    }
    case 'box':{
      ovBox=el(''); ovBox.id='ovbox';
      if(ev.variant) ovBox.dataset.variant=ev.variant;
      ovBox.appendChild(el('ovtitle',ev.title));
      ovBox.appendChild(el('ovbody'));
      overlay.appendChild(ovBox);
      break;
    }
    case 'boxline':{
      if(!ovBox)return; ovBox.querySelector('.ovbody').appendChild(el('obl tone-'+(ev.tone||'fg'),ev.text)); break;
    }
    case 'bar':{
      if(!ovBox)return;
      let bar=ovBox.querySelector('.ovbar'); if(!bar){bar=el('ovbar');ovBox.appendChild(bar);}
      const seg=14, fill=Math.round(ev.frac*seg);
      bar.innerHTML=''; bar.appendChild(document.createTextNode('['+'▰'.repeat(fill)+'▱'.repeat(seg-fill)+'] '+Math.round(ev.frac*100)+'%'));
      bar.appendChild(spn('lbl',ev.label));
      break;
    }
    case 'compact':{ ctxAnim={from:ctx,to:U(22,28),t0:performance.now(),dur:(ev.wait||1600)*0.85}; break; }
    case 'app':{
      overlayActive=true; ovClear(); btopActive=false; btopState=null; liveState=null;
      overlay.className='on'+(reduceFlash?'':' fadein'); overlay.classList.remove('fadeout');
      overlay.classList.add('app');
      ovback.style.background='';
      const win=el(''); win.id='appwin'; win.dataset.tool=ev.tool;
      const bar=el('appbar'); const dots=el('dots'); ['r','y','g'].forEach(c=>dots.appendChild(spn('dot '+c))); bar.appendChild(dots);
      bar.appendChild(spn('atitle',ev.title)); if(ev.url) bar.appendChild(spn('aurl',ev.url));
      win.appendChild(bar);
      const body=el('appbody'); buildApp(ev.tool,body,ev); win.appendChild(body);
      overlay.appendChild(win); ovBox=win;
      if(ev.tool==='btop'){ sizeBtop(); btopActive=true; btopLast=0; }
      break;
    }
    case 'btopfx':{ if(btopState){ btopState.phase=ev.phase; applyBtopPhase(btopState); } break; }
    case 'livefx':{ if(liveState&&liveState.phase) liveState.phase(ev.phase); break; }
    case 'appstep':{
      if(!ovBox)return;
      ovBox.querySelectorAll('[data-k="'+ev.k+'"]').forEach(t=>{
        if(ev.state!=null) t.dataset.state=ev.state;
        if(ev.text!=null) t.textContent=ev.text;
        if(ev.cssVar) t.style.setProperty(ev.cssVar,ev.val);
      });
      break;
    }
    case 'matrix': break;
    case 'close':{
      overlayActive=false; mxActive=false; btopActive=false; btopState=null; liveState=null;
      overlay.classList.remove('fadein'); overlay.classList.add('fadeout');
      const o=overlay; setTimeout(()=>{ if(!overlayActive){o.className=''; ovClear();} },360);
      break;
    }
  }
}
/* ---- matrix rain ---- */
let mxCanvas=null;
function startMatrix(){
  mxActive=true;
  mxCanvas=document.createElement('canvas'); mxCanvas.id='mxcanvas'; overlay.appendChild(mxCanvas);
  const r=overlay.getBoundingClientRect();
  mxCanvas.width=r.width; mxCanvas.height=r.height;
  mx.fs=Math.max(12,Math.round(r.width/64));
  const n=Math.ceil(mxCanvas.width/mx.fs);
  mx.cols=new Array(n).fill(0).map(()=>(rng()*mxCanvas.height/mx.fs)|0);
}
function mxGlyph(){ const r=rng(); if(r<0.5)return String.fromCharCode(0x30A0+((rng()*96)|0)); if(r<0.8)return '0123456789abcdef'[(rng()*16)|0]; return '01'[(rng()*2)|0]; }
function drawMatrix(){
  if(!mxCanvas)return; const c=mxCanvas, x2=c.getContext('2d');
  x2.fillStyle='rgba(0,0,0,'+(reduceMotion?0.14:0.08)+')'; x2.fillRect(0,0,c.width,c.height);
  x2.font=mx.fs+'px monospace';
  for(let i=0;i<mx.cols.length;i++){
    const x=i*mx.fs, y=mx.cols[i]*mx.fs;
    x2.fillStyle=accentCache; x2.fillText(mxGlyph(),x,y);
    if(y>c.height && rng()>0.975) mx.cols[i]=0; else mx.cols[i]+=reduceMotion?0.45:1;
  }
}
