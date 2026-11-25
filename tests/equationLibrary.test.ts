/**
 * equationLibrary.test.ts
 *
 * Consistency checks for the equation catalog and isocline extraction.
 */

import { describe, expect, it } from "vitest";
import { EQUATIONS, type Equation, equationById, isocline } from "../src/common/model/EquationLibrary.js";
import { integrate } from "../src/common/model/odeSolvers.js";

function assertExactMatchesF(eq: Equation, x0: number, y0: number): void {
  const exact = eq.exact;
  if (exact === undefined) {
    return;
  }
  const sol = exact(x0, y0);
  expect(sol(x0)).toBeCloseTo(y0, 10);

  for (const x of [x0 - 0.2, x0, x0 + 0.2]) {
    const y = sol(x);
    if (!Number.isFinite(y)) {
      continue;
    }
    const h = 1e-5;
    const yPlus = sol(x + h);
    const yMinus = sol(x - h);
    if (!(Number.isFinite(yPlus) && Number.isFinite(yMinus))) {
      continue;
    }
    const approx = (yPlus - yMinus) / (2 * h);
    const slope = eq.f(x, y);
    if (!Number.isFinite(slope)) {
      continue;
    }
    expect(approx).toBeCloseTo(slope, 3);
  }
}

describe("EquationLibrary", () => {
  it("has unique ids and equationById throws on unknown ids", () => {
    const ids = EQUATIONS.map((eq) => eq.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(equationById(id).id).toBe(id);
    }
    expect(() => equationById("no-such-equation")).toThrow();
  });

  it("exact solutions pass through (x0, y0) and match f via finite differences", () => {
    const samples = [
      { x0: 0.5, y0: 1.2 },
      { x0: -0.7, y0: 0.8 },
      { x0: 1.1, y0: -0.5 },
    ];

    for (const eq of EQUATIONS) {
      if (eq.exact === undefined) {
        continue;
      }
      // Circle needs y0 ≠ 0; pick a safe IC for that equation.
      const ics = eq.id === "circle" ? [{ x0: 1, y0: 2 }] : samples;
      for (const { x0, y0 } of ics) {
        assertExactMatchesF(eq, x0, y0);
      }
    }
  });

  it("RK4 traces agree with exact solutions within 1e-4 over a short interval", () => {
    for (const eq of EQUATIONS) {
      if (eq.exact === undefined) {
        continue;
      }
      const x0 = eq.id === "circle" ? 0.5 : 0;
      const y0 = eq.id === "circle" ? 1.5 : 1;
      const sol = eq.exact(x0, y0);
      const points = integrate(eq.f, x0, y0, x0 + 0.2, 0.01, "rk4", eq.domain);
      for (const [x, y] of points) {
        const exactY = sol(x);
        if (!Number.isFinite(exactY)) {
          continue;
        }
        expect(Math.abs(y - exactY)).toBeLessThan(1e-4);
      }
    }
  });

  it("listed equilibria satisfy f(x, c) = 0 at several x", () => {
    for (const eq of EQUATIONS) {
      for (const c of eq.equilibria) {
        for (const x of [-2, -1, 0, 1, 2]) {
          expect(eq.f(x, c)).toBeCloseTo(0, 12);
        }
      }
    }
  });

  it("isocline for y′ = x − y with c = 0 has points near the line x = y", () => {
    const eq = equationById("xMinusY");
    const pieces = isocline(eq, 0, eq.domain, 80);
    expect(pieces.length).toBeGreaterThan(0);
    let checked = 0;
    for (const poly of pieces) {
      for (const [x, y] of poly) {
        expect(Math.abs(x - y)).toBeLessThan(0.05);
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(10);
  });
});
