const fs = require('fs');
const path = require('path');
const { escapeHtml } = require('../utils/messages');

const DATA_DIR = path.join(__dirname, '../../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const DIRECTORY_FILE = path.join(DATA_DIR, 'user_directory.json');

class UserService {
  constructor() {
    this.ensureDataDir();
    this.users = this.loadJson(USERS_FILE);
    this.directory = this.loadJson(DIRECTORY_FILE);
  }

  ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  loadJson(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
      }
    } catch (error) {
      console.error(`Failed to load ${filePath}:`, error.message);
    }
    return {};
  }

  saveUsers() {
    fs.writeFileSync(USERS_FILE, JSON.stringify(this.users, null, 2));
  }

  saveDirectory() {
    fs.writeFileSync(DIRECTORY_FILE, JSON.stringify(this.directory, null, 2));
  }

  registerUser(userId, username, firstName, lastName) {
    this.directory[String(userId)] = {
      username: username || null,
      first_name: firstName || null,
      last_name: lastName || null,
      last_seen: new Date().toISOString()
    };
    this.saveDirectory();
  }

  findUserIdByUsername(username) {
    const target = username.replace('@', '').toLowerCase();
    for (const [userId, data] of Object.entries(this.directory)) {
      if (data.username && data.username.toLowerCase() === target) {
        return userId;
      }
    }
    return null;
  }

  grantAccess(userId, username, searchesPerDay, days) {
    const searches = parseInt(searchesPerDay, 10);
    const duration = parseInt(days, 10);

    if (!Number.isFinite(searches) || searches < 1) {
      return { success: false, message: 'Searches per day must be a positive number.' };
    }

    if (!Number.isFinite(duration) || duration < 1) {
      return { success: false, message: 'Access days must be a positive number.' };
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + duration);

    this.users[String(userId)] = {
      username: username || `user_${userId}`,
      searches_per_day: searches,
      granted_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      searches_used_today: 0,
      last_reset: new Date().toISOString().split('T')[0]
    };

    this.saveUsers();

    return {
      success: true,
      message: [
        '✅ <b>Access Granted</b>',
        '',
        `User: <code>${escapeHtml(username || userId)}</code>`,
        `Searches: <b>${searches}/day</b>`,
        `Duration: <b>${duration} days</b>`,
        `Expires: <b>${escapeHtml(expiresAt.toLocaleDateString())}</b>`
      ].join('\n')
    };
  }

  revokeAccess(userId) {
    const key = String(userId);
    if (!this.users[key]) {
      return { success: false, message: 'User not found in access list.' };
    }

    const name = this.users[key].username;
    delete this.users[key];
    this.saveUsers();
    return { success: true, message: `🚫 Access revoked for <code>${escapeHtml(name)}</code>.` };
  }

  resetDailyIfNeeded(user) {
    const today = new Date().toISOString().split('T')[0];
    if (user.last_reset !== today) {
      user.searches_used_today = 0;
      user.last_reset = today;
      this.saveUsers();
    }
  }

  checkAccess(userId) {
    const user = this.users[String(userId)];
    if (!user) {
      return { hasAccess: false, message: 'You do not have an active subscription.' };
    }

    if (new Date() > new Date(user.expires_at)) {
      return { hasAccess: false, message: 'Your subscription has expired.' };
    }

    this.resetDailyIfNeeded(user);

    if (user.searches_used_today >= user.searches_per_day) {
      return {
        hasAccess: false,
        message: `Daily limit reached (${user.searches_per_day} searches/day). Resets at midnight UTC.`
      };
    }

    return { hasAccess: true, user };
  }

  useSearch(userId) {
    const user = this.users[String(userId)];
    if (!user) return null;

    this.resetDailyIfNeeded(user);
    user.searches_used_today += 1;
    this.saveUsers();

    return {
      used: user.searches_used_today,
      remaining: user.searches_per_day - user.searches_used_today,
      limit: user.searches_per_day
    };
  }

  getAccountInfo(userId) {
    const user = this.users[String(userId)];
    if (!user) return null;

    this.resetDailyIfNeeded(user);

    const expiresAt = new Date(user.expires_at);
    const daysLeft = Math.max(0, Math.ceil((expiresAt - Date.now()) / 86400000));

    return {
      username: user.username,
      searches_today: `${user.searches_used_today}/${user.searches_per_day}`,
      days_left: daysLeft,
      expires_at: expiresAt.toLocaleDateString()
    };
  }

  listUsers() {
    return Object.entries(this.users).map(([userId, user]) => {
      const expiresAt = new Date(user.expires_at);
      const daysLeft = Math.ceil((expiresAt - Date.now()) / 86400000);
      return {
        userId,
        username: user.username,
        searches: `${user.searches_used_today}/${user.searches_per_day}`,
        expires_in: `${Math.max(0, daysLeft)} days`,
        expired: daysLeft <= 0
      };
    });
  }
}

module.exports = new UserService();
