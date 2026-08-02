const SESSION_TTL_MS = 15 * 60 * 1000
const sessions = new Map()

function randomId() {
  return Math.random().toString(36).slice(2, 10)
}

export function createSession(payload) {
  cleanupExpired()

  const id = randomId()
  sessions.set(id, {
    ...payload,
    createdAt: Date.now(),
  })

  return id
}

export function getSession(id) {
  const session = sessions.get(id)
  if (!session) return null

  if (Date.now() - session.createdAt > SESSION_TTL_MS) {
    sessions.delete(id)
    return null
  }

  return session
}

function cleanupExpired() {
  const now = Date.now()
  for (const [id, session] of sessions.entries()) {
    if (now - session.createdAt > SESSION_TTL_MS) {
      sessions.delete(id)
    }
  }
}
