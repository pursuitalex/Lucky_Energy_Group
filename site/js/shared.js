// Lucky Energy · спільне для каталогу й сторінки товару: форматування, дані, картка товару

export const MONTHS = 24;            // «Оплата частинами» — орієнтовний платіж на місяць
export const SERVICE_PRICE = 4800;   // сервісний пакет Lucky Care, 1 рік (демо-значення)

export const BADGES = {
  hit: ['badge--solid', 'Хіт'],
  sale: ['badge--danger', 'Знижка'],
  new: ['badge--info', 'Новинка'],
  apartment: ['badge--accent', 'Для квартири'],
  business: ['badge--info', 'Для бізнесу'],
  credit: ['badge--solid', 'Кредит 0%'],
  install: ['', 'Монтаж у ціні'],
};

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const money = (n) => Math.round(n).toLocaleString('uk-UA').replace(/ /g, ' ');
export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const productUrl = (p) => `product.html?id=${encodeURIComponent(p.id)}`;

export function plural(n, one, few, many) {
  const m10 = n % 10, m100 = n % 100;
  return m10 === 1 && m100 !== 11 ? one : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? few : many;
}

let cache;
export async function loadCatalog() {
  if (!cache) cache = fetch('data/products.json').then((r) => r.json());
  return cache;
}

// Картка товару. opts: withInstall — показувати ціну з монтажем; favorites / compare — множини id
export function renderCard(p, { withInstall = false, favorites = new Set(), compare = new Set() } = {}) {
  const badges = p.badges.map((b) => `<span class="badge ${BADGES[b][0]}">${BADGES[b][1]}</span>`).join('');
  const extra = withInstall && p.install ? p.install : 0;
  const price = p.price + extra;
  const installNote = p.install === 0 ? '<b>монтаж у ціні</b>'
    : p.install ? (withInstall ? `з монтажем · обладнання ${money(p.price)} грн` : `монтаж <b>+${money(p.install)} грн</b>`)
    : 'монтаж не потрібен';
  return `<article class="card card--interactive product-card" data-reveal>
    <div class="product-card__media">
      <div class="product-card__badges">${badges}</div>
      <div class="product-card__tools">
        <button type="button" class="product-card__fav" data-fav="${p.id}" aria-pressed="${favorites.has(p.id)}" aria-label="В обране"><svg class="icon"><use href="#i-heart"/></svg></button>
        <button type="button" class="product-card__fav" data-compare="${p.id}" aria-pressed="${compare.has(p.id)}" aria-label="Порівняти"><svg class="icon"><use href="#i-compare"/></svg></button>
      </div>
      <a href="${productUrl(p)}" tabindex="-1" aria-hidden="true"><img src="${p.image}" alt="" width="1192" height="1100" loading="lazy" decoding="async"></a>
    </div>
    <div class="product-card__body">
      <div class="product-card__meta"><span class="product-card__brand">${esc(p.brand)} · ${esc(p.id)}</span>
        <span class="badge ${p.stock === 'in' ? 'badge--accent' : 'badge--warning'}"><span class="badge__dot"></span>${p.stock === 'in' ? 'В наявності' : 'Під замовлення'}</span></div>
      <h3 class="product-card__title"><a href="${productUrl(p)}">${esc(p.title)}</a></h3>
      <div class="rating"><span class="rating__stars">★</span>${String(p.rating).replace('.', ',')} · ${p.reviews} ${plural(p.reviews, 'відгук', 'відгуки', 'відгуків')}</div>
      <dl class="specs">${p.specs.map(([k, v]) => `<div class="specs__row"><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
      <div class="product-card__footer">
        <div class="price">${p.oldPrice ? `<span class="price__old">${money(p.oldPrice + extra)} грн</span>` : ''}
          <span class="price__now">${money(price)} <small>грн</small></span>
          <span class="price__monthly">від ${money(price / MONTHS)} грн/міс</span>
          <span class="product-card__install">${installNote}</span></div>
        <button type="button" class="btn btn--primary btn--icon" data-buy="${p.id}" aria-label="Додати в кошик: ${esc(p.title)}"><svg class="icon"><use href="#i-cart"/></svg></button>
      </div>
    </div>
  </article>`;
}

// ---------- Варіанти покупки (спільні для картки товару, кошика й оформлення) ----------
// null — монтаж не потрібен (панелі поштучно, зарядні станції); install === 0 — монтаж уже в ціні комплекту
export function purchaseOptions(p) {
  if (p.install == null) return null;
  const base = p.install === 0
    ? [{ id: 'install', title: 'З монтажем', short: 'Монтаж у ціні', note: 'уже в ціні комплекту', add: 0 }]
    : [{ id: 'equipment', title: 'Лише обладнання', short: 'Лише обладнання', note: 'доставка Новою Поштою', add: 0 },
       { id: 'install', title: 'З монтажем', short: 'З монтажем', note: 'бригада, матеріали, запуск', add: p.install }];
  return [...base, { id: 'care', title: 'Монтаж + сервіс', short: 'Монтаж + сервіс', note: 'Lucky Care на 1 рік: моніторинг, ТО, виїзд за 24 год', add: (p.install || 0) + SERVICE_PRICE }];
}
export function resolveOption(p, optionId) {
  const opts = purchaseOptions(p);
  if (!opts) return null;
  return opts.find((o) => o.id === optionId) || opts[0];
}

// ---------- Порівняння й обране (демо: зберігаються в браузері) ----------
// Одна функція на обидва списки: повертає об'єкт-множину, який сам зберігається після toggle/delete/clear
export function storedSet(key) {
  let set = new Set();
  try { set = new Set(JSON.parse(localStorage.getItem(key) || '[]')); } catch {}
  const save = () => { try { localStorage.setItem(key, JSON.stringify([...set])); } catch {} window.dispatchEvent(new Event(key)); };
  return {
    has: (id) => set.has(id), get size() { return set.size; }, values: () => [...set],
    toggle(id) { if (set.has(id)) set.delete(id); else set.add(id); save(); return set.has(id); },
    delete(id) { set.delete(id); save(); },
    clear() { set.clear(); save(); },
  };
}
export const COMPARE_MAX = 4;
export const compareSet = () => storedSet('le-compare');
export const favoritesSet = () => storedSet('le-favorites');

// ---------- Кошик (демо: зберігається в браузері) ----------
// Позиція: { id, option, qty }. Один товар з різними варіантами покупки — різні позиції.
const CART_KEY = 'le-cart-items';
export function cartItems() {
  try { const v = JSON.parse(localStorage.getItem(CART_KEY) || '[]'); return Array.isArray(v) ? v.filter((x) => x && x.id && x.qty > 0) : []; } catch { return []; }
}
export function cartSave(items) {
  try { localStorage.setItem(CART_KEY, JSON.stringify(items)); localStorage.removeItem('le-cart'); } catch {}
  window.dispatchEvent(new Event('le-cart')); // лічильник у шапці оновлює topbar.js
}
export function cartAdd(id, qty = 1, option = null) {
  const items = cartItems();
  const same = items.find((x) => x.id === id && (x.option || null) === (option || null));
  if (same) same.qty += qty; else items.push({ id, option, qty });
  cartSave(items);
}
export const cartCount = () => cartItems().reduce((n, x) => n + x.qty, 0);
export function cartRender() { window.dispatchEvent(new Event('le-cart')); }

// Рядки кошика з цінами: товар, вибраний варіант, суми
export function cartLines(products, items = cartItems()) {
  return items.map((item) => {
    const p = products.find((x) => x.id === item.id);
    if (!p) return null;
    const opt = resolveOption(p, item.option);
    const add = opt ? opt.add : 0;
    return { item, p, opt, unit: p.price + add, equipment: p.price * item.qty, extra: add * item.qty, saving: p.oldPrice ? (p.oldPrice - p.price) * item.qty : 0, total: (p.price + add) * item.qty };
  }).filter(Boolean);
}
export function cartTotals(lines) {
  const sum = (k) => lines.reduce((n, l) => n + l[k], 0);
  return { qty: lines.reduce((n, l) => n + l.item.qty, 0), equipment: sum('equipment'), extra: sum('extra'), saving: sum('saving'), total: sum('total'), hasInstall: lines.some((l) => l.opt && l.opt.id !== 'equipment') };
}
