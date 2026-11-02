/* Harmattan Orbital · one real pass over Kano, told by scroll. The path across the sky is the sample satellite's next pass,
   computed from the orbit; the dish turns to the same azimuth and elevation the readouts show. */
import * as THREE from 'three';
import { STATIONS, satEcef, lookAngles, passes, MASK } from './orbit.js';
import { colour, stars, zoomRatio } from './globe.js';

const D = Math.PI / 180;
const R = 10; // radius of the sky dome
const sky = (az, el, r = R) => new THREE.Vector3(r * Math.cos(el * D) * Math.sin(az * D), r * Math.sin(el * D), -r * Math.cos(el * D) * Math.cos(az * D));

function textSprite(txt, col) {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  g.fillStyle = col; g.font = `500 64px ${getComputedStyle(document.documentElement).getPropertyValue('--font-display')}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 64, 64);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, opacity: 0.7 }));
  s.scale.setScalar(0.9); return s;
}

export function createPass(host, { reduce, onRead }) {
  const kano = STATIONS.find(s => s.id === 'kano');
  const now = Date.now();
  const pass = passes(kano, now, 24)[0] || passes(kano, now, 48)[0];
  const N = 220, samples = [];
  for (let i = 0; i <= N; i++) { const t = pass.aos + (i / N) * (pass.los - pass.aos); samples.push({ t, ...lookAngles(kano, satEcef(t)) }); }

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(zoomRatio());
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
  host.appendChild(renderer.domElement);
  const C = { space: colour('--color-space'), paper: colour('--color-paper'), haze: colour('--color-haze'), accent: colour('--color-accent'), ink: colour('--color-ink'), star: colour('--color-star'), signal: colour('--color-signal'), muted: colour('--color-muted') };
  renderer.setClearColor(C.space);
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(C.space, 14, 40);
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
  const ratio = { value: zoomRatio() };

  const starField = stars(1200, 60, 2, C.star); scene.add(starField);

  /* the Harmattan on the horizon: a band of warm dust that thins with height */
  const band = new THREE.Mesh(new THREE.CylinderGeometry(34, 34, 18, 64, 1, true), new THREE.ShaderMaterial({
    side: THREE.BackSide, transparent: true, depthWrite: false, fog: false, uniforms: { haze: { value: C.haze } },
    vertexShader: `varying float vY; void main(){ vY = position.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 haze; varying float vY; void main(){ float k = smoothstep(9.0, -9.0, vY); k = pow(k, 3.0); gl_FragColor = vec4(haze * 0.55, k * 0.55); }`,
  }));
  band.position.y = 8; scene.add(band);

  /* ground: dark, with rings that fade into the dust */
  const ground = new THREE.Mesh(new THREE.CircleGeometry(60, 96), new THREE.ShaderMaterial({
    uniforms: { ink: { value: C.ink }, paper: { value: C.paper }, haze: { value: C.haze } },
    vertexShader: `varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 ink; uniform vec3 paper; uniform vec3 haze; varying vec2 vP;
      void main(){ float r = length(vP); float ring = smoothstep(0.04, 0.0, abs(fract(r / 2.0) - 0.5) - 0.46) * smoothstep(20.0, 2.0, r);
        vec3 c = mix(paper * 0.9, haze * 0.18, smoothstep(6.0, 40.0, r)); c += ink * ring * 0.05; gl_FragColor = vec4(c, 1.0); }`,
  }));
  ground.rotation.x = -Math.PI / 2; scene.add(ground);

  /* the sky dome: elevation rings and azimuth spokes, the 10° mask in amber */
  const domeMat = new THREE.LineBasicMaterial({ color: C.ink, transparent: true, opacity: 0.1 });
  for (const el of [30, 60]) { const p = []; for (let a = 0; a <= 360; a += 3) p.push(sky(a, el)); scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(p), domeMat)); }
  for (let a = 0; a < 360; a += 30) { const p = []; for (let el = 0; el <= 90; el += 3) p.push(sky(a, el)); scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(p), domeMat)); }
  const maskPts = []; for (let a = 0; a <= 360; a += 2) maskPts.push(sky(a, MASK / D));
  const maskLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(maskPts), new THREE.LineDashedMaterial({ color: C.accent, dashSize: 0.3, gapSize: 0.22, transparent: true, opacity: 0.8 }));
  maskLine.computeLineDistances(); scene.add(maskLine);
  [['N', 0], ['E', 90], ['S', 180], ['W', 270]].forEach(([t, a]) => { const s = textSprite(t, getComputedStyle(document.documentElement).getPropertyValue('--color-muted')); s.position.copy(sky(a, 2, R + 0.9)); scene.add(s); });

  /* the pass: the whole arc faint, the travelled part bright */
  const arcPts = samples.map(s => sky(s.az, s.el));
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(arcPts), new THREE.LineDashedMaterial({ color: C.ink, dashSize: 0.18, gapSize: 0.16, transparent: true, opacity: 0.3 })).computeLineDistances());
  const doneGeo = new THREE.BufferGeometry().setFromPoints(arcPts);
  const done = new THREE.Line(doneGeo, new THREE.LineBasicMaterial({ color: C.accent })); scene.add(done);

  const sat = new THREE.Points(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3()]), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, uniforms: { col: { value: C.accent }, ratio },
    vertexShader: `uniform float ratio; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * mv; gl_PointSize = 60.0 * ratio; }`,
    fragmentShader: `uniform vec3 col; void main(){ float d = length(gl_PointCoord - 0.5); float core = smoothstep(0.08, 0.0, d); float glow = pow(smoothstep(0.5, 0.0, d), 2.0) * 0.8; gl_FragColor = vec4(mix(col, vec3(1.0), core), core + glow); }`,
  }));
  scene.add(sat);

  /* the dish: pedestal, a yoke that turns in azimuth, a reflector that tilts in elevation, the feed at its focus */
  const metal = new THREE.MeshStandardMaterial({ color: C.ink.clone().lerp(C.paper, 0.38), roughness: 0.48, metalness: 0.45 });
  const dark = new THREE.MeshStandardMaterial({ color: C.ink.clone().lerp(C.paper, 0.72), roughness: 0.7, metalness: 0.3 });
  const dish = new THREE.Group(); scene.add(dish);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 1.0, 0.35, 32), dark); base.position.y = 0.17; dish.add(base);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.42, 2.4, 24), metal); post.position.y = 1.5; dish.add(post);
  const yaw = new THREE.Group(); yaw.position.y = 2.75; dish.add(yaw);
  const yoke = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.3, 0.6), dark); yaw.add(yoke);
  [-0.7, 0.7].forEach(x => { const arm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.0, 0.4), metal); arm.position.set(x, 0.5, 0); yaw.add(arm); });
  const tilt = new THREE.Group(); tilt.position.y = 0.95; yaw.add(tilt);
  const f = 1.15, prof = [];
  for (let i = 0; i <= 28; i++) { const r = (i / 28) * 2.1; prof.push(new THREE.Vector2(r, (r * r) / (4 * f))); }
  const reflGeo = new THREE.LatheGeometry(prof, 72); reflGeo.rotateX(-Math.PI / 2); reflGeo.translate(0, 0, 0.35);
  const refl = new THREE.Mesh(reflGeo, new THREE.MeshStandardMaterial({ color: C.ink.clone().lerp(C.paper, 0.18), roughness: 0.38, metalness: 0.25, side: THREE.DoubleSide }));
  tilt.add(refl);
  const rimPts = []; for (let a = 0; a <= 72; a++) { const t = (a / 72) * Math.PI * 2; rimPts.push(new THREE.Vector3(2.1 * Math.cos(t), 2.1 * Math.sin(t), -(2.1 * 2.1) / (4 * f) + 0.35)); }
  tilt.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(rimPts), new THREE.LineBasicMaterial({ color: C.accent, transparent: true, opacity: 0.8 })));
  const focusZ = -f + 0.35;
  const feed = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.14, 0.32, 16), dark); feed.rotation.x = Math.PI / 2; feed.position.z = focusZ; tilt.add(feed);
  const strutPts = [];
  for (let k = 0; k < 4; k++) { const t = (k / 4) * Math.PI * 2 + Math.PI / 4; const z = -(1.8 * 1.8) / (4 * f) + 0.35; strutPts.push(new THREE.Vector3(1.8 * Math.cos(t), 1.8 * Math.sin(t), z), new THREE.Vector3(0, 0, focusZ)); }
  tilt.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(strutPts), new THREE.LineBasicMaterial({ color: C.ink, transparent: true, opacity: 0.6 })));
  const feedTip = new THREE.Object3D(); feedTip.position.z = focusZ - 0.2; tilt.add(feedTip);

  scene.add(new THREE.HemisphereLight(C.ink.clone().lerp(C.signal, 0.15).multiplyScalar(0.55), C.haze.clone().multiplyScalar(0.25), 0.9));
  const key = new THREE.DirectionalLight(C.haze, 2.4); key.position.set(-8, 3, 6); scene.add(key);
  const rim = new THREE.DirectionalLight(C.ink.clone().lerp(C.signal, 0.3), 0.9); rim.position.set(6, 6, -8); scene.add(rim);
  const satLight = new THREE.PointLight(C.accent, 6, 18); scene.add(satLight);

  /* the downlink: a stream of light from the satellite into the feed */
  const BEAM = 48;
  const beamGeo = new THREE.BufferGeometry(); beamGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(BEAM * 3), 3));
  const beam = new THREE.Points(beamGeo, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, uniforms: { col: { value: C.signal }, ratio, amt: { value: 0 } },
    vertexShader: `uniform float ratio; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * mv; gl_PointSize = 7.0 * ratio * (12.0 / -mv.z); }`,
    fragmentShader: `uniform vec3 col; uniform float amt; void main(){ float d = length(gl_PointCoord - 0.5); gl_FragColor = vec4(col, smoothstep(0.5, 0.0, d) * amt); }`,
  }));
  scene.add(beam);

  /* camera sits behind the dish, opposite the middle of the pass, and swings a little as the pass runs */
  const mid = samples[Math.floor(N / 2)];
  const camAz = mid.az + 180;
  let W = 1, H = 1;
  function resize() {
    W = host.clientWidth; H = host.clientHeight; renderer.setSize(W, H, false); camera.aspect = W / H;
    camera.fov = W / H < 0.9 ? 62 : 42; camera.updateProjectionMatrix(); renderer.setPixelRatio(zoomRatio()); ratio.value = zoomRatio();
  }
  new ResizeObserver(resize).observe(host); resize();

  let target = 0, p = 0, visible = false, clock = 0, last = performance.now();
  new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) { last = performance.now(); requestAnimationFrame(loop); } }).observe(host);
  const tmp = new THREE.Vector3();

  function loop(nowMs) {
    if (!visible) return;
    const dt = Math.min(0.05, (nowMs - last) / 1000); last = nowMs; clock += dt;
    p += (target - p) * (reduce ? 1 : 0.08);
    const fi = p * N, i0 = Math.min(N - 1, Math.floor(fi)), k = fi - i0;
    const a = samples[i0], b = samples[i0 + 1];
    let daz = b.az - a.az; if (daz > 180) daz -= 360; if (daz < -180) daz += 360;
    const az = (a.az + daz * k + 360) % 360, el = a.el + (b.el - a.el) * k, range = a.range + (b.range - a.range) * k, t = a.t + (b.t - a.t) * k;
    const sp = sky(az, el);
    sat.geometry.attributes.position.setXYZ(0, sp.x, sp.y, sp.z); sat.geometry.attributes.position.needsUpdate = true; satLight.position.copy(sp);
    doneGeo.setDrawRange(0, Math.max(2, Math.round(fi) + 1));
    yaw.rotation.y = -az * D; tilt.rotation.x = el * D;
    dish.updateMatrixWorld(true);
    feedTip.getWorldPosition(tmp);
    const bp = beamGeo.attributes.position;
    for (let j = 0; j < BEAM; j++) { const u = ((j / BEAM) + clock * 0.6) % 1; bp.setXYZ(j, sp.x + (tmp.x - sp.x) * u, sp.y + (tmp.y - sp.y) * u, sp.z + (tmp.z - sp.z) * u); }
    bp.needsUpdate = true;
    beam.material.uniforms.amt.value = THREE.MathUtils.smoothstep(p, 0.3, 0.42) * (1 - THREE.MathUtils.smoothstep(p, 0.86, 0.97));
    const swing = (camAz + (p - 0.5) * 50) * D, dist = W / H < 0.9 ? 20 : 17;
    camera.position.set(Math.sin(swing) * dist, 2.6 + p * 0.8, -Math.cos(swing) * dist);
    camera.lookAt(0, 4.5, 0);
    starField.material.uniforms.time.value = clock;
    renderer.render(scene, camera);
    onRead({ t, az, el, range, p });
    requestAnimationFrame(loop);
  }

  return { set(v) { target = Math.max(0, Math.min(1, v)); if (visible && reduce) requestAnimationFrame(loop); }, pass };
}
