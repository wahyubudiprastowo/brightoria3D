import { useEffect, useRef, useState } from 'react';

/**
 * Brightoria "Juice Kit" — Patch 10.
 *
 * Kumpulan primitif game-feel yang dipakai ULANG di semua mini-game
 * (QuizGame/Quran/Adab/English, NumeriaGame, DigitalGame, ArabicGame).
 * Terinspirasi prinsip umum "game juice" / polish pass (partikel umpan
 * balik, animasi punch, count-up angka, indikator streak) — TANPA
 * menambah dependency baru, TANPA musik latar, dan TANPA mengubah
 * kontrak evidence/mastery/XP yang sudah ada di masing-masing game.
 *
 * Semua efek di sini bersifat DEKORATIF MURNI: jika dihapus, gameplay
 * inti (evidence, mastery, XP) tetap identik. Ini penting supaya juice
 * kit tidak pernah menjadi satu-satunya jalan untuk lulus/gagal.
 */

// ---------------------------------------------------------------------------
// Confetti — partikel 2D ringan berbasis <canvas>, tanpa library eksternal.
// Dipakai untuk merayakan jawaban benar pertama kali dan penyelesaian dunia.
// ---------------------------------------------------------------------------

interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  spin: number;
  life: number;
  maxLife: number;
}

const CONFETTI_COLORS = ['#f3c861', '#198576', '#a91842', '#9ed8ff', '#ffffff'];

export function Confetti({
  trigger,
  burst = 26,
  origin = 'top',
}: {
  /** Ubah nilai ini (mis. increment counter) setiap kali ingin memicu ledakan baru. */
  trigger: number;
  burst?: number;
  origin?: 'top' | 'center';
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<ConfettiParticle[]>([]);
  const rafRef = useRef<number>(0);
  const reducedMotion = useRef(false);

  useEffect(() => {
    reducedMotion.current =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
  }, []);

  useEffect(() => {
    if (trigger === 0) return; // jangan meledak saat mount pertama
    if (reducedMotion.current) return; // hormati preferensi aksesibilitas
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    const width = parent?.clientWidth ?? canvas.clientWidth ?? 300;
    const height = parent?.clientHeight ?? canvas.clientHeight ?? 200;
    canvas.width = width;
    canvas.height = height;

    const originX = width / 2;
    const originY = origin === 'top' ? height * 0.12 : height / 2;

    for (let i = 0; i < burst; i++) {
      const angle = (Math.PI * 2 * i) / burst + Math.random() * 0.6;
      const speed = 2.2 + Math.random() * 3.2;
      particlesRef.current.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2.5,
        size: 4 + Math.random() * 5,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        rotation: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.4,
        life: 0,
        maxLife: 55 + Math.random() * 25,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    function frame() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life += 1;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.14; // gravitasi ringan
        p.rotation += p.spin;
        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
          continue;
        }
        const alpha = 1 - p.life / p.maxLife;
        ctx.save();
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }
      rafRef.current = requestAnimationFrame(frame);
    }
    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return <canvas ref={canvasRef} className="juice-confetti" aria-hidden="true" />;
}

// ---------------------------------------------------------------------------
// Animated XP — angka XP melompat naik (count-up tween) alih-alih instan.
// ---------------------------------------------------------------------------

export function useCountUp(target: number, durationMs = 500): number {
  const [display, setDisplay] = useState(target);
  const fromRef = useRef(target);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const from = fromRef.current;
    if (from === target) return;
    startRef.current = null;

    function step(ts: number) {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const t = Math.min(1, elapsed / durationMs);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setDisplay(Math.round(from + (target - from) * eased));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        fromRef.current = target;
      }
    }
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, durationMs]);

  return display;
}

// ---------------------------------------------------------------------------
// Streak — penghitung jawaban benar berturut-turut DI DALAM SATU SESI.
// Bersifat murni motivasional (tidak memengaruhi mastery/XP resmi), reset
// otomatis begitu ada jawaban yang salah. Tidak disimpan lintas sesi supaya
// tidak menambah kontrak evidence baru.
// ---------------------------------------------------------------------------

export function useStreak() {
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);

  function register(correct: boolean) {
    setStreak((prev) => {
      const nextValue = correct ? prev + 1 : 0;
      setBest((b) => Math.max(b, nextValue));
      return nextValue;
    });
  }

  function reset() {
    setStreak(0);
  }

  return { streak, best, register, reset };
}

export function StreakBadge({ streak }: { streak: number }) {
  if (streak < 2) return null;
  return (
    <span className="juice-streak" role="status">
      🔥 {streak}x beruntun
    </span>
  );
}

// ---------------------------------------------------------------------------
// Punch class helper — mengembalikan className tambahan untuk animasi
// "punch" singkat (scale bounce) yang otomatis hilang sendiri.
// ---------------------------------------------------------------------------

export function usePunch<T extends string>(keyDependency: T | number | boolean) {
  const [punching, setPunching] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setPunching(true);
    const t = setTimeout(() => setPunching(false), 320);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyDependency]);

  return punching ? 'juice-punch' : '';
}
