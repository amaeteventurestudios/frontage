/* Harmattan Orbital · the page: opening, motion, the globe, the pass story, the station map, the 24-hour chart and the booking form. */
import { SAT, STATIONS, coverageKm, passes } from './orbit.js';
import { LANDS, landDots, smallCircle } from './geo.js';

const $ = id => document.getElementById(id);
const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fmtT = ms => new Date(ms).toISOString().slice(11, 16);
const fmtTs = ms => new Date(ms).toISOString().slice(11, 19);
const fmtDay = ms => new Date(ms).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });

/* ---------- figures computed from the orbit ---------- */
const cov = coverageKm();
$('covKm').textContent = `${Math.round(cov.km).toLocaleString('en-GB')} km`;
$('period').textContent = `${(SAT.period / 60).toFixed(1)} min`;
const base = Date.now();
const passList = Object.fromEntries(STATIONS.map(s => [s.id, passes(s, base, 24)]));
STATIONS.forEach(s => { const c = document.querySelector(`[data-count="${s.id}"]`); if (c) c.textContent = String(passList[s.id].length); });

/* ---------- motion: split words, rise on entry, masthead, parallax, magnetic buttons ---------- */
function split(el) {
  const words = el.textContent.trim().split(/\s+/);
  el.setAttribute('aria-label', el.textContent.trim());
  el.innerHTML = words.map((w, i) => `<span class="w" aria-hidden="true"><span style="--i:${i}">${w}</span></span>`).join(' ');
}
document.querySelectorAll('.split, .split-foot').forEach(split);

const seen = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); seen.unobserve(e.target); } }), { rootMargin: '0px 0px -12% 0px' });
document.querySelectorAll('.rise:not(.hero .rise), .st-map, .timeline, .foot').forEach(el => seen.observe(el));

/* the opening plays once, then the hero comes in */
const go = () => { root.classList.add('go'); document.querySelectorAll('.hero .rise, .hero .split').forEach(el => el.classList.add('in')); };
if (reduce) { go(); } else { setTimeout(go, 60); }

const mast = $('mast'); let lastY = scrollY;
function onScroll() {
  const y = scrollY;
  mast.classList.toggle('solid', y > innerHeight * 0.6);
  mast.classList.toggle('tuck', y > lastY && y > innerHeight && !mast.matches(':focus-within'));
  lastY = y;
  document.querySelectorAll('.drift').forEach(img => {
    const r = img.parentElement.getBoundingClientRect();
    img.style.setProperty('--p', reduce ? 0 : ((r.top + r.height / 2) / innerHeight - 0.5).toFixed(3));
  });
  passScroll();
}
addEventListener('scroll', onScroll, { passive: true });

if (!reduce && matchMedia('(hover: hover)').matches) {
  document.querySelectorAll('.mag').forEach(b => {
    b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5; b.style.transform = `translate(${x * 8}px, ${y * 6}px)`; b.firstElementChild.style.transform = `translate(${x * 6}px, ${y * 4}px)`; });
    b.addEventListener('pointerleave', () => { b.style.transform = ''; b.firstElementChild.style.transform = ''; });
  });
}

/* ---------- the hero globe ---------- */
const scrub = $('scrub'), clock = $('clock'), readout = $('readout');
let globe = null;
import('./globe.js').then(({ createGlobe }) => {
  globe = createGlobe($('globe'), $('labels'), {
    reduce,
    onRead({ t, where, seen }) {
      readout.textContent = seen.length ? `Sample satellite over ${where}, ${fmtT(t)} UTC. In view of ${seen.join(' and ')} elevation.` : `Sample satellite over ${where}, ${fmtT(t)} UTC. No station hears it right now.`;
    },
  });
}).catch(() => { readout.textContent = 'The globe needs WebGL, which this browser has turned off.'; });
scrub.addEventListener('input', () => {
  const m = +scrub.value;
  clock.textContent = m === 0 ? 'now' : `+${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}`;
  scrub.setAttribute('aria-valuetext', `${clock.textContent}, ${fmtT(base + m * 60000)} UTC`);
  globe?.setOffset(m);
});

/* ---------- the pass, told by scroll ---------- */
const passSec = $('pass'), chapters = [...$('chapters').children], fill = $('passFill');
let passView = null;
import('./pass.js').then(({ createPass }) => {
  passView = createPass($('passScene'), {
    reduce,
    onRead({ t, az, el, range }) {
      $('dTime').textContent = fmtTs(t); $('dEl').textContent = `${el.toFixed(1)}°`; $('dAz').textContent = `${az.toFixed(1)}°`; $('dRange').textContent = `${Math.round(range).toLocaleString('en-GB')} km`;
    },
  });
  $('pass-h').textContent = `One pass over Kano, ${fmtDay(passView.pass.aos)}`;
  passScroll();
}).catch(() => {});
function passScroll() {
  const r = passSec.getBoundingClientRect();
  const p = Math.max(0, Math.min(1, -r.top / (r.height - innerHeight)));
  fill.style.setProperty('--p', p.toFixed(4));
  const ch = p < 0.22 ? 0 : p < 0.5 ? 1 : p < 0.82 ? 2 : 3;
  chapters.forEach((li, i) => li.classList.toggle('on', i === ch));
  passView?.set(p);
}

/* ---------- the station map: dots for land, rings for coverage ---------- */
const map = $('map'), NS = 'http://www.w3.org/2000/svg';
const W = 600, H = 640, LON0 = -20, LON1 = 56, LAT0 = 38, LAT1 = -38;
const prj = (lat, lon) => [((lon - LON0) / (LON1 - LON0)) * W, ((LAT0 - lat) / (LAT0 - LAT1)) * H];
const mk = (tag, attrs, parent = map) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent.appendChild(e); return e; };
const dotG = mk('g', {});
landDots(1.25, LANDS).forEach(([lon, lat]) => { const [x, y] = prj(lat, lon); if (x >= 0 && x <= W && y >= 0 && y <= H) mk('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: 2.1, class: 'dot' }, dotG); });
const rings = {};
STATIONS.forEach(s => {
  const d = smallCircle(s.lat, s.lon, cov.deg, 96).map(([la, lo], i) => { const [x, y] = prj(la, lo); return `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`; }).join('') + 'Z';
  const ring = mk('path', { d, class: 'ring' });
  const len = ring.getTotalLength(); ring.style.setProperty('--len', len.toFixed(0));
  const [x, y] = prj(s.lat, s.lon);
  mk('circle', { cx: x, cy: y, r: 6, class: 'pulse' }); mk('circle', { cx: x, cy: y, r: 4, class: 'beacon' });
  const lbl = mk('text', { x: x + 10, y: y + 5, class: 'lbl' }); lbl.textContent = s.name;
  rings[s.id] = ring;
});
document.querySelectorAll('#stList li').forEach(li => {
  const on = v => { rings[li.dataset.st].classList.toggle('hot', v); li.classList.toggle('hot', v); };
  li.addEventListener('pointerenter', () => on(true)); li.addEventListener('pointerleave', () => on(false));
});

/* ---------- the 24-hour chart ---------- */
const tl = $('timeline'), DAY = 24 * 3600000;
const fPass = $('fPass'), fStation = $('fStation');
let n = 0;
STATIONS.forEach(s => {
  const lane = document.createElement('div'); lane.className = 'lane';
  lane.innerHTML = `<p class="lane-name">${s.name}</p><div class="track" role="group" aria-label="${s.name} passes"></div>`;
  const track = lane.querySelector('.track');
  passList[s.id].forEach(p => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'pbar'; b.setAttribute('aria-pressed', 'false');
    b.style.cssText = `--x:${((p.aos - base) / DAY * 100).toFixed(3)}%;--w:${(p.dur * 1000 / DAY * 100).toFixed(3)}%;--h:${(22 + 78 * Math.min(1, p.max / 90)).toFixed(1)}%;--i:${n++}`;
    const label = `${s.name}, rises ${fmtT(p.aos)} UTC ${fmtDay(p.aos)}, peaks at ${Math.round(p.max)}°, ${Math.round(p.dur / 60)} min above the mask`;
    b.setAttribute('aria-label', label);
    b.innerHTML = `<span class="tip">${fmtT(p.aos)} UTC, peaks ${Math.round(p.max)}°</span>`;
    b.addEventListener('click', () => {
      tl.querySelectorAll('.pbar[aria-pressed="true"]').forEach(x => x.setAttribute('aria-pressed', 'false'));
      b.setAttribute('aria-pressed', 'true');
      fStation.value = s.id; fPass.value = `${fmtDay(p.aos)}, ${fmtT(p.aos)} UTC`;
      fPass.classList.remove('flash'); void fPass.offsetWidth; fPass.classList.add('flash');
      $('book').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    });
    track.appendChild(b);
  });
  const now = document.createElement('span'); now.className = 'now'; now.setAttribute('aria-hidden', 'true'); track.appendChild(now);
  tl.appendChild(lane);
});
const axis = document.createElement('div'); axis.className = 'axis'; axis.setAttribute('aria-hidden', 'true');
for (let h = 0; h <= 24; h += 6) { const sp = document.createElement('span'); sp.style.left = `${(h / 24) * 100}%`; sp.textContent = h === 0 ? 'now' : `${fmtT(base + h * 3600000)}`; axis.appendChild(sp); }
tl.appendChild(axis);

/* ---------- booking: checks the fields, never claims to have sent ---------- */
const form = $('bookForm'), note = $('formNote');
form.addEventListener('submit', e => {
  e.preventDefault();
  let bad = null;
  form.querySelectorAll('input[required]').forEach(f => { const ok = f.checkValidity() && f.value.trim(); f.setAttribute('aria-invalid', ok ? 'false' : 'true'); if (!ok && !bad) bad = f; });
  if (bad) { bad.focus(); note.textContent = 'Fill in the highlighted fields. This showcase form still sends nothing.'; return; }
  if (!form.dataset.endpoint) note.textContent = 'All filled in. This showcase form has no endpoint, so nothing was sent.';
});

/* the footer's orbit line */
const fp = document.querySelector('.foot-orbit path'); if (fp) document.querySelector('.foot-orbit').style.setProperty('--len', fp.getTotalLength().toFixed(0));
onScroll();
