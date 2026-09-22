## 2026-09-22 - Froggy oasis arena

- Menambahkan aset GLB baru untuk game Lompat Katak: lily pad, lotus, cattail grove, dua variasi lantern oasis, dan lotus leaf sign.
- Arena Froggy kini memakai daun teratai GLB untuk platform, dekor oasis di sekitar kolam, air terjun animatif, percikan/tetes air kecil, dan kilau permukaan air.
- Menambahkan background HD oasis/desert untuk arena Froggy dari aset PNG referensi user, dipasang sebagai background layar di belakang canvas 3D transparan.
- Revisi visual: menambahkan paviliun oasis prosedural di atas air terjun, mengganti panel air terjun datar menjadi pita air animatif, mencerahkan air/fog, dan mendekatkan framing kamera agar dekor terlihat lebih HD.
- Revisi lanjutan: aset batu-air-terjun Meshy dipindahkan dari sisi kanan dan disatukan dengan waterfall animatif di sisi kiri, sehingga batu dan air terjun hidup berada pada fitur yang sama.
- Fix background: post-processing Froggy kini mempertahankan alpha canvas, sehingga background HD tidak lagi tertutup hitam setelah scene selesai load.
- Aset Meshy dioptimalkan dari total puluhan MB menjadi sekitar 1,51 MB runtime tambahan; fallback prosedural tetap ada jika model gagal dimuat.
- Gameplay, evidence, XP, dan kebijakan tanpa musik tidak berubah.

## 2026-09-22 - Ekspedisi camera lock

- Kontrol kamera bebas Ekspedisi dibuat lebih stabil: geser kiri-kanan tidak lagi mudah ikut menaik-turunkan kamera.
- Offset kamera third-person dirapikan supaya rotasi terasa lebih natural mengelilingi karakter.
- Menambahkan toggle `Kamera Lock` via tombol HUD atau tombol Shift; saat aktif, gerakan mouse langsung mengatur kamera seperti kontrol PC.
- Revisi: saat `Kamera Lock` aktif, arah karakter ikut terkunci ke arah kamera dan WASD bergerak relatif terhadap kamera; tombol `S` kembali langsung mundur tanpa membelok dulu.
- Klik kanan tetap bisa dipakai untuk drag kamera, scroll tetap untuk zoom, dan context menu browser tetap dicegah di arena.

## 2026-09-22 - Pasar Kata Arab

- Menambahkan mini-game `Pasar Kata Arab` di Oasis Bahasa Arab.
- Anak melayani pesanan pembeli: melihat/mendengar kata Arab, lalu memilih barang dengan arti yang sesuai.
- Jawaban benar menambah koleksi ransel dan XP ringan tanpa mengubah kontrak mastery utama Safari Kata.
- Tidak ada dependency baru, tidak ada musik latar, dan konten Arabic tetap perlu review akademik.

## 2026-09-21 ? Peta foreground adventure

- Model `Meshy_AI_Starbound_Wanderer_0921084739_texture.glb` dan `Meshy_AI_White_Cat_with_Red_Sc_0921091412_texture.glb` disalin ke source aset proyek.
- Runtime baru: `starbound-wanderer.glb` 298,9 KB dan `white-cat-red-scarf.glb` 191,4 KB setelah optimasi.
- `MapDecor.tsx` menambahkan vignette foreground kecil: platform batu/rumput prosedural, karakter petualang, dan kucing pendamping.
- PNG referensi yang dikirim dipakai sebagai arahan komposisi, tidak ditempel mentah ke peta karena berupa mockup/sheet gabungan.

## 2026-09-21 ? Awan 3D peta dunia

- Dua model awan Meshy disalin ke source aset dan dioptimalkan menjadi `cloud-soft-drifts.glb` 98,1 KB dan `cloud-white.glb` 93,0 KB.
- `MapDecor.tsx` kini memakai ring awan GLB 3D dengan beberapa layer rotasi/scale agar model Meshy yang cenderung gepeng terasa lebih bervolume.
- Awan prosedural lama tetap menjadi fallback Suspense/error boundary; peta 3D, OrbitControls, posisi cincin dunia, dan gameplay tidak berubah.
- Revisi: seluruh awan peta diganti ke model terbaru `cloud-pastel-drift.glb` 153,9 KB dari source 9,54 MB.
- Layer awan prosedural global dan siluet gunung segitiga di sekitar awan tidak lagi dirender.

## 2026-09-21 ? Kontrol Ekspedisi

- Karakter Ekspedisi kini langsung menghadap arah input WASD/joystick, termasuk saat menekan `S` untuk balik badan.
- Area canvas Ekspedisi mencegah context menu browser dan mendukung drag klik kanan/middle untuk menggeser sudut kamera kiri-kanan serta atas-bawah.
- Scroll wheel di arena Ekspedisi kini mengatur jarak kamera dengan batas aman.
- Tombol WASD/arrow/space tidak lagi ikut memicu scroll halaman saat arena aktif.

## 2026-09-21 ? Froggy model GLB baru

- Model `Meshy_AI_Low_Poly_Frog_0921033043_texture.glb` disalin ke `assets-source/models/meshy-froggy.glb`.
- Runtime `public/assets/models/froggy.glb` dioptimalkan menjadi 218,4 KB dari 10,41 MB.
- `FroggyGame.tsx` kini memakai model kodok GLB baru, dengan kodok prosedural lama sebagai fallback loading/error.
- Posisi model Froggy dinormalisasi dari bounding box supaya tidak tenggelam/menembus daun teratai.
- Kontrak gameplay, evidence/XP, Canvas boundary, dan kebijakan tanpa musik tidak berubah.
- Revisi: model kodok lompat diganti ke `Meshy_AI_Low_Poly_Frog_0921095558_texture.glb`; runtime `froggy.glb` kini 249,4 KB dari source 9,40 MB.
- Revisi lanjutan: pose lama dikembalikan untuk idle di daun sebagai `froggy.glb`, sedangkan model berdiri terbaru dipisah menjadi `froggy-jump.glb` dan hanya muncul saat fase lompat.

## 2026-09-20 ? Quran 2 dan pulau Arabic GLB

- `meshy-pulauquran2.glb` disalin ke sumber aset proyek dan dioptimalkan menjadi `pulau-quran.glb` 513,6 KB.
- Model Quran lama dipakai ulang sebagai `pulau-arabic.glb` 602,5 KB untuk Oasis Bahasa Arab.
- Peta 3D kini memakai GLB Quran/Arabic/Digital; game Arabic juga menampilkan preview model 3D.
- Total enam GLB runtime kini sekitar 2,57 MB; pipeline dan laporan optimasi diperbarui.

## 2026-09-20 ? Startup browser dan integrasi GLB

- Diagnosis: port 5173 ditempati proxy VS Code yang timeout; Vite default ke 5174.
- Enam GLB unik dioptimalkan dari 214,81 MB menjadi 2,57 MB; sumber asli dipertahankan.
- Integrasi Quran/Arabic/Digital pada peta dan game; menara Latihan; pesawat peta/SkyRun; Bri ringan.
- Boundary dan Suspense per model, boundary luar Canvas game/CharacterPicker;
  fallback menjaga kontrol DOM tersedia ketika WebGL gagal.
- Rotasi/zoom, posisi cincin, evidence/mastery/XP dan kebijakan tanpa musik dipertahankan.
- Validasi: typecheck/build, smoke browser, fallback model/WebGL, dan copy Android lulus.
- Seluruh materi AI tetap draft. Rincian dan pipeline: `docs/technical/GLB-ASSETS.md`.

# Changelog (ringkas — lihat docs/history/CHANGELOG-FULL.md untuk detail)

## 0.10.0 - Patch 10 — Rekonsiliasi Dokumentasi + Juice Kit

### Fixed
- **Regresi peta 3D diperbaiki**: `src/data/worlds.ts` dikembalikan ke
  formasi cincin Patch 06 (variasi Z -1.9..+1.9) setelah ditemukan
  tertimpa balik ke pola datar saat Patch 08.
- **Drift dokumentasi diperbaiki**: `AGENTS.md`/`GAMEPLAY-CATALOG.md`
  sebelumnya salah menyatakan hanya 2/6 dunia punya game — faktanya
  SEMUA 6 dunia sudah punya game sungguhan sejak Patch 07. Seluruh
  dokumen source-of-truth ditulis ulang agar sinkron dengan kode aktual.

### Added
- `src/game/juice.tsx` — juice kit bersama (Confetti, useStreak/
  StreakBadge, useCountUp, usePunch), murni dekoratif, tanpa dependency
  baru, tanpa musik latar.
- Juice kit dipasang di `QuizGame.tsx` (Quran/Adab/English), `NumeriaGame.tsx`,
  `DigitalGame.tsx`, `ArabicGame.tsx`.
- Rekomendasi pembersihan repo dicatat di `AGENTS.md` (folder duplikat
  `patches-maps`, file CSS addon lama, dokumen arsitektur ganda).

## Unreleased — Safari Kata Arab polish
- Safari Kata Arab kini tampil sebagai mini-game ekspedisi: intro misi, jalur
  jejak oasis, area peta mini, objek yang bisa dikumpulkan, ransel kata,
  feedback, dan summary misi.
- Kontrak evidence, mastery, aturan XP, SFX, dan guard sesi kosong tetap sama;
  tidak ada dependency baru atau musik latar.
  feedback visual, petunjuk berformat jelas, dan panel kata hari ini.
- Ringkasan misi menampilkan status penyelesaian dengan animasi ringan.

> Konten pembelajaran Arab tetap draft sampai disahkan tim akademik Bright
> Academy.

## 0.9.0 - Patch 09
### Added
- Game "Safari Kata Arab" di Oasis Bahasa Arab, memakai 72 kartu kosakata
  bergambar dari materi user dan sesi maksimal 8 kartu.
- Tulisan Arab berharakat, transliterasi, kategori, emoji visual, petunjuk,
  dan penjelasan singkat pada kartu kuis.
- Semua konten tetap berstatus draft sampai disahkan tim akademik Bright
  Academy.

## 0.8.0 - Patch 08
### Added
- Aset map lokal baru diintegrasikan ke `WorldScene.tsx`: background sky,
  connector route, dan waypoint marker.
- Peta tetap Three.js 3D interaktif dengan `OrbitControls`, klik dunia,
  dan fallback grid jika WebGL gagal.
- Warna tekstur lokal map/world disetel ke sRGB; tidak ada dependency baru
  atau `<Environment>` eksternal.

## 0.5.0 - Patch 05
### Fixed (koreksi arah dari Patch 04)
- Peta dunia DIKEMBALIKAN ke Three.js 3D interaktif (drag rotate, scroll
  zoom) — Patch 04 sempat menghapus interaksi ini demi "keandalan", yang
  ternyata dianggap user sebagai kemunduran ("tidak menarik", "gak bisa
  diputer-puter").
### Added
- Teknik "3D billboard": 6 ilustrasi pulau asli ditempel sebagai tekstur
  pada plane 3D yang selalu menghadap kamera (`<Billboard>` drei), sehingga
  visual premium DAN interaksi 3D bisa didapat sekaligus.
- `WorldSceneErrorBoundary` + `FallbackGrid` — jika WebGL gagal, otomatis
  fallback ke grid 2D, bukan blank.
- Efek glow (hover), ring (dipilih), shadow, dan awan melayang memakai
  aset asli yang disediakan user.
- `docs/gameplay/GAMEPLAY-CATALOG.md` ditulis ulang dengan peta kurikulum
  konkret per dunia (jenjang tajwid, tema adab, level bahasa, dst),
  ditandai jelas sebagai draft yang perlu validasi tim akademik.

## 0.4.0 - Patch 04
Perbaikan reliabilitas (AppErrorBoundary, styles.css file tunggal) — TETAP
DIPERTAHANKAN. Bagian peta DOM/CSS DIKOREKSI di Patch 05.

## 0.3.2 - Patch 03c
Badge "Game tersedia" vs "Segera hadir · mode demo"; dokumentasi master.

## 0.3.1 - Patch 03b
Hotfix: hapus `<Environment>` drei; ErrorBoundaryCanvas.

## 0.3.0 - Patch 03
Numeria Fraction Bridge — mini-game pertama.

## 0.2.0 - Patch 02 / 0.1.0 - Patch 01
Fondasi enam pulau 3D interaktif, landmark prosedural, dokumentasi agent.
