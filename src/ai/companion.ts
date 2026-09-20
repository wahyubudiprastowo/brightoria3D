/**
 * companion.ts — Mesin "Web AI" pendamping belajar Brightoria (Patch 38).
 *
 * ====================================================================
 * DUA LAPIS, DAN LAPIS PERTAMA SELALU JALAN TANPA INTERNET
 * ====================================================================
 * LAPIS 1 — HEURISTIK LOKAL (selalu aktif, offline, gratis, privat):
 *   Membaca evidence enam dunia dari localStorage, menyusun profil
 *   belajar (kekuatan, yang perlu dukungan, ritme, materi jatuh tempo),
 *   lalu menghasilkan rekomendasi dan kalimat dukungan yang ditulis
 *   dengan aturan tetap. Tidak ada data anak yang keluar dari
 *   perangkat. Ini yang dipakai secara default.
 *
 * LAPIS 2 — LLM OPSIONAL (mati secara default):
 *   Jika (dan hanya jika) orang tua mengisi endpoint OpenAI-compatible
 *   di Ruang Orang Tua, lapis ini mengirim RINGKASAN ANGKA saja
 *   (mis. "quran 64%, arabic 22%, streak 3 hari") — BUKAN nama anak,
 *   bukan riwayat mentah — untuk dirangkai jadi kalimat motivasi yang
 *   lebih personal. Kalau gagal/timeout, otomatis jatuh ke Lapis 1.
 *
 * ====================================================================
 * KEPUTUSAN KEAMANAN ANAK (disengaja, jangan dilonggarkan tanpa diskusi)
 * ====================================================================
 *   - TIDAK ADA input teks bebas untuk anak. Anak hanya bisa menekan
 *     pertanyaan yang sudah disiapkan. Ini menutup total risiko prompt
 *     injection, konten tidak pantas, dan percakapan tak terarah.
 *   - Endpoint & API key disimpan di localStorage perangkat, tidak
 *     pernah ditulis di kode, tidak pernah dikirim ke mana pun selain
 *     endpoint yang diisi sendiri oleh orang tua.
 *   - Timeout 8 detik. AI tidak boleh membuat anak menunggu.
 *   - Semua pembacaan localStorage dibungkus try/catch.
 * ====================================================================
 */

export interface WorldSnapshot {
  id: string;
  label: string;
  emoji: string;
  mastery: number;
  items: number;
  untouched: boolean;
}

export interface LearnerProfile {
  worlds: WorldSnapshot[];
  overall: number;
  strongest: WorldSnapshot | null;
  weakest: WorldSnapshot | null;
  untouchedCount: number;
  dueToday: number;
  streakDays: number;
  /** Saran tingkat kesulitan berikutnya untuk mesin soal. */
  difficulty: 'ringan' | 'sedang' | 'menantang';
}

interface WorldDef {
  id: string;
  label: string;
  emoji: string;
  key: string;
  items: number;
}

const WORLDS: WorldDef[] = [
  { id: 'quran', label: "Taman Al-Qur'an", emoji: '🕌', key: 'brightoria.evidence.hijaiyah.v1', items: 28 },
  { id: 'adab', label: 'Kampung Adab', emoji: '🤝', key: 'brightoria.evidence.adabStory.v1', items: 8 },
  { id: 'math', label: 'Pulau Numeria', emoji: '🔢', key: 'brightoria.evidence.numeria.v1', items: 5 },
  { id: 'arabic', label: 'Oasis Bahasa Arab', emoji: '🐪', key: 'brightoria.evidence.arabicOasis.v2', items: 17 },
  { id: 'english', label: 'English Harbor', emoji: '⛵', key: 'brightoria.evidence.englishHarbor.v1', items: 12 },
  { id: 'digital', label: 'Benteng Digital', emoji: '🛡️', key: 'brightoria.evidence.digital.v1', items: 5 },
];

function readJson(key: string): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function starsOf(data: Record<string, unknown>): { earned: number; count: number } {
  for (const bucket of ['stops', 'letters', 'islands', 'chapters']) {
    const value = data[bucket];
    if (value && typeof value === 'object') {
      let earned = 0;
      let count = 0;
      for (const entry of Object.values(value as Record<string, unknown>)) {
        if (entry && typeof entry === 'object') {
          const e = entry as Record<string, unknown>;
          const s = typeof e.stars === 'number' ? e.stars : typeof e.bestStars === 'number' ? e.bestStars : 0;
          earned += s;
          count += 1;
        }
      }
      return { earned, count };
    }
  }
  return { earned: 0, count: 0 };
}

function completedOf(data: Record<string, unknown>): number {
  return Array.isArray(data.completed) ? data.completed.length : 0;
}

/** Susun profil belajar dari seluruh data lokal. Murni membaca. */
export function buildProfile(): LearnerProfile {
  const worlds: WorldSnapshot[] = WORLDS.map((def) => {
    const data = readJson(def.key);
    if (!data) {
      return { id: def.id, label: def.label, emoji: def.emoji, mastery: 0, items: def.items, untouched: true };
    }
    const { earned, count } = starsOf(data);
    const done = completedOf(data);
    const maxStars = def.items * 3;
    const mastery =
      count > 0 && maxStars > 0
        ? Math.round((earned / maxStars) * 100)
        : def.items > 0
          ? Math.round((done / def.items) * 100)
          : 0;
    return {
      id: def.id,
      label: def.label,
      emoji: def.emoji,
      mastery: Math.min(100, mastery),
      items: def.items,
      untouched: done === 0 && count === 0,
    };
  });

  const touched = worlds.filter((w) => !w.untouched);
  const overall = touched.length
    ? Math.round(touched.reduce((s, w) => s + w.mastery, 0) / touched.length)
    : 0;
  const sorted = [...touched].sort((a, b) => b.mastery - a.mastery);

  // Streak & materi jatuh tempo dibaca dari kunci milik Patch 34/35.
  let streakDays = 0;
  const activity = readJson('brightoria.activity.v1');
  if (activity && Array.isArray(activity.days)) {
    const days = (activity.days as unknown[]).filter((d): d is string => typeof d === 'string');
    const set = new Set(days);
    const cursor = new Date();
    const key = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (!set.has(key(cursor))) cursor.setDate(cursor.getDate() - 1);
    for (let i = 0; i < 400; i++) {
      if (set.has(key(cursor))) {
        streakDays += 1;
        cursor.setDate(cursor.getDate() - 1);
      } else break;
    }
  }

  let dueToday = 0;
  const review = readJson('brightoria.review.v1');
  if (review && review.items && typeof review.items === 'object') {
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    for (const entry of Object.values(review.items as Record<string, unknown>)) {
      if (entry && typeof entry === 'object') {
        const due = (entry as Record<string, unknown>).due;
        if (typeof due === 'string' && due <= todayKey) dueToday += 1;
      }
    }
  }

  const weakest = sorted.length ? sorted[sorted.length - 1] : null;
  const difficulty: LearnerProfile['difficulty'] =
    overall >= 78 ? 'menantang' : overall >= 45 ? 'sedang' : 'ringan';

  return {
    worlds,
    overall,
    strongest: sorted.length ? sorted[0] : null,
    weakest: weakest && weakest.mastery < 80 ? weakest : null,
    untouchedCount: worlds.filter((w) => w.untouched).length,
    dueToday,
    streakDays,
    difficulty,
  };
}

// ---------------------------------------------------------------------------
// LAPIS 1 — jawaban heuristik (offline, deterministik, ramah anak)
// ---------------------------------------------------------------------------

export type CompanionTopic = 'next' | 'progress' | 'encourage' | 'parent';

export function heuristicAnswer(topic: CompanionTopic, p: LearnerProfile): string {
  const untouched = p.worlds.filter((w) => w.untouched);

  switch (topic) {
    case 'next': {
      if (p.dueToday > 0) {
        return `Ada ${p.dueToday} kata yang siap diulang hari ini. Buka Latihan Harian dulu — cuma sebentar, tapi bikin ingatanmu kuat!`;
      }
      if (untouched.length > 0) {
        const next = untouched[0];
        return `${next.emoji} ${next.label} belum pernah kamu jelajahi. Yuk mulai dari sana — dunia baru selalu seru!`;
      }
      if (p.weakest) {
        return `${p.weakest.emoji} ${p.weakest.label} baru ${p.weakest.mastery}%. Main satu level lagi di sana, pasti naik!`;
      }
      return 'Semua dunia sudah kamu kuasai dengan baik. Coba mode Ekspedisi untuk tantangan menjelajah!';
    }
    case 'progress': {
      if (p.overall === 0) return 'Petualanganmu baru mulai. Selesaikan satu misi, nanti aku tunjukkan progresmu di sini!';
      const strong = p.strongest ? `${p.strongest.emoji} ${p.strongest.label} (${p.strongest.mastery}%)` : '-';
      return `Rata-rata penguasaanmu ${p.overall}%. Yang paling kuat: ${strong}. Kamu sudah main ${p.streakDays} hari berturut-turut!`;
    }
    case 'encourage': {
      if (p.streakDays >= 3) return `Hebat! ${p.streakDays} hari berturut-turut belajar. Itu namanya konsisten — terus begini ya! 🌟`;
      if (p.overall >= 60) return 'Kamu sudah jauh lebih paham dibanding awal. Pelan-pelan tapi terus jalan itu yang penting! 💪';
      return 'Setiap kali kamu mencoba, otakmu tumbuh sedikit. Salah itu bagian dari belajar, bukan kegagalan! 🌱';
    }
    case 'parent': {
      if (p.overall === 0) return 'Belum ada data belajar. Ajak ananda memilih satu pulau untuk dijelajahi bersama hari ini.';
      if (p.untouchedCount > 0) {
        return `Ananda belum menyentuh ${p.untouchedCount} dunia. Mencoba bidang baru membantu menyeimbangkan kemampuan.`;
      }
      if (p.weakest) {
        return `${p.weakest.label} berada di ${p.weakest.mastery}% — bidang ini paling membutuhkan pendampingan. Mengulang beberapa level bersama akan sangat membantu.`;
      }
      return `Perkembangan merata di semua pulau (rata-rata ${p.overall}%). Ini saat yang tepat untuk materi lanjutan.`;
    }
  }
}

// ---------------------------------------------------------------------------
// LAPIS 2 — LLM opsional (OpenAI-compatible), mati secara default
// ---------------------------------------------------------------------------

export interface AiConfig {
  endpoint: string;
  model: string;
  apiKey: string;
  enabled: boolean;
}

const CONFIG_KEY = 'brightoria.ai.config.v1';

export function loadAiConfig(): AiConfig {
  const empty: AiConfig = { endpoint: '', model: '', apiKey: '', enabled: false };
  const data = readJson(CONFIG_KEY);
  if (!data) return empty;
  return {
    endpoint: typeof data.endpoint === 'string' ? data.endpoint : '',
    model: typeof data.model === 'string' ? data.model : '',
    apiKey: typeof data.apiKey === 'string' ? data.apiKey : '',
    enabled: data.enabled === true,
  };
}

export function saveAiConfig(config: AiConfig): void {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch {
    // no-op
  }
}

const SYSTEM_PROMPT = [
  'Kamu adalah "Bri", pendamping belajar untuk anak usia 6-12 tahun di aplikasi Brightoria.',
  'Aturan wajib:',
  '- Jawab dalam Bahasa Indonesia yang sangat sederhana, maksimal 2 kalimat pendek.',
  '- Nada hangat, menyemangati, tidak pernah menghakimi atau membandingkan dengan anak lain.',
  '- Jangan pernah menyebut angka sebagai nilai/rapor; sebut sebagai progres petualangan.',
  '- Jangan membahas topik di luar belajar di aplikasi ini.',
  '- Jangan pernah meminta data pribadi apa pun.',
].join('\n');

/**
 * Minta kalimat dari LLM. Mengirim HANYA ringkasan angka, tanpa
 * identitas. Selalu mengembalikan string — jika gagal, pemanggil
 * memakai heuristicAnswer sebagai gantinya.
 */
export async function askLlm(
  topic: CompanionTopic,
  p: LearnerProfile,
  config: AiConfig,
): Promise<string | null> {
  if (!config.enabled || !config.endpoint || !config.model) return null;

  const summary = p.worlds
    .map((w) => `${w.id}:${w.untouched ? 'belum' : w.mastery + '%'}`)
    .join(', ');
  const question =
    topic === 'next'
      ? 'Apa yang sebaiknya aku mainkan berikutnya?'
      : topic === 'progress'
        ? 'Bagaimana perkembangan belajarku?'
        : topic === 'encourage'
          ? 'Beri aku semangat!'
          : 'Ringkasan untuk orang tua.';

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 8000);

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (config.apiKey) headers.Authorization = `Bearer ${config.apiKey}`;

    const response = await fetch(config.endpoint.replace(/\/+$/, '') + '/chat/completions', {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        model: config.model,
        temperature: 0.7,
        max_tokens: 120,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Progres petualangan: ${summary}. Streak ${p.streakDays} hari. ${p.dueToday} materi siap diulang. Pertanyaan: ${question}`,
          },
        ],
      }),
    });

    if (!response.ok) return null;
    const json: unknown = await response.json();
    const choices = (json as { choices?: Array<{ message?: { content?: string } }> }).choices;
    const text = choices && choices[0] && choices[0].message ? choices[0].message.content : null;
    return typeof text === 'string' && text.trim().length > 0 ? text.trim() : null;
  } catch {
    return null;
  } finally {
    window.clearTimeout(timer);
  }
}

/** API utama: selalu memberi jawaban, LLM hanya bonus. */
export async function ask(topic: CompanionTopic): Promise<{ text: string; source: 'lokal' | 'ai' }> {
  const profile = buildProfile();
  const config = loadAiConfig();
  const llm = await askLlm(topic, profile, config);
  if (llm) return { text: llm, source: 'ai' };
  return { text: heuristicAnswer(topic, profile), source: 'lokal' };
}
