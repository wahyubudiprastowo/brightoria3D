# Cara Pasang Patch 03c (Extract & Copy-Paste Langsung)

Patch ini **incremental**: tidak mengganti `package.json`, tidak menambah
dependency baru, tidak perlu `npm install` ulang.

## 1. Hentikan dev server
Pada terminal yang menjalankan `npm run dev`, tekan `Ctrl+C`.

## 2. Extract ZIP
Ekstrak `brightoria-patch-03c.zip`. Anda akan melihat struktur:

```
brightoria-patch-03c/
├── src/
│   ├── App.tsx
│   └── styles-badge-addon.css
├── docs/
│   ├── agent-context/PROJECT-MEMORY.md
│   ├── gameplay/GAMEPLAY-CATALOG.md
│   ├── technical/TECHNICAL-ARCHITECTURE.md
│   ├── product/NEXT-STEPS.md
│   └── history/CHANGELOG-FULL.md
├── AGENTS.md
├── CHANGELOG.md
├── PATCH_NOTES.md
└── patches/patch-03c/APPLY.md   (file ini)
```

## 3. Copy-paste ke folder proyek
Salin (timpa) seluruh isi folder hasil extract ke:

```
C:\Users\WP2300419\Documents\VContainer\brightoria
```

Artinya:
- `src\App.tsx` → **TIMPA** file lama (sudah termasuk semua fitur Patch 03,
  jangan khawatir kehilangan fitur — file ini dibangun di atas versi Patch 03
  yang sudah bekerja, hanya ditambah badge dan teks yang lebih jelas)
- `src\styles-badge-addon.css` → file baru, salin apa adanya
- `docs\...` → timpa/tambahkan sesuai struktur folder
- `AGENTS.md`, `CHANGELOG.md`, `PATCH_NOTES.md` → timpa file lama

## 4. Satu langkah manual WAJIB — tambahkan CSS badge
Buka `src/styles-badge-addon.css` dari hasil extract, salin seluruh isinya,
lalu **tempelkan di baris paling bawah** file `src/styles.css` Anda yang
sudah ada (setelah tambahan CSS Patch 03 dan 03b sebelumnya). Urutan akhir
yang benar di `styles.css`:

```
[isi asli styles.css dari Patch 02]
[isi styles-numeria-addon.css dari Patch 03]
[isi styles-numeria-hotfix-addon.css dari Patch 03b]
[isi styles-badge-addon.css dari Patch 03c]   ← tambahan baru ini
```

## 5. Jalankan kembali
```powershell
Set-Location 'C:\Users\WP2300419\Documents\VContainer\brightoria'
npm run typecheck
npm run build
npm run dev
```

Tidak perlu menghapus `node_modules`, tidak perlu `npm install` lagi.

## 6. WAJIB: hard refresh browser
```
Ctrl+Shift+R
```
Ini penting — browser sering menyimpan cache bundle JS lama, sehingga
perubahan tidak terlihat meski kode sudah benar.

## 7. Uji coba — cara memastikan sudah benar

1. Buka `http://localhost:5173`.
2. Klik pulau **Pulau Numeria** (kanan atas peta, warna biru).
3. Perhatikan panel misi di kanan: sekarang ada badge **hijau** bertuliskan
   "Game tersedia", dan tombol bertuliskan **"Mainkan sekarang"**.
4. Klik tombol tersebut → game Fraction Bridge terbuka (bukan modal
   Objek A/B/C).
5. Tutup game (tombol X), klik pulau **lain** misalnya Taman Al-Qur'an.
6. Perhatikan panel misi sekarang menampilkan badge **krem** bertuliskan
   "Segera hadir · mode demo", dan tombol bertuliskan **"Lihat demo"**.
7. Klik tombol tersebut → modal demo generik terbuka, dengan teks yang
   sekarang secara eksplisit menyebutkan "Coba Pulau Numeria di peta untuk
   memainkan game yang sudah selesai dibangun."

Jika langkah 3-4 berhasil menampilkan game Fraction Bridge, berarti patch
sudah terpasang dengan benar dan masalah sebelumnya sudah selesai — itu
memang bukan bug, hanya salah pulau yang diklik.
