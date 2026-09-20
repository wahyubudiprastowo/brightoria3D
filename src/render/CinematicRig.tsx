import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { getQuality } from './quality';

/**
 * CinematicRig.tsx — Konfigurasi renderer sinematik (Patch 38).
 *
 * ====================================================================
 * APA YANG DIPERBAIKI
 * ====================================================================
 * Sampai Patch 37, seluruh scene Brightoria memakai pengaturan renderer
 * BAWAAN Three.js: tone mapping NoToneMapping dan exposure 1.0. Itulah
 * sebab utama kenapa warna terasa "flat" dan cahaya terang gampang
 * pecah menjadi putih rata (persis keluhan "seperti matahari raksasa"
 * di Patch 17 — sumber cahaya yang overexposed tidak punya roll-off).
 *
 * Komponen ini menyetel:
 *   1. ACES Filmic tone mapping — kurva film yang menekan highlight
 *      secara halus, sehingga cahaya terang tetap punya warna dan tidak
 *      langsung jadi putih. Ini satu perubahan tunggal dengan dampak
 *      visual terbesar di seluruh patch.
 *   2. Exposure yang bisa diatur per-scene (peta dunia sedikit lebih
 *      terang daripada scene game dalam ruangan).
 *   3. Shadow map lembut (PCFSoft) dengan resolusi mengikuti tier
 *      perangkat dari quality.ts.
 *   4. Color space keluaran sRGB secara eksplisit.
 *
 * CARA PAKAI — letakkan sebagai anak pertama di dalam <Canvas>:
 *     <Canvas>
 *       <CinematicRig exposure={1.05} />
 *       ...
 *     </Canvas>
 *
 * JAMINAN KEAMANAN: komponen ini tidak merender apa pun (return null),
 * hanya menyentuh objek renderer lewat useThree. Semua penyetelan
 * dibungkus try/catch sehingga versi Three.js yang berbeda tidak akan
 * pernah menghentikan aplikasi.
 * ====================================================================
 */
export default function CinematicRig({
  exposure = 1,
  shadows,
}: {
  exposure?: number;
  /** Paksa aktif/nonaktif bayangan. Default: ikut tier perangkat. */
  shadows?: boolean;
}) {
  const gl = useThree((state) => state.gl);

  useEffect(() => {
    const quality = getQuality();
    const useShadows = shadows === undefined ? quality.shadows : shadows;

    try {
      gl.toneMapping = THREE.ACESFilmicToneMapping;
      gl.toneMappingExposure = exposure;
      gl.outputColorSpace = THREE.SRGBColorSpace;
      gl.shadowMap.enabled = useShadows;
      gl.shadowMap.type = THREE.PCFSoftShadowMap;
      gl.shadowMap.autoUpdate = useShadows;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[Brightoria] CinematicRig gagal menyetel renderer (diabaikan):', err);
    }
  }, [gl, exposure, shadows]);

  return null;
}

/**
 * Preset pencahayaan tiga titik bergaya studio animasi.
 *
 * Alih-alih satu directional light datar (pola lama di seluruh proyek),
 * ini memakai rig klasik:
 *   - KEY   : matahari hangat dari kiri-atas, satu-satunya pelempar bayangan
 *   - FILL  : cahaya langit dingin dari kanan, mengisi area gelap tanpa bayangan
 *   - RIM   : cahaya belakang untuk memisahkan objek dari latar (efek tepi)
 *   - AMBIENT/HEMI: pantulan lingkungan agar bagian bawah objek tidak mati
 *
 * Hasilnya bentuk 3D jauh lebih terbaca — inilah yang membuat objek
 * terasa "punya volume" seperti di engine game, bukan sekadar gambar.
 */
export function ThreePointLights({
  intensity = 1,
  warm = '#fff1d0',
  cool = '#bcd9ff',
  rim = '#ffd6a5',
  shadowRadius = 12,
  castShadow,
}: {
  intensity?: number;
  warm?: string;
  cool?: string;
  rim?: string;
  /** Setengah-lebar frustum bayangan ortografis. Perbesar untuk scene luas. */
  shadowRadius?: number;
  castShadow?: boolean;
}) {
  const quality = getQuality();
  const shadowsOn = castShadow === undefined ? quality.shadows : castShadow;
  const mapSize = quality.shadowMapSize;

  return (
    <>
      <hemisphereLight args={[cool, '#f3e0bd', 0.75 * intensity]} />
      <ambientLight intensity={0.55 * intensity} />
      <directionalLight
        castShadow={shadowsOn}
        position={[6, 10, 5]}
        intensity={2.1 * intensity}
        color={warm}
        shadow-mapSize-width={mapSize}
        shadow-mapSize-height={mapSize}
        shadow-camera-near={0.5}
        shadow-camera-far={40}
        shadow-camera-left={-shadowRadius}
        shadow-camera-right={shadowRadius}
        shadow-camera-top={shadowRadius}
        shadow-camera-bottom={-shadowRadius}
        shadow-bias={-0.0009}
        shadow-normalBias={0.02}
      />
      <directionalLight position={[-7, 4, 3]} intensity={0.75 * intensity} color={cool} />
      <directionalLight position={[0, 3, -9]} intensity={0.9 * intensity} color={rim} />
    </>
  );
}
