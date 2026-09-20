import { useMemo, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { getQuality } from '../../render/quality';
import EngineTrail from './EngineTrail';
import Blaster from './Blaster';

/**
 * ShipModel.tsx — Pesawat penjelajah Brightoria (v4, Patch 65).
 *
 * ====================================================================
 * PERUBAHAN PATCH 65: MERIAM
 * ====================================================================
 * Umpan balik: "gak ada efek bisa tembak".
 *
 * Referensi memperlihatkan dua laras meriam menjulur ke depan dari
 * polong mesin — paling jelas terlihat pada tampak depan dan tampak
 * isometrik. Versi sebelumnya melewatkannya sepenuhnya.
 *
 * Kini ditambahkan laras beserta tembakannya (lihat Blaster.tsx).
 *
 * ====================================================================
 * CATATAN JUJUR: PROSEDURAL, BUKAN GLB
 * ====================================================================
 * Referensi Anda adalah gambar render. Saya TIDAK BISA membuat berkas
 * GLB — itu hasil kerja perangkat pemodelan seperti Blender.
 *
 * Kapal ini dihitung dari kode: tiap bagian dirakit dari bentuk dasar
 * Three.js. Hasilnya tidak akan seidentik gambar, tapi siluet,
 * proporsi, dan bahasa warnanya sudah jauh lebih dekat.
 *
 * Untuk proyek ini pendekatan itu justru lebih aman — aturan larangan
 * aset eksternal lahir dari dua kejadian nyata: HDR dari CDN di
 * Patch 03, dan berkas .webp di Patch 12-15.
 * ====================================================================
 */

/** Palet, diambil dari referensi. */
const C = {
  /** Pelat baju zirah — putih kebiruan, bukan putih murni. */
  plate: '#f4f7fc',
  plateMid: '#dbe3f0',
  /** Rangka & aksen gelap. */
  navy: '#2d3f6b',
  navyDeep: '#1a2547',
  /** Selongsong mesin. */
  steel: '#54648a',
  steelDark: '#33405e',
  /** Laras meriam — logam lebih terang agar terbaca terpisah. */
  barrel: '#8d9bb8',
  barrelTip: '#5f6d8a',
  /** Kristal biru — ciri paling khas referensi. */
  crystal: '#3da5ff',
  crystalBright: '#a8ddff',
  /** Aksen oranye pada pelat. */
  amber: '#ff9a2e',
} as const;

const SMOOTH = 3;

/**
 * Permata bersudut.
 *
 * Icosahedron dengan flatShading — 20 sisi datar yang menangkap cahaya
 * berbeda-beda, persis seperti batu terasah. Bola halus tidak akan
 * pernah terbaca sebagai kristal, berapa pun kilapnya.
 */
function Crystal({
  size,
  position,
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  bright = false,
}: {
  size: number;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  bright?: boolean;
}) {
  return (
    <mesh position={position} rotation={rotation} scale={scale}>
      <icosahedronGeometry args={[size, 0]} />
      <meshStandardMaterial
        color={bright ? C.crystalBright : C.crystal}
        emissive={C.crystal}
        emissiveIntensity={bright ? 0.55 : 0.32}
        roughness={0.16}
        metalness={0.35}
        flatShading
      />
    </mesh>
  );
}

/**
 * Laras meriam.
 *
 * Mengerucut sedikit ke ujung — laras silinder seragam terbaca sebagai
 * pipa, sedangkan yang mengerucut terbaca sebagai senjata. Cincin di
 * pangkal menegaskan sambungannya ke polong mesin.
 */
function Cannon({
  position,
  shadows,
}: {
  position: [number, number, number];
  shadows: boolean;
}) {
  return (
    <group position={position}>
      {/* Laras */}
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow={shadows}>
        <cylinderGeometry args={[0.042, 0.058, 0.62, 10]} />
        <meshStandardMaterial
          color={C.barrel}
          roughness={0.3}
          metalness={0.78}
        />
      </mesh>

      {/* Cincin pangkal — sambungan ke polong */}
      <mesh position={[0, 0, -0.26]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.078, 0.078, 0.1, 10]} />
        <meshStandardMaterial
          color={C.navyDeep}
          roughness={0.34}
          metalness={0.7}
        />
      </mesh>

      {/* Moncong gelap */}
      <mesh position={[0, 0, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.046, 0.046, 0.08, 10]} />
        <meshStandardMaterial
          color={C.barrelTip}
          roughness={0.28}
          metalness={0.85}
        />
      </mesh>
    </group>
  );
}

/**
 * Satu mesin lengkap: selongsong, cincin nozzle, dan semburan.
 *
 * Selongsong memakai silinder bersisi 12 — cukup halus untuk terbaca
 * bulat, cukup murah untuk dipakai tiga kali.
 */
function Engine({
  position,
  radius,
  length,
  shadows,
  thrustRef,
  phase,
}: {
  position: [number, number, number];
  radius: number;
  length: number;
  shadows: boolean;
  thrustRef: React.RefObject<number>;
  phase: number;
}) {
  return (
    <group position={position}>
      {/* Selongsong utama */}
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow={shadows}>
        <cylinderGeometry args={[radius, radius * 1.05, length, 12]} />
        <meshStandardMaterial
          color={C.steel}
          roughness={0.38}
          metalness={0.62}
        />
      </mesh>

      {/* Pita pelat terang di punggung selongsong — memecah bidang
          gelap yang luas, sesuai referensi. */}
      <mesh position={[0, radius * 0.72, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry
          args={[radius * 0.52, radius * 0.52, length * 0.78, 8]}
        />
        <meshStandardMaterial
          color={C.plate}
          roughness={0.34}
          metalness={0.28}
        />
      </mesh>

      {/* Cincin navy di pangkal & ujung — sambungan antar-bagian */}
      {[length * 0.42, -length * 0.42].map((z) => (
        <mesh key={z} position={[0, 0, z]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry
            args={[radius * 1.14, radius * 1.14, length * 0.09, 12]}
          />
          <meshStandardMaterial
            color={C.navyDeep}
            roughness={0.3}
            metalness={0.7}
          />
        </mesh>
      ))}

      {/* Bibir nozzle — torus tipis di mulut knalpot */}
      <mesh position={[0, 0, -length * 0.5]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius * 0.86, radius * 0.16, 8, 16]} />
        <meshStandardMaterial
          color={C.steelDark}
          roughness={0.26}
          metalness={0.82}
        />
      </mesh>

      {/* Semburan */}
      <group position={[0, 0, -length * 0.54]}>
        <EngineTrail
          radius={radius * 0.82}
          length={length * 1.5}
          color="orange"
          thrustRef={thrustRef}
          phase={phase}
        />
      </group>
    </group>
  );
}

/**
 * Satu sayap menyapu ke belakang, lengkap dengan winglet.
 *
 * Dibuat dari ExtrudeGeometry, bukan kotak. Kotak terbaca sebagai
 * papan; bentuk berujung runcing dengan tepi belakang menyapu jauh
 * lebih mendekati siluet pada referensi.
 */
function Wing({ side, shadows }: { side: -1 | 1; shadows: boolean }) {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0.34);
    s.lineTo(0.62, 0.16);
    s.lineTo(0.96, -0.02);
    s.lineTo(1.02, -0.2);
    s.lineTo(0.28, -0.42);
    s.lineTo(0, -0.3);
    s.closePath();
    return s;
  }, []);

  const geometry = useMemo(
    () =>
      new THREE.ExtrudeGeometry(shape, {
        depth: 0.055,
        bevelEnabled: true,
        bevelSize: 0.014,
        bevelThickness: 0.014,
        bevelSegments: 2,
      }),
    [shape],
  );

  return (
    <group
      position={[side * 0.22, -0.03, 0.02]}
      rotation={[Math.PI / 2, 0, 0]}
      scale={[side, 1, 1]}
    >
      {/* Bidang sayap */}
      <mesh geometry={geometry} castShadow={shadows}>
        <meshStandardMaterial
          color={C.plate}
          roughness={0.36}
          metalness={0.26}
        />
      </mesh>

      {/* Pelat navy di pangkal — tempat sayap menyatu ke badan */}
      <mesh position={[0.2, 0.02, 0.058]}>
        <boxGeometry args={[0.34, 0.2, 0.014]} />
        <meshStandardMaterial
          color={C.navy}
          roughness={0.44}
          metalness={0.38}
        />
      </mesh>

      {/* Garis oranye — aksen khas pada referensi */}
      <mesh position={[0.54, -0.08, 0.06]} rotation={[0, 0, -0.18]}>
        <boxGeometry args={[0.46, 0.035, 0.012]} />
        <meshStandardMaterial
          color={C.amber}
          emissive={C.amber}
          emissiveIntensity={0.5}
          roughness={0.4}
        />
      </mesh>

      {/* Winglet — bilah tegak di ujung sayap. Ciri yang jelas
          terlihat di semua sudut pandang referensi. */}
      <mesh position={[0.94, -0.1, 0.12]} rotation={[0.32, 0, 0]}>
        <boxGeometry args={[0.16, 0.3, 0.05]} />
        <meshStandardMaterial
          color={C.plateMid}
          roughness={0.36}
          metalness={0.3}
        />
      </mesh>
      <mesh position={[0.94, -0.1, 0.2]} rotation={[0.32, 0, 0]}>
        <boxGeometry args={[0.17, 0.1, 0.055]} />
        <meshStandardMaterial
          color={C.navyDeep}
          roughness={0.4}
          metalness={0.5}
        />
      </mesh>

      {/* Lampu navigasi */}
      <mesh position={[1.0, -0.14, 0.03]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial
          color={C.crystalBright}
          emissive={C.crystal}
          emissiveIntensity={2.4}
        />
      </mesh>
    </group>
  );
}

export default function ShipModel({
  /** 0-2. Memanjangkan semburan saat melaju. */
  thrustRef,
}: {
  thrustRef?: React.RefObject<number>;
}) {
  const quality = getQuality();
  const shadows = quality.shadows;

  const local = useRef(1);
  const thrust = thrustRef ?? local;

  return (
    /*
     * Diputar 180 derajat agar hidung menghadap -Z, searah terbang.
     *
     * Kamera berada di z = 9.4 dan melihat ke -Z. Tanpa rotasi ini,
     * kapal terbang mundur — galat yang diperbaiki di Patch 63.
     */
    <group rotation={[0, Math.PI, 0]}>
      {/* ================= RANGKA NAVY =================
          Lapisan dasar. Pelat putih menumpuk DI ATASNYA, meninggalkan
          garis bayangan di celah antar-pelat — itulah yang membuat
          lambung terbaca berlapis, bukan satu blok polos. */}
      <RoundedBox
        args={[0.46, 0.3, 1.62]}
        radius={0.12}
        smoothness={SMOOTH}
        castShadow={shadows}
      >
        <meshStandardMaterial
          color={C.navyDeep}
          roughness={0.44}
          metalness={0.42}
        />
      </RoundedBox>

      {/* ---------- Pelat punggung ---------- */}
      <RoundedBox
        args={[0.4, 0.2, 1.1]}
        radius={0.09}
        smoothness={SMOOTH}
        position={[0, 0.1, 0.12]}
        castShadow={shadows}
      >
        <meshStandardMaterial
          color={C.plate}
          roughness={0.34}
          metalness={0.3}
        />
      </RoundedBox>

      {/* Pelat kedua, lebih kecil & lebih maju — menciptakan tumpukan */}
      <RoundedBox
        args={[0.32, 0.16, 0.6]}
        radius={0.07}
        smoothness={SMOOTH}
        position={[0, 0.17, 0.42]}
      >
        <meshStandardMaterial
          color={C.plateMid}
          roughness={0.34}
          metalness={0.3}
        />
      </RoundedBox>

      {/* ---------- Pelat sisi ---------- */}
      {[-1, 1].map((side) => (
        <RoundedBox
          key={side}
          args={[0.1, 0.22, 1.24]}
          radius={0.045}
          smoothness={SMOOTH}
          position={[side * 0.24, -0.01, 0.06]}
          castShadow={shadows}
        >
          <meshStandardMaterial
            color={C.plateMid}
            roughness={0.36}
            metalness={0.28}
          />
        </RoundedBox>
      ))}

      {/* ---------- Perut ---------- */}
      <RoundedBox
        args={[0.36, 0.12, 1.3]}
        radius={0.05}
        smoothness={SMOOTH}
        position={[0, -0.16, 0.02]}
      >
        <meshStandardMaterial color={C.navy} roughness={0.46} metalness={0.4} />
      </RoundedBox>

      {/* ================= HIDUNG =================
          Baji runcing, bukan kerucut. Referensi memperlihatkan hidung
          bersudut dengan sisi datar — kerucut terlalu membulat. */}
      <mesh
        position={[0, 0, 1.0]}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow={shadows}
      >
        <coneGeometry args={[0.24, 0.72, 6]} />
        <meshStandardMaterial
          color={C.plate}
          roughness={0.32}
          metalness={0.32}
        />
      </mesh>

      {/* Ujung navy */}
      <mesh position={[0, 0, 1.34]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.085, 0.22, 6]} />
        <meshStandardMaterial
          color={C.navyDeep}
          roughness={0.28}
          metalness={0.66}
        />
      </mesh>

      {/* ================= KRISTAL =================
          Permata besar di punggung hidung — ciri paling khas
          referensi. Diregangkan memanjang agar mengikuti bentuk badan. */}
      <Crystal
        size={0.2}
        position={[0, 0.13, 0.72]}
        scale={[0.85, 0.7, 1.7]}
        bright
      />

      {/* Sisipan kristal kecil di kedua sisi hidung */}
      {[-1, 1].map((side) => (
        <Crystal
          key={side}
          size={0.09}
          position={[side * 0.19, 0.02, 0.62]}
          rotation={[0, 0, side * 0.4]}
          scale={[0.6, 0.9, 1.5]}
        />
      ))}

      {/* Kristal punggung di belakang kokpit */}
      <Crystal size={0.1} position={[0, 0.2, -0.05]} scale={[0.8, 0.7, 1.3]} />

      {/* Cahaya biru dari kristal — memantul ke pelat sekitarnya */}
      <pointLight
        color={C.crystal}
        intensity={1.6}
        distance={2.6}
        position={[0, 0.16, 0.7]}
      />

      {/* ================= SIRIP TEGAK ================= */}
      <mesh position={[0, 0.3, -0.56]} castShadow={shadows}>
        <boxGeometry args={[0.05, 0.4, 0.4]} />
        <meshStandardMaterial
          color={C.plate}
          roughness={0.36}
          metalness={0.3}
        />
      </mesh>
      <mesh position={[0, 0.46, -0.62]}>
        <boxGeometry args={[0.055, 0.13, 0.26]} />
        <meshStandardMaterial
          color={C.navy}
          roughness={0.42}
          metalness={0.44}
        />
      </mesh>

      {/* Sirip ekor kecil, miring keluar — terlihat pada tampak belakang */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * 0.2, 0.12, -0.7]}
          rotation={[0, 0, side * 0.5]}
          castShadow={shadows}
        >
          <boxGeometry args={[0.04, 0.26, 0.28]} />
          <meshStandardMaterial
            color={C.plateMid}
            roughness={0.36}
            metalness={0.3}
          />
        </mesh>
      ))}

      {/* ================= SAYAP ================= */}
      <Wing side={-1} shadows={shadows} />
      <Wing side={1} shadows={shadows} />

      {/* ================= POLONG SAYAP =================
          Dudukan mesin luar. Tanpa polong, mesin akan terlihat
          melayang menempel di sayap. */}
      {[-1, 1].map((side) => (
        <RoundedBox
          key={side}
          args={[0.2, 0.18, 0.7]}
          radius={0.07}
          smoothness={SMOOTH}
          position={[side * 0.62, -0.04, -0.1]}
          castShadow={shadows}
        >
          <meshStandardMaterial
            color={C.plate}
            roughness={0.36}
            metalness={0.3}
          />
        </RoundedBox>
      ))}

      {/* ================= MERIAM =================
          Baru di Patch 65. Referensi memperlihatkan dua laras
          menjulur ke depan dari polong mesin — paling jelas terlihat
          pada tampak depan. */}
      {[-1, 1].map((side) => (
        <Cannon
          key={side}
          position={[side * 0.62, -0.06, 0.34]}
          shadows={shadows}
        />
      ))}

      {/* Tembakan. Moncong sengaja diletakkan sedikit di depan ujung
          laras agar peluru tidak terlihat terlahir di dalam logam. */}
      <Blaster
        left={[-0.62, -0.06, 0.66]}
        right={[0.62, -0.06, 0.66]}
        color="#7fd4ff"
      />

      {/* ================= TIGA MESIN =================
          Referensi jelas memperlihatkan TIGA nyala oranye pada tampak
          depan: satu di tengah badan, dua di polong sayap. */}
      <Engine
        position={[0, -0.04, -0.72]}
        radius={0.16}
        length={0.56}
        shadows={shadows}
        thrustRef={thrust}
        phase={0}
      />

      {[-1, 1].map((side) => (
        <Engine
          key={side}
          position={[side * 0.62, -0.04, -0.52]}
          radius={0.115}
          length={0.46}
          shadows={shadows}
          thrustRef={thrust}
          phase={side * 2.1}
        />
      ))}

      {/* ================= DETAIL PERMUKAAN ================= */}

      {/* Garis panel oranye di punggung */}
      {[0.5, 0.2].map((z) => (
        <mesh key={z} position={[0, 0.205, z]}>
          <boxGeometry args={[0.2, 0.01, 0.045]} />
          <meshStandardMaterial
            color={C.amber}
            emissive={C.amber}
            emissiveIntensity={0.45}
            roughness={0.4}
          />
        </mesh>
      ))}

      {/* Sekat navy di sisi badan — meniru sambungan pelat */}
      {[-1, 1].map((side) =>
        [0.5, 0.05, -0.4].map((z) => (
          <mesh key={`${side}-${z}`} position={[side * 0.3, -0.01, z]}>
            <boxGeometry args={[0.014, 0.18, 0.05]} />
            <meshStandardMaterial
              color={C.navyDeep}
              roughness={0.4}
              metalness={0.5}
            />
          </mesh>
        )),
      )}

      {/* Lampu bawah — memberi kesan melayang */}
      <pointLight
        color={C.crystal}
        intensity={1.0}
        distance={2.8}
        position={[0, -0.24, 0.1]}
      />
    </group>
  );
}
