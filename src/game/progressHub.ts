/**
 * progressHub.ts — Agregator progres lintas-dunia untuk Brightoria
 * (Patch 34).
 *
 * ====================================================================
 * MASALAH YANG DIPECAHKAN:
 * ====================================================================
 * Sejak awal proyek, setiap dunia menyimpan progresnya SENDIRI-SENDIRI
 * di localStorage dengan struktur berbeda-beda:
 *
 *   brightoria.evidence.arabicOasis.v2   -> { stops, collectedWords, ... }
 *   brightoria.evidence.hijaiyah.v1      -> { letters, collectedWords, ... }
 *   brightoria.evidence.englishHarbor.v1 -> { islands, collectedWords, ... }
 *   brightoria.evidence.adabStory.v1     -> { chapters, collectedOutcomes, ... }
 *   brightoria.evidence.numeria.v1       -> { completed, firstTryCorrect, ... }
 *   brightoria.evidence.digital.v1       -> { completed, ... }
 *
 * Akibatnya TIDAK ADA satu pun tempat yang tahu gambaran utuh: berapa
 * total bintang anak, dunia mana yang paling kuat/lemah, sudah berapa
 * hari berturut-turut bermain. Parent dashboard di App.tsx sampai
 * sekarang masih memakai angka HARDCODED (73%, streak 4) — artinya
 * orang tua melihat angka yang TIDAK NYATA.
 *
 * Modul ini membaca SEMUA kunci evidence tersebut, menormalkan
 * strukturnya yang berbeda-beda, lalu menghasilkan satu ringkasan utuh.
 *
 * ====================================================================
 * JAMINAN KEAMANAN (prinsip "jangan merusak yang sudah ada"):
 * ====================================================================
 * 1. HANYA MEMBACA localStorage — tidak pernah menulis/menghapus data
 *    evidence milik game manapun. Satu-satunya yang ditulis adalah kunci
 *    BARU miliknya sendiri (`brightoria.activity.v1`) untuk mencatat
 *    hari-hari aktif (keperluan streak), yang tidak dipakai game lain.
 * 2. TIDAK mengimpor file game apa pun — nol risiko error build jika
 *    suatu dunia belum terpasang di proyek user.
 * 3. Setiap pembacaan dibungkus try/catch — struktur data yang tidak
 *    dikenal/rusak cukup dilewati, tidak pernah melempar error.
 * 4. Nama dunia & jumlah total level ditulis sebagai konstanta di sini
 *    (bukan diimpor), supaya modul tetap berfungsi meski ada dunia yang
 *    belum/tidak terpasang.
 * ====================================================================
 */

export interface WorldSummary {
  id: string;
  label: string;
  emoji: string;
  /** 0-100. Dihitung dari bintang jika tersedia, atau rasio penyelesaian. */
  mastery: number;
  starsEarned: number;
  starsPossible: number;
  itemsCompleted: number;
  itemsTotal: number;
  /** Kata/materi yang terkumpul permanen (jika dunia punya konsep koleksi). */
  collected: number;
  collectedTotal: number;
  /** true jika anak belum pernah menyentuh dunia ini sama sekali. */
  untouched: boolean;
}

export interface ProgressSnapshot {
  worlds: WorldSummary[];
  overallMastery: number;
  totalStars: number;
  totalStarsPossible: number;
  strongest: WorldSummary | null;
  needsSupport: WorldSummary | null;
  /** Hari berturut-turut anak membuka aplikasi (dihitung nyata). */
  streakDays: number;
  /** Total hari berbeda anak pernah bermain. */
  activeDays: number;
  lastActiveISO: string | null;
}

/** Definisi dunia — ditulis lokal (tidak diimpor) agar modul ini tidak
 *  pernah gagal build meski suatu dunia belum terpasang. */
const WORLD_DEFS = [
  { id: 'quran', label: "Taman Al-Qur'an", emoji: '🕌', key: 'brightoria.evidence.hijaiyah.v1', itemsTotal: 28, collectedTotal: 112 },
  { id: 'adab', label: 'Kampung Adab', emoji: '🤝', key: 'brightoria.evidence.adabStory.v1', itemsTotal: 8, collectedTotal: 24 },
  { id: 'math', label: 'Pulau Numeria', emoji: '🔢', key: 'brightoria.evidence.numeria.v1', itemsTotal: 5, collectedTotal: 0 },
  { id: 'arabic', label: 'Oasis Bahasa Arab', emoji: '🐪', key: 'brightoria.evidence.arabicOasis.v2', itemsTotal: 17, collectedTotal: 129 },
  { id: 'english', label: 'English Harbor', emoji: '⛵', key: 'brightoria.evidence.englishHarbor.v1', itemsTotal: 12, collectedTotal: 12 },
  { id: 'digital', label: 'Benteng Digital', emoji: '🛡️', key: 'brightoria.evidence.digital.v1', itemsTotal: 5, collectedTotal: 0 },
] as const;

const ACTIVITY_KEY = 'brightoria.activity.v1';

function safeRead(key: string): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/**
 * Menormalkan struktur evidence yang berbeda-beda antar dunia menjadi
 * satu bentuk seragam. Setiap dunia menyimpan detail per-item di properti
 * dengan nama berbeda (stops/letters/islands/chapters), jadi kita cari
 * yang mana pun yang ada.
 */
function extractStars(data: Record<string, unknown>): { earned: number; count: number } {
  const candidateKeys = ['stops', 'letters', 'islands', 'chapters'];
  for (const k of candidateKeys) {
    const bucket = data[k];
    if (bucket && typeof bucket === 'object') {
      const entries = Object.values(bucket as Record<string, unknown>);
      let earned = 0;
      let count = 0;
      for (const entry of entries) {
        if (entry && typeof entry === 'object') {
          const e = entry as Record<string, unknown>;
          // Adab memakai `bestStars`, dunia lain memakai `stars`
          const stars = typeof e.stars === 'number' ? e.stars : typeof e.bestStars === 'number' ? e.bestStars : 0;
          earned += stars;
          count += 1;
        }
      }
      return { earned, count };
    }
  }
  return { earned: 0, count: 0 };
}

function extractCollected(data: Record<string, unknown>): number {
  if (Array.isArray(data.collectedWords)) return data.collectedWords.length;
  if (Array.isArray(data.collectedOutcomes)) return data.collectedOutcomes.length;
  return 0;
}

function extractCompleted(data: Record<string, unknown>): number {
  if (Array.isArray(data.completed)) return data.completed.length;
  return 0;
}

function summariseWorld(def: (typeof WORLD_DEFS)[number]): WorldSummary {
  const data = safeRead(def.key);

  if (!data) {
    return {
      id: def.id,
      label: def.label,
      emoji: def.emoji,
      mastery: 0,
      starsEarned: 0,
      starsPossible: def.itemsTotal * 3,
      itemsCompleted: 0,
      itemsTotal: def.itemsTotal,
      collected: 0,
      collectedTotal: def.collectedTotal,
      untouched: true,
    };
  }

  const { earned, count } = extractStars(data);
  const completed = extractCompleted(data);
  const collected = extractCollected(data);
  const starsPossible = def.itemsTotal * 3;

  // Jika dunia memakai sistem bintang -> pakai rasio bintang.
  // Jika tidak (mis. Numeria/Digital yang hanya punya daftar `completed`)
  // -> pakai rasio penyelesaian item.
  const mastery =
    count > 0 && starsPossible > 0
      ? Math.round((earned / starsPossible) * 100)
      : def.itemsTotal > 0
        ? Math.round((completed / def.itemsTotal) * 100)
        : 0;

  return {
    id: def.id,
    label: def.label,
    emoji: def.emoji,
    mastery: Math.min(100, mastery),
    starsEarned: earned,
    starsPossible,
    itemsCompleted: Math.max(completed, count),
    itemsTotal: def.itemsTotal,
    collected,
    collectedTotal: def.collectedTotal,
    untouched: completed === 0 && count === 0 && collected === 0,
  };
}

// ---------------------------------------------------------------------------
// Pencatatan hari aktif (untuk streak yang NYATA, bukan angka hardcoded)
// ---------------------------------------------------------------------------

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function readActivityDays(): string[] {
  const data = safeRead(ACTIVITY_KEY);
  if (data && Array.isArray(data.days)) {
    return (data.days as unknown[]).filter((d): d is string => typeof d === 'string');
  }
  return [];
}

/**
 * Catat bahwa anak membuka aplikasi hari ini. Aman dipanggil berkali-kali
 * — hanya menyimpan satu entri per tanggal.
 */
export function markActiveToday(): void {
  try {
    const days = readActivityDays();
    const today = todayKey();
    if (days.includes(today)) return;
    const next = [...days, today].slice(-400); // simpan maksimal ~1 tahun
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify({ days: next }));
  } catch {
    // Diamkan — kegagalan pencatatan tidak boleh mengganggu aplikasi.
  }
}

function computeStreak(days: string[]): number {
  if (days.length === 0) return 0;
  const set = new Set(days);
  let streak = 0;
  const cursor = new Date();

  // Jika hari ini belum tercatat, streak dihitung mulai kemarin
  // (anak mungkin belum sempat main hari ini, tapi kemarin main).
  if (!set.has(todayKey())) {
    cursor.setDate(cursor.getDate() - 1);
  }

  for (let i = 0; i < 400; i++) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
    if (set.has(key)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

// ---------------------------------------------------------------------------
// API utama
// ---------------------------------------------------------------------------

export function getProgressSnapshot(): ProgressSnapshot {
  const worlds = WORLD_DEFS.map(summariseWorld);

  const totalStars = worlds.reduce((s, w) => s + w.starsEarned, 0);
  const totalStarsPossible = worlds.reduce((s, w) => s + w.starsPossible, 0);

  const touched = worlds.filter((w) => !w.untouched);
  const overallMastery =
    touched.length > 0 ? Math.round(touched.reduce((s, w) => s + w.mastery, 0) / touched.length) : 0;

  const sortedByMastery = [...touched].sort((a, b) => b.mastery - a.mastery);
  const strongest = sortedByMastery[0] ?? null;

  // "Perlu dukungan" = dunia yang SUDAH disentuh tapi mastery-nya terendah.
  // Jika semua dunia sudah kuat (>= 80), kembalikan null agar UI bisa
  // menampilkan pesan positif alih-alih mencari-cari kelemahan.
  const weakest = sortedByMastery[sortedByMastery.length - 1] ?? null;
  const needsSupport = weakest && weakest.mastery < 80 ? weakest : null;

  const days = readActivityDays();

  return {
    worlds,
    overallMastery,
    totalStars,
    totalStarsPossible,
    strongest,
    needsSupport,
    streakDays: computeStreak(days),
    activeDays: days.length,
    lastActiveISO: days.length > 0 ? days[days.length - 1] : null,
  };
}

/**
 * Rekomendasi yang dapat dibaca orang tua — berbasis data NYATA, bukan
 * teks statis. Sengaja dirumuskan tanpa nada menghakimi anak.
 */
export function buildRecommendation(snapshot: ProgressSnapshot): string {
  const { worlds, needsSupport, strongest, overallMastery } = snapshot;
  const untouchedWorlds = worlds.filter((w) => w.untouched);

  if (worlds.every((w) => w.untouched)) {
    return 'Petualangan belum dimulai. Ajak ananda memilih satu pulau untuk dijelajahi bersama hari ini.';
  }

  if (untouchedWorlds.length > 0) {
    const next = untouchedWorlds[0];
    return `Ananda belum menjelajahi ${next.label}. Mencoba pulau baru membantu menyeimbangkan kemampuan di berbagai bidang.`;
  }

  if (needsSupport) {
    return `${needsSupport.label} berada di ${needsSupport.mastery}% — bidang ini paling membutuhkan pendampingan. Mengulang beberapa level bersama akan sangat membantu.`;
  }

  if (overallMastery >= 80 && strongest) {
    return `Seluruh pulau sudah dikuasai dengan baik (rata-rata ${overallMastery}%). ${strongest.label} menjadi kekuatan utama ananda. Ini saat yang tepat untuk materi lanjutan.`;
  }

  return 'Perkembangan berjalan merata di semua pulau. Lanjutkan ritme belajar yang sudah terbentuk.';
}
