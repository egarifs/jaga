// 19 screens from design/screens/*.dc.html. Titles only; bodies pending design review (Q13).
const screens = <(String route, String title, String fr)>[
  ('/welcome', 'Pengenalan', 'FR-01'), ('/login', 'Login Google', 'FR-02'),
  ('/peran', 'Mulai merawat / gabung', 'FR-03'), ('/gabung', 'Gabung ke lingkaran', 'FR-04'),
  ('/anggota', 'Beranda perawat', 'FR-05'), ('/k1', 'Siapa yang dirawat', 'FR-10'),
  ('/k2', 'Ajak keluarga', 'FR-11'), ('/k3', 'Obat pertama', 'FR-12'),
  ('/k4', 'Tim lingkaran', 'FR-13'), ('/k5', 'Atur peran & akses', 'FR-14'),
  ('/k6', 'Notifikasi & selesai', 'FR-15'), ('/main', 'Beranda', 'FR-20–22'),
  ('/pasien', 'Profil anggota', 'FR-23–24'), ('/jadwal', 'Jadwal minum obat', 'FR-25'),
  ('/inventori', 'Kotak obat', 'FR-26'), ('/riwayat', 'Riwayat penyakit', 'FR-30'),
  ('/dokumen', 'Dokumen & link', 'FR-31'), ('/pengingat', 'Pengingat & tim', 'FR-32'),
  ('/chat', 'Asisten AI', 'FR-33'),
];
