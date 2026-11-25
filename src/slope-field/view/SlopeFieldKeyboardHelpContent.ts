/**
 * SlopeFieldKeyboardHelpContent.ts
 *
 * Keyboard-help dialog for the Slope Field screen: move the initial point,
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

export class SlopeFieldKeyboardHelpContent extends TwoColumnKeyboardHelpContent {
  public constructor() {
    const strings = StringManager.getInstance().getLessonStrings();
    super(
      [
        new MoveDraggableItemsKeyboardHelpSection({
          headingStringProperty: strings.moveInitialPointStringProperty,
        }),
        new SliderControlsKeyboardHelpSection(),
        new ComboBoxKeyboardHelpSection(),
      ],
      [new BasicActionsKeyboardHelpSection()],
    );
  }
}
