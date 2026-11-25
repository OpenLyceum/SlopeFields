/**
 * EulerModel.ts
 *
 * State for the Euler's Method screen: equation choice, initial condition,
 * step size, playback, and overlay toggles for Heun / RK4 / exact / field.
 */

import { BooleanProperty, NumberProperty, StringProperty } from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import type { TModel } from "scenerystack/joist";
import { EQUATIONS, type Equation, equationById } from "../../common/model/EquationLibrary.js";
import { type Method, step } from "../../common/model/odeSolvers.js";
import {
  PLAY_STEP_INTERVAL,
  STEP_SIZE_DEFAULT,
  STEP_SIZE_PRESETS,
  STEP_SIZE_RANGE,
  X_END_MIN_GAP,
} from "../../SlopeFieldsConstants.js";

/** Per-equation default start and end for the Euler screen. @internal */
export type EulerStart = {
  readonly x0: number;
  readonly y0: number;
  readonly xEnd: number;
};

/**
 * Default (x₀, y₀, xEnd) for every equation that has an exact solution.
 * Keys match EquationLibrary ids that define `exact`.
 *
 * @internal
 */
export const EULER_STARTS: Readonly<Record<string, EulerStart>> = {
  y: { x0: 0, y0: 1, xEnd: 1 },
  x: { x0: 0, y0: 0, xEnd: 2 },
  xMinusY: { x0: 0, y0: 1, xEnd: 2 },
  xy: { x0: 0, y0: 1, xEnd: 1.5 },
  logistic: { x0: -2, y0: 0.2, xEnd: 3 },
  sinX: { x0: 0, y0: 0, xEnd: 2 * Math.PI },
  circle: { x0: 0, y0: 3, xEnd: 2.5 },
};

/** Equation ids available on this screen (those with a closed form). */
export const EULER_EQUATION_IDS: readonly string[] = EQUATIONS.filter((eq) => eq.exact !== undefined).map(
  (eq) => eq.id,
);

const DEFAULT_EQUATION_ID = "y";

/**
 * Number of Euler steps from x0 to xEnd with step h (final step may be shortened).
 *
 * @internal
 */
export function stepCount(x0: number, xEnd: number, h: number): number {
  if (!(h > 0 && xEnd > x0)) {
    return 0;
  }
  return Math.ceil((xEnd - x0) / h - 1e-9);
}

/** Snap h to a preset when within 1e-9; otherwise leave unchanged. */
function snapStepSize(h: number): number {
  for (const preset of STEP_SIZE_PRESETS) {
    if (Math.abs(h - preset) < 1e-9) {
      return preset;
    }
  }
  return h;
}

export class EulerModel implements TModel {
  public readonly equationIdProperty: StringProperty;
  public readonly x0Property: NumberProperty;
  public readonly y0Property: NumberProperty;
  public readonly xEndProperty: NumberProperty;
  public readonly stepSizeProperty: NumberProperty;
  public readonly stepsTakenProperty: NumberProperty;
  public readonly isPlayingProperty: BooleanProperty;
  public readonly showHeunProperty: BooleanProperty;
  public readonly showRk4Property: BooleanProperty;
  public readonly showExactProperty: BooleanProperty;
  public readonly showFieldProperty: BooleanProperty;

  /** Accumulated real time toward the next auto-step while playing. */
  private playElapsed = 0;

  /** Suppress stepsTaken resets while applying a coordinated equation start. */
  private applyingStart = false;

  public constructor() {
    const start = EULER_STARTS[DEFAULT_EQUATION_ID];
    if (start === undefined) {
      throw new Error(`Missing EULER_STARTS entry for ${DEFAULT_EQUATION_ID}`);
    }
    const eq = equationById(DEFAULT_EQUATION_ID);

    this.equationIdProperty = new StringProperty(DEFAULT_EQUATION_ID, {
      validValues: [...EULER_EQUATION_IDS],
    });
    this.x0Property = new NumberProperty(start.x0);
    this.y0Property = new NumberProperty(start.y0);
    this.xEndProperty = new NumberProperty(start.xEnd, {
      range: new Range(start.x0 + X_END_MIN_GAP, eq.domain.xMax),
    });
    this.stepSizeProperty = new NumberProperty(STEP_SIZE_DEFAULT, {
      range: STEP_SIZE_RANGE,
    });
    this.stepsTakenProperty = new NumberProperty(0, {
      range: new Range(0, stepCount(start.x0, start.xEnd, STEP_SIZE_DEFAULT)),
    });
    this.isPlayingProperty = new BooleanProperty(false);
    this.showHeunProperty = new BooleanProperty(false);
    this.showRk4Property = new BooleanProperty(false);
    this.showExactProperty = new BooleanProperty(true);
    this.showFieldProperty = new BooleanProperty(true);

    this.equationIdProperty.link((id) => {
      this.applyEquationStart(id);
    });

    const resetSteps = () => {
      if (this.applyingStart) {
        return;
      }
      this.syncStepRange();
      this.stepsTakenProperty.value = 0;
      this.isPlayingProperty.value = false;
      this.playElapsed = 0;
    };

    this.stepSizeProperty.link(resetSteps);
    this.x0Property.link(() => {
      this.syncXEndRange();
      resetSteps();
    });
    this.y0Property.link(resetSteps);
    this.xEndProperty.link(resetSteps);
  }

  /** The currently selected equation catalog entry. */
  public get equation(): Equation {
    return equationById(this.equationIdProperty.value);
  }

  /** Total Euler steps N = ceil((xEnd − x0)/h − 1e-9). */
  public get totalSteps(): number {
    return stepCount(this.x0Property.value, this.xEndProperty.value, this.stepSizeProperty.value);
  }

  /**
   * Integration nodes (x_n, y_n) for n = 0..N with the named method.
   * Uses odeSolvers.step; the final step is shortened so x_N = xEnd exactly.
   */
  public eulerPoints(method: Method): Array<readonly [number, number]> {
    const f = this.equation.f;
    const x0 = this.x0Property.value;
    const y0 = this.y0Property.value;
    const xEnd = this.xEndProperty.value;
    const h = this.stepSizeProperty.value;
    const points: Array<readonly [number, number]> = [[x0, y0]];
    if (!(h > 0 && xEnd > x0)) {
      return points;
    }
    let x = x0;
    let y = y0;
    const n = stepCount(x0, xEnd, h);
    for (let i = 0; i < n; i++) {
      const remaining = xEnd - x;
      const stepH = Math.min(h, remaining);
      y = step(method, f, x, y, stepH);
      x += stepH;
      points.push([x, y]);
    }
    return points;
  }

  /** Exact solution y(x) through the current initial condition; NaN if unavailable. */
  public exactAt(x: number): number {
    const exact = this.equation.exact;
    if (exact === undefined) {
      return Number.NaN;
    }
    return exact(this.x0Property.value, this.y0Property.value)(x);
  }

  /** Global error |y_N − exact(xEnd)| for the named method. */
  public globalError(method: Method): number {
    const points = this.eulerPoints(method);
    const last = points[points.length - 1];
    if (last === undefined) {
      return Number.NaN;
    }
    return Math.abs(last[1] - this.exactAt(this.xEndProperty.value));
  }

  /** Advance one Euler step (manual Step button). */
  public stepForward(): void {
    const n = this.totalSteps;
    if (this.stepsTakenProperty.value < n) {
      this.stepsTakenProperty.value += 1;
    }
    if (this.stepsTakenProperty.value >= n) {
      this.isPlayingProperty.value = false;
      this.playElapsed = 0;
    }
  }

  /** Jump to the final node. */
  public showAll(): void {
    this.stepsTakenProperty.value = this.totalSteps;
    this.isPlayingProperty.value = false;
    this.playElapsed = 0;
  }

  /** Return to the initial condition (n = 0). */
  public restart(): void {
    this.stepsTakenProperty.value = 0;
    this.isPlayingProperty.value = false;
    this.playElapsed = 0;
  }

  /**
   * Halve the step size, floored at the minimum preset; snap to a preset when
   * the result lands within 1e-9 of one.
   */
  public halveStep(): void {
    const next = snapStepSize(Math.max(STEP_SIZE_RANGE.min, this.stepSizeProperty.value / 2));
    this.stepSizeProperty.value = next;
  }

  public reset(): void {
    this.stepSizeProperty.reset();
    this.showHeunProperty.reset();
    this.showRk4Property.reset();
    this.showExactProperty.reset();
    this.showFieldProperty.reset();
    this.isPlayingProperty.reset();
    this.playElapsed = 0;
    this.equationIdProperty.reset();
    // Re-apply starts even when the equation id was already the default (no notify).
    this.applyEquationStart(this.equationIdProperty.value);
  }

  /**
   * While playing, advance one Euler step every PLAY_STEP_INTERVAL seconds;
   * stop automatically at N.
   */
  public step(dt: number): void {
    if (!this.isPlayingProperty.value) {
      this.playElapsed = 0;
      return;
    }
    this.playElapsed += dt;
    while (this.playElapsed >= PLAY_STEP_INTERVAL && this.stepsTakenProperty.value < this.totalSteps) {
      this.playElapsed -= PLAY_STEP_INTERVAL;
      this.stepForward();
    }
    if (this.stepsTakenProperty.value >= this.totalSteps) {
      this.isPlayingProperty.value = false;
      this.playElapsed = 0;
    }
  }

  public dispose(): void {
    this.equationIdProperty.dispose();
    this.x0Property.dispose();
    this.y0Property.dispose();
    this.xEndProperty.dispose();
    this.stepSizeProperty.dispose();
    this.stepsTakenProperty.dispose();
    this.isPlayingProperty.dispose();
    this.showHeunProperty.dispose();
    this.showRk4Property.dispose();
    this.showExactProperty.dispose();
    this.showFieldProperty.dispose();
  }

  private applyEquationStart(id: string): void {
    const start = EULER_STARTS[id];
    if (start === undefined) {
      return;
    }
    this.applyingStart = true;
    this.x0Property.value = start.x0;
    this.y0Property.value = start.y0;
    this.syncXEndRange();
    this.xEndProperty.value = start.xEnd;
    this.applyingStart = false;
    this.syncStepRange();
    this.stepsTakenProperty.value = 0;
    this.isPlayingProperty.value = false;
    this.playElapsed = 0;
  }

  private syncXEndRange(): void {
    const x0 = this.x0Property.value;
    const xMax = this.equation.domain.xMax;
    const min = Math.min(x0 + X_END_MIN_GAP, xMax);
    const range = new Range(min, Math.max(min, xMax));
    const clamped = Math.max(range.min, Math.min(range.max, this.xEndProperty.value));
    this.xEndProperty.setValueAndRange(clamped, range);
  }

  private syncStepRange(): void {
    const n = this.totalSteps;
    const taken = Math.max(0, Math.min(n, this.stepsTakenProperty.value));
    this.stepsTakenProperty.setValueAndRange(taken, new Range(0, Math.max(0, n)));
  }
}
