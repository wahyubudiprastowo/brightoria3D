import ModelPreview from '../../components/world3d/ModelPreview';
import { modelUrls } from '../../components/world3d/LocalModel';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, ChevronRight, Lock, RotateCcw, Star, Volume2, X } from 'lucide-react';
import { letters, type HijaiyahWord } from './curriculum';
import {
  computeMastery,
  loadEvidence,
  recordLetterResult,
  saveEvidence,
  type HijaiyahEvidence,
} from './evidence';
import { isArabicTtsAvailable, speakArabic } from './quranTts';
import { Confetti } from '../juice';

/**
 * QuranGame.tsx — Patch 30 (PERBAIKAN UX BESAR atas Patch 28/29).
 *
 * ====================================================================
 * MASALAH NYATA dari screenshot user ("3/4 pasang • 12 kesalahan"):
 * ====================================================================
 * Mekanik drag-garis Patch 28 secara TEKNIS berfungsi, tapi TIDAK PUNYA
 * AFFORDANCE yang cukup untuk anak kecil — 12 kesalahan untuk 4 pasang
 * kata membuktikan anak (atau siapa pun) tidak tahu HARUS APA. Tiga akar
 * masalah yang diperbaiki di Patch 30:
 *
 * 1. TIDAK ADA CONTOH/TUTORIAL. Anak dilempar langsung ke layar drag
 *    tanpa pernah diperlihatkan caranya. PERBAIKAN: animasi demo
 *    otomatis (satu kali per huruf, HANYA saat huruf itu belum pernah
 *    diselesaikan) — sebuah "titik tangan" bergerak sendiri dari kartu
 *    gambar pertama ke kata pasangannya, menggambar garis contoh, LALU
 *    kartu itu di-reset kembali ke keadaan semula dan giliran anak
 *    mencoba sendiri. Ini murni visual (tidak ada teks penjelasan
 *    panjang) — sesuai gaya "show, don't tell" yang cocok untuk anak
 *    pra-baca lancar.
 *
 * 2. TIDAK ADA HIGHLIGHT TARGET SAAT MENYERET. Sebelumnya semua kotak
 *    kanan terlihat identik terus-menerus — anak tidak tahu ke mana
 *    harus melepas jari. PERBAIKAN: SELAMA proses drag berlangsung,
 *    SEMUA kartu kata yang belum selesai (kolom kanan) mendapat
 *    highlight kuning berdenyut lembut ("drop zone"), DAN kartu yang
 *    SEDANG berada tepat di bawah posisi jari/kursor mendapat highlight
 *    lebih kuat (membesar sedikit) — memberi umpan balik real-time
 *    "kalau dilepas di sini, ini yang akan dipilih".
 *
 * 3. DUA ARAH DRAG MEMBINGUNGKAN. Patch 28 mengizinkan mulai drag dari
 *    KIRI (gambar) ATAU dari KANAN (kata) — ini melipatgandakan
 *    kemungkinan gerakan yang harus dipahami anak. PERBAIKAN: drag
 *    SEKARANG HANYA bisa dimulai dari KOLOM GAMBAR (kiri) — sesuai
 *    alur baca alami kiri-ke-kanan dan instruksi asli buku ("cocokkan
 *    GAMBAR dengan kata"). Kolom kata (kanan) murni jadi target/tujuan,
 *    tidak bisa memulai drag darinya — mengurangi setengah kompleksitas
 *    interaksi yang harus dipelajari anak.
 *
 * TAMBAHAN pendukung:
 * - Ukuran kartu diperbesar signifikan (min-height 60px -> 84px, emoji
 *   26px -> 36px) — target sentuh lebih besar, mengurangi salah lepas
 *   akibat presisi jari anak yang belum sempurna.
 *   sudah dilihat/dimainkan, TIDAK menghitung ulang tutorial setiap kali
 *   membuka huruf yang sama.
 * ====================================================================
 */

const STYLE_ID = 'brightoria-hijaiyah-styles-v3';
const OLD_STYLE_IDS = ['brightoria-hijaiyah-styles-v1', 'brightoria-hijaiyah-styles-v2'];

const HIJAIYAH_CSS = `
.hijaiyah-overlay { position: fixed; inset: 0; z-index: 75; background: linear-gradient(160deg,#0f2e3aee,#1a3d2eee); backdrop-filter: blur(10px); display: grid; place-items: center; padding: 16px; }
.hijaiyah-shell { position: relative; width: min(760px,96vw); max-height: 92vh; overflow-y: auto; background: #fffaf3; border-radius: 26px; padding: 26px; box-shadow: 0 25px 80px #0007; display: flex; flex-direction: column; gap: 16px; border-top: 6px solid #17856f; background-image: radial-gradient(circle at 100% 0%, #d7f3ec 0%, transparent 55%), radial-gradient(circle at 0% 100%, #fff3d6 0%, transparent 55%); }
.hijaiyah-arabic { font-family: 'Noto Naskh Arabic','Amiri',serif; direction: rtl; }
.hijaiyah-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
.hijaiyah-head h2 { margin: 6px 0 0; color: #17403a; }
.hijaiyah-close-btn { border: 0; background: #e6f3ee; border-radius: 50%; width: 35px; height: 35px; display: grid; place-items: center; cursor: pointer; flex-shrink: 0; color: #17856f; }
.hijaiyah-ghost-small { border: 1px solid #bfe0d6; background: #fff; border-radius: 12px; padding: 8px 12px; font-size: 12px; display: inline-flex; align-items: center; gap: 6px; cursor: pointer; color: #17856f; }
.hijaiyah-mastery-bar { display: flex; flex-direction: column; gap: 6px; font-size: 12px; color: #4c6b62; }
.hijaiyah-mastery-track { height: 11px; background: #e3ede9; border-radius: 20px; overflow: hidden; }
.hijaiyah-mastery-fill { display: block; height: 100%; background: linear-gradient(90deg,#198576,#f3c861); border-radius: 20px; }
.hijaiyah-letters-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(78px, 1fr)); gap: 8px; }
.hijaiyah-letter-card { border: 1px solid #cdeadf; background: linear-gradient(160deg,#e3f6f0,#d3efe4); border-radius: 14px; padding: 10px 4px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 3px; cursor: pointer; position: relative; transition: transform 0.15s ease; }
.hijaiyah-letter-card:not(.locked):hover { transform: translateY(-2px); }
.hijaiyah-letter-card.locked { background: #eceff0; border-color: #dfe4e2; color: #9aa3a0; opacity: 0.85; }
.hijaiyah-letter-glyph { font-size: 26px; }
.hijaiyah-letter-card b { font-size: 9px; color: #17403a; }
.hijaiyah-letter-stars { display: flex; gap: 1px; }
.hijaiyah-intro { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px; padding: 6px 4px; }
.hijaiyah-forms-row { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
.hijaiyah-form-card { background: #e3f6f0; border: 1px solid #cdeadf; border-radius: 14px; padding: 10px 14px; min-width: 70px; }
.hijaiyah-form-glyph { font-size: 30px; color: #17403a; }
.hijaiyah-form-label { font-size: 9px; color: #4c8a78; margin-top: 2px; }
.hijaiyah-intro-name { display: flex; align-items: center; gap: 8px; }
.hijaiyah-speak-btn { border: 1px solid #bfe0d6; background: #fff; color: #17856f; border-radius: 999px; width: 36px; height: 36px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
.hijaiyah-primary-btn { border: 0; background: linear-gradient(135deg,#198576,#6b3fa0); color: #fff; padding: 13px 18px; border-radius: 14px; font-weight: 900; display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; max-width: 280px; box-shadow: 0 9px 22px #17856f40; cursor: pointer; font-size: 14px; }

.hijaiyah-match-info { font-size: 12px; color: #4c6b62; text-align: center; margin-bottom: 6px; }
.hijaiyah-match-stage { position: relative; width: 100%; }
.hijaiyah-match-svg { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 2; }
.hijaiyah-match-columns { display: flex; gap: 14%; justify-content: space-between; position: relative; z-index: 1; }
.hijaiyah-match-col { display: flex; flex-direction: column; gap: 12px; width: 43%; }
.hijaiyah-match-col-label { font-size: 10px; font-weight: 800; color: #4c8a78; text-align: center; text-transform: uppercase; letter-spacing: 0.05em; }
.hijaiyah-match-item {
  border: 3px solid #d7ecdf; background: #fff; border-radius: 18px; padding: 14px; text-align: center;
  font-size: 34px; display: flex; align-items: center; justify-content: center; min-height: 84px;
  touch-action: none; user-select: none; transition: border-color 0.15s ease, background 0.15s ease, transform 0.15s ease;
}
.hijaiyah-match-item.word { font-size: 21px; cursor: default; }
.hijaiyah-match-item.image-draggable { cursor: grab; }
.hijaiyah-match-item.dragging { border-color: #f3c861; background: #fff8e2; cursor: grabbing; transform: scale(1.04); z-index: 3; position: relative; }
.hijaiyah-match-item.matched { border-color: #198576; background: #dff3ea; opacity: 0.75; cursor: default; }
.hijaiyah-match-item.wrong-flash { border-color: #c0492f; background: #fbe6e2; animation: hijaiyah-shake 0.35s ease; }
.hijaiyah-match-item.drop-zone { border-color: #f3c861; box-shadow: 0 0 0 4px #f3c86133; animation: hijaiyah-pulse 1.1s ease-in-out infinite; }
.hijaiyah-match-item.drop-zone-active { border-color: #198576; background: #eafbf3; transform: scale(1.08); box-shadow: 0 0 0 6px #19857633; }
@keyframes hijaiyah-shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
@keyframes hijaiyah-pulse { 0%,100% { box-shadow: 0 0 0 4px #f3c86133; } 50% { box-shadow: 0 0 0 8px #f3c86155; } }

.hijaiyah-demo-hint { display: flex; align-items: center; justify-content: center; gap: 8px; background: #fff3cd; border: 1px solid #edcc6d; border-radius: 12px; padding: 10px 14px; font-size: 12px; color: #6b5010; margin-bottom: 8px; }
.hijaiyah-demo-dot { width: 22px; height: 22px; border-radius: 50%; background: radial-gradient(circle, #ffb703, #c9860a); position: absolute; z-index: 4; pointer-events: none; box-shadow: 0 0 12px #ffb70399; transition: none; }
.hijaiyah-skip-demo { border: 1px solid #bfe0d6; background: #fff; border-radius: 999px; padding: 6px 14px; font-size: 11px; color: #17856f; cursor: pointer; margin: 0 auto; display: block; }

.hijaiyah-result { display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center; padding: 8px 0; }
.hijaiyah-stars-big { display: flex; gap: 6px; }
.hijaiyah-result-actions { display: flex; gap: 10px; width: 100%; }
.hijaiyah-ghost-btn { flex: 1; border: 1px solid #bfe0d6; background: #fff; border-radius: 12px; padding: 11px 14px; display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 13px; cursor: pointer; color: #17856f; }
.hijaiyah-collection-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 8px; max-height: 55vh; overflow-y: auto; }
.hijaiyah-word-card { background: linear-gradient(160deg,#e3f6f0,#d3efe4); border: 1px solid #cdeadf; border-radius: 12px; padding: 10px 6px; text-align: center; min-height: 90px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; }
.hijaiyah-word-card.locked { background: #eceff0; border-color: #dfe4e2; color: #9aa3a0; }
.hijaiyah-word-emoji { font-size: 22px; }
.hijaiyah-word-card b { font-size: 14px; color: #17403a; }
.hijaiyah-word-card span { font-size: 10px; color: #4c8a78; }
@media (max-width: 700px) {
  .hijaiyah-shell { padding: 18px; }
  .hijaiyah-match-columns { gap: 8%; }
  .hijaiyah-match-col { width: 46%; }
  .hijaiyah-match-item { min-height: 72px; font-size: 28px; }
  .hijaiyah-match-item.word { font-size: 16px; }
}
`;

function useInjectStyles() {
  useEffect(() => {
    OLD_STYLE_IDS.forEach((id) => document.getElementById(id)?.remove());
    if (document.getElementById(STYLE_ID)) return;
    const el = document.createElement('style');
    el.id = STYLE_ID;
    el.textContent = HIJAIYAH_CSS;
    document.head.appendChild(el);
  }, []);
}

function useTtsAvailability() {
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    let cancelled = false;
    isArabicTtsAvailable().then((ok) => {
      if (!cancelled) setAvailable(ok);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return available;
}

function shuffleArr<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function isLetterUnlocked(index: number, evidence: HijaiyahEvidence): boolean {
  if (index === 0) return true;
  const prev = letters[index - 1];
  return !!evidence.letters[prev.id]?.completed;
}

type View = 'map' | 'intro' | 'match' | 'result' | 'collection';

interface Point {
  x: number;
  y: number;
}
interface LineSeg {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/**
 * MatchStage — Patch 30. Drag SATU ARAH (hanya dari kolom gambar),
 * dengan highlight drop-zone dan demo tutorial otomatis.
 */
function MatchStage({
  words,
  showDemo,
  onDemoDone,
  onComplete,
}: {
  words: HijaiyahWord[];
  showDemo: boolean;
  onDemoDone: () => void;
  onComplete: (mistakes: number, matchedIds: string[]) => void;
}) {
  const [imageOrder] = useState<HijaiyahWord[]>(() => shuffleArr(words));
  const [wordOrder] = useState<HijaiyahWord[]>(() => shuffleArr(words));
  const stageRef = useRef<HTMLDivElement>(null);
  const imageRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const wordRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());
  const [permanentLines, setPermanentLines] = useState<LineSeg[]>([]);
  const [tempLine, setTempLine] = useState<LineSeg | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [flashId, setFlashId] = useState<string | null>(null);
  const [hoverWordId, setHoverWordId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggingWordId, setDraggingWordId] = useState<string | null>(null);

  const [demoDot, setDemoDot] = useState<Point | null>(null);
  const [demoActive, setDemoActive] = useState(showDemo);

  const dragOrigin = useRef<{ wordId: string; x: number; y: number } | null>(null);
  const completedRef = useRef(false);

  function getRelativeCenter(el: HTMLElement): Point {
    const stageRect = stageRef.current!.getBoundingClientRect();
    const rect = el.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2 - stageRect.left,
      y: rect.top + rect.height / 2 - stageRect.top,
    };
  }

  // --- Demo tutorial otomatis: satu kali, menggambar garis contoh dari
  // gambar pertama ke pasangannya, lalu menghapusnya kembali. ---
  useEffect(() => {
    if (!demoActive) return;
    const firstWord = imageOrder[0];
    const imgEl = imageRefs.current.get(firstWord.id);
    const wordEl = wordRefs.current.get(firstWord.id);
    if (!imgEl || !wordEl || !stageRef.current) {
      setDemoActive(false);
      onDemoDone();
      return;
    }

    const start = getRelativeCenter(imgEl);
    const end = getRelativeCenter(wordEl);
    let cancelled = false;
    const duration = 900;
    const startTime = performance.now();

    function step(now: number) {
      if (cancelled) return;
      const t = Math.min(1, (now - startTime) / duration);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      setDemoDot({
        x: start.x + (end.x - start.x) * eased,
        y: start.y + (end.y - start.y) * eased,
      });
      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        setTimeout(() => {
          if (cancelled) return;
          setDemoDot(null);
          setDemoActive(false);
          onDemoDone();
        }, 500);
      }
    }
    setDemoDot(start);
    const raf = requestAnimationFrame(step);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoActive]);

  function skipDemo() {
    setDemoActive(false);
    setDemoDot(null);
    onDemoDone();
  }

  function handleImagePointerDown(wordId: string, e: React.PointerEvent) {
    if (demoActive) return;
    if (matchedIds.has(wordId)) return;
    e.preventDefault();
    const el = imageRefs.current.get(wordId);
    if (!el || !stageRef.current) return;
    const origin = getRelativeCenter(el);
    dragOrigin.current = { wordId, x: origin.x, y: origin.y };
    setIsDragging(true);
    setDraggingWordId(wordId);
    const stageRect = stageRef.current.getBoundingClientRect();
    setTempLine({
      id: 'temp',
      x1: origin.x,
      y1: origin.y,
      x2: e.clientX - stageRect.left,
      y2: e.clientY - stageRect.top,
    });
  }

  useEffect(() => {
    function onMove(e: PointerEvent) {
      if (!dragOrigin.current || !stageRef.current) return;
      const stageRect = stageRef.current.getBoundingClientRect();
      setTempLine((prev) => (prev ? { ...prev, x2: e.clientX - stageRect.left, y2: e.clientY - stageRect.top } : prev));

      const elUnder = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      const wordButton = elUnder?.closest('[data-word-key]') as HTMLButtonElement | null;
      const key = wordButton?.getAttribute('data-word-key') ?? null;
      setHoverWordId(key && !matchedIds.has(key) ? key : null);
    }

    function onUp(e: PointerEvent) {
      if (!dragOrigin.current) return;
      const origin = dragOrigin.current;
      dragOrigin.current = null;
      setTempLine(null);
      setIsDragging(false);
      setDraggingWordId(null);
      setHoverWordId(null);

      const targetEl = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      const targetButton = targetEl?.closest('[data-word-key]') as HTMLButtonElement | null;
      if (!targetButton) return;

      const targetWordId = targetButton.getAttribute('data-word-key')!;
      if (matchedIds.has(targetWordId) || matchedIds.has(origin.wordId)) return;

      const isCorrect = targetWordId === origin.wordId;

      if (isCorrect) {
        const originEl = imageRefs.current.get(origin.wordId)!;
        const p1 = getRelativeCenter(originEl);
        const p2 = getRelativeCenter(targetButton);
        setPermanentLines((prev) => [...prev, { id: origin.wordId, x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y }]);
        setMatchedIds((prev) => {
          const next = new Set(prev);
          next.add(origin.wordId);
          return next;
        });
      } else {
        setMistakes((m) => m + 1);
        setFlashId(origin.wordId + '|' + targetWordId);
        setTimeout(() => setFlashId(null), 380);
      }
    }

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchedIds]);

  useEffect(() => {
    if (completedRef.current) return;
    if (matchedIds.size > 0 && matchedIds.size === words.length) {
      completedRef.current = true;
      onComplete(mistakes, Array.from(matchedIds));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchedIds]);

  return (
    <div>
      <div className="hijaiyah-match-info">
        {demoActive
          ? 'Perhatikan contohnya dulu...'
          : `Seret gambar ke kata Arab yang cocok • ${matchedIds.size}/${words.length} pasang • ${mistakes} kesalahan`}
      </div>
      {demoActive && (
        <button className="hijaiyah-skip-demo" onClick={skipDemo}>
          Lewati contoh
        </button>
      )}
      <div className="hijaiyah-match-stage" ref={stageRef}>
        <svg className="hijaiyah-match-svg">
          {permanentLines.map((line) => (
            <line key={line.id} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke="#198576" strokeWidth={4} strokeLinecap="round" />
          ))}
          {tempLine && (
            <line
              x1={tempLine.x1}
              y1={tempLine.y1}
              x2={tempLine.x2}
              y2={tempLine.y2}
              stroke="#f3c861"
              strokeWidth={4}
              strokeDasharray="8 7"
              strokeLinecap="round"
            />
          )}
          {demoActive && permanentLines.length === 0 && demoDot && (
            <line x1={demoDot.x} y1={demoDot.y} x2={demoDot.x} y2={demoDot.y} stroke="transparent" />
          )}
        </svg>

        {demoDot && (
          <div className="hijaiyah-demo-dot" style={{ left: demoDot.x - 11, top: demoDot.y - 11 }} />
        )}

        <div className="hijaiyah-match-columns">
          <div className="hijaiyah-match-col">
            <div className="hijaiyah-match-col-label">Gambar</div>
            {imageOrder.map((w) => {
              const isMatched = matchedIds.has(w.id);
              const isThisDragging = draggingWordId === w.id;
              return (
                <button
                  key={w.id}
                  ref={(el) => {
                    if (el) imageRefs.current.set(w.id, el);
                  }}
                  className={
                    'hijaiyah-match-item image-draggable' +
                    (isMatched ? ' matched' : '') +
                    (isThisDragging ? ' dragging' : '')
                  }
                  onPointerDown={(e) => handleImagePointerDown(w.id, e)}
                  disabled={isMatched || demoActive}
                >
                  {w.emoji}
                </button>
              );
            })}
          </div>
          <div className="hijaiyah-match-col">
            <div className="hijaiyah-match-col-label">Kata Arab</div>
            {wordOrder.map((w) => {
              const isMatched = matchedIds.has(w.id);
              const isFlashing = flashId?.startsWith(w.id + '|') || flashId?.endsWith('|' + w.id);
              const isDropZone = isDragging && !isMatched;
              const isDropZoneActive = hoverWordId === w.id && isDropZone;
              return (
                <button
                  key={w.id}
                  ref={(el) => {
                    if (el) wordRefs.current.set(w.id, el);
                  }}
                  data-word-key={w.id}
                  className={
                    'hijaiyah-match-item word hijaiyah-arabic' +
                    (isMatched ? ' matched' : '') +
                    (isFlashing ? ' wrong-flash' : '') +
                    (isDropZone ? ' drop-zone' : '') +
                    (isDropZoneActive ? ' drop-zone-active' : '')
                  }
                  disabled={isMatched}
                  tabIndex={-1}
                >
                  {w.arabic}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function QuranGame({
  onExit,
  onXpEarned,
}: {
  onExit: () => void;
  onXpEarned: (amount: number) => void;
}) {
  useInjectStyles();
  const ttsAvailable = useTtsAvailability();

  const [view, setView] = useState<View>('map');
  const [evidence, setEvidence] = useState<HijaiyahEvidence>(() => loadEvidence());
  const [activeLetterId, setActiveLetterId] = useState<string | null>(null);
  const [confettiTick, setConfettiTick] = useState(0);
  const [lastResult, setLastResult] = useState<{ stars: 0 | 1 | 2 | 3; mistakes: number } | null>(null);
  const [matchKey, setMatchKey] = useState(0);

  const overallMastery = useMemo(() => computeMastery(evidence, letters.length), [evidence]);
  const totalWords = letters.length * 4;

  const activeLetter = letters.find((l) => l.id === activeLetterId) ?? null;
  const activeProgress = activeLetterId ? evidence.letters[activeLetterId] : undefined;

  // Tutorial demo HANYA muncul jika huruf ini belum pernah diselesaikan.
  const shouldShowDemo = activeLetterId ? !evidence.letters[activeLetterId]?.completed : false;
  const [demoShownThisSession, setDemoShownThisSession] = useState(false);

  function openIntro(letterId: string) {
    setActiveLetterId(letterId);
    setView('intro');
  }

  function tryLocked() {
    // no-op umpan balik ringan
  }

  function startMatch(letterId: string) {
    setActiveLetterId(letterId);
    setMatchKey((k) => k + 1);
    setDemoShownThisSession(false);
    setView('match');
  }

  function handleMatchComplete(mistakes: number, matchedWordIds: string[]) {
    if (!activeLetterId) return;
    const next = recordLetterResult(evidence, activeLetterId, mistakes, matchedWordIds);
    setEvidence(next);
    saveEvidence(next);
    const stars = next.letters[activeLetterId].stars;
    setLastResult({ stars, mistakes });
    const xp = 10 + stars * 10;
    onXpEarned(xp);
    setConfettiTick((n) => n + 1);
    setView('result');
  }

  function backToMap() {
    setView('map');
    setActiveLetterId(null);
  }

  function handleSpeak(text: string, e?: React.MouseEvent) {
    e?.stopPropagation();
    speakArabic(text);
  }

  return (
    <div className="hijaiyah-overlay">
      <div className="hijaiyah-shell">
        <Confetti trigger={confettiTick} />

        <header className="hijaiyah-head">
          <div>
            <span className="chip">Taman Al-Qur'an</span>
            <h2>
              {view === 'map' && 'Petualangan Huruf Hijaiyah'}
              {(view === 'intro' || view === 'match' || view === 'result') && `Huruf ${activeLetter?.name}`}
              {view === 'collection' && 'Koleksi Kosakata'}
            </h2>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {(view === 'intro' || view === 'match') && (
              <button className="hijaiyah-ghost-small" onClick={backToMap}>
                Peta
              </button>
            )}
            {view === 'map' && (
              <button className="hijaiyah-ghost-small" onClick={() => setView('collection')}>
                <BookOpen size={14} /> Koleksi ({evidence.collectedWords.length}/{totalWords})
              </button>
            )}
            {view === 'collection' && (
              <button className="hijaiyah-ghost-small" onClick={backToMap}>
                Peta
              </button>
            )}
            <button className="hijaiyah-close-btn" onClick={onExit}>
              <X size={16} />
            </button>
          </div>
        </header>

        {view === 'map' && (
          <div>
        <ModelPreview url={modelUrls.quran} image="/assets/worlds/01_taman_alquran.webp" label="Pulau Quran 3D" />
            <div className="hijaiyah-mastery-bar" style={{ marginBottom: 12 }}>
              <div className="hijaiyah-mastery-track">
                <span className="hijaiyah-mastery-fill" style={{ width: `${overallMastery}%` }} />
              </div>
              <span>{overallMastery}% mastery &bull; 28 huruf Hijaiyah, urutkan dari Alif</span>
            </div>
            <div className="hijaiyah-letters-grid">
              {letters.map((letter, i) => {
                const progress = evidence.letters[letter.id];
                const unlocked = isLetterUnlocked(i, evidence);
                return (
                  <button
                    key={letter.id}
                    className={'hijaiyah-letter-card' + (unlocked ? '' : ' locked')}
                    onClick={() => (unlocked ? openIntro(letter.id) : tryLocked())}
                  >
                    <span className="hijaiyah-letter-glyph hijaiyah-arabic">
                      {unlocked ? letter.isolated : <Lock size={16} />}
                    </span>
                    <b>{letter.name}</b>
                    <span className="hijaiyah-letter-stars">
                      {[1, 2, 3].map((s) => (
                        <Star key={s} size={9} fill={progress && progress.stars >= s ? '#f3c861' : 'none'} color="#f3c861" />
                      ))}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {view === 'intro' && activeLetter && (
          <div className="hijaiyah-intro">
            <div className="hijaiyah-intro-name">
              <h3 style={{ margin: 0 }}>Huruf {activeLetter.name}</h3>
              {ttsAvailable && (
                <button className="hijaiyah-speak-btn" onClick={(e) => handleSpeak(activeLetter.isolated, e)}>
                  <Volume2 size={15} />
                </button>
              )}
            </div>
            <p style={{ fontSize: 13, color: '#4c6b62', maxWidth: 380 }}>
              Kenali dulu 4 bentuk penulisan huruf ini, lalu seret gambar ke kata Arab yang tepat.
            </p>
            <div className="hijaiyah-forms-row">
              <div className="hijaiyah-form-card">
                <div className="hijaiyah-form-glyph hijaiyah-arabic">{activeLetter.isolated}</div>
                <div className="hijaiyah-form-label">Berdiri sendiri</div>
              </div>
              <div className="hijaiyah-form-card">
                <div className="hijaiyah-form-glyph hijaiyah-arabic">{activeLetter.initial}</div>
                <div className="hijaiyah-form-label">Di awal kata</div>
              </div>
              <div className="hijaiyah-form-card">
                <div className="hijaiyah-form-glyph hijaiyah-arabic">{activeLetter.medial}</div>
                <div className="hijaiyah-form-label">Di tengah kata</div>
              </div>
              <div className="hijaiyah-form-card">
                <div className="hijaiyah-form-glyph hijaiyah-arabic">{activeLetter.final}</div>
                <div className="hijaiyah-form-label">Di akhir kata</div>
              </div>
            </div>
            {activeProgress && (
              <div className="hijaiyah-stars-big">
                {[1, 2, 3].map((s) => (
                  <Star key={s} size={22} fill={activeProgress.stars >= s ? '#f3c861' : 'none'} color="#f3c861" />
                ))}
              </div>
            )}
            <button className="hijaiyah-primary-btn" onClick={() => activeLetterId && startMatch(activeLetterId)}>
              {activeProgress ? 'Main lagi' : 'Mulai bermain!'} <ChevronRight size={16} />
            </button>
          </div>
        )}

        {view === 'match' && activeLetter && (
          <MatchStage
            key={matchKey}
            words={activeLetter.words}
            showDemo={shouldShowDemo && !demoShownThisSession}
            onDemoDone={() => setDemoShownThisSession(true)}
            onComplete={handleMatchComplete}
          />
        )}

        {view === 'result' && lastResult && activeLetter && (
          <div className="hijaiyah-result">
            <div className="hijaiyah-stars-big">
              {[1, 2, 3].map((s) => (
                <Star key={s} size={32} fill={lastResult.stars >= s ? '#f3c861' : 'none'} color="#f3c861" />
              ))}
            </div>
            <h3>Huruf {activeLetter.name} selesai!</h3>
            <p style={{ fontSize: 13, color: '#4c6b62' }}>
              {lastResult.mistakes === 0
                ? 'Sempurna, semua garis tersambung dengan benar!'
                : `Selesai dengan ${lastResult.mistakes} kesalahan. Coba lagi untuk bintang penuh!`}
            </p>
            <div className="hijaiyah-result-actions">
              <button className="hijaiyah-ghost-btn" onClick={() => activeLetterId && startMatch(activeLetterId)}>
                <RotateCcw size={16} /> Main lagi
              </button>
              <button className="hijaiyah-primary-btn" style={{ maxWidth: 'none' }} onClick={backToMap}>
                Kembali ke peta <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {view === 'collection' && (
          <div className="hijaiyah-collection-grid">
            {letters.map((letter) =>
              letter.words.map((w) => {
                const owned = evidence.collectedWords.includes(w.id);
                return (
                  <div key={w.id} className={'hijaiyah-word-card' + (owned ? '' : ' locked')}>
                    {owned ? (
                      <>
                        <span className="hijaiyah-word-emoji">{w.emoji}</span>
                        <b className="hijaiyah-arabic">{w.arabic}</b>
                        <span>{w.meaning}</span>
                      </>
                    ) : (
                      <Lock size={16} />
                    )}
                  </div>
                );
              }),
            )}
          </div>
        )}
      </div>
    </div>
  );
}
