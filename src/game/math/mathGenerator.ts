/**
 * mathGenerator.ts - Penghasil soal matematika untuk game Penerbangan/Katak.
 *
 * Profil materi:
 * - flight12: kelas 1-2 untuk Penerbangan Ilmu.
 * - frog34: kelas 3-4 untuk Lompat Katak.
 */

export interface Fraction {
  num: number;
  den: number;
}

export type MathTopic =
  | 'counting'
  | 'addition'
  | 'subtraction'
  | 'placeValue'
  | 'multiplication'
  | 'division'
  | 'mixed'
  | 'pattern'
  | 'fractionBasic'
  | 'measurement'
  | 'geometry'
  | 'data';

export type MathLevel = 'ringan' | 'sedang' | 'menantang';
export type MathProfile = 'flight12' | 'frog34' | 'general';

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

function genCounting(level: MathLevel): MathQuestion {
  const max: Record<MathLevel, number> = { ringan: 20, sedang: 50, menantang: 100 };
  const answer = randInt(level === 'ringan' ? 5 : 16, max[level]);
  const { options, correctIndex } = buildNumberOptions(answer, [
    answer + 1,
    Math.max(1, answer - 1),
    answer + 10,
    Math.max(1, answer - 10),
  ]);

  return {
    id: nextId('counting'),
    topic: 'counting',
    level,
    prompt: `Bilangan setelah ${answer - 1} adalah ...`,
    hint: 'Hitung maju satu langkah.',
    visual: emptyVisual('123'),
    options,
    correctIndex,
    explanation: `Setelah ${answer - 1} adalah ${answer}.`,
  };
}

function genAddition(level: MathLevel, profile: MathProfile = 'general'): MathQuestion {
  const ranges: Record<MathProfile, Record<MathLevel, [number, number][]>> = {
    flight12: {
      ringan: [[1, 9], [1, 9]],
      sedang: [[8, 30], [2, 20]],
      menantang: [[15, 70], [5, 30]],
    },
    frog34: {
      ringan: [[20, 180], [10, 90]],
      sedang: [[80, 550], [30, 280]],
      menantang: [[400, 4200], [120, 2600]],
    },
    general: {
      ringan: [[4, 29], [3, 18]],
      sedang: [[12, 75], [8, 45]],
      menantang: [[35, 180], [20, 90]],
    },
  };
  const [[aMin, aMax], [bMin, bMax]] = [ranges[profile][level][0], ranges[profile][level][1]];
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

function genSubtraction(level: MathLevel, profile: MathProfile = 'general'): MathQuestion {
  const max: Record<MathProfile, Record<MathLevel, number>> = {
    flight12: { ringan: 20, sedang: 50, menantang: 100 },
    frog34: { ringan: 200, sedang: 1000, menantang: 10000 },
    general: { ringan: 50, sedang: 120, menantang: 250 },
  };
  const floor = profile === 'flight12' ? 6 : 18;
  const a = randInt(floor, max[profile][level]);
  const b = randInt(1, Math.min(a - 1, profile === 'flight12' ? Math.max(2, Math.floor(a / 2)) : level === 'ringan' ? 80 : 900));
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

function genPlaceValue(level: MathLevel, profile: MathProfile = 'general'): MathQuestion {
  if (profile === 'flight12') {
    const tens = randInt(1, level === 'ringan' ? 2 : level === 'sedang' ? 5 : 9);
    const ones = randInt(0, 9);
    const answer = tens * 10 + ones;
    const { options, correctIndex } = buildNumberOptions(answer, [tens + ones, answer + 10, Math.max(1, answer - 10)]);
    return {
      id: nextId('placeValue'),
      topic: 'placeValue',
      level,
      prompt: `${tens} puluhan + ${ones} satuan = ?`,
      hint: '1 puluhan berarti 10.',
      visual: emptyVisual('10'),
      options,
      correctIndex,
      explanation: `${tens} puluhan = ${tens * 10}, lalu tambah ${ones} = ${answer}.`,
    };
  }

  const thousands = randInt(1, level === 'menantang' ? 9 : 3);
  const hundreds = randInt(0, 9);
  const tens = randInt(0, 9);
  const answer = thousands * 1000 + hundreds * 100 + tens * 10;
  const { options, correctIndex } = buildNumberOptions(answer, [thousands + hundreds + tens, answer + 100, Math.max(1, answer - 100)]);
  return {
    id: nextId('placeValue'),
    topic: 'placeValue',
    level,
    prompt: `${thousands} ribuan + ${hundreds} ratusan + ${tens} puluhan = ?`,
    hint: 'Ribuan bernilai 1000, ratusan 100, puluhan 10.',
    visual: emptyVisual('1000'),
    options,
    correctIndex,
    explanation: `${thousands * 1000} + ${hundreds * 100} + ${tens * 10} = ${answer}.`,
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

function genPattern(level: MathLevel): MathQuestion {
  const step = randInt(level === 'ringan' ? 2 : 3, level === 'menantang' ? 10 : 6);
  const start = randInt(1, 20);
  const answer = start + step * 3;
  const { options, correctIndex } = buildNumberOptions(answer, [answer + step, answer - step, answer + 1]);
  return {
    id: nextId('pattern'),
    topic: 'pattern',
    level,
    prompt: `${start}, ${start + step}, ${start + step * 2}, ...`,
    hint: `Polanya bertambah ${step}.`,
    visual: emptyVisual('pola'),
    options,
    correctIndex,
    explanation: `Setiap langkah tambah ${step}, jadi berikutnya ${answer}.`,
  };
}

function genFractionBasic(level: MathLevel, profile: MathProfile = 'general'): MathQuestion {
  if (profile === 'flight12') {
    const whole = pick([8, 12, 16]);
    const part = pick([2, 4]);
    const answer = whole / part;
    const label = part === 2 ? 'setengah' : 'seperempat';
    const { options, correctIndex } = buildNumberOptions(answer, [answer + 1, Math.max(1, answer - 1), part]);
    return {
      id: nextId('fractionBasic'),
      topic: 'fractionBasic',
      level,
      prompt: `${label} dari ${whole} adalah ...`,
      hint: `${label} berarti dibagi ${part}.`,
      visual: emptyVisual('/'),
      options,
      correctIndex,
      explanation: `${whole} : ${part} = ${answer}.`,
    };
  }

  const den = pick([2, 3, 4, 5, 6, 8, 10]);
  const num = randInt(1, den - 1);
  const whole = den * randInt(2, level === 'menantang' ? 8 : 5);
  const answer = (whole / den) * num;
  const { options, correctIndex } = buildNumberOptions(answer, [answer + num, Math.max(1, answer - num), whole - answer]);
  return {
    id: nextId('fractionBasic'),
    topic: 'fractionBasic',
    level,
    prompt: `${num}/${den} dari ${whole} = ?`,
    hint: `Bagi ${whole} menjadi ${den} bagian, lalu ambil ${num} bagian.`,
    visual: { kind: 'bars', fractions: [{ num, den }], operator: '/' },
    options,
    correctIndex,
    explanation: `${whole} : ${den} x ${num} = ${answer}.`,
  };
}

function genMeasurement(level: MathLevel, profile: MathProfile = 'general'): MathQuestion {
  if (profile === 'flight12') {
    const a = randInt(2, 9);
    const b = randInt(a + 1, a + 8);
    const answer = b - a;
    const { options, correctIndex } = buildNumberOptions(answer, [answer + 1, Math.max(1, answer - 1), b + a]);
    return {
      id: nextId('measurement'),
      topic: 'measurement',
      level,
      prompt: `Pensil ${b} cm dan krayon ${a} cm. Selisihnya?`,
      hint: 'Selisih berarti yang panjang dikurangi yang pendek.',
      visual: emptyVisual('cm'),
      options,
      correctIndex,
      explanation: `${b} - ${a} = ${answer} cm.`,
    };
  }

  const m = randInt(1, level === 'menantang' ? 9 : 5);
  const answer = m * 100;
  const { options, correctIndex } = buildNumberOptions(answer, [answer + 10, Math.max(10, answer - 10), m * 10]);
  return {
    id: nextId('measurement'),
    topic: 'measurement',
    level,
    prompt: `${m} meter = ... cm`,
    hint: '1 meter = 100 cm.',
    visual: emptyVisual('cm'),
    options,
    correctIndex,
    explanation: `${m} x 100 = ${answer} cm.`,
  };
}

function genGeometry(level: MathLevel, profile: MathProfile = 'general'): MathQuestion {
  if (profile === 'flight12') {
    const sides = pick([
      { name: 'segitiga', count: 3 },
      { name: 'persegi', count: 4 },
      { name: 'persegi panjang', count: 4 },
    ]);
    const { options, correctIndex } = buildNumberOptions(sides.count, [sides.count + 1, Math.max(1, sides.count - 1), 6]);
    return {
      id: nextId('geometry'),
      topic: 'geometry',
      level,
      prompt: `Berapa sisi ${sides.name}?`,
      hint: 'Hitung garis tepi bangunnya.',
      visual: emptyVisual('bentuk'),
      options,
      correctIndex,
      explanation: `${sides.name} memiliki ${sides.count} sisi.`,
    };
  }

  const length = randInt(4, level === 'menantang' ? 16 : 10);
  const width = randInt(3, level === 'menantang' ? 12 : 8);
  const area = length * width;
  const { options, correctIndex } = buildNumberOptions(area, [2 * (length + width), area + length, Math.max(1, area - width)]);
  return {
    id: nextId('geometry'),
    topic: 'geometry',
    level,
    prompt: `Luas persegi panjang ${length} x ${width} = ?`,
    hint: 'Luas persegi panjang = panjang x lebar.',
    visual: emptyVisual('luas'),
    options,
    correctIndex,
    explanation: `${length} x ${width} = ${area}.`,
  };
}

function genData(level: MathLevel, profile: MathProfile = 'general'): MathQuestion {
  const a = randInt(profile === 'flight12' ? 2 : 8, profile === 'flight12' ? 12 : 40);
  const b = randInt(profile === 'flight12' ? 2 : 8, profile === 'flight12' ? 12 : 40);
  const answer = Math.max(a, b);
  const { options, correctIndex } = buildNumberOptions(answer, [Math.min(a, b), a + b, Math.abs(a - b)]);
  return {
    id: nextId('data'),
    topic: 'data',
    level,
    prompt: `Data gambar: apel ${a}, jeruk ${b}. Yang lebih banyak jumlahnya?`,
    hint: 'Bandingkan dua angka pada data.',
    visual: emptyVisual('data'),
    options,
    correctIndex,
    explanation: `${answer} adalah jumlah yang lebih banyak.`,
  };
}

const TOPICS_BY_PROFILE_LEVEL: Record<MathProfile, Record<MathLevel, MathTopic[]>> = {
  flight12: {
    ringan: ['counting', 'addition', 'subtraction', 'geometry'],
    sedang: ['addition', 'subtraction', 'placeValue', 'pattern', 'measurement'],
    menantang: ['addition', 'subtraction', 'placeValue', 'fractionBasic', 'data'],
  },
  frog34: {
    ringan: ['addition', 'subtraction', 'multiplication', 'division'],
    sedang: ['addition', 'subtraction', 'multiplication', 'division', 'placeValue', 'measurement'],
    menantang: ['multiplication', 'division', 'fractionBasic', 'pattern', 'geometry', 'data', 'mixed'],
  },
  general: {
    ringan: ['addition', 'subtraction', 'multiplication', 'division'],
    sedang: ['addition', 'subtraction', 'multiplication', 'division', 'mixed'],
    menantang: ['addition', 'subtraction', 'multiplication', 'division', 'mixed'],
  },
};

function generateOne(level: MathLevel, topic?: MathTopic, profile: MathProfile = 'general'): MathQuestion {
  const chosen = topic ?? pick(TOPICS_BY_PROFILE_LEVEL[profile][level]);
  switch (chosen) {
    case 'counting':
      return genCounting(level);
    case 'addition':
      return genAddition(level, profile);
    case 'subtraction':
      return genSubtraction(level, profile);
    case 'placeValue':
      return genPlaceValue(level, profile);
    case 'multiplication':
      return genMultiplication(level);
    case 'division':
      return genDivision(level);
    case 'mixed':
      return genMixed(level);
    case 'pattern':
      return genPattern(level);
    case 'fractionBasic':
      return genFractionBasic(level, profile);
    case 'measurement':
      return genMeasurement(level, profile);
    case 'geometry':
      return genGeometry(level, profile);
    case 'data':
      return genData(level, profile);
    default:
      return genAddition(level, profile);
  }
}

const MATH_KEY_PREFIX = 'brightoria.mathAdaptive.v3';

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

export function loadMathProgress(profile: MathProfile = 'general'): MathProgress {
  try {
    const raw = localStorage.getItem(`${MATH_KEY_PREFIX}.${profile}`);
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

function saveMathProgress(progress: MathProgress, profile: MathProfile): void {
  try {
    localStorage.setItem(`${MATH_KEY_PREFIX}.${profile}`, JSON.stringify(progress));
  } catch {
    /* Diamkan. */
  }
}

const LEVEL_ORDER: MathLevel[] = ['ringan', 'sedang', 'menantang'];

export function recordMathAnswer(
  question: MathQuestion,
  chosenIndex: number,
  profile: MathProfile = 'general',
): { progress: MathProgress; levelChanged: 'up' | 'down' | null } {
  const progress = loadMathProgress(profile);
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

  saveMathProgress(progress, profile);
  return { progress, levelChanged };
}

export function generateMathSet(count: number, level?: MathLevel, profile: MathProfile = 'general'): MathQuestion[] {
  const activeLevel = level ?? loadMathProgress(profile).level;
  const rotation = shuffle([...TOPICS_BY_PROFILE_LEVEL[profile][activeLevel]]);
  return Array.from({ length: count }).map((_, i) =>
    generateOne(activeLevel, rotation[i % rotation.length], profile),
  );
}

export function generateMathQuestion(level?: MathLevel, profile: MathProfile = 'general'): MathQuestion {
  return generateOne(level ?? loadMathProgress(profile).level, undefined, profile);
}

export const LEVEL_LABEL: Record<MathProfile, Record<MathLevel, string>> = {
  flight12: {
    ringan: 'Kelas 1',
    sedang: 'Kelas 1-2',
    menantang: 'Kelas 2',
  },
  frog34: {
    ringan: 'Kelas 3',
    sedang: 'Kelas 3-4',
    menantang: 'Kelas 4',
  },
  general: {
    ringan: 'Ringan',
    sedang: 'Sedang',
    menantang: 'Menantang',
  },
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
