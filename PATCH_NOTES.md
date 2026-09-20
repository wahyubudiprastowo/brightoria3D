# Patch 10 Notes — Rekonsiliasi Dokumentasi + Juice Kit

## Jenis patch
Perbaikan regresi + polish gameplay + rekonsiliasi dokumentasi. **Tidak ada
dependency baru** — `package.json` tidak berubah sama sekali.

## Apa yang diperbaiki

### 1. Regresi peta 3D ("belum terasa 3D" berpotensi muncul lagi)
`src/data/worlds.ts` ditemukan sudah kembali ke variasi kedalaman (Z)
hampir nol — padahal Patch 06 dulu memperbaikinya jadi formasi cincin
(Z -1.9 s.d. +1.9) supaya efek paralaks terasa saat kamera diputar. Regresi
ini kemungkinan tidak sengaja terjadi saat Patch 08 menulis ulang
`WorldScene.tsx`. Sekarang dipulihkan, sekaligus mempertahankan seluruh
perbaikan aset map lokal dari Patch 08.

### 2. Dokumentasi tidak sinkron dengan kode
`AGENTS.md` dan `GAMEPLAY-CATALOG.md` sebelumnya salah menyatakan hanya
2 dari 6 dunia punya game sungguhan. Audit langsung ke `src/App.tsx`
membuktikan SEMUA 6 dunia sudah punya game (Quran/Adab/English lewat
mesin kuis bersama `QuizGame.tsx` sejak Patch 07). Seluruh dokumen
source-of-truth (`AGENTS.md`, `PROJECT-MEMORY.md`, `GAMEPLAY-CATALOG.md`,
`NEXT-STEPS.md`, `CHANGELOG-FULL.md`) ditulis ulang.

### 3. Gameplay lebih menarik — Juice Kit
Modul baru `src/game/juice.tsx` menambahkan:
- **Confetti** — ledakan partikel ringan (canvas 2D, tanpa library baru)
  saat jawaban benar pertama kali dan saat dunia selesai.
- **Streak/combo counter** — badge 🔥 muncul setelah 2 jawaban benar
  beruntun dalam satu sesi (motivasional, tidak memengaruhi mastery resmi).
- **Animasi punch** — kartu feedback "memantul" singkat saat hasil
  diumumkan, memberi umpan balik taktil selain warna.
- **Count-up XP** — primitif animasi angka melompat naik (siap dipakai
  di HUD XP pada patch berikutnya).

Dipasang di keempat implementasi game: `QuizGame.tsx` (Quran/Adab/English),
`NumeriaGame.tsx`, `DigitalGame.tsx`, `ArabicGame.tsx`.

**Semua efek murni dekoratif** — dihapus total pun evidence/mastery/XP
tetap identik. Menghormati `prefers-reduced-motion`. Tanpa musik latar.

## Cara pasang
Baca `patches/patch-10/APPLY.md`.

## Acceptance criteria
- [ ] `npm run typecheck` dan `npm run build` lulus.
- [ ] Peta: drag untuk memutar — pulau-pulau terlihat saling menyalip
      depan-belakang (bukan hanya bergeser datar).
- [ ] Setiap dari 6 game: jawaban benar memicu confetti singkat; 2 jawaban
      benar beruntun memunculkan badge streak; kartu feedback terasa
      "memantul" singkat.
- [ ] Menyelesaikan setiap dunia memicu confetti lebih besar di layar
      ringkasan.
- [ ] Evidence/mastery/XP yang tersimpan di localStorage TIDAK berubah
      perilakunya dibanding sebelum Patch 10 (juice murni dekoratif).
- [ ] Tidak ada dependency baru di `package.json`.

## Rekomendasi tindak lanjut (belum dieksekusi di patch ini)
Lihat `AGENTS.md` bagian "Pembersihan repo" — folder duplikat
`patches/patches-maps/`, tiga file `styles-*-addon.css` sisa kebijakan
lama, dan dokumen `docs/technical/ARCHITECTURE.md` yang tumpang tindih
dengan `TECHNICAL-ARCHITECTURE.md`. Aman dihapus/dikonsolidasikan kapan
saja, tidak mendesak.

---

# Patch 08 Notes — Map Assets Terintegrasi

## Ringkasan

`WorldScene.tsx` sekarang memakai aset lokal baru di `public/assets/map/`:
background sky, connector route, dan marker waypoint. Interaksi 3D Patch 05
tetap dipertahankan.

## Verifikasi

```powershell
npm run typecheck
npm run build
```

Checklist browser: background sky tampil, route connector dan marker terlihat,
drag memutar map, scroll/pinch zoom, klik enam pulau membuka game yang tepat,
dan fallback grid muncul jika WebGL gagal.

---

# Patch 05 Notes — Peta 3D Interaktif Dikembalikan + Kurikulum Konkret

## Jenis patch
Penggantian penuh folder `src/` dan `public/` (seperti Patch 04). **Tidak
ada dependency baru** — `package.json` tidak berubah, tidak perlu
`npm install` ulang.

## Dua masalah yang diperbaiki

### 1. "Aset gak dalam bentuk 3D, gak bisa diputer-puter"
Patch 04 mengganti peta dari Three.js menjadi gambar `<img>` datar biasa
(DOM/CSS) — ini salah arah. Sekarang **dikembalikan ke Three.js**, tapi
gambar isometrik premium Anda ditempel sebagai **tekstur 3D** (teknik
billboard) yang selalu menghadap kamera. Anda tetap bisa **drag untuk
memutar kamera dan scroll untuk zoom**, persis seperti Patch 02/03,
tapi sekarang dengan visual jauh lebih bagus.

### 2. "Gameplay dokumen masih generik, belum terkait pembelajaran Bright Academy"
`docs/gameplay/GAMEPLAY-CATALOG.md` ditulis ulang dengan peta kurikulum
konkret per dunia:
- Taman Al-Qur'an: jenjang tajwid (izhar/idgham/ikhfa/iqlab), makharijul
  huruf, target hafalan
- Kampung Adab: tema adab konkret (orang tua, guru, kejujuran)
- Oasis Bahasa Arab & English Harbor: level kosakata/percakapan berjenjang
- Benteng Digital: level literasi keamanan digital

**Catatan jujur:** ini draft berdasarkan struktur umum homeschooling Islam,
bukan salinan dokumen resmi Bright Academy — perlu divalidasi tim akademik
sebelum dipakai siswa sungguhan. Ini dijelaskan eksplisit di dalam dokumen.

## Cara pasang
Baca `patches/patch-05/APPLY.md`.

## Acceptance criteria
- [ ] `npm run typecheck` dan `npm run build` lulus.
- [ ] Peta menampilkan 6 ilustrasi pulau di dalam scene 3D.
- [ ] **Drag mouse/jari pada peta memutar kamera** (bukan gambar diam).
- [ ] Scroll/pinch memperbesar-kecilkan tampilan peta.
- [ ] Klik pulau tetap memilih dunia seperti biasa.
- [ ] Klik "Mainkan sekarang" di Pulau Numeria membuka game Fraction Bridge.
- [ ] `docs/gameplay/GAMEPLAY-CATALOG.md` berisi kurikulum konkret, bukan
      lagi placeholder generik.

## Jika peta masih terasa datar/tidak bisa diputar
Pastikan hard refresh browser (`Ctrl+Shift+R`) — sisa cache bundle JS lama
dari Patch 04 bisa membuat perubahan tidak terlihat meski file sudah benar.
