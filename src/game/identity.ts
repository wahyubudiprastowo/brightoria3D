/**
 * identity.ts — Penyimpan identitas anak (Patch 56).
 *
 * ====================================================================
 * PERUBAHAN PATCH 56: NAMA ANAK
 * ====================================================================
 * Ditambahkan medan `name`. Nama dipakai untuk menyapa anak di seluruh
 * aplikasi — di lencana header, di sapaan Aira, dan di layar hasil.
 *
 * Nama disimpan HANYA di perangkat (localStorage), tidak pernah
 * dikirim ke mana pun. Itu penting untuk aplikasi anak.
 *
 * ====================================================================
 * KENAPA BERKAS INI MANDIRI PENUH
 * ====================================================================
 * Tidak mengimpor apa pun. Identitas dibaca dari BANYAK tempat
 * (Ekspedisi, Numeria, pemilih karakter, lencana header). Berkas tanpa
 * ketergantungan tidak akan pernah bisa menyebabkan galat build di mana
 * pun ia diimpor.
 *
 * ====================================================================
 * GENDER DIPISAH DARI BUSANA — DISENGAJA
 * ====================================================================
 * Menyatukannya akan mengunci arsitektur. Dengan dipisah, menambah set
 * busana ketiga nanti cukup menambah DATA di outfits.tsx, tanpa
 * menyentuh kode karakter.
 * ====================================================================
 */

export type Gender = 'boy' | 'girl';

export type OutfitId = 'muslim-boy' | 'muslim-girl';

export interface ChildIdentity {
  /** Nama panggilan anak. Kosong berarti belum diisi. */
  name: string;
  gender: Gender;
  outfit: OutfitId;
  /** Nada kulit, 0-3. */
  skinTone: number;
  /** Benar bila anak sudah pernah memilih. */
  chosen: boolean;
}

const KEY = 'brightoria.identity.v1';

/** Empat nada kulit. Tanpa label — anak memilih dari warna yang dilihat. */
export const SKIN_TONES = ['#f7d6b8', '#f2c391', '#d9a06b', '#a9714a'] as const;

/** Batas panjang nama. Cukup untuk nama panggilan, tidak merusak tata letak. */
export const MAX_NAME_LENGTH = 14;

export function defaultOutfitFor(gender: Gender): OutfitId {
  return gender === 'girl' ? 'muslim-girl' : 'muslim-boy';
}

/**
 * Membersihkan nama yang diketik anak.
 *
 * Yang diizinkan: huruf, angka, spasi, apostrof, dan tanda hubung —
 * cukup untuk nama Indonesia maupun Arab yang ditransliterasi.
 * Sisanya dibuang, bukan ditolak: anak tidak boleh merasa dimarahi
 * hanya karena menekan tombol yang salah.
 */
export function sanitizeName(raw: string): string {
  return raw
    .replace(/[^\p{L}\p{N} '-]/gu, '')
    .replace(/\s+/g, ' ')
    .trimStart()
    .slice(0, MAX_NAME_LENGTH);
}

const EMPTY: ChildIdentity = {
  name: '',
  gender: 'boy',
  outfit: 'muslim-boy',
  skinTone: 1,
  chosen: false,
};

export function loadIdentity(): ChildIdentity {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY };

    const parsed = JSON.parse(raw) as Partial<ChildIdentity>;
    const gender: Gender = parsed.gender === 'girl' ? 'girl' : 'boy';

    // Busana divalidasi terhadap daftar yang dikenal. Nilai asing
    // jatuh ke bawaan, bukan merusak tampilan.
    const outfit: OutfitId =
      parsed.outfit === 'muslim-girl' || parsed.outfit === 'muslim-boy'
        ? parsed.outfit
        : defaultOutfitFor(gender);

    const tone =
      typeof parsed.skinTone === 'number' &&
      parsed.skinTone >= 0 &&
      parsed.skinTone < SKIN_TONES.length
        ? Math.floor(parsed.skinTone)
        : 1;

    return {
      name: typeof parsed.name === 'string' ? sanitizeName(parsed.name) : '',
      gender,
      outfit,
      skinTone: tone,
      chosen: parsed.chosen === true,
    };
  } catch {
    return { ...EMPTY };
  }
}

export function saveIdentity(next: ChildIdentity): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
    // Beri tahu komponen yang sedang tampil agar ikut berubah tanpa
    // perlu memuat ulang halaman.
    window.dispatchEvent(new CustomEvent('brightoria:identity', { detail: next }));
  } catch {
    // Diamkan — kegagalan menyimpan tidak boleh menghentikan permainan.
  }
}

export function needsCharacterChoice(): boolean {
  return !loadIdentity().chosen;
}

export function skinColorOf(identity: ChildIdentity): string {
  return SKIN_TONES[identity.skinTone] ?? SKIN_TONES[1];
}

/** Nama anak, atau sapaan umum bila belum diisi. */
export function playerName(fallback = 'Penjelajah'): string {
  const n = loadIdentity().name.trim();
  return n.length > 0 ? n : fallback;
}
