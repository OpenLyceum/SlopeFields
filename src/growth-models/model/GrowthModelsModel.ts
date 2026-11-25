/**
 * GrowthModelsModel.ts
 *
 * The top-level model for the Growth Models screen.
 * Phase 1: stub only — growth-parameter Properties land in Phase 4.
 */
import type { TModel } from "scenerystack/joist";
import { GROWTH_MODEL_IDS, type GrowthModelId } from "../../common/model/GrowthModels.js";

export class GrowthModelsModel implements TModel {
  /** Catalog ids kept reachable until Phase 4 wires a Property. */
  public readonly modelIds: readonly GrowthModelId[] = GROWTH_MODEL_IDS;

  /**
   * Resets all model state to initial values.
   * Called when the user presses the Reset All button.
   */
  public reset(): void {
    // Phase 4: reset growth-model / parameter Properties.
  }

  /**
   * Steps the model forward by dt seconds.
   * Called every animation frame by the Sim framework.
   *
   * @param _dt - elapsed time in seconds since the last frame
   */
  public step(_dt: number): void {
    // Phase 4: advance time when the growth animation is playing.
  }

  /** Release owned Properties / composed models. */
  public dispose(): void {
    // No resources yet.
  }
}
