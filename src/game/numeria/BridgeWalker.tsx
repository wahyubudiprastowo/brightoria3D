import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getQuality } from '../../render/quality';
import BlockyCharacter, { type CharacterMotion } from '../../components/world3d/BlockyCharacter';

/**
 * BridgeWalker.tsx — Penjelajah yang menyeberangi jembatan (Patch 55).
 *
 * ====================================================================
 * KENAPA BERKAS TERSENDIRI
 * ====================================================================
 * Versi sebelumnya menulis karakter penjelajah LANGSUNG di dalam
 * NumeriaGame.tsx — kotak, bola mata, dan kaki yang dirakit sendiri.
 * Akibatnya penjelajah di Numeria terlihat berbeda dari penjelajah di
 * Ekspedisi, padahal seharusnya orang yang sama.
 *
 * Dengan dipisah ke berkas sendiri, ia memakai `BlockyCharacter` yang
 * sama persis dengan seluruh Brightoria: proporsi sama, busana sama,
 * warna kulit sama — semuanya mengikuti pilihan anak di layar awal.
 *
 * Memisahkannya juga berarti NumeriaGame.tsx cukup diubah DUA BARIS,
 * bukan ditulis ulang.
 *
 * ====================================================================
 * KENAPA motionRef, BUKAN prop speed
 * ====================================================================
 * Kecepatan berubah tiap frame selama menyeberang. Mengirimkannya lewat
 * prop biasa berarti 60 render ulang per detik.
 *
 * `motionRef` adalah wadah yang dimutasi langsung di dalam useFrame,
 * lalu dibaca BlockyCharacter pada frame yang sama — nol render ulang.
 * Pola ini sudah dipakai karakter pemain di Ekspedisi.
 * ====================================================================
 */

/** Lama satu penyeberangan penuh, dalam detik. */
const CROSS_DURATION = 2.1;

export default function BridgeWalker({
  crossing,
  span,
}: {
  /** Benar saat jembatan tersambung dan penjelajah mulai menyeberang. */
  crossing: boolean;
  /** Lebar jembatan dalam satuan dunia. */
  span: number;
}) {
  const group = useRef<THREE.Group>(null);
  const start = useRef<number | null>(null);
  const quality = getQuality();

  /** Jembatan gerak tanpa render ulang — lihat catatan di atas. */
  const motion = useRef<CharacterMotion>({ speed: 0, airborne: false });

  const from = -span / 2 - 0.85;
  const to = span / 2 + 0.85;

  useEffect(() => {
    if (crossing) start.current = null;
  }, [crossing]);

  useFrame((state) => {
    try {
      if (!group.current) return;
      const t = state.clock.elapsedTime;

      if (crossing) {
        if (start.current === null) start.current = t;
        const p = Math.min(1, (t - start.current) / CROSS_DURATION);

        group.current.position.x = from + (to - from) * p;

        // Menghadap arah jalan.
        group.current.rotation.y = Math.PI / 2;

        /**
         * Melambat di ujung, bukan berhenti mendadak.
         *
         * Nilai ini dibaca BlockyCharacter untuk menentukan seberapa
         * lebar ayunan kaki — jadi langkahnya ikut memendek saat
         * mendekati seberang. Itu yang membuatnya terasa punya bobot.
         */
        motion.current.speed = p > 0.88 ? (1 - p) / 0.12 : 1;
      } else {
        group.current.position.x = from;
        group.current.rotation.y = Math.PI / 2;
        motion.current.speed = 0;

        if (quality.motion) {
          // Bernapas pelan saat menunggu — karakter tidak pernah
          // benar-benar kaku.
          group.current.position.y = Math.sin(t * 1.6) * 0.012;
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[Brightoria] BridgeWalker error (diredam):', err);
    }
  });

  return (
    <group ref={group} position={[from, 0, 0]}>
      {/* Bayangan kontak — membuat penjelajah terbaca BERDIRI di atas
          papan, bukan melayang di atas jurang. */}
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.32, 18]} />
        <meshBasicMaterial color="#03201a" transparent opacity={0.3} depthWrite={false} />
      </mesh>

      {/* Diperkecil sedikit: jembatan bisa mencapai 12 papan, dan
          karakter seukuran penuh akan mendominasi layar. */}
      <group scale={0.62}>
        <BlockyCharacter motionRef={motion} accessory="backpack" />
      </group>
    </group>
  );
}
