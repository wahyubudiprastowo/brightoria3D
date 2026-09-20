/**
 * questEngine.ts — Mesin Quest Brightoria (Patch 39).
 *
 * ====================================================================
 * MASALAH INTI YANG DIPECAHKAN
 * ====================================================================
 * Quest bertipe 'play_world' harus tahu kapan anak SELESAI bermain di
 * salah satu dari enam dunia. Cara naif: tambahkan callback di setiap
 * game. Itu berarti menyentuh enam file yang semuanya sudah berjalan
 * stabil — persis yang diminta untuk TIDAK dilakukan.
 *
 * SOLUSI: DETEKSI LEWAT SELISIH EVIDENCE.
 * Setiap dunia sudah menyimpan kemajuannya sendiri di localStorage
 * (brightoria.evidence.*). Saat quest diterima, mesin ini memotret
 * ("snapshot") angka kemajuan dunia target. Saat anak kembali ke arena,
 * mesin membandingkan angka sekarang dengan snapshot tadi.
 *
 *     kemajuan_sekarang - kemajuan_saat_terima >= amount  ->  SELESAI
 *
 * Hasilnya: NOL baris kode di ArabicGame, QuranGame, EnglishGame,
 * AdabGame, NumeriaGame, DigitalGame yang perlu diubah. Mesin quest
 * hanya MEMBACA jejak yang sudah mereka tinggalkan.
 *
 * ====================================================================
 * JAMINAN KOMPATIBILITAS DENGAN PATCH 38
 * ====================================================================
 * Patch 38 menyimpan { stars, visits, updatedAt }. Patch 39 MENAMBAH
 * field baru (crystals, quests) ke objek yang sama, dan TIDAK PERNAH
 * menghapus atau mengubah arti `stars`.
 *
 * Anak yang sudah mengumpulkan 5 Bintang Ilmu akan tetap punya 5
 * bintang setelah patch ini. Bintang tetap dipakai untuk membuka
 * gerbang; kristal adalah lapisan hadiah TAMBAHAN di atasnya, bukan
 * pengganti.
 *
 * Semua pembacaan localStorage dibungkus try/catch. Data lama yang
 * formatnya tidak dikenal akan dilewati, bukan menyebabkan error.
 * ====================================================================
 */

import {
  CRYSTALS,
  quests,
  WORLD_CRYSTAL,
  type CrystalType,
  type Quest,
  type QuestObjective,
} from './questData';

// ---------------------------------------------------------------------------
// TIPE PENYIMPANAN
// ---------------------------------------------------------------------------

export type QuestStatus = 'locked' | 'available' | 'active' | 'done';

export interface QuestRecord {
  status: QuestStatus;
  /** Potret kemajuan dunia saat quest diterima. Dipakai untuk selisih. */
  baseline: number;
  /** Kemajuan tercatat terakhir (untuk menampilkan progres berjalan). */
  progress: number;
  acceptedAt: string | null;
  completedAt: string | null;
}

export interface ExpeditionState {
  /** Bintang Ilmu — WARISAN PATCH 38, jangan diubah artinya. */
  stars: string[];
  visits: number;
  /** BARU Patch 39: jumlah kristal per warna. */
  crystals: Record<CrystalType, number>;
  /** BARU Patch 39: status tiap quest. */
  quests: Record<string, QuestRecord>;
  updatedAt: string;
}

const STORAGE_KEY = 'brightoria.expedition.v1';

function emptyCrystals(): Record<CrystalType, number> {
  return { green: 0, blue: 0, gold: 0, purple: 0 };
}

function emptyState(): ExpeditionState {
  return {
    stars: [],
    visits: 0,
    crystals: emptyCrystals(),
    quests: {},
    updatedAt: new Date(0).toISOString(),
  };
}

// ---------------------------------------------------------------------------
// BACA/TULIS
// ---------------------------------------------------------------------------

function readJson(key: string): Record<string, unknown> | null {
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
 * Muat state, sekaligus MIGRASI LEMBUT dari format Patch 38.
 * Field yang belum ada diisi nilai kosong — data lama tidak hilang.
 */
export function loadState(): ExpeditionState {
  const data = readJson(STORAGE_KEY);
  if (!data) return emptyState();

  const base = emptyState();

  // --- Warisan Patch 38: dipertahankan apa adanya ---
  if (Array.isArray(data.stars)) {
    base.stars = (data.stars as unknown[]).filter((s): s is string => typeof s === 'string');
  }
  if (typeof data.visits === 'number') base.visits = data.visits;

  // --- Field baru Patch 39: diisi kalau ada, kosong kalau belum ---
  if (data.crystals && typeof data.crystals === 'object') {
    const src = data.crystals as Record<string, unknown>;
    (Object.keys(base.crystals) as CrystalType[]).forEach((key) => {
      const value = src[key];
      if (typeof value === 'number' && Number.isFinite(value)) {
        base.crystals[key] = Math.max(0, Math.floor(value));
      }
    });
  }

  if (data.quests && typeof data.quests === 'object') {
    const src = data.quests as Record<string, unknown>;
    Object.entries(src).forEach(([id, value]) => {
      if (!value || typeof value !== 'object') return;
      const v = value as Record<string, unknown>;
      const status = v.status;
      base.quests[id] = {
        status:
          status === 'locked' || status === 'available' || status === 'active' || status === 'done'
            ? status
            : 'locked',
        baseline: typeof v.baseline === 'number' ? v.baseline : 0,
        progress: typeof v.progress === 'number' ? v.progress : 0,
        acceptedAt: typeof v.acceptedAt === 'string' ? v.acceptedAt : null,
        completedAt: typeof v.completedAt === 'string' ? v.completedAt : null,
      };
    });
  }

  if (typeof data.updatedAt === 'string') base.updatedAt = data.updatedAt;
  return base;
}

export function saveState(state: ExpeditionState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, updatedAt: new Date().toISOString() }));
  } catch {
    // Diamkan — kegagalan menyimpan tidak boleh menghentikan permainan.
  }
}

// ---------------------------------------------------------------------------
// PEMBACA KEMAJUAN DUNIA (inti deteksi 'play_world')
// ---------------------------------------------------------------------------

/** Kunci localStorage tiap dunia. Ditulis lokal agar modul ini tidak
 *  pernah gagal build kalau ada dunia yang belum terpasang. */
const WORLD_EVIDENCE_KEY: Record<string, string> = {
  quran: 'brightoria.evidence.hijaiyah.v1',
  adab: 'brightoria.evidence.adabStory.v1',
  math: 'brightoria.evidence.numeria.v1',
  arabic: 'brightoria.evidence.arabicOasis.v2',
  english: 'brightoria.evidence.englishHarbor.v1',
  digital: 'brightoria.evidence.digital.v1',
};

/**
 * Ukuran tunggal "seberapa jauh anak sudah bermain di dunia ini".
 *
 * Setiap dunia menamai bucket-nya berbeda (stops/letters/islands/
 * chapters), jadi fungsi ini mencoba semuanya lalu memakai yang ada.
 * Yang dihitung adalah JUMLAH ITEM YANG SUDAH DISELESAIKAN — bukan
 * bintang — supaya quest terpenuhi meski anak baru dapat 1 bintang.
 */
export function readWorldProgress(worldId: string): number {
  const key = WORLD_EVIDENCE_KEY[worldId];
  if (!key) return 0;
  const data = readJson(key);
  if (!data) return 0;

  // Prioritas 1: array `completed` (dipakai semua dunia sejak Patch 20).
  if (Array.isArray(data.completed)) return data.completed.length;

  // Prioritas 2: hitung entri di bucket detail.
  for (const bucket of ['stops', 'letters', 'islands', 'chapters']) {
    const value = data[bucket];
    if (value && typeof value === 'object') {
      return Object.values(value as Record<string, unknown>).filter((entry) => {
        if (!entry || typeof entry !== 'object') return false;
        return (entry as Record<string, unknown>).completed === true;
      }).length;
    }
  }

  return 0;
}

// ---------------------------------------------------------------------------
// EVALUASI TUJUAN QUEST
// ---------------------------------------------------------------------------

function totalCrystals(state: ExpeditionState): number {
  return (Object.keys(state.crystals) as CrystalType[]).reduce((sum, k) => sum + state.crystals[k], 0);
}

function distinctCrystalColors(state: ExpeditionState): number {
  return (Object.keys(state.crystals) as CrystalType[]).filter((k) => state.crystals[k] > 0).length;
}

/** Berapa banyak progres yang sudah dicapai untuk satu tujuan quest. */
export function evaluateObjective(
  objective: QuestObjective,
  record: QuestRecord,
  state: ExpeditionState,
): number {
  switch (objective.kind) {
    case 'play_world': {
      const now = readWorldProgress(objective.target);
      // Selisih terhadap potret saat quest diterima.
      return Math.max(0, now - record.baseline);
    }
    case 'reach_stars': {
      return state.stars.length;
    }
    case 'collect': {
      if (objective.target === 'all') return distinctCrystalColors(state);
      const type = objective.target as CrystalType;
      return state.crystals[type] ?? 0;
    }
    default:
      return 0;
  }
}

/** Nilai awal baseline saat quest diterima. */
function computeBaseline(objective: QuestObjective, state: ExpeditionState): number {
  if (objective.kind === 'play_world') return readWorldProgress(objective.target);
  void state;
  return 0;
}

// ---------------------------------------------------------------------------
// MESIN STATUS
// ---------------------------------------------------------------------------

function recordFor(state: ExpeditionState, questId: string): QuestRecord {
  return (
    state.quests[questId] ?? {
      status: 'locked',
      baseline: 0,
      progress: 0,
      acceptedAt: null,
      completedAt: null,
    }
  );
}

function isDone(state: ExpeditionState, questId: string): boolean {
  return recordFor(state, questId).status === 'done';
}

/**
 * Segarkan status semua quest: buka yang prasyaratnya sudah terpenuhi,
 * dan perbarui angka progres quest yang sedang aktif.
 *
 * Fungsi ini MURNI (tidak menulis localStorage) supaya aman dipanggil
 * sesering apa pun dari React.
 */
export function refreshQuests(state: ExpeditionState): ExpeditionState {
  const next: ExpeditionState = {
    ...state,
    crystals: { ...state.crystals },
    quests: { ...state.quests },
  };

  quests.forEach((quest) => {
    const record = { ...recordFor(next, quest.id) };

    // Quest selesai tidak pernah dievaluasi ulang.
    if (record.status === 'done') {
      next.quests[quest.id] = record;
      return;
    }

    const prerequisitesMet = quest.requires.every((req) => isDone(next, req));

    if (record.status === 'locked' && prerequisitesMet) {
      record.status = 'available';
    } else if (record.status === 'available' && !prerequisitesMet) {
      record.status = 'locked';
    }

    if (record.status === 'active') {
      record.progress = evaluateObjective(quest.objective, record, next);
    }

    next.quests[quest.id] = record;
  });

  return next;
}

/** Terima quest: kunci baseline-nya sekarang. */
export function acceptQuest(state: ExpeditionState, questId: string): ExpeditionState {
  const quest = quests.find((q) => q.id === questId);
  if (!quest) return state;

  const record = { ...recordFor(state, questId) };
  if (record.status !== 'available') return state;

  record.status = 'active';
  record.baseline = computeBaseline(quest.objective, state);
  record.progress = 0;
  record.acceptedAt = new Date().toISOString();

  const next: ExpeditionState = {
    ...state,
    crystals: { ...state.crystals },
    quests: { ...state.quests, [questId]: record },
  };
  return refreshQuests(next);
}

/** Apakah quest aktif sudah memenuhi syarat untuk diserahkan? */
export function isQuestComplete(state: ExpeditionState, questId: string): boolean {
  const quest = quests.find((q) => q.id === questId);
  if (!quest) return false;
  const record = recordFor(state, questId);
  if (record.status !== 'active') return false;
  return evaluateObjective(quest.objective, record, state) >= quest.objective.amount;
}

/** Serahkan quest & berikan hadiah kristal. */
export function completeQuest(state: ExpeditionState, questId: string): ExpeditionState {
  const quest = quests.find((q) => q.id === questId);
  if (!quest) return state;
  if (!isQuestComplete(state, questId)) return state;

  const record = { ...recordFor(state, questId) };
  record.status = 'done';
  record.completedAt = new Date().toISOString();

  const crystals = { ...state.crystals };
  crystals[quest.reward.crystal] = (crystals[quest.reward.crystal] ?? 0) + quest.reward.amount;

  const next: ExpeditionState = {
    ...state,
    crystals,
    quests: { ...state.quests, [questId]: record },
  };
  return refreshQuests(next);
}

/** Tambah kristal dari sumber non-quest (mis. memungut di arena). */
export function addCrystal(state: ExpeditionState, type: CrystalType, amount = 1): ExpeditionState {
  const crystals = { ...state.crystals };
  crystals[type] = (crystals[type] ?? 0) + amount;
  return refreshQuests({ ...state, crystals, quests: { ...state.quests } });
}

/** Tambah Bintang Ilmu (kompatibel Patch 38). */
export function addStar(state: ExpeditionState, starId: string): ExpeditionState {
  if (state.stars.includes(starId)) return state;
  return refreshQuests({
    ...state,
    stars: [...state.stars, starId],
    crystals: { ...state.crystals },
    quests: { ...state.quests },
  });
}

// ---------------------------------------------------------------------------
// PEMBANTU UNTUK UI
// ---------------------------------------------------------------------------

export interface ActiveQuestView {
  quest: Quest;
  progress: number;
  target: number;
  ready: boolean;
}

/** Quest yang sedang aktif (maksimal satu, supaya anak tidak bingung). */
export function getActiveQuest(state: ExpeditionState): ActiveQuestView | null {
  for (const quest of quests) {
    const record = recordFor(state, quest.id);
    if (record.status !== 'active') continue;
    const progress = evaluateObjective(quest.objective, record, state);
    return {
      quest,
      progress: Math.min(progress, quest.objective.amount),
      target: quest.objective.amount,
      ready: progress >= quest.objective.amount,
    };
  }
  return null;
}

/** Quest berikutnya yang siap ditawarkan Aira. */
export function getOfferableQuest(state: ExpeditionState): Quest | null {
  for (const quest of quests) {
    if (recordFor(state, quest.id).status === 'available') return quest;
  }
  return null;
}

/** Ringkasan untuk HUD. */
export function getSummary(state: ExpeditionState) {
  return {
    stars: state.stars.length,
    crystalTotal: totalCrystals(state),
    crystalColors: distinctCrystalColors(state),
    crystals: state.crystals,
    questsDone: quests.filter((q) => isDone(state, q.id)).length,
    questsTotal: quests.length,
  };
}

/** Jenis kristal yang cocok untuk dunia tertentu. */
export function crystalForWorld(worldId: string): CrystalType {
  return WORLD_CRYSTAL[worldId] ?? 'gold';
}

export { CRYSTALS, quests };
