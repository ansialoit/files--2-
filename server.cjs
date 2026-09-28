const http = require('http'), fs = require('fs'), path = require('path'), https = require('https');
const root = 'c:/Users/M3no_/Downloads/files';
const localSecretsPath = path.join(__dirname, 'rakuten-secrets.json');
let localSecrets = {};
try { localSecrets = JSON.parse(fs.readFileSync(localSecretsPath, 'utf8')); } catch {}
// Keep credentials on the server; never expose them in browser storage or URLs.
const RAKUTEN_APP_ID = process.env.RAKUTEN_APP_ID || localSecrets.applicationId || '4a1536a7-07f1-4858-96cb-261b61c7a2d3';
const RAKUTEN_ACCESS_KEY = process.env.RAKUTEN_ACCESS_KEY || localSecrets.accessKey || '';

function proxyRakuten(query, res) {
  const params = new URLSearchParams(query);
  params.set('applicationId', RAKUTEN_APP_ID);
  if (!RAKUTEN_APP_ID) {
    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({ error: 'applicationId not set' }));
    return;
  }
  if (!RAKUTEN_ACCESS_KEY) {
    res.writeHead(503, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({ error: 'Rakuten Access Key is required. Set RAKUTEN_ACCESS_KEY on the server.' }));
    return;
  }
  params.set('format', 'json');
  const url = 'https://openapi.rakuten.co.jp/services/api/BooksBook/Search/20170404?' + params.toString();
  https.get(url, { headers: { accessKey: RAKUTEN_ACCESS_KEY } }, (up) => {
    let body = '';
    up.on('data', (c) => (body += c));
    up.on('end', () => {
      res.writeHead(up.statusCode || 502, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
      res.end(body);
    });
  }).on('error', (e) => {
    res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({ error: String(e) }));
  });
}

http.createServer((req, res) => {
  if (req.url.startsWith('/api/rakuten')) {
    return proxyRakuten(req.url.split('?')[1] || '', res);
  }
  let f = path.join(root, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
  fs.readFile(f, (e, d) => {
    if (e) { res.writeHead(404); res.end('nf'); return }
    res.writeHead(200); res.end(d);
  });
}).listen(8431, () => console.log('up'));
