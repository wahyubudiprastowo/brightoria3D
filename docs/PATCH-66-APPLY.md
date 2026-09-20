# Patch 66 — Tombol tembak, alur menerus, aset diperbaiki

**Sifat patch:** fitur baru + perbaikan visual. Tanpa dependency baru.

---

## Cara memasang

```powershell
# 1. Salin folder src/ ke proyek
# 2. Pasang alur menerus + tombol tembak
node flow-fix.mjs

# 3. Daftarkan tombol tembak di src/main.tsx (satu baris)
#    import './game/skyrun/FireButton';

# 4. Build
npm run build
```

---

## 1. Tombol tembak

Umpan balik: *"ada button buat tembak jawaban atau asteroidnya"*.

Tombol **🔥 Tembak!** kini muncul di bawah layar saat Penerbangan Ilmu
terbuka. Bisa juga ditekan dengan **spasi**.

### Menembak = mengunci jawaban

Ini keputusan desain yang paling menentukan. Tombol yang hanya
menghasilkan kilatan cahaya akan terasa **palsu** — anak akan segera
berhenti menekannya.

Jadi menembak **mengunci jawaban** jalur yang sedang ditempati, tanpa
menunggu gerbang tiba. Anak yang sudah yakin bisa langsung menembak.

| Kondisi | Perilaku |
|---|---|
| Fase baca belum habis | Tombol tidak mengunci — hanya tembakan visual |
| Sedang terbang | Mengunci jawaban jalur saat itu |
| Jeda antar-tembakan | 260 ms, mencegah spam merusak irama |

Menembak selama fase baca sengaja **tidak** mengunci. Itu akan menghukum
anak yang penasaran menekan tombol sebelum sempat membaca soalnya.

### Letusan berbeda dari tembakan otomatis

Tembakan picu memakai **tiga peluru beruntun**, lebih gemuk, dan
berwarna emas — bukan biru seperti tembakan otomatis.

Kalau keduanya terlihat sama, tombolnya akan terasa tidak berpengaruh.

---

## 2. Alur menerus — bukan ganti slide

Umpan balik: *"bukan kayak mulai dari awal kek slide selanjutnya, tapi
terus jalan"*.

Penyebabnya **satu baris**:

```tsx
paused={phase !== 'flying'}
```

Setelah anak menjawab, fase berubah menjadi `'between'`. Karena
`'between'` bukan `'flying'`, gerbang langsung **membeku di tempat** —
lalu muncul lagi dari kejauhan saat soal berikutnya.

Itulah yang terbaca sebagai pergantian slide: ada jeda mati, lalu mulai
dari awal.

### Perbaikan

```tsx
paused={phase !== 'flying' && phase !== 'between'}
```

Gerbang yang sudah dijawab melintas terus melewati kamera sementara
anak membaca umpan baliknya, lalu gerbang berikutnya datang dari
kejauhan. **Penerbangan tidak pernah berhenti.**

---

## 3. Asteroid & awan diperbaiki

Umpan balik: *"awan sama asteoridnya masih aneh"*.

Membandingkan lebih teliti dengan lembar aset referensi, ada tiga
selisih yang belum tertangani:

### a. Facet terlalu kecil

Referensi memperlihatkan facet **besar** — kira-kira selebar seperlima
bongkahan, berbentuk segi lima dan segi enam.

Versi lama memakai subdivisi tinggi yang menghasilkan segitiga kecil;
dari kejauhan itu terbaca sebagai bola kasar, bukan batu terasah.

### b. Siluet terlalu bergelombang

Jitter `0.14` membuat tepi bongkahan bergerigi. Pada referensi,
siluetnya **halus membulat** — yang bersegi hanya permukaannya, bukan
tepinya.

Diperbaiki: jitter turun ke `0.05`, bentuk dasar diregangkan menjadi
elipsoid lebar seperti pada gambar.

### c. Gradasi salah arahnya — ini yang paling menentukan

Versi lama menggelapkan bagian bawah secara **merata berdasarkan
ketinggian**. Referensi memperlihatkan cahaya datang dari **kanan
atas** — facet yang menghadap ke sana jauh lebih terang, dan
bayangannya jatuh ke kiri bawah.

Sekarang kecerahan tiap facet dihitung dari **sudut antara normal facet
dan arah cahaya**:

```ts
const facing = normal.dot(LIGHT_DIR);
```

Inilah yang membuat bongkahan terbaca sebagai batu terasah — sama
seperti batu sungguhan, bukan bola yang diberi gradien.

### Koridor permainan tetap dijaga

Perbaikan Patch 65 dipertahankan: batu **tidak pernah** lahir di depan
gerbang jawaban. Itu bukan soal estetika — tanpa koridor bersih, anak
tidak bisa membaca jawabannya.

---

## File dalam patch ini

```
flow-fix.mjs                        (SKRIP — alur menerus + kunci jawaban)
src/game/skyrun/FireButton.ts       (BARU  — tombol tembak)
src/game/skyrun/Blaster.tsx         (TIMPA — + tembakan picu)
src/game/skyrun/SpaceField.tsx      (TIMPA — facet & pencahayaan)
```

### Satu baris di main.tsx

```ts
import './game/skyrun/FireButton';
```

Letakkan bersama modul self-mounting lainnya. Tanpa baris ini tombolnya
tidak akan muncul.

### Yang TIDAK disentuh

| Berkas | Alasan |
|---|---|
| `ShipModel.tsx` | Kontrak `Blaster` tidak berubah |
| `EngineTrail.tsx` | Sudah benar sejak Patch 64 |
| `skyRunQuestions.ts` | Logika soal tidak berubah |

`SkyRunGame.tsx` hanya disentuh skrip, secara bedah — dua perubahan
kecil, dengan pemeriksaan struktur sebelum menulis.

---

## Hasil uji skrip

| Uji | Hasil |
|---|---|
| Berkas CRLF Windows | ✅ 2/2 perubahan diterapkan |
| Struktur hasil seimbang | ✅ `{} 13/13  () 19/19  [] 4/4` |
| **`onReadTick` bertahan** | ✅ Utuh |
| Dijalankan dua kali | ✅ Dilewati, nol duplikasi |
| Struktur rusak | ✅ Menolak, exit 1, berkas tidak disentuh |

Baris ketiga penting — itu membuktikan perbaikan Patch 63 tidak
terhapus.

---

## Checklist uji

**Tombol tembak:**
- [ ] Tombol **🔥 Tembak!** muncul saat Penerbangan Ilmu terbuka
- [ ] Tombol **hilang** saat permainan ditutup
- [ ] Menekan → letusan tiga peluru emas
- [ ] Spasi juga menembak
- [ ] Menembak saat "Baca dulu..." → hanya tembakan, jawaban tidak terkunci
- [ ] Menembak setelah fase baca → jawaban jalur langsung terkunci

**Alur menerus:**
- [ ] Setelah menjawab, gerbang **terus melaju** melewati kamera
- [ ] Tidak ada jeda beku yang terasa seperti ganti slide
- [ ] Gerbang berikutnya datang dari kejauhan tanpa lompatan

**Aset:**
- [ ] Asteroid punya **facet besar**, bukan segitiga kecil
- [ ] Siluetnya **halus membulat**, bukan bergerigi
- [ ] Sisi yang menghadap kanan-atas jelas **lebih terang**
- [ ] Awan berbentuk gugus gumpalan beralas rata
- [ ] Gerbang jawaban **tidak pernah tertutup** batu

**Regresi:**
- [ ] `npm run build` lolos tanpa galat
- [ ] Bilah "Baca dulu..." muncul lalu habis
- [ ] Tiga semburan mesin tetap menyala
- [ ] Menjawab lewat kartu bawah tetap berfungsi

---

## Hasil verifikasi

| Pemeriksaan | Hasil |
|---|---|
| Sintaks skrip (`node --check`) | ✅ Lolos |
| Keseimbangan kurung, 3 berkas | ✅ Semua seimbang |
| Import menganggur | ✅ Nol temuan |
| Non-ASCII di nilai warna | ✅ Bersih |
| Kontrak `SpaceField` & `Blaster` | ✅ Tidak berubah |
| Observer `FireButton` menulis `innerHTML` | ✅ **Nol** — pelajaran Patch 53 |

Baris terakhir penting: pada Patch 53, observer yang menulis `innerHTML`
di dalam callback-nya sendiri membekukan seluruh laman. Observer di
`FireButton` hanya menyetel properti `hidden`, jadi tidak pernah bisa
memicu dirinya sendiri.

**Belum bisa saya verifikasi:** `npm run build` — `node_modules` tidak
tersedia di lingkungan kerja saya.
