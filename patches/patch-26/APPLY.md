# Cara Pasang Patch 26 — Kampung Adab: "Kisah Pilihan" (Cerita Bercabang)

## Menjawab pertanyaan "sekarang gameplay yang membedakan gimana?"

Setelah Oasis Bahasa Arab punya mekanik unik (kartu-flash → kuis → cocokkan), giliran **Kampung Adab** — dan mekaniknya **beda total**: bukan kuis, bukan mencocokkan, tapi **cerita bercabang (branching story)**.

## Kenapa mekanik ini yang dipilih (dipikirkan sebelum coding)

Materi Kampung Adab (nilai karakter, kebiasaan baik) bersifat **situasional** — tidak ada satu jawaban paling benar yang cocok diuji pilihan ganda konvensional, melainkan gradasi kualitas tindakan. Jadi:

```
Skenario nyata sehari-hari → Anak pilih tindakan → Lihat konsekuensi cerita
```

**Tidak ada vonis benar/salah.** Setiap pilihan dapat 1-3 bintang (best/good/needsWork), tapi ketiganya tetap dapat konsekuensi cerita yang masuk akal + pesan reflektif yang mendidik — tidak ada yang terasa seperti "hukuman" atau vonis kepribadian anak.

## 8 Bab yang sudah dibuat (draft, siap divalidasi tim karakter)

```
1. Bangun Pagi              5. Waktu Makan
2. Menolong Ibu             6. Mainan Kesukaan
3. Giliran Berbicara        7. PR yang Belum Selesai
4. Uang yang Ditemukan      8. Berkunjung ke Rumah Teman
```

Masing-masing punya 3 pilihan tindakan dengan konsekuensi cerita berbeda.

## Fitur "Buku Kisah" — pendorong replay

Setiap kombinasi bab+pilihan yang pernah dicoba (24 total: 8 bab × 3 pilihan) tercatat di **Buku Kisah**. Anak didorong mengulang bab yang sama dengan pilihan berbeda untuk melengkapi koleksi — rasa penasaran "kalau aku pilih yang lain, ceritanya jadi apa?" jadi motor keterlibatan, beda dari mekanik "benar vs salah" di dunia lain.

## ⚠️ Catatan jujur

1. **Konten skenario adalah DRAFT AI** berdasarkan nilai adab umum (hormat orang tua, jujur, tanggung jawab, adab pergaulan) — bukan kutipan kitab/kurikulum resmi tertentu. **Wajib direview tim karakter/akademik Bright Academy** sebelum dipakai siswa sungguhan secara luas.
2. **Saya tidak punya visibilitas ke isi `AdabGame.tsx`/`App.tsx` Anda saat ini** — file ini ditulis mengikuti kontrak yang SUDAH TERBUKTI cocok untuk dunia lain (`computeMastery`, `completed: string[]`, props `onExit`/`onXpEarned`) berdasarkan pola yang berhasil di Oasis Bahasa Arab. **Jika muncul error saat `npm run build`, kirimkan pesan errornya** — polanya sudah terbukti bisa diperbaiki cepat (lihat riwayat Patch 20).
3. Tidak ada gambar karakter baru di patch ini (pakai emoji + ikon) — supaya patch ini fokus dan cepat diuji dulu sebelum menambah aset visual.

## File yang ditambahkan/ditimpa

```
src/game/adab/AdabGame.tsx   -> TIMPA (path sama seperti komponen lama)
src/game/adab/scenarios.ts   -> BARU (konten 8 bab cerita)
src/game/adab/evidence.ts    -> TIMPA/BARU (pelacakan progres + koleksi)
```

## Langkah pemasangan

1. `Ctrl+C` hentikan `npm run dev`.
2. Timpa/tambahkan 3 file di atas ke `src/game/adab/`.
3. Jalankan:
   ```powershell
   npm run typecheck
   npm run build
   npm run dev
   ```
4. **Hard refresh**: `Ctrl+Shift+R`.

## Uji coba

1. Klik Pulau Kampung Adab → Mainkan sekarang.
2. Peta menampilkan **8 bab** — hanya Bab 1 (Bangun Pagi) yang terbuka.
3. Klik Bab 1 → muncul skenario ("Matahari baru saja terbit...") dengan **3 pilihan tindakan** (bukan pertanyaan kuis).
4. Pilih salah satu → muncul **konsekuensi cerita** + jumlah bintang + pesan reflektif.
5. Klik "Coba pilihan lain" → ulangi bab yang sama, pilih opsi berbeda, lihat cerita yang berbeda pula.
6. Kembali ke peta → Bab 2 terbuka.
7. Klik tombol **"Kisah (x/24)"** di pojok kanan atas → Buku Kisah menampilkan bab mana yang pilihannya sudah/belum pernah dicoba semua.

## Jika ada error saat build

Kemungkinan besar karena kontrak nama fungsi/tipe di `App.tsx` untuk dunia `adab` sedikit berbeda dari yang saya asumsikan. **Kirimkan pesan error TypeScript lengkap** — sesuai pengalaman Oasis Bahasa Arab, ini biasanya bisa diperbaiki dalam satu kali iterasi cepat begitu saya tahu kontrak persisnya dari pesan error.

## Rencana selanjutnya

Setelah Kampung Adab dikonfirmasi berjalan, dua dunia tersisa (Taman Al-Qur'an, English Harbor) masih memakai mesin kuis generik yang sama. Kandidat mekanik untuk keduanya:
- **Taman Al-Qur'an**: puzzle mengenali bentuk huruf hijaiyah (berdiri sendiri vs bersambung)
- **English Harbor**: dengar & pilih (memanfaatkan suara Inggris yang jauh lebih andal ketimbang Arab di kebanyakan perangkat) atau susun kalimat drag-and-drop
