# Desain — Jaga (sumber visual)

`screens/*.dc.html` = 19 artboard (HTML statis, 390x844) dari canvas "Jaga — Family Care App"; `canvas.json` = tata letak. Jangan diedit oleh agen.

## Peta layar → kebutuhan
| File | Judul | FR |
| --- | --- | --- |
| OnbWelcome | A1 Carousel pengenalan | FR-01 |
| Login | A2 Login Google | FR-02 |
| Peran | A3 Mulai merawat / gabung | FR-03 |
| Gabung | A4 Gabung ke lingkaran | FR-04 |
| MainAnggota | A5 Beranda perawat | FR-05 |
| OnbAnggota | K1 Siapa yang dirawat | FR-10 |
| OnbKeluarga | K2 Ajak keluarga | FR-11 |
| OnbObat | K3 Obat pertama | FR-12 |
| TimPerawat | K4 Tim lingkaran | FR-13 |
| AksesPerawat | K5 Atur peran & akses | FR-14 |
| OnbSelesai | K6 Notifikasi & selesai | FR-15 |
| Main | 01 Beranda | FR-20–22 |
| Pasien | 02 Profil anggota | FR-23–24 |
| Jadwal | 03 Jadwal minum obat | FR-25 |
| Inventori | 04 Kotak obat | FR-26 |
| Riwayat | 05 Riwayat penyakit | FR-30 |
| Dokumen | 06 Dokumen & link | FR-31 |
| Pengingat | 07 Pengingat & tim | FR-32 |
| ChatAI | 08 Asisten AI | FR-33 |

## Catatan sebelum dibangun
- `Pasien.dc.html` berisi dua blok teks nyasar "Passed: 45 … Total: 54" di akhir layar (tampak hasil uji tertempel). Abaikan; jangan diimplementasikan.
- `ChatAI` memakai placeholder `[NILAI]` untuk HbA1c/LDL: nilai harus dari dokumen terekstrak.
- Data (nama, obat, tanggal) adalah contoh.
- Belum ada desain: Catat kondisi, Tambah obat/jadwal, Atur giliran, daftar beli, pengaturan/profil, lingkaran baru, pengaturan notifikasi, kondisi kosong & galat (Q13).
