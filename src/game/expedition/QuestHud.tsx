import { useEffect, useState } from 'react';
import { CRYSTALS, type CrystalType } from './questData';
import type { ActiveQuestView } from './questEngine';
import type { DialogueLine, Quest } from './questData';

/**
 * QuestHud.tsx — Lapisan UI untuk quest & dialog (Patch 39).
 *
 * ====================================================================
 * KENAPA DOM, BUKAN <Html> DI DALAM CANVAS
 * ====================================================================
 * Teks dialog dan pelacak quest adalah antarmuka baca, bukan objek
 * dunia. Merendernya sebagai DOM biasa di atas canvas memberi tiga
 * keuntungan nyata:
 *   1. Teks selalu tajam (tidak ikut resolusi render 3D).
 *   2. Ukuran tidak berubah saat kamera bergerak — pelajaran dari
 *      label pulau di Patch 37 yang saling menimpa gara-gara
 *      distanceFactor.
 *   3. Bisa di-scroll & dibaca screen reader.
 *
 * ====================================================================
 * PRINSIP UI ANAK YANG DIPAKAI
 * ====================================================================
 *   - SATU QUEST AKTIF SAJA. Anak usia 6-12 mudah kewalahan oleh daftar
 *     tugas. Mesin quest sengaja hanya mengizinkan satu aktif.
 *   - DIALOG SATU BARIS PER KETUKAN. Bukan paragraf panjang; anak
 *     mengetuk untuk maju, jadi ia mengontrol ritme membaca.
 *   - TIDAK ADA TOMBOL "TOLAK". Menolak quest tidak memberi nilai
 *     pedagogis apa pun, hanya menambah kebingungan.
 *   - TARGET SENTUH BESAR (min 52px) sesuai standar kids-friendly yang
 *     sudah dipakai sejak Patch 32.
 * ====================================================================
 */

export const QUEST_HUD_CSS = `
/* ---------- Pelacak quest (pojok kiri bawah, di atas joystick) ---------- */
.qh-tracker {
  position: absolute; left: 16px; top: 132px; z-index: 6;
  max-width: 270px; background: #12303deb; color: #e9f6ff;
  border: 1px solid #2f6a80; border-radius: 16px; padding: 12px 14px;
  pointer-events: none; box-shadow: 0 8px 22px rgba(0,0,0,0.3);
}
.qh-tracker-kicker {
  font-size: 9px; font-weight: 900; letter-spacing: 0.14em;
  text-transform: uppercase; color: #ffd98a; margin-bottom: 4px;
}
.qh-tracker-title { font-size: 14px; font-weight: 900; line-height: 1.3; margin-bottom: 4px; }
.qh-tracker-obj { font-size: 11px; line-height: 1.5; color: #b8d8e6; }
.qh-track { height: 7px; background: #0b2029; border-radius: 999px; overflow: hidden; margin-top: 8px; }
.qh-fill { display: block; height: 100%; border-radius: 999px; background: linear-gradient(90deg,#17856f,#ffd166); transition: width 0.35s ease; }
.qh-ready { margin-top: 7px; font-size: 11px; font-weight: 900; color: #6fffb0; }

/* ---------- Dompet kristal (pojok kanan atas, bawah tombol tutup) ---------- */
.qh-wallet {
  position: absolute; right: 16px; top: 74px; z-index: 6;
  display: flex; gap: 6px; pointer-events: none;
}
.qh-crystal {
  display: inline-flex; align-items: center; gap: 4px;
  background: #fffdf7ee; border: 2px solid #f0dcb8; border-radius: 999px;
  padding: 5px 10px; font-size: 12px; font-weight: 900; color: #4a3218;
  box-shadow: 0 4px 12px rgba(0,0,0,0.22);
}
.qh-crystal.zero { opacity: 0.4; }

/* ---------- Panel dialog (tengah bawah) ---------- */
.qh-dialog-backdrop {
  position: absolute; inset: 0; z-index: 8;
  background: linear-gradient(to top, rgba(6,20,26,0.82) 0%, rgba(6,20,26,0.25) 45%, transparent 75%);
  display: flex; align-items: flex-end; justify-content: center;
  padding: 20px 16px 26px; cursor: pointer;
}
.qh-dialog {
  width: min(560px, 100%); background: #fffdf7; border-radius: 24px;
  padding: 20px; box-shadow: 0 18px 50px rgba(0,0,0,0.42);
  border-top: 5px solid #1f9b8e; cursor: default;
}
.qh-speaker { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.qh-avatar {
  width: 42px; height: 42px; border-radius: 50%; flex-shrink: 0;
  background: radial-gradient(circle at 36% 30%, #7fe6db, #1f9b8e);
  box-shadow: 0 4px 12px rgba(31,155,142,0.35);
}
.qh-speaker-name { font-size: 13px; font-weight: 900; color: #0f6b62; }
.qh-speaker-role { font-size: 10px; color: #6b8a86; }
.qh-line { font-size: 15px; line-height: 1.7; color: #24333a; min-height: 52px; }
.qh-quest-card {
  margin-top: 12px; background: linear-gradient(160deg,#e9f6f1,#d8efe6);
  border: 1px solid #bfe0d6; border-radius: 16px; padding: 13px 15px;
}
.qh-quest-card b { display: block; font-size: 13px; color: #0f4c3e; margin-bottom: 3px; }
.qh-quest-card span { font-size: 11px; color: #3d6b62; line-height: 1.55; }
.qh-reward { margin-top: 8px; font-size: 11px; font-weight: 800; color: #8a5a1e; }
.qh-actions { display: flex; gap: 9px; margin-top: 14px; }
.qh-btn {
  flex: 1; min-height: 52px; border: 0; border-radius: 16px;
  font-size: 15px; font-weight: 900; cursor: pointer; font-family: inherit;
  display: flex; align-items: center; justify-content: center; gap: 7px;
}
.qh-btn.primary { background: linear-gradient(135deg,#1f9b8e,#0f6b62); color: #fff; box-shadow: 0 8px 20px rgba(15,107,98,0.32); }
.qh-btn.ghost { background: #fff; border: 2px solid #cfe3de; color: #0f6b62; }
.qh-dots { display: flex; gap: 5px; justify-content: center; margin-top: 11px; }
.qh-dot { width: 7px; height: 7px; border-radius: 50%; background: #d3e6e2; }
.qh-dot.on { background: #1f9b8e; }

/* ---------- Toast hadiah kristal ---------- */
.qh-reward-toast {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  z-index: 9; background: #fffdf7; border-radius: 24px; padding: 26px 34px;
  text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.45);
  animation: qh-burst 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  pointer-events: none;
}
.qh-reward-icon { font-size: 60px; line-height: 1; }
.qh-reward-name { font-size: 17px; font-weight: 900; color: #4a3218; margin-top: 8px; }
.qh-reward-sub { font-size: 12px; color: #8a6a3e; margin-top: 3px; }
@keyframes qh-burst {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
  100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}

@media (max-width: 700px) {
  .qh-tracker { max-width: 190px; top: 118px; left: 12px; padding: 10px 12px; }
  .qh-tracker-title { font-size: 12px; }
  .qh-tracker-obj { font-size: 10px; }
  .qh-wallet { right: 12px; top: 68px; gap: 4px; }
  .qh-crystal { padding: 4px 8px; font-size: 11px; }
  .qh-dialog { padding: 16px; border-radius: 20px; }
  .qh-line { font-size: 14px; }
}
`;

// ---------------------------------------------------------------------------
// Dompet kristal
// ---------------------------------------------------------------------------

export function CrystalWallet({ crystals }: { crystals: Record<CrystalType, number> }) {
  const order: CrystalType[] = ['green', 'blue', 'gold', 'purple'];
  return (
    <div className="qh-wallet">
      {order.map((type) => (
        <span key={type} className={'qh-crystal' + (crystals[type] > 0 ? '' : ' zero')}>
          {CRYSTALS[type].icon} {crystals[type]}
        </span>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pelacak quest
// ---------------------------------------------------------------------------

export function QuestTracker({ active }: { active: ActiveQuestView | null }) {
  if (!active) return null;
  const pct = Math.round((active.progress / Math.max(1, active.target)) * 100);

  return (
    <div className="qh-tracker">
      <div className="qh-tracker-kicker">Tugas Aktif</div>
      <div className="qh-tracker-title">{active.quest.title}</div>
      <div className="qh-tracker-obj">{active.quest.objective.label}</div>
      <div className="qh-track">
        <span className="qh-fill" style={{ width: `${pct}%` }} />
      </div>
      {active.ready ? (
        <div className="qh-ready">✓ Selesai! Kembali ke Aira</div>
      ) : (
        <div className="qh-tracker-obj" style={{ marginTop: 5 }}>
          {active.progress} / {active.target}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Panel dialog
// ---------------------------------------------------------------------------

export function DialoguePanel({
  lines,
  quest,
  mode,
  onAccept,
  onClose,
}: {
  lines: DialogueLine[];
  /** Quest yang sedang ditawarkan (mode 'offer'), untuk kartu ringkasan. */
  quest: Quest | null;
  mode: 'offer' | 'complete' | 'idle';
  onAccept: () => void;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const isLast = index >= lines.length - 1;
  const line = lines[index];

  useEffect(() => {
    setIndex(0);
  }, [lines]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!isLast) setIndex((i) => i + 1);
        else if (mode === 'idle') onClose();
        else onAccept();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isLast, mode, onAccept, onClose]);

  if (!line) return null;

  function advance() {
    if (!isLast) setIndex((i) => i + 1);
  }

  return (
    <div className="qh-dialog-backdrop" onClick={advance}>
      <div className="qh-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="qh-speaker">
          <div className="qh-avatar" />
          <div>
            <div className="qh-speaker-name">Aira</div>
            <div className="qh-speaker-role">Pemandu Ilmu Brightoria</div>
          </div>
        </div>

        <div className="qh-line">{line.text}</div>

        {isLast && mode === 'offer' && quest && (
          <div className="qh-quest-card">
            <b>🎯 {quest.title}</b>
            <span>{quest.objective.label}</span>
            <div className="qh-reward">
              Hadiah: {CRYSTALS[quest.reward.crystal].icon} {quest.reward.amount}{' '}
              {CRYSTALS[quest.reward.crystal].label} &bull; +{quest.reward.xp} XP
            </div>
          </div>
        )}

        <div className="qh-dots">
          {lines.map((_, i) => (
            <span key={i} className={'qh-dot' + (i <= index ? ' on' : '')} />
          ))}
        </div>

        <div className="qh-actions">
          {!isLast ? (
            <button className="qh-btn primary" onClick={advance}>
              Lanjut →
            </button>
          ) : mode === 'offer' ? (
            <button className="qh-btn primary" onClick={onAccept}>
              Baik, aku siap! ✓
            </button>
          ) : mode === 'complete' ? (
            <button className="qh-btn primary" onClick={onAccept}>
              Terima hadiah 🎁
            </button>
          ) : (
            <button className="qh-btn ghost" onClick={onClose}>
              Sampai jumpa
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toast hadiah
// ---------------------------------------------------------------------------

export function RewardToast({ crystal, amount }: { crystal: CrystalType; amount: number }) {
  const meta = CRYSTALS[crystal];
  return (
    <div className="qh-reward-toast">
      <div className="qh-reward-icon">{meta.icon}</div>
      <div className="qh-reward-name">
        +{amount} {meta.label}
      </div>
      <div className="qh-reward-sub">{meta.domain}</div>
    </div>
  );
}
