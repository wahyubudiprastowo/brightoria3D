import { useEffect, useState, type ReactNode } from 'react';
import { ask, buildProfile, loadAiConfig, saveAiConfig, type AiConfig, type CompanionTopic } from './companion';

/**
 * AiCompanion.tsx — Panel "Tanya Bri" yang memasang dirinya sendiri (Patch 38).
 *
 * Mengikuti pola self-mounting ParentInsight.tsx / DailyPractice.tsx:
 * cukup SATU baris import di src/main.tsx, tanpa mengubah App.tsx.
 *
 * ANAK hanya melihat 3 tombol pertanyaan siap pakai (tanpa input teks
 * bebas — lihat catatan keamanan di companion.ts).
 * ORANG TUA punya satu tab tambahan untuk menyambungkan LLM sendiri
 * (endpoint OpenAI-compatible), yang secara default MATI.
 */

type ReactRoot = { render: (node: ReactNode) => void; unmount: () => void };

const STYLE_ID = 'brightoria-ai-companion-v1';

const GAME_OVERLAY_SELECTORS = [
  '.oasis-overlay', '.hijaiyah-overlay', '.harbor-overlay', '.adab-overlay',
  '.numeria-overlay', '.digital-overlay', '.quiz-overlay', '.bpi-overlay',
  '.bdp-overlay', '.exp-overlay',
].join(', ');

const CSS = `
.bai-fab {
  position: fixed; right: 16px; bottom: 200px; z-index: 60;
  display: inline-flex; align-items: center; gap: 8px;
  padding: 11px 17px; border: 2px solid #d9b6f0; border-radius: 999px;
  background: linear-gradient(160deg,#f6ecff,#e7d3fa); color: #5b3080;
  font-size: 12px; font-weight: 900; font-family: inherit;
  box-shadow: 0 8px 20px rgba(90,40,130,0.22); cursor: pointer;
}
.bai-fab:active { transform: scale(0.96); }
.bai-fab[hidden] { display: none !important; }
.bai-overlay { position: fixed; inset: 0; z-index: 92; background: linear-gradient(160deg,#241a33ee,#1a2b33ee); backdrop-filter: blur(10px); display: grid; place-items: center; padding: 16px; }
.bai-shell { width: min(520px,96vw); max-height: 92vh; overflow-y: auto; background: #fffdf9; border-radius: 28px; padding: 24px; box-shadow: 0 25px 80px #0007; border-top: 6px solid #8b5ab5; display: flex; flex-direction: column; gap: 14px; }
.bai-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
.bai-head h2 { margin: 4px 0 0; font-size: 21px; color: #3a2348; }
.bai-kicker { font-size: 10px; font-weight: 900; letter-spacing: 0.12em; text-transform: uppercase; color: #8b5ab5; }
.bai-close { border: 0; background: #f1e6fa; border-radius: 50%; width: 40px; height: 40px; display: grid; place-items: center; cursor: pointer; color: #5b3080; font-size: 18px; flex-shrink: 0; }
.bai-bubble { display: flex; gap: 12px; align-items: flex-start; background: linear-gradient(160deg,#f6ecff,#efe0fb); border: 1px solid #dfc7f2; border-radius: 20px; padding: 16px; }
.bai-avatar { width: 46px; height: 46px; border-radius: 50%; flex-shrink: 0; background: radial-gradient(circle at 35% 30%, #ffd35c, #8a1236); box-shadow: 0 4px 12px rgba(138,18,54,0.3); }
.bai-text { font-size: 14px; line-height: 1.65; color: #3a2348; }
.bai-source { display: inline-block; margin-top: 6px; font-size: 9px; font-weight: 900; letter-spacing: 0.08em; text-transform: uppercase; color: #8b5ab5; background: #fff; border-radius: 999px; padding: 3px 9px; }
.bai-actions { display: grid; grid-template-columns: 1fr; gap: 9px; }
.bai-ask { border: 2px solid #e4d3f3; background: #fff; border-radius: 16px; padding: 13px 16px; font-size: 14px; font-weight: 700; color: #3a2348; cursor: pointer; text-align: left; font-family: inherit; min-height: 50px; }
.bai-ask:hover { border-color: #b98fdc; transform: translateY(-2px); }
.bai-ask:disabled { opacity: 0.5; cursor: wait; }
.bai-tabs { display: flex; gap: 8px; }
.bai-tab { flex: 1; border: 1px solid #e4d3f3; background: #fff; border-radius: 12px; padding: 9px; font-size: 12px; font-weight: 800; color: #6b4a85; cursor: pointer; font-family: inherit; }
.bai-tab.on { background: #8b5ab5; color: #fff; border-color: #8b5ab5; }
.bai-field { display: flex; flex-direction: column; gap: 4px; font-size: 11px; color: #6b4a85; }
.bai-field input { border: 1px solid #e0cdf0; border-radius: 10px; padding: 9px 11px; font-size: 13px; font-family: inherit; }
.bai-note { font-size: 10px; color: #8a7a95; line-height: 1.6; border-top: 1px dashed #e4d7f0; padding-top: 11px; }
.bai-save { border: 0; background: linear-gradient(135deg,#8b5ab5,#5b3080); color: #fff; padding: 12px; border-radius: 14px; font-weight: 900; cursor: pointer; font-family: inherit; }
@media (max-width: 700px) { .bai-fab { bottom: 192px; right: 12px; padding: 10px 14px; } .bai-shell { padding: 18px; border-radius: 22px; } }
`;

const QUESTIONS: { topic: CompanionTopic; label: string }[] = [
  { topic: 'next', label: '🧭 Aku harus main apa sekarang?' },
  { topic: 'progress', label: '📈 Bagaimana perkembanganku?' },
  { topic: 'encourage', label: '💪 Beri aku semangat!' },
];

function Panel({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<'anak' | 'ortu'>('anak');
  const [message, setMessage] = useState('Halo! Aku Bri. Mau tanya apa hari ini?');
  const [source, setSource] = useState<'lokal' | 'ai' | null>(null);
  const [busy, setBusy] = useState(false);
  const [config, setConfig] = useState<AiConfig>(() => loadAiConfig());

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function handleAsk(topic: CompanionTopic) {
    setBusy(true);
    setMessage('Sebentar ya, aku lihat dulu petualanganmu...');
    setSource(null);
    try {
      const result = await ask(topic);
      setMessage(result.text);
      setSource(result.source);
    } catch {
      setMessage('Maaf, aku belum bisa menjawab sekarang. Coba lagi sebentar lagi ya!');
      setSource('lokal');
    } finally {
      setBusy(false);
    }
  }

  const profile = buildProfile();

  return (
    <div className="bai-overlay" onClick={onClose}>
      <div className="bai-shell" onClick={(e) => e.stopPropagation()}>
        <div className="bai-head">
          <div>
            <span className="bai-kicker">Pendamping Belajar</span>
            <h2>Tanya Bri</h2>
          </div>
          <button className="bai-close" onClick={onClose} aria-label="Tutup">×</button>
        </div>

        <div className="bai-tabs">
          <button className={'bai-tab' + (tab === 'anak' ? ' on' : '')} onClick={() => setTab('anak')}>Untuk Anak</button>
          <button className={'bai-tab' + (tab === 'ortu' ? ' on' : '')} onClick={() => setTab('ortu')}>Orang Tua</button>
        </div>

        {tab === 'anak' ? (
          <>
            <div className="bai-bubble">
              <div className="bai-avatar" />
              <div>
                <div className="bai-text">{message}</div>
                {source && <span className="bai-source">{source === 'ai' ? 'AI terhubung' : 'Pendamping lokal'}</span>}
              </div>
            </div>
            <div className="bai-actions">
              {QUESTIONS.map((q) => (
                <button key={q.topic} className="bai-ask" disabled={busy} onClick={() => handleAsk(q.topic)}>
                  {q.label}
                </button>
              ))}
            </div>
            <p className="bai-note">
              Bri hanya menjawab pertanyaan yang sudah disiapkan. Tidak ada kolom ketik bebas — ini disengaja
              supaya percakapan selalu aman dan terarah untuk anak.
            </p>
          </>
        ) : (
          <>
            <div className="bai-bubble">
              <div className="bai-avatar" />
              <div className="bai-text">{profile ? (message === 'Halo! Aku Bri. Mau tanya apa hari ini?' ? 'Tekan tombol di bawah untuk ringkasan perkembangan ananda.' : message) : ''}</div>
            </div>
            <button className="bai-ask" disabled={busy} onClick={() => handleAsk('parent')}>
              📋 Ringkasan perkembangan ananda
            </button>

            <div className="bai-field">
              <label htmlFor="bai-endpoint">Endpoint AI (opsional, OpenAI-compatible)</label>
              <input
                id="bai-endpoint"
                placeholder="https://llm.contoh.id/v1"
                value={config.endpoint}
                onChange={(e) => setConfig({ ...config, endpoint: e.target.value })}
              />
            </div>
            <div className="bai-field">
              <label htmlFor="bai-model">Nama model</label>
              <input
                id="bai-model"
                placeholder="qwen3-soc / gpt-4o-mini / llama3"
                value={config.model}
                onChange={(e) => setConfig({ ...config, model: e.target.value })}
              />
            </div>
            <div className="bai-field">
              <label htmlFor="bai-key">API key (boleh dikosongkan untuk gateway lokal)</label>
              <input
                id="bai-key"
                type="password"
                value={config.apiKey}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
              />
            </div>
            <label className="bai-field" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
              />
              Aktifkan jawaban dari AI
            </label>
            <button
              className="bai-save"
              onClick={() => {
                saveAiConfig(config);
                setMessage('Pengaturan AI tersimpan di perangkat ini.');
                setSource('lokal');
              }}
            >
              Simpan pengaturan
            </button>

            <p className="bai-note">
              Tanpa endpoint, Bri tetap berfungsi penuh memakai pendamping lokal (offline, tanpa mengirim data
              ke mana pun). Jika endpoint diaktifkan, yang dikirim HANYA ringkasan angka progres
              (mis. &quot;quran:64%&quot;) — tanpa nama, tanpa riwayat jawaban, tanpa identitas apa pun.
              Kunci API disimpan hanya di perangkat ini.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

declare global {
  interface Window {
    __brtAiCompanionInit?: boolean;
  }
}

function mountCompanion() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__brtAiCompanionInit) return;
  window.__brtAiCompanionInit = true;

  try {
    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = CSS;
      document.head.appendChild(style);
    }

    const host = document.createElement('div');
    host.id = 'brightoria-ai-root';
    document.body.appendChild(host);

    const fab = document.createElement('button');
    fab.className = 'bai-fab';
    fab.innerHTML = '✨ Tanya Bri';
    document.body.appendChild(fab);

    let root: ReactRoot | null = null;

    function close() {
      if (root) {
        root.unmount();
        root = null;
      }
      fab.hidden = false;
    }

    fab.addEventListener('click', () => {
      import('react-dom/client')
        .then((mod) => {
          if (root) return;
          root = mod.createRoot(host) as unknown as ReactRoot;
          fab.hidden = true;
          root.render(<Panel onClose={close} />);
        })
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.error('[Brightoria] AiCompanion gagal dibuka:', err);
        });
    });

    const observer = new MutationObserver(() => {
      if (root) return;
      fab.hidden = document.querySelector(GAME_OVERLAY_SELECTORS) !== null;
    });
    observer.observe(document.body, { childList: true, subtree: true });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[Brightoria] AiCompanion gagal dipasang (diabaikan dengan aman):', err);
  }
}

mountCompanion();

export {};
