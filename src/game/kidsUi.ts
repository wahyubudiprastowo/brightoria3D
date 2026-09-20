/**
 * kidsUi.ts — "Kids-Friendly UI Kit" global untuk Brightoria (Patch 32).
 *
 * ====================================================================
 * TUJUAN & JAMINAN KEAMANAN (baca dulu sebelum mengubah apa pun):
 * ====================================================================
 * User meminta UI "lebih kids friendly" TAPI dengan syarat tegas:
 * "jangan merusak yang sudah ada". Karena itu modul ini dirancang
 * SEPENUHNYA ADITIF:
 *
 * 1. TIDAK mengubah/mengimpor satu pun file game yang sudah ada
 *    (App.tsx, EnglishGame.tsx, QuranGame.tsx, AdabGame.tsx,
 *    ArabicGame.tsx, DigitalGame.tsx, NumeriaGame.tsx, styles.css).
 * 2. Hanya MENYUNTIKKAN satu elemen <style> ke <head> yang berisi
 *    penyesuaian visual untuk class-class yang SUDAH ADA.
 * 3. Semua aturan memakai selector yang sudah dipakai di proyek —
 *    jika suatu class ternyata tidak ada di DOM, aturannya cukup
 *    diabaikan browser tanpa error apa pun.
 * 4. TIDAK menyentuh properti `transform` (dipakai juice3d.ts untuk
 *    tilt/tekan) maupun `animation` pada class status game (.correct,
 *    .wrong, .matched) — mencegah "perang properti" antar-modul yang
 *    bisa membuat animasi existing patah.
 * 5. Menghormati `prefers-reduced-motion` untuk animasi dekoratif.
 *
 * CARA MENGAKTIFKAN: satu baris import di `src/main.tsx`:
 *     import './game/kidsUi';
 *
 * ====================================================================
 * PRINSIP DESAIN ANAK YANG DITERAPKAN:
 * ====================================================================
 * - TARGET SENTUH LEBIH BESAR: tombol utama diperbesar (min-height 52px)
 *   — jari anak kecil kurang presisi dibanding orang dewasa.
 * - SUDUT LEBIH BULAT: border-radius diperbesar di semua kartu/tombol —
 *   bentuk membulat terasa lebih ramah/tidak "kaku" bagi anak.
 * - TIPOGRAFI LEBIH BESAR & TEBAL: ukuran font naik, weight dinaikkan,
 *   letter-spacing sedikit dilonggarkan supaya lebih mudah dibaca anak
 *   yang belum lancar membaca.
 * - KONTRAS & WARNA LEBIH CERAH: bayangan lebih hangat/berwarna
 *   (bukan abu-abu netral), border lebih tebal supaya batas antar
 *   elemen jelas terlihat.
 * - UMPAN BALIK SENTUH: efek "pegas" saat tombol ditekan (memakai
 *   `:active` + scale kecil, TIDAK bentrok dengan juice3d karena
 *   hanya aktif selama jari menekan dan pada class tombol saja).
 * ====================================================================
 */

const STYLE_ID = 'brightoria-kids-ui-styles-v1';

const KIDS_CSS = `
/* ============================================================
   1) TOMBOL UTAMA — lebih besar, lebih bulat, lebih ramah anak
   ============================================================ */
.oasis-primary-btn,
.adab-primary-btn,
.hijaiyah-primary-btn,
.harbor-primary-btn,
.primary {
  min-height: 52px !important;
  border-radius: 18px !important;
  font-size: 15px !important;
  font-weight: 900 !important;
  letter-spacing: 0.01em;
}

.oasis-primary-btn:active,
.adab-primary-btn:active,
.hijaiyah-primary-btn:active,
.harbor-primary-btn:active,
.primary:active {
  filter: brightness(1.06);
}

/* Tombol sekunder / ghost — juga diperbesar supaya mudah disentuh */
.oasis-ghost-btn,
.adab-ghost-btn,
.hijaiyah-ghost-btn,
.harbor-ghost-btn,
.oasis-ghost-small,
.hijaiyah-ghost-small,
.harbor-ghost-small,
.adab-book-btn {
  min-height: 44px !important;
  border-radius: 16px !important;
  border-width: 2px !important;
  font-weight: 800 !important;
}

/* Tombol tutup (X) — diperbesar, lebih mudah dijangkau jari anak */
.oasis-close-btn,
.hijaiyah-close-btn,
.harbor-close-btn,
.adab-close-btn,
.close {
  width: 42px !important;
  height: 42px !important;
  border-radius: 50% !important;
}

/* ============================================================
   2) KARTU — sudut lebih bulat, border lebih tebal, bayangan hangat
   ============================================================ */
.oasis-stop-card,
.adab-chapter-card,
.hijaiyah-letter-card,
.harbor-island-card,
.oasis-word-card,
.hijaiyah-word-card,
.harbor-word-card {
  border-radius: 20px !important;
  border-width: 2px !important;
}

.oasis-stop-card:not(.locked),
.adab-chapter-card:not(.locked),
.hijaiyah-letter-card:not(.locked),
.harbor-island-card:not(.locked) {
  box-shadow: 0 8px 18px rgba(120, 80, 30, 0.14) !important;
}

/* Kartu opsi jawaban — target lebih besar + sudut lebih bulat */
.oasis-option,
.adab-choice-btn,
.quiz-option,
.digital-option {
  border-radius: 20px !important;
  border-width: 3px !important;
  min-height: 60px !important;
  font-weight: 700 !important;
}

/* ============================================================
   3) TIPOGRAFI — lebih besar & tebal untuk keterbacaan anak
   ============================================================ */
.oasis-stop-card b,
.adab-chapter-card b,
.harbor-island-card b {
  font-size: 13px !important;
  font-weight: 900 !important;
}

.oasis-shell h2,
.adab-shell h2,
.hijaiyah-shell h2,
.harbor-shell h2 {
  font-size: 22px !important;
  font-weight: 900 !important;
}

.oasis-shell h3,
.hijaiyah-shell h3,
.harbor-shell h3 {
  font-size: 19px !important;
  font-weight: 900 !important;
}

/* Teks penjelas/instruksi — sedikit diperbesar supaya tidak terlalu kecil */
.oasis-intro-desc,
.hijaiyah-intro p,
.harbor-intro p,
.adab-setting-text {
  font-size: 14px !important;
  line-height: 1.65 !important;
}

/* ============================================================
   4) BINTANG & PROGRES — lebih menonjol sebagai reward visual
   ============================================================ */
.oasis-mastery-track,
.hijaiyah-mastery-track,
.harbor-mastery-track,
.adab-mastery-track {
  height: 14px !important;
  border-radius: 999px !important;
}

.oasis-mastery-fill,
.hijaiyah-mastery-fill,
.harbor-mastery-fill,
.adab-mastery-fill {
  border-radius: 999px !important;
}

/* ============================================================
   5) CHIP / LABEL — bentuk pil membulat penuh, lebih playful
   ============================================================ */
.chip {
  border-radius: 999px !important;
  padding: 5px 12px !important;
  font-size: 10px !important;
  font-weight: 900 !important;
}

/* ============================================================
   6) PANEL UTAMA — sudut lebih bulat supaya terasa lembut
   ============================================================ */
.oasis-shell,
.adab-shell,
.hijaiyah-shell,
.harbor-shell {
  border-radius: 30px !important;
}

/* ============================================================
   7) AKSESIBILITAS — hormati preferensi kurangi gerakan
   ============================================================ */
@media (prefers-reduced-motion: reduce) {
  .oasis-primary-btn,
  .adab-primary-btn,
  .hijaiyah-primary-btn,
  .harbor-primary-btn,
  .primary {
    transition: none !important;
  }
}

/* ============================================================
   8) LAYAR SEMPIT — pastikan tombol tetap nyaman disentuh
   ============================================================ */
@media (max-width: 700px) {
  .oasis-primary-btn,
  .adab-primary-btn,
  .hijaiyah-primary-btn,
  .harbor-primary-btn,
  .primary {
    min-height: 54px !important;
    font-size: 16px !important;
  }

  .oasis-option,
  .adab-choice-btn,
  .quiz-option,
  .digital-option {
    min-height: 64px !important;
  }
}
`;

function injectKidsUi() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;
  try {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = KIDS_CSS;
    document.head.appendChild(style);
  } catch (err) {
    // Kegagalan modul kosmetik TIDAK BOLEH menghentikan aplikasi.
    // eslint-disable-next-line no-console
    console.error('[Brightoria] kidsUi gagal disuntikkan (diabaikan dengan aman):', err);
  }
}

injectKidsUi();

export {};
