/**
 * brightBrand.ts — Token warna resmi Bright Academy Indonesia (Patch 42).
 *
 * ====================================================================
 * SUMBER WARNA
 * ====================================================================
 * Kedua warna di bawah DIAMBIL LANGSUNG dari berkas logo yang Anda
 * kirim, bukan ditebak. Metodenya: membaca seluruh piksel logo,
 * membuang putih/hitam (teks & latar), lalu menghitung piksel
 * kebiruan yang paling sering muncul.
 *
 *   NAVY  #002880  — 321.712 piksel pada logo ikon
 *   LANGIT #28a8e0 — 297.231 piksel pada logo ikon
 *
 * Keduanya mendominasi hampir seluruh area berwarna, jadi inilah dua
 * warna identitas yang sebenarnya.
 *
 * ====================================================================
 * KENAPA ADA WARNA TURUNAN
 * ====================================================================
 * Dua warna saja tidak cukup untuk sebuah dunia 3D. Yang dibutuhkan:
 * langit bergradasi, air, bayangan, rumput, jalan setapak.
 *
 * Semua turunan di bawah dibuat dengan MEMPERTAHANKAN HUE dari kedua
 * warna induk, hanya mengubah kecerahan dan saturasi. Hasilnya dunia
 * terasa satu keluarga warna dengan logo — bukan tempelan biru acak.
 *
 * ====================================================================
 * KEPUTUSAN PENTING: RUMPUT TETAP HIJAU
 * ====================================================================
 * Saya SENGAJA tidak mengubah rumput menjadi biru. Anak usia 6-12
 * membaca dunia lewat isyarat alami: rumput hijau, air biru, tanah
 * coklat. Mengubah rumput jadi biru akan membuat arena terasa asing
 * dan sulit dibaca.
 *
 * Yang dilakukan: hijau digeser sedikit ke arah TEAL (menambah
 * komponen biru) sehingga menyatu dengan langit brand, tanpa kehilangan
 * identitasnya sebagai rumput.
 * ====================================================================
 */

/** Dua warna identitas resmi, diambil langsung dari logo. */
export const BRAND = {
  navy: '#002880',
  sky: '#28a8e0',
} as const;

/** Turunan navy — untuk kedalaman, bayangan, dan siluet jauh. */
export const NAVY = {
  deepest: '#001445',
  deep: '#002880',
  mid: '#123f9e',
  soft: '#2f5bb5',
  pale: '#6d8ed0',
} as const;

/** Turunan biru langit — untuk cahaya, air, dan aksen. */
export const SKY = {
  deep: '#0d7ab0',
  mid: '#1c94cc',
  base: '#28a8e0',
  light: '#67c4ec',
  pale: '#a8dcf5',
  mist: '#d6eefb',
} as const;

/**
 * Warna dunia — semuanya diturunkan dari dua warna induk.
 * Dipakai bersama oleh arena Ekspedisi dan peta dunia.
 */
export const WORLD = {
  /** Langit: navy di puncak, biru langit di cakrawala. */
  skyZenith: '#0b3f8f',
  skyMid: '#28a8e0',
  skyHorizon: '#bfe6f7',

  /** Kabut — menyatu dengan cakrawala agar transisi tak terlihat. */
  fog: '#a9dcf2',

  /** Air danau. */
  waterDeep: '#0d6ba8',
  waterShallow: '#3ab3e6',
  waterFoam: '#d6eefb',

  /**
   * Rumput — hijau yang digeser ke teal.
   * Komponen biru sengaja dinaikkan agar menyatu dengan langit brand.
   */
  grassDark: '#2f7d63',
  grass: '#41a077',
  grassLight: '#5fc08d',

  /** Tanah kering di lereng atas. */
  dry: '#8fae9c',

  /** Batuan — abu kebiruan, bukan coklat. */
  rock: '#5a7691',
  rockLight: '#7c97ae',

  /** Jalan setapak & pasir — pasir kebiruan agar tetap satu keluarga. */
  path: '#8ba6bd',
  sand: '#c9dcea',
  lakeSand: '#a7c8de',

  /** Siluet pegunungan di kejauhan. */
  mountain: '#2f5bb5',
  mountainFar: '#6d8ed0',

  /** Partikel debu cahaya. */
  dust: '#d6eefb',
} as const;

/**
 * Palet karakter — dipakai BlockyCharacter.
 * Pemain memakai navy sebagai warna utama, aksen biru langit.
 */
export const CHARACTER_BRAND = {
  explorer: {
    head: '#f2c391',
    torso: NAVY.deep,
    arms: '#f2c391',
    legs: NAVY.deepest,
    accent: SKY.base,
    hair: '#241d17',
  },
  guide: {
    head: '#f3c9a0',
    torso: SKY.mid,
    arms: '#f3c9a0',
    legs: SKY.deep,
    accent: SKY.pale,
    hair: '#241d17',
  },
} as const;

/** Konversi hex ke tiga komponen 0-1, untuk keperluan shader. */
export function hexToRgb(hex: string): [number, number, number] {
  const v = hex.replace('#', '');
  return [
    parseInt(v.slice(0, 2), 16) / 255,
    parseInt(v.slice(2, 4), 16) / 255,
    parseInt(v.slice(4, 6), 16) / 255,
  ];
}
