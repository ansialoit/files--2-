const http = require('http');
const fs = require('fs');
const path = require('path');
const root = __dirname;
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
const secretsPath = path.join(__dirname, 'rakuten-secrets.json');
let localSecrets = {};
try { localSecrets = JSON.parse(fs.readFileSync(secretsPath, 'utf8')); } catch {}

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/api/rakuten/books') {
    const appId = process.env.RAKUTEN_APPLICATION_ID || localSecrets.applicationId || '4a1536a7-07f1-4858-96cb-261b61c7a2d3';
    const accessKey = process.env.RAKUTEN_ACCESS_KEY || localSecrets.accessKey;
    if (!appId || !accessKey) return sendJson(res, 503, {error:'サーバーに楽天API認証情報が設定されていません。'});
    const q = (url.searchParams.get('q') || '').trim();
    if (!q || q.length > 120) return sendJson(res, 400, {error:'検索語は1〜120文字で入力してください。'});
    try {
      const apiUrl = new URL('https://app.rakuten.co.jp/services/api/BookTotal/Search/20170404');
      apiUrl.searchParams.set('applicationId', appId);
      apiUrl.searchParams.set('format', 'json');
      apiUrl.searchParams.set('formatVersion', '2');
      apiUrl.searchParams.set('keyword', q);
      apiUrl.searchParams.set('hits', '8');
      const upstream = await fetch(apiUrl, {headers:{accessKey}, signal:AbortSignal.timeout(12000)});
      const data = await upstream.json();
      if (!upstream.ok) return sendJson(res, upstream.status, {error:data.error_description || data.error || `楽天APIエラー (HTTP ${upstream.status})`});
      return sendJson(res, 200, data);
    } catch (error) {
      return sendJson(res, 502, {error:'楽天ブックスAPIに接続できませんでした。'});
    }
  }
  let pathname;
  try { pathname = decodeURIComponent(url.pathname); } catch { res.writeHead(400); return res.end('Bad request'); }
  const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(root + path.sep) && file !== path.join(root, 'index.html')) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, {'Content-Type':mime[path.extname(file).toLowerCase()] || 'application/octet-stream'});
    res.end(data);
  });
}).listen(Number(process.env.PORT) || 8431, () => console.log(`PhotoShelf running on port ${Number(process.env.PORT) || 8431}`));

function sendJson(res, status, data) {
  res.writeHead(status, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
  res.end(JSON.stringify(data));
}
