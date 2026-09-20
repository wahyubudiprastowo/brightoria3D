# Patch 43 — Perbaikan Galat Build: File Patch 41 yang Hilang

**Sifat patch:** perbaikan galat. Tanpa dependency baru, `package.json` tidak
berubah, `App.tsx` dan `main.tsx` tidak perlu disentuh.

---

## 1. Penyebab galat — ini kelalaian saya

```
src/game/expedition/ExpeditionGame.tsx:45:51 - error TS2307:
Cannot find module './WorldPortalHost' or its corresponding type declarations.
```

**Patch 41 tidak pernah sampai ke Anda.** Pengiriman ZIP-nya gagal enam kali
berturut-turut, dan saya tidak pernah berhasil mengirim ulang. `WorldPortalHost.tsx`
ada di paket itu.

Patch 42 mengimpornya, jadi build gagal. Bukan kesalahan pemasangan Anda.

---

## 2. Isi paket — perhatikan mana yang wajib

| File | Status | Keterangan |
|---|---|---|
| `src/game/expedition/WorldPortalHost.tsx` | **WAJIB** | Pemblokir build. Tanpa ini `npm run build` tetap gagal |
| `src/components/world3d/BlockyCharacter.tsx` | Opsional | Karakter v2 — *flat shading*, kepala lebih besar |
| `src/game/expedition/NpcAira.tsx` | Opsional | Aira memakai warna brand |

> **Build Anda akan hijau meski hanya menyalin file WAJIB.** Dua file lainnya murni
> peningkatan visual.

---

## 3. Cara memasang

Salin **isi** folder `p43/` ke root proyek — bukan foldernya:

```
BENAR:  brightoria/src/game/expedition/WorldPortalHost.tsx
SALAH:  brightoria/p43/src/game/expedition/WorldPortalHost.tsx
```

Lalu:

```powershell
npm run typecheck
npm run build
npm run dev
```

### Verifikasi sebelum build

```powershell
dir src\game\expedition\WorldPortalHost.tsx
```

Kalau berkas itu tidak muncul, penyalinan belum berhasil.

---

## 4. Apa yang dilakukan `WorldPortalHost.tsx`

Berkas ini yang membuat **gerbang Ekspedisi benar-benar membuka game dunia**.

Sebelumnya (Patch 38), gerbang hanya mengirim `CustomEvent` lalu menutup arena —
dan itu cuma berfungsi kalau `App.tsx` punya listener khusus, langkah yang saya
tandai "opsional". Itu keliru: tanpa listener, menekan gerbang tidak melakukan
apa-apa.

Sekarang game dunia dibuka **sebagai overlay di atas arena**, dimuat langsung oleh
berkas ini. `App.tsx` tidak perlu diubah sama sekali. Menutup game mengembalikan
anak ke posisi terakhirnya di arena, bukan melempar ke peta.

### Cara menemukan berkas game dunia

Saya tidak punya salinan enam berkas game Anda, jadi menuliskan jalur impor satu
per satu berisiko salah tebak. Sebagai gantinya dipakai `import.meta.glob` (bawaan
Vite, bukan dependency baru):

```ts
const gameModules = import.meta.glob('../*/*Game.tsx');
```

Vite memindai pola itu saat build. Berkas yang tidak ada cukup **tidak muncul** di
peta — tidak ada galat kompilasi. Ada pula daftar folder cadangan (`math` → coba
`math`, lalu `numeria`), jadi tahan terhadap perbedaan penamaan.

Kalau ternyata ada folder bernama lain, ubah `WORLD_FOLDER` di berkas itu — satu
tempat saja.

### Efek samping positif

Deteksi quest jadi akurat. Patch 39 mendeteksi selesainya quest `play_world` lewat
event `focus`/`visibilitychange` — cara tidak langsung yang bisa tertunda. Karena
game kini ditutup lewat callback, Ekspedisi tahu **persis** kapan anak selesai
bermain.

---

## 5. Dua file opsional

### `BlockyCharacter.tsx` v2

Anda sekarang punya v1 dari Patch 40. Empat perubahan di v2:

| Aspek | v1 | v2 |
|---|---|---|
| Kepala | 0.46 | **0.58** |
| Badan | 0.52 × 0.6 × 0.3 | **0.64 × 0.62 × 0.32** |
| Shading | halus | **flat shading** |
| Anggota badan | menempel | **celah 0.03** |

**Flat shading yang paling terasa.** Tanpa itu, `MeshStandardMaterial`
menginterpolasi normal antar-verteks sehingga sudut kotak terlihat membulat —
persis yang membuat v1 belum terbaca blocky.

### `NpcAira.tsx`

Menyelaraskan Aira dengan sistem karakter blocky dan warna brand (biru langit
`#28a8e0`). Versi yang terpasang sekarang kemungkinan masih Patch 39 — Aira
berjubah kerucut dengan sabuk torus.

---

## 6. Hasil verifikasi

| Pemeriksaan | Hasil |
|---|---|
| Keseimbangan kurung, 3 berkas (pemeriksa sadar-string) | ✅ Seimbang |
| Import menganggur | ✅ Nol temuan |
| Ekspor yang dibutuhkan `ExpeditionGame.tsx` | ✅ Lengkap |

Ekspor yang diperiksa:
- `WorldPortalHost` → `default` + `WORLD_PORTAL_CSS` ✅
- `BlockyCharacter` → `default` + `PALETTES` + `CharacterMotion` ✅
- `NpcAira` → `default` ✅

**Belum bisa saya verifikasi:** `npm run build` — `node_modules` tidak tersedia di
lingkungan kerja saya.

---

## 7. Checklist uji setelah build hijau

- [ ] `npm run build` selesai tanpa galat
- [ ] Buka 🧭 Ekspedisi → arena terbuka normal
- [ ] Dekati gerbang yang terbuka → tombol "Masuk ..." muncul
- [ ] Tekan tombol → **game dunia terbuka**, bukan sekadar menutup arena
- [ ] Layar "Membuka ..." muncul sebentar saat game dimuat
- [ ] Tutup game → kembali ke arena di posisi terakhir
- [ ] Kalau quest `play_world` terpenuhi → toast "✓ Tugas selesai!" muncul

Kalau menyalin dua berkas opsional juga:

- [ ] Tepi kotak karakter terlihat tajam, bukan membulat
- [ ] Aira bersosok blocky biru langit, bukan jubah kerucut

---

## 8. Kalau gerbang masih tidak membuka game

Buka Console browser (F12), lalu masuk gerbang:

- Muncul kartu **"Dunia ini belum tersedia"** → berkas game tidak ditemukan oleh
  glob. Jalankan `dir src\game` dan kirimkan hasilnya; saya perlu tahu nama folder
  sebenarnya.
- Muncul pesan **"Game dunia ... gagal render"** → komponen game punya masalah
  internal, bukan masalah pemuatan.
