# Patch 56 — Karakter halus + input nama

**Sifat patch:** perbaikan visual + fitur baru. Tanpa dependency baru
(`RoundedBox` sudah ada di drei 10.7.8 yang terpasang).

---

## 1. Kenapa karakter terasa kasar

Umpan balik: *"gak halus smooth, peci dsb aneh"*. Dua penyebab yang
saling memperburuk:

### a. `flatShading: true` di semua material

Flat shading membuat tiap sisi berwarna rata dengan batas tegas. Bagus
untuk arena dan pohon — tapi pada karakter **tanpa wajah**, hasilnya
terbaca kasar karena tidak ada gradasi yang melembutkan bentuk.

### b. `boxGeometry` bersudut 90 derajat

Referensi PolyPaper punya sudut **membulat**. Itu bukan detail kecil:
sudut membulat menangkap cahaya di tepinya, dan tangkapan cahaya itulah
yang membuat objek terasa lembut.

### Perbaikannya

| | Sebelum | Sesudah |
|---|---|---|
| Shading | `flatShading: true` | Smooth (nol `flatShading` di kode) |
| Bentuk | `boxGeometry` | `RoundedBox` dari drei |
| Sudut | 90° tajam | `radius` 0.04–0.085 |

Gaya blocky **tetap dipertahankan** — proporsi kepala besar dan badan
pipih tidak berubah sama sekali. Yang berubah hanya ketajaman sudut.

---

## 2. Peci dan rambut dirancang ulang

**Masalah versi lama:** peci = satu tabung putih duduk di atas lempengan
rambut hitam. Terlihat seperti dua benda yang kebetulan bertumpuk.

Pada referensi, peci itu **pendek dan lebar**, duduk agak masuk ke dalam
rambut, dan rambutnya **berponi** — mencuat di dahi dan sisi. Itu yang
membuatnya terbaca sebagai satu kesatuan.

### Peci baru

- Tinggi 0.105 (dari 0.13) — lebih pendek, lebih lebar
- Silinder **16 sisi** agar lingkarannya mulus
- **Tepi atas membulat** (torus) — inilah yang menangkap cahaya
- Duduk lebih rendah, masuk ke rambut

### Rambut baru — tiga bagian

| Bagian | Fungsi |
|---|---|
| **Batok** | Menutupi atas & belakang kepala |
| **Poni** | Mencuat di dahi, plus dua jumput yang lebih turun |
| **Cambang** | Sisi kiri-kanan, membingkai wajah |

Tanpa poni, rambut terbaca sebagai lempengan datar — persis keluhan Anda.

---

## 3. Input nama

Anak mengetik nama panggilannya di layar pilih karakter. Tersimpan di
perangkat dan dipakai menyapa dia di seluruh aplikasi.

### Tiga keputusan desain

**Nama boleh dikosongkan.** Anak yang belum lancar menulis tidak boleh
terhalang masuk ke permainan. Bila kosong, ia disapa "Penjelajah".

**Karakter tidak ditolak, tapi dibersihkan.** Mengetik karakter aneh
tidak memunculkan pesan galat — huruf yang tidak diizinkan cukup tidak
muncul. Anak tidak boleh merasa dimarahi karena menekan tombol salah.

**Nama hanya di perangkat.** Tidak pernah dikirim ke mana pun.

### Yang diizinkan

Huruf (termasuk Arab), angka, spasi, apostrof, tanda hubung. Maksimal
14 karakter — cukup untuk nama panggilan tanpa merusak tata letak.

### Lencana nama di header

Modul `playerBadge.ts` menyisipkan lencana di header:

```
[logo] ......... [🧑 Fatimah] [XP] [mode]
```

Ketuk lencana → layar pilih karakter terbuka lagi.

**Catatan keamanan:** nama disisipkan sebagai `textContent`, bukan
`innerHTML` — nama diketik anak, jadi tidak boleh pernah ditafsirkan
sebagai markup.

---

## 4. Pelajaran Patch 53 diterapkan

Kedua modul baru (`playerBadge.ts`, `CharacterPicker.tsx`) **sengaja
tidak memakai MutationObserver** — nol observer di kode, sudah
diverifikasi.

Pada Patch 53, observer di DailyPractice menulis `innerHTML` tombolnya
sendiri di dalam callback-nya sendiri, memicu dirinya berulang tanpa
henti dan membekukan seluruh laman.

`playerBadge.ts` memakai **percobaan berulang terbatas** (20 kali, jeda
250ms) untuk menunggu header muncul, lalu berhenti. Ditambah penjaga
`lastText` yang mencegah penulisan DOM berulang.

---

## File dalam patch ini

```
src/game/identity.ts                        (TIMPA — + nama)
src/components/world3d/outfits.tsx          (TIMPA — halus + peci baru)
src/components/world3d/BlockyCharacter.tsx  (TIMPA — RoundedBox)
src/game/CharacterPicker.tsx                (TIMPA — + input nama)
src/theme/playerBadge.ts                    (BARU — lencana header)
src/main.tsx                                (TIMPA — + playerBadge)
```

---

## ⚠️ PENTING: dua langkah manual di NumeriaGame.tsx

Pada tangkapan layar Anda, **penjelajah di jembatan masih punya mata**
dan berbusana navy. Itu komponen `Walker` **lama** di dalam
`NumeriaGame.tsx` — dua baris edit dari Patch 55 belum dijalankan.

Selama ini belum dilakukan, karakter di Numeria akan **selalu** berbeda
dari karakter di Ekspedisi.

### Langkah 1 — tambahkan impor di bagian atas

```tsx
import BridgeWalker from './BridgeWalker';
```

### Langkah 2 — cari baris ini di dalam `BridgeScene`

```tsx
<Walker crossing={crossing} span={span} />
```

Ganti menjadi:

```tsx
<BridgeWalker crossing={crossing} span={span} />
```

### Langkah 3 — hapus fungsi `Walker` lama

Cari blok `function Walker({ crossing, span }: {` dan hapus seluruh
fungsinya. Kalau dibiarkan, build akan mengeluh *"Walker is declared but
never used"*.

**`BridgeWalker.tsx` ada di paket Patch 55**, bukan di patch ini.

---

## Cara memasang

```powershell
npm run build
npm run dev
```

Muat ulang paksa (`Ctrl+Shift+R`).

**Untuk menguji layar pilih karakter**, hapus dulu pilihan lama:

```js
localStorage.removeItem('brightoria.identity.v1'); location.reload();
```

---

## Checklist uji

**Karakter halus:**

- [ ] Sudut badan, kepala, lengan **membulat**, tidak tajam
- [ ] Permukaan bergradasi lembut, bukan sisi berwarna rata
- [ ] **Peci pendek & lebar**, tepinya membulat
- [ ] Peci terlihat **menyatu** dengan rambut, bukan bertengger
- [ ] Rambut punya **poni** di dahi dan cambang di sisi
- [ ] Hijab: tudung, bingkai wajah, juntai, pita — semua membulat

**Nama:**

- [ ] Layar pilih karakter punya kolom nama
- [ ] Judul berubah jadi "Halo, {nama}!" saat mengetik
- [ ] Penghitung `0/14` bekerja
- [ ] Ketik emoji/simbol aneh → tidak muncul, **tanpa pesan galat**
- [ ] Kosongkan nama → tetap bisa "Mulai petualangan"
- [ ] Lencana nama muncul di header
- [ ] Ketuk lencana → layar pilih terbuka lagi
- [ ] Muat ulang halaman → nama **masih ada**

**Regresi:**

- [ ] Ekspedisi: karakter & Aira normal, tidak ada yang berwajah
- [ ] Aira tetap hijab biru langit, membawa buku
- [ ] Tidak ada yang membeku
- [ ] Peta dunia normal

---

## Hasil verifikasi

| Pemeriksaan | Hasil |
|---|---|
| Keseimbangan kurung, 6 berkas | ✅ Seimbang |
| Import menganggur | ✅ Nol |
| `flatShading` di kode karakter | ✅ **0** (5 kemunculan semuanya komentar) |
| `RoundedBox` terpakai | ✅ 52 titik |
| `MutationObserver` di modul baru | ✅ **0** (4 kemunculan semuanya komentar) |

**Belum bisa saya verifikasi:** `npm run build` — `node_modules` tidak
tersedia di lingkungan kerja saya.

### Catatan soal alat verifikasi

Pemeriksa sintaks saya melaporkan `identity.ts` tidak seimbang. Setelah
ditelusuri itu **positif palsu**: regex `/[^\p{L}\p{N} '-]/gu` memuat
apostrof, dan pemeriksa mengiranya awal string.

Ini kedua kalinya pemeriksa saya tersandung regex. Saya laporkan supaya
Anda tahu batas keandalannya — bukan untuk menutupi.
