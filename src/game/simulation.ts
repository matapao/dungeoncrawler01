import { isCommand } from './commands.ts';
import { ARRIVAL, canStand, FIXED_STEP, WALK_SPEED } from './hub.ts';
import type { Gait, HeroPosition } from './hub.ts';
import { canStandInDungeon, doorDestination, spawnFor, TRAVEL_TICKS } from './locations.ts';
import type { LocationId, Travel } from './locations.ts';
import { DEFAULT_DUNGEON } from './dungeon-choice.ts';
import type { DungeonChoice } from './dungeon-choice.ts';
import { DEFAULT_DUNGEON_SEED, generateDungeon } from './generated-dungeon.ts';
import { navStep } from './dungeon-navigation.ts';

export class HubSimulation {
  private position = {
    x: Number(ARRIVAL.x),
    z: Number(ARRIVAL.z),
    y: 0,
    floor: 0 as 0 | 1,
    facing: Math.PI,
    moving: false,
    gait: 'idle' as Gait,
  };
  private direction = { x: 0, z: 0, look: Math.PI, gait: 'idle' as Gait };
  private currentLocation: LocationId = 'hub';
  private selectedDungeon: DungeonChoice = DEFAULT_DUNGEON;
  private generated = generateDungeon(DEFAULT_DUNGEON_SEED);
  private travel: { destination: LocationId; elapsedTicks: number } | undefined;

  get hero(): HeroPosition {
    return this.position;
  }

  get location(): LocationId {
    return this.currentLocation;
  }

  get transition(): Travel | undefined {
    return this.travel;
  }

  get layoutId(): DungeonChoice {
    return this.selectedDungeon;
  }

  get dungeon() {
    return this.generated;
  }

  get seed(): number {
    return this.generated.seed;
  }

  get atGoal(): boolean {
    const goal = this.generated.exit;
    return (
      this.currentLocation === 'chamber' &&
      this.selectedDungeon === 'generated' &&
      this.position.floor === goal.floor &&
      Math.abs(this.position.y - goal.y) < 1e-7 &&
      Math.hypot(this.position.x - goal.x, this.position.z - goal.z) <= goal.reach
    );
  }

  apply(input: unknown): boolean {
    // The owner validates even local input; future transport must also validate at ingress.
    if (!isCommand(input) || this.travel) return false;
    switch (input.type) {
      case 'choose-seed': {
        if (this.currentLocation !== 'hub') return false;
        this.generated = generateDungeon(input.seed);
        this.direction = { x: 0, z: 0, look: this.position.facing, gait: 'idle' };
        this.position.moving = false;
        this.position.gait = 'idle';
        return true;
      }
      case 'choose-layout': {
        if (this.currentLocation !== 'hub') return false;
        this.selectedDungeon = input.layoutId;
        this.direction = { x: 0, z: 0, look: this.position.facing, gait: 'idle' };
        this.position.moving = false;
        this.position.gait = 'idle';
        return true;
      }
      case 'move': {
        const length = Math.max(1, Math.hypot(input.x, input.z));
        this.direction = {
          x: input.x / length,
          z: input.z / length,
          look: input.look ?? (input.x || input.z ? Math.atan2(input.x, input.z) : this.position.facing),
          gait: input.gait ?? (input.x || input.z ? 'fwd' : 'idle'),
        };
        return true;
      }
      case 'interact': {
        const destination = doorDestination(
          this.currentLocation,
          this.position,
          this.selectedDungeon,
          this.generated,
        );
        if (!destination) return false;
        this.direction = { x: 0, z: 0, look: this.position.facing, gait: 'idle' };
        this.position.moving = false;
        this.position.gait = 'idle';
        this.travel = { destination, elapsedTicks: 0 };
        return true;
      }
      default: {
        const exhaustive: never = input;
        return exhaustive;
      }
    }
  }

  step(): void {
    if (this.travel) {
      this.travel.elapsedTicks++;
      if (this.travel.elapsedTicks === TRAVEL_TICKS / 2) {
        this.currentLocation = this.travel.destination;
        this.position = {
          ...spawnFor(this.currentLocation, this.selectedDungeon, this.generated),
          moving: false,
          gait: 'idle',
        };
        this.direction.look = this.position.facing;
      }
      if (this.travel.elapsedTicks >= TRAVEL_TICKS) this.travel = undefined;
      return;
    }
    const h = this.position;
    const speed = WALK_SPEED * (this.direction.gait === 'back' ? 0.62 : 1);
    const x = this.direction.x * speed * FIXED_STEP;
    const z = this.direction.z * speed * FIXED_STEP;
    // Same diagonal-first, then single-axis slide order as TD01's hero-movement.ts.
    const choice = this.selectedDungeon;
    if (this.currentLocation === 'chamber' && choice === 'generated') {
      const next =
        navStep(this.generated, h, h.x + x, h.z + z) ??
        navStep(this.generated, h, h.x + x, h.z) ??
        navStep(this.generated, h, h.x, h.z + z);
      if (next) Object.assign(h, next);
    } else {
      const stand =
        this.currentLocation === 'hub'
          ? canStand
          : (px: number, pz: number) => choice !== 'generated' && canStandInDungeon(choice, px, pz);
      if (stand(h.x + x, h.z + z)) {
        h.x += x;
        h.z += z;
      } else if (stand(h.x + x, h.z)) h.x += x;
      else if (stand(h.x, h.z + z)) h.z += z;
    }
    h.moving = x !== 0 || z !== 0;
    h.gait = h.moving ? this.direction.gait : 'idle';
    h.facing = this.direction.look;
  }
}
