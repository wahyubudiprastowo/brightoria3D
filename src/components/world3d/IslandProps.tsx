import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getQuality } from '../../render/quality';

/**
 * IslandProps.tsx — Bangunan & tanaman blocky untuk permukaan pulau (Patch 40).
 *
 * ====================================================================
 * KENAPA PULAU SEBELUMNYA TERASA KURANG MENARIK
 * ====================================================================
 * Sampai Patch 39, isi pulau adalah SATU gambar .webp di billboard.
 * Billboard selalu menghadap kamera, jadi:
 *   - Memutar kamera tidak pernah memperlihatkan sisi lain
 *   - Tidak ada objek yang menerima atau melempar bayangan
 *   - Tidak ada kedalaman antara "yang depan" dan "yang belakang"
 *
 * Patch 38 sudah menambah alas batu 3D di BAWAH pulau, tapi bagian ATAS
 * — yang justru paling dilihat anak — masih datar.
 *
 * Berkas ini mengisi bagian itu dengan bangunan & tanaman 3D sungguhan,
 * bergaya blocky agar serasi dengan karakter baru.
 *
 * ====================================================================
 * PRINSIP DESAIN
 * ====================================================================
 *   - SILUET BERTINGKAT: bangunan tinggi di tengah, semak rendah di
 *     tepi. Mata membaca kedalaman dari perbedaan tinggi, bukan detail.
 *   - VARIASI DETERMINISTIK: posisi diacak TAPI dari benih tetap. Pulau
 *     yang sama selalu terlihat sama — penting agar peta tidak "berubah
 *     bentuk" tiap refresh.
 *   - HEMAT POLIGON: hanya box, cylinder, cone. Enam pulau x ~7 properti
 *     masih jauh di bawah anggaran render.
 *   - JUMLAH MENGIKUTI TIER: perangkat lemah dapat properti lebih sedikit.
 * ====================================================================
 */

/** Pengacak deterministik — benih sama, hasil selalu sama. */
function makeRng(seed: number) {
  let s = seed * 9301 + 49297;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

// ---------------------------------------------------------------------------
// TANAMAN
// ---------------------------------------------------------------------------

function BlockyTree({
  position,
  scale = 1,
  leaf = '#4faf62',
  swayPhase = 0,
}: {
  position: [number, number, number];
  scale?: number;
  leaf?: string;
  swayPhase?: number;
}) {
  const ref = useRef<THREE.Group>(null);
  const quality = getQuality();

  useFrame((state) => {
    if (!ref.current || !quality.motion) return;
    // Bergoyang pelan seperti tertiup angin.
    ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.9 + swayPhase) * 0.035;
  });

  return (
    <group ref={ref} position={position} scale={scale}>
      <mesh position={[0, 0.16, 0]} castShadow={quality.shadows}>
        <boxGeometry args={[0.09, 0.32, 0.09]} />
        <meshStandardMaterial color="#8a5a34" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.42, 0]} castShadow={quality.shadows}>
        <boxGeometry args={[0.34, 0.24, 0.34]} />
        <meshStandardMaterial color={leaf} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.6, 0]} castShadow={quality.shadows}>
        <boxGeometry args={[0.22, 0.18, 0.22]} />
        <meshStandardMaterial color={leaf} roughness={0.85} />
      </mesh>
    </group>
  );
}

function PalmTree({
  position,
  scale = 1,
  swayPhase = 0,
}: {
  position: [number, number, number];
  scale?: number;
  swayPhase?: number;
}) {
  const ref = useRef<THREE.Group>(null);
  const quality = getQuality();

  useFrame((state) => {
    if (!ref.current || !quality.motion) return;
    ref.current.rotation.z = 0.08 + Math.sin(state.clock.elapsedTime * 0.75 + swayPhase) * 0.05;
  });

  const fronds = useMemo(() => [0, 1, 2, 3, 4].map((i) => (i / 5) * Math.PI * 2), []);

  return (
    <group ref={ref} position={position} scale={scale}>
      <mesh position={[0, 0.3, 0]} castShadow={quality.shadows}>
        <cylinderGeometry args={[0.05, 0.075, 0.6, 6]} />
        <meshStandardMaterial color="#9c7048" roughness={0.9} />
      </mesh>
      {fronds.map((angle, i) => (
        <mesh
          key={i}
          position={[Math.cos(angle) * 0.17, 0.62, Math.sin(angle) * 0.17]}
          rotation={[0, -angle, 0.55]}
          castShadow={quality.shadows}
        >
          <boxGeometry args={[0.34, 0.035, 0.13]} />
          <meshStandardMaterial color="#3f9f5c" roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}

function Rock({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const quality = getQuality();
  return (
    <mesh position={position} scale={[scale, scale * 0.7, scale]} castShadow={quality.shadows}>
      <icosahedronGeometry args={[0.13, 0]} />
      <meshStandardMaterial color="#8d8477" roughness={0.95} flatShading />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// BANGUNAN BERTEMA — satu per dunia
// ---------------------------------------------------------------------------

/** Masjid mini: kubah + menara. Tema Taman Al-Qur'an. */
function MosqueProp({ accent }: { accent: string }) {
  const quality = getQuality();
  return (
    <group>
      <mesh position={[0, 0.22, 0]} castShadow={quality.shadows}>
        <boxGeometry args={[0.6, 0.44, 0.5]} />
        <meshStandardMaterial color="#f5ead4" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.54, 0]} castShadow={quality.shadows}>
        <sphereGeometry args={[0.22, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        <meshStandardMaterial color={accent} roughness={0.5} metalness={0.25} />
      </mesh>
      <mesh position={[0, 0.72, 0]}>
        <coneGeometry args={[0.035, 0.12, 6]} />
        <meshStandardMaterial color="#e0a63e" emissive="#ffd98a" emissiveIntensity={0.7} />
      </mesh>
      <mesh position={[0.42, 0.34, 0.16]} castShadow={quality.shadows}>
        <cylinderGeometry args={[0.07, 0.08, 0.68, 8]} />
        <meshStandardMaterial color="#f5ead4" roughness={0.85} />
      </mesh>
      <mesh position={[0.42, 0.73, 0.16]}>
        <coneGeometry args={[0.1, 0.18, 8]} />
        <meshStandardMaterial color={accent} roughness={0.5} metalness={0.25} />
      </mesh>
      <mesh position={[0, 0.13, 0.252]}>
        <boxGeometry args={[0.16, 0.26, 0.01]} />
        <meshStandardMaterial color="#6b4a2e" roughness={0.8} />
      </mesh>
    </group>
  );
}

/** Rumah kampung: kotak + atap limas. Tema Kampung Adab. */
function HouseProp({ color, accent }: { color: string; accent: string }) {
  const quality = getQuality();
  return (
    <group>
      <mesh position={[0, 0.2, 0]} castShadow={quality.shadows}>
        <boxGeometry args={[0.5, 0.4, 0.44]} />
        <meshStandardMaterial color="#f7e6c8" roughness={0.88} />
      </mesh>
      <mesh position={[0, 0.5, 0]} rotation={[0, Math.PI / 4, 0]} castShadow={quality.shadows}>
        <coneGeometry args={[0.42, 0.26, 4]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.14, 0.223]}>
        <boxGeometry args={[0.14, 0.24, 0.01]} />
        <meshStandardMaterial color="#8a5a34" roughness={0.85} />
      </mesh>
      {[-0.16, 0.16].map((x) => (
        <mesh key={x} position={[x, 0.26, 0.223]}>
          <boxGeometry args={[0.1, 0.1, 0.01]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.4} />
        </mesh>
      ))}
    </group>
  );
}

/** Menara angka: balok bertumpuk mengecil. Tema Pulau Numeria. */
function TowerProp({ color, accent }: { color: string; accent: string }) {
  const quality = getQuality();
  const blocks = [
    { y: 0.11, w: 0.46, c: color },
    { y: 0.32, w: 0.37, c: accent },
    { y: 0.5, w: 0.28, c: color },
    { y: 0.65, w: 0.19, c: accent },
  ];
  return (
    <group>
      {blocks.map((b, i) => (
        <mesh key={i} position={[0, b.y, 0]} rotation={[0, i * 0.2, 0]} castShadow={quality.shadows}>
          <boxGeometry args={[b.w, 0.2, b.w]} />
          <meshStandardMaterial color={b.c} roughness={0.7} metalness={0.08} />
        </mesh>
      ))}
      <mesh position={[0, 0.8, 0]}>
        <octahedronGeometry args={[0.1, 0]} />
        <meshStandardMaterial color="#ffd166" emissive="#ffb703" emissiveIntensity={1.8} flatShading />
      </mesh>
    </group>
  );
}

/** Tenda gurun + kolam oasis. Tema Oasis Bahasa Arab. */
function OasisProp({ color, accent }: { color: string; accent: string }) {
  const quality = getQuality();
  return (
    <group>
      <mesh position={[0, 0.26, 0]} castShadow={quality.shadows}>
        <coneGeometry args={[0.38, 0.52, 7]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.1, 0.3]}>
        <boxGeometry args={[0.16, 0.2, 0.02]} />
        <meshStandardMaterial color="#3a2b24" roughness={0.9} />
      </mesh>
      <mesh position={[0.46, 0.015, 0.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.2, 14]} />
        <meshStandardMaterial
          color="#4db8d8"
          emissive={accent}
          emissiveIntensity={0.25}
          roughness={0.15}
          metalness={0.3}
        />
      </mesh>
    </group>
  );
}

/** Mercusuar + perahu. Tema English Harbor. */
function LighthouseProp({ accent }: { accent: string }) {
  const quality = getQuality();
  return (
    <group>
      <mesh position={[0, 0.34, 0]} castShadow={quality.shadows}>
        <cylinderGeometry args={[0.13, 0.19, 0.68, 10]} />
        <meshStandardMaterial color="#f7f1e4" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.42, 0]}>
        <cylinderGeometry args={[0.142, 0.152, 0.14, 10]} />
        <meshStandardMaterial color="#d9543f" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.172, 0.182, 0.14, 10]} />
        <meshStandardMaterial color="#d9543f" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.74, 0]}>
        <cylinderGeometry args={[0.11, 0.11, 0.14, 10]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={2.2} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.85, 0]}>
        <coneGeometry args={[0.14, 0.12, 10]} />
        <meshStandardMaterial color="#2f4858" roughness={0.7} />
      </mesh>
      <pointLight color={accent} intensity={1.6} distance={3.5} position={[0, 0.74, 0]} />
      <mesh position={[0.46, 0.06, 0.26]} rotation={[0, 0.5, 0]} castShadow={quality.shadows}>
        <boxGeometry args={[0.28, 0.1, 0.14]} />
        <meshStandardMaterial color="#8a5a34" roughness={0.85} />
      </mesh>
      <mesh position={[0.46, 0.22, 0.26]}>
        <boxGeometry args={[0.02, 0.22, 0.02]} />
        <meshStandardMaterial color="#6b4a2e" />
      </mesh>
      <mesh position={[0.5, 0.22, 0.26]}>
        <boxGeometry args={[0.12, 0.16, 0.008]} />
        <meshStandardMaterial color="#f7f1e4" roughness={0.9} />
      </mesh>
    </group>
  );
}

/** Pilar teknologi + cincin data berputar. Tema Benteng Digital. */
function TechProp({ color, accent }: { color: string; accent: string }) {
  const quality = getQuality();
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ringRef.current) return;
    ringRef.current.rotation.y = state.clock.elapsedTime * 0.6;
  });

  return (
    <group>
      <mesh position={[0, 0.3, 0]} castShadow={quality.shadows}>
        <boxGeometry args={[0.36, 0.6, 0.36]} />
        <meshStandardMaterial color={color} roughness={0.45} metalness={0.4} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.185, 0.32, 0]}>
          <boxGeometry args={[0.012, 0.44, 0.08]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={2} />
        </mesh>
      ))}
      <mesh ref={ringRef} position={[0, 0.68, 0]} rotation={[Math.PI / 2.4, 0, 0]}>
        <torusGeometry args={[0.2, 0.022, 6, 20]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.6} />
      </mesh>
      <mesh position={[0, 0.34, 0.2]}>
        <boxGeometry args={[0.2, 0.24, 0.03]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.7} metalness={0.5} />
      </mesh>
      <pointLight color={accent} intensity={1.3} distance={3} position={[0, 0.6, 0]} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// PERAKIT
// ---------------------------------------------------------------------------

export type IslandTheme = 'quran' | 'adab' | 'math' | 'arabic' | 'english' | 'digital';

/** Peta id dunia -> tema. Dunia tak dikenal jatuh ke 'adab' (aman). */
export function themeForWorld(worldId: string): IslandTheme {
  const known = ['quran', 'adab', 'math', 'arabic', 'english', 'digital'];
  return known.includes(worldId) ? (worldId as IslandTheme) : 'adab';
}

function MainStructure({ theme, color, accent }: { theme: IslandTheme; color: string; accent: string }) {
  switch (theme) {
    case 'quran':
      return <MosqueProp accent={accent} />;
    case 'adab':
      return <HouseProp color={color} accent={accent} />;
    case 'math':
      return <TowerProp color={color} accent={accent} />;
    case 'arabic':
      return <OasisProp color={color} accent={accent} />;
    case 'english':
      return <LighthouseProp accent={accent} />;
    case 'digital':
      return <TechProp color={color} accent={accent} />;
    default:
      return null;
  }
}

export default function IslandProps({
  theme,
  color,
  accent,
  seed,
  radius = 0.95,
}: {
  theme: IslandTheme;
  color: string;
  accent: string;
  /** Benih pengacak — pakai indeks pulau agar bentuk konsisten antar sesi. */
  seed: number;
  radius?: number;
}) {
  const quality = getQuality();

  const scatter = useMemo(() => {
    const rng = makeRng(seed + 17);
    const count = Math.max(3, Math.round(7 * Math.max(0.45, quality.particleScale)));
    const usePalm = theme === 'arabic' || theme === 'english';

    return Array.from({ length: count }).map((_, i) => {
      // Sebar di cincin, hindari tengah (tempat bangunan utama).
      const angle = (i / count) * Math.PI * 2 + rng() * 0.6;
      const dist = radius * (0.52 + rng() * 0.34);
      const kind = rng();
      return {
        x: Math.cos(angle) * dist,
        z: Math.sin(angle) * dist,
        scale: 0.7 + rng() * 0.5,
        phase: rng() * Math.PI * 2,
        isRock: kind > 0.72,
        isPalm: usePalm && kind < 0.55,
      };
    });
  }, [seed, radius, theme, quality.particleScale]);

  return (
    <group>
      <MainStructure theme={theme} color={color} accent={accent} />

      {scatter.map((s, i) => {
        if (s.isRock) return <Rock key={i} position={[s.x, 0.06, s.z]} scale={s.scale} />;
        if (s.isPalm)
          return <PalmTree key={i} position={[s.x, 0, s.z]} scale={s.scale} swayPhase={s.phase} />;
        return (
          <BlockyTree
            key={i}
            position={[s.x, 0, s.z]}
            scale={s.scale}
            leaf={theme === 'digital' ? '#4a8f9c' : '#4faf62'}
            swayPhase={s.phase}
          />
        );
      })}
    </group>
  );
}
