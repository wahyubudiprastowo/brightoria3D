/**
 * railButtons.ts — Mempercantik empat tombol mengambang (Patch 59).
 *
 * ====================================================================
 * MASALAH
 * ====================================================================
 * Umpan balik: "button latihan, tanya bri, ekspedisi, orangtua terasa
 * monoton kurang menarik."
 *
 * Benar. Keempatnya memakai bentuk pil datar yang hampir identik,
 * hanya berbeda warna pucat. Tidak ada yang menarik mata, dan tidak
 * ada yang memberi tahu anak mana yang paling penting.
 *
 * ====================================================================
 * KENAPA CSS MURNI, BUKAN MENYUNTING KEEMPAT MODULNYA
 * ====================================================================
 * Keempat tombol dipasang oleh modul berbeda:
 *   .bdp-fab   -> DailyPractice.tsx
 *   .bexp-fab  -> ExpeditionLauncher.tsx
 *   .bpi-fab   -> ParentInsight.tsx
 *   [data-brt-rail="ai"] -> AiCompanion.tsx (ditandai brandHeader)
 *
 * `DailyPractice.tsx` BARU SAJA diperbaiki dari bug pembekuan di
 * Patch 53. Menyentuhnya lagi hanya untuk urusan tampilan adalah
 * risiko yang tidak sepadan.
 *
 * Modul ini hanya menyuntik satu <style>. Nol manipulasi DOM, nol
 * MutationObserver, nol sentuhan pada modul lain.
 *
 * ====================================================================
 * TIGA PRINSIP DESAIN
 * ====================================================================
 * 1. HIERARKI, BUKAN SERAGAM.
 *    Latihan adalah tindakan harian yang paling sering dibutuhkan —
 *    ia dibuat paling menonjol. Orang Tua paling jarang dipakai anak,
 *    jadi paling tenang. Seragam justru membuat semuanya tak terbaca.
 *
 * 2. WARNA YANG BERARTI, BUKAN DEKORATIF.
 *    Tiap tombol mendapat keluarga warna yang mencerminkan fungsinya:
 *    emas untuk latihan, ungu untuk bertanya, hijau untuk menjelajah,
 *    biru tenang untuk orang tua.
 *
 * 3. GERAK YANG MENGUNDANG, BUKAN MENGGANGGU.
 *    Mengambang sangat pelan (4 detik per siklus), dengan jeda
 *    berbeda tiap tombol supaya tidak bergerak serempak seperti mesin.
 *    Dimatikan penuh saat prefers-reduced-motion.
 * ====================================================================
 */

const STYLE_ID = 'brightoria-rail-buttons-v1';

const RAIL_CSS = `
/* ============================================================
   DASAR — berlaku untuk keempat tombol
   ============================================================ */
.bdp-fab,
.bexp-fab,
.bpi-fab,
[data-brt-rail="ai"] {
  position: fixed !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 9px !important;
  padding: 11px 17px 11px 13px !important;
  border-radius: 999px !important;
  font-size: 12.5px !important;
  font-weight: 900 !important;
  font-family: inherit !important;
  cursor: pointer !important;
  border: 0 !important;
  letter-spacing: 0.01em !important;

  /* Tepi cahaya tipis di dalam — memberi kesan timbul tanpa garis
     tegas yang membuat tombol terlihat kaku. */
  box-shadow:
    0 1px 0 rgba(255,255,255,0.75) inset,
    0 -1px 0 rgba(0,0,0,0.05) inset,
    0 7px 18px rgba(0,20,69,0.22) !important;

  transition:
    transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.18s ease,
    filter 0.18s ease !important;

  -webkit-tap-highlight-color: transparent;
  user-select: none;
  -webkit-user-select: none;
}

.bdp-fab:hover,
.bexp-fab:hover,
.bpi-fab:hover,
[data-brt-rail="ai"]:hover {
  transform: translateX(3px) scale(1.045) !important;
  filter: saturate(1.12);
  box-shadow:
    0 1px 0 rgba(255,255,255,0.8) inset,
    0 11px 26px rgba(0,20,69,0.3) !important;
}

.bdp-fab:active,
.bexp-fab:active,
.bpi-fab:active,
[data-brt-rail="ai"]:active {
  transform: scale(0.96) !important;
  transition-duration: 0.08s !important;
}

/* Ikon emoji dibesarkan dan diberi wadah lingkaran terang, sehingga
   terbaca sebagai lencana — bukan huruf yang kebetulan bergambar. */
.bdp-fab > span:first-child,
.bexp-fab > span:first-child,
.bpi-fab > span:first-child,
[data-brt-rail="ai"] > span:first-child {
  display: inline-grid !important;
  place-items: center !important;
  width: 25px !important;
  height: 25px !important;
  border-radius: 50% !important;
  background: rgba(255,255,255,0.72) !important;
  font-size: 14px !important;
  line-height: 1 !important;
  flex-shrink: 0 !important;
  box-shadow: 0 1px 3px rgba(0,20,69,0.14) !important;
}

/* ============================================================
   1. LATIHAN — emas. Paling menonjol: tindakan harian utama.
   ============================================================ */
.bdp-fab {
  background: linear-gradient(135deg, #ffd977 0%, #f0b23f 55%, #dd9620 100%) !important;
  color: #4a3208 !important;
}

/* Lencana jumlah materi jatuh tempo — merah bata, kontras tinggi
   supaya angka benar-benar tertangkap mata. */
.bdp-badge {
  background: linear-gradient(135deg, #e8563f, #c03520) !important;
  color: #fff !important;
  font-weight: 900 !important;
  min-width: 21px !important;
  height: 21px !important;
  border-radius: 999px !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  font-size: 11px !important;
  padding: 0 6px !important;
  box-shadow: 0 2px 7px rgba(192,53,32,0.5) !important;
}

/* Berdenyut HANYA bila ada materi jatuh tempo. Denyut tanpa sebab
   akan menjadi gangguan, bukan panggilan. */
.bdp-fab:has(.bdp-badge) {
  animation: brt-rail-call 2.6s ease-in-out infinite;
}

@keyframes brt-rail-call {
  0%, 100% {
    box-shadow:
      0 1px 0 rgba(255,255,255,0.75) inset,
      0 7px 18px rgba(0,20,69,0.22);
  }
  50% {
    box-shadow:
      0 1px 0 rgba(255,255,255,0.75) inset,
      0 7px 24px rgba(240,178,63,0.62);
  }
}

/* ============================================================
   2. TANYA BRI — ungu. Bertanya, berbincang.
   ============================================================ */
[data-brt-rail="ai"] {
  background: linear-gradient(135deg, #e8d4fb 0%, #c9a4ec 55%, #ab7fd8 100%) !important;
  color: #40205e !important;
}

/* ============================================================
   3. EKSPEDISI — hijau. Menjelajah, bergerak.
   ============================================================ */
.bexp-fab {
  background: linear-gradient(135deg, #b6ecd6 0%, #6fd0ac 55%, #3fae85 100%) !important;
  color: #0c4a38 !important;
}

.bexp-badge {
  background: linear-gradient(135deg, #17856f, #0f5c4c) !important;
  color: #fff !important;
  font-weight: 900 !important;
  border-radius: 999px !important;
  padding: 2px 8px !important;
  font-size: 10.5px !important;
  box-shadow: 0 2px 6px rgba(15,92,76,0.42) !important;
}

/* ============================================================
   4. ORANG TUA — biru tenang. Sengaja paling kalem: ini pintu
      untuk orang dewasa, bukan ajakan bermain untuk anak.
   ============================================================ */
.bpi-fab {
  background: linear-gradient(135deg, #e4eef8 0%, #c2d6ea 55%, #9fbcd8 100%) !important;
  color: #1d3a57 !important;
}

/* ============================================================
   GERAK MENGAMBANG
   Jeda berbeda tiap tombol supaya tidak serempak seperti mesin.
   ============================================================ */
@media (prefers-reduced-motion: no-preference) {
  .bdp-fab            { animation: brt-float 4.2s ease-in-out infinite, brt-rail-call 2.6s ease-in-out infinite; }
  [data-brt-rail="ai"]{ animation: brt-float 4.6s ease-in-out -0.7s infinite; }
  .bexp-fab           { animation: brt-float 5.0s ease-in-out -1.4s infinite; }
  .bpi-fab            { animation: brt-float 5.4s ease-in-out -2.1s infinite; }

  /* Tanpa lencana -> tidak perlu berdenyut, cukup mengambang. */
  .bdp-fab:not(:has(.bdp-badge)) {
    animation: brt-float 4.2s ease-in-out infinite;
  }
}

@keyframes brt-float {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-3.5px); }
}

/* Hormati preferensi aksesibilitas secara mutlak. */
@media (prefers-reduced-motion: reduce) {
  .bdp-fab,
  .bexp-fab,
  .bpi-fab,
  [data-brt-rail="ai"] {
    animation: none !important;
  }
}

/* ============================================================
   LAYAR SEMPIT
   ============================================================ */
@media (max-width: 700px) {
  .bdp-fab,
  .bexp-fab,
  .bpi-fab,
  [data-brt-rail="ai"] {
    padding: 9px 14px 9px 11px !important;
    font-size: 11.5px !important;
    gap: 7px !important;
  }

  .bdp-fab > span:first-child,
  .bexp-fab > span:first-child,
  .bpi-fab > span:first-child,
  [data-brt-rail="ai"] > span:first-child {
    width: 22px !important;
    height: 22px !important;
    font-size: 12.5px !important;
  }
}
`;

declare global {
  interface Window {
    __brtRailButtonsInit?: boolean;
  }
}

function mountRailButtons(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__brtRailButtonsInit) return;
  window.__brtRailButtonsInit = true;

  try {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = RAIL_CSS;
    document.head.appendChild(style);
  } catch (err) {
    // Kegagalan modul kosmetik tidak boleh menghentikan aplikasi.
    // eslint-disable-next-line no-console
    console.error('[Brightoria] railButtons gagal dipasang (diabaikan):', err);
  }
}

mountRailButtons();

export {};
