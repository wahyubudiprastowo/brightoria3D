# Patch 65 — Koridor bersih, meriam, awan gugus

**Sifat patch:** perbaikan bug permainan + fitur baru. Tanpa dependency
baru, tanpa aset eksternal.

---

## Cara memasang

```powershell
# Salin folder src/ ke proyek, lalu:
npm run build
```

**Tidak ada skrip yang perlu dijalankan.** `SkyRunGame.tsx` sudah
mengimpor `ShipModel` dan `SpaceField` sejak Patch 61, dan kontrak
keduanya tidak berubah.

`Blaster.tsx` adalah berkas baru yang hanya dipakai `ShipModel` — tidak
perlu disambungkan ke mana pun.

---

## 1. Soal tertutup asteroid — ini bug permainan

Umpan balik: *"meteroidnya berantakan, jadi soalnya gak keliatan"*.

Ini **bukan** keluhan estetika. Anak tidak bisa membaca jawaban karena
tertutup bongkahan es. Permainan menjadi tidak bisa dimainkan.

### Akar masalah

Sampai v3, posisi batu diacak pada **seluruh** bidang:

```ts
x: (rand() - 0.5) * 28
y: (rand() - 0.5) * 15
```

Gerbang jawaban berada di `x = -3.1`, `0`, dan `3.1` — persis di
**tengah** rentang itu. Jadi kira-kira sepertiga batu terlahir tepat di
depan gerbang.

### Perbaikan

Batu kini **selalu** ditempatkan di luar koridor permainan. Tiap batu
memilih salah satu dari empat sisi — kiri, kanan, atas, bawah — lalu
diposisikan di luar batasnya.

```
        atas (y > 3.6)
   ┌─────────────────────┐
   │                     │
kiri│   KORIDOR BERSIH   │kanan
   │  gerbang jawaban    │
   │                     │
   └─────────────────────┘
        bawah (y < -3.4)
```

Hasilnya terowongan bersih yang terbentuk sendiri, tanpa perlu
memeriksa tabrakan satu per satu.

### Dua perubahan pendukung

| | v3 | v4 |
|---|---|---|
| Ukuran batu maksimum | 2.4 | **1.7** |
| Jumlah batu dekat | 20 | **14** |

Batu raksasa dekat kamera menutupi layar **bahkan ketika berada di luar
koridor** — sudut pandangnya terlalu lebar. Dan kepadatan yang lebih
rendah membuat mata lebih mudah menemukan gerbang.

Medan yang ramai terasa mengesankan pada tangkapan layar, tapi
melelahkan saat dimainkan.

---

## 2. Efek tembak

Umpan balik: *"gak ada efek bisa tembak"*.

Referensi memperlihatkan dua laras meriam menjulur ke depan dari polong
mesin — paling jelas terlihat pada tampak depan. Tanpa tembakan, laras
itu hanya hiasan yang menjanjikan sesuatu yang tidak ada.

### Yang ditambahkan

| Bagian | Detail |
|---|---|
| Laras meriam | Mengerucut ke ujung, cincin di pangkal, moncong gelap |
| Peluru | Kapsul memanjang, `AdditiveBlending` |
| Kilatan moncong | Menyala sesaat tiap tembakan |

### Menembak otomatis — disengaja

Tembakan terjadi **sendiri** dengan irama tetap, bukan saat anak
menekan tombol. Tiga alasan:

**Beban perhatian.** Anak sudah harus membaca soal, menimbang tiga
jawaban, dan bermanuver. Menambah tombol tembak akan mengalihkan
perhatian dari tugas belajarnya.

**Tidak ada yang perlu ditembak.** Permainan ini tentang memilih
jawaban, bukan menghancurkan musuh. Tembakan di sini murni penambah
rasa, bukan mekanik.

**Nol sentuhan pada logika permainan.** `Blaster.tsx` tidak perlu tahu
apa pun tentang soal maupun keadaan permainan — jadi `SkyRunGame.tsx`
tidak perlu diubah sama sekali. Nol risiko terhadap perbaikan
`onReadTick` yang sudah berkali-kali bermasalah.

### Dua detail yang menentukan rasa

**Peluru memanjang seiring jarak.** Meniru kabur-gerak: benda cepat
terbaca sebagai garis, bukan titik. Tanpa ini peluru terlihat seperti
manik-manik yang meluncur pelan.

**Laras menembak bergantian**, bukan serempak. Jeda fase setengah
interval membuat iramanya jauh lebih hidup.

### Kolam objek, bukan buat-buang

Peluru dibuat sekali lalu dipakai ulang. Membuat dan membuang mesh tiap
tembakan akan membebani pemungut sampah, dan itu terasa sebagai
tersendat berkala di perangkat lemah.

---

## 3. Awan: gugus, bukan satu gundukan

Referensi memperlihatkan awan sebagai **gugus** beberapa gumpalan
membulat yang saling menumpuk — satu besar di tengah, tiga lebih kecil
di sekelilingnya.

Versi lama hanya satu gundukan tunggal, yang terbaca sebagai batu
pipih. Kini dibangun dari **lima bola** yang digabung menjadi satu
geometri — tetap satu draw call.

---

## File dalam patch ini

```
src/game/skyrun/Blaster.tsx        (BARU  — tembakan meriam)
src/game/skyrun/ShipModel.tsx      (TIMPA — + meriam)
src/game/skyrun/SpaceField.tsx     (TIMPA — koridor bersih + awan gugus)
```

### Yang TIDAK disentuh

| Berkas | Alasan |
|---|---|
| `SkyRunGame.tsx` | Kontrak `ShipModel` & `SpaceField` tidak berubah |
| `EngineTrail.tsx` | Sudah benar sejak Patch 64 |
| `skyRunQuestions.ts` | Logika soal tidak berubah |

---

## Catatan jujur: prosedural, bukan GLB

Referensi Anda adalah gambar render. **Saya tidak bisa membuat berkas
GLB** — itu hasil kerja perangkat pemodelan seperti Blender.

Semua yang ada di sini dihitung dari kode. Hasilnya tidak akan
seidentik gambar, tapi siluet, proporsi, dan bahasa warnanya sudah
jauh lebih dekat.

Untuk proyek ini pendekatan itu justru lebih aman — aturan larangan
aset eksternal lahir dari dua kejadian nyata: HDR dari CDN di Patch 03,
dan berkas `.webp` di Patch 12–15, yang keduanya membuat scene gagal
dimuat.

Kalau nanti ada artis 3D yang membuat GLB sungguhan, komponen ini bisa
diganti tanpa menyentuh logika permainan.

---

## Checklist uji

**Koridor bersih — paling penting:**
- [ ] Gerbang jawaban **selalu terbaca**, tidak pernah tertutup batu
- [ ] Batu hanya muncul di kiri, kanan, atas, dan bawah layar
- [ ] Tidak ada batu raksasa yang menutupi tengah layar
- [ ] Medan terasa lebih lapang

**Tembakan:**
- [ ] Dua laras meriam terlihat menjulur ke depan dari polong mesin
- [ ] Peluru biru melesat ke depan secara berkala
- [ ] Laras kiri & kanan menembak **bergantian**, bukan serempak
- [ ] Ada kilatan kecil di moncong tiap tembakan
- [ ] Peluru **memanjang** saat menjauh

**Awan:**
- [ ] Awan berbentuk **gugus** beberapa gumpalan, bukan satu gundukan
- [ ] Warnanya biru langit terang
- [ ] Awan tidak berputar, batu berputar

**Regresi:**
- [ ] `npm run build` lolos tanpa galat
- [ ] Bilah "Baca dulu..." muncul lalu habis
- [ ] Gerbang bergerak setelah fase baca
- [ ] Menjawab soal berfungsi normal
- [ ] Tiga semburan mesin tetap menyala

---

## Hasil verifikasi

| Pemeriksaan | Hasil |
|---|---|
| Keseimbangan kurung, 3 berkas | ✅ Semua seimbang |
| Import menganggur | ✅ Nol temuan |
| Non-ASCII di nilai warna | ✅ Bersih |
| Kontrak `ShipModel` & `SpaceField` | ✅ Tidak berubah |
| Koridor bersih terpasang | ✅ 3 titik |
| Meriam & Blaster terpasang | ✅ Keduanya |
| Awan gugus 5 gumpalan | ✅ Terpasang |

**Belum bisa saya verifikasi:** `npm run build` — `node_modules` tidak
tersedia di lingkungan kerja saya.

---

## Catatan performa

Tembakan menambah **4 draw call** (dua laras, masing-masing peluru
instanced + kilatan moncong). Seluruh peluru memakai
`MeshBasicMaterial` tanpa perhitungan cahaya, jadi biayanya kecil.

Jumlah batu justru **berkurang** dari v3, sehingga secara keseluruhan
patch ini kemungkinan besar **lebih ringan** daripada sebelumnya.

Bila ada laporan lambat, turunkan `POOL` di `Blaster.tsx` dari 5 ke 3 —
itu memperpendek ekor tembakan tanpa menghilangkan efeknya.
