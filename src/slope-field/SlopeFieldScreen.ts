/**
 * SlopeFieldScreen.ts
 *
 * The top-level Screen component. It wires together the model and view
 * factories and passes screen-level options (name, background color, tandem)
 * to the parent Screen class.
 *
 * Registered in the screens array in src/main.ts. Its home-screen and navigation-bar
 * icons come from createSlopeFieldIcon() in src/common/SlopeFieldsScreenIcons.ts
 * (see doc/multi-screen.md).
 */
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { createSlopeFieldIcon } from "../common/SlopeFieldsScreenIcons.js";
import SlopeFieldsColors from "../SlopeFieldsColors.js";
import { SlopeFieldModel } from "./model/SlopeFieldModel.js";
import { SlopeFieldKeyboardHelpContent } from "./view/SlopeFieldKeyboardHelpContent.js";
import { SlopeFieldScreenView } from "./view/SlopeFieldScreenView.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type SlopeFieldScreenOptions = ScreenOptions & { tandem: Tandem };

export class SlopeFieldScreen extends Screen<SlopeFieldModel, SlopeFieldScreenView> {
  public constructor(options: SlopeFieldScreenOptions) {
    super(
      // Model factory — called once when the screen is first shown
      () => new SlopeFieldModel(),
      // View factory — receives the model instance
      (model) =>
        new SlopeFieldScreenView(model, {
          tandem: options.tandem.createTandem("view"),
        }),
      optionize<SlopeFieldScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: SlopeFieldsColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new SlopeFieldKeyboardHelpContent(),
          homeScreenIcon: createSlopeFieldIcon(),
          navigationBarIcon: createSlopeFieldIcon(),
        },
        options,
      ),
    );
  }
}
