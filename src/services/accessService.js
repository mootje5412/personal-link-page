const fs = require('fs');
const path = require('path');
const config = require('../../config/config');

const ACCESS_FILE = path.join(__dirname, '../../', config.accessFile);
const ACCESS_MS = config.accessDays * 24 * 60 * 60 * 1000;

function ensureDataDir() {
  fs.mkdirSync(path.dirname(ACCESS_FILE), { recursive: true });
}

function defaultData() {
  return {
    users: {},
    pendingUsernames: {},
  };
}

function loadData() {
  ensureDataDir();

  if (!fs.existsSync(ACCESS_FILE)) {
    return defaultData();
  }

  try {
    const raw = fs.readFileSync(ACCESS_FILE, 'utf8');
    const data = JSON.parse(raw);
    return {
      users: data.users || {},
      pendingUsernames: data.pendingUsernames || {},
    };
  } catch {
    return defaultData();
  }
}

function saveData(data) {
  ensureDataDir();
  fs.writeFileSync(ACCESS_FILE, JSON.stringify(data, null, 2));
}

function normalizeUsername(username) {
  return String(username || '').trim().replace(/^@/, '').toLowerCase();
}

function isAdmin(user) {
  const username = normalizeUsername(user?.username);
  return config.adminUsernames.includes(username);
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function cleanupExpired(data) {
  const now = Date.now();
  let changed = false;

  Object.entries(data.users).forEach(([userId, entry]) => {
    if (new Date(entry.expiresAt).getTime() <= now) {
      delete data.users[userId];
      changed = true;
    }
  });

  Object.entries(data.pendingUsernames).forEach(([username, entry]) => {
    if (new Date(entry.expiresAt).getTime() <= now) {
      delete data.pendingUsernames[username];
      changed = true;
    }
  });

  return changed;
}

function activatePendingForUser(data, user) {
  const username = normalizeUsername(user?.username);
  const userId = String(user?.id || '');

  if (!username || !userId || !data.pendingUsernames[username]) {
    return data;
  }

  const pending = data.pendingUsernames[username];
  data.users[userId] = {
    userId,
    username,
    firstName: user.first_name || '',
    grantedBy: pending.grantedBy,
    grantedAt: pending.grantedAt,
    expiresAt: pending.expiresAt,
  };
  delete data.pendingUsernames[username];
  return data;
}

function getAccessEntry(user) {
  const data = loadData();
  cleanupExpired(data);
  activatePendingForUser(data, user);
  saveData(data);

  const userId = String(user?.id || '');
  const username = normalizeUsername(user?.username);

  if (data.users[userId]) {
    return data.users[userId];
  }

  if (username && data.pendingUsernames[username]) {
    return data.pendingUsernames[username];
  }

  return null;
}

function hasAccess(user) {
  if (isAdmin(user)) {
    return {
      allowed: true,
      admin: true,
    };
  }

  const entry = getAccessEntry(user);
  if (!entry) {
    return {
      allowed: false,
      reason: 'Geen actieve toegang.',
    };
  }

  const expiresAt = new Date(entry.expiresAt).getTime();
  if (expiresAt <= Date.now()) {
    return {
      allowed: false,
      reason: 'Je toegang is verlopen.',
      expiredAt: entry.expiresAt,
    };
  }

  return {
    allowed: true,
    expiresAt: entry.expiresAt,
    daysLeft: Math.ceil((expiresAt - Date.now()) / (24 * 60 * 60 * 1000)),
  };
}

function parseTarget(rawTarget) {
  const target = String(rawTarget || '').trim();

  if (!target) {
    return null;
  }

  if (/^\d+$/.test(target)) {
    return { type: 'id', value: target };
  }

  return { type: 'username', value: normalizeUsername(target) };
}

function grantAccess(adminUser, rawTarget) {
  if (!isAdmin(adminUser)) {
    return {
      ok: false,
      message: 'Alleen @strafbaar en @jacksb06 kunnen toegang geven.',
    };
  }

  const target = parseTarget(rawTarget);
  if (!target) {
    return {
      ok: false,
      message: 'Gebruik: /toegang gebruikersnaam\nBijvoorbeeld: /toegang @gebruiker',
    };
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + ACCESS_MS);
  const grantedBy = normalizeUsername(adminUser.username) || String(adminUser.id);
  const data = loadData();
  cleanupExpired(data);

  const entry = {
    grantedBy,
    grantedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  if (target.type === 'id') {
    data.users[target.value] = {
      ...entry,
      userId: target.value,
      username: data.users[target.value]?.username || '',
    };
  } else {
    const existingUser = Object.values(data.users).find(
      (user) => normalizeUsername(user.username) === target.value,
    );

    if (existingUser) {
      data.users[existingUser.userId] = {
        ...existingUser,
        ...entry,
        username: target.value,
      };
    } else {
      data.pendingUsernames[target.value] = {
        ...entry,
        username: target.value,
      };
    }
  }

  saveData(data);

  const label = target.type === 'id' ? `ID ${target.value}` : `@${target.value}`;

  return {
    ok: true,
    message: `✅ Toegang gegeven aan ${label}\n\nGeldig tot: ${formatDate(expiresAt)}\nDuur: ${config.accessDays} dagen`,
  };
}

function revokeAccess(adminUser, rawTarget) {
  if (!isAdmin(adminUser)) {
    return {
      ok: false,
      message: 'Alleen @strafbaar en @jacksb06 kunnen toegang intrekken.',
    };
  }

  const target = parseTarget(rawTarget);
  if (!target) {
    return {
      ok: false,
      message: 'Gebruik: /toegang weg gebruikersnaam',
    };
  }

  const data = loadData();
  let removed = false;

  if (target.type === 'id') {
    if (data.users[target.value]) {
      delete data.users[target.value];
      removed = true;
    }
  } else if (data.pendingUsernames[target.value]) {
    delete data.pendingUsernames[target.value];
    removed = true;
  } else {
    Object.entries(data.users).forEach(([userId, user]) => {
      if (normalizeUsername(user.username) === target.value) {
        delete data.users[userId];
        removed = true;
      }
    });
  }

  saveData(data);

  if (!removed) {
    return {
      ok: false,
      message: 'Geen actieve toegang gevonden voor die gebruiker.',
    };
  }

  const label = target.type === 'id' ? `ID ${target.value}` : `@${target.value}`;
  return {
    ok: true,
    message: `🚫 Toegang ingetrokken voor ${label}`,
  };
}

function getAccessDeniedMessage() {
  return `❌ Geen toegang

Deze bot kost 20 euro per maand.

Neem contact op met @strafbaar of @jacksb06 op Telegram om toegang te kopen.`;
}

module.exports = {
  hasAccess,
  grantAccess,
  revokeAccess,
  isAdmin,
  getAccessDeniedMessage,
  formatDate,
};
