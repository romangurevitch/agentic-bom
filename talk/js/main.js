// Step engine, camera flights, HUD, keyboard and mouse controls.

import * as THREE from 'three';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';
import { EffectComposer } from '../vendor/postprocessing/EffectComposer.js';
import { RenderPass } from '../vendor/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '../vendor/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from '../vendor/postprocessing/ShaderPass.js';
import { OutputPass } from '../vendor/postprocessing/OutputPass.js';
import { VignetteShader } from '../vendor/shaders/VignetteShader.js';
import { buildWorld, COLORS, LABEL_LAYER } from './world.js';
import { STEPS, ACTS } from './steps.js';
import { Tween } from './tween.js';

const $ = id => document.getElementById(id);

let renderer = null;
let composer = null;
let bloom = null;
let vignette = null;
let scene, camera, world;
let stepIndex = 0;
let subIndex = 0;
let currentCam = null;
let orbitActive = false;
let orbitManual = false;
let orbitAngle = 0;
let orbitRadius = 70;
let orbitHeight = 45;
const camTween = new Tween();
const camPos = new THREE.Vector3();
const camTarget = new THREE.Vector3();

// user camera offsets from mouse drag / wheel, composed on top of each shot
let userTheta = 0;
let userPhi = 0;
let userZoom = 1;

// ---------- boot ----------

try {
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  $('scene').appendChild(renderer.domElement);
} catch (err) {
  console.warn('WebGL unavailable, overlay-only mode', err);
  document.body.classList.add('no3d');
}

if (renderer) {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.5, 900);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  // post chain: linear HDR render -> bloom on the glow accents -> vignette ->
  // tone mapping + sRGB in OutputPass. Labels live on their own layer and are
  // drawn afterwards so bloom never blurs text.
  const target = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
    type: THREE.HalfFloatType,
    samples: 2,
  });
  composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));
  bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.5, 0.45, 0.7);
  composer.addPass(bloom);
  vignette = new ShaderPass(VignetteShader);
  vignette.uniforms.offset.value = 1.15;
  vignette.uniforms.darkness.value = 1.1;
  composer.addPass(vignette);
  composer.addPass(new OutputPass());

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
  });
}

// ---------- step engine ----------

function screenNo() { return stepIndex + 1; }

const prevVisible = new Map();

function updateWorldVisibility() {
  if (!world) return;
  const n = screenNo();
  for (const g of Object.values(world.groups)) {
    if (g.userData.bornAt === undefined) continue;
    g.visible = n >= g.userData.bornAt && n < g.userData.dieAt;
    // a component newly delivered on its own screen materializes in place
    // (the line has its own per-room pop animation)
    const was = prevVisible.get(g.userData.name) || false;
    if (g.visible && !was && g.userData.bornAt === n && n >= 4 && g.userData.name !== 'line') {
      world.materialize(g.userData.name);
    }
    prevVisible.set(g.userData.name, g.visible);
  }
  // stations and workflow candidates outside their own screens
  if (n !== 9) world.setStationCount(7);
  world.setMetaState(n, n === 8 ? subIndex : null);
  world.setInfraFocus(n === 18 ? subIndex : null);
  world.setGovFocus(n === 19 ? subIndex : null);
  world.updateLabels(n);
}

function applyStep(animateCamera = true) {
  const step = STEPS[stepIndex];

  // profile depths first, then the visibility pass corrects unborn groups
  if (world) {
    if (step.profiles) world.applyProfile(step.profiles[subIndex]);
    else world.applyProfile(null);
    updateWorldVisibility();
    if (step.onSubstep) step.onSubstep(world, subIndex);
  }

  updateHud(step);

  if (world) {
    orbitActive = !!step.orbit || orbitManual;
    // a sub-step may carry its own shot (e.g. screen 8's choose step pulls
    // back to frame the foundry and the factory during the flight)
    const cam = (step.subCams && step.subCams[subIndex]) || step.cam;
    if (animateCamera || cam !== currentCam) flyTo(cam);
    currentCam = cam;
  }
  location.hash = `s=${screenNo()}.${subIndex}`;
}

function flyTo(cam) {
  userTheta = 0;
  userPhi = 0;
  userZoom = 1;
  userPan.set(0, 0, 0);
  const from = {
    px: camPos.x, py: camPos.y, pz: camPos.z,
    tx: camTarget.x, ty: camTarget.y, tz: camTarget.z,
  };
  const to = {
    px: cam.pos[0], py: cam.pos[1], pz: cam.pos[2],
    tx: cam.target[0], ty: cam.target[1], tz: cam.target[2],
  };
  camTween.start(from, to, 1.7, v => {
    camPos.set(v.px, v.py, v.pz);
    camTarget.set(v.tx, v.ty, v.tz);
  });
  // seed orbit params from the destination shot
  const dx = to.px - to.tx, dz = to.pz - to.tz;
  orbitRadius = Math.sqrt(dx * dx + dz * dz);
  orbitHeight = to.py;
  orbitAngle = Math.atan2(dz, dx);
}

function next() {
  const step = STEPS[stepIndex];
  const subs = step.substeps || 1;
  if (subIndex < subs - 1) {
    subIndex += 1;
    applyStep(false);
    return;
  }
  if (stepIndex < STEPS.length - 1) {
    stepIndex += 1;
    subIndex = 0;
    orbitManual = false;
    applyStep(true);
  }
}

function prev() {
  if (subIndex > 0) {
    subIndex -= 1;
    applyStep(false);
    return;
  }
  if (stepIndex > 0) {
    stepIndex -= 1;
    const step = STEPS[stepIndex];
    subIndex = (step.substeps || 1) - 1;
    orbitManual = false;
    applyStep(true);
  }
}

function goto(step, sub = 0) {
  if (freeRoam) setRoam(false);
  stepIndex = Math.max(0, Math.min(STEPS.length - 1, step - 1));
  subIndex = Math.max(0, Math.min((STEPS[stepIndex].substeps || 1) - 1, sub));
  orbitManual = false;
  applyStep(true);
}
window.__goto = goto;

// ---------- free roam ----------
// The whole plant lit and running, deck chrome and floating labels hidden;
// only the fixed in-world signage remains. Toggled with F, shareable as #roam.

let freeRoam = false;
const FULL_PLANT = 21; // the "full plant" screen: every finished group alive
const ROAM_CAM = { pos: [58, 46, 48], target: [2, 2, -14] };

function setRoam(on) {
  if (!world || freeRoam === on) return;
  freeRoam = on;
  world.roam = on;
  document.body.classList.toggle('roam', on);
  orbitManual = false;
  if (on) {
    world.applyProfile(null);
    world.setInfraFocus(null);
    world.setStationCount(7);
    for (const g of Object.values(world.groups)) {
      if (g.userData.bornAt === undefined) continue;
      g.visible = FULL_PLANT >= g.userData.bornAt && FULL_PLANT < g.userData.dieAt;
      prevVisible.set(g.userData.name, g.visible);
    }
    // sets currentScreen so the product journeys run end to end; the roam
    // flag makes this pass hide every floating sprite
    world.updateLabels(FULL_PLANT);
    orbitActive = false;
    flyTo(ROAM_CAM);
    currentCam = ROAM_CAM;
    location.hash = 'roam';
  } else {
    applyStep(true);
  }
}

// ---------- HUD ----------

function updateHud(step) {
  const accent = step.accent;
  document.documentElement.style.setProperty('--accent', accent);

  $('act').textContent = `Act ${['I', 'II', 'III', 'IV', 'V', 'VI'][step.act - 1]} · ${ACTS[step.act - 1]}`;
  $('kicker').textContent = step.kicker;
  $('title').textContent = step.title;
  $('bullets').innerHTML = step.bullets.map(b => `<li>${b}</li>`).join('');
  // each step carries its own QR panel: { img, title, url }
  $('qr').style.display = step.qr ? 'flex' : 'none';
  if (step.qr) {
    $('qrimg').src = step.qr.img;
    $('qrtitle').textContent = step.qr.title;
    $('qrurl').textContent = step.qr.url;
  }
  $('stepnum').textContent = `${String(screenNo()).padStart(2, '0')} / ${STEPS.length}`;

  const dots = STEPS.map((s, i) =>
    `<span class="dot${i === stepIndex ? ' on' : ''}" style="--dc:${s.accent}"></span>`).join('');
  $('dots').innerHTML = dots;

  const chips = $('chips');
  if (step.subLabels) {
    chips.style.display = 'flex';
    const isOn = i => (step.chipMode === 'single' ? i === subIndex : i <= subIndex);
    chips.innerHTML = step.subLabels.map((l, i) =>
      `<span class="chip${isOn(i) ? ' on' : ''}${i === subIndex ? ' cur' : ''}">${l}</span>`).join('');
  } else {
    chips.style.display = 'none';
  }

  $('notes').innerHTML = step.notes.map(nt => `<li>${nt}</li>`).join('');
}

// ---------- theme ----------
// T flips between the night look (default) and daylight; persisted so the
// choice survives reloads. The head script pre-sets the html class, this
// carries the same choice into the 3D scene and the post chain: on a light
// sky the bloom threshold must climb above the background's luminance or
// the whole frame glows, and the vignette softens so corners stay clean.

let themeLight = document.documentElement.classList.contains('light');

function applyTheme() {
  document.documentElement.classList.toggle('light', themeLight);
  try { localStorage.setItem('theme', themeLight ? 'light' : 'dark'); } catch { /* fine */ }
  if (bloom) {
    bloom.threshold = themeLight ? 0.95 : 0.7;
    bloom.strength = themeLight ? 0.35 : 0.5;
  }
  // the vignette mixes corners toward (1 - darkness): a focus device at
  // night, but on a light frame it reads as grey mist, so day disables it
  if (vignette) vignette.enabled = !themeLight;
  if (world) world.setTheme(themeLight);
}

// ---------- keyboard ----------

// HUD scale: -/+ resizes the card; persisted so a projector setup sticks
let hudScale = Number(localStorage.getItem('hudScale')) || 1;
function applyHudScale() {
  hudScale = THREE.MathUtils.clamp(hudScale, 0.55, 1.5);
  document.documentElement.style.setProperty('--hud-scale', hudScale);
  localStorage.setItem('hudScale', String(hudScale));
}
applyHudScale();

// P toggles browser fullscreen: while presenting, the tab bar and window
// chrome cost real pixels on a projector. Escape (browser-native) exits.
function toggleFullscreen() {
  const el = document.documentElement;
  if (!document.fullscreenElement && !document.webkitFullscreenElement) {
    (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
  } else {
    (document.exitFullscreen || document.webkitExitFullscreen).call(document);
  }
}

window.addEventListener('keydown', e => {
  if (e.key === 'f' || e.key === 'F') { setRoam(!freeRoam); return; }
  if (e.key === 't' || e.key === 'T') { themeLight = !themeLight; applyTheme(); return; }
  if (e.key === 'p' || e.key === 'P') { toggleFullscreen(); return; }
  if (freeRoam) {
    // any deck navigation drops back into the talk at the step you left
    if (e.key === 'Escape' || e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown'
      || e.key === 'ArrowLeft' || e.key === 'PageUp' || e.key === 'r' || e.key === 'R'
      || (e.key >= '1' && e.key <= '6')) { e.preventDefault(); setRoam(false); }
    else if (e.key === 'o' || e.key === 'O') { orbitManual = !orbitManual; orbitActive = orbitManual; }
    return;
  }
  if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); next(); }
  else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); prev(); }
  else if (e.key === '-' || e.key === '_') { hudScale -= 0.08; applyHudScale(); }
  else if (e.key === '=' || e.key === '+') { hudScale += 0.08; applyHudScale(); }
  else if (e.key === 'n' || e.key === 'N') document.body.classList.toggle('shownotes');
  else if (e.key === 'o' || e.key === 'O') { orbitManual = !orbitManual; orbitActive = orbitManual || !!STEPS[stepIndex].orbit; }
  else if (e.key === 'r' || e.key === 'R') goto(1);
  else if (e.key >= '1' && e.key <= '6') {
    const act = Number(e.key);
    const first = STEPS.findIndex(s => s.act === act);
    if (first >= 0) goto(first + 1);
  }
});
// WASD trucks the camera over the plant: forward/back along the view
// direction (kept horizontal), strafe left/right. Works everywhere, but
// it is the free-roam walk. Tracked as a set so held keys glide per-frame.
const moveKeys = new Set();
window.addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key.toLowerCase();
  if (k === 'w' || k === 'a' || k === 's' || k === 'd') moveKeys.add(k);
});
window.addEventListener('keyup', e => moveKeys.delete(e.key.toLowerCase()));
window.addEventListener('blur', () => moveKeys.clear());

// mouse: drag rotates the scene around the current shot's target, wheel
// zooms, shift+drag pans the camera sideways/up-down (truck/pedestal)
let dragging = false;
let panDrag = false;
let lastX = 0;
let lastY = 0;
const userPan = new THREE.Vector3();
const panRight = new THREE.Vector3();
const panUp = new THREE.Vector3();
window.addEventListener('pointerdown', e => {
  if (e.target.closest('#card') || e.target.closest('#notesbar') || e.target.closest('#hint')) return;
  if (e.button !== 0) return;
  dragging = true;
  panDrag = e.shiftKey;
  lastX = e.clientX;
  lastY = e.clientY;
});
window.addEventListener('pointermove', e => {
  if (!dragging) return;
  if (panDrag && camera) {
    const k = camSpherical.radius * 0.0016;
    panRight.setFromMatrixColumn(camera.matrix, 0);
    panUp.setFromMatrixColumn(camera.matrix, 1);
    userPan.addScaledVector(panRight, -(e.clientX - lastX) * k);
    userPan.addScaledVector(panUp, (e.clientY - lastY) * k);
  } else {
    userTheta -= (e.clientX - lastX) * 0.005;
    userPhi -= (e.clientY - lastY) * 0.003;
    userPhi = THREE.MathUtils.clamp(userPhi, -1.2, 1.2);
  }
  lastX = e.clientX;
  lastY = e.clientY;
});
window.addEventListener('pointerup', () => { dragging = false; });
window.addEventListener('pointercancel', () => { dragging = false; });
window.addEventListener('wheel', e => {
  if (e.target.closest('#card') || e.target.closest('#notesbar')) return;
  userZoom = THREE.MathUtils.clamp(userZoom * (1 + e.deltaY * 0.001), 0.35, 2.6);
}, { passive: true });

// ---------- render loop ----------

const clock = renderer ? new THREE.Clock() : null;
const camOffset = new THREE.Vector3();
const camSpherical = new THREE.Spherical();
const lookTarget = new THREE.Vector3();
const moveFwd = new THREE.Vector3();
const moveRight = new THREE.Vector3();
const moveDir = new THREE.Vector3();
const WORLD_UP = new THREE.Vector3(0, 1, 0);

function frame() {
  requestAnimationFrame(frame);
  if (!renderer) return;
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  camTween.update(dt);
  if (orbitActive && !camTween.active && !dragging) {
    orbitAngle += dt * 0.1;
    camPos.set(
      camTarget.x + Math.cos(orbitAngle) * orbitRadius,
      orbitHeight,
      camTarget.z + Math.sin(orbitAngle) * orbitRadius
    );
  }
  // compose the user's drag/zoom offsets on top of the shot camera
  camOffset.subVectors(camPos, camTarget);
  camSpherical.setFromVector3(camOffset);
  camSpherical.theta += userTheta;
  camSpherical.phi = THREE.MathUtils.clamp(camSpherical.phi + userPhi, 0.08, Math.PI - 0.08);
  camSpherical.radius = Math.max(4, camSpherical.radius * userZoom);
  // WASD glide: speed scales with distance so it feels right at any zoom
  if (moveKeys.size) {
    moveFwd.setFromSpherical(camSpherical).negate();
    moveFwd.y = 0;
    if (moveFwd.lengthSq() < 1e-6) moveFwd.set(0, 0, -1);
    moveFwd.normalize();
    moveRight.crossVectors(moveFwd, WORLD_UP).normalize();
    moveDir.set(0, 0, 0);
    if (moveKeys.has('w')) moveDir.add(moveFwd);
    if (moveKeys.has('s')) moveDir.sub(moveFwd);
    if (moveKeys.has('a')) moveDir.sub(moveRight);
    if (moveKeys.has('d')) moveDir.add(moveRight);
    if (moveDir.lengthSq() > 0) {
      userPan.addScaledVector(moveDir.normalize(), camSpherical.radius * 0.4 * dt);
    }
  }
  lookTarget.copy(camTarget).add(userPan);
  camera.position.setFromSpherical(camSpherical).add(lookTarget);
  camera.lookAt(lookTarget);

  for (const a of world.animators) a.update(t, dt);
  composer.render();
  // labels render on top of the post chain, crisp and un-bloomed; the
  // background must be nulled or three force-clears the composed frame
  const bg = scene.background;
  scene.background = null;
  renderer.autoClear = false;
  camera.layers.set(LABEL_LAYER);
  renderer.render(scene, camera);
  camera.layers.set(0);
  renderer.autoClear = true;
  scene.background = bg;
}

// ---------- start ----------

(async function start() {
  // labels are drawn to canvas at build time, so the font must be ready first
  try { await document.fonts.load('700 52px "Space Grotesk"'); } catch { /* system fallback */ }
  if (renderer) world = buildWorld(scene);
  window.__world = world; // debug handle, like __goto
  applyTheme();
  const wantRoam = /roam/.test(location.hash); // applyStep rewrites the hash
  const m = location.hash.match(/s=(\d+)(?:\.(\d+))?/);
  const s = m ? Number(m[1]) : 1;
  const sub = m ? Number(m[2] || 0) : 0;
  stepIndex = Math.max(0, Math.min(STEPS.length - 1, s - 1));
  subIndex = sub;
  const cam = STEPS[stepIndex].cam;
  camPos.set(...cam.pos);
  camTarget.set(...cam.target);
  applyStep(false);
  if (wantRoam) setRoam(true);
  if (renderer) frame();
})();
