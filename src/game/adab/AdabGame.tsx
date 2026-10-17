import { useEffect, useMemo, useState } from 'react';
import { BookOpen, ChevronRight, Lock, RotateCcw, Sparkles, Star, X } from 'lucide-react';
import AdabVillage3D from './AdabVillage3D';
import { adabHadithLessons, hadithById, type HadithLesson } from './hadithLessons';
import { chapters, type StoryChapter, type StoryChoice } from './scenarios';
import { computeMastery, loadEvidence, recordChoice, saveEvidence, type AdabEvidence } from './evidence';
import { Confetti, usePunch } from '../juice';
import { quranItemsByIsland, type QuranPathItem } from '../quran/quranAdventureContent';

/**
 * AdabGame.tsx — Patch 26. Mekanik "Kisah Pilihan" (branching story) untuk
 * Kampung Adab — MEKANIK YANG BERBEDA TOTAL dari mesin kuis generik yang
 * sebelumnya dipakai bersama oleh Quran/Adab/English (QuizGame.tsx).
 *
 * ====================================================================
 * KENAPA MEKANIK INI DIPILIH (bukan kuis pilihan ganda):
 * ====================================================================
 * Materi Kampung Adab (nilai karakter, kebiasaan baik) bersifat
 * SITUASIONAL — tidak ada satu "jawaban paling benar" yang mutlak untuk
 * diuji dengan pilihan ganda konvensional, melainkan gradasi kualitas
 * tindakan (lebih baik / cukup baik / masih bisa ditingkatkan). Mekanik
 * cerita bercabang (branching narrative) jauh lebih pas: anak menghadapi
 * skenario nyata, memilih tindakan, dan MELIHAT KONSEKUENSI cerita dari
 * pilihannya — belajar lewat pengalaman naratif, bukan hafalan.
 *
 * TIDAK ADA vonis benar/salah. Setiap pilihan mendapat 1-3 bintang
 * berdasarkan kualitas (best/good/needsWork), TAPI ketiganya tetap
 * mendapat konsekuensi cerita yang masuk akal dan pesan reflektif yang
 * mendidik — tidak ada yang terasa seperti "hukuman" atau vonis
 * kepribadian.
 *
 * KOLEKSI PENDORONG REPLAY: "Buku Kisah" mencatat SETIAP kombinasi
 * bab+pilihan yang pernah dicoba (24 total: 8 bab x 3 pilihan). Anak
 * didorong mengulang bab yang sama dengan pilihan berbeda untuk
 * melengkapi koleksi seluruh kemungkinan akhir cerita — rasa penasaran
 * "kalau aku pilih yang lain, ceritanya jadi apa ya?" inilah motor
 * replay value yang berbeda dari mekanik dunia lain (Numeria/Digital/
 * Arabic yang semuanya berbasis "benar vs salah").
 *
 * File ini menimpa LANGSUNG path yang sama seperti komponen Adab yang
 * sudah ada (`src/game/adab/AdabGame.tsx`), dengan signature props sama
 * (`onExit`, `onXpEarned`) — pola yang terbukti berhasil untuk Oasis
 * Bahasa Arab (Patch 19+) tanpa perlu mengubah App.tsx sama sekali.
 */

const STYLE_ID = 'brightoria-adab-story-styles-v1';
const adabQuranPath = quranItemsByIsland('adab');

const ADAB_CSS = `
.adab-overlay { position: fixed; inset: 0; z-index: 75; background: linear-gradient(160deg,#2e1608ee,#3d1f0fee); backdrop-filter: blur(10px); display: grid; place-items: center; padding: 16px; }
.adab-shell { position: relative; width: min(720px,96vw); max-height: 92vh; overflow-y: auto; background: #fffaf3; border-radius: 26px; padding: 26px; box-shadow: 0 25px 80px #0007; display: flex; flex-direction: column; gap: 16px; border-top: 6px solid #c86845; background-image: radial-gradient(circle at 100% 0%, #ffe9de 0%, transparent 55%), radial-gradient(circle at 0% 100%, #fff3d6 0%, transparent 55%); }
.adab-shell.simulator {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  max-height: none;
  padding: 0;
  border-radius: 0;
  border-top: 0;
  overflow: hidden;
  background: #bfe9ff url('/assets/adab-village/kampung-adab-storybook-bg.png') center center / cover no-repeat;
  box-shadow: none;
}
.adab-shell.simulator > .adab-head { display: none !important; }
.adab-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
.adab-head h2 { margin: 6px 0 0; color: #6b2f12; }
.adab-close-btn { border: 0; background: #fbe6da; border-radius: 50%; width: 35px; height: 35px; display: grid; place-items: center; cursor: pointer; flex-shrink: 0; color: #c86845; }
.adab-mastery-bar { display: flex; flex-direction: column; gap: 6px; font-size: 12px; color: #8a5230; }
.adab-mastery-track { height: 11px; background: #f1ddc8; border-radius: 20px; overflow: hidden; }
.adab-mastery-fill { display: block; height: 100%; background: linear-gradient(90deg,#c86845,#f3c861); border-radius: 20px; }
.adab-book-btn { border: 1px solid #eecda1; background: #fff8ec; border-radius: 12px; padding: 8px 12px; font-size: 12px; display: inline-flex; align-items: center; gap: 6px; cursor: pointer; color: #a15321; }
.adab-chapters-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; }
.adab-chapter-card { border: 1px solid #f3d9c0; background: linear-gradient(160deg,#fff3e6,#ffe4cd); border-radius: 16px; padding: 14px 10px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 4px; position: relative; box-shadow: 0 6px 16px #c868451a; cursor: pointer; transition: transform 0.15s ease; }
.adab-chapter-card:not(.locked):hover { transform: translateY(-3px); }
.adab-chapter-card.locked { background: #ece3d6; border-color: #e2d5c0; color: #a89376; opacity: 0.85; }
.adab-chapter-number { position: absolute; top: 8px; left: 10px; font-size: 10px; font-weight: 900; color: #b5651d; }
.adab-chapter-icon { font-size: 28px; margin-top: 6px; }
.adab-chapter-card b { font-size: 12px; color: #6b3a15; }
.adab-chapter-stars { display: flex; gap: 2px; margin-top: 2px; }
.adab-story { display: flex; flex-direction: column; gap: 14px; }
.adab-setting-card { background: linear-gradient(160deg,#fff3e6,#ffe4cd); border: 1px solid #f3d9c0; border-radius: 18px; padding: 22px 18px; text-align: center; }
.adab-setting-icon { font-size: 44px; margin-bottom: 8px; }
.adab-setting-text { font-size: 15px; color: #6b3a15; line-height: 1.6; }
.adab-choices { display: flex; flex-direction: column; gap: 10px; }
.adab-choice-btn { border: 2px solid #f3d9c0; background: #fff; border-radius: 16px; padding: 14px 16px; text-align: left; font-size: 14px; cursor: pointer; color: #6b3a15; display: flex; align-items: center; gap: 10px; }
.adab-choice-btn:not(:disabled):hover { border-color: #d9a35f; transform: translateY(-2px); }
.adab-choice-btn .adab-choice-badge { flex-shrink: 0; width: 22px; height: 22px; border-radius: 50%; background: #fbe6da; color: #c86845; font-size: 11px; font-weight: 900; display: grid; place-items: center; }
.adab-outcome-card { background: linear-gradient(160deg,#fff3e6,#ffe4cd); border: 1px solid #f3d9c0; border-radius: 18px; padding: 20px 18px; display: flex; flex-direction: column; gap: 10px; }
.adab-outcome-stars { display: flex; gap: 4px; justify-content: center; }
.adab-outcome-text { font-size: 14px; color: #6b3a15; line-height: 1.6; text-align: center; }
.adab-outcome-reflection { font-size: 12px; color: #a15321; background: #fff3cd; border: 1px solid #edcc6d; border-radius: 12px; padding: 10px 14px; text-align: center; }
.adab-actions { display: flex; gap: 10px; }
.adab-ghost-btn { flex: 1; border: 1px solid #eecda1; background: #fff8ec; border-radius: 12px; padding: 11px 14px; display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 13px; cursor: pointer; color: #a15321; }
.adab-primary-btn { flex: 2; border: 0; background: linear-gradient(135deg,#c86845,#8a3d16); color: #fff; padding: 13px 18px; border-radius: 14px; font-weight: 900; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; font-size: 14px; box-shadow: 0 9px 22px #8a3d1633; }
.adab-collection-note { font-size: 12px; color: #8a5230; text-align: center; }
.adab-collection-list { display: flex; flex-direction: column; gap: 10px; max-height: 55vh; overflow-y: auto; }
.adab-collection-chapter { border: 1px solid #f3d9c0; border-radius: 14px; padding: 10px 14px; background: #fff8ec; }
.adab-collection-chapter-title { font-size: 12px; font-weight: 800; color: #6b3a15; margin-bottom: 6px; display: flex; align-items: center; gap: 6px; }
.adab-collection-badges { display: flex; gap: 6px; flex-wrap: wrap; }
.adab-collection-badge { font-size: 10px; padding: 4px 8px; border-radius: 999px; background: #ece3d6; color: #a89376; }
.adab-collection-badge.owned { background: #fbe6da; color: #c86845; font-weight: 800; }
.adab-sim-cta { display: grid; grid-template-columns: 1fr auto; gap: 12px; align-items: center; margin-bottom: 14px; padding: 14px; border-radius: 18px; border: 2px solid #f3d9c0; background: linear-gradient(135deg,#fff8ec,#ffe2ca); box-shadow: 0 8px 22px #c8684518; }
.adab-sim-cta h3 { margin: 0 0 4px; color: #6b2f12; }
.adab-sim-cta p { margin: 0; color: #8a5230; font-size: 12px; }
.adab-quran-path { display: grid; gap: 10px; margin: 0 0 14px; }
.adab-quran-path-head { display: flex; justify-content: space-between; gap: 10px; align-items: center; color: #6b2f12; }
.adab-quran-path-head h3 { margin: 0; font-size: 16px; }
.adab-quran-path-head small { color: #8a5230; font-weight: 800; }
.adab-quran-path-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 10px; }
.adab-quran-path-card { border: 1px solid #f3d9c0; background: linear-gradient(150deg,#fffdf8,#ffe6d2); border-radius: 16px; padding: 13px; color: #6b2f12; box-shadow: 0 8px 18px #c8684514; text-align: left; cursor: pointer; font: inherit; width: 100%; transition: transform .16s ease, box-shadow .16s ease, border-color .16s ease; }
.adab-quran-path-card:hover { transform: translateY(-2px); box-shadow: 0 12px 24px #c8684520; border-color: #d9966c; }
.adab-quran-path-card:focus-visible { outline: 3px solid #f4b58f; outline-offset: 2px; }
.adab-quran-path-card.premium { background: linear-gradient(150deg,#fff8e6,#f7ead0); border-color: #efd09a; }
.adab-quran-path-badge { display: inline-flex; align-items: center; gap: 5px; width: fit-content; border-radius: 999px; padding: 4px 8px; margin-bottom: 8px; font-size: 10px; font-weight: 900; background: #fbe6da; color: #a15321; }
.adab-quran-path-card.premium .adab-quran-path-badge { background: #ffe6b7; color: #8a5a12; }
.adab-quran-path-card h4 { margin: 0 0 3px; font-size: 14px; }
.adab-quran-path-card p { margin: 0 0 8px; font-size: 11px; color: #8a5230; line-height: 1.35; }
.adab-quran-path-sample { border-radius: 12px; background: #fffaf3; border: 1px solid #eadfc8; padding: 8px; font-size: 12px; color: #6b2f12; }
.adab-quran-path-focus { display: block; margin-top: 8px; font-size: 11px; color: #8a5230; line-height: 1.35; }
.adab-quran-path-cta { display: inline-flex; align-items: center; gap: 4px; margin-top: 9px; font-size: 11px; font-weight: 900; color: #a15321; }
.adab-quran-detail { display: grid; gap: 12px; color: #6b2f12; }
.adab-quran-detail-hero { border: 1px solid #f3d9c0; border-radius: 18px; padding: 16px; background: linear-gradient(135deg,#fff8ec,#ffe2ca); }
.adab-quran-detail-hero.premium { border-color: #efd09a; background: linear-gradient(135deg,#fff8e6,#f7ead0); }
.adab-quran-detail-hero h3 { margin: 8px 0 4px; font-size: 22px; }
.adab-quran-detail-hero p { margin: 0 0 10px; color: #8a5230; line-height: 1.45; }
.adab-quran-detail-source { display: block; font-size: 11px; color: #8a5230; }
.adab-quran-lessons { display: grid; gap: 10px; }
.adab-quran-lesson { border: 1px solid #f3d9c0; border-radius: 16px; padding: 14px; background: #ffffffd8; }
.adab-quran-lesson h4 { margin: 0 0 8px; font-size: 15px; }
.adab-quran-lesson-arabic { margin: 0 0 8px; padding: 10px; border-radius: 12px; background: #fffaf3; border: 1px solid #eadfc8; text-align: center; font-size: 22px; line-height: 1.5; }
.adab-quran-lesson-meta { display: grid; gap: 5px; font-size: 12px; color: #8a5230; line-height: 1.45; }
.adab-quran-practice { margin-top: 10px; border-radius: 12px; padding: 10px; background: #fbe6da; color: #8a3f18; font-size: 12px; font-weight: 800; line-height: 1.45; }
.adab-sim-shell { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 14px; min-height: 520px; }
.adab-village-map { position: relative; min-height: 520px; overflow: hidden; border-radius: 22px; border: 3px solid #d9a35f; background:
  radial-gradient(circle at 14% 18%, #bce68f 0 10%, transparent 10.5%),
  radial-gradient(circle at 76% 14%, #c6ec95 0 9%, transparent 9.5%),
  radial-gradient(circle at 18% 80%, #9bd86c 0 11%, transparent 11.5%),
  linear-gradient(135deg,#a8dc75,#78c86c 45%,#64b46a);
  box-shadow: inset 0 0 0 6px #ffffff55;
}
.adab-village-path { position: absolute; inset: 44% 6% auto 6%; height: 54px; border-radius: 999px; background: repeating-linear-gradient(90deg,#e8c997 0 28px,#d6af76 28px 34px); box-shadow: 0 8px 0 #93623455; transform: rotate(-5deg); }
.adab-village-path.second { inset: 20% auto 8% 48%; width: 54px; height: auto; transform: rotate(0); }
.adab-location { position: absolute; width: 154px; min-height: 118px; border: 0; background: transparent; transform: translate(-50%, -50%); cursor: pointer; color: #6b2f12; }
.adab-location-card { min-height: 92px; border-radius: 18px; border: 3px solid #8a5230; background: linear-gradient(145deg,#fff7df,#f5c785); box-shadow: 0 10px 0 #8a5230, 0 18px 28px #4f2a1244; display: grid; place-items: center; gap: 4px; padding: 10px; transition: transform .16s ease, filter .16s ease; }
.adab-location:hover .adab-location-card, .adab-location.active .adab-location-card { transform: translateY(-7px); filter: drop-shadow(0 0 14px #ffe38d); }
.adab-location-icon { font-size: 34px; }
.adab-location-card b { font-size: 15px; }
.adab-location-card span { font-size: 10px; color: #8a5230; font-weight: 800; }
.adab-map-sign { position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%); background: #8a5230; color: #fff8ec; border: 3px solid #f3c861; border-radius: 12px; padding: 10px 14px; text-align: center; font-size: 12px; font-weight: 900; box-shadow: 0 8px 0 #5b3218; }
.adab-bri-guide { position: absolute; left: 10px; bottom: 8px; width: 150px; filter: drop-shadow(0 12px 18px #4f2a1244); pointer-events: none; }
.adab-sim-panel { border: 2px solid #f3d9c0; background: #fffaf3; border-radius: 22px; padding: 16px; display: flex; flex-direction: column; gap: 12px; box-shadow: 0 12px 30px #4f2a121f; }
.adab-sim-panel h3 { margin: 0; color: #6b2f12; }
.adab-sim-panel p { margin: 0; color: #7a4b2c; line-height: 1.45; font-size: 13px; }
.adab-sim-badge { display: inline-flex; align-items: center; gap: 6px; width: fit-content; background: #fff3cd; border: 1px solid #edcc6d; color: #8a5710; border-radius: 999px; padding: 5px 9px; font-size: 10px; font-weight: 900; }
.adab-sim-choices { display: flex; flex-direction: column; gap: 8px; }
.adab-sim-choice { border: 2px solid #f3d9c0; background: #fff; border-radius: 14px; padding: 11px 12px; text-align: left; font-size: 12px; font-weight: 800; color: #6b3a15; }
.adab-sim-choice:hover:not(:disabled) { border-color: #c86845; transform: translateY(-2px); }
.adab-sim-choice:disabled { cursor: default; }
.adab-sim-feedback { border-radius: 14px; padding: 12px; background: #fff3cd; border: 1px solid #edcc6d; color: #704910; font-size: 12px; line-height: 1.45; }
.adab-sim-hadith { border-radius: 15px; border: 1px solid #d8b56d; background: linear-gradient(135deg,#fff8db,#f6e5b7); padding: 11px 12px; color: #684215; display: flex; flex-direction: column; gap: 5px; box-shadow: inset 0 0 0 1px #fff8; }
.adab-sim-hadith b { font-size: 12px; color: #6b3a15; }
.adab-sim-hadith span { font-size: 12px; line-height: 1.42; color: #704910; }
.adab-sim-hadith small { font-size: 11px; color: #8a5710; font-weight: 800; }
.adab-sim-footer { display: flex; justify-content: space-between; gap: 8px; margin-top: auto; flex-wrap: wrap; }
.adab3d-shell {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  min-height: 100vh;
  overflow: hidden;
  border-radius: 0;
  border: 0;
  background:
    linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,0) 30%, rgba(106,156,75,.18) 100%),
    url('/assets/adab-village/kampung-adab-storybook-bg.png') center center / cover no-repeat;
  box-shadow: none;
  isolation: isolate;
}
.adab3d-canvas { position: absolute; inset: 0; }
.adab3d-canvas canvas { background: transparent !important; }
.adab3d-title {
  position: absolute;
  left: clamp(18px, 3vw, 42px);
  top: clamp(14px, 2.4vw, 34px);
  color: #6b2f12;
  pointer-events: none;
  filter: drop-shadow(0 14px 18px #4f2a122f);
}
.adab3d-title b {
  display: block;
  width: fit-content;
  border-radius: 20px;
  padding: 9px 24px 11px;
  background: linear-gradient(180deg,#a75b2c,#7d3819);
  border: 3px solid #6e2f13;
  box-shadow: inset 0 3px 0 #d68b4c, inset 0 -4px 0 #552510, 0 4px 0 #52230f;
  color: #ffe4ad;
  font-size: clamp(23px, 3.8vw, 52px);
  line-height: .98;
  letter-spacing: .035em;
  text-shadow: 0 3px 0 #54220e, 0 0 2px #fff0c8;
}
.adab3d-title span {
  display: inline-block;
  margin-top: -4px;
  margin-left: clamp(26px, 4vw, 72px);
  border-radius: 999px;
  background: linear-gradient(180deg,#ffe8bd,#ffc97f);
  border: 2px solid #bd7b35;
  padding: 6px 20px;
  font-size: clamp(12px, 1.2vw, 17px);
  font-weight: 900;
  color: #4d230f;
  box-shadow: 0 8px 18px #4f2a1224;
}
.adab3d-progress {
  position: absolute;
  left: clamp(18px, 3vw, 42px);
  top: clamp(120px, 12.4vw, 160px);
  width: min(320px, calc(100vw - 36px));
  border-radius: 20px;
  background: #fffaf3ee;
  border: 2px solid #f1bd80;
  padding: 13px 15px;
  color: #3f2415;
  box-shadow: 0 12px 32px #4f2a1224;
  backdrop-filter: blur(8px);
}
.adab3d-progress-row { display: flex; align-items: center; gap: 10px; font-weight: 900; font-size: 15px; }
.adab3d-progress-icon { width: 40px; height: 40px; border-radius: 12px; display: grid; place-items: center; background: #fff4da; color: #5aa446; box-shadow: inset 0 0 0 2px #f1bd80; }
.adab3d-progress-track { height: 11px; border-radius: 999px; background: #e8d9c3; overflow: hidden; margin: 10px 0 6px; }
.adab3d-progress-fill { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg,#64b857,#9bd05c); }
.adab3d-progress small { color: #6d4d38; font-weight: 800; }
.adab3d-toolbar { position: absolute; right: clamp(14px, 2.8vw, 42px); top: clamp(14px, 2.4vw, 38px); display: flex; gap: 10px; align-items: center; }
.adab3d-tool { border: 0; min-height: 48px; border-radius: 999px; padding: 0 16px; background: #fffaf3ee; color: #7b3b18; font-weight: 900; box-shadow: 0 10px 24px #4f2a1224; display: inline-flex; align-items: center; gap: 8px; cursor: pointer; border: 2px solid #f1bd80; backdrop-filter: blur(8px); }
.adab3d-tool.icon { width: 52px; padding: 0; justify-content: center; }
.adab3d-tool.locked, .adab3d-tool.on { background: linear-gradient(135deg,#c86845,#8a3d16); color: #fff; border-color: #ffd9a8; }
.adab3d-label { min-width: 102px; border-radius: 999px; background: #fffaf3f2; border: 2px solid #f1bd80; color: #4d230f; padding: 6px 10px; text-align: center; box-shadow: 0 8px 16px #4f2a1226; font-size: 10px; transform: translateY(0); transition: transform .16s ease, border-color .16s ease, opacity .16s ease; opacity: .94; }
.adab3d-label.near { border-color: #c86845; transform: translateY(-6px); }
.adab3d-label b { display: block; font-size: 11px; }
.adab3d-label span { color: #8a5230; font-size: 9px; }
.adab3d-near { position: absolute; left: 50%; bottom: 24px; transform: translateX(-50%); display: flex; align-items: center; gap: 10px; border-radius: 18px; background: #fffaf3f2; border: 2px solid #f1bd80; padding: 10px 12px; color: #6b2f12; box-shadow: 0 12px 30px #4f2a1230; backdrop-filter: blur(8px); }
.adab3d-near span { font-size: 13px; white-space: nowrap; }
.adab3d-near button { border: 0; border-radius: 12px; padding: 10px 14px; color: #fff; background: linear-gradient(135deg,#c86845,#8a3d16); display: inline-flex; align-items: center; gap: 7px; font-weight: 900; }
.adab3d-card { position: absolute; right: 18px; bottom: 18px; width: min(380px, calc(100% - 36px)); max-height: calc(100% - 88px); overflow-y: auto; border-radius: 22px; background: #fffaf3f5; border: 2px solid #f3d9c0; box-shadow: 0 18px 45px #4f2a1240; padding: 16px; display: flex; flex-direction: column; gap: 12px; color: #6b2f12; }
.adab3d-card h3 { margin: 0; color: #6b2f12; }
.adab3d-card p { margin: 0; color: #7a4b2c; line-height: 1.45; font-size: 13px; }
.adab3d-stick { position: absolute; left: clamp(20px, 3vw, 54px); bottom: clamp(22px, 4vw, 56px); width: 126px; height: 126px; border-radius: 999px; background: #fffaf38c; border: 2px solid #f1bd80; box-shadow: 0 12px 30px #4f2a122e; touch-action: none; display: grid; place-items: center; backdrop-filter: blur(7px); }
.adab3d-stick::before { content: ''; position: absolute; width: 62px; height: 62px; border-radius: 999px; border: 2px dashed #c8684566; }
.adab3d-stick-knob { width: 54px; height: 54px; border-radius: 999px; background: linear-gradient(135deg,#fffaf3,#ffe2ca); color: #8a3d16; display: grid; place-items: center; box-shadow: 0 8px 18px #4f2a1238; will-change: transform; }
@media (max-width: 700px) {
  .adab-shell { padding: 18px; }
  .adab-chapters-grid { grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); }
  .adab-sim-cta { grid-template-columns: 1fr; }
  .adab-sim-shell { grid-template-columns: 1fr; min-height: 0; }
  .adab-village-map { min-height: 480px; }
  .adab-sim-panel { min-height: 360px; }
  .adab3d-shell { min-height: 100vh; height: 100vh; }
  .adab3d-title b { font-size: 24px; padding: 7px 14px 9px; border-radius: 16px; }
  .adab3d-title span { font-size: 11px; padding: 5px 12px; }
  .adab3d-progress { top: 88px; width: 245px; padding: 10px 12px; }
  .adab3d-progress-row { font-size: 13px; }
  .adab3d-toolbar { top: 12px; right: 10px; gap: 6px; }
  .adab3d-tool { min-height: 42px; padding: 0 11px; font-size: 12px; }
  .adab3d-tool.icon { width: 42px; }
  .adab3d-card { left: 12px; right: 12px; bottom: 90px; width: auto; max-height: 44%; }
  .adab3d-near { bottom: 158px; width: calc(100% - 24px); justify-content: space-between; }
}
`;

function useInjectAdabStyles() {
  useEffect(() => {
    if (document.getElementById(STYLE_ID)) return;
    const el = document.createElement('style');
    el.id = STYLE_ID;
    el.textContent = ADAB_CSS;
    document.head.appendChild(el);
  }, []);
}

function isChapterUnlocked(index: number, evidence: AdabEvidence): boolean {
  if (index === 0) return true;
  const prev = chapters[index - 1];
  return !!evidence.chapters[prev.id]?.completed;
}

function AdabQuranDetail({ item, onBack }: { item: QuranPathItem; onBack: () => void }) {
  return (
    <div className="adab-quran-detail">
      <section className={'adab-quran-detail-hero ' + item.tier}>
        <span className="adab-quran-path-badge">
          {item.tier === 'premium' && <Lock size={11} />}
          {item.badge}
        </span>
        <h3>{item.title}</h3>
        <p>{item.focus}</p>
        <div className="adab-quran-path-sample">{item.sample}</div>
        <span className="adab-quran-detail-source">{item.sourceNote} Konten ini masih draft untuk review akademik Bright Academy.</span>
      </section>
      <div className="adab-quran-lessons">
        {item.lessons.map((lesson) => (
          <article key={lesson.id} className="adab-quran-lesson">
            <h4>{lesson.title}</h4>
            {lesson.arabic && <div className="adab-quran-lesson-arabic">{lesson.arabic}</div>}
            <div className="adab-quran-lesson-meta">
              {lesson.latin && <span><b>Bacaan:</b> {lesson.latin}</span>}
              {lesson.meaning && <span><b>Makna:</b> {lesson.meaning}</span>}
              <span><b>Hikmah:</b> {lesson.note}</span>
            </div>
            <div className="adab-quran-practice">Praktik: {lesson.practice}</div>
          </article>
        ))}
      </div>
      <button className="adab-book-btn" onClick={onBack}>Kembali ke peta</button>
    </div>
  );
}

type View = 'map' | 'story' | 'outcome' | 'collection' | 'simulator' | 'quranAdabDetail';

type SimQuality = 'best' | 'good' | 'needsWork';

interface SimChoice {
  text: string;
  quality: SimQuality;
  feedback: string;
}

interface SimMission {
  id: string;
  locationId: string;
  title: string;
  scenario: string;
  hadith: HadithLesson;
  choices: SimChoice[];
}

const SIM_KEY = 'brightoria.adab.dailySimulator.v1';

const locations = [
  { id: 'home', name: 'Rumah', icon: '🏠', subtitle: 'Adab keluarga', x: 20, y: 29 },
  { id: 'school', name: 'Sekolah', icon: '🏫', subtitle: 'Adab belajar', x: 53, y: 23 },
  { id: 'mosque', name: 'Masjid', icon: '🕌', subtitle: 'Adab ibadah', x: 79, y: 36 },
  { id: 'park', name: 'Taman', icon: '🌳', subtitle: 'Adab berteman', x: 26, y: 71 },
  { id: 'shop', name: 'Warung Amanah', icon: '🧺', subtitle: 'Jujur & amanah', x: 72, y: 73 },
];

const simMissions: SimMission[] = [
  {
    id: 'home-neighbor-salam',
    locationId: 'home',
    title: 'Tamu di Depan Rumah',
    scenario: 'Bri melihat tetangga tua berdiri di depan rumah sambil membawa bingkisan. Ibu sedang di dapur dan belum mendengar salamnya.',
    hadith: hadithById('spread-salam'),
    choices: [
      { text: 'Menjawab salam, menyambut dengan sopan, lalu memanggil ibu', quality: 'best', feedback: 'Bagus sekali. Menjawab salam dan memuliakan tamu membuat rumah terasa ramah. Latih juga adab berbuat baik kepada tetangga.' },
      { text: 'Memanggil ibu dari jauh tanpa menyapa tamu dulu', quality: 'good', feedback: 'Ibu jadi tahu ada tamu, tapi akan lebih indah kalau salam dijawab dan tamu disapa lembut.' },
      { text: 'Pura-pura tidak melihat karena sedang ingin bermain', quality: 'needsWork', feedback: 'Yuk belajar peka. Tamu dan tetangga perlu disambut dengan adab yang baik.' },
    ],
  },
  {
    id: 'school-knowledge-circle',
    locationId: 'school',
    title: 'Majelis Ilmu Kecil',
    scenario: 'Guru sedang menjelaskan kisah teladan. Kamu tahu jawabannya, tapi teman di sebelahmu masih berpikir.',
    hadith: hadithById('knowledge'),
    choices: [
      { text: 'Angkat tangan, menunggu dipersilakan, lalu menjawab singkat', quality: 'best', feedback: 'MasyaAllah. Antusias belajar tetap disertai adab menunggu giliran.' },
      { text: 'Berbisik membantu teman agar ia tidak bingung', quality: 'good', feedback: 'Niatmu membantu. Saat guru berbicara, lebih baik tunggu waktu diskusi agar majelis tetap tertib.' },
      { text: 'Langsung menyela supaya semua tahu kamu bisa', quality: 'needsWork', feedback: 'Yuk tahan diri. Ilmu jadi lebih berkah saat disampaikan dengan rendah hati dan tertib.' },
    ],
  },
  {
    id: 'mosque-sandal-row',
    locationId: 'mosque',
    title: 'Sandal di Serambi',
    scenario: 'Di depan masjid, sandal anak-anak berserakan sampai menghalangi jalan jamaah yang mau masuk.',
    hadith: hadithById('mosque'),
    choices: [
      { text: 'Merapikan sandal, lalu mengajak teman menjaga serambi', quality: 'best', feedback: 'Keren. Menjaga kebersihan dan kerapian masjid adalah bagian dari adab ibadah.' },
      { text: 'Merapikan sandal sendiri tanpa bicara ke teman', quality: 'good', feedback: 'Itu sudah baik. Mengajak teman dengan lembut bisa membuat kebaikan menyebar.' },
      { text: 'Melompati sandal saja agar cepat masuk', quality: 'needsWork', feedback: 'Masjid adalah tempat yang mulia. Kalau melihat yang berantakan, kita bisa bantu merapikan.' },
    ],
  },
  {
    id: 'park-peace-maker',
    locationId: 'park',
    title: 'Jembatan Damai',
    scenario: 'Dua teman berebut giliran ayunan. Keduanya mulai kesal dan permainan hampir berhenti.',
    hadith: hadithById('anger'),
    choices: [
      { text: 'Mengusulkan antre bergiliran dan mengajak keduanya saling minta maaf', quality: 'best', feedback: 'Indah sekali. Kamu membantu teman berdamai tanpa memihak.' },
      { text: 'Meminta mereka suit agar cepat selesai', quality: 'good', feedback: 'Itu bisa membantu memilih giliran. Akan lebih baik kalau tetap ada kata maaf dan aturan bergiliran.' },
      { text: 'Meninggalkan mereka karena bukan urusanmu', quality: 'needsWork', feedback: 'Kadang teman butuh penengah. Menolong dengan kata yang lembut bisa membuat suasana kembali baik.' },
    ],
  },
  {
    id: 'shop-trust-basket',
    locationId: 'shop',
    title: 'Keranjang Amanah',
    scenario: 'Penjual warung sedang melayani orang lain. Ia meminta Bri mengambil roti dan meletakkan uangnya di kotak amanah.',
    hadith: hadithById('truthfulness'),
    choices: [
      { text: 'Ambil roti sesuai izin, bayar pas, lalu mengucap terima kasih', quality: 'best', feedback: 'MasyaAllah, itu amanah. Saat tidak diawasi pun kita tetap jujur.' },
      { text: 'Ambil roti dulu, lalu menunggu penjual untuk memastikan harga', quality: 'good', feedback: 'Bagus, kamu ingin memastikan. Kalau harga sudah jelas, membayar di kotak amanah juga baik.' },
      { text: 'Mengambil tambahan permen karena penjual sedang sibuk', quality: 'needsWork', feedback: 'Amanah berarti mengambil hanya yang menjadi hak kita. Yuk pilih jujur walau tidak diawasi.' },
    ],
  },
];

function loadSimDone(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(SIM_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function saveSimDone(ids: string[]) {
  try {
    localStorage.setItem(SIM_KEY, JSON.stringify(ids));
  } catch {
    /* localStorage may be unavailable in embedded previews. */
  }
}

export default function AdabGame({
  onExit,
  onXpEarned,
}: {
  onExit: () => void;
  onXpEarned: (amount: number) => void;
}) {
  useInjectAdabStyles();

  const [view, setView] = useState<View>('map');
  const [evidence, setEvidence] = useState<AdabEvidence>(() => loadEvidence());
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [pickedChoice, setPickedChoice] = useState<StoryChoice | null>(null);
  const [confettiTick, setConfettiTick] = useState(0);
  const [activeLocationId, setActiveLocationId] = useState<string | null>(null);
  const [activeAdabPathId, setActiveAdabPathId] = useState<string | null>(null);
  const [simDone, setSimDone] = useState<string[]>(() => loadSimDone());
  const [simFeedback, setSimFeedback] = useState<{ quality: SimQuality; text: string } | null>(null);
  const outcomePunch = usePunch(pickedChoice?.id ?? 'idle');

  const overallMastery = useMemo(() => computeMastery(evidence, chapters.length), [evidence]);
  const totalOutcomes = chapters.length * 3;

  const activeChapter = chapters.find((c) => c.id === activeChapterId) ?? null;
  const activeAdabPath = activeAdabPathId ? adabQuranPath.find((item) => item.id === activeAdabPathId) ?? null : null;
  const activeProgress = activeChapterId ? evidence.chapters[activeChapterId] : undefined;
  const activeMission = activeLocationId ? (simMissions.find((mission) => mission.locationId === activeLocationId) ?? null) : null;

  function openChapter(id: string) {
    setActiveChapterId(id);
    setPickedChoice(null);
    setView('story');
  }

  function tryLocked() {
    // Placeholder untuk efek/umpan balik ringan saat bab terkunci diklik.
  }

  function chooseOption(choice: StoryChoice) {
    if (!activeChapterId) return;
    setPickedChoice(choice);
    const next = recordChoice(evidence, activeChapterId, choice.id, choice.quality);
    setEvidence(next);
    saveEvidence(next);
    const xp = choice.quality === 'best' ? 25 : choice.quality === 'good' ? 18 : 12;
    onXpEarned(xp);
    if (choice.quality === 'best') setConfettiTick((n) => n + 1);
    setView('outcome');
  }

  function backToMap() {
    setView('map');
    setActiveChapterId(null);
    setPickedChoice(null);
    setActiveAdabPathId(null);
  }

  function openAdabPathDetail(item: QuranPathItem) {
    setActiveAdabPathId(item.id);
    setView('quranAdabDetail');
  }

  function retryChapter() {
    setPickedChoice(null);
    setView('story');
  }

  function openSimulator() {
    setActiveLocationId(null);
    setSimFeedback(null);
    setView('simulator');
  }

  function chooseSim(choice: SimChoice) {
    if (!activeMission) return;
    setSimFeedback({ quality: choice.quality, text: choice.feedback });
    const alreadyDone = simDone.includes(activeMission.id);
    if (!alreadyDone) {
      const next = [...simDone, activeMission.id];
      setSimDone(next);
      saveSimDone(next);
      onXpEarned(choice.quality === 'best' ? 20 : choice.quality === 'good' ? 14 : 8);
      if (choice.quality === 'best') setConfettiTick((n) => n + 1);
    }
  }

  return (
    <div className="adab-overlay">
      <div className={'adab-shell' + (view === 'simulator' ? ' simulator' : '')}>
        <Confetti trigger={confettiTick} />

        {view !== 'simulator' && (
        <header className="adab-head">
          <div>
            <span className="chip">Kampung Adab</span>
            <h2>
              {view === 'map' && 'Kisah Pilihan — 8 Bab Kehidupan Sehari-hari'}
              {(view === 'story' || view === 'outcome') && activeChapter?.title}
              {view === 'collection' && 'Buku Kisah'}
              {view === 'quranAdabDetail' && (activeAdabPath?.title ?? 'Materi Adab Qur\'ani')}
            </h2>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {(view === 'story' || view === 'outcome' || view === 'quranAdabDetail') && (
              <button className="adab-book-btn" onClick={backToMap}>
                Peta
              </button>
            )}
            {view === 'map' && (
              <button className="adab-book-btn" onClick={() => setView('collection')}>
                <BookOpen size={14} /> Kisah ({evidence.collectedOutcomes.length}/{totalOutcomes})
              </button>
            )}
            {view === 'collection' && (
              <button className="adab-book-btn" onClick={backToMap}>
                Peta
              </button>
            )}
            <button className="adab-close-btn" onClick={onExit}>
              <X size={16} />
            </button>
          </div>
        </header>
        )}

        {view === 'map' && (
          <div>
            <div className="adab-sim-cta">
              <div>
                <h3>Adab Daily Life Simulator</h3>
                <p>Jelajahi kampung kecil, bantu Bri memilih sikap terbaik, dan temukan {adabHadithLessons.length} Hadits Hikmah anak dari materi PDF.</p>
              </div>
              <button className="adab-primary-btn" onClick={openSimulator}>
                Masuk Kampung <ChevronRight size={16} />
              </button>
            </div>
            <section className="adab-quran-path" aria-label="Materi adab dari Qur'an Learning Adventure">
              <div className="adab-quran-path-head">
                <h3>Materi Adab Qur'ani</h3>
                <small>Praktik harian + hikmah surat</small>
              </div>
              <div className="adab-quran-path-grid">
                {adabQuranPath.map((item) => (
                  <button key={item.id} type="button" className={'adab-quran-path-card ' + item.tier} onClick={() => openAdabPathDetail(item)}>
                    <span className="adab-quran-path-badge">
                      {item.tier === 'premium' && <Lock size={11} />}
                      {item.badge}
                    </span>
                    <h4>{item.title}</h4>
                    <p>{item.subtitle}</p>
                    <div className="adab-quran-path-sample">{item.sample}</div>
                    <span className="adab-quran-path-focus">{item.focus}</span>
                    <span className="adab-quran-path-cta">{item.cta} <ChevronRight size={13} /></span>
                  </button>
                ))}
              </div>
            </section>
            <div className="adab-mastery-bar" style={{ marginBottom: 14 }}>
              <div className="adab-mastery-track">
                <span className="adab-mastery-fill" style={{ width: `${overallMastery}%` }} />
              </div>
              <span>{overallMastery}% mastery keseluruhan &bull; setiap bab adalah kisah baru untuk dijalani</span>
            </div>
            <div className="adab-chapters-grid">
              {chapters.map((chapter, i) => {
                const progress = evidence.chapters[chapter.id];
                const unlocked = isChapterUnlocked(i, evidence);
                return (
                  <button
                    key={chapter.id}
                    className={'adab-chapter-card' + (unlocked ? '' : ' locked')}
                    onClick={() => (unlocked ? openChapter(chapter.id) : tryLocked())}
                  >
                    <span className="adab-chapter-number">{chapter.chapterNumber}</span>
                    <span className="adab-chapter-icon">{unlocked ? chapter.icon : <Lock size={18} />}</span>
                    <b>{chapter.title}</b>
                    <span className="adab-chapter-stars">
                      {[1, 2, 3].map((s) => (
                        <Star key={s} size={13} fill={progress && progress.bestStars >= s ? '#f3c861' : 'none'} color="#f3c861" />
                      ))}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {view === 'simulator' && (
          <AdabVillage3D
            missions={simMissions}
            doneMissionIds={simDone}
            activeMission={activeMission}
            feedback={simFeedback}
            onOpenMission={(locationId) => {
              setActiveLocationId(locationId);
              setSimFeedback(null);
            }}
            onChoose={chooseSim}
            onResetFeedback={() => setSimFeedback(null)}
            onBack={activeMission ? () => {
              setActiveLocationId(null);
              setSimFeedback(null);
            } : backToMap}
          />
        )}

        {view === 'quranAdabDetail' && activeAdabPath && (
          <AdabQuranDetail item={activeAdabPath} onBack={backToMap} />
        )}

        {view === 'story' && activeChapter && (
          <div className="adab-story">
            <div className="adab-setting-card">
              <div className="adab-setting-icon">{activeChapter.icon}</div>
              <div className="adab-setting-text">{activeChapter.setting}</div>
            </div>
            <div className="adab-choices">
              {activeChapter.choices.map((choice, i) => (
                <button key={choice.id} className="adab-choice-btn" onClick={() => chooseOption(choice)}>
                  <span className="adab-choice-badge">{String.fromCharCode(65 + i)}</span>
                  {choice.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {view === 'outcome' && activeChapter && pickedChoice && (
          <div className={'adab-story ' + outcomePunch}>
            <div className="adab-outcome-card">
              <div className="adab-outcome-stars">
                {[1, 2, 3].map((s) => {
                  const starVal = pickedChoice.quality === 'best' ? 3 : pickedChoice.quality === 'good' ? 2 : 1;
                  return <Star key={s} size={26} fill={starVal >= s ? '#f3c861' : 'none'} color="#f3c861" />;
                })}
              </div>
              <div className="adab-outcome-text">{pickedChoice.consequence}</div>
              <div className="adab-outcome-reflection">
                <Sparkles size={13} style={{ display: 'inline', marginRight: 4 }} />
                {pickedChoice.reflection}
              </div>
            </div>
            <div className="adab-actions">
              <button className="adab-ghost-btn" onClick={retryChapter}>
                <RotateCcw size={16} /> Coba pilihan lain
              </button>
              <button className="adab-primary-btn" onClick={backToMap}>
                Kembali ke peta <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {view === 'collection' && (
          <div>
            <p className="adab-collection-note">
              Setiap pilihan yang pernah kamu coba akan tercatat di sini. Coba semua pilihan di setiap bab untuk melengkapi Buku Kisah!
            </p>
            <div className="adab-collection-list">
              {chapters.map((chapter) => {
                const progress = evidence.chapters[chapter.id];
                return (
                  <div key={chapter.id} className="adab-collection-chapter">
                    <div className="adab-collection-chapter-title">
                      <span>{chapter.icon}</span> {chapter.title}
                    </div>
                    <div className="adab-collection-badges">
                      {chapter.choices.map((choice, i) => {
                        const owned = progress?.triedChoiceIds.includes(choice.id);
                        return (
                          <span key={choice.id} className={'adab-collection-badge' + (owned ? ' owned' : '')}>
                            Pilihan {String.fromCharCode(65 + i)} {owned ? '✓' : '?'}
                          </span>
                        );
                      })}
                    </div>
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
