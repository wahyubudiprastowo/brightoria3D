# Cara Pasang Patch 19 — Oasis Bahasa Arab (PENGGANTI LANGSUNG, Zero App.tsx Edit)

## ⚠️ Perbedaan penting dari Patch 18

Patch 18 kemarin gagal tampil karena file game barunya diletakkan di
folder TERPISAH (`src/game/arabic-oasis/`) yang butuh Anda mengedit
`App.tsx` secara manual untuk menyambungkannya — dan langkah itu ternyata
tidak berhasil dilakukan (App.tsx masih memanggil game lama).

**Patch 19 memperbaiki ini secara struktural**: file baru kali ini
**MENIMPA LANGSUNG** file game lama di path yang PERSIS SAMA
(`src/game/arabic/ArabicGame.tsx`), dengan nama komponen dan
signature props yang sama persis. Artinya begitu Anda timpa file ini,
`App.tsx` **otomatis** memanggil versi baru — **TIDAK ADA edit App.tsx
sama sekali yang diperlukan**.

## Apa yang baru di Patch 19

1. **Konten asli 17 pelajaran** dari buku ajar "Al-Mumtaaz Untuk Anak
   Jilid 1" (bukan lagi 72 kartu draft generik) — berjenjang dari salam
   & perkenalan (paling dasar) sampai warna bagian 2 (paling lanjutan).
2. **Progresi terkunci** — pos berikutnya baru terbuka setelah pos
   sebelumnya dapat minimal 1 bintang, memastikan urutan belajar dasar
   → mastery yang Anda minta.
3. **Maskot baru**: rubah gurun penjelajah (gambar asli, bukan emoji),
   tampil di header, kartu pembuka pos, dan layar hasil.
4. **Efek suara gameplay** (sintesis Web Audio API — bukan musik latar,
   tetap sesuai prinsip Brightoria): bunyi klik, jawaban benar/salah,
   kata baru masuk koleksi, dan pos selesai sempurna.
5. **Buku Koleksi** bertema ransel emas (gambar asli) — semua kata yang
   pernah dijawab benar tersimpan permanen di sana.
6. **Juice kit** (confetti, streak beruntun, animasi punch) tetap
   terintegrasi seperti game lain.

## ⚠️ Catatan jujur — batasan aset yang WAJIB diketahui

1. **Tidak ada video** — saya tidak punya kemampuan generate video di
   lingkungan kerja saya. Yang ditingkatkan adalah gambar diam (maskot,
   ikon koleksi) dan animasi CSS/canvas (confetti, punch, dll), bukan
   video.
2. **Suara adalah efek sintesis, BUKAN rekaman pelafalan Arab.** Anak
   tetap perlu belajar cara mengucapkan kata dari pengajar/orang tua
   langsung — game ini tidak menggantikan itu.
3. **Emoji tetap dipakai sebagai bantu-visual** untuk kosakata (bukan
   ilustrasi asli buku, yang berupa foto tidak bisa diekstrak jadi aset
   lepas). Beberapa kata (delima, kurma, pepaya) pakai placeholder warna
   karena tidak ada emoji standar yang pas — ditandai di kode.
4. Konten kosakata **tetap berstatus draft menunggu pengesahan** tim
   akademik Bright Academy meski sumbernya sudah dari buku ajar resmi
   (bukan draft AI murni lagi).

## File yang berubah (SEMUA menimpa file yang sudah ada di path ini)

```
src/game/arabic/ArabicGame.tsx     -> TIMPA TOTAL (path sama persis)
src/game/arabic/curriculum.ts       -> TIMPA/BUAT BARU (path sama)
src/game/arabic/levels.ts           -> TIMPA/BUAT BARU (path sama)
src/game/arabic/evidence.ts         -> TIMPA/BUAT BARU (path sama)
src/game/arabic/arabicSfx.ts        -> BARU (path sama, file tambahan)
public/assets/arabic/fox-explorer.webp  -> BARU (aset gambar)
public/assets/arabic/backpack.webp      -> BARU (aset gambar)
src/styles-arabic-oasis-addon.css   -> BARU (tempel ke styles.css)
```

## Langkah pemasangan (SEDERHANA — tidak ada langkah App.tsx)

1. `Ctrl+C` hentikan `npm run dev`.
2. Buka folder `src/game/arabic/` di proyek Anda.
3. **Timpa/tambahkan** kelima file `.ts`/`.tsx` di atas persis di folder
   tersebut (nama file harus sama persis: `ArabicGame.tsx`, `curriculum.ts`,
   `levels.ts`, `evidence.ts`, `arabicSfx.ts`).
4. Buat folder `public/assets/arabic/` jika belum ada, salin kedua file
   gambar (`fox-explorer.webp`, `backpack.webp`) ke sana.
5. Salin isi `src/styles-arabic-oasis-addon.css`, tempelkan di **baris
   paling bawah** `src/styles.css` Anda.
6. Jalankan:
   ```powershell
   npm run typecheck
   npm run build
   npm run dev
   ```
7. **Hard refresh**: `Ctrl+Shift+R`.

## Uji coba

1. Klik Pulau Oasis Bahasa Arab → Mainkan sekarang.
2. **Peta 17 pos** muncul dengan maskot rubah kecil di header — hanya
   Pos 1 (Salam & Perkenalan) yang terbuka.
3. Klik Pos 1 → muncul **layar pembuka** dengan gambar rubah besar dan
   deskripsi pelajaran → klik "Mulai petualangan".
4. Jawab soal dialog (mis. "مَا اسْمُكَ؟") — dengar bunyi "ting" saat
   benar, bunyi lembut saat salah (bukan bunyi mengejek).
5. Selesaikan pos → layar hasil dengan bintang + gambar rubah melompat
   + confetti.
6. Kembali ke peta → **Pos 2 sekarang terbuka**.
7. Mainkan Pos 2 (Anggota Tubuh, kosakata) — perhatikan soal
   berselang-seling arah (kata→arti, arti→kata) dan bunyi "kilau" extra
   saat kata BARU pertama kali masuk koleksi.
8. Klik tombol **Koleksi** — buku koleksi dengan ikon ransel emas
   menampilkan semua kata yang sudah dikumpulkan.

## Jika MASIH belum berubah setelah patch ini

Kalau setelah langkah di atas game masih menampilkan versi lama, itu
berarti ada file `ArabicGame.tsx` DUPLIKAT di path lain yang mungkin
diimpor App.tsx (bukan `src/game/arabic/ArabicGame.tsx`). Mohon jalankan
pencarian berikut di VS Code (Ctrl+Shift+F) untuk memastikan:

```
cari teks: from './game/arabic/ArabicGame'
```

dan pastikan hasilnya menunjuk ke path yang barusan Anda timpa. Jika ada
lebih dari satu hasil atau path berbeda, beri tahu saya persis apa yang
muncul.
