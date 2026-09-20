import { Component, useMemo, useRef, useState, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { getQuality } from '../../render/quality';

/**
 * MapPlane.tsx — Pesawat yang terbang mengelilingi peta petualangan.
 *
 * ====================================================================
 * HASIL BEDAH meshypesawat.glb (angka nyata, bukan perkiraan)
 * ====================================================================
 *   vertex        : 293.646
 *   segitiga      : 544.694
 *   berkas        : 15,44 MB
 *   mesh          : 1 (satu primitive, satu material)
 *   animasi       : TIDAK ADA — model statis
 *   ekstensi      : EXT_texture_webp (WAJIB), KHR_mesh_quantization
 *   ukuran akhir  : 1,81 x 0,46 x 1,90 unit dunia
 *   bufferView    : 2,24 MB YATIM (14,5% berkas tidak terpakai sama sekali)
 *
 * Anggaran wajar aset peta untuk permainan anak: ~5.000 segitiga.
 * Berkas ini 109 KALI LIPAT di atas itu.
 *
 * Memuatnya apa adanya akan membekukan perangkat kelas menengah —
 * persis keluhan "muter-muter" yang sudah Anda alami. Karena itu
 * komponen ini memuat /assets/models/pesawat.glb, yaitu HASIL
 * PENGECILAN berkas Anda. Perintah pengecilannya ada di
 * docs/OPTIMASI-PESAWAT.md.
 *
 * ====================================================================
 * SATU KETERBATASAN YANG PERLU ANDA TAHU
 * ====================================================================
 * Seluruh pesawat adalah SATU mesh yang sudah digabung. Baling-balingnya
 * tidak bisa dipisahkan dari badan, jadi tidak bisa diputar sendiri.
 *
 * Jalan keluarnya: baling-baling digambar ULANG lewat kode sebagai
 * cakram berputar di hidung pesawat. Itu yang dilakukan <Propeller />
 * di bawah. Hasilnya justru lebih ringan daripada baling-baling mesh.
 * ====================================================================
 */

const MODEL_URL = '/assets/models/pesawat.glb';

// Dipanggil di tingkat modul supaya pemuatan dimulai lebih awal.
// Dibungkus try/catch: bila berkas belum ada, aplikasi tetap jalan.
try {
  useGLTF.preload(MODEL_URL);
} catch {
  /* diamkan — fallback prosedural yang akan dipakai */
}

// ---------------------------------------------------------------------------
// LINTASAN TERBANG
// ---------------------------------------------------------------------------

/**
 * Lintasan melingkar di atas peta.
 *
 * Tinggi 2,6 unit dipilih supaya pesawat lewat DI ATAS pulau tertinggi
 * (Kampung Adab di y=2,05) tanpa menabraknya, tapi masih di bawah kamera.
 *
 * Radius 3,4 sedikit lebih besar daripada cincin pulau (~2,7) agar
 * pesawat mengitari dari luar, bukan memotong tengah peta.
 */
function flightPoint(t: number, out: THREE.Vector3) {
  const angle = t * Math.PI * 2;
  const radius = 3.4;

  out.set(
    Math.cos(angle) * radius,
    // Naik-turun lembut — penerbangan datar terasa seperti rel kereta.
    2.6 + Math.sin(angle * 2) * 0.28,
    Math.sin(angle) * radius,
  );
  return out;
}

// ---------------------------------------------------------------------------
// BALING-BALING
// ---------------------------------------------------------------------------

/**
 * Baling-baling buatan kode.
 *
 * Dua bagian:
 *   1. Tiga bilah tipis — terlihat saat putaran lambat
 *   2. Cakram tembus pandang — mengambil alih saat putaran cepat
 *
 * Ini meniru cara mata melihat baling-baling sungguhan: bilahnya kabur
 * jadi cakram. Menggambar bilah saja akan terlihat berkedip (aliasing)
 * pada kecepatan tinggi.
 */
function Propeller({ radius = 0.26 }: { radius?: number }) {
  const blades = useRef<THREE.Group>(null);
  const quality = getQuality();

  useFrame((_, delta) => {
    try {
      if (!blades.current || !quality.motion) return;
      // Sengaja TIDAK memakai elapsedTime: delta membuat putaran tetap
      // konsisten walau frame rate turun.
      blades.current.rotation.z += delta * 26;
    } catch {
      /* diamkan */
    }
  });

  return (
    <group>
      {/* Bilah */}
      <group ref={blades}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation={[0, 0, (i / 3) * Math.PI * 2]}>
            <boxGeometry args={[0.035, radius * 2, 0.012]} />
            <meshStandardMaterial
              color="#4a3520"
              roughness={0.6}
              metalness={0.2}
            />
          </mesh>
        ))}
      </group>

      {/* Cakram kabur */}
      <mesh position={[0, 0, 0.004]}>
        <circleGeometry args={[radius, 20]} />
        <meshBasicMaterial
          color="#d8d2c4"
          transparent
          opacity={quality.motion ? 0.2 : 0}
          depthWrite={false}
        />
      </mesh>

      {/* Bonggol tengah */}
      <mesh>
        <sphereGeometry args={[0.045, 10, 10]} />
        <meshStandardMaterial color="#8a2033" roughness={0.4} metalness={0.3} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// BADAN PESAWAT — CADANGAN PROSEDURAL
// ---------------------------------------------------------------------------

/**
 * Pesawat sederhana dari bentuk dasar, dipakai bila GLB gagal dimuat.
 *
 * Kenapa perlu cadangan: berkas Anda MEWAJIBKAN EXT_texture_webp.
 * Bila peramban tidak mendukung WebP, atau berkas belum disalin ke
 * public/assets/models/, pemuatan GAGAL. Tanpa cadangan, seluruh peta
 * ikut runtuh — itu persis pola kegagalan yang sudah dua kali terjadi.
 *
 * Warnanya meniru referensi Anda: badan putih gading, aksen merah tua.
 */
function FallbackPlane() {
  return (
    <group>
      {/* Badan */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.12, 0.5, 4, 10]} />
        <meshStandardMaterial color="#f5efe0" roughness={0.45} metalness={0.15} />
      </mesh>

      {/* Sayap */}
      <mesh position={[0, 0.02, 0.05]}>
        <boxGeometry args={[0.95, 0.03, 0.22]} />
        <meshStandardMaterial color="#c03040" roughness={0.5} metalness={0.1} />
      </mesh>

      {/* Ekor tegak */}
      <mesh position={[0, 0.14, -0.3]}>
        <boxGeometry args={[0.025, 0.2, 0.16]} />
        <meshStandardMaterial color="#c03040" roughness={0.5} />
      </mesh>

      {/* Ekor datar */}
      <mesh position={[0, 0.04, -0.32]}>
        <boxGeometry args={[0.34, 0.022, 0.12]} />
        <meshStandardMaterial color="#c03040" roughness={0.5} />
      </mesh>

      {/* Kabin */}
      <mesh position={[0, 0.11, 0.06]}>
        <sphereGeometry args={[0.085, 12, 10]} />
        <meshStandardMaterial
          color="#9fd8e8"
          roughness={0.15}
          metalness={0.35}
          transparent
          opacity={0.75}
        />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// BADAN PESAWAT — MODEL GLB
// ---------------------------------------------------------------------------

/**
 * Memuat GLB dan menormalkan ukurannya.
 *
 * Penormalan itu WAJIB, bukan pilihan. Skala node di berkas Anda
 * 0,000116 — hasil ekspor dari perangkat lunak yang memakai satuan
 * berbeda. Tanpa penormalan, pesawat bisa muncul sebesar sebutir debu
 * atau sebesar seluruh peta, tergantung bagaimana berkas itu diolah
 * ulang saat pengecilan.
 *
 * Kita ukur kotak pembatasnya lalu paksa ke lebar sayap yang kita mau.
 * Cara ini kebal terhadap apa pun yang terjadi pada skala aslinya.
 */
function GltfPlane({ span }: { span: number }) {
  const gltf = useGLTF(MODEL_URL);

  const model = useMemo(() => {
    try {
      const scene = gltf.scene.clone(true);

      const box = new THREE.Box3().setFromObject(scene);
      const size = new THREE.Vector3();
      box.getSize(size);

      // Sumbu terpanjang dianggap bentang sayap.
      const longest = Math.max(size.x, size.y, size.z) || 1;
      const k = span / longest;
      scene.scale.setScalar(k);

      // Pusatkan ke titik asal supaya rotasi berputar di tengah badan,
      // bukan di sudut kotak pembatas.
      const center = new THREE.Vector3();
      box.getCenter(center);
      scene.position.copy(center).multiplyScalar(-k);

      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.castShadow = false;
        mesh.receiveShadow = false;
        // frustumCulled dimatikan: pesawat kecil dan selalu bergerak,
        // pengujian culling justru lebih mahal daripada menggambarnya.
        mesh.frustumCulled = false;
      });

      return scene;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[Brightoria] MapPlane: gagal menyiapkan model:', err);
      return null;
    }
  }, [gltf, span]);

  if (!model) return <FallbackPlane />;
  return <primitive object={model} />;
}

// ---------------------------------------------------------------------------
// PEMBATAS GALAT
// ---------------------------------------------------------------------------

/**
 * Menangkap kegagalan pemuatan GLB dan berpindah ke cadangan.
 *
 * useGLTF melempar Promise saat memuat (Suspense) dan melempar Error
 * bila gagal. Tanpa pembatas ini, error akan naik ke pembatas peta dan
 * menjatuhkan SELURUH tampilan 3D.
 */
function PlaneBody({ span }: { span: number }) {
  const [failed, setFailed] = useState(false);

  if (failed) return <FallbackPlane />;

  return (
    <ErrorCatcher onError={() => setFailed(true)}>
      <GltfPlane span={span} />
    </ErrorCatcher>
  );
}

class ErrorCatcher extends Component<
  { children: ReactNode; onError: () => void },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; onError: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    // eslint-disable-next-line no-console
    console.error('[Brightoria] MapPlane: model gagal dimuat, memakai cadangan:', error);
    this.props.onError();
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

// ---------------------------------------------------------------------------
// KOMPONEN UTAMA
// ---------------------------------------------------------------------------

export default function MapPlane({
  /** Bentang sayap dalam unit dunia. */
  span = 0.62,
  /** Berapa detik untuk satu putaran penuh mengelilingi peta. */
  period = 46,
}: {
  span?: number;
  period?: number;
}) {
  const rig = useRef<THREE.Group>(null);
  const tilt = useRef<THREE.Group>(null);
  const quality = getQuality();

  // Vektor dipakai ulang tiap frame — mengalokasi Vector3 baru 60x/detik
  // memicu pengumpulan sampah yang terasa sebagai tersendat.
  const here = useMemo(() => new THREE.Vector3(), []);
  const ahead = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    try {
      if (!rig.current) return;

      const t = quality.motion
        ? (state.clock.elapsedTime / period) % 1
        : 0.12; // diam di titik enak bila gerak dimatikan

      flightPoint(t, here);
      rig.current.position.copy(here);

      // Arah hadap dihitung dari titik SEDIKIT DI DEPAN pada lintasan.
      // Menghitung arah dari kecepatan sesaat menghasilkan goyangan;
      // melihat ke depan membuat belokan mulus.
      flightPoint((t + 0.012) % 1, ahead);
      rig.current.lookAt(ahead);

      // Miring saat membelok — pesawat yang tidak miring terlihat
      // seperti meluncur di atas kaca, bukan terbang.
      if (tilt.current) {
        tilt.current.rotation.z = quality.motion ? -0.42 : -0.2;
        tilt.current.rotation.x = Math.sin(t * Math.PI * 4) * 0.06;
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[Brightoria] MapPlane useFrame (diredam):', err);
    }
  });

  return (
    <group ref={rig}>
      <group ref={tilt}>
        <PlaneBody span={span} />

        {/* Baling-baling di hidung. Posisi z positif = arah terbang. */}
        <group position={[0, 0.01, span * 0.52]} rotation={[0, 0, 0]}>
          <Propeller radius={span * 0.38} />
        </group>
      </group>
    </group>
  );
}
