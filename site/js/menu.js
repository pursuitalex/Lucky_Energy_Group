// Lucky Energy · мобільне меню. Одне джерело для всіх сторінок (темна шапка й шапка світлого концепту):
// розмітку створює скрипт, тому пункти меню не розходяться між сторінками.

const burger = document.querySelector('.site-header__burger, .lheader__burger');

if (burger) {
  const onHome = /(^|\/)(index(-light)?\.html)?$/.test(location.pathname);
  const home = document.documentElement.dataset.theme === 'light' ? 'index.html' : 'index.html';
  const anchor = (id) => (onHome ? `#${id}` : `${home}#${id}`);
  const icon = (id) => `<svg class="icon" aria-hidden="true"><use href="#${id}"/></svg>`;

  const CATEGORIES = [['inverters', 'Інвертори', 'i-inverter'], ['batteries', 'Акумулятори', 'i-battery'], ['panels', 'Сонячні панелі', 'i-sun'], ['kits', 'Готові комплекти', 'i-home'], ['stations', 'Зарядні станції', 'i-bolt'], ['generators', 'Генератори', 'i-grid']];
  const SOLUTIONS = [['apartment', 'Для квартири', 'Резерв без панелей', 'i-building'], ['house', 'Для будинку', 'Сонячна станція з АКБ', 'i-home'], ['business', 'Для бізнесу', 'Безперебійність і окупність', 'i-store']];
  const LINKS = [['Послуги й монтаж', anchor('process')], ['Кейси', 'cases.html'], ['Фінансування', anchor('finance')], ['Блог', 'blog.html'], ['Контакти', anchor('lead')]];

  const menu = document.createElement('div');
  menu.className = 'mnav';
  menu.id = 'mnav';
  menu.hidden = true;
  menu.setAttribute('role', 'dialog');
  menu.setAttribute('aria-modal', 'true');
  menu.setAttribute('aria-label', 'Меню сайту');
  menu.innerHTML = `
    <div class="mnav__inner">
      <form class="mnav__search" role="search" action="catalog.html">${icon('i-search')}<input type="search" name="q" placeholder="Пошук у каталозі" aria-label="Пошук у каталозі"></form>

      <section class="mnav__group" aria-labelledby="mnav-sol">
        <h2 class="mnav__label" id="mnav-sol">Рішення</h2>
        <ul class="mnav__solutions">${SOLUTIONS.map(([t, name, note, ic]) => `<li><a href="solution.html?type=${t}">${icon(ic)}<span><strong>${name}</strong><small>${note}</small></span>${icon('i-arrow')}</a></li>`).join('')}</ul>
      </section>

      <section class="mnav__group" aria-labelledby="mnav-cat">
        <h2 class="mnav__label" id="mnav-cat">Каталог</h2>
        <ul class="mnav__cats">${CATEGORIES.map(([c, name, ic]) => `<li><a href="catalog.html?cat=${c}">${icon(ic)}${name}</a></li>`).join('')}</ul>
        <a href="catalog.html" class="link-arrow">Увесь каталог ${icon('i-arrow')}</a>
      </section>

      <nav class="mnav__links" aria-label="Розділи сайту">${LINKS.map(([name, href]) => `<a href="${href}">${name}</a>`).join('')}</nav>

      <div class="mnav__foot">
        <a href="tel:0800750120" class="mnav__phone">0 800 750 120</a>
        <span class="mnav__note">Безкоштовно · Пн–Сб 9:00–19:00</span>
        <div class="mnav__row"><a href="https://t.me/luckyenergy" class="chip" target="_blank" rel="noopener">Telegram</a><a href="viber://chat?number=%2B380800750120" class="chip">Viber</a><a href="https://wa.me/380800750120" class="chip" target="_blank" rel="noopener">WhatsApp</a><span class="mnav__lang"><button type="button" class="lang-switch" data-lang-switch aria-haspopup="dialog" aria-expanded="false" aria-label="Мова сайту: українська. Змінити мову">UA</button></span></div>
        <a href="quiz.html" class="btn btn--primary btn--lg btn--block">Підібрати рішення ${icon('i-arrow')}</a>
      </div>
    </div>`;
  document.body.append(menu);

  burger.setAttribute('aria-controls', 'mnav');
  const glyph = burger.querySelector('svg');
  const ICONS = { open: '<path d="M6 6l12 12M18 6L6 18"/>', closed: glyph.innerHTML };
  const header = burger.closest('.topbar, .lheader');

  const setOpen = (open) => {
    // меню починається одразу під шапкою, щоб логотип, кошик і кнопка закриття лишалися на місці
    if (open) menu.style.setProperty('--mnav-top', `${Math.round(header.getBoundingClientRect().bottom)}px`);
    menu.hidden = !open;
    requestAnimationFrame(() => menu.classList.toggle('is-open', open));
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрити меню' : 'Меню');
    glyph.innerHTML = open ? ICONS.open : ICONS.closed;
    document.documentElement.classList.toggle('is-menu-open', open);
    if (open) menu.scrollTop = 0; else burger.focus({ preventScroll: true });
  };
  const isOpen = () => burger.getAttribute('aria-expanded') === 'true';

  burger.addEventListener('click', () => setOpen(!isOpen()));
  // нижня панель «Пошук»: відкриває меню й ставить курсор у поле пошуку; без JS веде в каталог
  document.querySelectorAll('[data-open-search]').forEach((a) => a.addEventListener('click', (e) => {
    if (getComputedStyle(burger).display === 'none') return;
    e.preventDefault(); setOpen(true); menu.querySelector('input[type="search"]')?.focus({ preventScroll: true });
  }));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', (e) => {
    if (!isOpen()) return;
    if (e.key === 'Escape') return setOpen(false);
    if (e.key !== 'Tab') return;
    // фокус ходить по колу: кнопка меню → пункти меню → кнопка меню
    const items = [burger, ...menu.querySelectorAll('a, button, input')];
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  // на широкому екрані меню не потрібне — закриваємо, щоб не лишити заблокований скрол
  window.matchMedia('(min-width: 1200px)').addEventListener('change', (m) => { if (m.matches && isOpen()) setOpen(false); });
}
