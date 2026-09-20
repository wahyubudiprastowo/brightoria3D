# Patch 59 — Build error + waktu berpikir anak + tombol

**Sifat patch:** perbaikan kritis + penyesuaian pedagogi. Tanpa
dependency baru.

---

## Urutan pemasangan

```powershell
# 1. Perbaiki build error dulu (memblokir segalanya)
node fix-torus.mjs

# 2. Salin berkas dari folder src/
# 3. Build
npm run build
```

---

## 1. Build error TS2322 — kenapa skrip Patch 58 gagal

Skrip sebelumnya memakai regex yang menuntut `<mesh>` dan
`<torusGeometry>` berada di dua baris berurutan dengan spasi persis:

```js
/<mesh position=\{\[0, 0\.052, 0\]\}>\s*\n(\s*)<torusGeometry .../
```

Terlalu kaku. Cukup satu perbedaan — spasi, urutan atribut, atau akhir
baris **CRLF Windows** — dan pola tidak cocok. Skrip melapor `✗` tapi
Anda tidak sempat melihatnya, lalu build gagal.

### Pendekatan baru yang kokoh

`fix-torus.mjs` tidak lagi bergantung pada tata letak:

1. Cari **semua** `<...Geometry>` yang memuat `rotation=`
2. Dari tiap temuan, **mundur** cari tag `<mesh>` terdekat
3. Pindahkan `rotation` ke tag `<mesh>` itu

### Hasil uji

| Kasus | Hasil |
|---|---|
| Akhir baris CRLF Windows | ✅ Diperbaiki |
| Dijalankan dua kali | ✅ Dilewati, nol duplikat |
| `<mesh>` **sudah** punya rotation | ✅ Nilai asli dipertahankan |

Kasus ketiga penting: bila mesh sudah punya rotasi sendiri, skrip hanya
membuang rotation dari geometry — **tidak menimpa** rotasi mesh.

---

## 2. Penerbangan Ilmu terlalu cepat — angkanya membuktikan

Keluhan Anda: *"belum sempat membaca dan mencerna sudah gak kerasa
memilih"*.

Saya hitung ulang kodenya:

```
jarak gerbang  : 34,6 unit
kecepatan      : 12 unit/detik
waktu tersedia : 2,88 detik
```

Lebih buruk lagi — kabut mulai di jarak 35, jadi gerbang **lahir dalam
kabut**. Waktu yang benar-benar terbaca jelas: **2,22 detik**.

Dalam 2,22 detik anak harus:

1. Membaca aksara Arab
2. Mengingat artinya
3. Membaca tiga pilihan
4. Memutuskan
5. Menggerakkan pesawat

Itu mustahil untuk anak 6–12. Anda benar sepenuhnya.

### Perbaikan: fase baca

Gerbang kini **diam dulu** sebelum mendekat:

| | Sebelum | Sesudah |
|---|---|---|
| Fase baca | — | **2,6 detik (diam)** |
| Kecepatan | 12 | 6,5 |
| Jarak lahir | −34 (dalam kabut) | −26 (terlihat jelas) |
| Perjalanan | 2,88 s | 4,09 s |
| **Total** | **2,22 s** | **6,69 s** |

**Tiga kali lebih lama.**

Selama fase baca muncul lencana **"👀 Baca dulu..."** dengan bilah waktu
yang menyusut, dan pesawat **dikunci di tengah** — anak tidak bisa
memilih sebelum sempat memahami. Itu disengaja: tekanan waktu baru
dimulai setelah pemahaman punya kesempatan.

---

## 3. Lompat Katak terlalu sulit — masalahnya perhatian terbelah

Dari tangkapan layar Anda: soal *"Mana yang lebih besar? 2/3 vs 1/3"*.

Batang pecahan visual hanya ada di **panel kecil di atas layar**,
sedangkan pilihan ada di **papan daun di bawah**. Anak harus bolak-balik
memandang — beban perhatian terbelah (*split attention*).

Bagi anak 6–12, membandingkan 2/3 dengan 1/3 secara **abstrak** jauh
lebih sulit daripada melihat dua batang bersebelahan.

### Perbaikan

Batang pecahan kini digambar **langsung di papan daun**:

```
┌─────────────┐
│     2/3     │   <- teks digeser ke atas
│  ■ ■ □      │   <- batang visual di bawahnya
└─────────────┘
```

Papan yang labelnya berbentuk pecahan (`2/3`) otomatis mendapat batang;
papan teks biasa (`Sama besar`) tetap seperti semula.

Anak tidak perlu lagi memandang ke atas — semua informasi ada di tempat
ia melihat.

---

## 4. Tombol terasa monoton

Benar. Keempatnya memakai bentuk pil datar yang hampir identik, hanya
berbeda warna pucat. Tidak ada yang menarik mata, dan tidak ada yang
memberi tahu anak mana yang paling penting.

### Tiga prinsip perbaikan

**Hierarki, bukan seragam.** Latihan adalah tindakan harian yang paling
sering dibutuhkan — dibuat paling menonjol (emas cerah). Orang Tua
paling jarang dipakai anak — dibuat paling tenang (biru kalem). Seragam
justru membuat semuanya tak terbaca.

**Warna yang berarti, bukan dekoratif.**

| Tombol | Warna | Alasan |
|---|---|---|
| 🔁 Latihan | Emas | Tindakan harian utama |
| ✨ Tanya Bri | Ungu | Bertanya, berbincang |
| 🧭 Ekspedisi | Hijau | Menjelajah, bergerak |
| 📊 Orang Tua | Biru kalem | Pintu dewasa, bukan ajakan bermain |

**Gerak yang mengundang, bukan mengganggu.** Mengambang sangat pelan
(4–5 detik per siklus), dengan **jeda berbeda tiap tombol** supaya tidak
bergerak serempak seperti mesin. Tombol Latihan hanya **berdenyut bila
ada materi jatuh tempo** — denyut tanpa sebab akan jadi gangguan, bukan
panggilan.

Ikon emoji kini punya wadah lingkaran terang, sehingga terbaca sebagai
lencana, bukan huruf yang kebetulan bergambar.

### Kenapa CSS murni

Keempat tombol dipasang oleh modul berbeda, dan `DailyPractice.tsx`
**baru saja diperbaiki dari bug pembekuan di Patch 53**. Menyentuhnya
lagi hanya untuk urusan tampilan adalah risiko yang tidak sepadan.

`railButtons.ts` hanya menyuntik satu `<style>`. Nol manipulasi DOM,
nol MutationObserver, nol sentuhan pada modul lain.

---

## File dalam patch ini

```
fix-torus.mjs                      (SKRIP — jalankan lebih dulu)
src/game/skyrun/SkyRunGame.tsx     (TIMPA — fase baca)
src/game/froggy/FroggyGame.tsx     (TIMPA — batang di papan daun)
src/theme/railButtons.ts           (BARU — gaya 4 tombol)
src/main.tsx                       (TIMPA — + railButtons)
```

### Yang TIDAK disentuh

| Berkas | Alasan |
|---|---|
| `DailyPractice.tsx` | Baru diperbaiki dari bug beku Patch 53 |
| `AiCompanion.tsx`, `ExpeditionLauncher.tsx`, `ParentInsight.tsx` | Cukup lewat CSS |
| `styles.css` | Kebijakan file lengkap |
| `worlds.ts` | Formasi cincin sudah dua kali regresi |

---

## Checklist uji

**Build:**
- [ ] `node fix-torus.mjs` melapor `✔ 1 geometry diperbaiki`
- [ ] `npm run build` **lolos tanpa galat**
- [ ] Peci terlihat mulus, tanpa cincin tegak menembusnya

**Penerbangan Ilmu:**
- [ ] Muncul lencana **"👀 Baca dulu..."** di awal tiap soal
- [ ] Bilah waktu menyusut selama ~2,6 detik
- [ ] Pesawat **tidak bisa digerakkan** selama fase baca
- [ ] Setelah bilah habis, gerbang mulai mendekat
- [ ] Terasa **jauh lebih longgar** — ada waktu berpikir

**Lompat Katak:**
- [ ] Papan daun berlabel pecahan punya **batang visual di bawah teks**
- [ ] Papan "Sama besar" tetap teks biasa
- [ ] Tidak perlu lagi memandang ke panel atas

**Tombol:**
- [ ] Keempatnya punya **warna berbeda jelas**
- [ ] Ikon dalam lingkaran terang
- [ ] Mengambang pelan, **tidak serempak**
- [ ] Latihan **berdenyut** hanya bila ada lencana angka
- [ ] Arahkan kursor → bergeser & membesar sedikit

**Regresi:**
- [ ] Menara Latihan (Patch 57) tetap di tengah peta
- [ ] Ekspedisi normal
- [ ] Tidak ada yang membeku

---

## Hasil verifikasi

| Pemeriksaan | Hasil |
|---|---|
| Keseimbangan kurung, 4 berkas | ✅ Semua seimbang |
| Uji skrip: CRLF Windows | ✅ Lolos |
| Uji skrip: idempoten | ✅ Lolos |
| Uji skrip: mesh sudah ber-rotation | ✅ Nilai dipertahankan |
| Karakter non-ASCII di nilai warna | ✅ Nol |

**Belum bisa saya verifikasi:** `npm run build` — `node_modules` tidak
tersedia di lingkungan kerja saya.

### Catatan jujur

Saat menulis `railButtons.ts`, sebuah karakter Devanagari `६` terselip
menggantikan angka `6` pada nilai warna `#6fd0ac`. Itu akan merusak
warna tombol Ekspedisi.

Pemeriksaan non-ASCII menangkapnya sebelum dikemas, dan sudah
diperbaiki. Saya laporkan supaya Anda tahu jenis kesalahan yang bisa
lolos dari mata tapi tertangkap alat.
