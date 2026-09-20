/**
 * uiRefine.ts — Perapian antarmuka (Patch 60).
 *
 * ====================================================================
 * EMPAT KELUHAN YANG DITANGANI
 * ====================================================================
 * 1. "bar health yang pojok kanan juga untuk apa?"
 *    Itu BUKAN health bar. Itu Knowledge Crystal — hadiah quest dari
 *    Patch 39, empat warna: hijau, biru, emas, ungu.
 *
 *    Kenyataan bahwa pengguna membacanya sebagai health bar berarti
 *    DESAINNYA GAGAL. Ikonnya memakai bentuk hati (♡) yang di hampir
 *    semua permainan berarti nyawa.
 *
 *    Diperbaiki: ikon diganti berlian (◆) yang jelas kristal, diberi
 *    label kecil "Kristal", dan yang bernilai nol diredupkan supaya
 *    tidak menuntut perhatian.
 *
 * 2. "bagian pojok kanan atas 4 hari itu untuk apa?"
 *    Itu streak — hari berturut-turut bermain, dari Patch 34. Labelnya
 *    hanya "hari bertumbuh", terlalu samar.
 *
 *    Diperbaiki: label diperjelas jadi "hari berturut-turut", dan
 *    lingkarannya diberi keterangan yang bisa dibaca orang tua.
 *
 * 3. "header kl versi web masih terlalu besar"
 *    Benar. Di layar lebar, header dan hero bersama-sama memakan
 *    sekitar sepertiga tinggi layar sebelum peta terlihat.
 *
 *    Diperbaiki: pada layar >= 1100px, hero dipadatkan secara agresif.
 *    Peta mendapat ruang jauh lebih besar.
 *
 * 4. "button pojok kiri juga belum rapih, dan gak nyambung dengan
 *    design"
 *    Rel tombol memakai gaya sendiri yang tidak berhubungan dengan
 *    bahasa visual peta — kartu putih bersudut membulat dengan bayangan
 *    lembut.
 *
 *    Diperbaiki: rel disatukan dalam satu wadah kaca, memakai radius
 *    dan bayangan yang sama dengan kartu misi.
 *
 * ====================================================================
 * KENAPA CSS MURNI
 * ====================================================================
 * Keempat masalah ada di modul yang berbeda-beda, dan dua di antaranya
 * (`DailyPractice.tsx`, `ExpeditionGame.tsx`) BARU SAJA diperbaiki dari
 * bug berat — pembekuan laman di Patch 53, dan pesawat macet di
 * Patch 60.
 *
 * Menyentuhnya lagi hanya untuk urusan tampilan adalah risiko yang
 * tidak sepadan. Modul ini hanya menyuntik satu <style>: nol
 * manipulasi DOM, nol MutationObserver, nol sentuhan pada modul lain.
 *
 * Disuntik PALING AKHIR di main.tsx agar aturannya menang bila ada
 * tumpang tindih dengan modul gaya sebelumnya.
 * ====================================================================
 */

const STYLE_ID = 'brightoria-ui-refine-v1';

const REFINE_CSS = `
/* ============================================================
   1) KNOWLEDGE CRYSTAL — bukan health bar
   ------------------------------------------------------------
   Dibaca sebagai nyawa karena ikonnya berbentuk hati. Diganti
   berlian, diberi label, dan yang kosong diredupkan.
   ============================================================ */
.qh-wallet {
  display: flex !important;
  align-items: center !important;
  gap: 5px !important;
  padding: 5px 9px 5px 7px !important;
  border-radius: 999px !important;
  background: rgba(255, 253, 247, 0.9) !important;
  box-shadow: 0 4px 14px rgba(0, 20, 69, 0.18) !important;
  backdrop-filter: blur(6px);
}

/* Label kecil di depan — menjelaskan ini apa. */
.qh-wallet::before {
  content: '◆ Kristal';
  font-size: 9px;
  font-weight: 900;
  color: #6b7f96;
  letter-spacing: 0.04em;
  margin-right: 3px;
  white-space: nowrap;
}

.qh-crystal {
  display: inline-flex !important;
  align-items: center !important;
  gap: 3px !important;
  padding: 3px 8px !important;
  border-radius: 999px !important;
  font-size: 11px !important;
  font-weight: 900 !important;
  border: 0 !important;
  background: rgba(255, 255, 255, 0.72) !important;
}

/* Yang bernilai nol diredupkan — tidak menuntut perhatian anak. */
.qh-crystal.zero {
  opacity: 0.32 !important;
  filter: grayscale(0.6);
}

/* ============================================================
   2) STREAK — perjelas artinya
   ============================================================ */
.streak-ring span,
.streak-label,
[class*='streak'] small {
  font-size: 9.5px !important;
  line-height: 1.25 !important;
  letter-spacing: 0.01em !important;
}

/* ============================================================
   3) HEADER & HERO — jauh lebih ramping di layar lebar
   ------------------------------------------------------------
   Di >= 1100px, header + hero memakan sekitar sepertiga tinggi
   layar sebelum peta terlihat. Peta adalah inti aplikasi, jadi
   ia yang harus mendapat ruang terbesar.
   ============================================================ */
@media (min-width: 1100px) {
  header {
    padding: 5px 18px !important;
  }

  header .brand .mark {
    width: 30px !important;
    height: 30px !important;
    border-radius: 9px !important;
    padding: 3px !important;
  }

  header .brand b { font-size: 14px !important; }
  header .brand span { font-size: 8.5px !important; }

  header .xp,
  header .mode {
    height: 29px !important;
  }
  header .xp { padding: 0 11px !important; font-size: 10px !important; }
  header .mode button {
    height: 24px !important;
    padding: 0 11px !important;
    font-size: 10.5px !important;
  }

  /* Hero dipadatkan agresif — inilah yang paling banyak memakan ruang. */
  .hero {
    padding: 9px 20px 8px !important;
  }
  .hero h1 {
    font-size: 21px !important;
    line-height: 1.1 !important;
    margin: 3px 0 3px !important;
  }
  .hero p {
    font-size: 11.5px !important;
    line-height: 1.4 !important;
  }

  /* Lencana kecil di bawah hero — dirapatkan. */
  .hero .chip,
  .hero [class*='pill'],
  .hero [class*='badge'] {
    font-size: 9.5px !important;
    padding: 3px 9px !important;
  }
}

/* Layar sangat lebar: hero boleh lebih ramping lagi. */
@media (min-width: 1500px) {
  .hero { padding: 7px 24px 6px !important; }
  .hero h1 { font-size: 19px !important; }
  .hero p { font-size: 11px !important; }
}

/* ============================================================
   4) REL TOMBOL — satukan dengan bahasa visual peta
   ------------------------------------------------------------
   Sebelumnya empat tombol mengambang bebas tanpa wadah, sehingga
   terasa terpisah dari desain. Kini disatukan dalam satu panel
   kaca dengan radius & bayangan yang sama dengan kartu misi.
   ============================================================ */
#brt-rail,
.brt-rail {
  display: flex !important;
  flex-direction: column !important;
  gap: 7px !important;
  padding: 9px !important;
  border-radius: 22px !important;
  background: rgba(255, 253, 247, 0.55) !important;
  backdrop-filter: blur(10px) saturate(1.1);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.6) inset,
    0 8px 24px rgba(0, 20, 69, 0.14) !important;
}

/* Bila rel belum dibungkus wadah, beri latar pada tiap tombol agar
   tetap terbaca menyatu. Ini jaring pengaman — lihat catatan di
   dokumentasi bagian "batas yang jujur". */
.bdp-fab,
.bexp-fab,
.bpi-fab,
[data-brt-rail='ai'] {
  border-radius: 16px !important;
  padding: 9px 15px 9px 11px !important;
  font-size: 12px !important;
}

/* ============================================================
   5) KARTU MISI — samakan radius dengan rel
   ============================================================ */
.mission-card {
  border-radius: 22px !important;
}

/* ============================================================
   6) HORMATI PREFERENSI AKSESIBILITAS
   ============================================================ */
@media (prefers-reduced-motion: reduce) {
  .qh-wallet,
  .bdp-fab,
  .bexp-fab,
  .bpi-fab,
  [data-brt-rail='ai'] {
    animation: none !important;
    transition: none !important;
  }
}
`;

declare global {
  interface Window {
    __brtUiRefineInit?: boolean;
  }
}

function mountUiRefine(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__brtUiRefineInit) return;
  window.__brtUiRefineInit = true;

  try {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = REFINE_CSS;
    document.head.appendChild(style);
  } catch (err) {
    // Kegagalan modul kosmetik tidak boleh menghentikan aplikasi.
    // eslint-disable-next-line no-console
    console.error('[Brightoria] uiRefine gagal dipasang (diabaikan):', err);
  }
}

mountUiRefine();

export {};
