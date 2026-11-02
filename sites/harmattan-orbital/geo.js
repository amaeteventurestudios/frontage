/* Harmattan Orbital · coarse coastlines (lon, lat) and helpers shared by the globe and the map.
   Africa and Madagascar follow the real coast at about one point per 300 km; Arabia and southern Europe are rougher, for context at the edge of the view. */
export const AFRICA = [[-5.8,35.8],[3,36.8],[10.2,37],[11,36.9],[10,33.9],[13.2,32.9],[15.5,31.5],[19,30.3],[20,32.1],[24,32],[29.9,31.2],[32.3,31.3],[32.5,29.9],[34,27],[35.5,24],[37.2,19.6],[39.5,15.6],[41.5,13.8],[43.1,11.6],[45,10.4],[51.3,11.8],[50.8,9],[48,4.5],[45.3,2],[42.5,-0.6],[39.7,-4],[39.3,-6.8],[40.4,-10.5],[40.7,-15],[37,-17.8],[34.8,-19.8],[35.5,-23.5],[32.6,-26],[32.4,-28.6],[31,-29.9],[28,-32.6],[25.6,-34],[20,-34.8],[18.4,-33.9],[17.9,-31],[15.2,-26.6],[14.5,-22.9],[12.2,-15.2],[13.6,-11.5],[13.2,-8.8],[12.3,-6],[11.8,-4],[9.4,0.4],[9.7,4],[8.3,4.9],[6,4.3],[3.4,6.4],[-0.2,5.6],[-4,5.3],[-7.7,4.4],[-10.8,6.3],[-13.2,8.5],[-13.7,9.5],[-15.6,11.9],[-17.4,14.7],[-16,18.1],[-17,20.8],[-15.9,23.7],[-12.9,27.9],[-9.6,30.4],[-7.6,33.6],[-5.8,35.8]];
export const MADA = [[49.3,-12],[50.4,-15.5],[49.7,-17],[47.3,-25],[45,-25.5],[43.7,-23.4],[44,-20],[44.4,-16.2],[47,-15.7],[49.3,-12]];
export const ARABIA = [[32.5,29.9],[34.9,29.5],[35.5,28],[37,25.5],[38.5,23],[39.2,21.5],[40.8,19],[42.6,16.5],[43.3,13],[45,12.8],[48.5,14],[52.2,15.6],[55.4,17.6],[57.8,19],[59.8,22.4],[58.5,23.6],[56.4,24.9],[56.2,26.2],[54,24.1],[51.6,24.3],[51.4,26],[50,26.5],[48.5,28.5],[47.7,30],[48.8,30.3],[47.5,32.5],[44,35],[42,37],[36.2,36.6],[35.8,34.5],[34.9,32.5],[34.2,31.3],[32.5,29.9]];
export const EUROPE = [[-9.5,43.5],[-9,37],[-5.6,36],[-2,36.7],[0,38.7],[3.2,42],[6,43.1],[8.8,44.4],[10.5,42.9],[12.5,41.9],[15.6,40],[16.5,38],[18.5,40.2],[15.5,43.5],[13.7,45.6],[19.5,41.8],[21,39],[22.8,36.5],[24,38],[26.5,40.5],[27,37],[30.5,36.4],[36,36.8],[42,37],[44,40],[41.5,41.5],[36,41.8],[29,41.2],[28,43],[29.5,45.5],[33,44.5],[38,47],[40,48.5],[30,50],[20,50],[10,50],[2,50],[-1.5,48.5],[-4.5,48],[-1.5,46],[-1.8,43.4],[-9.5,43.5]];
export const LANDS = [AFRICA, MADA, ARABIA, EUROPE];

export function inside([x, y], poly) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

/* land sampled on an even grid: about `step` degrees apart on the ground */
export function landDots(step = 0.8, lands = LANDS) {
  const out = [];
  for (let lat = -40; lat <= 52; lat += step) {
    const dl = step / Math.max(0.2, Math.cos(lat * Math.PI / 180));
    for (let lon = -20; lon <= 62; lon += dl) if (lands.some(p => inside([lon, lat], p))) out.push([lon, lat]);
  }
  return out;
}

/* points (lat, lon) on a small circle of angular radius r degrees around (lat0, lon0) */
export function smallCircle(lat0, lon0, r, n = 120) {
  const D = Math.PI / 180, la = lat0 * D, lo = lon0 * D, d = r * D, pts = [];
  for (let k = 0; k <= n; k++) {
    const b = (k / n) * 2 * Math.PI;
    const lat = Math.asin(Math.sin(la) * Math.cos(d) + Math.cos(la) * Math.sin(d) * Math.cos(b));
    const lon = lo + Math.atan2(Math.sin(b) * Math.sin(d) * Math.cos(la), Math.cos(d) - Math.sin(la) * Math.sin(lat));
    pts.push([lat / D, lon / D]);
  }
  return pts;
}
