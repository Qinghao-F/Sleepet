(() => {
  'use strict';
  const M = window.SleepetReportModel;
  const screen = document.querySelector('[data-screen="reports"]');
  const HISTORY = 'sleepet-report-history-v1', PENDING = 'sleepet-report-pending-v1';
  const asset = file => `./assets/reports/${file}`;
  const img = (file, cls = '') => `<img class="${cls}" src="${asset(file)}" alt="" />`;
  const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const today = () => M.shift(new Date(), 0);
  const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
  const stored = read(HISTORY, []);
  let records = Array.isArray(stored) ? stored.filter(M.valid) : [];
  let pending = read(PENDING, null);
  let mode = 'weekly', weekEnd = today(), selected = today(), returnFocus = null, returnScreen = null;
  let persistenceFailed = false;
  const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { persistenceFailed = true; } };
  const dateLabel = date => date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase();
  const timeLabel = date => date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).toLowerCase();
  const rangeLabel = end => {
    const first = M.shift(end, -6), sameYear = first.getFullYear() === end.getFullYear();
    const start = first.toLocaleDateString('en-US', { month: 'long', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }) });
    const last = first.getMonth() === end.getMonth() && sameYear ? `${end.getDate()}, ${end.getFullYear()}` : end.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    return `${start} – ${last}`.toUpperCase();
  };
  const goalMinutes = prefix => {
    const schedule = state.schedule;
    let hour = Number(schedule[`${prefix}Hour`]) % 12 + (schedule[`${prefix}Period`] === 'PM' ? 12 : 0);
    let minutes = hour * 60 + Number(schedule[`${prefix}Minute`]);
    return minutes < 720 ? minutes + 1440 : minutes;
  };
  function nav() {
    return `<nav class="report-nav" aria-label="Main navigation"><button type="button" data-action="home" aria-label="Home">${img('d9241.svg')}</button><button type="button" class="active" data-action="weekly" aria-label="Sleep reports" aria-current="page">${img('bd7ac.svg')}</button><button type="button" data-action="me" aria-label="Me">${img('19ec9.svg')}</button></nav>`;
  }
  function weeklyContent(summary) {
    const average = summary.averageBedtime === null ? '—' : timeLabel(new Date(2000, 0, 1, 0, summary.averageBedtime % 1440));
    const real = summary.count > summary.sampleCount;
    const bars = summary.days.map(({ date, record }, i) => {
      const height = record ? Math.max(3, Math.min(105, record.seconds / 60 / 600 * 105)) : 2;
      return `<button type="button" class="report-day ${i === 6 ? 'last-day' : ''} ${record ? '' : 'empty-day'}" data-day="${M.key(date)}" aria-label="${escape(dateLabel(date))}: ${record ? M.duration(record.seconds) + (record.sample ? ', demo data' : ', recorded session') : 'no session'}"><span class="report-bar" style="--bar-height:${height}px;--bar-delay:${i * 45}ms"></span><span class="report-day-letter">${date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1)}</span></button>`;
    }).join('');
    return `<article class="report-card routine-card"><h2>Your routine, this week</h2><div class="routine-stats"><div><strong>${summary.sampleCount ? summary.bedGoals : '—'}</strong><span> / 7 nights</span><p>Asleep by your goal.</p></div><div><strong>${summary.sampleCount ? summary.wakeGoals : '—'}</strong><span> / 7 mornings</span><p>Up by your goal.</p></div></div></article>
      <article class="report-card consistency-card"><h2>Bedtime consistency</h2><p class="average-caption">${real ? 'Average session start' : 'Average bedtime'}</p><strong class="average-time">${average}</strong><div class="report-chart"><div class="report-axis"><span>11pm</span><span>12am</span><span>08am</span><span>09am</span></div><div class="report-plot"><div class="report-grid" aria-hidden="true">${Array.from({ length: 4 }, () => img('13f1b.svg')).join('')}</div><div class="report-bars">${bars}</div>${summary.count ? `<div class="report-average-line" style="top:${M.bedtimeOffset(summary.averageBedtime)}px" aria-hidden="true">${img('66670.svg')}</div>` : ''}</div></div><p class="chart-hint">Tap any day to see your daily sleep report</p></article>
      <article class="report-card rhythm-card"><h2>Your sleep rhythm</h2><p>Keep using Sleepet everyday.</p><p>${summary.count ? `${M.duration(summary.averageSeconds)} average ${real ? 'session' : 'sleep'}.` : 'No sessions this week.'}</p><button type="button" class="report-health-link" data-action="health">${img('5fb77.svg')}${img('93ca3.svg', 'health-chevron')}<span>Click to see more<br>information</span></button></article>`;
  }
  function dailyContent(record) {
    const stages = M.hasStages(record), total = record ? M.duration(record.seconds) : '—';
    const difference = record ? Math.round(record.seconds / 60) - 480 : 0;
    const goal = !record ? 'No Data' : !record.sample ? 'Recorded' : difference >= 0 ? 'Goal Met' : 'Below Goal';
    const explanation = !record ? 'No session recorded for this date' : record.sample ? `${Math.abs(difference)} min ${difference >= 0 ? 'above' : 'below'} your 8-hour goal` : 'App session duration · no sensor data';
    const start = record ? new Date(record.startedAt) : null;
    let ring = '';
    if (stages) {
      const sum = record.deep + record.light + record.rem;
      const fixed = record.deep === 110 && record.light === 260 && record.rem === 120;
      ring = `<div class="report-ring ${fixed ? 'fixed-ring' : 'dynamic-ring'}" style="--deep-end:${record.deep / sum * 360}deg;--light-end:${(record.deep + record.light) / sum * 360}deg">${fixed ? img('de192.svg', 'stage-arc deep-arc') + img('f9b99.svg', 'stage-arc light-arc') + img('b8b62.svg', 'stage-arc rem-arc') : ''}<div class="ring-copy"><strong>${total}</strong><span>ASLEEP</span></div></div>`;
    }
    return `<article class="report-card duration-card"><p class="duration-label">${record && !record.sample ? 'SESSION DURATION' : 'TIME ASLEEP'}</p><strong class="report-duration">${total}</strong><span class="report-goal ${goal === 'Below Goal' ? 'below-goal' : ''}">${goal}</span><p class="report-goal-copy">${explanation}</p>${stages ? img('c68fd.svg', 'report-timeline') : '<div class="report-no-timeline">' + (record ? 'Sleep stages need compatible sensor data.' : 'Start a sleep session from Home to begin.') + '</div>'}<div class="report-time-range"><span>${start ? timeLabel(start) : '—'}</span><span>${start ? timeLabel(new Date(start.getTime() + record.seconds * 1000)) : '—'}</span></div></article>
      <article class="report-card stages-card"><h2>Sleep stages</h2>${stages ? `<div class="stages-layout">${ring}<dl class="report-legend"><div><dt><i class="deep-dot"></i>Deep</dt><dd>${M.duration(record.deep * 60)}</dd></div><div><dt><i class="light-dot"></i>Light</dt><dd>${M.duration(record.light * 60)}</dd></div><div><dt><i class="rem-dot"></i>REM</dt><dd>${M.duration(record.rem * 60)}</dd></div></dl></div>` : '<p class="stages-empty">Sleep stages require compatible sensor data.<br>This prototype measures app activity only.</p>'}</article>
      <button type="button" class="report-connect" data-action="health"><span>Wonder more detail of sleep?<br>Connect to smart watch now.</span>${img('510a8.svg')}</button>`;
  }
  function render(focusHeading = false) {
    const summary = M.week(records, weekEnd, goalMinutes('bed'), goalMinutes('wake'));
    const record = M.forDay(records, selected), weekly = mode === 'weekly';
    const hasDemo = weekly ? summary.sampleCount > 0 : !!record?.sample;
    const note = hasDemo ? summary.count > summary.sampleCount && weekly ? 'DEMO + SESSION DATA' : 'DEMO DATA' : persistenceFailed ? 'SESSION ONLY · STORAGE UNAVAILABLE' : 'ON THIS DEVICE';
    const message = weekly ? 'Do you enjoy this week?' : !record ? 'Let’s find your rhythm.' : record.sample && record.seconds >= 480 * 60 ? 'You rested well.' : record.sample ? 'Take it gently today.' : 'A little rest matters.';
    screen.dataset.reportMode = mode;
    screen.innerHTML = `<div class="report-scroll"><div class="report-toolbar"><button type="button" data-action="${weekly ? 'home' : 'back'}" aria-label="${weekly ? 'Back to Home' : 'Back to weekly report'}">‹ ${weekly ? 'Home' : 'Week'}</button><button type="button" data-action="sample" aria-label="Add seven fixed demo nights">TEST +</button></div><header class="report-header"><p>S L E E P E T</p><h1 tabindex="-1">${weekly ? 'Weekly' : 'Daily'} Report</h1></header><div class="report-companion"><p>${message}</p>${img('565bf.png', 'report-mascot')}</div><div class="report-period"><button type="button" data-action="previous" aria-label="Previous ${weekly ? 'week' : 'day'}">‹</button><button type="button" class="report-period-label" data-action="date" aria-label="Choose report date">${weekly ? rangeLabel(weekEnd) : dateLabel(selected)}</button><button type="button" data-action="next" aria-label="Next ${weekly ? 'week' : 'day'}" ${M.key(weekly ? weekEnd : selected) >= M.key(today()) ? 'disabled' : ''}>›</button></div><div class="report-meta"><span>${weekly ? note : dateLabel(selected)}</span><span>${weekly ? `${summary.count} nights` : hasDemo ? 'Demo night' : M.key(selected) === M.key(today()) ? 'Today' : 'Selected night'}</span></div><div class="report-cards">${weekly ? weeklyContent(summary) : dailyContent(record)}</div><p class="report-source">${hasDemo ? 'Fixed demo data · not measured sleep' : summary.count && weekly ? 'Goal counts require sensor data.' : 'Sleepet · your rest, at your pace.'}${persistenceFailed ? ' · Changes cannot be saved in this browser.' : ''}</p></div>${nav()}<div class="report-modal-layer" hidden></div><div class="report-announcement" role="status" aria-live="polite"></div>`;
    if (!weekly && returnScreen) {
      const back = screen.querySelector('[data-action="back"]');
      back.textContent = '‹ Back'; back.setAttribute('aria-label', 'Back to morning feedback');
    }
    if (focusHeading) screen.querySelector('h1').focus({ preventScroll: true });
  }
  function open(nextMode = 'weekly', date) {
    mode = nextMode;
    if (mode === 'weekly') returnScreen = null;
    if (date) selected = new Date(`${date}T12:00:00`);
    showOnboardingScreen('reports');
    render(true);
  }
  const backgroundInert = enabled => {
    document.getElementById('phone').classList.toggle('is-report-open', enabled);
    [...document.getElementById('phone').children].forEach(child => {
      if (child.id !== 'onboardingLayer') child.inert = enabled;
    });
  };
  function announce(message) { screen.querySelector('.report-announcement').textContent = message; }
  function closeModal() {
    const layer = screen.querySelector('.report-modal-layer');
    if (layer.hidden) return;
    layer.hidden = true;
    screen.querySelector('.report-scroll').inert = false;
    screen.querySelector('.report-nav').inert = false;
    returnFocus?.focus({ preventScroll: true });
  }
  function modal(kind, trigger) {
    returnFocus = trigger;
    const layer = screen.querySelector('.report-modal-layer');
    const date = mode === 'weekly' ? weekEnd : selected;
    layer.innerHTML = `<button class="report-modal-scrim" type="button" data-action="close" aria-label="Close dialog" tabindex="-1"></button><section class="report-dialog" role="dialog" aria-modal="true" aria-labelledby="reportDialogTitle"><button type="button" class="report-dialog-close" data-action="close" aria-label="Close dialog">×</button>${kind === 'date' ? `<h2 id="reportDialogTitle">Choose ${mode === 'weekly' ? 'week ending' : 'a night'}</h2><form id="reportDateForm"><label for="reportDateInput">${mode === 'weekly' ? 'Show seven days ending on' : 'Show report for'}</label><input id="reportDateInput" type="date" value="${M.key(date)}" max="${M.key(today())}" required><button type="submit" class="report-dialog-primary">View report</button></form>` : `${img('5fb77.svg')}<h2 id="reportDialogTitle">More about your sleep</h2><p>Sleep stages and health insights need a compatible watch and a connected health service.</p><p>This browser prototype records session time only. Watch and Apple Health connections are not available here.</p><p>Use <strong>TEST +</strong> to explore seven labelled demo nights, matching the Unity prototype.</p><button type="button" class="report-dialog-primary" data-action="close">Got it</button>`}</section>`;
    layer.hidden = false;
    screen.querySelector('.report-scroll').inert = true;
    screen.querySelector('.report-nav').inert = true;
    layer.querySelector(kind === 'date' ? 'input' : '.report-dialog-primary').focus({ preventScroll: true });
    layer.querySelector('form')?.addEventListener('submit', event => {
      event.preventDefault();
      const input = layer.querySelector('input');
      if (!input.reportValidity()) return;
      const day = new Date(`${input.value}T12:00:00`);
      if (!Number.isFinite(day.getTime()) || M.key(day) > M.key(today())) return;
      if (mode === 'weekly') weekEnd = day; else selected = day;
      render(true);
    });
  }
  screen.addEventListener('keydown', event => {
    const layer = screen.querySelector('.report-modal-layer');
    if (!layer || layer.hidden) return;
    if (event.key === 'Escape') { event.preventDefault(); closeModal(); }
    if (event.key === 'Tab') {
      const controls = [...layer.querySelectorAll('button:not([tabindex="-1"]), input')];
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  screen.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button || button.disabled) return;
    if (button.dataset.day) { open('daily', button.dataset.day); return; }
    switch (button.dataset.action) {
      case 'home': showHome(); break;
      case 'me': backgroundInert(false); showPreferences(); break;
      case 'weekly': open('weekly'); break;
      case 'back': if (returnScreen) showOnboardingScreen(returnScreen); else open('weekly'); break;
      case 'previous': case 'next': {
        const direction = button.dataset.action === 'previous' ? -1 : 1;
        if (mode === 'weekly') weekEnd = M.shift(weekEnd, direction * 7); else selected = M.shift(selected, direction);
        if (weekEnd > today()) weekEnd = today();
        if (selected > today()) selected = today();
        render(); screen.querySelector(`[data-action="${button.dataset.action}"]`).focus({ preventScroll: true });
        break;
      }
      case 'date': case 'health': modal(button.dataset.action, button); break;
      case 'close': closeModal(); break;
      case 'sample':
        records = records.filter(r => !r.id.startsWith('fixed-week-')).concat(M.samples(mode === 'weekly' ? weekEnd : selected));
        write(HISTORY, records); render();
        screen.querySelector('[data-action="sample"]').focus({ preventScroll: true });
        announce('Seven fixed demo nights added. Tap a day to view its report.');
        break;
    }
  });
  document.querySelectorAll('.home-nav-button[aria-label="Sleep"], .bottom-nav button[aria-label="Sleep"]').forEach(button => {
    button.addEventListener('click', () => { weekEnd = today(); open('weekly'); });
  });
  document.getElementById('wakeSleepData')?.addEventListener('click', () => {
    const latest = records.filter(r => !r.sample).sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt))[0];
    returnScreen = 'wake-medium';
    open('daily', latest ? M.key(new Date(latest.startedAt)) : M.key(today()));
  });
  // Record actual elapsed app activity, never infer sleep stages from the timer.
  window.addEventListener('sleepet:screenchange', ({ detail }) => {
    backgroundInert(detail.name === 'reports');
    if (detail.name === 'sleep-monitor' && detail.previousScreen !== 'sleep-monitor') {
      if (!Number.isFinite(pending) || pending > Date.now() || Date.now() - pending > 86400000) pending = Date.now();
      write(PENDING, pending);
    }
    if (detail.name === 'wake-medium' && detail.previousScreen === 'sleep-monitor' && Number.isFinite(pending)) {
      const end = Date.now(), seconds = Math.max(0, Math.min(86400, (end - pending) / 1000));
      const record = { id: `session-${pending}`, startedAt: new Date(pending).toISOString(), seconds, sample: false };
      records = records.filter(r => r.id !== record.id).concat(record);
      pending = null; write(PENDING, null); write(HISTORY, records);
    }
  });
  const preview = new URLSearchParams(location.search);
  if (['weekly', 'daily', 'day-detail'].includes(preview.get('preview'))) {
    if (preview.get('demo') === '1') records = records.filter(r => !r.sample).concat(M.samples(weekEnd));
    open(preview.get('preview') === 'weekly' ? 'weekly' : 'daily', M.key(selected));
  }
})();
