export interface NumeriaLevel {
  id: string;
  title: string;
  denominator: number;
  target: number;
  hint: string;
}

export const numeriaLevels: NumeriaLevel[] = [
  {
    id: 'n1',
    title: 'Jembatan Perempatan',
    denominator: 4,
    target: 1,
    hint: 'Satu bagian dari empat bagian yang sama besar.',
  },
  {
    id: 'n2',
    title: 'Jembatan Perempatan Ganda',
    denominator: 4,
    target: 3,
    hint: 'Tiga bagian dari empat bagian yang sama besar.',
  },
  {
    id: 'n3',
    title: 'Jembatan Perenaman',
    denominator: 6,
    target: 2,
    hint: 'Dua bagian dari enam bagian yang sama besar.',
  },
  {
    id: 'n4',
    title: 'Jembatan Perdelapan',
    denominator: 8,
    target: 5,
    hint: 'Lima bagian dari delapan bagian yang sama besar.',
  },
  {
    id: 'n5',
    title: 'Jembatan Gabungan',
    denominator: 8,
    target: 6,
    hint: 'Enam dari delapan bagian sama nilainya dengan tiga per empat.',
  },
];
