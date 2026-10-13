// Lucky Energy · головна світлого концепту (A): вкладки комплектів, відгуки. Кроки процесу — статичний список без скрипта.
// Калькулятор платежу спільний із темною версією — у home.js.

// Вкладки «Готові рішення»: фільтр карток за типом об'єкта
const kitTabs = document.querySelectorAll('#kit-tabs [data-seg]');
const kits = document.querySelectorAll('#kit-list [data-seg]');
kitTabs.forEach((tab) => tab.addEventListener('click', () => {
  const seg = tab.dataset.seg;
  kitTabs.forEach((t) => t.setAttribute('aria-selected', String(t === tab)));
  kits.forEach((k) => { k.hidden = !(seg === 'all' || k.dataset.seg === seg || k.dataset.seg === 'all'); });
}));

// Відгуки (демо-дані)
const REVIEWS = [
  ['«Обирали між генератором і акумуляторами. Інженер порахував наше споживання, пояснив різницю й зібрав систему під котел, насос і холодильник. Третю зиму відключення дізнаємось лише з новин».', 'Наталія Ковальчук, Тернопіль', 'Гібридна станція 8 кВт + АКБ 10 кВт·год'],
  ['«Змонтували за два дні, чисто й охайно. Кабелі в коробах, щиток підписаний, усе показали в застосунку. Світло зникло — ми навіть не помітили».', 'Олена, Тернопіль', 'Резерв для квартири 5 кВт·год'],
  ['«Пояснили кожну позицію в кошторисі й чесно сказали, що нам не потрібно. Магазин не зупинявся жодного дня, холодильні вітрини працюють під час відключень».', 'Ігор, Київ', 'Резерв для магазину 30 кВт'],
];
const reviewText = document.getElementById('review-text');
if (reviewText) {
  let r = 0;
  const showReview = (i) => {
    r = (i + REVIEWS.length) % REVIEWS.length;
    reviewText.textContent = REVIEWS[r][0];
    document.getElementById('review-name').textContent = REVIEWS[r][1];
    document.getElementById('review-system').textContent = REVIEWS[r][2];
  };
  document.getElementById('review-prev').addEventListener('click', () => showReview(r - 1));
  document.getElementById('review-next').addEventListener('click', () => showReview(r + 1));
}


// Перший екран: перемикач фону — тимчасовий інструмент вибору фото; прибрати разом із кнопками після рішення
const hero2Bg = document.getElementById('hero2-bg');
const hero2Btns = document.querySelectorAll('[data-hero2-photo]');
if (hero2Bg && hero2Btns.length) {
  const setPhoto = (id) => {
    const btn = [...hero2Btns].find((b) => b.dataset.hero2Photo === id) || hero2Btns[0];
    hero2Bg.srcset = btn.dataset.srcset;
    hero2Bg.src = btn.dataset.src;
    hero2Bg.style.setProperty('--h2-pos', btn.dataset.pos);
    hero2Bg.style.setProperty('--h2-pos-m', btn.dataset.posM);
    const card = hero2Bg.closest('.hero2__card');
    if (btn.dataset.tone) card.dataset.tone = btn.dataset.tone; else delete card.dataset.tone;
    hero2Btns.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    try { localStorage.setItem('le-hero2-photo', btn.dataset.hero2Photo); } catch {}
  };
  hero2Btns.forEach((b) => b.addEventListener('click', () => setPhoto(b.dataset.hero2Photo)));
  let saved = null;
  try { saved = new URLSearchParams(location.search).get('photo') || localStorage.getItem('le-hero2-photo'); } catch {}
  if (saved && saved !== hero2Btns[0].dataset.hero2Photo) setPhoto(saved);
}

// Перший екран: поява стартує, коли фото готове до показу (щоб картка не розкривалась порожньою).
// Якщо фото вантажиться довго — стартуємо за 1,5 с; запасний старт на випадок збою цього файла є в <head>.
const hero2 = document.querySelector('.hero2');
if (hero2) {
  const start = () => hero2.classList.add('is-ready');
  if (!hero2Bg) start();
  else {
    const timer = setTimeout(start, 1500);
    const decoded = hero2Bg.decode ? hero2Bg.decode() : Promise.resolve();
    decoded.catch(() => {}).then(() => { clearTimeout(timer); start(); });
  }

  // Цифри під карткою рахуються від нуля, коли блок з'являється на екрані. Без руху — одразу кінцеві значення.
  const stats = hero2.querySelector('.hero2__stats');
  if (stats && 'IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const items = [...stats.querySelectorAll('.stat__value')].map((el) => {
      const node = el.firstChild;
      const m = node && node.nodeType === 3 ? node.textContent.match(/^(\d+)(\s*)$/) : null;
      return m ? { node, to: Number(m[1]), tail: m[2] } : null;
    }).filter(Boolean);
    const run = () => {
      const t0 = performance.now(), DUR = 1400;
      const tick = (t) => {
        const k = Math.min(1, (t - t0) / DUR), eased = 1 - (1 - k) ** 3;
        items.forEach((it) => { it.node.textContent = Math.round(it.to * eased) + it.tail; });
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    new IntersectionObserver((entries, io) => { if (entries.some((e) => e.isIntersecting)) { io.disconnect(); run(); } }, { threshold: 0.4 }).observe(stats);
  }
}
