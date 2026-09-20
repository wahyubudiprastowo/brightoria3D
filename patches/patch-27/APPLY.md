# Cara Pasang Patch 27 — Taman Al-Qur'an: Petualangan Huruf Hijaiyah

## Menjawab pertanyaan Anda: masuk pulau mana, gameplay apa, aset apa

**Pulau: Taman Al-Qur'an** — materi dari PDF "Belajar Menulis Huruf Hijaiyah Seri 1" (28 huruf Hijaiyah, masing-masing dengan 4 kata contoh) pas sekali masuk ke sini, karena kebetulan Taman Al-Qur'an adalah salah satu dari dua dunia yang **belum punya gameplay unik** (sebelumnya masih pakai mesin kuis generik).

**Gameplay: mekanik "Sambungkan"** — meniru LANGSUNG aktivitas inti buku ("Cocokkan gambar dengan kata yang sesuai!"): dua kolom di layar, kolom kiri berisi 4 gambar (emoji), kolom kanan berisi 4 kata Arab (urutan diacak). Anak ketuk gambar, lalu ketuk kata yang dianggap cocok — kalau benar, keduanya ditandai selesai; kalau salah, berkedip merah sesaat lalu bisa dicoba lagi (tidak ada penalti, hanya dicatat sebagai "kesalahan" yang memengaruhi jumlah bintang).

Ini **berbeda total** dari mekanik dunia lain:
- Bukan kuis pilihan ganda (generik lama)
- Bukan kartu-flip cari pasangan identik (Oasis Bahasa Arab)
- Bukan cerita bercabang (Kampung Adab)
- **Dua kolom yang selalu terlihat, menyambungkan pasangan berbeda jenis** — persis pola asli buku

Setiap huruf juga menampilkan **4 bentuk penulisan** (berdiri sendiri, awal, tengah, akhir kata) di layar pengenalan sebelum bermain — menangkap semangat "belajar menulis" dari judul buku.

**Aset: emoji** (bukan ilustrasi asli buku — lihat catatan jujur di bawah).

## ⚠️ Catatan jujur — WAJIB dibaca

1. **Teks Arab hasil scan (OCR) PDF asli sangat berantakan** dan tidak bisa disalin langsung. Saya rekonstruksi ulang 28 huruf × 4 kata dari pengetahuan Bahasa Arab saya, **divalidasi silang** dengan memastikan setiap kata benar-benar diawali hurufnya secara konsisten di seluruh 28 huruf (metode phonics buku ini). Tingkat keyakinan tinggi, **tapi tetap WAJIB direview pengajar Bahasa Arab/tahsin** sebelum dipakai siswa sungguhan, terutama ketepatan harakat.
2. **Saya tidak bisa mengekstrak gambar ilustrasi asli dari PDF** — hanya menerima placeholder metadata, bukan piksel gambar. Aset yang dipakai adalah **emoji**, bukan reproduksi ilustrasi buku (juga menghindari risiko hak cipta jika ditiru persis).
3. **Aktivitas "tempel stiker berurutan"** dari buku asli TIDAK diadaptasi — lebih cocok sebagai lembar kerja fisik daripada game digital.
4. **Tidak ada deteksi tulisan tangan/coretan** — pengenalan 4 bentuk huruf hanya visual, bukan latihan menulis interaktif.
5. **Saya tidak punya visibilitas ke `App.tsx` Anda saat ini** — file ini ditulis mengikuti kontrak yang SUDAH TERBUKTI cocok untuk dunia lain (`computeMastery`, `completed: string[]`, props `onExit`/`onXpEarned`). **Jika muncul error saat build, kirimkan pesan errornya** — polanya sudah terbukti cepat diperbaiki (lihat riwayat Oasis Bahasa Arab, Patch 20).

## File yang ditambahkan/ditimpa

```
src/game/quran/QuranGame.tsx   -> TIMPA (path sama seperti komponen lama)
src/game/quran/curriculum.ts   -> BARU (28 huruf x 4 kata)
src/game/quran/evidence.ts     -> BARU (pelacakan progres + koleksi)
src/game/quran/quranTts.ts     -> BARU (pelafalan suara, Web Speech API)
```

## Langkah pemasangan

1. `Ctrl+C` hentikan `npm run dev`.
2. Timpa/tambahkan 4 file di atas ke `src/game/quran/`.
3. Jalankan:
   ```powershell
   npm run typecheck
   npm run build
   npm run dev
   ```
4. **Hard refresh**: `Ctrl+Shift+R`.

## Uji coba

1. Klik Pulau Taman Al-Qur'an → Mainkan sekarang.
2. Peta menampilkan **28 huruf** — hanya Alif yang terbuka.
3. Klik Alif → layar pengenalan menampilkan **4 bentuk huruf** (berdiri sendiri, awal, tengah, akhir) + tombol dengarkan (jika perangkat punya suara Arab).
4. Klik "Mulai mencocokkan!" → muncul **2 kolom**: kiri gambar (🐰👦👨👩), kanan kata Arab (أرنب، ابن، أب، أم — urutan acak).
5. Ketuk gambar kelinci, lalu ketuk kata yang menurut Anda "أرنب" — kalau benar, keduanya tertandai hijau.
6. Selesaikan semua 4 pasangan → layar hasil dengan bintang.
7. Kembali ke peta → huruf Ba terbuka.
8. Klik **Koleksi** di pojok kanan atas peta → semua kata yang sudah pernah dicocokkan tersimpan di sana.

## Jika ada error saat build

Kirimkan pesan error TypeScript lengkap — sesuai pengalaman sebelumnya, biasanya bisa diperbaiki cepat begitu saya tahu kontrak nama yang sebenarnya dibutuhkan App.tsx untuk dunia `quran`.

## Rencana selanjutnya

Setelah Taman Al-Qur'an dikonfirmasi berjalan, tinggal **English Harbor** yang masih memakai mesin kuis generik. Kandidat mekanik: "Dengar & Pilih" (memanfaatkan suara Inggris yang jauh lebih andal ketimbang Arab di kebanyakan perangkat) atau "Susun Kalimat" drag-and-drop.
