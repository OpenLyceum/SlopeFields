/**
 * SlopeFieldModel.ts
 *
 * The top-level model for the Slope Field screen.
 * Phase 1: stub only — Properties and equation wiring land in Phase 2.
 */
import type { TModel } from "scenerystack/joist";

export class SlopeFieldModel implements TModel {
  /**
   * Resets all model state to initial values.
   * Called when the user presses the Reset All button.
   */
  public reset(): void {
    // Phase 2: reset equation / IC / display Properties.
  }

  /**
   * Steps the model forward by dt seconds.
   * Called every animation frame by the Sim framework.
   *
   * @param _dt - elapsed time in seconds since the last frame
   */
  public step(_dt: number): void {
    // Slope field is static; no per-frame advance in Phase 1.
  }

  /** Release owned Properties / composed models. */
  public dispose(): void {
    // No resources yet.
  }
}
