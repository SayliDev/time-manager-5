import assert from 'node:assert/strict';
import test from 'node:test';
import { loadTypeScript } from './loadTypeScript.mjs';

const storage = { '@/features/auth/api/tokenStorage': { tokenStorage: { get: () => 'test-token' } } };

test('pointages: routes, bornes inclusives, token et session ouverte', async (context) => {
  const paths = [];
  const signal = new AbortController().signal;
  context.mock.method(globalThis, 'fetch', async (url, options) => {
    const path = new URL(url);
    paths.push(path.pathname);
    assert.equal(path.searchParams.get('from'), '2026-10-01');
    assert.equal(path.searchParams.get('to'), '2026-10-02');
    assert.equal(options.headers.get('Authorization'), 'Bearer test-token');
    assert.equal(options.credentials, 'include');
    assert.equal(options.signal, signal);
    let data;
    if (path.pathname.endsWith('work-sessions')) data = [{ id_work_session: 12, date: '2026-10-02', start_at: '2026-10-02T06:00:00Z', end_at: null, hours: null, mode: 'remote', status: 'ongoing' }];
    else if (path.pathname.endsWith('daily')) data = [{ date: '2026-10-02', label: 'Ven', hours: 7.5, onsite: 0, remote: 7.5 }];
    else if (path.pathname.endsWith('weekly')) data = [{ week: 40, start: '2026-09-28', end: '2026-10-02', hours: 37.5, days_worked: 5 }];
    else data = { total_hours: 37.5, avg_weekly_hours: 37.5, avg_weekly_hours_delta: 7.14, overtime_hours: 2.5, late_count: 1, missing_count: 2 };
    return Response.json(data);
  });
  const { fetchTimekeeping } = loadTypeScript('@/shared/api/client', storage);
  const data = await fetchTimekeeping('3', '2026-10-01', '2026-10-02', signal);
  assert.equal(paths.length, 4);
  assert.ok(paths.every(path => path.startsWith('/api/users/3/')));
  assert.equal(data.entries[0].hours, null);
  assert.equal(data.entries[0].departure, null);
  assert.equal(data.entries[0].arrival, '08:00');
  assert.equal(data.stats.averageWeeklyHoursDelta, 7.14);
  assert.equal(data.stats.aboveTargetHours, 2.5);
  assert.equal(data.stats.missingCount, 2);
  assert.equal(data.weekly[0].days, 5);
});

test('dashboard: filtre équipe sur les quatre routes et jointure des employés', async (context) => {
  const paths = [];
  context.mock.method(globalThis, 'fetch', async url => {
    const path = new URL(url);
    paths.push(path.pathname);
    if (path.pathname.startsWith('/api/dashboard/')) {
      assert.equal(path.searchParams.get('team_id'), '2');
      assert.equal(path.searchParams.get('period'), 'month');
    }
    let data;
    if (path.pathname.endsWith('/teams')) data = [{ id: '2', name: 'Support' }];
    else if (path.pathname.endsWith('/directory')) data = [{ id: '3', firstName: 'Alice', lastName: 'Martin', lastClock: null }, { id: '4', firstName: 'Hors équipe' }];
    else if (path.pathname.endsWith('/presence')) data = [{ id_user: 3, presence: 'remote', weekly_hours: 34.2, last_clock_at: '2026-10-02T06:00:00Z' }];
    else if (path.pathname.endsWith('/hours')) data = [{ label: 'S40', onsite: 6, remote: 1.5 }];
    else if (path.pathname.endsWith('/activity')) data = [{ id: 51, id_user: 3, type: 'arrival', at: '2026-10-02T06:00:00Z', label: 'arrivée' }];
    else data = { attendance_rate: { value: 92, delta: 2, trend: [90, 92] }, avg_weekly_hours: { value: 34.2, delta: 0, trend: [34.2, 34.2] }, alerts: 1 };
    return Response.json(data);
  });
  const { fetchDashboard } = loadTypeScript('@/shared/api/client', storage);
  const data = await fetchDashboard('2', 'month', new AbortController().signal);
  assert.equal(paths.length, 6);
  assert.ok(!paths.includes('/dashboard'));
  assert.equal(data.users.length, 1);
  assert.equal(data.users[0].weeklyHours, 34.2);
  assert.equal(data.users[0].presence, 'remote');
  assert.equal(data.hours[0].hours, 7.5);
  assert.equal(data.activity[0].userId, '3');
});

test('arrivée et départ: corps attendu et conflit 409 propagé à la page', async (context) => {
  const calls = [];
  context.mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push({ url, options });
    return Response.json({ detail: 'Une session est déjà en cours.' }, { status: 409 });
  });
  const { clockIn, clockOut } = loadTypeScript('@/shared/api/client', storage);
  await assert.rejects(clockIn('remote'), error => error.status === 409 && error.message.includes('déjà'));
  assert.equal(calls[0].url, 'http://api.test/api/work-sessions/clock-in');
  assert.equal(calls[0].options.method, 'POST');
  assert.deepEqual(JSON.parse(calls[0].options.body), { mode: 'remote' });
  await assert.rejects(clockOut(), error => error.status === 409);
  assert.equal(calls[1].url, 'http://api.test/api/work-sessions/clock-out');
  assert.equal(calls[1].options.body, null);
});
