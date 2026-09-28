// Lucky Energy · квіз-підбір. П'ять запитань (для квартири — чотири, без сонячних панелей) → розрахунок системи →
// три варіанти з ціною. Формули й ціни — ДЕМО: у бойовій версії коефіцієнти задає інженер, ціни беруться з каталогу.

import { $, $$, money, esc, plural, MONTHS } from './shared.js';

const icon = (id) => `<svg class="icon" aria-hidden="true"><use href="#${id}"/></svg>`;

// ---------- Довідники ----------
const OBJECTS = [['apartment', 'Квартира', 'i-building'], ['house', 'Будинок', 'i-home'], ['business', 'Бізнес', 'i-store'], ['osbb', 'ОСББ', 'i-grid']];
// Прилади: потужність у ватах і частка часу, коли прилад реально споживає (для розрахунку ємності)
const LOADS_HOME = [
  ['boiler-gas', 'Газовий котел і насос', 150, 0.6, true], ['fridge', 'Холодильник', 200, 0.35, true], ['light', 'Освітлення й роутер', 150, 0.8, true],
  ['media', 'Телевізор, ноутбуки', 300, 0.5, false], ['pump', 'Свердловинний насос', 1100, 0.1, false, 'house'], ['washer', 'Пральна машина', 2000, 0.1, false],
  ['kettle', 'Мікрохвильова, чайник', 1500, 0.05, false], ['water', 'Бойлер', 2000, 0.25, false], ['ac', 'Кондиціонер', 1500, 0.4, false],
  ['stove', 'Електроплита', 3500, 0.12, false], ['ev', 'Зарядка електромобіля', 3600, 0.3, false, 'house'],
];
const LOADS_BUSINESS = [
  ['pos', 'Каси й термінали', 300, 1, true], ['hall', 'Освітлення залу', 1000, 1, true], ['net', 'Сервери, інтернет, сигналізація', 800, 1, true],
  ['cold', 'Холодильні вітрини', 2500, 0.5, false], ['desks', 'Робочі місця (до 10)', 1500, 0.7, false], ['coffee', 'Кавомашина, кухня', 3500, 0.3, false],
  ['hvac', 'Кондиціонування й вентиляція', 5000, 0.5, false], ['lift', 'Ліфт, насоси, домофони', 6000, 0.2, false, 'osbb'], ['machines', 'Виробниче обладнання', 15000, 0.5, false, 'business'],
];
const HOURS = [[4, '4 години', 'короткі відключення'], [8, '8 годин', 'найчастіший вибір'], [12, '12 годин', 'із запасом на ніч'], [24, 'Доба', 'повна автономність']];
const SOLAR = [['yes', 'Так, хочу панелі', 'менші рахунки й заряд удень', 'i-sun'], ['later', 'Можливо, пізніше', 'закладемо входи для панелей', 'i-bolt'], ['no', 'Ні, лише резерв', 'інвертор і акумулятор', 'i-battery']];
const PAY = { full: ['Оплачу одразу', 'карткою або за рахунком'], parts: ['Частинами без переплат', 'до 24 платежів, ПриватБанк і monobank'], credit: ['Кредит', ''], unknown: ['Ще не знаю', 'покажіть усі варіанти'] };
const INVERTERS = [3, 5, 6, 8, 10, 12, 15, 20, 30, 50];
const MODULE = 5.12; // кВт·год в одному акумуляторному модулі

// ---------- Стан ----------
const state = { step: 0, answers: { object: null, loads: null, hours: 8, solar: 'later', pay: 'unknown' } };
try { Object.assign(state.answers, JSON.parse(sessionStorage.getItem('le-quiz') || '{}')); } catch {}
const fromHome = new URLSearchParams(location.search).get('object');
if (OBJECTS.some(([id]) => id === fromHome)) { if (state.answers.object !== fromHome) state.answers.loads = null; state.answers.object = fromHome; state.step = 1; }

const a = state.answers;
const isBiz = () => a.object === 'business' || a.object === 'osbb';
const loadsList = () => (isBiz() ? LOADS_BUSINESS : LOADS_HOME).filter((l) => !l[5] || l[5] === a.object);
const steps = () => ['object', 'loads', 'hours', ...(a.object === 'apartment' ? [] : ['solar']), 'pay'];
const save = () => { try { sessionStorage.setItem('le-quiz', JSON.stringify(a)); } catch {} };

// ---------- Розрахунок ----------
function calc({ loads, hours, solar }) {
  const picked = loadsList().filter((l) => loads.includes(l[0]));
  const sumW = picked.reduce((n, l) => n + l[2], 0);
  const peak = Math.max(sumW * 0.8, ...picked.map((l) => l[2])) / 1000;           // не все вмикається одночасно
  const inverter = INVERTERS.find((k) => k >= peak * 1.2) || null;                   // 20% запасу на пускові струми
  const energy = picked.reduce((n, l) => n + l[2] * l[3], 0) * hours / 1000 / 0.9;   // 90% корисної ємності
  const battery = energy <= 2.4 ? 2.56 : Math.ceil(energy / MODULE) * MODULE;
  const panels = solar === 'yes' && inverter && a.object !== 'apartment' ? Math.min(Math.ceil(inverter * 1.3 / 0.58), isBiz() ? 120 : 30) : 0;
  if (!inverter) return { custom: true, peak, picked, hours };
  const equipment = 6200 * inverter + 8000 + 9300 * battery + panels * 5750;
  const install = a.object === 'apartment' ? 4500 : isBiz() ? Math.max(25000, equipment * 0.12) : 9500 + panels * 700;
  const price = Math.round((equipment + install) * 1.3 / 1000) * 1000;               // + захист, кабель, щиток, пусконалагодження
  return { peak, inverter, battery, panels, price, picked, hours, phases: inverter >= 12 ? 3 : 1 };
}
const kitFor = (r) => (a.object === 'apartment' && r.inverter <= 6 && r.battery <= MODULE ? 'LE-40001'
  : a.object === 'house' && r.panels && r.inverter >= 8 && r.inverter <= 12 ? 'LE-40002'
  : isBiz() && r.inverter >= 20 && r.inverter <= 30 ? 'LE-40003' : null);
const num = (n) => String(Math.round(n * 100) / 100).replace('.', ',');
const nb = (s) => String(s).replace(/ /g, ' ');

// ---------- Запитання ----------
const tile = (name, value, label, note, checked, ic, type = 'radio') =>
  `<label class="option-tile"><input type="${type}" name="${name}" value="${value}" ${checked ? 'checked' : ''}>${ic ? `<svg class="icon option-tile__icon" aria-hidden="true"><use href="#${ic}"/></svg>` : ''}${esc(label)}${note ? `<small>${note}</small>` : ''}</label>`;

const RENDER = {
  object: () => `<div class="quiz__q"><h1>Який у вас об'єкт?</h1><p>Від цього залежить тип системи, монтаж і спосіб оплати.</p></div>
    <div class="quiz__options">${OBJECTS.map(([id, name, ic]) => tile('object', id, name, '', a.object === id, ic)).join('')}</div>`,
  loads: () => {
    if (!a.loads) a.loads = loadsList().filter((l) => l[4]).map((l) => l[0]);
    return `<div class="quiz__q"><h1>Що має працювати під час відключень?</h1><p>Позначте все, без чого не обійтися. Потужність порахуємо самі — кіловати знати не потрібно.</p></div>
    <div class="quiz__options quiz__options--loads">${loadsList().map(([id, name, w]) => tile('loads', id, name, `<b>${w >= 1000 ? num(w / 1000) + ' кВт' : w + ' Вт'}</b>`, a.loads.includes(id), null, 'checkbox')).join('')}</div>`;
  },
  hours: () => `<div class="quiz__q"><h1>Скільки годин система має працювати без мережі?</h1><p>Чим довше — тим більший акумулятор. За графіків 4 через 4 зазвичай вистачає 8 годин.</p></div>
    <div class="quiz__options">${HOURS.map(([h, name, note]) => tile('hours', h, name, note, Number(a.hours) === h)).join('')}</div>`,
  solar: () => `<div class="quiz__q"><h1>Чи потрібні сонячні панелі?</h1><p>Панелі заряджають акумулятор удень і зменшують рахунок. Резерв працює і без них.</p></div>
    <div class="quiz__options" style="--cols:3">${SOLAR.map(([id, name, note, ic]) => tile('solar', id, name, note, a.solar === id, ic)).join('')}</div>`,
  pay: () => {
    const credit = a.object === 'house' ? ['Державний кредит 0%', 'до 480 000 грн на строк до 10 років'] : isBiz() ? ['Кредит 5-7-9% або лізинг', 'кошторис і документи для банку'] : null;
    const opts = [['full', ...PAY.full], ['parts', ...PAY.parts], ...(credit ? [['credit', ...credit]] : []), ['unknown', ...PAY.unknown]];
    if (!opts.some(([id]) => id === a.pay)) a.pay = 'unknown';
    return `<div class="quiz__q"><h1>Як зручніше платити?</h1><p>Покажемо платіж на місяць саме для вашого способу. Рішення можна змінити пізніше.</p></div>
    <div class="quiz__options" style="--cols:${opts.length}">${opts.map(([id, name, note]) => tile('pay', id, name, note, a.pay === id)).join('')}</div>`;
  },
};

function renderStep() {
  const list = steps();
  state.step = Math.min(state.step, list.length - 1);
  const key = list[state.step];
  $('#quiz-step').innerHTML = RENDER[key]();
  $('#quiz-count').textContent = `Крок ${state.step + 1} / ${list.length}`;
  const pct = Math.round(((state.step + 1) / list.length) * 100);
  $('#quiz-bar').style.width = `${pct}%`;
  $('#quiz-progress').setAttribute('aria-valuenow', pct);
  $('#quiz-back').hidden = state.step === 0;
  $('#quiz-next').firstChild.textContent = state.step === list.length - 1 ? 'Показати результат ' : 'Далі ';
  renderHint();
}

function renderHint() {
  const hint = $('#quiz-hint');
  hint.classList.remove('is-error');
  const key = steps()[state.step];
  if (key === 'loads' && a.loads?.length) { const r = calc(a); hint.innerHTML = `Одночасне навантаження ≈ <b>${num(r.peak)} кВт</b>`; }
  else if (key === 'hours' && a.loads?.length) { const r = calc(a); hint.innerHTML = r.custom ? '' : `Потрібен акумулятор ≈ <b>${num(r.battery)} кВт·год</b>`; }
  else hint.textContent = '';
}

// читаємо відповідь поточного кроку; false — якщо нічого не вибрано
function readStep() {
  const key = steps()[state.step];
  const data = new FormData($('#quiz-form'));
  if (key === 'loads') { a.loads = data.getAll('loads'); if (!a.loads.length) return false; }
  else {
    const v = data.get(key);
    if (!v) return false;
    if (key === 'object' && v !== a.object) a.loads = null; // інший об'єкт — інший список приладів
    a[key] = key === 'hours' ? Number(v) : v;
  }
  save();
  return true;
}

function next() {
  if (!readStep()) { const h = $('#quiz-hint'); h.textContent = 'Оберіть хоча б один варіант'; h.classList.add('is-error'); return; }
  if (state.step < steps().length - 1) { state.step += 1; renderStep(); window.scrollTo({ top: 0 }); } else showResult();
}

// ---------- Результат ----------
function packHtml(r, tag, name, rec) {
  if (r.custom) return '';
  const solarLine = r.panels ? `Панелі 580 Вт × ${r.panels} шт` : a.solar === 'later' && a.object !== 'apartment' ? 'Входи для панелей — на майбутнє' : 'Без сонячних панелей';
  const monthly = a.pay === 'credit' && a.object === 'house' ? `кредит 0% на 10 років · ${nb(`≈ ${money(Math.min(r.price, 480000) / 120)} грн/міс`)}`
    : a.pay === 'credit' ? 'кредит 5-7-9% · кошторис для банку за 24 години'
    : a.pay === 'full' ? 'оплата одразу · карткою або за рахунком'
    : `частинами · ${nb(`від ${money(r.price / MONTHS)} грн/міс`)} без переплат`;
  const kit = rec ? kitFor(r) : null;
  const powers = r.picked.slice(0, 6).map((l) => `<li>${icon('i-tick')}<span>${esc(l[1])}</span></li>`).join('') + (r.picked.length > 6 ? `<li class="is-off">${icon('i-tick')}<span>і ще ${r.picked.length - 6}</span></li>` : '');
  return `<article class="sol-pack${rec ? ' sol-pack--rec' : ''}">
    <div class="sol-pack__head"><span class="sol-pack__tag">${tag}</span><h2 class="t-h3">${esc(name)}</h2></div>
    <div class="sol-pack__price"><span class="sol-pack__sum">≈ ${money(r.price)} <small>грн</small></span><span class="sol-pack__monthly">з монтажем · ${monthly}</span></div>
    <ul class="sol-pack__specs"><li>${r.phases === 3 ? 'Трифазний' : 'Гібридний'} інвертор ${r.inverter} кВт</li><li>Акумулятор LiFePO4 ${num(r.battery)} кВт·год</li><li>${solarLine}</li></ul>
    <div class="sol-pack__auto"><span class="t-label c-tertiary">Автономність</span><strong>${r.hours >= 24 ? 'доба й більше' : `≈ ${r.hours} год`}</strong></div>
    <ul class="sol-pack__powers">${powers}</ul>
    <div class="sol-pack__actions">
      <a href="#quiz-lead" class="btn ${rec ? 'btn--primary' : 'btn--secondary'} btn--lg btn--block" data-pick="${esc(name)}">Хочу цей варіант ${icon('i-arrow')}</a>
      ${kit ? `<a href="product.html?id=${kit}" class="btn btn--ghost btn--block">Схожий готовий комплект у каталозі</a>` : ''}
    </div>
  </article>`;
}

function showResult() {
  const base = calc(a);
  const objName = OBJECTS.find(([id]) => id === a.object)[1].toLowerCase();
  $('#quiz-questions').hidden = true;
  $('#quiz-result').hidden = false;
  $('#quiz-lead').hidden = false;
  $('#res-answers').innerHTML = [OBJECTS.find(([id]) => id === a.object)[1], `${base.picked.length} ${plural(base.picked.length, 'прилад', 'прилади', 'приладів')} · ≈ ${num(base.peak)} кВт`, a.hours >= 24 ? 'доба без мережі' : `${a.hours} год без мережі`,
    ...(a.object === 'apartment' ? [] : [SOLAR.find(([id]) => id === a.solar)[1]]), (a.pay === 'credit' ? 'Кредит' : PAY[a.pay][0])].map((t) => `<li>${esc(t)}</li>`).join('');

  if (base.custom) {
    $('#res-title').innerHTML = 'Тут потрібен <span class="t-dim">індивідуальний розрахунок</span>';
    $('#res-packages').innerHTML = '';
    $('#res-note').textContent = `Одночасне навантаження ≈ ${num(base.peak)} кВт — це більше, ніж закривають типові рішення. Залиште телефон: інженер підготує кошторис і розрахунок окупності протягом 24 годин.`;
  } else {
    const lessHours = Math.max(4, Math.round(a.hours / 2));
    const economy = calc({ ...a, hours: lessHours, solar: 'no' });
    const reserve = calc({ ...a, hours: Math.min(36, Math.round(a.hours * 1.5)), loads: a.loads, solar: a.object === 'apartment' ? 'no' : 'yes' });
    const biggerIdx = INVERTERS.indexOf(reserve.inverter);
    if (reserve.inverter === base.inverter && INVERTERS[biggerIdx + 1]) { reserve.inverter = INVERTERS[biggerIdx + 1]; reserve.price += Math.round((INVERTERS[biggerIdx + 1] - base.inverter) * 6200 * 1.3 / 1000) * 1000; reserve.phases = reserve.inverter >= 12 ? 3 : 1; }
    const title = (r) => `${r.panels ? 'Гібридна станція' : 'Резерв'} ${nb(r.inverter + ' кВт')} + ${nb('АКБ ' + num(r.battery) + ' кВт·год')}`;
    $('#res-title').innerHTML = `Ваша система <span class="t-dim">для ${objName === 'осбб' ? 'ОСББ' : objName === 'бізнес' ? 'бізнесу' : objName === 'квартира' ? 'квартири' : 'будинку'}</span>`;
    const same = economy.price === base.price;
    $('#res-packages').innerHTML = (same ? '' : packHtml(economy, 'Економніше', title(economy), false)) + packHtml(base, 'Рекомендуємо · за вашими відповідями', title(base), true) + packHtml(reserve, 'Із запасом', title(reserve), false);
    $('#res-note').textContent = 'Розрахунок орієнтовний: ціни приблизні, з монтажем і комплектуючими. Остаточну суму назве інженер після перевірки щитка, пускових струмів і місця під обладнання.';
  }
  window.scrollTo({ top: 0 });
}

// ---------- Події ----------
$('#quiz-form').addEventListener('submit', (e) => { e.preventDefault(); next(); });
$('#quiz-back').addEventListener('click', () => { readStep(); state.step = Math.max(0, state.step - 1); renderStep(); });
$('#quiz-form').addEventListener('change', () => { readStep(); renderHint(); });
// Вибір мишею чи дотиком у запитанні з одним варіантом одразу веде далі; з клавіатури — лише вибирає (далі — Enter)
let viaPointer = false;
$('#quiz-step').addEventListener('pointerdown', () => { viaPointer = true; });
$('#quiz-step').addEventListener('keydown', () => { viaPointer = false; });
$('#quiz-step').addEventListener('change', (e) => { if (e.target.type === 'radio' && viaPointer) { viaPointer = false; setTimeout(next, 220); } });
$('#res-edit').addEventListener('click', () => { $('#quiz-result').hidden = true; $('#quiz-lead').hidden = true; $('#quiz-questions').hidden = false; state.step = 0; renderStep(); window.scrollTo({ top: 0 }); });

let picked = null;
document.addEventListener('click', (e) => { const b = e.target.closest('[data-pick]'); if (b) picked = b.dataset.pick; });
$('#lead-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const tel = e.target.elements.tel;
  const ok = tel.value.replace(/\D/g, '').length >= 10;
  tel.closest('.field').classList.toggle('is-error', !ok);
  if (!ok) return tel.focus();
  // Демо: тут буде відправка заявки разом із відповідями квізу (об'єкт, прилади, години, панелі, оплата, обраний варіант)
  e.target.innerHTML = `<div class="alert alert--success">${icon('i-tick')}<div><strong>Дякуємо! Заявку з вашим підбором надіслано</strong><span class="t-body-sm c-secondary">${picked ? `Варіант: ${esc(picked)}. ` : ''}Інженер зв'яжеться протягом 2 годин у робочий час.</span></div></div><a href="catalog.html" class="link-arrow">Поки що — в каталог ${icon('i-arrow')}</a>`;
});

renderStep();
