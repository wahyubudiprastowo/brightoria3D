# Patch 36 — Perbaikan 2 Error Build dari Patch 34 & 35

## Dua error, keduanya kesalahan saya

### Error 1 — `TS2339: Property 'render' does not exist`

Saya menulis tipe React root hanya sebagai `{ unmount: () => void }`, padahal React root juga punya method `render`. Muncul di `ParentInsight.tsx` (Patch 34), dan sebenarnya ada juga di `DailyPractice.tsx` (Patch 35) — hanya belum terdeteksi karena build berhenti di error pertama.

**Diperbaiki**: kedua file sekarang memakai tipe `ReactRoot` yang mencakup `render` dan `unmount`.

### Error 2 — `TS1261: differs only in casing`

Saya memberi nama dua file yang **hanya beda huruf besar-kecil**:

```
src/game/DailyPractice.tsx   <- komponen UI
src/game/dailyPractice.ts    <- mesin latihan
```

Windows (dan macOS default) tidak membedakan huruf besar-kecil pada nama berkas, jadi TypeScript menganggap keduanya berkas yang sama dan menolak.

**Diperbaiki**: mesin latihan dinamai ulang jadi `practiceEngine.ts`.

## ⚠️ Langkah WAJIB: hapus file lama

Setelah menyalin file patch ini, **hapus** berkas lama:

```
src/game/dailyPractice.ts     <- HAPUS
```

Kalau tidak dihapus, error TS1261 akan tetap muncul karena kedua berkas masih ada berdampingan.

## File dalam patch ini

```
src/game/practiceEngine.ts   -> BARU (menggantikan dailyPractice.ts)
src/game/DailyPractice.tsx   -> TIMPA (fix tipe + import baru)
src/game/ParentInsight.tsx   -> TIMPA (fix tipe)
```

`reviewDeck.ts` dan `progressHub.ts` **tidak berubah** — biarkan apa adanya.

## Langkah pemasangan

1. `Ctrl+C` hentikan `npm run dev`.
2. Salin ketiga file ke `src/game/`.
3. **Hapus** `src/game/dailyPractice.ts`.
4. Pastikan `src/main.tsx` tetap seperti ini (tidak perlu diubah):
   ```typescript
   import './game/juice3d';        // Patch 29
   import './game/kidsUi';         // Patch 32
   import './game/ParentInsight';  // Patch 34
   import './game/DailyPractice';  // Patch 35
   ```
5. Jalankan:
   ```powershell
   npm run typecheck
   npm run build
   npm run dev
   ```
6. **Hard refresh**: `Ctrl+Shift+R`.

## Uji coba

1. `npm run build` harus **selesai tanpa error**
2. Muncul tombol **"📊 Orang Tua"** di pojok kiri-bawah → klik, panel terbuka dengan data nyata
3. Muncul tombol **"🔁 Latihan"** di pojok kanan-bawah → klik, panel latihan terbuka
4. Buka game mana pun → kedua tombol otomatis hilang
5. Tutup game → kedua tombol muncul lagi

## Kalau masih ada error

Kirimkan pesan error lengkapnya. Kalau error-nya menyebut `dailyPractice.ts`, berarti langkah nomor 3 (hapus file lama) terlewat.
