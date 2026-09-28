// Lucky Energy · порівняння товарів. Список береться зі сховища (localStorage «le-compare», до 4 товарів).
// Рядки таблиці: спільні поля з products.json + характеристики з карток; підсвічуємо найкраще значення в рядку.

import { $, $$, money, esc, plural, productUrl, loadCatalog, renderCard, compareSet, favoritesSet, cartAdd, MONTHS, COMPARE_MAX } from './shared.js';

const data = await loadCatalog();
const compare = compareSet();
const favorites = favoritesSet();
const withInstall = () => $('#cmp-install').checked;
const icon = (id) => `<svg class="icon" aria-hidden="true"><use href="#${id}"/></svg>`;
const catName = (id) => data.categories.find((c) => c.id === id)?.name || id;

// Числове значення з рядка характеристики («5,12 кВт·год» → 5.12) — щоб знайти краще в рядку
const toNumber = (v) => { const m = String(v).replace(/\s/g, '').replace(',', '.').match(/-?\d+(\.\d+)?/); return m ? Number(m[0]) : null; };
// Для яких параметрів «більше = краще», для яких «менше = краще»; решта — без підсвітки
const HIGHER = ['Потужність', 'Ємність', 'ККД', 'Гарантія', 'Цикли', 'Пікова', 'Автономність', 'Рейтинг', 'Вихід', 'MPPT', 'Модулі', 'Генерація'];
const LOWER = ['Ціна', 'Шум', 'Вага', 'Перемикання', 'Окупність', 'Заряд 0–80%'];
const better = (label) => (HIGHER.some((k) => label.startsWith(k)) ? 'max' : LOWER.some((k) => label.startsWith(k)) ? 'min' : null);

function rows(products) {
  const price = (p) => p.price + (withInstall() && p.install ? p.install : 0);
  const specKeys = [...new Set(products.flatMap((p) => p.specs.map(([k]) => k)))];
  const general = [
    ['Ціна', (p) => `<strong>${money(price(p))} грн</strong>`, (p) => price(p)],
    ['Платіж на місяць', (p) => `від ${money(price(p) / MONTHS)} грн`, (p) => price(p)],
    ['Монтаж', (p) => (p.install == null ? 'не потрібен' : p.install === 0 ? 'у ціні' : `+${money(p.install)} грн`)],
    ['Наявність', (p) => (p.stock === 'in' ? '<span class="badge badge--accent"><span class="badge__dot"></span>В наявності</span>' : '<span class="badge badge--warning"><span class="badge__dot"></span>Під замовлення</span>')],
    ['Рейтинг', (p) => `<span class="rating"><span class="rating__stars">★</span>${String(p.rating).replace('.', ',')} · ${p.reviews} ${plural(p.reviews, 'відгук', 'відгуки', 'відгуків')}</span>`, (p) => p.rating],
    ['Бренд', (p) => esc(p.brand)],
    ['Тип', (p) => esc(p.type)],
    ...(products.some((p) => p.phases) ? [['Фази', (p) => (p.phases ? `${p.phases}` : '—')]] : []),
  ];
  const specs = specKeys.map((k) => [k, (p) => { const s = p.specs.find(([kk]) => kk === k); return s ? esc(s[1]) : '—'; }, (p) => { const s = p.specs.find(([kk]) => kk === k); return s ? toNumber(s[1]) : null; }]);
  return [['Загальне', general], ['Характеристики', specs]];
}

function render() {
  const ids = compare.values();
  const products = ids.map((id) => data.products.find((p) => p.id === id)).filter(Boolean);
  const n = products.length;
  const cats = [...new Set(products.map((p) => p.category))];
  $('#cmp').hidden = n === 0;
  $('#cmp-empty').hidden = n > 0;
  $('#cmp-tools').hidden = n === 0;
  $('#cmp-count').textContent = n ? `· ${n} ${plural(n, 'товар', 'товари', 'товарів')}` : '';
  document.title = n ? `Порівняння: ${[...new Set(products.map((p) => p.brand))].join(', ')} · ${cats.length === 1 ? catName(cats[0]).toLowerCase() : 'різні категорії'} | Lucky Energy` : 'Порівняння товарів | Lucky Energy';

  if (n === 1) { $('#cmp-empty-title').textContent = 'Поки що один товар'; $('#cmp-empty-text').textContent = 'Для порівняння потрібні хоча б два. Додайте ще один із підбірки нижче або з каталогу.'; $('#cmp-empty').hidden = false; $('#cmp').hidden = true; }

  $('#cmp-mixed').hidden = cats.length < 2;
  if (cats.length > 1) $('#cmp-mixed-text').textContent = `${cats.map(catName).join(' і ')} — характеристики збігаються лише частково. Найзручніше порівнювати товари однієї категорії.`;

  if (n >= 2) {
    const diffOnly = $('#cmp-diff').checked;
    const table = $('#cmp-table');
    table.style.setProperty('--n', n + (n < COMPARE_MAX ? 1 : 0));
    const head = products.map((p) => `<th><div class="cmp-head">
      <span class="cmp-head__media"><img src="${p.image}" alt="" width="1192" height="1100" loading="lazy"><button type="button" class="cmp-head__remove" data-remove="${p.id}" aria-label="Прибрати з порівняння: ${esc(p.title)}">${icon('i-close')}</button></span>
      <span class="product-card__brand">${esc(p.brand)} · ${esc(p.id)}</span>
      <span class="cmp-head__title"><a href="${productUrl(p)}">${esc(p.title)}</a></span>
      <button type="button" class="btn btn--primary btn--sm" data-buy="${p.id}">${icon('i-cart')}<span>У кошик</span></button>
    </div></th>`).join('');
    const addCol = n < COMPARE_MAX ? `<th><a href="catalog.html${cats.length === 1 ? `?cat=${cats[0]}` : ''}" class="cmp-add">+ Додати товар<br>з каталогу</a></th>` : '';
    const body = rows(products).map(([group, list]) => {
      const trs = list.map(([label, cell, numeric]) => {
        const cells = products.map(cell);
        const same = cells.every((c) => c === cells[0]);
        if (diffOnly && same) return '';
        let best = null;
        const mode = numeric && better(label);
        if (mode && !same) { const nums = products.map(numeric); const valid = nums.filter((x) => x != null); if (valid.length > 1) best = mode === 'max' ? Math.max(...valid) : Math.min(...valid); if (nums.filter((x) => x === best).length !== 1) best = null; }
        return `<tr class="${same ? 'is-same' : ''}"><td>${esc(label)}</td>${products.map((p, i) => `<td class="${best != null && numeric(p) === best ? 'is-best' : ''}">${cells[i]}</td>`).join('')}${addCol ? '<td></td>' : ''}</tr>`;
      }).filter(Boolean).join('');
      return trs ? `<tr class="cmp__group"><th colspan="${n + 2}">${group}</th></tr>${trs}` : '';
    }).join('');
    table.innerHTML = `<thead><tr><th><span class="t-label c-tertiary">${n} з ${COMPARE_MAX}</span></th>${head}${addCol}</tr></thead><tbody>${body || '<tr><td colspan="9" class="c-secondary">Усі параметри цих товарів збігаються.</td></tr>'}</tbody>`;
  }

  // Підбірка: та сама категорія, ще не в списку
  const inList = new Set(ids);
  const cat = cats[0];
  const pool = data.products.filter((p) => !inList.has(p.id));
  const picks = [...pool.filter((p) => cat && p.category === cat), ...pool.filter((p) => p.badges.includes('hit')), ...pool].filter((p, i, arr) => arr.indexOf(p) === i).slice(0, 4);
  $('#cmp-more-grid').innerHTML = picks.map((p) => renderCard(p, { withInstall: withInstall(), favorites, compare })).join('');
  $('#cmp-more-title').innerHTML = cat ? `Ще ${catName(cat).toLowerCase()} <span class="t-dim">для порівняння</span>` : 'З чого <span class="t-dim">починають</span>';
  $('#cmp-more-link').href = cat ? `catalog.html?cat=${cat}` : 'catalog.html';
  $('#cmp-more-link').firstChild.textContent = cat ? 'Уся категорія ' : 'Увесь каталог ';
  $$('#cmp-more-grid [data-reveal]').forEach((el) => el.classList.add('is-in'));
}

render();
['#cmp-diff', '#cmp-install'].forEach((s) => $(s).addEventListener('change', render));
$('#cmp-clear').addEventListener('click', () => { compare.clear(); render(); });
document.addEventListener('click', (e) => {
  const rm = e.target.closest('[data-remove]'); if (rm) { compare.delete(rm.dataset.remove); return render(); }
  const cp = e.target.closest('[data-compare]');
  if (cp) { if (!compare.has(cp.dataset.compare) && compare.size >= COMPARE_MAX) { cp.setAttribute('aria-pressed', 'false'); return; } compare.toggle(cp.dataset.compare); render(); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
  const fv = e.target.closest('[data-fav]'); if (fv) { favorites.toggle(fv.dataset.fav); fv.setAttribute('aria-pressed', String(favorites.has(fv.dataset.fav))); return; }
  const buy = e.target.closest('[data-buy]');
  if (buy) { cartAdd(buy.dataset.buy, 1, withInstall() ? 'install' : null); buy.classList.add('is-added'); const l = buy.querySelector('span'); if (l) { const old = l.textContent; l.textContent = 'Додано'; setTimeout(() => { l.textContent = old; buy.classList.remove('is-added'); }, 1400); } else setTimeout(() => buy.classList.remove('is-added'), 1400); }
});
