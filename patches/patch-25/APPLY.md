# Cara Pasang Patch 25 — Urutan Alur Diperbaiki + Tema Per-Pos untuk Cocokkan Kartu

## Dua masukan Anda yang saya pikirkan ulang sebelum coding

### 1. "Di semua peta ada main cocok-cocokan gak dibeda-bedain per tiap level?"

**Benar, itu kelalaian saya.** Patch 24 memakai ikon kartu belakang yang SAMA PERSIS (🌴 pohon palem hijau) untuk SEMUA 16 pos kosakata.

**Perbaikan:** setiap pos sekarang memakai **ikon pelajarannya sendiri** sebagai sisi belakang kartu (mis. 📚 untuk Ruang Kelas, 🔢 untuk Angka, 👨‍👩‍👧‍👦 untuk Keluarga), DAN warna kartu memakai aksen warna kategori yang sama seperti di peta (5 warna: teal, coral, emas, plum, biru) — jadi tiap pos terasa unik, bukan generik.

### 2. "Kayaknya main cocok-cocokan itu di last setelah pemahaman yang perkata yang pilihan"

**Anda benar secara pedagogis.** Urutan yang tepat (dari beban kognitif RINGAN ke BERAT):

```
a. Kartu-flash (Learn)  — kenalan kata satu-per-satu, tanpa tekanan
b. Kuis pilihan ganda   — uji ingatan, TAPI masih dibantu opsi jawaban
c. Cocokkan kartu       — ujian akhir, harus ingat MANDIRI tanpa bantuan opsi
```

**Perbaikan:** alur untuk 16 pos kosakata sekarang:
```
Peta → Intro → Learn → Kuis → COCOKKAN (ujian akhir) → Hasil
```
Pelajaran 1 (dialog salam) tetap: Peta → Intro → Learn → Kuis → Hasil (tanpa fase cocokkan, karena kalimat dialog penuh tidak natural dipotong jadi kartu pendek).

## File yang berubah

```
src/game/arabic/ArabicGame.tsx   -> TIMPA TOTAL (urutan alur + tema per-pos)
src/game/arabic/curriculum.ts    -> TIMPA (tidak berubah, dibangun ulang)
src/game/arabic/levels.ts        -> TIMPA (tidak berubah, dibangun ulang)
src/game/arabic/evidence.ts      -> TIMPA (tidak berubah, dibangun ulang)
src/game/arabic/arabicSfx.ts     -> TIMPA (tidak berubah, dibangun ulang)
src/game/arabic/arabicTts.ts     -> TIMPA (tidak berubah, dibangun ulang)
```

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

1. Klik **Pos 2 (Anggota Tubuh)** → layar pembuka sekarang menampilkan **3 chip langkah**: "1️⃣ Belajar kata", "2️⃣ Kuis pilihan", "3️⃣ Cocokkan (ujian akhir)" — supaya jelas urutannya.
2. Klik "Ayo belajar dulu!" → kartu-flash tampil seperti biasa.
3. Setelah semua kartu dilihat → klik "Aku siap, mulai kuis!" → **kuis pilihan ganda tampil di sini** (bukan lagi mencocokkan).
4. Selesaikan kuis → sekarang **otomatis lanjut ke mode Cocokkan Kartu** dengan banner "Ujian akhir!" di atas.
5. Perhatikan **warna dan ikon kartu tertutup** — untuk Pos 2 (Anggota Tubuh) harusnya berwarna coral dengan ikon 🧍, BUKAN lagi hijau dengan pohon palem generik. Coba juga Pos 3 (Ruang Kelas) — harus berwarna emas dengan ikon 📚.
6. Selesaikan mencocokkan → klik "Lihat hasil akhir" → BARU muncul layar hasil dengan bintang.
7. Bandingkan warna kartu antar pos yang berbeda — harus terlihat jelas variasi teal/coral/emas/plum/biru sesuai nomor pelajaran.

## Yang tetap sama dari Patch 24

- Panel sapaan maskot rubah di peta
- Maskot diperbesar & beranimasi mengambang
- Palet warna berbeda per pos di peta (teal/coral/emas/plum/biru)
- Font Arab "Noto Naskh Arabic", tombol "Dengarkan" (Web Speech API)
- Rebrand "Bright Academy"
