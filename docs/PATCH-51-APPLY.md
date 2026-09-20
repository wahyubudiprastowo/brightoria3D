# Patch 51 — Penanda Pulau Terpilih

**Sifat patch:** perbaikan UX. Dua berkas, tanpa dependency baru, `package.json`
tidak berubah, `App.tsx` dan `main.tsx` tidak perlu disentuh.

---

## ⚠️ Baca dulu: perbaikan galat build

Sebelum memasang patch ini, selesaikan dulu galat yang Anda laporkan:

```
TS1261: 'DailyPractice.ts' differs from 'dailyPractice.ts' only in casing
```

Perhatikan keduanya berakhiran **`.ts`**, bukan `.tsx`. Artinya berkas
`src/game/dailyPractice.ts` **masih ada** di proyek Anda — sisa dari Patch 35 yang
seharusnya dihapus di Patch 36.

```powershell
# 1. Pastikan penggantinya sudah ada
dir src\game\practiceEngine.ts

# 2. Kalau ada, hapus berkas lama
del src\game\dailyPractice.ts

# 3. Build
npm run build
```

Kalau `practiceEngine.ts` **tidak** ada, jangan dihapus — beri tahu saya dulu.

---

## 1. Menjawab kebingungan Anda soal ring

Pertanyaan Anda: *"ring effect cuma 2 yang ada ya, atau ring effect pas dipilih?"*

Kebingungannya beralasan — dan ini **kesalahan desain saya**.

### Yang terlihat di layar itu penanda PENCAPAIAN, bukan penanda terpilih

Cincin besar yang Anda lihat muncul **otomatis** di pulau dengan mastery tinggi:

| Pulau | Mastery | Cincin |
|---|---|---|
| Kampung Adab | 117% | ✅ |
| Pulau Numeria | 70% | ✅ |
| English Harbor | 33% | ❌ |
| Taman Al-Qur'an | 28% | ❌ |
| Benteng Digital | 14% | ❌ |
| Oasis Bahasa Arab | 10% | ❌ |

Persis dua pulau memenuhi syarat — sesuai yang Anda amati.

### Penanda terpilih memang terlalu samar

Di Patch 37 saya membuat `SelectionGlow` yang sangat halus. Waktu itu saya
mengecilkannya karena Anda mengeluhkan kerucut cahaya sebelumnya mengganggu.

**Saya mengecilkannya terlalu jauh.** Sekarang hampir tidak terlihat, sehingga anak
tidak punya isyarat pasti bahwa pulau yang diketuk sudah terpilih.

---

## 2. Penanda baru: tiga prinsip desain

### a. Berbeda bentuk, bukan sekadar berbeda warna

| | Penanda pencapaian | Penanda terpilih |
|---|---|---|
| Bentuk | **Cincin** mengelilingi pulau | **Panah** di atas + denyut di kaki |
| Gerak | Berputar tetap | **Berdenyut** |
| Arti | Pencapaian permanen | Sedang aktif |

Bentuknya sama sekali lain, jadi tidak mungkin tertukar lagi — bahkan kalau
warnanya kebetulan mirip.

### b. Panah adalah isyarat paling universal

Untuk anak usia 6–12, panah menunjuk ke bawah sambil memantul jauh lebih langsung
terbaca daripada cahaya atau aura. **Tidak perlu dipelajari** — semua anak sudah
paham artinya.

Panahnya berputar pelan, sehingga terbaca sebagai kristal bersisi empat dan tetap
jelas dari sudut kamera mana pun.

### c. Tetap di bawah siluet pulau

Pelajaran dari Patch 37: apa pun yang menjulang tinggi akan menutupi pulau
tetangga. Penanda ini hanya menempati ruang **tepat di atas puncak** dan **di
kakinya** — tidak pernah melebar ke samping.

---

## 3. Empat lapisan penanda terpilih

| Lapisan | Fungsinya |
|---|---|
| **Panah memantul** | Isyarat utama — tidak mungkin terlewat |
| **Denyut di kaki** | Menegaskan pulau mana, terlihat dari sudut rendah |
| **Dua gelombang mengembang** | Menarik pandangan meski anak sedang melihat bagian lain peta |
| **Kristal mengorbit** | Dipertahankan dari Patch 40 |

Gelombang memakai jeda berbeda agar berdatangan bergantian, bukan berbarengan.
Pudaran memakai pangkat dua — cepat di awal, pelan di akhir, meniru gelombang air.

### Keadaan disorot sengaja dibuat lebih lemah

Saat kursor melewati pulau, yang muncul hanya cincin tipis berputar. Ia hanya
mengatakan *"pulau ini bisa diketuk"*, bukan *"pulau ini sedang dipilih"*.

Membuat keduanya sama kuat justru menghapus perbedaannya.

---

## 4. Satu detail teknis yang menentukan

Penanda diletakkan **di luar grup berskala**.

Kalau ikut di dalamnya, panah akan ikut membesar saat pulau terpilih — dan karena
posisinya dihitung dari titik pusat, ia akan melayang makin jauh dari puncak pulau.
Hasilnya panah menggantung di udara, bukan menunjuk.

Pembesaran saat terpilih juga dinaikkan dari 1,12 ke **1,16** agar terbaca jelas
tanpa menabrak pulau tetangga.

---

## 5. File dalam patch ini

```
src/components/world3d/SelectionMarker.tsx   (BARU)
src/components/world3d/Island3D.tsx          (TIMPA — versi Patch 40)
docs/PATCH-51-APPLY.md                       (BARU)
```

**Prasyarat:** Patch 40 (`IslandProps.tsx`), Patch 38 (`render/quality.ts`).

### ⚠️ Catatan jujur soal `Island3D.tsx`

Berkas ini **menimpa** versi Patch 40. Saya menulis versi itu sendiri dan yakin
isinya belum berubah sejak saat itu — Patch 42 sampai 46 tidak menyentuhnya.

Tapi kalau Anda pernah menyuntingnya sendiri, **beri tahu saya dulu** sebelum
menimpa.

Kontrak propsnya tidak berubah (`world, index, active, hovered, onSelect,
onHover`), jadi `WorldScene3D.tsx` tidak perlu disentuh.

---

## 6. Cara memasang

Salin **isi** folder `p51/` ke root proyek — bukan foldernya:

```
BENAR:  brightoria/src/components/world3d/SelectionMarker.tsx
SALAH:  brightoria/p51/src/components/world3d/SelectionMarker.tsx
```

```powershell
npm run build
npm run dev
```

Lalu muat ulang paksa (`Ctrl+Shift+R`).

---

## 7. Checklist uji

**Penanda terpilih:**

- [ ] Ketuk pulau mana pun → muncul **panah memantul** di atasnya
- [ ] Panah berputar pelan, warnanya sesuai tema dunia itu
- [ ] Ada **cincin berdenyut** di kaki pulau
- [ ] Ada **gelombang mengembang** keluar dari kaki, bergantian
- [ ] Ketuk pulau lain → penanda **berpindah**, tidak tertinggal ganda
- [ ] Penanda muncul di **semua** pulau, bukan hanya dua

**Bedanya dengan penanda pencapaian:**

- [ ] Cincin besar tetap ada di Kampung Adab & Pulau Numeria
- [ ] Cincin itu **tidak berubah** saat pulau lain dipilih
- [ ] Keduanya jelas berbeda bentuk

**Saat kursor melewati:**

- [ ] Muncul cincin tipis berputar, jauh lebih lemah
- [ ] Pulau membesar sedikit
- [ ] Tidak ada panah (itu khusus terpilih)

**Regresi:**

- [ ] Pulau tetap berputar pelan
- [ ] Bangunan & pohon tetap di permukaan
- [ ] Label tetap terbaca dan bisa diketuk
- [ ] Pop-in bertahap saat peta dibuka masih berjalan

---

## 8. Hasil verifikasi

| Pemeriksaan | Hasil |
|---|---|
| Keseimbangan kurung, 2 berkas (pemeriksa sadar-string) | ✅ 84/84, 111/111, 14/14 · 84/84, 48/48, 14/14 |
| Import menganggur | ✅ Nol temuan |
| Ekspor `SelectionMarker` | ✅ Ada |
| Kontrak props `Island3D` | ✅ Tidak berubah |

**Belum bisa saya verifikasi:** `npm run build` — `node_modules` tidak tersedia di
lingkungan kerja saya.

---

## 9. Temuan yang belum bisa saya perbaiki: mastery 117%

Kampung Adab menunjukkan **117%**. Mastery tidak semestinya melampaui 100% — itu
menandakan kesalahan pembagian.

Dugaan saya: penyebutnya lebih kecil daripada seharusnya. Misalnya jumlah bab yang
dipakai membagi lebih sedikit daripada bab yang sebenarnya tersimpan di evidence —
bisa terjadi kalau data lama dari versi dengan jumlah bab berbeda masih tersimpan.

Saya **tidak memegang salinan** `src/data/worlds.ts` maupun `src/App.tsx`, jadi
belum bisa memastikan letak persis perhitungannya.

Kalau Anda kirimkan salah satunya, saya bisa telusuri dan perbaiki — termasuk
menambahkan pembatas agar mastery tidak pernah bisa melampaui 100% apa pun isi
datanya.

---

## 10. Di mana AsterQuiz

Namanya **Penerbangan Ilmu**, dan letaknya di dalam tombol **🔁 Latihan**:

```
Tombol "🔁 Latihan"  →  🔁 Latihan Tenang
                     →  🐸 Lompat Katak
                     →  ✈️ Penerbangan Ilmu   ← AsterQuiz
```

Di tangkapan layar Anda, tombol itu **belum muncul** — hanya ada tiga tombol
mengambang (Tanya Bri, Ekspedisi, Orang Tua).

Itu sebabnya AsterQuiz tidak bisa ditemukan: pintunya memang belum terpasang,
karena galat TS1261 di atas menghalangi `DailyPractice` ter-mount.

Setelah `dailyPractice.ts` dihapus dan build hijau, tombolnya akan muncul.
