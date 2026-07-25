const { METADATA_KEYS } = require('./responseParser');

const CATEGORY_LABELS = {
  breach: 'BREACH',
  database: 'STEALER',
  stealer: 'STEALER',
  snusbase: 'SNUSBASE',
  discord: 'DISCORD',
  roblox: 'ROBLOX',
  'discord-to-roblox': 'DISCORD→ROBLOX',
  ip: 'IP',
  vin: 'VIN',
  phone: 'PHONE',
  'phone-osint': 'PHONE',
  machine: 'MACHINE',
  seekaf: 'SEEKAF',
  'seekaf-deep': 'SEEKAF DEEP',
  'seekaf-stealer': 'SEEKAF STEALER'
};

function formatBytes(bytes) {
  const value = Number(bytes);
  if (!Number.isFinite(value)) {
    return String(bytes);
  }
  if (value < 1024) {
    return `${value} B`;
  }
  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function normalizeRecord(item) {
  if (!item || typeof item !== 'object') {
    return item;
  }

  return {
    ...item,
    email: item.email || item.mail || item.e_mail,
    username: item.username || item.login || item.user || item.user_name,
    password: item.password || item.pass || item.passwd || item.pwd,
    phone: item.phone || item.phone_number || item.mobile,
    ip: item.ip || item.ip_address || item.last_ip,
    name: item.name || item.full_name || item.first_name,
    url: item.url || item.site || item.host || item.domain || item.website,
    source: item.source || item.database || item.breach || item.origin,
    country: item.country || item.country_code,
    hash: item.hash || item.password_hash || item.hashed_password
  };
}

function buildHeader(query, page, totalPages, totalResults, title = 'FindNow OSINT') {
  return [
    `━━ ${title} ━━`,
    `Query: ${query}`,
    `Page ${page + 1}/${totalPages} · ${totalResults} result${totalResults === 1 ? '' : 's'}`,
    '────────────────────'
  ].join('\n');
}

function buildMachineHeader(query, page, totalPages, totalResults) {
  return buildHeader(query, page, totalPages, totalResults, 'Machine Viewer');
}

function formatCategoryBlock(index, category, text) {
  const label = CATEGORY_LABELS[category] || String(category || 'RESULT').toUpperCase();
  return `[${index}] ${label}\n${text}`;
}

function formatMachineCard(index, machine) {
  const lines = [
    `[${index}] ${machine.name || 'Unknown Machine'}`,
    `Files: ${machine.file_count ?? '?'} · Size: ${formatBytes(machine.total_size)}`
  ];

  if (machine.imported_at) {
    lines.push(`Imported: ${machine.imported_at}`);
  }
  if (machine.id) {
    lines.push(`ID: ${machine.id}`);
  }

  return lines.join('\n');
}

function formatRecordFields(item) {
  if (!item) {
    return null;
  }
  if (typeof item === 'string') {
    return item;
  }
  if (typeof item !== 'object') {
    return null;
  }

  const normalized = normalizeRecord(item);
  const skipKeys = new Set([
    ...METADATA_KEYS,
    'id', 'user_id',
    'avatar', 'banner', 'badges', 'premium_type', 'public_flags', 'profile_url',
    'roblox_name', 'discord_id', 'discord_username', 'discord_avatar', 'discriminator',
    'display_name', 'global_name', 'created_at', 'bio', 'nick', '_key'
  ]);

  const priority = [
    ['email', 'Email'],
    ['username', 'Username'],
    ['password', 'Password'],
    ['lastip', 'Last IP'],
    ['last_ip', 'Last IP'],
    ['hash', 'Hash'],
    ['registered', 'Registered'],
    ['created', 'Created'],
    ['updated', 'Updated'],
    ['registrar', 'Registrar'],
    ['phone', 'Phone'],
    ['name', 'Name'],
    ['ip', 'IP'],
    ['url', 'URL'],
    ['source', 'Database'],
    ['country', 'Country'],
    ['breach_date', 'Breach Date'],
    ['domain', 'Domain'],
    ['host', 'Host'],
    ['application', 'App'],
    ['computer_name', 'Computer'],
    ['machine_id', 'Machine ID'],
    ['os', 'OS'],
    ['browser', 'Browser'],
    ['ip_address', 'IP Address'],
    ['address', 'Address'],
    ['dob', 'DOB']
  ];

  const lines = [];
  const usedKeys = new Set();

  priority.forEach(([key, label]) => {
    const value = normalized[key];
    if (value !== null && value !== undefined && value !== '') {
      lines.push(`${label}: ${value}`);
      usedKeys.add(key);
    }
  });

  Object.keys(normalized).forEach((key) => {
    if (skipKeys.has(key) || usedKeys.has(key)) {
      return;
    }

    const value = normalized[key];
    if (value === null || value === undefined || value === '') {
      return;
    }

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      lines.push(`${key}: ${value}`);
    } else if (Array.isArray(value) && value.length > 0) {
      lines.push(`${key}: ${value.join(', ')}`);
    }
  });

  if (lines.length === 0) {
    return null;
  }

  return lines.join('\n');
}

function formatStealerFields(item) {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const normalized = normalizeRecord(item);
  const fields = {};
  const set = (label, value) => {
    if (value !== null && value !== undefined && String(value).trim() !== '') {
      fields[label] = String(value).trim();
    }
  };

  set('Site', normalized.url || normalized.host || normalized.website);
  set('Email', normalized.email);
  set('Username', normalized.username);
  set('Password', normalized.password);
  set('Hash', normalized.hash);
  set('App', normalized.application || normalized.app);
  set('Computer', normalized.computer_name || normalized.hostname || normalized.machine);
  set('OS', normalized.os || normalized.platform);
  set('Browser', normalized.browser);
  set('IP', normalized.ip || normalized.ip_address || normalized.last_ip);
  set('Phone', normalized.phone);
  set('Database', normalized.source || normalized.database || normalized.origin);
  set('Date', normalized.date || normalized.breach_date || normalized.created || normalized.log_date);
  set('Country', normalized.country);

  const used = new Set([
    'url', 'host', 'website', 'email', 'username', 'password', 'hash', 'application', 'app',
    'computer_name', 'hostname', 'machine', 'os', 'platform', 'browser', 'ip', 'ip_address',
    'last_ip', 'phone', 'source', 'database', 'origin', 'date', 'breach_date', 'created',
    'log_date', 'country', 'mail', 'e_mail', 'login', 'user', 'user_name', 'pass', 'passwd',
    'pwd', 'site', 'domain', 'password_hash', 'hashed_password', 'breach', 'mobile', 'phone_number'
  ]);

  Object.entries(normalized).forEach(([key, value]) => {
    if (used.has(key) || METADATA_KEYS.has(key)) {
      return;
    }

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
      set(label, value);
    }
  });

  return Object.keys(fields).length ? fields : null;
}

module.exports = {
  CATEGORY_LABELS,
  formatBytes,
  normalizeRecord,
  buildHeader,
  buildMachineHeader,
  formatCategoryBlock,
  formatMachineCard,
  formatRecordFields,
  formatStealerFields
};
