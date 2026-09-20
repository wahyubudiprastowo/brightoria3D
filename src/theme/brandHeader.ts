/**
 * brandHeader.ts — Penataan header, logo, dan tata letak elemen
 * mengambang (Patch 46).
 *
 * ====================================================================
 * MASALAH YANG DIPECAHKAN: ELEMEN SALING MENUMPUK
 * ====================================================================
 * Patch 45 memindahkan kartu misi ke kanan-BAWAH untuk menghindari
 * pulau. Itu menyelesaikan satu tabrakan, TAPI menciptakan tabrakan
 * baru: di kanan-bawah sudah ada tombol "Tanya Bri" dan "Ekspedisi".
 *
 * Akar masalahnya lebih dalam daripada satu penempatan yang salah.
 * Aplikasi ini kini punya EMPAT tombol mengambang (Orang Tua, Latihan,
 * Ekspedisi, Tanya Bri) yang masing-masing dipasang oleh modulnya
 * sendiri, tanpa ada satu pun pihak yang mengatur tata letak bersama.
 * Setiap modul menaruh tombolnya di tempat yang "kelihatan kosong"
 * saat itu — dan akhirnya bertumpuk.
 *
 * Berkas ini menjadi OTORITAS TATA LETAK tunggal untuk seluruh elemen
 * mengambang. Pembagian wilayahnya:
 *
 *     KIRI-BAWAH   : rel tombol mengambang, tersusun vertikal
 *     KANAN-BAWAH  : kartu misi
 *     ATAS-TENGAH  : bilah petunjuk peta
 *
 * Pembagian ini dipilih setelah memeriksa tangkapan layar: label pulau
 * mengumpul di TENGAH peta, sementara tepi kiri jauh (x < 200px) dan
 * tepi kanan jauh justru kosong.
 *
 * ====================================================================
 * TIGA PERBAIKAN LAIN
 * ====================================================================
 * 1. BILAH PETUNJUK MENEMBUS LABEL PULAU. Bilah "Geser untuk
 *    memutar..." berada di bawah-tengah, tepat di jalur label pulau
 *    baris bawah. Dipindah ke ATAS peta, yang area langitnya kosong.
 *
 * 2. TEKS LABEL TER-BLOK BIRU. Itu bukan galat gaya, melainkan text
 *    selection bawaan peramban: saat anak menyeret peta untuk memutar,
 *    peramban menganggapnya sebagai gerakan menyorot teks. Diperbaiki
 *    dengan `user-select: none` pada seluruh lapisan peta.
 *
 * 3. LOGO & HEADER. Perbaikan dari Patch 45 dipertahankan utuh —
 *    `box-sizing` terkunci, `overflow` dilepas, header dipangkas.
 *
 * ====================================================================
 * KENAPA LEWAT PENYUNTIKAN CSS, BUKAN MENGUBAH App.tsx
 * ====================================================================
 * Saya tidak memiliki salinan App.tsx. Menebak strukturnya lalu
 * menuliskan ulang berisiko menimpa kode yang sudah bekerja.
 *
 * Pola ini sudah terbukti di proyek ini: juice3d.ts (Patch 29),
 * kidsUi.ts (Patch 32), uiPolish.ts (Patch 37). Semua selector
 * menyasar kelas yang SUDAH ADA; bila suatu kelas ternyata tidak ada,
 * aturannya diabaikan peramban tanpa galat.
 * ====================================================================
 */

const STYLE_ID = 'brightoria-brand-header-v3';
const OLD_STYLE_IDS = ['brightoria-brand-header-v1', 'brightoria-brand-header-v2'];
const LOGO_SRC = '/assets/brand/bright-icon.png';

const HEADER_CSS = `
/* ============================================================
   1) HEADER — ramping, logo tidak terpotong
   ============================================================ */
header {
  padding: 6px 16px !important;
  gap: 10px !important;
  min-height: 0 !important;
}

header .brand {
  gap: 9px !important;
  align-items: center !important;
}

/*
 * box-sizing DIKUNCI border-box — inilah inti perbaikan logo
 * terpotong. Tanpa itu, padding menambah lebar kotak sementara
 * gambar di dalamnya dihitung dari kotak luar, lalu terpotong.
 *
 * overflow SENGAJA visible: dengan object-fit contain gambar tidak
 * akan pernah meluber, jadi clipping hanya menimbulkan risiko.
 */
header .brand .mark {
  box-sizing: border-box !important;
  width: 34px !important;
  height: 34px !important;
  min-width: 34px !important;
  flex: 0 0 34px !important;
  border-radius: 10px !important;
  background: #ffffff !important;
  border: 1.5px solid #d6eefb !important;
  padding: 3px !important;
  overflow: visible !important;
  box-shadow: 0 2px 7px rgba(0, 40, 128, 0.13) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

header .brand .mark img,
header .brand .mark img.brt-logo,
header .mark img.brt-logo {
  box-sizing: border-box !important;
  width: 100% !important;
  height: 100% !important;
  max-width: 100% !important;
  max-height: 100% !important;
  min-width: 0 !important;
  min-height: 0 !important;
  object-fit: contain !important;
  object-position: center center !important;
  display: block !important;
  flex: none !important;
  margin: 0 !important;
  padding: 0 !important;
  border: 0 !important;
  border-radius: 0 !important;
}

header .brand .mark:has(img.brt-logo) svg {
  display: none !important;
}

header .brand b {
  font-size: 15px !important;
  line-height: 1.12 !important;
  color: #002880 !important;
}

header .brand span {
  font-size: 9px !important;
  line-height: 1.15 !important;
  color: #5a7691 !important;
}

header .xp {
  height: 31px !important;
  padding: 0 12px !important;
  font-size: 10px !important;
}

header .mode {
  height: 31px !important;
  padding: 3px !important;
}

header .mode button {
  height: 25px !important;
  padding: 0 12px !important;
  font-size: 11px !important;
}

/* ============================================================
   2) HERO — dipadatkan
   ============================================================ */
.hero {
  padding: 10px 18px 8px !important;
}

.hero h1 {
  font-size: 25px !important;
  line-height: 1.1 !important;
  margin: 4px 0 5px !important;
}

.hero p {
  font-size: 12px !important;
  line-height: 1.45 !important;
  margin: 0 !important;
}

.hero .chips,
.hero .badges {
  margin-top: 8px !important;
  gap: 7px !important;
}

/* ============================================================
   3) REL TOMBOL MENGAMBANG — semua dipindah ke KIRI
   ------------------------------------------------------------
   Tepi kiri jauh (x < 200px) kosong di seluruh tinggi peta,
   karena label pulau mengumpul di tengah. Ini wilayah paling
   aman untuk rel tombol.

   Urutan dari bawah ke atas sengaja menempatkan tombol yang
   BISA TERSEMBUNYI (Latihan, muncul hanya bila ada materi jatuh
   tempo) di posisi PALING ATAS. Dengan begitu, saat ia hilang,
   celah yang tertinggal berada di ujung atas dan tidak terlihat
   — bukan lubang di tengah tumpukan.
   ============================================================ */
.bpi-fab,
.bdp-fab,
.bexp-fab,
[data-brt-rail] {
  left: 16px !important;
  right: auto !important;
  z-index: 62 !important;
}

.bpi-fab { bottom: 88px !important; }              /* Orang Tua  */
.bexp-fab { bottom: 140px !important; }            /* Ekspedisi  */
[data-brt-rail="ai"] { bottom: 192px !important; } /* Tanya Bri  */
.bdp-fab { bottom: 244px !important; }             /* Latihan    */

/* ============================================================
   4) KARTU MISI — menguasai sisi KANAN tanpa saingan
   ============================================================ */
@media (min-width: 1101px) {
  .mission-card {
    position: fixed !important;
    top: auto !important;
    bottom: 84px !important;
    right: 20px !important;
    left: auto !important;
    width: 300px !important;
    max-width: calc(100vw - 40px) !important;
    max-height: calc(100vh - 210px) !important;
    overflow-y: auto !important;
    padding: 16px !important;
    border-radius: 22px !important;
    z-index: 55 !important;

    /* Semi-tembus + blur: peta tetap terbaca di belakang kartu. */
    background: rgba(255, 253, 247, 0.94) !important;
    backdrop-filter: blur(10px) !important;
    -webkit-backdrop-filter: blur(10px) !important;
    box-shadow: 0 12px 34px rgba(20, 30, 45, 0.2) !important;
  }
}

@media (min-width: 701px) and (max-width: 1100px) {
  .mission-card {
    position: fixed !important;
    top: auto !important;
    bottom: 80px !important;
    right: 14px !important;
    left: auto !important;
    width: 268px !important;
    max-width: calc(100vw - 28px) !important;
    max-height: calc(100vh - 190px) !important;
    overflow-y: auto !important;
    padding: 14px !important;
    border-radius: 20px !important;
    z-index: 55 !important;
    background: rgba(255, 253, 247, 0.94) !important;
    backdrop-filter: blur(10px) !important;
    -webkit-backdrop-filter: blur(10px) !important;
  }
}

@media (min-width: 701px) {
  .mission-card .chip {
    font-size: 9px !important;
    padding: 4px 9px !important;
    margin-bottom: 2px !important;
  }
  .mission-card h2,
  .mission-card h3 {
    font-size: 17px !important;
    margin: 4px 0 1px !important;
    padding-right: 38px !important;
    line-height: 1.2 !important;
  }
  .mission-card .progress {
    margin: 9px 0 7px !important;
    height: 8px !important;
  }
  .mission-card .stats {
    margin-bottom: 9px !important;
    font-size: 11px !important;
  }
  .mission-card .objective {
    padding: 10px 11px !important;
    margin-bottom: 11px !important;
    font-size: 12px !important;
    line-height: 1.45 !important;
    border-radius: 14px !important;
  }
  .mission-card .primary {
    min-height: 44px !important;
    font-size: 13.5px !important;
    border-radius: 14px !important;
  }
  .mission-card .close {
    width: 32px !important;
    height: 32px !important;
    top: 11px !important;
    right: 11px !important;
  }
}

/* ============================================================
   5) BILAH PETUNJUK PETA — dipindah ke ATAS
   ------------------------------------------------------------
   Posisi lama di bawah-tengah tepat memotong label pulau baris
   bawah. Bagian atas peta hanya berisi langit, jadi aman.
   ============================================================ */
.compass {
  top: 12px !important;
  bottom: auto !important;
  left: 50% !important;
  transform: translateX(-50%) !important;
  padding: 6px 14px !important;
  font-size: 10.5px !important;
  border-radius: 999px !important;
  pointer-events: none !important;
  opacity: 0.82 !important;
  white-space: nowrap !important;
  max-width: calc(100vw - 40px) !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  z-index: 12 !important;
}

@media (max-width: 700px) {
  .compass {
    top: 10px !important;
    font-size: 9.5px !important;
    padding: 5px 11px !important;
  }
}

/* ============================================================
   6) CEGAH SOROTAN TEKS SAAT MENYERET PETA
   ------------------------------------------------------------
   Blok biru pada label pulau bukan galat gaya, melainkan text
   selection bawaan peramban: menyeret peta untuk memutar
   dianggap sebagai gerakan menyorot teks.

   Label & bilah petunjuk dimatikan seleksinya sepenuhnya.
   ============================================================ */
.world-label,
.world-label *,
.compass,
.world-fallback-card,
.world-fallback-card * {
  user-select: none !important;
  -webkit-user-select: none !important;
  -moz-user-select: none !important;
  -ms-user-select: none !important;
  -webkit-touch-callout: none !important;
}

/* Lapisan kanvas peta: cegah seret-sorot sekaligus seret-gambar. */
.world canvas,
canvas {
  user-select: none !important;
  -webkit-user-select: none !important;
  -webkit-touch-callout: none !important;
  touch-action: none !important;
}

/* Tombol mengambang juga tidak boleh tersorot saat disentuh. */
.bpi-fab,
.bdp-fab,
.bexp-fab,
[data-brt-rail] {
  user-select: none !important;
  -webkit-user-select: none !important;
  -webkit-tap-highlight-color: transparent !important;
}

/* ============================================================
   7) LABEL PULAU — lebar terkunci agar tidak saling menimpa
   ============================================================ */
.world-label {
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  gap: 1px !important;
  width: 112px !important;
  max-width: 112px !important;
  padding: 6px 8px !important;
  border-radius: 13px !important;
  text-align: center !important;
  box-sizing: border-box !important;
  box-shadow: 0 5px 14px rgba(20, 40, 45, 0.16) !important;
}

.world-label b {
  font-size: 10.5px !important;
  font-weight: 900 !important;
  line-height: 1.18 !important;
  display: -webkit-box !important;
  -webkit-line-clamp: 2 !important;
  -webkit-box-orient: vertical !important;
  overflow: hidden !important;
}

.world-label span {
  font-size: 8px !important;
  line-height: 1.2 !important;
  opacity: 0.76 !important;
  display: -webkit-box !important;
  -webkit-line-clamp: 2 !important;
  -webkit-box-orient: vertical !important;
  overflow: hidden !important;
}

.world-label i {
  font-size: 10.5px !important;
  font-weight: 900 !important;
  font-style: normal !important;
  margin-top: 1px !important;
}

/* ============================================================
   8) LAYAR SEMPIT
   ============================================================ */
@media (max-width: 700px) {
  header {
    padding: 6px 12px !important;
    gap: 8px !important;
  }
  header .brand .mark {
    width: 30px !important;
    height: 30px !important;
    min-width: 30px !important;
    flex: 0 0 30px !important;
    border-radius: 9px !important;
    padding: 2.5px !important;
  }
  header .brand b { font-size: 13.5px !important; }
  header .brand span { display: none !important; }
  header .xp {
    height: 28px !important;
    padding: 0 9px !important;
    font-size: 9px !important;
  }
  header .mode { height: 28px !important; }
  header .mode button {
    height: 22px !important;
    padding: 0 9px !important;
    font-size: 10px !important;
  }

  .hero { padding: 9px 14px 7px !important; }
  .hero h1 { font-size: 21px !important; }
  .hero p { font-size: 11.5px !important; }

  /* Rel dirapatkan agar muat di layar pendek. */
  .bpi-fab,
  .bdp-fab,
  .bexp-fab,
  [data-brt-rail] {
    left: 12px !important;
    padding: 8px 12px !important;
    font-size: 11px !important;
  }
  .bpi-fab { bottom: 82px !important; }
  .bexp-fab { bottom: 128px !important; }
  [data-brt-rail="ai"] { bottom: 174px !important; }
  .bdp-fab { bottom: 220px !important; }

  .world-label {
    width: 96px !important;
    max-width: 96px !important;
    padding: 5px 7px !important;
  }
  .world-label b { font-size: 9.5px !important; }
  .world-label span { font-size: 7.5px !important; }
}

@media (max-width: 380px) {
  header .xp { padding: 0 7px !important; font-size: 8.5px !important; }
  header .mode button { padding: 0 7px !important; }
}
`;

function injectStyles(): void {
  OLD_STYLE_IDS.forEach((id) => document.getElementById(id)?.remove());
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = HEADER_CSS;
  document.head.appendChild(style);
}

/**
 * Menukar isi tanda logo dengan berkas logo Bright.
 *
 * Dipanggil berulang lewat MutationObserver karena React bisa
 * merender ulang header (mis. saat berpindah mode Anak/Orang Tua) dan
 * menghapus gambar yang sudah disisipkan.
 */
function applyLogo(): void {
  try {
    const marks = document.querySelectorAll<HTMLElement>('header .brand .mark');
    marks.forEach((mark) => {
      if (mark.querySelector('img.brt-logo')) return; // sudah terpasang

      const img = document.createElement('img');
      img.className = 'brt-logo';
      img.src = LOGO_SRC;
      img.alt = 'Bright Academy';
      img.decoding = 'async';

      // Bila berkas tidak ditemukan, kembalikan ikon bawaan agar header
      // tidak menjadi kotak kosong.
      img.onerror = () => {
        img.remove();
        const svg = mark.querySelector('svg');
        if (svg) (svg as unknown as HTMLElement).style.display = '';
      };

      // Sembunyikan ikon bawaan hanya SETELAH logo berhasil dimuat.
      img.onload = () => {
        const svg = mark.querySelector('svg');
        if (svg) (svg as unknown as HTMLElement).style.display = 'none';
      };

      mark.appendChild(img);
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[Brightoria] brandHeader gagal memasang logo (diabaikan):', err);
  }
}

/**
 * Menandai tombol "Tanya Bri" agar bisa ditempatkan di rel.
 *
 * Tiga tombol lain punya kelas yang saya ketahui (.bpi-fab, .bdp-fab,
 * .bexp-fab) sehingga cukup ditata lewat CSS. Untuk "Tanya Bri" saya
 * tidak memegang salinan berkasnya, jadi dicari lewat teksnya.
 *
 * Penyaringan dibuat ketat agar tidak salah menandai elemen lain yang
 * kebetulan memuat teks serupa:
 *   - harus position: fixed  (hanya elemen mengambang)
 *   - bukan bagian dari header maupun navigasi bawah
 */
function tagAiFab(): void {
  try {
    if (document.querySelector('[data-brt-rail="ai"]')) return;

    const buttons = Array.from(document.querySelectorAll<HTMLElement>('button'));
    for (const button of buttons) {
      const text = (button.textContent || '').toLowerCase();
      if (!text.includes('tanya bri')) continue;
      if (button.closest('header') || button.closest('nav')) continue;
      if (window.getComputedStyle(button).position !== 'fixed') continue;

      button.setAttribute('data-brt-rail', 'ai');
      return;
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[Brightoria] brandHeader gagal menata tombol AI (diabaikan):', err);
  }
}

declare global {
  interface Window {
    __brtBrandHeaderInit?: boolean;
  }
}

function initBrandHeader(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__brtBrandHeaderInit) return;
  window.__brtBrandHeaderInit = true;

  try {
    injectStyles();
    applyLogo();
    tagAiFab();

    // React merender setelah modul ini dimuat, jadi header dan tombol
    // mengambang mungkin belum ada saat pemanggilan pertama. Observer
    // memastikan keduanya tetap tertata setiap kali DOM berubah.
    const observer = new MutationObserver(() => {
      applyLogo();
      tagAiFab();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  } catch (err) {
    // Kegagalan modul kosmetik tidak boleh menghentikan aplikasi.
    // eslint-disable-next-line no-console
    console.error('[Brightoria] brandHeader gagal diinisialisasi (diabaikan):', err);
  }
}

initBrandHeader();

export {};
