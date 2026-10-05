/**
 * mathCurriculum.ts â€” Materi matematika Jembatan kelas 5-6 SD.
 *
 * ====================================================================
 * MASALAH YANG DIPECAHKAN
 * ====================================================================
 * Umpan balik: "pulau numeria, latihan masih terlalu sedikit,
 * pembelajaran matematika anak kelas 1-6 SD masih belum banyak, dan
 * terlihat monoton, keterangan kurang jelas."
 *
 * Semuanya benar. Sebelum patch ini Numeria HANYA mengajarkan pecahan â€”
 * topik kelas 4 ke atas. Anak kelas 1, 2, dan 3 tidak mendapat apa-apa
 * yang sesuai tingkatnya.
 *
 * ====================================================================
 * SATU MEKANIK, ENAM TINGKAT KELAS
 * ====================================================================
 * Mekanik jembatan ternyata jauh lebih lentur daripada yang saya kira.
 * "Pasang N papan dari D papan" bisa membawa hampir seluruh kurikulum
 * berhitung SD, hanya dengan mengubah CARA BERTANYA:
 *
 *   Kelas 1  Membilang        "Pasang 7 papan"
 *   Kelas 1  Penjumlahan      "3 + 4 papan"
 *   Kelas 2  Pengurangan      "9 papan, lepas 4"
 *   Kelas 2  Nilai tempat     "1 puluhan + 3 satuan"
 *   Kelas 3  Perkalian        "3 kelompok berisi 4"
 *   Kelas 3  Pembagian        "12 papan dibagi 4 bagian"
 *   Kelas 4  Pecahan          "3/4 jembatan"
 *   Kelas 5  Pecahan senilai  "1/2 dari 8 papan"
 *   Kelas 6  Persen           "50% dari 10 papan"
 *
 * Anak MEMBANGUN jawabannya, bukan memilih dari daftar. Itu pedagogi
 * yang jauh lebih kaya daripada pilihan ganda â€” dan mekaniknya sudah
 * ada, hanya materinya yang kurang.
 *
 * ====================================================================
 * KENAPA BERKAS INI MANDIRI PENUH
 * ====================================================================
 * TIDAK mengimpor apa pun. Tidak React, tidak Three.js, tidak modul
 * permainan mana pun.
 *
 * Artinya berkas ini tidak akan pernah bisa menyebabkan galat build di
 * mana pun ia diimpor, dan bisa diuji sendiri tanpa menjalankan
 * seluruh aplikasi.
 *
 * ====================================================================
 * KETERANGAN YANG JELAS â€” BUKAN SEKADAR ANGKA
 * ====================================================================
 * Keluhan "keterangan kurang jelas" ditangani lewat tiga medan
 * terpisah pada tiap soal:
 *
 *   prompt      apa yang harus dilakukan   "Pasang 3 + 4 papan"
 *   hint        cara memikirkannya         "Hitung dulu 3, lalu tambah 4"
 *   explanation kenapa jawabannya begitu   "3 + 4 = 7, jadi 7 papan"
 *
 * Penjelasan muncul SETELAH menjawab, benar maupun salah â€” sehingga
 * tiap percobaan menjadi momen belajar, bukan sekadar benar-salah.
 * ====================================================================
 */

export type Grade = 1 | 2 | 3 | 4 | 5 | 6;

export type MathTopic =
  | 'counting'
  | 'addition'
  | 'subtraction'
  | 'placeValue'
  | 'multiplication'
  | 'division'
  | 'fraction'
  | 'equivalent'
  | 'percent'
  | 'kpk'
  | 'fpb'
  | 'decimal'
  | 'ratio'
  | 'perimeter'
  | 'area'
  | 'angle'
  | 'cube'
  | 'chance'
  | 'data';

export interface BridgeTask {
  id: string;
  grade: Grade;
  topic: MathTopic;
  /** Jumlah papan yang tersedia di jembatan. */
  denominator: number;
  /** Berapa papan yang harus terpasang agar jembatan tersambung. */
  target: number;
  /** Berapa papan yang SUDAH terpasang sejak awal. */
  preset: number;
  /** Apa yang harus dilakukan anak. */
  prompt: string;
  /** Cara memikirkannya â€” muncul saat menekan tombol Petunjuk. */
  hint: string;
  /** Kenapa jawabannya begitu â€” muncul setelah menjawab. */
  explanation: string;
  /** Nama topik untuk lencana di layar. */
  topicLabel: string;
}

// ---------------------------------------------------------------------------
// UTILITAS
// ---------------------------------------------------------------------------

function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

let counter = 0;
function nextId(topic: MathTopic): string {
  counter += 1;
  return `${topic}-${counter}`;
}

/** Nama topik yang dibaca anak. */
/** Nama topik yang dibaca anak. */
export const TOPIC_LABEL: Record<MathTopic, string> = {
  counting: 'Membilang',
  addition: 'Penjumlahan',
  subtraction: 'Pengurangan',
  placeValue: 'Nilai Tempat',
  multiplication: 'Perkalian',
  division: 'Pembagian',
  fraction: 'Pecahan',
  equivalent: 'Pecahan Senilai',
  percent: 'Persen',
  kpk: 'KPK',
  fpb: 'FPB',
  decimal: 'Desimal',
  ratio: 'Rasio',
  perimeter: 'Keliling',
  area: 'Luas',
  angle: 'Sudut',
  cube: 'Kubus & Balok',
  chance: 'Peluang',
  data: 'Data',
};

/** Keterangan tiap kelas untuk layar pilih. */
export const GRADE_INFO: Record<Grade, { label: string; topics: string; icon: string }> = {
  1: { label: 'Kelas 1', topics: 'Membilang & menjumlah sampai 10', icon: '🌱' },
  2: { label: 'Kelas 2', topics: 'Menjumlah, mengurang, nilai tempat', icon: '🌿' },
  3: { label: 'Kelas 3', topics: 'Tambah, kurang, kali sederhana', icon: '🍀' },
  4: { label: 'Kelas 4', topics: 'Tambah-kurang puluhan & perkalian', icon: '🌳' },
  5: { label: 'Kelas 5', topics: 'KPK/FPB, pecahan, keliling, luas, sudut, data', icon: '🌲' },
  6: { label: 'Kelas 6', topics: 'Pecahan-desimal, rasio, kubus-balok, peluang', icon: '🏔️' },
};

// ---------------------------------------------------------------------------
// KELAS 1 â€” MEMBILANG & PENJUMLAHAN KECIL
// ---------------------------------------------------------------------------

/**
 * Membilang.
 *
 * Paling dasar: anak memasang sejumlah papan yang diminta. Melatih
 * korespondensi satu-satu â€” menghubungkan angka dengan banyaknya benda.
 */
function genCounting(): BridgeTask {
  const den = randInt(5, 10);
  const target = randInt(2, den);

  return {
    id: nextId('counting'),
    grade: 1,
    topic: 'counting',
    denominator: den,
    target,
    preset: 0,
    prompt: `Pasang ${target} papan`,
    hint: `Ketuk papan satu per satu sambil menghitung: 1, 2, 3, ... sampai ${target}`,
    explanation: `Ada ${target} papan terpasang. Bagus!`,
    topicLabel: TOPIC_LABEL.counting,
  };
}

/** Penjumlahan sampai 10. Hasil dijaga tidak melebihi papan tersedia. */
function genAdditionSmall(): BridgeTask {
  const a = randInt(1, 5);
  const b = randInt(1, 5);
  const target = a + b;
  const den = Math.max(target, randInt(target, 10));

  return {
    id: nextId('addition'),
    grade: 1,
    topic: 'addition',
    denominator: den,
    target,
    preset: 0,
    prompt: `Pasang ${a} + ${b} papan`,
    hint: `Pasang ${a} papan dulu, lalu tambah ${b} papan lagi`,
    explanation: `${a} + ${b} = ${target}, jadi ${target} papan.`,
    topicLabel: TOPIC_LABEL.addition,
  };
}

// ---------------------------------------------------------------------------
// KELAS 2 â€” PENGURANGAN & NILAI TEMPAT
// ---------------------------------------------------------------------------

/**
 * Pengurangan lewat "melengkapi".
 *
 * Sebagian papan sudah terpasang, anak diminta menambah sampai target.
 * Melatih pengurangan tanpa pernah menyebut kata "pengurangan" â€” anak
 * cukup melihat berapa yang masih kurang.
 */
function genSubtraction(): BridgeTask {
  const den = randInt(8, 12);
  const target = randInt(5, den);
  const already = randInt(1, target - 2);

  return {
    id: nextId('subtraction'),
    grade: 2,
    topic: 'subtraction',
    denominator: den,
    target,
    preset: already,
    prompt: `Jembatan perlu ${target} papan, sudah ada ${already}`,
    hint: `Berapa papan lagi supaya jadi ${target}? Hitung dari ${already} ke ${target}`,
    explanation: `${target} âˆ’ ${already} = ${target - already}, jadi perlu ${target - already} papan lagi.`,
    topicLabel: TOPIC_LABEL.subtraction,
  };
}

/**
 * Nilai tempat.
 *
 * Papan dikelompokkan sepuluh-sepuluh, sehingga anak MELIHAT bahwa
 * "1 puluhan" berarti sepuluh benda. Ini konsep yang sering hanya
 * dihafal, padahal jauh lebih mudah bila terlihat.
 */
function genPlaceValue(): BridgeTask {
  const tens = randInt(1, 2);
  const ones = randInt(1, 9);
  const target = tens * 10 + ones;

  return {
    id: nextId('placeValue'),
    grade: 2,
    topic: 'placeValue',
    denominator: Math.min(30, target + randInt(2, 6)),
    target,
    preset: 0,
    prompt: `Pasang ${tens} puluhan + ${ones} satuan`,
    hint: `1 puluhan = 10 papan. Jadi ${tens} puluhan = ${tens * 10} papan, lalu tambah ${ones}`,
    explanation: `${tens} puluhan = ${tens * 10}, ditambah ${ones} satuan = ${target} papan.`,
    topicLabel: TOPIC_LABEL.placeValue,
  };
}

// ---------------------------------------------------------------------------
// KELAS 3 â€” PERKALIAN & PEMBAGIAN
// ---------------------------------------------------------------------------

/**
 * Perkalian sebagai penjumlahan berulang.
 *
 * "3 kelompok berisi 4" jauh lebih mudah dipahami daripada "3 x 4"
 * bagi anak yang baru belajar â€” dan papan jembatan membuat kelompok
 * itu terlihat nyata.
 */
function genMultiplication(): BridgeTask {
  const groups = randInt(2, 4);
  const per = randInt(2, 5);
  const target = groups * per;
  const den = Math.min(24, target + randInt(1, 5));

  return {
    id: nextId('multiplication'),
    grade: 3,
    topic: 'multiplication',
    denominator: den,
    target,
    preset: 0,
    prompt: `Pasang ${groups} kelompok, tiap kelompok ${per} papan`,
    hint: `Pasang ${per} papan, ulangi sampai ${groups} kali`,
    explanation: `${groups} Ã— ${per} = ${target}, jadi ${target} papan.`,
    topicLabel: TOPIC_LABEL.multiplication,
  };
}

/** Pembagian: berapa papan untuk SATU bagian dari sekian bagian sama. */
function genDivision(): BridgeTask {
  const parts = randInt(2, 4);
  const per = randInt(2, 5);
  const total = parts * per;

  return {
    id: nextId('division'),
    grade: 3,
    topic: 'division',
    denominator: total,
    target: per,
    preset: 0,
    prompt: `${total} papan dibagi ${parts} bagian sama â€” pasang 1 bagian`,
    hint: `Bagi ${total} papan jadi ${parts} kelompok sama banyak. Berapa isi tiap kelompok?`,
    explanation: `${total} Ã· ${parts} = ${per}, jadi tiap bagian berisi ${per} papan.`,
    topicLabel: TOPIC_LABEL.division,
  };
}

function genAdditionMedium(): BridgeTask {
  const a = randInt(6, 15);
  const b = randInt(3, Math.min(9, 24 - a));
  const target = a + b;

  return {
    id: nextId('addition'),
    grade: 4,
    topic: 'addition',
    denominator: target + randInt(2, 5),
    target,
    preset: 0,
    prompt: `Pasang hasil dari ${a} + ${b}`,
    hint: 'Jumlahkan satuan dulu, lalu puluhannya.',
    explanation: `${a} + ${b} = ${target}, jadi pasang ${target} papan.`,
    topicLabel: TOPIC_LABEL.addition,
  };
}

function genSubtractionMedium(): BridgeTask {
  const a = randInt(18, 32);
  const b = randInt(4, Math.min(14, a - 6));
  const target = a - b;

  return {
    id: nextId('subtraction'),
    grade: 4,
    topic: 'subtraction',
    denominator: target + randInt(2, 6),
    target,
    preset: 0,
    prompt: `Pasang hasil dari ${a} - ${b}`,
    hint: `Kurangi ${a} dengan ${b}. Boleh hitung mundur bertahap.`,
    explanation: `${a} - ${b} = ${target}, jadi pasang ${target} papan.`,
    topicLabel: TOPIC_LABEL.subtraction,
  };
}

function genMultiplicationMedium(): BridgeTask {
  const pairs = [
    [4, 3],
    [5, 3],
    [6, 3],
    [4, 4],
    [5, 4],
    [6, 4],
    [7, 3],
    [8, 3],
  ] as const;
  const [a, b] = pick([...pairs]);
  const target = a * b;

  return {
    id: nextId('multiplication'),
    grade: 5,
    topic: 'multiplication',
    denominator: target + randInt(2, 8),
    target,
    preset: 0,
    prompt: `Pasang hasil dari ${a} x ${b}`,
    hint: `${a} x ${b} artinya ${a} dijumlahkan sebanyak ${b} kali.`,
    explanation: `${a} x ${b} = ${target}, jadi pasang ${target} papan.`,
    topicLabel: TOPIC_LABEL.multiplication,
  };
}

function genMixedOperation(): BridgeTask {
  const a = randInt(2, 5);
  const b = randInt(3, 4);
  const c = randInt(2, 6);
  const target = a * b + c;

  return {
    id: nextId('fraction'),
    grade: 6,
    topic: 'fraction',
    denominator: target + randInt(2, 10),
    target,
    preset: 0,
    prompt: `Pasang hasil dari ${a} x ${b} + ${c}`,
    hint: 'Kerjakan perkalian dulu, baru tambah.',
    explanation: `${a} x ${b} = ${a * b}, lalu ${a * b} + ${c} = ${target}.`,
    topicLabel: TOPIC_LABEL.fraction,
  };
}

// ---------------------------------------------------------------------------
// KELAS 4 â€” PECAHAN DASAR
// ---------------------------------------------------------------------------

function genFraction(): BridgeTask {
  const den = pick([2, 3, 4, 5, 6, 8]);
  const target = randInt(1, den - 1);

  return {
    id: nextId('fraction'),
    grade: 4,
    topic: 'fraction',
    denominator: den,
    target,
    preset: 0,
    prompt: `Sambungkan ${target}/${den} jembatan`,
    hint: `Jembatan dibagi ${den} papan sama besar. Pasang ${target} di antaranya`,
    explanation: `${target} papan dari ${den} papan sama dengan ${target}/${den}.`,
    topicLabel: TOPIC_LABEL.fraction,
  };
}

// ---------------------------------------------------------------------------
// KELAS 5 â€” PECAHAN SENILAI
// ---------------------------------------------------------------------------

/**
 * Pecahan senilai.
 *
 * Target ditulis dalam penyebut KECIL, tapi papan yang tersedia
 * berpenyebut besar. Anak harus menyadari bahwa 1/2 dan 4/8 adalah
 * besaran yang sama â€” bukan sekadar menghitung.
 */
function genEquivalent(): BridgeTask {
  const base = pick([
    { num: 1, den: 2 },
    { num: 1, den: 3 },
    { num: 2, den: 3 },
    { num: 1, den: 4 },
    { num: 3, den: 4 },
  ]);
  const mult = pick([2, 3, 4]);
  const den = base.den * mult;
  const target = base.num * mult;

  return {
    id: nextId('equivalent'),
    grade: 5,
    topic: 'equivalent',
    denominator: den,
    target,
    preset: 0,
    prompt: `Sambungkan ${base.num}/${base.den} jembatan`,
    hint: `Jembatannya dibagi ${den} papan. Berapa papan yang nilainya sama dengan ${base.num}/${base.den}?`,
    explanation: `${base.num}/${base.den} = ${target}/${den}, karena atas dan bawah sama-sama dikali ${mult}.`,
    topicLabel: TOPIC_LABEL.equivalent,
  };
}

// ---------------------------------------------------------------------------
// KELAS 6 â€” PERSEN
// ---------------------------------------------------------------------------

/**
 * Persen dari suatu jumlah.
 *
 * Dibatasi pada persen yang hasilnya bulat (25%, 50%, 75%, 10%, 20%)
 * agar anak bisa membangunnya dengan papan utuh â€” pecahan papan akan
 * membingungkan.
 */
function genPercent(): BridgeTask {
  const choice = pick([
    { pct: 50, den: pick([8, 10, 12]) },
    { pct: 25, den: pick([8, 12, 16]) },
    { pct: 75, den: pick([8, 12, 16]) },
    { pct: 10, den: pick([10, 20]) },
    { pct: 20, den: pick([10, 20]) },
  ]);
  const target = Math.round((choice.den * choice.pct) / 100);

  return {
    id: nextId('percent'),
    grade: 6,
    topic: 'percent',
    denominator: choice.den,
    target,
    preset: 0,
    prompt: `Pasang ${choice.pct}% dari ${choice.den} papan`,
    hint: `${choice.pct}% artinya ${choice.pct} dari tiap 100. Dari ${choice.den} papan, berapa banyak?`,
    explanation: `${choice.pct}% Ã— ${choice.den} = ${target}, jadi ${target} papan.`,
    topicLabel: TOPIC_LABEL.percent,
  };
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    [x, y] = [y, x % y];
  }
  return x || 1;
}

function lcm(a: number, b: number): number {
  return (a * b) / gcd(a, b);
}

function genKpk(): BridgeTask {
  const [a, b] = pick([
    [4, 6],
    [5, 10],
    [6, 8],
    [3, 9],
    [8, 12],
  ] as const);
  const target = lcm(a, b);

  return {
    id: nextId('kpk'),
    grade: 5,
    topic: 'kpk',
    denominator: target + randInt(2, 8),
    target,
    preset: 0,
    prompt: `Pasang KPK dari ${a} dan ${b}`,
    hint: `Cari kelipatan terkecil yang sama-sama dimiliki ${a} dan ${b}.`,
    explanation: `Kelipatan persekutuan terkecil dari ${a} dan ${b} adalah ${target}.`,
    topicLabel: TOPIC_LABEL.kpk,
  };
}

function genFpb(): BridgeTask {
  const [a, b] = pick([
    [12, 18],
    [16, 24],
    [20, 30],
    [18, 27],
    [24, 36],
  ] as const);
  const target = gcd(a, b);

  return {
    id: nextId('fpb'),
    grade: 5,
    topic: 'fpb',
    denominator: target + randInt(6, 16),
    target,
    preset: 0,
    prompt: `Pasang FPB dari ${a} dan ${b}`,
    hint: `Cari faktor terbesar yang membagi ${a} dan ${b}.`,
    explanation: `Faktor persekutuan terbesar dari ${a} dan ${b} adalah ${target}.`,
    topicLabel: TOPIC_LABEL.fpb,
  };
}

function genDecimal(): BridgeTask {
  const den = pick([10, 20, 25]);
  const target = pick(den === 10 ? [2, 4, 5, 7] : den === 20 ? [5, 10, 15] : [5, 10, 20]);
  const decimal = target / den;

  return {
    id: nextId('decimal'),
    grade: 6,
    topic: 'decimal',
    denominator: den,
    target,
    preset: 0,
    prompt: `Sambungkan ${decimal.toLocaleString('id-ID')} bagian jembatan`,
    hint: `Ubah desimal menjadi pecahan dari ${den} papan.`,
    explanation: `${decimal.toLocaleString('id-ID')} = ${target}/${den}, jadi pasang ${target} papan.`,
    topicLabel: TOPIC_LABEL.decimal,
  };
}

function genRatio(): BridgeTask {
  const base = pick([
    { a: 1, b: 2, total: 12 },
    { a: 2, b: 3, total: 15 },
    { a: 3, b: 5, total: 16 },
    { a: 4, b: 5, total: 18 },
  ]);
  const target = (base.total / (base.a + base.b)) * base.a;

  return {
    id: nextId('ratio'),
    grade: 6,
    topic: 'ratio',
    denominator: base.total,
    target,
    preset: 0,
    prompt: `Rasio merah:biru = ${base.a}:${base.b}. Total ${base.total}, pasang bagian merah`,
    hint: `Jumlah bagian = ${base.a + base.b}. Cari nilai 1 bagian, lalu ambil ${base.a} bagian.`,
    explanation: `1 bagian = ${base.total} : ${base.a + base.b} = ${base.total / (base.a + base.b)}, jadi merah = ${target}.`,
    topicLabel: TOPIC_LABEL.ratio,
  };
}

function genPerimeter(): BridgeTask {
  const length = randInt(4, 10);
  const width = randInt(2, 7);
  const target = 2 * (length + width);

  return {
    id: nextId('perimeter'),
    grade: 5,
    topic: 'perimeter',
    denominator: target + randInt(2, 8),
    target,
    preset: 0,
    prompt: `Keliling persegi panjang ${length} x ${width}`,
    hint: 'Keliling persegi panjang = 2 x (panjang + lebar).',
    explanation: `2 x (${length} + ${width}) = ${target}.`,
    topicLabel: TOPIC_LABEL.perimeter,
  };
}

function genArea(): BridgeTask {
  const length = randInt(4, 9);
  const width = randInt(3, 8);
  const target = length * width;

  return {
    id: nextId('area'),
    grade: 5,
    topic: 'area',
    denominator: target + randInt(2, 8),
    target,
    preset: 0,
    prompt: `Luas persegi panjang ${length} x ${width}`,
    hint: 'Luas persegi panjang = panjang x lebar.',
    explanation: `${length} x ${width} = ${target}.`,
    topicLabel: TOPIC_LABEL.area,
  };
}

function genAngle(): BridgeTask {
  const known = pick([30, 40, 50, 60, 70, 80, 90, 100, 120]);
  const targetDegrees = 180 - known;
  const target = targetDegrees / 10;

  return {
    id: nextId('angle'),
    grade: 5,
    topic: 'angle',
    denominator: 18,
    target,
    preset: 0,
    prompt: `Sudut pelurus dari ${known}° (1 papan = 10°)`,
    hint: 'Dua sudut pelurus jumlahnya 180°. Setelah itu bagi hasil derajat dengan 10.',
    explanation: `180° - ${known}° = ${targetDegrees}°, berarti ${target} papan.`,
    topicLabel: TOPIC_LABEL.angle,
  };
}

function genCube(): BridgeTask {
  const length = randInt(3, 5);
  const width = randInt(2, 4);
  const height = randInt(2, 3);
  const target = length * width * height;

  return {
    id: nextId('cube'),
    grade: 6,
    topic: 'cube',
    denominator: target + randInt(3, 12),
    target,
    preset: 0,
    prompt: `Volume balok ${length} x ${width} x ${height}`,
    hint: 'Volume balok = panjang x lebar x tinggi.',
    explanation: `${length} x ${width} x ${height} = ${target}.`,
    topicLabel: TOPIC_LABEL.cube,
  };
}

function genChance(): BridgeTask {
  const total = pick([6, 8, 10, 12]);
  const target = randInt(1, total - 1);

  return {
    id: nextId('chance'),
    grade: 6,
    topic: 'chance',
    denominator: total,
    target,
    preset: 0,
    prompt: `Peluang ${target} kejadian baik dari ${total} percobaan`,
    hint: 'Peluang sederhana ditulis bagian kejadian dibanding semua kemungkinan.',
    explanation: `Peluangnya ${target}/${total}, jadi pasang ${target} dari ${total} papan.`,
    topicLabel: TOPIC_LABEL.chance,
  };
}

function genData(): BridgeTask {
  const values = [randInt(4, 12), randInt(6, 16), randInt(8, 20)];
  const target = Math.max(...values);

  return {
    id: nextId('data'),
    grade: 5,
    topic: 'data',
    denominator: target + randInt(2, 8),
    target,
    preset: 0,
    prompt: `Data: ${values.join(', ')}. Pasang nilai terbesar`,
    hint: 'Bandingkan semua angka dalam data.',
    explanation: `Nilai terbesar dari ${values.join(', ')} adalah ${target}.`,
    topicLabel: TOPIC_LABEL.data,
  };
}

// ---------------------------------------------------------------------------
// PEMILIH TOPIK PER KELAS
// ---------------------------------------------------------------------------

/**
 * Topik yang tersedia di tiap kelas.
 *
 * Kelas atas SENGAJA masih memuat topik kelas bawah â€” pengulangan
 * berjarak menjaga keterampilan dasar tetap lancar. Tapi porsinya
 * lebih kecil, terlihat dari berapa kali topik itu muncul di daftar.
 */
const TOPICS_BY_GRADE: Record<Grade, (() => BridgeTask)[]> = {
  1: [genCounting, genCounting, genAdditionSmall],
  2: [genAdditionSmall, genSubtraction, genSubtraction, genPlaceValue],
  3: [genAdditionSmall, genSubtraction, genMultiplication, genMultiplication, genDivision],
  4: [genAdditionMedium, genSubtractionMedium, genMultiplication, genMultiplicationMedium],
  5: [genKpk, genFpb, genEquivalent, genPerimeter, genArea, genAngle, genData],
  6: [genFraction, genDecimal, genRatio, genCube, genChance, genPercent, genEquivalent],
};

/** Satu soal acak pada kelas tertentu. */
export function generateTask(grade: Grade): BridgeTask {
  return pick(TOPICS_BY_GRADE[grade])();
}

/**
 * Sekumpulan soal dengan topik BERGILIRAN, bukan diacak murni.
 *
 * Pengacakan murni sering menghasilkan tiga soal sejenis berturut-turut,
 * yang membuat latihan terasa monoton â€” persis keluhan pengguna. Selain
 * itu, mencampur topik terbukti lebih baik untuk ingatan jangka panjang
 * daripada mengelompokkannya.
 */
export function generateSet(grade: Grade, count: number): BridgeTask[] {
  const gens = TOPICS_BY_GRADE[grade];
  const order = [...gens].sort(() => Math.random() - 0.5);
  return Array.from({ length: count }, (_, i) => order[i % order.length]());
}

// ---------------------------------------------------------------------------
// PENYIMPANAN KELAS TERPILIH
// ---------------------------------------------------------------------------

const GRADE_KEY = 'brightoria.numeria.grade.v1';

export function loadGrade(): Grade {
  try {
    const raw = localStorage.getItem(GRADE_KEY);
    const n = Number(raw);
    if (n === 5 || n === 6) return n as Grade;
  } catch {
    /* diamkan */
  }
  return 5;
}

export function saveGrade(grade: Grade): void {
  try {
    localStorage.setItem(GRADE_KEY, String(grade <= 5 ? 5 : 6));
  } catch {
    /* Diamkan â€” kegagalan menyimpan tidak boleh menghentikan permainan. */
  }
}

/** Jumlah topik berbeda yang tersedia â€” dipakai layar pilih kelas. */
export function topicCount(grade: Grade): number {
  return new Set(TOPICS_BY_GRADE[grade].map((f) => f.name)).size;
}
