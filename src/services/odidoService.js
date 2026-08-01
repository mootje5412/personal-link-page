const dns = require('dns');
const https = require('https');
const config = require('../../config/config');
const { buildSearchVariants, cleanQuery, detectQueryType } = require('../utils/queryVariants');
const { dedupeResults, refineResults } = require('../utils/resultFilters');
const { extractResults } = require('../utils/formatResults');

dns.setDefaultResultOrder('ipv4first');

const REQUEST_TIMEOUT_MS = 30000;
const ipv4Agent = new https.Agent({ family: 4, keepAlive: true });

async function searchOdidoOnce(query) {
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

async function searchOdido(query) {
  const originalQuery = cleanQuery(query);

  if (!originalQuery) {
    throw new Error('Stuur een zoekterm om te beginnen.');
  }

  const variants = buildSearchVariants(originalQuery);
  const responses = await Promise.all(
    variants.map(async (variant) => {
      try {
        const data = await searchOdidoOnce(variant);
        return extractResults(data);
      } catch {
        return [];
      }
    }),
  );

  const merged = dedupeResults(responses.flat());
  let refined = refineResults(originalQuery, merged, { strict: true });
  let broad = false;

  if (!refined.length && ['fullname', 'name', 'phone'].includes(detectQueryType(originalQuery))) {
    refined = refineResults(originalQuery, merged, { strict: false });
    broad = refined.length > 0;
  }

  return {
    query: originalQuery,
    variants,
    results: refined,
    total: refined.length,
    broad,
  };
}

module.exports = {
  searchOdido,
};
