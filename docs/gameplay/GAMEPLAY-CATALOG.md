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
| Oasis Bahasa Arab | `arabic` | ✅ Game sungguhan, ekspedisi (72 kartu) + Pasar Kata Arab | Draft, BELUM disahkan akademik | `pulau-arabic.glb` + fallback `04_oasis_bahasa_arab.webp` |
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
Fase A-B (kelas 1-4 SD): pecahan sederhana, konsep bagian-dari-keseluruhan,
perbandingan pecahan senilai.

### Game: Numeria Fraction Bridge (5 level, 3D, dapat dimainkan)
```text
Level 1  1/4  — mengenalkan konsep "satu bagian dari empat"
Level 2  3/4  — memilih beberapa bagian sekaligus
Level 3  2/6  — denominator berbeda, memperkuat generalisasi konsep
Level 4  5/8  — denominator lebih besar, melatih ketelitian
Level 5  6/8  — setara 3/4, mengajarkan penyederhanaan pecahan SECARA
                IMPLISIT melalui pengulangan visual
```

### Tujuan pembelajaran eksplisit (learning objectives)
```text
LO1: Anak dapat mengidentifikasi numerator dan denominator dari representasi
     visual (jumlah bagian dipilih vs jumlah bagian total).
LO2: Anak dapat memilih jumlah bagian yang tepat sesuai target pecahan yang
     diberikan dalam notasi a/b.
LO3: Anak mengalami (bukan dihafalkan) bahwa dua pecahan berbeda notasi
     bisa bernilai sama (6/8 = 3/4) melalui pengalaman bermain berulang.
```

### Juice Patch 10
Balok jembatan "melompat" ringan (scale + posisi Y) saat jawaban benar,
confetti di scene 3D dan di layar ringkasan, kartu feedback punch singkat.

---

## 2. Benteng Digital — Aman dan Bijak Online (mekanik SELESAI)

### Game: Cyber Safety Sorter
Pemain menilai kartu situasi online sebagai "Aman" atau "Tidak aman", lalu
menerima penjelasan. Tanpa visual menakutkan, tanpa representasi predator —
umpan balik menjelaskan, bukan menghakimi.

```text
LEVEL 1-5 (draft): permintaan kata sandi mencurigakan, tautan asing vs
resmi (simulasi visual, tidak ada link sungguhan yang diklik), ajakan
bertemu orang asing dari internet, membedakan info benar vs hoaks
sederhana, level gabungan.
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

### Juice Patch 10
Confetti di layar ringkasan ekspedisi (medali trofi mendapat animasi
"portal-win"). Sisanya (jalur jejak, ransel, sistem bintang) sudah menjadi
bentuk juice tersendiri sejak Patch 09 — tidak diubah.

---

## 4. Taman Al-Qur'an — Tilawah dan Tajwid (`QuranGame.tsx`)

### Game: Hijaiyah Drag-Line Matching (Patch 30)
- Mecanik drag-and-drop mencocokkan kartu gambar ke kartu kata hijaiyah.
- Dilengkapi animasi tutorial demo otomatis untuk huruf baru, highlight target drop zone real-time, dan Web Speech API TTS Bahasa Arab.

---

## 5. Kampung Adab — Karakter dan Kebiasaan Baik (`AdabGame.tsx`)

### Game: Branching Story "Kisah Pilihan" (Patch 26)
- 8 bab skenario adab sehari-hari dengan 24 pilihan tindakan bercabang.
- Penilaian 1-3 bintang tanpa vonis salah/hukuman, serta koleksi "Buku Kisah" untuk replay value.

---

## 6. English Harbor — Listen, Read, Speak (`EnglishGame.tsx`)

### Game: 3D Letter-Builder Puzzle & 12 Island Harbor (Patch 31)
- Scene Three.js kubus huruf mengambang 3D dengan `OrbitControls`.
- Menyusun ejaan kata target, animasi kapal berlayar ⛵, peti harta karun, dan Web Speech API TTS Bahasa Inggris.

---

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
