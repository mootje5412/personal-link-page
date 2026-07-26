const dns = require('dns');
const https = require('https');
const config = require('../../config/config');

dns.setDefaultResultOrder('ipv4first');

const REQUEST_TIMEOUT_MS = 30000;
const ipv4Agent = new https.Agent({ family: 4, keepAlive: true });

async function searchOdido(query) {
  const url = new URL(config.odidoApiUrl);
  url.searchParams.set('q', query.trim());
  url.searchParams.set('key', config.odidoApiKey);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent': `${config.botName}/${config.version}`,
      },
      signal: controller.signal,
      agent: ipv4Agent,
    });

    const raw = await response.text();
    let data;

    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      throw new Error('Ongeldig antwoord van de zoek-API.');
    }

    if (data.success === false && data.error) {
      throw new Error(data.error);
    }

    if (!response.ok) {
      throw new Error(data.error || data.message || `API-fout (${response.status})`);
    }

    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Zoeken duurde te lang. Probeer het opnieuw.');
    }

    if (error.message) {
      throw error;
    }

    throw new Error('Kon geen verbinding maken met de zoek-API. Probeer later opnieuw.');
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = {
  searchOdido,
};
