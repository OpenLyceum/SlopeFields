/**
 * slopeField.test.ts
 *
 * Unit tests for SlopeFieldModel: equation changes, pinned curves, reset,
 * and currentSolution behavior.
 */

import { Vector2 } from "scenerystack/dot";
import { describe, expect, it } from "vitest";
import {
  DENSITY_DEFAULT,
  INITIAL_POINT_DEFAULT,
  MAX_PINNED_CURVES,
  SEGMENT_SCALE_DEFAULT,
} from "../src/SlopeFieldsConstants.js";
import { SlopeFieldModel } from "../src/slope-field/model/SlopeFieldModel.js";

describe("SlopeFieldModel", () => {
  it("equation change clears pinned curves and keeps an in-domain initial point", () => {
    const model = new SlopeFieldModel();
    model.initialPointProperty.value = new Vector2(1, 0.5);
    model.keepCurve();
    expect(model.pinnedCurves.length).toBe(1);

    model.equationIdProperty.value = "y";
    expect(model.pinnedCurves.length).toBe(0);
    // (1, 0.5) is inside y′ = y's domain [−3,3]×[−4,4]
    expect(model.initialPointProperty.value.x).toBeCloseTo(1);
    expect(model.initialPointProperty.value.y).toBeCloseTo(0.5);
  });

  it("equation change clamps an out-of-domain initial point to (0, yMid)", () => {
    const model = new SlopeFieldModel();
    // logistic domain y ∈ [−1, 2]; move to a point that riccati ([−3,3]²) still holds…
    model.initialPointProperty.value = new Vector2(0, 1.5);
    // …then switch to circle ([−4,4]²) — still in — then to a domain that excludes it.
    model.equationIdProperty.value = "riccati";
    // riccati y ∈ [−3, 3], so 1.5 is fine
    expect(model.initialPointProperty.value.y).toBeCloseTo(1.5);

    model.initialPointProperty.value = new Vector2(0, 2.5);
    model.equationIdProperty.value = "logistic";
    // logistic yMax = 2, so 2.5 is out → (0, yMid) = (0, 0.5)
    expect(model.initialPointProperty.value.x).toBeCloseTo(0);
    expect(model.initialPointProperty.value.y).toBeCloseTo(0.5);
  });

  it(`keepCurve caps at ${MAX_PINNED_CURVES} and drops the oldest`, () => {
    const model = new SlopeFieldModel();
    for (let i = 0; i < MAX_PINNED_CURVES + 2; i++) {
      model.initialPointProperty.value = new Vector2(0, 0.1 * (i + 1));
      model.keepCurve();
    }
    expect(model.pinnedCurves.length).toBe(MAX_PINNED_CURVES);
    expect(model.pinnedCurves[0]?.y0).toBeCloseTo(0.3);
    expect(model.pinnedCurves[MAX_PINNED_CURVES - 1]?.y0).toBeCloseTo(0.1 * (MAX_PINNED_CURVES + 2));
  });

  it("reset restores defaults", () => {
    const model = new SlopeFieldModel();
    model.equationIdProperty.value = "riccati";
    model.initialPointProperty.value = new Vector2(1, 1);
    model.densityProperty.value = 11;
    model.segmentScaleProperty.value = 0.4;
    model.showIsoclineProperty.value = true;
    model.isoclineSlopeProperty.value = 1.5;
    model.showEquilibriaProperty.value = false;
    model.showExactProperty.value = true;
    model.keepCurve();

    model.reset();

    expect(model.equationIdProperty.value).toBe("logistic");
    expect(model.initialPointProperty.value.x).toBeCloseTo(INITIAL_POINT_DEFAULT.x);
    expect(model.initialPointProperty.value.y).toBeCloseTo(INITIAL_POINT_DEFAULT.y);
    expect(model.densityProperty.value).toBe(DENSITY_DEFAULT);
    expect(model.segmentScaleProperty.value).toBe(SEGMENT_SCALE_DEFAULT);
    expect(model.showIsoclineProperty.value).toBe(false);
    expect(model.isoclineSlopeProperty.value).toBe(0);
    expect(model.showEquilibriaProperty.value).toBe(true);
    expect(model.showExactProperty.value).toBe(false);
    expect(model.pinnedCurves.length).toBe(0);
  });

  it("currentSolution passes through the initial point", () => {
    const model = new SlopeFieldModel();
    model.initialPointProperty.value = new Vector2(0.5, 0.25);
    const points = model.currentSolution;
    const hit = points.some(([x, y]) => Math.abs(x - 0.5) < 1e-9 && Math.abs(y - 0.25) < 1e-9);
    expect(hit).toBe(true);
  });

  it("logistic with y0 = 0.5 stays strictly between 0 and 1", () => {
    const model = new SlopeFieldModel();
    model.equationIdProperty.value = "logistic";
    model.initialPointProperty.value = new Vector2(0, 0.5);
    for (const [, y] of model.currentSolution) {
      expect(y).toBeGreaterThan(0);
      expect(y).toBeLessThan(1);
    }
  });
});
