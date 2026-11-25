/**
 * GrowthModelsScreen.ts
 *
 * The top-level Screen component. It wires together the model and view
 * factories and passes screen-level options (name, background color, tandem)
 * to the parent Screen class.
 *
 * Registered in the screens array in src/main.ts. Its home-screen and navigation-bar
 * icons come from createGrowthModelsIcon() in src/common/SlopeFieldsScreenIcons.ts
 * (see doc/multi-screen.md).
 */
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { createGrowthModelsIcon } from "../common/SlopeFieldsScreenIcons.js";
import SlopeFieldsColors from "../SlopeFieldsColors.js";
import { GrowthModelsModel } from "./model/GrowthModelsModel.js";
import { GrowthModelsKeyboardHelpContent } from "./view/GrowthModelsKeyboardHelpContent.js";
import { GrowthModelsScreenView } from "./view/GrowthModelsScreenView.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type GrowthModelsScreenOptions = ScreenOptions & { tandem: Tandem };

export class GrowthModelsScreen extends Screen<GrowthModelsModel, GrowthModelsScreenView> {
  public constructor(options: GrowthModelsScreenOptions) {
    super(
      () => new GrowthModelsModel(),
      (model) => new GrowthModelsScreenView(model),
      optionize<GrowthModelsScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: SlopeFieldsColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new GrowthModelsKeyboardHelpContent(),
          homeScreenIcon: createGrowthModelsIcon(),
          navigationBarIcon: createGrowthModelsIcon(),
        },
        options,
      ),
    );
  }
}
