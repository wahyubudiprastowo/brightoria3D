# Patch 62 — Perbaikan kerusakan Patch 61

**Sifat patch:** perbaikan galat. Satu skrip, tanpa berkas baru.

---

## Cara memakai

```powershell
node repair-ship.mjs
npm run build
```

---

## Apa yang rusak — dan ini kesalahan saya

Skrip Patch 61 mencari batas fungsi dengan menghitung kurawal, dimulai
dari kurawal **pertama** setelah nama fungsi:

```js
const open = text.indexOf('{', at);
```

Untuk fungsi tanpa destructuring itu benar:

```tsx
function Clouds() {        // kurawal pertama = badan fungsi ✅
```

Tapi komponen React memakai destructuring:

```tsx
function Ship({ laneRef }: { laneRef: LaneRef }) {
//            ^^^^^^^^^^^ kurawal pertama ada DI SINI ❌
```

Jadi penghitungan dimulai dari kurawal **destructuring** dan berakhir di
kurawal penutupnya. Skrip mengira "seluruh fungsi" hanyalah
`function Ship({ laneRef }` — lalu menggantinya, dan meninggalkan sisanya
sebagai sampah:

```tsx
function Ship(...) { BADAN_BARU }: { laneRef: LaneRef }) {
  BADAN_LAMA
}
```

Itulah galat `TS1128` di baris 594 Anda.

---

## Kenapa uji saya tidak menangkapnya

Ini bagian yang paling perlu saya akui.

Uji Patch 61 hanya memeriksa **keberadaan string**:

```bash
grep -c '<ShipModel'   # → 1 ✅
grep -c 'onReadTick'   # → 2 ✅
```

Keduanya lolos — karena penggantiannya memang terjadi. Yang tidak pernah
saya periksa: apakah **hasilnya masih sah secara sintaks**.

Kerusakan struktural lolos begitu saja.

---

## Dua perbaikan

### 1. Lewati daftar parameter lebih dulu

Hitung tanda kurung dari `(` sampai pasangannya, **baru** cari kurawal
badan fungsi sesudah itu.

### 2. Periksa hasilnya sebelum menulis

Inilah jaring pengaman yang tidak ada di Patch 61. Sebelum menyimpan,
seluruh berkas diperiksa keseimbangan kurawal, kurung, dan sikunya.

**Bila tidak seimbang, berkas tidak ditulis** — dan Anda diberi tahu,
bukan dibiarkan menemukan sendiri saat build gagal.

---

## Cara kerja perbaikan

| Langkah | Tindakan |
|---|---|
| 1 | Deteksi kerusakan lewat pemeriksaan keseimbangan |
| 2 | Pulihkan dari `SkyRunGame.tsx.bak` |
| 3 | Pasang ulang dengan penghitungan yang benar |
| 4 | **Periksa hasil** sebelum menulis |

Langkah 2 penting: `.bak` dibuat Patch 61 **sebelum** merusak, jadi ia
berisi versi sehat — termasuk perbaikan `onReadTick` dari Patch 60.

---

## Hasil uji

| Uji | Hasil |
|---|---|
| Deteksi & pulihkan dari .bak | ✅ Berhasil |
| Struktur hasil seimbang | ✅ `{} 23/23  () 29/29  [] 4/4` |
| **`onReadTick` bertahan** | ✅ **2 kemunculan** |
| Sampah orphan hilang | ✅ 0 tersisa |
| Dijalankan dua kali | ✅ Dilewati, nol duplikasi |
| Kurawal di dalam string | ✅ Diabaikan benar |
| `.bak` ikut rusak | ✅ Menolak, exit 1 |
| `.bak` tidak ada | ✅ Menolak, exit 1, berkas tidak disentuh |

Dua uji terakhir penting: bila skrip tidak bisa memulihkan dengan aman,
ia **berhenti** — tidak merusak lebih jauh.

---

## Bila .bak tidak ada

Skrip akan berhenti dan memberi tahu. Tanpa cadangan, memulihkan secara
otomatis terlalu berisiko.

Kirimkan isi `src/game/skyrun/SkyRunGame.tsx` — saya perbaiki manual.

---

## Checklist uji

- [ ] `node repair-ship.mjs` melaporkan "Struktur seimbang"
- [ ] `npm run build` **lolos tanpa galat**
- [ ] Kapal baru terlihat: hidung runcing, dua mesin, kanopi tembus pandang
- [ ] Bongkahan es-biru menggantikan awan putih
- [ ] Bilah "Baca dulu..." tetap muncul lalu **habis**
- [ ] Gerbang **tetap bergerak** setelah fase baca
