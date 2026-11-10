# Log keputusan (grill-me)

Status: OPEN | DECIDED. Agen interogator mengisi kolom Keputusan bersama pemilik produk. P0 wajib DECIDED sebelum WP1.

| ID | Pertanyaan | Prio | Konteks desain | Status | Keputusan |
| --- | --- | --- | --- | --- | --- |
| Q1 | Stack/platform: native, Flutter/React Native, atau PWA? Backend dan push apa? | P0 | Mobile 390x844, teknologi tidak disebut | DECIDED | Flutter; backend API terpisah. |
| Q2 | Jendela eskalasi default berapa? | P0 | Main: 5 mnt; OnbSelesai: 30 mnt; Pengingat: 15/30/60 | DECIDED | 15 menit. |
| Q3 | Penerima eskalasi: Wakil saja, semua perawat, atau yang bertugas berikutnya? | P0 | Andi "cadangan eskalasi" | DECIDED | Perawat yang sedang bertugas. |
| Q4 | Dosis saat shift kosong? | P0 | TimPerawat: Malam "Kosong" | DECIDED | Dosis tetap aktif, eskalasi ke Wakil. |
| Q5 | Batas shift yang benar? | P1 | Pengingat Dewi 06–15 vs K4/K5 06–14 | DECIDED | Kepala bebas mengatur jam shift; jam shift tidak boleh overlap. |
| Q6 | Penyedia AI & pemindai resep; data ke pihak ketiga; sumber data interaksi obat? | P0 | ChatAI, OnbObat | DECIDED | OpenAI API; OCR lokal di perangkat; pihak ketiga boleh setelah persetujuan eksplisit; semua data obat/interaksi = input pengguna dari layanan kesehatan; tidak ada database medis resmi, jadi tidak ada klaim "cek interaksi" otomatis, hanya kutip data input dengan label sumber. |
| Q7 | Persetujuan, retensi, penghapusan data kesehatan (UU PDP); pemilik data? | P0 | Login: data hanya untuk keluarga disetujui | DECIDED | Persetujuan wajib sebelum data kesehatan dibuat atau dibagikan; simpan selama lingkaran aktif; pemilik data dapat meminta hapus kapan saja; orang yang dirawat adalah pemilik data, Kepala hanya administrator akses. |
| Q8 | Kepala keluar / hapus lingkaran / transfer? | P1 | Tidak digambarkan | DECIDED | Transfer wajib sebelum keluar; hapus lingkaran butuh konfirmasi kuat; penghapusan mengikuti permintaan hapus data Q7. |
| Q9 | Efek "Tunda 15 mnt" pada eskalasi? | P1 | Banner Beranda | DECIDED | Eskalasi mundur 15 menit; alasan wajib; tindakan tercatat di riwayat audit. |
| Q10 | Offline & sinkronisasi pencatatan dosis? | P1 | Tidak digambarkan | DECIDED | Izinkan offline dengan timestamp perangkat; server validasi konflik saat sinkronisasi. |
| Q11 | Batas ukuran/jenis berkas dokumen & penyimpanan? | P1 | Dokumen, contoh 1,2 MB | DECIDED | Maksimum 10 MB; JPG, PNG, PDF; storage terenkripsi. |
| Q12 | Fitur "daftar beli"? | P2 | Tombol di Inventori & Asisten | DECIDED | Manual + obat stok rendah otomatis; item bisa diedit dan ditandai selesai. |
| Q13 | Layar yang belum didesain (lihat design/README.md) — didesain dulu atau dibangun dari pola yang ada? | P0 | Catat kondisi, tambah obat/jadwal, atur giliran, pengaturan, kosong/galat | DECIDED | Desain dulu sebelum coding. |
| Q14 | Stack backend API? | P1 | Flutter membutuhkan backend terpisah | DECIDED | Node.js + TypeScript. |
| Q15 | Database, hosting, push? | P1 | Backend butuh persistence | DECIDED | PostgreSQL; hosting di home server pemilik; push Firebase Cloud Messaging. |
| Q16 | Lisensi? | P1 | Repo publik | DECIDED | AGPL-3.0. |
