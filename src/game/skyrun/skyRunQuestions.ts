/**
 * skyRunQuestions.ts — Penyusun soal untuk Penerbangan Ilmu (Patch 48).
 *
 * ====================================================================
 * PERUBAHAN PATCH 48: SATU MESIN, DUA MATERI
 * ====================================================================
 * Patch 47 hanya melayani kosakata. Sekarang berkas ini menjadi
 * ADAPTER: ia menyatukan dua sumber materi yang sangat berbeda ke satu
 * bentuk yang sama, sehingga scene 3D tidak perlu tahu asal soalnya.
 *
 *   KATA   -> reviewDeck.ts   : kosakata yang sudah dikuasai anak
 *   ANGKA  -> mathGenerator.ts : operasi hitung yang dihasilkan prosedural
 *
 * Keuntungan pemisahan ini: menambah jenis materi ketiga nanti cukup
 * dengan menambah satu fungsi di berkas ini. SkyRunGame.tsx sama
 * sekali tidak perlu disentuh.
 *
 * ====================================================================
 * PERBEDAAN MENDASAR KEDUA SUMBER
 * ====================================================================
 *   KATA  : terbatas. Hanya kata yang SUDAH dikuasai anak yang muncul,
 *           jadi jumlahnya bergantung seberapa jauh ia bermain.
 *
 *   ANGKA : tak terbatas. Dihasilkan on the fly, dengan tingkat
 *           kesulitan yang menyesuaikan diri. Tidak pernah habis.
 *
 * Perbedaan itulah alasan mode Angka penting: ia menyelesaikan masalah
 * "konten habis dalam lima menit" yang tidak bisa diselesaikan dengan
 * menulis soal satu per satu.
 * ====================================================================
 */

import { lookupEntry, WORLD_LABELS, type DeckEntry, type DeckWorldId } from '../reviewDeck';
import {
  generateMathSet,
  loadMathProgress,
  LEVEL_LABEL,
  type MathProfile,
  type MathQuestion,
  type MathVisual,
} from '../math/mathGenerator';

/** Kunci evidence dunia yang menyimpan daftar kata terkumpul. */
const COLLECTION_SOURCES: { key: string; world: DeckWorldId }[] = [
  { key: 'brightoria.evidence.hijaiyah.v1', world: 'quran' },
  { key: 'brightoria.evidence.arabicOasis.v2', world: 'arabic' },
  { key: 'brightoria.evidence.englishHarbor.v1', world: 'english' },
];

/** Jumlah soal per penerbangan. Sengaja pendek agar satu sesi terasa
 *  tuntas dan tidak melelahkan. */
export const FLIGHT_LENGTH = 8;

/** Jumlah pilihan jawaban. Tiga = satu gerbang per jalur. */
export const LANE_COUNT = 3;

export type SkyTopic = 'kata' | 'angka';

/**
 * Bentuk soal yang dipahami scene 3D.
 *
 * Sengaja dibuat datar (tanpa union type bercabang) supaya komponen
 * penampil tidak perlu memeriksa jenis soal di banyak tempat. Medan
 * yang hanya relevan bagi satu jenis dibuat opsional.
 */
export interface SkyQuestion {
  id: string;
  topic: SkyTopic;
  /** Teks utama yang dibaca anak. */
  prompt: string;
  /** Keterangan kecil di bawah teks utama. */
  hint: string;
  /** Kalimat perintah, mis. "Apa artinya?" */
  ask: string;
  /** Tiga pilihan, urutan sudah diacak. */
  options: string[];
  correctIndex: number;
  /** Benar bila teks utama memakai aksara Arab. */
  promptIsArabic: boolean;
  /** Benar bila pilihan memakai aksara Arab. */
  optionsAreArabic: boolean;
  /** Emoji pendamping. Kosong untuk soal angka. */
  emoji: string;
  /** Label kecil: nama dunia, atau tingkat kesulitan. */
  label: string;
  accent: string;
  /** Gambaran visual — hanya untuk soal angka. */
  visual?: MathVisual;
  /** Penjelasan singkat setelah menjawab — hanya untuk soal angka. */
  explanation?: string;
  /** Rujukan ke soal asli, dipakai mencatat jawaban ke mesin adaptif. */
  math?: MathQuestion;
  mathProfile?: MathProfile;
}

function safeReadJson(key: string): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/**
 * Mengumpulkan kata yang sudah dikuasai anak dari seluruh dunia.
 * ID yang tidak dikenal (mis. dialog Oasis) dilewati dengan aman.
 */
export function getMasteredEntries(): DeckEntry[] {
  const seen = new Set<string>();
  const result: DeckEntry[] = [];

  for (const source of COLLECTION_SOURCES) {
    const data = safeReadJson(source.key);
    if (!data || !Array.isArray(data.collectedWords)) continue;

    for (const raw of data.collectedWords as unknown[]) {
      if (typeof raw !== 'string') continue;
      if (seen.has(raw)) continue;
      const entry = lookupEntry(raw);
      if (!entry) continue;
      seen.add(raw);
      result.push(entry);
    }
  }

  return result;
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
 * Memilih pengecoh untuk soal kosakata.
 *
 * Diutamakan dari dunia yang sama agar pilihan terasa masuk akal —
 * membandingkan kata Arab dengan kata Inggris terlalu mudah ditebak
 * tanpa benar-benar tahu artinya.
 */
function pickDistractors(
  pool: DeckEntry[],
  target: DeckEntry,
  field: 'meaning' | 'display',
  count: number,
): string[] {
  const sameWorld = pool.filter(
    (e) => e.world === target.world && e.id !== target.id && e[field] !== target[field],
  );
  const otherWorld = pool.filter((e) => e.world !== target.world && e[field] !== target[field]);

  const candidates = [...shuffle(sameWorld), ...shuffle(otherWorld)];
  const picked: string[] = [];
  const used = new Set<string>([target[field]]);

  for (const candidate of candidates) {
    if (picked.length >= count) break;
    const value = candidate[field];
    if (used.has(value)) continue;
    used.add(value);
    picked.push(value);
  }

  return picked;
}

// ---------------------------------------------------------------------------
// MODE KATA
// ---------------------------------------------------------------------------

function buildWordFlight(): SkyQuestion[] {
  const pool = getMasteredEntries();
  if (pool.length < LANE_COUNT) return [];

  const chosen = shuffle(pool).slice(0, Math.min(FLIGHT_LENGTH, pool.length));

  return chosen.map((entry, index) => {
    // Arah soal diselang-seling: separuh menanyakan arti, separuh
    // menanyakan kata. Melatih dua arah ingatan sekaligus.
    const askMeaning = index % 2 === 0;
    const world = WORLD_LABELS[entry.world];
    const isLatin = entry.world === 'english';

    if (askMeaning) {
      const distractors = pickDistractors(pool, entry, 'meaning', LANE_COUNT - 1);
      const options = shuffle([entry.meaning, ...distractors]);
      return {
        id: `kata-${entry.id}-${index}`,
        topic: 'kata' as SkyTopic,
        prompt: entry.display,
        hint: `${entry.translit} · ${world.label}`,
        ask: 'Apa artinya?',
        options,
        correctIndex: options.indexOf(entry.meaning),
        promptIsArabic: !isLatin,
        optionsAreArabic: false,
        emoji: entry.emoji,
        label: world.label,
        accent: world.accent,
      };
    }

    const distractors = pickDistractors(pool, entry, 'display', LANE_COUNT - 1);
    const options = shuffle([entry.display, ...distractors]);
    return {
      id: `kata-${entry.id}-${index}`,
      topic: 'kata' as SkyTopic,
      prompt: entry.meaning,
      hint: world.label,
      ask: 'Mana kata yang tepat?',
      options,
      correctIndex: options.indexOf(entry.display),
      promptIsArabic: false,
      optionsAreArabic: !isLatin,
      emoji: entry.emoji,
      label: world.label,
      accent: world.accent,
    };
  });
}

// ---------------------------------------------------------------------------
// MODE ANGKA
// ---------------------------------------------------------------------------

/** Warna aksen per tingkat, agar anak mengenali kenaikan secara visual. */
const LEVEL_ACCENT: Record<string, string> = {
  ringan: '#3fbf7f',
  sedang: '#28a8e0',
  menantang: '#9a5ec9',
};

function buildMathFlight(profile: MathProfile): SkyQuestion[] {
  const questions = generateMathSet(FLIGHT_LENGTH, undefined, profile);

  return questions.map((q) => ({
    id: `angka-${q.id}`,
    topic: 'angka' as SkyTopic,
    prompt: q.prompt,
    hint: q.hint,
    ask: pickAsk(q),
    options: q.options,
    correctIndex: q.correctIndex,
    promptIsArabic: false,
    optionsAreArabic: false,
    emoji: '',
    label: LEVEL_LABEL[profile][q.level],
    accent: LEVEL_ACCENT[q.level] ?? '#28a8e0',
    visual: q.visual,
    explanation: q.explanation,
    math: q,
    mathProfile: profile,
  }));
}

/** Kalimat perintah disesuaikan jenis soalnya agar tidak monoton. */
function pickAsk(q: MathQuestion): string {
  switch (q.topic) {
    case 'addition':
      return 'Pilih hasil penjumlahan';
    case 'subtraction':
      return 'Pilih hasil pengurangan';
    case 'multiplication':
      return 'Pilih hasil perkalian';
    case 'division':
      return 'Pilih hasil pembagian';
    case 'mixed':
      return 'Kerjakan perkalian dulu';
    case 'counting':
      return 'Pilih bilangan yang tepat';
    case 'placeValue':
      return 'Pilih nilai bilangannya';
    case 'pattern':
      return 'Lanjutkan polanya';
    case 'fractionBasic':
      return 'Pilih nilai pecahannya';
    case 'measurement':
      return 'Pilih hasil pengukuran';
    case 'geometry':
      return 'Pilih jawaban bangun';
    case 'data':
      return 'Baca datanya';
    default:
      return 'Berapa hasilnya?';
  }
}

// ---------------------------------------------------------------------------
// API UTAMA
// ---------------------------------------------------------------------------

export interface FlightPlan {
  questions: SkyQuestion[];
  /** Untuk mode kata: jumlah kata dikuasai. Mode angka selalu -1
   *  karena soalnya tak terbatas. */
  poolSize: number;
  topic: SkyTopic;
  /** Label tingkat saat ini — hanya terisi untuk mode angka. */
  levelLabel?: string;
}

export function buildFlight(topic: SkyTopic, mathProfile: MathProfile = 'flight12'): FlightPlan {
  if (topic === 'angka') {
    const progress = loadMathProgress(mathProfile);
    return {
      questions: buildMathFlight(mathProfile),
      poolSize: -1,
      topic: 'angka',
      levelLabel: LEVEL_LABEL[mathProfile][progress.level],
    };
  }

  const questions = buildWordFlight();
  return {
    questions,
    poolSize: getMasteredEntries().length,
    topic: 'kata',
  };
}

/** Berapa kata yang sudah dikuasai — dipakai menonaktifkan mode Kata
 *  bila anak belum punya cukup materi. */
export function getWordPoolSize(): number {
  return getMasteredEntries().length;
}

// ---------------------------------------------------------------------------
// CATATAN SKOR TERBAIK
// ---------------------------------------------------------------------------

const BEST_KEY = 'brightoria.skyrun.v2';
const OLD_BEST_KEY = 'brightoria.skyrun.v1';

export interface SkyRunRecord {
  /** Rekor dipisah per topik: membandingkan skor kosakata dengan skor
   *  matematika tidak bermakna, karena soalnya berbeda jenis. */
  kata: { bestScore: number; bestStreak: number; flights: number };
  angka: { bestScore: number; bestStreak: number; flights: number };
}

const EMPTY_RECORD: SkyRunRecord = {
  kata: { bestScore: 0, bestStreak: 0, flights: 0 },
  angka: { bestScore: 0, bestStreak: 0, flights: 0 },
};

function readSlot(value: unknown): { bestScore: number; bestStreak: number; flights: number } {
  if (!value || typeof value !== 'object') return { bestScore: 0, bestStreak: 0, flights: 0 };
  const v = value as Record<string, unknown>;
  return {
    bestScore: typeof v.bestScore === 'number' ? v.bestScore : 0,
    bestStreak: typeof v.bestStreak === 'number' ? v.bestStreak : 0,
    flights: typeof v.flights === 'number' ? v.flights : 0,
  };
}

export function loadRecord(): SkyRunRecord {
  const data = safeReadJson(BEST_KEY);

  if (data) {
    return { kata: readSlot(data.kata), angka: readSlot(data.angka) };
  }

  // Migrasi lembut dari Patch 47: rekor lama hanya berisi kosakata,
  // jadi dipindahkan ke slot 'kata' agar pencapaian anak tidak hilang.
  const legacy = safeReadJson(OLD_BEST_KEY);
  if (legacy) {
    return {
      kata: readSlot(legacy),
      angka: { bestScore: 0, bestStreak: 0, flights: 0 },
    };
  }

  return structuredClone(EMPTY_RECORD);
}

export function saveRecord(record: SkyRunRecord): void {
  try {
    localStorage.setItem(BEST_KEY, JSON.stringify(record));
  } catch {
    // Diamkan — kegagalan menyimpan tidak boleh menghentikan permainan.
  }
}
