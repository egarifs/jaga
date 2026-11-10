# Deploy (home-server1)
1. `/opt/secrets/jaga.env` (chmod 600, TIDAK di repo): `DB_PASSWORD`, `SESSION_SECRET` (`openssl rand -hex 32`), `GOOGLE_CLIENT_ID`.
2. `/opt/stacks/jaga`: salin `deploy/` + `backend/`, lalu `docker compose --env-file /opt/secrets/jaga.env up -d --build`.
3. Tunnel: tambah ingress `jaga.kahartos.my.id -> http://127.0.0.1:18082` SEBELUM catch-all 404; `cloudflared tunnel route dns kahartos-production jaga.kahartos.my.id`; restart `cloudflared`.
4. Backup: `docker exec jaga-db pg_dump -U jaga jaga | gzip -9 > /opt/backups/jaga/jaga-$(date -u +%Y%m%dT%H%M%SZ).sql.gz` (cron harian, retensi 7 hari).
5. Rollback: `git checkout <tag> && docker compose up -d --build`; restore: `zcat file | docker exec -i jaga-db psql -U jaga jaga`.
