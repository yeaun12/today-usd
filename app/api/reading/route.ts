export const runtime='nodejs';
export const dynamic='force-dynamic';
import {database} from '@/lib/storage';
import {applySuccessfulReading,resetEvaluationState} from '@/lib/reading.mjs';
import {normalizeExchange,SIGNAL,CACHE_KEY} from '@/lib/exchange.mjs';
import {getExchange} from '@/lib/exchange-source';
async function snapshot(){
 const db=database();const rs=await db.prepare("SELECT * FROM readings WHERE json_extract(reading,'$.signal_id')=? ORDER BY date ASC").bind(SIGNAL).all();let state=resetEvaluationState();
 for(const row of rs.results)state=applySuccessfulReading(state,JSON.parse(String(row.reading)));
 const status=await db.prepare('SELECT status,updated FROM statuses WHERE id=?').bind(SIGNAL).first();if(status)state.status=JSON.parse(String(status.status));
 const cache:any=await db.prepare('SELECT expires,fetched,retry_after FROM source_cache WHERE id=?').bind(CACHE_KEY).first();
 return {...state,raw_readings:rs.results.map((r:any)=>({date:r.date,raw:JSON.parse(String(r.raw))})),last_attempt:status?.updated??null,retry_at:cache?.retry_after??null,upstream_fetched_at:cache?.fetched??null,cache_expires:cache?.expires??null};
}
export async function GET(){try{return Response.json(await snapshot(),{headers:{'Cache-Control':'no-store'}});}catch(e){console.error(e);return Response.json({error:'기록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'},{status:503});}}
export async function POST(request:Request){
 if(request.headers.get('origin')&&request.headers.get('origin')!==new URL(request.url).origin)return new Response('Forbidden',{status:403});
 try{
  const db=database();let raw:any,reading:any,error='none',cached=false;
  try{const result=await getExchange(db);raw=result.raw;cached=result.cached;reading=normalizeExchange(raw);}
  catch(e:any){error=['auth','rate_limit','schema_error','timeout','offline'].includes(e.message)?e.message:'offline';}
  const updated=new Date().toISOString();const status=JSON.stringify({freshness:error==='none'?'fresh':'stale',error_code:error});const statements=[];
  if(reading&&error==='none')statements.push(db.prepare('INSERT INTO readings (id,date,reading,raw,first_fetched) VALUES (?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET reading=excluded.reading,raw=excluded.raw WHERE json_extract(excluded.reading,\'$.fetched_at\') >= json_extract(readings.reading,\'$.fetched_at\')').bind(`${reading.signal_id}-${reading.record_date}`,reading.record_date,JSON.stringify(reading),JSON.stringify(raw),reading.fetched_at));
  statements.push(db.prepare('INSERT INTO statuses (id,status,updated) VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET status=excluded.status,updated=excluded.updated WHERE excluded.updated >= statuses.updated').bind(SIGNAL,status,updated));
  await db.batch(statements);return Response.json({...await snapshot(),served_from_cache:cached},{headers:{'Cache-Control':'no-store'}});
 }catch(e){console.error(e);return Response.json({error:'저장에 실패했습니다. 화면의 기존 기록은 유지됩니다. 다시 시도해 주세요.'},{status:503});}
}
