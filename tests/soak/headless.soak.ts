/**
 * By-hand headless soak: npm run test:soak:headless (never in CI).
 *
 * List the screens exactly as main.ts builds them. The harness in
 * tests/helpers/headlessSoak.ts (template-owned) presses every control, sets every slider,
 * steps, switches screens, flips the color profile and locale, presses Reset All, and
 * fails when listener counts, node counts or retained heap rise after every round.
 *
 * Add `actions` for what only this sim can do (record/clear, add/remove objects) and
 * `exclude` for controls that must not be pressed headless.
 */

import { StringProperty } from "scenerystack/axon";
import { Tandem } from "scenerystack/tandem";
import { EulerScreen } from "../../src/euler/EulerScreen.js";
import { GrowthModelsScreen } from "../../src/growth-models/GrowthModelsScreen.js";
import SlopeFieldsColors from "../../src/SlopeFieldsColors.js";
import { SlopeFieldScreen } from "../../src/slope-field/SlopeFieldScreen.js";
import { describeHeadlessSoak } from "../helpers/headlessSoak.js";

describeHeadlessSoak({
  screens: () => [
    new SlopeFieldScreen({ name: new StringProperty("Slope Field"), tandem: Tandem.OPT_OUT }),
    new EulerScreen({ name: new StringProperty("Euler"), tandem: Tandem.OPT_OUT }),
    new GrowthModelsScreen({ name: new StringProperty("Growth Models"), tandem: Tandem.OPT_OUT }),
  ],
  tracked: () => ({ SlopeFieldsColors }),
});
