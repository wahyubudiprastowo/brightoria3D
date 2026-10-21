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
  Eye,
  EyeOff,
  FileText,
  Gamepad2,
  KeyRound,
  LockKeyhole,
  MapPinned,
  Megaphone,
  RefreshCw,
  Search,
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
  | 'overview'
  | 'users'
  | 'activity'
  | 'content'
  | 'access'
  | 'system'
  | 'broadcast'
  | 'reports';
type ChartMetric = 'mastery' | 'attempts' | 'completed';

interface AdminPortalProps {
  open: boolean;
  onClose: () => void;
}

const BROADCAST_DRAFT_KEY = 'brightoria.admin.broadcastDraft.v1';

const contentInventory = [
  { id: 'quran', world: 'Taman Al-Qur\'an', mechanic: "Hijaiyah Drag-Line, Iqra' 1-6, Mushaf Juz 30, Tajwid, dan Arena Hafalan", access: 'Free + akun + Premium', review: 'Draft tahsin/tahfidz' },
  { id: 'adab', world: 'Kampung Adab', mechanic: 'Kisah Pilihan, Kampung 3D, 15 Hadits Hikmah, dan Adab Harian', access: 'Free + Premium', review: 'Draft karakter' },
  { id: 'math', world: 'Pulau Numeria', mechanic: 'Penerbangan kelas 1-2, Katak kelas 3-4, dan Jembatan kelas 5-6', access: 'Free', review: 'Draft matematika SD' },
  { id: 'arabic', world: 'Oasis Bahasa Arab', mechanic: "Safari 72 kartu, Pasar Kata, AI Angka/Surat, dan Mufrodat Qur'an", access: 'Free + Premium', review: 'Draft Bahasa Arab' },
  { id: 'english', world: 'English Harbor', mechanic: '3D Letter Builder, Harbor Adventure, dan Word Harbor Run', access: 'Free', review: 'Draft CEFR Pre-A1/A1' },
  { id: 'digital', world: 'Benteng Digital', mechanic: 'Cyber Safety Sorter dengan 10 misi adab digital Islami', access: 'Free', review: 'Draft literasi digital' },
] as const;

const accessInventory = [
  { tier: 'Mode Tamu', tone: '#0e7490', items: 'Peta 3D, enam game dasar, Latihan, dan Ekspedisi', note: 'Bisa langsung dicoba tanpa akun.' },
  { tier: 'Akun Gratis', tone: '#059669', items: "Iqra' Jilid 2-6, Profil, Ruang Orang Tua, dan riwayat pembukaan pulau", note: 'Memerlukan login atau daftar email.' },
  { tier: 'Premium', tone: '#ca8a04', items: "Tilawah 30 Juz, Kamus Qur'an Lanjutan, dan Akhlak dari Kisah Surat", note: 'Masih memakai gate frontend; verifikasi pembayaran server belum tersedia.' },
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

function accountActivitySummary(users: AdminUserRecord[]) {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const totalLogins = users.reduce((sum, user) => sum + user.loginCount, 0);
  const totalOpens = users.reduce((sum, user) => sum + Object.values(user.worlds ?? {}).reduce((worldSum, activity) => worldSum + activity.opens, 0), 0);
  const activeUsers = users.filter((user) => Date.parse(user.lastActiveAt) >= sevenDaysAgo).length;
  const exploringUsers = users.filter((user) => Object.keys(user.worlds ?? {}).length > 0).length;
  return { totalLogins, totalOpens, activeUsers, exploringUsers };
}

function OverviewDashboard({ snapshot, users, loading, registryError, openActivity, openReports }: {
  snapshot: AdminSnapshot;
  users: AdminUserRecord[];
  loading: boolean;
  registryError: string | null;
  openActivity: () => void;
  openReports: () => void;
}) {
  const summary = accountActivitySummary(users);
  const activityByWorld = snapshot.worlds.map((world) => {
    const entries = users.map((user) => user.worlds?.[world.id]).filter(Boolean);
    return {
      ...world,
      accountCount: entries.length,
      opens: entries.reduce((sum, activity) => sum + activity.opens, 0),
    };
  });
  const maximumOpens = Math.max(1, ...activityByWorld.map((world) => world.opens));
  const recentUsers = [...users].sort((left, right) => right.lastActiveAt.localeCompare(left.lastActiveAt)).slice(0, 5);

  return (
    <div className="admin-tab-content">
      <div className="admin-stat-grid">
        <StatCard icon={<UsersRound />} label="Akun terdaftar" value={loading ? '...' : users.length} note="Registry privat server" tone="#0e7490" />
        <StatCard icon={<UserCheck />} label="Aktif 7 hari" value={loading ? '...' : summary.activeUsers} note="Berdasarkan aktivitas akun" tone="#059669" />
        <StatCard icon={<MapPinned />} label="Pembukaan pulau" value={loading ? '...' : summary.totalOpens} note="Akumulasi akun terdaftar" tone="#7c3aed" />
        <StatCard icon={<BookOpenCheck />} label="Mastery perangkat" value={`${snapshot.averageMastery}%`} note={`${snapshot.startedWorlds} dari 6 dunia dimulai`} tone="#d97706" />
        <StatCard icon={<Crown />} label="Akses perangkat" value={snapshot.subscription.active ? 'Premium' : 'Free'} note={snapshot.subscription.planName ?? 'Belum ada entitlement'} tone="#ca8a04" />
      </div>
      {registryError && <div className="admin-registry-warning" role="status"><AlertTriangle /><span><b>Registry server belum terbaca.</b>{registryError}</span></div>}
      <section className="admin-section admin-overview-grid">
        <div>
          <div className="admin-section-title"><div><b>Aktivitas enam pulau</b><span>Pembukaan pulau oleh akun terdaftar</span></div><button type="button" className="admin-row-action" onClick={openActivity}>Lihat detail <MapPinned /></button></div>
          <div className="admin-world-bars">{activityByWorld.map((world) => <div className="admin-world-bar" key={world.id}><div><b>{world.name}</b><span>{world.accountCount} akun pernah membuka</span></div><div className="admin-progress"><i style={{ width: `${world.opens ? Math.max(8, world.opens / maximumOpens * 100) : 0}%`, background: world.color }} /></div><strong>{world.opens}x</strong></div>)}</div>
        </div>
        <aside className="admin-priority">
          <b>Kondisi Brightoria sekarang</b>
          <div className="admin-priority-item"><span><ShieldCheck /></span><div><strong>Identitas dan aktivitas server aktif</strong><small>Login email, sesi admin, registry pengguna, dan pembukaan pulau sudah tersimpan privat.</small></div></div>
          <div className="admin-priority-item"><span className="warn"><Database /></span><div><strong>Mastery masih per perangkat</strong><small>Nilai, XP, dan evidence game belum disinkronkan ke akun server.</small></div></div>
          <div className="admin-priority-item"><span className="warn"><CreditCard /></span><div><strong>Pembayaran belum terhubung</strong><small>Premium masih berupa gate UI dan belum dapat diberikan manual dari portal.</small></div></div>
        </aside>
      </section>
      <section className="admin-section">
        <div className="admin-section-title"><div><b>Aktivitas akun terbaru</b><span>Lima akun terakhir yang menggunakan Brightoria</span></div><button type="button" className="admin-row-action" onClick={openReports}><FileText /> Buka laporan</button></div>
        <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Pengguna</th><th>Pulau dicoba</th><th>Total login</th><th>Aktivitas terakhir</th></tr></thead><tbody>{loading ? <tr><td colSpan={4} className="admin-table-empty">Memuat registry pengguna...</td></tr> : recentUsers.length ? recentUsers.map((user) => <tr key={user.id}><td><b>{user.displayName}</b><small>{user.email}</small></td><td>{Object.keys(user.worlds ?? {}).length} dari 6</td><td>{user.loginCount} kali</td><td>{formatDate(user.lastActiveAt)}</td></tr>) : <tr><td colSpan={4} className="admin-table-empty">Belum ada akun pemain terdaftar.</td></tr>}</tbody></table></div>
      </section>
    </div>
  );
}

function UsersDashboard({ users, loading, registryError, openReports }: {
  users: AdminUserRecord[];
  loading: boolean;
  registryError: string | null;
  openReports: () => void;
}) {
  const [query, setQuery] = useState('');
  const needle = query.trim().toLowerCase();
  const filteredUsers = users.filter((user) => !needle
    || user.displayName.toLowerCase().includes(needle)
    || user.email.toLowerCase().includes(needle));
  const summary = accountActivitySummary(users);

  return (
    <div className="admin-tab-content">
      <div className="admin-stat-grid">
        <StatCard icon={<UsersRound />} label="Total akun terdaftar" value={users.length} note="Registry privat Brightoria" tone="#0ea5e9" />
        <StatCard icon={<UserCheck />} label="Aktif 7 hari" value={summary.activeUsers} note="Berdasarkan aktivitas akun" tone="#10b981" />
        <StatCard icon={<Activity />} label="Login tercatat" value={summary.totalLogins} note="Akumulasi seluruh akun" tone="#2563eb" />
        <StatCard icon={<BookOpenCheck />} label="Sudah menjelajah" value={summary.exploringUsers} note="Pernah membuka minimal satu pulau" tone="#7c3aed" />
        <StatCard icon={<MapPinned />} label="Pembukaan pulau" value={summary.totalOpens} note="Akumulasi registry server" tone="#d97706" />
      </div>
      {registryError && <div className="admin-registry-warning" role="status"><AlertTriangle /><span><b>Registry server belum terbaca.</b>{registryError}</span></div>}
      <section className="admin-section">
        <div className="admin-section-title">
          <div><b>Pengguna Brightoria</b><span>Akun email/Google dan aktivitas pembukaan pulau</span></div>
          <label className="admin-search"><Search /><input aria-label="Cari pengguna" placeholder="Cari nama atau email..." value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table admin-user-table">
            <thead><tr><th>Pengguna / Santri</th><th>Status akun</th><th>Pulau dicoba</th><th>Login</th><th>Aktivitas terakhir</th><th>Laporan</th></tr></thead>
            <tbody>{loading ? <tr><td colSpan={6} className="admin-table-empty">Memuat registry pengguna...</td></tr> : registryError ? <tr><td colSpan={6} className="admin-table-empty">Registry server belum dapat ditampilkan.</td></tr> : filteredUsers.length ? filteredUsers.map((user) => {
              const worldEntries = Object.entries(user.worlds ?? {});
              return <tr key={user.id}>
                <td><span className="admin-avatar">{user.displayName.slice(0, 1).toUpperCase()}</span><b>{user.displayName}</b><small>{user.email} / {user.authProvider === 'google' ? 'Google' : 'Email'}</small></td>
                <td><span className="admin-status-chip verified"><Check /> Terdaftar</span><small>{user.authProvider === 'google' ? 'Google' : 'Email'} / {formatDate(user.createdAt)}</small></td>
                <td><b>{worldEntries.length} dari 6 pulau</b><small>{worldEntries.length ? worldEntries.map(([id, activity]) => `${id} (${activity.opens}x)`).join(', ') : 'Belum membuka pulau'}</small></td>
                <td><b>{user.loginCount} kali</b><small>Terakhir {formatDate(user.lastLoginAt)}</small></td>
                <td><b>{formatDate(user.lastActiveAt)}</b><small>Aktivitas akun terbaru</small></td>
                <td><button type="button" className="admin-row-action" onClick={openReports}><FileText /> Ringkasan</button></td>
              </tr>;
            }) : <tr><td colSpan={6} className="admin-table-empty">{needle ? 'Tidak ada pengguna yang cocok.' : 'Belum ada akun pemain terdaftar.'}</td></tr>}</tbody>
          </table>
        </div>
        <p className="admin-inline-note"><ShieldCheck /> Status Premium per akun belum tersedia di registry server, sehingga portal tidak menandai semua akun sebagai Free atau Premium. Mastery rinci juga masih berada di perangkat pemain.</p>
      </section>
    </div>
  );
}

function ActivityDashboard({ snapshot, users }: { snapshot: AdminSnapshot; users: AdminUserRecord[] }) {
  const rows = snapshot.worlds.map((world) => {
    const activities = users.map((user) => user.worlds?.[world.id]).filter(Boolean);
    const latest = activities.reduce<string | null>((current, activity) => !current || activity.lastPlayedAt > current ? activity.lastPlayedAt : current, null);
    return { ...world, accountCount: activities.length, opens: activities.reduce((sum, activity) => sum + activity.opens, 0), latest };
  });
  return (
    <div className="admin-tab-content">
      <ProgressChart worlds={snapshot.worlds} />
      <section className="admin-section">
        <div className="admin-section-title"><div><b>Aktivitas pulau akun terdaftar</b><span>Jumlah akun, pembukaan, dan waktu kunjungan terakhir dari registry server</span></div><span className="admin-scope-badge">Data lintas perangkat</span></div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Pulau</th><th>Akun menjelajah</th><th>Total dibuka</th><th>Kunjungan terakhir</th><th>Mastery perangkat admin</th></tr></thead>
            <tbody>{rows.map((world) => <tr key={world.id}><td><span className="admin-world-dot" style={{ background: world.color }} /><b>{world.name}</b><small>{world.subtitle}</small></td><td>{world.accountCount} akun</td><td>{world.opens} kali</td><td>{formatDate(world.latest)}</td><td><strong>{world.mastery}%</strong><small>Evidence lokal perangkat ini</small></td></tr>)}</tbody>
          </table>
        </div>
        <p className="admin-inline-note"><Database /> Pembukaan pulau tersimpan di server. Mastery, jawaban, dan XP masih lokal sehingga kolom terakhir bukan agregat seluruh pengguna.</p>
      </section>
    </div>
  );
}

function ContentDashboard() {
  return (
    <div className="admin-tab-content">
      <section className="admin-section">
        <div className="admin-section-title"><div><b>Inventaris materi dan permainan</b><span>Enam pulau yang tersedia pada build Brightoria saat ini</span></div><span className="admin-scope-badge">6 pulau aktif</span></div>
        <div className="admin-content-grid">{contentInventory.map((item) => <article key={item.id}><span className={`admin-content-world world-${item.id}`}><Gamepad2 /></span><div><b>{item.world}</b><p>{item.mechanic}</p><div><span>{item.access}</span><em>{item.review}</em></div></div></article>)}</div>
      </section>
      <section className="admin-section admin-architecture-note"><BookOpenCheck /><div><b>Status akademik tetap draft</b><p>Mekanik game sudah dapat dimainkan, tetapi isi Al-Qur'an, Bahasa Arab, adab, matematika, Bahasa Inggris, dan literasi digital masih memerlukan review serta pengesahan tim akademik Bright Academy.</p></div></section>
    </div>
  );
}

function AccessDashboard({ snapshot }: { snapshot: AdminSnapshot }) {
  const intent = snapshot.subscription.checkoutIntent;
  const intentPlan = intent ? PREMIUM_PLANS.find((plan) => plan.id === intent.planId) : null;
  return (
    <div className="admin-tab-content">
      <div className="admin-stat-grid admin-stat-grid-four">
        <StatCard icon={<Crown />} label="Status perangkat" value={snapshot.subscription.active ? 'Premium' : 'Free'} note={snapshot.subscription.planName ?? 'Tidak ada entitlement'} tone="#ca8a04" />
        <StatCard icon={<CreditCard />} label="Intent checkout" value={intent ? 1 : 0} note={intentPlan?.shortName ?? 'Belum ada'} tone="#0f766e" />
        <StatCard icon={<BadgeCheck />} label="Paket tersedia" value={PREMIUM_PLANS.length} note="Ditampilkan pada modal Premium" tone="#7c3aed" />
        <StatCard icon={<Database />} label="Verifikasi server" value="Belum" note="Payment dan entitlement belum terhubung" tone="#64748b" />
      </div>
      <section className="admin-section">
        <div className="admin-section-title"><div><b>Aturan akses Brightoria</b><span>Pembagian fitur yang benar pada aplikasi saat ini</span></div></div>
        <div className="admin-access-grid">{accessInventory.map((item) => <article key={item.tier} style={{ '--admin-tone': item.tone } as CSSProperties}><span><LockKeyhole /></span><b>{item.tier}</b><p>{item.items}</p><small>{item.note}</small></article>)}</div>
      </section>
      <section className="admin-section">
        <div className="admin-section-title"><div><b>Status akses perangkat admin</b><span>Informasi ini berasal dari browser yang sedang membuka portal, bukan seluruh akun</span></div><span className="admin-scope-badge">Perangkat aktif</span></div>
        <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Profil lokal</th><th>Paket</th><th>Status</th><th>Diverifikasi</th><th>Berakhir</th></tr></thead><tbody><tr><td><b>{snapshot.profile.name}</b><small>Data perangkat ini</small></td><td>{snapshot.subscription.planName ?? 'Free'}</td><td><span className={`admin-status-chip ${snapshot.subscription.active ? 'verified' : 'free'}`}>{snapshot.subscription.active ? <Check /> : <LockKeyhole />}{snapshot.subscription.active ? 'Aktif' : 'Free'}</span></td><td>{formatDate(snapshot.subscription.verifiedAt)}</td><td>{snapshot.subscription.status === 'lifetime' ? 'Lifetime' : formatDate(snapshot.subscription.expiresAt)}</td></tr></tbody></table></div>
        {intent && <p className="admin-inline-note"><Clock3 /> Intent terakhir: {intentPlan?.name ?? intent.planId} untuk {intent.featureId}, dibuat {formatDate(intent.createdAt)}. Belum berarti pembayaran berhasil.</p>}
        <p className="admin-inline-note"><AlertTriangle /> Portal belum dapat menetapkan Premium. Fitur itu tetap dikunci sampai payment gateway, webhook, dan entitlement server resmi tersedia.</p>
      </section>
      <section className="admin-section">
        <div className="admin-section-title"><div><b>Katalog paket yang tampil di game</b><span>Harga frontend saat ini</span></div></div>
        <div className="admin-plan-grid">{PREMIUM_PLANS.map((plan) => <article key={plan.id} className={plan.popular ? 'popular' : ''}><span>{plan.popular ? 'Paling populer' : 'Tersedia'}</span><b>{plan.name}</b><strong>{formatRupiah(plan.priceIdr)}</strong><small>{plan.monthlyLabel}</small></article>)}</div>
      </section>
    </div>
  );
}

function SystemDashboard({ snapshot }: { snapshot: AdminSnapshot }) {
  const googleConfigured = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim());
  const checkoutConfigured = Boolean(import.meta.env.VITE_PREMIUM_CHECKOUT_URL?.trim());
  const checks = [
    ['Login email pemain', 'ready', 'Hash scrypt, salt unik, dan cookie sesi HttpOnly.'],
    ['Login dan sesi admin', 'ready', 'Kredensial diverifikasi server dan login ulang diwajibkan.'],
    ['Registry akun privat', 'ready', 'Akun dan pembukaan pulau tersimpan pada private Vercel Blob.'],
    ['Evidence pembelajaran', 'local', `${snapshot.storage.recordCount} record (${snapshot.storage.approximateKb} KB) tersimpan pada perangkat ini.`],
    ['Google OAuth', googleConfigured ? 'ready' : 'blocked', googleConfigured ? 'Client ID Google tersedia pada build ini.' : 'Kode siap, tetapi Client ID resmi belum dikonfigurasi.'],
    ['Checkout Premium', checkoutConfigured ? 'local' : 'blocked', checkoutConfigured ? 'URL checkout tersedia, verifikasi entitlement server belum ada.' : 'Payment gateway, webhook, dan entitlement server belum tersedia.'],
    ['Pemulihan akun', 'blocked', 'Reset password dan relasi orang tua-anak belum tersedia.'],
    ['Keamanan lanjutan', 'blocked', 'RBAC, 2FA, dan audit aksi admin belum tersedia.'],
  ] as const;
  return (
    <div className="admin-tab-content">
      <section className="admin-section admin-security-head"><ShieldCheck /><div><span className="admin-scope-badge">Status sistem Brightoria</span><h3>Layanan yang aktif dan yang masih direncanakan</h3><p>Daftar ini mengikuti implementasi aktual, bukan simulasi fitur portal referensi.</p></div></section>
      <section className="admin-section"><div className="admin-section-title"><div><b>Kesiapan layanan</b><span>Status faktual build yang sedang dibuka</span></div></div><div className="admin-system-grid">{checks.map(([label, status, detail]) => <article key={label} className={`admin-system-check ${status}`}><span>{status === 'ready' ? <Check /> : status === 'local' ? <Database /> : <AlertTriangle />}</span><div><b>{label}</b><small>{detail}</small></div><em>{status === 'ready' ? 'Aktif' : status === 'local' ? 'Terbatas' : 'Belum'}</em></article>)}</div></section>
    </div>
  );
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

function ReportsDashboard({ snapshot, users }: { snapshot: AdminSnapshot; users: AdminUserRecord[] }) {
  const summary = accountActivitySummary(users);
  return (
    <div className="admin-tab-content">
      <section className="admin-section admin-report-head"><div><span className="admin-scope-badge">Registry server + perangkat aktif</span><h3>Laporan operasional Brightoria</h3><p>Ekspor memuat akun terdaftar, pembukaan pulau, dan evidence lokal perangkat ini. Seluruh konten akademik masih draft.</p></div><button type="button" className="admin-primary-action" onClick={() => downloadAdminReport(snapshot, users)}><Download /> Ekspor JSON</button></section>
      <div className="admin-stat-grid admin-stat-grid-four">
        <StatCard icon={<UsersRound />} label="Akun server" value={users.length} note="Registry privat" tone="#0e7490" />
        <StatCard icon={<MapPinned />} label="Pembukaan pulau" value={summary.totalOpens} note="Akumulasi akun" tone="#7c3aed" />
        <StatCard icon={<BookOpenCheck />} label="Unit lokal selesai" value={snapshot.totalCompleted} note="Evidence perangkat ini" tone="#059669" />
        <StatCard icon={<Activity />} label="Percobaan lokal" value={snapshot.totalAttempts} note="Evidence perangkat ini" tone="#d97706" />
      </div>
      <section className="admin-section"><div className="admin-section-title"><div><b>Progres per dunia</b><span>Mastery, penyelesaian, percobaan, dan aktivitas terakhir</span></div></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Dunia</th><th>Mastery</th><th>Progres</th><th>Percobaan</th><th>Aktivitas terakhir</th></tr></thead><tbody>{snapshot.worlds.map((world) => <tr key={world.id}><td><span className="admin-world-dot" style={{ background: world.color }} /><b>{world.name}</b><small>{world.subtitle}</small></td><td><strong>{world.mastery}%</strong></td><td>{world.completed} / {world.total}</td><td>{world.attempts}</td><td>{formatDate(world.updatedAt)}</td></tr>)}</tbody></table></div></section>
      <section className="admin-section"><div className="admin-section-title"><div><b>Status konten per pulau</b><span>Mekanik tersedia tidak berarti materi sudah disahkan</span></div></div><div className="admin-content-list">{contentInventory.map((item) => <div key={item.id}><b>{item.world}</b><span>{item.mechanic}</span><em>{item.review}</em></div>)}</div></section>
    </div>
  );
}

export function AdminPortal({ open, onClose }: AdminPortalProps) {
  const [accessState, setAccessState] = useState<'checking' | 'locked' | 'unlocked'>('checking');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [tab, setTab] = useState<AdminTab>('overview');
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
    setTab('overview');
    setPassword('');
    setShowPassword(false);
    setLoginError(null);
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
    { id: 'overview' as const, icon: <BarChart3 />, label: 'Ringkasan' },
    { id: 'users' as const, icon: <UsersRound />, label: 'Pengguna', count: String(users.length) },
    { id: 'activity' as const, icon: <MapPinned />, label: 'Aktivitas Pulau' },
    { id: 'content' as const, icon: <Gamepad2 />, label: 'Materi & Game', count: '6' },
    { id: 'access' as const, icon: <Crown />, label: 'Akses & Premium' },
    { id: 'system' as const, icon: <ShieldCheck />, label: 'Status Sistem' },
    { id: 'broadcast' as const, icon: <Megaphone />, label: 'Draft Info' },
    { id: 'reports' as const, icon: <FileText />, label: 'Laporan' },
  ], [users.length]);

  if (!open) return null;

  function showNotice(message: string) { setNotice(message); window.setTimeout(() => setNotice(null), 3200); }
  async function refresh() {
    setSnapshot(readAdminSnapshot());
    setUsersLoading(true);
    setUsersError(null);
    try { setUsers(await getAdminUsers()); showNotice('Registry server dan data perangkat berhasil diperbarui.'); }
    catch (error) { const message = error instanceof Error ? error.message : 'Registry pengguna belum dapat dimuat.'; setUsersError(message); showNotice(message); }
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
      setShowPassword(false);
      setSnapshot(readAdminSnapshot());
      setUsersLoading(true);
      setUsersError(null);
      try { setUsers(await getAdminUsers()); }
      catch (error) { setUsersError(error instanceof Error ? error.message : 'Registry pengguna belum dapat dimuat.'); }
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
    setUsersError(null);
    setTab('overview');
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
            <label><span>Password admin</span><div><KeyRound /><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /><button type="button" className="admin-login-password-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Sembunyikan password admin' : 'Tampilkan password admin'} title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}>{showPassword ? <EyeOff /> : <Eye />}</button></div></label>
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
          <div className="admin-title-block"><span className="admin-logo"><ShieldCheck /></span><div><div className="admin-title-line"><h2>Pusat Kendali Brightoria</h2><span>Admin Terverifikasi</span><code>Direct Link: #/admin</code></div><p>Monitoring akun, aktivitas enam pulau, materi, akses, dan kesiapan layanan Brightoria</p></div></div>
          <div className="admin-toolbar">
            <button type="button" onClick={copyLink} title="Salin link admin"><Clipboard /> <span>{copied ? 'Tersalin' : 'Link Standalone'}</span></button>
            <button type="button" className="admin-toolbar-alert" onClick={() => setTab('system')} title="Lihat status sistem"><Bell /> <span>Status Sistem</span></button>
            <button type="button" onClick={refresh} title="Segarkan data"><RefreshCw /> <span>Refresh</span></button>
            <button type="button" className="admin-toolbar-lock" onClick={lock} title="Kunci sesi"><LockKeyhole /> <span>Kunci Sesi</span></button>
            <button type="button" className="admin-close" onClick={onClose} aria-label="Tutup portal admin"><X /></button>
          </div>
        </div>
        {notice && <div className="admin-notice-toast"><Check /> {notice}</div>}
        <div className="admin-alert-band"><ShieldCheck /><div><span className="admin-alert-label">Status Brightoria Saat Ini</span><b>Enam pulau aktif, akun dan aktivitas pulau sudah tercatat di server</b><small>Mastery masih lokal; Google OAuth, payment, reset password, 2FA, dan audit admin belum aktif.</small></div><button type="button" onClick={() => setTab('system')}><ShieldCheck /> Lihat detail</button></div>
        <div className="admin-tabs" role="navigation" aria-label="Menu admin">{tabDefinitions.map((item) => <button type="button" key={item.id} className={`${tab === item.id ? 'active' : ''} admin-tab-${item.id}`} onClick={() => setTab(item.id)}>{item.icon}<span>{item.label}{item.count !== undefined ? ` (${item.count})` : ''}</span></button>)}</div>
        <div className="admin-scroll-area" ref={scrollAreaRef}>
          {tab === 'overview' && <OverviewDashboard snapshot={snapshot} users={users} loading={usersLoading} registryError={usersError} openActivity={() => setTab('activity')} openReports={() => setTab('reports')} />}
          {tab === 'users' && <UsersDashboard users={users} loading={usersLoading} registryError={usersError} openReports={() => setTab('reports')} />}
          {tab === 'activity' && <ActivityDashboard snapshot={snapshot} users={users} />}
          {tab === 'content' && <ContentDashboard />}
          {tab === 'access' && <AccessDashboard snapshot={snapshot} />}
          {tab === 'system' && <SystemDashboard snapshot={snapshot} />}
          {tab === 'broadcast' && <BroadcastDashboard notify={showNotice} />}
          {tab === 'reports' && <ReportsDashboard snapshot={snapshot} users={users} />}
          <div className="admin-footer-note"><Clock3 /> Data perangkat diperbarui {formatDate(snapshot.generatedAt)} / registry pengguna dari server / konten akademik masih draft</div>
        </div>
      </section>
    </div>
  );
}
