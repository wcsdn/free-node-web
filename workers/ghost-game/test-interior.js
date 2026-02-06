const http = require('http');

const testEndpoint = (path, method = 'GET') => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 8788,
      path: path,
      method: method,
      headers: {
        'X-Wallet-Auth': '0x1234567890abcdef1234567890abcdef12345678:test',
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, data: data });
      });
    });

    req.on('error', reject);
    req.setTimeout(5000, () => { req.destroy(); resolve({ error: 'Timeout' }); });
    req.end();
  });
};

async function main() {
  console.log('Testing /api/game...');
  let r = await testEndpoint('/api/game');
  console.log('Status:', r.status, 'Data:', r.data.substring(0, 200));

  console.log('\nTesting POST /api/game/city/interior/1...');
  r = await testEndpoint('/api/game/city/interior/1', 'POST');
  console.log('Status:', r.status, 'Data:', r.data.substring(0, 500));
}

main().catch(e => console.error(e.message));
