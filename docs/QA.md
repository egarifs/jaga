# QA (WP7)
Otomatis: `cd backend && npm test`; `cd app && flutter test`.
| Kasus | Bukti |
| --- | --- |
| Metformin 6 @2/hari → habis 3 hari | backend/test/domain.test.ts |
| Kode valid → pending, tanpa akses sampai disetujui | idem |
| Kepala tak bisa keluar tanpa transfer | idem |
| Eskalasi: perawat bertugas, kosong → Wakil; tunda butuh alasan | idem |
| AI tolak dosis/diagnosis, "data tidak ditemukan", ada sumber | idem |
| 19 layar terdaftar | app/test/widget_test.dart |
Manual (belum): push & eskalasi di Android/iOS nyata, kecocokan 390px per layar, alur K1→K6 & A1→A5.
