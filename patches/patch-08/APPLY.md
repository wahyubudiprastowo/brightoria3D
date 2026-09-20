# Patch 08 — APPLY Guide: Map Assets Integrated

## Ringkasan

Patch 08 mengintegrasikan aset peta lokal baru ke `WorldScene.tsx` tanpa
menghapus scene Three.js. Peta tetap memakai billboard 3D, drag rotate,
scroll/pinch zoom, klik pulau, dan fallback grid saat WebGL gagal.

## Perubahan

- `background_sky_1920x1080.webp` dipakai sebagai background tekstur scene.
- Tiga tekstur connector lokal dipakai bergantian pada route segment antar
  pulau.
- `route_node.webp` dipakai sebagai marker waypoint di tengah setiap route.
- Tekstur map/world dikonfigurasi sebagai sRGB supaya warna aset tetap akurat.
- Pencahayaan tetap manual (`ambientLight`, `directionalLight`,
  `hemisphereLight`); tidak ada `<Environment>`.
- `WorldSceneErrorBoundary` dan `FallbackGrid` tetap dipertahankan.

## Verifikasi

```powershell
npm run typecheck
npm run build
```

Manual browser checklist:

1. Background sky tampil dari `/assets/map/background_sky_1920x1080.webp`.
2. Connector dan waypoint marker terlihat di antara enam pulau.
3. Drag map masih memutar kamera melalui `OrbitControls`.
4. Scroll/pinch masih zoom map.
5. Klik tiap pulau tetap membuka mission card/game yang sesuai.
6. Jika WebGL gagal, fallback grid tetap menampilkan enam pilihan dunia.

## Catatan

Tidak ada dependency baru. Aset tetap lokal di `public/assets/map/`; tidak
ada request CDN untuk visual wajib.