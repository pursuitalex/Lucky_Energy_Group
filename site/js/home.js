// Lucky Energy · головна: схема потоків енергії

// Схема енергії: три режими. Значення ілюстративні (будинок зі станцією 10 кВт).
// Стан лінії: active | reverse (потік у зворотний бік) | idle | off (мережі немає)
const MODES = {
  day: {
    text: 'Вдень панелі живлять будинок, заряджають акумулятор і автомобіль. З мережі майже нічого не беремо.',
    lines: { solar: 'active', grid: 'idle', battery: 'active', home: 'active', ev: 'active' },
    nodes: { solar: '7.2 кВт', inverter: 'Працює від сонця', home: '2.1 кВт', grid: '0 кВт', battery: '82% · заряджається', ev: '3.6 кВт' },
  },
  night: {
    text: 'Уночі будинок працює від накопиченої за день енергії. Мережа лише підстраховує.',
    lines: { solar: 'idle', grid: 'idle', battery: 'reverse', home: 'active', ev: 'idle' },
    nodes: { solar: '0 кВт', inverter: 'Працює від АКБ', home: '1.4 кВт', grid: '0 кВт', battery: '64% · ще 9 год', ev: 'Не заряджається' },
  },
  outage: {
    text: 'Світло зникло — інвертор перемикається на акумулятор за мілісекунди. Котел, холодильник і роутер цього навіть не помічають.',
    lines: { solar: 'idle', grid: 'off', battery: 'reverse', home: 'active', ev: 'idle' },
    nodes: { solar: '0 кВт', inverter: 'Резервний режим', home: '1.1 кВт', grid: 'Відключення', battery: '58% · ще 11 год', ev: 'Пауза' },
  },
};
const LINE_COLORS = { solar: 'var(--color-energy-solar)', grid: 'var(--color-energy-grid)', battery: 'var(--color-energy-battery)', home: 'var(--color-accent)', ev: 'var(--color-energy-ev)' };

const flow = document.getElementById('flow');
if (flow) {
  const text = document.getElementById('flow-text');
  const setMode = (key) => {
    const mode = MODES[key];
    if (!mode) return;
    text.textContent = mode.text;
    flow.querySelectorAll('[data-line]').forEach((line) => {
      const state = mode.lines[line.dataset.line];
      line.style.setProperty('--flow-color', LINE_COLORS[line.dataset.line]);
      line.classList.toggle('flow-line--idle', state === 'idle');
      line.classList.toggle('flow-line--reverse', state === 'reverse');
      line.classList.toggle('flow-line--off', state === 'off');
    });
    flow.querySelectorAll('[data-node]').forEach((node) => {
      const name = node.dataset.node;
      node.querySelector('.energy-node__value').textContent = mode.nodes[name];
      node.classList.toggle('is-off', mode.lines[name] === 'off');
      node.classList.toggle('is-idle', mode.lines[name] === 'idle');
    });
  };
  document.querySelectorAll('[data-flow]').forEach((tab) => tab.addEventListener('click', () => setMode(tab.dataset.flow)));
  setMode('day');
}

// Калькулятор платежу: рівні частини без переплати (кредит 0% на перший рік / оплата частинами) — орієнтир, не оферта
const calc = document.getElementById('pay-calc');
if (calc) {
  const amount = document.getElementById('pay-amount');
  const fmt = (n) => Math.round(n).toLocaleString('uk-UA').replace(/\u00a0/g, ' ');
  const recalc = () => {
    const sum = Number(amount.value);
    const term = Number(calc.querySelector('[name="pay-term"]:checked').value);
    document.getElementById('pay-amount-out').textContent = fmt(sum) + ' грн';
    document.getElementById('pay-sum').textContent = fmt(sum / term) + ' грн';
    document.getElementById('pay-note').textContent = term <= 24 ? 'без переплати · орієнтовно' : 'кредит 0% на перший рік · орієнтовно';
    amount.style.setProperty('--range-fill', ((sum - amount.min) / (amount.max - amount.min)) * 100 + '%');
  };
  calc.addEventListener('input', recalc);
  recalc();
}

// Перемикач варіантів блоку «Фінансування» (тимчасовий інструмент вибору концепту)
const finance = document.getElementById('finance');
const financeBtns = document.querySelectorAll('[data-finance]');
const setFinance = (v) => {
  if (!finance || !['b', 'c'].includes(v)) v = 'c'; // основний варіант — темний із зеленою карткою
  if (!finance || finance.hasAttribute('data-variant-fixed')) return; // у світлому концепті варіант один
  finance.dataset.variant = v;
  financeBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.finance === v)));
  try { localStorage.setItem('le-finance-v2', v); } catch {}
};
financeBtns.forEach((b) => b.addEventListener('click', () => setFinance(b.dataset.finance)));
try { setFinance(localStorage.getItem('le-finance-v2') || 'c'); } catch { setFinance('c'); } // ключ v2: старий збережений вибір не перебиває нове замовчування

// Перемикач оформлення форми заявки: світла (основна) / темна — теж тимчасовий інструмент вибору
const leadBlock = document.getElementById('lead-block');
const leadBtns = document.querySelectorAll('[data-lead]');
const setLead = (v) => {
  if (!leadBlock) return;
  if (!['light', 'dark'].includes(v)) v = 'light';
  leadBlock.dataset.variant = v;
  leadBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lead === v)));
  try { localStorage.setItem('le-lead', v); } catch {}
};
leadBtns.forEach((b) => b.addEventListener('click', () => setLead(b.dataset.lead)));
try { setLead(localStorage.getItem('le-lead') || 'light'); } catch { setLead('light'); }

// Блок квізу на головній — це перше запитання: вибір об'єкта переносить у квіз одразу на другий крок
const quizStart = document.getElementById('quiz-start');
if (quizStart) {
  const tiles = document.querySelectorAll('input[name="quiz-object"]');
  let viaPointer = false;
  tiles.forEach((t) => {
    t.closest('label').addEventListener('pointerdown', () => { viaPointer = true; });
    t.addEventListener('keydown', () => { viaPointer = false; });
    t.addEventListener('change', () => {
      quizStart.href = `quiz.html?object=${t.value}`;
      if (viaPointer) location.href = quizStart.href; // з клавіатури лише вибираємо, перехід — кнопкою
    });
  });
}
