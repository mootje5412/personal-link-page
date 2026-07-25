const config = require('../../config/config');
const apiClient = require('./apiClient');
const { isAuthError, isTimeoutError, isNoResultError } = require('./apiClient');
const { formatRecordFields, formatStealerFields, formatBytes } = require('../utils/recordFormatter');
const {
  extractAllRecords,
  extractStealerRecords,
  extractIpSections,
  hasOnlyMetadata,
  isUsefulRecord,
  isApiShellRecord
} = require('../utils/responseParser');

const SOURCE_LABELS = {
  breach: 'BREACH',
  stealer: 'STEALER',
  'database-search': 'STEALER',
  'database-search-auto': 'STEALER',
  'database-search-user': 'STEALER',
  'username-osint': 'STEALER',
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

    if (!options.skipGta) {
      add('gta', () => apiClient.gtaPlayers(username));
      add('gta-spotted', () => apiClient.gtaSpotted(username));
    }

    if (!options.skipFootprint) {
      add('footprint', () => this.fetchFootprint(username));
    }
  }

  addDatabaseSearchTasks(tasks, query, types, add) {
    const detectedType = apiClient.detectDatabaseSearchType(query);
    const type = detectedType || (types.includes('email') ? 'email' : null);

    if (query.includes('@')) {
      add('database-search', () => apiClient.databaseSearch(query, 'email'));
      return;
    }

    if (type === 'domain') {
      add('database-search', () => apiClient.databaseSearch(query, 'domain'));
      return;
    }

    add('database-search', () => apiClient.databaseSearch(query));
  }

  buildTasks(query, types) {
    const tasks = [];
    const add = (name, run) => tasks.push({ name, run });

    if (types.includes('email')) {
      add('breach', () => apiClient.breach(query));
      add('database-search', () => apiClient.databaseSearch(query, 'email'));
      add('footprint', () => this.fetchFootprint(query));
      return tasks;
    }

    add('breach', () => apiClient.breach(query));

    if (types.includes('discord')) {
      add('discord', () => apiClient.discord(query));
      add('discord-to-roblox', () => apiClient.discordToRoblox(query));
      this.addDatabaseSearchTasks(tasks, query, types, add);
      return tasks;
    }

    if (types.includes('vin')) {
      add('vin', () => apiClient.vin(query));
      this.addDatabaseSearchTasks(tasks, query, types, add);
      return tasks;
    }

    if (types.includes('ip')) {
      add('ip', () => apiClient.ip(query));
      add('dns', () => apiClient.dns(query));
      this.addDatabaseSearchTasks(tasks, query, types, add);
      return tasks;
    }

    this.addDatabaseSearchTasks(tasks, query, types, add);

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

  buildMeta(sourceStatus, sourceDetails = {}) {
    const entries = Object.entries(sourceStatus);
    const statuses = entries.map(([, status]) => status);
    const failures = entries
      .filter(([, status]) => ['failed', 'timeout', 'auth'].includes(status))
      .map(([name, status]) => ({ name, status, detail: sourceDetails[name] || '' }));

    const apiReport = ['breach', 'database-search', 'footprint'].map((name) => {
      const status = sourceStatus[name] || 'not run';
      const detail = sourceDetails[name] || '';
      const label = name === 'breach'
        ? 'GET /api/breach'
        : name === 'database-search'
          ? 'GET /api/database-search'
          : 'GET /api/footprint/create-task';

      return { name, label, status, detail };
    });

    return {
      sourcesChecked: entries.length,
      failures,
      apiReport,
      allAuth: statuses.length > 0 && statuses.every((status) => status === 'auth'),
      anyTimeout: statuses.some((status) => status === 'timeout'),
      anyFailed: failures.length > 0
    };
  }

  async fetchFootprint(query) {
    const footprintType = apiClient.detectFootprintType(query);
    const created = await apiClient.createFootprintTask(query, footprintType);

    if (created?.error === true) {
      return created;
    }

    if (typeof created?.error === 'string') {
      return { error: true, message: created.error };
    }

    const taskId = created.task_id || created.id || created.taskId;
    if (!taskId) {
      return created.results ? created : { error: true, message: 'Footprint task id missing.' };
    }

    const deadline = Date.now() + config.footprintMaxWaitMs;

    while (Date.now() < deadline) {
      await this.delay(config.footprintPollMs);
      const task = await apiClient.getFootprintTask(taskId);

      if (task?.error === true) {
        return task;
      }

      if (typeof task?.error === 'string') {
        return { error: true, message: task.error };
      }

      const status = String(task.status || task.state || '').toLowerCase();
      if (['completed', 'done', 'success', 'finished', 'complete'].includes(status)) {
        return task;
      }

      if (['failed', 'error'].includes(status)) {
        return { error: true, message: task.message || 'Footprint scan failed.' };
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
    if (name === 'breach') {
      return config.breachTimeoutMs || config.apiTimeoutMs;
    }

    if (name === 'database-search' || name.startsWith('database-search')) {
      return config.stealerTimeoutMs;
    }

    if (name === 'footprint') {
      return config.footprintMaxWaitMs + 10000;
    }

    return config.fastSourceTimeoutMs;
  }

  isFootprintTask(name) {
    return name === 'footprint';
  }

  isStealerTask(name) {
    return name === 'database-search' || name.startsWith('database-search');
  }

  getSourceDetail(data, status) {
    if (!data) {
      return status;
    }

    if (data.error === true) {
      return String(data.message || status);
    }

    if (typeof data.error === 'string') {
      return data.error;
    }

    if (status === 'empty' && data.results_count != null) {
      return `${data.results_count} records`;
    }

    return status;
  }

  async runTask({ name, run }, results, seen, sourceStatus, sourceDetails, notify) {
    const beforeCount = results.length;
    const timeoutMs = this.getTaskTimeout(name);

    if (this.isStealerTask(name)) {
      notify('stealer');
    }

    if (this.isFootprintTask(name)) {
      notify('footprint');
    }

    const data = await this.withTimeout(run(), timeoutMs, name);
    this.processResponse(name, data, results, seen);

    if (results.length > beforeCount) {
      sourceStatus[name] = 'ok';
    } else {
      sourceStatus[name] = this.classifySourceStatus(data);
    }

    sourceDetails[name] = this.getSourceDetail(data, sourceStatus[name]);

    if (['failed', 'timeout', 'auth'].includes(sourceStatus[name])) {
      console.error(`Source ${name} issue (${sourceStatus[name]}): ${sourceDetails[name]}`);
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

  formatFootprintFields(item) {
    if (!item || typeof item !== 'object' || isApiShellRecord(item)) {
      return null;
    }

    const registered = item.taken === true
      || item.registered === true
      || item.exists === true
      || item.found === true;

    if (!registered && item.taken === false) {
      return null;
    }

    const fields = {};
    const set = (label, value) => {
      if (value !== null && value !== undefined && String(value).trim() !== '') {
        fields[label] = String(value).trim();
      }
    };

    set('Platform', item.domain || item.platform || item.name || item.site);
    set('Registered', registered ? 'yes' : 'no');
    set('Type', item.type || item.method);
    set('URL', item.url || item.profile_url);

    const extra = item.ExtraData || item.extra_data || item.metadata || item.meta;
    if (extra && typeof extra === 'object') {
      Object.entries(extra).forEach(([key, value]) => {
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          set(key, value);
        }
      });
    }

    return Object.keys(fields).length ? fields : null;
  }

  processFootprintResponse(data, results, seen) {
    if (!data || data.error === true) return;

    const candidates = [
      data.results,
      data.platforms,
      data.data,
      data.data && data.data.results
    ].filter((value) => Array.isArray(value));

    let added = 0;

    candidates.forEach((items) => {
      items.forEach((item) => {
        const fields = this.formatFootprintFields(item);
        if (fields) {
          this.pushResultFields(results, seen, 'footprint', fields);
          added += 1;
        }
      });
    });

    if (added === 0) {
      const text = this.formatFootprint(data);
      if (text) {
        this.pushResult(results, seen, 'footprint', text);
      }
    }
  }

  formatFootprint(response) {
    const platforms = response.platforms || response.results || response.data;
    if (!platforms) return null;

    if (Array.isArray(platforms)) {
      const hits = platforms.filter((p) => p.taken || p.registered || p.exists || p.found);
      if (!hits.length) return null;
      return hits.slice(0, 15).map((p) => {
        const name = p.domain || p.platform || p.name || p.site || 'Platform';
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

  formatGtaRecord(item, sourceName) {
    if (!item || typeof item !== 'object' || isApiShellRecord(item)) {
      return null;
    }

    const fields = {};
    const set = (label, value) => {
      if (value !== null && value !== undefined && String(value).trim() !== '') {
        fields[label] = String(value).trim();
      }
    };

    set('Player', item.name || item.player || item.username || item.display_name);
    set('Platform', item.platform || item.service || sourceName.replace('gta-', '').toUpperCase());
    set('Rockstar ID', item.rockstar_id || item.rid || item.id);
    set('Last Seen', item.last_seen || item.spotted_at || item.seen_at || item.date);
    set('Server', item.server || item.session);
    set('IP', item.ip || item.last_ip);

    if (Object.keys(fields).length <= 1 && !fields.Player) {
      const text = formatRecordFields(item);
      if (!text) return null;
      return this.textToFields(text);
    }

    return Object.keys(fields).length ? fields : null;
  }

  processGtaResponse(name, data, results, seen) {
    if (!data || data.error === true) return;
    if (typeof data.error === 'string' && !isNoResultError(data.error)) return;

    const collections = [data.players, data.spotted, data.results, data.data, data.matches]
      .filter((value) => Array.isArray(value) && value.length > 0);

    collections.forEach((items) => {
      items.forEach((item) => {
        const fields = this.formatGtaRecord(item, name);
        if (fields) {
          this.pushResultFields(results, seen, 'gta', fields);
        }
      });
    });
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

    if (name.startsWith('database-search') || name === 'username-osint' || name === 'stealer' || name === 'stealer-db') {
      this.processDatabaseSearchResponse(data, results, seen);
      return;
    }

    if (name === 'gta' || name === 'gta-spotted') {
      this.processGtaResponse(name, data, results, seen);
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
      this.processFootprintResponse(data, results, seen);
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

    if (!hasOnlyMetadata(data) && isUsefulRecord(data) && !isApiShellRecord(data)) {
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
    const sourceDetails = {};
    const types = this.detectQueryTypes(normalizedQuery);
    const tasks = this.buildTasks(normalizedQuery, types);

    const notify = (status) => {
      if (typeof onProgress === 'function') {
        onProgress(results.length, status, types);
      }
    };

    await Promise.all(
      tasks.map((task) => this.runTask(task, results, seen, sourceStatus, sourceDetails, notify))
    );

    return {
      results,
      meta: {
        ...this.buildMeta(sourceStatus, sourceDetails),
        sourceCounts: this.countSources(results),
        queryTypes: types
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
