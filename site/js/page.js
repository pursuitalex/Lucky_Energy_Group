// Lucky Energy · текстова сторінка (page.html?id=…): доставка, гарантія, повернення, сервіс, оферта, політика, про компанію.
// Вміст — data/pages.json, блоки ті самі, що в статті блогу (p, h2, ul, table, tip), оформлення — article.css.

import { $, $$, esc } from './shared.js';

const { pages } = await fetch('data/pages.json').then((r) => r.json());
const id = new URLSearchParams(location.search).get('id');
const page = pages.find((p) => p.id === id) || pages[0];
const icon = (i) => `<svg class="icon" aria-hidden="true"><use href="#${i}"/></svg>`;

document.title = `${page.title} | Lucky Energy`;
$('#page-crumb').textContent = page.title;
$('#page-meta').textContent = page.updated;
$('#page-title').textContent = page.title;
$('#page-lead').textContent = page.lead;

// ---------- Блоки ----------
let hIndex = 0;
const headings = [];
const block = (b) => {
  const [type, ...a] = b;
  switch (type) {
    case 'p': return `<p>${esc(a[0])}</p>`;
    case 'h2': { const s = `s-${++hIndex}`; headings.push([s, a[0]]); return `<h2 id="${s}">${esc(a[0])}</h2>`; }
    case 'ul': return `<ul>${a[0].map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`;
    case 'table': { const [head, ...rows] = a[0]; return `<div class="art-table-wrap"><table class="art-table"><thead><tr>${head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`; }
    case 'tip': return `<div class="art-tip"><div><strong>${esc(a[0])}</strong><span>${esc(a[1])}</span></div><a href="${a[2]}" class="btn btn--primary btn--sm">${esc(a[3])} ${icon('i-arrow')}</a></div>`;
    default: return '';
  }
};
$('#page-body').innerHTML = page.body.map(block).join('');

// ---------- Зміст і підсвітка активного розділу ----------
if (headings.length > 1) {
  $('#page-toc').hidden = false;
  $('#page-toc-list').innerHTML = headings.map(([s, t]) => `<li><a href="#${s}">${esc(t)}</a></li>`).join('');
  const links = $$('#page-toc-list a');
  const spy = new IntersectionObserver((entries) => entries.forEach((en) => { if (en.isIntersecting) links.forEach((l) => l.classList.toggle('is-active', l.getAttribute('href') === '#' + en.target.id)); }), { rootMargin: '-20% 0px -65% 0px' });
  $$('#page-body h2').forEach((h) => spy.observe(h));
}

// ---------- Інші довідкові сторінки ----------
$('#page-more').innerHTML = pages.map((p) => `<li><a href="page.html?id=${p.id}"${p.id === page.id ? ' class="is-active" aria-current="page"' : ''}>${esc(p.nav)}</a></li>`).join('');

$$('[data-reveal]:not(.is-in)').forEach((el) => requestAnimationFrame(() => el.classList.add('is-in')));
