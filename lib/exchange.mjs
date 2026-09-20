import {kstDate,validateNormalizedReading} from './reading.mjs';
export const SOURCE='https://open.er-api.com/v6/latest/USD';
export const SOURCE_NAME='ExchangeRate-API · 일일 기준 환율';
export const SIGNAL='usd-krw';
export const CACHE_KEY='exchange-usd-krw';
export function normalizeExchange(raw,now=new Date()){
 const value=raw?.rates?.KRW;const stamp=raw?.time_last_update_unix;
 if(raw?.result!=='success'||raw.base_code!=='USD'||typeof value!=='number'||!Number.isFinite(value)||value<=0||typeof stamp!=='number'||!Number.isFinite(stamp)||stamp<=0)throw new Error('schema_error');
 const sourceTime=new Date(stamp*1000);
 if(!Number.isFinite(+sourceTime)||+sourceTime>+now+300000||+now-sourceTime>7*86400000)throw new Error('schema_error');
 const reading={signal_id:SIGNAL,normalized_value:value,unit:'원/USD',source_name:SOURCE_NAME,source_url:SOURCE,source_time:sourceTime.toISOString(),fetched_at:now.toISOString(),record_timezone:'Asia/Seoul',record_date:kstDate(now.toISOString())};validateNormalizedReading(reading);return reading;
}
export function selectedSource(raw){return {result:raw.result,provider:raw.provider,base_code:raw.base_code,time_last_update_unix:raw.time_last_update_unix,time_last_update_utc:raw.time_last_update_utc,time_next_update_unix:raw.time_next_update_unix,time_next_update_utc:raw.time_next_update_utc,rates:{KRW:raw.rates.KRW}};}
export function retryAt(value,now=Date.now()){
 const seconds=Number(value);const parsed=value&&Number.isFinite(seconds)?now+seconds*1000:Date.parse(value||'');return new Date(Math.max(now+1200000,Number.isFinite(parsed)?parsed:now+1200000)).toISOString();
}
export function expiresAt(raw,now=Date.now()){
 const next=raw.time_next_update_unix*1000;return new Date(Number.isFinite(next)&&next>now?Math.min(next,now+86400000):now+3600000).toISOString();
}
