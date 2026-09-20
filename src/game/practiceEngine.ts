/**
 * practiceEngine.ts — Mesin pengulangan berjarak untuk Latihan Harian.
 *
 * ====================================================================
 * CATATAN PENTING — FILE INI MENGGANTIKAN `dailyPractice.ts`
 * ====================================================================
 * Pada Patch 35 file ini bernama `dailyPractice.ts`, sementara komponen
 * UI-nya bernama `DailyPractice.tsx`. Di Windows (dan macOS default),
 * sistem berkas TIDAK membedakan huruf besar-kecil, sehingga TypeScript
 * menolak dengan error:
 *
 *   TS1261: Already included file name '.../DailyPractice.ts' differs
 *   from file name '.../dailyPractice.ts' only in casing.
 *
 * Solusinya: mesin dinamai ulang menjadi `practiceEngine.ts` yang jelas
 * berbeda dari `DailyPractice.tsx`. Isi logikanya TIDAK berubah sama
 * sekali dari Patch 35 — hanya nama berkasnya.
 *
 * ⚠️ WAJIB: HAPUS file lama `src/game/dailyPractice.ts` setelah memasang
 * patch ini, kalau tidak error TS1261 akan tetap muncul.
 * ====================================================================
 *
 * METODE: SISTEM KOTAK LEITNER (disederhanakan untuk anak 6-12 tahun)
 *
 *   Kotak 1 -> diulang besok        (1 hari)
 *   Kotak 2 -> diulang 2 hari lagi
 *   Kotak 3 -> diulang 4 hari lagi
 *   Kotak 4 -> diulang seminggu lagi (7 hari)
 *   Kotak 5 -> diulang 2 minggu lagi (14 hari) — sudah kuat
 *
 * Jawaban BENAR -> naik satu kotak. Jawaban SALAH -> kembali ke Kotak 1.
 *
 * JAMINAN KEAMANAN:
 * 1. HANYA MEMBACA `collectedWords` milik dunia lain — tidak pernah
 *    menulis/menghapus data evidence game apa pun.
 * 2. Menulis HANYA ke kunci miliknya sendiri: `brightoria.review.v1`.
 * 3. TIDAK mengimpor file game apa pun (hanya `reviewDeck.ts` yang
 *    self-contained) — nol risiko error build.
 */

import { lookupEntry, type DeckEntry, type DeckWorldId } from './reviewDeck';

/** Kunci evidence dunia yang menyimpan daftar kata terkumpul. */
const COLLECTION_SOURCES: { key: string; world: DeckWorldId }[] = [
  { key: 'brightoria.evidence.hijaiyah.v1', world: 'quran' },
  { key: 'brightoria.evidence.arabicOasis.v2', world: 'arabic' },
  { key: 'brightoria.evidence.englishHarbor.v1', world: 'english' },
];

const REVIEW_KEY = 'brightoria.review.v1';

/** Jeda hari untuk tiap kotak Leitner (indeks 0 tidak dipakai). */
const BOX_INTERVAL_DAYS = [0, 1, 2, 4, 7, 14];
export const MAX_BOX = 5;

/** Panjang satu sesi — sengaja pendek agar tidak melelahkan anak. */
export const SESSION_SIZE = 8;

export interface ReviewItemState {
  box: number;
  /** Tanggal jatuh tempo berikutnya, format YYYY-MM-DD. */
  due: string;
  lastReviewed: string | null;
  correctCount: number;
  wrongCount: number;
}

interface ReviewStore {
  items: Record<string, ReviewItemState>;
  sessionsCompleted: number;
  lastSessionDate: string | null;
}

const emptyStore: ReviewStore = { items: {}, sessionsCompleted: 0, lastSessionDate: null };

// ---------------------------------------------------------------------------
// Utilitas tanggal
// ---------------------------------------------------------------------------

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function today(): string {
  return dateKey(new Date());
}

function addDays(fromKey: string, days: number): string {
  const [y, m, d] = fromKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return dateKey(date);
}

/** true jika `due` sudah tiba atau lewat (string YYYY-MM-DD urutannya
 *  sama dengan urutan waktu, jadi aman dibandingkan langsung). */
function isDue(due: string): boolean {
  return due <= today();
}

// ---------------------------------------------------------------------------
// Baca/tulis penyimpanan
// ---------------------------------------------------------------------------

function safeReadJson(key: string): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function loadStore(): ReviewStore {
  const data = safeReadJson(REVIEW_KEY);
  if (!data) return structuredClone(emptyStore);
  return {
    items: (data.items as Record<string, ReviewItemState>) ?? {},
    sessionsCompleted: typeof data.sessionsCompleted === 'number' ? data.sessionsCompleted : 0,
    lastSessionDate: typeof data.lastSessionDate === 'string' ? data.lastSessionDate : null,
  };
}

function saveStore(store: ReviewStore): void {
  try {
    localStorage.setItem(REVIEW_KEY, JSON.stringify(store));
  } catch {
    // Diamkan — kegagalan menyimpan tidak boleh menghentikan permainan.
  }
}

// ---------------------------------------------------------------------------
// Mengumpulkan materi yang sudah dikuasai anak dari seluruh dunia
// ---------------------------------------------------------------------------

export function getCollectedEntries(): DeckEntry[] {
  const seen = new Set<string>();
  const result: DeckEntry[] = [];

  for (const source of COLLECTION_SOURCES) {
    const data = safeReadJson(source.key);
    if (!data || !Array.isArray(data.collectedWords)) continue;

    for (const raw of data.collectedWords as unknown[]) {
      if (typeof raw !== 'string') continue;
      if (seen.has(raw)) continue;
      const entry = lookupEntry(raw);
      if (!entry) continue; // ID tidak dikenal -> lewati dengan aman
      seen.add(raw);
      result.push(entry);
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Penyusunan sesi latihan
// ---------------------------------------------------------------------------

export type QuestionDirection = 'toMeaning' | 'toWord';

export interface PracticeQuestion {
  entry: DeckEntry;
  direction: QuestionDirection;
  options: string[];
  correctIndex: number;
  /** Kotak Leitner saat ini (ditampilkan sebagai tingkat kekuatan). */
  box: number;
}

export interface PracticeSession {
  questions: PracticeQuestion[];
  /** Jumlah materi yang benar-benar jatuh tempo hari ini. */
  dueCount: number;
  /** Total materi yang sudah dikuasai anak dan bisa dilatih. */
  poolSize: number;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickDistractors(
  pool: DeckEntry[],
  target: DeckEntry,
  field: 'meaning' | 'display',
  count: number,
): string[] {
  // Utamakan pengecoh dari dunia yang sama supaya terasa masuk akal,
  // lalu lengkapi dari dunia lain jika belum cukup.
  const sameWorld = pool.filter((e) => e.world === target.world && e.id !== target.id && e[field] !== target[field]);
  const otherWorld = pool.filter((e) => e.world !== target.world && e[field] !== target[field]);

  const candidates = [...shuffle(sameWorld), ...shuffle(otherWorld)];
  const picked: string[] = [];
  const usedValues = new Set<string>([target[field]]);

  for (const c of candidates) {
    if (picked.length >= count) break;
    if (usedValues.has(c[field])) continue;
    usedValues.add(c[field]);
    picked.push(c[field]);
  }

  return picked;
}

/**
 * Menyusun sesi latihan. Urutan prioritas:
 *   1. Materi yang sudah jatuh tempo (paling lama menunggu lebih dulu)
 *   2. Materi yang belum pernah dilatih sama sekali
 *   3. Jika masih kurang, materi dengan kotak terendah (paling rapuh)
 */
export function buildSession(): PracticeSession {
  const pool = getCollectedEntries();
  const store = loadStore();

  if (pool.length === 0) {
    return { questions: [], dueCount: 0, poolSize: 0 };
  }

  const withState = pool.map((entry) => {
    const state = store.items[entry.id];
    return { entry, state: state ?? null };
  });

  const dueItems = withState
    .filter((x) => x.state !== null && isDue(x.state.due))
    .sort((a, b) => (a.state!.due < b.state!.due ? -1 : 1));

  const neverReviewed = shuffle(withState.filter((x) => x.state === null));

  const notYetDue = withState
    .filter((x) => x.state !== null && !isDue(x.state.due))
    .sort((a, b) => a.state!.box - b.state!.box);

  const ordered = [...dueItems, ...neverReviewed, ...notYetDue].slice(0, SESSION_SIZE);

  const questions: PracticeQuestion[] = ordered.map(({ entry, state }, index) => {
    // Selang-seling arah soal agar tidak monoton dan melatih dua arah.
    const direction: QuestionDirection = index % 2 === 0 ? 'toMeaning' : 'toWord';
    const field = direction === 'toMeaning' ? 'meaning' : 'display';
    const correctValue = entry[field];
    const distractors = pickDistractors(pool, entry, field, 2);
    const options = shuffle([correctValue, ...distractors]);

    return {
      entry,
      direction,
      options,
      correctIndex: options.indexOf(correctValue),
      box: state?.box ?? 1,
    };
  });

  return { questions, dueCount: dueItems.length, poolSize: pool.length };
}

// ---------------------------------------------------------------------------
// Pencatatan hasil
// ---------------------------------------------------------------------------

/** Catat hasil satu soal, menggerakkan materi naik/turun kotak Leitner. */
export function recordAnswer(entryId: string, wasCorrect: boolean): void {
  const store = loadStore();
  const prev = store.items[entryId];
  const currentBox = prev?.box ?? 1;

  const nextBox = wasCorrect ? Math.min(MAX_BOX, currentBox + 1) : 1;
  const interval = BOX_INTERVAL_DAYS[nextBox] ?? 1;

  store.items[entryId] = {
    box: nextBox,
    due: addDays(today(), interval),
    lastReviewed: today(),
    correctCount: (prev?.correctCount ?? 0) + (wasCorrect ? 1 : 0),
    wrongCount: (prev?.wrongCount ?? 0) + (wasCorrect ? 0 : 1),
  };

  saveStore(store);
}

/** Tandai satu sesi latihan telah selesai. */
export function markSessionComplete(): void {
  const store = loadStore();
  store.sessionsCompleted += 1;
  store.lastSessionDate = today();
  saveStore(store);
}

// ---------------------------------------------------------------------------
// Ringkasan untuk ditampilkan di tombol/panel
// ---------------------------------------------------------------------------

export interface ReviewSummary {
  /** Materi yang jatuh tempo hari ini (termasuk yang belum pernah dilatih). */
  dueToday: number;
  /** Total materi yang sudah dikuasai dan masuk kolam latihan. */
  poolSize: number;
  /** Materi yang sudah mencapai kotak tertinggi. */
  strongCount: number;
  sessionsCompleted: number;
  lastSessionDate: string | null;
  /** Rincian jumlah materi per kotak, indeks 1-5. */
  boxCounts: number[];
}

export function getReviewSummary(): ReviewSummary {
  const pool = getCollectedEntries();
  const store = loadStore();

  const boxCounts = [0, 0, 0, 0, 0, 0];
  let dueToday = 0;
  let strongCount = 0;

  for (const entry of pool) {
    const state = store.items[entry.id];
    if (!state) {
      dueToday += 1; // belum pernah dilatih -> dianggap perlu dilatih
      boxCounts[1] += 1;
      continue;
    }
    boxCounts[Math.min(MAX_BOX, Math.max(1, state.box))] += 1;
    if (isDue(state.due)) dueToday += 1;
    if (state.box >= MAX_BOX) strongCount += 1;
  }

  return {
    dueToday: Math.min(dueToday, pool.length),
    poolSize: pool.length,
    strongCount,
    sessionsCompleted: store.sessionsCompleted,
    lastSessionDate: store.lastSessionDate,
    boxCounts,
  };
}
