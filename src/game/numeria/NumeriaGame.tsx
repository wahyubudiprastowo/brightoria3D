import CanvasBoundary from '../../components/CanvasBoundary';
import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import CinematicRig, { ThreePointLights } from '../../render/CinematicRig';
import Postfx from '../../render/Postfx';
import ProceduralEnv from '../../render/ProceduralEnv';
import { getQuality, scaleCount } from '../../render/quality';
import { NAVY, SKY, WORLD } from '../../theme/brightBrand';
import { sfx } from '../sound';
import { numeriaLevels } from './levels';
import { computeMastery, loadEvidence, saveEvidence, type NumeriaEvidence } from './evidence';
import {
  BRIDGE_LEVEL_LABEL,
  adjustLevel,
  generateBridge,
  initialBridgeLevel,
  type BridgeChallenge,
  type MathLevel,
} from './bridgeLevels';

/**
 * NumeriaGame.tsx — "Jembatan Pecahan" (Patch 54).
 *
 * ====================================================================
 * KENAPA VERSI LAMA TERASA MEMBOSANKAN
 * ====================================================================
 * Umpan balik pengguna: "tidak menarik, menantang, dan membosankan,
 * tidak ada sound effect."
 *
 * Setelah ditelusuri, Numeria sebenarnya SUDAH 3D — tapi 3D dari era
 * Patch 11, tertinggal empat generasi pipeline render:
 *
 *   |               | Numeria lama          | SkyRun / Froggy        |
 *   | Pencahayaan   | ambient + directional | CinematicRig (ACES)    |
 *   | Pantulan      | TIDAK ADA             | ProceduralEnv (IBL)    |
 *   | Bloom/vignette| tidak ada             | Postfx                 |
 *   | Tier perangkat| tidak                 | getQuality()           |
 *   | Warna         | ditulis tetap         | brightBrand            |
 *   | Isi materi    | 5 level TETAP         | prosedural, tak habis  |
 *   | Suara         | TIDAK ADA             | ada                    |
 *
 * Baris "Pantulan" itu yang paling menentukan secara visual.
 * MeshStandardMaterial adalah material berbasis fisika: `metalness` dan
 * `roughness` praktis TIDAK BERFUNGSI tanpa environment map. Itulah
 * sebabnya papan jembatan lama terlihat seperti plastik datar, bukan
 * objek bervolume.
 *
 * ====================================================================
 * MEKANIK JEMBATAN SENGAJA DIPERTAHANKAN
 * ====================================================================
 * Menyeret papan adalah pedagogi yang LEBIH KAYA daripada pilihan
 * ganda: anak MEMBANGUN pecahan sebagai besaran nyata, bukan memilih
 * simbol. Yang membosankan bukan mekaniknya, melainkan hanya ada lima
 * soal yang selalu sama.
 *
 * Jadi yang diperbaiki adalah KEDALAMAN dan RASA, bukan cara bermain:
 *
 *   1. Dua mode — Misi (5 level mastery) & Tanpa Ujung (prosedural)
 *   2. EMPAT jenis tantangan, bukan satu (lihat bridgeLevels.ts)
 *   3. Tingkat kesulitan menyesuaikan diri, dibagi dengan mode arkade
 *   4. Karakter menyeberangi jembatan saat berhasil — bukti visual
 *   5. Efek suara di tiap interaksi (BUKAN musik latar)
 *
 * ====================================================================
 * SOAL SUARA: EFEK, BUKAN MUSIK
 * ====================================================================
 * Proyek ini melarang musik latar secara mutlak. Yang dipakai di sini
 * adalah `sfx` dari src/game/sound.ts — bunyi pendek hasil sintesis
 * Web Audio API, tanpa satu pun berkas audio. Tidak ada loop, tidak ada
 * lagu. Murni umpan balik interaksi.
 *
 * ====================================================================
 * KONTRAK YANG TIDAK BOLEH BERUBAH
 * ====================================================================
 * `evidence.ts` dan `levels.ts` DIBIARKAN UTUH. App.tsx memanggil
 * `numeriaLevels.length` di tiga tempat untuk menghitung mastery.
 *
 * Mode Tanpa Ujung SENGAJA tidak menambah apa pun ke `completed`,
 * supaya mastery tidak pernah bisa melampaui 100% — persis jenis bug
 * yang baru saja diperbaiki pada Kampung Adab.
 * ====================================================================
 */

const STYLE_ID = 'brightoria-numeria-styles-v2';

/** Jarak antar papan di sumbu X. */
const PLANK_GAP = 0.66;
const NUMERIA_BACKPACKER_URL = '/assets/models/numeria-boxhead-backpacker.glb';
const NUMERIA_OUTPOST_LEFT_URL = '/assets/models/numeria-blue-banner-outpost.glb';
const NUMERIA_OUTPOST_RIGHT_URL = '/assets/models/numeria-mooncrest-outpost.glb';
const NUMERIA_WOOD_PLANK_URL = '/assets/numeria/wood-plank.png';
const NUMERIA_BLUE_PLANK_URL = '/assets/numeria/blue-plank.png';

const NUMERIA_CSS = `
.nmr-overlay {
  position: fixed; inset: 0; z-index: 92; display: flex; flex-direction: column;
  background:
    linear-gradient(180deg, rgba(255,255,255,0.05), rgba(0,54,72,0.22)),
    url('/assets/numeria/bridge-oasis-background.png') center center / cover no-repeat,
    #56b9e9;
}
.nmr-canvas { position: absolute; inset: 0; }
.nmr-canvas canvas { background: transparent !important; }

/* ---------- Panel tantangan ---------- */
.nmr-quest {
  position: absolute; top: 12px; left: 50%; transform: translateX(-50%);
  z-index: 4; width: min(620px, calc(100vw - 28px));
  background: rgba(255,255,255,0.96); border-radius: 19px;
  padding: 12px 18px; text-align: center;
  box-shadow: 0 10px 28px rgba(0,20,69,0.32);
  border-bottom: 4px solid #28a8e0; pointer-events: none;
}
.nmr-quest-text { font-size: 23px; font-weight: 900; color: #002880; line-height: 1.25; }
.nmr-quest-hint { font-size: 11px; color: #5a7691; margin-top: 4px; }
.nmr-quest-kind {
  display: inline-block; margin-top: 6px; font-size: 9.5px; font-weight: 900;
  padding: 3px 10px; border-radius: 999px; background: #d6eefb; color: #1a5578;
  text-transform: uppercase; letter-spacing: 0.07em;
}

/* ---------- Papan skor ---------- */
.nmr-hud { position: absolute; top: 12px; left: 12px; z-index: 5; display: flex; flex-direction: column; gap: 6px; pointer-events: none; }
.nmr-chip {
  display: inline-flex; align-items: center; gap: 5px;
  background: rgba(255,255,255,0.94); border: 2px solid #a8dcf5;
  border-radius: 999px; padding: 5px 12px;
  font-size: 11.5px; font-weight: 900; color: #002880;
  box-shadow: 0 5px 14px rgba(0,20,69,0.26);
}
.nmr-chip.streak { background: linear-gradient(135deg,#fff3d6,#ffe2a3); border-color: #e0a63e; color: #7a5410; }
.nmr-chip.level { background: linear-gradient(135deg,#eaf7ef,#d4efe0); border-color: #3fbf7f; color: #14624f; }

.nmr-close {
  position: absolute; top: 12px; right: 12px; z-index: 5;
  border: 0; background: #ffffff; border-radius: 50%;
  width: 38px; height: 38px; display: grid; place-items: center;
  cursor: pointer; color: #002880; font-size: 18px; font-weight: 900;
  box-shadow: 0 5px 14px rgba(0,20,69,0.26);
}

/* ---------- Penghitung papan ---------- */
.nmr-counter {
  position: absolute; bottom: 104px; left: 50%; transform: translateX(-50%);
  z-index: 5; background: rgba(255,255,255,0.95); border-radius: 16px;
  padding: 9px 20px; text-align: center; pointer-events: none;
  box-shadow: 0 6px 18px rgba(0,20,69,0.3); border: 2px solid #a8dcf5;
}
.nmr-counter b { font-size: 24px; font-weight: 900; color: #002880; }
.nmr-counter span { font-size: 10.5px; color: #5a7691; display: block; margin-top: 1px; }

/* ---------- Tombol aksi ---------- */
.nmr-actions {
  position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%);
  z-index: 6; display: flex; gap: 9px; width: min(460px, calc(100vw - 24px));
}
.nmr-btn {
  border: 0; border-radius: 16px; padding: 13px 16px;
  font-size: 14px; font-weight: 900; cursor: pointer; font-family: inherit;
  min-height: 50px; display: flex; align-items: center; justify-content: center; gap: 7px;
  -webkit-tap-highlight-color: transparent;
}
.nmr-btn.primary { flex: 2; background: linear-gradient(135deg,#28a8e0,#002880); color: #fff; box-shadow: 0 8px 22px rgba(0,40,128,0.34); }
.nmr-btn.ghost { flex: 1; background: rgba(255,255,255,0.94); border: 2px solid #cfe6f5; color: #002880; }
.nmr-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* ---------- Umpan balik ---------- */
.nmr-feedback {
  position: absolute; top: 46%; left: 50%; transform: translate(-50%,-50%);
  z-index: 7; text-align: center; pointer-events: none;
  animation: nmr-pop 0.42s cubic-bezier(0.34,1.56,0.64,1);
  width: min(440px, calc(100vw - 40px));
}
.nmr-fb-badge {
  display: inline-block; padding: 10px 24px; border-radius: 999px;
  font-size: 20px; font-weight: 900; color: #fff;
  box-shadow: 0 10px 28px rgba(0,20,69,0.4);
}
.nmr-fb-badge.good { background: linear-gradient(135deg,#3fbf7f,#17856f); }
.nmr-fb-badge.miss { background: linear-gradient(135deg,#67c4ec,#1c94cc); }
.nmr-fb-note {
  margin-top: 8px; background: rgba(255,255,255,0.96);
  border-radius: 14px; padding: 9px 16px; font-size: 13px;
  font-weight: 800; color: #002880; line-height: 1.5;
  box-shadow: 0 6px 18px rgba(0,20,69,0.26);
}
.nmr-levelup {
  margin-top: 8px; background: linear-gradient(135deg,#3fbf7f,#17856f);
  color: #fff; border-radius: 999px; padding: 7px 17px;
  font-size: 12px; font-weight: 900;
}
@keyframes nmr-pop {
  0% { opacity: 0; transform: translate(-50%,-50%) scale(0.72); }
  100% { opacity: 1; transform: translate(-50%,-50%) scale(1); }
}

.nmr-hint-box {
  position: absolute; bottom: 168px; left: 50%; transform: translateX(-50%);
  z-index: 5; background: #fff6d6; border: 2px solid #e6c877;
  border-radius: 14px; padding: 10px 16px; font-size: 12px; color: #7a5410;
  max-width: min(420px, calc(100vw - 32px)); text-align: center;
  box-shadow: 0 6px 18px rgba(0,20,69,0.24);
}

/* ---------- Layar mulai & hasil ---------- */
.nmr-screen {
  position: absolute; inset: 0; z-index: 9;
  background: linear-gradient(160deg, rgba(4,35,29,0.94), rgba(11,63,143,0.93));
  display: grid; place-items: center; padding: 20px; overflow-y: auto;
}
.nmr-panel {
  background: #ffffff; border-radius: 26px; padding: 24px 22px;
  width: min(440px, 100%); text-align: center;
  box-shadow: 0 20px 56px rgba(0,0,0,0.42); border-top: 6px solid #28a8e0;
}
.nmr-panel-emoji { font-size: 46px; line-height: 1; }
.nmr-panel h2 { margin: 9px 0 5px; font-size: 20px; color: #002880; }
.nmr-panel p { margin: 0 0 15px; font-size: 13px; line-height: 1.6; color: #5a7691; }

.nmr-modes { display: flex; flex-direction: column; gap: 10px; margin-bottom: 15px; }
.nmr-mode {
  display: flex; align-items: center; gap: 12px; text-align: left;
  border: 2.5px solid #cfe6f5; background: #f7fbfe; border-radius: 19px;
  padding: 14px 15px; cursor: pointer; font-family: inherit; width: 100%;
  transition: transform 0.12s ease, border-color 0.15s ease;
}
.nmr-mode:hover:not(:disabled) { transform: translateY(-2px); border-color: #67c4ec; }
.nmr-mode:disabled { opacity: 0.5; cursor: not-allowed; }
.nmr-mode.endless { border-color: #cfe0f5; background: linear-gradient(160deg,#f7faff,#eaf1fc); }
.nmr-mode-icon { font-size: 30px; flex-shrink: 0; }
.nmr-mode-body { flex: 1; min-width: 0; }
.nmr-mode-title { font-size: 14.5px; font-weight: 900; color: #002880; }
.nmr-mode-desc { font-size: 11px; color: #5a7691; line-height: 1.45; margin-top: 2px; }
.nmr-mode-tag {
  display: inline-block; margin-top: 5px; font-size: 9.5px; font-weight: 900;
  padding: 3px 9px; border-radius: 999px; background: #d6eefb; color: #1a5578;
}
.nmr-mode-arrow { font-size: 19px; color: #67c4ec; flex-shrink: 0; }

.nmr-stats { display: flex; gap: 8px; justify-content: center; margin-bottom: 15px; flex-wrap: wrap; }
.nmr-stat {
  background: linear-gradient(160deg,#e9f4fb,#d6eefb); border: 1px solid #a8dcf5;
  border-radius: 15px; padding: 10px 14px; min-width: 84px;
}
.nmr-stat b { display: block; font-size: 22px; color: #002880; line-height: 1.1; }
.nmr-stat span { display: block; font-size: 9.5px; color: #5a7691; margin-top: 2px; }

.nmr-howto { text-align: left; background: #f2f9fd; border-radius: 15px; padding: 12px 14px; margin-bottom: 15px; }
.nmr-howto div { font-size: 11.5px; color: #1a5578; line-height: 1.7; }

@media (max-width: 760px) {
  .nmr-quest { padding: 10px 14px; top: 9px; }
  .nmr-quest-text { font-size: 19px; }
  .nmr-counter { bottom: 96px; padding: 8px 16px; }
  .nmr-counter b { font-size: 21px; }
  .nmr-actions { width: calc(100vw - 20px); bottom: 14px; gap: 7px; }
  .nmr-btn { padding: 12px 12px; font-size: 13px; }
  .nmr-hint-box { bottom: 156px; font-size: 11px; }
}
`;

function useInjectStyles() {
  useEffect(() => {
    document.getElementById('brightoria-numeria-styles-v1')?.remove();
    if (document.getElementById(STYLE_ID)) return;
    const el = document.createElement('style');
    el.id = STYLE_ID;
    el.textContent = NUMERIA_CSS;
    document.head.appendChild(el);
  }, []);
}

function FittedModel({
  url,
  size,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  fallback = null,
  ground = true,
}: {
  url: string;
  size: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  fallback?: React.ReactNode;
  ground?: boolean;
}) {
  const quality = getQuality();
  const { scene } = useGLTF(url, false, true);
  const model = useMemo(() => {
    const clone = scene.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const dimensions = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const wrapper = new THREE.Group();
    clone.position.x -= center.x;
    clone.position.z -= center.z;
    clone.position.y -= ground ? box.min.y : center.y;
    wrapper.add(clone);
    wrapper.scale.setScalar(size / (Math.max(dimensions.x, dimensions.y, dimensions.z) || 1));
    clone.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        node.castShadow = quality.shadows;
        node.receiveShadow = quality.shadows;
      }
    });
    return wrapper;
  }, [ground, quality.shadows, scene, size]);

  return (
    <group position={position} rotation={rotation}>
      <primitive object={model} dispose={null} />
    </group>
  );
}

class ModelBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { failed: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    // eslint-disable-next-line no-console
    console.error('[Brightoria] Numeria model fallback dipakai:', error);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function NumeriaModel(props: Parameters<typeof FittedModel>[0]) {
  return (
    <ModelBoundary fallback={props.fallback ?? null}>
      <Suspense fallback={props.fallback ?? null}>
        <FittedModel {...props} />
      </Suspense>
    </ModelBoundary>
  );
}

// ---------------------------------------------------------------------------
// PAPAN JEMBATAN
// ---------------------------------------------------------------------------

type PlankState = 'empty' | 'placed' | 'correct' | 'wrong' | 'preset';

/**
 * Satu papan jembatan.
 *
 * Papan yang belum dipasang MENGGANTUNG sedikit lebih rendah dan
 * bergoyang pelan — isyarat visual bahwa ia belum menjadi bagian
 * jembatan. Papan yang dipasang naik ke posisinya dengan gerak pegas.
 */
function Plank({
  index,
  total,
  state,
  onToggle,
  interactive,
}: {
  index: number;
  total: number;
  state: PlankState;
  onToggle: () => void;
  interactive: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const quality = getQuality();
  const [hovered, setHovered] = useState(false);
  const woodTexture = useTexture(NUMERIA_WOOD_PLANK_URL);
  const blueTexture = useTexture(NUMERIA_BLUE_PLANK_URL);

  useEffect(() => {
    [woodTexture, blueTexture].forEach((texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 8;
      texture.needsUpdate = true;
    });
  }, [blueTexture, woodTexture]);

  const x = index * PLANK_GAP - ((total - 1) * PLANK_GAP) / 2;
  const isUp = state !== 'empty';

  useFrame((s, delta) => {
    try {
      if (!group.current) return;
      const dt = Math.min(delta, 0.05);
      const t = s.clock.elapsedTime;

      const targetY = isUp ? 0 : -0.46;
      group.current.position.y += (targetY - group.current.position.y) * Math.min(1, dt * 11);

      if (quality.motion) {
        // Papan yang belum terpasang bergoyang; yang sudah terpasang diam.
        const sway = isUp ? 0 : Math.sin(t * 1.6 + index * 0.8) * 0.06;
        group.current.rotation.z += (sway - group.current.rotation.z) * Math.min(1, dt * 6);
      }

      const targetScale = hovered && interactive && !isUp ? 1.09 : 1;
      const cur = group.current.scale.x;
      group.current.scale.setScalar(cur + (targetScale - cur) * Math.min(1, dt * 12));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[Brightoria] Numeria Plank error (diredam):', err);
    }
  });

  const color =
    state === 'correct'
      ? '#3fbf7f'
      : state === 'wrong'
        ? '#e0a63e'
        : state === 'preset'
          ? SKY.deep
          : state === 'placed'
            ? SKY.base
            : hovered && interactive
              ? '#7c97ae'
              : '#5a7691';
  const plankTexture = state === 'preset' || state === 'placed' || state === 'correct' ? woodTexture : blueTexture;

  return (
    <group ref={group} position={[x, isUp ? 0 : -0.46, 0]}>
      {/* Bayangan kontak — membuat papan terbaca melayang di atas jurang */}
      <mesh position={[0, -0.24, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.58, 0.58]} />
        <meshBasicMaterial color="#03201a" transparent opacity={0.28} depthWrite={false} />
      </mesh>

      <mesh
        castShadow={quality.shadows}
        receiveShadow={quality.shadows}
        onClick={(e) => {
          e.stopPropagation();
          if (interactive && state !== 'preset') onToggle();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          if (!interactive || state === 'preset') return;
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
      >
        <boxGeometry args={[0.58, 0.18, 0.72]} />
        {/* metalness & roughness di sini BARU BERFUNGSI karena
            ProceduralEnv memasang environment map — lihat catatan
            di kepala berkas. */}
        <meshStandardMaterial
          color={color}
          map={plankTexture}
          roughness={state === 'empty' ? 0.85 : 0.32}
          metalness={state === 'empty' ? 0.02 : 0.18}
          flatShading
        />
      </mesh>

      {/* Guratan kayu, memecah permukaan agar tidak terbaca balok polos */}
      <mesh position={[0, 0.088, 0]}>
        <boxGeometry args={[0.52, 0.014, 0.08]} />
        <meshStandardMaterial color="#2f5c84" roughness={0.95} transparent opacity={0.24} />
      </mesh>

      <mesh position={[0, 0.096, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.74, 0.58]} />
        <meshBasicMaterial
          map={plankTexture}
          transparent
          opacity={state === 'empty' ? 0.28 : 0.36}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {isUp && (
        <pointLight color={color} intensity={state === 'correct' ? 2.2 : 1.1} distance={2.4} />
      )}
    </group>
  );
}

// ---------------------------------------------------------------------------
// TIANG & LATAR
// ---------------------------------------------------------------------------

function Pillar({ x, side }: { x: number; side: 'left' | 'right' }) {
  const quality = getQuality();
  const fallback = (
    <group position={[x, -0.62, 0]}>
      <mesh castShadow={quality.shadows} receiveShadow={quality.shadows}>
        <boxGeometry args={[0.42, 1.1, 0.82]} />
        <meshStandardMaterial color={NAVY.deep} roughness={0.72} metalness={0.22} flatShading />
      </mesh>
      <mesh position={[0, 0.6, 0]} castShadow={quality.shadows}>
        <boxGeometry args={[0.56, 0.14, 0.94]} />
        <meshStandardMaterial color={NAVY.mid} roughness={0.6} metalness={0.3} flatShading />
      </mesh>
    </group>
  );

  return (
    <NumeriaModel
      url={side === 'left' ? NUMERIA_OUTPOST_LEFT_URL : NUMERIA_OUTPOST_RIGHT_URL}
      size={1.9}
      position={[x, -0.68, 0]}
      rotation={[0, side === 'left' ? Math.PI * 0.5 : -Math.PI * 0.5, 0]}
      fallback={fallback}
    />
  );
}

/**
 * Kabut jurang di bawah jembatan.
 *
 * Fungsinya bukan hiasan: tanpa sesuatu di bawah, papan yang belum
 * terpasang tidak terbaca "menggantung di atas apa-apa". Kabut memberi
 * kedalaman sekaligus taruhan visual.
 */
function Chasm() {
  const ref = useRef<THREE.Points>(null);
  const quality = getQuality();

  const positions = useMemo(() => {
    const n = Math.max(30, scaleCount(110));
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 16;
      arr[i * 3 + 1] = -1.4 - Math.random() * 3.4;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 7;
    }
    return arr;
  }, []);

  useFrame((s) => {
    try {
      if (!ref.current || !quality.motion) return;
      ref.current.rotation.y = s.clock.elapsedTime * 0.035;
      const m = ref.current.material as THREE.PointsMaterial;
      if (m) m.opacity = 0.3 + Math.sin(s.clock.elapsedTime * 0.7) * 0.09;
    } catch {
      /* diamkan */
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.14}
        color={WORLD.dust}
        transparent
        opacity={0.32}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

/** Penjelajah yang menyeberang saat jembatan tersambung benar. */
function Walker({ crossing, span }: { crossing: boolean; span: number }) {
  const group = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const start = useRef<number | null>(null);
  const quality = getQuality();

  useEffect(() => {
    if (crossing) start.current = null;
  }, [crossing]);

  useFrame((s) => {
    try {
      if (!group.current || !body.current) return;
      const t = s.clock.elapsedTime;
      const from = -span / 2 - 0.75;
      const to = span / 2 + 0.75;

      if (crossing) {
        if (start.current === null) start.current = t;
        const p = Math.min(1, (t - start.current) / 1.9);
        group.current.position.x = from + (to - from) * p;
        group.current.position.y = 0.28 + Math.abs(Math.sin(p * Math.PI * 9)) * 0.1;
        if (quality.motion) body.current.rotation.z = Math.sin(p * Math.PI * 9) * 0.1;
      } else {
        group.current.position.x = from;
        group.current.position.y = 0.28 + Math.sin(t * 1.9) * 0.035;
        if (quality.motion) body.current.rotation.z = 0;
      }
    } catch {
      /* diamkan */
    }
  });

  return (
    <group ref={group} position={[-span / 2 - 0.75, 0.28, 0]}>
      <group ref={body}>
        <NumeriaModel
          url={NUMERIA_BACKPACKER_URL}
          size={0.85}
          position={[0, 0.05, 0]}
          rotation={[0, Math.PI * 0.5, 0]}
          fallback={
            <>
              <mesh castShadow={quality.shadows}>
                <boxGeometry args={[0.24, 0.3, 0.2]} />
                <meshStandardMaterial color={NAVY.deep} roughness={0.6} metalness={0.2} flatShading />
              </mesh>
              <mesh position={[0, 0.26, 0]} castShadow={quality.shadows}>
                <boxGeometry args={[0.26, 0.24, 0.24]} />
                <meshStandardMaterial color="#f2c391" roughness={0.82} flatShading />
              </mesh>
              {[-0.07, 0.07].map((x) => (
                <mesh key={x} position={[x, 0.3, 0.13]}>
                  <boxGeometry args={[0.045, 0.06, 0.02]} />
                  <meshBasicMaterial color="#17110e" />
                </mesh>
              ))}
              {[-1, 1].map((s2) => (
                <mesh key={s2} position={[s2 * 0.16, 0.02, 0]} castShadow={quality.shadows}>
                  <boxGeometry args={[0.07, 0.22, 0.09]} />
                  <meshStandardMaterial color={SKY.base} roughness={0.55} metalness={0.3} flatShading />
                </mesh>
              ))}
            </>
          }
        />
      </group>
      <pointLight color={SKY.base} intensity={1.3} distance={2.4} position={[0, 0.3, 0]} />
    </group>
  );
}

useGLTF.preload(NUMERIA_BACKPACKER_URL);
useGLTF.preload(NUMERIA_OUTPOST_LEFT_URL);
useGLTF.preload(NUMERIA_OUTPOST_RIGHT_URL);
useTexture.preload(NUMERIA_WOOD_PLANK_URL);
useTexture.preload(NUMERIA_BLUE_PLANK_URL);

// ---------------------------------------------------------------------------
// SCENE
// ---------------------------------------------------------------------------

function BridgeScene({
  denominator,
  states,
  onToggle,
  interactive,
  crossing,
}: {
  denominator: number;
  states: PlankState[];
  onToggle: (i: number) => void;
  interactive: boolean;
  crossing: boolean;
}) {
  const quality = getQuality();
  const span = (denominator - 1) * PLANK_GAP;
  const camZ = Math.max(5.4, span * 0.95 + 2.6);

  return (
    <>
      <CinematicRig exposure={1.05} />
      <ProceduralEnv intensity={0.9} />
      <fog attach="fog" args={['#12806a', 9, 26]} />
      <ThreePointLights intensity={1} shadowRadius={10} />

      <Chasm />

      <Pillar x={-span / 2 - 0.62} side="left" />
      <Pillar x={span / 2 + 0.62} side="right" />

      {Array.from({ length: denominator }).map((_, i) => (
        <Plank
          key={i}
          index={i}
          total={denominator}
          state={states[i]}
          onToggle={() => onToggle(i)}
          interactive={interactive}
        />
      ))}

      <Walker crossing={crossing} span={span} />

      <OrbitControls
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI * 0.3}
        maxPolarAngle={Math.PI * 0.47}
        minAzimuthAngle={-0.42}
        maxAzimuthAngle={0.42}
        enableDamping
        dampingFactor={0.09}
        rotateSpeed={0.42}
      />

      <PerspectiveFit z={camZ} />

      {quality.postfx && <Postfx intensity={0.32} threshold={0.86} vignette={0.32} preserveAlpha />}
    </>
  );
}

/** Menjauhkan kamera bila jembatan panjang, supaya seluruh papan muat. */
function PerspectiveFit({ z }: { z: number }) {
  useFrame((s) => {
    try {
      const cam = s.camera;
      const cur = cam.position.length();
      if (Math.abs(cur - z) > 0.02) {
        cam.position.setLength(cur + (z - cur) * 0.08);
      }
    } catch {
      /* diamkan */
    }
  });
  return null;
}

// ---------------------------------------------------------------------------
// ERROR BOUNDARY
// ---------------------------------------------------------------------------

class SceneBoundary extends React.Component<
  { children: React.ReactNode; onError: () => void },
  { failed: boolean }
> {
  constructor(props: { children: React.ReactNode; onError: () => void }) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(e: unknown) {
    // eslint-disable-next-line no-console
    console.error('[Brightoria] Numeria scene gagal:', e);
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

// ---------------------------------------------------------------------------
// KOMPONEN UTAMA
// ---------------------------------------------------------------------------

type Mode = 'choose' | 'mission' | 'endless';
type Phase = 'choose' | 'playing' | 'result' | 'done';

export default function NumeriaGame({
  onExit,
  onXpEarned,
}: {
  onExit: () => void;
  onXpEarned: (amount: number) => void;
}) {
  useInjectStyles();
  const quality = getQuality();

  const [mode, setMode] = useState<Mode>('choose');
  const [phase, setPhase] = useState<Phase>('choose');
  const [evidence, setEvidence] = useState<NumeriaEvidence>(() => loadEvidence());

  // --- Mode Misi ---
  const [missionIndex, setMissionIndex] = useState(0);

  // --- Mode Tanpa Ujung ---
  const [level, setLevel] = useState<MathLevel>(() => initialBridgeLevel());
  const [recent, setRecent] = useState<boolean[]>([]);
  const [challenge, setChallenge] = useState<BridgeChallenge | null>(null);
  const [solvedCount, setSolvedCount] = useState(0);

  // --- Keadaan papan ---
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [preset, setPreset] = useState<Set<number>>(new Set());
  const [judged, setJudged] = useState(false);
  const [wasRight, setWasRight] = useState(false);
  const [crossing, setCrossing] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [levelUp, setLevelUp] = useState<'up' | 'down' | null>(null);
  const [sceneFailed, setSceneFailed] = useState(false);
  const [attemptedThis, setAttemptedThis] = useState(false);

  const missionLevel = numeriaLevels[missionIndex];

  /** Tantangan aktif, diseragamkan dari dua mode. */
  const active = useMemo(() => {
    if (mode === 'mission' && missionLevel) {
      return {
        id: missionLevel.id,
        denominator: missionLevel.denominator,
        target: missionLevel.target,
        prompt: missionLevel.prompt,
        hint: missionLevel.hint,
        explanation: missionLevel.explanation,
        kindLabel: missionLevel.title,
      };
    }
    if (challenge) {
      const labels: Record<string, string> = {
        build: 'Bangun bilangan',
        equivalent: 'Perkalian lanjut',
        sum: 'Penjumlahan',
        complete: 'Lengkapi',
        counting: 'Membilang',
        multiply: 'Perkalian',
        divide: 'Pembagian',
        percent: 'Hitung cepat',
      };
      return {
        id: challenge.id,
        denominator: challenge.denominator,
        target: challenge.target,
        prompt: challenge.prompt,
        hint: challenge.hint,
        explanation: challenge.explanation,
        kindLabel: labels[challenge.kind] ?? 'Tantangan',
      };
    }
    return null;
  }, [mode, missionLevel, challenge]);

  /** Papan yang sudah terpasang di awal (khusus jenis 'complete'). */
  useEffect(() => {
    if (mode !== 'endless' || !challenge) {
      setPreset(new Set());
      return;
    }
    // Dibaca dari medan eksplisit, bukan dipungut dari teks prompt.
    const s = new Set<number>();
    for (let i = 0; i < challenge.preset; i++) s.add(i);
    setPreset(s);
  }, [mode, challenge]);

  const totalPlaced = picked.size + preset.size;

  const states = useMemo<PlankState[]>(() => {
    if (!active) return [];
    return Array.from({ length: active.denominator }).map((_, i) => {
      if (preset.has(i)) return 'preset';
      if (!picked.has(i)) return 'empty';
      if (!judged) return 'placed';
      return wasRight ? 'correct' : 'wrong';
    });
  }, [active, picked, preset, judged, wasRight]);

  function persist(next: NumeriaEvidence) {
    setEvidence(next);
    saveEvidence(next);
  }

  function toggle(i: number) {
    if (judged || preset.has(i)) return;
    sfx.click();
    setPicked((prev) => {
      const n = new Set(prev);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });
  }

  function nextEndless(lv: MathLevel) {
    setChallenge(generateBridge(lv));
    setPicked(new Set());
    setJudged(false);
    setWasRight(false);
    setCrossing(false);
    setShowHint(false);
    setLevelUp(null);
    setAttemptedThis(false);
  }

  function startMission() {
    sfx.click();
    setMode('mission');
    setMissionIndex(0);
    setPicked(new Set());
    setJudged(false);
    setWasRight(false);
    setCrossing(false);
    setShowHint(false);
    setStreak(0);
    setBestStreak(0);
    setAttemptedThis(false);
    setPhase('playing');
  }

  function startEndless() {
    sfx.click();
    const lv = initialBridgeLevel();
    setMode('endless');
    setLevel(lv);
    setRecent([]);
    setSolvedCount(0);
    setStreak(0);
    setBestStreak(0);
    nextEndless(lv);
    setPhase('playing');
  }

  const confirm = useCallback(() => {
    if (!active || judged) return;

    const right = totalPlaced === active.target;
    setJudged(true);
    setWasRight(right);

    if (right) {
      sfx.correct();
      setCrossing(true);
      const ns = streak + 1;
      setStreak(ns);
      setBestStreak((b) => Math.max(b, ns));
    } else {
      sfx.wrong();
      setStreak(0);
    }

    // --- Catatan progres ---
    if (mode === 'mission') {
      const id = active.id;
      const prevAttempts = evidence.attempts[id] ?? 0;
      const next: NumeriaEvidence = {
        ...evidence,
        attempts: { ...evidence.attempts, [id]: prevAttempts + 1 },
        firstTryCorrect: { ...evidence.firstTryCorrect },
        completed: [...evidence.completed],
        updatedAt: new Date().toISOString(),
      };
      if (next.firstTryCorrect[id] === undefined) {
        next.firstTryCorrect[id] = prevAttempts === 0 && !attemptedThis && right;
      }
      if (right && !evidence.completed.includes(id)) {
        next.completed.push(id);
        onXpEarned(30);
        sfx.star();
      }
      persist(next);
      if (!right) setAttemptedThis(true);
    } else {
      // Mode Tanpa Ujung SENGAJA tidak menyentuh `completed`, supaya
      // mastery tidak pernah bisa melampaui 100%.
      if (right) {
        setSolvedCount((n) => n + 1);
        onXpEarned(12);
      }
      const nextRecent = [...recent, right].slice(-5);
      const adj = adjustLevel(level, nextRecent);
      setRecent(adj.recent);
      if (adj.changed) {
        setLevel(adj.level);
        setLevelUp(adj.changed);
        if (adj.changed === 'up') sfx.star();
      }
    }
  }, [active, judged, totalPlaced, mode, evidence, recent, level, streak, attemptedThis, onXpEarned]);

  function advance() {
    sfx.click();
    if (!wasRight) {
      setJudged(false);
      setCrossing(false);
      setPicked(new Set());
      return;
    }
    if (mode === 'mission') {
      if (missionIndex + 1 < numeriaLevels.length) {
        setMissionIndex(missionIndex + 1);
        setPicked(new Set());
        setJudged(false);
        setCrossing(false);
        setShowHint(false);
        setAttemptedThis(false);
      } else {
        sfx.win();
        setPhase('done');
      }
    } else {
      nextEndless(level);
    }
  }

  function useHint() {
    if (!active) return;
    sfx.click();
    setShowHint(true);
    if (mode === 'mission') {
      const id = active.id;
      persist({
        ...evidence,
        hintsUsed: { ...evidence.hintsUsed, [id]: (evidence.hintsUsed[id] ?? 0) + 1 },
      });
    }
  }

  function backToChoose() {
    sfx.click();
    setMode('choose');
    setPhase('choose');
    setChallenge(null);
    setPicked(new Set());
    setJudged(false);
    setCrossing(false);
  }

  // --- Papan ketik ---
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const k = e.key.toLowerCase();
      if (k === 'escape') {
        onExit();
        return;
      }
      if (phase !== 'playing') return;
      if (k === 'enter' || k === ' ') {
        e.preventDefault();
        if (judged) advance();
        else confirm();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, judged, confirm]);

  const mastery = computeMastery(evidence, numeriaLevels.length);
  const missionDone = evidence.completed.length >= numeriaLevels.length;
  const showScene = phase === 'playing' && active !== null;

  return (
    <div className="nmr-overlay">
      <div className="nmr-canvas">
        {sceneFailed ? (
          <div className="nmr-screen" style={{ zIndex: 1 }}>
            <div className="nmr-panel">
              <div className="nmr-panel-emoji">😕</div>
              <h2>Tampilan 3D tidak bisa dimuat</h2>
              <p>Perangkat ini belum mendukung grafik 3D. Petualangan lain tetap bisa dimainkan.</p>
              <button className="nmr-btn primary" onClick={onExit}>
                Kembali ke peta
              </button>
            </div>
          </div>
        ) : (
          <CanvasBoundary><Canvas
            shadows={quality.shadows}
            dpr={quality.dpr}
            camera={{ position: [0, 2.1, 6.2], fov: 48, near: 0.1, far: 90 }}
            style={{ background: 'transparent' }}
            gl={{ antialias: quality.antialias, alpha: true, powerPreference: 'high-performance', stencil: false }}
            onCreated={({ gl }) => {
              gl.setClearColor(0x000000, 0);
              gl.setClearAlpha(0);
            }}
          >
            <SceneBoundary onError={() => setSceneFailed(true)}>
              {showScene && active && (
                <BridgeScene
                  denominator={active.denominator}
                  states={states}
                  onToggle={toggle}
                  interactive={!judged}
                  crossing={crossing}
                />
              )}
            </SceneBoundary>
          </Canvas></CanvasBoundary>
        )}
      </div>

      {/* ---------------- Papan skor ---------------- */}
      {showScene && active && (
        <>
          <div className="nmr-hud">
            <span className="nmr-chip">
              {mode === 'mission'
                ? `🌉 ${missionIndex + 1}/${numeriaLevels.length}`
                : `🌉 ${solvedCount} tersambung`}
            </span>
            {mode === 'endless' && (
              <span className="nmr-chip level">📊 {BRIDGE_LEVEL_LABEL[level]}</span>
            )}
            {streak >= 2 && <span className="nmr-chip streak">🔥 {streak} beruntun</span>}
          </div>

          <button className="nmr-close" onClick={onExit} aria-label="Keluar">
            ×
          </button>

          <div className="nmr-quest">
            <div className="nmr-quest-text">{active.prompt}</div>
            <div className="nmr-quest-hint">{active.hint}</div>
            <div className="nmr-quest-kind">{active.kindLabel}</div>
          </div>

          <div className="nmr-counter">
            <b>
              {totalPlaced}/{active.denominator}
            </b>
            <span>papan terpasang</span>
          </div>

          {showHint && !judged && <div className="nmr-hint-box">💡 {active.hint}</div>}

          {judged && (
            <div className="nmr-feedback">
              <div className={'nmr-fb-badge ' + (wasRight ? 'good' : 'miss')}>
                {wasRight ? '✓ Jembatan tersambung!' : 'Belum pas!'}
              </div>
              <div className="nmr-fb-note">
                {wasRight
                  ? active.explanation
                  : `Kamu memasang ${totalPlaced} papan, targetnya ${active.target}. ${active.explanation}`}
              </div>
              {levelUp === 'up' && (
                <div className="nmr-levelup">📈 Naik tingkat! Jembatannya jadi lebih menantang</div>
              )}
              {levelUp === 'down' && <div className="nmr-levelup">🌱 Kita pelan-pelan dulu ya</div>}
            </div>
          )}

          <div className="nmr-actions">
            {!judged && (
              <button className="nmr-btn ghost" onClick={useHint}>
                💡 Petunjuk
              </button>
            )}
            {!judged && (
              <button className="nmr-btn primary" onClick={confirm} disabled={totalPlaced === 0}>
                Sambungkan jembatan
              </button>
            )}
            {judged && (
              <button className="nmr-btn primary" onClick={advance}>
                {wasRight
                  ? mode === 'mission' && missionIndex + 1 >= numeriaLevels.length
                    ? 'Selesaikan pulau →'
                    : 'Jembatan berikutnya →'
                  : '↻ Coba lagi'}
              </button>
            )}
          </div>
        </>
      )}

      {/* ---------------- Pemilih mode ---------------- */}
      {phase === 'choose' && (
        <div className="nmr-screen">
          <div className="nmr-panel">
            <div className="nmr-panel-emoji">🌉</div>
            <h2>Jembatan Operasi Hitung</h2>
            <p>Latih tambah, kurang, dan kali dengan memasang papan yang tepat.</p>

            <div className="nmr-modes">
              <button className="nmr-mode" onClick={startMission}>
                <span className="nmr-mode-icon">🎯</span>
                <span className="nmr-mode-body">
                  <span className="nmr-mode-title">Misi Jembatan</span>
                  <span className="nmr-mode-desc">
                    Lima jembatan berurutan. Inilah yang menentukan mastery-mu.
                  </span>
                  <span className="nmr-mode-tag">{mastery}% mastery</span>
                </span>
                <span className="nmr-mode-arrow">›</span>
              </button>

              <button className="nmr-mode endless" onClick={startEndless}>
                <span className="nmr-mode-icon">♾️</span>
                <span className="nmr-mode-body">
                  <span className="nmr-mode-title">Jembatan Tanpa Ujung</span>
                  <span className="nmr-mode-desc">
                    Empat jenis tantangan, tingkat kesulitan menyesuaikan kemampuanmu.
                  </span>
                  <span className="nmr-mode-tag">
                    {missionDone ? 'Tidak pernah habis' : 'Bisa dicoba sekarang'}
                  </span>
                </span>
                <span className="nmr-mode-arrow">›</span>
              </button>
            </div>

            <div className="nmr-howto">
              <div>👆 Ketuk papan untuk memasang atau melepasnya</div>
              <div>🔄 Seret layar untuk memutar jembatan</div>
              <div>⏳ Tidak ada batas waktu — pikirkan dulu sepuasnya</div>
              <div>💙 Salah tidak mengurangi apa pun, tinggal coba lagi</div>
            </div>

            <button className="nmr-btn ghost" onClick={onExit} style={{ width: '100%' }}>
              Nanti saja
            </button>
          </div>
        </div>
      )}

      {/* ---------------- Layar selesai (mode Misi) ---------------- */}
      {phase === 'done' && (
        <div className="nmr-screen">
          <div className="nmr-panel">
            <div className="nmr-panel-emoji">🏆</div>
            <h2>Pulau Numeria selesai!</h2>
            <p>Semua jembatan berhasil kamu sambungkan.</p>

            <div className="nmr-stats">
              <div className="nmr-stat">
                <b>{mastery}%</b>
                <span>mastery</span>
              </div>
              <div className="nmr-stat">
                <b>
                  {evidence.completed.length}/{numeriaLevels.length}
                </b>
                <span>jembatan</span>
              </div>
              <div className="nmr-stat">
                <b>{bestStreak}</b>
                <span>beruntun</span>
              </div>
            </div>

            <button className="nmr-btn primary" onClick={startEndless} style={{ width: '100%' }}>
              ♾️ Lanjut ke Jembatan Tanpa Ujung
            </button>
            <button
              className="nmr-btn ghost"
              onClick={backToChoose}
              style={{ width: '100%', marginTop: 9 }}
            >
              Ganti mode
            </button>
            <button className="nmr-btn ghost" onClick={onExit} style={{ width: '100%', marginTop: 9 }}>
              Kembali ke peta
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
