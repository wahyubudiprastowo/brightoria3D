import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { getQuality } from '../../render/quality';
import BlockyCharacter, { PALETTES } from '../../components/world3d/BlockyCharacter';
import { terrainHeight } from './expeditionData';

/**
 * NpcAira.tsx — AIRA, pemandu ilmu Brightoria.
 *
 * ====================================================================
 * BERKAS INI SEHARUSNYA IKUT PATCH 41
 * ====================================================================
 * Pengiriman paket Patch 41 gagal berulang kali, sehingga versi ini
 * tidak pernah sampai. Yang terpasang sekarang kemungkinan masih versi
 * Patch 39 — Aira berjubah kerucut dengan sabuk torus.
 *
 * Berkas ini OPSIONAL untuk memperbaiki galat build. Ia hanya
 * menyelaraskan Aira dengan sistem karakter blocky, agar seluruh sosok
 * di arena memakai proporsi dan bahasa visual yang sama.
 *
 * KONTRAK PROPS TIDAK BERUBAH: { x, z, near, hasOffer, hasReady }
 * sehingga ExpeditionGame.tsx tidak perlu penyesuaian apa pun.
 *
 * ====================================================================
 * PRINSIP ANIMASI YANG DIPERTAHANKAN
 * ====================================================================
 * ANTICIPATION — Aira "bangun" saat pemain mendekat (membesar sedikit,
 * menoleh) sebelum menyapa. Bahasa tubuh inilah yang membuat NPC terasa
 * sadar akan kehadiran pemain, bukan patung yang kebetulan bergerak.
 *
 * Aksi karakter mengikuti keadaan quest:
 *   siap dilaporkan / ada tawaran -> melambai (menarik perhatian)
 *   selain itu                    -> membaca buku (idle yang bermakna)
 *
 * Semua useFrame dibungkus try/catch — pelajaran Patch 15, di mana satu
 * galat di render loop mematikan seluruh scene dan tidak bisa ditangkap
 * React ErrorBoundary.
 * ====================================================================
 */

export default function NpcAira({
  x,
  z,
  near,
  hasOffer,
  hasReady,
}: {
  x: number;
  z: number;
  /** Pemain berada dalam jangkauan bicara. */
  near: boolean;
  /** Ada quest baru yang bisa ditawarkan (tanda seru). */
  hasOffer: boolean;
  /** Ada quest aktif yang sudah siap diserahkan (tanda centang). */
  hasReady: boolean;
}) {
  const quality = getQuality();
  const bodyRef = useRef<THREE.Group>(null);
  const markerRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  const groundY = useMemo(() => terrainHeight(x, z), [x, z]);

  // Nilai di-lerp, bukan di-set langsung — perpindahan bertahap inilah
  // yang membuat transisi terasa halus, bukan patah.
  const anim = useRef({ awake: 0 });

  const action = near && (hasOffer || hasReady) ? 'wave' : 'read';

  useFrame((state, delta) => {
    try {
      const dt = Math.min(delta, 0.05);
      const t = state.clock.elapsedTime;
      const a = anim.current;

      // ANTICIPATION: bangun perlahan saat pemain mendekat.
      const awakeTarget = near ? 1 : 0;
      a.awake += (awakeTarget - a.awake) * Math.min(1, dt * 4.5);

      if (!quality.motion) return;

      if (bodyRef.current) {
        // Sedikit membesar saat sadar ada tamu — bahasa tubuh "perhatian".
        const s = 1 + a.awake * 0.045;
        bodyRef.current.scale.set(s, s, s);
        // Menoleh lembut ke arah pemain.
        bodyRef.current.rotation.y = Math.sin(t * 0.45) * 0.1 + a.awake * 0.25;
      }

      // Penanda quest melayang & berputar.
      if (markerRef.current) {
        markerRef.current.position.y = 2.3 + Math.sin(t * 2.1) * 0.09;
        markerRef.current.rotation.y = t * 1.4;
        const visible = hasOffer || hasReady;
        const target = visible ? 1 : 0.001;
        const cur = markerRef.current.scale.x;
        markerRef.current.scale.setScalar(cur + (target - cur) * Math.min(1, dt * 6));
      }

      // Lingkaran kaki berdenyut saat pemain dekat.
      if (ringRef.current) {
        const mat = ringRef.current.material as THREE.MeshBasicMaterial;
        if (mat) mat.opacity = (near ? 0.5 : 0.22) + Math.sin(t * 1.8) * 0.06;
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[Brightoria] NpcAira animasi error (diredam):', err);
    }
  });

  return (
    <group position={[x, groundY, z]}>
      <group ref={bodyRef}>
        <BlockyCharacter
          palette={PALETTES.guide}
          speed={0}
          action={action}
          accessory="book"
          /*
           * Aira memakai busana pemandu — hijab BIRU LANGIT, bukan
           * taupe seperti busana anak. Ia harus terbaca sekeluarga
           * dengan dunia ini, tapi jelas BUKAN "aku".
           */
          outfit="muslim-guide"
          /*
           * Warna kulit DIKUNCI, tidak mengikuti pilihan anak. Aira
           * adalah tokoh tersendiri, bukan cerminan pemain.
           */
          skinTone="#f3c9a0"
        />
      </group>

      {/* --- PENANDA QUEST (tanda seru / centang) --- */}
      <group ref={markerRef} position={[0, 2.3, 0]} scale={0.001}>
        {hasReady ? (
          <>
            {/* Centang: dua balok miring membentuk V */}
            <mesh position={[-0.05, -0.02, 0]} rotation={[0, 0, -0.7]}>
              <boxGeometry args={[0.08, 0.18, 0.08]} />
              <meshStandardMaterial
                color="#3fbf7f"
                emissive="#6fffb0"
                emissiveIntensity={2.2}
                flatShading
              />
            </mesh>
            <mesh position={[0.05, 0.03, 0]} rotation={[0, 0, 0.55]}>
              <boxGeometry args={[0.08, 0.32, 0.08]} />
              <meshStandardMaterial
                color="#3fbf7f"
                emissive="#6fffb0"
                emissiveIntensity={2.2}
                flatShading
              />
            </mesh>
          </>
        ) : (
          <>
            {/* Tanda seru: batang + titik */}
            <mesh position={[0, 0.09, 0]}>
              <boxGeometry args={[0.095, 0.28, 0.095]} />
              <meshStandardMaterial
                color="#28a8e0"
                emissive="#a8dcf5"
                emissiveIntensity={2.4}
                flatShading
              />
            </mesh>
            <mesh position={[0, -0.14, 0]}>
              <boxGeometry args={[0.095, 0.095, 0.095]} />
              <meshStandardMaterial
                color="#28a8e0"
                emissive="#a8dcf5"
                emissiveIntensity={2.4}
                flatShading
              />
            </mesh>
          </>
        )}
      </group>

      {/* Lingkaran cahaya di kaki — menandai Aira sebagai titik penting. */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.66, 0.84, 28]} />
        <meshBasicMaterial color="#28a8e0" transparent opacity={0.25} />
      </mesh>

      <Html center position={[0, 2.7, 0]} occlude={false} zIndexRange={[20, 0]}>
        <div className="exp-portal-label">
          <b>📘 Aira</b>
          <span>{hasReady ? 'Laporkan hasilmu!' : hasOffer ? 'Ada tugas baru' : 'Pemandu Ilmu'}</span>
        </div>
      </Html>
    </group>
  );
}
