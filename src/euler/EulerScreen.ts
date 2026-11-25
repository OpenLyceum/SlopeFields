/**
 * EulerScreen.ts
 *
 * The top-level Screen component. It wires together the model and view
 * factories and passes screen-level options (name, background color, tandem)
 * to the parent Screen class.
 *
 * Registered in the screens array in src/main.ts. Its home-screen and navigation-bar
 * icons come from createEulerIcon() in src/common/SlopeFieldsScreenIcons.ts
 * (see doc/multi-screen.md).
 */
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { createEulerIcon } from "../common/SlopeFieldsScreenIcons.js";
import SlopeFieldsColors from "../SlopeFieldsColors.js";
import { EulerModel } from "./model/EulerModel.js";
import { EulerKeyboardHelpContent } from "./view/EulerKeyboardHelpContent.js";
import { EulerScreenView } from "./view/EulerScreenView.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type EulerScreenOptions = ScreenOptions & { tandem: Tandem };

export class EulerScreen extends Screen<EulerModel, EulerScreenView> {
  public constructor(options: EulerScreenOptions) {
    super(
      () => new EulerModel(),
      (model) => new EulerScreenView(model),
      optionize<EulerScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: SlopeFieldsColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new EulerKeyboardHelpContent(),
          homeScreenIcon: createEulerIcon(),
          navigationBarIcon: createEulerIcon(),
        },
        options,
      ),
    );
  }
}
