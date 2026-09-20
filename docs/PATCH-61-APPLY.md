# Patch 61 — Kapal & aset baru untuk Penerbangan Ilmu

**Sifat patch:** peningkatan visual. Tanpa dependency baru, tanpa aset
eksternal.

---

## ⚠️ Catatan jujur: prosedural, bukan GLB

Referensi Anda menunjukkan struktur ekspor berkas GLB:

```
01_ship/ship_main.glb
02_asteroid_clouds/asteroid_large.glb
05_particles/engine_flame.glb
```

**Saya tidak bisa membuat berkas GLB.** Itu hasil kerja perangkat
pemodelan 3D seperti Blender — bukan sesuatu yang bisa saya tulis
sebagai kode.

Yang saya kerjakan: membangun kapal dan asetnya **secara prosedural**
di Three.js — geometri yang dihitung dari kode.

### Kenapa itu justru lebih baik untuk proyek ini

| | GLB | Prosedural |
|---|---|---|
| Bisa gagal dimuat | Ya | **Tidak pernah** |
| Menambah ukuran bundel | Ya | Tidak |
| Ubah warna | Ekspor ulang | Ubah satu baris |
| Riwayat proyek ini | ❌ dua kali gagal | ✅ selalu berhasil |

Baris terakhir penting. Aturan larangan aset eksternal lahir dari dua
kejadian nyata:

- **Patch 03** — `<Environment>` drei mengunduh HDR dari CDN, scene macet
- **Patch 12–15** — berkas `.webp` berulang kali gagal dimuat

Kalau nanti Anda punya artis 3D yang membuat GLB sungguhan, komponen
ini bisa diganti tanpa menyentuh logika permainan.

---

## Yang dibangun

### 1. Kapal (`ShipModel.tsx`)

Mengikuti anatomi pada referensi:

| Bagian | Wujud |
|---|---|
| Hidung runcing | Kerucut putih memanjang, ujung navy |
| Badan | Kotak membulat, perut navy |
| Kanopi kristal | Biru tembus pandang (`transmission` fisis) |
| Sayap | Bentuk kustom menyapu ke belakang, bukan kotak |
| Dua nacelle mesin | Navy besar mengapit badan |
| Semburan | Kerucut oranye berdenyut, inti terang |
| Sirip tegak | Di belakang kanopi |
| Lampu navigasi | Biru di ujung sayap |

**Detail yang menentukan rasa:**

- **Api berdenyut acak** — dua sinus berfrekuensi tidak kelipatan (18
  dan 27), sehingga polanya tidak pernah terlihat berulang. Api dengan
  irama tetap justru terbaca sebagai lampu, bukan nyala.
- **Api memanjang saat bermanuver** — dorongan naik saat kapal
  berpindah jalur, memberi rasa tenaga.
- **Sayap dari bentuk kustom** — kotak akan terbaca sebagai papan;
  ujung runcing dengan tepi menyapu jauh lebih mendekati pesawat tempur.

**Kenapa badan tidak putih murni:** putih `#ffffff` kehilangan seluruh
detail begitu terkena cahaya terang. Krem sangat terang `#eef1f7`
menyisakan ruang bagi bayangan, sehingga lekuk badan tetap terlihat —
dan di layar mata tetap membacanya sebagai putih.

### 2. Medan asteroid (`SpaceField.tsx`)

Menggantikan "awan" lama yang memakai dodecahedron putih semi-tembus.

| Unsur | Detail |
|---|---|
| Bongkahan dekat | 22 buah, es-biru bersegi, berputar |
| Bongkahan jauh | 12 buah, lebih besar & pucat, memberi kedalaman |
| Butiran bintang | 170 titik melintas |
| Berkas cahaya | 5 berkas miring, *additive blending* |

**Gradasi dipanggang ke geometri.** Tiap bongkah punya pola yang sama —
puncak terang, dasar gelap — jadi warnanya dipanggang langsung ke
verteks. Dibuat sekali, dipakai semua instance, nol biaya tambahan.

Variasi antar-bongkah ditangani terpisah lewat `setColorAt`, yang
bekerja sebagai **pengali**. Karena itu materialnya diberi warna putih:
putih adalah nilai netral bagi perkalian.

**Semuanya `InstancedMesh`** — puluhan bongkahan hanya memakan 2 draw
call, bukan puluhan.

---

## Cara memasang

```powershell
# 1. Salin folder src/ ke proyek
# 2. Pasang ke permainan
node upgrade-ship.mjs

# 3. Build
npm run build
```

### Kenapa skrip, bukan menimpa SkyRunGame.tsx

Berkas `SkyRunGame.tsx` milik Anda memuat perbaikan `onReadTick` dari
Patch 60 yang **tidak saya pegang salinannya**. Menimpanya secara buta
akan menghapus perbaikan itu — dan pesawat macet lagi.

Skrip bekerja secara bedah: mencari batas fungsi `Ship` dan `Clouds`
dengan **menghitung kurawal**, lalu menggantinya.

Penghitungan kurawal tidak bergantung pada spasi, indentasi, urutan
atribut, maupun akhir baris CRLF Windows — pelajaran dari Patch 58, di
mana regex yang menuntut tata letak persis gagal di mesin Anda.

Kurawal di dalam string dan komentar **diabaikan**. Tanpa itu, sebuah
string berisi `{` akan mengacaukan perhitungan.

---

## Hasil uji skrip

| Uji | Hasil |
|---|---|
| Berkas CRLF Windows | ✅ 4/4 perubahan diterapkan |
| **`onReadTick` bertahan** | ✅ **2 kemunculan utuh** |
| Kurawal di dalam string | ✅ Diabaikan dengan benar |
| Dijalankan dua kali | ✅ Dilewati, nol duplikasi |
| Tanpa baris impor | ✅ Disisipkan di atas, exit 0 |
| Fungsi `Ship` tidak ada | ✅ Exit 1 (sinyal galat benar) |

Baris kedua yang paling penting — itu membuktikan perbaikan Patch 60
Anda tidak akan terhapus.

### Cacat yang tertangkap saat menguji

Uji kasus tepi mengungkap skrip keluar dengan kode `0` padahal gagal
menemukan baris impor — seharusnya `1`. Selain itu pesannya menyesatkan
untuk berkas yang memang tidak punya impor bergaya `from '...'`.

Sudah diperbaiki: kini impor disisipkan di paling atas (selalu sah
secara sintaks) dengan peringatan, bukan berhenti dengan galat.

---

## File dalam patch ini

```
upgrade-ship.mjs                      (SKRIP — jalankan setelah menyalin src/)
src/game/skyrun/ShipModel.tsx         (BARU — kapal)
src/game/skyrun/SpaceField.tsx        (BARU — asteroid & partikel)
```

### Yang TIDAK disentuh

| Berkas | Alasan |
|---|---|
| `SkyRunGame.tsx` | Hanya disentuh skrip, secara bedah |
| `skyRunQuestions.ts` | Logika soal tidak berubah |
| `FroggyGame.tsx` | Di luar cakupan |
| `styles.css` | Kebijakan file lengkap |

---

## Checklist uji

**Kapal:**
- [ ] Kapal jauh lebih detail — hidung runcing, sayap menyapu, dua mesin
- [ ] Kanopi biru **tembus pandang**, bukan biru pekat
- [ ] Semburan mesin **berdenyut**, tidak berirama tetap
- [ ] Saat berpindah jalur, api **memanjang** sesaat
- [ ] Lampu biru menyala di ujung sayap
- [ ] Kapal memiringkan badan saat bermanuver, lalu lurus lagi

**Medan:**
- [ ] Bongkahan **es-biru bersegi**, bukan awan putih
- [ ] Sisi atas bongkahan lebih terang dari sisi bawah
- [ ] Bongkahan **berputar pelan** sambil melaju
- [ ] Ada bongkahan besar pucat di kejauhan
- [ ] Butiran bintang melintas
- [ ] Latar biru **lebih pekat** dari sebelumnya

**Regresi — paling penting:**
- [ ] `npm run build` lolos tanpa galat
- [ ] Bilah "Baca dulu..." tetap muncul lalu **habis**
- [ ] Gerbang **tetap bergerak** setelah fase baca
- [ ] Menjawab soal masih berfungsi normal

---

## Hasil verifikasi

| Pemeriksaan | Hasil |
|---|---|
| Sintaks skrip (`node --check`) | ✅ Lolos |
| Keseimbangan kurung, 2 berkas | ✅ Seimbang |
| Import menganggur | ✅ Nol temuan |
| Non-ASCII di nilai warna | ✅ Bersih |
| Uji skrip, 4 kasus | ✅ Semua lolos |

**Belum bisa saya verifikasi:** `npm run build` — `node_modules` tidak
tersedia di lingkungan kerja saya.

---

## Catatan performa

`transmission` pada kanopi adalah efek yang relatif mahal — ia merender
ulang apa yang ada di belakang kaca.

Karena hanya ada **satu** kanopi di layar, biayanya dapat diterima.
Bila ada laporan lambat di perangkat tertentu, ganti
`meshPhysicalMaterial` pada kanopi menjadi `meshStandardMaterial`
dengan `transparent` dan `opacity` — tampilannya sedikit kurang
meyakinkan, tapi jauh lebih ringan.
