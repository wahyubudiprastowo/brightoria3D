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
@media (max-width: 700px) {
  .harbor-shell { padding: 18px; }
  .harbor-canvas-wrap { height: 280px; }
  .harbor-puzzle-blanks { font-size: 26px; }
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

type View = 'map' | 'intro' | 'puzzle' | 'result' | 'collection';

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
              {view === 'collection' && 'Peti Harta Karun'}
            </h2>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {(view === 'intro' || view === 'puzzle') && (
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
