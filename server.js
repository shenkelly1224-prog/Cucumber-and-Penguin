'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const port = Number(process.env.PORT || 10000);
const files = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/index.html': ['index.html', 'text/html; charset=utf-8'],
  '/styles.css': ['styles.css', 'text/css; charset=utf-8'],
  '/game.js': ['game.js', 'text/javascript; charset=utf-8']
};

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' });
    return res.end();
  }

  let pathname;
  try {
    pathname = new URL(req.url, 'http://localhost').pathname;
  } catch {
    res.writeHead(400);
    return res.end('Bad request');
  }

  if (pathname === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end(req.method === 'HEAD' ? undefined : 'ok');
  }

  const asset = files[pathname];
  if (!asset) {
    res.writeHead(404);
    return res.end('Not found');
  }

  fs.readFile(path.join(__dirname, asset[0]), (error, contents) => {
    if (error) {
      console.error('Failed to read ' + asset[0] + ': ' + error.message);
      res.writeHead(500);
      return res.end('Internal server error');
    }
    res.writeHead(200, {
      'Content-Type': asset[1],
      'Cache-Control': 'no-cache'
    });
    res.end(req.method === 'HEAD' ? undefined : contents);
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log('Cucumber-and-Penguin listening on 0.0.0.0:' + port);
});
