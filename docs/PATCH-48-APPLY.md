# Patch 48 — Mode Angka: Pecahan Prosedural & Kesulitan Adaptif

**Sifat patch:** fitur baru. Tanpa dependency baru, `package.json` tidak berubah,
`App.tsx` dan `main.tsx` tidak perlu disentuh.

---

## 1. Menjawab pertanyaan Anda: "ini jadi gameplay Numeria?"

**Ya, tapi tidak menggantikan.** Ada perbedaan penting:

| | Jembatan Pecahan (Numeria) | Penerbangan Angka (patch ini) |
|---|---|---|
| Melatih | **Pemahaman konsep** — apa *itu* 3/4? | **Kelancaran** — jawab cepat dan tepat |
| Caranya | Menyeret balok, memanipulasi pecahan secara ruang | Memilih gerbang jawaban |
| Kekuatan | Anak *melihat* pecahan sebagai besaran nyata | Pengulangan banyak, terasa seperti permainan |

Menyeret balok jembatan adalah **pedagogi yang lebih kaya** untuk memahami pecahan
daripada pilihan ganda. Jadi saya tidak menggantinya. Patch ini menambah lapisan
kedua: latihan kelancaran setelah konsepnya paham.

**Satu generator melayani keduanya.** `mathGenerator.ts` sengaja dibuat mandiri
penuh — tanpa React, tanpa Three.js, tanpa impor dari berkas permainan. Nanti
Numeria tinggal mengimpornya; tidak ada konten yang diduplikasi.

---

## 2. Masalah nyata yang diselesaikan

Pulau Numeria hanya punya **5 level** — habis dalam sekitar lima menit. Padahal
rantai quest dari Patch 39 mengarahkan anak ke sana. Kita membangun jalan menuju
ruangan yang hampir kosong.

### Kenapa matematika bisa dihasilkan, mata pelajaran lain tidak

Soal `3/4 + 1/4 = 1` kebenarannya **objektif** — tidak perlu menunggu pengesahan
tim akademik. Bandingkan dengan:

- Kosakata Arab → butuh validasi transliterasi dan nuansa makna
- Benteng Digital → berisi penilaian situasional ("apakah tindakan ini aman?")

Artinya Numeria bisa dibawa ke **kedalaman tak terbatas tanpa memblokir siapa pun**.
Ini satu-satunya mata pelajaran di Brightoria yang punya sifat itu.

---

## 3. Enam jenis soal

| Topik | Contoh | Tersedia di tingkat |
|---|---|---|
| Membaca gambar | Berapa bagian yang berwarna? | Ringan |
| Pecahan senilai | 1/2 = ?/4 | Semua |
| Membandingkan | Mana yang lebih besar, 2/3 atau 3/4? | Semua |
| Jumlah penyebut sama | 1/4 + 2/4 | Semua |
| Jumlah penyebut beda | 1/2 + 1/4 | Sedang, Menantang |
| Menyederhanakan | 4/8 → 1/2 | Sedang, Menantang |

Tingkat **Ringan sengaja tidak memuat penjumlahan berpenyebut berbeda** — itu
langkah besar yang sebaiknya menunggu sampai penjumlahan berpenyebut sama sudah
lancar.

---

## 4. Pengecoh yang bersifat diagnostik

Ini bagian yang paling saya perhatikan. Pilihan salah **bukan angka acak** —
masing-masing mewakili kesalahan pemahaman yang nyata:

| Pengecoh | Kesalahan yang diwakili |
|---|---|
| `1/2 + 1/4 = 2/6` | Menjumlahkan penyebut juga — kesalahan paling sering |
| `1/2 = 1/4` | Lupa mengalikan pembilang saat menyamakan |
| `4/8 → 2/4` | Menyederhanakan setengah jalan |
| Bagian tidak berwarna | Salah membaca mana yang ditanya |

Karena pengecohnya bermakna, **pilihan anak menjadi data**. Kalau ia berulang kali
memilih `2/6`, kita tahu persis apa yang belum ia pahami — bukan sekadar tahu bahwa
ia salah.

Itu tercatat di `misconceptions` dan bisa dibaca lewat `topMisconceptions()`.

---

## 5. Kesulitan adaptif

Janji dari audit sebelumnya, akhirnya punya bahan untuk bekerja:

```
Dari 5 jawaban terakhir:
  benar ≥ 4  →  naik satu tingkat
  benar ≤ 2  →  turun satu tingkat
```

**Jendela lima** dipilih karena cukup panjang untuk meredam keberuntungan satu-dua
soal, tapi cukup pendek untuk terasa responsif.

**Catatan direset setelah tingkat berubah.** Kalau tidak, jawaban lama dari tingkat
sebelumnya ikut menilai tingkat baru — dan anak bisa terlempar naik-turun berulang
kali.

Anak melihat perubahannya: *"📈 Naik tingkat! Soalnya jadi lebih menantang"* atau
*"🌱 Kita pelan-pelan dulu ya"* — nada kedua sengaja tidak menyalahkan.

---

## 6. Visual batang pecahan

Anak usia 6–12 belum sepenuhnya berpikir abstrak. Menampilkan `1/2 + 1/4` sebagai
simbol saja membuat sebagian anak kehilangan pijakan.

Batang pecahan memberi pijakan itu: anak **melihat** bahwa setengah lebih panjang
daripada seperempat, sebelum ia menghitungnya.

Dirender sebagai **HTML, bukan objek 3D** — teks dan garis tipis jauh lebih tajam di
lapisan HTML, dan tidak ikut kabur saat kamera bergerak.

---

## 7. Satu keputusan penting soal data

| Mode | Mencatat ke | Alasan |
|---|---|---|
| **Kata** | ❌ Tidak ke Leitner | Anak bisa salah karena gagal bermanuver, bukan karena tidak tahu. Mencemari jadwal dengan kesalahan motorik merusak akurasinya |
| **Angka** | ✅ Ke mesin adaptif | Mesin itu memang mengukur **kelancaran** — dan kelancaran memang diuji di bawah tekanan waktu |

Perbedaan itu disengaja, bukan kelalaian.

---

## 8. File dalam patch ini

```
src/game/math/mathGenerator.ts        (BARU — generator + mesin adaptif)
src/game/skyrun/skyRunQuestions.ts    (TIMPA — adapter dua materi)
src/game/skyrun/SkyRunGame.tsx        (TIMPA — pemilih materi + visual)
docs/PATCH-48-APPLY.md                (BARU)
```

**Prasyarat:** Patch 47 (Penerbangan Ilmu), Patch 35 (`reviewDeck.ts`), Patch 38
(pipeline render), Patch 42 (`brightBrand.ts`, `ProceduralEnv.tsx`).

`DailyPractice.tsx` dari Patch 47 **tidak perlu diubah** — ia sudah merender
`<SkyRunGame />`, dan pemilih materi kini ada di dalam komponen itu.

---

## 9. Cara memasang

Salin **isi** folder `p48/` ke root proyek — bukan foldernya:

```
BENAR:  brightoria/src/game/math/mathGenerator.ts
SALAH:  brightoria/p48/src/game/math/mathGenerator.ts
```

```powershell
npm run typecheck
npm run build
npm run dev
```

Lalu muat ulang paksa (`Ctrl+Shift+R`).

---

## 10. Checklist uji

**Pemilih materi:**

- [ ] Tombol "🔁 Latihan" → "Penerbangan Ilmu" → muncul **dua pilihan materi**
- [ ] Mode **Kata** menampilkan jumlah kata yang dikuasai
- [ ] Mode Kata **nonaktif** kalau anak belum punya 3 kata
- [ ] Mode **Angka** selalu bisa dipilih, bertanda "Tidak pernah habis"

**Penerbangan Angka:**

- [ ] Soal pecahan muncul dengan **batang visual** di panel
- [ ] Lencana tingkat (Ringan/Sedang/Menantang) tampil di papan skor
- [ ] Jawab benar 4 dari 5 → muncul *"📈 Naik tingkat!"*
- [ ] Jawab salah 3+ dari 5 → muncul *"🌱 Kita pelan-pelan dulu ya"*
- [ ] Jawaban salah menampilkan **penjelasan**, bukan cuma jawaban benar
- [ ] Jeda setelah salah lebih lama (penjelasan sempat terbaca)
- [ ] Tutup lalu buka lagi → tingkat **tersimpan**

**Regresi:**

- [ ] Mode Kata masih berjalan seperti Patch 47
- [ ] Rekor lama dari Patch 47 **tidak hilang** (dipindah ke slot Kata)
- [ ] Latihan Tenang masih mencatat ke penjadwalan Leitner
- [ ] Mode Kata **tidak** mengubah jadwal Leitner
- [ ] Tidak ada tombol mengambang kelima

---

## 11. Hasil verifikasi

| Pemeriksaan | Hasil |
|---|---|
| Keseimbangan kurung, 3 berkas (pemeriksa sadar-string) | ✅ Seimbang |
| Import menganggur | ✅ Nol temuan |
| Ekspor yang dibutuhkan antar-berkas | ✅ Lengkap |
| Sisa `React.` di luar komentar | ✅ Nol |

**Belum bisa saya verifikasi:** `npm run build` — `node_modules` tidak tersedia di
lingkungan kerja saya.

---

## 12. Migrasi rekor dari Patch 47

Rekor kini dipisah per materi (`kata` dan `angka`) — membandingkan skor kosakata
dengan skor matematika tidak bermakna karena soalnya berbeda jenis.

Rekor lama dari Patch 47 **dipindahkan otomatis** ke slot `kata`. Pencapaian anak
tidak hilang.

---

## 13. Langkah berikutnya untuk Numeria

Generator ini siap dipakai `NumeriaGame.tsx`, tapi saya **belum memegang salinan
berkas itu**. Kalau Anda kirimkan, saya bisa:

1. Mengganti 5 level tetapnya dengan soal yang dihasilkan prosedural
2. Menyambungkan mekanik jembatan ke tingkat adaptif yang sama
3. Membuat kedua mode berbagi satu catatan kemajuan

Cara mengimpornya nanti sesederhana ini:

```ts
import { generateMathQuestion, recordMathAnswer } from '../math/mathGenerator';
```

Tidak ada penyesuaian lain yang diperlukan — itu sebabnya generator dibuat mandiri
sejak awal.
