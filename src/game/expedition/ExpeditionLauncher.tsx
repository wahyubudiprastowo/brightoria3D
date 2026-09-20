import type { ReactNode } from 'react';
import ExpeditionGame from './ExpeditionGame';
import { loadExpedition, starSpots } from './expeditionData';

/**
 * ExpeditionLauncher.tsx — Pemasang mandiri mode Ekspedisi (Patch 38).
 *
 * ====================================================================
 * POLA SELF-MOUNTING (mengikuti ParentInsight.tsx & DailyPractice.tsx)
 * ====================================================================
 * Modul ini memasang tombolnya sendiri ke DOM lewat SATU baris import
 * di src/main.tsx. App.tsx TIDAK perlu diubah untuk menampilkan tombol
 * maupun menjalankan permainannya.
 *
 * Satu-satunya hal yang butuh bantuan App.tsx adalah MEMBUKA dunia saat
 * anak memasuki gerbang. Itu dilakukan lewat CustomEvent, bukan impor
 * langsung, supaya modul ini tetap nol-ketergantungan:
 *
 *     window.dispatchEvent(
 *       new CustomEvent('brightoria:open-world', { detail: { worldId } })
 *     );
 *
 * Tambahkan listener 5 baris di App.tsx (lihat docs/PATCH-38-APPLY.md
 * langkah 3). Kalau listener itu BELUM dipasang, mode Ekspedisi tetap
 * berjalan normal — gerbang hanya akan menutup overlay tanpa membuka
 * game dunia. Jadi patch ini tidak pernah bisa merusak apa pun.
 *
 * PENEMPATAN TOMBOL: pojok kanan-bawah DI ATAS tombol "Latihan"
 * (Patch 35) supaya tidak bertabrakan, dan otomatis tersembunyi saat
 * overlay game mana pun terbuka.
 * ====================================================================
 */

type ReactRoot = {
  render: (node: ReactNode) => void;
  unmount: () => void;
};

const STYLE_ID = 'brightoria-expedition-fab-v1';

const GAME_OVERLAY_SELECTORS = [
  '.oasis-overlay',
  '.hijaiyah-overlay',
  '.harbor-overlay',
  '.adab-overlay',
  '.numeria-overlay',
  '.digital-overlay',
  '.quiz-overlay',
  '.bpi-overlay',
  '.bdp-overlay',
  '.exp-overlay',
].join(', ');

const FAB_CSS = `
.bexp-fab {
  position: fixed; right: 16px; bottom: 142px; z-index: 60;
  display: inline-flex; align-items: center; gap: 8px;
  padding: 11px 17px; border: 2px solid #8fd0c2; border-radius: 999px;
  background: linear-gradient(160deg,#e6f7f1,#c9ece1); color: #0f5c4c;
  font-size: 12px; font-weight: 900; font-family: inherit;
  box-shadow: 0 8px 20px rgba(20,90,75,0.24); cursor: pointer;
}
.bexp-fab:active { transform: scale(0.96); }
.bexp-fab[hidden] { display: none !important; }
.bexp-badge {
  min-width: 20px; height: 20px; padding: 0 6px; border-radius: 999px;
  background: #17856f; color: #fff; font-size: 11px; font-weight: 900;
  display: inline-flex; align-items: center; justify-content: center;
}
@media (max-width: 700px) { .bexp-fab { bottom: 134px; right: 12px; padding: 10px 14px; } }
`;

function ExpeditionHost({ onClose }: { onClose: () => void }) {
  function handleXp(amount: number) {
    // XP diteruskan ke sistem progres global lewat event, supaya modul
    // ini tidak perlu mengimpor progress.ts (nol risiko build).
    window.dispatchEvent(new CustomEvent('brightoria:xp', { detail: { amount } }));
  }

  function handleEnterWorld(worldId: string) {
    onClose();
    window.dispatchEvent(new CustomEvent('brightoria:open-world', { detail: { worldId } }));
  }

  return <ExpeditionGame onExit={onClose} onXpEarned={handleXp} onEnterWorld={handleEnterWorld} />;
}

declare global {
  interface Window {
    __brtExpeditionInit?: boolean;
  }
}

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = FAB_CSS;
  document.head.appendChild(style);
}

function mountExpedition() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__brtExpeditionInit) return;
  window.__brtExpeditionInit = true;

  try {
    injectStyles();

    const host = document.createElement('div');
    host.id = 'brightoria-expedition-root';
    document.body.appendChild(host);

    const fab = document.createElement('button');
    fab.className = 'bexp-fab';
    const total = starSpots.length;

    function refreshFab() {
      const collected = loadExpedition().stars.length;
      fab.innerHTML = `🧭 Ekspedisi <span class="bexp-badge">${collected}/${total}</span>`;
    }
    refreshFab();
    document.body.appendChild(fab);

    let root: ReactRoot | null = null;

    function close() {
      if (root) {
        root.unmount();
        root = null;
      }
      refreshFab();
      fab.hidden = false;
    }

    fab.addEventListener('click', () => {
      import('react-dom/client')
        .then((mod) => {
          if (root) return;
          root = mod.createRoot(host) as unknown as ReactRoot;
          fab.hidden = true;
          root.render(<ExpeditionHost onClose={close} />);
        })
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.error('[Brightoria] Ekspedisi gagal dibuka:', err);
        });
    });

    // Sembunyikan tombol saat overlay game lain terbuka.
    const observer = new MutationObserver(() => {
      if (root) return;
      fab.hidden = document.querySelector(GAME_OVERLAY_SELECTORS) !== null;
    });
    observer.observe(document.body, { childList: true, subtree: true });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[Brightoria] ExpeditionLauncher gagal dipasang (diabaikan dengan aman):', err);
  }
}

mountExpedition();

export {};
