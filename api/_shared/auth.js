import {
  createHmac,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);

export const ADMIN_COOKIE = 'brightoria_admin_session';
export const PLAYER_COOKIE = 'brightoria_player_session';

function sessionSecret() {
  const secret = process.env.AUTH_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('AUTH_SESSION_SECRET is not configured.');
  }
  return secret;
}

function encode(value) {
  return Buffer.from(value).toString('base64url');
}

function signature(value) {
  return createHmac('sha256', sessionSecret()).update(value).digest('base64url');
}

export function createSessionToken(payload, maxAgeSeconds) {
  const body = encode(JSON.stringify({
    ...payload,
    exp: Math.floor(Date.now() / 1000) + maxAgeSeconds,
  }));
  return `${body}.${signature(body)}`;
}

export function readSessionToken(token, expectedRole) {
  if (!token || typeof token !== 'string') return null;
  const [body, suppliedSignature] = token.split('.');
  if (!body || !suppliedSignature) return null;

  const expectedSignature = signature(body);
  const supplied = Buffer.from(suppliedSignature);
  const expected = Buffer.from(expectedSignature);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.role !== expectedRole || !Number.isFinite(payload.exp)) return null;
    if (payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function parseCookies(request) {
  const cookieHeader = request.headers?.cookie ?? '';
  return Object.fromEntries(cookieHeader.split(';').map((part) => {
    const separator = part.indexOf('=');
    if (separator < 0) return [part.trim(), ''];
    return [part.slice(0, separator).trim(), decodeURIComponent(part.slice(separator + 1))];
  }).filter(([name]) => name));
}

export function getSession(request, cookieName, role) {
  return readSessionToken(parseCookies(request)[cookieName], role);
}

export function sessionCookie(name, token, maxAgeSeconds) {
  const secure = process.env.VERCEL === '1' ? '; Secure' : '';
  return `${name}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAgeSeconds}${secure}`;
}

export function clearCookie(name) {
  const secure = process.env.VERCEL === '1' ? '; Secure' : '';
  return `${name}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`;
}

export function json(response, data, status = 200, extraHeaders = {}) {
  response.statusCode = status;
  response.setHeader('content-type', 'application/json; charset=utf-8');
  response.setHeader('cache-control', 'no-store, max-age=0');
  response.setHeader('x-content-type-options', 'nosniff');
  for (const [name, value] of Object.entries(extraHeaders)) response.setHeader(name, value);
  response.end(JSON.stringify(data));
}

export function methodNotAllowed(response, allowed) {
  return json(response, { ok: false, error: 'Metode tidak diizinkan.' }, 405, { allow: allowed });
}

export function requestIsSameOrigin(request) {
  const origin = request.headers?.origin;
  if (!origin) return true;
  try {
    return new URL(origin).host === request.headers.host;
  } catch {
    return false;
  }
}

export async function readJson(request) {
  if (request.body && typeof request.body === 'object') return request.body;
  if (typeof request.body === 'string') return JSON.parse(request.body);
  let body = '';
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 16_384) throw new Error('Request body is too large.');
  }
  return JSON.parse(body || '{}');
}

export function safeEqualText(left, right) {
  const leftDigest = createHmac('sha256', 'brightoria-credential-compare').update(String(left)).digest();
  const rightDigest = createHmac('sha256', 'brightoria-credential-compare').update(String(right)).digest();
  return timingSafeEqual(leftDigest, rightDigest);
}

export async function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const derived = await scrypt(String(password), salt, 64);
  return { salt, hash: Buffer.from(derived).toString('hex') };
}

export async function verifyPassword(password, salt, expectedHash) {
  const { hash } = await hashPassword(password, salt);
  const supplied = Buffer.from(hash, 'hex');
  const expected = Buffer.from(expectedHash, 'hex');
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

