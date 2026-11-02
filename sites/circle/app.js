/* Circle · a rotating savings group computed in the page: N members each pay A a round, one takes the pot N×A, in seat order. */
const $ = id => document.getElementById(id);
const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const NS = 'http://www.w3.org/2000/svg';

/* currencies with a sample contribution each (sample inputs, not data) */
const CURS = [
  ['NGN', 'Naira', 20000], ['GHS', 'Cedi', 200], ['KES', 'Shilling', 2000], ['ZAR', 'Rand', 500],
  ['XOF', 'CFA franc', 10000], ['GBP', 'Pound', 50], ['USD', 'Dollar', 50], ['EUR', 'Euro', 50],
];
const REGION = { NG: 'NGN', GH: 'GHS', KE: 'KES', ZA: 'ZAR', SN: 'XOF', CI: 'XOF', ML: 'XOF', BF: 'XOF', BJ: 'XOF', TG: 'XOF', NE: 'XOF', GB: 'GBP', US: 'USD',
  DE: 'EUR', FR: 'EUR', IE: 'EUR', IT: 'EUR', ES: 'EUR', NL: 'EUR', BE: 'EUR', PT: 'EUR', AT: 'EUR', FI: 'EUR' };
let region = '';
try { region = new Intl.Locale(navigator.language).maximize().region || ''; } catch { /* older browsers */ }

const cur = $('cur'), amt = $('amt'), form = $('setup'), seatSel = $('seat');
CURS.forEach(([c, name]) => cur.add(new Option(`${c}`, c)));
cur.value = REGION[region] || 'NGN';
amt.value = CURS.find(c => c[0] === cur.value)[2];

const state = { n: 8, every: 'month', round: 1, seat: 1 };
const money = (v, sign = false) => new Intl.NumberFormat(navigator.language || 'en', { style: 'currency', currency: cur.value, maximumFractionDigits: 0, signDisplay: sign ? 'exceptZero' : 'auto' }).format(v);
const A = () => Math.max(0, +amt.value || 0);

/* due dates: weekly from next Monday, monthly from the 1st of next month */
function due(r) {
  const d = new Date(); d.setHours(0, 0, 0, 0);
  if (state.every === 'week') { d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7) + 7 * (r - 1)); }
  else { d.setDate(1); d.setMonth(d.getMonth() + r); }
  return d;
}
const dfmt = new Intl.DateTimeFormat(navigator.language || 'en', { day: 'numeric', month: 'short', year: 'numeric' });

/* ---------- the ring ---------- */
const ring = $('ring');
function drawRing() {
  const n = state.n, R = 150, cx = 200, cy = 200, r = state.round;
  const at = i => { const a = -Math.PI / 2 + (i / n) * Math.PI * 2; return [cx + R * Math.cos(a), cy + R * Math.sin(a)]; };
  const [px, py] = at(r - 1); const pa = -Math.PI / 2 + ((r - 1) / n) * Math.PI * 2;
  ring.innerHTML = `
    <defs><filter id="press" x="-10%" y="-20%" width="120%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="1" seed="3" result="n"/>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.6 1.35" result="m"/>
      <feComposite in="SourceGraphic" in2="m" operator="in" result="ink"/>
      <feOffset in="SourceAlpha" dx="0.7" dy="0.9" result="o"/>
      <feComposite in="SourceAlpha" in2="o" operator="out" result="wall"/>
      <feFlood flood-color="${css('--color-print')}" flood-opacity="0.35"/>
      <feComposite in2="wall" operator="in" result="sh"/>
      <feMerge><feMergeNode in="ink"/><feMergeNode in="sh"/></feMerge>
    </filter></defs>
    <circle class="track" cx="${cx}" cy="${cy}" r="${R}"/>
    ${Array.from({ length: n }, (_, i) => { const [x, y] = at(i); return `<g class="${i + 1 === state.seat ? 'you' : ''}"><circle class="seat-c ${i + 1 < r ? 'took' : ''}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="21"/><text class="seat-t" x="${x.toFixed(1)}" y="${y.toFixed(1)}">${i + 1 === state.seat ? 'You' : i + 1}</text></g>`; }).join('')}
    <path class="arrow" d="M${cx} ${cy} L${(cx + (R - 36) * Math.cos(pa)).toFixed(1)} ${(cy + (R - 36) * Math.sin(pa)).toFixed(1)}"/>
    <circle class="pot-c" cx="${(cx + (R - 36) * Math.cos(pa)).toFixed(1)}" cy="${(cy + (R - 36) * Math.sin(pa)).toFixed(1)}" r="9"/>
    <text class="paid" x="${cx}" y="${cy + 8}" text-anchor="middle" transform="rotate(-7 ${cx} ${cy})">Paid</text>`;
}
function read(live) {
  const r = state.round, who = r === state.seat ? 'you take' : `seat ${r} takes`;
  $('pot').textContent = money(A() * state.n);
  $('ringRead').setAttribute('aria-live', live ? 'polite' : 'off');
  $('ringRead').textContent = `Round ${r} of ${state.n}, due ${dfmt.format(due(r))}: ${who} the pot.${r === state.n ? ' Everyone has had a turn.' : ''}`;
}

/* ---------- the ledger ---------- */
function ledger() {
  const n = state.n, a = A(), pot = a * n, s = state.seat;
  $('rows').innerHTML = Array.from({ length: n }, (_, i) => {
    const r = i + 1, paid = a * r, took = r >= s ? pot : 0, stand = took - paid;
    return `<tr class="${r === s ? 'mine' : ''}"><td class="fig">${r}</td><td>${dfmt.format(due(r))}</td><td>${r === s ? 'You' : `Seat ${r}`}</td><td class="fig r">${money(paid)}</td><td class="fig r">${money(took)}</td><td class="fig r ${stand < 0 ? 'neg' : ''}">${money(stand, true)}</td></tr>`;
  }).join('');
  const total = money(pot);
  $('sheetFoot').textContent = s === 1 ? `In seat 1 you take ${total} first, and pay it back round by round. No interest, no fees.`
    : s === n ? `In seat ${n} you save every round and take ${total} last. No interest, no fees.`
    : `In seat ${s} you pay in ${total} and take out ${total}, in round ${s}. No interest, no fees.`;
}

function seats() {
  const keep = Math.min(state.seat, state.n);
  seatSel.innerHTML = Array.from({ length: state.n }, (_, i) => `<option value="${i + 1}">Seat ${i + 1}</option>`).join('');
  seatSel.value = state.seat = keep;
}
function all(live = false) { if (state.round > state.n) state.round = 1; drawRing(); read(live); ledger(); }

form.addEventListener('change', e => {
  const f = new FormData(form); state.n = +f.get('n'); state.every = f.get('every');
  if (e.target === cur) amt.value = CURS.find(c => c[0] === cur.value)[2];
  stop(); seats(); all(true);
});
form.addEventListener('submit', e => e.preventDefault());
amt.addEventListener('input', () => { amt.setAttribute('aria-invalid', amt.value && +amt.value > 0 ? 'false' : 'true'); all(); });
seatSel.addEventListener('change', () => { state.seat = +seatSel.value; all(); });
$('next').addEventListener('click', () => { stop(); state.round = state.round % state.n + 1; all(true); });

/* the job plays once: the pot goes round the ring in about six seconds, then stays */
let timer = 0;
function stop() { clearInterval(timer); timer = 0; }
function play() {
  if (reduce) return;
  state.round = 1; all();
  timer = setInterval(() => { if (state.round >= state.n) return stop(); state.round++; all(); }, 6000 / state.n);
}
seats(); all();
const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { io.disconnect(); (document.fonts?.ready || Promise.resolve()).then(play); } }, { threshold: 0.4 });
io.observe(ring);
document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });

/* ---------- the sign-up: no endpoint, so it never claims success ---------- */
const join = $('join'), note = $('joinNote');
join.addEventListener('submit', e => {
  e.preventDefault();
  let bad = null;
  join.querySelectorAll('input[required]').forEach(f => { const ok = f.checkValidity() && f.value.trim(); f.setAttribute('aria-invalid', ok ? 'false' : 'true'); if (!ok && !bad) bad = f; });
  if (bad) { bad.focus(); note.textContent = 'Fill in the highlighted fields. This showcase form still sends nothing.'; return; }
  if (!join.dataset.endpoint) note.textContent = 'All filled in. This showcase form has no endpoint, so nothing was sent.';
});
