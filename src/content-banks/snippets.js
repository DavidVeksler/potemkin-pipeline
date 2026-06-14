/* ---- code/config snippet generators (seeded, plausible-but-fictional) ---- */
const ID_FN=['acquireLock','withTransaction','flushBatch','resolveAddr','reconcile','rebalanceShards','evictStale','commitOffset','validateEntry','dispatch','hydrateCache','prefetch','snapshotState','fenceRead','drainQueue'];
const ID_VAR=['lease','batch','entry','shard','token','span','quorum','cursor','txn','offset','node','lock'];
const ID_TYPE=['Ledger','Session','Shard','Batch','Token','Span','Quorum','Entry','Vector','Bucket','Snapshot','Lease','Cursor','Offset'];
const ID_FIELD=['pool','store','cache','clock','tracer','lock','registry','queue','router','codec','ring'];
const ID_METHOD=['acquire','lookup','commit','rebalance','evict','flush','resolve','snapshot','fence','drain','probe'];
const ID_ERR=['ConflictError','TimeoutError','StaleReadError','QuorumError','LockError','BackpressureError'];
const ID_MSG=['idempotency key required','stale read fenced','lock contention exceeded','quorum not reached','batch flush failed','retry budget exhausted','partition detected'];
function snipTS(){const fn=pick(ID_FN),v=pick(ID_VAR),T=pick(ID_TYPE),f=pick(ID_FIELD),m=pick(ID_METHOD),E=pick(ID_ERR),msg=pick(ID_MSG);
  return ['export async function '+fn+'(req: '+T+'Request): Promise<'+T+'> {',
    '  const '+v+' = await this.'+f+'.'+m+'(req.id);',
    '  if (!'+v+') throw new '+E+'("'+msg+'");',
    '  this.tracer.record("'+f+'.hit", '+v+'.version);',
    '  return '+v+';','}'];}
function snipGo(){const Fn=cap(pick(ID_FN)),v=pick(ID_VAR),T=pick(ID_TYPE),f=pick(ID_FIELD),m=cap(pick(ID_METHOD)),msg=pick(ID_MSG);
  return ['func (s *Service) '+Fn+'(ctx context.Context, id string) (*'+T+', error) {',
    '\t'+v+', err := s.'+f+'.'+m+'(ctx, id)',
    '\tif err != nil {',
    '\t\treturn nil, fmt.Errorf("'+msg+': %w", err)',
    '\t}',
    '\treturn '+v+', nil','}'];}
function snipRS(){const fn=snake(pick(ID_FN)),v=pick(ID_VAR),T=pick(ID_TYPE),f=pick(ID_FIELD),m=snake(pick(ID_METHOD)),E=pick(ID_ERR);
  return ['pub async fn '+fn+'(&self, id: Uuid) -> Result<'+T+', '+E+'> {',
    '    let '+v+' = self.'+f+'.'+m+'(id).await?;',
    '    self.tracer.record(&'+v+');',
    '    Ok('+v+')','}'];}
function snipPY(){const fn=snake(pick(ID_FN)),v=pick(ID_VAR),T=pick(ID_TYPE),f=pick(ID_FIELD),m=snake(pick(ID_METHOD)),E=pick(ID_ERR),msg=pick(ID_MSG);
  return ['async def '+fn+'(self, '+v+'_id: str) -> '+T+':',
    '    '+v+' = await self.'+f+'.'+m+'('+v+'_id)',
    '    if '+v+' is None:',
    '        raise '+E+'("'+msg+'")',
    '    return '+v];}
function snipCI(){return ['name: ci','on: [push, pull_request]','jobs:','  test:','    runs-on: ubuntu-latest','    steps:','      - uses: actions/checkout@v4','      - run: '+pick(TESTCMDS)];}
function snipYAML(){const svc=pick(DOMAINS)+'-svc',n=ri(2,9),port=pick([8080,9090,8443,50051]);
  return ['apiVersion: apps/v1','kind: Deployment','metadata:','  name: '+svc,'spec:','  replicas: '+n,'  template:','    spec:','      containers:','        - name: '+svc,'          image: registry.internal/'+svc+':'+hash(),'          ports: [{ containerPort: '+port+' }]'];}
function snipSQL(){const t=pick(DOMAINS)+'s',c=pick(['created_at','tenant_id','status','version','idempotency_key','shard_id']);
  return ['BEGIN;','CREATE INDEX CONCURRENTLY idx_'+t+'_'+c,'  ON '+t+' ('+c+')','  WHERE '+c+' IS NOT NULL;','ANALYZE '+t+';','COMMIT;'];}
function snipTOML(){const name=pick(PROJECTS),v=ri(0,4)+'.'+ri(0,30)+'.'+ri(0,12);
  return ['[package]','name = "'+name+'"','version = "'+v+'"','edition = "2021"','','[dependencies]','tokio = { version = "1", features = ["full"] }','serde = { version = "1", features = ["derive"] }'];}
function snipJSON(){const name=pick(PROJECTS);
  return ['{','  "name": "'+name+'",','  "version": "'+ri(0,9)+'.'+ri(0,40)+'.'+ri(0,20)+'",','  "scripts": {','    "test": "'+pick(TESTCMDS)+'",','    "build": "tsc -p ."','  }','}'];}
function snipProto(){const S=cap(pick(DOMAINS)),m=cap(pick(ID_METHOD)),T=pick(ID_TYPE);
  return ['syntax = "proto3";','service '+S+'Service {','  rpc '+m+'('+m+'Request) returns ('+T+');','}','message '+T+' {','  string id = 1;','  int64 version = 2;','}'];}
function snipDocker(){return ['FROM '+pick(['node:22-alpine','golang:1.23','rust:1.81-slim','python:3.12-slim'])+' AS build','WORKDIR /app','COPY . .','RUN '+pick(['npm ci && npm run build','go build -o /bin/app ./...','cargo build --release','pip install -e .']),'EXPOSE '+pick([8080,9090,8443]),'CMD ["/bin/app"]'];}
function snipMD(){const name=pick(PROJECTS);return ['# '+name,'','> '+pickNR(VERBS,'v')+' '+pick(SUBS)+'.','','## Quickstart','```','$ '+pick(TESTCMDS),'```'];}
function snipExt(p){const m=p.match(/\.([a-z0-9]+)$/i);return m?m[1].toLowerCase():'';}
function genSnippet(path){
  const e=snipExt(path); let lines,lang;
  switch(e){
    case 'ts':case 'tsx':case 'js':case 'graphql':case 'cs': lines=snipTS();lang='ts';break;
    case 'go': lines=snipGo();lang='go';break;
    case 'rs': lines=snipRS();lang='rust';break;
    case 'py': lines=snipPY();lang='py';break;
    case 'yaml':case 'yml': if(/workflows\//.test(path)){lines=snipCI();lang='yaml';}else{lines=snipYAML();lang='yaml';} break;
    case 'sql': lines=snipSQL();lang='sql';break;
    case 'toml': lines=snipTOML();lang='toml';break;
    case 'json': lines=snipJSON();lang='json';break;
    case 'proto': lines=snipProto();lang='proto';break;
    case 'md': lines=snipMD();lang='md';break;
    default: if(/Dockerfile/.test(path)){lines=snipDocker();lang='docker';}else{lines=snipTS();lang='ts';}
  }
  return {kind:'snippet',path:path,lang:lang,lines:lines};
}
/* lightweight per-line tokenizer for snippet tinting */
const SNIP_KW=/(\/\/[^\n]*|#[^\n]*|--[^\n]*)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`[^`]*`)|\b(async|await|function|func|fn|return|if|else|elif|for|while|const|let|var|pub|self|def|raise|throw|new|nil|None|true|false|null|import|from|export|struct|impl|match|Ok|Err|Result|Promise|interface|type|class|public|private|static|void|ctx|error|map|range|defer|go|with|as|in|not|and|or|kind|apiVersion|spec|metadata|FROM|RUN|COPY|EXPOSE|CMD|WORKDIR|BEGIN|COMMIT|CREATE|INDEX|ON|WHERE|ANALYZE|rpc|service|message|syntax)\b|\b(\d[\w.]*)\b/g;
function hiCode(line){
  const frag=document.createDocumentFragment(); let last=0,mt; SNIP_KW.lastIndex=0;
  while((mt=SNIP_KW.exec(line))){
    if(mt.index>last) frag.appendChild(document.createTextNode(line.slice(last,mt.index)));
    const cls=mt[1]?'tk-cmt':mt[2]?'tk-str':mt[3]?'tk-kw':'tk-num';
    frag.appendChild(spn(cls,mt[0])); last=SNIP_KW.lastIndex;
    if(SNIP_KW.lastIndex===mt.index) SNIP_KW.lastIndex++;
  }
  if(last<line.length) frag.appendChild(document.createTextNode(line.slice(last)));
  return frag;
}
