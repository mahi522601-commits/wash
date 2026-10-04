import https from 'node:https';

function testLiveEndpoint(hostname, bearerToken = '') {
  return new Promise((resolve) => {
    console.log(`\nSending POST to https://${hostname}/api/daily-sales-report...`);
    const data = JSON.stringify({ action: 'test_email', testMode: true, force: true });

    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
    };
    if (bearerToken) {
      headers['Authorization'] = `Bearer ${bearerToken}`;
    }

    const req = https.request(
      {
        hostname,
        port: 443,
        path: '/api/daily-sales-report',
        method: 'POST',
        headers,
      },
      res => {
        console.log(`HTTP Status: ${res.statusCode} ${res.statusMessage}`);
        console.log('Response Headers:', JSON.stringify(res.headers, null, 2));

        let body = '';
        res.on('data', chunk => (body += chunk));
        res.on('end', () => {
          console.log('Response Body:');
          console.log(body);
          resolve({ status: res.statusCode, headers: res.headers, body });
        });
      }
    );

    req.on('error', err => {
      console.error('Request Error:', err);
      resolve({ error: err });
    });

    req.write(data);
    req.end();
  });
}

async function run() {
  await testLiveEndpoint('www.techwashlaundry.com');
  await testLiveEndpoint('wash-mahi522601-commits-projects.vercel.app');
  await testLiveEndpoint('laundry-37abc.vercel.app');
}

run().then(() => process.exit(0));
