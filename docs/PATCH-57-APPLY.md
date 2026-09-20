# Patch 57 — Menara Latihan di tengah peta

**Sifat patch:** fitur baru. Dua berkas, tanpa dependency baru.

---

## Kenapa menara, bukan pulau ketujuh

Anda bertanya apakah Latihan sebaiknya dibuat jadi pulau juga. Jawaban
saya tidak, dan alasannya konseptual:

> Enam pulau itu **mata pelajaran**.
> Latihan **bukan** mata pelajaran — ia lapisan pengulangan yang memakai
> materi **dari** keenamnya.

Menjadikannya pulau ketujuh menyiratkan ia subjek ketujuh. Anak akan
mengira ada tujuh hal yang harus dikuasai, padahal yang ketujuh hanyalah
cara mengulang enam yang pertama.

### Dua alasan teknis menguatkan

| Alasan | Penjelasan |
|---|---|
| **Formasi cincin rapuh** | `AGENTS.md` mencatat posisi 6 pulau di `worlds.ts` sudah **dua kali** mengalami regresi. Menambah pulau ketujuh berarti menyentuh formasi itu lagi |
| **Mastery** | Tiap pulau punya mastery %. Latihan tidak boleh punya — ia memakai materi dunia lain, jadi akan menghitung ganda. Persis bug yang diperbaiki pada Kampung Adab di Patch 54 |

---

## Tapi keluhan Anda tetap valid

Tombol 🔁 di rel kiri memang kecil dan mudah terlewat — Anda sendiri
sempat tidak menemukan AsterQuiz selama beberapa patch.

Menara ini menyelesaikan itu **tanpa berbohong soal konsep**:

| Keputusan | Alasan |
|---|---|
| Berdiri di **tengah** lingkaran pulau | Titik pertama yang dilihat mata saat peta dibuka |
| Bentuk **menara menjulang**, bukan pulau mengambang | Anak langsung tahu ini bukan dunia lain |
| **Tanpa mastery** | Hanya lencana jumlah materi jatuh tempo |
| Cincin **mengorbit** | Gerak di penglihatan tepi jauh lebih mudah tertangkap daripada objek diam |

Posisi `(0, 0, 0)` aman — pulau terdekat (Kampung Adab dan English
Harbor) berjarak **~2,79 unit**, sementara alas menara hanya berjari-jari
0,88 unit.

**`worlds.ts` tidak disentuh sama sekali.**

---

## Bentuk menara

| Bagian | Detail |
|---|---|
| Alas bertingkat | Dua cakram bersisi 8, memberi kesan berdiri kokoh |
| Badan **mengerucut** | Atas lebih sempit dari bawah — terbaca menjulang, bukan tabung |
| Tiga pita batu | Memecah badan agar tidak terbaca polos |
| Empat jendela bercahaya | Kesan ada "isi" di dalam menara |
| Mahkota bergigi | Siluet khas menara |
| Kristal ilmu berputar | Titik fokus di puncak |
| Dua cincin mengorbit | Emas & biru, arah berlawanan |
| Serpih cahaya naik | Dari puncak, daur ulang otomatis |

---

## Cara membuka panel Latihan — nol risiko

Menara ini **tidak mengimpor** `DailyPractice.tsx`. Ia cukup menekan
tombol mengambang yang sudah ada:

```ts
document.querySelector<HTMLElement>('.bdp-fab')?.click();
```

Keputusan ini disengaja. `DailyPractice.tsx` baru saja diperbaiki dari
bug pembekuan di Patch 53 — menyentuhnya lagi berisiko tanpa alasan
kuat. Dengan cara ini, berkas itu **tidak perlu diubah satu baris pun**.

Sebagai cadangan bila tombol sedang tersembunyi, menara mengirim event
`brightoria:open-practice` yang bisa ditangkap modul lain nanti.

---

## Gaya label disuntik dari komponennya sendiri

`styles.css` berlaku kebijakan **"selalu file lengkap"** — menyentuhnya
berarti menimpa seluruh isinya.

Jadi CSS label menara disuntik dari `PracticeTower.tsx` sendiri, membuat
menara menjadi satu paket mandiri yang tidak bisa merusak gaya lain.

---

## File dalam patch ini

```
src/components/world3d/PracticeTower.tsx   (BARU — menara + CSS)
src/components/WorldScene.tsx              (TIMPA — dua sisipan kecil)
```

### Yang TIDAK disentuh

| Berkas | Kenapa |
|---|---|
| `src/data/worlds.ts` | Formasi cincin sudah dua kali regresi |
| `src/game/DailyPractice.tsx` | Baru diperbaiki dari bug beku Patch 53 |
| `src/styles.css` | Kebijakan file lengkap |

### Perubahan di WorldScene.tsx

Hanya **dua sisipan**, tidak ada yang dihapus:

1. Satu baris impor setelah `import BriMascot`
2. Satu tag `<PracticeTower />` setelah `<GroundRings />`

---

## Cara memasang

```powershell
npm run build
npm run dev
```

Muat ulang paksa (`Ctrl+Shift+R`).

---

## Checklist uji

**Menara:**

- [ ] Menara emas-batu berdiri di **tengah** peta
- [ ] Bentuknya **menjulang mengerucut**, jelas beda dari pulau
- [ ] Kristal di puncak **berputar** dan memantul pelan
- [ ] Dua cincin **mengorbit** berlawanan arah
- [ ] Serpih cahaya naik dari puncak
- [ ] Label "Menara Latihan" terbaca di bawahnya

**Interaksi:**

- [ ] Arahkan kursor → menara **sedikit membesar**
- [ ] Ketuk menara → **panel Latihan terbuka**
- [ ] Ketuk label → panel Latihan terbuka
- [ ] Di dalamnya ada tiga mode

**Lencana jatuh tempo:**

- [ ] Kalau ada materi siap diulang → muncul lencana emas
- [ ] Label **berdenyut** saat ada materi jatuh tempo
- [ ] Kalau belum ada materi → lencana tidak muncul

**Regresi — ini yang paling penting:**

- [ ] **Enam pulau masih di posisi semula**
- [ ] Peta masih bisa diputar & di-zoom
- [ ] Ketuk pulau → kartu misi muncul seperti biasa
- [ ] Menara **tidak menutupi** pulau mana pun
- [ ] Tombol 🔁 di rel kiri **masih ada** (tidak digantikan)
- [ ] Tidak ada yang membeku

---

## Hasil verifikasi

| Pemeriksaan | Hasil |
|---|---|
| Keseimbangan kurung, 2 berkas | ✅ 180/180, 145/145, 52/52 · 156/156, 99/99, 46/46 |
| Import menganggur | ✅ Nol temuan |
| `worlds.ts` disentuh | ✅ Tidak |
| `DailyPractice.tsx` disentuh | ✅ Tidak |
| `styles.css` disentuh | ✅ Tidak |

**Belum bisa saya verifikasi:** `npm run build` — `node_modules` tidak
tersedia di lingkungan kerja saya.

---

## Catatan: dua langkah manual Numeria masih tertunda

Dari Patch 55, penjelajah di jembatan Numeria masih memakai komponen
`Walker` lama yang **berwajah**. Selama dua baris edit itu belum
dijalankan, karakter di Numeria akan selalu berbeda dari karakter di
Ekspedisi.

Langkahnya ada di `docs/PATCH-56-APPLY.md` bagian "PENTING".
