# AGENTS.md — Mandatory Operating Contract (Updated Audit & Modernization)

Baca urutan ini dulu jika Anda agent baru tanpa riwayat chat:

```text
1. AGENTS.md (dokumen ini)
2. docs/agent-context/PROJECT-MEMORY.md
3. docs/gameplay/GAMEPLAY-CATALOG.md
4. docs/technical/TECHNICAL-ARCHITECTURE.md
5. docs/product/NEXT-STEPS.md
6. CHANGELOG.md / docs/history/CHANGELOG-FULL.md
```

> **Audit Status:** Seluruh 6 dunia kini memiliki gameplay interaktif tersendiri:
> Numeria (3D fraction bridge), Digital (Cyber Safety Sorter), Arabic (Safari Kata Arab 72 kartu), Quran (Drag-Line Hijaiyah), Adab (Kisah Pilihan branching story), dan English (3D Letter-Builder puzzle R3F).
> Bundle chunking Vite teroptimasi (`three-vendor`, `lucide-vendor`) dan repository sudah dibersihkan dari artefak usang.

## Product invariants

- Nama: **Brightoria**, endorsement: **by Bright Academy**.
- Target: anak 6–12 tahun + akun orang tua.
- **Tanpa musik latar** — non-negotiable. (Efek suara pendek/SFX via Web
  Audio API BOLEH ada sejak Patch 05 — itu bukan musik latar/loop.)
- Tiga jalur independen: Mandiri, Tutor 1-on-1, Homeschool.
- Web + Android (Capacitor); tanpa iklan/loot box/ranking publik.

## KEBIJAKAN WAJIB (kumulatif, jangan dilanggar)

1. **Peta dunia (`WorldScene.tsx`) WAJIB tetap 3D interaktif** (drag rotate,
   scroll zoom via `OrbitControls`). **JANGAN PERNAH** mengubahnya kembali
   menjadi DOM/CSS datar tanpa interaksi — ini sudah dicoba di Patch 04 dan
   ditolak user secara eksplisit ("gak menarik", "gak bisa diputer-puter").
2. **Posisi 6 dunia di `src/data/worlds.ts` WAJIB memakai formasi cincin
   dengan variasi Z signifikan** (lihat komentar di file tersebut). Patch 06
   pernah memperbaiki ini karena peta "belum terasa 3D", tapi regresi
   sempat terjadi di Patch 07/08 (posisi tertimpa balik ke versi datar).
   Patch 10 memperbaikinya lagi. **Jangan ulangi regresi ini** — jika
   menyentuh `worlds.ts`, pastikan variasi Z tetap ada (idealnya -1.9
   s.d. +1.9), jangan biarkan tertimpa versi lama saat refactor file lain.
3. **`styles.css` SELALU file lengkap** — tidak ada fragmen CSS manual yang
   "harus ditempel sendiri" oleh user. (Catatan: repo saat ini masih berisi
   tiga file sisa `styles-*-addon.css` dari sebelum kebijakan ini berlaku —
   file tersebut TIDAK dipakai lagi oleh `main.tsx` dan aman dihapus, lihat
   bagian "Pembersihan repo" di bawah.)
4. **`AppErrorBoundary` WAJIB tetap ada**, membungkus `<App/>`.
5. **Setiap Canvas Three.js WAJIB dibungkus error boundary** dengan
   fallback non-3D (pola `ErrorBoundaryCanvas` di Numeria,
   `WorldSceneErrorBoundary` di peta).
6. **DILARANG memakai `<Environment>` drei tanpa Suspense proper** —
   gunakan pencahayaan manual (ambient/directional/hemisphere), dan
   tekstur LOKAL (`/public/assets`) jika butuh gambar, BUKAN CDN eksternal.
7. **Konten kurikulum yang ditulis AI SELALU berstatus draft** sampai
   disahkan tim akademik Bright Academy — pertahankan disclaimer ini di
   `GAMEPLAY-CATALOG.md` dan dokumen terkait, untuk SEMUA dunia termasuk
   yang sudah punya game (mekanik selesai ≠ konten disahkan).
8. **Efek "juice" (Patch 10: confetti, streak, punch, count-up) WAJIB
   murni dekoratif** — lihat `src/game/juice.tsx`. Jika dihapus seluruhnya,
   evidence/mastery/XP tiap game harus tetap identik. Jangan pernah membuat
   progres/reward bergantung pada modul juice.

## Status faktual saat ini (Diverifikasi langsung dari kode)

Audit 2026-09-20: lihat [docs/technical/GLB-ASSETS.md](docs/technical/GLB-ASSETS.md).
Enam model runtime kini total 2,57 MB; sumber asli disimpan terpisah.
Quran memakai `meshy-pulauquran2.glb`, sedangkan model Quran lama dipakai
sebagai pulau Bahasa Arab. Ada juga game SkyRun, Froggy, Ekspedisi, dan mode
endless Numeria. Port awal dev 5174 karena port 5173 ditempati proxy VS Code
saat diagnosis.

```text
[ADA] Peta 3D interaktif (billboard + GLB Quran/Arabic/Digital/menara/pesawat + OrbitControls + BriMascot)
      dengan formasi cincin (variasi Z)
[ADA] Fallback 2D jika WebGL gagal (WorldSceneErrorBoundary + FallbackGrid)
[ADA] ENAM game dunia interaktif spesifik:
        - math    -> NumeriaGame.tsx      (3D fraction bridge, R3F, mandiri)
        - digital -> DigitalGame.tsx      (Cyber Safety Sorter, DOM UI, mandiri)
        - arabic  -> ArabicGame.tsx       (Safari Kata Arab ekspedisi, 72 kartu, avatar map, TTS audio)
        - quran   -> QuranGame.tsx        (Hijaiyah Drag-Line matching, Patch 30, TTS audio)
        - adab    -> AdabGame.tsx         (Branching Story "Kisah Pilihan", Patch 26, 8 bab)
        - english -> EnglishGame.tsx      (3D Letter-Builder puzzle R3F & 12 Island Harbor, Patch 31, TTS audio)
[ADA] Juice kit: src/game/juice.tsx — confetti, streak, count-up, punch
[ADA] Sound effects synthesizer: src/game/sound.ts (Web Audio API, SFX pendek, non-loop)
[ADA] AppErrorBoundary tingkat aplikasi
[ADA] Chunk vendor terpisah; audit 2026-09-20: three ~1.175 MB, lucide ~13 KB, app ~486 KB (sebelum gzip)
[CATATAN] Masih ada file .bak dan skrip patch lama; jangan menganggap seluruh repo bebas artefak
[BELUM] Backend, auth, payment, integrasi meeting, test otomatis CI/CD
[BELUM] Build Android Capacitor yang sudah dites end-to-end pada perangkat fisik
[BELUM] Validasi resmi tim akademik Bright Academy atas SEMUA konten kurikulum
```

## Pembersihan repo (Selesai dieksekusi)

1. `patches/patches-maps/` — Dihapus.
2. Semua file `src/*addon*.css` dan `src/styles-patch*.css` — Dihapus.
3. `docs/technical/ARCHITECTURE.md` — Dikonsolidasi ke `TECHNICAL-ARCHITECTURE.md` dan dihapus.
4. `src/game/arabic-oasis/` dead code folder — Dihapus.
5. File log build sisa di root — Dihapus.

## Mandatory workflow

1. Baca seluruh dokumen source-of-truth.
2. Prioritaskan patch tanpa dependency baru.
3. Jika menyentuh CSS, edit `styles.css` langsung (full file).
4. Jika membuat game baru, ikuti pola Numeria/QuizGame: `levels.ts` /
   `evidence.ts` / `XxxGame.tsx`, dan pertimbangkan memakai `src/game/juice.tsx`
   untuk konsistensi game-feel dengan 6 dunia lain.
5. Jalankan `npm run typecheck` dan `npm run build` sebelum selesai.
6. **WAJIB perbarui dokumentasi** di akhir setiap patch — termasuk
   memverifikasi ulang klaim "status faktual" terhadap kode aktual
   (bukan hanya menyalin klaim patch sebelumnya), karena drift dokumentasi
   vs kode sudah terjadi dua kali di proyek ini (Patch 07→09).
7. Jangan melanggar kebijakan wajib di atas.

## Catatan komunikasi dengan user

User (Wahyu) bekerja di Windows/VS Code/PowerShell. Beberapa pelajaran
berulang dari histori proyek:

- Patch 04 sempat menghapus interaksi 3D peta demi "keandalan" — user
  menolak ini secara eksplisit. **Jangan korbankan fitur yang disukai demi
  argumen teknis** tanpa mendiskusikannya dulu.
- Dokumentasi proyek ini SANGAT ekstensif (>10 file docs) dan user memang
  mengandalkannya untuk kontinuitas antar-sesi/agent. Tapi ekstensif ≠
  akurat — Patch 10 membuktikan dokumentasi bisa tertinggal dari kode
  tanpa disadari selama beberapa patch. **Selalu verifikasi klaim di
  dokumen terhadap isi file kode aktual sebelum mempercayainya**, terutama
  untuk klaim status "sudah ada" vs "belum ada".
- User pernah secara eksplisit meminta gameplay yang "lebih menarik" —
  Patch 10 menjawab ini dengan juice kit (confetti/streak/punch/count-up)
  yang diterapkan merata ke seluruh game, bukan hanya satu dunia.
