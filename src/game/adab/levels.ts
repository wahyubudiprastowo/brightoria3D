import type { QuizQuestion } from '../quiz/QuizGame';

/**
 * Kampung Adab — "Misi Adab Sehari-hari" (Patch 07).
 * Anak menilai situasi harian lalu membaca alasan singkatnya.
 */
export const adabLevels: QuizQuestion[] = [
  {
    id: 'a1',
    title: 'Pulang Sekolah',
    prompt: 'Sesampainya di rumah, cara apa yang paling beradab?',
    promptNote: 'Pintu depan rumah sudah terlihat di depanmu.',
    options: ['Mengetuk pintu lalu mengucapkan salam', 'Langsung masuk tanpa pamit'],
    correctIndex: 0,
    hint: 'Salam adalah pembuka yang disukai keluarga dan para malaikat.',
    explanation:
      'Masuk rumah dengan mengucapkan salam adalah kebiasaan baik yang dicontohkan para nabi. Mengetuk pintu lalu bersalam membuat keluarga tahu kamu sudah pulang.',
  },
  {
    id: 'a2',
    title: 'Saat Makan',
    prompt: 'Siang ini kamu makan bersama keluarga. Mana cara makan yang paling beradab?',
    options: ['Makan dengan tangan kanan sambil duduk', 'Makan dengan tangan kiri sambil berdiri'],
    correctIndex: 0,
    hint: 'Rasulullah mengajarkan makan dengan tangan kanan dan tidak terburu-buru.',
    explanation:
      'Makan sambil duduk dengan tangan kanan adalah adab makan yang diajarkan sejak kecil. Tangan kiri dipakai untuk hal-hal yang kiranya kotor.',
  },
  {
    id: 'a3',
    title: 'Saat Orang Tua Berbicara',
    prompt: 'Ayah dan Ibu sedang berbicara. Kamu ingin menyampaikan sesuatu.',
    options: ['Memotong pembicaraan mereka', 'Menunggu giliran lalu bicara dengan sopan'],
    correctIndex: 1,
    hint: 'Orang yang beradab tahu kapan waktu yang tepat untuk bicara.',
    explanation:
      'Memotong pembicaraan orang tua kurang sopan. Tunggu sampai mereka selesai, lalu sampaikan keperluanmu dengan lembut.',
  },
  {
    id: 'a4',
    title: 'Meminjam Buku',
    prompt: 'Temanmu meminjamkan buku bacaan kesukaanmu.',
    options: [
      'Membaca dengan hati-hati lalu mengembalikan tepat waktu',
      'Menulis-nulis di halamannya',
    ],
    correctIndex: 0,
    hint: 'Barang pinjaman harus dijaga sebaik milik sendiri.',
    explanation:
      'Menjaga dan mengembalikan tepat waktu adalah adab meminjam. Barang titipan wajib dijaga, apalagi buku kesayangan teman.',
  },
  {
    id: 'a5',
    title: 'Di Perpustakaan',
    prompt: 'Teman-teman sedang membaca dengan tenang di perpustakaan.',
    options: ['Berbicara keras-keras', 'Berbicara pelan atau berbisik'],
    correctIndex: 1,
    hint: 'Perpustakaan adalah tempat orang berkonsentrasi membaca.',
    explanation:
      'Menjaga suara tetap pelan di perpustakaan adalah adab menghormati orang lain yang sedang belajar dan membaca.',
  },
  {
    id: 'a6',
    title: 'Membuang Sampah',
    prompt: 'Kamu selesai makan camilan di taman.',
    options: ['Mencari tempat sampah', 'Membuang bungkusnya di jalan'],
    correctIndex: 0,
    hint: 'Kebersihan adalah sebagian dari iman.',
    explanation:
      'Membuang sampah pada tempatnya membuat taman nyaman untuk semua orang dan menjaga lingkungan tetap bersih.',
  },
];