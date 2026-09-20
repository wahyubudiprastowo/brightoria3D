import ModelPreview from '../../components/world3d/ModelPreview';
import { modelUrls } from '../../components/world3d/LocalModel';
import { useEffect, useState } from 'react';
import { Check, ChevronRight, Lightbulb, RotateCcw, ShieldCheck, X } from 'lucide-react';
import { digitalLevels } from './levels';
import { computeMastery, loadEvidence, saveEvidence, type DigitalEvidence } from './evidence';
import { sfx } from '../sound';
import { Confetti, StreakBadge, usePunch, useStreak } from '../juice';

/**
 * Benteng Digital — "Cyber Safety Sorter" (Patch 05).
 *
 * Game berbasis DOM/CSS murni (tidak butuh WebGL), mengikuti pola
 * arsitektur wajib dunia lain: `levels.ts` / `evidence.ts` / `XxxGame.tsx`.
 * Pemain menilai setiap situasi online sebagai "Aman" atau "Tidak aman",
 * lalu mendapat penjelasan — tarif belajar yang menenangkan, bukan
 * menakut-nakuti.
 */
export default function DigitalGame({
  onExit,
  onXpEarned,
}: {
  onExit: () => void;
  onXpEarned: (amount: number) => void;
}) {
  const [levelIndex, setLevelIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [evidence, setEvidence] = useState<DigitalEvidence>(() => loadEvidence());
  const [finished, setFinished] = useState(false);

  // Patch 10 juice: dekoratif murni, tidak menyentuh evidence/mastery/XP.
  const { streak, register: registerStreak, reset: resetStreak } = useStreak();
  const [confettiTick, setConfettiTick] = useState(0);
  const feedbackPunch = usePunch(revealed ? (wasCorrect ? 'ok' : 'no') : 'idle');

  const level = digitalLevels[levelIndex];
  const totalLevels = digitalLevels.length;
  const rightLabel = level.isSafe ? 'Aman' : 'Tidak aman';

  useEffect(() => {
    setRevealed(false);
    setWasCorrect(false);
    setShowHint(false);
  }, [levelIndex]);

  function choose(choice: boolean) {
    if (revealed) return;
    const attemptsSoFar = evidence.attempts[level.id] ?? 0;
    const isCorrect = choice === level.isSafe;

    const next: DigitalEvidence = {
      ...evidence,
      attempts: { ...evidence.attempts, [level.id]: attemptsSoFar + 1 },
      firstTryCorrect: { ...evidence.firstTryCorrect },
      completed: [...evidence.completed],
      updatedAt: new Date().toISOString(),
    };

    if (next.firstTryCorrect[level.id] === undefined) {
      next.firstTryCorrect[level.id] = attemptsSoFar === 0 && isCorrect;
    }

    setWasCorrect(isCorrect);
    setRevealed(true);
    registerStreak(isCorrect);

    if (isCorrect) {
      sfx.correct();
      setConfettiTick((n) => n + 1);
      if (!evidence.completed.includes(level.id)) {
        next.completed.push(level.id);
        onXpEarned(30);
        if (levelIndex + 1 >= totalLevels) sfx.win();
        else sfx.star();
      }
    } else {
      sfx.wrong();
    }

    setEvidence(next);
    saveEvidence(next);
  }

  function useHint() {
    sfx.click();
    setShowHint(true);
    const used = evidence.hintsUsed[level.id] ?? 0;
    const next = {
      ...evidence,
      hintsUsed: { ...evidence.hintsUsed, [level.id]: used + 1 },
    };
    setEvidence(next);
    saveEvidence(next);
  }

  function retry() {
    sfx.click();
    setRevealed(false);
    setWasCorrect(false);
    setShowHint(false);
    resetStreak();
  }

  function next() {
    sfx.click();
    if (levelIndex + 1 < totalLevels) {
      setLevelIndex(levelIndex + 1);
    } else {
      sfx.win();
      setFinished(true);
    }
  }

  const mastery = computeMastery(evidence, totalLevels);

  if (finished) {
    return (
      <div className="digital-overlay">
        <div className="digital-summary">
          <Confetti trigger={1} burst={40} origin="center" />
          <button className="close" onClick={() => { sfx.click(); onExit(); }}>
            <X />
          </button>
          <span className="portal juice-portal-win">
            <ShieldCheck size={40} />
          </span>
          <span className="chip">Benteng Digital selesai</span>
          <h2>Mastery kamu sekarang {mastery}%</h2>
          <p>
            {evidence.completed.length} dari {totalLevels} kartu berhasil dinilai dengan tepat.
          </p>
          <button className="primary" onClick={() => { sfx.click(); onExit(); }}>
            Kembali ke peta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="digital-overlay">
      <div className="digital-shell">
        <Confetti trigger={confettiTick} />
        <header className="digital-head">
          <div>
            <span className="chip">
              Benteng Digital &bull; Kartu {levelIndex + 1} dari {totalLevels}
            </span>
            <StreakBadge streak={streak} />
            <h2>{level.title}</h2>
          </div>
          <button className="close" onClick={() => { sfx.click(); onExit(); }}>
            <X />
          </button>
        </header>

        <ModelPreview url={modelUrls.digital} image="/assets/worlds/06_benteng_digital.webp" label="Pulau Digital 3D" />
        <div className="digital-scenario">
          <span className="shield">
            <ShieldCheck size={28} />
          </span>
          <p>{level.scenario}</p>
          <small>Bagaimana pendapatmu? Pilih salah satu di bawah.</small>
        </div>

        <div className="digital-choices">
          <button className="digital-choice safe" onClick={() => choose(true)} disabled={revealed}>
            <Check size={18} /> Aman
          </button>
          <button className="digital-choice danger" onClick={() => choose(false)} disabled={revealed}>
            <X size={18} /> Tidak aman
          </button>
        </div>

        {revealed && (
          <div className={'digital-feedback ' + (wasCorrect ? 'success' : 'mismatch') + ' ' + feedbackPunch}>
            <b>
              {wasCorrect
                ? 'Keputusanmu tepat!'
                : `Belum tepat. Jawaban yang benar: ${rightLabel}.`}
            </b>
            {level.explanation}
          </div>
        )}

        {showHint && <div className="digital-hint">{level.hint}</div>}

        <footer className="digital-actions">
          {!revealed && (
            <button className="ghost" onClick={useHint}>
              <Lightbulb size={16} /> Petunjuk
            </button>
          )}
          {revealed && !wasCorrect && (
            <button className="primary" onClick={retry}>
              <RotateCcw size={16} /> Coba lagi
            </button>
          )}
          {revealed && wasCorrect && (
            <button className="primary" onClick={next}>
              {levelIndex + 1 < totalLevels ? 'Kartu berikutnya' : 'Selesaikan benteng'} <ChevronRight />
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}