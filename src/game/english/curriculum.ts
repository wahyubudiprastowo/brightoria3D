/**
 * curriculum.ts — Sumber data untuk English Harbor: "Pelabuhan Kata"
 * (Patch 32 — tidak berubah dari Patch 31, dibangun ulang karena sandbox
 * kerja sempat ter-reset antar sesi).
 *
 * CATATAN JUJUR PENTING: berbeda dari dunia lain (Oasis Bahasa Arab dari
 * buku "Al-Mumtaaz", Taman Al-Qur'an dari buku "Belajar Menulis Huruf
 * Hijaiyah") — English Harbor TIDAK memiliki sumber PDF/buku ajar dari
 * user. Seluruh 12 kata di bawah ini adalah DRAFT AI berdasarkan
 * kosakata dasar Bahasa Inggris untuk anak (setara CEFR Pre-A1/A1),
 * dipilih agar pendek (3-4 huruf) dan mudah divisualisasikan dengan
 * emoji. WAJIB direview guru Bahasa Inggris sebelum dipakai siswa
 * sungguhan secara luas.
 */

export interface EnglishWord {
  id: string;
  islandNumber: number;
  word: string;
  meaning: string;
  emoji: string;
}

export const islands: EnglishWord[] = [
  { id: 'e1', islandNumber: 1, word: 'CAT', meaning: 'kucing', emoji: '🐱' },
  { id: 'e2', islandNumber: 2, word: 'SUN', meaning: 'matahari', emoji: '☀️' },
  { id: 'e3', islandNumber: 3, word: 'DOG', meaning: 'anjing', emoji: '🐶' },
  { id: 'e4', islandNumber: 4, word: 'SHIP', meaning: 'kapal', emoji: '🚢' },
  { id: 'e5', islandNumber: 5, word: 'FISH', meaning: 'ikan', emoji: '🐟' },
  { id: 'e6', islandNumber: 6, word: 'BOOK', meaning: 'buku', emoji: '📖' },
  { id: 'e7', islandNumber: 7, word: 'TREE', meaning: 'pohon', emoji: '🌳' },
  { id: 'e8', islandNumber: 8, word: 'STAR', meaning: 'bintang', emoji: '⭐' },
  { id: 'e9', islandNumber: 9, word: 'DUCK', meaning: 'bebek', emoji: '🦆' },
  { id: 'e10', islandNumber: 10, word: 'KITE', meaning: 'layang-layang', emoji: '🪁' },
  { id: 'e11', islandNumber: 11, word: 'BIRD', meaning: 'burung', emoji: '🐦' },
  { id: 'e12', islandNumber: 12, word: 'MOON', meaning: 'bulan', emoji: '🌙' },
];
