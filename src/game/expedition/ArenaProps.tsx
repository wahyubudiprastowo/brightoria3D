import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getQuality } from '../../render/quality';
import { NAVY, SKY, WORLD } from '../../theme/brightBrand';
import { AIRA_POSITION } from './questData';
import {
  ARENA_RADIUS,
  LAKE,
  LAKE_LEVEL,
  PATH_WIDTH,
  distanceToPath,
  portals,
  starSpots,
  terrainHeight,
} from './expeditionData';

/**
 * ArenaProps.tsx — Isi arena Ekspedisi (Patch 45).
 *
 * ====================================================================
 * PENINGKATAN REALISME PATCH 45
 * ====================================================================
 * Yang ditambahkan, diurutkan dari dampak terbesar:
 *
 * 1. BAYANGAN KONTAK. Ini yang PALING TERASA. Objek tanpa bayangan di
 *    titik sentuhnya selalu terbaca "menempel" ke permukaan, bukan
 *    "berdiri" di atasnya — otak manusia memakai bayangan kontak
 *    sebagai isyarat utama untuk menilai apakah benda menyentuh tanah.
 *
 *    Shadow map biasa tidak cukup: di tier rendah ia dimatikan, dan
 *    bahkan saat aktif, bayangannya terlalu lembut di titik sentuh.
 *    Bayangan kontak di sini berupa cakram gelap semi-tembus tepat di
 *    bawah tiap objek — murah, dan selalu ada di semua tier.
 *
 * 2. RUMPUT KECIL. Bidang tanah polos terbaca sebagai permukaan
 *    buatan. Rumpun rumput tipis memecah keseragaman itu.
 *
 * 3. BUIH TEPI DANAU. Batas air-darat yang tegas terlihat seperti
 *    stiker ditempel. Cincin buih lembut membuat transisinya alami.
 *
 * 4. BATANG POHON MENGERUCUT. Batang silinder seragam adalah penanda
 *    jelas objek buatan. Pangkal yang sedikit lebih lebar meniru
 *    bentuk pohon sungguhan.
 *
 * ====================================================================
 * KENAPA INSTANCED MESH
 * ====================================================================
 * Mengisi arena butuh ratusan objek. Kalau tiap pohon jadi <mesh>
 * sendiri, itu ratusan draw call — berat untuk HP kelas menengah.
 * InstancedMesh menggambar SELURUH pohon dalam SATU draw call.
 *
 * Bayangan kontak pun memakai instancing, jadi menambahkannya untuk
 * ratusan objek hanya menambah beberapa draw call, bukan ratusan.
 *
 * ====================================================================
 * ATURAN PENEMPATAN
 * ====================================================================
 * Objek TIDAK BOLEH tumbuh di tempat yang mengganggu permainan:
 *   Gerbang 4.4 · Bintang 1.6 · Aira 2.8 · Alun-alun 3.2
 *   Danau +0.5 · Jalan setapak · Tepi arena 1.8
 *
 * Penyebaran memakai pengacak DETERMINISTIK: benih sama menghasilkan
 * susunan sama, jadi arena tidak "berubah bentuk" tiap dibuka.
 * ====================================================================
 */

interface Placement {
  x: number;
  y: number;
  z: number;
  rot: number;
  scale: number;
  /** Kemiringan kecil agar tidak semua berdiri tegak sempurna. */
  tiltX: number;
  tiltZ: number;
  /** Pergeseran warna -1..1 untuk variasi antar-instance. */
  shade: number;
}

/**
 * Membuang geometry & material dari memori GPU saat komponen dilepas.
 * Tanpa ini, tiap kali arena dibuka-tutup meninggalkan buffer
 * menggantung — kebocoran yang baru terasa setelah beberapa kali.
 */
function useDisposeOnUnmount(geometry: THREE.BufferGeometry, material: THREE.Material) {
  useLayoutEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);
}

/** Pengacak deterministik — benih sama, hasil selalu sama. */
function makeRng(seed: number) {
  let s = seed * 9301 + 49297;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/** Apakah titik ini boleh ditumbuhi objek? */
function isPlaceable(x: number, z: number): boolean {
  const r = Math.hypot(x, z);

  if (r > ARENA_RADIUS - 1.8) return false; // terlalu dekat tepi
  if (r < 3.2) return false; // alun-alun & monumen harus lapang

  for (const p of portals) {
    if (Math.hypot(x - p.position[0], z - p.position[1]) < 4.4) return false;
  }
  for (const [sx, sz] of starSpots) {
    if (Math.hypot(x - sx, z - sz) < 1.6) return false;
  }
  if (Math.hypot(x - AIRA_POSITION[0], z - AIRA_POSITION[1]) < 2.8) return false;
  if (Math.hypot(x - LAKE.x, z - LAKE.z) < LAKE.radius + 0.5) return false;
  if (distanceToPath(x, z) < PATH_WIDTH + 0.35) return false;

  return true;
}

/**
 * Sebar objek memakai cincin konsentris, bukan acak murni.
 * Acak murni cenderung menggumpal dan meninggalkan area kosong besar.
 */
function scatter(
  seed: number,
  target: number,
  minR: number,
  maxR: number,
  minGap = 1.15,
): Placement[] {
  const rng = makeRng(seed);
  const result: Placement[] = [];
  let attempts = 0;

  while (result.length < target && attempts < target * 14) {
    attempts += 1;
    const angle = rng() * Math.PI * 2;
    const radius = minR + rng() * (maxR - minR);
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    if (!isPlaceable(x, z)) continue;

    let tooClose = false;
    for (const placed of result) {
      if (Math.hypot(x - placed.x, z - placed.z) < minGap) {
        tooClose = true;
        break;
      }
    }
    if (tooClose) continue;

    result.push({
      x,
      y: terrainHeight(x, z),
      z,
      rot: rng() * Math.PI * 2,
      scale: 0.75 + rng() * 0.6,
      tiltX: (rng() - 0.5) * 0.1,
      tiltZ: (rng() - 0.5) * 0.1,
      shade: (rng() - 0.5) * 2,
    });
  }

  return result;
}

// ---------------------------------------------------------------------------
// PEMBUNGKUS INSTANCED MESH
// ---------------------------------------------------------------------------

function InstancedGroup({
  placements,
  geometry,
  material,
  offsetY = 0,
  scaleY = 1,
  castShadow = true,
  /** Kekuatan variasi warna antar-instance (0 = seragam). */
  shadeAmount = 0,
  baseColor,
  /** Abaikan kemiringan per-instance (untuk objek datar). */
  flat = false,
  /** Pengali skala mendatar, dipakai bayangan kontak. */
  spread = 1,
}: {
  placements: Placement[];
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  offsetY?: number;
  scaleY?: number;
  castShadow?: boolean;
  shadeAmount?: number;
  baseColor?: string;
  flat?: boolean;
  spread?: number;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const quality = getQuality();

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;

    const dummy = new THREE.Object3D();
    placements.forEach((p, i) => {
      dummy.position.set(p.x, p.y + offsetY * p.scale, p.z);
      if (flat) {
        // Bayangan kontak & rumput selalu mendatar mengikuti tanah.
        dummy.rotation.set(-Math.PI / 2, 0, p.rot);
      } else {
        dummy.rotation.set(p.tiltX, p.rot, p.tiltZ);
      }
      dummy.scale.set(p.scale * spread, p.scale * scaleY * (flat ? spread : 1), p.scale * spread);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;

    // Variasi warna per-instance: tetap satu draw call, tapi hutan
    // tidak lagi terlihat seperti duplikat satu pohon.
    if (shadeAmount > 0 && baseColor) {
      const c = new THREE.Color();
      placements.forEach((p, i) => {
        c.set(baseColor);
        c.multiplyScalar(1 + p.shade * shadeAmount);
        // Sedikit pergeseran rona agar tidak sekadar terang/gelap
        c.offsetHSL(p.shade * 0.012, 0, 0);
        mesh.setColorAt(i, c);
      });
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }

    mesh.computeBoundingSphere();
  }, [placements, offsetY, scaleY, shadeAmount, baseColor, flat, spread]);

  if (placements.length === 0) return null;

  return (
    <instancedMesh
      ref={ref}
      args={[geometry, material, placements.length]}
      castShadow={castShadow && quality.shadows}
      receiveShadow={quality.shadows && !flat}
      frustumCulled={false}
    />
  );
}

// ---------------------------------------------------------------------------
// BAYANGAN KONTAK — tekstur cakram lembut
// ---------------------------------------------------------------------------

/**
 * Membuat tekstur bayangan: gelap di pusat, memudar ke tepi.
 *
 * Dibuat sekali di tingkat modul lalu dipakai bersama semua bayangan
 * kontak, sehingga tidak ada pengulangan pembuatan kanvas.
 */
let sharedShadowTexture: THREE.CanvasTexture | null = null;

function getShadowTexture(): THREE.CanvasTexture {
  if (sharedShadowTexture) return sharedShadowTexture;

  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  // Pusat cukup pekat agar titik sentuh terbaca jelas, lalu memudar
  // cepat — bayangan kontak di dunia nyata memang tajam di pusatnya.
  g.addColorStop(0, 'rgba(8, 24, 40, 0.5)');
  g.addColorStop(0.45, 'rgba(8, 24, 40, 0.26)');
  g.addColorStop(0.75, 'rgba(8, 24, 40, 0.08)');
  g.addColorStop(1, 'rgba(8, 24, 40, 0)');

  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  sharedShadowTexture = new THREE.CanvasTexture(canvas);
  sharedShadowTexture.needsUpdate = true;
  return sharedShadowTexture;
}

/**
 * Bayangan kontak untuk sekumpulan objek.
 *
 * `polygonOffset` mencegah z-fighting: bayangan dan permukaan tanah
 * berada pada ketinggian hampir sama, dan tanpa offset keduanya akan
 * berkedip-kedip saat kamera bergerak.
 */
function ContactShadows({
  placements,
  spread = 1,
  opacity = 1,
}: {
  placements: Placement[];
  spread?: number;
  opacity?: number;
}) {
  const texture = useMemo(() => getShadowTexture(), []);

  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
        fog: true,
      }),
    [texture, opacity],
  );

  useDisposeOnUnmount(geometry, material);

  return (
    <InstancedGroup
      placements={placements}
      geometry={geometry}
      material={material}
      offsetY={0.035}
      castShadow={false}
      flat
      spread={spread}
    />
  );
}

// ---------------------------------------------------------------------------
// LOGO: hapus latar putih secara programatis
// ---------------------------------------------------------------------------

/**
 * Memuat berkas logo lalu MENGHAPUS LATAR PUTIHNYA.
 *
 * Berkas logo Bright berlatar putih pekat (bukan transparan). Kalau
 * ditempel apa adanya ke bidang 3D, yang terlihat adalah persegi putih
 * besar — bukan logonya.
 *
 * Memakai nilai MINIMUM dari R/G/B (bukan rata-rata) supaya biru muda
 * pada logo TIDAK ikut terhapus — biru muda punya komponen merah yang
 * rendah, jadi aman.
 */
function useTransparentLogo(url: string): THREE.CanvasTexture | null {
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    let cancelled = false;
    let created: THREE.CanvasTexture | null = null;

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      if (cancelled) return;
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const px = data.data;

        const SOLID = 205; // di bawah ini: piksel logo, biarkan utuh
        const CLEAR = 232; // di atas ini: latar, hapus sepenuhnya

        for (let i = 0; i < px.length; i += 4) {
          if (px[i + 3] === 0) continue; // sudah transparan
          const lowest = Math.min(px[i], px[i + 1], px[i + 2]);
          if (lowest >= CLEAR) {
            px[i + 3] = 0;
          } else if (lowest > SOLID) {
            px[i + 3] = Math.round(((CLEAR - lowest) / (CLEAR - SOLID)) * 255);
          }
        }

        ctx.putImageData(data, 0, 0);

        created = new THREE.CanvasTexture(canvas);
        created.colorSpace = THREE.SRGBColorSpace;
        created.anisotropy = 4;
        created.needsUpdate = true;
        setTexture(created);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[Brightoria] Gagal memproses logo (diabaikan):', err);
      }
    };

    img.onerror = () => {
      // eslint-disable-next-line no-console
      console.warn('[Brightoria] Berkas logo tidak ditemukan:', url);
    };

    img.src = url;

    return () => {
      cancelled = true;
      if (created) created.dispose();
    };
  }, [url]);

  return texture;
}

// ---------------------------------------------------------------------------
// MONUMEN LOGO — landmark utama di alun-alun tengah
// ---------------------------------------------------------------------------

function BrandMonument() {
  const quality = getQuality();
  const medallionRef = useRef<THREE.Group>(null);
  const groundY = useMemo(() => terrainHeight(0, 0), []);
  const logoTexture = useTransparentLogo('/assets/brand/bright-icon.png');

  useFrame((state) => {
    if (!medallionRef.current || !quality.motion) return;
    const t = state.clock.elapsedTime;
    medallionRef.current.rotation.y = t * 0.2;
    medallionRef.current.position.y = 2.25 + Math.sin(t * 0.85) * 0.06;
  });

  return (
    <group position={[0, groundY, 0]}>
      {/* Alas bertingkat — navy pekat, memberi bobot visual */}
      <mesh position={[0, 0.1, 0]} receiveShadow={quality.shadows} castShadow={quality.shadows}>
        <cylinderGeometry args={[2.1, 2.35, 0.2, 8]} />
        <meshStandardMaterial color={NAVY.deepest} roughness={0.88} metalness={0.05} flatShading />
      </mesh>
      <mesh position={[0, 0.29, 0]} receiveShadow={quality.shadows} castShadow={quality.shadows}>
        <cylinderGeometry args={[1.55, 1.8, 0.2, 8]} />
        <meshStandardMaterial color={NAVY.mid} roughness={0.8} metalness={0.08} flatShading />
      </mesh>

      {/* Tiang penyangga */}
      <mesh position={[0, 1.12, 0]} castShadow={quality.shadows}>
        <cylinderGeometry args={[0.19, 0.27, 1.5, 6]} />
        <meshStandardMaterial color={NAVY.deep} roughness={0.55} metalness={0.3} flatShading />
      </mesh>

      {/* Cincin cahaya di pangkal tiang */}
      <mesh position={[0, 0.42, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.72, 0.95, 24]} />
        <meshBasicMaterial color={SKY.base} transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>

      {/* Medali berisi logo */}
      <group ref={medallionRef} position={[0, 2.25, 0]}>
        {/* Cakram belakang — memberi ketebalan & latar untuk logo */}
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow={quality.shadows}>
          <cylinderGeometry args={[0.92, 0.92, 0.1, 32]} />
          <meshStandardMaterial color="#ffffff" roughness={0.45} metalness={0.1} />
        </mesh>

        {/* Bingkai emas */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.93, 0.07, 10, 36]} />
          <meshStandardMaterial
            color="#e0a63e"
            emissive="#e0a63e"
            emissiveIntensity={0.3}
            roughness={0.28}
            metalness={0.75}
          />
        </mesh>

        {/* Logo — dipasang di kedua sisi cakram */}
        {logoTexture && (
          <>
            <mesh position={[0, 0, 0.056]}>
              <planeGeometry args={[1.32, 1.32]} />
              <meshBasicMaterial map={logoTexture} transparent alphaTest={0.04} toneMapped={false} />
            </mesh>
            <mesh position={[0, 0, -0.056]} rotation={[0, Math.PI, 0]}>
              <planeGeometry args={[1.32, 1.32]} />
              <meshBasicMaterial map={logoTexture} transparent alphaTest={0.04} toneMapped={false} />
            </mesh>
          </>
        )}
      </group>

      <pointLight color={SKY.base} intensity={2.2} distance={8} position={[0, 2.2, 0]} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// DANAU
// ---------------------------------------------------------------------------

function Lake() {
  const ref = useRef<THREE.Mesh>(null);
  const foamRef = useRef<THREE.Mesh>(null);
  const quality = getQuality();

  const geometry = useMemo(() => new THREE.CircleGeometry(LAKE.radius + 0.15, 32), []);
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: WORLD.waterShallow,
        transparent: true,
        opacity: 0.86,
        roughness: 0.08,
        metalness: 0.55,
      }),
    [],
  );

  useDisposeOnUnmount(geometry, material);

  /**
   * Cincin buih di tepi danau.
   *
   * Batas air-darat yang tegas terbaca seperti stiker ditempel. Cincin
   * lembut ini membuat transisinya terasa alami — air seolah menyapu
   * pasir di tepiannya.
   */
  const foamGeometry = useMemo(
    () => new THREE.RingGeometry(LAKE.radius - 0.1, LAKE.radius + 0.42, 36),
    [],
  );
  const foamMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: WORLD.waterFoam,
        transparent: true,
        opacity: 0.32,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    [],
  );

  useDisposeOnUnmount(foamGeometry, foamMaterial);

  useFrame((state) => {
    if (!quality.motion) return;
    const t = state.clock.elapsedTime;
    const bob = Math.sin(t * 0.9) * 0.022;

    if (ref.current) ref.current.position.y = LAKE_LEVEL + bob;

    if (foamRef.current) {
      foamRef.current.position.y = LAKE_LEVEL + bob + 0.012;
      // Buih berdenyut pelan, meniru pasang-surut kecil.
      const pulse = 1 + Math.sin(t * 0.7) * 0.02;
      foamRef.current.scale.set(pulse, pulse, 1);
      const mat = foamRef.current.material as THREE.MeshBasicMaterial;
      if (mat) mat.opacity = 0.3 + Math.sin(t * 1.1) * 0.06;
    }
  });

  return (
    <group>
      <mesh
        ref={ref}
        geometry={geometry}
        material={material}
        position={[LAKE.x, LAKE_LEVEL, LAKE.z]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow={false}
      />
      <mesh
        ref={foamRef}
        geometry={foamGeometry}
        material={foamMaterial}
        position={[LAKE.x, LAKE_LEVEL + 0.012, LAKE.z]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
    </group>
  );
}

// ---------------------------------------------------------------------------
// PEGUNUNGAN KEJAUHAN
// ---------------------------------------------------------------------------

/**
 * Cincin gunung di luar arena.
 *
 * Bukan hiasan semata: tanpa siluet di kejauhan, mata tidak punya acuan
 * jarak dan dunia terasa datar. Ditempatkan di radius 23-27 sehingga
 * tersaput kabut dan memberi kedalaman atmosfer.
 */
function DistantMountains() {
  const quality = getQuality();

  const placements = useMemo<Placement[]>(() => {
    const rng = makeRng(777);
    const count = quality.tier === 'low' ? 14 : 22;
    return Array.from({ length: count }).map((_, i) => {
      const angle = (i / count) * Math.PI * 2 + rng() * 0.22;
      const radius = 23 + rng() * 4.5;
      return {
        x: Math.cos(angle) * radius,
        y: -1.2,
        z: Math.sin(angle) * radius,
        rot: rng() * Math.PI * 2,
        scale: 2.6 + rng() * 3.4,
        tiltX: 0,
        tiltZ: 0,
        shade: (rng() - 0.5) * 2,
      };
    });
  }, [quality.tier]);

  const geometry = useMemo(() => new THREE.ConeGeometry(1, 1.9, 5), []);
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#ffffff',
        roughness: 1,
        metalness: 0,
        flatShading: true,
      }),
    [],
  );

  useDisposeOnUnmount(geometry, material);

  return (
    <InstancedGroup
      placements={placements}
      geometry={geometry}
      material={material}
      offsetY={0.95}
      castShadow={false}
      shadeAmount={0.16}
      baseColor={WORLD.mountain}
    />
  );
}

// ---------------------------------------------------------------------------
// KOMPONEN UTAMA
// ---------------------------------------------------------------------------

export default function ArenaProps() {
  const quality = getQuality();

  // Jumlah objek mengikuti kelas perangkat.
  const density = quality.tier === 'low' ? 0.45 : quality.tier === 'balanced' ? 0.78 : 1;

  const trees = useMemo(() => scatter(101, Math.round(34 * density), 3.8, 14), [density]);
  const pines = useMemo(() => scatter(202, Math.round(18 * density), 6, 14.2), [density]);
  const rocks = useMemo(() => scatter(303, Math.round(22 * density), 3.6, 14), [density]);
  const bushes = useMemo(() => scatter(404, Math.round(26 * density), 3.4, 14), [density]);

  /**
   * Rumpun rumput.
   *
   * Jauh lebih rapat daripada objek lain (jarak minimum 0.42) karena
   * fungsinya memecah keseragaman bidang tanah, bukan menjadi landmark.
   * Dimatikan di tier rendah agar tidak membebani HP hemat daya.
   */
  const grassTufts = useMemo(
    () => (quality.tier === 'low' ? [] : scatter(606, Math.round(120 * density), 3.4, 14.5, 0.42)),
    [density, quality.tier],
  );

  /** Batu pijakan di sepanjang jalan setapak menuju tiap gerbang. */
  const pathStones = useMemo<Placement[]>(() => {
    const rng = makeRng(505);
    const stones: Placement[] = [];
    for (const p of portals) {
      const [px, pz] = p.position;
      const len = Math.hypot(px, pz);
      const steps = Math.floor(len / 1.5);
      for (let i = 2; i < steps - 1; i++) {
        const t = i / steps;
        // Sedikit bergeser ke samping supaya jalan tidak terlihat
        // seperti garis lurus hasil penggaris.
        const jitter = (rng() - 0.5) * 0.5;
        const nx = -pz / len;
        const nz = px / len;
        const x = px * t + nx * jitter;
        const z = pz * t + nz * jitter;
        stones.push({
          x,
          y: terrainHeight(x, z),
          z,
          rot: rng() * Math.PI * 2,
          scale: 0.7 + rng() * 0.35,
          tiltX: 0,
          tiltZ: 0,
          shade: (rng() - 0.5) * 2,
        });
      }
    }
    return stones;
  }, []);

  // --- Geometry & material (dibuat sekali, dibuang saat dilepas) ---
  // Material diberi warna putih agar `setColorAt` per-instance bekerja
  // sebagai pengali, bukan bertumpuk dengan warna dasar.

  /**
   * Batang mengerucut: pangkal lebih lebar daripada ujung.
   * Batang silinder seragam adalah penanda paling jelas objek buatan.
   */
  const trunkGeo = useMemo(() => new THREE.CylinderGeometry(0.075, 0.115, 0.85, 6), []);
  const trunkMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.95, flatShading: true }),
    [],
  );
  useDisposeOnUnmount(trunkGeo, trunkMat);

  const leafLowGeo = useMemo(() => new THREE.BoxGeometry(0.95, 0.62, 0.95), []);
  const leafLowMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9, flatShading: true }),
    [],
  );
  useDisposeOnUnmount(leafLowGeo, leafLowMat);

  const leafTopGeo = useMemo(() => new THREE.BoxGeometry(0.62, 0.48, 0.62), []);
  const leafTopMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9, flatShading: true }),
    [],
  );
  useDisposeOnUnmount(leafTopGeo, leafTopMat);

  const pineGeo = useMemo(() => new THREE.ConeGeometry(0.58, 1.55, 6), []);
  const pineMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.92, flatShading: true }),
    [],
  );
  useDisposeOnUnmount(pineGeo, pineMat);

  const rockGeo = useMemo(() => new THREE.IcosahedronGeometry(0.32, 0), []);
  const rockMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.96, flatShading: true }),
    [],
  );
  useDisposeOnUnmount(rockGeo, rockMat);

  const bushGeo = useMemo(() => new THREE.DodecahedronGeometry(0.3, 0), []);
  const bushMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.95, flatShading: true }),
    [],
  );
  useDisposeOnUnmount(bushGeo, bushMat);

  const stoneGeo = useMemo(() => new THREE.CylinderGeometry(0.34, 0.38, 0.09, 7), []);
  const stoneMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.95, flatShading: true }),
    [],
  );
  useDisposeOnUnmount(stoneGeo, stoneMat);

  /** Rumpun rumput: bidang tipis berdiri, sangat murah. */
  const grassGeo = useMemo(() => new THREE.ConeGeometry(0.075, 0.26, 4), []);
  const grassMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, flatShading: true }),
    [],
  );
  useDisposeOnUnmount(grassGeo, grassMat);

  return (
    <group>
      {/* ---------- BAYANGAN KONTAK ----------
          Digambar lebih dulu agar objek di atasnya menimpa dengan
          benar. Inilah yang membuat objek terbaca BERDIRI di tanah,
          bukan sekadar menempel. */}
      <ContactShadows placements={trees} spread={1.5} opacity={0.95} />
      <ContactShadows placements={pines} spread={1.25} opacity={0.9} />
      <ContactShadows placements={rocks} spread={0.85} opacity={0.75} />
      <ContactShadows placements={bushes} spread={0.8} opacity={0.7} />

      {/* Pohon berdaun kotak — batang, dedaunan bawah, dedaunan atas */}
      <InstancedGroup
        placements={trees}
        geometry={trunkGeo}
        material={trunkMat}
        offsetY={0.42}
        shadeAmount={0.14}
        baseColor="#4a5f6e"
      />
      <InstancedGroup
        placements={trees}
        geometry={leafLowGeo}
        material={leafLowMat}
        offsetY={1.05}
        shadeAmount={0.18}
        baseColor={WORLD.grass}
      />
      <InstancedGroup
        placements={trees}
        geometry={leafTopGeo}
        material={leafTopMat}
        offsetY={1.52}
        shadeAmount={0.18}
        baseColor={WORLD.grassLight}
      />

      {/* Pohon cemara — variasi siluet supaya hutan tidak monoton */}
      <InstancedGroup
        placements={pines}
        geometry={trunkGeo}
        material={trunkMat}
        offsetY={0.34}
        scaleY={0.8}
        shadeAmount={0.14}
        baseColor="#4a5f6e"
      />
      <InstancedGroup
        placements={pines}
        geometry={pineGeo}
        material={pineMat}
        offsetY={1.2}
        shadeAmount={0.2}
        baseColor={WORLD.grassDark}
      />

      <InstancedGroup
        placements={rocks}
        geometry={rockGeo}
        material={rockMat}
        offsetY={0.16}
        shadeAmount={0.2}
        baseColor={WORLD.rock}
      />
      <InstancedGroup
        placements={bushes}
        geometry={bushGeo}
        material={bushMat}
        offsetY={0.2}
        shadeAmount={0.22}
        baseColor={WORLD.grass}
      />

      {/* Rumpun rumput — memecah keseragaman bidang tanah */}
      <InstancedGroup
        placements={grassTufts}
        geometry={grassGeo}
        material={grassMat}
        offsetY={0.12}
        castShadow={false}
        shadeAmount={0.26}
        baseColor={WORLD.grassLight}
      />

      {/* Batu pijakan: tidak melempar bayangan karena menempel tanah */}
      <InstancedGroup
        placements={pathStones}
        geometry={stoneGeo}
        material={stoneMat}
        offsetY={0.045}
        castShadow={false}
        shadeAmount={0.12}
        baseColor={WORLD.rockLight}
      />

      <BrandMonument />
      <Lake />
      <DistantMountains />
    </group>
  );
}
