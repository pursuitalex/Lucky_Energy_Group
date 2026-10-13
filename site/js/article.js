// Lucky Energy · стаття блогу. Стаття береться з ?id=…, вміст — із data/posts.json (демо).
// Текст статті описано блоками: p, h2, ul, table, tip, quote, product — щоб потім легко перекласти на CMS.

import { $, $$, esc, money, loadCatalog, productUrl, MONTHS } from './shared.js';

const [{ posts }, { products }] = await Promise.all([fetch('data/posts.json').then((r) => r.json()), loadCatalog()]);
const id = new URLSearchParams(location.search).get('id');
const post = posts.find((p) => p.id === id) || posts[0];
const icon = (i) => `<svg class="icon" aria-hidden="true"><use href="#${i}"/></svg>`;
const slug = (t, i) => `s-${i}`;

document.title = `${post.title} | Блог Lucky Energy`;
$('#art-crumb').textContent = post.category;
$('#art-meta').textContent = `${post.category} · ${post.date} · ${post.minutes} хв читання`;
$('#art-title').textContent = post.title;
$('#art-lead').textContent = post.lead;
const cover = $('#art-cover'); cover.src = post.cover; cover.alt = post.coverAlt || '';

// ---------- Блоки ----------
let hIndex = 0;
const headings = [];
const block = (b) => {
  const [type, ...a] = b;
  switch (type) {
    case 'p': return `<p>${esc(a[0])}</p>`;
    case 'h2': { const s = slug(a[0], ++hIndex); headings.push([s, a[0]]); return `<h2 id="${s}">${esc(a[0])}</h2>`; }
    case 'ul': return `<ul>${a[0].map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`;
    case 'table': { const [head, ...rows] = a[0]; return `<div class="art-table-wrap"><table class="art-table"><thead><tr>${head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`; }
    case 'tip': return `<div class="art-tip"><div><strong>${esc(a[0])}</strong><span>${esc(a[1])}</span></div><a href="${a[2]}" class="btn btn--primary btn--sm">${esc(a[3])} ${icon('i-arrow')}</a></div>`;
    case 'quote': return `<figure class="art-quote"><blockquote>«${esc(a[0])}»</blockquote><figcaption>${esc(a[1])}</figcaption></figure>`;
    case 'product': {
      const p = products.find((x) => x.id === a[0]); if (!p) return '';
      return `<a href="${productUrl(p)}" class="art-product"><img src="${p.image}" alt="" width="1192" height="1100" loading="lazy"><span class="art-product__body"><span class="kb-meta">${esc(p.brand)} · у каталозі</span><span class="art-product__title">${esc(p.title)}</span><span class="art-product__spec">${p.specs.slice(0, 2).map(([k, v]) => `${esc(k)}: ${esc(v)}`).join(' · ')}</span></span><span class="art-product__price"><strong>${money(p.price)} грн</strong><span>від ${money(p.price / MONTHS)} грн/міс</span></span></a>`;
    }
    default: return '';
  }
};
$('#art-body').innerHTML = post.body.map(block).join('');

// ---------- Зміст і підсвітка активного розділу ----------
if (post.toc && headings.length > 1) {
  $('#art-toc').hidden = false;
  $('#art-toc-list').innerHTML = headings.map(([s, t]) => `<li><a href="#${s}">${esc(t)}</a></li>`).join('');
  const links = $$('#art-toc-list a');
  const spy = new IntersectionObserver((entries) => entries.forEach((en) => { if (en.isIntersecting) links.forEach((l) => l.classList.toggle('is-active', l.getAttribute('href') === '#' + en.target.id)); }), { rootMargin: '-20% 0px -65% 0px' });
  $$('#art-body h2').forEach((h) => spy.observe(h));
}

// ---------- Автор, поділитися ----------
$('#art-author-name').textContent = post.author;
$('#art-author-role').textContent = post.authorRole;
const shareUrl = encodeURIComponent(location.href), shareText = encodeURIComponent(post.title);
const SHARE = { tg: `https://t.me/share/url?url=${shareUrl}&text=${shareText}`, viber: `viber://forward?text=${shareText}%20${shareUrl}`, fb: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}` };
$$('[data-share]').forEach((a) => { a.href = SHARE[a.dataset.share]; });
$('#art-copy').addEventListener('click', async (e) => { try { await navigator.clipboard.writeText(location.href); e.target.textContent = 'Скопійовано'; setTimeout(() => { e.target.textContent = 'Скопіювати посилання'; }, 1500); } catch {} });

// ---------- Схожі статті ----------
$('#art-related').innerHTML = (post.related || []).map((rid) => posts.find((p) => p.id === rid)).filter(Boolean).map((p) => `<a href="article.html?id=${p.id}" class="kb-post" data-reveal>
  <span class="kb-post__cover"><img src="${p.cover}" alt="" width="1600" height="1000" loading="lazy"><span class="arrow-btn">${icon('i-arrow')}</span></span>
  <span class="kb-meta">${esc(p.category)} · ${esc(p.date)} · ${p.minutes} хв</span>
  <strong class="t-h4">${esc(p.title)}</strong>
  <span class="kb-post__lead">${esc(p.lead)}</span>
</a>`).join('');

$$('[data-reveal]:not(.is-in)').forEach((el) => requestAnimationFrame(() => el.classList.add('is-in')));
