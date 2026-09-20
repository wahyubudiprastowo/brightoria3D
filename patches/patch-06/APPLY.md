# Brightoria Patch 06 — Panduan Pasang & Verifikasi

Pos: 13 September 2026 · Topik: Peta kembali Three.js 3D (bisa diputar),
gap antar-pulau dirapatkan, modal demo jujur (tanpa +50 XP palsu).

## Ringkasan perubahan

| File | Perubahan |
|---|---|
| `src/components/WorldScene.tsx` | Ditulis ulang total: scene Three.js 3D (OrbitControls, Float, Sparkles, Html label, bukit 3D cone + ilustrasi sprite); fallback DOM otomatis bila WebGL tidak ada; posisi 3D ring radius 4.3 (gap antar-pulau rapat). |
| `src/App.tsx` | `complete()`→`closeChallenge()` (hapus +50 XP demo palsu); modal demo jujur "Segera hadir · alur belajar Bright"; kompas "Putar peta • geser • ketuk pulau". |
| `src/styles.css` | Tambah `.island3d-label`, `.modal .choices.coming-soon`, media query mobile. File tetap SATU file lengkap. |
| `AGENTS.md` + docs | Mencatat persetujuan eksplisit user untuk peta 3D; kebijakan anti-imbalan-palsu (aturan #5). |

Tidak ada dependency baru — TIDAK perlu `npm install`.

## Cara pasang

```powershell
cd C:\Users\WP2300419\Documents\VContainer\brightoria
npm run typecheck
npm run build
npm run dev
```

Semua file di tabel sudah dalam kondisi final — cukup jalankan build lalu
buka `http://localhost:5173`.

## Checklist verifikasi manual di browser

1. Peta terbuka sebagai scene 3D.
2. **Drag** di area peta → scene berputar; **scroll/pinch** → zoom.
3. Enam pulau terlihat dekat satu sama lain (gap rapat) — bukan tersebar
   penuh satu halaman; tiap pulau = bukit 3D + ilustrasi asli mengambang.
4. Arahkan kursor ke pulau → cincin putih + label nama & mastery.
5. Ketuk Pulau Numeria → card misi; "Mainkan sekarang" → Fraction Bridge
   (3D + efek suara tetap normal).
6. Ketuk Benteng Digital → Cyber Safety Sorter (Aman/Tidak aman) terbuka.
7. Jawab benar satu kartu sorter → nada "benar" + XP header bertambah.
8. Ketuk salah satu dari 4 dunia demo (mis. Taman Al-Qur'an) → muncul modal
   "Segera hadir · alur belajar Bright" — TIDAK ada tombol "Objek A/B/C"
   dan TIDAK ada "+50 XP". Klik "Kembali ke peta" → modal tertutup, XP
   tidak berubah.
9. Tombol volume di header mematikan/menyalakan suara.
10. Jika ada error → screenshot layar penuh (`AppErrorBoundary` akan
    menampilkan kotak pesan jelas + detail teknis).

## Agen berikutnya (Patch 07)

Baca `docs/product/NEXT-STEPS.md`. Kandidat: mini-game ketiga untuk salah
satu dari empat dunia tersisa, atau adaptive recommendation lintas mastery.
Pertahankan: `styles.css` file lengkap, `AppErrorBoundary`, peta 3D tanpa
`<Environment>` + fallback DOM, dan dilarang imbalan palsu.

## Rollback

Kembalikan tiga file source + dokumentasi ke versi Patch 05 bila user ingin —
tidak ada dependency baru, jadi rollback murni penggantian file.