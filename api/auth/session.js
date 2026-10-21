import { PLAYER_COOKIE, getSession, json, methodNotAllowed } from '../_shared/auth.js';
import { findUserByEmail, publicUser } from '../_shared/users.js';

export default async function handler(request, response) {
  if (request.method !== 'GET') return methodNotAllowed(response, 'GET');
  const session = getSession(request, PLAYER_COOKIE, 'player');
  if (!session) return json(response, { ok: false, authenticated: false }, 401);
  try {
    const user = await findUserByEmail(session.email);
    if (!user || user.record.id !== session.id) return json(response, { ok: false, authenticated: false }, 401);
    return json(response, { ok: true, authenticated: true, player: publicUser(user.record) });
  } catch (error) {
    console.error('Unable to read Brightoria player session', error);
    return json(response, { ok: false, error: 'Sesi pemain belum dapat diperiksa.' }, 503);
  }
}

