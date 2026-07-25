const config = require('../../config/config');
const apiClient = require('./apiClient');
const { isAuthError, isTimeoutError, isNoResultError } = require('./apiClient');
const { formatRecordFields, formatStealerFields, formatBytes } = require('../utils/recordFormatter');
const {
  extractAllRecords,
  extractStealerRecords,
  extractIpSections,
  hasOnlyMetadata,
  isUsefulRecord
} = require('../utils/responseParser');

const SOURCE_LABELS = {
  breach: 'BREACH',
  stealer: 'STEALER',
  'database-search': 'STEALER',
  'database-search-auto': 'STEALER',
  'database-search-domain': 'STEALER',
  discord: 'DISCORD',
  roblox: 'ROBLOX',
  'discord-to-roblox': 'DISCORD-ROBLOX',
  ip: 'IP',
  phone: 'PHONE',
  vin: 'VIN',
  domain: 'DOMAIN',
  dns: 'DNS',
  minecraft: 'MINECRAFT',
  'minecraft-osint': 'MINECRAFT',
  chilean: 'RECORDS',
  gta: 'GTA',
  tiktok: 'TIKTOK',
  instagram: 'INSTAGRAM',
  footprint: 'FOOTPRINT'
};

class IntelligenceService {
  normalizeQuery(query) {
    const trimmed = query.trim();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return trimmed.toLowerCase();
    }
    return trimmed;
  }

  detectQueryTypes(query) {
    const types = [];
    const trimmed = query.trim();

    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) types.push('email');
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(trimmed)) types.push('ip');
    if (/^\d{17,19}$/.test(trimmed)) return ['discord'];
    if (/^[A-HJ-NPR-Z0-9]{17}$/i.test(trimmed) && /[A-Z]/i.test(trimmed)) return ['vin'];

    const phoneRegex = /^[\+]?[(]?[0-9]{1,3}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/;
    if (phoneRegex.test(trimmed.replace(/\s/g, '')) && !/^\d{17,}$/.test(trimmed.replace(/\s/g, ''))) {
      types.push('phone');
    }

    if (/^[a-zA-Z0-9_]{3,20}$/.test(trimmed) && !/^\d{17,19}$/.test(trimmed)) {
      types.push('username');
    } else if (/^[a-zA-Z0-9._-]{3,30}$/.test(trimmed) && !trimmed.includes(' ')) {
      types.push('username');
    }

    if (/^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/.test(trimmed)) types.push('domain');
    if (/^[a-zA-Z]{2,}(\s[a-zA-Z]{2,})+$/.test(trimmed)) types.push('name');
    if (types.length === 0) types.push('general');

    return types;
  }

  addUsernameSources(tasks, username, add, options = {}) {
    if (!username || username.length < 3) return;

    add('roblox', () => apiClient.roblox(username));
    add('minecraft', () => apiClient.minecraft(username));
    add('minecraft-osint', () => apiClient.minecraftOsint(username));
    add('tiktok', () => apiClient.tiktok(username));
    add('instagram', () => apiClient.instagram(username));
    add('gta', () => apiClient.gtaPlayers(username));
    add('gta-spotted', () => apiClient.gtaSpotted(username));

    if (!options.skipFootprint) {
      add('footprint', () => this.fetchFootprint(username));
    }
  }

  addDatabaseSearchTasks(tasks, query, add) {
    const detectedType = apiClient.detectDatabaseSearchType(query);

    if (detectedType) {
      add('database-search', () => apiClient.databaseSearch(query, detectedType));
      return;
    }

    add('database-search', () => apiClient.databaseSearch(query));
  }

  buildTasks(query, types) {
    const tasks = [];
    const add = (name, run) => tasks.push({ name, run });

    add('breach', () => apiClient.breach(query));

    if (types.includes('discord')) {
      add('discord', () => apiClient.discord(query));
      add('discord-to-roblox', () => apiClient.discordToRoblox(query));
      this.addDatabaseSearchTasks(tasks, query, add);
      return tasks;
    }

    if (types.includes('vin')) {
      add('vin', () => apiClient.vin(query));
      this.addDatabaseSearchTasks(tasks, query, add);
      return tasks;
    }

    if (types.includes('ip')) {
      add('ip', () => apiClient.ip(query));
      add('dns', () => apiClient.dns(query));
      this.addDatabaseSearchTasks(tasks, query, add);
      return tasks;
    }

    if (types.includes('email')) {
      this.addDatabaseSearchTasks(tasks, query, add);

      const [localPart, domainPart] = query.split('@');
      if (domainPart) {
        add('domain', () => apiClient.domain(domainPart));
      }
      this.addUsernameSources(tasks, localPart, add, { skipFootprint: true });
      return tasks;
    }

    this.addDatabaseSearchTasks(tasks, query, add);

    if (types.includes('phone')) {
      add('phone', () => apiClient.phone(query));
    }

    if (types.includes('domain')) {
      add('domain', () => apiClient.domain(query));
    }

    if (types.includes('username') || types.includes('general')) {
      this.addUsernameSources(tasks, query, add);
    }

    if (types.includes('name')) {
      add('chilean', () => apiClient.chileanName(query));
    }

    return tasks;
  }

  classifySourceStatus(data) {
    if (!data) {
      return 'failed';
    }

    if (data.error === true) {
      const message = data.message || '';
      if (isAuthError(message)) return 'auth';
      if (isTimeoutError(message)) return 'timeout';
      return 'failed';
    }

    if (typeof data.error === 'string') {
      if (isNoResultError(data.error)) return 'empty';
      if (isTimeoutError(data.error)) return 'timeout';
      if (isAuthError(data.error)) return 'auth';
      return 'failed';
    }

    return 'empty';
  }

  buildMeta(sourceStatus) {
    const entries = Object.entries(sourceStatus);
    const statuses = entries.map(([, status]) => status);
    const failures = entries
      .filter(([, status]) => ['failed', 'timeout', 'auth'].includes(status))
      .map(([name, status]) => ({ name, status }));

    return {
      sourcesChecked: entries.length,
      failures,
      allAuth: statuses.length > 0 && statuses.every((status) => status === 'auth'),
      anyTimeout: statuses.some((status) => status === 'timeout'),
      anyFailed: failures.length > 0
    };
  }

  async fetchFootprint(query) {
    const created = await apiClient.createFootprintTask(query, 'username');
    if (created.error) return created;

    const taskId = created.task_id;
    if (!taskId) return created;

    const deadline = Date.now() + config.footprintMaxWaitMs;

    while (Date.now() < deadline) {
      await this.delay(config.footprintPollMs);
      const task = await apiClient.getFootprintTask(taskId);
      if (task.error) return task;

      const status = String(task.status || '').toLowerCase();
      if (['completed', 'done', 'success', 'finished'].includes(status)) {
        return task;
      }
      if (['failed', 'error'].includes(status)) {
        return { error: true, message: 'Footprint scan failed.' };
      }
    }

    return { error: true, message: 'Footprint scan timed out.' };
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  withTimeout(promise, timeoutMs, label) {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        resolve({ error: true, message: `${label} timed out after ${timeoutMs}ms` });
      }, timeoutMs);

      Promise.resolve(promise)
        .then((result) => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timer);
          resolve({ error: true, message: error.message || `${label} failed` });
        });
    });
  }

  getTaskTimeout(name) {
    if (name === 'database-search' || name.startsWith('database-search')) {
      return config.stealerTimeoutMs;
    }

    if (name === 'footprint') {
      return config.footprintMaxWaitMs + 5000;
    }

    if (name === 'breach') {
      return config.breachTimeoutMs || config.apiTimeoutMs;
    }

    return config.fastSourceTimeoutMs;
  }

  isSlowTask(name) {
    return name === 'database-search'
      || name.startsWith('database-search')
      || name === 'footprint';
  }

  async runTask({ name, run }, results, seen, sourceStatus, notify) {
    const beforeCount = results.length;
    const timeoutMs = this.getTaskTimeout(name);

    if (this.isSlowTask(name)) {
      notify('stealer');
    }

    const data = await this.withTimeout(run(), timeoutMs, name);
    this.processResponse(name, data, results, seen);

    if (results.length > beforeCount) {
      sourceStatus[name] = 'ok';
    } else {
      sourceStatus[name] = this.classifySourceStatus(data);
    }

    if (['failed', 'timeout', 'auth'].includes(sourceStatus[name])) {
      const message = data?.message || data?.error || 'unknown error';
      console.error(`Source ${name} issue (${sourceStatus[name]}): ${message}`);
    }

    notify();
  }

  label(name) {
    if (name === 'gta-spotted') return SOURCE_LABELS.gta;
    return SOURCE_LABELS[name] || name.toUpperCase();
  }

  textToFields(text) {
    const fields = {};
    String(text).split('\n').forEach((line) => {
      const idx = line.indexOf(':');
      if (idx > 0) {
        fields[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
      }
    });
    return Object.keys(fields).length ? fields : { Result: text };
  }

  pushResultFields(results, seen, source, fields) {
    const key = `${source}:${JSON.stringify(fields)}`;
    if (seen.has(key)) return;
    seen.add(key);
    results.push({ source: this.label(source), fields });
  }

  pushResult(results, seen, source, payload) {
    const key = `${source}:${JSON.stringify(payload)}`;
    if (seen.has(key)) return;
    seen.add(key);

    if (typeof payload === 'string') {
      results.push({ source: this.label(source), fields: this.textToFields(payload) });
      return;
    }

    if (payload && typeof payload === 'object') {
      const text = formatRecordFields(payload);
      if (text) {
        results.push({ source: this.label(source), fields: this.textToFields(text) });
      }
    }
  }

  formatDiscordProfile(info) {
    if (!info || typeof info !== 'object') return null;
    const lines = [];
    const username = info.username
      ? (info.discriminator && info.discriminator !== '0'
        ? `${info.username}#${info.discriminator}`
        : `@${info.username}`)
      : null;

    if (info.display_name || info.global_name) lines.push(`Display Name: ${info.display_name || info.global_name}`);
    if (username) lines.push(`Username: ${username}`);
    if (info.id || info.user_id) lines.push(`User ID: ${info.id || info.user_id}`);
    if (info.created_at) lines.push(`Created: ${info.created_at}`);
    return lines.length ? lines.join('\n') : null;
  }

  formatRobloxProfile(item) {
    if (!item || typeof item !== 'object') return null;
    const lines = [];
    const robloxName = item.roblox_name || item.roblox_username || item.username || item.name;
    if (robloxName) lines.push(`Roblox: ${robloxName}`);
    if (item.discord_id) lines.push(`Discord ID: ${item.discord_id}`);
    if (item.discord_username) lines.push(`Discord: @${item.discord_username}`);
    return lines.length ? lines.join('\n') : null;
  }

  formatDiscordToRoblox(response) {
    if (!response || typeof response !== 'object') return null;
    const lines = [];
    if (response.roblox_username || response.roblox_name) lines.push(`Roblox: ${response.roblox_username || response.roblox_name}`);
    if (response.roblox_id) lines.push(`Roblox ID: ${response.roblox_id}`);
    if (response.discord_id) lines.push(`Discord ID: ${response.discord_id}`);
    return lines.length ? lines.join('\n') : null;
  }

  formatVin(response) {
    if (!response || !Array.isArray(response.Results)) return null;
    const lines = [];
    if (response.SearchCriteria) lines.push(`VIN: ${response.SearchCriteria}`);
    response.Results.forEach((row) => {
      if (row?.Variable && row?.Value && row.Value !== 'Not Applicable' && row.Value !== '') {
        lines.push(`${row.Variable}: ${row.Value}`);
      }
    });
    return lines.length ? lines.join('\n') : null;
  }

  formatFootprint(response) {
    const platforms = response.platforms || response.results || response.data;
    if (!platforms) return null;

    if (Array.isArray(platforms)) {
      const hits = platforms.filter((p) => p.registered || p.exists || p.found);
      if (!hits.length) return 'No platform registrations found.';
      return hits.slice(0, 15).map((p) => {
        const name = p.platform || p.name || p.site || 'Platform';
        const extra = p.url || p.profile_url || p.status || 'registered';
        return `${name}: ${extra}`;
      }).join('\n');
    }

    if (typeof platforms === 'object') {
      const lines = [];
      Object.entries(platforms).forEach(([platform, info]) => {
        if (info && (info.registered || info.exists || info.found || info === true)) {
          lines.push(`${platform}: found`);
        }
      });
      return lines.length ? lines.join('\n') : null;
    }

    return null;
  }

  processDatabaseSearchResponse(data, results, seen) {
    const records = extractStealerRecords(data);
    let added = 0;

    records.forEach((item) => {
      const fields = formatStealerFields(item);
      if (fields) {
        this.pushResultFields(results, seen, 'stealer', fields);
        added += 1;
      }
    });

    return added;
  }

  processResponse(name, data, results, seen) {
    if (!data || data.error === true) return;
    if (typeof data.error === 'string') {
      if (isNoResultError(data.error)) return;
      return;
    }

    if (name === 'breach') {
      const breachRecords = Array.isArray(data.breach_data) ? data.breach_data : [];
      if (breachRecords.length) {
        breachRecords.forEach((item) => {
          const text = formatRecordFields(item);
          if (text) this.pushResult(results, seen, 'breach', text);
        });
        return;
      }
    }

    if (name === 'database-search' || name === 'database-search-auto' || name === 'database-search-domain' || name === 'stealer' || name === 'stealer-db') {
      this.processDatabaseSearchResponse(data, results, seen);
      return;
    }

    if (name === 'discord') {
      if (data.user_info) {
        const text = this.formatDiscordProfile(data.user_info);
        if (text) this.pushResult(results, seen, 'discord', text);
      }
      extractAllRecords(data).forEach(({ item }) => {
        const text = formatRecordFields(item) || this.formatDiscordProfile(item);
        if (text) this.pushResult(results, seen, 'discord', text);
      });
      return;
    }

    if (name === 'roblox') {
      const matches = Array.isArray(data.results) ? data.results : [];
      if (matches.length) {
        matches.forEach((item) => {
          const text = this.formatRobloxProfile(item);
          if (text) this.pushResult(results, seen, 'roblox', text);
        });
      } else {
        const text = this.formatRobloxProfile(data);
        if (text) this.pushResult(results, seen, 'roblox', text);
      }
      return;
    }

    if (name === 'discord-to-roblox') {
      const text = this.formatDiscordToRoblox(data);
      if (text) this.pushResult(results, seen, 'discord-to-roblox', text);
      return;
    }

    if (name === 'vin') {
      const text = this.formatVin(data);
      if (text) this.pushResult(results, seen, 'vin', text);
      return;
    }

    if (name === 'ip') {
      extractIpSections(data).forEach(({ text }) => {
        if (text) this.pushResult(results, seen, 'ip', text);
      });
      extractAllRecords(data).forEach(({ item }) => {
        const text = formatRecordFields(item);
        if (text) this.pushResult(results, seen, 'stealer', text);
      });
      return;
    }

    if (name === 'footprint') {
      const text = this.formatFootprint(data);
      if (text) this.pushResult(results, seen, 'footprint', text);
      return;
    }

    const stealerSources = new Set(['stealer', 'stealer-db']);
    const records = extractAllRecords(data);
    if (records.length) {
      records.forEach(({ item }) => {
        const text = formatRecordFields(item);
        const source = stealerSources.has(name) ? 'stealer' : name;
        if (text) this.pushResult(results, seen, source, text);
      });
      return;
    }

    if (!hasOnlyMetadata(data) && isUsefulRecord(data)) {
      const text = formatRecordFields(data);
      const source = stealerSources.has(name) ? 'stealer' : name;
      if (text) this.pushResult(results, seen, source, text);
    }
  }

  async search(query, onProgress) {
    if (!config.intelApiKey) {
      throw new Error('INTEL_API_KEY is not configured.');
    }

    const normalizedQuery = this.normalizeQuery(query);
    const results = [];
    const seen = new Set();
    const sourceStatus = {};
    const types = this.detectQueryTypes(normalizedQuery);
    const tasks = this.buildTasks(normalizedQuery, types);
    const fastTasks = tasks.filter(({ name }) => !this.isSlowTask(name));
    const slowTasks = tasks.filter(({ name }) => this.isSlowTask(name));
    const deadline = Date.now() + config.searchMaxWaitMs;

    const notify = (status) => {
      if (typeof onProgress === 'function') {
        onProgress(results.length, status);
      }
    };

    await Promise.all(fastTasks.map((task) => this.runTask(task, results, seen, sourceStatus, notify)));

    const remainingMs = deadline - Date.now();
    if (remainingMs > 0 && slowTasks.length > 0) {
      notify('stealer');
      await Promise.all(
        slowTasks.map((task) => this.withTimeout(
          this.runTask(task, results, seen, sourceStatus, notify),
          remainingMs,
          task.name
        ))
      );
    } else if (slowTasks.length > 0) {
      slowTasks.forEach(({ name }) => {
        sourceStatus[name] = 'timeout';
      });
    }

    return {
      results,
      meta: {
        ...this.buildMeta(sourceStatus),
        sourceCounts: this.countSources(results)
      }
    };
  }

  countSources(results) {
    const counts = {};
    results.forEach((result) => {
      const label = result.source || 'RESULT';
      counts[label] = (counts[label] || 0) + 1;
    });
    return counts;
  }

  normalizeMachine(machine) {
    return {
      name: machine.name || machine.hostname || 'Unknown',
      id: machine.id || machine.machine_id || machine.uuid || '',
      file_count: machine.file_count ?? machine.files ?? '?',
      size: machine.total_size != null ? formatBytes(machine.total_size) : (machine.size || '?'),
      os: machine.os || machine.platform || 'Unknown',
      imported_at: machine.imported_at || machine.created_at || null
    };
  }

  async searchMachines(query) {
    const data = await apiClient.searchMachines(query);
    if (data.error) {
      return { error: data.message, machines: [] };
    }

    const machines = (data.machines || []).map((m) => this.normalizeMachine(m));
    return { machines };
  }
}

module.exports = new IntelligenceService();
