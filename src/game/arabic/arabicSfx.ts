/**
 * arabicSfx.ts — Efek suara UI pendek untuk Oasis Bahasa Arab (Patch 25).
 *
 * BUKAN rekaman audio/musik — SUARA DISINTESIS lewat Web Audio API,
 * dipakai untuk umpan balik UI (klik, benar/salah, dsb), TERPISAH dari
 * `arabicTts.ts` (mengucapkan TEKS ARAB sungguhan lewat Web Speech API).
 * Tidak berubah dari Patch 20-24.
 */

let audioCtx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtx = new Ctor();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => undefined);
    }
    return audioCtx;
  } catch {
    return null;
  }
}

function tone(freq: number, startOffset: number, duration: number, volume: number, type: OscillatorType = 'sine') {
  const ctx = getContext();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const startTime = ctx.currentTime + startOffset;
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.02);
}

function safe(fn: () => void) {
  try {
    fn();
  } catch {
    // Diamkan — kegagalan audio tidak boleh pernah menghentikan gameplay.
  }
}

export const arabicSfx = {
  click() {
    safe(() => tone(520, 0, 0.08, 0.05, 'triangle'));
  },
  step() {
    safe(() => {
      tone(440, 0, 0.06, 0.04, 'sine');
      tone(660, 0.03, 0.07, 0.035, 'sine');
    });
  },
  flip() {
    safe(() => {
      tone(380, 0, 0.05, 0.04, 'triangle');
      tone(500, 0.03, 0.06, 0.04, 'triangle');
    });
  },
  correct() {
    safe(() => {
      tone(523.25, 0, 0.12, 0.07, 'sine');
      tone(659.25, 0.08, 0.12, 0.07, 'sine');
      tone(783.99, 0.16, 0.18, 0.08, 'sine');
    });
  },
  wrong() {
    safe(() => {
      tone(392, 0, 0.14, 0.05, 'sine');
      tone(311.13, 0.08, 0.18, 0.05, 'sine');
    });
  },
  collect() {
    safe(() => {
      tone(659.25, 0, 0.08, 0.06, 'triangle');
      tone(830.61, 0.05, 0.08, 0.06, 'triangle');
      tone(987.77, 0.1, 0.12, 0.07, 'triangle');
    });
  },
  star() {
    safe(() => {
      tone(587.33, 0, 0.1, 0.07, 'sine');
      tone(739.99, 0.07, 0.1, 0.07, 'sine');
      tone(880, 0.14, 0.14, 0.08, 'sine');
      tone(1174.66, 0.22, 0.2, 0.07, 'sine');
    });
  },
  complete() {
    safe(() => {
      tone(523.25, 0, 0.12, 0.08, 'triangle');
      tone(659.25, 0.1, 0.12, 0.08, 'triangle');
      tone(783.99, 0.2, 0.12, 0.08, 'triangle');
      tone(1046.5, 0.3, 0.28, 0.09, 'triangle');
    });
  },
  locked() {
    safe(() => tone(220, 0, 0.15, 0.04, 'square'));
  },
};
