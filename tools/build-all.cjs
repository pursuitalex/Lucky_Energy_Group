// Перезбирає всі сторінки, що складаються зі спільних частин web/index.html (шапка, спрайт, футер, нижня панель).
// Запускати після будь-яких правок шапки/футера в index.html або файлів у tools/pages/.
// Використання: node tools/build-all.cjs
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PAGES = [
  ['catalog', 'Каталог обладнання — інвертори, акумулятори, сонячні панелі | Lucky Energy', 'Каталог енергообладнання з цінами та монтажем: гібридні інвертори, акумулятори LiFePO4, сонячні панелі, готові комплекти, зарядні станції та генератори.', 'catalog.css', 'catalog.js', 'catalog.html'],
  ['product', 'Товар | Lucky Energy', 'Характеристики, сумісність, документи й відгуки. Купуйте лише обладнання або з монтажем і сервісом.', 'catalog.css,product.css', 'product.js', 'catalog.html'],
  ['solution', 'Рішення для квартири, будинку та бізнесу | Lucky Energy', 'Готові пакети з монтажем для квартири, будинку та бізнесу: що працюватиме під час відключень, скільки годин і скільки коштує.', 'catalog.css,solution.css', 'solution.js', ''],
  ['quiz', 'Підбір рішення за 5 запитань | Lucky Energy', 'Дайте відповідь на 5 простих запитань — і отримайте систему резервного живлення чи сонячну станцію з ціною. Без обов\u2019язкового дзвінка.', 'catalog.css,solution.css,quiz.css', 'quiz.js', ''],
  ['compare', 'Порівняння товарів | Lucky Energy', 'Порівняйте до 4 інверторів, акумуляторів чи панелей за характеристиками, ціною з монтажем і наявністю.', 'catalog.css,cart.css,quiz.css,compare.css', 'compare.js', 'catalog.html'],
  ['case', 'Кейс | Lucky Energy', 'Реалізований об’єкт: задача, рішення, склад системи, етапи, цифри й відгук власника.', 'catalog.css,solution.css,case.css', 'case.js', ''],
  ['cases', 'Реалізовані об\u2019єкти — кейси | Lucky Energy', 'Квартири, будинки й бізнес по всій Україні: що поставили, скільки коштувало і як працює під час відключень.', 'catalog.css,solution.css,cases.css', 'cases.js', ''],
  ['article', 'Стаття | Блог Lucky Energy', 'Корисне перед покупкою: як обрати інвертор, як отримати кредит 0%, що краще — генератор, станція чи інвертор з АКБ.', 'catalog.css,home.css,article.css', 'article.js', ''],
  ['page', 'Інформація для покупців | Lucky Energy', 'Доставка й оплата, гарантія, обмін і повернення, сервіс, публічна оферта й політика конфіденційності Lucky Energy.', 'catalog.css,home.css,article.css', 'page.js', ''],
  ['blog', 'Блог і база знань | Lucky Energy', 'Корисне перед покупкою: як обрати обладнання, як фінансувати, що краще для квартири, будинку чи бізнесу.', 'catalog.css,home.css,article.css,blog.css', 'blog.js', 'blog.html'],
  ['cart', 'Кошик | Lucky Energy', 'Ваш кошик: оберіть варіант покупки — лише обладнання, з монтажем або з монтажем і сервісом.', 'catalog.css,cart.css', 'cart.js', ''],
  ['checkout', 'Оформлення замовлення | Lucky Energy', 'Оформлення замовлення: контакти, доставка, оплата карткою, частинами або за рахунком.', 'catalog.css,cart.css', 'checkout.js', ''],
  ['order', 'Замовлення прийнято | Lucky Energy', 'Дякуємо за замовлення. Інженер зателефонує протягом 2 годин.', 'catalog.css,cart.css', 'order.js', ''],
];

const tools = __dirname;
const web = path.join(tools, '..', 'web');
for (const [name, title, desc, css, js, active] of PAGES) {
  process.stdout.write(execFileSync('node', [path.join(tools, 'build-page.cjs'), path.join(tools, 'pages', `${name}.main.html`), path.join(web, `${name}.html`), title, desc, css, js, active], { encoding: 'utf8' }));
}
// Світла тема збирається, лише якщо її збирачі є поруч
for (const script of ['build-light.cjs', 'build-light-pages.cjs']) {
  if (fs.existsSync(path.join(tools, script))) process.stdout.write(execFileSync('node', [path.join(tools, script)], { encoding: 'utf8' }));
}
