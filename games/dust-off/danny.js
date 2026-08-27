// Virtual Danny, and the state of his hair.
//
// He renders to a small offscreen canvas which the game then draws into its own
// 2D canvas at the subject's head. That ordering matters: it means the beams,
// the particles and the whole HUD still composite on top of him, which an
// overlaid WebGL canvas would not allow.
//
// This is a stylised wireframe head in the same idiom as the scanner's body,
// not a likeness. It is deliberately generic, so tell me what to change.
//
// The flames are the one warm thing in the entire site. scifi-ui calls
// --holo-warm "the single warm accent", and a fire is exactly the case that
// earns it.

import * as THREE from '../../vendor/three/three.module.min.js';

const SIZE = 288;              // offscreen square, in device pixels at dpr 1
const STRANDS = 34;
const SEGS = 7;                // points per strand
const EMBERS = 420;

// How alight he is, by round. The names show in the HUD.
export const STAGES = [
  { name: 'SETTLED',        fire: 0.00, lift: 0.00, embers: 0.00 },
  { name: 'STATIC',         fire: 0.00, lift: 0.35, embers: 0.05 },
  { name: 'SMOULDERING',    fire: 0.36, lift: 0.60, embers: 0.30 },
  { name: 'ALIGHT',         fire: 0.48, lift: 0.85, embers: 0.60 },
  { name: 'WELL ALIGHT',    fire: 0.74, lift: 1.00, embers: 0.85 },
  { name: 'FULLY INVOLVED', fire: 1.00, lift: 1.15, embers: 1.00 },
];

const CYAN = new THREE.Color(0x7ee0ff);
const WARM = new THREE.Color(0xe8a93a);
const HOT  = new THREE.Color(0xffdc94);

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;

class Danny {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.canvas.height = SIZE;
    this.ok = false;
    this.stage = 0;
    this.t = 0;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: this.canvas, alpha: true, antialias: true,
      });
    } catch (e) {
      return;                                   // no WebGL, the game copes
    }
    this.renderer = renderer;
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(SIZE, SIZE, false);

    this.scene = new THREE.Scene();
    // orthographic, so he does not fish eye at this size and the head keeps a
    // fixed footprint however tall the figure is drawn
    const v = 1.9;
    this.camera = new THREE.OrthographicCamera(-v, v, v, -v, 0.1, 40);
    this.camera.position.set(0, 0, 6);
    this.camera.lookAt(0, 0, 0);

    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.buildHead();
    this.buildHair();
    this.buildFire();
    this.ok = true;
  }

  buildHead() {
    // the skull, as latitude and longitude lines, which is what the body in the
    // scanner already looks like
    const skull = new THREE.Mesh(
      new THREE.SphereGeometry(0.62, 16, 12),
      new THREE.MeshBasicMaterial({ color: CYAN, wireframe: true, transparent: true, opacity: 0.5 })
    );
    skull.scale.set(1, 1.12, 0.94);
    this.group.add(skull);

    const shell = new THREE.Mesh(
      new THREE.SphereGeometry(0.6, 24, 18),
      new THREE.MeshBasicMaterial({ color: 0x0d2b33, transparent: true, opacity: 0.55 })
    );
    shell.scale.set(1, 1.12, 0.94);
    this.group.add(shell);

    // glasses, two rings and a bridge. The one concession to a person rather
    // than a mannequin, and the easiest thing here to take back off.
    const rim = new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0.9 });
    for (const sx of [-1, 1]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.022, 8, 22), rim);
      ring.position.set(sx * 0.23, 0.06, 0.53);
      this.group.add(ring);
    }
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.022, 0.022), rim);
    bridge.position.set(0, 0.06, 0.56);
    this.group.add(bridge);

    // shoulders, just enough to sit the head on something
    const neck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.2, 0.3, 10, 1, true),
      new THREE.MeshBasicMaterial({ color: CYAN, wireframe: true, transparent: true, opacity: 0.35 })
    );
    neck.position.set(0, -0.82, 0);
    this.group.add(neck);
  }

  // Hair as strands of line segments rooted on the upper hemisphere. Each one
  // keeps its rest shape, and the stage decides how far it lifts, how it
  // colours, and how much of the tip has burned off.
  buildHair() {
    this.strands = [];
    const pos = [];
    const col = [];
    for (let i = 0; i < STRANDS; i++) {
      // a spiral over the scalp, so they distribute without clumping
      const a = i * 2.39996;
      const u = (i + 0.5) / STRANDS;
      const polar = Math.acos(1 - 0.72 * u);      // top cap only
      const root = new THREE.Vector3(
        Math.sin(polar) * Math.cos(a),
        Math.cos(polar),
        Math.sin(polar) * Math.sin(a)
      ).multiplyScalar(0.6);
      root.y *= 1.12;
      const out = root.clone().normalize();
      this.strands.push({
        root, out,
        len: 0.30 + (i % 5) * 0.045,
        sway: 0.6 + (i % 7) * 0.13,
        ph: i * 1.7,
      });
      for (let sgi = 0; sgi < SEGS - 1; sgi++) {
        pos.push(0, 0, 0, 0, 0, 0);
        col.push(0, 0, 0, 0, 0, 0);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    this.hairGeo = geo;
    this.hair = new THREE.LineSegments(
      geo,
      new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 1 })
    );
    this.group.add(this.hair);
  }

  buildFire() {
    const pos = new Float32Array(EMBERS * 3);
    const col = new Float32Array(EMBERS * 3);
    this.embers = [];
    for (let i = 0; i < EMBERS; i++) {
      this.embers.push({ s: (i * 7) % STRANDS, life: Math.random(), speed: 0.5 + Math.random() * 0.9,
                         drift: (Math.random() - 0.5) * 0.5, size: Math.random() });
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    this.fireGeo = geo;
    this.fire = new THREE.Points(geo, new THREE.PointsMaterial({
      size: 0.085, vertexColors: true, transparent: true, opacity: 0.95,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
    }));
    this.group.add(this.fire);
  }

  setRound(round) {
    this.stage = clamp(Math.floor(round) - 1, 0, STAGES.length - 1);
  }

  stageName() {
    return STAGES[this.stage].name;
  }

  update(dt, headTurn) {
    if (!this.ok) return;
    this.t += dt;
    const S = STAGES[this.stage];
    const t = this.t;

    this.group.rotation.y = Math.sin(t * 0.5) * 0.3 + (headTurn || 0);
    this.group.rotation.x = Math.sin(t * 0.37) * 0.06;

    // ---- hair
    const p = this.hairGeo.attributes.position.array;
    const c = this.hairGeo.attributes.color.array;
    let k = 0;
    const tip = new THREE.Vector3();
    const prev = new THREE.Vector3();
    for (let i = 0; i < STRANDS; i++) {
      const st = this.strands[i];
      // burned tips: at full fire the last segments are gone
      const burn = S.fire * (0.10 + ((i * 13) % 7) / 42);
      prev.copy(st.root);
      for (let sgi = 1; sgi < SEGS; sgi++) {
        const f = sgi / (SEGS - 1);
        const wob = Math.sin(t * (2.4 + st.sway) + st.ph + f * 3.1) * 0.06 * st.sway;
        const rise = S.lift * f * f * 0.42;
        tip.copy(st.out).multiplyScalar(0.6 + st.len * f)
           .add(new THREE.Vector3(wob, rise + st.len * f * 0.25, wob * 0.7));
        tip.y *= 1.05;

        const charred = f > 1 - burn;
        p[k] = prev.x; p[k + 1] = prev.y; p[k + 2] = prev.z;
        p[k + 3] = tip.x; p[k + 4] = tip.y; p[k + 5] = tip.z;

        // cool at the root, warm well before the tip once it is alight
        const heat = clamp(S.fire * (0.8 + f * 0.9), 0, 1);
        const base = CYAN.clone().lerp(WARM, heat);
        if (heat > 0.78) base.lerp(HOT, (heat - 0.78) / 0.22);
        const dim = charred ? 0.72 : 1;
        c[k] = base.r * dim; c[k + 1] = base.g * dim; c[k + 2] = base.b * dim;
        c[k + 3] = base.r * dim; c[k + 4] = base.g * dim; c[k + 5] = base.b * dim;
        k += 6;
        prev.copy(tip);
      }
    }
    this.hairGeo.attributes.position.needsUpdate = true;
    this.hairGeo.attributes.color.needsUpdate = true;

    // ---- embers rising off the strands
    const fp = this.fireGeo.attributes.position.array;
    const fc = this.fireGeo.attributes.color.array;
    const live = Math.floor(EMBERS * S.embers);
    for (let i = 0; i < EMBERS; i++) {
      const e = this.embers[i];
      const j = i * 3;
      if (i >= live) { fc[j] = fc[j + 1] = fc[j + 2] = 0; fp[j + 1] = -99; continue; }
      e.life += dt * e.speed * (0.5 + S.fire);
      if (e.life > 1) e.life -= 1;
      const st = this.strands[e.s];
      const f = e.life;
      const base = st.out.clone().multiplyScalar(0.6 + st.len);
      fp[j] = base.x + e.drift * f + Math.sin(t * 3 + i) * 0.04;
      fp[j + 1] = base.y * 1.05 + f * (0.55 + S.fire * 0.5);
      fp[j + 2] = base.z + e.drift * f * 0.6;
      // white hot at the root of the flame, warm, then out
      const col = HOT.clone().lerp(WARM, clamp(f * 1.6, 0, 1));
      const fade = (0.35 + 0.65 * (1 - f)) * (0.4 + S.fire * 0.6);
      fc[j] = col.r * fade; fc[j + 1] = col.g * fade; fc[j + 2] = col.b * fade;
    }
    this.fireGeo.attributes.position.needsUpdate = true;
    this.fireGeo.attributes.color.needsUpdate = true;

    this.renderer.render(this.scene, this.camera);
  }
}

const danny = new Danny();
window.Danny = danny;
window.dispatchEvent(new Event('danny-ready'));
