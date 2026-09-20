/**
 * quranTts.ts — Pelafalan suara Arab via Web Speech API (Patch 30).
 *
 * Tidak berubah dari Patch 27/28. Memakai `window.speechSynthesis`
 * bawaan browser — BUKAN rekaman native speaker. Tombol "Dengarkan"
 * otomatis disembunyikan jika tidak ada suara Arab terdeteksi.
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
  return voices.find((v) => v.lang.toLowerCase().startsWith('ar')) ?? null;
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
    utterance.rate = 0.78;
    utterance.pitch = 1.0;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
  } catch {
    // Diamkan — kegagalan TTS tidak boleh pernah menghentikan gameplay.
  }
}
