# Tinjauan privasi & keamanan (WP8) — DRAFT, butuh review manusia
- Data kesehatan = data pribadi spesifik (UU PDP). Persetujuan eksplisit sebelum dibuat/dibagikan; pemilik data = orang dirawat.
- Pihak ketiga (OpenAI, Google OAuth, push, storage): kirim hanya setelah persetujuan; sebut tujuan, penerima, retensi, cara cabut.
- Enkripsi in-transit (TLS) dan at-rest (storage terenkripsi). Izin di server, bukan UI.
- Retensi: selama lingkaran aktif; hapus atas permintaan (`DELETE /me/data`).
- Secret: tidak pernah di repo (`.gitignore`, pre-commit hook, GitHub push protection).
- Belum ada: pentest, DPIA, kontrak pemrosesan data dengan OpenAI. Temuan kritis harus 0 sebelum rilis.
