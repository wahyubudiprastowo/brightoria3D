import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, type RootState } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

/**
 * BriMascot — Patch 17 (fix: glow terlalu besar, terlihat seperti
 * "matahari raksasa").
 *
 * SATU-SATUNYA PERUBAHAN dari Patch 16: skala plane glow di belakang
 * badan Bri diperkecil dari 3.2 menjadi 1.35, dan intensitas gradient
 * teksturnya sedikit dikurangi. Di Patch 15/16, glow berdiameter ~1.9
 * unit (skala 3.2 x plane 0.6) — hampir menyamai ukuran pulau (2.05-2.3
 * unit), sehingga dari kejauhan terlihat seperti bola cahaya besar
 * mengambang sendiri (disalahartikan sebagai "matahari"), bukan aksen
 * cahaya kecil di sekitar karakter lentera.
 *
 * Ukuran mesh badan Bri sendiri (targetSize 0.85) TIDAK diubah — laporan
 * pengguna soal "matahari" merujuk pada glow-nya, bukan bentuk mesh-nya.
 * Gradient warna maroon/emas bertingkat dari Patch 15 juga TIDAK diubah.
 */

function useSafeFrame(callback: (state: RootState, delta: number) => void) {
  useFrame((state, delta) => {
    try {
      callback(state, delta);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[Brightoria] useFrame error diredam (BriMascot):', err);
    }
  });
}



const COLOR_TOP = new THREE.Color('#ffd35c');
const COLOR_BOTTOM = new THREE.Color('#7a0f30');

function useBriGeometry() {
  const { scene } = useGLTF('/assets/models/bri.glb', false, true);

  return useMemo(() => {
    let found: THREE.BufferGeometry | null = null;
    scene.traverse((child) => {
      if (!found && (child as THREE.Mesh).isMesh) {
        found = (child as THREE.Mesh).geometry;
      }
    });
    if (!found) return null;

    const geometry = (found as THREE.BufferGeometry).clone();
    geometry.computeVertexNormals();

    geometry.computeBoundingBox();
    const box = geometry.boundingBox!;
    const center = new THREE.Vector3();
    box.getCenter(center);
    geometry.translate(-center.x, -center.y, -center.z);

    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const targetSize = 0.85;
    const scaleFactor = targetSize / maxDim;
    geometry.scale(scaleFactor, scaleFactor, scaleFactor);

    geometry.computeBoundingBox();
    const box2 = geometry.boundingBox!;
    const minY = box2.min.y;
    const maxY = box2.max.y;
    const rangeY = maxY - minY || 1;

    const posAttr = geometry.getAttribute('position');
    const colors = new Float32Array(posAttr.count * 3);
    const tmpColor = new THREE.Color();
    for (let i = 0; i < posAttr.count; i++) {
      const y = posAttr.getY(i);
      const t = THREE.MathUtils.clamp((y - minY) / rangeY, 0, 1);

      let localT: number;
      if (t < 0.55) {
        localT = 0;
      } else if (t > 0.75) {
        localT = 1;
      } else {
        localT = (t - 0.55) / 0.2;
      }

      tmpColor.copy(COLOR_BOTTOM).lerp(COLOR_TOP, localT);
      colors[i * 3] = tmpColor.r;
      colors[i * 3 + 1] = tmpColor.g;
      colors[i * 3 + 2] = tmpColor.b;
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    return geometry;
  }, [scene]);
}

function useRadialGlowTexture() {
  const ref = useRef<THREE.CanvasTexture | null>(null);
  if (!ref.current) {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    // Patch 17: intensitas sedikit dikurangi supaya lebih terasa "aksen
    // cahaya", bukan sumber terang dominan.
    gradient.addColorStop(0, 'rgba(255,233,168,0.8)');
    gradient.addColorStop(0.5, 'rgba(255,183,3,0.3)');
    gradient.addColorStop(1, 'rgba(255,183,3,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    ref.current = tex;
  }
  return ref.current;
}

export default function BriMascot({
  targetPosition,
  reactTrigger,
}: {
  targetPosition: [number, number, number];
  reactTrigger: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const [reactUntil, setReactUntil] = useState(0);
  const lastTrigger = useRef(reactTrigger);
  const smoothPos = useRef(new THREE.Vector3(...targetPosition));
  const glowTexture = useRadialGlowTexture();
  const geometry = useBriGeometry();
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (!geometry) setLoadFailed(true);
  }, [geometry]);

  if (lastTrigger.current !== reactTrigger) {
    lastTrigger.current = reactTrigger;
    setReactUntil(performance.now() + 650);
  }

  useSafeFrame((state) => {
    if (!groupRef.current || !bodyRef.current) return;
    const t = state.clock.elapsedTime;
    const now = performance.now();
    const reacting = now < reactUntil;

    const desired = new THREE.Vector3(
      targetPosition[0] + 0.95,
      targetPosition[1] + 1.35,
      targetPosition[2] + 0.6,
    );
    smoothPos.current.lerp(desired, reacting ? 0.2 : 0.05);
    groupRef.current.position.copy(smoothPos.current);
    groupRef.current.position.y += Math.sin(t * 1.6) * 0.08;

    bodyRef.current.rotation.y += reacting ? 0.09 : 0.012;

    if (reacting) {
      const pulse = 1 + Math.sin(t * 16) * 0.09;
      bodyRef.current.scale.set(pulse, 1 / pulse, pulse);
    } else {
      bodyRef.current.scale.setScalar(1 + Math.sin(t * 2.2) * 0.03);
    }
  });

  if (loadFailed || !geometry) {
    return (
      <group ref={groupRef}>
        <mesh ref={bodyRef as unknown as React.RefObject<THREE.Mesh>}>
          <sphereGeometry args={[0.4, 16, 16]} />
          <meshStandardMaterial color="#7a0f30" emissive="#ffb703" emissiveIntensity={0.15} />
        </mesh>
      </group>
    );
  }

  return (
    <group ref={groupRef}>
      {/* Patch 17: glow diperkecil signifikan (3.2 -> 1.35) supaya tidak
          lagi terlihat seperti "matahari raksasa" mengambang sendiri. */}
      <mesh position={[0, 0, -0.05]} scale={1.35}>
        <planeGeometry args={[0.6, 0.6]} />
        <meshBasicMaterial
          map={glowTexture}
          transparent
          opacity={0.8}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          fog={false}
        />
      </mesh>

      <group ref={bodyRef}>
        <mesh geometry={geometry} castShadow>
          <meshStandardMaterial
            vertexColors
            roughness={0.4}
            metalness={0.2}
            emissive="#ffb703"
            emissiveIntensity={0.22}
          />
        </mesh>
      </group>
    </group>
  );
}
