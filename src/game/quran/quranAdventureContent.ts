export type AccessTier = 'free' | 'premium';

export interface QuranPathItem {
  id: string;
  island: 'quran' | 'arabic' | 'adab';
  tier: AccessTier;
  title: string;
  subtitle: string;
  badge: string;
  focus: string;
  sample: string;
  sourceNote: string;
}

export const quranPathItems: QuranPathItem[] = [
  {
    id: 'iqra-1-free',
    island: 'quran',
    tier: 'free',
    title: "Iqra' Jilid 1",
    subtitle: 'Huruf hijaiyah dan fathah dasar',
    badge: 'Free Trial',
    focus: 'Alif-Ba-Ta, pengenalan titik huruf, dan bunyi pendek "a".',
    sample: 'ا - بَ - تَ - ثَ',
    sourceNote: "Diadaptasi dari struktur Iqra' 1 pada repo Qur'an Learning Adventure.",
  },
  {
    id: 'juz30-starter-free',
    island: 'quran',
    tier: 'free',
    title: 'Taman Juz 30 Starter',
    subtitle: 'Surat pendek paling awal untuk anak',
    badge: 'Free Trial',
    focus: 'Membaca perlahan Al-Ikhlas, Al-Falaq, An-Nas, Al-Kawthar, Al-Asr, Quraisy, dan Al-Fil.',
    sample: 'قُلْ هُوَ اللّٰهُ اَحَدٌ',
    sourceNote: 'Mengambil arah free 60% Juz 30, dipadatkan menjadi paket starter Brightoria.',
  },
  {
    id: 'tajwid-basic-free',
    island: 'quran',
    tier: 'free',
    title: 'Tajwid Dasar',
    subtitle: 'Dengar jelas, dengung, dan pantulan',
    badge: 'Free Trial',
    focus: 'Izhar Halqi, Idgham Bighunnah, Iqlab, Ikhfa, dan Qalqalah dengan contoh surat pendek.',
    sample: 'مِنْ شَرِّ - وَانْحَرْ - اَحَدٌ',
    sourceNote: 'Diadaptasi dari tajwidData: Nun mati/tanwin, qalqalah, dan makharij dasar.',
  },
  {
    id: 'iqra-2-6-premium',
    island: 'quran',
    tier: 'premium',
    title: "Iqra' Jilid 2-6",
    subtitle: 'Kasrah, dhammah, tanwin, mad, waqaf, dan gharib',
    badge: 'Premium',
    focus: 'Latihan bertahap dari harakat i/u sampai hukum nun sukun, tanda waqaf, dan persiapan mushaf.',
    sample: 'بِ - بُ - بًا - بَا - مَنْ آمَنَ',
    sourceNote: "Mengikuti pembagian pro: akses Iqra' 1 sampai 6 lengkap.",
  },
  {
    id: 'quran-30juz-premium',
    island: 'quran',
    tier: 'premium',
    title: 'Tilawah 30 Juz',
    subtitle: 'Jelajah mushaf penuh dengan panduan ayat',
    badge: 'Premium',
    focus: 'Mushaf lengkap, hafalan/murojaah lebih luas, dan materi lanjutan setelah Juz 30.',
    sample: 'الفاتحة - البقرة - آل عمران',
    sourceNote: 'Diadaptasi dari planFeatures: pro membuka cakupan 30 juz penuh.',
  },
  {
    id: 'quran-vocab-free',
    island: 'arabic',
    tier: 'free',
    title: "Mufrodat Qur'an Dasar",
    subtitle: 'Kosakata dari surat pendek',
    badge: 'Free Trial',
    focus: 'Anak mengenal arti kata Rabb, Ar-Rahman, An-Nas, Al-Falaq, Ash-Shamad, dan Al-Kawthar.',
    sample: 'رَبِّ - الرَّحْمٰنِ - النَّاسِ - الْفَلَقِ',
    sourceNote: 'Diadaptasi dari QURAN_VOCABULARY_LIST dan MUFRODAT_LEVELS level 1.',
  },
  {
    id: 'quran-vocab-premium',
    island: 'arabic',
    tier: 'premium',
    title: "Kamus Qur'an Lanjutan",
    subtitle: 'Akar kata dan arti pilihan dari lebih banyak surah',
    badge: 'Premium',
    focus: 'Mufrodat Al-Fatihah, Ayat Kursi, Al-Mulk, dan tema pilihan seperti syukur, cahaya, petunjuk, hati.',
    sample: 'الْكِتَابُ - نُورٌ - الْهُدَى - الشُّكْرُ',
    sourceNote: 'Diadaptasi dari kamus mufrodat dan level penjelajah 114 surah.',
  },
  {
    id: 'adab-daily-free',
    island: 'adab',
    tier: 'free',
    title: 'Adab Harian Santri',
    subtitle: 'Tugas kecil yang bisa dipraktikkan hari ini',
    badge: 'Free Trial',
    focus: 'Salam, doa orang tua, merapikan mushaf, murojaah harian, dan adab makan.',
    sample: 'Basmalah, salam, shalat tepat waktu, murojaah satu surat.',
    sourceNote: 'Diadaptasi dari adabService: daily Islamic tasks untuk anak.',
  },
  {
    id: 'adab-quran-premium',
    island: 'adab',
    tier: 'premium',
    title: 'Akhlak dari Kisah Surat',
    subtitle: 'Hikmah anak dari tafsir dan asbabun nuzul',
    badge: 'Premium',
    focus: 'Al-Fil tentang tawakkal, Quraisy tentang syukur, Ad-Duha tentang harapan, Al-Asr tentang waktu.',
    sample: 'Syukur, sabar, amanah, sayang sesama, dan cinta ilmu.',
    sourceNote: 'Diadaptasi dari tafsirData dan asbabNuzulData, tetap perlu validasi akademik.',
  },
];

export const quranFreeTrialItems = quranPathItems.filter((item) => item.tier === 'free');
export const quranPremiumItems = quranPathItems.filter((item) => item.tier === 'premium');

export const quranItemsByIsland = (island: QuranPathItem['island']) =>
  quranPathItems.filter((item) => item.island === island);
