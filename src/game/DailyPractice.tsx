import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  buildSession,
  getReviewSummary,
  markSessionComplete,
  recordAnswer,
  MAX_BOX,
  type PracticeQuestion,
  type PracticeSession,
} from './practiceEngine';
import { WORLD_LABELS } from './reviewDeck';
import SkyRunGame from './skyrun/SkyRunGame';
import FroggyGame from './froggy/FroggyGame';

/**
 * DailyPractice.tsx — Ruang Latihan (Patch 50).
 *
 * ====================================================================
 * PERUBAHAN PATCH 50: TIGA MODE DALAM SATU PINTU
 * ====================================================================
 * Ditambahkan mode ketiga — "Lompat Katak", kuis 3D bergiliran tempat
 * anak memilih daun teratai berisi jawaban yang benar.
 *
 * Ketiganya SENGAJA berbagi satu pintu masuk, bukan menjadi tombol
 * mengambang sendiri-sendiri. Dua alasannya:
 *
 *   1. Patch 46 sudah merapikan empat tombol mengambang yang
 *      bertumpuk. Menambah tombol kelima dan keenam akan membatalkan
 *      kerja itu.
 *
 *   2. Sumber materinya SAMA PERSIS — kata-kata yang sudah dikuasai
 *      anak, plus soal operasi hitung yang dihasilkan prosedural. Secara
 *      arsitektur ketiganya memang bersaudara.
 *
 * ====================================================================
 * KENAPA TIGA MODE, BUKAN SATU YANG SERBA BISA
 * ====================================================================
 *   LATIHAN TENANG   : penjadwalan Leitner, tanpa tekanan waktu,
 *                      MENGUBAH kapan kata ditanyakan lagi
 *
 *   PENERBANGAN ILMU : arkade bergerak terus, ada tekanan waktu,
 *                      menguji KELANCARAN dan refleks
 *
 *   LOMPAT KATAK     : bergiliran, TANPA tekanan waktu, menguji
 *                      KETEPATAN dan pertimbangan
 *
 * Perbedaan antara dua mode arkade itu penting secara pedagogi. Anak
 * yang MEMBEKU saat diburu waktu tetap bisa berhasil di Lompat Katak —
 * ia boleh memandangi soalnya selama yang ia mau. Ini bukan sekadar
 * variasi tampilan, melainkan jalur berbeda untuk tipe anak berbeda.
 *
 * Keduanya juga memberi rasa kemajuan yang berbeda: Penerbangan lewat
 * angka skor, Lompat Katak lewat jejak daun yang memanjang di belakang
 * — bukti visual yang bisa dilihat sendiri oleh anak.
 * ====================================================================
 */

/** Tipe React root — mencakup `render` DAN `unmount`. */
type ReactRoot = {
  render: (node: ReactNode) => void;
  unmount: () => void;
};

const STYLE_ID = 'brightoria-daily-practice-styles-v3';
const OLD_STYLE_IDS = [
  'brightoria-daily-practice-styles-v1',
  'brightoria-daily-practice-styles-v2',
];

const GAME_OVERLAY_SELECTORS = [
  '.oasis-overlay',
  '.hijaiyah-overlay',
  '.harbor-overlay',
  '.adab-overlay',
  '.numeria-overlay',
  '.digital-overlay',
  '.quiz-overlay',
  '.bpi-overlay',
  '.exp-overlay',
  '.skr-overlay',
  '.frg-overlay',
].join(', ');

const PANEL_CSS = `
.bdp-fab {
  position: fixed; right: 16px; bottom: 84px; z-index: 60;
  display: inline-flex; align-items: center; gap: 8px;
  padding: 11px 17px; border: 2px solid #f0c987; border-radius: 999px;
  background: linear-gradient(160deg,#fff6e6,#ffe8c2); color: #8a5a1e;
  font-size: 12px; font-weight: 900; font-family: inherit;
  box-shadow: 0 8px 20px rgba(140,90,20,0.22); cursor: pointer;
}
.bdp-fab:active { transform: scale(0.96); }
.bdp-fab[hidden] { display: none !important; }
.bdp-badge {
  min-width: 20px; height: 20px; padding: 0 6px; border-radius: 999px;
  background: #d9603f; color: #fff; font-size: 11px; font-weight: 900;
  display: inline-flex; align-items: center; justify-content: center;
}

.bdp-overlay {
  position: fixed; inset: 0; z-index: 88;
  background: linear-gradient(160deg,#1e2a3aee,#33241aee);
  backdrop-filter: blur(10px); display: grid; place-items: center; padding: 16px;
}
.bdp-shell {
  width: min(560px, 96vw); max-height: 92vh; overflow-y: auto;
  background: #fffdf7; border-radius: 28px; padding: 24px;
  box-shadow: 0 25px 80px #0007; border-top: 6px solid #e0a63e;
  display: flex; flex-direction: column; gap: 16px;
}
.bdp-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
.bdp-head h2 { margin: 4px 0 0; font-size: 21px; color: #4a3218; }
.bdp-kicker { font-size: 10px; font-weight: 900; letter-spacing: 0.12em; text-transform: uppercase; color: #b5822e; }
.bdp-close {
  border: 0; background: #f5e9d4; border-radius: 50%; width: 40px; height: 40px;
  display: grid; place-items: center; cursor: pointer; color: #8a5a1e; font-size: 18px; flex-shrink: 0;
}

/* ---------- Pemilih mode ---------- */
.bdp-modes { display: flex; flex-direction: column; gap: 10px; }
.bdp-mode {
  display: flex; align-items: center; gap: 13px; text-align: left;
  border: 2.5px solid #eddcc0; background: #fff; border-radius: 20px;
  padding: 14px 15px; cursor: pointer; font-family: inherit;
  transition: transform 0.12s ease, border-color 0.15s ease;
  width: 100%;
}
.bdp-mode:hover { transform: translateY(-2px); border-color: #d9b475; }
.bdp-mode.sky { border-color: #b8ddf0; background: linear-gradient(160deg,#f5fbff,#e6f4fc); }
.bdp-mode.sky:hover { border-color: #67c4ec; }
.bdp-mode.frog { border-color: #b8ecd6; background: linear-gradient(160deg,#f5fffa,#e4f8ee); }
.bdp-mode.frog:hover { border-color: #5fd0a0; }
.bdp-mode-icon { font-size: 32px; line-height: 1; flex-shrink: 0; }
.bdp-mode-body { flex: 1; min-width: 0; }
.bdp-mode-title { font-size: 15px; font-weight: 900; color: #3a2a18; }
.bdp-mode.sky .bdp-mode-title { color: #002880; }
.bdp-mode.frog .bdp-mode-title { color: #0f5c4c; }
.bdp-mode-desc { font-size: 11.5px; color: #8a6a3e; line-height: 1.5; margin-top: 2px; }
.bdp-mode.sky .bdp-mode-desc { color: #4a7590; }
.bdp-mode.frog .bdp-mode-desc { color: #4a7f6e; }
.bdp-mode-tag {
  display: inline-block; margin-top: 5px; font-size: 9.5px; font-weight: 900;
  padding: 3px 9px; border-radius: 999px; background: #f5e9d4; color: #8a5a1e;
}
.bdp-mode.sky .bdp-mode-tag { background: #d6eefb; color: #1a5578; }
.bdp-mode.frog .bdp-mode-tag { background: #d6f5e9; color: #14624f; }
.bdp-mode-arrow { font-size: 20px; color: #c9a86e; flex-shrink: 0; }
.bdp-mode.sky .bdp-mode-arrow { color: #67c4ec; }
.bdp-mode.frog .bdp-mode-arrow { color: #5fd0a0; }

.bdp-empty {
  background: #fff8e6; border: 1px dashed #e0c58a; border-radius: 18px;
  padding: 22px 18px; font-size: 13px; color: #8a6a3e; text-align: center; line-height: 1.7;
}
.bdp-empty-emoji { font-size: 40px; display: block; margin-bottom: 8px; }

.bdp-progress-row { display: flex; align-items: center; gap: 10px; font-size: 11px; color: #8a6a3e; }
.bdp-progress-track { flex: 1; height: 10px; background: #f0e4cf; border-radius: 999px; overflow: hidden; }
.bdp-progress-fill { display: block; height: 100%; border-radius: 999px; background: linear-gradient(90deg,#17856f,#f3c861); transition: width 0.3s ease; }

.bdp-card {
  background: linear-gradient(160deg,#fff8ec,#ffeed6); border: 2px solid #f0dcb8;
  border-radius: 22px; padding: 24px 18px; text-align: center;
}
.bdp-origin { display: inline-flex; align-items: center; gap: 5px; font-size: 10px; font-weight: 800; padding: 4px 10px; border-radius: 999px; background: #fff; color: #7a5a2e; margin-bottom: 10px; }
.bdp-prompt-emoji { font-size: 52px; line-height: 1; margin-bottom: 8px; }
.bdp-prompt-main { font-size: 30px; font-weight: 900; color: #3a2a18; line-height: 1.4; }
.bdp-prompt-main.arabic { font-family: 'Noto Naskh Arabic','Amiri',serif; direction: rtl; font-size: 34px; }
.bdp-prompt-sub { font-size: 12px; color: #a5853e; font-style: italic; margin-top: 5px; }
.bdp-ask { font-size: 12px; color: #8a6a3e; margin-top: 10px; }

.bdp-strength { display: flex; align-items: center; justify-content: center; gap: 4px; margin-top: 10px; }
.bdp-dot { width: 8px; height: 8px; border-radius: 50%; background: #e6d5b8; }
.bdp-dot.on { background: #17856f; }
.bdp-strength-label { font-size: 10px; color: #a5853e; margin-left: 4px; }

.bdp-options { display: grid; grid-template-columns: 1fr; gap: 10px; }
.bdp-option {
  border: 3px solid #eddcc0; background: #fff; border-radius: 18px; padding: 15px 16px;
  font-size: 16px; font-weight: 700; color: #3a2a18; cursor: pointer; min-height: 58px;
  display: flex; align-items: center; justify-content: center; text-align: center;
  font-family: inherit; transition: transform 0.1s ease, border-color 0.15s ease;
}
.bdp-option.arabic { font-family: 'Noto Naskh Arabic','Amiri',serif; direction: rtl; font-size: 21px; }
.bdp-option:not(:disabled):hover { transform: translateY(-2px); border-color: #d9b475; }
.bdp-option.correct { background: #dff3ea; border-color: #17856f; color: #14624f; }
.bdp-option.wrong { background: #fbe6e2; border-color: #c0492f; color: #8a331f; }

.bdp-feedback { border-radius: 16px; padding: 13px 16px; font-size: 13px; line-height: 1.6; }
.bdp-feedback.good { background: #dff3ea; color: #14624f; }
.bdp-feedback.retry { background: #fff3d6; color: #8a5a1e; }
.bdp-feedback b { display: block; margin-bottom: 3px; }

.bdp-primary {
  border: 0; background: linear-gradient(135deg,#e0a63e,#b5741e); color: #fff;
  padding: 14px 18px; border-radius: 18px; font-weight: 900; font-size: 15px;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  width: 100%; min-height: 52px; cursor: pointer; font-family: inherit;
  box-shadow: 0 9px 22px rgba(180,120,30,0.3);
}
.bdp-ghost {
  border: 2px solid #eddcc0; background: #fff; color: #8a5a1e;
  padding: 12px 18px; border-radius: 16px; font-weight: 800; font-size: 13px;
  cursor: pointer; font-family: inherit; min-height: 46px; width: 100%;
}

.bdp-result { display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center; }
.bdp-result-emoji { font-size: 60px; }
.bdp-result-score { font-size: 32px; font-weight: 900; color: #17856f; }
.bdp-result-note { font-size: 13px; color: #8a6a3e; line-height: 1.6; max-width: 380px; }
.bdp-boxes { display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; margin-top: 4px; }
.bdp-box-chip { font-size: 10px; padding: 5px 10px; border-radius: 999px; background: #f5e9d4; color: #7a5a2e; font-weight: 800; }

.bdp-disclaimer { font-size: 10px; color: #9a8468; line-height: 1.6; border-top: 1px dashed #e4d7c0; padding-top: 11px; }

@media (max-width: 700px) {
  .bdp-fab { bottom: 78px; right: 12px; padding: 10px 14px; }
  .bdp-shell { padding: 18px; border-radius: 22px; }
  .bdp-prompt-main { font-size: 26px; }
  .bdp-option { min-height: 62px; }
  .bdp-mode { padding: 12px 13px; gap: 10px; }
  .bdp-mode-icon { font-size: 27px; }
  .bdp-mode-title { font-size: 14px; }
  .bdp-mode-desc { font-size: 11px; }
}
`;

function StrengthDots({ box }: { box: number }) {
  return (
    <div className="bdp-strength">
      {Array.from({ length: MAX_BOX }).map((_, i) => (
        <span key={i} className={'bdp-dot' + (i < box ? ' on' : '')} />
      ))}
      <span className="bdp-strength-label">kekuatan ingatan</span>
    </div>
  );
}

function QuestionView({
  question,
  picked,
  revealed,
  onPick,
}: {
  question: PracticeQuestion;
  picked: number | null;
  revealed: boolean;
  onPick: (index: number) => void;
}) {
  const { entry, direction } = question;
  const world = WORLD_LABELS[entry.world];
  const promptIsArabic = direction === 'toMeaning' && entry.world !== 'english';
  const optionsAreArabic = direction === 'toWord' && entry.world !== 'english';

  return (
    <>
      <div className="bdp-card">
        <span className="bdp-origin" style={{ color: world.accent }}>
          {world.emoji} {world.label}
        </span>

        {direction === 'toMeaning' ? (
          <>
            <div className="bdp-prompt-emoji">{entry.emoji}</div>
            <div className={'bdp-prompt-main' + (promptIsArabic ? ' arabic' : '')}>
              {entry.display}
            </div>
            <div className="bdp-prompt-sub">{entry.translit}</div>
            <div className="bdp-ask">Apa artinya?</div>
          </>
        ) : (
          <>
            <div className="bdp-prompt-emoji">{entry.emoji}</div>
            <div className="bdp-prompt-main">{entry.meaning}</div>
            <div className="bdp-ask">Mana kata yang tepat?</div>
          </>
        )}

        <StrengthDots box={question.box} />
      </div>

      <div className="bdp-options">
        {question.options.map((opt, i) => {
          let cls = 'bdp-option' + (optionsAreArabic ? ' arabic' : '');
          if (revealed) {
            if (i === question.correctIndex) cls += ' correct';
            else if (i === picked) cls += ' wrong';
          }
          return (
            <button key={i} className={cls} onClick={() => onPick(i)} disabled={revealed}>
              {opt}
            </button>
          );
        })}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// PEMILIH MODE
// ---------------------------------------------------------------------------

function ModeChooser({
  dueToday,
  poolSize,
  onPickPractice,
  onPickSky,
  onPickFroggy,
  onClose,
}: {
  dueToday: number;
  poolSize: number;
  onPickPractice: () => void;
  onPickSky: () => void;
  onPickFroggy: () => void;
  onClose: () => void;
}) {
  return (
    <div className="bdp-overlay" onClick={onClose}>
      <div className="bdp-shell" onClick={(e) => e.stopPropagation()}>
        <div className="bdp-head">
          <div>
            <div className="bdp-kicker">Ruang Latihan</div>
            <h2>Mau latihan dengan cara apa?</h2>
          </div>
          <button className="bdp-close" onClick={onClose} aria-label="Tutup">
            ×
          </button>
        </div>

        {poolSize === 0 ? (
          <div className="bdp-empty">
            <span className="bdp-empty-emoji">🌱</span>
            Ruang Latihan mengulang kata-kata yang sudah pernah kamu kuasai.
            <br />
            Main dulu di Taman Al-Qur&apos;an, Oasis Bahasa Arab, atau English Harbor — nanti
            kata-katanya muncul di sini!
            <br />
            <br />
            Mode <b>Angka</b> di permainan 3D sudah bisa dimainkan sekarang.
          </div>
        ) : null}

        <div className="bdp-modes">
          {poolSize > 0 && (
            <button className="bdp-mode" onClick={onPickPractice}>
              <span className="bdp-mode-icon">🔁</span>
              <span className="bdp-mode-body">
                <span className="bdp-mode-title">Latihan Tenang</span>
                <span className="bdp-mode-desc">
                  Tanpa buru-buru. Kata yang belum kuat akan muncul lagi besok.
                </span>
                {dueToday > 0 && <span className="bdp-mode-tag">{dueToday} kata siap diulang</span>}
              </span>
              <span className="bdp-mode-arrow">›</span>
            </button>
          )}

          <button className="bdp-mode frog" onClick={onPickFroggy}>
            <span className="bdp-mode-icon">🐸</span>
            <span className="bdp-mode-body">
              <span className="bdp-mode-title">Lompat Katak</span>
              <span className="bdp-mode-desc">
                Pilih daun teratai berisi jawaban benar. Tidak ada batas waktu!
              </span>
              <span className="bdp-mode-tag">Santai &amp; 3D</span>
            </span>
            <span className="bdp-mode-arrow">›</span>
          </button>

          <button className="bdp-mode sky" onClick={onPickSky}>
            <span className="bdp-mode-icon">✈️</span>
            <span className="bdp-mode-body">
              <span className="bdp-mode-title">Penerbangan Ilmu</span>
              <span className="bdp-mode-desc">
                Terbangkan pesawat menembus gerbang jawaban yang benar!
              </span>
              <span className="bdp-mode-tag">Cepat &amp; 3D</span>
            </span>
            <span className="bdp-mode-arrow">›</span>
          </button>
        </div>

        {poolSize === 0 && (
          <button className="bdp-primary" onClick={onClose}>
            Mengerti
          </button>
        )}

        {poolSize > 0 && (
          <div className="bdp-disclaimer">
            Ketiganya memakai {poolSize} kata yang sudah kamu kuasai, ditambah soal operasi hitung yang
            dihasilkan otomatis. Latihan Tenang mengatur jadwal pengulangan; dua mode 3D murni
            latihan tambahan.
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PANEL LATIHAN TENANG
// ---------------------------------------------------------------------------

function PracticePanel({ onClose, onBack }: { onClose: () => void; onBack: () => void }) {
  const [session] = useState<PracticeSession>(() => buildSession());
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const summary = useMemo(() => (finished ? getReviewSummary() : null), [finished]);
  const current = session.questions[index];
  const total = session.questions.length;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function pick(optionIndex: number) {
    if (revealed || !current) return;
    const isCorrect = optionIndex === current.correctIndex;
    setPicked(optionIndex);
    setRevealed(true);
    if (isCorrect) setCorrectCount((c) => c + 1);
    recordAnswer(current.entry.id, isCorrect);
  }

  function next() {
    if (index + 1 < total) {
      setIndex(index + 1);
      setPicked(null);
      setRevealed(false);
    } else {
      markSessionComplete();
      setFinished(true);
    }
  }

  if (total === 0) {
    return (
      <div className="bdp-overlay" onClick={onClose}>
        <div className="bdp-shell" onClick={(e) => e.stopPropagation()}>
          <div className="bdp-head">
            <div>
              <div className="bdp-kicker">Latihan Tenang</div>
              <h2>Belum ada yang bisa dilatih</h2>
            </div>
            <button className="bdp-close" onClick={onClose} aria-label="Tutup">
              ×
            </button>
          </div>
          <div className="bdp-empty">
            <span className="bdp-empty-emoji">🌱</span>
            Main dulu di salah satu dunia — nanti kata-katanya muncul di sini untuk diulang!
          </div>
          <button className="bdp-primary" onClick={onBack}>
            Kembali
          </button>
        </div>
      </div>
    );
  }

  if (finished && summary) {
    const perfect = correctCount === total;
    return (
      <div className="bdp-overlay" onClick={onClose}>
        <div className="bdp-shell" onClick={(e) => e.stopPropagation()}>
          <div className="bdp-head">
            <div>
              <div className="bdp-kicker">Latihan Tenang</div>
              <h2>Sesi selesai</h2>
            </div>
            <button className="bdp-close" onClick={onClose} aria-label="Tutup">
              ×
            </button>
          </div>

          <div className="bdp-result">
            <div className="bdp-result-emoji">{perfect ? '🎉' : '💪'}</div>
            <div className="bdp-result-score">
              {correctCount} / {total}
            </div>
            <p className="bdp-result-note">
              {perfect
                ? 'Sempurna! Semua kata masih kamu ingat dengan baik.'
                : 'Kerja bagus! Kata yang belum tepat akan muncul lagi besok supaya makin kuat diingat.'}
            </p>
            <div className="bdp-boxes">
              <span className="bdp-box-chip">{summary.poolSize} kata dikuasai</span>
              <span className="bdp-box-chip">{summary.strongCount} sudah kuat</span>
              <span className="bdp-box-chip">{summary.sessionsCompleted} sesi selesai</span>
            </div>
          </div>

          <button className="bdp-primary" onClick={onClose}>
            Selesai
          </button>
          <button className="bdp-ghost" onClick={onBack}>
            Coba mode lain
          </button>

          <div className="bdp-disclaimer">
            Materi diulang dengan jeda bertahap (1, 2, 4, 7, lalu 14 hari). Kata yang dijawab benar
            akan makin jarang ditanyakan, kata yang belum tepat akan muncul lagi besok.
          </div>
        </div>
      </div>
    );
  }

  const isCorrect = picked !== null && picked === current.correctIndex;

  return (
    <div className="bdp-overlay" onClick={onClose}>
      <div className="bdp-shell" onClick={(e) => e.stopPropagation()}>
        <div className="bdp-head">
          <div>
            <div className="bdp-kicker">Latihan Tenang</div>
            <h2>Ulangi yang sudah dipelajari</h2>
          </div>
          <button className="bdp-close" onClick={onClose} aria-label="Tutup">
            ×
          </button>
        </div>

        <div className="bdp-progress-row">
          <span>
            {index + 1} / {total}
          </span>
          <div className="bdp-progress-track">
            <span
              className="bdp-progress-fill"
              style={{ width: `${((index + (revealed ? 1 : 0)) / total) * 100}%` }}
            />
          </div>
          <span>{correctCount} benar</span>
        </div>

        <QuestionView question={current} picked={picked} revealed={revealed} onPick={pick} />

        {revealed && (
          <div className={'bdp-feedback ' + (isCorrect ? 'good' : 'retry')}>
            {isCorrect ? (
              <>
                <b>Tepat sekali!</b>
                {current.entry.display} ({current.entry.translit}) artinya &quot;
                {current.entry.meaning}&quot;.
              </>
            ) : (
              <>
                <b>Belum tepat — tidak apa-apa!</b>
                {current.entry.display} ({current.entry.translit}) artinya &quot;
                {current.entry.meaning}&quot;. Kata ini akan muncul lagi besok ya.
              </>
            )}
          </div>
        )}

        {revealed && (
          <button className="bdp-primary" onClick={next}>
            {index + 1 < total ? 'Lanjut' : 'Lihat hasil'}
          </button>
        )}

        {!revealed && (
          <button className="bdp-ghost" onClick={onClose}>
            Nanti saja
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PEMBUNGKUS: memilih antar-mode
// ---------------------------------------------------------------------------

type Mode = 'choose' | 'practice' | 'skyrun' | 'froggy';

function PracticeHost({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<Mode>('choose');
  const summary = useMemo(() => getReviewSummary(), []);

  function handleXp(amount: number) {
    // XP diteruskan lewat event agar modul ini tidak perlu mengimpor
    // progress.ts — nol risiko terhadap build.
    window.dispatchEvent(new CustomEvent('brightoria:xp', { detail: { amount } }));
  }

  if (mode === 'skyrun') {
    return <SkyRunGame onExit={() => setMode('choose')} onXpEarned={handleXp} />;
  }

  if (mode === 'froggy') {
    return <FroggyGame onExit={() => setMode('choose')} onXpEarned={handleXp} />;
  }

  if (mode === 'practice') {
    return <PracticePanel onClose={onClose} onBack={() => setMode('choose')} />;
  }

  return (
    <ModeChooser
      dueToday={summary.dueToday}
      poolSize={summary.poolSize}
      onPickPractice={() => setMode('practice')}
      onPickSky={() => setMode('skyrun')}
      onPickFroggy={() => setMode('froggy')}
      onClose={onClose}
    />
  );
}

// ---------------------------------------------------------------------------
// Pemasangan mandiri
// ---------------------------------------------------------------------------

declare global {
  interface Window {
    __brtDailyPracticeInit?: boolean;
  }
}

function injectStyles() {
  OLD_STYLE_IDS.forEach((id) => document.getElementById(id)?.remove());
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = PANEL_CSS;
  document.head.appendChild(style);
}

function mountDailyPractice() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__brtDailyPracticeInit) return;
  window.__brtDailyPracticeInit = true;

  try {
    injectStyles();

    const fab = document.createElement('button');
    fab.className = 'bdp-fab';
    fab.type = 'button';
    document.body.appendChild(fab);

    let container: HTMLDivElement | null = null;
    let root: ReactRoot | null = null;

    /**
     * Isi tombol yang terakhir ditulis.
     *
     * Ini penjaga terpenting di berkas ini. Menulis fab.innerHTML adalah
     * perubahan childList di dalam document.body — persis yang diamati
     * MutationObserver di bawah. Tanpa perbandingan ini, tiap penulisan
     * memicu observer, yang memanggil fungsi ini lagi, yang menulis lagi:
     * loop microtask tak berujung yang membekukan seluruh laman.
     */
    let lastMarkup = '';

    function refreshLabel() {
      let markup: string;
      try {
        const summary = getReviewSummary();
        const badge =
          summary.dueToday > 0 ? `<span class="bdp-badge">${summary.dueToday}</span>` : '';
        markup = `<span aria-hidden="true">🔁</span><span>Latihan</span>${badge}`;
      } catch {
        markup = '<span aria-hidden="true">🔁</span><span>Latihan</span>';
      }

      // Tidak berubah -> JANGAN sentuh DOM sama sekali.
      if (markup === lastMarkup) return;
      lastMarkup = markup;
      fab.innerHTML = markup;
    }

    refreshLabel();

    async function openPanel() {
      if (container) return;
      const { createRoot } = await import('react-dom/client');
      container = document.createElement('div');
      document.body.appendChild(container);
      root = createRoot(container);
      root.render(<PracticeHost onClose={closePanel} />);
      fab.hidden = true;
    }

    function closePanel() {
      if (root) root.unmount();
      if (container) container.remove();
      root = null;
      container = null;
      refreshLabel();
      fab.hidden = false;
    }

    fab.addEventListener('click', () => {
      void openPanel();
    });

    // Sembunyikan tombol saat overlay game/panel lain terbuka.
    /**
     * Observer HANYA menyetel properti `hidden`.
     *
     * `hidden` adalah perubahan ATRIBUT, sedangkan observer ini mengamati
     * `childList` — jadi menyetelnya tidak pernah memicu observer kembali.
     *
     * refreshLabel SENGAJA TIDAK dipanggil dari sini. Itu pola yang sama
     * dipakai tiga modul tombol mengambang lain (ParentInsight,
     * ExpeditionLauncher, AiCompanion) yang selama ini aman.
     */
    const observer = new MutationObserver(() => {
      try {
        if (container) return; // panel sendiri sedang terbuka
        fab.hidden = document.querySelector(GAME_OVERLAY_SELECTORS) !== null;
      } catch {
        /* abaikan */
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[Brightoria] DailyPractice gagal dipasang (diabaikan dengan aman):', err);
  }
}

mountDailyPractice();

export { PracticeHost };
