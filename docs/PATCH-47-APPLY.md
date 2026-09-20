# Patch 47 — Penerbangan Ilmu: Kuis Arkade 3D

**Sifat patch:** fitur baru. Tanpa dependency baru, `package.json` tidak berubah,
`App.tsx` dan `main.tsx` tidak perlu disentuh.

---

## 1. Gagasan intinya: menjawab lewat gerakan, bukan ketukan

Terinspirasi pola permainan kuis arkade yang Anda kirim. Yang membuatnya berhasil
bukan "kuis dengan animasi", melainkan **cara menjawabnya**: anak menerbangkan
pesawat menembus gerbang berisi jawaban benar.

Perbedaannya besar secara rasa. Mengetuk tombol adalah tindakan administratif;
mengarahkan pesawat ke gerbang adalah tindakan bermain. Materi yang diuji sama
persis, tapi anak merasakannya sebagai permainan, bukan ulangan.

---

## 2. Kenapa ini cocok dipasang sekarang

**Datanya sudah ada.** `reviewDeck.ts` dari Patch 35 menyimpan 234 kata dari tiga
dunia dengan bentuk seragam. Mode ini memakai ulang data itu — **tidak menambah
satu pun materi ajar baru**.

Dua keuntungannya:

| Keuntungan | Penjelasan |
|---|---|
| **Tanpa utang validasi** | Menulis 50 soal baru berarti menambah draf AI yang menunggu pengesahan tim akademik. Memakai ulang materi yang sudah ada tidak menambah beban itu |
| **Variasi konteks memperkuat ingatan** | Materi sama disajikan berbeda membuat ingatan lebih lentur — anak mengenali kata bukan hanya dari tampilan kartu yang itu-itu saja |

---

## 3. Tiga penyimpangan sadar dari acuan

### a. Tema langit, bukan luar angkasa

Acuannya bertema antariksa. Itu tidak nyambung dengan dunia Brightoria.
Penerbangan menembus gerbang awan jauh lebih pas — sekaligus memanfaatkan warna
merek (navy `#002880` + biru langit `#28a8e0`) secara alami.

### b. Salah tidak mengurangi apa pun

Pada acuannya, jawaban salah **menghilangkan kapal** — anak kehilangan progres
yang sudah dikumpulkan.

Untuk usia 6–12 dengan prinsip "tidak menghukum" yang dipegang proyek ini sejak
Patch 22, jawaban salah cukup **tidak menambah bonus**. Jawaban yang benar tetap
disorot sesudahnya, agar tetap jadi momen belajar — bukan sekadar kegagalan.

### c. Pengatur waktu bersifat diegetik

Tidak ada hitung mundur di layar. Yang membatasi adalah **kecepatan gerbang
mendekat**. Ini terasa jauh lebih lembut daripada angka merah berdetak, tapi tetap
memberi dorongan untuk sigap.

---

## 4. Keputusan penting: tidak menyentuh jadwal Leitner

| Mode | Penjadwalan | Tekanan waktu |
|---|---|---|
| **Latihan Tenang** | Mengubah kapan kata ditanyakan lagi | Tidak ada |
| **Penerbangan Ilmu** | **Tidak menyentuh sama sekali** | Ringan (gerbang mendekat) |

Alasannya: di mode arkade, anak bisa salah karena **gagal bermanuver tepat waktu**,
bukan karena tidak tahu jawabannya. Mencemari data penjadwalan dengan kesalahan
motorik akan merusak akurasinya.

Jadi mode ini memberi XP, tapi tidak pernah mengubah jadwal pengulangan.

---

## 5. Tidak menambah tombol mengambang kelima

Patch 46 baru saja merapikan empat tombol yang bertumpuk. Menambah yang kelima akan
membatalkan kerja itu.

Mode baru ditaruh **di dalam panel Latihan** sebagai pilihan kedua. Secara
arsitektur itu memang tempatnya — sumber materinya sama persis, jadi satu pintu
masuk lebih jujur menggambarkan hubungan keduanya.

Alurnya sekarang:

```
Tombol "Latihan"  →  Pemilih mode  →  🔁 Latihan Tenang
                                   →  ✈️ Penerbangan Ilmu
```

---

## 6. Cara bermain

| Kendali | Fungsi |
|---|---|
| Tombol ‹ › di layar | Pindah jalur |
| Tombol A / D | Pindah jalur |
| Panah kiri/kanan | Pindah jalur |
| Esc | Keluar |

Delapan soal per penerbangan. Jawaban benar berturut-turut memberi bonus bertingkat
(maksimal +125 per soal), menghargai ketepatan tanpa membuat skor melonjak liar.

---

## 7. Detail teknis yang menentukan rasa

**Banking pesawat** dihitung dari selisih posisi sekarang dengan jalur tujuan,
bukan dari tombol yang ditekan. Pesawat memiringkan badan selama masih bergerak,
lalu meluruskan diri saat sampai — inilah yang membuat manuver terasa punya bobot.

**Awan dan garis kecepatan** bukan hiasan. Tanpa objek yang bergerak mundur, mata
tidak punya acuan bahwa pesawat sedang melaju. Keduanya didaur ulang: begitu lewat
kamera, dikembalikan ke kejauhan.

**Kamera mengikuti dengan jeda lembut** (lerp 4,2/detik) — memberi rasa inersia
alih-alih menempel kaku pada pesawat.

Semuanya prosedural. Nol berkas gambar, nol permintaan jaringan — sesuai larangan
aset eksternal yang berlaku sejak insiden HDR CDN di Patch 03.

---

## 8. File dalam patch ini

```
src/game/skyrun/skyRunQuestions.ts   (BARU — penyusun soal dari reviewDeck)
src/game/skyrun/SkyRunGame.tsx       (BARU — scene 3D penerbangan)
src/game/DailyPractice.tsx           (TIMPA — ditambah pemilih mode)
docs/PATCH-47-APPLY.md               (BARU)
```

**Prasyarat:** Patch 35 (`reviewDeck.ts`, `practiceEngine.ts`), Patch 38
(`render/quality.ts`, `CinematicRig.tsx`, `Postfx.tsx`), Patch 42
(`theme/brightBrand.ts`, `ProceduralEnv.tsx`).

---

## 9. Cara memasang

Salin **isi** folder `p47/` ke root proyek — bukan foldernya:

```
BENAR:  brightoria/src/game/skyrun/SkyRunGame.tsx
SALAH:  brightoria/p47/src/game/skyrun/SkyRunGame.tsx
```

`main.tsx` **tidak perlu diubah** — baris `import './game/DailyPractice';` dari
Patch 35 sudah menunjuk ke berkas yang sama.

```powershell
npm run typecheck
npm run build
npm run dev
```

---

## 10. Checklist uji

**Pemilih mode:**

- [ ] Tekan tombol "🔁 Latihan" → muncul **dua pilihan mode**
- [ ] Pilih "Latihan Tenang" → panel lama berjalan seperti biasa
- [ ] Pilih "Penerbangan Ilmu" → layar pembuka penerbangan muncul
- [ ] Kalau belum ada kata dikuasai → pesan ramah, bukan layar kosong

**Penerbangan:**

- [ ] Pesawat terbang, awan dan garis kecepatan melaju mundur
- [ ] Tombol ‹ › memindahkan pesawat antar-jalur
- [ ] Tombol A / D dan panah juga berfungsi
- [ ] Pesawat **memiringkan badan** saat berbelok, lalu lurus lagi
- [ ] Tiga gerbang mendekat membawa pilihan jawaban
- [ ] Lewati gerbang benar → gerbang menyala hijau, skor bertambah
- [ ] Lewati gerbang salah → gerbang **yang benar disorot emas**, skor **tidak berkurang**
- [ ] Benar berturut-turut → lencana "🔥 beruntun" muncul
- [ ] Delapan soal selesai → layar hasil dengan skor & rekor

**Regresi:**

- [ ] Latihan Tenang masih mencatat jawaban ke penjadwalan Leitner
- [ ] Penerbangan Ilmu **tidak** mengubah jadwal (cek: buka Latihan Tenang
      sesudahnya, kata yang sama masih terjadwal seperti semula)
- [ ] Tidak ada tombol mengambang kelima
- [ ] Tombol Latihan tetap tersembunyi saat game lain terbuka

---

## 11. Hasil verifikasi

| Pemeriksaan | Hasil |
|---|---|
| Keseimbangan kurung, 3 berkas (pemeriksa sadar-string) | ✅ Seimbang |
| Import menganggur | ✅ Nol temuan |
| Jalur impor silang | ✅ Semua valid |

**Satu bug ditemukan dan diperbaiki saat verifikasi:** `React.RefObject` dipakai di
dua tempat tanpa mengimpor namespace React — akan menggagalkan build dengan
`Cannot find namespace 'React'`. Diganti tipe lokal `LaneRef`, yang sekaligus
menyelesaikan ketidakcocokan `number | null` vs `number`.

**Belum bisa saya verifikasi:** `npm run build` — `node_modules` tidak tersedia di
lingkungan kerja saya.

---

## 12. Catatan performa

Scene ini lebih ringan daripada Ekspedisi: tidak ada terrain, tidak ada ratusan
objek instanced. Isinya hanya pesawat, tiga gerbang, awan, dan partikel — semuanya
mengikuti tier perangkat lewat `getQuality()`.

Kalau ada laporan lambat, yang pertama diturunkan sebaiknya jumlah awan
(`scaleCount(26)`) di `Clouds`.

---

## 13. Yang bisa dikembangkan berikutnya

Mode ini kini menjadi **kerangka arkade** yang bisa diisi materi lain. Menambah
jenis soal cukup dengan memperluas `skyRunQuestions.ts` — scene 3D-nya tidak perlu
disentuh sama sekali.

Kandidat paling masuk akal: **soal matematika prosedural** dari Pulau Numeria.
Karena kebenarannya objektif (`3/4 + 1/4 = 1`), ia bisa dihasilkan tanpa menunggu
pengesahan akademik — dan langsung punya kedalaman tak terbatas.
