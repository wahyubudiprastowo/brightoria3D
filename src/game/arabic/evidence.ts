/**
 * evidence.ts — Pelacakan progres Oasis Bahasa Arab (Patch 25).
 *
 * Tidak berubah secara fungsional dari Patch 20-24 — dibangun ulang di
 * sini karena sandbox sempat ter-reset antar sesi kerja. Kontrak nama
 * (computeMastery, field `completed: string[]`) TETAP SAMA seperti yang
 * sudah cocok dengan App.tsx sejak Patch 20 — JANGAN diubah lagi.
 */

export interface StopProgress {
  attempts: number;
  correct: number;
  stars: 0 | 1 | 2 | 3;
  completed: boolean;
}

export interface ArabicEvidence {
  completed: string[];
  stops: Record<string, StopProgress>;
  collectedWords: string[];
  totalStarsEver: number;
  updatedAt: string;
}

const KEY = 'brightoria.evidence.arabicOasis.v2';

export const initialEvidence: ArabicEvidence = {
  completed: [],
  stops: {},
  collectedWords: [],
  totalStarsEver: 0,
  updatedAt: new Date(0).toISOString(),
};

export function loadEvidence(): ArabicEvidence {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(initialEvidence);
    const parsed = JSON.parse(raw);
    const merged: ArabicEvidence = { ...structuredClone(initialEvidence), ...parsed };
    if (!Array.isArray(merged.completed)) {
      merged.completed = Object.entries(merged.stops ?? {})
        .filter(([, p]) => (p as StopProgress).completed)
        .map(([id]) => id);
    }
    return merged;
  } catch {
    return structuredClone(initialEvidence);
  }
}

export function saveEvidence(e: ArabicEvidence) {
  localStorage.setItem(KEY, JSON.stringify(e));
}

export function starsFromAccuracy(correct: number, total: number): 0 | 1 | 2 | 3 {
  if (total === 0) return 0;
  const ratio = correct / total;
  if (ratio >= 0.9) return 3;
  if (ratio >= 0.7) return 2;
  if (ratio >= 0.4) return 1;
  return 0;
}

export function computeMastery(evidence: ArabicEvidence, totalLevels: number): number {
  if (totalLevels === 0) return 0;
  const maxStars = totalLevels * 3;
  const earnedStars = Object.values(evidence.stops).reduce((sum, s) => sum + s.stars, 0);
  return Math.round((earnedStars / maxStars) * 100);
}

export function recordStopResult(
  evidence: ArabicEvidence,
  stopId: string,
  correctCount: number,
  totalCount: number,
  wordIdsAnsweredCorrectly: string[],
): ArabicEvidence {
  const prev = evidence.stops[stopId] ?? { attempts: 0, correct: 0, stars: 0, completed: false };
  const newStars = starsFromAccuracy(correctCount, totalCount);
  const bestStars = Math.max(prev.stars, newStars) as 0 | 1 | 2 | 3;

  const nextCollected = Array.from(new Set([...evidence.collectedWords, ...wordIdsAnsweredCorrectly]));
  const nextCompleted = evidence.completed.includes(stopId)
    ? evidence.completed
    : [...evidence.completed, stopId];

  return {
    ...evidence,
    completed: nextCompleted,
    stops: {
      ...evidence.stops,
      [stopId]: {
        attempts: prev.attempts + 1,
        correct: prev.correct + correctCount,
        stars: bestStars,
        completed: true,
      },
    },
    collectedWords: nextCollected,
    totalStarsEver: evidence.totalStarsEver + newStars,
    updatedAt: new Date().toISOString(),
  };
}
