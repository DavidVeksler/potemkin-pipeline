/* ====================================================================== */
/* RNG + HELPERS                                                           */
/* ====================================================================== */
let _seed=cfg.seed>>>0;
function hashU32(s){ s=Math.imul(s^(s>>>16),0x45d9f3b)>>>0; s=Math.imul(s^(s>>>16),0x45d9f3b)>>>0; return (s^(s>>>16))>>>0; }
function pickCodename(seed){ return CODENAMES[hashU32(seed>>>0)%CODENAMES.length]; }
if(!cfg.agent) cfg.agent=pickCodename(cfg.seed);   // seed-derived; independent of the main RNG stream so the story is unchanged
function rng(){ // mulberry32
  _seed=(_seed+0x6D2B79F5)|0; let t=_seed;
  t=Math.imul(t^(t>>>15),1|t); t=(t+Math.imul(t^(t>>>7),61|t))^t;
  return ((t^(t>>>14))>>>0)/4294967296;
}
function U(a,b){return a+(b-a)*rng();}
function ri(a,b){return a+Math.floor(rng()*(b-a+1));}
function clamp(v,lo,hi){return Math.max(lo,Math.min(hi,v));}
function grp(n){return Math.round(n).toLocaleString('en-US');}
function cap(s){return s.charAt(0).toUpperCase()+s.slice(1);}
function snake(s){return s.replace(/([A-Z])/g,'_$1').replace(/^_/,'').toLowerCase();}
function stripThe(s){return s.replace(/^the\s+/,'');}
function pick(a){return a[(rng()*a.length)|0];}
const _recent={};
function pickNR(a,key){
  const r=_recent[key]||(_recent[key]=[]);
  let v,t=0; do{v=a[(rng()*a.length)|0];t++;}while(r.indexOf(v)>=0 && t<14);
  r.push(v); if(r.length>Math.min(8,a.length-1)) r.shift(); return v;
}
function hash(n){n=n||7;let s='';const h='0123456789abcdef';for(let i=0;i<n;i++)s+=h[(rng()*16)|0];return s;}
function compactNum(n){
  if(n>=1e9) return (n/1e9).toFixed(n>=1e10?0:1)+'B';
  if(n>=1e6) return (n/1e6).toFixed(n>=1e7?0:1)+'M';
  if(n>=1e5) return Math.round(n/1e3)+'k';
  return grp(n);
}
function barStr(frac,seg){seg=seg||12;const f=clamp(Math.round(frac*seg),0,seg);return '['+'▰'.repeat(f)+'▱'.repeat(seg-f)+']';}
