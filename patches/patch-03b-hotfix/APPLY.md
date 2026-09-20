# Hotfix Patch 03b — Numeria Game Tidak Bisa Dimainkan

Ini **hotfix incremental**, bukan patch baru. Hanya 2 file yang berubah, tidak ada
dependency baru, tidak perlu `npm install` ulang.

## Kemungkinan penyebab yang diperbaiki
`NumeriaGame.tsx` versi Patch 03 memakai `<Environment preset="park" />` dari drei,
yang mengunduh file HDR dari server eksternal secara asynchronous. Jika koneksi
jaringan lambat/diblokir (seperti kasus npm registry sebelumnya), Canvas 3D bisa
macet blank tanpa pesan error — terlihat seperti "tidak bisa dimainkan" padahal
sebenarnya menunggu file yang tidak pernah datang.

Hotfix ini:
1. Menghapus total ketergantungan pada `<Environment>` (tidak butuh internet sama
   sekali untuk render 3D-nya).
2. Menambahkan error boundary di sekitar Canvas — jika WebGL tetap gagal render di
   perangkat tertentu, otomatis muncul mode fallback berbasis tombol teks biasa
   (tanpa 3D) supaya game tetap bisa diselesaikan.

## Cara pasang
1. Hentikan `npm run dev` (`Ctrl+C`).
2. Extract ZIP ini.
3. Timpa file berikut ke proyek Anda:
   ```
   src/game/numeria/NumeriaGame.tsx   → TIMPA file yang sudah ada
   ```
4. Buka `src/styles-numeria-hotfix-addon.css` dari ZIP ini, salin isinya, tempel
   di **baris paling bawah** `src/styles.css` Anda (setelah tambahan Patch 03
   sebelumnya, bukan menggantikannya).
5. Jalankan:
   ```powershell
   Set-Location 'C:\Users\WP2300419\Documents\VContainer\brightoria'
   npm run typecheck
   npm run build
   npm run dev
   ```
6. Buka browser, lakukan **hard refresh**: `Ctrl+Shift+R` (penting — browser bisa
   menyimpan cache bundle JS lama).
7. Klik **Pulau Numeria** → **Masuk dunia**.

## Jika masih belum muncul apa pun
Buka DevTools browser (tekan `F12`), klik tab **Console**, lalu screenshot atau
salin teks error berwarna merah yang muncul saat Anda klik "Masuk dunia". Itu akan
menunjukkan penyebab pastinya (berbeda dari error terminal npm).

Beberapa hal cepat untuk dicek juga:
- Pastikan folder `src/game/numeria/` benar-benar berisi 3 file:
  `levels.ts`, `evidence.ts`, `NumeriaGame.tsx` (bukan tidak sengaja tersalin ke
  dalam sub-folder tambahan seperti `brightoria-patch-03/src/game/numeria/...`).
- Pastikan `src/App.tsx` sudah versi Patch 03 (cek: apakah ada tulisan
  `import NumeriaGame from './game/numeria/NumeriaGame';` di baris awal file itu).
- Pastikan tidak ada error merah di terminal saat `npm run dev` berjalan.
