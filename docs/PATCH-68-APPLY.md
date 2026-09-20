# Patch 68 — Pulihkan dari Patch 66 + hiasan peta

**Sifat patch:** pemulihan darurat + peningkatan visual peta.

---

## Urutan pemasangan

```powershell
# 1. PULIHKAN DULU — ini yang membuat permainan bisa dipakai lagi
node undo-p66.mjs
npm run build          # pastikan lolos sebelum lanjut

# 2. Baru pasang hiasan peta
#    (salin folder src/ ke proyek lebih dulu)
node install-mapdecor.mjs
npm run build
```

Jangan lanjut ke langkah 2 sebelum langkah 1 lolos build.

---

## Bagian 1 — Hasil audit: dua tersangka

Saya membandingkan Patch 65 (terbukti jalan) dengan Patch 66 (rusak).
Hanya **dua** perubahan yang berisiko tinggi:

| Perubahan | Risiko | Kenapa |
|---|---|---|
| Pendengar lock di `SkyRunGame` | **Tinggi** | Temporal Dead Zone → komponen runtuh |
| `MutationObserver` di `FireButton` | **Tinggi** | Memindai dokumen ratusan kali/detik |
| `paused` tambah `!== 'between'` | Rendah | Hanya satu boolean |
| Pendengar event di `Blaster` | Rendah | Terpasang & dilepas rapi |
| `paintFacets` di `SpaceField` | Rendah | Hanya saat membangun geometri |

### Tersangka 1 — Temporal Dead Zone

Blok disisipkan **sebelum** `handleCross` dideklarasikan. Saat render,
daftar dependensi membaca `handleCross` yang masih di TDZ →
`ReferenceError` → seluruh komponen runtuh.

### Tersangka 2 — MutationObserver

```js
observer.observe(document.body, { childList: true, subtree: true });
// callback memanggil querySelector('.skr-overlay')
```

`SkyRunGame` memanggil `setReadUi` **~50 kali** selama fase baca 2,6
detik. Tiap render ulang menyentuh DOM → observer terpicu → pemindaian
dokumen penuh. Ditambah React Three Fiber yang juga menyentuh DOM tiap
frame, itu bisa **ratusan pemindaian per detik**.

Bukan loop tak berujung — tapi cukup untuk membekukan perangkat kelas
menengah.

### Kenapa membuang, bukan memperbaiki

Tiga patch terakhir semuanya gagal karena saya **menambahkan** sesuatu
ke berkas yang tidak saya lihat isinya.

Membuang jauh lebih aman: polanya sudah pasti ada, dan hasilnya bisa
diverifikasi. Tombol tembak akan dikembalikan nanti lewat versi ringan
tanpa observer — setelah Anda mengirimkan `SkyRunGame.tsx`.

---

## Bagian 2 — Hiasan peta

Referensi yang Anda kirim memperlihatkan peta isometrik yang jauh lebih
kaya. Tapi tidak semuanya bisa dipindahkan ke peta 3D.

### Yang diambil

| Elemen | Fungsinya |
|---|---|
| **Jalur titik emas** | Menunjukkan **urutan** perjalanan, bukan sekadar hiasan. Titiknya mengalir dari pulau asal ke tujuan |
| **Panji berwarna** | Tiang bendera sewarna dunianya di atas tiap pulau. Terlihat dari jauh tanpa membaca label |
| **Cincin awan** | Membingkai dunia & menyembunyikan tepi laut yang terpotong |
| **Puncak gunung** | Kedalaman atmosfer. Tanpa siluet jauh, dunia terasa datar |

### Yang TIDAK diambil — dan alasannya jujur

**Arsitektur pulau yang sangat detail** (masjid berkubah emas, pasar,
benteng). Itu hasil kerja artis 3D di Blender. Saya tidak bisa membuat
berkas GLB.

**Tata letak isometrik tetap.** Peta Brightoria wajib bisa diputar dan
di-zoom. Mengunci sudut pandang akan melanggar kebijakan yang sudah dua
kali mengalami regresi.

### Detail yang menentukan rasa

**Jalur melengkung, bukan lurus.** Garis lurus terbaca sebagai
penggaris; lengkungan terbaca sebagai perjalanan.

**Titik mengecil di kedua ujung.** Tanpa ini, titik muncul dan hilang
mendadak di pulau — terlihat seperti kedipan, bukan aliran.

**Bendera berkibar dengan dua frekuensi** yang tidak saling membagi,
sehingga polanya tidak pernah berulang. Bendera kaku terbaca sebagai
papan, bukan kain.

**Tiang panji dijaga rendah** (1,12 unit). Pelajaran Patch 37: apa pun
yang menjulang tinggi menutupi pulau tetangga.

### `worlds.ts` tidak disentuh

`MapDecor` hanya **membaca** posisi pulau. Formasi cincinnya sudah dua
kali mengalami regresi, dan saya tidak akan menyentuhnya lagi.

---

## File dalam patch ini

```
undo-p66.mjs                              (SKRIP — jalankan pertama)
install-mapdecor.mjs                      (SKRIP — jalankan kedua)
src/components/world3d/MapDecor.tsx       (BARU)
```

### Kenapa skrip ini lebih aman dari sebelumnya

Skrip Patch 61 dan 66 **mengganti blok fungsi** — keduanya rusak karena
saya salah menebak batas fungsinya.

Skrip ini hanya **menyisipkan dua baris**. Menyisipkan jauh lebih aman:
tidak perlu tahu di mana sesuatu berakhir.

Keduanya juga memeriksa keseimbangan kurung **sebelum** menulis. Bila
tidak seimbang, berkas tidak disentuh sama sekali.

---

## Pemasangan manual (bila skrip gagal)

Buka `src/components/WorldScene.tsx`:

**1.** Tambahkan di antara impor lain:

```tsx
import MapDecor from './world3d/MapDecor';
```

**2.** Cari `<GroundRings />` di dalam `Scene`, tambahkan sesudahnya:

```tsx
<MapDecor />
```

Selesai. Hanya itu.

---

## Checklist uji

**Pemulihan (langkah 1):**
- [ ] `node undo-p66.mjs` melaporkan "Struktur seimbang"
- [ ] `npm run build` **lolos tanpa galat**
- [ ] Buka Penerbangan Ilmu → **tidak lagi muter-muter**
- [ ] Kapal, asteroid, semburan mesin semuanya terlihat
- [ ] Gerbang bergerak, soal bisa dijawab

**Hiasan peta (langkah 2):**
- [ ] Jalur titik emas menghubungkan pulau-pulau
- [ ] Titiknya **mengalir**, bukan diam
- [ ] Ada panji berwarna di atas tiap pulau
- [ ] Bendera **berkibar** pelan
- [ ] Awan membingkai tepi peta
- [ ] Gunung pucat terlihat di kejauhan

**Regresi:**
- [ ] Enam pulau **masih di posisi semula**
- [ ] Peta masih bisa diputar & di-zoom
- [ ] Ketuk pulau → kartu misi muncul
- [ ] Menara Latihan tetap di tengah

---

## Hasil verifikasi

| Pemeriksaan | Hasil |
|---|---|
| `undo-p66.mjs` — sintaks | ✅ Lolos |
| `undo-p66.mjs` — uji tiruan CRLF | ✅ Lock listener hilang, struktur seimbang |
| `install-mapdecor.mjs` — sintaks | ✅ Lolos |
| `install-mapdecor.mjs` — uji tiruan | ✅ 2 sisipan, idempoten |
| `MapDecor.tsx` — kurung | ✅ Seimbang |
| `MapDecor.tsx` — import menganggur | ✅ Nol |
| `worlds.ts` disentuh | ✅ Tidak, hanya dibaca |

**Belum bisa saya verifikasi:** `npm run build` — `node_modules` tidak
tersedia di lingkungan kerja saya.

---

## Yang saya butuhkan untuk mengembalikan tombol tembak

Kirimkan `src/game/skyrun/SkyRunGame.tsx`.

Empat patch terakhir gagal karena saya menebak isinya. Saya tidak akan
menebak untuk kelima kali — dengan berkasnya di tangan, saya bisa
menyisipkan pendengar di tempat yang benar sejak percobaan pertama.
