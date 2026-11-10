import type http from 'node:http';
import { pool } from './db.ts';
import { body, send } from './http.ts';
import { can, type Member } from './permissions.ts';
import { daysLeft, lowStock, expiringSoon } from './stock.ts';
import { overlaps } from './shifts.ts';
import { snooze } from './escalation.ts';

const UUID = '([0-9a-f-]{36})', HM = /^([01]\d|2[0-3]):[0-5]\d$/;

export async function member(uid: string, circleId: string): Promise<Member | undefined> {
  const { rows } = await pool.query('SELECT role,status,can_edit_medicine,can_read_documents FROM members WHERE circle_id=$1 AND user_id=$2', [circleId, uid]);
  const r = rows[0];
  return r && { userId: uid, role: r.role, status: r.status, canEditMedicine: r.can_edit_medicine, canReadDocuments: r.can_read_documents };
}
const audit = (circle: string, uid: string, action: string, detail: string) =>
  pool.query('INSERT INTO audit_log(circle_id,user_id,action,detail) VALUES($1,$2,$3,$4)', [circle, uid, action, detail]);

// Returns true when the request was handled.
export async function handleCare(req: http.IncomingMessage, res: http.ServerResponse, uid: string, path: string): Promise<boolean> {
  const route = `${req.method} ${path}`; let m: RegExpMatchArray | null;

  if ((m = route.match(new RegExp(`^GET /circles/${UUID}/(doses|shifts|medicines)$`)))) {
    if (!can(await member(uid, m[1]), 'record.read')) return send(res, 403, { error: 'dilarang' }), true;
    const q = {
      doses: `SELECT d.id,d.medicine_id "medicineId",m.name,m.dose_text "doseText",d.scheduled_at "scheduledAt",d.status,d.taken_at "takenAt",d.logged_by "loggedBy"
              FROM doses d JOIN medicines m ON m.id=d.medicine_id
              WHERE d.circle_id=$1 AND d.scheduled_at >= date_trunc('day', now() AT TIME ZONE 'Asia/Jakarta') AT TIME ZONE 'Asia/Jakarta' - interval '1 day'
              ORDER BY d.scheduled_at LIMIT 500`,
      shifts: 'SELECT id,user_id "userId",name,start_time start,end_time "end" FROM shifts WHERE circle_id=$1 ORDER BY start_time',
      medicines: 'SELECT id,name,dose_text "doseText",units_per_dose "unitsPerDose",times,as_needed "asNeeded",condition_text condition,min_gap_min "minGapMin",remaining::float,expiry FROM medicines WHERE circle_id=$1 ORDER BY name',
    }[m[2] as 'doses' | 'shifts' | 'medicines'];
    return send(res, 200, (await pool.query(q, [m[1]])).rows), true;
  }

  if ((m = route.match(new RegExp(`^POST /circles/${UUID}/medicines$`)))) {
    if (!can(await member(uid, m[1]), 'medicine.edit')) return send(res, 403, { error: 'dilarang' }), true;
    const b = await body(req);
    const times: string[] = Array.isArray(b.times) ? b.times : [];
    if (!b.name || !b.doseText) return send(res, 400, { error: 'name & doseText wajib' }), true;
    if (!times.every((t) => HM.test(t))) return send(res, 400, { error: 'times harus HH:MM' }), true;
    if (!b.asNeeded && !times.length) return send(res, 400, { error: 'times wajib' }), true;
    if (b.asNeeded && !(b.minGapMin > 0)) return send(res, 400, { error: 'minGapMin wajib untuk obat jika perlu' }), true;
    const { rows } = await pool.query(
      `INSERT INTO medicines(circle_id,name,dose_text,units_per_dose,times,as_needed,condition_text,min_gap_min,remaining,expiry)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
      [m[1], b.name, b.doseText, b.unitsPerDose ?? 1, times, !!b.asNeeded, b.condition ?? null, b.minGapMin ?? null, b.remaining ?? 0, b.expiry ?? null]);
    await audit(m[1], uid, 'medicine.create', rows[0].id);
    return send(res, 201, { id: rows[0].id }), true;
  }

  if ((m = route.match(new RegExp(`^GET /circles/${UUID}/stock$`)))) {
    if (!can(await member(uid, m[1]), 'record.read')) return send(res, 403, { error: 'dilarang' }), true;
    const { rows } = await pool.query('SELECT id,name,remaining,units_per_dose,times,as_needed,expiry FROM medicines WHERE circle_id=$1 ORDER BY name', [m[1]]);
    return send(res, 200, rows.map((r) => {
      const s = { remaining: Number(r.remaining), dailyDose: r.as_needed ? 0 : Number(r.units_per_dose) * r.times.length, expiry: r.expiry?.toISOString?.().slice(0, 10) };
      return { id: r.id, name: r.name, remaining: s.remaining, daysLeft: s.dailyDose ? daysLeft(s) : null, low: s.dailyDose ? lowStock(s) : false, expiringSoon: expiringSoon(s) };
    })), true;
  }

  if ((m = route.match(new RegExp(`^POST /circles/${UUID}/shifts$`)))) {
    if (!can(await member(uid, m[1]), 'shift.manage')) return send(res, 403, { error: 'dilarang' }), true;
    const b = await body(req);
    if (!b.name || !HM.test(b.start) || !HM.test(b.end)) return send(res, 400, { error: 'name, start, end (HH:MM) wajib' }), true;
    const c = await pool.connect();
    try { // lock circle row so concurrent shift writes cannot both pass the overlap check
      await c.query('BEGIN'); await c.query('SELECT 1 FROM circles WHERE id=$1 FOR UPDATE', [m[1]]);
      const ex = (await c.query('SELECT name, start_time start, end_time "end" FROM shifts WHERE circle_id=$1', [m[1]])).rows;
      if (overlaps([...ex, { name: b.name, start: b.start, end: b.end }])) { await c.query('ROLLBACK'); return send(res, 409, { error: 'jam shift tumpang tindih' }), true; }
      if (b.userId) {
        const t = await c.query("SELECT 1 FROM members WHERE circle_id=$1 AND user_id=$2 AND status='approved'", [m[1], b.userId]);
        if (!t.rowCount) { await c.query('ROLLBACK'); return send(res, 400, { error: 'userId bukan anggota' }), true; }
      }
      const r = await c.query('INSERT INTO shifts(circle_id,user_id,name,start_time,end_time) VALUES($1,$2,$3,$4,$5) RETURNING id', [m[1], b.userId ?? null, b.name, b.start, b.end]);
      await c.query('COMMIT'); return send(res, 201, { id: r.rows[0].id }), true;
    } catch (e) { await c.query('ROLLBACK'); throw e; } finally { c.release(); }
  }

  if ((m = route.match(new RegExp(`^POST /doses/${UUID}/log$`)))) {
    const d = (await pool.query('SELECT d.circle_id,d.scheduled_at,d.status,m.units_per_dose,d.medicine_id FROM doses d JOIN medicines m ON m.id=d.medicine_id WHERE d.id=$1', [m[1]])).rows[0];
    if (!d) return send(res, 404, { error: 'tidak ada' }), true;
    if (!can(await member(uid, d.circle_id), 'dose.log')) return send(res, 403, { error: 'dilarang' }), true;
    const b = await body(req);
    const at = b.takenAt ? new Date(b.takenAt) : new Date(); // Q10: device timestamp, server validates
    if (isNaN(+at) || +at > Date.now() + 5 * 60_000 || +at < +d.scheduled_at - 12 * 3600_000)
      return send(res, 400, { error: 'takenAt tidak masuk akal' }), true;
    const c = await pool.connect();
    try {
      await c.query('BEGIN');
      const u = await c.query("UPDATE doses SET status='taken', taken_at=now(), device_taken_at=$2, logged_by=$3 WHERE id=$1 AND status='pending'", [m[1], at, uid]);
      if (!u.rowCount) { await c.query('ROLLBACK'); return send(res, 409, { error: 'dosis sudah tercatat', status: d.status }), true; }
      await c.query('UPDATE medicines SET remaining=GREATEST(remaining-$2,0) WHERE id=$1', [d.medicine_id, d.units_per_dose]);
      await c.query('COMMIT');
    } catch (e) { await c.query('ROLLBACK'); throw e; } finally { c.release(); }
    await audit(d.circle_id, uid, 'dose.log', m[1]);
    return send(res, 200, { ok: true }), true;
  }

  if ((m = route.match(new RegExp(`^POST /doses/${UUID}/snooze$`)))) {
    const d = (await pool.query('SELECT circle_id,status,escalate_at,escalated_at FROM doses WHERE id=$1', [m[1]])).rows[0];
    if (!d) return send(res, 404, { error: 'tidak ada' }), true;
    if (!can(await member(uid, d.circle_id), 'dose.log')) return send(res, 403, { error: 'dilarang' }), true;
    const { reason } = await body(req);
    const log: string[] = [];
    let next: Date;
    try { next = snooze(d.escalate_at, String(reason ?? ''), log, uid); } catch { return send(res, 400, { error: 'alasan wajib' }), true; }
    const u = await pool.query("UPDATE doses SET escalate_at=$2 WHERE id=$1 AND status='pending' AND escalated_at IS NULL", [m[1], next]);
    if (!u.rowCount) return send(res, 409, { error: 'sudah tereskalasi atau tercatat' }), true;
    await audit(d.circle_id, uid, 'dose.snooze', log[0]);
    return send(res, 200, { escalateAt: next }), true;
  }

  if ((m = route.match(new RegExp(`^POST /medicines/${UUID}/prn-log$`)))) {
    const c = await pool.connect();
    try { // lock medicine row: two concurrent logs must not both pass the min-gap check
      await c.query('BEGIN');
      const md = (await c.query('SELECT circle_id,as_needed,min_gap_min,units_per_dose FROM medicines WHERE id=$1 FOR UPDATE', [m[1]])).rows[0];
      if (!md) { await c.query('ROLLBACK'); return send(res, 404, { error: 'tidak ada' }), true; }
      if (!can(await member(uid, md.circle_id), 'dose.log')) { await c.query('ROLLBACK'); return send(res, 403, { error: 'dilarang' }), true; }
      if (!md.as_needed) { await c.query('ROLLBACK'); return send(res, 400, { error: 'bukan obat jika perlu' }), true; }
      const last = (await c.query("SELECT max(taken_at) t FROM doses WHERE medicine_id=$1 AND status='taken'", [m[1]])).rows[0].t as Date | null;
      const next = last && new Date(+last + md.min_gap_min * 60_000);
      if (next && +next > Date.now()) { await c.query('ROLLBACK'); return send(res, 409, { error: 'jarak minimal belum terpenuhi', nextAt: next }), true; }
      await c.query("INSERT INTO doses(medicine_id,circle_id,scheduled_at,status,taken_at,device_taken_at,logged_by,escalate_at) VALUES($1,$2,now(),'taken',now(),now(),$3,now())", [m[1], md.circle_id, uid]);
      await c.query('UPDATE medicines SET remaining=GREATEST(remaining-$2,0) WHERE id=$1', [m[1], md.units_per_dose]);
      await c.query('COMMIT'); return send(res, 201, { ok: true }), true;
    } catch (e) { await c.query('ROLLBACK'); throw e; } finally { c.release(); }
  }
  return false;
}
