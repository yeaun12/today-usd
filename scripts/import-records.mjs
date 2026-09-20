import {createClient} from '@libsql/client';
import {readFile} from 'node:fs/promises';
import {validateNormalizedReading} from '../lib/reading.mjs';
const url=process.env.TURSO_DATABASE_URL;
if(!url)throw new Error('TURSO_DATABASE_URL is required');
const backup=JSON.parse(await readFile(new URL('../migration/readings-backup.json',import.meta.url),'utf8'));
for(const row of backup.rows){
 const reading=JSON.parse(row.reading),raw=JSON.parse(row.raw);
 validateNormalizedReading(reading);
 if(row.id!==`${reading.signal_id}-${reading.record_date}`||row.date!==reading.record_date||raw.rates.KRW!==reading.normalized_value)throw Error('Backup mismatch');
}
const db=createClient({url,authToken:process.env.TURSO_AUTH_TOKEN});
try {
 const schema=await readFile(new URL('../migration/schema.sql',import.meta.url),'utf8');
 await db.executeMultiple(schema);
 await db.batch(backup.rows.map(row=>({sql:'INSERT INTO readings (id,date,reading,raw,first_fetched) VALUES (?,?,?,?,?) ON CONFLICT(id) DO NOTHING',args:[row.id,row.date,row.reading,row.raw,row.first_fetched]})),'write');
 console.log(`Import complete: ${backup.rows.length} backup rows processed. Existing rows were preserved.`);
}finally{db.close();}
