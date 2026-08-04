import crypto from 'crypto';

const SESSION_DAYS = 14;
const SESSION_COOKIE = 'geoloca_session';

export function sessionCookieName() {
  return SESSION_COOKIE;
}

export function newSessionId() {
  return crypto.randomBytes(32).toString('hex');
}

export function sessionExpiryIso() {
  const d = new Date();
  d.setDate(d.getDate() + SESSION_DAYS);
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

export function sanitizeName(raw) {
  return raw
    .replace(/[<>"'`&]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
}

export function normalizeEmail(raw) {
  return raw.trim().toLowerCase().slice(0, 254);
}

export function setSessionCookie(res, sessionId, secure) {
  res.cookie(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure,
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
  });
}

export function clearSessionCookie(res, secure) {
  res.cookie(SESSION_COOKIE, '', {
    httpOnly: true,
    secure,
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
}

export function getSessionIdFromReq(req) {
  const raw = req.cookies?.[SESSION_COOKIE];
  if (!raw || typeof raw !== 'string' || !/^[a-f0-9]{64}$/.test(raw)) return null;
  return raw;
}

export function assertSameOrigin(req, allowedOrigins) {
  if (req.method === 'GET' || req.method === 'HEAD') return true;
  const origin = req.get('origin');
  if (!origin) return req.get('sec-fetch-site') === 'same-origin';
  return allowedOrigins.includes(origin);
}
