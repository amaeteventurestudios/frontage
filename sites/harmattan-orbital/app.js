/* Harmattan Orbital · the page: the globe, the time scrubber, the pass list and the booking form. */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { SAT, STATIONS, MASK, satEcef, toLatLon, elevation, coverageKm, passes } from './orbit.js';

const $ = id => document.getElementById(id);
const D = Math.PI / 180;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fmtT = ms => new Date(ms).toISOString().slice(11, 16);
const fmtDay = ms => new Date(ms).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });

/* colours come from the theme tokens, resolved to sRGB through a canvas */
const probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
function token(name) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  probe.clearRect(0, 0, 1, 1); probe.fillStyle = v; probe.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = probe.getImageData(0, 0, 1, 1).data;
  return { color: new THREE.Color().setRGB(r / 255, g / 255, b / 255, THREE.SRGBColorSpace), alpha: a / 255 };
}

/* ---------- figures computed from the orbit ---------- */
const cov = coverageKm();
$('covKm').textContent = `${Math.round(cov.km).toLocaleString('en-GB')} km`;
$('period').textContent = `${(SAT.period / 60).toFixed(1)} min`;

let base = Date.now();
const passCache = {};
function computePasses() {
  for (const s of STATIONS) {
    passCache[s.id] = passes(s, base, 24);
    const cell = document.querySelector(`[data-count="${s.id}"]`);
    if (cell) cell.textContent = String(passCache[s.id].length);
  }
}
computePasses();

/* ---------- the globe ---------- */
const host = $('globe'), labels = $('labels');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
const ZOOM = parseFloat(getComputedStyle(document.documentElement).zoom) || 1; /* big screens scale the page up */
renderer.setPixelRatio(Math.min(devicePixelRatio * ZOOM, 2.5));
host.appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableZoom = false; controls.enablePan = false; controls.enableDamping = !reduce; controls.dampingFactor = 0.08;
controls.rotateSpeed = 0.5;

/* lat/lon (deg) to a point on the unit sphere, y up, Africa facing +z */
const v3 = (lat, lon, r = 1) => new THREE.Vector3(r * Math.cos(lat * D) * Math.sin(lon * D), r * Math.sin(lat * D), r * Math.cos(lat * D) * Math.cos(lon * D));
const ecefToV3 = ([x, y, z], scale) => new THREE.Vector3(y * scale, z * scale, x * scale);

function home() {
  const p = v3(2, 20, 4.4); camera.position.copy(p); camera.lookAt(0, 0, 0); controls.update();
}
home();

const C = {};
function readColours() {
  C.ink = token('--color-ink'); C.rule2 = token('--color-rule-2'); C.grid = token('--color-grid-2'); C.paper3 = token('--color-paper-3'); C.muted = token('--color-muted');
}
readColours();
const lineMat = (c, opacity = c.alpha) => new THREE.LineBasicMaterial({ color: c.color, transparent: opacity < 1, opacity });

const globe = new THREE.Group(); scene.add(globe);
const ball = new THREE.Mesh(new THREE.SphereGeometry(0.995, 64, 48), new THREE.MeshBasicMaterial({ color: C.paper3.color }));
globe.add(ball);

/* graticule, every 15° */
const grat = [];
for (let lat = -75; lat <= 75; lat += 15) { const pts = []; for (let lon = -180; lon <= 180; lon += 3) pts.push(v3(lat, lon, 1.001)); grat.push(pts); }
for (let lon = -180; lon < 180; lon += 15) { const pts = []; for (let lat = -90; lat <= 90; lat += 3) pts.push(v3(lat, lon, 1.001)); grat.push(pts); }
const gratMat = lineMat(C.grid);
grat.forEach(p => globe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(p), gratMat)));

/* a coarse outline of Africa and Madagascar (lon, lat), drawn as a map of the real coast */
const AFRICA = [[-5.8,35.8],[3,36.8],[10.2,37],[11,36.9],[10,33.9],[13.2,32.9],[15.5,31.5],[19,30.3],[20,32.1],[24,32],[29.9,31.2],[32.3,31.3],[32.5,29.9],[34,27],[35.5,24],[37.2,19.6],[39.5,15.6],[41.5,13.8],[43.1,11.6],[45,10.4],[51.3,11.8],[50.8,9],[48,4.5],[45.3,2],[42.5,-0.6],[39.7,-4],[39.3,-6.8],[40.4,-10.5],[40.7,-15],[37,-17.8],[34.8,-19.8],[35.5,-23.5],[32.6,-26],[32.4,-28.6],[31,-29.9],[28,-32.6],[25.6,-34],[20,-34.8],[18.4,-33.9],[17.9,-31],[15.2,-26.6],[14.5,-22.9],[12.2,-15.2],[13.6,-11.5],[13.2,-8.8],[12.3,-6],[11.8,-4],[9.4,0.4],[9.7,4],[8.3,4.9],[6,4.3],[3.4,6.4],[-0.2,5.6],[-4,5.3],[-7.7,4.4],[-10.8,6.3],[-13.2,8.5],[-13.7,9.5],[-15.6,11.9],[-17.4,14.7],[-16,18.1],[-17,20.8],[-15.9,23.7],[-12.9,27.9],[-9.6,30.4],[-7.6,33.6],[-5.8,35.8]];
const MADA = [[49.3,-12],[50.4,-15.5],[49.7,-17],[47.3,-25],[45,-25.5],[43.7,-23.4],[44,-20],[44.4,-16.2],[47,-15.7],[49.3,-12]];
function coast(poly) {
  const pts = [];
  for (let i = 0; i < poly.length - 1; i++) {
    const [a, b] = [poly[i], poly[i + 1]];
    for (let k = 0; k < 6; k++) { const f = k / 6; pts.push(v3(a[1] + (b[1] - a[1]) * f, a[0] + (b[0] - a[0]) * f, 1.002)); }
  }
  pts.push(v3(poly.at(-1)[1], poly.at(-1)[0], 1.002));
  return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat(C.ink, 0.9));
}
globe.add(coast(AFRICA), coast(MADA));

/* stations: a square mark and a coverage circle at the mask */
function circle(lat, lon, radDeg, r = 1.003) {
  const c = v3(lat, lon).normalize(), up = Math.abs(c.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
  const e1 = new THREE.Vector3().crossVectors(up, c).normalize(), e2 = new THREE.Vector3().crossVectors(c, e1);
  const pts = [];
  for (let k = 0; k <= 96; k++) {
    const a = (k / 96) * Math.PI * 2, rr = radDeg * D;
    pts.push(c.clone().multiplyScalar(Math.cos(rr)).add(e1.clone().multiplyScalar(Math.sin(rr) * Math.cos(a))).add(e2.clone().multiplyScalar(Math.sin(rr) * Math.sin(a))).multiplyScalar(r));
  }
  return new THREE.BufferGeometry().setFromPoints(pts);
}
const stationObjs = STATIONS.map(s => {
  const mat = new THREE.LineDashedMaterial({ color: C.ink.color, dashSize: 0.02, gapSize: 0.015, transparent: true, opacity: 0.55 });
  const ring = new THREE.Line(circle(s.lat, s.lon, cov.deg), mat); ring.computeLineDistances(); globe.add(ring);
  const mark = new THREE.Mesh(new THREE.PlaneGeometry(0.026, 0.026), new THREE.MeshBasicMaterial({ color: C.ink.color, side: THREE.DoubleSide }));
  const p = v3(s.lat, s.lon, 1.004); mark.position.copy(p); mark.lookAt(p.clone().multiplyScalar(2)); globe.add(mark);
  const el = document.createElement('span'); el.textContent = s.name; labels.appendChild(el);
  return { s, ring, mat, mark, el, p };
});

/* the satellite, its track for one orbit ahead and one behind, and a line down to any station hearing it */
const SCALE = 1 / 6371;
const satMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.022), new THREE.MeshBasicMaterial({ color: C.ink.color }));
globe.add(satMesh);
const satLabel = document.createElement('span'); satLabel.textContent = 'Sample satellite'; labels.appendChild(satLabel);
const trackAhead = new THREE.Line(new THREE.BufferGeometry(), lineMat(C.ink, 0.85));
const trackBehind = new THREE.Line(new THREE.BufferGeometry(), lineMat(C.muted, 0.35));
globe.add(trackAhead, trackBehind);
const links = new THREE.LineSegments(new THREE.BufferGeometry(), lineMat(C.ink, 1));
globe.add(links);

function trackPts(t0, t1) {
  const pts = [];
  for (let t = t0; t <= t1; t += 30000) pts.push(ecefToV3(satEcef(t), SCALE));
  return pts;
}

/* ---------- time ---------- */
const scrub = $('scrub'), clock = $('clock'), readout = $('readout');
let offsetMin = 0, lastTrack = 0;
const tNow = () => base + offsetMin * 60000;

function update() {
  const t = tNow();
  const p = satEcef(t), pos = ecefToV3(p, SCALE);
  satMesh.position.copy(pos);
  if (Math.abs(t - lastTrack) > 20000) {
    trackAhead.geometry.setFromPoints(trackPts(t, t + SAT.period * 1000));
    trackBehind.geometry.setFromPoints(trackPts(t - SAT.period * 500, t));
    lastTrack = t;
  }
  const seen = [], seg = [];
  for (const o of stationObjs) {
    const el = elevation(o.s, p);
    const on = el >= MASK / D;
    o.mat.opacity = on ? 1 : 0.5; o.mat.dashSize = on ? 1 : 0.02;
    if (on) { seen.push(`${o.s.name} at ${Math.round(el)}°`); seg.push(o.p, pos); }
  }
  links.geometry.setFromPoints(seg);
  const ll = toLatLon(p);
  const where = `${Math.abs(ll.lat).toFixed(1)}° ${ll.lat >= 0 ? 'N' : 'S'}, ${Math.abs(ll.lon).toFixed(1)}° ${ll.lon >= 0 ? 'E' : 'W'}`;
  readout.textContent = seen.length
    ? `Over ${where}. In view of ${seen.join(' and ')} elevation.`
    : `Over ${where}. No station hears it right now.`;
  clock.textContent = offsetMin === 0 ? 'now' : `+${Math.floor(offsetMin / 60)} h ${String(offsetMin % 60).padStart(2, '0')}`;
  scrub.setAttribute('aria-valuetext', `${clock.textContent}, ${fmtT(t)} UTC`);
}
scrub.addEventListener('input', () => { offsetMin = +scrub.value; update(); render(); });

/* ---------- render ---------- */
const tmp = new THREE.Vector3();
function placeLabel(el, world, w, h) {
  tmp.copy(world).project(camera);
  const facing = world.clone().normalize().dot(camera.position.clone().normalize()) > 0.15;
  el.style.opacity = facing ? '1' : '0';
  const x = (tmp.x * 0.5 + 0.5) * w, y = (-tmp.y * 0.5 + 0.5) * h;
  el.style.left = `${x}px`; el.style.top = `${y}px`;
  /* flip to the left of the mark when the label would run off the right edge */
  el.style.transform = x + el.offsetWidth + 14 > w ? 'translate(calc(-100% - 10px), -50%)' : '';
  return { x, y };
}
/* keep the satellite's label clear of the station names */
function clearOf(el, others) {
  const r = el.getBoundingClientRect();
  for (const o of others) {
    const q = o.getBoundingClientRect();
    if (o.style.opacity !== '0' && r.left < q.right && r.right > q.left && r.top < q.bottom + 4 && r.bottom > q.top - 4) {
      el.style.transform = `${el.style.transform || 'translate(10px, -50%)'} translateY(${r.top < q.top ? -110 : 110}%)`;
      return;
    }
  }
}
function render() {
  const w = host.clientWidth, h = host.clientHeight;
  renderer.render(scene, camera);
  stationObjs.forEach(o => placeLabel(o.el, o.p, w, h));
  placeLabel(satLabel, satMesh.position, w, h);
  clearOf(satLabel, stationObjs.map(o => o.el));
}
function resize() {
  const w = host.clientWidth, h = host.clientHeight;
  renderer.setSize(w, h, false); camera.aspect = w / h;
  camera.fov = w / h < 0.9 ? 44 : 32; camera.updateProjectionMatrix(); render();
}
new ResizeObserver(resize).observe(host);
controls.addEventListener('change', render);

let visible = true;
new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(host);
let lastSec = 0;
function loop(ts) {
  requestAnimationFrame(loop);
  if (!visible) return;
  if (controls.enableDamping) controls.update();
  if (ts - lastSec > 1000) { lastSec = ts; if (Date.now() - base > 60000) { base = Date.now(); computePasses(); renderPasses(); } update(); render(); }
}
/* open on the next pass over any station, so the first screen shows a link being made */
const next = Object.values(passCache).flat().sort((a, b) => a.tmax - b.tmax)[0];
if (next) { offsetMin = Math.min(1440, Math.round((next.tmax - base) / 60000)); scrub.value = offsetMin; }
update(); resize();
requestAnimationFrame(loop);

/* theme changes from the OS: re-read the tokens */
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { readColours(); render(); });

/* ---------- next passes ---------- */
const list = $('passList');
let current = 'kano', picked = null;
function renderPasses() {
  const ps = passCache[current];
  if (!ps.length) { list.innerHTML = '<p class="empty-note">No pass above the mask in the next 24 hours.</p>'; return; }
  list.innerHTML = ps.map(p => `<button type="button" class="pass" data-aos="${p.aos}" data-tmax="${p.tmax}" aria-pressed="${picked === p.aos}">
    <span class="t num">${fmtT(p.aos)}</span>
    <span class="day">${fmtDay(p.aos)}, rise</span>
    <span class="d">Peaks at ${Math.round(p.max)}° elevation</span>
    <span class="d">${Math.max(1, Math.round(p.dur / 60))} min above the mask</span>
  </button>`).join('');
}
renderPasses();
list.addEventListener('click', e => {
  const b = e.target.closest('.pass'); if (!b) return;
  picked = +b.dataset.aos;
  list.querySelectorAll('.pass').forEach(x => x.setAttribute('aria-pressed', x === b));
  $('fStation').value = current;
  $('fPass').value = `${fmtDay(picked)}, ${fmtT(picked)} UTC`;
  $('fPass').removeAttribute('aria-invalid');
  offsetMin = Math.max(0, Math.min(1440, Math.round((+b.dataset.tmax - base) / 60000)));
  scrub.value = offsetMin; update(); render();
});
const tabs = [...document.querySelectorAll('[role="tab"]')];
function selectTab(tab) {
  tabs.forEach(t => { const on = t === tab; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; });
  list.setAttribute('aria-labelledby', tab.id);
  current = tab.dataset.st; renderPasses();
}
tabs.forEach((t, i) => {
  t.addEventListener('click', () => selectTab(t));
  t.addEventListener('keydown', e => {
    const k = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; if (!k) return;
    const n = tabs[(i + k + tabs.length) % tabs.length]; n.focus(); selectTab(n);
  });
});

/* ---------- booking: validates, then sends nothing (no endpoint yet) ---------- */
const form = $('bookForm'), note = $('formNote');
form.addEventListener('submit', e => {
  e.preventDefault();
  let firstBad = null;
  for (const f of form.querySelectorAll('input[required]')) {
    const ok = f.checkValidity() && f.value.trim();
    f.setAttribute('aria-invalid', ok ? 'false' : 'true');
    if (!ok && !firstBad) firstBad = f;
  }
  if (firstBad) { firstBad.focus(); note.textContent = 'Fill in the highlighted fields. This showcase form still sends nothing.'; return; }
  if (!form.dataset.endpoint) note.textContent = 'Everything is filled in. This showcase form has no endpoint, so nothing was sent.';
});

/* ---------- the one drawn line ---------- */
const dim = document.querySelector('.dim-draw');
if (dim) new IntersectionObserver(([e], o) => { if (e.isIntersecting) { dim.classList.add('drawn'); o.disconnect(); } }, { threshold: 0.6 }).observe(dim);
