import { useEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { getQuality } from './quality';
import { WORLD } from '../theme/brightBrand';

/**
 * ProceduralEnv.tsx — Pencahayaan berbasis lingkungan (Patch 42).
 *
 * ====================================================================
 * MASALAH YANG DIPECAHKAN — kenapa 3D terasa "kurang nyata"
 * ====================================================================
 * Sampai Patch 41, `scene.environment` KOSONG. Akibatnya setiap
 * MeshStandardMaterial di aplikasi ini TIDAK MEMANTULKAN APA PUN.
 *
 * Itu masalah besar, karena MeshStandardMaterial adalah material
 * berbasis fisika (PBR): ia MENGHARAPKAN ada lingkungan untuk
 * dipantulkan. Tanpa itu:
 *   - `metalness` praktis tidak berfungsi — logam terlihat seperti
 *     plastik gelap, karena logam di dunia nyata warnanya BERASAL dari
 *     pantulan lingkungan, bukan dari warna dasarnya.
 *   - Permukaan halus (roughness rendah) terlihat datar, padahal
 *     seharusnya memantulkan langit.
 *   - Bagian objek yang tidak terkena cahaya langsung jadi gelap mati,
 *     padahal di dunia nyata tetap terang oleh pantulan langit.
 *
 * Inilah satu perubahan dengan dampak terbesar terhadap kesan "nyata",
 * dan biayanya hampir nol karena dihitung SEKALI saat pemuatan.
 *
 * ====================================================================
 * KENAPA PROSEDURAL, BUKAN BERKAS HDR
 * ====================================================================
 * Cara lazimnya memakai berkas .hdr lewat <Environment> dari drei. Itu
 * DILARANG di proyek ini — pada Patch 03, <Environment> mengunduh HDR
 * dari CDN dan membuat seluruh scene macet blank. Kejadian serupa
 * berulang di Patch 12-15 dengan berkas .webp.
 *
 * Di sini langitnya DIGAMBAR SENDIRI ke kanvas, lalu diubah jadi peta
 * lingkungan. Nol permintaan jaringan, nol berkas, tidak mungkin gagal
 * dimuat.
 *
 * ====================================================================
 * SOAL "REALISTIC" — batas yang jujur
 * ====================================================================
 * Gaya visual aplikasi ini blocky/stylized. Mengejar fotorealisme penuh
 * justru akan MERUSAK: karakter kotak di atas lanskap fotoreal terlihat
 * seperti dua game berbeda ditempel jadi satu.
 *
 * Yang dikerjakan di sini adalah realisme PENCAHAYAAN — membuat cahaya
 * dan material berperilaku sesuai fisika, sehingga dunia terasa padat,
 * membumi, dan meyakinkan. Gaya bentuknya tetap blocky.
 * ====================================================================
 */

/**
 * Menggambar langit ke kanvas 2D.
 *
 * Tiga hal yang membuatnya terbaca sebagai langit sungguhan:
 *   1. GRADASI TIGA TITIK — puncak gelap, tengah cerah, cakrawala pucat.
 *      Langit nyata tidak pernah satu warna rata.
 *   2. MATAHARI — gumpalan terang yang menciptakan arah cahaya. Inilah
 *      yang memberi highlight pada permukaan mengkilap.
 *   3. TANAH — separuh bawah berwarna tanah. Ini yang membuat bagian
 *      BAWAH objek menerima pantulan hangat dari tanah, persis seperti
 *      di dunia nyata.
 */
function drawSky(size: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const horizon = size * 0.52;

  // --- Langit: gradasi tiga titik ---
  const sky = ctx.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, WORLD.skyZenith);
  sky.addColorStop(0.55, WORLD.skyMid);
  sky.addColorStop(1, WORLD.skyHorizon);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, size, horizon);

  // --- Tanah: memantul balik ke bagian bawah objek ---
  const ground = ctx.createLinearGradient(0, horizon, 0, size);
  ground.addColorStop(0, WORLD.sand);
  ground.addColorStop(0.35, WORLD.grass);
  ground.addColorStop(1, WORLD.grassDark);
  ctx.fillStyle = ground;
  ctx.fillRect(0, horizon, size, size - horizon);

  // --- Matahari: sumber arah cahaya & highlight ---
  const sunX = size * 0.68;
  const sunY = size * 0.2;
  const sun = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, size * 0.3);
  sun.addColorStop(0, 'rgba(255,255,255,0.95)');
  sun.addColorStop(0.18, 'rgba(255,250,225,0.6)');
  sun.addColorStop(0.5, 'rgba(255,245,210,0.18)');
  sun.addColorStop(1, 'rgba(255,245,210,0)');
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, size, horizon);

  // --- Awan: memecah gradasi agar pantulan tidak terlalu seragam ---
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 7; i++) {
    const cx = (i / 7) * size + size * 0.06;
    const cy = size * (0.12 + (i % 3) * 0.11);
    const rx = size * (0.09 + (i % 4) * 0.035);
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, rx * 0.34, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // --- Kabut tipis di garis cakrawala ---
  const haze = ctx.createLinearGradient(0, horizon - size * 0.09, 0, horizon + size * 0.04);
  haze.addColorStop(0, 'rgba(255,255,255,0)');
  haze.addColorStop(0.6, 'rgba(255,255,255,0.4)');
  haze.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = haze;
  ctx.fillRect(0, horizon - size * 0.09, size, size * 0.13);

  return canvas;
}

/**
 * Memasang peta lingkungan ke scene.
 *
 * ALUR TEKNIS:
 *   kanvas 2D  ->  tekstur equirectangular  ->  PMREM  ->  scene.environment
 *
 * PMREMGenerator adalah bagian penting: ia menghasilkan rangkaian mipmap
 * yang sudah di-prafilter untuk berbagai tingkat kekasaran permukaan.
 * Berkat itu, permukaan kasar memantulkan lingkungan secara BURAM dan
 * permukaan halus memantulkannya TAJAM — persis perilaku fisik bahan
 * di dunia nyata. Tanpa PMREM, semua pantulan akan sama tajamnya dan
 * justru terlihat palsu.
 *
 * Dihitung SEKALI saat pemasangan, lalu dibuang saat komponen dilepas.
 */
export default function ProceduralEnv({
  /** Seberapa kuat lingkungan memengaruhi material. */
  intensity = 0.85,
  /** Pakai juga sebagai latar belakang scene. */
  asBackground = false,
}: {
  intensity?: number;
  asBackground?: boolean;
}) {
  const scene = useThree((s) => s.scene);
  const gl = useThree((s) => s.gl);
  const quality = getQuality();

  // Perangkat lemah memakai resolusi lebih kecil. Karena hasilnya
  // hanya dipakai sebagai pantulan (bukan dilihat langsung), penurunan
  // resolusi hampir tidak terlihat.
  const size = quality.tier === 'low' ? 256 : quality.tier === 'balanced' ? 512 : 768;

  const envTexture = useMemo(() => {
    try {
      const canvas = drawSky(size);
      const source = new THREE.CanvasTexture(canvas);
      source.mapping = THREE.EquirectangularReflectionMapping;
      source.colorSpace = THREE.SRGBColorSpace;
      source.needsUpdate = true;

      const pmrem = new THREE.PMREMGenerator(gl);
      pmrem.compileEquirectangularShader();
      const target = pmrem.fromEquirectangular(source);

      // Sumber sudah tidak diperlukan setelah PMREM selesai.
      source.dispose();
      pmrem.dispose();

      return target.texture;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[Brightoria] ProceduralEnv gagal dibuat (diabaikan):', err);
      return null;
    }
  }, [gl, size]);

  useEffect(() => {
    if (!envTexture) return;

    const prevEnv = scene.environment;
    const prevBg = scene.background;
    const prevIntensity = scene.environmentIntensity;

    scene.environment = envTexture;
    scene.environmentIntensity = intensity;
    if (asBackground) scene.background = envTexture;

    return () => {
      scene.environment = prevEnv;
      scene.environmentIntensity = prevIntensity;
      if (asBackground) scene.background = prevBg;
      envTexture.dispose();
    };
  }, [scene, envTexture, intensity, asBackground]);

  return null;
}
