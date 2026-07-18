const fs = require('fs');
const path = require('path');

const USERS_FILE = path.join(__dirname, '../../data/users.json');

// Plan definitions
const PLANS = {
  basic: { name: 'Basic', credits_per_day: 50, price: '5 EUR' },
  standard: { name: 'Standard', credits_per_day: 150, price: '10 EUR' },
  premium: { name: 'Premium', credits_per_day: 500, price: '25 EUR' }
};

class UserService {
  constructor() {
    this.users = this.loadUsers();
    this.usageTracking = new Map();
  }

  loadUsers() {
    try {
      const dataDir = path.join(__dirname, '../../data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      if (fs.existsSync(USERS_FILE)) {
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        return JSON.parse(data);
      }
      return {};
    } catch (error) {
      console.error('Error loading users:', error);
      return {};
    }
  }

  saveUsers() {
    try {
      const dataDir = path.join(__dirname, '../../data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(USERS_FILE, JSON.stringify(this.users, null, 2));
    } catch (error) {
      console.error('Error saving users:', error);
    }
  }

  grantAccess(userId, username, plan, days) {
    const validPlans = Object.keys(PLANS);
    if (!validPlans.includes(plan)) {
      return { success: false, message: `Invalid plan. Choose: ${validPlans.join(', ')}` };
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + parseInt(days));

    this.users[userId] = {
      username: username,
      plan: plan,
      credits_per_day: PLANS[plan].credits_per_day,
      granted_at: new Date().toISOString(),
      expires_at: expiryDate.toISOString(),
      credits_used_today: 0,
      last_reset: new Date().toISOString().split('T')[0]
    };

    this.saveUsers();

    return {
      success: true,
      message: `Access granted to @${username}\n\nPlan: ${PLANS[plan].name}\nCredits: ${PLANS[plan].credits_per_day}/day\nExpires: ${expiryDate.toLocaleDateString()}`
    };
  }

  revokeAccess(userId) {
    if (this.users[userId]) {
      const username = this.users[userId].username;
      delete this.users[userId];
      this.saveUsers();
      return { success: true, message: `Access revoked for @${username}` };
    }
    return { success: false, message: 'User not found' };
  }

  checkAccess(userId) {
    const user = this.users[userId];
    if (!user) {
      return { hasAccess: false, message: 'No active subscription' };
    }

    // Check if expired
    const now = new Date();
    const expiryDate = new Date(user.expires_at);
    if (now > expiryDate) {
      return { hasAccess: false, message: 'Subscription expired' };
    }

    // Reset daily credits if needed
    const today = new Date().toISOString().split('T')[0];
    if (user.last_reset !== today) {
      user.credits_used_today = 0;
      user.last_reset = today;
      this.saveUsers();
    }

    // Check credits
    if (user.credits_used_today >= user.credits_per_day) {
      return { hasAccess: false, message: 'Daily credit limit reached' };
    }

    return { hasAccess: true, user: user };
  }

  useCredit(userId) {
    const user = this.users[userId];
    if (user) {
      user.credits_used_today++;
      this.saveUsers();
      return {
        used: user.credits_used_today,
        remaining: user.credits_per_day - user.credits_used_today
      };
    }
    return null;
  }

  getUserInfo(userId) {
    const user = this.users[userId];
    if (!user) {
      return null;
    }

    const expiryDate = new Date(user.expires_at);
    const daysLeft = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));

    return {
      username: user.username,
      plan: PLANS[user.plan].name,
      credits_today: `${user.credits_used_today}/${user.credits_per_day}`,
      expires_in: `${daysLeft} days`,
      expires_at: expiryDate.toLocaleDateString()
    };
  }

  listAllUsers() {
    const userList = [];
    Object.keys(this.users).forEach(userId => {
      const user = this.users[userId];
      const expiryDate = new Date(user.expires_at);
      const daysLeft = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
      
      userList.push({
        userId,
        username: user.username,
        plan: PLANS[user.plan].name,
        credits: `${user.credits_used_today}/${user.credits_per_day}`,
        expires_in: `${daysLeft} days`,
        expired: daysLeft <= 0
      });
    });
    return userList;
  }

  getPlans() {
    return PLANS;
  }
}

module.exports = new UserService();
