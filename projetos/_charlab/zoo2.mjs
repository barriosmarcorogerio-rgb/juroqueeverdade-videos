import http from 'http'; import fs from 'fs'; import path from 'path';
const pw = await import('playwright-core'); const root = path.resolve('web');
const srv = http.createServer((q, s) => { const p = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(p)) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'Content-Type': p.endsWith('.js') ? 'text/javascript' : 'text/html' }); fs.createReadStream(p).pipe(s); }).listen(0);
await new Promise(r => srv.on('listening', r));
const b = await pw.chromium.launch({ executablePath: fs.readFileSync('.chrome', 'utf8').trim() }); const pg = await b.newPage({ viewport: { width: 2000, height: 1000 } });
pg.on('pageerror', e => console.log('ERR', e.message));
await pg.goto(`http://localhost:${srv.address().port}/zoo2.html`); await pg.waitForFunction(() => window.ready, null, { timeout: 30000 });
await pg.screenshot({ path: 'stills/zoo2.png' }); await b.close(); srv.close(); console.log('ok');
