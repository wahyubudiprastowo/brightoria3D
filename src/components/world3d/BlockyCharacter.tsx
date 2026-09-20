import { useRef, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { getQuality } from '../../render/quality';
import { loadIdentity, skinColorOf } from '../../game/identity';
import {
  ClothMaterial,
  Gamis,
  Hair,
  Hijab,
  KokoDetail,
  LongSleeve,
  Peci,
  SMOOTH,
  ShortSleeve,
  outfitOf,
  type AnyOutfitId,
} from './outfits';

/**
 * BlockyCharacter.tsx — Karakter Brightoria (v4, Patch 56).
 *
 * ====================================================================
 * PERUBAHAN PATCH 56: HALUS, BUKAN BERSUDUT TAJAM
 * ====================================================================
 * Umpan balik: "gak halus smooth, peci dsb aneh".
 *
 * Dua penyebab yang saling memperburuk:
 *
 *   1. flatShading: true di SEMUA material karakter
 *      Flat shading membuat tiap sisi berwarna rata dengan batas
 *      tegas. Bagus untuk arena dan pohon — tapi pada karakter tanpa
 *      wajah, hasilnya terbaca kasar karena tidak ada gradasi yang
 *      melembutkan bentuk.
 *
 *   2. boxGeometry bersudut 90 derajat
 *      Referensi PolyPaper punya sudut MEMBULAT. Itu bukan detail
 *      kecil: sudut membulat menangkap cahaya di tepinya, dan
 *      tangkapan cahaya itulah yang membuat objek terasa lembut.
 *
 * Keduanya diperbaiki:
 *   - flatShading DIMATIKAN di seluruh bagian karakter
 *   - boxGeometry diganti RoundedBox dari drei (sudah ada, 10.7.8)
 *
 * Gaya blocky TETAP dipertahankan — proporsi kepala besar dan badan
 * pipih tidak berubah sama sekali. Yang berubah hanya ketajaman sudut.
 *
 * ====================================================================
 * TANPA WAJAH (dipertahankan dari Patch 55)
 * ====================================================================
 * Kepala satu bentuk polos, tanpa tekstur kanvas apa pun.
 *
 * Konsekuensinya: SELURUH ekspresi disampaikan lewat BAHASA TUBUH —
 * melambai, menunduk membaca, memantul saat gembira. Jadi animasi di
 * berkas ini LEBIH penting setelah wajah dihapus, bukan kurang.
 *
 * ====================================================================
 * TIGA TEKNIK INTI (jangan diubah tanpa alasan kuat)
 * ====================================================================
 * 1. PIVOT DI SENDI: tiap anggota badan dibungkus <group> yang
 *    diletakkan TEPAT DI SENDI, lalu mesh-nya digeser ke bawah
 *    setengah tinggi DI DALAM group itu. Tanpa ini, memutar mesh
 *    lengan membuatnya berputar di tengah seperti baling-baling.
 *
 * 2. FASE TERAKUMULASI: fase += delta * frekuensi, BUKAN
 *    sin(waktu * kecepatan). Memakai waktu absolut membuat gelombang
 *    MELOMPAT setiap kali kecepatan berubah — kaki tersentak saat anak
 *    mulai atau berhenti berlari.
 *
 * 3. motionRef: kecepatan berubah 60x/detik. Lewat useState itu berarti
 *    60 render ulang per detik. Pemanggil memutasi isi ref langsung;
 *    komponen ini membacanya tiap frame tanpa satu pun render ulang.
 * ====================================================================
 */

export type CharacterAction = 'idle' | 'wave' | 'celebrate' | 'read' | 'point';

/** Keadaan gerak yang berubah TIAP FRAME. */
export interface CharacterMotion {
  /** 0 = diam, 1 = lari penuh. */
  speed: number;
  airborne: boolean;
}

export interface CharacterPalette {
  head: string;
  torso: string;
  arms: string;
  legs: string;
  accent: string;
  hair: string;
}

/**
 * Palet bawaan.
 *
 * Sejak busana diperkenalkan, `torso` dan `legs` hanya terlihat pada
 * bagian yang tidak tertutup kain. Warna kulit diambil dari pilihan
 * anak, bukan dari palet ini.
 */
export const PALETTES: Record<string, CharacterPalette> = {
  explorer: {
    head: '#f2c391',
    torso: '#002880',
    arms: '#f2c391',
    legs: '#001445',
    accent: '#28a8e0',
    hair: '#2b241d',
  },
  guide: {
    head: '#f3c9a0',
    torso: '#1c94cc',
    arms: '#f3c9a0',
    legs: '#0d7ab0',
    accent: '#a8dcf5',
    hair: '#2b241d',
  },
};

// ---------------------------------------------------------------------------
// UKURAN — proporsi blocky klasik: kepala besar, badan lebar & pipih
// ---------------------------------------------------------------------------

const DIM = {
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
};

/** Tinggi total dari telapak kaki ke puncak kepala. */
export const CHARACTER_HEIGHT = DIM.legH + DIM.torsoH + DIM.head;

export default function BlockyCharacter({
  palette = PALETTES.explorer,
  speed = 0,
  action = 'idle',
  accessory = 'none',
  airborne = false,
  motionRef,
  outfit,
  skinTone,
}: {
  palette?: CharacterPalette;
  /** 0 = diam, 1 = lari penuh. Dipakai bila motionRef tidak diberikan. */
  speed?: number;
  action?: CharacterAction;
  accessory?: 'none' | 'backpack' | 'book';
  /** true saat melompat — kaki menekuk, lengan naik. */
  airborne?: boolean;
  /** Sumber gerak per-frame tanpa re-render. Menang atas speed/airborne. */
  motionRef?: RefObject<CharacterMotion | null>;
  /**
   * Busana. Bila dikosongkan, dibaca dari pilihan anak — sehingga
   * pemanggil lama otomatis ikut menampilkan karakter yang dipilih.
   */
  outfit?: AnyOutfitId;
  /** Warna kulit. Bila dikosongkan, dibaca dari pilihan anak. */
  skinTone?: string;
}) {
  const quality = getQuality();

  const torsoRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const armLRef = useRef<THREE.Group>(null);
  const armRRef = useRef<THREE.Group>(null);
  const legLRef = useRef<THREE.Group>(null);
  const legRRef = useRef<THREE.Group>(null);
  const bookRef = useRef<THREE.Group>(null);

  const phase = useRef(0);
  const smooth = useRef({ speed: 0, air: 0 });

  // Identitas dibaca SEKALI per render, bukan tiap frame — membaca
  // localStorage 60x/detik akan terasa berat di perangkat lemah.
  const identity = useRef(loadIdentity()).current;
  const spec = outfitOf(outfit ?? identity.outfit);
  const skin = skinTone ?? skinColorOf(identity);
  const op = spec.palette;

  useFrame((state, delta) => {
    try {
      const dt = Math.min(delta, 0.05);
      const t = state.clock.elapsedTime;
      const s = smooth.current;

      // --- Baca gerak dari ref bila tersedia ---
      const m = motionRef?.current;
      const rawSpeed = m ? m.speed : speed;
      const rawAir = (m ? m.airborne : airborne) ? 1 : 0;

      s.speed += (rawSpeed - s.speed) * Math.min(1, dt * 9);
      s.air += (rawAir - s.air) * Math.min(1, dt * 11);

      // --- Fase terakumulasi (lihat catatan teknik #2) ---
      phase.current += dt * (2.2 + s.speed * 8.5);
      const walk = Math.sin(phase.current);
      const walkAlt = Math.sin(phase.current + Math.PI);

      if (!quality.motion) return;

      // --- Badan: memantul saat berjalan, condong sedikit saat lari ---
      if (torsoRef.current) {
        const bob = Math.abs(Math.sin(phase.current)) * 0.045 * s.speed;
        torsoRef.current.position.y = DIM.legH + bob - s.air * 0.04;
        torsoRef.current.rotation.x = s.speed * 0.12;
        torsoRef.current.rotation.z = walk * 0.03 * s.speed;
      }

      // --- Kepala: menoleh pelan saat diam, menunduk saat membaca ---
      if (headRef.current) {
        const idle = Math.sin(t * 0.7) * 0.14 * (1 - s.speed);
        headRef.current.rotation.y = idle;
        headRef.current.rotation.x =
          action === 'read' ? 0.36 : Math.sin(t * 1.3) * 0.04 * (1 - s.speed);
      }

      // --- Lengan ---
      if (armLRef.current && armRRef.current) {
        if (action === 'wave') {
          // Melambai: lengan kanan terangkat dan berayun di pergelangan
          armRRef.current.rotation.z = -2.1 + Math.sin(t * 7) * 0.32;
          armRRef.current.rotation.x = 0;
          armLRef.current.rotation.x = walkAlt * 0.7 * s.speed;
          armLRef.current.rotation.z = 0.06;
        } else if (action === 'celebrate') {
          const up = -2.5 + Math.abs(Math.sin(t * 5)) * 0.35;
          armRRef.current.rotation.z = up;
          armLRef.current.rotation.z = -up;
          armRRef.current.rotation.x = 0;
          armLRef.current.rotation.x = 0;
        } else if (action === 'read') {
          // Membaca: kedua lengan menekuk ke depan memegang buku
          armRRef.current.rotation.x = -1.05;
          armLRef.current.rotation.x = -1.05;
          armRRef.current.rotation.z = -0.22;
          armLRef.current.rotation.z = 0.22;
        } else if (action === 'point') {
          armRRef.current.rotation.x = -1.4;
          armRRef.current.rotation.z = -0.15;
          armLRef.current.rotation.x = walkAlt * 0.7 * s.speed;
          armLRef.current.rotation.z = 0.06;
        } else {
          // Berjalan: lengan berlawanan dengan kaki
          armLRef.current.rotation.x = walkAlt * 0.78 * s.speed - s.air * 0.9;
          armRRef.current.rotation.x = walk * 0.78 * s.speed - s.air * 0.9;
          armLRef.current.rotation.z = 0.06 + s.air * 0.35;
          armRRef.current.rotation.z = -0.06 - s.air * 0.35;
        }
      }

      // --- Kaki ---
      if (legLRef.current && legRRef.current) {
        legLRef.current.rotation.x = walk * 0.82 * s.speed - s.air * 0.55;
        legRRef.current.rotation.x = walkAlt * 0.82 * s.speed - s.air * 0.28;
      }

      // --- Buku ikut berdenyut saat Aira membaca ---
      if (bookRef.current && accessory === 'book') {
        bookRef.current.rotation.z = Math.sin(t * 1.5) * 0.06;
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[Brightoria] BlockyCharacter error (diredam):', err);
    }
  });

  const shadows = quality.shadows;
  const legX = DIM.legW / 2 + DIM.legGap;
  const armX = DIM.torsoW / 2 + DIM.armW / 2 + DIM.armGap;

  /**
   * Kaki dipersempit bila busana menutupinya, supaya tidak menembus
   * keluar dari rok saat berayun.
   */
  const legScale = spec.coversLegs ? 0.72 : 1;

  return (
    <group>
      {/* ================= KAKI (pivot di pinggul) ================= */}
      {[-1, 1].map((side) => (
        <group
          key={side}
          ref={side === -1 ? legLRef : legRRef}
          position={[side * legX, DIM.legH, 0]}
        >
          <RoundedBox
            args={[DIM.legW * legScale, DIM.legH, DIM.legW * legScale]}
            radius={0.05}
            smoothness={SMOOTH}
            position={[0, -DIM.legH / 2, 0]}
            castShadow={shadows}
          >
            <ClothMaterial color={spec.coversLegs ? op.garment : op.garmentAlt} />
          </RoundedBox>

          {/* Sepatu */}
          <RoundedBox
            args={[DIM.legW + 0.04, 0.105, DIM.legW + 0.075]}
            radius={0.04}
            smoothness={SMOOTH}
            position={[0, -DIM.legH + 0.05, 0.02]}
            castShadow={shadows}
          >
            <ClothMaterial color={op.shoes} rough={0.76} />
          </RoundedBox>
        </group>
      ))}

      {/* ================= BADAN ================= */}
      <group ref={torsoRef} position={[0, DIM.legH, 0]}>
        <RoundedBox
          args={[DIM.torsoW, DIM.torsoH, DIM.torsoD]}
          radius={0.07}
          smoothness={SMOOTH}
          position={[0, DIM.torsoH / 2, 0]}
          castShadow={shadows}
        >
          <ClothMaterial color={op.garment} rough={0.83} />
        </RoundedBox>

        {/* ---------- Busana badan ---------- */}
        {spec.coversLegs ? (
          <Gamis palette={op} shadows={shadows} />
        ) : (
          <KokoDetail palette={op} />
        )}

        {/* ---------- LENGAN (pivot di bahu) ---------- */}
        {[-1, 1].map((side) => (
          <group
            key={side}
            ref={side === -1 ? armLRef : armRRef}
            position={[side * armX, DIM.torsoH - 0.06, 0]}
          >
            <RoundedBox
              args={[DIM.armW, DIM.armH, DIM.armW]}
              radius={0.05}
              smoothness={SMOOTH}
              position={[0, -DIM.armH / 2, 0]}
              castShadow={shadows}
            >
              <ClothMaterial color={skin} rough={0.82} />
            </RoundedBox>

            {spec.coversLegs ? (
              <LongSleeve palette={op} />
            ) : (
              <ShortSleeve palette={op} />
            )}

            {/* Buku ilmu tergenggam — hanya untuk Aira */}
            {side === 1 && accessory === 'book' && (
              <group ref={bookRef} position={[-0.18, -DIM.armH + 0.07, 0.11]}>
                <RoundedBox args={[0.32, 0.075, 0.26]} radius={0.025} smoothness={SMOOTH}>
                  <ClothMaterial color="#c9772f" rough={0.62} />
                </RoundedBox>
                <RoundedBox
                  args={[0.3, 0.024, 0.24]}
                  radius={0.01}
                  smoothness={SMOOTH}
                  position={[0, 0.048, 0]}
                >
                  <meshStandardMaterial
                    color="#fdf6e8"
                    emissive={palette.accent}
                    emissiveIntensity={0.55}
                    roughness={0.9}
                  />
                </RoundedBox>
                <pointLight color={palette.accent} intensity={0.9} distance={2.2} />
              </group>
            )}
          </group>
        ))}

        {/* ---------- RANSEL (aksesori penjelajah) ---------- */}
        {accessory === 'backpack' && (
          <group position={[0, DIM.torsoH * 0.52, -(DIM.torsoD / 2 + 0.09)]}>
            <RoundedBox
              args={[0.4, 0.42, 0.18]}
              radius={0.055}
              smoothness={SMOOTH}
              castShadow={shadows}
            >
              <ClothMaterial color="#8a7256" rough={0.88} />
            </RoundedBox>
            <RoundedBox
              args={[0.42, 0.1, 0.024]}
              radius={0.018}
              smoothness={SMOOTH}
              position={[0, 0.07, 0.095]}
            >
              <ClothMaterial color={palette.accent} rough={0.6} />
            </RoundedBox>
          </group>
        )}

        {/* ---------- KEPALA (duduk langsung di badan, tanpa leher) ---------- */}
        <group ref={headRef} position={[0, DIM.torsoH + DIM.head / 2, 0]}>
          {/*
            TANPA WAJAH — lihat catatan di kepala berkas.
            Satu bentuk polos, tanpa tekstur kanvas sama sekali.
          */}
          <RoundedBox
            args={[DIM.head, DIM.head, DIM.head]}
            radius={0.085}
            smoothness={SMOOTH}
            castShadow={shadows}
          >
            <ClothMaterial color={skin} rough={0.82} />
          </RoundedBox>

          {/* Rambut berponi — hanya bila penutup kepala tidak
              menyembunyikannya */}
          {!spec.hidesHair && <Hair color={op.hair} shadows={shadows} />}

          {/* Penutup kepala */}
          {spec.hidesHair ? (
            <Hijab color={op.headwear} trim={op.trim} shadows={shadows} />
          ) : (
            <Peci color={op.headwear} trim={op.trim} shadows={shadows} />
          )}
        </group>
      </group>
    </group>
  );
}
