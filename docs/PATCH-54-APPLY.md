# Patch 54 — Perbaikan mastery 117% + Numeria dibangun ulang

**Sifat patch:** perbaikan bug + peningkatan besar. Tanpa dependency baru,
`main.tsx` tidak perlu disentuh.

---

## Bagian 1 — Bug mastery 117% (akhirnya ketemu)

### Penyebabnya: pembagi yang salah

`App.tsx` menghitung mastery Kampung Adab memakai `adabLevels.length`:

```ts
m.adab = adabMasteryFn(aEvidence, adabLevels.length);
```

Tapi `adabLevels` adalah sisa **mesin kuis lama** yang berisi **6 soal**,
sedangkan `AdabGame` sesungguhnya melacak **8 bab cerita** di
`scenarios.ts`.

| | Nilai |
|---|---|
| Pembagi yang dipakai | 6 bab × 3 bintang = **18** |
| Bintang yang bisa dikumpulkan | 8 bab × 3 bintang = **24** |
| Mastery maksimum | 24 / 18 = **133%** |

Angka 117% yang Anda lihat pas berada di rentang itu.

### Perbaikannya, dua lapis

**1. Pembagi dibetulkan** — `App.tsx` kini mengimpor `chapters` dari
`scenarios.ts`, sumber kebenaran yang sebenarnya:

```ts
import { chapters as adabChapters } from './game/adab/scenarios';
...
m.adab = adabMasteryFn(aEvidence, adabChapters.length);
```

**2. Pembatas keras** — `adab/evidence.ts` kini membatasi hasilnya:

```ts
return Math.min(100, Math.round((earned / maxStars) * 100));
```

Lapis kedua disengaja: data lama yang sudah tersimpan di perangkat anak
tetap aman ditampilkan, apa pun isinya.

---

## Bagian 2 — Kenapa Numeria terasa membosankan

Setelah ditelusuri, Numeria sebenarnya **sudah 3D** — tapi 3D dari era
Patch 11, tertinggal empat generasi pipeline render:

| | Numeria lama | SkyRun / Froggy |
|---|---|---|
| Pencahayaan | ambient + directional manual | `CinematicRig` (ACES) |
| **Pantulan** | **TIDAK ADA** | `ProceduralEnv` (IBL) |
| Bloom / vignette | tidak ada | `Postfx` |
| Tier perangkat | tidak | `getQuality()` |
| Warna | ditulis tetap | `brightBrand` |
| Isi materi | **5 level tetap** | prosedural, tak habis |
| **Efek suara** | **TIDAK ADA** | ada |

Baris "Pantulan" paling menentukan secara visual.
`MeshStandardMaterial` adalah material berbasis fisika: `metalness` dan
`roughness` praktis **tidak berfungsi** tanpa environment map. Itulah
sebabnya papan jembatan lama terlihat seperti plastik datar.

---

## Bagian 3 — Mekanik jembatan SENGAJA dipertahankan

Menyeret papan adalah pedagogi yang **lebih kaya** daripada pilihan
ganda: anak *membangun* pecahan sebagai besaran nyata, bukan memilih
simbol.

Yang membosankan bukan mekaniknya — melainkan hanya ada lima soal yang
selalu sama. Jadi yang diperbaiki adalah **kedalaman dan rasa**, bukan
cara bermain.

### Dua mode

| Mode | Isi | Mastery |
|---|---|---|
| 🎯 **Misi Jembatan** | 5 level bawaan, berurutan | ✅ menentukan |
| ♾️ **Jembatan Tanpa Ujung** | prosedural, adaptif | ❌ hanya XP |

Mode Tanpa Ujung **tidak pernah menyentuh** `completed` — itu disengaja,
supaya mastery tidak bisa melampaui 100%. Persis bug yang baru saja
diperbaiki pada Adab.

### Empat jenis tantangan pada mekanik yang sama

| Jenis | Contoh | Melatih |
|---|---|---|
| **Bangun** | "Sambungkan 3/4" | Pemahaman dasar |
| **Senilai** | "Sambungkan 1/2, tapi ada 6 papan" | Pecahan senilai |
| **Penjumlahan** | "Sambungkan 1/4 + 2/4" | Penyebut sama |
| **Lengkapi** | "Perlu 5/6, sudah ada 2/6" | Pengurangan |

Tingkat ringan sengaja **hanya** memuat jenis Bangun — anak perlu paham
dulu bahwa pecahan berarti "sekian dari sekian" sebelum diminta mencari
pecahan senilai.

### Tingkat kesulitan dibagi dengan mode arkade

Tingkat awal dibaca dari `loadMathProgress()` — mesin yang sama dipakai
Penerbangan Ilmu dan Lompat Katak. Anak yang sudah lancar di arkade tidak
dilempar kembali ke soal termudah.

Penyesuaian selama bermain memakai aturan yang sama: dari 5 jawaban
terakhir, benar ≥4 naik, benar ≤2 turun.

---

## Bagian 4 — Yang membuatnya terasa hidup

| Unsur | Kenapa ada |
|---|---|
| **Penjelajah menyeberang** | Bukti visual keberhasilan — bukan sekadar teks "benar" |
| **Papan menggantung & bergoyang** | Terbaca belum jadi bagian jembatan |
| **Kabut jurang** | Tanpa sesuatu di bawah, papan tidak terasa menggantung di atas apa-apa |
| **Bayangan kontak** | Papan terbaca melayang, bukan menempel |
| **Kamera menyesuaikan** | Jembatan 12 papan tetap muat di layar |
| **Guratan kayu** | Memecah permukaan agar tidak terbaca balok polos |

### Efek suara — bukan musik

Proyek ini melarang musik latar secara mutlak. Yang dipakai adalah `sfx`
dari `src/game/sound.ts`: bunyi pendek hasil **sintesis Web Audio API**,
tanpa satu pun berkas audio. Tidak ada loop, tidak ada lagu.

| Kejadian | Bunyi |
|---|---|
| Ketuk papan | `sfx.click()` |
| Jembatan tersambung | `sfx.correct()` |
| Belum pas | `sfx.wrong()` |
| Naik tingkat / bintang | `sfx.star()` |
| Pulau selesai | `sfx.win()` |

---

## File dalam patch ini

```
src/App.tsx                          (TIMPA — perbaikan pembagi mastery)
src/game/adab/evidence.ts            (TIMPA — pembatas 100%)
src/game/numeria/NumeriaGame.tsx     (TIMPA — dibangun ulang)
src/game/numeria/bridgeLevels.ts     (BARU — penghasil tantangan)
```

**Tidak disentuh:** `numeria/levels.ts` dan `numeria/evidence.ts` —
keduanya kontrak yang dipakai App.tsx. Disertakan di ZIP hanya sebagai
rujukan, isinya identik dengan milik Anda.

---

## Cara memasang

```powershell
npm run build
npm run dev
```

Lalu muat ulang paksa (`Ctrl+Shift+R`).

---

## Checklist uji

**Perbaikan mastery:**

- [ ] Kampung Adab **tidak lagi** menunjukkan 117%
- [ ] Angkanya masuk akal (≤100%)
- [ ] Mastery dunia lain tidak berubah

**Numeria — tampilan:**

- [ ] Papan jembatan **memantulkan cahaya**, tidak lagi datar
- [ ] Papan belum terpasang **menggantung & bergoyang**
- [ ] Ada **kabut jurang** di bawah jembatan
- [ ] Seret layar → jembatan berputar
- [ ] Jembatan 10–12 papan tetap muat di layar

**Numeria — permainan:**

- [ ] Muncul **dua pilihan mode**
- [ ] Misi Jembatan: 5 level, mastery bertambah
- [ ] Tanpa Ujung: soal **tidak pernah habis**
- [ ] Muncul **empat jenis tantangan** berbeda
- [ ] Lencana tingkat (Ringan/Sedang/Menantang) tampil
- [ ] Benar 4 dari 5 → naik tingkat
- [ ] **Penjelajah menyeberang** saat berhasil

**Suara:**

- [ ] Ketuk papan → bunyi klik
- [ ] Benar → nada naik
- [ ] Salah → nada turun (lembut, tidak mengagetkan)
- [ ] **Tidak ada musik latar**

**Regresi:**

- [ ] Main Tanpa Ujung lama-lama → mastery **tidak** melampaui 100%
- [ ] Progres lama tetap ada
- [ ] Tiga game latihan tetap berjalan

---

## Hasil verifikasi

| Pemeriksaan | Hasil |
|---|---|
| Keseimbangan kurung, 6 berkas | ✅ Semua seimbang |
| Import menganggur | ✅ Nol temuan |
| `levels.ts` & `evidence.ts` utuh | ✅ Identik |
| `numeriaLevels` masih diekspor | ✅ Ada |
| `completed` hanya disentuh mode Misi | ✅ Ya |
| Pipeline modern terpakai | ✅ 5/5 modul |
| Panggilan SFX | ✅ 11 titik |

**Belum bisa saya verifikasi:** `npm run build` — `node_modules` tidak
tersedia di lingkungan kerja saya.

---

## Catatan jujur soal alat verifikasi saya

Saat memeriksa, pemeriksa sintaks saya melaporkan kurung tidak seimbang
di `NumeriaGame.tsx`. Setelah ditelusuri itu **positif palsu**: kode
memakai regex `/sudah ada (\d+)\//`, dan pemeriksa melihat `//` di
dalamnya lalu mengira itu awal komentar.

Tapi pemeriksaan itu justru menyingkap desain yang memang jelek — saya
menulis jumlah papan ke dalam kalimat prompt lalu memungutnya kembali
dengan regex. Mengubah satu kata di prompt akan diam-diam merusak
permainan.

Sudah diganti dengan medan `preset` eksplisit di `BridgeChallenge`.
Regex-nya hilang sepenuhnya.
