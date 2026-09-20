import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { getQuality, scaleCount } from '../../render/quality';
import type { World } from '../../data/worlds';
import IslandProps, { themeForWorld } from './IslandProps';
import SelectionMarker from './SelectionMarker';

/**
 * Island3D.tsx — Pulau 3D penuh (Patch 51).
 *
 * ====================================================================
 * PERUBAHAN PATCH 51
 * ====================================================================
 * Ditambahkan SelectionMarker — penanda pulau terpilih yang jelas
 * terlihat.
 *
 * Sebelumnya penanda terpilih hanya berupa kristal kecil yang
 * mengorbit ditambah pembesaran skala 12%. Keduanya terlalu samar,
 * sehingga anak tidak punya isyarat pasti bahwa pulau yang diketuk
 * sudah terpilih.
 *
 * Yang justru mencolok di layar adalah penanda PENCAPAIAN (cincin
 * besar di pulau ber-mastery tinggi) — dan itu membuat keduanya
 * tertukar. Lihat catatan lengkap di SelectionMarker.tsx.
 *
 * Selain itu pembesaran saat terpilih dinaikkan dari 1,12 ke 1,16 agar
 * perbedaannya terbaca jelas tanpa membuat pulau menabrak tetangganya.
 *
 * ====================================================================
 * KONTRAK PROPS TIDAK BERUBAH
 * ====================================================================
 * { world, index, active, hovered, onSelect, onHover } — persis sama
 * seperti Patch 40, jadi WorldScene3D.tsx tidak perlu disentuh.
 * ====================================================================
 */

/** Profil bongkah batu: titik (radius, tinggi) yang diputar 360 derajat. */
function buildRockGeometry(seed: number, detail: number): THREE.BufferGeometry {
  const points: THREE.Vector2[] = [
    new THREE.Vector2(0.001, 0.34),
    new THREE.Vector2(0.62, 0.3),
    new THREE.Vector2(0.86, 0.18),
    new THREE.Vector2(0.94, 0.02),
    new THREE.Vector2(0.78, -0.2),
    new THREE.Vector2(0.52, -0.52),
    new THREE.Vector2(0.28, -0.86),
    new THREE.Vector2(0.08, -1.18),
    new THREE.Vector2(0.001, -1.3),
  ];
  const segments = Math.max(16, Math.round(detail / 3));
  const geo = new THREE.LatheGeometry(points, segments);

  const pos = geo.attributes.position;
  const colors: number[] = [];
  const grass = new THREE.Color('#5fbf7a');
  const soil = new THREE.Color('#9c6b43');
  const rock = new THREE.Color('#4a3b33');

  // Jitter deterministik: pulau yang sama selalu berbentuk sama antar
  // sesi — penting supaya peta tidak "berubah bentuk" tiap refresh.
  let rng = seed * 9301 + 49297;
  const rand = () => {
    rng = (rng * 9301 + 49297) % 233280;
    return rng / 233280;
  };

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const horizontal = Math.sqrt(x * x + z * z);

    if (horizontal > 0.02 && y > -1.25) {
      const wobble = 1 + (rand() - 0.5) * 0.14;
      pos.setX(i, x * wobble);
      pos.setZ(i, z * wobble);
      pos.setY(i, y + (rand() - 0.5) * 0.05);
    }

    const t = THREE.MathUtils.clamp((y + 1.3) / 1.64, 0, 1);
    const c =
      t > 0.78
        ? grass.clone()
        : t > 0.45
          ? soil.clone().lerp(grass, (t - 0.45) / 0.33)
          : rock.clone().lerp(soil, t / 0.45);
    colors.push(c.r, c.g, c.b);
  }

  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

function OrbitingCrystal({
  color,
  radius,
  speed,
  phase,
  size,
}: {
  color: string;
  radius: number;
  speed: number;
  phase: number;
  size: number;
}) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    try {
      if (!ref.current) return;
      const t = state.clock.elapsedTime * speed + phase;
      ref.current.position.set(
        Math.cos(t) * radius,
        0.55 + Math.sin(t * 1.6) * 0.16,
        Math.sin(t) * radius,
      );
      ref.current.rotation.y += 0.02;
      ref.current.rotation.x = Math.sin(t) * 0.35;
    } catch {
      /* diamkan */
    }
  });

  return (
    <mesh ref={ref}>
      <octahedronGeometry args={[size, 0]} />
      {/* emissive tinggi + threshold bloom = hanya kristal ini yang
          benar-benar bersinar, bukan seluruh layar. */}
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={2.4}
        roughness={0.15}
        metalness={0.35}
        flatShading
      />
    </mesh>
  );
}

export default function Island3D({
  world,
  index,
  active,
  hovered,
  onSelect,
  onHover,
}: {
  world: World;
  index: number;
  active: boolean;
  hovered: boolean;
  onSelect: (w: World) => void;
  onHover: (id: string | null) => void;
}) {
  const quality = getQuality();
  const groupRef = useRef<THREE.Group>(null);
  const scaleRef = useRef<THREE.Group>(null);
  const rockRef = useRef<THREE.Group>(null);
  const spawnRef = useRef<number | null>(null);
  const baseY = world.position[1];

  const rockGeometry = useMemo(
    () => buildRockGeometry(index + 1, quality.geometryDetail),
    [index, quality.geometryDetail],
  );

  const theme = useMemo(() => themeForWorld(world.id), [world.id]);

  const crystals = useMemo(() => {
    const count = Math.max(1, scaleCount(3));
    return Array.from({ length: count }).map((_, i) => ({
      radius: 1.2 + i * 0.12,
      speed: 0.35 + i * 0.09,
      phase: (i / count) * Math.PI * 2 + index,
      size: 0.085 - i * 0.011,
    }));
  }, [index]);

  useFrame((state) => {
    try {
      const t = state.clock.elapsedTime;

      if (groupRef.current && quality.motion) {
        groupRef.current.position.y = baseY + Math.sin(t * 0.7 + world.position[0]) * 0.09;
      }

      if (rockRef.current && quality.motion) {
        // Putaran sangat pelan: cukup untuk memperlihatkan bahwa pulau
        // memang objek 3D, tanpa membuat pusing.
        rockRef.current.rotation.y += 0.0016;
      }

      if (scaleRef.current) {
        // Pop-in bertahap saat peta pertama dibuka (stagger per pulau).
        if (spawnRef.current === null) spawnRef.current = t + index * 0.09;
        const elapsed = t - spawnRef.current;
        if (elapsed < 0) {
          scaleRef.current.scale.setScalar(0.001);
        } else if (elapsed < 0.6) {
          const p = elapsed / 0.6;
          const eased = 1 - Math.pow(1 - p, 3);
          scaleRef.current.scale.setScalar(Math.max(0.001, eased));
        } else {
          // Patch 51: pembesaran saat terpilih dinaikkan dari 1,12 ke
          // 1,16 agar perbedaannya terbaca jelas tanpa menabrak pulau
          // tetangga.
          const target = active ? 1.16 : hovered ? 1.07 : 1;
          const current = scaleRef.current.scale.x;
          scaleRef.current.scale.setScalar(current + (target - current) * 0.14);
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[Brightoria] Island3D animasi error (diredam):', err);
    }
  });

  return (
    <group ref={groupRef} position={world.position}>
      <group ref={scaleRef}>
        <group
          onClick={(e) => {
            e.stopPropagation();
            onSelect(world);
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            onHover(world.id);
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            onHover(null);
            document.body.style.cursor = 'auto';
          }}
        >
          {/* Seluruh pulau (batu + isinya) berputar sebagai satu kesatuan,
              supaya bangunan ikut menghadap arah yang benar. */}
          <group ref={rockRef}>
            <mesh
              geometry={rockGeometry}
              position={[0, -0.62, 0]}
              scale={1.15}
              castShadow={quality.shadows}
              receiveShadow={quality.shadows}
            >
              <meshStandardMaterial vertexColors roughness={0.86} metalness={0.04} flatShading />
            </mesh>

            {/* Permukaan atas pulau. */}
            <group position={[0, 0.29, 0]} scale={0.92}>
              <IslandProps
                theme={theme}
                color={world.color}
                accent={world.accent}
                seed={index + 1}
                radius={0.95}
              />
            </group>
          </group>

          {(active || hovered) && (
            <group>
              {crystals.map((c, i) => (
                <OrbitingCrystal key={i} color={world.accent} {...c} />
              ))}
            </group>
          )}
        </group>
      </group>

      {/* Penanda terpilih / disorot.
          SENGAJA di luar grup berskala, supaya ukurannya tetap sama
          meski pulau membesar saat terpilih — kalau ikut membesar,
          panah akan melayang makin jauh dari puncak pulau. */}
      <SelectionMarker
        active={active}
        hovered={hovered}
        color={world.color}
        accent={world.accent}
      />

      {/* zIndexRange [30, 0] mempertahankan perbaikan Patch 11: label
          tidak pernah bocor menimpa overlay game. */}
      <Html center position={[0, -1.72, 0]} occlude={false} zIndexRange={[30, 0]}>
        <button className={'world-label' + (active ? ' active' : '')} onClick={() => onSelect(world)}>
          <b>{world.name}</b>
          <span>{world.subtitle}</span>
          <i>{world.mastery}%</i>
        </button>
      </Html>
    </group>
  );
}
