// Lucky Energy · список кейсів: фільтри за типом об'єкта, областю та потужністю. Дані — data/cases.json (демо).

import { $, $$, esc, plural } from './shared.js';

const { cases } = await fetch('data/cases.json').then((r) => r.json());
const TYPES = [['all', 'Усі'], ['apartment', 'Квартира'], ['house', 'Будинок'], ['business', 'Бізнес'], ['osbb', 'ОСББ']];
const TYPE_BADGE = { apartment: 'Квартира', house: 'Будинок', business: 'Бізнес', osbb: 'ОСББ' };
const state = { type: new URLSearchParams(location.search).get('type') || 'all', region: '', power: '' };
if (!TYPES.some(([t]) => t === state.type)) state.type = 'all';

// найновіші зверху
const sorted = [...cases].sort((a, b) => (b.sortDate || '').localeCompare(a.sortDate || ''));
const inPower = (kw) => { if (!state.power) return true; const [lo, hi] = state.power.split('-').map((x) => (x === '' ? null : Number(x))); return kw >= lo && (hi == null || kw < hi); };
const matches = (c, skip) => (skip === 'type' || state.type === 'all' || c.type === state.type) && (skip === 'region' || !state.region || c.region === state.region) && (skip === 'power' || inPower(c.powerKw || 0));

const card = (c) => `<a href="case.html?id=${c.id}" class="sol-case" data-id="${c.id}" style="text-decoration:none">
  <span class="sol-case__media"><span class="badge badge--solid sol-case__type">${TYPE_BADGE[c.type] || ''}</span><img src="${c.cover}" alt="${esc(c.coverAlt || '')}" width="1600" height="900" loading="lazy"></span>
  <span class="t-body-sm c-secondary">${esc(c.place)} · ${esc(c.date)}</span>
  <strong class="t-h3">${esc(c.title)}</strong>
  <dl class="sol-case__metrics">${c.metrics.slice(0, 3).map(([v, l]) => `<div><dd>${esc(v)}</dd><dt>${esc(l)}</dt></div>`).join('')}</dl>
</a>`;

// Область — з даних
const regions = [...new Set(cases.map((c) => c.region).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'uk'));
$('#cases-region').insertAdjacentHTML('beforeend', regions.map((r) => `<option value="${esc(r)}">${esc(r)}</option>`).join(''));

function renderTypes() {
  $('#cases-types').innerHTML = TYPES.map(([t, name]) => { const n = sorted.filter((c) => (t === 'all' || c.type === t) && matches(c, 'type')).length; return `<button type="button" class="chip" data-type="${t}" aria-pressed="${state.type === t}" ${n === 0 && t !== 'all' ? 'disabled' : ''}>${name} <b>${n}</b></button>`; }).join('');
}
function render() {
  renderTypes();
  const list = sorted.filter((c) => matches(c));
  $('#cases-grid').innerHTML = list.map(card).join('');
  $('#cases-empty').hidden = list.length > 0;
  $('#cases-count').textContent = list.length ? `${list.length} ${plural(list.length, 'об\'єкт', 'об\'єкти', 'об\'єктів')}${state.type === 'all' && !state.region && !state.power ? ' · від нових до давніших' : ' за вашими умовами'}` : '';
  const url = new URL(location.href); if (state.type === 'all') url.searchParams.delete('type'); else url.searchParams.set('type', state.type); history.replaceState(null, '', url);
}

$('#cases-types').addEventListener('click', (e) => { const b = e.target.closest('[data-type]'); if (!b) return; state.type = b.dataset.type; render(); });
$('#cases-region').addEventListener('change', (e) => { state.region = e.target.value; render(); });
$('#cases-power').addEventListener('change', (e) => { state.power = e.target.value; render(); });
$('#cases-reset').addEventListener('click', () => { state.type = 'all'; state.region = ''; state.power = ''; $('#cases-region').value = ''; $('#cases-power').value = ''; render(); });
render();
$$('[data-reveal]:not(.is-in)').forEach((el) => requestAnimationFrame(() => el.classList.add('is-in')));
