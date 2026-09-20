# Cara Pasang Patch 04 (Extract & Copy-Paste Langsung)

Patch ini **lebih besar dari patch sebelumnya** (folder `public/assets/`
baru, `styles.css` full rewrite, `main.tsx`/`ErrorBoundary.tsx` baru), tapi
**tidak ada dependency baru** — `package.json` tidak berubah, tidak perlu
`npm install` ulang.

## 1. Hentikan dev server
Pada terminal yang menjalankan `npm run dev`, tekan `Ctrl+C`.

## 2. Extract ZIP
Ekstrak `brightoria-patch-04.zip`. Struktur:

```
brightoria-patch-04/
├── public/
│   └── assets/
│       ├── worlds/    (6 gambar pulau .webp)
│       └── map/       (aset pendukung: glow, ring, cloud, dll)
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── ErrorBoundary.tsx
│   ├── styles.css                (FILE LENGKAP — timpa total)
│   ├── vite-env.d.ts
│   ├── components/WorldScene.tsx
│   ├── data/worlds.ts
│   └── game/
│       ├── progress.ts
│       └── numeria/ (levels.ts, evidence.ts, NumeriaGame.tsx)
├── docs/ (5 dokumen, semua diperbarui)
├── AGENTS.md, CHANGELOG.md, PATCH_NOTES.md
└── patches/patch-04/APPLY.md  (file ini)
```

## 3. Copy-paste ke folder proyek — TIMPA SEMUA

Salin (timpa) seluruh isi folder hasil extract ke:

```
C:\Users\WP2300419\Documents\VContainer\brightoria
```

Ini artinya folder `public\` dan `src\` di proyek Anda akan **tertimpa
seluruhnya** oleh isi ZIP ini. Ini SENGAJA — jangan khawatir, semua fitur
dari patch sebelumnya (Numeria game, badge, dll) sudah termasuk di dalam
file yang baru ini, tidak ada yang hilang.

**PENTING:** Kali ini **TIDAK ADA langkah manual gabung CSS**. Cukup timpa
`src/styles.css` apa adanya — file ini sudah lengkap berisi semua style
dari awal sampai sekarang.

## 4. Jalankan kembali

```powershell
Set-Location 'C:\Users\WP2300419\Documents\VContainer\brightoria'
npm run typecheck
npm run build
npm run dev
```

Tidak perlu menghapus `node_modules`, tidak perlu `npm install` lagi.

## 5. WAJIB: hard refresh browser

```
Ctrl+Shift+R
```

## 6. Uji coba

1. Buka `http://localhost:5173`.
2. **Perhatikan peta** — sekarang seharusnya menampilkan 6 ilustrasi pulau
   bergambar detail (bukan lagi bentuk kotak/kerucut sederhana).
3. Klik **Pulau Numeria** (kanan atas peta).
4. Panel misi menampilkan badge hijau **"Game tersedia"**.
5. Klik **"Mainkan sekarang"**.
6. **Game Fraction Bridge harus terbuka** — jika ini berhasil, masalah
   sebelumnya sudah selesai.
7. Selesaikan atau coba beberapa level, tutup game, klik dunia lain
   (misalnya Taman Al-Qur'an) — badge berubah krem "Segera hadir · mode
   demo", tombol "Lihat demo" membuka modal demo seperti biasa.

## 7. Jika MASIH belum bisa dimainkan

Ini sudah iterasi keempat perbaikan untuk masalah yang sama, jadi jika
masih terjadi, kemungkinan besar penyebabnya sudah bukan lagi soal file
atau CSS. Mohon:

1. Klik "Mainkan sekarang" pada Pulau Numeria.
2. **Screenshot SELURUH layar** persis setelah mengklik.
3. Dengan `AppErrorBoundary` yang baru, jika ada error, akan muncul kotak
   pesan merah muda berjudul "Terjadi kendala teknis" — screenshot itu
   sudah cukup untuk diagnosis lanjutan, tidak perlu buka DevTools.
4. Jika benar-benar tidak ada perubahan apa pun di layar (bukan kotak
   error, benar-benar diam), tekan `F12` → tab **Console** → screenshot
   isinya juga.
