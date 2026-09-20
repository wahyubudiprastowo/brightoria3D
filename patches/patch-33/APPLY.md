# Cara Pasang Patch 33 — Peta Dunia Jadi Hidup (Peningkatan Besar Atmosfer)

## Kenapa peta terasa monoton

Peta dunia adalah layar **pertama** yang dilihat anak setiap membuka aplikasi — tapi sejak **Patch 17** tidak pernah ditingkatkan lagi, sementara semua dunia lain sudah naik kelas (Oasis Bahasa Arab, Kampung Adab, Taman Al-Qur'an, English Harbor). Wajar kalau terasa tertinggal.

## ⚠️ Baca dulu sebelum memasang

Saya **tidak punya salinan `WorldScene.tsx` Anda saat ini**. File di patch ini dibangun ulang dari versi **Patch 17** (terakhir yang saya kirim untuk peta) **dengan semua perbaikan lama tetap dipertahankan**:

- Formasi cincin posisi 6 dunia (Patch 10) — tetap dibaca dari `worlds.ts`, tidak disentuh
- `useSafeFrame` di semua animasi (Patch 16)
- Fallback 2D jika WebGL gagal
- Fix label bocor ke overlay game: `zIndexRange={[30, 0]}` (Patch 11)
- Kamera responsif mobile (Patch 17)
- Maskot Bri dan reaksinya

**Jika Anda sempat mengubah `WorldScene.tsx` sendiri setelah Patch 17, beri tahu saya dulu** — jangan langsung timpa.

## Yang ditambahkan

| Efek | Penjelasan |
|---|---|
| 🌊 **Lautan hidup** | Gradien laut + 3 riak melingkar yang terus mengembang & memudar |
| ☀️ **Sky rays** | 4 berkas cahaya matahari miring bergerak pelan di latar |
| 🐦 **Burung terbang** | 5 burung melintas & mengepak — dunia terasa hidup, bukan diam |
| ✨ **Aura pulau** | Glow berwarna **sesuai tema tiap dunia**, makin terang saat hover/dipilih |
| 🏅 **Cincin emas** | Muncul **otomatis** di pulau ber-mastery ≥ 70% sebagai penanda pencapaian |
| 🔦 **Berkas seleksi** | Kerucut cahaya turun dari langit menyorot pulau yang dipilih |
| 💫 **Kilau per-pulau** | Partikel warna tema, hanya di pulau terpilih (hemat performa) |
| 🎬 **Pop-in bertahap** | Pulau muncul satu per satu saat peta dibuka, bukan langsung semua |
| 🔍 **Retina render** | `dpr [1,2]` — tepi pulau & teks label jauh lebih tajam |

## Kenapa semuanya prosedural (bukan file gambar)

Semua efek di atas **dihitung dari kode**, tidak memuat file `.webp`/HDR apa pun. Ini mengikuti pelajaran keras dari dua insiden nyata di proyek ini:

- **Patch 03**: `<Environment>` drei mengunduh HDR dari CDN → scene macet blank total
- **Patch 12–15**: background & glow berbasis file `.webp` berulang kali gagal tampil di perangkat Anda, padahal filenya valid

Efek samping positif: aura dan cincin seleksi sekarang **tidak lagi bergantung** pada `island_hover_glow.webp` / `selected_ring.webp` yang dulu bermasalah.

## File dalam patch ini

```
src/components/worldFx.tsx      -> BARU (semua efek atmosfer)
src/components/WorldScene.tsx   -> TIMPA (integrasi efek + Retina)
```

Hanya 2 file. **Tidak menyentuh** `worlds.ts`, `BriMascot.tsx`, `App.tsx`, atau file game manapun.

## Langkah pemasangan

1. `Ctrl+C` hentikan `npm run dev`.
2. Salin kedua file ke `src/components/`.
3. Jalankan:
   ```powershell
   npm run typecheck
   npm run build
   npm run dev
   ```
4. **Hard refresh**: `Ctrl+Shift+R`.

## Uji coba

1. Buka aplikasi — perhatikan pulau **muncul satu per satu** (pop-in bertahap), bukan langsung semua
2. Lihat bagian bawah peta: **lautan dengan riak melingkar** yang terus mengembang
3. Perhatikan latar: **berkas cahaya matahari** miring bergerak pelan
4. Tunggu sebentar: **burung-burung melintas** sambil naik-turun
5. Arahkan kursor ke sebuah pulau — **aura berwarna tema dunia itu** menyala lebih terang
6. Klik pulau — muncul **kerucut cahaya dari langit** + **kilau partikel** berwarna tema
7. Jika ada dunia dengan mastery ≥ 70%, pulau itu punya **cincin emas berputar**
8. Geser untuk memutar peta — semua efek tetap mulus
9. Coba di HP — pastikan kamera tetap menyesuaikan (lebih dekat di layar sempit)

## Soal "yang lainnya di-improve"

Untuk bagian **di luar peta 3D** (panel misi di samping, hero section, bottom nav), itu ada di `App.tsx` dan `styles.css` — dua file yang **tidak saya miliki salinannya**. Kalau mau saya tingkatkan juga:

- Kirimkan isi `App.tsx` ke chat, **atau**
- Upload ulang zip proyek terbaru

Saya sengaja tidak menebak-nebak isinya karena risiko menimpa fitur yang sudah Anda bangun.

## Jika ada error saat build

Kirimkan pesan error TypeScript lengkap — polanya sudah terbukti cepat diperbaiki.
