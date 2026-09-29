import ModelPreview from '../../components/world3d/ModelPreview';
import { modelUrls } from '../../components/world3d/LocalModel';
import { useEffect, useState } from 'react';
import { Check, ChevronRight, Lightbulb, RotateCcw, ShieldAlert, ShieldCheck, X } from 'lucide-react';
import { digitalLevels } from './levels';
import { computeMastery, loadEvidence, saveEvidence, type DigitalEvidence } from './evidence';
import { sfx } from '../sound';
import { Confetti, StreakBadge, usePunch, useStreak } from '../juice';

/**
 * Benteng Digital — "Benteng Amanah Digital".
 *
 * Game berbasis DOM/CSS murni (tidak butuh WebGL), mengikuti pola
 * arsitektur wajib dunia lain: `levels.ts` / `evidence.ts` / `XxxGame.tsx`.
 * Pemain menilai setiap situasi online sebagai "Aman" atau "Tidak aman",
 * lalu mendapat penjelasan adab digital Islami yang menenangkan, bukan
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
  const progress = Math.round(((levelIndex + 1) / totalLevels) * 100);
  const principle = getDigitalPrinciple(level.id);

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
          <span className="chip">Benteng Amanah Digital selesai</span>
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
              Benteng Amanah Digital &bull; Kartu {levelIndex + 1} dari {totalLevels}
            </span>
            <StreakBadge streak={streak} />
            <h2>{level.title}</h2>
          </div>
          <button className="close" onClick={() => { sfx.click(); onExit(); }}>
            <X />
          </button>
        </header>

        <section className="digital-mission">
          <div className="digital-fortress" aria-hidden="true">
            <div className="digital-packet packet-one">{level.isSafe ? 'Ilmu' : 'Link?'}</div>
            <div className="digital-packet packet-two">{principle.icon}</div>
            <div className="digital-packet packet-three">{level.isSafe ? 'Adab' : 'Cek'}</div>
            <div className="digital-tower left" />
            <div className={'digital-gate ' + (revealed ? (wasCorrect ? 'open' : 'alert') : '')}>
              <span>{principle.icon}</span>
            </div>
            <div className="digital-tower right" />
          </div>
          <div className="digital-mission-copy">
            <span className={'digital-principle ' + (level.isSafe ? 'calm' : 'watch')}>
              {level.isSafe ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />} {principle.label}
            </span>
            <h3>{principle.prompt}</h3>
            <p>{principle.description}</p>
            <div className="digital-scanner">
              <span>Mode: {level.isSafe ? 'Buka dengan adab' : 'Periksa dulu'}</span>
              <span>Prinsip: {principle.label}</span>
            </div>
            <div className="digital-progress">
              <span style={{ width: `${progress}%` }} />
            </div>
            <small>{progress}% patroli benteng selesai</small>
          </div>
        </section>

        <div className="digital-preview-row">
          <ModelPreview url={modelUrls.digital} image="/assets/worlds/06_benteng_digital.webp" label="Pulau Digital 3D" />
          <div className="digital-rule-card">
            <b>{principle.ruleTitle}</b>
            <span>{principle.rule}</span>
          </div>
        </div>

        <div className="digital-scenario">
          <span className="shield">
            {level.isSafe ? <ShieldCheck size={28} /> : <ShieldAlert size={28} />}
          </span>
          <p>{level.scenario}</p>
          <small>Apakah sikap ini aman dan sesuai adab digital? Pilih salah satu.</small>
        </div>

        <div className="digital-choices">
          <button className="digital-choice safe" onClick={() => choose(true)} disabled={revealed}>
            <Check size={18} /> Jaga Gerbang
          </button>
          <button className="digital-choice danger" onClick={() => choose(false)} disabled={revealed}>
            <X size={18} /> Tahan Dulu
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

function getDigitalPrinciple(id: string) {
  if (id.includes('password')) {
    return {
      icon: '🔐',
      label: 'Amanah Rahasia',
      prompt: 'Jaga kunci benteng akunmu',
      description: 'Password, OTP, dan akun pribadi tidak dibagikan sembarangan.',
      ruleTitle: 'Prinsip amanah',
      rule: 'Rahasia yang dipercayakan harus dijaga, termasuk rahasia digital.',
    };
  }
  if (id.includes('tabayyun')) {
    return {
      icon: '🔎',
      label: 'Tabayyun',
      prompt: 'Cek kabar sebelum lewat gerbang',
      description: 'Kabar cepat belum tentu benar. Penjaga benteng perlu memeriksa sumbernya.',
      ruleTitle: 'Prinsip tabayyun',
      rule: 'Berhenti sebentar, cek sumber, lalu tanya orang dewasa jika ragu.',
    };
  }
  if (id.includes('comment') || id.includes('group')) {
    return {
      icon: '💬',
      label: 'Lisan Digital',
      prompt: 'Pilih kata yang menenangkan',
      description: 'Komentar dan chat tetap bagian dari lisan yang perlu dijaga.',
      ruleTitle: 'Prinsip berkata baik',
      rule: 'Kalau belum bisa membuat orang lebih baik, jangan kirim kata yang menyakiti.',
    };
  }
  if (id.includes('aib')) {
    return {
      icon: '🛡️',
      label: 'Menjaga Kehormatan',
      prompt: 'Lindungi teman dari rasa malu',
      description: 'Foto dan cerita memalukan tidak boleh dijadikan bahan tertawaan.',
      ruleTitle: 'Prinsip menjaga aib',
      rule: 'Teman yang terjaga kehormatannya akan merasa aman bersama kita.',
    };
  }
  if (id.includes('permission') || id.includes('buy')) {
    return {
      icon: '👨‍👩‍👧',
      label: 'Izin Orang Tua',
      prompt: 'Minta izin sebelum membuka gerbang penting',
      description: 'Akses data dan pembelian digital harus ditemani orang tua.',
      ruleTitle: 'Prinsip izin',
      rule: 'Bertanya dulu adalah tanda anak yang amanah dan bisa dipercaya.',
    };
  }
  if (id.includes('time')) {
    return {
      icon: '⏰',
      label: 'Waktu Berkah',
      prompt: 'Atur waktu agar hati tetap lapang',
      description: 'Game dan video tidak boleh mengalahkan ibadah, belajar, dan istirahat.',
      ruleTitle: 'Prinsip seimbang',
      rule: 'Teknologi membantu kebaikan saat dipakai pada waktunya.',
    };
  }
  if (id.includes('chat')) {
    return {
      icon: '🚪',
      label: 'Batas Aman',
      prompt: 'Jangan bukakan gerbang untuk orang asing',
      description: 'Data pribadi tidak diberikan kepada orang yang tidak dikenal.',
      ruleTitle: 'Prinsip menjaga diri',
      rule: 'Kalau ada chat mencurigakan, tutup dan laporkan ke orang tua.',
    };
  }
  return {
    icon: '🌟',
    label: 'Konten Bermanfaat',
    prompt: 'Pilih cahaya ilmu',
    description: 'Dunia digital bisa menjadi jalan ilmu jika dipilih dengan bijak.',
    ruleTitle: 'Prinsip manfaat',
    rule: 'Gunakan layar untuk hal yang menambah ilmu, akhlak, dan kebaikan.',
  };
}
