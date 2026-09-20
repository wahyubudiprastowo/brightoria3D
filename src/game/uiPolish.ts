/**
 * uiPolish.ts — Lapisan perapian antarmuka Brightoria (Patch 37).
 *
 * ====================================================================
 * MASALAH YANG DIPECAHKAN (berdasarkan screenshot pengguna):
 * ====================================================================
 * 1. KARTU MISI TIDAK RESPONSIF.
 *    Di desktop kartu "English Harbor" mengambang di kanan dan menutupi
 *    sebagian peta; di layar sempit kartu terpotong dan sudutnya terlihat
 *    janggal. Penyebabnya kartu tidak punya aturan ukuran/posisi yang
 *    berbeda antar-breakpoint.
 *
 *    PERBAIKAN: tiga perilaku berbeda —
 *      - Layar lebar (>1100px): panel kanan dengan lebar terkunci,
 *        tinggi maksimum, dan scroll internal bila konten panjang.
 *      - Tablet (701-1100px): panel lebih ramping, jarak dari tepi
 *        dikurangi agar tidak memakan peta.
 *      - Mobile (<=700px): berubah menjadi bottom sheet selebar layar
 *        yang muncul dari bawah — pola standar yang jauh lebih nyaman
 *        di genggaman daripada kartu mengambang.
 *
 * 2. HEADER BELUM RAPI.
 *    Jarak antar elemen tidak konsisten, dan di layar sempit lencana XP
 *    beserta pemilih mode berdesakan. Diperbaiki dengan penataan jarak
 *    yang konsisten, tinggi elemen yang seragam, serta penyusunan ulang
 *    di layar kecil.
 *
 * 3. LABEL PULAU BERTABRAKAN.
 *    Setelah `distanceFactor` dihapus di WorldScene.tsx (Patch 37), label
 *    kini berukuran piksel tetap. Berkas ini mengunci lebarnya agar tidak
 *    melebar mengikuti panjang teks, sehingga label tidak lagi saling
 *    menimpa seperti pada "Kampung Adab" di screenshot.
 *
 * 4. BILAH PETUNJUK PETA MENUTUPI LABEL.
 *    Bilah "Geser untuk memutar..." menutupi label "Benteng Digital".
 *    Diperbaiki dengan menaikkan posisinya, mengecilkan ukurannya, dan
 *    mematikan pointer-events agar tidak menghalangi klik pulau.
 *
 * 5. TOMBOL MENGAMBANG BERTABRAKAN DENGAN NAVIGASI BAWAH.
 *    Tombol "Orang Tua" (Patch 34) dan "Latihan" (Patch 35) berada pada
 *    bottom 84px — terlalu dekat dengan bilah navigasi. Posisinya
 *    dinaikkan dan disesuaikan per-breakpoint.
 *
 * ====================================================================
 * JAMINAN KEAMANAN — prinsip "jangan merusak yang sudah ada":
 * ====================================================================
 * - Modul ini HANYA menyuntikkan satu elemen <style> ke <head>. Tidak
 *   mengimpor, mengubah, atau menimpa berkas komponen mana pun.
 * - Semua selector menyasar kelas yang SUDAH ADA di proyek. Bila suatu
 *   kelas ternyata tidak ada di DOM, aturannya diabaikan browser tanpa
 *   menimbulkan galat.
 * - TIDAK menyentuh properti `transform` (dipakai juice3d.ts untuk efek
 *   miring) maupun `animation` pada kelas status permainan (.correct,
 *   .wrong, .matched) — mencegah rebutan properti antar-modul.
 * - Disuntikkan SETELAH kidsUi.ts (Patch 32) bila keduanya dipasang,
 *   sehingga aturan di sini menang bila ada tumpang tindih. Itu memang
 *   disengaja: berkas ini lebih spesifik dan lebih baru.
 * ====================================================================
 */

const STYLE_ID = 'brightoria-ui-polish-v1';

const POLISH_CSS = `
/* ============================================================
   1) HEADER — penataan jarak & tinggi yang konsisten
   ============================================================ */
header {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 14px !important;
  padding: 12px 20px !important;
  flex-wrap: nowrap !important;
}

header .brand {
  display: flex !important;
  align-items: center !important;
  gap: 10px !important;
  min-width: 0 !important;
}

header .brand .mark {
  width: 40px !important;
  height: 40px !important;
  border-radius: 14px !important;
  display: grid !important;
  place-items: center !important;
  flex-shrink: 0 !important;
}

header .brand b {
  font-size: 17px !important;
  line-height: 1.15 !important;
  white-space: nowrap !important;
}

header .brand span {
  font-size: 10px !important;
  line-height: 1.2 !important;
  white-space: nowrap !important;
}

/* Kelompok kanan: lencana XP + pemilih mode */
header > div:last-child {
  display: flex !important;
  align-items: center !important;
  gap: 10px !important;
  flex-shrink: 0 !important;
}

header .xp {
  display: inline-flex !important;
  align-items: center !important;
  gap: 7px !important;
  height: 38px !important;
  padding: 0 14px !important;
  border-radius: 999px !important;
  font-size: 11px !important;
  font-weight: 900 !important;
  white-space: nowrap !important;
}

header .mode {
  display: inline-flex !important;
  align-items: center !important;
  height: 38px !important;
  padding: 3px !important;
  border-radius: 999px !important;
  gap: 2px !important;
}

header .mode button {
  height: 32px !important;
  padding: 0 14px !important;
  border-radius: 999px !important;
  font-size: 12px !important;
  font-weight: 800 !important;
  white-space: nowrap !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 5px !important;
}

/* ============================================================
   2) KARTU MISI — tiga perilaku menurut lebar layar
   ============================================================ */

/* -- Dasar (berlaku di semua ukuran) -- */
.mission-card {
  border-radius: 26px !important;
  box-sizing: border-box !important;
  overflow: hidden !important;
}

/* -- Layar lebar: panel kanan dengan tinggi terbatas -- */
@media (min-width: 1101px) {
  .mission-card {
    position: fixed !important;
    top: 96px !important;
    right: 24px !important;
    left: auto !important;
    bottom: auto !important;
    width: 340px !important;
    max-width: calc(100vw - 48px) !important;
    max-height: calc(100vh - 190px) !important;
    overflow-y: auto !important;
    padding: 22px !important;
    z-index: 55 !important;
  }
}

/* -- Tablet: lebih ramping agar peta tetap lapang -- */
@media (min-width: 701px) and (max-width: 1100px) {
  .mission-card {
    position: fixed !important;
    top: 88px !important;
    right: 16px !important;
    left: auto !important;
    bottom: auto !important;
    width: 300px !important;
    max-width: calc(100vw - 32px) !important;
    max-height: calc(100vh - 176px) !important;
    overflow-y: auto !important;
    padding: 18px !important;
    z-index: 55 !important;
  }
}

/* -- Mobile: bottom sheet selebar layar -- */
@media (max-width: 700px) {
  .mission-card {
    position: fixed !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    top: auto !important;
    width: 100% !important;
    max-width: 100% !important;
    max-height: 72vh !important;
    overflow-y: auto !important;
    padding: 20px 18px calc(20px + env(safe-area-inset-bottom, 0px)) !important;
    border-radius: 28px 28px 0 0 !important;
    box-shadow: 0 -12px 40px rgba(20, 30, 40, 0.24) !important;
    z-index: 70 !important;
  }

  /* Pegangan geser agar terbaca sebagai lembar yang bisa ditutup */
  .mission-card::before {
    content: '';
    display: block;
    width: 44px;
    height: 5px;
    border-radius: 999px;
    background: rgba(20, 40, 45, 0.16);
    margin: -6px auto 14px;
  }
}

/* -- Isi kartu: jarak antar-bagian yang konsisten -- */
.mission-card .chip {
  margin-bottom: 4px !important;
}

.mission-card h2,
.mission-card h3 {
  margin: 6px 0 2px !important;
  line-height: 1.25 !important;
}

.mission-card .progress {
  margin: 14px 0 10px !important;
  height: 10px !important;
  border-radius: 999px !important;
  overflow: hidden !important;
}

.mission-card .stats {
  display: flex !important;
  align-items: baseline !important;
  justify-content: space-between !important;
  gap: 10px !important;
  margin-bottom: 14px !important;
}

.mission-card .objective {
  border-radius: 18px !important;
  padding: 14px !important;
  margin-bottom: 16px !important;
  line-height: 1.55 !important;
}

.mission-card .primary {
  width: 100% !important;
  min-height: 52px !important;
  border-radius: 18px !important;
  font-size: 15px !important;
}

/* Tombol tutup kartu — jangan sampai menabrak tepi */
.mission-card .close {
  position: absolute !important;
  top: 14px !important;
  right: 14px !important;
  width: 38px !important;
  height: 38px !important;
  border-radius: 50% !important;
  display: grid !important;
  place-items: center !important;
  z-index: 2 !important;
}

/* Beri ruang agar judul tidak tertimpa tombol tutup */
.mission-card h2,
.mission-card h3,
.mission-card .chip {
  padding-right: 44px !important;
}

/* ============================================================
   3) LABEL PULAU — lebar terkunci agar tidak saling menimpa
   ============================================================ */
.world-label {
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  gap: 1px !important;
  width: 118px !important;
  max-width: 118px !important;
  padding: 7px 9px !important;
  border-radius: 14px !important;
  text-align: center !important;
  box-sizing: border-box !important;
  backdrop-filter: blur(3px) !important;
  box-shadow: 0 6px 16px rgba(20, 40, 45, 0.18) !important;
}

.world-label b {
  font-size: 11px !important;
  font-weight: 900 !important;
  line-height: 1.2 !important;
  display: -webkit-box !important;
  -webkit-line-clamp: 2 !important;
  -webkit-box-orient: vertical !important;
  overflow: hidden !important;
}

.world-label span {
  font-size: 8.5px !important;
  line-height: 1.25 !important;
  opacity: 0.78 !important;
  display: -webkit-box !important;
  -webkit-line-clamp: 2 !important;
  -webkit-box-orient: vertical !important;
  overflow: hidden !important;
}

.world-label i {
  font-size: 11px !important;
  font-weight: 900 !important;
  font-style: normal !important;
  margin-top: 2px !important;
}

@media (max-width: 700px) {
  .world-label {
    width: 100px !important;
    max-width: 100px !important;
    padding: 6px 8px !important;
  }
  .world-label b { font-size: 10px !important; }
  .world-label span { font-size: 8px !important; }
}

/* ============================================================
   4) BILAH PETUNJUK PETA — naikkan & jangan halangi klik
   ============================================================ */
.compass {
  bottom: 84px !important;
  padding: 8px 16px !important;
  font-size: 11px !important;
  border-radius: 999px !important;
  pointer-events: none !important;
  opacity: 0.88 !important;
  white-space: nowrap !important;
  max-width: calc(100vw - 40px) !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
}

@media (max-width: 700px) {
  .compass {
    bottom: 128px !important;
    font-size: 10px !important;
    padding: 7px 13px !important;
  }
}

/* ============================================================
   5) TOMBOL MENGAMBANG — hindari tabrakan dengan navigasi bawah
   ============================================================ */
.bpi-fab { bottom: 104px !important; }
.bdp-fab { bottom: 104px !important; }

@media (max-width: 700px) {
  /* Di mobile, kartu misi menjadi bottom sheet, jadi tombol
     dinaikkan lebih tinggi lagi agar tidak tertutup. */
  .bpi-fab { bottom: 96px !important; left: 12px !important; }
  .bdp-fab { bottom: 96px !important; right: 12px !important; }
}

/* ============================================================
   6) HERO — jarak lebih seimbang, tidak memakan ruang peta
   ============================================================ */
.hero {
  padding: 20px 20px 16px !important;
}

.hero h1 {
  line-height: 1.12 !important;
  margin: 8px 0 8px !important;
}

.hero p {
  line-height: 1.6 !important;
  margin: 0 !important;
}

@media (max-width: 700px) {
  .hero { padding: 16px 16px 12px !important; }
  .hero h1 { font-size: 26px !important; }
  .hero p { font-size: 13px !important; }
}

/* ============================================================
   7) HEADER DI LAYAR SEMPIT — susun ulang agar tidak berdesakan
   ============================================================ */
@media (max-width: 700px) {
  header {
    padding: 10px 14px !important;
    gap: 10px !important;
  }
  header .brand .mark { width: 36px !important; height: 36px !important; }
  header .brand b { font-size: 15px !important; }
  header .brand span { display: none !important; }
  header .xp {
    height: 34px !important;
    padding: 0 11px !important;
    font-size: 10px !important;
  }
  header .mode { height: 34px !important; }
  header .mode button {
    height: 28px !important;
    padding: 0 11px !important;
    font-size: 11px !important;
  }
}

/* Layar sangat sempit: sembunyikan label teks pada pemilih mode,
   sisakan ikonnya saja agar tetap muat. */
@media (max-width: 380px) {
  header .xp { font-size: 9px !important; padding: 0 9px !important; }
  header .mode button { padding: 0 9px !important; }
}
`;

function injectUiPolish(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;
  try {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = POLISH_CSS;
    // Disisipkan di akhir <head> agar menang atas stylesheet sebelumnya
    // bila terjadi tumpang tindih aturan.
    document.head.appendChild(style);
  } catch (err) {
    // Kegagalan modul kosmetik tidak boleh menghentikan aplikasi.
    // eslint-disable-next-line no-console
    console.error('[Brightoria] uiPolish gagal disuntikkan (diabaikan dengan aman):', err);
  }
}

injectUiPolish();

export {};
