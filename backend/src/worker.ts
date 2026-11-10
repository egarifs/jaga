import { pool } from './db.ts';
import { recipient } from './escalation.ts';
import { onDuty } from './shifts.ts';
import type { Member } from './permissions.ts';

// ponytail: fixed Asia/Jakarta; add circles.tz when users outside WIB appear.
const TZ = 'Asia/Jakarta';

// Create dose rows for today..+2 days. Slots before the medicine existed are skipped.
async function ensureDoses() {
  await pool.query(`
    INSERT INTO doses(medicine_id,circle_id,scheduled_at,escalate_at)
    SELECT m.id, m.circle_id, x.ts, x.ts + c.escalation_min * interval '1 minute'
    FROM medicines m JOIN circles c ON c.id = m.circle_id
    CROSS JOIN generate_series(0,2) d
    CROSS JOIN LATERAL unnest(m.times) t
    CROSS JOIN LATERAL (SELECT ((now() AT TIME ZONE '${TZ}')::date + d + t::time) AT TIME ZONE '${TZ}' AS ts) x
    WHERE NOT m.as_needed AND x.ts >= m.created_at
    ON CONFLICT DO NOTHING`);
}

// kind/where/col are internal constants (never user input).
async function dispatch(kind: 'reminder' | 'escalation', where: string, col: string) {
  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    const doses = (await c.query(
      `SELECT id, circle_id, to_char(scheduled_at AT TIME ZONE '${TZ}','HH24:MI') hm FROM doses
       WHERE status='pending' AND ${where} ORDER BY scheduled_at LIMIT 100 FOR UPDATE SKIP LOCKED`)).rows;
    const cache = new Map<string, { members: Member[]; shifts: any[] }>();
    for (const d of doses) {
      if (!cache.has(d.circle_id)) {
        const members = (await c.query('SELECT user_id "userId", role, status FROM members WHERE circle_id=$1', [d.circle_id])).rows;
        const shifts = (await c.query('SELECT user_id "userId", name, start_time start, end_time "end" FROM shifts WHERE circle_id=$1 AND user_id IS NOT NULL', [d.circle_id])).rows;
        cache.set(d.circle_id, { members, shifts });
      }
      const { members, shifts } = cache.get(d.circle_id)!;
      const to = recipient(members, onDuty(shifts, d.hm)?.userId); // Q3 + Q4
      if (to) await c.query('INSERT INTO notifications(user_id,dose_id,kind) VALUES($1,$2,$3)', [to.userId, d.id, kind]);
      else await c.query("INSERT INTO audit_log(circle_id,action,detail) VALUES($1,'no_recipient',$2)", [d.circle_id, d.id]);
      await c.query(`UPDATE doses SET ${col}=now() WHERE id=$1`, [d.id]);
    }
    await c.query('COMMIT');
  } catch (e) { await c.query('ROLLBACK'); throw e; } finally { c.release(); }
}

export async function tick() {
  await ensureDoses();
  await dispatch('reminder', 'reminded_at IS NULL AND scheduled_at <= now()', 'reminded_at');
  await dispatch('escalation', 'escalated_at IS NULL AND escalate_at <= now()', 'escalated_at');
}
