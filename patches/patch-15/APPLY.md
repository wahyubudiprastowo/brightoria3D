# Cara Pasang Patch 15 — Fix Background Flat, Dot Kecil, Warna Bri

## Ringkasan perbaikan dari screenshot Anda

| Masalah dilaporkan | Penyebab pasti | Perbaikan |
|---|---|---|
| Background masih flat | CSS `background-image` (Patch 12/13) sudah 2x dicoba, tetap tidak reliable di environment Anda — kemungkinan path/cache/copy file | **Strategi diubah total**: background sekarang dihitung PROSEDURAL di dalam Three.js (`SkyDome`, gradient biru→pink→emas), TIDAK bergantung file gambar/CSS sama sekali — tidak mungkin gagal lagi |
| Dot penghubung tidak terlihat | Ukuran 0.5 unit terlalu kecil, warna emas pucat kurang kontras | Diperbesar ke 0.85 unit (~70% lebih besar), warna dipertajam jadi emas vivid `#ffb703`, ditambah cincin putih kontras + halo lebih besar |
| Warna Bri tidak sesuai | Mesh terlalu kecil (0.34 unit) sehingga cuma tampak titik oranye; gradient linear halus membuat warna membaur jadi oranye netral | Diperbesar ke 0.85 unit (~2.5x), gradient diubah jadi **stop bertingkat** (55% maroon solid, 25% emas solid, transisi cepat di tengah) supaya dua warna jelas terpisah, ditambah efek emissive supaya terkesan menyala |

## File yang berubah

```
src/components/WorldScene.tsx          -> TIMPA total
src/components/BriMascot.tsx           -> TIMPA total
src/styles-patch15-notes.css           -> BARU (baca isinya, tidak perlu aksi CSS baru)
```

**Tidak ada file gambar baru** di patch ini — background sekarang murni
kode, bukan file.

## Langkah pemasangan

1. `Ctrl+C` hentikan `npm run dev`.
2. Timpa `src/components/WorldScene.tsx` dan `src/components/BriMascot.tsx`.
3. Baca `src/styles-patch15-notes.css` — cukup pastikan `.world { isolation:
   isolate; }` masih ada di `styles.css` Anda (dari Patch 11), tidak ada
   tindakan CSS baru yang wajib.
4. Jalankan:
   ```powershell
   npm run typecheck
   npm run build
   npm run dev
   ```
5. **Hard refresh**: `Ctrl+Shift+R`.

## Uji coba

1. **Background**: peta sekarang HARUS menampilkan gradient langit
   biru-pink-emas yang jelas (bukan flat lagi) — karena ini dihitung
   langsung oleh Three.js, tidak mungkin gagal tampil selama WebGL
   aktif (dan jika WebGL gagal total, fallback grid 2D otomatis muncul).
2. **Dot penghubung**: sekarang jauh lebih besar dan berwarna emas
   terang dengan cincin putih — harus terlihat jelas dari sudut/zoom
   manapun, dengan animasi denyut pelan.
3. **Maskot Bri**: sekarang berukuran ~2.5x lebih besar, dengan bagian
   bawah **maroon tegas** dan bagian atas **emas tegas** (bukan lagi
   blend oranye rata), plus tampak sedikit "menyala" (efek emissive).

## Jika background Three.js TETAP tidak terlihat setelah patch ini

Ini akan jadi sinyal penting: kemungkinan ada masalah WebGL context yang
lebih dalam di perangkat/browser Anda (bukan lagi soal file/CSS, karena
pendekatan ini sudah 100% kode, tidak ada file eksternal yang bisa gagal
dimuat). Jika ini terjadi, mohon:
1. Buka `F12` → tab **Console**, screenshot semua pesan error berwarna
   merah saat halaman peta dimuat.
2. Sebutkan browser & versi yang dipakai (Chrome/Edge/Firefox + versinya).

## Jika warna Bri masih dirasa kurang pas

Ini paling mudah disesuaikan lebih lanjut karena murni angka warna di
kode (`COLOR_TOP`/`COLOR_BOTTOM` di `BriMascot.tsx`) — beri tahu warna
seperti apa yang Anda inginkan (lebih merah? lebih oranye? lebih emas
terang?) dan saya sesuaikan presisi.
