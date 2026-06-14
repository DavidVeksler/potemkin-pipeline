/* ====================================================================== */
/* FILE TREE                                                               */
/* ====================================================================== */
function extOf(name){const m=name.match(/\.([^.]+)$/);return m?m[1].toLowerCase():'';}
function dirOf(p){return p.replace(/\/[^/]*$/,'');}
function mkFileRow(name,path,depth){
  const el=document.createElement('div');
  el.className='ft-row ft-file'; el.style.paddingLeft=(depth*1.2)+'ch';
  el.dataset.path=path; el.dataset.ext=extOf(name);
  const dot=document.createElement('span');dot.className='ft-dot';
  const nm=document.createElement('span');nm.className='ft-nm';nm.textContent=name;
  const gut=document.createElement('span');gut.className='ft-gut';
  el.append(dot,nm,gut);
  fileEls[path]=el; return el;
}
function buildFileTree(){
  const root={};
  FILES.forEach(p=>{const parts=p.split('/');let n=root;parts.forEach((part,i)=>{const leaf=i===parts.length-1;if(leaf){(n.__files||(n.__files=[])).push({name:part,path:p});}else{n=n[part]||(n[part]={});}});});
  fileTreeEl.innerHTML='';
  (function walk(node,depth){
    Object.keys(node).filter(k=>k!=='__files').sort().forEach(dir=>{
      const d=document.createElement('div');d.className='ft-row ft-dir';d.style.paddingLeft=(depth*1.2)+'ch';d.textContent=dir+'/';fileTreeEl.appendChild(d);
      walk(node[dir],depth+1);
    });
    (node.__files||[]).forEach(f=>{ fileTreeEl.appendChild(mkFileRow(f.name,f.path,depth)); });
  })(root,0);
}
/* insert a newly-"created" file beside an existing sibling in the same dir; null if no home */
function insertFileRow(path){
  if(FILES.length>48) return null;
  const name=path.split('/').pop(), dir=dirOf(path);
  let after=null; for(const p in fileEls){ if(dirOf(p)===dir) after=fileEls[p]; }
  if(!after) return null;
  const el=mkFileRow(name,path,0); el.style.paddingLeft=after.style.paddingLeft;
  after.parentNode.insertBefore(el,after.nextSibling);
  FILES.push(path); return el;
}
function setStatus(el,st){
  if(!st)return; if(el.dataset.st==='A')return;   // added stays added through later edits
  el.dataset.st=st; const g=el.querySelector('.ft-gut'); if(g)g.textContent=st;
}
function highlightFile(path,st){
  let el=fileEls[path];
  if(!el){ if(st!=='A')return; el=insertFileRow(path); if(!el)return; el.classList.add('ft-new'); }
  if(lastFileHl && lastFileHl!==el){lastFileHl.classList.remove('hl');}
  el.classList.add('hl','glow'); lastFileHl=el; setStatus(el,st);
  el.scrollIntoView({block:'nearest'});
  setTimeout(()=>el.classList.remove('glow'),900);
}
/* new mission = committed working tree: clear M/A decorations, keep added files */
function clearFileStatus(){
  for(const p in fileEls){ const el=fileEls[p]; delete el.dataset.st; el.classList.remove('hl','ft-new'); const g=el.querySelector('.ft-gut'); if(g)g.textContent=''; }
  lastFileHl=null;
}
