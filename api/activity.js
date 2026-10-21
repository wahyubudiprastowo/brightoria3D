import { PLAYER_COOKIE, getSession, json, methodNotAllowed, readJson, requestIsSameOrigin } from './_shared/auth.js';
import { updateUserByEmail } from './_shared/users.js';

const WORLD_IDS = new Set(['quran', 'adab', 'math', 'digital', 'english', 'arabic']);

export default async function handler(request, response) {
  if (request.method !== 'POST') return methodNotAllowed(response, 'POST');
  if (!requestIsSameOrigin(request)) return json(response, { ok: false, error: 'Permintaan lintas situs ditolak.' }, 403);
  const session = getSession(request, PLAYER_COOKIE, 'player');
  if (!session) return json(response, { ok: false, error: 'Sesi pemain diperlukan.' }, 401);

  let body;
  try { body = await readJson(request); } catch { return json(response, { ok: false, error: 'Aktivitas tidak valid.' }, 400); }
  if (!WORLD_IDS.has(body?.worldId)) return json(response, { ok: false, error: 'Pulau tidak dikenal.' }, 400);

  try {
    const now = new Date().toISOString();
    const updated = await updateUserByEmail(session.email, (record) => {
      const previous = record.worlds?.[body.worldId];
      return {
        ...record,
        lastActiveAt: now,
        worlds: {
          ...(record.worlds ?? {}),
          [body.worldId]: {
            opens: (Number(previous?.opens) || 0) + 1,
            firstPlayedAt: previous?.firstPlayedAt ?? now,
            lastPlayedAt: now,
          },
        },
      };
    });
    if (!updated) return json(response, { ok: false, error: 'Akun pemain tidak ditemukan.' }, 404);
    return json(response, { ok: true, activity: updated.worlds[body.worldId] });
  } catch (error) {
    console.error('Unable to record Brightoria activity', error);
    return json(response, { ok: false, error: 'Aktivitas belum dapat disimpan.' }, 503);
  }
}

