import {applySuccessfulReading,runFixture} from './reading.mjs';

// Both cards describe the same reading, including out-of-order manual replays.
export function comparisonRows(state) {
  const last = state.current_reading;
  const prev = last ? state.daily_readings
    .filter(row => row.signal_id === last.signal_id && row.record_date < last.record_date)
    .sort((a,b) => b.record_date.localeCompare(a.record_date))[0] : undefined;
  return {last,prev};
}

export function refreshDemo(state,fixtures) {
  if (state.status?.freshness === 'stale') return runFixture(state,fixtures['recover-d2']);
  if (!state.current_reading) return runFixture(state,fixtures['normal-d1-a']);
  return applySuccessfulReading(state,state.current_reading);
}
