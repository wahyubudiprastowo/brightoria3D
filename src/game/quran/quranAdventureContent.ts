export type AccessTier = 'free' | 'account' | 'premium';

export interface QuranPathLesson {
  id: string;
  title: string;
  arabic?: string;
  latin?: string;
  meaning?: string;
  note: string;
  practice: string;
}

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
  cta: string;
  lessons: QuranPathLesson[];
}

export const quranPathItems: QuranPathItem[] = [
  {
    id: 'iqra-1-free',
    island: 'quran',
    tier: 'free',
    title: "Iqra' Jilid 1",
    subtitle: '32 halaman huruf hijaiyah dan fathah dasar',
    badge: 'Free Trial',
    focus: 'Belajar halaman demi halaman dari Alif-Ba-Ta sampai latihan lengkap huruf berfathah.',
    sample: 'ا - بَ - تَ - ثَ',
    sourceNote: "Diadaptasi dari struktur Iqra' 1 pada repo Qur'an Learning Adventure.",
    cta: 'Buka 32 halaman Iqra',
    lessons: [
      { id: 'iqra-1-alif', title: 'Kenali huruf tunggal', arabic: 'ا ب ت ث', latin: 'Alif, Ba, Ta, Tsa', meaning: 'Empat huruf awal yang sering dikenalkan pertama.', note: 'Perhatikan titik: Ba satu titik di bawah, Ta dua titik di atas, Tsa tiga titik di atas.', practice: 'Tunjuk huruf yang punya satu titik di bawah, lalu ucapkan pelan: Ba.' },
      { id: 'iqra-1-fathah', title: 'Bunyi fathah', arabic: 'بَ تَ ثَ', latin: 'ba, ta, tsa', meaning: 'Tanda fathah membuat bunyi pendek "a".', note: 'Baca pendek dan ringan. Jangan dipanjangkan kecuali ada tanda mad.', practice: 'Baca tiga kali: ba, ta, tsa. Setelah itu cari kartu yang bunyinya sama.' },
      { id: 'iqra-1-review', title: 'Mini review', arabic: 'اَ بَ تَ ثَ', latin: 'a, ba, ta, tsa', meaning: 'Latihan membaca baris pendek.', note: 'Huruf Arab dibaca dari kanan ke kiri saat berada dalam mushaf atau kalimat.', practice: 'Minta anak membaca ulang tanpa terburu-buru, lalu beri bintang untuk bacaan paling rapi.' },
    ],
  },
  {
    id: 'juz30-starter-free', island: 'quran', tier: 'free', title: 'Mushaf Juz 30 Lengkap', subtitle: '37 surat lengkap dengan audio qari', badge: 'Free Trial', focus: 'Membaca seluruh surat dari An-Naba sampai An-Nas, lengkap dengan semua ayat, latin, arti, dan contoh bacaan.', sample: 'عَمَّ يَتَسَآءَلُونَ - قُلْ هُوَ اللّٰهُ أَحَدٌ', sourceNote: 'Materi Juz 30 dan audio qari diadaptasi dari repository Qur\'an Learning Adventure.', cta: 'Buka 37 surat Juz 30',
    lessons: [
      { id: 'juz30-ikhlas', title: 'Al-Ikhlas: mengenal tauhid', arabic: 'قُلْ هُوَ اللَّهُ أَحَدٌ', latin: 'Qul huwallahu ahad', meaning: 'Katakanlah: Dialah Allah Yang Maha Esa.', note: 'Surat pendek ini cocok untuk latihan hafalan awal dan pengenalan makna tauhid.', practice: 'Baca ayat pertama tiga kali, lalu sebutkan satu sifat Allah yang kamu ingat.' },
      { id: 'juz30-falaq', title: 'Al-Falaq: meminta perlindungan', arabic: 'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ', latin: "Qul a'udzu birabbil falaq", meaning: 'Aku berlindung kepada Tuhan yang menguasai waktu subuh.', note: 'Ajarkan anak membaca doa perlindungan dengan tenang, bukan dengan rasa takut.', practice: 'Baca bersama sebelum tidur, lalu ceritakan kapan kita perlu berdoa memohon perlindungan.' },
      { id: 'juz30-asr', title: 'Al-Asr: menjaga waktu', arabic: 'وَالْعَصْرِ', latin: 'Wal-asr', meaning: 'Demi masa.', note: 'Surat Al-Asr bisa dikaitkan dengan disiplin belajar, shalat tepat waktu, dan saling menasihati.', practice: 'Pilih satu kegiatan baik hari ini yang mau dikerjakan tepat waktu.' },
    ],
  },
  {
    id: 'tajwid-basic-free', island: 'quran', tier: 'free', title: 'Tajwid Dasar', subtitle: 'Dengar jelas, dengung, dan pantulan', badge: 'Free Trial', focus: 'Izhar Halqi, Idgham Bighunnah, Iqlab, Ikhfa, dan Qalqalah dengan contoh surat pendek.', sample: 'مِنْ شَرِّ - وَانْحَرْ - أَحَدٌ', sourceNote: 'Diadaptasi dari tajwidData: nun mati/tanwin, qalqalah, dan makharij dasar.', cta: 'Buka latihan tajwid',
    lessons: [
      { id: 'tajwid-izhar', title: 'Izhar: dibaca jelas', arabic: 'وَانْحَرْ', latin: 'wanhar', meaning: 'Contoh nun sukun bertemu ha.', note: 'Izhar dibaca jelas tanpa dengung panjang. Cocok untuk latihan mendengar perbedaan suara.', practice: 'Ucapkan "an-har" pelan, lalu ulangi lebih rapi tanpa menelan huruf ha.' },
      { id: 'tajwid-ikhfa', title: 'Ikhfa: samar berdengung', arabic: 'مِنْ شَرِّ', latin: 'min syarri', meaning: 'Contoh nun sukun bertemu syin.', note: 'Suara nun dibuat samar dan diberi dengung ringan.', practice: 'Bandingkan bacaan jelas dan samar. Pilih mana yang terdengar lebih lembut.' },
      { id: 'tajwid-qalqalah', title: 'Qalqalah: pantulan ringan', arabic: 'أَحَدٌ', latin: 'ahad', meaning: 'Huruf dal di akhir kata dipantulkan ringan saat berhenti.', note: 'Pantulan jangan berlebihan. Cukup terasa jelas di akhir bacaan.', practice: 'Baca "ahad" sambil berhenti di akhir, lalu dengarkan pantulan dal.' },
    ],
  },
  {
    id: 'iqra-2-6-account', island: 'quran', tier: 'account', title: "Iqra' Jilid 2-6", subtitle: 'Kasrah, dhammah, tanwin, mad, waqaf, dan gharib', badge: 'Gratis dengan Akun', focus: 'Latihan bertahap dari harakat i/u sampai hukum nun sukun, tanda waqaf, dan persiapan mushaf.', sample: 'بِ - بُ - بًا - بَا - مَنْ آمَنَ', sourceNote: "Materi gratis lanjutan untuk pemain yang sudah masuk atau mendaftar akun Brightoria.", cta: 'Buka materi Iqra',
    lessons: [
      { id: 'iqra-2-kasrah', title: 'Kasrah dan dhammah', arabic: 'بِ بُ تِ تُ', latin: 'bi, bu, ti, tu', meaning: 'Mengenal bunyi pendek i dan u.', note: 'Materi lanjutan gratis untuk mengenali harakat secara bertahap setelah masuk ke akun.', practice: 'Baca pasangan bi-bu, ti-tu, lalu bedakan posisi tanda harakatnya.' },
      { id: 'iqra-4-mad', title: 'Mad pendek-panjang', arabic: 'بَ - بَا', latin: 'ba - baa', meaning: 'Membedakan bunyi pendek dan panjang.', note: 'Anak mulai belajar tidak semua huruf dibaca dengan durasi sama.', practice: 'Tepuk satu kali untuk ba pendek, dua kali untuk baa panjang.' },
    ],
  },
  {
    id: 'quran-30juz-premium', island: 'quran', tier: 'premium', title: 'Tilawah 30 Juz', subtitle: 'Jelajah mushaf penuh dengan panduan ayat', badge: 'Premium', focus: 'Mushaf lengkap, hafalan/murojaah lebih luas, dan materi lanjutan setelah Juz 30.', sample: 'الفاتحة - البقرة - آل عمران', sourceNote: 'Diadaptasi dari planFeatures: pro membuka cakupan 30 juz penuh.', cta: 'Buka materi tilawah',
    lessons: [
      { id: 'tilawah-fatihah', title: 'Al-Fatihah: pembuka tilawah', arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', latin: 'Bismillahir rahmanir rahim', meaning: 'Dengan nama Allah Yang Maha Pengasih, Maha Penyayang.', note: 'Jalur Premium mengarahkan anak membaca tartil dan memahami adab memulai bacaan.', practice: 'Baca basmalah dengan tenang sebelum memulai latihan hari ini.' },
      { id: 'tilawah-murojaah', title: 'Rencana murojaah', arabic: 'مُرَاجَعَة', latin: "muroja'ah", meaning: 'Mengulang hafalan agar tetap kuat.', note: 'Mode penuh dapat diarahkan menjadi jadwal hafalan dan pengulangan ayat.', practice: 'Pilih satu surat yang sudah hafal, ulangi satu kali dengan suara pelan.' },
    ],
  },
  {
    id: 'quran-vocab-free', island: 'arabic', tier: 'free', title: "Mufrodat Qur'an Dasar", subtitle: 'Kosakata dari surat pendek', badge: 'Free Trial', focus: 'Anak mengenal arti kata Rabb, Ar-Rahman, An-Nas, Al-Falaq, Ash-Shamad, dan Al-Kawthar.', sample: 'رَبِّ - الرَّحْمَٰنِ - النَّاسِ - الْفَلَقِ', sourceNote: 'Diadaptasi dari QURAN_VOCABULARY_LIST dan MUFRODAT_LEVELS level 1.', cta: 'Buka kamus dasar',
    lessons: [
      { id: 'vocab-rabb', title: 'Rabb', arabic: 'رَبِّ', latin: 'Rabb', meaning: 'Tuhan yang memelihara dan mengatur.', note: 'Kata ini sering muncul dalam doa dan surat pendek.', practice: 'Cocokkan kata Rabb dengan makna: Tuhan yang memelihara.' },
      { id: 'vocab-rahman', title: 'Ar-Rahman', arabic: 'الرَّحْمَٰنِ', latin: 'Ar-Rahman', meaning: 'Maha Pengasih.', note: 'Anak dapat mengaitkannya dengan kasih sayang Allah kepada semua makhluk.', practice: 'Sebutkan satu nikmat Allah hari ini, lalu ucapkan Alhamdulillah.' },
      { id: 'vocab-nas', title: 'An-Nas', arabic: 'النَّاسِ', latin: 'An-Nas', meaning: 'Manusia.', note: 'Muncul dalam surat An-Nas dan membantu anak memahami tema perlindungan.', practice: 'Pilih kartu arti "manusia" saat melihat kata An-Nas.' },
      { id: 'vocab-kawthar', title: 'Al-Kawthar', arabic: 'الْكَوْثَرَ', latin: 'Al-Kawthar', meaning: 'Nikmat yang banyak.', note: 'Kata ini cocok dikaitkan dengan rasa syukur.', practice: 'Tuliskan atau ucapkan satu nikmat yang ingin kamu syukuri.' },
    ],
  },
  {
    id: 'quran-vocab-premium', island: 'arabic', tier: 'premium', title: "Kamus Qur'an Lanjutan", subtitle: 'Akar kata dan arti pilihan dari lebih banyak surah', badge: 'Premium', focus: 'Mufrodat Al-Fatihah, Ayat Kursi, Al-Mulk, dan tema pilihan seperti syukur, cahaya, petunjuk, hati.', sample: 'الْكِتَابُ - نُورٌ - الْهُدَى - الشُّكْرُ', sourceNote: 'Diadaptasi dari kamus mufrodat dan level penjelajah 114 surah.', cta: 'Buka kamus lanjutan',
    lessons: [
      { id: 'vocab-kitab', title: 'Al-Kitab', arabic: 'الْكِتَابُ', latin: 'Al-Kitab', meaning: 'Kitab.', note: 'Materi Premium untuk kosakata yang lebih luas lintas surah.', practice: 'Cari kata yang artinya kitab, lalu hubungkan dengan mushaf Al-Quran.' },
      { id: 'vocab-nur', title: 'Nur', arabic: 'نُورٌ', latin: 'Nur', meaning: 'Cahaya.', note: 'Kata tema yang bisa dipakai untuk mengenalkan makna petunjuk dan kebaikan.', practice: 'Sebutkan satu perbuatan baik yang bisa menjadi cahaya hari ini.' },
      { id: 'vocab-shukr', title: 'Syukr', arabic: 'الشُّكْرُ', latin: 'Asy-Syukr', meaning: 'Rasa syukur.', note: 'Kosakata ini bisa disambungkan ke adab harian dan akhlak.', practice: 'Ucapkan terima kasih kepada orang yang membantumu hari ini.' },
    ],
  },
  {
    id: 'adab-daily-free', island: 'adab', tier: 'free', title: 'Adab Harian Santri', subtitle: 'Tugas kecil yang bisa dipraktikkan hari ini', badge: 'Free Trial', focus: 'Salam, doa orang tua, merapikan mushaf, murojaah harian, dan adab makan.', sample: 'Basmalah, salam, shalat tepat waktu, murojaah satu surat.', sourceNote: 'Diadaptasi dari adabService: daily Islamic tasks untuk anak.', cta: 'Buka tugas harian',
    lessons: [
      { id: 'adab-basmalah', title: 'Mulai dengan basmalah', arabic: 'بِسْمِ اللَّهِ', latin: 'Bismillah', meaning: 'Dengan nama Allah.', note: 'Latihan sederhana sebelum makan, belajar, atau memulai tugas.', practice: 'Sebelum aktivitas berikutnya, ucapkan basmalah dengan sadar dan pelan.' },
      { id: 'adab-salam', title: 'Salam yang hangat', arabic: 'السَّلَامُ عَلَيْكُمْ', latin: "Assalamu'alaikum", meaning: 'Semoga keselamatan tercurah untukmu.', note: 'Adab salam mengajarkan doa, keramahan, dan izin masuk.', practice: 'Saat bertemu keluarga, mulai dengan salam dan wajah ceria.' },
      { id: 'adab-mushaf', title: 'Merapikan mushaf', arabic: 'الْقُرآنُ', latin: 'Al-Quran', meaning: 'Kitab suci Al-Quran.', note: 'Anak belajar menjaga mushaf dan alat belajar dengan hormat.', practice: 'Rapikan mushaf atau buku ngaji setelah selesai belajar.' },
    ],
  },
  {
    id: 'adab-quran-premium', island: 'adab', tier: 'premium', title: 'Akhlak dari Kisah Surat', subtitle: 'Hikmah anak dari tafsir dan asbabun nuzul', badge: 'Premium', focus: 'Al-Fil tentang tawakkal, Quraisy tentang syukur, Ad-Duha tentang harapan, Al-Asr tentang waktu.', sample: 'Syukur, sabar, amanah, sayang sesama, dan cinta ilmu.', sourceNote: 'Diadaptasi dari tafsirData dan asbabNuzulData, tetap perlu validasi akademik.', cta: 'Buka materi hikmah',
    lessons: [
      { id: 'hikmah-fil', title: 'Al-Fil: tawakkal', arabic: 'أَلَمْ تَرَ كَيْفَ فَعَلَ رَبُّكَ', latin: "Alam tara kayfa fa'ala rabbuk", meaning: 'Tidakkah engkau memperhatikan bagaimana Tuhanmu bertindak.', note: 'Untuk anak, hikmahnya adalah percaya kepada pertolongan Allah sambil tetap berbuat baik.', practice: 'Ceritakan satu hal sulit, lalu sebutkan ikhtiar baik yang bisa dilakukan.' },
      { id: 'hikmah-quraisy', title: 'Quraisy: syukur atas nikmat', arabic: 'فَلْيَعْبُدُوا رَبَّ هَٰذَا الْبَيْتِ', latin: "Falya'budu rabba hadzal bait", meaning: 'Maka hendaklah mereka menyembah Tuhan pemilik rumah ini.', note: 'Anak diajak melihat nikmat aman, makanan, keluarga, dan belajar.', practice: 'Sebutkan dua nikmat hari ini dan satu cara mensyukurinya.' },
      { id: 'hikmah-duha', title: 'Ad-Duha: harapan', arabic: 'وَلَلْآخِرَةُ خَيْرٌ لَكَ مِنَ الْأُولَىٰ', latin: 'Walal-akhiratu khairul laka minal ula', meaning: 'Akhirat lebih baik bagimu daripada yang permulaan.', note: 'Hikmah anak: jangan mudah putus asa saat belajar belum lancar.', practice: 'Pilih satu latihan yang sulit, lalu ulangi sekali lagi dengan sabar.' },
      { id: 'hikmah-asr', title: 'Al-Asr: waktu dan nasihat', arabic: 'وَتَوَاصَوْا بِالْحَقِّ', latin: 'Wa tawashaw bil-haqq', meaning: 'Saling menasihati dalam kebenaran.', note: 'Anak belajar memakai waktu untuk kebaikan dan menasihati teman dengan lembut.', practice: 'Ajak satu teman melakukan kebaikan kecil tanpa memaksa.' },
    ],
  },
];

export const quranFreeTrialItems = quranPathItems.filter((item) => item.tier === 'free');
export const quranAccountItems = quranPathItems.filter((item) => item.tier === 'account');
export const quranPremiumItems = quranPathItems.filter((item) => item.tier === 'premium');

export const quranItemsByIsland = (island: QuranPathItem['island']) =>
  quranPathItems.filter((item) => item.island === island);

export const findQuranPathItem = (id: string) =>
  quranPathItems.find((item) => item.id === id) ?? null;
