import { useCallback, useEffect, useState } from 'react';
import {
  BookOpen,
  ChevronRight,
  Gamepad2,
  Home,
  LockKeyhole,
  Map,
  ShieldCheck,
  Sparkles,
  Target,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';
import WorldScene from './components/WorldScene';
import OnboardingTour from './components/OnboardingTour';
import { worlds, type World } from './data/worlds';
import { initialProgress, loadProgress, addXp, type Progress } from './game/progress';
import { AdminPortal } from './admin/AdminPortal';

// --- Numeria (3D arithmetic bridge) ---
import NumeriaGame from './game/numeria/NumeriaGame';
import { numeriaLevels } from './game/numeria/levels';
import { computeMastery as numeriaMasteryFn, loadEvidence as numeriaLoad } from './game/numeria/evidence';

// --- Digital (cyber safety sort) ---
import DigitalGame from './game/digital/DigitalGame';
import { digitalLevels } from './game/digital/levels';
import { computeMastery as digitalMasteryFn, loadEvidence as digitalLoad } from './game/digital/evidence';

// --- Quiz-based games (shared engine) ---
import QuranGame from './game/quran/QuranGame';
import { quranLevels } from './game/quran/levels';
import { computeMastery as quranMasteryFn, loadEvidence as quranLoad } from './game/quran/evidence';

import AdabGame from './game/adab/AdabGame';
import { adabLevels } from './game/adab/levels';
// Sumber kebenaran jumlah bab Adab. adabLevels berisi 6 soal kuis lama,
// sedangkan AdabGame sesungguhnya melacak 8 bab cerita di scenarios.ts.
// Memakai adabLevels.length sebagai pembagi membuat mastery tembus 100%.
import { chapters as adabChapters } from './game/adab/scenarios';
import { computeMastery as adabMasteryFn, loadEvidence as adabLoad } from './game/adab/evidence';

import ArabicGame from './game/arabic/ArabicGame';
import { arabicLevels } from './game/arabic/levels';
import { computeMastery as arabicMasteryFn, loadEvidence as arabicLoad } from './game/arabic/evidence';

import EnglishGame from './game/english/EnglishGame';
import { englishLevels } from './game/english/levels';
import { computeMastery as englishMasteryFn, loadEvidence as englishLoad } from './game/english/evidence';

// --- Semua 6 dunia sudah punya game sungguhan (Patch 07) ---

/** Baca evidence dari semua dunia, kembalikan mastery per world. */
function withDynamicMastery(base: World[]): World[] {
  const m: Record<string, number> = {};
  const qEvidence = quranLoad();
  if (qEvidence.completed.length > 0) m.quran = quranMasteryFn(qEvidence, quranLevels.length);
  const aEvidence = adabLoad();
  if (aEvidence.completed.length > 0) m.adab = adabMasteryFn(aEvidence, adabChapters.length);
  const nEvidence = numeriaLoad();
  if (nEvidence.completed.length > 0) m.math = numeriaMasteryFn(nEvidence, numeriaLevels.length);
  const rEvidence = arabicLoad();
  if (rEvidence.completed.length > 0) m.arabic = arabicMasteryFn(rEvidence, arabicLevels.length);
  const eEvidence = englishLoad();
  if (eEvidence.completed.length > 0) m.english = englishMasteryFn(eEvidence, englishLevels.length);
  const dEvidence = digitalLoad();
  if (dEvidence.completed.length > 0) m.digital = digitalMasteryFn(dEvidence, digitalLevels.length);

  return base.map((w) => (m[w.id] !== undefined ? { ...w, mastery: m[w.id] } : w));
}

/** Tujuan belajar yang tampil di misi card dunia masing-masing. */
const objectiveText: Record<string, string> = {
  quran: 'Kenali huruf hijaiyah dan harakat dasar: fathah, kasrah, dammah.',
  adab: 'Nilai kebiasaan sehari-hari dan pelajari adab yang benar.',
  math: 'Sambungkan jembatan operasi hitung: tambah, kurang, dan kali.',
  arabic: 'Tebak arti kosakata Arab sehari-hari.',
  english: 'Cocokkan kata Inggris dengan artinya.',
  digital: 'Nilai situasi online: aman atau tidak aman.',
};

const TOUR_KEY = 'brightoria.onboarding.v1';

function isAdminRoute(): boolean {
  if (typeof window === 'undefined') return false;
  const hash = window.location.hash.toLowerCase();
  return hash === '#/admin' || hash === '#admin';
}

export default function App() {
  const [worldList, setWorldList] = useState<World[]>(worlds);
  const [selected, setSelected] = useState<World>(worlds[0]);
  const [mode, setMode] = useState<'child' | 'parent'>('child');
  const [panel, setPanel] = useState(false);
  const [game, setGame] = useState<string | null>(null);
  const [progress, setProgress] = useState<Progress>(initialProgress);
  const [tourStep, setTourStep] = useState(0);
  const [showTour, setShowTour] = useState(false);
  const [adminOpen, setAdminOpen] = useState(isAdminRoute);

  useEffect(() => {
    setProgress(loadProgress());
    setWorldList(withDynamicMastery(worlds));
    try {
      setShowTour(localStorage.getItem(TOUR_KEY) !== 'done');
    } catch {
      setShowTour(true);
    }
  }, []);

  const openAdmin = useCallback(() => {
    setAdminOpen(true);
    if (!isAdminRoute()) window.location.hash = '/admin';
  }, []);

  const closeAdmin = useCallback(() => {
    setAdminOpen(false);
    if (isAdminRoute()) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, []);

  useEffect(() => {
    const syncAdminRoute = () => setAdminOpen(isAdminRoute());
    const openFromShortcut = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'a') {
        event.preventDefault();
        openAdmin();
      }
    };
    window.addEventListener('hashchange', syncAdminRoute);
    window.addEventListener('keydown', openFromShortcut);
    return () => {
      window.removeEventListener('hashchange', syncAdminRoute);
      window.removeEventListener('keydown', openFromShortcut);
    };
  }, [openAdmin]);

  function refreshMastery() {
    setWorldList(withDynamicMastery(worlds));
  }

  /** Buka game sungguhan sesuai dunia terpilih. Semua dunia punya game. */
  function enterWorld() {
    setGame(selected.id);
  }

  function exitGame() {
    setGame(null);
    refreshMastery();
  }

  function handleXpEarned(amount: number) {
    setProgress(addXp(amount));
  }

  function closeTour() {
    setShowTour(false);
    try {
      localStorage.setItem(TOUR_KEY, 'done');
    } catch {
      /* localStorage can be unavailable in embedded previews. */
    }
  }

  function selectRecommendedWorld() {
    const recommended = worldList.find((w) => w.id === 'adab') ?? worlds.find((w) => w.id === 'adab');
    if (!recommended) return;
    setSelected(recommended);
    setPanel(true);
  }

  return (
    <main className="adventure-shell">
      <header>
        <div className="brand">
          <div className="mark">
            <Sparkles />
          </div>
          <div>
            <strong>Brightoria</strong>
            <small>by Bright Academy</small>
          </div>
        </div>
        <div className="xp">
          <span>LEVEL {progress.level}</span>
          <b>{progress.xp} XP</b>
        </div>
        <div className="mode">
          <button className={mode === 'child' ? 'chosen' : ''} onClick={() => setMode('child')}>
            Anak
          </button>
          <button className={mode === 'parent' ? 'chosen' : ''} onClick={() => setMode('parent')}>
            <LockKeyhole size={14} /> Orang Tua
          </button>
        </div>
      </header>

      {mode === 'child' ? (
        <>
          <section className="hero">
            <div>
              <span className="eyebrow">
                <Sparkles size={15} /> Petualangan hari ini
              </span>
              <h1>
                Dunia tumbuh bersama
                <br />
                <em>kemampuanmu.</em>
              </h1>
              <p>Putar peta, jelajahi pulau, dan selesaikan tantangan interaktif.</p>
              <div className="quick">
                <span>
                  <Target /> 3 misi hari ini
                </span>
                <span>
                  <ShieldCheck /> Mode tenang tanpa musik
                </span>
              </div>
            </div>
            <div className="streak">
              <b>4</b>
              <span>hari bertumbuh</span>
            </div>
          </section>

          <section className="world">
            <WorldScene
              worlds={worldList}
              selected={selected}
              onSelect={(w) => {
                setSelected(w);
                setPanel(true);
              }}
            />
            <div className="compass">
              <Map />
              <span>Geser untuk memutar &bull; cubit/scroll untuk zoom &bull; ketuk pulau</span>
            </div>
          </section>

          <aside className={'mission-card ' + (panel ? 'open' : '')}>
            <button className="close" aria-label="Tutup pilihan pulau" onClick={() => setPanel(false)}>
              <X />
            </button>

            <div className="island-card-art" aria-hidden="true">
              <img src={selected.image} alt="" />
            </div>

            <span className="chip chip-game">
                <Gamepad2 size={12} /> Game tersedia
              </span>

            <h2>{selected.name}</h2>
            <p>{selected.subtitle}</p>
            <div className="progress">
              <i style={{ width: selected.mastery + '%' }} />
            </div>
            <div className="stats">
              <span>
                <b>{selected.mastery}%</b> mastery
              </span>
              <span>
                <b>{selected.missions}</b> misi
              </span>
            </div>
            <div className="objective">
              <Target />
              <div>
                <b>{objectiveText[selected.id] ?? 'Tantangan interaktif'}</b>
                <small>Progres dan XP tersimpan otomatis. Jawaban benar pertama memberi +30 XP.</small>
              </div>
            </div>
            <button className="primary" onClick={enterWorld}>
              Mainkan sekarang <ChevronRight />
            </button>
          </aside>

          {game === 'math' && <NumeriaGame onExit={exitGame} onXpEarned={handleXpEarned} />}
          {game === 'digital' && <DigitalGame onExit={exitGame} onXpEarned={handleXpEarned} />}
          {game === 'quran' && <QuranGame onExit={exitGame} onXpEarned={handleXpEarned} />}
          {game === 'adab' && <AdabGame onExit={exitGame} onXpEarned={handleXpEarned} />}
          {game === 'arabic' && <ArabicGame onExit={exitGame} onXpEarned={handleXpEarned} />}
          {game === 'english' && <EnglishGame onExit={exitGame} onXpEarned={handleXpEarned} />}
          {showTour && !game && (
            <OnboardingTour
              step={tourStep}
              selected={selected}
              onStep={setTourStep}
              onClose={closeTour}
              onSelectRecommended={selectRecommendedWorld}
            />
          )}
        </>
      ) : (
        <Parent
          worlds={worldList}
          onOpenAdmin={openAdmin}
          onReplay={(id) => {
            const w = worlds.find((x) => x.id === id);
            if (w) {
              setSelected(w);
              setMode('child');
            }
          }}
        />
      )}

      <nav>
        <button onClick={() => setMode('child')}>
          <Home />
          <span>Beranda</span>
        </button>
        <button onClick={() => setMode('child')}>
          <BookOpen />
          <span>Petualangan</span>
        </button>
        <button onClick={() => setMode('parent')}>
          <UsersRound />
          <span>Orang Tua</span>
        </button>
        <button onClick={() => window.dispatchEvent(new Event('brightoria:open-character-picker'))}>
          <UserRound />
          <span>Profil</span>
        </button>
      </nav>
      <AdminPortal open={adminOpen} onClose={closeAdmin} />
    </main>
  );
}

function Parent({
  worlds: worldList,
  onReplay,
  onOpenAdmin,
}: {
  worlds: World[];
  onReplay: (id: string) => void;
  onOpenAdmin: () => void;
}) {
  // Kumpulkan evidence & mastery semua dunia
  const all = [
    { id: 'quran', ev: quranLoad(), total: quranLevels.length, masterFn: quranMasteryFn, label: 'Hijaiyah & harakat' },
    { id: 'adab', ev: adabLoad(), total: adabChapters.length, masterFn: adabMasteryFn, label: 'Adab sehari-hari' },
    { id: 'math', ev: numeriaLoad(), total: numeriaLevels.length, masterFn: numeriaMasteryFn, label: 'Operasi hitung' },
    { id: 'arabic', ev: arabicLoad(), total: arabicLevels.length, masterFn: arabicMasteryFn, label: 'Kosakata Arab' },
    { id: 'english', ev: englishLoad(), total: englishLevels.length, masterFn: englishMasteryFn, label: 'Kosakata Inggris' },
    { id: 'digital', ev: digitalLoad(), total: digitalLevels.length, masterFn: digitalMasteryFn, label: 'Keamanan digital' },
  ];

  const started = all.filter((x) => x.ev.completed.length > 0).map((x) => ({
    world: worldList.find((w) => w.id === x.id)!,
    mastery: (x.masterFn as (e: any, total: number) => number)(x.ev, x.total),
    label: x.label,
  }));

  const avg = started.length
    ? Math.round(started.reduce((s, x) => s + x.mastery, 0) / started.length)
    : 0;

  // Dunia dengan mastery terendah tapi sudah pernah dimulai -> rekomendasi dukungan
  const lowest = started.length ? [...started].sort((a, b) => a.mastery - b.mastery)[0] : null;

  return (
    <section className="parent">
      <div className="parent-head">
        <div>
          <span className="eyebrow">Ruang Orang Tua</span>
          <h1>Perkembangan Alya</h1>
          <p>Penjelasan kemampuan, bukan hanya angka.</p>
        </div>
        <div className="parent-head-actions">
          <button className="outline">Ganti profil anak</button>
          <button className="outline parent-admin-button" onClick={onOpenAdmin}><ShieldCheck size={16} /> Portal Admin</button>
        </div>
      </div>
      <div className="grid">
        <article className="summary">
          <span>Mastery rata-rata</span>
          <b>{avg}%</b>
          <div className="progress">
            <i style={{ width: avg + '%' }} />
          </div>
          <small>Dari {started.length} dari 6 dunia yang sudah dimulai</small>
        </article>
        <article className="wide">
          <Target />
          <h3>Kekuatan</h3>
          {started.length ? (
            <ul className="insights">
              {[...started]
                .sort((a, b) => b.mastery - a.mastery)
                .slice(0, 3)
                .map((x) => (
                  <li key={x.world.id}>
                    <b>{x.world.name}</b> — {x.mastery}% mastery
                    <small>{x.label}</small>
                  </li>
                ))}
            </ul>
          ) : (
            <p>Mulai misi pertama di dunia mana pun untuk melihat insight di sini.</p>
          )}
        </article>
        <article>
          <Sparkles />
          <h3>Perlu dukungan</h3>
          {lowest ? (
            <p>
              {lowest.world.name} saat ini di {lowest.mastery}% mastery. Lanjutkan latihan{' '}
              {lowest.label.toLowerCase()} dengan cara yang menyenangkan.
            </p>
          ) : (
            <p>Belum ada data. Ajak Alya memainkan misi pertama, lalu pantau di sini.</p>
          )}
        </article>
        <article className="wide">
          <div>
            <Target />
            <h3>Rekomendasi transparan</h3>
            <p>
              {lowest
                ? `Rekomendasi: mainkan ulang ${lowest.world.name} untuk menaikkan mastery dari ${lowest.mastery}%. Bila tetap di bawah 70% setelah 3 sesi, orang tua dapat memesan 1-on-1.`
                : 'Selesaikan misi pertama di dunia mana pun untuk menerima rekomendasi otomatis.'}
            </p>
          </div>
          {lowest && (
            <button className="primary" onClick={() => onReplay(lowest.world.id)}>
              Mainkan sekarang
            </button>
          )}
        </article>
      </div>
      <h2>Pilih ritme keluarga</h2>
      <div className="paths">
        <button>
          <b>Mandiri</b>
          <span>Game interaktif dan parent insight</span>
        </button>
        <button>
          <b>1-on-1</b>
          <span>Per sesi atau paket 4 sesi via Zoom</span>
        </button>
        <button>
          <b>Homeschool</b>
          <span>Program Bright Academy dan jalur resmi</span>
        </button>
      </div>
    </section>
  );
}
