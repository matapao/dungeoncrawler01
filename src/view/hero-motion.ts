/** TD01's gait clips, cadence, facing blend and cosmetic half-second hop. */
import * as THREE from 'three';
import { dampAngle } from '../core/math.ts';
import type { HeroPosition } from '../game/hub.ts';

const LOOPS = {
  idle: ['Idle_A', 1],
  fwd: ['Running_A', 1.9],
  back: ['Walking_Backwards', 2.1],
  left: ['Running_Strafe_Left', 1.7],
  right: ['Running_Strafe_Right', 1.7],
} as const;

export class HeroMotion {
  private root: THREE.Object3D;
  private mixer: THREE.AnimationMixer;
  private actions = new Map<string, THREE.AnimationAction>();
  private current: THREE.AnimationAction | undefined;
  private jumpTime = -1;
  private swing = 0;
  lift = 0;

  constructor(root: THREE.Object3D, clips: THREE.AnimationClip[]) {
    this.root = root;
    this.mixer = new THREE.AnimationMixer(root);
    for (const name of [...Object.values(LOOPS).map(([name]) => name), 'Jump_Full_Short']) {
      const clip = clips.find((clip) => clip.name === name);
      if (!clip) throw new Error(`Missing inherited movement animation: ${name}`);
      this.actions.set(name, this.mixer.clipAction(clip));
    }
  }

  jump(): void {
    if (this.jumpTime >= 0) return;
    this.jumpTime = 0;
    this.play('Jump_Full_Short', 1.55, true);
  }

  reset(hero: HeroPosition): void {
    this.jumpTime = -1;
    this.lift = 0;
    this.root.rotation.y = hero.facing;
  }

  private play(name: string, speed: number, once = false): void {
    const action = this.actions.get(name);
    if (!action) throw new Error(`Unknown movement clip: ${name}`);
    if (this.current === action) return;
    action.reset().setEffectiveTimeScale(speed).setEffectiveWeight(1);
    action.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, once ? 1 : Infinity);
    action.clampWhenFinished = once;
    action.play();
    if (this.current) action.crossFadeFrom(this.current, 0.09, false);
    this.current = action;
  }

  update(hero: HeroPosition, dt: number, travelling: boolean): void {
    if (travelling) this.jumpTime = -1;
    this.lift = 0;
    if (this.jumpTime >= 0) {
      this.jumpTime += dt;
      const progress = this.jumpTime / 0.5;
      this.lift = progress < 1 ? Math.sin(progress * Math.PI) * 0.5 * 0.55 : 0;
      if (progress >= 1) this.jumpTime = -1;
    }
    const [name, speed] = LOOPS[travelling ? 'idle' : hero.gait];
    if (this.jumpTime < 0) this.play(name, speed);
    const bounce =
      hero.moving && !travelling && this.jumpTime < 0
        ? Math.abs(Math.sin(this.swing * Math.PI * 2 * speed * 1.25)) * 0.5 * 0.045
        : 0;
    this.root.position.set(hero.x, hero.y + this.lift + bounce, hero.z);
    this.root.rotation.y = dampAngle(this.root.rotation.y, hero.facing, 32, dt);
    this.swing += dt;
    this.mixer.update(dt);
  }

  dispose(): void {
    this.mixer.stopAllAction();
    this.mixer.uncacheRoot(this.root);
  }
}
