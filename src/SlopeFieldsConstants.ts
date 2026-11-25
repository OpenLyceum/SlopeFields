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

// ── Growth Models screen ──────────────────────────────────────────────────────

/** Main y-vs-t plot height (shorter to leave room for the phase line). */
export const GROWTH_MAIN_PLOT_HEIGHT = 250;

/** Phase-line plot height (f(y) vs y). */
export const GROWTH_PHASE_PLOT_HEIGHT = 110;

/**
 * Extra room below y = 0 on logistic / harvesting / cooling windows so the y₀
 * handle and the "0 (unstable)" equilibrium label stay clear of the t-axis ticks.
 */
export const GROWTH_Y_BELOW_ZERO = 0.55;

/** Plot-handle radius used when offsetting the Euler next-step tangent (pixels). */
export const HANDLE_RADIUS_PX = 8;

/** RK4 samples for harvesting: h = tMax / GROWTH_RK4_DIVISOR. */
export const GROWTH_RK4_DIVISOR = 600;

/** Cap when searching past tMax for a harvesting extinction time. */
export const GROWTH_EXTINCTION_TIME_CAP = 200;

/** Faint autonomous direction field on the Growth Models plot. */
export const GROWTH_FIELD_DENSITY = 13;
export const GROWTH_FIELD_SCALE = 0.5;

/** Number of flow arrowheads along the phase-line y-axis. */
export const GROWTH_PHASE_ARROW_COUNT = 10;

/** One numeric parameter's default value and slider range. */
type GrowthParamSpec = {
  readonly value: number;
  readonly min: number;
  readonly max: number;
  readonly step: number;
};

/** Full default bag restored when switching growth models. */
export type GrowthParamDefaults = {
  readonly r: GrowthParamSpec;
  readonly K: GrowthParamSpec;
  readonly ambient: GrowthParamSpec;
  readonly harvest: GrowthParamSpec;
  readonly y0: GrowthParamSpec;
  readonly tMax: GrowthParamSpec;
};

/** Shared logistic-like K / ambient / harvest placeholders for models that omit them. */
const UNUSED_K: GrowthParamSpec = { value: 10, min: 2, max: 20, step: 0.5 };
const UNUSED_AMBIENT: GrowthParamSpec = { value: 20, min: 0, max: 40, step: 1 };
const UNUSED_HARVEST: GrowthParamSpec = { value: 0, min: 0, max: 5, step: 0.1 };

export const EXPONENTIAL_DEFAULTS: GrowthParamDefaults = {
  r: { value: 0.3, min: -1, max: 1, step: 0.05 },
  K: UNUSED_K,
  ambient: UNUSED_AMBIENT,
  harvest: UNUSED_HARVEST,
  y0: { value: 1, min: 0, max: 10, step: 0.1 },
  tMax: { value: 10, min: 0, max: 10, step: 0.5 },
};

export const COOLING_DEFAULTS: GrowthParamDefaults = {
  r: { value: 0.3, min: 0.05, max: 1, step: 0.05 },
  K: UNUSED_K,
  ambient: { value: 20, min: 0, max: 40, step: 1 },
  harvest: UNUSED_HARVEST,
  y0: { value: 90, min: 0, max: 100, step: 1 },
  tMax: { value: 20, min: 0, max: 20, step: 0.5 },
};

export const LOGISTIC_DEFAULTS: GrowthParamDefaults = {
  r: { value: 0.8, min: 0.1, max: 2, step: 0.05 },
  K: { value: 10, min: 2, max: 20, step: 0.5 },
  ambient: UNUSED_AMBIENT,
  harvest: UNUSED_HARVEST,
  y0: { value: 1, min: 0, max: 25, step: 0.5 },
  tMax: { value: 15, min: 0, max: 15, step: 0.5 },
};

export const HARVESTING_DEFAULTS: GrowthParamDefaults = {
  r: { value: 0.8, min: 0.1, max: 2, step: 0.05 },
  K: { value: 10, min: 2, max: 20, step: 0.5 },
  ambient: UNUSED_AMBIENT,
  harvest: { value: 1, min: 0, max: 5, step: 0.1 },
  y0: { value: 8, min: 0, max: 25, step: 0.5 },
  tMax: { value: 15, min: 0, max: 15, step: 0.5 },
};

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
  GROWTH_MAIN_PLOT_HEIGHT,
  GROWTH_PHASE_PLOT_HEIGHT,
  GROWTH_Y_BELOW_ZERO,
  HANDLE_RADIUS_PX,
  GROWTH_RK4_DIVISOR,
  GROWTH_EXTINCTION_TIME_CAP,
  GROWTH_FIELD_DENSITY,
  GROWTH_FIELD_SCALE,
  GROWTH_PHASE_ARROW_COUNT,
  EXPONENTIAL_DEFAULTS,
  COOLING_DEFAULTS,
  LOGISTIC_DEFAULTS,
  HARVESTING_DEFAULTS,
});
