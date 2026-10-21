import { ADMIN_COOKIE, clearCookie, json, methodNotAllowed, requestIsSameOrigin } from '../_shared/auth.js';

export default function handler(request, response) {
  if (request.method !== 'POST') return methodNotAllowed(response, 'POST');
  if (!requestIsSameOrigin(request)) return json(response, { ok: false, error: 'Permintaan lintas situs ditolak.' }, 403);
  return json(response, { ok: true }, 200, { 'set-cookie': clearCookie(ADMIN_COOKIE) });
}

