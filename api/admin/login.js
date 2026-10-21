import {
  ADMIN_COOKIE,
  createSessionToken,
  json,
  methodNotAllowed,
  readJson,
  requestIsSameOrigin,
  safeEqualText,
  sessionCookie,
} from '../_shared/auth.js';

const ADMIN_MAX_AGE = 8 * 60 * 60;

export default async function handler(request, response) {
  if (request.method !== 'POST') return methodNotAllowed(response, 'POST');
  if (!requestIsSameOrigin(request)) return json(response, { ok: false, error: 'Permintaan lintas situs ditolak.' }, 403);

  const configuredUsername = process.env.ADMIN_USERNAME;
  const configuredPassword = process.env.ADMIN_PASSWORD;
  if (!configuredUsername || !configuredPassword) {
    return json(response, { ok: false, error: 'Kredensial admin belum dikonfigurasi pada server.' }, 503);
  }

  let body;
  try { body = await readJson(request); } catch { return json(response, { ok: false, error: 'Data login tidak valid.' }, 400); }
  const valid = safeEqualText(body?.username ?? '', configuredUsername)
    && safeEqualText(body?.password ?? '', configuredPassword);
  if (!valid) {
    await new Promise((resolve) => setTimeout(resolve, 450));
    return json(response, { ok: false, error: 'Username atau password admin salah.' }, 401);
  }

  const token = createSessionToken({ role: 'admin', username: configuredUsername }, ADMIN_MAX_AGE);
  return json(response, { ok: true, admin: { username: configuredUsername } }, 200, {
    'set-cookie': sessionCookie(ADMIN_COOKIE, token, ADMIN_MAX_AGE),
  });
}

