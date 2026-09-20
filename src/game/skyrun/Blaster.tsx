import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getQuality } from '../../render/quality';

/**
 * Blaster.tsx — Tembakan meriam pesawat (v2, Patch 66).
 *
 * ====================================================================
 * PERUBAHAN PATCH 66: TEMBAKAN BISA DIPICU ANAK
 * ====================================================================
 * Versi sebelumnya hanya menembak otomatis dengan irama tetap.
 *
 * Umpan balik: "ada button buat tembak jawaban atau asteroidnya".
 *
 * Kini ada DUA jalur tembakan:
 *
 *   OTOMATIS  irama tetap, mengisi suasana
 *   DIPICU    letusan tiga peluru sekaligus saat anak menekan tombol
 *
 * Letusan sengaja dibuat lebih besar dan lebih terang daripada
 * tembakan otomatis — anak harus MERASAKAN bahwa tombolnya berpengaruh.
 * Kalau tembakan picu terlihat sama dengan yang otomatis, tombol itu
 * akan terasa palsu.
 *
 * ====================================================================
 * DIHUBUNGKAN LEWAT EVENT, BUKAN PROP
 * ====================================================================
 * Tombol tembak berada di lapisan HTML, jauh di luar pohon Three.js.
 * Menyambungkannya lewat prop berarti mengubah ShipModel, lalu
 * SkyRunGame — dua berkas yang sudah berkali-kali bermasalah.
 *
 * Dengan event global, berkas ini cukup mendengarkan:
 *
 *     window.addEventListener('brightoria:skyrun-fire', ...)
 *
 * Nol perubahan di tempat lain, nol risiko.
 *
 * ====================================================================
 * KOLAM OBJEK, BUKAN BUAT-BUANG
 * ====================================================================
 * Peluru dibuat SEKALI lalu dipakai ulang. Membuat dan membuang mesh
 * tiap tembakan akan membebani pemungut sampah, dan itu terasa sebagai
 * tersendat berkala di perangkat lemah.
 * ====================================================================
 */

/** Nama event pemicu tembakan. Dipakai bersama FireButton. */
export const FIRE_EVENT = 'brightoria:skyrun-fire';

/** Jumlah peluru dalam kolam per laras. */
const POOL = 8;

/** Jarak tempuh peluru sebelum dipulangkan ke kolam. */
const RANGE = 34;

/** Kecepatan peluru, unit per detik. */
const SPEED = 46;

/** Jeda antar-tembakan otomatis, dalam detik. */
const INTERVAL = 0.5;

interface Shot {
  /** Jarak yang sudah ditempuh. -1 berarti sedang tidak aktif. */
  travel: number;
  /** Tembakan yang dipicu anak — lebih besar dan lebih terang. */
  charged: boolean;
}

/**
 * Satu laras meriam beserta peluru-pelurunya.
 *
 * Peluru dirender sebagai InstancedMesh — seluruh peluru dari satu
 * laras digambar dalam satu draw call.
 */
function Barrel({
  position,
  phase,
  color,
  chargedColor,
}: {
  position: [number, number, number];
  phase: number;
  color: string;
  chargedColor: string;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const quality = getQuality();

  const shots = useRef<Shot[]>(
    Array.from({ length: POOL }, () => ({ travel: -1, charged: false })),
  );
  const timer = useRef(phase);
  const nextSlot = useRef(0);
  const flash = useRef(0);
  const burst = useRef(0);

  /**
   * Peluru berbentuk kapsul memanjang.
   *
   * Kapsul dipilih karena ujungnya membulat — bola terlihat seperti
   * gelembung, kotak terlihat seperti batang. Kapsul memanjang
   * terbaca sebagai berkas energi yang melesat.
   */
  const geometry = useMemo(() => new THREE.CapsuleGeometry(0.05, 0.46, 4, 8), []);

  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#ffffff',
        transparent: true,
        opacity: 0.95,
        /*
         * AdditiveBlending: warna DITAMBAHKAN ke latar, bukan
         * menutupinya. Itulah yang membuat peluru terbaca sebagai
         * cahaya, bukan benda padat.
         */
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [],
  );

  // Geometri & material memakai memori GPU. Tanpa pembuangan ini,
  // tiap buka-tutup permainan meninggalkan buffer menggantung.
  useLayoutEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tint = useMemo(() => new THREE.Color(), []);
  const normalColor = useMemo(() => new THREE.Color(color), [color]);
  const hotColor = useMemo(() => new THREE.Color(chargedColor), [chargedColor]);

  /** Menyalakan satu peluru dari kolam. */
  function spawn(charged: boolean) {
    const slot = shots.current[nextSlot.current];
    slot.travel = 0;
    slot.charged = charged;
    nextSlot.current = (nextSlot.current + 1) % POOL;
    flash.current = charged ? 1.6 : 1;
  }

  // --- Dengarkan pemicu dari tombol ---
  useEffect(() => {
    function onFire() {
      try {
        // Letusan tiga peluru beruntun — jauh lebih terasa daripada
        // satu peluru tunggal.
        burst.current = 3;
      } catch {
        /* diamkan */
      }
    }
    window.addEventListener(FIRE_EVENT, onFire);
    return () => window.removeEventListener(FIRE_EVENT, onFire);
  }, []);

  const burstTimer = useRef(0);

  useFrame((_state, delta) => {
    try {
      const mesh = meshRef.current;
      if (!mesh || !quality.motion) return;

      const dt = Math.min(delta, 0.05);

      // --- Letusan yang dipicu anak ---
      if (burst.current > 0) {
        burstTimer.current -= dt;
        if (burstTimer.current <= 0) {
          spawn(true);
          burst.current -= 1;
          burstTimer.current = 0.07;
        }
      }

      // --- Tembakan otomatis ---
      timer.current += dt;
      if (timer.current >= INTERVAL) {
        timer.current -= INTERVAL;
        spawn(false);
      }

      // --- Kilatan moncong meredup ---
      if (flash.current > 0) {
        flash.current = Math.max(0, flash.current - dt * 7);
      }
      if (glowRef.current) {
        glowRef.current.scale.setScalar(flash.current * 0.9);
        const m = glowRef.current.material as THREE.MeshBasicMaterial;
        if (m) m.opacity = Math.min(1, flash.current * 0.85);
      }

      // --- Gerakkan peluru ---
      let anyColor = false;

      for (let i = 0; i < POOL; i++) {
        const shot = shots.current[i];

        if (shot.travel < 0) {
          dummy.scale.setScalar(0);
          dummy.position.set(0, 0, 0);
          dummy.updateMatrix();
          mesh.setMatrixAt(i, dummy.matrix);
          continue;
        }

        shot.travel += SPEED * dt;
        if (shot.travel > RANGE) {
          shot.travel = -1;
          dummy.scale.setScalar(0);
          dummy.updateMatrix();
          mesh.setMatrixAt(i, dummy.matrix);
          continue;
        }

        /*
         * Peluru MEMANJANG seiring jarak.
         *
         * Meniru kabur-gerak: benda cepat terbaca sebagai garis, bukan
         * titik. Tanpa ini peluru terlihat seperti manik-manik yang
         * meluncur pelan.
         */
        const stretch = 1 + Math.min(2.2, shot.travel * 0.09);

        // Memudar di ujung jangkauan, bukan hilang mendadak.
        const fade = 1 - Math.max(0, (shot.travel - RANGE * 0.7) / (RANGE * 0.3));

        // Peluru picu lebih gemuk — terlihat lebih bertenaga.
        const girth = shot.charged ? 1.7 : 1;

        dummy.position.set(0, 0, -shot.travel);
        dummy.rotation.set(Math.PI / 2, 0, 0);
        dummy.scale.set(fade * girth, stretch, fade * girth);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);

        tint.copy(shot.charged ? hotColor : normalColor);
        mesh.setColorAt(i, tint);
        anyColor = true;
      }

      mesh.instanceMatrix.needsUpdate = true;
      if (anyColor && mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[Brightoria] Blaster error (diredam):', err);
    }
  });

  // Sembunyikan seluruh peluru & siapkan warna saat dipasang.
  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    dummy.scale.setScalar(0);
    dummy.updateMatrix();
    tint.copy(normalColor);

    for (let i = 0; i < POOL; i++) {
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, tint);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [dummy, tint, normalColor]);

  return (
    <group position={position}>
      {/* Kilatan di moncong laras — memberi tahu dari mana peluru keluar */}
      <mesh ref={glowRef} scale={0}>
        <sphereGeometry args={[0.16, 10, 10]} />
        <meshBasicMaterial
          color={chargedColor}
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <instancedMesh
        ref={meshRef}
        args={[geometry, material, POOL]}
        frustumCulled={false}
      />
    </group>
  );
}

export default function Blaster({
  /** Posisi moncong kiri & kanan, relatif terhadap badan kapal. */
  left = [-0.62, -0.06, 0.66] as [number, number, number],
  right = [0.62, -0.06, 0.66] as [number, number, number],
  color = '#7fd4ff',
  chargedColor = '#ffe9a0',
}: {
  left?: [number, number, number];
  right?: [number, number, number];
  color?: string;
  chargedColor?: string;
}) {
  return (
    <group>
      {/*
        Jeda fase setengah interval membuat kedua laras menembak
        BERGANTIAN saat mode otomatis. Irama bergantian terlihat jauh
        lebih hidup daripada tembakan serempak.

        Saat dipicu anak, keduanya menembak bersamaan — itu disengaja,
        agar letusannya terasa sebagai satu tindakan tegas.
      */}
      <Barrel position={left} phase={0} color={color} chargedColor={chargedColor} />
      <Barrel
        position={right}
        phase={INTERVAL / 2}
        color={color}
        chargedColor={chargedColor}
      />
    </group>
  );
}
