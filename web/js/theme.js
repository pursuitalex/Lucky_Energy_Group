// Lucky Energy · світла тема: посилання й картинки, які додає JS, підміняємо на світлі варіанти.
// Статичну розмітку перетворює збирач (tools/build-light-pages.cjs); цей модуль ловить те, що з'являється на льоту:
// картки товарів, меню, кошик, результат квізу, кейси. Працює лише на сторінках із data-theme="light".

export const isLight = document.documentElement.dataset.theme === 'light';
const PAGE = /^(index|catalog|product|solution|quiz|compare|cases|case|blog|article|cart|checkout|order|page)\.html([?#].*)?$/;

// Посилання на сторінку сайту з урахуванням теми: 'order.html' → 'order-light.html' на світлих сторінках
export const themeHref = (href) => (isLight ? href.replace(PAGE, (m, p, tail = '') => `${p}-light.html${tail}`) : href);

if (isLight) {
  let lightImages = null;
  const fixImg = (img) => {
    const src = img.getAttribute('src') || '';
    const m = src.match(/^img\/([a-z0-9-]+\.jpg)$/);
    if (!m || !lightImages) return;
    if (lightImages.has(m[1])) img.setAttribute('src', `img/light/${m[1]}`);
  };
  const fix = (root) => {
    if (root.nodeType !== 1) return;
    // пишемо атрибут лише коли він змінюється — інакше спостерігач ловитиме власні правки без кінця
    // перемикач теми у футері навмисно веде на темну сторінку — його не чіпаємо
    const fixA = (a) => { if (a.classList.contains('theme-link')) return; const h = a.getAttribute('href'); const t = themeHref(h); if (t !== h) a.setAttribute('href', t); };
    if (root.matches('a[href]')) fixA(root);
    root.querySelectorAll('a[href]').forEach(fixA);
    if (root.matches('img')) fixImg(root);
    root.querySelectorAll('img').forEach(fixImg);
  };
  // список світлих рендерів — маленький JSON, щоб не вгадувати наосліп
  fetch('img/light/index.json').then((r) => r.json()).then((list) => { lightImages = new Set(list); fix(document.body); }).catch(() => {});
  // нові вузли — і зміни src/href у наявних (галерея товару міняє src картинки на місці)
  new MutationObserver((records) => records.forEach((r) => { if (r.type === 'attributes') fix(r.target); else r.addedNodes.forEach(fix); })).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'href'] });
  fix(document.body);
}
