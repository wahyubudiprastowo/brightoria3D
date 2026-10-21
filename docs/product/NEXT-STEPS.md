> **Update 20 Oktober 2026 - Identity server:** login email/password, sesi
> admin, registry pengguna private Blob, dan pencatatan pulau yang dibuka sudah
> aktif. Prioritas identity berikutnya adalah memasang Google OAuth Client ID
> resmi, recovery password, relasi orang tua-anak, RBAC/2FA, dan sinkronisasi
> evidence/mastery lintas perangkat.

> **Update 19 Oktober 2026:** frontend Premium gate dan modal empat paket
> sudah selesai untuk Quran/Arabic/Adab. Prioritas produksi berikutnya adalah
> backend checkout dan verifikasi entitlement; frontend tidak boleh membuka
> materi hanya berdasarkan klaim pembayaran pengguna.

> **Checkpoint 20 September 2026:** status lama di bawah adalah riwayat patch, bukan
> inventaris terkini. Audit kode/startup, daftar model terpasang, ukuran aktual,
> dan batas validasi tersedia di [GLB-ASSETS.md](../technical/GLB-ASSETS.md).
> Enam game mandiri aktif, ditambah Latihan/SkyRun/Froggy/Ekspedisi. Quran,
> Arabic, dan Digital memakai GLB lokal; menara membuka Latihan; pesawat dipakai peta/SkyRun.
> Quran memakai `meshy-pulauquran2.glb`; model Quran lama kini menjadi pulau Arabic.
> Semua konten kurikulum AI tetap **draft** menunggu pengesahan Bright Academy.

# Next Steps — Roadmap Setelah Patch 10

## Checkpoint saat ini (diverifikasi dari kode, bukan asumsi dokumen lama)

```text
[DONE] Peta 3D interaktif (drag rotate, scroll zoom) dengan aset visual asli
[DONE] Integrasi aset map lokal (sky, connector route, waypoint marker) — Patch 08
[DONE] Regresi formasi cincin/kedalaman-3D peta DIPERBAIKI — Patch 10
[DONE] Fallback 2D jika WebGL gagal
[DONE] SEMUA 6 dunia punya game sungguhan (bukan 2 seperti salah tercatat
       di Patch 09): Numeria, Digital, Arabic (mandiri) + Quran/Adab/English
       (via mesin kuis bersama QuizGame.tsx)
[DONE] Juice kit (confetti, streak, count-up XP, punch) dipasang di
       keempat implementasi game — Patch 10
[DONE] AppErrorBoundary + styles.css file tunggal
[DONE] Dokumentasi disinkronkan ulang dengan kode aktual — Patch 10
[DONE] Pembersihan repo utama sesuai kontrak AGENTS.md
[BELUM] Validasi resmi tim akademik Bright Academy atas SEMUA konten kurikulum
[DONE] Frontend Premium gate + modal paket untuk Quran/Arabic/Adab
[DONE] Portal admin dengan autentikasi server, cookie HttpOnly, dan registry pengguna privat
[DONE] Login pemain email/password serta pencatatan pulau yang dibuka lintas perangkat
[BELUM] Aktivasi Google OAuth, recovery password, RBAC/2FA, sinkronisasi
        mastery, payment gateway, verifikasi entitlement, audit log, dan meeting
[BELUM] Build Android end-to-end
```
## ⚠️ Koreksi penting dari roadmap Patch 09

Dokumen Patch 09 sebelumnya merekomendasikan **"Patch 10: bangun mini-game
Benteng Digital"** sebagai prioritas utama. Ini **keliru** — `DigitalGame.tsx`
sudah ada dan berfungsi sejak Patch 05. Jangan membangun ulang game yang
sudah ada; verifikasi dulu status aktual di `GAMEPLAY-CATALOG.md` (yang
sudah diperbaiki di Patch 10) sebelum menerima rekomendasi patch lama
begitu saja.

## Prioritas segera

1. **Aktifkan Google OAuth resmi** dengan OAuth Client ID Bright Academy pada
   environment Vercel dan origin produksi yang benar.
2. **Verifikasi manual di browser** bahwa peta dan enam game tetap bekerja
   setelah login:
   - Peta: putar dengan drag — pastikan pulau-pulau terlihat saling
     menyalip depan-belakang (efek paralaks), bukan sekadar bergeser datar.
   - Setiap dari 6 game: pastikan confetti muncul saat jawaban benar
     pertama dan saat menyelesaikan dunia; pastikan indikator streak
     muncul setelah 2 jawaban benar berturut-turut; pastikan tidak ada
     regresi pada evidence/mastery/XP (angka yang tersimpan harus identik
     dengan sebelum Patch 10).
3. **Mulai proses validasi akademik** — ini sekarang jadi blocker utama
   sebelum konten dipakai siswa sungguhan, karena SEMUA 6 dunia sudah
   punya mekanik game yang berfungsi. Prioritaskan Al-Qur'an (paling
   sensitif) dan Bahasa Arab (72 kartu draft) lebih dulu.

## Kandidat Patch 11+ (belum dikerjakan, urutan bisa didiskusikan ulang dengan user)

### A. Perdalam juice per-dunia
Juice kit Patch 10 seragam di semua game (confetti/streak/punch generik).
Bisa diperdalam per-dunia sesuai karakter masing-masing, misalnya:
- Numeria: animasi 3D lebih kaya (jembatan bercahaya, partikel di scene
  3D memakai `<Sparkles>` dari drei alih-alih canvas 2D overlay).
- Arabic Safari: transisi antar-jejak yang lebih hidup, animasi karakter
  berjalan di peta mini.
- Digital: animasi kartu "terbalik" (flip) saat menilai aman/tidak aman.

### B. Adab Story Quest (narasi bercabang)
Draft konsep sudah ada di `GAMEPLAY-CATALOG.md` — mengubah Kampung Adab
dari kuis pilihan-ganda generik menjadi skenario naratif dengan konsekuensi
cerita. Ini akan membuat Kampung Adab terasa lebih unik dibanding
Quran/English yang juga memakai mesin kuis yang sama.

### C. Tajwid Sound Match (Al-Qur'an, PERLU AUDIO BERSERTIFIKAT)
Draft konsep sudah ada. **WAJIB** ada proses validasi konten dengan tim
tahsin/tahfidz Bright Academy dan sumber rekaman audio qari bersertifikasi
sebelum mulai coding — ini bukan sekadar keputusan teknis.

### D. Adaptive recommendation lintas dunia
Parent dashboard (`Parent()` di `App.tsx`) sudah menghitung mastery
rata-rata dan rekomendasi dunia terlemah secara otomatis dari evidence
nyata (bukan lagi statis) — ini sudah selesai sejak sebelum Patch 10.
Pengembangan lanjutan: rekomendasi tutor berbasis pola kesalahan spesifik,
bukan hanya mastery agregat.

## Prinsip yang tetap berlaku

```text
1. Selalu patch incremental tanpa dependency baru kecuali tidak terhindarkan
2. styles.css SELALU file lengkap
3. Setiap Canvas Three.js WAJIB punya ErrorBoundary + fallback non-3D
4. Peta dunia WAJIB tetap 3D interaktif DENGAN variasi Z formasi cincin —
   jangan biarkan worlds.ts tertimpa balik ke versi datar (sudah terjadi
   dua kali: sebelum Patch 06, dan lagi di Patch 08)
5. Konten kurikulum yang ditulis AI SELALU berstatus draft sampai disahkan
   tim akademik Bright Academy — untuk SEMUA dunia, termasuk yang
   mekaniknya sudah selesai
6. Update dokumentasi di akhir SETIAP patch — DAN verifikasi klaim
   terhadap kode aktual, jangan hanya menyalin klaim patch sebelumnya
7. Efek juice (confetti/streak/punch/count-up) WAJIB tetap dekoratif murni
```

