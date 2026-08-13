import * as THREE from 'three';
import { initPageTransition, navigateTo } from './transitions.js';
import { isDiscovered, allDiscovered } from './state.js';

/* ── Page Transition ── */
initPageTransition();

/* ── Capabilities & Responsive Detection ── */
const isMobileDevice = window.matchMedia('(pointer: coarse)').matches;
const reducedMotion  = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function getResponsiveCameraConfig() {
  const aspect = window.innerWidth / window.innerHeight;
  const isMobileVP = window.innerWidth <= 768 || aspect < 1.0;

  if (isMobileVP) {
    return {
      fov: 52,
      pos: new THREE.Vector3(0, 1.7, 3.1),
      lookAt: new THREE.Vector3(0, 1.1, -0.2)
    };
  } else {
    return {
      fov: 44,
      pos: new THREE.Vector3(0, 1.65, 2.7),
      lookAt: new THREE.Vector3(0, 1.05, -0.2)
    };
  }
}

/* ── Palette ── */
const C = {
  cremaRosado: 0xF7E9E4, // Main walls
  rosaPolvo:   0xE4B7B2, // Curtains, rug, sunset highlight
  rosaViejo:   0xC9898E, // Flowers, book accent
  vinoSuave:   0x8A4F5C, // Book cover, sunset top
  champagne:   0xE7D0AD, // Lamp metal, frames, handles
  madera:      0x76513F, // Table, floor, door
  maderaOscura:0x5C3D2E, // Floor planks, door panel
  blanco:      0xFFF7F0, // Paper, candle, ceiling, trim
  wallDark:    0xEBD8CE  // Left wall
};

/* ── DOM Elements ── */
const canvas  = document.getElementById('room-canvas');
const labelEl = document.getElementById('object-label');

/* ── Renderer ── */
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: !isMobileDevice,
  powerPreference: 'default'
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = !(isMobileDevice || reducedMotion);
renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
renderer.toneMapping       = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.outputColorSpace  = THREE.SRGBColorSpace;

/* ── Scene (Crema Rosado background) ── */
const scene = new THREE.Scene();
scene.background = new THREE.Color(C.cremaRosado);

/* ── Camera Setup ── */
const initialCfg = getResponsiveCameraConfig();
const camera = new THREE.PerspectiveCamera(initialCfg.fov, window.innerWidth / window.innerHeight, 0.1, 30);
const basePos = new THREE.Vector3().copy(initialCfg.pos);
const currentLookAt = new THREE.Vector3().copy(initialCfg.lookAt);
camera.position.copy(basePos);
camera.lookAt(currentLookAt);

const mouseTarget  = new THREE.Vector2(0, 0);
const currentMouse = new THREE.Vector2(0, 0);

/* ── Collections ── */
const interactives = [];
const hoverState   = new Map();
const animatedBalloons = [];

/* ── Helper: Discovered Glow ── */
const glow = (id) => isDiscovered(id) ? { emissive: 0x331F1A, emissiveIntensity: 0.15 } : {};

/* ══════════════════════════════════════
   ROOM GEOMETRY (W: 7, H: 3.6, D: 6)
   ══════════════════════════════════════ */

const RW = 7, RH = 3.6, RD = 6;

// 1. Floor
const floorMat = new THREE.MeshStandardMaterial({ color: C.madera, roughness: 0.5, metalness: 0.08 });
const floor = new THREE.Mesh(new THREE.PlaneGeometry(RW, RD), floorMat);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// Floor plank lines
const plankMat = new THREE.MeshStandardMaterial({ color: C.maderaOscura, roughness: 0.65 });
for (let i = -3; i <= 3; i += 0.8) {
  const p = new THREE.Mesh(new THREE.PlaneGeometry(RD, 0.015), plankMat);
  p.rotation.x = -Math.PI / 2;
  p.rotation.z = Math.PI / 2;
  p.position.set(i, 0.001, 0);
  scene.add(p);
}

// Baseboards
const bbMat = new THREE.MeshStandardMaterial({ color: C.blanco, roughness: 0.7 });
const bbBack = new THREE.Mesh(new THREE.BoxGeometry(RW, 0.12, 0.03), bbMat);
bbBack.position.set(0, 0.06, -RD / 2 + 0.015);
scene.add(bbBack);

const bbLeft = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.12, RD), bbMat);
bbLeft.position.set(-RW / 2 + 0.015, 0.06, 0);
scene.add(bbLeft);

const bbRight = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.12, RD), bbMat);
bbRight.position.set(RW / 2 - 0.015, 0.06, 0);
scene.add(bbRight);

// 2. Walls
const wallMainMat = new THREE.MeshStandardMaterial({ color: C.cremaRosado, roughness: 0.8 });
const wallDarkMat = new THREE.MeshStandardMaterial({ color: C.wallDark, roughness: 0.8 });

const backWall = new THREE.Mesh(new THREE.PlaneGeometry(RW, RH), wallMainMat);
backWall.position.set(0, RH / 2, -RD / 2);
backWall.receiveShadow = true;
scene.add(backWall);

const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(RD, RH), wallDarkMat);
leftWall.position.set(-RW / 2, RH / 2, 0);
leftWall.rotation.y = Math.PI / 2;
leftWall.receiveShadow = true;
scene.add(leftWall);

const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(RD, RH), wallMainMat);
rightWall.position.set(RW / 2, RH / 2, 0);
rightWall.rotation.y = -Math.PI / 2;
rightWall.receiveShadow = true;
scene.add(rightWall);

// 3. Ceiling
const ceilMat = new THREE.MeshStandardMaterial({ color: C.blanco, roughness: 0.9 });
const ceil = new THREE.Mesh(new THREE.PlaneGeometry(RW, RD), ceilMat);
ceil.rotation.x = Math.PI / 2;
ceil.position.y = RH;
scene.add(ceil);

/* ══════════════════════════════════════
   1. LARGE PHOTOGRAPH OF ÁNGELA ON WALL
   ══════════════════════════════════════ */

const wallPhotoGroup = new THREE.Group();
const wallPhotoZ = -RD / 2 + 0.035;
wallPhotoGroup.position.set(0, 2.25, wallPhotoZ);

const defaultW = 0.95, defaultH = 1.25;
const wallPhotoDefaultMat = new THREE.MeshStandardMaterial({ color: C.rosaPolvo, roughness: 0.7 });
let wallPhotoPlane = new THREE.Mesh(new THREE.PlaneGeometry(defaultW, defaultH), wallPhotoDefaultMat);
wallPhotoPlane.position.z = 0.016;
wallPhotoGroup.add(wallPhotoPlane);

let wallFrameMeshGroup = null;

function buildWallFrame(pw, ph) {
  if (wallFrameMeshGroup) wallPhotoGroup.remove(wallFrameMeshGroup);
  
  const border = 0.055, depth = 0.035;
  const frameMat = new THREE.MeshStandardMaterial({ color: C.champagne, roughness: 0.35, metalness: 0.45 });
  const g = new THREE.Group();

  const tb = new THREE.Mesh(new THREE.BoxGeometry(pw + border * 2, border, depth), frameMat);
  tb.position.set(0, ph / 2 + border / 2, 0);
  const bb = new THREE.Mesh(new THREE.BoxGeometry(pw + border * 2, border, depth), frameMat);
  bb.position.set(0, -ph / 2 - border / 2, 0);

  const lb = new THREE.Mesh(new THREE.BoxGeometry(border, ph, depth), frameMat);
  lb.position.set(-pw / 2 - border / 2, 0, 0);
  const rb = new THREE.Mesh(new THREE.BoxGeometry(border, ph, depth), frameMat);
  rb.position.set(pw / 2 + border / 2, 0, 0);

  const shadowPlate = new THREE.Mesh(
    new THREE.BoxGeometry(pw + border * 2 + 0.02, ph + border * 2 + 0.02, 0.005),
    new THREE.MeshStandardMaterial({ color: 0x3D2B26, roughness: 0.95 })
  );
  shadowPlate.position.z = -depth / 2 - 0.002;

  g.add(tb, bb, lb, rb, shadowPlate);
  wallFrameMeshGroup = g;
  wallPhotoGroup.add(wallFrameMeshGroup);
}

buildWallFrame(defaultW, defaultH);

let wallPhotoHit = new THREE.Mesh(
  new THREE.BoxGeometry(defaultW + 0.12, defaultH + 0.12, 0.1),
  new THREE.MeshBasicMaterial({ visible: false })
);
wallPhotoHit.name = 'fotoPared';
wallPhotoHit.userData = { interactive: true, label: 'Un recuerdo', url: './foto.html' };
wallPhotoGroup.add(wallPhotoHit);
interactives.push(wallPhotoHit);
hoverState.set(wallPhotoHit, { type: 'wallPhoto', group: wallPhotoGroup, baseZ: wallPhotoZ, targetZ: wallPhotoZ });

// TextureLoader with safe aspect ratio preservation
new THREE.TextureLoader().load(
  './images/angela.jpg',
  (tex) => {
    if (!tex || !tex.image) return;
    tex.colorSpace = THREE.SRGBColorSpace;
    const aspect = (tex.image.width && tex.image.height) ? (tex.image.width / tex.image.height) : 0.76;
    
    let pw = 0.95, ph = 0.95 / aspect;
    if (ph > 1.3) { ph = 1.3; pw = 1.3 * aspect; }
    
    wallPhotoPlane.geometry.dispose();
    wallPhotoPlane.geometry = new THREE.PlaneGeometry(pw, ph);
    wallPhotoPlane.material = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7 });
    
    buildWallFrame(pw, ph);

    if (wallPhotoHit) {
      wallPhotoHit.geometry.dispose();
      wallPhotoHit.geometry = new THREE.BoxGeometry(pw + 0.12, ph + 0.12, 0.1);
    }
  },
  undefined,
  () => {}
);

scene.add(wallPhotoGroup);

// Wall Photo Accent Light
const wallPhotoLight = new THREE.PointLight(C.blanco, 0.65, 3.8, 2);
wallPhotoLight.position.set(0, 2.6, -RD / 2 + 0.8);
scene.add(wallPhotoLight);

/* ══════════════════════════════════════
   2. 3D HEART GEOMETRY HELPER
   ══════════════════════════════════════ */

function createHeartGeometry(scale = 0.15) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.25 * scale);
  shape.bezierCurveTo(0, 0.4 * scale, -0.25 * scale, 0.55 * scale, -0.5 * scale, 0.3 * scale);
  shape.bezierCurveTo(-0.75 * scale, 0, -0.25 * scale, -0.35 * scale, 0, -0.6 * scale);
  shape.bezierCurveTo(0.25 * scale, -0.35 * scale, 0.75 * scale, 0, 0.5 * scale, 0.3 * scale);
  shape.bezierCurveTo(0.25 * scale, 0.55 * scale, 0, 0.4 * scale, 0, 0.25 * scale);

  return new THREE.ExtrudeGeometry(shape, {
    depth: 0.03 * scale,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: 0.01 * scale,
    bevelThickness: 0.01 * scale
  });
}

/* ══════════════════════════════════════
   3. ROMANTIC BALLOONS (Globos 3D)
   ══════════════════════════════════════ */

const balloonColors = [C.vinoSuave, C.rosaPolvo, C.cremaRosado, C.champagne];
const balloonConfigs = [
  { pos: [-2.4, 2.3, -2.1], isHeart: false, col: C.vinoSuave, scale: 1.1 },
  { pos: [-2.1, 2.6, -2.3], isHeart: true,  col: C.rosaPolvo, scale: 1.2 },
  { pos: [ 2.3, 2.5, -2.2], isHeart: false, col: C.champagne, scale: 1.0 },
  { pos: [ 2.6, 2.2, -2.0], isHeart: true,  col: C.vinoSuave, scale: 1.15 },
  { pos: [ 2.7, 2.6,  0.4], isHeart: false, col: C.rosaPolvo, scale: 0.95 },
  { pos: [-2.7, 2.5,  0.2], isHeart: false, col: C.cremaRosado, scale: 1.0 },
  { pos: [-1.4, 2.8, -2.4], isHeart: true,  col: C.champagne, scale: 0.9 }
];

const stringMat = new THREE.MeshStandardMaterial({ color: 0xD4BFB0, roughness: 0.9 });

balloonConfigs.forEach((cfg, idx) => {
  const g = new THREE.Group();
  g.position.set(...cfg.pos);

  const mat = new THREE.MeshStandardMaterial({ color: cfg.col, roughness: 0.35, metalness: 0.15 });

  if (cfg.isHeart) {
    const hMesh = new THREE.Mesh(createHeartGeometry(cfg.scale), mat);
    hMesh.rotation.z = Math.PI;
    g.add(hMesh);
  } else {
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.16 * cfg.scale, 16, 16), mat);
    sphere.scale.set(1, 1.2, 1);
    g.add(sphere);
    const knot = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.03, 8), mat);
    knot.position.y = -0.19 * cfg.scale;
    g.add(knot);
  }

  const strLen = 1.2 + (idx % 3) * 0.2;
  const str = new THREE.Mesh(new THREE.CylinderGeometry(0.0015, 0.0015, strLen), stringMat);
  str.position.y = -strLen / 2 - 0.2;
  g.add(str);

  scene.add(g);
  animatedBalloons.push({ group: g, baseY: cfg.pos[1], speed: 0.0012 + idx * 0.0003, offset: idx * 1.5 });
});

/* ══════════════════════════════════════
   4. DECORATIVE HEARTS & GARLAND ON WALL
   ══════════════════════════════════════ */

const garlandG = new THREE.Group();
garlandG.position.set(0, 3.0, wallPhotoZ + 0.02);

const gMat = new THREE.MeshStandardMaterial({ color: C.champagne, roughness: 0.3, metalness: 0.5 });
const lightBulbMat = new THREE.MeshStandardMaterial({ color: 0xFFF5DD, emissive: 0xFFDD99, emissiveIntensity: 1.5 });

for (let i = -1.2; i <= 1.2; i += 0.3) {
  const sagY = -Math.sin(((i + 1.2) / 2.4) * Math.PI) * 0.22;
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.015, 8, 8), lightBulbMat);
  bulb.position.set(i, sagY, 0);
  garlandG.add(bulb);

  if (Math.abs(i) === 0.6 || Math.abs(i) === 1.2) {
    const miniHeart = new THREE.Mesh(createHeartGeometry(0.5), new THREE.MeshStandardMaterial({ color: C.vinoSuave, roughness: 0.5 }));
    miniHeart.position.set(i, sagY - 0.05, 0.005);
    miniHeart.rotation.z = Math.PI;
    garlandG.add(miniHeart);
  }
}
scene.add(garlandG);

const wallHeartPositions = [
  { pos: [-0.65, 2.85, wallPhotoZ + 0.02], col: C.vinoSuave,  rot: 0.15 },
  { pos: [ 0.65, 2.85, wallPhotoZ + 0.02], col: C.rosaViejo,   rot: -0.15 },
  { pos: [-0.7,  1.75, wallPhotoZ + 0.02], col: C.champagne,   rot: -0.1 }
];
wallHeartPositions.forEach(hp => {
  const hM = new THREE.Mesh(createHeartGeometry(0.7), new THREE.MeshStandardMaterial({ color: hp.col, roughness: 0.5 }));
  hM.position.set(...hp.pos);
  hM.rotation.set(0, 0, Math.PI + hp.rot);
  scene.add(hM);
});

/* ══════════════════════════════════════
   5. ROMANTIC PLAQUE DECLARATION (Pared)
   ══════════════════════════════════════ */

const plaqueG = new THREE.Group();
plaqueG.position.set(-1.8, 1.45, -RD / 2 + 0.035);

function createPlaqueTexture() {
  const cv = document.createElement('canvas');
  cv.width = 380; cv.height = 180;
  const cx = cv.getContext('2d');
  
  cx.fillStyle = '#FFF7F0';
  cx.fillRect(0, 0, cv.width, cv.height);
  cx.strokeStyle = '#E7D0AD';
  cx.lineWidth = 6;
  cx.strokeRect(6, 6, cv.width - 12, cv.height - 12);
  
  cx.font = 'bold 24px "Palatino Linotype", Georgia, serif';
  cx.fillStyle = '#76513F';
  cx.textAlign = 'center';
  cx.fillText('Ángela', cv.width / 2, 45);
  
  cx.font = 'italic 14px "Segoe UI", sans-serif';
  cx.fillStyle = '#5C3D2E';
  cx.fillText('Cada día que te conozco, encuentro una razón', cv.width / 2, 85);
  cx.fillText('más para querer seguir haciéndolo.', cv.width / 2, 108);
  
  cx.font = 'italic 12px "Segoe UI", sans-serif';
  cx.fillStyle = '#8A4F5C';
  cx.fillText('Esto empezó siendo un detalle. Creo que terminó', cv.width / 2, 142);
  cx.fillText('diciendo un poco más de lo que pensaba.', cv.width / 2, 160);

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const plaqueMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(0.55, 0.26),
  new THREE.MeshStandardMaterial({ map: createPlaqueTexture(), roughness: 0.6 })
);
plaqueMesh.position.z = 0.01;

const plaqueBorder = new THREE.Mesh(
  new THREE.BoxGeometry(0.58, 0.29, 0.015),
  new THREE.MeshStandardMaterial({ color: C.champagne, roughness: 0.4, metalness: 0.3 })
);
plaqueG.add(plaqueMesh, plaqueBorder);
scene.add(plaqueG);

/* ══════════════════════════════════════
   WALL ACCENTS (Left Shelf)
   ══════════════════════════════════════ */

const shelfG = new THREE.Group();
shelfG.position.set(-1.8, 2.15, -RD / 2 + 0.05);
const shelfBoard = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.025, 0.16), floorMat);
shelfG.add(shelfBoard);

const miniVase = new THREE.Mesh(
  new THREE.CylinderGeometry(0.02, 0.025, 0.07, 10),
  new THREE.MeshStandardMaterial({ color: C.champagne, roughness: 0.3 })
);
miniVase.position.set(-0.15, 0.047, 0);
shelfG.add(miniVase);

const miniCandle = new THREE.Mesh(
  new THREE.CylinderGeometry(0.015, 0.015, 0.05, 10),
  new THREE.MeshStandardMaterial({ color: C.blanco, roughness: 0.9 })
);
miniCandle.position.set(0.15, 0.037, 0);
shelfG.add(miniCandle);

scene.add(shelfG);

const rightFrameG = new THREE.Group();
rightFrameG.position.set(1.8, 2.15, -RD / 2 + 0.04);
const rFrameMat = new THREE.MeshStandardMaterial({ color: C.champagne, roughness: 0.4, metalness: 0.3 });
const rFrameMesh = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.02), rFrameMat);
const rFrameInner = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.42), new THREE.MeshStandardMaterial({ color: C.vinoSuave, roughness: 0.8 }));
rFrameInner.position.z = 0.011;
rightFrameG.add(rFrameMesh, rFrameInner);
scene.add(rightFrameG);

/* ══════════════════════════════════════
   TABLE (Main Emotional Center)
   ══════════════════════════════════════ */

const tableGroup = new THREE.Group();
tableGroup.position.set(0, 0, -0.4);
const TY = 0.78;
const TTOP = TY + 0.025;

const tableWood = new THREE.MeshStandardMaterial({ color: C.madera, roughness: 0.48, metalness: 0.06 });

const tableTop = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.05, 0.85), tableWood);
tableTop.position.y = TY;
tableTop.castShadow = true;
tableTop.receiveShadow = true;
tableGroup.add(tableTop);

const apron = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 0.75), tableWood);
apron.position.y = TY - 0.04;
tableGroup.add(apron);

const legGeo = new THREE.CylinderGeometry(0.025, 0.02, TY - 0.07, 12);
[[-0.75, -0.32], [0.75, -0.32], [-0.75, 0.32], [0.75, 0.32]].forEach(([lx, lz]) => {
  const leg = new THREE.Mesh(legGeo, tableWood);
  leg.position.set(lx, (TY - 0.07) / 2, lz);
  leg.castShadow = true;
  tableGroup.add(leg);
});

scene.add(tableGroup);

/* ══════════════════════════════════════
   CARTA (Letter)
   ══════════════════════════════════════ */

const cartaMat = new THREE.MeshStandardMaterial({
  color: C.blanco,
  roughness: 0.8,
  ...glow('carta')
});
const carta = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.003, 0.18), cartaMat);
carta.position.set(-0.35, TTOP + 0.002, 0.15);
carta.rotation.y = 0.12;
carta.castShadow = true;
carta.receiveShadow = true;
carta.name = 'carta';
carta.userData = { interactive: true, label: 'La carta', url: './carta.html' };
tableGroup.add(carta);
interactives.push(carta);
hoverState.set(carta, { type: 'lift', baseY: TTOP + 0.002, targetY: TTOP + 0.002, amt: 0.008 });

/* ══════════════════════════════════════
   LIBRO (Book)
   ══════════════════════════════════════ */

const libroMat = new THREE.MeshStandardMaterial({
  color: C.vinoSuave,
  roughness: 0.55,
  metalness: 0.08,
  ...glow('libro')
});
const libro = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.038, 0.16), libroMat);
libro.position.set(0.35, TTOP + 0.019, 0.1);
libro.rotation.y = -0.1;
libro.castShadow = true;
libro.receiveShadow = true;
libro.name = 'libro';
libro.userData = { interactive: true, label: 'El libro', url: './libro.html' };
tableGroup.add(libro);

const pagesEdge = new THREE.Mesh(
  new THREE.BoxGeometry(0.21, 0.03, 0.15),
  new THREE.MeshStandardMaterial({ color: C.champagne, roughness: 0.9 })
);
pagesEdge.position.set(0.005, 0, 0);
libro.add(pagesEdge);

interactives.push(libro);
hoverState.set(libro, { type: 'lift', baseY: TTOP + 0.019, targetY: TTOP + 0.019, amt: 0.008 });

/* ══════════════════════════════════════
   SMALL TABLE PHOTO FRAME (Ángela's Photo)
   ══════════════════════════════════════ */

const tableFrameG = new THREE.Group();
tableFrameG.position.set(-0.55, TTOP, -0.22);
tableFrameG.rotation.set(-0.08, 0.28, 0);

const TFW = 0.14, TFH = 0.18, TFD = 0.015, TFB = 0.012;
const tableFrameMat = new THREE.MeshStandardMaterial({ color: C.champagne, roughness: 0.35, metalness: 0.45 });

const topTB = new THREE.Mesh(new THREE.BoxGeometry(TFW + TFB * 2, TFB, TFD), tableFrameMat);
topTB.position.set(0, TFH / 2 + TFB / 2, 0);
tableFrameG.add(topTB);

const botTB = new THREE.Mesh(new THREE.BoxGeometry(TFW + TFB * 2, TFB, TFD), tableFrameMat);
botTB.position.set(0, -TFH / 2 - TFB / 2, 0);
tableFrameG.add(botTB);

const leftTB = new THREE.Mesh(new THREE.BoxGeometry(TFB, TFH, TFD), tableFrameMat);
leftTB.position.set(-TFW / 2 - TFB / 2, 0, 0);
tableFrameG.add(leftTB);

const rightTB = new THREE.Mesh(new THREE.BoxGeometry(TFB, TFH, TFD), tableFrameMat);
rightTB.position.set(TFW / 2 + TFB / 2, 0, 0);
tableFrameG.add(rightTB);

const tablePhotoMat = new THREE.MeshStandardMaterial({ color: C.rosaPolvo, roughness: 0.7 });
const tablePhotoMesh = new THREE.Mesh(new THREE.PlaneGeometry(TFW, TFH), tablePhotoMat);
tablePhotoMesh.position.z = 0.001;
tableFrameG.add(tablePhotoMesh);

new THREE.TextureLoader().load(
  './images/angela.jpg',
  (tex) => {
    if (!tex || !tex.image) return;
    tex.colorSpace = THREE.SRGBColorSpace;
    const aspect = (tex.image.width && tex.image.height) ? (tex.image.width / tex.image.height) : 0.76;
    let w = TFW, h = TFW / aspect;
    if (h > 0.22) { h = 0.22; w = 0.22 * aspect; }
    tablePhotoMesh.geometry.dispose();
    tablePhotoMesh.geometry = new THREE.PlaneGeometry(w, h);
    tablePhotoMesh.material = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7 });
  },
  undefined,
  () => {}
);

const standMesh = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.12, 0.07), tableFrameMat);
standMesh.position.set(0, -0.02, -0.04);
standMesh.rotation.x = 0.28;
tableFrameG.add(standMesh);

const fotoMesaHit = new THREE.Mesh(
  new THREE.BoxGeometry(TFW + TFB * 2, TFH + TFB * 2, TFD + 0.03),
  new THREE.MeshBasicMaterial({ visible: false })
);
fotoMesaHit.name = 'fotoMesa';
fotoMesaHit.userData = { interactive: true, label: 'Un recuerdo', url: './foto.html' };
tableFrameG.add(fotoMesaHit);
interactives.push(fotoMesaHit);
hoverState.set(fotoMesaHit, { type: 'tilt', group: tableFrameG, baseRot: -0.08, targetRot: -0.08, amt: 0.04 });

tableGroup.add(tableFrameG);

/* ══════════════════════════════════════
   LAMP (Champagne Desk Lamp)
   ══════════════════════════════════════ */

const lampG = new THREE.Group();
lampG.position.set(0.62, TTOP, -0.22);

const champagneMetal = new THREE.MeshStandardMaterial({ color: C.champagne, roughness: 0.3, metalness: 0.5 });

const lampBaseMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.075, 0.018, 16), champagneMetal);
lampBaseMesh.position.y = 0.009;
lampG.add(lampBaseMesh);

const lampStemMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.36, 12), champagneMetal);
lampStemMesh.position.y = 0.18;
lampG.add(lampStemMesh);

const shadeMat = new THREE.MeshStandardMaterial({
  color: 0xFFF2E0,
  roughness: 0.85,
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.88
});
const shadeMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.13, 0.17, 16, 1, true), shadeMat);
shadeMesh.position.y = 0.38;
shadeMesh.castShadow = true;
lampG.add(shadeMesh);

tableGroup.add(lampG);

/* ══════════════════════════════════════
   CANDLES (Two Flickering Candles)
   ══════════════════════════════════════ */

const candle1G = new THREE.Group();
candle1G.position.set(0.18, TTOP, -0.28);
candle1G.add(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.022, 0.008, 12), champagneMetal));

const wax1 = new THREE.Mesh(
  new THREE.CylinderGeometry(0.015, 0.015, 0.065, 12),
  new THREE.MeshStandardMaterial({ color: C.blanco, roughness: 0.95 })
);
wax1.position.y = 0.036;
candle1G.add(wax1);

const flame1 = new THREE.Mesh(
  new THREE.SphereGeometry(0.006, 8, 6),
  new THREE.MeshStandardMaterial({ color: 0xFFB044, emissive: 0xFF9922, emissiveIntensity: 2.8 })
);
flame1.position.y = 0.076;
candle1G.add(flame1);
tableGroup.add(candle1G);

const candleLight1 = new THREE.PointLight(0xFF9922, 0.45, 2.2, 2);
candleLight1.position.set(tableGroup.position.x + 0.18, TTOP + 0.09, tableGroup.position.z - 0.28);
scene.add(candleLight1);

const candle2G = new THREE.Group();
candle2G.position.set(-0.18, TTOP, -0.28);
candle2G.add(new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.02, 0.006, 12), champagneMetal));

const wax2 = new THREE.Mesh(
  new THREE.CylinderGeometry(0.012, 0.012, 0.045, 12),
  new THREE.MeshStandardMaterial({ color: C.blanco, roughness: 0.95 })
);
wax2.position.y = 0.026;
candle2G.add(wax2);

const flame2 = new THREE.Mesh(
  new THREE.SphereGeometry(0.005, 8, 6),
  new THREE.MeshStandardMaterial({ color: 0xFFB044, emissive: 0xFF9922, emissiveIntensity: 2.5 })
);
flame2.position.y = 0.054;
candle2G.add(flame2);
tableGroup.add(candle2G);

/* ══════════════════════════════════════
   VASE & BOUQUET OF FLOWERS (Table)
   ══════════════════════════════════════ */

const vaseG = new THREE.Group();
vaseG.position.set(-0.08, TTOP, 0.22);

const vaseMat = new THREE.MeshStandardMaterial({ color: C.champagne, roughness: 0.25, metalness: 0.3 });
const vaseBody = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.035, 0.1, 14), vaseMat);
vaseBody.position.y = 0.05;
vaseG.add(vaseBody);

const vaseNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.028, 0.035, 14), vaseMat);
vaseNeck.position.y = 0.105;
vaseG.add(vaseNeck);

const stemMat = new THREE.MeshStandardMaterial({ color: 0x4A6B38, roughness: 0.8 });
const flowerData = [
  { col: C.rosaViejo,  angle: 0.2, h: 0.14, tiltZ: -0.06, radius: 0.018 },
  { col: C.rosaPolvo,  angle: 1.8, h: 0.17, tiltZ: 0.08,  radius: 0.016 },
  { col: C.blanco,     angle: 3.6, h: 0.13, tiltZ: 0.05,  radius: 0.020 },
  { col: C.vinoSuave,  angle: 5.2, h: 0.15, tiltZ: -0.04, radius: 0.017 }
];

flowerData.forEach(fd => {
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, fd.h, 4), stemMat);
  stem.position.set(Math.cos(fd.angle) * 0.008, 0.12 + fd.h / 2, Math.sin(fd.angle) * 0.008);
  stem.rotation.z = fd.tiltZ;
  vaseG.add(stem);

  const bud = new THREE.Mesh(
    new THREE.SphereGeometry(fd.radius, 8, 6),
    new THREE.MeshStandardMaterial({ color: fd.col, roughness: 0.85 })
  );
  bud.position.set(
    stem.position.x + Math.sin(fd.tiltZ) * fd.h * 0.4,
    0.12 + fd.h + fd.radius * 0.4,
    stem.position.z
  );
  vaseG.add(bud);
});

tableGroup.add(vaseG);

/* ══════════════════════════════════════
   CAJA DE PALABRAS (Interactive 3D Object)
   ══════════════════════════════════════ */

const boxG = new THREE.Group();
boxG.position.set(0.48, TTOP, -0.15);

const hasSavedPalabras = (() => {
  try {
    const raw = localStorage.getItem('angela_palabras');
    return raw && JSON.parse(raw).length > 0;
  } catch (e) { return false; }
})();

const boxMat = new THREE.MeshStandardMaterial({
  color: C.madera,
  roughness: 0.45,
  metalness: 0.1,
  ...(hasSavedPalabras ? { emissive: 0x331F1A, emissiveIntensity: 0.2 } : {})
});
const boxMesh = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.055, 0.10), boxMat);
boxMesh.position.y = 0.0275;
boxMesh.castShadow = true;
boxG.add(boxMesh);

const claspMat = new THREE.MeshStandardMaterial({
  color: C.champagne,
  roughness: 0.25,
  metalness: 0.6,
  ...(hasSavedPalabras ? { emissive: 0xE4CAA1, emissiveIntensity: 0.4 } : {})
});
const claspMesh = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.02, 0.01), claspMat);
claspMesh.position.set(0, 0.028, 0.052);
boxG.add(claspMesh);

const ribbonMat = new THREE.MeshStandardMaterial({
  color: hasSavedPalabras ? C.rosaPolvo : C.champagne,
  roughness: 0.3,
  metalness: 0.4
});
const ribbonH = new THREE.Mesh(new THREE.BoxGeometry(0.142, 0.057, 0.015), ribbonMat);
ribbonH.position.y = 0.0275;
const ribbonV = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.057, 0.102), ribbonMat);
ribbonV.position.y = 0.0275;
boxG.add(ribbonH, ribbonV);

if (hasSavedPalabras) {
  const boxGlowLight = new THREE.PointLight(0xFFE5B4, 0.35, 1.2);
  boxGlowLight.position.set(0, 0.1, 0);
  boxG.add(boxGlowLight);
}

const boxHit = new THREE.Mesh(
  new THREE.BoxGeometry(0.18, 0.08, 0.14),
  new THREE.MeshBasicMaterial({ visible: false })
);
boxHit.position.y = 0.03;
boxHit.name = 'cajaPalabras';
boxHit.userData = { interactive: true, label: 'Cosas que quería decirte', url: './palabras.html' };
boxG.add(boxHit);
interactives.push(boxHit);
hoverState.set(boxHit, { type: 'liftBox', group: boxG, baseY: TTOP, targetY: TTOP, amt: 0.008 });

tableGroup.add(boxG);

/* ══════════════════════════════════════
   ROMANTIC DIARY ("Este espacio es tuyo")
   ══════════════════════════════════════ */

const diaryG = new THREE.Group();
diaryG.position.set(0.16, TTOP, 0.18);
diaryG.rotation.y = -0.15;

const hasSavedParaTi = (() => {
  try {
    const raw = localStorage.getItem('angela_para_ti');
    return raw && JSON.parse(raw).length > 0;
  } catch (e) { return false; }
})();

const diaryMat = new THREE.MeshStandardMaterial({
  color: C.vinoSuave,
  roughness: 0.4,
  metalness: 0.1,
  ...(hasSavedParaTi ? { emissive: 0x331F1A, emissiveIntensity: 0.25 } : {})
});
const diaryMesh = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.032, 0.095), diaryMat);
diaryMesh.position.y = 0.016;
diaryMesh.castShadow = true;
diaryG.add(diaryMesh);

function createCoverATexture() {
  const cv = document.createElement('canvas');
  cv.width = 128; cv.height = 128;
  const cx = cv.getContext('2d');
  cx.fillStyle = '#8A4F5C';
  cx.fillRect(0, 0, 128, 128);
  cx.strokeStyle = '#E7D0AD';
  cx.lineWidth = 4;
  cx.strokeRect(6, 6, 116, 116);
  cx.font = 'italic bold 56px "Palatino Linotype", serif';
  cx.fillStyle = '#E7D0AD';
  cx.textAlign = 'center';
  cx.textBaseline = 'middle';
  cx.fillText('A', 64, 64);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const diaryCoverMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(0.12, 0.088),
  new THREE.MeshStandardMaterial({ map: createCoverATexture(), roughness: 0.5 })
);
diaryCoverMesh.rotation.x = -Math.PI / 2;
diaryCoverMesh.position.y = 0.033;
diaryG.add(diaryCoverMesh);

const diaryLockMesh = new THREE.Mesh(
  new THREE.BoxGeometry(0.015, 0.015, 0.02),
  new THREE.MeshStandardMaterial({
    color: C.champagne,
    roughness: 0.25,
    metalness: 0.6,
    ...(hasSavedParaTi ? { emissive: 0xE4CAA1, emissiveIntensity: 0.4 } : {})
  })
);
diaryLockMesh.position.set(0.065, 0.016, 0);
diaryG.add(diaryLockMesh);

if (hasSavedParaTi) {
  const diaryLight = new THREE.PointLight(0xFFE5B4, 0.35, 1.0);
  diaryLight.position.set(0, 0.08, 0);
  diaryG.add(diaryLight);
}

const paraTiHit = new THREE.Mesh(
  new THREE.BoxGeometry(0.16, 0.08, 0.12),
  new THREE.MeshBasicMaterial({ visible: false })
);
paraTiHit.position.y = 0.025;
paraTiHit.name = 'paraTi';
paraTiHit.userData = { interactive: true, label: 'Este espacio es tuyo', url: './para-ti.html' };
diaryG.add(paraTiHit);
interactives.push(paraTiHit);
hoverState.set(paraTiHit, { type: 'liftDiary', group: diaryG, baseY: TTOP, targetY: TTOP, amt: 0.008 });

tableGroup.add(diaryG);

// Tabletop Petals (Static)
const petalMat1 = new THREE.MeshStandardMaterial({ color: C.rosaViejo, roughness: 0.9, side: THREE.DoubleSide });
const petalMat2 = new THREE.MeshStandardMaterial({ color: C.vinoSuave, roughness: 0.9, side: THREE.DoubleSide });

[
  [-0.15, 0.1], [0.1, 0.2], [-0.4, -0.1], [0.25, -0.2], [0.02, 0.05], [-0.22, 0.2]
].forEach(([px, pz], i) => {
  const p = new THREE.Mesh(new THREE.PlaneGeometry(0.025, 0.038), i % 2 === 0 ? petalMat1 : petalMat2);
  p.rotation.x = -Math.PI / 2;
  p.rotation.z = i * 0.8;
  p.position.set(px, TTOP + 0.001, pz);
  tableGroup.add(p);
});

/* ══════════════════════════════════════
   WINDOW & CURTAINS (Sunset Light)
   ══════════════════════════════════════ */

const winG = new THREE.Group();
winG.position.set(RW / 2 - 0.01, 1.95, -0.8);
winG.rotation.y = -Math.PI / 2;

const WW = 1.3, WH = 1.7, WFD = 0.12, WFB = 0.08;

function createSunsetTexture() {
  const cv = document.createElement('canvas');
  cv.width = 128; cv.height = 256;
  const cx = cv.getContext('2d');
  const g = cx.createLinearGradient(0, 0, 0, cv.height);
  g.addColorStop(0,   '#4A2832');
  g.addColorStop(0.2, '#8A4F5C');
  g.addColorStop(0.4, '#C9898E');
  g.addColorStop(0.6, '#E4B7B2');
  g.addColorStop(0.78,'#F7E9E4');
  g.addColorStop(1,   '#E7D0AD');
  cx.fillStyle = g;
  cx.fillRect(0, 0, cv.width, cv.height);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const glassMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(WW - WFB * 2, WH - WFB * 2),
  new THREE.MeshBasicMaterial({ map: createSunsetTexture() })
);
glassMesh.position.z = WFD / 2 + 0.005;
winG.add(glassMesh);

const windowFrameMat = new THREE.MeshStandardMaterial({ color: C.madera, roughness: 0.5, metalness: 0.08 });

const topWFrame = new THREE.Mesh(new THREE.BoxGeometry(WW, WFB, WFD), windowFrameMat);
topWFrame.position.set(0, WH / 2, 0);
winG.add(topWFrame);

const botWFrame = new THREE.Mesh(new THREE.BoxGeometry(WW, WFB, WFD), windowFrameMat);
botWFrame.position.set(0, -WH / 2, 0);
winG.add(botWFrame);

const leftWFrame = new THREE.Mesh(new THREE.BoxGeometry(WFB, WH + WFB * 2, WFD), windowFrameMat);
leftWFrame.position.set(-WW / 2, 0, 0);
winG.add(leftWFrame);

const rightWFrame = new THREE.Mesh(new THREE.BoxGeometry(WFB, WH + WFB * 2, WFD), windowFrameMat);
rightWFrame.position.set(WW / 2, 0, 0);
winG.add(rightWFrame);

const crossH = new THREE.Mesh(new THREE.BoxGeometry(WW, 0.022, WFD), windowFrameMat);
crossH.position.set(0, 0.08, 0);
winG.add(crossH);

const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.022, WH, WFD), windowFrameMat);
crossV.position.set(0, 0, 0);
winG.add(crossV);

const sillMesh = new THREE.Mesh(new THREE.BoxGeometry(WW + 0.2, 0.04, 0.16), windowFrameMat);
sillMesh.position.set(0, -WH / 2 - WFB / 2, 0.06);
winG.add(sillMesh);

const sillPot = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.05, 10), vaseMat);
sillPot.position.set(0.3, -WH / 2 + 0.045, 0.08);
const sillFlower = new THREE.Mesh(
  new THREE.SphereGeometry(0.015, 6, 6),
  new THREE.MeshStandardMaterial({ color: C.rosaPolvo, roughness: 0.8 })
);
sillFlower.position.set(0.3, -WH / 2 + 0.08, 0.08);
winG.add(sillPot, sillFlower);

const curtainMat = new THREE.MeshStandardMaterial({
  color: C.rosaPolvo,
  transparent: true,
  opacity: 0.35,
  side: THREE.DoubleSide,
  roughness: 0.95
});

const curtainLeft = new THREE.Mesh(new THREE.PlaneGeometry(0.32, WH + 0.4), curtainMat);
curtainLeft.position.set(-WW / 2 - 0.1, 0.1, WFD / 2 + 0.06);
winG.add(curtainLeft);

const curtainRight = new THREE.Mesh(new THREE.PlaneGeometry(0.32, WH + 0.4), curtainMat);
curtainRight.position.set(WW / 2 + 0.1, 0.1, WFD / 2 + 0.06);
winG.add(curtainRight);

const winHit = new THREE.Mesh(
  new THREE.BoxGeometry(WW, WH, WFD + 0.1),
  new THREE.MeshBasicMaterial({ visible: false })
);
winHit.name = 'ventana';
winHit.userData = { interactive: true, label: 'La ventana', url: './ventana.html' };
winG.add(winHit);
interactives.push(winHit);
hoverState.set(winHit, { type: 'winLight' });

scene.add(winG);

/* ══════════════════════════════════════
   DOOR (Warm Wood Door)
   ══════════════════════════════════════ */

const doorG = new THREE.Group();
const DW = 0.95, DH = 2.15;
doorG.position.set(-1.6, DH / 2, -RD / 2 + 0.04);

const doorPanelMesh = new THREE.Mesh(
  new THREE.BoxGeometry(DW, DH, 0.05),
  new THREE.MeshStandardMaterial({ color: C.maderaOscura, roughness: 0.5, metalness: 0.08 })
);
doorPanelMesh.castShadow = true;
doorG.add(doorPanelMesh);

const handleMesh = new THREE.Mesh(
  new THREE.SphereGeometry(0.028, 12, 12),
  new THREE.MeshStandardMaterial({ color: C.champagne, roughness: 0.25, metalness: 0.65 })
);
handleMesh.position.set(0.33, 0, 0.038);
doorG.add(handleMesh);

const doorTrimTop = new THREE.Mesh(new THREE.BoxGeometry(DW + 0.12, 0.06, 0.06), bbMat);
doorTrimTop.position.set(0, DH / 2 + 0.02, 0);
doorG.add(doorTrimTop);

const doorTrimLeft = new THREE.Mesh(new THREE.BoxGeometry(0.06, DH + 0.06, 0.06), bbMat);
doorTrimLeft.position.set(-DW / 2 - 0.03, 0, 0);
doorG.add(doorTrimLeft);

const doorTrimRight = new THREE.Mesh(new THREE.BoxGeometry(0.06, DH + 0.06, 0.06), bbMat);
doorTrimRight.position.set(DW / 2 + 0.03, 0, 0);
doorG.add(doorTrimRight);

scene.add(doorG);

const doorHit = new THREE.Mesh(
  new THREE.BoxGeometry(DW + 0.12, DH + 0.08, 0.1),
  new THREE.MeshBasicMaterial({ visible: false })
);
doorHit.position.copy(doorG.position);
doorHit.name = 'puerta';
doorHit.userData = { interactive: true, label: 'La puerta', url: './puerta.html' };
scene.add(doorHit);
interactives.push(doorHit);
hoverState.set(doorHit, { type: 'knob', mesh: handleMesh, base: 1, target: 1 });

/* ══════════════════════════════════════
   RUG & FLOOR PETALS
   ══════════════════════════════════════ */

const rugMesh = new THREE.Mesh(
  new THREE.CircleGeometry(0.78, 32),
  new THREE.MeshStandardMaterial({ color: C.rosaPolvo, roughness: 0.95 })
);
rugMesh.rotation.x = -Math.PI / 2;
rugMesh.position.set(0, 0.003, 0.7);
rugMesh.receiveShadow = true;
scene.add(rugMesh);

const rugBorderMesh = new THREE.Mesh(
  new THREE.RingGeometry(0.73, 0.78, 32),
  new THREE.MeshStandardMaterial({ color: C.rosaViejo, roughness: 0.9 })
);
rugBorderMesh.rotation.x = -Math.PI / 2;
rugBorderMesh.position.set(0, 0.004, 0.7);
scene.add(rugBorderMesh);

// Rug Petals (Static)
[
  [0.2, 0.6], [-0.3, 0.8], [0.4, 0.9], [-0.1, 0.5], [0.15, 1.0]
].forEach(([rx, rz], i) => {
  const p = new THREE.Mesh(new THREE.PlaneGeometry(0.03, 0.045), i % 2 === 0 ? petalMat1 : petalMat2);
  p.rotation.x = -Math.PI / 2;
  p.rotation.z = i * 1.2;
  p.position.set(rx, 0.005, rz);
  scene.add(p);
});

/* ══════════════════════════════════════
   DECORATIVE BOOKS (Floor Stack)
   ══════════════════════════════════════ */

const stackG = new THREE.Group();
stackG.position.set(-2.2, 0, -1.8);
[C.vinoSuave, C.madera, C.champagne].forEach((c, i) => {
  const b = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.026, 0.13),
    new THREE.MeshStandardMaterial({ color: c, roughness: 0.7 })
  );
  b.position.y = i * 0.027 + 0.013;
  b.rotation.y = (i - 1) * 0.14;
  stackG.add(b);
});
scene.add(stackG);

/* ══════════════════════════════════════
   LIGHTING SETUP
   ══════════════════════════════════════ */

scene.add(new THREE.AmbientLight(C.cremaRosado, 0.55));
scene.add(new THREE.HemisphereLight(C.cremaRosado, C.madera, 0.4));

const lampLight = new THREE.PointLight(0xFFF0D4, 2.2, 7, 1.5);
lampLight.position.set(tableGroup.position.x + 0.62, TY + 0.38, tableGroup.position.z - 0.22);
lampLight.castShadow = !(isMobileDevice || reducedMotion);
lampLight.shadow.mapSize.set(512, 512);
lampLight.shadow.bias = -0.001;
scene.add(lampLight);

const windowLight = new THREE.PointLight(C.rosaPolvo, 1.5, 7, 1.5);
windowLight.position.set(RW / 2 - 0.5, 1.95, -0.8);
scene.add(windowLight);

const fillLight = new THREE.PointLight(C.cremaRosado, 0.4, 10, 2);
fillLight.position.set(-2, 2.5, 1.5);
scene.add(fillLight);

/* ══════════════════════════════════════
   STATE & PROGRESS CHECK
   ══════════════════════════════════════ */

if (allDiscovered()) {
  lampLight.intensity = 2.8;
  renderer.toneMappingExposure = 1.18;
  doorHit.userData.label = 'Una última cosa';
  doorHit.userData.url   = './final.html';
  doorPanelMesh.material.emissive = new THREE.Color(0x3B1F1A);
  doorPanelMesh.material.emissiveIntensity = 0.15;
}

/* ══════════════════════════════════════
   RAYCASTING & INTERACTION
   ══════════════════════════════════════ */

const ray   = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hovered = null;

function onPointerMove(e) {
  mouse.x =  (e.clientX / window.innerWidth)  * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

  if (!isMobileDevice && !reducedMotion) {
    mouseTarget.x = (e.clientX / window.innerWidth  - 0.5) * -0.025;
    mouseTarget.y = (e.clientY / window.innerHeight - 0.5) * -0.015;
  }

  ray.setFromCamera(mouse, camera);
  const hits = ray.intersectObjects(interactives, false);

  if (hits.length) {
    const obj = hits[0].object;
    if (hovered !== obj) {
      resetH(hovered);
      hovered = obj;
      applyH(obj);
    }
    document.body.style.cursor = 'pointer';
    labelEl.textContent = obj.userData.label;
    labelEl.classList.add('visible');
  } else if (hovered) {
    resetH(hovered);
    hovered = null;
    document.body.style.cursor = 'default';
    labelEl.classList.remove('visible');
  }
}

function onPointerDown(e) {
  mouse.x =  (e.clientX / window.innerWidth)  * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  ray.setFromCamera(mouse, camera);
  const hits = ray.intersectObjects(interactives, false);

  if (hits.length) {
    const targetUrl = hits[0].object.userData.url;
    if (targetUrl) navigateTo(targetUrl);
  }
}

function applyH(o) {
  const s = hoverState.get(o);
  if (!s) return;
  if (s.type === 'lift')      s.targetY   = s.baseY + s.amt;
  if (s.type === 'liftBox')   s.targetY   = s.baseY + s.amt;
  if (s.type === 'liftDiary') s.targetY   = s.baseY + s.amt;
  if (s.type === 'knob')      s.target    = 1.25;
  if (s.type === 'tilt')      s.targetRot = s.baseRot - s.amt;
  if (s.type === 'wallPhoto') s.targetZ   = s.baseZ + 0.025;
  if (s.type === 'winLight')  windowLight.intensity = 2.0;
}

function resetH(o) {
  if (!o) return;
  const s = hoverState.get(o);
  if (!s) return;
  if (s.type === 'lift')      s.targetY   = s.baseY;
  if (s.type === 'liftBox')   s.targetY   = s.baseY;
  if (s.type === 'liftDiary') s.targetY   = s.baseY;
  if (s.type === 'knob')      s.target    = 1.0;
  if (s.type === 'tilt')      s.targetRot = s.baseRot;
  if (s.type === 'wallPhoto') s.targetZ   = s.baseZ;
  if (s.type === 'winLight')  windowLight.intensity = 1.5;
}

window.addEventListener('pointermove', onPointerMove, { passive: true });
window.addEventListener('pointerdown', onPointerDown, { passive: true });

// Accessible button links
document.getElementById('btn-carta')?.addEventListener('click',   () => navigateTo('./carta.html'));
document.getElementById('btn-libro')?.addEventListener('click',   () => navigateTo('./libro.html'));
document.getElementById('btn-ventana')?.addEventListener('click', () => navigateTo('./ventana.html'));
document.getElementById('btn-foto')?.addEventListener('click',    () => navigateTo('./foto.html'));
document.getElementById('btn-palabras')?.addEventListener('click',() => navigateTo('./palabras.html'));
document.getElementById('btn-para-ti')?.addEventListener('click', () => navigateTo('./para-ti.html'));
document.getElementById('btn-puerta')?.addEventListener('click',  () => navigateTo(allDiscovered() ? './final.html' : './puerta.html'));

/* ══════════════════════════════════════
   ANIMATION LOOP
   ══════════════════════════════════════ */

let afId;
function tick() {
  afId = requestAnimationFrame(tick);

  // Camera parallax
  if (!isMobileDevice && !reducedMotion) {
    currentMouse.lerp(mouseTarget, 0.04);
    camera.position.x = basePos.x + currentMouse.x * 1.2;
    camera.position.y = basePos.y + currentMouse.y * 0.6;
    camera.lookAt(currentLookAt);
  }

  // Hover lerp animation
  interactives.forEach(o => {
    const s = hoverState.get(o);
    if (!s) return;
    if (s.type === 'lift') {
      o.position.y = THREE.MathUtils.lerp(o.position.y, s.targetY, 0.1);
    } else if (s.type === 'liftBox') {
      s.group.position.y = THREE.MathUtils.lerp(s.group.position.y, s.targetY, 0.1);
    } else if (s.type === 'liftDiary') {
      s.group.position.y = THREE.MathUtils.lerp(s.group.position.y, s.targetY, 0.1);
    } else if (s.type === 'knob') {
      s.mesh.scale.setScalar(THREE.MathUtils.lerp(s.mesh.scale.x, s.target, 0.15));
    } else if (s.type === 'tilt') {
      s.group.rotation.x = THREE.MathUtils.lerp(s.group.rotation.x, s.targetRot, 0.1);
    } else if (s.type === 'wallPhoto') {
      s.group.position.z = THREE.MathUtils.lerp(s.group.position.z, s.targetZ, 0.1);
    }
  });

  // Candle flames & curtain sway & balloon floating animation
  const time = Date.now();
  flame1.scale.y = 1 + Math.sin(time * 0.009) * 0.14;
  flame2.scale.y = 1 + Math.sin(time * 0.011 + 1) * 0.12;
  candleLight1.intensity = 0.45 + Math.sin(time * 0.007) * 0.05;
  
  if (!reducedMotion) {
    curtainLeft.rotation.z = Math.sin(time * 0.0018) * 0.018;
    curtainRight.rotation.z = -Math.sin(time * 0.0018) * 0.018;

    animatedBalloons.forEach(b => {
      b.group.position.y = b.baseY + Math.sin(time * b.speed + b.offset) * 0.04;
    });
  }

  renderer.render(scene, camera);
}
tick();

/* ══════════════════════════════════════
   RESPONSIVE RESIZE & CLEANUP
   ══════════════════════════════════════ */

function onResize() {
  const cfg = getResponsiveCameraConfig();
  camera.fov = cfg.fov;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  basePos.copy(cfg.pos);
  currentLookAt.copy(cfg.lookAt);

  if (isMobileDevice || reducedMotion) {
    camera.position.copy(basePos);
    camera.lookAt(currentLookAt);
  }

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

window.addEventListener('resize', onResize, { passive: true });
window.addEventListener('orientationchange', () => setTimeout(onResize, 200), { passive: true });

window.addEventListener('beforeunload', () => {
  cancelAnimationFrame(afId);
  window.removeEventListener('pointermove', onPointerMove);
  window.removeEventListener('pointerdown', onPointerDown);
  window.removeEventListener('resize', onResize);
  renderer.dispose();
  scene.traverse(o => {
    if (o.isMesh) {
      o.geometry.dispose();
      if (o.material?.isMaterial) o.material.dispose();
    }
  });
});
