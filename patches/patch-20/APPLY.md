# Cara Pasang Patch 20 — HOTFIX Build Error Patch 19

## Apa yang terjadi

Saat Anda menjalankan `npm run build` setelah memasang Patch 19, muncul
4 error TypeScript:

```
error TS2305: Module './game/arabic/levels' has no exported member 'arabicLevels'.
error TS2305: Module './game/arabic/evidence' has no exported member 'computeMastery'.
error TS2339: Property 'completed' does not exist on type 'ArabicOasisEvidence'.
error TS2339: Property 'completed' does not exist on type 'QuizEvidence | ArabicOasisEvidence'.
```

**Kabar baiknya**: pesan error ini justru **membocorkan potongan kode
`App.tsx` Anda yang sebenarnya**, sehingga sekarang saya tahu PERSIS
kontrak nama fungsi/field yang dibutuhkan — sebelumnya saya harus
menebak karena tidak punya visibilitas ke file itu.

Dari error tersebut terungkap bahwa `App.tsx` memanggil:
```typescript
import { arabicLevels } from './game/arabic/levels';
import { computeMastery as arabicMasteryFn, loadEvidence as arabicLoad } from './game/arabic/evidence';
// ...
if (rEvidence.completed.length > 0) m.arabic = arabicMasteryFn(rEvidence, arabicLevels.length);
```

Sedangkan Patch 19 saya kemarin memakai nama berbeda
(`computeOverallMastery`, field `stops` tanpa `completed` di level atas).
**Patch 20 ini memperbaiki persis ketidakcocokan tersebut** — tanpa
mengubah `App.tsx` sama sekali (App.tsx sudah benar, yang salah adalah
nama ekspor di file saya).

## Apa yang berubah dari Patch 19

Hanya **3 file kecil** yang isinya berubah (fitur/UI/konten TIDAK
berubah sama sekali dari Patch 19):

1. `evidence.ts` — fungsi `computeOverallMastery` diganti nama jadi
   `computeMastery`, dan tipe evidence sekarang punya field
   `completed: string[]` di level teratas (selain tetap punya `stops`
   dan `collectedWords` untuk fitur bintang & koleksi).
2. `levels.ts` — ditambahkan satu baris ekspor: `export const
   arabicLevels = curriculum;` (alias langsung, App.tsx hanya memakai
   `.length`-nya untuk menghitung total 17 pos).
3. `ArabicGame.tsx` — hanya baris import yang disesuaikan mengikuti
   nama baru di atas (`computeMastery`, `ArabicEvidence`). Seluruh UI,
   mekanik, dan tampilan PERSIS sama seperti Patch 19.

File `curriculum.ts`, `arabicSfx.ts`, kedua gambar, dan CSS **tidak
berubah isinya** dari Patch 19 — disertakan lengkap di zip ini supaya
Anda tidak perlu mencari-cari file mana yang perlu ditimpa ulang, cukup
timpa SEMUA file di zip ini ke folder yang sama.

## File dalam patch ini (timpa semua ke path yang sama persis)

```
src/game/arabic/ArabicGame.tsx          -> TIMPA (import diperbaiki)
src/game/arabic/evidence.ts              -> TIMPA (nama fungsi diperbaiki)
src/game/arabic/levels.ts                -> TIMPA (tambah export arabicLevels)
src/game/arabic/curriculum.ts            -> TIMPA (tidak berubah, sama seperti Patch 19)
src/game/arabic/arabicSfx.ts              -> TIMPA (tidak berubah)
public/assets/arabic/fox-explorer.webp   -> TIMPA (tidak berubah)
public/assets/arabic/backpack.webp       -> TIMPA (tidak berubah)
src/styles-arabic-oasis-addon.css        -> (jika sudah ditempel dari Patch 19,
                                              TIDAK PERLU ditempel ulang — isinya sama)
```

## Langkah pemasangan

1. `Ctrl+C` hentikan proses build/dev jika masih berjalan.
2. Timpa **seluruh 7 file** di atas ke path yang sama persis di proyek
   Anda (semua ada di dalam folder `src/game/arabic/` dan
   `public/assets/arabic/` pada zip ini).
3. **Jika Anda BELUM sempat menempelkan CSS dari Patch 19** ke
   `src/styles.css`, lakukan sekarang: salin isi
   `src/styles-arabic-oasis-addon.css`, tempel di baris paling bawah
   `src/styles.css` Anda. **Jika sudah pernah ditempel**, lewati langkah
   ini (isinya identik, tidak perlu diulang).
4. Jalankan:
   ```powershell
   npm run typecheck
   npm run build
   npm run dev
   ```
5. **Hard refresh**: `Ctrl+Shift+R`.

## Uji coba

Ikuti langkah uji coba yang sama seperti di `APPLY.md` Patch 19:

1. Klik Pulau Oasis Bahasa Arab → Mainkan sekarang.
2. Peta 17 pos muncul dengan maskot rubah di header — hanya Pos 1
   (Salam & Perkenalan) yang terbuka.
3. Klik Pos 1 → layar pembuka dengan gambar rubah besar → "Mulai
   petualangan".
4. Jawab soal dialog — dengar bunyi saat benar/salah.
5. Selesaikan pos → layar hasil dengan bintang + confetti.
6. Kembali ke peta → Pos 2 terbuka.
7. Klik tombol Koleksi → buku koleksi dengan ikon ransel emas.

## Jika `npm run build` MASIH error setelah patch ini

Kemungkinan ada pemakaian lain dari `arabicLevels`/`computeMastery`/
`ArabicEvidence` di `App.tsx` yang belum terlihat dari 4 error
sebelumnya (misalnya field lain yang diakses). Jika ini terjadi, **salin
persis pesan error baru yang muncul** dan kirimkan ke saya — pola yang
sama seperti kali ini (pesan error tsc membocorkan kontrak yang
dibutuhkan) akan langsung menunjukkan penyesuaian apa yang masih
diperlukan, tanpa perlu menebak lagi.
