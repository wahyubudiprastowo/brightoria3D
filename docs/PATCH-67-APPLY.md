# Patch 67 — Perbaikan urutan deklarasi (TS2448)

**Sifat patch:** perbaikan galat kritis. Satu skrip, tanpa berkas baru.

---

## Cara memakai

```powershell
node fix-lock-order.mjs
npm run build
```

---

## Satu bug, dua gejala — dan ini kesalahan saya

Skrip Patch 66 menyisipkan pendengar tombol tembak tepat **sebelum**
`const setLane`. Saya mengira `setLane` datang sesudah `handleCross`.
Ternyata sebaliknya:

```
~1000  const setLane     = useCallback(...)   <- saya sisip di sini
~1015  const steer       = useCallback(...)
 1028  const handleCross = useCallback(...)   <- baru ada di sini
```

### Gejala 1 — build gagal

```
TS2448: Block-scoped variable 'handleCross' used before its declaration
```

### Gejala 2 — permainan mati total, semua efek hilang

Ini yang lebih penting, dan menjelaskan keluhan Anda.

`const` berada di **Temporal Dead Zone** sampai barisnya dieksekusi.
Badan komponen React berjalan dari atas ke bawah, jadi baris:

```tsx
}, [phase, handleCross]);
```

membaca `handleCross` **saat render**, sebelum ia ada. Hasilnya
`ReferenceError` dilempar di tengah render — dan seluruh komponen
`SkyRunGame` runtuh.

Dev server tidak memeriksa tipe, jadi galat ini baru terlihat saat
permainan dibuka, bukan saat `npm run dev` dijalankan.

---

## Perbaikan

Blok dipindahkan ke **sesudah** `handleCross` selesai dideklarasikan.

Batas akhir `handleCross` dicari dengan **menghitung tanda kurung**,
bukan mencocokkan teks. Penghitungan tidak bergantung pada spasi,
indentasi, maupun akhir baris CRLF Windows — pelajaran dari Patch 58
dan 62, di mana pencocokan teks yang kaku berulang kali gagal di mesin
Anda.

Tanda kurung di dalam string dan komentar diabaikan. Tanpa itu, sebuah
string berisi `(` akan mengacaukan perhitungan.

### Jaring pengaman baru

Skrip ini memeriksa **urutan** sebelum menulis:

```js
if (useAt < declAt) {
  // urutan masih salah -> berkas TIDAK ditulis
}
```

Itu tepat menyasar jenis bug yang saya buat di Patch 66. Kalau
pemindahannya gagal, berkas Anda dibiarkan apa adanya.

---

## Hasil uji

| Uji | Hasil |
|---|---|
| Berkas CRLF, urutan salah | ✅ Diperbaiki, urutan benar |
| Kurung di dalam string | ✅ Diabaikan dengan benar |
| Struktur hasil seimbang | ✅ `{} 8/8  () 22/22  [] 5/5` |
| Dijalankan dua kali | ✅ Nol duplikasi, urutan tetap benar |
| `handleCross` tidak ada | ✅ Menolak, exit 1, **berkas tidak disentuh** |
| Pendengar belum dipasang | ✅ Menolak, exit 1 |

Dua baris terakhir penting: bila skrip tidak bisa bekerja dengan aman,
ia **berhenti** — tidak merusak lebih jauh.

---

## Bila skrip menolak

**"Pendengar tombol tembak tidak ditemukan"**
Jalankan `flow-fix.mjs` dari Patch 66 lebih dulu.

**"Deklarasi handleCross tidak ditemukan"**
Kirimkan isi `src/game/skyrun/SkyRunGame.tsx` — saya perbaiki manual.

---

## Memulihkan dari cadangan

Patch 66 membuat cadangan bercap waktu sebelum mengubah:

```powershell
dir src\game\skyrun\*.bak-*
```

Yang berakhiran `.bak-1789884088315` adalah keadaan **sebelum** Patch 66
— yaitu versi yang masih berjalan, hanya belum punya tombol tembak.

---

## Checklist uji

- [ ] `node fix-lock-order.mjs` melaporkan "Urutan benar"
- [ ] `npm run build` **lolos tanpa galat**
- [ ] Buka Penerbangan Ilmu → **efek kembali muncul**
- [ ] Kapal, asteroid, awan, semburan mesin semuanya terlihat
- [ ] Bilah "Baca dulu..." muncul lalu habis
- [ ] Gerbang **terus melaju** setelah menjawab, tidak membeku
- [ ] Tombol 🔥 Tembak! muncul dan berfungsi
- [ ] Menembak setelah fase baca → jawaban terkunci

---

## Catatan jujur

Ini patch ketiga berturut-turut yang memperbaiki kerusakan dari patch
saya sendiri (61 → 62, 66 → 67). Pola yang berulang: **skrip bedah yang
mengasumsikan struktur berkas tanpa memverifikasinya.**

Di Patch 62 saya menambahkan pemeriksaan keseimbangan kurung. Itu
menangkap kerusakan struktural — tapi **tidak** menangkap kesalahan
urutan, karena berkasnya tetap seimbang secara sintaks.

Skrip ini menambahkan pemeriksaan urutan. Tapi pelajaran yang lebih
mendasar: saya seharusnya **membaca berkas Anda** sebelum menyisipkan,
bukan menebak di mana `setLane` berada relatif terhadap `handleCross`.

Untuk perubahan berikutnya di `SkyRunGame.tsx`, saya akan minta Anda
mengirimkan berkasnya lebih dulu.
