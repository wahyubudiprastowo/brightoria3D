# Patch 42 — Arena Hidup, Warna Brand Bright, & Realisme Pencahayaan

**Jenis patch:** 3 file baru + 2 file ditimpa + 2 aset logo. Tanpa dependency baru,
`package.json` tidak berubah, `App.tsx` tidak perlu disentuh.

---

## 1. Tiga hal yang dikerjakan

### A. "Landnya masih kaku banget"

Akar masalahnya bukan bentuk bukitnya — **arena benar-benar kosong**. Tidak ada satu
pun objek di atas lahan, jadi mata tidak punya apa-apa untuk dibaca selain gradien
hijau. `IslandProps.tsx` dari Patch 40 hanya dipakai pulau di peta; arena Ekspedisi
tidak pernah kebagian dekorasi.

Empat perbaikan, diurutkan dari dampak terbesar:

| # | Perbaikan | Kenapa penting |
|---|---|---|
| 1 | **Arena diisi** — pohon, cemara, batu, semak, danau, batu pijakan, pegunungan jauh | Mata akhirnya punya objek untuk dibaca |
| 2 | **Lahan di-flat-shade** + segmen dikurangi (36–56) | Sebelumnya *smooth-shade*, bertabrakan dengan karakter blocky |
| 3 | **Jalan setapak diwarnai ke vertex** | Anak tahu arah gerbang tanpa petunjuk teks. Nol biaya render |
| 4 | **Gerbang berdiri di teras datar** | Sebelumnya portal miring di lereng karena terrain cuma jumlahan sinus |

Semua objek memakai `InstancedMesh` — ratusan objek hanya memakan ~9 draw call.
Penting untuk HP kelas menengah.

### B. Warna brand Bright Academy

Warna **tidak saya tebak**. Saya baca seluruh piksel logo, buang putih/hitam (teks
& latar), lalu hitung piksel kebiruan paling dominan:

| Warna | Kode | Dominasi |
|---|---|---|
| Navy | `#002880` | 321.712 piksel |
| Biru langit | `#28a8e0` | 297.231 piksel |

Keduanya menguasai hampir seluruh area berwarna — inilah dua warna identitas yang
sebenarnya. Semua turunan (langit, air, batu, jalan, pegunungan) dibuat dengan
**mempertahankan hue** dari kedua induk, hanya mengubah kecerahan & saturasi.

**Logo juga masuk ke dalam dunia 3D**: monumen di alun-alun tengah dengan alas navy
bertingkat, tiang penyangga, cincin cahaya biru langit, dan logo ikon melayang
berputar pelan. Fungsinya bukan cuma hiasan — jadi titik rujukan arah.

#### Satu keputusan yang perlu Anda ketahui

**Rumput sengaja saya biarkan hijau**, tidak diubah jadi biru.

Anak usia 6–12 membaca dunia lewat isyarat alami: rumput hijau, air biru, tanah
coklat. Kalau rumput jadi biru, arena terasa asing dan sulit dibaca.

Yang saya lakukan: hijaunya **digeser ke arah teal** (komponen biru dinaikkan)
sehingga menyatu dengan langit brand tanpa kehilangan identitasnya. Yang
benar-benar jadi biru adalah elemen non-organik — batu, jalan, pasir, pegunungan
jauh, langit.

### C. Realisme pencahayaan

Ini peningkatan realisme terbesar, dan penyebabnya hal yang mudah terlewat:

> **`scene.environment` selama ini KOSONG.**

Akibatnya setiap `MeshStandardMaterial` di aplikasi **tidak memantulkan apa pun**.
Itu masalah besar, karena material PBR *mengharapkan* ada lingkungan untuk
dipantulkan:

- `metalness` praktis tidak berfungsi — logam terlihat seperti plastik gelap,
  padahal warna logam di dunia nyata **berasal dari pantulan lingkungan**
- Permukaan halus terlihat datar, padahal seharusnya memantulkan langit
- Bagian yang tidak kena cahaya langsung jadi gelap mati, padahal di dunia nyata
  tetap terang oleh pantulan langit

`ProceduralEnv.tsx` memperbaikinya: langit digambar ke kanvas → tekstur
equirectangular → PMREM → `scene.environment`.

**PMREMGenerator adalah bagian kuncinya.** Ia menghasilkan mipmap yang sudah
di-prafilter untuk berbagai tingkat kekasaran. Berkat itu permukaan kasar
memantulkan lingkungan secara **buram** dan permukaan halus memantulkannya
**tajam** — persis perilaku fisik bahan. Tanpa PMREM, semua pantulan sama tajamnya
dan justru terlihat palsu.

#### Kenapa prosedural, bukan berkas HDR

Cara lazimnya memakai `.hdr` lewat `<Environment>` drei. Itu **dilarang** di proyek
ini — pada Patch 03, `<Environment>` mengunduh HDR dari CDN dan membuat scene macet
blank. Kejadian serupa berulang di Patch 12–15 dengan `.webp`.

Di sini langitnya digambar sendiri. Nol permintaan jaringan, nol berkas, tidak
mungkin gagal dimuat. Dihitung **sekali** saat pemuatan.

#### Batas jujur soal "realistic"

Gaya visual aplikasi ini blocky. Mengejar fotorealisme penuh justru **merusak** —
karakter kotak di atas lanskap fotoreal terlihat seperti dua game ditempel jadi
satu.

Yang saya kerjakan adalah **realisme pencahayaan**: cahaya dan material berperilaku
sesuai fisika, sehingga dunia terasa padat dan membumi. Gaya bentuknya tetap blocky,
dan itu memang disengaja.

---

## 2. File dalam patch ini

```
src/theme/brightBrand.ts                  (BARU — token warna brand)
src/render/ProceduralEnv.tsx              (BARU — pencahayaan lingkungan)
src/game/expedition/ArenaProps.tsx        (BARU — isi arena + monumen logo)
src/game/expedition/expeditionData.ts     (TIMPA — bentuk lahan baru)
src/game/expedition/ExpeditionGame.tsx    (TIMPA — integrasi)
public/assets/brand/bright-icon.png       (BARU — logo ikon)
public/assets/brand/bright-logo.png       (BARU — logo penuh)
docs/PATCH-42-APPLY.md                    (BARU)
```

**Prasyarat:** Patch 38 (render pipeline + arena), 39 (quest engine), 40
(`BlockyCharacter`), 41 (`WorldPortalHost`) harus sudah terpasang.

---

## 3. Cara memasang

```
1. Extract ZIP
2. Salin ISI folder p42/ (yaitu src/, public/, docs/) ke root proyek
3. npm run typecheck
4. npm run build
5. npm run dev
```

> **Perhatikan:** yang disalin adalah **isi** folder `p42/`, bukan foldernya.
> ```
> BENAR:  brightoria/src/theme/brightBrand.ts
> SALAH:  brightoria/p42/src/theme/brightBrand.ts
> ```

Verifikasi setelah menyalin:

```powershell
dir src\theme
dir public\assets\brand
findstr /C:"ProceduralEnv" src\game\expedition\ExpeditionGame.tsx
```

---

## 4. Checklist uji

**Arena:**
- [ ] Ada pohon, cemara, batu, dan semak tersebar — tidak lagi bukit polos
- [ ] Danau biru terlihat di sisi barat daya, permukaannya beriak pelan
- [ ] Jalan setapak berwarna lebih terang membentang dari tengah ke tiap gerbang
- [ ] Ada batu pijakan di sepanjang jalan
- [ ] Pegunungan navy terlihat di kejauhan, tersaput kabut
- [ ] Permukaan tanah terlihat **faceted** (bersegi), selaras dengan karakter
- [ ] Gerbang berdiri tegak di tanah datar, tidak miring di lereng

**Brand:**
- [ ] Monumen logo berdiri di alun-alun tengah, logo berputar pelan
- [ ] Langit bergradasi navy → biru langit → pucat di cakrawala
- [ ] Tombol & HUD berwarna navy/biru langit
- [ ] Logo ikon muncul di lencana kiri atas
- [ ] Karakter pemain berbaju navy dengan aksen biru langit

**Realisme:**
- [ ] Bintang Ilmu terlihat **memantulkan langit**, bukan sekadar bercahaya rata
- [ ] Cincin gerbang terlihat metalik, bukan plastik
- [ ] Bagian bawah objek sedikit menangkap warna tanah (pantulan)
- [ ] Sisi objek yang tidak kena matahari tetap terang, tidak gelap mati

**Regresi (harus tetap jalan):**
- [ ] Quest bisa diterima, dilacak, diserahkan
- [ ] Bintang terkumpul dan membuka gerbang
- [ ] Masuk gerbang → game dunia terbuka sebagai overlay
- [ ] Tutup game → kembali ke posisi terakhir di arena
- [ ] Save lama tetap utuh

---

## 5. Yang sudah saya verifikasi

| Pemeriksaan | Hasil |
|---|---|
| Keseimbangan kurung, 5 file (pemeriksa sadar-string) | ✅ Semua seimbang |
| Import menganggur | ✅ Nol temuan |
| Referensi silang antar modul | ✅ Semua tersambung |
| Warna hardcode di luar palet brand | ✅ Bersih — semua dari `brightBrand.ts` |

**Belum bisa saya verifikasi:** `npm run typecheck` dan `npm run build` —
`node_modules` tidak tersedia di lingkungan kerja saya. Kalau ada error, kirimkan
pesannya.

---

## 6. Catatan performa

`ProceduralEnv` menambah satu kali proses PMREM saat pemuatan (~50–150 ms
tergantung perangkat). Resolusinya mengikuti tier:

| Tier | Resolusi | Alasan |
|---|---|---|
| low | 256 | Hasil hanya dipakai sebagai pantulan, penurunan hampir tak terlihat |
| balanced | 512 | |
| high | 768 | |

Kalau ada laporan lambat saat membuka arena di HP tertentu, turunkan angka ini di
`ProceduralEnv.tsx`.

---

## 7. Kepatuhan kebijakan wajib

| Kebijakan | Status |
|---|---|
| Peta wajib 3D interaktif | ✅ Tidak disentuh |
| Formasi cincin `worlds.ts` | ✅ Tidak disentuh |
| `styles.css` selalu lengkap | ✅ Tidak diubah; CSS disuntik per-modul |
| Canvas dibungkus error boundary | ✅ Tetap ada |
| Dilarang `<Environment>` drei / aset CDN | ✅ Semua prosedural & lokal |
| Tanpa musik latar | ✅ Tidak ada audio baru |
| Juice dekoratif murni | ✅ Tidak menyentuh evidence/mastery |
| Tanpa dependency baru | ✅ `package.json` tidak berubah |

---

## 8. Yang perlu diperbarui di dokumentasi proyek

- `AGENTS.md` → tambahkan `brightBrand.ts` sebagai sumber warna resmi
- `CHANGELOG.md` → entri 0.42.0
- `02_Art_Bible.docx` → perlu revisi: palet resmi kini navy `#002880` +
  biru langit `#28a8e0`, diambil dari logo
