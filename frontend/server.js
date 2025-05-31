const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const port = 5000;
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.woff': 'application/font-woff',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.wasm': 'application/wasm'
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  let pathname = `.${parsedUrl.pathname}`;

  // Default to index.html for root
  if (pathname === './') {
    pathname = './index.html';
  }

  const ext = path.parse(pathname).ext;

  fs.readFile(pathname, (err, data) => {
    if (err) {
      // For any file not found, serve index.html (React Router)
      fs.readFile('./index.html', (err, data) => {
        if (err) {
          res.statusCode = 500;
          res.end('Error loading index.html');
        } else {
          res.setHeader('Content-type', 'text/html');
          res.end(data);
        }
      });
    } else {
      res.setHeader('Content-type', mimeTypes[ext] || 'text/plain');
      res.end(data);
    }
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`React development server running on http://0.0.0.0:${port}`);
  console.log('All routes now support client-side routing');
});