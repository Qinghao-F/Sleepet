const { test } = require('node:test');
const assert = require('node:assert/strict');
const M = require('./report-model.js');
const end = new Date(2026, 9, 9, 12);
test('fixed Unity demo week has seven dates and internally consistent stage totals', () => {
  const samples = M.samples(end);
  assert.equal(samples.length, 7);
  assert.equal(M.key(new Date(samples[0].startedAt)), '2026-10-03');
  assert.deepEqual(samples.map(r => r.seconds / 60), [440, 490, 465, 415, 480, 450, 495]);
  for (const r of samples) assert.equal(r.deep + r.light + r.rem, r.seconds / 60);
  assert.ok(Math.abs(M.week(samples, end).averageSeconds - 27728.57142857143) < 0.001);
});
test('real records take precedence over demo, latest session wins and has no inferred stages', () => {
  const samples = M.samples(end), older = { id: 'real-a', startedAt: new Date(2026, 9, 9, 20).toISOString(), seconds: 120, sample: false };
  const latest = { ...older, id: 'real-b', startedAt: new Date(2026, 9, 9, 21).toISOString() };
  const result = M.forDay([...samples, latest, older], end);
  assert.equal(result.id, 'real-b'); assert.equal(M.hasStages(result), false);
  const week = M.week([...samples, latest], end);
  assert.equal(week.count, 7); assert.equal(week.sampleCount, 6);
});
test('bedtime averages wrap midnight rather than becoming noon', () => {
  const records = [new Date(2026, 9, 8, 23, 50), new Date(2026, 9, 9, 0, 10)].map((d, i) => ({ id: String(i), startedAt: d.toISOString(), seconds: 3600, sample: false }));
  assert.equal(M.week(records, end).averageBedtime, 1440);
  assert.equal(M.week(records, end).bedGoals, 0);
});
test('empty and malformed data do not fabricate averages or stages', () => {
  const result = M.week([{ id: 'bad', startedAt: 'invalid', seconds: -1 }], end);
  assert.equal(result.count, 0); assert.equal(result.averageSeconds, null); assert.equal(result.averageBedtime, null);
  assert.equal(M.forDay([], end), null); assert.equal(M.hasStages({ sample: true, deep: NaN, light: 1, rem: 1 }), false);
});
test('date navigation crosses year boundaries using local calendar days', () => {
  assert.equal(M.key(M.shift(new Date(2027, 0, 2, 12), -6)), '2026-12-27');
  assert.equal(M.duration(3599), '1h 00m');
  assert.equal(M.bedtimeOffset(1440), 35); assert.equal(M.bedtimeOffset(1920), 70);
});
