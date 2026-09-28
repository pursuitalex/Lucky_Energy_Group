// Lucky Energy · каталог: фільтри, сортування, ціни з монтажем, порівняння.
// Дані — з data/products.json; пізніше джерело замінюється на API без зміни розмітки.

import { $, $$, money, esc, plural, renderCard, loadCatalog, cartAdd, cartRender, compareSet, favoritesSet, COMPARE_MAX } from './shared.js';

const PAGE_SIZE = 9;
const POWER_RANGES = [['до 5 кВт', 0, 5], ['5–8 кВт', 5, 8], ['8–12 кВт', 8, 12], ['понад 12 кВт', 12, Infinity]];
const CAPACITY_RANGES = [['до 6 кВт·год', 0, 6], ['6–12 кВт·год', 6, 12], ['понад 12 кВт·год', 12, Infinity]];

const state = {
  category: new URLSearchParams(location.search).get('cat') || 'all',
  brands: new Set(), types: new Set(), power: new Set(), capacity: new Set(), phases: new Set(),
  inStock: false, priceMin: null, priceMax: null,
  sort: 'popular', withInstall: false, shown: PAGE_SIZE,
  compare: compareSet(), favorites: favoritesSet(),
};

let data = { categories: [], products: [] };

const inRange = (value, ranges, selected) => selected.size === 0 || (value != null && [...selected].some((i) => value > ranges[i][1] - (ranges[i][1] === 0 ? 1 : 0) && value <= ranges[i][2]) );
const finalPrice = (p) => p.price + (state.withInstall && p.install ? p.install : 0);

// Товари, що проходять усі фільтри, крім зазначеної групи — для лічильників у фільтрах
const matches = (p, skip) =>
  (state.category === 'all' || p.category === state.category) &&
  (skip === 'brands' || state.brands.size === 0 || state.brands.has(p.brand)) &&
  (skip === 'types' || state.types.size === 0 || state.types.has(p.type)) &&
  (skip === 'power' || inRange(p.power, POWER_RANGES, state.power)) &&
  (skip === 'capacity' || inRange(p.capacity, CAPACITY_RANGES, state.capacity)) &&
  (skip === 'phases' || state.phases.size === 0 || state.phases.has(String(p.phases))) &&
  (!state.inStock || p.stock === 'in') &&
  (state.priceMin == null || finalPrice(p) >= state.priceMin) &&
  (state.priceMax == null || finalPrice(p) <= state.priceMax);

const SORTS = {
  popular: (a, b) => b.reviews - a.reviews,
  cheap: (a, b) => finalPrice(a) - finalPrice(b),
  expensive: (a, b) => finalPrice(b) - finalPrice(a),
  rating: (a, b) => b.rating - a.rating || b.reviews - a.reviews,
  power: (a, b) => (b.power || 0) - (a.power || 0),
};

// ---------- Рендер ----------
function renderCategories() {
  const all = { id: 'all', name: 'Усе обладнання', icon: 'i-catalog' };
  $('#cat-nav').innerHTML = [all, ...data.categories].map((c) => {
    const count = c.id === 'all' ? data.products.length : data.products.filter((p) => p.category === c.id).length;
    return `<button type="button" class="cat-nav__item" data-cat="${c.id}" aria-pressed="${state.category === c.id}">
      <svg class="icon" aria-hidden="true"><use href="#${c.icon}"/></svg>
      <span class="cat-nav__name">${esc(c.name)}</span><span class="cat-nav__count">${count} ${plural(count, 'товар', 'товари', 'товарів')}</span></button>`;
  }).join('');
}

function checkList(group, items) {
  return items.map(([value, label, count]) => `<label class="check"><input type="checkbox" data-group="${group}" value="${esc(value)}"${state[group].has(String(value)) || state[group].has(value) ? ' checked' : ''}${count === 0 ? ' disabled' : ''}><span>${esc(label)}</span><span>${count}</span></label>`).join('');
}

function renderFilters() {
  const scoped = data.products.filter((p) => state.category === 'all' || p.category === state.category);
  const uniq = (key) => [...new Set(scoped.map((p) => p[key]).filter((v) => v != null))];

  $('#f-brands').innerHTML = checkList('brands', uniq('brand').sort().map((b) => [b, b, data.products.filter((p) => matches(p, 'brands') && p.brand === b).length]));
  $('#f-types').innerHTML = checkList('types', uniq('type').map((t) => [t, t, data.products.filter((p) => matches(p, 'types') && p.type === t).length]));
  $('#f-power').innerHTML = checkList('power', POWER_RANGES.map((r, i) => [i, r[0], data.products.filter((p) => matches(p, 'power') && p.power != null && p.power > r[1] - (r[1] === 0 ? 1 : 0) && p.power <= r[2]).length]));
  $('#f-capacity').innerHTML = checkList('capacity', CAPACITY_RANGES.map((r, i) => [i, r[0], data.products.filter((p) => matches(p, 'capacity') && p.capacity != null && p.capacity > r[1] - (r[1] === 0 ? 1 : 0) && p.capacity <= r[2]).length]));
  $('#f-phases').innerHTML = checkList('phases', [['1', '1 фаза'], ['3', '3 фази']].map(([v, l]) => [v, l, data.products.filter((p) => matches(p, 'phases') && String(p.phases) === v).length]));

  // Групи без сенсу для вибраної категорії ховаємо
  $('[data-filter="power"]').hidden = !scoped.some((p) => p.power != null && p.power >= 1);
  $('[data-filter="capacity"]').hidden = !scoped.some((p) => p.capacity != null);
  $('[data-filter="phases"]').hidden = !scoped.some((p) => p.phases != null);
}

const HELP = `<aside class="grid-help" data-reveal><div><h3 class="t-h3">Не впевнені, що підійде саме вам?</h3><p>Інженер перевірить сумісність інвертора, акумуляторів і панелей та порахує систему під ваші прилади. Відповідь протягом 2 годин.</p></div><a href="index.html#lead" class="btn btn--dark btn--lg">Отримати підбір <svg class="icon"><use href="#i-arrow"/></svg></a></aside>`;

function renderGrid() {
  const list = data.products.filter((p) => matches(p)).sort(SORTS[state.sort]);
  const visible = list.slice(0, state.shown);
  const grid = $('#grid');
  if (!list.length) {
    grid.innerHTML = `<div class="empty"><h3 class="t-h3">Нічого не знайшли</h3><p>За такими фільтрами товарів немає. Приберіть частину умов — або напишіть нам, підберемо під замовлення.</p><button type="button" class="btn btn--secondary" data-reset>Скинути фільтри</button></div>`;
  } else {
    const cards = visible.map((p) => renderCard(p, { withInstall: state.withInstall, favorites: state.favorites, compare: state.compare }));
    if (cards.length > 5) cards.splice(6, 0, HELP);
    grid.innerHTML = cards.join('');
  }
  const catName = state.category === 'all' ? 'в усіх категоріях' : `у категорії «${data.categories.find((c) => c.id === state.category)?.name}»`;
  $('#count').innerHTML = `${list.length} ${plural(list.length, 'товар', 'товари', 'товарів')} <span>${catName}</span>`;
  $('#apply-count').textContent = `Показати ${list.length} ${plural(list.length, 'товар', 'товари', 'товарів')}`;
  const more = $('#load-more');
  more.hidden = list.length <= state.shown;
  $('#load-more-text').textContent = `Показано ${visible.length} з ${list.length}`;
  $('#load-more-bar').style.width = `${(visible.length / Math.max(1, list.length)) * 100}%`;
  revealNew();
}

function renderActive() {
  const chips = [];
  const add = (label, group, value) => chips.push(`<button type="button" class="chip" data-remove="${group}" data-value="${esc(value)}">${esc(label)}<svg class="icon"><use href="#i-close"/></svg></button>`);
  state.brands.forEach((b) => add(b, 'brands', b));
  state.types.forEach((t) => add(t, 'types', t));
  state.power.forEach((i) => add(POWER_RANGES[i][0], 'power', i));
  state.capacity.forEach((i) => add(CAPACITY_RANGES[i][0], 'capacity', i));
  state.phases.forEach((v) => add(v === '1' ? '1 фаза' : '3 фази', 'phases', v));
  if (state.inStock) add('В наявності', 'inStock', '');
  if (state.priceMin != null || state.priceMax != null) add(`${state.priceMin != null ? money(state.priceMin) : '0'} – ${state.priceMax != null ? money(state.priceMax) : '∞'} грн`, 'price', '');
  $('#active').innerHTML = chips.join('');
  $$('[data-reset]').forEach((b) => (b.disabled = chips.length === 0 && b.classList.contains('filters__reset')));
}

function renderHeading() {
  const cat = data.categories.find((c) => c.id === state.category);
  $('#h1').textContent = cat ? cat.name : 'Каталог обладнання';
  $('#crumbs').innerHTML = '<li><a href="index.html">Головна</a></li>' + (cat
    ? '<li><a href="catalog.html" data-cat="all">Каталог</a></li><li aria-current="page">' + esc(cat.name) + '</li>'
    : '<li aria-current="page">Каталог</li>');
}

function renderCompare(full = false) {
  const n = state.compare.size;
  $('#compare-bar').classList.toggle('is-visible', n > 0);
  $('#compare-text').textContent = full ? `Максимум ${COMPARE_MAX} товари — приберіть один` : `До порівняння: ${n} ${plural(n, 'товар', 'товари', 'товарів')}`;
  $('#compare-link').hidden = n < 2;
}

function revealNew() {
  // Картки з'являються каскадом; якщо ui.js уже відпрацював — показуємо самі
  $$('#grid [data-reveal]:not(.is-in)').forEach((el, i) => {
    el.style.setProperty('--reveal-i', Math.min(i, 8));
    requestAnimationFrame(() => el.classList.add('is-in'));
  });
}

function update({ filters = true } = {}) {
  if (filters) renderFilters();
  renderActive();
  renderGrid();
}

function resetFilters() {
  ['brands', 'types', 'power', 'capacity', 'phases'].forEach((g) => state[g].clear());
  Object.assign(state, { inStock: false, priceMin: null, priceMax: null, shown: PAGE_SIZE });
  $('#f-stock').checked = false; $('#f-price-min').value = ''; $('#f-price-max').value = '';
}

// ---------- Події ----------
function bind() {
  $('#cat-nav').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-cat]'); if (!btn) return;
    state.category = btn.dataset.cat; resetFilters();
    const url = new URL(location.href); state.category === 'all' ? url.searchParams.delete('cat') : url.searchParams.set('cat', state.category);
    history.replaceState(null, '', url);
    renderCategories(); update();
    renderHeading();
  });

  $('#filters').addEventListener('change', (e) => {
    const el = e.target;
    if (el.dataset.group) { const set = state[el.dataset.group]; const v = ['power', 'capacity'].includes(el.dataset.group) ? Number(el.value) : el.value; el.checked ? set.add(v) : set.delete(v); }
    else if (el.id === 'f-stock') state.inStock = el.checked;
    else if (el.id === 'f-price-min') state.priceMin = el.value ? Number(el.value) : null;
    else if (el.id === 'f-price-max') state.priceMax = el.value ? Number(el.value) : null;
    state.shown = PAGE_SIZE; update();
  });

  document.addEventListener('click', (e) => {
    const t = e.target;
    if (t.closest('[data-reset]')) { resetFilters(); update(); return; }
    const rm = t.closest('[data-remove]');
    if (rm) {
      const g = rm.dataset.remove;
      if (g === 'inStock') { state.inStock = false; $('#f-stock').checked = false; }
      else if (g === 'price') { state.priceMin = state.priceMax = null; $('#f-price-min').value = ''; $('#f-price-max').value = ''; }
      else state[g].delete(['power', 'capacity'].includes(g) ? Number(rm.dataset.value) : rm.dataset.value);
      update(); return;
    }
    const fav = t.closest('[data-fav]');
    if (fav) { state.favorites.toggle(fav.dataset.fav); fav.setAttribute('aria-pressed', state.favorites.has(fav.dataset.fav)); return; }
    const cmp = t.closest('[data-compare]');
    if (cmp) {
      if (!state.compare.has(cmp.dataset.compare) && state.compare.size >= COMPARE_MAX) { renderCompare(true); return; }
      state.compare.toggle(cmp.dataset.compare); cmp.setAttribute('aria-pressed', state.compare.has(cmp.dataset.compare)); renderCompare(); return;
    }
    if (t.closest('#compare-clear')) { state.compare.clear(); renderCompare(); $$('[data-compare]').forEach((b) => b.setAttribute('aria-pressed', 'false')); return; }
    const buy = t.closest('[data-buy]');
    if (buy) { cartAdd(buy.dataset.buy, 1, state.withInstall ? 'install' : null); flashBuy(buy); return; }
    if (t.closest('#more')) { state.shown += PAGE_SIZE; renderGrid(); return; }
    if (t.closest('#open-filters')) return drawer(true);
    if (t.closest('#close-filters, #apply-filters, #filters-backdrop')) return drawer(false);
  });

  $('#sort').addEventListener('change', (e) => { state.sort = e.target.value; renderGrid(); });
  $('#with-install').addEventListener('change', (e) => { state.withInstall = e.target.checked; update({ filters: false }); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') drawer(false); });
}

const toggle = (set, v) => (set.has(v) ? set.delete(v) : set.add(v));
function drawer(open) {
  $('#filters').classList.toggle('is-open', open);
  $('#filters-backdrop').classList.toggle('is-open', open);
  document.body.style.overflow = open ? 'hidden' : '';
  if (open) $('#close-filters').focus();
}

// ---------- Старт ----------
data = await loadCatalog();
cartRender();

// Короткий відгук кнопки «у кошик»
function flashBuy(btn) { btn.classList.add('is-added'); setTimeout(() => btn.classList.remove('is-added'), 1200); }
if (state.category !== 'all' && !data.categories.some((c) => c.id === state.category)) state.category = 'all';
renderHeading();
renderCategories();
bind();
update();
renderCompare();
