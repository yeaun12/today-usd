import {SOURCE,CACHE_KEY,normalizeExchange,selectedSource,retryAt,expiresAt} from './exchange.mjs';
let pending:Promise<any>|null=null;
async function requestExchange(db:any){
 const now=Date.now();const cached:any=await db.prepare('SELECT * FROM source_cache WHERE id=?').bind(CACHE_KEY).first();
 if(cached?.retry_after&&Date.parse(cached.retry_after)>now){throw Object.assign(new Error(cached.error||'rate_limit'),{retryAt:cached.retry_after});}
 if(cached?.payload&&Date.parse(cached.expires)>now){const raw=JSON.parse(cached.payload);normalizeExchange(raw,new Date(now));return {raw,cached:true,upstream_fetched_at:cached.fetched,expires:cached.expires};}
 const headers:Record<string,string>={Accept:'application/json','User-Agent':'DayExchangeBoard/1.0 https://yeeun-day-signal.y92043u.chatgpt.site'};
 if(cached?.modified)headers['If-Modified-Since']=cached.modified;
 try{
  const response=await fetch(SOURCE,{headers,signal:AbortSignal.timeout(12000)});
  if(response.status===429)throw Object.assign(new Error('rate_limit'),{retryAt:retryAt(response.headers.get('Retry-After'))});
  if(response.status===401||response.status===403)throw new Error('auth');
  if(!response.ok&&response.status!==304)throw new Error('schema_error');
  const responseData=response.status===304&&cached?.payload?JSON.parse(cached.payload):await response.json();
  normalizeExchange(responseData);const raw=selectedSource(responseData);
  const received=new Date().toISOString();normalizeExchange(raw,new Date(received));
  const expires=expiresAt(raw);const modified=response.headers.get('Last-Modified')||cached?.modified||null;
  await db.prepare('INSERT INTO source_cache (id,payload,expires,modified,fetched,retry_after,error) VALUES (?,?,?,?,?,NULL,NULL) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,expires=excluded.expires,modified=excluded.modified,fetched=excluded.fetched,retry_after=NULL,error=NULL').bind(CACHE_KEY,JSON.stringify(raw),expires,modified,received).run();
  return {raw,cached:response.status===304,upstream_fetched_at:received,expires};
 }catch(e:any){const code=e.name==='TimeoutError'||e.name==='AbortError'?'timeout':['auth','rate_limit','schema_error'].includes(e.message)?e.message:e instanceof SyntaxError?'schema_error':'offline';const retry=e.retryAt||new Date(Date.now()+60000).toISOString();console.error('exchange_upstream_failure',{provider:'ExchangeRate-API',code,retry_at:retry});
  await db.prepare('INSERT INTO source_cache (id,expires,retry_after,error) VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET retry_after=excluded.retry_after,error=excluded.error').bind(CACHE_KEY,new Date(0).toISOString(),retry,code).run();throw Object.assign(new Error(code),{retryAt:retry});}
}
export async function getExchange(db:any){if(!pending)pending=requestExchange(db).finally(()=>{pending=null;});return pending;}
