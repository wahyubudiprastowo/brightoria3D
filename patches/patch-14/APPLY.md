# Cara Pasang Patch 14 — Ganti Maskot Primitif dengan Mesh 3D Asli Bri

## Apa yang dilakukan patch ini

Anda mengunggah `brichar_mesh.glb` — hasil image-to-3D dari concept art
lentera Bri. Setelah dibedah teknis:

```text
Vertex           : 145.551
Triangle         : ~291.108
Atribut tersedia : HANYA posisi (POSITION)
Material/tekstur : TIDAK ADA sama sekali (murni "white mesh" mentah)
```

Karena file ini benar-benar polos tanpa warna, saya lakukan dua langkah
wajib supaya bisa tampil dengan benar di Three.js:

1. **Hitung ulang normal vertex** (`computeVertexNormals()`) — tanpa ini,
   mesh akan terlihat gelap/hitam rata karena Three.js tidak tahu arah
   permukaan menghadap mana untuk pencahayaan.
2. **Terapkan gradient warna maroon→emas** berdasarkan posisi vertikal
   tiap titik mesh (bagian atas emas, bagian bawah maroon) — meniru palet
   lentera Bri dari concept art, TANPA memerlukan file tekstur terpisah
   (karena memang tidak ada).

Mesh juga otomatis dipusatkan dan diskalakan supaya ukurannya konsisten
dengan posisi maskot yang sudah ada di peta (tidak perlu mengubah
`WorldScene.tsx` sama sekali — hanya `BriMascot.tsx` yang berubah).

## ⚠️ Catatan jujur soal keterbatasan

1. **Warna ini APROKSIMASI**, bukan warna asli dari seniman. Karena file
   GLB tidak membawa material/tekstur sama sekali, gradient maroon-emas
   adalah cara terbaik yang bisa saya lakukan tanpa data warna asli. Jika
   nanti Anda memperoleh versi GLB yang sudah melalui tahap texturing
   (bukan cuma mesh mentah), kirimkan — saya akan gunakan warna aslinya.
2. **Ukuran file besar (5,2 MB) dan highpoly (~291 ribu triangle)**. Tidak
   ada tool kompresi (Draco/gltfpack) di lingkungan pembuatan patch ini,
   jadi file dikirim apa adanya. Untuk satu maskot kecil ini seharusnya
   masih lancar di browser desktop dan HP kelas menengah-atas, tapi kalau
   nanti terasa berat khususnya di build Android, pertimbangkan proses
   "Decimate" mesh di Blender (turunkan ke ~20-30 ribu triangle) sebelum
   dipakai produksi massal.
3. Ada **fallback otomatis**: jika file gagal dimuat (misalnya lupa
   ter-copy ke folder yang benar), maskot akan otomatis kembali ke bentuk
   bola sederhana alih-alih membuat seluruh peta gagal render.

## File yang berubah/baru

```
src/components/BriMascot.tsx           -> TIMPA total
public/assets/models/bri.glb           -> BARU (5,2 MB, mesh asli Anda)
```

**`WorldScene.tsx` TIDAK berubah** dari Patch 13 — tidak perlu ditimpa
lagi jika sudah terpasang.

## Langkah pemasangan

1. `Ctrl+C` hentikan `npm run dev`.
2. Timpa `src/components/BriMascot.tsx`.
3. Buat folder `public/assets/models/` jika belum ada, salin `bri.glb` ke
   dalamnya. Path akhirnya harus persis:
   ```
   public/assets/models/bri.glb
   ```
4. Jalankan:
   ```powershell
   npm run typecheck
   npm run build
   npm run dev
   ```
5. **Hard refresh**: `Ctrl+Shift+R`.

## Uji coba

1. Buka peta, perhatikan area dekat pulau yang sedang aktif.
2. Maskot sekarang **bukan lagi bola/primitif sederhana** — bentuknya
   mengikuti mesh 3D asli hasil generate Anda, dengan gradasi warna
   maroon di bagian bawah dan emas di bagian atas.
3. Klik pulau lain — maskot tetap bereaksi (skala membesar-mengecil
   cepat) lalu mengekor pindah ke pulau baru, animasi dari Patch 13
   dipertahankan.
4. Jika maskot TIDAK muncul sama sekali atau kembali jadi bola merah
   polos: buka DevTools (`F12`) → tab **Network**, cari request ke
   `bri.glb` — pastikan statusnya `200` (bukan `404`). Kalau `404`, berarti
   file belum ada di path `public/assets/models/bri.glb` yang benar.

## Langkah lanjutan yang bisa dipertimbangkan

- Jika Anda punya/bisa membuat versi GLB yang sudah bertekstur asli
  (bukan cuma mesh polos), kirimkan — saya akan integrasikan warna
  aslinya menggantikan gradient buatan ini.
- Pertimbangkan proses decimate/optimize mesh sebelum build Android
  produksi, mengingat ukurannya cukup besar untuk platform mobile.
