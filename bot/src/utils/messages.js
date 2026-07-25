const config = require('../../config/config');

function welcomeMessage(firstName) {
  return [
    `✨ *Welcome to ${config.botName}*`,
    '',
    `Hey *${escapeMarkdown(firstName)}* 👋`,
    '',
    'We are an *intelligent OSINT search bot* — send any query and we scan multiple data sources in real time.',
    '',
    '🔎 *What you can search:*',
    '• Usernames & emails',
    '• Phone numbers & IPs',
    '• Discord, Roblox & more',
    '',
    '📝 *Just type your query* — no command needed.',
    '',
    '_Tap a button below to learn more._'
  ].join('\n');
}

function howItWorksMessage() {
  return [
    '🔍 *How It Works*',
    '',
    '1️⃣ Send any search term as a plain message',
    '2️⃣ We query breach, stealer & OSINT databases',
    '3️⃣ Results appear in clean pages of 10',
    '4️⃣ Use ◀ ▶ buttons to browse pages',
    '',
    '⚡ Fast parallel searching',
    '🔒 Access controlled by subscription',
    '📊 Daily search limits per plan',
    '',
    '_Example: send_ `john@gmail.com` _or_ `cooluser123`'
  ].join('\n');
}

function aiSearchMessage() {
  return [
    '🤖 *AI\\-Powered Search*',
    '',
    'Our engine uses smart query detection:',
    '',
    '📧 Emails → breach & credential checks',
    '📱 Phones → carrier & leak lookup',
    '🌐 IPs → geolocation & WHOIS',
    '👤 Usernames → cross\\-platform matching',
    '🎮 Discord IDs → profile enrichment',
    '',
    'More sources are added continuously\\.',
    '',
    '_API integrations are being wired up — search UI is live now\\._'
  ].join('\n');
}

function pricingMessage() {
  return [
    '💎 *Pricing Plans*',
    '',
    'Choose a plan and contact the owner to activate:',
    '',
    '• *Basic* — 50 searches/day — €5/mo',
    '• *Standard* — 150 searches/day — €10/mo',
    '• *Premium* — 500 searches/day — €25/mo',
    '',
    'Tap a plan below for details\\.'
  ].join('\n');
}

function noAccessMessage(reason) {
  return [
    '🔒 *Access Required*',
    '',
    reason,
    '',
    'Contact the owner or use /prices to view plans\\.'
  ].join('\n');
}

function searchProgressMessage(query, count) {
  if (count > 0) {
    return [
      '🔎 *Searching\\.\\.\\.*',
      '',
      `Query: \`${escapeMarkdown(query)}\``,
      `Found *${count}* result${count === 1 ? '' : 's'} so far\\.\\.\\.`
    ].join('\n');
  }

  return [
    '🔎 *Searching\\.\\.\\.*',
    '',
    `Query: \`${escapeMarkdown(query)}\``,
    'Scanning breach, stealer & OSINT sources\\.\\.\\.'
  ].join('\n');
}

function resultsHeader(query, page, totalPages, total) {
  return [
    '━━ *Search Results* ━━',
    `Query: \`${escapeMarkdown(query)}\``,
    `Page *${page + 1}/${totalPages}* · *${total}* total`,
    '────────────────────'
  ].join('\n');
}

function formatResultBlock(index, result) {
  const label = result.source || 'RESULT';
  const lines = [`*[${index}]* _${escapeMarkdown(label)}_`];

  Object.entries(result.fields).forEach(([key, value]) => {
    lines.push(`${escapeMarkdown(key)}: \`${escapeMarkdown(String(value))}\``);
  });

  return lines.join('\n');
}

function escapeMarkdown(text) {
  return String(text).replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&');
}

module.exports = {
  welcomeMessage,
  howItWorksMessage,
  aiSearchMessage,
  pricingMessage,
  noAccessMessage,
  searchProgressMessage,
  resultsHeader,
  formatResultBlock,
  escapeMarkdown
};
