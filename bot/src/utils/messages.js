const config = require('../../config/config');
const PLANS = require('../../config/plans');

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function header(title) {
  return `<b>${escapeHtml(config.botName.toUpperCase())}</b>\n<code>${'─'.repeat(20)}</code>\n<b>${escapeHtml(title)}</b>`;
}

function welcomeMessage(firstName) {
  return [
    header('Home'),
    '',
    `Welcome, <b>${escapeHtml(firstName)}</b>.`,
    '',
    'ApexSearch is an OSINT intelligence platform.',
    'Send any query to search breach, stealer, and public data sources.',
    '',
    '<b>Commands</b>',
    '<code>/start</code> — Main menu',
    '<code>/prices</code> — View plans',
    '<code>/account</code> — Your subscription',
    '<code>/machine &lt;name&gt;</code> — Machine lookup (Premium)',
    '',
    'Type a query below to begin.'
  ].join('\n');
}

function howItWorksMessage() {
  return [
    header('How It Works'),
    '',
    '1. Send any search term as a plain message',
    '2. ApexSearch queries multiple OSINT sources in parallel',
    '3. Results are returned in pages of 10',
    '4. Navigate with Prev / Next buttons',
    '',
    '<b>Supported queries</b>',
    'Usernames, emails, phone numbers, IP addresses, Discord IDs, and general terms.',
    '',
    '<b>Example</b>',
    '<code>john@gmail.com</code>',
    '<code>192.168.1.1</code>',
    '<code>username123</code>'
  ].join('\n');
}

function aiSearchMessage() {
  return [
    header('AI Search'),
    '',
    'ApexSearch uses intelligent query detection to route your search to the right sources automatically.',
    '',
    '<b>Detection</b>',
    'Email — breach and credential databases',
    'Phone — carrier and leak lookup',
    'IP — geolocation and WHOIS',
    'Username — cross-platform matching',
    'Discord ID — profile enrichment',
    '',
    'Results are ranked and deduplicated before delivery.'
  ].join('\n');
}

function pricingMessage() {
  const basic = PLANS.basic;
  const premium = PLANS.premium;

  return [
    header('Pricing'),
    '',
    `<b>${basic.name}</b> — €${basic.price}/${basic.period}`,
    'Unlimited searches',
    'Full OSINT database access',
    '',
    `<b>${premium.name}</b> — €${premium.price}/${premium.period}`,
    'Unlimited searches',
    'Machine Viewer included',
    '<code>/machine</code> command access',
    '',
    '<b>Payment methods</b>',
    ...config.paymentMethods.map((m) => `· ${m}`),
    '',
    'Contact the owner with your User ID to purchase.'
  ].join('\n');
}

function planDetailMessage(planId) {
  const plan = PLANS[planId];
  if (!plan) return pricingMessage();

  return [
    header(`${plan.name} Plan`),
    '',
    `Price: <b>€${plan.price}/${plan.period}</b>`,
    `Searches: <b>${plan.searches}</b>`,
    plan.machineViewer ? 'Machine Viewer: <b>included</b>' : 'Machine Viewer: <b>not included</b>',
    '',
    '<b>Includes</b>',
    ...plan.features.map((f) => `· ${f}`),
    '',
    '<b>Payment methods</b>',
    ...config.paymentMethods.map((m) => `· ${m}`),
    '',
    'Send your User ID to the owner to activate.'
  ].join('\n');
}

function noAccessMessage(reason) {
  return [
    header('Access Denied'),
    '',
    escapeHtml(reason),
    '',
    'Use /prices to view plans or contact the owner.'
  ].join('\n');
}

function premiumRequiredMessage() {
  return [
    header('Premium Required'),
    '',
    'Machine Viewer requires a Premium subscription.',
    '',
    'Upgrade to Premium for €25,00/month.',
    'Use /prices to view details.'
  ].join('\n');
}

function searchProgressMessage(query, count) {
  const lines = [
    header('Searching'),
    '',
    `Query: <code>${escapeHtml(query)}</code>`
  ];

  if (count > 0) {
    lines.push(`Status: ${count} result${count === 1 ? '' : 's'} found...`);
  } else {
    lines.push('Status: scanning sources...');
  }

  return lines.join('\n');
}

function machineProgressMessage(query) {
  return [
    header('Machine Viewer'),
    '',
    `Query: <code>${escapeHtml(query)}</code>`,
    'Status: searching machines...'
  ].join('\n');
}

function resultsHeader(query, page, totalPages, total) {
  return [
    header('Results'),
    '',
    `Query: <code>${escapeHtml(query)}</code>`,
    `Page ${page + 1} of ${totalPages} — ${total} total`,
    `<code>${'─'.repeat(20)}</code>`
  ].join('\n');
}

function machineResultsHeader(query, page, totalPages, total) {
  return [
    header('Machine Viewer'),
    '',
    `Query: <code>${escapeHtml(query)}</code>`,
    `Page ${page + 1} of ${totalPages} — ${total} machines`,
    `<code>${'─'.repeat(20)}</code>`
  ].join('\n');
}

function formatResultBlock(index, result) {
  const label = result.source || 'RESULT';
  const lines = [`<b>[${index}]</b> ${escapeHtml(label)}`];

  Object.entries(result.fields).forEach(([key, value]) => {
    lines.push(`${escapeHtml(key)}: <code>${escapeHtml(String(value))}</code>`);
  });

  return lines.join('\n');
}

function formatMachineBlock(index, machine) {
  const lines = [
    `<b>[${index}]</b> ${escapeHtml(machine.name)}`,
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
  searchProgressMessage,
  machineProgressMessage,
  resultsHeader,
  machineResultsHeader,
  formatResultBlock,
  formatMachineBlock,
  escapeHtml,
  header
};
