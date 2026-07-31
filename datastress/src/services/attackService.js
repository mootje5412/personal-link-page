const fs = require('fs');
const path = require('path');
const config = require('../../config/config');

class AttackService {
  constructor() {
    this.csvPath = path.resolve(config.attacksCsvPath);
  }

  escapeCsv(value) {
    const str = String(value ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
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

  launchAttack({ telegramId, username, target, port, method, duration }) {
    const attack = this.logAttack({
      telegramId,
      username,
      target,
      port,
      method,
      duration,
      status: 'completed'
    });

    return attack;
  }
}

module.exports = new AttackService();
