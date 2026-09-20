# Cara Pasang Patch 17 — Fix Dot Kegedean, Bri "Matahari", Responsive Mobile, Background

## Ringkasan perbaikan dari screenshot Anda

| Masalah dilaporkan | Penyebab pasti | Perbaikan |
|---|---|---|
| Dot penghubung hampir sebesar pulau | Patch 15 memperbesar dot terlalu jauh (halo 0.62, node 0.85) sebagai respons "dot tidak terlihat" sebelumnya | Diperkecil signifikan: halo 0.62→0.22, ring 0.4→0.16, node plane 0.85→0.32. Pulau justru diperbesar sedikit (2.05→2.3) supaya jadi fokus visual utama |
| Bri terlihat seperti matahari raksasa | Glow/cahaya di belakang Bri berskala 3.2× (Patch 15), diameter hampir menyamai pulau | Diperkecil ke 1.35× — sekarang jadi aksen cahaya kecil, bukan bola cahaya dominan |
| Peta belum menyesuaikan otomatis di mobile | Belum ada logika responsif sama sekali | Ditambahkan deteksi lebar layar (breakpoint 700px) — di layar sempit, kamera otomatis mendekat + fov melebar, sehingga pulau tampil lebih besar/jelas tanpa mengubah geometri apa pun |
| Background masih kurang menarik | Warna gradient kurang jenuh, tidak ada elemen "wow" | Warna langit diperkaya (emas hangat di cakrawala, pink/lavender tengah, periwinkle dalam di puncak), ditambah cahaya matahari lembut (posisi tetap, TERPISAH dari Bri supaya tidak tertukar lagi), plus 2 lapis awan tambahan untuk kedalaman |

## File yang berubah

```
src/components/WorldScene.tsx   -> TIMPA total
src/components/BriMascot.tsx    -> TIMPA total
```

## Langkah pemasangan

1. `Ctrl+C` hentikan `npm run dev`.
2. Timpa kedua file di atas.
3. Jalankan:
   ```powershell
   npm run typecheck
   npm run build
   npm run dev
   ```
4. **Hard refresh**: `Ctrl+Shift+R`.

## Uji coba

1. **Dot penghubung**: sekarang jauh lebih kecil dibanding pulau — harus
   terlihat sebagai aksen kecil berkedip, bukan lagi bersaing ukuran
   dengan pulau.
2. **Maskot Bri**: cahaya di belakangnya sekarang jauh lebih kecil,
   terlihat seperti lentera dengan aksen cahaya, bukan lagi "matahari"
   mengambang sendiri.
3. **Background**: warna langit sekarang lebih kaya (emas-pink-biru),
   ada satu titik cahaya matahari lembut yang TETAP di posisinya (tidak
   ikut bergerak mengekor pulau seperti Bri) di kejauhan, dan awan lebih
   berlapis.
4. **Responsif mobile**: buka DevTools (`F12`) → ikon toggle device
   toolbar (mode HP) → pilih ukuran layar HP (mis. iPhone SE, 375px
   lebar) — peta harus otomatis tampil lebih "zoom in"/pulau lebih besar
   dibanding saat browser lebar. Coba juga resize jendela browser
   biasa (tarik lebih sempit dari 700px) untuk melihat transisi.

## Jika ukuran dot/Bri masih perlu disesuaikan lagi

Semua ukuran ini murni angka di kode (`circleGeometry`, `planeGeometry`,
`scale`), jadi sangat mudah disesuaikan lebih lanjut — beri tahu saya
persisnya (misal "dot masih terlalu besar 20% lagi" atau "Bri glow masih
kurang terlihat") dan saya sesuaikan presisi angkanya.

## Catatan teknis responsive (untuk transparansi)

Deteksi mobile memakai `window.innerWidth <= 700` (breakpoint sama
seperti yang sudah dipakai di CSS proyek ini). Ini pendekatan sederhana
dan cukup akurat untuk kebanyakan kasus, tapi bukan berdasarkan ukuran
kanvas 3D yang presisi — jika nanti peta ditempatkan di dalam kolom/panel
yang lebih sempit dari lebar jendela penuh (bukan full-width), logika ini
mungkin perlu disesuaikan ke ukuran kontainer alih-alih ukuran jendela.
Untuk kondisi saat ini (peta full-width di halaman), pendekatan ini sudah
tepat.
