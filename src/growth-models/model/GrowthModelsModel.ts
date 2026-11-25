/**
 * GrowthModelsModel.ts
 *
 * The top-level model for the Growth Models screen.
 * Phase 1: stub only — growth-parameter Properties land in Phase 4.
 */
import type { TModel } from "scenerystack/joist";

export class GrowthModelsModel implements TModel {
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
