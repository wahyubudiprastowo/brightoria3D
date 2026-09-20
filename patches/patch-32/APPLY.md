# Cara Pasang Patch 32 — Atmosfer 3D Sinematik + UI Kids-Friendly

## Menjawab permintaan Anda

Anda minta: gameplay & UI Three.js lebih *exciting*, lebih kids-friendly, **tapi jangan merusak yang sudah ada**. Patch ini dirancang persis untuk itu.

## Soal repo referensi (kejujuran penting)

Repo **Skills** milik Meng To yang Anda kirim ternyata berisi *playbook* Markdown untuk AI agent — termasuk skill Three.js: `threejs-landscape`, `threejs-weather`, `threejs-towers`, serta skill rendering untuk **sky rays**, **sky background**, **falling leaves**, dan **Retina 200%**.

**Batasan jujur**: saya hanya bisa membaca README/daftar skill-nya, **tidak bisa mengunduh isi tiap SKILL.md**. Jadi kode di patch ini **bukan salinan** dari repo tersebut, melainkan implementasi mandiri dari **prinsip** yang tersirat dari nama-nama skill itu.

## Yang ditingkatkan

### 1. Atmosfer 3D berlapis di English Harbor (file baru `harborScene.tsx`)

| Prinsip dari Skills | Implementasi di sini |
|---|---|
| Sky background | Kubah langit gradien 3 warna (biru laut → biru langit → keemasan) |
| Sky rays | 5 berkas cahaya matahari miring yang bergerak & berdenyut pelan |
| Falling leaves | Diadaptasi jadi **gelembung laut naik** (sesuai tema pelabuhan) |
| Retina 200% | `dpr={[1, 2]}` — naik dari `[1, 1.5]`, render jauh lebih tajam |

Plus: bidang air beriak di bawah kubus huruf, kamera auto-rotate sinematik sangat pelan (berhenti otomatis saat pemain menggeser), dan huruf yang sudah tersusun melayang naik + berputar lebih cepat sebagai perayaan mikro.

**Semua prosedural** — tidak ada file gambar/HDR eksternal. Ini mengikuti pelajaran keras dari Patch 03 (`<Environment>` drei pernah bikin scene macet blank) dan Patch 15 (background berbasis file berulang kali gagal tampil).

### 2. Kids-Friendly UI Kit global (file baru `kidsUi.ts`)

Berlaku otomatis ke **semua dunia** sekaligus:
- Tombol utama **min 52px** (54px di HP) — jari anak kurang presisi
- Sudut jauh lebih bulat (border-radius 18-30px)
- Font lebih besar & tebal, judul 22px
- Border lebih tebal, bayangan hangat berwarna (bukan abu-abu netral)
- Tombol tutup (X) diperbesar jadi 42px
- Progress bar lebih tebal (14px) sebagai reward visual

## ⚠️ Jaminan "tidak merusak yang sudah ada"

`kidsUi.ts` bekerja **murni aditif**:
- Tidak mengimpor/mengubah satu pun file game yang sudah ada
- Hanya menyuntikkan satu `<style>` ke `<head>`
- **Tidak menyentuh properti `transform`** (dipakai `juice3d.ts` untuk tilt) maupun `animation` pada class status (`.correct`, `.wrong`, `.matched`) — mencegah "perang properti" antar-modul
- Selector yang tidak ada di DOM cukup diabaikan browser, tanpa error

## File dalam patch ini

```
src/game/kidsUi.ts                    -> BARU (UI kit global)
src/game/english/harborScene.tsx      -> BARU (atmosfer 3D)
src/game/english/EnglishGame.tsx      -> TIMPA (integrasi atmosfer + Retina)
src/game/english/curriculum.ts        -> TIMPA (tidak berubah, dibangun ulang)
src/game/english/evidence.ts          -> TIMPA (tidak berubah, dibangun ulang)
src/game/english/levels.ts            -> TIMPA (tidak berubah, dibangun ulang)
src/game/english/englishTts.ts        -> TIMPA (tidak berubah, dibangun ulang)
```

## Langkah pemasangan

1. `Ctrl+C` hentikan `npm run dev`.
2. Salin semua file di atas ke path yang sama di proyek Anda.
3. **Tambahkan satu baris** di `src/main.tsx` (dekat import lain):
   ```typescript
   import './game/kidsUi';
   ```
   Jika Anda sudah menambahkan `import './game/juice3d';` dari Patch 29, taruh baris baru ini tepat di bawahnya.
4. Jalankan:
   ```powershell
   npm run typecheck
   npm run build
   npm run dev
   ```
5. **Hard refresh**: `Ctrl+Shift+R`.

## Uji coba

**Atmosfer 3D (English Harbor):**
1. Buka English Harbor → Pulau 1 → "Mulai berlayar!"
2. Perhatikan: langit bergradasi, **berkas cahaya matahari** miring bergerak pelan di latar, **gelembung** naik dari bawah, permukaan air beriak
3. Diamkan sejenak — kamera **berputar sendiri sangat pelan** (sinematik)
4. Geser layar — auto-rotate berhenti, kontrol kembali ke Anda
5. Klik huruf yang benar — kubusnya **melayang naik + berputar lebih cepat**
6. Teks pada kubus harus terlihat **lebih tajam** dari sebelumnya (Retina)

**UI kids-friendly (semua dunia):**
7. Buka dunia mana pun — tombol terasa lebih besar & bulat, font lebih tebal, sudut panel lebih membulat
8. Coba di HP — tombol utama makin besar (54px), opsi jawaban 64px
9. Pastikan **semua game lama tetap berfungsi normal** (Numeria, Digital, Adab, Arabic, Quran)

## Jika ada yang terasa berlebihan

Semua angka terpusat di `kidsUi.ts` (ukuran tombol, radius, font) dan `harborScene.tsx` (jumlah sky rays, gelembung, kecepatan). Beri tahu bagian mana yang ingin disesuaikan.

## Jika ada error saat build

Kirimkan pesan error TypeScript lengkap — polanya sudah terbukti cepat diperbaiki.
