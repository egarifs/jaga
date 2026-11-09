# Backlog eksekusi

FR = kebutuhan fungsional, BR = aturan bisnis (lihat PRD). Prio P0 wajib rilis pertama.

## WP0 — Interogator (gerbang)
- Jalankan sesi grill atas `tasks/DECISIONS.md`; satu pertanyaan per putaran, usulkan jawaban default, minta konfirmasi.
- Selesai bila: semua P0 = DECIDED; ringkasan keputusan ditulis.

## WP1 — Arsitek (butuh WP0)
- Pilih stack (Q1), skema data: Pengguna, Lingkaran, Anggota(peran, hubungan, izin ubah obat, izin dokumen, giliran), Permintaan gabung, Orang dirawat(alergi, kondisi), Obat, Stok, Dosis terjadwal, Log dosis, Kasus, Dokumen, Vital, Janji kontrol, Catatan serah terima, Pesan asisten.
- Kontrak API per sumber daya + matriks izin (Kepala/Wakil/Perawat).
- Selesai bila: skema + kontrak API + struktur repo ditinjau pemilik produk.

## WP2 — Antarmuka (butuh WP1)
- Token & komponen bersama (kartu, chip status, tombol 44px, tab bawah, progres).
- 19 layar dari `design/screens/*.dc.html`: Main, Pasien, Jadwal, Inventori, Riwayat, Dokumen, Pengingat, ChatAI, OnbWelcome, Login, Peran, Gabung, MainAnggota, OnbAnggota, OnbKeluarga, OnbObat, TimPerawat, AksesPerawat, OnbSelesai.
- Selesai bila: tiap layar cocok dengan artboard pada 390px; tab Rekam tersembunyi bila izin dokumen mati.

## WP3 — Backend (butuh WP1)
- FR-02 login Google, FR-03 pilih peran, FR-04 gabung via kode (kode valid → status menunggu), BR-06, BR-07.
- Selesai bila: uji API lulus; pemohon belum disetujui tidak bisa membaca data; izin ditegakkan di server.

## WP4 — Jadwal & notifikasi (butuh WP1, WP3)
- FR-20–25, FR-32; BR-01–04. Eskalasi berjalan di server dengan jendela pilihan Kepala. Stok: perkiraan habis = sisa / dosis harian; peringatan H-3; exp H-30. Obat "jika perlu": syarat + jarak minimal.
- Selesai bila: push tepat waktu & eskalasi terbukti di Android dan iOS nyata; Metformin 6 tablet @2/hari → "habis 3 hari".

## WP5 — Onboarding & akses (butuh WP2, WP3)
- FR-10–15, FR-05; BR-05–07. K1 form (alergi disorot), K2 kode + bagikan WhatsApp, K3 foto/manual (hasil pindai tidak tersimpan otomatis, BR-09), K4 tim, K5 izin/giliran + kalimat ringkasan, K6 izin notifikasi.
- Selesai bila: alur K1→K6 dan A1→A5 tuntas ujung ke ujung.

## WP6 — Rekam & AI (butuh WP3, WP4)
- FR-30–33; BR-08, BR-10. Riwayat, dokumen (tautan/unggah), "Ringkas dengan Asisten", chat dari data lingkaran + sumber + disclaimer + 119; cek alergi saat tambah obat.
- Selesai bila: jawaban bersumber, tanpa diagnosis/dosis; pertanyaan di luar data dijawab "data tidak ditemukan".

## WP7 — QA (setiap paket selesai)
- Kasus uji dari 7 skenario penerimaan PRD 7.1; jalankan; laporkan bug ke BugBoard (skill bugboard-qa-runner bila tersedia).
- Selesai bila: semua kasus P0 lulus; bug terbuka punya bukti & severity.

## WP8 — Privasi & keamanan (butuh WP3)
- Tinjau data kesehatan, izin per lingkaran, enkripsi, retensi/penghapusan (Q7).
- Selesai bila: temuan kritis = 0.
