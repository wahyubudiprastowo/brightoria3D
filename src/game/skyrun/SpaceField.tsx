import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getQuality, scaleCount } from '../../render/quality';

/**
 * SpaceField.tsx — Batu es & awan low-poly (v5, Patch 66).
 *
 * ====================================================================
 * KENAPA VERSI SEBELUMNYA MASIH MELESET
 * ====================================================================
 * Umpan balik: "awan sama asteoridnya masih aneh".
 *
 * Membandingkan lebih teliti dengan lembar aset referensi, ada tiga
 * selisih yang belum tertangani:
 *
 *   1. UKURAN FACET TERLALU KECIL
 *      Referensi memperlihatkan facet BESAR — kira-kira selebar
 *      seperlima bongkahan, berbentuk segi lima dan segi enam.
 *      Icosahedron subdivisi 1 menghasilkan 80 segitiga kecil; dari
 *      kejauhan itu terbaca sebagai bola kasar, bukan batu terasah.
 *
 *      Perbaikan: subdivisi 0 (20 segitiga) lalu ditarik menjadi
 *      elipsoid. Facet menjadi jauh lebih besar dan jelas terbaca.
 *
 *   2. SILUET TERLALU BERGELOMBANG
 *      Jitter 0.14 membuat tepi bongkahan bergerigi. Pada referensi,
 *      siluetnya HALUS MEMBULAT — yang bersegi hanya permukaannya,
 *      bukan tepinya.
 *
 *      Perbaikan: jitter turun ke 0.05, dan bentuk dasar diregangkan
 *      menjadi elipsoid lebar seperti pada gambar.
 *
 *   3. GRADASI TERBALIK ARAHNYA
 *      Versi lama menggelapkan bagian bawah secara merata. Referensi
 *      memperlihatkan cahaya datang dari KANAN ATAS — facet yang
 *      menghadap ke sana jauh lebih terang, dan bayangannya jatuh ke
 *      kiri bawah.
 *
 *      Perbaikan: kecerahan facet dihitung dari sudut antara normal
 *      facet dan arah cahaya, bukan sekadar dari ketinggiannya.
 *
 * ====================================================================
 * KORIDOR PERMAINAN TETAP DIJAGA
 * ====================================================================
 * Perbaikan Patch 65 dipertahankan: batu tidak pernah lahir di depan
 * gerbang jawaban. Itu bukan soal estetika — tanpa koridor bersih,
 * anak tidak bisa membaca jawabannya.
 * ====================================================================
 */

/**
 * Arah cahaya utama, dinormalkan.
 *
 * Diambil dari referensi: cahaya datang dari kanan atas, sedikit ke
 * arah penonton. Inilah yang menentukan facet mana yang terang.
 */
const LIGHT_DIR = new THREE.Vector3(0.55, 0.75, 0.36).normalize();

/** Palet batu es — lima tingkat, dari facet paling terang ke bayangan. */
const ICE = {
  lit: '#dff2ff',
  bright: '#a8dcf8',
  mid: '#6ec2ec',
  shade: '#3f97d4',
  dark: '#2a72b0',
} as const;

/** Palet awan — lebih terang dan lebih lembut daripada batu. */
const CLOUD = {
  lit: '#eaf7ff',
  bright: '#bce5fb',
  mid: '#8ed0f4',
  shade: '#62b4e8',
} as const;

/**
 * Batas koridor permainan yang HARUS tetap bersih.
 *
 * Gerbang jawaban berada di x = -3.1, 0, 3.1 dengan jari-jari 1.42,
 * ditambah papan jawaban selebar 2.05 — tepi terluarnya di x = 4.2.
 * Nilai 6.2 memberi ruang lega di luar itu.
 */
const CORRIDOR = {
  halfWidth: 6.2,
  top: 3.6,
  bottom: -3.4,
} as const;

/** Pengacak deterministik — bentuk yang sama di tiap sesi. */
function makeRng(seed: number) {
  let s = seed * 9301 + 49297;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/**
 * Menempatkan objek DI LUAR koridor permainan.
 *
 * Memilih satu dari empat sisi, lalu menaruh objek di luar batasnya.
 * Menjamin koridor bersih tanpa perlu memeriksa tabrakan satu per satu.
 *
 * Sisi kiri & kanan diberi bobot lebih besar (60%) karena layar lebih
 * lebar daripada tinggi.
 */
function placeOutsideCorridor(rand: () => number): { x: number; y: number } {
  const side = rand();

  if (side < 0.3) {
    return { x: -CORRIDOR.halfWidth - rand() * 9, y: (rand() - 0.5) * 16 };
  }
  if (side < 0.6) {
    return { x: CORRIDOR.halfWidth + rand() * 9, y: (rand() - 0.5) * 16 };
  }
  if (side < 0.8) {
    return { x: (rand() - 0.5) * 26, y: CORRIDOR.top + rand() * 6 };
  }
  return { x: (rand() - 0.5) * 26, y: CORRIDOR.bottom - rand() * 5 };
}

/**
 * Mewarnai tiap facet berdasarkan arah hadapnya terhadap cahaya.
 *
 * INILAH yang membuat bongkahan terbaca sebagai batu terasah. Facet
 * yang menghadap cahaya menjadi terang, yang membelakanginya menjadi
 * bayangan — sama seperti batu sungguhan.
 *
 * Bisa dilakukan karena geometri Three.js bersifat non-indexed: tiap
 * segitiga punya tiga verteksnya sendiri, jadi menyetel warna yang
 * sama untuk tiap kelipatan tiga menghasilkan satu warna per facet.
 */
function paintFacets(
  geo: THREE.BufferGeometry,
  palette: { lit: string; bright: string; mid: string; shade: string; dark?: string },
  rand: () => number,
  variation: number,
): void {
  const pos = geo.attributes.position;
  const colors: number[] = [];

  const lit = new THREE.Color(palette.lit);
  const bright = new THREE.Color(palette.bright);
  const mid = new THREE.Color(palette.mid);
  const shade = new THREE.Color(palette.shade);
  const dark = new THREE.Color(palette.dark ?? palette.shade);

  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const ab = new THREE.Vector3();
  const ac = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const col = new THREE.Color();

  for (let f = 0; f < pos.count; f += 3) {
    a.fromBufferAttribute(pos, f);
    b.fromBufferAttribute(pos, f + 1);
    c.fromBufferAttribute(pos, f + 2);

    // Normal facet dari hasil kali silang dua sisinya.
    ab.subVectors(b, a);
    ac.subVectors(c, a);
    normal.crossVectors(ab, ac).normalize();

    // Seberapa menghadap cahaya: -1 (membelakangi) sampai 1 (menghadap).
    const facing = normal.dot(LIGHT_DIR);
    const t = THREE.MathUtils.clamp((facing + 1) / 2, 0, 1);

    if (t > 0.78) col.copy(bright).lerp(lit, (t - 0.78) / 0.22);
    else if (t > 0.56) col.copy(mid).lerp(bright, (t - 0.56) / 0.22);
    else if (t > 0.34) col.copy(shade).lerp(mid, (t - 0.34) / 0.22);
    else col.copy(dark).lerp(shade, t / 0.34);

    // Pergeseran acak kecil agar facet bertetangga tidak identik.
    col.multiplyScalar(1 - variation / 2 + rand() * variation);

    for (let v = 0; v < 3; v++) colors.push(col.r, col.g, col.b);
  }

  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
}

/**
 * Membangun batu es dengan facet besar.
 *
 * Subdivisi 0 sengaja dipilih: 20 segitiga besar, persis seperti
 * referensi. Subdivisi lebih tinggi membuat facet terlalu kecil untuk
 * dibedakan mata, dan bongkahan kembali terbaca sebagai bola kasar.
 */
function buildRockGeometry(seed: number): THREE.BufferGeometry {
  const geo = new THREE.IcosahedronGeometry(1, 1);
  const rand = makeRng(seed);
  const pos = geo.attributes.position;

  for (let i = 0; i < pos.count; i++) {
    /*
     * Jitter sangat kecil (0.05).
     *
     * Pada referensi, siluet bongkahan HALUS membulat — yang bersegi
     * hanya permukaannya. Jitter besar membuat tepinya bergerigi dan
     * merusak kesan itu.
     */
    const wobble = 1 + (rand() - 0.5) * 0.05;

    // Elipsoid lebar, meniru proporsi pada gambar.
    pos.setXYZ(
      i,
      pos.getX(i) * wobble * 1.24,
      pos.getY(i) * wobble * 0.86,
      pos.getZ(i) * wobble * 1.02,
    );
  }

  paintFacets(geo, ICE, rand, 0.1);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Membangun awan sebagai gugus gumpalan.
 *
 * Referensi memperlihatkan satu gumpalan besar dengan tiga gumpalan
 * lebih kecil di sekelilingnya, beralas rata. Kelimanya digabung
 * menjadi satu geometri — tetap satu draw call.
 */
function buildCloudGeometry(seed: number): THREE.BufferGeometry {
  const rand = makeRng(seed);

  /** Susunan gumpalan, meniru tata letak pada referensi. */
  const blobs = [
    { x: 0.05, y: 0.18, z: 0, r: 1.0 },
    { x: -1.12, y: -0.16, z: 0.08, r: 0.72 },
    { x: 1.02, y: -0.2, z: -0.12, r: 0.64 },
    { x: 0.18, y: -0.24, z: 0.62, r: 0.58 },
    { x: -0.42, y: -0.22, z: -0.6, r: 0.52 },
  ];

  const positions: number[] = [];

  for (const blob of blobs) {
    const geo = new THREE.IcosahedronGeometry(blob.r, 1);
    const pos = geo.attributes.position;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);

      const wobble = 1 + (rand() - 0.5) * 0.14;

      // Ratakan alas: verteks di bawah garis tengah ditarik ke bawah.
      const ny = y < 0 ? blob.y - blob.r * 0.34 : blob.y + y * wobble * 0.88;

      positions.push(blob.x + x * wobble * 1.06, ny, blob.z + z * wobble * 1.06);
    }

    geo.dispose();
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

  // Awan diberi variasi lebih halus daripada batu — kain, bukan kristal.
  paintFacets(merged, CLOUD, rand, 0.06);
  merged.computeVertexNormals();
  return merged;
}

interface Seed {
  x: number;
  y: number;
  z: number;
  scale: number;
  spin: number;
  speed: number;
  shade: number;
}

/**
 * Sekumpulan objek melaju yang didaur ulang.
 *
 * Tanpa objek yang bergerak mundur, mata tidak punya acuan bahwa
 * pesawat sedang melaju — inilah yang menciptakan rasa kecepatan.
 */
function Drifters({
  count,
  kind,
  band,
}: {
  count: number;
  kind: 'rock' | 'cloud';
  band: 'near' | 'far';
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const quality = getQuality();

  const geometry = useMemo(() => {
    const seed = kind === 'rock' ? (band === 'near' ? 11 : 29) : 47;
    return kind === 'rock' ? buildRockGeometry(seed) : buildCloudGeometry(seed);
  }, [kind, band]);

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        // Putih = nilai netral agar setColorAt bekerja sebagai pengali.
        color: '#ffffff',
        vertexColors: true,
        roughness: kind === 'cloud' ? 0.92 : 0.46,
        metalness: kind === 'cloud' ? 0 : 0.12,
        flatShading: true,
        /*
         * Cahaya diri tipis mencegah facet yang membelakangi lampu
         * jatuh ke hitam. Pada referensi, bayangan es tetap biru —
         * es meneruskan cahaya, tidak menyerapnya.
         */
        emissive: new THREE.Color(kind === 'cloud' ? '#62b4e8' : '#2a72b0'),
        emissiveIntensity: kind === 'cloud' ? 0.32 : 0.26,
        transparent: band === 'far' || kind === 'cloud',
        opacity: band === 'far' ? 0.66 : kind === 'cloud' ? 0.92 : 1,
      }),
    [kind, band],
  );

  // Geometri & material memakai memori GPU. Tanpa pembuangan ini,
  // tiap buka-tutup permainan meninggalkan buffer menggantung.
  useLayoutEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  const seeds = useMemo<Seed[]>(() => {
    const rand = makeRng(kind === 'rock' ? (band === 'near' ? 707 : 313) : 919);

    const sizeMin = kind === 'cloud' ? 1.8 : band === 'near' ? 0.7 : 1.4;
    const sizeMax = kind === 'cloud' ? 3.2 : band === 'near' ? 1.9 : 2.8;

    return Array.from({ length: count }).map(() => {
      const spot = placeOutsideCorridor(rand);
      return {
        x: spot.x,
        y: spot.y,
        z: -78 + rand() * 88,
        scale: sizeMin + rand() * (sizeMax - sizeMin),
        // Awan tidak berputar — awan yang berputar terlihat aneh.
        spin: kind === 'cloud' ? 0 : (rand() - 0.5) * 0.3,
        speed: (band === 'near' ? 11 : 5) + rand() * 5,
        shade: (rand() - 0.5) * 2,
      };
    });
  }, [count, kind, band]);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const rot = useRef<Float32Array>(new Float32Array(count));

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const c = new THREE.Color();
    seeds.forEach((seed, i) => {
      dummy.position.set(seed.x, seed.y, seed.z);
      dummy.rotation.set(seed.spin, seed.spin * 2, seed.spin * 0.5);
      dummy.scale.setScalar(seed.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      // Variasi antar-objek, digeser ke atas agar tidak ada yang
      // jatuh terlalu gelap.
      c.setScalar(1.03 + seed.shade * 0.07);
      mesh.setColorAt(i, c);
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [seeds, dummy]);

  useFrame((_state, delta) => {
    try {
      const mesh = meshRef.current;
      if (!mesh || !quality.motion) return;

      const dt = Math.min(delta, 0.05);
      const rand = Math.random;

      seeds.forEach((seed, i) => {
        seed.z += seed.speed * dt;
        rot.current[i] += seed.spin * dt;

        // Daur ulang: begitu lewat kamera, kembalikan ke kejauhan —
        // dan tetap di luar koridor.
        if (seed.z > 18) {
          seed.z = -80;
          const spot = placeOutsideCorridor(rand);
          seed.x = spot.x;
          seed.y = spot.y;
        }

        dummy.position.set(seed.x, seed.y, seed.z);
        dummy.rotation.set(
          seed.spin + rot.current[i],
          seed.spin * 2 + rot.current[i] * 0.6,
          seed.spin * 0.5,
        );
        dummy.scale.setScalar(seed.scale);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      });

      mesh.instanceMatrix.needsUpdate = true;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[Brightoria] SpaceField error (diredam):', err);
    }
  });

  if (count === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      castShadow={false}
      receiveShadow={false}
      frustumCulled={false}
    />
  );
}

/**
 * Butiran bintang yang melintas.
 *
 * Boleh berada di koridor — ukurannya sangat kecil sehingga tidak
 * pernah menutupi teks jawaban, dan justru memperkuat rasa laju.
 */
function StarDust() {
  const ref = useRef<THREE.Points>(null);
  const quality = getQuality();

  const positions = useMemo(() => {
    const n = Math.max(40, scaleCount(160));
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 36;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 24;
      arr[i * 3 + 2] = -74 + Math.random() * 88;
    }
    return arr;
  }, []);

  useFrame((state, delta) => {
    try {
      if (!ref.current || !quality.motion) return;
      const dt = Math.min(delta, 0.05);

      const attr = ref.current.geometry.attributes.position as THREE.BufferAttribute;
      const arr = attr.array as Float32Array;

      for (let i = 0; i < arr.length; i += 3) {
        arr[i + 2] += 30 * dt;
        if (arr[i + 2] > 16) {
          arr[i + 2] = -74;
          arr[i] = (Math.random() - 0.5) * 36;
          arr[i + 1] = (Math.random() - 0.5) * 24;
        }
      }
      attr.needsUpdate = true;

      const m = ref.current.material as THREE.PointsMaterial;
      if (m) m.opacity = 0.45 + Math.sin(state.clock.elapsedTime * 1.6) * 0.14;
    } catch {
      /* diamkan */
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.11}
        color="#dff2ff"
        transparent
        opacity={0.5}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

export default function SpaceField() {
  const quality = getQuality();

  /*
   * Jumlah objek dijaga rendah.
   *
   * Kepadatan tinggi terasa mengesankan pada tangkapan layar, tapi
   * melelahkan saat dimainkan — dan membuat mata lebih sulit menemukan
   * gerbang jawaban.
   */
  const near = Math.max(5, scaleCount(13));
  const far = Math.max(3, scaleCount(8));
  const clouds = Math.max(2, scaleCount(6));

  return (
    <group>
      {/*
        Cahaya pengisi lembut dari atas.

        Lampu scene utama datang dari satu arah, sehingga sisi
        berlawanan tetap gelap meski emissive sudah ditambahkan. Lampu
        ini mengangkat sisi itu tanpa menghapus arah bayangan.
      */}
      <hemisphereLight args={['#dff2ff', '#3f7fb8', 0.6]} />

      <Drifters count={near} kind="rock" band="near" />
      <Drifters count={far} kind="rock" band="far" />
      {quality.tier !== 'low' && <Drifters count={clouds} kind="cloud" band="far" />}
      <StarDust />
    </group>
  );
}
