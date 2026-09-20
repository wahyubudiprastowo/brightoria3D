# Patch 38 — Cinematic Engine + Mode Ekspedisi + Web AI

**Jenis patch:** ADITIF. Tidak ada file lama yang ditimpa, tidak ada dependency baru,
`package.json` tidak berubah. Cukup extract lalu copy folder — sesuai alur kerja
yang biasa Anda pakai.

---

## 1. Apa yang berubah (ringkas)

| Area | Sebelum (Patch 37) | Sesudah (Patch 38) |
|---|---|---|
| **Render** | Tone mapping default, exposure 1.0, tanpa bayangan | ACES Filmic + exposure terkontrol + shadow map lembut (PCFSoft) |
| **Pulau** | Billboard 2D (selalu menghadap kamera) | Alas batu 3D sungguhan (LatheGeometry + vertex color + jitter), seni lama tetap dipakai sebagai kanopi |
| **Laut** | CircleGeometry datar + plane cincin | Gelombang GPU (3 sinus + normal analitik) + fresnel + buih di puncak |
| **Cahaya** | 1 directional + ambient | Rig tiga titik (key/fill/rim) + hemisphere |
| **Post-processing** | Tidak ada | Bloom selektif ambang tinggi + vignette, ditulis sendiri tanpa library |
| **Kamera** | Statis, fov berubah per breakpoint | Fly-in pembuka + fokus lembut ke pulau terpilih (spring) |
| **Kualitas** | Angka tetap di kode | 3 tier otomatis dari deteksi CPU/RAM/GPU/DPR |
| **Gameplay** | Peta → kartu → kuis | **+ Mode Ekspedisi**: arena 3D berbukit, karakter bisa dijalankan, 12 Bintang Ilmu, 6 gerbang dunia dengan progresi |
| **AI** | Tidak ada | Pendamping "Tanya Bri": heuristik lokal offline + LLM opsional (OpenAI-compatible) |

---

## 2. Cara memasang (3 langkah)

### Langkah 1 — Copy file

Extract ZIP ini, lalu copy isinya ke root proyek Brightoria:

```
src/render/quality.ts                        (baru)
src/render/CinematicRig.tsx                  (baru)
src/render/Postfx.tsx                        (baru)
src/components/WorldScene3D.tsx              (baru)
src/components/world3d/Ocean3D.tsx           (baru)
src/components/world3d/Island3D.tsx          (baru)
src/game/expedition/expeditionData.ts        (baru)
src/game/expedition/ExpeditionGame.tsx       (baru)
src/game/expedition/ExpeditionLauncher.tsx   (baru)
src/ai/companion.ts                          (baru)
src/ai/AiCompanion.tsx                       (baru)
docs/PATCH-38-APPLY.md                       (baru)
```

Tidak ada satu pun file lama yang ditimpa. `WorldScene.tsx` lama tetap ada sebagai
jaring pengaman.

### Langkah 2 — Aktifkan di `src/main.tsx`

Tambahkan **dua baris import** di bawah import yang sudah ada:

```ts
import './game/kidsUi';
import './game/ParentInsight';
import './game/uiPolish';
import './game/expedition/ExpeditionLauncher';   // <-- TAMBAHKAN
import './ai/AiCompanion';                        // <-- TAMBAHKAN
```

Setelah ini tombol **🧭 Ekspedisi** dan **✨ Tanya Bri** sudah muncul sendiri.
Belum perlu menyentuh `App.tsx` sama sekali.

### Langkah 3 — Peta 3D baru + jembatan dunia di `src/App.tsx`

**3a. Ganti satu baris impor peta:**

```ts
// LAMA:
import WorldScene from './components/WorldScene';

// BARU:
import WorldScene from './components/WorldScene3D';
```

> Kalau ada masalah di perangkat tertentu, kembalikan baris ini ke versi lama —
> peta Patch 37 hidup lagi persis seperti sebelumnya. Props-nya identik.

**3b. Tambahkan listener supaya gerbang Ekspedisi bisa membuka dunia.**
Di dalam `export default function App()`, tepat **setelah** `useEffect` yang sudah ada:

```tsx
  useEffect(() => {
    function onOpenWorld(e: Event) {
      const detail = (e as CustomEvent<{ worldId?: string }>).detail;
      if (detail && typeof detail.worldId === 'string') {
        const w = worlds.find((x) => x.id === detail.worldId);
        if (w) setSelected(w);
        setGame(detail.worldId);
      }
    }
    function onXp(e: Event) {
      const detail = (e as CustomEvent<{ amount?: number }>).detail;
      if (detail && typeof detail.amount === 'number') setProgress(addXp(detail.amount));
    }
    window.addEventListener('brightoria:open-world', onOpenWorld);
    window.addEventListener('brightoria:xp', onXp);
    return () => {
      window.removeEventListener('brightoria:open-world', onOpenWorld);
      window.removeEventListener('brightoria:xp', onXp);
    };
  }, []);
```

Semua yang dipakai (`useEffect`, `worlds`, `setSelected`, `setGame`, `setProgress`,
`addXp`) sudah diimpor di `App.tsx`, jadi tidak ada impor tambahan.

> **Kalau langkah 3b dilewati:** Ekspedisi tetap jalan normal, hanya gerbang yang
> tidak membuka game dunia. Tidak ada yang rusak.

### Verifikasi

```bash
npm run typecheck
npm run build
```

---

## 3. Checklist uji di browser

- [ ] Peta: drag memutar, scroll/pinch zoom — **pulau kini punya alas batu yang ikut berputar**
- [ ] Saat kamera diputar rendah, permukaan laut terlihat bergelombang dan memantulkan cahaya
- [ ] Saat peta pertama dibuka, kamera meluncur masuk (fly-in) ±1,6 detik
- [ ] Pilih pulau → kristal kecil mengorbit di atasnya, kamera bergeser halus
- [ ] Tombol **🧭 Ekspedisi** (kanan bawah) → arena 3D terbuka
- [ ] WASD / panah di keyboard **atau** joystick kiri bawah menggerakkan Bri
- [ ] Mendekati bintang emas → terkumpul, XP bertambah, toast muncul
- [ ] Gerbang terkunci menampilkan syarat bintang; gerbang terbuka → tombol "Masuk"
- [ ] Masuk gerbang → game dunia yang sesuai terbuka (butuh langkah 3b)
- [ ] Tombol **✨ Tanya Bri** → 3 pertanyaan siap pakai, jawaban muncul tanpa internet
- [ ] Tab "Orang Tua" → ringkasan + form endpoint AI (default kosong & mati)
- [ ] Semua tombol mengambang otomatis hilang saat overlay game terbuka
- [ ] `prefers-reduced-motion: reduce` aktif → animasi & bloom mati sendiri

---

## 4. Kebijakan wajib AGENTS.md — status

| Kebijakan | Status |
|---|---|
| Peta wajib 3D interaktif (drag/zoom) | ✅ Dipertahankan & diperkuat |
| Formasi cincin posisi dunia (`worlds.ts`) | ✅ Tidak disentuh sama sekali |
| `styles.css` selalu file lengkap | ✅ Tidak diubah; CSS baru disuntik per-modul |
| AppErrorBoundary tetap ada | ✅ Tidak disentuh |
| Setiap Canvas dibungkus error boundary + fallback non-3D | ✅ `WorldSceneErrorBoundary` + `FallbackGrid` |
| Dilarang `<Environment>` drei / aset CDN | ✅ Semua prosedural & lokal |
| Tanpa musik latar | ✅ Tidak ada audio baru sama sekali |
| Juice wajib dekoratif murni | ✅ Bloom/vignette/kamera tidak menyentuh evidence/XP |
| Konten kurikulum AI = draft | ✅ Ekspedisi tidak menambah konten kurikulum |
| Tanpa dependency baru | ✅ `package.json` tidak berubah |

---

## 5. Catatan jujur (baca sebelum rilis ke anak sungguhan)

1. **Bloom sengaja dibuat lemah** (`intensity 0.34`, `threshold 0.85`). Ini keputusan
   sadar setelah dua kali penolakan efek cahaya berlebihan (Patch 17 "matahari
   raksasa", Patch 37 "kerucut cahaya raksasa"). Kalau ingin lebih dramatis, naikkan
   prop di `WorldScene3D.tsx` — tapi naikkan sedikit demi sedikit.

2. **Mode Ekspedisi belum punya konten kurikulum.** Ia adalah lapisan navigasi &
   motivasi, bukan materi ajar baru. Bintang Ilmu memberi XP, bukan mastery — mastery
   tetap murni dari enam game dunia. Ini disengaja supaya tidak ada "imbalan palsu"
   (kebijakan Patch 04).

3. **Karakter Bri di Ekspedisi dibuat prosedural** (kapsul + bola lentera), bukan
   memakai `bri.glb`. Alasannya: model GLB tidak punya rig animasi jalan, dan
   menariknya masuk berisiko gagal-muat di perangkat lemah. Kalau nanti ada model
   ber-rig, ganti komponen `Explorer` saja.

4. **Tier kualitas belum diuji di perangkat fisik Android.** Deteksinya konservatif,
   tapi tolong cek sekali di HP target. Override manual tersedia lewat
   `setQualityTier('low' | 'balanced' | 'high')` dari `src/render/quality.ts`.

5. **Lapis AI (LLM) mati secara default dan tidak mengirim data anak.** Yang dikirim
   hanya ringkasan angka seperti `quran:64%, arabic:belum`. Tidak ada nama, tidak ada
   jawaban mentah. Anak tidak punya input teks bebas — hanya 3 tombol pertanyaan.

6. **Performa:** Postfx menambah 4 lintasan render setengah-resolusi. Di tier `low`
   ia mati otomatis. Kalau ada laporan panas/lag di HP tertentu, set tier ke `low`
   atau kirim `enabled={false}` ke `<Postfx />`.

---

## 6. Yang perlu diperbarui di dokumentasi proyek

Setelah patch dipasang dan diverifikasi, perbarui:

- `AGENTS.md` → bagian "Status faktual": tambahkan pipeline render Patch 38,
  mode Ekspedisi, dan pendamping AI.
- `docs/gameplay/GAMEPLAY-CATALOG.md` → tambahkan entri Ekspedisi sebagai
  **lapisan meta**, bukan dunia ketujuh.
- `CHANGELOG.md` → entri 0.38.0.
- `docs/technical/TECHNICAL-ARCHITECTURE.md` → diagram pipeline render baru
  (`quality.ts` → `CinematicRig` → scene → `Postfx`).
