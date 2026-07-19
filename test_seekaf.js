const https = require('https');
const config = require('./config/config');

function postJson(path, body) {
  return new Promise((resolve) => {
    const payload = JSON.stringify(body);
    const options = {
      hostname: 'see-know.xyz',
      path: `/api/v1${path}`,
      method: 'POST',
      headers: {
        'X-API-Key': config.seekAfApiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': config.seekAfUserAgent || 'FindNow-OSINT-Bot/1.0',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 15000
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let parsed = data;
        try {
          parsed = JSON.parse(data);
        } catch (error) {
          // keep raw string
        }

        resolve({ statusCode: res.statusCode, parsed, raw: data });
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ statusCode: 0, parsed: { error: 'timeout' }, raw: '' });
    });

    req.on('error', (error) => {
      resolve({ statusCode: 0, parsed: { error: error.message }, raw: '' });
    });

    req.write(payload);
    req.end();
  });
}

async function runTest(name, path, body) {
  console.log(`\n=== ${name} ===`);
  console.log(`POST https://see-know.xyz/api/v1${path}`);
  console.log(`Body: ${JSON.stringify(body)}`);

  const { statusCode, parsed, raw } = await postJson(path, body);
  console.log(`Status: ${statusCode}`);

  if (statusCode === 200 && parsed && typeof parsed === 'object') {
    console.log('SUCCESS');
    console.log(`  success: ${parsed.success}`);
    console.log(`  query: ${parsed.query}`);
    console.log(`  type: ${parsed.type}`);
    console.log(`  total: ${parsed.total}`);
    console.log(`  credits_remaining: ${parsed.credits_remaining}`);
    console.log(`  search_id: ${parsed.search_id || parsed.id || 'n/a'}`);
    console.log(`  results: ${Array.isArray(parsed.results) ? parsed.results.length : 0}`);
    return;
  }

  if (typeof parsed === 'string' && parsed.includes('Just a moment')) {
    console.log('BLOCKED by Cloudflare. Whitelist your server IP in the see-know.xyz dashboard.');
    return;
  }

  console.log('FAILED');
  console.log(typeof parsed === 'string' ? raw.substring(0, 400) : JSON.stringify(parsed).substring(0, 400));
}

async function main() {
  console.log('SeekAF API test');
  console.log(`Key prefix: ${String(config.seekAfApiKey).slice(0, 12)}...`);

  await runTest('Universal Search', '/search', {
    query: 'test@example.com',
    type: 'email',
    limit: 5
  });

  await runTest('Stealer Logs', '/stealer', {
    query: 'test@example.com',
    deep: true,
    limit: 5
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
