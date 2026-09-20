import type { QuizQuestion } from '../quiz/QuizGame';

/**
 * Taman Al-Qur'an — "Lentera Hijaiyah" (Patch 07).
 * Mengenal huruf hijaiyah dan tiga harakat dasar (fathah, kasrah, dammah).
 */
export const quranLevels: QuizQuestion[] = [
  {
    id: 'q1',
    title: 'Huruf Alif',
    prompt: 'ا',
    big: true,
    promptNote: 'Huruf pertama hijaiyah — bunyi dasarnya "a".',
    options: ['Alif', 'Ba', 'Ta'],
    correctIndex: 0,
    hint: 'Alif adalah huruf pertama yang diajarkan dalam hijaiyah.',
    explanation:
      'ا = Alif, huruf pertama hijaiyah. Alif tidak memakai titik, dan bunyi dasarnya seperti "a".',
  },
  {
    id: 'q2',
    title: 'Huruf Ba',
    prompt: 'ب',
    big: true,
    promptNote: 'Punya satu titik di bawah tubuh hurufnya.',
    options: ['Nun', 'Ba', 'Ta'],
    correctIndex: 1,
    hint: 'Perhatikan posisi titiknya — di bawah huruf.',
    explanation:
      'ب = Ba. Satu titik di bawah membuat bunyi "b", bukan "n" (ن) yang titiknya di atas.',
  },
  {
    id: 'q3',
    title: 'Huruf Ta',
    prompt: 'ت',
    big: true,
    promptNote: 'Punya dua titik di atas hurufnya.',
    options: ['Ta', 'Tsa', 'Ba'],
    correctIndex: 0,
    hint: 'Dua titik di atas, bukan satu titik di bawah.',
    explanation:
      'ت = Ta dengan dua titik di atas. Tsa (ث) punya tiga titik di atas, sedangkan Ba (ب) satu titik di bawah.',
  },
  {
    id: 'q4',
    title: 'Harakat Fathah',
    prompt: 'بَ',
    big: true,
    promptNote: 'Garis kecil di atas huruf — harakat fathah.',
    options: ['Bunyi "ba"', 'Bunyi "bi"', 'Bunyi "bu"'],
    correctIndex: 0,
    hint: 'Fathah adalah garis kecil di atas huruf, memberi bunyi "a".',
    explanation:
      'بَ dibaca "ba". Fathah (garis kecil di atas huruf) selalu memberi bunyi "a" pada hurufnya.',
  },
  {
    id: 'q5',
    title: 'Harakat Kasrah',
    prompt: 'بِ',
    big: true,
    promptNote: 'Garis kecil di bawah huruf — harakat kasrah.',
    options: ['Bunyi "bu"', 'Bunyi "bi"', 'Bunyi "ba"'],
    correctIndex: 1,
    hint: 'Kasrah adalah garis di bawah huruf, memberi bunyi "i".',
    explanation:
      'بِ dibaca "bi". Kasrah (garis kecil di bawah huruf) selalu memberi bunyi "i".',
  },
  {
    id: 'q6',
    title: 'Harakat Dammah',
    prompt: 'بُ',
    big: true,
    promptNote: 'Seperti waw kecil di atas huruf — harakat dammah.',
    options: ['Bunyi "bu"', 'Bunyi "bi"', 'Bunyi "ba"'],
    correctIndex: 0,
    hint: 'Dammah terlihat seperti waw kecil di atas huruf, bunyinya "u".',
    explanation:
      'بُ dibaca "bu". Dammah (seperti waw kecil di atas huruf) selalu memberi bunyi "u".',
  },
];