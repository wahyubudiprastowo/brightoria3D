# Cara Pasang Patch 03 (Extract & Copy-Paste Langsung)

Patch ini **incremental**, tidak mengganti `package.json`, tidak menambah dependency baru,
dan tidak memerlukan `npm install` ulang.

## 1. Tutup dulu server dev
Pada terminal yang menjalankan `npm run dev`, tekan `Ctrl+C`.

## 2. Extract ZIP
Ekstrak file `brightoria-patch-03-incremental.zip`. Anda akan melihat struktur:

```
brightoria-patch-03-incremental/
├── src/
│   ├── App.tsx
│   ├── game/
│   │   ├── progress.ts
│   │   └── numeria/
│   │       ├── levels.ts
│   │       ├── evidence.ts
│   │       └── NumeriaGame.tsx
│   └── styles-numeria-addon.css
├── docs/
│   └── agent-context/
│       └── PROJECT-MEMORY.md
├── CHANGELOG.md
├── PATCH_NOTES.md
└── patches/
    └── patch-03/
        └── APPLY.md   (file ini)
```

## 3. Copy-paste ke folder proyek
Salin (timpa/overwrite) seluruh isi folder hasil extract ke:

```
C:\Users\WP2300419\Documents\VContainer\brightoria
```

Artinya:
- `src\App.tsx`               → timpa file lama
- `src\game\progress.ts`      → timpa file lama
- `src\game\numeria\...`      → folder baru, salin apa adanya
- `docs\agent-context\PROJECT-MEMORY.md` → timpa file lama
- `CHANGELOG.md`, `PATCH_NOTES.md`       → timpa file lama

## 4. Satu langkah manual WAJIB — gabungkan CSS
File `src/styles-numeria-addon.css` **TIDAK BOLEH** menimpa `src/styles.css` yang sudah ada.

Buka `src/styles-numeria-addon.css`, salin seluruh isinya, lalu **tempelkan di baris paling
bawah** file `src/styles.css` yang sudah ada di proyek Anda. Setelah ditempel, file
`styles-numeria-addon.css` boleh dihapus (opsional, tidak wajib).

## 5. Jalankan kembali
```powershell
Set-Location 'C:\Users\WP2300419\Documents\VContainer\brightoria'
npm run typecheck
npm run build
npm run dev
```

Tidak perlu menghapus `node_modules`, tidak perlu `npm install` lagi.

## 6. Uji coba
1. Buka `http://localhost:5173`.
2. Klik pulau **Pulau Numeria**.
3. Klik **Masuk dunia**.
4. Game jembatan pecahan akan terbuka (bukan lagi demo generik).
5. Ketuk beberapa balok jembatan sampai jumlahnya sesuai target (misalnya "Target 1/4").
6. Klik **Sambungkan jembatan**.
7. Jika benar → balok berubah warna emas, tombol berubah menjadi **Level berikutnya**, XP +30.
8. Jika salah → muncul feedback penjelasan, balok berwarna merah, boleh klik **Ulangi**.
9. Selesaikan seluruh 5 level untuk melihat ringkasan mastery Pulau Numeria.
10. Kembali ke peta, refresh browser — pastikan progres tidak hilang (tersimpan di localStorage).
11. Buka mode **Orang Tua** — bagian "Perlu dukungan" akan otomatis menyebutkan mastery Pulau
    Numeria setelah Anda menyelesaikan minimal satu level.
