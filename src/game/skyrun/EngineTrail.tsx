import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getQuality } from '../../render/quality';

/**
 * EngineTrail.tsx — Semburan mesin bercahaya (Patch 64).
 *
 * ====================================================================
 * KENAPA VERSI LAMA TERLIHAT MURAHAN
 * ====================================================================
 * Versi sebelumnya hanya dua kerucut biasa dengan `transparent`.
 * Hasilnya terbaca sebagai benda oranye padat, bukan api.
 *
 * Referensi memperlihatkan empat lapis yang berbeda tugas:
 *
 *   1. CINCIN NOZZLE  — cakram terang di pangkal, paling menyilaukan
 *   2. INTI           — kerucut hampir putih, tipis dan panjang
 *   3. SELUBUNG       — kerucut berwarna, lebih lebar
 *   4. PENDAR LUAR    — kerucut sangat lebar dan samar
 *
 * Tanpa lapis 1, semburan tidak punya titik pangkal yang jelas — ia
 * terlihat "menempel" begitu saja di buritan.
 *
 * ====================================================================
 * KUNCINYA: AdditiveBlending
 * ====================================================================
 * Dengan blending biasa, kerucut MENUTUPI apa pun di belakangnya —
 * itulah yang membuatnya terbaca sebagai benda padat.
 *
 * AdditiveBlending MENAMBAHKAN warnanya ke latar. Dua lapis yang
 * bertumpuk otomatis menjadi lebih terang di area tumpangnya, persis
 * seperti cahaya sungguhan. Itulah sebabnya inti terlihat menyala
 * tanpa perlu emissive sama sekali.
 *
 * `depthWrite: false` wajib menyertainya — tanpa itu, lapis terdepan
 * akan menghalangi lapis di belakangnya dan efek tumpang-tindih hilang.
 * ====================================================================
 */

export type TrailColor = 'orange' | 'blue' | 'violet';

/** Palet tiap warna: inti, selubung, pendar. */
const PALETTE: Record<TrailColor, { core: string; mid: string; halo: string }> = {
  orange: { core: '#fff6e0', mid: '#ff9a2e', halo: '#ff5c00' },
  blue: { core: '#eafaff', mid: '#4cc9ff', halo: '#0077e6' },
  violet: { core: '#f6eaff', mid: '#b47cff', halo: '#7b2dff' },
};

export default function EngineTrail({
  /** Jari-jari nozzle. Seluruh semburan menyesuaikan diri dari ini. */
  radius = 0.11,
  /** Panjang dasar semburan. */
  length = 0.9,
  color = 'orange',
  /** 0-2. Memanjangkan dan mencerahkan saat melaju kencang. */
  thrustRef,
  /** Menggeser fase kedipan agar antar-mesin tidak seirama. */
  phase = 0,
}: {
  radius?: number;
  length?: number;
  color?: TrailColor;
  thrustRef?: React.RefObject<number>;
  phase?: number;
}) {
  const quality = getQuality();
  const group = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);

  const p = PALETTE[color];
  const local = useRef(1);
  const thrust = thrustRef ?? local;

  /**
   * Tekstur gradasi untuk cincin nozzle.
   *
   * Digambar ke kanvas, bukan dipakai berkas — nol permintaan jaringan,
   * dan tidak bisa gagal dimuat. Pelajaran dari Patch 03 dan 12-15.
   */
  const ringTexture = useMemo(() => {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const g = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2,
    );
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.85)');
    g.addColorStop(0.7, 'rgba(255,255,255,0.25)');
    g.addColorStop(1, 'rgba(255,255,255,0)');

    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, []);

  useFrame((state) => {
    try {
      if (!group.current || !quality.motion) return;

      const t = state.clock.elapsedTime;
      const th = thrust.current ?? 1;

      /*
       * Kedipan memakai dua sinus berfrekuensi tidak kelipatan.
       *
       * Satu sinus saja menghasilkan denyut berirama tetap — itu
       * terbaca sebagai lampu, bukan nyala. Dua frekuensi yang tidak
       * saling membagi membuat polanya tidak pernah berulang.
       */
      const flicker =
        1 + Math.sin(t * 19 + phase) * 0.1 + Math.sin(t * 31 + phase * 2) * 0.05;

      group.current.scale.set(1, 1, flicker * th);

      // Cincin nozzle berdenyut lebih cepat & lebih kuat — ia titik
      // paling panas, jadi paling gelisah.
      if (ringRef.current) {
        const pulse = 1 + Math.sin(t * 24 + phase) * 0.14;
        ringRef.current.scale.setScalar(pulse);
        const m = ringRef.current.material as THREE.MeshBasicMaterial;
        if (m) m.opacity = 0.78 + Math.sin(t * 24 + phase) * 0.16;
      }

      // Inti sedikit memanjang-memendek, tidak seirama selubungnya.
      if (coreRef.current) {
        coreRef.current.scale.z = 1 + Math.sin(t * 26 + phase * 1.7) * 0.08;
      }

      // Pendar luar bernapas jauh lebih pelan — memberi kesan panas
      // yang menyebar, bukan berkedip.
      if (haloRef.current) {
        const m = haloRef.current.material as THREE.MeshBasicMaterial;
        if (m) m.opacity = 0.16 + Math.sin(t * 6 + phase) * 0.06;
      }
    } catch {
      /* diamkan — kegagalan animasi tidak boleh mematikan scene */
    }
  });

  return (
    <group ref={group}>
      {/* ---------- 1. CINCIN NOZZLE ----------
          Cakram menghadap kamera di pangkal semburan. Inilah yang
          memberi titik awal yang jelas; tanpanya semburan terlihat
          menempel begitu saja. */}
      <mesh ref={ringRef} position={[0, 0, 0.02]}>
        <planeGeometry args={[radius * 3.4, radius * 3.4]} />
        <meshBasicMaterial
          map={ringTexture}
          color={p.core}
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ---------- 2. INTI ----------
          Hampir putih, tipis, memanjang. Bagian paling terang. */}
      <mesh ref={coreRef} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -length * 0.4]}>
        <coneGeometry args={[radius * 0.52, length * 0.8, 10]} />
        <meshBasicMaterial
          color={p.core}
          transparent
          opacity={0.92}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* ---------- 3. SELUBUNG ----------
          Berwarna, lebih lebar, sedikit lebih panjang dari inti. */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -length * 0.5]}>
        <coneGeometry args={[radius * 1.05, length, 12, 1, true]} />
        <meshBasicMaterial
          color={p.mid}
          transparent
          opacity={0.55}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ---------- 4. PENDAR LUAR ----------
          Sangat lebar dan samar. Memberi kesan panas yang menyebar. */}
      <mesh
        ref={haloRef}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0, -length * 0.62]}
      >
        <coneGeometry args={[radius * 1.9, length * 1.35, 12, 1, true]} />
        <meshBasicMaterial
          color={p.halo}
          transparent
          opacity={0.18}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Cahaya nyata ke sekeliling — membuat lambung ikut memerah. */}
      <pointLight color={p.halo} intensity={2.2} distance={3.2} />
    </group>
  );
}
