import {
  PLAYER_COOKIE,
  createSessionToken,
  json,
  methodNotAllowed,
  readJson,
  requestIsSameOrigin,
  sessionCookie,
} from '../_shared/auth.js';
import { createUser, findUserByEmail, publicUser, updateUserByEmail } from '../_shared/users.js';

const PLAYER_MAX_AGE = 30 * 24 * 60 * 60;

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
  if (!process.env.GOOGLE_CLIENT_ID) {
    return json(response, { ok: false, error: 'Login Google belum dikonfigurasi oleh admin.' }, 503);
  }

  let body;
  try { body = await readJson(request); } catch { return json(response, { ok: false, error: 'Token Google tidak valid.' }, 400); }
  const credential = String(body?.credential ?? '');
  if (!credential || credential.length > 5000) return json(response, { ok: false, error: 'Token Google tidak valid.' }, 400);

  try {
    const verification = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
    if (!verification.ok) return json(response, { ok: false, error: 'Login Google tidak dapat diverifikasi.' }, 401);
    const profile = await verification.json();
    const validIssuer = profile.iss === 'accounts.google.com' || profile.iss === 'https://accounts.google.com';
    if (profile.aud !== process.env.GOOGLE_CLIENT_ID || profile.email_verified !== 'true' || !validIssuer) {
      return json(response, { ok: false, error: 'Akun Google tidak valid untuk Brightoria.' }, 401);
    }

    const email = String(profile.email).trim().toLowerCase();
    const name = String(profile.name || profile.given_name || email.split('@')[0]).trim().slice(0, 60);
    const existing = await findUserByEmail(email);
    if (!existing) {
      const created = await createUser({ email, displayName: name, authProvider: 'google' });
      return playerResponse(response, created, 201);
    }
    const updated = await updateUserByEmail(email, (record) => ({
      ...record,
      displayName: record.displayName || name,
      lastLoginAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      loginCount: (Number(record.loginCount) || 0) + 1,
    }));
    return playerResponse(response, updated ?? existing.record);
  } catch (error) {
    console.error('Brightoria Google authentication failed', error);
    return json(response, { ok: false, error: 'Login Google sedang tidak tersedia.' }, 503);
  }
}
