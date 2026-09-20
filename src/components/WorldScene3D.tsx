import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { canRenderWebGL } from './CanvasBoundary';
import { Line, OrbitControls, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { routeConnections, type World } from '../data/worlds';
import BriMascot from './BriMascot';
import { Birds, IslandAura, ProceduralClouds, SelectionGlow, WorldSkyRays } from './worldFx';
import CinematicRig, { ThreePointLights } from '../render/CinematicRig';
import Postfx from '../render/Postfx';
import Ocean3D from './world3d/Ocean3D';
import Island3D from './world3d/Island3D';
import { getQuality, scaleCount } from '../render/quality';

/**
 * WorldScene3D.tsx — Peta dunia Brightoria versi sinematik (Patch 38).
 *
 * ====================================================================
 * FILE INI MENGGANTIKAN WorldScene.tsx, BUKAN MENIMPANYA
 * ====================================================================
 * WorldScene.tsx lama SENGAJA dibiarkan utuh di repo sebagai jaring
 * pengaman. Peralihan dilakukan dengan mengganti SATU baris impor di
 * App.tsx (lihat docs/PATCH-38-APPLY.md). Kalau ada masalah di
 * perangkat tertentu, kembalikan satu baris itu dan peta lama hidup
 * lagi persis seperti sebelumnya.
 *
 * KONTRAK PROPS SAMA PERSIS dengan WorldScene lama:
 *   { worlds, selected, onSelect }
 * sehingga App.tsx tidak perlu diubah selain baris impor.
 *
 * ====================================================================
 * YANG BARU DIBANDING PATCH 37
 * ====================================================================
 *   1. Pulau punya alas batu 3D sungguhan (Island3D.tsx).
 *   2. Laut memakai gelombang GPU + fresnel (Ocean3D.tsx).
 *   3. Tone mapping ACES + rig cahaya tiga titik + bayangan lembut
 *      (CinematicRig.tsx).
 *   4. Bloom selektif ambang tinggi + vignette (Postfx.tsx).
 *   5. Kamera sinematik: fly-in pembuka, lalu fokus lembut ke pulau
 *      yang dipilih (CameraDirector di bawah).
 *   6. Kualitas otomatis menyesuaikan perangkat (quality.ts).
 *
 * ====================================================================
 * KEBIJAKAN WAJIB YANG DIPERTAHANKAN (AGENTS.md)
 * ====================================================================
 *   - Peta TETAP 3D interaktif: drag memutar, scroll/pinch zoom.
 *   - Formasi cincin posisi dunia dari worlds.ts TIDAK disentuh.
 *   - Fallback 2D jika WebGL gagal tetap ada (error boundary).
 *   - TIDAK ada <Environment> drei, TIDAK ada aset CDN eksternal.
 *   - Tidak ada dependency baru.
 * ====================================================================
 */

function useResponsiveViewport() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= 700,
  );
  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth <= 700);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return isMobile;
}

/**
 * CameraDirector — koreografi kamera.
 *
 * Dua perilaku:
 *   a) FLY-IN PEMBUKA (1,6 detik): kamera meluncur dari atas-jauh ke
 *      posisi kerja. Memberi kesan "dunia ini luas" sebelum anak mulai
 *      berinteraksi — teknik pembuka standar di game.
 *   b) FOKUS LEMBUT: saat pulau dipilih, TARGET orbit bergeser pelan
 *      ke arah pulau itu (bukan kamera yang meloncat), sehingga
 *      kontrol pemain tidak pernah direbut.
 */
function CameraDirector({
  isMobile,
  focus,
  controlsRef,
}: {
  isMobile: boolean;
  focus: [number, number, number];
  controlsRef: React.RefObject<{ target: THREE.Vector3; update: () => void } | null>;
}) {
  const camera = useThree((state) => state.camera);
  const quality = getQuality();
  const startRef = useRef<number | null>(null);
  const desired = useMemo(() => new THREE.Vector3(), []);
  const targetGoal = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    const persp = camera as THREE.PerspectiveCamera;
    persp.fov = isMobile ? 56 : 46;
    persp.near = 0.1;
    persp.far = 120;
    persp.updateProjectionMatrix();
    startRef.current = null;
  }, [isMobile, camera]);

  useFrame((state, delta) => {
    try {
      const home = isMobile ? new THREE.Vector3(0, 1.4, 7.4) : new THREE.Vector3(0, 1.8, 9);

      if (startRef.current === null) {
        startRef.current = state.clock.elapsedTime;
        if (quality.motion) camera.position.set(0.6, 7.5, 15.5);
        else camera.position.copy(home);
      }

      const elapsed = state.clock.elapsedTime - startRef.current;
      if (quality.motion && elapsed < 1.6) {
        const p = Math.min(1, elapsed / 1.6);
        const eased = 1 - Math.pow(1 - p, 4);
        desired.copy(camera.position).lerpVectors(camera.position, home, eased * 0.16);
        camera.position.lerp(home, eased * 0.12);
        camera.lookAt(0, 0, 0);
      }

      const controls = controlsRef.current;
      if (controls && quality.motion) {
        // Target orbit digeser sedikit ke pulau terpilih — cukup untuk
        // "mengarahkan perhatian" tanpa mengambil alih kendali.
        targetGoal.set(focus[0] * 0.3, focus[1] * 0.25, focus[2] * 0.3);
        controls.target.lerp(targetGoal, Math.min(1, delta * 1.8));
        controls.update();
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[Brightoria] CameraDirector error (diredam):', err);
    }
  });

  return null;
}

function SkyDome() {
  const geometry = useMemo(() => {
    const geo = new THREE.SphereGeometry(40, 48, 48);
    const pos = geo.attributes.position;
    const colors: number[] = [];
    const top = new THREE.Color('#5b7fc4');
    const mid = new THREE.Color('#f0b8d9');
    const horizon = new THREE.Color('#ffd9a0');
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const t = THREE.MathUtils.clamp((y + 40) / 80, 0, 1);
      const c =
        t > 0.55
          ? mid.clone().lerp(top, (t - 0.55) / 0.45)
          : horizon.clone().lerp(mid, t / 0.55);
      colors.push(c.r, c.g, c.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    return geo;
  }, []);

  return (
    <mesh geometry={geometry} renderOrder={-10}>
      <meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} depthWrite={false} />
    </mesh>
  );
}

function GroundRings() {
  const radii = [1.9, 3.3, 4.7];
  return (
    <>
      {radii.map((r, i) => {
        const points: [number, number, number][] = [];
        for (let a = 0; a <= 64; a++) {
          const t = (a / 64) * Math.PI * 2;
          points.push([Math.cos(t) * r, -2.9, Math.sin(t) * r]);
        }
        return (
          <Line
            key={i}
            points={points}
            color="#ffffff"
            transparent
            opacity={0.16}
            lineWidth={1}
            fog={false}
          />
        );
      })}
    </>
  );
}

function RouteNode({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.scale.setScalar(1 + Math.sin(t * 2.4 + position[0]) * 0.16);
  });
  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.07, 12, 12]} />
      <meshStandardMaterial color="#ffb703" emissive="#ffb703" emissiveIntensity={1.8} />
    </mesh>
  );
}

function Routes({ worlds }: { worlds: World[] }) {
  return (
    <>
      {routeConnections.map(([a, b], i) => {
        const wa = worlds[a];
        const wb = worlds[b];
        if (!wa || !wb) return null;
        const mid: [number, number, number] = [
          (wa.position[0] + wb.position[0]) / 2,
          (wa.position[1] + wb.position[1]) / 2,
          (wa.position[2] + wb.position[2]) / 2,
        ];
        return (
          <group key={i}>
            <Line
              points={[wa.position, wb.position]}
              color="#ffb703"
              dashed
              dashSize={0.16}
              gapSize={0.11}
              transparent
              opacity={0.55}
              lineWidth={2}
              fog={false}
            />
            <RouteNode position={mid} />
          </group>
        );
      })}
    </>
  );
}

function Scene({
  worlds,
  selected,
  onSelect,
  isMobile,
}: {
  worlds: World[];
  selected: World;
  onSelect: (w: World) => void;
  isMobile: boolean;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [reactTrigger, setReactTrigger] = useState(0);
  const prevSelected = useRef(selected.id);
  const controlsRef = useRef<{ target: THREE.Vector3; update: () => void } | null>(null);
  const quality = getQuality();

  if (prevSelected.current !== selected.id) {
    prevSelected.current = selected.id;
    setReactTrigger((n) => n + 1);
  }

  return (
    <>
      <CinematicRig exposure={1.08} />
      <CameraDirector isMobile={isMobile} focus={selected.position} controlsRef={controlsRef} />
      <fog attach="fog" args={['#f3d9e8', 14, 30]} />
      <ThreePointLights intensity={1} shadowRadius={9} />
      <SkyDome />
      <WorldSkyRays />
      <Birds />

      <Suspense fallback={null}>
        <Ocean3D radius={6.4} level={-3} />
        <GroundRings />
        <ProceduralClouds />
        <Routes worlds={worlds} />

        {worlds.map((w, i) => (
          <group key={w.id}>
            <group position={w.position}>
              <IslandAura
                color={w.color}
                active={w.id === selected.id}
                hovered={w.id === hovered}
                mastery={w.mastery}
              />
            </group>
            <Island3D
              world={w}
              index={i}
              active={w.id === selected.id}
              hovered={w.id === hovered}
              onSelect={onSelect}
              onHover={setHovered}
            />
          </group>
        ))}

        <SelectionGlow position={selected.position} color={selected.accent} />
        <BriMascot targetPosition={selected.position} reactTrigger={reactTrigger} />
      </Suspense>

      <Sparkles
        count={Math.max(4, scaleCount(14))}
        scale={[9, 4, 9]}
        size={1.6}
        speed={0.25}
        opacity={0.45}
        color="#fff3c4"
        position={[0, 0.6, 0]}
      />

      <OrbitControls
        ref={controlsRef as never}
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.07}
        rotateSpeed={0.55}
        zoomSpeed={0.7}
        minDistance={isMobile ? 5.2 : 6.4}
        maxDistance={isMobile ? 9.5 : 12}
        minPolarAngle={Math.PI * 0.22}
        maxPolarAngle={Math.PI * 0.72}
      />

      {quality.postfx && <Postfx intensity={0.34} threshold={0.85} vignette={0.32} />}
    </>
  );
}

function FallbackGrid({
  worlds,
  selected,
  onSelect,
}: {
  worlds: World[];
  selected: World;
  onSelect: (w: World) => void;
}) {
  return (
    <div className="world-fallback">
      <p className="world-fallback-note">
        Tampilan 3D tidak dapat dimuat di perangkat ini. Pilih dunia dari daftar di bawah.
      </p>
      <div className="world-fallback-grid">
        {worlds.map((w) => (
          <button
            key={w.id}
            className={'world-fallback-card' + (w.id === selected.id ? ' active' : '')}
            onClick={() => onSelect(w)}
          >
            <img src={w.image} alt={w.name} />
            <b>{w.name}</b>
            <span>{w.mastery}% mastery</span>
          </button>
        ))}
      </div>
    </div>
  );
}

class WorldSceneErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: unknown) {
    // eslint-disable-next-line no-console
    console.error('WorldScene3D gagal render, jatuh ke grid 2D:', error);
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

export default function WorldScene3D({
  worlds,
  selected,
  onSelect,
}: {
  worlds: World[];
  selected: World;
  onSelect: (w: World) => void;
}) {
  const isMobile = useResponsiveViewport();
  const quality = getQuality();

  const fallback = useMemo(
    () => <FallbackGrid worlds={worlds} selected={selected} onSelect={onSelect} />,
    [worlds, selected, onSelect],
  );

  return (
    <WorldSceneErrorBoundary fallback={fallback}>
      {!canRenderWebGL() ? fallback :
      <Canvas
        shadows={quality.shadows}
        dpr={quality.dpr}
        camera={{ position: [0, 1.8, 9], fov: 46 }}
        gl={{
          antialias: quality.antialias,
          powerPreference: 'high-performance',
          alpha: false,
          stencil: false,
        }}
      >
        <Scene worlds={worlds} selected={selected} onSelect={onSelect} isMobile={isMobile} />
      </Canvas>}
    </WorldSceneErrorBoundary>
  );
}
