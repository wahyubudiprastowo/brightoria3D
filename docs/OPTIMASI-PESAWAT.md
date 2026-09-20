# Mengecilkan `meshypesawat.glb`

## Kenapa ini wajib, bukan pilihan

Hasil bedah berkas Anda (angka nyata, dibaca langsung dari berkasnya):

| Ukuran | Berkas Anda | Anggaran wajar | Selisih |
|---|---|---|---|
| Segitiga | **544.694** | ~5.000 | **109x lipat** |
| Vertex | 293.646 | ~3.000 | 98x lipat |
| Berkas | **15,44 MB** | ~300 KB | 51x lipat |

Tambahan temuan: **2,24 MB (14,5%) dari berkas itu `bufferView` yatim** —
data yang tidak dirujuk oleh apa pun. Sisa ekspor yang ikut terbawa.

Aset peta di Brightoria saat ini (`bri.glb`) dipakai sebagai maskot kecil
di sudut layar. Pesawat ini akan terbang di peta yang SUDAH merender enam
pulau, awan bergerak, garis jalur, dan partikel. Menambahkan 544.694
segitiga ke sana akan membekukan perangkat kelas menengah.

## Fakta lain yang memengaruhi kode

- **Tidak ada animasi.** Model statis. Baling-baling tidak akan berputar
  sendiri.
- **Satu mesh, satu material.** Baling-baling sudah menyatu dengan badan,
  jadi tidak bisa diputar terpisah. `MapPlane.tsx` menggambar ulang
  baling-baling lewat kode sebagai solusinya.
- **`EXT_texture_webp` berstatus WAJIB.** Three.js r179 mendukungnya, tapi
  pemuatan tetap bisa gagal. Karena itu komponennya punya cadangan.
- **Skala node 0,000116.** Hasil ekspor beda satuan. `MapPlane.tsx`
  menormalkan ukuran sendiri, jadi ini tidak jadi masalah.

---

## Langkah pengecilan

### Pasang alatnya

```bash
npm install -g @gltf-transform/cli
```

### Cara cepat (satu perintah)

```bash
gltf-transform optimize meshypesawat.glb pesawat.glb \
  --simplify-error 0.002 \
  --texture-size 1024 \
  --compress meshopt
```

### Cara bertahap (lebih terkendali — saya sarankan ini)

Jalankan satu per satu supaya Anda bisa memeriksa hasil tiap langkah.

```bash
# 1. Buang bufferView yatim — langsung hemat 2,24 MB tanpa efek visual
gltf-transform prune meshypesawat.glb p1.glb

# 2. Kurangi segitiga ke ~1% (544.694 -> ~5.400)
#    --error mengendalikan seberapa jauh bentuk boleh menyimpang.
#    0.002 aman untuk benda yang dilihat dari jauh seperti ini.
gltf-transform simplify p1.glb p2.glb --ratio 0.01 --error 0.002

# 3. Kecilkan tekstur. 1024 sudah berlebihan untuk pesawat
#    selebar ~60 piksel di layar; coba 512 kalau mau lebih ringan.
gltf-transform resize p2.glb p3.glb --width 1024 --height 1024

# 4. Padatkan geometri
gltf-transform meshopt p3.glb pesawat.glb

# 5. Periksa hasilnya
gltf-transform inspect pesawat.glb
```

**Target yang Anda tuju:** di bawah 8.000 segitiga dan di bawah 400 KB.

Kalau langkah 2 membuat pesawatnya terlihat rusak, naikkan `--ratio`
bertahap: `0.02`, lalu `0.04`. Jangan turunkan `--error` — itu justru
membuat pengecilan makin konservatif dan berkasnya tetap berat.

### Taruh hasilnya

```bash
cp pesawat.glb public/assets/models/pesawat.glb
```

---

## Memasang komponennya

Salin `src/components/world3d/MapPlane.tsx` ke proyek, lalu sisipkan ke
`src/components/WorldScene.tsx`.

`MapDecor` sudah terpasang di sana (baris 18 dan 363), jadi ikuti pola
yang sama:

```tsx
// di bagian import, dekat baris 18
import MapDecor from './world3d/MapDecor'; // <- sudah ada
import MapPlane from './world3d/MapPlane';   // <- tambahkan ini
```

```tsx
// di dalam <Suspense>, dekat baris 363 tempat <MapDecor /> berada
<MapDecor />
<MapPlane />        {/* <- tambahkan ini */}
```

`MapPlane` harus berada **di dalam `<Suspense>`** karena `useGLTF`
menangguhkan render saat memuat. Menaruhnya di luar akan membuat peta
berkedip kosong saat pemuatan.

### Menyetel

```tsx
<MapPlane span={0.62} period={46} />
```

- `span` — bentang sayap dalam unit dunia. Pulau berukuran ~2,3, jadi
  0,62 membuat pesawat terlihat kecil dan jauh. Naikkan ke 0,9 kalau
  mau lebih menonjol.
- `period` — detik untuk satu putaran penuh. Makin kecil makin cepat.
  Di bawah 25 mulai terasa gelisah untuk anak-anak.

---

## Kalau pesawatnya tidak muncul

Komponennya sengaja **tidak pernah menjatuhkan peta**. Kalau GLB gagal
dimuat, ia berpindah ke pesawat cadangan buatan kode dan mencatat
alasannya di Console.

Buka Console (F12) dan cari baris yang diawali `[Brightoria] MapPlane`.

| Yang Anda lihat | Artinya |
|---|---|
| Pesawat cadangan sederhana muncul | GLB gagal dimuat — cek pesan di Console |
| 404 pada `/assets/models/pesawat.glb` | Berkas belum disalin ke `public/assets/models/` |
| Tidak ada pesawat sama sekali | `<MapPlane />` belum disisipkan, atau di luar `<Suspense>` |
| Peta ikut blank | Laporkan ke saya — pembatas galatnya bocor |

### Catatan soal jalur berkas

Proyek ini memakai jalur absolut (`/assets/...`) untuk berkas di `public/`,
sementara `vite.config.ts` memakai `base: './'`. Artinya **bundel JS**
memakai jalur relatif, tapi **aset di `public/` tetap absolut**.

Itu berfungsi normal di:
- `npm run dev`
- `npm run preview`
- APK Capacitor (karena `androidScheme: 'https'` menyajikan dari
  `https://localhost`)

Itu **tidak** berfungsi bila Anda membuka `dist/index.html` langsung
lewat `file://` — semua aset akan 404 dan layarnya putih. Kalau itu
yang Anda alami, jalankan `npm run preview`, jangan klik ganda berkasnya.
