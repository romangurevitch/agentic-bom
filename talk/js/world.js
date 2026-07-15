// Builds the whole factory world. Pure scene construction plus animators.
// Visibility over time is driven from main.js via group.userData.bornAt / dieAt.
// Narrative rules the geometry serves:
//  - The Head Office and the Workflow Foundry are the TOP LEVEL of the
//    plant: a deck raised first, above where the intake will stand. The
//    business decides and creates the factory from up there, and its goals
//    and direction pipe straight down into the intake funnels. The Catalog
//    Marketplace on neutral ground serves MANY factories and the Head
//    Office consumes from it.
//  - One connected flow: five LEGO-style products assemble as they travel
//    funnel -> collector belt -> experience cell -> past each station room ->
//    dock, gaining one part per layer.
//  - Below the floor one connected service network (trunks, spine, risers,
//    conduits) drives the floors above.

import * as THREE from 'three';
import { RoundedBoxGeometry } from '../vendor/RoundedBoxGeometry.js';

export const COLORS = {
  bg: 0x0b0d10,
  input: 0x6ee7b7,
  exp: 0x60a5fa,
  life: 0xf59e0b,
  sdlc: 0xf472b6,
  agent: 0x38bdf8,
  cap: 0x34d399,
  std: 0xfbbf24,
  int: 0xc084fc,
  know: 0x22d3ee,
  dist: 0xfb7185,
  infra: 0x94a3b8,
  gov: 0xef4444,
  meas: 0x10b981,
  outcome: 0xfacc15,
  ink: 0xe6edf3,
  dim: 0x232a33,
  steel: 0x39434f,
  steelDark: 0x252d36,
  steelLight: 0x4c5865,
  skin: 0xc9b18f,
};

const STATION_NAMES = ['Define', 'Design', 'Build', 'Verify', 'Release', 'Operate', 'Measure'];
const STATION_X = i => -21 + i * 7;
const UNDER_Y = -12;
const GROUND_Y = -13.6;
const LOT_TOP = -12;      // paved lot surface the whole plant stands on
const ROOM_Z = -4.2;      // station rooms sit behind the belt line (belt at z 0)
// cells sit far enough north that their platforms (7 deep) never touch the
// station-room bases (room row back edge at z -6.8; platform front at -7.0)
const CELL_Z = -10.5;
const CELL_X = { IDE: -16, Portal: 0, Auto: 16 };
// the top level: Head Office + Workflow Foundry share a deck raised over
// the back of the plant, directly above the intake wall
const DECK_TOP = 13;
const OFFICE = new THREE.Vector3(-14, DECK_TOP, -28);
const FOUNDRY = new THREE.Vector3(12, DECK_TOP, -28);
// the Catalog Marketplace: neutral ground north-west of our plant, between it and
// the far plants; a full-size black-box factory in its own right
const MARKET = new THREE.Vector3(-58, 0, -68);
const LABEL_FONT = '"Space Grotesk", ui-sans-serif, sans-serif';
// labels render in a separate pass after post-processing, so bloom never
// blurs text; main.js draws this layer on top of the composed frame
export const LABEL_LAYER = 2;

// ---------- material / geometry helpers ----------

function mat(color, opts = {}) {
  const opacity = opts.opacity !== undefined ? opts.opacity : 1;
  const m = new THREE.MeshStandardMaterial({
    color,
    emissive: opts.glow ? (opts.emissive !== undefined ? opts.emissive : color) : 0x000000,
    emissiveIntensity: opts.glow ? (opts.ei !== undefined ? opts.ei : 0.5) : 0,
    roughness: opts.rough !== undefined ? opts.rough : 0.45,
    metalness: opts.metal !== undefined ? opts.metal : 0.35,
    // fully-opaque surfaces live in the opaque pass: keeping the whole
    // plant in the transparent pass made the per-frame distance sort
    // reshuffle big overlapping boxes during camera flights (visible
    // tearing mid-transition). setFade moves a material across passes
    // whenever an animation or factor dims it.
    transparent: opacity < 1,
    opacity,
    // glass panes must not write depth or they occlude their own interiors
    depthWrite: opts.depthWrite !== undefined ? opts.depthWrite : true,
    envMapIntensity: 0.55,
  });
  m.userData.baseOpacity = m.opacity;
  m.userData.baseEmissive = m.emissiveIntensity;
  m.userData.canBeOpaque = true;
  return m;
}

// every runtime opacity change goes through here so the material sits in
// the right render pass; only mat() materials may leave the transparent
// pass (holos, labels, lines and dust always blend)
function setFade(m, v) {
  m.opacity = v;
  if (m.userData.canBeOpaque) m.transparent = v < 0.999;
}

// additive light clamps to white against a bright sky, so the daylight
// theme swaps these materials to normal blending; holo and edge accents
// also darken there or their bright colors sink into the sky (setTheme)
const ADDITIVE_MATS = [];
const EDGE_MATS = [];

function holoMat(color, opacity = 0.5, additive = true) {
  const m = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  m.userData.baseOpacity = opacity;
  m.userData.baseEmissive = 0;
  if (additive) ADDITIVE_MATS.push(m);
  return m;
}

function shadowed(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function box(w, h, d, material, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  return shadowed(mesh);
}

function rbox(w, h, d, material, x = 0, y = 0, z = 0, r = 0.12) {
  const radius = Math.min(r, w / 2.2, h / 2.2, d / 2.2);
  const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, radius), material);
  mesh.position.set(x, y, z);
  return shadowed(mesh);
}

function cyl(rt, rb, h, material, x = 0, y = 0, z = 0, seg = 20) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), material);
  mesh.position.set(x, y, z);
  return shadowed(mesh);
}

function cone(r, h, material, x = 0, y = 0, z = 0, seg = 14) {
  const mesh = new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), material);
  mesh.position.set(x, y, z);
  return shadowed(mesh);
}

function torus(R, tube, material, x = 0, y = 0, z = 0, arc = Math.PI * 2) {
  const mesh = new THREE.Mesh(new THREE.TorusGeometry(R, tube, 10, 32, arc), material);
  mesh.position.set(x, y, z);
  return shadowed(mesh);
}

function edges(w, h, d, color, opacity = 0.5) {
  const geo = new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d));
  const m = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
  m.userData.baseOpacity = opacity;
  m.userData.baseEmissive = 0;
  EDGE_MATS.push(m);
  return new THREE.LineSegments(geo, m);
}

function tube(points, radius, material, segs = 24) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, segs, radius, 8), material);
  mesh.castShadow = false;
  mesh.userData.curve = curve;
  return mesh;
}

// tightens a polyline for CatmullRom: each corner gets short lead-in/out
// points so runs stay straight and bends read as pipe elbows, not sweeps
function elbow(pts, d = 0.9) {
  const v = pts.map(p => new THREE.Vector3(...p));
  const out = [v[0]];
  for (let i = 1; i < v.length - 1; i++) {
    const din = Math.min(d, v[i].distanceTo(v[i - 1]) * 0.4);
    const dout = Math.min(d, v[i].distanceTo(v[i + 1]) * 0.4);
    const a = v[i].clone().sub(v[i - 1]).normalize();
    const b = v[i + 1].clone().sub(v[i]).normalize();
    out.push(v[i].clone().addScaledVector(a, -din), v[i].clone().addScaledVector(b, dout));
  }
  out.push(v[v.length - 1]);
  return out.map(p => [p.x, p.y, p.z]);
}

// a real 90-degree conveyor turn: an annular-sector belt surface with
// curved side rails. The local arc spans xz angles -90..0 around the group
// origin (belt enters along x on the north side, leaves along z on the
// east side); rotY places the same piece at any corner orientation.
const BELT_TURN_R = 2.6;
function beltTurn(parent, cx, cz, rotY) {
  const Rc = BELT_TURN_R, w = 1.4;
  const g = new THREE.Group();
  const shape = new THREE.Shape();
  shape.absarc(0, 0, Rc + w, 0, Math.PI / 2, false);
  shape.absarc(0, 0, Rc - w, Math.PI / 2, 0, true);
  const surf = new THREE.Mesh(
    new THREE.ExtrudeGeometry(shape, { depth: 0.35, bevelEnabled: false, curveSegments: 24 }),
    mat(0x1b222b, { rough: 0.6, metal: 0.4 })
  );
  surf.rotation.x = -Math.PI / 2;
  surf.position.y = 0.445;
  shadowed(surf);
  g.add(surf);
  for (const rr of [Rc - w - 0.08, Rc + w + 0.08]) {
    const rail = torus(rr, 0.17, mat(COLORS.steel, { rough: 0.45, metal: 0.65 }), 0, 0.75, 0, Math.PI / 2);
    rail.rotation.x = -Math.PI / 2;
    g.add(rail);
  }
  g.position.set(cx, 0, cz);
  g.rotation.y = rotY;
  parent.add(g);
  return g;
}

// dresses a tube in the plant's shared pipe language: flange collars spaced
// along the run, the same joints the MCP pipes wear (scaled to the tube)
const FLANGE_UP = new THREE.Vector3(0, 1, 0);
function flangesAlong(parent, curve, radius, count = 3) {
  for (let i = 1; i <= count; i++) {
    const t = i / (count + 1);
    const f = cyl(radius * 1.6, radius * 1.6, Math.max(0.14, radius * 0.9),
      mat(COLORS.steelLight, { rough: 0.35, metal: 0.8 }), 0, 0, 0, 12);
    curve.getPointAt(t, f.position);
    f.quaternion.setFromUnitVectors(FLANGE_UP, curve.getTangentAt(t).normalize());
    f.castShadow = false;
    parent.add(f);
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function css(hex) {
  return '#' + hex.toString(16).padStart(6, '0');
}

// In-world labels speak the same panel language as the HTML HUD chrome:
// dark semi-opaque plate, thin line border, colored left accent bar.
function makeLabel(text, colorCss, scale = 1) {
  const pad = 30;
  const fontSize = 52;
  const accentW = 14;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.font = `700 ${fontSize}px ${LABEL_FONT}`;
  const w = Math.ceil(ctx.measureText(text).width) + pad * 2 + accentW;
  const h = fontSize + pad * 1.6;
  canvas.width = w;
  canvas.height = h;
  const c2 = canvas.getContext('2d');
  c2.fillStyle = 'rgba(13, 17, 22, 0.9)';
  roundRect(c2, 1.5, 1.5, w - 3, h - 3, 18);
  c2.fill();
  c2.save();
  roundRect(c2, 1.5, 1.5, w - 3, h - 3, 18);
  c2.clip();
  c2.fillStyle = colorCss;
  c2.fillRect(0, 0, accentW + 1.5, h);
  c2.restore();
  c2.strokeStyle = '#232a33';
  c2.lineWidth = 3;
  roundRect(c2, 1.5, 1.5, w - 3, h - 3, 18);
  c2.stroke();
  c2.font = `700 ${fontSize}px ${LABEL_FONT}`;
  c2.fillStyle = '#e6edf3';
  c2.textBaseline = 'middle';
  c2.fillText(text, pad + accentW, h / 2 + 3);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sm = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.95, depthTest: false });
  sm.userData.baseOpacity = 0.95;
  sm.userData.baseEmissive = 0;
  const sprite = new THREE.Sprite(sm);
  const aspect = w / h;
  sprite.scale.set(2.2 * aspect * scale, 2.2 * scale, 1);
  sprite.renderOrder = 50;
  sprite.layers.set(LABEL_LAYER);
  return sprite;
}

// nameplate drawn onto room/building geometry (a lit sign, not a floating label)
function makePlate(text, colorHex, w = 3.2, h = 0.72) {
  const cw = 512, ch = Math.round(512 * h / w);
  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const c = canvas.getContext('2d');
  c.fillStyle = 'rgba(10, 13, 17, 0.96)';
  roundRect(c, 2, 2, cw - 4, ch - 4, 16);
  c.fill();
  c.fillStyle = css(colorHex);
  c.fillRect(2, 2, 12, ch - 4);
  let fs = Math.round(ch * 0.55);
  c.font = `700 ${fs}px ${LABEL_FONT}`;
  // long names shrink to fit the plate instead of clipping at its edges
  while (fs > 10 && c.measureText(text).width > cw - 44) {
    fs -= 1;
    c.font = `700 ${fs}px ${LABEL_FONT}`;
  }
  c.fillStyle = '#e6edf3';
  c.textBaseline = 'middle';
  c.textAlign = 'center';
  c.fillText(text, cw / 2 + 6, ch / 2 + 2);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.98 });
  m.userData.baseOpacity = 0.98;
  m.userData.baseEmissive = 0;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
  mesh.castShadow = false;
  return mesh;
}

// shared grayscale noise, used as a roughnessMap so large flat surfaces
// read as worn material under the key light
let roughTex = null;
function noiseRoughness() {
  if (!roughTex) {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(128, 128);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 190 + Math.random() * 65;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    roughTex = new THREE.CanvasTexture(c);
    roughTex.wrapS = roughTex.wrapT = THREE.RepeatWrapping;
    roughTex.repeat.set(9, 9);
    roughTex.anisotropy = 8;
  }
  return roughTex;
}

// grass albedo: mottled patches plus thousands of leaning blade strokes.
// Night stays deep and desaturated so the terrain separates from the sky
// on a weak projector; day is a sunlit lawn with real green variation.
// Both are cached, and setTheme swaps the map between them.
let grassTexDay = null;
let grassTexNight = null;
function grassTexture(day = false) {
  const cached = day ? grassTexDay : grassTexNight;
  if (cached) return cached;
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = day ? '#48822f' : '#16241a';
  ctx.fillRect(0, 0, 512, 512);
  // everything draws wrapped across the canvas border, or the repeat
  // shows up as a checkerboard of clipped patches over the whole lawn
  const wrapped = (x, y, r, draw) => {
    for (const dx of [-512, 0, 512]) {
      for (const dy of [-512, 0, 512]) {
        const px = x + dx;
        const py = y + dy;
        if (px + r < 0 || px - r > 512 || py + r < 0 || py - r > 512) continue;
        draw(px, py);
      }
    }
  };
  // soft mottled patches: worn/lush variation, kept low-contrast so the
  // tiling never reads as a grid
  for (let i = 0; i < 52; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = 36 + Math.random() * 90;
    const h = day ? 86 + Math.random() * 38 : 118 + Math.random() * 30;
    const s = day ? 42 + Math.random() * 26 : 22 + Math.random() * 16;
    const l = day ? 25 + Math.random() * 15 : 7 + Math.random() * 8;
    wrapped(x, y, r, (px, py) => {
      const g = ctx.createRadialGradient(px, py, 0, px, py, r);
      g.addColorStop(0, `hsla(${h}, ${s}%, ${l}%, 0.28)`);
      g.addColorStop(1, 'hsla(0, 0%, 0%, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(px - r, py - r, r * 2, r * 2);
    });
  }
  // individual blades: short leaning strokes in a spread of greens
  ctx.lineCap = 'round';
  for (let i = 0; i < 4200; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const len = 3 + Math.random() * 7;
    const lean = (Math.random() - 0.5) * 4;
    const h = day ? 88 + Math.random() * 34 : 118 + Math.random() * 26;
    const s = day ? 46 + Math.random() * 26 : 20 + Math.random() * 18;
    const l = day ? 22 + Math.random() * 24 : 6 + Math.random() * 10;
    ctx.strokeStyle = `hsl(${h}, ${s}%, ${l}%)`;
    ctx.lineWidth = 1 + Math.random();
    ctx.globalAlpha = 0.45 + Math.random() * 0.55;
    wrapped(x, y, 12, (px, py) => {
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + lean, py - len);
      ctx.stroke();
    });
  }
  // sunlit tips catch the light and sell the day version's vibrancy
  if (day) {
    for (let i = 0; i < 800; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const lean = (Math.random() - 0.5) * 3;
      const len = 2 + Math.random() * 4;
      ctx.strokeStyle = `hsl(${84 + Math.random() * 26}, ${55 + Math.random() * 18}%, ${46 + Math.random() * 16}%)`;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.3 + Math.random() * 0.3;
      wrapped(x, y, 8, (px, py) => {
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + lean, py - len);
        ctx.stroke();
      });
    }
  }
  ctx.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(10, 8);
  tex.anisotropy = 8;
  if (day) grassTexDay = tex; else grassTexNight = tex;
  return tex;
}

// experience screens: the label lives ON the screen (Claude starburst + IDE,
// browser chrome + Portal)
function screenTexture(kind) {
  const c = document.createElement('canvas');
  c.width = 640;
  c.height = 400;
  const x = c.getContext('2d');
  x.fillStyle = '#0d1117';
  x.fillRect(0, 0, 640, 400);
  if (kind === 'ide') {
    x.fillStyle = '#161d26';
    x.fillRect(0, 0, 640, 54);
    x.fillStyle = '#20293a';
    x.fillRect(0, 54, 170, 346);
    const lineCols = ['#6ee7b7', '#60a5fa', '#c084fc', '#fbbf24', '#38bdf8'];
    for (let i = 0; i < 9; i++) {
      x.fillStyle = lineCols[i % 5];
      x.globalAlpha = 0.75;
      x.fillRect(200, 84 + i * 26, 90 + ((i * 83) % 240), 9);
    }
    x.globalAlpha = 1;
    // stylized Claude starburst
    const cx = 88, cy = 200, R = 52;
    x.strokeStyle = '#d97757';
    x.lineWidth = 13;
    x.lineCap = 'round';
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      x.beginPath();
      x.moveTo(cx + Math.cos(a) * 16, cy + Math.sin(a) * 16);
      x.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
      x.stroke();
    }
    x.font = `700 84px ${LABEL_FONT}`;
    x.fillStyle = '#e6edf3';
    x.fillText('IDE', 210, 330);
  } else {
    // browser chrome
    x.fillStyle = '#1a222d';
    x.fillRect(0, 0, 640, 64);
    x.fillStyle = '#242f3d';
    roundRect(x, 18, 14, 150, 36, 16);
    x.fill();
    roundRect(x, 186, 14, 380, 36, 16);
    x.fill();
    x.fillStyle = '#9aa7b2';
    x.font = `500 24px ${LABEL_FONT}`;
    x.fillText('factory.local', 206, 40);
    // globe icon
    const gx = 96, gy = 210, gr = 54;
    x.strokeStyle = '#60a5fa';
    x.lineWidth = 8;
    x.beginPath(); x.arc(gx, gy, gr, 0, Math.PI * 2); x.stroke();
    x.beginPath(); x.ellipse(gx, gy, gr * 0.45, gr, 0, 0, Math.PI * 2); x.stroke();
    x.beginPath(); x.moveTo(gx - gr, gy); x.lineTo(gx + gr, gy); x.stroke();
    x.beginPath(); x.moveTo(gx - gr * 0.87, gy - gr * 0.5); x.lineTo(gx + gr * 0.87, gy - gr * 0.5); x.stroke();
    x.beginPath(); x.moveTo(gx - gr * 0.87, gy + gr * 0.5); x.lineTo(gx + gr * 0.87, gy + gr * 0.5); x.stroke();
    x.fillStyle = '#22314a';
    roundRect(x, 190, 120, 400, 70, 10); x.fill();
    roundRect(x, 190, 210, 300, 50, 10); x.fill();
    roundRect(x, 190, 280, 340, 50, 10); x.fill();
    x.font = `700 84px ${LABEL_FONT}`;
    x.fillStyle = '#e6edf3';
    x.fillText('Portal', 210, 185);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// stylized low-poly person. outfit: 'worker' | 'casual' (tee + shorts) |
// 'suit' (dark suit, white shirt, tie)
function person(tint, seated = false, outfit = 'worker') {
  const g = new THREE.Group();
  const legH = seated ? 0.45 : 0.85;
  for (const side of [-1, 1]) {
    if (outfit === 'casual' && !seated) {
      // bare lower legs + dark shorts
      g.add(cyl(0.08, 0.1, legH * 0.55, mat(COLORS.skin, { rough: 0.7, metal: 0 }), side * 0.14, legH * 0.275, 0, 8));
      g.add(cyl(0.11, 0.12, legH * 0.5, mat(0x27303b, { rough: 0.75, metal: 0.05 }), side * 0.14, legH * 0.78, 0, 8));
    } else {
      const legC = outfit === 'suit' ? 0x232b36 : 0x2a323c;
      g.add(cyl(0.09, 0.11, legH, mat(legC, { rough: 0.7, metal: 0.05 }), side * 0.14, legH / 2, 0, 8));
    }
  }
  const bodyC = outfit === 'suit' ? 0x2b3440 : tint;
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.33, 0.62, 4, 10), mat(bodyC, { rough: 0.7, metal: 0.05 }));
  body.position.set(0, legH + 0.62, 0);
  shadowed(body);
  g.add(body);
  if (outfit === 'suit') {
    const shirt = rbox(0.3, 0.5, 0.1, mat(0xdde4ea, { rough: 0.6, metal: 0 }), 0, legH + 0.78, 0.28, 0.04);
    shirt.castShadow = false;
    g.add(shirt);
    const tie = rbox(0.09, 0.4, 0.05, mat(0x8a2635, { rough: 0.6, metal: 0 }), 0, legH + 0.74, 0.33, 0.02);
    tie.castShadow = false;
    g.add(tie);
  }
  for (const side of [-1, 1]) {
    const armC = outfit === 'casual' ? COLORS.skin : bodyC;
    const arm = cyl(0.07, 0.08, 0.62, mat(armC, { rough: 0.7, metal: 0.05 }), side * 0.44, legH + 0.62, 0.05, 8);
    arm.rotation.z = side * 0.25;
    arm.rotation.x = seated ? -0.7 : -0.1;
    g.add(arm);
  }
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 12), mat(COLORS.skin, { rough: 0.6, metal: 0 }));
  head.position.set(0, legH + 1.32, 0);
  shadowed(head);
  g.add(head);
  if (seated) {
    g.add(cyl(0.3, 0.26, 0.5, mat(COLORS.steelDark, { rough: 0.5, metal: 0.5 }), 0, 0.25, -0.32, 10));
  }
  g.userData.head = head;
  g.userData.legH = legH;
  return g;
}

// small worker robot; returns group plus animatable parts
function makeRobot(scale = 1) {
  const g = new THREE.Group();
  g.add(cyl(1.0, 1.2, 0.35, mat(COLORS.steelDark, { rough: 0.5, metal: 0.6 }), 0, 0.18, 0, 16));
  g.add(rbox(1.7, 1.9, 1.3, mat(0x3a4653, { rough: 0.35, metal: 0.65 }), 0, 1.35, 0, 0.25));
  g.add(rbox(1.3, 0.25, 1.0, mat(COLORS.agent, { glow: true, ei: 0.3, opacity: 0.9 }), 0, 0.45, 0, 0.08));
  const head = rbox(0.95, 0.75, 0.9, mat(COLORS.steelLight, { rough: 0.35, metal: 0.6 }), 0, 2.75, 0, 0.2);
  g.add(head);
  const visor = rbox(0.8, 0.28, 0.1, mat(COLORS.agent, { glow: true, ei: 1.0 }), 0, 2.78, 0.48, 0.04);
  visor.castShadow = false;
  g.add(visor);
  const arms = [];
  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    arm.add(cyl(0.13, 0.13, 1.1, mat(COLORS.steel, { rough: 0.4, metal: 0.7 }), 0, -0.55, 0, 10));
    const claw = cyl(0.2, 0.26, 0.3, mat(COLORS.agent, { glow: true, ei: 0.5 }), 0, -1.2, 0, 10);
    claw.castShadow = false;
    arm.add(claw);
    arm.position.set(side * 1.05, 2.0, 0);
    arm.rotation.z = side * 0.35;
    g.add(arm);
    arms.push(arm);
  }
  g.scale.setScalar(scale);
  return { g, head, arms };
}

// ---------- the screen-3 construction plan ----------
// A landscape mock structural drawing on millimeter paper: a scroll you
// open to show how complex the whole thing is. Deliberately drawing-like;
// component names appear as plan annotations, numbers live here only.
function sheetTexture() {
  const W = 2048, H = 1280;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const x = c.getContext('2d');
  x.fillStyle = '#0c141d';
  x.fillRect(0, 0, W, H);
  x.strokeStyle = 'rgba(64, 160, 190, 0.10)';
  x.lineWidth = 1;
  for (let g = 0; g <= W; g += 10) { x.beginPath(); x.moveTo(g, 0); x.lineTo(g, H); x.stroke(); }
  for (let g = 0; g <= H; g += 10) { x.beginPath(); x.moveTo(0, g); x.lineTo(W, g); x.stroke(); }
  x.strokeStyle = 'rgba(64, 160, 190, 0.22)';
  for (let g = 0; g <= W; g += 100) { x.beginPath(); x.moveTo(g, 0); x.lineTo(g, H); x.stroke(); }
  for (let g = 0; g <= H; g += 100) { x.beginPath(); x.moveTo(0, g); x.lineTo(W, g); x.stroke(); }
  x.strokeStyle = 'rgba(140, 210, 235, 0.85)';
  x.lineWidth = 4;
  x.strokeRect(28, 28, W - 56, H - 56);
  x.lineWidth = 1.5;
  x.strokeRect(40, 40, W - 80, H - 80);

  const ink = 'rgba(150, 215, 240, 0.9)';
  const inkDim = 'rgba(150, 215, 240, 0.55)';
  const line = (x1, y1, x2, y2, w = 2, col = ink, dash = null) => {
    x.strokeStyle = col; x.lineWidth = w;
    if (dash) x.setLineDash(dash);
    x.beginPath(); x.moveTo(x1, y1); x.lineTo(x2, y2); x.stroke();
    x.setLineDash([]);
  };
  const rect = (x1, y1, w1, h1, lw = 2, col = ink) => {
    x.strokeStyle = col; x.lineWidth = lw; x.strokeRect(x1, y1, w1, h1);
  };
  const arrow = (x1, y1, dir) => {
    x.fillStyle = ink;
    x.beginPath();
    if (dir === 'l') { x.moveTo(x1, y1); x.lineTo(x1 + 14, y1 - 5); x.lineTo(x1 + 14, y1 + 5); }
    else if (dir === 'r') { x.moveTo(x1, y1); x.lineTo(x1 - 14, y1 - 5); x.lineTo(x1 - 14, y1 + 5); }
    else if (dir === 'u') { x.moveTo(x1, y1); x.lineTo(x1 - 5, y1 + 14); x.lineTo(x1 + 5, y1 + 14); }
    else { x.moveTo(x1, y1); x.lineTo(x1 - 5, y1 - 14); x.lineTo(x1 + 5, y1 - 14); }
    x.closePath(); x.fill();
  };
  const dim = (x1, x2, y, label) => {
    line(x1, y, x2, y, 1.5, inkDim);
    line(x1, y - 8, x1, y + 8, 1.5, inkDim);
    line(x2, y - 8, x2, y + 8, 1.5, inkDim);
    arrow(x1, y, 'l'); arrow(x2, y, 'r');
    x.font = `500 22px ${LABEL_FONT}`;
    x.fillStyle = ink; x.textAlign = 'center';
    x.fillText(label, (x1 + x2) / 2, y - 10);
    x.textAlign = 'left';
  };
  const vdim = (y1, y2, xx, label) => {
    line(xx, y1, xx, y2, 1.5, inkDim);
    line(xx - 8, y1, xx + 8, y1, 1.5, inkDim);
    line(xx - 8, y2, xx + 8, y2, 1.5, inkDim);
    arrow(xx, y1, 'u'); arrow(xx, y2, 'd');
    x.save(); x.translate(xx - 12, (y1 + y2) / 2); x.rotate(-Math.PI / 2);
    x.font = `500 22px ${LABEL_FONT}`; x.fillStyle = ink; x.textAlign = 'center';
    x.fillText(label, 0, 0); x.restore();
  };
  const leader = (tx, ty, px, py, text) => {
    line(px, py, tx, ty, 1.5, inkDim);
    x.fillStyle = ink;
    x.beginPath(); x.arc(px, py, 4, 0, Math.PI * 2); x.fill();
    x.font = `600 23px ${LABEL_FONT}`;
    x.fillText(text, tx + 6, ty + 7);
  };
  // measured text: shrinks the font until the string fits its cell, so
  // annotations never cross table dividers or box borders
  const fitText = (text, tx, ty, maxW, weight, size, color = ink) => {
    let fs = size;
    x.font = `${weight} ${fs}px ${LABEL_FONT}`;
    while (fs > 10 && x.measureText(text).width > maxW) {
      fs -= 1;
      x.font = `${weight} ${fs}px ${LABEL_FONT}`;
    }
    x.fillStyle = color;
    x.fillText(text, tx, ty);
  };

  // ---- ELEVATION (left two thirds) ----
  const gy = 880;
  const ex0 = 120, ex1 = 1280;
  x.font = `700 26px ${LABEL_FONT}`;
  x.fillStyle = ink;
  x.fillText('ELEVATION A-A  ·  THE AGENTIC FACTORY', ex0, 130);
  line(ex0 - 40, gy, ex1 + 120, gy, 3);
  for (let hx = ex0 - 40; hx < ex1 + 120; hx += 26) line(hx, gy, hx - 16, gy + 22, 1.2, inkDim);
  rect(ex0 + 60, gy - 150, 980, 150, 2.5);
  for (let ci = 0; ci < 12; ci++) {
    const cx = ex0 + 90 + ci * 85;
    line(cx, gy - 150, cx, gy, 1.5, inkDim);
  }
  x.fillStyle = 'rgba(150, 215, 240, 0.07)';
  x.fillRect(ex0 + 60, gy - 150, 980, 150);
  line(ex0 + 20, gy - 150, ex1 + 60, gy - 150, 4);
  for (const cx of [ex0 + 80, ex0 + 320, ex0 + 560, ex0 + 800, ex0 + 1020]) {
    line(cx, gy - 150, cx, gy - 420, 2.5);
  }
  line(ex0 + 40, gy - 420, ex1 + 40, gy - 420, 2.5, ink, [14, 8]);
  rect(ex0 + 60, gy - 400, 70, 250, 2.5);
  for (let f = 0; f < 5; f++) {
    const fx = ex0 + 150 + f * 180;
    x.strokeStyle = ink; x.lineWidth = 2;
    x.beginPath();
    x.moveTo(fx - 28, gy - 470); x.lineTo(fx + 28, gy - 470); x.lineTo(fx + 8, gy - 425); x.lineTo(fx - 8, gy - 425);
    x.closePath(); x.stroke();
    line(fx, gy - 425, fx, gy - 400, 1.5, inkDim);
  }
  for (let r = 0; r < 7; r++) {
    const rx = ex0 + 150 + r * 130;
    rect(rx, gy - 285, 96, 135, 2);
    line(rx, gy - 250, rx + 96, gy - 250, 1, inkDim);
  }
  line(ex0 + 120, gy - 160, ex1 - 20, gy - 160, 3);
  rect(ex1 - 40, gy - 330, 100, 180, 2.5);
  line(ex1 - 40, gy - 330, ex1 + 100, gy - 330, 2.5);
  dim(ex0 + 60, ex1 + 60, gy - 520, '62 000');
  dim(ex0 + 60, ex0 + 590, gy + 70, '31 000');
  dim(ex0 + 590, ex1 + 60, gy + 70, '31 000');
  vdim(gy - 420, gy, ex0 - 60, '13 600');
  x.strokeStyle = ink; x.lineWidth = 2.5;
  x.beginPath(); x.arc(ex1 + 105, gy - 470, 30, 0, Math.PI * 2); x.stroke();
  x.font = `700 24px ${LABEL_FONT}`; x.textAlign = 'center';
  x.fillStyle = ink;
  x.fillText('A', ex1 + 105, gy - 478);
  x.fillText('101', ex1 + 105, gy - 450);
  x.textAlign = 'left';
  leader(ex0 + 240, gy - 555, ex0 + 330, gy - 462, '01 CONTINUOUS INPUTS');
  leader(ex0 + 890, gy - 500, ex0 + 700, gy - 430, '02 EXPERIENCE CELLS');
  leader(ex0 + 910, gy - 350, ex0 + 830, gy - 260, '04 SDLC STATION ROOMS');
  leader(ex0 + 1000, gy - 115, ex0 + 900, gy - 162, '05 AGENT WORKFORCE');
  leader(ex0 + 500, gy - 60, ex0 + 420, gy - 75, '06-09 FOUNDATION LEVEL B1');
  leader(ex1 + 60, gy - 385, ex1 + 10, gy - 330, '10 DOCK');
  leader(ex0 + 150, gy + 96, ex0 + 200, gy + 2, '11 INFRASTRUCTURE · SLAB & SERVICES');

  // ---- PLAN (right third) ----
  const px0 = 1450, py0 = 170, pw = 470, ph = 560;
  // title sits a line above the 38 000 dimension so they never collide
  x.font = `700 26px ${LABEL_FONT}`;
  x.fillStyle = ink;
  x.fillText('PLAN  ·  LEVEL 0', px0, 104);
  rect(px0, py0, pw, ph, 2.5);
  for (let ci = 0; ci <= 4; ci++) {
    for (let rj = 0; rj <= 4; rj++) {
      const dotX = px0 + 40 + ci * 97, dotY = py0 + 50 + rj * 115;
      x.fillStyle = inkDim;
      x.beginPath(); x.arc(dotX, dotY, 5, 0, Math.PI * 2); x.fill();
      line(dotX - 12, dotY, dotX + 12, dotY, 1, inkDim);
      line(dotX, dotY - 12, dotX, dotY + 12, 1, inkDim);
    }
  }
  rect(px0 + 20, py0 + 20, pw - 40, 50, 2);
  for (let f = 0; f < 5; f++) rect(px0 + 40 + f * 82, py0 + 30, 30, 30, 1.5);
  for (let ce = 0; ce < 3; ce++) rect(px0 + 50 + ce * 140, py0 + 130, 90, 70, 2);
  line(px0 + 30, py0 + 300, px0 + pw - 30, py0 + 300, 3);
  for (let r = 0; r < 7; r++) rect(px0 + 35 + r * 58, py0 + 320, 44, 60, 1.5);
  line(px0 + 30, py0 + 430, px0 + pw - 30, py0 + 430, 2, ink, [10, 6]);
  rect(px0 + pw / 2 - 40, py0 + 470, 80, 60, 2.5);
  arrow(px0 + pw / 2, py0 + 465, 'd');
  x.font = `500 20px ${LABEL_FONT}`;
  x.fillStyle = inkDim;
  x.fillText('flow: intake to cells to line to dock', px0 + 30, py0 + ph - 16);
  dim(px0, px0 + pw, py0 - 24, '38 000');
  // annex row under the plan: two named boxes plus the north arrow, laid
  // out on a shared grid so nothing touches; sub-lines are fitted to boxes
  rect(px0, py0 + 590, 190, 90, 2, ink);
  fitText('HEAD OFFICE', px0 + 14, py0 + 640, 162, 600, 21, ink);
  fitText('TOP LEVEL · L1', px0 + 14, py0 + 666, 162, 500, 19, inkDim);
  rect(px0 + 210, py0 + 590, 190, 90, 2, ink);
  fitText('CATALOG MARKETPLACE', px0 + 224, py0 + 640, 162, 600, 21, ink);
  fitText('SERVES MANY PLANTS', px0 + 224, py0 + 666, 162, 500, 19, inkDim);
  const nx = px0 + pw - 32, ny = py0 + 635;
  x.strokeStyle = ink; x.lineWidth = 2.5;
  x.beginPath(); x.arc(nx, ny, 28, 0, Math.PI * 2); x.stroke();
  arrow(nx, ny - 20, 'u');
  x.font = `700 22px ${LABEL_FONT}`;
  x.fillStyle = ink;
  x.textAlign = 'center';
  x.fillText('N', nx, ny + 22);
  x.textAlign = 'left';

  // title block
  const tbx = W - 700, tby = H - 220;
  rect(tbx, tby, 640, 160, 3);
  line(tbx, tby + 54, tbx + 640, tby + 54, 2);
  line(tbx, tby + 106, tbx + 640, tby + 106, 2);
  line(tbx + 420, tby + 54, tbx + 420, tby + 160, 2);
  fitText('THE AGENTIC SDLC · BILL OF MATERIALS', tbx + 16, tby + 38, 608, 700, 28, '#e6edf3');
  fitText('mock structural plan · every part named', tbx + 16, tby + 90, 388, 500, 22);
  fitText('11 components · 2 systems · 1 loop', tbx + 16, tby + 142, 388, 500, 22);
  fitText('SHEET A-101 · 1:100', tbx + 436, tby + 90, 188, 500, 22);
  fitText('REV C · FOR REVIEW', tbx + 436, tby + 142, 188, 500, 22);
  const rvx = 60, rvy = H - 220;
  rect(rvx, rvy, 420, 160, 2);
  line(rvx, rvy + 40, rvx + 420, rvy + 40, 1.5);
  line(rvx + 60, rvy, rvx + 60, rvy + 160, 1.5);
  x.font = `600 20px ${LABEL_FONT}`;
  x.fillStyle = ink;
  x.fillText('REV', rvx + 10, rvy + 28);
  x.fillText('DESCRIPTION', rvx + 76, rvy + 28);
  x.font = `500 20px ${LABEL_FONT}`;
  x.fillStyle = inkDim;
  const revs = ['A  first issue', 'B  foundry added', 'C  catalog marketplace split out'];
  revs.forEach((r, i) => {
    x.fillText(r[0], rvx + 22, rvy + 70 + i * 38);
    x.fillText(r.slice(3), rvx + 76, rvy + 70 + i * 38);
    line(rvx, rvy + 84 + i * 38, rvx + 420, rvy + 84 + i * 38, 1, 'rgba(150,215,240,0.25)');
  });
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

// ---------- LEGO products ----------
// Five recognizable brick builds, one per input chute. Part 0 is the base
// (appears at the funnel); parts 1..8 are added at the cell and the seven
// stations; a complete product ships from the dock.
function buildProduct(kind) {
  const g = new THREE.Group();
  const parts = [];
  const P = (meshes) => {
    const pg = new THREE.Group();
    (Array.isArray(meshes) ? meshes : [meshes]).forEach(m => pg.add(m));
    pg.visible = false;
    g.add(pg);
    parts.push(pg);
    return pg;
  };
  const plate = (col = 0x39434f) => P(rbox(1.5, 0.22, 1.5, mat(col, { rough: 0.5, metal: 0.4 }), 0, 0.11, 0, 0.05));
  if (kind === 'rocket') {
    const white = 0xe8e4da, red = 0xef4444;
    plate();
    P(cyl(0.52, 0.62, 0.3, mat(0x4c5865, { rough: 0.4, metal: 0.6 }), 0, 0.37, 0, 12));
    P(cyl(0.44, 0.5, 0.55, mat(red, { rough: 0.45 }), 0, 0.8, 0, 12));
    P(cyl(0.42, 0.44, 0.8, mat(white, { rough: 0.4 }), 0, 1.47, 0, 12));
    P([-1, 1].map(s => { const f = rbox(0.16, 0.5, 0.5, mat(red, { rough: 0.45 }), s * 0.52, 0.62, 0, 0.04); f.rotation.z = s * -0.18; return f; }));
    P((() => { const w = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 10), mat(COLORS.know, { glow: true, ei: 0.8 })); w.position.set(0, 1.55, 0.38); w.castShadow = false; return w; })());
    P(cone(0.42, 0.55, mat(red, { rough: 0.45 }), 0, 2.12, 0));
    P(cyl(0.03, 0.03, 0.4, mat(COLORS.steelLight, { rough: 0.4, metal: 0.7 }), 0, 2.55, 0, 6));
    P((() => { const s = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), mat(COLORS.outcome, { glow: true, ei: 1.2 })); s.position.set(0, 2.78, 0); s.castShadow = false; return s; })());
  } else if (kind === 'house') {
    const wall = 0xe8dcc0, roofC = 0xb0563a;
    plate(0x3d4a3f);
    P(rbox(1.3, 0.5, 0.14, mat(wall, { rough: 0.6 }), 0, 0.47, 0.55, 0.03));
    P([rbox(0.14, 0.5, 1.0, mat(wall, { rough: 0.6 }), -0.58, 0.47, 0, 0.03), rbox(0.14, 0.5, 1.0, mat(wall, { rough: 0.6 }), 0.58, 0.47, 0, 0.03), rbox(1.3, 0.5, 0.14, mat(wall, { rough: 0.6 }), 0, 0.47, -0.55, 0.03)]);
    P(rbox(0.28, 0.44, 0.06, mat(0x8a5a2b, { rough: 0.6 }), -0.25, 0.44, 0.63, 0.02));
    P([rbox(0.26, 0.24, 0.06, mat(COLORS.outcome, { glow: true, ei: 0.5, opacity: 0.95 }), 0.28, 0.55, 0.63, 0.02), rbox(0.26, 0.24, 0.06, mat(COLORS.outcome, { glow: true, ei: 0.5, opacity: 0.95 }), -0.3, 0.55, -0.63, 0.02)]);
    P((() => { const r = rbox(1.05, 0.1, 1.5, mat(roofC, { rough: 0.55 }), -0.36, 0.98, 0, 0.03); r.rotation.z = 0.62; return r; })());
    P((() => { const r = rbox(1.05, 0.1, 1.5, mat(roofC, { rough: 0.55 }), 0.36, 0.98, 0, 0.03); r.rotation.z = -0.62; return r; })());
    P(rbox(0.18, 0.42, 0.18, mat(0x7d7468, { rough: 0.6 }), 0.42, 1.22, -0.3, 0.03));
    P((() => { const s = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), mat(0xffd9a0, { glow: true, ei: 1.0 })); s.position.set(0.42, 1.5, -0.3); s.castShadow = false; return s; })());
  } else if (kind === 'robot') {
    const body = 0x9fb2c4;
    plate();
    P([rbox(0.34, 0.24, 0.5, mat(COLORS.steelDark, { rough: 0.5, metal: 0.5 }), -0.24, 0.34, 0, 0.05), rbox(0.34, 0.24, 0.5, mat(COLORS.steelDark, { rough: 0.5, metal: 0.5 }), 0.24, 0.34, 0, 0.05)]);
    P([cyl(0.09, 0.11, 0.4, mat(body, { rough: 0.45, metal: 0.5 }), -0.22, 0.65, 0, 8), cyl(0.09, 0.11, 0.4, mat(body, { rough: 0.45, metal: 0.5 }), 0.22, 0.65, 0, 8)]);
    P(rbox(0.72, 0.72, 0.5, mat(body, { rough: 0.4, metal: 0.55 }), 0, 1.2, 0, 0.08));
    P([-1, 1].map(s => { const a = cyl(0.07, 0.08, 0.55, mat(body, { rough: 0.45, metal: 0.5 }), s * 0.46, 1.18, 0, 8); a.rotation.z = s * 0.25; return a; }));
    P(rbox(0.44, 0.36, 0.4, mat(COLORS.steelLight, { rough: 0.4, metal: 0.55 }), 0, 1.76, 0, 0.06));
    P((() => { const v = rbox(0.34, 0.12, 0.05, mat(COLORS.agent, { glow: true, ei: 1.0 }), 0, 1.78, 0.22, 0.02); v.castShadow = false; return v; })());
    P((() => { const s = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), mat(COLORS.agent, { glow: true, ei: 0.9 })); s.position.set(0, 1.24, 0.28); s.castShadow = false; return s; })());
  } else if (kind === 'rover') {
    const body = 0xf59e0b;
    plate(0x4a4038);
    P([-0.45, 0, 0.45].map(zz => cyl(0.16, 0.16, 0.12, mat(0x20262e, { rough: 0.7 }), -0.62, 0.16, zz, 10)).map(w => { w.rotation.z = Math.PI / 2; return w; }));
    P([-0.45, 0, 0.45].map(zz => cyl(0.16, 0.16, 0.12, mat(0x20262e, { rough: 0.7 }), 0.62, 0.16, zz, 10)).map(w => { w.rotation.z = Math.PI / 2; return w; }));
    P(rbox(1.05, 0.34, 1.25, mat(body, { rough: 0.5 }), 0, 0.42, 0, 0.06));
    P(rbox(0.6, 0.4, 0.55, mat(0xd8dde2, { rough: 0.4 }), 0, 0.79, -0.25, 0.06));
    P((() => { const a = cyl(0.04, 0.04, 0.6, mat(COLORS.steelLight, { rough: 0.5, metal: 0.6 }), 0.35, 0.85, 0.35, 6); a.rotation.x = -0.5; return a; })());
    P((() => { const d = cyl(0.22, 0.05, 0.12, mat(0xe8e4da, { rough: 0.4 }), 0.42, 1.15, 0.5, 12); d.rotation.x = -0.9; return d; })());
    P(cyl(0.025, 0.025, 0.5, mat(COLORS.steelLight, { rough: 0.5 }), -0.4, 1.2, -0.3, 6));
    P((() => { const s = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), mat(COLORS.outcome, { glow: true, ei: 1.1 })); s.position.set(0, 0.62, 0.68); s.castShadow = false; return s; })());
  } else {
    // bridge
    const tower = 0x94a3b8;
    plate(0x2e3a44);
    P(rbox(0.22, 0.9, 0.22, mat(tower, { rough: 0.45, metal: 0.5 }), -0.5, 0.66, 0, 0.04));
    P(rbox(0.22, 0.9, 0.22, mat(tower, { rough: 0.45, metal: 0.5 }), 0.5, 0.66, 0, 0.04));
    P(rbox(1.6, 0.1, 0.42, mat(0x475569, { rough: 0.5, metal: 0.4 }), 0, 0.62, 0, 0.03));
    P([rbox(0.3, 0.14, 0.3, mat(tower, { rough: 0.45, metal: 0.5 }), -0.5, 1.18, 0, 0.04), rbox(0.3, 0.14, 0.3, mat(tower, { rough: 0.45, metal: 0.5 }), 0.5, 1.18, 0, 0.04)]);
    P((() => { const w = tube([[-0.78, 0.68, 0.16], [-0.5, 1.12, 0.16], [0, 0.72, 0.16], [0.5, 1.12, 0.16], [0.78, 0.68, 0.16]], 0.022, mat(COLORS.know, { glow: true, ei: 0.6 }), 32); return w; })());
    P((() => { const w = tube([[-0.78, 0.68, -0.16], [-0.5, 1.12, -0.16], [0, 0.72, -0.16], [0.5, 1.12, -0.16], [0.78, 0.68, -0.16]], 0.022, mat(COLORS.know, { glow: true, ei: 0.6 }), 32); return w; })());
    P(rbox(1.5, 0.03, 0.2, mat(0xcbd5e1, { rough: 0.4 }), 0, 0.69, 0, 0.01));
    P([new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), mat(COLORS.gov, { glow: true, ei: 1.0 })), new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), mat(COLORS.gov, { glow: true, ei: 1.0 }))].map((s, i) => { s.position.set(i ? 0.5 : -0.5, 1.32, 0); s.castShadow = false; return s; }));
  }
  return { g, parts };
}

// ---------- world ----------

export function buildWorld(scene) {
  const groups = {};
  const animators = [];
  const world = { groups, animators };

  // label registry
  const labels = [];
  world.labels = labels;
  function lab(sprite, focus, opts = {}) {
    labels.push({ sprite, focus, band: !!opts.band, group: opts.group || null });
    return sprite;
  }
  world.currentScreen = 1;
  world.roam = false; // free roam hides every floating sprite; fixed plates carry the names
  world.updateLabels = screen => {
    world.currentScreen = screen;
    for (const L of labels) {
      if (world.roam) { L.sprite.visible = false; continue; }
      let vis = L.focus.includes(screen);
      if (!vis && L.band) {
        if (screen === 21) vis = true;
        else if (screen === 22 && L.group) {
          const m = world._modes[L.group];
          vis = m === undefined || m === 1;
        }
      }
      L.sprite.visible = vis;
    }
  };

  scene.background = new THREE.Color(COLORS.bg);
  scene.fog = new THREE.FogExp2(COLORS.bg, 0.0032);

  // lights
  const ambient = new THREE.AmbientLight(0xbfd0e0, 0.22);
  scene.add(ambient);
  const hemi = new THREE.HemisphereLight(0x8fb4d8, 0x1a2129, 0.35);
  scene.add(hemi);

  // Night (default) and daylight looks: only the sky, fog and ambient rig
  // swap; materials keep their palette so the plant reads the same. Bloom
  // and vignette retune in main.js, HUD chrome in CSS.
  world.setTheme = light => {
    world._light = light;
    const sky = light ? 0xd9e7f7 : COLORS.bg;
    scene.background.set(sky);
    scene.fog.color.set(sky);
    // a clear sunny day: barely-there aerial perspective, not mist
    scene.fog.density = light ? 0.0005 : 0.0032;
    ambient.color.set(light ? 0xffffff : 0xbfd0e0);
    ambient.intensity = light ? 0.5 : 0.22;
    hemi.color.set(light ? 0xdfeaf5 : 0x8fb4d8);
    hemi.groundColor.set(light ? 0x97a3b0 : 0x1a2129);
    hemi.intensity = light ? 0.55 : 0.35;
    // the sun bears down harder than the night key so forms stay crisp
    key.color.set(light ? 0xfff2dd : 0xf2e9dc);
    key.intensity = light ? 2.1 : 1.6;
    grassMat.map = grassTexture(light);
    for (const m of ADDITIVE_MATS) {
      m.blending = light ? THREE.NormalBlending : THREE.AdditiveBlending;
    }
    // accent tints write into baseColor (keeping the author color in
    // origColor) so the factor pass below composes with them cleanly
    for (const m of [...ADDITIVE_MATS, ...EDGE_MATS]) {
      if (!m.userData.origColor) m.userData.origColor = m.color.clone();
      const c = m.userData.origColor.clone();
      if (light) c.multiplyScalar(0.45);
      m.userData.baseColor = c;
      m.color.copy(c);
    }
    // thin edge lines live or die by opacity; day boosts them through
    // baseOpacity so the dim/focus factor passes keep scaling correctly
    for (const m of EDGE_MATS) {
      if (m.userData.baseOpacity0 === undefined) m.userData.baseOpacity0 = m.userData.baseOpacity;
      const nb = light ? Math.min(1, m.userData.baseOpacity0 * 1.6) : m.userData.baseOpacity0;
      if (m.userData.baseOpacity > 0) m.opacity = m.opacity / m.userData.baseOpacity * nb;
      m.userData.baseOpacity = nb;
    }
    // re-run the factor pass so active ghosts/focus pick up the theme's
    // dimming style (night fades to black, day greys out; see applyToObj)
    for (const n of Object.keys(groups)) world._applyFactors(groups[n]);
  };
  const key = new THREE.DirectionalLight(0xf2e9dc, 1.6);
  key.position.set(42, 70, 30);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -100;
  key.shadow.camera.right = 100;
  key.shadow.camera.top = 100;
  key.shadow.camera.bottom = -100;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 240;
  key.shadow.bias = -0.0005;
  key.shadow.normalBias = 0.03;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x6aa3ff, 0.35);
  rim.position.set(-50, 30, -40);
  scene.add(rim);
  const under = new THREE.PointLight(0x8ab4ff, 1.7, 110);
  under.position.set(0, -6, 0);
  scene.add(under);
  const underL = new THREE.PointLight(0x8ab4ff, 1.0, 80);
  underL.position.set(-30, -6, 4);
  scene.add(underL);
  const underR = new THREE.PointLight(0x8ab4ff, 1.0, 80);
  underR.position.set(30, -6, 4);
  scene.add(underR);

  function reg(name, bornAt, dieAt = Infinity) {
    const g = new THREE.Group();
    g.userData.bornAt = bornAt;
    g.userData.dieAt = dieAt;
    g.userData.name = name;
    groups[name] = g;
    scene.add(g);
    return g;
  }

  // ---- factor composition: profile mode x infra focus x birth ----
  // Each dynamic system owns object visibility; these factors only scale
  // material opacity/emissive. final = mode * focus * birth.
  world._modes = {};
  world._focus = {};
  world._birth = {};
  world._ghostK = 0.12;
  world._light = false; // setTheme keeps this current
  world._modeOf = g => {
    const n = g.userData && g.userData.name;
    return world._modes[n] !== undefined ? world._modes[n] : 1;
  };
  function factorOf(name) {
    const m = world._modes[name] !== undefined ? world._modes[name] : 1;
    const f = world._focus[name] !== undefined ? world._focus[name] : 1;
    const b = world._birth[name] !== undefined ? world._birth[name] : 1;
    // dim is the steady ghost/focus product; birth is a transient fade-in
    // and is kept apart so materializing groups keep writing depth
    return { k: m * f * b, dim: m * f, hot: world._focus[name] === 1 && Object.keys(world._focus).length > 0 };
  }
  // ghost tint for the day theme: dimming by opacity alone works at night
  // (components read as lights turning off), but under the sun everything
  // stays lit, so dimmed components desaturate toward clay grey instead;
  // the shape stays readable as "considered, not built"
  const GHOST_TINT = new THREE.Color(0x9fabb6);
  function applyToObj(obj, k, dim, hot) {
    const m = obj.material;
    if (!m || !m.userData || m.userData.baseOpacity === undefined) return;
    if (world._light && k < 1) {
      if (!m.userData.baseColor) m.userData.baseColor = m.color.clone();
      m.color.copy(m.userData.baseColor).lerp(GHOST_TINT, (1 - k) * 0.9);
      setFade(m, m.userData.baseOpacity * (0.14 + 0.86 * k));
    } else {
      if (m.userData.baseColor) m.color.copy(m.userData.baseColor);
      setFade(m, m.userData.baseOpacity * Math.max(k, 0.001));
    }
    if (m.emissiveIntensity !== undefined && m.userData.baseEmissive) {
      m.emissiveIntensity = m.userData.baseEmissive * (k >= 1 ? (hot ? 1.35 : 1) : k);
    }
    // ghosted/x-rayed surfaces must stop writing depth: mis-sorted
    // translucent boxes otherwise cut holes through the scene that fill
    // with sky (solid white slabs on the day theme). Births keep writing
    // depth so materializing buildings fade in solid, not as x-rays.
    if (m.userData.baseDepthWrite === undefined) m.userData.baseDepthWrite = m.depthWrite;
    m.depthWrite = dim >= 1 ? m.userData.baseDepthWrite : false;
    if (obj.userData.baseCast === undefined) obj.userData.baseCast = obj.castShadow;
    obj.castShadow = obj.userData.baseCast && k === 1;
  }
  function walkFactors(node, k, dim, hot) {
    applyToObj(node, k, dim, hot);
    for (const child of node.children) {
      // nested named groups (bayIDE, pipeContext, govPipes...) resolve their
      // own factor and own their subtree
      if (child.userData && child.userData.name && groups[child.userData.name] === child) {
        applyFactors(child);
      } else {
        walkFactors(child, k, dim, hot);
      }
    }
  }
  function applyFactors(group) {
    const { k, dim, hot } = factorOf(group.userData.name);
    walkFactors(group, k, dim, hot);
  }
  world._applyFactors = applyFactors;
  world._factorK = name => factorOf(name).k;

  // shared focus machinery for the x-ray screens (18: infrastructure,
  // 19: governance): one tag sprite per sub-step, everything outside the
  // highlighted set dims. main.js calls both setters on every screen
  // change, so the owner guard keeps a null call from one system wiping
  // the focus the other has just applied.
  world._focusOwner = null;
  function setFocusSet(owner, defs, tags, sub) {
    tags.forEach((tg, i) => { tg.visible = sub === i; });
    if (sub === null || sub === undefined || !defs[sub]) {
      if (world._focusOwner !== owner) return;
      world._focusOwner = null;
      world._focus = {};
    } else {
      world._focusOwner = owner;
      world._focus = {};
      const set = defs[sub].set;
      for (const n of Object.keys(groups)) world._focus[n] = set.includes(n) ? 1 : 0.1;
    }
    for (const n of Object.keys(groups)) applyFactors(groups[n]);
  }
  world._setFocusSet = setFocusSet;

  // birth: newly delivered components materialize in place (no beam)
  const births = [];
  world.materialize = name => {
    const g = groups[name];
    if (!g || !g.visible) return;
    world._birth[name] = 0.05;
    births.push({ name, g, t: 0, dur: 0.9 });
  };
  animators.push({
    update(t, dt) {
      for (let i = births.length - 1; i >= 0; i--) {
        const b = births[i];
        b.t += dt;
        const k = Math.min(1, b.t / b.dur);
        const e = 1 - Math.pow(1 - k, 3);
        world._birth[b.name] = 0.05 + e * 0.95;
        b.g.position.y = (1 - e) * -1.4;
        applyFactors(b.g);
        if (k >= 1) {
          delete world._birth[b.name];
          b.g.position.y = 0;
          applyFactors(b.g);
          births.splice(i, 1);
        }
      }
    },
  });

  function beacon(parent, color, x, y, z, speed = 3) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10), mat(color, { glow: true, ei: 1.4, metal: 0, rough: 0.4 }));
    b.position.set(x, y, z);
    b.castShadow = false;
    parent.add(b);
    const ph = Math.random() * 6;
    animators.push({
      update(t) {
        b.material.emissiveIntensity = b.material.userData.baseEmissive * (Math.sin(t * speed + ph) > 0.2 ? 1 : 0.12);
      },
    });
    return b;
  }

  // pulses traveling along a tube's curve
  function pulsesAlong(parent, curve, color, count = 2, speed = 0.16, size = 0.16) {
    const list = [];
    for (let i = 0; i < count; i++) {
      const p = new THREE.Mesh(new THREE.SphereGeometry(size, 8, 8), mat(color, { glow: true, ei: 1.3, rough: 0.3 }));
      p.castShadow = false;
      parent.add(p);
      list.push({ mesh: p, ph: i / count });
    }
    animators.push({
      update(t) {
        for (const p of list) {
          const k = (t * speed + p.ph) % 1;
          curve.getPointAt(k, p.mesh.position);
          setFade(p.mesh.material, p.mesh.material.userData.baseOpacity * Math.min(1, Math.sin(k * Math.PI) * 2));
        }
      },
    });
  }

  // ---- 1. the lot: grass terrain + paved surfaces ----
  const lot = reg('lot', 1);
  const grassMat = mat(0xffffff, { rough: 0.95, metal: 0.0 });
  grassMat.map = grassTexture();
  grassMat.roughnessMap = noiseRoughness();
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(420, 340), grassMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = GROUND_Y;
  ground.receiveShadow = true;
  lot.add(ground);
  // paved lot the plant stands on (fills the gap up to the basement slab)
  const paveMat = mat(0x232a31, { rough: 0.85, metal: 0.08 });
  paveMat.roughnessMap = noiseRoughness();
  lot.add(rbox(84, 1.7, 62, paveMat, 0, LOT_TOP - 0.85, -2, 0.3));

  const dustGeo = new THREE.BufferGeometry();
  const dustCount = 350;
  const dpos = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    dpos[i * 3] = (Math.random() - 0.5) * 180;
    dpos[i * 3 + 1] = Math.random() * 45 - 12;
    dpos[i * 3 + 2] = (Math.random() - 0.5) * 130;
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
  const dustMat = new THREE.PointsMaterial({
    color: 0x8aa0b5, size: 0.3, transparent: true, opacity: 0.3,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  dustMat.userData = { baseOpacity: 0.3, baseEmissive: 0 };
  ADDITIVE_MATS.push(dustMat);
  const dust = new THREE.Points(dustGeo, dustMat);
  lot.add(dust);
  animators.push({
    update(t) {
      dust.rotation.y = t * 0.008;
      dust.position.y = Math.sin(t * 0.15) * 0.8;
    },
  });

  // holographic title sign (screen 1 only), standing over the empty lot
  const sign = reg('sign', 1, 2);
  const signPanel = new THREE.Mesh(new THREE.PlaneGeometry(30, 10), holoMat(COLORS.know, 0.08));
  signPanel.position.set(0, -3.5, -6);
  sign.add(signPanel);
  const signFrame = edges(30, 10, 0.1, COLORS.know, 0.6);
  signFrame.position.set(0, -3.5, -6);
  sign.add(signFrame);
  const signLabel = makeLabel('BOM for Agentic Engineering', css(COLORS.know), 2.1);
  signLabel.position.set(0, -2.1, -5.8);
  sign.add(signLabel);
  const signSub = makeLabel('Roman Gurevitch  ·  Principal Software Engineer  ·  Mantel', css(COLORS.infra), 1.05);
  signSub.position.set(0, -5.6, -5.8);
  sign.add(signSub);
  animators.push({
    update(t) {
      setFade(signPanel.material, signPanel.material.userData.baseOpacity * world._modeOf(sign) * (0.75 + 0.25 * Math.sin(t * 9) * Math.sin(t * 2.3)));
    },
  });

  // ---- 2. shifting ground: starter rigs on slowly drifting tiles ----
  const rigs = reg('rigs', 2, 4);
  const rigDefs = [
    ['a coding agent', -16, 6],
    ['a prompt library', -4, 12],
    ['an MCP server', 9, 4],
    ['a pilot', -3, -4],
  ];
  const rigTiles = [];
  rigDefs.forEach(([name, hx, hz], i) => {
    const tg = new THREE.Group();
    tg.add(rbox(7, 0.5, 7, mat(0x2a323c, { rough: 0.7, metal: 0.15 }), 0, 0.25, 0, 0.1));
    tg.add(rbox(6.6, 0.06, 6.6, mat(COLORS.infra, { glow: true, ei: 0.1, opacity: 0.35 }), 0, 0.54, 0, 0.02));
    // a compact quick start: desk, screen, small bot
    tg.add(rbox(2.4, 0.14, 1.1, mat(COLORS.steel, { rough: 0.5, metal: 0.5 }), -0.6, 1.1, 0, 0.05));
    for (const dx of [-1.6, 0.4]) {
      tg.add(rbox(0.16, 0.95, 0.9, mat(COLORS.steelDark, { rough: 0.5, metal: 0.5 }), dx, 0.6, 0, 0.04));
    }
    const scr = rbox(1.7, 1.0, 0.1, mat(COLORS.exp, { glow: true, ei: 0.5 }), -0.6, 1.85, -0.35, 0.04);
    scr.rotation.x = -0.12;
    tg.add(scr);
    const bot = makeRobot(0.5);
    bot.g.position.set(1.7, 0.5, 0.6);
    bot.g.rotation.y = -0.6;
    tg.add(bot.g);
    const lbl = lab(makeLabel(name, css(COLORS.infra), 0.85), [2]);
    lbl.position.set(0, 3.6, 0);
    tg.add(lbl);
    tg.position.set(hx, LOT_TOP, hz);
    rigs.add(tg);
    rigTiles.push({ tg, hx, hz, ph: i * 1.7, bot });
  });
  animators.push({
    update(t) {
      for (const r of rigTiles) {
        r.tg.position.x = r.hx + Math.sin(t * 0.07 + r.ph) * 2.4;
        r.tg.position.z = r.hz + Math.cos(t * 0.055 + r.ph * 1.3) * 2.0;
        r.tg.rotation.y = Math.sin(t * 0.045 + r.ph) * 0.14;
        r.bot.head.position.y = 2.75 + Math.sin(t * 2.2 + r.ph) * 0.08;
      }
    },
  });

  // ---- 3. the standing BOM sheet ----
  const sheet = reg('sheet', 3, 4);
  const sheetMat = new THREE.MeshBasicMaterial({ map: sheetTexture(), transparent: true, opacity: 0.98 });
  sheetMat.userData = { baseOpacity: 0.98, baseEmissive: 0 };
  const SHEET_W = 33, SHEET_H = 20.6;
  const sheetMesh = new THREE.Mesh(new THREE.PlaneGeometry(SHEET_W, SHEET_H), sheetMat);
  sheetMesh.castShadow = false;
  sheetMesh.position.set(6, LOT_TOP + SHEET_H / 2 + 1.4, 26);
  sheet.add(sheetMesh);
  const sheetBack = rbox(SHEET_W + 0.6, SHEET_H + 0.6, 0.22, mat(0x10161d, { rough: 0.6, metal: 0.2 }), 6, LOT_TOP + SHEET_H / 2 + 1.4, 25.86, 0.06);
  sheet.add(sheetBack);
  // an opened scroll: rollers at both ends
  for (const dx of [-SHEET_W / 2 - 0.5, SHEET_W / 2 + 0.5]) {
    sheet.add(cyl(0.45, 0.45, SHEET_H + 1.6, mat(0x2a3340, { rough: 0.45, metal: 0.5 }), 6 + dx, LOT_TOP + SHEET_H / 2 + 1.4, 25.9, 14));
    sheet.add(cyl(0.62, 0.62, 0.3, mat(COLORS.steelLight, { rough: 0.4, metal: 0.7 }), 6 + dx, LOT_TOP + SHEET_H + 2.4, 25.9, 12));
    sheet.add(cyl(0.62, 0.62, 0.3, mat(COLORS.steelLight, { rough: 0.4, metal: 0.7 }), 6 + dx, LOT_TOP + 0.6, 25.9, 12));
  }

  // ---- plant shell (the foundations: slab, columns, deck) ----
  const shell = reg('shell', 5);
  const shellEdges = edges(62, 13, 38, 0x9fb2c4, 0.25);
  shellEdges.position.set(0, 6.5, -2);
  shell.add(shellEdges);
  for (const [cx, cz] of [[-30, -20], [30, -20], [-30, 16], [30, 16], [-30, -2], [30, -2]]) {
    shell.add(cyl(0.55, 0.7, 12, mat(COLORS.steelDark, { rough: 0.55, metal: 0.6 }), cx, UNDER_Y + 6, cz, 12));
    shell.add(cyl(0.9, 0.9, 0.5, mat(COLORS.steel, { rough: 0.5, metal: 0.6 }), cx, UNDER_Y + 0.25, cz, 12));
  }
  const floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(62, 38), mat(0x141a21, { rough: 0.25, metal: 0.4, opacity: 0.5 }));
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.position.set(0, 0, -2);
  floorMesh.receiveShadow = true;
  shell.add(floorMesh);
  // no separate basement floor plane: it sat exactly on the paved lot's top
  // surface and the two z-fought (flicker); the pavement IS the slab

  // ---- the top-level deck (raised over the back of the plant, above the
  // intake wall; the head office and foundry stand on it) ----
  const campus = reg('campus', 4);
  const padMat = mat(0x1c232c, { rough: 0.6, metal: 0.3 });
  padMat.roughnessMap = noiseRoughness();
  campus.add(rbox(62, 1.0, 16, padMat, 0, DECK_TOP - 0.5, -28, 0.3));
  const padEdge = edges(62, 1.0, 16, COLORS.life, 0.35);
  padEdge.position.set(0, DECK_TOP - 0.5, -28);
  campus.add(padEdge);
  for (const px of [-28, -10, 10, 28]) {
    for (const pz of [-22.5, -32.5]) {
      campus.add(cyl(0.9, 1.2, 24.5, mat(COLORS.steelDark, { rough: 0.55, metal: 0.5 }), px, 0.25, pz, 12));
    }
  }

  // ---- the Head Office: The Business creates the factory (screen 4) ----
  // authored with its floor slab at y 6.1; OFFICE_LIFT re-seats the slab
  // flat on the top-level deck (an inner group, so materialize() can still
  // animate the registered group's own y during birth)
  const controlRoom = reg('controlRoom', 4);
  const OX = OFFICE.x, OZ = OFFICE.z;
  const OFFICE_LIFT = DECK_TOP + 0.25 - 6.1;
  const officeG = new THREE.Group();
  officeG.position.y = OFFICE_LIFT;
  controlRoom.add(officeG);
  officeG.add(rbox(12, 0.5, 9.4, mat(COLORS.steel, { rough: 0.5, metal: 0.55 }), OX, 6.1, OZ, 0.15));
  officeG.add(rbox(11, 5, 8.4, mat(0x24384d, { rough: 0.15, metal: 0.3, opacity: 0.4, depthWrite: false, glow: true, emissive: 0x3b556e, ei: 0.08 }), OX, 8.6, OZ, 0.3));
  const officeEdges = edges(11, 5, 8.4, 0x9fb2c4, 0.4);
  officeEdges.position.set(OX, 8.6, OZ);
  officeG.add(officeEdges);
  const officeCeil = rbox(10.4, 0.07, 7.8, mat(0xbcd2e8, { glow: true, ei: 0.14, opacity: 0.4 }), OX, 10.95, OZ, 0.02);
  officeCeil.castShadow = false;
  officeG.add(officeCeil);
  const officeStrip = rbox(10.2, 0.4, 0.1, mat(0xffb26b, { glow: true, ei: 0.5, opacity: 0.9 }), OX, 10.5, OZ - 3.9, 0.03);
  officeStrip.castShadow = false;
  officeG.add(officeStrip);
  const officeFloorGlow = rbox(10.4, 0.08, 7.8, mat(0xffc98a, { glow: true, ei: 0.3, opacity: 0.5 }), OX, 6.42, OZ, 0.02);
  officeFloorGlow.castShadow = false;
  officeG.add(officeFloorGlow);
  officeG.add(rbox(11.4, 0.4, 8.8, mat(COLORS.steelDark, { rough: 0.5, metal: 0.6 }), OX, 11.2, OZ, 0.15));
  const dish = cyl(0.9, 0.25, 0.5, mat(COLORS.steelLight, { rough: 0.4, metal: 0.7 }), OX + 3.5, 11.9, OZ - 2.5, 14);
  dish.rotation.x = -0.9;
  officeG.add(dish);
  // direction screens on the west face, angled over the floor below
  officeG.add(rbox(1.2, 0.9, 7, mat(COLORS.steelDark, { rough: 0.5, metal: 0.4 }), OX - 3.4, 7.0, OZ + 0.5, 0.1));
  for (let s = 0; s < 3; s++) {
    const scr = rbox(0.12, 1.1, 1.8, mat(COLORS.life, { glow: true, ei: 0.8, emissive: COLORS.life }), OX - 3.6, 8.2, OZ - 2.1 + s * 2.1, 0.04);
    scr.rotation.z = 0.15;
    officeG.add(scr);
  }
  // the business: tech + non-tech leadership setting direction
  const leaderTech = person(0x4f6c8f, false, 'casual');
  leaderTech.position.set(OX - 2.2, 6.35, OZ + 2.4);
  leaderTech.rotation.y = -1.2;
  officeG.add(leaderTech);
  const leaderBiz = person(0x8a6f9e, false, 'suit');
  leaderBiz.position.set(OX - 1.0, 6.35, OZ - 2.8);
  leaderBiz.rotation.y = -1.7;
  officeG.add(leaderBiz);
  beacon(officeG, COLORS.life, OX, 12.0, OZ, 2.6);
  // the office wears its name on the roofline, on the faces the show
  // cameras see, in place of the old floating label
  const crPlateS = makePlate('the Head Office', COLORS.life, 5.5, 1.0);
  crPlateS.position.set(OX, 11.2, OZ + 4.46);
  officeG.add(crPlateS);
  const crPlateW = makePlate('the Head Office', COLORS.life, 5.5, 1.0);
  crPlateW.position.set(OX - 5.76, 11.2, OZ);
  crPlateW.rotation.y = -Math.PI / 2;
  officeG.add(crPlateW);
  animators.push({
    update(t) {
      leaderTech.userData.head.position.y = leaderTech.userData.legH + 1.32 + Math.sin(t * 1.5) * 0.03;
      leaderBiz.userData.head.position.y = leaderBiz.userData.legH + 1.32 + Math.sin(t * 1.7 + 1) * 0.03;
      dish.rotation.z = Math.sin(t * 0.3) * 0.4;
    },
  });

  // the component catalog appears with the interior visit (screen 7)
  const metaRack = reg('metaRack', 7);
  const blockColors = [COLORS.life, 0xa78bfa, COLORS.exp, COLORS.cap, COLORS.know];
  // the catalog covers the entire east wall inside the office
  const rackG = new THREE.Group();
  rackG.position.y = OFFICE_LIFT;
  metaRack.add(rackG);
  rackG.add(rbox(0.4, 4.9, 8.3, mat(0x141a22, { rough: 0.5, metal: 0.4 }), OX + 5.0, 8.55, OZ, 0.12));
  for (let col = 0; col < 8; col++) {
    for (let row = 0; row < 4; row++) {
      rackG.add(rbox(0.5, 1.0, 0.9, mat(blockColors[(col + row) % 5], { glow: true, ei: 0.5, rough: 0.35 }), OX + 4.7, 6.85 + row * 1.18, OZ - 3.6 + col * 1.03, 0.1));
    }
  }

  // ---- the Workflow Foundry (born screen 8, beside the office on the
  // top-level deck; authored at deck-local y, lifted as one group) ----
  const foundry = reg('foundry', 8);
  const FX = FOUNDRY.x, FZ = FOUNDRY.z;
  const foundryG = new THREE.Group();
  foundryG.position.y = DECK_TOP;
  foundry.add(foundryG);
  foundryG.add(rbox(26, 0.5, 15, mat(0x1a212a, { rough: 0.55, metal: 0.35 }), FX, 0.25, FZ, 0.15));
  const trimMat = () => mat(0x8a6a2f, { glow: true, emissive: COLORS.life, ei: 0.06, opacity: 0.5, metal: 0.3 });
  for (const dz of [-7.2, 7.2]) {
    const strip = rbox(25.6, 0.12, 0.28, trimMat(), FX, 0.55, FZ + dz, 0.04);
    strip.castShadow = false;
    foundryG.add(strip);
  }
  for (const dx of [-12.7, 12.7]) {
    const strip = rbox(0.28, 0.12, 14.1, trimMat(), FX + dx, 0.55, FZ, 0.04);
    strip.castShadow = false;
    foundryG.add(strip);
  }
  for (const [cx2, cz2] of [[-12, -6.8], [12, -6.8], [-12, 6.8], [12, 6.8]]) {
    foundryG.add(cyl(0.3, 0.4, 7, mat(COLORS.steelDark, { rough: 0.5, metal: 0.65 }), FX + cx2, 4, FZ + cz2, 10));
    const cap = cyl(0.34, 0.34, 0.2, trimMat(), FX + cx2, 7.4, FZ + cz2, 10);
    cap.castShadow = false;
    foundryG.add(cap);
  }
  const froof = rbox(27, 0.4, 16, mat(0x2a3340, { rough: 0.35, metal: 0.5, opacity: 0.3, depthWrite: false }), FX, 7.7, FZ, 0.1);
  froof.castShadow = false;
  foundryG.add(froof);
  for (const dz of [-8, 8]) {
    const edge = rbox(27, 0.12, 0.16, trimMat(), FX, 7.9, FZ + dz, 0.03);
    edge.castShadow = false;
    foundryG.add(edge);
  }
  for (const dx of [-13.5, 13.5]) {
    const edge = rbox(0.16, 0.12, 16, trimMat(), FX + dx, 7.9, FZ, 0.03);
    edge.castShadow = false;
    foundryG.add(edge);
  }
  // the roofline plates carry the name on screen 8; the banner only flies
  // for the full-plant and profile screens
  const foundryLabel = lab(makeLabel('the Workflow Foundry · The Meta Workflow', css(COLORS.life), 0.95), [], { band: true, group: 'foundry' });
  foundryLabel.position.set(FX, 9.6, FZ);
  foundryG.add(foundryLabel);
  // fixed signage stands ABOVE the roofline (a rooftop sign), so the roof
  // edge and trim never mask it from the show cameras or free roam
  const fPlateS = makePlate('the Workflow Foundry', COLORS.life, 9, 1.5);
  fPlateS.position.set(FX, 8.7, FZ + 7.6);
  foundryG.add(fPlateS);
  const fPlateE = makePlate('the Workflow Foundry', COLORS.life, 9, 1.5);
  fPlateE.position.set(FX + 13.1, 8.7, FZ);
  fPlateE.rotation.y = Math.PI / 2;
  foundryG.add(fPlateE);

  // ---- The Meta Workflow (screen 8): three candidate topologies assemble
  // in place on the foundry floor; the chosen one flies to the line ----
  const metaLines = reg('metaLines', 8, 10);
  const BLOCK_COLS = [COLORS.input, COLORS.exp, COLORS.agent, COLORS.std, COLORS.int, COLORS.know, COLORS.sdlc, COLORS.cap];
  function candBlock(color, big = false) {
    const s = big ? 1.45 : 1.2;
    const m = rbox(s, s, s, mat(color, { glow: true, ei: 0.4, rough: 0.35, opacity: 0.96 }), 0, 0, 0, 0.14);
    const e = edges(s, s, s, color, 0.85);
    return { m, e, s };
  }
  function arrowBetween(a, b, color) {
    const g = new THREE.Group();
    const dir = new THREE.Vector3().subVectors(b, a);
    const len = dir.length();
    const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
    const shaftLen = Math.max(0.2, len - 1.7);
    const shaft = cyl(0.05, 0.05, shaftLen, mat(0x9fb2c4, { glow: true, emissive: 0x9fb2c4, ei: 0.35, opacity: 0.9 }), 0, 0, 0, 6);
    shaft.castShadow = false;
    const head = cone(0.16, 0.34, mat(0x9fb2c4, { glow: true, emissive: 0x9fb2c4, ei: 0.5 }), 0, shaftLen / 2 + 0.17, 0, 8);
    head.castShadow = false;
    g.add(shaft);
    g.add(head);
    g.position.copy(mid);
    g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    return g;
  }
  // topologies: local (dx, dz) block offsets, flow order; z runs 0..12
  const CAND_DEFS = [
    { name: "product team", cx: FX - 9, kind: 'line',
      pts: [[0, 0], [0, 2], [0, 4], [0, 6], [0, 8], [0, 10], [0, 12]],
      links: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6]] },
    { name: "data team", cx: FX, kind: 'branch',
      pts: [[0, 0], [0, 2.2], [-1.35, 4.6], [1.35, 4.6], [-1.35, 7], [1.35, 7], [0, 9.4], [0, 11.8]],
      links: [[0, 1], [1, 2], [1, 3], [2, 4], [3, 5], [4, 6], [5, 6], [6, 7]] },
    { name: "platform team", cx: FX + 9, kind: 'loop',
      pts: [[-1.5, 0.6], [-1.5, 3.2], [-1.5, 5.8], [-1.5, 8.4], [0, 10.8], [1.5, 8.4], [1.5, 5.8], [1.5, 3.2]],
      links: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0]],
      gates: [2, 5] },
  ];
  const Z0 = FZ - 6;
  const cands = CAND_DEFS.map((def, ci) => {
    const blocks = def.pts.map(([dx, dz], bi) => {
      const isGate = def.gates && def.gates.includes(bi);
      const bl = candBlock(BLOCK_COLS[bi % BLOCK_COLS.length], isGate);
      const home = new THREE.Vector3(def.cx + dx, DECK_TOP + 1.1, Z0 + dz);
      bl.m.position.copy(home);
      bl.e.position.copy(home);
      bl.m.visible = false;
      bl.e.visible = false;
      metaLines.add(bl.m);
      metaLines.add(bl.e);
      // the chosen workflow flies to the line along a high arc: up out of
      // the foundry's open side, over the intake wall, funnels, and cells,
      // then down onto the floor. Never straight through the geometry.
      const spreadTo = ci === 0 && bi < 7 ? new THREE.Vector3(STATION_X(bi), 1.0, ROOM_Z) : null;
      const flight = spreadTo ? new THREE.QuadraticBezierCurve3(
        home.clone(),
        new THREE.Vector3((home.x + spreadTo.x) / 2, 26, (home.z + spreadTo.z) / 2),
        spreadTo.clone()
      ) : null;
      if (isGate) {
        const ring = torus(1.0, 0.06, mat(COLORS.gov, { glow: true, ei: 0.7 }), 0, 0, 0);
        ring.rotation.x = Math.PI / 2;
        ring.position.copy(home);
        ring.visible = false;
        metaLines.add(ring);
        return { ...bl, home, ring, spread: spreadTo, flight, ft: 0, goal: 0 };
      }
      return { ...bl, home, spread: spreadTo, flight, ft: 0, goal: 0 };
    });
    const arrows = def.links.map(([a, b]) => {
      const ar = arrowBetween(blocks[a].home, blocks[b].home, 0x9fb2c4);
      ar.visible = false;
      metaLines.add(ar);
      return ar;
    });
    const lbl = makeLabel(def.name + "'s workflow", css(COLORS.life), 0.68);
    lbl.position.set(def.cx, DECK_TOP + 3.4, Z0 - 1.8);
    lbl.visible = false;
    metaLines.add(lbl);
    return { def, blocks, arrows, lbl, revealed: false, t: 0, assembling: false, chosen: false };
  });
  let stationCount = 7; // declared early: setMetaState reads it
  function candShow(cd, count, instant) {
    cd.blocks.forEach((bl, bi) => {
      const on = bi < count;
      bl.m.visible = on;
      bl.e.visible = on;
      if (bl.ring) bl.ring.visible = on;
      if (on && !instant && bi === count - 1) {
        bl.m.scale.setScalar(0.01);
      }
    });
    cd.arrows.forEach((ar, ai) => { ar.visible = cd.def.links[ai][1] < count && cd.def.links[ai][0] < count; });
  }
  function candOpacity(cd, k) {
    const set = m => setFade(m.material, m.material.userData.baseOpacity * k);
    cd.blocks.forEach(bl => { set(bl.m); if (bl.ring) set(bl.ring); setFade(bl.e.material, bl.e.material.userData.baseOpacity * k); });
    cd.arrows.forEach(ar => ar.children.forEach(set));
    setFade(cd.lbl.material, cd.lbl.material.userData.baseOpacity * Math.max(k, 0.3));
  }
  world.setMetaState = (screen, sub) => {
    if (screen === 8) {
      const vis = sub === null ? 3 : Math.min(3, sub);
      const chosen = sub === 4;
      cands.forEach((cd, ci) => {
        const on = ci < vis || chosen;
        cd.lbl.visible = on;
        if (!on) {
          cd.revealed = false;
          cd.assembling = false;
          cd.t = 0;
          candShow(cd, 0, true);
        } else if (!cd.revealed) {
          cd.revealed = true;
          cd.assembling = true;
          cd.t = 0;
        } else if (!cd.assembling) {
          candShow(cd, cd.blocks.length, true);
        }
        cd.chosen = chosen && ci === 0;
        candOpacity(cd, chosen && ci !== 0 ? 0.18 : 1);
        cd.blocks.forEach(bl => {
          if (bl.flight) bl.goal = cd.chosen ? 1 : 0;
          else bl.target = bl.home;
        });
        if (chosen) cd.arrows.forEach(ar => { if (ci === 0) ar.visible = false; });
        if (ci === 0) {
          if (chosen) cd.lbl.position.set(0, 2.8, ROOM_Z + 5.4);
          else cd.lbl.position.set(cd.def.cx, DECK_TOP + 3.4, Z0 - 1.8);
        }
      });
    } else if (screen === 9) {
      // only the chosen workflow remains: ghost slots the rooms rise into
      cands.forEach((cd, ci) => {
        cd.lbl.visible = false;
        cd.arrows.forEach(ar => { ar.visible = false; });
        cd.blocks.forEach((bl, bi) => {
          const on = ci === 0 && bl.spread && bi >= stationCount;
          bl.m.visible = on;
          bl.e.visible = on;
          if (bl.ring) bl.ring.visible = false;
          if (bl.spread) {
            bl.m.position.copy(bl.spread);
            bl.e.position.copy(bl.spread);
            bl.ft = 1;
            bl.goal = 1;
          }
        });
      });
    }
  };
  animators.push({
    update(t, dt) {
      const k = 1 - Math.pow(0.02, dt);
      for (const cd of cands) {
        if (cd.assembling) {
          cd.t += dt;
          const count = Math.min(cd.blocks.length, Math.floor(cd.t / 0.16) + 1);
          candShow(cd, count, false);
          if (count >= cd.blocks.length) cd.assembling = false;
        }
        for (const bl of cd.blocks) {
          if (!bl.m.visible) continue;
          if (bl.m.scale.x < 1) {
            bl.m.scale.setScalar(Math.min(1, bl.m.scale.x + dt * 4));
            bl.e.scale.copy(bl.m.scale);
          }
          if (bl.flight) {
            if (bl.ft !== bl.goal) {
              bl.ft = bl.goal > bl.ft
                ? Math.min(bl.goal, bl.ft + dt / 1.9)
                : Math.max(bl.goal, bl.ft - dt / 1.9);
              const fe = bl.ft * bl.ft * (3 - 2 * bl.ft);
              bl.flight.getPoint(fe, bl.m.position);
              bl.e.position.copy(bl.m.position);
            }
          } else if (bl.target) {
            bl.m.position.lerp(bl.target, k);
            bl.e.position.copy(bl.m.position);
            if (bl.ring) bl.ring.position.copy(bl.m.position);
          }
        }
      }
    },
  });

  // ---- intake gate (screen 5) + collector belt ----
  const intake = reg('intake', 5);
  intake.add(rbox(56, 11, 1.6, mat(0x1d242d, { rough: 0.6, metal: 0.35 }), 0, 5.5, -20, 0.3));
  intake.add(rbox(56.6, 0.5, 2.0, mat(COLORS.input, { glow: true, ei: 0.35, metal: 0.2 }), 0, 11.2, -20, 0.2));
  const chuteDefs = [
    ['Business goals', 'IDE', 'rocket', ['ship loyalty v2', 'open a new market', 'OKR: activation +10%']],
    ['Leadership direction', 'Portal', 'bridge', ['cut cycle time 30%', 'autonomy risk appetite', 'platform first']],
    ['User feedback', 'Portal', 'house', ['NPS dipped to 31', 'checkout is confusing', 'feature request #482']],
    ['Telemetry & incidents', 'Auto', 'robot', ['Sev-2: latency spike', 'error budget burning', 'drift alert: model v9']],
    ['Market & regulation', 'Auto', 'rover', ['CPS 230 update', 'competitor ships AI', 'privacy act change']],
  ];
  chuteDefs.forEach(([name], i) => {
    const x = -20 + i * 10;
    const cz = -18.2;
    intake.add(cyl(1.9, 0.5, 2.6, mat(COLORS.input, { rough: 0.35, metal: 0.55, opacity: 0.95 }), x, 12.2, cz, 24));
    const rimRing = torus(1.9, 0.13, mat(COLORS.input, { glow: true, ei: 0.5, metal: 0.4 }), x, 13.5, cz);
    rimRing.rotation.x = Math.PI / 2;
    intake.add(rimRing);
    intake.add(cyl(0.45, 0.45, 1.0, mat(COLORS.steel, { rough: 0.4, metal: 0.6 }), x, 10.5, cz, 14));
    intake.add(rbox(0.5, 0.5, 1.8, mat(COLORS.steelDark, { rough: 0.5, metal: 0.6 }), x, 11.8, -19.2, 0.1));
    intake.add(rbox(3.4, 0.35, 3.4, mat(0x1a212a, { rough: 0.55, metal: 0.35 }), x, 0.18, cz, 0.12));
    intake.add(rbox(3.0, 0.06, 3.0, mat(COLORS.input, { glow: true, ei: 0.18, opacity: 0.5 }), x, 0.39, cz, 0.03));
    // the funnel wears its own nameplate, leaned back to sit on the cone,
    // angled at the screen-5 camera; no floating label needed
    const plate = makePlate(name, COLORS.input, 3.6, 0.82);
    plate.position.set(x, 12.05, cz + 1.32);
    plate.rotation.x = -0.49;
    intake.add(plate);
  });
  intake.add(rbox(48, 0.3, 1.6, mat(0x1b222b, { rough: 0.6, metal: 0.4 }), 0, 0.5, -15.2, 0.08));
  intake.add(rbox(48.4, 0.35, 0.26, mat(COLORS.input, { glow: true, ei: 0.2, opacity: 0.85 }), 0, 0.58, -14.4, 0.06));
  intake.add(rbox(48.4, 0.35, 0.26, mat(COLORS.input, { glow: true, ei: 0.2, opacity: 0.85 }), 0, 0.58, -16.0, 0.06));
  // zone signage on the intake wall: the wall has room, so it names the
  // funneling above it (the experience sign below arrives with the cells)
  const inputsSign = makePlate('Continuous Inputs · the funnels', COLORS.input, 15, 1.7);
  inputsSign.position.set(0, 9.1, -19.12);
  intake.add(inputsSign);
  // the head office feeds the funnels directly from the top level: one
  // straight feeder out of the office front into a T-manifold over the
  // funnel row, with vertical drops into the two business funnels
  const feedMat = () => mat(COLORS.life, { glow: true, ei: 0.4, rough: 0.4, metal: 0.5, opacity: 0.95 });
  const feeder = tube(elbow([[OX, 13.9, -23.7], [OX, 14.6, -21.4], [OX, 14.6, -18.2]]), 0.26, feedMat(), 16);
  intake.add(feeder);
  pulsesAlong(intake, feeder.userData.curve, COLORS.life, 2, 0.28, 0.13);
  flangesAlong(intake, feeder.userData.curve, 0.26, 1);
  const feedManifold = tube([[-20, 14.6, -18.2], [-10, 14.6, -18.2]], 0.26, feedMat(), 8);
  intake.add(feedManifold);
  pulsesAlong(intake, feedManifold.userData.curve, COLORS.life, 2, 0.2, 0.13);
  flangesAlong(intake, feedManifold.userData.curve, 0.26, 2);
  for (const fx of [-20, -10]) {
    intake.add(tube([[fx, 14.6, -18.2], [fx, 13.2, -18.2]], 0.2, feedMat(), 6));
  }
  intake.add(rbox(0.9, 0.9, 0.9, mat(COLORS.steelDark, { rough: 0.5, metal: 0.6 }), OX, 14.6, -18.2, 0.1));
  intake.add(rbox(2.6, 1.1, 0.5, mat(COLORS.steelDark, { rough: 0.5, metal: 0.6 }), OX, 13.9, -23.75, 0.1));

  // ---- experience cells (screen 6): the setups are the center ----
  const bays = reg('bays', 6);
  function cellPlatform(g, x, color) {
    g.add(rbox(9, 0.35, 7, mat(0x1a212a, { rough: 0.55, metal: 0.35 }), x, 0.18, CELL_Z, 0.15));
    g.add(rbox(8.5, 0.06, 6.5, mat(color, { glow: true, ei: 0.14, opacity: 0.45 }), x, 0.39, CELL_Z, 0.03));
    g.add(rbox(1.1, 0.05, 3.6, mat(color, { glow: true, ei: 0.25, opacity: 0.5 }), x, 0.1, CELL_Z - 5.0, 0.02));
    g.add(rbox(1.1, 0.05, 6.0, mat(color, { glow: true, ei: 0.25, opacity: 0.5 }), x, 0.1, CELL_Z + 6.0, 0.02));
  }
  const bayIDE = new THREE.Group();
  bayIDE.userData.name = 'bayIDE';
  cellPlatform(bayIDE, CELL_X.IDE, COLORS.exp);
  bayIDE.add(rbox(4.2, 0.18, 1.8, mat(COLORS.steel, { rough: 0.5, metal: 0.5 }), CELL_X.IDE, 1.35, CELL_Z - 0.8, 0.05));
  for (const dx of [-1.8, 1.8]) {
    bayIDE.add(rbox(0.2, 1.25, 1.5, mat(COLORS.steelDark, { rough: 0.5, metal: 0.5 }), CELL_X.IDE + dx, 0.7, CELL_Z - 0.8, 0.04));
  }
  const ideScreenMat = new THREE.MeshBasicMaterial({ map: screenTexture('ide'), transparent: true, opacity: 0.98 });
  ideScreenMat.userData = { baseOpacity: 0.98, baseEmissive: 0 };
  const ideScreen = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.12), ideScreenMat);
  ideScreen.position.set(CELL_X.IDE, 2.6, CELL_Z - 1.3);
  ideScreen.rotation.x = -0.1;
  ideScreen.castShadow = false;
  bayIDE.add(ideScreen);
  const ideBezel = rbox(3.6, 2.3, 0.14, mat(0x11161c, { rough: 0.4, metal: 0.3 }), CELL_X.IDE, 2.58, CELL_Z - 1.42, 0.05);
  ideBezel.rotation.x = -0.1;
  bayIDE.add(ideBezel);
  // occupants stay north of the transit lane at CELL_Z + 1.8, so passing
  // products never clip them
  const ideDev = person(0x4f6c8f, true, 'casual');
  ideDev.position.set(CELL_X.IDE - 0.6, 0.35, CELL_Z + 0.5);
  bayIDE.add(ideDev);
  const ideBot = makeRobot(0.62);
  ideBot.g.position.set(CELL_X.IDE + 2.6, 0.35, CELL_Z + 0.4);
  ideBot.g.rotation.y = -0.5;
  bayIDE.add(ideBot.g);
  bays.add(bayIDE);
  groups.bayIDE = bayIDE;

  const bayPortal = new THREE.Group();
  bayPortal.userData.name = 'bayPortal';
  cellPlatform(bayPortal, CELL_X.Portal, COLORS.exp);
  bayPortal.add(cyl(0.2, 0.28, 2.0, mat(COLORS.steelDark, { rough: 0.5, metal: 0.6 }), CELL_X.Portal, 1.2, CELL_Z - 0.8, 10));
  const portalScreenMat = new THREE.MeshBasicMaterial({ map: screenTexture('portal'), transparent: true, opacity: 0.98 });
  portalScreenMat.userData = { baseOpacity: 0.98, baseEmissive: 0 };
  const portalScreen = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 1.82), portalScreenMat);
  portalScreen.position.set(CELL_X.Portal, 3.0, CELL_Z - 0.72);
  portalScreen.rotation.x = -0.16;
  portalScreen.castShadow = false;
  bayPortal.add(portalScreen);
  const portalBezel = rbox(3.1, 2.0, 0.14, mat(0x11161c, { rough: 0.4, metal: 0.3 }), CELL_X.Portal, 2.98, CELL_Z - 0.88, 0.05);
  portalBezel.rotation.x = -0.16;
  bayPortal.add(portalBezel);
  const portalUser = person(0x8a6f9e, false, 'suit');
  portalUser.position.set(CELL_X.Portal - 0.2, 0.35, CELL_Z + 0.5);
  bayPortal.add(portalUser);
  bays.add(bayPortal);
  groups.bayPortal = bayPortal;

  const bayAuto = new THREE.Group();
  bayAuto.userData.name = 'bayAuto';
  cellPlatform(bayAuto, CELL_X.Auto, COLORS.exp);
  const autoBot = makeRobot(1.05);
  autoBot.g.position.set(CELL_X.Auto - 1.0, 0.35, CELL_Z - 0.4);
  autoBot.g.rotation.y = 0.6;
  bayAuto.add(autoBot.g);
  bayAuto.add(cyl(0.1, 0.16, 3.4, mat(COLORS.steel, { rough: 0.45, metal: 0.7 }), CELL_X.Auto + 2.2, 2.05, CELL_Z - 1.4, 8));
  bayAuto.add(torus(0.45, 0.06, mat(COLORS.exp, { glow: true, ei: 0.8 }), CELL_X.Auto + 2.2, 3.9, CELL_Z - 1.4));
  beacon(bayAuto, COLORS.exp, CELL_X.Auto + 2.2, 4.35, CELL_Z - 1.4, 3.4);
  bays.add(bayAuto);
  groups.bayAuto = bayAuto;

  const baysLabel = lab(makeLabel('Experience Layer', css(COLORS.exp), 0.9), [], { band: true, group: 'bays' });
  baysLabel.position.set(0, 8.6, CELL_Z);
  bays.add(baysLabel);
  // the experience zone sign shares the intake wall, under the funnel sign
  const expSign = makePlate('Experience Layer · IDE · Portal · Autonomous', COLORS.exp, 15, 1.7);
  expSign.position.set(0, 6.3, -19.12);
  bays.add(expSign);

  animators.push({
    update(t) {
      ideDev.userData.head.position.y = ideDev.userData.legH + 1.32 + Math.sin(t * 1.5) * 0.03;
      portalUser.userData.head.position.y = portalUser.userData.legH + 1.32 + Math.sin(t * 1.7 + 1) * 0.03;
      portalUser.rotation.y = Math.sin(t * 0.6) * 0.08;
      ideBot.head.position.y = 2.75 + Math.sin(t * 2.4) * 0.08;
      autoBot.head.position.y = 2.75 + Math.sin(t * 2.0 + 2) * 0.08;
      autoBot.arms[0].rotation.z = -0.35 + Math.sin(t * 1.6) * 0.2;
      autoBot.arms[1].rotation.z = 0.35 - Math.sin(t * 1.6 + 1) * 0.2;
    },
  });

  // ---- the belt (in FRONT of the rooms; products ride past, never through) ----
  const beltLine = reg('beltLine', 9);
  beltLine.add(rbox(50, 0.35, 2.8, mat(0x1b222b, { rough: 0.6, metal: 0.4 }), 0, 0.62, 0, 0.08));
  beltLine.add(rbox(50.4, 0.5, 0.35, mat(COLORS.steel, { rough: 0.45, metal: 0.65 }), 0, 0.75, 1.55, 0.08));
  beltLine.add(rbox(50.4, 0.5, 0.35, mat(COLORS.steel, { rough: 0.45, metal: 0.65 }), 0, 0.75, -1.55, 0.08));
  const rollerGeo = new THREE.CylinderGeometry(0.16, 0.16, 2.6, 10);
  const rollerMat = mat(COLORS.steelLight, { rough: 0.35, metal: 0.75 });
  const rollers = new THREE.InstancedMesh(rollerGeo, rollerMat, 31);
  const rmtx = new THREE.Matrix4();
  const rq = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0));
  for (let i = 0; i < 31; i++) {
    rmtx.compose(new THREE.Vector3(-24 + i * 1.6, 0.55, 0), rq, new THREE.Vector3(1, 1, 1));
    rollers.setMatrixAt(i, rmtx);
  }
  rollers.castShadow = true;
  beltLine.add(rollers);
  for (let i = 0; i < 7; i++) {
    beltLine.add(rbox(0.4, 0.55, 2.4, mat(COLORS.steelDark, { rough: 0.5, metal: 0.6 }), -21 + i * 7, 0.28, 0, 0.06));
  }
  // outbound conveyor: the line continues all the way to the dock, so
  // products ride belts to the output instead of cutting across the floor
  const outMat = () => mat(0x1b222b, { rough: 0.6, metal: 0.4 });
  const outRail = () => mat(COLORS.steel, { rough: 0.45, metal: 0.65 });
  beltLine.add(rbox(2.8, 0.35, 6.8, outMat(), 27.5, 0.62, 6.0, 0.08));
  beltLine.add(rbox(0.35, 0.5, 6.4, outRail(), 29.05, 0.75, 6.0, 0.08));
  beltLine.add(rbox(0.35, 0.5, 6.4, outRail(), 25.95, 0.75, 6.0, 0.08));
  beltLine.add(rbox(22.3, 0.35, 2.8, outMat(), 13.75, 0.62, 12, 0.08));
  beltLine.add(rbox(21, 0.5, 0.35, outRail(), 13.75, 0.75, 13.55, 0.08));
  beltLine.add(rbox(21, 0.5, 0.35, outRail(), 13.75, 0.75, 10.45, 0.08));
  beltLine.add(rbox(2.8, 0.35, 2.2, outMat(), 0, 0.6, 15.7, 0.08));
  // proper 90-degree turn pieces join the straight legs at their tangents
  beltTurn(beltLine, 24.9, 2.6, 0);
  beltTurn(beltLine, 24.9, 9.4, -Math.PI / 2);
  beltTurn(beltLine, 2.6, 14.6, Math.PI / 2);

  // ---- the station rooms (screen 9): nameplates on the rooms ----
  const line = reg('line', 9);
  const stations = [];
  const roomOccupants = [];
  const roomHeads = [];
  const roomBots = [];
  const OCC_TINTS = [0x4f6c8f, 0x8a6f9e, 0x5f8a6e, 0x9e8a5f];
  const glassMat = () => mat(0x9fd4ff, { rough: 0.12, metal: 0.15, opacity: 0.13, depthWrite: false });
  STATION_NAMES.forEach((name, i) => {
    const g = new THREE.Group();
    const x = STATION_X(i);
    g.add(rbox(4.4, 0.5, 5.2, mat(COLORS.steelDark, { rough: 0.55, metal: 0.45 }), x, 0.25, ROOM_Z, 0.12));
    g.add(rbox(3.5, 2.7, 0.16, mat(0x232c37, { rough: 0.5, metal: 0.4 }), x, 1.9, ROOM_Z - 1.92, 0.05));
    const glowStrip = rbox(3.3, 0.5, 0.1, mat(0xffb26b, { glow: true, ei: 0.65, rough: 0.5, opacity: 0.9 }), x, 2.85, ROOM_Z - 1.8, 0.03);
    glowStrip.castShadow = false;
    g.add(glowStrip);
    const warmFloor = rbox(3.2, 0.07, 3.6, mat(0xffc98a, { glow: true, ei: 0.34, opacity: 0.6 }), x, 0.56, ROOM_Z, 0.02);
    warmFloor.castShadow = false;
    g.add(warmFloor);
    for (const dx of [-1.7, 1.7]) {
      const side = rbox(0.1, 2.7, 3.9, glassMat(), x + dx, 1.9, ROOM_Z, 0.03);
      side.castShadow = false;
      g.add(side);
    }
    const front = rbox(3.5, 2.7, 0.1, glassMat(), x, 1.9, ROOM_Z + 1.95, 0.03);
    front.castShadow = false;
    g.add(front);
    g.add(rbox(3.5, 0.14, 3.9, mat(0x232c37, { rough: 0.5, metal: 0.4 }), x, 3.32, ROOM_Z, 0.04));
    g.add(rbox(3.1, 0.35, 3.6, mat(COLORS.sdlc, { glow: true, ei: 0.55, rough: 0.3 }), x, 3.55, ROOM_Z, 0.1));
    // the room's name lives on the room: lit plate above the glass front
    const plate = makePlate(name, COLORS.sdlc, 3.3, 0.74);
    plate.position.set(x, 3.14, ROOM_Z + 2.04);
    g.add(plate);
    if (i % 2 === 0) {
      g.add(cyl(0.28, 0.34, 1.6, mat(COLORS.steel, { rough: 0.45, metal: 0.7 }), x + 1.1, 4.6, ROOM_Z - 1.2, 12));
    }
    beacon(g, COLORS.sdlc, x - 1.3, 4.0, ROOM_Z - 1.4, 2 + i * 0.3);
    // occupants near the glass so they read from the belt side
    const occ = { persons: [], robots: [] };
    [[-0.8, 0.65], [0.8, 0.65]].forEach(([dx, dz], si) => {
      const p = person(OCC_TINTS[(i + si) % 4], false, 'worker');
      p.scale.setScalar(0.85);
      p.position.set(x + dx, 0.5, ROOM_Z + dz);
      p.rotation.y = si === 0 ? 0.25 : -0.25;
      p.traverse(o => { o.castShadow = false; });
      g.add(p);
      occ.persons.push(p);
      roomHeads.push({ p, ph: i * 1.3 + si });
      const r = makeRobot(0.55);
      r.g.position.set(x + dx, 0.5, ROOM_Z + dz);
      r.g.rotation.y = si === 0 ? 0.25 : -0.25;
      r.g.traverse(o => { o.castShadow = false; });
      g.add(r.g);
      occ.robots.push(r.g);
      roomBots.push({ r, ph: i * 0.9 + si });
    });
    roomOccupants.push(occ);
    if (name === 'Verify') {
      const tablet = rbox(0.5, 0.65, 0.05, mat(COLORS.meas, { glow: true, ei: 0.6 }), x - 0.4, 1.45, ROOM_Z + 1.1, 0.02);
      tablet.rotation.x = -0.3;
      tablet.castShadow = false;
      g.add(tablet);
    }
    line.add(g);
    stations.push(g);
  });
  animators.push({
    update(t) {
      for (const rh of roomHeads) {
        rh.p.userData.head.position.y = rh.p.userData.legH + 1.32 + Math.sin(t * 1.6 + rh.ph) * 0.03;
      }
      for (const rb of roomBots) {
        rb.r.head.position.y = 2.75 + Math.sin(t * 2.1 + rb.ph) * 0.08;
      }
    },
  });
  // the line wears its own nameplate: a lit sign leaning on the belt's
  // front rail, in place of the old floating label
  const linePlate = makePlate('Self-Continuous SDLC', COLORS.sdlc, 14, 1.3);
  linePlate.position.set(0, 1.1, 1.98);
  linePlate.rotation.x = -0.55;
  line.add(linePlate);
  // who occupies each room, per profile: P person, A agent, . empty
  const OCCUPANCY = {
    full: ['PP', 'PA', 'AA', 'PA', 'AA', 'AA', 'PA'],
    startup: ['PP', 'P.', 'PA', 'P.', 'P.', 'P.', 'P.'],
    scaleup: ['PP', 'PA', 'AA', 'PA', 'AA', 'AA', 'PA'],
    enterprise: ['PA', 'AA', 'AA', 'PA', 'AA', 'AA', 'AA'],
  };
  world.setRoomOccupancy = name => {
    const spec = OCCUPANCY[name] || OCCUPANCY.full;
    roomOccupants.forEach((occ, i) => {
      for (let s = 0; s < 2; s++) {
        occ.persons[s].visible = spec[i][s] === 'P';
        occ.robots[s].visible = spec[i][s] === 'A';
      }
    });
  };
  world.setRoomOccupancy('full');
  const pops = [];
  world.setStationCount = n => {
    const prev = stationCount;
    stationCount = n;
    stations.forEach((g, i) => {
      const on = i < n;
      if (on && !g.visible && i >= prev) pops.push({ g, t: 0 });
      g.visible = on;
      if (on && g.scale.x === 1 && i >= prev) g.scale.setScalar(0.01);
    });
    if (world.currentScreen === 9) world.setMetaState(9, null);
  };
  animators.push({
    update(t, dt) {
      for (let i = pops.length - 1; i >= 0; i--) {
        const p = pops[i];
        p.t += dt;
        const k = Math.min(1, p.t / 0.45);
        const s = 0.01 + (1 - Math.pow(1 - k, 3)) * 0.99;
        p.g.scale.setScalar(s);
        if (k >= 1) pops.splice(i, 1);
      }
    },
  });

  const loopBelt = reg('loopBelt', 10);
  loopBelt.add(rbox(50, 0.3, 1.7, mat(0x1b222b, { rough: 0.6, metal: 0.4 }), 0, 0.55, 5.2, 0.08));
  loopBelt.add(rbox(50.4, 0.4, 0.28, mat(COLORS.sdlc, { glow: true, ei: 0.25, metal: 0.4, opacity: 0.9 }), 0, 0.65, 6.0, 0.06));
  loopBelt.add(rbox(50.4, 0.4, 0.28, mat(COLORS.sdlc, { glow: true, ei: 0.25, metal: 0.4, opacity: 0.9 }), 0, 0.65, 4.4, 0.06));
  loopBelt.add(cyl(1.5, 1.5, 0.35, mat(COLORS.steel, { rough: 0.45, metal: 0.6 }), 23.2, 0.55, 2.6, 20));
  loopBelt.add(cyl(1.5, 1.5, 0.35, mat(COLORS.steel, { rough: 0.45, metal: 0.6 }), -23.2, 0.55, 2.6, 20));
  // the return conveyor wears its own nameplate on the belt edge, offset
  // east so it never stacks over the line's plate from the show cameras
  const loopPlate = makePlate('Measure feeds Define · the loop', COLORS.sdlc, 12, 1.1);
  loopPlate.position.set(9, 0.95, 6.35);
  loopPlate.rotation.x = -0.55;
  loopBelt.add(loopPlate);
  const loopDots = [];
  for (let i = 0; i < 5; i++) {
    const d = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 12), mat(COLORS.sdlc, { glow: true, ei: 1.2, rough: 0.3 }));
    d.castShadow = false;
    loopBelt.add(d);
    loopDots.push({ mesh: d, phase: i / 5 });
  }
  animators.push({
    update(t) {
      for (const d of loopDots) {
        const k = (t * 0.1 + d.phase) % 1;
        d.mesh.position.set(21 - k * 42, 1.05, 5.2);
      }
    },
  });

  // ---- product journeys: LEGO builds assembling along the whole line ----
  // Even pacing: a global scheduler spawns one product every SPAWN_INT
  // seconds, round-robin across funnels; travel speed is uniform.
  const journeyGroup = reg('journeys', 5);
  const SPEED = 6.0;
  const SPAWN_INT = 4.5;
  const TOTAL_DUR = 41; // every journey is padded to this, so arrivals stay even
  const STAGE_RANK = { fall: 0, route: 1, line: 2, ship: 3 };
  function maxStageRank() {
    const s = world.currentScreen;
    if (s >= 10) return 3;
    if (s >= 9) return 2;
    if (s >= 6) return 1;
    return 0;
  }
  const journeySlots = Array.from({ length: 10 }, (_, i) => i);
  const journeys = journeySlots.map(ji => {
    const [label, cellKey, productKind, phrases] = chuteDefs[ji % 5];
    const prod = buildProduct(productKind);
    prod.g.visible = false;
    journeyGroup.add(prod.g);
    return {
      ji, chute: ji % 5, cellKey, productKind, phrases,
      grp: prod.g, parts: prod.parts,
      wordSprites: {}, word: null, wordIdx: ji,
      segs: [], seg: 0, segT: 0, mode: 'idle', fade: 1,
    };
  });
  function seg(to, dur, stage, opts = {}) {
    return { to: new THREE.Vector3(...to), dur, stage, ...opts };
  }
  function planJourney(j) {
    const cx = -20 + j.chute * 10;
    const cellX = CELL_X[j.cellKey];
    const s = [];
    const D = (a, b) => Math.max(0.35, a.distanceTo(b) / SPEED);
    s.push(seg([cx, 1.05, -18.2], 0.9, 'fall', { from: new THREE.Vector3(cx, 10.8, -18.2), ease: 'in' }));
    s.push(seg([cx, 1.05, -18.2], 0.4, 'fall'));
    // the westbound transit lane to the line start runs at CELL_Z + 1.8,
    // BEHIND the station rooms: products never cross the room row or the
    // chosen workflow blocks waiting on the floor
    const pts = [
      [cx, 1.05, -15.2, 'route'],
      [cellX, 1.05, -15.2, 'route'],
      [cellX, 1.05, CELL_Z + 1.8, 'route', { dwellPart: 1 }],
      [-25.5, 1.05, CELL_Z + 1.8, 'route'],
      [-25.5, 1.15, 0, 'line', { station: 0 }],
    ];
    let prev = s[s.length - 1].to;
    for (const [px, py, pz, stage, opts] of pts) {
      const to = new THREE.Vector3(px, py, pz);
      s.push(seg([px, py, pz], D(prev, to), stage, opts || {}));
      prev = to;
    }
    for (let i = 0; i < 7; i++) {
      const to = new THREE.Vector3(STATION_X(i), 1.15, 0);
      s.push(seg([STATION_X(i), 1.15, 0], D(prev, to), 'line', { station: i }));
      s.push(seg([STATION_X(i), 1.15, 0], 1.0, 'line', { station: i, dwellPart: 2 + i }));
      prev = to;
    }
    // ride the outbound conveyor: east past the loop, south, west along the
    // transfer belt, through the dock gate, out the ramp. Each 90-degree
    // turn tracks the arc of its turn piece via a mid-arc waypoint
    const outPts = [
      [24.9, 1.15, 0], [26.74, 1.13, 0.76], [27.5, 1.12, 2.6],
      [27.5, 1.1, 9.4], [26.74, 1.09, 11.24], [24.9, 1.08, 12],
      [2.6, 1.05, 12], [0.76, 1.03, 12.76], [0, 1.02, 14.6],
      [0, 0.85, 16.2],
    ];
    for (const [px, py, pz] of outPts) {
      const to = new THREE.Vector3(px, py, pz);
      s.push(seg([px, py, pz], D(prev, to), 'ship'));
      prev = to;
    }
    s.push(seg([0, 0.75, 27], D(prev, new THREE.Vector3(0, 0.75, 27)), 'ship', { fadeOut: true }));
    // equalize: pad the cell stop so every chute's journey lasts TOTAL_DUR
    const total = s.reduce((acc, sg2) => acc + sg2.dur, 0);
    if (total < TOTAL_DUR) {
      const cellIdx = s.findIndex(sg2 => sg2.dwellPart === 1);
      s.splice(cellIdx + 1, 0, seg(s[cellIdx].to.toArray(), TOTAL_DUR - total, 'route'));
    }
    j.segs = s;
    j.seg = 0;
    j.segT = 0;
    j.fade = 1;
    j.mode = 'run';
    j.grp.visible = true;
    j.grp.position.copy(s[0].from);
    j.parts.forEach((p, i) => {
      p.visible = i === 0;
      p.scale.setScalar(1);
    });
    const text = j.phrases[j.wordIdx % j.phrases.length];
    j.wordIdx += 1;
    if (!j.wordSprites[text]) {
      const sp = makeLabel(text, css(COLORS.input), 0.62);
      sp.visible = false;
      journeyGroup.add(sp);
      j.wordSprites[text] = sp;
    }
    if (j.word) j.word.visible = false;
    j.word = j.wordSprites[text];
  }
  const partPulses = [];
  function revealPart(j, idx) {
    if (idx >= j.parts.length) return;
    const p = j.parts[idx];
    if (p.visible) return;
    p.visible = true;
    p.scale.setScalar(0.01);
    partPulses.push({ p, t: 0 });
  }
  let spawnTimer = 1.0;
  let spawnNext = 0;
  animators.push({
    update(t, dt) {
      // scheduler
      spawnTimer -= dt;
      if (spawnTimer <= 0) {
        for (let k = 0; k < journeys.length; k++) {
          const j = journeys[(spawnNext + k) % journeys.length];
          if (j.mode === 'idle') {
            planJourney(j);
            spawnNext = (j.ji + 1) % journeys.length;
            break;
          }
        }
        spawnTimer = SPAWN_INT;
      }
      // part pop-in pulses
      for (let i = partPulses.length - 1; i >= 0; i--) {
        const pp = partPulses[i];
        pp.t += dt;
        const k = Math.min(1, pp.t / 0.4);
        pp.p.scale.setScalar(0.01 + (1 - Math.pow(1 - k, 3)) * 0.99);
        if (k >= 1) partPulses.splice(i, 1);
      }
      const allowed = maxStageRank();
      const groupMode = Math.max(world._factorK('journeys'), 0.001);
      const fadeJourney = (j, f) => {
        j.grp.traverse(o => {
          if (o.material && o.material.userData && o.material.userData.baseOpacity !== undefined) {
            setFade(o.material, o.material.userData.baseOpacity * groupMode * f);
          }
        });
      };
      for (const j of journeys) {
        if (j.mode === 'idle') { j.grp.visible = false; if (j.word) j.word.visible = false; continue; }
        const sg = j.segs[j.seg];
        if (!sg) { j.mode = 'idle'; continue; }
        if (j.mode === 'despawn') {
          j.segT += dt;
          const f = Math.max(0, 1 - j.segT / 0.55);
          fadeJourney(j, f);
          if (j.word) j.word.visible = false;
          if (j.segT >= 0.55) {
            j.mode = 'idle';
            j.grp.visible = false;
            fadeJourney(j, 1);
          }
          continue;
        }
        j.segT += dt;
        const from = sg.from || (j.seg === 0 ? sg.to : j.segs[j.seg - 1].to);
        let k = Math.min(1, j.segT / sg.dur);
        k = sg.ease === 'in' ? k * k : k * k * (3 - 2 * k);
        j.grp.position.lerpVectors(from, sg.to, k);
        if (sg.dwellPart !== undefined && k >= 0.45 && j.parts[sg.dwellPart] && !j.parts[sg.dwellPart].visible) {
          revealPart(j, sg.dwellPart);
        }
        const showWord = STAGE_RANK[sg.stage] <= 1 && world.currentScreen >= 5 && world.currentScreen <= 9;
        j.word.visible = showWord && world._factorK('journeys') === 1;
        if (j.word.visible) j.word.position.set(j.grp.position.x, j.grp.position.y + 2.4, j.grp.position.z);
        const fade = sg.fadeOut && k > 0.6 ? (1 - k) / 0.4 : 1;
        if (sg.fadeOut) fadeJourney(j, Math.max(fade, 0));
        if (j.segT >= sg.dur) {
          j.segT = 0;
          const next = j.segs[j.seg + 1];
          const blocked = !next
            || STAGE_RANK[next.stage] > allowed
            || (next.station !== undefined && next.station >= stationCount);
          if (blocked) {
            if (sg.fadeOut) {
              // already faded to nothing at the end of the road: no re-flash
              j.mode = 'idle';
              j.grp.visible = false;
              fadeJourney(j, 1);
            } else {
              j.mode = 'despawn';
              j.segT = 0;
            }
          } else {
            j.seg += 1;
          }
        }
      }
    },
  });

  // ---- the workforce on the open floor (screen 11) ----
  const robots = reg('robots', 11);
  const floorBots = [
    ['specialist · reviewer', STATION_X(3) + 2.6, 2.6],
    ['specialist · evaluator', STATION_X(6) - 2.6, 2.6],
  ];
  floorBots.forEach(([name, x, z], i) => {
    const bot = makeRobot(1);
    bot.g.position.set(x, 0.1, z);
    bot.g.rotation.y = Math.PI;
    robots.add(bot.g);
    animators.push({
      update(t) {
        bot.head.position.y = 2.75 + Math.sin(t * 2.2 + i) * 0.08;
        bot.arms[0].rotation.z = -0.35 + Math.sin(t * 1.8 + i) * 0.25;
        bot.arms[1].rotation.z = 0.35 - Math.sin(t * 1.8 + i + 1.2) * 0.25;
      },
    });
    const lbl = lab(makeLabel(name, css(COLORS.agent), 0.7), [11]);
    lbl.position.set(x, 4.4, z);
    robots.add(lbl);
  });
  const roamers = [];
  // roam lanes stay clear of the loop conveyor (z 4.4..6) and the outbound
  // transfer belt (z 10.4..13.6 east of x 1)
  [['cloud agent', -12, 10, 2.2], ['cloud agent', 12, 8.2, 1.5]].forEach(([name, cx, cz, az], i) => {
    const bot = makeRobot(0.85);
    bot.g.position.set(cx, 0.1, cz);
    robots.add(bot.g);
    const lbl = lab(makeLabel(name, css(COLORS.agent), 0.7), [11]);
    robots.add(lbl);
    roamers.push({ bot, lbl, cx, cz, az, ph: i * 2.4 });
  });
  animators.push({
    update(t) {
      for (const r of roamers) {
        r.bot.g.position.x = r.cx + Math.sin(t * 0.4 + r.ph) * 5;
        r.bot.g.position.z = r.cz + Math.cos(t * 0.32 + r.ph) * r.az;
        r.bot.g.rotation.y = Math.atan2(Math.cos(t * 0.4 + r.ph), -Math.sin(t * 0.32 + r.ph));
        r.lbl.position.set(r.bot.g.position.x, 3.9, r.bot.g.position.z);
      }
    },
  });
  const robotsLabel = lab(makeLabel('Agent Layer · the occupants', css(COLORS.agent), 1.05), [11], { band: true, group: 'robots' });
  robotsLabel.position.set(0, 10.6, 2);
  robots.add(robotsLabel);

  // ---- the connected under-floor network (screen 12) ----
  const basementNet = reg('basementNet', 12);
  const wallMat = () => mat(0x1e242b, { rough: 0.75, metal: 0.1, opacity: 0.94 });
  // no south wall: it stood between the show cameras and the pattern shop
  // placards, so the basement's front face stays open
  for (const [wx, wz, ww, wd] of [[-30.6, -2, 0.5, 36.5], [30.6, -2, 0.5, 36.5], [0, -20.6, 60.5, 0.5]]) {
    basementNet.add(rbox(ww, 2.3, wd, wallMat(), wx, UNDER_Y + 1.15, wz, 0.06));
  }
  basementNet.add(rbox(0.4, 2.3, 10, wallMat(), 16, UNDER_Y + 1.15, -13, 0.06));
  // central spine under the line
  const spineY = -10.6;
  basementNet.add(rbox(46, 0.9, 1.3, mat(COLORS.steel, { rough: 0.4, metal: 0.6 }), 0, spineY, -2, 0.12));
  basementNet.add(rbox(46.4, 0.16, 0.4, mat(0x9fd8ff, { glow: true, emissive: 0x9fd8ff, ei: 0.5, opacity: 0.9 }), 0, spineY + 0.55, -2, 0.04));
  for (const mx of [-23, 23]) {
    basementNet.add(rbox(1.6, 1.6, 1.6, mat(COLORS.steelLight, { rough: 0.4, metal: 0.6 }), mx, spineY, -2, 0.15));
  }
  // trunks: capability (green), patterns (yellow), integration (purple), knowledge (cyan)
  const trunkDefs = [
    { key: 'cap', color: COLORS.cap, pts: [[-15, spineY, -7.5], [15, spineY, -7.5]], taps: [[-9, UNDER_Y + 4, -7.5], [0, UNDER_Y + 4, -7.5], [9, UNDER_Y + 4, -7.5]], join: [[10, spineY, -7.5], [10, spineY, -2]] },
    { key: 'std', color: COLORS.std, pts: [[-13, spineY, 12], [13, spineY, 12]], taps: [[-11, UNDER_Y + 2.4, 12], [-6, UNDER_Y + 2.4, 12], [-1, UNDER_Y + 2.4, 12], [4, UNDER_Y + 2.4, 12]], join: null },
    { key: 'int', color: COLORS.int, pts: [[30.4, -9, 0], [25, -9, 0], [23, -10.2, -2]], taps: [], join: null },
    { key: 'know', color: COLORS.know, pts: [[-30.8, -8.8, 0], [-25, -8.8, 0], [-23, -10.2, -2]], taps: [], join: null },
  ];
  const trunkJoints = {};
  for (const td of trunkDefs) {
    const main = tube(elbow(td.pts), 0.22, mat(td.color, { glow: true, ei: 0.25, rough: 0.4, metal: 0.4, opacity: 0.95 }), 16);
    basementNet.add(main);
    pulsesAlong(basementNet, main.userData.curve, td.color, 2, 0.14, 0.14);
    flangesAlong(basementNet, main.userData.curve, 0.22, td.taps.length ? 4 : 2);
    for (const tp of td.taps) {
      const stub = tube([[tp[0], tp[1], tp[2]], [tp[0], spineY + 0.3, td.pts[0][2]]], 0.13, mat(td.color, { glow: true, ei: 0.2, opacity: 0.9 }), 8);
      basementNet.add(stub);
    }
    if (td.join) {
      const jn = tube(elbow(td.join), 0.18, mat(td.color, { glow: true, ei: 0.25, opacity: 0.95 }), 8);
      basementNet.add(jn);
      pulsesAlong(basementNet, jn.userData.curve, td.color, 1, 0.22, 0.12);
      flangesAlong(basementNet, jn.userData.curve, 0.18, 2);
    }
    trunkJoints[td.key] = new THREE.Vector3(...td.pts[td.pts.length - 1]);
  }
  // risers: the spine's vertical outlets. Only the outer four stand: the
  // middle three rose straight in front of the toolkit racks on slide 13.
  // Solid and slightly thicker, so they read as columns, not smoke.
  const riserDots = [];
  for (const i of [0, 1, 5, 6]) {
    const rx = STATION_X(i);
    basementNet.add(cyl(0.26, 0.26, 10.6, mat(0x5d6b7c, { rough: 0.4, metal: 0.6 }), rx, spineY / 2 - 0.05, -2.6, 8));
    for (let d = 0; d < 2; d++) {
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), mat(0x9fd8ff, { glow: true, ei: 1.2 }));
      dot.castShadow = false;
      basementNet.add(dot);
      riserDots.push({ mesh: dot, rx, ph: d / 2 + i * 0.13 });
    }
  }
  animators.push({
    update(t) {
      for (const rd of riserDots) {
        const k = (t * 0.3 + rd.ph) % 1;
        rd.mesh.position.set(rd.rx, spineY + 0.4 + k * 10.4, -2.6);
        setFade(rd.mesh.material, rd.mesh.material.userData.baseOpacity * Math.sin(k * Math.PI));
      }
    },
  });
  // electric conduits with junction boxes feeding cells and dock. The cell
  // feeds rise outboard of the toolkit racks so slide 13 shows the racks
  // unobstructed (the old center feed rose straight in front of Playbooks)
  const conduitDefs = [
    [[-13, spineY, -2], [-13, -1.4, -2], [-16, -1.4, -9], [CELL_X.IDE, -1.2, CELL_Z]],
    [[13, spineY, -2], [13, -1.4, -2], [16, -1.4, -9], [CELL_X.Auto, -1.2, CELL_Z]],
    [[16, spineY, -2], [16, -1.6, 6], [4, -1.6, 14], [0, -1.4, 15.6]],
  ];
  for (const cd of conduitDefs) {
    const wire = tube(elbow(cd, 1.4), 0.07, mat(0xd9c78a, { glow: true, emissive: 0xd9c78a, ei: 0.22, rough: 0.5, metal: 0.5 }), 20);
    basementNet.add(wire);
    pulsesAlong(basementNet, wire.userData.curve, 0xffe9a8, 1, 0.2, 0.09);
    const jb = rbox(0.5, 0.5, 0.5, mat(COLORS.steelDark, { rough: 0.5, metal: 0.5 }), cd[1][0], cd[1][1], cd[1][2], 0.06);
    basementNet.add(jb);
  }
  const netLabel = lab(makeLabel('the foundation network', css(0x9fd8ff), 0.95), [12]);
  netLabel.position.set(0, UNDER_Y + 8.6, -2);
  basementNet.add(netLabel);

  // machine room: where the agent runtime lives (x-rayed on screen 18)
  const machineRoom = reg('machineRoom', 12);
  machineRoom.add(rbox(9, 0.25, 7, mat(0x1a212a, { rough: 0.6, metal: 0.3 }), 22, UNDER_Y + 0.12, 9, 0.08));
  for (const [gx, gz] of [[19.5, 7.5], [19.5, 10.5]]) {
    machineRoom.add(cyl(0.9, 0.9, 2.2, mat(COLORS.steel, { rough: 0.45, metal: 0.6 }), gx, UNDER_Y + 1.35, gz, 14));
    machineRoom.add(cyl(0.5, 0.5, 0.5, mat(COLORS.steelLight, { rough: 0.4, metal: 0.7 }), gx, UNDER_Y + 2.7, gz, 10));
  }
  for (let rIdx = 0; rIdx < 3; rIdx++) {
    const rx2 = 23.4 + rIdx * 1.5;
    machineRoom.add(rbox(1.2, 2.6, 1.4, mat(0x1c232c, { rough: 0.45, metal: 0.5 }), rx2, UNDER_Y + 1.55, 8.6, 0.08));
    for (let led = 0; led < 4; led++) {
      const l = rbox(0.5, 0.1, 0.05, mat(COLORS.agent, { glow: true, ei: 0.9 }), rx2, UNDER_Y + 0.7 + led * 0.55, 9.32, 0.02);
      l.castShadow = false;
      machineRoom.add(l);
    }
  }
  const mrWire = tube(elbow([[12, spineY, -2], [20, spineY, -2], [20, UNDER_Y + 1.2, 8]], 1.4), 0.12, mat(COLORS.agent, { glow: true, ei: 0.3, opacity: 0.95 }), 16);
  machineRoom.add(mrWire);
  pulsesAlong(machineRoom, mrWire.userData.curve, COLORS.agent, 1, 0.2, 0.11);
  flangesAlong(machineRoom, mrWire.userData.curve, 0.12, 2);
  // nameplate leaning on top of the server rack row
  const mrPlate = makePlate('Agent runtime', COLORS.agent, 3.4, 0.72);
  mrPlate.position.set(24.9, UNDER_Y + 3.05, 9.0);
  mrPlate.rotation.x = -0.5;
  machineRoom.add(mrPlate);

  // ---- toolkits (screen 13), tapped into the network ----
  const toolkits = reg('toolkits', 13);
  const tkNames = ['Skills', 'Playbooks', 'Agent instructions'];
  [-9, 0, 9].forEach((x, ti) => {
    const g = new THREE.Group();
    g.add(rbox(4.8, 3.8, 0.7, mat(COLORS.steelDark, { rough: 0.5, metal: 0.5 }), 0, 1.9, 0, 0.12));
    for (let i = 0; i < 6; i++) {
      g.add(rbox(1.2, 0.85, 0.75, mat(0x2b3542, { rough: 0.4, metal: 0.5 }), -1.5 + (i % 3) * 1.5, 1.05 + Math.floor(i / 3) * 1.5, 0.25, 0.1));
      g.add(rbox(0.7, 0.12, 0.1, mat(COLORS.cap, { glow: true, ei: 0.7 }), -1.5 + (i % 3) * 1.5, 1.05 + Math.floor(i / 3) * 1.5, 0.68, 0.03));
    }
    g.add(rbox(5.0, 0.3, 1.0, mat(COLORS.cap, { glow: true, ei: 0.3, opacity: 0.9 }), 0, 3.95, 0, 0.08));
    // the rack wears its own name above the drawer rows
    const plate = makePlate(tkNames[ti], COLORS.cap, 4.2, 0.8);
    plate.position.set(0, 3.4, 0.45);
    g.add(plate);
    g.position.set(x, UNDER_Y, -7.5);
    toolkits.add(g);
  });
  // the rack plates name each toolkit on screen 13; the zone banner only
  // flies for the full-plant and profile screens
  const tkLabel = lab(makeLabel('Capability Layer', css(COLORS.cap), 1.0), [], { band: true, group: 'toolkits' });
  tkLabel.position.set(0, UNDER_Y + 6.8, -7.5);
  toolkits.add(tkLabel);

  // ---- the Pattern Shop (screen 14): master patterns + a stamping press ----
  const patternShop = reg('patternShop', 14);
  const patternDefs = [
    ['Code templates', () => rbox(1.0, 1.0, 1.0, mat(COLORS.std, { glow: true, ei: 0.7, rough: 0.35 }), 0, 0, 0, 0.1)],
    ['Deploy templates', () => cyl(0.6, 0.6, 1.1, mat(COLORS.std, { glow: true, ei: 0.7, rough: 0.35 }), 0, 0, 0, 14)],
    ['Architecture patterns', () => { const t2 = torus(0.55, 0.2, mat(COLORS.std, { glow: true, ei: 0.7, rough: 0.35 }), 0, 0, 0); return t2; }],
    ['Evaluation criteria', () => { const o = new THREE.Mesh(new THREE.OctahedronGeometry(0.72), mat(COLORS.std, { glow: true, ei: 0.7, rough: 0.35 })); return shadowed(o); }],
  ];
  patternDefs.forEach(([n, make], i) => {
    const x = -12 + i * 5;
    const g = new THREE.Group();
    g.add(cyl(0.9, 1.1, 1.6, mat(COLORS.steelDark, { rough: 0.5, metal: 0.5 }), 0, 0.8, 0, 12));
    g.add(cyl(1.05, 1.05, 0.14, mat(COLORS.steelLight, { rough: 0.4, metal: 0.7 }), 0, 1.66, 0, 14));
    const master = make();
    master.position.set(0, 2.5, 0);
    g.add(master);
    animators.push({ update(t) { master.rotation.y = t * 0.5 + i; } });
    // a museum placard leaning on the pedestal base names the master; large
    // enough to read from the show camera, so no floating label needed
    const plate = makePlate(n, COLORS.std, 4.2, 0.95);
    plate.position.set(0, 0.62, 1.12);
    plate.rotation.x = -0.2;
    g.add(plate);
    g.position.set(x, UNDER_Y, 12);
    patternShop.add(g);
  });
  // the press: identical copies stamped out, one per beat
  const press = new THREE.Group();
  press.add(rbox(3.4, 0.5, 2.6, mat(COLORS.steelDark, { rough: 0.5, metal: 0.5 }), 0, 0.25, 0, 0.1));
  for (const dx of [-1.4, 1.4]) {
    press.add(rbox(0.35, 3.4, 0.35, mat(COLORS.steel, { rough: 0.45, metal: 0.65 }), dx, 2.0, 0, 0.06));
  }
  press.add(rbox(3.4, 0.5, 1.2, mat(COLORS.steel, { rough: 0.45, metal: 0.65 }), 0, 3.6, 0, 0.08));
  const pressPlate = makePlate('the Pattern Shop', COLORS.std, 3.2, 0.7);
  pressPlate.position.set(0, 3.6, 0.65);
  press.add(pressPlate);
  const ram = rbox(1.5, 0.9, 1.0, mat(COLORS.steelLight, { rough: 0.4, metal: 0.7 }), 0, 2.4, 0, 0.08);
  press.add(ram);
  const stamped = [];
  for (let i = 0; i < 3; i++) {
    const tile = rbox(0.8, 0.22, 0.8, mat(COLORS.std, { glow: true, ei: 0.6, rough: 0.35 }), 0, 0.6, 0, 0.05);
    tile.castShadow = false;
    press.add(tile);
    stamped.push({ tile, ph: i / 3 });
  }
  // east of the tightened pedestal row, clear of the Evaluation criteria
  // stand
  press.position.set(9.5, UNDER_Y, 12);
  patternShop.add(press);
  animators.push({
    update(t) {
      const cyc = (t * 0.5) % 1;
      ram.position.y = 2.4 - Math.max(0, Math.sin(cyc * Math.PI * 2)) * 1.15;
      for (const s of stamped) {
        const k = (t * 0.17 + s.ph) % 1;
        s.tile.position.set(k * 5.5, 0.61, 0);
        setFade(s.tile.material, s.tile.material.userData.baseOpacity * Math.min(1, (1 - k) * 3));
      }
    },
  });
  // the press wears the shop name on screen 14 (the master labels stay
  // floating: their placards read small from the show camera)
  const psLabel = lab(makeLabel('the Pattern Shop · Standards & Patterns', css(COLORS.std), 1.0), [], { band: true, group: 'patternShop' });
  psLabel.position.set(0, UNDER_Y + 6.4, 12);
  patternShop.add(psLabel);

  // ---- the MCP pipes (screen 15), joined to the plant via one hub ----
  // the three lines plug into a centralized header drum; a single main runs
  // from the drum through a flanged wall penetration into the spine
  const pipes = reg('pipes', 15);
  const HUBX = 35.5, HUBY = UNDER_Y + 3;
  const hubDrum = cyl(1.35, 1.35, 15.4, mat(COLORS.steel, { rough: 0.4, metal: 0.7 }), HUBX, HUBY, 0, 18);
  hubDrum.rotation.x = Math.PI / 2;
  pipes.add(hubDrum);
  for (const dz of [-7.85, 7.85]) {
    const cap = cyl(1.5, 1.5, 0.45, mat(COLORS.steelLight, { rough: 0.35, metal: 0.8 }), HUBX, HUBY, dz, 18);
    cap.rotation.x = Math.PI / 2;
    pipes.add(cap);
  }
  for (const dz of [-5, 0, 5]) {
    pipes.add(cyl(0.22, 0.3, 3.4, mat(COLORS.steelDark, { rough: 0.5, metal: 0.6 }), HUBX, UNDER_Y + 1.1, dz, 8));
  }
  for (const dz of [-6.9, 3, 6.9]) {
    const band = cyl(1.42, 1.42, 0.22, mat(COLORS.int, { glow: true, ei: 0.5, opacity: 0.9 }), HUBX, HUBY, dz, 18);
    band.rotation.x = Math.PI / 2;
    band.castShadow = false;
    pipes.add(band);
  }
  pipes.add(cyl(0.35, 0.35, 0.9, mat(COLORS.steelLight, { rough: 0.4, metal: 0.7 }), HUBX, HUBY + 1.65, 0, 10));
  beacon(pipes, COLORS.int, HUBX, HUBY + 2.4, 0, 2.8);
  // the layer name rides the hub drum's south end cap
  const hubPlate = makePlate('Integration Layer · MCP', COLORS.int, 4.6, 1.06);
  hubPlate.position.set(HUBX, HUBY, 8.09);
  pipes.add(hubPlate);
  const hubMain = cyl(0.8, 0.8, 4.6, mat(COLORS.int, { rough: 0.3, metal: 0.7, opacity: 0.95 }), 32.3, HUBY, 0, 14);
  hubMain.rotation.z = Math.PI / 2;
  pipes.add(hubMain);
  for (const [fx, fr] of [[30.9, 1.25], [34.35, 1.1]]) {
    const fl = cyl(fr, fr, 0.4, mat(COLORS.steelLight, { rough: 0.35, metal: 0.8 }), fx, HUBY, 0, 16);
    fl.rotation.z = Math.PI / 2;
    pipes.add(fl);
  }
  const pipeDefs = [
    ['pipeContext', 'Context · read-only', -6],
    ['pipeAction', 'Action · scoped write', 0],
    ['pipeObserve', 'Observe · traces out', 6],
  ];
  for (const [key2, name, z] of pipeDefs) {
    const g = new THREE.Group();
    g.userData.name = key2;
    const tb = cyl(0.5, 0.5, 21, mat(COLORS.int, { rough: 0.3, metal: 0.7, opacity: 0.95 }), 47.3, UNDER_Y + 3, z, 16);
    tb.rotation.z = Math.PI / 2;
    g.add(tb);
    // flanged joint where the line plugs into the hub drum, legs to ground
    const flange = cyl(0.85, 0.85, 0.3, mat(COLORS.steelLight, { rough: 0.35, metal: 0.8 }), 37.15, UNDER_Y + 3, z, 16);
    flange.rotation.z = Math.PI / 2;
    g.add(flange);
    for (const lx of [42, 54]) {
      g.add(cyl(0.14, 0.18, 4.4, mat(COLORS.steelDark, { rough: 0.5, metal: 0.6 }), lx, UNDER_Y + 0.8, z, 8));
    }
    for (let f = 0; f < 3; f++) {
      const fl = cyl(0.75, 0.75, 0.22, mat(COLORS.steelLight, { rough: 0.35, metal: 0.8 }), 43 + f * 6, UNDER_Y + 3, z, 16);
      fl.rotation.z = Math.PI / 2;
      g.add(fl);
    }
    g.add(rbox(1.1, 1.3, 1.1, mat(COLORS.steel, { rough: 0.4, metal: 0.7 }), 40, UNDER_Y + 3, z, 0.15));
    const wheel = torus(0.75, 0.1, mat(COLORS.int, { glow: true, ei: 0.5, metal: 0.5 }), 40, UNDER_Y + 4.4, z);
    wheel.rotation.x = Math.PI / 2;
    g.add(wheel);
    g.add(rbox(2.6, 4.2, 2.6, mat(0x1c232c, { rough: 0.45, metal: 0.5 }), 58, UNDER_Y + 2.1, z, 0.15));
    g.add(rbox(3.0, 1.7, 3.0, mat(0x232a31, { rough: 0.7, metal: 0.2 }), 58, UNDER_Y - 0.85, z, 0.1));
    for (let r = 0; r < 5; r++) {
      g.add(rbox(2.2, 0.5, 0.15, mat(0x2b3542, { rough: 0.4, metal: 0.5 }), 58, UNDER_Y + 0.6 + r * 0.75, z + 1.32, 0.04));
      const led = rbox(0.35, 0.12, 0.06, mat(COLORS.int, { glow: true, ei: 1.0 }), 58.75, UNDER_Y + 0.6 + r * 0.75, z + 1.36, 0.02);
      led.castShadow = false;
      g.add(led);
      const ph = Math.random() * 5;
      animators.push({
        update(t) {
          led.material.emissiveIntensity = led.material.userData.baseEmissive * (Math.sin(t * 6 + ph + r) > 0 ? 1 : 0.15);
        },
      });
    }
    const lbl = lab(makeLabel(name, css(COLORS.int), 0.75), [15]);
    lbl.position.set(50, UNDER_Y + 6.0, z);
    g.add(lbl);
    // rooftop sign on the endpoint cabinet, leaned back like a billboard
    const cabPlate = makePlate(name, COLORS.int, 6.2, 1.36);
    cabPlate.position.set(58, UNDER_Y + 5.0, z + 0.55);
    cabPlate.rotation.x = -0.15;
    g.add(cabPlate);
    pipes.add(g);
    groups[key2] = g;
  }
  const pipesLabel = lab(makeLabel('Integration Layer · MCP', css(COLORS.int), 1.0), [15], { band: true, group: 'pipes' });
  pipesLabel.position.set(48, UNDER_Y + 9.4, 0);
  pipes.add(pipesLabel);

  // ---- the warehouse (screen 16), joined to the network ----
  // the whole row stands on its own slab, fully west of the paved lot, so
  // every shelf sits on concrete (none half-buried in the lot edge)
  const warehouse = reg('warehouse', 16);
  const whPadMat = mat(0x1c232c, { rough: 0.6, metal: 0.3 });
  whPadMat.roughnessMap = noiseRoughness();
  warehouse.add(rbox(34, 0.7, 14, whPadMat, -60, GROUND_Y + 0.35, 0, 0.15));
  const whPadEdge = edges(34, 0.7, 14, COLORS.know, 0.3);
  whPadEdge.position.set(-60, GROUND_Y + 0.35, 0);
  warehouse.add(whPadEdge);
  // the layer name runs along the slab's south face like a curb sign
  const whCurb = makePlate('Knowledge Layer', COLORS.know, 10, 0.62);
  whCurb.position.set(-60, GROUND_Y + 0.35, 7.03);
  warehouse.add(whCurb);
  const shelfNames = ['Code & architecture', 'Internal knowledge', 'Process & standards', 'External docs'];
  const WH_Y = GROUND_Y + 0.7 + 1.7; // shelf base rests on the slab top
  shelfNames.forEach((n, s) => {
    const x = -72 + s * 9;
    const g = new THREE.Group();
    g.add(rbox(4.6, 1.7, 6.2, mat(0x232a31, { rough: 0.7, metal: 0.2 }), 0, -0.85, 0, 0.1));
    for (const dz of [-2.4, 2.4]) {
      g.add(rbox(0.35, 5.6, 0.35, mat(COLORS.steelDark, { rough: 0.5, metal: 0.6 }), -1.6, 2.8, dz, 0.06));
      g.add(rbox(0.35, 5.6, 0.35, mat(COLORS.steelDark, { rough: 0.5, metal: 0.6 }), 1.6, 2.8, dz, 0.06));
    }
    for (let lv = 0; lv < 3; lv++) {
      g.add(rbox(3.8, 0.18, 5.6, mat(COLORS.steel, { rough: 0.5, metal: 0.55 }), 0, 1.2 + lv * 1.7, 0, 0.05));
      for (let c = 0; c < 3; c++) {
        const tone = [0x1f6f66, 0x1d6e80, 0x246a58][(lv + c) % 3];
        g.add(rbox(1.0, 1.0, 1.25, mat(tone, { rough: 0.55, metal: 0.2, glow: true, emissive: COLORS.know, ei: 0.12 }), -1.15 + c * 1.15, 1.9 + lv * 1.7, -1.5 + c * 1.5, 0.12));
      }
    }
    beacon(g, COLORS.know, 0, 6.1, 0, 1.6);
    // aisle sign across the top of the front frame posts names the shelf
    const plate = makePlate(n, COLORS.know, 4.4, 0.9);
    plate.position.set(0, 5.3, 2.6);
    g.add(plate);
    g.position.set(x, WH_Y, 0);
    warehouse.add(g);
  });
  // the knowledge main runs LEVEL at trunk height: a riser out of the slab,
  // a straight elevated run in front of the racks on its own legs, one turn
  // at the plant, and a flanged wall entry at the same height as the trunk
  const whMain = tube(elbow([
    [-68, -12.8, 3.8], [-68, -8.8, 3.8], [-34, -8.8, 3.8], [-34, -8.8, 0], [-30.8, -8.8, 0],
  ], 1.2), 0.2, mat(COLORS.know, { glow: true, ei: 0.25, opacity: 0.95 }), 32);
  warehouse.add(whMain);
  pulsesAlong(warehouse, whMain.userData.curve, COLORS.know, 2, 0.16, 0.13);
  flangesAlong(warehouse, whMain.userData.curve, 0.2, 4);
  for (const [lx, lc, lh] of [[-60, -10.85, 4.1], [-48, -10.85, 4.1], [-37, -10.4, 3.2]]) {
    warehouse.add(cyl(0.12, 0.16, lh, mat(COLORS.steelDark, { rough: 0.5, metal: 0.6 }), lx, lc, 3.8, 8));
  }
  const whFlange = cyl(0.5, 0.5, 0.32, mat(COLORS.steelLight, { rough: 0.35, metal: 0.8 }), -30.7, -8.8, 0, 14);
  whFlange.rotation.z = Math.PI / 2;
  warehouse.add(whFlange);
  const whLabel = lab(makeLabel('Knowledge Layer', css(COLORS.know), 1.0), [16], { band: true, group: 'warehouse' });
  whLabel.position.set(-58, UNDER_Y + 9.4, 0);
  warehouse.add(whLabel);

  // ---- cross-links between the layers (born as each layer is described) ----
  // the patterns link: one yellow main tees off the shop's trunk and plugs
  // straight into the capability trunk, both ends direct, at trunk height.
  // It arrives WITH the pattern shop on slide 14, not before.
  const linkPatterns = reg('linkPatterns', 14);
  const lp = tube([[-4, spineY, 12], [-4, spineY, -7.4]], 0.16, mat(COLORS.std, { glow: true, ei: 0.3, opacity: 0.95 }), 16);
  linkPatterns.add(lp);
  pulsesAlong(linkPatterns, lp.userData.curve, COLORS.std, 2, 0.2, 0.11);
  flangesAlong(linkPatterns, lp.userData.curve, 0.16, 3);
  const linkPipesCap = reg('linkPipesCap', 15);
  const lpc = tube(elbow([[23, spineY + 0.6, -2], [17.5, spineY + 0.6, -2], [17.5, spineY + 0.6, -7.5], [13, spineY + 0.6, -7.5], [12, spineY - 0.15, -7.5]]), 0.13, mat(COLORS.int, { glow: true, ei: 0.3, opacity: 0.95 }), 20);
  linkPipesCap.add(lpc);
  pulsesAlong(linkPipesCap, lpc.userData.curve, COLORS.int, 1, 0.2, 0.11);
  flangesAlong(linkPipesCap, lpc.userData.curve, 0.13, 2);
  const linkKnow = reg('linkKnow', 16);
  const lk1 = tube(elbow([[-23, spineY + 0.6, -2], [-17.5, spineY + 0.6, -2], [-17.5, spineY + 0.6, -7.5], [-13, spineY + 0.6, -7.5], [-12, spineY - 0.15, -7.5]]), 0.13, mat(COLORS.know, { glow: true, ei: 0.3, opacity: 0.95 }), 20);
  linkKnow.add(lk1);
  pulsesAlong(linkKnow, lk1.userData.curve, COLORS.know, 1, 0.2, 0.11);
  flangesAlong(linkKnow, lk1.userData.curve, 0.13, 2);
  const lk2 = tube(elbow([[-23, spineY + 0.3, -2], [-21, spineY + 0.3, -3.6], [21, spineY + 0.3, -3.6], [23, spineY + 0.3, -2]]), 0.11, mat(COLORS.know, { glow: true, ei: 0.25, opacity: 0.9 }), 24);
  linkKnow.add(lk2);
  pulsesAlong(linkKnow, lk2.userData.curve, COLORS.know, 1, 0.16, 0.1);
  flangesAlong(linkKnow, lk2.userData.curve, 0.11, 3);

  // ---- the Catalog Marketplace (screen 17): one hub, many factories ----
  const market = reg('market', 17);
  const MX = MARKET.x, MZ = MARKET.z;
  const mpad = mat(0x232a31, { rough: 0.8, metal: 0.1 });
  mpad.roughnessMap = noiseRoughness();
  market.add(rbox(56, 0.6, 42, mpad, MX, GROUND_Y + 0.3, MZ, 0.25));
  const mEdge = edges(56, 0.6, 42, COLORS.dist, 0.4);
  mEdge.position.set(MX, GROUND_Y + 0.3, MZ);
  market.add(mEdge);
  // the hub is a plant of its own, at our factory's scale: a sealed BLACK
  // BOX. Components go in one side and come out the other; what happens
  // inside is not ours to see. Glowing seams, roof gear, a drone port.
  const BY = GROUND_Y + 0.6;
  const boxMat = mat(0x0d1217, { rough: 0.45, metal: 0.35 });
  boxMat.roughnessMap = noiseRoughness();
  market.add(rbox(36, 15, 26, boxMat, MX, BY + 7.5, MZ, 0.4));
  const boxSeams = edges(36, 15, 26, COLORS.dist, 0.55);
  boxSeams.position.set(MX, BY + 7.5, MZ);
  market.add(boxSeams);
  for (const sy of [5, 10]) {
    for (const dz of [-13.05, 13.05]) {
      const seam = rbox(36.1, 0.14, 0.14, mat(COLORS.dist, { glow: true, ei: 0.4, opacity: 0.85 }), MX, BY + sy, MZ + dz, 0.03);
      seam.castShadow = false;
      market.add(seam);
    }
  }
  // the building wears its own name, on the faces the cameras see
  const mPlateS = makePlate('Catalog Marketplace', COLORS.dist, 13, 2.4);
  mPlateS.position.set(MX, BY + 12.4, MZ + 13.08);
  market.add(mPlateS);
  const mPlateE = makePlate('Catalog Marketplace', COLORS.dist, 13, 2.4);
  mPlateE.position.set(MX + 18.08, BY + 12.4, MZ);
  mPlateE.rotation.y = Math.PI / 2;
  market.add(mPlateE);
  // roof gear: vents, a warning stack, the drone port
  for (const [vx, vz] of [[-10, -6], [-3, -8], [-11, 2]]) {
    market.add(rbox(4, 2.2, 4, mat(COLORS.steelDark, { rough: 0.5, metal: 0.55 }), MX + vx, BY + 16.1, MZ + vz, 0.15));
  }
  market.add(cyl(1.0, 1.4, 8, mat(COLORS.steel, { rough: 0.5, metal: 0.6 }), MX - 14, BY + 18.8, MZ - 8, 14));
  beacon(market, COLORS.gov, MX - 14, BY + 23.2, MZ - 8, 2.2);
  market.add(rbox(11, 0.3, 11, mat(0x171d25, { rough: 0.55, metal: 0.3 }), MX + 9, BY + 15.25, MZ + 5, 0.06));
  const port = torus(4.4, 0.18, mat(COLORS.dist, { glow: true, ei: 0.6 }), MX + 9, BY + 15.55, MZ + 5);
  port.rotation.x = Math.PI / 2;
  port.castShadow = false;
  market.add(port);
  // in and out conveyors through door slits: imports enter the west face,
  // finished components emerge from the east face
  const flowBlocks = [];
  for (const side of [-1, 1]) {
    const bx = MX + side * 26;
    const bz = MZ - side * 4.5;
    market.add(rbox(16, 0.8, 5, mat(0x1b222b, { rough: 0.6, metal: 0.4 }), bx, BY + 1, bz, 0.12));
    market.add(rbox(16.4, 0.6, 0.5, mat(COLORS.steel, { rough: 0.45, metal: 0.65 }), bx, BY + 1.25, bz + 2.6, 0.08));
    market.add(rbox(16.4, 0.6, 0.5, mat(COLORS.steel, { rough: 0.45, metal: 0.65 }), bx, BY + 1.25, bz - 2.6, 0.08));
    const door = rbox(0.7, 5, 5.8, mat(COLORS.dist, { glow: true, ei: 0.3, opacity: 0.6 }), MX + side * 18.2, BY + 3, bz, 0.08);
    door.castShadow = false;
    market.add(door);
    for (let b = 0; b < 3; b++) {
      const blk = rbox(1.9, 1.9, 1.9, mat(blockColors[(b + (side > 0 ? 2 : 0)) % 5], { glow: true, ei: 0.5, rough: 0.35 }), bx, BY + 2.4, bz, 0.18);
      blk.castShadow = false;
      market.add(blk);
      flowBlocks.push({ blk, side, ph: b / 3 });
    }
  }
  animators.push({
    update(t) {
      const gk = Math.max(world._factorK('market'), 0.001);
      for (const f of flowBlocks) {
        const k = (t * 0.07 + f.ph) % 1;
        const x0 = f.side < 0 ? MX - 34 : MX + 17.6;
        const x1 = f.side < 0 ? MX - 17.6 : MX + 34;
        f.blk.position.x = x0 + (x1 - x0) * k;
        setFade(f.blk.material, f.blk.material.userData.baseOpacity * gk * Math.min(1, Math.sin(k * Math.PI) * 2.5));
      }
    },
  });
  // status LEDs beside the east door
  for (let l = 0; l < 4; l++) {
    const led = rbox(1.1, 0.26, 0.1, mat(COLORS.dist, { glow: true, ei: 0.9 }), MX + 12.5, BY + 5.4 + l * 1.5, MZ + 13.06, 0.04);
    led.castShadow = false;
    market.add(led);
    const lph = l * 1.3;
    animators.push({
      update(t) {
        led.material.emissiveIntensity = led.material.userData.baseEmissive * (Math.sin(t * 4 + lph) > 0 ? 1 : 0.15);
      },
    });
  }
  // storefront: what trades here, on display along the south face
  market.add(rbox(20, 0.7, 3.4, mat(COLORS.steel, { rough: 0.5, metal: 0.5 }), MX, BY + 1.85, MZ + 17.5, 0.1));
  for (let b = 0; b < 5; b++) {
    market.add(rbox(2.2, 2.2, 2.2, mat(blockColors[b % 5], { glow: true, ei: 0.5, rough: 0.35 }), MX - 8 + b * 4, BY + 3.3, MZ + 17.5, 0.2));
  }
  // drone pads
  for (const [dx, dz] of [[-22, -16], [22, -16], [-22, 16], [22, 16]]) {
    market.add(rbox(6.5, 0.25, 6.5, mat(0x1a212a, { rough: 0.6, metal: 0.3 }), MX + dx, GROUND_Y + 0.72, MZ + dz, 0.08));
    market.add(rbox(5.2, 0.08, 5.2, mat(COLORS.dist, { glow: true, ei: 0.3, opacity: 0.6 }), MX + dx, GROUND_Y + 0.9, MZ + dz, 0.03));
  }
  const mLabel = lab(makeLabel('Catalog Marketplace', css(COLORS.dist), 1.1), [17], { band: true, group: 'market' });
  mLabel.position.set(MX, GROUND_Y + 27, MZ);
  market.add(mLabel);
  const mSub = lab(makeLabel('skills · MCPs · templates · workflow blocks', css(COLORS.dist), 0.75), [17]);
  mSub.position.set(MX, GROUND_Y + 24.6, MZ);
  market.add(mSub);

  // far plants: the marketplace serves many factories
  const plantSpots = [[-115, -75], [125, -60], [95, 70], [-95, 62]];
  for (const [x, z] of plantSpots) {
    const g = new THREE.Group();
    g.add(rbox(22, 7, 14, mat(0x222b35, { rough: 0.55, metal: 0.4 }), 0, 3.5, 0, 0.4));
    const pe = edges(22, 7, 14, COLORS.dist, 0.7);
    pe.position.set(0, 3.5, 0);
    g.add(pe);
    g.add(rbox(8, 3.5, 7, mat(0x2a3440, { rough: 0.5, metal: 0.45 }), 5, 8.5, 1.5, 0.3));
    g.add(cyl(0.6, 0.8, 4, mat(COLORS.steel, { rough: 0.5, metal: 0.6 }), -7, 9, -3, 12));
    beacon(g, COLORS.dist, -7, 11.4, -3, 1.8);
    g.position.set(x, GROUND_Y + 0.2, z);
    market.add(g);
  }
  // the internet: open source and vendors feed the marketplace
  const inet = new THREE.Group();
  const inetCore = new THREE.Mesh(new THREE.IcosahedronGeometry(3.2, 1), holoMat(COLORS.know, 0.35));
  inetCore.castShadow = false;
  inet.add(inetCore);
  const inetRing = torus(4.6, 0.1, mat(COLORS.know, { glow: true, ei: 0.7 }), 0, 0, 0);
  inetRing.rotation.x = Math.PI / 2.4;
  inet.add(inetRing);
  inet.position.set(-70, 24, -125);
  market.add(inet);
  const inetLbl = lab(makeLabel('the internet · open source & vendors', css(COLORS.know), 1.0), [17]);
  inetLbl.position.set(-70, 32, -125);
  market.add(inetLbl);
  animators.push({
    update(t) {
      inetCore.rotation.y = t * 0.4;
      inetRing.rotation.z = t * 0.25;
    },
  });
  // drones: one marketplace, many factories; the head office consumes from
  // it. They land on the black box's rooftop port.
  const MPAD = new THREE.Vector3(MX + 9, GROUND_Y + 19.3, MZ + 5);
  const droneRoutes = [
    { cargo: 'proven template · to another plant', from: MPAD, to: new THREE.Vector3(-115, -4, -75), color: COLORS.dist },
    { cargo: 'workflow shape · to another plant', from: MPAD, to: new THREE.Vector3(95, -4, 70), color: COLORS.dist },
    { cargo: 'community skill · import', from: new THREE.Vector3(125, -4, -60), to: MPAD, color: COLORS.cap },
    { cargo: 'vendor MCP · import', from: new THREE.Vector3(-70, 24, -125), to: MPAD, color: COLORS.know },
    { cargo: 'to our catalog', from: MPAD, to: new THREE.Vector3(OX, 20, OZ), color: COLORS.life },
  ];
  const drones = [];
  droneRoutes.forEach((route, i) => {
    const g = new THREE.Group();
    g.add(rbox(1.0, 0.35, 1.0, mat(COLORS.steelLight, { rough: 0.35, metal: 0.7 }), 0, 0, 0, 0.1));
    const rotors = [];
    for (const [ax, az] of [[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9]]) {
      g.add(rbox(1.0, 0.08, 0.12, mat(COLORS.steel, { rough: 0.4, metal: 0.7 }), ax * 0.6, 0.05, az * 0.6, 0.02));
      const disc = cyl(0.55, 0.55, 0.05, mat(route.color, { glow: true, ei: 0.4, opacity: 0.5 }), ax, 0.18, az, 16);
      disc.castShadow = false;
      g.add(disc);
      rotors.push(disc);
    }
    beacon(g, route.color, 0, 0.35, 0, 4);
    g.add(cyl(0.03, 0.03, 1.1, mat(COLORS.steelLight, { rough: 0.5, metal: 0.6 }), 0, -0.75, 0, 6));
    g.add(rbox(0.95, 0.95, 0.95, mat(route.color, { glow: true, ei: 0.35, rough: 0.45 }), 0, -1.7, 0, 0.12));
    const lbl = lab(makeLabel(route.cargo, css(route.color), 1.0), [17]);
    lbl.position.set(0, 1.6, 0);
    g.add(lbl);
    market.add(g);
    drones.push({ g, rotors, from: route.from, to: route.to, ph: i * 0.27 });
  });
  animators.push({
    update(t, dt) {
      for (const d of drones) {
        const k = (t * 0.07 + d.ph) % 1;
        d.g.position.lerpVectors(d.from, d.to, k);
        d.g.position.y = Math.max(d.g.position.y, GROUND_Y + 6) + Math.sin(k * Math.PI) * 12;
        d.g.rotation.y = Math.atan2(d.to.x - d.from.x, d.to.z - d.from.z);
        d.g.rotation.z = Math.sin(t * 2 + d.ph) * 0.06;
        for (const r of d.rotors) r.rotation.y += dt * 30;
      }
    },
  });

  // marketplace supply: underground main into the spine + collars on the
  // layer trunks (foundry evolution 2 rides this route via the catalog)
  const linkMarket = reg('linkMarket', 17);
  const supply = tube(elbow([[MX, GROUND_Y + 1.2, MZ + 14], [MX, GROUND_Y + 1.0, -44], [6, GROUND_Y + 1.0, -44], [6, -10.8, -12], [6, spineY + 0.4, -7.6]], 2.2), 0.22, mat(COLORS.dist, { glow: true, ei: 0.3, opacity: 0.95 }), 36);
  linkMarket.add(supply);
  pulsesAlong(linkMarket, supply.userData.curve, COLORS.dist, 3, 0.1, 0.15);
  flangesAlong(linkMarket, supply.userData.curve, 0.22, 5);
  for (const [cx3, cz3] of [[6, -7.5], [-4, 12], [23, -2], [-23, -2]]) {
    const collar = torus(0.42, 0.09, mat(COLORS.dist, { glow: true, ei: 0.6 }), cx3, spineY + 0.4, cz3);
    collar.rotation.x = Math.PI / 2;
    collar.castShadow = false;
    linkMarket.add(collar);
  }

  // ---- governance (screen 19): four mechanisms, one fixture each ----
  // access arches at the entrances, quality gates between stations,
  // sign-off masts on the mixed rooms, and the audit ledger tower
  const governance = reg('governance', 19);
  const govSub = name => {
    const g = new THREE.Group();
    g.userData.name = name;
    governance.add(g);
    groups[name] = g;
    return g;
  };
  const govAccess = govSub('govAccess');
  const govGates = govSub('govGates');
  const govDecision = govSub('govDecision');
  const govAudit = govSub('govAudit');
  const govPipes = govSub('govPipes');

  // access control: arches remain only at the entrances, each foot wearing
  // a badge reader; nothing enters unscanned
  const govBeams = [];
  const govReaders = [];
  const accessSpots = [
    [0, 0, CELL_Z, 7.0, govAccess],
    [0, 0, -16.5, 4.8, govAccess],
    [46, UNDER_Y + 3, 0, 8.2, govPipes],
  ];
  for (const [x, y, z, radius, target] of accessSpots) {
    const arch = torus(radius, 0.24, mat(COLORS.gov, { glow: true, ei: 1.1, metal: 0.3 }), x, y + 0.5, z, Math.PI);
    arch.rotation.y = Math.PI / 2;
    target.add(arch);
    for (const fz of [-radius, radius]) {
      target.add(rbox(0.7, 0.9, 0.7, mat(COLORS.steelDark, { rough: 0.5, metal: 0.6 }), x, y + 0.45, z + fz, 0.1));
      target.add(rbox(0.4, 1.6, 0.4, mat(COLORS.steelDark, { rough: 0.5, metal: 0.6 }), x + 1.1, y + 0.8, z + fz, 0.06));
      const head = rbox(0.62, 0.75, 0.26, mat(0x1c232c, { rough: 0.4, metal: 0.5 }), x + 1.1, y + 1.85, z + fz, 0.05);
      head.rotation.x = -0.25;
      target.add(head);
      const chip = rbox(0.32, 0.15, 0.08, mat(COLORS.gov, { glow: true, ei: 1.3 }), x + 1.1, y + 1.94, z + fz + 0.16, 0.02);
      chip.castShadow = false;
      target.add(chip);
      govReaders.push({ chip, ph: (z + fz) * 0.7 + x, group: target });
    }
    const beam = new THREE.Mesh(new THREE.PlaneGeometry(radius * 1.9, radius * 0.9), holoMat(COLORS.gov, 0.1));
    beam.position.set(x, y + radius * 0.5, z);
    beam.rotation.y = Math.PI / 2;
    target.add(beam);
    govBeams.push({ beam, group: target });
  }
  animators.push({
    update(t) {
      for (const b of govBeams) {
        const k = world._factorK(b.group.userData.name);
        setFade(b.beam.material, b.beam.material.userData.baseOpacity * k * (0.5 + 0.5 * Math.sin(t * 2.4)));
      }
      for (const r of govReaders) {
        const k = world._factorK(r.group.userData.name);
        r.chip.material.emissiveIntensity = r.chip.material.userData.baseEmissive * k * (Math.sin(t * 3 + r.ph) > 0.2 ? 1 : 0.25);
      }
    },
  });

  // quality gates: one gate between every pair of stations; the curtain
  // flares as a product rides through it
  const gates = [];
  for (let i = 0; i < 6; i++) {
    const gx = STATION_X(i) + 3.5;
    for (const pz of [-2.0, 2.0]) {
      govGates.add(rbox(0.32, 3.0, 0.32, mat(COLORS.steelDark, { rough: 0.5, metal: 0.6 }), gx, 1.6, pz, 0.05));
      govGates.add(rbox(0.36, 0.2, 0.36, mat(COLORS.gov, { glow: true, ei: 0.8 }), gx, 3.2, pz, 0.04));
    }
    govGates.add(rbox(0.3, 0.3, 4.4, mat(COLORS.gov, { glow: true, ei: 0.9, metal: 0.3 }), gx, 3.05, 0, 0.05));
    // two crossed curtain planes so the light wall reads from the front
    // shot as well as along the belt
    const curtain = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1.9), holoMat(COLORS.gov, 0.12));
    curtain.position.set(gx, 1.9, 0);
    curtain.rotation.y = Math.PI / 2;
    govGates.add(curtain);
    const curtainX = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.9), holoMat(COLORS.gov, 0.12));
    curtainX.position.set(gx, 1.9, 0);
    govGates.add(curtainX);
    const lamp = rbox(0.42, 0.2, 0.42, mat(COLORS.gov, { glow: true, ei: 1.0 }), gx, 3.3, 0, 0.03);
    lamp.castShadow = false;
    govGates.add(lamp);
    gates.push({ gx, curtain, curtainX, lamp, hot: 0 });
  }
  animators.push({
    update(t, dt) {
      const k = world._factorK('govGates');
      for (const g of gates) {
        let near = false;
        for (const j of journeys) {
          if (j.mode === 'idle' || !j.grp.visible) continue;
          const p = j.grp.position;
          if (Math.abs(p.x - g.gx) < 0.9 && Math.abs(p.z) < 0.8 && p.y < 2.2) { near = true; break; }
        }
        g.hot += ((near ? 1 : 0) - g.hot) * Math.min(1, dt * 8);
        setFade(g.curtain.material, g.curtain.material.userData.baseOpacity * k * (1 + g.hot * 3));
        setFade(g.curtainX.material, g.curtainX.material.userData.baseOpacity * k * (1 + g.hot * 3));
        g.lamp.material.emissiveIntensity = g.lamp.material.userData.baseEmissive * k * (0.3 + g.hot * 1.4);
      }
    },
  });

  // decision rules: a sign-off mast on each mixed room (Design, Verify,
  // Measure); the slow-spinning ring is the arch motif at desk scale
  const signRings = [];
  for (const i of [1, 3, 6]) {
    const x = STATION_X(i) - 1.1;
    govDecision.add(cyl(0.08, 0.12, 2.2, mat(COLORS.steel, { rough: 0.45, metal: 0.7 }), x, 4.8, ROOM_Z, 10));
    const ring = torus(0.65, 0.11, mat(COLORS.gov, { glow: true, ei: 1.1 }), x, 6.3, ROOM_Z);
    govDecision.add(ring);
    signRings.push(ring);
    beacon(govDecision, COLORS.gov, x, 7.0, ROOM_Z, 2.2);
  }
  animators.push({
    update(t) { for (const r of signRings) r.rotation.y = t * 0.8; },
  });

  // audit: the ledger tower east of the line; every fixture reports into
  // it and the record rows visibly fill, recorded and replayable
  const AUD = { x: 27.5, z: -8 };
  govAudit.add(rbox(4.2, 0.5, 4.2, mat(0x232a31, { rough: 0.7, metal: 0.2 }), AUD.x, 0.25, AUD.z, 0.1));
  govAudit.add(rbox(3.2, 5.6, 3.2, mat(0x1c232c, { rough: 0.45, metal: 0.5 }), AUD.x, 3.3, AUD.z, 0.15));
  const audEdge = edges(3.2, 5.6, 3.2, COLORS.gov, 0.35);
  audEdge.position.set(AUD.x, 3.3, AUD.z);
  govAudit.add(audEdge);
  const ledgerLeds = [];
  for (let r = 0; r < 7; r++) {
    const ry = 1.0 + r * 0.64;
    govAudit.add(rbox(2.4, 0.4, 0.14, mat(0x2b3542, { rough: 0.4, metal: 0.5 }), AUD.x - 0.2, ry, AUD.z + 1.66, 0.03));
    const led = rbox(0.42, 0.18, 0.08, mat(COLORS.gov, { glow: true, ei: 1.1 }), AUD.x + 1.15, ry, AUD.z + 1.71, 0.02);
    led.castShadow = false;
    govAudit.add(led);
    ledgerLeds.push(led);
  }
  const audPlate = makePlate('Audit ledger', COLORS.gov, 3.4, 0.8);
  audPlate.position.set(AUD.x, 5.5, AUD.z + 1.62);
  govAudit.add(audPlate);
  animators.push({
    update(t) {
      const k = world._factorK('govAudit');
      const fill = 1 + Math.floor((t / 0.7) % 7);
      ledgerLeds.forEach((led, r) => {
        const on = r < fill ? 1 : 0.12;
        const blink = r === fill - 1 ? (Math.sin(t * 9) > 0 ? 1 : 0.25) : 1;
        led.material.emissiveIntensity = led.material.userData.baseEmissive * k * on * blink;
      });
    },
  });
  // red record threads: one from each mechanism into the tower top
  const audPulses = [];
  const audSources = [
    [0, 8.0, CELL_Z],
    [0, 5.6, -16.5],
    [3.5, 3.2, 0],
    [STATION_X(3) - 1.1, 6.4, ROOM_Z],
    [46, UNDER_Y + 11.5, 0],
  ];
  audSources.forEach((from, i) => {
    const a = new THREE.Vector3(...from);
    const b2 = new THREE.Vector3(AUD.x, 6.2, AUD.z);
    const mid = a.clone().lerp(b2, 0.5);
    mid.y = Math.max(a.y, b2.y) + 3.5;
    const curve = new THREE.CatmullRomCurve3([a, mid, b2]);
    const thread = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.09, 6), holoMat(COLORS.gov, 0.45));
    govAudit.add(thread);
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), mat(COLORS.gov, { glow: true, ei: 1.3 }));
    p.castShadow = false;
    govAudit.add(p);
    audPulses.push({ curve, mesh: p, ph: i / 5 });
  });
  animators.push({
    update(t) {
      for (const p of audPulses) p.curve.getPointAt((t * 0.22 + p.ph) % 1, p.mesh.position);
    },
  });

  // per-mechanism tags and focus sets (mirrors the screen 18 x-ray)
  const govTags = reg('govTags', 19);
  const GOVX = [
    { set: ['govAccess', 'govPipes', 'govTags', 'bays', 'bayIDE', 'bayPortal', 'bayAuto', 'intake', 'pipes', 'pipeContext', 'pipeAction', 'pipeObserve'],
      tag: 'Access control · badge in at every entrance', pos: [0, 11.5, -14] },
    { set: ['govGates', 'govTags', 'line', 'beltLine', 'journeys'],
      tag: 'Quality gates · a check between every station', pos: [10, 7, 0] },
    { set: ['govDecision', 'govTags', 'line'],
      tag: 'Decision rules · where a human signs off', pos: [5.5, 9.5, -5] },
    { set: ['govAudit', 'govAccess', 'govGates', 'govDecision', 'govPipes', 'govTags'],
      tag: 'Audit · every action recorded, replayable', pos: [23, 10.0, -9] },
  ];
  const govTagSprites = GOVX.map(x2 => {
    const s = makeLabel(x2.tag, css(COLORS.gov), 0.85);
    s.position.set(...x2.pos);
    s.visible = false;
    govTags.add(s);
    return s;
  });
  world.setGovFocus = sub => setFocusSet('gov', GOVX, govTagSprites, sub);
  const govLabel = lab(makeLabel('Governance · access · gates · decisions · audit', css(COLORS.gov), 1.1), [], { band: true, group: 'governance' });
  govLabel.position.set(0, 13.6, 0);
  governance.add(govLabel);

  // ---- measurement sensors (screen 20) ----
  const measurement = reg('measurement', 20);
  // the board is long enough to wear the full metric list at plate size:
  // one bar per metric, the nameplate running underneath them
  const dash = new THREE.Group();
  for (const px of [-3, 3]) {
    dash.add(cyl(0.28, 0.4, 5, mat(COLORS.steelDark, { rough: 0.5, metal: 0.6 }), px, 2.5, 0, 10));
  }
  dash.add(rbox(9.4, 3.4, 0.5, mat(0x131920, { rough: 0.3, metal: 0.4 }), 0, 6.4, 0, 0.15));
  [1.0, 1.7, 1.3, 2.1].forEach((bh, i) => {
    const bar = rbox(0.9, bh, 0.14, mat(COLORS.meas, { glow: true, ei: 0.8 }), -3.15 + i * 2.1, 5.75 + bh / 2, 0.32, 0.05);
    bar.castShadow = false;
    dash.add(bar);
  });
  const dashPlate = makePlate('adoption · impact · outcomes · demand', COLORS.meas, 8.6, 0.95);
  dashPlate.position.set(0, 5.15, 0.28);
  dash.add(dashPlate);
  const dashLbl = lab(makeLabel('adoption · impact · outcomes · demand', css(COLORS.meas), 0.8), [20]);
  dashLbl.position.set(0, 9.4, 0);
  dash.add(dashLbl);
  dash.position.set(-26, 0, -16);
  measurement.add(dash);
  const dashTop = new THREE.Vector3(-26, 6.4, -16);
  const threadFrom = [
    [0, 4.2, -2], [0, 2.5, CELL_Z], [OX, 18, OZ], [0, UNDER_Y + 3, -7.5],
    [38, UNDER_Y + 3.6, 0], [-58, UNDER_Y + 5, 0], [0, 1.2, 5.2],
  ];
  const threads = [];
  const pulses = [];
  threadFrom.forEach((p, i) => {
    const from = new THREE.Vector3(...p);
    const mid = from.clone().lerp(dashTop, 0.5);
    mid.y += 4 + (i % 3) * 2;
    const curve = new THREE.CatmullRomCurve3([from, mid, dashTop]);
    const tb = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.07, 6), holoMat(COLORS.meas, 0.55));
    const tg = new THREE.Group();
    tg.add(tb);
    measurement.add(tg);
    threads.push(tg);
    const pulse = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 10), mat(COLORS.meas, { glow: true, ei: 1.4, rough: 0.3 }));
    pulse.castShadow = false;
    tg.add(pulse);
    pulses.push({ mesh: pulse, curve, ph: i * 0.17 });
  });
  world.measThreads = threads;
  const feedCurve = new THREE.CatmullRomCurve3([
    dashTop.clone(), new THREE.Vector3(-16, 16, -22), new THREE.Vector3(0, 14.5, -20.5),
  ]);
  const feed = new THREE.Mesh(new THREE.TubeGeometry(feedCurve, 24, 0.16, 8), holoMat(COLORS.meas, 0.95));
  measurement.add(feed);
  const feedLbl = lab(makeLabel('signals feed the intake · the loop closes', css(COLORS.meas), 0.9), [20], { band: true, group: 'measurement' });
  feedLbl.position.set(-10, 17.5, -22);
  measurement.add(feedLbl);
  animators.push({
    update(t) {
      for (const p of pulses) {
        const k = (t * 0.25 + p.ph) % 1;
        p.curve.getPointAt(k, p.mesh.position);
      }
    },
  });

  // ---- dock + product ----
  const dock = reg('dock', 5);
  // no roof, no solid gate: an open window frames the belt so products
  // visibly ride through, and the nameplate is the header sign
  for (const gx of [-3.1, 3.1]) {
    dock.add(rbox(2.8, 5.8, 1.5, mat(0x1d242d, { rough: 0.55, metal: 0.4 }), gx, 2.9, 15.6, 0.25));
  }
  dock.add(rbox(3.6, 1.4, 1.5, mat(0x1d242d, { rough: 0.55, metal: 0.4 }), 0, 5.1, 15.6, 0.25));
  dock.add(rbox(5, 0.4, 12, mat(0x1b222b, { rough: 0.6, metal: 0.4 }), 0, 0.5, 21, 0.1));
  for (let gl = 0; gl < 5; gl++) {
    const dot = rbox(0.3, 0.08, 0.3, mat(COLORS.outcome, { glow: true, ei: 1.0 }), -1.9, 0.74, 16.5 + gl * 2.2, 0.02);
    dot.castShadow = false;
    dock.add(dot);
    const dot2 = dot.clone();
    dot2.position.x = 1.9;
    dock.add(dot2);
  }
  beacon(dock, COLORS.outcome, 0, 6.2, 15.6, 2.4);
  // the window wears its name on the header
  const dockPlate = makePlate('Outcome dock', COLORS.outcome, 5, 1.0);
  dockPlate.position.set(0, 5.1, 16.4);
  dock.add(dockPlate);
  const dockLabel = lab(makeLabel('Outcome dock', css(COLORS.outcome), 0.95), [], { band: true, group: 'dock' });
  dockLabel.position.set(0, 7.6, 15.6);
  dock.add(dockLabel);

  const product = reg('product', 23);
  const prodLbl = lab(makeLabel('a delivered outcome the org can trust', css(COLORS.outcome), 0.95), [23]);
  prodLbl.position.set(0, 4.6, 22);
  product.add(prodLbl);

  // ---- screen 18: the infrastructure IS the structure (x-ray) ----
  const infraTags = reg('infraTags', 18);
  const XRAY = [
    { set: ['shell', 'campus', 'lot', 'infraTags'], tag: 'Compute & hosting · the slab and columns', pos: [0, 15, -2] },
    { set: ['beltLine', 'loopBelt', 'dock', 'infraTags'], tag: 'CI/CD pipelines · the belts themselves', pos: [0, 6.5, 8] },
    { set: ['machineRoom', 'infraTags'], tag: 'Agent runtime · the machine room', pos: [22, -3, 9] },
    { set: ['basementNet', 'infraTags'], tag: 'Data pipeline · the wires and trunks', pos: [0, -2.5, -2] },
  ];
  const xrayTags = XRAY.map(x2 => {
    const s = makeLabel(x2.tag, css(COLORS.infra), 1.0);
    s.position.set(...x2.pos);
    s.visible = false;
    infraTags.add(s);
    return s;
  });
  const infraLabel = lab(makeLabel('Infrastructure · the structure itself', css(COLORS.infra), 1.0), [], { band: true, group: 'lot' });
  infraLabel.position.set(0, -7, 26);
  infraTags.add(infraLabel);
  world.setInfraFocus = sub => setFocusSet('infra', XRAY, xrayTags, sub);

  // ---------- profiles (screen 22) ----------
  const PROFILE_TARGETS = [
    'intake', 'bays', 'bayIDE', 'bayPortal', 'bayAuto', 'controlRoom', 'metaRack',
    'foundry', 'line', 'beltLine', 'loopBelt', 'robots', 'toolkits', 'patternShop',
    'pipes', 'pipeContext', 'pipeAction', 'pipeObserve', 'warehouse', 'market',
    'machineRoom', 'basementNet', 'linkPatterns', 'linkPipesCap', 'linkKnow',
    'linkMarket', 'governance', 'govPipes', 'govAccess', 'govGates',
    'govDecision', 'govAudit', 'measurement', 'dock', 'journeys',
  ];
  const PROFILES = {
    startup: {
      on: ['line', 'beltLine', 'loopBelt', 'bayIDE', 'toolkits', 'pipes', 'pipeContext',
        'dock', 'journeys', 'controlRoom', 'metaRack'],
    },
    scaleup: {
      on: ['intake', 'bays', 'bayIDE', 'bayPortal', 'bayAuto', 'controlRoom', 'metaRack',
        'foundry', 'line', 'beltLine', 'loopBelt', 'robots', 'toolkits', 'patternShop',
        'pipes', 'pipeContext', 'pipeAction', 'pipeObserve', 'warehouse', 'market',
        'machineRoom', 'basementNet', 'linkPatterns', 'linkPipesCap', 'linkKnow',
        'linkMarket', 'measurement', 'govPipes', 'dock', 'journeys'],
    },
    enterprise: { on: PROFILE_TARGETS },
  };
  world.applyProfile = name => {
    // who sits in the rooms changes with the profile, not just what is lit
    world.setRoomOccupancy(name || 'full');
    world._modes = {};
    if (name) {
      const def = PROFILES[name];
      for (const n of PROFILE_TARGETS) {
        if (groups[n]) world._modes[n] = def.on.includes(n) ? 1 : world._ghostK;
      }
    }
    for (const n of Object.keys(groups)) applyFactors(groups[n]);
    if (name === 'startup' && world.measThreads) {
      const t0 = world.measThreads[0];
      t0.traverse(obj => {
        if (obj.material && obj.material.userData && obj.material.userData.baseOpacity !== undefined) {
          setFade(obj.material, obj.material.userData.baseOpacity);
          obj.visible = true;
        }
      });
    }
  };

  return world;
}
