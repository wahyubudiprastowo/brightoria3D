# Patch 52 — Perbaikan "muter-muter, gak kebuka"

## Penyebabnya: bug yang saya tulis sendiri di Patch 50

`FroggyGame.tsx` menjalankan `requestAnimationFrame` berulang tanpa henti
di dalam `onCreated`, dan **tidak pernah dibatalkan**:

```tsx
onCreated={({ clock }) => {
  const tick = () => {
    clockRef.current = clock.elapsedTime;
    requestAnimationFrame(tick);   // <- berputar selamanya
  };
  tick();
}}
```

Akibatnya:

| Masalah | Dampak |
|---|---|
| Loop tidak pernah berhenti | Tetap jalan **setelah permainan ditutup** |
| `React.StrictMode` memasang komponen dua kali | Langsung jadi **dua loop** sekaligus |
| Tiap loop memegang jam Three.js | Scene lama tidak bisa dibuang dari memori |

Dua loop 60fps yang menumpuk di atas render Three.js membuat laman
membeku — persis gejala "muter-muter doang, gak kebuka".

## Perbaikannya

Loop dihapus sepenuhnya. Waktu mulai lompatan kini diambil dari **jam
frame milik scene itu sendiri**, yang otomatis berhenti saat komponen
dilepas:

```tsx
const startRef = useRef<number | null>(null);

useFrame((state) => {
  if (jumping) {
    if (startRef.current === null) startRef.current = state.clock.elapsedTime;
    const age = state.clock.elapsedTime - startRef.current;
    ...
  }
});
```

`clockRef` dan seluruh `onCreated` dihapus. `jumpStart` berubah fungsi
menjadi penghitung lompatan (pemicu), bukan stempel waktu.

**Catatan:** `SkyRunGame.tsx` bersih — tidak pernah memakai pola ini.

## File dalam patch ini

```
src/main.tsx                    (TIMPA — menambah impor DailyPractice)
src/game/froggy/FroggyGame.tsx  (TIMPA — hapus rAF bocor)
```

## Kenapa main.tsx ikut disertakan

Pada zip yang Anda kirim, `src/main.tsx` **belum** memuat baris:

```ts
import './game/DailyPractice';
```

Tanpa baris itu tombol **🔁 Latihan** tidak pernah dipasang ke DOM, jadi
Penerbangan Ilmu dan Lompat Katak tidak punya pintu masuk sama sekali.

## Cara memasang

```powershell
npm run build
npm run dev
```

Lalu muat ulang paksa (`Ctrl+Shift+R`).

## Checklist uji

- [ ] Tombol **🔁 Latihan** muncul di rel kiri
- [ ] Ketuk → muncul tiga mode
- [ ] **Lompat Katak** terbuka, tidak membeku
- [ ] Katak melompat, mendarat, lanjut ke soal berikutnya
- [ ] **Tutup permainan → buka lagi** beberapa kali, laman tetap ringan
- [ ] Penerbangan Ilmu tetap normal

## Hasil verifikasi

| Pemeriksaan | Hasil |
|---|---|
| Keseimbangan kurung | ✅ 411/411, 453/453, 174/174 |
| `requestAnimationFrame` tersisa | ✅ 0 (hanya di komentar) |
| `clockRef` tersisa | ✅ 0 |
| Resolusi seluruh impor (75 berkas) | ✅ Semua valid |

## Kalau masih gagal terbuka

Buka Console (F12), ulangi langkahnya, lalu kirimkan **baris merah pertama**
yang muncul. Itu akan menunjuk persis komponen mana yang gagal.
