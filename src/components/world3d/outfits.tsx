import { useMemo } from 'react';
import { RoundedBox } from '@react-three/drei';
import type { OutfitId } from '../../game/identity';

/**
 * outfits.tsx — Busana karakter Brightoria (v2, Patch 56).
 *
 * ====================================================================
 * PERUBAHAN PATCH 56: HALUS, BUKAN BERSUDUT TAJAM
 * ====================================================================
 * Umpan balik: "gak halus smooth, peci dsb aneh".
 *
 * Penyebabnya dua hal yang saling memperburuk:
 *
 *   1. flatShading: true di SEMUA material
 *      Flat shading membuat tiap sisi kotak berwarna rata dengan batas
 *      tegas. Bagus untuk arena dan pohon, TAPI pada wajah-tanpa-wajah
 *      hasilnya terbaca kasar — tidak ada gradasi yang melembutkan.
 *
 *   2. boxGeometry bersudut 90 derajat
 *      Referensi PolyPaper punya sudut MEMBULAT. Itu bukan detail
 *      kecil — sudut membulat menangkap cahaya di tepinya, dan
 *      tangkapan cahaya itulah yang membuat objek terasa lembut.
 *
 * Keduanya diperbaiki:
 *   - flatShading dimatikan pada seluruh bagian karakter
 *   - boxGeometry diganti RoundedBox dari drei (sudah terpasang, 10.7.8)
 *
 * ====================================================================
 * PECI DIRANCANG ULANG
 * ====================================================================
 * Versi lama: satu tabung putih duduk di atas lempengan rambut hitam.
 * Terlihat seperti dua benda yang kebetulan bertumpuk.
 *
 * Pada referensi, peci itu PENDEK dan LEBAR, duduk agak masuk ke dalam
 * rambut, dan rambutnya berponi — terlihat mencuat di dahi dan sisi.
 * Itu yang membuatnya terbaca sebagai satu kesatuan.
 *
 * Versi baru meniru itu: peci lebih pendek (0.10), lebih lebar, dengan
 * tepi membulat; rambut diberi poni di dahi dan cambang di sisi.
 * ====================================================================
 */

/**
 * Id busana yang dikenal sistem — termasuk yang TIDAK bisa dipilih anak.
 *
 * `OutfitId` di identity.ts sengaja hanya memuat busana yang boleh
 * dipilih anak. Busana NPC seperti Aira ditambahkan di sini saja,
 * sehingga tidak pernah bisa muncul di layar pemilih.
 */
export type AnyOutfitId = OutfitId | 'muslim-guide';

/** Ukuran badan — harus sama persis dengan DIM di BlockyCharacter.tsx. */
export const BODY = {
  head: 0.58,
  torsoW: 0.64,
  torsoH: 0.62,
  torsoD: 0.32,
  armW: 0.22,
  armH: 0.6,
  armGap: 0.03,
  legW: 0.25,
  legH: 0.6,
  legGap: 0.02,
} as const;

/**
 * Kehalusan sudut. Nilai rendah tetap terbaca membulat tapi jauh lebih
 * murah — karakter punya belasan bagian, dan tiap kenaikan smoothness
 * melipatgandakan jumlah segitiga.
 */
export const SMOOTH = 3;

export interface OutfitPalette {
  garment: string;
  garmentAlt: string;
  headwear: string;
  trim: string;
  hair: string;
  shoes: string;
}

export interface OutfitSpec {
  id: AnyOutfitId;
  label: string;
  icon: string;
  palette: OutfitPalette;
  /** Benar bila busana menutupi kaki (mis. gamis). */
  coversLegs: boolean;
  /** Benar bila penutup kepala menyembunyikan rambut sepenuhnya. */
  hidesHair: boolean;
}

/**
 * Daftar busana.
 *
 * Warna diambil dari referensi: putih gading dan taupe lembut — tenang,
 * tidak mencolok, dan cocok untuk anak.
 */
export const OUTFITS: Record<AnyOutfitId, OutfitSpec> = {
  'muslim-boy': {
    id: 'muslim-boy',
    label: 'Koko & Peci',
    icon: '👦',
    coversLegs: false,
    hidesHair: false,
    palette: {
      garment: '#f4f1ea',
      garmentAlt: '#a89b8c',
      headwear: '#fbfaf7',
      trim: '#ddd7cb',
      hair: '#2b241d',
      shoes: '#efebe2',
    },
  },
  'muslim-girl': {
    id: 'muslim-girl',
    label: 'Gamis & Hijab',
    icon: '👧',
    coversLegs: true,
    hidesHair: true,
    palette: {
      garment: '#faf8f3',
      garmentAlt: '#b5a596',
      headwear: '#c0ae9c',
      trim: '#fbfaf7',
      hair: '#2b241d',
      shoes: '#efebe2',
    },
  },

  /**
   * Busana Aira — pemandu ilmu.
   *
   * Sengaja BIRU LANGIT, bukan taupe seperti busana anak. Aira harus
   * terbaca sekeluarga dengan dunia ini, tapi jelas BUKAN "aku".
   */
  'muslim-guide': {
    id: 'muslim-guide',
    label: 'Pemandu Ilmu',
    icon: '📖',
    coversLegs: true,
    hidesHair: true,
    palette: {
      garment: '#eaf6fd',
      garmentAlt: '#5aa9d6',
      headwear: '#4d9fd0',
      trim: '#d6eefb',
      hair: '#2b241d',
      shoes: '#e4f1f9',
    },
  },
};

export function outfitOf(id: AnyOutfitId): OutfitSpec {
  return OUTFITS[id] ?? OUTFITS['muslim-boy'];
}

/**
 * Material standar karakter.
 *
 * flatShading SENGAJA TIDAK diaktifkan — lihat catatan di kepala
 * berkas. roughness tinggi meniru kain; metalness sangat rendah supaya
 * kain tidak terlihat seperti plastik.
 */
export function ClothMaterial({
  color,
  rough = 0.86,
}: {
  color: string;
  rough?: number;
}) {
  return <meshStandardMaterial color={color} roughness={rough} metalness={0.03} />;
}

// ---------------------------------------------------------------------------
// RAMBUT
// ---------------------------------------------------------------------------

/**
 * Rambut berponi.
 *
 * Tiga bagian, meniru referensi:
 *   1. Batok  — menutupi bagian atas dan belakang kepala
 *   2. Poni   — mencuat di dahi, sedikit turun
 *   3. Cambang— sisi kiri-kanan, membingkai wajah
 *
 * Tanpa poni, rambut terbaca sebagai lempengan datar di atas kepala —
 * persis keluhan pada versi sebelumnya.
 */
export function Hair({ color, shadows }: { color: string; shadows: boolean }) {
  const h = BODY.head;

  return (
    <group>
      {/* 1. Batok */}
      <RoundedBox
        args={[h + 0.028, h * 0.46, h + 0.028]}
        radius={0.045}
        smoothness={SMOOTH}
        position={[0, h * 0.3, -0.012]}
        castShadow={shadows}
      >
        <ClothMaterial color={color} rough={0.92} />
      </RoundedBox>

      {/* 2. Poni — turun di dahi, sedikit lebih maju dari kepala */}
      <RoundedBox
        args={[h * 0.92, h * 0.2, 0.08]}
        radius={0.03}
        smoothness={SMOOTH}
        position={[0, h * 0.2, h / 2 + 0.005]}
      >
        <ClothMaterial color={color} rough={0.92} />
      </RoundedBox>

      {/* Dua jumput poni yang sedikit lebih turun, memecah garis lurus */}
      {[-0.17, 0.13].map((x) => (
        <RoundedBox
          key={x}
          args={[h * 0.26, h * 0.15, 0.07]}
          radius={0.025}
          smoothness={SMOOTH}
          position={[x, h * 0.1, h / 2 + 0.008]}
          rotation={[0, 0, x < 0 ? 0.16 : -0.12]}
        >
          <ClothMaterial color={color} rough={0.92} />
        </RoundedBox>
      ))}

      {/* 3. Cambang kiri-kanan */}
      {[-1, 1].map((side) => (
        <RoundedBox
          key={side}
          args={[0.075, h * 0.4, h * 0.82]}
          radius={0.028}
          smoothness={SMOOTH}
          position={[side * (h / 2 + 0.006), h * 0.14, -0.015]}
        >
          <ClothMaterial color={color} rough={0.92} />
        </RoundedBox>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// PENUTUP KEPALA
// ---------------------------------------------------------------------------

/**
 * Peci — pendek, lebar, bertepi membulat.
 *
 * Duduk agak MASUK ke rambut (posisi y lebih rendah dari versi lama)
 * supaya terbaca menyatu, bukan bertengger.
 */
export function Peci({
  color,
  trim,
  shadows,
}: {
  color: string;
  trim: string;
  shadows: boolean;
}) {
  return (
    <group position={[0, BODY.head / 2 + 0.085, -0.01]}>
      {/* Badan peci — silinder 16 sisi agar lingkarannya mulus */}
      <mesh castShadow={shadows}>
        <cylinderGeometry args={[0.245, 0.255, 0.105, 16]} />
        <meshStandardMaterial color={color} roughness={0.84} metalness={0.02} />
      </mesh>

      {/* Tepi atas membulat — inilah yang menangkap cahaya dan
          membuat peci terasa lembut, bukan tabung terpotong */}
      <mesh position={[0, 0.052, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.232, 0.026, 8, 20]} />
        <meshStandardMaterial color={color} roughness={0.84} metalness={0.02} />
      </mesh>
      <mesh position={[0, 0.058, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.234, 16]} />
        <meshStandardMaterial color={color} roughness={0.84} metalness={0.02} />
      </mesh>

      {/* Pita tipis di pangkal — memecah siluet */}
      <mesh position={[0, -0.046, 0]}>
        <cylinderGeometry args={[0.258, 0.262, 0.026, 16]} />
        <meshStandardMaterial color={trim} roughness={0.88} metalness={0.02} />
      </mesh>
    </group>
  );
}

/**
 * Hijab — menutup kepala, turun melewati bahu, dengan juntai di
 * belakang.
 *
 * Dibangun dari empat bagian sederhana, semuanya bersudut membulat:
 *   1. Tudung  — kotak sedikit lebih besar dari kepala
 *   2. Bingkai — bidang depan yang membentuk lingkaran wajah
 *   3. Juntai  — panel yang menutupi bahu dan punggung
 *   4. Pita    — detail kecil di sisi kanan, sesuai referensi
 */
export function Hijab({
  color,
  trim,
  shadows,
}: {
  color: string;
  trim: string;
  shadows: boolean;
}) {
  const h = BODY.head;

  return (
    <group>
      {/* 1. Tudung kepala */}
      <RoundedBox
        args={[h + 0.085, h + 0.07, h + 0.085]}
        radius={0.075}
        smoothness={SMOOTH}
        position={[0, 0.022, -0.012]}
        castShadow={shadows}
      >
        <ClothMaterial color={color} rough={0.9} />
      </RoundedBox>

      {/* 2. Bingkai wajah — dua bidang tipis di depan, menyisakan celah
             oval tempat wajah berada. Karena karakter tidak berwajah,
             celah inilah yang memberinya bentuk. */}
      {[-1, 1].map((side) => (
        <RoundedBox
          key={side}
          args={[h * 0.26, h + 0.05, 0.06]}
          radius={0.028}
          smoothness={SMOOTH}
          position={[side * (h * 0.4), 0.022, h / 2 + 0.032]}
        >
          <ClothMaterial color={color} rough={0.9} />
        </RoundedBox>
      ))}
      <RoundedBox
        args={[h * 0.64, h * 0.24, 0.06]}
        radius={0.028}
        smoothness={SMOOTH}
        position={[0, h * 0.44, h / 2 + 0.032]}
      >
        <ClothMaterial color={color} rough={0.9} />
      </RoundedBox>

      {/* 3. Juntai belakang — menutupi bahu dan punggung atas */}
      <RoundedBox
        args={[h + 0.14, h * 1.18, 0.17]}
        radius={0.06}
        smoothness={SMOOTH}
        position={[0, -h * 0.52, -0.058]}
        castShadow={shadows}
      >
        <ClothMaterial color={color} rough={0.92} />
      </RoundedBox>

      {/* Bahu kiri-kanan, membuat juntai membungkus — bukan sekadar
          papan menempel di punggung */}
      {[-1, 1].map((side) => (
        <RoundedBox
          key={side}
          args={[0.14, h * 0.8, 0.21]}
          radius={0.05}
          smoothness={SMOOTH}
          position={[side * (h * 0.52), -h * 0.36, -0.02]}
          rotation={[0, 0, side * 0.12]}
          castShadow={shadows}
        >
          <ClothMaterial color={color} rough={0.92} />
        </RoundedBox>
      ))}

      {/* 4. Pita kecil di sisi kanan — detail dari referensi */}
      <group position={[h * 0.5, -h * 0.12, 0.025]}>
        {[-1, 1].map((side) => (
          <RoundedBox
            key={side}
            args={[0.065, 0.08, 0.06]}
            radius={0.024}
            smoothness={SMOOTH}
            position={[0, side * 0.046, 0]}
            rotation={[side * 0.3, 0, 0]}
          >
            <ClothMaterial color={trim} rough={0.82} />
          </RoundedBox>
        ))}
        <RoundedBox args={[0.075, 0.05, 0.05]} radius={0.02} smoothness={SMOOTH}>
          <ClothMaterial color={trim} rough={0.8} />
        </RoundedBox>
      </group>
    </group>
  );
}

// ---------------------------------------------------------------------------
// BUSANA BADAN
// ---------------------------------------------------------------------------

/** Baju koko — placket kancing di tengah dada, kerah berdiri. */
export function KokoDetail({ palette }: { palette: OutfitPalette }) {
  return (
    <group>
      {/* Placket — jalur kancing vertikal */}
      <RoundedBox
        args={[0.08, BODY.torsoH * 0.52, 0.016]}
        radius={0.012}
        smoothness={SMOOTH}
        position={[0, BODY.torsoH * 0.58, BODY.torsoD / 2 + 0.006]}
      >
        <ClothMaterial color={palette.trim} rough={0.8} />
      </RoundedBox>

      {/* Tiga kancing */}
      {[0.74, 0.6, 0.46].map((t) => (
        <mesh key={t} position={[0, BODY.torsoH * t, BODY.torsoD / 2 + 0.018]}>
          <sphereGeometry args={[0.019, 10, 8]} />
          <meshStandardMaterial color={palette.garmentAlt} roughness={0.62} metalness={0.06} />
        </mesh>
      ))}

      {/* Kerah berdiri */}
      <RoundedBox
        args={[BODY.torsoW * 0.64, 0.08, BODY.torsoD + 0.024]}
        radius={0.03}
        smoothness={SMOOTH}
        position={[0, BODY.torsoH - 0.032, 0.005]}
      >
        <ClothMaterial color={palette.trim} rough={0.82} />
      </RoundedBox>
    </group>
  );
}

/**
 * Gamis — rok panjang mengembang dari pinggang ke mata kaki.
 *
 * Memakai silinder mengerucut terbalik (atas lebih sempit dari bawah)
 * sehingga terbaca sebagai kain yang jatuh, bukan tabung kaku.
 *
 * Ditempelkan pada grup BADAN, bukan kaki — jadi saat berjalan, rok
 * ikut badan sementara kaki berayun di dalamnya. Itu persis perilaku
 * kain sungguhan.
 */
export function Gamis({ palette, shadows }: { palette: OutfitPalette; shadows: boolean }) {
  const drop = BODY.legH * 0.84;

  return (
    <group position={[0, -drop / 2 + 0.02, 0]}>
      <mesh castShadow={shadows} receiveShadow={shadows}>
        {/* 16 sisi, bukan 10 — cukup untuk membaca mulus tanpa mahal */}
        <cylinderGeometry args={[BODY.torsoW * 0.56, BODY.torsoW * 0.8, drop, 16]} />
        <meshStandardMaterial color={palette.garment} roughness={0.87} metalness={0.02} />
      </mesh>

      {/* Pita taupe dekat hem — detail dari referensi, sekaligus garis
          horizontal yang memecah siluet */}
      <mesh position={[0, -drop * 0.34, 0]}>
        <cylinderGeometry args={[BODY.torsoW * 0.752, BODY.torsoW * 0.782, 0.07, 16]} />
        <meshStandardMaterial color={palette.garmentAlt} roughness={0.88} metalness={0.02} />
      </mesh>

      {/* Hem paling bawah */}
      <mesh position={[0, -drop / 2 + 0.02, 0]}>
        <cylinderGeometry args={[BODY.torsoW * 0.8, BODY.torsoW * 0.806, 0.04, 16]} />
        <meshStandardMaterial color={palette.trim} roughness={0.9} metalness={0.02} />
      </mesh>
    </group>
  );
}

/** Lengan panjang gamis — menutupi lengan sampai pergelangan. */
export function LongSleeve({ palette }: { palette: OutfitPalette }) {
  return (
    <RoundedBox
      args={[BODY.armW + 0.026, BODY.armH * 0.76, BODY.armW + 0.026]}
      radius={0.05}
      smoothness={SMOOTH}
      position={[0, -BODY.armH * 0.38, 0]}
    >
      <ClothMaterial color={palette.garment} rough={0.85} />
    </RoundedBox>
  );
}

/** Lengan pendek koko — blok warna busana di bagian atas lengan. */
export function ShortSleeve({ palette }: { palette: OutfitPalette }) {
  return (
    <RoundedBox
      args={[BODY.armW + 0.022, BODY.armH * 0.44, BODY.armW + 0.022]}
      radius={0.05}
      smoothness={SMOOTH}
      position={[0, -BODY.armH * 0.21, 0]}
    >
      <ClothMaterial color={palette.garment} rough={0.84} />
    </RoundedBox>
  );
}

export function useOutfit(id: AnyOutfitId): OutfitSpec {
  return useMemo(() => outfitOf(id), [id]);
}
