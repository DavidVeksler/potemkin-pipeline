/* ====================================================================== */
/* EVENT CONSTRUCTORS                                                      */
/* ====================================================================== */
function L(text,tone,o){return Object.assign({kind:'line',text:text,tone:tone||'fg'},o);}
function BANNER(text){return {kind:'line',text:text,tone:'accent',cls:'banner'};}
function PHASE(name){return {kind:'phase',text:name};}
function TOOL(tool,arg,o){return Object.assign({kind:'tool',tool:tool,arg:arg},o);}
function OUT(text,tone,o){return Object.assign({kind:'output',text:text,tone:tone||'dim'},o);}
function DIFF(sign,text,o){return Object.assign({kind:'diff',sign:sign,text:text},o);}
function THINK(o){return Object.assign({kind:'thinking'},o);}
function TASK(id,label,state){return {kind:'task',id:id,label:label,state:state};}
function FILE(path,st){return {kind:'filehl',path:path,st:st};}
function SNIP(path,write){return Object.assign(genSnippet(path),{write:!!write});}
function CNT(field,delta){return {kind:'counter',field:field,delta:delta};}
function CLR(){return {kind:'clear'};}
function WAIT(ms){return {kind:'wait',wait:ms};}
function OV(op,o){return Object.assign({kind:'ov',op:op},o);}
