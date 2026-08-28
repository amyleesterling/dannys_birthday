// Virtual Danny: Amy's Meshy biped. He no longer stands in the beams; he
// shows up between rounds to dance while the next one counts in.
//
// He renders to his own offscreen canvas which the game then draws into its
// 2D canvas. That ordering is deliberate: it means the HUD still composites
// on top of him, which an overlaid WebGL canvas would not allow.
//
// If WebGL is missing or the model fails to load, `ok` goes false and the
// game simply never shows him; the between-round beat still runs on its own
// timer, just without a dance in it.

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const W = 340, H = 833;        // offscreen sprite, portrait

// The camera frames this slice of the world, and the game needs the same
// numbers in its own body-local units to place the sprite. The 2D proxy runs
// from local -99 at the crown to +86 at the soles for a model 1.7 tall, so one
// world unit is 185 / 1.7 = 108.8 local units.
// Wide enough for a gangnam-style arm swing, not just the idle stance: the
// old +/-0.5 half-width was tuned against a standing pose and clipped the
// wilder dances at the shoulders. Widening left/right alone would squash
// the render (an orthographic camera distorts unless world aspect matches
// the canvas's own, 340:833), so top/bottom grow by the same factor,
// doubling the whole box. frame.wLocal/hLocal below scale with this box, so
// the zoom-out does not change Danny's apparent size once composited, it
// just adds headroom before his geometry leaves the frustum.
const VIEW = { left: -1.0, right: 1.0, top: 4.7, bottom: -0.2 };
const LOCAL_PER_WORLD = 185 / 1.7;

// One of these plays between rounds, picked by round number so it escalates:
// a bow the first time, working up to full Gangnam by round seven and every
// round after. Whichever of these hasn't finished loading yet is skipped.
//
// Cherish Pop Dance is not in this list on purpose: at its peak the throw
// is wide enough that no frame short of shrinking Danny to a speck could
// hold it without cropping (checked by reading back the rendered pixels
// across the whole clip, at camera widths well past what any other dance
// needs), and the seven-strong list already climbs from a bow to Gangnam.
const CELEBRATIONS = ['bow', 'heart', 'flip', 'jump', 'dance', 'funny', 'gangnam'];

class Danny {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = W;
    this.canvas.height = H;
    this.ok = false;
    this.loaded = false;
    this.t = 0;
    this.motion = 'idle';

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
    this.load();
    this.ok = true;
  }

  // Always light the scene. The model is proper PBR, which means with no
  // lights it renders black.
  buildLights() {
    this.scene.add(new THREE.HemisphereLight(0x9fdcf0, 0x0a1a20, 1.05));
    const key = new THREE.DirectionalLight(0xdff4ff, 1.5);
    key.position.set(1.4, 2.2, 2.4);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0x35e0d0, 1.0);
    rim.position.set(-1.8, 1.2, -1.6);
    this.scene.add(rim);
  }

  load() {
    const loader = new GLTFLoader();
    loader.load('danny.glb', (gltf) => {
      this.model = gltf.scene;
      this.model.traverse((o) => { if (o.isMesh) o.frustumCulled = false; });
      this.scene.add(this.model);

      // danny.glb's own baked-in animation goes unused: nothing plays it, it
      // is only here so there is a model and a mixer to hang the between-
      // round moves on.
      this.mixer = new THREE.AnimationMixer(this.model);
      this.mixer.addEventListener('finished', (e) => this.backToBase(e.action));
      this.loaded = true;
      this.loadExtra('danny_backflip.glb', 'flip');
      this.loadExtra('danny_heart.glb', 'heart');
      this.loadExtra('danny_dance.glb', 'dance');
      this.loadExtra('danny_bow.glb', 'bow');
      this.loadExtra('danny_jump.glb', 'jump');
      this.loadExtra('danny_funny.glb', 'funny');
      this.loadExtra('danny_gangnam.glb', 'gangnam');
    }, undefined, () => { this.ok = false; });   // no model, the game falls back
  }

  // Extra motions ship as animation only: the rig is identical across exports,
  // so the clip drops onto the skeleton we already have by bone name. A
  // couple hundred kilobytes instead of six megabytes.
  loadExtra(url, key) {
    new GLTFLoader().load(url, (g) => {
      if (!this.mixer || !g.animations || !g.animations.length) return;
      const act = this.mixer.clipAction(g.animations[0]);
      act.setLoop(THREE.LoopOnce, 1);
      act.clampWhenFinished = true;
      this[key] = act;
      this[key + 'Dur'] = g.animations[0].duration;
    }, undefined, () => {});                     // optional, silence is fine
  }

  // Between-round beat: picks the move for this round number, escalating in
  // silliness as the round climbs, clamped to the wildest one once the list
  // runs out. Falls back to whatever is loaded if the pick itself is not
  // ready yet (a slow connection can still be fetching the later ones).
  // Returns how long it runs, so the caller can hold the interlude for it.
  celebrate(round) {
    if (this.playingOnce) return 0;
    const pool = CELEBRATIONS.filter((k) => this[k]);
    if (!pool.length) return 0;
    const idx = clampIdx((round || 1) - 1, pool.length - 1);
    const key = pool[idx];
    this.playingOnce = true;
    this.current = this[key];
    this[key].reset().setLoop(THREE.LoopOnce, 1).fadeIn(0.12).play();
    return this[key + 'Dur'];
  }

  // The round moved on before this one finished on its own (some of these
  // run well past the round they're bridging, Cherish Pop Dance most of
  // all), so cut it short rather than let it bleed into a round it isn't
  // this round's celebrate() that started.
  cutCelebration() {
    if (this.playingOnce && this.current) this.backToBase(this.current);
  }

  backToBase(action) {
    this.playingOnce = false;
    this.current = null;
    if (action) action.fadeOut(0.25);
    const back = this.motion;
    this.motion = null;
    this.setMotion(back || 'idle');
  }

  // Standing by, off to the side of the round in progress. If a real idle
  // clip has loaded it plays; otherwise he just holds still, which is fine
  // since he is small and out of the way until it is his turn.
  setMotion(name) {
    if (this.motion === name) return;
    this.motion = name;
    if (name === 'idle' && this.idle && !this.playingOnce) {
      this.idle.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(0.3).play();
    }
  }

  update(dt, turn) {
    if (!this.ok) return;
    this.t += dt;
    if (this.mixer) this.mixer.update(dt);
    if (this.model) {
      // Two different jobs, two different facings.
      //
      // Most of the time he is a small bystander at the side of a round in
      // progress, so he tracks your finger and sways a little, which reads as
      // someone watching. But while a celebration is playing he *is* the thing
      // on screen, and Amy caught him dancing round ten at an angle: the turn
      // was still pointed at wherever her finger had last been when the round
      // ended, plus up to 7 degrees of idle sway on top.
      //
      // Eased rather than assigned, so squaring up looks like him turning to
      // face you rather than snapping round on the first frame of the dance.
      // turn === null means square up: no tracking and no sway. Gating on
      // playingOnce alone was not enough, because it is false whenever the
      // dance clip is not actually running, and the idle sway is itself worth
      // 7 degrees. Measured at 5.19 off-axis mid-celebration with only the
      // tracking suppressed.
      const square = this.playingOnce || turn === null;
      const target = square
        ? 0
        : Math.sin(this.t * 0.4) * 0.12 + (turn || 0) * 0.5;
      this.model.rotation.y += (target - this.model.rotation.y) *
                               (1 - Math.pow(0.02, dt));
    }
    this.renderer.render(this.scene, this.camera);
  }
}

const clampIdx = (v, max) => (v < 0 ? 0 : v > max ? max : v);

const danny = new Danny();
window.Danny = danny;
