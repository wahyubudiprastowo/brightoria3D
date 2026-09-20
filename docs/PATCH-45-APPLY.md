# Patch 45 — Logo Terpotong, Header Ramping, Kartu Misi & Realisme

**Sifat patch:** perbaikan UI + peningkatan realisme. Tanpa dependency baru,
`package.json` tidak berubah, `App.tsx` tidak perlu disentuh.

---

## 1. Logo terpotong di header

### Penyebabnya `box-sizing`, bukan ukuran gambar

Patch 44 memberi tanda logo `width: 38px` + `padding: 4px` **tanpa mengunci
`box-sizing`**. Kalau stylesheet proyek memakai `content-box` untuk elemen itu,
kotaknya menjadi 46px — sementara gambar di dalamnya dihitung `100%` dari kotak
luar, lalu terpotong oleh `overflow: hidden`.

### Perbaikan tiga lapis

| Lapis | Tindakan |
|---|---|
| 1 | `box-sizing: border-box` dikunci pada tanda logo **dan** gambar |
| 2 | `overflow` dilepas — dengan `object-fit: contain` gambar tidak mungkin meluber, jadi clipping hanya menimbulkan risiko |
| 3 | Selector diperluas agar tetap kena walau struktur DOM sedikit berbeda dari dugaan |

### Catatan soal bentuk logo

Berkas logo ikon Anda berorientasi **potret** (lebih tinggi daripada lebar). Di
kotak persegi dengan `object-fit: contain`, ia akan tampil **utuh dengan ruang
kosong di kiri-kanan**.

Itu perilaku yang benar. Memaksa `cover` justru akan memotong kaligrafinya —
persis masalah yang sedang diperbaiki.

Ikon bawaan kini disembunyikan **hanya setelah** logo berhasil dimuat (`onload`),
bukan langsung. Jadi kalau berkasnya hilang, header tidak akan jadi kotak kosong.

---

## 2. Header masih terlalu tinggi

Dipangkas lagi dari Patch 44:

| Elemen | Patch 44 | Patch 45 |
|---|---|---|
| Padding header | 8px 18px | **6px 16px** |
| Tanda logo | 38px | **34px** |
| Judul | 16px | **15px** |
| Lencana XP | 34px | **31px** |
| Hero h1 | 30px | **25px** |
| Hero padding | 14px | **10px** |

Bagian **hero** ikut dirapatkan karena — terlihat jelas di tangkapan layar Anda —
ia memakan ruang vertikal jauh lebih besar daripada header itu sendiri.

---

## 3. Kartu misi menutupi pulau

Posisi lama di kanan-**atas** persis menimpa area pulau kanan.

**Perbaikan:**

- Dipindah ke kanan-**bawah** (`bottom: 84px`)
- Lebar 340px → **300px**
- Latar **semi-tembus + blur** (`rgba(255,253,247,0.93)` + `backdrop-filter`),
  sehingga peta tetap terbaca di belakangnya
- Isi dipadatkan: judul 17px, tombol 44px, jarak antar-bagian dirapatkan

---

## 4. Peningkatan realisme

Diurutkan dari dampak terbesar:

### a. Bayangan kontak — ini yang paling terasa

Objek tanpa bayangan di titik sentuhnya selalu terbaca **"menempel"** ke
permukaan, bukan **"berdiri"** di atasnya. Otak manusia memakai bayangan kontak
sebagai isyarat utama untuk menilai apakah benda benar-benar menyentuh tanah.

Shadow map biasa tidak cukup: di tier rendah ia dimatikan sepenuhnya, dan bahkan
saat aktif, bayangannya terlalu lembut tepat di titik sentuh.

Solusinya cakram gelap semi-tembus di bawah tiap objek — murah, dan **selalu ada
di semua tier**. Memakai `polygonOffset` untuk mencegah z-fighting dengan
permukaan tanah.

Semuanya lewat `InstancedMesh`, jadi menambahkan bayangan untuk ratusan objek
hanya menambah **4 draw call**, bukan ratusan.

### b. Rumpun rumput

Bidang tanah polos terbaca sebagai permukaan buatan. Sekitar 120 rumpun tipis
(di tier `balanced`/`high`) memecah keseragaman itu. Dimatikan di tier `low`.

### c. Buih tepi danau

Batas air-darat yang tegas terlihat seperti stiker ditempel. Cincin buih lembut
yang berdenyut pelan membuat transisinya alami — air seolah menyapu pasir.

### d. Batang pohon mengerucut

Batang silinder seragam adalah penanda paling jelas objek buatan. Pangkal yang
sedikit lebih lebar (0.115 vs 0.075) meniru bentuk pohon sungguhan.

---

## 5. File dalam patch ini

```
src/theme/brandHeader.ts                  (TIMPA — logo, header, kartu misi)
src/game/expedition/ArenaProps.tsx        (TIMPA — realisme arena)
docs/PATCH-45-APPLY.md                    (BARU)
```

**Prasyarat:** Patch 38–44 sudah terpasang.

---

## 6. Cara memasang

Salin **isi** folder `p45/` ke root proyek — bukan foldernya:

```
BENAR:  brightoria/src/theme/brandHeader.ts
SALAH:  brightoria/p45/src/theme/brandHeader.ts
```

`main.tsx` **tidak perlu diubah** — baris `import './theme/brandHeader';` dari
Patch 44 sudah menunjuk ke berkas yang sama.

```powershell
npm run typecheck
npm run build
npm run dev
```

Setelah itu **muat ulang paksa** (`Ctrl+Shift+R`) — modul lama menyuntikkan
`<style>` dengan id berbeda, dan versi baru menghapusnya otomatis, tapi cache
browser bisa menahan berkas JS lama.

---

## 7. Checklist uji

**Header & logo:**

- [ ] Logo Bright tampil **utuh**, tidak terpotong di sisi mana pun
- [ ] Logo terlihat proporsional (ruang kosong kiri-kanan itu normal — logonya
      memang berorientasi potret)
- [ ] Header terasa lebih ramping
- [ ] Bagian hero tidak lagi memakan ruang berlebihan

**Kartu misi:**

- [ ] Kartu berada di kanan-**bawah**, tidak menutupi pulau
- [ ] Peta samar terlihat di belakang kartu (efek blur)
- [ ] Isi kartu lebih padat, tombol tetap mudah ditekan

**Realisme arena:**

- [ ] Setiap pohon & batu punya **bayangan lembut di bawahnya**
- [ ] Objek terasa **berdiri** di tanah, bukan menempel
- [ ] Ada rumpun rumput kecil tersebar di padang
- [ ] Tepi danau punya cincin buih lembut yang berdenyut pelan
- [ ] Batang pohon melebar di pangkalnya

**Regresi:**

- [ ] Karakter tetap berjalan di atas tanah, tidak tenggelam
- [ ] Masuk gerbang → permainan dunia terbuka
- [ ] Monumen logo di tengah arena tetap tampil benar

---

## 8. Hasil verifikasi

| Pemeriksaan | Hasil |
|---|---|
| Keseimbangan kurung, 2 berkas (pemeriksa sadar-string) | ✅ Seimbang |
| Import menganggur | ✅ Nol temuan |

**Belum bisa saya verifikasi:** `npm run build` — `node_modules` tidak tersedia di
lingkungan kerja saya.

---

## 9. Kalau logo masih terpotong

Kemungkinan `header .brand .mark` bukan nama kelas yang sebenarnya dipakai
`App.tsx` Anda.

Buka DevTools (F12) → klik kanan pada tanda logo → **Inspect**, lalu kirimkan
potongan HTML-nya. Saya akan sesuaikan selector-nya.

Sebagai pemeriksaan cepat, jalankan ini di Console:

```js
document.querySelectorAll('header .brand .mark').length
```

Kalau hasilnya `0`, berarti nama kelasnya memang berbeda.

---

## 10. Catatan performa

Bayangan kontak menambah **4 draw call** (pohon, cemara, batu, semak), dan rumput
menambah **1**. Total tambahan: 5 draw call untuk ratusan objek.

Rumput dimatikan otomatis di tier `low`. Kalau ada laporan lambat di HP tertentu,
turunkan angka `120` pada `grassTufts` di `ArenaProps.tsx`.
