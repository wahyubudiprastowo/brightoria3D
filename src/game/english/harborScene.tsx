import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard } from '@react-three/drei';
import * as THREE from 'three';

/**
 * harborScene.tsx — Elemen atmosfer 3D untuk English Harbor (Patch 32).
 *
 * ====================================================================
 * SUMBER INSPIRASI & KEJUJURAN SOAL PENERAPANNYA:
 * ====================================================================
 * User merujuk repo "Skills" milik Meng To (github.com/MengTo/Skills) —
 * koleksi playbook agent yang antara lain memuat skill Three.js:
 * `threejs-landscape`, `threejs-weather`, `threejs-towers`, plus skill
 * rendering untuk sky rays, sky backgrounds, falling leaves, dan Retina
 * rendering 200%.
 *
 * CATATAN JUJUR: isi detail tiap SKILL.md di repo tersebut TIDAK bisa
 * saya unduh/baca dari lingkungan kerja ini — yang bisa saya akses hanya
 * README/daftar skill-nya. Jadi file ini BUKAN salinan kode dari repo
 * itu, melainkan implementasi mandiri dari PRINSIP yang tersirat dari
 * nama-nama skill tersebut:
 *   1. SKY RAYS       -> berkas cahaya matahari miring (god rays) yang
 *                        bergerak perlahan di latar
 *   2. SKY BACKGROUND -> kubah langit gradien berlapis (bukan warna rata)
 *   3. FALLING LEAVES -> partikel ambience yang melayang turun perlahan
 *                        (di sini diadaptasi jadi "gelembung laut" naik,
 *                        karena tema English Harbor adalah pelabuhan/laut)
 *   4. RETINA 200%    -> `dpr` dinaikkan agar render tajam di layar HiDPI
 *                        (diterapkan di EnglishGame.tsx pada <Canvas>)
 *
 * SEMUA elemen di file ini PROSEDURAL (dihitung dari kode + CanvasTexture
 * lokal) — TIDAK memuat file gambar/HDR eksternal apa pun. Ini mengikuti
 * pelajaran keras dari insiden Patch 03 (<Environment> drei yang mengunduh
 * HDR dari CDN pernah membuat seluruh scene macet blank) dan Patch 15
 * (background berbasis file berulang kali gagal tampil).
 * ====================================================================
 */

/** Tekstur radial lembut, dipakai untuk gelembung & kilau — dibuat sekali
 *  di level modul supaya tidak dibuat ulang tiap render. */
let sharedSoftDot: THREE.CanvasTexture | null = null;
function getSoftDotTexture(): THREE.CanvasTexture {
  if (sharedSoftDot) return sharedSoftDot;
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,0.95)');
  g.addColorStop(0.45, 'rgba(255,255,255,0.35)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  sharedSoftDot = new THREE.CanvasTexture(canvas);
  sharedSoftDot.needsUpdate = true;
  return sharedSoftDot;
}

/**
 * HarborSky — kubah langit gradien 3 warna (biru laut dalam di atas,
 * biru langit di tengah, keemasan hangat di cakrawala). Vertex color,
 * 100% prosedural, tidak butuh file gambar.
 */
export function HarborSky() {
  const geometry = useMemo(() => {
    const geo = new THREE.SphereGeometry(28, 40, 40);
    const pos = geo.attributes.position;
    const colors: number[] = [];
    const top = new THREE.Color('#2f6fa8');
    const mid = new THREE.Color('#8fd0ef');
    const horizon = new THREE.Color('#ffe3b0');
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const t = THREE.MathUtils.clamp((y + 28) / 56, 0, 1);
      const c = t > 0.55 ? mid.clone().lerp(top, (t - 0.55) / 0.45) : horizon.clone().lerp(mid, t / 0.55);
      colors.push(c.r, c.g, c.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    return geo;
  }, []);

  return (
    <mesh geometry={geometry} renderOrder={-20}>
      <meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} depthWrite={false} />
    </mesh>
  );
}

/**
 * SkyRays — berkas cahaya matahari miring (god rays). Dibuat dari
 * beberapa plane tipis memanjang dengan additive blending, diputar
 * perlahan sehingga terasa "hidup" tanpa membebani performa.
 */
export function SkyRays({ count = 5 }: { count?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const texture = useMemo(() => {
    const w = 8;
    const h = 256;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(255,240,190,0.55)');
    g.addColorStop(0.5, 'rgba(255,235,170,0.22)');
    g.addColorStop(1, 'rgba(255,235,170,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, []);

  const rays = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        offsetX: -3.2 + i * 1.5,
        width: 0.7 + Math.random() * 0.8,
        tilt: 0.28 + Math.random() * 0.12,
        speed: 0.05 + Math.random() * 0.05,
        phase: Math.random() * Math.PI * 2,
      })),
    [count],
  );

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.children.forEach((child, i) => {
      const r = rays[i];
      if (!r) return;
      child.position.x = r.offsetX + Math.sin(t * r.speed + r.phase) * 0.35;
      const mat = ((child as THREE.Mesh).material as THREE.MeshBasicMaterial) ?? null;
      if (mat) mat.opacity = 0.35 + Math.sin(t * 0.5 + r.phase) * 0.15;
    });
  });

  return (
    <group ref={groupRef} position={[0, 2.5, -6]}>
      {rays.map((r, i) => (
        <mesh key={i} position={[r.offsetX, 0, 0]} rotation={[0, 0, r.tilt]}>
          <planeGeometry args={[r.width, 11]} />
          <meshBasicMaterial
            map={texture}
            transparent
            opacity={0.4}
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

/**
 * SeaBubbles — partikel ambience bertema laut (adaptasi dari konsep
 * "falling leaves", dibalik jadi gelembung naik karena tema pelabuhan).
 * Tiap gelembung punya ref sendiri (pelajaran dari bug Patch 15 di mana
 * menebak struktur `children` dari <Billboard> menyebabkan seluruh render
 * loop berhenti).
 */
function Bubble({
  x,
  z,
  size,
  speed,
  phase,
  texture,
}: {
  x: number;
  z: number;
  size: number;
  speed: number;
  phase: number;
  texture: THREE.Texture;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    const cycle = 9;
    const local = ((t * speed + phase) % cycle) / cycle;
    groupRef.current.position.y = -3 + local * 7;
    groupRef.current.position.x = x + Math.sin(t * 0.6 + phase) * 0.45;
    const scale = size * (0.55 + Math.sin(local * Math.PI) * 0.65);
    groupRef.current.scale.setScalar(Math.max(0.01, scale));
  });

  return (
    <group ref={groupRef} position={[x, -3, z]}>
      <Billboard>
        <mesh>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial map={texture} transparent opacity={0.5} depthWrite={false} fog={false} />
        </mesh>
      </Billboard>
    </group>
  );
}

export function SeaBubbles({ count = 16 }: { count?: number }) {
  const texture = getSoftDotTexture();
  const seeds = useMemo(
    () =>
      Array.from({ length: count }).map(() => ({
        x: (Math.random() - 0.5) * 8,
        z: -1 - Math.random() * 4,
        size: 0.14 + Math.random() * 0.22,
        speed: 0.28 + Math.random() * 0.3,
        phase: Math.random() * Math.PI * 2,
      })),
    [count],
  );

  return (
    <>
      {seeds.map((s, i) => (
        <Bubble key={i} x={s.x} z={s.z} size={s.size} speed={s.speed} phase={s.phase} texture={texture} />
      ))}
    </>
  );
}

/**
 * WaterPlane — bidang air di bawah kubus huruf, memberi kesan "mengambang
 * di atas laut". Gradien vertex-color biru, dengan riak halus lewat
 * animasi posisi Y (bukan shader kustom, supaya tetap ringan & aman).
 */
export function WaterPlane() {
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.CircleGeometry(9, 48);
    const pos = geo.attributes.position;
    const colors: number[] = [];
    const inner = new THREE.Color('#7fc6e8');
    const outer = new THREE.Color('#cfe8f7');
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const d = Math.min(1, Math.sqrt(x * x + y * y) / 9);
      const c = inner.clone().lerp(outer, d);
      colors.push(c.r, c.g, c.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    return geo;
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    meshRef.current.position.y = -2.6 + Math.sin(t * 0.7) * 0.06;
  });

  return (
    <mesh ref={meshRef} geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.6, 0]}>
      <meshBasicMaterial vertexColors transparent opacity={0.55} depthWrite={false} fog={false} />
    </mesh>
  );
}
