/**
 * GrowthModelsModel.ts
 *
 * State for the Growth Models screen: model choice, parameters, display toggles,
 * closed-form / RK4 solution evaluation, and harvesting extinction time.
 */

import { BooleanProperty, NumberProperty, StringProperty } from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import type { TModel } from "scenerystack/joist";
import {
  criticalHarvest,
  type Equilibrium,
  GROWTH_MODEL_IDS,
  type GrowthModelId,
  type GrowthParameters,
  growthEquilibria,
  growthRate,
  growthSolution,
} from "../../common/model/GrowthModels.js";
import { integrate } from "../../common/model/odeSolvers.js";
import {
  COOLING_DEFAULTS,
  EXPONENTIAL_DEFAULTS,
  GROWTH_EXTINCTION_TIME_CAP,
  GROWTH_RK4_DIVISOR,
  type GrowthParamDefaults,
  HARVESTING_DEFAULTS,
  LOGISTIC_DEFAULTS,
} from "../../SlopeFieldsConstants.js";

const DEFAULTS_BY_ID: Record<GrowthModelId, GrowthParamDefaults> = {
  exponential: EXPONENTIAL_DEFAULTS,
  cooling: COOLING_DEFAULTS,
  logistic: LOGISTIC_DEFAULTS,
  harvesting: HARVESTING_DEFAULTS,
};

/** Apply value + range to a NumberProperty in one shot. */
function setParam(property: NumberProperty, spec: { value: number; min: number; max: number }): void {
  property.setValueAndRange(spec.value, new Range(spec.min, spec.max));
}

/** Linear time at which a segment from prev to next crosses y = 0. */
function zeroCrossingTime(prev: readonly [number, number], next: readonly [number, number]): number {
  const dy = next[1] - prev[1];
  const frac = dy === 0 ? 1 : (0 - prev[1]) / dy;
  return prev[0] + frac * (next[0] - prev[0]);
}

/**
 * Clip an RK4 trace at the first non-positive y, returning the clipped points and
 * the interpolated extinction time (or null if y stays positive).
 */
function clipAtExtinction(raw: Array<readonly [number, number]>): {
  points: Array<readonly [number, number]>;
  extinctionTime: number | null;
} {
  const points: Array<readonly [number, number]> = [];
  for (let i = 0; i < raw.length; i++) {
    const point = raw[i];
    if (point === undefined) {
      continue;
    }
    if (point[1] > 0) {
      points.push(point);
      continue;
    }
    if (i === 0) {
      return { points: [[point[0], 0]], extinctionTime: point[0] };
    }
    const prev = raw[i - 1];
    if (prev === undefined) {
      return { points: [...points, [point[0], 0]], extinctionTime: point[0] };
    }
    const tCross = zeroCrossingTime(prev, point);
    return { points: [...points, [tCross, 0]], extinctionTime: tCross };
  }
  return { points, extinctionTime: null };
}

/** Continue RK4 past the last sample until y ≤ 0 (or the time cap). */
function findExtinctionBeyond(f: (y: number) => number, start: readonly [number, number], h: number): number | null {
  if (!(start[1] > 0)) {
    return start[0];
  }
  const extended = integrate((_t, y) => f(y), start[0], start[1], GROWTH_EXTINCTION_TIME_CAP, h, "rk4");
  for (let i = 1; i < extended.length; i++) {
    const prev = extended[i - 1];
    const point = extended[i];
    if (prev === undefined || point === undefined || point[1] > 0) {
      continue;
    }
    return zeroCrossingTime(prev, point);
  }
  return null;
}

export class GrowthModelsModel implements TModel {
  public readonly modelIdProperty: StringProperty;
  public readonly rProperty: NumberProperty;
  public readonly kProperty: NumberProperty;
  public readonly ambientProperty: NumberProperty;
  public readonly harvestProperty: NumberProperty;
  public readonly y0Property: NumberProperty;
  public readonly tMaxProperty: NumberProperty;
  public readonly showPhaseLineProperty: BooleanProperty;
  public readonly showEquilibriaProperty: BooleanProperty;
  public readonly showDirectionFieldProperty: BooleanProperty;

  /** Cached RK4 table for models without a closed form (harvesting). */
  private table: Array<readonly [number, number]> | null = null;
  private tableKey = "";
  private cachedExtinctionTime: number | null = null;

  public constructor() {
    const start = LOGISTIC_DEFAULTS;
    this.modelIdProperty = new StringProperty("logistic", {
      validValues: [...GROWTH_MODEL_IDS],
    });
    this.rProperty = new NumberProperty(start.r.value, { range: new Range(start.r.min, start.r.max) });
    this.kProperty = new NumberProperty(start.K.value, { range: new Range(start.K.min, start.K.max) });
    this.ambientProperty = new NumberProperty(COOLING_DEFAULTS.ambient.value, {
      range: new Range(COOLING_DEFAULTS.ambient.min, COOLING_DEFAULTS.ambient.max),
    });
    this.harvestProperty = new NumberProperty(HARVESTING_DEFAULTS.harvest.value, {
      range: new Range(HARVESTING_DEFAULTS.harvest.min, HARVESTING_DEFAULTS.harvest.max),
    });
    this.y0Property = new NumberProperty(start.y0.value, { range: new Range(start.y0.min, start.y0.max) });
    this.tMaxProperty = new NumberProperty(start.tMax.value, {
      range: new Range(start.tMax.min, start.tMax.max),
    });
    this.showPhaseLineProperty = new BooleanProperty(true);
    this.showEquilibriaProperty = new BooleanProperty(true);
    this.showDirectionFieldProperty = new BooleanProperty(false);

    this.modelIdProperty.link((id) => {
      this.applyDefaults(id as GrowthModelId);
    });

    const invalidate = () => {
      this.table = null;
      this.tableKey = "";
      this.cachedExtinctionTime = null;
    };
    this.rProperty.link(invalidate);
    this.kProperty.link(invalidate);
    this.ambientProperty.link(invalidate);
    this.harvestProperty.link(invalidate);
    this.y0Property.link(invalidate);
    this.tMaxProperty.link(invalidate);
  }

  /** Current growth-model id. */
  public get modelId(): GrowthModelId {
    return this.modelIdProperty.value as GrowthModelId;
  }

  /** Parameter bag for GrowthModels helpers. */
  public get parameters(): GrowthParameters {
    return {
      r: this.rProperty.value,
      K: this.kProperty.value,
      ambient: this.ambientProperty.value,
      harvest: this.harvestProperty.value,
    };
  }

  /** Autonomous RHS f(y). */
  public get rate(): (y: number) => number {
    return growthRate(this.modelId, this.parameters);
  }

  /** Equilibria of the current model. */
  public get equilibria(): Equilibrium[] {
    return growthEquilibria(this.modelId, this.parameters);
  }

  /**
   * Time at which a harvesting solution first reaches y = 0, or null when the
   * population stays positive on [0, tMax] (or the model is not harvesting).
   */
  public get extinctionTime(): number | null {
    this.ensureTable();
    return this.cachedExtinctionTime;
  }

  /**
   * Solution y(t) from t = 0: closed form when available, otherwise linear
   * interpolation of an RK4 table (h = tMax / 600). Harvesting stops at y = 0.
   */
  public solution(t: number): number {
    const closed = growthSolution(this.modelId, this.parameters, this.y0Property.value);
    if (closed !== null) {
      return closed(t);
    }
    this.ensureTable();
    const points = this.table;
    if (points === null) {
      return this.y0Property.value;
    }
    const first = points[0];
    const last = points.at(-1);
    if (first === undefined || last === undefined) {
      return this.y0Property.value;
    }
    if (t <= 0) {
      return first[1];
    }
    if (t >= last[0]) {
      return last[1];
    }
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const next = points[i];
      if (prev === undefined || next === undefined) {
        continue;
      }
      if (t <= next[0]) {
        const span = next[0] - prev[0];
        if (!(span > 0)) {
          return next[1];
        }
        const alpha = (t - prev[0]) / span;
        return prev[1] + alpha * (next[1] - prev[1]);
      }
    }
    return last[1];
  }

  public reset(): void {
    this.showPhaseLineProperty.reset();
    this.showEquilibriaProperty.reset();
    this.showDirectionFieldProperty.reset();
    this.modelIdProperty.reset();
    // Re-apply logistic defaults even when the id was already "logistic".
    this.applyDefaults("logistic");
  }

  public step(_dt: number): void {
    // Static lesson — no animation clock.
  }

  public dispose(): void {
    this.modelIdProperty.dispose();
    this.rProperty.dispose();
    this.kProperty.dispose();
    this.ambientProperty.dispose();
    this.harvestProperty.dispose();
    this.y0Property.dispose();
    this.tMaxProperty.dispose();
    this.showPhaseLineProperty.dispose();
    this.showEquilibriaProperty.dispose();
    this.showDirectionFieldProperty.dispose();
  }

  private applyDefaults(id: GrowthModelId): void {
    const d = DEFAULTS_BY_ID[id];
    setParam(this.rProperty, d.r);
    setParam(this.kProperty, d.K);
    setParam(this.ambientProperty, d.ambient);
    setParam(this.harvestProperty, d.harvest);
    setParam(this.y0Property, d.y0);
    setParam(this.tMaxProperty, d.tMax);
    this.table = null;
    this.tableKey = "";
    this.cachedExtinctionTime = null;
  }

  /**
   * Build (or reuse) the RK4 sample table for harvesting. Closed-form models
   * leave the table null and extinctionTime null.
   */
  private ensureTable(): void {
    if (this.modelId !== "harvesting") {
      this.table = null;
      this.cachedExtinctionTime = null;
      this.tableKey = "";
      return;
    }
    const tMax = this.tMaxProperty.value;
    const y0 = this.y0Property.value;
    const key = `${this.rProperty.value}|${this.kProperty.value}|${this.harvestProperty.value}|${y0}|${tMax}`;
    if (this.table !== null && this.tableKey === key) {
      return;
    }
    this.tableKey = key;
    this.cachedExtinctionTime = null;

    if (!(tMax > 0)) {
      this.table = [[0, y0]];
      return;
    }

    const h = tMax / GROWTH_RK4_DIVISOR;
    const f = this.rate;
    const raw = integrate((_t, y) => f(y), 0, y0, tMax, h, "rk4");
    const clipped = clipAtExtinction(raw);
    this.table = clipped.points.length > 0 ? clipped.points : [[0, y0]];
    this.cachedExtinctionTime = clipped.extinctionTime;

    // Over-harvesting may drive extinction after tMax — keep searching.
    const last = this.table.at(-1);
    if (
      this.cachedExtinctionTime === null &&
      last !== undefined &&
      this.harvestProperty.value > criticalHarvest(this.parameters)
    ) {
      this.cachedExtinctionTime = findExtinctionBeyond(f, last, Math.max(h, 0.01));
    }
  }
}
