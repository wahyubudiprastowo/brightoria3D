## 2026-10-23 - Iqra Jilid 2-6 lengkap

- Menyalin dataset sumber Iqra' Jilid 2-6 yang diminta pengguna dari repository `Qur-an-Learning-Adventure-Platform` ke modul Quran Brightoria.
- Menambahkan lima file data baru dengan 30 halaman per jilid dan menghubungkannya ke `QuranReaders.tsx`.
- Reader kini menyediakan tab Jilid 1-6, 182 halaman total, progres localStorage per jilid, perpindahan lintas jilid, dan audio TTS saat bacaan diketuk.
- Account gate tetap berlaku hanya untuk Jilid 2-6: tamu dapat mencoba Jilid 1, sedangkan login/daftar gratis membuka 150 halaman lanjutan tanpa Premium checkout.
- Kartu jalur Quran kini menyatakan jumlah halaman faktual dan langsung membuka reader, bukan detail placeholder dua lesson.
- Memperbaiki reset CSS elemen `header` di dalam halaman Iqra agar aturan header global tidak merusak layout mobile.
- Diverifikasi melalui typecheck, production build, inspeksi browser desktop, dan emulasi mobile 390x844. Semua materi tetap draft akademik.

## 2026-10-19 - Portal Admin lokal Brightoria

- Menambahkan `src/admin/AdminPortal.tsx` sebagai dashboard fullscreen yang mengikuti tampilan operasional Brightoria tanpa menyalin data pengguna, pembayaran, atau peringatan palsu dari repository referensi.
- Menambahkan `src/admin/adminData.ts` untuk mengagregasi identitas perangkat, evidence enam dunia, mastery, percobaan, entitlement Premium, intent checkout, dan ringkasan localStorage yang memang tersedia.
- Portal dapat dibuka melalui tombol `Portal Admin` di Ruang Orang Tua, deep link `#/admin`, dan pintasan `Ctrl+Shift+A`.
- Sembilan tab tersedia mengikuti struktur portal referensi: Pendaftaran & Pengguna, Tracking Pembayaran, Deteksi Transfer Palsu, Keamanan Akun, Subscription Aktif, Afiliasi, Audit Log, Pengumuman, dan Laporan.
- Menambahkan grafik evidence enam dunia, pencarian profil lokal, katalog paket, audit timestamp evidence, serta penyimpanan draft pengumuman lokal. Admin juga dapat memperbarui snapshot, menyalin tautan, mengunci sesi, dan mengekspor laporan JSON yang tidak memuat verification ID penuh.
- Gerbang sesi berbasis `sessionStorage` hanya berfungsi sebagai privasi layar lokal dan secara eksplisit bukan autentikasi produksi. Assign Premium manual, data lintas perangkat, payment verification, fraud detection, dan password management tetap dinonaktifkan sampai backend terautentikasi tersedia.
- Tidak ada perubahan pada peta 3D, evidence/mastery/XP game, dependency, atau kebijakan tanpa musik latar. Seluruh materi kurikulum tetap draft.

## 2026-10-19 - Premium gate dan pilihan paket

- Mengunci materi Premium di Taman Al-Qur'an, Oasis Bahasa Arab, dan Kampung Adab untuk akun tanpa entitlement aktif.
- Menambahkan modal upgrade responsif dengan empat pilihan paket: 1 bulan Rp49.000, 3 bulan Rp99.000, 1 tahun Rp299.000, dan lifetime Rp1.199.000.
- Checkout hanya dibuka melalui `VITE_PREMIUM_CHECKOUT_URL`; tanpa URL resmi atau entitlement terverifikasi, akses tidak berubah.
- Menambahkan penyimpanan intent checkout dan pemeriksaan ulang akses tanpa payment/auth palsu.
- Tidak ada perubahan evidence, mastery, XP, musik latar, atau status draft materi.

## 2026-10-16 - Arena Hafalan Qur'an

- Menambahkan `QuranMemoryArena.tsx` sebagai mode permainan baru di Pulau Al-Qur'an.
- Mengadaptasi pola mekanik dari repository `Qur-an-Learning-Adventure-Platform` menjadi empat tantangan Brightoria: sambung ayat, susun tiga ayat, tebak surat, dan pilih ayat dari audio.
- Menghubungkan permainan ke dataset Juz 30 dan 30 MP3 murattal lokal yang sudah ada, dengan lima ronde per sesi dan fallback pesan audio yang aman.
- Menambahkan skor, streak, ketepatan, XP penyelesaian, SFX dekoratif, serta progres lokal terpisah di `brightoria.quran.memoryArena.v1` tanpa mengubah evidence Hijaiyah.
- Konten tetap draft sampai divalidasi tim tahsin/tahfidz Bright Academy.

## 2026-10-15 - Audio surat pendek dibuat lokal dan selalu tersedia

- Memperbaiki Taman Pixel Juz 30 yang sebelumnya hanya menampilkan tombol `Dengarkan` jika perangkat memiliki voice Arab untuk Web Speech API.
- Menambahkan 30 MP3 murattal lokal Misyari Rasyid Al-Afasi untuk seluruh ayat dari tujuh surat Taman Pixel: Al-Asr, Al-Fil, Quraisy, Al-Kausar, Al-Ikhlas, Al-Falaq, dan An-Nas.
- Menambahkan kontrol audio per ayat dan pemutaran satu surat berurutan, termasuk state sedang diputar, tombol berhenti, pesan error in-game, dan cleanup audio saat panel ditutup.
- `quranReaderData.ts` memprioritaskan audio lokal untuk tujuh surat tersebut; surat Juz 30 lain tetap menggunakan URL audio qari dari data repository referensi.
- Tidak ada dependency baru dan tidak ada musik latar.

## 2026-10-15 - Iqra dan Mushaf Juz 30 lengkap dengan audio

- Menginspeksi ulang data `iqraBook1Data.ts`, `verifiedJuz30AndCore.json`, dan pola audio qari pada repository `Qur-an-Learning-Adventure-Platform`.
- Menambahkan `QuranReaders.tsx` untuk pembaca Iqra' Jilid 1 lengkap 32 halaman dan Mushaf Juz 30 lengkap 37 surat.
- Menambahkan data ayat lokal `public/assets/data/juz30.json`; pembaca menampilkan semua ayat, transliterasi, dan arti Indonesia tanpa mengandalkan ringkasan kartu.
- Menambahkan audio murattal Misyari Rasyid Al-Afasi per ayat dan mode putar surat berurutan. Audio dihentikan saat berganti surat, kembali ke peta, atau komponen dilepas.
- Menambahkan pencarian surat serta progres lokal per halaman/surat tanpa mengubah evidence, mastery, atau XP game Hijaiyah.
- Tidak ada dependency baru dan tidak ada musik latar. Audio qari membutuhkan koneksi internet.
- Seluruh materi dan pembagian akses tetap draft hingga disahkan tim tahsin/tahfidz Bright Academy.

## 2026-10-14 - Materi Qur'an Learning Adventure dibuat interaktif

- Mengubah kartu `Jalur Materi Qur'an`, `Mufrodat Qur'an`, dan `Materi Adab Qur'ani` dari panel statis menjadi tombol yang bisa dibuka.
- Menambahkan detail lesson per materi: contoh Arab, transliterasi, makna, catatan guru, dan latihan/praktik anak.
- Memperbaiki data Arab pada `quranAdventureContent.ts` agar memakai Unicode Arab yang benar, bukan teks mojibake.
- Pada versi tanggal ini kartu premium dibuka sebagai preview; perilaku tersebut kemudian diganti oleh Premium gate pada 2026-10-19.
- Tidak ada perubahan evidence/mastery/XP, tidak ada dependency baru, dan tidak ada musik latar.
- Seluruh materi hasil adaptasi tetap draft dan perlu validasi akademik Bright Academy sebelum rilis resmi.

## 2026-10-14 - Integrasi Materi Qur'an Learning Adventure

- Menginspeksi repository referensi `wahyubudiprastowo/Qur-an-Learning-Adventure-Platform` dan memilih materi yang cocok untuk struktur pulau Brightoria.
- Menambahkan modul `src/game/quran/quranAdventureContent.ts` sebagai data kurasi lintas pulau dengan tier `free` dan `premium`.
- Taman Al-Qur'an mendapat panel jalur materi: Iqra' 1, Taman Juz 30 Starter, Tajwid Dasar sebagai free trial; Iqra' 2-6 dan Tilawah 30 Juz sebagai premium.
- Oasis Bahasa Arab mendapat panel `Mufrodat Qur'an`: kosakata surat pendek sebagai free trial dan kamus Qur'an lanjutan sebagai premium.
- Kampung Adab mendapat panel `Materi Adab Qur'ani`: praktik harian santri sebagai free trial dan hikmah surat/asbabun nuzul sebagai premium.
- Tidak ada perubahan evidence/mastery/XP, tidak ada dependency baru, dan tidak ada musik latar.
- Seluruh materi hasil adaptasi tetap draft dan perlu validasi akademik Bright Academy sebelum rilis resmi.

## 2026-10-05 - Pembagian Materi Matematika per Game

- Membaca PDF rujukan `Matematika I` sampai `Matematika VI`; `Matematika IX` tidak dipakai untuk game SD karena materinya SMP.
- Memisahkan generator soal matematika menjadi profil `flight12` untuk Penerbangan Ilmu dan `frog34` untuk Lompat Katak.
- Penerbangan Ilmu kini fokus kelas 1-2: membilang, tambah-kurang awal, nilai tempat dasar, pola, bentuk, pengukuran, pecahan setengah/seperempat, dan data sederhana.
- Lompat Katak kini fokus kelas 3-4: bilangan lebih besar, tambah-kurang, kali-bagi, nilai tempat ribuan, pengukuran, pecahan dasar, pola, luas, dan data.
- Jembatan Numeria dikunci untuk kelas 5-6: KPK/FPB, pecahan senilai, desimal, rasio, persen, keliling/luas, sudut, data, kubus-balok, dan peluang dasar.
- Konten matematika tetap draft dan perlu validasi akademik Bright Academy sebelum rilis resmi.

## 2026-10-05 - Oasis AI Sambung Surat Pendek

- Menambahkan mode lanjut `Level 2: Sambung Surat` ke mini-game kamera `AI Angka Arab & Surat`.
- Mode baru memakai mekanik cubit tangan yang sama untuk mengambil kartu potongan surat pendek dan melepasnya ke urutan target yang benar.
- UI game dibuat adaptif untuk jumlah target per mode, termasuk progress, hasil akhir, label target, dan instruksi status.
- Konten potongan surat pendek masih draft dan perlu validasi guru Qur'an/Bahasa Arab Bright Academy sebelum rilis resmi.

## 2026-09-21 ? Peta foreground adventure

- Model `Meshy_AI_Starbound_Wanderer_0921084739_texture.glb` dan `Meshy_AI_White_Cat_with_Red_Sc_0921091412_texture.glb` dari Downloads disalin ke `assets-source/models/`.
- Pipeline optimasi menghasilkan `public/assets/models/starbound-wanderer.glb` 298,9 KB dari 13,40 MB dan `public/assets/models/white-cat-red-scarf.glb` 191,4 KB dari 11,11 MB.
- `src/components/world3d/LocalModel.tsx` menambahkan URL model `wanderer` dan `cat`.
- `src/components/world3d/MapDecor.tsx` menambahkan vignette foreground kecil: platform batu/rumput prosedural, karakter petualang, dan kucing pendamping. Penempatan dibuat rendah di foreground kiri-depan agar tidak menutup pulau, label, atau panel detail.
- PNG mockup/asset sheet yang dikirim user dipakai sebagai arahan komposisi visual. Tidak ditempel langsung ke runtime karena berupa layout/sheet gabungan, bukan aset terpisah yang siap ditempatkan.
- Peta tetap R3F/Three.js interaktif dengan `OrbitControls`; posisi cincin dunia di `worlds.ts` tidak disentuh.

## 2026-09-21 ? Awan 3D peta dunia

- Model `Meshy_AI_Soft_Sky_Drifts_0921072026_texture.glb` dan `Meshy_AI_White_Cloud_0921072246_texture.glb` dari Downloads disalin ke `assets-source/models/`.
- Pipeline optimasi menghasilkan `public/assets/models/cloud-soft-drifts.glb` 98,1 KB dari 4,79 MB dan `public/assets/models/cloud-white.glb` 93,0 KB dari 2,24 MB, masing-masing 9.000 segitiga.
- `src/components/world3d/MapDecor.tsx` memperbarui `CloudRing` agar memakai model GLB baru. Untuk mengatasi bentuk Meshy yang cenderung gepeng, setiap awan dirender sebagai cluster 2-3 layer dengan rotasi, offset, dan skala berbeda sehingga terbaca lebih bervolume saat peta diputar.
- Awan prosedural lama tetap dipakai sebagai fallback Suspense/error boundary. Peta tetap 3D interaktif dengan `OrbitControls`; posisi dunia di `worlds.ts` tidak disentuh.
- Revisi berikutnya mengganti seluruh awan aktif ke `Meshy_AI_Pastel_Cloud_Drift_0921073932_texture.glb`, dioptimalkan sebagai `cloud-pastel-drift.glb` 153,9 KB dari 9,54 MB dengan 12.000 segitiga.
- `WorldScene.tsx` tidak lagi merender `ProceduralClouds`, dan `MapDecor.tsx` tidak lagi merender `DistantPeaks`, sehingga awan lama dan bentuk segitiga transparan di dekat awan hilang dari peta.

## 2026-09-21 ? Kontrol Ekspedisi

- Arah hadap karakter Ekspedisi sekarang mengikuti arah input terakhir secara langsung, bukan menunggu velocity. Menekan `S` atau menarik joystick ke bawah membuat karakter segera balik badan.
- Kamera Ekspedisi mendapat `yawOffset`, `pitchOffset`, dan `distanceOffset` terpisah. Drag klik kanan/middle kini menggeser pandangan kiri-kanan serta atas-bawah, sementara scroll wheel mengatur jarak kamera dengan batas aman.
- Context menu browser dimatikan di area canvas Ekspedisi agar klik kanan tidak memunculkan menu "save image"; shortcut WASD/arrow/space juga dicegah dari perilaku scroll halaman.
- Tidak ada perubahan quest, reward, evidence, XP, atau interaksi peta 3D.

## 2026-09-21 ? Froggy model GLB baru

- Model `Meshy_AI_Low_Poly_Frog_0921033043_texture.glb` dari Downloads disalin ke `assets-source/models/meshy-froggy.glb`.
- `froggy.glb` dihasilkan ke `public/assets/models/froggy.glb` lewat pipeline optimasi GLB proyek: 10,41 MB menjadi 218,4 KB; 166.228 segitiga menjadi 11.998 segitiga.
- `src/game/froggy/FroggyGame.tsx` diperbarui agar katak pemain memakai GLB baru melalui `useGLTF`, dibungkus `Suspense` dan boundary lokal. Kodok prosedural lama tetap tersedia sebagai fallback loading/error.
- Transform model Froggy dihitung dari bounding box Three.js agar pijakan model selalu berada sedikit di atas daun teratai dan tidak tenggelam saat idle maupun squash/stretch lompatan.
- `scripts/optimize-models.mjs`, `docs/technical/glb-optimization.json`, dan `docs/technical/GLB-ASSETS.md` diperbarui untuk memasukkan aset Froggy.
- Tidak ada perubahan kontrak soal, evidence, XP, mastery, musik, atau interaksi 3D peta.
- Revisi berikutnya mengganti source Froggy ke `Meshy_AI_Low_Poly_Frog_0921095558_texture.glb`. Runtime `public/assets/models/froggy.glb` kini 249,4 KB dari 9,40 MB, 115.060 segitiga menjadi 12.000 segitiga.
- Revisi lanjutan memisahkan pose: `froggy.glb` kembali memakai pose lama untuk idle/berdiri di daun, sementara pose berdiri terbaru dipindah ke `froggy-jump.glb` dan hanya dipakai saat `jumping === true`.

## 2026-09-20 ? Quran 2 dan pulau Arabic GLB

- `meshy-pulauquran2.glb` dari Downloads disalin ke `assets-source/models/meshy-pulauquran2.glb`.
- `pulau-quran.glb` kini berasal dari sumber Quran baru dan teroptimasi menjadi 513,6 KB dari 24,12 MB.
- Model Quran lama (`meshy-pulauquran.glb`) tidak dibuang; hasil optimasinya kini menjadi `pulau-arabic.glb` 602,5 KB untuk Oasis Bahasa Arab.
- `WorldScene.tsx`, `LocalModel.tsx`, dan `ArabicGame.tsx` diperbarui agar Quran, Arabic, dan Digital memakai GLB lokal dengan fallback gambar lama.
- Laporan optimasi, dokumentasi source-of-truth, dan ringkasan status GLB diperbarui.

## 2026-09-20 ? Startup browser dan integrasi GLB

- Diagnosis: port 5173 ditempati proxy VS Code yang timeout; Vite default ke 5174.
- Enam GLB unik dioptimalkan dari 214,81 MB menjadi 2,57 MB; sumber asli dipertahankan.
- Integrasi Quran/Arabic/Digital pada peta dan game; menara Latihan; pesawat peta/SkyRun; Bri ringan.
- Boundary dan Suspense per model, boundary luar Canvas game/CharacterPicker;
  fallback menjaga kontrol DOM tersedia ketika WebGL gagal.
- Rotasi/zoom, posisi cincin, evidence/mastery/XP dan kebijakan tanpa musik dipertahankan.
- Validasi: typecheck/build, smoke browser, fallback model/WebGL, dan copy Android lulus.
- Seluruh materi AI tetap draft. Rincian dan pipeline: `docs/technical/GLB-ASSETS.md`.

# Patch 10 — Rekonsiliasi Dokumentasi + Juice Kit

## Konteks masuk

User meminta dua hal: (1) rekonsiliasi dokumentasi karena dicurigai sudah
tidak sinkron dengan kode, dan (2) gameplay yang lebih menarik memakai
prinsip dari skill referensi `threejs-game-skills` (paket skill Codex/
Claude Code untuk polish gameplay/grafis/UI/audio/QA — bukan library kode,
sehingga prinsipnya diterapkan manual: game-feel/"juice" polish).

## Temuan audit (sebelum perbaikan)

1. **Drift dokumentasi besar**: `AGENTS.md` dan `GAMEPLAY-CATALOG.md` versi
   Patch 09 menyatakan hanya 2 dari 6 dunia punya game sungguhan. Audit
   langsung terhadap `src/App.tsx` dan folder `src/game/*/` membuktikan
   SEMUA 6 dunia sudah punya game sungguhan sejak Patch 07 — Quran, Adab,
   dan English lewat mesin kuis bersama `src/game/quiz/QuizGame.tsx` yang
   ternyata belum pernah didokumentasikan dengan benar statusnya.
2. **Regresi posisi peta 3D**: `src/data/worlds.ts` ternyata sudah kembali
   ke variasi Z hampir nol (pola pra-Patch-06), padahal Patch 06 pernah
   memperbaikinya jadi formasi cincin (Z -1.9 s.d. +1.9) tepat untuk
   mengatasi keluhan "peta belum terasa 3D". Regresi ini kemungkinan
   terjadi saat `WorldScene.tsx` ditulis ulang di Patch 08 untuk integrasi
   aset peta, dan `worlds.ts` ikut tertimpa versi lama.
3. Folder `patches/patches-maps/` ditemukan sebagai duplikat/snapshot lama
   Patch 06 yang membingungkan (berisi versi `WorldScene.tsx`/`worlds.ts`
   yang berbeda dari yang berjalan di `src/`).

## Perbaikan

### A. Regresi peta diperbaiki
`src/data/worlds.ts` dikembalikan ke formasi cincin Patch 06, dengan
komentar penjelasan langsung di file (menjelaskan riwayat regresi) supaya
tidak tertimpa lagi secara tidak sengaja di masa depan. Perbaikan aset map
lokal dari Patch 08 di `WorldScene.tsx` TIDAK disentuh/tidak hilang.

### B. Dokumentasi disinkronkan ulang
`AGENTS.md`, `docs/agent-context/PROJECT-MEMORY.md`,
`docs/gameplay/GAMEPLAY-CATALOG.md`, `docs/product/NEXT-STEPS.md` ditulis
ulang untuk mencerminkan status kode aktual: enam dari enam dunia punya
game sungguhan, kurikulum tetap berstatus draft menunggu pengesahan
akademik, dan rekomendasi pembersihan repo (folder duplikat, file CSS sisa,
dokumen arsitektur ganda) dicatat untuk dieksekusi.

### C. Juice Kit — polish gameplay (game-feel)
Modul baru `src/game/juice.tsx` menyediakan primitif reusable:
- `Confetti` — partikel canvas 2D ringan (tanpa library baru), meledak
  saat jawaban benar pertama kali dan saat dunia/misi selesai. Menghormati
  `prefers-reduced-motion`.
- `useStreak` + `StreakBadge` — penghitung jawaban benar beruntun DALAM
  SATU SESI (motivasional, tidak disimpan lintas sesi, tidak menambah
  kontrak evidence baru).
- `useCountUp` — angka XP melompat naik (tween ease-out) alih-alih
  instan (disiapkan untuk pemakaian lanjutan di HUD XP).
- `usePunch` — className animasi "punch" (scale bounce ~0.3 detik) yang
  otomatis hilang sendiri, dipicu oleh perubahan state (mis. hasil benar/
  salah).

Dipasang di:
- `src/game/quiz/QuizGame.tsx` (mencakup Quran, Adab, English sekaligus
  karena satu mesin dipakai bersama)
- `src/game/numeria/NumeriaGame.tsx` (confetti di scene 3D + layar
  ringkasan, balok jembatan "melompat" ringan saat benar)
- `src/game/digital/DigitalGame.tsx` (streak, confetti, punch feedback)
- `src/game/arabic/ArabicGame.tsx` (confetti di layar ringkasan ekspedisi)

Seluruh efek **murni dekoratif** — dihapus total pun evidence/mastery/XP
setiap game tetap identik. Tidak ada dependency baru, tidak ada musik
latar, tidak ada perubahan pada kontrak evidence.

## Delivery

Patch ini menyentuh 7 file kode (`worlds.ts`, `juice.tsx` baru, `QuizGame.tsx`,
`NumeriaGame.tsx`, `DigitalGame.tsx`, `ArabicGame.tsx`, `styles.css`) dan
seluruh dokumen source-of-truth. Tidak ada perubahan `package.json` —
tanpa dependency baru sama sekali.

---

# Patch 08 — Map assets terintegrasi

`WorldScene.tsx` mengintegrasikan aset lokal baru dari `public/assets/map/`:
background sky, tiga variasi connector route, dan waypoint marker. Peta tetap
scene Three.js interaktif dengan `OrbitControls`, klik pulau, serta fallback
non-3D melalui `WorldSceneErrorBoundary`/`FallbackGrid`. Tidak ada dependency
baru dan tidak ada `<Environment>`.

---

# Patch 09 — Safari Kata Arab

Oasis Bahasa Arab kini memiliki game kuis kosakata bergambar berbasis mesin
`QuizGame` bersama. Materi mengikuti lembar user untuk hewan, buah,
perlengkapan sekolah, ruang kelas, pakaian, dan benda rumah. Sesi memilih
8 kartu dari koleksi 72 kartu dan mendahulukan kata yang belum selesai;
mastery tetap dihitung atas seluruh koleksi. Konten Arab, harakat, transliterasi, dan
terjemahan masih DRAFT sampai review serta pengesahan tim akademik Bright
Academy. Tidak ada dependency baru atau audio eksternal.

Patch 10 mengubah presentasi dari layar quiz generik menjadi mini-game
ekspedisi: intro misi, jalur jejak 8 node, area oasis CSS, objek yang bisa
dipilih dan dikumpulkan, petunjuk, feedback, ransel kata, serta ringkasan
ekspedisi. Implementasi berada di `src/game/arabic/ArabicGame.tsx` dan
`src/styles.css`; tidak mengubah evidence, mastery, atau aturan XP. Konten
Arab tetap DRAFT sampai review serta pengesahan tim akademik Bright Academy.

---

# Changelog Lengkap — Brightoria (s.d. Patch 05)

> Untuk riwayat Patch 00-03c detail, lihat dokumen versi Patch 03c/04.
> Ringkasan ada di bagian bawah. Fokus dokumen ini: Patch 04 dan 05.

## Patch 05 — Koreksi Peta 3D + Kurikulum Konkret

### Konteks masuk

Setelah Patch 04 terpasang, user melaporkan dua hal:
1. Aset pulau sekarang **datar dan tidak bisa diputar** — kualitas visual
   memang naik, tapi interaksi 3D (drag rotate, scroll zoom) yang disukai
   sejak Patch 01-03c hilang. User menyatakan ini "tidak menarik".
2. Dokumentasi gameplay (`GAMEPLAY-CATALOG.md`) masih terlalu generik,
   belum benar-benar terikat konten pembelajaran Bright Academy yang
   konkret.

### Perbaikan #1: peta kembali 3D interaktif, teknik "billboard"

`WorldScene.tsx` ditulis ulang total lagi (ketiga kalinya dalam tiga patch
berturut-turut — lihat catatan evaluasi di bagian bawah):
- Kembali memakai `<Canvas>` Three.js/React Three Fiber.
- Enam gambar isometrik premium (bukan lagi geometri box/cone Patch 01-03c,
  bukan lagi `<img>` DOM datar Patch 04) ditempel sebagai **tekstur** pada
  plane 3D yang dibungkus `<Billboard>` dari drei — otomatis menghadap
  kamera dari sudut mana pun.
- `OrbitControls` dikembalikan dengan constraint sama seperti Patch 02/03
  (`enablePan=false`, `minDistance`/`maxDistance`, `minPolarAngle`/
  `maxPolarAngle`) — memberi rasa "diputar-putar" yang diminta user.
- Ditambahkan efek glow (hover/aktif) dan ring (dipilih) memakai tekstur
  asli yang disediakan user, plus animasi mengambang halus dan awan
  melayang di latar untuk kedalaman visual.
- Ditambahkan `WorldSceneErrorBoundary` — jika WebGL gagal render di
  perangkat tertentu, otomatis fallback ke grid 2D sederhana
  (`FallbackGrid`), mempertahankan kebijakan proyek "setiap Canvas 3D
  wajib punya jaring pengaman non-3D" yang sudah ada sejak Numeria (Patch
  03b).

### Perbaikan #2: kurikulum konkret per dunia

`GAMEPLAY-CATALOG.md` ditulis ulang dengan peta kurikulum spesifik per
dunia (jenjang tajwid untuk Al-Qur'an, tema adab konkret, level bahasa
Arab/Inggris berjenjang, level literasi digital) — masing-masing disertai
tujuan pembelajaran eksplisit dan konsep mekanik game yang diusulkan.

**Batasan jujur yang wajib dipertahankan:** kurikulum ini adalah draft
disusun dari struktur umum pembelajaran homeschooling Islam, BUKAN salinan
dokumen resmi internal Bright Academy (tidak ada akses ke dokumen tersebut
dari sistem AI). Setiap agent berikutnya wajib mempertahankan disclaimer
ini di dokumen dan tidak mengklaim draft sebagai final/resmi.

### Evaluasi diri: tiga kali ubah pendekatan peta dalam tiga patch berturut

```text
Patch 03c: peta Three.js geometri sederhana (base sebelum masalah muncul)
Patch 04 : diubah ke DOM/CSS murni — TERLALU JAUH mengorbankan interaksi
Patch 05 : dikembalikan ke Three.js dengan billboard — kombinasi yang benar
```

Pelajaran untuk seluruh agent yang bekerja di proyek ini ke depan: ketika
menyelesaikan masalah reliabilitas (seperti risiko WebGL gagal), **jangan
langsung memilih solusi paling ekstrem (hapus fitur)**. Solusi yang lebih
baik biasanya kombinasi: pertahankan fitur inti (3D interaktif) SAMBIL
menambah jaring pengaman (error boundary + fallback), seperti yang sudah
terbukti berhasil di `NumeriaGame.tsx` sejak Patch 03b dan sekarang
diterapkan juga di `WorldScene.tsx` pada Patch 05.

---

## Patch 04 — Peta Aset Visual Asli + Perbaikan Reliabilitas (lihat catatan koreksi di atas)

Ringkasan singkat (detail lengkap ada di histori sebelumnya): mengganti
peta dari Three.js geometri sederhana ke DOM/CSS dengan 6 ilustrasi
isometrik asli, menambah `AppErrorBoundary`, menjadikan `styles.css` file
tunggal (menghentikan proses manual tempel CSS tiga patch sebelumnya).
**Bagian mengganti peta ke DOM/CSS dikoreksi di Patch 05** — bagian lain
(`AppErrorBoundary`, `styles.css` file tunggal) TETAP DIPERTAHANKAN karena
terbukti bermanfaat dan tidak mengorbankan fitur apa pun.

## Ringkasan Patch 00-03c

- **Patch 00**: Diskusi produk — nama Brightoria, tiga jalur, enam dunia,
  prinsip tanpa musik.
- **Patch 01**: Fondasi 3D dasar, enam pulau geometris sederhana.
- **Patch 02**: Landmark prosedural, parent dashboard, dokumentasi agent
  pertama, berbagai masalah instalasi npm Windows diselesaikan.
- **Patch 03**: Numeria Fraction Bridge — mini-game penuh pertama.
- **Patch 03b**: Hotfix — hapus `<Environment>` drei penyebab macet blank,
  tambah `ErrorBoundaryCanvas`.
- **Patch 03c**: Badge "Game tersedia" vs "Segera hadir", dokumentasi
  master lengkap pertama kali dibuat.
## 2026-10-20 - Login pemain, admin server, dan registry aktivitas

- Menambahkan `src/auth/PlayerAuthGate.tsx` dan `src/auth/playerSession.ts` sebagai gerbang akun sebelum peta 3D.
- Menambahkan API Vercel di `api/auth/*`, `api/admin/*`, dan `api/activity.js` dengan helper HMAC, scrypt, validasi same-origin, dan cookie HttpOnly.
- Menambahkan private Vercel Blob `brightoria-users` dengan satu record per email dan optimistic concurrency untuk aktivitas pulau.
- Portal admin sekarang membutuhkan username/password yang diverifikasi hanya pada server, lalu membaca registry pengguna tanpa mengekspos hash password.
- Dashboard Pendaftaran & Pengguna menampilkan akun lintas perangkat dan pulau yang dicoba; grafik mastery tetap jujur berasal dari evidence perangkat aktif.
- Menambahkan jalur Google Identity yang siap diaktifkan setelah OAuth Client ID resmi tersedia.
- Modul UI mandiri baru dimuat setelah sesi pemain sah agar Character Picker dan tombol permainan tidak menutupi login atau portal admin.
- Validasi integrasi mencakup 401 anonim/salah, login admin 200, registrasi pemain, pemeriksaan sesi, activity write, dan pembacaan user dari admin. Record QA dihapus setelah tes.
- Tidak ada perubahan peta 3D, game, evidence/mastery/XP, musik, atau status draft kurikulum.

## 2026-10-21 - Mode Tamu dan login kontekstual

- Peta 3D dan enam game dasar dapat dicoba tanpa akun.
- Latihan dan Ekspedisi kembali dimuat untuk pengunjung tamu, sementara Character Picker, insight Orang Tua, dan Tanya Bri tetap menunggu sesi pemain.
- Iqra' Jilid 2-6 tidak lagi menjadi materi Premium; aksesnya gratis setelah pemain Masuk/Daftar dan tidak diarahkan ke checkout.
- Login/daftar dipindahkan ke modal kontekstual dari header, Profil, Ruang Orang Tua, dan alur Premium.
- Pengunjung tamu mendapat banner status yang ringkas; pemain terdaftar tetap memperoleh pencatatan aktivitas lintas perangkat.
- Portal admin tetap memakai login username/password terpisah yang diverifikasi server dan tidak dapat diakses melalui sesi tamu.
- Setiap pembukaan portal admin kini mengakhiri cookie sesi lama terlebih dahulu, sehingga formulir username/password selalu muncul sebelum dashboard.
- Form admin mendapat kontrol mata untuk memeriksa password. Untuk autentikasi lokal, `npm run dev:full` menjalankan Vercel Dev agar endpoint `/api` ikut aktif; `dev.bat` juga memakai mode lengkap ini.
- Portal admin direkonsiliasi dengan fitur Brightoria yang benar-benar tersedia. Delapan tab aktif kini mencakup Ringkasan, Pengguna, Aktivitas Pulau, Materi & Game, Akses & Premium, Status Sistem, Draft Info, dan Laporan.
- Tab transaksi, deteksi transfer palsu, afiliasi, dan audit semu dihapus karena belum memiliki sumber data. Portal membedakan registry server dari mastery/XP/Premium perangkat aktif dan tidak lagi menandai seluruh akun sebagai Free.
