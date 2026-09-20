/**
 * curriculum.ts — Sumber data mentah untuk Taman Al-Qur'an: Petualangan
 * Huruf Hijaiyah (Patch 30).
 *
 * SUMBER: "Belajar Menulis Huruf Hijaiyah — Seri 1" (Kampung Bahasa Arab
 * BISA / BISA Learning Centre) — buku yang diberikan user, BUKAN draft AI
 * murni. TIDAK BERUBAH dari Patch 27/28 — dibangun ulang di sini karena
 * sandbox sempat ter-reset antar sesi kerja.
 *
 * CATATAN JUJUR (tetap berlaku):
 * 1. Teks Arab hasil OCR PDF asli berantakan — kata-kata di bawah ini
 *    DIREKONSTRUKSI ULANG dari pengetahuan Bahasa Arab, divalidasi
 *    silang (setiap kata diawali huruf yang bersangkutan). WAJIB
 *    direview pengajar Bahasa Arab/tahsin sebelum dipakai siswa
 *    sungguhan secara luas.
 * 2. Emoji = bantu-visual, BUKAN ilustrasi asli buku.
 */

export interface HijaiyahWord {
  id: string;
  arabic: string;
  translit: string;
  meaning: string;
  emoji: string;
}

export interface HijaiyahLetter {
  id: string;
  letterNumber: number;
  name: string;
  isolated: string;
  initial: string;
  medial: string;
  final: string;
  words: HijaiyahWord[];
}

export const letters: HijaiyahLetter[] = [
  {
    id: 'h1', letterNumber: 1, name: 'Alif', isolated: 'ا', initial: 'ا', medial: 'ـا', final: 'ـا',
    words: [
      { id: 'h1-w1', arabic: 'أَرْنَبٌ', translit: 'arnab', meaning: 'kelinci', emoji: '🐰' },
      { id: 'h1-w2', arabic: 'اِبْنٌ', translit: 'ibn', meaning: 'anak laki-laki', emoji: '👦' },
      { id: 'h1-w3', arabic: 'أَبٌ', translit: 'ab', meaning: 'ayah', emoji: '👨' },
      { id: 'h1-w4', arabic: 'أُمٌّ', translit: 'umm', meaning: 'ibu', emoji: '👩' },
    ],
  },
  {
    id: 'h2', letterNumber: 2, name: 'Ba', isolated: 'ب', initial: 'بـ', medial: 'ـبـ', final: 'ـب',
    words: [
      { id: 'h2-w1', arabic: 'بُرْتُقَالٌ', translit: 'burtuqāl', meaning: 'jeruk', emoji: '🍊' },
      { id: 'h2-w2', arabic: 'بَلَاطٌ', translit: 'balāṭ', meaning: 'lantai', emoji: '🧱' },
      { id: 'h2-w3', arabic: 'بَطَّةٌ', translit: 'baṭṭah', meaning: 'bebek', emoji: '🦆' },
      { id: 'h2-w4', arabic: 'بَابٌ', translit: 'bāb', meaning: 'pintu', emoji: '🚪' },
    ],
  },
  {
    id: 'h3', letterNumber: 3, name: 'Ta', isolated: 'ت', initial: 'تـ', medial: 'ـتـ', final: 'ـت',
    words: [
      { id: 'h3-w1', arabic: 'تُفَّاحٌ', translit: 'tuffāḥ', meaning: 'apel', emoji: '🍎' },
      { id: 'h3-w2', arabic: 'تِمْسَاحٌ', translit: 'timsāḥ', meaning: 'buaya', emoji: '🐊' },
      { id: 'h3-w3', arabic: 'تَاجٌ', translit: 'tāj', meaning: 'mahkota', emoji: '👑' },
      { id: 'h3-w4', arabic: 'تَمْرٌ', translit: 'tamr', meaning: 'kurma', emoji: '🟤' },
    ],
  },
  {
    id: 'h4', letterNumber: 4, name: 'Tsa', isolated: 'ث', initial: 'ثـ', medial: 'ـثـ', final: 'ـث',
    words: [
      { id: 'h4-w1', arabic: 'ثُعْبَانٌ', translit: 'thuʿbān', meaning: 'ular', emoji: '🐍' },
      { id: 'h4-w2', arabic: 'ثِيَابٌ', translit: 'thiyāb', meaning: 'baju', emoji: '👕' },
      { id: 'h4-w3', arabic: 'ثَلَّاجَةٌ', translit: 'thallājah', meaning: 'kulkas', emoji: '🧊' },
      { id: 'h4-w4', arabic: 'ثَعْلَبٌ', translit: 'thaʿlab', meaning: 'rubah', emoji: '🦊' },
    ],
  },
  {
    id: 'h5', letterNumber: 5, name: 'Jim', isolated: 'ج', initial: 'جـ', medial: 'ـجـ', final: 'ـج',
    words: [
      { id: 'h5-w1', arabic: 'جَمَلٌ', translit: 'jamal', meaning: 'onta', emoji: '🐫' },
      { id: 'h5-w2', arabic: 'جَزَرٌ', translit: 'jazar', meaning: 'wortel', emoji: '🥕' },
      { id: 'h5-w3', arabic: 'جُنَّةٌ', translit: 'junnah', meaning: 'perisai', emoji: '🛡️' },
      { id: 'h5-w4', arabic: 'جِدَارٌ', translit: 'jidār', meaning: 'dinding', emoji: '🧱' },
    ],
  },
  {
    id: 'h6', letterNumber: 6, name: 'Ha', isolated: 'ح', initial: 'حـ', medial: 'ـحـ', final: 'ـح',
    words: [
      { id: 'h6-w1', arabic: 'حَقِيْبَةٌ', translit: 'ḥaqībah', meaning: 'tas', emoji: '🎒' },
      { id: 'h6-w2', arabic: 'حَمَّامٌ', translit: 'ḥammām', meaning: 'kamar mandi', emoji: '🚿' },
      { id: 'h6-w3', arabic: 'حِصَانٌ', translit: 'ḥiṣān', meaning: 'kuda', emoji: '🐴' },
      { id: 'h6-w4', arabic: 'حُوْتٌ', translit: 'ḥūt', meaning: 'paus', emoji: '🐳' },
    ],
  },
  {
    id: 'h7', letterNumber: 7, name: 'Kha', isolated: 'خ', initial: 'خـ', medial: 'ـخـ', final: 'ـخ',
    words: [
      { id: 'h7-w1', arabic: 'خَاتَمٌ', translit: 'khātam', meaning: 'cincin', emoji: '💍' },
      { id: 'h7-w2', arabic: 'خَرُوْفٌ', translit: 'kharūf', meaning: 'domba', emoji: '🐑' },
      { id: 'h7-w3', arabic: 'خُبْزٌ', translit: 'khubz', meaning: 'roti', emoji: '🍞' },
      { id: 'h7-w4', arabic: 'خِزَانَةٌ', translit: 'khizānah', meaning: 'lemari', emoji: '🗄️' },
    ],
  },
  {
    id: 'h8', letterNumber: 8, name: 'Dal', isolated: 'د', initial: 'د', medial: 'ـد', final: 'ـد',
    words: [
      { id: 'h8-w1', arabic: 'دَرَّاجَةٌ', translit: 'darrājah', meaning: 'sepeda', emoji: '🚲' },
      { id: 'h8-w2', arabic: 'دَارٌ', translit: 'dār', meaning: 'rumah', emoji: '🏠' },
      { id: 'h8-w3', arabic: 'دُكَّانٌ', translit: 'dukkān', meaning: 'toko', emoji: '🏪' },
      { id: 'h8-w4', arabic: 'دِيْكٌ', translit: 'dīk', meaning: 'ayam jantan', emoji: '🐓' },
    ],
  },
  {
    id: 'h9', letterNumber: 9, name: 'Dzal', isolated: 'ذ', initial: 'ذ', medial: 'ـذ', final: 'ـذ',
    words: [
      { id: 'h9-w1', arabic: 'ذُبَابَةٌ', translit: 'dhubābah', meaning: 'lalat', emoji: '🪰' },
      { id: 'h9-w2', arabic: 'ذَقَنٌ', translit: 'dhaqan', meaning: 'dagu', emoji: '🧑' },
      { id: 'h9-w3', arabic: 'ذَهَبٌ', translit: 'dhahab', meaning: 'emas', emoji: '🟡' },
      { id: 'h9-w4', arabic: 'ذِئْبٌ', translit: 'dhiʾb', meaning: 'srigala', emoji: '🐺' },
    ],
  },
  {
    id: 'h10', letterNumber: 10, name: 'Ra', isolated: 'ر', initial: 'ر', medial: 'ـر', final: 'ـر',
    words: [
      { id: 'h10-w1', arabic: 'رُمَّانٌ', translit: 'rummān', meaning: 'delima', emoji: '🔴' },
      { id: 'h10-w2', arabic: 'رِجْلٌ', translit: 'rijl', meaning: 'kaki', emoji: '🦶' },
      { id: 'h10-w3', arabic: 'رَأْسٌ', translit: 'raʾs', meaning: 'kepala', emoji: '🙂' },
      { id: 'h10-w4', arabic: 'رَفٌّ', translit: 'raff', meaning: 'rak', emoji: '📚' },
    ],
  },
  {
    id: 'h11', letterNumber: 11, name: 'Zay', isolated: 'ز', initial: 'ز', medial: 'ـز', final: 'ـز',
    words: [
      { id: 'h11-w1', arabic: 'زُجَاجَةٌ', translit: 'zujājah', meaning: 'pelita/botol kaca', emoji: '💡' },
      { id: 'h11-w2', arabic: 'زِرٌّ', translit: 'zirr', meaning: 'kancing', emoji: '🔘' },
      { id: 'h11-w3', arabic: 'زَهْرَةٌ', translit: 'zahrah', meaning: 'bunga', emoji: '🌸' },
      { id: 'h11-w4', arabic: 'زَنْجَبِيْلٌ', translit: 'zanjabīl', meaning: 'jahe', emoji: '🫚' },
    ],
  },
  {
    id: 'h12', letterNumber: 12, name: 'Sin', isolated: 'س', initial: 'سـ', medial: 'ـسـ', final: 'ـس',
    words: [
      { id: 'h12-w1', arabic: 'سُكَّرٌ', translit: 'sukkar', meaning: 'gula', emoji: '🧂' },
      { id: 'h12-w2', arabic: 'سِرْوَالٌ', translit: 'sirwāl', meaning: 'celana panjang', emoji: '👖' },
      { id: 'h12-w3', arabic: 'سَمَكٌ', translit: 'samak', meaning: 'ikan', emoji: '🐟' },
      { id: 'h12-w4', arabic: 'سَيَّارَةٌ', translit: 'sayyārah', meaning: 'mobil', emoji: '🚗' },
    ],
  },
  {
    id: 'h13', letterNumber: 13, name: 'Syin', isolated: 'ش', initial: 'شـ', medial: 'ـشـ', final: 'ـش',
    words: [
      { id: 'h13-w1', arabic: 'شُرْطِيٌّ', translit: 'shurṭiy', meaning: 'polisi', emoji: '👮' },
      { id: 'h13-w2', arabic: 'شِهَابٌ', translit: 'shihāb', meaning: 'meteor', emoji: '☄️' },
      { id: 'h13-w3', arabic: 'شَمْسٌ', translit: 'shams', meaning: 'matahari', emoji: '☀️' },
      { id: 'h13-w4', arabic: 'شَمَّامٌ', translit: 'shammām', meaning: 'melon', emoji: '🍈' },
    ],
  },
  {
    id: 'h14', letterNumber: 14, name: 'Shad', isolated: 'ص', initial: 'صـ', medial: 'ـصـ', final: 'ـص',
    words: [
      { id: 'h14-w1', arabic: 'صَابُوْنٌ', translit: 'ṣābūn', meaning: 'sabun', emoji: '🧼' },
      { id: 'h14-w2', arabic: 'صُوْرَةٌ', translit: 'ṣūrah', meaning: 'gambar', emoji: '🖼️' },
      { id: 'h14-w3', arabic: 'صِفْرٌ', translit: 'ṣifr', meaning: 'nol', emoji: '0️⃣' },
      { id: 'h14-w4', arabic: 'صَحْنٌ', translit: 'ṣaḥn', meaning: 'piring', emoji: '🍽️' },
    ],
  },
  {
    id: 'h15', letterNumber: 15, name: 'Dhad', isolated: 'ض', initial: 'ضـ', medial: 'ـضـ', final: 'ـض',
    words: [
      { id: 'h15-w1', arabic: 'ضُيُوْفٌ', translit: 'ḍuyūf', meaning: 'tamu-tamu', emoji: '🙋' },
      { id: 'h15-w2', arabic: 'ضِفْدَعٌ', translit: 'ḍifdaʿ', meaning: 'katak', emoji: '🐸' },
      { id: 'h15-w3', arabic: 'ضَأْنٌ', translit: 'ḍaʾn', meaning: 'domba', emoji: '🐑' },
      { id: 'h15-w4', arabic: 'ضَبٌّ', translit: 'ḍabb', meaning: 'kadal gurun', emoji: '🦎' },
    ],
  },
  {
    id: 'h16', letterNumber: 16, name: 'Tha', isolated: 'ط', initial: 'طـ', medial: 'ـطـ', final: 'ـط',
    words: [
      { id: 'h16-w1', arabic: 'طُيُوْرٌ', translit: 'ṭuyūr', meaning: 'burung-burung', emoji: '🐦' },
      { id: 'h16-w2', arabic: 'طِفْلٌ', translit: 'ṭifl', meaning: 'anak kecil', emoji: '👶' },
      { id: 'h16-w3', arabic: 'طَائِرَةٌ', translit: 'ṭāʾirah', meaning: 'pesawat', emoji: '✈️' },
      { id: 'h16-w4', arabic: 'طَمَاطِمُ', translit: 'ṭamāṭim', meaning: 'tomat', emoji: '🍅' },
    ],
  },
  {
    id: 'h17', letterNumber: 17, name: 'Zha', isolated: 'ظ', initial: 'ظـ', medial: 'ـظـ', final: 'ـظ',
    words: [
      { id: 'h17-w1', arabic: 'ظُفْرٌ', translit: 'ẓufr', meaning: 'kuku', emoji: '💅' },
      { id: 'h17-w2', arabic: 'ظِلٌّ', translit: 'ẓill', meaning: 'bayangan', emoji: '🌑' },
      { id: 'h17-w3', arabic: 'ظَبْيٌ', translit: 'ẓaby', meaning: 'kijang', emoji: '🦌' },
      { id: 'h17-w4', arabic: 'ظَهْرٌ', translit: 'ẓahr', meaning: 'punggung', emoji: '🔙' },
    ],
  },
  {
    id: 'h18', letterNumber: 18, name: 'Ain', isolated: 'ع', initial: 'عـ', medial: 'ـعـ', final: 'ـع',
    words: [
      { id: 'h18-w1', arabic: 'عُصْفُوْرٌ', translit: 'ʿuṣfūr', meaning: 'burung pipit', emoji: '🐦' },
      { id: 'h18-w2', arabic: 'عِنَبٌ', translit: 'ʿinab', meaning: 'anggur', emoji: '🍇' },
      { id: 'h18-w3', arabic: 'عَيْنٌ', translit: 'ʿayn', meaning: 'mata', emoji: '👁️' },
      { id: 'h18-w4', arabic: 'عَصِيْرٌ', translit: 'ʿaṣīr', meaning: 'jus', emoji: '🧃' },
    ],
  },
  {
    id: 'h19', letterNumber: 19, name: 'Ghain', isolated: 'غ', initial: 'غـ', medial: 'ـغـ', final: 'ـغ',
    words: [
      { id: 'h19-w1', arabic: 'غُرْفَةٌ', translit: 'ghurfah', meaning: 'kamar', emoji: '🛋️' },
      { id: 'h19-w2', arabic: 'غِطَاءٌ', translit: 'ghiṭāʾ', meaning: 'tutup', emoji: '📦' },
      { id: 'h19-w3', arabic: 'غَيْمٌ', translit: 'ghaym', meaning: 'awan', emoji: '☁️' },
      { id: 'h19-w4', arabic: 'غَارٌ', translit: 'ghār', meaning: 'gua', emoji: '⛰️' },
    ],
  },
  {
    id: 'h20', letterNumber: 20, name: 'Fa', isolated: 'ف', initial: 'فـ', medial: 'ـفـ', final: 'ـف',
    words: [
      { id: 'h20-w1', arabic: 'فُنْدُقٌ', translit: 'funduq', meaning: 'hotel', emoji: '🏨' },
      { id: 'h20-w2', arabic: 'فِيْلٌ', translit: 'fīl', meaning: 'gajah', emoji: '🐘' },
      { id: 'h20-w3', arabic: 'فَأْرٌ', translit: 'faʾr', meaning: 'tikus', emoji: '🐭' },
      { id: 'h20-w4', arabic: 'فَمٌ', translit: 'fam', meaning: 'mulut', emoji: '👄' },
    ],
  },
  {
    id: 'h21', letterNumber: 21, name: 'Qaf', isolated: 'ق', initial: 'قـ', medial: 'ـقـ', final: 'ـق',
    words: [
      { id: 'h21-w1', arabic: 'قَهْوَةٌ', translit: 'qahwah', meaning: 'kopi', emoji: '☕' },
      { id: 'h21-w2', arabic: 'قِرْدٌ', translit: 'qird', meaning: 'monyet', emoji: '🐒' },
      { id: 'h21-w3', arabic: 'قَمْلٌ', translit: 'qaml', meaning: 'kutu', emoji: '🦟' },
      { id: 'h21-w4', arabic: 'قَمَرٌ', translit: 'qamar', meaning: 'bulan', emoji: '🌙' },
    ],
  },
  {
    id: 'h22', letterNumber: 22, name: 'Kaf', isolated: 'ك', initial: 'كـ', medial: 'ـكـ', final: 'ـك',
    words: [
      { id: 'h22-w1', arabic: 'كُوْبٌ', translit: 'kūb', meaning: 'cangkir', emoji: '🥤' },
      { id: 'h22-w2', arabic: 'كِتَابٌ', translit: 'kitāb', meaning: 'buku', emoji: '📖' },
      { id: 'h22-w3', arabic: 'كَلْبٌ', translit: 'kalb', meaning: 'anjing', emoji: '🐶' },
      { id: 'h22-w4', arabic: 'كَوْكَبٌ', translit: 'kawkab', meaning: 'bintang', emoji: '⭐' },
    ],
  },
  {
    id: 'h23', letterNumber: 23, name: 'Lam', isolated: 'ل', initial: 'لـ', medial: 'ـلـ', final: 'ـل',
    words: [
      { id: 'h23-w1', arabic: 'لُعْبَةٌ', translit: 'luʿbah', meaning: 'mainan', emoji: '🧸' },
      { id: 'h23-w2', arabic: 'لِحَافٌ', translit: 'liḥāf', meaning: 'selimut', emoji: '🛌' },
      { id: 'h23-w3', arabic: 'لَبَنٌ', translit: 'laban', meaning: 'susu', emoji: '🥛' },
      { id: 'h23-w4', arabic: 'لَحْمٌ', translit: 'laḥm', meaning: 'daging', emoji: '🥩' },
    ],
  },
  {
    id: 'h24', letterNumber: 24, name: 'Mim', isolated: 'م', initial: 'مـ', medial: 'ـمـ', final: 'ـم',
    words: [
      { id: 'h24-w1', arabic: 'مُدَرِّسٌ', translit: 'mudarris', meaning: 'pak guru', emoji: '👨‍🏫' },
      { id: 'h24-w2', arabic: 'مِلْعَقَةٌ', translit: 'milʿaqah', meaning: 'sendok', emoji: '🥄' },
      { id: 'h24-w3', arabic: 'مَوْزٌ', translit: 'mawz', meaning: 'pisang', emoji: '🍌' },
      { id: 'h24-w4', arabic: 'مَاءٌ', translit: 'māʾ', meaning: 'air', emoji: '💧' },
    ],
  },
  {
    id: 'h25', letterNumber: 25, name: 'Nun', isolated: 'ن', initial: 'نـ', medial: 'ـنـ', final: 'ـن',
    words: [
      { id: 'h25-w1', arabic: 'نُوْرٌ', translit: 'nūr', meaning: 'cahaya', emoji: '💡' },
      { id: 'h25-w2', arabic: 'نِقَابٌ', translit: 'niqāb', meaning: 'cadar', emoji: '🧕' },
      { id: 'h25-w3', arabic: 'نَمْلٌ', translit: 'naml', meaning: 'semut', emoji: '🐜' },
      { id: 'h25-w4', arabic: 'نَحْلٌ', translit: 'naḥl', meaning: 'lebah', emoji: '🐝' },
    ],
  },
  {
    id: 'h26', letterNumber: 26, name: 'Ha (akhir)', isolated: 'ه', initial: 'هـ', medial: 'ـهـ', final: 'ـه',
    words: [
      { id: 'h26-w1', arabic: 'هُدْهُدٌ', translit: 'hudhud', meaning: 'burung hud-hud', emoji: '🐦' },
      { id: 'h26-w2', arabic: 'هِلَالٌ', translit: 'hilāl', meaning: 'bulan baru', emoji: '🌒' },
      { id: 'h26-w3', arabic: 'هَاتِفٌ', translit: 'hātif', meaning: 'telpon', emoji: '📱' },
      { id: 'h26-w4', arabic: 'هَدِيَّةٌ', translit: 'hadiyyah', meaning: 'hadiah', emoji: '🎁' },
    ],
  },
  {
    id: 'h27', letterNumber: 27, name: 'Waw', isolated: 'و', initial: 'و', medial: 'ـو', final: 'ـو',
    words: [
      { id: 'h27-w1', arabic: 'وُسْطَى', translit: 'wusṭā', meaning: 'jari tengah', emoji: '✋' },
      { id: 'h27-w2', arabic: 'وِسَادَةٌ', translit: 'wisādah', meaning: 'bantal', emoji: '🛏️' },
      { id: 'h27-w3', arabic: 'وَرْدَةٌ', translit: 'wardah', meaning: 'mawar', emoji: '🌹' },
      { id: 'h27-w4', arabic: 'وَرَقَةٌ', translit: 'waraqah', meaning: 'kertas', emoji: '📄' },
    ],
  },
  {
    id: 'h28', letterNumber: 28, name: 'Ya', isolated: 'ي', initial: 'يـ', medial: 'ـيـ', final: 'ـي',
    words: [
      { id: 'h28-w1', arabic: 'يَدٌ', translit: 'yad', meaning: 'tangan', emoji: '🤚' },
      { id: 'h28-w2', arabic: 'يُمْنَى', translit: 'yumnā', meaning: 'kanan', emoji: '👉' },
      { id: 'h28-w3', arabic: 'يُسْرَى', translit: 'yusrā', meaning: 'kiri', emoji: '👈' },
      { id: 'h28-w4', arabic: 'يَاقُوْتٌ', translit: 'yāqūt', meaning: 'permata', emoji: '💎' },
    ],
  },
];
