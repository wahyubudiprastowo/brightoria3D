/**
 * englishTts.ts — Pelafalan suara Bahasa Inggris via Web Speech API
 * (Patch 32 — tidak berubah dari Patch 31, dibangun ulang karena sandbox
 * kerja sempat ter-reset).
 *
 * Ketersediaan suara Inggris JAUH LEBIH ANDAL dibanding suara Arab di
 * hampir semua browser/OS modern. Tombol "Dengarkan" tetap dicek dulu
 * sebagai jaring pengaman.
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

function pickEnglishVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const preferred = voices.find((v) => v.lang.toLowerCase() === 'en-us');
  if (preferred) return preferred;
  return voices.find((v) => v.lang.toLowerCase().startsWith('en')) ?? null;
}

let cachedAvailability: boolean | null = null;

export async function isEnglishTtsAvailable(): Promise<boolean> {
  if (cachedAvailability !== null) return cachedAvailability;
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    cachedAvailability = false;
    return false;
  }
  const voices = await loadVoices();
  cachedAvailability = pickEnglishVoice(voices) !== null;
  return cachedAvailability;
}

export async function speakEnglish(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  try {
    const voices = await loadVoices();
    const voice = pickEnglishVoice(voices);
    if (!voice) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    utterance.lang = voice.lang;
    utterance.rate = 0.85;
    utterance.pitch = 1.0;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
  } catch {
    // Diamkan — kegagalan TTS tidak boleh pernah menghentikan gameplay.
  }
}
