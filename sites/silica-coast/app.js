/* Silica Coast · the light on the hero and the band, the five structure diagrams, and the pinned scale readout. */
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

/* ---------- the light: sun through glass, a prism fan crossing a wafer (canvas) ---------- */
function light(canvas, { wafer }) {
  const ctx = canvas.getContext('2d');
  let w = 0, h = 0, dpr = 1, visible = true, t0 = performance.now();
  const spec = ['--spec-1', '--spec-2', '--spec-3', '--spec-4'].map(css);
  const C = { clear: css('--color-paper').replace(/\)\s*$/, ' / 0)'), paper: css('--color-paper'), shade: css('--color-shade'), shade2: css('--color-shade-2'), lightc: css('--color-light'), ink: css('--color-ink'), rule: css('--color-rule'), paper3: css('--color-paper-3') };
  function size() { dpr = Math.min(devicePixelRatio, 2); w = canvas.clientWidth; h = canvas.clientHeight; canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  function draw(now) {
    const t = reduce ? 0.35 : ((now - t0) / 60000) % 1; // one band crosses in 60 s
    ctx.clearRect(0, 0, w, h);
    const narrow = w < 900;
    const cx = narrow ? w * 0.66 : w * 0.74, cy = narrow ? h * 0.26 : h * 0.5, R = narrow ? Math.min(w * 0.4, h * 0.22) : Math.min(h * 0.38, w * 0.24);
    /* the prism fan, falling at a low angle from the top right */
    ctx.save();
    ctx.globalAlpha = 0.5;
    const x0 = w * (1.15 - t * 0.9), bandW = Math.max(w, h) * 0.08;
    spec.forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(x0 + i * bandW * 0.5, -10); ctx.lineTo(x0 + (i + 1) * bandW * 0.5, -10);
      ctx.lineTo(x0 - h * 0.7 + (i + 1) * bandW, h + 10); ctx.lineTo(x0 - h * 0.7 + i * bandW, h + 10);
      ctx.fill();
    });
    ctx.globalAlpha = 0.9; ctx.fillStyle = C.lightc;
    ctx.beginPath(); ctx.moveTo(x0 - 3, -10); ctx.lineTo(x0, -10); ctx.lineTo(x0 - h * 0.7, h + 10); ctx.lineTo(x0 - h * 0.7 - 3, h + 10); ctx.fill();
    ctx.restore();
    if (wafer) {
      /* the wafer: a mirror disc with its notch, the die grid, and the light caught in it */
      ctx.save();
      ctx.shadowColor = C.shade2; ctx.shadowBlur = 60; ctx.shadowOffsetX = 24; ctx.shadowOffsetY = 36;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fillStyle = C.paper3; ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
      const g = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
      const k = t * 1.0;
      spec.forEach((c, i) => g.addColorStop(Math.min(1, Math.max(0, (i / 4 + k) % 1)), c));
      ctx.globalAlpha = 0.2; ctx.fillStyle = g; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
      ctx.globalAlpha = 1;
      const die = R * 2 / 30; // a 10 mm die on a 300 mm wafer
      ctx.strokeStyle = C.ink; ctx.globalAlpha = 0.22; ctx.lineWidth = 1;
      for (let x = cx - R; x <= cx + R; x += die) { ctx.beginPath(); ctx.moveTo(x, cy - R); ctx.lineTo(x, cy + R); ctx.stroke(); }
      for (let y = cy - R; y <= cy + R; y += die) { ctx.beginPath(); ctx.moveTo(cx - R, y); ctx.lineTo(cx + R, y); ctx.stroke(); }
      ctx.restore();
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.strokeStyle = C.ink; ctx.globalAlpha = 0.5; ctx.stroke();
      ctx.globalAlpha = 1; ctx.fillStyle = C.paper; ctx.beginPath(); ctx.arc(cx, cy + R, R * 0.025, 0, Math.PI * 2); ctx.fill();
      /* fade to paper under the head */
      const fade = ctx.createLinearGradient(0, 0, w * 0.55, 0);
      fade.addColorStop(0, C.paper); fade.addColorStop(narrow ? 0.2 : 0.75, C.paper); fade.addColorStop(1, C.clear);
      if (!narrow) { ctx.fillStyle = fade; ctx.fillRect(0, 0, w * 0.55, h); }
      else { const fv = ctx.createLinearGradient(0, h * 0.5, 0, h * 0.7); fv.addColorStop(0, C.clear); fv.addColorStop(1, C.paper); ctx.fillStyle = fv; ctx.fillRect(0, h * 0.5, w, h * 0.5); }
    }
  }
  function loop(now) { if (visible) draw(now); if (!reduce) requestAnimationFrame(loop); }
  new ResizeObserver(() => { size(); draw(performance.now()); }).observe(canvas);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);
  size(); requestAnimationFrame(loop);
}
light(document.getElementById('light'), { wafer: true });
light(document.getElementById('light2'), { wafer: false });

/* ---------- diagrams, drawn from the real proportions ---------- */
const NS = 'http://www.w3.org/2000/svg';
function el(tag, attrs, parent) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent.appendChild(e); return e; }
const S = { line: 'stroke:var(--color-ink);fill:none;stroke-width:1.5', thin: 'stroke:var(--color-ink);fill:none;stroke-width:1;opacity:.35', fillA: 'fill:var(--color-accent-soft);stroke:var(--color-accent);stroke-width:1.5', fillS: 'fill:var(--color-shade);stroke:var(--color-ink);stroke-width:1', fillP: 'fill:var(--color-paper-3);stroke:var(--color-ink);stroke-width:1.5', accent: 'fill:var(--color-accent)', text: 'fill:var(--color-ink-2);font:500 17px var(--font-body)' };
function label(svg, x, y, str, anchor = 'start') { const t = el('text', { x, y, style: S.text, 'text-anchor': anchor }, svg); t.textContent = str; }
function dim(svg, x1, x2, y, str) {
  el('line', { x1, y1: y, x2, y2: y, style: S.line }, svg);
  for (const x of [x1, x2]) el('line', { x1: x - 6, y1: y + 6, x2: x + 6, y2: y - 6, style: S.line }, svg);
  label(svg, (x1 + x2) / 2, y - 12, str, 'middle');
}
const svgs = [...document.querySelectorAll('.frame svg')];

/* 1 · wafer, 300 mm, 10 mm dies */
(svg => {
  const cx = 300, cy = 280, R = 240, d = R * 2 / 30;
  el('circle', { cx, cy, r: R, style: S.fillP }, svg);
  for (let i = -15; i < 15; i++) for (let j = -15; j < 15; j++) {
    const x = cx + i * d, y = cy + j * d;
    const far = Math.max(...[[x, y], [x + d, y], [x, y + d], [x + d, y + d]].map(([a, b]) => Math.hypot(a - cx, b - cy)));
    if (far < R - 4) el('rect', { x: x + 0.8, y: y + 0.8, width: d - 1.6, height: d - 1.6, style: (i === 3 && j === -2) ? S.fillA : S.thin }, svg);
  }
  el('circle', { cx, cy: cy + R, r: 6, style: 'fill:var(--color-paper)' }, svg);
  dim(svg, cx - R, cx + R, 572, '300 mm');
  label(svg, cx + 3 * d + d + 10, cy - 2 * d + d * 0.7, 'the die we follow');
})(svgs[0]);

/* 2 · one die with its bump pads */
(svg => {
  const x0 = 110, y0 = 70, s = 380, n = 18, p = s / n;
  el('rect', { x: x0, y: y0, width: s, height: s, rx: 4, style: S.fillP }, svg);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const edge = i < 2 || j < 2 || i > n - 3 || j > n - 3;
    el('circle', { cx: x0 + p / 2 + i * p, cy: y0 + p / 2 + j * p, r: p * 0.28, style: (i >= 7 && i <= 9 && j === 9) ? S.accent : edge ? 'fill:var(--color-shade-2)' : 'fill:var(--color-shade)' }, svg);
  }
  dim(svg, x0, x0 + s, 520, '10 mm');
  label(svg, x0, 50, 'Signal pads at the edge, power and ground inside');
})(svgs[1]);

/* 3 · flip-chip cross-section, 150 µm pitch */
(svg => {
  el('rect', { x: 40, y: 120, width: 520, height: 110, style: S.fillP }, svg); label(svg, 60, 182, 'Die, face down');
  el('rect', { x: 40, y: 330, width: 520, height: 130, style: S.fillS }, svg); label(svg, 60, 430, 'Laminate substrate');
  el('rect', { x: 40, y: 230, width: 520, height: 100, style: 'fill:var(--color-accent-soft);opacity:.7' }, svg);
  const xs = [100, 200, 300, 400, 500];
  xs.forEach(x => { el('ellipse', { cx: x, cy: 280, rx: 38, ry: 46, style: 'fill:var(--color-paper);stroke:var(--color-ink);stroke-width:1.5' }, svg); });
  dim(svg, 200, 300, 520, '150 µm pitch');
})(svgs[2]);

/* 4 · interposer with microbumps */
(svg => {
  el('rect', { x: 50, y: 110, width: 230, height: 110, style: S.fillP }, svg); label(svg, 70, 172, 'Logic die');
  el('rect', { x: 320, y: 110, width: 230, height: 110, style: S.fillP }, svg); label(svg, 340, 172, 'Memory stack');
  for (let x = 62; x < 280; x += 18) el('circle', { cx: x, cy: 232, r: 7, style: 'fill:var(--color-paper);stroke:var(--color-ink);stroke-width:1' }, svg);
  for (let x = 332; x < 550; x += 18) el('circle', { cx: x, cy: 232, r: 7, style: 'fill:var(--color-paper);stroke:var(--color-ink);stroke-width:1' }, svg);
  el('rect', { x: 30, y: 240, width: 540, height: 120, style: S.fillS }, svg); label(svg, 46, 345, 'Silicon interposer');
  for (let k = 0; k < 4; k++) el('path', { d: `M ${110 + k * 18} 248 v ${16 + k * 8} H ${392 + k * 18} V 248`, style: 'stroke:var(--color-accent);fill:none;stroke-width:2' }, svg);
  for (let x = 70; x < 560; x += 60) el('line', { x1: x, y1: 300, x2: x, y2: 360, style: S.line }, svg);
  for (let x = 70; x < 560; x += 60) el('circle', { cx: x, cy: 382, r: 20, style: 'fill:var(--color-paper);stroke:var(--color-ink);stroke-width:1.5' }, svg);
  el('rect', { x: 20, y: 404, width: 560, height: 70, style: S.fillP }, svg); label(svg, 36, 448, 'Package substrate');
  dim(svg, 62, 80, 530, '40 µm');
})(svgs[3]);

/* 5 · fin transistors, gate pitch about 50 nm */
(svg => {
  el('rect', { x: 30, y: 380, width: 540, height: 90, style: S.fillS }, svg); label(svg, 46, 440, 'Silicon');
  const fins = [120, 240, 360, 480];
  fins.forEach(x => el('rect', { x: x - 16, y: 210, width: 32, height: 172, rx: 6, style: S.fillP }, svg));
  el('path', { d: 'M 60 380 V 170 H 540 V 380', style: 'fill:none;stroke:var(--color-accent);stroke-width:14;opacity:.9' }, svg);
  el('rect', { x: 60, y: 120, width: 480, height: 40, style: 'fill:var(--color-accent-soft);stroke:var(--color-accent);stroke-width:1.5' }, svg);
  label(svg, 300, 146, 'Gate, wrapped over every fin', 'middle');
  fins.forEach((x, i) => label(svg, x, 300, `fin ${i + 1}`, 'middle'));
  dim(svg, 120, 240, 530, 'about 50 nm');
})(svgs[4]);

/* ---------- the pinned readout follows the frame in view ---------- */
const frames = [...document.querySelectorAll('.frame')];
const nEl = document.getElementById('scaleN'), nameEl = document.getElementById('scaleName');
const dots = [...document.querySelectorAll('.scale-dots a')];
function setScale(i) {
  nEl.textContent = frames[i].dataset.n; nameEl.textContent = frames[i].dataset.name;
  dots.forEach((d, k) => { if (k === i) d.setAttribute('aria-current', 'step'); else d.removeAttribute('aria-current'); });
}
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) setScale(frames.indexOf(e.target)); }), { rootMargin: '-45% 0px -45% 0px' });
frames.forEach(f => io.observe(f));
setScale(0);
