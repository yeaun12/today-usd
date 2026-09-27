import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resetEvaluationState,runFixture} from '../lib/reading.mjs';
import {comparisonRows,refreshDemo} from '../lib/dashboard.mjs';
const fixtures=Object.fromEntries(['normal-d1-a','normal-d1-b','normal-d2','timeout','recover-d2'].map(id=>[id,JSON.parse(readFileSync(new URL(`../public/t04/fixtures/${id}.json`,import.meta.url)))]));
function sequence(ids){return ids.reduce((s,id)=>runFixture(s,fixtures[id]),resetEvaluationState());}
test('refresh retains day 2 and comparison 120 - 105',()=>{
 const s=refreshDemo(sequence(['normal-d1-a','normal-d1-b','normal-d2']),fixtures);
 const {last,prev}=comparisonRows(s);
 assert.equal(last.normalized_value,120);assert.equal(last.record_date,'2026-08-25');
 assert.equal(last.normalized_value-prev.normalized_value,15);assert.equal(s.daily_readings.length,2);
});
test('manual day 1 replay cannot show a day 2 comparison',()=>{
 const s=sequence(['normal-d1-a','normal-d1-b','normal-d2','normal-d1-a']);
 const {last,prev}=comparisonRows(s);
 assert.equal(last.normalized_value,100);assert.equal(prev,undefined);
});
test('timeout recovery retains two records and restores fresh state',()=>{
 const s=refreshDemo(sequence(['normal-d1-a','normal-d1-b','timeout']),fixtures);
 assert.deepEqual(s.status,{freshness:'fresh',error_code:'none'});
 assert.equal(s.daily_readings.length,2);assert.equal(s.current_reading.normalized_value,120);
});
test('official day 1 second reading has no source timestamp',()=>{
 assert.equal(fixtures['normal-d1-b'].payload.source_time,null);
});
