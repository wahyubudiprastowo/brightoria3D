import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getQuality } from '../../render/quality';

/**
 * Ocean3D.tsx — Lautan dengan gelombang GPU sungguhan (Patch 38).
 *
 * ====================================================================
 * SEBELUM vs SESUDAH
 * ====================================================================
 * SEBELUM (worldFx.tsx, Patch 37): "laut" adalah satu CircleGeometry
 * datar dengan vertex color statis, ditambah beberapa plane cincin yang
 * membesar untuk meniru riak. Saat kamera diputar, permukaannya tetap
 * terbaca sebagai kertas datar — ini salah satu alasan terbesar kenapa
 * peta belum terasa "3D sungguhan".
 *
 * SESUDAH (file ini): permukaan air adalah mesh ber-subdivisi yang
 * verteksnya DIGESER DI GPU memakai penjumlahan tiga gelombang sinus
 * berbeda arah/frekuensi (pendekatan Gerstner sederhana). Normal
 * dihitung ulang secara analitik dari turunan gelombang, sehingga
 * pantulan cahaya bergerak mengikuti ombak — bukan sekadar tekstur
 * yang digeser.
 *
 * ====================================================================
 * TEKNIK: onBeforeCompile, BUKAN ShaderMaterial dari nol
 * ====================================================================
 * Kita menyuntik GLSL ke dalam MeshStandardMaterial bawaan Three.js.
 * Keuntungannya besar: kita tetap mendapat SELURUH sistem pencahayaan
 * PBR Three.js (directional light, shadow, tone mapping ACES dari
 * CinematicRig) secara gratis, dan hanya menambahkan perilaku gelombang.
 * Menulis ShaderMaterial dari nol berarti harus menulis ulang seluruh
 * model pencahayaan — persis "cheap hack" yang ingin dihindari.
 *
 * Fresnel: bagian air yang dilihat dari sudut landai memantulkan langit
 * (lebih terang/biru muda), bagian yang dilihat tegak lurus menampakkan
 * kedalaman (biru tua). Inilah yang membuat air terbaca sebagai air.
 * ====================================================================
 */
export default function Ocean3D({
  radius = 6.4,
  level = -3,
  shallow = '#8fd9ef',
  deep = '#1d6f9c',
  foam = '#e8fbff',
  waveHeight = 0.09,
  speed = 1,
}: {
  radius?: number;
  level?: number;
  shallow?: string;
  deep?: string;
  foam?: string;
  waveHeight?: number;
  speed?: number;
}) {
  const quality = getQuality();
  const timeRef = useRef({ value: 0 });

  const geometry = useMemo(() => {
    // Subdivisi disesuaikan tier perangkat: 48 segmen di HP hemat,
    // 96 di desktop. Gelombang dihitung per-vertex, jadi ini langsung
    // menentukan kehalusan ombak.
    const segments = Math.max(32, Math.floor(quality.geometryDetail));
    return new THREE.CircleGeometry(radius, segments);
  }, [radius, quality.geometryDetail]);

  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(shallow),
      roughness: 0.18,
      metalness: 0.1,
      transparent: true,
      opacity: 0.94,
    });

    // Tipe parameter sengaja `any`: nama tipe shader-params berubah antar
    // versi Three.js. Memakai `any` di SATU baris ini membuat patch tetap
    // ter-build di versi mana pun tanpa mengorbankan tipe di tempat lain.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mat.onBeforeCompile = (shader: any) => {
      shader.uniforms.uTime = timeRef.current;
      shader.uniforms.uWaveHeight = { value: waveHeight };
      shader.uniforms.uSpeed = { value: speed };
      shader.uniforms.uDeep = { value: new THREE.Color(deep) };
      shader.uniforms.uShallow = { value: new THREE.Color(shallow) };
      shader.uniforms.uFoam = { value: new THREE.Color(foam) };
      shader.uniforms.uRadius = { value: radius };

      // ---------- VERTEX ----------
      shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          /* glsl */ `
          #include <common>
          uniform float uTime;
          uniform float uWaveHeight;
          uniform float uSpeed;
          uniform float uRadius;
          varying float vWaveTop;
          varying vec3 vWorldPos;

          // Tiga gelombang dengan arah, panjang, dan kecepatan berbeda.
          // Menjumlahkan gelombang berfrekuensi tidak kelipatan membuat
          // pola tidak pernah terlihat berulang — trik standar untuk air.
          float waveSum(vec2 p, float t) {
            float w = 0.0;
            w += sin(dot(p, vec2(1.0, 0.35)) * 1.7 + t * 1.05) * 0.55;
            w += sin(dot(p, vec2(-0.42, 1.0)) * 2.6 - t * 0.83) * 0.3;
            w += sin(dot(p, vec2(0.75, -0.66)) * 4.1 + t * 1.45) * 0.15;
            return w;
          }
        `,
        )
        .replace(
          '#include <begin_vertex>',
          /* glsl */ `
          #include <begin_vertex>
          float t = uTime * uSpeed;
          vec2 flat2 = vec2(position.x, position.y);
          float wave = waveSum(flat2, t);

          // Redam gelombang di tepi lingkaran supaya piringan laut
          // tidak terlihat bergerigi di siluetnya.
          float edgeFade = 1.0 - smoothstep(uRadius * 0.72, uRadius, length(flat2));
          float h = wave * uWaveHeight * edgeFade;
          transformed.z += h;
          vWaveTop = wave;

          // Normal analitik: turunan parsial dari penjumlahan gelombang.
          // Jauh lebih akurat (dan murah) daripada normal map palsu.
          float eps = 0.12;
          float hx = (waveSum(flat2 + vec2(eps, 0.0), t) - wave) * uWaveHeight * edgeFade;
          float hy = (waveSum(flat2 + vec2(0.0, eps), t) - wave) * uWaveHeight * edgeFade;
          objectNormal = normalize(vec3(-hx / eps, -hy / eps, 1.0));
          vNormal = normalize(normalMatrix * objectNormal);

          vWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
        `,
        );

      // ---------- FRAGMENT ----------
      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          /* glsl */ `
          #include <common>
          uniform vec3 uDeep;
          uniform vec3 uShallow;
          uniform vec3 uFoam;
          varying float vWaveTop;
          varying vec3 vWorldPos;
        `,
        )
        .replace(
          '#include <color_fragment>',
          /* glsl */ `
          #include <color_fragment>

          // Fresnel: makin landai sudut pandang, makin memantul langit.
          vec3 viewDir = normalize(cameraPosition - vWorldPos);
          float fresnel = pow(1.0 - clamp(dot(viewDir, normalize(vNormal)), 0.0, 1.0), 2.4);

          vec3 water = mix(uDeep, uShallow, clamp(vWaveTop * 0.5 + 0.5, 0.0, 1.0));
          water = mix(water, uShallow * 1.25, fresnel * 0.85);

          // Buih tipis hanya di puncak ombak tertinggi.
          float crest = smoothstep(0.72, 0.98, vWaveTop);
          water = mix(water, uFoam, crest * 0.5);

          diffuseColor.rgb *= 0.0;
          diffuseColor.rgb += water;
        `,
        );
    };

    return mat;
  }, [shallow, deep, foam, waveHeight, speed, radius]);

  useFrame((_state, delta) => {
    if (!quality.motion) return;
    timeRef.current.value += delta;
  });

  return (
    <mesh
      geometry={geometry}
      material={material}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, level, 0]}
      receiveShadow={quality.shadows}
    />
  );
}
