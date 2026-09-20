# Cara Pasang Patch 24 — Gameplay Pemula, Warna Berwarna-warni, Maskot Menonjol

## Pemikiran di balik perubahan ini (sesuai permintaan Anda "coba dipikirkan dulu")

Materi 16 dari 17 pos adalah **kosakata konkret bergambar** (anggota tubuh, kelas, angka, keluarga, rumah, buah, makanan, minuman, warna). Untuk anak yang benar-benar baru belajar, mekanik yang paling tepat BUKAN langsung kuis pilihan ganda (itu menuntut "sudah tahu jawabannya"), melainkan **permainan mencocokkan kartu (memory/pairs game)** — metode klasik pengajaran bahasa untuk anak: membalik kartu emoji dan kartu kata Arab, mencari pasangannya, **tanpa tekanan benar/salah** (kartu yang salah cukup dibalik lagi, tidak ada penalti/nyawa).

**Alur baru untuk 16 pos kosakata:**
```
Peta → Intro → COCOKKAN KARTU (baru) → Kuis (existing) → Hasil
```
Pelajaran 1 (dialog salam) tetap memakai kartu-flash + kuis dialog seperti sebelumnya, karena kalimat dialog penuh tidak cocok dipotong jadi kartu pendek.

## Tiga perbaikan dari feedback Anda

| Masalah | Perbaikan |
|---|---|
| "Warnanya jadi aneh" | Diganti dari monokrom coklat/krem menjadi **5 warna kategori berbeda** (teal, coral, emas, plum, biru langit) yang bergantian per pos — peta jadi berwarna-warni ala skill-tree. Kartu terkunci dibuat abu-abu jelas supaya kontras "bisa main vs terkunci" langsung terlihat |
| "Karakter musangnya gak keliatan, kurang menarik" | Diperbesar signifikan (56px header, 120px layar pembuka), ditambah animasi mengambang halus, DAN ditambahkan **panel sapaan besar** di peta (96px + teks sapaan dinamis sesuai progres) |
| "Gameplay untuk anak pemula" | Ditambahkan **mode Cocokkan Kartu** (memory game) sebagai langkah utama sebelum kuis untuk 16 pos kosakata |

## File yang berubah

```
src/game/arabic/ArabicGame.tsx   -> TIMPA TOTAL (redesign besar)
src/game/arabic/curriculum.ts   -> TIMPA (tidak berubah dari Patch 23)
src/game/arabic/levels.ts       -> TIMPA (tidak berubah dari Patch 23)
src/game/arabic/evidence.ts     -> TIMPA (tidak berubah dari Patch 23)
src/game/arabic/arabicSfx.ts    -> TIMPA (tidak berubah dari Patch 23)
src/game/arabic/arabicTts.ts    -> TIMPA (tidak berubah dari Patch 23)
```

Semua file disertakan lengkap supaya Anda bisa menimpa satu folder sekaligus.

## Langkah pemasangan

1. `Ctrl+C` hentikan `npm run dev`.
2. Timpa **seluruh isi folder** `src/game/arabic/` dengan 6 file dari zip ini.
3. Pastikan `public/assets/arabic/fox-explorer.webp` dan `backpack.webp` tetap ada.
4. Jalankan:
   ```powershell
   npm run typecheck
   npm run build
   npm run dev
   ```
5. **Hard refresh**: `Ctrl+Shift+R`.

## Uji coba

1. Klik Pulau Oasis Bahasa Arab → perhatikan **peta sekarang berwarna-warni** (setiap pos punya warna berbeda: teal, coral, emas, plum, biru), bukan lagi monoton coklat.
2. Perhatikan **panel sapaan besar** di atas peta dengan gambar rubah 96px dan teks sapaan.
3. Klik **Pos 2 (Anggota Tubuh)** → tombol sekarang **"Ayo main cocok-cocokan!"**.
4. Klik tombol itu → muncul **grid kartu tertutup** (ikon pohon palem 🌴). Ketuk 2 kartu — jika kata Arab dan emoji-nya cocok, kartu tetap terbuka dengan warna emas; jika tidak cocok, otomatis tertutup lagi setelah sesaat.
5. Setelah semua pasangan ditemukan → layar selesai dengan rubah melompat, jumlah percobaan, +15 XP, tombol "Main lagi" atau "Lanjut ke tantangan".
6. Lanjut ke kuis seperti biasa untuk meraih bintang.
7. Klik **Pos 1 (Salam & Perkenalan)** → alurnya tetap sama seperti Patch 22/23 (kartu flash → kuis dialog), karena materi dialog tidak cocok dipotong jadi kartu pendek.

## Yang tetap sama dari Patch 23

- Font Arab "Noto Naskh Arabic"
- Tombol "Dengarkan" (Web Speech API) — otomatis muncul jika perangkat punya suara Arab
- Rebrand "Bright Academy"
- Struktur 17 pos berjenjang, sistem bintang, buku koleksi kosakata

## Jika ukuran kartu cocokkan terlalu kecil/besar di layar Anda

Grid kartu otomatis menyesuaikan 4 kolom di desktop dan 3 kolom di layar sempit (mobile) — beri tahu saya jika masih terasa kurang pas di perangkat Anda, mudah disesuaikan lebih lanjut.
