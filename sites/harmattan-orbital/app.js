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

/* ---------- motion: GSAP runs the opening, the entrances and every scroll-linked move ---------- */
const G = window.gsap;
const go = () => root.classList.add('go');           /* tells the globe to fly in */
if (G) {
  G.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin);
  G.defaults({ ease: 'expo.out', duration: 1.1 });
} else { go(); }
const mm = G?.matchMedia();
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
let passP = 0;
function passApply(p) {
  passP = p;
  fill.style.setProperty('--p', p.toFixed(4));
  const ch = p < 0.22 ? 0 : p < 0.5 ? 1 : p < 0.82 ? 2 : 3;
  chapters.forEach((li, i) => li.classList.toggle('on', i === ch));
  passView?.set(p);
}
function passScroll() {
  if (G) return passApply(passP);
  const r = passSec.getBoundingClientRect();
  passApply(Math.max(0, Math.min(1, -r.top / (r.height - innerHeight))));
}
if (!G) addEventListener('scroll', passScroll, { passive: true });

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


/* ---------- choreography ----------
   Entrances: ease-out, 0.8 to 1.2 s, staggered 60 to 90 ms. Hovers and presses stay in CSS at 120 to 220 ms.
   Exits are quicker than entrances. Reduced motion keeps every word on the page and drops the travel. */
const mast = $('mast');
if (!G) {
  passScroll();
} else {
  /* the masthead firms up past the hero, tucks away going down and comes back going up */
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate(self) {
      const y = self.scroll();
      mast.classList.toggle('solid', y > innerHeight * 0.6);
      mast.classList.toggle('tuck', self.direction === 1 && y > innerHeight && !mast.matches(':focus-within'));
    },
  });

  /* the pass: scroll drives one number, smoothed so the dish never jerks */
  const pass = { p: 0 };
  G.to(pass, { p: 1, ease: 'none', onUpdate: () => passApply(pass.p), scrollTrigger: { trigger: passSec, start: 'top top', end: 'bottom bottom', scrub: 0.9 } });

  mm.add({ motion: '(prefers-reduced-motion: no-preference)', still: '(prefers-reduced-motion: reduce)' }, ({ conditions }) => {
    if (conditions.still) { $('intro')?.remove(); go(); return; }

    /* opening: the orbit draws, the name types up, the curtain lifts onto the globe */
    const h1 = SplitText.create('#hero-h', { type: 'words,chars', mask: 'words', aria: 'auto' });
    const introWord = SplitText.create('.intro-word', { type: 'chars', mask: 'chars' });
    const tl = G.timeline();
    tl.from('.intro-orbit ellipse', { drawSVG: '0%', duration: 1.3, ease: 'power2.inOut' })
      .from(introWord.chars, { yPercent: 110, stagger: 0.025, duration: 0.8 }, 0.25)
      .to('#intro', { autoAlpha: 0, scale: 1.05, duration: 0.6, ease: 'power2.in' }, 1.45)
      .add(go, 1.5)
      .from(h1.chars, { yPercent: 115, rotate: 8, transformOrigin: '0% 100%', stagger: 0.022, duration: 1.2 }, 1.7)
      .from('.hero .lead', { y: 24, autoAlpha: 0, duration: 0.9 }, 2.15)
      .from('.hero .actions .btn', { y: 24, autoAlpha: 0, stagger: 0.08, duration: 0.9 }, 2.25)
      .from('.hero-foot > *', { y: 16, autoAlpha: 0, stagger: 0.1, duration: 0.8 }, 2.45)
      .from('.mast-in > *', { y: -16, autoAlpha: 0, stagger: 0.08, duration: 0.8 }, 2.2)
      .add(() => $('intro')?.remove());

    /* the hero text lifts away as the globe gives way to the pass */
    G.to('.hero-text', { yPercent: -18, autoAlpha: 0.15, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

    /* pass title: letters rise as the section pins */
    const passTitle = SplitText.create('#pass-h', { type: 'words', mask: 'words', aria: 'auto' });
    G.from(passTitle.words, { yPercent: 110, stagger: 0.06, scrollTrigger: { trigger: passSec, start: 'top 70%' } });
    G.from('.dials > div', { y: 30, autoAlpha: 0, stagger: 0.08, scrollTrigger: { trigger: passSec, start: 'top 40%' } });

    /* photographs drift slower than the page */
    G.utils.toArray('.drift').forEach((img) => G.fromTo(img, { yPercent: -7, scale: 1.12 }, { yPercent: 7, scale: 1.04, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }));
    const band = SplitText.create('.band-line', { type: 'words', mask: 'words' });
    G.from(band.words, { yPercent: 110, stagger: 0.05, duration: 1.2, scrollTrigger: { trigger: '.band-line', start: 'top 85%' } });

    /* section heads: the words come up out of their own line, then the sentence */
    ['#st-h', '#sc-h', '#bk-h'].forEach((sel) => {
      const s = SplitText.create(sel, { type: 'words', mask: 'words', aria: 'auto' });
      const head = document.querySelector(sel).parentElement;
      G.timeline({ scrollTrigger: { trigger: head, start: 'top 80%' } })
        .from(s.words, { yPercent: 110, stagger: 0.07 })
        .from(head.querySelector('.lead'), { y: 24, autoAlpha: 0, duration: 0.9 }, 0.2);
    });

    /* the coverage figure counts up to the computed radius */
    const km = { v: 0 }, kmEl = $('covKm');
    G.to(km, { v: Math.round(cov.km), duration: 1.6, ease: 'power3.out', snap: { v: 1 }, onUpdate: () => { kmEl.textContent = `${km.v.toLocaleString('en-GB')} km`; }, scrollTrigger: { trigger: kmEl, start: 'top 85%' } });

    /* the map: land fades in from the coast, rings draw, beacons land */
    G.timeline({ scrollTrigger: { trigger: '.st-map', start: 'top 75%' } })
      .from('#map .dot', { autoAlpha: 0, scale: 0, transformOrigin: '50% 50%', duration: 0.6, stagger: { amount: 1.1, from: 'random' } })
      .from('#map .ring', { drawSVG: '0%', duration: 1.6, stagger: 0.2, ease: 'power2.inOut' }, 0.4)
      .from('#map .beacon', { scale: 0, transformOrigin: '50% 50%', stagger: 0.2, duration: 0.7, ease: 'back.out(3)' }, 0.9)
      .from('#map .lbl', { autoAlpha: 0, x: -8, stagger: 0.2, duration: 0.6 }, 1.1);
    ScrollTrigger.batch('#stList li', { start: 'top 88%', once: true, onEnter: (els) => G.from(els, { x: 48, autoAlpha: 0, stagger: 0.09, overwrite: true }) });

    /* the chart: bars grow from the axis in time order, then the now line drops in */
    G.timeline({ scrollTrigger: { trigger: '#timeline', start: 'top 75%' } })
      .from('.lane', { autoAlpha: 0, y: 20, stagger: 0.08, duration: 0.8 })
      .from('.pbar', { scaleY: 0, transformOrigin: '50% 100%', stagger: 0.035, duration: 0.9 }, 0.3)
      .from('.track .now', { scaleY: 0, transformOrigin: '50% 0%', duration: 0.6, ease: 'power2.out' }, 0.3)
      .from('.axis span', { autoAlpha: 0, y: 8, stagger: 0.05, duration: 0.6 }, 0.5);

    /* the booking form settles in field by field */
    G.from('.form > *', { y: 28, autoAlpha: 0, stagger: 0.06, scrollTrigger: { trigger: '.form', start: 'top 80%' } });

    /* footer: the orbit draws across, the name rises letter by letter */
    const foot = SplitText.create('.split-foot', { type: 'chars', mask: 'chars', aria: 'auto' });
    G.timeline({ scrollTrigger: { trigger: '.foot', start: 'top 80%' } })
      .from('.foot-orbit path', { drawSVG: '0%', duration: 2, ease: 'power2.inOut' })
      .from(foot.chars, { yPercent: 110, stagger: 0.035, duration: 1.2 }, 0.3)
      .from('.foot-row > *, .foot-legal', { y: 16, autoAlpha: 0, stagger: 0.08, duration: 0.8 }, 0.8);

    /* magnetic buttons, with quickTo so the pointer never queues tweens */
    if (matchMedia('(hover: hover)').matches) {
      G.utils.toArray('.mag').forEach((b) => {
        const label = b.firstElementChild;
        const bx = G.quickTo(b, 'x', { duration: 0.5, ease: 'power3' }), by = G.quickTo(b, 'y', { duration: 0.5, ease: 'power3' });
        const lx = G.quickTo(label, 'x', { duration: 0.5, ease: 'power3' }), ly = G.quickTo(label, 'y', { duration: 0.5, ease: 'power3' });
        b.addEventListener('pointermove', (e) => { const r = b.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5; bx(x * 10); by(y * 8); lx(x * 6); ly(y * 4); });
        b.addEventListener('pointerleave', () => { bx(0); by(0); lx(0); ly(0); G.to(b, { scale: 1, duration: 0.2, ease: 'power2.out' }); });
        b.addEventListener('pointerdown', () => G.to(b, { scale: 0.97, duration: 0.12, ease: 'power2.out' }));
        b.addEventListener('pointerup', () => G.to(b, { scale: 1, duration: 0.35, ease: 'back.out(3)' }));
      });
    }
  });

  /* fonts and late layout move the triggers; measure again once they settle */
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
}
