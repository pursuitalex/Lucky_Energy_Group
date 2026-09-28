// Lucky Energy · перемикач мови. Одна кнопка з поточною мовою (UA або RU) у шапці, мобільному меню й футері.
// Клік відкриває невелике підтвердження: питання мовою, на яку переходимо, кнопка «так» — тією ж мовою,
// «ні» — поточною. Так людина, що натиснула випадково, і людина, якій потрібна інша мова, обидві зрозуміють.
// Адреса перекладу береться зі стандартного SEO-тегу в <head>: <link rel="alternate" hreflang="ru" href="/ru/…">.
// Поки такого тегу немає (російська версія ще не зверстана), замість переходу показуємо, що версія готується.
// Щойно сторінки отримають hreflang-теги, перехід запрацює без змін у цьому скрипті.

const current = document.documentElement.lang === 'ru' ? 'ru' : 'uk';
const target = current === 'uk' ? 'ru' : 'uk';

const TEXT = {
  ru: { question: 'Перейти на русскую версию сайта?', yes: 'Да, перейти', pending: 'Русская версия сайта готовится. Скоро будет доступна.' },
  uk: { question: 'Перейти на українську версію сайту?', yes: 'Так, перейти', pending: 'Українська версія цієї сторінки готується.' },
};
const STAY = { uk: 'Ні, залишитись', ru: 'Нет, остаться' };
const OK = { uk: 'Зрозуміло', ru: 'Понятно' };

// Адреса цієї ж сторінки іншою мовою; параметри (?id=…) зберігаємо, бо це та сама сторінка
const alternate = () => {
  const link = document.querySelector(`link[rel="alternate"][hreflang="${target}"]`);
  if (!link) return null;
  const url = new URL(link.getAttribute('href'), location.href);
  if (!url.search) url.search = location.search;
  return url.pathname + url.search + location.hash;
};

let pop = null;
let trigger = null;

const close = (restoreFocus = true) => {
  if (!pop) return;
  pop.remove();
  pop = null;
  trigger?.setAttribute('aria-expanded', 'false');
  if (restoreFocus) trigger?.focus({ preventScroll: true });
  trigger = null;
  document.removeEventListener('pointerdown', onOutside, true);
  document.removeEventListener('keydown', onKey, true);
  window.removeEventListener('resize', onResize);
};
const onOutside = (e) => { if (pop && !pop.contains(e.target) && e.target !== trigger) close(false); };
const onKey = (e) => {
  if (!pop) return;
  if (e.key === 'Escape') { e.stopPropagation(); close(); return; }
  if (e.key !== 'Tab') return;
  const items = [...pop.querySelectorAll('a, button')];
  const first = items[0], last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
};
const place = () => {
  if (!pop || !trigger) return;
  const r = trigger.getBoundingClientRect();
  const w = pop.offsetWidth, h = pop.offsetHeight, gap = 8, pad = 12;
  // під кнопкою, праворуч вирівняно по її правому краю; якщо внизу не вміщається — над нею
  const left = Math.min(Math.max(pad, r.right - w), innerWidth - w - pad);
  const top = r.bottom + gap + h > innerHeight - pad ? r.top - gap - h : r.bottom + gap;
  pop.style.left = `${Math.round(left)}px`;
  pop.style.top = `${Math.round(Math.max(pad, top))}px`;
};
const onResize = () => place();

async function open(btn) {
  if (pop) { const same = trigger === btn; close(false); if (same) return; }
  trigger = btn;
  btn.setAttribute('aria-expanded', 'true');
  const t = TEXT[target];
  const url = alternate();

  pop = document.createElement('div');
  pop.className = 'lang-pop';
  pop.setAttribute('role', 'dialog');
  pop.setAttribute('aria-modal', 'false');
  pop.setAttribute('aria-labelledby', 'lang-pop-q');
  pop.lang = target === 'ru' ? 'ru' : 'uk';
  pop.innerHTML = `<p class="lang-pop__q" id="lang-pop-q">${t.question}</p>
    <div class="lang-pop__actions"><a class="btn btn--primary btn--sm" href="${url || location.href}" hreflang="${pop.lang}" data-lang-go>${t.yes}</a><button type="button" class="btn btn--ghost btn--sm" lang="${current}" data-lang-stay>${STAY[current]}</button></div>`;
  document.body.append(pop);
  place();
  pop.querySelector('[data-lang-go]').focus({ preventScroll: true });

  pop.querySelector('[data-lang-stay]').addEventListener('click', () => close());
  pop.querySelector('[data-lang-go]').addEventListener('click', (e) => {
    if (url) return; // переклад є — звичайний перехід за посиланням
    e.preventDefault();
    // сторінки іншою мовою ще немає — пояснюємо замість 404
    pop.querySelector('.lang-pop__q').textContent = t.pending;
    pop.querySelector('.lang-pop__actions').innerHTML = `<button type="button" class="btn btn--secondary btn--sm" lang="${current}" data-lang-ok>${OK[current]}</button>`;
    pop.querySelector('[data-lang-ok]').addEventListener('click', () => close());
    pop.querySelector('[data-lang-ok]').focus({ preventScroll: true });
    place();
  });

  document.addEventListener('pointerdown', onOutside, true);
  document.addEventListener('keydown', onKey, true);
  window.addEventListener('resize', onResize);
}

// Делегування: кнопки мови бувають і в розмітці, і в меню, яке будує menu.js
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-lang-switch]');
  if (!btn) return;
  e.preventDefault();
  open(btn);
});
// Скрол сторінки зсуває кнопку — закриваємо, щоб підказка не висіла окремо
window.addEventListener('scroll', () => close(false), { passive: true });

// Підпис кнопок — поточна мова
document.querySelectorAll('[data-lang-switch]').forEach((b) => { b.textContent = current === 'ru' ? 'RU' : 'UA'; });
export const LANG_LABEL = current === 'ru' ? 'RU' : 'UA';
