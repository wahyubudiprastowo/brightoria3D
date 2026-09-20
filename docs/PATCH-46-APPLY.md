# Patch 46 — Perbaikan Elemen Saling Menumpuk

**Sifat patch:** perbaikan tata letak. Satu berkas, tanpa dependency baru,
`package.json` dan `App.tsx` tidak berubah.

---

## 1. Kesalahan saya di Patch 45

Patch 45 memindahkan kartu misi ke kanan-**bawah** untuk menghindari pulau.
Itu menyelesaikan satu tabrakan, **tapi menciptakan tabrakan baru**: di
kanan-bawah sudah ada tombol **Tanya Bri** dan **Ekspedisi**.

### Akar masalahnya lebih dalam

Aplikasi kini punya **empat tombol mengambang** — Orang Tua, Latihan, Ekspedisi,
Tanya Bri — yang masing-masing dipasang oleh modulnya sendiri:

| Tombol | Dipasang oleh |
|---|---|
| Orang Tua | `ParentInsight.tsx` (Patch 34) |
| Latihan | `DailyPractice.tsx` (Patch 35) |
| Ekspedisi | `ExpeditionLauncher.tsx` (Patch 38) |
| Tanya Bri | `AiCompanion.tsx` (Patch 38) |

Tidak ada satu pun pihak yang mengatur tata letak bersama. Setiap modul menaruh
tombolnya di tempat yang "kelihatan kosong" saat itu — dan akhirnya bertumpuk.

Berkas ini kini menjadi **otoritas tata letak tunggal** untuk seluruh elemen
mengambang.

---

## 2. Pembagian wilayah layar

```
ATAS-TENGAH   →  bilah petunjuk peta
KIRI-BAWAH    →  rel tombol mengambang (tersusun vertikal)
KANAN-BAWAH   →  kartu misi
```

Pembagian ini dipilih **setelah memeriksa tangkapan layar Anda**: label pulau
mengumpul di tengah peta, sementara tepi kiri jauh (x < 200px) dan tepi kanan
jauh justru kosong di seluruh tinggi layar.

### Urutan rel sengaja dipikirkan

| Slot (dari bawah) | Tombol | Alasan |
|---|---|---|
| 88px | Orang Tua | Selalu terlihat |
| 140px | Ekspedisi | Selalu terlihat |
| 192px | Tanya Bri | Selalu terlihat |
| 244px | Latihan | **Bisa tersembunyi** |

Tombol Latihan hanya muncul bila ada materi jatuh tempo. Menaruhnya di posisi
**paling atas** berarti saat ia hilang, celah yang tertinggal berada di ujung atas
dan tidak terlihat — bukan lubang menganga di tengah tumpukan.

---

## 3. Bilah petunjuk menembus label pulau

Bilah "Geser untuk memutar • cubit/scroll untuk zoom • ketuk pulau" berada di
bawah-tengah, **tepat di jalur label pulau baris bawah** (Oasis Bahasa Arab,
English Harbor, Benteng Digital).

Dipindah ke **atas peta**, yang area langitnya kosong. Sekaligus dikecilkan dan
diberi `pointer-events: none` agar tidak menghalangi ketukan pulau.

---

## 4. Teks label ter-blok biru

Ini **bukan galat gaya**. Itu *text selection* bawaan peramban: saat anak menyeret
peta untuk memutar, peramban menganggapnya sebagai gerakan menyorot teks.

Diperbaiki dengan `user-select: none` pada:

- Label pulau beserta isinya
- Bilah petunjuk
- Kanvas peta (plus `touch-action: none`)
- Seluruh tombol mengambang (plus `-webkit-tap-highlight-color: transparent`)

---

## 5. Yang dipertahankan dari Patch 45

Perbaikan logo tetap utuh — `box-sizing: border-box` terkunci, `overflow` dilepas,
ikon bawaan disembunyikan hanya setelah logo berhasil dimuat.

Header dan hero tetap ramping seperti Patch 45.

---

## 6. Cara memasang

Salin **isi** folder `p46/` ke root proyek — bukan foldernya:

```
BENAR:  brightoria/src/theme/brandHeader.ts
SALAH:  brightoria/p46/src/theme/brandHeader.ts
```

`main.tsx` **tidak perlu diubah** — baris `import './theme/brandHeader';` dari
Patch 44 sudah menunjuk ke berkas yang sama.

```powershell
npm run build
npm run dev
```

Lalu **muat ulang paksa** (`Ctrl+Shift+R`).

---

## 7. Checklist uji

**Tidak ada lagi yang menumpuk:**

- [ ] Empat tombol tersusun rapi di kiri-bawah, tidak saling menimpa
- [ ] Kartu misi di kanan-bawah, **tidak tertimpa tombol apa pun**
- [ ] Bilah petunjuk ada di **atas** peta, tidak memotong label pulau
- [ ] Label pulau bawah terbaca penuh

**Sorotan teks hilang:**

- [ ] Seret peta ke kiri-kanan → **tidak ada blok biru** pada label
- [ ] Seret cepat berulang → tetap bersih
- [ ] Di layar sentuh: tahan lama pada label → tidak muncul menu salin

**Regresi:**

- [ ] Logo Bright tetap tampil utuh di header
- [ ] Header tetap ramping
- [ ] Keempat tombol masih bisa ditekan dan membuka panelnya
- [ ] Peta masih bisa diputar, di-zoom, dan pulau masih bisa diketuk

---

## 8. Hasil verifikasi

| Pemeriksaan | Hasil |
|---|---|
| Sintaks TypeScript (pemeriksa sadar-string) | ✅ 19/19 kurawal, 60/60 kurung |
| Blok CSS di dalam template literal | ✅ 63/63 kurawal, 6 media query |

**Belum bisa saya verifikasi:** `npm run build` — `node_modules` tidak tersedia di
lingkungan kerja saya.

---

## 9. Kalau tombol "Tanya Bri" masih di kanan

Tiga tombol lain punya kelas yang saya ketahui (`.bpi-fab`, `.bdp-fab`,
`.bexp-fab`) sehingga cukup ditata lewat CSS. Untuk **Tanya Bri** saya tidak
memegang salinan berkasnya, jadi ia dicari lewat teksnya.

Penyaringannya ketat agar tidak salah sasaran: harus `position: fixed`, dan bukan
bagian dari header maupun navigasi bawah.

Kalau ternyata tidak tertangkap, jalankan ini di Console (F12):

```js
document.querySelector('[data-brt-rail="ai"]')
```

Kalau hasilnya `null`, kirimkan potongan HTML tombolnya (klik kanan → Inspect).
Saya akan sesuaikan penyaringnya.

---

## 10. Catatan arsitektur untuk ke depan

Empat tombol mengambang adalah **gejala**, bukan penyakitnya. Penyakitnya:
aplikasi belum punya *shell* HUD yang benar, sehingga setiap fitur baru menempel
sebagai tombol mengambang karena tidak ada tempat lain.

Patch ini merapikan gejalanya. Solusi sesungguhnya — menggabungkan keempatnya ke
dalam satu menu yang bisa dibuka-tutup — adalah perubahan yang lebih besar dan
sebaiknya dikerjakan tersendiri, bukan disisipkan ke patch perbaikan.
