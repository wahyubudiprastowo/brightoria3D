export type Progress = { xp: number; level: number; streak: number; completed: string[] };
const KEY = 'brightoria.progress.v2';
export const initialProgress: Progress = { xp: 340, level: 4, streak: 4, completed: [] };

export function loadProgress(): Progress {
  try {
    return JSON.parse(localStorage.getItem(KEY) || 'null') || initialProgress;
  } catch {
    return initialProgress;
  }
}

export function saveProgress(p: Progress) {
  localStorage.setItem(KEY, JSON.stringify(p));
}

export function addXp(amount: number): Progress {
  const current = loadProgress();
  const next = { ...current, xp: current.xp + amount };
  saveProgress(next);
  return next;
}
