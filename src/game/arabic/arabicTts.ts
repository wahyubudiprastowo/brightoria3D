/**
 * arabicTts.ts — Pelafalan suara Bahasa Arab via Web Speech API (Patch 25).
 *
 * Memakai `window.speechSynthesis` — API BAWAAN BROWSER untuk
 * text-to-speech, BUKAN rekaman audio manual. Ini BENAR-BENAR mengucapkan
 * teks Arab (bukan sekadar bunyi UI generik seperti `arabicSfx.ts`).
 *
 * KETERBATASAN JUJUR:
 * 1. Suara sintesis, BUKAN native speaker — bantuan tambahan, bukan
 *    pengganti pengajaran pelafalan oleh guru/orang tua.
 * 2. Ketersediaan tidak terjamin di semua perangkat — jika tidak ada
 *    suara Arab terdeteksi, tombol "Dengarkan" otomatis disembunyikan.
 * 3. Daftar `voices` dimuat async (event `voiceschanged`), ditangani
 *    dengan promise + timeout fallback.
 *
 * Tidak berubah dari Patch 23/24.
 */

let voicesReadyPromise: Promise<SpeechSynthesisVoice[]> | null = null;

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (voicesReadyPromise) return voicesReadyPromise;

  voicesReadyPromise = new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      resolve([]);
      return;
    }
    const synth = window.speechSynthesis;
    const existing = synth.getVoices();
    if (existing.length > 0) {
      resolve(existing);
      return;
    }
    let resolved = false;
    const finish = () => {
      if (resolved) return;
      resolved = true;
      resolve(synth.getVoices());
    };
    synth.addEventListener('voiceschanged', finish, { once: true });
    setTimeout(finish, 800);
  });

  return voicesReadyPromise;
}

function pickArabicVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const preferred = voices.find((v) => v.lang.toLowerCase() === 'ar-sa');
  if (preferred) return preferred;
  const anyArabic = voices.find((v) => v.lang.toLowerCase().startsWith('ar'));
  return anyArabic ?? null;
}

let cachedAvailability: boolean | null = null;

export async function isArabicTtsAvailable(): Promise<boolean> {
  if (cachedAvailability !== null) return cachedAvailability;
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    cachedAvailability = false;
    return false;
  }
  const voices = await loadVoices();
  cachedAvailability = pickArabicVoice(voices) !== null;
  return cachedAvailability;
}

export async function speakArabic(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  try {
    const voices = await loadVoices();
    const voice = pickArabicVoice(voices);
    if (!voice) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.lang = voice.lang;
    utterance.rate = 0.82;
    utterance.pitch = 1.05;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
  } catch {
    // Diamkan — kegagalan TTS tidak boleh pernah menghentikan gameplay.
  }
}

export function stopSpeaking() {
  try {
    window.speechSynthesis?.cancel();
  } catch {
    // no-op
  }
}
