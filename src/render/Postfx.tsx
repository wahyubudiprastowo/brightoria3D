import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { getQuality } from './quality';

/**
 * Postfx.tsx — Bloom + vignette sinematik, DITULIS SENDIRI (Patch 38).
 *
 * ====================================================================
 * KENAPA TIDAK MEMAKAI EffectComposer BAWAAN three/examples?
 * ====================================================================
 * Dua alasan, keduanya berdasar pengalaman nyata proyek ini:
 *
 *   1. NOL DEPENDENCY & NOL RISIKO BUILD. Mengimpor modul dari
 *      three/examples/jsm menambah permukaan risiko saat versi Three.js
 *      berubah. Proyek ini sudah pernah lumpuh gara-gara satu impor
 *      eksternal (drei <Environment> mengunduh HDR dari CDN, Patch 03).
 *      Seluruh pipeline di bawah hanya memakai kelas inti Three.js yang
 *      sudah pasti ada: WebGLRenderTarget, ShaderMaterial, dan
 *      OrthographicCamera.
 *
 *   2. KONTROL PENUH ATAS INTENSITAS. Pengguna sudah dua kali menolak
 *      efek cahaya yang terlalu dominan (Patch 17 "matahari raksasa",
 *      Patch 37 "kerucut cahaya raksasa"). Bloom bawaan cenderung
 *      agresif. Versi ini memakai threshold tinggi dan intensitas
 *      rendah secara default, jadi yang bersinar HANYA sumber cahaya
 *      sungguhan (kristal, lentera, pantulan air) — bukan seluruh layar.
 *
 * ====================================================================
 * PIPELINE (4 langkah, resolusi setengah untuk kecepatan)
 * ====================================================================
 *   1. Render scene ke render target.
 *   2. Bright-pass: ambil hanya piksel di atas ambang (threshold).
 *   3. Blur Gaussian dua arah (horizontal lalu vertikal).
 *   4. Composite: scene asli + (blur * intensity), lalu vignette lembut.
 *
 * Otomatis TIDAK AKTIF pada perangkat tier 'low' dan saat pengguna
 * menyalakan prefers-reduced-motion (lihat quality.ts).
 * ====================================================================
 */

const FULLSCREEN_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const BRIGHT_FRAG = /* glsl */ `
  uniform sampler2D tDiffuse;
  uniform float uThreshold;
  uniform float uSoftKnee;
  varying vec2 vUv;
  void main() {
    vec4 texel = texture2D(tDiffuse, vUv);
    float luma = dot(texel.rgb, vec3(0.2126, 0.7152, 0.0722));
    // Kurva knee lembut: transisi bertahap di sekitar ambang, bukan
    // potongan keras yang bikin tepi bloom terlihat patah.
    float knee = uThreshold * uSoftKnee + 0.0001;
    float soft = clamp(luma - uThreshold + knee, 0.0, 2.0 * knee);
    soft = soft * soft / (4.0 * knee);
    float contribution = max(soft, luma - uThreshold) / max(luma, 0.0001);
    gl_FragColor = vec4(texel.rgb * contribution, 1.0);
  }
`;

const BLUR_FRAG = /* glsl */ `
  uniform sampler2D tDiffuse;
  uniform vec2 uDirection;
  varying vec2 vUv;
  void main() {
    // Gaussian 9-tap dengan bobot terpisah (separable) — dua lintasan
    // 1D jauh lebih murah daripada satu lintasan 2D.
    vec4 sum = texture2D(tDiffuse, vUv) * 0.227027;
    sum += texture2D(tDiffuse, vUv + uDirection * 1.3846153846) * 0.3162162162;
    sum += texture2D(tDiffuse, vUv - uDirection * 1.3846153846) * 0.3162162162;
    sum += texture2D(tDiffuse, vUv + uDirection * 3.2307692308) * 0.0702702703;
    sum += texture2D(tDiffuse, vUv - uDirection * 3.2307692308) * 0.0702702703;
    gl_FragColor = sum;
  }
`;

const COMPOSITE_FRAG = /* glsl */ `
  uniform sampler2D tScene;
  uniform sampler2D tBloom;
  uniform float uIntensity;
  uniform float uVignette;
  uniform float uPreserveAlpha;
  varying vec2 vUv;
  void main() {
    vec4 sceneTexel = texture2D(tScene, vUv);
    vec3 scene = sceneTexel.rgb;
    vec3 bloom = texture2D(tBloom, vUv).rgb;
    vec3 color = scene + bloom * uIntensity;

    // Vignette halus: menggelapkan sudut layar supaya mata anak
    // tertuju ke tengah (teknik standar sinematografi).
    vec2 centered = vUv - 0.5;
    float dist = length(centered);
    float vig = smoothstep(0.85, 0.35, dist);
    color *= mix(1.0, vig, uVignette);

    gl_FragColor = vec4(color, mix(1.0, sceneTexel.a, uPreserveAlpha));
  }
`;

function makeQuad(): THREE.BufferGeometry {
  // Satu segitiga penuh layar (lebih efisien daripada dua segitiga quad
  // karena tidak ada piksel yang dirender dua kali di diagonal).
  const geo = new THREE.BufferGeometry();
  geo.setAttribute(
    'position',
    new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3),
  );
  geo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
  return geo;
}

export default function Postfx({
  intensity = 0.38,
  threshold = 0.82,
  vignette = 0.35,
  enabled,
  preserveAlpha = false,
}: {
  /** Kekuatan bloom. Sengaja rendah secara default. */
  intensity?: number;
  /** Ambang kecerahan. Tinggi = hanya sumber cahaya yang bersinar. */
  threshold?: number;
  /** 0 = tanpa vignette, 1 = sudut sangat gelap. */
  vignette?: number;
  enabled?: boolean;
  /** Pertahankan transparansi scene agar background HTML tetap terlihat. */
  preserveAlpha?: boolean;
}) {
  const { gl, scene, camera, size } = useThree();
  const quality = getQuality();
  const active = (enabled === undefined ? quality.postfx : enabled) && intensity > 0;

  const geometry = useMemo(() => makeQuad(), []);
  const orthoCamera = useMemo(() => new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), []);

  const targets = useMemo(() => {
    const options: THREE.RenderTargetOptions = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      type: THREE.HalfFloatType,
      depthBuffer: true,
      stencilBuffer: false,
    };
    return {
      scene: new THREE.WebGLRenderTarget(1, 1, options),
      brightA: new THREE.WebGLRenderTarget(1, 1, { ...options, depthBuffer: false }),
      brightB: new THREE.WebGLRenderTarget(1, 1, { ...options, depthBuffer: false }),
    };
  }, []);

  const materials = useMemo(() => {
    const bright = new THREE.ShaderMaterial({
      vertexShader: FULLSCREEN_VERT,
      fragmentShader: BRIGHT_FRAG,
      uniforms: {
        tDiffuse: { value: null },
        uThreshold: { value: threshold },
        uSoftKnee: { value: 0.6 },
      },
      depthTest: false,
      depthWrite: false,
    });
    const blur = new THREE.ShaderMaterial({
      vertexShader: FULLSCREEN_VERT,
      fragmentShader: BLUR_FRAG,
      uniforms: {
        tDiffuse: { value: null },
        uDirection: { value: new THREE.Vector2(0, 0) },
      },
      depthTest: false,
      depthWrite: false,
    });
    const composite = new THREE.ShaderMaterial({
      vertexShader: FULLSCREEN_VERT,
      fragmentShader: COMPOSITE_FRAG,
      uniforms: {
        tScene: { value: null },
        tBloom: { value: null },
        uIntensity: { value: intensity },
        uVignette: { value: vignette },
        uPreserveAlpha: { value: preserveAlpha ? 1 : 0 },
      },
      depthTest: false,
      depthWrite: false,
    });
    return { bright, blur, composite };
    // Uniform di-update terpisah di useEffect supaya material tidak
    // dibuat ulang setiap kali prop berubah.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const quad = useMemo(() => new THREE.Mesh(geometry, materials.bright), [geometry, materials]);

  useEffect(() => {
    materials.bright.uniforms.uThreshold.value = threshold;
    materials.composite.uniforms.uIntensity.value = intensity;
    materials.composite.uniforms.uVignette.value = vignette;
    materials.composite.uniforms.uPreserveAlpha.value = preserveAlpha ? 1 : 0;
  }, [materials, threshold, intensity, vignette, preserveAlpha]);

  useEffect(() => {
    if (!active) return;
    const dpr = Math.min(gl.getPixelRatio(), 2);
    const w = Math.max(2, Math.floor(size.width * dpr));
    const h = Math.max(2, Math.floor(size.height * dpr));
    targets.scene.setSize(w, h);
    // Bloom dirender pada setengah resolusi: praktis tak terlihat
    // bedanya karena hasilnya memang blur, tapi 4x lebih murah.
    targets.brightA.setSize(Math.max(2, w >> 1), Math.max(2, h >> 1));
    targets.brightB.setSize(Math.max(2, w >> 1), Math.max(2, h >> 1));
  }, [active, gl, size, targets]);

  useEffect(() => {
    return () => {
      targets.scene.dispose();
      targets.brightA.dispose();
      targets.brightB.dispose();
      materials.bright.dispose();
      materials.blur.dispose();
      materials.composite.dispose();
      geometry.dispose();
    };
  }, [targets, materials, geometry]);

  const failed = useRef(false);

  // priority 1 mengambil alih render loop dari R3F: scene digambar
  // manual di sini, bukan otomatis oleh fiber.
  useFrame(() => {
    if (!active || failed.current) return;
    try {
      const previousAutoClear = gl.autoClear;
      const previousClearAlpha = gl.getClearAlpha();
      const previousClearColor = new THREE.Color();
      gl.getClearColor(previousClearColor);
      gl.autoClear = true;
      if (preserveAlpha) gl.setClearColor(0x000000, 0);

      // 1) Scene penuh -> render target.
      gl.setRenderTarget(targets.scene);
      gl.clear();
      gl.render(scene, camera);

      // 2) Bright pass.
      quad.material = materials.bright;
      materials.bright.uniforms.tDiffuse.value = targets.scene.texture;
      gl.setRenderTarget(targets.brightA);
      gl.clear();
      gl.render(quad, orthoCamera);

      // 3) Blur horizontal lalu vertikal.
      const bw = targets.brightA.width;
      const bh = targets.brightA.height;
      quad.material = materials.blur;

      materials.blur.uniforms.tDiffuse.value = targets.brightA.texture;
      (materials.blur.uniforms.uDirection.value as THREE.Vector2).set(1 / bw, 0);
      gl.setRenderTarget(targets.brightB);
      gl.clear();
      gl.render(quad, orthoCamera);

      materials.blur.uniforms.tDiffuse.value = targets.brightB.texture;
      (materials.blur.uniforms.uDirection.value as THREE.Vector2).set(0, 1 / bh);
      gl.setRenderTarget(targets.brightA);
      gl.clear();
      gl.render(quad, orthoCamera);

      // 4) Composite ke layar.
      quad.material = materials.composite;
      materials.composite.uniforms.tScene.value = targets.scene.texture;
      materials.composite.uniforms.tBloom.value = targets.brightA.texture;
      gl.setRenderTarget(null);
      gl.clear();
      gl.render(quad, orthoCamera);

      if (preserveAlpha) gl.setClearColor(previousClearColor, previousClearAlpha);
      gl.autoClear = previousAutoClear;
    } catch (err) {
      // Sekali gagal -> matikan permanen dan kembalikan render normal.
      failed.current = true;
      try {
        gl.setRenderTarget(null);
      } catch {
        // no-op
      }
      // eslint-disable-next-line no-console
      console.error('[Brightoria] Postfx dimatikan setelah error (scene tetap jalan):', err);
    }
  }, active ? 1 : 0);

  return null;
}
