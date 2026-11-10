// Integration: needs TEST_DATABASE_URL (skipped otherwise). Boots server, checks authz via real Postgres.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { issue_for } from './helper.ts';

const DB = process.env.TEST_DATABASE_URL;
test('api authz', { skip: !DB }, async () => {
  const env = { ...process.env, DATABASE_URL: DB!, SESSION_SECRET: 'x'.repeat(40), GOOGLE_CLIENT_ID: 'x', PORT: '3998' };
  const p = spawn('node', ['src/server.ts'], { env, stdio: 'inherit' });
  try {
    for (let i = 0; i < 40; i++) { try { if ((await fetch('http://127.0.0.1:3998/health')).ok) break; } catch {} await new Promise((r) => setTimeout(r, 250)); }
    const api = (path: string, tok?: string, method = 'GET', body?: unknown) =>
      fetch('http://127.0.0.1:3998' + path, { method, headers: { ...(tok ? { authorization: 'Bearer ' + tok } : {}), 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    assert.equal((await api('/circles', undefined, 'POST')).status, 401);
    const { Pool } = (await import('pg')).default;
    const pool = new Pool({ connectionString: DB });
    const mk = async (sub: string) => (await pool.query('INSERT INTO users(google_sub) VALUES($1) RETURNING id', [sub + Date.now()])).rows[0].id as string;
    const [h, n] = [await mk('h'), await mk('n')];
    const [th, tn] = [issue_for(h, env.SESSION_SECRET), issue_for(n, env.SESSION_SECRET)];
    const c = await (await api('/circles', th, 'POST')).json() as { id: string; code: string };
    assert.equal((await api('/circles/join', tn, 'POST', { code: 'SALAH' })).status, 404);
    assert.equal((await api('/circles/join', tn, 'POST', { code: c.code })).status, 202);
    assert.equal((await api('/circles/' + c.id, tn)).status, 403, 'pending reads nothing');
    assert.equal((await api(`/circles/${c.id}/members/${n}/approve`, tn, 'POST')).status, 403, 'pending cannot approve');
    assert.equal((await api(`/circles/${c.id}/members/${n}/approve`, th, 'POST')).status, 200);
    assert.equal((await api('/circles/' + c.id, tn)).status, 200);
    assert.equal((await api('/me/data', th, 'DELETE')).status, 409, 'head must transfer first');
    await pool.end();
  } finally { p.kill(); }
});
