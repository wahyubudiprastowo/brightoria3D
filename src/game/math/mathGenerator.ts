/**
 * mathGenerator.ts - Penghasil soal operasi hitung dasar untuk kelas 3-6 SD.
 *
 * Dipakai oleh mode Latihan/SkyRun/Froggy. Materi dibuat lebih ringan:
 * penjumlahan, pengurangan, perkalian, pembagian exact sederhana, dan
 * operasi campuran satu langkah. Tidak ada pecahan/persen di generator ini.
 */

export interface Fraction {
  num: number;
  den: number;
}

export type MathTopic =
  | 'addition'
  | 'subtraction'
  | 'multiplication'
  | 'division'
  | 'mixed';

export type MathLevel = 'ringan' | 'sedang' | 'menantang';

export interface MathVisual {
  kind: 'bars' | 'single';
  fractions: Fraction[];
  operator?: string;
}

export interface MathQuestion {
  id: string;
  topic: MathTopic;
  level: MathLevel;
  prompt: string;
  hint: string;
  visual: MathVisual;
  options: string[];
  correctIndex: number;
  explanation: string;
}

function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

let questionCounter = 0;
function nextId(topic: MathTopic): string {
  questionCounter += 1;
  return `${topic}-${questionCounter}`;
}

function emptyVisual(operator?: string): MathVisual {
  return { kind: 'single', fractions: [], operator };
}

function buildNumberOptions(answer: number, candidates: number[]): { options: string[]; correctIndex: number } {
  const values: number[] = [answer];
  for (const candidate of candidates) {
    if (values.length >= 3) break;
    if (!Number.isFinite(candidate) || candidate < 0) continue;
    if (values.includes(candidate)) continue;
    values.push(candidate);
  }

  let step = 1;
  while (values.length < 3) {
    const fallback = answer + step;
    if (!values.includes(fallback)) values.push(fallback);
    step += 1;
  }

  const options = shuffle(values).map(String);
  return { options, correctIndex: options.indexOf(String(answer)) };
}

function genAddition(level: MathLevel): MathQuestion {
  const ranges: Record<MathLevel, [number, number][]> = {
    ringan: [[4, 29], [3, 18]],
    sedang: [[12, 75], [8, 45]],
    menantang: [[35, 180], [20, 90]],
  };
  const [[aMin, aMax], [bMin, bMax]] = [ranges[level][0], ranges[level][1]];
  const a = randInt(aMin, aMax);
  const b = randInt(bMin, bMax);
  const answer = a + b;
  const { options, correctIndex } = buildNumberOptions(answer, [
    answer + 10,
    Math.max(1, answer - 10),
    a + b + 1,
    Math.abs(a - b),
  ]);

  return {
    id: nextId('addition'),
    topic: 'addition',
    level,
    prompt: `${a} + ${b} = ?`,
    hint: 'Tambah satuan dulu, lalu puluhannya.',
    visual: emptyVisual('+'),
    options,
    correctIndex,
    explanation: `${a} + ${b} = ${answer}.`,
  };
}

function genSubtraction(level: MathLevel): MathQuestion {
  const max: Record<MathLevel, number> = { ringan: 50, sedang: 120, menantang: 250 };
  const a = randInt(18, max[level]);
  const b = randInt(3, Math.min(a - 1, level === 'ringan' ? 25 : 90));
  const answer = a - b;
  const { options, correctIndex } = buildNumberOptions(answer, [
    a + b,
    answer + 10,
    Math.max(1, answer - 10),
    answer + 1,
  ]);

  return {
    id: nextId('subtraction'),
    topic: 'subtraction',
    level,
    prompt: `${a} - ${b} = ?`,
    hint: 'Kurangi pelan-pelan dari angka yang besar.',
    visual: emptyVisual('-'),
    options,
    correctIndex,
    explanation: `${a} - ${b} = ${answer}.`,
  };
}

function genMultiplication(level: MathLevel): MathQuestion {
  const ranges: Record<MathLevel, [number, number][]> = {
    ringan: [[2, 6], [2, 6]],
    sedang: [[3, 9], [2, 10]],
    menantang: [[4, 12], [4, 12]],
  };
  const [[aMin, aMax], [bMin, bMax]] = [ranges[level][0], ranges[level][1]];
  const a = randInt(aMin, aMax);
  const b = randInt(bMin, bMax);
  const answer = a * b;
  const { options, correctIndex } = buildNumberOptions(answer, [
    a + b,
    a * (b + 1),
    Math.max(1, (a - 1) * b),
    answer + 2,
  ]);

  return {
    id: nextId('multiplication'),
    topic: 'multiplication',
    level,
    prompt: `${a} x ${b} = ?`,
    hint: `${a} x ${b} artinya ${a} dijumlahkan sebanyak ${b} kali.`,
    visual: emptyVisual('x'),
    options,
    correctIndex,
    explanation: `${a} x ${b} = ${answer}.`,
  };
}

function genDivision(level: MathLevel): MathQuestion {
  const divisors: Record<MathLevel, number[]> = {
    ringan: [2, 3, 4, 5],
    sedang: [2, 3, 4, 5, 6, 8],
    menantang: [3, 4, 6, 7, 8, 9, 12],
  };
  const divisor = pick(divisors[level]);
  const quotient = randInt(2, level === 'menantang' ? 12 : 9);
  const total = divisor * quotient;
  const { options, correctIndex } = buildNumberOptions(quotient, [
    divisor,
    quotient + 1,
    Math.max(1, quotient - 1),
    total - divisor,
  ]);

  return {
    id: nextId('division'),
    topic: 'division',
    level,
    prompt: `${total} : ${divisor} = ?`,
    hint: `Cari angka yang jika dikali ${divisor} hasilnya ${total}.`,
    visual: emptyVisual(':'),
    options,
    correctIndex,
    explanation: `${total} : ${divisor} = ${quotient}, karena ${divisor} x ${quotient} = ${total}.`,
  };
}

function genMixed(level: MathLevel): MathQuestion {
  const a = randInt(level === 'ringan' ? 2 : 5, level === 'menantang' ? 35 : 18);
  const b = randInt(2, level === 'menantang' ? 12 : 9);
  const c = randInt(2, level === 'menantang' ? 25 : 12);
  const multiplyFirst = Math.random() < 0.55;
  const answer = multiplyFirst ? a + b * c : a * b - c;
  const prompt = multiplyFirst ? `${a} + ${b} x ${c} = ?` : `${a} x ${b} - ${c} = ?`;
  const wrongLeftToRight = multiplyFirst ? (a + b) * c : a * (b - c);
  const { options, correctIndex } = buildNumberOptions(answer, [
    wrongLeftToRight,
    answer + b,
    Math.max(1, answer - c),
    answer + 1,
  ]);

  return {
    id: nextId('mixed'),
    topic: 'mixed',
    level,
    prompt,
    hint: 'Kerjakan perkalian dulu, baru tambah atau kurang.',
    visual: emptyVisual(multiplyFirst ? '+ x' : 'x -'),
    options,
    correctIndex,
    explanation: multiplyFirst
      ? `${b} x ${c} = ${b * c}, lalu ${a} + ${b * c} = ${answer}.`
      : `${a} x ${b} = ${a * b}, lalu ${a * b} - ${c} = ${answer}.`,
  };
}

const TOPICS_BY_LEVEL: Record<MathLevel, MathTopic[]> = {
  ringan: ['addition', 'subtraction', 'multiplication', 'division'],
  sedang: ['addition', 'subtraction', 'multiplication', 'division', 'mixed'],
  menantang: ['addition', 'subtraction', 'multiplication', 'division', 'mixed'],
};

function generateOne(level: MathLevel, topic?: MathTopic): MathQuestion {
  const chosen = topic ?? pick(TOPICS_BY_LEVEL[level]);
  switch (chosen) {
    case 'addition':
      return genAddition(level);
    case 'subtraction':
      return genSubtraction(level);
    case 'multiplication':
      return genMultiplication(level);
    case 'division':
      return genDivision(level);
    case 'mixed':
      return genMixed(level);
    default:
      return genAddition(level);
  }
}

const MATH_KEY = 'brightoria.mathAdaptive.v2';

export interface MathProgress {
  level: MathLevel;
  recent: boolean[];
  totalAnswered: number;
  totalCorrect: number;
  misconceptions: Record<string, number>;
}

const EMPTY_PROGRESS: MathProgress = {
  level: 'ringan',
  recent: [],
  totalAnswered: 0,
  totalCorrect: 0,
  misconceptions: {},
};

export function loadMathProgress(): MathProgress {
  try {
    const raw = localStorage.getItem(MATH_KEY);
    if (!raw) return structuredClone(EMPTY_PROGRESS);
    const parsed = JSON.parse(raw) as Partial<MathProgress>;
    const level =
      parsed.level === 'ringan' || parsed.level === 'sedang' || parsed.level === 'menantang'
        ? parsed.level
        : 'ringan';
    return {
      level,
      recent: Array.isArray(parsed.recent) ? parsed.recent.filter((x) => typeof x === 'boolean') : [],
      totalAnswered: typeof parsed.totalAnswered === 'number' ? parsed.totalAnswered : 0,
      totalCorrect: typeof parsed.totalCorrect === 'number' ? parsed.totalCorrect : 0,
      misconceptions:
        parsed.misconceptions && typeof parsed.misconceptions === 'object'
          ? (parsed.misconceptions as Record<string, number>)
          : {},
    };
  } catch {
    return structuredClone(EMPTY_PROGRESS);
  }
}

function saveMathProgress(progress: MathProgress): void {
  try {
    localStorage.setItem(MATH_KEY, JSON.stringify(progress));
  } catch {
    /* Diamkan. */
  }
}

const LEVEL_ORDER: MathLevel[] = ['ringan', 'sedang', 'menantang'];

export function recordMathAnswer(
  question: MathQuestion,
  chosenIndex: number,
): { progress: MathProgress; levelChanged: 'up' | 'down' | null } {
  const progress = loadMathProgress();
  const wasCorrect = chosenIndex === question.correctIndex;

  progress.totalAnswered += 1;
  if (wasCorrect) progress.totalCorrect += 1;

  if (!wasCorrect && chosenIndex >= 0 && chosenIndex < question.options.length) {
    const key = `${question.options[question.correctIndex]}|${question.options[chosenIndex]}`;
    progress.misconceptions[key] = (progress.misconceptions[key] ?? 0) + 1;
  }

  progress.recent = [...progress.recent, wasCorrect].slice(-5);
  let levelChanged: 'up' | 'down' | null = null;

  if (progress.recent.length >= 5) {
    const correctCount = progress.recent.filter(Boolean).length;
    const currentIndex = LEVEL_ORDER.indexOf(progress.level);
    if (correctCount >= 4 && currentIndex < LEVEL_ORDER.length - 1) {
      progress.level = LEVEL_ORDER[currentIndex + 1];
      progress.recent = [];
      levelChanged = 'up';
    } else if (correctCount <= 2 && currentIndex > 0) {
      progress.level = LEVEL_ORDER[currentIndex - 1];
      progress.recent = [];
      levelChanged = 'down';
    }
  }

  saveMathProgress(progress);
  return { progress, levelChanged };
}

export function generateMathSet(count: number, level?: MathLevel): MathQuestion[] {
  const activeLevel = level ?? loadMathProgress().level;
  const rotation = shuffle([...TOPICS_BY_LEVEL[activeLevel]]);
  return Array.from({ length: count }).map((_, i) =>
    generateOne(activeLevel, rotation[i % rotation.length]),
  );
}

export function generateMathQuestion(level?: MathLevel): MathQuestion {
  return generateOne(level ?? loadMathProgress().level);
}

export const LEVEL_LABEL: Record<MathLevel, string> = {
  ringan: 'Kelas 3-4',
  sedang: 'Kelas 4-5',
  menantang: 'Kelas 5-6',
};

export function topMisconceptions(limit = 3): { correct: string; chosen: string; count: number }[] {
  const progress = loadMathProgress();
  return Object.entries(progress.misconceptions)
    .map(([key, count]) => {
      const [correct, chosen] = key.split('|');
      return { correct, chosen, count };
    })
    .filter((entry) => entry.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
