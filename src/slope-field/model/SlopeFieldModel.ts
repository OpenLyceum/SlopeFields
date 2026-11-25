/**
 * SlopeFieldModel.ts
 *
 * State for the Slope Field screen: equation choice, initial condition,
 * field display options, and pinned solution curves.
 */

import {
  BooleanProperty,
  createObservableArray,
  NumberProperty,
  type ObservableArray,
  StringProperty,
} from "scenerystack/axon";
import { Vector2, Vector2Property } from "scenerystack/dot";
import type { TModel } from "scenerystack/joist";
import { EQUATIONS, type Equation, equationById } from "../../common/model/EquationLibrary.js";
import { traceSolution } from "../../common/model/odeSolvers.js";
import {
  DENSITY_DEFAULT,
  DENSITY_RANGE,
  INITIAL_POINT_DEFAULT,
  ISOCLINE_SLOPE_DEFAULT,
  ISOCLINE_SLOPE_RANGE,
  MAX_PINNED_CURVES,
  SEGMENT_SCALE_DEFAULT,
  SEGMENT_SCALE_RANGE,
} from "../../SlopeFieldsConstants.js";

/** A saved initial condition for a pinned solution curve. */
export type PinnedCurve = {
  readonly x0: number;
  readonly y0: number;
};

const EQUATION_IDS = EQUATIONS.map((eq) => eq.id);

export class SlopeFieldModel implements TModel {
  public readonly equationIdProperty: StringProperty;
  public readonly initialPointProperty: Vector2Property;
  public readonly densityProperty: NumberProperty;
  public readonly segmentScaleProperty: NumberProperty;
  public readonly showIsoclineProperty: BooleanProperty;
  public readonly isoclineSlopeProperty: NumberProperty;
  public readonly showEquilibriaProperty: BooleanProperty;
  public readonly showExactProperty: BooleanProperty;
  public readonly pinnedCurves: ObservableArray<PinnedCurve>;

  public constructor() {
    this.equationIdProperty = new StringProperty("logistic", {
      validValues: EQUATION_IDS,
    });
    this.initialPointProperty = new Vector2Property(INITIAL_POINT_DEFAULT.copy());
    this.densityProperty = new NumberProperty(DENSITY_DEFAULT, {
      range: DENSITY_RANGE,
    });
    this.segmentScaleProperty = new NumberProperty(SEGMENT_SCALE_DEFAULT, {
      range: SEGMENT_SCALE_RANGE,
    });
    this.showIsoclineProperty = new BooleanProperty(false);
    this.isoclineSlopeProperty = new NumberProperty(ISOCLINE_SLOPE_DEFAULT, {
      range: ISOCLINE_SLOPE_RANGE,
    });
    this.showEquilibriaProperty = new BooleanProperty(true);
    this.showExactProperty = new BooleanProperty(false);
    this.pinnedCurves = createObservableArray<PinnedCurve>();

    // Clamp the initial point into the new domain and drop pinned curves on equation change.
    this.equationIdProperty.link(() => {
      this.clampInitialPoint();
      this.pinnedCurves.clear();
    });
  }

  /** The currently selected equation catalog entry. */
  public get equation(): Equation {
    return equationById(this.equationIdProperty.value);
  }

  /**
   * Numerical solution through the current initial point across the equation domain
   * (RK4, h = (xMax − xMin) / 400).
   */
  public get currentSolution(): Array<readonly [number, number]> {
    const eq = this.equation;
    const { x, y } = this.initialPointProperty.value;
    const h = (eq.domain.xMax - eq.domain.xMin) / 400;
    return traceSolution(eq.f, x, y, eq.domain, h);
  }

  /** Pin the current initial point as a saved curve (oldest dropped past the cap). */
  public keepCurve(): void {
    const { x, y } = this.initialPointProperty.value;
    this.pinnedCurves.push({ x0: x, y0: y });
    while (this.pinnedCurves.length > MAX_PINNED_CURVES) {
      this.pinnedCurves.shift();
    }
  }

  /** Remove all pinned curves. */
  public clearCurves(): void {
    this.pinnedCurves.clear();
  }

  /**
   * If the initial point lies outside the current equation domain, move it to
   * (0, yMid) — or the nearest in-domain x if 0 is outside the x-span.
   */
  private clampInitialPoint(): void {
    const { xMin, xMax, yMin, yMax } = this.equation.domain;
    const p = this.initialPointProperty.value;
    if (p.x >= xMin && p.x <= xMax && p.y >= yMin && p.y <= yMax) {
      return;
    }
    const x = Math.max(xMin, Math.min(xMax, 0));
    const y = (yMin + yMax) / 2;
    this.initialPointProperty.value = new Vector2(x, y);
  }

  public reset(): void {
    this.equationIdProperty.reset();
    this.initialPointProperty.reset();
    this.densityProperty.reset();
    this.segmentScaleProperty.reset();
    this.showIsoclineProperty.reset();
    this.isoclineSlopeProperty.reset();
    this.showEquilibriaProperty.reset();
    this.showExactProperty.reset();
    this.pinnedCurves.clear();
  }

  public step(_dt: number): void {
    // Static slope field — no per-frame advance.
  }

  public dispose(): void {
    this.equationIdProperty.dispose();
    this.initialPointProperty.dispose();
    this.densityProperty.dispose();
    this.segmentScaleProperty.dispose();
    this.showIsoclineProperty.dispose();
    this.isoclineSlopeProperty.dispose();
    this.showEquilibriaProperty.dispose();
    this.showExactProperty.dispose();
    this.pinnedCurves.dispose();
  }
}
