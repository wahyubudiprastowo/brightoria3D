import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getQuality } from '../../render/quality';

/**
 * SelectionMarker.tsx — Penanda pulau terpilih (Patch 51).
 *
 * ====================================================================
 * MASALAH YANG DIPECAHKAN
 * ====================================================================
 * Pengguna bertanya: "ring effect cuma 2 yang ada ya, atau ring effect
 * pas dipilih? soalnya beberapa pas dipilih gak keluar ring effect."
 *
 * Kebingungannya beralasan, dan ini kesalahan desain saya.
 *
 * Cincin besar yang terlihat di layar adalah PENANDA PENCAPAIAN —
 * muncul otomatis di pulau ber-mastery tinggi, bukan penanda terpilih.
 * Persis dua pulau yang memenuhi syarat, jadi wajar terlihat "cuma 2".
 *
 * Sementara penanda TERPILIH yang saya buat di Patch 37 ternyata jauh
 * terlalu samar. Waktu itu saya mengecilkannya karena kerucut cahaya
 * sebelumnya dikeluhkan mengganggu — tapi saya mengecilkannya terlalu
 * jauh sampai hampir tidak terlihat.
 *
 * ====================================================================
 * TIGA PRINSIP DESAIN PENANDA BARU
 * ====================================================================
 * 1. BERBEDA BENTUK, BUKAN SEKADAR BERBEDA WARNA.
 *    Penanda pencapaian berbentuk CINCIN yang mengelilingi pulau.
 *    Penanda terpilih memakai PANAH DI ATAS + denyut di kaki — bentuk
 *    yang sama sekali lain, jadi tidak mungkin tertukar meski warnanya
 *    kebetulan mirip.
 *
 * 2. PANAH ADALAH ISYARAT PALING UNIVERSAL.
 *    Untuk anak usia 6-12, panah yang menunjuk ke bawah sambil
 *    memantul jauh lebih langsung terbaca daripada cahaya atau aura.
 *    Tidak perlu dipelajari — semua anak sudah paham artinya.
 *
 * 3. TETAP DI BAWAH SILUET PULAU.
 *    Pelajaran dari Patch 37: apa pun yang menjulang tinggi akan
 *    menutupi pulau tetangga. Penanda ini hanya menempati ruang tepat
 *    di atas puncak pulau dan di kakinya — tidak pernah melebar ke
 *    samping.
 *
 * ====================================================================
 * KENAPA useFrame DIBUNGKUS try/catch
 * ====================================================================
 * Pelajaran dari Patch 15: satu galat di dalam render loop mematikan
 * SELURUH scene, dan React ErrorBoundary tidak bisa menangkapnya
 * karena galat itu terjadi di luar siklus render React.
 * ====================================================================
 */

/**
 * Panah menunjuk ke bawah di atas pulau.
 *
 * Berputar pelan sekaligus memantul. Perputaran membuatnya terbaca
 * sebagai kristal bersisi empat, bukan segitiga datar — sehingga tetap
 * terlihat jelas dari sudut kamera mana pun.
 */
function SelectionArrow({ color, accent }: { color: string; accent: string }) {
  const group = useRef<THREE.Group>(null);
  const quality = getQuality();

  useFrame((state) => {
    try {
      if (!group.current || !quality.motion) return;
      const t = state.clock.elapsedTime;
      // Pantulan memakai sinus kuadrat agar jedanya terasa di puncak,
      // meniru gerak memantul yang sebenarnya.
      const bounce = Math.abs(Math.sin(t * 1.9));
      group.current.position.y = 1.62 + bounce * 0.2;
      group.current.rotation.y = t * 1.1;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[Brightoria] SelectionArrow error (diredam):', err);
    }
  });

  return (
    <group ref={group} position={[0, 1.62, 0]}>
      {/* Badan panah — kerucut bersisi empat, menunjuk ke bawah. */}
      <mesh rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.27, 0.46, 4]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={2.4}
          roughness={0.25}
          metalness={0.35}
          flatShading
        />
      </mesh>

      {/* Kilau kecil di pangkal — membuat panah terbaca sebagai objek
          bercahaya, bukan bentuk padat biasa. */}
      <mesh position={[0, 0.3, 0]}>
        <octahedronGeometry args={[0.11, 0]} />
        <meshStandardMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={2.8}
          flatShading
        />
      </mesh>

      <pointLight color={color} intensity={2.2} distance={4.5} />
    </group>
  );
}

/**
 * Cincin berdenyut di kaki pulau.
 *
 * Berbeda dari cincin pencapaian dalam dua hal yang disengaja:
 * posisinya di BAWAH pulau (bukan mengelilingi), dan ia BERDENYUT
 * (bukan berputar tetap). Denyut menandakan "sedang aktif"; putaran
 * tetap menandakan "pencapaian permanen".
 */
function BasePulse({ color }: { color: string }) {
  const ref = useRef<THREE.Mesh>(null);
  const quality = getQuality();

  useFrame((state) => {
    try {
      if (!ref.current || !quality.motion) return;
      const t = state.clock.elapsedTime;
      const pulse = 1 + Math.sin(t * 2.3) * 0.09;
      ref.current.scale.set(pulse, pulse, 1);

      const material = ref.current.material as THREE.MeshBasicMaterial;
      if (material) material.opacity = 0.48 + Math.sin(t * 2.3) * 0.16;
    } catch {
      /* diamkan — kegagalan animasi tidak boleh menghentikan scene */
    }
  });

  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.48, 0]}>
      <ringGeometry args={[1.08, 1.42, 40]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.5}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

/**
 * Gelombang yang mengembang keluar dari kaki pulau.
 *
 * Fungsinya menarik pandangan ke pulau terpilih meski anak sedang
 * melihat bagian lain peta — gerakan mengembang tertangkap penglihatan
 * tepi jauh lebih baik daripada cahaya yang diam.
 *
 * Dua gelombang dengan jeda berbeda agar berdatangan bergantian, bukan
 * berbarengan.
 */
function SonarWave({ color, delay }: { color: string; delay: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const quality = getQuality();

  useFrame((state) => {
    try {
      if (!ref.current) return;

      if (!quality.motion) {
        // Saat gerakan dimatikan, gelombang disembunyikan sepenuhnya
        // agar tidak menumpuk jadi cincin diam yang membingungkan.
        const staticMat = ref.current.material as THREE.MeshBasicMaterial;
        if (staticMat) staticMat.opacity = 0;
        return;
      }

      const cycle = 2.4;
      const phase = ((state.clock.elapsedTime + delay) % cycle) / cycle;

      const scale = 0.85 + phase * 1.5;
      ref.current.scale.set(scale, scale, 1);

      const material = ref.current.material as THREE.MeshBasicMaterial;
      // Memudar dengan pangkat dua: cepat di awal, pelan di akhir —
      // meniru gelombang air yang sebenarnya.
      if (material) material.opacity = (1 - phase) * (1 - phase) * 0.42;
    } catch {
      /* diamkan */
    }
  });

  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]}>
      <ringGeometry args={[1.2, 1.32, 40]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

/**
 * Cincin tipis saat kursor melewati pulau.
 *
 * Sengaja dibuat jauh lebih lemah daripada penanda terpilih: ia hanya
 * mengatakan "pulau ini bisa diketuk", bukan "pulau ini sedang
 * dipilih". Membuat keduanya sama kuat justru menghapus perbedaannya.
 */
function HoverRing({ color }: { color: string }) {
  const ref = useRef<THREE.Mesh>(null);
  const quality = getQuality();

  useFrame((state) => {
    try {
      if (!ref.current || !quality.motion) return;
      ref.current.rotation.z = state.clock.elapsedTime * 0.6;
    } catch {
      /* diamkan */
    }
  });

  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.46, 0]}>
      <ringGeometry args={[1.14, 1.3, 32]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.3}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

/**
 * Penanda lengkap untuk satu pulau.
 *
 * Menampilkan lapisan yang berbeda sesuai keadaan:
 *   terpilih -> panah + denyut + dua gelombang
 *   disorot  -> cincin tipis berputar saja
 *   lainnya  -> tidak ada apa pun
 */
export default function SelectionMarker({
  active,
  hovered,
  color,
  accent,
}: {
  active: boolean;
  hovered: boolean;
  /** Warna utama dunia — dipakai panah & denyut. */
  color: string;
  /** Warna aksen dunia — dipakai kilau di pangkal panah. */
  accent: string;
}) {
  if (active) {
    return (
      <group>
        <SelectionArrow color={color} accent={accent} />
        <BasePulse color={color} />
        <SonarWave color={color} delay={0} />
        <SonarWave color={color} delay={1.2} />
      </group>
    );
  }

  if (hovered) {
    return <HoverRing color={color} />;
  }

  return null;
}
