/** Limit simulation catch-up in browser acceptance without changing game rules or input. */
export const FRAME_CLOCK_KEY = '__dungeonAcceptanceFrameStepMs';

export function installFrameClock(maximumMs: number, settingKey: string): void {
  if (!Number.isFinite(maximumMs) || maximumMs <= 0) throw new Error('Invalid frame step');
  Reflect.set(globalThis, settingKey, maximumMs);
  const request: unknown = Reflect.get(globalThis, 'requestAnimationFrame');
  if (typeof request !== 'function') throw new Error('Animation frames are unavailable');
  let lastActual: number | undefined;
  let simulated = 0;
  Reflect.set(globalThis, 'requestAnimationFrame', (callback: (time: number) => void): number => {
    const handle: unknown = Reflect.apply(request, globalThis, [
      (actual: number) => {
        const limit: unknown = Reflect.get(globalThis, settingKey);
        if (typeof limit !== 'number' || !Number.isFinite(limit) || limit <= 0)
          throw new Error('Invalid acceptance frame step');
        if (lastActual === undefined) simulated = actual;
        else if (actual !== lastActual) simulated += Math.min(Math.max(0, actual - lastActual), limit);
        lastActual = actual;
        callback(simulated);
      },
    ]);
    if (typeof handle !== 'number') throw new Error('Invalid animation frame handle');
    return handle;
  });
}
