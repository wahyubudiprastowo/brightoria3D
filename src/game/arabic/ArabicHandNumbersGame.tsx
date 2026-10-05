import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Camera, ChevronRight, RotateCcw, Settings, Trophy, X } from 'lucide-react';
import { arabicSfx } from './arabicSfx';

declare global {
  interface Window {
    Hands?: new (config: { locateFile: (file: string) => string }) => MediaPipeHands;
  }
}

interface MediaPipeHands {
  setOptions: (options: Record<string, unknown>) => void;
  onResults: (callback: (results: HandsResults) => void) => void;
  send: (input: { image: HTMLVideoElement }) => Promise<void>;
  close?: () => void;
}

interface HandsResults {
  image?: CanvasImageSource;
  multiHandLandmarks?: Array<Array<{ x: number; y: number; z: number }>>;
}

interface NumberRow {
  id: number;
  number: string;
  word: string;
  meaning: string;
  color: string;
}

interface FloatingCard {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  wobble: number;
  matched: boolean;
  wrongPulse: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

interface TeacherSettings {
  timeLimit: number;
  pinchSensitivity: number;
  speed: number;
  correctScore: number;
  wrongPenalty: number;
  showSkeleton: boolean;
  showMalay: boolean;
  sfx: boolean;
}

interface LeaderboardEntry {
  name: string;
  score: number;
  accuracy: number;
  date: string;
}

const STYLE_ID = 'brightoria-arabic-hand-numbers-styles-v1';
const HANDS_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js';
const LEADERBOARD_KEY = 'brightoria.arabic.handNumbers.leaderboard.v1';

const NUMBERS: NumberRow[] = [
  { id: 1, number: '١', word: 'وَاحِدٌ', meaning: 'Satu', color: '#38BDF8' },
  { id: 2, number: '٢', word: 'اِثْنَانِ', meaning: 'Dua', color: '#34D399' },
  { id: 3, number: '٣', word: 'ثَلَاثَةٌ', meaning: 'Tiga', color: '#FBBF24' },
  { id: 4, number: '٤', word: 'أَرْبَعَةٌ', meaning: 'Empat', color: '#F472B6' },
  { id: 5, number: '٥', word: 'خَمْسَةٌ', meaning: 'Lima', color: '#A78BFA' },
  { id: 6, number: '٦', word: 'سِتَّةٌ', meaning: 'Enam', color: '#2DD4BF' },
  { id: 7, number: '٧', word: 'سَبْعَةٌ', meaning: 'Tujuh', color: '#4ADE80' },
  { id: 8, number: '٨', word: 'ثَمَانِيَةٌ', meaning: 'Lapan', color: '#FB923C' },
  { id: 9, number: '٩', word: 'تِسْعَةٌ', meaning: 'Sembilan', color: '#818CF8' },
  { id: 10, number: '١٠', word: 'عَشَرَةٌ', meaning: 'Sepuluh', color: '#F87171' },
];

const DEFAULT_SETTINGS: TeacherSettings = {
  timeLimit: 90,
  pinchSensitivity: 55,
  speed: 1.15,
  correctScore: 10,
  wrongPenalty: 3,
  showSkeleton: true,
  showMalay: true,
  sfx: true,
};

const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [0, 9], [9, 10], [10, 11], [11, 12],
  [0, 13], [13, 14], [14, 15], [15, 16],
  [0, 17], [17, 18], [18, 19], [19, 20],
  [5, 9], [9, 13], [13, 17],
] as const;

const HAND_FONT_LINK_ID = 'brightoria-arabic-hand-font';

const HAND_CSS = `
.hand-arabic-game { position: fixed; inset: 0; z-index: 220; width: 100vw; height: 100vh; overflow: hidden; border-radius: 0; background: #07111f; border: 0; color: #f8fafc; }
.hand-arabic-video { display: none; }
.hand-arabic-canvas { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.hand-arabic-game::after { content: ''; position: absolute; inset: 0; pointer-events: none; background:
  radial-gradient(circle at 50% 48%, transparent 0 46%, rgba(8,12,22,.12) 76%, rgba(8,12,22,.2) 100%),
  linear-gradient(180deg, rgba(6,11,22,.16), rgba(6,11,22,.08)); }
.hand-arabic-ui { position: absolute; inset: 0; z-index: 2; pointer-events: none; }
.hand-arabic-topbar { position: absolute; top: 20px; left: 28px; right: 28px; display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; pointer-events: auto; }
.hand-pill { display: inline-flex; align-items: center; gap: 7px; border: 1px solid rgba(255,255,255,.24); background: rgba(13,20,36,.76); color: #fef3c7; padding: 8px 11px; border-radius: 999px; font: 800 12px Outfit, Cairo, sans-serif; backdrop-filter: blur(12px); box-shadow: 0 8px 22px #0005; }
.hand-actions { display: flex; gap: 8px; align-items: center; pointer-events: auto; }
.hand-icon-btn { border: 1px solid rgba(255,255,255,.24); background: rgba(13,20,36,.78); color: #fef3c7; width: 39px; height: 39px; border-radius: 999px; display: grid; place-items: center; cursor: pointer; backdrop-filter: blur(10px); }
.hand-target-grid { position: absolute; top: 116px; left: 16%; right: 16%; display: grid; grid-template-columns: repeat(10, minmax(70px, 1fr)); gap: 10px; pointer-events: auto; }
.hand-target { min-height: 88px; border-radius: 16px; border: 1px solid rgba(255,255,255,.24); background: rgba(13,20,36,.82); box-shadow: inset 0 0 0 1px rgba(255,255,255,.06), 0 12px 28px #0006; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #fef3c7; transition: transform .15s, background .15s, border .15s; }
.hand-target-number { font: 900 30px Amiri, serif; line-height: 1; }
.hand-target-word { font: 800 16px Amiri, serif; direction: rtl; line-height: 1.2; color: white; }
.hand-target-meaning { font: 800 10px Cairo, sans-serif; color: #dbeafe; }
.hand-target.matched { background: rgba(5,150,105,.9); border-color: rgba(167,243,208,.82); color: white; transform: translateY(-2px); }
.hand-target.shake { animation: hand-shake .34s ease; background: rgba(190,18,60,.86); }
@keyframes hand-shake { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-7px); } 40% { transform: translateX(7px); } 60% { transform: translateX(-5px); } 80% { transform: translateX(5px); } }
.hand-card-layer { position: absolute; inset: 0; pointer-events: none; }
.hand-card { position: absolute; width: 142px; min-height: 82px; transform: translate(-50%, -50%); border: 1px solid rgba(255,255,255,.28); border-radius: 22px; color: #fff; display: grid; place-items: center; padding: 10px; touch-action: none; cursor: grab; background: rgba(13,20,36,.82); box-shadow: 0 16px 32px #0007, inset 0 0 0 1px rgba(255,255,255,.08); backdrop-filter: blur(12px); }
.hand-card { pointer-events: auto; }
.hand-card:active { cursor: grabbing; }
.hand-card.held { box-shadow: 0 0 0 3px rgba(245,158,11,.56), 0 0 32px rgba(245,158,11,.6), 0 18px 34px #0008; z-index: 7; }
.hand-card.wrong { animation: hand-card-wrong .42s ease; }
@keyframes hand-card-wrong { 0%,100% { transform: translate(-50%, -50%) rotate(0); } 30% { transform: translate(-50%, -50%) rotate(-6deg); } 65% { transform: translate(-50%, -50%) rotate(7deg); } }
.hand-card-word { font: 900 25px Amiri, serif; direction: rtl; text-shadow: 0 3px 10px #0008; }
.hand-card-meaning { margin-top: 2px; font: 800 11px Cairo, sans-serif; color: #dbeafe; }
.hand-reticle { position: absolute; width: 58px; height: 58px; border-radius: 999px; transform: translate(-50%, -50%); border: 3px solid #06b6d4; box-shadow: 0 0 28px #06b6d4aa; display: grid; place-items: center; pointer-events: none; transition: width .12s, height .12s, border-color .12s; }
.hand-reticle.pinching { width: 42px; height: 42px; border-color: #f59e0b; box-shadow: 0 0 30px #f59e0bcc; animation: hand-pulse .8s ease-in-out infinite; }
@keyframes hand-pulse { 50% { transform: translate(-50%, -50%) scale(1.12); } }
.hand-tether { position: absolute; height: 0; border-top: 2px dashed #f59e0b; transform-origin: left center; filter: drop-shadow(0 0 8px #f59e0b); pointer-events: none; }
.hand-status { position: absolute; left: 50%; bottom: 16px; transform: translateX(-50%); min-width: min(520px, calc(100% - 28px)); text-align: center; border: 1px solid rgba(255,255,255,.24); border-radius: 999px; background: rgba(13,20,36,.82); color: #fef3c7; padding: 10px 14px; font: 900 12px Cairo, sans-serif; pointer-events: none; backdrop-filter: blur(10px); }
.hand-toast-wrap { position: absolute; z-index: 9; top: 24px; left: 50%; transform: translateX(-50%); display: flex; flex-direction: column; gap: 8px; pointer-events: none; }
.hand-toast { border-radius: 999px; padding: 9px 14px; background: rgba(13,20,36,.9); border: 1px solid rgba(255,255,255,.22); color: #fff7ed; font: 800 12px Cairo, sans-serif; box-shadow: 0 10px 26px #0006; }
.hand-particle { position: absolute; width: 8px; height: 8px; border-radius: 999px; pointer-events: none; box-shadow: 0 0 14px currentColor; }
.hand-modal { position: absolute; inset: 0; z-index: 10; display: grid; place-items: center; padding: 20px; background: rgba(4,10,22,.58); backdrop-filter: blur(8px); pointer-events: auto; }
.hand-modal-card { width: min(620px, 100%); max-height: 92%; overflow-y: auto; border: 1px solid rgba(255,255,255,.25); border-radius: 26px; background: rgba(13,20,36,.92); box-shadow: 0 24px 80px #000a; padding: 24px; color: #f8fafc; }
.hand-modal-card h3 { margin: 0 0 8px; font: 900 26px Cairo, sans-serif; color: #fef3c7; }
.hand-modal-card p { color: #dbeafe; line-height: 1.55; font-size: 14px; }
.hand-guide { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 16px 0; }
.hand-guide-card { border: 1px solid rgba(255,255,255,.18); border-radius: 18px; padding: 12px; background: rgba(255,255,255,.08); text-align: center; }
.hand-guide-card b { display: block; color: #fde68a; margin-bottom: 4px; }
.hand-primary, .hand-secondary { border: 0; border-radius: 16px; padding: 13px 16px; cursor: pointer; font: 900 14px Cairo, sans-serif; display: inline-flex; justify-content: center; align-items: center; gap: 8px; }
.hand-primary { background: linear-gradient(135deg, #f59e0b, #06b6d4); color: #07111f; box-shadow: 0 12px 28px #06b6d450; }
.hand-secondary { background: rgba(255,255,255,.1); color: #fff7ed; border: 1px solid rgba(255,255,255,.22); }
.hand-modal-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 14px; }
.hand-settings-grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 12px; }
.hand-setting { border-radius: 16px; padding: 12px; background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.16); }
.hand-setting label { display: flex; justify-content: space-between; gap: 8px; font: 800 12px Cairo, sans-serif; color: #fde68a; }
.hand-setting input[type="range"] { width: 100%; }
.hand-toggle { display: flex; align-items: center; gap: 8px; margin-top: 8px; font: 800 13px Cairo, sans-serif; color: #e0f2fe; }
.hand-result-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin: 14px 0; }
.hand-result-stat { border-radius: 16px; background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.16); padding: 12px; }
.hand-result-stat b { display: block; font: 900 24px Outfit, sans-serif; color: #fde68a; }
.hand-name-row { display: flex; gap: 8px; margin-top: 10px; }
.hand-name-row input { flex: 1; border: 1px solid rgba(255,255,255,.24); background: rgba(255,255,255,.1); color: white; border-radius: 14px; padding: 11px 12px; }
.hand-leader-list { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; }
.hand-leader-row { display: grid; grid-template-columns: 32px 1fr auto; gap: 10px; align-items: center; border-radius: 14px; background: rgba(255,255,255,.08); padding: 10px; font: 800 13px Cairo, sans-serif; }
@media (max-width: 840px) {
  .hand-arabic-topbar { top: 10px; left: 10px; right: 10px; }
  .hand-target-grid { grid-template-columns: repeat(5, 1fr); top: 82px; left: 10px; right: 10px; }
  .hand-target { min-height: 72px; }
  .hand-target-number { font-size: 24px; }
  .hand-card { width: 124px; min-height: 74px; }
  .hand-guide, .hand-settings-grid, .hand-result-grid { grid-template-columns: 1fr; }
}
`;

function loadScript(src: string, id: string): Promise<void> {
  if (document.getElementById(id)) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Gagal memuat ${src}`));
    document.head.appendChild(script);
  });
}

function useHandStyles() {
  useEffect(() => {
    if (!document.getElementById(HAND_FONT_LINK_ID)) {
      const link = document.createElement('link');
      link.id = HAND_FONT_LINK_ID;
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cairo:wght@500;700;900&family=Outfit:wght@700;900&display=swap';
      document.head.appendChild(link);
    }
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = HAND_CSS;
    document.head.appendChild(style);
  }, []);
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function toLocalPoint(wrapper: HTMLElement | null, clientX: number, clientY: number) {
  const rect = wrapper?.getBoundingClientRect();
  if (!rect) return { x: clientX, y: clientY };
  return { x: clientX - rect.left, y: clientY - rect.top };
}

function readLeaderboard(): LeaderboardEntry[] {
  try {
    return JSON.parse(localStorage.getItem(LEADERBOARD_KEY) ?? '[]') as LeaderboardEntry[];
  } catch {
    return [];
  }
}

function saveLeaderboard(rows: LeaderboardEntry[]) {
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(rows.slice(0, 10)));
}

function useSynthSfx(enabled: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);
  const play = useCallback((type: 'win' | 'wrong' | 'grab' | 'drop') => {
    if (!enabled) return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = ctxRef.current ?? new AudioCtx();
    ctxRef.current = ctx;
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + (type === 'win' ? 0.55 : 0.2));
    const notes = type === 'win' ? [523, 659, 784, 1046] : type === 'wrong' ? [180, 135] : type === 'grab' ? [440] : [330];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = type === 'wrong' ? 'sawtooth' : 'sine';
      osc.frequency.value = freq;
      osc.connect(gain);
      const start = now + i * 0.075;
      osc.start(start);
      osc.stop(start + 0.12);
    });
  }, [enabled]);
  return play;
}

function initialCards(width: number, height: number): FloatingCard[] {
  return NUMBERS.map((row, i) => ({
    id: row.id,
    x: rand(90, Math.max(120, width - 90)),
    y: rand(Math.min(320, height * 0.45), Math.max(360, height - 90)),
    vx: rand(-0.7, 0.7) || 0.35,
    vy: rand(-0.45, 0.45) || -0.28,
    wobble: i * 0.75,
    matched: false,
    wrongPulse: 0,
  }));
}

export default function ArabicHandNumbersGame({
  onBack,
  onXpEarned,
  onConfetti,
}: {
  onBack: () => void;
  onXpEarned: (amount: number) => void;
  onConfetti: () => void;
}) {
  useHandStyles();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cardsRef = useRef<FloatingCard[]>([]);
  const targetRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const cardRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const handsRef = useRef<MediaPipeHands | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const cameraFrameRef = useRef(0);
  const rafRef = useRef(0);
  const lastRef = useRef(performance.now());
  const heldIdRef = useRef<number | null>(null);
  const pointerActiveRef = useRef(false);
  const dragStartRef = useRef(0);
  const dragTimesRef = useRef<number[]>([]);
  const lastPinchRef = useRef(false);
  const [phase, setPhase] = useState<'start' | 'playing' | 'settings' | 'leaderboard' | 'result'>('start');
  const [settings, setSettings] = useState<TeacherSettings>(DEFAULT_SETTINGS);
  const [cards, setCards] = useState<FloatingCard[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [toast, setToast] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_SETTINGS.timeLimit);
  const [score, setScore] = useState(0);
  const [matchedCount, setMatchedCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [cameraStatus, setCameraStatus] = useState('Kamera siap dinyalakan');
  const [hand, setHand] = useState({ x: 0, y: 0, pinching: false, visible: false });
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => readLeaderboard());
  const [studentName, setStudentName] = useState('');
  const playSfx = useSynthSfx(settings.sfx);

  const heldCard = cards.find((card) => card.id === heldIdRef.current);
  const accuracy = useMemo(() => {
    const attempts = matchedCount + wrongCount;
    return attempts === 0 ? 100 : Math.round((matchedCount / attempts) * 100);
  }, [matchedCount, wrongCount]);

  const pushToast = useCallback((message: string) => {
    setToast((items) => [...items.slice(-2), message]);
    window.setTimeout(() => setToast((items) => items.slice(1)), 2200);
  }, []);

  const stopCamera = useCallback(() => {
    if (cameraFrameRef.current) window.cancelAnimationFrame(cameraFrameRef.current);
    cameraFrameRef.current = 0;
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    cameraStreamRef.current = null;
    handsRef.current?.close?.();
    handsRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setHand((value) => ({ ...value, visible: false, pinching: false }));
  }, []);

  const burst = useCallback((x: number, y: number, color: string) => {
    const colors = ['#38BDF8', '#34D399', '#FBBF24', '#F472B6', '#A78BFA', '#FB923C', color];
    setParticles((items) => [
      ...items,
      ...Array.from({ length: 45 }, (_, i) => ({
        id: Date.now() + i,
        x,
        y,
        vx: rand(-3.8, 3.8),
        vy: rand(-4.2, 2.4),
        life: rand(38, 68),
        color: colors[i % colors.length],
      })),
    ]);
  }, []);

  const dropHeld = useCallback((x: number, y: number) => {
    const heldId = heldIdRef.current;
    if (!heldId) return;
    const rect = wrapperRef.current?.getBoundingClientRect();
    const isLocalPoint = !!rect && x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;
    const clientX = rect && isLocalPoint ? x + rect.left : x;
    const clientY = rect && isLocalPoint ? y + rect.top : y;
    const localX = rect && !isLocalPoint ? x - rect.left : x;
    const localY = rect && !isLocalPoint ? y - rect.top : y;
    heldIdRef.current = null;
    playSfx('drop');
    dragTimesRef.current.push((performance.now() - dragStartRef.current) / 1000);
    const droppedOn = NUMBERS.find((row) => {
      const rect = targetRefs.current[row.id]?.getBoundingClientRect();
      if (!rect) return false;
      return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
    });

    if (droppedOn?.id === heldId) {
      const row = NUMBERS.find((item) => item.id === heldId)!;
      cardsRef.current = cardsRef.current.map((card) => (card.id === heldId ? { ...card, matched: true } : card));
      setCards([...cardsRef.current]);
      setMatchedCount((count) => count + 1);
      setScore((value) => value + settings.correctScore);
      playSfx('win');
      arabicSfx.correct();
      burst(localX, localY, row.color);
      onConfetti();
      pushToast(`Benar! ${row.number} adalah ${row.word}`);
      return;
    }

    if (droppedOn) {
      targetRefs.current[droppedOn.id]?.classList.remove('shake');
      window.setTimeout(() => targetRefs.current[droppedOn.id]?.classList.add('shake'), 0);
      setWrongCount((count) => count + 1);
      setScore((value) => Math.max(0, value - settings.wrongPenalty));
      playSfx('wrong');
      arabicSfx.wrong();
      pushToast('Belum cocok. Coba baca lagi kartu Arabnya.');
      cardsRef.current = cardsRef.current.map((card) =>
        card.id === heldId ? { ...card, vx: rand(-1.8, 1.8), vy: rand(0.8, 1.8), wrongPulse: 18 } : card,
      );
      setCards([...cardsRef.current]);
    }
  }, [burst, onConfetti, playSfx, pushToast, settings.correctScore, settings.wrongPenalty]);

  const pickNearestCard = useCallback((x: number, y: number) => {
    if (heldIdRef.current) return;
    let best: { id: number; distance: number } | null = null;
    for (const card of cardsRef.current) {
      if (card.matched) continue;
      const distance = Math.hypot(card.x - x, card.y - y);
      if (distance < 86 && (!best || distance < best.distance)) best = { id: card.id, distance };
    }
    if (!best) return;
    heldIdRef.current = best.id;
    dragStartRef.current = performance.now();
    playSfx('grab');
  }, [playSfx]);

  const moveHeld = useCallback((x: number, y: number) => {
    const heldId = heldIdRef.current;
    if (!heldId) return;
    cardsRef.current = cardsRef.current.map((card) =>
      card.id === heldId ? { ...card, x, y, vx: 0, vy: 0 } : card,
    );
    setCards([...cardsRef.current]);
  }, []);

  const drawCamera = useCallback((results?: HandsResults) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;
    const rect = wrapper.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);
    if (video && video.readyState >= 2) {
      ctx.save();
      ctx.translate(rect.width, 0);
      ctx.scale(-1, 1);
      ctx.filter = 'brightness(1.15) contrast(1.05)';
      ctx.drawImage(video, 0, 0, rect.width, rect.height);
      ctx.restore();
      ctx.filter = 'none';
    } else {
      const grad = ctx.createLinearGradient(0, 0, rect.width, rect.height);
      grad.addColorStop(0, '#083344');
      grad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, rect.width, rect.height);
    }

    const landmarks = results?.multiHandLandmarks?.[0];
    if (!landmarks) {
      if (!pointerActiveRef.current) setHand((prev) => ({ ...prev, visible: false, pinching: false }));
      return;
    }
    const thumb = landmarks[4];
    const index = landmarks[8];
    const wrist = landmarks[0];
    const x = (1 - index.x) * rect.width;
    const y = index.y * rect.height;
    const pinchDistance = Math.hypot((thumb.x - index.x) * rect.width, (thumb.y - index.y) * rect.height);
    const fingerTips = [4, 8, 12, 16, 20];
    const avgWristDistance = fingerTips.reduce((sum, i) => {
      const pt = landmarks[i];
      return sum + Math.hypot((pt.x - wrist.x) * rect.width, (pt.y - wrist.y) * rect.height);
    }, 0) / fingerTips.length;
    const pinching = pinchDistance < settings.pinchSensitivity || avgWristDistance < settings.pinchSensitivity * 2.2;
    setHand({ x, y, pinching, visible: true });
    if (pinching) {
      if (!lastPinchRef.current) pickNearestCard(x, y);
      moveHeld(x, y);
    } else if (lastPinchRef.current) {
      dropHeld(x, y);
    }
    lastPinchRef.current = pinching;

    if (settings.showSkeleton) {
      const color = pinching ? '#F59E0B' : '#06B6D4';
      ctx.lineWidth = 3;
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      HAND_CONNECTIONS.forEach(([a, b]) => {
        const p1 = landmarks[a];
        const p2 = landmarks[b];
        ctx.beginPath();
        ctx.moveTo((1 - p1.x) * rect.width, p1.y * rect.height);
        ctx.lineTo((1 - p2.x) * rect.width, p2.y * rect.height);
        ctx.stroke();
      });
      landmarks.forEach((pt) => {
        ctx.beginPath();
        ctx.arc((1 - pt.x) * rect.width, pt.y * rect.height, 4.5, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }, [dropHeld, moveHeld, pickNearestCard, settings.pinchSensitivity, settings.showSkeleton]);

  const startCamera = useCallback(async () => {
    try {
      stopCamera();
      setCameraStatus('Memuat AI Vision...');
      await loadScript(HANDS_URL, 'mediapipe-hands-script');
      if (!window.Hands || !videoRef.current) throw new Error('MediaPipe belum siap');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 960 },
          height: { ideal: 540 },
          facingMode: 'user',
        },
        audio: false,
      });
      const hands = new window.Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });
      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.62,
        minTrackingConfidence: 0.55,
      });
      hands.onResults((results) => drawCamera(results));
      handsRef.current = hands;
      cameraStreamRef.current = stream;
      videoRef.current.srcObject = stream;
      videoRef.current.muted = true;
      videoRef.current.playsInline = true;
      await videoRef.current.play();
      const tick = async () => {
        if (!videoRef.current || !handsRef.current) return;
        try {
          if (videoRef.current.readyState >= 2) await handsRef.current.send({ image: videoRef.current });
        } finally {
          cameraFrameRef.current = window.requestAnimationFrame(tick);
        }
      };
      cameraFrameRef.current = window.requestAnimationFrame(tick);
      setCameraStatus('AI kamera aktif');
      pushToast('Kamera aktif. Cubit untuk ambil kartu.');
    } catch (error) {
      stopCamera();
      const denied =
        error instanceof DOMException && (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError');
      setCameraStatus('Aktifkan izin kamera di browser');
      pushToast(denied ? 'Klik ikon kamera di address bar, pilih Allow, lalu tekan tombol kamera.' : 'Kamera belum aktif. Tekan tombol kamera untuk mencoba lagi.');
    }
  }, [drawCamera, pushToast, stopCamera]);

  const startGame = useCallback(() => {
    const wrapper = wrapperRef.current;
    const rect = wrapper?.getBoundingClientRect();
    const nextCards = initialCards(rect?.width ?? 900, rect?.height ?? 620);
    cardsRef.current = nextCards;
    heldIdRef.current = null;
    dragTimesRef.current = [];
    lastPinchRef.current = false;
    setCards(nextCards);
    setParticles([]);
    setScore(0);
    setWrongCount(0);
    setMatchedCount(0);
    setTimeLeft(settings.timeLimit);
    setCameraStatus('Memuat AI Vision...');
    setPhase('playing');
    arabicSfx.click();
    void startCamera();
  }, [settings.timeLimit, startCamera]);

  useEffect(() => {
    if (phase !== 'playing') return;
    const timer = window.setInterval(() => {
      setTimeLeft((value) => {
        if (value <= 1) {
          setPhase('result');
          onXpEarned(Math.max(5, Math.round(score / 2)));
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [onXpEarned, phase, score]);

  useEffect(() => {
    if (phase !== 'playing') return;
    function tick(now: number) {
      const wrapper = wrapperRef.current;
      const rect = wrapper?.getBoundingClientRect();
      const dt = Math.min(32, now - lastRef.current) / 16.67;
      lastRef.current = now;
      if (rect) {
        const topLimit = rect.height < 760 ? 250 : 168;
        const width = rect.width;
        const height = rect.height;
        const next = cardsRef.current.map((card) => {
          if (card.matched) return card;
          if (card.id === heldIdRef.current) return { ...card, wobble: card.wobble + 0.06, wrongPulse: Math.max(0, card.wrongPulse - 1) };
          let x = card.x + card.vx * settings.speed * dt;
          let y = card.y + card.vy * settings.speed * dt;
          let vx = card.vx;
          let vy = card.vy;
          if (x < 76 || x > width - 76) {
            vx *= -1;
            x = Math.min(width - 76, Math.max(76, x));
          }
          if (y < topLimit || y > height - 74) {
            vy *= -1;
            y = Math.min(height - 74, Math.max(topLimit, y));
          }
          return { ...card, x, y, vx, vy, wobble: card.wobble + 0.045 * dt, wrongPulse: Math.max(0, card.wrongPulse - 1) };
        });
        for (let i = 0; i < next.length; i++) {
          for (let j = i + 1; j < next.length; j++) {
            if (next[i].matched || next[j].matched || next[i].id === heldIdRef.current || next[j].id === heldIdRef.current) continue;
            const dx = next[j].x - next[i].x;
            const dy = next[j].y - next[i].y;
            const dist = Math.hypot(dx, dy);
            if (dist > 0 && dist < 132) {
              const push = (132 - dist) * 0.006;
              next[i].vx -= (dx / dist) * push;
              next[i].vy -= (dy / dist) * push;
              next[j].vx += (dx / dist) * push;
              next[j].vy += (dy / dist) * push;
            }
          }
        }
        cardsRef.current = next;
        setCards([...next]);
      }
      setParticles((items) =>
        items
          .map((p) => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy + 0.08, life: p.life - 1 }))
          .filter((p) => p.life > 0),
      );
      if (matchedCount >= NUMBERS.length) {
        setPhase('result');
        onXpEarned(25 + Math.max(0, Math.round(score / 3)));
        arabicSfx.complete();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [matchedCount, onXpEarned, phase, score, settings.speed]);

  useEffect(() => {
    if (phase !== 'playing') stopCamera();
  }, [phase, stopCamera]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  function handlePointerDown(cardId: number, event: ReactPointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointerActiveRef.current = true;
    heldIdRef.current = cardId;
    dragStartRef.current = performance.now();
    playSfx('grab');
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!pointerActiveRef.current || !heldIdRef.current) return;
    const point = toLocalPoint(wrapperRef.current, event.clientX, event.clientY);
    moveHeld(point.x, point.y);
    setHand({ x: point.x, y: point.y, pinching: true, visible: true });
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (!pointerActiveRef.current) return;
    pointerActiveRef.current = false;
    dropHeld(event.clientX, event.clientY);
    setHand((prev) => ({ ...prev, pinching: false }));
  }

  function saveScore() {
    const name = studentName.trim() || 'Murid';
    const row: LeaderboardEntry = { name, score, accuracy, date: new Date().toLocaleDateString('id-ID') };
    const rows = [...leaderboard, row].sort((a, b) => b.score - a.score || b.accuracy - a.accuracy).slice(0, 10);
    setLeaderboard(rows);
    saveLeaderboard(rows);
    pushToast('Skor tersimpan di Top 10.');
  }

  const avgDrag = dragTimesRef.current.length
    ? (dragTimesRef.current.reduce((sum, value) => sum + value, 0) / dragTimesRef.current.length).toFixed(1)
    : '0.0';

  return (
    <div className="hand-arabic-game" ref={wrapperRef}>
      <video ref={videoRef} className="hand-arabic-video" playsInline muted />
      <canvas ref={canvasRef} className="hand-arabic-canvas" />
      <div className="hand-arabic-ui">
        <div className="hand-arabic-topbar">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span className="hand-pill"><Camera size={14} /> {cameraStatus}</span>
            <span className="hand-pill">Skor {score}</span>
            <span className="hand-pill">{matchedCount}/10 cocok</span>
            <span className="hand-pill">{timeLeft}s</span>
          </div>
          <div className="hand-actions">
            <button className="hand-icon-btn" onClick={() => void startCamera()} aria-label="Aktifkan kamera"><Camera size={17} /></button>
            <button className="hand-icon-btn" onClick={() => setPhase('settings')} aria-label="Pengaturan"><Settings size={17} /></button>
            <button className="hand-icon-btn" onClick={() => setPhase('leaderboard')} aria-label="Top 10"><Trophy size={17} /></button>
            <button className="hand-icon-btn" onClick={onBack} aria-label="Kembali"><X size={17} /></button>
          </div>
        </div>

        <div className="hand-target-grid">
          {NUMBERS.map((row) => {
            const matched = cards.find((card) => card.id === row.id)?.matched;
            return (
              <div
                key={row.id}
                ref={(node) => { targetRefs.current[row.id] = node; }}
                className={'hand-target' + (matched ? ' matched' : '')}
                style={{ borderColor: `${row.color}88`, boxShadow: `0 12px 28px #0006, inset 0 0 0 1px ${row.color}33` }}
              >
                <span className="hand-target-number">{row.number}</span>
                {matched && <span className="hand-target-word">{row.word}</span>}
                {matched && settings.showMalay && <span className="hand-target-meaning">{row.meaning}</span>}
              </div>
            );
          })}
        </div>

        <div className="hand-card-layer">
          {cards.filter((card) => !card.matched).map((card) => {
            const row = NUMBERS.find((item) => item.id === card.id)!;
            const tilt = Math.sin(card.wobble) * 3.6;
            return (
              <div
                key={card.id}
                ref={(node) => { cardRefs.current[card.id] = node; }}
                className={'hand-card' + (heldIdRef.current === card.id ? ' held' : '') + (card.wrongPulse > 0 ? ' wrong' : '')}
                style={{ left: card.x, top: card.y, borderColor: `${row.color}aa`, transform: `translate(-50%, -50%) rotate(${tilt}deg)` }}
                onPointerDown={(event) => handlePointerDown(card.id, event)}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              >
                <div>
                  <div className="hand-card-word">{row.word}</div>
                  {settings.showMalay && <div className="hand-card-meaning">{row.meaning}</div>}
                </div>
              </div>
            );
          })}
        </div>

        {hand.visible && (
          <div className={'hand-reticle' + (hand.pinching ? ' pinching' : '')} style={{ left: hand.x, top: hand.y }}>
            {hand.pinching ? '✊' : '🖐️'}
          </div>
        )}
        {hand.visible && heldCard && (
          <div
            className="hand-tether"
            style={{
              left: hand.x,
              top: hand.y,
              width: Math.hypot(heldCard.x - hand.x, heldCard.y - hand.y),
              transform: `rotate(${Math.atan2(heldCard.y - hand.y, heldCard.x - hand.x)}rad)`,
            }}
          />
        )}
        {particles.map((p) => (
          <span key={p.id} className="hand-particle" style={{ left: p.x, top: p.y, color: p.color, opacity: Math.max(0, p.life / 60) }} />
        ))}
        <div className="hand-status">
          {hand.pinching ? '✊ JARI DIKECILKAN (MEMEGANG)' : '🖐️ JARI TERBUKA (SEDIA)'} • cubit kartu, bawa ke angka Arab, lalu buka jari
        </div>
        <div className="hand-toast-wrap">
          {toast.map((item, index) => <div key={`${item}-${index}`} className="hand-toast">{item}</div>)}
        </div>
      </div>

      {phase === 'start' && (
        <div className="hand-modal">
          <div className="hand-modal-card">
            <span className="chip">Mini-game AI Vision</span>
            <h3>AI Angka Arab ١-١٠</h3>
            <p>Gunakan kamera untuk menggerakkan tangan. Cubit untuk mengambil kartu kata Arab, arahkan ke petak angka yang cocok, lalu buka jari untuk melepas.</p>
            <div className="hand-guide">
              <div className="hand-guide-card"><b>1</b> Buka tangan agar sensor siap.</div>
              <div className="hand-guide-card"><b>2</b> Cubit untuk mengambil kartu.</div>
              <div className="hand-guide-card"><b>3</b> Lepas di angka Arab yang tepat.</div>
            </div>
            <p>Kamera tidak wajib. Jika izin kamera ditolak, game tetap bisa dimainkan dengan mouse atau sentuhan.</p>
            <div className="hand-modal-actions">
              <button className="hand-primary" onClick={startGame}>Mulai Bermain <ChevronRight size={16} /></button>
              <button className="hand-secondary" onClick={() => setPhase('settings')}>Mod Guru</button>
              <button className="hand-secondary" onClick={() => setPhase('leaderboard')}>Lihat Top 10</button>
            </div>
          </div>
        </div>
      )}

      {phase === 'settings' && (
        <div className="hand-modal">
          <div className="hand-modal-card">
            <h3>Mod Guru</h3>
            <div className="hand-settings-grid">
              {[
                ['timeLimit', 'Masa permainan', 30, 180, settings.timeLimit, 's'],
                ['pinchSensitivity', 'Kepekaan cubit', 35, 85, settings.pinchSensitivity, 'px'],
                ['speed', 'Kelajuan kad', 0, 4, settings.speed, 'x'],
                ['correctScore', 'Markah betul', 1, 20, settings.correctScore, ''],
                ['wrongPenalty', 'Penalti salah', 0, 10, settings.wrongPenalty, ''],
              ].map(([key, label, min, max, value, suffix]) => (
                <div className="hand-setting" key={key as string}>
                  <label>{label}<span>{value}{suffix}</span></label>
                  <input
                    type="range"
                    min={min as number}
                    max={max as number}
                    step={key === 'speed' ? 0.25 : 1}
                    value={value as number}
                    onChange={(event) => setSettings((prev) => ({ ...prev, [key as keyof TeacherSettings]: Number(event.target.value) }))}
                  />
                </div>
              ))}
            </div>
            <label className="hand-toggle"><input type="checkbox" checked={settings.showSkeleton} onChange={(e) => setSettings((p) => ({ ...p, showSkeleton: e.target.checked }))} /> Garisan rangka sensor AI</label>
            <label className="hand-toggle"><input type="checkbox" checked={settings.showMalay} onChange={(e) => setSettings((p) => ({ ...p, showMalay: e.target.checked }))} /> Terjemahan Indonesia/Melayu</label>
            <label className="hand-toggle"><input type="checkbox" checked={settings.sfx} onChange={(e) => setSettings((p) => ({ ...p, sfx: e.target.checked }))} /> Suara efek pendek</label>
            <div className="hand-modal-actions">
              <button className="hand-primary" onClick={startGame}>Simpan dan mulai</button>
              <button className="hand-secondary" onClick={() => setPhase(cards.length ? 'playing' : 'start')}>Kembali</button>
            </div>
          </div>
        </div>
      )}

      {phase === 'leaderboard' && (
        <div className="hand-modal">
          <div className="hand-modal-card">
            <h3>Top 10 Murid</h3>
            <div className="hand-leader-list">
              {leaderboard.length === 0 && <p>Belum ada skor tersimpan.</p>}
              {leaderboard.map((row, index) => (
                <div className="hand-leader-row" key={`${row.name}-${row.date}-${index}`}>
                  <b>#{index + 1}</b>
                  <span>{row.name}<br /><small>{row.date} • akurasi {row.accuracy}%</small></span>
                  <b>{row.score}</b>
                </div>
              ))}
            </div>
            <div className="hand-modal-actions">
              <button className="hand-secondary" onClick={() => { setLeaderboard([]); saveLeaderboard([]); }}>Padam rekod</button>
              <button className="hand-primary" onClick={() => setPhase(cards.length ? 'playing' : 'start')}>Kembali</button>
            </div>
          </div>
        </div>
      )}

      {phase === 'result' && (
        <div className="hand-modal">
          <div className="hand-modal-card">
            <span className="chip">Hasil AI Angka Arab</span>
            <h3>{matchedCount >= 10 ? 'Semua cocok!' : 'Permainan selesai'}</h3>
            <div className="hand-result-grid">
              <div className="hand-result-stat"><b>{score}</b>Skor akhir</div>
              <div className="hand-result-stat"><b>{matchedCount}/10</b>Berjaya</div>
              <div className="hand-result-stat"><b>{wrongCount}</b>Salah kotak</div>
              <div className="hand-result-stat"><b>{accuracy}%</b>Ketepatan</div>
              <div className="hand-result-stat"><b>{avgDrag}s</b>Purata masa seret</div>
              <div className="hand-result-stat"><b>{settings.timeLimit - timeLeft}s</b>Waktu bermain</div>
            </div>
            <div className="hand-name-row">
              <input value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="Nama murid" />
              <button className="hand-primary" onClick={saveScore}>Simpan</button>
            </div>
            <div className="hand-modal-actions">
              <button className="hand-secondary" onClick={startGame}><RotateCcw size={16} /> Main lagi</button>
              <button className="hand-primary" onClick={onBack}>Kembali ke Oasis <ChevronRight size={16} /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
