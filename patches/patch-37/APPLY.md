# Patch 37 — Merapikan Cahaya Peta, Kartu Misi Responsif, dan Header

## Analisis masalah dari screenshot Anda

Empat masalah yang Anda sebutkan, semuanya berasal dari kode yang saya kirim sendiri:

### 1. Cahaya sorot mengganggu

Pada Patch 33 saya membuat `SelectionBeam` dengan ukuran yang salah:

```
coneGeometry(radius 1.25, tinggi 5.2) pada posisi y + 2.6
```

Pulau sendiri hanya berukuran **2.3 unit** — jadi kerucut itu menjulang lebih dari **dua kali tinggi pulau**, menutupi Kampung Adab, dan ujung atasnya terpotong tajam di batas kamera. Hasilnya terlihat seperti sorotan lampu panggung.

**Perbaikan**: kerucut dihapus total, diganti `SelectionGlow` dengan tiga lapisan yang semuanya berada **di bawah atau di sekitar pulau**:
- Cincin cahaya horizontal tipis sebagai alas bercahaya, berputar pelan
- Glow lembut kecil tepat di bawah pulau
- Lima partikel naik pelan mengelilingi pulau

Tidak ada lagi elemen yang menjulang ke langit.

### 2. Aura pulau tampak "cincin ganda" kasar

Aura dan cincin pencapaian punya opacity terlalu tinggi (0.5 dan 0.35) dengan ukuran hampir sama (2.7 vs 2.95), sehingga bertumpuk dan tepinya keras.

**Perbaikan**:
- Opacity diturunkan drastis (aktif 0.5 → 0.26, diam 0.16 → 0.09)
- Ukuran dibedakan jelas (aura 2.5, cincin pencapaian 3.5) agar terbaca sebagai dua lapisan berbeda
- Tekstur cincin diganti dari garis tegas (`ctx.stroke`) menjadi gradien radial yang memudar ke dua arah

### 3. Label pulau saling menimpa

Penyebabnya `<Html distanceFactor={7}>` — properti ini membuat label ikut membesar mengikuti perspektif 3D. Di layar lebar label jadi besar sekali dan bertabrakan, terlihat jelas pada "Kampung Adab" yang menutupi pulaunya sendiri.

**Perbaikan**: `distanceFactor` dihapus sehingga label dirender pada ukuran piksel tetap, plus lebarnya dikunci lewat CSS (118px desktop, 100px mobile) dengan pemotongan teks dua baris.

### 4. Kartu misi tidak responsif

**Perbaikan**: tiga perilaku berbeda menurut lebar layar —

| Lebar layar | Perilaku kartu |
|---|---|
| >1100px | Panel kanan, lebar 340px, tinggi maksimum dengan scroll internal |
| 701–1100px | Panel lebih ramping (300px) agar peta tetap lapang |
| ≤700px | **Bottom sheet** selebar layar dengan pegangan geser di atas |

## Perbaikan tambahan

- **Header**: tinggi elemen diseragamkan (38px), jarak konsisten, di layar sempit subtitle disembunyikan dan ukuran mengecil bertahap
- **Bilah petunjuk peta**: dinaikkan agar tidak menutupi label "Benteng Digital", dan `pointer-events: none` supaya tidak menghalangi klik pulau
- **Tombol mengambang** (Orang Tua & Latihan): dinaikkan dari 84px ke 104px agar tidak bertabrakan dengan navigasi bawah
- **Kilau partikel**: diperkecil dari 22 menjadi 12 partikel agar menjadi aksen, bukan gangguan

## File dalam patch ini

```
src/components/worldFx.tsx     -> TIMPA (SelectionGlow + aura lebih halus)
src/components/WorldScene.tsx  -> TIMPA (label ukuran tetap + sparkles kecil)
src/game/uiPolish.ts           -> BARU  (lapisan CSS responsif)
```

## Langkah pemasangan

1. Hentikan `npm run dev` dengan `Ctrl+C`.
2. Salin ketiga berkas ke lokasi yang sama di proyek Anda.
3. Tambahkan **satu baris** di `src/main.tsx`, letakkan **paling bawah** di antara impor modul:

   ```typescript
   import './game/juice3d';        // Patch 29
   import './game/kidsUi';         // Patch 32
   import './game/ParentInsight';  // Patch 34
   import './game/DailyPractice';  // Patch 35
   import './game/uiPolish';       // Patch 37  <- TAMBAHKAN INI
   ```

   Urutan penting: `uiPolish` harus **setelah** `kidsUi` agar aturannya menang bila ada tumpang tindih.

4. Jalankan:
   ```powershell
   npm run typecheck
   npm run build
   npm run dev
   ```
5. Muat ulang paksa: `Ctrl+Shift+R`.

## Uji coba

**Peta:**
1. Buka aplikasi — cahaya sorot besar sudah hilang, diganti cincin bercahaya di bawah pulau terpilih
2. Klik pulau lain — cincin berpindah dengan halus, tidak ada yang menutupi pulau tetangga
3. Perhatikan pulau ber-mastery ≥70% — cincin emasnya kini jelas terpisah dari aura, tidak lagi tampak "ganda"
4. Label pulau ukurannya **sama besar** di semua zoom, tidak saling menimpa

**Kartu misi:**
5. Di desktop lebar — kartu di kanan dengan lebar terkunci, tidak menutupi tengah peta
6. Perkecil jendela sampai di bawah 700px — kartu berubah jadi **bottom sheet** dengan pegangan geser
7. Bila isi kartu panjang, kartu bisa di-scroll sendiri tanpa memanjang keluar layar

**Header:**
8. Perkecil jendela bertahap — elemen header menyusut rapi, subtitle "by Bright Academy" tersembunyi di bawah 700px, tidak ada yang berdesakan

**Tombol mengambang:**
9. Tombol "Orang Tua" dan "Latihan" tidak lagi menempel pada navigasi bawah

## Catatan jujur

Saya tidak memiliki salinan `App.tsx` dan `styles.css` Anda, jadi `uiPolish.ts` bekerja sebagai **lapisan penimpa** yang menyasar nama kelas yang sudah ada (`header`, `.mission-card`, `.world-label`, `.compass`, `.hero`). Bila ada nama kelas yang ternyata berbeda di proyek Anda, aturan itu akan diabaikan tanpa menimbulkan galat — beri tahu saya bagian mana yang belum berubah, dan kirimkan potongan kodenya agar saya sesuaikan.
