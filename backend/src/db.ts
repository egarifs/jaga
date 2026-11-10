import pg from 'pg';
import { readFileSync, readdirSync } from 'node:fs';

export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

// ponytail: tiny forward-only migrator; swap for node-pg-migrate if rollbacks needed.
export async function migrate(dir = new URL('../migrations/', import.meta.url)) {
  await pool.query('CREATE TABLE IF NOT EXISTS _migrations (name text PRIMARY KEY)');
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.sql')).sort()) {
    const c = await pool.connect();
    try {
      await c.query('BEGIN');
      if ((await c.query('SELECT 1 FROM _migrations WHERE name=$1', [f])).rowCount) { await c.query('ROLLBACK'); continue; }
      await c.query(readFileSync(new URL(f, dir), 'utf8'));
      await c.query('INSERT INTO _migrations VALUES ($1)', [f]);
      await c.query('COMMIT');
    } catch (e) { await c.query('ROLLBACK'); throw e; } finally { c.release(); }
  }
}
