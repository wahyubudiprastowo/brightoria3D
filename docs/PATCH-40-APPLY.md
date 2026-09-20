# Patch 40 — Karakter Blocky & Pulau 3D Penuh

**Jenis patch:** 3 file baru + 2 file ditimpa. Tanpa dependency baru,
`package.json` tidak berubah, **enam game dunia tidak disentuh sama sekali**.

> **Prasyarat:** Patch 38 (pipeline render + arena Ekspedisi) dan Patch 39
> (quest engine) harus sudah terpasang. Patch ini memakai `src/render/quality.ts`,
> `src/render/CinematicRig.tsx`, `src/render/Postfx.tsx`, `questEngine.ts`,
> `questData.ts`, dan `QuestHud.tsx` dari kedua patch itu.

---

## 1. Dua keluhan yang dipecahkan

### "Karakternya aneh, gak dibikin seperti Roblox aja"

Karakter lama dibangun dari kapsul + bola — terbaca abstrak, bukan sosok.
Sekarang diganti karakter blocky bersendi: kepala, badan, dua lengan, dua kaki,
wajah bertekstur, ransel penjelajah.

### "Pulaunya juga masih kurang menarik"

Patch 38 sudah memberi pulau alas batu 3D, **tapi bagian atasnya masih satu
gambar `.webp` di billboard** — dan billboard selalu menghadap kamera. Jadi
bagian yang paling dilihat anak justru tetap datar.

Sekarang permukaan pulau diisi bangunan & tanaman 3D sungguhan sesuai tema:

| Dunia | Bangunan utama |
|---|---|
| Taman Al-Qur'an | Masjid berkubah + menara |
| Kampung Adab | Rumah kampung beratap limas |
| Pulau Numeria | Menara balok bertumpuk + kristal |
| Oasis Bahasa Arab | Tenda gurun + kolam oasis |
| English Harbor | Mercusuar bergaris + perahu |
| Benteng Digital | Pilar teknologi + cincin data berputar |

Ditambah pohon blocky, pohon palem (Arab & English), dan batu yang tersebar
deterministik — pulau yang sama selalu terlihat sama tiap refresh.

---

## 2. Temuan teknis terpenting

**Gaya blocky membatalkan batasan animasi yang saya sebut di Patch 39.**

Waktu itu saya menulis bahwa animasi jalan/lari/lompat butuh model ber-rig dari
Blender. Itu benar **untuk karakter organik**, yang perlu *skinning* — satu mesh
melengkung mengikuti tulang.

Karakter blocky bekerja sama sekali berbeda: tiap anggota badan adalah **kotak
terpisah yang kaku**. Tidak ada skinning, tidak ada bone weight. Lengan hanya
balok yang berputar di sendi bahu.

Artinya seluruh daftar animasi di Art Bible — Idle, Walk, Run, Jump, Interact,
Talk, Celebrate, Read — **bisa dibuat penuh lewat kode saja**. Semuanya sudah
diimplementasikan di `BlockyCharacter.tsx`.

### Tiga teknik yang menentukan kualitas hasilnya

**a. Pivot di sendi, bukan di tengah mesh**

Kesalahan paling umum: memutar mesh lengan langsung. Hasilnya berputar di tengah
seperti baling-baling, bukan berayun dari bahu. Solusinya bungkus tiap anggota
badan dalam `<group>` yang diletakkan **tepat di sendi**, lalu geser mesh-nya ke
bawah setengah tinggi di dalam group itu:

```tsx
<group position={[posisi bahu]}>        {/* titik putar */}
  <mesh position={[0, -tinggi/2, 0]} /> {/* kotak digeser ke bawah */}
</group>
```

**b. Fase terakumulasi, bukan berbasis waktu langsung**

Cara naif `sin(waktu × frekuensi × kecepatan)` membuat seluruh gelombang
**melompat** saat kecepatan berubah — kaki tersentak tiap kali anak mulai atau
berhenti berlari. Solusinya akumulasi fase tiap frame:

```ts
fase += delta * frekuensi * kecepatan
```

Saat kecepatan berubah, fase tetap di posisinya dan hanya **laju** perubahannya
yang berbeda. Transisi berhenti-jalan jadi mulus.

**c. `motionRef`, bukan `useState`**

Kecepatan lari berubah 60× per detik. Kalau dikirim lewat `useState`, React harus
re-render 60× per detik — mahal dan tidak perlu, karena yang berubah hanya angka
di dalam `useFrame`.

Explorer memegang satu ref berisi `{ speed, airborne }` dan **memutasi isinya
langsung**. BlockyCharacter membacanya tiap frame **tanpa satu pun re-render**.

---

## 3. File dalam patch ini

```
src/components/world3d/BlockyCharacter.tsx   (BARU)
src/components/world3d/IslandProps.tsx       (BARU)
src/components/world3d/Island3D.tsx          (TIMPA — versi Patch 38)
src/game/expedition/NpcAira.tsx              (TIMPA — versi Patch 39)
src/game/expedition/ExpeditionGame.tsx       (TIMPA — versi Patch 39)
docs/PATCH-40-APPLY.md                       (BARU)
```

### Kontrak props tidak berubah sama sekali

| File | Props | Dipakai oleh |
|---|---|---|
| `Island3D.tsx` | `{ world, index, active, hovered, onSelect, onHover }` | `WorldScene3D.tsx` |
| `NpcAira.tsx` | `{ x, z, near, hasOffer, hasReady }` | `ExpeditionGame.tsx` |
| `ExpeditionGame.tsx` | `{ onExit, onXpEarned, onEnterWorld }` | `ExpeditionLauncher.tsx` |

Karena itu **tidak ada file lain yang perlu diubah** — tidak `WorldScene3D.tsx`,
tidak `main.tsx`, tidak `App.tsx`.

---

## 4. Yang sengaja tidak disentuh

Seluruh mesin quest Patch 39 dipertahankan utuh:

- Terima tugas → lacak progres → serahkan → dapat kristal
- Deteksi `play_world` lewat selisih evidence (nol perubahan di enam game dunia)
- Bintang Ilmu tetap jadi kunci pembuka gerbang
- Fisika gerak, kamera pegas, joystick, kontrol keyboard
- Terrain prosedural dan fungsi `terrainHeight` yang dibagi bersama

Satu-satunya yang berubah di `ExpeditionGame.tsx` adalah **visual karakter pemain**.

---

## 5. Cara memasang

```
1. Extract ZIP
2. Copy folder src/ dan docs/ ke root proyek Brightoria
3. npm run typecheck
4. npm run build
5. npm run dev
```

Tidak ada langkah tambahan. Tidak ada import baru yang perlu ditambahkan di mana pun.

---

## 6. Checklist uji

**Peta dunia:**

- [ ] Tiap pulau kini punya bangunan 3D di permukaannya, bukan gambar datar
- [ ] Putar kamera → bangunan ikut berputar dan memperlihatkan sisi lain
- [ ] Pohon bergoyang pelan seperti tertiup angin
- [ ] Bangunan melempar bayangan ke permukaan pulau (di tier balanced/high)
- [ ] Refresh halaman → bentuk pulau tetap sama persis (deterministik)
- [ ] Pilih pulau → kristal kecil mengorbit, pulau membesar halus

**Ekspedisi:**

- [ ] Karakter pemain kini bersosok blocky dengan wajah, bukan kapsul
- [ ] Berjalan → lengan dan kaki berayun berlawanan seperti manusia
- [ ] Berlari → langkah lebih cepat, badan condong ke depan
- [ ] Berhenti mendadak → transisi mulus, kaki tidak tersentak
- [ ] Ransel terlihat di punggung saat karakter berbalik
- [ ] Aira kini blocky bertema teal, memegang buku bercahaya
- [ ] Dekati Aira → Aira membesar sedikit dan menoleh (anticipation)
- [ ] Ada tugas → Aira melambai + tanda seru melayang
- [ ] Siap dilaporkan → penanda berubah jadi centang hijau

**Regresi (harus tetap berjalan):**

- [ ] Quest bisa diterima, dilacak, dan diserahkan seperti sebelumnya
- [ ] Bintang Ilmu tetap terkumpul dan membuka gerbang
- [ ] Masuk gerbang → game dunia terbuka normal
- [ ] Save lama dari Patch 38/39 tetap utuh

---

## 7. Konsekuensi yang perlu diketahui

**Berkas `.webp` pulau tidak lagi dipakai di peta 3D.**

Aset itu **masih dipakai** di `FallbackGrid` (`WorldScene3D.tsx`) sebagai gambar
2D saat WebGL tidak tersedia, jadi tidak ada aset yang terbuang.

Kalau ingin mengembalikan billboard: tambahkan kembali `<Billboard>` berisi
`<planeGeometry>` + `useLoader(TextureLoader, world.image)` di atas grup props
dalam `Island3D.tsx`. Tapi perlu diingat keduanya akan saling menutupi.

**ARI belum dibuat.** Art Bible menempatkan ARI sebagai *Explorer character* —
itu peran pemain, dan `BlockyCharacter` dengan palet `explorer` sudah mengisinya.
Kalau Anda ingin ARI sebagai sosok dengan nama dan identitas terpisah dari maskot
Bri, itu keputusan produk yang perlu Anda putuskan dulu.

---

## 8. Yang sudah saya verifikasi, dan yang belum

**Sudah diverifikasi:**

| Pemeriksaan | Hasil |
|---|---|
| Keseimbangan kurung di 5 file | ✅ Semua seimbang |
| Import menganggur (penyebab gagal build strict) | ✅ Bersih, nol temuan |
| Jalur import lintas-folder | ✅ Semua konsisten |
| Kontrak props tidak berubah | ✅ Terverifikasi |

**Belum bisa saya verifikasi:** `npm run typecheck` dan `npm run build`.
`node_modules` tidak tersedia di lingkungan kerja saya. Kalau ada error build,
kirimkan pesannya — perbaikannya cepat.

---

## 9. Kepatuhan kebijakan wajib

| Kebijakan | Status |
|---|---|
| Peta wajib 3D interaktif (drag/zoom) | ✅ Diperkuat, bukan dikurangi |
| Formasi cincin `worlds.ts` | ✅ Tidak disentuh |
| `styles.css` selalu lengkap | ✅ Tidak diubah; CSS disuntik per-modul |
| Canvas dibungkus error boundary + fallback | ✅ Tetap ada |
| Dilarang `<Environment>` drei / aset CDN | ✅ Semua prosedural |
| Tanpa musik latar | ✅ Tidak ada audio baru |
| Juice dekoratif murni | ✅ Tidak menyentuh evidence/mastery |
| Konten kurikulum AI = draft | ✅ Tidak menambah materi ajar |
| Tanpa dependency baru | ✅ `package.json` tidak berubah |

---

## 10. Yang perlu diperbarui di dokumentasi proyek

- `AGENTS.md` → tambahkan sistem karakter blocky ke status faktual
- `docs/gameplay/GAMEPLAY-CATALOG.md` → catat pulau kini 3D penuh
- `CHANGELOG.md` → entri 0.40.0
- `02_Art_Bible.docx` → perlu revisi: gaya karakter kini blocky, dan 8 animasi
  di daftar sudah terpenuhi lewat kode (bukan lagi menunggu rig Blender)
