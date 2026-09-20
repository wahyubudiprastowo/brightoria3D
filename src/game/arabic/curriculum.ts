/**
 * curriculum.ts — Sumber data mentah untuk Oasis Bahasa Arab (Patch 25).
 *
 * SUMBER: "Al-Mumtaaz Untuk Anak Jilid 1" — buku ajar Bahasa Arab untuk
 * anak dari Kampung Bahasa Arab BISA / BISA Learning Centre (materi asli
 * yang diberikan user, BUKAN draft AI). Tidak berubah dari Patch 23/24.
 *
 * Rebrand tetap dipertahankan: dialog d5 (pelajaran 1) menjawab
 * "Aku belajar di Bright Academy" (bukan lagi "sekolah BISA").
 *
 * CATATAN JUJUR:
 * 1. Emoji = bantu-visual sementara, BUKAN ilustrasi asli buku.
 * 2. Audio: tombol "Dengarkan" berbasis Web Speech API (arabicTts.ts) —
 *    BUKAN rekaman native speaker.
 * 3. Tetap disarankan direview pengajar Bahasa Arab sebelum dipakai
 *    siswa sungguhan secara luas.
 */

export interface ArabicWord {
  id: string;
  arabic: string;
  translit: string;
  meaning: string;
  emoji: string;
}

export interface DialogueExchange {
  id: string;
  question: { arabic: string; translit: string; meaning: string };
  answer: { arabic: string; translit: string; meaning: string };
}

export interface CurriculumLesson {
  id: string;
  lessonNumber: number;
  title: string;
  arabicTitle: string;
  icon: string;
  kind: 'vocab' | 'dialogue';
  words?: ArabicWord[];
  dialogues?: DialogueExchange[];
}

export const curriculum: CurriculumLesson[] = [
  {
    id: 'l1',
    lessonNumber: 1,
    title: 'Salam & Perkenalan',
    arabicTitle: 'التَّحِيَّةُ وَالتَّعَارُفُ',
    icon: '🤝',
    kind: 'dialogue',
    dialogues: [
      {
        id: 'd1',
        question: { arabic: 'السَّلَامُ عَلَيْكُمْ', translit: 'as-salāmu ʿalaykum', meaning: 'Semoga keselamatan atasmu' },
        answer: { arabic: 'وَعَلَيْكُمُ السَّلَامُ وَرَحْمَةُ اللهِ وَبَرَكَتُهُ', translit: 'wa ʿalaykumus salām', meaning: 'Dan atasmu juga keselamatan' },
      },
      {
        id: 'd2',
        question: { arabic: 'مَا اسْمُكَ؟', translit: 'mā ismuka?', meaning: 'Siapa namamu? (laki-laki)' },
        answer: { arabic: 'اِسْمِيْ أَحْمَدُ', translit: 'ismī Aḥmad', meaning: 'Namaku Ahmad' },
      },
      {
        id: 'd3',
        question: { arabic: 'كَيْفَ حَالُكَ؟', translit: 'kayfa ḥāluka?', meaning: 'Bagaimana kabarmu?' },
        answer: { arabic: 'الْحَمْدُ لِلهِ، أَنَا بِخَيْرٍ', translit: 'al-ḥamdulillāh, anā bikhayr', meaning: 'Alhamdulillah, aku baik-baik saja' },
      },
      {
        id: 'd4',
        question: { arabic: 'أَيْنَ تَسْكُنُ؟', translit: 'ayna taskunu?', meaning: 'Di mana kamu tinggal?' },
        answer: { arabic: 'أَسْكُنُ فِيْ جَاكَرْتَا', translit: 'askunu fī Jakarta', meaning: 'Aku tinggal di Jakarta' },
      },
      {
        id: 'd5',
        question: { arabic: 'أَيْنَ تَدْرُسُ؟', translit: 'ayna tadrusu?', meaning: 'Di mana kamu belajar?' },
        answer: {
          arabic: 'أَدْرُسُ فِيْ أَكَادِيْمِيَّةِ بِرَايْت',
          translit: 'adrusu fī akādīmiyyati Brayt',
          meaning: 'Aku belajar di Bright Academy',
        },
      },
      {
        id: 'd6',
        question: { arabic: 'كَمْ عُمْرُكَ؟', translit: 'kam ʿumruka?', meaning: 'Berapa umurmu?' },
        answer: { arabic: 'عُمْرِيْ سَبْعُ سَنَوَاتٍ', translit: 'ʿumrī sabʿu sanawāt', meaning: 'Umurku tujuh tahun' },
      },
      {
        id: 'd7',
        question: { arabic: 'إِلَى اللِّقَاءِ', translit: 'ilal liqāʾ', meaning: 'Sampai jumpa' },
        answer: { arabic: 'مَعَ السَّلَامَةِ', translit: 'maʿas salāmah', meaning: 'Semoga selamat (balasan pamit)' },
      },
    ],
  },
  {
    id: 'l2',
    lessonNumber: 2,
    title: 'Anggota Tubuh',
    arabicTitle: 'أَعْضَاءُ الجِسْمِ',
    icon: '🧍',
    kind: 'vocab',
    words: [
      { id: 'l2-w1', arabic: 'رَأْسٌ', translit: 'raʾs', meaning: 'kepala', emoji: '🙂' },
      { id: 'l2-w2', arabic: 'شَعْرٌ', translit: 'shaʿr', meaning: 'rambut', emoji: '💇' },
      { id: 'l2-w3', arabic: 'أُذُنٌ', translit: 'udhun', meaning: 'telinga', emoji: '👂' },
      { id: 'l2-w4', arabic: 'عَيْنٌ', translit: 'ʿayn', meaning: 'mata', emoji: '👁️' },
      { id: 'l2-w5', arabic: 'أَنْفٌ', translit: 'anf', meaning: 'hidung', emoji: '👃' },
      { id: 'l2-w6', arabic: 'فَمٌ', translit: 'fam', meaning: 'mulut', emoji: '👄' },
      { id: 'l2-w7', arabic: 'لِسَانٌ', translit: 'lisān', meaning: 'lidah', emoji: '👅' },
      { id: 'l2-w8', arabic: 'سِنٌّ', translit: 'sinn', meaning: 'gigi', emoji: '🦷' },
      { id: 'l2-w9', arabic: 'صَدْرٌ', translit: 'ṣadr', meaning: 'dada', emoji: '🫁' },
      { id: 'l2-w10', arabic: 'بَطْنٌ', translit: 'baṭn', meaning: 'perut', emoji: '🫄' },
      { id: 'l2-w11', arabic: 'يَدٌ', translit: 'yad', meaning: 'tangan', emoji: '✋' },
      { id: 'l2-w12', arabic: 'رِجْلٌ', translit: 'rijl', meaning: 'kaki', emoji: '🦵' },
    ],
  },
  {
    id: 'l3',
    lessonNumber: 3,
    title: 'Ruang Kelas',
    arabicTitle: 'الفَصْلُ',
    icon: '📚',
    kind: 'vocab',
    words: [
      { id: 'l3-w1', arabic: 'بَابٌ', translit: 'bāb', meaning: 'pintu', emoji: '🚪' },
      { id: 'l3-w2', arabic: 'كِتَابٌ', translit: 'kitāb', meaning: 'buku', emoji: '📖' },
      { id: 'l3-w3', arabic: 'دَفْتَرٌ', translit: 'daftar', meaning: 'buku tulis', emoji: '📓' },
      { id: 'l3-w4', arabic: 'قَلَمٌ', translit: 'qalam', meaning: 'pena', emoji: '✏️' },
      { id: 'l3-w5', arabic: 'مَكْتَبٌ', translit: 'maktab', meaning: 'meja', emoji: '🗄️' },
      { id: 'l3-w6', arabic: 'كُرْسِيٌّ', translit: 'kursiy', meaning: 'kursi', emoji: '🪑' },
      { id: 'l3-w7', arabic: 'نَافِذَةٌ', translit: 'nāfidhah', meaning: 'jendela', emoji: '🪟' },
      { id: 'l3-w8', arabic: 'سَبُّوْرَةٌ', translit: 'sabbūrah', meaning: 'papan tulis', emoji: '📋' },
      { id: 'l3-w9', arabic: 'حَقِيْبَةٌ', translit: 'ḥaqībah', meaning: 'tas', emoji: '🎒' },
      { id: 'l3-w10', arabic: 'مِسْطَرَةٌ', translit: 'misṭarah', meaning: 'penggaris', emoji: '📏' },
      { id: 'l3-w11', arabic: 'مِمْحَاةٌ', translit: 'mimḥāh', meaning: 'penghapus', emoji: '🧼' },
    ],
  },
  {
    id: 'l4',
    lessonNumber: 4,
    title: 'Angka 1-5',
    arabicTitle: 'الأَرْقَامُ ١-٥',
    icon: '🔢',
    kind: 'vocab',
    words: [
      { id: 'l4-w1', arabic: 'وَاحِدٌ', translit: 'wāḥid', meaning: 'satu (1)', emoji: '1️⃣' },
      { id: 'l4-w2', arabic: 'اِثْنَانِ', translit: 'ithnān', meaning: 'dua (2)', emoji: '2️⃣' },
      { id: 'l4-w3', arabic: 'ثَلَاثَةٌ', translit: 'thalāthah', meaning: 'tiga (3)', emoji: '3️⃣' },
      { id: 'l4-w4', arabic: 'أَرْبَعَةٌ', translit: 'arbaʿah', meaning: 'empat (4)', emoji: '4️⃣' },
      { id: 'l4-w5', arabic: 'خَمْسَةٌ', translit: 'khamsah', meaning: 'lima (5)', emoji: '5️⃣' },
    ],
  },
  {
    id: 'l5',
    lessonNumber: 5,
    title: 'Angka 6-10',
    arabicTitle: 'الأَرْقَامُ ٦-١٠',
    icon: '🔢',
    kind: 'vocab',
    words: [
      { id: 'l5-w1', arabic: 'سِتَّةٌ', translit: 'sittah', meaning: 'enam (6)', emoji: '6️⃣' },
      { id: 'l5-w2', arabic: 'سَبْعَةٌ', translit: 'sabʿah', meaning: 'tujuh (7)', emoji: '7️⃣' },
      { id: 'l5-w3', arabic: 'ثَمَانِيَةٌ', translit: 'thamāniyah', meaning: 'delapan (8)', emoji: '8️⃣' },
      { id: 'l5-w4', arabic: 'تِسْعَةٌ', translit: 'tisʿah', meaning: 'sembilan (9)', emoji: '9️⃣' },
      { id: 'l5-w5', arabic: 'عَشَرَةٌ', translit: 'ʿasharah', meaning: 'sepuluh (10)', emoji: '🔟' },
    ],
  },
  {
    id: 'l6',
    lessonNumber: 6,
    title: 'Transportasi',
    arabicTitle: 'المُوَاصَلَاتُ',
    icon: '🚗',
    kind: 'vocab',
    words: [
      { id: 'l6-w1', arabic: 'قِطَارٌ', translit: 'qiṭār', meaning: 'kereta', emoji: '🚆' },
      { id: 'l6-w2', arabic: 'زَوْرَقٌ', translit: 'zawraq', meaning: 'perahu', emoji: '🛶' },
      { id: 'l6-w3', arabic: 'دَرَّاجَةٌ', translit: 'darrājah', meaning: 'sepeda', emoji: '🚲' },
      { id: 'l6-w4', arabic: 'سَيَّارَةٌ', translit: 'sayyārah', meaning: 'mobil', emoji: '🚗' },
      { id: 'l6-w5', arabic: 'شَاحِنَةٌ', translit: 'shāḥinah', meaning: 'truk', emoji: '🚚' },
      { id: 'l6-w6', arabic: 'طَائِرَةٌ', translit: 'ṭāʾirah', meaning: 'pesawat', emoji: '✈️' },
      { id: 'l6-w7', arabic: 'حَافِلَةٌ', translit: 'ḥāfilah', meaning: 'bus', emoji: '🚌' },
      { id: 'l6-w8', arabic: 'سَفِيْنَةٌ', translit: 'safīnah', meaning: 'kapal', emoji: '🚢' },
    ],
  },
  {
    id: 'l7',
    lessonNumber: 7,
    title: 'Keluarga',
    arabicTitle: 'العَائِلَةُ',
    icon: '👨‍👩‍👧‍👦',
    kind: 'vocab',
    words: [
      { id: 'l7-w1', arabic: 'جَدٌّ', translit: 'jadd', meaning: 'kakek', emoji: '👴' },
      { id: 'l7-w2', arabic: 'جَدَّةٌ', translit: 'jaddah', meaning: 'nenek', emoji: '👵' },
      { id: 'l7-w3', arabic: 'أَبٌ', translit: 'ab', meaning: 'ayah', emoji: '👨' },
      { id: 'l7-w4', arabic: 'أُمٌّ', translit: 'umm', meaning: 'ibu', emoji: '👩' },
      { id: 'l7-w5', arabic: 'عَمٌّ', translit: 'ʿamm', meaning: 'paman', emoji: '🧔' },
      { id: 'l7-w6', arabic: 'عَمَّةٌ', translit: 'ʿammah', meaning: 'bibi', emoji: '👩‍🦱' },
      { id: 'l7-w7', arabic: 'أَخٌ', translit: 'akh', meaning: 'saudara laki-laki', emoji: '👦' },
      { id: 'l7-w8', arabic: 'أُخْتٌ', translit: 'ukht', meaning: 'saudara perempuan', emoji: '👧' },
    ],
  },
  {
    id: 'l8',
    lessonNumber: 8,
    title: 'Rumah (1) — Ruangan',
    arabicTitle: 'البَيْتُ ١',
    icon: '🏠',
    kind: 'vocab',
    words: [
      { id: 'l8-w1', arabic: 'بَيْتٌ', translit: 'bayt', meaning: 'rumah', emoji: '🏠' },
      { id: 'l8-w2', arabic: 'غُرْفَةٌ', translit: 'ghurfah', meaning: 'kamar', emoji: '🛋️' },
      { id: 'l8-w3', arabic: 'مَطْبَخٌ', translit: 'maṭbakh', meaning: 'dapur', emoji: '🍳' },
      { id: 'l8-w4', arabic: 'حَمَّامٌ', translit: 'ḥammām', meaning: 'kamar mandi', emoji: '🚿' },
    ],
  },
  {
    id: 'l9',
    lessonNumber: 9,
    title: 'Rumah (2) — Kamar Tidur',
    arabicTitle: 'البَيْتُ ٢',
    icon: '🛏️',
    kind: 'vocab',
    words: [
      { id: 'l9-w1', arabic: 'سَرِيْرٌ', translit: 'sarīr', meaning: 'ranjang', emoji: '🛏️' },
      { id: 'l9-w2', arabic: 'فِرَاشٌ', translit: 'firāsh', meaning: 'kasur', emoji: '🛌' },
      { id: 'l9-w3', arabic: 'وِسَادَةٌ', translit: 'wisādah', meaning: 'bantal', emoji: '💤' },
      { id: 'l9-w4', arabic: 'لِحَافٌ', translit: 'liḥāf', meaning: 'selimut', emoji: '🧣' },
    ],
  },
  {
    id: 'l10',
    lessonNumber: 10,
    title: 'Rumah (3) — Perabot',
    arabicTitle: 'البَيْتُ ٣',
    icon: '🪞',
    kind: 'vocab',
    words: [
      { id: 'l10-w1', arabic: 'جِدَارٌ', translit: 'jidār', meaning: 'dinding', emoji: '🧱' },
      { id: 'l10-w2', arabic: 'سَاعَةٌ', translit: 'sāʿah', meaning: 'jam', emoji: '🕐' },
      { id: 'l10-w3', arabic: 'مِصْبَاحٌ', translit: 'miṣbāḥ', meaning: 'lampu', emoji: '💡' },
      { id: 'l10-w4', arabic: 'مِرْوَحَةٌ', translit: 'mirwaḥah', meaning: 'kipas angin', emoji: '🌀' },
      { id: 'l10-w5', arabic: 'خِزَانَةٌ', translit: 'khizānah', meaning: 'lemari', emoji: '🗄️' },
      { id: 'l10-w6', arabic: 'مِرْآةٌ', translit: 'mirʾāh', meaning: 'cermin', emoji: '🪞' },
      { id: 'l10-w7', arabic: 'مُشْطٌ', translit: 'mushṭ', meaning: 'sisir', emoji: '💈' },
    ],
  },
  {
    id: 'l11',
    lessonNumber: 11,
    title: 'Rumah (4) — Dapur & Mandi',
    arabicTitle: 'البَيْتُ ٤',
    icon: '🧼',
    kind: 'vocab',
    words: [
      { id: 'l11-w1', arabic: 'مَاءٌ', translit: 'māʾ', meaning: 'air', emoji: '💧' },
      { id: 'l11-w2', arabic: 'صَابُوْنٌ', translit: 'ṣābūn', meaning: 'sabun', emoji: '🧼' },
      { id: 'l11-w3', arabic: 'مِغْرَفَةٌ', translit: 'mighrafah', meaning: 'centong/sendok sayur', emoji: '🥄' },
      { id: 'l11-w4', arabic: 'مِنْشَفَةٌ', translit: 'minshafah', meaning: 'handuk', emoji: '🧻' },
      { id: 'l11-w5', arabic: 'مِلْعَقَةٌ', translit: 'milʿaqah', meaning: 'sendok', emoji: '🥄' },
      { id: 'l11-w6', arabic: 'صَحْنٌ', translit: 'ṣaḥn', meaning: 'piring', emoji: '🍽️' },
      { id: 'l11-w7', arabic: 'كُوْبٌ', translit: 'kūb', meaning: 'gelas', emoji: '🥤' },
      { id: 'l11-w8', arabic: 'مِنْدِيْلٌ', translit: 'mindīl', meaning: 'tisu/sapu tangan', emoji: '🧻' },
    ],
  },
  {
    id: 'l12',
    lessonNumber: 12,
    title: 'Buah-buahan (1)',
    arabicTitle: 'الفَوَاكِهُ ١',
    icon: '🍎',
    kind: 'vocab',
    words: [
      { id: 'l12-w1', arabic: 'تُفَّاحٌ', translit: 'tuffāḥ', meaning: 'apel', emoji: '🍎' },
      { id: 'l12-w2', arabic: 'بُرْتُقَالٌ', translit: 'burtuqāl', meaning: 'jeruk', emoji: '🍊' },
      { id: 'l12-w3', arabic: 'عِنَبٌ', translit: 'ʿinab', meaning: 'anggur', emoji: '🍇' },
      { id: 'l12-w4', arabic: 'رُمَّانٌ', translit: 'rummān', meaning: 'delima', emoji: '🔴' },
      { id: 'l12-w5', arabic: 'تَمْرٌ', translit: 'tamr', meaning: 'kurma', emoji: '🟤' },
      { id: 'l12-w6', arabic: 'نَارَجِيْلٌ', translit: 'nārajīl', meaning: 'kelapa', emoji: '🥥' },
    ],
  },
  {
    id: 'l13',
    lessonNumber: 13,
    title: 'Buah-buahan (2)',
    arabicTitle: 'الفَوَاكِهُ ٢',
    icon: '🍉',
    kind: 'vocab',
    words: [
      { id: 'l13-w1', arabic: 'بِطِّيْخٌ', translit: 'biṭṭīkh', meaning: 'semangka', emoji: '🍉' },
      { id: 'l13-w2', arabic: 'بَابَايَا', translit: 'bābāyā', meaning: 'pepaya', emoji: '🟠' },
      { id: 'l13-w3', arabic: 'أَنَانَاسٌ', translit: 'anānās', meaning: 'nanas', emoji: '🍍' },
      { id: 'l13-w4', arabic: 'شَمَّامٌ', translit: 'shammām', meaning: 'melon', emoji: '🍈' },
      { id: 'l13-w5', arabic: 'مَوْزٌ', translit: 'mawz', meaning: 'pisang', emoji: '🍌' },
      { id: 'l13-w6', arabic: 'فَرَاوِلَةٌ', translit: 'farāwilah', meaning: 'stroberi', emoji: '🍓' },
    ],
  },
  {
    id: 'l14',
    lessonNumber: 14,
    title: 'Makanan',
    arabicTitle: 'الطَّعَامُ',
    icon: '🍚',
    kind: 'vocab',
    words: [
      { id: 'l14-w1', arabic: 'لَحْمٌ', translit: 'laḥm', meaning: 'daging', emoji: '🥩' },
      { id: 'l14-w2', arabic: 'خُبْزٌ', translit: 'khubz', meaning: 'roti', emoji: '🍞' },
      { id: 'l14-w3', arabic: 'رُزٌّ', translit: 'ruzz', meaning: 'nasi', emoji: '🍚' },
      { id: 'l14-w4', arabic: 'مَكْرُوْنَةٌ', translit: 'makarūnah', meaning: 'makaroni', emoji: '🍝' },
      { id: 'l14-w5', arabic: 'خُضْرَوَاتٌ', translit: 'khuḍrawāt', meaning: 'sayuran', emoji: '🥦' },
      { id: 'l14-w6', arabic: 'سَمَكٌ', translit: 'samak', meaning: 'ikan', emoji: '🐟' },
      { id: 'l14-w7', arabic: 'دَجَاجَةٌ', translit: 'dajājah', meaning: 'ayam', emoji: '🍗' },
      { id: 'l14-w8', arabic: 'بَيْضٌ', translit: 'bayḍ', meaning: 'telur', emoji: '🥚' },
    ],
  },
  {
    id: 'l15',
    lessonNumber: 15,
    title: 'Minuman',
    arabicTitle: 'المَشْرُوْبَاتُ',
    icon: '🧃',
    kind: 'vocab',
    words: [
      { id: 'l15-w1', arabic: 'مَاءٌ', translit: 'māʾ', meaning: 'air', emoji: '💧' },
      { id: 'l15-w2', arabic: 'لَبَنٌ', translit: 'laban', meaning: 'susu', emoji: '🥛' },
      { id: 'l15-w3', arabic: 'شَايٌ', translit: 'shāy', meaning: 'teh', emoji: '🍵' },
      { id: 'l15-w4', arabic: 'قَهْوَةٌ', translit: 'qahwah', meaning: 'kopi', emoji: '☕' },
      { id: 'l15-w5', arabic: 'زَنْجَبِيْلٌ', translit: 'zanjabīl', meaning: 'jahe', emoji: '🫚' },
      { id: 'l15-w6', arabic: 'عَصِيْرٌ', translit: 'ʿaṣīr', meaning: 'jus', emoji: '🧃' },
    ],
  },
  {
    id: 'l16',
    lessonNumber: 16,
    title: 'Warna (1)',
    arabicTitle: 'الأَلْوَانُ ١',
    icon: '🎨',
    kind: 'vocab',
    words: [
      { id: 'l16-w1', arabic: 'أَبْيَضُ', translit: 'abyaḍ', meaning: 'putih', emoji: '⚪' },
      { id: 'l16-w2', arabic: 'أَحْمَرُ', translit: 'aḥmar', meaning: 'merah', emoji: '🔴' },
      { id: 'l16-w3', arabic: 'أَسْوَدُ', translit: 'aswad', meaning: 'hitam', emoji: '⚫' },
      { id: 'l16-w4', arabic: 'أَخْضَرُ', translit: 'akhḍar', meaning: 'hijau', emoji: '🟢' },
      { id: 'l16-w5', arabic: 'أَصْفَرُ', translit: 'aṣfar', meaning: 'kuning', emoji: '🟡' },
      { id: 'l16-w6', arabic: 'أَزْرَقُ', translit: 'azraq', meaning: 'biru', emoji: '🔵' },
    ],
  },
  {
    id: 'l17',
    lessonNumber: 17,
    title: 'Warna (2)',
    arabicTitle: 'الأَلْوَانُ ٢',
    icon: '🎨',
    kind: 'vocab',
    words: [
      { id: 'l17-w1', arabic: 'بُنِّيٌّ', translit: 'bunniy', meaning: 'coklat', emoji: '🟤' },
      { id: 'l17-w2', arabic: 'بُرْتُقَالِيٌّ', translit: 'burtuqāliy', meaning: 'oranye', emoji: '🟠' },
      { id: 'l17-w3', arabic: 'رَمَادِيٌّ', translit: 'ramādiy', meaning: 'abu-abu', emoji: '🩶' },
      { id: 'l17-w4', arabic: 'بَنَفْسَجِيٌّ', translit: 'banafsajiy', meaning: 'ungu', emoji: '🟣' },
      { id: 'l17-w5', arabic: 'وَرْدِيٌّ', translit: 'wardiy', meaning: 'merah muda', emoji: '🩷' },
      { id: 'l17-w6', arabic: 'فِضِّيٌّ', translit: 'fiḍḍiy', meaning: 'perak', emoji: '⬜' },
    ],
  },
];
