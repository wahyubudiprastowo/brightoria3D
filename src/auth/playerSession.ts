export interface WorldActivity {
  opens: number;
  firstPlayedAt: string;
  lastPlayedAt: string;
}

export interface PlayerSession {
  id: string;
  email: string;
  displayName: string;
  authProvider: 'email' | 'google';
  createdAt: string;
  lastLoginAt: string;
  lastActiveAt: string;
  loginCount: number;
  worlds: Record<string, WorldActivity>;
}

export interface AdminUserRecord extends PlayerSession {}

interface ApiPayload {
  ok?: boolean;
  error?: string;
  player?: PlayerSession;
  users?: AdminUserRecord[];
}

async function apiRequest(path: string, init?: RequestInit): Promise<ApiPayload> {
  let response: Response;
  try {
    response = await fetch(path, {
      credentials: 'same-origin',
      ...init,
      headers: init?.body ? { 'content-type': 'application/json', ...init.headers } : init?.headers,
    });
  } catch {
    throw new Error('Server akun tidak dapat dijangkau. Jalankan ulang aplikasi dengan npm run dev:full.');
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    throw new Error(import.meta.env.DEV
      ? 'API login tidak aktif pada server lokal. Hentikan server lama lalu jalankan npm run dev:full.'
      : `Layanan akun memberi respons yang tidak valid (HTTP ${response.status}).`);
  }

  const payload = await response.json().catch(() => ({})) as ApiPayload;
  if (!response.ok) throw new Error(payload.error || 'Layanan Brightoria belum dapat dihubungi.');
  return payload;
}

export async function getPlayerSession(): Promise<PlayerSession | null> {
  try {
    const response = await fetch('/api/auth/session', { credentials: 'same-origin', cache: 'no-store' });
    if (response.status === 401) return null;
    const payload = await response.json() as ApiPayload;
    if (!response.ok) throw new Error(payload.error || 'Sesi pemain belum dapat diperiksa.');
    return payload.player ?? null;
  } catch (error) {
    if (error instanceof TypeError) throw new Error('Server akun tidak aktif. Jalankan npm run dev:full untuk pengembangan lokal.');
    throw error;
  }
}

export async function authenticateEmail(input: {
  mode: 'login' | 'register';
  name?: string;
  email: string;
  password: string;
}): Promise<PlayerSession> {
  const payload = await apiRequest('/api/auth/email', { method: 'POST', body: JSON.stringify(input) });
  if (!payload.player) throw new Error('Respons akun tidak lengkap.');
  return payload.player;
}

export async function authenticateGoogle(credential: string): Promise<PlayerSession> {
  const payload = await apiRequest('/api/auth/google', { method: 'POST', body: JSON.stringify({ credential }) });
  if (!payload.player) throw new Error('Respons Google tidak lengkap.');
  return payload.player;
}

export async function logoutPlayer(): Promise<void> {
  await apiRequest('/api/auth/logout', { method: 'POST' });
}

export async function recordWorldEntry(worldId: string): Promise<void> {
  await apiRequest('/api/activity', { method: 'POST', body: JSON.stringify({ worldId }) });
}

export async function getAdminUsers(): Promise<AdminUserRecord[]> {
  const payload = await apiRequest('/api/admin/users');
  return payload.users ?? [];
}

export async function checkAdminSession(): Promise<boolean> {
  const response = await fetch('/api/admin/session', { credentials: 'same-origin', cache: 'no-store' });
  return response.ok;
}

export async function loginAdmin(username: string, password: string): Promise<void> {
  await apiRequest('/api/admin/login', { method: 'POST', body: JSON.stringify({ username, password }) });
}

export async function logoutAdmin(): Promise<void> {
  await apiRequest('/api/admin/logout', { method: 'POST' });
}

