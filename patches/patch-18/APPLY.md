# Cara Pasang Patch 18 — Oasis Bahasa Arab: Rihlah (17 Pos, Konten Asli)

## Apa yang dilakukan patch ini

Anda memberikan PDF **"Al-Mumtaaz Untuk Anak Jilid 1"** — buku ajar Bahasa
Arab untuk anak dari Kampung Bahasa Arab BISA / BISA Learning Centre.
Berbeda dari konten dunia lain di Brightoria yang masih berstatus draft
AI, ini adalah **kurikulum resmi dari lembaga pendidikan sungguhan**,
lengkap 17 pelajaran: salam & perkenalan, anggota tubuh, ruang kelas,
angka 1-10, transportasi, keluarga, rumah (4 bagian), buah-buahan (2
bagian), makanan, minuman, dan warna (2 bagian).

Seluruh 17 pelajaran diekstrak menjadi game baru yang menggantikan/
melengkapi Oasis Bahasa Arab, dengan mekanik yang dirancang untuk "bikin
nagih" secara sehat:

1. **Peta 17 pos** — pos terkunci berurutan (harus dapat minimal 1
   bintang di pos sebelumnya untuk buka pos berikutnya), tapi pos yang
   sudah terbuka bisa dimainkan ulang bebas kapan saja.
2. **Sistem bintang (1-3)** berdasarkan akurasi jawaban — mendorong
   pemain mengulang pos untuk mendapat bintang penuh (replay value).
3. **Buku Koleksi Kosakata** — setiap kata yang pernah dijawab benar
   masuk koleksi permanen yang bisa dilihat kapan saja (mekanik
   "melengkapi koleksi" seperti album stiker/Pokedex, terbukti efektif
   menjaga keterlibatan jangka panjang).
4. **Soal dibangkitkan acak** setiap sesi (bukan urutan tetap) — kombinasi
   tipe "lihat kata Arab → pilih arti" dan "lihat arti → pilih kata Arab"
   berselang-seling, plus mode khusus dialog Tanya-jawab untuk pelajaran 1.
5. **Juice kit terintegrasi** (dari Patch 10): confetti saat jawaban
   benar & saat pos selesai, indikator streak beruntun, animasi punch
   pada kartu jawaban.

## ⚠️ Catatan jujur — WAJIB dibaca

1. **Tidak ada audio.** Buku aslinya berulang kali menyebut instruksi
   "استمع" (dengarkan), tapi game ini murni visual-teks karena tidak ada
   rekaman audio asli yang bisa dipakai. Jika ke depan Anda punya akses
   ke rekaman audio (native speaker/pengajar), ini bisa ditambahkan.
2. **Emoji sebagai bantu-visual, bukan ilustrasi asli buku.** Beberapa
   kata (رمان/delima, تمر/kurma, بابايا/pepaya) tidak punya emoji standar
   yang pas — dipakai placeholder bentuk warna, ditandai jelas di
   komentar kode `curriculum.ts`.
3. **Tetap disarankan direview pengajar Bahasa Arab** — meski sumber
   vocab-nya sudah dari buku ajar resmi (bukan draft AI lagi), transliterasi
   dan nuansa terjemahan tetap sebaiknya diperiksa sebelum dipakai siswa
   sungguhan secara luas.
4. **Saya tidak punya akses ke kode `App.tsx`/`ArabicGame.tsx` Anda saat
   ini** (proyek sudah berkembang lintas beberapa sesi tanpa saya melihat
   isinya di sesi ini) — jadi game baru ini saya letakkan di folder
   **terpisah** (`src/game/arabic-oasis/`) supaya TIDAK menimpa apa pun
   secara otomatis. Anda perlu satu langkah manual kecil untuk
   menyambungkannya (lihat bagian "Integrasi ke App.tsx" di bawah).

## File yang ditambahkan (semua BARU, tidak menimpa apa pun secara otomatis)

```
src/game/arabic-oasis/curriculum.ts       -> BARU (data 17 pelajaran asli)
src/game/arabic-oasis/levels.ts            -> BARU (generator soal acak)
src/game/arabic-oasis/evidence.ts          -> BARU (progres & koleksi)
src/game/arabic-oasis/ArabicOasisGame.tsx  -> BARU (komponen game utama)
src/styles-arabic-oasis-addon.css          -> BARU (tempel ke styles.css)
```

## Langkah pemasangan

1. `Ctrl+C` hentikan `npm run dev`.
2. Salin folder `src/game/arabic-oasis/` (4 file) ke proyek Anda persis di
   path yang sama.
3. Salin isi `src/styles-arabic-oasis-addon.css`, tempelkan di **baris
   paling bawah** `src/styles.css` Anda.
4. **Integrasi ke App.tsx** (WAJIB, satu langkah manual):

   Buka `src/App.tsx`, cari bagian yang mengimpor game dunia lain
   (kemungkinan ada baris seperti `import ArabicGame from
   './game/arabic/ArabicGame'` atau serupa). Tambahkan baris berikut di
   dekatnya:

   ```typescript
   import ArabicOasisGame from './game/arabic-oasis/ArabicOasisGame';
   ```

   Cari bagian yang membuka game saat dunia `'arabic'` dipilih (mirip
   pola `if (selected.id === 'math') setShowNumeria(true)` yang dipakai
   Numeria). Tambahkan state baru `showArabicOasis` dan arahkan dunia
   `'arabic'` untuk membuka `<ArabicOasisGame>` alih-alih game lama,
   contoh pola (sesuaikan dengan struktur App.tsx Anda yang sebenarnya):

   ```typescript
   const [showArabicOasis, setShowArabicOasis] = useState(false);

   function enterWorld() {
     if (selected.id === 'math') setShowNumeria(true);
     else if (selected.id === 'arabic') setShowArabicOasis(true);
     else if (selected.id === 'digital') setShowDigital(true);
     // ...dunia lain tetap seperti semula
   }

   // di JSX, sejajar dengan {showNumeria && <NumeriaGame .../>}:
   {showArabicOasis && (
     <ArabicOasisGame
       onExit={() => setShowArabicOasis(false)}
       onXpEarned={handleXpEarned}
     />
   )}
   ```

   Jika App.tsx Anda punya nama fungsi/state yang berbeda dari contoh di
   atas, sesuaikan polanya — intinya: dunia `'arabic'` perlu memanggil
   `setShowArabicOasis(true)`, dan komponen `<ArabicOasisGame>` perlu
   dirender dengan `onExit` dan `onXpEarned` yang sudah ada polanya di
   game lain.

5. Jalankan:
   ```powershell
   npm run typecheck
   npm run build
   npm run dev
   ```
6. **Hard refresh**: `Ctrl+Shift+R`.

## Uji coba

1. Klik Pulau Oasis Bahasa Arab → Mainkan sekarang.
2. Peta 17 pos muncul — hanya **Pos 1 (Salam & Perkenalan)** yang
   terbuka, sisanya terkunci (ikon gembok).
3. Mainkan Pos 1 — ini mode dialog: muncul pertanyaan Arab (mis. "مَا
   اسْمُكَ؟"), pilih jawaban yang tepat dari 3 opsi.
4. Selesaikan sesi → layar hasil menampilkan bintang (1-3) + confetti
   jika sempurna.
5. Kembali ke peta → **Pos 2 sekarang terbuka** (jika dapat ≥1 bintang).
6. Mainkan beberapa pos kosakata (mis. Pos 2: Anggota Tubuh) — perhatikan
   soal berselang-seling antara "lihat kata Arab → pilih arti" dan
   sebaliknya.
7. Klik tombol **"Koleksi"** di pojok kanan atas peta — buku koleksi
   menampilkan semua kata yang sudah pernah dijawab benar, kata yang
   belum pernah dijawab benar masih terkunci (ikon gembok).
8. Ulangi satu pos yang sudah selesai — bintang tersimpan adalah **yang
   terbaik dari semua percobaan**, jadi bermain ulang tidak pernah
   merugikan.

## Jika ada error `Cannot find module` saat build

Ini biasanya berarti langkah integrasi App.tsx (langkah 4) belum lengkap.
Pastikan `import ArabicOasisGame from './game/arabic-oasis/ArabicOasisGame';`
sudah ada dan tidak ada salah ketik path.

## Rencana lanjutan (belum di patch ini)

- Menambahkan audio asli jika Anda memperoleh rekaman.
- Mengganti emoji dengan ilustrasi asli buku jika tersedia dalam format
  gambar terpisah.
- Menambahkan mode "tinjauan cepat" (flashcard) untuk kata yang sudah
  dikoleksi, sebagai latihan penyegaran.
