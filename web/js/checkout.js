// Lucky Energy · оформлення замовлення: тип покупця, доставка, оплата, перевірка полів, створення замовлення (демо)

import { $, $$, money, esc, loadCatalog, cartLines, cartTotals, cartSave } from './shared.js';
import { renderSummary, PROMO } from './cart.js';
import { themeHref } from './theme.js';

const COD_LIMIT = 50000; // накладений платіж — до цієї суми
const data = await loadCatalog();
const lines = cartLines(data.products);
const form = $('#checkout-form');

if (!lines.length) {
  // Порожній кошик: оформлювати нічого
  $('#checkout').innerHTML = '<div class="empty" style="grid-column:1/-1"><h2 class="t-h3">Кошик порожній</h2><p>Додайте товари, і ми повернемо вас до оформлення.</p><a href="catalog.html" class="btn btn--primary btn--lg">Перейти в каталог</a></div>';
} else {
  const totals = cartTotals(lines);
  let promo = null;
  try { promo = sessionStorage.getItem('le-promo'); } catch {}
  const discount = promo && PROMO[promo] ? Math.round(totals.total * PROMO[promo]) : 0;
  const grand = totals.total - discount;

  // ---------- Підсумок ----------
  $('#co-items').innerHTML = lines.map(({ item, p, opt, total }) => `<li class="summary__item"><img src="${p.image}" alt="" width="56" height="52" loading="lazy"><div><strong>${esc(p.title)}</strong><span>${opt ? esc(opt.short) + ' · ' : ''}${item.qty} шт</span></div><b>${money(total)} грн</b></li>`).join('');
  renderSummary(totals);
  $('#checkout-submit').textContent = `Підтвердити замовлення · ${money(grand)} грн`;

  // ---------- Стан форми ----------
  const field = (name) => form.elements[name];
  const value = (name) => new FormData(form).get(name);
  const DELIVERY_TEXT = { crew: 'привезе бригада, безкоштовно', np: 'Нова Пошта, за тарифами', courier: "кур'єр, за тарифами", pickup: 'самовивіз, безкоштовно' };

  // Є монтаж — за замовчуванням обладнання привозить бригада
  if (totals.hasInstall) {
    $('#tile-crew').hidden = false;
    $('#survey-check').hidden = false;
    field('delivery').value = 'crew';
  }
  if (new URLSearchParams(location.search).get('type') === 'company') field('buyer').value = 'company';

  function sync() {
    const company = value('buyer') === 'company';
    $('#company-fields').hidden = !company;

    const delivery = value('delivery');
    $$('#delivery-fields [data-for]').forEach((f) => { f.hidden = !f.dataset.for.split(' ').includes(delivery); });
    $('#co-address-label').textContent = delivery === 'crew' ? "Адреса об'єкта для монтажу" : 'Адреса доставки';
    $('#sum-delivery').textContent = DELIVERY_TEXT[delivery];

    // Оплата: рахунок — лише юрособам; накладений платіж — до ліміту, без монтажу і не для юросіб
    const tile = (k) => $(`[data-pay="${k}"]`);
    const allow = { card: true, parts: !company, invoice: company, cod: !company && !totals.hasInstall && grand <= COD_LIMIT && delivery !== 'pickup' };
    Object.entries(allow).forEach(([k, ok]) => { tile(k).classList.toggle('is-disabled', !ok); tile(k).querySelector('input').disabled = !ok; });
    $('#cod-note').textContent = grand > COD_LIMIT ? `Доступно для замовлень до ${money(COD_LIMIT)} грн` : totals.hasInstall ? 'Недоступно для замовлень із монтажем' : 'Накладений платіж Нової Пошти, комісія перевізника 2% + 20 грн';
    if (!allow[value('payment')]) field('payment').value = company ? 'invoice' : 'card';

    const parts = value('payment') === 'parts';
    $('#parts-fields').hidden = !parts;
    const months = Number(value('months')) || 24;
    $('#parts-note').textContent = parts ? `${months} платежів по ${money(grand / months)} грн · перший — сьогодні` : `ПриватБанк або monobank · від ${money(grand / 24)} грн/міс`;
  }
  form.addEventListener('change', sync);
  sync();

  // ---------- Перевірка ----------
  const RULES = {
    name: (v) => v.trim().length >= 2,
    tel: (v) => v.replace(/\D/g, '').length >= 10,
    email: (v) => v.trim() === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    company: (v) => value('buyer') !== 'company' || v.trim().length >= 2,
    edrpou: (v) => value('buyer') !== 'company' || /^(\d{8}|\d{10})$/.test(v.trim()),
    city: (v) => value('delivery') === 'pickup' || v.trim().length >= 2,
    branch: (v) => value('delivery') !== 'np' || v !== '',
    address: (v) => !['courier', 'crew'].includes(value('delivery')) || v.trim().length >= 5,
  };
  const check = (name) => {
    const el = field(name);
    const ok = RULES[name](el.value);
    el.closest('.field').classList.toggle('is-error', !ok);
    el.setAttribute('aria-invalid', String(!ok));
    return ok;
  };
  Object.keys(RULES).forEach((name) => field(name).addEventListener('blur', () => { if (field(name).closest('.field').classList.contains('is-error')) check(name); }));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const bad = Object.keys(RULES).filter((name) => !check(name));
    $('#checkout-error').hidden = bad.length === 0;
    if (bad.length) { field(bad[0]).focus(); field(bad[0]).scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }

    // Демо: замовлення зберігаємо в браузері й показуємо на сторінці «Дякуємо». Тут буде запит на сервер і перехід до оплати.
    const order = {
      number: 'LE-' + String(Date.now()).slice(-6),
      items: lines.map(({ item, p, opt, total }) => ({ title: p.title, image: p.image, option: opt ? opt.short : null, qty: item.qty, total })),
      total: grand,
      hasInstall: totals.hasInstall,
      buyer: value('buyer'), name: value('name'), tel: value('tel'), email: value('email'),
      delivery: value('delivery'), city: value('city'), branch: value('branch'), address: value('address'),
      payment: value('payment'), months: value('months'),
    };
    try { sessionStorage.setItem('le-last-order', JSON.stringify(order)); sessionStorage.removeItem('le-promo'); } catch {}
    cartSave([]);
    location.href = themeHref('order.html');
  });
}
