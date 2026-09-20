/**
 * reviewDeck.ts — Kamus materi untuk mode Latihan Harian (Patch 35).
 *
 * ====================================================================
 * KENAPA FILE INI ADA (dan kenapa datanya diduplikasi):
 * ====================================================================
 * Setiap dunia menyimpan materi yang sudah dikuasai anak sebagai DAFTAR
 * ID saja di localStorage, misalnya:
 *
 *   brightoria.evidence.hijaiyah.v1    -> collectedWords: ['h1-w1', 'h3-w2', ...]
 *   brightoria.evidence.arabicOasis.v2 -> collectedWords: ['l2-w1', 'l7-w3', ...]
 *   brightoria.evidence.englishHarbor.v1 -> collectedWords: ['e1', 'e5', ...]
 *
 * ID saja tidak cukup untuk membuat soal latihan — kita butuh teks,
 * arti, dan emoji-nya. Datanya ada di `curriculum.ts` masing-masing
 * dunia, TAPI mengimpornya langsung berisiko: jika ada satu dunia yang
 * belum terpasang / berbeda versi di proyek user, seluruh build gagal.
 * Riwayat proyek ini sudah beberapa kali mengalami build error karena
 * asumsi soal isi file yang tidak saya miliki salinannya (lihat Patch 20
 * dan Patch 26 sebagai contoh).
 *
 * KEPUTUSAN: kamus di bawah adalah SALINAN MANDIRI (self-contained),
 * sehingga modul Latihan Harian TIDAK PERNAH bisa menyebabkan build
 * error, apa pun kondisi folder dunia di proyek user.
 *
 * KONSEKUENSI JUJUR YANG HARUS DIKETAHUI:
 * Jika suatu saat kosakata di `curriculum.ts` salah satu dunia diubah
 * (kata ditambah/diedit), kamus ini TIDAK ikut berubah otomatis — perlu
 * disunting manual di sini juga. ID yang tidak ditemukan di kamus akan
 * dilewati dengan aman (tidak error, hanya tidak muncul sebagai soal
 * latihan).
 *
 * TIDAK TERMASUK di kamus ini:
 * - Dialog Oasis Bahasa Arab (id d1-d7): berupa kalimat percakapan
 *   penuh, kurang cocok untuk format latihan kilat.
 * - Kampung Adab (id a*-c*): yang dikoleksi adalah PILIHAN CERITA, bukan
 *   kosakata — tidak ada "jawaban benar" untuk diulang.
 * - Pulau Numeria & Benteng Digital: tidak memiliki konsep koleksi kata.
 * ====================================================================
 */

export type DeckWorldId = 'quran' | 'arabic' | 'english';

export interface DeckEntry {
  id: string;
  /** Teks utama yang ditampilkan (Arab untuk quran/arabic, kata untuk english). */
  display: string;
  translit: string;
  meaning: string;
  emoji: string;
  world: DeckWorldId;
}

/** Format tuple dipakai agar file tetap ringkas: [id, display, translit, meaning, emoji]. */
type Row = [string, string, string, string, string];

const QURAN_ROWS: Row[] = [
  ['h1-w1', 'أَرْنَبٌ', 'arnab', 'kelinci', '🐰'],
  ['h1-w2', 'اِبْنٌ', 'ibn', 'anak laki-laki', '👦'],
  ['h1-w3', 'أَبٌ', 'ab', 'ayah', '👨'],
  ['h1-w4', 'أُمٌّ', 'umm', 'ibu', '👩'],
  ['h2-w1', 'بُرْتُقَالٌ', 'burtuqāl', 'jeruk', '🍊'],
  ['h2-w2', 'بَلَاطٌ', 'balāṭ', 'lantai', '🧱'],
  ['h2-w3', 'بَطَّةٌ', 'baṭṭah', 'bebek', '🦆'],
  ['h2-w4', 'بَابٌ', 'bāb', 'pintu', '🚪'],
  ['h3-w1', 'تُفَّاحٌ', 'tuffāḥ', 'apel', '🍎'],
  ['h3-w2', 'تِمْسَاحٌ', 'timsāḥ', 'buaya', '🐊'],
  ['h3-w3', 'تَاجٌ', 'tāj', 'mahkota', '👑'],
  ['h3-w4', 'تَمْرٌ', 'tamr', 'kurma', '🟤'],
  ['h4-w1', 'ثُعْبَانٌ', 'thuʿbān', 'ular', '🐍'],
  ['h4-w2', 'ثِيَابٌ', 'thiyāb', 'baju', '👕'],
  ['h4-w3', 'ثَلَّاجَةٌ', 'thallājah', 'kulkas', '🧊'],
  ['h4-w4', 'ثَعْلَبٌ', 'thaʿlab', 'rubah', '🦊'],
  ['h5-w1', 'جَمَلٌ', 'jamal', 'onta', '🐫'],
  ['h5-w2', 'جَزَرٌ', 'jazar', 'wortel', '🥕'],
  ['h5-w3', 'جُنَّةٌ', 'junnah', 'perisai', '🛡️'],
  ['h5-w4', 'جِدَارٌ', 'jidār', 'dinding', '🧱'],
  ['h6-w1', 'حَقِيْبَةٌ', 'ḥaqībah', 'tas', '🎒'],
  ['h6-w2', 'حَمَّامٌ', 'ḥammām', 'kamar mandi', '🚿'],
  ['h6-w3', 'حِصَانٌ', 'ḥiṣān', 'kuda', '🐴'],
  ['h6-w4', 'حُوْتٌ', 'ḥūt', 'paus', '🐳'],
  ['h7-w1', 'خَاتَمٌ', 'khātam', 'cincin', '💍'],
  ['h7-w2', 'خَرُوْفٌ', 'kharūf', 'domba', '🐑'],
  ['h7-w3', 'خُبْزٌ', 'khubz', 'roti', '🍞'],
  ['h7-w4', 'خِزَانَةٌ', 'khizānah', 'lemari', '🗄️'],
  ['h8-w1', 'دَرَّاجَةٌ', 'darrājah', 'sepeda', '🚲'],
  ['h8-w2', 'دَارٌ', 'dār', 'rumah', '🏠'],
  ['h8-w3', 'دُكَّانٌ', 'dukkān', 'toko', '🏪'],
  ['h8-w4', 'دِيْكٌ', 'dīk', 'ayam jantan', '🐓'],
  ['h9-w1', 'ذُبَابَةٌ', 'dhubābah', 'lalat', '🪰'],
  ['h9-w2', 'ذَقَنٌ', 'dhaqan', 'dagu', '🧑'],
  ['h9-w3', 'ذَهَبٌ', 'dhahab', 'emas', '🟡'],
  ['h9-w4', 'ذِئْبٌ', 'dhiʾb', 'srigala', '🐺'],
  ['h10-w1', 'رُمَّانٌ', 'rummān', 'delima', '🔴'],
  ['h10-w2', 'رِجْلٌ', 'rijl', 'kaki', '🦶'],
  ['h10-w3', 'رَأْسٌ', 'raʾs', 'kepala', '🙂'],
  ['h10-w4', 'رَفٌّ', 'raff', 'rak', '📚'],
  ['h11-w1', 'زُجَاجَةٌ', 'zujājah', 'pelita', '💡'],
  ['h11-w2', 'زِرٌّ', 'zirr', 'kancing', '🔘'],
  ['h11-w3', 'زَهْرَةٌ', 'zahrah', 'bunga', '🌸'],
  ['h11-w4', 'زَنْجَبِيْلٌ', 'zanjabīl', 'jahe', '🫚'],
  ['h12-w1', 'سُكَّرٌ', 'sukkar', 'gula', '🧂'],
  ['h12-w2', 'سِرْوَالٌ', 'sirwāl', 'celana panjang', '👖'],
  ['h12-w3', 'سَمَكٌ', 'samak', 'ikan', '🐟'],
  ['h12-w4', 'سَيَّارَةٌ', 'sayyārah', 'mobil', '🚗'],
  ['h13-w1', 'شُرْطِيٌّ', 'shurṭiy', 'polisi', '👮'],
  ['h13-w2', 'شِهَابٌ', 'shihāb', 'meteor', '☄️'],
  ['h13-w3', 'شَمْسٌ', 'shams', 'matahari', '☀️'],
  ['h13-w4', 'شَمَّامٌ', 'shammām', 'melon', '🍈'],
  ['h14-w1', 'صَابُوْنٌ', 'ṣābūn', 'sabun', '🧼'],
  ['h14-w2', 'صُوْرَةٌ', 'ṣūrah', 'gambar', '🖼️'],
  ['h14-w3', 'صِفْرٌ', 'ṣifr', 'nol', '0️⃣'],
  ['h14-w4', 'صَحْنٌ', 'ṣaḥn', 'piring', '🍽️'],
  ['h15-w1', 'ضُيُوْفٌ', 'ḍuyūf', 'tamu-tamu', '🙋'],
  ['h15-w2', 'ضِفْدَعٌ', 'ḍifdaʿ', 'katak', '🐸'],
  ['h15-w3', 'ضَأْنٌ', 'ḍaʾn', 'domba', '🐑'],
  ['h15-w4', 'ضَبٌّ', 'ḍabb', 'kadal gurun', '🦎'],
  ['h16-w1', 'طُيُوْرٌ', 'ṭuyūr', 'burung-burung', '🐦'],
  ['h16-w2', 'طِفْلٌ', 'ṭifl', 'anak kecil', '👶'],
  ['h16-w3', 'طَائِرَةٌ', 'ṭāʾirah', 'pesawat', '✈️'],
  ['h16-w4', 'طَمَاطِمُ', 'ṭamāṭim', 'tomat', '🍅'],
  ['h17-w1', 'ظُفْرٌ', 'ẓufr', 'kuku', '💅'],
  ['h17-w2', 'ظِلٌّ', 'ẓill', 'bayangan', '🌑'],
  ['h17-w3', 'ظَبْيٌ', 'ẓaby', 'kijang', '🦌'],
  ['h17-w4', 'ظَهْرٌ', 'ẓahr', 'punggung', '🔙'],
  ['h18-w1', 'عُصْفُوْرٌ', 'ʿuṣfūr', 'burung pipit', '🐦'],
  ['h18-w2', 'عِنَبٌ', 'ʿinab', 'anggur', '🍇'],
  ['h18-w3', 'عَيْنٌ', 'ʿayn', 'mata', '👁️'],
  ['h18-w4', 'عَصِيْرٌ', 'ʿaṣīr', 'jus', '🧃'],
  ['h19-w1', 'غُرْفَةٌ', 'ghurfah', 'kamar', '🛋️'],
  ['h19-w2', 'غِطَاءٌ', 'ghiṭāʾ', 'tutup', '📦'],
  ['h19-w3', 'غَيْمٌ', 'ghaym', 'awan', '☁️'],
  ['h19-w4', 'غَارٌ', 'ghār', 'gua', '⛰️'],
  ['h20-w1', 'فُنْدُقٌ', 'funduq', 'hotel', '🏨'],
  ['h20-w2', 'فِيْلٌ', 'fīl', 'gajah', '🐘'],
  ['h20-w3', 'فَأْرٌ', 'faʾr', 'tikus', '🐭'],
  ['h20-w4', 'فَمٌ', 'fam', 'mulut', '👄'],
  ['h21-w1', 'قَهْوَةٌ', 'qahwah', 'kopi', '☕'],
  ['h21-w2', 'قِرْدٌ', 'qird', 'monyet', '🐒'],
  ['h21-w3', 'قَمْلٌ', 'qaml', 'kutu', '🦟'],
  ['h21-w4', 'قَمَرٌ', 'qamar', 'bulan', '🌙'],
  ['h22-w1', 'كُوْبٌ', 'kūb', 'cangkir', '🥤'],
  ['h22-w2', 'كِتَابٌ', 'kitāb', 'buku', '📖'],
  ['h22-w3', 'كَلْبٌ', 'kalb', 'anjing', '🐶'],
  ['h22-w4', 'كَوْكَبٌ', 'kawkab', 'bintang', '⭐'],
  ['h23-w1', 'لُعْبَةٌ', 'luʿbah', 'mainan', '🧸'],
  ['h23-w2', 'لِحَافٌ', 'liḥāf', 'selimut', '🛌'],
  ['h23-w3', 'لَبَنٌ', 'laban', 'susu', '🥛'],
  ['h23-w4', 'لَحْمٌ', 'laḥm', 'daging', '🥩'],
  ['h24-w1', 'مُدَرِّسٌ', 'mudarris', 'pak guru', '👨‍🏫'],
  ['h24-w2', 'مِلْعَقَةٌ', 'milʿaqah', 'sendok', '🥄'],
  ['h24-w3', 'مَوْزٌ', 'mawz', 'pisang', '🍌'],
  ['h24-w4', 'مَاءٌ', 'māʾ', 'air', '💧'],
  ['h25-w1', 'نُوْرٌ', 'nūr', 'cahaya', '💡'],
  ['h25-w2', 'نِقَابٌ', 'niqāb', 'cadar', '🧕'],
  ['h25-w3', 'نَمْلٌ', 'naml', 'semut', '🐜'],
  ['h25-w4', 'نَحْلٌ', 'naḥl', 'lebah', '🐝'],
  ['h26-w1', 'هُدْهُدٌ', 'hudhud', 'burung hud-hud', '🐦'],
  ['h26-w2', 'هِلَالٌ', 'hilāl', 'bulan baru', '🌒'],
  ['h26-w3', 'هَاتِفٌ', 'hātif', 'telpon', '📱'],
  ['h26-w4', 'هَدِيَّةٌ', 'hadiyyah', 'hadiah', '🎁'],
  ['h27-w1', 'وُسْطَى', 'wusṭā', 'jari tengah', '✋'],
  ['h27-w2', 'وِسَادَةٌ', 'wisādah', 'bantal', '🛏️'],
  ['h27-w3', 'وَرْدَةٌ', 'wardah', 'mawar', '🌹'],
  ['h27-w4', 'وَرَقَةٌ', 'waraqah', 'kertas', '📄'],
  ['h28-w1', 'يَدٌ', 'yad', 'tangan', '🤚'],
  ['h28-w2', 'يُمْنَى', 'yumnā', 'kanan', '👉'],
  ['h28-w3', 'يُسْرَى', 'yusrā', 'kiri', '👈'],
  ['h28-w4', 'يَاقُوْتٌ', 'yāqūt', 'permata', '💎'],
];

const ARABIC_ROWS: Row[] = [
  ['l2-w1', 'رَأْسٌ', 'raʾs', 'kepala', '🙂'],
  ['l2-w2', 'شَعْرٌ', 'shaʿr', 'rambut', '💇'],
  ['l2-w3', 'أُذُنٌ', 'udhun', 'telinga', '👂'],
  ['l2-w4', 'عَيْنٌ', 'ʿayn', 'mata', '👁️'],
  ['l2-w5', 'أَنْفٌ', 'anf', 'hidung', '👃'],
  ['l2-w6', 'فَمٌ', 'fam', 'mulut', '👄'],
  ['l2-w7', 'لِسَانٌ', 'lisān', 'lidah', '👅'],
  ['l2-w8', 'سِنٌّ', 'sinn', 'gigi', '🦷'],
  ['l2-w9', 'صَدْرٌ', 'ṣadr', 'dada', '🫁'],
  ['l2-w10', 'بَطْنٌ', 'baṭn', 'perut', '🫄'],
  ['l2-w11', 'يَدٌ', 'yad', 'tangan', '✋'],
  ['l2-w12', 'رِجْلٌ', 'rijl', 'kaki', '🦵'],
  ['l3-w1', 'بَابٌ', 'bāb', 'pintu', '🚪'],
  ['l3-w2', 'كِتَابٌ', 'kitāb', 'buku', '📖'],
  ['l3-w3', 'دَفْتَرٌ', 'daftar', 'buku tulis', '📓'],
  ['l3-w4', 'قَلَمٌ', 'qalam', 'pena', '✏️'],
  ['l3-w5', 'مَكْتَبٌ', 'maktab', 'meja', '🗄️'],
  ['l3-w6', 'كُرْسِيٌّ', 'kursiy', 'kursi', '🪑'],
  ['l3-w7', 'نَافِذَةٌ', 'nāfidhah', 'jendela', '🪟'],
  ['l3-w8', 'سَبُّوْرَةٌ', 'sabbūrah', 'papan tulis', '📋'],
  ['l3-w9', 'حَقِيْبَةٌ', 'ḥaqībah', 'tas', '🎒'],
  ['l3-w10', 'مِسْطَرَةٌ', 'misṭarah', 'penggaris', '📏'],
  ['l3-w11', 'مِمْحَاةٌ', 'mimḥāh', 'penghapus', '🧼'],
  ['l4-w1', 'وَاحِدٌ', 'wāḥid', 'satu (1)', '1️⃣'],
  ['l4-w2', 'اِثْنَانِ', 'ithnān', 'dua (2)', '2️⃣'],
  ['l4-w3', 'ثَلَاثَةٌ', 'thalāthah', 'tiga (3)', '3️⃣'],
  ['l4-w4', 'أَرْبَعَةٌ', 'arbaʿah', 'empat (4)', '4️⃣'],
  ['l4-w5', 'خَمْسَةٌ', 'khamsah', 'lima (5)', '5️⃣'],
  ['l5-w1', 'سِتَّةٌ', 'sittah', 'enam (6)', '6️⃣'],
  ['l5-w2', 'سَبْعَةٌ', 'sabʿah', 'tujuh (7)', '7️⃣'],
  ['l5-w3', 'ثَمَانِيَةٌ', 'thamāniyah', 'delapan (8)', '8️⃣'],
  ['l5-w4', 'تِسْعَةٌ', 'tisʿah', 'sembilan (9)', '9️⃣'],
  ['l5-w5', 'عَشَرَةٌ', 'ʿasharah', 'sepuluh (10)', '🔟'],
  ['l6-w1', 'قِطَارٌ', 'qiṭār', 'kereta', '🚆'],
  ['l6-w2', 'زَوْرَقٌ', 'zawraq', 'perahu', '🛶'],
  ['l6-w3', 'دَرَّاجَةٌ', 'darrājah', 'sepeda', '🚲'],
  ['l6-w4', 'سَيَّارَةٌ', 'sayyārah', 'mobil', '🚗'],
  ['l6-w5', 'شَاحِنَةٌ', 'shāḥinah', 'truk', '🚚'],
  ['l6-w6', 'طَائِرَةٌ', 'ṭāʾirah', 'pesawat', '✈️'],
  ['l6-w7', 'حَافِلَةٌ', 'ḥāfilah', 'bus', '🚌'],
  ['l6-w8', 'سَفِيْنَةٌ', 'safīnah', 'kapal', '🚢'],
  ['l7-w1', 'جَدٌّ', 'jadd', 'kakek', '👴'],
  ['l7-w2', 'جَدَّةٌ', 'jaddah', 'nenek', '👵'],
  ['l7-w3', 'أَبٌ', 'ab', 'ayah', '👨'],
  ['l7-w4', 'أُمٌّ', 'umm', 'ibu', '👩'],
  ['l7-w5', 'عَمٌّ', 'ʿamm', 'paman', '🧔'],
  ['l7-w6', 'عَمَّةٌ', 'ʿammah', 'bibi', '👩‍🦱'],
  ['l7-w7', 'أَخٌ', 'akh', 'saudara laki-laki', '👦'],
  ['l7-w8', 'أُخْتٌ', 'ukht', 'saudara perempuan', '👧'],
  ['l8-w1', 'بَيْتٌ', 'bayt', 'rumah', '🏠'],
  ['l8-w2', 'غُرْفَةٌ', 'ghurfah', 'kamar', '🛋️'],
  ['l8-w3', 'مَطْبَخٌ', 'maṭbakh', 'dapur', '🍳'],
  ['l8-w4', 'حَمَّامٌ', 'ḥammām', 'kamar mandi', '🚿'],
  ['l9-w1', 'سَرِيْرٌ', 'sarīr', 'ranjang', '🛏️'],
  ['l9-w2', 'فِرَاشٌ', 'firāsh', 'kasur', '🛌'],
  ['l9-w3', 'وِسَادَةٌ', 'wisādah', 'bantal', '💤'],
  ['l9-w4', 'لِحَافٌ', 'liḥāf', 'selimut', '🧣'],
  ['l10-w1', 'جِدَارٌ', 'jidār', 'dinding', '🧱'],
  ['l10-w2', 'سَاعَةٌ', 'sāʿah', 'jam', '🕐'],
  ['l10-w3', 'مِصْبَاحٌ', 'miṣbāḥ', 'lampu', '💡'],
  ['l10-w4', 'مِرْوَحَةٌ', 'mirwaḥah', 'kipas angin', '🌀'],
  ['l10-w5', 'خِزَانَةٌ', 'khizānah', 'lemari', '🗄️'],
  ['l10-w6', 'مِرْآةٌ', 'mirʾāh', 'cermin', '🪞'],
  ['l10-w7', 'مُشْطٌ', 'mushṭ', 'sisir', '💈'],
  ['l11-w1', 'مَاءٌ', 'māʾ', 'air', '💧'],
  ['l11-w2', 'صَابُوْنٌ', 'ṣābūn', 'sabun', '🧼'],
  ['l11-w3', 'مِغْرَفَةٌ', 'mighrafah', 'centong', '🥄'],
  ['l11-w4', 'مِنْشَفَةٌ', 'minshafah', 'handuk', '🧻'],
  ['l11-w5', 'مِلْعَقَةٌ', 'milʿaqah', 'sendok', '🥄'],
  ['l11-w6', 'صَحْنٌ', 'ṣaḥn', 'piring', '🍽️'],
  ['l11-w7', 'كُوْبٌ', 'kūb', 'gelas', '🥤'],
  ['l11-w8', 'مِنْدِيْلٌ', 'mindīl', 'tisu', '🧻'],
  ['l12-w1', 'تُفَّاحٌ', 'tuffāḥ', 'apel', '🍎'],
  ['l12-w2', 'بُرْتُقَالٌ', 'burtuqāl', 'jeruk', '🍊'],
  ['l12-w3', 'عِنَبٌ', 'ʿinab', 'anggur', '🍇'],
  ['l12-w4', 'رُمَّانٌ', 'rummān', 'delima', '🔴'],
  ['l12-w5', 'تَمْرٌ', 'tamr', 'kurma', '🟤'],
  ['l12-w6', 'نَارَجِيْلٌ', 'nārajīl', 'kelapa', '🥥'],
  ['l13-w1', 'بِطِّيْخٌ', 'biṭṭīkh', 'semangka', '🍉'],
  ['l13-w2', 'بَابَايَا', 'bābāyā', 'pepaya', '🟠'],
  ['l13-w3', 'أَنَانَاسٌ', 'anānās', 'nanas', '🍍'],
  ['l13-w4', 'شَمَّامٌ', 'shammām', 'melon', '🍈'],
  ['l13-w5', 'مَوْزٌ', 'mawz', 'pisang', '🍌'],
  ['l13-w6', 'فَرَاوِلَةٌ', 'farāwilah', 'stroberi', '🍓'],
  ['l14-w1', 'لَحْمٌ', 'laḥm', 'daging', '🥩'],
  ['l14-w2', 'خُبْزٌ', 'khubz', 'roti', '🍞'],
  ['l14-w3', 'رُزٌّ', 'ruzz', 'nasi', '🍚'],
  ['l14-w4', 'مَكْرُوْنَةٌ', 'makarūnah', 'makaroni', '🍝'],
  ['l14-w5', 'خُضْرَوَاتٌ', 'khuḍrawāt', 'sayuran', '🥦'],
  ['l14-w6', 'سَمَكٌ', 'samak', 'ikan', '🐟'],
  ['l14-w7', 'دَجَاجَةٌ', 'dajājah', 'ayam', '🍗'],
  ['l14-w8', 'بَيْضٌ', 'bayḍ', 'telur', '🥚'],
  ['l15-w1', 'مَاءٌ', 'māʾ', 'air', '💧'],
  ['l15-w2', 'لَبَنٌ', 'laban', 'susu', '🥛'],
  ['l15-w3', 'شَايٌ', 'shāy', 'teh', '🍵'],
  ['l15-w4', 'قَهْوَةٌ', 'qahwah', 'kopi', '☕'],
  ['l15-w5', 'زَنْجَبِيْلٌ', 'zanjabīl', 'jahe', '🫚'],
  ['l15-w6', 'عَصِيْرٌ', 'ʿaṣīr', 'jus', '🧃'],
  ['l16-w1', 'أَبْيَضُ', 'abyaḍ', 'putih', '⚪'],
  ['l16-w2', 'أَحْمَرُ', 'aḥmar', 'merah', '🔴'],
  ['l16-w3', 'أَسْوَدُ', 'aswad', 'hitam', '⚫'],
  ['l16-w4', 'أَخْضَرُ', 'akhḍar', 'hijau', '🟢'],
  ['l16-w5', 'أَصْفَرُ', 'aṣfar', 'kuning', '🟡'],
  ['l16-w6', 'أَزْرَقُ', 'azraq', 'biru', '🔵'],
  ['l17-w1', 'بُنِّيٌّ', 'bunniy', 'coklat', '🟤'],
  ['l17-w2', 'بُرْتُقَالِيٌّ', 'burtuqāliy', 'oranye', '🟠'],
  ['l17-w3', 'رَمَادِيٌّ', 'ramādiy', 'abu-abu', '🩶'],
  ['l17-w4', 'بَنَفْسَجِيٌّ', 'banafsajiy', 'ungu', '🟣'],
  ['l17-w5', 'وَرْدِيٌّ', 'wardiy', 'merah muda', '🩷'],
  ['l17-w6', 'فِضِّيٌّ', 'fiḍḍiy', 'perak', '⬜'],
];

const ENGLISH_ROWS: Row[] = [
  ['e1', 'CAT', 'cat', 'kucing', '🐱'],
  ['e2', 'SUN', 'sun', 'matahari', '☀️'],
  ['e3', 'DOG', 'dog', 'anjing', '🐶'],
  ['e4', 'SHIP', 'ship', 'kapal', '🚢'],
  ['e5', 'FISH', 'fish', 'ikan', '🐟'],
  ['e6', 'BOOK', 'book', 'buku', '📖'],
  ['e7', 'TREE', 'tree', 'pohon', '🌳'],
  ['e8', 'STAR', 'star', 'bintang', '⭐'],
  ['e9', 'DUCK', 'duck', 'bebek', '🦆'],
  ['e10', 'KITE', 'kite', 'layang-layang', '🪁'],
  ['e11', 'BIRD', 'bird', 'burung', '🐦'],
  ['e12', 'MOON', 'moon', 'bulan', '🌙'],
];

function toEntries(rows: Row[], world: DeckWorldId): DeckEntry[] {
  return rows.map(([id, display, translit, meaning, emoji]) => ({
    id,
    display,
    translit,
    meaning,
    emoji,
    world,
  }));
}

export const deck: DeckEntry[] = [
  ...toEntries(QURAN_ROWS, 'quran'),
  ...toEntries(ARABIC_ROWS, 'arabic'),
  ...toEntries(ENGLISH_ROWS, 'english'),
];

const deckIndex = new Map<string, DeckEntry>(deck.map((e) => [e.id, e]));

export function lookupEntry(id: string): DeckEntry | undefined {
  return deckIndex.get(id);
}

export const WORLD_LABELS: Record<DeckWorldId, { label: string; emoji: string; accent: string }> = {
  quran: { label: "Taman Al-Qur'an", emoji: '🕌', accent: '#17856f' },
  arabic: { label: 'Oasis Bahasa Arab', emoji: '🐪', accent: '#8b5ab5' },
  english: { label: 'English Harbor', emoji: '⛵', accent: '#2f8fc9' },
};
