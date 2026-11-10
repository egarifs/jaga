// Integration (needs TEST_DATABASE_URL): dose log, escalation routing, snooze, PRN gap, shift overlap.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { issue_for } from './helper.ts';

const DB = process.env.TEST_DATABASE_URL;
if (DB) process.env.DATABASE_URL = DB; // before worker/db load
const { tick } = await import('../src/worker.ts');
test('care flow', { skip: !DB }, async () => {
  const S = 'y'.repeat(40), P = 3997, B = `http://127.0.0.1:${P}`;
  const env = { ...process.env, DATABASE_URL: DB!, SESSION_SECRET: S, GOOGLE_CLIENT_ID: 'x', PORT: String(P), WORKER_INTERVAL_MS: '0' };
  const p = spawn('node', ['src/server.ts'], { env, stdio: 'inherit' });
  const { Pool } = (await import('pg')).default; const pool = new Pool({ connectionString: DB });
  try {
    for (let i = 0; i < 40; i++) { try { if ((await fetch(B + '/health')).ok) break; } catch {} await new Promise((r) => setTimeout(r, 250)); }
    const api = (path: string, tok: string, method = 'GET', b?: unknown) =>
      fetch(B + path, { method, headers: { authorization: 'Bearer ' + tok, 'content-type': 'application/json' }, body: b ? JSON.stringify(b) : undefined });
    const uid = async (n: string) => (await pool.query('INSERT INTO users(google_sub) VALUES($1) RETURNING id', [n + Date.now() + Math.random()])).rows[0].id as string;
    const [h, w, n1, n2] = [await uid('h'), await uid('w'), await uid('n1'), await uid('n2')];
    const [th, tn1, tn2] = [h, n1, n2].map((u) => issue_for(u, S));
    const c = await (await api('/circles', th, 'POST')).json() as { id: string };
    await pool.query("INSERT INTO members(circle_id,user_id,role,status) VALUES($1,$2,'wakil','approved'),($1,$3,'perawat','approved'),($1,$4,'perawat','approved')", [c.id, w, n1, n2]);

    // medicine: needs permission; perawat without flag is refused
    const med = { name: 'Amlodipin', doseText: '1 tablet', times: ['08:00'], remaining: 10 };
    assert.equal((await api(`/circles/${c.id}/medicines`, tn1, 'POST', med)).status, 403);
    assert.equal((await api(`/circles/${c.id}/medicines`, th, 'POST', { ...med, times: ['8am'] })).status, 400);
    const m = await (await api(`/circles/${c.id}/medicines`, th, 'POST', med)).json() as { id: string };

    // shifts: valid, then overlapping refused
    assert.equal((await api(`/circles/${c.id}/shifts`, th, 'POST', { name: 'pagi', start: '00:00', end: '23:59', userId: n1 })).status, 201);
    assert.equal((await api(`/circles/${c.id}/shifts`, th, 'POST', { name: 'x', start: '10:00', end: '12:00', userId: n2 })).status, 409);

    // overdue dose -> escalation goes to on-duty nurse n1 (Q3)
    const d = (await pool.query("INSERT INTO doses(medicine_id,circle_id,scheduled_at,escalate_at) VALUES($1,$2,now()-interval '20 min',now()-interval '5 min') RETURNING id", [m.id, c.id])).rows[0].id;
    await tick(); await tick(); // 2nd tick must not duplicate
    const esc = (await pool.query("SELECT user_id FROM notifications WHERE dose_id=$1 AND kind='escalation'", [d])).rows;
    assert.deepEqual(esc.map((r) => r.user_id), [n1]);

    // snooze needs reason; refused once escalated
    assert.equal((await api(`/doses/${d}/snooze`, tn1, 'POST', { reason: '' })).status, 400);
    assert.equal((await api(`/doses/${d}/snooze`, tn1, 'POST', { reason: 'pasien tidur' })).status, 409);

    // log: ok once, conflict second time, stock decremented, future timestamp refused
    const d2 = (await pool.query("INSERT INTO doses(medicine_id,circle_id,scheduled_at,escalate_at) VALUES($1,$2,now()-interval '1 hour',now()+interval '1 hour') RETURNING id", [m.id, c.id])).rows[0].id;
    assert.equal((await api(`/doses/${d2}/log`, tn1, 'POST', { takenAt: new Date(Date.now() + 36e5).toISOString() })).status, 400);
    assert.equal((await api(`/doses/${d2}/snooze`, tn1, 'POST', { reason: 'pasien tidur' })).status, 200);
    assert.equal((await api(`/doses/${d2}/log`, tn1, 'POST', {})).status, 200);
    assert.equal((await api(`/doses/${d2}/log`, tn2, 'POST', {})).status, 409);
    assert.equal(Number((await pool.query('SELECT remaining r FROM medicines WHERE id=$1', [m.id])).rows[0].r), 9);

    // outsider cannot log
    const out = issue_for(await uid('o'), S);
    assert.equal((await api(`/doses/${d2}/log`, out, 'POST', {})).status, 403);

    // PRN: min gap enforced, even under concurrency
    const prn = await (await api(`/circles/${c.id}/medicines`, th, 'POST', { name: 'Paracetamol', doseText: '1', asNeeded: true, minGapMin: 240, remaining: 5 })).json() as { id: string };
    const r = await Promise.all([1, 2, 3].map(() => api(`/medicines/${prn.id}/prn-log`, tn1, 'POST')));
    assert.deepEqual(r.map((x) => x.status).sort(), [201, 409, 409]);
  } finally { p.kill(); await pool.end(); }
});
