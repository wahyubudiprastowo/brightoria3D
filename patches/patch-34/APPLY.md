# Cara Pasang Patch 34 — Ruang Orang Tua Berbasis Data Nyata

## Masalah yang dipecahkan

Parent dashboard yang ada di `App.tsx` sejak **Patch 02** menampilkan angka **hardcoded**:

```
Mastery pekan ini : 73%   <- angka tetap, tidak pernah berubah
Streak            : 4     <- angka tetap, tidak menghitung hari main
Rekomendasi       : teks statis
```

Artinya: apa pun yang anak kerjakan, orang tua melihat angka yang **sama terus** — praktis informasi palsu.

Patch ini menambahkan **Ruang Orang Tua** yang membaca progres **nyata** dari 6 dunia.

## Apa yang ditampilkan

| Data | Sumber |
|---|---|
| Rata-rata penguasaan | Dihitung dari bintang nyata tiap dunia |
| Total bintang | Dijumlahkan lintas 6 dunia |
| Streak hari | **Dihitung nyata** dari tanggal anak membuka aplikasi |
| Per-pulau | Bintang, materi terkumpul, persentase masing-masing |
| Rekomendasi | Dirumuskan dari data — menunjuk dunia yang benar-benar terlemah |

Kalau anak **belum pernah main**, panel jujur berkata *"Belum ada aktivitas belajar yang tercatat"* — tidak berpura-pura ada kemajuan.

## Cara kerjanya (tanpa mengubah App.tsx)

Saya **tidak punya salinan `App.tsx` Anda**, jadi panel ini memakai pola yang **sudah terbukti** di proyek ini (`juice3d.ts` Patch 29, `kidsUi.ts` Patch 32): modul yang memasang dirinya sendiri lewat satu baris import.

Hasilnya: tombol **"📊 Orang Tua"** di pojok kiri-bawah yang:
- **Otomatis tersembunyi** saat overlay game apa pun terbuka — tidak akan pernah menutupi tombol gameplay
- Diberi label jelas agar anak tidak salah tekan
- Bisa ditutup dengan tombol ×, klik di luar panel, atau tekan `Esc`

## Jaminan keamanan

`progressHub.ts` **hanya membaca** localStorage — tidak pernah menulis/menghapus data evidence milik game manapun. Satu-satunya yang ditulis adalah kunci **baru** miliknya sendiri (`brightoria.activity.v1`) untuk mencatat hari aktif.

Modul ini juga **tidak mengimpor file game apa pun** — jadi nol risiko error build meskipun ada dunia yang belum terpasang di proyek Anda.

## File dalam patch ini

```
src/game/progressHub.ts     -> BARU (agregator lintas-dunia)
src/game/ParentInsight.tsx  -> BARU (panel + tombol self-mounting)
```

Hanya 2 file baru. **Tidak menimpa apa pun.**

## Langkah pemasangan

1. `Ctrl+C` hentikan `npm run dev`.
2. Salin kedua file ke `src/game/`.
3. **Tambahkan satu baris** di `src/main.tsx`:
   ```typescript
   import './game/ParentInsight';
   ```
   Jika Anda sudah punya `import './game/juice3d';` dan `import './game/kidsUi';` dari patch sebelumnya, taruh baris baru ini tepat di bawahnya.
4. Jalankan:
   ```powershell
   npm run typecheck
   npm run build
   npm run dev
   ```
5. **Hard refresh**: `Ctrl+Shift+R`.

## Uji coba

1. Buka aplikasi — muncul tombol **"📊 Orang Tua"** di pojok kiri-bawah
2. Klik → panel terbuka menampilkan data nyata (atau pesan "belum ada aktivitas" jika memang kosong)
3. Tutup panel, **mainkan satu level** di dunia mana pun sampai selesai
4. Buka panel lagi — angkanya **berubah** sesuai yang baru dikerjakan
5. Buka game mana pun → tombol "Orang Tua" **otomatis hilang**, tidak menghalangi gameplay
6. Tutup game → tombol muncul lagi
7. Besok buka aplikasi lagi → streak jadi **2 hari**

## Catatan soal streak

Streak dihitung dari tanggal **membuka aplikasi**, dicatat sejak patch ini dipasang. Jadi saat pertama kali dibuka, streak = **1 hari** (bukan melanjutkan angka 4 yang hardcoded sebelumnya — itu memang tidak pernah nyata).

## Dashboard lama di App.tsx

Dashboard lama (mode "Orang Tua" di bottom nav) **tidak saya sentuh** — masih ada dengan angka hardcoded-nya. Kalau mau saya ganti isinya dengan data nyata, kirimkan `App.tsx` ke chat atau upload zip proyek terbaru.

---

## Sisa PR education & game (audit jujur)

| Area | Kondisi | Saran |
|---|---|---|
| **Pengulangan materi** | ❌ Kata yang sudah dipelajari tidak pernah muncul lagi | Bangun mode "Latihan Harian" yang menarik kembali materi lama — **ini celah pedagogi terbesar** |
| **Konten tipis** | Numeria 5 level, Digital 5 kartu, English 12 kata | Perlu ditambah, idealnya dari buku ajar resmi |
| **Validasi akademik** | Semua konten masih draft AI | Perlu review guru sebelum produksi |
| **Sinkronisasi** | Progres hanya di 1 perangkat | Perlu backend jika mau lintas-perangkat |

Yang paling berdampak untuk dikerjakan berikutnya: **mode Latihan Harian**. Kalau mau, saya bisa bangun itu di patch selanjutnya.
