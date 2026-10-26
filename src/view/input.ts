/** TD01 mouse gestures and camera-relative controls, adapted to the dungeon command port. */
import type { Command } from '../game/commands.ts';
import type { HeroPosition } from '../game/hub.ts';
import type { HeroCamera } from './camera.ts';

const DRAG_PX = 7;
interface Press {
  x: number;
  y: number;
  t: number;
  moved: number;
}
interface MovementPort {
  dom: HTMLElement;
  camera: HeroCamera;
  hero(): HeroPosition;
  send(command: Command): boolean;
  isLocked(): boolean;
  jump(): void;
}

export class MovementInput {
  private port: MovementPort;
  private keys = new Set<string>();
  private press: Partial<Record<0 | 2, Press>> = {};
  private buttons = 0;
  private locked = false;
  private moving = false;
  private poseFacing = 0;
  private poseT = 0;
  private listeners = new AbortController();
  private rightHoldWalks = /Mac|iPhone|iPad/.test(navigator.platform);

  constructor(port: MovementPort) {
    this.port = port;
    const signal = this.listeners.signal;
    port.dom.addEventListener('mousedown', (event) => this.down(event), { signal });
    window.addEventListener('mousemove', (event) => this.move(event), { signal });
    window.addEventListener('mouseup', (event) => this.up(event), { signal });
    port.dom.addEventListener('contextmenu', (event) => event.preventDefault(), { signal });
    port.dom.addEventListener('wheel', (event) => this.wheel(event), { passive: false, signal });
    window.addEventListener('keydown', (event) => this.key(event, true), { signal });
    window.addEventListener('keyup', (event) => this.key(event, false), { signal });
    window.addEventListener('blur', () => this.clear(), { signal });
    document.addEventListener(
      'visibilitychange',
      () => {
        if (document.hidden) this.clear();
      },
      { signal },
    );
    document.addEventListener(
      'pointerlockchange',
      () => {
        const wasLocked = this.locked;
        this.locked = document.pointerLockElement === port.dom;
        // Normal mouseup releases capture without cancelling a still-held W/A/S/D key.
        if (wasLocked && !this.locked && this.buttons !== 0) this.clear();
      },
      { signal },
    );
  }

  clear(): void {
    this.keys.clear();
    this.press = {};
    this.buttons = 0;
    this.moving = false;
    this.port.send({ type: 'move', x: 0, z: 0 });
    if (document.pointerLockElement === this.port.dom) document.exitPointerLock();
  }

  private key(event: KeyboardEvent, down: boolean): void {
    const target = event.target;
    if (target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return;
    if (target instanceof HTMLInputElement) {
      if (!['checkbox', 'radio', 'range', 'button'].includes(target.type)) return;
      target.blur();
    }
    if (
      ![
        'KeyW',
        'KeyA',
        'KeyS',
        'KeyD',
        'KeyQ',
        'KeyE',
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
        'Space',
        'KeyF',
      ].includes(event.code)
    )
      return;
    event.preventDefault();
    if (!down) {
      this.keys.delete(event.code);
      return;
    }
    if (event.repeat) return;
    if (this.port.isLocked()) {
      this.clear();
      return;
    }
    if (event.code === 'KeyF') {
      if (this.port.send({ type: 'interact' })) this.clear();
    } else if (event.code === 'Space') this.port.jump();
    else this.keys.add(event.code);
  }

  private down(event: MouseEvent): void {
    if (event.button !== 0 && event.button !== 2) return;
    if (this.port.isLocked()) return;
    this.buttons |= event.button === 0 ? 1 : 2;
    this.press[event.button] = { x: event.clientX, y: event.clientY, t: performance.now(), moved: 0 };
  }

  private move(event: MouseEvent): void {
    for (const [bit, button] of [
      [1, 0],
      [2, 2],
    ] as const) {
      if (this.buttons & bit && !(event.buttons & bit)) {
        this.buttons &= ~bit;
        delete this.press[button];
      }
    }
    if (!this.buttons) {
      if (document.pointerLockElement === this.port.dom) document.exitPointerLock();
      return;
    }
    for (const button of [0, 2] as const) {
      const press = this.press[button];
      if (press) press.moved += Math.abs(event.movementX) + Math.abs(event.movementY);
    }
    if (!Object.values(this.press).some((press) => press && press.moved > DRAG_PX)) return;
    if (!this.locked && document.pointerLockElement !== this.port.dom) {
      try {
        void Promise.resolve(this.port.dom.requestPointerLock()).catch(() => {
          // Expected browser denial: mouse deltas still orbit without capture.
        });
      } catch {
        // Pointer capture is optional; the same drag remains usable without it.
      }
    }
    this.port.camera.orbit(event.movementX, event.movementY);
  }

  private up(event: MouseEvent): void {
    if (event.button !== 0 && event.button !== 2) return;
    delete this.press[event.button];
    this.buttons &= ~(event.button === 0 ? 1 : 2);
    if (!this.buttons && document.pointerLockElement === this.port.dom) document.exitPointerLock();
  }

  private wheel(event: WheelEvent): void {
    event.preventDefault();
    if (this.port.isLocked()) return;
    if (event.ctrlKey) this.port.camera.zoom(event.deltaY * 4);
    else if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) this.port.camera.turn(-event.deltaX * 0.004);
    else this.port.camera.zoom(event.deltaY);
  }

  update(dt: number): void {
    const camera = this.port.camera;
    const turn =
      Number(this.keys.has('KeyQ') || this.keys.has('ArrowLeft')) -
      Number(this.keys.has('KeyE') || this.keys.has('ArrowRight'));
    if (turn) camera.turn(turn * 3.2 * Math.min(dt, 0.1));
    if (this.port.isLocked()) {
      this.clear();
      return;
    }
    const right = this.press[2];
    const holdWalk = this.rightHoldWalks && !!right && performance.now() - right.t > 200;
    const both = (this.buttons & 3) === 3;
    const forward =
      Number(this.keys.has('KeyW') || this.keys.has('ArrowUp') || both || holdWalk) -
      Number(this.keys.has('KeyS') || this.keys.has('ArrowDown'));
    const side = Number(this.keys.has('KeyD')) - Number(this.keys.has('KeyA'));
    const f = camera.forward;
    const x = f.x * forward - f.z * side;
    const z = f.z * forward + f.x * side;
    const length = Math.hypot(x, z);
    this.poseT -= dt;
    if (length > 0.01) {
      this.port.send({
        type: 'move',
        x: x / length,
        z: z / length,
        look: camera.look,
        gait: forward > 0 ? 'fwd' : forward < 0 ? 'back' : side > 0 ? 'right' : 'left',
      });
      this.moving = true;
      this.poseFacing = camera.look;
      return;
    }
    const turning = !!right && right.moved > DRAG_PX;
    const facing = turning ? camera.look : this.port.hero().facing;
    if (this.moving || (turning && Math.abs(facing - this.poseFacing) > 0.02 && this.poseT <= 0)) {
      this.port.send({ type: 'move', x: 0, z: 0, look: facing, gait: 'idle' });
      this.moving = false;
      this.poseFacing = facing;
      this.poseT = 1 / 20;
    }
  }

  dispose(): void {
    this.clear();
    this.listeners.abort();
  }
}
