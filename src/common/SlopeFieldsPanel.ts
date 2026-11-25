/**
 * SlopeFieldsPanel.ts
 *
 * A pre-themed Panel that automatically uses SlopeFieldsColors for background and
 * border. Use this for all control panels and info boxes in the sim so that
 * default / projector mode switching is handled automatically.
 *
 * ── Basic usage ───────────────────────────────────────────────────────────────
 *
 *   import { SlopeFieldsPanel } from "../../common/SlopeFieldsPanel.js";
 *   import { VBox, Text } from "scenerystack/scenery";
 *
 *   const content = new VBox({
 *     children: [ new Text("label"), slider ],
 *     spacing: 8,
 *   });
 *   const panel = new SlopeFieldsPanel(content);
 *
 * ── Overriding defaults ───────────────────────────────────────────────────────
 *
 *   // Wider margins, sharper corners, custom stroke
 *   const panel = new SlopeFieldsPanel(content, { xMargin: 20, cornerRadius: 0 });
 *
 *   // Transparent background (decorative border only)
 *   const panel = new SlopeFieldsPanel(content, { fill: "transparent" });
 */

import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { Node } from "scenerystack/scenery";
import { Panel, type PanelOptions } from "scenerystack/sun";
import SlopeFieldsColors from "../SlopeFieldsColors.js";
import { PANEL_CORNER_RADIUS } from "../SlopeFieldsConstants.js";

/** @public */
export type SlopeFieldsPanelOptions = PanelOptions;

/** Pre-themed Panel wrapper for control panels and info boxes. @public */
export class SlopeFieldsPanel extends Panel {
  public constructor(content: Node, providedOptions?: SlopeFieldsPanelOptions) {
    const options = optionize<SlopeFieldsPanelOptions, EmptySelfOptions, PanelOptions>()(
      {
        fill: SlopeFieldsColors.panelBackgroundColorProperty,
        stroke: SlopeFieldsColors.panelBorderColorProperty,
        cornerRadius: PANEL_CORNER_RADIUS,
        xMargin: 12,
        yMargin: 10,
      },
      providedOptions,
    );
    super(content, options);
  }
}
