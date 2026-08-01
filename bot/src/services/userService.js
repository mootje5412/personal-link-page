const fs = require('fs');
const path = require('path');
const PLANS = require('../../config/plans');
const { escapeHtml } = require('../utils/messages');

const DATA_DIR = path.join(__dirname, '../../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const DIRECTORY_FILE = path.join(DATA_DIR, 'user_directory.json');

class UserService {
  constructor() {
    this.ensureDataDir();
    this.users = this.loadJson(USERS_FILE);
    this.directory = this.loadJson(DIRECTORY_FILE);
    this.migrateLegacyUsers();
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

  migrateLegacyUsers() {
    let changed = false;

    Object.values(this.users).forEach((user) => {
      if (!user.plan) {
        user.plan = 'basic';
        changed = true;
      }
      if (user.searches_per_day !== undefined) {
        delete user.searches_per_day;
        delete user.searches_used_today;
        delete user.last_reset;
        changed = true;
      }
    });

    if (changed) {
      this.saveUsers();
    }
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

  getPlan(planId) {
    return PLANS[planId] || null;
  }

  getPlans() {
    return PLANS;
  }

  grantAccess(userId, username, planId, days) {
    const plan = this.getPlan(planId.toLowerCase());
    const duration = parseInt(days, 10);

    if (!plan) {
      return {
        success: false,
        message: `Invalid plan. Available: ${Object.keys(PLANS).join(', ')}`
      };
    }

    if (!Number.isFinite(duration) || duration < 1) {
      return { success: false, message: 'Days must be a positive number.' };
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + duration);

    this.users[String(userId)] = {
      username: username || `user_${userId}`,
      plan: plan.id,
      granted_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString()
    };

    this.saveUsers();

    return {
      success: true,
      message: [
        '<b>Access Granted</b>',
        '',
        `User: <code>${escapeHtml(username || userId)}</code>`,
        `Plan: <b>${plan.name}</b>`,
        `Searches: <b>unlimited</b>`,
        `Machine Viewer: <b>${plan.machineViewer ? 'yes' : 'no'}</b>`,
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
    return { success: true, message: `Access revoked for <code>${escapeHtml(name)}</code>.` };
  }

  checkAccess(userId) {
    const user = this.users[String(userId)];
    if (!user) {
      return { hasAccess: false, message: 'No active subscription.' };
    }

    if (new Date() > new Date(user.expires_at)) {
      return { hasAccess: false, message: 'Subscription expired.' };
    }

    return { hasAccess: true, user };
  }

  hasMachineAccess(userId) {
    const access = this.checkAccess(userId);
    if (!access.hasAccess) return false;

    const plan = this.getPlan(access.user.plan);
    return plan ? plan.machineViewer : false;
  }

  getAccountInfo(userId) {
    const user = this.users[String(userId)];
    if (!user) return null;

    const plan = this.getPlan(user.plan);
    const expiresAt = new Date(user.expires_at);
    const daysLeft = Math.max(0, Math.ceil((expiresAt - Date.now()) / 86400000));

    return {
      username: user.username,
      plan: plan ? plan.name : user.plan,
      searches: 'unlimited',
      machine_viewer: plan ? plan.machineViewer : false,
      days_left: daysLeft,
      expires_at: expiresAt.toLocaleDateString()
    };
  }

  listUsers() {
    return Object.entries(this.users).map(([userId, user]) => {
      const plan = this.getPlan(user.plan);
      const expiresAt = new Date(user.expires_at);
      const daysLeft = Math.ceil((expiresAt - Date.now()) / 86400000);

      return {
        userId,
        username: user.username,
        plan: plan ? plan.name : user.plan,
        machine: plan && plan.machineViewer ? 'yes' : 'no',
        expires_in: `${Math.max(0, daysLeft)} days`,
        expired: daysLeft <= 0
      };
    });
  }
}

module.exports = new UserService();
