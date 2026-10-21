import {
  PLAYER_COOKIE,
  createSessionToken,
  hashPassword,
  json,
  methodNotAllowed,
  readJson,
  requestIsSameOrigin,
  sessionCookie,
  verifyPassword,
} from '../_shared/auth.js';
import { createUser, findUserByEmail, publicUser, updateUserByEmail } from '../_shared/users.js';

const PLAYER_MAX_AGE = 30 * 24 * 60 * 60;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cleanName(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, 60);
}

function cleanEmail(value) {
  return String(value ?? '').trim().toLowerCase().slice(0, 254);
}

function playerResponse(response, record, status = 200) {
  const token = createSessionToken({
    role: 'player',
    id: record.id,
    email: record.email,
    name: record.displayName,
  }, PLAYER_MAX_AGE);
  return json(response, { ok: true, player: publicUser(record) }, status, {
    'set-cookie': sessionCookie(PLAYER_COOKIE, token, PLAYER_MAX_AGE),
  });
}

export default async function handler(request, response) {
  if (request.method !== 'POST') return methodNotAllowed(response, 'POST');
  if (!requestIsSameOrigin(request)) return json(response, { ok: false, error: 'Permintaan lintas situs ditolak.' }, 403);

  let body;
  try { body = await readJson(request); } catch { return json(response, { ok: false, error: 'Data akun tidak valid.' }, 400); }
  const mode = body?.mode === 'register' ? 'register' : 'login';
  const email = cleanEmail(body?.email);
  const password = String(body?.password ?? '');
  const displayName = cleanName(body?.name);

  if (!EMAIL_PATTERN.test(email)) return json(response, { ok: false, error: 'Masukkan alamat email yang valid.' }, 400);
  if (password.length < 8 || password.length > 128) return json(response, { ok: false, error: 'Password harus terdiri dari 8-128 karakter.' }, 400);

  try {
    const existing = await findUserByEmail(email);
    if (mode === 'register') {
      if (displayName.length < 2) return json(response, { ok: false, error: 'Masukkan nama pemain minimal 2 karakter.' }, 400);
      if (existing) return json(response, { ok: false, error: 'Email ini sudah terdaftar. Silakan masuk.' }, 409);
      const credentials = await hashPassword(password);
      try {
        const created = await createUser({
          email,
          displayName,
          passwordSalt: credentials.salt,
          passwordHash: credentials.hash,
        });
        return playerResponse(response, created, 201);
      } catch (error) {
        const racedUser = await findUserByEmail(email);
        if (racedUser) return json(response, { ok: false, error: 'Email ini sudah terdaftar. Silakan masuk.' }, 409);
        throw error;
      }
    }

    if (existing && (!existing.record.passwordSalt || !existing.record.passwordHash)) {
      return json(response, { ok: false, error: 'Akun ini terdaftar melalui Google. Gunakan tombol Google untuk masuk.' }, 409);
    }
    if (!existing || !(await verifyPassword(password, existing.record.passwordSalt, existing.record.passwordHash))) {
      await new Promise((resolve) => setTimeout(resolve, 450));
      return json(response, { ok: false, error: 'Email atau password tidak sesuai.' }, 401);
    }
    const updated = await updateUserByEmail(email, (record) => ({
      ...record,
      lastLoginAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      loginCount: (Number(record.loginCount) || 0) + 1,
    }));
    return playerResponse(response, updated ?? existing.record);
  } catch (error) {
    console.error('Brightoria email authentication failed', error);
    return json(response, { ok: false, error: 'Layanan akun sedang tidak tersedia. Coba lagi sebentar.' }, 503);
  }
}

