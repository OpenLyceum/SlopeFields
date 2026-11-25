/**
 * SlopeFieldsConstants.ts
 *
 * Central repository for every named numeric constant used across the
 * simulation. Bare numbers that carry semantic meaning (sizes, margins,
 * physics defaults, ranges) belong here rather than inline in model or view
 * code, so they are named, documented, and changed in one place.
 *
 * Conventions
 * ───────────
 *  - Physics / model values use SI units (metres, seconds, kilograms, …);
 *    note the unit in a comment on each value.
 *  - Layout / chrome values are in screen pixels.
 *  - Colour strings live in SlopeFieldsColors.ts, not here.
 *  - Computed expressions (e.g. `2 * Math.PI`) may stay inline.
 *
 * Remove the example constants below and replace them with the sim's own.
 */

import { Range, Vector2 } from "scenerystack/dot";
import SlopeFieldsNamespace from "./SlopeFieldsNamespace.js";

// ── Layout / chrome (screen pixels) ───────────────────────────────────────────

/** Margin between the screen edge and edge-anchored controls (e.g. Reset All). */
export const SCREEN_VIEW_MARGIN = 20;

/**
 * Corner radius shared by control panels and dialogs.
 * @public
 */
export const PANEL_CORNER_RADIUS = 6;

/**
 * Shared lesson scaffold: plot left, panel right, notes under the plot.
 * Copied from the Calculus I sims (Limit Explorer and others) — keep in sync.
 */
export const LAYOUT = {
  inset: 32,
  gap: 24,
  plotWidth: 610,
  plotHeight: 360,
  panelWidth: 320,
  panelHeight: 480,
  top: 107,
  notesGap: 14,
};

// ── Slope Field screen ────────────────────────────────────────────────────────

/** Default initial condition (x₀, y₀) for the Slope Field screen. */
export const INITIAL_POINT_DEFAULT = new Vector2(0, 0.5);

/** Keyboard / nudge step for the initial-point handle (model units). */
export const INITIAL_POINT_STEP = 0.1;

/** Arrows per row on the slope-field grid (odd integers 9…31). */
export const DENSITY_RANGE = new Range(9, 31);
export const DENSITY_DEFAULT = 21;

/** Segment length as a fraction of the grid cell size. */
export const SEGMENT_SCALE_RANGE = new Range(0.3, 1);
export const SEGMENT_SCALE_DEFAULT = 0.7;

/** Isocline level-set slope c. */
export const ISOCLINE_SLOPE_RANGE = new Range(-3, 3);
export const ISOCLINE_SLOPE_DEFAULT = 0;

/** Maximum number of pinned solution curves on the Slope Field screen. */
export const MAX_PINNED_CURVES = 6;

/** |f| above this draws a vertical-ish field segment instead of normalizing (1, f). */
export const HUGE_SLOPE = 1e3;

// ── Euler's Method screen ─────────────────────────────────────────────────────

/** Step size h for Euler / Heun / RK4. */
export const STEP_SIZE_RANGE = new Range(0.05, 1);
export const STEP_SIZE_DEFAULT = 0.2;

/**
 * Preset step sizes shown as radio buttons (largest → smallest). Each is half the
 * previous one, so "Halve h" always lands on a preset and a button stays selected.
 */
export const STEP_SIZE_PRESETS = [0.8, 0.4, 0.2, 0.1, 0.05] as const;

/** Real-time seconds between automatic Euler steps while playing. */
export const PLAY_STEP_INTERVAL = 0.4;

/** Minimum gap xEnd − x0. */
export const X_END_MIN_GAP = 0.5;

/** Keyboard nudge for the xEnd handle. */
export const X_END_STEP = 0.1;

/** Faint slope-field density / scale on the Euler plot. */
export const EULER_FIELD_DENSITY = 15;
export const EULER_FIELD_SCALE = 0.55;

SlopeFieldsNamespace.register("SlopeFieldsConstants", {
  SCREEN_VIEW_MARGIN,
  PANEL_CORNER_RADIUS,
  LAYOUT,
  INITIAL_POINT_DEFAULT,
  INITIAL_POINT_STEP,
  DENSITY_RANGE,
  DENSITY_DEFAULT,
  SEGMENT_SCALE_RANGE,
  SEGMENT_SCALE_DEFAULT,
  ISOCLINE_SLOPE_RANGE,
  ISOCLINE_SLOPE_DEFAULT,
  MAX_PINNED_CURVES,
  HUGE_SLOPE,
  STEP_SIZE_RANGE,
  STEP_SIZE_DEFAULT,
  STEP_SIZE_PRESETS,
  PLAY_STEP_INTERVAL,
  X_END_MIN_GAP,
  X_END_STEP,
  EULER_FIELD_DENSITY,
  EULER_FIELD_SCALE,
});
