# Cara Pasang Patch 23 — Rebrand Bright Academy, Warna Gurun, Audio TTS Nyata

## Tiga perbaikan dari feedback Anda

| Masalah dilaporkan | Perbaikan |
|---|---|
| "Kok sekolah di BISA, materi bisa, ganti ke Bright Academy" | Kalimat contoh di dialog pelajaran 1 ("Di mana kamu belajar?") diganti dari "أَدْرُسُ فِيْ مَدْرَسَةِ بِيْسَا" (sekolah BISA) menjadi **"أَدْرُسُ فِيْ أَكَادِيْمِيَّةِ بِرَايْت"** (Bright Academy) |
| "Warna colornya masih belum menarik" | Palet diganti total dari lavender pucat menjadi **tema golden-hour gurun**: emas hangat, terracotta, plum tua sebagai aksen — gradient lebih jenuh di kartu, tombol, dan latar overlay |
| "Gameplay harus ditingkatkan lagi" | Ditambahkan **tombol "Dengarkan" (🔊) yang BENAR-BENAR mengucapkan kata Arab** memakai Web Speech API bawaan browser — bukan lagi sekadar bunyi UI generik |

## ⚠️ Catatan jujur soal fitur audio baru

Tombol speaker baru ini memakai **suara sintesis bawaan sistem operasi/browser Anda** (Web Speech API), BUKAN rekaman native speaker manusia. Artinya:

1. **Kualitas pelafalan tidak akan sesempurna** pengajar/native speaker — ini bantuan tambahan mendengar perkiraan bunyi, bukan pengganti belajar pelafalan dari guru.
2. **Ketersediaan tergantung perangkat**. Windows 10/11 + Chrome/Edge biasanya sudah punya suara Arab bawaan, tapi ini tidak 100% pasti tergantung setting sistem Anda.
3. **Jika perangkat Anda TIDAK punya suara Arab**, tombol 🔊 **otomatis tidak akan muncul sama sekali** di game — jadi Anda tidak akan melihat tombol yang tidak berfungsi.

## File yang berubah

```
src/game/arabic/curriculum.ts   -> TIMPA (1 kalimat diganti: BISA -> Bright Academy)
src/game/arabic/ArabicGame.tsx  -> TIMPA (warna baru + integrasi tombol Dengarkan)
src/game/arabic/arabicTts.ts    -> BARU (modul Web Speech API)
src/game/arabic/levels.ts       -> TIMPA (tidak berubah dari Patch 22, dibangun ulang)
src/game/arabic/evidence.ts     -> TIMPA (tidak berubah dari Patch 22, dibangun ulang)
src/game/arabic/arabicSfx.ts    -> TIMPA (tidak berubah dari Patch 22, dibangun ulang)
```

Semua file disertakan lengkap di zip ini supaya Anda bisa menimpa satu folder sekaligus tanpa perlu memilah mana yang benar-benar baru.

## Langkah pemasangan

1. `Ctrl+C` hentikan `npm run dev`.
2. Timpa **seluruh isi folder** `src/game/arabic/` dengan 6 file dari zip ini.
3. Pastikan `public/assets/arabic/fox-explorer.webp` dan `backpack.webp` tetap ada (tidak berubah, tidak perlu ditimpa ulang jika sudah ada dari patch sebelumnya).
4. Jalankan:
   ```powershell
   npm run typecheck
   npm run build
   npm run dev
   ```
5. **Hard refresh**: `Ctrl+Shift+R`.

## Uji coba

1. Klik Pulau Oasis Bahasa Arab → perhatikan **warna kartu pos sekarang bernuansa emas-terracotta** (bukan lavender pucat lagi).
2. Klik **Pos 1 (Salam & Perkenalan)** → di layar pembuka, cari ikon **speaker kecil (🔊)** di samping judul Arab. Kalau muncul, klik — Anda harus mendengar suara mengucapkan kalimat tersebut.
3. Masuk fase belajar (kartu flash) → setiap kartu punya ikon speaker di samping huruf Arab besar — klik untuk mendengar pelafalan.
4. Lanjut ke kuis → cari kartu jawaban "Aku belajar di Bright Academy" pada pertanyaan "أَيْنَ تَدْرُسُ؟" (bukan lagi "sekolah BISA").
5. Perhatikan skema warna keseluruhan game: kartu, tombol, dan overlay latar sekarang terasa lebih hangat/kaya.

## Jika tombol speaker tidak muncul sama sekali

Ini artinya perangkat/browser Anda tidak terdeteksi punya suara Bahasa Arab — bukan bug, hanya keterbatasan lingkungan. Anda bisa cek manual: buka `chrome://settings/languages` (Chrome) atau pengaturan Windows → Time & Language → Speech, lihat apakah ada opsi menambah suara/bahasa Arab. Jika ingin saya bantu cari alternatif (misalnya info soal instalasi voice pack Windows), beri tahu saya.

## Yang belum berubah (tetap sama seperti Patch 22)

- Fase belajar (flashcard) sebelum kuis
- Font Arab "Noto Naskh Arabic"
- Struktur 17 pos berjenjang dengan sistem bintang & buku koleksi
- Efek suara UI (klik, benar/salah, dsb) — tetap ada, terpisah dari fitur TTS baru
