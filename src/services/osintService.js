const apiService = require('./apiService');
const config = require('../../config/config');
const { getMachineId } = require('../utils/machineUtils');
const {
  formatRecordFields,
  formatBytes
} = require('../utils/resultFormatter');
const {
  extractAllRecords,
  extractIpSections,
  extractSnusbaseRecords,
  extractSnusbaseWhois,
  extractSeekAfRecords,
  hasOnlyMetadata,
  isUsefulRecord
} = require('../utils/responseParser');

class OSINTService {
  detectQueryTypes(query) {
    const types = [];
    const trimmed = query.trim();

    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      types.push('email');
    }

    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(trimmed)) {
      types.push('ip');
    }

    if (/^\d{17,19}$/.test(trimmed)) {
      types.push('discord');
      return types;
    }

    if (/^[A-HJ-NPR-Z0-9]{17}$/i.test(trimmed) && /[A-Z]/i.test(trimmed)) {
      types.push('vin');
      return types;
    }

    if (!/^\d{17,}$/.test(trimmed.replace(/\s/g, ''))) {
      const phoneRegex = /^[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/;
      if (phoneRegex.test(trimmed.replace(/\s/g, ''))) {
        types.push('phone');
      }
    }

    if (/^[a-zA-Z0-9_]{3,20}$/.test(trimmed) && !/^\d{17,19}$/.test(trimmed)) {
      types.push('roblox');
      types.push('username');
    } else if (/^[a-zA-Z0-9._-]{3,30}$/.test(trimmed) && !trimmed.includes(' ')) {
      types.push('username');
    }

    if (/^[a-zA-Z]{2,}(\s[a-zA-Z]{2,})?$/.test(trimmed)) {
      types.push('name');
    }

    if (types.length === 0) {
      types.push('general');
    }

    return types;
  }

  getSeekAfType(types, query) {
    if (types.includes('email')) return 'email';
    if (types.includes('phone')) return 'phone';
    if (types.includes('ip')) return 'ip';
    if (types.includes('discord')) return 'discord';
    if (types.includes('username')) return 'username';
    if (/^[a-f0-9]{32}$/i.test(query.trim())) return 'hash';
    return undefined;
  }

  appendSeekAfTasks(tasks, query, types) {
    if (!config.seekAfEnabled || !config.seekAfApiKey) {
      return;
    }

    const seekType = this.getSeekAfType(types, query);

    tasks.push({
      name: 'seekaf-search',
      run: () => apiService.seekAfSearch(query, seekType)
    });

    if (config.seekAfUseDeepSearch) {
      tasks.push({
        name: 'seekaf-deep',
        run: () => apiService.seekAfSearchDeep(query, seekType)
      });
    }

    tasks.push({
      name: 'seekaf-stealer',
      run: () => apiService.seekAfStealer(query, config.seekAfStealerDeep)
    });
  }

  buildSearchTasks(query, types) {
    const tasks = [];

    if (types.includes('discord')) {
      tasks.push({ name: 'breach', run: () => apiService.searchBreach(query) });
      tasks.push({ name: 'discord', run: () => apiService.searchDiscord(query) });
      tasks.push({ name: 'discord-to-roblox', run: () => apiService.searchDiscordToRoblox(query) });
      this.appendSeekAfTasks(tasks, query, types);
      return tasks;
    }

    if (types.includes('vin')) {
      tasks.push({ name: 'breach', run: () => apiService.searchBreach(query) });
      tasks.push({ name: 'vin', run: () => apiService.searchVIN(query) });
      return tasks;
    }

    if (types.includes('ip')) {
      tasks.push({ name: 'breach', run: () => apiService.searchBreach(query) });
      tasks.push({ name: 'ip', run: () => apiService.searchIP(query) });
      tasks.push({ name: 'snusbase', run: () => apiService.snusbaseSearch(query, 'lastip') });
      tasks.push({ name: 'snusbase-whois', run: () => apiService.snusbaseIpWhois(query) });
      this.appendSeekAfTasks(tasks, query, types);
      return tasks;
    }

    const stealerType = query.includes('@') ? 'email' : 'domain';

    tasks.push({ name: 'breach', run: () => apiService.searchBreach(query) });
    tasks.push({ name: 'stealer', run: () => apiService.searchStealerLogs(query, stealerType) });
    tasks.push({ name: 'database', run: () => apiService.searchStealerLogs(query) });

    if (types.includes('phone')) {
      tasks.push({ name: 'snusbase', run: () => apiService.snusbaseSearch(query, 'name') });
      tasks.push({ name: 'phone-osint', run: () => apiService.searchPhoneOSINT(query) });
    } else if (types.includes('email')) {
      tasks.push({ name: 'snusbase', run: () => apiService.snusbaseSearch(query, 'email') });
    } else if (types.includes('username')) {
      tasks.push({ name: 'snusbase', run: () => apiService.snusbaseSearch(query, 'username') });
    } else if (types.includes('name')) {
      tasks.push({ name: 'snusbase', run: () => apiService.snusbaseSearch(query, 'name') });
    } else if (types.includes('roblox')) {
      tasks.push({ name: 'snusbase', run: () => apiService.snusbaseSearch(query, 'username') });
    } else {
      tasks.push({ name: 'snusbase', run: () => apiService.snusbaseSearch(query, 'email') });
    }

    if (types.includes('roblox') || types.includes('username')) {
      tasks.push({ name: 'roblox', run: () => apiService.searchRoblox(query) });
    }

    this.appendSeekAfTasks(tasks, query, types);

    return tasks;
  }

  makeResult(category, text, extra = {}) {
    return { category, text, ...extra };
  }

  getRecordKey(category, item, index) {
    try {
      return `${category}:${JSON.stringify(item)}`;
    } catch (error) {
      return `${category}:${index}`;
    }
  }

  addUniqueResult(results, seen, result) {
    const key = result.key || `${result.category}:${result.text}`;
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    results.push(result);
    return true;
  }

  formatDiscordUsername(info) {
    if (!info.username) {
      return null;
    }
    if (info.discriminator && info.discriminator !== '0') {
      return `${info.username}#${info.discriminator}`;
    }
    return `@${info.username}`;
  }

  formatDiscordAvatar(info) {
    const userId = info.id || info.user_id;
    if (!info.avatar) {
      return null;
    }
    if (String(info.avatar).startsWith('http')) {
      return info.avatar;
    }
    if (userId) {
      return `https://cdn.discordapp.com/avatars/${userId}/${info.avatar}.png?size=256`;
    }
    return info.avatar;
  }

  formatDiscordProfile(info) {
    if (!info || typeof info !== 'object') {
      return null;
    }

    const lines = [];
    const username = this.formatDiscordUsername(info);
    const displayName = info.display_name || info.global_name || info.nick;

    if (displayName) lines.push(`Display Name: ${displayName}`);
    if (username) lines.push(`Username: ${username}`);
    if (info.id || info.user_id) lines.push(`User ID: ${info.id || info.user_id}`);

    const avatar = this.formatDiscordAvatar(info);
    if (avatar) lines.push(`Avatar: ${avatar}`);
    if (info.banner) lines.push(`Banner: ${info.banner}`);
    if (info.bio) lines.push(`Bio: ${info.bio}`);
    if (info.premium_type) {
      const nitro = info.premium_type === 2 ? 'Nitro' : info.premium_type === 1 ? 'Nitro Classic' : 'None';
      lines.push(`Nitro: ${nitro}`);
    }
    if (info.badges && info.badges.length) {
      lines.push(`Badges: ${Array.isArray(info.badges) ? info.badges.join(', ') : info.badges}`);
    }
    if (info.created_at) lines.push(`Created: ${info.created_at}`);
    if (info.profile_url) lines.push(`Profile: ${info.profile_url}`);

    return lines.length > 0 ? lines.join('\n') : null;
  }

  formatRobloxProfile(item) {
    if (!item || typeof item !== 'object') {
      return null;
    }

    const lines = [];
    const robloxName = item.roblox_name || item.roblox_username || item.username || item.name;
    const robloxId = item.roblox_id || item.user_id;

    if (robloxName) lines.push(`Roblox Username: ${robloxName}`);
    if (robloxId && !String(robloxId).match(/^\d{17,19}$/)) lines.push(`Roblox ID: ${robloxId}`);

    if (item.discord_id) {
      lines.push(`Linked Discord ID: ${item.discord_id}`);
      if (item.discord_username) lines.push(`Discord Username: @${item.discord_username}`);
      if (item.discord_avatar) lines.push(`Discord Avatar: ${item.discord_avatar}`);
    } else if (item.discord_username) {
      lines.push(`Discord Username: @${item.discord_username}`);
    } else if (robloxName) {
      lines.push('Linked Discord: Not found');
    }

    return lines.length > 0 ? lines.join('\n') : null;
  }

  formatDiscordToRobloxProfile(response) {
    if (!response || typeof response !== 'object' || response.error) {
      return null;
    }

    const lines = [];
    const robloxName = response.roblox_username || response.roblox_name || response.username;
    const robloxId = response.roblox_id || response.user_id;
    const discordId = response.discord_id || response.query;

    if (robloxName) lines.push(`Roblox Username: ${robloxName}`);
    if (robloxId) lines.push(`Roblox ID: ${robloxId}`);
    if (discordId) lines.push(`Discord ID: ${discordId}`);
    if (response.profile_url) lines.push(`Profile: ${response.profile_url}`);

    return lines.length > 0 ? lines.join('\n') : null;
  }

  formatVinResults(response) {
    if (!response || !Array.isArray(response.Results)) {
      return null;
    }

    const lines = [];
    if (response.SearchCriteria) lines.push(`VIN: ${response.SearchCriteria}`);

    response.Results.forEach((row) => {
      if (row && row.Variable && row.Value && row.Value !== 'Not Applicable' && row.Value !== '') {
        lines.push(`${row.Variable}: ${row.Value}`);
      }
    });

    return lines.length > 0 ? lines.join('\n') : null;
  }

  formatMachineText(machine) {
    const lines = [];
    if (machine.name) lines.push(`Name: ${machine.name}`);
    if (machine.file_count !== undefined) lines.push(`Files: ${machine.file_count}`);
    if (machine.total_size !== undefined) lines.push(`Size: ${formatBytes(machine.total_size)}`);
    if (machine.imported_at) lines.push(`Imported: ${machine.imported_at}`);

    const machineId = getMachineId(machine);
    if (machineId) lines.push(`ID: ${machineId}`);

    return lines.join('\n');
  }

  appendRecordList(results, seen, category, records) {
    records.forEach(({ item, source, index }) => {
      let text;
      let resultCategory = category;

      if (source === 'machines' || (item.name && getMachineId(item))) {
        text = this.formatMachineText(item);
        resultCategory = 'machine';
      } else {
        text = formatRecordFields(item);
      }

      if (!text) {
        return;
      }

      const result = this.makeResult(resultCategory, text, {
        key: this.getRecordKey(`${resultCategory}:${source}`, item, index)
      });

      const machineId = getMachineId(item);
      if (machineId) {
        result.machineId = machineId;
      }

      this.addUniqueResult(results, seen, result);
    });
  }

  appendIpResults(results, response, seen) {
    if (!response || response.error === true) return;
    if (response.error && typeof response.error === 'string') return;

    extractIpSections(response).forEach(({ text, key }) => {
      this.addUniqueResult(results, seen, this.makeResult('ip', text, { key: `ip-section:${key}` }));
    });

    this.appendRecordList(results, seen, 'stealer', extractAllRecords(response));
  }

  appendOsintCatResponse(results, response, seen, category) {
    if (!response || response.error === true) return;
    if (response.error && typeof response.error === 'string') return;

    const vinText = this.formatVinResults(response);
    if (vinText) {
      this.addUniqueResult(results, seen, this.makeResult('vin', vinText, {
        key: `vin:${response.SearchCriteria || 'decode'}`
      }));
      return;
    }

    if (category === 'ip') {
      this.appendIpResults(results, response, seen);
      return;
    }

    const records = extractAllRecords(response);
    if (records.length > 0) {
      this.appendRecordList(results, seen, category, records);
    }

    if (response.user_info) {
      const text = this.formatDiscordProfile(response.user_info);
      if (text) {
        this.addUniqueResult(results, seen, this.makeResult('discord', text, {
          key: `profile:${response.user_info.id || response.user_info.user_id}`
        }));
      }
    }

    if (Array.isArray(response.Results) && response.Results[0] && response.Results[0].Variable) {
      return;
    }

    if (records.length === 0 && !hasOnlyMetadata(response) && isUsefulRecord(response)) {
      const text = formatRecordFields(response);
      if (text) {
        this.addUniqueResult(results, seen, this.makeResult(category, text, {
          key: `flat:${category}:${response.query || text.substring(0, 80)}`
        }));
      }
    }
  }

  appendSnusbaseResults(results, response, seen) {
    if (!response || response.error) return;

    extractSnusbaseRecords(response).forEach(({ item, source, index }) => {
      const text = formatRecordFields(item);
      if (text) {
        this.addUniqueResult(results, seen, this.makeResult('snusbase', text, {
          key: this.getRecordKey(source, item, index)
        }));
      }
    });
  }

  appendSeekAfResults(results, response, seen, category) {
    if (!response) {
      return;
    }

    if (response.error) {
      console.error(`SeekAF ${category} skipped: ${response.message || 'request failed'}`);
      return;
    }

    const items = extractSeekAfRecords(response);
    const sourceLabel = category === 'seekaf-stealer'
      ? 'SeekAF Stealer'
      : category === 'seekaf-deep'
        ? 'SeekAF Deep'
        : 'SeekAF';

    if (items.length === 0 && response.success === false) {
      console.log(`SeekAF ${category}: no results (${response.message || 'success=false'})`);
      return;
    }

    items.forEach((item, index) => {
      const text = formatRecordFields({
        ...item,
        source: item.source || sourceLabel
      });

      if (text) {
        this.addUniqueResult(results, seen, this.makeResult(category, text, {
          key: this.getRecordKey(`seekaf:${category}`, item, index)
        }));
      }
    });
  }

  appendSnusbaseWhoisResults(results, response, seen, query) {
    if (!response || response.error) return;

    extractSnusbaseWhois(response, query).forEach(({ text, key }) => {
      this.addUniqueResult(results, seen, this.makeResult('ip', text, {
        key: `snusbase-whois:${key}`
      }));
    });
  }

  appendDiscordResults(results, response, seen) {
    if (!response || response.error === true) return;
    if (response.error && typeof response.error === 'string') return;

    if (response.user_info) {
      const text = this.formatDiscordProfile(response.user_info);
      if (text) {
        this.addUniqueResult(results, seen, this.makeResult('discord', text, {
          key: `discord-profile:${response.user_info.id || response.user_info.user_id}`
        }));
      }
    }

    extractAllRecords(response).forEach(({ item, source, index }) => {
      if (item && item.username && (item.id || item.user_id) && !item.email && !item.password && !item.pass) {
        const profile = this.formatDiscordProfile(item);
        if (profile) {
          this.addUniqueResult(results, seen, this.makeResult('discord', profile, {
            key: `discord-profile-item:${item.id || item.user_id || index}`
          }));
          return;
        }
      }

      const text = formatRecordFields(item) || this.formatDiscordProfile(item);
      if (text) {
        this.addUniqueResult(results, seen, this.makeResult('discord', text, {
          key: this.getRecordKey(`discord:${source}`, item, index)
        }));
      }
    });

    const rootProfile = this.formatDiscordProfile(response);
    if (rootProfile && !response.user_info) {
      this.addUniqueResult(results, seen, this.makeResult('discord', rootProfile, {
        key: `discord-root:${response.id || response.user_id || 'root'}`
      }));
    }
  }

  appendRobloxResults(results, response, seen, sourceName) {
    if (!response || response.error === true) return;
    if (response.error && typeof response.error === 'string') return;

    if (sourceName === 'discord-to-roblox') {
      const text = this.formatDiscordToRobloxProfile(response);
      if (text) {
        this.addUniqueResult(results, seen, this.makeResult('discord-to-roblox', text, {
          key: `d2r:${response.roblox_id || response.roblox_username || response.query}`
        }));
      }
    }

    const matches = Array.isArray(response.results) ? response.results : [];
    matches.forEach((item, index) => {
      const text = this.formatRobloxProfile(item);
      if (text) {
        this.addUniqueResult(results, seen, this.makeResult('roblox', text, {
          key: this.getRecordKey('roblox', item, index)
        }));
      }
    });

    if (matches.length === 0) {
      const text = this.formatRobloxProfile(response) || this.formatDiscordToRobloxProfile(response);
      if (text) {
        this.addUniqueResult(results, seen, this.makeResult('roblox', text, {
          key: `roblox-root:${response.roblox_name || response.query || 'root'}`
        }));
      }
    }
  }

  processTaskResult(name, data, results, seen, query) {
    if (name === 'snusbase') {
      this.appendSnusbaseResults(results, data, seen);
      return;
    }

    if (name === 'snusbase-whois') {
      this.appendSnusbaseWhoisResults(results, data, seen, query);
      return;
    }

    if (name === 'seekaf-search') {
      this.appendSeekAfResults(results, data, seen, 'seekaf');
      return;
    }

    if (name === 'seekaf-deep') {
      this.appendSeekAfResults(results, data, seen, 'seekaf-deep');
      return;
    }

    if (name === 'seekaf-stealer') {
      this.appendSeekAfResults(results, data, seen, 'seekaf-stealer');
      return;
    }

    if (name === 'discord') {
      this.appendDiscordResults(results, data, seen);
      return;
    }

    if (name === 'roblox') {
      this.appendRobloxResults(results, data, seen, 'roblox');
      return;
    }

    if (name === 'discord-to-roblox') {
      this.appendRobloxResults(results, data, seen, 'discord-to-roblox');
      return;
    }

    const category = name === 'database' ? 'stealer' : name;
    this.appendOsintCatResponse(results, data, seen, category);
  }

  async search(query, onProgress) {
    const results = [];
    const seen = new Set();
    const types = this.detectQueryTypes(query);
    const tasks = this.buildSearchTasks(query, types);

    console.log(`Search: ${query} | Types: ${types.join(', ')} | APIs: ${tasks.map((task) => task.name).join(', ')}`);

    const notify = () => {
      if (typeof onProgress === 'function') {
        onProgress([...results], tasks.length);
      }
    };

    await Promise.all(tasks.map(async ({ name, run }) => {
      try {
        const data = await run();
        this.processTaskResult(name, data, results, seen, query);
        notify();
      } catch (error) {
        console.error(`Search task ${name} failed:`, error.message);
      }
    }));

    return results;
  }

  async machineSearch(query) {
    const data = await apiService.searchMachines(query);
    if (data && data.error) {
      return { error: data.message, machines: [] };
    }

    return {
      machines: data.machines || data.results || []
    };
  }
}

module.exports = new OSINTService();
