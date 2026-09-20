/**
 * evidence.ts — Pelacakan progres Kampung Adab (Patch 26).
 *
 * Berbeda dari kuis biasa: setiap "bab" (chapter) hanya punya SATU
 * skenario dengan 3 pilihan. Bintang didapat dari KUALITAS pilihan yang
 * diambil (best=3, good=2, needsWork=1), BUKAN dari benar/salah.
 *
 * "Buku Kisah" (collectedOutcomes) mencatat SETIAP kombinasi bab+pilihan
 * yang pernah dicoba pemain — mendorong replay untuk menemukan semua
 * kemungkinan akhir cerita (mekanik koleksi, konsisten dengan pola
 * "Buku Koleksi Kosakata" di Oasis Bahasa Arab, tapi di sini isinya
 * variasi cerita, bukan kosakata).
 *
 * Kontrak nama (computeMastery, field `completed: string[]`) mengikuti
 * pola yang SUDAH TERBUKTI cocok dengan App.tsx untuk dunia lain
 * (Numeria, Digital, Arabic) — lihat riwayat Patch 20 tempat kontrak ini
 * pertama kali dikonfirmasi lewat pesan error TypeScript. Jika App.tsx
 * ternyata memakai nama berbeda untuk dunia 'adab' secara spesifik,
 * kirimkan pesan error build dan akan diperbaiki dengan cepat mengikuti
 * pola yang sama.
 */

export interface ChapterProgress {
  attempts: number;
  bestStars: 0 | 1 | 2 | 3;
  completed: boolean;
  triedChoiceIds: string[];
}

export interface AdabEvidence {
  completed: string[];
  chapters: Record<string, ChapterProgress>;
  collectedOutcomes: string[]; // choiceId unik yang pernah dipilih
  updatedAt: string;
}

const KEY = 'brightoria.evidence.adabStory.v1';

export const initialEvidence: AdabEvidence = {
  completed: [],
  chapters: {},
  collectedOutcomes: [],
  updatedAt: new Date(0).toISOString(),
};

export function loadEvidence(): AdabEvidence {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(initialEvidence);
    const parsed = JSON.parse(raw);
    return { ...structuredClone(initialEvidence), ...parsed };
  } catch {
    return structuredClone(initialEvidence);
  }
}

export function saveEvidence(e: AdabEvidence) {
  localStorage.setItem(KEY, JSON.stringify(e));
}

export function computeMastery(evidence: AdabEvidence, totalChapters: number): number {
  if (totalChapters === 0) return 0;
  const maxStars = totalChapters * 3;
  const earned = Object.values(evidence.chapters).reduce((sum, c) => sum + c.bestStars, 0);
  // Dibatasi 100: mastery tidak boleh pernah melampaui penuh, apa pun
  // isi data lama yang tersimpan di perangkat anak.
  return Math.min(100, Math.round((earned / maxStars) * 100));
}

const starMap: Record<'best' | 'good' | 'needsWork', 0 | 1 | 2 | 3> = {
  best: 3,
  good: 2,
  needsWork: 1,
};

export function recordChoice(
  evidence: AdabEvidence,
  chapterId: string,
  choiceId: string,
  quality: 'best' | 'good' | 'needsWork',
): AdabEvidence {
  const prev = evidence.chapters[chapterId] ?? { attempts: 0, bestStars: 0, completed: false, triedChoiceIds: [] };
  const newStars = starMap[quality];
  const bestStars = Math.max(prev.bestStars, newStars) as 0 | 1 | 2 | 3;
  const triedChoiceIds = prev.triedChoiceIds.includes(choiceId) ? prev.triedChoiceIds : [...prev.triedChoiceIds, choiceId];

  const nextCompleted = evidence.completed.includes(chapterId) ? evidence.completed : [...evidence.completed, chapterId];
  const nextCollected = evidence.collectedOutcomes.includes(choiceId)
    ? evidence.collectedOutcomes
    : [...evidence.collectedOutcomes, choiceId];

  return {
    ...evidence,
    completed: nextCompleted,
    chapters: {
      ...evidence.chapters,
      [chapterId]: {
        attempts: prev.attempts + 1,
        bestStars,
        completed: true,
        triedChoiceIds,
      },
    },
    collectedOutcomes: nextCollected,
    updatedAt: new Date().toISOString(),
  };
}
