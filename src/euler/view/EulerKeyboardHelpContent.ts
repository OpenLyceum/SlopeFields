/**
 * EulerKeyboardHelpContent.ts
 *
 * Keyboard-help dialog for Euler's Method: move the start point and xEnd
 * handle, combo-box section, plus basic actions.
 */

import {
  BasicActionsKeyboardHelpSection,
  ComboBoxKeyboardHelpSection,
  MoveDraggableItemsKeyboardHelpSection,
  TwoColumnKeyboardHelpContent,
} from "scenerystack/scenery-phet";
import { StringManager } from "../../i18n/StringManager.js";

export class EulerKeyboardHelpContent extends TwoColumnKeyboardHelpContent {
  public constructor() {
    const strings = StringManager.getInstance().getLessonStrings();
    super(
      [
        new MoveDraggableItemsKeyboardHelpSection({
          headingStringProperty: strings.moveStartPointStringProperty,
        }),
        new MoveDraggableItemsKeyboardHelpSection({
          headingStringProperty: strings.moveXEndStringProperty,
        }),
        new ComboBoxKeyboardHelpSection(),
      ],
      [new BasicActionsKeyboardHelpSection()],
    );
  }
}
