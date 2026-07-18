const https = require('https');

console.log('=================================');
console.log('SeekAF API Test Script');
console.log('=================================\n');

// Test 1: SeekAF Universal Search
const testSearch = () => {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      query: 'test@example.com',
      type: 'email',
      limit: 5
    });
    
    const options = {
      hostname: 'see-know.xyz',
      path: '/api/v1/search',
      method: 'POST',
      headers: {
        'X-API-Key': 'seek-bde9d731a0cdaedf4ff93f71e321f24a52',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    console.log('Test 1: SeekAF Universal Search');
    console.log('URL: https://see-know.xyz/api/v1/search');
    console.log('Query: test@example.com');
    console.log('Waiting for response...\n');
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('Status Code:', res.statusCode);
        
        if (res.statusCode === 200) {
          console.log('✅ SUCCESS! SeekAF Universal Search is working!\n');
          try {
            const parsed = JSON.parse(data);
            console.log('Response Data:');
            console.log('  Success:', parsed.success);
            console.log('  Query:', parsed.query);
            console.log('  Type:', parsed.type);
            console.log('  Mode:', parsed.mode);
            console.log('  Total Results:', parsed.total);
            console.log('  Credits Remaining:', parsed.credits_remaining);
          } catch (e) {
            console.log('Response:', data.substring(0, 500));
          }
        } else if (res.statusCode === 403) {
          console.log('❌ BLOCKED - Cloudflare is blocking this IP');
          console.log('Response:', data.substring(0, 200));
        } else if (res.statusCode === 401) {
          console.log('❌ UNAUTHORIZED - Invalid API key');
          console.log('Response:', data.substring(0, 200));
        } else {
          console.log('❌ ERROR - Unexpected status code');
          console.log('Response:', data.substring(0, 300));
        }
        
        console.log('\n' + '='.repeat(50) + '\n');
        resolve();
      });
    });
    
    req.on('error', (err) => {
      console.log('❌ REQUEST ERROR:', err.message);
      console.log('\n' + '='.repeat(50) + '\n');
      resolve();
    });
    
    req.write(postData);
    req.end();
  });
};

// Test 2: SeekAF Stealer Logs
const testStealer = () => {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      query: 'test@example.com',
      deep: false,
      limit: 5
    });
    
    const options = {
      hostname: 'see-know.xyz',
      path: '/api/v1/stealer',
      method: 'POST',
      headers: {
        'X-API-Key': 'seek-bde9d731a0cdaedf4ff93f71e321f24a52',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    console.log('Test 2: SeekAF Stealer Logs');
    console.log('URL: https://see-know.xyz/api/v1/stealer');
    console.log('Query: test@example.com');
    console.log('Waiting for response...\n');
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('Status Code:', res.statusCode);
        
        if (res.statusCode === 200) {
          console.log('✅ SUCCESS! SeekAF Stealer Logs is working!\n');
          try {
            const parsed = JSON.parse(data);
            console.log('Response Data:');
            console.log('  Success:', parsed.success);
            console.log('  Mode:', parsed.mode);
            console.log('  Total Results:', parsed.total);
            console.log('  Local Count:', parsed.local_count);
            console.log('  External Count:', parsed.external_count);
            console.log('  Credits Remaining:', parsed.credits_remaining);
          } catch (e) {
            console.log('Response:', data.substring(0, 500));
          }
        } else if (res.statusCode === 403) {
          console.log('❌ BLOCKED - Cloudflare is blocking this IP');
          console.log('Response:', data.substring(0, 200));
        } else if (res.statusCode === 401) {
          console.log('❌ UNAUTHORIZED - Invalid API key');
          console.log('Response:', data.substring(0, 200));
        } else {
          console.log('❌ ERROR - Unexpected status code');
          console.log('Response:', data.substring(0, 300));
        }
        
        console.log('\n' + '='.repeat(50) + '\n');
        resolve();
      });
    });
    
    req.on('error', (err) => {
      console.log('❌ REQUEST ERROR:', err.message);
      console.log('\n' + '='.repeat(50) + '\n');
      resolve();
    });
    
    req.write(postData);
    req.end();
  });
};

// Run tests
(async () => {
  await testSearch();
  await testStealer();
  
  console.log('All tests complete!');
  console.log('\nIf you see ✅ SUCCESS, the SeekAF API is working on this server.');
  console.log('If you see ❌ BLOCKED, contact SeekAF support to whitelist your IP.');
})();
