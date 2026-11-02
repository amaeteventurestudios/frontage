/* Harmattan Orbital · orbit maths. A circular two-body orbit with J2 nodal drift, the Earth turning under it.
   Everything on the page that moves or counts comes from here: the globe, the readout, the pass list, the coverage. */

export const RE = 6371;                 // km, mean Earth radius (spherical Earth)
export const MU = 398600.4418;          // km^3/s^2
export const OMEGA_E = 7.2921159e-5;    // rad/s, Earth rotation
const D = Math.PI / 180;

/* The sample satellite: a 550 km sun-synchronous orbit, the common rideshare orbit for small satellites. */
export const SAT = {
  name: 'Sample satellite, 550 km sun-synchronous',
  alt: 550,
  inc: 97.6 * D,
  epoch: Date.UTC(2026, 10, 1, 0, 0, 0),
  node0: 20 * D,          // ascending node over 20° east at the epoch
  u0: 0,
  nodeRate: (360 / 365.2422) * D / 86400, // sun-synchronous drift, rad/s
};
SAT.r = RE + SAT.alt;
SAT.n = Math.sqrt(MU / SAT.r ** 3);              // rad/s
SAT.period = 2 * Math.PI / SAT.n;                // s

export const STATIONS = [
  { id: 'kano', name: 'Kano', country: 'Nigeria', lat: 12.0022, lon: 8.5920 },
  { id: 'nairobi', name: 'Nairobi', country: 'Kenya', lat: -1.2921, lon: 36.8219 },
  { id: 'windhoek', name: 'Windhoek', country: 'Namibia', lat: -22.5609, lon: 17.0658 },
];
export const MASK = 10 * D; // elevation mask

/* Greenwich sidereal angle, rad */
function gmst(ms) {
  const jd = ms / 86400000 + 2440587.5;
  return ((280.46061837 + 360.98564736629 * (jd - 2451545)) % 360) * D;
}

/* Earth-fixed position (km) of the satellite at time ms */
export function satEcef(ms, sat = SAT) {
  const t = (ms - sat.epoch) / 1000;
  const u = sat.u0 + sat.n * t;
  const node = sat.node0 + gmst(sat.epoch) + sat.nodeRate * t;
  const cu = Math.cos(u), su = Math.sin(u), cn = Math.cos(node), sn = Math.sin(node), ci = Math.cos(sat.inc), si = Math.sin(sat.inc);
  const x = sat.r * (cn * cu - sn * su * ci), y = sat.r * (sn * cu + cn * su * ci), z = sat.r * su * si;
  const th = gmst(ms), ct = Math.cos(th), st = Math.sin(th);
  return [ct * x + st * y, -st * x + ct * y, z];
}

export function toLatLon([x, y, z]) {
  return { lat: Math.atan2(z, Math.hypot(x, y)) / D, lon: Math.atan2(y, x) / D };
}

export function stationEcef(s) {
  const la = s.lat * D, lo = s.lon * D;
  return [RE * Math.cos(la) * Math.cos(lo), RE * Math.cos(la) * Math.sin(lo), RE * Math.sin(la)];
}

/* elevation (deg) of the satellite seen from a station */
export function elevation(s, p) {
  const g = stationEcef(s);
  const d = [p[0] - g[0], p[1] - g[1], p[2] - g[2]];
  const dl = Math.hypot(...d);
  return Math.asin((d[0] * g[0] + d[1] * g[1] + d[2] * g[2]) / (dl * RE)) / D;
}

/* ground radius (km) a station covers at the mask, for this altitude */
export function coverageKm(alt = SAT.alt, mask = MASK) {
  const lam = Math.acos(RE * Math.cos(mask) / (RE + alt)) - mask;
  return { km: lam * RE, deg: lam / D };
}

/* passes above the mask over the next `hours`, stepping `step` seconds then refining the edges */
export function passes(s, from, hours = 24, step = 20) {
  const out = []; let open = null;
  const end = from + hours * 3600000;
  for (let t = from; t <= end; t += step * 1000) {
    const el = elevation(s, satEcef(t));
    if (el >= MASK / D) {
      if (!open) open = { aos: edge(s, t - step * 1000, t), max: el, tmax: t };
      if (el > open.max) { open.max = el; open.tmax = t; }
    } else if (open) {
      open.los = edge(s, t - step * 1000, t);
      open.dur = (open.los - open.aos) / 1000;
      out.push(open); open = null;
    }
  }
  return out;
}
function edge(s, a, b) {
  const above = t => elevation(s, satEcef(t)) >= MASK / D;
  const up = above(b);
  for (let i = 0; i < 12; i++) { const m = (a + b) / 2; (above(m) === up) ? (b = m) : (a = m); }
  return Math.round((a + b) / 2);
}

/* azimuth (deg, clockwise from north) and elevation of the satellite from a station, from local east-north-up */
export function lookAngles(s, p) {
  const g = stationEcef(s), la = s.lat * D, lo = s.lon * D;
  const d = [p[0] - g[0], p[1] - g[1], p[2] - g[2]];
  const e = -Math.sin(lo) * d[0] + Math.cos(lo) * d[1];
  const n = -Math.sin(la) * Math.cos(lo) * d[0] - Math.sin(la) * Math.sin(lo) * d[1] + Math.cos(la) * d[2];
  const u = Math.cos(la) * Math.cos(lo) * d[0] + Math.cos(la) * Math.sin(lo) * d[1] + Math.sin(la) * d[2];
  const range = Math.hypot(e, n, u);
  return { az: ((Math.atan2(e, n) / D) + 360) % 360, el: Math.asin(u / range) / D, range };
}

/* the subsolar point (deg) at time ms, from the low-precision solar position in the Astronomical Almanac */
export function subsolar(ms) {
  const n = ms / 86400000 + 2440587.5 - 2451545;
  const L = (280.46 + 0.9856474 * n) % 360, g = ((357.528 + 0.9856003 * n) % 360) * D;
  const lam = (L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * D, eps = (23.439 - 0.0000004 * n) * D;
  const dec = Math.asin(Math.sin(eps) * Math.sin(lam));
  const ra = Math.atan2(Math.cos(eps) * Math.sin(lam), Math.cos(lam));
  const lon = ((ra - gmst(ms)) / D + 540) % 360 - 180;
  return { lat: dec / D, lon };
}
