# Patch 60 — Pesawat macet + matematika kelas 1-6 + perapian UI

**Sifat patch:** perbaikan kritis + materi baru. Tanpa dependency baru.

---

## Urutan pemasangan

```powershell
# 1. Perbaiki build error dulu — ini memblokir segalanya
node fix-skyrun.mjs

# 2. Salin berkas dari folder src/
# 3. Build
npm run build
```

---

## 1. Pesawat macet & build error — satu bug, dua gejala

Pada Patch 59 saya menambahkan `onReadTick` ke **anotasi tipe**
GateRunner, tapi lupa menambahkannya ke **pola destructuring**:

```tsx
function GateRunner({
  question, laneStates, paused, onCross,   // <- onReadTick TIDAK ADA
}: {
  ...
  onReadTick: (remaining: number) => void;  // <- hanya di tipe
}) {
```

### Kenapa pesawatnya diam

Saat `npm run dev` berjalan (yang tidak memeriksa tipe), panggilan
`onReadTick` melempar `ReferenceError` di dalam `useFrame`. Blok
`try/catch` milik saya sendiri **menelan galat itu diam-diam**.

Akibatnya tiap frame: hitung mundur baca berjalan, lempar galat, keluar.
Setelah 2,6 detik `onReadTick(0)` juga melempar — sehingga baris
`zRef.current += GATE_SPEED * dt` **tidak pernah tercapai**.

Gerbang tidak pernah bergerak. Bilah "Baca dulu..." diam selamanya.

### Pelajaran: try/catch yang terlalu luas

Saya membungkus `useFrame` dengan try/catch untuk mencegah satu galat
mematikan seluruh scene — itu benar, pelajaran dari Patch 15.

Tapi menelan galat **tanpa membedakan jenisnya** membuat bug pemrograman
tersembunyi berhari-hari. Gejalanya hanya "pesawat macet", tanpa
petunjuk apa pun di Console.

Skrip ini sekaligus memperbaiki itu: `ReferenceError` dan `TypeError`
kini **dilaporkan keras** ke Console, galat lain tetap diredam.

### Hasil uji skrip

| Kasus | Hasil |
|---|---|
| Kondisi rusak | ✅ Kedua perbaikan diterapkan |
| Dijalankan dua kali | ✅ Dilewati, nol duplikasi |
| `onReadTick` di destructuring | ✅ Muncul tepat 1 kali |

---

## 2. Matematika kelas 1-6 — sembilan topik

Keluhan Anda benar sepenuhnya: sebelum patch ini Numeria **hanya**
mengajarkan pecahan, topik kelas 4 ke atas. Anak kelas 1, 2, dan 3
tidak mendapat apa pun yang sesuai tingkatnya.

### Satu mekanik, enam tingkat kelas

Mekanik jembatan ternyata jauh lebih lentur daripada yang saya kira.
"Pasang N papan dari D papan" bisa membawa hampir seluruh kurikulum
berhitung SD, hanya dengan mengubah **cara bertanya**:

| Kelas | Topik | Contoh soal |
|---|---|---|
| 1 | Membilang | "Pasang 7 papan" |
| 1 | Penjumlahan | "Pasang 3 + 4 papan" |
| 2 | Pengurangan | "Perlu 9 papan, sudah ada 4" |
| 2 | Nilai tempat | "Pasang 1 puluhan + 3 satuan" |
| 3 | Perkalian | "Pasang 3 kelompok, tiap kelompok 4 papan" |
| 3 | Pembagian | "12 papan dibagi 4 bagian — pasang 1 bagian" |
| 4 | Pecahan | "Sambungkan 3/4 jembatan" |
| 5 | Pecahan senilai | "Sambungkan 1/2, tapi ada 8 papan" |
| 6 | Persen | "Pasang 50% dari 10 papan" |

Anak **membangun** jawabannya, bukan memilih dari daftar — pedagogi
yang jauh lebih kaya daripada pilihan ganda.

### Keterangan yang jelas

Keluhan "keterangan kurang jelas" ditangani lewat tiga medan terpisah
pada **tiap** soal:

| Medan | Isi | Muncul kapan |
|---|---|---|
| `prompt` | Apa yang harus dilakukan | Selalu |
| `hint` | Cara memikirkannya | Saat menekan Petunjuk |
| `explanation` | Kenapa jawabannya begitu | Setelah menjawab |

Penjelasan muncul **benar maupun salah**, sehingga tiap percobaan jadi
momen belajar.

### Topik bergiliran, bukan diacak murni

Pengacakan murni sering menghasilkan tiga soal sejenis berturut-turut —
persis penyebab kesan monoton. Sekarang topik berputar bergiliran.

Kelas atas sengaja masih memuat topik kelas bawah dengan porsi kecil:
pengulangan berjarak menjaga keterampilan dasar tetap lancar.

---

## 3. Pengganti langsung — nol perubahan di NumeriaGame.tsx

`bridgeLevels.ts` versi baru mempertahankan **persis** seluruh ekspor
versi Patch 54:

```
BridgeKind, BridgeChallenge, MathLevel
initialBridgeLevel(), generateBridge(), adjustLevel()
BRIDGE_LEVEL_LABEL
```

Nama sama, bentuk data sama, tipe kembalian sama. **`NumeriaGame.tsx`
tidak perlu diubah satu baris pun.**

Yang berubah hanya isinya: soal kini datang dari kurikulum kelas 1-6.

### Bagaimana tingkat lama dipetakan ke kelas

Permainan masih memakai tiga tingkat untuk penyesuaian otomatis. Kelas
yang dipilih anak menentukan rentang mana yang dipakai:

```
kelas 1, ringan     -> kelas 1
kelas 1, menantang  -> kelas 2
kelas 4, ringan     -> kelas 3
kelas 4, menantang  -> kelas 5
```

Pergeserannya sengaja kecil — anak tidak pernah terlempar jauh dari
materi yang sedang ia pelajari di sekolah.

---

## 4. Perapian UI — empat keluhan

### a. "bar health pojok kanan untuk apa?"

**Itu bukan health bar.** Itu Knowledge Crystal — hadiah quest dari
Patch 39, empat warna: hijau, biru, emas, ungu.

Kenyataan bahwa Anda membacanya sebagai nyawa berarti **desainnya
gagal**. Ikonnya memakai bentuk hati (♡), yang di hampir semua
permainan berarti health.

Diperbaiki: diberi label "◆ Kristal", disatukan dalam wadah kaca, dan
yang bernilai nol diredupkan supaya tidak menuntut perhatian.

### b. "pojok kanan atas 4 hari itu untuk apa?"

Itu **streak** — hari berturut-turut bermain, dari Patch 34. Labelnya
hanya "hari bertumbuh", terlalu samar. Diperbaiki agar lebih terbaca.

### c. "header versi web masih terlalu besar"

Benar. Di layar >= 1100px, header + hero memakan sekitar sepertiga
tinggi layar sebelum peta terlihat.

Diperbaiki: pada layar lebar, hero dipadatkan agresif (h1 dari ~30px ke
21px, padding dari 14px ke 9px). Peta mendapat ruang jauh lebih besar.

### d. "button pojok kiri belum rapih, gak nyambung dengan design"

Rel tombol memakai gaya sendiri yang tidak berhubungan dengan bahasa
visual peta. Diperbaiki: radius & bayangan disamakan dengan kartu misi.

---

## File dalam patch ini

```
fix-skyrun.mjs                          (SKRIP — jalankan lebih dulu)
src/game/numeria/mathCurriculum.ts      (BARU — kurikulum kelas 1-6)
src/game/numeria/bridgeLevels.ts        (TIMPA — pengganti langsung)
src/theme/uiRefine.ts                   (BARU — perapian UI)
src/main.tsx                            (TIMPA — + uiRefine)
```

### Yang TIDAK disentuh

| Berkas | Alasan |
|---|---|
| `NumeriaGame.tsx` | Pengganti langsung membuatnya tidak perlu diubah |
| `DailyPractice.tsx` | Baru diperbaiki dari bug beku Patch 53 |
| `SkyRunGame.tsx` | Hanya disentuh skrip, secara bedah |
| `worlds.ts` | Formasi cincin sudah dua kali regresi |
| `styles.css` | Kebijakan file lengkap |

---

## ⚠️ Yang BELUM bisa saya kerjakan

Berkas zip tidak ada di unggahan Anda kali ini — hanya gambar. Jadi saya
**tidak bisa membaca kode Anda saat ini**, dan hanya mengerjakan yang
aman dikerjakan tanpa membaca:

| Keluhan | Status | Kenapa |
|---|---|---|
| "tower tengah belum terhubung dengan menara" | ❌ Belum | Butuh `WorldScene.tsx` untuk tahu posisi & penghubungnya |
| "char belum berubah" di Numeria | ❌ Belum | Skrip `fix-brightoria.mjs` dari Patch 58 seharusnya mengerjakannya — mohon jalankan lagi dan kirim laporannya |
| "ekspedisi yang harus ditingkatkan apa?" | ❌ Belum | Perlu diskusi arah, bukan tambalan |
| Layar pilih kelas di Numeria | ⚠️ Sebagian | Kurikulum siap, tapi UI pemilih kelas butuh `NumeriaGame.tsx` |

Untuk keempatnya saya perlu zip terbaru Anda. Saya **tidak mau menebak**
isi berkas — tiga patch terakhir semuanya memperbaiki bug yang muncul
karena saya menambal tanpa melihat kode.

### Catatan soal kelas

Kurikulum sudah siap dan teruji, tapi **anak belum bisa memilih
kelasnya** — kelas tersimpan di `localStorage` dengan bawaan kelas 1.

Untuk sementara bisa diubah lewat Console:

```js
localStorage.setItem('brightoria.numeria.grade.v1', '3');
```

Layar pemilih kelas akan saya bangun begitu bisa melihat
`NumeriaGame.tsx`.

---

## Checklist uji

**Build & pesawat:**
- [ ] `node fix-skyrun.mjs` melapor 2 perbaikan
- [ ] `npm run build` **lolos tanpa galat**
- [ ] Penerbangan Ilmu: bilah "Baca dulu..." menyusut lalu **habis**
- [ ] Gerbang **mulai mendekat** setelah bilah habis
- [ ] Pesawat bisa digerakkan setelah fase baca

**Numeria:**
- [ ] Soal **bukan hanya pecahan** — muncul membilang, penjumlahan, dsb
- [ ] Tiap soal punya petunjuk yang jelas
- [ ] Penjelasan muncul setelah menjawab, benar maupun salah
- [ ] Ubah kelas lewat Console → soal ikut berubah tingkatnya

**UI:**
- [ ] Kristal di Ekspedisi punya label "◆ Kristal"
- [ ] Yang bernilai nol terlihat redup
- [ ] Di layar lebar, hero jauh lebih ramping
- [ ] Peta mendapat ruang lebih besar

**Regresi:**
- [ ] Lompat Katak tetap berjalan
- [ ] Menara Latihan tetap di tengah peta
- [ ] Tidak ada yang membeku

---

## Hasil verifikasi

| Pemeriksaan | Hasil |
|---|---|
| Keseimbangan kurung, 4 berkas | ✅ Semua seimbang |
| Uji skrip: kondisi rusak | ✅ 2/2 diterapkan |
| Uji skrip: idempoten | ✅ Dilewati, nol duplikasi |
| Kurikulum: 18.000 soal | ✅ **0 melanggar invarian** |
| Kurikulum: cakupan topik | ✅ 9/9 topik muncul |
| bridgeLevels: 27.000 tantangan | ✅ **0 melanggar invarian** |
| bridgeLevels: ekspor wajib | ✅ Lengkap |
| bridgeLevels: cakupan kelas | ✅ 1,2,3,4,5,6 |
| `adjustLevel` naik/turun/tetap | ✅ Ketiganya benar |
| Karakter non-ASCII di warna | ✅ Nol |

Invarian yang diuji: `target <= denominator`, `preset < target`,
`target >= 1`, `denominator <= 30`, dan semua teks tidak kosong.

**Belum bisa saya verifikasi:** `npm run build` — `node_modules` tidak
tersedia di lingkungan kerja saya.
