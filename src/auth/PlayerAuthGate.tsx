import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { worlds } from '../data/worlds';
import { authenticateEmail, authenticateGoogle, type PlayerSession } from './playerSession';

interface GoogleCredentialResponse { credential?: string }
interface GoogleAccountsId {
  initialize(options: { client_id: string; callback: (response: GoogleCredentialResponse) => void }): void;
  renderButton(element: HTMLElement, options: Record<string, unknown>): void;
}

declare global {
  interface Window { google?: { accounts?: { id?: GoogleAccountsId } } }
}

interface PlayerAuthGateProps {
  onAuthenticated: (player: PlayerSession) => void;
  onOpenAdmin: () => void;
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

export function PlayerAuthGate({ onAuthenticated, onOpenAdmin }: PlayerAuthGateProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const googleButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    let cancelled = false;
    const renderGoogle = () => {
      const googleId = window.google?.accounts?.id;
      const target = googleButtonRef.current;
      if (cancelled || !googleId || !target) return;
      googleId.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async ({ credential }) => {
          if (!credential) return;
          setBusy(true);
          setError(null);
          try { onAuthenticated(await authenticateGoogle(credential)); }
          catch (reason) { setError(reason instanceof Error ? reason.message : 'Login Google gagal.'); }
          finally { setBusy(false); }
        },
      });
      target.replaceChildren();
      googleId.renderButton(target, { theme: 'outline', size: 'large', shape: 'rectangular', width: 340, text: 'continue_with' });
    };
    const existing = document.querySelector<HTMLScriptElement>('script[data-brightoria-google]');
    if (existing) renderGoogle();
    else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.dataset.brightoriaGoogle = 'true';
      script.onload = renderGoogle;
      document.head.appendChild(script);
    }
    return () => { cancelled = true; };
  }, [onAuthenticated]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const player = await authenticateEmail({ mode, name: mode === 'register' ? name : undefined, email, password });
      onAuthenticated(player);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Akun belum dapat diproses.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="player-auth-shell">
      <section className="player-auth-scene" aria-label="Pulau-pulau Brightoria">
        <div className="player-auth-brand"><span><Sparkles /></span><div><strong>Brightoria</strong><small>by Bright Academy</small></div></div>
        <div className="player-auth-copy">
          <span className="player-auth-kicker"><ShieldCheck /> Ruang belajar keluarga</span>
          <h1>Masuk sebelum memulai petualangan.</h1>
          <p>Progres permainan tersimpan pada akun keluarga dan dapat dipantau oleh pengelola Brightoria.</p>
        </div>
        <div className="player-auth-islands" aria-hidden="true">
          {worlds.slice(0, 4).map((world) => <img key={world.id} src={world.image} alt="" />)}
        </div>
      </section>

      <section className="player-auth-panel" aria-labelledby="player-auth-title">
        <div className="player-auth-panel-head">
          <span className="player-auth-panel-icon"><UserRound /></span>
          <div><span>Akun keluarga</span><h2 id="player-auth-title">{mode === 'login' ? 'Selamat datang kembali' : 'Buat akun Brightoria'}</h2></div>
        </div>
        <div className="player-auth-tabs" role="tablist" aria-label="Pilihan akun">
          <button type="button" role="tab" aria-selected={mode === 'login'} className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setError(null); }}>Masuk</button>
          <button type="button" role="tab" aria-selected={mode === 'register'} className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setError(null); }}>Daftar</button>
        </div>

        {GOOGLE_CLIENT_ID ? <div className="player-google-button" ref={googleButtonRef} aria-label="Lanjutkan dengan Google" /> : (
          <button type="button" className="player-google-unavailable" disabled title="Admin perlu memasang Google Client ID"><span>G</span> Google segera tersedia</button>
        )}
        <div className="player-auth-divider"><span>atau gunakan email</span></div>

        <form className="player-auth-form" onSubmit={submit}>
          {mode === 'register' && <label><span>Nama pemain</span><div><UserRound /><input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" minLength={2} maxLength={60} placeholder="Nama anak" required /></div></label>}
          <label><span>Email orang tua</span><div><Mail /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" maxLength={254} placeholder="nama@email.com" required /></div></label>
          <label><span>Password</span><div><KeyRound /><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={8} maxLength={128} placeholder="Minimal 8 karakter" required /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}>{showPassword ? <EyeOff /> : <Eye />}</button></div></label>
          {error && <div className="player-auth-error" role="alert">{error}</div>}
          <button className="player-auth-submit" type="submit" disabled={busy}>{busy ? 'Memproses...' : mode === 'login' ? 'Masuk ke Brightoria' : 'Buat akun dan mulai'} {!busy && <ArrowRight />}</button>
        </form>

        <p className="player-auth-privacy"><LockKeyhole /> Password disimpan dalam bentuk hash. Email hanya dipakai untuk akun dan pencatatan aktivitas Brightoria.</p>
        <button type="button" className="player-auth-admin" onClick={onOpenAdmin}><ShieldCheck /> Masuk sebagai admin</button>
      </section>
    </main>
  );
}

