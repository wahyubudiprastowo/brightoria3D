# Cara Pasang Patch 35 — Latihan Harian (Pengulangan Berjarak)

## Masalah yang dipecahkan

Sampai Patch 34, materi yang sudah dikuasai anak **tidak pernah muncul kembali**. Anak bisa menyelesaikan 28 huruf Hijaiyah, lalu materi itu hilang selamanya dari alur permainan.

Ini **celah pedagogi terbesar** yang tercatat di audit — tanpa pengulangan berjarak, materi yang baru dipelajari cepat memudar dari ingatan.

## Cara kerjanya

Setiap materi ditempatkan di salah satu dari 5 **kotak Leitner**. Makin tinggi kotaknya, makin lama jeda sebelum materi itu ditanyakan lagi:

```
Kotak 1  ->  diulang besok         (1 hari)
Kotak 2  ->  diulang 2 hari lagi
Kotak 3  ->  diulang 4 hari lagi
Kotak 4  ->  diulang seminggu lagi
Kotak 5  ->  diulang 2 minggu lagi  (sudah kuat)
```

- Jawaban **benar** → naik satu kotak (jeda makin panjang)
- Jawaban **salah** → kembali ke Kotak 1 (diulang besok)

Dipilih Leitner (bukan algoritma seperti SM-2) karena anak kecil tidak bisa menilai sendiri seberapa yakin jawabannya — sistem benar/salah sederhana sudah efektif sekaligus mudah dipahami orang tua yang memantau.

## Dari mana materinya?

Otomatis diambil dari `collectedWords` — kata-kata yang **sudah pernah dijawab benar** anak di:

| Dunia | Jumlah materi |
|---|---|
| 🕌 Taman Al-Qur'an | 112 kata |
| 🐪 Oasis Bahasa Arab | 110 kata |
| ⛵ English Harbor | 12 kata |

Anak hanya dilatih materi yang **sudah pernah dia kuasai** — bukan materi baru yang belum diajarkan.

## Prinsip desain untuk anak

- Sesi **pendek** (maksimal 8 soal) agar tidak melelahkan
- Jawaban salah **tidak dihukum** — langsung diperlihatkan jawaban benar dengan nada menyemangati
- Kekuatan hafalan tampil sebagai **titik-titik terisi**, memberi rasa kemajuan yang terlihat
- Arah soal **berselang-seling**: kadang "apa artinya?", kadang "mana kata yang tepat?"

## File dalam patch ini

```
src/game/reviewDeck.ts       -> BARU (kamus 234 materi)
src/game/dailyPractice.ts    -> BARU (mesin penjadwalan Leitner)
src/game/DailyPractice.tsx   -> BARU (panel + tombol self-mounting)
```

**Tiga file baru. Tidak menimpa apa pun.**

## Langkah pemasangan

1. `Ctrl+C` hentikan `npm run dev`.
2. Salin ketiga file ke `src/game/`.
3. **Tambahkan satu baris** di `src/main.tsx`:
   ```typescript
   import './game/DailyPractice';
   ```
   Jika sudah ada baris dari patch sebelumnya, taruh di bawahnya:
   ```typescript
   import './game/juice3d';        // Patch 29
   import './game/kidsUi';         // Patch 32
   import './game/ParentInsight';  // Patch 34
   import './game/DailyPractice';  // Patch 35  <- TAMBAHKAN INI
   ```
4. Jalankan:
   ```powershell
   npm run typecheck
   npm run build
   npm run dev
   ```
5. **Hard refresh**: `Ctrl+Shift+R`.

## Uji coba

1. Buka aplikasi — muncul tombol **"🔁 Latihan"** di pojok **kanan-bawah** (berseberangan dengan tombol "📊 Orang Tua" di kiri, tidak bertabrakan)
2. Jika anak belum pernah main, klik tombol → panel jujur berkata *"Belum ada yang bisa dilatih"* dan mengarahkan bermain dulu
3. **Mainkan beberapa level** di Taman Al-Qur'an / Oasis Bahasa Arab / English Harbor
4. Kembali ke peta — tombol Latihan sekarang menampilkan **angka merah** (jumlah materi yang perlu diulang)
5. Klik → sesi 8 soal dimulai, materi diambil dari yang sudah dikuasai lintas dunia
6. Jawab beberapa benar & sengaja salah beberapa
7. Selesai → layar hasil dengan skor dan ringkasan kekuatan
8. Buka lagi hari ini → materi yang tadi **benar** tidak muncul lagi (dijadwalkan besok/lusa)
9. Buka game mana pun → tombol Latihan **otomatis hilang**, tidak menghalangi gameplay

## ⚠️ Catatan jujur

**Kamus materi diduplikasi.** Kosakata di `reviewDeck.ts` adalah salinan mandiri dari `curriculum.ts` masing-masing dunia. Alasannya: mengimpor langsung berisiko build error jika ada dunia yang belum terpasang/berbeda versi — dan riwayat proyek ini sudah beberapa kali mengalami itu (Patch 20, Patch 26).

**Konsekuensinya**: jika suatu saat kosakata di dunia diubah, kamus ini perlu disunting manual juga. ID yang tidak ditemukan di kamus akan dilewati dengan aman (tidak error, hanya tidak muncul sebagai soal).

**Tidak termasuk latihan:**
- Dialog Oasis Bahasa Arab (kalimat percakapan penuh — kurang cocok untuk latihan kilat)
- Kampung Adab (yang dikoleksi adalah pilihan cerita, bukan kosakata — tidak ada "jawaban benar")
- Pulau Numeria & Benteng Digital (tidak punya konsep koleksi kata)

---

## Sisa PR setelah patch ini

| Prioritas | Area | Kondisi |
|---|---|---|
| 1 | **Konten tipis** | Numeria 5 level, Digital 5 kartu, English 12 kata — cepat habis |
| 2 | **Validasi akademik** | Semua konten masih draft AI, perlu review guru |
| 3 | **Sinkronisasi** | Progres hanya di 1 perangkat, ganti HP = hilang |
| 4 | **Dashboard lama** | Mode "Orang Tua" di App.tsx masih pakai angka hardcoded |

Untuk **nomor 4**, saya perlu isi `App.tsx` Anda agar bisa mengganti angka palsu itu dengan data nyata dari `progressHub.ts` (Patch 34). Kirimkan filenya jika ingin dikerjakan.
