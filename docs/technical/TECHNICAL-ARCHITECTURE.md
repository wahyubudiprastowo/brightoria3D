> **Checkpoint 20 September 2026:** status lama di bawah adalah riwayat patch, bukan
> inventaris terkini. Audit kode/startup, daftar model terpasang, ukuran aktual,
> dan batas validasi tersedia di [GLB-ASSETS.md](../technical/GLB-ASSETS.md).
> Enam game mandiri aktif, ditambah Latihan/SkyRun/Froggy/Ekspedisi. Quran,
> Arabic, dan Digital memakai GLB lokal; menara membuka Latihan; pesawat dipakai peta/SkyRun.
> Quran memakai `meshy-pulauquran2.glb`; model Quran lama kini menjadi pulau Arabic.
> Semua konten kurikulum AI tetap **draft** menunggu pengesahan Bright Academy.

# Technical Architecture — Brightoria

## Stack

```text
React 19 + TypeScript + Vite 7
Three.js + React Three Fiber 9 + Drei 10 — Peta dunia 3D & English 3D puzzle & Numeria 3D bridge
lucide-react — Ikon UI
Capacitor 8 — Packaging Android (web layer bundler)
Vercel Functions — autentikasi dan activity API
Vercel Blob (private) — registry pengguna lintas perangkat
Node crypto — HMAC session token dan password hashing scrypt
```

## Arsitektur Enam Game Dunia

Brightoria memiliki 6 mini-game interaktif independen yang masing-masing mengelola state, evidence, dan storage contract secara terisolasi:

1. **Pulau Numeria (`src/game/numeria/NumeriaGame.tsx`)**:
   - Scene 3D Three.js + R3F (`BridgeScene`).
   - Balok jembatan interaktif untuk operasi hitung dasar kelas 3-6.
   - Drei `<Sparkles>` + `ErrorBoundaryCanvas` (fallback non-3D otomatis).

2. **Benteng Digital (`src/game/digital/DigitalGame.tsx`)**:
   - Cyber Safety Sorter (evaluasi situasi online aman vs tidak aman).
   - DOM UI murni dengan streak badge, feedback visual, dan hint system.

3. **Oasis Bahasa Arab (`src/game/arabic/ArabicGame.tsx`)**:
   - Expedition game "Safari Kata Arab" (72 kartu kosakata).
   - Peta oasis CSS, avatar penjelajah bergerak dengan step animation, kontrol D-pad/WASD/Touch.
   - Ransel kata terakses (glossary dialog) & status live feedback.

4. **Taman Al-Qur'an (`src/game/quran/QuranGame.tsx`)**:
   - Hijaiyah Drag-Line matching (Patch 30).
   - Animasi contoh tutorial otomatis, highlight target drop zone real-time, bentuk huruf (tunggal/awal/tengah/akhir), dan Web Speech API TTS Bahasa Arab.

5. **Kampung Adab (`src/game/adab/AdabGame.tsx`)**:
   - Branching Story narrative / "Kisah Pilihan" (Patch 26).
   - 8 bab skenario adab, 24 pilihan tindakan dengan rating 1-3 bintang, pesan reflektif tanpa vonis salah/hukuman, serta koleksi "Buku Kisah".

6. **English Harbor (`src/game/english/EnglishGame.tsx`)**:
   - 3D Letter-Builder Puzzle (Patch 31) + 12 Island Harbor Adventure.
   - Scene Three.js kubus huruf mengambang 3D dengan `OrbitControls`, ejaan kata target, animasi kapal berlayar ⛵, koleksi peti harta karun, dan Web Speech API TTS Bahasa Inggris.

---

## Modul Utility & Feel (Juice Kit)

- `src/game/juice.tsx`: Confetti particle canvas, `useStreak` / `StreakBadge`, `useCountUp`, dan `usePunch`. Dekoratif murni, idempotent, dan mendukung `prefers-reduced-motion`.
- `src/game/sound.ts`: Web Audio API sound generator (tanpa musik latar/looping, hanya SFX pendek untuk click, correct, wrong, star, win).

---

## Peta Dunia: Teknik 3D Billboard (`src/components/WorldScene.tsx`)

- Tekstur pulau 2D dipasang pada `<Billboard>` Drei dalam ruang 3D dengan `OrbitControls`.
- Formasi ring Z-variation (-1.9 s.d. +1.9) untuk efek paralaks nyata saat diputar.
- Landmark 3D mascot `BriMascot.tsx` melayang menuju pulau terpilih.
- `WorldSceneErrorBoundary`: Fallback otomatis ke grid 2D jika WebGL gagal.

---

## Rendering & Persistence Layers

1. **WebGL World Canvas & 3D Games**: World scene, Numeria arithmetic bridge, English letter puzzle.
2. **Accessible DOM Overlay**: HUD, dialog kuis/misi, parent dashboard, form modal, screen-reader live regions.
3. **Local Persistence**: Keyed `localStorage`:
   - `brightoria.progress.v2`
   - `brightoria.evidence.numeria.v1`
   - `brightoria.evidence.digital.v1`
   - `brightoria.evidence.arabic.v1`
   - `brightoria.evidence.hijaiyah.v1`
   - `brightoria.evidence.adab.v1`
   - `brightoria.evidence.english.v1`

---

## Identity, Security & Service Boundaries

- **Guest-first access**: peta dan game dasar langsung tersedia. `PlayerAuthGate.tsx`
  tampil sebagai modal saat pengguna memilih Masuk/Daftar, Profil, Ruang Orang
  Tua, atau melanjutkan fitur Premium.
- **Email auth**: `/api/auth/email` menyimpan salt dan hash scrypt, tidak pernah password plaintext.
- **Google-ready auth**: `/api/auth/google` memverifikasi Google ID token dan audience pada server; UI baru aktif jika Client ID resmi tersedia.
- **Admin auth**: `/api/admin/login` membandingkan secret environment dan memberi cookie HttpOnly `SameSite=Strict` maksimal 8 jam. Kredensial tidak ada di bundle frontend.
- **Registry privat**: `api/_shared/users.js` menyimpan satu JSON per akun pada private Vercel Blob dengan optimistic concurrency (`ifMatch`). Endpoint admin tidak pernah mengirim hash/salt.
- **Activity**: `/api/activity` mencatat jumlah dan waktu pembukaan enam pulau. Evidence/mastery/XP tetap localStorage per perangkat.
- **Frontend Security**: Kunci rahasia API, OAuth client secret, token pembayaran, dan payout authority DILARANG disimpan di frontend.
- **Service Boundaries (Future API)**:
  - Password recovery, child/parent account linking, RBAC, 2FA, dan audit admin
  - Content & World Manifest
  - Learning Event & Mastery Engine
  - Tutor Marketplace & 1-on-1 Booking
  - Payment & Subscriptions
  - Meeting Provider Adapter (Zoom / Google Meet)

---

## Performance Budget & Code Splitting

- Chunk vendor khusus di `vite.config.ts`:
  - `three-vendor`: Three.js, R3F, Drei (~1.1 MB gzipped ~320 KB).
  - `lucide-vendor`: Ikon UI Lucide (~13 KB).
  - `index.js`: Main app bundle under 200 KB.
- Batas memori aset 3D lokal: max 12 MB total.
- Tekstur lokal disajikan dari `/public/assets` tanpa dependensi CDN eksternal.

---

## Learning Event Contract Draft

Setiap aktivitas memancarkan struktur event:
```json
{
  "familyId": "string",
  "childId": "string",
  "activityId": "string",
  "competencyId": "string",
  "attempt": 1,
  "startedAt": "ISO-8601",
  "completedAt": "ISO-8601",
  "accuracy": 1.0,
  "hintsUsed": 0,
  "responseEvidence": {},
  "deviceProfile": {}
}
```


## Patch 08 — Map asset layer

`WorldScene.tsx` memuat aset map lokal dengan `useLoader(THREE.TextureLoader)`:

- `background_sky_1920x1080.webp` menjadi `scene.background`.
- `connector_dots_curve.webp`, `connector_dots_horizontal.webp`, dan
  `connector_line_horizontal.webp` menjadi tekstur route segment.
- `route_node.webp` menjadi marker waypoint pada midpoint route.

Semua tekstur map/world disetel `THREE.SRGBColorSpace`. `OrbitControls`,
billboard pulau, pencahayaan manual, serta `WorldSceneErrorBoundary` tetap
dipertahankan. Tidak memakai `<Environment>`.

## Peta dunia: teknik "3D billboard" (Patch 05)

### Riwayat perubahan tiga patch terakhir (penting untuk konteks)

```text
Patch 01-03c : Three.js, geometri prosedural (box/cone/sphere) → visual
                terbatas tapi tetap interaktif (drag rotate, scroll zoom)
Patch 04      : DOM/CSS murni, gambar <img> datar → visual bagus TAPI
                kehilangan interaksi 3D — SALAH ARAH, dikoreksi user
Patch 05      : Three.js kembali, TAPI gambar isometrik asli ditempel
                sebagai TEKSTUR pada plane 3D (billboard) → visual bagus
                DAN tetap interaktif (drag rotate, scroll zoom)
```

### Implementasi (`src/components/WorldScene.tsx`)

```text
<Canvas>
  <Scene>
    <Island> per dunia:
      - useLoader(TextureLoader, world.image) — muat WebP sebagai tekstur
      - <Billboard> dari drei — plane selalu menghadap kamera otomatis
      - <mesh><planeGeometry/><meshBasicMaterial map={texture}/></mesh>
      - Glow saat hover/aktif (tekstur island_hover_glow.webp)
      - Ring saat dipilih (tekstur selected_ring.webp)
      - Shadow di bawah pulau (tekstur island_shadow.webp, non-billboard,
        rotasi datar di bidang tanah untuk kesan melayang)
      - Animasi mengambang halus via useFrame (sin wave pada posisi Y)
      - <Html> label dari drei — nama dunia + mastery, tetap DOM (bukan
        tekstur), supaya teks tajam di semua ukuran layar
    <Routes> — tekstur connector lokal menghubungkan pulau; marker waypoint
      memakai route_node.webp pada midpoint setiap route
    <Cloud> — beberapa plane billboard dengan tekstur cloud_1/cloud_2,
      melayang perlahan (useFrame, drift horizontal, wrap around)
    <OrbitControls enablePan={false} minDistance maxDistance
      minPolarAngle maxPolarAngle> — SAMA seperti Patch 02/03, inilah
      yang memberi rasa "bisa diputar-putar"
  </Scene>
</Canvas>
```

### Kenapa aman dipakai di dalam `<Suspense>` (berbeda dari insiden Patch 03)

Insiden Patch 03 (`<Environment preset="park">`) gagal karena mengunduh
file HDR dari **CDN eksternal** secara async tanpa `<Suspense>` yang benar
— jika jaringan lambat/diblokir, macet blank tanpa error. Tekstur pulau di
Patch 05 dimuat dari **`/public/assets`, lokal, dibundel bersama build**.
Begitu `npm run build` atau `npm run dev` berjalan, aset ini disajikan dari
server dev/statis lokal — TIDAK butuh koneksi internet sama sekali,
sehingga load-nya cepat dan reliable, aman dibungkus `<Suspense>` biasa.

### Fallback jika WebGL gagal (`WorldSceneErrorBoundary`)

```text
class WorldSceneErrorBoundary extends React.Component
  → jika <Canvas> Three.js melempar error saat render,
    otomatis tampilkan <FallbackGrid> — grid 2D biasa berisi <img> pulau
    yang tetap bisa diklik untuk memilih dunia, tanpa animasi 3D.
```

Pola ini konsisten dengan `ErrorBoundaryCanvas` yang sudah dipakai di
`NumeriaGame.tsx` sejak Patch 03b — kebijakan proyek: **setiap Canvas
Three.js WAJIB punya jaring pengaman non-3D**, supaya aplikasi tidak
pernah benar-benar blank di perangkat mana pun.

## Struktur folder

```text
src/
├── App.tsx
├── main.tsx                    — membungkus App dengan AppErrorBoundary
├── ErrorBoundary.tsx
├── styles.css                   — file lengkap, ditimpa penuh tiap patch
├── vite-env.d.ts
├── components/
│   └── WorldScene.tsx           — Three.js billboard + WorldSceneErrorBoundary
├── data/
│   └── worlds.ts                 — posisi 3D [x,y,z] + path gambar
└── game/
    ├── progress.ts
    └── numeria/                  — TIDAK BERUBAH dari Patch 03b

public/
└── assets/
    ├── worlds/                   — 6 gambar pulau (dipakai sbg tekstur)
    └── map/                       — cloud_1, cloud_2, island_hover_glow,
                                      selected_ring, island_shadow
```

## Kontrak data `World` (kembali ke posisi 3D)

```typescript
interface World {
  id: string;
  name: string;
  subtitle: string;
  color: string;
  accent: string;
  position: [number, number, number];  // KEMBALI ke 3D, bukan x/y persen
  image: string;                        // path tekstur billboard
  mastery: number;
  missions: number;
}
```

## Premium Access Gate (19 Oktober 2026)

- `src/subscription/premiumAccess.ts` menjadi sumber paket, validasi cache
  entitlement, intent checkout, dan pembentukan URL checkout resmi.
- `Iqra' Jilid 2-6` memakai tier `account`: gratis setelah sesi pemain sah dan
  tidak masuk ke Premium checkout. `Tilawah 30 Juz` tetap bertier Premium.
- `src/subscription/PremiumUpgradeModal.tsx` menampilkan empat paket harga dan
  dipakai bersama oleh `QuranGame`, `ArabicGame`, dan `AdabGame`.
- `VITE_PREMIUM_CHECKOUT_URL` adalah konfigurasi opsional untuk handoff ke
  checkout resmi. Jika kosong atau tidak valid, aplikasi mempertahankan status
  terkunci dan menjelaskan bahwa pembayaran belum terhubung.
- Repository ini belum memiliki backend verifikasi pembayaran. Karena konten
  Premium masih dibundel di frontend, gate saat ini adalah kontrol UX, bukan
  batas keamanan server. Produksi wajib memindahkan materi berbayar ke API
  terautentikasi dan menerbitkan entitlement dari server setelah transaksi sah.

## Portal Admin dan Identity Server (19-20 Oktober 2026)

- `src/admin/AdminPortal.tsx` adalah shell dashboard fullscreen yang dibuka dari
  Ruang Orang Tua, deep link `#/admin`, atau `Ctrl+Shift+A`.
- `src/admin/adminData.ts` tetap membaca evidence/mastery dan data operasional
  lokal, sedangkan tab pengguna memakai registry privat lintas perangkat dari
  `/api/admin/users`.
- Portal menyediakan sembilan tab: Pendaftaran & Pengguna, Tracking Pembayaran,
  Deteksi Transfer Palsu, Keamanan Akun, Subscription Aktif, Afiliasi, Audit
  Log, Pengumuman, dan Laporan. Tab yang membutuhkan backend menampilkan batas
  kesiapan secara eksplisit dan tidak membentuk data sintetis.
- Visualisasi memakai SVG ringan dari evidence enam dunia tanpa dependency baru.
  Draft pengumuman disimpan lokal dan belum disiarkan. Laporan dapat diekspor
  sebagai JSON; verification ID tidak diekspor utuh.
- Portal admin memakai login server terpisah dan cookie HttpOnly bertanda tangan;
  tidak ada lagi kunci admin di `sessionStorage` atau kredensial di bundle.
- Saat portal dibuka, sesi admin lama diakhiri dan gerbang username/password
  selalu ditampilkan. Sesi baru hanya dibuat setelah kredensial diverifikasi server.
- Form admin menyediakan kontrol tampil/sembunyikan password. Pengembangan lokal
  yang memerlukan autentikasi harus memakai `npm run dev:full` (Vercel Dev +
  Vite); `npm run dev` hanya menyediakan frontend dan tidak melayani `/api`.
- `DailyPractice` dan `ExpeditionLauncher` dimuat dalam Mode Tamu agar tombol
  Latihan/Ekspedisi tetap tersedia. `CharacterPicker`, `ParentInsight`,
  `AiCompanion`, dan badge pemain baru dimuat setelah sesi pemain sah.
- Portal admin tetap memakai autentikasi username/password server yang terpisah
  dari sesi pemain dan Mode Tamu.
- Operasi sensitif seperti assign Premium, payment verification, fraud detection,
  password reset, dan audit log belum tersedia. Fitur tersebut harus datang dari
  API terautentikasi dengan RBAC.

## Yang BELUM ada di kode

Frontend Premium gate, handoff checkout, login email, auth admin server, dan
registry pengguna lintas perangkat sudah ada. Yang belum tersedia adalah
aktivasi Google OAuth, recovery password, RBAC/2FA, payment gateway/verifikasi
entitlement, sinkronisasi evidence/mastery, integrasi meeting, audit log, dan
test otomatis/CI-CD. Build Android belum pernah dites end-to-end.
Kurikulum di `GAMEPLAY-CATALOG.md` adalah draft, belum disahkan tim
akademik Bright Academy.
