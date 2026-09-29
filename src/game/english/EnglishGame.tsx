import CanvasBoundary from '../../components/CanvasBoundary';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Billboard, Html, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { BookOpen, ChevronRight, Lock, RotateCcw, Star, Volume2, X } from 'lucide-react';
import { islands } from './curriculum';
import {
  computeMastery,
  loadEvidence,
  recordIslandResult,
  saveEvidence,
  type EnglishEvidence,
} from './evidence';
import { isEnglishTtsAvailable, speakEnglish } from './englishTts';
import { HarborSky, SkyRays, SeaBubbles, WaterPlane } from './harborScene';
import { Confetti, usePunch } from '../juice';
import { sfx } from '../sound';

/**
 * EnglishGame.tsx — Patch 32. "Pelabuhan Kata" dengan ATMOSFER 3D
 * DITINGKATKAN + UI kids-friendly.
 *
 * ====================================================================
 * APA YANG BERUBAH DARI PATCH 31 (dan APA YANG TIDAK):
 * ====================================================================
 * TIDAK BERUBAH (dijaga agar tidak merusak yang sudah bekerja):
 *   - Seluruh logika puzzle: urutan klik huruf, deteksi benar/salah,
 *     huruf jebakan (decoy), penghitungan kesalahan & bintang.
 *   - Kontrak evidence.ts / levels.ts / props (onExit, onXpEarned).
 *   - Peta 12 pulau, progresi terkunci, peti harta karun.
 *
 * DITINGKATKAN (mengikuti prinsip dari repo Skills milik Meng To —
 * threejs-landscape / sky rays / sky background / falling leaves /
 * Retina 200%; lihat catatan kejujuran lengkap di harborScene.tsx):
 *   1. ATMOSFER 3D BERLAPIS: sky dome gradien 3 warna, berkas cahaya
 *      matahari (sky rays) yang bergerak, gelembung laut naik perlahan
 *      (adaptasi "falling leaves" ke tema pelabuhan), dan bidang air
 *      beriak di bawah kubus huruf. Semua PROSEDURAL (tanpa file
 *      gambar/HDR eksternal) — pelajaran dari insiden Patch 03 & 15.
 *   2. RETINA RENDERING: `dpr={[1, 2]}` (naik dari [1, 1.5]) agar teks
 *      & tepi kubus jauh lebih tajam di layar HiDPI/Retina.
 *   3. KUBUS LEBIH HIDUP: huruf yang sudah tersusun melayang naik
 *      sedikit + berputar lebih cepat sebagai perayaan mikro.
 *   4. KAMERA LEBIH SINEMATIK: auto-rotate sangat pelan saat pemain
 *      diam (idle), berhenti otomatis begitu pemain menyentuh/menggeser.
 * ====================================================================
 */

const STYLE_ID = 'brightoria-english-harbor-styles-v2';
const OLD_STYLE_ID = 'brightoria-english-harbor-styles-v1';

const HARBOR_CSS = `
.harbor-overlay { position: fixed; inset: 0; z-index: 75; background: linear-gradient(160deg,#0a2a3aee,#0f3d4aee); backdrop-filter: blur(10px); display: grid; place-items: center; padding: 16px; }
.harbor-shell { position: relative; width: min(780px,96vw); max-height: 92vh; overflow-y: auto; background: #fffaf3; border-radius: 26px; padding: 26px; box-shadow: 0 25px 80px #0007; display: flex; flex-direction: column; gap: 16px; border-top: 6px solid #2f8fc9; background-image: radial-gradient(circle at 100% 0%, #dcf0fa 0%, transparent 55%), radial-gradient(circle at 0% 100%, #fff3d6 0%, transparent 55%); }
.harbor-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
.harbor-head h2 { margin: 6px 0 0; color: #123a4d; }
.harbor-close-btn { border: 0; background: #e3f2fb; border-radius: 50%; width: 35px; height: 35px; display: grid; place-items: center; cursor: pointer; flex-shrink: 0; color: #2f8fc9; }
.harbor-ghost-small { border: 1px solid #b8ddf0; background: #fff; border-radius: 12px; padding: 8px 12px; font-size: 12px; display: inline-flex; align-items: center; gap: 6px; cursor: pointer; color: #1a5578; }
.harbor-mastery-bar { display: flex; flex-direction: column; gap: 6px; font-size: 12px; color: #3d6b80; margin-bottom: 10px; }
.harbor-mastery-track { height: 11px; background: #dcecf5; border-radius: 20px; overflow: hidden; }
.harbor-mastery-fill { display: block; height: 100%; background: linear-gradient(90deg,#2f8fc9,#f3c861); border-radius: 20px; }
.harbor-islands-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 10px; }
.harbor-island-card { border: 1px solid #b8ddf0; background: linear-gradient(160deg,#e3f2fb,#cfe8f7); border-radius: 16px; padding: 12px 8px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 4px; cursor: pointer; position: relative; transition: transform 0.15s ease; }
.harbor-island-card:not(.locked):hover { transform: translateY(-3px); }
.harbor-island-card.locked { background: #eceff0; border-color: #dfe4e2; color: #9aa3a0; opacity: 0.85; }
.harbor-island-number { position: absolute; top: 8px; left: 10px; font-size: 10px; font-weight: 900; color: #2f8fc9; }
.harbor-island-emoji { font-size: 30px; margin-top: 6px; }
.harbor-island-card b { font-size: 13px; color: #123a4d; letter-spacing: 0.04em; }
.harbor-island-stars { display: flex; gap: 2px; margin-top: 2px; }
.harbor-intro { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px; padding: 6px 4px; }
.harbor-intro-emoji { font-size: 72px; }
.harbor-intro-row { display: flex; align-items: center; gap: 8px; }
.harbor-intro-blanks { font-size: 28px; font-weight: 900; letter-spacing: 0.3em; color: #123a4d; }
.harbor-speak-btn { border: 1px solid #b8ddf0; background: #fff; color: #2f8fc9; border-radius: 999px; width: 38px; height: 38px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
.harbor-intro-meaning { font-size: 14px; color: #3d6b80; background: #e3f2fb; border-radius: 999px; padding: 6px 16px; }
.harbor-primary-btn { border: 0; background: linear-gradient(135deg,#2f8fc9,#6b3fa0); color: #fff; padding: 13px 18px; border-radius: 14px; font-weight: 900; display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; max-width: 280px; box-shadow: 0 9px 22px #2f8fc940; cursor: pointer; font-size: 14px; }
.harbor-puzzle-hud { display: flex; flex-direction: column; align-items: center; gap: 6px; margin-bottom: 8px; }
.harbor-puzzle-blanks { font-size: 32px; font-weight: 900; letter-spacing: 0.25em; color: #123a4d; }
.harbor-puzzle-blanks span.filled { color: #198576; }
.harbor-puzzle-blanks span.empty { color: #c6dceb; }
.harbor-puzzle-info { font-size: 12px; color: #3d6b80; }
.harbor-canvas-wrap { height: 340px; border-radius: 22px; overflow: hidden; background: linear-gradient(180deg,#a9def2,#fdf3da); position: relative; box-shadow: inset 0 2px 12px rgba(10,60,90,0.12); }
.harbor-letter-label {
  background: #fff; border: 3px solid #b8ddf0; border-radius: 16px; width: 56px; height: 56px;
  display: flex; align-items: center; justify-content: center; font-size: 26px; font-weight: 900;
  color: #123a4d; cursor: pointer; user-select: none; box-shadow: 0 6px 16px rgba(10,60,90,0.22); transition: transform 0.12s ease;
}
.harbor-letter-label:hover { transform: scale(1.1); }
.harbor-letter-label.assembled { background: #dff3ea; border-color: #198576; color: #14624f; cursor: default; opacity: 0.6; }
.harbor-letter-label.wrong-flash { background: #fbe6e2; border-color: #c0492f; animation: harbor-shake 0.3s ease; }
@keyframes harbor-shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
.harbor-ship-reward { position: absolute; top: 46%; left: -60px; font-size: 44px; animation: harbor-sail 2s ease-in-out forwards; }
@keyframes harbor-sail { 0% { left: -60px; opacity: 0; } 15% { opacity: 1; } 85% { opacity: 1; } 100% { left: 105%; opacity: 0; } }
.harbor-result { display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center; padding: 8px 0; }
.harbor-stars-big { display: flex; gap: 6px; }
.harbor-result-word { font-size: 26px; font-weight: 900; color: #123a4d; letter-spacing: 0.1em; }
.harbor-result-actions { display: flex; gap: 10px; width: 100%; }
.harbor-ghost-btn { flex: 1; border: 1px solid #b8ddf0; background: #fff; border-radius: 12px; padding: 11px 14px; display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 13px; cursor: pointer; color: #1a5578; }
.harbor-chest-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.harbor-chest-icon { font-size: 34px; }
.harbor-chest-note { font-size: 12px; color: #3d6b80; }
.harbor-collection-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 8px; max-height: 55vh; overflow-y: auto; }
.harbor-word-card { background: linear-gradient(160deg,#e3f2fb,#cfe8f7); border: 1px solid #b8ddf0; border-radius: 12px; padding: 10px 6px; text-align: center; min-height: 90px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; }
.harbor-word-card.locked { background: #eceff0; border-color: #dfe4e2; color: #9aa3a0; }
.harbor-word-emoji { font-size: 22px; }
.harbor-word-card b { font-size: 14px; color: #123a4d; }
.harbor-word-card span { font-size: 10px; color: #3d6b80; }
.harbor-run-card {
  margin-bottom: 12px; border: 0; width: 100%; text-align: left; cursor: pointer;
  border-radius: 20px; padding: 15px 16px; display: flex; align-items: center; gap: 14px;
  background: linear-gradient(135deg,#f7d98d,#6dc8ee 58%,#5a79d8);
  color: #123a4d; box-shadow: 0 12px 28px rgba(47,143,201,0.28);
}
.harbor-run-card-icon { width: 48px; height: 48px; border-radius: 16px; display: grid; place-items: center; background: rgba(255,255,255,0.82); font-size: 25px; flex-shrink: 0; }
.harbor-run-card b { display: block; font-size: 16px; color: #123a4d; }
.harbor-run-card span { display: block; font-size: 12px; color: #214e68; margin-top: 2px; line-height: 1.35; }
.harbor-runner { position: relative; height: min(520px, calc(100vh - 180px)); min-height: 390px; border-radius: 24px; overflow: hidden; background: url('/assets/english-run/runner-background.png') center center / cover no-repeat, linear-gradient(#65c8f1 0%, #bfeefe 42%, #6cc07d 43%, #31884e 100%); box-shadow: inset 0 2px 18px rgba(18,58,77,0.18); touch-action: none; }
.harbor-runner::before {
  content: ""; position: absolute; inset: 0;
  background: linear-gradient(180deg, rgba(255,255,255,0.04), rgba(15,82,65,0.16));
  pointer-events: none;
}
.harbor-run-stage { position: absolute; inset: 0; transform-origin: 0 0; }
.harbor-run-platform { position: absolute; height: 92px; background: url('/assets/english-run/stone-platform.png') center top / 100% 100% no-repeat; filter: drop-shadow(0 14px 12px rgba(0,0,0,0.24)); }
.harbor-run-word { position: absolute; border: 3px solid #fff3c0; background: linear-gradient(180deg,#ffffff,#fff2cc); color: #123a4d; border-radius: 16px; padding: 8px 12px; min-width: 84px; text-align: center; font-weight: 900; box-shadow: 0 8px 18px rgba(18,58,77,0.25); }
.harbor-run-word.good { background: linear-gradient(180deg,#e4fff2,#b6efd4); border-color: #3fbf7f; }
.harbor-run-word.bad { background: linear-gradient(180deg,#fff1ec,#ffd2c6); border-color: #d9684d; }
.harbor-run-player { position: absolute; width: 76px; height: 92px; transform: translate(-50%, -92%); background: url('/assets/english-run/runner-hero.png') center bottom / contain no-repeat; filter: drop-shadow(0 8px 8px rgba(0,0,0,0.24)); }
.harbor-run-sign { position: absolute; width: 106px; height: 118px; transform: translate(-50%, -100%); background: url('/assets/english-run/quiz-sign.png') center bottom / contain no-repeat; filter: drop-shadow(0 8px 10px rgba(0,0,0,0.25)); display: grid; place-items: center; padding-top: 16px; color: #6b3b18; font-weight: 900; font-size: 16px; }
.harbor-run-sign.done { opacity: 0.68; filter: grayscale(0.1) drop-shadow(0 8px 10px rgba(0,0,0,0.18)); }
.harbor-run-hud { position: absolute; z-index: 3; left: 14px; right: 14px; top: 12px; display: flex; justify-content: space-between; gap: 8px; pointer-events: none; }
.harbor-run-pill { background: rgba(255,255,255,0.92); border: 2px solid #b8ddf0; border-radius: 999px; padding: 7px 12px; font-size: 12px; font-weight: 900; color: #123a4d; box-shadow: 0 5px 14px rgba(18,58,77,0.2); }
.harbor-run-prompt { position: absolute; z-index: 3; left: 50%; top: 52px; transform: translateX(-50%); width: min(520px, calc(100% - 24px)); background: rgba(255,255,255,0.94); border-radius: 18px; padding: 10px 18px; text-align: center; color: #123a4d; font-weight: 900; box-shadow: 0 8px 20px rgba(18,58,77,0.2); }
.harbor-run-prompt span { display: block; font-size: 11px; color: #3d6b80; font-weight: 800; margin-top: 2px; }
.harbor-run-controls { position: absolute; z-index: 4; left: 15px; right: 15px; bottom: 14px; display: flex; justify-content: space-between; pointer-events: none; }
.harbor-run-pad { display: flex; gap: 10px; pointer-events: auto; }
.harbor-run-button { width: 56px; height: 56px; border: 0; border-radius: 50%; background: rgba(255,255,255,0.82); color: #2f8fc9; font-size: 24px; font-weight: 900; box-shadow: 0 8px 18px rgba(18,58,77,0.25); }
.harbor-run-button.jump { width: 70px; border-radius: 999px; }
.harbor-run-complete { position: absolute; z-index: 5; inset: 0; display: grid; place-items: center; background: rgba(18,58,77,0.32); backdrop-filter: blur(3px); }
.harbor-run-complete-card { width: min(360px, calc(100% - 34px)); background: #fffaf3; border-radius: 24px; padding: 22px; text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,0.28); }
.harbor-run-complete-card h3 { margin: 8px 0 4px; color: #123a4d; }
.harbor-run-complete-card p { margin: 0 0 14px; color: #3d6b80; font-size: 13px; }
.harbor-run-quiz { position: absolute; z-index: 6; inset: 0; display: grid; place-items: center; background: rgba(18,58,77,0.22); backdrop-filter: blur(2px); }
.harbor-run-quiz-board { width: min(520px, calc(100% - 28px)); min-height: 300px; background: url('/assets/english-run/quiz-sign.png') center center / 100% 100% no-repeat; padding: 58px 54px 46px; text-align: center; color: #4b2710; filter: drop-shadow(0 18px 30px rgba(0,0,0,0.32)); }
.harbor-run-quiz-board h3 { margin: 0 0 8px; font-size: 18px; line-height: 1.25; color: #4b2710; }
.harbor-run-quiz-board p { margin: 0 0 12px; font-size: 12px; font-weight: 900; color: #7a4a20; }
.harbor-run-options { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.harbor-run-option { border: 2px solid rgba(101,57,22,0.4); background: rgba(255,249,221,0.92); color: #4b2710; border-radius: 13px; padding: 10px 8px; font-weight: 900; font-family: inherit; cursor: pointer; box-shadow: 0 5px 0 rgba(101,57,22,0.18); }
.harbor-run-option.correct { background: #dff7d9; border-color: #3fbf7f; }
.harbor-run-option.wrong { background: #ffd6c8; border-color: #d9684d; }
@media (max-width: 700px) {
  .harbor-shell { padding: 18px; }
  .harbor-canvas-wrap { height: 280px; }
  .harbor-puzzle-blanks { font-size: 26px; }
  .harbor-runner { min-height: 360px; }
}
`;

function useInjectStyles() {
  useEffect(() => {
    document.getElementById(OLD_STYLE_ID)?.remove();
    if (document.getElementById(STYLE_ID)) return;
    const el = document.createElement('style');
    el.id = STYLE_ID;
    el.textContent = HARBOR_CSS;
    document.head.appendChild(el);
  }, []);
}

function useTtsAvailability() {
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    let cancelled = false;
    isEnglishTtsAvailable().then((ok) => {
      if (!cancelled) setAvailable(ok);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return available;
}

const DECOY_POOL = 'EOARSTNILUMDPBHCFGWYVKJXQZ'.split('');

function shuffleArr<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildLetterPool(word: string): { letter: string; cubeId: string; isDecoy: boolean }[] {
  const letters = word.split('').map((letter, i) => ({ letter, cubeId: `${word}-${i}`, isDecoy: false }));
  const decoyCount = word.length <= 3 ? 2 : 3;
  const usedLetters = new Set(word.split(''));
  const availableDecoys = DECOY_POOL.filter((l) => !usedLetters.has(l));
  const decoys = shuffleArr(availableDecoys)
    .slice(0, decoyCount)
    .map((letter, i) => ({ letter, cubeId: `decoy-${i}-${letter}`, isDecoy: true }));
  return shuffleArr([...letters, ...decoys]);
}

function isIslandUnlocked(index: number, evidence: EnglishEvidence): boolean {
  if (index === 0) return true;
  const prev = islands[index - 1];
  return !!evidence.islands[prev.id]?.completed;
}

interface CubePos {
  cubeId: string;
  letter: string;
  isDecoy: boolean;
  x: number;
  y: number;
  z: number;
  phase: number;
}

let sharedGlowTexture: THREE.CanvasTexture | null = null;
function getGlowTexture(): THREE.CanvasTexture {
  if (sharedGlowTexture) return sharedGlowTexture;
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,233,168,0.85)');
  g.addColorStop(0.5, 'rgba(255,214,120,0.3)');
  g.addColorStop(1, 'rgba(255,214,120,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  sharedGlowTexture = new THREE.CanvasTexture(canvas);
  sharedGlowTexture.needsUpdate = true;
  return sharedGlowTexture;
}

function LetterCube({
  cube,
  assembled,
  isWrong,
  onClick,
}: {
  cube: CubePos;
  assembled: boolean;
  isWrong: boolean;
  onClick: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const glowTexture = getGlowTexture();

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    // Patch 32: huruf yang sudah tersusun melayang naik sedikit dan
    // berputar lebih cepat sebagai perayaan mikro.
    const lift = assembled ? 0.45 : 0;
    groupRef.current.position.y = cube.y + lift + Math.sin(t * 0.9 + cube.phase) * 0.12;
    groupRef.current.rotation.y += assembled ? 0.012 : 0.003;
  });

  return (
    <group ref={groupRef} position={[cube.x, cube.y, cube.z]}>
      <Billboard>
        {assembled && (
          <mesh position={[0, 0, -0.02]} scale={2.4}>
            <planeGeometry args={[0.6, 0.6]} />
            <meshBasicMaterial
              map={glowTexture}
              transparent
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              fog={false}
            />
          </mesh>
        )}
        <mesh>
          <boxGeometry args={[0.62, 0.62, 0.62]} />
          <meshStandardMaterial
            color={assembled ? '#dff3ea' : isWrong ? '#fbe6e2' : '#ffffff'}
            roughness={0.38}
            metalness={0.12}
          />
        </mesh>
      </Billboard>
      <Html center distanceFactor={6.2} occlude={false} zIndexRange={[20, 0]}>
        <button
          className={'harbor-letter-label' + (assembled ? ' assembled' : '') + (isWrong ? ' wrong-flash' : '')}
          onClick={onClick}
          disabled={assembled}
        >
          {cube.letter}
        </button>
      </Html>
    </group>
  );
}

function PuzzleScene({
  cubes,
  assembledIds,
  wrongId,
  onCubeClick,
}: {
  cubes: CubePos[];
  assembledIds: Set<string>;
  wrongId: string | null;
  onCubeClick: (cube: CubePos) => void;
}) {
  return (
    <>
      <fog attach="fog" args={['#cfe8f7', 9, 17]} />
      <ambientLight intensity={1.75} />
      <directionalLight position={[3, 6, 5]} intensity={2} />
      <hemisphereLight args={['#dff8ff', '#f7d7a4', 0.95]} />

      {/* Patch 32: lapisan atmosfer baru — semua prosedural, tanpa file
          gambar eksternal (lihat harborScene.tsx untuk penjelasan). */}
      <HarborSky />
      <SkyRays />
      <WaterPlane />
      <SeaBubbles />

      {cubes.map((cube) => (
        <LetterCube
          key={cube.cubeId}
          cube={cube}
          assembled={assembledIds.has(cube.cubeId)}
          isWrong={wrongId === cube.cubeId}
          onClick={() => onCubeClick(cube)}
        />
      ))}

      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.1}
        rotateSpeed={0.5}
        autoRotate
        autoRotateSpeed={0.35}
        minDistance={5.5}
        maxDistance={8.5}
        minPolarAngle={Math.PI * 0.28}
        maxPolarAngle={Math.PI * 0.62}
      />
    </>
  );
}

const RUNNER_LEVEL = {
  width: 1380,
  height: 440,
  start: { x: 84, y: 318 },
  platforms: [
    { x: 0, y: 372, w: 260 },
    { x: 300, y: 330, w: 190 },
    { x: 545, y: 292, w: 190 },
    { x: 790, y: 334, w: 190 },
    { x: 1035, y: 292, w: 190 },
    { x: 1240, y: 350, w: 200 },
  ],
};

type RunnerQuestion = {
  id: string;
  prompt: string;
  helper: string;
  answer: string;
  options: string[];
  rewardWordId: string;
};

const RUNNER_QUIZ_BANK: RunnerQuestion[] = [
  { id: 'meaning-cat', prompt: 'Which word means "kucing"?', helper: 'Vocabulary', answer: 'CAT', options: ['CAT', 'SUN', 'BOOK'], rewardWordId: 'e1' },
  { id: 'meaning-sun', prompt: 'Which word means "matahari"?', helper: 'Vocabulary', answer: 'SUN', options: ['MOON', 'SUN', 'SHIP'], rewardWordId: 'e2' },
  { id: 'meaning-book', prompt: 'Which word means "buku"?', helper: 'Vocabulary', answer: 'BOOK', options: ['BIRD', 'BOOK', 'FISH'], rewardWordId: 'e6' },
  { id: 'animal-dog', prompt: 'Which one is an animal?', helper: 'Category', answer: 'DOG', options: ['DOG', 'KITE', 'MOON'], rewardWordId: 'e3' },
  { id: 'animal-fish', prompt: 'Choose a sea animal.', helper: 'Category', answer: 'FISH', options: ['TREE', 'FISH', 'STAR'], rewardWordId: 'e5' },
  { id: 'sky-moon', prompt: 'We can see it in the night sky.', helper: 'Reading clue', answer: 'MOON', options: ['MOON', 'DUCK', 'BOOK'], rewardWordId: 'e12' },
  { id: 'sentence-cat', prompt: 'Complete: I see a ___.', helper: 'Simple sentence', answer: 'CAT', options: ['CAT', 'BLUE', 'RUN'], rewardWordId: 'e1' },
  { id: 'sentence-ship', prompt: 'Complete: The ___ sails on water.', helper: 'Simple sentence', answer: 'SHIP', options: ['TREE', 'SHIP', 'BIRD'], rewardWordId: 'e4' },
  { id: 'color-blue', prompt: 'Which word is a color?', helper: 'Basic words', answer: 'BLUE', options: ['BLUE', 'DOG', 'KITE'], rewardWordId: 'e2' },
  { id: 'verb-run', prompt: 'Which word means "berlari"?', helper: 'Action word', answer: 'RUN', options: ['RUN', 'STAR', 'BOOK'], rewardWordId: 'e8' },
];

function EnglishRunner({
  words,
  onBack,
  onFinish,
}: {
  words: typeof islands;
  onBack: () => void;
  onFinish: (wordId: string, mistakes: number) => void;
}) {
  const unlockedIds = useMemo(() => new Set(words.map((word) => word.id)), [words]);
  const questions = useMemo(() => {
    const available = RUNNER_QUIZ_BANK.filter((question) => unlockedIds.has(question.rewardWordId));
    return shuffleArr(available.length ? available : RUNNER_QUIZ_BANK).slice(0, 4);
  }, [unlockedIds]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const target = questions[questionIndex] ?? RUNNER_QUIZ_BANK[0];
  const cards = useMemo(
    () =>
      shuffleArr(target.options).map((option, i) => ({
        id: `${target.id}-${option}`,
        text: option,
        correct: option === target.answer,
        platformIndex: Math.min(i + 1, RUNNER_LEVEL.platforms.length - 1),
        x: 350 + i * 250,
        y: RUNNER_LEVEL.platforms[Math.min(i + 1, RUNNER_LEVEL.platforms.length - 1)].y - 24,
      })),
    [target],
  );

  const keys = useRef({ left: false, right: false, jump: false });
  const hitLock = useRef(false);
  const body = useRef({ x: RUNNER_LEVEL.start.x, y: RUNNER_LEVEL.start.y, vx: 0, vy: 0, grounded: false });
  const [snap, setSnap] = useState(body.current);
  const [cameraX, setCameraX] = useState(0);
  const [answered, setAnswered] = useState<Set<string>>(new Set());
  const [mistakes, setMistakes] = useState(0);
  const [done, setDone] = useState(false);
  const [flashId, setFlashId] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [isGrounded, setIsGrounded] = useState(true);
  const [isJumping, setIsJumping] = useState(false);
  const [hasLeftGround, setHasLeftGround] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(false);
  const landingState = useRef({
    isGrounded: true,
    isJumping: false,
    hasLeftGround: false,
    hasAnswered: false,
  });

  function setLandingState(next: Partial<typeof landingState.current>) {
    const prev = landingState.current;
    landingState.current = { ...prev, ...next };
    if (next.isGrounded !== undefined && next.isGrounded !== prev.isGrounded) setIsGrounded(next.isGrounded);
    if (next.isJumping !== undefined && next.isJumping !== prev.isJumping) setIsJumping(next.isJumping);
    if (next.hasLeftGround !== undefined && next.hasLeftGround !== prev.hasLeftGround) setHasLeftGround(next.hasLeftGround);
    if (next.hasAnswered !== undefined && next.hasAnswered !== prev.hasAnswered) setHasAnswered(next.hasAnswered);
  }

  function resetAnswerState() {
    setLandingState({ hasAnswered: false, hasLeftGround: false, isJumping: false });
  }

  function processAnswer(card: (typeof cards)[number]) {
    if (landingState.current.hasAnswered) return;
    setLandingState({ hasAnswered: true });
    hitLock.current = true;
    setTimeout(() => {
      hitLock.current = false;
    }, 420);
    setFlashId(card.id);
    setTimeout(() => setFlashId(null), 320);
    const goNext = () => {
      if (questionIndex + 1 >= questions.length) {
        setDone(true);
      } else {
        setQuestionIndex((i) => i + 1);
        setAnswered(new Set());
        resetAnswerState();
        body.current.x = RUNNER_LEVEL.start.x;
        body.current.y = RUNNER_LEVEL.start.y;
        body.current.vx = 0;
        body.current.vy = 0;
        body.current.grounded = true;
      }
    };
    if (card.correct) {
      setAnswered((prev) => new Set(prev).add(card.id));
      setCorrectCount((count) => count + 1);
      setTimeout(goNext, 480);
    } else {
      setAnswered((prev) => new Set(prev).add(card.id));
      setMistakes((m) => m + 1);
      setTimeout(goNext, 650);
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const key = e.key.toLowerCase();
      if (key === 'arrowleft' || key === 'a') keys.current.left = e.type === 'keydown';
      if (key === 'arrowright' || key === 'd') keys.current.right = e.type === 'keydown';
      if (key === ' ' || key === 'arrowup' || key === 'w') {
        e.preventDefault();
        keys.current.jump = e.type === 'keydown';
      }
    }
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKey);
    };
  }, []);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      const p = body.current;
      const move = (keys.current.right ? 1 : 0) - (keys.current.left ? 1 : 0);
      p.vx = move * 265;
      if (keys.current.jump && p.grounded) {
        p.vy = -520;
        p.grounded = false;
        setLandingState({ isGrounded: false, isJumping: true, hasLeftGround: true });
      }
      p.vy += 1150 * dt;
      p.x = THREE.MathUtils.clamp(p.x + p.vx * dt, 30, RUNNER_LEVEL.width - 30);
      p.y += p.vy * dt;

      p.grounded = false;
      let landedThisFrame = false;
      for (let platformIndex = 0; platformIndex < RUNNER_LEVEL.platforms.length; platformIndex++) {
        const platform = RUNNER_LEVEL.platforms[platformIndex];
        const prevBottom = p.y - p.vy * dt;
        const footInset = 18;
        const withinX = p.x > platform.x + footInset && p.x < platform.x + platform.w - footInset;
        const fallingOntoTop = prevBottom <= platform.y && p.y >= platform.y && p.vy >= 0;
        if (withinX && fallingOntoTop) {
          p.y = platform.y;
          p.vy = 0;
          p.grounded = true;
          landedThisFrame = true;
          setLandingState({ isGrounded: true, isJumping: false });
          const answerCard = cards.find(
            (card) =>
              card.platformIndex === platformIndex &&
              Math.abs(p.x - card.x) <= Math.max(34, platform.w * 0.36),
          );
          if (
            answerCard &&
            !hitLock.current &&
            !answered.has(answerCard.id) &&
            landingState.current.hasLeftGround &&
            !landingState.current.hasAnswered
          ) {
            processAnswer(answerCard);
          }
          setLandingState({ hasLeftGround: false });
          break;
        }
      }
      if (!landedThisFrame) setLandingState({ isGrounded: false });
      if (p.y > RUNNER_LEVEL.height + 80) {
        p.x = RUNNER_LEVEL.start.x;
        p.y = RUNNER_LEVEL.start.y;
        p.vx = 0;
        p.vy = 0;
        p.grounded = false;
        resetAnswerState();
      }

      setSnap({ ...p });
      setCameraX(THREE.MathUtils.clamp(p.x - 260, 0, RUNNER_LEVEL.width - 720));
      if (!done) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [answered, cards, done, questionIndex, questions.length]);

  function press(name: 'left' | 'right' | 'jump', value: boolean) {
    keys.current[name] = value;
  }

  return (
    <div>
      <div className="harbor-runner">
        <div className="harbor-run-hud">
          <span className="harbor-run-pill">🏃 Word Harbor Run</span>
          <span className="harbor-run-pill">
            {correctCount}/{questions.length} benar
          </span>
          <span className="harbor-run-pill">
            {hasAnswered ? 'Terjawab' : isJumping || hasLeftGround ? 'Lompat' : isGrounded ? 'Mendarat' : 'Jatuh'}
          </span>
        </div>
        <div className="harbor-run-prompt">
          {target.prompt}
          <span>
            {target.helper} &bull; Salah: {mistakes}
          </span>
        </div>
        <div className="harbor-run-stage" style={{ transform: `translateX(${-cameraX}px)` }}>
          {RUNNER_LEVEL.platforms.map((p, i) => (
            <div
              key={i}
              className="harbor-run-platform"
              style={{ left: p.x, top: p.y, width: p.w }}
            />
          ))}
          {cards.map((card) => (
            <div
              key={card.id}
              className={
                'harbor-run-word' +
                (answered.has(card.id) ? ' good' : '') +
                (flashId === card.id && !card.correct ? ' bad' : '')
              }
              style={{ left: card.x - 46, top: card.y - 75 }}
            >
              {card.text}
            </div>
          ))}
          <div className="harbor-run-player" style={{ left: snap.x, top: snap.y }} />
        </div>
        <div className="harbor-run-controls">
          <div className="harbor-run-pad">
            <button
              className="harbor-run-button"
              onPointerDown={() => press('left', true)}
              onPointerUp={() => press('left', false)}
              onPointerLeave={() => press('left', false)}
            >
              ‹
            </button>
            <button
              className="harbor-run-button"
              onPointerDown={() => press('right', true)}
              onPointerUp={() => press('right', false)}
              onPointerLeave={() => press('right', false)}
            >
              ›
            </button>
          </div>
          <button
            className="harbor-run-button jump"
            onPointerDown={() => press('jump', true)}
            onPointerUp={() => press('jump', false)}
            onPointerLeave={() => press('jump', false)}
          >
            ↑
          </button>
        </div>
        {done && (
          <div className="harbor-run-complete">
            <div className="harbor-run-complete-card">
              <div className="harbor-intro-emoji">🏆</div>
              <h3>Quiz selesai!</h3>
              <p>{mistakes === 0 ? 'Perfect run!' : `${questions.length} pertanyaan selesai dengan ${mistakes} salah.`}</p>
              <button className="harbor-primary-btn" style={{ maxWidth: 'none' }} onClick={() => onFinish(target.rewardWordId, mistakes)}>
                Simpan hasil <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
      <button className="harbor-ghost-btn" style={{ marginTop: 12, width: '100%' }} onClick={onBack}>
        Kembali ke English Harbor
      </button>
    </div>
  );
}

type View = 'map' | 'intro' | 'puzzle' | 'result' | 'collection' | 'runner';

const RUNNER_QUIZ_LEVEL = {
  width: 2680,
  height: 440,
  start: { x: 84, y: 332 },
  platforms: [
    { x: 0, y: 372, w: 260 },
    { x: 300, y: 346, w: 190 },
    { x: 540, y: 302, w: 190 },
    { x: 780, y: 346, w: 190 },
    { x: 1020, y: 302, w: 190 },
    { x: 1260, y: 346, w: 190 },
    { x: 1500, y: 302, w: 190 },
    { x: 1740, y: 346, w: 190 },
    { x: 1980, y: 302, w: 190 },
    { x: 2220, y: 346, w: 190 },
    { x: 2460, y: 372, w: 220 },
  ],
};

function EnglishRunnerQuiz({
  onBack,
  onFinish,
}: {
  onBack: () => void;
  onFinish: (wordId: string, mistakes: number) => void;
}) {
  const questions = useMemo(() => shuffleArr(RUNNER_QUIZ_BANK).slice(0, 7), []);
  const stations = useMemo(
    () =>
      questions.map((question, i) => {
        const platformIndex = Math.min(2 + i, RUNNER_QUIZ_LEVEL.platforms.length - 1);
        const platform = RUNNER_QUIZ_LEVEL.platforms[platformIndex];
        return { question, x: platform.x + platform.w / 2, y: platform.y };
      }),
    [questions],
  );
  const keys = useRef({ left: false, right: false, jump: false });
  const body = useRef({ x: RUNNER_QUIZ_LEVEL.start.x, y: RUNNER_QUIZ_LEVEL.start.y, vx: 0, vy: 0, grounded: false });
  const [snap, setSnap] = useState(body.current);
  const [cameraX, setCameraX] = useState(0);
  const [answered, setAnswered] = useState<Record<string, 'correct' | 'wrong'>>({});
  const [activeStation, setActiveStation] = useState<number | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const key = e.key.toLowerCase();
      if (key === 'arrowleft' || key === 'a') keys.current.left = e.type === 'keydown';
      if (key === 'arrowright' || key === 'd') keys.current.right = e.type === 'keydown';
      if (key === ' ' || key === 'arrowup' || key === 'w') {
        e.preventDefault();
        keys.current.jump = e.type === 'keydown';
      }
    }
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKey);
    };
  }, []);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      const p = body.current;
      if (activeStation !== null) {
        const station = stations[activeStation];
        if (station) {
          p.x = station.x;
          p.y = station.y;
          p.vx = 0;
          p.vy = 0;
          p.grounded = true;
          keys.current.left = false;
          keys.current.right = false;
          keys.current.jump = false;
          setSnap({ ...p });
          setCameraX(THREE.MathUtils.clamp(p.x - 280, 0, RUNNER_QUIZ_LEVEL.width - 720));
        }
        if (!done) raf = requestAnimationFrame(tick);
        return;
      }

      const move = (keys.current.right ? 1 : 0) - (keys.current.left ? 1 : 0);
      p.vx = move * 270;
      if (keys.current.jump && p.grounded) {
        p.vy = -530;
        p.grounded = false;
        sfx.jump();
      }
      p.vy += 1160 * dt;
      p.x = THREE.MathUtils.clamp(p.x + p.vx * dt, 30, RUNNER_QUIZ_LEVEL.width - 30);
      p.y += p.vy * dt;

      p.grounded = false;
      for (const platform of RUNNER_QUIZ_LEVEL.platforms) {
        const prevBottom = p.y - p.vy * dt;
        const withinX = p.x > platform.x + 18 && p.x < platform.x + platform.w - 18;
        const landed = withinX && prevBottom <= platform.y && p.y >= platform.y && p.vy >= 0;
        if (landed) {
          p.y = platform.y;
          p.vy = 0;
          p.grounded = true;
          break;
        }
      }
      if (p.y > RUNNER_QUIZ_LEVEL.height + 100) {
        p.x = RUNNER_QUIZ_LEVEL.start.x;
        p.y = RUNNER_QUIZ_LEVEL.start.y;
        p.vx = 0;
        p.vy = 0;
      }

      if (activeStation === null && p.grounded) {
        const index = stations.findIndex(
          (station) => !answered[station.question.id] && Math.abs(p.x - station.x) < 62 && Math.abs(p.y - station.y) < 34,
        );
        if (index >= 0) {
          setActiveStation(index);
          setSelectedOption(null);
        }
      }

      setSnap({ ...p });
      setCameraX(THREE.MathUtils.clamp(p.x - 280, 0, RUNNER_QUIZ_LEVEL.width - 720));
      if (!done) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [activeStation, answered, done, stations]);

  function pointerPress(e: React.PointerEvent<HTMLButtonElement>, name: 'left' | 'right' | 'jump', value: boolean) {
    e.preventDefault();
    if (value && !e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.setPointerCapture(e.pointerId);
    if (!value && e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    keys.current[name] = value;
  }

  function answer(option: string) {
    if (activeStation === null || selectedOption !== null) return;
    const station = stations[activeStation];
    const question = station.question;
    const correct = option === question.answer;
    const p = body.current;
    p.x = station.x;
    p.y = station.y;
    p.vx = 0;
    p.vy = 0;
    p.grounded = true;
    setSnap({ ...p });
    setSelectedOption(option);
    setAnswered((prev) => ({ ...prev, [question.id]: correct ? 'correct' : 'wrong' }));
    if (correct) {
      sfx.correct();
      setCorrectCount((count) => count + 1);
    } else {
      sfx.wrong();
      setMistakes((count) => count + 1);
    }
    setTimeout(() => {
      keys.current.left = false;
      keys.current.right = false;
      keys.current.jump = false;
      setActiveStation(null);
      setSelectedOption(null);
      if (Object.keys(answered).length + 1 >= stations.length) setDone(true);
    }, 720);
  }

  const activeQuestion = activeStation === null ? null : stations[activeStation].question;

  return (
    <div>
      <div className="harbor-runner">
        <div className="harbor-run-hud">
          <span className="harbor-run-pill">Word Harbor Run</span>
          <span className="harbor-run-pill">{correctCount}/{stations.length} benar</span>
          <span className="harbor-run-pill">Salah: {mistakes}</span>
        </div>
        <div className="harbor-run-prompt">
          Lompat dan berhenti di papan quiz.
          <span>Jawab pilihan ganda di papan kayu. Tidak ada auto-answer saat lewat.</span>
        </div>
        <div className="harbor-run-stage" style={{ transform: `translateX(${-cameraX}px)` }}>
          {RUNNER_QUIZ_LEVEL.platforms.map((p, i) => (
            <div key={i} className="harbor-run-platform" style={{ left: p.x, top: p.y, width: p.w }} />
          ))}
          {stations.map((station, i) => (
            <div
              key={station.question.id}
              className={'harbor-run-sign' + (answered[station.question.id] ? ' done' : '')}
              style={{ left: station.x, top: station.y - 8 }}
            >
              {i + 1}
            </div>
          ))}
          <div className="harbor-run-player" style={{ left: snap.x, top: snap.y }} />
        </div>
        <div className="harbor-run-controls">
          <div className="harbor-run-pad">
            <button type="button" className="harbor-run-button" onPointerDown={(e) => pointerPress(e, 'left', true)} onPointerUp={(e) => pointerPress(e, 'left', false)} onPointerCancel={(e) => pointerPress(e, 'left', false)} onPointerLeave={(e) => pointerPress(e, 'left', false)}>‹</button>
            <button type="button" className="harbor-run-button" onPointerDown={(e) => pointerPress(e, 'right', true)} onPointerUp={(e) => pointerPress(e, 'right', false)} onPointerCancel={(e) => pointerPress(e, 'right', false)} onPointerLeave={(e) => pointerPress(e, 'right', false)}>›</button>
          </div>
          <button type="button" className="harbor-run-button jump" onPointerDown={(e) => pointerPress(e, 'jump', true)} onPointerUp={(e) => pointerPress(e, 'jump', false)} onPointerCancel={(e) => pointerPress(e, 'jump', false)} onPointerLeave={(e) => pointerPress(e, 'jump', false)}>↑</button>
        </div>
        {activeQuestion && (
          <div className="harbor-run-quiz">
            <div className="harbor-run-quiz-board">
              <h3>{activeQuestion.prompt}</h3>
              <p>{activeQuestion.helper}</p>
              <div className="harbor-run-options">
                {activeQuestion.options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={'harbor-run-option' + (selectedOption === option ? (option === activeQuestion.answer ? ' correct' : ' wrong') : '')}
                    onClick={() => answer(option)}
                    disabled={selectedOption !== null}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        {done && (
          <div className="harbor-run-complete">
            <div className="harbor-run-complete-card">
              <div className="harbor-intro-emoji">🏆</div>
              <h3>Quiz selesai!</h3>
              <p>{mistakes === 0 ? 'Perfect run!' : `${stations.length} papan quiz selesai dengan ${mistakes} salah.`}</p>
              <button className="harbor-primary-btn" style={{ maxWidth: 'none' }} onClick={() => onFinish(stations[0]?.question.rewardWordId ?? 'e1', mistakes)}>
                Simpan hasil <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
      <button className="harbor-ghost-btn" style={{ marginTop: 12, width: '100%' }} onClick={onBack}>
        Kembali ke English Harbor
      </button>
    </div>
  );
}

export default function EnglishGame({
  onExit,
  onXpEarned,
}: {
  onExit: () => void;
  onXpEarned: (amount: number) => void;
}) {
  useInjectStyles();
  const ttsAvailable = useTtsAvailability();

  const [view, setView] = useState<View>('map');
  const [evidence, setEvidence] = useState<EnglishEvidence>(() => loadEvidence());
  const [activeIslandId, setActiveIslandId] = useState<string | null>(null);

  const [cubes, setCubes] = useState<CubePos[]>([]);
  const [assembledIds, setAssembledIds] = useState<Set<string>>(new Set());
  const [nextLetterIndex, setNextLetterIndex] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [wrongId, setWrongId] = useState<string | null>(null);
  const [showShip, setShowShip] = useState(false);
  const [confettiTick, setConfettiTick] = useState(0);
  const [lastResult, setLastResult] = useState<{ stars: 0 | 1 | 2 | 3; mistakes: number } | null>(null);
  const feedbackPunch = usePunch(wrongId ?? 'idle');

  const overallMastery = useMemo(() => computeMastery(evidence, islands.length), [evidence]);

  const activeIsland = islands.find((w) => w.id === activeIslandId) ?? null;
  const activeProgress = activeIslandId ? evidence.islands[activeIslandId] : undefined;

  function openIntro(islandId: string) {
    setActiveIslandId(islandId);
    setView('intro');
  }

  function tryLocked() {
    // no-op umpan balik ringan
  }

  function startPuzzle(islandId: string) {
    const island = islands.find((w) => w.id === islandId);
    if (!island) return;
    const pool = buildLetterPool(island.word);
    const positioned: CubePos[] = pool.map((c, i) => {
      const angle = (i / pool.length) * Math.PI * 2;
      const radius = 1.9 + Math.random() * 0.8;
      return {
        cubeId: c.cubeId,
        letter: c.letter,
        isDecoy: c.isDecoy,
        x: Math.cos(angle) * radius,
        y: (Math.random() - 0.5) * 1.6,
        z: Math.sin(angle) * radius - 1,
        phase: Math.random() * Math.PI * 2,
      };
    });
    setCubes(positioned);
    setAssembledIds(new Set());
    setNextLetterIndex(0);
    setMistakes(0);
    setWrongId(null);
    setShowShip(false);
    setActiveIslandId(islandId);
    setView('puzzle');
  }

  function handleCubeClick(cube: CubePos) {
    if (!activeIsland) return;
    if (assembledIds.has(cube.cubeId)) return;
    const expectedLetter = activeIsland.word[nextLetterIndex];
    if (cube.letter === expectedLetter && !cube.isDecoy) {
      const nextAssembled = new Set(assembledIds);
      nextAssembled.add(cube.cubeId);
      setAssembledIds(nextAssembled);
      setNextLetterIndex((i) => i + 1);
      if (nextLetterIndex + 1 >= activeIsland.word.length) {
        finishPuzzle();
      }
    } else {
      setMistakes((m) => m + 1);
      setWrongId(cube.cubeId);
      setTimeout(() => setWrongId(null), 350);
    }
  }

  function finishPuzzle() {
    if (!activeIslandId) return;
    setShowShip(true);
    setConfettiTick((n) => n + 1);
    setTimeout(() => {
      const next = recordIslandResult(evidence, activeIslandId, mistakes, activeIslandId);
      setEvidence(next);
      saveEvidence(next);
      const stars = next.islands[activeIslandId].stars;
      setLastResult({ stars, mistakes });
      const xp = 10 + stars * 10;
      onXpEarned(xp);
      setView('result');
    }, 1700);
  }

  function backToMap() {
    setView('map');
    setActiveIslandId(null);
  }

  function startRunner() {
    const firstOpen = islands.find((island, i) => isIslandUnlocked(i, evidence)) ?? islands[0];
    setActiveIslandId(firstOpen.id);
    setView('runner');
  }

  function finishRunner(wordId: string, runnerMistakes: number) {
    const next = recordIslandResult(evidence, wordId, runnerMistakes, wordId);
    setEvidence(next);
    saveEvidence(next);
    const stars = next.islands[wordId].stars;
    onXpEarned(8 + stars * 8);
    setConfettiTick((n) => n + 1);
    setView('map');
  }

  function handleSpeak(text: string, e?: React.MouseEvent) {
    e?.stopPropagation();
    speakEnglish(text);
  }

  const blanksDisplay = activeIsland
    ? activeIsland.word
        .split('')
        .map((letter, i) => (i < nextLetterIndex ? letter : '_'))
        .join(' ')
    : '';

  return (
    <div className="harbor-overlay">
      <div className="harbor-shell">
        <Confetti trigger={confettiTick} />

        <header className="harbor-head">
          <div>
            <span className="chip">English Harbor</span>
            <h2>
              {view === 'map' && 'Pelabuhan Kata — 12 Pulau Petualangan'}
              {(view === 'intro' || view === 'puzzle' || view === 'result') && `Pulau ${activeIsland?.islandNumber}`}
              {view === 'runner' && 'Word Harbor Run'}
              {view === 'collection' && 'Peti Harta Karun'}
            </h2>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {(view === 'intro' || view === 'puzzle') && (
              <button className="harbor-ghost-small" onClick={backToMap}>
                Peta
              </button>
            )}
            {view === 'runner' && (
              <button className="harbor-ghost-small" onClick={backToMap}>
                Peta
              </button>
            )}
            {view === 'map' && (
              <button className="harbor-ghost-small" onClick={() => setView('collection')}>
                <BookOpen size={14} /> Peti ({evidence.collectedWords.length}/{islands.length})
              </button>
            )}
            {view === 'collection' && (
              <button className="harbor-ghost-small" onClick={backToMap}>
                Peta
              </button>
            )}
            <button className="harbor-close-btn" onClick={onExit}>
              <X size={16} />
            </button>
          </div>
        </header>

        {view === 'map' && (
          <div>
            <div className="harbor-mastery-bar">
              <div className="harbor-mastery-track">
                <span className="harbor-mastery-fill" style={{ width: `${overallMastery}%` }} />
              </div>
              <span>{overallMastery}% mastery &bull; berlayar dari Pulau 1, susun kata demi kata!</span>
            </div>
            <button className="harbor-run-card" onClick={startRunner}>
              <span className="harbor-run-card-icon">🏃</span>
              <span>
                <b>Word Harbor Run</b>
                <span>Lari, lompat, dan ambil kartu kata Inggris yang diminta.</span>
              </span>
              <ChevronRight size={20} />
            </button>
            <div className="harbor-islands-grid">
              {islands.map((island, i) => {
                const progress = evidence.islands[island.id];
                const unlocked = isIslandUnlocked(i, evidence);
                return (
                  <button
                    key={island.id}
                    className={'harbor-island-card' + (unlocked ? '' : ' locked')}
                    onClick={() => (unlocked ? openIntro(island.id) : tryLocked())}
                  >
                    <span className="harbor-island-number">{island.islandNumber}</span>
                    <span className="harbor-island-emoji">{unlocked ? island.emoji : <Lock size={18} />}</span>
                    <b>{unlocked ? island.word : '?????'}</b>
                    <span className="harbor-island-stars">
                      {[1, 2, 3].map((s) => (
                        <Star
                          key={s}
                          size={12}
                          fill={progress && progress.stars >= s ? '#f3c861' : 'none'}
                          color="#f3c861"
                        />
                      ))}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {view === 'intro' && activeIsland && (
          <div className="harbor-intro">
            <div className="harbor-intro-emoji">{activeIsland.emoji}</div>
            <div className="harbor-intro-row">
              <span className="harbor-intro-blanks">
                {activeIsland.word
                  .split('')
                  .map(() => '_')
                  .join(' ')}
              </span>
              {ttsAvailable && (
                <button className="harbor-speak-btn" onClick={(e) => handleSpeak(activeIsland.word, e)}>
                  <Volume2 size={16} />
                </button>
              )}
            </div>
            <span className="harbor-intro-meaning">{activeIsland.meaning}</span>
            <p style={{ fontSize: 13, color: '#3d6b80', maxWidth: 360 }}>
              Klik huruf-huruf yang mengambang di lautan 3D secara berurutan untuk menyusun kata Bahasa Inggrisnya!
              Hati-hati, ada huruf jebakan di antaranya.
            </p>
            {activeProgress && (
              <div className="harbor-stars-big">
                {[1, 2, 3].map((s) => (
                  <Star key={s} size={22} fill={activeProgress.stars >= s ? '#f3c861' : 'none'} color="#f3c861" />
                ))}
              </div>
            )}
            <button className="harbor-primary-btn" onClick={() => activeIslandId && startPuzzle(activeIslandId)}>
              {activeProgress ? 'Main lagi' : 'Mulai berlayar!'} <ChevronRight size={16} />
            </button>
          </div>
        )}

        {view === 'puzzle' && activeIsland && (
          <div>
            <div className="harbor-puzzle-hud">
              <div className="harbor-puzzle-blanks">
                {blanksDisplay.split('').map((ch, i) => (
                  <span key={i} className={ch === '_' ? 'empty' : 'filled'}>
                    {ch}
                  </span>
                ))}
              </div>
              <div className="harbor-puzzle-info">
                {mistakes} kesalahan &bull; geser untuk memutar lautan
              </div>
            </div>
            <div className={'harbor-canvas-wrap ' + feedbackPunch}>
              <CanvasBoundary><Canvas
                shadows={false}
                dpr={[1, 2]}
                camera={{ position: [0, 0.5, 7], fov: 48 }}
                gl={{ antialias: true, powerPreference: 'high-performance' }}
              >
                <PuzzleScene
                  cubes={cubes}
                  assembledIds={assembledIds}
                  wrongId={wrongId}
                  onCubeClick={handleCubeClick}
                />
              </Canvas></CanvasBoundary>
              {showShip && <div className="harbor-ship-reward">⛵</div>}
            </div>
          </div>
        )}

        {view === 'result' && lastResult && activeIsland && (
          <div className="harbor-result">
            <div className="harbor-stars-big">
              {[1, 2, 3].map((s) => (
                <Star key={s} size={32} fill={lastResult.stars >= s ? '#f3c861' : 'none'} color="#f3c861" />
              ))}
            </div>
            <div className="harbor-intro-emoji">{activeIsland.emoji}</div>
            <div className="harbor-result-word">{activeIsland.word}</div>
            <p style={{ fontSize: 13, color: '#3d6b80' }}>
              {lastResult.mistakes === 0
                ? 'Sempurna, tidak ada kesalahan sama sekali!'
                : `Selesai dengan ${lastResult.mistakes} kesalahan. Coba lagi untuk bintang penuh!`}
            </p>
            <div className="harbor-result-actions">
              <button className="harbor-ghost-btn" onClick={() => activeIslandId && startPuzzle(activeIslandId)}>
                <RotateCcw size={16} /> Main lagi
              </button>
              <button className="harbor-primary-btn" style={{ maxWidth: 'none' }} onClick={backToMap}>
                Kembali ke peta <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {view === 'runner' && (
          <EnglishRunnerQuiz
            onBack={backToMap}
            onFinish={finishRunner}
          />
        )}

        {view === 'collection' && (
          <div>
            <div className="harbor-chest-header">
              <span className="harbor-chest-icon">🧰</span>
              <p className="harbor-chest-note">Setiap kata yang berhasil kamu susun tersimpan di peti harta karun ini.</p>
            </div>
            <div className="harbor-collection-grid">
              {islands.map((w) => {
                const owned = evidence.collectedWords.includes(w.id);
                return (
                  <div key={w.id} className={'harbor-word-card' + (owned ? '' : ' locked')}>
                    {owned ? (
                      <>
                        <span className="harbor-word-emoji">{w.emoji}</span>
                        <b>{w.word}</b>
                        <span>{w.meaning}</span>
                      </>
                    ) : (
                      <Lock size={16} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
