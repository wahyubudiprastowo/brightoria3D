# Patch 44 — Perbaikan Sumbu Z, Portal, Logo & Header

**Sifat patch:** perbaikan galat + peningkatan visual. Tanpa dependency baru,
`package.json` tidak berubah, `App.tsx` tidak perlu disentuh.

---

## 1. Galat akar: sumbu Z terbalik

Ini penyebab **hampir semua masalah visual** yang terlihat di tangkapan layar —
karakter tenggelam, gerbang separuh terkubur, "sungai biru" aneh, pohon terbenam.

### Duduk perkaranya

Mesh tanah diputar −90° pada sumbu X. Akibat rotasi itu:

```
dunia(x, y, z) = (lokal_x, tinggi, −lokal_y)
```

Artinya **world_z = −lokal_y**.

Tapi kode pembentuk mesh memanggil `terrainHeight(lokal_x, lokal_y)`, sementara
karakter, gerbang, pohon, dan danau semuanya memanggil
`terrainHeight(world_x, world_z)`.

**Permukaan yang digambar adalah cerminan dari permukaan yang dipijak.** Di tempat
yang cerminannya lebih tinggi, karakter tenggelam; di tempat sebaliknya, ia
melayang.

### Kenapa baru terlihat sekarang

Bug ini sudah ada sejak Patch 38, tapi bentuk lahannya saat itu hampir simetris
terhadap sumbu Z sehingga selisihnya kecil. Patch 42 menambahkan **danau** dan
**teras gerbang** — keduanya sangat asimetris — dan barulah cerminnya terlihat
jelas.

### Perbaikannya

Konversi lokal→dunia kini dilakukan **secara eksplisit** sebelum memanggil
`terrainHeight`:

```ts
const worldX = localX;
const worldZ = -localY;   // inti perbaikan
const h = terrainHeight(worldX, worldZ);
```

Seluruh perhitungan lain di dalam loop (warna, kemiringan, jarak danau, jalan
setapak) juga memakai koordinat dunia yang sama.

Ditambah margin sangat kecil (0.02) pada posisi karakter, karena mesh tanah adalah
pendekatan linear per-facet dari fungsi yang mulus — di tengah facet, permukaan
gambar bisa sedikit lebih tinggi dari nilai fungsinya.

---

## 2. Portal melempar balik ke menu pulau

`handleEnterPortal` masih memanggil prop `onEnterWorld`. `ExpeditionLauncher`
(Patch 38) mengimplementasikan callback itu dengan **menutup seluruh arena** lalu
mengirim `CustomEvent` — akibatnya anak terlempar ke menu pilih pulau.

Sejak Patch 41, `WorldPortalHost` sudah memuat permainan sendiri sebagai overlay di
atas arena. Panggilan lama itu justru merusak alurnya.

**Perbaikan:** berhenti memanggil `onEnterWorld`. Propnya tetap diterima agar
`ExpeditionLauncher` tidak perlu diubah.

Terverifikasi: tidak ada satu pun pemanggilan `onEnterWorld` tersisa di kode.

---

## 3. Logo kotak putih

Berkas logo Bright berlatar **putih pekat**, bukan transparan. Ditempel apa adanya
ke bidang 3D, yang terlihat adalah persegi putih besar — bukan logonya.

**Perbaikan dua lapis:**

**a. Latar putih dihapus secara programatis.** Gambar dibaca ke kanvas, tiap piksel
diperiksa:

| Nilai terendah R/G/B | Perlakuan |
|---|---|
| ≥ 232 | alpha 0 (hilang) |
| 205–232 | alpha bertahap (tepi halus) |
| < 205 | dibiarkan utuh |

Memakai **nilai minimum** dari R/G/B, bukan rata-rata — supaya biru muda pada logo
tidak ikut terhapus (biru muda punya komponen merah rendah, jadi aman).

**b. Logo dipasang di medali 3D.** Cakram putih + bingkai emas, bukan bidang datar
melayang. Bidang tanpa ketebalan selalu terbaca janggal saat kamera bergerak ke
samping.

---

## 4. Header terlalu besar & logo placeholder

| Elemen | Sebelum | Sesudah |
|---|---|---|
| Padding header | 12px 20px | **8px 18px** |
| Tanda logo | 40px | **38px**, latar putih |
| Judul | 17px | **16px** |
| Lencana XP | 38px | **34px** |
| Hero h1 | ~36px | **30px** |

Logo placeholder (bintang ungu) diganti berkas Bright Academy. Kalau berkas tidak
ditemukan, ikon bawaan dikembalikan otomatis — header tidak akan jadi kotak kosong.

### Kenapa lewat penyuntikan CSS, bukan mengubah App.tsx

Saya tidak punya salinan `App.tsx` Anda. Menebak strukturnya lalu menuliskan ulang
berisiko menimpa kode yang sudah bekerja.

Modul ini memakai pola yang **sudah terbukti** di proyek ini (`juice3d.ts` Patch 29,
`kidsUi.ts` Patch 32, `uiPolish.ts` Patch 37): menyuntikkan satu `<style>` ke
`<head>`, lalu menukar isi tanda logo lewat DOM setelah React merender.

`MutationObserver` memastikan logo tetap terpasang setiap kali header dirender ulang
(misalnya saat berpindah mode Anak/Orang Tua).

---

## 5. Peningkatan realisme

| Teknik | Efeknya |
|---|---|
| **Pewarnaan berbasis kemiringan** | Tebing curam menyingkap batuan — isyarat alami bentang lahan |
| **Bayangan cekungan** | Titik lebih rendah dari sekitarnya digelapkan. Ambient occlusion murah; lembah terasa dalam |
| **Variasi warna per-instance** | Tiap pohon sedikit berbeda warna lewat `setColorAt` — masih satu draw call |
| **Kemiringan acak** | Pohon & batu miring sedikit. Objek tegak sempurna semua adalah penanda paling jelas buatan komputer |
| **Tiang gerbang** | Dua tiang penyangga — gerbang terbaca sebagai bangunan, bukan cincin melayang |
| **Segmen lahan dinaikkan** | 40–64 (dari 36–56), facet lebih halus tanpa kehilangan gaya blocky |

---

## 6. File dalam patch ini

```
src/game/expedition/ExpeditionGame.tsx    (TIMPA — perbaikan sumbu Z + portal)
src/game/expedition/ArenaProps.tsx        (TIMPA — logo transparan + variasi)
src/theme/brandHeader.ts                  (BARU — header + logo)
docs/PATCH-44-APPLY.md                    (BARU)
```

**Prasyarat:** Patch 38–43 sudah terpasang, termasuk `WorldPortalHost.tsx` dari
Patch 43 dan `brightBrand.ts` + aset logo dari Patch 42.

---

## 7. Cara memasang

Salin **isi** folder `p44/` ke root proyek — bukan foldernya:

```
BENAR:  brightoria/src/theme/brandHeader.ts
SALAH:  brightoria/p44/src/theme/brandHeader.ts
```

Lalu tambahkan **satu baris** di `src/main.tsx`, letakkan paling bawah di antara
impor modul:

```ts
import './game/juice3d';        // Patch 29
import './game/kidsUi';         // Patch 32
import './game/ParentInsight';  // Patch 34
import './game/DailyPractice';  // Patch 35
import './game/uiPolish';       // Patch 37
import './theme/brandHeader';   // Patch 44  <- TAMBAHKAN INI
```

Urutan penting: `brandHeader` harus **setelah** `uiPolish` agar aturannya menang
bila ada tumpang tindih.

Lalu:

```powershell
npm run typecheck
npm run build
npm run dev
```

---

## 8. Checklist uji

**Perbaikan galat (paling penting):**

- [ ] Karakter **berjalan di atas tanah**, tidak tenggelam di mana pun
- [ ] Gerbang berdiri utuh di tanah datar, tidak separuh terkubur
- [ ] Tidak ada lagi "sungai biru" diagonal aneh
- [ ] Pohon berdiri di permukaan, tidak terbenam
- [ ] Danau berada di satu tempat saja (barat daya), bukan tercermin
- [ ] Tekan "Masuk ..." di gerbang → **permainan dunia terbuka**, bukan kembali ke
      menu pilih pulau
- [ ] Tutup permainan → kembali ke arena di posisi terakhir

**Logo & header:**

- [ ] Monumen di tengah arena menampilkan **logo biru**, bukan kotak putih
- [ ] Logo terpasang di medali berbingkai emas, terlihat dari dua sisi
- [ ] Header lebih ramping
- [ ] Logo Bright muncul di pojok kiri atas, bukan bintang ungu

**Realisme:**

- [ ] Tebing curam menampakkan batuan abu-kebiruan
- [ ] Lembah terlihat lebih gelap dari punggung bukit
- [ ] Pohon-pohon sedikit berbeda warna satu sama lain
- [ ] Beberapa pohon & batu miring sedikit

---

## 9. Hasil verifikasi

| Pemeriksaan | Hasil |
|---|---|
| Keseimbangan kurung, 3 berkas (pemeriksa sadar-string) | ✅ Seimbang |
| Import menganggur | ✅ Nol temuan |
| `onEnterWorld` tidak dipanggil lagi | ✅ Hanya tersisa di tipe & komentar |
| Konversi sumbu Z konsisten | ✅ `worldZ = -localY` dipakai di semua perhitungan |

**Belum bisa saya verifikasi:** `npm run build` — `node_modules` tidak tersedia di
lingkungan kerja saya.

---

## 10. Kalau logo monumen masih kotak putih

Buka Console browser (F12). Kalau muncul:

```
[Brightoria] Berkas logo tidak ditemukan: /assets/brand/bright-icon.png
```

Berarti aset dari Patch 42 belum tersalin. Periksa:

```powershell
dir public\assets\brand
```

Harus ada `bright-icon.png` dan `bright-logo.png`.
