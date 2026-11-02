/* Squeeze Drum · a small talking-drum synth in Web Audio: strike, squeeze (bend up), the head relaxing after the hit, a body filter. */
const $ = id => document.getElementById(id);
const NAMES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
const noteName = f => { const n = Math.round(12 * Math.log2(f / 440)) + 69; return `${NAMES[(n % 12 + 12) % 12]}${Math.floor(n / 12) - 1}`; };
const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

let ctx = null, noiseBuf = null;
function audio() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

/* one note: returns a handle whose bend(semitones) squeezes it */
function strike(f, vel = 0.9) {
  const a = audio(), t = a.currentTime;
  const out = a.createGain(); out.gain.setValueAtTime(0, t); out.gain.linearRampToValueAtTime(0.6 * vel, t + 0.004); out.gain.exponentialRampToValueAtTime(0.0008, t + 1.4);
  const body = a.createBiquadFilter(); body.type = 'peaking'; body.frequency.value = f * 2.1; body.Q.value = 3; body.gain.value = 6;
  const lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(f * 9, t); lp.frequency.exponentialRampToValueAtTime(f * 3, t + 0.5);
  out.connect(body).connect(lp).connect(a.destination);
  const o1 = a.createOscillator(); o1.type = 'sine';
  const o2 = a.createOscillator(); o2.type = 'triangle';
  const g2 = a.createGain(); g2.gain.value = 0.18;
  /* the head relaxes after the hit: the pitch sags about a semitone unless squeezed */
  o1.frequency.setValueAtTime(f * 1.03, t); o1.frequency.exponentialRampToValueAtTime(f * 0.95, t + 0.35);
  o2.frequency.setValueAtTime(f * 1.59, t); o2.frequency.exponentialRampToValueAtTime(f * 1.5, t + 0.35);
  o1.connect(out); o2.connect(g2).connect(out);
  const n = a.createBufferSource(); n.buffer = noiseBuf; const nb = a.createBiquadFilter(); nb.type = 'bandpass'; nb.frequency.value = f * 6; nb.Q.value = 1.2;
  const ng = a.createGain(); ng.gain.value = 0.5 * vel; n.connect(nb).connect(ng).connect(out);
  o1.start(t); o2.start(t); n.start(t); o1.stop(t + 1.5); o2.stop(t + 1.5);
  trace.start(f);
  return {
    bend(semi) {
      const now = a.currentTime, k = 2 ** (semi / 12);
      o1.frequency.cancelScheduledValues(now); o2.frequency.cancelScheduledValues(now);
      o1.frequency.setTargetAtTime(f * k, now, 0.03); o2.frequency.setTargetAtTime(f * 1.5 * k, now, 0.03);
      trace.push(f * k);
    },
  };
}

/* ---------- the pitch trace (canvas) ---------- */
const trace = (() => {
  const cv = $('trace'), cap = $('traceCap'), g = cv.getContext('2d');
  let pts = [], t0 = 0, base = 0, raf = 0;
  function size() { const r = Math.min(devicePixelRatio * (parseFloat(getComputedStyle(document.documentElement).zoom) || 1), 2.5); cv.width = cv.clientWidth * r; cv.height = cv.clientHeight * r; g.setTransform(r, 0, 0, r, 0, 0); draw(); }
  function draw() {
    const w = cv.clientWidth, h = cv.clientHeight;
    g.clearRect(0, 0, w, h);
    g.strokeStyle = css('--color-rule'); g.lineWidth = 1;
    for (let s = 0; s <= 12; s += 3) { const y = h - 20 - (s / 12) * (h - 40); g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    g.fillStyle = css('--color-muted'); g.font = `500 13px ${css('--font-body')}`;
    g.fillText('struck pitch', 6, h - 26); g.fillText('one octave up', 6, 34);
    if (!pts.length) return;
    g.strokeStyle = css('--color-accent'); g.lineWidth = 4; g.lineJoin = 'round'; g.beginPath();
    pts.forEach(([t, f], i) => { const x = (t / 1500) * w, y = h - 20 - (12 * Math.log2(f / base) / 12) * (h - 40); i ? g.lineTo(x, y) : g.moveTo(x, y); });
    g.stroke();
  }
  function tick() {
    const t = performance.now() - t0;
    if (t > 1500) { cancelAnimationFrame(raf); return; }
    const last = pts.at(-1); if (last) pts.push([t, last[1]]);
    draw(); raf = requestAnimationFrame(tick);
  }
  new ResizeObserver(size).observe(cv);
  return {
    start(f) { cancelAnimationFrame(raf); base = f; t0 = performance.now(); pts = [[0, f * 1.03], [350, f * 0.95]]; cap.textContent = `Last note: ${noteName(f)}, struck at ${Math.round(f)} Hz.`; raf = requestAnimationFrame(tick); },
    push(f) { pts.push([performance.now() - t0, f]); cap.textContent = `Squeezed up to ${noteName(f)}, ${Math.round(f)} Hz.`; },
  };
})();

/* ---------- the pad: press to strike, hold and slide up to squeeze ---------- */
const pad = $('pad'), padNote = $('padNote'), root = document.documentElement;
const BASE = 110;
let held = null, y0 = 0;
function squeeze(v) { root.style.setProperty('--squeeze', v.toFixed(3)); }
pad.addEventListener('pointerdown', e => {
  e.preventDefault(); pad.setPointerCapture(e.pointerId);
  held = strike(BASE, 0.95); y0 = e.clientY; pad.classList.add('hit'); padNote.textContent = noteName(BASE); squeeze(0);
});
pad.addEventListener('pointermove', e => {
  if (!held) return;
  const v = Math.max(0, Math.min(1, (y0 - e.clientY) / 160));
  held.bend(v * 12); squeeze(v); padNote.textContent = noteName(BASE * 2 ** v);
});
const release = () => { if (!held) return; held = null; pad.classList.remove('hit'); squeeze(0); };
pad.addEventListener('pointerup', release); pad.addEventListener('pointercancel', release);
pad.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); strike(BASE); padNote.textContent = noteName(BASE); } });

/* keys A S D F: the four tones of a talking-drum phrase; hold Shift to squeeze */
const KEYS = { a: 0, s: 3, d: 5, f: 7 };
addEventListener('keydown', e => {
  if (e.repeat || e.target.closest('input, textarea, select')) return;
  const k = KEYS[e.key.toLowerCase()]; if (k === undefined) return;
  const f = BASE * 2 ** (k / 12); const h = strike(f); padNote.textContent = noteName(f);
  if (e.shiftKey) setTimeout(() => h.bend(2), 120);
});

/* ---------- the rail: each voice plays a phrase; the search filters it ---------- */
document.querySelectorAll('.play').forEach(b => b.addEventListener('click', () => {
  const f = +b.dataset.f, bend = +b.dataset.bend;
  const n = strike(f); if (bend) setTimeout(() => n.bend(bend), 160);
  setTimeout(() => { const m = strike(f * 2 ** (bend ? 3 / 12 : 0), 0.7); if (bend) setTimeout(() => m.bend(bend / 2), 120); }, 420);
}));
const find = $('find'), voices = [...document.querySelectorAll('.voice')], empty = $('railEmpty');
find.addEventListener('input', () => {
  const q = find.value.trim().toLowerCase(); let shown = 0;
  voices.forEach(v => { const ok = !q || (v.textContent + ' ' + v.dataset.tags).toLowerCase().includes(q); v.hidden = !ok; shown += ok; });
  empty.hidden = shown > 0;
  if (q) document.getElementById('voices').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
});
document.querySelectorAll('[aria-disabled="true"]').forEach(a => a.addEventListener('click', e => e.preventDefault()));
