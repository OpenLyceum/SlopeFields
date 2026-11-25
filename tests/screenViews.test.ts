/**
 * screenViews.test.ts
 *
 * Constructs each ScreenView in the Vitest DOM environment. Catches the
 * "used `this` before `super()`" mistake that slipped through Phase 4 — a view
 * that touches instance state while building the screen-summary details Property
 * fails here before any browser run.
 */

import { describe, expect, it } from "vitest";
import { EulerModel } from "../src/euler/model/EulerModel.js";
import { EulerScreenView } from "../src/euler/view/EulerScreenView.js";
import { GrowthModelsModel } from "../src/growth-models/model/GrowthModelsModel.js";
import { GrowthModelsScreenView } from "../src/growth-models/view/GrowthModelsScreenView.js";
import { SlopeFieldModel } from "../src/slope-field/model/SlopeFieldModel.js";
import { SlopeFieldScreenView } from "../src/slope-field/view/SlopeFieldScreenView.js";

describe("ScreenViews construct", () => {
  it("SlopeFieldScreenView", () => {
    const view = new SlopeFieldScreenView(new SlopeFieldModel());
    expect(view.plot).toBeDefined();
  });

  it("EulerScreenView", () => {
    const view = new EulerScreenView(new EulerModel());
    expect(view.plot).toBeDefined();
  });

  it("GrowthModelsScreenView", () => {
    const view = new GrowthModelsScreenView(new GrowthModelsModel());
    expect(view.plot).toBeDefined();
  });
});
