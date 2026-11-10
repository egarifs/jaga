import http from 'node:http';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { pool, migrate } from './db.ts';
import { verifyGoogle } from './auth.ts';
import { body, send } from './http.ts';
import { handleCare } from './care.ts';
import { tick } from './worker.ts';

const { SESSION_SECRET, GOOGLE_CLIENT_ID, PORT = '3000' } = process.env;
if (!SESSION_SECRET || SESSION_SECRET.length < 32) throw new Error('SESSION_SECRET (>=32 char) wajib');
if (!GOOGLE_CLIENT_ID) throw new Error('GOOGLE_CLIENT_ID wajib');

const b64 = (s: string | Buffer) => Buffer.from(s).toString('base64url');
const sign = (p: string) => createHmac('sha256', SESSION_SECRET!).update(p).digest('base64url');
export const issue = (uid: string) => { const p = b64(JSON.stringify({ uid, exp: Date.now() + 7 * 864e5 })); return `${p}.${sign(p)}`; };
export function verifySession(tok = ''): string | undefined {
  const [p, s] = tok.replace(/^Bearer /, '').split('.');
  if (!p || !s) return;
  const a = Buffer.from(sign(p)), b = Buffer.from(s);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return;
  const d = JSON.parse(Buffer.from(p, 'base64url').toString());
  return d.exp > Date.now() ? d.uid : undefined;
}

async function role(uid: string, circleId: string) {
  const { rows } = await pool.query('SELECT role,status FROM members WHERE circle_id=$1 AND user_id=$2', [circleId, uid]);
  return rows[0] as { role: string; status: string } | undefined;
}

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url!, 'http://x'); const route = `${req.method} ${url.pathname}`;
    if (route === 'GET /health') { await pool.query('SELECT 1'); return send(res, 200, { ok: true }); }
    if (route === 'POST /auth/google') {
      const g = await verifyGoogle((await body(req)).idToken, GOOGLE_CLIENT_ID!);
      const { rows } = await pool.query('INSERT INTO users(google_sub,name) VALUES($1,$2) ON CONFLICT(google_sub) DO UPDATE SET name=EXCLUDED.name RETURNING id', [g.sub, g.name]);
      return send(res, 200, { token: issue(rows[0].id) });
    }
    const uid = verifySession(req.headers.authorization);
    if (!uid) return send(res, 401, { error: 'login dulu' });

    if (route === 'POST /circles') {
      const code = randomBytes(4).toString('hex').toUpperCase();
      const c = await pool.connect();
      try {
        await c.query('BEGIN');
        const { rows } = await c.query('INSERT INTO circles(code,head_id) VALUES($1,$2) RETURNING id', [code, uid]);
        await c.query("INSERT INTO members(circle_id,user_id,role,status) VALUES($1,$2,'kepala','approved')", [rows[0].id, uid]);
        await c.query('COMMIT'); return send(res, 201, { id: rows[0].id, code });
      } catch (e) { await c.query('ROLLBACK'); throw e; } finally { c.release(); }
    }
    if (route === 'POST /circles/join') { // FR-04: valid code -> pending only
      const { code } = await body(req);
      const { rows } = await pool.query('SELECT id FROM circles WHERE code=$1', [String(code ?? '')]);
      if (!rows[0]) return send(res, 404, { error: 'kode tidak valid' });
      await pool.query("INSERT INTO members(circle_id,user_id,role,status) VALUES($1,$2,'perawat','pending') ON CONFLICT DO NOTHING", [rows[0].id, uid]);
      return send(res, 202, { status: 'pending' });
    }
    let m = url.pathname.match(/^\/circles\/([0-9a-f-]{36})\/members\/([0-9a-f-]{36})\/approve$/);
    if (m && req.method === 'POST') {
      const me = await role(uid, m[1]);
      if (me?.status !== 'approved' || !['kepala', 'wakil'].includes(me.role)) return send(res, 403, { error: 'dilarang' });
      const r = await pool.query("UPDATE members SET status='approved' WHERE circle_id=$1 AND user_id=$2", [m[1], m[2]]);
      await pool.query("INSERT INTO audit_log(circle_id,user_id,action,detail) VALUES($1,$2,'approve',$3)", [m[1], uid, m[2]]);
      return send(res, r.rowCount ? 200 : 404, { ok: !!r.rowCount });
    }
    m = url.pathname.match(/^\/circles\/([0-9a-f-]{36})$/);
    if (m && req.method === 'GET') { // pending members read nothing (BR-06)
      const me = await role(uid, m[1]);
      if (me?.status !== 'approved') return send(res, 403, { error: 'dilarang' });
      const { rows } = await pool.query('SELECT id,code,escalation_min FROM circles WHERE id=$1', [m[1]]);
      return send(res, 200, { ...rows[0], role: me.role });
    }
    if (route === 'DELETE /me/data') { // Q7: owner may delete anytime
      const c = await pool.connect();
      try {
        await c.query('BEGIN');
        const { rows } = await c.query("SELECT circle_id FROM members WHERE user_id=$1 AND role='kepala'", [uid]);
        if (rows.length) { await c.query('ROLLBACK'); return send(res, 409, { error: 'transfer kepemilikan dulu (Q8)' }); }
        await c.query('DELETE FROM users WHERE id=$1', [uid]);
        await c.query('COMMIT'); return send(res, 200, { ok: true });
      } catch (e) { await c.query('ROLLBACK'); throw e; } finally { c.release(); }
    }
    if (await handleCare(req, res, uid, url.pathname)) return;
    send(res, 404, { error: 'tidak ada' });
  } catch (e) { console.error(e); send(res, 500, { error: 'galat server' }); }
}).listen(+PORT, async () => {
  await migrate();
  const iv = +(process.env.WORKER_INTERVAL_MS ?? 30000);
  if (iv > 0) setInterval(() => tick().catch((e) => console.error('worker', e)), iv);
  console.log('jaga-api :' + PORT);
});
