const db = require('../../database/init');
const config = require('../../config/config');

class UserService {
  isOwner(telegramId) {
    return config.adminUserId > 0 && Number(telegramId) === Number(config.adminUserId);
  }

  registerUser(telegramUser) {
    const { id, username, first_name, last_name } = telegramUser;

    const existing = db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(id);

    if (existing) {
      db.prepare(`
        UPDATE users
        SET username = ?, first_name = ?, last_name = ?, updated_at = datetime('now')
        WHERE telegram_id = ?
      `).run(username || null, first_name || null, last_name || null, id);
      return existing;
    }

    db.prepare(`
      INSERT INTO users (telegram_id, username, first_name, last_name)
      VALUES (?, ?, ?, ?)
    `).run(id, username || null, first_name || null, last_name || null);

    return db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(id);
  }

  getUser(telegramId) {
    return db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(telegramId);
  }

  getActivePlan(telegramId) {
    if (this.isOwner(telegramId)) {
      return {
        ...config.ownerPlan,
        expires_at: null,
        isOwner: true
      };
    }

    const user = this.getUser(telegramId);
    if (!user || !user.plan_id || !user.plan_expires_at) {
      return null;
    }

    const expires = new Date(user.plan_expires_at);
    if (expires <= new Date()) {
      return null;
    }

    const plan = config.plans.find((p) => p.id === user.plan_id);
    if (!plan) {
      return null;
    }

    return { ...plan, expires_at: user.plan_expires_at, isOwner: false };
  }

  activatePlan(telegramId, planId, days = 30) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    db.prepare(`
      UPDATE users
      SET plan_id = ?, plan_expires_at = ?, updated_at = datetime('now')
      WHERE telegram_id = ?
    `).run(planId, expiresAt.toISOString(), telegramId);
  }

  createPayment(telegramId, planId, crypto, amountEur) {
    const result = db.prepare(`
      INSERT INTO payments (telegram_id, plan_id, crypto, amount_eur, status)
      VALUES (?, ?, ?, ?, 'pending')
    `).run(telegramId, planId, crypto, amountEur);

    return result.lastInsertRowid;
  }

  getPayment(paymentId) {
    return db.prepare('SELECT * FROM payments WHERE id = ?').get(paymentId);
  }

  submitPaymentForReview(paymentId) {
    const payment = this.getPayment(paymentId);
    if (!payment || payment.status !== 'pending') {
      return null;
    }

    db.prepare(`
      UPDATE payments SET status = 'awaiting_approval' WHERE id = ?
    `).run(paymentId);

    return this.getPayment(paymentId);
  }

  confirmPayment(paymentId) {
    const payment = this.getPayment(paymentId);
    if (!payment || !['pending', 'awaiting_approval'].includes(payment.status)) {
      return null;
    }

    db.prepare(`
      UPDATE payments
      SET status = 'confirmed', confirmed_at = datetime('now')
      WHERE id = ?
    `).run(paymentId);

    this.activatePlan(payment.telegram_id, payment.plan_id);

    return this.getPayment(paymentId);
  }

  rejectPayment(paymentId) {
    const payment = this.getPayment(paymentId);
    if (!payment || !['pending', 'awaiting_approval'].includes(payment.status)) {
      return null;
    }

    db.prepare(`
      UPDATE payments SET status = 'rejected' WHERE id = ?
    `).run(paymentId);

    return this.getPayment(paymentId);
  }

  getPendingPayments() {
    return db.prepare(`
      SELECT p.*, u.username, u.first_name
      FROM payments p
      LEFT JOIN users u ON u.telegram_id = p.telegram_id
      WHERE p.status IN ('pending', 'awaiting_approval')
      ORDER BY p.created_at DESC
    `).all();
  }

  listUsers() {
    return db.prepare('SELECT * FROM users ORDER BY created_at DESC').all();
  }
}

module.exports = new UserService();
