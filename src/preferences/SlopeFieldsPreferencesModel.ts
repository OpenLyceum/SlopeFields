/**
 * SlopeFieldsPreferencesModel.ts
 *
 * Model for the simulation-specific preferences shown in Preferences →
 * Simulation. Keep this empty shell until the sim needs real preferences; the
 * optional tandem keeps main.ts wiring uniform.
 */
import type { Tandem } from "scenerystack/tandem";
import SlopeFieldsNamespace from "../SlopeFieldsNamespace.js";
import "./slopeFieldsQueryParameters.js";

export class SlopeFieldsPreferencesModel {
  // Pattern for a preference (skill: scenerystack-preferences). Every preference is
  // one chain: query parameter → Property here → label in every strings_*.json →
  // control in SlopeFieldsPreferencesNode → reset() below.
  //
  //   import { BooleanProperty } from "scenerystack/axon";
  //   import slopeFieldsQueryParameters from "./slopeFieldsQueryParameters.js"; // replaces the bare import
  //
  //   public readonly showGridProperty: BooleanProperty;
  //
  //   // in the constructor (rename _tandem → tandem):
  //   this.showGridProperty = new BooleanProperty(
  //     slopeFieldsQueryParameters.showGrid,
  //     tandem ? { tandem: tandem.createTandem("showGridProperty") } : undefined,
  //   );
  //
  //   // in reset():
  //   this.showGridProperty.reset();

  public constructor(_tandem?: Tandem) {
    // Attach preference Properties under this tandem when added.
  }

  public reset(): void {
    // No sim-specific preferences yet.
  }
}

SlopeFieldsNamespace.register("SlopeFieldsPreferencesModel", SlopeFieldsPreferencesModel);
