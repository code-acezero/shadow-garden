const http = require('http');

const messages = [
  { role: 'user', content: 'What is our current objective?' }
];

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/alpha',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Response:', data));
});

req.on('error', e => console.error(e));
req.write(JSON.stringify({ messages }));
req.end();
