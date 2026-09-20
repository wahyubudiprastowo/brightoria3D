# Patch 55 — Karakter konsisten, tanpa wajah, dengan pilihan gender

**Sifat patch:** fitur baru + konsistensi visual. Tanpa dependency baru.

---

## Keputusan yang Anda ambil

| No | Keputusan | Hasil |
|---|---|---|
| 1 | **A — Faceless** | Wajah dihapus sepenuhnya dari semua karakter |
| 2 | Muslim sebagai bawaan, **arsitektur terbuka** | Busana dipisah dari gender |
| 3 | **Ya** — Aira ikut berubah | Hijab biru langit, dibedakan dari anak |

---

## 1. Faceless — dan konsekuensinya

`makeFaceTexture()` dan `headMaterials` **dihapus total**. Kepala kini
satu kotak polos dengan warna kulit pilihan anak.

**Kenapa ini benar:** wajah kosong membuat anak dari latar mana pun bisa
memproyeksikan dirinya. Begitu kita menggambar mata dan senyum tertentu,
karakter itu menjadi "seseorang yang lain".

**Konsekuensi teknis yang penting:** seluruh ekspresi kini harus
disampaikan lewat **bahasa tubuh** — melambai, menunduk membaca,
memantul saat gembira. Jadi animasi di `BlockyCharacter.tsx` menjadi
**lebih** penting setelah wajah dihapus, bukan kurang.

Keuntungan sampingan: tidak ada lagi `CanvasTexture` yang perlu dibuat
dan dibuang.

---

## 2. Gender dipisah dari busana — ini disengaja

Sekilas keduanya terlihat satu hal: laki-laki memakai peci, perempuan
memakai hijab. Tapi menyatukannya akan **mengunci arsitektur**.

```
identity.ts   OutfitId    = 'muslim-boy' | 'muslim-girl'     <- bisa dipilih anak
outfits.tsx   AnyOutfitId = OutfitId | 'muslim-guide'        <- termasuk NPC
```

Menambah set busana ketiga nanti — seragam sekolah, atau busana netral
untuk pasar lebih luas — cukup menambah **satu entri data** di
`OUTFITS`, tanpa menyentuh satu baris pun kode karakter.

**Busana Aira sudah membuktikannya.** `'muslim-guide'` ditambahkan
dengan cara itu persis, dan ia tidak pernah bisa muncul di layar
pemilih karena bukan bagian dari `OutfitId`.

### Isi busana

| Busana | Kepala | Badan | Kaki |
|---|---|---|---|
| **muslim-boy** | Peci (silinder 8 sisi) | Koko + placket + 3 kancing + kerah | Celana |
| **muslim-girl** | Hijab + juntai + pita | Gamis mengembang + pita hem | Tertutup rok |
| **muslim-guide** | Hijab **biru langit** | Gamis biru muda | Tertutup rok |

Hijab dibangun dari empat bagian: tudung, bingkai wajah, juntai bahu &
punggung, dan pita kecil di sisi kanan — sesuai referensi.

---

## 3. Aira dibedakan dengan sengaja

Aira memakai hijab **biru langit**, bukan taupe seperti busana anak.
Warna kulitnya juga **dikunci**, tidak mengikuti pilihan anak.

Alasannya: Aira harus terbaca sekeluarga dengan dunia ini, tapi jelas
**bukan "aku"**. Anak perlu bisa membedakan dirinya dari NPC dalam
sekejap.

---

## 4. Layar pilih karakter

Muncul **sekali** saat anak pertama membuka aplikasi, ditunda 450ms agar
ia sempat melihat peta dulu — jadi ia tahu sedang masuk ke mana.

- Pratinjau **3D sungguhan** yang berputar 360°, memakai komponen yang
  sama persis dengan yang nanti dimainkan
- Pilih gender (laki-laki / perempuan)
- Pilih **4 nada kulit**
- Tersimpan di `localStorage`

**Kenapa pratinjau 3D, bukan gambar:** anak harus melihat persis
karakter yang nanti ia mainkan. Pratinjau yang berbeda dari hasil akhir
adalah janji yang diingkari — dan anak 6-12 sangat peka terhadap itu.

### Membuka ulang dari Ruang Orang Tua

```js
window.dispatchEvent(new Event('brightoria:open-character-picker'))
```

### Catatan keamanan

Modul ini memasang dirinya sendiri **tapi sengaja tidak memakai
MutationObserver** — pelajaran dari bug pembekuan di Patch 53. Ia muncul
sekali lalu selesai. Tidak ada tombol mengambang, tidak ada pemantauan
DOM.

---

## File dalam patch ini

```
src/game/identity.ts                        (BARU — penyimpan pilihan)
src/components/world3d/outfits.tsx          (BARU — data & komponen busana)
src/components/world3d/BlockyCharacter.tsx  (TIMPA — faceless + busana)
src/game/CharacterPicker.tsx                (BARU — layar pilih)
src/game/expedition/NpcAira.tsx             (TIMPA — busana pemandu)
src/game/numeria/BridgeWalker.tsx           (BARU — penjelajah jembatan)
src/main.tsx                                (TIMPA — + CharacterPicker)
```

---

## ⚠️ Satu langkah manual: NumeriaGame.tsx

**Saya sengaja TIDAK menyertakan `NumeriaGame.tsx` di patch ini.**

Alasannya jujur: folder kerja Patch 54 sudah terhapus dari lingkungan
saya, dan ZIP yang Anda unggah masih versi **sebelum** Patch 54.
Menimpanya secara buta berisiko menghapus seluruh Patch 54.

Jadi saya pisahkan penjelajahnya ke berkas sendiri, dan Anda cukup
mengubah **dua baris**.

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

### Langkah 3 — hapus komponen `Walker` lama

Cari blok yang diawali `function Walker({ crossing, span }: {` dan hapus
seluruh fungsinya. Kalau dibiarkan, build akan mengeluh "Walker is
declared but never used".

**Kalau Anda belum memasang Patch 54:** lewati langkah 2 dan 3 — cukup
pasang berkas-berkas Patch 55 ini. `BridgeWalker.tsx` akan menunggu
sampai Numeria versi baru dipakai.

---

## Cara memasang

```powershell
npm run build
npm run dev
```

Lalu muat ulang paksa (`Ctrl+Shift+R`).

**Untuk menguji layar pilih karakter**, hapus dulu pilihan lama di
Console (F12):

```js
localStorage.removeItem('brightoria.identity.v1'); location.reload();
```

---

## Checklist uji

**Layar pilih karakter:**

- [ ] Muncul otomatis saat pertama kali (setelah localStorage dihapus)
- [ ] Pratinjau 3D **berputar 360°**
- [ ] Pilih Perempuan → karakter memakai **hijab & gamis**
- [ ] Pilih Laki-laki → karakter memakai **peci & koko**
- [ ] Empat nada kulit bisa dipilih, pratinjau langsung berubah
- [ ] Tekan "Mulai petualangan" → layar tertutup
- [ ] Muat ulang halaman → **tidak muncul lagi**

**Konsistensi karakter:**

- [ ] Buka Ekspedisi → penjelajah memakai busana yang dipilih
- [ ] Buka Numeria → penjelajah jembatan **sama persis** (setelah 2 baris edit)
- [ ] **Tidak ada karakter yang punya wajah**
- [ ] Aira memakai hijab **biru langit**, jelas beda dari anak
- [ ] Aira tetap membawa buku dan melambai

**Gerak (penting setelah wajah hilang):**

- [ ] Karakter melambai saat diam di pratinjau
- [ ] Aira menunduk saat membaca
- [ ] Penjelajah mengayun kaki saat berjalan
- [ ] Langkah **memendek** saat mendekati ujung jembatan

**Regresi:**

- [ ] Peta dunia normal
- [ ] Tiga game latihan berjalan
- [ ] Tidak ada yang membeku

---

## Hasil verifikasi

| Pemeriksaan | Hasil |
|---|---|
| Keseimbangan kurung, 7 berkas | ✅ Semua seimbang |
| Import menganggur | ✅ Nol temuan |
| Sisa kode wajah | ✅ 0 rujukan |
| Busana Aira dibedakan | ✅ Terpasang |
| MutationObserver di modul baru | ✅ Tidak ada |

**Belum bisa saya verifikasi:** `npm run build` — `node_modules` tidak
tersedia di lingkungan kerja saya.
