import { useMemo, useRef } from 'react';
import { useFrame, type RootState } from '@react-three/fiber';
import { Billboard } from '@react-three/drei';
import * as THREE from 'three';

/**
 * worldFx.tsx — Lapisan efek atmosfer untuk peta dunia Brightoria.
 *
 * ====================================================================
 * REVISI PATCH 37 — MERAPIKAN EFEK YANG TERLALU DOMINAN
 * ====================================================================
 * Screenshot pengguna menunjukkan dua masalah nyata dari Patch 33:
 *
 * 1. SelectionBeam terlalu besar dan mengganggu.
 *    Kode lama: coneGeometry(radius 1.25, tinggi 5.2) diletakkan pada
 *    y + 2.6. Pulau sendiri hanya berukuran 2.3 unit, jadi kerucut itu
 *    menjulang lebih dari DUA KALI tinggi pulau, menutupi pulau lain
 *    (Kampung Adab), dan ujung atasnya terpotong tajam di batas kamera
 *    sehingga terlihat seperti sorotan lampu panggung.
 *
 *    PERBAIKAN: kerucut besar DIHAPUS total. Diganti pendekatan yang
 *    jauh lebih halus dan tidak pernah menutupi apa pun:
 *      - Cincin cahaya horizontal tipis di BAWAH pulau (seperti alas
 *        bercahaya), berputar pelan.
 *      - Glow lembut kecil di bawah pulau.
 *      - Beberapa partikel naik pelan di sekitar pulau terpilih.
 *    Semua elemen berada DI BAWAH atau DI SEKITAR pulau, tidak ada yang
 *    menjulang ke atas menutupi area peta lain.
 *
 * 2. Aura pulau menghasilkan "cincin ganda" yang kasar.
 *    Kode lama menumpuk IslandAura (radial glow) dengan cincin emas
 *    pencapaian pada opacity tinggi (0.5 dan 0.35), sehingga tepinya
 *    terlihat keras dan bertumpuk.
 *
 *    PERBAIKAN: opacity diturunkan signifikan, ukuran cincin pencapaian
 *    dibedakan jelas dari aura (tidak lagi hampir sama besar), dan
 *    tekstur cincin dibuat jauh lebih lembut (gradien, bukan garis tegas).
 *
 * ====================================================================
 * PRINSIP YANG DIPERTAHANKAN DARI SEBELUMNYA:
 * ====================================================================
 * - SEMUA elemen PROSEDURAL (CanvasTexture lokal), tanpa file gambar
 *   eksternal. Pelajaran dari Patch 03 (<Environment> drei mengunduh HDR
 *   dari CDN -> scene macet blank) dan Patch 12-15 (background berbasis
 *   file berulang kali gagal tampil).
 * - `useSafeFrame` membungkus SEMUA animasi. Pelajaran dari bug Patch 15:
 *   satu error di dalam useFrame menghentikan SELURUH render loop, dan
 *   React ErrorBoundary tidak bisa menangkapnya.
 * - Setiap partikel punya ref SENDIRI — jangan pernah menebak struktur
 *   `children` dari <Billboard> (penyebab bug fatal Patch 15).
 * ====================================================================
 */

/** Pembungkus aman untuk useFrame — mencegah SATU bug animasi
 *  menghentikan SELURUH render peta. */
export function useSafeFrame(callback: (state: RootState, delta: number) => void) {
  useFrame((state, delta) => {
    try {
      callback(state, delta);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[Brightoria] useFrame error diredam (worldFx):', err);
    }
  });
}

// ---------------------------------------------------------------------------
// Tekstur prosedural bersama (dibuat sekali di level modul)
// ---------------------------------------------------------------------------

let sharedSoftGlow: THREE.CanvasTexture | null = null;
function getSoftGlowTexture(): THREE.CanvasTexture {
  if (sharedSoftGlow) return sharedSoftGlow;
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,0.9)');
  g.addColorStop(0.4, 'rgba(255,255,255,0.28)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  sharedSoftGlow = new THREE.CanvasTexture(canvas);
  sharedSoftGlow.needsUpdate = true;
  return sharedSoftGlow;
}

/**
 * Cincin LEMBUT — Patch 37.
 * Versi lama memakai `ctx.stroke()` dengan lineWidth tegas sehingga
 * tepinya terlihat keras dan "murahan" saat ditumpuk dengan aura.
 * Versi ini memakai gradien radial yang memuncak di radius cincin lalu
 * memudar ke dua arah, menghasilkan cincin yang jauh lebih halus.
 */
let sharedRingTexture: THREE.CanvasTexture | null = null;
function getRingTexture(): THREE.CanvasTexture {
  if (sharedRingTexture) return sharedRingTexture;
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(0.62, 'rgba(255,255,255,0)');
  g.addColorStop(0.78, 'rgba(255,255,255,0.55)');
  g.addColorStop(0.9, 'rgba(255,255,255,0.12)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  sharedRingTexture = new THREE.CanvasTexture(canvas);
  sharedRingTexture.needsUpdate = true;
  return sharedRingTexture;
}

let sharedBirdTexture: THREE.CanvasTexture | null = null;
function getBirdTexture(): THREE.CanvasTexture {
  if (sharedBirdTexture) return sharedBirdTexture;
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.strokeStyle = 'rgba(70,90,110,0.8)';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(8, 36);
  ctx.quadraticCurveTo(20, 20, 32, 34);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(32, 34);
  ctx.quadraticCurveTo(44, 20, 56, 36);
  ctx.stroke();
  sharedBirdTexture = new THREE.CanvasTexture(canvas);
  sharedBirdTexture.needsUpdate = true;
  return sharedBirdTexture;
}

// ---------------------------------------------------------------------------
// 1) Ocean — lautan dengan riak melingkar yang mengembang
// ---------------------------------------------------------------------------

function Ripple({ delay, maxRadius }: { delay: number; maxRadius: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = getRingTexture();

  useSafeFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    const cycle = 6;
    const local = ((t + delay) % cycle) / cycle;
    const scale = 0.4 + local * maxRadius;
    meshRef.current.scale.set(scale, scale, 1);
    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    // Patch 37: opacity diturunkan dari 0.32 -> 0.2 supaya riak tidak
    // ikut membuat peta terasa ramai.
    if (mat) mat.opacity = Math.max(0, 0.2 * (1 - local));
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.96, 0]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={texture} transparent opacity={0.2} depthWrite={false} fog={false} />
    </mesh>
  );
}

export function Ocean() {
  const discRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.CircleGeometry(6.2, 64);
    const pos = geo.attributes.position;
    const colors: number[] = [];
    const inner = new THREE.Color('#7fc9e0');
    const outer = new THREE.Color('#e4f4ee');
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const d = Math.min(1, Math.sqrt(x * x + y * y) / 6.2);
      const c = inner.clone().lerp(outer, d);
      colors.push(c.r, c.g, c.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    return geo;
  }, []);

  useSafeFrame((state) => {
    if (!discRef.current) return;
    const t = state.clock.elapsedTime;
    discRef.current.position.y = -3 + Math.sin(t * 0.55) * 0.05;
    discRef.current.rotation.z += 0.0004;
  });

  return (
    <group>
      <mesh ref={discRef} geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, 0]}>
        <meshBasicMaterial vertexColors transparent opacity={0.5} depthWrite={false} fog={false} />
      </mesh>
      <Ripple delay={0} maxRadius={9} />
      <Ripple delay={2} maxRadius={9} />
      <Ripple delay={4} maxRadius={9} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// 2) WorldSkyRays — berkas cahaya matahari miring di latar
// ---------------------------------------------------------------------------

export function WorldSkyRays({ count = 4 }: { count?: number }) {
  const groupRef = useRef<THREE.Group>(null);

  const texture = useMemo(() => {
    const w = 8;
    const h = 256;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(255,244,205,0.4)');
    g.addColorStop(0.5, 'rgba(255,238,180,0.16)');
    g.addColorStop(1, 'rgba(255,238,180,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, []);

  const rays = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        offsetX: -4 + i * 2.4,
        width: 0.9 + Math.random() * 0.9,
        tilt: 0.3 + Math.random() * 0.1,
        speed: 0.04 + Math.random() * 0.04,
        phase: Math.random() * Math.PI * 2,
      })),
    [count],
  );

  useSafeFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.children.forEach((child, i) => {
      const r = rays[i];
      if (!r) return;
      child.position.x = r.offsetX + Math.sin(t * r.speed + r.phase) * 0.4;
      const mesh = child as THREE.Mesh;
      const mat = mesh.material as THREE.MeshBasicMaterial | undefined;
      // Patch 37: opacity puncak diturunkan (0.44 -> 0.3) supaya sky rays
      // menjadi latar, bukan elemen yang menarik perhatian.
      if (mat) mat.opacity = 0.22 + Math.sin(t * 0.45 + r.phase) * 0.08;
    });
  });

  return (
    <group ref={groupRef} position={[0, 3.5, -9]}>
      {rays.map((r, i) => (
        <mesh key={i} position={[r.offsetX, 0, 0]} rotation={[0, 0, r.tilt]}>
          <planeGeometry args={[r.width, 13]} />
          <meshBasicMaterial
            map={texture}
            transparent
            opacity={0.26}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            fog={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// 3) Birds — burung kecil melintas
// ---------------------------------------------------------------------------

function Bird({
  startX,
  y,
  z,
  speed,
  scale,
  phase,
}: {
  startX: number;
  y: number;
  z: number;
  speed: number;
  scale: number;
  phase: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const texture = getBirdTexture();

  useSafeFrame((state, delta) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.position.x += delta * speed;
    if (groupRef.current.position.x > 11) groupRef.current.position.x = -11;
    groupRef.current.position.y = y + Math.sin(t * 1.6 + phase) * 0.28;
  });

  return (
    <group ref={groupRef} position={[startX, y, z]}>
      <Billboard>
        <mesh scale={scale}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial map={texture} transparent opacity={0.45} depthWrite={false} fog={false} />
        </mesh>
      </Billboard>
    </group>
  );
}

export function Birds({ count = 4 }: { count?: number }) {
  const seeds = useMemo(
    () =>
      Array.from({ length: count }).map(() => ({
        startX: -11 + Math.random() * 22,
        y: 2.6 + Math.random() * 2.4,
        z: -6 - Math.random() * 4,
        speed: 0.5 + Math.random() * 0.5,
        scale: 0.28 + Math.random() * 0.2,
        phase: Math.random() * Math.PI * 2,
      })),
    [count],
  );

  return (
    <>
      {seeds.map((s, i) => (
        <Bird key={i} startX={s.startX} y={s.y} z={s.z} speed={s.speed} scale={s.scale} phase={s.phase} />
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// 4) IslandAura — Patch 37: jauh lebih halus, tidak lagi "cincin ganda"
// ---------------------------------------------------------------------------

export function IslandAura({
  color,
  active,
  hovered,
  mastery,
}: {
  color: string;
  active: boolean;
  hovered: boolean;
  mastery: number;
}) {
  const auraRef = useRef<THREE.Mesh>(null);
  const achieveRef = useRef<THREE.Mesh>(null);
  const texture = getSoftGlowTexture();
  const isAchieved = mastery >= 70;

  useSafeFrame((state) => {
    const t = state.clock.elapsedTime;
    if (auraRef.current) {
      const mat = auraRef.current.material as THREE.MeshBasicMaterial;
      // Patch 37: opacity diturunkan drastis (aktif 0.5 -> 0.26,
      // hover 0.34 -> 0.18, diam 0.16 -> 0.09) agar aura menjadi
      // sentuhan lembut, bukan lingkaran mencolok.
      const base = active ? 0.26 : hovered ? 0.18 : 0.09;
      if (mat) mat.opacity = base + Math.sin(t * 1.2) * 0.03;
      const pulse = (active ? 2.75 : 2.5) + Math.sin(t * 1.2) * 0.05;
      auraRef.current.scale.setScalar(pulse);
    }
    if (achieveRef.current) {
      achieveRef.current.rotation.z += 0.003;
      const mat = achieveRef.current.material as THREE.MeshBasicMaterial;
      if (mat) mat.opacity = 0.2 + Math.sin(t * 0.9) * 0.06;
    }
  });

  return (
    <>
      <mesh ref={auraRef} position={[0, 0, -0.06]} scale={2.5}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          map={texture}
          color={color}
          transparent
          opacity={0.12}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          fog={false}
        />
      </mesh>
      {isAchieved && (
        // Patch 37: cincin pencapaian dibuat JELAS LEBIH BESAR dari aura
        // (3.5 vs 2.5) supaya keduanya terbaca sebagai dua lapisan
        // berbeda, bukan "cincin ganda" yang saling menempel.
        <mesh ref={achieveRef} position={[0, 0, -0.08]} scale={3.5}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            map={getRingTexture()}
            color="#f3c861"
            transparent
            opacity={0.2}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            fog={false}
          />
        </mesh>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// 5) SelectionGlow — Patch 37: PENGGANTI SelectionBeam yang mengganggu
// ---------------------------------------------------------------------------

function RisingMote({
  angle,
  radius,
  speed,
  phase,
  color,
}: {
  angle: number;
  radius: number;
  speed: number;
  phase: number;
  color: string;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const texture = getSoftGlowTexture();

  useSafeFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    const cycle = 4;
    const local = ((t * speed + phase) % cycle) / cycle;
    groupRef.current.position.y = -1.15 + local * 1.9;
    const scale = 0.16 * Math.sin(local * Math.PI);
    groupRef.current.scale.setScalar(Math.max(0.001, scale));
  });

  return (
    <group ref={groupRef} position={[Math.cos(angle) * radius, -1.15, Math.sin(angle) * radius]}>
      <Billboard>
        <mesh>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            map={texture}
            color={color}
            transparent
            opacity={0.65}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            fog={false}
          />
        </mesh>
      </Billboard>
    </group>
  );
}

/**
 * SelectionGlow — penanda pulau terpilih yang RAPI.
 *
 * Menggantikan `SelectionBeam` dari Patch 33 yang memakai kerucut cahaya
 * raksasa menjulang ke langit. Pendekatan baru: semua elemen berada di
 * BAWAH atau DI SEKITAR pulau, sehingga tidak pernah menutupi pulau lain
 * maupun terpotong di batas layar.
 *
 * Tiga lapisan:
 *   1. Cincin cahaya horizontal tipis (alas bercahaya) yang berputar pelan
 *   2. Glow lembut kecil tepat di bawah pulau
 *   3. Lima partikel naik pelan mengelilingi pulau
 */
export function SelectionGlow({ position, color }: { position: [number, number, number]; color: string }) {
  const ringRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const ringTexture = getRingTexture();
  const glowTexture = getSoftGlowTexture();

  const motes = useMemo(
    () =>
      Array.from({ length: 5 }).map((_, i) => ({
        angle: (i / 5) * Math.PI * 2,
        radius: 0.55 + Math.random() * 0.3,
        speed: 0.5 + Math.random() * 0.3,
        phase: Math.random() * 4,
      })),
    [],
  );

  useSafeFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ringRef.current) {
      ringRef.current.rotation.z += 0.006;
      const s = 1.5 + Math.sin(t * 1.6) * 0.06;
      ringRef.current.scale.set(s, s, 1);
      const mat = ringRef.current.material as THREE.MeshBasicMaterial;
      if (mat) mat.opacity = 0.42 + Math.sin(t * 1.6) * 0.1;
    }
    if (glowRef.current) {
      const s = 1.15 + Math.sin(t * 1.6) * 0.07;
      glowRef.current.scale.set(s, s, 1);
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      if (mat) mat.opacity = 0.3 + Math.sin(t * 1.6) * 0.07;
    }
  });

  return (
    <group position={position}>
      {/* Cincin horizontal di bawah pulau — dimiringkan mengikuti bidang
          lantai supaya terbaca sebagai "alas bercahaya", bukan lingkaran
          yang menghadap kamera. */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2.2, 0, 0]} position={[0, -1.12, 0]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          map={ringTexture}
          color={color}
          transparent
          opacity={0.42}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          fog={false}
        />
      </mesh>

      <mesh ref={glowRef} rotation={[-Math.PI / 2.2, 0, 0]} position={[0, -1.14, 0]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          map={glowTexture}
          color={color}
          transparent
          opacity={0.3}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          fog={false}
        />
      </mesh>

      {motes.map((m, i) => (
        <RisingMote key={i} angle={m.angle} radius={m.radius} speed={m.speed} phase={m.phase} color={color} />
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// 6) ProceduralClouds — awan tanpa file gambar
// ---------------------------------------------------------------------------

function Cloud({
  startX,
  y,
  z,
  speed,
  scale,
}: {
  startX: number;
  y: number;
  z: number;
  speed: number;
  scale: number;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useSafeFrame((_state, delta) => {
    if (!groupRef.current) return;
    groupRef.current.position.x += delta * speed;
    if (groupRef.current.position.x > 13) groupRef.current.position.x = -13;
  });

  const puffs: [number, number, number][] = [
    [0, 0, 0.95],
    [0.78, 0.1, 0.68],
    [-0.78, 0.08, 0.62],
    [0.3, 0.36, 0.52],
    [-0.34, 0.32, 0.48],
  ];

  return (
    <group ref={groupRef} position={[startX, y, z]} scale={scale}>
      <Billboard>
        <group>
          {puffs.map((p, i) => (
            <mesh key={i} position={[p[0], p[1], 0]}>
              <circleGeometry args={[p[2], 22]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.72} depthWrite={false} fog={false} />
            </mesh>
          ))}
        </group>
      </Billboard>
    </group>
  );
}

export function ProceduralClouds() {
  const seeds = useMemo(
    () => [
      { startX: -7, y: 3.6, z: -7, speed: 0.22, scale: 1.15 },
      { startX: 2, y: 2.5, z: -8.5, speed: 0.15, scale: 0.85 },
      { startX: 7, y: 4.2, z: -6, speed: 0.19, scale: 0.68 },
      { startX: -3, y: 4.9, z: -10, speed: 0.11, scale: 1.4 },
    ],
    [],
  );

  return (
    <>
      {seeds.map((s, i) => (
        <Cloud key={i} startX={s.startX} y={s.y} z={s.z} speed={s.speed} scale={s.scale} />
      ))}
    </>
  );
}
