// Lucky Energy · сторінка кейсу. Кейс береться з ?id=…, вміст — із data/cases.json (демо; у бойовій версії — CMS).

import { $, $$, esc, money, loadCatalog, productUrl } from './shared.js';

const { products } = await loadCatalog();

const { cases } = await fetch('data/cases.json').then((r) => r.json());
const id = new URLSearchParams(location.search).get('id');
const c = cases.find((x) => x.id === id) || cases[0];
const icon = (i) => `<svg class="icon" aria-hidden="true"><use href="#${i}"/></svg>`;

document.title = `${c.title} — кейс | Lucky Energy`;
$('#case-crumb').textContent = c.typeName.split(' · ')[0];
$('#case-meta').textContent = `${c.typeName} · ${c.place} · ${c.date}`;
$('#case-title').textContent = c.title;
$('#case-lead').textContent = c.lead;
const cover = $('#case-cover'); cover.src = c.cover; cover.alt = c.coverAlt;
$('#case-metrics').innerHTML = c.metrics.map(([v, l]) => `<div><dt>${esc(l)}</dt><dd>${esc(v)}</dd></div>`).join('');

$('#case-task').textContent = c.task;
$('#case-solution').innerHTML = c.solution.map((t) => `<li>${esc(t)}</li>`).join('');
// Обладнання: основні компоненти беремо з каталогу (фото, характеристика, ціна), решта — заглушка
$('#case-equipment').innerHTML = c.equipment.map(([name, pid, qty]) => {
  const p = pid && products.find((x) => x.id === pid);
  const q = qty && qty > 1 ? `<span class="badge badge--solid case-eq__qty">× ${qty}</span>` : '';
  if (!p) return `<div class="case-eq case-eq--misc"><span class="case-eq__media">${icon('i-bolt')}</span><span class="case-eq__body"><span class="case-eq__role">Комплектуючі</span><span class="case-eq__title">${esc(name)}</span><span class="case-eq__spec">Підбираємо під об'єкт, у ціні монтажу</span><span class="case-eq__link">Без окремої картки</span></span></div>`;
  return `<a href="${productUrl(p)}" class="case-eq"><span class="case-eq__media"><img src="${p.image}" alt="" width="1192" height="1100" loading="lazy">${q}</span><span class="case-eq__body"><span class="case-eq__role">${esc(p.brand)} · ${esc(p.type)}</span><span class="case-eq__title">${esc(name)}</span><span class="case-eq__spec">${p.specs.slice(0, 2).map(([k, v]) => `${esc(k)}: ${esc(v)}`).join(' · ')}</span><span class="case-eq__link">${money(p.price)} грн · у каталозі ${icon('i-arrow')}</span></span></a>`;
}).join('');
$('#case-steps').innerHTML = c.steps.map(([t, d]) => `<li data-reveal><strong>${esc(t)}</strong><span>${esc(d)}</span></li>`).join('');
$('#case-gallery').innerHTML = c.gallery.map(([src, cap]) => `<figure data-reveal><img src="${src}" alt="${esc(cap)}" width="1600" height="1200" loading="lazy"><figcaption>${esc(cap)}</figcaption></figure>`).join('');
$('#case-review-text').textContent = c.review.text;
$('#case-review-name').textContent = c.review.name;
$('#case-review-role').textContent = c.review.role;

const typeTitle = { house: 'Хочете так само для свого будинку?', apartment: 'Хочете так само для своєї квартири?', business: 'Хочете так само для свого бізнесу?' };
$('#case-cta-title').textContent = typeTitle[c.type] || 'Хочете так само?';
$('.case-cta-quiz').href = `quiz.html?object=${c.type}`;

$('#case-next').innerHTML = c.next.map((nid) => cases.find((x) => x.id === nid)).filter(Boolean).map((n) => `<a href="case.html?id=${n.id}" class="sol-case" data-reveal style="text-decoration:none">
  <span class="sol-case__media"><img src="${n.cover}" alt="" width="1600" height="900" loading="lazy"></span>
  <span class="t-body-sm c-secondary">${esc(n.typeName)} · ${esc(n.place)}</span>
  <strong class="t-h3">${esc(n.title)}</strong>
  <dl class="sol-case__metrics">${n.metrics.slice(0, 3).map(([v, l]) => `<div><dd>${esc(v)}</dd><dt>${esc(l)}</dt></div>`).join('')}</dl>
</a>`).join('');

// Стрілки галереї: гортаємо на ширину одного кадру
const gal = $('#case-gallery');
const galStep = () => (gal.firstElementChild?.getBoundingClientRect().width || 0) + parseFloat(getComputedStyle(gal).columnGap || getComputedStyle(gal).gap || 0);
$('#gal-prev').addEventListener('click', () => gal.scrollBy({ left: -galStep(), behavior: 'smooth' }));
$('#gal-next').addEventListener('click', () => gal.scrollBy({ left: galStep(), behavior: 'smooth' }));
// затухання з боків і стан стрілок: на початку ховаємо ліве, в кінці — праве
const galWrap = $('#case-gallery-wrap');
const galEdges = () => {
  const atStart = gal.scrollLeft <= 2, atEnd = gal.scrollLeft + gal.clientWidth >= gal.scrollWidth - 2;
  galWrap.classList.toggle('is-start', atStart); galWrap.classList.toggle('is-end', atEnd);
  $('#gal-prev').disabled = atStart; $('#gal-next').disabled = atEnd;
};
gal.addEventListener('scroll', galEdges, { passive: true });
window.addEventListener('resize', galEdges);
requestAnimationFrame(galEdges);

$$('[data-reveal]:not(.is-in)').forEach((el) => requestAnimationFrame(() => el.classList.add('is-in')));
