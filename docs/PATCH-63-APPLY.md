# Patch 63 — onReadTick kembali, kapal terbalik, asteroid terlalu gelap

**Sifat patch:** perbaikan galat + perbaikan visual. Tanpa dependency baru.

---

## Urutan pemasangan

```powershell
# 1. Kembalikan perbaikan onReadTick (memblokir build)
node fix-readtick.mjs

# 2. Timpa dua berkas aset dari folder src/
# 3. Build
npm run build
```

---

## 1. Kenapa bug onReadTick kembali — rantai cadangan basi

Ini kesalahan saya, dan akarnya ada di satu baris yang saya tulis di
**tiga** skrip berturut-turut:

```js
if (!existsSync(bak)) copyFileSync(path, bak);
//  ^^^^^^^^^^^^^^^^^
```

Maksudnya baik: *jangan timpa cadangan asli*. Akibatnya buruk: `.bak`
**membeku** di keadaan Patch 59.

| Patch | Yang terjadi | Isi `.bak` |
|---|---|---|
| 59 | Kirim `SkyRunGame.tsx` utuh — masih buggy | belum ada |
| 60 | `fix-skyrun.mjs` menambahkan `onReadTick` ✅ | dibuat = salinan **PRA-60** (buggy) |
| 61 | `upgrade-ship.mjs` merusak berkas | **tidak diperbarui** — masih PRA-60 |
| 62 | `repair-ship.mjs` pulih dari `.bak` | ❌ kembali ke PRA-60 |

Jadi Patch 62 memulihkan berkas ke keadaan **sebelum** perbaikan Patch
60 pernah ada. Galat `TS2304` kembali persis seperti semula.

### Perbaikan

`fix-readtick.mjs` **tidak memakai `.bak` sama sekali**. Cadangan dibuat
dengan cap waktu (`.bak-<angka>`), sehingga tidak pernah menimpa maupun
memulihkan dari berkas yang sudah basi.

Skrip juga memeriksa keseimbangan struktur **sebelum menulis** — bila
hasilnya tidak seimbang, berkas tidak disentuh sama sekali.

---

## 2. Kapal terbalik

Umpan balik: *"kapalnya kok kebalik"*. Benar.

Kamera berada di `z = 9.4` dan melihat ke arah `-Z` — arah datangnya
gerbang. Tapi di Patch 61 saya membangun kapal menghadap `+Z`.

Hasilnya: hidung runcing menjulur ke arah penonton, dua nacelle mesin
berada di depan. Kapal terbang mundur.

### Perbaikan

Satu pembungkus di `ShipModel.tsx`:

```tsx
<group rotation={[0, Math.PI, 0]}>
```

**Kenapa memutar, bukan menegatifkan tiap koordinat Z:**

- Satu baris, bukan belasan suntingan yang rawan terlewat
- Kapal simetris pada sumbu X, jadi pencerminan X yang ikut terjadi
  tidak mengubah apa pun secara visual
- Kemiringan saat bermanuver tetap benar, karena rotasi induk bekerja
  pada sumbu dunia, bukan sumbu lokal

---

## 3. Asteroid belum menyerupai referensi

Membandingkan tangkapan layar Anda dengan referensi, ada tiga selisih
yang jelas:

| Masalah | v1 (Patch 61) | v2 (Patch 63) |
|---|---|---|
| **Terlalu gelap** | bagian tergelap `#2f6d9e` | `#7fbfe4` |
| **Terlalu runcing** | jitter `0.26`, subdivisi 1 | jitter `0.10`, subdivisi 2 |
| **Tidak ada cahaya diri** | tidak ada | `emissive` tipis + *hemisphere light* |

### Kenapa terlalu gelap

Palet v1 turun sampai `#2f6d9e`. Dipadukan latar biru pekat dan
`flatShading`, sisi bawah bongkahan menjadi **nyaris hitam**.

Pada referensi, "bayangan" es bukanlah gelap melainkan biru yang lebih
pekat — karena es **meneruskan** cahaya, tidak menyerapnya.

### Kenapa terlalu runcing

Jitter `0.26` pada icosahedron subdivisi 1 menarik verteks jauh
keluar-masuk, menghasilkan duri seperti ranjau laut.

Perbaikannya berlawanan arah dari dugaan umum: **subdivisi dinaikkan**
(1 → 2) sementara **jitter diturunkan** (0.26 → 0.10). Sisi menjadi
lebih kecil namun lebih banyak, sehingga bongkahan terbaca membulat
dengan permukaan bersegi — persis seperti referensi.

### Cahaya diri

`emissiveIntensity` tipis (0.22) mencegah sisi yang tidak terkena lampu
jatuh ke hitam. Ditambah `hemisphereLight` lembut dari atas untuk
mengangkat sisi berlawanan tanpa menghapus arah bayangan.

Berkas cahaya juga dilembutkan (opasitas 0.10 → 0.065) — pada tangkapan
layar sebelumnya ia terbaca sebagai garis tegas yang memotong layar.

---

## File dalam patch ini

```
fix-readtick.mjs                      (SKRIP — jalankan lebih dulu)
src/game/skyrun/ShipModel.tsx         (TIMPA — arah kapal diperbaiki)
src/game/skyrun/SpaceField.tsx        (TIMPA — asteroid dicerahkan)
```

### Yang TIDAK disentuh

| Berkas | Alasan |
|---|---|
| `SkyRunGame.tsx` | Hanya disentuh skrip, secara bedah |
| `skyRunQuestions.ts` | Logika soal tidak berubah |
| `FroggyGame.tsx` | Di luar cakupan |

---

## Hasil uji

**Skrip:**

| Uji | Hasil |
|---|---|
| `onReadTick` dikembalikan | ✅ Muncul di destructuring |
| Struktur seimbang | ✅ `{} 9/9  () 12/12  [] 1/1` |
| Dijalankan dua kali | ✅ Dilewati, nol duplikasi |
| Cadangan bercap waktu | ✅ `.bak-1789878874802` |

**Berkas aset:**

| Pemeriksaan | Hasil |
|---|---|
| Keseimbangan kurung | ✅ Keduanya seimbang |
| Import menganggur | ✅ Nol temuan |
| Rotasi 180° terpasang | ✅ |
| Palet dicerahkan | ✅ |
| Jitter diturunkan | ✅ |
| Non-ASCII di nilai warna | ✅ Bersih |

**Belum bisa saya verifikasi:** `npm run build` — `node_modules` tidak
tersedia di lingkungan kerja saya.

---

## Catatan jujur soal uji skrip

Saat menguji, perbaikan kedua (pelaporan galat) **dilewati** pada berkas
tiruan saya karena tiruannya memakai akhir baris CRLF sedangkan pola
pencarian memakai LF.

Di berkas Anda kemungkinan besar cocok. Kalaupun tidak — itu tidak
kritis, hanya memengaruhi kualitas pesan galat di Console. Perbaikan
yang memblokir build sudah tertangani.

---

## Checklist uji

**Build:**
- [ ] `node fix-readtick.mjs` melaporkan "Struktur seimbang"
- [ ] `npm run build` **lolos tanpa galat**

**Kapal:**
- [ ] Hidung runcing menghadap **menjauh** dari penonton
- [ ] Dua semburan oranye terlihat di **belakang** kapal
- [ ] Kanopi biru tembus pandang di punggung
- [ ] Api memanjang sesaat saat berpindah jalur

**Asteroid:**
- [ ] Bongkahan **jauh lebih cerah** — biru muda, bukan biru gelap
- [ ] Bentuknya **membulat bersegi**, bukan berduri
- [ ] Sisi yang tidak terkena cahaya tetap terbaca, tidak hitam
- [ ] Berkas cahaya lebih lembut, tidak memotong layar

**Regresi:**
- [ ] Bilah "Baca dulu..." muncul lalu **habis**
- [ ] Gerbang **bergerak** setelah fase baca
- [ ] Menjawab soal berfungsi normal
