# Cara Pasang Patch 16 — PERBAIKAN KRITIS (pulau & background hilang)

## Mohon maaf — ini bug yang saya buat sendiri di Patch 15

Screenshot Anda ("pulau dan background hilang, cuma label mengambang")
menunjukkan bug fatal yang berasal dari fitur `SkySparkles` (kelap-kelip
langit) yang saya tambahkan di Patch 15. Berikut penjelasan sederhananya:

## Apa yang sebenarnya terjadi

Kode `SkySparkles` di Patch 15 mengira setiap "kelip" langsung berupa objek
gambar 3D, padahal setiap kelip dibungkus komponen `<Billboard>` yang
membuat lapisan pembungkus tambahan di dalamnya. Akibatnya, kode salah
mengambil objek dan berusaha mengubah properti yang tidak ada di sana —
menghasilkan error JavaScript.

**Yang membuat ini fatal**: error tersebut terjadi di dalam "loop animasi"
3D (bagian yang menggambar ulang layar berkali-kali per detik), BUKAN di
proses render halaman biasa. Jaring pengaman error yang sudah ada di
proyek ini (`ErrorBoundary`) **hanya bisa menangkap error di proses render
biasa**, tidak bisa menangkap error di loop animasi. Jadi begitu error
ini terjadi pada frame pertama, **seluruh proses menggambar 3D berhenti
total** — pulau, langit, tanah, awan, maskot Bri, semuanya tidak pernah
tergambar sama sekali. Yang masih terlihat cuma label nama pulau, karena
itu elemen teks biasa (bukan bagian dari gambar 3D), jadi tidak
terpengaruh.

## Perbaikan Patch 16

1. **Bug `SkySparkles` diperbaiki** — sekarang setiap kelip punya
   referensi langsung ke objeknya sendiri, tidak lagi menebak struktur.
2. **Pengaman tambahan (`useSafeFrame`)** dipasang di SEMUA animasi 3D di
   file ini — jika suatu saat ada bug serupa lagi pada satu efek tertentu,
   sekarang HANYA efek itu yang gagal (dicatat ke log, lalu diabaikan),
   **bukan seluruh peta ikut hilang**. Ini perbaikan sistemik, bukan
   sekadar menambal satu bug.

**Tidak ada perubahan visual lain** — background, dot, dan maskot Bri
kembali ke tampilan Patch 15 yang seharusnya (belum sempat Anda lihat
karena keburu crash).

## File yang berubah

```
src/components/WorldScene.tsx   -> TIMPA total
src/components/BriMascot.tsx    -> TIMPA total (hanya ditambah pengaman,
                                     tidak ada perubahan visual)
```

## Langkah pemasangan

1. `Ctrl+C` hentikan `npm run dev`.
2. Timpa kedua file di atas.
3. Jalankan:
   ```powershell
   npm run typecheck
   npm run build
   npm run dev
   ```
4. **Hard refresh**: `Ctrl+Shift+R`.

## Uji coba

1. Peta harus kembali menampilkan **background gradient biru-pink-emas**,
   **pulau-pulau dengan bayangan**, **dot penghubung besar berkedip**, dan
   **maskot Bri** — semua yang seharusnya sudah muncul di Patch 15.
2. Buka `F12` → tab **Console** — pastikan TIDAK ADA lagi error merah
   bertuliskan `Cannot set properties of undefined (setting 'opacity')`.
3. Drag untuk memutar peta — pastikan semua elemen (pulau, dot, maskot)
   ikut bergerak sesuai rotasi kamera.

## Jika MASIH ada masalah setelah patch ini

Karena ini sudah cukup banyak iterasi, jika masih ada error, mohon
**screenshot tab Console (F12)** saat halaman peta pertama kali dimuat —
pesan error di situ akan langsung menunjukkan penyebab pastinya tanpa
perlu saya menebak lagi.
