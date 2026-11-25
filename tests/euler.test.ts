/**
 * euler.test.ts
 *
 * Unit tests for EulerModel: Euler values, shortened final step, error
 * ratios, playback stepping, and equation-start restoration.
 */

import { describe, expect, it } from "vitest";
import { EULER_STARTS, EulerModel, stepCount } from "../src/euler/model/EulerModel.js";
import { PLAY_STEP_INTERVAL, STEP_SIZE_PRESETS } from "../src/SlopeFieldsConstants.js";

describe("EulerModel", () => {
  it("y′ = y from (0,1) to xEnd = 1 matches classic Euler values", () => {
    const model = new EulerModel();
    expect(model.equationIdProperty.value).toBe("y");
    expect(model.x0Property.value).toBe(0);
    expect(model.y0Property.value).toBe(1);
    model.xEndProperty.value = 1;

    model.stepSizeProperty.value = 0.1;
    expect(model.eulerPoints("euler").at(-1)![1]).toBeCloseTo(1.1 ** 10, 9);

    model.stepSizeProperty.value = 0.5;
    expect(model.eulerPoints("euler").at(-1)![1]).toBeCloseTo(2.25, 9);

    model.stepSizeProperty.value = 1;
    expect(model.eulerPoints("euler").at(-1)![1]).toBeCloseTo(2, 9);
  });

  it("N and the shortened final step: x0 = 0, xEnd = 1, h = 0.3 → N = 4 and x_N = 1", () => {
    const model = new EulerModel();
    model.x0Property.value = 0;
    model.y0Property.value = 1;
    model.xEndProperty.value = 1;
    model.stepSizeProperty.value = 0.3;

    expect(stepCount(0, 1, 0.3)).toBe(4);
    expect(model.totalSteps).toBe(4);
    const points = model.eulerPoints("euler");
    expect(points).toHaveLength(5);
    expect(points.at(-1)![0]).toBe(1);
  });

  it("halving h roughly halves Euler error and quarters Heun error", () => {
    const model = new EulerModel();
    model.x0Property.value = 0;
    model.y0Property.value = 1;
    model.xEndProperty.value = 1;

    model.stepSizeProperty.value = 0.1;
    const euler01 = model.globalError("euler");
    const heun01 = model.globalError("heun");

    model.stepSizeProperty.value = 0.05;
    const euler005 = model.globalError("euler");
    const heun005 = model.globalError("heun");

    expect(euler01 / euler005).toBeGreaterThanOrEqual(1.8);
    expect(euler01 / euler005).toBeLessThanOrEqual(2.2);
    expect(heun01 / heun005).toBeGreaterThanOrEqual(3.5);
    expect(heun01 / heun005).toBeLessThanOrEqual(4.5);
  });

  it("changing h resets stepsTaken; play advances one step per 0.4 s and stops at N", () => {
    const model = new EulerModel();
    model.xEndProperty.value = 1;
    model.stepSizeProperty.value = 0.5;
    expect(model.totalSteps).toBe(2);

    model.stepForward();
    expect(model.stepsTakenProperty.value).toBe(1);

    model.stepSizeProperty.value = 0.25;
    expect(model.stepsTakenProperty.value).toBe(0);
    expect(model.totalSteps).toBe(4);

    model.isPlayingProperty.value = true;
    model.step(PLAY_STEP_INTERVAL - 0.01);
    expect(model.stepsTakenProperty.value).toBe(0);

    model.step(0.02);
    expect(model.stepsTakenProperty.value).toBe(1);

    model.step(PLAY_STEP_INTERVAL);
    expect(model.stepsTakenProperty.value).toBe(2);

    model.step(PLAY_STEP_INTERVAL);
    expect(model.stepsTakenProperty.value).toBe(3);

    model.step(PLAY_STEP_INTERVAL);
    expect(model.stepsTakenProperty.value).toBe(4);
    expect(model.isPlayingProperty.value).toBe(false);

    model.step(PLAY_STEP_INTERVAL);
    expect(model.stepsTakenProperty.value).toBe(4);
  });

  it("halveStep from 0.1 gives 0.05 and from 0.05 stays 0.05", () => {
    const model = new EulerModel();
    model.stepSizeProperty.value = 0.1;
    model.halveStep();
    expect(model.stepSizeProperty.value).toBeCloseTo(0.05, 12);

    model.halveStep();
    expect(model.stepSizeProperty.value).toBeCloseTo(0.05, 12);
  });

  it("equation change restores EULER_STARTS values", () => {
    const model = new EulerModel();
    model.x0Property.value = 1;
    model.y0Property.value = 2;
    model.xEndProperty.value = 2.5;

    model.equationIdProperty.value = "logistic";
    expect(model.x0Property.value).toBeCloseTo(EULER_STARTS["logistic"]?.x0 ?? Number.NaN);
    expect(model.y0Property.value).toBeCloseTo(EULER_STARTS["logistic"]?.y0 ?? Number.NaN);
    expect(model.xEndProperty.value).toBeCloseTo(EULER_STARTS["logistic"]?.xEnd ?? Number.NaN);
    expect(model.stepsTakenProperty.value).toBe(0);

    model.equationIdProperty.value = "sinX";
    expect(model.x0Property.value).toBeCloseTo(EULER_STARTS["sinX"]?.x0 ?? Number.NaN);
    expect(model.y0Property.value).toBeCloseTo(EULER_STARTS["sinX"]?.y0 ?? Number.NaN);
    expect(model.xEndProperty.value).toBeCloseTo(EULER_STARTS["sinX"]?.xEnd ?? Number.NaN);
  });
});

describe("step-size presets", () => {
  it("halving from every preset lands on the next preset", () => {
    const model = new EulerModel();
    for (let i = 0; i < STEP_SIZE_PRESETS.length - 1; i++) {
      model.stepSizeProperty.value = STEP_SIZE_PRESETS[i] ?? 0;
      model.halveStep();
      expect(model.stepSizeProperty.value).toBe(STEP_SIZE_PRESETS[i + 1]);
    }
  });
});
