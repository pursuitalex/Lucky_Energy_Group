// Lucky Energy · кошик: позиції, варіант покупки, кількість, підсумок, підказка інженера, «з цим купують»

import { $, $$, money, esc, plural, productUrl, loadCatalog, renderCard, purchaseOptions, cartItems, cartSave, cartAdd, cartLines, cartTotals, MONTHS } from './shared.js';

const data = await loadCatalog();
const PROMO = { LUCKY5: 0.05 }; // демо-промокод: −5%
let promo = null;
try { promo = sessionStorage.getItem('le-promo'); } catch {}

export function renderSummary(totals) {
  const discount = promo && PROMO[promo] ? Math.round(totals.total * PROMO[promo]) : 0;
  const total = totals.total - discount;
  $('#sum-qty').textContent = `· ${totals.qty} ${plural(totals.qty, 'товар', 'товари', 'товарів')}`;
  $('#sum-equipment').textContent = `${money(totals.equipment)} грн`;
  $('#sum-extra-row').hidden = totals.extra === 0;
  $('#sum-extra').textContent = `${money(totals.extra)} грн`;
  $('#sum-saving-row').hidden = totals.saving + discount === 0;
  $('#sum-saving').textContent = `−${money(totals.saving + discount)} грн`;
  $('#sum-delivery').textContent = totals.hasInstall ? 'привезе бригада, безкоштовно' : 'за тарифами перевізника';
  $('#sum-total').textContent = `${money(total)} грн`;
  $('#sum-monthly').textContent = `або від ${money(total / MONTHS)} грн/міс · ${MONTHS} платежі без переплат`;
}

function lineHtml({ item, p, opt, unit, total }, index) {
  const opts = purchaseOptions(p);
  const name = `opt-${index}`;
  const optsHtml = opts && opts.length > 1
    ? `<div class="buy-opts" role="radiogroup" aria-label="Як купуєте">${opts.map((o) => `<label class="buy-opt"><input type="radio" name="${name}" value="${o.id}" data-index="${index}" ${o.id === opt.id ? 'checked' : ''}>${esc(o.short)}${o.add ? ` <b>+${money(o.add)}</b>` : ''}</label>`).join('')}</div>`
    : opts ? `<span class="badge badge--accent">${esc(opts[0].short)}</span>` : '<span class="t-caption c-tertiary">Монтаж не потрібен — працює одразу з коробки</span>';
  return `<li class="cart-item">
    <a href="${productUrl(p)}" class="cart-item__media" tabindex="-1" aria-hidden="true"><img src="${p.image}" alt="" width="1192" height="1100" loading="lazy"></a>
    <div class="cart-item__body">
      <span class="product-card__brand">${esc(p.brand)} · ${esc(p.id)}</span>
      <h2 class="cart-item__title"><a href="${productUrl(p)}">${esc(p.title)}</a></h2>
      ${optsHtml}
    </div>
    <div class="cart-item__side">
      <div class="cart-item__price"><span class="cart-item__sum">${money(total)} <small>грн</small></span>${item.qty > 1 ? `<span class="cart-item__unit">${money(unit)} грн × ${item.qty}</span>` : ''}</div>
      <div class="cart-item__controls">
        <div class="qty" role="group" aria-label="Кількість"><button type="button" data-step="-1" data-index="${index}" aria-label="Менше">−</button><output>${item.qty}</output><button type="button" data-step="1" data-index="${index}" aria-label="Більше">+</button></div>
        <button type="button" class="cart-item__remove" data-remove="${index}" aria-label="Прибрати з кошика: ${esc(p.title)}"><svg class="icon"><use href="#i-close"/></svg></button>
      </div>
    </div>
  </li>`;
}

// Підказка: чого бракує, щоб із покупок вийшла робоча система
function renderHint(lines) {
  const cats = new Set(lines.map((l) => l.p.category));
  const hint = $('#cart-hint');
  let msg = null;
  if (cats.has('inverters') && !cats.has('batteries') && !cats.has('kits')) msg = ['Інвертор без акумулятора не дасть резерву', 'Для роботи під час відключень потрібен акумулятор 48 В. Підберемо сумісний із вашою моделлю.', 'catalog.html?cat=batteries', 'Акумулятори'];
  else if (cats.has('batteries') && !cats.has('inverters') && !cats.has('kits')) msg = ['Акумулятору потрібен інвертор', 'Якщо інвертора ще немає — оберіть гібридний із тією ж напругою АКБ.', 'catalog.html?cat=inverters', 'Інвертори'];
  else if (cats.has('panels') && !cats.has('inverters') && !cats.has('kits')) msg = ['Панелям потрібен інвертор із MPPT', 'Перевірте діапазон напруги MPPT — або довірте це інженеру.', 'catalog.html?cat=inverters', 'Інвертори'];
  hint.hidden = !msg;
  if (msg) { $('#cart-hint-title').textContent = msg[0]; $('#cart-hint-text').textContent = msg[1]; const a = $('#cart-hint-link'); a.href = msg[2]; a.textContent = msg[3]; }
}

function renderUpsell(lines) {
  const inCart = new Set(lines.map((l) => l.p.id));
  const cats = new Set(lines.map((l) => l.p.category));
  const want = cats.has('inverters') ? ['batteries', 'panels'] : cats.has('batteries') ? ['inverters', 'panels'] : [];
  const pool = data.products.filter((p) => !inCart.has(p.id));
  const picks = [...pool.filter((p) => want.includes(p.category)), ...pool.filter((p) => p.badges.includes('hit')), ...pool].filter((p, i, a) => a.indexOf(p) === i).slice(0, 4);
  $('#upsell-grid').innerHTML = picks.map((p) => renderCard(p)).join('');
  if (!lines.length) { $('#upsell-label').textContent = 'Популярне'; $('#upsell-title').innerHTML = 'З чого <span class="t-dim">починають</span>'; }
  $$('#upsell-grid [data-reveal]').forEach((el) => el.classList.add('is-in'));
}

function render() {
  const lines = cartLines(data.products);
  const empty = lines.length === 0;
  $('#cart').hidden = empty;
  $('#cart-empty').hidden = !empty;
  const totals = cartTotals(lines);
  $('#cart-title-count').textContent = empty ? '' : `· ${totals.qty} ${plural(totals.qty, 'товар', 'товари', 'товарів')}`;
  if (!empty) {
    $('#cart-list').innerHTML = lines.map(lineHtml).join('');
    renderSummary(totals);
    renderHint(lines);
  }
  renderUpsell(lines);
}

if ($('#cart-list')) {
  render();

  $('#cart-list').addEventListener('click', (e) => {
    const items = cartItems();
    const step = e.target.closest('[data-step]');
    if (step) { e.stopImmediatePropagation(); const it = items[step.dataset.index]; it.qty = Math.max(1, it.qty + Number(step.dataset.step)); cartSave(items); return render(); }
    const rm = e.target.closest('[data-remove]');
    if (rm) { items.splice(Number(rm.dataset.remove), 1); cartSave(items); return render(); }
  }, true);

  $('#cart-list').addEventListener('change', (e) => {
    if (e.target.type !== 'radio') return;
    const items = cartItems();
    const it = items[e.target.dataset.index];
    // якщо такий самий товар із цим варіантом уже є — зливаємо позиції
    const twin = items.find((x, i) => i !== Number(e.target.dataset.index) && x.id === it.id && x.option === e.target.value);
    if (twin) { twin.qty += it.qty; items.splice(Number(e.target.dataset.index), 1); } else it.option = e.target.value;
    cartSave(items); render();
  });

  $('#cart-clear').addEventListener('click', () => { cartSave([]); render(); });

  $('#promo-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const code = new FormData(e.target).get('promo').trim().toUpperCase();
    const note = $('#promo-note');
    if (PROMO[code]) { promo = code; try { sessionStorage.setItem('le-promo', code); } catch {} note.textContent = `Промокод ${code} застосовано: −${PROMO[code] * 100}%`; note.style.color = 'var(--color-accent-text)'; }
    else { note.textContent = 'Такого промокоду немає або він уже не діє'; note.style.color = 'var(--color-danger)'; }
    render();
  });

  document.addEventListener('click', (e) => {
    const buy = e.target.closest('#upsell-grid [data-buy]');
    if (buy) { cartAdd(buy.dataset.buy); render(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  });
}

export { PROMO };
