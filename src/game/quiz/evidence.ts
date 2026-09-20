/**
 * Mesin evidence bersama untuk dunia dengan game kuis DOM/CSS (Patch 07).
 * Semua dunia yang memakai QuizGame menyimpan struktur data yang identik,
 * hanya kunci localStorage-nya yang berbeda per dunia.
 */

export interface QuizEvidence {
  completed: string[];
  attempts: Record<string, number>;
  hintsUsed: Record<string, number>;
  firstTryCorrect: Record<string, boolean>;
  updatedAt: string;
}

export const emptyQuizEvidence: QuizEvidence = {
  completed: [],
  attempts: {},
  hintsUsed: {},
  firstTryCorrect: {},
  updatedAt: new Date(0).toISOString(),
};

export function loadQuizEvidence(key: string): QuizEvidence {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return emptyQuizEvidence;
    return { ...emptyQuizEvidence, ...JSON.parse(raw) };
  } catch {
    return emptyQuizEvidence;
  }
}

export function saveQuizEvidence(key: string, evidence: QuizEvidence) {
  localStorage.setItem(key, JSON.stringify(evidence));
}

export function computeQuizMastery(evidence: QuizEvidence, totalLevels: number): number {
  if (totalLevels === 0) return 0;
  const completedRatio = evidence.completed.length / totalLevels;
  const firstTryValues = Object.values(evidence.firstTryCorrect);
  const firstTryRatio = firstTryValues.length
    ? firstTryValues.filter(Boolean).length / firstTryValues.length
    : 0;
  return Math.round(completedRatio * 70 + firstTryRatio * 30);
}