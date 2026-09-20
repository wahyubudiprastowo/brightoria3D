export interface World {
  id: string;
  name: string;
  subtitle: string;
  color: string;
  accent: string;
  /** Posisi 3D di dalam scene Three.js. Lihat catatan formasi cincin di bawah. */
  position: [number, number, number];
  /** Path gambar isometrik pulau (dipakai sebagai tekstur billboard 3D). */
  image: string;
  mastery: number;
  missions: number;
}

/**
 * PATCH 10 — PERBAIKAN REGRESI (baca sebelum mengubah angka di bawah).
 *
 * Patch 06 pernah memperbaiki posisi enam dunia dari "pola silang datar"
 * (variasi Z cuma -1..0, nyaris tidak ada kedalaman) menjadi FORMASI CINCIN
 * dengan variasi Z signifikan (-1.9 s.d. +1.9), supaya saat kamera diputar
 * (OrbitControls azimuth) pulau-pulau saling menyalip depan-belakang —
 * efek paralaks inilah yang membuat rotasi benar-benar terasa 3D.
 *
 * Saat WorldScene.tsx ditulis ulang di Patch 08 untuk integrasi aset peta
 * (sky/connector/waypoint lokal), file ini TIDAK SENGAJA tertimpa balik ke
 * versi pra-Patch-06 (variasi Z kembali ke -1..0), sehingga keluhan "peta
 * belum terasa 3D" berisiko muncul lagi meski kodenya sudah benar secara
 * teknis. Patch 10 mengembalikan formasi cincin Patch 06 sekaligus
 * mempertahankan seluruh perbaikan visual Patch 08 (aset map lokal di
 * WorldScene.tsx tidak disentuh, hanya posisi dunia yang dipulihkan).
 *
 * JANGAN ubah pola ini kembali ke silang datar tanpa alasan kuat — itu
 * sudah dua kali menyebabkan laporan "kurang terasa 3D" dari pengguna.
 */
export const worlds: World[] = [
  {
    id: 'quran',
    name: 'Taman Al-Qur\u2019an',
    subtitle: 'Tilawah dan tajwid',
    color: '#17856f',
    accent: '#f5cb68',
    position: [-2.7, 1.35, -1.6], // jam 10, paling jauh
    image: '/assets/worlds/01_taman_alquran.webp',
    mastery: 72,
    missions: 12,
  },
  {
    id: 'adab',
    name: 'Kampung Adab',
    subtitle: 'Karakter dan kebiasaan baik',
    color: '#c86845',
    accent: '#ffd78c',
    position: [0, 2.05, -1.9], // jam 12, paling jauh
    image: '/assets/worlds/02_kampung_adab.webp',
    mastery: 64,
    missions: 9,
  },
  {
    id: 'math',
    name: 'Pulau Numeria',
    subtitle: 'Matematika dan logika',
    color: '#3d73bc',
    accent: '#9ed8ff',
    position: [2.7, 1.35, -1.2], // jam 2
    image: '/assets/worlds/03_pulau_numeria.webp',
    mastery: 81,
    missions: 15,
  },
  {
    id: 'digital',
    name: 'Benteng Digital',
    subtitle: 'Aman dan bijak online',
    color: '#405e78',
    accent: '#b9e5ff',
    position: [2.5, -1.55, 1.2], // jam 4, mulai dekat
    image: '/assets/worlds/06_benteng_digital.webp',
    mastery: 76,
    missions: 10,
  },
  {
    id: 'english',
    name: 'English Harbor',
    subtitle: 'Listen, read, speak',
    color: '#da843c',
    accent: '#ffd49f',
    position: [0, -2.05, 1.9], // jam 6, paling dekat
    image: '/assets/worlds/05_english_harbor.webp',
    mastery: 68,
    missions: 11,
  },
  {
    id: 'arabic',
    name: 'Oasis Bahasa Arab',
    subtitle: 'Kosakata dan percakapan',
    color: '#8b5ab5',
    accent: '#e9d5ff',
    position: [-2.5, -1.55, 1.2], // jam 8
    image: '/assets/worlds/04_oasis_bahasa_arab.webp',
    mastery: 55,
    missions: 8,
  },
];

/** Pasangan indeks dunia yang dihubungkan garis jalur di peta 3D (mengikuti
 *  urutan cincin searah jarum jam, dipulihkan dari Patch 06). */
export const routeConnections: [number, number][] = [
  [0, 1], // quran -> adab
  [1, 2], // adab -> math
  [2, 3], // math -> digital
  [3, 4], // digital -> english
  [4, 5], // english -> arabic
  [5, 0], // arabic -> quran
];
