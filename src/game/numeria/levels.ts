export interface NumeriaLevel {
  id: string;
  title: string;
  denominator: number;
  target: number;
  prompt: string;
  hint: string;
  explanation: string;
}

export const numeriaLevels: NumeriaLevel[] = [
  {
    id: 'n1',
    title: 'Jembatan Tambah',
    denominator: 12,
    target: 7,
    prompt: 'Pasang 3 + 4 papan',
    hint: 'Hitung 3 papan dulu, lalu tambah 4 papan lagi.',
    explanation: '3 + 4 = 7, jadi jembatan perlu 7 papan.',
  },
  {
    id: 'n2',
    title: 'Jembatan Kurang',
    denominator: 12,
    target: 7,
    prompt: 'Pasang hasil dari 12 - 5',
    hint: 'Bayangkan ada 12 papan, lalu ambil 5. Sisanya berapa?',
    explanation: '12 - 5 = 7, jadi jembatan perlu 7 papan.',
  },
  {
    id: 'n3',
    title: 'Jembatan Kali',
    denominator: 15,
    target: 12,
    prompt: 'Pasang hasil dari 3 x 4',
    hint: '3 x 4 artinya 4 + 4 + 4.',
    explanation: '3 x 4 = 12, jadi jembatan perlu 12 papan.',
  },
  {
    id: 'n4',
    title: 'Jembatan Campuran',
    denominator: 18,
    target: 13,
    prompt: 'Pasang hasil dari 8 + 5',
    hint: 'Mulai dari 8, lalu maju 5 langkah.',
    explanation: '8 + 5 = 13, jadi jembatan perlu 13 papan.',
  },
  {
    id: 'n5',
    title: 'Jembatan Perkalian',
    denominator: 24,
    target: 18,
    prompt: 'Pasang hasil dari 6 x 3',
    hint: '6 x 3 artinya 6 + 6 + 6.',
    explanation: '6 x 3 = 18, jadi jembatan perlu 18 papan.',
  },
];
