/**
 * GrowthModelsKeyboardHelpContent.ts
 *
 * Keyboard-help dialog for Growth Models: move the initial-value handle,
 * slider and combo-box sections, plus basic actions.
 */

import {
  BasicActionsKeyboardHelpSection,
  ComboBoxKeyboardHelpSection,
  MoveDraggableItemsKeyboardHelpSection,
  SliderControlsKeyboardHelpSection,
  TwoColumnKeyboardHelpContent,
} from "scenerystack/scenery-phet";
import { StringManager } from "../../i18n/StringManager.js";

export class GrowthModelsKeyboardHelpContent extends TwoColumnKeyboardHelpContent {
  public constructor() {
    const strings = StringManager.getInstance().getLessonStrings();
    super(
      [
        new MoveDraggableItemsKeyboardHelpSection({
          headingStringProperty: strings.moveY0StringProperty,
        }),
        new SliderControlsKeyboardHelpSection(),
        new ComboBoxKeyboardHelpSection(),
      ],
      [new BasicActionsKeyboardHelpSection()],
    );
  }
}
