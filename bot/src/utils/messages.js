const config = require('../../config/config');

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function welcomeMessage(firstName) {
  return [
    `✨ <b>Welcome to ${escapeHtml(config.botName)}</b>`,
    '',
    `Hey <b>${escapeHtml(firstName)}</b> 👋`,
    '',
    'We are an <b>intelligent OSINT search bot</b> — send any query and we scan multiple data sources in real time.',
    '',
    '🔎 <b>What you can search:</b>',
    '• Usernames &amp; emails',
    '• Phone numbers &amp; IPs',
    '• Discord, Roblox &amp; more',
    '',
    '📝 <b>Just type your query</b> — no command needed.',
    '',
    '<i>Tap a button below to learn more.</i>'
  ].join('\n');
}

function howItWorksMessage() {
  return [
    '🔍 <b>How It Works</b>',
    '',
    '1️⃣ Send any search term as a plain message',
    '2️⃣ We query breach, stealer &amp; OSINT databases',
    '3️⃣ Results appear in clean pages of 10',
    '4️⃣ Use ◀ ▶ buttons to browse pages',
    '',
    '⚡ Fast parallel searching',
    '🔒 Access controlled by subscription',
    '📊 Daily search limits per plan',
    '',
    '<i>Example: send</i> <code>john@gmail.com</code> <i>or</i> <code>cooluser123</code>'
  ].join('\n');
}

function aiSearchMessage() {
  return [
    '🤖 <b>AI-Powered Search</b>',
    '',
    'Our engine uses smart query detection:',
    '',
    '📧 Emails → breach &amp; credential checks',
    '📱 Phones → carrier &amp; leak lookup',
    '🌐 IPs → geolocation &amp; WHOIS',
    '👤 Usernames → cross-platform matching',
    '🎮 Discord IDs → profile enrichment',
    '',
    'More sources are added continuously.',
    '',
    '<i>API integrations are being wired up — search UI is live now.</i>'
  ].join('\n');
}

function pricingMessage() {
  return [
    '💎 <b>Pricing Plans</b>',
    '',
    'Choose a plan and contact the owner to activate:',
    '',
    '• <b>Basic</b> — 50 searches/day — €5/mo',
    '• <b>Standard</b> — 150 searches/day — €10/mo',
    '• <b>Premium</b> — 500 searches/day — €25/mo',
    '',
    'Tap a plan below for details.'
  ].join('\n');
}

function noAccessMessage(reason) {
  return [
    '🔒 <b>Access Required</b>',
    '',
    escapeHtml(reason),
    '',
    'Contact the owner or use /prices to view plans.'
  ].join('\n');
}

function searchProgressMessage(query, count) {
  if (count > 0) {
    return [
      '🔎 <b>Searching...</b>',
      '',
      `Query: <code>${escapeHtml(query)}</code>`,
      `Found <b>${count}</b> result${count === 1 ? '' : 's'} so far...`
    ].join('\n');
  }

  return [
    '🔎 <b>Searching...</b>',
    '',
    `Query: <code>${escapeHtml(query)}</code>`,
    'Scanning breach, stealer &amp; OSINT sources...'
  ].join('\n');
}

function resultsHeader(query, page, totalPages, total) {
  return [
    '━━ <b>Search Results</b> ━━',
    `Query: <code>${escapeHtml(query)}</code>`,
    `Page <b>${page + 1}/${totalPages}</b> · <b>${total}</b> total`,
    '────────────────────'
  ].join('\n');
}

function formatResultBlock(index, result) {
  const label = result.source || 'RESULT';
  const lines = [`<b>[${index}]</b> <i>${escapeHtml(label)}</i>`];

  Object.entries(result.fields).forEach(([key, value]) => {
    lines.push(`${escapeHtml(key)}: <code>${escapeHtml(String(value))}</code>`);
  });

  return lines.join('\n');
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
  escapeHtml
};
