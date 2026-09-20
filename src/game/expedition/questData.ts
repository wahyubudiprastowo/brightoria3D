/**
 * questData.ts — Definisi Quest & Knowledge Crystal (Patch 39).
 *
 * ====================================================================
 * KENAPA DITULIS SEBAGAI .ts, BUKAN .json
 * ====================================================================
 * Dokumen arsitektur meminta sistem berbasis JSON (quests.json,
 * lessons.json, dialogues.json, items.json). Patch ini SENGAJA menulis
 * data itu sebagai TypeScript bertipe dulu, bukan JSON mentah.
 *
 * Alasannya tiga:
 *   1. TYPE SAFETY SEKARANG. Salah ketik `worldId` atau `crystal` akan
 *      ketahuan saat `npm run build`, bukan saat anak sudah main.
 *   2. MIGRASI NANTI NOL RISIKO. Struktur di bawah 100% JSON-compatible
 *      (tidak ada fungsi, tidak ada undefined, tidak ada Date object).
 *      Saat siap pindah, cukup:
 *         - salin isi array `quests` ke `public/data/quests.json`
 *         - ganti import di questEngine.ts dengan fetch()
 *      TIDAK ADA logika lain yang perlu diubah.
 *   3. TANPA REQUEST JARINGAN. Proyek ini sudah dua kali terluka oleh
 *      aset yang dimuat dari luar (HDR CDN di Patch 03, .webp background
 *      di Patch 12-15). Data quest yang ikut bundle tidak bisa gagal
 *      dimuat.
 *
 * ====================================================================
 * KNOWLEDGE CRYSTAL — taksonomi dari Game Design Document
 * ====================================================================
 * GDD mendefinisikan empat warna:
 *   Green  = Character     Blue = Science
 *   Gold   = Achievement   Purple = Creativity
 *
 * Pemetaan dunia -> warna di bawah adalah INTERPRETASI saya terhadap
 * tema tiap dunia, BUKAN sesuatu yang tertulis eksplisit di dokumen.
 * Kalau tim akademik punya pemetaan berbeda, ubah di satu tempat ini
 * saja — seluruh sistem mengikuti.
 * ====================================================================
 */

export type CrystalType = 'green' | 'blue' | 'gold' | 'purple';

export interface CrystalMeta {
  id: CrystalType;
  label: string;
  domain: string;
  color: string;
  emissive: string;
  icon: string;
}

export const CRYSTALS: Record<CrystalType, CrystalMeta> = {
  green: {
    id: 'green',
    label: 'Kristal Akhlak',
    domain: 'Character',
    color: '#3fbf7f',
    emissive: '#6fffb0',
    icon: '💚',
  },
  blue: {
    id: 'blue',
    label: 'Kristal Ilmu',
    domain: 'Science',
    color: '#3d8fd6',
    emissive: '#8fd4ff',
    icon: '💙',
  },
  gold: {
    id: 'gold',
    label: 'Kristal Pencapaian',
    domain: 'Achievement',
    color: '#e0a63e',
    emissive: '#ffd98a',
    icon: '🏆',
  },
  purple: {
    id: 'purple',
    label: 'Kristal Kreasi',
    domain: 'Creativity',
    color: '#9a5ec9',
    emissive: '#d9a8ff',
    icon: '💜',
  },
};

/**
 * Pemetaan dunia -> jenis kristal.
 *
 * Dasar penalaran:
 *   quran   -> green : tema "Peace, reflection" = pembentukan karakter
 *   adab    -> green : eksplisit tentang akhlak
 *   math    -> blue  : logika & angka
 *   digital -> blue  : literasi teknologi
 *   arabic  -> purple: bahasa = ekspresi/kreasi
 *   english -> purple: bahasa = ekspresi/kreasi
 *   gold           : TIDAK dipetakan ke dunia mana pun — khusus
 *                    pencapaian lintas-dunia (milestone).
 */
export const WORLD_CRYSTAL: Record<string, CrystalType> = {
  quran: 'green',
  adab: 'green',
  math: 'blue',
  digital: 'blue',
  arabic: 'purple',
  english: 'purple',
};

// ---------------------------------------------------------------------------
// DIALOG NPC
// ---------------------------------------------------------------------------

export interface DialogueLine {
  /** Siapa yang bicara. 'aira' = pemandu, 'player' = pilihan anak. */
  speaker: 'aira' | 'player';
  text: string;
}

// ---------------------------------------------------------------------------
// QUEST
// ---------------------------------------------------------------------------

/**
 * Jenis tujuan quest.
 *
 * 'play_world'  : mainkan dunia tertentu sampai menambah kemajuan baru.
 *                 Dideteksi dengan MEMBANDINGKAN evidence dunia sebelum
 *                 dan sesudah — jadi NOL perubahan pada enam game yang
 *                 sudah berjalan. Lihat questEngine.ts.
 * 'collect'     : kumpulkan N kristal jenis tertentu di arena.
 * 'reach_stars' : capai jumlah Bintang Ilmu tertentu (kompatibel dengan
 *                 sistem bintang Patch 38 — bintang lama tetap terhitung).
 */
export type ObjectiveKind = 'play_world' | 'collect' | 'reach_stars';

export interface QuestObjective {
  kind: ObjectiveKind;
  /** Untuk 'play_world': id dunia. Untuk 'collect': jenis kristal. */
  target: string;
  /** Berapa banyak yang dibutuhkan. */
  amount: number;
  /** Teks yang ditampilkan di pelacak quest. */
  label: string;
}

export interface QuestReward {
  crystal: CrystalType;
  amount: number;
  xp: number;
}

export interface Quest {
  id: string;
  title: string;
  /** Ringkas, satu kalimat, dibaca anak di pelacak. */
  summary: string;
  /** Quest yang harus selesai dulu. Kosong = tersedia sejak awal. */
  requires: string[];
  objective: QuestObjective;
  reward: QuestReward;
  /** Dialog saat quest ditawarkan. */
  offer: DialogueLine[];
  /** Dialog saat quest selesai diserahkan. */
  complete: DialogueLine[];
}

/**
 * Rantai quest pembuka.
 *
 * DESAIN SENGAJA: setiap quest 'play_world' mengarahkan anak ke game
 * yang SUDAH ADA. Quest tidak menambah materi ajar baru sama sekali —
 * ia hanya memberi ALASAN NARATIF untuk memainkannya. Ini menjaga
 * kebijakan bahwa mastery hanya boleh datang dari enam game dunia,
 * bukan dari lapisan meta.
 *
 * Urutan dipilih menaik: mulai dari dunia yang paling ramah pemula
 * (Taman Al-Qur'an mengenalkan huruf) lalu melebar.
 */
export const quests: Quest[] = [
  {
    id: 'q1_salam',
    title: 'Salam Pertama',
    summary: 'Temui Aira dan dengarkan ceritanya tentang Brightoria.',
    requires: [],
    objective: {
      kind: 'reach_stars',
      target: 'any',
      amount: 1,
      label: 'Kumpulkan 1 Bintang Ilmu di sekitar arena',
    },
    reward: { crystal: 'gold', amount: 1, xp: 15 },
    offer: [
      { speaker: 'aira', text: 'Selamat datang di Brightoria! Namaku Aira, penjaga buku ilmu di pulau ini.' },
      { speaker: 'aira', text: 'Bintang Ilmu berserakan di sekitar sini. Coba ambil satu dulu, ya?' },
    ],
    complete: [
      { speaker: 'aira', text: 'Bagus sekali! Kamu memang penjelajah sejati.' },
      { speaker: 'aira', text: 'Ini Kristal Pencapaian pertamamu. Simpan baik-baik!' },
    ],
  },
  {
    id: 'q2_huruf',
    title: 'Jejak Huruf Hijaiyah',
    summary: "Kunjungi Taman Al-Qur'an dan pelajari satu huruf baru.",
    requires: ['q1_salam'],
    objective: {
      kind: 'play_world',
      target: 'quran',
      amount: 1,
      label: "Selesaikan 1 huruf di Taman Al-Qur'an",
    },
    reward: { crystal: 'green', amount: 1, xp: 25 },
    offer: [
      { speaker: 'aira', text: "Gerbang Taman Al-Qur'an sudah terbuka untukmu." },
      { speaker: 'aira', text: 'Di sana ada huruf-huruf yang menunggu dikenali. Pelajari satu, lalu kembali padaku.' },
    ],
    complete: [
      { speaker: 'aira', text: 'Kamu sudah mengenal huruf barunya! Aku bangga.' },
      { speaker: 'aira', text: 'Kristal Akhlak ini untukmu — warna hijau, lambang hati yang tenang.' },
    ],
  },
  {
    id: 'q3_hitung',
    title: 'Jembatan Angka',
    summary: 'Bantu Pulau Numeria menyeberangi jembatan pecahan.',
    requires: ['q2_huruf'],
    objective: {
      kind: 'play_world',
      target: 'math',
      amount: 1,
      label: 'Selesaikan 1 level di Pulau Numeria',
    },
    reward: { crystal: 'blue', amount: 1, xp: 25 },
    offer: [
      { speaker: 'aira', text: 'Ada jembatan rusak di Pulau Numeria. Hanya angka yang tepat bisa memperbaikinya.' },
      { speaker: 'aira', text: 'Kamu berani mencoba?' },
    ],
    complete: [
      { speaker: 'aira', text: 'Jembatannya tersambung! Kerja bagus.' },
      { speaker: 'aira', text: 'Kristal Ilmu berwarna biru ini lambang pikiran yang jernih.' },
    ],
  },
  {
    id: 'q4_kata',
    title: 'Kata dari Seberang Laut',
    summary: 'Susun satu kata di English Harbor.',
    requires: ['q3_hitung'],
    objective: {
      kind: 'play_world',
      target: 'english',
      amount: 1,
      label: 'Selesaikan 1 pulau di English Harbor',
    },
    reward: { crystal: 'purple', amount: 1, xp: 25 },
    offer: [
      { speaker: 'aira', text: 'Kapal dari seberang laut membawa huruf-huruf asing.' },
      { speaker: 'aira', text: 'Susun jadi kata, dan kamu akan paham bahasanya.' },
    ],
    complete: [
      { speaker: 'aira', text: 'Kata itu tersusun rapi! Bahasa baru terbuka untukmu.' },
      { speaker: 'aira', text: 'Kristal Kreasi ungu ini lambang kemampuan berkarya.' },
    ],
  },
  {
    id: 'q5_kumpul',
    title: 'Penjaga Empat Warna',
    summary: 'Kumpulkan keempat jenis Knowledge Crystal.',
    requires: ['q4_kata'],
    objective: {
      kind: 'collect',
      target: 'all',
      amount: 4,
      label: 'Miliki keempat warna kristal (hijau, biru, emas, ungu)',
    },
    reward: { crystal: 'gold', amount: 2, xp: 60 },
    offer: [
      { speaker: 'aira', text: 'Ada legenda: siapa yang mengumpulkan keempat warna kristal akan membuka rahasia pulau.' },
      { speaker: 'aira', text: 'Kamu sudah punya beberapa. Lengkapi sisanya!' },
    ],
    complete: [
      { speaker: 'aira', text: 'Keempat warna sudah di tanganmu! Legendanya benar.' },
      { speaker: 'aira', text: 'Kamu kini Penjaga Empat Warna Brightoria. Petualangan baru menantimu.' },
    ],
  },
];

/** Dialog saat tidak ada quest yang tersedia/aktif. */
export const IDLE_LINES: DialogueLine[] = [
  { speaker: 'aira', text: 'Semua tugas dariku sudah kamu selesaikan. Hebat sekali!' },
  { speaker: 'aira', text: 'Jelajahi gerbang mana pun yang kamu suka. Aku akan di sini kalau butuh teman.' },
];

/** Posisi Aira di arena (x, z). Dekat alun-alun tengah, mudah ditemukan. */
export const AIRA_POSITION: [number, number] = [2.6, 1.8];
