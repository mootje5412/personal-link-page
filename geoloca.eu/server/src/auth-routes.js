import argon2 from 'argon2';
import { OAuth2Client } from 'google-auth-library';
import {
  createSession,
  createUser,
  deleteSession,
  deleteUserSessions,
  getSession,
  getUserByEmail,
  getUserByGoogleSub,
  purgeExpiredSessions,
  toPublicUser,
  updateUserGoogle,
} from './db.js';
import { googleSchema, loginSchema, registerSchema } from './validate.js';
import {
  assertSameOrigin,
  clearSessionCookie,
  getSessionIdFromReq,
  newSessionId,
  normalizeEmail,
  sanitizeName,
  sessionExpiryIso,
  setSessionCookie,
} from './security.js';

const googleClient = process.env.GOOGLE_CLIENT_ID
  ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
  : null;

function secureCookie(req) {
  return req.secure || req.get('x-forwarded-proto') === 'https';
}

async function startSession(req, res, userId) {
  purgeExpiredSessions();
  const sessionId = newSessionId();
  createSession(sessionId, userId, sessionExpiryIso());
  setSessionCookie(res, sessionId, secureCookie(req));
  return sessionId;
}

export function attachAuthRoutes(app, allowedOrigins) {
  app.use('/api/auth', (req, res, next) => {
    if (!assertSameOrigin(req, allowedOrigins)) {
      return res.status(403).json({ error: 'Forbidden.' });
    }
    next();
  });

  app.post('/api/auth/register', async (req, res) => {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || 'Invalid input.' });
      }

      const name = sanitizeName(parsed.data.name);
      const email = normalizeEmail(parsed.data.email);
      if (!name) return res.status(400).json({ error: 'Please enter a valid name.' });

      const existing = getUserByEmail(email);
      if (existing) {
        return res.status(409).json({ error: 'An account with this email already exists.' });
      }

      const password_hash = await argon2.hash(parsed.data.password, {
        type: argon2.argon2id,
        memoryCost: 19456,
        timeCost: 2,
        parallelism: 1,
      });

      const user = createUser({
        email,
        name,
        password_hash,
        google_sub: null,
        avatar_url: null,
        provider: 'email',
      });

      await startSession(req, res, user.id);
      return res.status(201).json({ user: toPublicUser(user) });
    } catch {
      return res.status(500).json({ error: 'Registration failed.' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid email or password.' });
      }

      const email = normalizeEmail(parsed.data.email);
      const user = getUserByEmail(email);

      if (!user || !user.password_hash) {
        await argon2.hash(parsed.data.password, { type: argon2.argon2id });
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const valid = await argon2.verify(user.password_hash, parsed.data.password);
      if (!valid) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      deleteUserSessions(user.id);
      await startSession(req, res, user.id);
      return res.json({ user: toPublicUser(user) });
    } catch {
      return res.status(500).json({ error: 'Login failed.' });
    }
  });

  app.post('/api/auth/google', async (req, res) => {
    try {
      if (!googleClient) {
        return res.status(503).json({ error: 'Google sign-in is not configured.' });
      }

      const parsed = googleSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid Google credential.' });
      }

      const ticket = await googleClient.verifyIdToken({
        idToken: parsed.data.credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload?.email || !payload.sub) {
        return res.status(401).json({ error: 'Google sign-in failed.' });
      }

      const email = normalizeEmail(payload.email);
      const name = sanitizeName(payload.name || email.split('@')[0] || 'User');
      const avatar = payload.picture?.slice(0, 512) || null;

      let user = getUserByGoogleSub(payload.sub) || getUserByEmail(email);

      if (user) {
        user = updateUserGoogle(user.id, {
          name,
          avatar_url: avatar,
          google_sub: payload.sub,
        });
      } else {
        user = createUser({
          email,
          name,
          password_hash: null,
          google_sub: payload.sub,
          avatar_url: avatar,
          provider: 'google',
        });
      }

      deleteUserSessions(user.id);
      await startSession(req, res, user.id);
      return res.json({ user: toPublicUser(user) });
    } catch {
      return res.status(401).json({ error: 'Google sign-in failed.' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    const sessionId = getSessionIdFromReq(req);
    if (sessionId) deleteSession(sessionId);
    clearSessionCookie(res, secureCookie(req));
    return res.json({ ok: true });
  });

  app.get('/api/auth/me', (req, res) => {
    purgeExpiredSessions();
    const sessionId = getSessionIdFromReq(req);
    if (!sessionId) return res.status(401).json({ error: 'Not authenticated.' });

    const session = getSession(sessionId);
    if (!session || session.expires_at <= new Date().toISOString().slice(0, 19).replace('T', ' ')) {
      if (sessionId) deleteSession(sessionId);
      clearSessionCookie(res, secureCookie(req));
      return res.status(401).json({ error: 'Session expired.' });
    }

    return res.json({
      user: toPublicUser(session),
    });
  });
}
