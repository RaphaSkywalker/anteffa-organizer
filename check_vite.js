const http = require('http');
http.get('http://localhost:8082', res => {
  console.log(res.statusCode);
}).on('error', e => console.error(e));
