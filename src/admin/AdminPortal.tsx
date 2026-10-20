import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
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

const SESSION_KEY = 'brightoria.admin.preview.session.v1';
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

function readSession(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === 'open';
  } catch {
    return false;
  }
}

function writeSession(open: boolean): void {
  try {
    if (open) sessionStorage.setItem(SESSION_KEY, 'open');
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // Session storage is optional in embedded previews.
  }
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

function UsersDashboard({ snapshot, openReports }: { snapshot: AdminSnapshot; openReports: () => void }) {
  const [query, setQuery] = useState('');
  const localAccounts = 1;
  const profileMatches = snapshot.profile.name.toLowerCase().includes(query.trim().toLowerCase());
  return (
    <div className="admin-tab-content">
      <div className="admin-stat-grid">
        <StatCard icon={<UsersRound />} label="Total akun terdaftar" value={localAccounts} note="Profil pada perangkat ini" tone="#0ea5e9" />
        <StatCard icon={<Crown />} label="Santri Premium aktif" value={snapshot.subscription.active ? 1 : 0} note="Entitlement lokal valid" tone="#f59e0b" />
        <StatCard icon={<UserCheck />} label="User Free login" value={snapshot.subscription.active || !localAccounts ? 0 : 1} note="Akses materi dasar" tone="#10b981" />
        <StatCard icon={<BookOpenCheck />} label="Dunia dimulai" value={`${snapshot.startedWorlds}/6`} note={`${snapshot.totalCompleted} unit selesai`} tone="#7c3aed" />
        <StatCard icon={<ShieldAlert />} label="Akun suspended" value={0} note="Butuh backend untuk tindakan" tone="#e11d48" />
      </div>
      <div className="admin-visual-switcher">
        <b>Visualisasi aktivitas:</b>
        <span className="active"><BarChart3 /> Pertumbuhan & Aktivitas</span>
        <span><Activity /> Progres Dunia</span>
        <em><i /> Data perangkat aktif</em>
      </div>
      <ProgressChart worlds={snapshot.worlds} />
      <section className="admin-section">
        <div className="admin-section-title">
          <div><b>Data pengguna pada perangkat</b><span>Belum ada sinkronisasi akun lintas perangkat</span></div>
          <label className="admin-search"><Search /><input aria-label="Cari pengguna" placeholder="Cari profil lokal..." value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table admin-user-table">
            <thead><tr><th>Pengguna / Santri</th><th>Status langganan</th><th>Progres</th><th>Aktivitas</th><th>Penyimpanan</th><th>Aksi admin</th></tr></thead>
            <tbody>{profileMatches ? <tr>
              <td><span className="admin-avatar">{snapshot.profile.name.slice(0, 1).toUpperCase()}</span><b>{snapshot.profile.name}</b><small>ID: LOCAL-DEVICE / {snapshot.profile.gender === 'girl' ? 'Anak perempuan' : 'Anak laki-laki'}</small></td>
              <td><span className={`admin-status-chip ${snapshot.subscription.active ? 'premium' : 'free'}`}>{snapshot.subscription.active ? <Crown /> : <Check />} {snapshot.subscription.active ? 'PREMIUM AKTIF' : 'FREE'}</span></td>
              <td><b>Level {snapshot.progress.level}</b><small>{snapshot.progress.xp} XP / mastery {snapshot.averageMastery}%</small></td>
              <td><b>{snapshot.totalAttempts} percobaan</b><small>{snapshot.startedWorlds} dunia dimulai</small></td>
              <td><b>{snapshot.storage.recordCount} record</b><small>Sekitar {snapshot.storage.approximateKb} KB</small></td>
              <td><button type="button" className="admin-row-action" onClick={openReports}><FileText /> Lihat laporan</button></td>
            </tr> : <tr><td colSpan={6} className="admin-table-empty">Profil lokal tidak cocok dengan pencarian.</td></tr>}</tbody>
          </table>
        </div>
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
    ['Sesi portal lokal', 'ready', 'Terbuka pada tab browser ini.'],
    ['Penyimpanan progres', 'local', `${snapshot.storage.recordCount} record Brightoria tersimpan lokal.`],
    ['Premium gate', 'ready', 'Konten terkunci sampai entitlement aktif.'],
    ['Autentikasi admin', 'blocked', 'Belum ada login admin berbasis server.'],
    ['Password pengguna', 'blocked', 'Tidak ada basis data kredensial pengguna.'],
    ['Audit keamanan', 'blocked', 'Belum tersedia audit log lintas perangkat.'],
  ] as const;
  return (
    <div className="admin-tab-content">
      <section className="admin-section admin-security-head"><ShieldCheck /><div><span className="admin-scope-badge">Security center Brightoria</span><h3>Keamanan akun dan sesi pengelola</h3><p>Status di bawah memisahkan kontrol yang sudah nyata dari fitur yang masih membutuhkan backend.</p></div></section>
      <section className="admin-section">
        <div className="admin-section-title"><div><b>Kontrol keamanan sistem</b><span>Status faktual aplikasi saat ini</span></div></div>
        <div className="admin-system-grid">{checks.map(([label, status, detail]) => <article key={label} className={`admin-system-check ${status}`}><span>{status === 'ready' ? <Check /> : status === 'local' ? <Database /> : <AlertTriangle />}</span><div><b>{label}</b><small>{detail}</small></div><em>{status === 'ready' ? 'Siap' : status === 'local' ? 'Lokal' : 'Belum'}</em></article>)}</div>
      </section>
      <EmptyState icon={<KeyRound />} title="Manajemen password belum aktif" description="Reset password, suspend akun, dan 2FA harus berjalan melalui layanan identitas yang terautentikasi, bukan localStorage." requirements={['Identity provider', 'Role-based access control', 'Audit log server', 'Recovery flow resmi']} />
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
  const [unlocked, setUnlocked] = useState(readSession);
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
    scrollAreaRef.current?.scrollTo({ top: 0 });
  }, [tab]);

  const tabDefinitions = useMemo(() => [
    { id: 'users' as const, icon: <UsersRound />, label: 'Pendaftaran & Pengguna', count: '1' },
    { id: 'payments' as const, icon: <CreditCard />, label: 'Tracking Pembayaran', count: snapshot.subscription.checkoutIntent ? '1' : '0' },
    { id: 'fraud' as const, icon: <ShieldAlert />, label: 'Deteksi Transfer Palsu' },
    { id: 'security' as const, icon: <KeyRound />, label: 'Keamanan Akun & Password' },
    { id: 'subscriptions' as const, icon: <Crown />, label: 'Subscription Aktif', count: snapshot.subscription.active ? '1' : '0' },
    { id: 'affiliates' as const, icon: <TrendingUp />, label: 'Afiliasi' },
    { id: 'audit' as const, icon: <Activity />, label: 'Audit Log' },
    { id: 'broadcast' as const, icon: <Megaphone />, label: 'Pengumuman' },
    { id: 'reports' as const, icon: <FileText />, label: 'Laporan' },
  ], [snapshot]);

  if (!open) return null;

  function showNotice(message: string) { setNotice(message); window.setTimeout(() => setNotice(null), 3200); }
  function refresh() { setSnapshot(readAdminSnapshot()); showNotice('Data lokal Brightoria berhasil diperbarui.'); }
  function unlock() { writeSession(true); setUnlocked(true); setSnapshot(readAdminSnapshot()); }
  function lock() { writeSession(false); setUnlocked(false); setTab('users'); }
  async function copyLink() {
    const link = `${window.location.origin}${window.location.pathname}#/admin`;
    try { await navigator.clipboard.writeText(link); setCopied(true); showNotice('Link standalone portal admin berhasil disalin.'); window.setTimeout(() => setCopied(false), 1800); }
    catch { showNotice('Browser tidak mengizinkan penyalinan otomatis.'); }
  }

  if (!unlocked) {
    return (
      <div className="admin-overlay">
        <section className="admin-entry" role="dialog" aria-modal="true" aria-labelledby="admin-entry-title">
          <button type="button" className="admin-icon-button admin-entry-close" onClick={onClose} aria-label="Tutup portal admin"><X /></button>
          <span className="admin-entry-icon"><ShieldCheck /></span><span className="admin-kicker">Brightoria Master Portal</span>
          <h2 id="admin-entry-title">Gerbang Pusat Kendali Admin</h2>
          <p>Pantau pendaftaran lokal, pembelajaran, status Premium, dan kesiapan operasional Brightoria.</p>
          <div className="admin-entry-warning"><AlertTriangle /><span><b>Mode pengembangan lokal.</b> Gerbang ini menjaga privasi layar, tetapi belum menggantikan autentikasi admin berbasis server.</span></div>
          <button type="button" className="admin-entry-button" onClick={unlock}><KeyRound /> Buka Pusat Kendali Lokal</button>
          <small>Direct link: #/admin / Pintasan: Ctrl+Shift+A</small>
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
            <button type="button" className="admin-toolbar-alert" onClick={() => setTab('security')} title="Lihat keterbatasan sistem"><Bell /> <span>3 Sistem Belum Aktif</span></button>
            <button type="button" className="admin-toolbar-pro" onClick={() => showNotice('Assign Premium membutuhkan backend dan verifikasi transaksi resmi.')} title="Assign Premium manual"><Crown /> <span>Assign Premium</span></button>
            <button type="button" onClick={refresh} title="Segarkan data"><RefreshCw /> <span>Refresh</span></button>
            <button type="button" className="admin-toolbar-lock" onClick={lock} title="Kunci sesi"><LockKeyhole /> <span>Kunci Sesi</span></button>
            <button type="button" className="admin-close" onClick={onClose} aria-label="Tutup portal admin"><X /></button>
          </div>
        </div>
        {notice && <div className="admin-notice-toast"><Check /> {notice}</div>}
        <div className="admin-alert-band"><AlertTriangle /><div><span className="admin-alert-label">Status Sistem Produksi</span><b>Backend pengguna, pembayaran, dan autentikasi admin belum terhubung</b><small>Dashboard hanya menampilkan data faktual dari perangkat aktif. Tidak ada akun, transfer, atau peringatan palsu yang dibuat.</small></div><button type="button" onClick={() => setTab('security')}><ShieldCheck /> Lihat kesiapan</button></div>
        <div className="admin-tabs" role="navigation" aria-label="Menu admin">{tabDefinitions.map((item) => <button type="button" key={item.id} className={`${tab === item.id ? 'active' : ''} admin-tab-${item.id}`} onClick={() => setTab(item.id)}>{item.icon}<span>{item.label}{item.count !== undefined ? ` (${item.count})` : ''}</span></button>)}</div>
        <div className="admin-scroll-area" ref={scrollAreaRef}>
          {tab === 'users' && <UsersDashboard snapshot={snapshot} openReports={() => setTab('reports')} />}
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
