import './menu.js'; // мобільне меню — на всіх сторінках
import './theme.js'; // світла тема: підміна посилань і картинок, що додає JS
import './lang.js'; // перемикач мови з підтвердженням переходу
// Спільне для всіх сторінок: плаваюча шапка отримує щільне тло після початку скролу
const topbar = document.getElementById('topbar');
const onScroll = () => topbar?.classList.toggle('is-stuck', window.scrollY > 24);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

// Лічильник кошика в шапці: рахуємо позиції з localStorage; shared.js повідомляє про зміни подією «le-cart»
const cartBadge = document.getElementById('cart-count');
const renderCartBadge = () => {
  if (!cartBadge) return;
  let n = 0;
  try { n = JSON.parse(localStorage.getItem('le-cart-items') || '[]').reduce((sum, x) => sum + (Number(x.qty) || 0), 0); } catch {}
  cartBadge.textContent = n;
  cartBadge.hidden = n === 0;
};
renderCartBadge();
window.addEventListener('le-cart', renderCartBadge);
window.addEventListener('storage', renderCartBadge);
