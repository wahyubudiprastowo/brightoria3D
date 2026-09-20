# Cara Pasang Patch 21 — Fix Tampilan Berantakan (CSS Mandiri, Zero Manual Step)

## Apa yang terjadi

Screenshot Anda menunjukkan gambar rubah tampil raksasa, memenuhi layar,
tumpang tindih dengan peta di belakangnya, dan daftar koleksi kosakata
tampil sebagai list mentah berantakan. Ini terjadi karena CSS
(`styles-arabic-oasis-addon.css`) yang seharusnya ditempel manual ke
`src/styles.css` **tidak pernah berhasil ter-load** — kemungkinan besar
karena langkah manual ini terlewat di tengah proses debug error
TypeScript Patch 19/20 sebelumnya.

## Perbaikan permanen di Patch 21

**Tidak ada lagi CSS terpisah yang harus ditempel manual.** Seluruh
styling sekarang **disuntikkan otomatis** oleh kode `ArabicGame.tsx`
sendiri begitu game dibuka — persis seperti cara kerja library
CSS-in-JS modern. Begitu Anda timpa satu file ini, styling **otomatis
aktif**, tidak ada langkah lain yang mungkin lupa dilakukan.

Sebagai lapis pertahanan tambahan, ukuran gambar maskot (rubah & ransel)
juga diberi batasan ukuran langsung di kode (`style={{width: 110}}`),
jadi bahkan dalam skenario ekstrem sekalipun, gambar tidak akan tampil
raksasa lagi.

## File yang berubah

**Hanya satu file yang berubah** dari Patch 20:

```
src/game/arabic/ArabicGame.tsx   -> TIMPA TOTAL (CSS kini otomatis)
```

File lain (`curriculum.ts`, `levels.ts`, `evidence.ts`, `arabicSfx.ts`,
kedua gambar) **tidak berubah** dari Patch 20 — disertakan lengkap di
zip ini supaya Anda bisa menimpa semuanya sekaligus tanpa perlu
mencari-cari file mana yang baru.

**Anda BOLEH mengabaikan/menghapus** baris CSS yang mungkin sudah
sempat Anda tempel di `styles.css` dari Patch 18/19/20 sebelumnya
(class `.oasis-*`) — tidak akan konflik jika dibiarkan, tapi juga tidak
lagi diperlukan.

## Langkah pemasangan

1. `Ctrl+C` hentikan `npm run dev`.
2. Timpa **seluruh isi folder** `src/game/arabic/` dengan 5 file dari
   zip ini (`ArabicGame.tsx`, `curriculum.ts`, `levels.ts`, `evidence.ts`,
   `arabicSfx.ts`).
3. Pastikan `public/assets/arabic/fox-explorer.webp` dan
   `backpack.webp` ada (disertakan di zip ini, timpa untuk memastikan).
4. Jalankan:
   ```powershell
   npm run typecheck
   npm run build
   npm run dev
   ```
5. **Hard refresh**: `Ctrl+Shift+R`.

## Uji coba

1. Pastikan Anda membuka aplikasi di **halaman utama** (`http://localhost:5173/`),
   BUKAN `http://localhost:5173/admin` — URL `/admin` di screenshot Anda
   tidak dikenali sebagai bagian dari alur normal Brightoria; jika itu
   memang route khusus di proyek Anda (misalnya panel developer), mohon
   uji ulang dari halaman utama supaya kita bandingkan apple-to-apple.
2. Klik Pulau Oasis Bahasa Arab → Mainkan sekarang.
3. Game sekarang harus tampil sebagai **modal terpusat** dengan latar
   gelap di belakangnya (bukan menyatu transparan dengan peta).
4. Gambar rubah di header harus berukuran **kecil (ikon 40px)**, dan di
   layar pembuka pos berukuran **sedang (110px)** — bukan lagi raksasa.
5. Klik salah satu pos → layar pembuka rapi dengan rubah di tengah →
   "Mulai petualangan".
6. Buka **Koleksi** — grid kartu kosakata rapi berjajar (bukan list
   memanjang berantakan).

## Jika masih ada masalah tampilan setelah patch ini

Karena CSS sekarang 100% dari kode (tidak ada lagi faktor "lupa
tempel"), jika masih ada yang aneh, kemungkinan penyebabnya berbeda.
Mohon screenshot ulang dan sebutkan apakah diambil dari halaman utama
(bukan `/admin`).
