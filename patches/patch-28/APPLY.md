# Cara Pasang Patch 28 — Mekanik Drag-Garis Sungguhan (Bukan Tap-Tap)

## Menjawab feedback Anda: "gak nyambung dan masih berantakan... gak ada kayak panah yang bisa di-drag"

Anda benar. Patch 27 memakai mekanik "tap gambar lalu tap kata" (dua klik terpisah, tanpa umpan balik visual saat memilih) — ini tidak meniru instruksi asli buku ("Cocokkan gambar dengan kata yang sesuai!" yang di buku fisiknya berupa **garis yang digambar tangan** dari kotak gambar ke kotak kata).

## Perbaikan Patch 28

Mekanik diganti total jadi **drag-garis sungguhan** memakai lapisan SVG:

1. **Tekan dan tahan** kartu gambar (atau kartu kata) — jangan dilepas.
2. Selagi jari/mouse digeser, **garis putus-putus emas** mengikuti gerakan kursor secara real-time dari kartu asal — persis menggambar garis penghubung.
3. **Lepas** tepat di atas kartu pasangan di kolom sebelah:
   - **Cocok** → garis permanen **hijau** menghubungkan keduanya, kedua kartu ditandai selesai.
   - **Tidak cocok** → kartu bergetar merah sesaat, garis hilang, dicatat sebagai 1 kesalahan (tanpa penalti/hukuman, bisa coba lagi).

Ini pakai **Pointer Events API bawaan browser** (menyatukan mouse + sentuhan + pena dalam satu kode) — tidak perlu library drag-and-drop eksternal apa pun.

## File yang berubah

```
src/game/quran/QuranGame.tsx   -> TIMPA TOTAL (mekanik drag-garis baru)
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

1. Klik Pulau Taman Al-Qur'an → pilih huruf yang terbuka (mis. Alif).
2. Klik "Mulai menarik garis!" → tampil 2 kolom: gambar kiri, kata Arab kanan.
3. **Klik dan tahan** salah satu kartu gambar (mis. 🐰) di mouse, ATAU **sentuh dan tahan** di HP.
4. **Geser** ke kartu kata Arab yang menurut Anda cocok — perhatikan **garis emas putus-putus mengikuti gerakan Anda**.
5. **Lepas** tepat di atas kartu kata tersebut:
   - Jika benar → **garis hijau permanen** muncul, kedua kartu berubah warna hijau muda.
   - Jika salah → kartu bergetar merah sesaat, coba lagi (drag ulang dari gambar yang sama).
6. Ulangi untuk 3 pasangan sisanya → semua selesai → layar hasil dengan bintang.
7. Coba juga **mulai drag dari kata Arab ke gambar** (arah sebaliknya) — harus tetap berfungsi, karena drag bisa dimulai dari kolom manapun.

## Uji coba khusus mobile/sentuh

Karena Anda mungkin menguji juga di HP: pastikan drag dengan **satu jari** berfungsi mulus tanpa menyebabkan halaman ikut ter-scroll saat menggeser (sudah ditangani lewat `touch-action: none` pada kartu). Jika di perangkat Anda ternyata masih terasa ada delay/nyangkut, beri tahu saya perangkat & browser yang dipakai.

## Jika ada error saat build

Kirimkan pesan error TypeScript lengkap — polanya sudah terbukti cepat diperbaiki begitu saya tahu kontrak persis yang dibutuhkan `App.tsx` (lihat riwayat Patch 20 untuk Oasis Bahasa Arab sebagai referensi pola perbaikan).
