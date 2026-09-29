import { ChevronRight, Map, Sparkles, Star, X } from 'lucide-react';
import type { World } from '../data/worlds';

interface OnboardingTourProps {
  step: number;
  selected: World;
  onStep: (step: number) => void;
  onClose: () => void;
  onSelectRecommended: () => void;
}

const copy = [
  {
    title: 'Assalamu’alaikum! Bagaimana kabarnya hari ini?',
    body: 'Bri akan memandu kamu dan merekomendasikan game-game seru yang ada di Brightoria.',
    pill: 'Yuk, kita mulai petualangannya bersama!',
    recommendation: 'Mulai dari Kampung Adab dulu ya, supaya kamu belajar kebiasaan baik sambil bermain.',
  },
  {
    title: 'Pilih pulau yang paling menarik untukmu.',
    body: 'Setiap pulau punya game berbeda: Al-Qur’an, Adab, Numeria, Bahasa Arab, English, dan Digital.',
    pill: 'Ketuk pulau, lalu tekan Mainkan sekarang.',
    recommendation: 'Kalau bingung, Bri sarankan Kampung Adab sebagai pemanasan pertama.',
  },
  {
    title: 'Jangan lupa latihan harian.',
    body: 'Setelah main, buka Menara Latihan untuk mengulang materi yang sudah kamu pelajari.',
    pill: 'Sedikit demi sedikit, kemampuanmu akan tumbuh.',
    recommendation: 'Mode tenang tetap aktif tanpa musik latar, jadi kamu bisa fokus belajar.',
  },
];

export default function OnboardingTour({
  step,
  selected,
  onStep,
  onClose,
  onSelectRecommended,
}: OnboardingTourProps) {
  const index = Math.max(0, Math.min(step, copy.length - 1));
  const item = copy[index];
  const isLast = index === copy.length - 1;

  return (
    <section className="tour-overlay" aria-label="Tutorial Brightoria">
      <div className="tour-top">
        <span className="tour-step">{index + 1} / {copy.length}</span>
        <button className="tour-skip" onClick={onClose}>
          Lewati <ChevronRight size={16} />
        </button>
      </div>

      <img className="tour-bri" src="/assets/onboarding/bri-guide.png" alt="Bri, pemandu Brightoria" />

      <article className="tour-speech">
        <span className="tour-badge">
          <Sparkles size={18} /> Hai, aku Bri!
        </span>
        <h2>{item.title}</h2>
        <p>{item.body}</p>
        <strong>{item.pill}</strong>
      </article>

      <aside className="tour-recommendation">
        <span>
          <Star size={16} fill="currentColor" /> Rekomendasi pertama:
        </span>
        <p>{item.recommendation}</p>
        {index === 0 && (
          <button onClick={onSelectRecommended}>
            Pilih Kampung Adab <Map size={15} />
          </button>
        )}
      </aside>

      <div className="tour-actions">
        <button className="tour-primary" onClick={() => (isLast ? onClose() : onStep(index + 1))}>
          <Sparkles size={18} /> {isLast ? 'Mulai Brightoria' : 'Mulai Tur'} <ChevronRight size={18} />
        </button>
        <button className="tour-secondary" onClick={onClose}>
          Nanti Saja
        </button>
      </div>

      <div className="tour-focus" aria-hidden="true">
        {selected.name}
      </div>
      <button className="tour-close" aria-label="Tutup tutorial" onClick={onClose}>
        <X size={18} />
      </button>
    </section>
  );
}
