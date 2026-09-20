# Cara Pasang Patch 12 — Fix Background Peta + Maskot Bri 3D

## Ringkasan temuan (baca dulu)

1. **Bug label bocor** (Patch 11) sudah confirmed hilang — bagus, tidak
   disentuh lagi di patch ini.
2. **Background hilang & dot tidak terlihat**: saya verifikasi ulang
   seluruh file aset peta asli Anda (`background_sky_1920x1080.webp`,
   `route_node.webp`, `connector_dots_curve.webp`, dll) — **semuanya
   valid, tidak corrupt**. Jadi masalahnya kemungkinan besar ada di kode
   yang memanggil aset tersebut, bukan filenya. Karena saya tidak 100%
   yakin kode apa yang sebenarnya berjalan di komputer Anda saat ini,
   Patch 12 memakai strategi **paling aman**: background dipindah ke CSS
   murni (tidak mungkin gagal), dot diperbesar + diberi animasi denyut
   supaya pasti terlihat.
3. **Maskot Bri 3D** ditambahkan — versi primitif Three.js (bukan hasil
   AI 3D generation, karena Hunyuan3D-2/TRELLIS butuh GPU besar yang tidak
   tersedia di lingkungan saya). Ini tetap terlihat seperti karakter kecil
   yang melayang dan bereaksi, berjalan 100% sekarang tanpa GPU.

## File yang berubah

```
src/components/WorldScene.tsx          -> TIMPA total
src/components/BriMascot.tsx           -> BARU
src/styles-patch12-map-fix.css         -> BARU (tempel ke bawah styles.css)
public/assets/map/*.webp               -> file aset asli (sudah disertakan,
                                            timpa untuk memastikan sama)
```

## Langkah pemasangan

1. `Ctrl+C` hentikan `npm run dev`.
2. Timpa `src/components/WorldScene.tsx`.
3. Tambahkan file baru `src/components/BriMascot.tsx`.
4. Salin seluruh isi `src/styles-patch12-map-fix.css`, **tempelkan di
   baris PALING BAWAH** `src/styles.css` Anda.
5. Pastikan folder `public/assets/map/` berisi kedelapan file berikut
   (sudah disertakan di zip ini — timpa untuk memastikan sama persis):
   `background_sky_1920x1080.webp`, `route_node.webp`,
   `connector_dots_curve.webp`, `connector_line_horizontal.webp`,
   `selected_ring.webp`, `island_hover_glow.webp`, `cloud_1.webp`,
   `cloud_2.webp`.
6. Jalankan:
   ```powershell
   npm run typecheck
   npm run build
   npm run dev
   ```
7. **Hard refresh**: `Ctrl+Shift+R`.

## Uji coba

1. Peta harus menampilkan **gradient langit lembut** sebagai background
   (bukan lagi flat abu-abu) — ini sekarang CSS, jadi pasti tampil.
2. **Dot penghubung** antar pulau sekarang jauh lebih besar dan berdenyut
   pelan (efek pulsa) — harus terlihat jelas dari jarak zoom manapun.
3. **Maskot Bri** (bola kecil maroon-emas dengan sayap tipis, mata
   berkedip cahaya) melayang di dekat pulau yang sedang dipilih. Klik
   pulau lain — Bri akan "melompat" bereaksi lalu mengekor pindah ke
   pulau baru.
4. Klik/drag putar peta — pastikan label pulau TETAP tidak bocor ke game
   (regresi check dari Patch 11).

## Soal Hunyuan3D-2 / TRELLIS

Concept art untuk maskot Bri, karakter penjelajah, dan burung hantu
pendamping sudah saya buatkan (lihat gambar yang sudah tampil di chat
sebelumnya) — silakan unduh gambar tersebut lalu proses melalui:
- **Hugging Face Space** untuk Hunyuan3D-2 atau TRELLIS (gratis, tidak
  perlu install apa pun, cukup upload gambar)
- Atau GPU lokal/cloud Anda sendiri jika tersedia

Hasilnya berupa file `.glb`. Setelah punya file itu, kirimkan ke saya
(atau simpan ke `public/assets/models/bri.glb`) dan beri tahu — saya akan
gantikan `BriMascot.tsx` primitif ini dengan model 3D asli tersebut,
instruksinya sudah saya tulis sebagai komentar di dalam file
`BriMascot.tsx`.

## Yang masih pending (perlu file dari Anda)

Untuk menambah juice (confetti/streak/mascot reaction) ke 5 game lainnya
(Adab, English, Quran, Digital, Arabic) supaya "bikin nagih" secara sehat
seperti Numeria, saya perlu **isi file game tersebut yang sebenarnya**
(copy-paste ke chat atau upload ulang zip project terbaru) — supaya
perubahan tepat sasaran tanpa risiko merusak yang sudah Anda bangun.
