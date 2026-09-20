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
