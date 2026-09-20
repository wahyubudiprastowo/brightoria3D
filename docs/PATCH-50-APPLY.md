# Patch 50 — Lompat Katak: Kuis 3D Tanpa Tekanan Waktu

**Sifat patch:** fitur baru. Tanpa dependency baru, `package.json` tidak berubah,
`App.tsx` dan `main.tsx` tidak perlu disentuh.

---

## 1. Menjawab dua rujukan Educaplay

| Rujukan | Status |
|---|---|
| **AsterQuiz** | ✅ Sudah jadi — Penerbangan Ilmu (Patch 47–49) |
| **Froggy Jumps** | ✅ Jadi di patch ini — Lompat Katak |

Keduanya memang layak dibangun terpisah, karena mekaniknya **berlawanan secara
pedagogi** — bukan sekadar berbeda tampilan.

---

## 2. Kenapa dua mode arkade, bukan satu

| | Penerbangan Ilmu | Lompat Katak |
|---|---|---|
| Ritme | Terus bergerak | **Bergiliran** |
| Tekanan waktu | Ada (gerbang mendekat) | **Tidak ada sama sekali** |
| Menguji | Kelancaran & refleks | **Ketepatan & pertimbangan** |
| Kemajuan terlihat dari | Angka skor | **Jejak daun di belakang** |

### Ini penting untuk anak yang membeku saat diburu waktu

Sebagian anak tahu jawabannya, tapi panik saat ada yang mendekat. Di Lompat Katak
ia boleh memandangi soalnya **selama yang ia mau** — katak baru melompat setelah ia
memilih.

Jadi ini bukan variasi tampilan, melainkan **jalur kedua untuk tipe anak yang
berbeda**.

### Kemajuan yang bisa dilihat mata

Penerbangan Ilmu menunjukkan kemajuan lewat angka. Di sini kemajuan **berbentuk**:
daun teratai yang sudah dilewati tetap ada di belakang, membentuk jejak yang
memanjang.

Anak bisa menoleh dan melihat sendiri seberapa jauh ia sudah melompat. Bagi usia
6–12, bukti visual semacam itu jauh lebih berarti daripada angka yang naik.

---

## 3. Memakai ulang sumber soal yang sama

Soal diambil dari `skyRunQuestions.ts` — **persis sumber yang dipakai Penerbangan
Ilmu**. Artinya mode ini tidak menambah materi ajar baru, hanya cara penyajian baru.

Dua materi tersedia:

| Materi | Sumber | Jumlah |
|---|---|---|
| 📖 **Kata** | Kosakata yang sudah dikuasai anak | Terbatas |
| 🔢 **Angka** | Pecahan prosedural (Patch 48) | **Tidak pernah habis** |

Aturan pencatatan tetap konsisten dengan Patch 48:

- Mode **Angka** → mencatat ke mesin adaptif (tingkat naik-turun)
- Mode **Kata** → **tidak** menyentuh penjadwalan Leitner

---

## 4. Detail 3D yang menentukan rasa

### Lompatan katak

Tiga prinsip animasi klasik dipakai sekaligus:

| Prinsip | Wujudnya |
|---|---|
| **Anticipation** | Badan menekuk sesaat sebelum menolak |
| **Squash** | Gepeng saat menolak dan saat mendarat |
| **Stretch** | Memanjang di puncak lintasan |

Tanpa ketiganya, lompatan hanya terlihat seperti kotak berpindah tempat. Dengan
ketiganya, katak terasa punya **bobot dan tenaga**.

### Kolam yang terasa nyata

| Unsur | Kenapa ada |
|---|---|
| Air `roughness 0.06` + `metalness 0.62` | Memantulkan langit lewat IBL. Tanpa `ProceduralEnv`, permukaan ini akan terlihat seperti plastik gelap |
| Riak mengembang di titik pendaratan | Isyarat sebab-akibat — anak melihat lompatannya **mengenai** air |
| Bayangan kontak di bawah tiap daun | Membuat daun terbaca **mengapung**, bukan melayang |
| Alang-alang & rumpun teratai di tepi | Acuan gerak — tanpa objek yang lewat, katak tidak terasa maju |
| Kunang-kunang berdenyut | Kolam terasa hidup tanpa mengalihkan perhatian |

### Lintasan melengkung, bukan lurus

Jalur daun sengaja **membelok pelan** lewat sinus. Lintasan lurus terbaca sebagai
lorong buatan; belokan lembut membuatnya terasa seperti menyusuri kolam sungguhan.

### Papan jawaban berdiri tegak

Teks **tidak** diletakkan di permukaan daun. Teks yang terbaring datar akan terlihat
terjepit secara perspektif dari sudut kamera di belakang.

Papan digambar ke **tekstur kanvas**, bukan `<Html>` — pelajaran dari Patch 49:
`<Html>` berukuran piksel tetap sehingga tidak ikut mengecil secara perspektif.

---

## 5. Empat cara memilih jawaban

| Cara | Keterangan |
|---|---|
| **Ketuk daun teratai** di kolam | Cara utama, paling terasa bermain |
| **Ketuk kartu** di bawah layar | Cadangan bila papan 3D sulit dibaca |
| **Angka 1 / 2 / 3** | Untuk yang lebih nyaman dengan papan ketik |
| Esc | Keluar |

Kartu di bawah layar adalah pelajaran langsung dari Patch 49 — waktu itu anak
bertanya *"pilihannya di mana?"* karena pilihan hanya ada di objek 3D yang jauh.

---

## 6. Tidak ada tombol mengambang baru

Patch 46 sudah merapikan empat tombol yang bertumpuk. Menambah yang kelima akan
membatalkan kerja itu.

Mode baru masuk sebagai **pilihan ketiga** di dalam panel Latihan:

```
Tombol "🔁 Latihan"  →  🔁 Latihan Tenang
                     →  🐸 Lompat Katak      (baru)
                     →  ✈️ Penerbangan Ilmu
```

Urutannya disengaja: **Lompat Katak ditaruh sebelum Penerbangan Ilmu** karena ia
lebih ramah untuk anak yang baru mencoba — tanpa tekanan waktu.

### Satu perbaikan kecil yang ikut masuk

Kalau anak **belum punya kosakata** sama sekali, versi lama menyembunyikan seluruh
pilihan. Sekarang dua mode 3D tetap muncul, karena **mode Angka tidak butuh
kosakata** — soalnya dihasilkan otomatis.

---

## 7. File dalam patch ini

```
src/game/froggy/FroggyGame.tsx   (BARU — scene 3D kolam & katak)
src/game/DailyPractice.tsx       (TIMPA — pemilih tiga mode)
docs/PATCH-50-APPLY.md           (BARU)
```

**Prasyarat:** Patch 47–49 (`skyRunQuestions.ts`, `SkyRunGame.tsx`), Patch 48
(`mathGenerator.ts`), Patch 35 (`practiceEngine.ts`, `reviewDeck.ts`), Patch 38
(pipeline render), Patch 42 (`ProceduralEnv.tsx`).

`skyRunQuestions.ts`, `mathGenerator.ts`, dan `SkyRunGame.tsx` **tidak berubah**.

---

## 8. Cara memasang

Salin **isi** folder `p50/` ke root proyek — bukan foldernya:

```
BENAR:  brightoria/src/game/froggy/FroggyGame.tsx
SALAH:  brightoria/p50/src/game/froggy/FroggyGame.tsx
```

```powershell
npm run typecheck
npm run build
npm run dev
```

Lalu muat ulang paksa (`Ctrl+Shift+R`) — versi lama menyuntikkan `<style>` dengan id
berbeda, dan versi baru menghapusnya otomatis, tapi cache peramban bisa menahan JS
lama.

---

## 9. Checklist uji

**Pemilih mode:**

- [ ] Tombol "🔁 Latihan" → muncul **tiga pilihan**
- [ ] Lompat Katak berada **di atas** Penerbangan Ilmu
- [ ] Kalau belum ada kosakata → dua mode 3D **tetap bisa dipilih**

**Lompat Katak:**

- [ ] Kolam terlihat memantulkan langit
- [ ] Tiga daun teratai mengapung dengan papan jawaban tegak
- [ ] **Ketuk daun** → katak melompat dengan lintasan melengkung
- [ ] Katak **menggepeng** saat menolak dan mendarat, **memanjang** di puncak
- [ ] Riak mengembang di titik pendaratan
- [ ] Jawaban benar → daun menyala hijau
- [ ] Jawaban salah → daun yang benar **berbunga emas**
- [ ] Daun yang sudah dilewati tetap terlihat di belakang
- [ ] Kamera mengikuti dengan sedikit jeda, bukan menempel kaku
- [ ] **Tidak ada hitung mundur** di mana pun

**Kendali:**

- [ ] Ketuk daun 3D berfungsi
- [ ] Ketuk kartu di bawah layar berfungsi
- [ ] Angka 1 / 2 / 3 berfungsi

**Mode Angka:**

- [ ] Batang pecahan tampil di panel soal
- [ ] Lencana tingkat muncul di papan skor
- [ ] Naik/turun tingkat muncul sesuai jawaban
- [ ] Tingkat **dibagi** dengan Penerbangan Ilmu (naik di satu mode, terbawa ke
      mode lain)

**Regresi:**

- [ ] Latihan Tenang masih mencatat ke Leitner
- [ ] Penerbangan Ilmu masih berjalan seperti Patch 49
- [ ] Rekor Lompat Katak **terpisah** dari rekor Penerbangan
- [ ] Tidak ada tombol mengambang kelima

---

## 10. Hasil verifikasi

| Pemeriksaan | Hasil |
|---|---|
| Keseimbangan kurung, 2 berkas (pemeriksa sadar-string) | ✅ 414/414, 145/145 |
| Import menganggur | ✅ Nol temuan |

**Satu masalah ditemukan dan diperbaiki saat verifikasi:** `SKY` dan `WORLD`
diimpor dari `brightBrand` tapi **nol pemakaian nyata** — hanya "terpakai" oleh
baris `export { SKY, WORLD }` yang keliru di akhir berkas. Keduanya dihapus.

Mengekspor ulang warna merek dari komponen permainan tidak masuk akal secara
arsitektur, dan pada build strict `noUnusedLocals` itu bisa menggagalkan kompilasi.

**Belum bisa saya verifikasi:** `npm run build` — `node_modules` tidak tersedia di
lingkungan kerja saya.

---

## 11. Catatan soal font Arab pada tekstur

Papan jawaban digambar ke kanvas memakai tumpukan font
`'Noto Naskh Arabic','Amiri',serif`.

Kanvas hanya bisa memakai font yang **sudah dimuat peramban**. Font itu sudah dimuat
lewat CSS aplikasi, jadi seharusnya aman. Tapi bila pada perangkat tertentu teks
Arab di papan terlihat memakai font cadangan, **kartu di bawah layar tetap
menampilkannya dengan benar** — karena itu HTML biasa.

Itu alasan tambahan kenapa kartu bawah penting: ia menjadi jaring pengaman bila
rendering 3D bermasalah.

---

## 12. Kerangka yang kini terbentuk

Dengan Patch 50, ada **satu sumber soal yang melayani tiga penyajian**:

```
                    skyRunQuestions.ts
                    (kata + angka)
                           │
          ┌────────────────┼────────────────┐
          │                │                │
    Latihan Tenang   Penerbangan Ilmu   Lompat Katak
     (kartu 2D)       (arkade cepat)    (giliran santai)
```

Menambah penyajian keempat nanti cukup dengan membaca sumber yang sama. Dan
menambah **jenis materi** ketiga cukup dengan memperluas `skyRunQuestions.ts` —
ketiga permainan langsung ikut mendapatkannya tanpa disentuh.
