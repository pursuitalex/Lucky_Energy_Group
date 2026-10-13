// Lucky Energy · сторінка товару. Товар береться з ?id=…; базові поля — data/products.json,
// розширений вміст — data/product-details.json (якщо запису немає, збирається із шаблонів за категорією).

import { $, $$, money, esc, plural, renderCard, loadCatalog, cartAdd, cartRender, purchaseOptions, compareSet, favoritesSet, COMPARE_MAX, BADGES, MONTHS } from './shared.js';

const data = await loadCatalog();
const details = await fetch('data/product-details.json').then((r) => r.json()).catch(() => ({}));
const id = new URLSearchParams(location.search).get('id');
const p = data.products.find((x) => x.id === id) || (id ? null : data.products[0]);
if (!p) {
  // Невідомий артикул: замість порожньої картки — зрозумілий стан і шлях далі
  document.title = 'Товар не знайдено | Lucky Energy';
  $('#main').innerHTML = `<section class="section"><div class="container"><div class="empty"><h1 class="t-h2">Такого товару немає</h1><p class="c-secondary">Можливо, модель знята з продажу або посилання застаріло. Артикул: ${esc(id)}</p><div class="cluster" style="justify-content:center"><a href="catalog.html" class="btn btn--primary btn--lg">Перейти в каталог</a><a href="index.html#lead" class="btn btn--secondary btn--lg">Запитати інженера</a></div></div></div></section>`;
  $('#buy-bar').remove();
  cartRender();
} else {
const d = buildDetails(p, details[p.id]);
const category = data.categories.find((c) => c.id === p.category);

const state = { option: 'equipment', qty: 1, photo: 0 };

// ---------- Шаблони для товарів без розширеного опису ----------
function buildDetails(p, own) {
  if (own) return own;
  const others = (filter) => data.products.filter((x) => x.id !== p.id && filter(x)).slice(0, 4).map((x) => x.id);
  const texts = {
    inverters: 'Інвертор керує потоками енергії між мережею, акумулятором, панелями та будинком. Перед оплатою інженер перевірить сумісність з вашим акумулятором і навантаженням.',
    batteries: 'Літій-залізо-фосфатний акумулятор для систем резервного живлення та сонячних станцій: понад 6000 циклів, вбудована BMS, безпечна хімія для житлових приміщень.',
    panels: 'Монокристалічна панель для дахових і наземних станцій. Підберемо кількість панелей і схему стрінгів під MPPT-діапазон вашого інвертора.',
    kits: 'Готове рішення: обладнання підібране й перевірене на сумісність, монтаж і налаштування вже в ціні. Склад комплекту можна змінити під ваш об\'єкт.',
    stations: 'Портативна зарядна станція: не потребує монтажу, працює одразу з коробки. Підійде для квартири, дачі та виїзної роботи.',
    generators: 'Генератор для тривалих відключень. Можемо інтегрувати його з інвертором через АВР — тоді він запускатиметься автоматично і дозаряджатиме акумулятор.',
  };
  return {
    gallery: [{ src: p.image, alt: p.title }],
    lead: texts[p.category],
    description: [texts[p.category], 'Детальний опис, повні характеристики й документи з\'являться після підключення каталогу постачальника.'],
    powers: null,
    specGroups: [{ title: 'Основні параметри', rows: [['Бренд', p.brand], ['Тип', p.type], ...p.specs, ['Артикул', p.id]] }],
    compatible: p.category === 'inverters' ? others((x) => x.category === 'batteries') : p.category === 'batteries' ? others((x) => x.category === 'inverters') : others((x) => x.category === 'kits'),
    related: others((x) => x.category === p.category).length ? others((x) => x.category === p.category) : others((x) => x.badges?.includes('hit')),
    docs: [['Технічний паспорт (datasheet)', 'PDF'], ['Гарантійні умови', 'PDF']],
    reviews: [],
    faq: [p.install == null ? ['Чи потрібен монтаж?', 'Ні, цей товар працює одразу з коробки. Якщо хочете вбудувати його в систему резервного живлення — інженер підкаже схему.'] : ['Чи можна купити без монтажу?', 'Так. Вартість монтажу вказана окремо, її можна додати або прибрати у варіантах покупки.'], ['Яка гарантія?', 'Офіційна гарантія виробника, гарантійні звернення приймаємо самі.']],
  };
}

// ---------- Варіанти покупки ----------
const opts = purchaseOptions(p);
const optionAdd = () => (opts ? opts.find((o) => o.id === state.option).add : 0);
const unitPrice = () => p.price + optionAdd();

// ---------- Рендер ----------
document.title = `${p.title} — ${p.install == null ? "купити з доставкою" : "купити з монтажем"} | Lucky Energy`;
$('#crumbs').innerHTML = `<li><a href="index.html">Головна</a></li><li><a href="catalog.html">Каталог</a></li><li><a href="catalog.html?cat=${category.id}">${esc(category.name)}</a></li><li aria-current="page">${esc(p.brand)} ${esc(p.id)}</li>`;
$('#p-sku').textContent = `${p.brand} · арт. ${p.id}`;
$('#p-stock').outerHTML = `<span class="badge ${p.stock === 'in' ? 'badge--accent' : 'badge--warning'}"><span class="badge__dot"></span>${p.stock === 'in' ? 'В наявності · відправимо сьогодні' : 'Під замовлення · 3–7 днів'}</span>`;
$('#p-title').textContent = p.title;
$('#p-rating').innerHTML = `<span class="rating__stars">★</span>${String(p.rating).replace('.', ',')} · ${p.reviews} ${plural(p.reviews, 'відгук', 'відгуки', 'відгуків')}`;
$('#p-lead').textContent = d.lead;
$('#p-chips').innerHTML = [p.type, ...p.specs.slice(0, 2).map(([k, v]) => `${k}: ${v}`)].map((t) => `<span class="badge">${esc(t)}</span>`).join('');
$('#p-badges').innerHTML = p.badges.map((b) => `<span class="badge ${BADGES[b][0]}">${BADGES[b][1]}</span>`).join('');

if (opts) {
  state.option = opts[0].id;
  $('#p-options-grid').innerHTML = opts.map((o, i) => `<label class="option-tile"><input type="radio" name="buy-option" value="${o.id}"${i === 0 ? ' checked' : ''}>${o.title}<small>${o.note}</small><b>${o.add ? '+' + money(o.add) + ' грн' : o.id === 'equipment' ? money(p.price) + ' грн' : 'без доплати'}</b></label>`).join('');
  if (opts.length === 2) $('#p-options-grid').style.gridTemplateColumns = 'repeat(2, minmax(0, 1fr))';
} else $('#p-options').hidden = true;

function renderPrice() {
  const total = unitPrice() * state.qty;
  $('#p-price').innerHTML = `${money(total)} <small>грн</small>`;
  $('#p-monthly').textContent = `або від ${money(total / MONTHS)} грн/міс · оплата частинами до ${MONTHS} платежів`;
  const old = $('#p-old');
  old.hidden = !p.oldPrice;
  if (p.oldPrice) old.textContent = `${money((p.oldPrice + optionAdd()) * state.qty)} грн`;
  $('#bar-price').textContent = `${money(total)} грн`;
  $('#p-qty').value = state.qty;
}

// Галерея
const thumbs = $('#gallery-thumbs');
thumbs.innerHTML = d.gallery.map((g, i) => `<button type="button" class="gallery__thumb" role="tab" aria-selected="${i === 0}" aria-label="Фото ${i + 1}: ${esc(g.alt)}" data-photo="${i}"><img src="${g.src}" alt="" loading="lazy"></button>`).join('');
thumbs.hidden = d.gallery.length < 2;
$('.gallery__nav').hidden = d.gallery.length < 2;
const img = $('#gallery-img');
function showPhoto(i, animate = true) {
  state.photo = (i + d.gallery.length) % d.gallery.length;
  const g = d.gallery[state.photo];
  const apply = () => { img.src = g.src; img.alt = g.alt; img.classList.remove('is-swapping'); };
  if (animate) { img.classList.add('is-swapping'); setTimeout(apply, 160); } else apply();
  $$('.gallery__thumb').forEach((t, n) => t.setAttribute('aria-selected', String(n === state.photo)));
  $('#gallery-counter').textContent = `${state.photo + 1} / ${d.gallery.length}`;
}
showPhoto(0, false);

// Розділи
$('#p-description').innerHTML = d.description.map((t) => `<p>${esc(t)}</p>`).join('');
if (d.powers) {
  $('#p-powers').innerHTML = d.powers.map(([name, s]) => `<li class="${s === 'limit' ? 'is-limit' : ''}"><span class="powers__mark"><svg class="icon"><use href="#${s === 'limit' ? 'i-minus' : 'i-tick'}"/></svg></span><span class="powers__text">${esc(name)}${s === 'limit' ? '<span class="powers__note">потрібен розрахунок інженера</span>' : ''}</span></li>`).join('');
} else $('#p-powers-wrap').hidden = true;

$('#p-specs').innerHTML = d.specGroups.map((g) => `<div class="card spec-group" data-reveal><h3 class="t-h4">${esc(g.title)}</h3><dl class="specs">${g.rows.map(([k, v]) => `<div class="specs__row"><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl></div>`).join('');

const byIds = (ids) => ids.map((i) => data.products.find((x) => x.id === i)).filter(Boolean);
$('#p-compatible').innerHTML = byIds(d.compatible).map((x) => renderCard(x)).join('') || '<p class="c-secondary">Сумісні позиції підбере інженер — напишіть нам модель вашого обладнання.</p>';
$('#p-related').innerHTML = byIds(d.related).map((x) => renderCard(x)).join('');

$('#p-docs').innerHTML = d.docs.map(([name, size]) => `<span class="doc-row" title="Демо: файл додамо після наповнення каталогу"><span class="doc-row__type">PDF</span><span class="doc-row__name">${esc(name)}</span><span class="doc-row__size">${esc(size)}</span><svg class="icon"><use href="#i-download"/></svg></span>`).join('');

$('#p-score').textContent = String(p.rating).replace('.', ',');
$('#p-reviews-count').textContent = `${p.reviews} ${plural(p.reviews, 'відгук', 'відгуки', 'відгуків')} покупців`;
$('#p-reviews').innerHTML = d.reviews.length
  ? d.reviews.map((r) => `<figure class="card review" data-reveal><span class="rating__stars">${'★'.repeat(r.rating)}<span style="color:var(--color-border-strong)">${'★'.repeat(5 - r.rating)}</span></span><blockquote>«${esc(r.text)}»</blockquote><figcaption><strong>${esc(r.name)}, ${esc(r.city)}</strong><span class="t-body-sm c-secondary">${esc(r.system)} · ${esc(r.date)}</span></figcaption></figure>`).join('')
  : '<p class="c-secondary">Відгуків на цю модель ще немає — будьте першим.</p>';

$('#p-faq').innerHTML = d.faq.map(([q, a], i) => `<div class="accordion__item"><button class="accordion__trigger" aria-expanded="${i === 0}"><span class="accordion__title">${esc(q)}</span><span class="accordion__icon"></span></button><div class="accordion__panel"><div><p style="padding-left:0">${esc(a)}</p></div></div></div>`).join('');

$('#bar-img').src = p.image;
$('#bar-title').textContent = p.title;
renderPrice();
cartRender();
$$('[data-reveal]:not(.is-in)').forEach((el) => requestAnimationFrame(() => el.classList.add('is-in')));

// ---------- Події ----------
$('#p-options-grid').addEventListener('change', (e) => { state.option = e.target.value; renderPrice(); });
$('.buy .qty').addEventListener('click', (e) => { const step = e.target.closest('button')?.dataset.step; if (!step) return; e.stopImmediatePropagation(); state.qty = Math.max(1, state.qty + Number(step)); renderPrice(); }, true);
$('#gallery-prev').addEventListener('click', () => showPhoto(state.photo - 1));
$('#gallery-next').addEventListener('click', () => showPhoto(state.photo + 1));
thumbs.addEventListener('click', (e) => { const t = e.target.closest('[data-photo]'); if (t) showPhoto(Number(t.dataset.photo)); });
$('#gallery').addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') showPhoto(state.photo - 1); if (e.key === 'ArrowRight') showPhoto(state.photo + 1); });

const add = (btn) => {
  cartAdd(p.id, state.qty, opts ? state.option : null);
  const label = btn.querySelector('span') || btn.lastChild;
  const old = label.textContent;
  btn.classList.add('is-added'); label.textContent = 'Додано в кошик';
  setTimeout(() => { btn.classList.remove('is-added'); label.textContent = old; }, 1800);
};
$('#p-add').addEventListener('click', (e) => add(e.currentTarget));
$('#bar-add').addEventListener('click', (e) => add(e.currentTarget));
const favorites = favoritesSet(), compare = compareSet();
const syncToggles = () => {
  $('#p-fav').setAttribute('aria-pressed', String(favorites.has(p.id)));
  $('#p-compare').setAttribute('aria-pressed', String(compare.has(p.id)));
  $$('[data-fav]').forEach((b) => b.setAttribute('aria-pressed', String(favorites.has(b.dataset.fav))));
  $$('[data-compare]').forEach((b) => b.setAttribute('aria-pressed', String(compare.has(b.dataset.compare))));
  const bar = $('#compare-bar');
  if (bar) { bar.classList.toggle('is-visible', compare.size > 0); $('#compare-text').textContent = `До порівняння: ${compare.size} ${plural(compare.size, 'товар', 'товари', 'товарів')}`; $('#compare-link').hidden = compare.size < 2; }
};
const toggleCompare = (id) => {
  if (!compare.has(id) && compare.size >= COMPARE_MAX) { $('#compare-text').textContent = `Максимум ${COMPARE_MAX} товари — приберіть один`; return; }
  compare.toggle(id); syncToggles();
};
$('#p-fav').addEventListener('click', () => { favorites.toggle(p.id); syncToggles(); });
$('#p-compare').addEventListener('click', () => toggleCompare(p.id));
$('#compare-clear')?.addEventListener('click', () => { compare.clear(); syncToggles(); });
syncToggles();

// Картки в блоках «Сумісність» і «З цим купують»
document.addEventListener('click', (e) => {
  const buy = e.target.closest('[data-buy]'); if (buy) return cartAdd(buy.dataset.buy);
  const fv = e.target.closest('[data-fav]'); if (fv) { favorites.toggle(fv.dataset.fav); return syncToggles(); }
  const cp = e.target.closest('[data-compare]'); if (cp) return toggleCompare(cp.dataset.compare);
});


// Панель покупки з'являється, коли основний блок пішов з екрана
const bar = $('#buy-bar');
new IntersectionObserver(([entry]) => {
  const show = !entry.isIntersecting && entry.boundingClientRect.top < 0;
  bar.classList.toggle('is-visible', show);
  bar.setAttribute('aria-hidden', String(!show));
}, { threshold: 0 }).observe($('.buy__actions'));

// Підсвітка активного розділу в навігації картки
const navLinks = $$('.product-nav a');
const spy = new IntersectionObserver((entries) => entries.forEach((en) => {
  if (!en.isIntersecting) return;
  navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id));
}), { rootMargin: '-30% 0px -60% 0px' });
$$('.product-section').forEach((s) => spy.observe(s));

} // if (p)
