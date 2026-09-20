# Patch 49 — Perbaikan "Pilihannya Di Mana?"

**Sifat patch:** perbaikan UX + kinerja. Satu berkas, tanpa dependency baru,
`package.json` tidak berubah, `App.tsx` dan `main.tsx` tidak perlu disentuh.

---

## 1. Penyebabnya: tiga masalah yang saling memperburuk

Pilihan jawaban hanya ada di gerbang 3D. Itu bermasalah karena:

### a. Gerbang lahir di dalam kabut

| | Nilai lama |
|---|---|
| Gerbang lahir di | z = −58 |
| Kamera di | z = 9.4 |
| Jarak | 67 unit |
| Kabut | mulai 26, penuh 70 |
| **Hasil** | **94% tertutup kabut** |

Saat pertama muncul, gerbang praktis **tak terlihat**. Anak harus menunggu hampir
dua detik sebelum pilihannya terbaca.

### b. Label menumpuk jadi gumpalan

Label memakai `<Html>` berukuran piksel **tetap**. Saat gerbang jauh, ketiga jalur
memproyeksi ke titik yang hampir sama di layar — jadi tiga label berukuran penuh
saling menimpa di tengah.

### c. Tidak ada rujukan tetap

Begitu gerbang lewat, pilihan hilang sepenuhnya. Tidak ada tempat lain untuk
membacanya.

---

## 2. Perbaikannya: pilihan punya dua tempat

### Papan pilihan tetap di bawah layar

Tiga kartu sejajar, **selalu terbaca**, menandai jalur mana yang sedang ditempati.
Ini jadi rujukan utama — anak tidak perlu menyipitkan mata ke gerbang yang jauh.

Kartunya juga **bisa diketuk** untuk langsung pindah jalur. Jadi ia sekaligus
menjadi cara bermain alternatif bagi anak yang belum lancar memakai tombol panah.

Kartu ikut berubah warna setelah dinilai: hijau untuk yang dilewati dengan benar,
emas untuk jawaban benar yang terlewat.

### Label gerbang digambar ke tekstur

Bukan `<Html>` lagi. Dengan begitu label **ikut mengecil secara perspektif** dan
**ikut tersaput kabut** — sama seperti cincinnya. Tidak ada lagi gumpalan label di
tengah layar.

Ukuran huruf menyusut otomatis bila teksnya panjang, agar tidak terpotong.

### Gerbang lahir lebih dekat, kabut dimundurkan

| | Lama | Baru |
|---|---|---|
| Gerbang lahir | −58 | **−34** |
| Kabut | 26–70 | **35–85** |
| Tersaput saat lahir | 94% | **17%** |
| Kecepatan | 15,5/detik | **12/detik** |

Gerbang kini **terlihat jelas sejak awal**, dan melaju sedikit lebih lambat untuk
memberi ruang bermanuver.

### Penanda jalur di lantai

Tiga jalur cahaya memanjang ke kejauhan, yang aktif menyala lebih terang.

Fungsinya memetakan kartu di bawah layar ke posisi ruang: anak melihat bahwa kartu
kiri sama dengan jalur kiri. Tanpa ini, hubungan antara papan pilihan dan gerbang 3D
harus ditebak sendiri.

---

## 3. Perbaikan kinerja yang ikut terselesaikan

Versi lama memanggil `setState` untuk posisi gerbang **setiap frame** — artinya 60
render ulang per detik untuk tiga komponen `<Html>` yang mahal.

Sekarang posisi digerakkan lewat **ref langsung ke objek Three.js**, jadi **nol
render ulang** selama penerbangan. Terverifikasi: `setState di useFrame: 0`.

---

## 4. Cara bermain sekarang

| Kendali | Fungsi |
|---|---|
| **Ketuk kartu jawaban** | Langsung pindah ke jalur itu |
| Tombol ‹ › di layar | Geser satu jalur |
| A / D | Geser satu jalur |
| Panah kiri/kanan | Geser satu jalur |
| **Angka 1 / 2 / 3** | Langsung pilih jalur |
| Esc | Keluar |

Empat cara berbeda, karena anak usia 6–12 punya kenyamanan yang berbeda-beda.

---

## 5. File dalam patch ini

```
src/game/skyrun/SkyRunGame.tsx   (TIMPA)
docs/PATCH-49-APPLY.md           (BARU)
```

**Prasyarat:** Patch 48 (`mathGenerator.ts`, `skyRunQuestions.ts`), Patch 47,
Patch 35, Patch 38, Patch 42.

`skyRunQuestions.ts` dan `mathGenerator.ts` dari Patch 48 **tidak berubah**.

---

## 6. Cara memasang

Salin **isi** folder `p49/` ke root proyek — bukan foldernya:

```
BENAR:  brightoria/src/game/skyrun/SkyRunGame.tsx
SALAH:  brightoria/p49/src/game/skyrun/SkyRunGame.tsx
```

```powershell
npm run build
npm run dev
```

Lalu muat ulang paksa (`Ctrl+Shift+R`) — berkas lama menyuntikkan `<style>` dengan
id berbeda, dan versi baru menghapusnya otomatis, tapi cache peramban bisa menahan
JS lama.

---

## 7. Checklist uji

**Pilihan jawaban — inti perbaikan:**

- [ ] Tiga kartu jawaban terlihat di **bawah layar**, terbaca jelas
- [ ] Kartu jalur yang ditempati **menonjol** (naik sedikit, ada penunjuk ▲)
- [ ] **Ketuk kartu** → pesawat langsung pindah ke jalur itu
- [ ] Gerbang 3D **terlihat jelas sejak muncul**, tidak tenggelam kabut
- [ ] Label di gerbang **mengecil secara perspektif**, tidak menumpuk
- [ ] Tiga jalur cahaya terlihat di lantai, yang aktif lebih terang

**Setelah dinilai:**

- [ ] Kartu yang benar berubah **hijau** kalau dilewati dengan tepat
- [ ] Kartu jawaban benar berubah **emas** kalau terlewat
- [ ] Kartu lain meredup

**Kendali:**

- [ ] Tombol ‹ › berfungsi
- [ ] A / D dan panah berfungsi
- [ ] Angka 1 / 2 / 3 langsung memilih jalur

**Kinerja:**

- [ ] Penerbangan terasa **lebih mulus** daripada sebelumnya
- [ ] Tidak ada tersendat saat gerbang mendekat

**Regresi:**

- [ ] Mode Kata dan Angka keduanya berjalan
- [ ] Tingkat adaptif masih naik-turun sesuai jawaban
- [ ] Rekor tersimpan per materi
- [ ] Batang pecahan masih tampil di soal angka

---

## 8. Hasil verifikasi

| Pemeriksaan | Hasil |
|---|---|
| Keseimbangan kurung (pemeriksa sadar-string) | ✅ 328/328, 378/378, 98/98 |
| Import menganggur | ✅ Nol temuan |
| `<Html>` drei sudah dilepas | ✅ Tidak diimpor lagi |
| `setState` di dalam `useFrame` | ✅ Nol |

**Belum bisa saya verifikasi:** `npm run build` — `node_modules` tidak tersedia di
lingkungan kerja saya.

---

## 9. Catatan soal font Arab pada tekstur

Label gerbang digambar ke kanvas memakai tumpukan font
`'Noto Naskh Arabic','Amiri',serif`.

Kanvas hanya bisa memakai font yang **sudah dimuat peramban**. Font itu sudah
dimuat lewat CSS aplikasi, jadi seharusnya aman. Tapi bila pada perangkat tertentu
teks Arab di gerbang terlihat memakai font cadangan, **papan pilihan di bawah layar
tetap menampilkannya dengan benar** — karena itu HTML biasa, bukan kanvas.

Itu salah satu alasan tambahan kenapa papan pilihan penting: ia menjadi jaring
pengaman bila rendering 3D bermasalah.
