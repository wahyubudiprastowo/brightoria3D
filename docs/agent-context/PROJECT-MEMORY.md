> **Checkpoint 19 Oktober 2026:** kartu Premium di Taman Al-Qur'an, Oasis
> Bahasa Arab, dan Kampung Adab sekarang terkunci untuk akun Free. Klik kartu
> membuka modal empat paket harga. Frontend tidak menyimulasikan pembayaran:
> checkout membutuhkan `VITE_PREMIUM_CHECKOUT_URL`, sedangkan verifikasi
> pembayaran/backend produksi masih belum tersedia di repository ini.

> **Checkpoint 20 September 2026:** status lama di bawah adalah riwayat patch, bukan
> inventaris terkini. Audit kode/startup, daftar model terpasang, ukuran aktual,
> dan batas validasi tersedia di [GLB-ASSETS.md](../technical/GLB-ASSETS.md).
> Enam game mandiri aktif, ditambah Latihan/SkyRun/Froggy/Ekspedisi. Quran,
> Arabic, dan Digital memakai GLB lokal; menara membuka Latihan; pesawat dipakai peta/SkyRun.
> Quran memakai `meshy-pulauquran2.glb`; model Quran lama kini menjadi pulau Arabic.
> Semua konten kurikulum AI tetap **draft** menunggu pengesahan Bright Academy.

# Brightoria — Project Memory (Master Document, Patch 10)

> **BACA FILE INI PERTAMA KALI.** Sumber kebenaran tunggal status proyek
> per Patch 10. Baca berurutan dengan dokumen lain di bawah sebelum
> menyentuh kode apa pun.

## Urutan baca dokumen

```text
1. AGENTS.md
2. docs/agent-context/PROJECT-MEMORY.md    (dokumen ini)
3. docs/gameplay/GAMEPLAY-CATALOG.md       (kurikulum & status tiap dunia)
4. docs/technical/TECHNICAL-ARCHITECTURE.md
5. docs/product/NEXT-STEPS.md
6. docs/history/CHANGELOG-FULL.md
```

## Patch 10 — Rekonsiliasi Dokumentasi + Juice Kit (perbaikan besar)

### Masalah yang ditemukan (sebelum Patch 10)

Audit menyeluruh atas kode aktual (bukan hanya dokumen) menemukan **dua
temuan besar**:

1. **Dokumentasi tertinggal 2-3 patch dari kode.** `AGENTS.md` dan
   `GAMEPLAY-CATALOG.md` versi Patch 09 menyatakan hanya 2 dari 6 dunia
   punya game sungguhan (Numeria + Arabic), dan 4 dunia lain "BELUM
   DIBANGUN". Faktanya, `src/App.tsx` sudah mengimpor dan merender game
   sungguhan untuk **SEMUA 6 DUNIA** sejak Patch 07 — termasuk komentar
   eksplisit di kode `// --- Semua 6 dunia sudah punya game sungguhan
   (Patch 07) ---`. Empat dunia yang "belum dibangun" menurut dokumen
   (Quran, Adab, English) ternyata sudah punya `QuranGame.tsx`,
   `AdabGame.tsx`, `EnglishGame.tsx` — masing-masing wrapper tipis (~29
   baris) di atas mesin kuis bersama `src/game/quiz/QuizGame.tsx` (334
   baris), lengkap dengan `levels.ts` dan `evidence.ts` masing-masing.

2. **Regresi posisi peta 3D.** Patch 06 pernah memperbaiki `worlds.ts`
   dari "pola silang datar" (variasi Z hampir nol → tidak terasa 3D saat
   diputar) menjadi formasi cincin dengan variasi Z signifikan (-1.9 s.d.
   +1.9 → efek paralaks nyata). Namun saat `WorldScene.tsx` ditulis ulang
   di Patch 08 untuk integrasi aset peta lokal (sky/connector/waypoint),
   `worlds.ts` ikut tertimpa balik ke versi PRA-Patch-06 (variasi Z kembali
   ke rentang -1..0). Ini regresi nyata terhadap perbaikan yang sudah
   pernah "selesai" — berisiko memunculkan lagi keluhan "peta belum terasa
   3D" meski secara kode WorldScene.tsx tampak benar.

**Pelajaran untuk agent berikutnya:** JANGAN percaya begitu saja klaim
"status faktual" di dokumen manapun tanpa memverifikasi terhadap isi file
kode aktual. Drift dokumentasi-vs-kode sudah terjadi lebih dari sekali di
proyek ini.

### Perbaikan Patch 10

1. **Regresi peta diperbaiki**: `src/data/worlds.ts` dikembalikan ke
   formasi cincin Patch 06 (komentar penjelasan ditambahkan langsung di
   file supaya tidak tertimpa lagi secara tidak sengaja), TANPA menyentuh
   perbaikan aset map lokal dari Patch 08 di `WorldScene.tsx`.
2. **Seluruh dokumen disinkronkan ulang** dengan kode aktual: `AGENTS.md`,
   `GAMEPLAY-CATALOG.md`, `NEXT-STEPS.md`, `CHANGELOG-FULL.md`, root
   `CHANGELOG.md`/`PATCH_NOTES.md`.
3. **Juice kit ditambahkan** (`src/game/juice.tsx`): confetti (partikel
   canvas ringan tanpa library baru), streak/combo counter per sesi,
   animasi count-up angka, dan animasi "punch" (scale bounce) singkat.
   Dipasang di keempat implementasi game (`QuizGame.tsx` — mencakup
   quran/adab/english sekaligus, `NumeriaGame.tsx`, `DigitalGame.tsx`,
   `ArabicGame.tsx`). Efek ini murni dekoratif dan menghormati
   `prefers-reduced-motion`.
4. **Rekomendasi pembersihan repo dicatat** (belum dieksekusi): folder
   duplikat `patches/patches-maps/`, tiga file `styles-*-addon.css` sisa
   kebijakan lama, dan duplikasi `docs/technical/ARCHITECTURE.md` vs
   `TECHNICAL-ARCHITECTURE.md`. Lihat `AGENTS.md` bagian "Pembersihan repo"
   untuk detail.

## 1. Ringkasan produk

Brightoria by Bright Academy — game-based learning untuk anak 6-12 tahun,
web + Android. Enam dunia, **SEMUA sudah punya game sungguhan**: Taman
Al-Qur'an (kuis hijaiyah/tajwid dasar), Kampung Adab (kuis skenario adab),
Pulau Numeria (jembatan pecahan 3D), Oasis Bahasa Arab (ekspedisi Safari
Kata Arab), English Harbor (kuis kosakata), Benteng Digital (Cyber Safety
Sorter). Prinsip non-negotiable: tanpa musik latar (SFX pendek boleh),
dominan visual 3D pada peta, tiga jalur independen (Mandiri/Tutor/
Homeschool).

## 2. RIWAYAT PENTING (ringkas — detail lengkap di CHANGELOG-FULL.md)

- **Patch 04**: sempat mengganti peta ke DOM/CSS datar — SALAH ARAH,
  dikoreksi Patch 05.
- **Patch 05**: peta kembali Three.js dengan teknik billboard; kurikulum
  draft konkret pertama kali ditulis.
- **Patch 06**: perbaikan persepsi kedalaman 3D — formasi cincin, ground
  disc/rings, sky dome prosedural.
- **Patch 07**: mesin kuis bersama (`QuizGame.tsx`) dibangun, dipakai untuk
  memberi game sungguhan ke Quran/Adab/English sekaligus. **Titik ini
  adalah saat SEMUA 6 dunia menjadi punya game — tapi dokumentasi
  berikutnya (08, 09) tidak pernah mencatat pencapaian ini dengan benar.**
- **Patch 08**: integrasi aset map lokal (sky/connector/waypoint) ke
  `WorldScene.tsx` — TANPA SENGAJA menimpa balik posisi `worlds.ts` ke versi
  pra-Patch-06 (regresi kedalaman 3D, baru ditemukan & diperbaiki di
  Patch 10).
- **Patch 09**: Safari Kata Arab (`ArabicGame.tsx`, 72 kartu draft) — mini
  game ekspedisi mandiri, bukan lagi wrapper QuizGame generik.
- **Patch 10** (dokumen ini): rekonsiliasi dokumentasi total + perbaikan
  regresi peta + juice kit di semua game.

**Batasan jujur yang tetap wajib dipertahankan sejak Patch 05:** seluruh
peta kurikulum di `GAMEPLAY-CATALOG.md` adalah draft yang disusun dari
struktur umum pembelajaran homeschooling Islam, BUKAN salinan dokumen
kurikulum resmi internal Bright Academy. Ini berlaku untuk SEMUA dunia,
termasuk yang mekanik game-nya sudah selesai — selesai secara teknis TIDAK
sama dengan disahkan secara akademik.

## 3. Status faktual saat ini (per Patch 10, diverifikasi dari kode)

```text
[ADA] Peta 3D interaktif, formasi cincin dipulihkan (regresi Patch 08 fixed)
[ADA] Fallback 2D jika WebGL gagal
[ADA] ENAM dari enam dunia punya game sungguhan (lihat rincian di AGENTS.md)
[ADA] Mesin kuis bersama QuizGame.tsx (quran/adab/english)
[ADA] Juice kit (confetti/streak/count-up/punch) di semua game
[ADA] AppErrorBoundary, styles.css utama sebagai file tunggal
[BELUM] Pembersihan repo (patches-maps, styles addon lama, ARCHITECTURE.md
        duplikat) — sudah direkomendasikan, belum dieksekusi
[ADA] Frontend Premium gate + modal empat paket di Quran/Arabic/Adab
[BELUM] Backend, auth, verifikasi payment/entitlement, integrasi meeting,
        test otomatis
[BELUM] Build Android yang sudah dites end-to-end
[BELUM] Validasi resmi tim akademik Bright Academy atas SEMUA konten
```

## 4. Untuk agent yang lanjut sekarang

Baca `docs/product/NEXT-STEPS.md`. Prioritas: (1) konfirmasi dari user
bahwa peta 3D dan juice kit terasa baik di browser sungguhan, (2) eksekusi
rekomendasi pembersihan repo di `AGENTS.md`, (3) mulai proses validasi
akademik konten kurikulum (semua dunia, bukan hanya yang mekaniknya
selesai), (4) pertimbangkan menambah juice kit yang lebih dalam per-dunia
(mis. animasi 3D lebih kaya di Numeria) jika user memintanya lagi.
