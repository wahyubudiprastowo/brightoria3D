import CanvasBoundary from '../../components/CanvasBoundary';
import { Component, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import CinematicRig, { ThreePointLights } from '../../render/CinematicRig';
import Postfx from '../../render/Postfx';
import ProceduralEnv from '../../render/ProceduralEnv';
import { getQuality, scaleCount } from '../../render/quality';
import { recordMathAnswer, type Fraction, type MathVisual } from '../math/mathGenerator';
import {
  LANE_COUNT,
  buildFlight,
  getWordPoolSize,
  type SkyQuestion,
  type SkyTopic,
} from '../skyrun/skyRunQuestions';

/**
 * FroggyGame.tsx — "Lompat Katak" (Patch 50).
 *
 * ====================================================================
 * KENAPA MODE INI DIBANGUN TERPISAH DARI PENERBANGAN ILMU
 * ====================================================================
 * Sekilas keduanya sama: pilih satu dari tiga jawaban. Tapi ritmenya
 * berlawanan, dan itulah alasan utamanya:
 *
 *   PENERBANGAN ILMU : terus bergerak, ada tekanan waktu, menguji
 *                      KELANCARAN dan refleks
 *   LOMPAT KATAK     : bergiliran, TANPA tekanan waktu, menguji
 *                      KETEPATAN dan pertimbangan
 *
 * Perbedaan itu penting secara pedagogi. Anak yang MEMBEKU saat diburu
 * waktu tetap bisa berhasil di sini — ia boleh memandangi soalnya
 * selama yang ia mau. Ini bukan sekadar variasi tampilan, melainkan
 * jalur kedua untuk tipe anak yang berbeda.
 *
 * ====================================================================
 * KEMAJUAN YANG TERLIHAT MATA
 * ====================================================================
 * Penerbangan Ilmu menunjukkan kemajuan lewat angka skor. Di sini
 * kemajuan BERBENTUK: daun teratai yang sudah dilewati tetap ada di
 * belakang, membentuk jejak yang memanjang.
 *
 * Anak bisa menoleh dan melihat sendiri seberapa jauh ia sudah
 * melompat. Bagi anak usia 6-12, bukti visual semacam itu jauh lebih
 * berarti daripada angka yang naik.
 *
 * ====================================================================
 * MEMAKAI ULANG SUMBER SOAL YANG SAMA
 * ====================================================================
 * Soal diambil dari skyRunQuestions.ts — persis sumber yang dipakai
 * Penerbangan Ilmu. Artinya mode ini TIDAK menambah materi ajar baru,
 * hanya cara penyajian baru.
 *
 * Mode Angka tetap mencatat ke mesin adaptif; mode Kata tetap TIDAK
 * menyentuh penjadwalan Leitner. Alasannya sama seperti Patch 48.
 * ====================================================================
 */

const STYLE_ID = 'brightoria-froggy-styles-v1';

/** Posisi mendatar tiga daun pilihan. */
const LANE_X = [-2.75, 0, 2.75];

/** Jarak antar-langkah ke depan. */
const STEP_Z = 4.3;

/** Kenaikan ketinggian tiap langkah — memberi rasa "mendaki". */
const STEP_Y = 0.13;

/** Lama satu lompatan, dalam detik. */
const JUMP_DURATION = 0.72;
const FROGGY_MODEL_URL = '/assets/models/froggy.glb';
const FROGGY_JUMP_MODEL_URL = '/assets/models/froggy-jump.glb';
const FROGGY_LILY_PAD_URL = '/assets/models/froggy-lily-pad.glb';
const FROGGY_LOTUS_URL = '/assets/models/froggy-lotus.glb';
const FROGGY_CATTAIL_URL = '/assets/models/froggy-cattail-grove.glb';
const FROGGY_LANTERN_A_URL = '/assets/models/froggy-lantern-oasis-a.glb';
const FROGGY_LANTERN_B_URL = '/assets/models/froggy-lantern-oasis-b.glb';
const FROGGY_LEAF_SIGN_URL = '/assets/models/froggy-lotus-leaf-sign.glb';
const FROGGY_OASIS_BG_URL = '/assets/froggy/oasis-desert-background.png';

type PadState = 'idle' | 'hit' | 'reveal' | 'dim';

/**
 * Posisi daun pada langkah & jalur tertentu.
 *
 * Jalurnya sengaja MELENGKUNG pelan lewat sinus, bukan lurus. Lintasan
 * lurus terbaca sebagai lorong buatan; belokan lembut membuatnya terasa
 * seperti menyusuri kolam sungguhan.
 */
function padPosition(step: number, lane: number): [number, number, number] {
  const drift = Math.sin(step * 0.55) * 1.7;
  return [LANE_X[lane] + drift, step * STEP_Y, -step * STEP_Z];
}

/** Posisi tengah satu langkah — dipakai kamera & daun awal. */
function stepCenter(step: number): [number, number, number] {
  const drift = Math.sin(step * 0.55) * 1.7;
  return [drift, step * STEP_Y, -step * STEP_Z];
}

const FROGGY_CSS = `
.frg-overlay {
  position: fixed; inset: 0; z-index: 92; display: flex; flex-direction: column;
  background:
    linear-gradient(180deg, rgba(255,244,218,0.08), rgba(0,68,74,0.35)),
    url('/assets/froggy/oasis-desert-background.png') center center / cover no-repeat,
    #0b2c24;
}
.frg-canvas { position: absolute; inset: 0; }
.frg-canvas canvas { background: transparent !important; }

/* ---------- Panel pertanyaan ---------- */
.frg-question {
  position: absolute; top: 12px; left: 50%; transform: translateX(-50%);
  z-index: 4; width: min(620px, calc(100vw - 28px));
  background: rgba(255,255,255,0.96); border-radius: 19px;
  padding: 12px 18px; text-align: center;
  box-shadow: 0 10px 28px rgba(6,40,30,0.34);
  border-bottom: 4px solid #3fbf7f;
  pointer-events: none;
}
.frg-q-emoji { font-size: 26px; line-height: 1; margin-bottom: 3px; }
.frg-q-text { font-size: 24px; font-weight: 900; color: #0f5c4c; line-height: 1.22; }
.frg-q-text.arabic { font-family: 'Noto Naskh Arabic','Amiri',serif; direction: rtl; font-size: 30px; }
.frg-q-hint { font-size: 10.5px; color: #5a7f74; margin-top: 3px; }
.frg-q-ask { font-size: 10.5px; font-weight: 800; color: #3fbf7f; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.08em; }

/* ---------- Batang pecahan ---------- */
.frg-visual { display: flex; align-items: center; justify-content: center; gap: 10px; margin: 8px 0 2px; flex-wrap: wrap; }
.frg-frac { display: flex; flex-direction: column; align-items: center; gap: 3px; }
.frg-frac-bar { display: flex; gap: 2px; padding: 3px; background: #eef7f3; border-radius: 7px; border: 1.5px solid #cfe8dd; }
.frg-frac-cell { width: 16px; height: 20px; border-radius: 3px; background: #ffffff; border: 1px solid #d7ebe3; }
.frg-frac-cell.on { background: linear-gradient(160deg,#6fd9a5,#1f9b6e); border-color: #1f9b6e; }
.frg-frac-label { font-size: 11.5px; font-weight: 900; color: #14624f; }
.frg-visual-op { font-size: 20px; font-weight: 900; color: #5a7f74; }

/* ---------- Papan skor ---------- */
.frg-hud { position: absolute; top: 12px; left: 12px; z-index: 5; display: flex; flex-direction: column; gap: 6px; pointer-events: none; }
.frg-chip {
  display: inline-flex; align-items: center; gap: 5px;
  background: rgba(255,255,255,0.94); border: 2px solid #a8e5cd;
  border-radius: 999px; padding: 5px 12px;
  font-size: 11.5px; font-weight: 900; color: #0f5c4c;
  box-shadow: 0 5px 14px rgba(6,40,30,0.26);
}
.frg-chip.streak { background: linear-gradient(135deg,#fff3d6,#ffe2a3); border-color: #e0a63e; color: #7a5410; }
.frg-chip.level { background: linear-gradient(135deg,#eaf7ef,#d4efe0); border-color: #3fbf7f; color: #14624f; }

.frg-close {
  position: absolute; top: 12px; right: 12px; z-index: 5;
  border: 0; background: #ffffff; border-radius: 50%;
  width: 38px; height: 38px; display: grid; place-items: center;
  cursor: pointer; color: #0f5c4c; font-size: 18px; font-weight: 900;
  box-shadow: 0 5px 14px rgba(6,40,30,0.26);
}

/* ---------- Kartu pilihan di bawah layar ---------- */
.frg-choices {
  position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%);
  z-index: 6; display: flex; gap: 9px;
  width: min(640px, calc(100vw - 24px));
}
.frg-choice {
  flex: 1; min-width: 0;
  border: 3px solid rgba(255,255,255,0.45);
  background: rgba(255,255,255,0.93);
  border-radius: 16px; padding: 11px 9px;
  display: flex; flex-direction: column; align-items: center; gap: 5px;
  cursor: pointer; font-family: inherit;
  box-shadow: 0 6px 18px rgba(6,40,30,0.32);
  transition: transform 0.14s ease, border-color 0.14s ease, background 0.14s ease;
  user-select: none; -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
}
.frg-choice:hover:not(:disabled) { transform: translateY(-4px); border-color: #6fd9a5; }
.frg-choice:disabled { cursor: default; }
.frg-choice-num {
  display: grid; place-items: center;
  width: 19px; height: 19px; border-radius: 50%;
  background: #e0f2ea; color: #5a7f74;
  font-size: 10.5px; font-weight: 900; flex-shrink: 0;
}
.frg-choice-text {
  font-size: 15px; font-weight: 900; color: #0f5c4c;
  line-height: 1.2; text-align: center; overflow-wrap: anywhere;
}
.frg-choice-text.arabic { font-family: 'Noto Naskh Arabic','Amiri',serif; direction: rtl; font-size: 19px; }
.frg-choice.hit { border-color: #3fbf7f; background: #e8f9f1; }
.frg-choice.hit .frg-choice-num { background: #3fbf7f; color: #fff; }
.frg-choice.reveal { border-color: #e0a63e; background: #fff6e4; }
.frg-choice.reveal .frg-choice-num { background: #e0a63e; color: #fff; }
.frg-choice.dim { opacity: 0.42; }

/* ---------- Umpan balik ---------- */
.frg-feedback {
  position: absolute; top: 46%; left: 50%; transform: translate(-50%,-50%);
  z-index: 7; text-align: center; pointer-events: none;
  animation: frg-pop 0.45s cubic-bezier(0.34,1.56,0.64,1);
  width: min(460px, calc(100vw - 40px));
}
.frg-fb-badge {
  display: inline-block; padding: 10px 24px; border-radius: 999px;
  font-size: 20px; font-weight: 900; color: #fff;
  box-shadow: 0 10px 28px rgba(6,40,30,0.42);
}
.frg-fb-badge.good { background: linear-gradient(135deg,#3fbf7f,#17856f); }
.frg-fb-badge.miss { background: linear-gradient(135deg,#7fc9b4,#3f8f7a); }
.frg-fb-answer {
  margin-top: 8px; background: rgba(255,255,255,0.96);
  border-radius: 14px; padding: 9px 16px; font-size: 13px;
  font-weight: 800; color: #0f5c4c; line-height: 1.5;
  box-shadow: 0 6px 18px rgba(6,40,30,0.28);
}
.frg-levelup {
  margin-top: 8px; background: linear-gradient(135deg,#3fbf7f,#17856f);
  color: #fff; border-radius: 999px; padding: 7px 17px;
  font-size: 12px; font-weight: 900;
  box-shadow: 0 8px 20px rgba(23,133,111,0.42);
}
@keyframes frg-pop {
  0% { opacity: 0; transform: translate(-50%,-50%) scale(0.7); }
  100% { opacity: 1; transform: translate(-50%,-50%) scale(1); }
}

.frg-hint {
  position: absolute; bottom: 116px; left: 50%; transform: translateX(-50%);
  z-index: 4; background: rgba(15,92,76,0.88); color: #d6f5e9;
  border-radius: 999px; padding: 6px 16px; font-size: 10.5px;
  white-space: nowrap; pointer-events: none;
}

/* ---------- Layar mulai & hasil ---------- */
.frg-screen {
  position: absolute; inset: 0; z-index: 9;
  background: linear-gradient(160deg, rgba(11,44,36,0.93), rgba(20,98,79,0.93));
  display: grid; place-items: center; padding: 20px; overflow-y: auto;
}
.frg-panel {
  background: #ffffff; border-radius: 26px; padding: 24px 22px;
  width: min(440px, 100%); text-align: center;
  box-shadow: 0 20px 56px rgba(0,0,0,0.42);
  border-top: 6px solid #3fbf7f;
}
.frg-panel-emoji { font-size: 46px; line-height: 1; }
.frg-panel h2 { margin: 9px 0 5px; font-size: 20px; color: #0f5c4c; }
.frg-panel p { margin: 0 0 15px; font-size: 13px; line-height: 1.6; color: #5a7f74; }

.frg-topics { display: flex; flex-direction: column; gap: 10px; margin-bottom: 15px; }
.frg-topic {
  display: flex; align-items: center; gap: 12px; text-align: left;
  border: 2.5px solid #cfe8dd; background: #f7fdfa; border-radius: 19px;
  padding: 14px 15px; cursor: pointer; font-family: inherit; width: 100%;
  transition: transform 0.12s ease, border-color 0.15s ease;
}
.frg-topic:hover:not(:disabled) { transform: translateY(-2px); border-color: #6fd9a5; }
.frg-topic:disabled { opacity: 0.5; cursor: not-allowed; }
.frg-topic.angka { border-color: #cfe0f5; background: linear-gradient(160deg,#f7faff,#eaf1fc); }
.frg-topic.angka:hover:not(:disabled) { border-color: #6d8ed0; }
.frg-topic-icon { font-size: 30px; line-height: 1; flex-shrink: 0; }
.frg-topic-body { flex: 1; min-width: 0; }
.frg-topic-title { font-size: 14.5px; font-weight: 900; color: #0f5c4c; }
.frg-topic.angka .frg-topic-title { color: #002880; }
.frg-topic-desc { font-size: 11px; color: #5a7f74; line-height: 1.45; margin-top: 2px; }
.frg-topic-tag {
  display: inline-block; margin-top: 5px; font-size: 9.5px; font-weight: 900;
  padding: 3px 9px; border-radius: 999px; background: #d6f5e9; color: #14624f;
}
.frg-topic-tag.level { background: #d6eefb; color: #1a5578; }
.frg-topic-arrow { font-size: 19px; color: #6fd9a5; flex-shrink: 0; }

.frg-stats { display: flex; gap: 8px; justify-content: center; margin-bottom: 15px; flex-wrap: wrap; }
.frg-stat {
  background: linear-gradient(160deg,#e9fbf3,#d6f5e9); border: 1px solid #a8e5cd;
  border-radius: 15px; padding: 10px 14px; min-width: 84px;
}
.frg-stat b { display: block; font-size: 22px; color: #0f5c4c; line-height: 1.1; }
.frg-stat span { display: block; font-size: 9.5px; color: #5a7f74; margin-top: 2px; }
.frg-btn {
  border: 0; border-radius: 17px; padding: 14px 20px;
  font-size: 15px; font-weight: 900; cursor: pointer;
  font-family: inherit; width: 100%; min-height: 52px;
  display: flex; align-items: center; justify-content: center; gap: 8px;
}
.frg-btn.primary { background: linear-gradient(135deg,#3fbf7f,#0f5c4c); color: #fff; box-shadow: 0 9px 24px rgba(15,92,76,0.36); }
.frg-btn.ghost { background: #fff; border: 2px solid #cfe8dd; color: #0f5c4c; margin-top: 9px; }
.frg-howto { text-align: left; background: #f2fbf7; border-radius: 15px; padding: 12px 14px; margin-bottom: 15px; }
.frg-howto div { font-size: 11.5px; color: #14624f; line-height: 1.7; }

@media (max-width: 760px) {
  .frg-question { padding: 10px 14px; top: 9px; }
  .frg-q-text { font-size: 20px; }
  .frg-q-text.arabic { font-size: 25px; }
  .frg-q-emoji { font-size: 22px; }
  .frg-frac-cell { width: 13px; height: 17px; }
  .frg-choices { width: calc(100vw - 18px); bottom: 14px; gap: 7px; }
  .frg-choice { padding: 10px 7px; border-radius: 14px; }
  .frg-choice-text { font-size: 13px; }
  .frg-choice-text.arabic { font-size: 17px; }
  .frg-hint { bottom: 106px; }
}
`;

function useInjectStyles() {
  useEffect(() => {
    if (document.getElementById(STYLE_ID)) return;
    const el = document.createElement('style');
    el.id = STYLE_ID;
    el.textContent = FROGGY_CSS;
    document.head.appendChild(el);
  }, []);
}

// ---------------------------------------------------------------------------
// BATANG PECAHAN
// ---------------------------------------------------------------------------

function FractionBar({ fraction }: { fraction: Fraction }) {
  const cells = Math.min(fraction.den, 12);
  return (
    <div className="frg-frac">
      <div className="frg-frac-bar">
        {Array.from({ length: cells }).map((_, i) => (
          <span key={i} className={'frg-frac-cell' + (i < fraction.num ? ' on' : '')} />
        ))}
      </div>
      <div className="frg-frac-label">
        {fraction.num}/{fraction.den}
      </div>
    </div>
  );
}

function VisualRow({ visual }: { visual: MathVisual }) {
  if (visual.fractions.length === 0) return null;
  return (
    <div className="frg-visual">
      {visual.fractions.map((f, i) => (
        <span key={i} style={{ display: 'contents' }}>
          {i > 0 && visual.operator && <span className="frg-visual-op">{visual.operator}</span>}
          <FractionBar fraction={f} />
        </span>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PAPAN JAWABAN SEBAGAI TEKSTUR
// ---------------------------------------------------------------------------

/**
 * Menggambar teks jawaban ke kanvas untuk dipakai sebagai tekstur.
 *
 * Pelajaran dari Patch 49: memakai <Html> untuk label di ruang 3D
 * membuat teks berukuran piksel tetap, sehingga tidak ikut mengecil
 * secara perspektif dan bisa saling menimpa. Tekstur menyelesaikan itu.
 *
 * Ukuran huruf menyusut otomatis bila teksnya panjang.
 */
/**
 * Menggambar batang pecahan ke kanvas papan daun.
 *
 * Inilah perbaikan terpenting Patch 59 untuk Lompat Katak.
 *
 * MASALAH: batang pecahan hanya ada di panel HTML kecil di ATAS layar,
 * sedangkan pilihan ada di papan daun di BAWAH. Anak harus bolak-balik
 * memandang — beban perhatian terbelah (split attention).
 *
 * Bagi anak 6-12, membandingkan 2/3 dengan 1/3 secara ABSTRAK jauh
 * lebih sulit daripada melihat dua batang bersebelahan. Sekarang
 * batangnya digambar LANGSUNG di papan pilihan.
 */
function drawBar(
  ctx: CanvasRenderingContext2D,
  num: number,
  den: number,
  cx: number,
  y: number,
  maxW: number,
) {
  const cells = Math.min(den, 12);
  const gap = 3;
  const cw = Math.min(30, (maxW - gap * (cells - 1)) / cells);
  const ch = 34;
  const totalW = cells * cw + gap * (cells - 1);
  let x = cx - totalW / 2;

  for (let i = 0; i < cells; i++) {
    const on = i < num;
    ctx.fillStyle = on ? '#2f9e72' : '#ffffff';
    ctx.strokeStyle = on ? '#1f7a56' : '#cfe0d8';
    ctx.lineWidth = 2.5;

    const r = 5;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + cw - r, y);
    ctx.quadraticCurveTo(x + cw, y, x + cw, y + r);
    ctx.lineTo(x + cw, y + ch - r);
    ctx.quadraticCurveTo(x + cw, y + ch, x + cw - r, y + ch);
    ctx.lineTo(x + r, y + ch);
    ctx.quadraticCurveTo(x, y + ch, x, y + ch - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    x += cw + gap;
  }
}

function makeSignTexture(text: string, isArabic: boolean): THREE.CanvasTexture {
  const w = 512;
  const h = 224;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // Papan kayu bersudut membulat.
  const r = 30;
  ctx.fillStyle = '#fffdf6';
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(w - r, 0);
  ctx.quadraticCurveTo(w, 0, w, r);
  ctx.lineTo(w, h - r);
  ctx.quadraticCurveTo(w, h, w - r, h);
  ctx.lineTo(r, h);
  ctx.quadraticCurveTo(0, h, 0, h - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fill();

  const family = isArabic ? "'Noto Naskh Arabic','Amiri',serif" : "'Nunito',system-ui,sans-serif";

  let size = isArabic ? 96 : 84;
  ctx.font = `900 ${size}px ${family}`;
  while (ctx.measureText(text).width > w - 56 && size > 28) {
    size -= 4;
    ctx.font = `900 ${size}px ${family}`;
  }

  /**
   * Bila label berbentuk pecahan (mis. "2/3"), teks digeser ke atas
   * dan batang visual digambar di bawahnya. Anak tidak perlu lagi
   * memandang bolak-balik ke panel atas.
   */
  const frac = /^(\d+)\s*\/\s*(\d+)$/.exec(text.trim());

  ctx.fillStyle = '#0f5c4c';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, w / 2, frac ? h * 0.32 : h / 2 + (isArabic ? 6 : 2), w - 48);

  if (frac) {
    drawBar(ctx, Number(frac[1]), Number(frac[2]), w / 2, h * 0.52, w - 70);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

// ---------------------------------------------------------------------------
// AIR
// ---------------------------------------------------------------------------

/**
 * Permukaan kolam.
 *
 * Kesan realistisnya datang dari PANTULAN, bukan dari geometri:
 * roughness sangat rendah + metalness tinggi membuat air memantulkan
 * peta lingkungan yang dipasang ProceduralEnv. Tanpa IBL, permukaan
 * seperti ini akan terlihat seperti plastik gelap.
 */
function Water({ centerZ }: { centerZ: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const quality = getQuality();
  const alphaMap = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(0.2, 'rgba(255,255,255,0.25)');
      gradient.addColorStop(0.54, 'rgba(255,255,255,0.72)');
      gradient.addColorStop(0.86, 'rgba(255,255,255,0.48)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, []);

  useEffect(() => () => alphaMap.dispose(), [alphaMap]);

  useFrame((state) => {
    if (!ref.current || !quality.motion) return;
    // Naik-turun sangat halus — cukup untuk terasa hidup, tidak sampai
    // membuat daun terlihat melayang.
    ref.current.position.y = -1.08 + Math.sin(state.clock.elapsedTime * 0.55) * 0.012;
    ref.current.position.z = THREE.MathUtils.lerp(ref.current.position.z, centerZ - 18, 0.045);
  });

  return (
    <mesh ref={ref} position={[0, -1.08, centerZ - 18]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[42, 74, 1, 1]} />
      <meshStandardMaterial
        color="#1f8f9d"
        roughness={0.24}
        metalness={0.04}
        transparent
        opacity={0.32}
        alphaMap={alphaMap}
        depthWrite={false}
      />
    </mesh>
  );
}

/**
 * Riak yang mengembang di titik pendaratan.
 *
 * Isyarat sebab-akibat: anak melihat bahwa lompatannya MENGENAI air.
 * Tanpa riak, pendaratan terasa tidak menyentuh apa pun.
 */
function Ripple({ position, seed }: { position: [number, number, number]; seed: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const start = useRef<number | null>(null);

  useFrame((state) => {
    if (!ref.current) return;
    if (start.current === null) start.current = state.clock.elapsedTime;
    const age = state.clock.elapsedTime - start.current;
    const life = 1.5;
    const t = Math.min(1, age / life);

    const scale = 0.5 + t * 3.4;
    ref.current.scale.set(scale, scale, 1);

    const material = ref.current.material as THREE.MeshBasicMaterial;
    if (material) material.opacity = (1 - t) * 0.45;
  });

  return (
    <mesh
      ref={ref}
      position={[position[0], -0.38, position[2]]}
      rotation={[-Math.PI / 2, 0, 0]}
      key={seed}
    >
      <ringGeometry args={[0.55, 0.78, 28]} />
      <meshBasicMaterial color="#b9f2df" transparent opacity={0.45} depthWrite={false} />
    </mesh>
  );
}

// ---------------------------------------------------------------------------
// DAUN TERATAI
// ---------------------------------------------------------------------------

/**
 * Satu daun teratai beserta papan jawabannya.
 *
 * Daun dibuat dari silinder pipih bersisi delapan, bukan lingkaran
 * halus — konsisten dengan gaya blocky yang dipakai karakter dan arena.
 *
 * Papan jawaban BERDIRI TEGAK menghadap kamera, bukan tergeletak di
 * permukaan daun. Teks yang terbaring datar akan terlihat terjepit
 * secara perspektif dan sulit dibaca dari sudut kamera di belakang.
 */
function LilyPad({
  position,
  label,
  isArabic,
  state,
  onPick,
  interactive,
  bobPhase,
}: {
  position: [number, number, number];
  label?: string;
  isArabic?: boolean;
  state: PadState;
  onPick?: () => void;
  interactive: boolean;
  bobPhase: number;
}) {
  const group = useRef<THREE.Group>(null);
  const quality = getQuality();
  const [hovered, setHovered] = useState(false);

  const texture = useMemo(
    () => (label ? makeSignTexture(label, isArabic === true) : null),
    [label, isArabic],
  );

  // Tekstur kanvas memakai memori GPU. Tanpa pembuangan ini, tiap
  // pergantian soal meninggalkan tekstur menggantung.
  useEffect(() => {
    return () => {
      if (texture) texture.dispose();
    };
  }, [texture]);

  useFrame((state2) => {
    if (!group.current || !quality.motion) return;
    const t = state2.clock.elapsedTime;
    // Mengapung pelan, tiap daun punya ritme sendiri.
    group.current.position.y = position[1] + Math.sin(t * 0.9 + bobPhase) * 0.045;
    group.current.rotation.z = Math.sin(t * 0.7 + bobPhase) * 0.02;
  });

  const padColor =
    state === 'hit'
      ? '#4fd99a'
      : state === 'reveal'
        ? '#e0a63e'
        : state === 'dim'
          ? '#3d6b5e'
          : hovered && interactive
            ? '#63cc94'
            : '#2f9e72';

  const signColor =
    state === 'hit' ? '#3fbf7f' : state === 'reveal' ? '#e0a63e' : state === 'dim' ? '#5a7f74' : '#1f9b6e';

  return (
    <group ref={group} position={position}>
      {/* Bayangan kontak di permukaan air — membuat daun terbaca
          MENGAPUNG, bukan melayang. */}
      <mesh position={[0, -0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.35, 20]} />
        <meshBasicMaterial color="#06281f" transparent opacity={0.26} depthWrite={false} />
      </mesh>

      {/* Daun */}
      <group
        onClick={(e) => {
          e.stopPropagation();
          if (interactive && onPick) onPick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          if (!interactive) return;
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
      >
        <DecorModel
          url={FROGGY_LILY_PAD_URL}
          size={2.45}
          position={[0, 0.04, 0]}
          rotation={[0, bobPhase * 0.18, 0]}
          fallback={
            <mesh castShadow={quality.shadows} receiveShadow={quality.shadows}>
              <cylinderGeometry args={[1.25, 1.18, 0.16, 8]} />
              <meshStandardMaterial color={padColor} roughness={0.72} metalness={0.05} flatShading />
            </mesh>
          }
        />
        <mesh position={[0, 0.07, 0]} visible={false}>
          <cylinderGeometry args={[1.38, 1.3, 0.2, 16]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      </group>

      {/* Guratan daun — memecah permukaan agar tidak terbaca cakram polos */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 0.085, 0]} rotation={[0, (i * Math.PI) / 3, 0]}>
          <boxGeometry args={[2.1, 0.012, 0.055]} />
          <meshStandardMaterial color="#1f7a58" roughness={0.9} flatShading />
        </mesh>
      ))}

      {/* Bunga teratai kecil sebagai penanda daun jawaban benar */}
      {state === 'reveal' && (
        <group position={[0.78, 0.16, 0.42]}>
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh key={i} rotation={[0.5, (i * Math.PI * 2) / 5, 0]} position={[0, 0.06, 0]}>
              <boxGeometry args={[0.1, 0.03, 0.26]} />
              <meshStandardMaterial color="#ffd6ea" roughness={0.8} flatShading />
            </mesh>
          ))}
          <mesh position={[0, 0.1, 0]}>
            <sphereGeometry args={[0.07, 8, 8]} />
            <meshStandardMaterial
              color="#ffd166"
              emissive="#ffb703"
              emissiveIntensity={1.4}
              flatShading
            />
          </mesh>
        </group>
      )}

      {/* Papan jawaban berdiri tegak */}
      {texture && (
        <group position={[0, 0.95, 0]}>
          {/* Tiang */}
          <mesh position={[0, -0.42, 0]} castShadow={quality.shadows}>
            <cylinderGeometry args={[0.055, 0.07, 0.86, 6]} />
            <meshStandardMaterial color="#7a5a34" roughness={0.92} flatShading />
          </mesh>
          {/* Bingkai */}
          <mesh position={[0, 0, -0.012]}>
            <planeGeometry args={[2.2, 0.98]} />
            <meshBasicMaterial
              color={signColor}
              transparent
              opacity={state === 'dim' ? 0.25 : 0.9}
            />
          </mesh>
          {/* Papan */}
          <mesh
            onClick={(e) => {
              e.stopPropagation();
              if (interactive && onPick) onPick();
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              if (!interactive) return;
              setHovered(true);
              document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
              setHovered(false);
              document.body.style.cursor = 'auto';
            }}
          >
            <planeGeometry args={[2.06, 0.86]} />
            <meshBasicMaterial
              map={texture}
              transparent
              opacity={state === 'dim' ? 0.4 : 1}
              toneMapped={false}
            />
          </mesh>
        </group>
      )}

      {state !== 'dim' && state !== 'idle' && (
        <pointLight color={signColor} intensity={1.8} distance={5} position={[0, 0.9, 0]} />
      )}
    </group>
  );
}

// ---------------------------------------------------------------------------
// KATAK
// ---------------------------------------------------------------------------

function ProceduralFrogBody({ quality }: { quality: ReturnType<typeof getQuality> }) {
  return (
    <>
      <mesh castShadow={quality.shadows}>
        <boxGeometry args={[0.58, 0.38, 0.66]} />
        <meshStandardMaterial color="#4caf50" roughness={0.68} metalness={0.04} flatShading />
      </mesh>
      <mesh position={[0, -0.14, 0.02]}>
        <boxGeometry args={[0.5, 0.14, 0.58]} />
        <meshStandardMaterial color="#c9e8a8" roughness={0.8} flatShading />
      </mesh>
      <mesh position={[0, 0.2, 0.2]} castShadow={quality.shadows}>
        <boxGeometry args={[0.52, 0.28, 0.34]} />
        <meshStandardMaterial color="#57bd58" roughness={0.68} flatShading />
      </mesh>
      {[-0.16, 0.16].map((x) => (
        <group key={x} position={[x, 0.4, 0.22]}>
          <mesh>
            <sphereGeometry args={[0.13, 10, 10]} />
            <meshStandardMaterial color="#6cc96d" roughness={0.6} flatShading />
          </mesh>
          <mesh position={[0, 0.02, 0.1]}>
            <sphereGeometry args={[0.07, 10, 10]} />
            <meshBasicMaterial color="#17110e" />
          </mesh>
          <mesh position={[0.03, 0.06, 0.14]}>
            <sphereGeometry args={[0.026, 8, 8]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>
      ))}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.31, -0.11, -0.16]}>
          <mesh rotation={[0, 0, side * 0.3]} castShadow={quality.shadows}>
            <boxGeometry args={[0.15, 0.3, 0.2]} />
            <meshStandardMaterial color="#43a047" roughness={0.7} flatShading />
          </mesh>
          <mesh position={[side * 0.06, -0.2, 0.08]}>
            <boxGeometry args={[0.2, 0.09, 0.3]} />
            <meshStandardMaterial color="#c9e8a8" roughness={0.8} flatShading />
          </mesh>
        </group>
      ))}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.24, -0.16, 0.26]} castShadow={quality.shadows}>
          <boxGeometry args={[0.11, 0.18, 0.12]} />
          <meshStandardMaterial color="#43a047" roughness={0.7} flatShading />
        </mesh>
      ))}
    </>
  );
}

function FittedModel({
  url,
  size,
  rotation = [0, 0, 0],
  position = [0, 0, 0],
  fallback = null,
}: {
  url: string;
  size: number;
  rotation?: [number, number, number];
  position?: [number, number, number];
  fallback?: ReactNode;
}) {
  const quality = getQuality();
  const { scene } = useGLTF(url, false, true);
  const model = useMemo(() => {
    const clone = scene.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const dimensions = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const wrapper = new THREE.Group();
    wrapper.add(clone);
    clone.position.sub(center);
    wrapper.scale.setScalar(size / (Math.max(dimensions.x, dimensions.y, dimensions.z) || 1));
    clone.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        node.castShadow = quality.shadows;
        node.receiveShadow = quality.shadows;
      }
    });
    return wrapper;
  }, [scene, size, quality.shadows]);

  return (
    <group position={position} rotation={rotation}>
      <primitive object={model} dispose={null} />
    </group>
  );
}

class DecorModelBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error) {
    console.warn('[Brightoria] Froggy decor fallback:', error);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function DecorModel(props: Parameters<typeof FittedModel>[0]) {
  return (
    <DecorModelBoundary fallback={props.fallback ?? null}>
      <Suspense fallback={props.fallback ?? null}>
        <FittedModel {...props} />
      </Suspense>
    </DecorModelBoundary>
  );
}

function Waterfall() {
  const sheet = useRef<THREE.Group>(null);
  const foam = useRef<THREE.Points>(null);
  const droplets = useMemo(() => {
    const arr = new Float32Array(70 * 3);
    for (let i = 0; i < 70; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 2.2;
      arr[i * 3 + 1] = Math.random() * 2.2;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 0.35;
    }
    return arr;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (sheet.current) {
      sheet.current.position.y = Math.sin(t * 5.2) * 0.05;
      sheet.current.children.forEach((child, i) => {
        if (child instanceof THREE.Mesh) {
          const mat = child.material as THREE.MeshBasicMaterial;
          mat.opacity = 0.3 + Math.sin(t * 5.5 + i) * 0.08;
          child.scale.y = 1 + Math.sin(t * 4.1 + i) * 0.05;
        }
      });
    }
    if (foam.current) {
      foam.current.rotation.y += 0.006;
      const pos = foam.current.geometry.getAttribute('position') as THREE.BufferAttribute;
      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i) - 0.025 - (i % 5) * 0.002;
        pos.setY(i, y < -0.12 ? 2.1 : y);
      }
      pos.needsUpdate = true;
    }
  });

  return (
    <group position={[-8.05, 0.05, -12.72]} rotation={[0, 0.2, 0]}>
      <group position={[0, -0.16, 0.52]} ref={sheet}>
        {[-0.24, -0.08, 0.08, 0.24].map((x, i) => (
          <mesh key={i} position={[x, 0, i % 2 === 0 ? 0.015 : -0.015]} rotation={[0.03, 0, (i - 1.5) * 0.018]}>
            <planeGeometry args={[0.24, 0.92, 1, 8]} />
            <meshBasicMaterial color={i % 2 === 0 ? '#d8fbff' : '#8eeaff'} transparent opacity={0.36} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
        ))}
      </group>
      <mesh position={[0, -0.22, 0.64]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.28, 1.18, 32]} />
        <meshBasicMaterial color="#d9fbff" transparent opacity={0.42} depthWrite={false} />
      </mesh>
      <points ref={foam} position={[0, 0.28, 0.7]}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[droplets, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.075} color="#efffff" transparent opacity={0.82} depthWrite={false} />
      </points>
      <pointLight color="#bff6ff" intensity={1.7} distance={7} position={[0, 0.26, 1.05]} />
    </group>
  );
}

function PondSparkles() {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(90 * 3);
    for (let i = 0; i < 90; i++) {
      const lane = i % 3;
      arr[i * 3] = (Math.random() - 0.5) * 22 + (lane - 1) * 1.4;
      arr[i * 3 + 1] = -0.25 + Math.random() * 0.2;
      arr[i * 3 + 2] = -15 + Math.random() * 32;
    }
    return arr;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.rotation.y = Math.sin(t * 0.12) * 0.04;
    const material = ref.current.material as THREE.PointsMaterial;
    material.opacity = 0.35 + Math.sin(t * 2.8) * 0.16;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.09} color="#fff7b0" transparent opacity={0.45} depthWrite={false} />
    </points>
  );
}

function OasisPavilion() {
  const quality = getQuality();
  const domeMat = (
    <meshStandardMaterial
      color="#7dc7b4"
      emissive="#3c9f91"
      emissiveIntensity={0.18}
      roughness={0.55}
      metalness={0.12}
      flatShading
    />
  );

  return (
    <group position={[-8.05, 2.82, -13.55]} rotation={[0, 0.18, 0]} scale={0.96}>
      <mesh position={[0, -0.04, 0]} castShadow={quality.shadows} receiveShadow={quality.shadows}>
        <cylinderGeometry args={[1.45, 1.65, 0.32, 10]} />
        <meshStandardMaterial color="#e7d5b0" roughness={0.9} flatShading />
      </mesh>
      {[0, 1, 2, 3].map((i) => {
        const a = Math.PI / 4 + (i * Math.PI) / 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 1.05, 0.72, Math.sin(a) * 0.78]} castShadow={quality.shadows}>
            <cylinderGeometry args={[0.09, 0.12, 1.48, 8]} />
            <meshStandardMaterial color="#d7be8e" roughness={0.86} flatShading />
          </mesh>
        );
      })}
      <mesh position={[0, 1.48, 0]} castShadow={quality.shadows}>
        <cylinderGeometry args={[1.18, 1.38, 0.26, 10]} />
        <meshStandardMaterial color="#f0dfbc" roughness={0.82} flatShading />
      </mesh>
      <mesh position={[0, 1.72, 0]} scale={[1.15, 0.52, 1.15]} castShadow={quality.shadows}>
        <sphereGeometry args={[1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        {domeMat}
      </mesh>
      <mesh position={[0, 2.28, 0]} castShadow={quality.shadows}>
        <sphereGeometry args={[0.16, 10, 8]} />
        <meshStandardMaterial color="#f1c65b" emissive="#f6b93b" emissiveIntensity={0.6} roughness={0.42} />
      </mesh>
      <pointLight color="#fff1c0" intensity={0.9} distance={7} position={[0, 1.7, 0]} />
    </group>
  );
}

function OasisDecor() {
  const cattailFallback = (
    <group>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[i * 0.25 - 0.25, 0.35, 0]} rotation={[0.12, 0, (i - 1) * 0.1]}>
          <cylinderGeometry args={[0.035, 0.045, 1.1, 6]} />
          <meshStandardMaterial color="#1f6f4d" roughness={0.9} flatShading />
        </mesh>
      ))}
    </group>
  );

  return (
    <>
      <DecorModel
        url={FROGGY_LANTERN_B_URL}
        size={3.35}
        position={[-8.05, 0.86, -13.2]}
        rotation={[0, 0.2, 0]}
      />
      <Waterfall />
      <PondSparkles />
      <DecorModel url={FROGGY_LEAF_SIGN_URL} size={3.6} position={[8.2, 1.05, -8.8]} rotation={[0, -0.72, 0]} />
      <DecorModel url={FROGGY_LANTERN_A_URL} size={1.65} position={[-6.7, 0.1, -7.5]} rotation={[0, 0.38, 0]} />
      {[
        [-5.6, -0.2, -4.5, 0.4, 1.4],
        [4.8, -0.2, -6.2, -0.2, 1.25],
        [-7.0, -0.22, 4.8, 0.7, 1.5],
        [7.2, -0.22, 5.6, -0.7, 1.4],
        [-2.9, -0.24, -11.5, 0.1, 1.15],
        [2.9, -0.24, -11.8, -0.2, 1.15],
      ].map(([x, y, z, r, s], i) => (
        <DecorModel
          key={`cattail-${i}`}
          url={FROGGY_CATTAIL_URL}
          size={s}
          position={[x, y, z]}
          rotation={[0, r, 0]}
          fallback={cattailFallback}
        />
      ))}
      {[
        [-4.5, -0.18, 1.6, 0.4],
        [5.0, -0.16, 1.0, -0.3],
        [-6.2, -0.15, 9.0, 0.8],
        [6.4, -0.14, 8.7, -0.6],
      ].map(([x, y, z, r], i) => (
        <DecorModel
          key={`lotus-${i}`}
          url={FROGGY_LOTUS_URL}
          size={1.25}
          position={[x, y, z]}
          rotation={[0, r, 0]}
        />
      ))}
    </>
  );
}

function FroggyModel({ quality, url }: { quality: ReturnType<typeof getQuality>; url: string }) {
  const { scene } = useGLTF(url, false, true);
  const model = useMemo(() => scene.clone(true), [scene]);
  const fit = useMemo(() => {
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    const footprint = Math.max(size.x, size.z, 0.001);
    const scale = 0.92 / footprint;
    return {
      scale,
      position: [-center.x * scale, -box.min.y * scale + 0.11, -center.z * scale] as [
        number,
        number,
        number,
      ],
    };
  }, [model]);

  useMemo(() => {
    model.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        node.castShadow = quality.shadows;
        node.receiveShadow = quality.shadows;
      }
    });
  }, [model, quality.shadows]);

  return (
    <group position={fit.position} scale={fit.scale} rotation={[0, Math.PI, 0]}>
      <primitive object={model} />
    </group>
  );
}

class FrogModelBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    // eslint-disable-next-line no-console
    console.error('[Brightoria] Froggy model gagal dimuat, fallback prosedural dipakai:', error);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/**
 * Katak pemain, bergaya blocky agar selaras dengan karakter di Ekspedisi.
 *
 * Lompatannya memakai tiga prinsip animasi klasik sekaligus:
 *
 *   ANTICIPATION  : sesaat sebelum melompat, badan menekuk ke bawah
 *   SQUASH        : gepeng saat menolak dan saat mendarat
 *   STRETCH       : memanjang di puncak lintasan
 *
 * Tanpa ketiganya, lompatan hanya terlihat seperti kotak yang berpindah
 * tempat. Dengan ketiganya, katak terasa punya bobot dan tenaga.
 */
function Frog({
  fromPos,
  toPos,
  jumping,
  jumpStart,
  onLanded,
}: {
  fromPos: [number, number, number];
  toPos: [number, number, number];
  jumping: boolean;
  jumpStart: number;
  onLanded: () => void;
}) {
  const group = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const quality = getQuality();
  const landedRef = useRef(true);

  useEffect(() => {
    if (jumping) landedRef.current = false;
  }, [jumping, jumpStart]);

  useFrame((state) => {
    try {
      if (!group.current || !body.current) return;
      const now = state.clock.elapsedTime;
      const t = state.clock.elapsedTime;

      if (jumping) {
        const age = now - jumpStart;
        const p = Math.min(1, age / JUMP_DURATION);

        // Lintasan parabola: maju mendatar sambil naik lalu turun.
        const x = fromPos[0] + (toPos[0] - fromPos[0]) * p;
        const z = fromPos[2] + (toPos[2] - fromPos[2]) * p;
        const baseY = fromPos[1] + (toPos[1] - fromPos[1]) * p;
        const arc = Math.sin(p * Math.PI) * 1.75;
        group.current.position.set(x, baseY + 0.22 + arc, z);

        // Menghadap arah lompatan.
        const dx = toPos[0] - fromPos[0];
        const dz = toPos[2] - fromPos[2];
        group.current.rotation.y = Math.atan2(dx, -dz) * 0.35;

        // SQUASH saat menolak & mendarat, STRETCH di puncak.
        let squash = 1;
        if (p < 0.18) squash = 0.72 + (p / 0.18) * 0.42;
        else if (p > 0.84) squash = 1.14 - ((p - 0.84) / 0.16) * 0.42;
        else squash = 1.14;
        body.current.scale.set(2 - squash, squash, 2 - squash);
        body.current.rotation.x = -Math.sin(p * Math.PI) * 0.38;

        if (p >= 1 && !landedRef.current) {
          landedRef.current = true;
          onLanded();
        }
      } else {
        group.current.position.set(toPos[0], toPos[1] + 0.22, toPos[2]);
        group.current.rotation.y = 0;

        if (quality.motion) {
          // Napas pelan saat diam — katak tidak pernah benar-benar kaku.
          const breathe = 1 + Math.sin(t * 2.1) * 0.035;
          body.current.scale.set(1 / breathe, breathe, 1 / breathe);
          body.current.rotation.x = 0;
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[Brightoria] Froggy Frog error (diredam):', err);
    }
  });

  return (
    <group ref={group} position={[toPos[0], toPos[1] + 0.22, toPos[2]]}>
      <group ref={body}>
        <FrogModelBoundary key={jumping ? FROGGY_JUMP_MODEL_URL : FROGGY_MODEL_URL} fallback={<ProceduralFrogBody quality={quality} />}>
          <Suspense fallback={<ProceduralFrogBody quality={quality} />}>
            <FroggyModel quality={quality} url={jumping ? FROGGY_JUMP_MODEL_URL : FROGGY_MODEL_URL} />
          </Suspense>
        </FrogModelBoundary>
        <group visible={false}>
        {/* Badan */}
        <mesh castShadow={quality.shadows}>
          <boxGeometry args={[0.58, 0.38, 0.66]} />
          <meshStandardMaterial color="#4caf50" roughness={0.68} metalness={0.04} flatShading />
        </mesh>

        {/* Perut lebih terang */}
        <mesh position={[0, -0.14, 0.02]}>
          <boxGeometry args={[0.5, 0.14, 0.58]} />
          <meshStandardMaterial color="#c9e8a8" roughness={0.8} flatShading />
        </mesh>

        {/* Kepala */}
        <mesh position={[0, 0.2, 0.2]} castShadow={quality.shadows}>
          <boxGeometry args={[0.52, 0.28, 0.34]} />
          <meshStandardMaterial color="#57bd58" roughness={0.68} flatShading />
        </mesh>

        {/* Mata — menonjol di atas kepala, ciri khas katak */}
        {[-0.16, 0.16].map((x) => (
          <group key={x} position={[x, 0.4, 0.22]}>
            <mesh>
              <sphereGeometry args={[0.13, 10, 10]} />
              <meshStandardMaterial color="#6cc96d" roughness={0.6} flatShading />
            </mesh>
            <mesh position={[0, 0.02, 0.1]}>
              <sphereGeometry args={[0.07, 10, 10]} />
              <meshBasicMaterial color="#17110e" />
            </mesh>
            <mesh position={[0.03, 0.06, 0.14]}>
              <sphereGeometry args={[0.026, 8, 8]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          </group>
        ))}

        {/* Kaki belakang — menekuk, siap melompat */}
        {[-1, 1].map((side) => (
          <group key={side} position={[side * 0.31, -0.11, -0.16]}>
            <mesh rotation={[0, 0, side * 0.3]} castShadow={quality.shadows}>
              <boxGeometry args={[0.15, 0.3, 0.2]} />
              <meshStandardMaterial color="#43a047" roughness={0.7} flatShading />
            </mesh>
            <mesh position={[side * 0.06, -0.2, 0.08]}>
              <boxGeometry args={[0.2, 0.09, 0.3]} />
              <meshStandardMaterial color="#c9e8a8" roughness={0.8} flatShading />
            </mesh>
          </group>
        ))}

        {/* Kaki depan */}
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 0.24, -0.16, 0.26]} castShadow={quality.shadows}>
            <boxGeometry args={[0.11, 0.18, 0.12]} />
            <meshStandardMaterial color="#43a047" roughness={0.7} flatShading />
          </mesh>
        ))}
        </group>
      </group>
    </group>
  );
}

useGLTF.preload(FROGGY_MODEL_URL);
useGLTF.preload(FROGGY_JUMP_MODEL_URL);
useGLTF.preload(FROGGY_LILY_PAD_URL);
useGLTF.preload(FROGGY_LOTUS_URL);
useGLTF.preload(FROGGY_CATTAIL_URL);
useGLTF.preload(FROGGY_LANTERN_A_URL);
useGLTF.preload(FROGGY_LANTERN_B_URL);
useGLTF.preload(FROGGY_LEAF_SIGN_URL);

// ---------------------------------------------------------------------------
// SUASANA KOLAM
// ---------------------------------------------------------------------------

/**
 * Rumpun teratai, alang-alang, dan kunang-kunang.
 *
 * Fungsinya bukan hiasan semata: tanpa objek di kiri-kanan lintasan,
 * mata tidak punya acuan bahwa katak benar-benar BERGERAK MAJU. Objek
 * yang lewat di tepi layar itulah yang menciptakan rasa perpindahan.
 */
function PondAmbience() {
  const quality = getQuality();

  const props = useMemo(() => {
    let seed = 4242;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    const count = quality.tier === 'low' ? 26 : 46;
    return Array.from({ length: count }).map((_, i) => {
      const side = rand() > 0.5 ? 1 : -1;
      return {
        key: i,
        x: side * (5.5 + rand() * 9),
        z: 6 - rand() * 120,
        scale: 0.6 + rand() * 1.1,
        rot: rand() * Math.PI * 2,
        kind: rand() > 0.55 ? 'reed' : 'pad',
      };
    });
  }, [quality.tier]);

  const fireflies = useMemo(() => {
    const n = Math.max(12, scaleCount(40));
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 30;
      arr[i * 3 + 1] = 0.3 + Math.random() * 3.2;
      arr[i * 3 + 2] = 6 - Math.random() * 110;
    }
    return arr;
  }, []);

  const pointsRef = useRef<THREE.Points>(null);

  useFrame((state) => {
    if (!pointsRef.current || !quality.motion) return;
    // Kunang-kunang berdenyut pelan, tidak berpindah — cukup untuk
    // membuat kolam terasa hidup tanpa mengalihkan perhatian.
    const material = pointsRef.current.material as THREE.PointsMaterial;
    if (material) material.opacity = 0.45 + Math.sin(state.clock.elapsedTime * 1.3) * 0.18;
  });

  return (
    <group>
      {props.map((p) =>
        p.kind === 'reed' ? (
          <group key={p.key} position={[p.x, -0.3, p.z]} rotation={[0, p.rot, 0]} scale={p.scale}>
            {[0, 1, 2].map((i) => (
              <mesh key={i} position={[i * 0.18 - 0.18, 0.7, i * 0.12]}>
                <boxGeometry args={[0.07, 1.5, 0.07]} />
                <meshStandardMaterial color="#2f7d4f" roughness={0.95} flatShading />
              </mesh>
            ))}
            <mesh position={[-0.18, 1.55, 0]}>
              <boxGeometry args={[0.13, 0.4, 0.13]} />
              <meshStandardMaterial color="#8a5a34" roughness={0.9} flatShading />
            </mesh>
          </group>
        ) : (
          <mesh
            key={p.key}
            position={[p.x, -0.34, p.z]}
            rotation={[0, p.rot, 0]}
            scale={p.scale}
            receiveShadow={quality.shadows}
          >
            <cylinderGeometry args={[0.85, 0.8, 0.1, 8]} />
            <meshStandardMaterial color="#27865f" roughness={0.8} flatShading />
          </mesh>
        ),
      )}

      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[fireflies, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.11}
          color="#ffe9a8"
          transparent
          opacity={0.5}
          sizeAttenuation
          depthWrite={false}
        />
      </points>
    </group>
  );
}

// ---------------------------------------------------------------------------
// KAMERA
// ---------------------------------------------------------------------------

/**
 * Kamera mengikuti katak dari belakang-atas.
 *
 * Perpindahannya di-lerp lembut sehingga saat katak melompat, kamera
 * menyusul dengan sedikit jeda — memberi rasa bobot, bukan menempel
 * kaku seperti terikat batang.
 */
function FollowCamera({ target }: { target: [number, number, number] }) {
  const camera = useThree((s) => s.camera);
  const current = useRef(new THREE.Vector3(0, 3.9, 7.0));
  const look = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((_state, delta) => {
    try {
      const dt = Math.min(delta, 0.05);
      const desired = new THREE.Vector3(target[0] * 0.46, target[1] + 3.85, target[2] + 6.65);
      current.current.lerp(desired, Math.min(1, dt * 3.1));
      camera.position.copy(current.current);

      const lookTarget = new THREE.Vector3(target[0] * 0.32, target[1] + 0.82, target[2] - 5.7);
      look.current.lerp(lookTarget, Math.min(1, dt * 3.2));
      camera.lookAt(look.current);
    } catch {
      /* diamkan */
    }
  });

  return null;
}

// ---------------------------------------------------------------------------
// CATATAN REKOR
// ---------------------------------------------------------------------------

const RECORD_KEY = 'brightoria.froggy.v1';

interface FroggySlot {
  bestScore: number;
  bestStreak: number;
  rounds: number;
}

interface FroggyRecord {
  kata: FroggySlot;
  angka: FroggySlot;
}

const EMPTY_SLOT: FroggySlot = { bestScore: 0, bestStreak: 0, rounds: 0 };

function readSlot(value: unknown): FroggySlot {
  if (!value || typeof value !== 'object') return { ...EMPTY_SLOT };
  const v = value as Record<string, unknown>;
  return {
    bestScore: typeof v.bestScore === 'number' ? v.bestScore : 0,
    bestStreak: typeof v.bestStreak === 'number' ? v.bestStreak : 0,
    rounds: typeof v.rounds === 'number' ? v.rounds : 0,
  };
}

function loadRecord(): FroggyRecord {
  try {
    const raw = localStorage.getItem(RECORD_KEY);
    if (!raw) return { kata: { ...EMPTY_SLOT }, angka: { ...EMPTY_SLOT } };
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return { kata: readSlot(parsed.kata), angka: readSlot(parsed.angka) };
  } catch {
    return { kata: { ...EMPTY_SLOT }, angka: { ...EMPTY_SLOT } };
  }
}

function saveRecord(record: FroggyRecord): void {
  try {
    localStorage.setItem(RECORD_KEY, JSON.stringify(record));
  } catch {
    // Diamkan — kegagalan menyimpan tidak boleh menghentikan permainan.
  }
}

// ---------------------------------------------------------------------------
// SCENE
// ---------------------------------------------------------------------------

interface RippleSpec {
  id: number;
  position: [number, number, number];
}

function FroggyScene({
  question,
  step,
  padStates,
  frogFrom,
  frogTo,
  jumping,
  jumpStart,
  onLanded,
  onPick,
  interactive,
  ripples,
  trail,
}: {
  question: SkyQuestion | null;
  step: number;
  padStates: PadState[];
  frogFrom: [number, number, number];
  frogTo: [number, number, number];
  jumping: boolean;
  jumpStart: number;
  onLanded: () => void;
  onPick: (lane: number) => void;
  interactive: boolean;
  ripples: RippleSpec[];
  trail: { step: number; lane: number }[];
}) {
  const quality = getQuality();

  return (
    <>
      <CinematicRig exposure={1.12} />
      <ProceduralEnv intensity={1.05} />
      <fog attach="fog" args={['#d8f6ef', 36, 96]} />
      <ThreePointLights intensity={1.12} shadowRadius={16} />

      <Water centerZ={frogTo[2]} />
      <PondAmbience />
      <OasisDecor />

      <FollowCamera target={frogTo} />

      {/* Jejak daun yang sudah dilewati — inilah bukti kemajuan yang
          bisa dilihat anak saat menoleh ke belakang. */}
      {trail.map((t) => (
        <LilyPad
          key={`trail-${t.step}-${t.lane}`}
          position={padPosition(t.step, t.lane)}
          state="dim"
          interactive={false}
          bobPhase={t.step * 1.3}
        />
      ))}

      {/* Tiga daun pilihan di langkah berikutnya */}
      {question &&
        question.options.map((label, lane) => (
          <LilyPad
            key={`choice-${question.id}-${lane}`}
            position={padPosition(step + 1, lane)}
            label={label}
            isArabic={question.optionsAreArabic}
            state={padStates[lane]}
            onPick={() => onPick(lane)}
            interactive={interactive}
            bobPhase={lane * 2.1}
          />
        ))}

      <Frog
        fromPos={frogFrom}
        toPos={frogTo}
        jumping={jumping}
        jumpStart={jumpStart}
        onLanded={onLanded}
      />

      {ripples.map((r) => (
        <Ripple key={r.id} position={r.position} seed={r.id} />
      ))}

      {quality.postfx && <Postfx intensity={0.3} threshold={0.88} vignette={0.32} preserveAlpha />}
    </>
  );
}

// ---------------------------------------------------------------------------
// KOMPONEN UTAMA
// ---------------------------------------------------------------------------

type Phase = 'choose' | 'intro' | 'asking' | 'jumping' | 'result' | 'done';

export default function FroggyGame({
  onExit,
  onXpEarned,
}: {
  onExit: () => void;
  onXpEarned: (amount: number) => void;
}) {
  useInjectStyles();
  const quality = getQuality();

  const [topic, setTopic] = useState<SkyTopic | null>(null);
  const [plan, setPlan] = useState(() => ({ questions: [] as SkyQuestion[], levelLabel: '' }));
  const [phase, setPhase] = useState<Phase>('choose');
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [padStates, setPadStates] = useState<PadState[]>(() => Array(LANE_COUNT).fill('idle'));
  const [feedback, setFeedback] = useState<{
    good: boolean;
    answer: string;
    explanation?: string;
    levelUp?: 'up' | 'down' | null;
  } | null>(null);

  /** Posisi katak: langkah & jalur tempat ia berdiri sekarang. */
  const [frogStep, setFrogStep] = useState(0);
  const [frogLane, setFrogLane] = useState(1);
  const [jumping, setJumping] = useState(false);
  const [jumpStart, setJumpStart] = useState(0);
  const [pendingLane, setPendingLane] = useState<number | null>(null);
  const [trail, setTrail] = useState<{ step: number; lane: number }[]>([]);
  const [ripples, setRipples] = useState<RippleSpec[]>([]);

  const clockRef = useRef(0);
  const rippleId = useRef(0);

  const record = useMemo(() => loadRecord(), []);
  const wordPool = useMemo(() => getWordPoolSize(), []);
  const question = plan.questions[index] ?? null;
  const slot = topic ? record[topic] : record.kata;

  /** Posisi katak sekarang & tujuan lompatan. */
  const frogFrom = useMemo<[number, number, number]>(
    () => (frogStep === 0 ? stepCenter(0) : padPosition(frogStep, frogLane)),
    [frogStep, frogLane],
  );
  const frogTo = useMemo<[number, number, number]>(
    () =>
      pendingLane === null
        ? frogFrom
        : padPosition(frogStep + 1, pendingLane),
    [frogFrom, frogStep, pendingLane],
  );

  function chooseTopic(picked: SkyTopic) {
    const built = buildFlight(picked);
    setTopic(picked);
    setPlan({ questions: built.questions, levelLabel: built.levelLabel ?? '' });
    setPhase('intro');
  }

  /** Anak memilih satu daun. */
  const pick = useCallback(
    (lane: number) => {
      if (phase !== 'asking' || !question) return;

      setPendingLane(lane);
      setJumping(true);
      setJumpStart(clockRef.current);
      setPhase('jumping');
    },
    [phase, question],
  );

  /** Dipanggil saat katak mendarat. */
  const handleLanded = useCallback(() => {
    if (!question || pendingLane === null) return;

    const isRight = pendingLane === question.correctIndex;

    const nextStates: PadState[] = Array(LANE_COUNT).fill('dim');
    if (isRight) {
      nextStates[pendingLane] = 'hit';
    } else {
      // Daun yang benar tetap ditandai bunga emas — jawabannya
      // diperlihatkan, bukan disembunyikan. Ini momen belajar.
      nextStates[question.correctIndex] = 'reveal';
      nextStates[pendingLane] = 'dim';
    }
    setPadStates(nextStates);

    // Riak di titik pendaratan.
    const landingPos = padPosition(frogStep + 1, pendingLane);
    rippleId.current += 1;
    setRipples((prev) => [...prev.slice(-4), { id: rippleId.current, position: landingPos }]);

    // Mode Angka mencatat ke mesin adaptif; mode Kata tidak menyentuh
    // penjadwalan Leitner. Alasannya sama seperti Patch 48.
    let levelUp: 'up' | 'down' | null = null;
    if (question.math) {
      const result = recordMathAnswer(question.math, pendingLane);
      levelUp = result.levelChanged;
    }

    if (isRight) {
      const nextStreak = streak + 1;
      const gained = 100 + Math.min(nextStreak - 1, 5) * 25;
      setScore((s) => s + gained);
      setCorrect((c) => c + 1);
      setStreak(nextStreak);
      setBestStreak((b) => Math.max(b, nextStreak));
      setFeedback({ good: true, answer: '', levelUp });
    } else {
      setStreak(0);
      setFeedback({
        good: false,
        answer: question.options[question.correctIndex],
        explanation: question.explanation,
        levelUp,
      });
    }

    setJumping(false);
    setPhase('result');
  }, [question, pendingLane, frogStep, streak]);

  /** Jeda setelah mendarat, lalu lanjut ke soal berikutnya. */
  useEffect(() => {
    if (phase !== 'result') return;
    // Jawaban salah diberi jeda lebih lama agar penjelasannya sempat
    // terbaca — itulah bedanya momen belajar dengan sekadar gagal.
    const delay = feedback?.good ? 1100 : feedback?.explanation ? 2400 : 1700;
    const timer = window.setTimeout(() => {
      if (pendingLane !== null) {
        setTrail((prev) => [...prev, { step: frogStep + 1, lane: pendingLane }]);
        setFrogStep((s) => s + 1);
        setFrogLane(pendingLane);
        setPendingLane(null);
      }
      setFeedback(null);
      setPadStates(Array(LANE_COUNT).fill('idle'));

      if (index + 1 >= plan.questions.length) {
        setPhase('done');
      } else {
        setIndex((i) => i + 1);
        setPhase('asking');
      }
    }, delay);
    return () => window.clearTimeout(timer);
  }, [phase, feedback, index, plan.questions.length, pendingLane, frogStep]);

  /** Simpan rekor & berikan XP saat satu ronde selesai. */
  useEffect(() => {
    if (phase !== 'done' || !topic) return;
    const xp = correct * 6;
    if (xp > 0) onXpEarned(xp);

    const next = loadRecord();
    next[topic] = {
      bestScore: Math.max(next[topic].bestScore, score),
      bestStreak: Math.max(next[topic].bestStreak, bestStreak),
      rounds: next[topic].rounds + 1,
    };
    saveRecord(next);
  }, [phase, topic, correct, score, bestStreak, onXpEarned]);

  // --- Papan ketik ---
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const key = e.key.toLowerCase();
      if (key === 'escape') {
        onExit();
        return;
      }
      if (phase === 'asking' && (key === '1' || key === '2' || key === '3')) {
        e.preventDefault();
        pick(Number(key) - 1);
      }
      if ((key === 'enter' || key === ' ') && phase === 'intro') {
        e.preventDefault();
        setPhase('asking');
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, pick, onExit]);

  function playAgain() {
    if (!topic) return;
    const built = buildFlight(topic);
    setPlan({ questions: built.questions, levelLabel: built.levelLabel ?? '' });
    setIndex(0);
    setScore(0);
    setCorrect(0);
    setStreak(0);
    setBestStreak(0);
    setPadStates(Array(LANE_COUNT).fill('idle'));
    setFeedback(null);
    setFrogStep(0);
    setFrogLane(1);
    setPendingLane(null);
    setTrail([]);
    setRipples([]);
    setPhase('asking');
  }

  function backToChoose() {
    setTopic(null);
    setPlan({ questions: [], levelLabel: '' });
    setIndex(0);
    setScore(0);
    setCorrect(0);
    setStreak(0);
    setBestStreak(0);
    setFeedback(null);
    setFrogStep(0);
    setFrogLane(1);
    setPendingLane(null);
    setTrail([]);
    setRipples([]);
    setPhase('choose');
  }

  const showScene = phase === 'asking' || phase === 'jumping' || phase === 'result';

  return (
    <div className="frg-overlay">
      <div className="frg-canvas">
        <CanvasBoundary><Canvas
          shadows={quality.shadows}
          dpr={quality.dpr}
          camera={{ position: [0, 3.4, 7.5], fov: 52, near: 0.1, far: 160 }}
          style={{ background: 'transparent' }}
          gl={{ antialias: quality.antialias, alpha: true, powerPreference: 'high-performance', stencil: false }}
          onCreated={({ clock, gl }) => {
            gl.setClearColor(0x000000, 0);
            gl.setClearAlpha(0);
            // Jam dibaca terus agar waktu mulai lompatan tepat.
            const tick = () => {
              clockRef.current = clock.elapsedTime;
              requestAnimationFrame(tick);
            };
            tick();
          }}
        >
          <FroggyScene
            question={showScene ? question : null}
            step={frogStep}
            padStates={padStates}
            frogFrom={frogFrom}
            frogTo={frogTo}
            jumping={jumping}
            jumpStart={jumpStart}
            onLanded={handleLanded}
            onPick={pick}
            interactive={phase === 'asking'}
            ripples={ripples}
            trail={trail}
          />
        </Canvas></CanvasBoundary>
      </div>

      {/* ---------------- Papan skor ---------------- */}
      {showScene && (
        <>
          <div className="frg-hud">
            <span className="frg-chip">
              🐸 {index + 1}/{plan.questions.length}
            </span>
            <span className="frg-chip">⭐ {score.toLocaleString('id-ID')}</span>
            {topic === 'angka' && plan.levelLabel && (
              <span className="frg-chip level">📊 {plan.levelLabel}</span>
            )}
            {streak >= 2 && <span className="frg-chip streak">🔥 {streak} beruntun</span>}
          </div>

          <button className="frg-close" onClick={onExit} aria-label="Keluar">
            ×
          </button>

          {question && (
            <div className="frg-question">
              {question.emoji && <div className="frg-q-emoji">{question.emoji}</div>}
              <div className={'frg-q-text' + (question.promptIsArabic ? ' arabic' : '')}>
                {question.prompt}
              </div>
              {question.visual && <VisualRow visual={question.visual} />}
              <div className="frg-q-hint">{question.hint}</div>
              <div className="frg-q-ask">{question.ask}</div>
            </div>
          )}

          {feedback && (
            <div className="frg-feedback">
              <div className={'frg-fb-badge ' + (feedback.good ? 'good' : 'miss')}>
                {feedback.good ? '✓ Hop! Tepat!' : 'Hampir!'}
              </div>
              {!feedback.good && feedback.answer && (
                <div className="frg-fb-answer">
                  Jawabannya: <b>{feedback.answer}</b>
                  {feedback.explanation && (
                    <>
                      <br />
                      {feedback.explanation}
                    </>
                  )}
                </div>
              )}
              {feedback.levelUp === 'up' && (
                <div className="frg-levelup">📈 Naik tingkat! Soalnya jadi lebih menantang</div>
              )}
              {feedback.levelUp === 'down' && (
                <div className="frg-levelup">🌱 Kita pelan-pelan dulu ya</div>
              )}
            </div>
          )}

          {/* Kartu pilihan — cadangan bila papan 3D sulit dibaca, dan
              jalan masuk bagi anak yang lebih nyaman mengetuk di bawah
              layar. Pelajaran dari Patch 49. */}
          {question && (
            <div className="frg-choices">
              {question.options.map((opt, i) => {
                const padState = padStates[i];
                const cls =
                  'frg-choice' + (padState !== 'idle' ? ` ${padState}` : '');
                return (
                  <button
                    key={`${question.id}-choice-${i}`}
                    className={cls}
                    disabled={phase !== 'asking'}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      pick(i);
                    }}
                    aria-label={`Pilih daun ${i + 1}: ${opt}`}
                  >
                    <span className="frg-choice-num">{i + 1}</span>
                    <span
                      className={'frg-choice-text' + (question.optionsAreArabic ? ' arabic' : '')}
                    >
                      {opt}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {index === 0 && phase === 'asking' && (
            <div className="frg-hint">Ketuk daun teratai berisi jawaban yang benar</div>
          )}
        </>
      )}

      {/* ---------------- Pemilih materi ---------------- */}
      {phase === 'choose' && (
        <div className="frg-screen">
          <div className="frg-panel">
            <div className="frg-panel-emoji">🐸</div>
            <h2>Lompat Katak</h2>
            <p>Mau melompat membawa materi apa?</p>

            <div className="frg-topics">
              <button
                className="frg-topic"
                onClick={() => chooseTopic('kata')}
                disabled={wordPool < LANE_COUNT}
              >
                <span className="frg-topic-icon">📖</span>
                <span className="frg-topic-body">
                  <span className="frg-topic-title">Kata</span>
                  <span className="frg-topic-desc">
                    {wordPool < LANE_COUNT
                      ? 'Main dulu di salah satu dunia untuk membuka mode ini'
                      : 'Kosakata yang sudah kamu kuasai dari tiga dunia'}
                  </span>
                  {wordPool >= LANE_COUNT && (
                    <span className="frg-topic-tag">{wordPool} kata siap</span>
                  )}
                </span>
                <span className="frg-topic-arrow">›</span>
              </button>

              <button className="frg-topic angka" onClick={() => chooseTopic('angka')}>
                <span className="frg-topic-icon">🔢</span>
                <span className="frg-topic-body">
                  <span className="frg-topic-title">Angka</span>
                  <span className="frg-topic-desc">
                    Operasi hitung dengan tingkat kesulitan yang menyesuaikan kemampuanmu
                  </span>
                  <span className="frg-topic-tag level">Tidak pernah habis</span>
                </span>
                <span className="frg-topic-arrow">›</span>
              </button>
            </div>

            <button className="frg-btn ghost" onClick={onExit}>
              Nanti saja
            </button>
          </div>
        </div>
      )}

      {/* ---------------- Layar mulai ---------------- */}
      {phase === 'intro' && (
        <div className="frg-screen">
          <div className="frg-panel">
            <div className="frg-panel-emoji">🐸</div>
            <h2>{topic === 'angka' ? 'Lompat Katak: Angka' : 'Lompat Katak: Kata'}</h2>
            <p>
              {topic === 'angka'
                ? `Tingkat sekarang: ${plan.levelLabel}. Pilih daun teratai berisi jawaban yang benar!`
                : 'Pilih daun teratai berisi jawaban yang benar, lalu katak akan melompat ke sana!'}
            </p>

            <div className="frg-howto">
              <div>🐸 Ketuk daun teratai di kolam, atau kartu jawaban di bawah layar</div>
              <div>⌨️ Bisa juga tekan angka 1, 2, atau 3</div>
              <div>⏳ Tidak ada batas waktu — pikirkan dulu sepuasnya</div>
              <div>🌸 Kalau salah, daun yang benar akan berbunga emas</div>
              <div>💚 Salah tidak mengurangi apa pun — katak tetap melompat maju</div>
              {topic === 'angka' && (
                <div>📈 Kalau sering benar, soalnya otomatis jadi lebih menantang</div>
              )}
            </div>

            {slot.bestScore > 0 && (
              <div className="frg-stats">
                <div className="frg-stat">
                  <b>{slot.bestScore.toLocaleString('id-ID')}</b>
                  <span>skor terbaik</span>
                </div>
                <div className="frg-stat">
                  <b>{slot.bestStreak}</b>
                  <span>beruntun terbaik</span>
                </div>
              </div>
            )}

            <button className="frg-btn primary" onClick={() => setPhase('asking')}>
              Mulai melompat →
            </button>
            <button className="frg-btn ghost" onClick={backToChoose}>
              Ganti materi
            </button>
          </div>
        </div>
      )}

      {/* ---------------- Layar hasil ---------------- */}
      {phase === 'done' && (
        <div className="frg-screen">
          <div className="frg-panel">
            <div className="frg-panel-emoji">
              {correct === plan.questions.length
                ? '🏆'
                : correct >= plan.questions.length / 2
                  ? '🎉'
                  : '💪'}
            </div>
            <h2>Sampai di seberang!</h2>
            <p>
              {correct === plan.questions.length
                ? 'Sempurna! Semua daun kamu pilih dengan tepat.'
                : `Katak melompat ${plan.questions.length} kali. Coba lagi untuk hasil lebih baik!`}
            </p>

            <div className="frg-stats">
              <div className="frg-stat">
                <b>{score.toLocaleString('id-ID')}</b>
                <span>skor</span>
              </div>
              <div className="frg-stat">
                <b>
                  {correct}/{plan.questions.length}
                </b>
                <span>tepat</span>
              </div>
              <div className="frg-stat">
                <b>{bestStreak}</b>
                <span>beruntun</span>
              </div>
            </div>

            {score > slot.bestScore && slot.bestScore > 0 && (
              <p style={{ color: '#e0a63e', fontWeight: 900, marginTop: -8 }}>✨ Rekor baru!</p>
            )}

            <button className="frg-btn primary" onClick={playAgain}>
              Lompat lagi 🐸
            </button>
            <button className="frg-btn ghost" onClick={backToChoose}>
              Ganti materi
            </button>
            <button className="frg-btn ghost" onClick={onExit}>
              Selesai
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
