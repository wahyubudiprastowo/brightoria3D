/**
 * evidence.ts — Pelacakan progres Petualangan Huruf Hijaiyah (Patch 30).
 *
 * Tidak berubah secara fungsional dari Patch 27/28 — dibangun ulang
 * karena sandbox sempat ter-reset. Kontrak nama (computeMastery, field
 * `completed: string[]`) mengikuti pola yang sudah terbukti cocok dengan
 * App.tsx untuk dunia lain sejak Patch 20.
 */

export interface LetterProgress {
  attempts: number;
  bestMistakes: number;
  stars: 0 | 1 | 2 | 3;
  completed: boolean;
}

export interface HijaiyahEvidence {
  completed: string[];
  letters: Record<string, LetterProgress>;
  collectedWords: string[];
  updatedAt: string;
}

const KEY = 'brightoria.evidence.hijaiyah.v1';

export const initialEvidence: HijaiyahEvidence = {
  completed: [],
  letters: {},
  collectedWords: [],
  updatedAt: new Date(0).toISOString(),
};

export function loadEvidence(): HijaiyahEvidence {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(initialEvidence);
    const parsed = JSON.parse(raw);
    return { ...structuredClone(initialEvidence), ...parsed };
  } catch {
    return structuredClone(initialEvidence);
  }
}

export function saveEvidence(e: HijaiyahEvidence) {
  localStorage.setItem(KEY, JSON.stringify(e));
}

export function starsFromMistakes(mistakes: number): 0 | 1 | 2 | 3 {
  if (mistakes <= 1) return 3;
  if (mistakes <= 3) return 2;
  return 1;
}

export function computeMastery(evidence: HijaiyahEvidence, totalLevels: number): number {
  if (totalLevels === 0) return 0;
  const maxStars = totalLevels * 3;
  const earned = Object.values(evidence.letters).reduce((sum, l) => sum + l.stars, 0);
  return Math.round((earned / maxStars) * 100);
}

export function recordLetterResult(
  evidence: HijaiyahEvidence,
  letterId: string,
  mistakes: number,
  wordIds: string[],
): HijaiyahEvidence {
  const prev = evidence.letters[letterId] ?? { attempts: 0, bestMistakes: 999, stars: 0, completed: false };
  const newStars = starsFromMistakes(mistakes);
  const bestMistakes = Math.min(prev.bestMistakes, mistakes);
  const bestStars = Math.max(prev.stars, newStars) as 0 | 1 | 2 | 3;

  const nextCompleted = evidence.completed.includes(letterId) ? evidence.completed : [...evidence.completed, letterId];
  const nextCollected = Array.from(new Set([...evidence.collectedWords, ...wordIds]));

  return {
    ...evidence,
    completed: nextCompleted,
    letters: {
      ...evidence.letters,
      [letterId]: {
        attempts: prev.attempts + 1,
        bestMistakes,
        stars: bestStars,
        completed: true,
      },
    },
    collectedWords: nextCollected,
    updatedAt: new Date().toISOString(),
  };
}
