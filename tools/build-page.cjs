// Збирає сторінку зі спільних частин головної (head, спрайт іконок, шапка, футер, нижня панель)
// та власного <main>. Тимчасове рішення, поки сайт на чистому HTML: шапка й футер не розходяться між сторінками.
// Використання: node tools/build-page.cjs <main.html> <out.html> "<title>" "<description>" <css> <js> [activeNav]
const fs = require('fs');
const path = require('path');

const [mainFile, outFile, title, description, css, js, active = ''] = process.argv.slice(2);
const web = path.join(__dirname, '..', 'web');
const index = fs.readFileSync(path.join(web, 'index.html'), 'utf8');
const main = fs.readFileSync(mainFile, 'utf8');

const between = (a, b) => { const i = index.indexOf(a); const j = index.indexOf(b, i); if (i < 0 || j < 0) throw new Error('not found: ' + a); return index.slice(i, j + b.length); };

let head = between('<!doctype html>', '</head>')
  .replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`)
  .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${description}">`)
  .replace(/<link rel="preload" as="image"[^>]*>\n/, '')
  .replace('<link rel="stylesheet" href="css/home.css">', css.split(',').map((c) => `<link rel="stylesheet" href="css/${c}">`).join('\n'));

let sprite = between('<svg width="0" height="0"', '</svg>');
const extra = `  <symbol id="i-heart" viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-9.5A4 4 0 0 1 12 8a4 4 0 0 1 7 2.5C19 15.6 12 20 12 20z"/></symbol>
  <symbol id="i-close" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></symbol>
  <symbol id="i-tick" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></symbol>
  <symbol id="i-minus" viewBox="0 0 24 24"><path d="M6 12h12"/></symbol>
  <symbol id="i-download" viewBox="0 0 24 24"><path d="M12 4v11M7.5 11l4.5 4.5 4.5-4.5M5 20h14"/></symbol>
  <symbol id="i-pay-card" viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h3"/></symbol>
  <symbol id="i-pay-parts" viewBox="0 0 24 24"><path d="M21 12c.55 0 1-.45.95-1a10 10 0 0 0-8.95-8.95c-.55-.05-1 .4-1 .95v8a1 1 0 0 0 1 1z"/><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/></symbol>
  <symbol id="i-pay-invoice" viewBox="0 0 24 24"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M14 2v4a2 2 0 0 0 2 2h4M10 9H8M16 13H8M16 17H8"/></symbol>
  <symbol id="i-pay-cash" viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></symbol>
  <symbol id="i-del-crew" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94z"/></symbol>
  <symbol id="i-del-box" viewBox="0 0 24 24"><path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12M3.3 7l8.7 5 8.7-5M7.5 4.27l9 5.15"/></symbol>
  <symbol id="i-del-truck" viewBox="0 0 24 24"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2M15 18H9M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></symbol>
  <symbol id="i-del-pin" viewBox="0 0 24 24"><path d="M20 10c0 5-5.54 10.19-7.4 11.8a1 1 0 0 1-1.2 0C9.54 20.19 4 15 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></symbol>
  <symbol id="i-filter" viewBox="0 0 24 24"><path d="M4 7h10M18 7h2M4 17h2M10 17h10M14 4.5v5M6 14.5v5"/></symbol>
`;
sprite = sprite.replace('</svg>', extra + '</svg>');

// Посилання-якорі головної на інших сторінках ведуть на index.html#…
const fixLinks = (html) => html
  .replace(/href="#(catalog)"/g, 'href="catalog.html"')
  .replace(/href="#(scenarios|process|cases|finance|blog|quiz|lead|how|kits|trust)"/g, 'href="index.html#$1"')
  .replace(/href="\/"/g, 'href="index.html"');

let topbar = fixLinks(between('<div class="topbar" id="topbar">', '</header>\n  </div>\n</div>'));
if (active) topbar = topbar.replace(`<a href="${active}">`, `<a href="${active}" aria-current="page">`);
const pageName = path.basename(outFile, '.html');
const footer = fixLinks(between('<footer class="site-footer">', '</footer>'))
  .replace(/<a href="index-light.html" class="theme-link"/, `<a href="${pageName}-light.html" class="theme-link"`);
const tabbar = fixLinks(between('<nav class="tabbar"', '</nav>'));

const page = `${head}
<body>

${sprite}

<a href="#main" class="visually-hidden">Перейти до змісту</a>

${topbar}

${main.trim()}

${footer}

${tabbar}

<script type="module" src="js/ui.js"></script>
<script type="module" src="js/topbar.js"></script>
<script type="module" src="js/${js}"></script>
</body>
</html>
`;
fs.writeFileSync(outFile, page);
console.log('built', path.basename(outFile), (page.length / 1024).toFixed(1) + ' KB');
