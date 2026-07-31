const fs = require('fs');
const path = require('path');
const config = require('../../config/config');

class AttackService {
  constructor() {
    this.csvPath = path.resolve(config.attacksCsvPath);
    this.activeSlots = new Map();
  }

  escapeCsv(value) {
    const str = String(value ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  getActiveCount(telegramId) {
    return this.activeSlots.get(String(telegramId)) || 0;
  }

  canLaunch(telegramId, maxConcurrent) {
    return this.getActiveCount(telegramId) < maxConcurrent;
  }

  reserveSlot(telegramId, duration) {
    const key = String(telegramId);
    const current = this.getActiveCount(telegramId);
    this.activeSlots.set(key, current + 1);

    setTimeout(() => {
      const active = this.getActiveCount(telegramId);
      if (active <= 1) {
        this.activeSlots.delete(key);
      } else {
        this.activeSlots.set(key, active - 1);
      }
    }, Math.max(duration, 1) * 1000);
  }

  logAttack({ telegramId, username, target, port, method, duration, status }) {
    const row = [
      new Date().toISOString(),
      telegramId,
      username || '',
      target,
      port,
      method,
      duration,
      status
    ].map((v) => this.escapeCsv(v)).join(',');

    fs.appendFileSync(this.csvPath, `${row}\n`, 'utf8');

    return {
      timestamp: new Date().toISOString(),
      telegramId,
      username,
      target,
      port,
      method,
      duration,
      status
    };
  }

  launchAttack({ telegramId, username, target, port, method, duration, maxConcurrent }) {
    if (!this.canLaunch(telegramId, maxConcurrent)) {
      return { error: 'concurrent_limit', active: this.getActiveCount(telegramId), max: maxConcurrent };
    }

    this.reserveSlot(telegramId, duration);

    const attack = this.logAttack({
      telegramId,
      username,
      target,
      port,
      method,
      duration,
      status: 'running'
    });

    return attack;
  }
}

module.exports = new AttackService();
