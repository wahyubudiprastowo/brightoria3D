import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { buildRecommendation, getProgressSnapshot, markActiveToday, type ProgressSnapshot } from './progressHub';

/**
 * ParentInsight.tsx — Panel wawasan orang tua berbasis DATA NYATA.
 *
 * ====================================================================
 * PERBAIKAN DI PATCH 36:
 * ====================================================================
 * TS2339 — `root.render` tidak dikenali. Tipe variabel `root` pada
 * Patch 34 ditulis hanya sebagai `{ unmount: () => void }`, padahal
 * React root juga memiliki method `render`. Sekarang memakai tipe
 * `ReactRoot` yang mencakup keduanya.
 *
 * Isi logika & tampilan TIDAK berubah dari Patch 34.
 * ====================================================================
 *
 * MASALAH YANG DIPECAHKAN: parent dashboard di App.tsx menampilkan angka
 * HARDCODED (73% mastery, streak 4) yang tidak pernah berubah apa pun
 * yang anak kerjakan. Panel ini membaca progres NYATA dari 6 dunia lewat
 * progressHub.ts, termasuk jujur saat datanya masih kosong.
 *
 * POLA SELF-MOUNTING: memasang dirinya sendiri lewat satu baris import,
 * tanpa menyentuh struktur komponen React yang sudah ada.
 */

/** Tipe React root — mencakup `render` DAN `unmount`.
 *  (Penyebab error TS2339 di Patch 34: hanya `unmount` yang ditulis.) */
type ReactRoot = {
  render: (node: ReactNode) => void;
  unmount: () => void;
};

const STYLE_ID = 'brightoria-parent-insight-styles-v1';

/** Selector overlay game — jika salah satu ada di DOM, tombol panel
 *  disembunyikan supaya tidak menghalangi gameplay. */
const GAME_OVERLAY_SELECTORS = [
  '.oasis-overlay',
  '.hijaiyah-overlay',
  '.harbor-overlay',
  '.adab-overlay',
  '.numeria-overlay',
  '.digital-overlay',
  '.quiz-overlay',
  '.bdp-overlay',
].join(', ');

const PANEL_CSS = `
.bpi-fab {
  position: fixed; left: 16px; bottom: 84px; z-index: 60;
  display: inline-flex; align-items: center; gap: 8px;
  padding: 10px 16px; border: 2px solid #d9c9a8; border-radius: 999px;
  background: #fffdf7; color: #8a5a2e; font-size: 12px; font-weight: 900;
  box-shadow: 0 8px 20px rgba(80,60,20,0.18); cursor: pointer;
  font-family: inherit;
}
.bpi-fab:active { transform: scale(0.96); }
.bpi-fab[hidden] { display: none !important; }

.bpi-overlay {
  position: fixed; inset: 0; z-index: 90;
  background: linear-gradient(160deg, #1c2b3aee, #2d1b2eee);
  backdrop-filter: blur(10px); display: grid; place-items: center; padding: 16px;
}
.bpi-shell {
  width: min(680px, 96vw); max-height: 92vh; overflow-y: auto;
  background: #fffdf7; border-radius: 28px; padding: 26px;
  box-shadow: 0 25px 80px #0007; border-top: 6px solid #8a5a2e;
  display: flex; flex-direction: column; gap: 16px;
}
.bpi-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
.bpi-head h2 { margin: 4px 0 0; font-size: 21px; color: #3a2a18; }
.bpi-kicker { font-size: 10px; font-weight: 900; letter-spacing: 0.12em; text-transform: uppercase; color: #a5762e; }
.bpi-close {
  border: 0; background: #f1e6d2; border-radius: 50%; width: 40px; height: 40px;
  display: grid; place-items: center; cursor: pointer; color: #8a5a2e; font-size: 18px; flex-shrink: 0;
}

.bpi-hero { display: flex; gap: 12px; flex-wrap: wrap; }
.bpi-stat {
  flex: 1; min-width: 120px; background: linear-gradient(160deg,#fff6e6,#ffeccd);
  border: 1px solid #f0dcb8; border-radius: 18px; padding: 14px;
}
.bpi-stat b { display: block; font-size: 28px; color: #17856f; line-height: 1.1; }
.bpi-stat span { display: block; font-size: 11px; color: #8a6a3e; margin-top: 2px; }

.bpi-empty {
  background: #fff8e6; border: 1px dashed #e0c58a; border-radius: 16px;
  padding: 16px; font-size: 13px; color: #8a6a3e; text-align: center; line-height: 1.6;
}

.bpi-section-title { font-size: 12px; font-weight: 900; color: #6b4a22; margin-top: 4px; }

.bpi-world-row {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; border-radius: 14px; background: #fff8ee; border: 1px solid #f0e2cc;
}
.bpi-world-row.untouched { opacity: 0.62; }
.bpi-world-emoji { font-size: 22px; flex-shrink: 0; }
.bpi-world-main { flex: 1; min-width: 0; }
.bpi-world-name { font-size: 13px; font-weight: 800; color: #3a2a18; }
.bpi-world-meta { font-size: 10px; color: #8a6a3e; margin-top: 1px; }
.bpi-world-track { height: 8px; background: #efe3d0; border-radius: 999px; overflow: hidden; margin-top: 5px; }
.bpi-world-fill { display: block; height: 100%; border-radius: 999px; background: linear-gradient(90deg,#17856f,#f3c861); }
.bpi-world-pct { font-size: 15px; font-weight: 900; color: #17856f; flex-shrink: 0; min-width: 44px; text-align: right; }

.bpi-note {
  background: linear-gradient(160deg,#e9f6f1,#d8efe6); border: 1px solid #bfe0d6;
  border-radius: 16px; padding: 14px 16px; font-size: 13px; color: #14624f; line-height: 1.65;
}
.bpi-note b { display: block; margin-bottom: 4px; color: #0f4c3e; }

.bpi-disclaimer {
  font-size: 10px; color: #9a8468; line-height: 1.6;
  border-top: 1px dashed #e4d7c0; padding-top: 12px;
}

@media (max-width: 700px) {
  .bpi-fab { bottom: 78px; left: 12px; padding: 9px 14px; }
  .bpi-shell { padding: 18px; border-radius: 22px; }
}
`;

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="bpi-stat">
      <b>{value}</b>
      <span>{label}</span>
    </div>
  );
}

function WorldRow({ world }: { world: ProgressSnapshot['worlds'][number] }) {
  const meta = world.untouched
    ? 'Belum dijelajahi'
    : world.starsPossible > 0 && world.starsEarned > 0
      ? `${world.starsEarned} dari ${world.starsPossible} bintang` +
        (world.collectedTotal > 0 ? ` • ${world.collected} materi terkumpul` : '')
      : `${world.itemsCompleted} dari ${world.itemsTotal} selesai`;

  return (
    <div className={'bpi-world-row' + (world.untouched ? ' untouched' : '')}>
      <span className="bpi-world-emoji">{world.emoji}</span>
      <div className="bpi-world-main">
        <div className="bpi-world-name">{world.label}</div>
        <div className="bpi-world-meta">{meta}</div>
        <div className="bpi-world-track">
          <span className="bpi-world-fill" style={{ width: `${world.mastery}%` }} />
        </div>
      </div>
      <div className="bpi-world-pct">{world.mastery}%</div>
    </div>
  );
}

function ParentInsightPanel({ onClose }: { onClose: () => void }) {
  // Snapshot diambil sekali saat panel dibuka — data pasti terbaru
  // karena game menyimpan ke localStorage setiap selesai bermain.
  const snapshot = useMemo(() => getProgressSnapshot(), []);
  const recommendation = useMemo(() => buildRecommendation(snapshot), [snapshot]);

  const allUntouched = snapshot.worlds.every((w) => w.untouched);
  const sorted = useMemo(
    () => [...snapshot.worlds].sort((a, b) => Number(a.untouched) - Number(b.untouched) || b.mastery - a.mastery),
    [snapshot.worlds],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="bpi-overlay" onClick={onClose}>
      <div className="bpi-shell" onClick={(e) => e.stopPropagation()}>
        <div className="bpi-head">
          <div>
            <div className="bpi-kicker">Ruang Orang Tua</div>
            <h2>Perkembangan Belajar</h2>
          </div>
          <button className="bpi-close" onClick={onClose} aria-label="Tutup">
            ×
          </button>
        </div>

        {allUntouched ? (
          <div className="bpi-empty">
            Belum ada aktivitas belajar yang tercatat.
            <br />
            Angka akan muncul di sini segera setelah ananda menyelesaikan level pertamanya.
          </div>
        ) : (
          <div className="bpi-hero">
            <StatCard value={`${snapshot.overallMastery}%`} label="Rata-rata penguasaan" />
            <StatCard value={`${snapshot.totalStars}`} label={`dari ${snapshot.totalStarsPossible} bintang`} />
            <StatCard value={`${snapshot.streakDays}`} label="hari berturut-turut" />
          </div>
        )}

        <div className="bpi-section-title">Perkembangan per pulau</div>
        {sorted.map((w) => (
          <WorldRow key={w.id} world={w} />
        ))}

        <div className="bpi-note">
          <b>Rekomendasi</b>
          {recommendation}
        </div>

        <div className="bpi-disclaimer">
          Data dihitung dari aktivitas yang tersimpan di perangkat ini saja — belum tersinkron antar-perangkat.
          Materi pembelajaran di aplikasi ini masih berstatus draft dan menunggu pengesahan tim akademik
          Bright Academy.
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Self-mounting: memasang tombol pemicu tanpa perlu mengubah App.tsx
// ---------------------------------------------------------------------------

declare global {
  interface Window {
    __brtParentInsightInit?: boolean;
  }
}

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = PANEL_CSS;
  document.head.appendChild(style);
}

function mountParentInsight() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__brtParentInsightInit) return;
  window.__brtParentInsightInit = true;

  try {
    injectStyles();
    markActiveToday();

    const fab = document.createElement('button');
    fab.className = 'bpi-fab';
    fab.type = 'button';
    fab.innerHTML = '<span aria-hidden="true">📊</span><span>Orang Tua</span>';
    document.body.appendChild(fab);

    let container: HTMLDivElement | null = null;
    let root: ReactRoot | null = null;

    async function openPanel() {
      if (container) return;
      const { createRoot } = await import('react-dom/client');
      container = document.createElement('div');
      document.body.appendChild(container);
      root = createRoot(container);
      root.render(<ParentInsightPanel onClose={closePanel} />);
    }

    function closePanel() {
      if (root) root.unmount();
      if (container) container.remove();
      root = null;
      container = null;
    }

    fab.addEventListener('click', () => {
      void openPanel();
    });

    // Sembunyikan tombol saat overlay game apa pun terbuka, supaya tidak
    // pernah menutupi elemen gameplay.
    const observer = new MutationObserver(() => {
      try {
        const gameOpen = document.querySelector(GAME_OVERLAY_SELECTORS) !== null;
        fab.hidden = gameOpen || container !== null;
      } catch {
        /* abaikan */
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[Brightoria] ParentInsight gagal dipasang (diabaikan dengan aman):', err);
  }
}

mountParentInsight();

export { ParentInsightPanel };
