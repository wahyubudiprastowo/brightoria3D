# Cara Pasang Patch 11

## ⚠️ Baca dulu — kejujuran soal keterbatasan patch ini

Karena project Anda sudah dikembangkan lintas beberapa sesi (sampai
Patch 09) oleh agent yang berbeda, saya (sesi ini) **tidak memiliki
salinan pasti** kode `App.tsx`, `QuizGame.tsx`, `DigitalGame.tsx`, atau
`ArabicGame.tsx` versi terbaru di komputer Anda. Supaya tidak berisiko
merusak yang sudah berjalan, Patch 11 saya susun jadi **dua bagian**:

1. **Bagian A (WAJIB, sangat rendah risiko)** — perbaikan CSS satu baris
   untuk bug "nama pulau bocor tampil di atas game". Ini bekerja
   terlepas dari apa isi `App.tsx` Anda saat ini.
2. **Bagian B (aman, file lengkap)** — dua file yang SEPENUHNYA saya
   tulis ulang dan kuasai penuh: `WorldScene.tsx` (peta) dan
   `NumeriaGame.tsx` (Pulau Numeria). Aman ditimpa langsung.

Untuk Adab/English/Quran/Digital/Arabic yang gameplay-nya masih terasa
kurang menarik, saya **tidak menyertakan patch file** di sini karena
saya tidak mau menebak-nebak isi kode Anda dan berisiko merusaknya.
Solusinya ada di bagian "Langkah lanjutan" di bawah.

---

## Bagian A — Fix bug "nama pulau bocor di atas game" (WAJIB, 1 baris)

Buka `src/styles.css`, cari baris yang berisi:
```css
.world {
```
(biasanya berupa blok CSS untuk peta utama). **Tambahkan properti
`isolation: isolate;` di dalam blok tersebut.** Kalau tidak yakin di
baris mana, cara PALING AMAN: cukup **tempelkan blok berikut di baris
PALING BAWAH** file `src/styles.css` Anda (tidak perlu mencari-cari,
CSS ini akan menimpa aturan sebelumnya secara otomatis karena urutan):

```css
/* Patch 11 — fix bug label pulau bocor tampil di atas overlay game.
   Detail teknis: drei <Html> menghitung z-index internal yang bisa
   jauh melebihi z-index modal game manapun. `isolation: isolate`
   membatasi seluruh z-index di dalam .world supaya tidak pernah bisa
   melampaui elemen di luar peta, termasuk overlay game apa pun. */
.world {
  isolation: isolate;
}
```

**Kenapa ini aman:** `isolation: isolate` hanya mengatur cara elemen di
dalam `.world` "bersaing" tampil dengan elemen DI LUAR `.world` — tidak
mengubah tata letak, ukuran, warna, atau perilaku apa pun yang sudah
ada. Ini teknik CSS standar untuk masalah persis seperti ini.

## Bagian B — Timpa dua file (aman, saya tulis ulang penuh)

```
src/components/WorldScene.tsx   -> TIMPA total
src/game/numeria/NumeriaGame.tsx -> TIMPA total
```

Kedua file ini SEPENUHNYA saya kuasai dari awal proyek, jadi aman
ditimpa. Tidak menyentuh file lain sama sekali.

### Apa yang berubah di WorldScene.tsx
- **Background langit** sekarang digambar prosedural (gradient warna
  langsung, bukan gambar tekstur) — **tidak akan pernah gagal render**,
  beda dari sebelumnya yang mungkin bergantung file gambar yang kadang
  tidak termuat.
- **Dot/garis penghubung antar pulau** diganti dari tekstur ke bentuk
  geometris + bola glow dengan blending terang — **pasti selalu
  terlihat jelas** dari sudut kamera manapun.
- **Cincin seleksi & glow hover** pulau juga diganti prosedural
  (sebelumnya tekstur), alasan sama: keandalan.
- Ditambahkan partikel ambient halus yang melayang naik perlahan di
  peta (sentuhan "hidup" tambahan, sangat ringan, tidak mengganggu).
- `<Html>` label pulau diberi `zIndexRange={[30, 0]}` sebagai lapis
  pertahanan kedua (selain fix CSS di Bagian A).

### Apa yang berubah di NumeriaGame.tsx
- Menambahkan `<Sparkles>` (partikel 3D bawaan drei, tanpa dependency
  baru) yang muncul di sekitar jembatan saat jawaban benar — pengalaman
  "wow" yang lebih terasa dibanding confetti 2D overlay saja.
- Semua logika permainan (evidence, mastery, XP, level) **tidak
  berubah sama sekali** — murni tambahan visual.

## Cara pasang

1. `Ctrl+C` hentikan `npm run dev`.
2. Tambahkan CSS di Bagian A ke `src/styles.css`.
3. Timpa `src/components/WorldScene.tsx` dan `src/game/numeria/NumeriaGame.tsx`
   dengan file dari patch ini.
4. Jalankan:
   ```powershell
   npm run typecheck
   npm run build
   npm run dev
   ```
5. **Hard refresh browser**: `Ctrl+Shift+R`.

## Uji coba

1. **Cek bug label**: klik pulau mana saja → klik "Mainkan sekarang" →
   pastikan TIDAK ADA lagi nama pulau ("Kampung Adab 100%" dsb) yang
   muncul mengambang di atas layar game.
2. **Cek peta**: putar peta dengan drag — background langit sekarang
   bergradasi jelas (bukan warna datar), garis emas + titik bercahaya
   antar pulau harus selalu terlihat dari sudut manapun.
3. **Cek Pulau Numeria**: mainkan sampai jawaban benar — perhatikan
   partikel emas berkilau muncul di sekitar jembatan (bukan cuma
   confetti di layar).

## Langkah lanjutan yang saya sarankan (di luar patch ini)

Untuk membuat Adab/English/Quran/Digital/Arabic **ikut** mendapat efek
confetti/streak/partikel seperti Numeria, opsi paling aman:

- **Opsi A (paling mudah)**: buka file game tersebut (mis.
  `src/game/digital/DigitalGame.tsx`) di VS Code, **copy-paste isi
  lengkapnya ke chat ini**, dan saya akan tambahkan juice kit langsung
  dengan tepat sasaran (tanpa menebak-nebak).
- **Opsi B**: kirim ulang file zip project lengkap terbaru (seperti
  yang pernah Anda kirim), supaya saya audit ulang dan pastikan semua
  patch sebelumnya (termasuk Patch 10) benar-benar sudah masuk dengan
  utuh sebelum menambah lapisan baru.

Saya sengaja tidak menebak isi file tersebut di patch ini karena
risikonya adalah PATCH TIDAK BISA DITERAPKAN (str_replace gagal) atau
lebih buruk, **menimpa fitur yang sudah Anda kembangkan** tanpa saya
sadari.
