/**
 * SlopeFieldsPreferencesNode.ts
 *
 * Custom preferences UI shown in Preferences → Simulation. Add controls here
 * when the sim gains sim-specific preferences. The empty shell still wraps content
 * in SlopeFieldsPanel so the shared panel toolkit stays reachable.
 */
import { VBox } from "scenerystack/scenery";
import type { Tandem } from "scenerystack/tandem";
import { SlopeFieldsPanel } from "../common/SlopeFieldsPanel.js";
import SlopeFieldsNamespace from "../SlopeFieldsNamespace.js";
import type { SlopeFieldsPreferencesModel } from "./SlopeFieldsPreferencesModel.js";

export class SlopeFieldsPreferencesNode extends VBox {
  public constructor(_preferencesModel: SlopeFieldsPreferencesModel, _tandem?: Tandem) {
    // Pattern for a preference control (skill: scenerystack-preferences). The dialog is
    // always white, so use the controlSurface colors, not textColorProperty.
    //
    //   const prefStrings = StringManager.getInstance().getPreferences();
    //   const showGridCheckbox = new Checkbox(
    //     preferencesModel.showGridProperty,
    //     new Text(prefStrings.showGridStringProperty, {
    //       font: new PhetFont(14),
    //       fill: SlopeFieldsColors.controlSurfaceTextColorProperty,
    //     }),
    //     {
    //       // Shared slider / NumberControl / checkbox bundles live in SlopeFieldsControlOptions.ts:
    //       // copy the template's src/common/*ControlOptions.ts and apply the SlopeFields prefix.
    //       checkboxColor: SlopeFieldsColors.controlSurfaceTextColorProperty,
    //       checkboxColorBackground: SlopeFieldsColors.controlSurfaceColorProperty,
    //       ...(tandem && { tandem: tandem.createTandem("showGridCheckbox") }),
    //     },
    //   );
    //
    // Add showGridCheckbox to the content children below.
    const content = new VBox({
      align: "left",
      spacing: 12,
      children: [],
    });
    // Transparent / borderless so the Preferences dialog stays visually empty.
    const panel = new SlopeFieldsPanel(content, {
      fill: "transparent",
      stroke: null,
      xMargin: 0,
      yMargin: 0,
    });
    super({
      align: "left",
      spacing: 12,
      children: [panel],
    });
  }
}

SlopeFieldsNamespace.register("SlopeFieldsPreferencesNode", SlopeFieldsPreferencesNode);
