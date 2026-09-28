// Lucky Energy · базова поведінка компонентів (без залежностей)

document.documentElement.classList.remove('no-js');

// Поява блоків при скролі: [data-reveal], затримка каскадом у межах одного батьківського елемента
const revealEls = document.querySelectorAll('[data-reveal]');
if ('IntersectionObserver' in window && revealEls.length) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const siblings = [...el.parentElement.children].filter((c) => c.hasAttribute('data-reveal') && !c.classList.contains('is-in'));
      el.style.setProperty('--reveal-i', Math.max(0, siblings.indexOf(el)));
      el.classList.add('is-in');
      io.unobserve(el);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  revealEls.forEach((el) => io.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add('is-in'));
}

// Tabs: role="tablist" + стрілки клавіатури
document.querySelectorAll('[role="tablist"]').forEach((list) => {
  const tabs = [...list.querySelectorAll('[role="tab"]')];
  const select = (tab) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
      const panel = t.getAttribute('aria-controls') && document.getElementById(t.getAttribute('aria-controls'));
      if (panel) panel.hidden = !on;
    });
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
      next.focus();
      select(next);
    });
  });
});

// Accordion: одна відкрита панель у групі. Делегування — працює і для акордеонів, які сторінка домальовує пізніше
document.addEventListener('click', (e) => {
  const trigger = e.target.closest('.accordion__trigger');
  if (!trigger) return;
  const open = trigger.getAttribute('aria-expanded') === 'true';
  trigger.closest('.accordion').querySelectorAll('.accordion__trigger').forEach((t) => t.setAttribute('aria-expanded', 'false'));
  trigger.setAttribute('aria-expanded', String(!open));
});

// Chip-перемикачі
document.querySelectorAll('button.chip[aria-pressed]').forEach((chip) => {
  chip.addEventListener('click', () => chip.setAttribute('aria-pressed', chip.getAttribute('aria-pressed') !== 'true'));
});

// Кількість
document.querySelectorAll('.qty').forEach((qty) => {
  const out = qty.querySelector('output');
  qty.addEventListener('click', (e) => {
    const step = e.target.closest('button')?.dataset.step;
    if (!step) return;
    out.value = Math.max(1, Number(out.value) + Number(step));
  });
});
