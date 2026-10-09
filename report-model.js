/* Shared report calculations. Dates use local calendar days, as in Unity. */
(function (root, factory) {
  const model = factory();
  if (typeof module === 'object' && module.exports) module.exports = model;
  else root.SleepetReportModel = model;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const key = date => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
  const shift = (date, days) => { const result = new Date(date); result.setHours(12, 0, 0, 0); result.setDate(result.getDate() + days); return result; };
  const duration = seconds => { const minutes = Math.round(seconds / 60); return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`; };
  const nightMinutes = date => { const value = date.getHours() * 60 + date.getMinutes(); return value < 720 ? value + 1440 : value; };
  const valid = record => record && typeof record.id === 'string' && Number.isFinite(Date.parse(record.startedAt)) && Number.isFinite(record.seconds) && record.seconds >= 0 && record.seconds <= 86400 && typeof record.sample === 'boolean';
  function samples(end) {
    const minutes = [440, 490, 465, 415, 480, 450, 495];
    const deep = [100, 110, 105, 90, 115, 100, 110], rem = [110, 120, 115, 95, 125, 110, 120];
    return minutes.map((value, i) => {
      const day = shift(end, i - 6); day.setHours(23, 50, 0, 0);
      return { id: `fixed-week-${key(day)}`, startedAt: day.toISOString(), seconds: value * 60, deep: deep[i], light: value - deep[i] - rem[i], rem: rem[i], sample: true };
    });
  }
  function forDay(records, date) {
    return records.filter(valid).filter(r => key(new Date(r.startedAt)) === key(date))
      .sort((a, b) => Number(a.sample) - Number(b.sample) || Date.parse(b.startedAt) - Date.parse(a.startedAt))[0] || null;
  }
  const hasStages = r => !!(r?.sample && [r.deep, r.light, r.rem].every(n => Number.isFinite(n) && n >= 0) && r.deep + r.light + r.rem > 0);
  function week(records, end, bedGoal = 1440, wakeGoal = 1920) {
    const days = Array.from({ length: 7 }, (_, i) => { const date = shift(end, i - 6); return { date, record: forDay(records, date) }; });
    const found = days.map(d => d.record).filter(Boolean), demo = found.filter(r => r.sample);
    return { days, count: found.length, sampleCount: demo.length,
      averageSeconds: found.length ? found.reduce((n, r) => n + r.seconds, 0) / found.length : null,
      averageBedtime: found.length ? Math.round(found.reduce((n, r) => n + nightMinutes(new Date(r.startedAt)), 0) / found.length) : null,
      bedGoals: demo.filter(r => nightMinutes(new Date(r.startedAt)) <= bedGoal).length,
      wakeGoals: demo.filter(r => nightMinutes(new Date(Date.parse(r.startedAt) + r.seconds * 1000)) <= wakeGoal).length };
  }
  const bedtimeOffset = n => n <= 1440 ? Math.max(0, Math.min(1, (n - 1380) / 60)) * 35 : n <= 1920 ? 35 + (n - 1440) / 480 * 35 : 70 + Math.max(0, Math.min(1, (n - 1920) / 60)) * 35;
  return { key, shift, duration, nightMinutes, valid, samples, forDay, hasStages, week, bedtimeOffset };
});
