import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  BarChart3,
  Bell,
  BookOpenCheck,
  Check,
  Clipboard,
  Clock3,
  CreditCard,
  Crown,
  Database,
  Download,
  FileText,
  KeyRound,
  LockKeyhole,
  Megaphone,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  UsersRound,
  X,
} from 'lucide-react';
import { PREMIUM_PLANS, formatRupiah } from '../subscription/premiumAccess';
import {
  getAdminUsers,
  loginAdmin,
  logoutAdmin,
  type AdminUserRecord,
} from '../auth/playerSession';
import {
  downloadAdminReport,
  readAdminSnapshot,
  type AdminSnapshot,
  type AdminWorldMetric,
} from './adminData';

type AdminTab =
  | 'users'
  | 'payments'
  | 'fraud'
  | 'security'
  | 'subscriptions'
  | 'affiliates'
  | 'audit'
  | 'broadcast'
  | 'reports';
type ChartMetric = 'mastery' | 'attempts' | 'completed';

interface AdminPortalProps {
  open: boolean;
  onClose: () => void;
}

const BROADCAST_DRAFT_KEY = 'brightoria.admin.broadcastDraft.v1';

const contentInventory = [
  ['Taman Al-Qur\'an', 'Hijaiyah, Iqra, Juz 30, hafalan', 'Draft akademik'],
  ['Kampung Adab', 'Kisah Pilihan dan simulator 3D', 'Draft akademik'],
  ['Pulau Numeria', 'Matematika kelas 1-6', 'Draft akademik'],
  ['Oasis Bahasa Arab', 'Safari, pasar kata, AI gesture', 'Draft akademik'],
  ['English Harbor', 'Letter Builder dan Harbor Run', 'Draft akademik'],
  ['Benteng Digital', 'Cyber Safety Sorter', 'Draft akademik'],
] as const;

function formatDate(value: string | null): string {
  if (!value) return 'Belum ada aktivitas';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Tanggal tidak valid';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function readBroadcastDraft(): { title: string; body: string } {
  try {
    const parsed = JSON.parse(localStorage.getItem(BROADCAST_DRAFT_KEY) ?? '{}') as Record<string, unknown>;
    return {
      title: typeof parsed.title === 'string' ? parsed.title : '',
      body: typeof parsed.body === 'string' ? parsed.body : '',
    };
  } catch {
    return { title: '', body: '' };
  }
}

function StatCard({ icon, label, value, note, tone }: {
  icon: ReactNode;
  label: string;
  value: string | number;
  note: string;
  tone: string;
}) {
  return (
    <article className="admin-stat-card" style={{ '--admin-tone': tone } as CSSProperties}>
      <span className="admin-stat-icon">{icon}</span>
      <span>{label}</span>
      <b>{value}</b>
      <small>{note}</small>
    </article>
  );
}

function EmptyState({ icon, title, description, requirements }: {
  icon: ReactNode;
  title: string;
  description: string;
  requirements: string[];
}) {
  return (
    <section className="admin-section admin-empty-state">
      <span className="admin-empty-icon">{icon}</span>
      <div>
        <span className="admin-scope-badge">Menunggu backend produksi</span>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <div className="admin-requirement-list">
        {requirements.map((item) => <span key={item}><LockKeyhole /> {item}</span>)}
      </div>
    </section>
  );
}

function ProgressChart({ worlds }: { worlds: AdminWorldMetric[] }) {
  const [metric, setMetric] = useState<ChartMetric>('mastery');
  const chartValues = worlds.map((world) => metric === 'mastery' ? world.mastery : world[metric]);
  const maximum = metric === 'mastery' ? 100 : Math.max(1, ...chartValues);
  const points = chartValues.map((value, index) => {
    const x = 28 + index * (544 / Math.max(worlds.length - 1, 1));
    const y = 158 - (value / maximum) * 120;
    return { x, y, value };
  });
  const line = points.map(({ x, y }) => `${x},${y}`).join(' ');
  const area = points.length ? `28,158 ${line} 572,158` : '';
  const totalLabel = metric === 'mastery'
    ? `${Math.round(chartValues.reduce((sum, value) => sum + value, 0) / Math.max(chartValues.length, 1))}%`
    : chartValues.reduce((sum, value) => sum + value, 0);

  return (
    <section className="admin-section admin-chart-card">
      <div className="admin-section-title admin-chart-heading">
        <div>
          <b><TrendingUp /> Visualisasi Progres Belajar Brightoria</b>
          <span>Ringkasan perangkat aktif berdasarkan evidence enam dunia</span>
        </div>
        <div className="admin-segmented" aria-label="Pilih data grafik">
          <button type="button" className={metric === 'mastery' ? 'active' : ''} onClick={() => setMetric('mastery')}>Mastery</button>
          <button type="button" className={metric === 'attempts' ? 'active' : ''} onClick={() => setMetric('attempts')}>Percobaan</button>
          <button type="button" className={metric === 'completed' ? 'active' : ''} onClick={() => setMetric('completed')}>Selesai</button>
        </div>
      </div>
      <div className="admin-chart-summary">
        <div><span>Data ditampilkan</span><b>{metric === 'mastery' ? 'Mastery dunia' : metric === 'attempts' ? 'Total percobaan' : 'Unit selesai'}</b></div>
        <div><span>Nilai gabungan</span><b>{totalLabel}</b></div>
        <div><span>Cakupan</span><b>{worlds.length} dunia</b></div>
        <div><span>Sumber</span><b>Evidence lokal</b></div>
      </div>
      <div className="admin-chart-canvas">
        <svg viewBox="0 0 600 180" role="img" aria-label="Grafik progres enam dunia">
          <defs>
            <linearGradient id="admin-chart-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#13a8c9" stopOpacity="0.38" />
              <stop offset="1" stopColor="#13a8c9" stopOpacity="0.03" />
            </linearGradient>
          </defs>
          {[38, 78, 118, 158].map((y) => <line key={y} x1="28" x2="572" y1={y} y2={y} className="admin-chart-gridline" />)}
          <polygon points={area} fill="url(#admin-chart-fill)" />
          <polyline points={line} className="admin-chart-line" />
          {points.map((point, index) => (
            <g key={worlds[index].id}>
              <circle cx={point.x} cy={point.y} r="5" fill={worlds[index].color} />
              <text x={point.x} y={Math.max(18, point.y - 10)} textAnchor="middle">{point.value}{metric === 'mastery' ? '%' : ''}</text>
            </g>
          ))}
        </svg>
        <div className="admin-chart-labels">
          {worlds.map((world) => <span key={world.id}>{world.name.replace('Pulau ', '').replace('Taman ', '')}</span>)}
        </div>
      </div>
    </section>
  );
}

function UsersDashboard({ snapshot, users, loading, openReports }: {
  snapshot: AdminSnapshot;
  users: AdminUserRecord[];
  loading: boolean;
  openReports: () => void;
}) {
  const [query, setQuery] = useState('');
  const needle = query.trim().toLowerCase();
  const filteredUsers = users.filter((user) => !needle
    || user.displayName.toLowerCase().includes(needle)
    || user.email.toLowerCase().includes(needle));
  const totalWorldsOpened = users.reduce((sum, user) => sum + Object.keys(user.worlds ?? {}).length, 0);
  const totalLogins = users.reduce((sum, user) => sum + user.loginCount, 0);

  return (
    <div className="admin-tab-content">
      <div className="admin-stat-grid">
        <StatCard icon={<UsersRound />} label="Total akun terdaftar" value={users.length} note="Registry privat Brightoria" tone="#0ea5e9" />
        <StatCard icon={<Crown />} label="Santri Premium aktif" value={snapshot.subscription.active ? 1 : 0} note="Entitlement lokal valid" tone="#f59e0b" />
        <StatCard icon={<UserCheck />} label="Login tercatat" value={totalLogins} note="Akumulasi login akun" tone="#10b981" />
        <StatCard icon={<BookOpenCheck />} label="Pulau pernah dibuka" value={totalWorldsOpened} note="Akumulasi seluruh akun" tone="#7c3aed" />
        <StatCard icon={<ShieldAlert />} label="Akun suspended" value={0} note="Belum ada akun ditangguhkan" tone="#e11d48" />
      </div>
      <div className="admin-visual-switcher">
        <b>Visualisasi aktivitas:</b>
        <span className="active"><BarChart3 /> Pertumbuhan & Aktivitas</span>
        <span><Activity /> Progres Dunia</span>
        <em><i /> Registry server + evidence perangkat aktif</em>
      </div>
      <ProgressChart worlds={snapshot.worlds} />
      <section className="admin-section">
        <div className="admin-section-title">
          <div><b>Pengguna Brightoria</b><span>Akun email/Google dan aktivitas pembukaan pulau</span></div>
          <label className="admin-search"><Search /><input aria-label="Cari pengguna" placeholder="Cari nama atau email..." value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table admin-user-table">
            <thead><tr><th>Pengguna / Santri</th><th>Akses</th><th>Pulau dicoba</th><th>Login</th><th>Aktivitas terakhir</th><th>Aksi admin</th></tr></thead>
            <tbody>{loading ? <tr><td colSpan={6} className="admin-table-empty">Memuat registry pengguna...</td></tr> : filteredUsers.length ? filteredUsers.map((user) => {
              const worldEntries = Object.entries(user.worlds ?? {});
              return <tr key={user.id}>
                <td><span className="admin-avatar">{user.displayName.slice(0, 1).toUpperCase()}</span><b>{user.displayName}</b><small>{user.email} / {user.authProvider === 'google' ? 'Google' : 'Email'}</small></td>
                <td><span className="admin-status-chip free"><Check /> FREE</span><small>Terdaftar {formatDate(user.createdAt)}</small></td>
                <td><b>{worldEntries.length} dari 6 pulau</b><small>{worldEntries.length ? worldEntries.map(([id, activity]) => `${id} (${activity.opens}x)`).join(', ') : 'Belum membuka pulau'}</small></td>
                <td><b>{user.loginCount} kali</b><small>Terakhir {formatDate(user.lastLoginAt)}</small></td>
                <td><b>{formatDate(user.lastActiveAt)}</b><small>Aktivitas akun terbaru</small></td>
                <td><button type="button" className="admin-row-action" onClick={openReports}><FileText /> Evidence lokal</button></td>
              </tr>;
            }) : <tr><td colSpan={6} className="admin-table-empty">{needle ? 'Tidak ada pengguna yang cocok.' : 'Belum ada akun pemain terdaftar.'}</td></tr>}</tbody>
          </table>
        </div>
        <p className="admin-inline-note"><ShieldCheck /> Registry server mencatat identitas akun dan pulau yang dibuka. Nilai mastery rinci masih berasal dari evidence perangkat aktif.</p>
      </section>
    </div>
  );
}

function PaymentsDashboard({ snapshot }: { snapshot: AdminSnapshot }) {
  const intent = snapshot.subscription.checkoutIntent;
  const intentPlan = intent ? PREMIUM_PLANS.find((plan) => plan.id === intent.planId) : null;
  return (
    <div className="admin-tab-content">
      <div className="admin-stat-grid admin-stat-grid-four">
        <StatCard icon={<CreditCard />} label="Intent checkout" value={intent ? 1 : 0} note="Tersimpan pada browser" tone="#0f766e" />
        <StatCard icon={<Clock3 />} label="Menunggu verifikasi" value={intent && !snapshot.subscription.active ? 1 : 0} note="Belum ada webhook server" tone="#d97706" />
        <StatCard icon={<BadgeCheck />} label="Entitlement valid" value={snapshot.subscription.active ? 1 : 0} note="Cache Premium perangkat" tone="#16a34a" />
        <StatCard icon={<Database />} label="Transaksi server" value="-" note="Backend belum terhubung" tone="#64748b" />
      </div>
      <section className="admin-section">
        <div className="admin-section-title"><div><b>Tracking pembayaran dan checkout</b><span>Hanya menampilkan intent nyata dari perangkat ini</span></div><span className="admin-scope-badge">1 perangkat lokal</span></div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Referensi</th><th>Paket</th><th>Nominal</th><th>Dibuat</th><th>Status</th></tr></thead>
            <tbody>{intent ? <tr><td><b>CHECKOUT-LOCAL</b><small>{intent.featureId}</small></td><td><b>{intentPlan?.name ?? intent.planId}</b></td><td>{intentPlan ? formatRupiah(intentPlan.priceIdr) : '-'}</td><td>{formatDate(intent.createdAt)}</td><td><span className={`admin-status-chip ${snapshot.subscription.active ? 'verified' : 'pending'}`}>{snapshot.subscription.active ? <Check /> : <Clock3 />}{snapshot.subscription.active ? 'Terverifikasi lokal' : 'Menunggu backend'}</span></td></tr> : <tr><td colSpan={5} className="admin-table-empty">Belum ada intent checkout pada perangkat ini.</td></tr>}</tbody>
          </table>
        </div>
      </section>
      <section className="admin-section">
        <div className="admin-section-title"><div><b>Katalog paket Brightoria</b><span>Harga yang sama dengan modal Premium anak</span></div></div>
        <div className="admin-plan-grid">{PREMIUM_PLANS.map((plan) => <article key={plan.id} className={plan.popular ? 'popular' : ''}><span>{plan.popular ? 'Paling populer' : 'Paket aktif'}</span><b>{plan.name}</b><strong>{formatRupiah(plan.priceIdr)}</strong><small>{plan.monthlyLabel}</small></article>)}</div>
      </section>
    </div>
  );
}

function SecurityDashboard({ snapshot }: { snapshot: AdminSnapshot }) {
  const checks = [
    ['Sesi admin server', 'ready', 'Cookie HttpOnly bertanda tangan, berlaku maksimal 8 jam.'],
    ['Penyimpanan progres', 'local', `${snapshot.storage.recordCount} record Brightoria tersimpan lokal.`],
    ['Premium gate', 'ready', 'Konten terkunci sampai entitlement aktif.'],
    ['Autentikasi admin', 'ready', 'Username dan password diverifikasi hanya pada server.'],
    ['Password pengguna', 'ready', 'Password email disimpan sebagai hash scrypt dengan salt unik.'],
    ['Audit keamanan', 'blocked', 'Audit aksi admin rinci dan 2FA belum tersedia.'],
  ] as const;
  return (
    <div className="admin-tab-content">
      <section className="admin-section admin-security-head"><ShieldCheck /><div><span className="admin-scope-badge">Security center Brightoria</span><h3>Keamanan akun dan sesi pengelola</h3><p>Status di bawah memisahkan kontrol yang sudah nyata dari fitur yang masih membutuhkan backend.</p></div></section>
      <section className="admin-section">
        <div className="admin-section-title"><div><b>Kontrol keamanan sistem</b><span>Status faktual aplikasi saat ini</span></div></div>
        <div className="admin-system-grid">{checks.map(([label, status, detail]) => <article key={label} className={`admin-system-check ${status}`}><span>{status === 'ready' ? <Check /> : status === 'local' ? <Database /> : <AlertTriangle />}</span><div><b>{label}</b><small>{detail}</small></div><em>{status === 'ready' ? 'Siap' : status === 'local' ? 'Lokal' : 'Belum'}</em></article>)}</div>
      </section>
      <EmptyState icon={<KeyRound />} title="Kontrol akun lanjutan belum aktif" description="Login server dan hash password sudah aktif. Reset password, suspend akun, 2FA, dan audit aksi masih membutuhkan alur operasional resmi." requirements={['Reset password terverifikasi', 'Role-based access control', 'Audit log server', '2FA admin']} />
    </div>
  );
}

function SubscriptionsDashboard({ snapshot, explainUnavailable }: { snapshot: AdminSnapshot; explainUnavailable: () => void }) {
  return (
    <div className="admin-tab-content">
      <div className="admin-stat-grid admin-stat-grid-four">
        <StatCard icon={<Crown />} label="Subscription aktif" value={snapshot.subscription.active ? 1 : 0} note={snapshot.subscription.planName ?? 'Tidak ada'} tone="#ca8a04" />
        <StatCard icon={<Clock3 />} label="Paket bulanan" value={snapshot.subscription.active && snapshot.subscription.planName?.toLowerCase().includes('bulan') ? 1 : 0} note="Perangkat ini" tone="#0284c7" />
        <StatCard icon={<TrendingUp />} label="Paket tahunan" value={snapshot.subscription.active && snapshot.subscription.planName?.toLowerCase().includes('tahun') ? 1 : 0} note="Perangkat ini" tone="#7c3aed" />
        <StatCard icon={<BadgeCheck />} label="Lifetime" value={snapshot.subscription.status === 'lifetime' ? 1 : 0} note="Perangkat ini" tone="#059669" />
      </div>
      <section className="admin-section">
        <div className="admin-section-title"><div><b>Subscription aktif pada perangkat</b><span>Entitlement lokal yang lolos validasi format dan masa aktif</span></div><button type="button" className="admin-primary-action" onClick={explainUnavailable}><Crown /> Assign Premium manual</button></div>
        <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Profil</th><th>Paket</th><th>Status</th><th>Diverifikasi</th><th>Berakhir</th></tr></thead><tbody><tr><td><b>{snapshot.profile.name}</b><small>LOCAL-DEVICE</small></td><td>{snapshot.subscription.planName ?? 'Free'}</td><td><span className={`admin-status-chip ${snapshot.subscription.active ? 'verified' : 'free'}`}>{snapshot.subscription.active ? <Check /> : <LockKeyhole />}{snapshot.subscription.active ? 'Aktif' : 'Free'}</span></td><td>{formatDate(snapshot.subscription.verifiedAt)}</td><td>{snapshot.subscription.status === 'lifetime' ? 'Lifetime' : formatDate(snapshot.subscription.expiresAt)}</td></tr></tbody></table></div>
        <p className="admin-inline-note"><ShieldCheck /> Assign Premium tetap dikunci sampai transaksi dapat diverifikasi oleh server Brightoria.</p>
      </section>
    </div>
  );
}

function AuditDashboard({ snapshot }: { snapshot: AdminSnapshot }) {
  const events = useMemo(() => {
    const activity = snapshot.worlds.filter((world) => world.updatedAt).map((world) => ({ at: world.updatedAt, source: world.name, action: `${world.attempts} percobaan / ${world.completed} unit selesai`, status: 'Evidence lokal' }));
    return [
      { at: snapshot.generatedAt as string | null, source: 'Portal Admin', action: 'Snapshot dashboard diperbarui', status: 'Sesi lokal' },
      ...(snapshot.subscription.active ? [{ at: snapshot.subscription.verifiedAt, source: 'Premium Gate', action: `Entitlement ${snapshot.subscription.planName ?? 'Premium'} terbaca`, status: 'Cache lokal' }] : []),
      ...activity,
    ].sort((a, b) => new Date(b.at ?? 0).getTime() - new Date(a.at ?? 0).getTime());
  }, [snapshot]);
  return <div className="admin-tab-content"><section className="admin-section"><div className="admin-section-title"><div><b>Audit aktivitas lokal</b><span>Jejak ini diturunkan dari timestamp evidence, bukan log server</span></div><span className="admin-scope-badge">{events.length} event terbaca</span></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Waktu</th><th>Sumber</th><th>Aktivitas</th><th>Cakupan</th></tr></thead><tbody>{events.map((event, index) => <tr key={`${event.source}-${index}`}><td>{formatDate(event.at)}</td><td><b>{event.source}</b></td><td>{event.action}</td><td><span className="admin-status-chip free">{event.status}</span></td></tr>)}</tbody></table></div></section></div>;
}

function BroadcastDashboard({ notify }: { notify: (message: string) => void }) {
  const initial = useMemo(readBroadcastDraft, []);
  const [title, setTitle] = useState(initial.title);
  const [body, setBody] = useState(initial.body);
  function saveDraft() {
    try {
      localStorage.setItem(BROADCAST_DRAFT_KEY, JSON.stringify({ title: title.trim(), body: body.trim(), updatedAt: new Date().toISOString() }));
      notify('Draft pengumuman disimpan di perangkat ini. Belum dikirim ke pengguna.');
    } catch {
      notify('Draft tidak dapat disimpan pada browser ini.');
    }
  }
  return (
    <div className="admin-tab-content admin-broadcast-layout">
      <section className="admin-section">
        <div className="admin-section-title"><div><b>Pengumuman Brightoria</b><span>Siapkan naskah sebelum backend broadcast tersedia</span></div><span className="admin-scope-badge">Draft lokal</span></div>
        <label className="admin-form-field"><span>Judul pengumuman</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Contoh: Petualangan baru telah hadir" maxLength={80} /></label>
        <label className="admin-form-field"><span>Isi pesan</span><textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Tulis pesan singkat untuk orang tua dan anak..." maxLength={280} /></label>
        <button type="button" className="admin-primary-action" onClick={saveDraft}><Megaphone /> Simpan draft lokal</button>
        <p className="admin-inline-note"><AlertTriangle /> Tombol ini hanya menyimpan draft. Pengiriman ke akun lain membutuhkan backend dan push notification.</p>
      </section>
      <section className="admin-section admin-announcement-preview"><span className="admin-scope-badge">Pratinjau anak</span><Megaphone /><h3>{title || 'Judul pengumuman'}</h3><p>{body || 'Isi pengumuman akan terlihat di sini sebelum dikirim.'}</p><small>Brightoria by Bright Academy</small></section>
    </div>
  );
}

function ReportsDashboard({ snapshot }: { snapshot: AdminSnapshot }) {
  return (
    <div className="admin-tab-content">
      <section className="admin-section admin-report-head"><div><span className="admin-scope-badge">Laporan perangkat aktif</span><h3>Rekap perkembangan {snapshot.profile.name}</h3><p>Gunakan laporan ini sebagai bahan pendamping. Seluruh konten akademik masih draft.</p></div><button type="button" className="admin-primary-action" onClick={() => downloadAdminReport(snapshot)}><Download /> Ekspor JSON</button></section>
      <section className="admin-section"><div className="admin-section-title"><div><b>Progres per dunia</b><span>Mastery, penyelesaian, percobaan, dan aktivitas terakhir</span></div></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Dunia</th><th>Mastery</th><th>Progres</th><th>Percobaan</th><th>Aktivitas terakhir</th></tr></thead><tbody>{snapshot.worlds.map((world) => <tr key={world.id}><td><span className="admin-world-dot" style={{ background: world.color }} /><b>{world.name}</b><small>{world.subtitle}</small></td><td><strong>{world.mastery}%</strong></td><td>{world.completed} / {world.total}</td><td>{world.attempts}</td><td>{formatDate(world.updatedAt)}</td></tr>)}</tbody></table></div></section>
      <section className="admin-section"><div className="admin-section-title"><div><b>Status konten per pulau</b><span>Mekanik tersedia tidak berarti materi sudah disahkan</span></div></div><div className="admin-content-list">{contentInventory.map(([world, mechanic, status]) => <div key={world}><b>{world}</b><span>{mechanic}</span><em>{status}</em></div>)}</div></section>
    </div>
  );
}

export function AdminPortal({ open, onClose }: AdminPortalProps) {
  const [accessState, setAccessState] = useState<'checking' | 'locked' | 'unlocked'>('checking');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [tab, setTab] = useState<AdminTab>('users');
  const [snapshot, setSnapshot] = useState<AdminSnapshot>(() => readAdminSnapshot());
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', onKeyDown); };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setAccessState('checking');
    // Portal admin selalu meminta autentikasi baru saat dibuka. Cookie lama
    // diakhiri lebih dulu agar tombol "Masuk sebagai admin" tidak pernah
    // langsung melewati formulir username/password.
    logoutAdmin()
      .catch(() => undefined)
      .finally(() => {
        if (!active) return;
        setUsers([]);
        setAccessState('locked');
      });
    return () => { active = false; };
  }, [open]);

  useEffect(() => {
    scrollAreaRef.current?.scrollTo({ top: 0 });
  }, [tab]);

  const tabDefinitions = useMemo(() => [
    { id: 'users' as const, icon: <UsersRound />, label: 'Pendaftaran & Pengguna', count: String(users.length) },
    { id: 'payments' as const, icon: <CreditCard />, label: 'Tracking Pembayaran', count: snapshot.subscription.checkoutIntent ? '1' : '0' },
    { id: 'fraud' as const, icon: <ShieldAlert />, label: 'Deteksi Transfer Palsu' },
    { id: 'security' as const, icon: <KeyRound />, label: 'Keamanan Akun & Password' },
    { id: 'subscriptions' as const, icon: <Crown />, label: 'Subscription Aktif', count: snapshot.subscription.active ? '1' : '0' },
    { id: 'affiliates' as const, icon: <TrendingUp />, label: 'Afiliasi' },
    { id: 'audit' as const, icon: <Activity />, label: 'Audit Log' },
    { id: 'broadcast' as const, icon: <Megaphone />, label: 'Pengumuman' },
    { id: 'reports' as const, icon: <FileText />, label: 'Laporan' },
  ], [snapshot, users.length]);

  if (!open) return null;

  function showNotice(message: string) { setNotice(message); window.setTimeout(() => setNotice(null), 3200); }
  async function refresh() {
    setSnapshot(readAdminSnapshot());
    setUsersLoading(true);
    try { setUsers(await getAdminUsers()); showNotice('Registry server dan data perangkat berhasil diperbarui.'); }
    catch (error) { showNotice(error instanceof Error ? error.message : 'Registry pengguna belum dapat dimuat.'); }
    finally { setUsersLoading(false); }
  }
  async function unlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginBusy(true);
    setLoginError(null);
    try {
      await loginAdmin(username, password);
      setAccessState('unlocked');
      setPassword('');
      setSnapshot(readAdminSnapshot());
      setUsersLoading(true);
      try { setUsers(await getAdminUsers()); }
      finally { setUsersLoading(false); }
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Login admin gagal.');
    } finally {
      setLoginBusy(false);
    }
  }
  async function lock() {
    try { await logoutAdmin(); } catch { /* Cookie lokal tetap dianggap terkunci. */ }
    setAccessState('locked');
    setUsers([]);
    setTab('users');
  }
  async function copyLink() {
    const link = `${window.location.origin}${window.location.pathname}#/admin`;
    try { await navigator.clipboard.writeText(link); setCopied(true); showNotice('Link standalone portal admin berhasil disalin.'); window.setTimeout(() => setCopied(false), 1800); }
    catch { showNotice('Browser tidak mengizinkan penyalinan otomatis.'); }
  }

  if (accessState === 'checking') {
    return <div className="admin-overlay"><section className="admin-entry admin-entry-loading"><ShieldCheck /><h2>Memeriksa sesi admin...</h2></section></div>;
  }

  if (accessState !== 'unlocked') {
    return (
      <div className="admin-overlay">
        <section className="admin-entry" role="dialog" aria-modal="true" aria-labelledby="admin-entry-title">
          <button type="button" className="admin-icon-button admin-entry-close" onClick={onClose} aria-label="Tutup portal admin"><X /></button>
          <span className="admin-entry-icon"><ShieldCheck /></span><span className="admin-kicker">Brightoria Master Portal</span>
          <h2 id="admin-entry-title">Gerbang Pusat Kendali Admin</h2>
          <p>Masukkan akun pengelola resmi untuk membuka data pengguna dan aktivitas Brightoria.</p>
          <form className="admin-login-form" onSubmit={unlock}>
            <label><span>Username admin</span><div><UserCheck /><input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required /></div></label>
            <label><span>Password admin</span><div><KeyRound /><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></div></label>
            {loginError && <div className="admin-login-error" role="alert">{loginError}</div>}
            <button type="submit" className="admin-entry-button" disabled={loginBusy}><KeyRound /> {loginBusy ? 'Memverifikasi...' : 'Masuk ke Pusat Kendali'}</button>
          </form>
          <div className="admin-entry-warning"><ShieldCheck /><span><b>Dilindungi server.</b> Kredensial tidak disimpan di browser dan sesi admin memakai cookie HttpOnly.</span></div>
          <small>Direct link: #/admin / Login ulang diwajibkan setiap portal dibuka</small>
        </section>
      </div>
    );
  }

  return (
    <div className="admin-overlay">
      <section className="admin-shell" role="dialog" aria-modal="true" aria-label="Pusat Kendali Admin Brightoria">
        <div className="admin-topbar">
          <div className="admin-title-block"><span className="admin-logo"><ShieldCheck /></span><div><div className="admin-title-line"><h2>Pusat Kendali Admin & Sistem Pengelola</h2><span>Master Portal</span><code>Direct Link: #/admin</code></div><p>Pusat monitoring profil, progres pembelajaran, Premium, laporan, dan kesiapan sistem Brightoria</p></div></div>
          <div className="admin-toolbar">
            <button type="button" onClick={copyLink} title="Salin link admin"><Clipboard /> <span>{copied ? 'Tersalin' : 'Link Standalone'}</span></button>
            <button type="button" className="admin-toolbar-alert" onClick={() => setTab('security')} title="Lihat keterbatasan sistem"><Bell /> <span>Kontrol Lanjutan</span></button>
            <button type="button" className="admin-toolbar-pro" onClick={() => showNotice('Assign Premium membutuhkan backend dan verifikasi transaksi resmi.')} title="Assign Premium manual"><Crown /> <span>Assign Premium</span></button>
            <button type="button" onClick={refresh} title="Segarkan data"><RefreshCw /> <span>Refresh</span></button>
            <button type="button" className="admin-toolbar-lock" onClick={lock} title="Kunci sesi"><LockKeyhole /> <span>Kunci Sesi</span></button>
            <button type="button" className="admin-close" onClick={onClose} aria-label="Tutup portal admin"><X /></button>
          </div>
        </div>
        {notice && <div className="admin-notice-toast"><Check /> {notice}</div>}
        <div className="admin-alert-band"><AlertTriangle /><div><span className="admin-alert-label">Status Sistem Produksi</span><b>Login pemain, sesi admin, dan registry aktivitas sudah terhubung</b><small>Payment, reset password, 2FA, dan audit aksi admin masih menunggu layanan produksi lanjutan.</small></div><button type="button" onClick={() => setTab('security')}><ShieldCheck /> Lihat kesiapan</button></div>
        <div className="admin-tabs" role="navigation" aria-label="Menu admin">{tabDefinitions.map((item) => <button type="button" key={item.id} className={`${tab === item.id ? 'active' : ''} admin-tab-${item.id}`} onClick={() => setTab(item.id)}>{item.icon}<span>{item.label}{item.count !== undefined ? ` (${item.count})` : ''}</span></button>)}</div>
        <div className="admin-scroll-area" ref={scrollAreaRef}>
          {tab === 'users' && <UsersDashboard snapshot={snapshot} users={users} loading={usersLoading} openReports={() => setTab('reports')} />}
          {tab === 'payments' && <PaymentsDashboard snapshot={snapshot} />}
          {tab === 'fraud' && <EmptyState icon={<ShieldAlert />} title="Deteksi transfer palsu belum terhubung" description="Repository Brightoria belum memiliki transaksi bank, unggahan bukti transfer, atau mutasi server yang dapat dianalisis secara sah." requirements={['Payment gateway dan webhook', 'Penyimpanan bukti transfer', 'Mutasi bank terverifikasi', 'Audit keputusan admin']} />}
          {tab === 'security' && <SecurityDashboard snapshot={snapshot} />}
          {tab === 'subscriptions' && <SubscriptionsDashboard snapshot={snapshot} explainUnavailable={() => showNotice('Assign Premium manual dikunci sampai backend terautentikasi tersedia.')} />}
          {tab === 'affiliates' && <EmptyState icon={<TrendingUp />} title="Program afiliasi belum tersedia" description="Brightoria saat ini belum mempunyai akun mitra, kode referral, atribusi pendaftaran, atau perhitungan komisi." requirements={['Database mitra', 'Referral attribution', 'Ledger komisi', 'Persetujuan dan payout']} />}
          {tab === 'audit' && <AuditDashboard snapshot={snapshot} />}
          {tab === 'broadcast' && <BroadcastDashboard notify={showNotice} />}
          {tab === 'reports' && <ReportsDashboard snapshot={snapshot} />}
          <div className="admin-footer-note"><Clock3 /> Data diperbarui {formatDate(snapshot.generatedAt)} / tanpa musik latar / konten akademik masih draft</div>
        </div>
      </section>
    </div>
  );
}
