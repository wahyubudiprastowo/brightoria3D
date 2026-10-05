export interface HadithLesson {
  id: string;
  theme: string;
  title: string;
  childSummary: string;
  practicePrompt: string;
  sourceNote: string;
}

export const adabHadithLessons: HadithLesson[] = [
  {
    id: 'truthfulness',
    theme: 'Jujur',
    title: 'Jujur Membawa Kebaikan',
    childSummary: 'Rasulullah mengajarkan bahwa kejujuran menuntun kita kepada kebaikan.',
    practicePrompt: 'Hari ini, berani berkata benar walau tidak ada yang melihat.',
    sourceNote: 'Berdasarkan tema PDF: Kewajiban jujur / Jujur membawa kepada kebaikan.',
  },
  {
    id: 'avoid-lying',
    theme: 'Tidak berdusta',
    title: 'Bercanda Tetap Jujur',
    childSummary: 'Bercanda boleh, tetapi tidak boleh memakai kebohongan untuk membuat orang tertawa.',
    practicePrompt: 'Kalau bercanda, pilih kata yang benar dan tidak menyakiti.',
    sourceNote: 'Berdasarkan tema PDF: Larangan dusta / Larangan berbohong meskipun bercanda.',
  },
  {
    id: 'good-speech',
    theme: 'Menjaga lisan',
    title: 'Berkata Baik',
    childSummary: 'Seorang muslim belajar memilih kata yang baik atau diam dari ucapan buruk.',
    practicePrompt: 'Sebelum bicara, tanya: apakah ini benar, baik, dan perlu?',
    sourceNote: 'Berdasarkan tema PDF: Berkata baik / Menjaga ucapan.',
  },
  {
    id: 'spread-salam',
    theme: 'Salam',
    title: 'Sebarkan Salam',
    childSummary: 'Salam membuat hati teman, keluarga, dan tetangga menjadi hangat.',
    practicePrompt: 'Ucapkan salam dengan sopan saat bertemu atau masuk rumah.',
    sourceNote: 'Berdasarkan tema PDF: Menyebarkan salam / Aturan mengucap salam.',
  },
  {
    id: 'parents',
    theme: 'Orang tua',
    title: 'Berbakti kepada Orang Tua',
    childSummary: 'Berbuat baik kepada orang tua adalah adab besar yang sangat dicintai.',
    practicePrompt: 'Bantu satu pekerjaan rumah tanpa diminta.',
    sourceNote: 'Berdasarkan tema PDF: Keutamaan kedua orang tua / Kemuliaan ibu.',
  },
  {
    id: 'knowledge',
    theme: 'Ilmu',
    title: 'Semangat Menuntut Ilmu',
    childSummary: 'Menuntut ilmu adalah jalan kebaikan; belajar perlu adab dan kesungguhan.',
    practicePrompt: 'Dengarkan guru sampai selesai, lalu bertanya dengan sopan.',
    sourceNote: 'Berdasarkan tema PDF: Kewajiban menuntut ilmu / Mengikat ilmu dengan menulis.',
  },
  {
    id: 'quran-learning',
    theme: 'Al-Qur\'an',
    title: 'Belajar Al-Qur\'an',
    childSummary: 'Sebaik-baik belajar adalah belajar Al-Qur\'an dan mengajarkannya dengan baik.',
    practicePrompt: 'Baca satu surat pendek dengan tartil dan tenang.',
    sourceNote: 'Berdasarkan tema PDF: Keutamaan belajar dan mengajarkan Al Quran.',
  },
  {
    id: 'cleanliness',
    theme: 'Kebersihan',
    title: 'Menjaga Kebersihan',
    childSummary: 'Kebersihan adalah bagian dari adab seorang muslim dalam kehidupan sehari-hari.',
    practicePrompt: 'Rapikan sandal, meja, atau tempat bermain setelah dipakai.',
    sourceNote: 'Berdasarkan tema PDF: Menjaga kebersihan.',
  },
  {
    id: 'anger',
    theme: 'Menahan marah',
    title: 'Kuat Itu Menahan Marah',
    childSummary: 'Orang kuat bukan yang menang bertengkar, tetapi yang mampu menahan marah.',
    practicePrompt: 'Saat kesal, diam sebentar, tarik napas, lalu bicara pelan.',
    sourceNote: 'Berdasarkan tema PDF: Menahan marah / Kuat sejati adalah menahan marah.',
  },
  {
    id: 'gift',
    theme: 'Hadiah',
    title: 'Hadiah Membuat Sayang',
    childSummary: 'Memberi hadiah dan membalas kebaikan bisa menumbuhkan kasih sayang.',
    practicePrompt: 'Ucapkan terima kasih saat menerima bantuan atau hadiah.',
    sourceNote: 'Berdasarkan tema PDF: Saling memberi hadiah / Membalas orang yang memberi hadiah.',
  },
  {
    id: 'gratitude',
    theme: 'Terima kasih',
    title: 'Pandai Berterima Kasih',
    childSummary: 'Orang yang bersyukur kepada Allah juga belajar berterima kasih kepada manusia.',
    practicePrompt: 'Katakan “jazakallahu khairan” atau “terima kasih” dengan tulus.',
    sourceNote: 'Berdasarkan tema PDF: Perintah berterimakasih / Mengucapkan jazakumullahu khoir.',
  },
  {
    id: 'mosque',
    theme: 'Masjid',
    title: 'Masjid Tempat Mulia',
    childSummary: 'Masjid adalah tempat yang dicintai Allah, jadi kita masuk dengan tenang dan menjaga adab.',
    practicePrompt: 'Jaga suara, kerapian sandal, dan kebersihan saat di masjid.',
    sourceNote: 'Berdasarkan tema PDF: Masjid adalah tempat yang paling dicintai Allah.',
  },
  {
    id: 'eating',
    theme: 'Makan dan minum',
    title: 'Adab Makan',
    childSummary: 'Saat makan, biasakan membaca bismillah, tidak mencela makanan, dan makan dengan tertib.',
    practicePrompt: 'Mulai makan dengan bismillah dan akhiri dengan rasa syukur.',
    sourceNote: 'Berdasarkan tema PDF: Adab makan dan minum / Membaca bismillah.',
  },
  {
    id: 'neighbor',
    theme: 'Tetangga',
    title: 'Tidak Mengganggu Tetangga',
    childSummary: 'Tetangga punya hak untuk merasa aman dan nyaman di dekat kita.',
    practicePrompt: 'Jaga suara dan permainan agar tidak mengganggu rumah sebelah.',
    sourceNote: 'Berdasarkan tema PDF: Larangan mengganggu tetangga.',
  },
  {
    id: 'humility',
    theme: 'Rendah hati',
    title: 'Tawadhu',
    childSummary: 'Rendah hati membuat kita mudah menerima kebenaran dan tidak meremehkan orang lain.',
    practicePrompt: 'Saat bisa sesuatu, bantu teman tanpa menyombongkan diri.',
    sourceNote: 'Berdasarkan tema PDF: Perintah rendah hati / Sombong menghalangi hidayah.',
  },
];

export function hadithById(id: string): HadithLesson {
  const lesson = adabHadithLessons.find((item) => item.id === id);
  if (!lesson) throw new Error(`Hadith lesson not found: ${id}`);
  return lesson;
}
