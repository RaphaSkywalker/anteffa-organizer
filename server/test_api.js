const jwt = require('jsonwebtoken');
const http = require('http');

const JWT_SECRET = 'anteffa_secret_key_2026';
const token = jwt.sign({ id: 1, username: 'admin', role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/tasks',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + token
  }
};

const req = http.request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Tasks API Status:', res.statusCode, data));
});
req.on('error', e => console.error(e));
req.end();
