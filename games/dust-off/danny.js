// Virtual Danny: Amy's Meshy biped, walking into the scanner, with his hair
// increasingly on fire.
//
// He renders to his own offscreen canvas which the game then draws into its 2D
// canvas. That ordering is deliberate: it means the beams, the particles and
// the whole HUD still composite on top of him, which an overlaid WebGL canvas
// would not allow. The 2D silhouette the game already had stays in place,
// invisible, as the collision proxy for sampling and hit testing.
//
// If WebGL is missing or the model fails to load, `ok` goes false and the game
// simply keeps drawing the wireframe subject it always had.
//
// The flames are the only warm thing on this site. scifi-ui calls --holo-warm
// "the single warm accent", and a fire is the case that earns it.

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const W = 340, H = 833;        // offscreen sprite, portrait
const EMBERS = 460;

// The camera frames this slice of the world, and the game needs the same
// numbers in its own body-local units to place the sprite. The 2D proxy runs
// from local -99 at the crown to +86 at the soles for a model 1.7 tall, so one
// world unit is 185 / 1.7 = 108.8 local units.
const VIEW = { left: -0.5, right: 0.5, top: 2.35, bottom: -0.1 };
const LOCAL_PER_WORLD = 185 / 1.7;

// How alight he is, by round.
export const STAGES = [
  { name: 'SETTLED',        fire: 0.00, embers: 0.00, light: 0.0 },
  { name: 'STATIC',         fire: 0.10, embers: 0.10, light: 0.1 },
  { name: 'SMOULDERING',    fire: 0.34, embers: 0.34, light: 0.5 },
  { name: 'ALIGHT',         fire: 0.58, embers: 0.62, light: 1.1 },
  { name: 'WELL ALIGHT',    fire: 0.80, embers: 0.85, light: 1.9 },
  { name: 'FULLY INVOLVED', fire: 1.00, embers: 1.00, light: 2.8 },
];

const WARM = new THREE.Color(0xffa33c);
const HOT  = new THREE.Color(0xffdc94);

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

class Danny {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = W;
    this.canvas.height = H;
    this.ok = false;
    this.loaded = false;
    this.stage = 0;
    this.t = 0;
    this.walkRate = 1;

    // what the game needs in order to place the sprite, in its own local units
    this.frame = {
      wLocal: (VIEW.right - VIEW.left) * LOCAL_PER_WORLD,
      hLocal: (VIEW.top - VIEW.bottom) * LOCAL_PER_WORLD,
      cyLocal: 86 - ((VIEW.top + VIEW.bottom) / 2) * LOCAL_PER_WORLD,
    };

    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas, alpha: true, antialias: true,
      });
    } catch (e) {
      return;                                   // no WebGL, the game copes
    }
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setSize(W, H, false);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(
      VIEW.left, VIEW.right, VIEW.top, VIEW.bottom, 0.01, 40);
    this.camera.position.set(0, 0, 8);
    this.camera.lookAt(0, 0, 0);

    this.buildLights();
    this.buildFire();
    this.load();
    this.ok = true;
  }

  // Always light the scene. Now that the Meshy self illumination is off the
  // model is properly PBR, which means with no lights it renders black.
  buildLights() {
    this.scene.add(new THREE.HemisphereLight(0x9fdcf0, 0x0a1a20, 1.05));
    const key = new THREE.DirectionalLight(0xdff4ff, 1.5);
    key.position.set(1.4, 2.2, 2.4);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0x35e0d0, 1.0);
    rim.position.set(-1.8, 1.2, -1.6);
    this.scene.add(rim);
    // the fire is a real light, so it actually lights him as it grows
    this.fireLight = new THREE.PointLight(0xffa33c, 0, 2.2, 2);
    this.scene.add(this.fireLight);
  }

  load() {
    const loader = new GLTFLoader();
    loader.load('danny.glb', (gltf) => {
      this.model = gltf.scene;
      this.model.traverse((o) => {
        if (o.isMesh) o.frustumCulled = false;
        if (!this.head && /^head$/i.test(o.name || '')) this.head = o;
      });
      this.scene.add(this.model);

      if (gltf.animations && gltf.animations.length) {
        this.mixer = new THREE.AnimationMixer(this.model);
        this.walk = this.mixer.clipAction(gltf.animations[0]);
        this.walk.play();
      }
      this.loaded = true;
    }, undefined, () => { this.ok = false; });   // no model, the game falls back
  }

  buildFire() {
    const pos = new Float32Array(EMBERS * 3);
    const col = new Float32Array(EMBERS * 3);
    this.embers = [];
    for (let i = 0; i < EMBERS; i++) {
      this.embers.push({
        life: Math.random(),
        speed: 0.55 + Math.random() * 0.95,
        ax: Math.random() - 0.5,
        az: Math.random() - 0.5,
        ph: Math.random() * 9,
      });
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    this.fireGeo = geo;
    this.fire = new THREE.Points(geo, new THREE.PointsMaterial({
      size: 0.055, vertexColors: true, transparent: true, opacity: 0.95,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
    }));
    this.fire.frustumCulled = false;
    this.scene.add(this.fire);
  }

  setRound(round) {
    this.stage = clamp(Math.floor(round) - 1, 0, STAGES.length - 1);
  }

  stageName() { return STAGES[this.stage].name; }

  // The game says what the subject is doing, so he walks in and then stands
  // rather than marching on the spot through the whole round.
  setGait(rate) { this.walkRate = rate; }

  update(dt, turn) {
    if (!this.ok) return;
    this.t += dt;
    const S = STAGES[this.stage];

    if (this.mixer) this.mixer.update(dt * this.walkRate);
    if (this.model) {
      this.model.rotation.y = Math.PI + Math.sin(this.t * 0.4) * 0.12 + (turn || 0) * 0.5;
    }

    // the fire sits on the head bone, if the rig gave us one
    const hp = this._hp || (this._hp = new THREE.Vector3());
    hp.set(0, 1.52, 0);
    if (this.head) this.head.getWorldPosition(hp);

    const p = this.fireGeo.attributes.position.array;
    const c = this.fireGeo.attributes.color.array;
    const live = Math.floor(EMBERS * S.embers);
    for (let i = 0; i < EMBERS; i++) {
      const e = this.embers[i];
      const j = i * 3;
      if (i >= live) { c[j] = c[j + 1] = c[j + 2] = 0; p[j + 1] = -99; continue; }
      e.life += dt * e.speed * (0.55 + S.fire * 0.9);
      if (e.life > 1) e.life -= 1;
      const f = e.life;
      // rise off the scalp, spreading and guttering as they go
      const flare = 0.10 + 0.22 * S.fire;
      p[j]     = hp.x + e.ax * flare * (0.4 + f) + Math.sin(this.t * 4 + e.ph) * 0.012;
      p[j + 1] = hp.y + 0.07 + f * (0.30 + S.fire * 0.42);
      p[j + 2] = hp.z + e.az * flare * (0.4 + f);
      const col = HOT.clone().lerp(WARM, clamp(f * 1.5, 0, 1));
      const fade = (0.4 + 0.6 * (1 - f)) * (0.35 + S.fire * 0.65);
      c[j] = col.r * fade; c[j + 1] = col.g * fade; c[j + 2] = col.b * fade;
    }
    this.fireGeo.attributes.position.needsUpdate = true;
    this.fireGeo.attributes.color.needsUpdate = true;

    this.fireLight.position.set(hp.x, hp.y + 0.12, hp.z + 0.15);
    this.fireLight.intensity = S.light * (0.82 + Math.sin(this.t * 11) * 0.09
                                               + Math.sin(this.t * 6.3) * 0.09);

    this.renderer.render(this.scene, this.camera);
  }
}

const danny = new Danny();
window.Danny = danny;
