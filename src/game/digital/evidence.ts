export interface DigitalEvidence {
  completed: string[];
  attempts: Record<string, number>;
  hintsUsed: Record<string, number>;
  firstTryCorrect: Record<string, boolean>;
  updatedAt: string;
}

const KEY = 'brightoria.evidence.digital.v1';

export const initialEvidence: DigitalEvidence = {
  completed: [],
  attempts: {},
  hintsUsed: {},
  firstTryCorrect: {},
  updatedAt: new Date(0).toISOString(),
};

export function loadEvidence(): DigitalEvidence {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initialEvidence;
    return { ...initialEvidence, ...JSON.parse(raw) };
  } catch {
    return initialEvidence;
  }
}

export function saveEvidence(evidence: DigitalEvidence) {
  localStorage.setItem(KEY, JSON.stringify(evidence));
}

export function computeMastery(evidence: DigitalEvidence, totalLevels: number): number {
  if (totalLevels === 0) return 0;
  const completedRatio = evidence.completed.length / totalLevels;
  const firstTryValues = Object.values(evidence.firstTryCorrect);
  const firstTryRatio = firstTryValues.length
    ? firstTryValues.filter(Boolean).length / firstTryValues.length
    : 0;
  return Math.round(completedRatio * 70 + firstTryRatio * 30);
}