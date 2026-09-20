import LocalModel, { modelUrls } from './LocalModel';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { getQuality, scaleCount } from '../../render/quality';
import { getReviewSummary } from '../../game/practiceEngine';

/**
 * Gaya label disuntik dari berkas ini sendiri, BUKAN dari styles.css.
 *
 * styles.css berlaku kebijakan "selalu file lengkap" — menyentuhnya
 * berarti menimpa seluruh isinya. Menyuntik dari sini membuat menara
 * menjadi satu paket mandiri yang tidak bisa merusak gaya lain.
 */
const TOWER_STYLE_ID = 'brightoria-practice-tower-v1';

const TOWER_CSS = `
.practice-tower-label {
  display: flex; flex-direction: column; align-items: center; gap: 1px;
  width: 124px; max-width: 124px; box-sizing: border-box;
  padding: 7px 9px; border: 0; border-radius: 14px;
  background: linear-gradient(160deg, #fffdf5f5, #fff3d6f5);
  box-shadow: 0 6px 16px rgba(80,60,20,0.24);
  cursor: pointer; font-family: inherit; text-align: center;
  user-select: none; -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.14s ease, box-shadow 0.14s ease;
}
.practice-tower-label:hover {
  transform: translateY(-2px);
  box-shadow: 0 9px 22px rgba(80,60,20,0.3);
}
.practice-tower-label b {
  font-size: 10.5px; font-weight: 900; color: #7a5410; line-height: 1.18;
}
.practice-tower-label span {
  font-size: 8px; color: #a5853e; line-height: 1.2; opacity: 0.9;
}
.practice-tower-label i {
  display: inline-block; margin-top: 3px; font-style: normal;
  font-size: 9px; font-weight: 900; color: #fff;
  background: linear-gradient(135deg, #e0a63e, #b5741e);
  border-radius: 999px; padding: 2px 8px;
}
.practice-tower-label.has-due { animation: ptl-pulse 2.4s ease-in-out infinite; }
@keyframes ptl-pulse {
  0%, 100% { box-shadow: 0 6px 16px rgba(80,60,20,0.24); }
  50% { box-shadow: 0 6px 22px rgba(224,166,62,0.55); }
}
@media (max-width: 700px) {
  .practice-tower-label { width: 104px; max-width: 104px; padding: 6px 7px; }
  .practice-tower-label b { font-size: 9.5px; }
  .practice-tower-label span { font-size: 7.5px; }
}
`;

function useTowerStyles() {
  useEffect(() => {
    if (document.getElementById(TOWER_STYLE_ID)) return;
    const el = document.createElement('style');
    el.id = TOWER_STYLE_ID;
    el.textContent = TOWER_CSS;
    document.head.appendChild(el);
  }, []);
}

/**
 * PracticeTower.tsx — Menara Latihan di tengah peta (Patch 57).
 *
 * ====================================================================
 * KENAPA MENARA, BUKAN PULAU KETUJUH
 * ====================================================================
 * Pengguna bertanya apakah Latihan sebaiknya dibuat jadi pulau juga.
 * Jawabannya tidak, dan alasannya konseptual:
 *
 *   Enam pulau itu MATA PELAJARAN.
 *   Latihan BUKAN mata pelajaran — ia lapisan pengulangan yang memakai
 *   materi DARI keenamnya.
 *
 * Menjadikannya pulau ketujuh menyiratkan ia subjek ketujuh, dan itu
 * keliru. Anak akan mengira ada tujuh hal yang harus dikuasai, padahal
 * yang ketujuh hanyalah cara mengulang enam yang pertama.
 *
 * Dua alasan teknis menguatkan:
 *
 *   1. FORMASI CINCIN RAPUH.
 *      AGENTS.md mencatat posisi 6 pulau di worlds.ts sudah DUA KALI
 *      mengalami regresi. Menambah pulau ketujuh berarti menyentuh
 *      formasi itu lagi.
 *
 *   2. MASTERY.
 *      Tiap pulau punya mastery %. Latihan tidak boleh punya — ia
 *      memakai materi dunia lain, jadi akan menghitung ganda. Persis
 *      jenis bug yang diperbaiki pada Kampung Adab di Patch 54.
 *
 * ====================================================================
 * TAPI KELUHANNYA TETAP VALID
 * ====================================================================
 * Tombol 🔁 di rel kiri memang kecil dan mudah terlewat — pengguna
 * sendiri sempat tidak menemukan AsterQuiz selama beberapa patch.
 *
 * Menara ini menyelesaikan itu tanpa berbohong soal konsep:
 *
 *   - Berdiri di TENGAH lingkaran pulau: titik pertama yang dilihat
 *     mata saat peta dibuka
 *   - Bentuknya SENGAJA berbeda: menara menjulang, bukan pulau
 *     mengambang. Anak langsung tahu ini bukan dunia lain
 *   - Tidak punya mastery, hanya lencana jumlah materi jatuh tempo
 *
 * ====================================================================
 * CARA MEMBUKA PANEL LATIHAN — NOL RISIKO
 * ====================================================================
 * Menara ini TIDAK mengimpor DailyPractice.tsx. Ia cukup menekan
 * tombol mengambang yang sudah ada:
 *
 *     document.querySelector('.bdp-fab')?.click()
 *
 * Keputusan ini disengaja. DailyPractice.tsx baru saja diperbaiki dari
 * bug pembekuan di Patch 53 — menyentuhnya lagi berisiko tanpa alasan
 * kuat. Dengan cara ini, berkas itu tidak perlu diubah satu baris pun.
 * ====================================================================
 */

/** Jari-jari aman di tengah peta. Pulau terdekat berjarak ~2,79 unit. */
const BASE_RADIUS = 0.62;

/**
 * Cincin ilmu yang mengorbit menara.
 *
 * Bukan hiasan: cincin yang berputar menarik pandangan ke tengah peta
 * bahkan saat anak sedang melihat pulau di tepi. Gerak di penglihatan
 * tepi jauh lebih mudah tertangkap daripada objek diam.
 */
function OrbitRing({
  radius,
  tilt,
  speed,
  color,
}: {
  radius: number;
  tilt: number;
  speed: number;
  color: string;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const quality = getQuality();

  useFrame((state) => {
    try {
      if (!ref.current || !quality.motion) return;
      ref.current.rotation.z = state.clock.elapsedTime * speed;
    } catch {
      /* diamkan */
    }
  });

  return (
    <mesh ref={ref} rotation={[tilt, 0, 0]}>
      <torusGeometry args={[radius, 0.022, 8, 36]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={1.6}
        roughness={0.3}
        metalness={0.4}
      />
    </mesh>
  );
}

/** Serpih cahaya yang naik dari puncak menara. */
function Motes({ color }: { color: string }) {
  const ref = useRef<THREE.Points>(null);
  const quality = getQuality();

  const positions = useMemo(() => {
    const n = Math.max(8, scaleCount(26));
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 0.15 + Math.random() * 0.4;
      arr[i * 3] = Math.cos(a) * r;
      arr[i * 3 + 1] = Math.random() * 1.1;
      arr[i * 3 + 2] = Math.sin(a) * r;
    }
    return arr;
  }, []);

  useFrame((state, delta) => {
    try {
      if (!ref.current || !quality.motion) return;
      const dt = Math.min(delta, 0.05);
      const attr = ref.current.geometry.attributes.position as THREE.BufferAttribute;
      const arr = attr.array as Float32Array;

      for (let i = 1; i < arr.length; i += 3) {
        arr[i] += dt * 0.32;
        if (arr[i] > 1.2) arr[i] = 0;
      }
      attr.needsUpdate = true;

      const m = ref.current.material as THREE.PointsMaterial;
      if (m) m.opacity = 0.5 + Math.sin(state.clock.elapsedTime * 1.4) * 0.18;
    } catch {
      /* diamkan */
    }
  });

  return (
    <points ref={ref} position={[0, 1.05, 0]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.055}
        color={color}
        transparent
        opacity={0.55}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

export default function PracticeTower({
  /** Posisi menara. Bawaan: tengah peta. */
  position = [0, 0, 0] as [number, number, number],
}: {
  position?: [number, number, number];
}) {
  useTowerStyles();

  const quality = getQuality();
  const group = useRef<THREE.Group>(null);
  const crystalRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [due, setDue] = useState(0);

  const accent = '#f3c861';
  const stone = '#5a7691';
  const stoneLight = '#7c97ae';

  /**
   * Jumlah materi jatuh tempo.
   *
   * Dibaca sekali saat dipasang, lalu diperbarui hanya ketika jendela
   * kembali difokuskan — bukan tiap frame. Membaca localStorage 60x per
   * detik akan terasa berat di perangkat lemah.
   */
  useEffect(() => {
    function refresh() {
      try {
        setDue(getReviewSummary().dueToday);
      } catch {
        setDue(0);
      }
    }
    refresh();
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  useFrame((state, delta) => {
    try {
      const dt = Math.min(delta, 0.05);
      const t = state.clock.elapsedTime;

      if (group.current && quality.motion) {
        group.current.position.y = position[1] + Math.sin(t * 0.6) * 0.05;
        const target = hovered ? 1.07 : 1;
        const cur = group.current.scale.x;
        group.current.scale.setScalar(cur + (target - cur) * Math.min(1, dt * 10));
      }

      if (crystalRef.current && quality.motion) {
        crystalRef.current.rotation.y += dt * 0.9;
        crystalRef.current.position.y = 1.16 + Math.sin(t * 1.5) * 0.045;
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[Brightoria] PracticeTower error (diredam):', err);
    }
  });

  /**
   * Membuka panel Latihan dengan menekan tombol mengambang yang sudah
   * ada — lihat catatan "NOL RISIKO" di kepala berkas.
   */
  function openPractice() {
    try {
      const fab = document.querySelector<HTMLElement>('.bdp-fab');
      if (fab) {
        fab.click();
        return;
      }
      // Cadangan bila tombol sedang tersembunyi: kirim event yang bisa
      // ditangkap modul lain di kemudian hari.
      window.dispatchEvent(new Event('brightoria:open-practice'));
    } catch {
      /* diamkan */
    }
  }

  return (
    <group ref={group} position={position}>
      {/* Bayangan kontak di lantai peta */}
      <mesh position={[0, -1.26, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[BASE_RADIUS + 0.22, 22]} />
        <meshBasicMaterial color="#12283c" transparent opacity={0.26} depthWrite={false} />
      </mesh>

      <group
        onClick={(e) => {
          e.stopPropagation();
          openPractice();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
      >
        <LocalModel url={modelUrls.tower} size={2.5} fallback={<>
        {/* ---------- Alas bertingkat ---------- */}
        <mesh position={[0, -1.14, 0]} castShadow={quality.shadows} receiveShadow={quality.shadows}>
          <cylinderGeometry args={[BASE_RADIUS + 0.16, BASE_RADIUS + 0.26, 0.2, 8]} />
          <meshStandardMaterial color={stone} roughness={0.85} metalness={0.08} flatShading />
        </mesh>
        <mesh position={[0, -0.96, 0]} castShadow={quality.shadows}>
          <cylinderGeometry args={[BASE_RADIUS, BASE_RADIUS + 0.14, 0.18, 8]} />
          <meshStandardMaterial color={stoneLight} roughness={0.82} metalness={0.08} flatShading />
        </mesh>

        {/* ---------- Badan menara ----------
            Mengerucut ke atas: atas lebih sempit dari bawah, sehingga
            terbaca menjulang, bukan tabung. Inilah yang membuatnya
            jelas BUKAN pulau. */}
        <mesh position={[0, -0.14, 0]} castShadow={quality.shadows} receiveShadow={quality.shadows}>
          <cylinderGeometry args={[0.38, BASE_RADIUS, 1.5, 8]} />
          <meshStandardMaterial color={stone} roughness={0.8} metalness={0.12} flatShading />
        </mesh>

        {/* Pita batu — memecah badan agar tidak terbaca polos */}
        {[-0.62, -0.1, 0.42].map((y) => (
          <mesh key={y} position={[0, y, 0]}>
            <cylinderGeometry args={[0.47, 0.5, 0.055, 8]} />
            <meshStandardMaterial color={stoneLight} roughness={0.78} metalness={0.1} flatShading />
          </mesh>
        ))}

        {/* Jendela bercahaya — kesan ada "isi" di dalam menara */}
        {[0, 1, 2, 3].map((i) => {
          const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
          return (
            <mesh key={i} position={[Math.cos(a) * 0.4, 0.14, Math.sin(a) * 0.4]} rotation={[0, -a, 0]}>
              <boxGeometry args={[0.02, 0.2, 0.11]} />
              <meshStandardMaterial
                color={accent}
                emissive={accent}
                emissiveIntensity={1.9}
                roughness={0.4}
              />
            </mesh>
          );
        })}

        {/* ---------- Mahkota ---------- */}
        <mesh position={[0, 0.68, 0]} castShadow={quality.shadows}>
          <cylinderGeometry args={[0.5, 0.42, 0.13, 8]} />
          <meshStandardMaterial color={stoneLight} roughness={0.75} metalness={0.15} flatShading />
        </mesh>

        {/* Gigi mahkota — siluet khas menara */}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 0.43, 0.8, Math.sin(a) * 0.43]} rotation={[0, -a, 0]}>
              <boxGeometry args={[0.1, 0.14, 0.1]} />
              <meshStandardMaterial color={stone} roughness={0.8} metalness={0.1} flatShading />
            </mesh>
          );
        })}

        {/* ---------- Kristal ilmu di puncak ---------- */}
        <mesh ref={crystalRef} position={[0, 1.16, 0]}>
          <octahedronGeometry args={[0.2, 0]} />
          <meshStandardMaterial
            color={accent}
            emissive={accent}
            emissiveIntensity={2.4}
            roughness={0.15}
            metalness={0.4}
            flatShading
          />
        </mesh>

        <pointLight color={accent} intensity={2.4} distance={4.2} position={[0, 1.1, 0]} />
        </>} />
      </group>

      {/* ---------- Cincin mengorbit ---------- */}
      <OrbitRing radius={0.78} tilt={Math.PI / 2.1} speed={0.42} color={accent} />
      <OrbitRing radius={0.95} tilt={Math.PI / 2.6} speed={-0.3} color="#9ed8ff" />

      <Motes color={accent} />

      {/* ---------- Label ----------
          zIndexRange [30, 0] mempertahankan perbaikan Patch 11: label
          tidak pernah bocor menimpa overlay game. */}
      <Html center position={[0, -1.52, 0]} occlude={false} zIndexRange={[30, 0]}>
        <button
          className={'practice-tower-label' + (due > 0 ? ' has-due' : '')}
          onClick={openPractice}
        >
          <b>Menara Latihan</b>
          <span>Ulangi yang sudah dipelajari</span>
          {due > 0 && <i>{due} siap diulang</i>}
        </button>
      </Html>
    </group>
  );
}
