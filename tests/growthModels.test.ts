/**
 * growthModels.test.ts
 *
 * Equilibria, closed forms, and characteristic times for growth models.
 */

import { describe, expect, it } from "vitest";
import {
  characteristicTime,
  criticalHarvest,
  type GrowthParameters,
  growthEquilibria,
  growthRate,
  growthSolution,
} from "../src/common/model/GrowthModels.js";
import { integrate } from "../src/common/model/odeSolvers.js";

const base: GrowthParameters = { r: 1, K: 10, ambient: 20, harvest: 0 };

describe("GrowthModels", () => {
  it("classifies logistic, cooling, exponential, and harvesting equilibria", () => {
    const logistic = growthEquilibria("logistic", { ...base, r: 1, K: 10 });
    expect(logistic).toEqual([
      { y: 0, stability: "unstable" },
      { y: 10, stability: "stable" },
    ]);

    const cooling = growthEquilibria("cooling", { ...base, ambient: 20, r: 1 });
    expect(cooling).toEqual([{ y: 20, stability: "stable" }]);

    expect(growthEquilibria("exponential", { ...base, r: 0.5 })).toEqual([{ y: 0, stability: "unstable" }]);
    expect(growthEquilibria("exponential", { ...base, r: -0.5 })).toEqual([{ y: 0, stability: "stable" }]);

    const harvested = growthEquilibria("harvesting", { ...base, r: 1, K: 10, harvest: 1 });
    expect(harvested).toHaveLength(2);
    expect(harvested[0]!.stability).toBe("unstable");
    expect(harvested[1]!.stability).toBe("stable");
    const f = growthRate("harvesting", { ...base, r: 1, K: 10, harvest: 1 });
    expect(f(harvested[0]!.y)).toBeCloseTo(0, 10);
    expect(f(harvested[1]!.y)).toBeCloseTo(0, 10);
  });

  it("harvesting at the critical rate is semistable; above it has no equilibria", () => {
    const pCrit: GrowthParameters = { ...base, r: 1, K: 10, harvest: 2.5 };
    expect(criticalHarvest(pCrit)).toBeCloseTo(2.5);
    const atCrit = growthEquilibria("harvesting", pCrit);
    expect(atCrit).toEqual([{ y: 5, stability: "semistable" }]);

    const above = growthEquilibria("harvesting", { ...pCrit, harvest: 2.6 });
    expect(above).toEqual([]);
  });

  it("closed forms match RK4 within 1e-4 at t = 2", () => {
    const cases: Array<{
      id: "exponential" | "cooling" | "logistic";
      p: GrowthParameters;
      y0: number;
    }> = [
      { id: "exponential", p: { ...base, r: 0.3 }, y0: 2 },
      { id: "cooling", p: { ...base, r: 0.4, ambient: 20 }, y0: 80 },
      { id: "logistic", p: { ...base, r: 0.5, K: 10 }, y0: 1 },
    ];

    for (const { id, p, y0 } of cases) {
      const closed = growthSolution(id, p, y0);
      expect(closed).not.toBeNull();
      const f = growthRate(id, p);
      // Autonomous: treat as y′ = f(y) with dummy x = t.
      const points = integrate((_t, y) => f(y), 0, y0, 2, 0.01, "rk4");
      const last = points.at(-1);
      expect(last).toBeDefined();
      expect(Math.abs(closed!(2) - last![1])).toBeLessThan(1e-4);
    }
  });

  it("characteristicTime reports doubling and half-life correctly", () => {
    const doubling = characteristicTime("exponential", { ...base, r: 0.5 });
    expect(doubling).toEqual({ kind: "doubling", value: Math.LN2 / 0.5 });

    const halfLife = characteristicTime("exponential", { ...base, r: -0.25 });
    expect(halfLife).toEqual({ kind: "halfLife", value: Math.LN2 / 0.25 });

    expect(characteristicTime("exponential", { ...base, r: 0 })).toBeNull();

    const cooling = characteristicTime("cooling", { ...base, r: 0.2 });
    expect(cooling).toEqual({ kind: "halfLife", value: Math.LN2 / 0.2 });

    expect(characteristicTime("logistic", base)).toBeNull();
    expect(characteristicTime("harvesting", base)).toBeNull();
  });
});
