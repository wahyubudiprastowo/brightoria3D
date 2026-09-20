/**
 * levels.ts — Re-export kurikulum English Harbor (Patch 32).
 *
 * Tidak berubah dari Patch 31 — dibangun ulang karena sandbox kerja
 * sempat ter-reset.
 *
 * Beberapa alias diekspor sekaligus (englishLevels, curriculum, islands)
 * untuk memaksimalkan kompatibilitas dengan kontrak yang mungkin
 * dibutuhkan App.tsx, mengikuti pola yang terbukti untuk `arabicLevels`
 * (lihat riwayat Patch 20 — pesan error TypeScript saat itu membocorkan
 * kontrak persis yang dibutuhkan App.tsx).
 */

import { islands as islandList, type EnglishWord } from './curriculum';

export const englishLevels = islandList;
export const curriculum = islandList;
export const islands = islandList;

export function getWordById(id: string): EnglishWord | undefined {
  return islandList.find((w) => w.id === id);
}

export function getTotalWordCount(): number {
  return islandList.length;
}
