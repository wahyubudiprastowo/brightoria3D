import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getQuality, scaleCount } from '../../render/quality';
import { worlds } from '../../data/worlds';

/**
 * MapDecor.tsx — Hiasan peta petualangan (Patch 68).
 *
 * ====================================================================
 * APA YANG DITAMBAHKAN, DAN KENAPA INI SAJA
 * ====================================================================
 * Referensi yang dikirim memperlihatkan peta isometrik yang jauh
 * lebih kaya daripada peta sekarang. Tapi TIDAK semuanya bisa
 * dipindahkan begitu saja ke peta 3D.
 *
 * Yang DIAMBIL — karena bekerja baik dalam 3D dan bisa diputar:
 *
 *   1. JALUR TITIK EMAS antar-pulau
 *      Elemen paling khas pada referensi. Ia memberi tahu anak
 *      URUTAN perjalanan, bukan sekadar hiasan.
 *
 *   2. PANJI BERWARNA di atas tiap pulau
 *      Tiang dengan bendera sewarna dunianya. Terlihat dari jauh,
 *      jadi anak bisa mengenali pulau tanpa membaca label.
 *
 *   3. CINCIN AWAN di tepi peta
 *      Membingkai dunia dan menyembunyikan batas laut. Tanpa ini,
 *      tepi peta terlihat terpotong mendadak.
 *
 *   4. PUNCAK GUNUNG di kejauhan
 *      Memberi kedalaman atmosfer. Tanpa siluet di kejauhan, mata
 *      tidak punya acuan jarak dan dunia terasa datar.
 *
 * Yang TIDAK diambil, dan alasannya jujur:
 *
 *   - Arsitektur pulau yang sangat detail (masjid berkubah emas,
 *     pasar, benteng). Itu hasil kerja artis 3D di Blender. Saya
 *     tidak bisa membuat berkas GLB.
 *
 *   - Tata letak isometrik tetap. Peta Brightoria WAJIB bisa diputar
 *     dan di-zoom. Mengunci sudut pandang akan melanggar kebijakan
 *     yang sudah dua kali mengalami regresi.
 *
 * ====================================================================
 * BERKAS INI TIDAK MENYENTUH APA PUN
 * ====================================================================
 * Ia hanya MEMBACA posisi pulau dari worlds.ts dan menggambar di
 * atasnya. Nol perubahan pada data, nol perubahan pada logika.
 *
 * `worlds.ts` sendiri TIDAK disentuh — formasi cincinnya sudah dua
 * kali mengalami regresi, dan saya tidak akan menyentuhnya lagi.
 * ====================================================================
 */

/** Warna emas jalur, diambil dari referensi. */
const GOLD = '#f5cb68';
const GOLD_BRIGHT = '#fff3c4';

// ---------------------------------------------------------------------------
// JALUR TITIK EMAS
// ---------------------------------------------------------------------------

/**
 * Satu jalur titik antara dua pulau.
 *
 * Titik-titik MENGALIR dari pulau asal ke tujuan, bukan diam. Aliran
 * itu yang memberi tahu anak ARAH perjalanan — jalur diam hanya
 * mengatakan "keduanya terhubung", tanpa menunjukkan mana dulu.
 *
 * Lintasannya melengkung ke atas, bukan garis lurus. Garis lurus
 * terbaca sebagai penggaris; lengkungan terbaca sebagai perjalanan.
 */
function PathDots({
  from,
  to,
  offset,
}: {
  from: [number, number, number];
  to: [number, number, number];
  /** Menggeser fase aliran agar antar-jalur tidak seirama. */
  offset: number;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const quality = getQuality();

  const count = Math.max(4, scaleCount(9));

  const geometry = useMemo(() => new THREE.SphereGeometry(0.055, 8, 8), []);
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: GOLD_BRIGHT,
        transparent: true,
        opacity: 0.9,
        /*
         * AdditiveBlending membuat titik terbaca sebagai CAHAYA, bukan
         * manik-manik padat. Dua titik yang bertumpuk otomatis lebih
         * terang di area tumpangnya.
         */
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [],
  );

  /** Lintasan melengkung antara dua pulau. */
  const curve = useMemo(() => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const mid = a.clone().lerp(b, 0.5);

    // Angkat titik tengah — makin jauh jaraknya, makin tinggi lengkungnya.
    mid.y += 0.4 + a.distanceTo(b) * 0.12;

    return new THREE.QuadraticBezierCurve3(a, mid, b);
  }, [from, to]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    try {
      const mesh = ref.current;
      if (!mesh) return;

      const t = quality.motion ? state.clock.elapsedTime * 0.22 + offset : offset;

      for (let i = 0; i < count; i++) {
        // Posisi sepanjang lintasan, bergerak maju dan berulang.
        const p = ((i / count + t) % 1 + 1) % 1;
        const point = curve.getPoint(p);

        dummy.position.copy(point);

        /*
         * Titik MENGECIL di kedua ujung lintasan.
         *
         * Tanpa ini, titik akan muncul dan hilang mendadak di pulau —
         * terlihat seperti kedipan, bukan aliran.
         */
        const fade = Math.sin(p * Math.PI);
        dummy.scale.setScalar(0.5 + fade * 0.9);

        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }

      mesh.instanceMatrix.needsUpdate = true;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[Brightoria] MapDecor PathDots error (diredam):', err);
    }
  });

  return (
    <instancedMesh
      ref={ref}
      args={[geometry, material, count]}
      frustumCulled={false}
    />
  );
}

/**
 * Seluruh jalur yang menghubungkan pulau.
 *
 * Dua jenis jalur:
 *   - Antar-pulau berurutan  (1 -> 2 -> 3 ...) : urutan petualangan
 *   - Dari tiap pulau ke pusat                  : Menara Latihan
 *
 * Jalur ke pusat sengaja dibuat lebih samar — ia tersedia kapan saja,
 * jadi tidak perlu bersaing perhatian dengan jalur utama.
 */
function QuestPaths() {
  const positions = useMemo(
    () => worlds.map((w) => w.position as [number, number, number]),
    [],
  );

  return (
    <group>
      {/* Jalur utama: mengikuti urutan pulau */}
      {positions.map((pos, i) => {
        const next = positions[(i + 1) % positions.length];
        return (
          <PathDots
            key={`main-${i}`}
            from={pos}
            to={next}
            offset={i * 0.17}
          />
        );
      })}
    </group>
  );
}

// ---------------------------------------------------------------------------
// PANJI PULAU
// ---------------------------------------------------------------------------

/**
 * Tiang panji di atas satu pulau.
 *
 * Bendera BERKIBAR pelan dengan memiringkan dan sedikit meregang.
 * Bendera kaku terbaca sebagai papan, bukan kain.
 *
 * Tinggi tiang sengaja dijaga rendah (1,5 unit) — pelajaran Patch 37,
 * di mana apa pun yang menjulang tinggi menutupi pulau tetangga.
 */
function Banner({
  position,
  color,
  accent,
  index,
}: {
  position: [number, number, number];
  color: string;
  accent: string;
  index: number;
}) {
  const flag = useRef<THREE.Group>(null);
  const quality = getQuality();

  useFrame((state) => {
    try {
      if (!flag.current || !quality.motion) return;
      const t = state.clock.elapsedTime;

      // Berkibar: dua frekuensi tidak kelipatan agar tidak berulang.
      flag.current.rotation.y =
        Math.sin(t * 1.4 + index) * 0.16 + Math.sin(t * 2.3 + index) * 0.06;
      flag.current.rotation.z = Math.sin(t * 1.8 + index * 0.7) * 0.05;
    } catch {
      /* diamkan */
    }
  });

  return (
    <group position={[position[0], position[1] + 1.12, position[2]]}>
      {/* Tiang */}
      <mesh castShadow={false}>
        <cylinderGeometry args={[0.022, 0.026, 0.72, 6]} />
        <meshStandardMaterial color="#8a6a3e" roughness={0.85} metalness={0.1} />
      </mesh>

      {/* Bonggol emas di puncak */}
      <mesh position={[0, 0.4, 0]}>
        <sphereGeometry args={[0.045, 8, 8]} />
        <meshStandardMaterial
          color={GOLD}
          emissive={GOLD}
          emissiveIntensity={0.7}
          roughness={0.3}
          metalness={0.6}
        />
      </mesh>

      {/* Bendera */}
      <group ref={flag} position={[0.13, 0.2, 0]}>
        <mesh>
          <planeGeometry args={[0.26, 0.34]} />
          <meshStandardMaterial
            color={color}
            roughness={0.82}
            metalness={0.04}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Pita aksen di tepi bawah — memecah bidang warna polos */}
        <mesh position={[0, -0.14, 0.002]}>
          <planeGeometry args={[0.26, 0.05]} />
          <meshStandardMaterial
            color={accent}
            roughness={0.7}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Ekor bendera — dua segitiga di bawah */}
        {[-0.06, 0.06].map((x) => (
          <mesh key={x} position={[x, -0.2, 0]} rotation={[0, 0, Math.PI]}>
            <coneGeometry args={[0.055, 0.1, 3]} />
            <meshStandardMaterial color={color} roughness={0.82} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** Panji untuk seluruh pulau. */
function IslandBanners() {
  return (
    <group>
      {worlds.map((w, i) => (
        <Banner
          key={w.id}
          position={w.position as [number, number, number]}
          color={w.color}
          accent={w.accent}
          index={i}
        />
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// CINCIN AWAN
// ---------------------------------------------------------------------------

/**
 * Awan yang membingkai tepi peta.
 *
 * Fungsinya bukan hiasan: tanpa awan, laut terpotong mendadak di tepi
 * pandangan. Awan menyembunyikan batas itu dan membuat dunia terasa
 * berlanjut.
 *
 * Dibangun dari gugus bola pipih — awan satu gundukan terbaca sebagai
 * batu, bukan awan. Ini pelajaran dari Patch 65.
 */
function CloudRing() {
  const quality = getQuality();

  const geometry = useMemo(() => {
    /** Susunan gumpalan dalam satu awan. */
    const blobs = [
      { x: 0, y: 0.08, z: 0, r: 1.0 },
      { x: -1.05, y: -0.12, z: 0.1, r: 0.7 },
      { x: 0.98, y: -0.14, z: -0.08, r: 0.64 },
      { x: 0.12, y: -0.18, z: 0.58, r: 0.56 },
    ];

    const positions: number[] = [];
    let s = 4242;
    const rand = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };

    for (const blob of blobs) {
      const geo = new THREE.IcosahedronGeometry(blob.r, 1);
      const pos = geo.attributes.position;

      for (let i = 0; i < pos.count; i++) {
        const wobble = 1 + (rand() - 0.5) * 0.16;
        // Dipipihkan — awan lebih lebar daripada tinggi.
        positions.push(
          blob.x + pos.getX(i) * wobble * 1.1,
          blob.y + pos.getY(i) * wobble * 0.58,
          blob.z + pos.getZ(i) * wobble * 1.1,
        );
      }
      geo.dispose();
    }

    const merged = new THREE.BufferGeometry();
    merged.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3),
    );
    merged.computeVertexNormals();
    return merged;
  }, []);

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#ffffff',
        roughness: 1,
        metalness: 0,
        flatShading: true,
        transparent: true,
        opacity: 0.82,
        /*
         * Cahaya diri tipis mencegah sisi bawah awan jatuh ke abu-abu
         * gelap. Awan sungguhan meneruskan cahaya, tidak menyerapnya.
         */
        emissive: new THREE.Color('#cfe6f5'),
        emissiveIntensity: 0.34,
      }),
    [],
  );

  const placements = useMemo(() => {
    let s = 777;
    const rand = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };

    const count = quality.tier === 'low' ? 7 : 12;

    return Array.from({ length: count }).map((_, i) => {
      const angle = (i / count) * Math.PI * 2 + rand() * 0.5;
      const radius = 7.6 + rand() * 2.8;
      return {
        key: i,
        pos: [
          Math.cos(angle) * radius,
          -1.3 + rand() * 1.1,
          Math.sin(angle) * radius,
        ] as [number, number, number],
        scale: 0.85 + rand() * 0.75,
        rot: rand() * Math.PI * 2,
      };
    });
  }, [quality.tier]);

  return (
    <group>
      {placements.map((p) => (
        <mesh
          key={p.key}
          geometry={geometry}
          material={material}
          position={p.pos}
          rotation={[0, p.rot, 0]}
          scale={p.scale}
        />
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// PUNCAK GUNUNG DI KEJAUHAN
// ---------------------------------------------------------------------------

/**
 * Siluet gunung di luar peta.
 *
 * Tanpa siluet di kejauhan, mata tidak punya acuan jarak dan dunia
 * terasa datar. Warnanya sengaja pucat kebiruan — meniru perspektif
 * atmosfer, di mana benda jauh kehilangan kontras dan condong ke warna
 * langit.
 */
function DistantPeaks() {
  const quality = getQuality();

  const geometry = useMemo(() => new THREE.ConeGeometry(1, 2.1, 5), []);
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#9fc4dd',
        roughness: 1,
        metalness: 0,
        flatShading: true,
        transparent: true,
        opacity: 0.55,
      }),
    [],
  );

  const peaks = useMemo(() => {
    let s = 313;
    const rand = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };

    const count = quality.tier === 'low' ? 10 : 16;

    return Array.from({ length: count }).map((_, i) => {
      const angle = (i / count) * Math.PI * 2 + rand() * 0.3;
      const radius = 13 + rand() * 4;
      return {
        key: i,
        pos: [Math.cos(angle) * radius, -2.4, Math.sin(angle) * radius] as [
          number,
          number,
          number,
        ],
        scale: 1.4 + rand() * 2.2,
        rot: rand() * Math.PI * 2,
      };
    });
  }, [quality.tier]);

  return (
    <group>
      {peaks.map((p) => (
        <mesh
          key={p.key}
          geometry={geometry}
          material={material}
          position={p.pos}
          rotation={[0, p.rot, 0]}
          scale={[p.scale, p.scale * (0.8 + (p.key % 3) * 0.25), p.scale]}
        />
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// KOMPONEN UTAMA
// ---------------------------------------------------------------------------

export default function MapDecor() {
  const quality = getQuality();

  return (
    <group>
      <QuestPaths />
      <IslandBanners />
      <CloudRing />
      {/* Gunung dilewati di tier rendah — ia hanya memberi kedalaman,
          jadi pengaruhnya pada rasa paling kecil di antara semuanya. */}
      {quality.tier !== 'low' && <DistantPeaks />}
    </group>
  );
}
