# Cara Pasang Patch 31 — English Harbor: "Pelabuhan Kata" (3D Puzzle-Adventure)

## Menjawab pertanyaan Anda: "peningkatan 3D-nya dimana, di gameplay apa?"

**Klarifikasi jujur soal Patch 29**: itu bukan scene 3D baru, melainkan efek CSS tilt/tekan dekoratif pada kartu 2D yang sudah ada di semua dunia. Sebelum patch ini, **hanya Pulau Numeria** yang punya gameplay 3D sungguhan (scene Three.js, klik balok jembatan).

**Patch 31 membawa 3D sungguhan KEDUA** — English Harbor sekarang punya scene Three.js nyata: kubus huruf mengambang di ruang 3D (bisa diputar dengan drag), anak mengklik huruf secara berurutan untuk menyusun kata Bahasa Inggris.

## Konsep: Puzzle + Adventure sesuai permintaan Anda

```
ADVENTURE: Peta 12 pulau bertema pelabuhan, progresi terkunci berurutan
PUZZLE 3D: Kubus huruf mengambang (termasuk huruf JEBAKAN/decoy) di scene
           3D — klik berurutan sesuai ejaan kata, HUD menampilkan progres
           ("C _ _" → "CA_" → "CAT")
BONUS:     Animasi kapal ⛵ "berlayar" merayakan setiap kata yang berhasil
           disusun sebelum masuk ke layar hasil
```

12 kata (CAT, SUN, DOG, SHIP, FISH, BOOK, TREE, STAR, DUCK, KITE, BIRD, MOON) diurutkan dari 3 huruf ke 4 huruf untuk kurva kesulitan landai.

## ⚠️ Catatan jujur — WAJIB dibaca

1. **Tidak ada buku sumber untuk Bahasa Inggris** (berbeda dari Oasis Bahasa Arab/Taman Al-Qur'an yang berbasis PDF asli Anda). 12 kata ini **draft AI murni** — wajib direview guru Bahasa Inggris sebelum dipakai siswa sungguhan, termasuk kesesuaian dengan buku ajar resmi Bright Academy jika ada.
2. **Tombol "Dengarkan" jauh lebih andal** ketimbang di Bahasa Arab — suara Inggris hampir pasti tersedia di semua perangkat modern.
3. **Saya tidak punya visibilitas ke `App.tsx` Anda** — file `levels.ts` sengaja mengekspor 3 alias sekaligus (`englishLevels`, `curriculum`, `islands`) untuk memaksimalkan kompatibilitas dengan kontrak yang mungkin dibutuhkan App.tsx (mengikuti pola yang terbukti untuk Bahasa Arab). **Jika muncul error build, kirimkan pesan errornya** — sudah terbukti cepat diperbaiki berkali-kali sebelumnya.
4. **Tidak ada dependency baru** — Three.js/React Three Fiber/drei sudah terpasang sejak Pulau Numeria.

## File yang ditambahkan/ditimpa

```
src/game/english/EnglishGame.tsx   -> TIMPA (path sama seperti komponen lama)
src/game/english/curriculum.ts     -> BARU (12 kata)
src/game/english/evidence.ts       -> BARU/TIMPA (pelacakan progres)
src/game/english/levels.ts         -> BARU/TIMPA (alias untuk App.tsx)
src/game/english/englishTts.ts     -> BARU (pelafalan suara)
```

## Langkah pemasangan

1. `Ctrl+C` hentikan `npm run dev`.
2. Timpa/tambahkan 5 file di atas ke `src/game/english/`.
3. Jalankan:
   ```powershell
   npm run typecheck
   npm run build
   npm run dev
   ```
4. **Hard refresh**: `Ctrl+Shift+R`.

## Uji coba

1. Klik Pulau English Harbor → Mainkan sekarang.
2. Peta menampilkan **12 pulau** bertema biru-emas — hanya Pulau 1 (CAT) yang terbuka.
3. Klik Pulau 1 → layar pembuka menampilkan emoji 🐱, blank "_ _ _", arti "kucing", tombol Dengarkan (jika tersedia).
4. Klik "Mulai berlayar!" → **scene 3D terbuka**: kubus-kubus huruf mengambang di lautan.
5. **Drag untuk memutar kamera** — pastikan bisa melihat huruf dari sudut berbeda.
6. Klik huruf **C** dulu → kubus jadi hijau, HUD di atas berubah jadi "C _ _".
7. Lanjutkan **A**, lalu **T** → saat lengkap, **kapal ⛵ berlayar melintasi layar**, lalu masuk ke layar hasil dengan bintang.
8. Coba klik huruf **jebakan** (bukan bagian dari kata) → kubus bergetar merah sesaat, dicatat sebagai kesalahan (tanpa penalti, bisa lanjut coba lagi).
9. Kembali ke peta → Pulau 2 terbuka.
10. Klik **Peti** di pojok kanan atas → semua kata yang berhasil disusun tersimpan sebagai harta karun.

## Jika ada error saat build

Kirimkan pesan error TypeScript lengkap — kemungkinan besar soal nama ekspor yang dibutuhkan App.tsx untuk dunia `english`, dan sudah terbukti bisa diperbaiki cepat begitu saya tahu kontrak persisnya dari pesan error (lihat riwayat Patch 20 untuk Oasis Bahasa Arab).

## Status keseluruhan dunia setelah patch ini

Dengan ini, **SEMUA 6 dunia sekarang punya gameplay unik**:
```
Numeria   -> 3D jembatan pecahan (Three.js)
Digital   -> Sortir kartu situasi aman/tidak
Arabic    -> Belajar kartu -> Kuis -> Cocokkan (ujian akhir)
Adab      -> Cerita bercabang (pilih tindakan, lihat konsekuensi)
Quran     -> Drag-garis mencocokkan huruf Hijaiyah (dengan tutorial)
English   -> 3D puzzle susun huruf + peta petualangan pelabuhan (BARU)
```
