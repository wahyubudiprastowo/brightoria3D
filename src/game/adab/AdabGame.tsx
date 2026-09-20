import { useEffect, useMemo, useState } from 'react';
import { BookOpen, ChevronRight, Lock, RotateCcw, Sparkles, Star, X } from 'lucide-react';
import { chapters, type StoryChapter, type StoryChoice } from './scenarios';
import { computeMastery, loadEvidence, recordChoice, saveEvidence, type AdabEvidence } from './evidence';
import { Confetti, usePunch } from '../juice';

/**
 * AdabGame.tsx — Patch 26. Mekanik "Kisah Pilihan" (branching story) untuk
 * Kampung Adab — MEKANIK YANG BERBEDA TOTAL dari mesin kuis generik yang
 * sebelumnya dipakai bersama oleh Quran/Adab/English (QuizGame.tsx).
 *
 * ====================================================================
 * KENAPA MEKANIK INI DIPILIH (bukan kuis pilihan ganda):
 * ====================================================================
 * Materi Kampung Adab (nilai karakter, kebiasaan baik) bersifat
 * SITUASIONAL — tidak ada satu "jawaban paling benar" yang mutlak untuk
 * diuji dengan pilihan ganda konvensional, melainkan gradasi kualitas
 * tindakan (lebih baik / cukup baik / masih bisa ditingkatkan). Mekanik
 * cerita bercabang (branching narrative) jauh lebih pas: anak menghadapi
 * skenario nyata, memilih tindakan, dan MELIHAT KONSEKUENSI cerita dari
 * pilihannya — belajar lewat pengalaman naratif, bukan hafalan.
 *
 * TIDAK ADA vonis benar/salah. Setiap pilihan mendapat 1-3 bintang
 * berdasarkan kualitas (best/good/needsWork), TAPI ketiganya tetap
 * mendapat konsekuensi cerita yang masuk akal dan pesan reflektif yang
 * mendidik — tidak ada yang terasa seperti "hukuman" atau vonis
 * kepribadian.
 *
 * KOLEKSI PENDORONG REPLAY: "Buku Kisah" mencatat SETIAP kombinasi
 * bab+pilihan yang pernah dicoba (24 total: 8 bab x 3 pilihan). Anak
 * didorong mengulang bab yang sama dengan pilihan berbeda untuk
 * melengkapi koleksi seluruh kemungkinan akhir cerita — rasa penasaran
 * "kalau aku pilih yang lain, ceritanya jadi apa ya?" inilah motor
 * replay value yang berbeda dari mekanik dunia lain (Numeria/Digital/
 * Arabic yang semuanya berbasis "benar vs salah").
 *
 * File ini menimpa LANGSUNG path yang sama seperti komponen Adab yang
 * sudah ada (`src/game/adab/AdabGame.tsx`), dengan signature props sama
 * (`onExit`, `onXpEarned`) — pola yang terbukti berhasil untuk Oasis
 * Bahasa Arab (Patch 19+) tanpa perlu mengubah App.tsx sama sekali.
 */

const STYLE_ID = 'brightoria-adab-story-styles-v1';

const ADAB_CSS = `
.adab-overlay { position: fixed; inset: 0; z-index: 75; background: linear-gradient(160deg,#2e1608ee,#3d1f0fee); backdrop-filter: blur(10px); display: grid; place-items: center; padding: 16px; }
.adab-shell { position: relative; width: min(720px,96vw); max-height: 92vh; overflow-y: auto; background: #fffaf3; border-radius: 26px; padding: 26px; box-shadow: 0 25px 80px #0007; display: flex; flex-direction: column; gap: 16px; border-top: 6px solid #c86845; background-image: radial-gradient(circle at 100% 0%, #ffe9de 0%, transparent 55%), radial-gradient(circle at 0% 100%, #fff3d6 0%, transparent 55%); }
.adab-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
.adab-head h2 { margin: 6px 0 0; color: #6b2f12; }
.adab-close-btn { border: 0; background: #fbe6da; border-radius: 50%; width: 35px; height: 35px; display: grid; place-items: center; cursor: pointer; flex-shrink: 0; color: #c86845; }
.adab-mastery-bar { display: flex; flex-direction: column; gap: 6px; font-size: 12px; color: #8a5230; }
.adab-mastery-track { height: 11px; background: #f1ddc8; border-radius: 20px; overflow: hidden; }
.adab-mastery-fill { display: block; height: 100%; background: linear-gradient(90deg,#c86845,#f3c861); border-radius: 20px; }
.adab-book-btn { border: 1px solid #eecda1; background: #fff8ec; border-radius: 12px; padding: 8px 12px; font-size: 12px; display: inline-flex; align-items: center; gap: 6px; cursor: pointer; color: #a15321; }
.adab-chapters-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; }
.adab-chapter-card { border: 1px solid #f3d9c0; background: linear-gradient(160deg,#fff3e6,#ffe4cd); border-radius: 16px; padding: 14px 10px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 4px; position: relative; box-shadow: 0 6px 16px #c868451a; cursor: pointer; transition: transform 0.15s ease; }
.adab-chapter-card:not(.locked):hover { transform: translateY(-3px); }
.adab-chapter-card.locked { background: #ece3d6; border-color: #e2d5c0; color: #a89376; opacity: 0.85; }
.adab-chapter-number { position: absolute; top: 8px; left: 10px; font-size: 10px; font-weight: 900; color: #b5651d; }
.adab-chapter-icon { font-size: 28px; margin-top: 6px; }
.adab-chapter-card b { font-size: 12px; color: #6b3a15; }
.adab-chapter-stars { display: flex; gap: 2px; margin-top: 2px; }
.adab-story { display: flex; flex-direction: column; gap: 14px; }
.adab-setting-card { background: linear-gradient(160deg,#fff3e6,#ffe4cd); border: 1px solid #f3d9c0; border-radius: 18px; padding: 22px 18px; text-align: center; }
.adab-setting-icon { font-size: 44px; margin-bottom: 8px; }
.adab-setting-text { font-size: 15px; color: #6b3a15; line-height: 1.6; }
.adab-choices { display: flex; flex-direction: column; gap: 10px; }
.adab-choice-btn { border: 2px solid #f3d9c0; background: #fff; border-radius: 16px; padding: 14px 16px; text-align: left; font-size: 14px; cursor: pointer; color: #6b3a15; display: flex; align-items: center; gap: 10px; }
.adab-choice-btn:not(:disabled):hover { border-color: #d9a35f; transform: translateY(-2px); }
.adab-choice-btn .adab-choice-badge { flex-shrink: 0; width: 22px; height: 22px; border-radius: 50%; background: #fbe6da; color: #c86845; font-size: 11px; font-weight: 900; display: grid; place-items: center; }
.adab-outcome-card { background: linear-gradient(160deg,#fff3e6,#ffe4cd); border: 1px solid #f3d9c0; border-radius: 18px; padding: 20px 18px; display: flex; flex-direction: column; gap: 10px; }
.adab-outcome-stars { display: flex; gap: 4px; justify-content: center; }
.adab-outcome-text { font-size: 14px; color: #6b3a15; line-height: 1.6; text-align: center; }
.adab-outcome-reflection { font-size: 12px; color: #a15321; background: #fff3cd; border: 1px solid #edcc6d; border-radius: 12px; padding: 10px 14px; text-align: center; }
.adab-actions { display: flex; gap: 10px; }
.adab-ghost-btn { flex: 1; border: 1px solid #eecda1; background: #fff8ec; border-radius: 12px; padding: 11px 14px; display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 13px; cursor: pointer; color: #a15321; }
.adab-primary-btn { flex: 2; border: 0; background: linear-gradient(135deg,#c86845,#8a3d16); color: #fff; padding: 13px 18px; border-radius: 14px; font-weight: 900; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; font-size: 14px; box-shadow: 0 9px 22px #8a3d1633; }
.adab-collection-note { font-size: 12px; color: #8a5230; text-align: center; }
.adab-collection-list { display: flex; flex-direction: column; gap: 10px; max-height: 55vh; overflow-y: auto; }
.adab-collection-chapter { border: 1px solid #f3d9c0; border-radius: 14px; padding: 10px 14px; background: #fff8ec; }
.adab-collection-chapter-title { font-size: 12px; font-weight: 800; color: #6b3a15; margin-bottom: 6px; display: flex; align-items: center; gap: 6px; }
.adab-collection-badges { display: flex; gap: 6px; flex-wrap: wrap; }
.adab-collection-badge { font-size: 10px; padding: 4px 8px; border-radius: 999px; background: #ece3d6; color: #a89376; }
.adab-collection-badge.owned { background: #fbe6da; color: #c86845; font-weight: 800; }
@media (max-width: 700px) {
  .adab-shell { padding: 18px; }
  .adab-chapters-grid { grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); }
}
`;

function useInjectAdabStyles() {
  useEffect(() => {
    if (document.getElementById(STYLE_ID)) return;
    const el = document.createElement('style');
    el.id = STYLE_ID;
    el.textContent = ADAB_CSS;
    document.head.appendChild(el);
  }, []);
}

function isChapterUnlocked(index: number, evidence: AdabEvidence): boolean {
  if (index === 0) return true;
  const prev = chapters[index - 1];
  return !!evidence.chapters[prev.id]?.completed;
}

type View = 'map' | 'story' | 'outcome' | 'collection';

export default function AdabGame({
  onExit,
  onXpEarned,
}: {
  onExit: () => void;
  onXpEarned: (amount: number) => void;
}) {
  useInjectAdabStyles();

  const [view, setView] = useState<View>('map');
  const [evidence, setEvidence] = useState<AdabEvidence>(() => loadEvidence());
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [pickedChoice, setPickedChoice] = useState<StoryChoice | null>(null);
  const [confettiTick, setConfettiTick] = useState(0);
  const outcomePunch = usePunch(pickedChoice?.id ?? 'idle');

  const overallMastery = useMemo(() => computeMastery(evidence, chapters.length), [evidence]);
  const totalOutcomes = chapters.length * 3;

  const activeChapter = chapters.find((c) => c.id === activeChapterId) ?? null;
  const activeProgress = activeChapterId ? evidence.chapters[activeChapterId] : undefined;

  function openChapter(id: string) {
    setActiveChapterId(id);
    setPickedChoice(null);
    setView('story');
  }

  function tryLocked() {
    // Placeholder untuk efek/umpan balik ringan saat bab terkunci diklik.
  }

  function chooseOption(choice: StoryChoice) {
    if (!activeChapterId) return;
    setPickedChoice(choice);
    const next = recordChoice(evidence, activeChapterId, choice.id, choice.quality);
    setEvidence(next);
    saveEvidence(next);
    const xp = choice.quality === 'best' ? 25 : choice.quality === 'good' ? 18 : 12;
    onXpEarned(xp);
    if (choice.quality === 'best') setConfettiTick((n) => n + 1);
    setView('outcome');
  }

  function backToMap() {
    setView('map');
    setActiveChapterId(null);
    setPickedChoice(null);
  }

  function retryChapter() {
    setPickedChoice(null);
    setView('story');
  }

  return (
    <div className="adab-overlay">
      <div className="adab-shell">
        <Confetti trigger={confettiTick} />

        <header className="adab-head">
          <div>
            <span className="chip">Kampung Adab</span>
            <h2>
              {view === 'map' && 'Kisah Pilihan — 8 Bab Kehidupan Sehari-hari'}
              {(view === 'story' || view === 'outcome') && activeChapter?.title}
              {view === 'collection' && 'Buku Kisah'}
            </h2>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {(view === 'story' || view === 'outcome') && (
              <button className="adab-book-btn" onClick={backToMap}>
                Peta
              </button>
            )}
            {view === 'map' && (
              <button className="adab-book-btn" onClick={() => setView('collection')}>
                <BookOpen size={14} /> Kisah ({evidence.collectedOutcomes.length}/{totalOutcomes})
              </button>
            )}
            {view === 'collection' && (
              <button className="adab-book-btn" onClick={backToMap}>
                Peta
              </button>
            )}
            <button className="adab-close-btn" onClick={onExit}>
              <X size={16} />
            </button>
          </div>
        </header>

        {view === 'map' && (
          <div>
            <div className="adab-mastery-bar" style={{ marginBottom: 14 }}>
              <div className="adab-mastery-track">
                <span className="adab-mastery-fill" style={{ width: `${overallMastery}%` }} />
              </div>
              <span>{overallMastery}% mastery keseluruhan &bull; setiap bab adalah kisah baru untuk dijalani</span>
            </div>
            <div className="adab-chapters-grid">
              {chapters.map((chapter, i) => {
                const progress = evidence.chapters[chapter.id];
                const unlocked = isChapterUnlocked(i, evidence);
                return (
                  <button
                    key={chapter.id}
                    className={'adab-chapter-card' + (unlocked ? '' : ' locked')}
                    onClick={() => (unlocked ? openChapter(chapter.id) : tryLocked())}
                  >
                    <span className="adab-chapter-number">{chapter.chapterNumber}</span>
                    <span className="adab-chapter-icon">{unlocked ? chapter.icon : <Lock size={18} />}</span>
                    <b>{chapter.title}</b>
                    <span className="adab-chapter-stars">
                      {[1, 2, 3].map((s) => (
                        <Star key={s} size={13} fill={progress && progress.bestStars >= s ? '#f3c861' : 'none'} color="#f3c861" />
                      ))}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {view === 'story' && activeChapter && (
          <div className="adab-story">
            <div className="adab-setting-card">
              <div className="adab-setting-icon">{activeChapter.icon}</div>
              <div className="adab-setting-text">{activeChapter.setting}</div>
            </div>
            <div className="adab-choices">
              {activeChapter.choices.map((choice, i) => (
                <button key={choice.id} className="adab-choice-btn" onClick={() => chooseOption(choice)}>
                  <span className="adab-choice-badge">{String.fromCharCode(65 + i)}</span>
                  {choice.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {view === 'outcome' && activeChapter && pickedChoice && (
          <div className={'adab-story ' + outcomePunch}>
            <div className="adab-outcome-card">
              <div className="adab-outcome-stars">
                {[1, 2, 3].map((s) => {
                  const starVal = pickedChoice.quality === 'best' ? 3 : pickedChoice.quality === 'good' ? 2 : 1;
                  return <Star key={s} size={26} fill={starVal >= s ? '#f3c861' : 'none'} color="#f3c861" />;
                })}
              </div>
              <div className="adab-outcome-text">{pickedChoice.consequence}</div>
              <div className="adab-outcome-reflection">
                <Sparkles size={13} style={{ display: 'inline', marginRight: 4 }} />
                {pickedChoice.reflection}
              </div>
            </div>
            <div className="adab-actions">
              <button className="adab-ghost-btn" onClick={retryChapter}>
                <RotateCcw size={16} /> Coba pilihan lain
              </button>
              <button className="adab-primary-btn" onClick={backToMap}>
                Kembali ke peta <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {view === 'collection' && (
          <div>
            <p className="adab-collection-note">
              Setiap pilihan yang pernah kamu coba akan tercatat di sini. Coba semua pilihan di setiap bab untuk melengkapi Buku Kisah!
            </p>
            <div className="adab-collection-list">
              {chapters.map((chapter) => {
                const progress = evidence.chapters[chapter.id];
                return (
                  <div key={chapter.id} className="adab-collection-chapter">
                    <div className="adab-collection-chapter-title">
                      <span>{chapter.icon}</span> {chapter.title}
                    </div>
                    <div className="adab-collection-badges">
                      {chapter.choices.map((choice, i) => {
                        const owned = progress?.triedChoiceIds.includes(choice.id);
                        return (
                          <span key={choice.id} className={'adab-collection-badge' + (owned ? ' owned' : '')}>
                            Pilihan {String.fromCharCode(65 + i)} {owned ? '✓' : '?'}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
