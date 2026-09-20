# Patch 39 — Quest Engine, NPC Aira & Knowledge Crystal

**Jenis patch:** ADITIF di dalam satu folder. Tidak ada dependency baru,
`package.json` tidak berubah, dan **enam game dunia tidak disentuh sama sekali**.

---

## 1. Yang dipecahkan patch ini

Game Design Document mendefinisikan loop inti:

```
Explore → Discover NPC → Receive Quest → Play Learning Challenge
        → Earn Knowledge Crystal → Unlock Content
```

Sebelum patch ini, aplikasi hanya punya: *buka peta → ketuk pulau → main → dapat bintang*.
Tidak ada NPC, tidak ada quest, tidak ada penemuan. Patch 39 menutup lapisan itu.

| Elemen GDD | Sebelum | Sesudah |
|---|---|---|
| NPC | ❌ nol | ✅ Aira, pemandu ilmu, berdiri di arena |
| Quest Engine | ❌ tidak ada | ✅ state machine 4 status + rantai prasyarat |
| Knowledge Crystal | ❌ bintang generik | ✅ 4 warna sesuai taksonomi GDD |
| Konten JSON | ❌ hardcoded | ✅ struktur JSON-compatible, siap migrasi |
| Dialog | ❌ tidak ada | ✅ panel dialog bertahap |

---

## 2. Keputusan teknis yang paling menentukan

### Deteksi "sudah main di dunia" tanpa menyentuh enam game

Quest `play_world` harus tahu kapan anak selesai bermain. Cara naif: tambah callback
di setiap game — artinya mengubah enam file yang sudah stabil.

**Yang saya lakukan: deteksi lewat selisih evidence.**

```
Saat quest diterima  → potret angka kemajuan dunia target  (baseline)
Saat anak kembali    → baca angka sekarang
kemajuan_sekarang - baseline >= amount  →  quest selesai
```

Setiap dunia sudah menulis jejaknya sendiri ke `localStorage`. Mesin quest hanya
**membaca** jejak itu. Hasilnya: **nol baris** yang diubah di `QuranGame`,
`ArabicGame`, `EnglishGame`, `AdabGame`, `NumeriaGame`, `DigitalGame`.

Pemicu evaluasi ulang memakai event `focus` + `visibilitychange` — momen paling andal
saat anak kembali ke arena, tanpa polling yang memakan baterai.

### Bintang lama tetap berarti penuh

Patch 38 menyimpan `{ stars, visits, updatedAt }`. Patch 39 **menambah** `crystals`
dan `quests` ke objek yang sama, dan **tidak pernah** mengubah arti `stars`.

- Bintang tetap jadi kunci pembuka gerbang
- Kristal adalah lapisan hadiah **di atas** bintang, bukan pengganti
- Anak dengan 5 bintang tetap punya 5 bintang setelah patch ini

`loadState()` melakukan migrasi lembut: field yang belum ada diisi kosong, data lama
tidak pernah dihapus.

### Data ditulis `.ts`, bukan `.json` — dan itu disengaja

Dokumen arsitektur meminta `quests.json`. Saya menulisnya sebagai TypeScript bertipe
dulu karena tiga alasan:

1. **Type safety sekarang** — salah ketik `worldId` ketahuan saat `npm run build`,
   bukan saat anak sudah main
2. **Migrasi nanti nol risiko** — strukturnya 100% JSON-compatible (tanpa fungsi,
   tanpa `undefined`, tanpa objek `Date`). Saat siap: salin array ke
   `public/data/quests.json`, ganti import dengan `fetch()`. Tidak ada logika lain
   yang berubah.
3. **Tanpa request jaringan** — proyek ini sudah dua kali terluka oleh aset eksternal
   (HDR CDN Patch 03, `.webp` background Patch 12–15)

---

## 3. Isi quest

Lima quest berantai, semuanya mengarahkan ke game yang **sudah ada**:

| Quest | Tujuan | Hadiah |
|---|---|---|
| Salam Pertama | Kumpulkan 1 Bintang Ilmu | 🏆 1 Kristal Pencapaian |
| Jejak Huruf Hijaiyah | Selesaikan 1 huruf di Taman Al-Qur'an | 💚 1 Kristal Akhlak |
| Jembatan Angka | Selesaikan 1 level Pulau Numeria | 💙 1 Kristal Ilmu |
| Kata dari Seberang Laut | Selesaikan 1 pulau English Harbor | 💜 1 Kristal Kreasi |
| Penjaga Empat Warna | Miliki keempat warna kristal | 🏆 2 Kristal Pencapaian |

**Quest tidak menambah materi ajar apa pun.** Ia hanya memberi alasan naratif untuk
memainkan game yang sudah ada — menjaga kebijakan bahwa mastery hanya boleh datang
dari enam game dunia.

### Pemetaan warna kristal

GDD menetapkan: Green = Character, Blue = Science, Gold = Achievement,
Purple = Creativity.

Pemetaan dunia → warna adalah **interpretasi saya** terhadap tema tiap dunia, bukan
sesuatu yang tertulis eksplisit di dokumen:

```
quran, adab       → green   (karakter & refleksi)
math, digital     → blue    (logika & literasi teknologi)
arabic, english   → purple  (bahasa sebagai ekspresi)
gold                        (khusus milestone lintas-dunia)
```

Kalau tim akademik punya pemetaan berbeda, ubah `WORLD_CRYSTAL` di `questData.ts` —
seluruh sistem mengikuti.

---

## 4. Aira — dan batas yang jujur

Art Bible mendeskripsikan AIRA: *Knowledge guide*, ekspresi ramah, busana teal,
buku ilmu bermagic. Ketiganya diterjemahkan ke geometri prosedural.

**Yang tidak bisa saya buat:** animasi skeletal (Idle, Walk, Run, Jump, Interact,
Talk, Celebrate, Read). Itu butuh model ber-rig dari Blender → GLB — pekerjaan artis
3D, bukan kode.

**Yang saya kerjakan sebagai gantinya:** prinsip animasi klasik untuk membuat bentuk
sederhana terasa hidup tanpa rig:

- **Breathing** — badan naik-turun halus, tidak pernah benar-benar diam
- **Anticipation** — Aira "bangun" dulu (skala naik, buku terbuka) sebelum menyapa
- **Follow-through** — jubah menyusul gerak badan dengan jeda
- **Overlap** — buku mengorbit dengan ritme berbeda dari badan

Penanda quest melayang di atas kepala: tanda seru (ada tugas baru) atau centang
(siap dilaporkan).

### ARI sengaja belum dibuat

Art Bible menempatkan ARI sebagai *Explorer character* — itu peran **pemain**, dan
posisi itu sudah diisi Bri yang punya model 3D dan sudah berjalan. Memasukkan ARI
berarti mengganti karakter pemain: keputusan produk Anda, bukan keputusan saya.

---

## 5. Cara memasang

### Langkah 1 — Copy file

Extract, lalu copy ke root proyek:

```
src/game/expedition/questData.ts        (baru)
src/game/expedition/questEngine.ts      (baru)
src/game/expedition/NpcAira.tsx         (baru)
src/game/expedition/QuestHud.tsx        (baru)
src/game/expedition/ExpeditionGame.tsx  (TIMPA — versi Patch 38)
docs/PATCH-39-APPLY.md                  (baru)
```

`ExpeditionGame.tsx` adalah satu-satunya file yang ditimpa. Semua yang berjalan di
Patch 38 (terrain, fisika karakter, joystick, gerbang, bintang) dipertahankan utuh —
quest ditambahkan sebagai lapisan baru.

### Langkah 2 — Tidak ada langkah 2

`main.tsx` dan `App.tsx` **tidak perlu diubah**. Import `ExpeditionLauncher` dari
Patch 38 sudah menunjuk ke file yang sama.

### Verifikasi

```bash
npm run typecheck
npm run build
```

---

## 6. Checklist uji

- [ ] Buka 🧭 Ekspedisi → Aira terlihat di dekat alun-alun tengah, jubah teal,
      buku melayang mengorbit
- [ ] Tanda seru emas melayang di atas kepala Aira (ada tugas baru)
- [ ] Dekati Aira → tombol berubah jadi **"💬 Bicara dengan Aira"**
- [ ] Aira "bangun" saat didekati — badan sedikit membesar, buku terbuka
- [ ] Dialog muncul, ketuk untuk maju baris demi baris, titik progres terisi
- [ ] Terima quest → pelacak tugas muncul di kiri atas
- [ ] Kumpulkan 1 bintang → pelacak berubah jadi **"✓ Selesai! Kembali ke Aira"**
- [ ] Penanda Aira berubah jadi centang hijau
- [ ] Laporkan → toast kristal muncul di tengah layar, dompet kristal bertambah
- [ ] Quest berikutnya otomatis terbuka
- [ ] Quest "Jejak Huruf Hijaiyah" → masuk gerbang Taman Al-Qur'an, selesaikan
      1 huruf, kembali → quest terdeteksi selesai **tanpa perubahan di QuranGame**
- [ ] Tutup & buka ulang Ekspedisi → semua progres quest & kristal tersimpan
- [ ] Save lama dari Patch 38 → bintang tetap utuh, tidak ada yang hilang

---

## 7. Kepatuhan kebijakan wajib

| Kebijakan | Status |
|---|---|
| Peta wajib 3D interaktif | ✅ Tidak disentuh |
| Formasi cincin `worlds.ts` | ✅ Tidak disentuh |
| `styles.css` selalu lengkap | ✅ Tidak diubah; CSS disuntik per-modul |
| Canvas dibungkus error boundary | ✅ Lewat ExpeditionLauncher Patch 38 |
| Dilarang `<Environment>` / aset CDN | ✅ Semua prosedural |
| Tanpa musik latar | ✅ Tidak ada audio baru |
| Juice dekoratif murni | ✅ Quest tidak menyentuh evidence/mastery |
| Konten AI = draft | ✅ Quest tidak menambah materi ajar |
| Tanpa dependency baru | ✅ `package.json` tidak berubah |

---

## 8. Catatan jujur sebelum rilis

1. **Naskah dialog Aira adalah draft saya**, bukan hasil review tim akademik.
   Nadanya sudah saya jaga agar menyemangati dan tidak menghakimi, tapi tetap perlu
   dibaca ulang oleh tim karakter sebelum dipakai anak sungguhan.

2. **Deteksi `play_world` mengandalkan `visibilitychange`/`focus`.** Di sebagian
   besar kasus ini akurat. Kalau anak membuka dunia lalu kembali tanpa tab pernah
   kehilangan fokus (mis. overlay dibuka di atas arena tanpa pindah tab), evaluasi
   ulang tetap terjadi saat Ekspedisi ditutup dan dibuka lagi. Belum ada kasus di
   mana progres hilang — hanya mungkin tertunda.

3. **Belum saya `typecheck`** — `node_modules` tidak ada di sandbox saya. Saya sudah
   verifikasi keseimbangan sintaks dan memindai import menganggur (bersih), tapi
   kalau ada error build, kirim pesannya.

4. **Satu quest aktif pada satu waktu** — ini disengaja. Anak 6–12 tahun mudah
   kewalahan oleh daftar tugas. Kalau nanti ingin multi-quest, mesinnya sudah
   mendukung; yang perlu diubah hanya `getActiveQuest()`.

---

## 9. Yang perlu diperbarui di dokumentasi proyek

- `AGENTS.md` → tambahkan Quest Engine & Aira ke status faktual
- `docs/gameplay/GAMEPLAY-CATALOG.md` → Ekspedisi kini punya loop quest, tetap
  **lapisan meta**, bukan dunia ketujuh
- `CHANGELOG.md` → entri 0.39.0
- `docs/technical/TECHNICAL-ARCHITECTURE.md` → diagram alur deteksi evidence-delta
