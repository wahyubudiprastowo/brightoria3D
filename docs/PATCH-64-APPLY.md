# Patch 64 — Kapal tiga mesin, batu kristal, semburan berlapis

**Sifat patch:** perbaikan visual. Tanpa dependency baru, tanpa aset eksternal.

---

## Cara memasang

```powershell
# Salin folder src/ ke proyek, lalu:
npm run build
```

**Tidak ada skrip yang perlu dijalankan.** `SkyRunGame.tsx` sudah
mengimpor `ShipModel` dan `SpaceField` sejak Patch 61, dan kontrak
keduanya tidak berubah.

`EngineTrail.tsx` adalah berkas baru di folder yang sama — ia hanya
dipakai oleh `ShipModel`, jadi tidak perlu disambungkan ke mana pun.

---

## Tiga selisih besar dari referensi

Umpan balik: *"pesawatnya masih jelek banget"*. Setelah membandingkan
v2 dengan gambar Anda, ada tiga perbedaan mendasar:

### 1. Jumlah mesin

| | v2 | v3 |
|---|---|---|
| Mesin | **2** | **3** |

Tampak depan pada referensi jelas memperlihatkan **tiga** lingkaran
oranye menyala: satu di tengah badan, dua di polong sayap. Ini
perbedaan paling mencolok, dan saya melewatkannya.

### 2. Panel kristal

v2 memakai kanopi bola halus. Referensi memperlihatkan **permata
bersudut** biru besar di punggung hidung, ditambah sisipan kristal di
sisi badan.

Diperbaiki memakai `IcosahedronGeometry` dengan `flatShading` — 20 sisi
datar yang menangkap cahaya berbeda-beda, persis seperti batu terasah.
Bola halus tidak akan pernah terbaca sebagai kristal, berapa pun
kilapnya.

### 3. Pelat baju zirah berlapis

v2 hanya satu kotak membulat polos. Referensi memperlihatkan pelat
**menumpuk** dengan tepi terlihat.

Diperbaiki dengan menyusun rangka navy sebagai lapisan dasar, lalu
menumpuk pelat putih di atasnya. Celah di antaranya menghasilkan garis
bayangan — itulah yang membuat lambung terbaca berlapis.

---

## Semburan mesin: empat lapis, bukan dua

Versi lama hanya dua kerucut dengan `transparent`. Hasilnya terbaca
sebagai benda oranye padat.

Referensi memperlihatkan empat lapis dengan tugas berbeda:

| Lapis | Tugas |
|---|---|
| **Cincin nozzle** | Cakram terang di pangkal — titik paling panas |
| **Inti** | Kerucut hampir putih, tipis & panjang |
| **Selubung** | Kerucut berwarna, lebih lebar |
| **Pendar luar** | Sangat lebar & samar |

Tanpa cincin nozzle, semburan tidak punya titik pangkal yang jelas — ia
terlihat menempel begitu saja di buritan.

### Kuncinya: AdditiveBlending

Dengan blending biasa, kerucut **menutupi** apa pun di belakangnya —
itulah yang membuatnya terbaca sebagai benda padat.

`AdditiveBlending` **menambahkan** warnanya ke latar. Dua lapis yang
bertumpuk otomatis menjadi lebih terang di area tumpangnya, persis
seperti cahaya sungguhan.

`depthWrite: false` wajib menyertainya — tanpa itu, lapis terdepan
menghalangi lapis di belakangnya dan efek tumpang-tindih hilang.

Tersedia tiga warna (`orange`, `blue`, `violet`) sesuai referensi,
meski saat ini hanya oranye yang dipakai.

---

## Batu kristal: kunci yang hilang di dua patch sebelumnya

Patch 61 dan 63 memakai gradasi **vertikal** — terang di atas, gelap di
bawah. Hasilnya terbaca sebagai batu biasa yang disinari, bukan
kristal.

Perhatikan referensi lebih teliti: **sisi-sisi yang bersebelahan punya
kecerahan yang jelas berbeda**, meski sama-sama menghadap atas. Itulah
yang membuat mata membacanya sebagai batu terasah — tiap sisi
memantulkan cahaya dengan sudut berbeda.

### Perbaikan: warna acak per-sisi

Versi ini memanggang kecerahan acak **per-sisi** ke dalam geometri:

```ts
const facet = 0.86 + rand() * 0.28;
c.multiplyScalar(facet);
```

Bisa dilakukan karena `IcosahedronGeometry` bersifat **non-indexed** —
tiap sisi punya tiga verteksnya sendiri. Jadi menyetel warna sama untuk
tiap kelipatan tiga menghasilkan satu warna per sisi.

Satu perubahan ini menyelesaikan masalah yang tidak tuntas di dua patch
sebelumnya.

---

## Awan low-poly

Referensi Anda memuat **dua** jenis objek, dan saya baru membuat satu.

| Jenis | Ciri |
|---|---|
| Batu kristal | Bongkahan biru bersisi lebar, berputar pelan |
| **Awan low-poly** | Gundukan putih **beralas rata**, tidak berputar |

Awan dibuat dengan menarik verteks di bawah garis tengah ke alas,
menghasilkan bentuk yang duduk rata — bukan bola melayang.

Awan sengaja **tidak berputar**. Awan yang berputar terlihat aneh, dan
itu satu-satunya isyarat yang membedakannya dari batu bagi mata.

---

## Catatan jujur: prosedural, bukan GLB

Referensi Anda adalah gambar render. **Saya tidak bisa membuat berkas
GLB** — itu hasil kerja perangkat pemodelan seperti Blender.

Kapal ini dihitung dari kode: tiap bagian dirakit dari bentuk dasar
Three.js. Hasilnya tidak akan seidentik gambar, tapi siluet, proporsi,
dan bahasa warnanya kini jauh lebih dekat.

Untuk proyek ini pendekatan itu justru lebih aman — aturan larangan
aset eksternal lahir dari dua kejadian nyata: HDR dari CDN di Patch 03,
dan berkas `.webp` di Patch 12–15, yang keduanya membuat scene gagal
dimuat.

Kalau nanti ada artis 3D yang membuat GLB sungguhan, komponen ini bisa
diganti tanpa menyentuh logika permainan.

---

## File dalam patch ini

```
src/game/skyrun/EngineTrail.tsx    (BARU  — semburan empat lapis)
src/game/skyrun/ShipModel.tsx      (TIMPA — kapal tiga mesin)
src/game/skyrun/SpaceField.tsx     (TIMPA — kristal per-sisi + awan)
```

### Yang TIDAK disentuh

| Berkas | Alasan |
|---|---|
| `SkyRunGame.tsx` | Kontrak `ShipModel` & `SpaceField` tidak berubah |
| `skyRunQuestions.ts` | Logika soal tidak berubah |
| `FroggyGame.tsx` | Di luar cakupan |

---

## Checklist uji

**Kapal:**
- [ ] **Tiga** semburan oranye terlihat dari belakang
- [ ] Permata biru bersudut di punggung hidung
- [ ] Pelat putih terlihat **berlapis**, ada garis bayangan di celahnya
- [ ] Winglet tegak di ujung kedua sayap
- [ ] Garis oranye di sayap
- [ ] Hidung menghadap **menjauh** dari penonton

**Semburan:**
- [ ] Ada **cakram terang** di mulut tiap knalpot
- [ ] Inti hampir putih, selubung oranye, pendar luar samar
- [ ] Berkedip **tidak berirama tetap**
- [ ] Memanjang saat berpindah jalur

**Medan:**
- [ ] Batu kristal: sisi bersebelahan **jelas beda kecerahannya**
- [ ] Bentuknya membulat bersegi, bukan berduri
- [ ] Ada **awan putih beralas rata** di kejauhan
- [ ] Awan tidak berputar, batu berputar

**Regresi:**
- [ ] `npm run build` lolos tanpa galat
- [ ] Bilah "Baca dulu..." muncul lalu habis
- [ ] Gerbang bergerak setelah fase baca
- [ ] Menjawab soal berfungsi normal

---

## Hasil verifikasi

| Pemeriksaan | Hasil |
|---|---|
| Keseimbangan kurung, 3 berkas | ✅ Semua seimbang |
| Import menganggur | ✅ Nol (satu tertangkap & dibuang) |
| Kontrak `ShipModel` & `SpaceField` | ✅ Tidak berubah |
| Tiga mesin terpasang | ✅ 3 pemanggilan `<Engine>` |
| Kristal bersudut | ✅ 3 pemanggilan `<Crystal>` |
| Warna per-sisi | ✅ Terpasang |
| Awan low-poly | ✅ Terpasang |
| `AdditiveBlending` di semburan | ✅ 6 titik |
| Non-ASCII di nilai warna | ✅ Bersih |

**Belum bisa saya verifikasi:** `npm run build` — `node_modules` tidak
tersedia di lingkungan kerja saya.

---

## Catatan performa

Kapal kini memakai **tiga** semburan, masing-masing empat lapis — total
12 bidang tembus pandang.

Semuanya memakai `MeshBasicMaterial` tanpa perhitungan cahaya, jadi
biayanya kecil. Tapi bila ada laporan lambat di perangkat tertentu,
turunkan dulu jumlah lapis: hapus **pendar luar** (lapis 4) di
`EngineTrail.tsx` — ia paling lebar sehingga paling banyak memakan
piksel.
