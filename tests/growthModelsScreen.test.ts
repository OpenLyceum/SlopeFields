/**
 * growthModelsScreen.test.ts
 *
 * Unit tests for GrowthModelsModel: defaults on model switch / reset,
 * solution evaluation, harvesting extinction, and RK4 agreement.
 */

import { describe, expect, it } from "vitest";
import { integrate } from "../src/common/model/odeSolvers.js";
import { GrowthModelsModel } from "../src/growth-models/model/GrowthModelsModel.js";
import {
  COOLING_DEFAULTS,
  EXPONENTIAL_DEFAULTS,
  GROWTH_RK4_DIVISOR,
  HARVESTING_DEFAULTS,
  LOGISTIC_DEFAULTS,
} from "../src/SlopeFieldsConstants.js";

describe("GrowthModelsModel", () => {
  it("model switch restores that model's defaults; reset restores logistic", () => {
    const model = new GrowthModelsModel();
    expect(model.modelIdProperty.value).toBe("logistic");
    expect(model.rProperty.value).toBe(LOGISTIC_DEFAULTS.r.value);
    expect(model.kProperty.value).toBe(LOGISTIC_DEFAULTS.K.value);
    expect(model.y0Property.value).toBe(LOGISTIC_DEFAULTS.y0.value);
    expect(model.tMaxProperty.value).toBe(LOGISTIC_DEFAULTS.tMax.value);

    model.modelIdProperty.value = "exponential";
    expect(model.rProperty.value).toBe(EXPONENTIAL_DEFAULTS.r.value);
    expect(model.y0Property.value).toBe(EXPONENTIAL_DEFAULTS.y0.value);
    expect(model.tMaxProperty.value).toBe(EXPONENTIAL_DEFAULTS.tMax.value);

    model.modelIdProperty.value = "cooling";
    expect(model.rProperty.value).toBe(COOLING_DEFAULTS.r.value);
    expect(model.ambientProperty.value).toBe(COOLING_DEFAULTS.ambient.value);
    expect(model.y0Property.value).toBe(COOLING_DEFAULTS.y0.value);
    expect(model.tMaxProperty.value).toBe(COOLING_DEFAULTS.tMax.value);

    model.modelIdProperty.value = "harvesting";
    expect(model.rProperty.value).toBe(HARVESTING_DEFAULTS.r.value);
    expect(model.kProperty.value).toBe(HARVESTING_DEFAULTS.K.value);
    expect(model.harvestProperty.value).toBe(HARVESTING_DEFAULTS.harvest.value);
    expect(model.y0Property.value).toBe(HARVESTING_DEFAULTS.y0.value);

    model.rProperty.value = 1.5;
    model.y0Property.value = 12;
    model.reset();
    expect(model.modelIdProperty.value).toBe("logistic");
    expect(model.rProperty.value).toBe(LOGISTIC_DEFAULTS.r.value);
    expect(model.kProperty.value).toBe(LOGISTIC_DEFAULTS.K.value);
    expect(model.y0Property.value).toBe(LOGISTIC_DEFAULTS.y0.value);
    expect(model.tMaxProperty.value).toBe(LOGISTIC_DEFAULTS.tMax.value);
    expect(model.showPhaseLineProperty.value).toBe(true);
    expect(model.showEquilibriaProperty.value).toBe(true);
    expect(model.showDirectionFieldProperty.value).toBe(false);
  });

  it("solution(0) = y0 for every model; logistic approaches K", () => {
    const model = new GrowthModelsModel();
    for (const id of ["exponential", "cooling", "logistic", "harvesting"] as const) {
      model.modelIdProperty.value = id;
      expect(model.solution(0)).toBeCloseTo(model.y0Property.value, 10);
    }

    model.modelIdProperty.value = "logistic";
    // Defaults: r = 0.8, K = 10, y0 = 1, tMax = 15.
    expect(Math.abs(model.solution(15) - model.kProperty.value)).toBeLessThan(0.05);
  });

  it("harvesting with H > rK/4 has no equilibria and a finite extinction time", () => {
    const model = new GrowthModelsModel();
    model.modelIdProperty.value = "harvesting";
    model.rProperty.value = 1;
    model.kProperty.value = 10;
    model.y0Property.value = 8;
    model.harvestProperty.value = 2.6;
    model.tMaxProperty.value = 15;

    expect(model.equilibria).toEqual([]);
    const tExt = model.extinctionTime;
    expect(tExt).not.toBeNull();
    expect(tExt!).toBeGreaterThan(0);
    expect(Number.isFinite(tExt!)).toBe(true);

    model.harvestProperty.value = 1;
    expect(model.extinctionTime).toBeNull();
  });

  it("harvesting numerical solution matches odeSolvers.integrate within 1e-6", () => {
    const model = new GrowthModelsModel();
    model.modelIdProperty.value = "harvesting";
    model.rProperty.value = 1;
    model.kProperty.value = 10;
    model.y0Property.value = 8;
    model.harvestProperty.value = 1;
    model.tMaxProperty.value = 15;

    const f = model.rate;
    const h = model.tMaxProperty.value / GROWTH_RK4_DIVISOR;
    const points = integrate((_t, y) => f(y), 0, model.y0Property.value, model.tMaxProperty.value, h, "rk4");

    for (const t of [0, 1, 3, 7, 12, 15]) {
      const fromModel = model.solution(t);
      // Interpolate the direct integrate table the same way.
      let fromIntegrate = points[points.length - 1]![1];
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1]!;
        const next = points[i]!;
        if (t <= next[0]) {
          const span = next[0] - prev[0];
          fromIntegrate = span > 0 ? prev[1] + ((t - prev[0]) / span) * (next[1] - prev[1]) : next[1];
          break;
        }
      }
      if (t === 0) {
        fromIntegrate = points[0]![1];
      }
      expect(Math.abs(fromModel - fromIntegrate)).toBeLessThan(1e-6);
    }
  });
});
