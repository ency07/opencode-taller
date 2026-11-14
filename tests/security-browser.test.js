'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');

const root = path.join(__dirname, '..');
const payload = '<img src=x onerror="window.__xss=1">';
const history = [{
  id: '1);window.__xss=2;//',
  tema: payload,
  mercado: payload,
  fecha: payload,
  prompt: payload,
  noGospel: false
}];

function serve(req, res) {
  const pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
  const file = path.resolve(root, '.' + pathname);
  if (!file.startsWith(root + path.sep)) {
    res.writeHead(403).end('Forbidden');
    return;
  }
  fs.readFile(file, (error, data) => {
    if (error) { res.writeHead(404).end('Not found'); return; }
    const ext = path.extname(file);
    const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
    res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

(async () => {
  const server = http.createServer(serve);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.addInitScript(value => {
      localStorage.setItem('promptHistorial', JSON.stringify(value));
      window.__xss = 0;
    }, history);
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.goto('http://127.0.0.1:' + address.port + '/constructor-prompt.html', { waitUntil: 'load' });

    const items = page.locator('#historial .history-item');
    assert.equal(await items.count(), 1, 'persisted history entry should render');
    assert.equal(await page.locator('#historial img').count(), 0, 'HTML payload must remain text, not become an image node');
    assert.equal(await page.evaluate(() => window.__xss), 0, 'stored HTML and inline-handler payload must not execute');
    const renderedText = await page.locator('#historial').innerText();
    assert.ok(renderedText.includes(payload), 'escaped payload should remain visible as literal text');
    const action = await items.locator('button').first().getAttribute('onclick');
    assert.equal(action, 'cargarHistorial(-1)', 'malformed persisted ID must be replaced with a safe numeric argument');
    assert.deepEqual(pageErrors, [], 'page should load without uncaught JavaScript errors');

    console.log('PASS security-browser (6 assertions)');
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
