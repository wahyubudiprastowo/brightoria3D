import { useEffect, useMemo, useState } from 'react';
import { BookOpen, ChevronRight, Lock, RotateCcw, Sparkles, Star, X } from 'lucide-react';
import AdabVillage3D from './AdabVillage3D';
import { chapters, type StoryChapter, type StoryChoice } from './scenarios';
import { computeMastery, loadEvidence, recordChoice, saveEvidence, type AdabEvidence } from './evidence';
import { Confetti, usePunch } from '../juice';

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

const ADAB_CSS = `
.adab-overlay { position: fixed; inset: 0; z-index: 75; background: linear-gradient(160deg,#2e1608ee,#3d1f0fee); backdrop-filter: blur(10px); display: grid; place-items: center; padding: 16px; }
.adab-shell { position: relative; width: min(720px,96vw); max-height: 92vh; overflow-y: auto; background: #fffaf3; border-radius: 26px; padding: 26px; box-shadow: 0 25px 80px #0007; display: flex; flex-direction: column; gap: 16px; border-top: 6px solid #c86845; background-image: radial-gradient(circle at 100% 0%, #ffe9de 0%, transparent 55%), radial-gradient(circle at 0% 100%, #fff3d6 0%, transparent 55%); }
.adab-shell.simulator { width: min(1360px, 98vw); max-height: 96vh; padding: 16px; }
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
.adab-sim-footer { display: flex; justify-content: space-between; gap: 8px; margin-top: auto; flex-wrap: wrap; }
.adab3d-shell { position: relative; height: min(80vh, 780px); min-height: 660px; overflow: hidden; border-radius: 22px; border: 3px solid #d9a35f; background: #bfe9ff; box-shadow: inset 0 0 0 6px #ffffff66; }
.adab3d-canvas { position: absolute; inset: 0; }
.adab3d-top { position: absolute; left: 16px; top: 16px; display: flex; flex-direction: column; gap: 2px; border-radius: 16px; background: #fffaf3ee; border: 1px solid #f3d9c0; padding: 10px 12px; color: #6b2f12; box-shadow: 0 10px 24px #4f2a1222; pointer-events: none; }
.adab3d-top b { font-size: 14px; }
.adab3d-top span { font-size: 11px; color: #8a5230; }
.adab3d-back { position: absolute; right: 16px; top: 16px; border: 0; border-radius: 999px; padding: 10px 14px; background: #fffaf3ee; color: #8a3d16; font-weight: 900; box-shadow: 0 10px 24px #4f2a1222; }
.adab3d-camera { position: absolute; right: 92px; top: 16px; border: 0; border-radius: 999px; padding: 10px 14px; background: #fffaf3ee; color: #8a3d16; font-weight: 900; box-shadow: 0 10px 24px #4f2a1222; display: inline-flex; align-items: center; gap: 7px; }
.adab3d-camera.locked { background: linear-gradient(135deg,#c86845,#8a3d16); color: #fff; }
.adab3d-label { min-width: 112px; border-radius: 13px; background: #fffaf3f2; border: 2px solid #f3d9c0; color: #6b2f12; padding: 7px 10px; text-align: center; box-shadow: 0 8px 16px #4f2a1230; font-size: 11px; transform: translateY(0); transition: transform .16s ease, border-color .16s ease; }
.adab3d-label.near { border-color: #c86845; transform: translateY(-6px); }
.adab3d-label b { display: block; font-size: 12px; }
.adab3d-label span { color: #8a5230; }
.adab3d-near { position: absolute; left: 50%; bottom: 18px; transform: translateX(-50%); display: flex; align-items: center; gap: 10px; border-radius: 18px; background: #fffaf3f2; border: 2px solid #f3d9c0; padding: 10px 12px; color: #6b2f12; box-shadow: 0 12px 30px #4f2a1230; }
.adab3d-near span { font-size: 13px; white-space: nowrap; }
.adab3d-near button { border: 0; border-radius: 12px; padding: 10px 14px; color: #fff; background: linear-gradient(135deg,#c86845,#8a3d16); display: inline-flex; align-items: center; gap: 7px; font-weight: 900; }
.adab3d-card { position: absolute; right: 18px; bottom: 18px; width: min(380px, calc(100% - 36px)); max-height: calc(100% - 88px); overflow-y: auto; border-radius: 22px; background: #fffaf3f5; border: 2px solid #f3d9c0; box-shadow: 0 18px 45px #4f2a1240; padding: 16px; display: flex; flex-direction: column; gap: 12px; color: #6b2f12; }
.adab3d-card h3 { margin: 0; color: #6b2f12; }
.adab3d-card p { margin: 0; color: #7a4b2c; line-height: 1.45; font-size: 13px; }
.adab3d-stick { position: absolute; left: 22px; bottom: 22px; width: 126px; height: 126px; border-radius: 999px; background: #fffaf3a8; border: 2px solid #f3d9c0; box-shadow: 0 12px 30px #4f2a122e; touch-action: none; display: grid; place-items: center; }
.adab3d-stick::before { content: ''; position: absolute; width: 62px; height: 62px; border-radius: 999px; border: 2px dashed #c8684566; }
.adab3d-stick-knob { width: 54px; height: 54px; border-radius: 999px; background: linear-gradient(135deg,#fffaf3,#ffe2ca); color: #8a3d16; display: grid; place-items: center; box-shadow: 0 8px 18px #4f2a1238; will-change: transform; }
@media (max-width: 700px) {
  .adab-shell { padding: 18px; }
  .adab-chapters-grid { grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); }
  .adab-sim-cta { grid-template-columns: 1fr; }
  .adab-sim-shell { grid-template-columns: 1fr; min-height: 0; }
  .adab-village-map { min-height: 480px; }
  .adab-sim-panel { min-height: 360px; }
  .adab3d-shell { min-height: 650px; height: 78vh; }
  .adab3d-card { left: 12px; right: 12px; bottom: 90px; width: auto; max-height: 44%; }
  .adab3d-near { bottom: 158px; width: calc(100% - 24px); justify-content: space-between; }
  .adab3d-camera { top: 68px; right: 12px; }
  .adab3d-back { right: 12px; }
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

type View = 'map' | 'story' | 'outcome' | 'collection' | 'simulator';

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
    choices: [
      { text: 'Menjawab salam, menyambut dengan sopan, lalu memanggil ibu', quality: 'best', feedback: 'Bagus sekali. Menjawab salam dan memuliakan tamu membuat rumah terasa ramah.' },
      { text: 'Memanggil ibu dari jauh tanpa menyapa tamu dulu', quality: 'good', feedback: 'Ibu jadi tahu ada tamu, tapi akan lebih indah kalau salam dijawab dan tamu disapa lembut.' },
      { text: 'Pura-pura tidak melihat karena sedang ingin bermain', quality: 'needsWork', feedback: 'Yuk belajar peka. Tamu dan tetangga perlu disambut dengan adab yang baik.' },
    ],
  },
  {
    id: 'school-knowledge-circle',
    locationId: 'school',
    title: 'Majelis Ilmu Kecil',
    scenario: 'Guru sedang menjelaskan kisah teladan. Kamu tahu jawabannya, tapi teman di sebelahmu masih berpikir.',
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
  const [simDone, setSimDone] = useState<string[]>(() => loadSimDone());
  const [simFeedback, setSimFeedback] = useState<{ quality: SimQuality; text: string } | null>(null);
  const outcomePunch = usePunch(pickedChoice?.id ?? 'idle');

  const overallMastery = useMemo(() => computeMastery(evidence, chapters.length), [evidence]);
  const totalOutcomes = chapters.length * 3;

  const activeChapter = chapters.find((c) => c.id === activeChapterId) ?? null;
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

        <header className="adab-head">
          <div>
            <span className="chip">Kampung Adab</span>
            <h2>
              {view === 'map' && 'Kisah Pilihan — 8 Bab Kehidupan Sehari-hari'}
              {(view === 'story' || view === 'outcome') && activeChapter?.title}
              {view === 'collection' && 'Buku Kisah'}
              {view === 'simulator' && 'Adab Daily Life Simulator'}
            </h2>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {(view === 'story' || view === 'outcome' || view === 'simulator') && (
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

        {view === 'map' && (
          <div>
            <div className="adab-sim-cta">
              <div>
                <h3>Adab Daily Life Simulator</h3>
                <p>Jelajahi kampung kecil, bantu Bri memilih sikap terbaik di rumah, sekolah, masjid, taman, dan warung.</p>
              </div>
              <button className="adab-primary-btn" onClick={openSimulator}>
                Masuk Kampung <ChevronRight size={16} />
              </button>
            </div>
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
