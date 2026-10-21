> **Akses Premium (19 Oktober 2026):** materi bertier `premium` di Taman
> Al-Qur'an, Oasis Bahasa Arab, dan Kampung Adab tidak lagi dapat dibuka
> sebagai preview oleh akun Free. Klik kartu membuka pilihan paket 1 bulan,
> 3 bulan, 1 tahun, atau lifetime. Tanpa checkout resmi dan entitlement aktif,
> detail materi tetap terkunci. Gate ini tidak mengubah status draft konten.

> **Checkpoint 20 September 2026:** status lama di bawah adalah riwayat patch, bukan
> inventaris terkini. Audit kode/startup, daftar model terpasang, ukuran aktual,
> dan batas validasi tersedia di [GLB-ASSETS.md](../technical/GLB-ASSETS.md).
> Enam game mandiri aktif, ditambah Latihan/SkyRun/Froggy/Ekspedisi. Quran,
> Arabic, dan Digital memakai GLB lokal; menara membuka Latihan; pesawat dipakai peta/SkyRun.
> Quran memakai `meshy-pulauquran2.glb`; model Quran lama kini menjadi pulau Arabic.
> Semua konten kurikulum AI tetap **draft** menunggu pengesahan Bright Academy.

> **Status konten:** seluruh contoh kurikulum dan kartu kosakata yang ditulis
> AI masih **draft**. Konten baru boleh dianggap final setelah review dan
> pengesahan tim akademik Bright Academy. Ini berlaku untuk SEMUA dunia,
> termasuk yang mekanik game-nya sudah selesai secara teknis — selesai
> secara teknis TIDAK sama dengan disahkan secara akademik.

# Gameplay Catalog — Kurikulum & Status Setiap Dunia (Patch 10)

> **KOREKSI PENTING (Patch 10):** Versi dokumen ini di Patch 09 SALAH
> menyatakan 4 dari 6 dunia "BELUM DIBANGUN". Audit langsung terhadap kode
> (`src/App.tsx`, folder `src/game/*/`) membuktikan **SEMUA 6 DUNIA sudah
> punya game sungguhan** sejak Patch 07 (Quran/Adab/English lewat mesin
> kuis bersama `QuizGame.tsx`). Tabel dan deskripsi di bawah sudah
> disinkronkan ulang dengan kode aktual.

> **CATATAN KEJUJURAN YANG TETAP BERLAKU:** Peta kurikulum di dokumen ini
> adalah **draft yang disusun berdasarkan struktur umum pembelajaran
> homeschooling Islam** (target hafalan per juz, jenjang tajwid, kurikulum
> matematika SD/SMP gaya Kurikulum Merdeka, dll), BUKAN salinan dokumen
> kurikulum resmi internal Bright Academy. Sebelum konten ini dipakai untuk
> siswa sungguhan, **WAJIB direview dan disahkan oleh tim akademik Bright
> Academy**.

## Ringkasan status (diverifikasi dari kode, Patch 10)

| Dunia | id | Status mekanik | Status konten | Aset visual |
|---|---|---|---|---|
| Pulau Numeria | `math` | ✅ Game sungguhan, 3D (5 level) | Draft, selaras Kurikulum Merdeka | `03_pulau_numeria.webp` |
| Benteng Digital | `digital` | ✅ Game sungguhan, kartu situasi | Draft, prinsip literasi digital umum | `06_benteng_digital.webp` |
| Oasis Bahasa Arab | `arabic` | ✅ Game sungguhan, ekspedisi (72 kartu) + Pasar Kata Arab + AI Angka Arab & Surat | Draft, BELUM disahkan akademik | `pulau-arabic.glb` + fallback `04_oasis_bahasa_arab.webp` |
| Taman Al-Qur'an | `quran` | ✅ Game sungguhan (mesin kuis bersama) | Draft, BELUM disahkan tim tahsin/tahfidz | `pulau-quran.glb` dari `meshy-pulauquran2.glb` + fallback `01_taman_alquran.webp` |
| Kampung Adab | `adab` | ✅ Game sungguhan (mesin kuis bersama) | Draft, BELUM disahkan tim karakter | `02_kampung_adab.webp` |
| English Harbor | `english` | ✅ Game sungguhan (mesin kuis bersama) | Draft, selaras CEFR Pre-A1/A1 | `05_english_harbor.webp` |

Sejak Patch 10, keenam game juga memakai **juice kit bersama**
(`src/game/juice.tsx`): confetti saat jawaban benar/misi selesai, indikator
streak/combo per sesi, animasi count-up XP, dan animasi "punch" pada kartu
feedback. Detail teknis di `docs/technical/TECHNICAL-ARCHITECTURE.md`.

---

## 1. Pulau Numeria — Matematika dan Logika (mekanik SELESAI)

### Kompetensi yang dilatih (draft, selaraskan dengan Kurikulum Merdeka SD)
Pembagian materi matematika kini dipisah per game:
Penerbangan Ilmu untuk kelas 1-2, Lompat Katak untuk kelas 3-4, dan Jembatan
Numeria untuk kelas 5-6. Semua konten adalah ringkasan/generator internal dari
PDF rujukan pengguna dan tetap perlu validasi akademik Bright Academy.

### Game: Numeria Arithmetic Bridge (kelas 5-6, 3D, dapat dimainkan)
```text
Kelas 5: KPK/FPB, pecahan senilai, keliling, luas, sudut, dan data.
Kelas 6: pecahan-desimal, rasio, persen, kubus-balok, dan peluang dasar.
```

### Tujuan pembelajaran eksplisit (learning objectives)
```text
LO1: Anak dapat membangun jawaban numerik sebagai jumlah papan yang tepat.
LO2: Anak kelas 5 melatih KPK/FPB, pecahan senilai, keliling/luas, sudut,
     dan data dalam bentuk manipulatif.
LO3: Anak kelas 6 melatih pecahan-desimal, rasio, persen, kubus-balok, dan
     peluang dasar tanpa keluar dari batas materi SD.
```

### Juice Patch 10
Balok jembatan "melompat" ringan (scale + posisi Y) saat jawaban benar,
confetti di scene 3D dan di layar ringkasan, kartu feedback punch singkat.

### Visual Patch 2026-09-23
Arena Numeria memakai background oasis/sungai lokal, papan bertekstur dari
aset PNG user, karakter backpacker GLB, dan outpost GLB di kedua ujung
jembatan. Perubahan ini visual saja; bukti mastery, XP, dan alur jawaban
tetap sama.

---

## 2. Benteng Digital — Amanah dan Bijak Online (mekanik SELESAI)

### Game: Benteng Amanah Digital
Pemain menilai kartu situasi online sebagai "Aman" atau "Tidak aman", lalu
menerima penjelasan adab digital Islami. Tanpa visual menakutkan, tanpa
representasi predator — umpan balik menjelaskan, bukan menghakimi.

Visual gameplay memakai tema patroli benteng: gerbang, menara, packet data,
scanner prinsip, progress patroli, dan kartu aturan ringkas.

```text
LEVEL 1-10 (draft): amanah password, tabayyun sebelum menyebarkan kabar,
komentar baik, menjaga aib teman, izin orang tua untuk akses aplikasi,
waktu berkah, chat orang asing, pembelian digital dengan izin, grup tanpa
ghibah, dan konten belajar yang bermanfaat.
```

### Juice Patch 10
Streak beruntun ditampilkan di header, confetti saat jawaban benar dan
saat benteng selesai, kartu feedback punch singkat.

**Catatan validasi:** prinsip desain (tanpa menakut-nakuti, feedback
menjelaskan) sudah diterapkan di kode; daftar skenario tetap draft sampai
direview tim literasi digital/keamanan anak Bright Academy.

---

## 3. Oasis Bahasa Arab — Safari Kata Arab + Pasar Kata (mekanik SELESAI)

### Sumber materi dan status akademik

Materi memakai lembar kosakata bergambar yang diberikan user: hewan,
buah-buahan, perlengkapan sekolah, benda di ruang kelas, pakaian, dan benda
rumah. Setiap kartu menampilkan kata Arab berharakat, panduan pengucapan,
kategori, emoji lokal sebagai fallback visual, tiga pilihan arti, petunjuk,
dan penjelasan singkat.

**Status wajib: DRAFT.** Daftar kata, harakat, transliterasi, terjemahan,
urutan kesulitan, dan contoh penjelasan **belum disahkan tim akademik
Bright Academy**. Review guru Bahasa Arab diperlukan sebelum dipakai
sebagai materi resmi siswa.

### Game: "Safari Kata Arab" (72 kartu, 8 kartu per sesi, mini-game ekspedisi)
```text
Mulai ekspedisi → ikuti jalur 8 jejak di peta mini oasis (CSS) → di setiap
jejak, pilih objek yang cocok dengan kata Arab yang ditampilkan → kumpulkan
kata ke "ransel" → terima ringkasan ekspedisi di akhir sesi
```

Mesin evidence menyimpan jawaban benar, percobaan, penggunaan petunjuk, dan
mastery di localStorage. Kartu yang belum selesai diprioritaskan tiap sesi
baru. Audio native speaker dan latihan susun huruf **belum tersedia** —
jangan mengklaim fitur tersebut sudah ada.

### Mini-game tambahan: "Pasar Kata Arab"

Pemain melayani pesanan pembeli di pasar kecil. Pembeli menampilkan kata Arab
dan, jika Web Speech API tersedia, kata tersebut dapat didengarkan. Anak memilih
barang yang artinya sesuai dari rak pilihan. Jawaban benar masuk ke koleksi
ransel dan memberi XP ringan tanpa mengubah kontrak mastery utama Safari Kata.

Mini-game ini memperkuat kosakata dalam konteks penggunaan, terutama makanan,
minuman, buah, dan benda sehari-hari dari data kurikulum Arabic yang sudah ada.
Status konten tetap membutuhkan review guru Bahasa Arab sebelum dipakai sebagai
materi resmi.

### Mini-game tambahan: "AI Angka Arab & Surat"

Pemain memakai gesture cubit kamera sebagai mode utama. Level 1 mencocokkan
kartu kata bilangan Arab 1-10 ke petak angka Arab. Level 2 menjadi materi lanjut
berupa "Sambung Surat Pendek": anak mencubit kartu potongan ayat, lalu melepasnya
ke kotak urutan surat/ayat yang tepat.

Izin kamera diminta saat game mulai, dan tombol kamera tetap tersedia untuk
mencoba ulang jika browser belum memberi akses. Patch 2026-10-02 mengganti alur
izin kamera agar kegagalan akses tidak memunculkan popup native; mouse/touch
hanya fallback cadangan. Konten bilangan Arab dan potongan surat pendek tetap
draft sampai divalidasi guru Qur'an/Bahasa Arab Bright Academy.

### Materi tambahan: "Mufrodat Qur'an" (Patch 2026-10-14)

Oasis Bahasa Arab kini menampilkan jalur materi dari repository referensi
`Qur-an-Learning-Adventure-Platform`: kosakata Qur'an dasar dari surat pendek
sebagai free trial, dan kamus Qur'an lanjutan berbasis akar kata/tema sebagai
premium. Materi ditempatkan di Oasis karena fokusnya adalah bahasa/kosakata,
bukan tilawah/tajwid.

Revisi lanjutan pada tanggal yang sama membuat kartu jalur ini bisa diklik:
anak dapat membuka detail lesson berisi contoh Arab, bacaan latin, makna,
catatan guru, dan latihan kosakata. Sejak 19 Oktober 2026, detail Premium
hanya terbuka untuk entitlement aktif; akun Free melihat modal pilihan paket.

Konten ini masih berupa kurasi draft dari sumber referensi pengguna dan perlu
validasi guru Bahasa Arab/Qur'an Bright Academy sebelum rilis resmi.

### Juice Patch 10
Confetti di layar ringkasan ekspedisi (medali trofi mendapat animasi
"portal-win"). Sisanya (jalur jejak, ransel, sistem bintang) sudah menjadi
bentuk juice tersendiri sejak Patch 09 — tidak diubah.

---

## 4. Taman Al-Qur'an — Tilawah dan Tajwid (`QuranGame.tsx`)

### Game: Hijaiyah Drag-Line Matching (Patch 30)
- Mecanik drag-and-drop mencocokkan kartu gambar ke kartu kata hijaiyah.
- Dilengkapi animasi tutorial demo otomatis untuk huruf baru, highlight target drop zone real-time, dan Web Speech API TTS Bahasa Arab.

### Mode tambahan: Taman Pixel Juz 30 (Patch 2026-09-23)
- Peta eksplorasi pixel-style bertema taman islami untuk membaca surat pendek.
- Anak bergerak dengan keyboard atau tombol arah layar, mendekati papan taman, lalu membuka panel bacaan.
- Versi awal berisi 7 pos surat: Al-Ikhlas, Al-Falaq, An-Nas, Al-Kawthar, Al-Asr, Quraisy, dan Al-Fil.
- Progress bacaan disimpan terpisah dari evidence Hijaiyah supaya mastery huruf tidak berubah.
- TTS Arab dan SFX pendek tersedia; tidak ada musik latar.
- Patch 2026-10-15 mengganti TTS surat dengan rekaman murattal lokal untuk
  ketujuh surat taman. Setiap ayat memiliki tombol dengarkan dan satu surat
  dapat diputar berurutan tanpa bergantung pada voice Arab perangkat.
- Visual map memakai aset pixel PNG lokal dari user: rumah, platform rumput, air, jembatan, pagar, papan kayu, pohon, semak, ayam, dan sapi.
- Teks Arab/latin/urutan materi tetap draft sampai divalidasi tim akademik/tahsin Bright Academy.

### Mode tambahan: Arena Hafalan Qur'an (Patch 2026-10-16)

- Arena berisi empat mekanik dari pola belajar repository referensi:
  `Sambung Ayat`, `Susun Urutan Ayat`, `Tebak Nama Surat`, dan
  `Simak dan Pilih`.
- Setiap sesi terdiri dari lima ronde dengan skor, streak, ketepatan,
  umpan balik jawaban, hasil akhir, XP, dan rekor terbaik per mode yang
  tersimpan lokal di `brightoria.quran.memoryArena.v1`.
- Soal baca, susun, dan tebak mengambil data surat pendek dari dataset Juz
  30. Mode simak memakai murattal qari lokal agar tidak bergantung pada Web
  Speech API atau koneksi saat tujuh surat pilihan dimainkan.
- Efek suara hanya SFX pendek dan murattal setelah tindakan anak; tidak ada
  musik latar.
- Pemilihan materi dan mekanik hafalan masih draft dan wajib divalidasi tim
  tahsin/tahfidz Bright Academy sebelum rilis resmi.

### Materi tambahan: Jalur Iqra, Juz 30, dan Tajwid (Patch 2026-10-14)

Taman Al-Qur'an kini menampilkan panel jalur materi dari repository referensi
`Qur-an-Learning-Adventure-Platform`. Free trial berisi Iqra' Jilid 1, Taman
Juz 30 Starter, dan Tajwid Dasar. Iqra' Jilid 2-6 gratis setelah pemain
Masuk/Daftar, sedangkan Premium diarahkan untuk Tilawah 30 Juz.

Pembagian ini mengikuti fungsi pulau: Taman Al-Qur'an untuk membaca,
tilawah, tajwid, dan hafalan; Oasis Bahasa Arab untuk mufrodat/kosakata.
Revisi lanjutan pada tanggal yang sama membuat setiap kartu jalur bisa dibuka
menjadi detail materi berisi beberapa lesson, contoh Arab, transliterasi,
makna, catatan, dan latihan sederhana.

Patch 2026-10-15 mengganti dua kartu utama dari ringkasan contoh menjadi materi
yang benar-benar dapat dipelajari. `Iqra' Jilid 1` kini membuka 32 halaman
latihan lengkap dari data repository referensi. `Mushaf Juz 30 Lengkap` membuka
37 surat dari An-Naba sampai An-Nas dengan seluruh ayat, transliterasi, arti
Indonesia, audio qari per ayat, dan mode putar satu surat berurutan. Pencarian
surat dan progres lokal halaman/surat tersedia tanpa mengubah evidence Hijaiyah.
Audio qari membutuhkan internet; tidak ada musik latar.

Sejak 21 Oktober 2026, `Iqra' Jilid 2-6` memakai account gate gratis: tamu
diminta Masuk/Daftar, tetapi tidak memilih paket atau melakukan pembayaran.
`Tilawah 30 Juz` tetap dikunci oleh Premium gate. Materi free trial tetap dapat
dibuka tanpa akun dan tanpa pembelian.

Materi tetap draft hingga divalidasi tim tahsin/tahfidz Bright Academy.

---

## 5. Kampung Adab — Karakter dan Kebiasaan Baik (`AdabGame.tsx`)

### Game: Branching Story "Kisah Pilihan" (Patch 26)
- 8 bab skenario adab sehari-hari dengan 24 pilihan tindakan bercabang.
- Penilaian 1-3 bintang tanpa vonis salah/hukuman, serta koleksi "Buku Kisah" untuk replay value.

### Mode tambahan: Kampung Adab 3D Kindness Quest (Patch 2026-09-25)
- Anak menjelajahi kampung 3D dengan kontrol keyboard atau tombol arah layar, mendekati warga/lokasi, lalu menekan `Bantu` untuk membuka misi.
- Kamera mengikuti pola Ekspedisi: drag/wheel untuk lihat sekitar, tombol `Shift Lock`, dan joystick analog layar untuk perangkat sentuh.
- Lima lokasi memakai aset GLB lokal dari user: rumah/cottage, majelis ilmu, masjid, taman/sign, dan warung amanah.
- NPC 3D sementara memakai aset ibu, imam/guru, teman anak, anak berhijab, dan wanderer agar interaksi terasa seperti mini ekspedisi, bukan panel kuis.
- Materi dibuat sebagai mini quest adab sehari-hari: membantu orang tua, adab majelis ilmu, menjaga masjid, meminta maaf/berbagi, dan amanah saat membeli.
- Visual Patch 2026-10-02 membuat mode ini fullscreen, memperbesar aset existing, merapikan komposisi kampung, menambahkan plaza tengah, jalur tanah natural, cluster batu/rumput/bunga, pagar, lampu taman, dan HUD ringkas agar scene terasa lebih matang. Revisi lanjutan merenggangkan lokasi yang terlalu berdempetan, memberi offset label per area, memperbesar terrain, memakai background storybook lokal dari user, dan mengubah judul HUD menjadi papan kayu seperti mockup Kampung Adab.
- Materi PDF `200 Hadits pilihan untuk anak-anak` mulai dipakai sebagai modul `Hadits Hikmah`: batch awal 15 tema aman anak, dan 5 tema sudah ditempel ke misi 3D Kampung Adab sebagai ringkasan nilai + latihan harian.
- Patch 2026-10-14 menambahkan panel `Materi Adab Qur'ani` dari repository
  referensi `Qur-an-Learning-Adventure-Platform`: praktik harian santri sebagai
  free trial dan hikmah surat/asbabun nuzul sebagai premium.
- Revisi lanjutan pada tanggal yang sama membuat kartu `Materi Adab Qur'ani`
  bisa diklik untuk membuka lesson praktik harian/hikmah surat lengkap dengan
  bacaan Arab, makna, catatan, dan tugas kecil anak.
- Sejak 19 Oktober 2026, detail `Akhlak dari Kisah Surat` hanya dapat dibuka
  oleh entitlement Premium aktif; akun Free diarahkan ke pilihan paket.
- Progress simulator disimpan terpisah di `brightoria.adab.dailySimulator.v1` agar koleksi kisah lama tetap aman.
- Reward XP ringan diberikan saat misi lokasi pertama kali selesai; tidak ada musik latar.
- Konten skenario tetap draft dan perlu validasi tim karakter/akademik Bright Academy sebelum rilis final.

---

## 6. English Harbor — Listen, Read, Speak (`EnglishGame.tsx`)

### Game: 3D Letter-Builder Puzzle & 12 Island Harbor (Patch 31)
- Scene Three.js kubus huruf mengambang 3D dengan `OrbitControls`.
- Menyusun ejaan kata target, animasi kapal berlayar ⛵, peti harta karun, dan Web Speech API TTS Bahasa Inggris.

---

### Mode tambahan: Word Harbor Run (Patch 2026-09-23)
- Side-scroller ringan di English Harbor: anak bergerak kiri/kanan, lompat,
  lalu membuka 7 papan quiz kayu di sepanjang jalur.
- Jawaban dipilih lewat tombol pilihan ganda di papan, bukan dari collision platform,
  sehingga berjalan/menyentuh batu tidak memicu jawaban.
- Saat papan quiz terbuka, runner diparkir di posisi papan dan physics ditahan
  agar anak tidak jatuh setelah menjawab.
- Materi runner mencakup vocabulary, kategori kata, reading clue, action word,
  dan simple sentence.
- Runner memakai background, karakter, batu pijakan, dan papan quiz PNG lokal dari aset user.
- Mode ini memakai evidence English Harbor yang sama dan tidak menambah musik latar.

## Pola arsitektur wajib untuk SEMUA game baru

```text
src/game/<id-dunia>/
├── levels.ts       — array level dengan tujuan belajar eksplisit
├── evidence.ts      — tracking attempts/hints/mastery, localStorage
│                      brightoria.evidence.<id-dunia>.v1
└── <Nama>Game.tsx   — komponen utama:
                        - WAJIB dibungkus ErrorBoundaryCanvas jika 3D
                        - DILARANG memakai <Environment> drei tanpa
                          Suspense proper
                        - Reward via addXp() dari game/progress.ts
                        - Pertimbangkan pakai src/game/juice.tsx untuk
                          konsistensi game-feel dengan 6 dunia lain
```

Jika mekanik cukup sederhana (kuis pilihan ganda), pertimbangkan memakai
mesin `src/game/quiz/QuizGame.tsx` yang sudah ada alih-alih menulis ulang
dari nol — ini yang dilakukan Quran/Adab/English sejak Patch 07.
> **Akses akun (21 Oktober 2026):** peta dan game dasar tersedia dalam Mode
> Tamu. Login diminta untuk fitur lanjutan, Profil, Ruang Orang Tua, dan
> penyimpanan aktivitas lintas perangkat. Registry server hanya mencatat
> identitas akun, waktu login, dan pulau yang dibuka; kontrak evidence/mastery/XP setiap game tetap lokal dan
> tidak berubah. Seluruh materi kurikulum tetap **draft** menunggu pengesahan
> akademik Bright Academy.
