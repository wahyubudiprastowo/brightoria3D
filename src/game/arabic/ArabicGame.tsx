import { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  ChevronRight,
  Lightbulb,
  Lock,
  RotateCcw,
  Star,
  Volume2,
  X,
} from 'lucide-react';
import { curriculum, type CurriculumLesson, type ArabicWord } from './curriculum';
import { generateSession, getTotalWordCount, type GeneratedQuestion } from './levels';
import {
  computeMastery,
  loadEvidence,
  recordStopResult,
  saveEvidence,
  type ArabicEvidence,
} from './evidence';
import { arabicSfx } from './arabicSfx';
import { isArabicTtsAvailable, speakArabic } from './arabicTts';
import { Confetti, StreakBadge, usePunch, useStreak } from '../juice';
import ModelPreview from '../../components/world3d/ModelPreview';
import { modelUrls } from '../../components/world3d/LocalModel';
import ArabicMarketGame from './ArabicMarketGame';
import ArabicHandNumbersGame from './ArabicHandNumbersGame';
import { quranItemsByIsland, type QuranPathItem } from '../quran/quranAdventureContent';

/**
 * ArabicGame.tsx â€” Patch 25 (URUTAN ALUR DIPERBAIKI + tema per-pos untuk
 * mode Cocokkan Kartu).
 *
 * ====================================================================
 * DUA MASALAH dari feedback user atas Patch 24 (screenshot):
 * ====================================================================
 *
 * 1. "Di semua peta ada main cocok-cocokan gak dibeda-bedain per tiap
 *    level?" â€” BENAR, Patch 24 memakai ikon kartu belakang yang SAMA
 *    PERSIS (ðŸŒ´ pohon palem hijau) untuk SEMUA 16 pos kosakata, tanpa
 *    ada pembeda visual sama sekali antar kategori pelajaran.
 *
 *    PERBAIKAN: setiap pos sekarang memakai IKON PELAJARANNYA SENDIRI
 *    (mis. ðŸ“š untuk Ruang Kelas, ðŸ”¢ untuk Angka, ðŸ‘¨â€ðŸ‘©â€ðŸ‘§â€ðŸ‘¦ untuk Keluarga)
 *    sebagai sisi belakang kartu, DAN warna kartu memakai aksen warna
 *    kategori yang sama seperti di peta (siklus 5 warna: teal, coral,
 *    emas, plum, biru) â€” sehingga tiap pos terasa unik dan mudah
 *    dikenali, bukan lagi generik.
 *
 * 2. "Kayaknya main cocok-cocokan itu di last setelah pemahaman yang
 *    perkata yang pilihan" â€” user BENAR secara pedagogis. Patch 24
 *    menaruh Cocokkan Kartu SEBELUM kuis, padahal urutan yang tepat
 *    (dari beban kognitif RINGAN ke BERAT) seharusnya:
 *
 *      a. Kartu-flash (Learn)   â€” kenalan kata satu-per-satu, TANPA
 *                                  tekanan, tanpa perlu mengingat.
 *      b. Kuis pilihan ganda    â€” uji ingatan, TAPI masih dibantu opsi
 *                                  jawaban (recall BERBANTUAN).
 *      c. Cocokkan kartu        â€” ujian akhir, harus mengingat MANDIRI
 *                                  tanpa opsi bantuan sama sekali
 *                                  (recall MANDIRI, paling menantang).
 *
 *    PERBAIKAN: alur untuk 16 pos kosakata sekarang:
 *      Peta -> Intro -> Learn -> Kuis -> COCOKKAN (final) -> Hasil
 *    Pelajaran 1 (dialog salam) TETAP: Peta -> Intro -> Learn -> Kuis ->
 *    Hasil (TANPA fase cocokkan â€” kalimat dialog penuh tidak natural
 *    dipotong jadi kartu pendek untuk dicocokkan).
 * ====================================================================
 */

const STYLE_ELEMENT_ID = 'brightoria-oasis-arabic-styles-v5';
const OLD_STYLE_IDS = [
  'brightoria-oasis-arabic-styles-v2',
  'brightoria-oasis-arabic-styles-v3',
  'brightoria-oasis-arabic-styles-v4',
];
const FONT_LINK_ID = 'brightoria-oasis-arabic-font';
const quranVocabPath = quranItemsByIsland('arabic');

/** Palet warna kategori â€” di-cycle per nomor pelajaran. Sekarang juga
 *  dipakai untuk mewarnai kartu tertutup pada mode Cocokkan (Patch 25),
 *  sehingga tiap pos punya identitas visual sendiri, bukan generik. */
const ACCENTS = [
  { bg: 'linear-gradient(160deg,#e3f6f0,#c7ece0)', border: '#17856f', text: '#0f5c4c', cardBack: 'linear-gradient(160deg,#1fa084,#0d5c4c)' },
  { bg: 'linear-gradient(160deg,#ffe9df,#ffd2bd)', border: '#d9603f', text: '#8a3420', cardBack: 'linear-gradient(160deg,#e2775a,#9c3f26)' },
  { bg: 'linear-gradient(160deg,#fff3d6,#ffe2a3)', border: '#c9922f', text: '#7a5410', cardBack: 'linear-gradient(160deg,#dba83f,#8a641c)' },
  { bg: 'linear-gradient(160deg,#f3e6fb,#e4c9f5)', border: '#8b5ab5', text: '#5b3080', cardBack: 'linear-gradient(160deg,#9d72c4,#5b3080)' },
  { bg: 'linear-gradient(160deg,#e0f2fe,#bfe3f8)', border: '#2f8fc9', text: '#1a5578', cardBack: 'linear-gradient(160deg,#4aa8dc,#1a5578)' },
];
function getAccent(lessonNumber: number) {
  return ACCENTS[(lessonNumber - 1) % ACCENTS.length];
}

const OASIS_CSS = `
.oasis-overlay {
  position: fixed; inset: 0; z-index: 75; background: linear-gradient(160deg, #123a3aee, #2d1b4eee);
  backdrop-filter: blur(10px); display: grid; place-items: center; padding: 16px;
}
.oasis-shell {
  position: relative; width: min(780px, 96vw); max-height: 92vh; overflow-y: auto;
  background: #fffdf7; border-radius: 26px; padding: 26px;
  box-shadow: 0 25px 80px #0007; display: flex; flex-direction: column; gap: 16px;
  border-top: 6px solid #17856f;
  background-image:
    radial-gradient(circle at 100% 0%, #d7f3ec 0%, transparent 55%),
    radial-gradient(circle at 0% 100%, #ffe4d1 0%, transparent 55%);
}
.oasis-arabic-text { font-family: 'Noto Naskh Arabic', 'Amiri', serif; direction: rtl; }
.oasis-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
.oasis-head-title { display: flex; align-items: center; gap: 12px; }
@keyframes oasis-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
.oasis-mascot-mini { width: 56px !important; height: 56px !important; object-fit: contain; border-radius: 14px; flex-shrink: 0; animation: oasis-bob 3s ease-in-out infinite; filter: drop-shadow(0 4px 8px #17856f33); }
.oasis-head h2 { margin: 6px 0 0; color: #17403a; }
.oasis-head-actions { display: flex; gap: 8px; align-items: center; }
.oasis-ghost-small { border: 1px solid #bfe0d6; background: #fff; border-radius: 12px; padding: 8px 12px; font-size: 12px; display: inline-flex; align-items: center; gap: 6px; cursor: pointer; color: #17856f; }
.oasis-close-btn { border: 0; background: #e6f3ee; border-radius: 50%; width: 35px; height: 35px; display: grid; place-items: center; cursor: pointer; flex-shrink: 0; color: #17856f; }

.oasis-companion { display: flex; align-items: center; gap: 14px; background: linear-gradient(135deg,#e3f6f0,#fff3d6); border: 1px solid #cdeadf; border-radius: 20px; padding: 14px 18px; }
.oasis-companion-img { width: 72px !important; height: 72px !important; object-fit: contain; flex-shrink: 0; animation: oasis-bob 3.4s ease-in-out infinite; filter: drop-shadow(0 6px 10px #17856f2e); }
.oasis-companion-bubble { font-size: 13px; color: #17403a; line-height: 1.5; }
.oasis-companion-bubble b { color: #0f5c4c; }

.oasis-market-entry {
  display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 12px;
  border: 1px solid #e2c477; border-radius: 18px; padding: 14px 16px; cursor: pointer;
  background: linear-gradient(135deg,#fff7dc,#e4f6ee); color: #17403a; text-align: left;
  box-shadow: 0 8px 18px #c9922f1f; transition: transform .14s ease, box-shadow .14s ease;
}
.oasis-market-entry:hover { transform: translateY(-2px); box-shadow: 0 12px 24px #c9922f2e; }
.oasis-market-entry-icon {
  width: 58px; height: 58px; border-radius: 18px; display: grid; place-items: center;
  background: linear-gradient(145deg,#fff8df,#dff5ec); color: #b27818; box-shadow: inset 0 0 0 1px #f0d48b, 0 8px 18px #17856f1c;
  overflow: hidden; position: relative; flex-shrink: 0;
}
.oasis-market-thumb { position: relative; width: 100%; height: 100%; display: grid; place-items: center; isolation: isolate; }
.oasis-market-thumb::before { content: ''; position: absolute; inset: 7px; border-radius: 14px; background: #ffffffbd; z-index: -1; }
.oasis-market-thumb.stall::after {
  content: ''; position: absolute; left: 9px; right: 9px; top: 9px; height: 13px; border-radius: 8px 8px 3px 3px;
  background: repeating-linear-gradient(90deg,#f87171 0 8px,#fef3c7 8px 16px,#34d399 16px 24px);
  box-shadow: 0 17px 0 -6px #9a5b20, 0 24px 0 -8px #f3c861;
}
.oasis-market-thumb.stall span { position: absolute; bottom: 9px; font-size: 18px; line-height: 1; filter: drop-shadow(0 2px 2px #0002); }
.oasis-market-thumb.hand { background: radial-gradient(circle at 70% 18%,#fef3c7 0 10%,transparent 11%), linear-gradient(145deg,#11243f,#164e63); color: #fef3c7; }
.oasis-market-thumb.hand b { position: absolute; top: 9px; right: 9px; font: 900 17px Amiri, serif; color: #fde68a; }
.oasis-market-thumb.hand span { position: absolute; left: 7px; bottom: 7px; width: 27px; height: 20px; border-radius: 7px; display: grid; place-items: center; background: #fef3c7; color: #0f766e; font: 900 14px Amiri, serif; box-shadow: 0 0 0 2px #38bdf866; }
.oasis-market-thumb.hand i { position: absolute; right: 5px; bottom: 6px; font-style: normal; font-size: 24px; filter: drop-shadow(0 0 6px #38bdf8); }
.oasis-market-entry b { display: block; color: #7a5410; font-size: 14px; }
.oasis-market-entry span { display: block; color: #4c6b62; font-size: 12px; line-height: 1.4; margin-top: 2px; }
.oasis-market-entry-arrow { color: #b27818; font-weight: 900; }

.oasis-mastery-bar { display: flex; flex-direction: column; gap: 6px; font-size: 12px; color: #4c6b62; }
.oasis-mastery-track { height: 11px; background: #e3ede9; border-radius: 20px; overflow: hidden; }
.oasis-mastery-fill { display: block; height: 100%; background: linear-gradient(90deg,#198576,#f3c861); border-radius: 20px; }

.oasis-stops-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; }
.oasis-stop-card { border: 1px solid transparent; border-radius: 16px; padding: 14px 10px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 4px; position: relative; box-shadow: 0 6px 16px #0002; transition: transform 0.15s ease; cursor: pointer; }
.oasis-stop-card:not(.locked):hover { transform: translateY(-3px); box-shadow: 0 10px 22px #0003; }
.oasis-stop-card.locked { background: #eceff0 !important; color: #9aa3a0; opacity: 0.85; border-color: #dfe4e2 !important; }
.oasis-stop-number { position: absolute; top: 8px; left: 10px; font-size: 10px; font-weight: 900; opacity: 0.75; }
.oasis-stop-icon { font-size: 26px; margin-top: 6px; }
.oasis-stop-card b { font-size: 12px; }
.oasis-stop-arabic { font-size: 15px; }
.oasis-stop-stars { display: flex; gap: 2px; margin-top: 2px; }
.oasis-quran-vocab-section { display: grid; gap: 10px; margin: 0 0 14px; }
.oasis-quran-vocab-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; color: #17403a; }
.oasis-quran-vocab-head h3 { margin: 0; font-size: 16px; }
.oasis-quran-vocab-head small { color: #4c6b62; font-weight: 800; }
.oasis-quran-vocab-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 10px; }
.oasis-quran-vocab-card { border: 1px solid #cdeadf; background: linear-gradient(150deg,#ffffff,#e9f7ef); border-radius: 16px; padding: 13px; box-shadow: 0 8px 18px #17403a12; color: #17403a; text-align: left; cursor: pointer; font: inherit; width: 100%; transition: transform .16s ease, box-shadow .16s ease, border-color .16s ease; }
.oasis-quran-vocab-card:hover { transform: translateY(-2px); box-shadow: 0 12px 24px #17403a1c; border-color: #60c7ad; }
.oasis-quran-vocab-card:focus-visible { outline: 3px solid #68d6bd; outline-offset: 2px; }
.oasis-quran-vocab-card.premium { background: linear-gradient(150deg,#fff8e6,#f7ead0); border-color: #efd09a; }
.oasis-quran-vocab-badge { display: inline-flex; align-items: center; gap: 5px; width: fit-content; border-radius: 999px; padding: 4px 8px; margin-bottom: 8px; font-size: 10px; font-weight: 900; background: #dff3ea; color: #126153; }
.oasis-quran-vocab-card.premium .oasis-quran-vocab-badge { background: #ffe6b7; color: #8a5a12; }
.oasis-quran-vocab-card h4 { margin: 0 0 3px; font-size: 14px; }
.oasis-quran-vocab-card p { margin: 0 0 8px; font-size: 11px; color: #4c6b62; line-height: 1.35; }
.oasis-quran-vocab-sample { border-radius: 12px; background: #fffaf3; border: 1px solid #eadfc8; padding: 8px; text-align: center; font-size: 18px; color: #17403a; }
.oasis-quran-vocab-focus { display: block; margin-top: 8px; font-size: 11px; color: #4c6b62; line-height: 1.35; }
.oasis-quran-vocab-cta { display: inline-flex; align-items: center; gap: 4px; margin-top: 9px; font-size: 11px; font-weight: 900; color: #0f7c68; }
.oasis-quran-vocab-detail { display: grid; gap: 12px; color: #17403a; }
.oasis-quran-vocab-hero { border: 1px solid #cdeadf; border-radius: 18px; padding: 16px; background: linear-gradient(135deg,#f8fff9,#fff7df); }
.oasis-quran-vocab-hero.premium { border-color: #efd09a; background: linear-gradient(135deg,#fff8e6,#f7ead0); }
.oasis-quran-vocab-hero h3 { margin: 8px 0 4px; font-size: 22px; }
.oasis-quran-vocab-hero p { margin: 0 0 10px; color: #4c6b62; line-height: 1.45; }
.oasis-quran-vocab-source { display: block; font-size: 11px; color: #5b756d; }
.oasis-quran-vocab-lessons { display: grid; gap: 10px; }
.oasis-quran-vocab-lesson { border: 1px solid #dceee7; border-radius: 16px; padding: 14px; background: #ffffffd8; }
.oasis-quran-vocab-lesson h4 { margin: 0 0 8px; font-size: 15px; }
.oasis-quran-vocab-lesson-arabic { margin: 0 0 8px; padding: 10px; border-radius: 12px; background: #fffaf3; border: 1px solid #eadfc8; text-align: center; font-size: 24px; line-height: 1.5; }
.oasis-quran-vocab-lesson-meta { display: grid; gap: 5px; font-size: 12px; color: #4c6b62; line-height: 1.45; }
.oasis-quran-vocab-practice { margin-top: 10px; border-radius: 12px; padding: 10px; background: #e9f7ef; color: #126153; font-size: 12px; font-weight: 800; line-height: 1.45; }

.oasis-intro { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 10px; padding: 8px 4px 4px; }
.oasis-mascot-big { width: 120px !important; max-width: 120px !important; height: auto !important; object-fit: contain; margin-bottom: 4px; animation: oasis-bob 3s ease-in-out infinite; }
.oasis-intro-arabic-row { display: flex; align-items: center; justify-content: center; gap: 8px; }
.oasis-intro-arabic { font-size: 26px; color: #17403a; margin: 0; }
.oasis-intro-desc { color: #4c6b62; font-size: 13px; max-width: 440px; }
.oasis-intro-steps { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; margin: 4px 0; }
.oasis-intro-step-chip { background: #e3f6f0; border: 1px solid #cdeadf; color: #17856f; font-size: 10px; font-weight: 800; padding: 5px 10px; border-radius: 999px; display: flex; align-items: center; gap: 4px; }
.oasis-intro-stars { display: flex; gap: 6px; margin: 4px 0; }
.oasis-intro-primary { max-width: 300px; margin-top: 6px; }

.oasis-primary-btn { border: 0; background: linear-gradient(135deg,#198576,#6b3fa0); color: #fff; padding: 13px 18px; border-radius: 14px; font-weight: 900; display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; box-shadow: 0 9px 22px #17856f40; cursor: pointer; font-size: 14px; }
.oasis-primary-btn:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: none; }

.oasis-speak-btn { border: 1px solid #bfe0d6; background: #fff; color: #17856f; border-radius: 999px; width: 38px; height: 38px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; transition: transform 0.12s ease; }
.oasis-speak-btn:active { transform: scale(0.92); }

.oasis-learn { display: flex; flex-direction: column; gap: 14px; align-items: center; }
.oasis-learn-progress { font-size: 12px; color: #4c6b62; text-align: center; }
.oasis-learn-dots { display: flex; gap: 5px; justify-content: center; flex-wrap: wrap; max-width: 320px; }
.oasis-learn-dot { width: 8px; height: 8px; border-radius: 50%; background: #cdeadf; }
.oasis-learn-dot.done { background: #17856f; }
.oasis-learn-dot.current { background: #f3c861; transform: scale(1.3); }
.oasis-flashcard { width: 100%; max-width: 340px; min-height: 260px; background: linear-gradient(160deg, #e3f6f0, #d3efe4); border-radius: 24px; padding: 28px 20px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; box-shadow: 0 14px 30px #17856f22; border: 2px solid #cdeadf; cursor: pointer; animation: oasis-card-in 0.35s ease; }
@keyframes oasis-card-in { 0% { opacity: 0; transform: translateY(10px) scale(0.96); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
.oasis-flashcard-emoji { font-size: 64px; line-height: 1; }
.oasis-flashcard-arabic-row { display: flex; align-items: center; justify-content: center; gap: 10px; margin: 4px 0; }
.oasis-flashcard-arabic { font-size: 36px; color: #17403a; }
.oasis-flashcard-translit { font-size: 14px; color: #4c8a78; font-style: italic; }
.oasis-flashcard-meaning { margin-top: 6px; background: #fff; border-radius: 12px; padding: 8px 16px; font-size: 15px; font-weight: 700; color: #14624f; border: 1px solid #d7ecdf; }
.oasis-flashcard-tap-hint { font-size: 10px; color: #6ba593; margin-top: 4px; }
.oasis-flashcard-question { font-size: 15px; color: #4c6b62; margin-bottom: 4px; }
.oasis-learn-nav { display: flex; align-items: center; gap: 14px; }
.oasis-learn-nav-btn { border: 0; background: #d3efe4; color: #17856f; border-radius: 50%; width: 44px; height: 44px; display: grid; place-items: center; cursor: pointer; }
.oasis-learn-nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.oasis-learn-actions { display: flex; gap: 10px; width: 100%; max-width: 340px; }

/* --- Cocokkan Kartu (Patch 25: sekarang di akhir, bertema per-pos) --- */
.oasis-match { display: flex; flex-direction: column; gap: 12px; align-items: center; }
.oasis-match-banner { background: linear-gradient(135deg,#fff3d6,#ffe2a3); border: 1px solid #e6c877; border-radius: 16px; padding: 12px 16px; text-align: center; font-size: 12px; color: #7a5410; max-width: 460px; }
.oasis-match-banner b { color: #5c3d0a; }
.oasis-match-info { font-size: 12px; color: #4c6b62; text-align: center; }
.oasis-match-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; width: 100%; max-width: 460px; }
.oasis-match-card { aspect-ratio: 1 / 1; border: 0; border-radius: 14px; cursor: pointer; position: relative; box-shadow: 0 4px 10px #0002; display: flex; align-items: center; justify-content: center; padding: 4px; transition: transform 0.15s ease; }
.oasis-match-card:disabled { cursor: default; }
.oasis-match-card .oasis-match-back { font-size: 24px; }
.oasis-match-card .oasis-match-front { display: none; flex-direction: column; align-items: center; gap: 2px; }
.oasis-match-card.revealed { background: #fff !important; border: 2px solid #f3c861; animation: oasis-flip-in 0.25s ease; }
.oasis-match-card.revealed .oasis-match-back { display: none; }
.oasis-match-card.revealed .oasis-match-front { display: flex; }
.oasis-match-card.matched { background: linear-gradient(160deg,#fff3d6,#ffe2a3) !important; border: 2px solid #c9922f; opacity: 0.85; }
.oasis-match-card.matched .oasis-match-back { display: none; }
.oasis-match-card.matched .oasis-match-front { display: flex; }
@keyframes oasis-flip-in { 0% { transform: scale(0.85); } 60% { transform: scale(1.06); } 100% { transform: scale(1); } }
.oasis-match-front-emoji { font-size: 26px; }
.oasis-match-front-word { font-size: 14px; color: #17403a; line-height: 1.1; }
.oasis-match-front-translit { font-size: 8px; color: #8a7020; }
.oasis-match-complete { display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center; padding: 10px 0; }
.oasis-match-complete-icon { width: 100px; animation: oasis-bob 2.4s ease-in-out infinite; }
.oasis-match-stat { font-size: 12px; color: #4c6b62; }
.oasis-match-actions { display: flex; gap: 10px; width: 100%; max-width: 340px; }
.oasis-match-actions .oasis-ghost-btn { flex: 1; justify-content: center; }
.oasis-match-actions .oasis-primary-btn { flex: 2; }

.oasis-session { display: flex; flex-direction: column; gap: 14px; }
.oasis-progress-row { display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #4c6b62; }
.oasis-prompt-card { background: linear-gradient(160deg, #e3f6f0, #d3efe4); border-radius: 18px; padding: 26px 16px; text-align: center; border: 1px solid #cdeadf; }
.oasis-prompt-emoji { font-size: 48px; margin-bottom: 6px; }
.oasis-prompt-arabic-row { display: flex; align-items: center; justify-content: center; gap: 10px; }
.oasis-prompt-main { font-size: 30px; line-height: 1.4; color: #17403a; }
.oasis-prompt-plain { font-size: 20px; color: #17403a; font-weight: 700; }
.oasis-prompt-sub { margin-top: 8px; font-size: 13px; color: #4c8a78; font-style: italic; }

.oasis-options { display: grid; grid-template-columns: 1fr; gap: 10px; }
.oasis-options.grid2 { grid-template-columns: repeat(2, 1fr); }
.oasis-option { border: 2px solid #d7ecdf; background: #fff; border-radius: 16px; padding: 14px 16px; text-align: center; font-size: 16px; cursor: pointer; width: 100%; transition: transform 0.1s ease; display: flex; flex-direction: column; align-items: center; gap: 6px; min-height: 64px; justify-content: center; }
.oasis-option:not(:disabled):hover { transform: translateY(-2px); border-color: #9ecdbb; box-shadow: 0 6px 14px #17856f1a; }
.oasis-option-emoji { font-size: 34px; }
.oasis-option-arabic { font-size: 22px; color: #17403a; }
.oasis-option-translit { font-size: 11px; color: #6b8c80; }
.oasis-option.correct { background: #dff3ea; border-color: #198576; color: #14624f; }
.oasis-option.wrong { background: #fbe6e2; border-color: #c0492f; color: #8a331f; }

.oasis-feedback { border-radius: 12px; padding: 12px 14px; font-size: 13px; background: #e3f6f0; color: #17403a; }
.oasis-feedback.success { background: #dff3ea; color: #198576; }
.oasis-feedback.mismatch { background: #fbe6e2; color: #a13a26; }
.oasis-hint { background: #fff3cd; border: 1px solid #edcc6d; border-radius: 12px; padding: 10px 14px; font-size: 13px; color: #6b5010; }

.oasis-actions { display: flex; justify-content: flex-end; gap: 10px; }
.oasis-ghost-btn { border: 1px solid #bfe0d6; background: #fff; border-radius: 12px; padding: 11px 14px; display: flex; align-items: center; gap: 6px; font-size: 13px; cursor: pointer; color: #17856f; }

.oasis-result { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 10px; padding: 10px 0 4px; }
.oasis-stars-big { display: flex; gap: 6px; margin: 6px 0; }
.oasis-result-actions { display: flex; gap: 10px; width: 100%; margin-top: 8px; }
.oasis-result-actions .oasis-ghost-btn { flex: 1; justify-content: center; }
.oasis-result-actions .oasis-primary-btn { flex: 2; }

.oasis-collection-header { display: flex; align-items: center; gap: 12px; }
.oasis-backpack-icon { width: 52px !important; max-width: 52px !important; height: auto !important; object-fit: contain; flex-shrink: 0; }
.oasis-collection-note { font-size: 12px; color: #4c6b62; }
.oasis-collection-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 8px; max-height: 55vh; overflow-y: auto; }
.oasis-word-card { background: linear-gradient(160deg,#e3f6f0,#d3efe4); border: 1px solid #cdeadf; border-radius: 12px; padding: 10px 6px; text-align: center; min-height: 96px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; }
.oasis-word-card.locked { background: #eceff0; border-color: #dfe4e2; color: #9aa3a0; }
.oasis-word-emoji { font-size: 24px; }
.oasis-word-card b { font-size: 16px; color: #17403a; }
.oasis-word-card span { font-size: 10px; color: #4c8a78; }

@media (max-width: 700px) {
  .oasis-shell { padding: 18px; }
  .oasis-prompt-main { font-size: 24px; }
  .oasis-flashcard-arabic { font-size: 30px; }
  .oasis-stops-grid { grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); }
  .oasis-mascot-big { width: 90px !important; max-width: 90px !important; }
  .oasis-options.grid2 { grid-template-columns: 1fr; }
  .oasis-match-grid { grid-template-columns: repeat(3, 1fr); }
  .oasis-companion { flex-direction: column; text-align: center; }
  .oasis-market-entry { grid-template-columns: auto 1fr; }
  .oasis-market-entry-arrow { display: none; }
}
`;

function useInjectOasisStyles() {
  useEffect(() => {
    if (!document.getElementById(FONT_LINK_ID)) {
      const link = document.createElement('link');
      link.id = FONT_LINK_ID;
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Noto+Naskh+Arabic:wght@400;500;600;700&display=swap';
      document.head.appendChild(link);
    }
    OLD_STYLE_IDS.forEach((id) => document.getElementById(id)?.remove());
    if (!document.getElementById(STYLE_ELEMENT_ID)) {
      const styleEl = document.createElement('style');
      styleEl.id = STYLE_ELEMENT_ID;
      styleEl.textContent = OASIS_CSS;
      document.head.appendChild(styleEl);
    }
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

type View = 'map' | 'intro' | 'learn' | 'match' | 'session' | 'result' | 'collection' | 'market' | 'handNumbers' | 'quranVocabDetail';

interface LearnCard {
  emoji: string;
  arabic: string;
  translit: string;
  meaning: string;
  isDialogue?: boolean;
  questionMeaning?: string;
}

function buildLearnCards(lesson: CurriculumLesson): LearnCard[] {
  if (lesson.kind === 'dialogue') {
    return (lesson.dialogues ?? []).map((d) => ({
      emoji: 'ðŸ’¬',
      arabic: d.answer.arabic,
      translit: d.answer.translit,
      meaning: d.answer.meaning,
      isDialogue: true,
      questionMeaning: `${d.question.arabic}  â€”  ${d.question.meaning}`,
    }));
  }
  return (lesson.words ?? []).map((w) => ({ emoji: w.emoji, arabic: w.arabic, translit: w.translit, meaning: w.meaning }));
}

interface MatchCard {
  cardId: string;
  wordId: string;
  kind: 'emoji' | 'word';
  emoji?: string;
  arabic?: string;
  translit?: string;
}

function buildMatchCards(words: ArabicWord[]): MatchCard[] {
  const maxPairs = 6;
  const chosen = words.length > maxPairs ? shuffleArr(words).slice(0, maxPairs) : words;
  const cards: MatchCard[] = [];
  chosen.forEach((w) => {
    cards.push({ cardId: `${w.id}-emoji`, wordId: w.id, kind: 'emoji', emoji: w.emoji });
    cards.push({ cardId: `${w.id}-word`, wordId: w.id, kind: 'word', arabic: w.arabic, translit: w.translit });
  });
  return shuffleArr(cards);
}

function isStopUnlocked(index: number, evidence: ArabicEvidence): boolean {
  if (index === 0) return true;
  const prevLesson = curriculum[index - 1];
  const prevProgress = evidence.stops[prevLesson.id];
  return !!prevProgress && prevProgress.stars >= 1;
}

function QuranVocabDetail({ item, onBack }: { item: QuranPathItem; onBack: () => void }) {
  return (
    <div className="oasis-quran-vocab-detail">
      <section className={'oasis-quran-vocab-hero ' + item.tier}>
        <span className="oasis-quran-vocab-badge">
          {item.tier === 'premium' && <Lock size={11} />}
          {item.badge}
        </span>
        <h3>{item.title}</h3>
        <p>{item.focus}</p>
        <div className="oasis-quran-vocab-sample oasis-arabic-text">{item.sample}</div>
        <span className="oasis-quran-vocab-source">{item.sourceNote} Konten ini masih draft untuk review akademik Bright Academy.</span>
      </section>
      <div className="oasis-quran-vocab-lessons">
        {item.lessons.map((lesson) => (
          <article key={lesson.id} className="oasis-quran-vocab-lesson">
            <h4>{lesson.title}</h4>
            {lesson.arabic && <div className="oasis-quran-vocab-lesson-arabic oasis-arabic-text">{lesson.arabic}</div>}
            <div className="oasis-quran-vocab-lesson-meta">
              {lesson.latin && <span><b>Bacaan:</b> {lesson.latin}</span>}
              {lesson.meaning && <span><b>Makna:</b> {lesson.meaning}</span>}
              <span><b>Catatan:</b> {lesson.note}</span>
            </div>
            <div className="oasis-quran-vocab-practice">Latihan: {lesson.practice}</div>
          </article>
        ))}
      </div>
      <button className="oasis-ghost-btn" onClick={onBack}>Kembali ke peta</button>
    </div>
  );
}

export default function ArabicGame({
  onExit,
  onXpEarned,
}: {
  onExit: () => void;
  onXpEarned: (amount: number) => void;
}) {
  useInjectOasisStyles();
  const ttsAvailable = useTtsAvailability();

  const [view, setView] = useState<View>('map');
  const [evidence, setEvidence] = useState<ArabicEvidence>(() => loadEvidence());
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [activeQuranVocabId, setActiveQuranVocabId] = useState<string | null>(null);

  const [learnCards, setLearnCards] = useState<LearnCard[]>([]);
  const [learnIndex, setLearnIndex] = useState(0);
  const [cardFlipped, setCardFlipped] = useState(false);
  const [seenAll, setSeenAll] = useState(false);

  // --- Cocokkan Kartu â€” Patch 25: sekarang dijalankan SETELAH kuis,
  // sebagai ujian akhir (final mastery check), bukan lagi di awal. ---
  const [matchCards, setMatchCards] = useState<MatchCard[]>([]);
  const [flippedIds, setFlippedIds] = useState<string[]>([]);
  const [matchedWordIds, setMatchedWordIds] = useState<Set<string>>(new Set());
  const [matchMoves, setMatchMoves] = useState(0);
  const [matchLocked, setMatchLocked] = useState(false);
  const [matchDone, setMatchDone] = useState(false);

  const [session, setSession] = useState<GeneratedQuestion[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [correctIds, setCorrectIds] = useState<string[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [confettiTick, setConfettiTick] = useState(0);
  const [lastResult, setLastResult] = useState<{ stars: 0 | 1 | 2 | 3; correct: number; total: number } | null>(null);

  const { streak, register: registerStreak, reset: resetStreak } = useStreak();
  const feedbackPunch = usePunch(revealed ? (picked === session[qIndex]?.correctIndex ? 'ok' : 'no') : 'idle');

  const overallMastery = useMemo(() => computeMastery(evidence, curriculum.length), [evidence]);
  const totalWordCount = useMemo(() => getTotalWordCount(), []);

  function goToIntro(lessonId: string) {
    arabicSfx.click();
    setActiveLessonId(lessonId);
    setView('intro');
  }

  function startLearn(lessonId: string) {
    const lesson = curriculum.find((l) => l.id === lessonId);
    if (!lesson) return;
    const cards = buildLearnCards(lesson);
    setLearnCards(cards);
    setLearnIndex(0);
    setCardFlipped(false);
    setSeenAll(cards.length <= 1);
    setView('learn');
  }

  function flipCard() {
    arabicSfx.flip();
    setCardFlipped((f) => !f);
  }

  function nextCard() {
    arabicSfx.step();
    if (learnIndex + 1 < learnCards.length) {
      setLearnIndex(learnIndex + 1);
      setCardFlipped(false);
      if (learnIndex + 2 >= learnCards.length) setSeenAll(true);
    }
  }

  function prevCard() {
    arabicSfx.step();
    if (learnIndex > 0) {
      setLearnIndex(learnIndex - 1);
      setCardFlipped(false);
    }
  }

  function startMatch(lessonId: string) {
    const lesson = curriculum.find((l) => l.id === lessonId);
    if (!lesson || !lesson.words) return;
    setMatchCards(buildMatchCards(lesson.words));
    setFlippedIds([]);
    setMatchedWordIds(new Set());
    setMatchMoves(0);
    setMatchLocked(false);
    setMatchDone(false);
    setView('match');
  }

  function handleMatchCardClick(card: MatchCard) {
    if (matchLocked) return;
    if (matchedWordIds.has(card.wordId)) return;
    if (flippedIds.includes(card.cardId)) return;
    if (flippedIds.length >= 2) return;

    const nextFlipped = [...flippedIds, card.cardId];
    setFlippedIds(nextFlipped);

    if (nextFlipped.length === 2) {
      setMatchLocked(true);
      setMatchMoves((m) => m + 1);
      const [aId, bId] = nextFlipped;
      const a = matchCards.find((c) => c.cardId === aId)!;
      const b = matchCards.find((c) => c.cardId === bId)!;
      const isMatch = a.wordId === b.wordId && a.kind !== b.kind;

      if (isMatch) {
        arabicSfx.correct();
        const isNewWord = !evidence.collectedWords.includes(a.wordId);
        if (isNewWord) setTimeout(() => arabicSfx.collect(), 150);
        setTimeout(() => {
          setMatchedWordIds((prev) => {
            const next = new Set(prev);
            next.add(a.wordId);
            return next;
          });
          setFlippedIds([]);
          setMatchLocked(false);
        }, 450);
      } else {
        arabicSfx.wrong();
        setTimeout(() => {
          setFlippedIds([]);
          setMatchLocked(false);
        }, 750);
      }
    }
  }

  useEffect(() => {
    if (view !== 'match' || matchCards.length === 0 || matchDone) return;
    const totalPairs = matchCards.length / 2;
    if (matchedWordIds.size === totalPairs) {
      setMatchDone(true);
      arabicSfx.complete();
      setConfettiTick((n) => n + 1);
      onXpEarned(15);
      const wordIds = Array.from(matchedWordIds);
      const nextEvidence: ArabicEvidence = {
        ...evidence,
        collectedWords: Array.from(new Set([...evidence.collectedWords, ...wordIds])),
        updatedAt: new Date().toISOString(),
      };
      setEvidence(nextEvidence);
      saveEvidence(nextEvidence);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchedWordIds, matchCards, view, matchDone]);

  function startSession(lessonId: string) {
    const generated = generateSession(lessonId);
    setSession(generated);
    setQIndex(0);
    setPicked(null);
    setRevealed(false);
    setCorrectIds([]);
    setCorrectCount(0);
    setShowHint(false);
    resetStreak();
    setView('session');
  }

  function choose(optionIndex: number) {
    if (revealed) return;
    const q = session[qIndex];
    const isCorrect = optionIndex === q.correctIndex;
    setPicked(optionIndex);
    setRevealed(true);
    registerStreak(isCorrect);
    if (isCorrect) {
      const isNewWord = !evidence.collectedWords.includes(q.wordId);
      arabicSfx.correct();
      if (isNewWord) setTimeout(() => arabicSfx.collect(), 180);
      setConfettiTick((n) => n + 1);
      setCorrectCount((c) => c + 1);
      setCorrectIds((ids) => [...ids, q.wordId]);
    } else {
      arabicSfx.wrong();
    }
  }

  function nextQuestion() {
    arabicSfx.step();
    if (qIndex + 1 < session.length) {
      setQIndex(qIndex + 1);
      setPicked(null);
      setRevealed(false);
      setShowHint(false);
    } else {
      finishSession();
    }
  }

  /**
   * finishSession â€” Patch 25: TITIK KUNCI perubahan urutan alur.
   * Sebelumnya (Patch 24) selalu langsung setView('result') setelah kuis.
   * Sekarang: untuk pelajaran KOSAKATA (bukan dialog), alih-alih langsung
   * ke hasil, arahkan dulu ke fase Cocokkan Kartu sebagai UJIAN AKHIR.
   * Bintang & XP kuis TETAP dihitung & disimpan di sini (tidak berubah),
   * hanya TAMPILAN hasil yang ditunda sampai mode cocokkan selesai.
   */
  function finishSession() {
    if (!activeLessonId) return;
    const lesson = curriculum.find((l) => l.id === activeLessonId);
    const next = recordStopResult(evidence, activeLessonId, correctCount, session.length, correctIds);
    setEvidence(next);
    saveEvidence(next);
    const stars = next.stops[activeLessonId].stars;
    setLastResult({ stars, correct: correctCount, total: session.length });
    const xpGain = 10 + stars * 10;
    onXpEarned(xpGain);
    if (stars === 3) {
      arabicSfx.complete();
      setConfettiTick((n) => n + 1);
    } else {
      arabicSfx.star();
    }

    const isVocabWithEnoughWords = lesson?.kind === 'vocab' && (lesson.words?.length ?? 0) >= 2;
    if (isVocabWithEnoughWords) {
      startMatch(activeLessonId); // ujian akhir, BUKAN langsung ke hasil
    } else {
      setView('result'); // pelajaran dialog: tidak ada fase cocokkan
    }
  }

  function backToMap() {
    arabicSfx.click();
    setView('map');
    setActiveLessonId(null);
    setActiveQuranVocabId(null);
  }

  function openQuranVocabDetail(item: QuranPathItem) {
    arabicSfx.click();
    setActiveQuranVocabId(item.id);
    setView('quranVocabDetail');
  }

  function tryLocked() {
    arabicSfx.locked();
  }

  function handleSpeak(text: string, e?: React.MouseEvent) {
    e?.stopPropagation();
    speakArabic(text);
  }

  const currentQuestion = session[qIndex];
  const activeLesson = curriculum.find((l) => l.id === activeLessonId);
  const activeQuranVocab = activeQuranVocabId ? quranVocabPath.find((item) => item.id === activeQuranVocabId) ?? null : null;
  const activeAccent = activeLesson ? getAccent(activeLesson.lessonNumber) : ACCENTS[0];
  const activeProgress = activeLessonId ? evidence.stops[activeLessonId] : undefined;
  const collectedCount = evidence.collectedWords.length;
  const currentCard = learnCards[learnIndex];
  const isMeaningToWordQuiz = currentQuestion?.kind === 'meaning-to-word';
  const isDialogueQuiz = currentQuestion?.kind === 'dialogue-response';
  const promptIsArabic = currentQuestion && !isMeaningToWordQuiz;

  const companionText =
    overallMastery === 0
      ? 'Halo, aku rubah penjelajahmu! Ayo kita mulai dari Pos 1 dan jelajahi oasis bersama.'
      : overallMastery < 40
      ? 'Ayo terus semangat! Setiap pos yang kamu selesaikan membuka jalan ke pos berikutnya.'
      : overallMastery < 80
      ? 'Kerja bagus! Kamu sudah menjelajahi banyak oasis. Terus lanjutkan petualanganmu!'
      : 'Luar biasa! Kamu hampir menguasai seluruh perjalanan Bahasa Arab ini!';

  return (
    <div className="oasis-overlay">
      <div className="oasis-shell">
        <Confetti trigger={confettiTick} />

        <header className="oasis-head">
          <div className="oasis-head-title">
            <img src="/assets/arabic/fox-explorer.webp" alt="" className="oasis-mascot-mini" />
            <div>
              <span className="chip">Oasis Bahasa Arab</span>
              <h2>
                {view === 'map' && 'Rihlah â€” Perjalanan 17 Pos'}
                {view === 'intro' && activeLesson?.title}
                {view === 'learn' && `Belajar: ${activeLesson?.title}`}
                {view === 'match' && `Ujian Akhir: ${activeLesson?.title}`}
                {view === 'session' && activeLesson?.title}
                {view === 'result' && 'Hasil Perjalanan'}
                {view === 'collection' && 'Buku Koleksi Kosakata'}
                {view === 'market' && 'Pasar Kata Arab'}
                {view === 'handNumbers' && 'AI Angka Arab & Surat'}
                {view === 'quranVocabDetail' && (activeQuranVocab?.title ?? 'Mufrodat Qur\'an')}
              </h2>
            </div>
          </div>
          <div className="oasis-head-actions">
            {(view === 'session' || view === 'intro' || view === 'learn' || view === 'match' || view === 'market' || view === 'handNumbers' || view === 'quranVocabDetail') && (
              <button className="oasis-ghost-small" onClick={backToMap}>
                Peta
              </button>
            )}
            {view === 'map' && (
              <button className="oasis-ghost-small" onClick={() => { arabicSfx.click(); setView('collection'); }}>
                <BookOpen size={14} /> Koleksi ({collectedCount}/{totalWordCount})
              </button>
            )}
            {view === 'collection' && (
              <button className="oasis-ghost-small" onClick={backToMap}>
                Peta
              </button>
            )}
            <button className="oasis-close-btn" onClick={() => { arabicSfx.click(); onExit(); }}>
              <X size={16} />
            </button>
          </div>
        </header>

        {view === 'map' && (
          <div className="oasis-map">
            <div className="oasis-companion">
              <img src="/assets/arabic/fox-explorer.webp" alt="Maskot rubah" className="oasis-companion-img" />
              <div className="oasis-companion-bubble">
                <b>Halo, aku temanmu menjelajah oasis!</b>
                <br />
                {companionText}
              </div>
            </div>

            <button className="oasis-market-entry" onClick={() => { arabicSfx.click(); setView('market'); }}>
              <span className="oasis-market-entry-icon">
                <span className="oasis-market-thumb stall" aria-hidden="true">
                  <span>&#1587;&#1608;&#1602;</span>
                </span>
              </span>
              <span>
                <b>Pasar Kata Arab</b>
                <span>Layani pembeli, dengarkan kata Arab, lalu pilih barang yang benar.</span>
              </span>
              <span className="oasis-market-entry-arrow">&rsaquo;</span>
            </button>

            <button className="oasis-market-entry" onClick={() => { arabicSfx.click(); setView('handNumbers'); }}>
              <span className="oasis-market-entry-icon">
                <span className="oasis-market-thumb hand" aria-hidden="true">
                  <b>&#1633;&#1632;</b>
                  <span>&#1633;</span>
                  <i>&#9995;</i>
                </span>
              </span>
              <span>
                <b>AI Angka Arab & Surat</b>
                <span>Cubit kartu dengan kamera tangan: cocokkan angka, lalu lanjut sambung surat pendek.</span>
              </span>
              <span className="oasis-market-entry-arrow">&rsaquo;</span>
            </button>

            <section className="oasis-quran-vocab-section" aria-label="Materi mufrodat Qur'an">
              <div className="oasis-quran-vocab-head">
                <h3>Mufrodat Qur'an</h3>
                <small>Free trial dan lanjutan premium</small>
              </div>
              <div className="oasis-quran-vocab-grid">
                {quranVocabPath.map((item) => (
                  <button key={item.id} type="button" className={'oasis-quran-vocab-card ' + item.tier} onClick={() => openQuranVocabDetail(item)}>
                    <span className="oasis-quran-vocab-badge">
                      {item.tier === 'premium' && <Lock size={11} />}
                      {item.badge}
                    </span>
                    <h4>{item.title}</h4>
                    <p>{item.subtitle}</p>
                    <div className="oasis-quran-vocab-sample oasis-arabic-text">{item.sample}</div>
                    <span className="oasis-quran-vocab-focus">{item.focus}</span>
                    <span className="oasis-quran-vocab-cta">{item.cta} <ChevronRight size={13} /></span>
                  </button>
                ))}
              </div>
            </section>

            <div className="oasis-mastery-bar">
              <div className="oasis-mastery-track">
                <span className="oasis-mastery-fill" style={{ width: `${overallMastery}%` }} />
              </div>
              <span>{overallMastery}% mastery keseluruhan &bull; ikuti jejak rubah dari pos 1</span>
            </div>
            <ModelPreview url={modelUrls.arabic} image="/assets/worlds/04_oasis_bahasa_arab.webp" label="Pulau Bahasa Arab 3D" />
            <div className="oasis-stops-grid">
              {curriculum.map((lesson, i) => {
                const progress = evidence.stops[lesson.id];
                const unlocked = isStopUnlocked(i, evidence);
                const accent = getAccent(lesson.lessonNumber);
                return (
                  <button
                    key={lesson.id}
                    className={'oasis-stop-card' + (unlocked ? '' : ' locked')}
                    style={unlocked ? { background: accent.bg, borderColor: accent.border } : undefined}
                    onClick={() => (unlocked ? goToIntro(lesson.id) : tryLocked())}
                  >
                    <span className="oasis-stop-number" style={unlocked ? { color: accent.text } : undefined}>
                      {lesson.lessonNumber}
                    </span>
                    <span className="oasis-stop-icon">{unlocked ? lesson.icon : <Lock size={18} />}</span>
                    <b style={unlocked ? { color: accent.text } : undefined}>{lesson.title}</b>
                    <span className="oasis-stop-arabic oasis-arabic-text" style={unlocked ? { color: accent.text } : undefined}>
                      {lesson.arabicTitle}
                    </span>
                    <span className="oasis-stop-stars">
                      {[1, 2, 3].map((s) => (
                        <Star key={s} size={14} fill={progress && progress.stars >= s ? '#f3c861' : 'none'} color="#f3c861" />
                      ))}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {view === 'quranVocabDetail' && activeQuranVocab && (
          <QuranVocabDetail item={activeQuranVocab} onBack={backToMap} />
        )}

        {view === 'market' && (
          <ArabicMarketGame
            evidence={evidence}
            setEvidence={setEvidence}
            ttsAvailable={ttsAvailable}
            onBack={backToMap}
            onXpEarned={onXpEarned}
            onSpeak={handleSpeak}
            onConfetti={() => setConfettiTick((n) => n + 1)}
          />
        )}

        {view === 'handNumbers' && (
          <ArabicHandNumbersGame
            onBack={backToMap}
            onXpEarned={onXpEarned}
            onConfetti={() => setConfettiTick((n) => n + 1)}
          />
        )}

        {view === 'intro' && activeLesson && (
          <div className="oasis-intro">
            <img src="/assets/arabic/fox-explorer.webp" alt="Rubah penjelajah" className="oasis-mascot-big" />
            <span className="chip">Pos {activeLesson.lessonNumber} dari {curriculum.length}</span>
            <h3>{activeLesson.title}</h3>
            <div className="oasis-intro-arabic-row">
              <p className="oasis-intro-arabic oasis-arabic-text">{activeLesson.arabicTitle}</p>
              {ttsAvailable && (
                <button className="oasis-speak-btn" onClick={(e) => handleSpeak(activeLesson.arabicTitle, e)} aria-label="Dengarkan">
                  <Volume2 size={16} />
                </button>
              )}
            </div>

            {activeLesson.kind === 'vocab' ? (
              <div className="oasis-intro-steps">
                <span className="oasis-intro-step-chip">1ï¸âƒ£ Belajar kata</span>
                <span className="oasis-intro-step-chip">2ï¸âƒ£ Kuis pilihan</span>
                <span className="oasis-intro-step-chip">3ï¸âƒ£ Cocokkan (ujian akhir)</span>
              </div>
            ) : (
              <div className="oasis-intro-steps">
                <span className="oasis-intro-step-chip">1ï¸âƒ£ Belajar dialog</span>
                <span className="oasis-intro-step-chip">2ï¸âƒ£ Kuis dialog</span>
              </div>
            )}

            <p className="oasis-intro-desc">
              {activeLesson.kind === 'dialogue'
                ? 'Yuk kenalan dulu dengan cara menyapa dalam Bahasa Arab! Pelajari setiap kalimat, baru coba tantangannya.'
                : `Pelajari dulu ${(activeLesson.words ?? []).length} kata baru satu per satu, uji dengan kuis, lalu tutup dengan permainan mencocokkan sebagai ujian akhir!`}
            </p>
            {activeProgress && (
              <div className="oasis-intro-stars">
                {[1, 2, 3].map((s) => (
                  <Star key={s} size={22} fill={activeProgress.stars >= s ? '#f3c861' : 'none'} color="#f3c861" />
                ))}
              </div>
            )}
            <button className="oasis-primary-btn oasis-intro-primary" onClick={() => activeLessonId && startLearn(activeLessonId)}>
              {activeProgress ? 'Belajar lagi' : 'Ayo belajar dulu!'} <ChevronRight size={16} />
            </button>
          </div>
        )}

        {view === 'learn' && currentCard && (
          <div className="oasis-learn">
            <div className="oasis-learn-progress">Kartu {learnIndex + 1} dari {learnCards.length}</div>
            <div className="oasis-learn-dots">
              {learnCards.map((_, i) => (
                <span key={i} className={'oasis-learn-dot' + (i < learnIndex ? ' done' : '') + (i === learnIndex ? ' current' : '')} />
              ))}
            </div>

            <div className="oasis-flashcard" onClick={flipCard}>
              {currentCard.isDialogue && <div className="oasis-flashcard-question oasis-arabic-text">{currentCard.questionMeaning}</div>}
              <div className="oasis-flashcard-emoji">{currentCard.emoji}</div>
              <div className="oasis-flashcard-arabic-row">
                <div className="oasis-flashcard-arabic oasis-arabic-text">{currentCard.arabic}</div>
                {ttsAvailable && (
                  <button className="oasis-speak-btn" onClick={(e) => handleSpeak(currentCard.arabic, e)} aria-label="Dengarkan">
                    <Volume2 size={16} />
                  </button>
                )}
              </div>
              <div className="oasis-flashcard-translit">{currentCard.translit}</div>
              {cardFlipped ? (
                <div className="oasis-flashcard-meaning">{currentCard.meaning}</div>
              ) : (
                <div className="oasis-flashcard-tap-hint">Ketuk kartu untuk lihat artinya</div>
              )}
            </div>

            <div className="oasis-learn-nav">
              <button className="oasis-learn-nav-btn" onClick={prevCard} disabled={learnIndex === 0}>â€¹</button>
              <button className="oasis-learn-nav-btn" onClick={nextCard} disabled={learnIndex + 1 >= learnCards.length}>â€º</button>
            </div>

            <div className="oasis-learn-actions">
              <button className="oasis-primary-btn" disabled={!seenAll} onClick={() => activeLessonId && startSession(activeLessonId)}>
                {seenAll ? 'Aku siap, mulai kuis!' : `Lihat ${learnCards.length - learnIndex - 1} kartu lagi dulu`}
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {view === 'match' && !matchDone && (
          <div className="oasis-match">
            <div className="oasis-match-banner">
              <b>Ujian akhir!</b> Kamu sudah belajar dan mengerjakan kuis â€” sekarang buktikan kamu benar-benar ingat dengan mencocokkan semua pasangan, tanpa bantuan pilihan jawaban.
            </div>
            <div className="oasis-match-info">
              {matchedWordIds.size} dari {matchCards.length / 2} pasang &bull; {matchMoves} percobaan
            </div>
            <div className="oasis-match-grid">
              {matchCards.map((card) => {
                const isFlipped = flippedIds.includes(card.cardId);
                const isMatched = matchedWordIds.has(card.wordId);
                const revealedCard = isFlipped || isMatched;
                return (
                  <button
                    key={card.cardId}
                    className={'oasis-match-card' + (revealedCard ? ' revealed' : '') + (isMatched ? ' matched' : '')}
                    style={!revealedCard ? { background: activeAccent.cardBack } : undefined}
                    onClick={() => handleMatchCardClick(card)}
                    disabled={isMatched}
                  >
                    <span className="oasis-match-back">{activeLesson?.icon ?? 'ðŸŒ´'}</span>
                    <span className="oasis-match-front">
                      {card.kind === 'emoji' ? (
                        <span className="oasis-match-front-emoji">{card.emoji}</span>
                      ) : (
                        <>
                          <span className="oasis-match-front-word oasis-arabic-text">{card.arabic}</span>
                          <span className="oasis-match-front-translit">{card.translit}</span>
                        </>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {view === 'match' && matchDone && (
          <div className="oasis-match-complete">
            <img src="/assets/arabic/fox-explorer.webp" alt="" className="oasis-match-complete-icon juice-portal-win" />
            <h3>Ujian akhir selesai!</h3>
            <p className="oasis-match-stat">Kamu berhasil mencocokkan semua dalam {matchMoves} percobaan &bull; +15 XP</p>
            <div className="oasis-match-actions">
              <button className="oasis-ghost-btn" onClick={() => activeLessonId && startMatch(activeLessonId)}>
                <RotateCcw size={16} /> Main lagi
              </button>
              <button className="oasis-primary-btn" onClick={() => setView('result')}>
                Lihat hasil akhir <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {view === 'session' && currentQuestion && (
          <div className="oasis-session">
            <div className="oasis-progress-row">
              <span>Soal {qIndex + 1} dari {session.length}</span>
              <StreakBadge streak={streak} />
            </div>

            <div className="oasis-prompt-card">
              {currentQuestion.promptEmoji && <div className="oasis-prompt-emoji">{currentQuestion.promptEmoji}</div>}
              <div className="oasis-prompt-arabic-row">
                <div className={isMeaningToWordQuiz ? 'oasis-prompt-plain' : 'oasis-prompt-main oasis-arabic-text'}>
                  {currentQuestion.prompt}
                </div>
                {ttsAvailable && promptIsArabic && (
                  <button className="oasis-speak-btn" onClick={(e) => handleSpeak(currentQuestion.prompt, e)} aria-label="Dengarkan">
                    <Volume2 size={16} />
                  </button>
                )}
              </div>
              {currentQuestion.promptSub && <div className="oasis-prompt-sub">{currentQuestion.promptSub}</div>}
            </div>

            <div className={'oasis-options' + (isMeaningToWordQuiz ? ' grid2' : '')}>
              {currentQuestion.options.map((opt, i) => {
                let cls = 'oasis-option';
                if (revealed) {
                  if (i === currentQuestion.correctIndex) cls += ' correct ' + feedbackPunch;
                  else if (i === picked) cls += ' wrong ' + feedbackPunch;
                }
                if (isMeaningToWordQuiz || isDialogueQuiz) {
                  const [arabicPart, translitPart] = opt.split('||');
                  return (
                    <button key={i} className={cls} onClick={() => choose(i)} disabled={revealed}>
                      {isMeaningToWordQuiz && currentQuestion.optionEmojis?.[i] && (
                        <span className="oasis-option-emoji">{currentQuestion.optionEmojis[i]}</span>
                      )}
                      <span className="oasis-option-arabic oasis-arabic-text">{arabicPart}</span>
                      {translitPart && <span className="oasis-option-translit">{translitPart}</span>}
                    </button>
                  );
                }
                return (
                  <button key={i} className={cls} onClick={() => choose(i)} disabled={revealed}>
                    {opt}
                  </button>
                );
              })}
            </div>

            {revealed && (
              <div className={'oasis-feedback ' + (picked === currentQuestion.correctIndex ? 'success' : 'mismatch')}>
                {currentQuestion.explanation}
              </div>
            )}

            {showHint && !revealed && (
              <div className="oasis-hint">Petunjuk: ingat-ingat kartu yang baru saja kamu pelajari â€” coba cocokkan huruf awalnya.</div>
            )}

            <footer className="oasis-actions">
              {!revealed && (
                <button className="oasis-ghost-btn" onClick={() => { arabicSfx.click(); setShowHint(true); }}>
                  <Lightbulb size={16} /> Petunjuk
                </button>
              )}
              {revealed && (
                <button className="oasis-primary-btn" onClick={nextQuestion} style={{ width: 'auto' }}>
                  {qIndex + 1 < session.length ? 'Soal berikutnya' : 'Lanjut'}
                  <ChevronRight size={16} />
                </button>
              )}
            </footer>
          </div>
        )}

        {view === 'result' && lastResult && (
          <div className="oasis-result">
            <img src="/assets/arabic/fox-explorer.webp" alt="" className="oasis-mascot-big juice-portal-win" />
            <h3>{lastResult.correct} dari {lastResult.total} benar (kuis)</h3>
            <div className="oasis-stars-big">
              {[1, 2, 3].map((s) => (
                <Star key={s} size={32} fill={lastResult.stars >= s ? '#f3c861' : 'none'} color="#f3c861" />
              ))}
            </div>
            <p>
              {lastResult.stars === 3
                ? 'Sempurna! Kamu menguasai pelajaran ini dari belajar sampai ujian akhir.'
                : lastResult.stars >= 1
                ? 'Bagus! Ulangi kapan saja dari awal untuk mendapat bintang penuh.'
                : 'Ayo ulangi dari awal â€” belajar, kuis, dan cocokkan lagi ya!'}
            </p>
            <div className="oasis-result-actions">
              <button className="oasis-ghost-btn" onClick={() => activeLessonId && startLearn(activeLessonId)}>
                <RotateCcw size={16} /> Ulangi dari awal
              </button>
              <button className="oasis-primary-btn" onClick={backToMap}>
                Kembali ke peta <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {view === 'collection' && (
          <div className="oasis-collection">
            <div className="oasis-collection-header">
              <img src="/assets/arabic/backpack.webp" alt="" className="oasis-backpack-icon" />
              <p className="oasis-collection-note">Setiap kata yang pernah kamu cocokkan atau jawab benar tersimpan di ransel ini selamanya.</p>
            </div>
            <div className="oasis-collection-grid">
              {curriculum.map((lesson) =>
                (lesson.words ?? []).map((w) => {
                  const owned = evidence.collectedWords.includes(w.id);
                  return (
                    <div key={w.id} className={'oasis-word-card' + (owned ? '' : ' locked')}>
                      {owned ? (
                        <>
                          <span className="oasis-word-emoji">{w.emoji}</span>
                          <b className="oasis-arabic-text">{w.arabic}</b>
                          <span>{w.meaning}</span>
                        </>
                      ) : (
                        <Lock size={18} />
                      )}
                    </div>
                  );
                }),
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
