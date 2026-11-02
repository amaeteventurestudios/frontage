/* Rig and Bone · the hero rig: a mannequin whose hands and feet are IK targets, solved with two-bone IK each frame. */
const svg = document.getElementById('rig');
const note = document.getElementById('rigNote');
const NS = 'http://www.w3.org/2000/svg';
const mk = (tag, attrs, parent = svg) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent.appendChild(e); return e; };

const ROOT = {
  neck: { x: 260, y: 196 }, pelvis: { x: 260, y: 336 },
  shoulderL: { x: 214, y: 210 }, shoulderR: { x: 306, y: 210 },
  hipL: { x: 236, y: 344 }, hipR: { x: 284, y: 344 },
};
const LIMBS = [
  { id: 'armL', name: 'left elbow', root: 'shoulderL', a: 80, b: 74, bend: -1, rest: { x: 150, y: 318 }, fill: 'var(--color-ink)' },
  { id: 'armR', name: 'right elbow', root: 'shoulderR', a: 80, b: 74, bend: 1, rest: { x: 370, y: 318 }, fill: 'var(--color-ink)' },
  { id: 'legL', name: 'left knee', root: 'hipL', a: 96, b: 92, bend: -1, rest: { x: 214, y: 522 }, fill: 'var(--color-ink)' },
  { id: 'legR', name: 'right knee', root: 'hipR', a: 96, b: 92, bend: 1, rest: { x: 306, y: 522 }, fill: 'var(--color-ink)' },
];
let flip = 1;

/* the solve, the same as the code sample further down the page */
function twoBoneIK(root, target, a, b, bend) {
  const dx = target.x - root.x, dy = target.y - root.y;
  const d = Math.max(1e-3, Math.min(Math.hypot(dx, dy), a + b - 1e-3));
  const cosR = Math.max(-1, Math.min(1, (a * a + d * d - b * b) / (2 * a * d)));
  const upper = Math.atan2(dy, dx) - bend * Math.acos(cosR);
  const elbow = { x: root.x + a * Math.cos(upper), y: root.y + a * Math.sin(upper) };
  const lower = Math.atan2(target.y - elbow.y, target.x - elbow.x);
  const end = { x: elbow.x + b * Math.cos(lower), y: elbow.y + b * Math.sin(lower) };
  const cosE = Math.max(-1, Math.min(1, (a * a + b * b - d * d) / (2 * a * b)));
  return { elbow, end, angle: Math.acos(cosE) * 180 / Math.PI, reach: Math.hypot(dx, dy) > a + b };
}

/* die-cut capsules: a hard ink shadow, a white cut edge, the fill */
const layers = { shadow: mk('g', {}), cut: mk('g', {}), fill: mk('g', {}), joints: mk('g', {}), handles: mk('g', {}) };
function capsule(w, fill) {
  return {
    s: mk('line', { 'stroke-linecap': 'round', 'stroke-width': w + 12, style: 'stroke:var(--color-ink)' }, layers.shadow),
    c: mk('line', { 'stroke-linecap': 'round', 'stroke-width': w + 12, style: 'stroke:var(--color-white)' }, layers.cut),
    f: mk('line', { 'stroke-linecap': 'round', 'stroke-width': w, style: `stroke:${fill}` }, layers.fill),
  };
}
function setCap(c, p, q) {
  for (const [el, o] of [[c.s, 5], [c.c, 0], [c.f, 0]]) { el.setAttribute('x1', p.x + o); el.setAttribute('y1', p.y + o * 1.2); el.setAttribute('x2', q.x + o); el.setAttribute('y2', q.y + o * 1.2); }
}
const torso = capsule(64, 'var(--color-accent)');
const shoulders = capsule(30, 'var(--color-accent)');
const hips = capsule(30, 'var(--color-accent)');
const headS = mk('circle', { r: 46, style: 'fill:var(--color-ink)' }, layers.shadow);
const headC = mk('circle', { r: 46, style: 'fill:var(--color-white)' }, layers.cut);
const headF = mk('circle', { r: 40, style: 'fill:var(--color-paper-3)' }, layers.fill);
LIMBS.forEach(l => { l.up = capsule(24, l.fill); l.lo = capsule(22, l.fill); l.joint = mk('circle', { r: 7, style: 'fill:var(--color-accent-2);stroke:var(--color-white);stroke-width:3' }, layers.joints); l.t = { ...l.rest }; });

/* handles: focusable, draggable, arrow keys nudge */
LIMBS.forEach(l => {
  const g = mk('g', { class: 'handle', tabindex: '0', role: 'slider', 'aria-label': `${l.id.startsWith('arm') ? 'Hand' : 'Foot'}, ${l.id.endsWith('L') ? 'left' : 'right'}. Arrow keys move it.` }, layers.handles);
  mk('circle', { r: 26, style: 'fill:var(--color-white);opacity:0' }, g);
  l.ring = mk('circle', { r: 17, class: 'ring', style: 'fill:var(--color-accent);stroke:var(--color-white);stroke-width:5' }, g);
  l.h = g;
  g.addEventListener('pointerdown', e => { drag = l; g.setPointerCapture(e.pointerId); move(e); });
  g.addEventListener('keydown', e => {
    const k = { ArrowLeft: [-10, 0], ArrowRight: [10, 0], ArrowUp: [0, -10], ArrowDown: [0, 10] }[e.key];
    if (!k) return; e.preventDefault(); l.t.x += k[0]; l.t.y += k[1]; clampT(l); draw(l);
  });
});
let drag = null;
function toSvg(e) { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); }
function clampT(l) { l.t.x = Math.max(20, Math.min(500, l.t.x)); l.t.y = Math.max(20, Math.min(545, l.t.y)); }
function move(e) { if (!drag) return; const p = toSvg(e); drag.t.x = p.x; drag.t.y = p.y; clampT(drag); draw(drag); }
svg.addEventListener('pointermove', move);
svg.addEventListener('pointerup', () => { drag = null; });
svg.addEventListener('pointercancel', () => { drag = null; });

function draw(active) {
  setCap(torso, ROOT.neck, ROOT.pelvis);
  setCap(shoulders, ROOT.shoulderL, ROOT.shoulderR);
  setCap(hips, ROOT.hipL, ROOT.hipR);
  for (const [c, o] of [[headS, 5], [headC, 0], [headF, 0]]) { c.setAttribute('cx', 260 + o); c.setAttribute('cy', 132 + o * 1.2); }
  let msg = '';
  LIMBS.forEach(l => {
    const r = ROOT[l.root];
    const bend = l.id.startsWith('arm') ? l.bend * flip : l.bend;
    const s = twoBoneIK(r, l.t, l.a, l.b, bend);
    setCap(l.up, r, s.elbow); setCap(l.lo, s.elbow, s.end);
    l.joint.setAttribute('cx', s.elbow.x); l.joint.setAttribute('cy', s.elbow.y);
    l.h.setAttribute('transform', `translate(${s.end.x} ${s.end.y})`);
    l.h.setAttribute('aria-valuetext', `${l.name} at ${Math.round(s.angle)} degrees`);
    if (l === active) msg = s.reach ? `Out of reach: the ${l.name} locks straight at 180°.` : `The ${l.name} bends to ${Math.round(s.angle)}°, worked out from two bone lengths and the target.`;
  });
  if (msg) note.textContent = msg;
}
document.getElementById('flip').addEventListener('click', e => { flip *= -1; e.currentTarget.setAttribute('aria-pressed', flip < 0); draw(LIMBS[0]); });
document.getElementById('reset').addEventListener('click', () => { LIMBS.forEach(l => { l.t = { ...l.rest }; }); draw(); note.textContent = 'Back to the rest pose. Drag a hand or a foot.'; });
draw();

/* the sign-up form validates and sends nothing until it has an endpoint */
const form = document.getElementById('joinForm'), fnote = document.getElementById('formNote');
form.addEventListener('submit', e => {
  e.preventDefault();
  let bad = null;
  form.querySelectorAll('input[required]').forEach(f => { const ok = f.checkValidity() && f.value.trim(); f.setAttribute('aria-invalid', ok ? 'false' : 'true'); if (!ok && !bad) bad = f; });
  if (bad) { bad.focus(); fnote.textContent = 'Fill in the highlighted fields. This showcase form still sends nothing.'; return; }
  if (!form.dataset.endpoint) fnote.textContent = 'All filled in. This showcase form has no endpoint, so nothing was sent.';
});
