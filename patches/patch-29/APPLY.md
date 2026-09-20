# Cara Pasang Patch 29 — Lapisan "3D Juice" Universal (1 File Baru + 1 Baris)

## Menjawab permintaan: "gameplay lebih menarik, misal 3D play, tapi gak banyak ubah sekarang"

Alih-alih menulis ulang setiap game jadi scene 3D penuh (perubahan besar, berisiko terhadap 5 game yang sudah bekerja), patch ini menambahkan **satu file baru** yang secara otomatis memberi efek 3D ke kartu-kartu yang **sudah ada** di semua dunia — cukup dengan **menambahkan 1 baris import**. Tidak ada file game (App.tsx, ArabicGame.tsx, QuranGame.tsx, AdabGame.tsx, DigitalGame.tsx, NumeriaGame.tsx) yang perlu disentuh sama sekali.

## Apa efeknya secara teknis (kejujuran soal cakupan)

Ini **CSS 3D transform sungguhan** (`perspective()` + `rotateX/rotateY`, bagian resmi CSS, bukan trik visual 2D) — seperti efek "tilt card" di aplikasi kartu premium. **Bukan** scene Three.js penuh untuk 5 dunia lain (Pulau Numeria sudah punya 3D asli lewat jembatan pecahannya sejak awal). Tiga efek yang ditambahkan:

1. **Tilt mengikuti kursor** (desktop) — kartu miring 3D mengikuti posisi mouse Anda
2. **Tekan-3D** (mouse & sentuh/HP) — kartu "masuk" sedikit ke layar saat ditekan, lalu pegas kembali
3. **Pop-in 3D** — kartu baru yang muncul (ganti peta, buka koleksi, dst) masuk dengan animasi 3D singkat, bukan langsung nongol datar

## ⚠️ Pengecualian keamanan yang sengaja saya buat

Kartu drag-garis di Taman Al-Qur'an (`.hijaiyah-match-item`, Patch 28) **sengaja tidak** dimasukkan ke efek tilt/tekan — supaya tidak mengganggu mekanik drag yang baru saja diperbaiki. Kartu itu tetap dapat efek pop-in saat huruf baru dibuka (aman, karena animasi itu hanya jalan sekali saat muncul, bukan saat sedang di-drag).

## File yang ditambahkan

```
src/game/juice3d.ts   -> BARU (satu-satunya file baru di patch ini)
```

## ⚠️ SATU langkah manual yang wajib dilakukan

Buka `src/main.tsx` Anda, tambahkan **satu baris** di bagian atas (dekat import lain), sebelum baris `ReactDOM.createRoot(...)`:

```typescript
import './game/juice3d';
```

Contoh (`main.tsx` versi Patch 04, sesuaikan jika struktur Anda sudah berbeda):

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AppErrorBoundary } from './ErrorBoundary';
import './styles.css';
import './game/juice3d';  // <-- TAMBAHKAN BARIS INI

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </React.StrictMode>
);
```

Posisi baris impor di antara import lain tidak penting (bisa di mana saja asal sebelum render) — yang penting file-nya ter-import sekali saja di titik masuk aplikasi.

## Langkah pemasangan lengkap

1. `Ctrl+C` hentikan `npm run dev`.
2. Salin `src/game/juice3d.ts` ke proyek Anda persis di path yang sama.
3. Tambahkan satu baris import di `src/main.tsx` seperti contoh di atas.
4. Jalankan:
   ```powershell
   npm run typecheck
   npm run build
   npm run dev
   ```
5. **Hard refresh**: `Ctrl+Shift+R`.

## Uji coba

1. Buka aplikasi, masuk ke dunia manapun yang sudah punya kartu (Oasis Bahasa Arab, Kampung Adab, Taman Al-Qur'an).
2. **Gerakkan mouse perlahan di atas sebuah kartu** (mis. kartu pos di peta Oasis Bahasa Arab) — kartu harus terlihat **miring mengikuti posisi kursor**, dengan bayangan yang ikut berubah.
3. **Klik dan tahan** sebuah kartu — kartu harus terlihat sedikit "masuk" ke dalam layar, lalu **pegas kembali** dengan efek memantul halus saat dilepas.
4. Buka **Buku Koleksi** atau berpindah antar layar — kartu-kartu yang baru muncul harus punya animasi **masuk 3D singkat** (miring lalu tegak), bukan langsung muncul datar.
5. Khusus Taman Al-Qur'an: pastikan **drag-garis untuk mencocokkan huruf tetap berfungsi normal** seperti sebelumnya — kartu huruf yang dipakai drag TIDAK boleh ikut miring/tekan (ini pengecualian yang disengaja).
6. Coba di HP/tablet (sentuh) — efek tilt-kursor tidak akan muncul (memang khusus mouse), tapi efek "tekan-3D" harus tetap terasa saat kartu disentuh.

## Cara memperluas efek ke elemen lain nanti (tanpa patch baru)

Tambahkan atribut `data-tilt` pada elemen JSX apa pun (untuk tilt+tekan) atau `data-pop3d` (untuk pop-in saja) langsung di kode game manapun — modul ini otomatis mendeteksinya tanpa perlu diubah lagi. Contoh:

```tsx
<button className="my-custom-card" data-tilt>...</button>
```

## Jika efek terasa mengganggu atau berlebihan

Semua sudah menghormati pengaturan sistem "Reduce Motion" (Windows: Settings → Accessibility → Visual effects). Jika masih terasa terlalu kuat meski sudah sesuai standar aksesibilitas, beri tahu saya — sudut tilt maksimum (saat ini ±4.5°) dan kekuatan efek tekan bisa disesuaikan dengan mudah karena semua angkanya terpusat di satu file.

## Jika ada error saat build

Modul ini murni TypeScript vanilla (tidak memakai React/JSX sama sekali), jadi risiko error build sangat kecil. Jika tetap terjadi, kirimkan pesan error lengkapnya.
