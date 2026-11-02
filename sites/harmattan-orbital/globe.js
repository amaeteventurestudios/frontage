/* Harmattan Orbital · the hero globe. The Earth turns under the real sun, the sample satellite flies its computed orbit,
   and each station's coverage lights up while the satellite is in view. Time runs sixty times faster than the clock. */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { SAT, STATIONS, MASK, satEcef, toLatLon, elevation, coverageKm, subsolar } from './orbit.js';
import { landDots, smallCircle } from './geo.js';

const D = Math.PI / 180;
export const v3 = (lat, lon, r = 1) => new THREE.Vector3(r * Math.cos(lat * D) * Math.sin(lon * D), r * Math.sin(lat * D), r * Math.cos(lat * D) * Math.cos(lon * D));
const fromEcef = ([x, y, z], s) => new THREE.Vector3(y * s, z * s, x * s);

export function colour(name) {
  const probe = colour.ctx || (colour.ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true }));
  probe.clearRect(0, 0, 1, 1); probe.fillStyle = getComputedStyle(document.documentElement).getPropertyValue(name).trim(); probe.fillRect(0, 0, 1, 1);
  const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
  return new THREE.Color().setRGB(r / 255, g / 255, b / 255, THREE.SRGBColorSpace);
}
export const zoomRatio = () => Math.min(devicePixelRatio * (parseFloat(getComputedStyle(document.documentElement).zoom) || 1), 2);

export function stars(n, radius, size, col) {
  const pos = new Float32Array(n * 3), sz = new Float32Array(n), ph = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, s = Math.sqrt(1 - u * u);
    pos.set([radius * s * Math.cos(a), radius * u, radius * s * Math.sin(a)], i * 3);
    sz[i] = size * (0.35 + Math.random() ** 3 * 1.6); ph[i] = Math.random() * 6.28;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('size', new THREE.BufferAttribute(sz, 1)); g.setAttribute('phase', new THREE.BufferAttribute(ph, 1));
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { time: { value: 0 }, col: { value: col }, ratio: { value: 1 } },
    vertexShader: `attribute float size; attribute float phase; uniform float time; uniform float ratio; varying float vA;
      void main(){ vA = 0.55 + 0.45 * sin(time * 1.3 + phase); vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = size * ratio; }`,
    fragmentShader: `uniform vec3 col; varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, d); gl_FragColor = vec4(col, a * vA); }`,
  });
  return new THREE.Points(g, m);
}

export function createGlobe(host, labelHost, { reduce, onRead }) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(zoomRatio());
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableZoom = false; controls.enablePan = false; controls.enableDamping = true; controls.dampingFactor = 0.06; controls.rotateSpeed = 0.45;
  controls.minPolarAngle = 0.6; controls.maxPolarAngle = 2.5;

  const C = { ocean: colour('--color-ocean'), haze: colour('--color-haze'), land: colour('--color-land'), nightLand: colour('--color-night-land'), accent: colour('--color-accent'), ink: colour('--color-ink'), star: colour('--color-star'), signal: colour('--color-signal'), space: colour('--color-space') };
  const sun = { value: new THREE.Vector3(1, 0, 0) };
  const ratio = { value: zoomRatio() };

  const globe = new THREE.Group(); scene.add(globe);
  scene.add(stars(1600, 40, 2.2, C.star));

  /* the Earth: a dark ocean lit by the real sun, with a soft terminator and a warm rim where the dust catches the light */
  const earth = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), new THREE.ShaderMaterial({
    uniforms: { sun, ocean: { value: C.ocean }, haze: { value: C.haze } },
    vertexShader: `varying vec3 vN; varying vec3 vW; varying vec3 vV;
      void main(){ vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; vV = normalize(cameraPosition - w.xyz); gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform vec3 sun; uniform vec3 ocean; uniform vec3 haze; varying vec3 vN; varying vec3 vW; varying vec3 vV;
      void main(){ float l = dot(normalize(vN), sun); float day = smoothstep(-0.18, 0.35, l);
        vec3 c = mix(ocean * 0.75 + vec3(0.012,0.016,0.03), ocean * 2.1 + vec3(0.03,0.04,0.06), day);
        float rim = pow(1.0 - max(dot(normalize(vN), vV), 0.0), 3.0);
        c += haze * rim * (0.25 + 0.75 * day) * 0.9;
        float glint = pow(max(dot(reflect(-sun, normalize(vN)), vV), 0.0), 40.0) * day;
        c += vec3(1.0, 0.85, 0.6) * glint * 0.25;
        gl_FragColor = vec4(c, 1.0); }`,
  }));
  globe.add(earth);

  /* land as a field of dots, bright by day, embers by night */
  const dots = landDots(0.75);
  const dpos = new Float32Array(dots.length * 3);
  dots.forEach(([lon, lat], i) => { const p = v3(lat, lon, 1.003); dpos.set([p.x, p.y, p.z], i * 3); });
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
  const landMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { sun, day: { value: C.land }, night: { value: C.nightLand }, ratio, reveal: { value: reduce ? 1 : 0 } },
    vertexShader: `uniform vec3 sun; uniform float ratio; uniform float reveal; varying float vL; varying float vFace; varying float vR;
      void main(){ vec3 n = normalize(mat3(modelMatrix) * position); vL = dot(n, sun); vec4 w = modelMatrix * vec4(position,1.0);
        vFace = dot(n, normalize(cameraPosition - w.xyz)); vR = step(fract(sin(dot(position.xy, vec2(12.9898,78.233))) * 43758.5453), reveal);
        vec4 mv = viewMatrix * w; gl_Position = projectionMatrix * mv; gl_PointSize = (2.3 * ratio) * (4.4 / -mv.z); }`,
    fragmentShader: `uniform vec3 day; uniform vec3 night; varying float vL; varying float vFace; varying float vR;
      void main(){ if (vFace < 0.0 || vR < 0.5) discard; float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard;
        float k = smoothstep(-0.15, 0.3, vL); vec3 c = mix(night, day, k); gl_FragColor = vec4(c, (0.55 + 0.45 * k) * smoothstep(0.0, 0.25, vFace)); }`,
  });
  globe.add(new THREE.Points(dg, landMat));

  /* the Harmattan haze: an atmosphere of warm dust, brightest on the lit limb */
  const atmo = new THREE.Mesh(new THREE.SphereGeometry(1.16, 64, 48), new THREE.ShaderMaterial({
    side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { sun, haze: { value: C.haze } },
    vertexShader: `varying vec3 vN; varying vec3 vV; varying vec3 vW; void main(){ vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; vV = normalize(cameraPosition - w.xyz); gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform vec3 sun; uniform vec3 haze; varying vec3 vN; varying vec3 vV; varying vec3 vW;
      void main(){ float edge = pow(smoothstep(0.0, -0.55, dot(normalize(vN), vV)), 2.2);
        float lit = 0.35 + 0.65 * smoothstep(-0.4, 0.6, dot(normalize(vW), sun)); gl_FragColor = vec4(haze * edge * lit * 1.4, edge * lit * 0.8); }`,
  }));
  globe.add(atmo);

  /* a faint graticule */
  const gpts = [];
  for (let lat = -60; lat <= 60; lat += 30) for (let lon = -180; lon < 180; lon += 2) gpts.push(v3(lat, lon, 1.001), v3(lat, lon + 2, 1.001));
  for (let lon = -180; lon < 180; lon += 30) for (let lat = -88; lat < 88; lat += 2) gpts.push(v3(lat, lon, 1.001), v3(lat + 2, lon, 1.001));
  globe.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(gpts), new THREE.LineBasicMaterial({ color: C.ink, transparent: true, opacity: 0.05 })));

  /* stations: a beacon, the coverage ring at the mask, and a cap that fills while the satellite is in view */
  const cov = coverageKm();
  const st = STATIONS.map(s => {
    const ringPts = smallCircle(s.lat, s.lon, cov.deg, 160).map(([la, lo]) => v3(la, lo, 1.004));
    const ringMat = new THREE.LineDashedMaterial({ color: C.accent, dashSize: 0.012, gapSize: 0.01, transparent: true, opacity: 0.55 });
    const ring = new THREE.Line(new THREE.BufferGeometry().setFromPoints(ringPts), ringMat); ring.computeLineDistances(); globe.add(ring);
    const capGeo = new THREE.BufferGeometry(); const centre = v3(s.lat, s.lon, 1.0035); const cp = [centre];
    ringPts.forEach(p => cp.push(p.clone().multiplyScalar(1.0035 / 1.004)));
    const idx = []; for (let i = 1; i < cp.length - 1; i++) idx.push(0, i, i + 1);
    capGeo.setFromPoints(cp); capGeo.setIndex(idx);
    const capMat = new THREE.MeshBasicMaterial({ color: C.accent, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
    globe.add(new THREE.Mesh(capGeo, capMat));
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.012, 12, 8), new THREE.MeshBasicMaterial({ color: C.ink }));
    beacon.position.copy(v3(s.lat, s.lon, 1.006)); globe.add(beacon);
    const el = document.createElement('span'); el.textContent = s.name; labelHost.appendChild(el);
    return { s, ringMat, capMat, beacon, el, p: v3(s.lat, s.lon, 1.006), on: 0 };
  });

  /* the satellite, its glow, its wake behind and its path ahead */
  const SCALE = 1 / 6371;
  const satDot = new THREE.Points(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3()]), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { col: { value: C.accent }, ratio, time: { value: 0 } },
    vertexShader: `uniform float ratio; uniform float time; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * mv; gl_PointSize = (26.0 + 4.0 * sin(time * 4.0)) * ratio; }`,
    fragmentShader: `uniform vec3 col; void main(){ float d = length(gl_PointCoord - 0.5); float core = smoothstep(0.12, 0.0, d); float glow = smoothstep(0.5, 0.0, d) * 0.55; gl_FragColor = vec4(mix(col, vec3(1.0), core), core + glow * glow); }`,
  }));
  globe.add(satDot);
  const WAKE = 140;
  const wakeGeo = new THREE.BufferGeometry();
  wakeGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(WAKE * 3), 3));
  const wcol = new Float32Array(WAKE * 3);
  for (let i = 0; i < WAKE; i++) { const k = (i / (WAKE - 1)) ** 1.6; wcol.set([C.accent.r * k, C.accent.g * k, C.accent.b * k], i * 3); }
  wakeGeo.setAttribute('color', new THREE.BufferAttribute(wcol, 3));
  globe.add(new THREE.Line(wakeGeo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })));
  const aheadGeo = new THREE.BufferGeometry();
  const ahead = new THREE.Line(aheadGeo, new THREE.LineDashedMaterial({ color: C.ink, dashSize: 0.02, gapSize: 0.025, transparent: true, opacity: 0.22 }));
  globe.add(ahead);
  const beamGeo = new THREE.BufferGeometry();
  const beams = new THREE.LineSegments(beamGeo, new THREE.LineBasicMaterial({ color: C.signal, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
  globe.add(beams);
  const satLabel = document.createElement('span'); satLabel.className = 'sat'; satLabel.textContent = 'Sample satellite'; labelHost.appendChild(satLabel);

  /* time */
  const base = Date.now();
  let offset = 0, clock = 0, lastWake = -1e9, lastRead = 0;
  const SPEED = reduce ? 0 : 60;
  const simTime = () => base + offset * 60000 + clock * 1000 * SPEED;

  function step(t) {
    const p = satEcef(t), pos = fromEcef(p, SCALE);
    satDot.geometry.attributes.position.setXYZ(0, pos.x, pos.y, pos.z); satDot.geometry.attributes.position.needsUpdate = true;
    if (Math.abs(t - lastWake) > 8000) {
      const a = wakeGeo.attributes.position;
      for (let i = 0; i < WAKE; i++) { const q = fromEcef(satEcef(t - (WAKE - 1 - i) * 22000), SCALE); a.setXYZ(i, q.x, q.y, q.z); }
      a.needsUpdate = true;
      const pts = []; for (let k = 0; k <= 120; k++) pts.push(fromEcef(satEcef(t + k * 30000), SCALE));
      aheadGeo.setFromPoints(pts); ahead.computeLineDistances(); lastWake = t;
    }
    const ss = subsolar(t); sun.value.copy(v3(ss.lat, ss.lon)).normalize();
    const seg = [], seen = [];
    st.forEach(o => {
      const el = elevation(o.s, p), on = el >= MASK / D;
      o.on += ((on ? 1 : 0) - o.on) * 0.12;
      o.capMat.opacity = 0.16 * o.on; o.ringMat.opacity = 0.45 + 0.55 * o.on;
      if (on) { seg.push(o.p, pos); seen.push(`${o.s.name} at ${Math.round(el)}°`); }
    });
    beamGeo.setFromPoints(seg);
    const now = performance.now();
    if (now - lastRead > 300) {
      lastRead = now; const ll = toLatLon(p);
      const where = `${Math.abs(ll.lat).toFixed(1)}° ${ll.lat >= 0 ? 'N' : 'S'}, ${Math.abs(ll.lon).toFixed(1)}° ${ll.lon >= 0 ? 'E' : 'W'}`;
      onRead({ t, where, seen, offset });
    }
    return pos;
  }

  /* camera: arrives from deep space, then sits with Africa slightly right of centre on wide screens */
  let W = 1, H = 1, arrive = reduce ? 1 : 0, arriveStart = null;
  const home = v3(4, 18, 1);
  function frame() {
    const e = 1 - Math.pow(1 - arrive, 3);
    const dist = 5.2 + (1 - e) * 7;
    const spin = (1 - e) * 1.2;
    const dir = home.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), -spin).normalize();
    return dir.multiplyScalar(dist);
  }
  camera.position.copy(frame()); camera.lookAt(0, 0, 0); controls.update();

  function resize() {
    W = host.clientWidth; H = host.clientHeight;
    renderer.setSize(W, H, false); camera.aspect = W / H;
    const wide = W / H > 1.1;
    /* portrait: widen the view until the globe fits the width with a margin, and lift it into the top half so the words sit below it */
    camera.fov = wide ? 30 : Math.max(40, 2 * Math.atan(Math.tan(Math.asin(1 / 5.2)) / 0.8 / (W / H)) * 180 / Math.PI);
    if (wide) camera.setViewOffset(W, H, -W * 0.2, 0, W, H); else camera.setViewOffset(W, H, 0, H * (W / H < 0.75 ? 0.21 : 0.12), W, H);
    camera.updateProjectionMatrix(); ratio.value = zoomRatio(); renderer.setPixelRatio(zoomRatio());
  }
  new ResizeObserver(resize).observe(host); resize();

  const tmp = new THREE.Vector3();
  function place(el, world) {
    tmp.copy(world).applyMatrix4(globe.matrixWorld);
    const facing = tmp.clone().normalize().dot(camera.position.clone().normalize()) > 0.2;
    tmp.project(camera);
    const x = (tmp.x * 0.5 + 0.5) * W, y = (-tmp.y * 0.5 + 0.5) * H;
    el.style.opacity = facing ? '1' : '0';
    el.style.left = `${x}px`; el.style.top = `${y}px`;
    el.style.transform = x + el.offsetWidth + 16 > W ? 'translate(calc(-100% - 12px), -50%)' : '';
  }
  function unclash(el, others) {
    const r = el.getBoundingClientRect();
    for (const o of others) {
      const q = o.getBoundingClientRect();
      if (o.style.opacity !== '0' && r.left < q.right && r.right > q.left && r.top < q.bottom + 4 && r.bottom > q.top - 4) {
        el.style.transform = `${el.style.transform || 'translate(12px, -50%)'} translateY(${r.top < q.top ? -120 : 120}%)`; return;
      }
    }
  }

  /* pointer parallax */
  let px = 0, py = 0, tx = 0, ty = 0;
  host.parentElement.addEventListener('pointermove', e => { const r = host.getBoundingClientRect(); tx = (e.clientX - r.left) / r.width - 0.5; ty = (e.clientY - r.top) / r.height - 0.5; });

  let visible = true, last = performance.now(), dragged = false, fade = 1;
  controls.addEventListener('start', () => { dragged = true; });
  new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) { last = performance.now(); requestAnimationFrame(loop); } }).observe(host);

  function loop(now) {
    if (!visible) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    clock += dt;
    if (arriveStart === null && document.documentElement.classList.contains('go')) arriveStart = now;
    if (arriveStart !== null && arrive < 1) { arrive = Math.min(1, (now - arriveStart) / 2600); if (!dragged) { camera.position.copy(frame()); camera.lookAt(0, 0, 0); } }
    if (!reduce) { landMat.uniforms.reveal.value = Math.min(1, landMat.uniforms.reveal.value + dt * 0.55 * (arriveStart !== null ? 1 : 0)); }
    px += (tx - px) * 0.04; py += (ty - py) * 0.04;
    globe.rotation.y = reduce ? 0 : px * 0.25; globe.rotation.x = reduce ? 0 : py * 0.12;
    const r = host.getBoundingClientRect(); const out = Math.min(1, Math.max(0, -r.top / r.height));
    fade = 1 - out; globe.scale.setScalar(1 - out * 0.18); host.style.opacity = String(0.25 + 0.75 * fade);
    satDot.material.uniforms.time.value = clock; scene.children[1].material.uniforms.time.value = clock;
    const pos = step(simTime());
    controls.update(); renderer.render(scene, camera);
    st.forEach(o => place(o.el, o.p)); place(satLabel, pos); unclash(satLabel, st.map(o => o.el));
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  return { setOffset(min) { offset = min; clock = 0; lastWake = -1e9; }, base };
}
