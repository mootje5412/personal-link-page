const SOURCES = ['BREACH', 'STEALER', 'SNUSBASE', 'DISCORD', 'ROBLOX', 'IP', 'PHONE', 'SEEKAF'];

function randomItem(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function generateMockFields(query) {
  const isEmail = query.includes('@');
  const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(query);
  const isPhone = /^\+?[\d\s-]{7,}$/.test(query);

  if (isEmail) {
    return {
      Email: query,
      Password: '••••••••',
      Source: randomItem(['Collection #1', 'LinkedIn 2021', 'Adobe 2013']),
      Breach: '2019-03-15'
    };
  }

  if (isIp) {
    return {
      IP: query,
      Country: randomItem(['US', 'DE', 'NL', 'GB', 'FR']),
      ISP: randomItem(['Cloudflare', 'AWS', 'Hetzner', 'OVH']),
      City: randomItem(['Amsterdam', 'Frankfurt', 'London', 'New York'])
    };
  }

  if (isPhone) {
    return {
      Phone: query,
      Carrier: randomItem(['T-Mobile', 'Verizon', 'Vodafone', 'KPN']),
      Country: randomItem(['US', 'NL', 'DE', 'GB']),
      Type: randomItem(['Mobile', 'Landline'])
    };
  }

  return {
    Username: query,
    Email: `${query.toLowerCase()}@example.com`,
    Password: '••••••••',
    Source: randomItem(['Stealer Log', 'Combo List', 'Breach DB']),
    LastSeen: '2024-11-02'
  };
}

function buildMockResult(query, index) {
  return {
    source: randomItem(SOURCES),
    fields: generateMockFields(query),
    index
  };
}

async function mockSearch(query, onProgress) {
  const totalResults = 12 + Math.floor(Math.random() * 19);
  const results = [];
  const steps = 4 + Math.floor(Math.random() * 3);

  for (let step = 0; step < steps; step += 1) {
    await delay(180 + Math.random() * 320);

    const targetCount = Math.min(totalResults, Math.ceil(((step + 1) / steps) * totalResults));
    while (results.length < targetCount) {
      results.push(buildMockResult(query, results.length + 1));
    }

    if (onProgress) {
      await onProgress(results.length);
    }
  }

  return results;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
  mockSearch
};
