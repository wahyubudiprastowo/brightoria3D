import { useMemo, useState, type Dispatch, type MouseEvent, type SetStateAction } from 'react';
import { ChevronRight, RotateCcw, Store, Volume2 } from 'lucide-react';
import { curriculum, type ArabicWord } from './curriculum';
import { saveEvidence, type ArabicEvidence } from './evidence';
import { arabicSfx } from './arabicSfx';
import { Confetti, StreakBadge, usePunch, useStreak } from '../juice';

const MARKET_ROUNDS = 6;
const MARKET_OPTIONS = 4;

interface MarketOrder {
  target: ArabicWord;
  options: ArabicWord[];
}

const MARKET_STYLE_ID = 'brightoria-arabic-market-styles-v1';

const MARKET_CSS = `
.arabic-market { display: flex; flex-direction: column; gap: 14px; }
.arabic-market-hero {
  border-radius: 22px; padding: 18px; color: #17403a;
  background:
    radial-gradient(circle at 12% 18%, #fff3d6 0, transparent 32%),
    linear-gradient(135deg,#e3f6f0,#fff8df);
  border: 1px solid #cdeadf; display: grid; grid-template-columns: 1fr auto; gap: 14px; align-items: center;
}
.arabic-market-hero h3 { margin: 0 0 4px; font-size: 21px; color: #17403a; }
.arabic-market-hero p { margin: 0; font-size: 13px; line-height: 1.5; color: #4c6b62; }
.arabic-market-stall { font-size: 54px; filter: drop-shadow(0 8px 12px #17856f2a); }
.arabic-market-status { display: flex; justify-content: space-between; align-items: center; gap: 8px; font-size: 12px; color: #4c6b62; }
.arabic-market-order {
  background: #fffdf7; border: 2px solid #f3d48a; border-radius: 20px; padding: 18px;
  text-align: center; box-shadow: 0 10px 24px #c9922f22;
}
.arabic-market-customer { font-size: 42px; margin-bottom: 6px; }
.arabic-market-arabic-row { display: flex; align-items: center; justify-content: center; gap: 10px; }
.arabic-market-arabic { font-size: 34px; color: #17403a; }
.arabic-market-translit { color: #4c8a78; font-size: 13px; font-style: italic; margin-top: 4px; }
.arabic-market-request { color: #7a5410; font-size: 12px; margin-top: 8px; font-weight: 800; }
.arabic-market-shelves { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.arabic-market-item {
  border: 2px solid #d7ecdf; background: #fff; border-radius: 18px; padding: 14px 10px;
  min-height: 130px; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 6px; cursor: pointer; transition: transform .12s ease, border-color .12s ease, box-shadow .12s ease;
}
.arabic-market-item:not(:disabled):hover { transform: translateY(-3px); border-color: #9ecdbb; box-shadow: 0 8px 18px #17856f1f; }
.arabic-market-item:disabled { cursor: default; }
.arabic-market-item.correct { background: #dff3ea; border-color: #198576; color: #14624f; }
.arabic-market-item.wrong { background: #fbe6e2; border-color: #c0492f; color: #8a331f; }
.arabic-market-emoji { font-size: 38px; line-height: 1; }
.arabic-market-meaning { font-size: 14px; font-weight: 900; color: #17403a; }
.arabic-market-word { font-size: 20px; color: #17403a; }
.arabic-market-feedback { border-radius: 14px; padding: 12px 14px; font-size: 13px; line-height: 1.45; background: #e3f6f0; color: #17403a; }
.arabic-market-feedback.bad { background: #fbe6e2; color: #8a331f; }
.arabic-market-actions { display: flex; justify-content: flex-end; }
.arabic-market-result { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 8px 0; }
.arabic-market-score { font-size: 48px; line-height: 1; }
.arabic-market-result p { max-width: 440px; margin: 0; color: #4c6b62; line-height: 1.5; }
.arabic-market-result-actions { display: flex; gap: 10px; width: min(420px, 100%); margin-top: 6px; }
.arabic-market-result-actions .oasis-ghost-btn { flex: 1; justify-content: center; }
.arabic-market-result-actions .oasis-primary-btn { flex: 1.4; }
@media (max-width: 700px) {
  .arabic-market-hero { grid-template-columns: 1fr; text-align: center; }
  .arabic-market-shelves { grid-template-columns: repeat(2, 1fr); }
  .arabic-market-arabic { font-size: 28px; }
}
`;

function useMarketStyles() {
  useMemo(() => {
    if (typeof document === 'undefined' || document.getElementById(MARKET_STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = MARKET_STYLE_ID;
    style.textContent = MARKET_CSS;
    document.head.appendChild(style);
  }, []);
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function marketWordPool(): ArabicWord[] {
  const preferredLessons = new Set(['l11', 'l12', 'l13', 'l14', 'l15']);
  const preferred = curriculum
    .filter((lesson) => preferredLessons.has(lesson.id))
    .flatMap((lesson) => lesson.words ?? []);
  const fallback = curriculum.flatMap((lesson) => lesson.words ?? []);
  return preferred.length >= 12 ? preferred : fallback;
}

function buildOrders(): MarketOrder[] {
  const pool = marketWordPool();
  const targets = shuffle(pool).slice(0, Math.min(MARKET_ROUNDS, pool.length));
  return targets.map((target) => {
    const distractors = shuffle(pool.filter((word) => word.id !== target.id)).slice(0, MARKET_OPTIONS - 1);
    return { target, options: shuffle([target, ...distractors]) };
  });
}

export default function ArabicMarketGame({
  evidence,
  setEvidence,
  ttsAvailable,
  onBack,
  onXpEarned,
  onSpeak,
  onConfetti,
}: {
  evidence: ArabicEvidence;
  setEvidence: Dispatch<SetStateAction<ArabicEvidence>>;
  ttsAvailable: boolean;
  onBack: () => void;
  onXpEarned: (amount: number) => void;
  onSpeak: (text: string, event?: MouseEvent) => void;
  onConfetti: () => void;
}) {
  useMarketStyles();
  const [orders, setOrders] = useState<MarketOrder[]>(() => buildOrders());
  const [round, setRound] = useState(0);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [correctIds, setCorrectIds] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);
  const { streak, register: registerStreak, reset: resetStreak } = useStreak();

  const current = orders[round];
  const isRevealed = pickedId !== null;
  const isCorrect = !!current && pickedId === current.target.id;
  const feedbackPunch = usePunch(isRevealed ? (isCorrect ? 'ok' : 'no') : 'idle');

  function restart() {
    arabicSfx.click();
    setOrders(buildOrders());
    setRound(0);
    setPickedId(null);
    setCorrectIds([]);
    setFinished(false);
    resetStreak();
  }

  function choose(word: ArabicWord) {
    if (isRevealed || !current) return;
    const ok = word.id === current.target.id;
    setPickedId(word.id);
    registerStreak(ok);
    if (ok) {
      arabicSfx.correct();
      setCorrectIds((ids) => [...ids, word.id]);
      onConfetti();
      if (!evidence.collectedWords.includes(word.id)) setTimeout(() => arabicSfx.collect(), 140);
    } else {
      arabicSfx.wrong();
    }
  }

  function next() {
    arabicSfx.step();
    if (round + 1 < orders.length) {
      setRound((n) => n + 1);
      setPickedId(null);
      return;
    }

    const uniqueCorrectIds = Array.from(new Set(correctIds));
    const score = uniqueCorrectIds.length;
    const xpGain = 8 + score * 4;
    const nextEvidence: ArabicEvidence = {
      ...evidence,
      collectedWords: Array.from(new Set([...evidence.collectedWords, ...uniqueCorrectIds])),
      updatedAt: new Date().toISOString(),
    };
    setEvidence(nextEvidence);
    saveEvidence(nextEvidence);
    onXpEarned(xpGain);
    if (score >= Math.ceil(orders.length * 0.8)) {
      arabicSfx.complete();
      onConfetti();
    } else {
      arabicSfx.star();
    }
    setFinished(true);
  }

  if (!current && !finished) return null;

  if (finished) {
    const score = correctIds.length;
    return (
      <div className="arabic-market">
        <Confetti trigger={score} />
        <div className="arabic-market-result">
          <div className="arabic-market-score">🛍️</div>
          <h3>Pasar selesai!</h3>
          <p>
            Kamu melayani {score} dari {orders.length} pesanan dengan benar. Kata yang benar masuk ke koleksi ransel.
          </p>
          <div className="arabic-market-result-actions">
            <button className="oasis-ghost-btn" onClick={restart}>
              <RotateCcw size={16} /> Main lagi
            </button>
            <button className="oasis-primary-btn" onClick={onBack}>
              Kembali ke peta <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="arabic-market">
      <div className="arabic-market-hero">
        <div>
          <span className="chip">Mini-game baru</span>
          <h3>Pasar Kata Arab</h3>
          <p>Pembeli menyebut kata Arab. Pilih barang yang tepat dari rak pasar untuk melatih kosakata dalam konteks.</p>
        </div>
        <div className="arabic-market-stall" aria-hidden="true">🧺</div>
      </div>

      <div className="arabic-market-status">
        <span>Pesanan {round + 1} dari {orders.length}</span>
        <StreakBadge streak={streak} />
      </div>

      <section className="arabic-market-order">
        <div className="arabic-market-customer" aria-hidden="true">🧕</div>
        <div className="arabic-market-arabic-row">
          <div className="arabic-market-arabic oasis-arabic-text">{current.target.arabic}</div>
          {ttsAvailable && (
            <button className="oasis-speak-btn" onClick={(event) => onSpeak(current.target.arabic, event)} aria-label="Dengarkan">
              <Volume2 size={16} />
            </button>
          )}
        </div>
        <div className="arabic-market-translit">{current.target.translit}</div>
        <div className="arabic-market-request">Pembeli mencari barang ini. Yang mana artinya?</div>
      </section>

      <div className="arabic-market-shelves">
        {current.options.map((word) => {
          let className = 'arabic-market-item';
          if (isRevealed && word.id === current.target.id) className += ' correct ' + feedbackPunch;
          else if (isRevealed && word.id === pickedId) className += ' wrong ' + feedbackPunch;
          return (
            <button key={word.id} className={className} onClick={() => choose(word)} disabled={isRevealed}>
              <span className="arabic-market-emoji">{word.emoji}</span>
              <span className="arabic-market-meaning">{word.meaning}</span>
              {isRevealed && word.id === current.target.id && (
                <span className="arabic-market-word oasis-arabic-text">{word.arabic}</span>
              )}
            </button>
          );
        })}
      </div>

      {isRevealed && (
        <div className={'arabic-market-feedback' + (isCorrect ? '' : ' bad')}>
          {isCorrect
            ? `Benar, ${current.target.arabic} artinya ${current.target.meaning}.`
            : `Belum tepat. ${current.target.arabic} artinya ${current.target.meaning}.`}
        </div>
      )}

      <footer className="arabic-market-actions">
        {isRevealed && (
          <button className="oasis-primary-btn" onClick={next} style={{ width: 'auto' }}>
            {round + 1 < orders.length ? 'Pesanan berikutnya' : 'Selesai'}
            <ChevronRight size={16} />
          </button>
        )}
      </footer>
    </div>
  );
}
