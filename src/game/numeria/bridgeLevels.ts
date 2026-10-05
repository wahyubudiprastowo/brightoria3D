/**
 * bridgeLevels.ts — Jembatan antara kurikulum kelas 1-6 dan permainan
 * (Patch 60, pengganti langsung versi Patch 54).
 *
 * ====================================================================
 * PENGGANTI LANGSUNG — NOL PERUBAHAN DI NumeriaGame.tsx
 * ====================================================================
 * Berkas ini mempertahankan PERSIS seluruh ekspor versi Patch 54:
 *
 *     BridgeKind, BridgeChallenge, MathLevel
 *     initialBridgeLevel(), generateBridge(), adjustLevel()
 *     BRIDGE_LEVEL_LABEL
 *
 * Bentuk datanya sama, nama fungsinya sama, tipe kembaliannya sama.
 * Jadi `NumeriaGame.tsx` tidak perlu diubah satu baris pun.
 *
 * Yang berubah hanya ISINYA: soal kini datang dari mathCurriculum.ts
 * yang memuat materi kelas 1 sampai 6, bukan hanya pecahan.
 *
 * ====================================================================
 * MASALAH YANG DIPECAHKAN
 * ====================================================================
 * Versi Patch 54 HANYA menghasilkan soal pecahan — topik kelas 4 ke
 * atas. Anak kelas 1, 2, dan 3 tidak mendapat apa pun yang sesuai
 * tingkatnya, dan hanya ada empat jenis soal sehingga cepat terasa
 * berulang.
 *
 * Sekarang ada sembilan topik yang membentang enam tingkat kelas.
 *
 * ====================================================================
 * CARA TINGKAT LAMA DIPETAKAN KE KELAS
 * ====================================================================
 * Permainan masih memakai tiga tingkat (ringan/sedang/menantang) untuk
 * penyesuaian otomatis saat bermain. Kelas yang dipilih anak
 * menentukan RENTANG kelas mana yang dipakai tiap tingkat:
 *
 *     kelas 1, ringan     -> kelas 1
 *     kelas 1, menantang  -> kelas 2
 *     kelas 4, ringan     -> kelas 3
 *     kelas 4, menantang  -> kelas 5
 *
 * Dengan begitu anak yang lancar naik sedikit di atas kelasnya, dan
 * yang kesulitan turun sedikit — tanpa pernah melompat terlalu jauh
 * dari materi yang sedang ia pelajari di sekolah.
 * ====================================================================
 */

import {
  GRADE_INFO,
  generateTask,
  loadGrade,
  saveGrade,
  type BridgeTask,
  type Grade,
} from './mathCurriculum';

/** Tiga tingkat penyesuaian saat bermain — TIDAK BERUBAH dari Patch 54. */
export type MathLevel = 'ringan' | 'sedang' | 'menantang';

/**
 * Jenis tantangan.
 *
 * Nilai lama ('build' | 'equivalent' | 'sum' | 'complete') DIPERTAHANKAN
 * agar kode lama yang mungkin memeriksanya tetap aman, dan ditambah
 * nilai baru untuk topik kelas 1-3.
 */
export type BridgeKind =
  | 'build'
  | 'equivalent'
  | 'sum'
  | 'complete'
  | 'counting'
  | 'multiply'
  | 'divide'
  | 'percent'
  | 'kpk'
  | 'fpb'
  | 'decimal'
  | 'ratio'
  | 'perimeter'
  | 'area'
  | 'angle'
  | 'cube'
  | 'chance'
  | 'data';

/** Bentuk data TIDAK BERUBAH dari Patch 54. */
export interface BridgeChallenge {
  id: string;
  kind: BridgeKind;
  denominator: number;
  target: number;
  preset: number;
  prompt: string;
  hint: string;
  explanation: string;
  level: MathLevel;
  /** BARU: nama topik untuk lencana di layar, mis. "Perkalian". */
  topicLabel: string;
  /** BARU: kelas asal soal ini. */
  grade: Grade;
}

export const BRIDGE_LEVEL_LABEL: Record<MathLevel, string> = {
  ringan: 'Ringan',
  sedang: 'Sedang',
  menantang: 'Menantang',
};

// ---------------------------------------------------------------------------
// PEMETAAN TOPIK -> KIND
// ---------------------------------------------------------------------------

/**
 * Menerjemahkan topik kurikulum ke `kind` lama.
 *
 * Dipertahankan agar kode mana pun yang masih memeriksa `kind` tidak
 * pernah menerima nilai yang tak dikenalnya.
 */
function kindOf(topic: BridgeTask['topic']): BridgeKind {
  switch (topic) {
    case 'counting':
      return 'counting';
    case 'addition':
      return 'sum';
    case 'subtraction':
      return 'complete';
    case 'placeValue':
      return 'build';
    case 'multiplication':
      return 'multiply';
    case 'division':
      return 'divide';
    case 'fraction':
      return 'build';
    case 'equivalent':
      return 'equivalent';
    case 'percent':
      return 'percent';
    case 'kpk':
      return 'kpk';
    case 'fpb':
      return 'fpb';
    case 'decimal':
      return 'decimal';
    case 'ratio':
      return 'ratio';
    case 'perimeter':
      return 'perimeter';
    case 'area':
      return 'area';
    case 'angle':
      return 'angle';
    case 'cube':
      return 'cube';
    case 'chance':
      return 'chance';
    case 'data':
      return 'data';
    default:
      return 'build';
  }
}

// ---------------------------------------------------------------------------
// PEMETAAN TINGKAT -> KELAS
// ---------------------------------------------------------------------------

/**
 * Menentukan kelas mana yang dipakai, berdasarkan kelas pilihan anak
 * dan tingkat penyesuaian saat itu.
 *
 * Pergeserannya sengaja kecil (satu tingkat kelas) supaya anak tidak
 * pernah terlempar ke materi yang jauh dari yang sedang dipelajarinya.
 */
function effectiveGrade(base: Grade, level: MathLevel): Grade {
  if (base >= 6) return 6;
  return (level === 'menantang' ? 6 : 5) as Grade;
}

// ---------------------------------------------------------------------------
// API — nama & bentuk SAMA PERSIS dengan Patch 54
// ---------------------------------------------------------------------------

/**
 * Tingkat awal.
 *
 * Patch 54 membacanya dari mesin adaptif bersama (`loadMathProgress`).
 * Berkas ini sengaja TIDAK lagi bergantung pada modul itu — Numeria
 * kini punya kelasnya sendiri, dan mencampur dua sistem penyesuaian
 * akan membuat keduanya saling mengacaukan.
 */
export function initialBridgeLevel(): MathLevel {
  return 'sedang';
}

/** Satu tantangan baru pada tingkat tertentu. */
export function generateBridge(level: MathLevel): BridgeChallenge {
  const base = loadGrade();
  const grade = effectiveGrade(base, level);
  const task = generateTask(grade);

  return {
    id: task.id,
    kind: kindOf(task.topic),
    denominator: task.denominator,
    target: task.target,
    preset: task.preset,
    prompt: task.prompt,
    hint: task.hint,
    explanation: task.explanation,
    level,
    topicLabel: task.topicLabel,
    grade: task.grade,
  };
}

const ORDER: MathLevel[] = ['ringan', 'sedang', 'menantang'];

/**
 * Menyesuaikan tingkat dari lima jawaban terakhir.
 *
 * Aturan TIDAK BERUBAH dari Patch 54:
 *   benar >= 4 dari 5 -> naik
 *   benar <= 2 dari 5 -> turun
 *
 * Catatan direset setelah berubah, supaya jawaban dari tingkat lama
 * tidak ikut menilai tingkat baru.
 */
export function adjustLevel(
  level: MathLevel,
  recent: boolean[],
): { level: MathLevel; recent: boolean[]; changed: 'up' | 'down' | null } {
  if (recent.length < 5) return { level, recent, changed: null };

  const correct = recent.filter(Boolean).length;
  const idx = ORDER.indexOf(level);

  if (correct >= 4 && idx < ORDER.length - 1) {
    return { level: ORDER[idx + 1], recent: [], changed: 'up' };
  }
  if (correct <= 2 && idx > 0) {
    return { level: ORDER[idx - 1], recent: [], changed: 'down' };
  }
  return { level, recent, changed: null };
}

// ---------------------------------------------------------------------------
// TAMBAHAN BARU — kelas
// ---------------------------------------------------------------------------

export { GRADE_INFO, loadGrade, saveGrade };
export type { Grade };
