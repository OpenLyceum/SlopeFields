/**
 * EulerModel.ts
 *
 * The top-level model for the Euler's Method screen.
 * Phase 1: stub only — stepper state lands in Phase 3.
 */
import type { TModel } from "scenerystack/joist";

export class EulerModel implements TModel {
  /**
   * Resets all model state to initial values.
   * Called when the user presses the Reset All button.
   */
  public reset(): void {
    // Phase 3: reset method / step-size / IC Properties.
  }

  /**
   * Steps the model forward by dt seconds.
   * Called every animation frame by the Sim framework.
   *
   * @param _dt - elapsed time in seconds since the last frame
   */
  public step(_dt: number): void {
    // Phase 3: advance animated Euler steps when playing.
  }

  /** Release owned Properties / composed models. */
  public dispose(): void {
    // No resources yet.
  }
}
