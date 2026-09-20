/**
 * quality.ts — Deteksi kelas perangkat + preset kualitas render (Patch 38).
 *
 * ====================================================================
 * KENAPA FILE INI ADA
 * ====================================================================
 * Sampai Patch 37, semua scene Three.js memakai angka kualitas yang
 * DITULIS TETAP di kode (mis. dpr={[1, 1.5]}, shadows={false}). Itu
 * berarti HP kelas bawah dipaksa merender sama beratnya dengan laptop,
 * dan laptop bagus tidak pernah mendapat kualitas maksimalnya.
 *
 * Patch 38 memperkenalkan TIGA TIER kualitas yang dipilih otomatis satu
 * kali saat aplikasi dibuka, lalu dipakai bersama oleh seluruh scene 3D
 * (peta dunia, Ekspedisi, Numeria, English Harbor).
 *
 * Deteksi memakai sinyal yang tersedia di browser TANPA library apa pun:
 *   - navigator.hardwareConcurrency (jumlah core CPU)
 *   - navigator.deviceMemory       (RAM, hanya Chromium)
 *   - lebar layar + devicePixelRatio
 *   - renderer string WebGL (mendeteksi GPU software/Swiftshader)
 *   - prefers-reduced-motion (aksesibilitas — selalu dihormati)
 *
 * JAMINAN KEAMANAN: file ini TIDAK mengimpor apa pun, tidak menyentuh
 * React, dan setiap pembacaan dibungkus try/catch. Jika deteksi gagal
 * total, hasilnya jatuh ke tier 'balanced' yang aman untuk semua alat.
 * ====================================================================
 */

export type QualityTier = 'low' | 'balanced' | 'high';

export interface QualityPreset {
  tier: QualityTier;
  /** Rentang device pixel ratio untuk <Canvas dpr={...}>. */
  dpr: [number, number];
  /** Aktifkan shadow map (paling mahal di GPU mobile). */
  shadows: boolean;
  /** Ukuran shadow map per lampu. */
  shadowMapSize: number;
  /** Aktifkan bloom/post-processing kustom. */
  postfx: boolean;
  /** Pengali jumlah partikel (debu, kilau, riak). */
  particleScale: number;
  /** Segmen geometri untuk mesh prosedural (air, pulau). */
  geometryDetail: number;
  /** Aktifkan animasi non-esensial (dimatikan saat reduced-motion). */
  motion: boolean;
  /** Antialias hardware. */
  antialias: boolean;
}

const PRESETS: Record<QualityTier, QualityPreset> = {
  low: {
    tier: 'low',
    dpr: [1, 1],
    shadows: false,
    shadowMapSize: 512,
    postfx: false,
    particleScale: 0.4,
    geometryDetail: 32,
    motion: true,
    antialias: false,
  },
  balanced: {
    tier: 'balanced',
    dpr: [1, 1.75],
    shadows: true,
    shadowMapSize: 1024,
    postfx: true,
    particleScale: 0.8,
    geometryDetail: 64,
    motion: true,
    antialias: true,
  },
  high: {
    tier: 'high',
    dpr: [1, 2],
    shadows: true,
    shadowMapSize: 2048,
    postfx: true,
    particleScale: 1,
    geometryDetail: 96,
    motion: true,
    antialias: true,
  },
};

const STORAGE_KEY = 'brightoria.quality.v1';

function readGpuRenderer(): string {
  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl2') ||
      canvas.getContext('webgl')) as WebGLRenderingContext | null;
    if (!gl) return '';
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    if (!ext) return '';
    const value = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
    return typeof value === 'string' ? value.toLowerCase() : '';
  } catch {
    return '';
  }
}

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches === true;
  } catch {
    return false;
  }
}

function detectTier(): QualityTier {
  try {
    const nav = navigator as Navigator & { deviceMemory?: number };
    const cores = typeof nav.hardwareConcurrency === 'number' ? nav.hardwareConcurrency : 4;
    const memory = typeof nav.deviceMemory === 'number' ? nav.deviceMemory : 4;
    const width = window.innerWidth;
    const dpr = window.devicePixelRatio || 1;
    const renderer = readGpuRenderer();

    // GPU software / emulator -> selalu tier terendah.
    if (renderer.includes('swiftshader') || renderer.includes('llvmpipe') || renderer.includes('software')) {
      return 'low';
    }

    let score = 0;
    score += cores >= 8 ? 2 : cores >= 4 ? 1 : 0;
    score += memory >= 8 ? 2 : memory >= 4 ? 1 : 0;
    score += width >= 1280 ? 1 : 0;
    // Layar HP padat piksel (dpr 3+) berat walau CPU-nya cepat.
    score -= dpr >= 3 && width < 900 ? 1 : 0;
    // GPU mobile kelas hemat daya.
    if (renderer.includes('mali-g5') || renderer.includes('adreno (tm) 5') || renderer.includes('powervr')) {
      score -= 2;
    }

    if (score >= 4) return 'high';
    if (score >= 2) return 'balanced';
    return 'low';
  } catch {
    return 'balanced';
  }
}

let cached: QualityPreset | null = null;

/**
 * Preset kualitas aktif. Dihitung sekali per sesi lalu di-cache.
 * Jika pengguna pernah memilih override manual (lihat setQualityTier),
 * pilihan itu yang dipakai.
 */
export function getQuality(): QualityPreset {
  if (cached) return cached;

  let tier: QualityTier;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    tier = saved === 'low' || saved === 'balanced' || saved === 'high' ? saved : detectTier();
  } catch {
    tier = detectTier();
  }

  const preset: QualityPreset = { ...PRESETS[tier] };
  if (prefersReducedMotion()) {
    preset.motion = false;
    preset.particleScale = 0;
    preset.postfx = false;
  }
  cached = preset;
  return preset;
}

/** Override manual (dipakai panel pengaturan). Perlu reload agar penuh. */
export function setQualityTier(tier: QualityTier): void {
  try {
    localStorage.setItem(STORAGE_KEY, tier);
  } catch {
    // Diamkan — kegagalan menyimpan preferensi tidak boleh merusak aplikasi.
  }
  cached = null;
}

/** Bulatkan jumlah partikel sesuai tier, minimal 0. */
export function scaleCount(base: number): number {
  return Math.max(0, Math.round(base * getQuality().particleScale));
}
