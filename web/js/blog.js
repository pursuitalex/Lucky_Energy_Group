// Lucky Energy · список статей: рубрики з лічильниками, пошук за назвою і лідом, головна стаття. Дані — data/posts.json (демо).

import { $, $$, esc, plural } from './shared.js';

const { posts } = await fetch('data/posts.json').then((r) => r.json());
const CATS = { choose: 'Як обрати', finance: 'Фінансування', compare: 'Порівняння', install: 'Монтаж і сервіс' };
const catId = (name) => Object.keys(CATS).find((k) => CATS[k] === name) || 'other';
const params = new URLSearchParams(location.search);
const state = { cat: CATS[params.get('cat')] ? params.get('cat') : 'all', q: '' };
const icon = (i) => `<svg class="icon" aria-hidden="true"><use href="#${i}"/></svg>`;

const sorted = [...posts].sort((a, b) => (b.sortDate || '').localeCompare(a.sortDate || ''));
const norm = (s) => s.toLowerCase().replace(/[’']/g, "'");
const hitsQ = (p) => !state.q || norm(p.title + ' ' + p.lead).includes(norm(state.q));
const matches = (p, skip) => (skip === 'cat' || state.cat === 'all' || catId(p.category) === state.cat) && hitsQ(p);
const mark = (t) => { if (!state.q) return esc(t); const re = new RegExp(state.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'); return esc(t).replace(re, (m) => `<mark class="blog-hit">${m}</mark>`); };

const card = (p) => `<a href="article.html?id=${p.id}" class="kb-post">
  <span class="kb-post__cover"><img src="${p.cover}" alt="" width="1600" height="1000" loading="lazy"><span class="arrow-btn">${icon('i-arrow')}</span></span>
  <span class="kb-meta">${esc(p.category)} · ${esc(p.date)} · ${p.minutes} хв</span>
  <strong class="t-h4">${mark(p.title)}</strong>
  <span class="kb-post__lead">${mark(p.lead)}</span>
</a>`;

function renderCats() {
  const all = [['all', 'Усі'], ...Object.entries(CATS)];
  $('#blog-cats').innerHTML = all.map(([id, name]) => { const n = sorted.filter((p) => (id === 'all' || catId(p.category) === id) && matches(p, 'cat')).length; return `<button type="button" class="chip" data-cat="${id}" aria-pressed="${state.cat === id}" ${n === 0 && id !== 'all' ? 'disabled' : ''}>${name} <b>${n}</b></button>`; }).join('');
}
function render() {
  renderCats();
  const list = sorted.filter((p) => matches(p));
  const feature = $('#blog-feature');
  // головна стаття — лише без фільтрів і пошуку, щоб список не стрибав
  const showFeature = state.cat === 'all' && !state.q && list.length > 0;
  feature.hidden = !showFeature;
  if (showFeature) {
    const f = list[0];
    feature.href = `article.html?id=${f.id}`;
    feature.innerHTML = `<span class="blog-feature__media"><img src="${f.cover}" alt="${esc(f.coverAlt || '')}" width="1600" height="1000"></span><span class="blog-feature__body"><span class="kb-meta">Нове · ${esc(f.category)} · ${esc(f.date)} · ${f.minutes} хв</span><h2>${esc(f.title)}</h2><p>${esc(f.lead)}</p><span class="link-arrow">Читати ${icon('i-arrow')}</span></span>`;
  }
  const rest = showFeature ? list.slice(1) : list;
  $('#blog-grid').innerHTML = rest.map(card).join('');
  $('#blog-empty').hidden = list.length > 0;
  $('#blog-count').textContent = list.length ? `${list.length} ${plural(list.length, 'стаття', 'статті', 'статей')}${state.q ? ` за запитом «${state.q}»` : state.cat !== 'all' ? ` у рубриці «${CATS[state.cat]}»` : ''}` : '';
  const url = new URL(location.href); if (state.cat === 'all') url.searchParams.delete('cat'); else url.searchParams.set('cat', state.cat); history.replaceState(null, '', url);
}

$('#blog-cats').addEventListener('click', (e) => { const b = e.target.closest('[data-cat]'); if (!b) return; state.cat = b.dataset.cat; render(); });
$('#blog-q').addEventListener('input', (e) => { state.q = e.target.value.trim(); render(); });
$('#blog-reset').addEventListener('click', () => { state.cat = 'all'; state.q = ''; $('#blog-q').value = ''; render(); });
render();
$$('[data-reveal]:not(.is-in)').forEach((el) => requestAnimationFrame(() => el.classList.add('is-in')));
