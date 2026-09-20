/**
 * mathGenerator.ts — Penghasil soal pecahan prosedural (Patch 48).
 *
 * ====================================================================
 * KENAPA BERKAS INI MANDIRI PENUH
 * ====================================================================
 * Berkas ini TIDAK mengimpor apa pun dari folder permainan. Tidak ada
 * React, tidak ada Three.js, tidak ada evidence dunia.
 *
 * Alasannya: generator ini dirancang untuk dipakai DUA TEMPAT —
 *
 *   1. Penerbangan Ilmu (mode arkade)  -> latihan kelancaran
 *   2. Pulau Numeria (jembatan pecahan) -> latihan pemahaman konsep
 *
 * Dengan menjaganya bebas ketergantungan, menambahkannya ke Numeria
 * nanti tidak akan pernah bisa merusak apa pun. Cukup impor, panggil,
 * pakai.
 *
 * ====================================================================
 * KENAPA MATEMATIKA BISA DIHASILKAN, MATA PELAJARAN LAIN TIDAK
 * ====================================================================
 * Soal `3/4 + 1/4 = 1` kebenarannya OBJEKTIF — tidak perlu menunggu
 * pengesahan tim akademik. Bandingkan dengan kosakata Arab yang butuh
 * validasi transliterasi, atau Benteng Digital yang berisi penilaian
 * situasional.
 *
 * Artinya Pulau Numeria bisa dibawa dari 5 level ke KEDALAMAN TAK
 * TERBATAS tanpa memblokir siapa pun. Inilah satu-satunya mata
 * pelajaran di Brightoria yang punya sifat ini.
 *
 * ====================================================================
 * PENGECOH YANG BERSIFAT DIAGNOSTIK
 * ====================================================================
 * Pilihan salah di sini BUKAN angka acak. Tiap pengecoh dirancang
 * mewakili kesalahan pemahaman yang nyata dan umum:
 *
 *   1/2 + 1/4 = 2/6   <- menjumlahkan penyebut juga (kesalahan paling
 *                         sering pada anak yang baru belajar pecahan)
 *   1/2 = 1/4         <- lupa mengalikan pembilang saat menyamakan
 *   4/8 = 2/4         <- menyederhanakan setengah jalan
 *
 * Karena pengecohnya bermakna, pilihan anak menjadi DATA. Kalau ia
 * berulang kali memilih "2/6", kita tahu persis apa yang belum ia
 * pahami — bukan sekadar tahu bahwa ia salah.
 * ====================================================================
 */

// ---------------------------------------------------------------------------
// TIPE DASAR
// ---------------------------------------------------------------------------

export interface Fraction {
  num: number;
  den: number;
}

export type MathTopic =
  | 'equivalent' // 1/2 = ?/4
  | 'compare' // mana yang lebih besar?
  | 'addSame' // 1/4 + 2/4
  | 'addDiff' // 1/2 + 1/4
  | 'simplify' // 4/8 -> 1/2
  | 'partOfWhole'; // berapa bagian yang diwarnai?

export type MathLevel = 'ringan' | 'sedang' | 'menantang';

/** Bentuk tampilan visual yang menyertai soal. */
export interface MathVisual {
  kind: 'bars' | 'single';
  /** Pecahan yang digambarkan sebagai batang. */
  fractions: Fraction[];
  /** Tanda di antara batang, mis. '+' atau 'vs'. */
  operator?: string;
}

export interface MathQuestion {
  id: string;
  topic: MathTopic;
  level: MathLevel;
  /** Kalimat soal yang dibaca anak. */
  prompt: string;
  /** Keterangan kecil di bawah soal. */
  hint: string;
  /** Gambaran visual — penting untuk anak yang belum abstrak. */
  visual: MathVisual;
  /** Tiga pilihan jawaban, urutan sudah diacak. */
  options: string[];
  correctIndex: number;
  /** Penjelasan singkat, ditampilkan setelah menjawab. */
  explanation: string;
}

// ---------------------------------------------------------------------------
// UTILITAS PECAHAN
// ---------------------------------------------------------------------------

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

function simplify(f: Fraction): Fraction {
  const g = gcd(f.num, f.den);
  return { num: f.num / g, den: f.den / g };
}

/** Mengubah pecahan jadi teks. Menampilkan "1" bila bernilai satu utuh. */
function toText(f: Fraction): string {
  if (f.den === 1) return String(f.num);
  if (f.num === f.den) return '1';
  return `${f.num}/${f.den}`;
}

function toValue(f: Fraction): number {
  return f.num / f.den;
}

function sameValue(a: Fraction, b: Fraction): boolean {
  return a.num * b.den === b.num * a.den;
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

/**
 * Menyusun tiga pilihan dari satu jawaban benar dan beberapa calon
 * pengecoh.
 *
 * Pengecoh yang kebetulan bernilai sama dengan jawaban benar dibuang —
 * kalau tidak, akan ada dua gerbang yang sama-sama benar dan anak
 * dihukum karena memilih yang "salah".
 */
function buildOptions(
  correct: Fraction,
  candidates: Fraction[],
): { options: string[]; correctIndex: number } {
  const correctText = toText(correct);
  const seen = new Set<string>([correctText]);
  const distractors: string[] = [];

  for (const candidate of candidates) {
    if (distractors.length >= 2) break;
    if (candidate.den === 0) continue;
    if (candidate.num <= 0) continue;
    if (sameValue(candidate, correct)) continue;

    const text = toText(candidate);
    if (seen.has(text)) continue;
    seen.add(text);
    distractors.push(text);
  }

  // Jaring pengaman: bila pengecoh yang dirancang habis (jarang, tapi
  // mungkin pada pecahan kecil), isi dengan variasi sederhana.
  let guard = 1;
  while (distractors.length < 2 && guard < 12) {
    const fallback: Fraction = { num: correct.num + guard, den: correct.den };
    const text = toText(fallback);
    if (!seen.has(text) && fallback.num > 0) {
      seen.add(text);
      distractors.push(text);
    }
    guard += 1;
  }

  const options = shuffle([correctText, ...distractors]);
  return { options, correctIndex: options.indexOf(correctText) };
}

let questionCounter = 0;
function nextId(topic: MathTopic): string {
  questionCounter += 1;
  return `${topic}-${questionCounter}`;
}

// ---------------------------------------------------------------------------
// PENGHASIL PER TOPIK
// ---------------------------------------------------------------------------

/**
 * Pecahan senilai: 1/2 = ?/4
 *
 * Pengecoh utamanya adalah MENJUMLAH alih-alih MENGALIKAN pembilang —
 * anak yang melihat penyebut naik dari 2 ke 4 (bertambah 2) sering
 * menyimpulkan pembilang juga bertambah 2.
 */
function genEquivalent(level: MathLevel): MathQuestion {
  const bases: Record<MathLevel, Fraction[]> = {
    ringan: [
      { num: 1, den: 2 },
      { num: 1, den: 3 },
      { num: 1, den: 4 },
      { num: 2, den: 3 },
    ],
    sedang: [
      { num: 1, den: 2 },
      { num: 2, den: 3 },
      { num: 3, den: 4 },
      { num: 2, den: 5 },
      { num: 3, den: 5 },
    ],
    menantang: [
      { num: 2, den: 3 },
      { num: 3, den: 4 },
      { num: 3, den: 8 },
      { num: 4, den: 5 },
      { num: 5, den: 6 },
    ],
  };

  const multipliers: Record<MathLevel, number[]> = {
    ringan: [2, 3],
    sedang: [2, 3, 4],
    menantang: [3, 4, 5],
  };

  const base = pick(bases[level]);
  const mult = pick(multipliers[level]);
  const answer: Fraction = { num: base.num * mult, den: base.den * mult };

  const distractors: Fraction[] = [
    // Menjumlah, bukan mengalikan — kesalahan paling khas.
    { num: base.num + mult, den: answer.den },
    // Lupa menyesuaikan pembilang sama sekali.
    { num: base.num, den: answer.den },
    // Meleset satu langkah.
    { num: answer.num + 1, den: answer.den },
    { num: Math.max(1, answer.num - 1), den: answer.den },
  ];

  const { options, correctIndex } = buildOptions(answer, distractors);

  return {
    id: nextId('equivalent'),
    topic: 'equivalent',
    level,
    prompt: `${toText(base)} sama dengan berapa per ${answer.den}?`,
    hint: 'Pecahan senilai',
    visual: { kind: 'single', fractions: [base] },
    options,
    correctIndex,
    explanation: `${toText(base)} dikali ${mult} di atas dan di bawah menjadi ${toText(answer)}.`,
  };
}

/**
 * Membandingkan dua pecahan.
 *
 * Tingkat ringan memakai penyebut sama atau pembilang sama, karena
 * keduanya bisa dinilai tanpa perhitungan — cukup melihat.
 */
function genCompare(level: MathLevel): MathQuestion {
  let a: Fraction;
  let b: Fraction;

  if (level === 'ringan') {
    if (Math.random() < 0.5) {
      // Penyebut sama: bandingkan pembilang.
      const den = pick([3, 4, 5, 6]);
      const x = randInt(1, den - 1);
      let y = randInt(1, den - 1);
      while (y === x) y = randInt(1, den - 1);
      a = { num: x, den };
      b = { num: y, den };
    } else {
      // Pembilang sama: penyebut lebih besar berarti potongan lebih kecil.
      const num = 1;
      const d1 = pick([2, 3, 4]);
      let d2 = pick([2, 3, 4, 6]);
      while (d2 === d1) d2 = pick([2, 3, 4, 6]);
      a = { num, den: d1 };
      b = { num, den: d2 };
    }
  } else if (level === 'sedang') {
    const pairs: [Fraction, Fraction][] = [
      [{ num: 2, den: 3 }, { num: 3, den: 4 }],
      [{ num: 1, den: 2 }, { num: 2, den: 5 }],
      [{ num: 3, den: 5 }, { num: 2, den: 3 }],
      [{ num: 5, den: 8 }, { num: 1, den: 2 }],
      [{ num: 3, den: 4 }, { num: 5, den: 6 }],
    ];
    [a, b] = pick(pairs);
  } else {
    const pairs: [Fraction, Fraction][] = [
      [{ num: 5, den: 8 }, { num: 7, den: 12 }],
      [{ num: 4, den: 7 }, { num: 5, den: 9 }],
      [{ num: 7, den: 10 }, { num: 2, den: 3 }],
      [{ num: 5, den: 6 }, { num: 8, den: 9 }],
    ];
    [a, b] = pick(pairs);
  }

  const aBigger = toValue(a) > toValue(b);
  const larger = aBigger ? a : b;
  const smaller = aBigger ? b : a;

  // Untuk topik ini pilihannya adalah dua pecahan itu sendiri, plus
  // pilihan "sama besar" yang menguji apakah anak benar-benar
  // membandingkan atau sekadar menebak.
  const options = shuffle([toText(a), toText(b), 'Sama besar']);

  return {
    id: nextId('compare'),
    topic: 'compare',
    level,
    prompt: 'Mana yang lebih besar?',
    hint: `${toText(a)} atau ${toText(b)}`,
    visual: { kind: 'bars', fractions: [a, b], operator: 'vs' },
    options,
    correctIndex: options.indexOf(toText(larger)),
    explanation: `${toText(larger)} lebih besar daripada ${toText(smaller)}.`,
  };
}

/**
 * Penjumlahan berpenyebut sama.
 *
 * Pengecoh terpentingnya: menjumlahkan penyebut juga. Ini kesalahan
 * yang paling sering muncul dan paling perlu dilatih.
 */
function genAddSame(level: MathLevel): MathQuestion {
  const dens: Record<MathLevel, number[]> = {
    ringan: [3, 4, 5, 6],
    sedang: [5, 6, 8, 10],
    menantang: [6, 8, 9, 10, 12],
  };

  const den = pick(dens[level]);
  const a = randInt(1, den - 2);
  // Tingkat ringan dan sedang dijaga agar hasilnya tidak melebihi satu
  // utuh — pecahan lebih dari 1 butuh pemahaman tambahan.
  const maxB = level === 'menantang' ? den - 1 : den - a;
  const b = randInt(1, Math.max(1, maxB));

  const rawSum: Fraction = { num: a + b, den };
  const answer = simplify(rawSum);

  const distractors: Fraction[] = [
    // Menjumlahkan penyebut juga — kesalahan paling khas.
    { num: a + b, den: den + den },
    // Mengalikan pembilang.
    { num: a * b, den },
    // Hasil mentah tanpa disederhanakan (hanya jadi pengecoh bila
    // memang berbeda dari jawaban).
    rawSum,
    { num: a + b + 1, den },
  ];

  const { options, correctIndex } = buildOptions(answer, distractors);

  return {
    id: nextId('addSame'),
    topic: 'addSame',
    level,
    prompt: `${a}/${den} + ${b}/${den} = ?`,
    hint: 'Penyebutnya sudah sama',
    visual: {
      kind: 'bars',
      fractions: [
        { num: a, den },
        { num: b, den },
      ],
      operator: '+',
    },
    options,
    correctIndex,
    explanation: `Penyebutnya sama, jadi tinggal jumlahkan atasnya: ${a} + ${b} = ${a + b}, hasilnya ${toText(answer)}.`,
  };
}

/**
 * Penjumlahan berpenyebut berbeda.
 *
 * Tingkat ringan sengaja memilih pasangan yang satu penyebutnya
 * kelipatan penyebut lain (1/2 + 1/4), sehingga anak cukup mengubah
 * satu pecahan saja.
 */
function genAddDiff(level: MathLevel): MathQuestion {
  let a: Fraction;
  let b: Fraction;

  if (level === 'ringan') {
    const pairs: [Fraction, Fraction][] = [
      [{ num: 1, den: 2 }, { num: 1, den: 4 }],
      [{ num: 1, den: 2 }, { num: 1, den: 6 }],
      [{ num: 1, den: 3 }, { num: 1, den: 6 }],
      [{ num: 1, den: 4 }, { num: 1, den: 8 }],
    ];
    [a, b] = pick(pairs);
  } else if (level === 'sedang') {
    const pairs: [Fraction, Fraction][] = [
      [{ num: 1, den: 2 }, { num: 1, den: 3 }],
      [{ num: 1, den: 3 }, { num: 1, den: 4 }],
      [{ num: 2, den: 3 }, { num: 1, den: 6 }],
      [{ num: 1, den: 4 }, { num: 2, den: 5 }],
    ];
    [a, b] = pick(pairs);
  } else {
    const pairs: [Fraction, Fraction][] = [
      [{ num: 2, den: 3 }, { num: 3, den: 4 }],
      [{ num: 3, den: 5 }, { num: 1, den: 2 }],
      [{ num: 2, den: 5 }, { num: 3, den: 4 }],
      [{ num: 5, den: 6 }, { num: 2, den: 3 }],
    ];
    [a, b] = pick(pairs);
  }

  const common = (a.den * b.den) / gcd(a.den, b.den);
  const rawSum: Fraction = {
    num: a.num * (common / a.den) + b.num * (common / b.den),
    den: common,
  };
  const answer = simplify(rawSum);

  const distractors: Fraction[] = [
    // Menjumlahkan atas dan bawah begitu saja — kesalahan paling khas.
    { num: a.num + b.num, den: a.den + b.den },
    // Menjumlahkan pembilang tanpa menyamakan penyebut.
    { num: a.num + b.num, den: Math.max(a.den, b.den) },
    rawSum,
    { num: answer.num + 1, den: answer.den },
  ];

  const { options, correctIndex } = buildOptions(answer, distractors);

  return {
    id: nextId('addDiff'),
    topic: 'addDiff',
    level,
    prompt: `${toText(a)} + ${toText(b)} = ?`,
    hint: 'Samakan penyebutnya dulu',
    visual: { kind: 'bars', fractions: [a, b], operator: '+' },
    options,
    correctIndex,
    explanation: `Samakan penyebut jadi ${common}, lalu jumlahkan. Hasilnya ${toText(answer)}.`,
  };
}

/**
 * Menyederhanakan pecahan.
 *
 * Pengecoh terpentingnya: menyederhanakan setengah jalan (4/8 jadi
 * 2/4, bukan 1/2). Anak yang melakukan ini sudah paham caranya, hanya
 * belum tuntas.
 */
function genSimplify(level: MathLevel): MathQuestion {
  const targets: Record<MathLevel, Fraction[]> = {
    ringan: [
      { num: 1, den: 2 },
      { num: 1, den: 3 },
      { num: 2, den: 3 },
      { num: 1, den: 4 },
    ],
    sedang: [
      { num: 3, den: 4 },
      { num: 2, den: 5 },
      { num: 3, den: 5 },
      { num: 5, den: 6 },
    ],
    menantang: [
      { num: 2, den: 3 },
      { num: 3, den: 8 },
      { num: 4, den: 7 },
      { num: 5, den: 9 },
    ],
  };

  const multipliers: Record<MathLevel, number[]> = {
    ringan: [2, 3],
    sedang: [3, 4],
    menantang: [4, 5, 6],
  };

  const answer = pick(targets[level]);
  const mult = pick(multipliers[level]);
  const shown: Fraction = { num: answer.num * mult, den: answer.den * mult };

  const distractors: Fraction[] = [];
  // Menyederhanakan setengah jalan (hanya mungkin bila pengali genap).
  if (mult % 2 === 0) {
    distractors.push({ num: shown.num / 2, den: shown.den / 2 });
  }
  distractors.push(
    // Mengurangi, bukan membagi.
    { num: Math.max(1, shown.num - mult), den: shown.den - mult },
    { num: answer.num + 1, den: answer.den },
    { num: answer.den, den: answer.num }, // terbalik
  );

  const { options, correctIndex } = buildOptions(answer, distractors);

  return {
    id: nextId('simplify'),
    topic: 'simplify',
    level,
    prompt: `Sederhanakan ${toText(shown)}`,
    hint: 'Bagi atas dan bawah dengan angka yang sama',
    visual: { kind: 'single', fractions: [shown] },
    options,
    correctIndex,
    explanation: `${toText(shown)} dibagi ${mult} di atas dan di bawah menjadi ${toText(answer)}.`,
  };
}

/**
 * Membaca pecahan dari gambar.
 *
 * Topik paling konkret: anak cukup menghitung bagian yang diwarnai.
 * Berguna sebagai jangkar bagi anak yang mulai kewalahan oleh simbol.
 */
function genPartOfWhole(level: MathLevel): MathQuestion {
  const dens: Record<MathLevel, number[]> = {
    ringan: [2, 3, 4],
    sedang: [4, 5, 6, 8],
    menantang: [6, 8, 9, 10],
  };

  const den = pick(dens[level]);
  const num = randInt(1, den - 1);
  const shown: Fraction = { num, den };
  const answer = shown; // sengaja tidak disederhanakan: yang diuji membaca gambar

  const distractors: Fraction[] = [
    // Menghitung bagian yang TIDAK diwarnai.
    { num: den - num, den },
    // Membandingkan bagian diwarnai dengan yang tidak, bukan dengan keseluruhan.
    { num, den: Math.max(1, den - num) },
    { num: num + 1, den },
  ];

  const { options, correctIndex } = buildOptions(answer, distractors);

  return {
    id: nextId('partOfWhole'),
    topic: 'partOfWhole',
    level,
    prompt: 'Berapa bagian yang berwarna?',
    hint: `Dibagi ${den} bagian sama besar`,
    visual: { kind: 'single', fractions: [shown] },
    options,
    correctIndex,
    explanation: `Ada ${num} bagian berwarna dari ${den} bagian, jadi ${toText(shown)}.`,
  };
}

// ---------------------------------------------------------------------------
// PEMILIH TOPIK
// ---------------------------------------------------------------------------

/**
 * Topik yang tersedia per tingkat.
 *
 * Tingkat ringan sengaja TIDAK memuat penjumlahan berpenyebut berbeda —
 * itu langkah besar yang sebaiknya menunggu sampai penjumlahan
 * berpenyebut sama sudah lancar.
 */
const TOPICS_BY_LEVEL: Record<MathLevel, MathTopic[]> = {
  ringan: ['partOfWhole', 'equivalent', 'compare', 'addSame'],
  sedang: ['equivalent', 'compare', 'addSame', 'addDiff', 'simplify'],
  menantang: ['compare', 'addSame', 'addDiff', 'simplify', 'equivalent'],
};

function generateOne(level: MathLevel, topic?: MathTopic): MathQuestion {
  const chosen = topic ?? pick(TOPICS_BY_LEVEL[level]);
  switch (chosen) {
    case 'equivalent':
      return genEquivalent(level);
    case 'compare':
      return genCompare(level);
    case 'addSame':
      return genAddSame(level);
    case 'addDiff':
      return genAddDiff(level);
    case 'simplify':
      return genSimplify(level);
    case 'partOfWhole':
      return genPartOfWhole(level);
    default:
      return genAddSame(level);
  }
}

// ---------------------------------------------------------------------------
// TINGKAT KESULITAN ADAPTIF
// ---------------------------------------------------------------------------

const MATH_KEY = 'brightoria.mathAdaptive.v1';

export interface MathProgress {
  level: MathLevel;
  /** Lima jawaban terakhir, true berarti benar. */
  recent: boolean[];
  totalAnswered: number;
  totalCorrect: number;
  /**
   * Catatan kesalahan pemahaman.
   * Kunci berbentuk "jawabanBenar|yangDipilih", nilainya berapa kali
   * terjadi. Inilah yang memungkinkan sistem tahu BAGAIMANA anak salah,
   * bukan sekadar bahwa ia salah.
   */
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
    // Diamkan — kegagalan menyimpan tidak boleh menghentikan permainan.
  }
}

const LEVEL_ORDER: MathLevel[] = ['ringan', 'sedang', 'menantang'];

/**
 * Mencatat satu jawaban dan menyesuaikan tingkat kesulitan.
 *
 * Aturannya sederhana dan sengaja begitu:
 *   dari 5 jawaban terakhir, benar >= 4  -> naik satu tingkat
 *                            benar <= 2  -> turun satu tingkat
 *
 * Jendela lima dipilih karena cukup panjang untuk meredam keberuntungan
 * satu-dua soal, tapi cukup pendek untuk terasa responsif bagi anak.
 *
 * Setelah tingkat berubah, catatan direset. Kalau tidak, jawaban lama
 * dari tingkat sebelumnya akan ikut menilai tingkat yang baru — dan
 * anak bisa terlempar naik-turun berulang kali.
 */
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

// ---------------------------------------------------------------------------
// API UTAMA
// ---------------------------------------------------------------------------

/**
 * Menghasilkan sekumpulan soal pada tingkat yang sedang berlaku.
 *
 * Topik diputar bergiliran, bukan diacak murni. Pengacakan murni
 * sering menghasilkan tiga soal sejenis berturut-turut, yang membuat
 * latihan terasa monoton — dan secara pedagogi, mencampur topik
 * terbukti lebih baik untuk ingatan jangka panjang daripada
 * mengelompokkannya.
 */
export function generateMathSet(count: number, level?: MathLevel): MathQuestion[] {
  const activeLevel = level ?? loadMathProgress().level;
  const topics = TOPICS_BY_LEVEL[activeLevel];
  const rotation = shuffle([...topics]);

  return Array.from({ length: count }).map((_, i) =>
    generateOne(activeLevel, rotation[i % rotation.length]),
  );
}

/** Satu soal tunggal — dipakai bila pemanggil ingin mengalir terus. */
export function generateMathQuestion(level?: MathLevel): MathQuestion {
  const activeLevel = level ?? loadMathProgress().level;
  return generateOne(activeLevel);
}

/** Label tingkat yang ramah dibaca anak maupun orang tua. */
export const LEVEL_LABEL: Record<MathLevel, string> = {
  ringan: 'Ringan',
  sedang: 'Sedang',
  menantang: 'Menantang',
};

/**
 * Merangkum kesalahan pemahaman yang paling sering terjadi.
 * Dipakai panel orang tua untuk menjelaskan POLA kesalahan, bukan
 * sekadar persentase benar.
 */
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
