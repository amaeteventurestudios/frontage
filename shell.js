/* Frontage shell. Two modes, like Cutaways:
   - the home page (body.home-page): a hero and all thirty sites by group;
   - a site page (body[data-slug]): the numbered left list beside the site, full page, in an iframe of sites/<slug>/. */
import { GROUPS, KINDS, SITES } from './catalog.js';

const $ = id => document.getElementById(id);
const esc = t => String(t ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const pad = n => String(n).padStart(2, '0');
const groupOf = Object.fromEntries(GROUPS.map(g => [g.id, g]));
const store = {
  get(k) { try { return localStorage.getItem('frontage.' + k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem('frontage.' + k, v); } catch { /* private window */ } },
};

/* theme, both modes */
const root = document.documentElement;
const savedTheme = store.get('theme');
if (savedTheme) root.dataset.theme = savedTheme;
$('btnTheme')?.addEventListener('click', () => {
  const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  root.dataset.theme = dark ? 'light' : 'dark';
  store.set('theme', root.dataset.theme);
});

const slug = document.body.dataset.slug;
if (slug) sitePage(SITES.find(s => s.slug === slug));
else homePage();

/* ---------- home ---------- */
function homePage() {
  const base = '';
  const first = SITES.find(s => s.live) || SITES[0];
  $('start').href = base + first.slug + '/';
  $('start').textContent = `Open ${first.name}`;
  $('all').innerHTML = GROUPS.map(g => {
    const items = SITES.filter(s => s.group === g.id);
    return `<section class="g"><div class="g-head"><h2>${esc(g.name)}</h2><span>${esc(KINDS[g.kind])}, ${items.filter(s => s.live).length} of ${items.length} live</span></div>
      <ol class="cards">${items.map(s => `<li><a class="card${s.live ? '' : ' soon'}" href="${base}${s.slug}/">
        <span class="n">${pad(s.n)}</span><span class="name">${esc(s.name)}</span><span class="what">${esc(s.what)}</span>
        <span class="meta">${s.live ? esc(s.theme) : 'Planned'}</span></a></li>`).join('')}</ol></section>`;
  }).join('');
  /* the hero wall: the thirty numbers, live ones lit */
  $('wall').innerHTML = SITES.map(s => `<span class="${s.live ? 'lit' : ''}">${pad(s.n)}</span>`).join('');
}

/* ---------- a site page ---------- */
function sitePage(s) {
  const pane = $('pane'), list = $('list'), stage = $('stage'), q = $('q');
  const picks = $('picks'), scrim = $('scrim');
  const g = groupOf[s.group];
  $('title').innerHTML = `<b>${esc(s.name)}</b><span>${esc(s.what)}</span>`;

  function renderList() {
    const term = q.value.trim().toLowerCase();
    const match = x => !term || [x.name, x.what, x.theme, x.shape, groupOf[x.group].name].join(' ').toLowerCase().includes(term);
    const html = GROUPS.map(gr => {
      const all = SITES.filter(x => x.group === gr.id), items = all.filter(match);
      if (!items.length) return '';
      return `<section class="group"><h2><span>${esc(gr.name)}</span><span class="count">${all.filter(x => x.live).length}/${all.length}</span></h2><ol>${items.map(x =>
        `<li><a class="item${x.live ? '' : ' soon'}" href="../${x.slug}/"${x.slug === s.slug ? ' aria-current="page"' : ''}>
          <span class="n">${pad(x.n)}</span><span class="name">${esc(x.name)}</span><span class="tag">${x.live ? esc(x.theme) : 'soon'}</span></a></li>`).join('')}</ol></section>`;
    }).join('');
    list.innerHTML = html || '<p class="empty">No site matches that search.</p>';
  }
  q.addEventListener('input', renderList);
  renderList();
  list.querySelector('[aria-current]')?.scrollIntoView({ block: 'center' });

  if (s.live) {
    stage.innerHTML = `<iframe src="../sites/${s.slug}/" title="${esc(s.name)}"></iframe>`;
  } else {
    stage.classList.add('planned');
    stage.innerHTML = `<article class="soon-card">
      <p class="kicker">${esc(KINDS[g.kind])}, ${esc(g.name.toLowerCase())}, number ${s.n}</p>
      <h1>${esc(s.name)}</h1>
      <p>${esc(s.what)}. Coming in a later wave.</p>
      <dl><dt>Theme</dt><dd>${esc(s.theme)}</dd><dt>Shape</dt><dd>${esc(s.shape)}</dd><dt>Signature</dt><dd>${esc(s.signature)}</dd></dl>
    </article>`;
  }

  const p = s.picks || {};
  const rows = [
    ['Made with', p.made], ['Theme', p.theme || s.theme], ['Shape', p.shape || s.shape], ['Signature', p.signature || s.signature],
    ['Genre', p.genre], ['Hero', p.hero], ['Sections', p.sections], ['Material', p.material],
    ['Sweep', p.sweep || (s.live ? null : 'Runs after the build')],
  ].filter(([, v]) => v);
  $('picksBody').innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('');

  const narrow = matchMedia('(max-width: 900px)');
  function setPicks(open) {
    picks.hidden = !open; scrim.hidden = !open && !pane.classList.contains('open');
    $('btnPicks').setAttribute('aria-expanded', open);
    if (open) $('picksClose').focus();
  }
  function setPane(open) {
    pane.classList.toggle('open', open);
    $('paneOpen').setAttribute('aria-expanded', open);
    scrim.hidden = !open && picks.hidden;
  }
  $('btnPicks').addEventListener('click', () => setPicks(picks.hidden));
  $('picksClose').addEventListener('click', () => setPicks(false));
  $('paneOpen').addEventListener('click', () => {
    if (narrow.matches) setPane(!pane.classList.contains('open'));
    else { const shut = document.body.classList.toggle('pane-shut'); store.set('paneShut', shut ? '1' : ''); }
  });
  $('paneClose').addEventListener('click', () => setPane(false));
  scrim.addEventListener('click', () => { setPicks(false); setPane(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape') { setPicks(false); setPane(false); } });
  if (store.get('paneShut') === '1') document.body.classList.add('pane-shut');
}
