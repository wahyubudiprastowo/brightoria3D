import { loadIdentity } from '../game/identity';

/**
 * playerBadge.ts — Lencana nama anak di header (Patch 56).
 *
 * ====================================================================
 * KENAPA MODUL TERSENDIRI
 * ====================================================================
 * Nama anak perlu terlihat sepanjang permainan — itulah inti permintaan
 * "nama yang bakal di-save juga selama game".
 *
 * Header dirender oleh App.tsx, dan saya tidak memegang jaminan isi
 * berkas itu di proyek Anda. Menyuntik lencana dari luar jauh lebih
 * aman daripada menebak strukturnya lalu menimpanya.
 *
 * Pola ini sudah terbukti di proyek: brandHeader.ts, uiPolish.ts,
 * kidsUi.ts semuanya bekerja begitu.
 *
 * ====================================================================
 * PELAJARAN PATCH 53 — TANPA MutationObserver
 * ====================================================================
 * Pada Patch 53 ditemukan bug berat: observer di DailyPractice menulis
 * innerHTML tombolnya sendiri di dalam callback-nya sendiri, sehingga
 * memicu dirinya berulang tanpa henti dan MEMBEKUKAN seluruh laman.
 *
 * Modul ini sengaja TIDAK memakai observer sama sekali. Ia memasang
 * lencana sekali, lalu hanya memperbarui isinya saat ada event
 * 'brightoria:identity' — yaitu ketika anak benar-benar mengganti nama.
 *
 * Sebagai lapis kedua, penulisan DOM dijaga pembanding `lastText`:
 * teks yang sama tidak pernah ditulis dua kali.
 * ====================================================================
 */

const STYLE_ID = 'brightoria-player-badge-v1';
const BADGE_ID = 'brt-player-badge';

const BADGE_CSS = `
#${BADGE_ID} {
  display: inline-flex; align-items: center; gap: 6px;
  height: 31px; padding: 0 13px;
  border-radius: 999px;
  background: linear-gradient(160deg, #eaf6fd, #d6eefb);
  border: 2px solid #a8dcf5;
  font-size: 11.5px; font-weight: 900; color: #002880;
  font-family: inherit; white-space: nowrap;
  cursor: pointer; flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.14s ease, box-shadow 0.14s ease;
}
#${BADGE_ID}:hover {
  transform: translateY(-1px);
  box-shadow: 0 5px 14px rgba(0,40,128,0.2);
}
#${BADGE_ID} .brt-badge-icon { font-size: 13px; line-height: 1; }

@media (max-width: 700px) {
  #${BADGE_ID} { height: 28px; padding: 0 10px; font-size: 10.5px; }
  #${BADGE_ID} .brt-badge-name { max-width: 76px; overflow: hidden; text-overflow: ellipsis; }
}
@media (max-width: 380px) {
  #${BADGE_ID} { display: none !important; }
}
`;

declare global {
  interface Window {
    __brtPlayerBadgeInit?: boolean;
  }
}

function injectStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = BADGE_CSS;
  document.head.appendChild(style);
}

function mountBadge(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__brtPlayerBadgeInit) return;
  window.__brtPlayerBadgeInit = true;

  try {
    injectStyles();

    /**
     * Teks terakhir yang ditulis.
     *
     * Penjaga terhadap penulisan DOM berulang — lihat catatan Patch 53
     * di kepala berkas.
     */
    let lastText = '';
    let badge: HTMLButtonElement | null = null;

    function render(): void {
      if (!badge) return;
      const id = loadIdentity();
      const name = id.name.trim();
      const icon = id.gender === 'girl' ? '🧕' : '🧑';
      const text = name.length > 0 ? name : 'Atur nama';

      if (text === lastText) return; // tidak berubah -> jangan sentuh DOM
      lastText = text;

      badge.innerHTML =
        `<span class="brt-badge-icon" aria-hidden="true">${icon}</span>` +
        `<span class="brt-badge-name"></span>`;

      // Nama disisipkan sebagai TEKS, bukan HTML — nama diketik anak,
      // jadi tidak boleh pernah ditafsirkan sebagai markup.
      const slot = badge.querySelector('.brt-badge-name');
      if (slot) slot.textContent = text;

      badge.title =
        name.length > 0 ? `Halo, ${name}! Ketuk untuk mengubah karakter` : 'Ketuk untuk mengatur nama & karakter';
    }

    function place(): boolean {
      if (document.getElementById(BADGE_ID)) return true;

      // Ditaruh sebelum lencana XP supaya urutannya:
      // [logo] ......... [nama] [XP] [mode]
      const xp = document.querySelector('header .xp');
      const host = xp?.parentElement ?? document.querySelector('header');
      if (!host) return false;

      badge = document.createElement('button');
      badge.id = BADGE_ID;
      badge.type = 'button';
      badge.addEventListener('click', () => {
        window.dispatchEvent(new Event('brightoria:open-character-picker'));
      });

      if (xp) host.insertBefore(badge, xp);
      else host.appendChild(badge);

      render();
      return true;
    }

    /**
     * Header dirender React, jadi bisa saja belum ada saat modul ini
     * dijalankan. Dicoba beberapa kali dengan jeda, lalu menyerah.
     *
     * Percobaan berulang terbatas SENGAJA dipilih daripada
     * MutationObserver — lihat catatan Patch 53.
     */
    let tries = 0;
    const timer = window.setInterval(() => {
      tries += 1;
      if (place() || tries > 20) window.clearInterval(timer);
    }, 250);

    // Perbarui saat anak mengganti nama atau karakter.
    window.addEventListener('brightoria:identity', () => {
      render();
    });
  } catch (err) {
    // Kegagalan modul kosmetik tidak boleh menghentikan aplikasi.
    // eslint-disable-next-line no-console
    console.error('[Brightoria] playerBadge gagal dipasang (diabaikan):', err);
  }
}

mountBadge();

export {};
