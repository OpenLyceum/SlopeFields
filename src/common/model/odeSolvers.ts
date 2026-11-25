/**
 * odeSolvers.ts
 *
 * Pure numerical ODE solvers for first-order equations y′ = f(x, y).
 * Used by the Slope Field, Euler, and Growth Models screens.
 */

/** Right-hand side of y′ = f(x, y). */
export type Slope = (x: number, y: number) => number;

/** Supported one-step integration methods. */
export type Method = "euler" | "heun" | "rk4";

/** Axis-aligned viewing window in the (x, y) plane. */
export type Bounds = {
  readonly xMin: number;
  readonly xMax: number;
  readonly yMin: number;
  readonly yMax: number;
};

const MAX_STEPS = 20_000;
const Y_ABS_CAP = 1e6;

/**
 * Forward Euler: y_{n+1} = y_n + h f(x_n, y_n).
 *
 * @internal
 */
export function eulerStep(f: Slope, x: number, y: number, h: number): number {
  return y + h * f(x, y);
}

/**
 * Heun / improved Euler (predictor-corrector):
 *   ŷ = y + h f(x, y)
 *   y_{n+1} = y + (h/2) [f(x, y) + f(x+h, ŷ)]
 *
 * @internal
 */
export function heunStep(f: Slope, x: number, y: number, h: number): number {
  const k1 = f(x, y);
  const yPred = y + h * k1;
  const k2 = f(x + h, yPred);
  return y + (h / 2) * (k1 + k2);
}

/**
 * Classical fourth-order Runge–Kutta.
 *
 * @internal
 */
export function rk4Step(f: Slope, x: number, y: number, h: number): number {
  const k1 = f(x, y);
  const k2 = f(x + h / 2, y + (h / 2) * k1);
  const k3 = f(x + h / 2, y + (h / 2) * k2);
  const k4 = f(x + h, y + h * k3);
  return y + (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
}

/** Dispatch to the named one-step method. */
export function step(method: Method, f: Slope, x: number, y: number, h: number): number {
  switch (method) {
    case "euler":
      return eulerStep(f, x, y, h);
    case "heun":
      return heunStep(f, x, y, h);
    case "rk4":
      return rk4Step(f, x, y, h);
  }
}

/**
 * True when a candidate y should stop the trace: non-finite, past the absolute
 * cap, or outside the viewing window expanded by 50% of its height on each side.
 */
function isOutOfRange(y: number, bounds: Bounds | undefined): boolean {
  if (!Number.isFinite(y) || Math.abs(y) > Y_ABS_CAP) {
    return true;
  }
  if (bounds === undefined) {
    return false;
  }
  const height = bounds.yMax - bounds.yMin;
  const yLo = bounds.yMin - 0.5 * height;
  const yHi = bounds.yMax + 0.5 * height;
  return y < yLo || y > yHi;
}

/**
 * Integrate y′ = f from (x0, y0) toward xEnd with fixed |h|.
 *
 * `h` must be positive; the step is signed internally toward xEnd. The final
 * step is shortened so the last abscissa is exactly xEnd. Returns points
 * starting with [x0, y0]. Stops (without adding the bad point) when y becomes
 * non-finite, |y| > 1e6, or y leaves the optional bounds expanded by 50% of
 * their height on each side. Caps at 20 000 steps.
 *
 * @internal
 */
export function integrate(
  f: Slope,
  x0: number,
  y0: number,
  xEnd: number,
  h: number,
  method: Method,
  bounds?: Bounds,
): Array<readonly [number, number]> {
  const points: Array<readonly [number, number]> = [[x0, y0]];
  if (x0 === xEnd || h <= 0) {
    return points;
  }

  const direction = Math.sign(xEnd - x0);
  let x = x0;
  let y = y0;

  for (let i = 0; i < MAX_STEPS; i++) {
    const remaining = xEnd - x;
    if (remaining === 0) {
      break;
    }
    let stepH = direction * h;
    if (Math.abs(stepH) >= Math.abs(remaining)) {
      stepH = remaining;
    }

    const yNext = step(method, f, x, y, stepH);
    const xNext = x + stepH;

    if (!Number.isFinite(xNext) || isOutOfRange(yNext, bounds)) {
      break;
    }

    x = xNext;
    y = yNext;
    points.push([x, y]);

    if (x === xEnd) {
      break;
    }
  }

  return points;
}

/**
 * Trace the solution curve through (x0, y0) across the full x-span of `bounds`
 * using RK4: integrate backward to xMin and forward to xMax, then join in
 * increasing-x order with (x0, y0) appearing once.
 */
export function traceSolution(
  f: Slope,
  x0: number,
  y0: number,
  bounds: Bounds,
  h: number,
): Array<readonly [number, number]> {
  const forward = integrate(f, x0, y0, bounds.xMax, h, "rk4", bounds);
  const backward = integrate(f, x0, y0, bounds.xMin, h, "rk4", bounds);
  // backward is [ (x0,y0), …toward xMin ]; drop the shared seed and reverse.
  return [...backward.slice(1).reverse(), ...forward];
}
