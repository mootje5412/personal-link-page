const config = require('../../config/config');
const PLANS = require('../../config/plans');

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function header(title) {
  return `<b>${escapeHtml(config.botName.toUpperCase())}</b>\n<code>${'─'.repeat(22)}</code>\n<b>${escapeHtml(title)}</b>`;
}

function truncateValue(value, max = 110) {
  const text = String(value);
  if (text.length <= max) {
    return text;
  }
  return `${text.slice(0, max)}...`;
}

const STEALER_FIELD_ORDER = [
  'Site', 'Email', 'Username', 'Password', 'Hash',
  'App', 'Computer', 'OS', 'Browser', 'IP', 'Phone',
  'Database', 'Date', 'Country'
];

function orderFields(fields, preferredOrder) {
  const ordered = [];
  const seen = new Set();

  preferredOrder.forEach((key) => {
    if (fields[key] !== undefined) {
      ordered.push([key, fields[key]]);
      seen.add(key);
    }
  });

  Object.entries(fields).forEach(([key, value]) => {
    if (!seen.has(key)) {
      ordered.push([key, value]);
    }
  });

  return ordered;
}

function formatSourceSummary(sourceCounts = {}) {
  const parts = Object.entries(sourceCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([source, count]) => `${source} ${count}`);

  return parts.length ? parts.join('  ·  ') : null;
}

function supportLine() {
  return `Support: ${config.supportContact}`;
}

function purchaseLine() {
  return `Purchase: DM ${config.supportContact} with your User ID.`;
}

function welcomeMessage(firstName) {
  return [
    header('Home'),
    '',
    `Welcome, <b>${escapeHtml(firstName)}</b>.`,
    '',
    'ApexSearch is a private OSINT intelligence platform.',
    'Send any query to search breach, stealer, social, and network sources instantly.',
    '',
    '<b>Quick start</b>',
    'Type a username, email, phone, IP, or Discord ID.',
    '',
    '<b>Commands</b>',
    '<code>/start</code>  Main menu',
    '<code>/prices</code>  Plans and payment',
    '<code>/account</code>  Your subscription',
    '<code>/machine &lt;name&gt;</code>  Machine lookup (Premium)',
    '',
    purchaseLine()
  ].join('\n');
}

function howItWorksMessage() {
  return [
    header('How It Works'),
    '',
    '1. Send any search term as a message',
    '2. ApexSearch scans all relevant databases in parallel',
    '3. Results appear in clean pages of 10',
    '4. Use Prev / Next to browse',
    '',
    '<b>Supported</b>',
    'Emails, usernames, phones, IPs, Discord IDs, domains, VINs, and more.',
    '',
    '<b>Examples</b>',
    '<code>john@gmail.com</code>',
    '<code>192.168.1.1</code>',
    '<code>cooluser123</code>',
    '',
    supportLine()
  ].join('\n');
}

function aiSearchMessage() {
  return [
    header('AI Search'),
    '',
    'Smart query detection routes your search automatically.',
    '',
    'Email — breach and credential data',
    'Phone — carrier and leak intelligence',
    'IP — geolocation, DNS, and WHOIS',
    'Username — cross-platform and footprint scan',
    'Discord — profile and linked accounts',
    '',
    'All sources run in parallel for fast results.',
    '',
    supportLine()
  ].join('\n');
}

function pricingMessage() {
  const basic = PLANS.basic;
  const premium = PLANS.premium;

  return [
    header('Pricing'),
    '',
    `<b>${basic.name}</b>  €${basic.price}/${basic.period}`,
    '  Unlimited searches',
    '  Full database access',
    '',
    `<b>${premium.name}</b>  €${premium.price}/${basic.period}`,
    '  Unlimited searches',
    '  Machine Viewer included',
    '  <code>/machine</code> command',
    '',
    '<b>Payment</b>',
    ...config.paymentMethods.map((m) => `  ${m}`),
    '',
    purchaseLine()
  ].join('\n');
}

function planDetailMessage(planId) {
  const plan = PLANS[planId];
  if (!plan) return pricingMessage();

  return [
    header(`${plan.name} Plan`),
    '',
    `Price       <b>€${plan.price}/${plan.period}</b>`,
    `Searches    <b>${plan.searches}</b>`,
    `Machine     <b>${plan.machineViewer ? 'included' : 'not included'}</b>`,
    '',
    '<b>Includes</b>',
    ...plan.features.map((f) => `  ${f}`),
    '',
    '<b>Payment</b>',
    ...config.paymentMethods.map((m) => `  ${m}`),
    '',
    purchaseLine()
  ].join('\n');
}

function noAccessMessage(reason) {
  return [
    header('Access Required'),
    '',
    escapeHtml(reason),
    '',
    'Use /prices to view plans.',
    purchaseLine()
  ].join('\n');
}

function premiumRequiredMessage() {
  const premium = PLANS.premium;
  return [
    header('Premium Required'),
    '',
    'Machine Viewer is a Premium feature.',
    '',
    `Upgrade for <b>€${premium.price}/${premium.period}</b>.`,
    'Use /prices or contact support to purchase.',
    '',
    purchaseLine()
  ].join('\n');
}

function errorMessage(title, detail) {
  return [
    header(title),
    '',
    detail ? escapeHtml(detail) : 'An unexpected error occurred.',
    '',
    `If this keeps happening, DM ${config.supportContact}.`
  ].join('\n');
}

function noResultsMessage(query, meta = {}) {
  const lines = [
    header('No Results'),
    '',
    `Query: <code>${escapeHtml(query)}</code>`,
    ''
  ];

  if (meta.allAuth) {
    lines.push('API connection blocked. The server IP may not be whitelisted.');
    lines.push('Contact support to restore database access.');
  } else if (meta.anyTimeout) {
    lines.push('No records found. Some sources timed out during the scan.');
    lines.push('Try again in a moment or contact support if this keeps happening.');
  } else {
    lines.push('Nothing found across active sources.');
    lines.push('Try a different term or format.');
  }

  if (meta.failures?.length && !meta.allAuth) {
    const issueNames = meta.failures
      .map(({ name, status }) => `${name} (${status})`)
      .slice(0, 6);

    if (issueNames.length) {
      lines.push('');
      lines.push(`Source status: ${issueNames.join(', ')}`);
    }
  }

  lines.push('', supportLine());
  return lines.join('\n');
}

function machineNoResultsMessage(query) {
  return [
    header('Machine Viewer'),
    '',
    `Query: <code>${escapeHtml(query)}</code>`,
    '',
    'No machines matched this query.',
    '',
    supportLine()
  ].join('\n');
}

function searchProgressMessage(query, count, options = {}) {
  const lines = [
    header('Searching'),
    '',
    `Query: <code>${escapeHtml(query)}</code>`
  ];

  if (options.elapsed != null) {
    lines.push(`Elapsed: <b>${options.elapsed}s</b>`);
  }

  if (options.status === 'stealer') {
    lines.push('Status: scanning stealer logs...');
    lines.push('Fast sources finished — waiting on database search.');
  } else if (count > 0) {
    lines.push(`Status: <b>${count}</b> result${count === 1 ? '' : 's'} found`);
    lines.push('Checking remaining sources...');
  } else {
    lines.push('Status: scanning breach and database sources...');
  }

  return lines.join('\n');
}

function machineProgressMessage(query) {
  return [
    header('Machine Viewer'),
    '',
    `Query: <code>${escapeHtml(query)}</code>`,
    'Status: searching infected machines...'
  ].join('\n');
}

function resultsHeader(query, page, totalPages, total, sourceCounts = {}) {
  const lines = [
    header('Results'),
    '',
    `Query: <code>${escapeHtml(query)}</code>`,
    `Page ${page + 1} of ${totalPages}  |  ${total} total`
  ];

  const summary = formatSourceSummary(sourceCounts);
  if (summary) {
    lines.push(summary);
  }

  lines.push(`<code>${'─'.repeat(22)}</code>`);
  return lines.join('\n');
}

function machineResultsHeader(query, page, totalPages, total) {
  return [
    header('Machine Viewer'),
    '',
    `Query: <code>${escapeHtml(query)}</code>`,
    `Page ${page + 1} of ${totalPages}  |  ${total} machines`,
    `<code>${'─'.repeat(22)}</code>`
  ].join('\n');
}

function formatResultBlock(index, result) {
  const label = result.source || 'RESULT';
  const isStealer = label === 'STEALER';
  const lines = [`<b>[${index}]</b>  ${escapeHtml(label)}`];

  const entries = isStealer
    ? orderFields(result.fields || {}, STEALER_FIELD_ORDER)
    : Object.entries(result.fields || {});

  entries.forEach(([key, value]) => {
    lines.push(`${escapeHtml(key)}: <code>${escapeHtml(truncateValue(value))}</code>`);
  });

  return lines.join('\n');
}

function formatMachineBlock(index, machine) {
  const lines = [
    `<b>[${index}]</b>  ${escapeHtml(machine.name)}`,
    `Files: <code>${machine.file_count}</code>`,
    `Size: <code>${machine.size}</code>`,
    `OS: <code>${escapeHtml(machine.os)}</code>`,
    `ID: <code>${escapeHtml(machine.id)}</code>`
  ];

  if (machine.imported_at) {
    lines.push(`Imported: <code>${escapeHtml(machine.imported_at)}</code>`);
  }

  return lines.join('\n');
}

module.exports = {
  welcomeMessage,
  howItWorksMessage,
  aiSearchMessage,
  pricingMessage,
  planDetailMessage,
  noAccessMessage,
  premiumRequiredMessage,
  errorMessage,
  noResultsMessage,
  machineNoResultsMessage,
  searchProgressMessage,
  machineProgressMessage,
  resultsHeader,
  machineResultsHeader,
  formatResultBlock,
  formatMachineBlock,
  formatSourceSummary,
  truncateValue,
  escapeHtml,
  header,
  supportLine,
  purchaseLine
};
