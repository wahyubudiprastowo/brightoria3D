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
import { sfx } from '../sound';
import { quranItemsByIsland, type QuranPathItem } from './quranAdventureContent';
import { IqraReader, Juz30Reader, type IqraJilid } from './QuranReaders';
import { getRecitationUrl } from './quranReaderData';
import { QuranMemoryArena, QURAN_MEMORY_CSS } from './QuranMemoryArena';
import { PremiumUpgradeModal } from '../../subscription/PremiumUpgradeModal';
import { hasPremiumAccess } from '../../subscription/premiumAccess';

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
.hijaiyah-shell.garden { width: min(1060px, 97vw); }
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
.quran-garden-cta { display: grid; grid-template-columns: 1fr auto; gap: 12px; align-items: center; margin: 0 0 14px; padding: 14px; border: 2px solid #bfe0d6; border-radius: 18px; background: linear-gradient(135deg,#f8fff9,#fff3d6); color: #17403a; }
.quran-garden-cta h3 { margin: 0 0 4px; font-size: 18px; }
.quran-garden-cta p { margin: 0; font-size: 12px; color: #4c6b62; }
.quran-path-section { display: grid; gap: 10px; margin: 0 0 14px; }
.quran-path-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; color: #17403a; }
.quran-path-head h3 { margin: 0; font-size: 16px; }
.quran-path-head small { color: #4c6b62; font-weight: 800; }
.quran-path-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 10px; }
.quran-path-card { position: relative; border: 1px solid #cdeadf; background: linear-gradient(150deg,#ffffff,#e8f8f0); border-radius: 16px; padding: 13px 13px 12px; color: #17403a; box-shadow: 0 8px 18px #17403a12; overflow: hidden; text-align: left; cursor: pointer; font: inherit; width: 100%; transition: transform .16s ease, box-shadow .16s ease, border-color .16s ease; }
.quran-path-card:hover { transform: translateY(-2px); box-shadow: 0 12px 24px #17403a1c; border-color: #60c7ad; }
.quran-path-card:focus-visible { outline: 3px solid #68d6bd; outline-offset: 2px; }
.quran-path-card.premium { background: linear-gradient(150deg,#fff8e6,#f7ead0); border-color: #efd09a; }
.quran-path-card.premium::after { content: ""; position: absolute; inset: 0; background: linear-gradient(135deg,#ffffff00,#9b6b2f0f); pointer-events: none; }
.quran-path-badge { display: inline-flex; align-items: center; gap: 5px; width: fit-content; border-radius: 999px; padding: 4px 8px; margin-bottom: 8px; font-size: 10px; font-weight: 900; background: #dff3ea; color: #126153; }
.quran-path-card.premium .quran-path-badge { background: #ffe6b7; color: #8a5a12; }
.quran-path-card h4 { margin: 0 0 3px; font-size: 14px; }
.quran-path-card p { margin: 0 0 8px; font-size: 11px; color: #4c6b62; line-height: 1.35; }
.quran-path-sample { min-height: 34px; border-radius: 12px; background: #fffaf3; border: 1px solid #eadfc8; padding: 8px; font-size: 18px; color: #17403a; text-align: center; }
.quran-path-focus { display: block; margin-top: 8px; font-size: 11px; color: #4c6b62; line-height: 1.35; }
.quran-path-cta { display: inline-flex; align-items: center; gap: 4px; margin-top: 9px; font-size: 11px; font-weight: 900; color: #0f7c68; }
.quran-path-detail { display: grid; gap: 12px; }
.quran-path-detail-hero { border: 1px solid #cdeadf; border-radius: 18px; padding: 16px; background: linear-gradient(135deg,#f8fff9,#fff7df); color: #17403a; }
.quran-path-detail-hero.premium { border-color: #efd09a; background: linear-gradient(135deg,#fff8e6,#f7ead0); }
.quran-path-detail-hero h3 { margin: 8px 0 4px; font-size: 22px; }
.quran-path-detail-hero p { margin: 0 0 10px; color: #4c6b62; line-height: 1.45; }
.quran-path-detail-source { display: block; font-size: 11px; color: #5b756d; }
.quran-path-lesson-grid { display: grid; gap: 10px; }
.quran-path-lesson { border: 1px solid #dceee7; border-radius: 16px; padding: 14px; background: #ffffffd8; color: #17403a; }
.quran-path-lesson h4 { margin: 0 0 8px; font-size: 15px; }
.quran-path-lesson-arabic { margin: 0 0 8px; padding: 10px; border-radius: 12px; background: #fffaf3; border: 1px solid #eadfc8; text-align: center; font-size: 24px; line-height: 1.5; }
.quran-path-lesson-meta { display: grid; gap: 5px; font-size: 12px; color: #4c6b62; line-height: 1.45; }
.quran-path-practice { margin-top: 10px; border-radius: 12px; padding: 10px; background: #e9f7ef; color: #126153; font-size: 12px; font-weight: 800; line-height: 1.45; }
.quran-path-detail-actions { display: flex; flex-wrap: wrap; gap: 10px; justify-content: flex-end; }
.quran-garden-shell { display: grid; gap: 12px; }
.quran-garden-hud { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; justify-content: space-between; color: #17403a; font-size: 12px; font-weight: 800; }
.quran-pixel-map { position: relative; height: min(58vh, 470px); min-height: 360px; overflow: hidden; border: 4px solid #285c35; border-radius: 14px; background:
  linear-gradient(90deg, #0000 31px, #3d8f4b55 32px),
  linear-gradient(#0000 31px, #3d8f4b55 32px),
  radial-gradient(circle at 18% 24%, #afe27a 0 7%, #0000 7.5%),
  radial-gradient(circle at 78% 16%, #99d76b 0 6%, #0000 6.5%),
  radial-gradient(circle at 68% 78%, #a8dc75 0 9%, #0000 9.5%),
  linear-gradient(135deg,#74c857,#42a85f 48%,#2c8b63);
  background-size: 32px 32px, 32px 32px, auto, auto, auto, auto;
  image-rendering: pixelated;
  box-shadow: inset 0 0 0 6px #ffffff44, 0 16px 40px #17403a30;
}
.quran-pixel-path { position: absolute; left: 7%; right: 7%; top: 48%; height: 40px; background: repeating-linear-gradient(90deg,#c89555 0 28px,#b77d44 28px 32px); border: 4px solid #7d532f; border-radius: 6px; transform: translateY(-50%); box-shadow: 0 8px 0 #6a4729; }
.quran-pixel-stream { position: absolute; left: -3%; right: -3%; bottom: -18px; height: 132px; background-image: url('/assets/quran-pixel/water-tile.png'); background-size: 220px 220px; background-repeat: repeat; border-top: 5px solid #c7f8ff; opacity: .9; animation: quran-water-drift 7s linear infinite; }
.quran-pixel-stream::before { content: ""; position: absolute; inset: 14px 0 auto; height: 14px; background: repeating-linear-gradient(90deg,#ffffff99 0 32px,#0000 32px 86px); opacity: .75; }
@keyframes quran-water-drift { from { background-position: 0 0; } to { background-position: 220px 0; } }
.quran-pixel-tree { position: absolute; width: 38px; height: 58px; background: linear-gradient(#7b4a25,#5a351f); border: 3px solid #3b2718; }
.quran-pixel-tree::before { content: ""; position: absolute; left: -22px; top: -38px; width: 82px; height: 52px; background: #2f8b3b; border: 4px solid #1f6331; box-shadow: 12px -10px 0 #54ad47, -10px 11px 0 #3f9c40; }
.quran-pixel-flower { position: absolute; width: 18px; height: 18px; background: #ffe8f0; border: 3px solid #e56d9e; box-shadow: 18px 10px 0 #ffd84a, 34px -2px 0 #fff1f7; }
.quran-map-asset { position: absolute; object-fit: contain; image-rendering: pixelated; pointer-events: none; user-select: none; filter: drop-shadow(0 8px 0 #17403a40); }
.quran-map-asset.tree { width: 132px; }
.quran-map-asset.bush { width: 98px; }
.quran-map-asset.cottage { width: 180px; }
.quran-map-asset.platform { width: 180px; filter: drop-shadow(0 10px 0 #17403a35); }
.quran-map-asset.bridge { width: 210px; }
.quran-map-asset.fence { width: 160px; }
.quran-map-asset.animal { width: 70px; filter: drop-shadow(0 6px 0 #17403a35); }
.quran-map-asset.cow { width: 110px; }
.quran-surah-station { position: absolute; width: 92px; height: 78px; border: 0; background: transparent; transform: translate(-50%, -50%); cursor: pointer; color: #17403a; font-weight: 900; image-rendering: pixelated; }
.quran-surah-station.locked { opacity: .45; filter: grayscale(.5); }
.quran-surah-station.near .quran-station-sign { transform: translateY(-5px) scale(1.06); filter: drop-shadow(0 0 10px #fff7a8) drop-shadow(0 8px 0 #6a472955); }
.quran-station-roof { display: none; }
.quran-station-sign { width: 118px; height: 92px; padding: 28px 16px 10px; margin-left: -13px; background: url('/assets/quran-pixel/wood-sign.png') center/contain no-repeat; border: 0; border-radius: 0; font-size: 9px; text-shadow: 0 1px 0 #fff5cf; transition: transform .15s ease, filter .15s ease; display: flex; flex-direction: column; align-items: center; justify-content: center; line-height: 1.05; }
.quran-station-sign b { display: block; font-size: 11px; }
.quran-player { position: absolute; width: 56px; height: 72px; transform: translate(-50%, -72%); transition: left .08s linear, top .08s linear; image-rendering: pixelated; background: url('/assets/english-run/runner-hero.png') center/contain no-repeat; filter: drop-shadow(0 8px 0 #17403a44); }
.quran-garden-controls { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; align-items: center; }
.quran-dpad { display: grid; grid-template-columns: repeat(3, 44px); grid-template-rows: repeat(3, 38px); gap: 5px; justify-content: start; }
.quran-dpad button, .quran-read-btn { border: 0; border-radius: 10px; background: #fffaf3; color: #17403a; font-weight: 900; box-shadow: inset 0 -3px 0 #cdeadf; touch-action: manipulation; cursor: pointer; }
.quran-dpad button:active, .quran-read-btn:active { transform: translateY(2px); box-shadow: inset 0 -1px 0 #cdeadf; }
.quran-dpad .up { grid-column: 2; }
.quran-dpad .left { grid-column: 1; grid-row: 2; }
.quran-dpad .right { grid-column: 3; grid-row: 2; }
.quran-dpad .down { grid-column: 2; grid-row: 3; }
.quran-read-btn { justify-self: end; min-height: 52px; padding: 0 18px; background: linear-gradient(135deg,#198576,#f3c861); color: #fff; box-shadow: 0 8px 0 #126153; }
.quran-read-btn:disabled { opacity: .55; filter: grayscale(.3); }
.quran-reading-card { position: fixed; inset: auto 50% 22px auto; transform: translateX(50%); z-index: 78; width: min(620px, calc(100vw - 24px)); max-height: 72vh; overflow-y: auto; background: #fffaf3; border: 4px solid #8b5b2e; border-radius: 14px; padding: 18px; box-shadow: 0 22px 60px #0008; color: #17403a; }
.quran-reading-card h3 { margin: 0 0 2px; }
.quran-reading-meta { margin: 0 0 12px; color: #4c6b62; font-size: 12px; }
.quran-reading-error { margin: 9px 0; color: #a33d30; font-size: 11px; font-weight: 800; }
.quran-ayah { padding: 10px 0; border-top: 1px solid #eadfc8; }
.quran-ayah-line { display: flex; align-items: center; gap: 9px; }
.quran-ayah-line .quran-ayah-ar { flex: 1; }
.quran-ayah-audio { width: 36px; height: 36px; flex: 0 0 36px; border: 1px solid #bfe0d6; border-radius: 50%; background: #fff; color: #17856f; display: grid; place-items: center; cursor: pointer; }
.quran-ayah-audio.playing { border-color: #e4a936; background: #e4a936; color: #fff; }
.quran-ayah-ar { font-size: 24px; line-height: 1.8; text-align: right; }
.quran-ayah-latin { color: #4c6b62; font-size: 12px; }
.quran-reading-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
@media (max-width: 700px) {
  .hijaiyah-shell { padding: 18px; }
  .hijaiyah-match-columns { gap: 8%; }
  .hijaiyah-match-col { width: 46%; }
  .hijaiyah-match-item { min-height: 72px; font-size: 28px; }
  .hijaiyah-match-item.word { font-size: 16px; }
  .quran-garden-cta { grid-template-columns: 1fr; }
  .quran-path-head { align-items: flex-start; flex-direction: column; }
  .quran-pixel-map { min-height: 430px; height: 58vh; }
  .quran-garden-controls { grid-template-columns: 1fr; }
  .quran-read-btn { justify-self: stretch; }
}
${QURAN_MEMORY_CSS}
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

type View = 'map' | 'intro' | 'match' | 'result' | 'collection' | 'garden' | 'memoryArena' | 'pathDetail' | 'iqraReader' | 'juz30Reader';

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

interface GardenSurah {
  id: string;
  number: number;
  name: string;
  meaning: string;
  garden: string;
  position: Point;
  ayat: { arabic: string; latin: string }[];
}

const GARDEN_KEY = 'brightoria.quran.garden.v1';
const quranPath = quranItemsByIsland('quran');

function QuranPathDetail({ item, onBack }: { item: QuranPathItem; onBack: () => void }) {
  return (
    <div className="quran-path-detail">
      <section className={'quran-path-detail-hero ' + item.tier}>
        <span className="quran-path-badge">
          {item.tier === 'premium' && <Lock size={11} />}
          {item.badge}
        </span>
        <h3>{item.title}</h3>
        <p>{item.focus}</p>
        <div className="quran-path-sample hijaiyah-arabic">{item.sample}</div>
        <span className="quran-path-detail-source">{item.sourceNote} Konten ini masih draft untuk review akademik Bright Academy.</span>
      </section>
      <div className="quran-path-lesson-grid">
        {item.lessons.map((lesson) => (
          <article key={lesson.id} className="quran-path-lesson">
            <h4>{lesson.title}</h4>
            {lesson.arabic && <div className="quran-path-lesson-arabic hijaiyah-arabic">{lesson.arabic}</div>}
            <div className="quran-path-lesson-meta">
              {lesson.latin && <span><b>Bacaan:</b> {lesson.latin}</span>}
              {lesson.meaning && <span><b>Makna:</b> {lesson.meaning}</span>}
              <span><b>Catatan:</b> {lesson.note}</span>
            </div>
            <div className="quran-path-practice">Latihan: {lesson.practice}</div>
          </article>
        ))}
      </div>
      <div className="quran-path-detail-actions">
        <button className="hijaiyah-ghost-btn" onClick={onBack}>Kembali ke peta</button>
      </div>
    </div>
  );
}

const gardenSurahs: GardenSurah[] = [
  {
    id: 'al-ikhlas',
    number: 112,
    name: 'Al-Ikhlas',
    meaning: 'Keikhlasan',
    garden: 'Taman Tauhid',
    position: { x: 17, y: 28 },
    ayat: [
      { arabic: 'قُلْ هُوَ اللّٰهُ اَحَدٌ', latin: 'Qul huwallahu ahad' },
      { arabic: 'اَللّٰهُ الصَّمَدُ', latin: 'Allahus-samad' },
      { arabic: 'لَمْ يَلِدْ وَلَمْ يُوْلَدْ', latin: 'Lam yalid wa lam yulad' },
      { arabic: 'وَلَمْ يَكُنْ لَّهٗ كُفُوًا اَحَدٌ', latin: 'Wa lam yakun lahu kufuwan ahad' },
    ],
  },
  {
    id: 'al-falaq',
    number: 113,
    name: 'Al-Falaq',
    meaning: 'Waktu Subuh',
    garden: 'Kebun Cahaya',
    position: { x: 34, y: 47 },
    ayat: [
      { arabic: 'قُلْ اَعُوْذُ بِرَبِّ الْفَلَقِ', latin: 'Qul a\'udzu birabbil-falaq' },
      { arabic: 'مِنْ شَرِّ مَا خَلَقَ', latin: 'Min sharri ma khalaq' },
      { arabic: 'وَمِنْ شَرِّ غَاسِقٍ اِذَا وَقَبَ', latin: 'Wa min sharri ghasiqin idza waqab' },
      { arabic: 'وَمِنْ شَرِّ النَّفّٰثٰتِ فِى الْعُقَدِ', latin: 'Wa min sharrin-naffatsati fil-uqad' },
      { arabic: 'وَمِنْ شَرِّ حَاسِدٍ اِذَا حَسَدَ', latin: 'Wa min sharri hasidin idza hasad' },
    ],
  },
  {
    id: 'an-nas',
    number: 114,
    name: 'An-Nas',
    meaning: 'Manusia',
    garden: 'Taman Perlindungan',
    position: { x: 52, y: 31 },
    ayat: [
      { arabic: 'قُلْ اَعُوْذُ بِرَبِّ النَّاسِ', latin: 'Qul a\'udzu birabbin-nas' },
      { arabic: 'مَلِكِ النَّاسِ', latin: 'Malikin-nas' },
      { arabic: 'اِلٰهِ النَّاسِ', latin: 'Ilahin-nas' },
      { arabic: 'مِنْ شَرِّ الْوَسْوَاسِ الْخَنَّاسِ', latin: 'Min sharril-waswasil-khannas' },
      { arabic: 'الَّذِيْ يُوَسْوِسُ فِيْ صُدُوْرِ النَّاسِ', latin: 'Alladzi yuwaswisu fi sudurin-nas' },
      { arabic: 'مِنَ الْجِنَّةِ وَالنَّاسِ', latin: 'Minal-jinnati wan-nas' },
    ],
  },
  {
    id: 'al-kawthar',
    number: 108,
    name: 'Al-Kawthar',
    meaning: 'Nikmat Banyak',
    garden: 'Kolam Syukur',
    position: { x: 72, y: 44 },
    ayat: [
      { arabic: 'اِنَّآ اَعْطَيْنٰكَ الْكَوْثَرَ', latin: 'Inna a\'thainakal-kawthar' },
      { arabic: 'فَصَلِّ لِرَبِّكَ وَانْحَرْ', latin: 'Fa salli lirabbika wanhar' },
      { arabic: 'اِنَّ شَانِئَكَ هُوَ الْاَبْتَرُ', latin: 'Inna syani-aka huwal-abtar' },
    ],
  },
  {
    id: 'al-asr',
    number: 103,
    name: 'Al-Asr',
    meaning: 'Waktu',
    garden: 'Taman Waktu',
    position: { x: 22, y: 70 },
    ayat: [
      { arabic: 'وَالْعَصْرِ', latin: 'Wal-asr' },
      { arabic: 'اِنَّ الْاِنْسَانَ لَفِيْ خُسْرٍ', latin: 'Innal-insana lafi khusr' },
      { arabic: 'اِلَّا الَّذِيْنَ اٰمَنُوْا وَعَمِلُوا الصّٰلِحٰتِ', latin: 'Illalladzina amanu wa amilus-salihat' },
    ],
  },
  {
    id: 'quraysh',
    number: 106,
    name: 'Quraisy',
    meaning: 'Suku Quraisy',
    garden: 'Pasar Amanah',
    position: { x: 49, y: 72 },
    ayat: [
      { arabic: 'لِاِيْلٰفِ قُرَيْشٍ', latin: 'Li ilafi quraysh' },
      { arabic: 'اٖلٰفِهِمْ رِحْلَةَ الشِّتَاۤءِ وَالصَّيْفِ', latin: 'Ilafihim rihlatas-syita-i was-saif' },
      { arabic: 'فَلْيَعْبُدُوْا رَبَّ هٰذَا الْبَيْتِ', latin: 'Falya\'budu rabba hadzal-bait' },
      { arabic: 'الَّذِيْٓ اَطْعَمَهُمْ مِّنْ جُوْعٍ وَّاٰمَنَهُمْ مِّنْ خَوْفٍ', latin: 'Alladzi ath\'amahum min ju\'in wa amanahum min khauf' },
    ],
  },
  {
    id: 'al-fil',
    number: 105,
    name: 'Al-Fil',
    meaning: 'Gajah',
    garden: 'Bukit Kisah',
    position: { x: 82, y: 68 },
    ayat: [
      { arabic: 'اَلَمْ تَرَ كَيْفَ فَعَلَ رَبُّكَ بِاَصْحٰبِ الْفِيْلِ', latin: 'Alam tara kaifa fa\'ala rabbuka bi-ashabil-fil' },
      { arabic: 'اَلَمْ يَجْعَلْ كَيْدَهُمْ فِيْ تَضْلِيْلٍ', latin: 'Alam yaj\'al kaidahum fi tadlil' },
      { arabic: 'وَاَرْسَلَ عَلَيْهِمْ طَيْرًا اَبَابِيْلَ', latin: 'Wa arsala alaihim thairan ababil' },
      { arabic: 'تَرْمِيْهِمْ بِحِجَارَةٍ مِّنْ سِجِّيْلٍ', latin: 'Tarmihim bihijaratim min sijjil' },
      { arabic: 'فَجَعَلَهُمْ كَعَصْفٍ مَّأْكُوْلٍ', latin: 'Fa ja\'alahum ka\'asfim ma\'kul' },
    ],
  },
];

function loadGardenProgress(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(GARDEN_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

function saveGardenProgress(doneIds: string[]) {
  try {
    localStorage.setItem(GARDEN_KEY, JSON.stringify(doneIds));
  } catch {
    /* localStorage may be unavailable in embedded previews. */
  }
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

function QuranGardenAdventure({
  onBack,
  onCompleteGarden,
}: {
  onBack: () => void;
  onCompleteGarden: () => void;
}) {
  const [doneIds, setDoneIds] = useState<string[]>(() => loadGardenProgress());
  const [player, setPlayer] = useState<Point>({ x: 12, y: 52 });
  const [readingId, setReadingId] = useState<string | null>(null);
  const [playingAyah, setPlayingAyah] = useState<number | null>(null);
  const [audioError, setAudioError] = useState('');
  const [pressed, setPressed] = useState<Partial<Record<'up' | 'down' | 'left' | 'right', boolean>>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioSequenceRef = useRef(0);

  const doneSet = useMemo(() => new Set(doneIds), [doneIds]);
  const nearSurah = useMemo(() => {
    return gardenSurahs.find((surah, index) => {
      const unlocked = index === 0 || doneSet.has(gardenSurahs[index - 1].id);
      if (!unlocked) return false;
      const dx = player.x - surah.position.x;
      const dy = player.y - surah.position.y;
      return Math.hypot(dx, dy) <= 10;
    });
  }, [doneSet, player]);
  const readingSurah = gardenSurahs.find((surah) => surah.id === readingId) ?? null;

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const map: Record<string, 'up' | 'down' | 'left' | 'right'> = {
        ArrowUp: 'up',
        w: 'up',
        W: 'up',
        ArrowDown: 'down',
        s: 'down',
        S: 'down',
        ArrowLeft: 'left',
        a: 'left',
        A: 'left',
        ArrowRight: 'right',
        d: 'right',
        D: 'right',
      };
      const dir = map[e.key];
      if (!dir) return;
      e.preventDefault();
      setPressed((prev) => ({ ...prev, [dir]: true }));
    }
    function onKeyUp(e: KeyboardEvent) {
      const map: Record<string, 'up' | 'down' | 'left' | 'right'> = {
        ArrowUp: 'up',
        w: 'up',
        W: 'up',
        ArrowDown: 'down',
        s: 'down',
        S: 'down',
        ArrowLeft: 'left',
        a: 'left',
        A: 'left',
        ArrowRight: 'right',
        d: 'right',
        D: 'right',
      };
      const dir = map[e.key];
      if (!dir) return;
      setPressed((prev) => ({ ...prev, [dir]: false }));
    }
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  useEffect(() => {
    const tick = window.setInterval(() => {
      setPlayer((prev) => {
        const dx = (pressed.right ? 1 : 0) - (pressed.left ? 1 : 0);
        const dy = (pressed.down ? 1 : 0) - (pressed.up ? 1 : 0);
        if (!dx && !dy) return prev;
        const speed = dx && dy ? 1.45 : 2;
        return {
          x: Math.max(6, Math.min(94, prev.x + dx * speed)),
          y: Math.max(15, Math.min(84, prev.y + dy * speed)),
        };
      });
    }, 45);
    return () => window.clearInterval(tick);
  }, [pressed]);

  useEffect(() => {
    return () => {
      audioSequenceRef.current += 1;
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  function setDirection(dir: 'up' | 'down' | 'left' | 'right', isDown: boolean) {
    setPressed((prev) => ({ ...prev, [dir]: isDown }));
  }

  function openNearest() {
    if (!nearSurah) return;
    sfx.click();
    setReadingId(nearSurah.id);
  }

  function completeReading(surah: GardenSurah) {
    stopRecitation();
    const alreadyDone = doneSet.has(surah.id);
    const nextDone = alreadyDone ? doneIds : [...doneIds, surah.id];
    setDoneIds(nextDone);
    saveGardenProgress(nextDone);
    setReadingId(null);
    if (!alreadyDone) {
      sfx.correct();
      onCompleteGarden();
    }
  }

  function stopRecitation() {
    audioSequenceRef.current += 1;
    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    setPlayingAyah(null);
  }

  function playGardenAyah(surah: GardenSurah, ayahIndex: number, sequenceId: number, continueSurah: boolean) {
    if (sequenceId !== audioSequenceRef.current || !surah.ayat[ayahIndex]) {
      setPlayingAyah(null);
      return;
    }
    const audio = new Audio(getRecitationUrl(surah.number, ayahIndex + 1));
    audio.preload = 'auto';
    audioRef.current = audio;
    setPlayingAyah(ayahIndex);
    setAudioError('');
    audio.onended = () => {
      audioRef.current = null;
      if (continueSurah && ayahIndex + 1 < surah.ayat.length && sequenceId === audioSequenceRef.current) {
        playGardenAyah(surah, ayahIndex + 1, sequenceId, true);
      } else {
        setPlayingAyah(null);
      }
    };
    audio.onerror = () => {
      audioRef.current = null;
      setPlayingAyah(null);
      setAudioError('Rekaman belum dapat diputar. Coba ketuk tombol dengarkan sekali lagi.');
    };
    audio.play().catch(() => {
      audioRef.current = null;
      setPlayingAyah(null);
      setAudioError('Browser belum mengizinkan suara. Ketuk tombol dengarkan sekali lagi.');
    });
  }

  function playWholeSurah(surah: GardenSurah) {
    if (playingAyah !== null) {
      stopRecitation();
      return;
    }
    stopRecitation();
    const sequenceId = audioSequenceRef.current;
    playGardenAyah(surah, 0, sequenceId, true);
  }

  function playOneAyah(surah: GardenSurah, ayahIndex: number) {
    if (playingAyah === ayahIndex) {
      stopRecitation();
      return;
    }
    stopRecitation();
    const sequenceId = audioSequenceRef.current;
    playGardenAyah(surah, ayahIndex, sequenceId, false);
  }

  return (
    <div className="quran-garden-shell">
      <div className="quran-garden-hud">
        <span>Taman Juz 30: {doneIds.length}/{gardenSurahs.length} surat dibaca</span>
        <span>Dekati papan, lalu tekan Baca</span>
      </div>

      <div className="quran-pixel-map" aria-label="Peta pixel Taman Juz 30">
        <div className="quran-pixel-stream" />
        <div className="quran-pixel-path" />
        <img className="quran-map-asset platform" src="/assets/quran-pixel/grass-platform.png" alt="" style={{ left: '2%', top: '3%' }} />
        <img className="quran-map-asset platform" src="/assets/quran-pixel/grass-platform.png" alt="" style={{ right: '2%', top: '6%', transform: 'scaleX(-1)' }} />
        <img className="quran-map-asset platform" src="/assets/quran-pixel/grass-platform.png" alt="" style={{ left: '4%', bottom: '18%' }} />
        <img className="quran-map-asset platform" src="/assets/quran-pixel/grass-platform.png" alt="" style={{ right: '6%', bottom: '20%' }} />
        <img className="quran-map-asset cottage" src="/assets/quran-pixel/cottage.png" alt="" style={{ left: '40%', top: '4%' }} />
        <img className="quran-map-asset tree" src="/assets/quran-pixel/tree.png" alt="" style={{ left: '8%', top: '12%' }} />
        <img className="quran-map-asset tree" src="/assets/quran-pixel/tree.png" alt="" style={{ right: '8%', top: '9%', transform: 'scaleX(-1)' }} />
        <img className="quran-map-asset tree" src="/assets/quran-pixel/tree.png" alt="" style={{ left: '15%', bottom: '12%' }} />
        <img className="quran-map-asset tree" src="/assets/quran-pixel/tree.png" alt="" style={{ right: '13%', bottom: '9%', transform: 'scaleX(-1)' }} />
        <img className="quran-map-asset bush" src="/assets/quran-pixel/bush.png" alt="" style={{ left: '28%', top: '18%' }} />
        <img className="quran-map-asset bush" src="/assets/quran-pixel/bush.png" alt="" style={{ right: '29%', top: '21%' }} />
        <img className="quran-map-asset bush" src="/assets/quran-pixel/bush.png" alt="" style={{ left: '34%', bottom: '13%' }} />
        <img className="quran-map-asset bush" src="/assets/quran-pixel/bush.png" alt="" style={{ right: '32%', bottom: '12%' }} />
        <img className="quran-map-asset fence" src="/assets/quran-pixel/fence-rail.png" alt="" style={{ left: '4%', top: '40%' }} />
        <img className="quran-map-asset fence" src="/assets/quran-pixel/fence-rail.png" alt="" style={{ right: '4%', top: '40%' }} />
        <img className="quran-map-asset bridge" src="/assets/quran-pixel/wood-bridge.png" alt="" style={{ left: '39%', bottom: '15%' }} />
        <img className="quran-map-asset animal cow" src="/assets/quran-pixel/cow.png" alt="" style={{ left: '19%', top: '34%' }} />
        <img className="quran-map-asset animal" src="/assets/quran-pixel/chicken.png" alt="" style={{ left: '70%', top: '34%' }} />
        <img className="quran-map-asset animal" src="/assets/quran-pixel/chicken.png" alt="" style={{ left: '63%', bottom: '22%', transform: 'scaleX(-1)' }} />
        <div className="quran-pixel-flower" style={{ left: '25%', top: '22%' }} />
        <div className="quran-pixel-flower" style={{ left: '61%', top: '20%' }} />
        <div className="quran-pixel-flower" style={{ left: '38%', top: '77%' }} />

        {gardenSurahs.map((surah, index) => {
          const unlocked = index === 0 || doneSet.has(gardenSurahs[index - 1].id);
          const near = nearSurah?.id === surah.id;
          return (
            <button
              key={surah.id}
              className={'quran-surah-station' + (unlocked ? '' : ' locked') + (near ? ' near' : '')}
              style={{ left: `${surah.position.x}%`, top: `${surah.position.y}%` }}
              onClick={() => {
                if (unlocked) {
                  sfx.click();
                  setReadingId(surah.id);
                }
              }}
              disabled={!unlocked}
            >
              <div className="quran-station-roof" />
              <div className="quran-station-sign">
                <b>{doneSet.has(surah.id) ? 'Selesai' : surah.name}</b>
                {surah.garden}
              </div>
            </button>
          );
        })}

        <div className="quran-player" style={{ left: `${player.x}%`, top: `${player.y}%` }} />
      </div>

      <div className="quran-garden-controls">
        <div className="quran-dpad" aria-label="Kontrol jalan">
          <button className="up" onPointerDown={() => setDirection('up', true)} onPointerUp={() => setDirection('up', false)} onPointerLeave={() => setDirection('up', false)}>▲</button>
          <button className="left" onPointerDown={() => setDirection('left', true)} onPointerUp={() => setDirection('left', false)} onPointerLeave={() => setDirection('left', false)}>◀</button>
          <button className="right" onPointerDown={() => setDirection('right', true)} onPointerUp={() => setDirection('right', false)} onPointerLeave={() => setDirection('right', false)}>▶</button>
          <button className="down" onPointerDown={() => setDirection('down', true)} onPointerUp={() => setDirection('down', false)} onPointerLeave={() => setDirection('down', false)}>▼</button>
        </div>
        <button className="quran-read-btn" onClick={openNearest} disabled={!nearSurah}>
          {nearSurah ? `Baca ${nearSurah.name}` : 'Dekati papan surat'}
        </button>
      </div>

      <button className="hijaiyah-ghost-btn" onClick={onBack}>
        Kembali ke Huruf Hijaiyah
      </button>

      {readingSurah && (
        <div className="quran-reading-card">
          <h3>{readingSurah.name}</h3>
          <p className="quran-reading-meta">
            {readingSurah.meaning} &bull; {readingSurah.garden}
          </p>
          {readingSurah.ayat.map((ayah, index) => (
            <div className="quran-ayah" key={`${readingSurah.id}-${index}`}>
              <div className="quran-ayah-line">
                <div className="quran-ayah-ar hijaiyah-arabic">{ayah.arabic}</div>
                <button
                  type="button"
                  className={'quran-ayah-audio' + (playingAyah === index ? ' playing' : '')}
                  onClick={() => playOneAyah(readingSurah, index)}
                  title={`Dengarkan ayat ${index + 1}`}
                >
                  <Volume2 size={16} />
                </button>
              </div>
              <div className="quran-ayah-latin">{ayah.latin}</div>
            </div>
          ))}
          {audioError && <p className="quran-reading-error">{audioError}</p>}
          <div className="quran-reading-actions">
            <button className="hijaiyah-ghost-btn" onClick={() => playWholeSurah(readingSurah)}>
              <Volume2 size={16} /> {playingAyah === null ? 'Dengarkan surat' : 'Hentikan audio'}
            </button>
            <button className="hijaiyah-ghost-btn" onClick={() => { stopRecitation(); setReadingId(null); }}>
              Tutup
            </button>
            <button className="hijaiyah-primary-btn" style={{ maxWidth: 'none' }} onClick={() => completeReading(readingSurah)}>
              Tandai sudah dibaca <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
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
  const [activePathId, setActivePathId] = useState<string | null>(null);
  const [iqraInitialJilid, setIqraInitialJilid] = useState<IqraJilid>(1);
  const [accountActive, setAccountActive] = useState(
    () => document.documentElement.dataset.brightoriaAuthenticated === 'true',
  );
  const [premiumActive, setPremiumActive] = useState(() => hasPremiumAccess());
  const [premiumTarget, setPremiumTarget] = useState<QuranPathItem | null>(null);
  const [confettiTick, setConfettiTick] = useState(0);
  const [lastResult, setLastResult] = useState<{ stars: 0 | 1 | 2 | 3; mistakes: number } | null>(null);
  const [matchKey, setMatchKey] = useState(0);

  const overallMastery = useMemo(() => computeMastery(evidence, letters.length), [evidence]);
  const totalWords = letters.length * 4;

  const activeLetter = letters.find((l) => l.id === activeLetterId) ?? null;
  const activePathItem = activePathId ? quranPath.find((item) => item.id === activePathId) ?? null : null;
  const activeProgress = activeLetterId ? evidence.letters[activeLetterId] : undefined;

  // Tutorial demo HANYA muncul jika huruf ini belum pernah diselesaikan.
  const shouldShowDemo = activeLetterId ? !evidence.letters[activeLetterId]?.completed : false;
  const [demoShownThisSession, setDemoShownThisSession] = useState(false);

  useEffect(() => {
    const syncAccount = () => {
      setAccountActive(document.documentElement.dataset.brightoriaAuthenticated === 'true');
    };
    window.addEventListener('brightoria:player-authenticated', syncAccount);
    return () => window.removeEventListener('brightoria:player-authenticated', syncAccount);
  }, []);

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
    setActivePathId(null);
  }

  function openPathDetail(item: QuranPathItem) {
    if (item.tier === 'account' && !accountActive) {
      window.dispatchEvent(new CustomEvent('brightoria:request-auth', { detail: { mode: 'register' } }));
      return;
    }
    if (item.tier === 'premium' && !premiumActive) {
      setPremiumTarget(item);
      return;
    }
    setActivePathId(item.id);
    if (item.id === 'iqra-1-free') {
      setIqraInitialJilid(1);
      setView('iqraReader');
      return;
    }
    if (item.id === 'iqra-2-6-account') {
      setIqraInitialJilid(2);
      setView('iqraReader');
      return;
    }
    if (item.id === 'juz30-starter-free') {
      setView('juz30Reader');
      return;
    }
    setView('pathDetail');
  }

  function handleSpeak(text: string, e?: React.MouseEvent) {
    e?.stopPropagation();
    speakArabic(text);
  }

  return (
    <div className="hijaiyah-overlay">
      <div className={'hijaiyah-shell' + (view === 'garden' || view === 'memoryArena' || view === 'iqraReader' || view === 'juz30Reader' ? ' garden' : '')}>
        <Confetti trigger={confettiTick} />

        <header className="hijaiyah-head">
          <div>
            <span className="chip">Taman Al-Qur'an</span>
            <h2>
              {view === 'map' && 'Petualangan Huruf Hijaiyah'}
              {(view === 'intro' || view === 'match' || view === 'result') && `Huruf ${activeLetter?.name}`}
              {view === 'collection' && 'Koleksi Kosakata'}
              {view === 'garden' && 'Taman Pixel Juz 30'}
              {view === 'memoryArena' && "Arena Hafalan Qur'an"}
              {view === 'pathDetail' && (activePathItem?.title ?? 'Jalur Materi Qur\'an')}
              {view === 'iqraReader' && "Iqra' Jilid 1-6"}
              {view === 'juz30Reader' && 'Mushaf Juz 30'}
            </h2>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {(view === 'intro' || view === 'match' || view === 'garden' || view === 'memoryArena' || view === 'pathDetail' || view === 'iqraReader' || view === 'juz30Reader') && (
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
            <div style={{ display: 'grid', gap: 10, marginBottom: 14 }}>
              <div className="quran-garden-cta" style={{ margin: 0 }}>
                <div>
                  <h3>Arena Hafalan Qur'an</h3>
                  <p>Sambung ayat, susun urutan, tebak surat, dan kenali bacaan qari dalam ronde singkat.</p>
                </div>
                <button className="hijaiyah-primary-btn" style={{ maxWidth: 210 }} onClick={() => setView('memoryArena')}>
                  Masuk arena <ChevronRight size={16} />
                </button>
              </div>
              <div className="quran-garden-cta" style={{ margin: 0 }}>
                <div>
                  <h3>Taman Pixel Juz 30</h3>
                  <p>Jelajahi taman islami, temukan papan surat pendek, lalu baca pelan-pelan.</p>
                </div>
                <button className="hijaiyah-primary-btn" style={{ maxWidth: 210 }} onClick={() => setView('garden')}>
                  Jelajah taman <ChevronRight size={16} />
                </button>
              </div>
            </div>
            <section className="quran-path-section" aria-label="Jalur materi Taman Al-Qur'an">
              <div className="quran-path-head">
                <h3>Jalur Materi Qur'an</h3>
                <small>Coba gratis, masuk untuk Iqra' 2-6, Premium untuk Tilawah 30 Juz.</small>
              </div>
              <div className="quran-path-grid">
                {quranPath.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={'quran-path-card ' + item.tier
                      + (item.tier === 'account' && !accountActive ? ' account-locked' : '')
                      + (item.tier === 'premium' && !premiumActive ? ' premium-locked' : '')}
                    onClick={() => openPathDetail(item)}
                    aria-label={item.tier === 'account' && !accountActive
                      ? `${item.title}, gratis setelah masuk atau daftar`
                      : item.tier === 'premium' && !premiumActive
                        ? `${item.title}, terkunci Premium`
                        : item.title}
                  >
                    <span className="quran-path-badge">
                      {((item.tier === 'account' && !accountActive) || item.tier === 'premium') && <Lock size={11} />}
                      {item.tier === 'account' && accountActive
                        ? 'Akun aktif'
                        : item.tier === 'premium' && premiumActive
                          ? 'Premium aktif'
                          : item.badge}
                    </span>
                    <h4>{item.title}</h4>
                    <p>{item.subtitle}</p>
                    <div className="quran-path-sample hijaiyah-arabic">{item.sample}</div>
                    <span className="quran-path-focus">{item.focus}</span>
                    <span className="quran-path-cta">
                      {item.tier === 'account' && !accountActive
                        ? 'Masuk / Daftar Gratis'
                        : item.tier === 'premium' && !premiumActive
                          ? 'Buka dengan Premium'
                          : item.cta} <ChevronRight size={13} />
                    </span>
                  </button>
                ))}
              </div>
            </section>
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

        {view === 'pathDetail' && activePathItem && (
          <QuranPathDetail item={activePathItem} onBack={backToMap} />
        )}

        {view === 'iqraReader' && (
          <IqraReader
            onBack={backToMap}
            initialJilid={iqraInitialJilid}
            accountActive={accountActive}
            onRequireAccount={() => window.dispatchEvent(new CustomEvent('brightoria:request-auth', { detail: { mode: 'register' } }))}
          />
        )}

        {view === 'juz30Reader' && <Juz30Reader onBack={backToMap} />}

        {view === 'memoryArena' && (
          <QuranMemoryArena
            onBack={backToMap}
            onComplete={(xp) => {
              onXpEarned(xp);
              setConfettiTick((n) => n + 1);
            }}
          />
        )}

        {view === 'garden' && (
          <QuranGardenAdventure
            onBack={backToMap}
            onCompleteGarden={() => {
              onXpEarned(20);
              setConfettiTick((n) => n + 1);
            }}
          />
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
      <PremiumUpgradeModal
        open={premiumTarget !== null}
        featureId={premiumTarget?.id ?? 'quran-premium'}
        featureTitle={premiumTarget?.title ?? 'Materi Premium Al-Qur\'an'}
        onClose={() => setPremiumTarget(null)}
        onAccessVerified={() => {
          const verifiedItem = premiumTarget;
          setPremiumActive(true);
          setPremiumTarget(null);
          if (verifiedItem) {
            setActivePathId(verifiedItem.id);
            setView('pathDetail');
          }
        }}
      />
    </div>
  );
}
