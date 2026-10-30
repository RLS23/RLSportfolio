/* Builds assets/docs/RLS-Portfolio.pdf from portfolio.html.

   Run:   npm install playwright && npx playwright install chromium
          node scripts/build-pdf.js

   It serves this folder locally, opens portfolio.html in headless Chromium and
   prints it to an A4-landscape PDF. The project list is read from
   content/projects on disk, so the PDF always contains every project. */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'assets', 'docs', 'RLS-Portfolio.pdf');
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.md': 'text/plain; charset=utf-8', '.woff': 'font/woff',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.JPG': 'image/jpeg', '.svg': 'image/svg+xml',
};

function listMd(folder) {
  const dir = path.join(ROOT, folder);
  return fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('.md')).sort().map(name => ({ name })) : [];
}

function startServer() {
  const server = http.createServer((req, res) => {
    const rel = decodeURIComponent(req.url.split('?')[0]);
    const file = path.join(ROOT, rel === '/' ? 'index.html' : rel);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404); return res.end('not found');
    }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(server)));
}

(async () => {
  const server = await startServer();
  const base = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1123, height: 794 } });
    page.on('pageerror', e => console.error('page error:', e.message));

    await page.route('**/*', route => {
      const url = route.request().url();
      // Read the content lists from disk instead of the GitHub API (no rate limits, always current).
      if (url.startsWith('https://api.github.com/') && url.includes('/contents/content/projects')) {
        return route.fulfill({ json: listMd('content/projects') });
      }
      if (url.startsWith('https://api.github.com/') && url.includes('/contents/content/testimonials')) {
        return route.fulfill({ json: listMd('content/testimonials') });
      }
      if (process.env.JSYAML_PATH && url.includes('js-yaml')) {
        return route.fulfill({ path: process.env.JSYAML_PATH, contentType: 'text/javascript' });
      }
      return route.continue();
    });

    await page.goto(base + '/portfolio.html', { waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.__portfolioReady === true, null, { timeout: 90000 });
    const err = await page.evaluate(() => window.__portfolioError || null);
    if (err) throw new Error('portfolio.html failed to build: ' + err);

    const stats = await page.evaluate(() => ({ pages: window.__portfolioPages, projects: window.__portfolioProjects }));
    if (!stats.projects) throw new Error('No projects were found, refusing to overwrite the PDF.');

    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    await page.pdf({
      path: OUT, width: '297mm', height: '210mm', printBackground: true, preferCSSPageSize: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });
    const kb = Math.round(fs.statSync(OUT).size / 1024);
    console.log('Wrote ' + path.relative(ROOT, OUT) + ' — ' + stats.pages + ' pages, ' + stats.projects + ' projects, ' + kb + ' KB');
  } finally {
    await browser.close();
    server.close();
  }
})().catch(e => { console.error(e); process.exit(1); });
