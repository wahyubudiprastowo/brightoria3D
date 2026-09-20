/**
 * expeditionData.ts — Data & bentuk lahan arena Ekspedisi (Patch 42).
 *
 * ====================================================================
 * KENAPA BERKAS INI DITIMPA DI PATCH 42
 * ====================================================================
 * Umpan balik: "landnya masih kaku banget". Setelah ditelusuri, bentuk
 * lahan Patch 38 punya tiga kelemahan mendasar:
 *
 *   1. GERBANG BERDIRI DI LERENG. terrainHeight hanya menjumlahkan
 *      gelombang sinus, jadi portal sering berdiri miring di sisi bukit.
 *      Terlihat janggal dan menyulitkan anak mendekat.
 *
 *   2. TIDAK ADA PENANDA ARAH. Seluruh arena berupa bukit seragam tanpa
 *      jalan setapak, sehingga anak tidak tahu gerbang ada di mana.
 *
 *   3. TIDAK ADA LANDMARK. Tanpa titik rujukan (danau, tebing), pemain
 *      kehilangan orientasi — semua sudut arena terlihat sama.
 *
 * Patch 42 memperbaiki ketiganya LANGSUNG DI FUNGSI TINGGI LAHAN, bukan
 * sekadar menempel dekorasi di atasnya.
 *
 * ====================================================================
 * KENAPA PERUBAHAN INI AMAN
 * ====================================================================
 * terrainHeight() dipakai BERSAMA oleh mesh lahan, karakter pemain,
 * Aira, bintang, dan gerbang. Karena semuanya membaca fungsi yang sama,
 * mengubah bentuk lahan otomatis menggeser semua objek ke ketinggian
 * baru yang benar — tidak ada yang tembus tanah atau melayang.
 *
 * Ekspor lama (portals, starSpots, ARENA_RADIUS, loadExpedition,
 * saveExpedition, ExpeditionSave) DIPERTAHANKAN PERSIS supaya
 * ExpeditionLauncher.tsx dari Patch 38 tetap berfungsi tanpa diubah.
 * ====================================================================
 */

export interface PortalSpec {
  /** Harus sama dengan World.id di src/data/worlds.ts. */
  id: string;
  name: string;
  short: string;
  color: string;
  accent: string;
  icon: string;
  /** Posisi di arena (x, z). Ketinggian dihitung dari terrainHeight. */
  position: [number, number];
  /** Jumlah Bintang Ilmu yang perlu dikumpulkan untuk membuka gerbang. */
  starsRequired: number;
}

export const portals: PortalSpec[] = [
  {
    id: 'quran',
    name: "Taman Al-Qur'an",
    short: 'Hijaiyah',
    color: '#17856f',
    accent: '#f5cb68',
    icon: '🕌',
    position: [-9.5, -7.5],
    starsRequired: 0,
  },
  {
    id: 'adab',
    name: 'Kampung Adab',
    short: 'Adab',
    color: '#c86845',
    accent: '#ffd78c',
    icon: '🤝',
    position: [0, -12],
    starsRequired: 0,
  },
  {
    id: 'math',
    name: 'Pulau Numeria',
    short: 'Angka',
    color: '#3d73bc',
    accent: '#9ed8ff',
    icon: '🔢',
    position: [9.5, -7.5],
    starsRequired: 2,
  },
  {
    id: 'digital',
    name: 'Benteng Digital',
    short: 'Aman Online',
    color: '#405e78',
    accent: '#b9e5ff',
    icon: '🛡️',
    position: [10, 6],
    starsRequired: 4,
  },
  {
    id: 'english',
    name: 'English Harbor',
    short: 'English',
    color: '#da843c',
    accent: '#ffd49f',
    icon: '⛵',
    position: [0, 11.5],
    starsRequired: 6,
  },
  {
    id: 'arabic',
    name: 'Oasis Bahasa Arab',
    short: 'Arab',
    color: '#8b5ab5',
    accent: '#e9d5ff',
    icon: '🐪',
    position: [-10, 6],
    starsRequired: 8,
  },
];

/** Titik Bintang Ilmu yang tersebar di arena. */
export const starSpots: [number, number][] = [
  [-4.5, -3.2],
  [4.2, -3.8],
  [0, -6.5],
  [-7.5, 0.5],
  [7.2, 1.2],
  [-2.8, 4.6],
  [3.4, 5.2],
  [0, 0.8],
  [-12, -1.5],
  [12, -1],
  [-5.5, 9],
  [5.8, 9.4],
];

export const ARENA_RADIUS = 16.5;

/**
 * Danau kecil — landmark utama arena.
 *
 * Posisi dipilih setelah memeriksa jarak ke SELURUH gerbang dan titik
 * bintang, agar tidak menelan satu pun objek:
 *   ke gerbang quran (-9.5,-7.5) : 6.0
 *   ke gerbang adab  (0,-12)     : 5.7
 *   ke bintang (0,-6.5)          : 3.6
 *   ke bintang (-4.5,-3.2)       : 4.4
 * Semuanya di luar radius danau (2.4).
 */
export const LAKE = { x: -3.5, z: -7.5, radius: 2.4, depth: 1.15 };

/** Lebar jalan setapak yang menghubungkan alun-alun ke tiap gerbang. */
export const PATH_WIDTH = 1.15;

// ---------------------------------------------------------------------------
// BENTUK LAHAN
// ---------------------------------------------------------------------------

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/** Jarak titik ke ruas garis — dipakai untuk jalan setapak. */
function distanceToSegment(
  px: number,
  pz: number,
  ax: number,
  az: number,
  bx: number,
  bz: number,
): number {
  const abx = bx - ax;
  const abz = bz - az;
  const apx = px - ax;
  const apz = pz - az;
  const lenSq = abx * abx + abz * abz;
  const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, (apx * abx + apz * abz) / lenSq));
  const cx = ax + abx * t;
  const cz = az + abz * t;
  return Math.hypot(px - cx, pz - cz);
}

/**
 * Jarak ke jalan setapak terdekat.
 *
 * Jalan membentang lurus dari alun-alun tengah (0,0) ke tiap gerbang.
 * Dipakai untuk dua hal: mewarnai lahan menjadi tanah padat, dan
 * mencegah tumbuhan tumbuh di tengah jalan.
 */
export function distanceToPath(x: number, z: number): number {
  let best = Infinity;
  for (const p of portals) {
    const d = distanceToSegment(x, z, 0, 0, p.position[0], p.position[1]);
    if (d < best) best = d;
  }
  return best;
}

/**
 * Tinggi dasar SEBELUM teras gerbang diterapkan.
 *
 * Dipisah dari terrainHeight karena teras perlu tahu ketinggian dasar
 * di titik gerbang — kalau dihitung di dalam fungsi yang sama, akan
 * terjadi rekursi tak berujung.
 */
function baseHeight(x: number, z: number): number {
  const r = Math.sqrt(x * x + z * z);

  // Bukit utama. Amplitudo sedikit diturunkan dari Patch 38 supaya
  // berjalan terasa lebih nyaman, bukan naik-turun terus-menerus.
  let h =
    Math.sin(x * 0.28) * Math.cos(z * 0.31) * 0.72 +
    Math.sin((x + z) * 0.17) * 0.46 +
    Math.cos(x * 0.11 - z * 0.14) * 0.34;

  // Riak kecil frekuensi tinggi — memecah permukaan agar tidak terbaca
  // sebagai gelombang matematis yang mulus.
  h += Math.sin(x * 0.85 + z * 0.62) * 0.075;
  h += Math.cos(x * 1.31 - z * 0.97) * 0.045;

  // Alun-alun tengah: cekungan landai tempat pemain memulai. Dibuat
  // lebih lebar dari Patch 38 supaya Aira ikut berdiri di tanah datar.
  h += -Math.exp(-(r * r) / 38) * 1.25;

  // Cekungan danau.
  const lakeD = Math.hypot(x - LAKE.x, z - LAKE.z);
  h -= Math.exp(-(lakeD * lakeD) / (LAKE.radius * LAKE.radius * 0.62)) * LAKE.depth;

  // Tanggul tepi arena — mencegah anak merasa "jatuh" di ujung dunia.
  h += Math.max(0, r - 14.5) * 1.5;

  return h;
}

/** Teras datar di tiap gerbang, dihitung sekali saat modul dimuat. */
const PLATEAUS = portals.map((p) => ({
  x: p.position[0],
  z: p.position[1],
  level: baseHeight(p.position[0], p.position[1]),
}));

const PLATEAU_INNER = 2.3;
const PLATEAU_OUTER = 4.2;

/**
 * Tinggi lahan di titik (x, z).
 *
 * WAJIB dipakai bersama oleh mesh lahan DAN semua objek yang berdiri di
 * atasnya. Inilah satu-satunya sumber kebenaran bentuk arena.
 */
export function terrainHeight(x: number, z: number): number {
  let h = baseHeight(x, z);

  // Ratakan menuju ketinggian teras saat mendekati gerbang, dengan
  // transisi halus agar tidak muncul dinding tegak.
  for (const plateau of PLATEAUS) {
    const d = Math.hypot(x - plateau.x, z - plateau.z);
    if (d >= PLATEAU_OUTER) continue;
    const influence = 1 - smoothstep(PLATEAU_INNER, PLATEAU_OUTER, d);
    h = h * (1 - influence) + plateau.level * influence;
  }

  return h;
}

/** Permukaan air danau. Dihitung dari dasar cekungan + sebagian kedalaman. */
export const LAKE_LEVEL = terrainHeight(LAKE.x, LAKE.z) + LAKE.depth * 0.6;

// ---------------------------------------------------------------------------
// PENYIMPANAN (warisan Patch 38 — dipertahankan apa adanya)
// ---------------------------------------------------------------------------

export const EXPEDITION_KEY = 'brightoria.expedition.v1';

export interface ExpeditionSave {
  stars: string[];
  visits: number;
  updatedAt: string;
}

export function loadExpedition(): ExpeditionSave {
  try {
    const raw = localStorage.getItem(EXPEDITION_KEY);
    if (!raw) return { stars: [], visits: 0, updatedAt: new Date(0).toISOString() };
    const parsed = JSON.parse(raw) as Partial<ExpeditionSave>;
    return {
      stars: Array.isArray(parsed.stars) ? parsed.stars.filter((s) => typeof s === 'string') : [],
      visits: typeof parsed.visits === 'number' ? parsed.visits : 0,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date(0).toISOString(),
    };
  } catch {
    return { stars: [], visits: 0, updatedAt: new Date(0).toISOString() };
  }
}

export function saveExpedition(save: ExpeditionSave): void {
  try {
    localStorage.setItem(EXPEDITION_KEY, JSON.stringify(save));
  } catch {
    // Diamkan — kegagalan menyimpan tidak boleh menghentikan permainan.
  }
}
