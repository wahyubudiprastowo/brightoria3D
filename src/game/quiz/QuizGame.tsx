import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { Check, ChevronRight, CircleHelp, Lightbulb, RotateCcw, Sparkles, X } from 'lucide-react';
import { sfx } from '../sound';
import { Confetti, StreakBadge, usePunch, useStreak } from '../juice';
import type { QuizEvidence } from './evidence';

export interface QuizQuestion {
  id: string;
  title: string;
  prompt: string;
  promptNote?: string;
  /** true = tampilkan prompt sebagai teks besar (mis. huruf/kata Arab). */
  big?: boolean;
  /** Optional image shown beside prompt, useful for concrete vocabulary. */
  image?: string;
  imageAlt?: string;
  /** Optional learning category shown as a small badge. */
  category?: string;
  /** Optional pronunciation guide for Arabic vocabulary. */
  pronunciation?: string;
  /** Optional local visual cue for concrete vocabulary. */
  emoji?: string;
  emojiLabel?: string;
  options: string[];
  correctIndex: number;
  hint: string;
  explanation: string;
}

interface QuizGameProps {
  worldLabel: string;
  icon: ReactNode;
  tone: { color: string; accent: string };
  questions: QuizQuestion[];
  load: () => QuizEvidence;
  save: (evidence: QuizEvidence) => void;
  compute: (evidence: QuizEvidence, total: number) => number;
  onExit: () => void;
  onXpEarned: (amount: number) => void;
  /** Optional short session drawn from a larger question collection. */
  sessionSize?: number;
  /** Total questions used by mastery calculation when session is shortened. */
  masteryTotal?: number;
}

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

function chooseSession(
  questions: QuizQuestion[],
  evidence: QuizEvidence,
  sessionSize?: number,
): QuizQuestion[] {
  if (!sessionSize || sessionSize >= questions.length) return questions;

  const incomplete = questions.filter((question) => !evidence.completed.includes(question.id));
  const completed = questions.filter((question) => evidence.completed.includes(question.id));
  const prioritized = shuffle(incomplete).slice(0, sessionSize);
  if (prioritized.length === sessionSize) return prioritized;

  const fillCount = sessionSize - prioritized.length;
  return [...prioritized, ...shuffle(completed).slice(0, fillCount)];
}

/**
 * Mesin kuis bersama untuk dunia yang murni DOM/CSS (Patch 07): Al-Qur'an,
 * Adab, Bahasa Arab, dan English Harbor. Setiap dunia tetap menyediakan
 * levels.ts / evidence.ts / XxxGame.tsx sesuai pola wajib — komponen ini
 * hanyalah mesin umum agar keempat dunia konsisten perilakunya.
 *
 * Reward XP +30 hanya diberikan SEKALI per soal, tepat saat jawaban benar
 * pertama kali — tidak ada imbalan palsu (baca kebijakan Patch 04).
 */
export default function QuizGame({
  worldLabel,
  icon,
  tone,
  questions,
  load,
  save,
  compute,
  onExit,
  onXpEarned,
  sessionSize,
  masteryTotal: masteryTotalProp,
}: QuizGameProps) {
  const [levelIndex, setLevelIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [wasCorrect, setWasCorrect] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showGlossary, setShowGlossary] = useState(false);
  const [evidence, setEvidence] = useState<QuizEvidence>(() => load());
  const [sessionQuestions] = useState<QuizQuestion[]>(() =>
    chooseSession(questions, evidence, sessionSize),
  );
  const [finished, setFinished] = useState(false);

  // --- Patch 10: juice kit (confetti, streak, punch) — murni dekoratif,
  // tidak memengaruhi evidence/mastery/XP resmi sama sekali. ---
  const { streak, register: registerStreak, reset: resetStreak } = useStreak();
  const [confettiTick, setConfettiTick] = useState(0);
  const feedbackPunch = usePunch(revealed ? (wasCorrect ? 'ok' : 'no') : 'idle');

  const q = sessionQuestions[levelIndex];
  const totalLevels = sessionQuestions.length;
  const masteryTotal = masteryTotalProp ?? questions.length;

  useEffect(() => {
    setPicked(null);
    setWasCorrect(false);
    setRevealed(false);
    setShowHint(false);
    setShowGlossary(false);
  }, [levelIndex]);

  function choose(choiceIndex: number) {
    if (revealed) return;
    const attemptsSoFar = evidence.attempts[q.id] ?? 0;
    const isCorrect = choiceIndex === q.correctIndex;

    const next: QuizEvidence = {
      ...evidence,
      attempts: { ...evidence.attempts, [q.id]: attemptsSoFar + 1 },
      firstTryCorrect: { ...evidence.firstTryCorrect },
      completed: [...evidence.completed],
      updatedAt: new Date().toISOString(),
    };

    if (next.firstTryCorrect[q.id] === undefined) {
      next.firstTryCorrect[q.id] = attemptsSoFar === 0 && isCorrect;
    }

    setPicked(choiceIndex);
    setWasCorrect(isCorrect);
    setRevealed(true);

    registerStreak(isCorrect);

    if (isCorrect) {
      sfx.correct();
      setConfettiTick((n) => n + 1);
      if (!evidence.completed.includes(q.id)) {
        next.completed.push(q.id);
        onXpEarned(30);
        if (levelIndex + 1 >= totalLevels) sfx.win();
        else sfx.star();
      }
    } else {
      sfx.wrong();
    }

    setEvidence(next);
    save(next);
  }

  function useHint() {
    sfx.click();
    setShowHint(true);
    const used = evidence.hintsUsed[q.id] ?? 0;
    const next = {
      ...evidence,
      hintsUsed: { ...evidence.hintsUsed, [q.id]: used + 1 },
    };
    setEvidence(next);
    save(next);
  }

  function toggleGlossary() {
    sfx.click();
    setShowGlossary((visible) => !visible);
  }

  function retry() {
    sfx.click();
    setPicked(null);
    setWasCorrect(false);
    setRevealed(false);
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

  function exit() {
    sfx.click();
    onExit();
  }

  const mastery = compute(evidence, masteryTotal);
  const toneStyle = {
    '--quizC': tone.color,
    '--quizA': tone.accent,
  } as unknown as CSSProperties;
  if (!q || totalLevels === 0) return null;
  const completedInSession = sessionQuestions.filter((question) => evidence.completed.includes(question.id)).length;
  const progressPercent = totalLevels === 0 ? 0 : Math.round((Math.min(levelIndex + (revealed ? 1 : 0), totalLevels) / totalLevels) * 100);
  const choiceLetters = ['A', 'B', 'C', 'D'];

  if (finished) {
    return (
      <div className="quiz-overlay">
        <div className="quiz-summary" style={toneStyle}>
          <Confetti trigger={1} burst={40} origin="center" />
          <button className="close" onClick={exit}>
            <X />
          </button>
          <span className="portal quiz-summary-portal juice-portal-win" style={{ background: tone.color }}>
            {icon}
          </span>
          <span className="quiz-celebration"><Sparkles size={15} /> Misi selesai</span>
          <span className="chip">{worldLabel} selesai</span>
          <h2>Mastery kamu sekarang {mastery}%</h2>
          <p>
            {completedInSession} dari {totalLevels} kartu sesi selesai. Koleksi: {evidence.completed.length} dari {masteryTotal} kata.
          </p>
          <button className="primary" onClick={exit}>
            Kembali ke peta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-overlay">
      <div className="quiz-shell" style={toneStyle}>
        <Confetti trigger={confettiTick} />
        <header className="quiz-head">
          <div>
            <div className="quiz-kicker-row">
              <span className="chip">{worldLabel}</span>
              <span className="quiz-counter">Kartu {levelIndex + 1}/{totalLevels}</span>
              <StreakBadge streak={streak} />
            </div>
            <h2>{q.title}</h2>
            <div className="quiz-progress-track" aria-label={`Kemajuan sesi ${progressPercent}%`}>
              <i style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
          <button className="close" onClick={exit}>
            <X />
          </button>
        </header>

        <div className="quiz-prompt">
            <div className="quiz-prompt-topline">
              <span className="quiz-icon"><Sparkles size={17} /> {icon}</span>
              {q.category && <span className="quiz-category">{q.category}</span>}
            </div>
            <div className={q.image || q.emoji ? 'quiz-prompt-content has-visual' : 'quiz-prompt-content'}>
              {q.image && (
                <img className="quiz-image" src={q.image} alt={q.imageAlt ?? q.title} />
              )}
              {q.emoji && (
                <span className="quiz-visual" role="img" aria-label={q.emojiLabel ?? q.title}>
                  {q.emoji}
                </span>
              )}
              <div className="quiz-word-block">
                {q.big ? (
                  <div className="quiz-script" dir="rtl" lang="ar">
                    {q.prompt}
                  </div>
                ) : (
                  <p>{q.prompt}</p>
                )}
                {q.pronunciation && <small className="quiz-pronunciation">{q.pronunciation}</small>}
              </div>
            </div>
            {q.promptNote && <small>{q.promptNote}</small>}
            <div className="quiz-prompt-footer">
              <span><CircleHelp size={14} /> Pilih arti yang paling tepat</span>
              {q.pronunciation && <span className="quiz-listen-note">Baca pelan: {q.pronunciation}</span>}
            </div>
          </div>

        <div className="quiz-options">
          {q.options.map((option, i) => {
            let className = 'quiz-option';
            if (revealed) {
              if (i === q.correctIndex) className += ' correct ' + feedbackPunch;
              else if (picked === i) className += ' wrong-pick ' + feedbackPunch;
            }
            return (
              <button
                key={i}
                className={className}
                onClick={() => choose(i)}
                disabled={revealed}
              >
                <span className="k">{choiceLetters[i]}</span>
                <span>{option}</span>
                {revealed && i === q.correctIndex && <Check className="quiz-option-check" size={18} />}
              </button>
            );
          })}
        </div>

        {revealed && (
          <div className={'quiz-feedback ' + (wasCorrect ? 'success' : 'mismatch') + ' ' + feedbackPunch}>
            <b>{wasCorrect ? 'Tepat sekali!' : 'Belum tepat — lihat penjelasan di bawah.'}</b>
            {q.explanation}
          </div>
        )}

        {showHint && <div className="quiz-hint"><Lightbulb size={17} /><span><b>Petunjuk penjelajah</b>{q.hint}</span></div>}
        {showGlossary && (
          <div className="quiz-glossary">
            <span className="quiz-glossary-icon">{q.emoji ?? '📖'}</span>
            <span><b>Kata hari ini</b>{q.prompt} {q.pronunciation ? `· ${q.pronunciation}` : ''}</span>
          </div>
        )}

        <footer className="quiz-actions">
          {!revealed && (
            <button className="ghost" onClick={useHint}>
              <Lightbulb size={16} /> Petunjuk
            </button>
          )}
          {!revealed && (
            <button className="ghost" onClick={toggleGlossary} aria-pressed={showGlossary}>
              <CircleHelp size={16} /> {showGlossary ? 'Tutup kata' : 'Lihat kata'}
            </button>
          )}
          {revealed && !wasCorrect && (
            <button className="primary" onClick={retry}>
              <RotateCcw size={16} /> Coba lagi
            </button>
          )}
          {revealed && wasCorrect && (
            <button className="primary" onClick={next}>
              {levelIndex + 1 < totalLevels ? 'Soal berikutnya' : 'Selesaikan dunia'} <ChevronRight />
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}