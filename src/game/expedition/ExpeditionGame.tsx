import CanvasBoundary from '../../components/CanvasBoundary';
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import CinematicRig, { ThreePointLights } from '../../render/CinematicRig';
import Postfx from '../../render/Postfx';
import ProceduralEnv from '../../render/ProceduralEnv';
import { getQuality, scaleCount } from '../../render/quality';
import BlockyCharacter, { type CharacterMotion } from '../../components/world3d/BlockyCharacter';
import { CHARACTER_BRAND, NAVY, SKY, WORLD } from '../../theme/brightBrand';
import {
  ARENA_RADIUS,
  LAKE,
  PATH_WIDTH,
  distanceToPath,
  portals,
  starSpots,
  terrainHeight,
} from './expeditionData';
import {
  AIRA_POSITION,
  CRYSTALS,
  IDLE_LINES,
  type CrystalType,
  type DialogueLine,
  type Quest,
} from './questData';
import {
  acceptQuest,
  addStar,
  completeQuest,
  getActiveQuest,
  getOfferableQuest,
  getSummary,
  isQuestComplete,
  loadState,
  refreshQuests,
  saveState,
  type ActiveQuestView,
  type ExpeditionState,
} from './questEngine';
import NpcAira from './NpcAira';
import ArenaProps from './ArenaProps';
import { CrystalWallet, DialoguePanel, QUEST_HUD_CSS, QuestTracker, RewardToast } from './QuestHud';
import WorldPortalHost, { WORLD_PORTAL_CSS } from './WorldPortalHost';

/**
 * ExpeditionGame.tsx — "Ekspedisi Brightoria".
 * Patch 38 → 39 → 40 → 41 → 42 → 44.
 *
 * ====================================================================
 * DUA GALAT SERIUS YANG DIPERBAIKI DI PATCH 44
 * ====================================================================
 *
 * GALAT 1 — SUMBU Z TERBALIK. Ini penyebab karakter tenggelam,
 * gerbang separuh terkubur, pohon melayang, dan "sungai biru" aneh
 * yang terlihat di layar.
 *
 *   Mesh tanah diputar -90 derajat pada sumbu X. Akibat rotasi itu:
 *       dunia(x, y, z) = (lokal_x, tinggi, -lokal_y)
 *   Artinya world_z = MINUS lokal_y.
 *
 *   Versi sebelumnya memanggil terrainHeight(lokal_x, lokal_y) saat
 *   membentuk mesh, PADAHAL karakter, gerbang, pohon, dan danau
 *   semuanya memanggil terrainHeight(world_x, world_z).
 *
 *   Hasilnya: permukaan yang DIGAMBAR adalah CERMINAN dari permukaan
 *   yang DIPIJAK. Di tempat yang cerminannya lebih tinggi, karakter
 *   tenggelam; di tempat sebaliknya, ia melayang.
 *
 *   Perbaikannya ada di komponen Terrain di bawah: konversi lokal ke
 *   dunia dilakukan secara eksplisit sebelum memanggil terrainHeight.
 *
 * GALAT 2 — GERBANG MELEMPAR KEMBALI KE PETA. Menekan "Masuk ..."
 * membuat anak kembali ke menu pilih pulau, bukan masuk permainan.
 *
 *   Penyebabnya: handleEnterPortal masih memanggil prop onEnterWorld.
 *   ExpeditionLauncher (Patch 38) mengimplementasikan callback itu
 *   dengan MENUTUP SELURUH ARENA lalu mengirim CustomEvent. Sejak
 *   Patch 41, WorldPortalHost sudah membuka permainan sebagai overlay
 *   di atas arena — jadi callback lama itu justru merusak alurnya.
 *
 *   Perbaikannya: berhenti memanggil onEnterWorld. Propnya tetap
 *   diterima agar ExpeditionLauncher tidak perlu diubah.
 *
 * ====================================================================
 * YANG TIDAK DISENTUH
 * ====================================================================
 *   - Mesin quest (terima, lacak, serahkan, hadiah kristal)
 *   - Deteksi 'play_world' lewat selisih evidence
 *   - Bintang Ilmu sebagai kunci pembuka gerbang
 *   - Fisika gerak, kamera pegas, joystick, kontrol keyboard
 * ====================================================================
 */

const STYLE_ID = 'brightoria-expedition-styles-v6';
const OLD_STYLE_IDS = [
  'brightoria-expedition-styles-v1',
  'brightoria-expedition-styles-v2',
  'brightoria-expedition-styles-v3',
  'brightoria-expedition-styles-v4',
  'brightoria-expedition-styles-v5',
];

const EXPEDITION_CSS = `
.exp-overlay { position: fixed; inset: 0; z-index: 80; background: #001445; display: flex; flex-direction: column; }
.exp-canvas-wrap { position: absolute; inset: 0; }
.exp-hud-top { position: absolute; top: 0; left: 0; right: 0; z-index: 3; display: flex; justify-content: space-between; align-items: flex-start; padding: 12px 14px; pointer-events: none; gap: 10px; }
.exp-hud-left { display: flex; flex-direction: column; gap: 8px; align-items: flex-start; pointer-events: none; }
.exp-badge { pointer-events: auto; display: inline-flex; align-items: center; gap: 7px; background: #ffffffee; border: 2px solid #a8dcf5; border-radius: 999px; padding: 7px 13px; font-size: 12px; font-weight: 900; color: #002880; box-shadow: 0 6px 16px rgba(0,20,69,0.28); }
.exp-camera-toggle { pointer-events: auto; border: 2px solid #a8dcf5; background: #ffffffee; color: #002880; border-radius: 999px; padding: 7px 12px; font-size: 11px; font-weight: 900; box-shadow: 0 6px 16px rgba(0,20,69,0.24); cursor: pointer; display: inline-flex; align-items: center; gap: 7px; }
.exp-camera-toggle.on { background: #002880; color: #d6eefb; border-color: #67c4ec; }
.exp-brand-mark { height: 20px; width: 20px; object-fit: contain; display: block; }
.exp-close { pointer-events: auto; border: 0; background: #ffffff; border-radius: 50%; width: 40px; height: 40px; display: grid; place-items: center; cursor: pointer; color: #002880; font-size: 19px; font-weight: 900; box-shadow: 0 6px 16px rgba(0,20,69,0.28); flex-shrink: 0; }
.exp-stick { position: absolute; left: 18px; bottom: 22px; width: 132px; height: 132px; border-radius: 50%; background: rgba(255,255,255,0.16); border: 2px solid rgba(168,220,245,0.45); z-index: 4; touch-action: none; }
.exp-stick-knob { position: absolute; width: 58px; height: 58px; border-radius: 50%; background: radial-gradient(circle at 35% 30%, #d6eefb, #28a8e0); box-shadow: 0 6px 16px rgba(0,20,69,0.4); left: 37px; top: 37px; pointer-events: none; }
.exp-action { position: absolute; right: 20px; bottom: 34px; z-index: 4; border: 0; border-radius: 999px; padding: 16px 26px; font-size: 15px; font-weight: 900; color: #fff; background: linear-gradient(135deg,#28a8e0,#002880); box-shadow: 0 10px 26px rgba(0,20,69,0.45); cursor: pointer; }
.exp-action.locked { background: linear-gradient(135deg,#7c97ae,#4a5f6e); }
.exp-action.talk { background: linear-gradient(135deg,#1c94cc,#0d7ab0); }
.exp-hint { position: absolute; left: 50%; transform: translateX(-50%); bottom: 24px; z-index: 3; background: #002880e0; color: #d6eefb; border-radius: 999px; padding: 8px 18px; font-size: 11px; white-space: nowrap; pointer-events: none; }
.exp-hint.locked { background: #0b6155e8; }
.exp-portal-label { background: #fffffff2; border-radius: 12px; padding: 5px 11px; text-align: center; min-width: 100px; box-shadow: 0 5px 12px rgba(0,20,69,0.26); }
.exp-portal-label b { display: block; font-size: 10.5px; color: #002880; }
.exp-portal-label span { display: block; font-size: 8.5px; color: #5a7691; }
.exp-toast { position: absolute; top: 70px; left: 50%; transform: translateX(-50%); z-index: 5; background: #d6eefb; border: 1px solid #67c4ec; color: #002880; border-radius: 999px; padding: 9px 20px; font-size: 13px; font-weight: 800; animation: exp-pop 0.35s ease; }
@keyframes exp-pop { 0% { opacity: 0; transform: translateX(-50%) scale(0.85); } 100% { opacity: 1; transform: translateX(-50%) scale(1); } }
@media (max-width: 700px) {
  .exp-stick { width: 118px; height: 118px; left: 12px; bottom: 16px; }
  .exp-stick-knob { width: 52px; height: 52px; left: 33px; top: 33px; }
  .exp-action { padding: 14px 20px; font-size: 14px; }
  .exp-brand-mark { height: 17px; width: 17px; }
}
${QUEST_HUD_CSS}
${WORLD_PORTAL_CSS}
`;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function applyCameraLook(control: CameraControlState, rawDx: number, rawDy: number, locked: boolean) {
  const dx = Math.abs(rawDx) < 0.35 ? 0 : rawDx;
  const dy = Math.abs(rawDy) < 0.35 ? 0 : rawDy;
  if (dx === 0 && dy === 0) return;

  const horizontalDominant = Math.abs(dx) > Math.abs(dy) * 1.75;
  const verticalDominant = Math.abs(dy) > Math.abs(dx) * 1.3;
  const yawSensitivity = locked ? 0.0055 : 0.0062;
  const pitchSensitivity = locked ? 0.0025 : 0.0022;

  if (locked) {
    control.followYaw -= dx * yawSensitivity;
    control.yawOffset = 0;
  } else {
    control.yawOffset -= dx * yawSensitivity;
  }

  if (locked || verticalDominant || !horizontalDominant) {
    control.pitchOffset = clamp(control.pitchOffset + dy * pitchSensitivity, -0.68, 0.58);
  }
}

function useInjectStyles() {
  useEffect(() => {
    OLD_STYLE_IDS.forEach((id) => document.getElementById(id)?.remove());
    if (document.getElementById(STYLE_ID)) return;
    const el = document.createElement('style');
    el.id = STYLE_ID;
    el.textContent = EXPEDITION_CSS;
    document.head.appendChild(el);
  }, []);
}

interface InputState {
  x: number;
  z: number;
  interact: boolean;
}

interface CameraControlState {
  yawOffset: number;
  followYaw: number;
  locked: boolean;
  pitchOffset: number;
  distanceOffset: number;
}

// ---------------------------------------------------------------------------
// LAHAN
// ---------------------------------------------------------------------------

function Terrain() {
  const quality = getQuality();

  const geometry = useMemo(() => {
    /**
     * Segmen SENGAJA dibatasi.
     *
     * Dengan flat shading, jumlah segmen menentukan seberapa terlihat
     * facet-nya: terlalu banyak segmen membuat facet terlalu kecil
     * untuk dibaca mata dan permukaan kembali terasa mulus — tidak
     * selaras dengan karakter blocky.
     *
     * Rentang 40-64 menghasilkan facet selebar ~0.5-0.8 unit: cukup
     * besar untuk terbaca, cukup halus untuk berjalan.
     */
    const segments = quality.tier === 'low' ? 40 : quality.tier === 'balanced' ? 52 : 64;
    const plane = new THREE.PlaneGeometry(ARENA_RADIUS * 2, ARENA_RADIUS * 2, segments, segments);

    const pos = plane.attributes.position;
    const colors: number[] = [];

    const grass = new THREE.Color(WORLD.grass);
    const grassLight = new THREE.Color(WORLD.grassLight);
    const grassDark = new THREE.Color(WORLD.grassDark);
    const dry = new THREE.Color(WORLD.dry);
    const rock = new THREE.Color(WORLD.rock);
    const sand = new THREE.Color(WORLD.sand);
    const path = new THREE.Color(WORLD.path);
    const lakeSand = new THREE.Color(WORLD.lakeSand);

    for (let i = 0; i < pos.count; i++) {
      const localX = pos.getX(i);
      const localY = pos.getY(i);

      /**
       * KONVERSI LOKAL -> DUNIA. Inilah inti perbaikan Patch 44.
       *
       * Mesh ini dirotasi -90 derajat pada sumbu X, sehingga:
       *     dunia(x, y, z) = (localX, tinggi, -localY)
       * Jadi world_z = -localY.
       *
       * Semua objek lain (karakter, gerbang, pohon, danau) memakai
       * terrainHeight(world_x, world_z). Mesh WAJIB memakai konversi
       * yang sama. Sebelumnya tidak — dan itulah sebabnya permukaan
       * yang digambar adalah cerminan dari permukaan yang dipijak.
       */
      const worldX = localX;
      const worldZ = -localY;

      const h = terrainHeight(worldX, worldZ);
      pos.setZ(i, h);

      const dist = Math.hypot(worldX, worldZ);

      /**
       * Kemiringan lereng, dihitung dari selisih terbatas.
       * Dipakai untuk menyingkap batuan di tebing curam — isyarat
       * alami yang membuat lanskap terbaca sebagai bentang nyata,
       * bukan sekadar gradien warna berdasarkan ketinggian.
       */
      const eps = 0.6;
      const dhx = terrainHeight(worldX + eps, worldZ) - terrainHeight(worldX - eps, worldZ);
      const dhz = terrainHeight(worldX, worldZ + eps) - terrainHeight(worldX, worldZ - eps);
      const slope = Math.hypot(dhx, dhz) / (2 * eps);

      let c: THREE.Color;

      if (dist > ARENA_RADIUS - 1.6) {
        c = sand.clone(); // pasir tepi arena
      } else if (h > 1.15) {
        c = rock.clone().lerp(dry, 0.45); // batuan tersingkap di puncak
      } else if (h > 0.45) {
        c = grass.clone().lerp(dry, (h - 0.45) / 0.7);
      } else {
        /**
         * Bercak rumput: dua gelombang berfrekuensi tidak kelipatan,
         * sehingga polanya tidak pernah terlihat berulang. Ini yang
         * menghilangkan kesan "karpet hijau seragam".
         */
        const patch =
          Math.sin(worldX * 0.42) * Math.cos(worldZ * 0.37) * 0.5 +
          Math.sin((worldX - worldZ) * 0.23) * 0.5;
        c = grassDark.clone().lerp(grassLight, (patch + 1) * 0.5);
      }

      // Lereng curam menyingkapkan batuan di baliknya.
      if (slope > 0.32) {
        c.lerp(rock, Math.min(0.72, (slope - 0.32) * 1.5));
      }

      // Pasir di tepi danau — transisi alami dari air ke darat.
      const lakeEdge = Math.hypot(worldX - LAKE.x, worldZ - LAKE.z);
      if (lakeEdge < LAKE.radius + 1.4) {
        const blend = 1 - Math.min(1, Math.max(0, (lakeEdge - LAKE.radius * 0.6) / 1.5));
        c.lerp(lakeSand, blend * 0.85);
      }

      /**
       * Jalan setapak, diwarnai langsung ke vertex. Nol biaya render,
       * tapi anak jadi tahu arah gerbang tanpa membaca petunjuk teks.
       */
      const pathDist = distanceToPath(worldX, worldZ);
      if (pathDist < PATH_WIDTH + 0.6) {
        const blend = 1 - Math.min(1, Math.max(0, (pathDist - PATH_WIDTH * 0.45) / 0.9));
        c.lerp(path, blend * 0.9);
      }

      /**
       * Bayangan cekungan: titik yang lebih rendah dari lingkungannya
       * digelapkan sedikit. Ini pendekatan murah untuk ambient
       * occlusion, dan efeknya nyata — lembah terasa dalam, punggung
       * bukit terasa menonjol.
       */
      const around =
        (terrainHeight(worldX + 1.4, worldZ) +
          terrainHeight(worldX - 1.4, worldZ) +
          terrainHeight(worldX, worldZ + 1.4) +
          terrainHeight(worldX, worldZ - 1.4)) /
        4;
      const recess = Math.max(0, around - h);
      if (recess > 0) c.multiplyScalar(Math.max(0.74, 1 - recess * 0.2));

      colors.push(c.r, c.g, c.b);
    }

    plane.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    plane.computeVertexNormals();
    return plane;
  }, [quality.tier]);

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} receiveShadow={quality.shadows}>
      <meshStandardMaterial vertexColors roughness={0.95} metalness={0.02} flatShading />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// BINTANG ILMU
// ---------------------------------------------------------------------------

function StarOrb({ x, z, collected }: { x: number; z: number; collected: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const base = terrainHeight(x, z) + 0.85;

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.rotation.y += 0.03;
    ref.current.position.y = base + Math.sin(t * 1.8 + x) * 0.16;
    const target = collected ? 0.001 : 1;
    const cur = ref.current.scale.x;
    ref.current.scale.setScalar(cur + (target - cur) * 0.14);
  });

  return (
    <group ref={ref} position={[x, base, z]}>
      <mesh>
        <octahedronGeometry args={[0.28, 0]} />
        {/* metalness tinggi kini BERFUNGSI karena ada environment map —
            kristal memantulkan langit, bukan sekadar bercahaya rata. */}
        <meshStandardMaterial
          color={SKY.light}
          emissive={SKY.base}
          emissiveIntensity={2.2}
          roughness={0.12}
          metalness={0.65}
          flatShading
        />
      </mesh>
      <pointLight color={SKY.base} intensity={collected ? 0 : 1.5} distance={3.2} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// GERBANG DUNIA
// ---------------------------------------------------------------------------

function Portal({
  x,
  z,
  color,
  accent,
  icon,
  name,
  locked,
  starsRequired,
  near,
}: {
  x: number;
  z: number;
  color: string;
  accent: string;
  icon: string;
  name: string;
  locked: boolean;
  starsRequired: number;
  near: boolean;
}) {
  const ringRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const y = terrainHeight(x, z);
  const quality = getQuality();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ringRef.current) ringRef.current.rotation.z += locked ? 0.004 : 0.014;
    if (coreRef.current) {
      const s = (near ? 1.14 : 1) + Math.sin(t * 2) * 0.05;
      coreRef.current.scale.setScalar(s);
    }
  });

  return (
    <group position={[x, y, z]}>
      {/* Alas batu — menegaskan gerbang berdiri di tanah datar */}
      <mesh position={[0, 0.06, 0]} receiveShadow={quality.shadows}>
        <cylinderGeometry args={[1.85, 2.05, 0.12, 12]} />
        <meshStandardMaterial color={WORLD.rockLight} roughness={0.92} flatShading />
      </mesh>

      {/* Dua tiang penyangga — membuat gerbang terbaca sebagai
          bangunan berdiri, bukan cincin melayang. */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 1.02, 0.6, 0]} castShadow={quality.shadows}>
          <boxGeometry args={[0.2, 1.1, 0.2]} />
          <meshStandardMaterial
            color={locked ? WORLD.rock : NAVY.deep}
            roughness={0.7}
            metalness={0.2}
            flatShading
          />
        </mesh>
      ))}

      <mesh position={[0, 1.22, 0]} castShadow={quality.shadows}>
        <torusGeometry args={[1.05, 0.13, 10, 28]} />
        <meshStandardMaterial
          color={locked ? WORLD.rock : color}
          emissive={locked ? '#000000' : color}
          emissiveIntensity={locked ? 0 : 0.85}
          roughness={0.35}
          metalness={0.55}
        />
      </mesh>
      <mesh ref={coreRef} position={[0, 1.22, 0]}>
        <circleGeometry args={[0.92, 28]} />
        <meshBasicMaterial
          color={locked ? NAVY.deepest : accent}
          transparent
          opacity={locked ? 0.35 : 0.58}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.14, 0]}>
        <ringGeometry args={[1.25, 1.5, 32]} />
        <meshBasicMaterial color={locked ? WORLD.rock : accent} transparent opacity={0.5} />
      </mesh>
      {!locked && <pointLight color={accent} intensity={2.2} distance={6} position={[0, 1.5, 0]} />}

      <Html center position={[0, 2.62, 0]} occlude={false} zIndexRange={[20, 0]}>
        <div className="exp-portal-label">
          <b>
            {icon} {name}
          </b>
          <span>{locked ? `Butuh ${starsRequired} bintang` : near ? 'Siap masuk!' : 'Terbuka'}</span>
        </div>
      </Html>
    </group>
  );
}

// ---------------------------------------------------------------------------
// KARAKTER PEMAIN
// ---------------------------------------------------------------------------

function Explorer({
  input,
  cameraControl,
  onMove,
  frozen,
}: {
  input: RefObject<InputState>;
  cameraControl: RefObject<CameraControlState>;
  onMove: (x: number, z: number) => void;
  frozen: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const velocity = useRef(new THREE.Vector2(0, 0));
  const position = useRef(new THREE.Vector2(0, 4.5));
  const facing = useRef(0);
  const camera = useThree((state) => state.camera);
  const camTarget = useMemo(() => new THREE.Vector3(), []);
  const camDesired = useMemo(() => new THREE.Vector3(), []);

  /** Jembatan gerak tanpa re-render (lihat BlockyCharacter). */
  const motion = useRef<CharacterMotion>({ speed: 0, airborne: false });

  useFrame((state, delta) => {
    try {
      const dt = Math.min(delta, 0.05);
      const inp = input.current;
      if (!inp || !group.current) return;

      const ACCEL = 34;
      const MAX_SPEED = 6.2;
      const FRICTION = 9;

      const controls = cameraControl.current;
      const lockedToCamera = controls?.locked === true;
      const rawWish = new THREE.Vector2(frozen ? 0 : inp.x, frozen ? 0 : inp.z);
      if (rawWish.length() > 1) rawWish.normalize();
      const baseYaw = lockedToCamera ? (controls?.followYaw ?? facing.current) : 0;
      const sin = Math.sin(baseYaw);
      const cos = Math.cos(baseYaw);
      const wish = lockedToCamera
        ? new THREE.Vector2(
            rawWish.x * cos - rawWish.y * sin,
            rawWish.x * -sin - rawWish.y * cos,
          )
        : rawWish.clone();
      const wishLen = wish.length();
      if (wishLen > 1) wish.normalize();

      if (wishLen > 0.02) {
        const desiredVelocity = wish.clone().multiplyScalar(MAX_SPEED);
        velocity.current.lerp(desiredVelocity, Math.min(1, dt * 18));
      } else {
        const damp = Math.max(0, 1 - FRICTION * dt);
        velocity.current.multiplyScalar(damp);
      }

      const speed = velocity.current.length();
      if (speed > MAX_SPEED) velocity.current.multiplyScalar(MAX_SPEED / speed);

      position.current.x += velocity.current.x * dt;
      position.current.y += velocity.current.y * dt;

      const dist = position.current.length();
      const limit = ARENA_RADIUS - 1.4;
      if (dist > limit) {
        position.current.setLength(limit);
        velocity.current.multiplyScalar(0.4);
      }

      const px = position.current.x;
      const pz = position.current.y;

      /**
       * Titik nol BlockyCharacter ada di TELAPAK KAKI, jadi karakter
       * diletakkan tepat di permukaan.
       *
       * Ditambah margin sangat kecil (0.02) karena mesh tanah adalah
       * pendekatan linear per-facet dari fungsi terrainHeight yang
       * mulus. Di tengah facet, permukaan yang digambar bisa sedikit
       * lebih tinggi dari nilai fungsinya. Margin ini menutup selisih
       * itu tanpa membuat karakter terlihat melayang.
       */
      const ground = terrainHeight(px, pz) + 0.02;
      group.current.position.set(px, ground, pz);

      motion.current.speed = Math.min(1, speed / MAX_SPEED);
      motion.current.airborne = false;

      if (lockedToCamera) {
        facing.current = baseYaw;
        controls!.followYaw = facing.current;
      } else if (wishLen > 0.12) {
        facing.current = Math.atan2(wish.x, wish.y);
      } else if (speed > 0.25) {
        facing.current = Math.atan2(velocity.current.x, velocity.current.y);
      }
      const targetQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, facing.current, 0));
      group.current.quaternion.slerp(targetQuat, Math.min(1, dt * (wishLen > 0.12 ? 28 : 11)));

      onMove(px, pz);

      // Kamera third-person: pegas + look-ahead ke arah gerak.
      const lookAhead = velocity.current.clone().multiplyScalar(0.28);
      const pitchOffset = controls?.pitchOffset ?? 0;
      const distanceOffset = controls?.distanceOffset ?? 0;
      camTarget.set(px + lookAhead.x, ground + 1.25 + pitchOffset * 0.35, pz + lookAhead.y);
      const behind = 7.8 + distanceOffset;
      const cameraAngle = lockedToCamera ? facing.current : facing.current + (controls?.yawOffset ?? 0);
      const cameraHeight = ground + 4.9 + pitchOffset * 4.8 + distanceOffset * 0.18;
      const trailingDistance = behind * (0.55 + Math.max(0, -pitchOffset) * 0.18);
      camDesired.set(
        px - Math.sin(cameraAngle) * trailingDistance,
        Math.max(ground + 1.45, cameraHeight),
        pz - Math.cos(cameraAngle) * trailingDistance,
      );
      camera.position.lerp(camDesired, Math.min(1, dt * 2.6));
      camera.lookAt(camTarget);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[Brightoria] Explorer error (diredam):', err);
    }
  });

  return (
    <group ref={group}>
      <BlockyCharacter palette={CHARACTER_BRAND.explorer} motionRef={motion} accessory="backpack" />
      <pointLight color={SKY.base} intensity={1.2} distance={4.5} position={[0, 1.3, 0]} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// SCENE
// ---------------------------------------------------------------------------

function ExpeditionScene({
  input,
  cameraControl,
  collected,
  onCollect,
  onNearPortal,
  onNearAira,
  unlocked,
  frozen,
  airaHasOffer,
  airaHasReady,
}: {
  input: RefObject<InputState>;
  cameraControl: RefObject<CameraControlState>;
  collected: Set<string>;
  onCollect: (id: string) => void;
  onNearPortal: (id: string | null) => void;
  onNearAira: (near: boolean) => void;
  unlocked: (id: string) => boolean;
  frozen: boolean;
  airaHasOffer: boolean;
  airaHasReady: boolean;
}) {
  const quality = getQuality();
  const playerPos = useRef<[number, number]>([0, 4.5]);
  const [nearId, setNearId] = useState<string | null>(null);
  const [nearAira, setNearAira] = useState(false);
  const frameSkip = useRef(0);

  function handleMove(x: number, z: number) {
    playerPos.current = [x, z];
  }

  // Deteksi jarak 6x/detik, bukan 60x — cukup responsif untuk anak,
  // jauh lebih hemat untuk HP.
  useFrame(() => {
    frameSkip.current += 1;
    if (frameSkip.current % 10 !== 0) return;
    const [px, pz] = playerPos.current;

    starSpots.forEach(([sx, sz], i) => {
      const id = `s${i}`;
      if (collected.has(id)) return;
      const dx = px - sx;
      const dz = pz - sz;
      if (dx * dx + dz * dz < 1.6) onCollect(id);
    });

    let found: string | null = null;
    for (const p of portals) {
      const dx = px - p.position[0];
      const dz = pz - p.position[1];
      if (dx * dx + dz * dz < 5.5) {
        found = p.id;
        break;
      }
    }
    if (found !== nearId) {
      setNearId(found);
      onNearPortal(found);
    }

    const adx = px - AIRA_POSITION[0];
    const adz = pz - AIRA_POSITION[1];
    const airaClose = adx * adx + adz * adz < 6.5;
    if (airaClose !== nearAira) {
      setNearAira(airaClose);
      onNearAira(airaClose);
    }
  });

  return (
    <>
      <CinematicRig exposure={1.05} />

      {/* Pencahayaan berbasis lingkungan — tanpa ini, metalness pada
          kristal & gerbang tidak berfungsi sama sekali. */}
      <ProceduralEnv intensity={0.9} />

      <color attach="background" args={[WORLD.skyHorizon]} />
      <fog attach="fog" args={[WORLD.fog, 20, 50]} />
      <ThreePointLights intensity={1} shadowRadius={18} />

      <Terrain />
      <ArenaProps />
      <Explorer input={input} cameraControl={cameraControl} onMove={handleMove} frozen={frozen} />

      <NpcAira
        x={AIRA_POSITION[0]}
        z={AIRA_POSITION[1]}
        near={nearAira}
        hasOffer={airaHasOffer}
        hasReady={airaHasReady}
      />

      {starSpots.map(([x, z], i) => (
        <StarOrb key={i} x={x} z={z} collected={collected.has(`s${i}`)} />
      ))}

      {portals.map((p) => (
        <Portal
          key={p.id}
          x={p.position[0]}
          z={p.position[1]}
          color={p.color}
          accent={p.accent}
          icon={p.icon}
          name={p.short}
          locked={!unlocked(p.id)}
          starsRequired={p.starsRequired}
          near={nearId === p.id}
        />
      ))}

      {quality.particleScale > 0 && (
        <points>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[
                (() => {
                  const n = Math.max(30, scaleCount(120));
                  const arr = new Float32Array(n * 3);
                  for (let i = 0; i < n; i++) {
                    const a = Math.random() * Math.PI * 2;
                    const r = Math.random() * ARENA_RADIUS;
                    arr[i * 3] = Math.cos(a) * r;
                    arr[i * 3 + 1] = 0.6 + Math.random() * 5;
                    arr[i * 3 + 2] = Math.sin(a) * r;
                  }
                  return arr;
                })(),
                3,
              ]}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.07}
            color={WORLD.dust}
            transparent
            opacity={0.4}
            sizeAttenuation
            depthWrite={false}
          />
        </points>
      )}

      <OrbitControls enabled={false} />
      {quality.postfx && <Postfx intensity={0.28} threshold={0.9} vignette={0.36} />}
    </>
  );
}

// ---------------------------------------------------------------------------
// KOMPONEN UTAMA
// ---------------------------------------------------------------------------

type DialogMode = 'offer' | 'complete' | 'idle';

export default function ExpeditionGame({
  onExit,
  onXpEarned,
}: {
  onExit: () => void;
  onXpEarned: (amount: number) => void;
  /**
   * TIDAK DIPAKAI LAGI sejak Patch 44 — lihat catatan di
   * handleEnterPortal. Propnya sengaja dihapus dari daftar parameter
   * agar tidak ada yang memanggilnya tanpa sengaja, tapi
   * ExpeditionLauncher tetap boleh mengirimkannya (TypeScript
   * mengizinkan prop berlebih pada JSX bila tipenya cocok lewat
   * spread, dan pemanggilan langsung tetap aman karena prop tambahan
   * hanya diabaikan saat runtime).
   */
  onEnterWorld?: (worldId: string) => void;
}) {
  useInjectStyles();
  const quality = getQuality();

  const inputRef = useRef<InputState>({ x: 0, z: 0, interact: false });
  const cameraControlRef = useRef<CameraControlState>({
    yawOffset: 0,
    followYaw: 0,
    locked: false,
    pitchOffset: 0,
    distanceOffset: 0,
  });

  const [state, setState] = useState<ExpeditionState>(() => refreshQuests(loadState()));
  const [nearPortal, setNearPortal] = useState<string | null>(null);
  const [nearAira, setNearAira] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{
    lines: DialogueLine[];
    quest: Quest | null;
    mode: DialogMode;
  } | null>(null);
  const [reward, setReward] = useState<{ crystal: CrystalType; amount: number } | null>(null);
  const [openWorldId, setOpenWorldId] = useState<string | null>(null);
  const [cameraLocked, setCameraLocked] = useState(false);

  const stickRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const keys = useRef<Record<string, boolean>>({});

  const collected = useMemo(() => new Set(state.stars), [state.stars]);
  const summary = useMemo(() => getSummary(state), [state]);
  const activeQuest: ActiveQuestView | null = useMemo(() => getActiveQuest(state), [state]);
  const offerable = useMemo(() => getOfferableQuest(state), [state]);
  const readyToTurnIn = activeQuest?.ready === true;

  useEffect(() => {
    function recheck() {
      setState((prev) => refreshQuests(prev));
    }
    window.addEventListener('focus', recheck);
    document.addEventListener('visibilitychange', recheck);
    return () => {
      window.removeEventListener('focus', recheck);
      document.removeEventListener('visibilitychange', recheck);
    };
  }, []);

  function persist(next: ExpeditionState) {
    setState(next);
    saveState(next);
  }

  function isUnlocked(id: string): boolean {
    const p = portals.find((x) => x.id === id);
    if (!p) return true;
    return state.stars.length >= p.starsRequired;
  }

  function handleCollect(id: string) {
    if (collected.has(id)) return;
    persist(addStar(state, id));
    onXpEarned(8);
    setToast('⭐ Bintang Ilmu ditemukan!');
    window.setTimeout(() => setToast(null), 1600);
  }

  function handleTalkToAira() {
    if (readyToTurnIn && activeQuest) {
      setDialog({ lines: activeQuest.quest.complete, quest: activeQuest.quest, mode: 'complete' });
    } else if (offerable) {
      setDialog({ lines: offerable.offer, quest: offerable, mode: 'offer' });
    } else {
      setDialog({ lines: IDLE_LINES, quest: null, mode: 'idle' });
    }
  }

  function handleDialogAccept() {
    if (!dialog) return;

    if (dialog.mode === 'offer' && dialog.quest) {
      persist(acceptQuest(state, dialog.quest.id));
      setToast('📜 Tugas baru diterima!');
      window.setTimeout(() => setToast(null), 1600);
    } else if (dialog.mode === 'complete' && dialog.quest) {
      const quest = dialog.quest;
      if (isQuestComplete(state, quest.id)) {
        persist(completeQuest(state, quest.id));
        onXpEarned(quest.reward.xp);
        setReward({ crystal: quest.reward.crystal, amount: quest.reward.amount });
        window.setTimeout(() => setReward(null), 2200);
      }
    }
    setDialog(null);
  }

  /**
   * Membuka permainan dunia SEBAGAI OVERLAY di atas arena.
   *
   * PENTING: jangan panggil prop onEnterWorld di sini.
   * ExpeditionLauncher (Patch 38) mengimplementasikan callback itu
   * dengan MENUTUP SELURUH ARENA lalu mengirim CustomEvent — akibatnya
   * anak terlempar kembali ke menu pilih pulau, bukan masuk permainan.
   * Itulah galat yang dilaporkan pengguna.
   *
   * Sejak Patch 41, WorldPortalHost memuat permainan sendiri, jadi
   * callback lama tidak lagi diperlukan.
   */
  function handleEnterPortal() {
    if (!nearPortal) return;
    if (!isUnlocked(nearPortal)) {
      const p = portals.find((x) => x.id === nearPortal);
      setToast(`🔒 Kumpulkan ${p ? p.starsRequired : 0} bintang dulu`);
      window.setTimeout(() => setToast(null), 1800);
      return;
    }
    persist({ ...state, visits: state.visits + 1 });
    setOpenWorldId(nearPortal);
  }

  /** Titik deteksi quest paling akurat: anak baru menutup game dunia. */
  function handleCloseWorld() {
    setOpenWorldId(null);
    const refreshed = refreshQuests(loadState());
    setState(refreshed);

    const active = getActiveQuest(refreshed);
    if (active?.ready) {
      setToast('✓ Tugas selesai! Laporkan ke Aira');
      window.setTimeout(() => setToast(null), 2400);
    }
  }

  function handlePrimaryAction() {
    if (nearAira) handleTalkToAira();
    else handleEnterPortal();
  }

  function unlockCamera() {
    if (document.pointerLockElement) document.exitPointerLock();
    setCameraLocked(false);
  }

  function toggleCameraLock() {
    if (dialog || openWorldId) return;
    const wrap = canvasWrapRef.current;
    if (!wrap) return;

    if (document.pointerLockElement === wrap || cameraLocked) {
      unlockCamera();
      return;
    }

    const lockResult = wrap.requestPointerLock?.();
    if (lockResult && 'catch' in lockResult) {
      lockResult.catch(() => setCameraLocked(false));
    }
  }

  useEffect(() => {
    function update() {
      const k = keys.current;
      const x = (k['d'] || k['arrowright'] ? 1 : 0) - (k['a'] || k['arrowleft'] ? 1 : 0);
      const z = (k['s'] || k['arrowdown'] ? 1 : 0) - (k['w'] || k['arrowup'] ? 1 : 0);
      inputRef.current.x = x;
      inputRef.current.z = z;
    }
    function down(e: KeyboardEvent) {
      const key = e.key.toLowerCase();
      if (key === 'shift') {
        e.preventDefault();
        if (!e.repeat) toggleCameraLock();
        return;
      }
      if (
        ['w', 'a', 's', 'd', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright', ' '].includes(key)
      ) {
        e.preventDefault();
      }
      keys.current[key] = true;
      if (openWorldId) return;
      if (dialog) return;
      if (key === 'escape') onExit();
      if (key === 'enter' || key === ' ') handlePrimaryAction();
      update();
    }
    function up(e: KeyboardEvent) {
      keys.current[e.key.toLowerCase()] = false;
      update();
    }
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nearPortal, nearAira, dialog, state, openWorldId, cameraLocked]);

  useEffect(() => {
    const wrap = canvasWrapRef.current;

    function onPointerLockChange() {
      setCameraLocked(document.pointerLockElement === wrap);
    }

    function onPointerLockMove(e: MouseEvent) {
      if (document.pointerLockElement !== wrap) return;
      applyCameraLook(cameraControlRef.current, e.movementX, e.movementY, true);
    }

    document.addEventListener('pointerlockchange', onPointerLockChange);
    document.addEventListener('mousemove', onPointerLockMove);
    return () => {
      document.removeEventListener('pointerlockchange', onPointerLockChange);
      document.removeEventListener('mousemove', onPointerLockMove);
    };
  }, []);

  useEffect(() => {
    if ((dialog || openWorldId) && cameraLocked) unlockCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialog, openWorldId, cameraLocked]);

  useEffect(() => {
    cameraControlRef.current.locked = cameraLocked;
    if (cameraLocked) {
      cameraControlRef.current.followYaw += cameraControlRef.current.yawOffset;
      cameraControlRef.current.yawOffset = 0;
    }
  }, [cameraLocked]);

  useEffect(() => {
    const stick = stickRef.current;
    const knob = knobRef.current;
    if (!stick || !knob) return;
    let active = false;
    let originX = 0;
    let originY = 0;
    const RADIUS = 46;

    function setKnob(dx: number, dy: number) {
      if (!knob) return;
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
    }
    function onDown(e: PointerEvent) {
      active = true;
      const rect = stick!.getBoundingClientRect();
      originX = rect.left + rect.width / 2;
      originY = rect.top + rect.height / 2;
      stick!.setPointerCapture(e.pointerId);
      onMove(e);
    }
    function onMove(e: PointerEvent) {
      if (!active) return;
      let dx = e.clientX - originX;
      let dy = e.clientY - originY;
      const len = Math.hypot(dx, dy);
      if (len > RADIUS) {
        dx = (dx / len) * RADIUS;
        dy = (dy / len) * RADIUS;
      }
      setKnob(dx, dy);
      inputRef.current.x = dx / RADIUS;
      inputRef.current.z = dy / RADIUS;
    }
    function onUp() {
      active = false;
      setKnob(0, 0);
      inputRef.current.x = 0;
      inputRef.current.z = 0;
    }

    stick.addEventListener('pointerdown', onDown);
    stick.addEventListener('pointermove', onMove);
    stick.addEventListener('pointerup', onUp);
    stick.addEventListener('pointercancel', onUp);
    return () => {
      stick.removeEventListener('pointerdown', onDown);
      stick.removeEventListener('pointermove', onMove);
      stick.removeEventListener('pointerup', onUp);
      stick.removeEventListener('pointercancel', onUp);
    };
  }, []);

  useEffect(() => {
    const wrap = canvasWrapRef.current;
    if (!wrap) return;

    let active = false;
    let lastX = 0;
    let lastY = 0;
    let pointerId: number | null = null;

    function onContextMenu(e: MouseEvent) {
      e.preventDefault();
    }

    function onPointerDown(e: PointerEvent) {
      if (e.pointerType === 'mouse' && e.button !== 1 && e.button !== 2) return;
      active = true;
      pointerId = e.pointerId;
      lastX = e.clientX;
      lastY = e.clientY;
      wrap!.setPointerCapture(e.pointerId);
      e.preventDefault();
    }

    function onPointerMove(e: PointerEvent) {
      if (!active || e.pointerId !== pointerId) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      applyCameraLook(cameraControlRef.current, dx, dy, false);
      e.preventDefault();
    }

    function onWheel(e: WheelEvent) {
      cameraControlRef.current.distanceOffset = clamp(
        cameraControlRef.current.distanceOffset + e.deltaY * 0.006,
        -2.2,
        4.8,
      );
      e.preventDefault();
    }

    function onPointerUp(e: PointerEvent) {
      if (e.pointerId !== pointerId) return;
      active = false;
      pointerId = null;
      if (wrap!.hasPointerCapture(e.pointerId)) wrap!.releasePointerCapture(e.pointerId);
      e.preventDefault();
    }

    wrap.addEventListener('contextmenu', onContextMenu);
    wrap.addEventListener('pointerdown', onPointerDown);
    wrap.addEventListener('pointermove', onPointerMove);
    wrap.addEventListener('pointerup', onPointerUp);
    wrap.addEventListener('pointercancel', onPointerUp);
    wrap.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      wrap.removeEventListener('contextmenu', onContextMenu);
      wrap.removeEventListener('pointerdown', onPointerDown);
      wrap.removeEventListener('pointermove', onPointerMove);
      wrap.removeEventListener('pointerup', onPointerUp);
      wrap.removeEventListener('pointercancel', onPointerUp);
      wrap.removeEventListener('wheel', onWheel);
    };
  }, []);

  const nearSpec = nearPortal ? (portals.find((p) => p.id === nearPortal) ?? null) : null;
  const openSpec = openWorldId ? (portals.find((p) => p.id === openWorldId) ?? null) : null;
  const arenaHudVisible = openWorldId === null;

  return (
    <div className="exp-overlay">
      <div className="exp-canvas-wrap" ref={canvasWrapRef}>
        <CanvasBoundary><Canvas
          shadows={quality.shadows}
          dpr={quality.dpr}
          camera={{ position: [0, 6, 12], fov: 50, near: 0.1, far: 120 }}
          gl={{ antialias: quality.antialias, powerPreference: 'high-performance', stencil: false }}
        >
          <ExpeditionScene
            input={inputRef}
            cameraControl={cameraControlRef}
            collected={collected}
            onCollect={handleCollect}
            onNearPortal={setNearPortal}
            onNearAira={setNearAira}
            unlocked={isUnlocked}
            frozen={dialog !== null || openWorldId !== null}
            airaHasOffer={offerable !== null}
            airaHasReady={readyToTurnIn}
          />
        </Canvas></CanvasBoundary>
      </div>

      {arenaHudVisible && (
        <>
          <div className="exp-hud-top">
            <div className="exp-hud-left">
            <span className="exp-badge">
              <img src="/assets/brand/bright-icon.png" alt="" className="exp-brand-mark" />⭐{' '}
              {summary.stars}/{starSpots.length} &bull; 📜 {summary.questsDone}/
              {summary.questsTotal}
            </span>
              <button
                className={'exp-camera-toggle' + (cameraLocked ? ' on' : '')}
                onClick={toggleCameraLock}
                type="button"
              >
                Kamera {cameraLocked ? 'Lock ON' : 'Lock OFF'} · Shift
              </button>
            </div>
            <button className="exp-close" onClick={onExit} aria-label="Keluar">
              ×
            </button>
          </div>

          <CrystalWallet crystals={state.crystals} />
          <QuestTracker active={activeQuest} />

          {toast && <div className="exp-toast">{toast}</div>}
          {reward && <RewardToast crystal={reward.crystal} amount={reward.amount} />}

          <div className="exp-stick" ref={stickRef}>
            <div className="exp-stick-knob" ref={knobRef} />
          </div>

          {nearAira ? (
            <button className="exp-action talk" onClick={handleTalkToAira}>
              {readyToTurnIn
                ? '✓ Laporkan hasil'
                : offerable
                  ? '💬 Bicara dengan Aira'
                  : '💬 Sapa Aira'}
            </button>
          ) : nearSpec ? (
            <button
              className={'exp-action' + (isUnlocked(nearSpec.id) ? '' : ' locked')}
              onClick={handleEnterPortal}
            >
              {isUnlocked(nearSpec.id)
                ? `Masuk ${nearSpec.short}`
                : `🔒 ${nearSpec.starsRequired} bintang`}
            </button>
          ) : (
            <div className={'exp-hint' + (cameraLocked ? ' locked' : '')}>
              {cameraLocked
                ? 'Kamera lock aktif: gerakkan mouse untuk melihat sekitar · Shift untuk lepas'
                : 'W A S D untuk berjalan · klik kanan geser kamera · Shift untuk lock kamera'}
            </div>
          )}

          {dialog && (
            <DialoguePanel
              lines={dialog.lines}
              quest={dialog.quest}
              mode={dialog.mode}
              onAccept={handleDialogAccept}
              onClose={() => setDialog(null)}
            />
          )}
        </>
      )}

      <WorldPortalHost
        worldId={openWorldId}
        worldName={openSpec?.name ?? 'dunia'}
        onClose={handleCloseWorld}
        onXpEarned={onXpEarned}
      />
    </div>
  );
}

export { CRYSTALS };
