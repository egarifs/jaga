# Arsitektur (WP1)

Monorepo: `app/` Flutter (Android+iOS), `backend/` Node 24 + TypeScript, `design/` kontrak visual (read-only).

## Skema data (entitas → kunci utama)
Pengguna(id, googleSub) · Lingkaran(id, kode, kepalaId) · Anggota(lingkaranId, penggunaId, peran[kepala|wakil|perawat], status[pending|approved], bolehUbahObat, bolehDokumen, giliran) · PermintaanGabung · OrangDirawat(alergi, kondisi; pemilik data) · Obat · Stok(sisa, dosisHarian, exp) · DosisTerjadwal · LogDosis(timestampPerangkat, timestampServer) · Kasus · Dokumen(≤10MB, JPG/PNG/PDF, storage terenkripsi) · Vital · JanjiKontrol · CatatanSerahTerima · PesanAsisten · Shift(mulai, selesai, tanpa overlap) · Persetujuan(tujuan, penerima, dicabut) · AuditLog · DaftarBeli.

## Matriks izin (server; `backend/src/permissions.ts`)
| Aksi | Kepala | Wakil | Perawat |
| --- | --- | --- | --- |
| hapus/transfer lingkaran, ubah peran, jendela eskalasi | ✔ | – | – |
| setujui anggota, atur shift | ✔ | ✔ | – |
| ubah obat, baca dokumen | ✔ | ✔ | hanya bila izin diberikan |
| catat dosis, baca riwayat, tanya AI | ✔ | ✔ | ✔ |
Anggota `pending` = tanpa akses apa pun.

## Kontrak API (REST, JSON, Bearer token Google)
`POST /auth/google` · `POST /circles` · `POST /circles/join {code}` → pending · `POST /circles/:id/members/:uid/approve` · `PATCH …/role` · `POST /circles/:id/transfer` · `DELETE /circles/:id` · `GET|POST /circles/:id/shifts` · `GET|POST /circles/:id/medicines` · `GET /circles/:id/schedule` · `POST /doses/:id/log` · `POST /doses/:id/snooze {reason}` · `GET /circles/:id/stock` · `GET|POST /circles/:id/documents` · `POST /circles/:id/assistant {q}` · `GET|POST /circles/:id/shopping` · `DELETE /me/data`.

## Aturan keputusan (DECISIONS.md)
Eskalasi 15 mnt → perawat bertugas, kosong → Wakil (Q2–4). Tunda +15 mnt, alasan wajib, diaudit (Q9). Offline: catat lokal, server validasi konflik (Q10). AI: OpenAI, OCR lokal, persetujuan eksplisit, interaksi obat dari database medis resmi (Q6).
