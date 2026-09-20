/**
 * juice3d.ts — Lapisan "3D Juice" universal untuk seluruh Brightoria (Patch 29).
 *
 * ====================================================================
 * TUJUAN & FILOSOFI PATCH INI (baca dulu sebelum mengubah apa pun):
 * ====================================================================
 * User meminta gameplay lebih menarik "misal 3D play, tapi gak banyak
 * mengubah sekarang". Alih-alih menulis ulang tiap game jadi scene
 * Three.js penuh (perubahan besar, berisiko tinggi terhadap 5 game yang
 * sudah bekerja: Numeria, Digital, Adab, Arabic Oasis, Quran), pendekatan
 * di file ini adalah menambahkan SATU modul baru yang secara OTOMATIS
 * memberi efek 3D ke kartu-kartu yang SUDAH ADA di semua dunia, TANPA
 * mengubah satu pun file game yang sudah ada.
 *
 * TEKNIK: CSS 3D transform SUNGGUHAN (`perspective()` + `rotateX/rotateY`,
 * bagian resmi dari CSS Transforms — BUKAN animasi 2D yang dibuat terlihat
 * seperti 3D). Trik `transform: perspective(700px) rotateX(..) rotateY(..)`
 * bisa diterapkan LANGSUNG pada satu elemen tanpa perlu elemen induk
 * memiliki properti `perspective` — sehingga TIDAK PERLU mengubah struktur
 * HTML/CSS game manapun. Efek ini sama seperti "tilt card" yang lazim di
 * aplikasi kartu premium (mis. Apple Wallet, kartu koleksi digital).
 *
 * CARA KERJA (event delegation di level `document`, bukan per-komponen):
 * 1. Saat mouse bergerak di atas kartu yang cocok dengan daftar selector
 *    di bawah, kartu miring mengikuti posisi kursor secara real-time.
 * 2. Saat kartu ditekan (mouse ATAU sentuh), kartu "masuk" sedikit ke
 *    dalam layar lalu pegas kembali saat dilepas — umpan balik taktil.
 * 3. Saat kartu BARU muncul di DOM (dideteksi via MutationObserver —
 *    mis. berpindah dari peta ke koleksi, atau membuka pos baru), kartu
 *    tersebut otomatis mendapat animasi "pop-in" 3D singkat.
 *
 * KENAPA INI AMAN (zero risk terhadap kode game yang sudah ada):
 * - TIDAK mengimpor/mengubah satu pun file game (App.tsx, ArabicGame.tsx,
 *   QuranGame.tsx, AdabGame.tsx, DigitalGame.tsx, NumeriaGame.tsx, dst).
 * - Selector yang tidak ditemukan di DOM cukup diam saja (tidak error).
 * - Semua efek berupa INLINE STYLE sementara yang dibersihkan (`= ''`)
 *   setelah interaksi selesai — tidak pernah menimpa class CSS permanen
 *   milik game (mis. `.correct`, `.wrong`, `.matched`, `.locked`), dan
 *   secara eksplisit DIHINDARI pada elemen yang sedang memakai class
 *   status tersebut supaya tidak "berebut" properti `transform` dengan
 *   animasi CSS yang sudah ada (mis. `juice-punch`).
 * - Menghormati `prefers-reduced-motion` — jika aktif, modul ini TIDAK
 *   memasang listener interaktif sama sekali (murni tidak beroperasi).
 *
 * PENGECUALIAN KEAMANAN PENTING — Taman Al-Qur'an (drag-garis):
 * Kartu `.hijaiyah-match-item` (dipakai untuk mekanik drag-garis di
 * QuranGame.tsx sejak Patch 28) SENGAJA TIDAK dimasukkan ke daftar tilt/
 * tekan interaktif — mengubah `transform` pada elemen yang sedang dipakai
 * `getBoundingClientRect()`/`elementFromPoint()` untuk deteksi drag bisa
 * mengacaukan posisi target secara visual di tengah proses drag. Kartu
 * huruf Hijaiyah TETAP mendapat efek "pop-in" 3D (aman, karena animasi
 * itu hanya berjalan saat kartu PERTAMA KALI muncul, bukan saat sedang
 * di-drag).
 *
 * CARA MENGAKTIFKAN: cukup tambahkan SATU baris import di `src/main.tsx`:
 *   import './game/juice3d';
 * (lihat patches/patch-29/APPLY.md untuk detail lengkap). Tidak ada
 * langkah lain yang diperlukan — modul ini self-initializing.
 *
 * CARA MEMPERLUAS CAKUPAN NANTI (tanpa perlu patch baru): tambahkan
 * atribut `data-tilt` pada elemen apa pun (untuk tilt+tekan) atau
 * `data-pop3d` (untuk animasi pop-in saja) langsung di JSX game manapun
 * — modul ini otomatis mendeteksinya tanpa perlu diubah lagi.
 * ====================================================================
 */

declare global {
  interface Window {
    __brtJuice3DInit?: boolean;
  }
}

const STYLE_ID = 'brightoria-juice3d-styles';

/**
 * Selector kartu yang AMAN mendapat efek TILT (ikut kursor) + TEKAN-3D.
 * Daftar ini disusun dari class name yang benar-benar dipakai di game
 * yang saya bangun sepanjang proyek ini (Oasis Bahasa Arab, Kampung Adab)
 * plus beberapa tebakan aman untuk dunia lain (Digital/Quiz/peta) yang
 * TIDAK berbahaya jika ternyata tidak cocok (querySelector hanya diam).
 *
 * SENGAJA TIDAK termasuk: `.hijaiyah-match-item` (lihat penjelasan
 * "pengecualian keamanan" di komentar atas file ini).
 */
const TILT_SELECTOR = [
  '.oasis-stop-card',
  '.oasis-option',
  '.oasis-flashcard',
  '.oasis-match-card',
  '.oasis-word-card',
  '.adab-chapter-card',
  '.adab-choice-btn',
  '.adab-outcome-card',
  '.digital-option',
  '.digital-card',
  '.quiz-option',
  '.mission-card',
  '.world-fallback-card',
  '[data-tilt]',
].join(', ');

/**
 * Selector kartu yang mendapat animasi POP-IN 3D saat pertama muncul di
 * DOM. Mencakup semua selector TILT_SELECTOR di atas, DITAMBAH kartu
 * huruf Hijaiyah (aman untuk pop-in karena tidak berjalan selama drag).
 */
const POP_SELECTOR = [
  TILT_SELECTOR,
  '.hijaiyah-letter-card',
  '.hijaiyah-form-card',
  '.hijaiyah-word-card',
  '[data-pop3d]',
].join(', ');

/** Class CSS status milik game yang TIDAK BOLEH diganggu oleh tilt/tekan
 *  (supaya tidak berebut properti `transform` dengan animasi CSS game). */
const BLOCKED_STATE_SELECTOR = '.correct, .wrong, .matched, .locked, .owned, .matched-word, .disabled';

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes brt-pop3d-in {
      0%   { opacity: 0; transform: perspective(650px) rotateX(-14deg) translateY(16px) scale(0.9); }
      55%  { opacity: 1; transform: perspective(650px) rotateX(5deg) translateY(-3px) scale(1.03); }
      100% { opacity: 1; transform: perspective(650px) rotateX(0deg) translateY(0) scale(1); }
    }
    .brt-pop3d { animation: brt-pop3d-in 420ms cubic-bezier(0.22, 1, 0.36, 1); }

    @media (prefers-reduced-motion: reduce) {
      .brt-pop3d { animation: none !important; }
    }
  `;
  document.head.appendChild(style);
}

function isBlocked(el: HTMLElement): boolean {
  return el.matches(BLOCKED_STATE_SELECTOR) || el.hasAttribute('disabled');
}

// --- Efek 1: Tilt mengikuti kursor (mouse saja, sentuh dilewati karena
// tidak ada "hover" yang bermakna di layar sentuh) ---
let pressedEl: HTMLElement | null = null;

function onPointerMove(e: PointerEvent) {
  if (e.pointerType !== 'mouse') return;
  if (pressedEl) return; // jangan tumpang tindih dengan efek tekan
  const target = (e.target as HTMLElement)?.closest(TILT_SELECTOR) as HTMLElement | null;
  if (!target || isBlocked(target)) return;

  const rect = target.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return;
  const px = (e.clientX - rect.left) / rect.width;
  const py = (e.clientY - rect.top) / rect.height;
  const rotateY = (px - 0.5) * 9; // maksimum ±4.5deg
  const rotateX = (0.5 - py) * 9;

  target.style.transition = 'transform 120ms ease, box-shadow 120ms ease';
  target.style.transform = `perspective(700px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
  target.style.boxShadow = `0 ${10 + Math.abs(rotateX)}px ${20 + Math.abs(rotateY)}px rgba(20,40,45,0.16)`;
}

function onPointerOut(e: PointerEvent) {
  const target = (e.target as HTMLElement)?.closest(TILT_SELECTOR) as HTMLElement | null;
  if (!target) return;
  const related = e.relatedTarget as Node | null;
  if (related && target.contains(related)) return; // masih di dalam elemen yang sama
  target.style.transition = 'transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 220ms ease';
  target.style.transform = '';
  target.style.boxShadow = '';
}

// --- Efek 2: Tekan-3D (mouse + sentuh sekaligus, pakai Pointer Events) ---
function onPointerDown(e: PointerEvent) {
  const target = (e.target as HTMLElement)?.closest(TILT_SELECTOR) as HTMLElement | null;
  if (!target || isBlocked(target)) return;
  pressedEl = target;
  target.style.transition = 'transform 90ms ease, box-shadow 90ms ease';
  target.style.transform = 'perspective(700px) scale(0.965)';
}

function releasePress() {
  if (!pressedEl) return;
  const el = pressedEl;
  pressedEl = null;
  el.style.transition = 'transform 240ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 240ms ease';
  el.style.transform = '';
  el.style.boxShadow = '';
}

// --- Efek 3: Pop-in 3D otomatis untuk kartu yang baru muncul di DOM ---
function triggerPop(el: HTMLElement) {
  el.classList.remove('brt-pop3d');
  void el.offsetWidth; // paksa reflow supaya animasi bisa diulang
  el.classList.add('brt-pop3d');
  el.addEventListener('animationend', () => el.classList.remove('brt-pop3d'), { once: true });
}

function attachPopObserver() {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (!(node instanceof HTMLElement)) return;
        try {
          if (node.matches(POP_SELECTOR)) triggerPop(node);
          node.querySelectorAll(POP_SELECTOR).forEach((child) => triggerPop(child as HTMLElement));
        } catch {
          // Selector tidak valid di konteks node tertentu — abaikan dengan aman.
        }
      });
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

function initJuice3D() {
  if (typeof window === 'undefined') return;
  if (window.__brtJuice3DInit) return; // idempotent — aman diimpor berulang
  window.__brtJuice3DInit = true;

  try {
    injectStyles();

    const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    if (prefersReduced) return; // hormati preferensi aksesibilitas — modul diam total

    document.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('pointerout', onPointerOut, { passive: true });
    document.addEventListener('pointerdown', onPointerDown, { passive: true });
    document.addEventListener('pointerup', releasePress, { passive: true });
    document.addEventListener('pointercancel', releasePress, { passive: true });

    attachPopObserver();
  } catch (err) {
    // Kegagalan modul juice3d TIDAK BOLEH PERNAH menghentikan aplikasi.
    // eslint-disable-next-line no-console
    console.error('[Brightoria] juice3d gagal diinisialisasi (diabaikan dengan aman):', err);
  }
}

initJuice3D();

export {};
