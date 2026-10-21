import { createHash, randomUUID } from 'node:crypto';
import { BlobPreconditionFailedError, get, list, put } from '@vercel/blob';

const PREFIX = 'brightoria-users/';

function normalizedEmail(email) {
  return String(email ?? '').trim().toLowerCase();
}

function pathForEmail(email) {
  const digest = createHash('sha256').update(normalizedEmail(email)).digest('hex');
  return `${PREFIX}${digest}.json`;
}

async function readPath(pathname) {
  const result = await get(pathname, { access: 'private', useCache: false });
  if (!result) return null;
  const text = await new Response(result.stream).text();
  return { record: JSON.parse(text), etag: result.blob.etag };
}

async function writePath(pathname, record, options = {}) {
  return put(pathname, JSON.stringify(record), {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: options.allowOverwrite ?? false,
    ifMatch: options.ifMatch,
    contentType: 'application/json; charset=utf-8',
  });
}

export async function findUserByEmail(email) {
  const normalized = normalizedEmail(email);
  if (!normalized) return null;
  return readPath(pathForEmail(normalized));
}

export async function createUser({ email, displayName, passwordSalt = null, passwordHash = null, authProvider = 'email' }) {
  const normalized = normalizedEmail(email);
  const now = new Date().toISOString();
  const record = {
    id: randomUUID(),
    email: normalized,
    displayName: String(displayName).trim(),
    authProvider,
    passwordSalt,
    passwordHash,
    createdAt: now,
    lastLoginAt: now,
    lastActiveAt: now,
    loginCount: 1,
    worlds: {},
  };
  await writePath(pathForEmail(normalized), record);
  return record;
}

export async function updateUserByEmail(email, updater) {
  const pathname = pathForEmail(email);
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const current = await readPath(pathname);
    if (!current) return null;
    const next = updater(structuredClone(current.record));
    try {
      await writePath(pathname, next, { allowOverwrite: true, ifMatch: current.etag });
      return next;
    } catch (error) {
      if (!(error instanceof BlobPreconditionFailedError) || attempt === 3) throw error;
    }
  }
  return null;
}

export async function listUsers() {
  const records = [];
  let cursor;
  do {
    const page = await list({ prefix: PREFIX, cursor, limit: 1000 });
    for (const blob of page.blobs) {
      try {
        const current = await readPath(blob.pathname);
        if (current?.record) records.push(current.record);
      } catch {
        // One malformed record must not make the complete admin list unavailable.
      }
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return records.sort((a, b) => String(b.lastActiveAt).localeCompare(String(a.lastActiveAt)));
}

export function publicUser(record) {
  return {
    id: record.id,
    email: record.email,
    displayName: record.displayName,
    authProvider: record.authProvider ?? 'email',
    createdAt: record.createdAt,
    lastLoginAt: record.lastLoginAt,
    lastActiveAt: record.lastActiveAt,
    loginCount: record.loginCount,
    worlds: record.worlds ?? {},
  };
}

