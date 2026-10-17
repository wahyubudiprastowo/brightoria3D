export interface QuranAyah {
  surahNumber: number;
  ayahNumber: number;
  arabicText: string;
  translationId: string;
  transliteration: string;
  audioUrls?: Record<string, string>;
}

export interface Juz30SurahMeta {
  number: number;
  nameArabic: string;
  nameLatin: string;
  meaning: string;
  ayahCount: number;
}

export const JUZ_30_SURAHS: Juz30SurahMeta[] = [
  { number: 78, nameArabic: 'النبأ', nameLatin: "An-Naba'", meaning: 'Berita Besar', ayahCount: 40 },
  { number: 79, nameArabic: 'النازعات', nameLatin: "An-Nazi'at", meaning: 'Malaikat yang Mencabut', ayahCount: 46 },
  { number: 80, nameArabic: 'عبس', nameLatin: "'Abasa", meaning: 'Bermuka Masam', ayahCount: 42 },
  { number: 81, nameArabic: 'التكوير', nameLatin: 'At-Takwir', meaning: 'Menggulung', ayahCount: 29 },
  { number: 82, nameArabic: 'الانفطار', nameLatin: 'Al-Infitar', meaning: 'Terbelah', ayahCount: 19 },
  { number: 83, nameArabic: 'المطففين', nameLatin: 'Al-Mutaffifin', meaning: 'Orang-Orang Curang', ayahCount: 36 },
  { number: 84, nameArabic: 'الانشقاق', nameLatin: 'Al-Insyiqaq', meaning: 'Terbelah', ayahCount: 25 },
  { number: 85, nameArabic: 'البروج', nameLatin: 'Al-Buruj', meaning: 'Gugusan Bintang', ayahCount: 22 },
  { number: 86, nameArabic: 'الطارق', nameLatin: 'At-Tariq', meaning: 'Yang Datang di Malam Hari', ayahCount: 17 },
  { number: 87, nameArabic: 'الأعلى', nameLatin: "Al-A'la", meaning: 'Maha Tinggi', ayahCount: 19 },
  { number: 88, nameArabic: 'الغاشية', nameLatin: 'Al-Gasyiyah', meaning: 'Hari Pembalasan', ayahCount: 26 },
  { number: 89, nameArabic: 'الفجر', nameLatin: 'Al-Fajr', meaning: 'Fajar', ayahCount: 30 },
  { number: 90, nameArabic: 'البلد', nameLatin: 'Al-Balad', meaning: 'Negeri', ayahCount: 20 },
  { number: 91, nameArabic: 'الشمس', nameLatin: 'Asy-Syams', meaning: 'Matahari', ayahCount: 15 },
  { number: 92, nameArabic: 'الليل', nameLatin: 'Al-Lail', meaning: 'Malam', ayahCount: 21 },
  { number: 93, nameArabic: 'الضحى', nameLatin: 'Ad-Duha', meaning: 'Waktu Dhuha', ayahCount: 11 },
  { number: 94, nameArabic: 'الشرح', nameLatin: 'Al-Insyirah', meaning: 'Melapangkan', ayahCount: 8 },
  { number: 95, nameArabic: 'التين', nameLatin: 'At-Tin', meaning: 'Buah Tin', ayahCount: 8 },
  { number: 96, nameArabic: 'العلق', nameLatin: "Al-'Alaq", meaning: 'Segumpal Darah', ayahCount: 19 },
  { number: 97, nameArabic: 'القدر', nameLatin: 'Al-Qadr', meaning: 'Kemuliaan', ayahCount: 5 },
  { number: 98, nameArabic: 'البينة', nameLatin: 'Al-Bayyinah', meaning: 'Bukti Nyata', ayahCount: 8 },
  { number: 99, nameArabic: 'الزلزلة', nameLatin: 'Az-Zalzalah', meaning: 'Kegoncangan', ayahCount: 8 },
  { number: 100, nameArabic: 'العاديات', nameLatin: "Al-'Adiyat", meaning: 'Kuda Perang yang Berlari', ayahCount: 11 },
  { number: 101, nameArabic: 'القارعة', nameLatin: "Al-Qari'ah", meaning: 'Hari Kiamat', ayahCount: 11 },
  { number: 102, nameArabic: 'التكاثر', nameLatin: 'At-Takasur', meaning: 'Bermegah-Megahan', ayahCount: 8 },
  { number: 103, nameArabic: 'العصر', nameLatin: "Al-'Asr", meaning: 'Demi Masa', ayahCount: 3 },
  { number: 104, nameArabic: 'الهمزة', nameLatin: 'Al-Humazah', meaning: 'Pengumpat', ayahCount: 9 },
  { number: 105, nameArabic: 'الفيل', nameLatin: 'Al-Fil', meaning: 'Gajah', ayahCount: 5 },
  { number: 106, nameArabic: 'قريش', nameLatin: 'Quraisy', meaning: 'Suku Quraisy', ayahCount: 4 },
  { number: 107, nameArabic: 'الماعون', nameLatin: "Al-Ma'un", meaning: 'Barang yang Berguna', ayahCount: 7 },
  { number: 108, nameArabic: 'الكوثر', nameLatin: 'Al-Kausar', meaning: 'Nikmat yang Banyak', ayahCount: 3 },
  { number: 109, nameArabic: 'الكافرون', nameLatin: 'Al-Kafirun', meaning: 'Orang-Orang Kafir', ayahCount: 6 },
  { number: 110, nameArabic: 'النصر', nameLatin: 'An-Nasr', meaning: 'Pertolongan', ayahCount: 3 },
  { number: 111, nameArabic: 'المسد', nameLatin: 'Al-Masad', meaning: 'Sabut', ayahCount: 5 },
  { number: 112, nameArabic: 'الإخلاص', nameLatin: 'Al-Ikhlas', meaning: 'Ikhlas', ayahCount: 4 },
  { number: 113, nameArabic: 'الفلق', nameLatin: 'Al-Falaq', meaning: 'Waktu Subuh', ayahCount: 5 },
  { number: 114, nameArabic: 'الناس', nameLatin: 'An-Nas', meaning: 'Manusia', ayahCount: 6 },
];

let juz30Promise: Promise<Record<string, QuranAyah[]>> | null = null;
const LOCAL_SHORT_SURAHS = new Set([103, 105, 106, 108, 112, 113, 114]);

export function loadJuz30(): Promise<Record<string, QuranAyah[]>> {
  if (!juz30Promise) {
    juz30Promise = fetch('/assets/data/juz30.json').then(async (response) => {
      if (!response.ok) throw new Error('Materi Juz 30 tidak dapat dimuat.');
      return response.json() as Promise<Record<string, QuranAyah[]>>;
    });
  }
  return juz30Promise;
}

export function getAyahAudioUrl(ayah: QuranAyah): string {
  if (LOCAL_SHORT_SURAHS.has(ayah.surahNumber)) {
    return `/assets/audio/quran/alafasy/${ayah.surahNumber}/${ayah.ayahNumber}.mp3`;
  }
  const embedded = ayah.audioUrls?.['05'];
  if (embedded) return embedded;
  const surah = String(ayah.surahNumber).padStart(3, '0');
  const number = String(ayah.ayahNumber).padStart(3, '0');
  return `https://everyayah.com/data/Alafasy_128kbps/${surah}${number}.mp3`;
}

export function getRecitationUrl(surahNumber: number, ayahNumber: number): string {
  return getAyahAudioUrl({
    surahNumber,
    ayahNumber,
    arabicText: '',
    translationId: '',
    transliteration: '',
  });
}
