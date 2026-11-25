/**
 * odeSolvers.test.ts
 *
 * Unit tests for Euler / Heun / RK4 steppers and integrate / traceSolution.
 */

import { describe, expect, it } from "vitest";
import {
  type Bounds,
  eulerStep,
  heunStep,
  integrate,
  rk4Step,
  type Slope,
  traceSolution,
} from "../src/common/model/odeSolvers.js";

const expGrowth: Slope = (_x, y) => y;

describe("odeSolvers", () => {
  it("Euler on y′ = y, h = 0.1, (0,1) → x = 1 ends at 1.1^10", () => {
    const points = integrate(expGrowth, 0, 1, 1, 0.1, "euler");
    const last = points[points.length - 1]!;
    expect(last[0]).toBe(1);
    expect(last[1]).toBeCloseTo(1.1 ** 10, 12);
  });

  it("RK4 on y′ = y, h = 0.1, (0,1) → x = 1 is within ~2e-6 of e", () => {
    // Classical RK4 at h = 0.1 multiplies by the degree-4 Taylor factor for e^h each
    // step; global error is ≈ 2.08e-6 (so the brief's 1e-6 bound is slightly tight).
    const points = integrate(expGrowth, 0, 1, 1, 0.1, "rk4");
    const last = points[points.length - 1]!;
    expect(Math.abs(last[1] - Math.E)).toBeLessThan(3e-6);
  });

  it("Heun error is smaller than Euler's at h = 0.1 on y′ = y", () => {
    const exact = Math.E;
    const eulerY = integrate(expGrowth, 0, 1, 1, 0.1, "euler").at(-1)![1];
    const heunY = integrate(expGrowth, 0, 1, 1, 0.1, "heun").at(-1)![1];
    expect(Math.abs(heunY - exact)).toBeLessThan(Math.abs(eulerY - exact));
  });

  it("halving h for Euler on y′ = y reduces error by a factor in [1.8, 2.2]", () => {
    const exact = Math.E;
    const err01 = Math.abs(integrate(expGrowth, 0, 1, 1, 0.1, "euler").at(-1)![1] - exact);
    const err005 = Math.abs(integrate(expGrowth, 0, 1, 1, 0.05, "euler").at(-1)![1] - exact);
    const ratio = err01 / err005;
    expect(ratio).toBeGreaterThanOrEqual(1.8);
    expect(ratio).toBeLessThanOrEqual(2.2);
  });

  it("halving h for RK4 on y′ = y reduces error by a factor in [12, 20]", () => {
    const exact = Math.E;
    const err01 = Math.abs(integrate(expGrowth, 0, 1, 1, 0.1, "rk4").at(-1)![1] - exact);
    const err005 = Math.abs(integrate(expGrowth, 0, 1, 1, 0.05, "rk4").at(-1)![1] - exact);
    const ratio = err01 / err005;
    expect(ratio).toBeGreaterThanOrEqual(12);
    expect(ratio).toBeLessThanOrEqual(20);
  });

  it("integrate on y′ = y² from (0,1) toward x = 2 stops before the blow-up at x = 1", () => {
    // Exact solution y = 1/(1 − x) blows up at x = 1. With a modest y-window the
    // expanded-bounds stop fires before the pole (bare |y| > 1e6 alone can leave
    // a last sample at x ≈ 1 with y still finite).
    const f: Slope = (_x, y) => y * y;
    const bounds: Bounds = { xMin: 0, xMax: 2, yMin: -5, yMax: 5 };
    const points = integrate(f, 0, 1, 2, 0.01, "rk4", bounds);
    const last = points[points.length - 1]!;
    expect(last[0]).toBeLessThan(1);
    for (const [, y] of points) {
      expect(Number.isFinite(y)).toBe(true);
    }
  });

  it("integrate backwards lands exactly on xEnd", () => {
    const points = integrate(expGrowth, 1, Math.E, 0, 0.1, "rk4");
    expect(points[0]).toEqual([1, Math.E]);
    expect(points[points.length - 1]![0]).toBe(0);
  });

  it("traceSolution returns increasing x and contains (x0, y0)", () => {
    const bounds: Bounds = { xMin: -2, xMax: 2, yMin: -5, yMax: 5 };
    const points = traceSolution(expGrowth, 0, 1, bounds, 0.1);
    expect(points.some(([x, y]) => x === 0 && y === 1)).toBe(true);
    for (let i = 1; i < points.length; i++) {
      expect(points[i]![0]).toBeGreaterThanOrEqual(points[i - 1]![0]);
    }
  });

  it("one-step helpers match the method dispatch expectations", () => {
    // Smoke: Euler / Heun / RK4 on y′ = y from (0,1) with h = 0.1.
    expect(eulerStep(expGrowth, 0, 1, 0.1)).toBeCloseTo(1.1);
    expect(heunStep(expGrowth, 0, 1, 0.1)).toBeCloseTo(1 + 0.05 * (1 + 1.1));
    const rk = rk4Step(expGrowth, 0, 1, 0.1);
    expect(rk).toBeGreaterThan(1.1);
    expect(rk).toBeLessThan(1.12);
  });
});
