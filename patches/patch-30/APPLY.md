# Cara Pasang Patch 30 — Perbaikan UX Besar: Tutorial, Highlight Target, Drag Satu Arah

## Menjawab masalah nyata dari screenshot Anda

Screenshot menunjukkan **"3/4 pasang • 12 kesalahan"** — bukti nyata anak (atau siapa pun) tidak tahu harus apa. Setelah dianalisis, ada 3 akar masalah UX di Patch 28:

| Masalah | Perbaikan Patch 30 |
|---|---|
| Tidak ada contoh/tutorial sama sekali | **Demo otomatis satu kali** — titik kuning bergerak sendiri dari gambar pertama ke pasangannya, menunjukkan caranya, SEBELUM anak mencoba sendiri |
| Tidak ada tanda "lepas di sini" saat menyeret | **Highlight kuning berdenyut** muncul di SEMUA kata yang belum selesai selama proses drag, dan **highlight hijau lebih kuat** pada kata yang tepat di bawah jari saat itu |
| Bisa mulai drag dari gambar ATAU dari kata (2x lebih rumit) | **Drag sekarang HANYA bisa dimulai dari kolom gambar** (kiri) — sesuai alur baca alami dan instruksi asli buku |

## Tambahan pendukung

- **Ukuran kartu diperbesar signifikan** (tinggi minimum 60px → 84px, emoji 26px → 36px) — target sentuh lebih besar, mengurangi salah lepas akibat presisi jari anak
- **Label kolom** ("Gambar" / "Kata Arab") ditambahkan di atas masing-masing kolom
- **Tombol "Lewati contoh"** tersedia jika anak/orang tua sudah paham dan ingin langsung main
- Demo tutorial **hanya muncul sekali per huruf** — begitu huruf tersebut pernah diselesaikan, tidak akan muncul lagi saat dimainkan ulang

## File yang berubah

```
src/game/quran/QuranGame.tsx   -> TIMPA TOTAL (perbaikan UX besar)
src/game/quran/curriculum.ts   -> TIMPA (tidak berubah, dibangun ulang)
src/game/quran/evidence.ts     -> TIMPA (tidak berubah, dibangun ulang)
src/game/quran/quranTts.ts     -> TIMPA (tidak berubah, dibangun ulang)
```

## Langkah pemasangan

1. `Ctrl+C` hentikan `npm run dev`.
2. Timpa **seluruh isi folder** `src/game/quran/` dengan 4 file dari zip ini.
3. Jalankan:
   ```powershell
   npm run typecheck
   npm run build
   npm run dev
   ```
4. **Hard refresh**: `Ctrl+Shift+R`.

## Uji coba

1. Klik Pulau Taman Al-Qur'an → pilih huruf yang **belum pernah dimainkan** (misalnya masih 0 bintang).
2. Klik "Mulai bermain!" → perhatikan: **titik kuning bergerak sendiri** dari kartu gambar pertama ke kata pasangannya, menggambar contoh — Anda tidak perlu melakukan apa pun di tahap ini.
3. Setelah demo selesai (sekitar 1,5 detik), giliran Anda mencoba: **tekan dan tahan kartu gambar**, lalu **geser ke kolom kanan** — perhatikan **semua kartu kata yang belum selesai berkedip kuning lembut** (menandakan itu area yang bisa dituju).
4. Saat jari/kursor tepat di atas salah satu kata, kartu itu akan **membesar sedikit dan berubah hijau muda** — tanda "kalau dilepas di sini, ini yang dipilih".
5. Lepas di kata yang benar → garis hijau permanen muncul.
6. Selesaikan 4 pasang → layar hasil dengan bintang.
7. **Buka huruf yang SAMA lagi** (klik "Main lagi" atau kembali dari peta) → demo TIDAK muncul lagi karena huruf ini sudah pernah diselesaikan.
8. Coba huruf **baru** yang belum pernah dimainkan → demo muncul lagi untuk huruf itu.
9. Coba klik **"Lewati contoh"** saat demo sedang berjalan — harus langsung masuk ke mode bermain tanpa menunggu animasi selesai.

## Uji coba khusus mobile/sentuh

Dengan kartu yang lebih besar, seharusnya jauh lebih mudah disentuh presisi oleh jari anak. Coba di HP — perhatikan apakah highlight kuning saat drag juga terlihat jelas di layar kecil.

## Jika masih terasa membingungkan setelah ini

Beri tahu detail spesifiknya (misalnya "demo terlalu cepat", "highlight kurang terlihat", "anak masih bingung harus tekan-tahan bukan cuma tap") — semua parameter (kecepatan demo, warna highlight, ukuran kartu) mudah disesuaikan lebih lanjut karena terpusat di satu file ini.
