// Lucky Energy · сторінка «Дякуємо»: показує щойно створене замовлення (демо — із sessionStorage)

import { $, money, esc } from './shared.js';

let order = null;
try { order = JSON.parse(sessionStorage.getItem('le-last-order') || 'null'); } catch {}

const PAYMENT = { card: 'Карткою онлайн', parts: 'Оплата частинами', invoice: 'Рахунок-фактура', cod: 'Оплата при отриманні' };
const DELIVERY = { crew: 'Привезе монтажна бригада', np: 'Нова Пошта — відділення', courier: "Кур'єр Нової Пошти", pickup: 'Самовивіз, Тернопіль' };

if (!order) {
  $('#order').innerHTML = '<div class="empty" style="grid-column:1/-1"><h2 class="t-h3">Тут з\'явиться ваше замовлення</h2><p>Схоже, сторінку відкрито напряму. Деталі замовлення ми надсилаємо на пошту й у месенджер.</p><a href="catalog.html" class="btn btn--primary btn--lg">Перейти в каталог</a></div>';
} else {
  $('#order-h1').textContent = `Замовлення ${order.number} прийнято`;
  $('#order-number').textContent = `№ ${order.number}`;
  $('#order-status-title').textContent = `${order.name.split(' ').pop()}, ми вже працюємо над замовленням`;
  $('#order-status-text').textContent = order.email ? `Підтвердження надіслали на ${order.email}.` : 'Підтвердження надішлемо в месенджер на ваш номер.';

  // Кроки залежать від оплати й монтажу
  const pay = {
    card: ['Оплата карткою', 'Після підтвердження надішлемо посилання на оплату. Гроші не списуються, доки інженер не перевірить сумісність.'],
    parts: ['Оформлення оплати частинами', `Надішлемо заявку в банк: ${order.months} платежів по ${money(order.total / Number(order.months || 24))} грн, перший — у день підтвердження.`],
    invoice: ['Рахунок-фактура', 'Протягом години надішлемо рахунок на e-mail. Відвантажуємо після надходження коштів.'],
    cod: ['Оплата при отриманні', 'Оплатите у відділенні Нової Пошти після огляду посилки.'],
  }[order.payment];
  const last = order.hasInstall
    ? ['Замір і монтаж', 'Інженер приїде на безкоштовний замір, узгодить дату. Бригада привезе обладнання, змонтує й запустить систему.']
    : order.delivery === 'pickup' ? ['Самовивіз', 'Повідомимо, коли замовлення буде зібране: Тернопіль, вул. Промислова, 20.'] : ['Відправка', 'Відправляємо в день оплати, номер накладної прийде в SMS. Доставка 1–3 дні.'];
  const steps = [['Дзвінок інженера протягом 2 годин', `Звіримо обладнання на сумісність і уточнимо деталі за номером ${esc(order.tel)}.`], pay, last];
  $('#order-next').innerHTML = steps.map(([t, d]) => `<li><div><strong>${t}</strong><span>${d}</span></div></li>`).join('');

  $('#co-items').innerHTML = order.items.map((i) => `<li class="summary__item"><img src="${i.image}" alt="" width="56" height="52"><div><strong>${esc(i.title)}</strong><span>${i.option ? esc(i.option) + ' · ' : ''}${i.qty} шт</span></div><b>${money(i.total)} грн</b></li>`).join('');
  const where = order.delivery === 'pickup' ? '' : [order.city, order.branch || order.address].filter(Boolean).join(', ');
  $('#order-details').innerHTML = [['Отримувач', order.name], ['Доставка', DELIVERY[order.delivery] + (where ? ` · ${where}` : '')], ['Оплата', PAYMENT[order.payment]]]
    .map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('');
  $('#sum-total').textContent = `${money(order.total)} грн`;
}
