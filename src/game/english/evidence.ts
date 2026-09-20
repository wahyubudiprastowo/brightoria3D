/**
 * evidence.ts — Pelacakan progres English Harbor (Patch 32).
 *
 * Tidak berubah dari Patch 31 — dibangun ulang karena sandbox kerja
 * sempat ter-reset. Kontrak nama (computeMastery, field
 * `completed: string[]`) mengikuti pola yang SUDAH TERBUKTI cocok dengan
 * App.tsx untuk dunia lain sejak Patch 20.
 */

export interface IslandProgress {
  attempts: number;
  bestMistakes: number;
  stars: 0 | 1 | 2 | 3;
  completed: boolean;
}

export interface EnglishEvidence {
  completed: string[];
  islands: Record<string, IslandProgress>;
  collectedWords: string[];
  updatedAt: string;
}

const KEY = 'brightoria.evidence.englishHarbor.v1';

export const initialEvidence: EnglishEvidence = {
  completed: [],
  islands: {},
  collectedWords: [],
  updatedAt: new Date(0).toISOString(),
};

export function loadEvidence(): EnglishEvidence {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(initialEvidence);
    const parsed = JSON.parse(raw);
    return { ...structuredClone(initialEvidence), ...parsed };
  } catch {
    return structuredClone(initialEvidence);
  }
}

export function saveEvidence(e: EnglishEvidence) {
  localStorage.setItem(KEY, JSON.stringify(e));
}

export function starsFromMistakes(mistakes: number): 0 | 1 | 2 | 3 {
  if (mistakes <= 1) return 3;
  if (mistakes <= 3) return 2;
  return 1;
}

export function computeMastery(evidence: EnglishEvidence, totalLevels: number): number {
  if (totalLevels === 0) return 0;
  const maxStars = totalLevels * 3;
  const earned = Object.values(evidence.islands).reduce((sum, l) => sum + l.stars, 0);
  return Math.round((earned / maxStars) * 100);
}

export function recordIslandResult(
  evidence: EnglishEvidence,
  islandId: string,
  mistakes: number,
  wordId: string,
): EnglishEvidence {
  const prev = evidence.islands[islandId] ?? { attempts: 0, bestMistakes: 999, stars: 0, completed: false };
  const newStars = starsFromMistakes(mistakes);
  const bestMistakes = Math.min(prev.bestMistakes, mistakes);
  const bestStars = Math.max(prev.stars, newStars) as 0 | 1 | 2 | 3;

  const nextCompleted = evidence.completed.includes(islandId) ? evidence.completed : [...evidence.completed, islandId];
  const nextCollected = evidence.collectedWords.includes(wordId)
    ? evidence.collectedWords
    : [...evidence.collectedWords, wordId];

  return {
    ...evidence,
    completed: nextCompleted,
    islands: {
      ...evidence.islands,
      [islandId]: {
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
