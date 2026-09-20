import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createClient} from '@libsql/client';
test('backup import preserves raw values and repeat import preserves existing records',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'fx-migration-'));const url=`file:${dir}/test.db`;
 const db=createClient({url});
 try{
 const run=()=>execFileSync(process.execPath,['scripts/import-records.mjs'],{env:{...process.env,TURSO_DATABASE_URL:url}});
 run();const backup=JSON.parse(await readFile('migration/readings-backup.json','utf8'));
 let result=await db.execute('SELECT * FROM readings ORDER BY date');
 assert.equal(result.rows.length,backup.rows.length);
 for(const row of backup.rows){const got=result.rows.find(r=>r.id===row.id);assert.equal(got.raw,row.raw);assert.equal(got.reading,row.reading);assert.equal(got.first_fetched,row.first_fetched);}
 await db.execute({sql:'UPDATE readings SET first_fetched=? WHERE id=?',args:['preserve-existing',backup.rows[0].id]});run();
 result=await db.execute('SELECT * FROM readings');assert.equal(result.rows.length,backup.rows.length);assert.equal(result.rows.find(r=>r.id===backup.rows[0].id).first_fetched,'preserve-existing');
 }finally{db.close();await rm(dir,{recursive:true,force:true});}
});
