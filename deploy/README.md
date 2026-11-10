# Deploy (home-server1)
1. `/opt/secrets/jaga.env` (chmod 600, TIDAK di repo): `DB_PASSWORD`, `SESSION_SECRET` (`openssl rand -hex 32`), `GOOGLE_CLIENT_ID`.
2. `/opt/stacks/jaga`: salin `deploy/` + `backend/`, lalu `docker compose -p jaga --env-file /opt/secrets/jaga.env up -d --build` (dari `deploy/`).
3. Tunnel: ingress `jaga.kahartos.my.id -> http://127.0.0.1:18082` sebelum catch-all 404 (sudah ditambahkan; backup `config.yml.bak-jaga-*`). DNS: CNAME `jaga` -> `c9be2832-bc04-405b-b92e-67f058fd9d75.cfargotunnel.com` (proxied) dibuat di dashboard Cloudflare, karena server tidak punya `cert.pem`.
4. Backup: `/opt/backups/backup-jaga.sh` (cron `/etc/cron.d/jaga-backup`, 02:30 UTC, retensi 7 hari, `gzip -t`).
5. Rollback: `git checkout <tag> && docker compose up -d --build`; restore: `zcat file | docker exec -i jaga-db psql -U jaga jaga`.
