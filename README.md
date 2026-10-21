# Brightoria

Brightoria adalah aplikasi game-based learning dominan 3D untuk anak usia 6-12 tahun. Produk berjalan di web dan Android, tanpa musik latar, dengan jalur mandiri, tutor 1-on-1, dan homeschooling opsional.

## Quick start

```powershell
npm install
npm run dev:full
```

Buka URL **Local** yang dicetak terminal; port awal sekarang **5174**. Perintah
`dev:full` menjalankan Vite melalui Vercel Dev agar endpoint login di `/api`
ikut aktif. `npm run dev` hanya cocok untuk inspeksi frontend tanpa API.
Port 5173 ditemukan ditempati proxy VS Code pada audit 20 September 2026.
Untuk build produksi, gunakan `npm run preview`, bukan klik `dist/index.html`.

Optimasi dan integrasi GLB: [GLB-ASSETS.md](docs/technical/GLB-ASSETS.md).

Build validation:

```powershell
npm run typecheck
npm run build
```

## Akun dan admin

- Mode Tamu dapat membuka peta dan mencoba game dasar tanpa login. Login email
  diminta saat pengguna ingin menyimpan aktivitas akun atau membuka fitur
  lanjutan, Profil, dan Ruang Orang Tua. Login Google baru tampil aktif setelah
  `GOOGLE_CLIENT_ID` dan `VITE_GOOGLE_CLIENT_ID` resmi dikonfigurasi.
- Portal admin tersedia di `#/admin`; username/password dibaca dari secret
  `ADMIN_USERNAME` dan `ADMIN_PASSWORD` di Vercel.
- `AUTH_SESSION_SECRET` dan private Blob store wajib tersedia. Jangan pernah
  memasukkan kredensial atau token tersebut ke source code.

## Android

```powershell
npm run android:init
npm run android:open
```

Setelah perubahan berikutnya:

```powershell
npm run android:sync
npm run android:open
```

## Source of truth untuk agent baru

Agent/model yang melanjutkan proyek WAJIB membaca berurutan:

1. `AGENTS.md`
2. `docs/agent-context/PROJECT-MEMORY.md`
3. `docs/product/PRODUCT-BLUEPRINT.md`
4. `docs/design/DESIGN-SYSTEM.md`
5. `docs/design/IMAGE-PROMPTS.md`
6. `docs/technical/TECHNICAL-ARCHITECTURE.md`
7. `CHANGELOG.md`
8. `PATCH_NOTES.md`

Jangan mengubah keputusan final tanpa mencatatnya di `DECISIONS.md` dan `CHANGELOG.md`.
