import React, { Suspense, useEffect, useMemo, useState, type ComponentType } from 'react';

/**
 * WorldPortalHost.tsx — Pembuka game dunia dari dalam Ekspedisi.
 *
 * ====================================================================
 * BERKAS INI SEHARUSNYA IKUT PATCH 41
 * ====================================================================
 * Pengiriman paket Patch 41 gagal berulang kali, sehingga berkas ini
 * tidak pernah sampai. Akibatnya Patch 42 gagal dibangun dengan galat:
 *
 *   TS2307: Cannot find module './WorldPortalHost'
 *
 * Isinya sama persis dengan versi Patch 41 — tidak ada perubahan.
 *
 * ====================================================================
 * MASALAH YANG DIPECAHKAN
 * ====================================================================
 * Patch 38 membuat gerbang Ekspedisi mengirim CustomEvent
 * 'brightoria:open-world', lalu meminta pengguna menambahkan listener di
 * App.tsx. Langkah itu ditandai "opsional" — dan itu keliru. Tanpa
 * listener tersebut, menekan gerbang TIDAK MELAKUKAN APA-APA selain
 * menutup arena.
 *
 * Berkas ini menghapus ketergantungan itu. Game dunia dibuka SEBAGAI
 * OVERLAY DI ATAS ARENA, dimuat langsung di sini. App.tsx tidak perlu
 * diubah sama sekali.
 *
 * ====================================================================
 * KENAPA import.meta.glob, BUKAN DAFTAR IMPORT TETAP
 * ====================================================================
 * Saya tidak memiliki salinan enam berkas game dunia, jadi menuliskan
 * jalur impor satu per satu berisiko salah tebak dan menggagalkan build.
 *
 * `import.meta.glob` (bawaan Vite, bukan dependency baru) memindai pola
 * jalur saat build dan menghasilkan peta loader dinamis. Berkas yang
 * tidak ada cukup TIDAK muncul di peta — tidak ada galat kompilasi.
 *
 * ====================================================================
 * KEUNTUNGAN TAMBAHAN: DETEKSI QUEST JADI AKURAT
 * ====================================================================
 * Patch 39 mendeteksi selesainya quest 'play_world' lewat event
 * 'focus'/'visibilitychange' — cara tidak langsung yang bisa tertunda.
 *
 * Karena game kini ditutup lewat callback di berkas ini, Ekspedisi tahu
 * PERSIS kapan anak selesai bermain dan bisa mengevaluasi ulang quest
 * saat itu juga.
 * ====================================================================
 */

interface WorldGameProps {
  onExit: () => void;
  onXpEarned: (amount: number) => void;
}

type GameModule = { default: ComponentType<WorldGameProps> };

/**
 * Peta loader hasil pindaian Vite. Kunci berupa jalur relatif, contoh:
 *   '../quran/QuranGame.tsx'
 *   '../arabic/ArabicGame.tsx'
 *
 * Catatan: pola ini juga menangkap '../expedition/ExpeditionGame.tsx',
 * jadi folder 'expedition' sengaja tidak pernah dipetakan ke id dunia.
 */
const gameModules = import.meta.glob('../*/*Game.tsx') as Record<string, () => Promise<unknown>>;

/**
 * Peta id dunia -> nama folder di src/game/.
 * Bila ada folder yang ternyata bernama lain, cukup ubah di sini.
 */
const WORLD_FOLDER: Record<string, string> = {
  quran: 'quran',
  adab: 'adab',
  math: 'math',
  arabic: 'arabic',
  english: 'english',
  digital: 'digital',
};

/** Nama folder cadangan bila pemetaan utama tidak ketemu. */
const FALLBACK_FOLDERS: Record<string, string[]> = {
  math: ['numeria', 'math'],
  digital: ['digital', 'security'],
  quran: ['quran', 'hijaiyah'],
  arabic: ['arabic', 'oasis'],
  english: ['english', 'harbor'],
  adab: ['adab', 'character'],
};

function findLoader(worldId: string): (() => Promise<unknown>) | null {
  const candidates = [WORLD_FOLDER[worldId], ...(FALLBACK_FOLDERS[worldId] ?? [])].filter(
    (f): f is string => typeof f === 'string',
  );

  for (const folder of candidates) {
    if (folder === 'expedition') continue;
    const key = Object.keys(gameModules).find((k) => k.startsWith(`../${folder}/`));
    if (key) return gameModules[key];
  }
  return null;
}

// ---------------------------------------------------------------------------
// Error boundary khusus — game gagal tidak boleh menjatuhkan arena
// ---------------------------------------------------------------------------

class GameErrorBoundary extends React.Component<
  { children: React.ReactNode; onClose: () => void; worldId: string },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; onClose: () => void; worldId: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // eslint-disable-next-line no-console
    console.error(`[Brightoria] Game dunia "${this.props.worldId}" gagal render:`, error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="wph-overlay">
          <div className="wph-message">
            <div className="wph-icon">😕</div>
            <h3>Dunia ini belum bisa dibuka</h3>
            <p>
              Terjadi kendala saat memuat permainannya. Petualangan di arena tetap bisa dilanjutkan.
            </p>
            <button className="wph-btn" onClick={this.props.onClose}>
              Kembali ke arena
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ---------------------------------------------------------------------------
// CSS
// ---------------------------------------------------------------------------

export const WORLD_PORTAL_CSS = `
.wph-overlay {
  position: fixed; inset: 0; z-index: 95;
  background: linear-gradient(160deg, #001445f2, #0b3f8ff2);
  display: grid; place-items: center; padding: 20px;
}
.wph-message {
  background: #ffffff; border-radius: 26px; padding: 30px 26px;
  text-align: center; max-width: 380px;
  box-shadow: 0 20px 60px rgba(0,20,69,0.45);
  border-top: 6px solid #28a8e0;
}
.wph-icon { font-size: 52px; line-height: 1; margin-bottom: 10px; }
.wph-message h3 { margin: 0 0 8px; font-size: 18px; color: #002880; }
.wph-message p { margin: 0 0 18px; font-size: 13px; line-height: 1.65; color: #5a7691; }
.wph-btn {
  border: 0; background: linear-gradient(135deg,#28a8e0,#002880); color: #fff;
  padding: 14px 24px; border-radius: 16px; font-weight: 900; font-size: 15px;
  cursor: pointer; font-family: inherit; min-height: 52px; width: 100%;
}
.wph-loading {
  position: fixed; inset: 0; z-index: 95;
  background: linear-gradient(160deg, #001445f2, #0b3f8ff2);
  display: grid; place-items: center;
}
.wph-spinner {
  width: 54px; height: 54px; border-radius: 50%;
  border: 5px solid rgba(168,220,245,0.22);
  border-top-color: #28a8e0;
  animation: wph-spin 0.9s linear infinite;
}
@keyframes wph-spin { to { transform: rotate(360deg); } }
.wph-loading-text {
  position: absolute; bottom: 40%; left: 50%; transform: translateX(-50%);
  color: #d6eefb; font-size: 13px; font-weight: 800; white-space: nowrap;
}
`;

// ---------------------------------------------------------------------------
// Komponen utama
// ---------------------------------------------------------------------------

export default function WorldPortalHost({
  worldId,
  worldName,
  onClose,
  onXpEarned,
}: {
  /** id dunia yang akan dibuka. null = tidak ada yang dibuka. */
  worldId: string | null;
  /** Nama dunia untuk pesan "sedang memuat". */
  worldName: string;
  /** Dipanggil saat game ditutup — Ekspedisi memakai ini untuk
   *  mengevaluasi ulang progres quest secara langsung. */
  onClose: () => void;
  onXpEarned: (amount: number) => void;
}) {
  const [notFound, setNotFound] = useState(false);

  const LazyGame = useMemo(() => {
    if (!worldId) return null;
    const loader = findLoader(worldId);
    if (!loader) return null;
    return React.lazy(async () => {
      const mod = (await loader()) as GameModule;
      if (!mod || typeof mod.default !== 'function') {
        throw new Error(`Modul game "${worldId}" tidak memiliki default export komponen`);
      }
      return mod;
    });
  }, [worldId]);

  useEffect(() => {
    if (!worldId) {
      setNotFound(false);
      return;
    }
    setNotFound(findLoader(worldId) === null);
  }, [worldId]);

  if (!worldId) return null;

  if (notFound || !LazyGame) {
    return (
      <div className="wph-overlay">
        <div className="wph-message">
          <div className="wph-icon">🗺️</div>
          <h3>Dunia ini belum tersedia</h3>
          <p>
            Berkas permainan untuk dunia ini tidak ditemukan di proyek. Petualangan di arena tetap
            bisa dilanjutkan.
          </p>
          <button className="wph-btn" onClick={onClose}>
            Kembali ke arena
          </button>
        </div>
      </div>
    );
  }

  return (
    <GameErrorBoundary worldId={worldId} onClose={onClose}>
      <Suspense
        fallback={
          <div className="wph-loading">
            <div className="wph-spinner" />
            <div className="wph-loading-text">Membuka {worldName}...</div>
          </div>
        }
      >
        <LazyGame onExit={onClose} onXpEarned={onXpEarned} />
      </Suspense>
    </GameErrorBoundary>
  );
}
