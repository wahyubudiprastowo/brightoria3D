import { ADMIN_COOKIE, getSession, json, methodNotAllowed } from '../_shared/auth.js';

export default function handler(request, response) {
  if (request.method !== 'GET') return methodNotAllowed(response, 'GET');
  const session = getSession(request, ADMIN_COOKIE, 'admin');
  if (!session) return json(response, { ok: false, authenticated: false }, 401);
  return json(response, { ok: true, authenticated: true, admin: { username: session.username } });
}

