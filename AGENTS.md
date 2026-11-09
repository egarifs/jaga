# Jaga — Family Care App: panduan tim agent (grill-me)

Sumber kebenaran: PRD "PRD — Dashboard Pasien & Jadwal (Sismedika)" (claude.ai doc) + `design/screens/*.dc.html` (visual) + `tasks/DECISIONS.md` (keputusan).
Bahasa produk: Indonesia. Layar mobile 390x844.

## Aturan utama
1. **Grill dulu, bangun kemudian.** Tidak ada kode produk sebelum semua pertanyaan P0 di `tasks/DECISIONS.md` berstatus `DECIDED`.
2. **Jangan menebak aturan.** Bila aturan belum diputuskan, hentikan paket itu, tulis pertanyaan di DECISIONS.md, kembalikan ke agen interogator.
3. **Desain adalah kontrak visual.** Cocokkan tiap layar dengan file .dc.html (lebar 390px, token di bawah). Jangan ubah file di `design/`; ajukan perubahan desain ke pemilik desain.
4. **Izin ditegakkan di server**, bukan hanya disembunyikan di UI.
5. **AI tidak mendiagnosis dan tidak memberi dosis.** Selalu sertakan sumber dan disclaimer + 119.
6. Setiap paket selesai hanya bila kriteria "Selesai bila" di `tasks/BACKLOG.md` terbukti (uji, bukan klaim).

## Peran agen
| Agen | Tugas | Tidak boleh |
| --- | --- | --- |
| interogator | Menginterogasi pemilik produk sampai Q-P0 terjawab; menjaga DECISIONS.md | Menulis kode |
| arsitek | Stack, skema data, kontrak API, struktur repo | Memutuskan aturan bisnis sendiri |
| antarmuka | Token, komponen, 19 layar dari .dc.html | Menambah layar tanpa desain |
| backend | Auth Google, lingkaran, anggota, izin | Melewati pengecekan izin |
| jadwal-notifikasi | Jadwal, log dosis, push, eskalasi, stok | Eskalasi di perangkat saja |
| onboarding-akses | K1–K6, A1–A5, kode undangan, persetujuan | Memberi akses sebelum disetujui |
| rekam-ai | Riwayat, dokumen, asisten AI | Menyimpan hasil pindai otomatis |
| qa | Kasus uji dari kriteria, eksekusi, lapor bug ke BugBoard | Menutup bug tanpa bukti |
| privasi-keamanan | Tinjauan data kesehatan, izin, enkripsi | — |

## Token desain
Font Plus Jakarta Sans 400/500/600/700. Primer #3F6B55 (hover #2C4D3D). Latar #F6F4EE; kartu #FFFFFF garis #E4E1D8. Teks #1F2A24, sekunder #5F6962. Bahaya #B42318 / latar #FDECEA. Stok #8A4215 / latar #FBEBDD. Info #2F5D8A / latar #E5EEF7. Target sentuh min 44px, tab bawah 84px, kontras teks 4.5:1.

## Alur kerja
Gelombang 0 grill → 1 fondasi → 2 inti harian → 3 masuk & akses → 4 rekam & AI → 5 kualitas. Detail paket: `tasks/BACKLOG.md`.
