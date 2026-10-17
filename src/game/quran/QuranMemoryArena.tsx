import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Headphones,
  Layers3,
  ListOrdered,
  Medal,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  Volume2,
} from 'lucide-react';
import { sfx } from '../sound';
import {
  getAyahAudioUrl,
  JUZ_30_SURAHS,
  loadJuz30,
  type Juz30SurahMeta,
  type QuranAyah,
} from './quranReaderData';

export const QURAN_MEMORY_CSS = `
.quran-memory-shell { display: grid; gap: 15px; color: #173f38; }
.quran-memory-hero { position: relative; overflow: hidden; display: grid; grid-template-columns: 1fr auto; gap: 18px; align-items: center; padding: 20px; border: 1px solid #b8ddce; border-radius: 20px; background: linear-gradient(135deg,#e8f8ef,#fff7dd 64%,#f5e2a8); }
.quran-memory-hero::after { content: ''; position: absolute; width: 140px; height: 140px; right: -42px; bottom: -82px; border: 22px solid #ffffff70; border-radius: 50%; }
.quran-memory-kicker { display: inline-flex; align-items: center; gap: 6px; color: #a16a16; font-size: 10px; font-weight: 900; text-transform: uppercase; }
.quran-memory-hero h3 { margin: 5px 0 4px; font-size: 24px; }
.quran-memory-hero p { margin: 0; max-width: 610px; color: #527269; font-size: 12px; line-height: 1.55; }
.quran-memory-medal { position: relative; z-index: 1; width: 68px; height: 68px; display: grid; place-items: center; border: 3px solid #fff9e9; border-radius: 50%; color: #fff; background: linear-gradient(145deg,#e5a52d,#bd6c20); box-shadow: 0 10px 24px #8f5a2740; }
.quran-memory-mode-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 11px; }
.quran-memory-mode { position: relative; min-height: 136px; overflow: hidden; display: grid; grid-template-columns: 44px 1fr; gap: 11px; align-items: start; border: 1px solid #c9e5da; border-radius: 17px; padding: 15px; color: #173f38; background: #fff; text-align: left; cursor: pointer; transition: transform .16s ease, box-shadow .16s ease, border-color .16s ease; }
.quran-memory-mode:hover { transform: translateY(-2px); border-color: #4aaa8f; box-shadow: 0 12px 26px #17403a18; }
.quran-memory-mode:nth-child(2) { background: #fffaf0; border-color: #ead8aa; }
.quran-memory-mode:nth-child(3) { background: #f8f4ff; border-color: #dcd0ed; }
.quran-memory-mode:nth-child(4) { background: #eef8ff; border-color: #c9dfec; }
.quran-memory-mode-icon { width: 44px; height: 44px; display: grid; place-items: center; border-radius: 13px; color: #fff; background: #198576; }
.quran-memory-mode:nth-child(2) .quran-memory-mode-icon { background: #d29224; }
.quran-memory-mode:nth-child(3) .quran-memory-mode-icon { background: #73589e; }
.quran-memory-mode:nth-child(4) .quran-memory-mode-icon { background: #337da4; }
.quran-memory-mode h4 { margin: 1px 0 4px; font-size: 15px; }
.quran-memory-mode p { margin: 0; color: #5c786f; font-size: 11px; line-height: 1.45; }
.quran-memory-best { grid-column: 2; display: flex; gap: 8px; align-items: center; margin-top: 8px; color: #6d7e78; font-size: 10px; font-weight: 800; }
.quran-memory-draft { margin: 0; padding: 9px 12px; border-radius: 12px; background: #f3f7f4; color: #688078; font-size: 10px; line-height: 1.45; }
.quran-memory-loading { min-height: 310px; display: grid; place-items: center; text-align: center; color: #527269; }
.quran-memory-loader { width: 46px; height: 46px; margin: 0 auto 12px; border: 5px solid #d7eee6; border-top-color: #198576; border-radius: 50%; animation: quran-memory-spin .8s linear infinite; }
@keyframes quran-memory-spin { to { transform: rotate(360deg); } }
.quran-memory-hud { display: grid; grid-template-columns: auto 1fr auto auto; gap: 9px; align-items: center; }
.quran-memory-back { width: 38px; height: 38px; border: 1px solid #c9e5da; border-radius: 12px; display: grid; place-items: center; background: #fff; color: #198576; cursor: pointer; }
.quran-memory-progress { display: grid; gap: 5px; }
.quran-memory-progress-row { display: flex; justify-content: space-between; gap: 8px; color: #527269; font-size: 10px; font-weight: 900; }
.quran-memory-track { height: 9px; overflow: hidden; border-radius: 20px; background: #deebe6; }
.quran-memory-track span { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg,#198576,#f0bd43); transition: width .25s ease; }
.quran-memory-stat { min-width: 74px; padding: 8px 10px; border: 1px solid #e4eee9; border-radius: 12px; background: #fff; text-align: center; }
.quran-memory-stat small { display: block; color: #769087; font-size: 8px; font-weight: 900; text-transform: uppercase; }
.quran-memory-stat b { font-size: 15px; }
.quran-memory-stage { position: relative; min-height: 390px; overflow: hidden; display: grid; align-content: start; gap: 14px; padding: 18px; border: 1px solid #c9e5da; border-radius: 20px; background: radial-gradient(circle at 90% 0,#fff1bd 0 12%,transparent 32%),linear-gradient(155deg,#f7fff9,#edf8f4); }
.quran-memory-stage.correct { animation: quran-memory-correct .45s ease; }
.quran-memory-stage.wrong { animation: quran-memory-wrong .35s ease; }
@keyframes quran-memory-correct { 50% { box-shadow: inset 0 0 0 5px #31a87855; } }
@keyframes quran-memory-wrong { 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
.quran-memory-prompt { max-width: 700px; margin: 0 auto; text-align: center; }
.quran-memory-prompt small { color: #a16a16; font-weight: 900; text-transform: uppercase; }
.quran-memory-prompt h3 { margin: 5px 0 4px; font-size: 20px; }
.quran-memory-prompt p { margin: 0; color: #5c786f; font-size: 11px; }
.quran-memory-arabic-prompt { margin: 2px auto 0; padding: 14px 18px; border: 1px solid #eadfc8; border-radius: 17px; background: #fffaf3; font-family: 'Noto Naskh Arabic','Amiri',serif; font-size: clamp(22px,3vw,31px); line-height: 1.8; text-align: center; direction: rtl; }
.quran-memory-audio { width: fit-content; margin: 3px auto 0; border: 0; border-radius: 999px; padding: 11px 18px; display: inline-flex; align-items: center; gap: 8px; background: #173f38; color: #fff; font-weight: 900; cursor: pointer; box-shadow: 0 7px 0 #0c2924; }
.quran-memory-audio.playing { background: #d29224; box-shadow: 0 7px 0 #8d5e17; }
.quran-memory-choices { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 10px; }
.quran-memory-choice { min-height: 86px; border: 2px solid #d7e9e2; border-radius: 16px; padding: 11px 13px; background: #fff; color: #173f38; font: inherit; cursor: pointer; transition: transform .13s ease, border-color .13s ease, background .13s ease; }
.quran-memory-choice:hover:not(:disabled) { transform: translateY(-2px); border-color: #64b59e; }
.quran-memory-choice .arabic { display: block; font-family: 'Noto Naskh Arabic','Amiri',serif; direction: rtl; font-size: 20px; line-height: 1.55; }
.quran-memory-choice .latin { display: block; font-size: 13px; font-weight: 900; }
.quran-memory-choice .meta { display: block; margin-top: 4px; color: #71877f; font-size: 9px; }
.quran-memory-choice.selected.correct { border-color: #198576; background: #dcf5e9; }
.quran-memory-choice.selected.wrong { border-color: #c95a43; background: #fde7e2; }
.quran-memory-choice.reveal { border-color: #198576; box-shadow: inset 0 0 0 2px #19857633; }
.quran-memory-order-zone { min-height: 92px; display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 8px; padding: 10px; border: 2px dashed #acd3c5; border-radius: 17px; background: #ffffff8c; }
.quran-memory-order-slot { min-height: 70px; display: grid; place-items: center; border-radius: 13px; padding: 8px; background: #fff8e8; color: #173f38; font-family: 'Noto Naskh Arabic','Amiri',serif; direction: rtl; font-size: 17px; line-height: 1.45; cursor: pointer; }
.quran-memory-order-slot.empty { border: 1px dashed #decda2; color: #a89978; font-family: inherit; direction: ltr; font-size: 10px; }
.quran-memory-order-pool { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 8px; }
.quran-memory-order-card { min-height: 72px; border: 2px solid #d7e9e2; border-radius: 14px; padding: 9px; background: #fff; color: #173f38; font-family: 'Noto Naskh Arabic','Amiri',serif; direction: rtl; font-size: 17px; line-height: 1.45; cursor: pointer; }
.quran-memory-order-card:disabled { opacity: .28; cursor: default; }
.quran-memory-check { width: min(260px,100%); margin: auto auto 0; border: 0; border-radius: 14px; padding: 12px 16px; display: flex; align-items: center; justify-content: center; gap: 7px; background: #198576; color: #fff; font-weight: 900; cursor: pointer; }
.quran-memory-check:disabled { opacity: .45; cursor: default; }
.quran-memory-feedback { min-height: 38px; display: flex; align-items: center; justify-content: center; gap: 7px; border-radius: 12px; padding: 9px 12px; font-size: 11px; font-weight: 900; text-align: center; }
.quran-memory-feedback.correct { background: #dcf5e9; color: #126153; }
.quran-memory-feedback.wrong { background: #fde7e2; color: #9d3d2d; }
.quran-memory-result { min-height: 390px; display: grid; place-items: center; padding: 20px; border: 1px solid #c9e5da; border-radius: 20px; text-align: center; background: radial-gradient(circle at 50% 0,#fff0b8,transparent 42%),linear-gradient(145deg,#f6fff9,#ecf6f2); }
.quran-memory-result-inner { width: min(520px,100%); display: grid; gap: 12px; justify-items: center; }
.quran-memory-trophy { width: 78px; height: 78px; display: grid; place-items: center; border-radius: 50%; color: #fff; background: linear-gradient(145deg,#f3bf42,#cf7920); box-shadow: 0 12px 28px #a56a2b48; }
.quran-memory-result h3 { margin: 0; font-size: 25px; }
.quran-memory-result p { margin: 0; color: #5c786f; font-size: 12px; }
.quran-memory-result-grid { width: 100%; display: grid; grid-template-columns: repeat(3,1fr); gap: 9px; }
.quran-memory-result-stat { padding: 11px; border: 1px solid #dbeae4; border-radius: 13px; background: #fff; }
.quran-memory-result-stat small { display: block; color: #789087; font-size: 9px; }
.quran-memory-result-stat b { font-size: 19px; }
.quran-memory-actions { width: 100%; display: grid; grid-template-columns: 1fr 1.35fr; gap: 9px; }
.quran-memory-actions button { border-radius: 14px; padding: 12px; display: flex; align-items: center; justify-content: center; gap: 7px; font-weight: 900; cursor: pointer; }
.quran-memory-actions .secondary { border: 1px solid #c9e5da; background: #fff; color: #198576; }
.quran-memory-actions .primary { border: 0; background: #198576; color: #fff; }
@media (max-width:700px) {
  .quran-memory-mode-grid,.quran-memory-choices { grid-template-columns: 1fr; }
  .quran-memory-hero { grid-template-columns: 1fr; }
  .quran-memory-medal { display: none; }
  .quran-memory-hud { grid-template-columns: auto 1fr auto; }
  .quran-memory-stat.streak { display: none; }
  .quran-memory-stage { padding: 14px; min-height: 430px; }
  .quran-memory-order-zone,.quran-memory-order-pool { grid-template-columns: 1fr; }
  .quran-memory-result-grid { grid-template-columns: 1fr 1fr 1fr; }
}
`;

type ArenaMode = 'continue' | 'order' | 'surah' | 'listen';
type ArenaPhase = 'menu' | 'loading' | 'playing' | 'result' | 'error';

interface ArenaOption {
  id: string;
  primary: string;
  meta?: string;
  arabic?: boolean;
}

interface ArenaRound {
  id: string;
  mode: ArenaMode;
  title: string;
  instruction: string;
  promptArabic?: string;
  promptText?: string;
  options: ArenaOption[];
  correctId?: string;
  correctOrder?: string[];
  answerNote: string;
  audioAyah?: QuranAyah;
}

interface ModeProgress {
  attempts: number;
  bestScore: number;
  bestAccuracy: number;
}

type ArenaProgress = Partial<Record<ArenaMode, ModeProgress>>;

const PROGRESS_KEY = 'brightoria.quran.memoryArena.v1';
const ROUND_COUNT = 5;
const LOCAL_AUDIO_SURAHS = new Set([103, 105, 106, 108, 112, 113, 114]);

const MODE_INFO: Record<ArenaMode, { title: string; description: string }> = {
  continue: { title: 'Sambung Ayat', description: 'Baca satu ayat, lalu pilih ayat yang datang sesudahnya.' },
  order: { title: 'Susun Urutan Ayat', description: 'Ketuk tiga ayat hingga kembali tersusun dalam urutan yang benar.' },
  surah: { title: 'Tebak Nama Surat', description: 'Kenali surat dari ayat pembuka, arti nama, dan jumlah ayatnya.' },
  listen: { title: 'Simak dan Pilih', description: 'Dengarkan murattal qari, lalu pilih teks ayat yang dibacakan.' },
};

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function sample<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function loadProgress(): ArenaProgress {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}') as ArenaProgress;
  } catch {
    return {};
  }
}

function saveProgress(mode: ArenaMode, score: number, accuracy: number): ArenaProgress {
  const current = loadProgress();
  const previous = current[mode] ?? { attempts: 0, bestScore: 0, bestAccuracy: 0 };
  const next: ArenaProgress = {
    ...current,
    [mode]: {
      attempts: previous.attempts + 1,
      bestScore: Math.max(previous.bestScore, score),
      bestAccuracy: Math.max(previous.bestAccuracy, accuracy),
    },
  };
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
  } catch {
    // Progres permainan tetap berjalan jika penyimpanan perangkat dibatasi.
  }
  return next;
}

function shortSurahs(data: Record<string, QuranAyah[]>): Juz30SurahMeta[] {
  return JUZ_30_SURAHS.filter((meta) => meta.number >= 97 && meta.ayahCount <= 11 && data[String(meta.number)]?.length >= 3);
}

function ayahId(ayah: QuranAyah): string {
  return `${ayah.surahNumber}-${ayah.ayahNumber}`;
}

function uniqueOptions(correct: QuranAyah, pool: QuranAyah[]): ArenaOption[] {
  const distractors = shuffle(pool.filter((ayah) => ayahId(ayah) !== ayahId(correct))).slice(0, 3);
  return shuffle([correct, ...distractors]).map((ayah) => ({
    id: ayahId(ayah),
    primary: ayah.arabicText,
    arabic: true,
  }));
}

function generateRounds(mode: ArenaMode, data: Record<string, QuranAyah[]>): ArenaRound[] {
  const metas = shortSurahs(data);
  const allAyahs = metas.flatMap((meta) => data[String(meta.number)] ?? []);
  const rounds: ArenaRound[] = [];

  for (let index = 0; index < ROUND_COUNT; index += 1) {
    if (mode === 'continue') {
      const meta = sample(metas);
      const ayahs = data[String(meta.number)];
      const start = Math.floor(Math.random() * (ayahs.length - 1));
      const prompt = ayahs[start];
      const answer = ayahs[start + 1];
      rounds.push({
        id: `continue-${index}-${ayahId(prompt)}`,
        mode,
        title: `Surat ${meta.nameLatin} • ayat ${prompt.ayahNumber}`,
        instruction: 'Ayat manakah yang dibaca setelah ini?',
        promptArabic: prompt.arabicText,
        options: uniqueOptions(answer, allAyahs),
        correctId: ayahId(answer),
        answerNote: `Benar: ayat ${answer.ayahNumber} melanjutkan Surat ${meta.nameLatin}.`,
      });
      continue;
    }

    if (mode === 'order') {
      const meta = sample(metas);
      const ayahs = data[String(meta.number)];
      const start = Math.floor(Math.random() * (ayahs.length - 2));
      const selected = ayahs.slice(start, start + 3);
      rounds.push({
        id: `order-${index}-${meta.number}-${start}`,
        mode,
        title: `Susun Surat ${meta.nameLatin}`,
        instruction: `Urutkan ayat ${start + 1} sampai ${start + 3}.`,
        options: shuffle(selected).map((ayah) => ({ id: ayahId(ayah), primary: ayah.arabicText, arabic: true })),
        correctOrder: selected.map(ayahId),
        answerNote: `Urutan ayat ${start + 1}, ${start + 2}, lalu ${start + 3} sudah tepat.`,
      });
      continue;
    }

    if (mode === 'surah') {
      const meta = sample(metas);
      const firstAyah = data[String(meta.number)][0];
      const otherMetas = shuffle(metas.filter((item) => item.number !== meta.number)).slice(0, 3);
      rounds.push({
        id: `surah-${index}-${meta.number}`,
        mode,
        title: `Petunjuk: ${meta.meaning} • ${meta.ayahCount} ayat`,
        instruction: 'Apakah nama surat ini?',
        promptArabic: firstAyah.arabicText,
        options: shuffle([meta, ...otherMetas]).map((item) => ({
          id: String(item.number),
          primary: item.nameLatin,
          meta: `${item.ayahCount} ayat`,
        })),
        correctId: String(meta.number),
        answerNote: `Ini adalah Surat ${meta.nameLatin}, artinya “${meta.meaning}”.`,
      });
      continue;
    }

    const audioMetas = metas.filter((meta) => LOCAL_AUDIO_SURAHS.has(meta.number));
    const meta = sample(audioMetas);
    const ayahs = data[String(meta.number)];
    const target = sample(ayahs);
    const audioPool = audioMetas.flatMap((item) => data[String(item.number)] ?? []);
    rounds.push({
      id: `listen-${index}-${ayahId(target)}`,
      mode,
      title: 'Dengarkan dengan tenang',
      instruction: 'Teks manakah yang sama dengan bacaan qari?',
      promptText: 'Tekan tombol dengarkan. Kamu boleh memutarnya lagi sebelum menjawab.',
      options: uniqueOptions(target, audioPool),
      correctId: ayahId(target),
      answerNote: `Bacaan tadi adalah Surat ${meta.nameLatin} ayat ${target.ayahNumber}.`,
      audioAyah: target,
    });
  }

  return rounds;
}

function ModeIcon({ mode }: { mode: ArenaMode }) {
  if (mode === 'continue') return <Layers3 size={22} />;
  if (mode === 'order') return <ListOrdered size={22} />;
  if (mode === 'surah') return <Sparkles size={22} />;
  return <Headphones size={22} />;
}

export function QuranMemoryArena({
  onBack,
  onComplete,
}: {
  onBack: () => void;
  onComplete: (xp: number) => void;
}) {
  const [phase, setPhase] = useState<ArenaPhase>('menu');
  const [mode, setMode] = useState<ArenaMode>('continue');
  const [rounds, setRounds] = useState<ArenaRound[]>([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [orderSelection, setOrderSelection] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [progress, setProgress] = useState<ArenaProgress>(() => loadProgress());
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioError, setAudioError] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const round = rounds[roundIndex];
  const resultAccuracy = Math.round((correctCount / ROUND_COUNT) * 100);

  useEffect(() => () => {
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    audioRef.current?.pause();
  }, []);

  useEffect(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    setAudioPlaying(false);
    setAudioError('');
  }, [roundIndex, phase]);

  async function startMode(nextMode: ArenaMode) {
    sfx.click();
    setMode(nextMode);
    setPhase('loading');
    try {
      const data = await loadJuz30();
      setRounds(generateRounds(nextMode, data));
      setRoundIndex(0);
      setScore(0);
      setCorrectCount(0);
      setMistakes(0);
      setStreak(0);
      setBestStreak(0);
      setSelectedId(null);
      setOrderSelection([]);
      setFeedback(null);
      setPhase('playing');
    } catch {
      setPhase('error');
    }
  }

  function returnToMenu() {
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    audioRef.current?.pause();
    setPhase('menu');
    setFeedback(null);
    setSelectedId(null);
    setOrderSelection([]);
  }

  function resolveAnswer(isCorrect: boolean) {
    if (!round || feedback) return;
    const nextStreak = isCorrect ? streak + 1 : 0;
    const gain = isCorrect ? 100 + streak * 15 : 0;
    const nextScore = score + gain;
    const nextCorrect = correctCount + (isCorrect ? 1 : 0);
    const nextMistakes = mistakes + (isCorrect ? 0 : 1);

    setFeedback(isCorrect ? 'correct' : 'wrong');
    setScore(nextScore);
    setCorrectCount(nextCorrect);
    setMistakes(nextMistakes);
    setStreak(nextStreak);
    setBestStreak((current) => Math.max(current, nextStreak));
    if (isCorrect) sfx.correct();
    else sfx.wrong();

    timeoutRef.current = window.setTimeout(() => {
      if (roundIndex + 1 < rounds.length) {
        setRoundIndex((current) => current + 1);
        setSelectedId(null);
        setOrderSelection([]);
        setFeedback(null);
        return;
      }

      const accuracy = Math.round((nextCorrect / ROUND_COUNT) * 100);
      setProgress(saveProgress(mode, nextScore, accuracy));
      const xp = 15 + nextCorrect * 5 + (nextCorrect === ROUND_COUNT ? 10 : 0);
      onComplete(xp);
      sfx.win();
      setPhase('result');
    }, 1150);
  }

  function chooseOption(id: string) {
    if (!round || feedback || round.mode === 'order') return;
    setSelectedId(id);
    resolveAnswer(id === round.correctId);
  }

  function chooseOrderCard(id: string) {
    if (feedback || orderSelection.includes(id) || orderSelection.length >= 3) return;
    sfx.click();
    setOrderSelection((current) => [...current, id]);
  }

  function removeOrderCard(id: string) {
    if (feedback) return;
    setOrderSelection((current) => current.filter((item) => item !== id));
  }

  function checkOrder() {
    if (!round?.correctOrder || orderSelection.length !== round.correctOrder.length || feedback) return;
    resolveAnswer(orderSelection.every((id, index) => id === round.correctOrder?.[index]));
  }

  function playAudio() {
    if (!round?.audioAyah) return;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
      setAudioPlaying(false);
      return;
    }

    const audio = new Audio(getAyahAudioUrl(round.audioAyah));
    audio.preload = 'auto';
    audioRef.current = audio;
    setAudioPlaying(true);
    setAudioError('');
    const finish = () => {
      if (audioRef.current === audio) audioRef.current = null;
      setAudioPlaying(false);
    };
    audio.onended = finish;
    audio.onerror = () => {
      finish();
      setAudioError('Audio belum dapat diputar. Coba ketuk tombol sekali lagi.');
    };
    audio.play().catch(() => {
      finish();
      setAudioError('Browser belum mengizinkan suara. Ketuk tombol dengarkan lagi.');
    });
  }

  const selectedOrderOptions = useMemo(
    () => orderSelection.map((id) => round?.options.find((option) => option.id === id)).filter(Boolean) as ArenaOption[],
    [orderSelection, round],
  );

  if (phase === 'menu') {
    return (
      <div className="quran-memory-shell">
        <section className="quran-memory-hero">
          <div>
            <span className="quran-memory-kicker"><Sparkles size={13} /> Latihan hafalan interaktif</span>
            <h3>Arena Hafalan Qur'an</h3>
            <p>Pilih tantangan, selesaikan lima ronde, dan kuatkan ingatan ayat melalui membaca, menyusun, mengenali, serta menyimak murattal.</p>
          </div>
          <div className="quran-memory-medal"><Medal size={34} /></div>
        </section>

        <div className="quran-memory-mode-grid">
          {(Object.keys(MODE_INFO) as ArenaMode[]).map((item) => {
            const best = progress[item];
            return (
              <button key={item} type="button" className="quran-memory-mode" onClick={() => void startMode(item)}>
                <span className="quran-memory-mode-icon"><ModeIcon mode={item} /></span>
                <span>
                  <h4>{MODE_INFO[item].title}</h4>
                  <p>{MODE_INFO[item].description}</p>
                </span>
                <span className="quran-memory-best">
                  <Trophy size={12} /> {best ? `Terbaik ${best.bestScore} • ${best.bestAccuracy}% tepat` : 'Belum dimainkan'}
                </span>
              </button>
            );
          })}
        </div>
        <p className="quran-memory-draft">Materi latihan ini adalah draft edukasi. Teks, urutan ayat, dan rancangan pembelajaran perlu validasi tim tahsin/tahfidz Bright Academy sebelum rilis resmi.</p>
        <button className="hijaiyah-ghost-btn" onClick={onBack}><ArrowLeft size={15} /> Kembali ke peta</button>
      </div>
    );
  }

  if (phase === 'loading') {
    return <div className="quran-memory-loading"><div><div className="quran-memory-loader" /><b>Menyiapkan ronde hafalan...</b></div></div>;
  }

  if (phase === 'error') {
    return (
      <div className="quran-memory-result">
        <div className="quran-memory-result-inner">
          <h3>Materi belum berhasil dimuat</h3>
          <p>Periksa koneksi atau muat ulang permainan, lalu coba kembali.</p>
          <div className="quran-memory-actions">
            <button className="secondary" onClick={returnToMenu}><ArrowLeft size={15} /> Menu</button>
            <button className="primary" onClick={() => void startMode(mode)}><RotateCcw size={15} /> Coba lagi</button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'result') {
    return (
      <div className="quran-memory-result">
        <div className="quran-memory-result-inner">
          <div className="quran-memory-trophy"><Trophy size={39} /></div>
          <h3>Alhamdulillah, arena selesai!</h3>
          <p>{MODE_INFO[mode].title} sudah dituntaskan. Ulangi secara bertahap agar hafalan makin kuat.</p>
          <div className="quran-memory-result-grid">
            <div className="quran-memory-result-stat"><small>Skor</small><b>{score}</b></div>
            <div className="quran-memory-result-stat"><small>Ketepatan</small><b>{resultAccuracy}%</b></div>
            <div className="quran-memory-result-stat"><small>Streak</small><b>{bestStreak}</b></div>
          </div>
          <div className="quran-memory-actions">
            <button className="secondary" onClick={returnToMenu}><ArrowLeft size={15} /> Pilih arena</button>
            <button className="primary" onClick={() => void startMode(mode)}><RotateCcw size={15} /> Main lagi</button>
          </div>
        </div>
      </div>
    );
  }

  if (!round) return null;
  const progressWidth = `${((roundIndex + 1) / ROUND_COUNT) * 100}%`;

  return (
    <div className="quran-memory-shell">
      <div className="quran-memory-hud">
        <button className="quran-memory-back" onClick={returnToMenu} title="Kembali ke pilihan arena"><ArrowLeft size={17} /></button>
        <div className="quran-memory-progress">
          <div className="quran-memory-progress-row"><span>{MODE_INFO[mode].title}</span><span>Ronde {roundIndex + 1}/{ROUND_COUNT}</span></div>
          <div className="quran-memory-track"><span style={{ width: progressWidth }} /></div>
        </div>
        <div className="quran-memory-stat"><small>Skor</small><b>{score}</b></div>
        <div className="quran-memory-stat streak"><small>Streak</small><b>{streak}</b></div>
      </div>

      <section className={`quran-memory-stage ${feedback ?? ''}`}>
        <div className="quran-memory-prompt">
          <small>{round.title}</small>
          <h3>{round.instruction}</h3>
          {round.promptText && <p>{round.promptText}</p>}
        </div>

        {round.promptArabic && <div className="quran-memory-arabic-prompt">{round.promptArabic}</div>}

        {round.audioAyah && (
          <button className={`quran-memory-audio ${audioPlaying ? 'playing' : ''}`} onClick={playAudio}>
            {audioPlaying ? <Volume2 size={18} /> : <Play size={18} />}
            {audioPlaying ? 'Hentikan bacaan' : 'Dengarkan ayat'}
          </button>
        )}
        {audioError && <div className="quran-memory-feedback wrong">{audioError}</div>}

        {round.mode !== 'order' ? (
          <div className="quran-memory-choices">
            {round.options.map((option) => {
              const selected = selectedId === option.id;
              const reveal = !!feedback && option.id === round.correctId;
              return (
                <button
                  key={option.id}
                  type="button"
                  className={`quran-memory-choice${selected ? ` selected ${feedback ?? ''}` : ''}${reveal ? ' reveal' : ''}`}
                  onClick={() => chooseOption(option.id)}
                  disabled={!!feedback}
                >
                  <span className={option.arabic ? 'arabic' : 'latin'}>{option.primary}</span>
                  {option.meta && <span className="meta">{option.meta}</span>}
                </button>
              );
            })}
          </div>
        ) : (
          <>
            <div className="quran-memory-order-zone" aria-label="Urutan jawaban">
              {[0, 1, 2].map((slot) => {
                const option = selectedOrderOptions[slot];
                return option ? (
                  <button key={option.id} className="quran-memory-order-slot" onClick={() => removeOrderCard(option.id)}>{option.primary}</button>
                ) : (
                  <div key={slot} className="quran-memory-order-slot empty">Urutan {slot + 1}</div>
                );
              })}
            </div>
            <div className="quran-memory-order-pool">
              {round.options.map((option) => (
                <button key={option.id} className="quran-memory-order-card" onClick={() => chooseOrderCard(option.id)} disabled={orderSelection.includes(option.id) || !!feedback}>{option.primary}</button>
              ))}
            </div>
            <button className="quran-memory-check" onClick={checkOrder} disabled={orderSelection.length !== 3 || !!feedback}><Check size={17} /> Periksa urutan</button>
          </>
        )}

        {feedback && (
          <div className={`quran-memory-feedback ${feedback}`}>
            {feedback === 'correct' ? <Check size={16} /> : null}
            {feedback === 'correct' ? round.answerNote : `Belum tepat. ${round.answerNote}`}
          </div>
        )}
      </section>
    </div>
  );
}
