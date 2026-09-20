/**
 * Brightoria SFX — efek suara ringan via Web Audio API (Patch 05).
 *
 * USER SUDAH MENGIZINKAN efek suara, TAPI prinsip non-negotiable produk
 * TETAP berlaku: TANPA musik latar (tidak ada loop/lagu — hanya bunyi
 * umpan balik singkat).
 *
 * Semua efek dibuat prosedural dengan oscillator — tidak ada file audio,
 * tidak ada aset baru, tidak ada dependency baru. Jika audio diblokir
 * browser, semua fungsi aman gagal-diam (tidak pernah mengganggu alur
 * permainan).
 */

const MUTE_KEY = 'brightoria.sound.muted.v1';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted: boolean = loadMuted();

function loadMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

/** Membuat/menghidupkan AudioContext. Aman dipanggil kapan saja;
 *  browser hanya mengizinkan audio setelah interaksi pengguna pertama. */
function ensure(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC: typeof AudioContext | undefined =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) {
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 1;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') {
    void ctx.resume().catch(() => {});
  }
  return ctx;
}

export function isSfxMuted(): boolean {
  return muted;
}

export function setSfxMuted(next: boolean): boolean {
  muted = next;
  try {
    localStorage.setItem(MUTE_KEY, next ? '1' : '0');
  } catch {
    /* localStorage tidak tersedia — abaikan */
  }
  if (ctx && master) {
    master.gain.setTargetAtTime(next ? 0 : 1, ctx.currentTime, 0.01);
  }
  return muted;
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', peak = 0.13) {
  if (muted) return;
  const ac = ensure();
  if (!ac || !master) return;
  const t0 = ac.currentTime + start;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  gain.connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.06);
}

export const sfx = {
  /** Ketukan lembut — interaksi kecil (klik, buka/tutup, navigasi). */
  click() {
    tone(520, 0, 0.09, 'triangle', 0.08);
  },
  /** Jawaban benar — dua nada naik pendek. */
  correct() {
    tone(523.25, 0, 0.12, 'sine', 0.12);
    tone(783.99, 0.09, 0.16, 'sine', 0.12);
  },
  /** Jawaban kurang tepat — dua nada rendah pelan (tidak mengejutkan). */
  wrong() {
    tone(220, 0, 0.16, 'sine', 0.09);
    tone(174.61, 0.13, 0.2, 'sine', 0.08);
  },
  /** Hadiah XP — arpeggio tiga nada. */
  star() {
    tone(659.25, 0, 0.1, 'sine', 0.12);
    tone(830.61, 0.08, 0.1, 'sine', 0.12);
    tone(987.77, 0.16, 0.16, 'sine', 0.12);
  },
  /** Dunia selesai — fanfare singkat empat nada. */
  win() {
    tone(523.25, 0, 0.1, 'sine', 0.11);
    tone(659.25, 0.09, 0.1, 'sine', 0.11);
    tone(783.99, 0.18, 0.1, 'sine', 0.11);
    tone(1046.5, 0.27, 0.24, 'sine', 0.12);
  },
};