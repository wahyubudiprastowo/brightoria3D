import { ADMIN_COOKIE, getSession, json, methodNotAllowed } from '../_shared/auth.js';
import { listUsers, publicUser } from '../_shared/users.js';

export default async function handler(request, response) {
  if (request.method !== 'GET') return methodNotAllowed(response, 'GET');
  if (!getSession(request, ADMIN_COOKIE, 'admin')) {
    return json(response, { ok: false, error: 'Sesi admin diperlukan.' }, 401);
  }
  try {
    const users = (await listUsers()).map(publicUser);
    return json(response, { ok: true, users });
  } catch (error) {
    console.error('Unable to list Brightoria users', error);
    return json(response, { ok: false, error: 'Registry pengguna belum dapat dibaca.' }, 503);
  }
}

