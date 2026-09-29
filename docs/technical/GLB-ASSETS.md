# Audit startup dan aset GLB ? 20 September 2026

## Penyebab browser tidak terbuka

Pada pemeriksaan, port 5173 didengarkan proses `Code.exe` (proxy VS Code),
bukan Vite; permintaan HTTP timeout. Vite berhasil berjalan pada 5174.
`vite.config.ts` sekarang memakai port awal 5174. Jalankan `npm run dev`
dan buka URL **Local** yang dicetak terminal (port bisa bergeser jika sudah dipakai).
Jangan membuka `dist/index.html` lewat `file://`; gunakan `npm run preview`.
TypeScript awal lolos; tidak ditemukan crash JavaScript pada startup Chromium dengan WebGL.

## Hasil optimasi

| Aset | Sebelum | Sesudah | Segitiga sebelum ? sesudah | Pemakaian |
|---|---:|---:|---:|---|
| `pesawat.glb` | 16.19 MB | 200.4 KB | 544,694 ? 7,500 | Peta + Penerbangan Ilmu |
| `pulau-quran.glb` | 24.12 MB | 513.6 KB | 814,202 ? 13,984 | Pulau Quran baru dari `meshy-pulauquran2.glb` |
| `pulau-arabic.glb` | 25.61 MB | 602.5 KB | 855,074 ? 16,834 | Pulau Bahasa Arab dari model Quran lama |
| `pulau-digital.glb` | 49.93 MB | 517.3 KB | 1,792,726 ? 13,998 | Pulau Digital + Cyber Safety Sorter |
| `menara.glb` | 93.73 MB | 709.5 KB | 3,390,098 ? 18,000 | Pintu Menara Latihan pada peta |
| `bri.glb` | 5.24 MB | 26.5 KB | 291,108 ? 7,000 | Maskot Bri pada peta |
| `froggy.glb` | 10.41 MB | 218.4 KB | 166,228 ? 11,998 | Model idle pemain game Lompat Katak |
| `froggy-jump.glb` | 9.40 MB | 249.4 KB | 115,060 ? 12,000 | Model pose lompat pemain game Lompat Katak |
| `froggy-lily-pad.glb` | 6.86 MB | 136.5 KB | 63,770 ? 9,000 | Daun teratai GLB untuk arena Lompat Katak |
| `froggy-lotus.glb` | 12.28 MB | 234.0 KB | 244,580 ? 8,998 | Bunga teratai dekoratif arena Lompat Katak |
| `froggy-cattail-grove.glb` | 9.96 MB | 204.3 KB | 158,132 ? 8,000 | Rumpun cattail/reed dekoratif arena Lompat Katak |
| `froggy-lantern-oasis-a.glb` | 16.09 MB | 278.1 KB | 339,944 ? 8,988 | Lentera oasis dekoratif arena Lompat Katak |
| `froggy-lantern-oasis-b.glb` | 18.73 MB | 348.0 KB | 418,262 ? 8,992 | Variasi lentera oasis dekoratif arena Lompat Katak |
| `froggy-lotus-leaf-sign.glb` | 13.46 MB | 305.8 KB | 237,802 ? 8,986 | Papan daun/oasis dekoratif arena Lompat Katak |
| `cloud-pastel-drift.glb` | 9.54 MB | 153.9 KB | 108,668 ? 12,000 | Gugus awan pastel 3D peta dunia |
| `starbound-wanderer.glb` | 13.40 MB | 298.9 KB | 241,650 ? 14,000 | Karakter dekoratif foreground peta |
| `white-cat-red-scarf.glb` | 11.11 MB | 191.4 KB | 192,972 ? 9,000 | Kucing pendamping foreground peta |
| `numeria-boxhead-backpacker.glb` | 6.93 MB | 237.9 KB | 88,152 ? 12,000 | Karakter penyeberang game Numeria |
| `numeria-blue-banner-outpost.glb` | 12.18 MB | 292.5 KB | 212,276 ? 12,000 | Outpost kiri game Numeria |
| `numeria-mooncrest-outpost.glb` | 11.55 MB | 323.9 KB | 152,980 ? 11,998 | Outpost kanan game Numeria |

Total aset GLB runtime di `public/assets/models/` kini sekitar 7,90 MB. Model kodok idle
memakai pose lama agar tetap duduk di daun; model kodok berdiri terbaru hanya dipakai
saat fase lompat dan dioptimalkan dari source 9,40 MB menjadi 249,4 KB (97,35% lebih kecil);
model awan pastel baru menjadi 153,9 KB dari source 9,54 MB. Tiga model Numeria baru
dioptimalkan dari total 30,66 MB sumber menjadi 854,3 KB runtime.
Angka adalah byte berkas, bukan konsumsi RAM/GPU atau ukuran download gzip.
Tidak ada model khusus Numeria/Adab/English dalam berkas yang diberikan;
visual dan mekanik dunia tersebut dipertahankan. Menara tetap membuka Latihan,
bukan mata pelajaran ketujuh. Pesawat SkyRun mempertahankan efek tembakan.

## Pipeline yang dapat diulang

Sumber Meshy asli tetap di root; Bri asli dicadangkan di `assets-source/models/bri.glb`.
Sumber Quran baru dari Downloads disalin ke `assets-source/models/meshy-pulauquran2.glb`.
Sumber kodok idle disalin ke `assets-source/models/meshy-froggy.glb`; sumber pose lompat
disalin ke `assets-source/models/meshy-froggy-jump.glb`.
Sumber dekor Lompat Katak disalin ke `assets-source/models/meshy-froggy-lily-pad.glb`,
`meshy-froggy-low-poly-lotus.glb`, `meshy-froggy-cattail-grove.glb`,
`meshy-froggy-lantern-oasis-a.glb`, `meshy-froggy-lantern-oasis-b.glb`, dan
`meshy-froggy-lotus-leaf-sign.glb`.
Sumber awan Meshy aktif disalin ke `assets-source/models/meshy-pastel-cloud-drift.glb`.
Sumber karakter foreground disalin ke `assets-source/models/meshy-starbound-wanderer.glb`
dan `assets-source/models/meshy-white-cat-red-scarf.glb`.
Sumber Numeria baru disalin ke `assets-source/models/meshy-numeria-boxhead-backpacker.glb`,
`meshy-numeria-blue-banner-outpost.glb`, dan `meshy-numeria-mooncrest-outpost.glb`.
Background dan tekstur papan Numeria disimpan sebagai PNG lokal di `public/assets/numeria/`.
Hanya hasil di `public/assets/models/` dikirim ke aplikasi. `dist/` adalah keluaran build;
aset Android diperbarui dengan `npx cap copy android`, bukan dioptimalkan ulang.
Jangan menimpa sumber dengan hasil kompresi karena simplifikasi berulang mengurangi kualitas.

Alat hanya untuk pengolahan aset, tanpa dependency runtime/package.json baru:

```powershell
npm install --prefix "$env:TEMP/brightoria-asset-tools" --no-audit --no-fund @gltf-transform/core@4.5.0 @gltf-transform/extensions@4.5.0 @gltf-transform/functions@4.5.0 meshoptimizer sharp
$env:BRIGHTORIA_ASSET_TOOLS="$env:TEMP/brightoria-asset-tools"
node scripts/optimize-models.mjs
npm run typecheck
npm run build
npx cap copy android
```

Pipeline: dedup ? prune ? weld ? simplify (error 0.01) ? WebP 512/1024,
quality 80 ? prune ? Meshopt. Batas simplifikasi tunduk pada batas error;
Arabic berhenti di 16.834 segitiga, bukan target 14.000. Hasil rinci tersimpan
pada `glb-optimization.json`. Material/warna dipertahankan, detail geometri dikurangi.
Meshopt decoder tersedia dari drei lokal; Draco dinonaktifkan, tidak perlu CDN.

`LocalModel` menormalkan ukuran lewat bounding box dan mengklon node; geometri/material
cache dibagi tanpa dibuang ketika satu scene ditutup. Setiap model dibatasi Suspense
serta error boundary lokal. Pulau kembali ke gambar asli, menara/pesawat kembali
ke geometri prosedural jika GLB gagal. Bri memiliki boundary tersendiri.
Preview Quran/Arabic/Digital memakai render on demand. Canvas game dan CharacterPicker
kini juga dibungkus boundary di luar Canvas agar kegagalan pembuatan WebGL tertangkap.

## Status kode yang diverifikasi

- Enam game terpisah di App; Quran drag-line, Adab branching story, English letter-builder.
- Numeria kini memiliki mode misi dan endless; ada SkyRun, Froggy, Ekspedisi, Latihan,
  profil karakter, dan modul pendamping tambahan. Deskripsi Patch 10 bukan status terkini.
- Froggy memakai `public/assets/models/froggy.glb` saat idle/berdiri di daun dan
  `public/assets/models/froggy-jump.glb` saat fase lompat, dengan kodok prosedural
  lama sebagai fallback Suspense/error boundary lokal.
- Numeria memakai background oasis PNG lokal, tekstur papan PNG lokal, serta tiga GLB
  baru untuk backpacker dan outpost ujung jembatan. Canvas Numeria dibuat transparan
  dan post-processing menjaga alpha agar background tidak tertutup hitam.
- Arena Froggy kini memakai GLB daun teratai, bunga lotus, cattail, lentera, dan
  papan daun oasis sebagai dekor runtime kecil. Air terjun dan percikan air dibuat
  prosedural/animatif di scene agar tidak menambah aset video atau musik.
- Peta dunia memakai `cloud-pastel-drift.glb` untuk ring awan 3D. Layer awan
  prosedural global dan siluet gunung segitiga tidak dirender lagi; awan prosedural
  ring tetap menjadi fallback jika aset GLB gagal dimuat.
- Peta dunia menambahkan vignette foreground kecil berupa platform batu prosedural,
  `starbound-wanderer.glb`, dan `white-cat-red-scarf.glb`. PNG referensi UI/asset sheet
  dari user dipakai sebagai arahan komposisi, bukan ditempel mentah ke runtime.
- Peta tetap R3F + OrbitControls; posisi `worlds.ts` tetap cincin Z -1,9 sampai +1,9.
- `main.tsx` tetap membungkus App dengan AppErrorBoundary.
- Tidak ada perubahan kontrak evidence/mastery/XP atau penambahan musik.
- Semua konten kurikulum AI tetap **draft**, belum disahkan tim akademik Bright Academy.
- Ada file `.bak` dan skrip patch lama; klaim lama bahwa seluruh repo bebas artefak tidak akurat.
- Build saat audit: app sekitar 486 KB, three-vendor sekitar 1.175 KB, lucide sekitar 13 KB
  sebelum gzip. Klaim lama app <200 KB sudah tidak berlaku. Vite memberi peringatan
  campuran static/dynamic import; build tetap berhasil.
- Build Android pada perangkat fisik serta pengesahan akademik belum diverifikasi.

## Validasi

Khronos glTF Validator: nol error pada enam output. Lima model bertekstur memberi
peringatan tangent space dihitung runtime; validator tidak mendukung pemeriksaan
internal ekstensi Meshopt. Decode dan tampilan diuji dengan loader aplikasi di Chromium.
Pengujian browser dan hasil akhir dicatat di changelog patch ini.

### Hasil pengujian akhir

- `npm run typecheck` dan `npm run build`: lulus; peringatan static/dynamic import lama tetap ada.
- Chromium: keenam layar game terbuka, jawaban Digital menghasilkan feedback, SkyRun mode
  Angka masuk permainan dengan model pesawat menghadap arah penerbangan.
- Enam GLB diminta dari server lokal dan dapat didekode; tidak ada error JavaScript
  pada alur normal yang diuji. Tampilan Quran, peta, dan SkyRun diperiksa lewat screenshot.
- Viewport 390 ? 844: tidak ada overflow horizontal pada halaman peta.
- Simulasi semua request GLB gagal: enam label peta tetap ada, fallback setiap model bekerja.
  Error fetch yang disengaja tercatat; peta tidak berubah menjadi kosong.
- Simulasi WebGL2 tidak tersedia: grid pilihan dunia dan fallback Numeria muncul,
  App tetap terpasang. Deteksi diperlukan karena kegagalan context tidak selalu melempar error React.
- `npx cap copy android`: lulus. Ini bukan pengujian APK pada perangkat fisik.
- Pengujian ini smoke test, bukan penyelesaian seluruh level atau pengukuran FPS perangkat fisik.
