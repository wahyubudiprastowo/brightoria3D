# Cara Pasang Patch 22 — Fase Belajar, Font Arab Baru, Kuis Bergaya Kartu

## Tiga masalah yang diperbaiki dari feedback Anda

| Masalah dilaporkan | Perbaikan |
|---|---|
| "Terlalu sulit untuk awal belajar, tidak ada keterangan" | Ditambahkan **fase BELAJAR (kartu flash)** sebelum kuis — setiap kata ditampilkan besar dengan emoji, huruf Arab, transliterasi, dan arti. Bisa maju-mundur bebas, tombol "Aku siap, mulai tantangan!" baru aktif setelah semua kartu dilihat |
| "Font Arab kurang menarik" | Diimpor font khusus **Noto Naskh Arabic** (Google Fonts, dirancang untuk kejelasan harakat/tashkeel), ukuran font Arab diperbesar signifikan di semua tempat |
| "Seperti ujian pilihan ganda biasa" | Opsi jawaban sekarang berupa **kartu grid 2 kolom** dengan emoji besar (untuk soal "arti → kata"), bukan lagi list teks polos. Kartu belajar juga punya animasi flip saat muncul |

## Alur baru per pos (5 tahap, sebelumnya cuma 3)

```
1. Peta 17 pos (tidak berubah)
2. Layar pembuka pos — tombol sekarang "Ayo belajar dulu!" (bukan langsung
   "Mulai petualangan")
3. BARU: Fase Belajar — kartu flash satu-per-satu, ketuk kartu untuk lihat
   arti, navigasi ◀ ▶, wajib lihat semua kartu dulu sebelum lanjut
4. Kuis — sekarang bergaya kartu visual, bukan list ujian
5. Hasil — tombol "Belajar lagi" (bukan "Ulangi") mengarah balik ke fase
   belajar, bukan langsung ke kuis lagi
```

## File yang berubah

**Hanya 1 file yang berubah secara signifikan:**
```
src/game/arabic/ArabicGame.tsx   -> TIMPA TOTAL (fase belajar + font + kartu)
```

File lain (`curriculum.ts`, `levels.ts`, `evidence.ts`, `arabicSfx.ts`,
kedua gambar) disertakan lengkap di zip ini (isinya sama seperti Patch
21/20, hanya dibangun ulang) supaya Anda bisa menimpa semuanya sekaligus
tanpa perlu mencari file mana yang baru.

**Catatan kecil**: `levels.ts` di zip ini punya sedikit penyesuaian
internal (menambah field `promptEmoji`/`optionEmojis` untuk mendukung
tampilan kartu baru) — tetap 100% kompatibel dengan `evidence.ts` dan
`App.tsx`, tidak mengubah kontrak yang sudah cocok sejak Patch 20.

## Soal font Arab dari internet

Font "Noto Naskh Arabic" dimuat dari Google Fonts (`fonts.googleapis.com`)
lewat tag `<link>` yang disuntik otomatis oleh kode — ini SAMA seperti
font "Nunito" yang kemungkinan sudah dipakai di `styles.css` utama proyek
Anda sejak awal (font Google Fonts lain sudah pasti berhasil dimuat kalau
tampilan teks Latin sudah normal selama ini). Jika karena suatu hal
koneksi ke Google Fonts terblokir di jaringan Anda, teks Arab tetap akan
tampil (fallback ke font serif sistem), hanya kurang optimal
kejelasannya.

## Langkah pemasangan

1. `Ctrl+C` hentikan `npm run dev`.
2. Timpa **seluruh isi folder** `src/game/arabic/` dengan 5 file dari
   zip ini.
3. Pastikan `public/assets/arabic/fox-explorer.webp` dan `backpack.webp`
   ada (disertakan, timpa untuk memastikan sama).
4. Jalankan:
   ```powershell
   npm run typecheck
   npm run build
   npm run dev
   ```
5. **Hard refresh**: `Ctrl+Shift+R`.

## Uji coba

1. Klik Pulau Oasis Bahasa Arab → pilih pos manapun yang terbuka.
2. Layar pembuka sekarang bertuliskan **"Ayo belajar dulu!"**.
3. Klik tombol itu → muncul **kartu flash besar** (emoji + huruf Arab
   besar + transliterasi). Ketuk kartu → terbalik menampilkan arti
   Indonesia dalam kotak putih.
4. Gunakan tombol ◀ ▶ untuk maju-mundur antar kartu.
5. Setelah kartu terakhir dilihat, tombol berubah jadi **"Aku siap,
   mulai tantangan!"** (sebelumnya nonaktif/abu-abu).
6. Klik tombol itu → kuis dimulai. Untuk soal "arti → kata Arab",
   perhatikan pilihan jawaban sekarang **kartu 2 kolom dengan emoji
   besar**, bukan list teks.
7. Perhatikan huruf Arab di seluruh tampilan (kartu belajar, judul pos,
   opsi kuis) sekarang memakai font yang lebih tebal/jelas dibanding
   sebelumnya.
8. Selesaikan kuis → di layar hasil, tombol sekarang **"Belajar lagi"**
   (bukan "Ulangi") — mengarah ke fase kartu, bukan langsung ke kuis.

## Jika font Arab masih terlihat sama seperti sebelumnya

Buka DevTools (`F12`) → tab **Network**, filter "font", reload halaman —
cari request ke `fonts.googleapis.com` atau `fonts.gstatic.com`. Jika
statusnya gagal/merah, kemungkinan ada pemblokiran jaringan pada domain
Google Fonts di lingkungan Anda (mirip kasus npm registry sebelumnya) —
beri tahu saya jika ini terjadi, supaya saya cari alternatif font yang
di-bundle langsung ke proyek (tidak perlu internet).
