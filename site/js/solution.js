// Lucky Energy · сценарна сторінка: один шаблон, три сценарії. Тип береться з ?type=apartment|house|business,
// вміст — із data/solutions.json (у бойовій версії це будуть окремі сторінки з CMS, тут — демо на клієнті).

import { $, $$, money, esc, MONTHS } from './shared.js';

const data = await fetch('data/solutions.json').then((r) => r.json());
const asked = new URLSearchParams(location.search).get('type');
const type = ['apartment', 'house', 'business'].includes(asked) ? asked : 'house';
const d = data[type];
const icon = (id) => `<svg class="icon" aria-hidden="true"><use href="#${id}"/></svg>`;

document.title = `${d.title}: пакети з монтажем і цінами | Lucky Energy`;
$('#sol-crumb').textContent = d.crumb;
$('#sol-title').textContent = d.title;
$('#sol-title-dim').textContent = d.titleDim;
$('#sol-lead').textContent = d.lead;
const img = $('#sol-image');
img.src = d.image;
img.alt = d.imageAlt;
$$('#sol-switch [data-type]').forEach((a) => { if (a.dataset.type === type) a.setAttribute('aria-current', 'page'); });

$('#sol-facts').innerHTML = d.facts.map(([v, l]) => `<div><dt>${esc(l)}</dt><dd>${esc(v)}</dd></div>`).join('');

$('#sol-packages').innerHTML = d.packages.map((p) => {
  const toProduct = p.href.startsWith('product.html');
  return `<article class="sol-pack${p.recommended ? ' sol-pack--rec' : ''}" data-reveal>
    ${p.recommended ? '<span class="badge badge--solid sol-pack__badge">Обирають найчастіше</span>' : ''}
    <div class="sol-pack__head"><h3 class="t-h3">${esc(p.name)}</h3><span class="sol-pack__for">${esc(p.for)}</span></div>
    <div class="sol-pack__price">${p.price
      ? `<span class="sol-pack__sum">${money(p.price)} <small>грн</small></span><span class="sol-pack__monthly">з монтажем · від ${money(p.price / MONTHS)} грн/міс</span>`
      : '<span class="sol-pack__sum">За розрахунком</span><span class="sol-pack__monthly">кошторис протягом 24 годин</span>'}</div>
    <ul class="sol-pack__specs">${p.specs.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
    <div class="sol-pack__auto"><span class="t-label c-tertiary">Автономність</span><strong>${esc(p.autonomy)}</strong></div>
    <ul class="sol-pack__powers">${p.powers.map(([name, ok]) => `<li class="${ok ? '' : 'is-off'}">${icon(ok ? 'i-tick' : 'i-minus')}<span>${esc(name)}${ok ? '' : ' — не в цьому пакеті'}</span></li>`).join('')}</ul>
    <a href="${p.href}" class="btn ${p.recommended ? 'btn--primary' : 'btn--secondary'} btn--lg btn--block">${toProduct ? 'Склад і характеристики' : 'Отримати розрахунок'} ${icon('i-arrow')}</a>
  </article>`;
}).join('');

$('#sol-how').innerHTML = d.how.map(([ic, title, text]) => `<li data-reveal>${icon(ic)}<strong>${esc(title)}</strong><span>${esc(text)}</span></li>`).join('');

$('#sol-install-title').textContent = d.install.title;
$('#sol-install-text').textContent = d.install.text;
$('#sol-install-price').textContent = d.install.price;
$('#sol-install-items').innerHTML = d.install.items.map((t) => `<li>${esc(t)}</li>`).join('');

$('#sol-cases').innerHTML = d.cases.map((c) => `<a href="${c.href || 'index.html#cases'}" class="sol-case" data-reveal style="text-decoration:none">
  <span class="sol-case__media"><img src="${c.image}" alt="" width="1600" height="900" loading="lazy"></span>
  <span class="t-body-sm c-secondary">${esc(c.place)}</span>
  <strong class="t-h3">${esc(c.title)}</strong>
  <dl class="sol-case__metrics">${c.metrics.map(([v, l]) => `<div><dd>${esc(v)}</dd><dt>${esc(l)}</dt></div>`).join('')}</dl>
</a>`).join('');

$('#sol-fin-figure').textContent = d.finance.figure;
$('#sol-fin-title').textContent = d.finance.title;
$('#sol-fin-text').textContent = d.finance.text;
$('#sol-fin-cta').textContent = d.finance.cta;

$('#sol-faq').innerHTML = d.faq.map(([q, a], i) => `<div class="accordion__item"><button class="accordion__trigger" aria-expanded="${i === 0}"><span class="accordion__title">${esc(q)}</span><span class="accordion__icon"></span></button><div class="accordion__panel"><div><p style="padding-left:0">${esc(a)}</p></div></div></div>`).join('');

// Блоки додано після завантаження сторінки — показуємо їх без очікування спостерігача
$$('[data-reveal]:not(.is-in)').forEach((el) => requestAnimationFrame(() => el.classList.add('is-in')));
