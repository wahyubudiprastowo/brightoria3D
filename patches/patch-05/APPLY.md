# Cara Pasang Patch 05 (Extract & Copy-Paste Langsung)

Penggantian penuh folder `src/` dan `public/`. **Tidak ada dependency
baru** — tidak perlu `npm install` ulang.

## 1. Hentikan dev server
`Ctrl+C` pada terminal yang menjalankan `npm run dev`.

## 2. Extract ZIP
Struktur:

```
brightoria-patch-05/
├── public/assets/worlds/    (6 gambar pulau .webp)
├── public/assets/map/       (cloud, glow, ring, shadow)
├── src/
│   ├── App.tsx, main.tsx, ErrorBoundary.tsx, styles.css (file lengkap)
│   ├── components/WorldScene.tsx   (BARU: Three.js billboard)
│   ├── data/worlds.ts               (BARU: posisi 3D + gambar)
│   └── game/ (progress.ts, numeria/...)
├── docs/ (5 dokumen, semua diperbarui)
├── AGENTS.md, CHANGELOG.md, PATCH_NOTES.md
└── patches/patch-05/APPLY.md (file ini)
```

## 3. Copy-paste ke folder proyek — TIMPA SEMUA

Salin (timpa) seluruh isi folder hasil extract ke:

```
C:\Users\WP2300419\Documents\VContainer\brightoria
```

Folder `public\` dan `src\` akan tertimpa seluruhnya — ini sengaja, semua
fitur sebelumnya sudah termasuk di file baru ini.

## 4. Jalankan kembali

```powershell
Set-Location 'C:\Users\WP2300419\Documents\VContainer\brightoria'
npm run typecheck
npm run build
npm run dev
```

## 5. WAJIB: hard refresh browser

```
Ctrl+Shift+R
```

Ini PENTING kali ini — perubahan dari peta datar (Patch 04) ke peta 3D
(Patch 05) cukup besar, browser sangat mungkin masih menyimpan bundle lama.

## 6. Uji coba

1. Buka `http://localhost:5173`.
2. Peta sekarang menampilkan 6 pulau dengan ilustrasi detail, MELAYANG
   dengan animasi halus.
3. **Klik dan tahan mouse (atau sentuh dan geser di HP), lalu gerakkan** —
   kamera harus berputar mengelilingi peta, pulau-pulau tetap menghadap
   Anda (efek billboard).
4. **Scroll mouse (atau cubit di HP)** — tampilan memperbesar/mengecil.
5. Klik salah satu pulau — muncul glow, ring seleksi, dan panel misi di
   kanan terbuka.
6. Klik **Pulau Numeria** → **Mainkan sekarang** → game Fraction Bridge
   harus terbuka seperti biasa.
7. Buka `docs/gameplay/GAMEPLAY-CATALOG.md` di editor teks — pastikan
   berisi kurikulum konkret (jenjang tajwid, tema adab, dst), bukan lagi
   placeholder generik.

## 7. Jika peta masih terlihat datar / tidak bisa diputar

1. Pastikan langkah 5 (hard refresh) sudah dilakukan.
2. Coba tutup semua tab browser untuk `localhost:5173`, buka tab baru.
3. Jika masih bermasalah, buka `F12` → tab **Console**, screenshot isinya
   dan kirimkan — `WorldSceneErrorBoundary` seharusnya sudah menampilkan
   fallback grid 2D (bukan diam total) jika WebGL memang gagal di
   perangkat Anda, jadi screenshot akan menunjukkan penyebabnya.
