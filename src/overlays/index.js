/* ====================================================================== */
/* BOSS-LEVEL APP WINDOWS (faux tool GUIs the agent "pulls up")            */
/* ====================================================================== */
/* --- Grafana-style metrics dashboard --- */
function sparkPts(spike){
  let s='',n=20;
  for(let i=0;i<n;i++){
    const x=(i/(n-1))*100; let y=17+Math.sin(i*0.8+rng()*0.6)*5+(rng()*5-2.5);
    if(spike&&i>n*0.6) y-=((i-n*0.6)/(n*0.4))*15;
    s+=x.toFixed(1)+','+Math.max(3,Math.min(30,y)).toFixed(1)+' ';
  }
  return s.trim();
}
function gPanel(title,stat,unit,k,spike){
  const p=el('gp'); p.dataset.state='ok'; if(k)p.dataset.k=k;
  const h=el('gp-h'); h.appendChild(spn('gp-t',title));
  const s=spn('gp-s',stat); if(k)s.dataset.k=k+'-s'; h.appendChild(s); h.appendChild(spn('gp-u',unit));
  p.appendChild(h);
  const svg=svgEl('svg',{viewBox:'0 0 100 32',preserveAspectRatio:'none',class:'gp-c'});
  const pts=sparkPts(spike);
  svg.appendChild(svgEl('polyline',{class:'gp-area',points:'0,32 '+pts+' 100,32'}));
  svg.appendChild(svgEl('polyline',{class:'gp-line',points:pts}));
  p.appendChild(svg); return p;
}
function buildGrafana(body){
  const g=el('g-grid');
  g.appendChild(gPanel('Request Rate',compactNum(ri(8000,42000)),' rps','',false));
  g.appendChild(gPanel('p99 Latency',ri(40,180)+'',' ms','',false));
  g.appendChild(gPanel('Error Rate','0.0'+ri(1,9),' %','err',false));
  g.appendChild(gPanel('CPU Saturation',ri(28,61)+'',' %','',false));
  body.appendChild(g);
}
/* --- CI/CD pipeline DAG --- */
function buildPipeline(body,ev){
  const row=el('pl-row');
  ev.stages.forEach((s,i)=>{
    if(i) row.appendChild(el('pl-edge'));
    const n=el('pl-node'); n.dataset.k=i; n.dataset.state='pending';
    n.appendChild(el('pl-ic')); n.appendChild(el('pl-nm',s));
    row.appendChild(n);
  });
  body.appendChild(row);
  const lg=el('pl-log'); lg.dataset.k='log'; lg.textContent='queued · awaiting runner'; body.appendChild(lg);
}
/* --- CPU flamegraph --- */
function flameRows(){
  return [
    [{w:12,label:'main.serveHTTP'}],
    [{w:4,label:'router.match'},{w:8,label:'api.Handler'}],
    [{w:3,label:'auth.verify'},{w:2,label:'cache.get',k:'cool'},{w:7,label:'json.Marshal',k:'hot',hot:true}],
    [{w:2,label:'jwt.parse'},{w:1,label:'redis.do'},{w:6,label:'reflect.Value'}],
  ];
}
function buildFlame(body,ev){
  const fg=el('fg');
  ev.rows.forEach(r=>{
    const rowEl=el('fg-row');
    r.forEach(f=>{
      const fr=el('fg-fr',f.label); fr.style.setProperty('--g',f.w);
      if(f.k)fr.dataset.k=f.k; if(f.hot)fr.dataset.state='hot';
      rowEl.appendChild(fr);
    });
    fg.appendChild(rowEl);
  });
  body.appendChild(fg);
  const cap=el('fg-cap','sampling…'); cap.dataset.k='cap'; body.appendChild(cap);
}
/* --- k8s cluster topology --- */
function clusterNodes(){
  return [
    {x:36,y:90,r:15,l:'gateway'},
    {x:140,y:42,r:13,l:'api'},
    {x:140,y:138,r:13,l:'worker'},
    {x:240,y:42,r:12,l:'payments'},
    {x:240,y:138,r:12,l:'postgres'},
    {x:288,y:90,r:11,l:'redis'},
  ];
}
function buildCluster(body,ev){
  const svg=svgEl('svg',{viewBox:'0 0 320 184',class:'cl'});
  ev.edges.forEach(([a,b])=>{const p=ev.nodes[a],q=ev.nodes[b];
    svg.appendChild(svgEl('line',{x1:p.x,y1:p.y,x2:q.x,y2:q.y,class:'cl-edge'}));});
  ev.nodes.forEach((n,i)=>{
    const grp=svgEl('g',{class:'cl-node','data-k':'n'+i});
    grp.appendChild(svgEl('circle',{cx:n.x,cy:n.y,r:n.r,class:'cl-c'}));
    const t=svgEl('text',{x:n.x,y:n.y+n.r+9,'text-anchor':'middle',class:'cl-lbl'}); t.textContent=n.l;
    grp.appendChild(t); svg.appendChild(grp);
  });
  body.appendChild(svg);
  const cap=el('cl-cap','6 services · 14 pods ready'); cap.dataset.k='cap'; body.appendChild(cap);
}
/* --- subagent fleet board (orchestrator fan-out) --- */
function swarmAgents(){
  const names=shuffle(AGENTS.slice()).slice(0,6), tasks=shuffle(SUBTASKS.slice()).slice(0,6);
  return names.map((n,i)=>({id:n,task:tasks[i]}));
}
function buildSwarm(body,ev){
  const grid=el('sw-grid');
  ev.agents.forEach((a,i)=>{
    const card=el('sw-card'); card.dataset.k='a'+i; card.dataset.state='pending';
    card.appendChild(spn('sw-id','◐ '+a.id));
    card.appendChild(el('sw-task',a.task));
    const meta=el('sw-meta');
    const st=spn('sw-stat','idle'); st.dataset.k='a'+i+'-s'; meta.appendChild(st);
    const tk=spn('sw-tok','0'); tk.dataset.k='a'+i+'-t'; meta.appendChild(tk);
    card.appendChild(meta);
    const track=el('sw-bar'); const fill=el('sw-fill'); fill.dataset.k='a'+i+'-p';
    fill.style.setProperty('--p','0%'); track.appendChild(fill); card.appendChild(track);
    grid.appendChild(card);
  });
  body.appendChild(grid);
  const cap=el('sw-cap','orchestrator · 0/6 spawned'); cap.dataset.k='cap'; body.appendChild(cap);
}
/* --- distributed trace waterfall (Jaeger) --- */
function traceSpans(){
  return {total:486, spans:[
    {name:'gateway.handle',o:0,w:100,depth:0,ms:486},
    {name:'auth.verify',o:2,w:9,depth:1,ms:44},
    {name:'api.process',o:12,w:86,depth:1,ms:418},
    {name:'db.query',o:14,w:14,depth:2,ms:68},
    {name:'cache.get',o:29,w:4,depth:2,ms:19},
    {name:'payments.charge',o:34,w:22,depth:2,ms:107},
    {name:'serialize.json',o:57,w:41,depth:2,ms:312,k:'slow',slow:true},
  ]};
}
function buildTrace(body,ev){
  const wrap=el('tr');
  ev.spans.forEach(s=>{
    const row=el('tr-row');
    const lbl=el('tr-lbl',s.name); lbl.style.paddingLeft=(s.depth*1.4)+'ch'; row.appendChild(lbl);
    const track=el('tr-track');
    const bar=el('tr-bar'); bar.style.setProperty('--o',s.o+'%'); bar.style.setProperty('--w',s.w+'%');
    if(s.k)bar.dataset.k=s.k; if(s.slow)bar.dataset.state='slow';
    track.appendChild(bar); row.appendChild(track);
    const ms=spn('tr-ms',s.ms+'ms'); if(s.k)ms.dataset.k=s.k+'-d'; row.appendChild(ms);
    wrap.appendChild(row);
  });
  body.appendChild(wrap);
  const cap=el('tr-cap','total '+ev.total+'ms'); cap.dataset.k='cap'; body.appendChild(cap);
}
/* --- SQL query console / EXPLAIN ANALYZE --- */
function sqlData(){
  return {
    query:['SELECT u.id, count(o.id) AS orders','FROM users u JOIN orders o ON o.user_id = u.id',
      'WHERE u.tenant_id = $1','GROUP BY u.id ORDER BY orders DESC LIMIT 50;'],
    plan:[
      {t:'Limit  (cost=18421.7 rows=50)',depth:0,tone:'dim'},
      {t:'Sort  key: orders DESC  (rows=12k)',depth:1,tone:'dim'},
      {t:'HashAggregate  (rows=12k)',depth:2,tone:'dim'},
      {t:'Seq Scan on orders  (cost=12044 rows=1.2M)  no index',depth:3,tone:'warn',k:'scan'},
    ]};
}
function buildSql(body,ev){
  const q=el('sql-q');
  ev.query.forEach(line=>{const ln=el('sql-ql'); ln.appendChild(hiCode(line)); q.appendChild(ln);});
  body.appendChild(q);
  const plan=el('sql-plan');
  ev.plan.forEach(p=>{const ln=el('sql-pl tone-'+(p.tone||'fg'),(p.depth?'  '.repeat(p.depth)+'└ ':'')+p.t);
    if(p.k)ln.dataset.k=p.k; plan.appendChild(ln);});
  body.appendChild(plan);
  const cap=el('sql-cap','planning…'); cap.dataset.k='cap'; body.appendChild(cap);
}
/* --- load test (k6) --- */
function loadPts(){let s='',n=22;for(let i=0;i<n;i++){const x=(i/(n-1))*100,p=i/(n-1);
  const y=31-Math.min(1,p*1.5)*25+(rng()*2-1); s+=x.toFixed(1)+','+Math.max(4,Math.min(32,y)).toFixed(1)+' ';}return s.trim();}
function buildLoad(body){
  const stats=el('lt-stats');
  [['VUs','vu','0'],['req/s','rps','0'],['p95','p95','— ms'],['errors','err','0.00%']].forEach(([t,k,v])=>{
    const s=el('lt-s'); s.appendChild(spn('lt-t',t)); const n=spn('lt-v',v); n.dataset.k=k; s.appendChild(n); stats.appendChild(s);});
  body.appendChild(stats);
  const svg=svgEl('svg',{viewBox:'0 0 100 34',preserveAspectRatio:'none',class:'lt-c'});
  const pts=loadPts();
  svg.appendChild(svgEl('polyline',{class:'lt-area',points:'0,34 '+pts+' 100,34'}));
  svg.appendChild(svgEl('polyline',{class:'lt-line',points:pts}));
  body.appendChild(svg);
  const cap=el('lt-cap','ramping virtual users…'); cap.dataset.k='cap'; body.appendChild(cap);
}
/* --- GitHub PR review / merge --- */
function prPath(){return pick(FILES).split('/').slice(-2).join('/');}
function prData(){
  return {
    prTitle:pick(['refactor: ','feat: ','perf: ','fix: '])+pick(['streaming encoder','idempotency keys','retry backoff','connection pool reuse','tiered cache layer']),
    branch:'hyperion/'+hash(6),
    files:[{name:prPath(),a:ri(20,180),d:ri(4,60)},{name:prPath(),a:ri(10,90),d:ri(2,40)},{name:prPath(),a:ri(3,40),d:ri(0,20)}],
    checks:['build','unit tests','integration','lint','security']};
}
function buildPR(body,ev){
  const head=el('pr-head'); head.appendChild(spn('pr-ti',ev.prTitle));
  const br=el('pr-br'); br.appendChild(spn('pr-b',ev.branch)); br.appendChild(spn('pr-arr',' → ')); br.appendChild(spn('pr-b main','main'));
  head.appendChild(br); body.appendChild(head);
  const files=el('pr-files');
  ev.files.forEach(f=>{const r=el('pr-f'); r.appendChild(spn('pr-fn',f.name));
    const st=el('pr-st'); st.appendChild(spn('pr-add','+'+f.a)); st.appendChild(spn('pr-del','−'+f.d)); r.appendChild(st); files.appendChild(r);});
  body.appendChild(files);
  const checks=el('pr-checks');
  ev.checks.forEach((c,i)=>{const r=el('pr-c'); r.dataset.k='c'+i; r.dataset.state='running';
    r.appendChild(el('pr-cic')); r.appendChild(spn('pr-cn',c)); checks.appendChild(r);});
  body.appendChild(checks);
  const merge=el('pr-merge','checks running…'); merge.dataset.k='merge'; merge.dataset.state='pending'; body.appendChild(merge);
}
/* --- container image build (BuildKit) --- */
function buildDocker(body,ev){
  const list=el('dk'), n=ev.steps.length;
  ev.steps.forEach((s,i)=>{const r=el('dk-r'); r.dataset.k=i; r.dataset.state='pending';
    r.appendChild(el('dk-ic')); r.appendChild(spn('dk-ix','['+(i+1)+'/'+n+']')); r.appendChild(spn('dk-tx',s));
    const st=spn('dk-st'); st.dataset.k=i+'-t'; r.appendChild(st); list.appendChild(r);});
  body.appendChild(list);
  const cap=el('dk-cap','building image…'); cap.dataset.k='cap'; body.appendChild(cap);
}
/* --- full-screen btop: a LIVE system monitor the agent pulls up --- */
const BT_PROCS=['systemd','dockerd','containerd','kubelet','etcd','postgres','redis-server','nginx',
  'envoy','prometheus','node_exporter','vector','vault','consul','sshd','cron','auditd','falco',
  'hyperion-agentd','mythos-engine','otel-collector','containerd-shim','gunicorn'];
function setBar(elm,pct){ const p=Math.max(0,Math.min(100,pct)); elm.style.width=p+'%'; elm.dataset.lvl=p>80?'hi':p>50?'mid':'lo'; }
function buildBtop(body,ev){
  body.classList.add('bt');
  const S={phase:'normal', cores:[], procs:[], hist:[], histN:80, villain:null, pegList:[], disks:[], net:null};
  /* CPU section */
  const cpu=el('bt-sec bt-cpu');
  const top=el('bt-line'); top.appendChild(spn('bt-lbl','CPU'));
  const bar=el('bt-bar'); const fill=el('bt-fill'); bar.appendChild(fill); top.appendChild(bar);
  S.cpuFill=fill; S.cpuPct=spn('bt-pct','0%'); top.appendChild(S.cpuPct);
  S.cpuTmp=spn('bt-tmp','42°C'); top.appendChild(S.cpuTmp); cpu.appendChild(top);
  const cv=document.createElement('canvas'); cv.className='bt-graph'; cpu.appendChild(cv); S.graph=cv;
  const grid=el('bt-cores');
  for(let i=0;i<8;i++){
    const c=el('bt-core'); c.appendChild(spn('bt-cn','C'+i));
    const cb=el('bt-cbar'); const cf=el('bt-cfill'); cb.appendChild(cf); c.appendChild(cb);
    const cp=spn('bt-cpct','0%'); c.appendChild(cp); grid.appendChild(c);
    S.cores.push({cur:U(18,40),base:U(16,40),fill:cf,pct:cp,peg:false});
  }
  cpu.appendChild(grid);
  S.load=el('bt-load'); S.load.textContent='load avg: 2.10 1.84 1.66'; cpu.appendChild(S.load);
  body.appendChild(cpu);
  /* MEM section */
  const mem=el('bt-sec bt-mem');
  const mrow=el('bt-line'); mrow.appendChild(spn('bt-lbl','MEM'));
  const mbar=el('bt-bar'); const mfill=el('bt-fill'); mbar.appendChild(mfill); mrow.appendChild(mbar);
  S.memFill=mfill; S.memPct=spn('bt-pct','0%'); mrow.appendChild(S.memPct);
  S.memGb=spn('bt-tmp','—'); S.memGb.style.width='8ch'; mrow.appendChild(S.memGb);
  mem.appendChild(mrow);
  S.memCur=0.45; S.memTgt=0.45; body.appendChild(mem);
  /* NET section */
  const net=el('bt-sec bt-net');
  const dn=el('bt-nrow'); dn.appendChild(spn('bt-nico dn','▼'));
  S.netDn=spn('bt-nspd','0 KiB/s'); dn.appendChild(S.netDn);
  S.netDnM=spn('bt-nmbps','0 Mbps'); dn.appendChild(S.netDnM);
  S.netDnT=spn('bt-ntot','0 GiB'); dn.appendChild(S.netDnT); net.appendChild(dn);
  const up=el('bt-nrow'); up.appendChild(spn('bt-nico up','▲'));
  S.netUp=spn('bt-nspd','0 KiB/s'); up.appendChild(S.netUp);
  S.netUpM=spn('bt-nmbps','0 Mbps'); up.appendChild(S.netUpM);
  S.netUpT=spn('bt-ntot','0 GiB'); up.appendChild(S.netUpT); net.appendChild(up);
  S.net={dn:U(2,9), up:U(0.5,3), dnTgt:U(2,9), upTgt:U(0.5,3), dnTot:U(420,1900), upTot:U(30,180)};
  body.appendChild(net);
  /* DISK section */
  const disk=el('bt-sec bt-disk');
  [['root',428,93],['var',512,71],['swap',8,18],['boot',1,46]].forEach(d=>{
    const r=el('bt-drow'); r.appendChild(spn('bt-dnm',d[0]));
    const db=el('bt-bar'); const df=el('bt-fill'); db.appendChild(df); r.appendChild(db);
    const gb=spn('bt-dgb',''); r.appendChild(gb);
    const io=spn('bt-dio','0%'); r.appendChild(io); disk.appendChild(r);
    S.disks.push({name:d[0],size:d[1],used:d[2]/100,usedTgt:d[2]/100,io:U(0,6),ioTgt:U(0,6),
      isSwap:d[0]==='swap',fill:df,gb:gb,ioEl:io});
  });
  body.appendChild(disk);
  /* PROC section */
  const proc=el('bt-sec bt-proc');
  const head=el('bt-phead'); ['Pid','Program','Cpu%','Mem'].forEach(h=>head.appendChild(spn('',h))); proc.appendChild(head);
  const wrap=el('bt-procwrap'); proc.appendChild(wrap); S.procWrap=wrap;
  const names=shuffle(BT_PROCS.slice()).slice(0,13);
  names.forEach(nm=>S.procs.push(mkProc(nm, ri(200,99999), U(0.1,6), ri(20,520), false)));
  if(ev.villain){ const v=mkProc(ev.villain.name, ev.villain.pid, U(2,8), ri(60,300), true); S.villain=v; S.procs.push(v); }
  S.pegList=shuffle(S.cores.map((_,i)=>i)).slice(0, ev.peg||4);
  renderProcs(S);
  body.appendChild(proc);
  btopState=S;
}
function mkProc(name,pid,cpu,mem,villain){
  const row=el('bt-prow'+(villain?' bt-villain':''));
  row.appendChild(spn('pid',''+pid)); row.appendChild(spn('pn',name));
  const pc=spn('pc',cpu.toFixed(1)); row.appendChild(pc);
  row.appendChild(spn('pm',mem+'M'));
  return {row,cpuEl:pc,name,pid,cpu,base:cpu,mem,villain,killed:false,spike:false,spikeCpu:0};
}
function renderProcs(S){ S.procWrap.innerHTML=''; S.procs.forEach(p=>S.procWrap.appendChild(p.row)); }
function sizeBtop(){ const S=btopState; if(!S||!S.graph)return; const cv=S.graph;
  cv.width=cv.clientWidth||600; cv.height=cv.clientHeight||70; S.histN=Math.max(20,(cv.width/5)|0); S.ctx=cv.getContext('2d'); }
function btSwap(S){ return S.disks.find(d=>d.isSwap); }
function applyBtopPhase(S){
  if(S.phase==='spike'){
    S.pegList.forEach(i=>S.cores[i].peg=true);
    S.memTgt=U(0.82,0.92); S.netHot=true;
    if(S.villain){ S.villain.spike=true; S.villain.spikeCpu=ri(380,760); }
  } else if(S.phase==='recover'){
    S.cores.forEach(c=>c.peg=false); S.memTgt=U(0.46,0.56); S.netHot=false;
    if(S.villain){ S.villain.spike=false; S.villain.killed=true; S.villain.row.classList.add('bt-dead'); }
  } else if(S.phase==='oom'){
    S.memTgt=U(0.93,0.97); S.swapHot=true;
    const sw=btSwap(S); if(sw) sw.usedTgt=U(0.74,0.96);
    if(S.villain){ S.villain.spike=true; S.villain.spikeCpu=ri(90,220); S.villain.mem=ri(6200,11800); S.villain.row.querySelector('.pm').textContent=(S.villain.mem/1024).toFixed(1)+'G'; }
  } else if(S.phase==='oomkill'){
    S.memTgt=U(0.40,0.52); S.swapHot=false;
    const sw=btSwap(S); if(sw) sw.usedTgt=U(0.10,0.22);
    if(S.villain){ S.villain.spike=false; S.villain.killed=true; S.villain.row.classList.add('bt-dead','bt-oom'); S.villain.row.querySelector('.pn').textContent=S.villain.name+' [OOM killed]'; }
  }
}
function tickBtop(ts){
  const S=btopState; if(!S)return;
  if(ts-btopLast<460)return; btopLast=ts;
  let sum=0;
  S.cores.forEach(c=>{
    const tgt=c.peg?(90+Math.random()*9):(c.base+(Math.random()*16-8));
    c.cur+=(tgt-c.cur)*0.45; c.cur=Math.max(2,Math.min(100,c.cur)); sum+=c.cur;
    setBar(c.fill,c.cur); c.pct.textContent=Math.round(c.cur)+'%';
  });
  const overall=sum/S.cores.length;
  setBar(S.cpuFill,overall); S.cpuPct.textContent=Math.round(overall)+'%';
  S.cpuTmp.textContent=Math.round(40+overall*0.28)+'°C';
  const la=(overall/100*8).toFixed(2);
  S.load.textContent='load avg: '+la+' '+(la*0.92).toFixed(2)+' '+(la*0.85).toFixed(2);
  S.hist.push(overall/100); while(S.hist.length>S.histN)S.hist.shift();
  drawBtopGraph(S);
  S.memCur+=(S.memTgt-S.memCur)*0.35; setBar(S.memFill,S.memCur*100);
  S.memPct.textContent=Math.round(S.memCur*100)+'%'; S.memGb.textContent=(S.memCur*16).toFixed(1)+'/16G';
  tickNet(S); tickDisks(S);
  S.procs.forEach(p=>{
    const tgt=p.killed?0:p.spike?p.spikeCpu:(p.base*(0.6+Math.random()*0.9));
    p.cpu+=(tgt-p.cpu)*0.4; p.cpuEl.textContent=p.cpu.toFixed(1);
  });
  const before=S.procs.map(p=>p.pid).join();
  S.procs.sort((a,b)=>b.cpu-a.cpu);
  if(S.procs.map(p=>p.pid).join()!==before) renderProcs(S);
}
function btSpd(mib){ return mib>=1 ? mib.toFixed(1)+' MiB/s' : Math.round(mib*1024)+' KiB/s'; }
function btTot(gib){ return gib>=1024 ? (gib/1024).toFixed(2)+' TiB' : Math.round(gib)+' GiB'; }
function tickNet(S){ const N=S.net; if(!N)return;
  if(Math.random()<0.30){ N.dnTgt=S.netHot?U(45,135):U(1.5,11); N.upTgt=S.netHot?U(30,110):U(0.4,3.5); }
  N.dn+=(N.dnTgt-N.dn)*0.4; N.up+=(N.upTgt-N.up)*0.4;
  N.dnTot+=N.dn*0.0011; N.upTot+=N.up*0.0011;
  S.netDn.textContent=btSpd(N.dn); S.netDnM.textContent=(N.dn*8.39).toFixed(1)+' Mbps'; S.netDnT.textContent=btTot(N.dnTot);
  S.netUp.textContent=btSpd(N.up); S.netUpM.textContent=(N.up*8.39).toFixed(1)+' Mbps'; S.netUpT.textContent=btTot(N.upTot);
}
function tickDisks(S){ S.disks.forEach(d=>{
    if(Math.random()<0.35) d.ioTgt=(d.isSwap&&S.swapHot)?U(55,98):(d.name==='root'&&Math.random()<0.2?U(20,70):U(0,7));
    d.io+=(d.ioTgt-d.io)*0.45; d.used+=(d.usedTgt-d.used)*0.10;
    setBar(d.fill,d.used*100);
    d.gb.textContent=(d.used*d.size).toFixed(d.size<10?2:0)+'/'+d.size+'G';
    const iv=Math.round(d.io); d.ioEl.textContent=iv+'%'; d.ioEl.dataset.lvl=iv>80?'hi':iv>45?'mid':'lo';
  });
}
function drawBtopGraph(S){
  const x=S.ctx; if(!x)return; const W=S.graph.width,H=S.graph.height;
  x.clearRect(0,0,W,H); const cw=W/S.histN;
  for(let i=0;i<S.hist.length;i++){
    const v=S.hist[i], colH=v*H, cx=i*cw;
    for(let y=H-2;y>H-colH;y-=4){
      const f=(H-y)/H;
      x.fillStyle=f>0.78?'#ff4d4d':f>0.5?'#ffd23f':accentCache;
      x.globalAlpha=0.35+0.6*f; x.fillRect(cx,y,Math.max(1,cw-1.2),2);
    }
  }
  x.globalAlpha=1;
}
function setW(elm,pct){ elm.style.width=Math.max(0,Math.min(100,pct))+'%'; }

/* --- global threat map (DDoS) : stylized dot-grid world + attack arcs --- */
/* low-res landmass bitmap as [startCol,endCol] ranges per row (W=64, H=22) */
const ATTACK_LAND=[
  [[23,26]],
  [[7,15],[23,27],[44,46],[50,60]],
  [[5,17],[24,28],[32,34],[39,60]],
  [[5,18],[24,28],[30,37],[39,61]],
  [[6,18],[30,38],[40,62]],
  [[7,18],[31,37],[40,59]],
  [[9,18],[31,39],[42,58]],
  [[11,17],[30,40],[42,47],[50,57]],
  [[13,17],[31,41],[43,49],[51,57]],
  [[14,17],[31,42],[45,49],[52,58]],
  [[15,20],[32,42],[53,58]],
  [[16,22],[33,41],[54,58]],
  [[16,23],[33,40]],
  [[17,23],[34,39]],
  [[17,24],[35,39],[53,60]],
  [[17,23],[35,38],[52,61]],
  [[18,23],[54,60]],
  [[18,22],[55,59]],
  [[18,21]],
  [[18,20]],
  [[18,20]],
  [[18,19]]
];
function amXY(col,row){ return [col*2, row*2+3]; }
function buildAttack(body,ev){
  body.classList.add('am');
  const svg=svgEl('svg',{viewBox:'0 0 128 48',class:'am-map',preserveAspectRatio:'xMidYMid meet'});
  const dg=svgEl('g',{class:'am-land'});
  ATTACK_LAND.forEach((ranges,r)=>ranges.forEach(([a,b])=>{
    for(let c=a;c<=b;c++){ const [x,y]=amXY(c,r); dg.appendChild(svgEl('circle',{cx:x,cy:y,r:0.6,class:'am-dot'})); }
  }));
  svg.appendChild(dg);
  const [tx,ty]=amXY(ev.target[0],ev.target[1]);
  const ag=svgEl('g',{class:'am-arcs'});
  ev.sources.forEach((s,i)=>{
    const [sx,sy]=amXY(s[0],s[1]);
    const dist=Math.hypot(tx-sx,ty-sy), cx=(sx+tx)/2, cy=Math.min(sy,ty)-dist*0.42;
    const d='M'+sx.toFixed(1)+' '+sy.toFixed(1)+' Q'+cx.toFixed(1)+' '+cy.toFixed(1)+' '+tx.toFixed(1)+' '+ty.toFixed(1);
    ag.appendChild(svgEl('path',{d:d,class:'am-arcbg','data-k':'arc'}));
    const p=svgEl('path',{d:d,class:'am-arc','data-k':'arc'}); p.style.animationDelay=(i*0.17).toFixed(2)+'s'; ag.appendChild(p);
    ag.appendChild(svgEl('circle',{cx:sx,cy:sy,r:1.3,class:'am-src','data-k':'arc'}));
  });
  svg.appendChild(ag);
  const tg=svgEl('g',{class:'am-target'});
  tg.appendChild(svgEl('circle',{cx:tx,cy:ty,r:2.7,class:'am-tring'}));
  tg.appendChild(svgEl('circle',{cx:tx,cy:ty,r:1.4,class:'am-tdot'}));
  svg.appendChild(tg);
  body.appendChild(svg);
  const st=el('am-stats');
  function stat(t,k,v){ const s=el('am-s'); s.appendChild(spn('am-t',t)); const n=spn('am-v',v); n.dataset.k=k; s.appendChild(n); return s; }
  st.appendChild(stat('INBOUND','in','—'));
  st.appendChild(stat('BLOCKED','blk','0'));
  const cs=el('am-s am-grow'); const cap=spn('am-cap','monitoring edge…'); cap.dataset.k='cap'; cs.appendChild(cap); st.appendChild(cs);
  body.appendChild(st);
}

/* --- GPU training farm (nvidia-smi grid) : a live ticker scene --- */
function tempLvl(t){ return t>86?'hi':t>74?'mid':'lo'; }
function buildGpu(body,ev){
  body.classList.add('gpu');
  const model=(ev.model||'8× A100').replace(/^\d+×\s*/,'');
  const head=el('gpu-head'); head.appendChild(spn('gpu-ht','GPU CLUSTER · '+(ev.model||'8× A100')+' · '+(ev.host||'dgx-01')));
  const thr=spn('gpu-thr','— tok/s'); thr.dataset.k='thr'; head.appendChild(thr); body.appendChild(head);
  const grid=el('gpu-grid'); const cards=[];
  for(let i=0;i<8;i++){
    const card=el('gpu-card');
    const top=el('gpu-ctop'); top.appendChild(spn('gpu-ci','GPU'+i)); top.appendChild(spn('gpu-cm',model));
    const bd=spn('gpu-bd',''); top.appendChild(bd); card.appendChild(top);
    function row(lbl,fillCls){ const r=el('gpu-row'); r.appendChild(spn('gpu-rl',lbl)); const b=el('gpu-bar'); const f=el('gpu-fill'+(fillCls?' '+fillCls:'')); b.appendChild(f); r.appendChild(b); const v=spn('gpu-rv','0%'); r.appendChild(v); card.appendChild(r); return {f,v}; }
    const u=row('util',''); const m=row('mem','mem');
    const foot=el('gpu-foot'); const tpv=spn('gpu-temp','—°C'); const wv=spn('gpu-watt','—W'); foot.appendChild(tpv); foot.appendChild(wv); card.appendChild(foot);
    grid.appendChild(card);
    cards.push({card,uf:u.f,up:u.v,mf:m.f,mp:m.v,tpv,wv,bd, util:U(82,96),uBase:U(84,95), mem:U(0.6,0.8),mTgt:U(0.62,0.82), temp:U(58,68), hot:false,throttled:false});
  }
  body.appendChild(grid);
  const cap=el('gpu-cap','training step '+grp(ri(10000,90000))+' · all GPUs nominal'); cap.dataset.k='cap'; body.appendChild(cap);
  liveState={kind:'gpu',last:0,cards,hotIdx:(ev.hot!=null?ev.hot:0),thrEl:thr,
    tick(ts){ if(ts-this.last<360)return; this.last=ts; let sum=0;
      this.cards.forEach(c=>{
        let utgt = (c.hot&&c.throttled)?(26+Math.random()*12) : c.hot?(96+Math.random()*3) : (c.uBase+(Math.random()*8-4));
        c.util+=(utgt-c.util)*0.4; c.util=clamp(c.util,0,100);
        c.temp+=((38+c.util*0.42+(c.hot?26:0))-c.temp)*0.18;
        if(c.hot&&c.temp>86) c.throttled=true;
        c.mem+=(c.mTgt-c.mem)*0.3;
        setW(c.uf,c.util); c.up.textContent=Math.round(c.util)+'%';
        setW(c.mf,c.mem*100); c.mp.textContent=Math.round(c.mem*100)+'%';
        c.tpv.textContent=Math.round(c.temp)+'°C'; c.tpv.dataset.lvl=tempLvl(c.temp);
        c.wv.textContent=Math.round(70+c.util*3.1+(c.hot?60:0))+'W';
        c.card.dataset.state=c.throttled?'throttle':c.hot?'hot':'ok';
        c.bd.textContent=c.throttled?'⚠ THROTTLE':'';
        sum+=c.util;
      });
      this.thrEl.textContent=compactNum(Math.round(sum/8*48))+' tok/s';
    },
    phase(p){
      const c=this.cards[this.hotIdx]; if(!c)return;
      if(p==='spike'){ c.hot=true; c.mTgt=U(0.9,0.97); }
      else if(p==='recover'){ c.hot=false; c.throttled=false; c.uBase=U(6,14); c.mTgt=U(0.18,0.3);
        this.cards.forEach((o,i)=>{ if(i!==this.hotIdx) o.uBase=clamp(o.uBase+U(1,4),0,99); }); }
    }
  };
}

/* --- service mesh (Kiali) with traffic flowing along the edges --- */
function meshNodes(){ return [
  {x:30,y:92,l:'gateway'},{x:116,y:46,l:'productpage'},{x:116,y:138,l:'orders'},
  {x:212,y:38,l:'reviews'},{x:212,y:96,l:'ratings'},{x:212,y:150,l:'payments'},{x:296,y:96,l:'postgres'}
];}
function buildMesh(body,ev){
  const svg=svgEl('svg',{viewBox:'0 0 320 188',class:'mesh'});
  const N=ev.nodes;
  ev.edges.forEach(([a,b],i)=>{
    const p=N[a],q=N[b], id='me'+i, d='M'+p.x+' '+p.y+' L'+q.x+' '+q.y;
    const g=svgEl('g',{class:'mesh-eg','data-k':'e'+i});
    g.appendChild(svgEl('path',{id:id,d:d,class:'mesh-edge'}));
    if(!reduceMotion){ for(let j=0;j<2;j++){
      const c=svgEl('circle',{r:1.9,class:'mesh-pkt'});
      const am=svgEl('animateMotion',{dur:(1.25+i*0.06).toFixed(2)+'s',repeatCount:'indefinite',begin:(j*0.62).toFixed(2)+'s'});
      am.appendChild(svgEl('mpath',{href:'#'+id})); c.appendChild(am); g.appendChild(c);
    } }
    svg.appendChild(g);
  });
  N.forEach((n,i)=>{
    const g=svgEl('g',{class:'mesh-node','data-k':'n'+i});
    const r=n.l.length>8?13:11;
    g.appendChild(svgEl('circle',{cx:n.x,cy:n.y,r:r,class:'mesh-c'}));
    const t=svgEl('text',{x:n.x,y:n.y+r+9,'text-anchor':'middle',class:'mesh-lbl'}); t.textContent=n.l;
    g.appendChild(t); svg.appendChild(g);
  });
  body.appendChild(svg);
  const cap=el('mesh-cap','7 services · mTLS · '+grp(ri(2000,9000))+' req/s'); cap.dataset.k='cap'; body.appendChild(cap);
}

/* --- latency heatmap (scrolling canvas) : a live ticker scene --- */
const HEAT_BANDS=['p50','p75','p90','p95','p99','p99.9'];
function heatColor(v){
  v=clamp(v,0,1);
  if(v<0.4){ const t=v/0.4; return 'rgb('+Math.round(18+t*22)+','+Math.round(58+t*120)+','+Math.round(92+t*36)+')'; }
  if(v<0.7){ const t=(v-0.4)/0.3; return 'rgb('+Math.round(40+t*200)+','+Math.round(180+t*28)+','+Math.round(72-t*42)+')'; }
  const t=(v-0.7)/0.3; return 'rgb('+Math.round(240+t*15)+','+Math.round(150-t*120)+','+Math.round(40-t*22)+')';
}
function buildHeat(body,ev){
  body.classList.add('heat');
  const head=el('heat-head'); head.appendChild(spn('heat-ht','LATENCY HEATMAP · gateway · p50–p99.9'));
  head.appendChild(spn('heat-sub','last 5m')); body.appendChild(head);
  const wrap=el('heat-wrap');
  const yax=el('heat-y'); for(let i=HEAT_BANDS.length-1;i>=0;i--) yax.appendChild(el('heat-yl',HEAT_BANDS[i]));
  wrap.appendChild(yax);
  const cv=document.createElement('canvas'); cv.className='heat-cv'; wrap.appendChild(cv);
  body.appendChild(wrap);
  const cap=el('heat-cap','p99.9 within SLO'); cap.dataset.k='cap'; body.appendChild(cap);
  liveState={kind:'heat',last:0,cv,ctx:null,cols:[],nCols:64,rows:HEAT_BANDS.length,hot:0,
    tick(ts){ if(ts-this.last<150)return; this.last=ts;
      if(!this.ctx||this.cv.width===0){ this.cv.width=this.cv.clientWidth||640; this.cv.height=this.cv.clientHeight||130; this.ctx=this.cv.getContext('2d'); this.nCols=Math.max(28,(this.cv.width/9)|0); }
      const col=[];
      for(let r=0;r<this.rows;r++){ const tail=r/(this.rows-1);
        let v=0.1+tail*0.16+Math.random()*0.12;
        if(this.hot) v+=tail*tail*(0.55+Math.random()*0.3);
        col.push(clamp(v,0,1));
      }
      this.cols.push(col); while(this.cols.length>this.nCols)this.cols.shift();
      this.draw();
    },
    draw(){ const x=this.ctx,W=this.cv.width,H=this.cv.height; x.clearRect(0,0,W,H);
      const cw=W/this.nCols, ch=H/this.rows;
      for(let i=0;i<this.cols.length;i++){ const c=this.cols[i];
        for(let r=0;r<this.rows;r++){ x.fillStyle=heatColor(c[r]); x.fillRect(i*cw,H-(r+1)*ch,Math.ceil(cw),Math.ceil(ch)-1); } }
    },
    phase(p){ this.hot = p==='spike'?1:0; }
  };
}
/* --- cpu utilization by core (scrolling canvas) : noisy-neighbor scene --- */
const CPU_CORES=16;
function buildCpu(body,ev){
  body.classList.add('heat');
  const head=el('heat-head'); head.appendChild(spn('heat-ht','CPU UTILIZATION · per-core · '+CPU_CORES+' threads'));
  head.appendChild(spn('heat-sub','last 90s')); body.appendChild(head);
  const wrap=el('heat-wrap');
  const yax=el('heat-y'); for(let i=CPU_CORES-1;i>=0;i--) yax.appendChild(el('heat-yl','c'+i));
  wrap.appendChild(yax);
  const cv=document.createElement('canvas'); cv.className='heat-cv'; wrap.appendChild(cv);
  body.appendChild(wrap);
  const cap=el('heat-cap','all cores nominal'); cap.dataset.k='cap'; body.appendChild(cap);
  const base=[]; for(let r=0;r<CPU_CORES;r++) base.push(0.06+rng()*0.1);
  for(let k=0;k<2;k++) base[(rng()*CPU_CORES)|0]=0.22+rng()*0.12;   // a couple of cores look alive
  liveState={kind:'cpu',last:0,cv,ctx:null,cols:[],nCols:64,rows:CPU_CORES,hot:0,hotRow:(ev.hot!=null?ev.hot:0),base,
    tick(ts){ if(ts-this.last<150)return; this.last=ts;
      if(!this.ctx||this.cv.width===0){ this.cv.width=this.cv.clientWidth||640; this.cv.height=this.cv.clientHeight||152; this.ctx=this.cv.getContext('2d'); this.nCols=Math.max(28,(this.cv.width/9)|0); }
      const col=[];
      for(let r=0;r<this.rows;r++){
        let v = this.hot&&r===this.hotRow ? 0.93+Math.random()*0.07 : this.base[r]+Math.random()*0.12;   // one core pinned, rest idle
        col.push(clamp(v,0,1));
      }
      this.cols.push(col); while(this.cols.length>this.nCols)this.cols.shift();
      this.draw();
    },
    draw(){ const x=this.ctx,W=this.cv.width,H=this.cv.height; x.clearRect(0,0,W,H);
      const cw=W/this.nCols, ch=H/this.rows;
      for(let i=0;i<this.cols.length;i++){ const c=this.cols[i];
        for(let r=0;r<this.rows;r++){ x.fillStyle=heatColor(c[r]); x.fillRect(i*cw,H-(r+1)*ch,Math.ceil(cw),Math.ceil(ch)-1); } }
    },
    phase(p){ this.hot = p==='spike'?1:0; }
  };
}
