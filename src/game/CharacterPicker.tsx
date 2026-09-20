import CanvasBoundary from '../components/CanvasBoundary';
import { useRef, useState, type ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import CinematicRig, { ThreePointLights } from '../render/CinematicRig';
import ProceduralEnv from '../render/ProceduralEnv';
import { getQuality } from '../render/quality';
import BlockyCharacter from '../components/world3d/BlockyCharacter';
import { OUTFITS } from '../components/world3d/outfits';
import {
  MAX_NAME_LENGTH,
  SKIN_TONES,
  defaultOutfitFor,
  loadIdentity,
  needsCharacterChoice,
  sanitizeName,
  saveIdentity,
  type Gender,
} from './identity';

/**
 * CharacterPicker.tsx — Layar pilih karakter (v2, Patch 56).
 *
 * ====================================================================
 * PERUBAHAN PATCH 56: INPUT NAMA
 * ====================================================================
 * Anak mengetik nama panggilannya di sini. Nama tersimpan di perangkat
 * dan dipakai menyapa dia di seluruh aplikasi.
 *
 * Tiga keputusan desain yang perlu dicatat:
 *
 *   1. NAMA BOLEH DIKOSONGKAN.
 *      Anak yang belum lancar menulis tidak boleh terhalang masuk ke
 *      permainan. Bila kosong, ia disapa "Penjelajah".
 *
 *   2. KARAKTER TIDAK DITOLAK, TAPI DIBERSIHKAN.
 *      Mengetik karakter aneh tidak memunculkan pesan galat — huruf
 *      yang tidak diizinkan cukup tidak muncul. Anak tidak boleh
 *      merasa dimarahi karena menekan tombol yang salah.
 *
 *   3. NAMA HANYA DI PERANGKAT.
 *      Tidak pernah dikirim ke mana pun. Penting untuk aplikasi anak.
 *
 * ====================================================================
 * KENAPA ADA PRATINJAU 3D SUNGGUHAN
 * ====================================================================
 * Memakai gambar 2D jauh lebih murah. Tapi anak harus melihat PERSIS
 * karakter yang nanti ia mainkan. Pratinjau yang berbeda dari hasil
 * akhir adalah janji yang diingkari — dan anak 6-12 sangat peka
 * terhadap itu.
 *
 * Karakter di sini memakai komponen yang sama persis dengan yang
 * dipakai di Ekspedisi dan Numeria. Tidak ada versi khusus pratinjau.
 *
 * ====================================================================
 * CATATAN KEAMANAN: TANPA MutationObserver
 * ====================================================================
 * Modul ini memasang dirinya sendiri, TAPI SENGAJA tidak memakai
 * MutationObserver.
 *
 * Pada Patch 53 ditemukan bug berat: observer di DailyPractice menulis
 * innerHTML tombolnya sendiri, sehingga memicu dirinya berulang tanpa
 * henti dan membekukan seluruh laman.
 *
 * Layar ini tidak butuh observer — ia muncul sekali lalu selesai.
 * ====================================================================
 */

type ReactRoot = { render: (node: ReactNode) => void; unmount: () => void };

const STYLE_ID = 'brightoria-character-picker-v2';
const OLD_STYLE_ID = 'brightoria-character-picker-v1';

const PICKER_CSS = `
.bcp-overlay {
  position: fixed; inset: 0; z-index: 96;
  background: linear-gradient(160deg, #001445f2, #0b3f8ff2);
  display: grid; place-items: center; padding: 16px; overflow-y: auto;
}
.bcp-shell {
  width: min(520px, 96vw); background: #fffdf9; border-radius: 28px;
  padding: 22px; box-shadow: 0 25px 80px rgba(0,0,0,0.45);
  border-top: 6px solid #28a8e0; display: flex; flex-direction: column; gap: 13px;
}
.bcp-head { text-align: center; }
.bcp-kicker {
  font-size: 10px; font-weight: 900; letter-spacing: 0.12em;
  text-transform: uppercase; color: #28a8e0;
}
.bcp-head h2 { margin: 5px 0 3px; font-size: 21px; color: #002880; }
.bcp-head p { margin: 0; font-size: 12.5px; color: #5a7691; line-height: 1.55; }

/* ---------- Pratinjau 3D ---------- */
.bcp-stage {
  height: 238px; border-radius: 22px; overflow: hidden;
  background: linear-gradient(170deg, #d6eefb, #eef6fb);
  box-shadow: inset 0 2px 14px rgba(0,40,128,0.12);
  position: relative;
}
.bcp-stage-hint {
  position: absolute; bottom: 9px; left: 50%; transform: translateX(-50%);
  font-size: 9.5px; color: #5a7691; background: rgba(255,255,255,0.82);
  padding: 4px 11px; border-radius: 999px; pointer-events: none;
}

/* ---------- Input nama ---------- */
.bcp-label { font-size: 11px; font-weight: 900; color: #5a7691; text-align: center; }
.bcp-name-row { position: relative; }
.bcp-name {
  width: 100%; box-sizing: border-box;
  border: 3px solid #cfe6f5; border-radius: 17px;
  padding: 13px 52px 13px 16px;
  font-size: 16px; font-weight: 800; font-family: inherit;
  color: #002880; background: #f7fbfe; text-align: center;
  min-height: 52px; outline: none;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.bcp-name::placeholder { color: #9bb3c9; font-weight: 700; }
.bcp-name:focus { border-color: #28a8e0; background: #fff; }
.bcp-name-count {
  position: absolute; right: 15px; top: 50%; transform: translateY(-50%);
  font-size: 10px; font-weight: 900; color: #9bb3c9; pointer-events: none;
}

/* ---------- Pilihan ---------- */
.bcp-genders { display: flex; gap: 10px; }
.bcp-gender {
  flex: 1; border: 3px solid #cfe6f5; background: #f7fbfe;
  border-radius: 19px; padding: 12px 10px; cursor: pointer; font-family: inherit;
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  transition: transform 0.14s ease, border-color 0.14s ease, background 0.14s ease;
  -webkit-tap-highlight-color: transparent;
}
.bcp-gender:hover { transform: translateY(-2px); }
.bcp-gender.on {
  border-color: #28a8e0; background: #fff;
  transform: translateY(-3px);
  box-shadow: 0 9px 24px rgba(40,168,224,0.32);
}
.bcp-gender-icon { font-size: 28px; line-height: 1; }
.bcp-gender-name { font-size: 13.5px; font-weight: 900; color: #002880; }
.bcp-gender-sub { font-size: 10px; color: #5a7691; }

.bcp-tones { display: flex; gap: 9px; justify-content: center; }
.bcp-tone {
  width: 42px; height: 42px; border-radius: 50%;
  border: 3px solid rgba(255,255,255,0.9); cursor: pointer;
  box-shadow: 0 4px 12px rgba(0,20,69,0.22);
  transition: transform 0.14s ease, box-shadow 0.14s ease;
  -webkit-tap-highlight-color: transparent;
}
.bcp-tone:hover { transform: scale(1.08); }
.bcp-tone.on {
  transform: scale(1.16);
  box-shadow: 0 0 0 3px #28a8e0, 0 6px 16px rgba(0,20,69,0.3);
}

.bcp-btn {
  border: 0; border-radius: 17px; padding: 14px 20px;
  font-size: 15px; font-weight: 900; cursor: pointer; font-family: inherit;
  width: 100%; min-height: 52px;
  display: flex; align-items: center; justify-content: center; gap: 8px;
}
.bcp-btn.primary {
  background: linear-gradient(135deg,#28a8e0,#002880); color: #fff;
  box-shadow: 0 9px 24px rgba(0,40,128,0.34);
}
.bcp-note {
  font-size: 10px; color: #8a9bb0; text-align: center; line-height: 1.6;
  border-top: 1px dashed #dfe8f0; padding-top: 10px;
}

@media (max-width: 700px) {
  .bcp-shell { padding: 18px; border-radius: 22px; gap: 11px; }
  .bcp-stage { height: 196px; }
  .bcp-tone { width: 38px; height: 38px; }
}
`;

function injectStyles() {
  document.getElementById(OLD_STYLE_ID)?.remove();
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = PICKER_CSS;
  document.head.appendChild(el);
}

// ---------------------------------------------------------------------------
// PRATINJAU
// ---------------------------------------------------------------------------

/**
 * Karakter pratinjau yang berputar pelan.
 *
 * Berputar penuh 360 derajat supaya anak melihat punggungnya juga —
 * juntai hijab dan ransel hanya terlihat dari belakang.
 */
function Preview({ outfit, skin }: { outfit: 'muslim-boy' | 'muslim-girl'; skin: string }) {
  const group = useRef<THREE.Group>(null);
  const quality = getQuality();

  useFrame((state, delta) => {
    try {
      if (!group.current || !quality.motion) return;
      group.current.rotation.y += Math.min(delta, 0.05) * 0.5;
      group.current.position.y = -0.78 + Math.sin(state.clock.elapsedTime * 1.4) * 0.018;
    } catch {
      /* diamkan */
    }
  });

  return (
    <group ref={group} position={[0, -0.78, 0]}>
      {/* Bayangan kontak — membuat karakter terbaca berdiri, bukan melayang */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.48, 22]} />
        <meshBasicMaterial color="#0b3f8f" transparent opacity={0.16} depthWrite={false} />
      </mesh>

      <BlockyCharacter outfit={outfit} skinTone={skin} action="wave" speed={0} />
    </group>
  );
}

function PreviewStage({ outfit, skin }: { outfit: 'muslim-boy' | 'muslim-girl'; skin: string }) {
  const quality = getQuality();

  return (
    <div className="bcp-stage">
      <CanvasBoundary><Canvas
        shadows={false}
        dpr={quality.dpr}
        camera={{ position: [0, 0.32, 2.5], fov: 42, near: 0.1, far: 20 }}
        gl={{ antialias: quality.antialias, powerPreference: 'high-performance' }}
      >
        <CinematicRig exposure={1.06} shadows={false} />
        <ProceduralEnv intensity={0.95} />
        <color attach="background" args={['#dceefa']} />
        <ThreePointLights intensity={1.05} castShadow={false} />
        <Preview outfit={outfit} skin={skin} />
      </Canvas></CanvasBoundary>
      <div className="bcp-stage-hint">Karaktermu akan terlihat seperti ini</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PANEL
// ---------------------------------------------------------------------------

function PickerPanel({ onDone }: { onDone: () => void }) {
  const existing = useRef(loadIdentity()).current;
  const [name, setName] = useState(existing.name);
  const [gender, setGender] = useState<Gender>(existing.gender);
  const [tone, setTone] = useState<number>(existing.skinTone);

  const outfit = defaultOutfitFor(gender);
  const clean = name.trim();

  function confirm() {
    saveIdentity({
      name: clean,
      gender,
      outfit,
      skinTone: tone,
      chosen: true,
    });
    onDone();
  }

  return (
    <div className="bcp-overlay">
      <div className="bcp-shell">
        <div className="bcp-head">
          <div className="bcp-kicker">Selamat datang</div>
          <h2>{clean ? `Halo, ${clean}!` : 'Siapa namamu?'}</h2>
          <p>Karakter ini akan menemanimu menjelajahi seluruh Brightoria.</p>
        </div>

        <PreviewStage outfit={outfit} skin={SKIN_TONES[tone] ?? SKIN_TONES[1]} />

        <div className="bcp-name-row">
          <input
            className="bcp-name"
            value={name}
            onChange={(e) => setName(sanitizeName(e.target.value))}
            placeholder="Tulis namamu di sini"
            maxLength={MAX_NAME_LENGTH}
            autoComplete="off"
            spellCheck={false}
            aria-label="Nama panggilanmu"
          />
          <span className="bcp-name-count">
            {name.length}/{MAX_NAME_LENGTH}
          </span>
        </div>

        <div className="bcp-label">Siapa kamu?</div>
        <div className="bcp-genders">
          {(['boy', 'girl'] as Gender[]).map((g) => {
            const spec = OUTFITS[defaultOutfitFor(g)];
            return (
              <button
                key={g}
                className={'bcp-gender' + (gender === g ? ' on' : '')}
                onClick={() => setGender(g)}
              >
                <span className="bcp-gender-icon">{spec.icon}</span>
                <span className="bcp-gender-name">
                  {g === 'boy' ? 'Laki-laki' : 'Perempuan'}
                </span>
                <span className="bcp-gender-sub">{spec.label}</span>
              </button>
            );
          })}
        </div>

        <div className="bcp-label">Warna kulit</div>
        <div className="bcp-tones">
          {SKIN_TONES.map((c, i) => (
            <button
              key={c}
              className={'bcp-tone' + (tone === i ? ' on' : '')}
              style={{ background: c }}
              onClick={() => setTone(i)}
              aria-label={`Pilih warna kulit ${i + 1}`}
            />
          ))}
        </div>

        <button className="bcp-btn primary" onClick={confirm}>
          Mulai petualangan →
        </button>

        <div className="bcp-note">
          Nama hanya tersimpan di perangkat ini. Semua pilihan bisa diubah
          kapan saja lewat Ruang Orang Tua.
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pemasangan mandiri
// ---------------------------------------------------------------------------

declare global {
  interface Window {
    __brtCharacterPickerInit?: boolean;
  }
}

function mountPicker() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__brtCharacterPickerInit) return;
  window.__brtCharacterPickerInit = true;

  try {
    injectStyles();

    let container: HTMLDivElement | null = null;
    let root: ReactRoot | null = null;

    async function open() {
      if (container) return;
      const { createRoot } = await import('react-dom/client');
      container = document.createElement('div');
      document.body.appendChild(container);
      root = createRoot(container);
      root.render(<PickerPanel onDone={close} />);
    }

    function close() {
      if (root) root.unmount();
      if (container) container.remove();
      root = null;
      container = null;
    }

    // Muncul otomatis bila anak belum pernah memilih. Ditunda satu
    // putaran agar aplikasi sempat menggambar dulu — anak melihat peta
    // sekilas sebelum layar pilih muncul, sehingga ia tahu masuk ke mana.
    if (needsCharacterChoice()) {
      window.setTimeout(() => {
        void open();
      }, 450);
    }

    // Bisa dipanggil ulang dari mana pun, mis. Ruang Orang Tua:
    //   window.dispatchEvent(new Event('brightoria:open-character-picker'))
    window.addEventListener('brightoria:open-character-picker', () => {
      void open();
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[Brightoria] CharacterPicker gagal dipasang (diabaikan):', err);
  }
}

mountPicker();

export { PickerPanel };
